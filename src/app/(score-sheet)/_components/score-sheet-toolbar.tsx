/**
 * ScoreSheetToolbar — Phase 19 PR-S2 (2026-05-14) + PR-S6 (rev2 롤백 2026-05-14).
 *
 * 왜 (이유):
 *   BDR v2.5 시안 rev2 (Dev/design/BDR-current/screens/ScoreSheet.jsx) — 사용자 fine-tuning 결정에서
 *   모드 토글 (paper/detail segment) 제거 + 단일 모드 통일. PR-S6 = PR-S2/S3 의 mode 분기 박제 부분만
 *   부분 롤백. toolbar 의 다른 영역 (back / 인쇄 / 경기 종료 / 타이틀) = PR-S2 유지.
 *
 * 핵심 룰 (보존 의무):
 *   - **운영 함수 호출 100% 보존** — onPrint / onEndMatch / backHref / gameNo 그대로.
 *   - **MatchEndButton controlled props 패턴** — onEndMatch trigger / endMatchDisabled 시각 분기 그대로.
 *   - **D3** — 토큰은 `_score-sheet-tokens.css` 의 .ss-shell 스코프 (PR-S7 에서 --pap-* 로 rename).
 *   - **D6** — toolbar max-width: 794px (시안 rev2 그대로) — A4 페이퍼 정합.
 *   - **no-print** — 인쇄 시 toolbar 전체 hidden (FIBA 종이 정합).
 *
 * Props (rev2):
 *   gameNo         — 타이틀 "SCORESHEET · #{gameNo}" 표시 (없으면 "#" 만)
 *   onPrint        — 인쇄 trigger (기존 PrintButton.window.print() 와 동일 동작 위임)
 *   onEndMatch     — 경기 종료 trigger (MatchEndButton 의 setOpen(true) 와 동일 동작 위임)
 *   backHref       — "← 메인" 링크 (기본 "/admin")
 *   endMatchDisabled — 종료 후 toolbar 버튼 disabled 시각 분기 (PR-S2 후속 fix 3 / 유지)
 */

"use client";

import Link from "next/link";

interface ScoreSheetToolbarProps {
  gameNo?: number | string | null;
  onPrint: () => void;
  onEndMatch: () => void;
  backHref?: string;
  // PR-S2 후속 fix 3 (2026-05-14) — "경기 종료" 버튼 disabled 분기 (유지).
  //   왜: 종료 후 (MatchEndButton.submitted=true) toolbar 버튼이 시각적으로 활성 잔존 →
  //   운영자 혼란. MatchEndButton 의 onSubmittedChange 콜백을 form 이 받아 본 prop 으로 전달.
  endMatchDisabled?: boolean;
  // Phase 23 PR-RO3 (2026-05-15) — 종료 매치 진입 시 경기 종료 버튼 hidden (사용자 결재 Q2).
  //   왜: 이미 종료된 매치 = 종료 버튼 자체 노출 0 (인쇄 / ← 메인 / 다크모드만 활성).
  //   호출자 미전달 시 동작 변경 0 (운영 보존).
  hideEndMatch?: boolean;
}

export function ScoreSheetToolbar({
  gameNo,
  onPrint,
  onEndMatch,
  backHref = "/admin",
  endMatchDisabled,
  hideEndMatch, // Phase 23 PR-RO3 (2026-05-15) — 종료 매치 진입 시 버튼 숨김 (사용자 결재 Q2)
}: ScoreSheetToolbarProps) {
  // 타이틀 표시: gameNo 가 있으면 "SCORESHEET · #{gameNo}" / 없으면 "SCORESHEET · #" 만
  const titleSuffix =
    gameNo !== null && gameNo !== undefined && String(gameNo).trim() !== ""
      ? `#${gameNo}`
      : "#";

  return (
    // ss-shell = 토큰 활성화 / no-print = 인쇄 시 toolbar 전체 hidden
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

        {/* 경기 종료 — 기존 MatchEndButton 의 setOpen(true) 위임 (confirm modal + BFF submit).
            endMatchDisabled prop = 종료 후 시각 disabled 분기 (PR-S2 후속 fix 3 유지).
            Phase 23 PR-RO3 (2026-05-15) — hideEndMatch=true 시 버튼 자체 렌더 0 (사용자 결재 Q2).
              종료 매치 진입 = 인쇄 / ← 메인 만 노출. 종료 버튼 진입점 차단. */}
        {!hideEndMatch && (
          <button
            type="button"
            className="ss-toolbar__finish"
            onClick={onEndMatch}
            disabled={endMatchDisabled}
            aria-label="경기 종료"
            style={
              endMatchDisabled
                ? { opacity: 0.4, cursor: "not-allowed" }
                : undefined
            }
          >
            <span className="material-symbols-outlined" aria-hidden>
              flag
            </span>
            경기 종료
          </button>
        )}
      </div>
    </div>
  );
}
