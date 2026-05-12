"use client";

/**
 * MoveSeriesModal — 시리즈를 다른 단체로 이동하는 모달.
 *
 * 2026-05-12 (Phase D-1) — 단체↔시리즈 셀프서비스 UI.
 *
 * 이유 (왜):
 *   - 운영자가 본인이 owner/admin 인 다른 단체로 시리즈를 이동할 수 있어야 운영 셀프서비스 가능.
 *   - GET /api/web/organizations 가 이미 myRole 포함 — 클라이언트에서 owner/admin 필터 + 현재 단체 제외.
 *   - PATCH /api/web/series/[id] (Phase C) 의 organization_id 변경 분기 + 양쪽 단체 권한 검증을 활용.
 *
 * 어떻게:
 *   - 마운트 시 GET /api/web/organizations → myRole IN [owner, admin] + id !== currentOrgId 필터링.
 *   - radio 선택 → "이동" 버튼 → confirm 다이얼로그 → PATCH organization_id=targetOrgId.
 *   - 디자인 13 룰: var(--color-*) / Material Symbols / 44px+ / 빨강 본문 0.
 */

import { useEffect, useState, useCallback } from "react";

interface MyOrganization {
  id: string;
  name: string;
  region: string | null;
  status: string;
  myRole: string; // owner / admin / member
}

interface Props {
  open: boolean;
  onClose: () => void;
  seriesId: string;
  seriesName: string;
  /** 현재 단체 ID — 목록에서 제외 */
  currentOrgId: string;
  /** 현재 단체 이름 — 카피용 */
  currentOrgName: string;
  /** 이동 성공 시 부모 refresh */
  onSuccess: () => void;
}

export default function MoveSeriesModal({
  open,
  onClose,
  seriesId,
  seriesName,
  currentOrgId,
  currentOrgName,
  onSuccess,
}: Props) {
  // 본인 단체 목록 (owner/admin 필터 + 현재 단체 제외 후)
  const [orgs, setOrgs] = useState<MyOrganization[]>([]);
  // 선택된 대상 단체 ID
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  // 로딩/에러
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // 이동 처리 중
  const [submitting, setSubmitting] = useState(false);
  // confirm 다이얼로그 표시
  const [showConfirm, setShowConfirm] = useState(false);
  // 결과 메시지 (성공 시 1.5초 표시)
  const [resultMessage, setResultMessage] = useState("");

  // 마운트 시 단체 목록 fetch — 운영자 본인이 멤버인 단체 + role 정보.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setResultMessage("");
    setSelectedOrgId(null);
    setShowConfirm(false);

    fetch("/api/web/organizations")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        // apiSuccess({ organizations: [...] }) — snake_case 변환 후 키.
        // GET /api/web/organizations 의 응답 키는 organizations / id / name / myRole.
        // apiSuccess 가 myRole → my_role 자동 변환할 수 있음 — 양쪽 키 fallback.
        const data = json?.data ?? json;
        const list: Array<Record<string, unknown>> = data?.organizations ?? [];
        // owner/admin 필터링 + 현재 단체 제외 + approved 만 (PATCH API 가 approved 만 허용)
        const filtered: MyOrganization[] = list
          .map((o) => ({
            id: String(o.id),
            name: String(o.name ?? ""),
            region: (o.region as string) ?? null,
            status: String(o.status ?? ""),
            // myRole / my_role 양쪽 fallback (apiSuccess 변환 대응)
            myRole: String(o.myRole ?? o.my_role ?? ""),
          }))
          .filter(
            (o) =>
              (o.myRole === "owner" || o.myRole === "admin") &&
              o.id !== currentOrgId &&
              o.status === "approved",
          );
        setOrgs(filtered);
      })
      .catch(() => {
        if (cancelled) return;
        setError("단체 목록을 불러올 수 없습니다.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, currentOrgId]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // confirm 열려 있으면 confirm 만 닫기
      if (showConfirm) setShowConfirm(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, showConfirm]);

  // "이동" 버튼 → confirm 표시.
  const handleMoveClick = useCallback(() => {
    if (!selectedOrgId) return;
    setShowConfirm(true);
  }, [selectedOrgId]);

  // confirm 확정 → PATCH organization_id=targetOrgId.
  const handleConfirmMove = async () => {
    if (!selectedOrgId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/web/series/${seriesId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: selectedOrgId }),
      });
      const json = await res.json();
      if (!res.ok) {
        // apiError — { error: "..." }
        setError(json?.error ?? "이동 실패");
        setShowConfirm(false);
        setSubmitting(false);
        return;
      }
      // 성공 — 결과 메시지 1.5초 표시 후 onSuccess.
      const target = orgs.find((o) => o.id === selectedOrgId);
      setResultMessage(
        `'${seriesName}' 시리즈를 '${target?.name ?? "선택한 단체"}' 로 이동했습니다.`,
      );
      setShowConfirm(false);
      setSubmitting(false);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch {
      setError("네트워크 오류로 이동에 실패했습니다.");
      setShowConfirm(false);
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);

  return (
    <>
      {/* 메인 모달 — 단체 목록 radio */}
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
                swap_horiz
              </span>
              다른 단체로 이동
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
            <span>현재 '{currentOrgName}'</span>
          </div>

          {/* 본문 — 단체 목록 */}
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
            {!loading && !error && orgs.length === 0 && (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined mb-2 block text-3xl text-[var(--color-text-muted)]">
                  inbox
                </span>
                <p className="text-sm text-[var(--color-text-muted)]">
                  이동 가능한 다른 단체가 없습니다.
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  본인이 owner 또는 admin 인 승인된 단체만 표시됩니다.
                </p>
              </div>
            )}
            {!loading && !error && orgs.length > 0 && (
              <div className="space-y-2">
                {orgs.map((o) => {
                  const checked = selectedOrgId === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm transition-colors ${
                        checked
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-muted,rgba(227,27,35,0.08))]"
                          : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="target-org"
                        value={o.id}
                        checked={checked}
                        onChange={() => setSelectedOrgId(o.id)}
                        className="mt-1 h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--color-text-primary)]">
                          {o.name}
                          <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                            ({o.myRole === "owner" ? "소유자" : "관리자"})
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {o.region || "지역 미설정"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 결과 메시지 */}
          {resultMessage && (
            <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 text-sm text-[var(--color-success,#0a8754)]">
              <span className="material-symbols-outlined mr-1 align-middle text-base">
                check_circle
              </span>
              {resultMessage}
            </div>
          )}

          {/* 푸터 */}
          <div className="flex gap-2 border-t border-[var(--color-border)] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[4px] border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
            >
              취소
            </button>
            {/* admin 빨강 본문 금지 → btn--primary 토큰 */}
            <button
              type="button"
              disabled={!selectedOrgId || submitting || !!resultMessage}
              onClick={handleMoveClick}
              className="btn btn--primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedOrgId ? "이동" : "단체를 선택하세요"}
            </button>
          </div>
        </div>
      </div>

      {/* confirm 다이얼로그 — 양쪽 단체 명시 */}
      {showConfirm && selectedOrg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => !submitting && setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-md bg-[var(--color-surface)] p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined text-lg text-[var(--color-info)]">
                info
              </span>
              이동 확인
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">'{seriesName}'</strong>{" "}
              시리즈를{" "}
              <strong className="text-[var(--color-text-primary)]">'{currentOrgName}'</strong>{" "}
              에서{" "}
              <strong className="text-[var(--color-text-primary)]">'{selectedOrg.name}'</strong>{" "}
              로 이동합니다. 진행하시겠어요?
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
              {/* admin 빨강 본문 금지 → btn--primary 토큰 */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmMove}
                className="btn btn--primary flex-1 disabled:opacity-50"
              >
                {submitting ? "처리 중..." : "이동"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
