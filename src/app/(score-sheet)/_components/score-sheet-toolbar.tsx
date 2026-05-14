/**
 * ScoreSheetToolbar — Phase 19 PR-S2 (2026-05-14).
 *
 * 왜 (이유):
 *   BDR v2.5 시안 (Dev/design/BDR-current/screens/ScoreSheet.jsx L1-83 / scoresheet.css L41-92) 의
 *   .ss-toolbar 시각 박제. 운영 기존 thin bar 의 "← 매치 관리로" Link + PrintButton +
 *   frame 하단 MatchEndButton 큰 버튼을 시안 단일 toolbar 로 시각 통합.
 *
 * 핵심 룰 (사용자 결재 Phase 19):
 *   - **운영 함수 호출 100% 보존** — 시각 위치만 통합. onClick 동작 = 기존 PrintButton.window.print() /
 *     MatchEndButton confirm modal trigger / Link "/admin" 그대로 prop drilling.
 *   - **D3** — 토큰은 `_score-sheet-tokens.css` 의 .ss-shell 스코프 (PR-S1 박제 완료) 사용.
 *     본 컴포넌트는 wrapper 에 `ss-shell` className 부착하여 토큰 활성화.
 *   - **D5** — toolbar "경기 종료" 버튼 = 기존 MatchEndButton 의 confirm modal + BFF submit 흐름
 *     100% 호출 (controlled `open` props 패턴).
 *   - **D6** — toolbar max-width: 794px (시안 그대로) — A4 페이퍼 정합 / 모바일 가로 스크롤.
 *   - **no-print** — 인쇄 시 toolbar 전체 hidden (FIBA 종이 정합).
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ (단 "경기 종료" 버튼 = --ss-paper-accent (=BDR Red) 배경 = 위험 액션 예외)
 *   - 터치 영역 36px (시안 그대로 / toolbar 컴팩트)
 *
 * Props:
 *   gameNo        — 타이틀 "SCORESHEET · #{gameNo}" 표시 (없으면 "#" 만)
 *   mode          — 'paper' | 'detail' — 모드 토글 active 상태
 *   onModeChange  — 모드 변경 콜백 (PR-S3 에서 RunningScoreGrid wiring)
 *   onPrint       — 인쇄 trigger (기존 PrintButton.window.print() 와 동일 동작 위임)
 *   onEndMatch    — 경기 종료 trigger (MatchEndButton 의 setOpen(true) 와 동일 동작 위임)
 *   backHref      — "← 메인" 링크 (기본 "/admin" — 운영 thin bar 의 ← 매치 관리로와 동일)
 */

"use client";

import Link from "next/link";

interface ScoreSheetToolbarProps {
  gameNo?: number | string | null;
  mode: "paper" | "detail";
  onModeChange: (mode: "paper" | "detail") => void;
  onPrint: () => void;
  onEndMatch: () => void;
  backHref?: string;
}

export function ScoreSheetToolbar({
  gameNo,
  mode,
  onModeChange,
  onPrint,
  onEndMatch,
  backHref = "/admin",
}: ScoreSheetToolbarProps) {
  // 타이틀 표시: gameNo 가 있으면 "SCORESHEET · #{gameNo}" / 없으면 "SCORESHEET · #" 만
  // 이유: 시안 마크업 그대로 + 운영 데이터 (match.match_code ?? match.id) 자연 표시
  const titleSuffix =
    gameNo !== null && gameNo !== undefined && String(gameNo).trim() !== ""
      ? `#${gameNo}`
      : "#";

  return (
    // ss-shell = PR-S1 토큰 활성화 (--ss-paper-accent 등 .ss-toolbar__finish 색 정합)
    // no-print = 인쇄 시 toolbar 전체 hidden (FIBA 종이 정합)
    <div className="ss-shell no-print">
      <div className="ss-toolbar">
        {/* 좌측 — "← 메인" 링크 (기존 thin bar 의 ← 매치 관리로와 동일 href) */}
        <Link href={backHref} className="ss-toolbar__back">
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          메인
        </Link>

        {/* 중앙 — "SCORESHEET · #{gameNo}" 타이틀 (시안 mono 폰트) */}
        <div className="ss-toolbar__title">SCORESHEET · {titleSuffix}</div>

        {/* 모드 토글 — paper / detail (PR-S3 wiring 예정) */}
        <div className="ss-toolbar__seg" role="tablist" aria-label="기록 모드 선택">
          <button
            type="button"
            role="tab"
            data-active={mode === "paper"}
            aria-selected={mode === "paper"}
            onClick={() => onModeChange("paper")}
          >
            페이퍼 정합 (A|B · 8)
          </button>
          <button
            type="button"
            role="tab"
            data-active={mode === "detail"}
            aria-selected={mode === "detail"}
            onClick={() => onModeChange("detail")}
          >
            상세 마킹 (16)
          </button>
        </div>

        {/* 인쇄 — 기존 PrintButton.window.print() 위임 */}
        <button
          type="button"
          className="ss-toolbar__print"
          onClick={onPrint}
          aria-label="FIBA 양식 인쇄 / PDF 저장"
          title="인쇄 / PDF 저장"
        >
          <span className="material-symbols-outlined" aria-hidden>
            print
          </span>
          인쇄
        </button>

        {/* 경기 종료 — 기존 MatchEndButton 의 setOpen(true) 위임 (confirm modal + BFF submit) */}
        <button
          type="button"
          className="ss-toolbar__finish"
          onClick={onEndMatch}
          aria-label="경기 종료"
        >
          <span className="material-symbols-outlined" aria-hidden>
            flag
          </span>
          경기 종료
        </button>
      </div>
    </div>
  );
}
