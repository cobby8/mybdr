"use client";

/**
 * AbsorbTournamentsModal — 단체 대시보드 시리즈 카드의 "기존 대회 가져오기" 모달.
 *
 * 2026-05-12 — 대회-시리즈 연결 흡수 모달 (PR3) 신규.
 *
 * 이유 (왜):
 *   - 단체 페이지에서 운영자가 자신의 미연결 draft 대회 N건을 한 번에 시리즈에 흡수할 수 있게.
 *   - 단건 wizard 드롭다운 (PR2) 대비 다건 처리 효율 + 단체 events 라인업 한눈에 구성 가능.
 *
 * 어떻게:
 *   - 마운트 시 GET /api/web/tournaments/my-unlinked → 후보 목록 state.
 *   - 체크박스 다건 선택 + "전체 선택" 토글.
 *   - "흡수" 버튼 → confirm 다이얼로그 (단체명 명시) → POST /api/web/series/[id]/absorb-tournaments.
 *   - 응답: { absorbed: [], skipped: [{id, reason}] } — 부분 성공 메시지 표시 후 onSuccess.
 *   - 디자인 13 룰 준수: var(--color-*) / Material Symbols / 핑크코랄 0 / 44px+ 터치.
 */

import { useEffect, useState, useCallback } from "react";

interface UnlinkedTournament {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null; // apiSuccess snake_case 변환 후 키
  edition_number: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  seriesId: string;
  seriesName: string;
  organizationName: string | null;
  /** 흡수 성공 시 부모가 페이지 refresh / 시리즈 카운터 갱신 */
  onSuccess: () => void;
}

// status → 한글 라벨 (UI 표시용 — wizard 가드와 동일 status set).
const STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  registration_open: "접수중",
  registration: "접수중",
};

export default function AbsorbTournamentsModal({
  open,
  onClose,
  seriesId,
  seriesName,
  organizationName,
  onSuccess,
}: Props) {
  const [tournaments, setTournaments] = useState<UnlinkedTournament[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // confirm 단계 분기 — 1단계 선택 / 2단계 confirm 모달.
  const [showConfirm, setShowConfirm] = useState(false);
  // 흡수 결과 메시지 (성공 시 alert 대신 inline 표시 후 onSuccess).
  const [resultMessage, setResultMessage] = useState("");

  // 모달 오픈 시 후보 목록 fetch.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setResultMessage("");
    setSelectedIds(new Set());
    setShowConfirm(false);

    fetch("/api/web/tournaments/my-unlinked")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        // apiSuccess({ data }) 가 한 번 더 래핑 — { data: { data: [...] } } 형태.
        const list: UnlinkedTournament[] = json?.data?.data ?? json?.data ?? [];
        setTournaments(list);
      })
      .catch(() => {
        if (cancelled) return;
        setError("미연결 대회 목록을 불러올 수 없습니다.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // ESC 키로 모달 닫기 — 접근성.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // confirm 모달이 열려있으면 confirm 만 닫기 / 아니면 전체 닫기.
        if (showConfirm) setShowConfirm(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, showConfirm]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      // 전체 선택 상태면 비우고, 아니면 전체 선택.
      if (prev.size === tournaments.length && tournaments.length > 0) {
        return new Set();
      }
      return new Set(tournaments.map((t) => t.id));
    });
  }, [tournaments]);

  // confirm 모달 trigger — 선택 1건 이상이면 confirm 열기.
  const handleAbsorbClick = () => {
    if (selectedIds.size === 0) return;
    setShowConfirm(true);
  };

  // 실제 POST 흡수 — confirm 확정 시 호출.
  const handleConfirmAbsorb = async () => {
    if (selectedIds.size === 0 || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/web/series/${seriesId}/absorb-tournaments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournament_ids: Array.from(selectedIds),
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        // apiError 형식 — { error: "..." }
        setError(json?.error ?? "흡수 실패");
        setShowConfirm(false);
        setSubmitting(false);
        return;
      }
      // 응답 구조: { data: { absorbed: [], skipped: [{id, reason}] } } (snake_case 변환 후도 키 유지).
      const data = json?.data ?? json;
      const absorbedCount = (data.absorbed ?? []).length;
      const skippedList: Array<{ id: string; reason: string }> =
        data.skipped ?? [];

      if (absorbedCount === 0 && skippedList.length > 0) {
        // 전건 skip — 사유 첫 1건만 표기.
        setError(`흡수된 대회 0건. 사유: ${skippedList[0].reason}`);
        setShowConfirm(false);
        setSubmitting(false);
        return;
      }

      // 1건 이상 성공 — 결과 메시지 + 부모 onSuccess (refresh).
      let msg = `${absorbedCount}개 대회를 흡수했습니다.`;
      if (skippedList.length > 0) {
        msg += ` (${skippedList.length}건 제외 — ${skippedList[0].reason}${skippedList.length > 1 ? " 외" : ""})`;
      }
      setResultMessage(msg);
      setShowConfirm(false);
      setSubmitting(false);
      // 약간의 delay 후 onSuccess 호출 — 사용자가 메시지를 읽을 시간.
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setError("네트워크 오류로 흡수에 실패했습니다.");
      setShowConfirm(false);
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const selectedCount = selectedIds.size;
  const totalCount = tournaments.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  // 단체명 분기 — null 이면 시리즈 단독 표기.
  const orgLabel = organizationName ? `'${organizationName}'` : "(단체 미연결)";

  return (
    <>
      {/* 메인 모달 — 후보 목록 + 체크박스 */}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-md bg-[var(--color-surface)] shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined text-lg text-[var(--color-info)]">
                folder_managed
              </span>
              기존 대회 가져오기
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
              aria-label="닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* 시리즈 안내 */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 text-xs text-[var(--color-text-muted)]">
            <span className="text-[var(--color-text-secondary)]">대상 시리즈: </span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {seriesName}
            </span>
            <span className="mx-1">·</span>
            <span>{orgLabel}</span>
          </div>

          {/* 본문 — 목록 영역 */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                불러오는 중...
              </p>
            )}
            {!loading && error && (
              <p className="py-8 text-center text-sm text-[var(--color-warning,#d97706)]">
                {error}
              </p>
            )}
            {!loading && !error && totalCount === 0 && (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined mb-2 block text-3xl text-[var(--color-text-muted)]">
                  inbox
                </span>
                <p className="text-sm text-[var(--color-text-muted)]">
                  현재 미연결 대회가 없습니다.
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  새 대회는 wizard 에서 생성해주세요.
                </p>
              </div>
            )}
            {!loading && !error && totalCount > 0 && (
              <div className="space-y-2">
                {/* 전체 선택 */}
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm transition-colors hover:border-[var(--color-accent)]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
                  />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    전체 선택
                  </span>
                  <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                    {selectedCount} / {totalCount}
                  </span>
                </label>
                {/* 개별 row */}
                {tournaments.map((t) => {
                  const checked = selectedIds.has(t.id);
                  const statusLabel = STATUS_LABEL[t.status ?? ""] ?? t.status ?? "—";
                  return (
                    <label
                      key={t.id}
                      className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm transition-colors ${
                        checked
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-muted,rgba(227,27,35,0.08))]"
                          : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(t.id)}
                        className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-[var(--color-text-primary)]">
                          {t.name}
                          {t.edition_number ? (
                            <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                              ({t.edition_number}회)
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {statusLabel}
                          {t.start_date ? (
                            <>
                              <span className="mx-1">·</span>
                              {new Date(t.start_date).toLocaleDateString("ko-KR")}
                            </>
                          ) : null}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 결과 메시지 (흡수 성공 후 1.5초 표시) */}
          {resultMessage && (
            <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 text-sm text-[var(--color-success,#0a8754)]">
              <span className="material-symbols-outlined mr-1 align-middle text-base">
                check_circle
              </span>
              {resultMessage}
            </div>
          )}

          {/* 푸터 — 흡수 / 취소 버튼 */}
          <div className="flex gap-2 border-t border-[var(--color-border)] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[4px] border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
            >
              취소
            </button>
            {/* 2026-05-12: admin 빨강 본문 금지 → btn--primary */}
            <button
              type="button"
              disabled={selectedCount === 0 || submitting || !!resultMessage}
              onClick={handleAbsorbClick}
              className="btn btn--primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedCount > 0
                ? `${selectedCount}개 흡수`
                : "대회를 선택하세요"}
            </button>
          </div>
        </div>
      </div>

      {/* confirm 다이얼로그 — 흡수 직전 단체명 명시 (단체 events 탭 영향 안내) */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => !submitting && setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-md bg-[var(--color-surface)] p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined text-lg text-[var(--color-accent)]">
                info
              </span>
              흡수 확인
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              선택한 <strong className="text-[var(--color-text-primary)]">{selectedCount}개</strong>{" "}
              대회를 <strong className="text-[var(--color-text-primary)]">'{seriesName}'</strong>{" "}
              시리즈 ({orgLabel}) events 탭에 노출시킵니다. 진행하시겠어요?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-[4px] border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-50"
              >
                취소
              </button>
              {/* 2026-05-12: admin 빨강 본문 금지 → btn--primary */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmAbsorb}
                className="btn btn--primary flex-1 disabled:opacity-50"
              >
                {submitting ? "처리 중..." : "흡수"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
