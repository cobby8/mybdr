// 2026-05-04 P4 fix: server component 로 전환.
//   왜: 기존 "use client" 에서 useEffect 로 /api/web/me fetch → SSR 시 user=null → 첫 paint 가 비로그인 헤더 노출.
//       운영 사용자 신고 — 로그아웃 화면 + 로그인 메뉴 잠깐 노출 (hydration 전).
//   어떻게: layout 자체는 server 로 전환하고, getWebSession() 결과를 initialUser 로 client 자식에 prop 주입.
//          기존 client 상태/폴링/이벤트 로직은 WebLayoutInner (client) 로 분리.
//
// 2026-05-05 fix (옵션 B-PR1): getAuthUser() 단일 헬퍼 위임.
//   왜: 가드 5개소 분산 → 신규 가드 추가 시 같은 패턴 반복 + 누락 회귀 (errors.md 2026-05-05).
//       탈퇴 회원 쿠키 잔존 시 매번 layout 가드에 의존 → 1회 진입으로 영구 제거 필요.
//   어떻게: getAuthUser() = JWT verify + DB SELECT + status 분기 + 쿠키 자동 cleanup 단일 함수.
//          React.cache 로 동일 요청 내 dedup → DB 부담 0 (4 layout 동시 호출해도 1회).
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { WebLayoutInner } from "./_layout/web-layout-inner";
import type { AppNavUser } from "@/components/bdr-v2/app-nav";

// 2026-05-05 fix: force-dynamic — 로그인 직후 헤더 SSR 가 세션 미인지 (캐시) 문제 해결.
//   본질: cookies() 사용 시 자동 dynamic 인식되지만 일부 케이스 (revalidatePath 후 SSR) 에서
//         캐시된 비로그인 결과 표시. 사용자 신고 — "가입완료 후 로그인했는데 비로그인 화면".
//   fix: 명시적 force-dynamic 으로 layout SSR 매 요청마다 재실행 + 최신 쿠키 인지 보장.
export const dynamic = "force-dynamic";

/* ============================================================
 * WebLayout (BDR v2 전환 후 전면 단순화)
 *
 * 이유(왜):
 *   Phase 0~1에서 v2 토큰/Home 섹션 교체가 완료됐고, PM 확정안에 따라
 *   상단 가로 네비(v2 AppNav) 단일 구조로 전환한다. 기존의 좌측 고정
 *   사이드네비 / 상단 헤더 / 하단 탭 / 우측 사이드바 / PWA 배너 / SlideMenu /
 *   MoreTabTooltip / ProfileCompletionBanner / NotificationBadge 등은
 *   전부 미렌더 처리(파일은 보존).
 *
 *   유지 사항:
 *   - SWRProvider / PreferFilterProvider / ToastProvider
 *   - /api/web/me + /api/web/notifications 폴링 로직 (AppNav 우측 뱃지용)
 *   - 기존 테마 초기 스크립트 (layout 루트 레이아웃에서 처리)
 *   - Footer
 *
 * 방법(어떻게):
 *   - WebLayoutInner: user/unreadCount fetch → AppNav 에 props 전달
 *   - main: 풀폭. 페이지 내부에서 `.page` 또는 `max-w-*` 로 필요 시 제약
 *     (Home 등은 이미 자체 컨테이너 가짐)
 *
 * [2026-04-22] v2 시안 100% 매칭 작업 — 우측 별 아이콘(PreferFilterToggleButton) 제거.
 *   이유: v2 Games/Home 시안에 존재하지 않아 AppNav 가 시안과 불일치.
 *   PreferFilterProvider context 자체는 프로젝트 다른 페이지에서 사용하므로 유지,
 *   AppNav 노출만 제거. usePreferFilter 는 setLoggedIn 훅 호출용으로 여전히 필요.
 * ============================================================ */

// 2026-05-04 P4 fix: server component 진입점.
//   - SSR 시점에 인증 정보 read → 비로그인이면 initialUser=null, 로그인 사용자면 DB nickname/role/is_referee 주입.
//   - 결과를 client (WebLayoutInner) 에 prop 주입 → AppNav 가 첫 paint 부터 정확한 상태 표시.
//   - 기존 폴링/이벤트 (alert 30s / nav-badges 60s) 는 client 에 보존 (실시간성 필요).
//
// 2026-05-05 (옵션 B-PR1): getAuthUser() 단일 헬퍼 위임 — JWT verify + DB SELECT + status 분기
//   + 쿠키 자동 cleanup. state==="active" 일 때만 initialUser 채움. 그 외는 null (비로그인 헤더).
export default async function WebLayout({ children }: { children: React.ReactNode }) {
  // 단일 진입점으로 인증 정보 + 쿠키 cleanup (탈퇴/미존재 시 자동 cleanup).
  // React.cache 로 4 layout 동시 호출해도 DB SELECT 1회.
  const auth = await getAuthUser();

  // 초기 user prop — state==="active" 만 채움. 그 외 (anonymous / withdrawn / missing) 모두 null.
  let initialUser: AppNavUser | null = null;
  if (auth.state === "active" && auth.user && auth.session) {
    // referee 매칭 여부는 별도 SELECT (getAuthUser 는 referee join 안 함 — 책임 분리).
    // 비로그인 (anonymous) 케이스는 본 분기 자체 진입 X → DB 부담 0.
    try {
      const referee = await prisma.referee.findFirst({
        where: { user_id: auth.user.id },
        select: { id: true },
      });
      // 2026-05-05 방어선: nickname=null 시 이메일 prefix → "사용자" fallback (OAuth 신규 가입 케이스 등).
      const fallbackName = auth.session.email ? auth.session.email.split("@")[0] : "사용자";
      initialUser = {
        name: auth.user.nickname ?? auth.session.name ?? fallbackName,
        role: auth.session.role ?? "user",
        is_referee: !!referee,
      };
    } catch {
      // referee SELECT 실패 시에도 헤더 렌더 보장 — auth 정보로 폴백 (referee=false).
      const fallbackName = auth.session.email ? auth.session.email.split("@")[0] : "사용자";
      initialUser = {
        name: auth.user.nickname ?? auth.session.name ?? fallbackName,
        role: auth.session.role ?? "user",
        is_referee: false,
      };
    }
  }
  // anonymous / withdrawn / missing → initialUser=null (비로그인 헤더).
  // withdrawn / missing 은 getAuthUser 내부에서 cookies.delete 자동 호출 — 다음 진입부터 anonymous.

  return <WebLayoutInner initialUser={initialUser}>{children}</WebLayoutInner>;
}
