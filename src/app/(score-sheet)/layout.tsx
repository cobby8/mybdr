/**
 * 종이 기록지 (score-sheet) route group — minimal layout.
 *
 * 2026-05-11 — Phase 1 신규 (planner-architect §B §URL / §E-4).
 *
 * 왜 (이유):
 *   사이트 AppNav (메인 9 탭 / utility bar / 햄버거 등) 는 운영자가 매치 입력
 *   집중에 방해. FIBA SCORESHEET 양식 = 1 페이지 풀폭 박제이므로 풀스크린 가용
 *   영역 최대화 필요. (web) 와 격리된 별도 route group 으로 minimal layout 제공.
 *
 * 방법 (어떻게):
 *   - 상단 thin bar (44px 미만) — "← 매치 관리로" 링크 + 다크모드 토글만
 *   - 본문 = RotationGuard 안 — 태블릿 가로 진입 시 회전 안내
 *   - URL 영향 0 (route group 은 URL 미반영) — admin link 그대로 `/score-sheet/{id}`
 *   - 데이터 fetch / API 변경 0 (Phase 1 = UI 만)
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - AppNav frozen 영향 0 (route group 격리 — 9 탭/햄버거 호출 0)
 */

import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ToastProvider } from "@/contexts/toast-context";
import { RotationGuard } from "./_components/rotation-guard";

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
        {/* 상단 thin bar — "← 매치 관리로" 좌상단 + 다크모드 토글 우상단 */}
        <header
          className="flex items-center justify-between px-3 py-1.5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          {/* 좌측: 운영자가 다시 매치 관리 화면 으로 돌아갈 진입점.
              매치별 tournament id 가 layout 단에서 알 수 없으므로 admin 진입 페이지 (/admin) 로 안내.
              새 탭 진입 (target=_blank) 권장 — 본 페이지는 그대로 두고 매치 관리 페이지 별도 열기 */}
          <Link
            href="/admin"
            className="text-xs hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            ← 매치 관리로
          </Link>

          {/* 우측: 다크모드 토글 (사이트 헤더 ThemeToggle 재사용 — 단일 패턴) */}
          <ThemeToggle />
        </header>

        {/* 본문 = 풀스크린 (44px header 제외 viewport) */}
        <RotationGuard>{children}</RotationGuard>
      </div>
    </ToastProvider>
  );
}
