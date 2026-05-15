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

import { useRouter } from "next/navigation";
import { useFullscreen } from "./fullscreen-context";
// 2026-05-15 (PR-SS-Manual-Legend) — PeriodColorLegend 가 설명서 모달로 이동.
//   toolbar 직접 import 불필요 (form 의 handleOpenManual 안에서 사용).

interface ScoreSheetToolbarProps {
  gameNo?: number | string | null;
  onPrint: () => void;
  onEndMatch: () => void;
  // 2026-05-15 (PR-Toolbar-Back) — backHref 제거, router.back() 으로 변경.
  //   사용자 요청 = 경기일정/대진표에서 진입 시 그 페이지로 정확히 복귀 → router.back 가 정합.
  //   기존 backHref 는 호환성 위해 유지 (전달 시 history 없으면 fallback).
  backHref?: string;
  // 2026-05-15 (PR-Record-Cancel-UI) — 기록 취소 trigger (form 에서 confirm modal + API 호출).
  //   미전달 시 버튼 미노출 (점진 박제 안전망).
  onCancelRecord?: () => void;
  // 2026-05-15 (PR-SS-Manual+Reselect) — 라인업 다시 선택 trigger (form 의 setLineupModalOpen(true)).
  //   진행 매치 + 수정 모드 매치에서만 form 이 전달 (종료 매치 차단).
  onReselectLineup?: () => void;
  // 2026-05-15 (PR-SS-Manual+Reselect) — 설명서 (작성법) 모달 trigger.
  //   form 이 ConfirmModal 로 작성법 안내 노출.
  onOpenManual?: () => void;
  // 2026-05-16 (PR-PBP-Edit) — 기록 수정 (PBP 조회/수정) 모달 trigger.
  //   라인업 ↔ 설명서 사이에 박제. 진행 매치 + 수정 모드 매치 = form 이 콜백 전달.
  //   종료 매치 + 수정 모드 미진입 = undefined → 버튼 미노출 (이중 방어).
  onOpenPbpEdit?: () => void;
  // PR-S2 후속 fix 3 (2026-05-14) — "경기 종료" 버튼 disabled 분기 (유지).
  //   왜: 종료 후 (MatchEndButton.submitted=true) toolbar 버튼이 시각적으로 활성 잔존 →
  //   운영자 혼란. MatchEndButton 의 onSubmittedChange 콜백을 form 이 받아 본 prop 으로 전달.
  endMatchDisabled?: boolean;
  // Phase 23 PR-RO3 (2026-05-15) — 종료 매치 진입 시 경기 종료 버튼 hidden (사용자 결재 Q2).
  //   왜: 이미 종료된 매치 = 종료 버튼 자체 노출 0 (인쇄 / ← 메인 / 다크모드만 활성).
  //   호출자 미전달 시 동작 변경 0 (운영 보존).
  hideEndMatch?: boolean;
  // Phase 23 PR-EDIT1 (2026-05-15) — 종료 매치 수정 모드 진입 (사용자 결재 Q3 + Q4).
  //   왜:
  //     hideEndMatch=true (종료 매치) + canEdit=true (super/organizer/TAM) 시
  //     "수정 모드" 버튼 노출 → 클릭 시 onEnterEditMode 콜백 호출 (form 이 confirm modal + setIsEditMode 처리).
  //   추가 룰:
  //     - canEdit=false → 버튼 미노출 (Q4 결재 = recorder 제외).
  //     - isEditMode=true → 버튼이 빨강 indicator 로 시각 변경 (운영자 인지 — 현재 수정 모드).
  //     - 인쇄 / ← 메인 = 항상 활성 (PR-RO3 동일 룰).
  canEdit?: boolean;
  onEnterEditMode?: () => void;
  isEditMode?: boolean;
}

export function ScoreSheetToolbar({
  gameNo,
  onPrint,
  onEndMatch,
  backHref = "/admin",
  onCancelRecord,
  onReselectLineup,
  onOpenManual,
  // 2026-05-16 (PR-PBP-Edit) — 기록 수정 모달 trigger (라인업 ↔ 설명서 사이).
  onOpenPbpEdit,
  endMatchDisabled,
  hideEndMatch, // Phase 23 PR-RO3 (2026-05-15) — 종료 매치 진입 시 버튼 숨김 (사용자 결재 Q2)
  // Phase 23 PR-EDIT1 (2026-05-15) — 수정 모드 props (사용자 결재 Q3 / Q4)
  canEdit,
  onEnterEditMode,
  isEditMode,
}: ScoreSheetToolbarProps) {
  const router = useRouter();
  // 2026-05-15 (PR-Fullscreen-Clean) — 풀스크린 시 toolbar 자체 hidden (양식만 보이도록).
  // 2026-05-16 (PR-Fullscreen-Button) — 라인업 좌측 "전체화면" 텍스트 버튼 박제 (이미지 #132).
  //   chrome.tsx 의 thin bar 가 제거됐으므로 toolbar 에서 전체화면 진입점 제공.
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  // 2026-05-15 (PR-Toolbar-Back) — 뒤로 = router.back() 우선. history 없으면 backHref fallback.
  //   typeof window 가드 = SSR 안전 + history.length === 1 (직접 URL 진입) 케이스 fallback.
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(backHref);
    }
  };
  // 타이틀 표시: gameNo 가 있으면 "SCORESHEET · #{gameNo}" / 없으면 "SCORESHEET · #" 만
  const titleSuffix =
    gameNo !== null && gameNo !== undefined && String(gameNo).trim() !== ""
      ? `#${gameNo}`
      : "#";

  // 풀스크린 모드에선 toolbar 자체 미렌더 (양식만 보이도록 — 사용자 요청).
  if (isFullscreen) return null;

  return (
    // ss-shell = 토큰 활성화 / no-print = 인쇄 시 toolbar 전체 hidden
    <div className="ss-shell no-print">
      <div className="ss-toolbar">
        {/* 좌측 — "<" 뒤로 버튼 (router.back). 2026-05-15 (PR-Toolbar-Back):
            경기일정 / 대진표에서 진입 시 그 페이지로 복귀 (라벨 "메인" 제거). */}
        <button
          type="button"
          onClick={handleBack}
          className="ss-toolbar__back"
          aria-label="뒤로"
          title="이전 페이지로"
        >
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back_ios
          </span>
        </button>

        {/* 2026-05-15 (PR-SS-Manual-Legend) — 색상/점수 안내 = 설명서 모달로 이동.
            toolbar 중앙은 빈 공간 spacer (flex-1) → 우측 버튼들 우측 정렬. */}
        <div className="flex-1" aria-hidden />
        {/* aria 보조 — gameNo 정보 유지 (스크린리더용 hidden) */}
        <span className="sr-only">SCORESHEET · {titleSuffix}</span>

        {/* 2026-05-16 (PR-Fullscreen-Button) — 사용자 보고 이미지 #132 fix.
            라인업 좌측에 "전체화면" 텍스트 버튼 (아이콘 0). useFullscreen.toggle 호출.
            isFullscreen=true 일 때는 위 if (isFullscreen) return null 으로 toolbar 자체 미렌더. */}
        <button
          type="button"
          className="ss-toolbar__print"
          onClick={toggleFullscreen}
          aria-label="전체화면 (태블릿 세로 권장)"
          title="전체화면 (ESC 또는 우상단 X 로 종료)"
        >
          전체화면
        </button>

        {/* 2026-05-15 (PR-SS-Manual+Reselect) — 라인업 다시 선택 (헤더 이동).
            진행 매치 + 수정 모드 매치 = form 이 콜백 전달. 종료 매치 = 미전달 (PR-RO2 룰). */}
        {onReselectLineup && (
          <button
            type="button"
            className="ss-toolbar__print"
            onClick={onReselectLineup}
            aria-label="라인업 다시 선택 (출전 명단 / 선발 5인)"
            title="라인업 다시 선택"
          >
            <span className="material-symbols-outlined" aria-hidden>
              edit
            </span>
            라인업
          </button>
        )}

        {/* 2026-05-16 (PR-PBP-Edit) — 기록 수정 모달 trigger.
            라인업 ↔ 설명서 사이 박제. 진행 매치 + 수정 모드 매치 = form 이 콜백 전달.
            종료 매치 + 수정 모드 미진입 = 미전달 → 버튼 미노출 (PR-RO 룰 정합). */}
        {onOpenPbpEdit && (
          <button
            type="button"
            className="ss-toolbar__print"
            onClick={onOpenPbpEdit}
            aria-label="기록 수정 (PBP 점수/선수/삭제)"
            title="기록 수정 — 점수 / 선수 / 삭제"
          >
            <span className="material-symbols-outlined" aria-hidden>
              edit_note
            </span>
            기록수정
          </button>
        )}

        {/* 2026-05-15 (PR-SS-Manual+Reselect) — 설명서 (작성법) 모달 trigger.
            form 이 ConfirmModal 로 작성법 7항목 안내 노출. */}
        {onOpenManual && (
          <button
            type="button"
            className="ss-toolbar__print"
            onClick={onOpenManual}
            aria-label="전자 기록지 작성법 보기"
            title="전자 기록지 작성법"
          >
            <span className="material-symbols-outlined" aria-hidden>
              help_outline
            </span>
            설명서
          </button>
        )}

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

        {/* 2026-05-15 (PR-Record-Cancel-UI) — 기록 취소 (매치 완전 초기화).
            onCancelRecord 콜백 (form 의 confirm modal + API 호출) 박제 시만 노출.
            warning 색 (admin 룰 본문 빨강 금지 — warning 토큰).
            종료 매치 진입 시 hideEndMatch=true / 수정 모드 진입 후에도 노출 (테스트 회수용). */}
        {onCancelRecord && (
          <button
            type="button"
            className="ss-toolbar__print"
            onClick={onCancelRecord}
            aria-label="기록 취소 — 매치 완전 초기화"
            title="기록 취소 (되돌릴 수 없음)"
            style={{
              color: "var(--color-warning)",
              border: "1px solid var(--color-warning)",
            }}
          >
            <span className="material-symbols-outlined" aria-hidden>
              restart_alt
            </span>
            기록 취소
          </button>
        )}

        {/* 2026-05-15 (PR-SS-51) — 헤더 "경기 종료" 버튼 영구 제거. 사용자 요청:
            경기 종료 단일 진입점 = 하단 쿼터 종료 버튼 → QuarterEndModal (4쿼터 종료 시
            "경기 종료" / "OT 진행" 분기 / OT 종료 시 "OT 추가" / "경기 종료" 분기).
            중복 진입점 제거로 운영자 혼선 차단. onEndMatch prop 은 QuarterEndModal 의
            handleEndMatchFromQuarterEnd 가 호출 (form 내부 그대로). */}

        {/* Phase 23 PR-EDIT1 (2026-05-15) — 종료 매치 수정 모드 버튼 (사용자 결재 Q3 + Q4).
            노출 조건 (3 AND):
              1. hideEndMatch=true (= 종료 매치 — PR-RO3 의 isCompleted prop 일치)
              2. canEdit=true (= super_admin / organizer / TAM — PR-EDIT2 권한 헬퍼 결과)
              3. onEnterEditMode 콜백 박제됨 (= form 이 confirm + setIsEditMode 흐름 박제됨)
            시각 분기:
              - isEditMode=false → outline 노란 (warning) — "수정 모드 진입" 안내
              - isEditMode=true  → 빨강 fill (--color-primary) — "수정 모드 활성 중" indicator
            경기 종료 빨강과 시각 분리 = warning 토큰 사용 (의뢰서 권고). */}
        {hideEndMatch && canEdit && onEnterEditMode && (
          <button
            type="button"
            className="ss-toolbar__finish"
            onClick={onEnterEditMode}
            aria-label={isEditMode ? "수정 모드 활성 중" : "수정 모드 진입"}
            style={
              isEditMode
                ? {
                    // 활성 중 = 빨강 fill (운영자 인지 — 시각 강조).
                    backgroundColor: "var(--color-primary)",
                    color: "#fff",
                    border: "1px solid var(--color-primary)",
                  }
                : {
                    // 미활성 = warning outline (경기 종료 빨강과 시각 분리).
                    backgroundColor: "transparent",
                    color: "var(--color-warning)",
                    border: "1px solid var(--color-warning)",
                  }
            }
          >
            <span className="material-symbols-outlined" aria-hidden>
              {isEditMode ? "edit" : "edit_note"}
            </span>
            {isEditMode ? "수정 모드 활성" : "수정 모드"}
          </button>
        )}
      </div>
    </div>
  );
}
