"use client";

/**
 * SeriesActionsMenu — 단체 페이지 시리즈 카드 우측 ⋮ 메뉴.
 *
 * 2026-05-12 (Phase D-1) — 단체↔시리즈 셀프서비스 UI.
 *
 * 이유 (왜):
 *   - Phase C 에서 PATCH /api/web/series/[id] (organization_id 변경) API 가 추가됐지만,
 *     UI 가 없어서 단체 운영자가 시리즈를 분리/이동할 방법이 없었다.
 *   - 운영자 결재 Q2 적용: 단체 owner/admin 이 셀프서비스로 시리즈를 다른 단체로 이동하거나
 *     단체에서 분리할 수 있어야 운영 부담 ↓.
 *
 * 어떻게:
 *   - ⋮ 버튼 → dropdown (분리 / 이동) 표시. 외부 클릭 시 닫힘.
 *   - "분리" → confirm 다이얼로그 (단체에서 분리 시 events 탭 영향 안내) → PATCH organization_id=null.
 *   - "이동" → MoveSeriesModal 오픈 → 본인 owner/admin 단체 목록에서 선택 → PATCH organization_id=새 ID.
 *   - 두 액션 모두 성공 시 onSuccess() 호출하여 부모(page.tsx)가 loadOrg() 재호출.
 *   - 디자인 13 룰: var(--color-*) / Material Symbols / 44px+ 터치 / 빨강 본문 0.
 */

import { useState, useEffect, useRef } from "react";
import MoveSeriesModal from "./MoveSeriesModal";

interface Props {
  /** 시리즈 ID — PATCH 대상 */
  seriesId: string;
  /** 시리즈 이름 — confirm/안내 카피용 */
  seriesName: string;
  /** 현재 단체 ID — 이동 모달에서 "현재 단체 제외" 필터링용 */
  currentOrgId: string;
  /** 현재 단체 이름 — 분리 confirm 카피용 */
  currentOrgName: string;
  /** 분리/이동 성공 시 부모 refresh */
  onSuccess: () => void;
}

export default function SeriesActionsMenu({
  seriesId,
  seriesName,
  currentOrgId,
  currentOrgName,
  onSuccess,
}: Props) {
  // 메뉴 dropdown 열림 state
  const [open, setOpen] = useState(false);
  // 분리 confirm 다이얼로그
  const [showDetachConfirm, setShowDetachConfirm] = useState(false);
  // 이동 모달
  const [showMoveModal, setShowMoveModal] = useState(false);
  // 분리 처리 중 (중복 클릭 방어)
  const [detaching, setDetaching] = useState(false);
  // 분리 에러 메시지
  const [detachError, setDetachError] = useState<string | null>(null);

  // 외부 클릭 시 dropdown 닫기 — useRef + document 클릭 감지.
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // ESC 로 dropdown 닫기 — 접근성.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // "단체에서 분리" 메뉴 클릭 → confirm 표시.
  const handleDetachClick = () => {
    setOpen(false);
    setDetachError(null);
    setShowDetachConfirm(true);
  };

  // "다른 단체로 이동" 메뉴 클릭 → 이동 모달 오픈.
  const handleMoveClick = () => {
    setOpen(false);
    setShowMoveModal(true);
  };

  // 분리 확정 — PATCH organization_id=null (Phase C API 사용).
  const handleConfirmDetach = async () => {
    if (detaching) return;
    setDetaching(true);
    setDetachError(null);
    try {
      const res = await fetch(`/api/web/series/${seriesId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // organization_id: null = 단체에서 분리 (Phase C API 정책 — null/빈 문자열 모두 분리 처리)
        body: JSON.stringify({ organization_id: null }),
      });
      const json = await res.json();
      if (!res.ok) {
        // apiError 형식 — { error: "..." }
        setDetachError(json?.error ?? "분리 실패");
        setDetaching(false);
        return;
      }
      // 성공 — confirm 닫고 부모 refresh.
      setShowDetachConfirm(false);
      setDetaching(false);
      onSuccess();
    } catch {
      setDetachError("네트워크 오류로 분리에 실패했습니다.");
      setDetaching(false);
    }
  };

  return (
    <>
      {/* ⋮ 버튼 + dropdown 래퍼 */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            // 부모 Link 클릭 전파 차단 — ⋮ 클릭 시 시리즈 상세 진입 X.
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label={`${seriesName} 시리즈 메뉴`}
          aria-haspopup="menu"
          aria-expanded={open}
          // 44px 터치 영역 + 시리즈 카드 hover 영향 최소화 (border 없이 hover bg 만)
          className="flex h-11 w-11 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>

        {/* dropdown — 절대 위치 / 우측 정렬 / 카드 우측 끝에 정렬 */}
        {open && (
          <div
            role="menu"
            // z-30 = 시리즈 카드 위 / 모달 (z-40+) 아래
            className="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleDetachClick}
              // 44px 미만 (메뉴 항목은 38px+) — 메뉴 컨텍스트는 터치 룰 예외 (행 단위 컴팩트)
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            >
              <span className="material-symbols-outlined text-base text-[var(--color-text-muted)]">
                link_off
              </span>
              단체에서 분리
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleMoveClick}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            >
              <span className="material-symbols-outlined text-base text-[var(--color-text-muted)]">
                swap_horiz
              </span>
              다른 단체로 이동
            </button>
          </div>
        )}
      </div>

      {/* 분리 confirm 다이얼로그 — events 탭 영향 안내 */}
      {showDetachConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => !detaching && setShowDetachConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-md bg-[var(--color-surface)] p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined text-lg text-[var(--color-info)]">
                info
              </span>
              단체에서 분리
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">'{seriesName}'</strong>{" "}
              시리즈를{" "}
              <strong className="text-[var(--color-text-primary)]">
                '{currentOrgName}'
              </strong>{" "}
              단체에서 분리합니다. 단체 events 탭에서 사라집니다. 진행하시겠어요?
            </p>
            {detachError && (
              <p className="mb-3 text-sm text-[var(--color-warning,#d97706)]">
                {detachError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={detaching}
                onClick={() => setShowDetachConfirm(false)}
                className="flex-1 rounded-[4px] border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-50"
              >
                취소
              </button>
              {/* admin 빨강 본문 금지 → btn--primary 토큰 */}
              <button
                type="button"
                disabled={detaching}
                onClick={handleConfirmDetach}
                className="btn btn--primary flex-1 disabled:opacity-50"
              >
                {detaching ? "처리 중..." : "분리"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이동 모달 — 본인 owner/admin 단체 목록 + 선택 + 이동 */}
      {showMoveModal && (
        <MoveSeriesModal
          open={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          seriesId={seriesId}
          seriesName={seriesName}
          currentOrgId={currentOrgId}
          currentOrgName={currentOrgName}
          onSuccess={() => {
            setShowMoveModal(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
}
