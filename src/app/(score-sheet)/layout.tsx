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
// 2026-05-15 PR-Live3 — body overflow lock (자동 진입 / cleanup 시 복원).
//   layout = server component 이므로 client effect 는 별도 컴포넌트로 분리 (DOM 0 effect 전용).
import { BodyScrollLock } from "./_components/body-scroll-lock";
// 2026-05-15 PR-Live4 — 풀스크린 명시 toggle 버튼 (태블릿 세로 ±10% viewport 회수).
//   ThemeToggle 옆 thin bar 우상단 배치 (Q5 명시 버튼 룰).
// 2026-05-15 PR-Fullscreen-Clean — 풀스크린 진입 시 thin bar 자동 hidden + 우상단 X
//   noflicker overlay 마운트 책임. ScoreSheetChrome client 컴포넌트로 분리.
import { ScoreSheetChrome } from "./_components/score-sheet-chrome";
import { FullscreenProvider } from "./_components/fullscreen-context";
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

// 2026-05-15 PR-Live3 — viewport meta 갱신 (태블릿 세로 풀스크린 정합).
//   width=device-width + initialScale=1 + viewportFit=cover →
//   iOS Safari notch / 안드로이드 system bar 영역까지 사용 (safe-area-inset 으로 padding 보정 가능).
//   기존 root layout 의 viewport 가 있어도 route group 별 override 가능 (Next.js 14+ App Router 기본 동작).
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

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
      <FullscreenProvider>
        {/* PR-Live3 — body overflow:hidden 자동 lock (cleanup 시 복원). */}
        <BodyScrollLock />
        <div
          className="min-h-screen"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          {/* 2026-05-15 PR-Fullscreen-Clean — header + 우상단 X overlay 책임을
              ScoreSheetChrome client 컴포넌트가 통합. 풀스크린 시 thin bar
              자동 hidden + 우상단 X floating 노출 (양식만 보이도록 정합). */}
          <ScoreSheetChrome>
            {/* RotationGuard = 태블릿 가로 시 회전 안내 */}
            <RotationGuard>{children}</RotationGuard>
          </ScoreSheetChrome>
        </div>
      </FullscreenProvider>
    </ToastProvider>
  );
}
