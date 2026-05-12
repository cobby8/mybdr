"use client";

/**
 * ArchiveOrganizationButton — 단체 보관 / 복구 버튼.
 *
 * 2026-05-12 (Phase E) — 단체 lifecycle (Q1 보존 정책).
 *
 * 이유 (왜):
 *   - 단체 owner 가 단체를 보관(archived)하거나 복구할 수 있어야 운영 셀프서비스 가능.
 *   - admin/member 는 차단 — owner 만의 lifecycle 결정 (server 가드 + UI 가드 이중).
 *
 * 어떻게:
 *   - mode='archive' → POST /api/web/organizations/[id]/archive (status='archived')
 *   - mode='restore' → DELETE /api/web/organizations/[id]/archive (status='approved')
 *   - confirm 다이얼로그 (Phase D 와 동일 패턴) — 양쪽 결과 명시.
 *   - 성공 시:
 *     - archive → 단체 목록으로 redirect (현 페이지가 archived 상태로 변하므로 listing 으로 이동)
 *     - restore → 부모 onSuccess() 호출하여 페이지 갱신
 *   - 디자인 13 룰: var(--color-warning) (빨강 본문 0) / Material Symbols / 44px+.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  /** 단체 ID — API endpoint */
  organizationId: string;
  /** 단체 이름 — confirm 카피용 */
  organizationName: string;
  /** 액션 모드 — 현재 status 따라 부모가 결정 */
  mode: "archive" | "restore";
  /** restore 성공 시 부모 refresh — archive 는 redirect 처리하므로 미사용 */
  onSuccess?: () => void;
}

export default function ArchiveOrganizationButton({
  organizationId,
  organizationName,
  mode,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESC 닫기 — 접근성
  useEffect(() => {
    if (!showConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setShowConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfirm, submitting]);

  // 액션 실행 — POST(archive) / DELETE(restore)
  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/web/organizations/${organizationId}/archive`, {
        method: mode === "archive" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "처리에 실패했습니다.");
        setSubmitting(false);
        return;
      }
      // 성공 분기:
      //   archive → 현 페이지 archived 상태로 사용자가 머무를 필요 없음 → 단체 목록으로 이동
      //   restore → 같은 페이지 갱신 (active 상태로 복귀)
      if (mode === "archive") {
        // router.push 는 client navigation — 같은 layout 위에서 단체 목록으로 이동
        router.push("/tournament-admin/organizations");
        // refresh 는 listing 페이지에서 새 데이터 fetch 보장 (cache stale 방지)
        router.refresh();
      } else {
        setShowConfirm(false);
        setSubmitting(false);
        onSuccess?.();
      }
    } catch {
      setError("네트워크 오류로 처리에 실패했습니다.");
      setSubmitting(false);
    }
  };

  // 모드별 라벨/카피 — 함수 내부에서 매핑 (간결 + 한 곳)
  const isArchive = mode === "archive";
  const buttonLabel = isArchive ? "단체 보관" : "단체 복구";
  const buttonIcon = isArchive ? "inventory_2" : "unarchive";
  const dialogTitle = isArchive ? "단체 보관" : "단체 복구";
  // confirm 카피 — Q1 정책 명시 (시리즈/대회 보존)
  const dialogMessage = isArchive
    ? `'${organizationName}' 단체를 보관합니다. 보관된 단체는 공개 페이지에서 숨겨지며, 소속 시리즈와 대회는 그대로 보존됩니다. 진행하시겠어요?`
    : `'${organizationName}' 단체를 복구합니다. 다시 공개 페이지에 노출됩니다. 진행하시겠어요?`;
  const submitLabel = isArchive ? "보관" : "복구";

  return (
    <>
      {/* trigger 버튼 — admin 빨강 본문 금지 룰 → warning 토큰 (boran 액션은 신중) */}
      <button
        type="button"
        onClick={() => {
          setError(null);
          setShowConfirm(true);
        }}
        className={`flex w-full items-center justify-between rounded-lg border p-4 transition-colors min-h-[44px] ${
          isArchive
            ? // archive = 회색 톤 (warning 색은 hover 에서만 강조 — 사용자 결정 무게감)
              "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-warning,#d97706)] hover:text-[var(--color-warning,#d97706)]"
            : // restore = info 톤 (긍정 액션)
              "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-info)] hover:border-[var(--color-info)]"
        }`}
        aria-label={`${organizationName} ${buttonLabel}`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined">{buttonIcon}</span>
          <span className="text-sm font-medium">{buttonLabel}</span>
        </div>
        <span className="material-symbols-outlined text-[var(--color-text-muted)]">
          chevron_right
        </span>
      </button>

      {/* confirm 다이얼로그 — Phase D 와 동일 패턴 */}
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
              <span
                className={`material-symbols-outlined text-lg ${
                  isArchive
                    ? "text-[var(--color-warning,#d97706)]"
                    : "text-[var(--color-info)]"
                }`}
              >
                {isArchive ? "warning" : "info"}
              </span>
              {dialogTitle}
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {dialogMessage}
            </p>
            {error && (
              <p className="mb-3 text-sm text-[var(--color-warning,#d97706)]">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-[4px] border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-50"
              >
                취소
              </button>
              {/* admin 빨강 본문 금지 → btn--primary 토큰 (라이트=navy / 다크=BDR Red 자동) */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirm}
                className="btn btn--primary flex-1 disabled:opacity-50"
              >
                {submitting ? "처리 중..." : submitLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
