// ============================================================
// referee-console/_referee-data.ts — 심판 콘솔 서버 데이터 헬퍼 (R6-B)
//   ★스코프 = 글로벌 super-admin. 레거시 심판 admin 은 association_id 로 협회별
//     필터하지만, 본 콘솔은 super 전역 → 협회 필터 0 (전 협회 통합 READ).
//   - getRefereeAdminContext: 세션 → super 여부 + 표시용 닉네임. (협회 스코프 키 없음)
//   - 표시 헬퍼(snake DB 값 → 표시 도메인 단일 매핑 · snake 함정 차단).
//   ★백엔드/DB/Prisma 0변경 — READ/집계용 select 만. 레거시 0 import.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

// ★순수 표시/포맷 헬퍼는 _referee-format.ts 로 분리(RSC 경계 위반 빌드 블로커 수정).
//   기존 서버측 import(이 모듈에서 가져오던 곳)가 깨지지 않도록 그대로 re-export.
//   (client 컴포넌트는 _referee-format.ts 를 직접 import — server 전용 prisma/세션 비유입.)
export type { Tone } from "./_referee-format";
export {
  AV,
  avColor,
  fmtDate,
  fmtDateTime,
  won,
  n,
  refereeName,
  levelBadge,
  refereeStatus,
  roleTypeLabel,
  regionLabel,
  assignRoleLabel,
  assignStatusBadge,
  matchLabel,
  settleStatusBadge,
  evalStatusBadge,
  certVerifyBadge,
  docTypeLabel,
  ocrStatusBadge,
} from "./_referee-format";

// ★4-2 스코프 — 심판 콘솔 page 들이 협회별 READ 필터를 거는 단일 근거.
//   isSuper(전역) = super_admin OR recorder_admin → associationId=null(전 협회 통합).
//   비-전역 = 협회 admin → associationId = 소속 협회 실 id(자기 협회만).
export type RefereeScope = {
  userId: bigint;
  // 전역 여부 = 전 협회 통합 READ(super_admin/recorder_admin). false 면 협회 admin.
  isSuper: boolean;
  // 전역=null / 협회 admin=소속 협회 id. page 가 association_id 필터에 사용.
  associationId: bigint | null;
};

// ★스코프 판정(4-2 핵심). page·layout 의 협회 스코핑 단일 진입점.
//   순서 절대 준수: ①전역(super+recorder) 먼저 판정 → ②비-전역에서만 getAssociationAdmin 호출.
//   사유: getAssociationAdmin 은 super 에게 sentinel(첫 활성 협회 고정)을 돌려준다.
//         전역을 먼저 가려내지 않으면 super 가 특정 협회로 잘못 스코핑되어
//         (가) 그 협회 데이터만 보이거나(마비) (나) 협회 admin 으로 오인된다 → 누출 위험.
//   무권한(미로그인·비admin·매핑부재) → null(호출부에서 차단/빈렌더).
export async function getRefereeScope(): Promise<RefereeScope | null> {
  const session = await getWebSession();
  if (!session) return null; // 미로그인

  const userId = BigInt(session.sub);

  // ① 전역(super_admin + recorder_admin) — 협회 필터 0, 전 협회 통합 READ.
  //    isRecorderAdmin 이 isSuperAdmin 을 OR 흡수하므로 둘 다 여기서 잡힌다.
  if (isRecorderAdmin(session)) {
    return { userId, isSuper: true, associationId: null };
  }

  // ② 비-전역(협회 admin) — 여기 도달 = super/recorder 아님이 확정된 뒤(sentinel 위험 0).
  //    getAssociationAdmin 이 admin_role==="association_admin" + 매핑 존재까지 검증.
  const admin = await getAssociationAdmin();
  if (!admin) return null; // 무권한
  return { userId, isSuper: false, associationId: admin.associationId };
}

export type RefereeAdminContext = {
  userId: bigint;
  // 전역 여부(셸 UserChip 역할 표기·nav badge 필터 분기에 사용).
  isSuper: boolean;
  // 전역=null / 협회 admin=소속 협회 id.
  associationId: bigint | null;
  name: string; // 셸 UserChip 표시명(닉네임 또는 "관리자")
};

// 세션 → 콘솔 컨텍스트. layout 게이트 + 셸 표시용.
//   ★스코프 판정은 getRefereeScope 단일 source 재사용(전역/협회 일관). null = 무권한 → layout 차단.
export async function getRefereeAdminContext(): Promise<RefereeAdminContext | null> {
  const scope = await getRefereeScope();
  if (!scope) return null;

  // 표시용 닉네임만 조회(권한 판정은 scope 로 끝 — 추가 역할조회 불필요).
  const user = await prisma.user.findUnique({
    where: { id: scope.userId },
    select: { nickname: true },
  });

  return {
    userId: scope.userId,
    isSuper: scope.isSuper,
    associationId: scope.associationId,
    name: user?.nickname || "심판 운영",
  };
}
