"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/admin-toss";
import { useToast } from "@/contexts/toast-context";

interface DeleteSeriesButtonProps {
  seriesId: string;
  seriesName: string;
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

  const canConfirm = confirmText.trim() === seriesName.trim() && !loading;

  async function handleDelete() {
    if (!canConfirm) return;
    setLoading(true);
    try {
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
          `시리즈가 삭제되었습니다. 대회 ${data.detached_tournaments_count ?? 0}건이 분리되었습니다.`,
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
        className="ts-btn ts-btn--danger ts-btn--sm"
        aria-label="시리즈 영구 삭제"
      >
        <Icon name="trash-2" size={15} />
        <span className="hidden sm:inline">삭제</span>
      </button>

      {open && (
        <div
          className="ts-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setOpen(false);
              setConfirmText("");
            }
          }}
        >
          <div
            className="ts-modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ts-modal__head">
              <div className="flex items-center gap-2">
                <Icon name="triangle-alert" size={22} color="var(--danger)" />
                <h2 className="ts-modal__title">시리즈 영구 삭제</h2>
              </div>
              <p className="ts-modal__sub">이 작업은 되돌릴 수 없습니다.</p>
            </div>

            <div className="ts-modal__body space-y-5">
              <div className="space-y-3 text-sm text-[var(--ink)]">
                <p>
                  <span className="font-bold">{seriesName}</span> 시리즈를 영구 삭제합니다.
                </p>
                {tournamentsCount > 0 && (
                  <p className="rounded-[14px] bg-[var(--danger-weak)] p-3 text-xs text-[var(--ink)]">
                    묶인 대회 <span className="font-bold">{tournamentsCount}건</span>은
                    개별 대회로 분리됩니다. 대회 자체는 삭제되지 않습니다.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--ink)]">
                  시리즈 이름을 정확히 입력하세요
                  <span className="ml-1 font-mono text-[var(--ink-mute)]">{seriesName}</span>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={loading}
                  placeholder={seriesName}
                  className="ts-input"
                  autoFocus
                />
              </div>
            </div>

            <div className="ts-modal__foot">
              <button
                type="button"
                onClick={() => {
                  if (loading) return;
                  setOpen(false);
                  setConfirmText("");
                }}
                disabled={loading}
                className="ts-btn ts-btn--secondary ts-btn--block"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm}
                className="ts-btn ts-btn--danger ts-btn--block"
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
