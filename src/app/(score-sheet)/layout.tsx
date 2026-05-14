/**
 * 종이 기록지 (score-sheet) route group — minimal layout.
 *
 * 2026-05-11 — Phase 1 신규 (planner-architect §B §URL / §E-4).
 * 2026-05-14 — Phase 19 PR-S2 (시안 toolbar 전체 도입):
 *   thin bar 의 "← 매치 관리로" Link + PrintButton 을 score-sheet-form 안 .ss-toolbar 가 흡수.
 *   본 layout 의 thin bar = 우상단 ThemeToggle 만 단순화 (다크모드 토글 = 폼 외부 layout 책임).
 *
 * 왜 (이유):
 *   사이트 AppNav (메인 9 탭 / utility bar / 햄버거 등) 는 운영자가 매치 입력
 *   집중에 방해. FIBA SCORESHEET 양식 = 1 페이지 풀폭 박제이므로 풀스크린 가용
 *   영역 최대화 필요. (web) 와 격리된 별도 route group 으로 minimal layout 제공.
 *
 * 방법 (어떻게):
 *   - 상단 thin bar (44px 미만) — 다크모드 토글만 우상단 (back/print 는 toolbar 가 흡수)
 *   - 본문 = RotationGuard 안 — 태블릿 가로 진입 시 회전 안내
 *   - URL 영향 0 (route group 은 URL 미반영) — admin link 그대로 `/score-sheet/{id}`
 *   - 데이터 fetch / API 변경 0
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - AppNav frozen 영향 0 (route group 격리 — 9 탭/햄버거 호출 0)
 */

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ToastProvider } from "@/contexts/toast-context";
import { RotationGuard } from "./_components/rotation-guard";
// PrintButton 컴포넌트는 삭제하지 않음 (다른 곳 사용 가능 / 향후 복원 대비) — import 만 제거.
// Phase 6 — A4 세로 인쇄 CSS (@media print + 라이트 강제 + 5 영역 정합).
//   본 import 는 score-sheet route group 안에서만 적용 — 기존 globals.css 의 박스스코어
//   A4 가로 @media print 와 스코프 prefix `.score-sheet-print-root` 로 충돌 회피.
import "./_components/_print.css";
// Phase 19 PR-S1 — BDR v2.5 시안 토큰 운영 도입 (2026-05-14).
//   .ss-shell 스코프 격리 — 운영 globals.css 미오염.
//   사용자 결재 D3: 시안 q1~q4 색을 운영 PERIOD_LEGEND hex 로 동기화.
import "./_components/_score-sheet-tokens.css";
// Phase 19 PR-S2 — 시안 toolbar 컴포넌트 스타일 (2026-05-14).
//   .ss-shell 스코프 내 .ss-toolbar* 룰. 토큰 → 컴포넌트 순서 정합.
import "./_components/_score-sheet-styles.css";

export default function ScoreSheetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 이유: Phase 3 — Player Fouls 5반칙 차단 + Team Fouls 5+ FT 자유투 부여 알림에
  //       기존 ToastProvider 재사용. (web) route group 의 ToastProvider 와 격리된
  //       별도 mount (route group `(score-sheet)` 는 자체 layout 필요).
  // 방법: useToast() 훅이 score-sheet 안 client 컴포넌트에서 호출 가능하도록 root wrap.
  return (
    <ToastProvider>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* Phase 19 PR-S2 — thin bar 단순화: 우상단 ThemeToggle 만 유지.
            기존 "← 매치 관리로" Link + PrintButton 은 score-sheet-form 안 .ss-toolbar 가 흡수.
            `no-print` = 인쇄 시 전체 thin bar 숨김 (FIBA 양식 정합) */}
        <header
          className="no-print flex items-center justify-end px-3 py-1.5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <ThemeToggle />
        </header>

        {/* 본문 = 풀스크린 (44px header 제외 viewport) */}
        <RotationGuard>{children}</RotationGuard>
      </div>
    </ToastProvider>
  );
}
