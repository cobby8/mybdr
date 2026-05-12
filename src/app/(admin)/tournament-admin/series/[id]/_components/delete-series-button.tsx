"use client";

/**
 * DeleteSeriesButton — 시리즈 영구 삭제 (Hard DELETE) 버튼.
 *
 * 2026-05-12 (Phase C-3) — super_admin 전용 노출.
 *
 * 정책:
 *   - super_admin only — 페이지 server component 에서 권한 가드 후 노출 (이중 가드: 본 컴포넌트도
 *     서버에서 호출 시 DELETE API 가 한 번 더 super_admin 검증).
 *   - confirm 모달 2단계 — (1) 자동 노출 알림 + (2) 시리즈명 입력 매칭 (매크로 차단).
 *   - 삭제 후 /tournament-admin/series 로 redirect.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/toast-context";

interface DeleteSeriesButtonProps {
  seriesId: string;
  seriesName: string;
  /** 묶인 대회 수 — 안내 문구에 표시 (시리즈 삭제 시 분리됨) */
  tournamentsCount: number;
}

export function DeleteSeriesButton({
  seriesId,
  seriesName,
  tournamentsCount,
}: DeleteSeriesButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  // 시리즈명 정확 입력 시만 활성화 (실수 방지)
  const canConfirm = confirmText.trim() === seriesName.trim() && !loading;

  async function handleDelete() {
    if (!canConfirm) return;
    setLoading(true);
    try {
      // hard=1 — Hard DELETE (super_admin only). 서버가 한 번 더 검증.
      const res = await fetch(`/api/web/series/${seriesId}?hard=1`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        deleted?: boolean;
        detached_tournaments_count?: number;
        error?: string;
      };

      if (res.ok && data.deleted) {
        showToast(
          `시리즈가 삭제되었습니다 (대회 ${data.detached_tournaments_count ?? 0}건 분리됨)`,
          "success",
        );
        router.push("/tournament-admin/series");
        router.refresh();
      } else {
        showToast(data.error ?? "삭제 중 오류가 발생했습니다.", "error");
        setLoading(false);
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn--sm inline-flex items-center gap-1"
        style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
        aria-label="시리즈 영구 삭제"
      >
        <span className="material-symbols-outlined text-base">delete</span>
        <span className="hidden sm:inline">삭제</span>
      </button>

      {/* 확인 모달 — 시리즈명 입력 매칭 (실수/매크로 차단) */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            // 배경 클릭 시 닫기 (loading 중에는 차단)
            if (e.target === e.currentTarget && !loading) {
              setOpen(false);
              setConfirmText("");
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-[16px] bg-[var(--color-surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: "var(--color-error)" }}
              >
                warning
              </span>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                시리즈 영구 삭제
              </h2>
            </div>

            <div className="mb-5 space-y-3 text-sm text-[var(--color-text-primary)]">
              <p>
                <span className="font-bold">{seriesName}</span> 시리즈를 영구
                삭제합니다.
              </p>
              {tournamentsCount > 0 && (
                <p
                  className="rounded-[12px] p-3 text-xs"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  묶인 대회 <span className="font-bold">{tournamentsCount}건</span>은
                  개인 대회로 분리됩니다 (대회 자체는 삭제되지 않습니다).
                </p>
              )}
              <p className="text-xs text-[var(--color-text-muted)]">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            {/* 시리즈명 입력 매칭 */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-primary)]">
                시리즈 이름을 정확히 입력하세요:
                <span className="ml-1 font-mono text-[var(--color-text-muted)]">
                  {seriesName}
                </span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={loading}
                placeholder={seriesName}
                className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-60"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (loading) return;
                  setOpen(false);
                  setConfirmText("");
                }}
                disabled={loading}
                className="btn btn--sm flex-1"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm}
                className="btn btn--sm flex-1"
                style={{
                  background: canConfirm ? "var(--color-error)" : undefined,
                  borderColor: canConfirm ? "var(--color-error)" : undefined,
                  color: canConfirm ? "#fff" : undefined,
                }}
              >
                {loading ? "삭제 중..." : "영구 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
