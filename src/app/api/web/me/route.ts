import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import {
  getAssociationAdmin,
  isExecutive,
  PERMISSIONS,
  type Permission,
} from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

// 세션 확인 + 프로필 이미지 + 심판 매칭 + 관리자 정보 엔드포인트
// 이유: referee-shell에서 메뉴를 역할별로 필터링하려면 admin_info가 필요.
//      별도 호출 대신 기존 /api/web/me 응답에 합쳐서 네트워크 라운드트립을 줄인다.
//
// 2026-05-05 fix (옵션 B): 비로그인 시 200 + null 응답으로 변경 (이전 401 → SWR 폭주 방지).
//   본질: withWebAuth = 비로그인 시 401 → SWR 클라이언트 catch/null fallback 부담.
//   fix: 직접 getWebSession 분기 → 비로그인 = 200 + { id: null } / 로그인 = 정상 응답.
//   호출자 안전성 ↑ — me?.id 단순 null check 만으로 비로그인 판정.
export async function GET() {
  const session = await getWebSession();
  if (!session) {
    return apiSuccess({ id: null });
  }
  const ctx = { userId: BigInt(session.sub), session };
  // 유저 정보 + 심판 매칭 여부 + 관리자 매핑을 병렬로 조회 (waterfall 방지)
  const [user, referee, admin] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        // 헤더 표시명: DB nickname 을 ground truth 로 (2026-04-30 회귀 픽스).
        // 이유: JWT payload.name = nickname 발급시점 박힘 + JWT 만료 7일 → 닉네임 변경해도 헤더가 옛 값.
        // → me route 가 DB 에서 직접 읽으면 JWT stale 해도 헤더 즉시 갱신.
        // 2026-05-05: status 추가 — 탈퇴 회원 (status="withdrawn") 응답 차단용.
        status: true,
        nickname: true,
        profile_image: true,
        profile_image_url: true,
        // 맞춤 보기 토글 상태를 DB에서 직접 읽어옴 (디비전 존재 여부가 아닌 실제 저장값)
        prefer_filter_enabled: true,
        // 숨긴 메뉴 slug 배열 — 사이드/슬라이드 메뉴 필터링에 사용
        hidden_menus: true,
        // 프로필 완성 배너 5단계 판정용 필드 (phone/position/height/profile_completed + 맞춤설정 5종)
        // 이유: 클라이언트가 매번 별도 API 호출하지 않도록 me 응답에 포함
        phone: true,
        position: true,
        height: true,
        profile_completed: true,
        preferred_divisions: true,
        preferred_regions: true,
        preferred_days: true,
        preferred_time_slots: true,
        preferred_skill_levels: true,
        preferred_game_types: true,
      },
    }).catch(() => null),
    // Referee 테이블에서 현재 유저의 매칭 여부 확인 (SELECT id만 — 최소 비용)
    prisma.referee.findFirst({
      where: { user_id: ctx.userId },
      select: { id: true },
    }).catch(() => null),
    // 협회 관리자 매핑 조회 (없으면 null — 비관리자)
    // getAssociationAdmin은 내부적으로 세션 + User.admin_role + AssociationAdmin을 모두 체크
    getAssociationAdmin().catch(() => null),
  ]);

  // 2026-05-05 fix (옵션 A-3): 탈퇴 회원 응답 401 → 200 + {id:null} 통일.
  //   본질: 콘솔 401 노이즈 (사용자 신고) — 탈퇴 회원 쿠키 잔존 시 me 가 401 반환 → 화면 정상이지만 콘솔 GET 표기.
  //   이전 fix (7437d27) 의도 = SWR 클라이언트 비로그인 처리. 그러나 글로벌 fetcher (2284212) 가 401→null
  //   처리하므로 데이터 노출 위험 0. 401 vs 200+null 의 차이는 콘솔 노출 + SWR 분기 부담만.
  //   fix: 200 + { id: null, state: "withdrawn" } 단일 응답 — 비로그인 (200+{id:null}) 와 동일 path.
  //   호환성: 클라이언트 7개 호출처 모두 `if (u && u.id)` 검증 패턴 → id=null 이면 비로그인 처리. 회귀 0.
  //   추가 보안: getAuthUser() (별도 commit) 가 cookies.delete 로 잘못된 쿠키 자동 cleanup.
  if (user && user.status === "withdrawn") {
    return apiSuccess({ id: null, state: "withdrawn" });
  }

  // 관리자인 경우, 현재 role이 속한 모든 permission 키를 추출
  // 이유: 클라이언트가 각 메뉴 항목의 requires 값과 비교하여 가시성을 결정
  let adminInfo:
    | {
        is_admin: true;
        association_id: number;
        role: string;
        is_executive: boolean;
        permissions: Permission[];
      }
    | null = null;

  if (admin) {
    // PERMISSIONS 매트릭스를 역순으로 순회 — 이 role이 속한 키만 뽑아냄
    const permissionKeys = (Object.keys(PERMISSIONS) as Permission[]).filter(
      (key) => PERMISSIONS[key].includes(admin.role)
    );

    adminInfo = {
      is_admin: true,
      // bigint는 JSON 직렬화 불가 → Number로 변환 (협회 id는 안전 범위 내)
      association_id: Number(admin.associationId),
      role: admin.role,
      is_executive: isExecutive(admin.role),
      permissions: permissionKeys,
    };
  }

  return apiSuccess({
    id: ctx.session.sub,
    email: ctx.session.email,
    // DB nickname 우선, 없으면 JWT session.name 폴백 (2026-04-30 회귀 픽스 — 닉네임 변경 즉시 반영)
    name: user?.nickname ?? ctx.session.name,
    role: ctx.session.role,
    profileImage: user?.profile_image_url || user?.profile_image || null,
    // DB에 저장된 실제 토글 상태값을 반환 (false면 OFF, true면 ON)
    prefer_filter_enabled: user?.prefer_filter_enabled ?? false,
    // 숨긴 메뉴 slug 배열 (빈 배열이면 모든 메뉴 표시)
    hidden_menus: (user?.hidden_menus as string[]) ?? [],
    // 심판 플랫폼 바로가기 표시 여부 — Referee 레코드가 user_id로 매칭되어 있으면 true
    is_referee: !!referee,
    // 관리자 정보 — 비관리자는 null. referee-shell에서 admin 메뉴 필터링에 사용
    admin_info: adminInfo,
    // 프로필 완성 배너 5단계 판정용 원본 필드 (snake_case 변환 후 전달)
    // 이유: 프로필 완성 배너가 이 값들로 어느 단계까지 채웠는지 계산
    phone: user?.phone ?? null,
    position: user?.position ?? null,
    height: user?.height ?? null,
    profile_completed: user?.profile_completed ?? false,
    preferred_divisions: (user?.preferred_divisions as unknown) ?? [],
    preferred_regions: (user?.preferred_regions as unknown) ?? [],
    preferred_days: (user?.preferred_days as unknown) ?? [],
    preferred_time_slots: (user?.preferred_time_slots as unknown) ?? [],
    preferred_skill_levels: (user?.preferred_skill_levels as unknown) ?? [],
    preferred_game_types: (user?.preferred_game_types as unknown) ?? [],
  });
}
