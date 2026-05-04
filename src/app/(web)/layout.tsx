// 2026-05-04 P4 fix: server component 로 전환.
//   왜: 기존 "use client" 에서 useEffect 로 /api/web/me fetch → SSR 시 user=null → 첫 paint 가 비로그인 헤더 노출.
//       운영 사용자 신고 — 로그아웃 화면 + 로그인 메뉴 잠깐 노출 (hydration 전).
//   어떻게: layout 자체는 server 로 전환하고, getWebSession() 결과를 initialUser 로 client 자식에 prop 주입.
//          기존 client 상태/폴링/이벤트 로직은 WebLayoutInner (client) 로 분리.
import { getWebSession } from "@/lib/auth/web-session";
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
//   - SSR 시점에 getWebSession() 으로 세션 read → 비로그인이면 initialUser=null,
//     로그인 사용자면 DB 에서 nickname/role/is_referee 를 SELECT (한 번 — useEffect 첫 fetch 대체).
//   - 결과를 client (WebLayoutInner) 에 prop 주입 → AppNav 가 첫 paint 부터 정확한 상태 표시.
//   - 보안 속성 보존: cookies 는 getWebSession() 내부에서 httpOnly 쿠키 read (기존 그대로).
//   - 기존 폴링/이벤트 (alert 30s / nav-badges 60s) 는 client 에 보존 (실시간성 필요).
export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const session = await getWebSession();

  // 초기 user prop — 비로그인이면 null
  let initialUser: AppNavUser | null = null;
  if (session) {
    // me route 와 동일한 select 룰: nickname (ground truth) / role / referee 매칭 여부
    // 이유(왜): JWT name 은 발급 시점 박힘 → DB nickname 우선 (2026-04-30 회귀 픽스 동일).
    // 어떻게: SELECT 만 (캐시·운영 영향 0). 비로그인 사용자는 0 쿼리 — DB 부담 0.
    try {
      const userId = BigInt(session.sub);
      const [user, referee] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { nickname: true, status: true },
        }),
        prisma.referee.findFirst({
          where: { user_id: userId },
          select: { id: true },
        }),
      ]);
      // 2026-05-05 fix: 탈퇴 회원 (status="withdrawn") 은 비로그인으로 처리.
      //   왜: 사용자 신고 — 탈퇴 후 새로고침 시 헤더에 "탈퇴회원_3369" 익명화 닉네임 노출.
      //   본질: layout SSR 가 status 검증 없이 nickname 그대로 사용 + 브라우저 쿠키 잔존 시
      //         탈퇴 회원의 익명화 닉네임이 헤더에 표시.
      //   fix: user.status === "withdrawn" 시 initialUser=null (비로그인 표시).
      //   추가 보안: /profile/layout.tsx 의 가드도 status 검증 추가 (탈퇴 회원 → /login redirect).
      if (user && user.status !== "withdrawn") {
        initialUser = {
          name: user.nickname ?? session.name ?? "사용자",
          role: session.role ?? "user",
          is_referee: !!referee,
        };
      }
      // user 없거나 탈퇴 회원이면 initialUser 는 null 유지 (비로그인 헤더)
    } catch {
      // SSR DB 실패 시에도 헤더 렌더는 보장 — JWT session 만으로 폴백
      initialUser = {
        name: session.name ?? "사용자",
        role: session.role ?? "user",
        is_referee: false,
      };
    }
  }

  return <WebLayoutInner initialUser={initialUser}>{children}</WebLayoutInner>;
}
