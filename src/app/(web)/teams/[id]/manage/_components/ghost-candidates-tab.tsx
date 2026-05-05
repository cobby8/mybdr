"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 5 PR15 — 유령 후보 탭 (captain or ghostClassify 위임자)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 보고서 §3 — 3개월 미활동 active 멤버 후보를 일괄 표시 + 강제 액션 수행.
// UI:
//   1. 후보 멤버 목록 (이름 / 가입일 / 마지막 활동 / 잔여 옵션)
//   2. 각 멤버에 액션 버튼: "강제 jersey 변경" / "강제 탈퇴" / "분류 해제 (false positive)"
//   3. 액션 시 사유 prompt + 확인 모달 → POST force-action
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
// 모달화 — window.prompt() / window.alert() 제거 (모바일 디자인 일관성)
import { ForceActionModal } from "./force-action-modal";

interface GhostCandidate {
  memberId: string;
  userId: string;
  jerseyNumber: number | null;
  role: string | null;
  position: string | null;
  joinedAt: string;
  lastActivityAt: string | null;
  user: {
    id: string;
    nickname: string | null;
    name: string | null;
    profileImage: string | null;
  } | null;
}

interface Props {
  teamId: string;
}

export function GhostCandidatesTab({ teamId }: Props) {
  const [candidates, setCandidates] = useState<GhostCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // memberId
  // 모달 상태 — window.prompt 대체. mode + target memberId/nickname 보관
  const [modalState, setModalState] = useState<
    | { open: false }
    | {
        open: true;
        mode: "jersey" | "withdraw";
        memberId: string;
        memberLabel: string;
      }
  >({ open: false });
  // 결과 안내용 toast (window.alert 대체) — 3초 후 자동 닫힘
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // 후보 로드
  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/ghost-candidates`);
      const json = await res.json();
      if (json.success && json.data?.candidates) {
        setCandidates(json.data.candidates);
      } else {
        // FORBIDDEN 등 에러 케이스 — 권한 부족 안내
        setError(json.error || "권한이 없습니다.");
      }
    } catch {
      setError("불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // toast 자동 닫힘 (3초)
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // 강제 jersey 변경 — 모달 열기 (window.prompt 대체)
  const openJerseyModal = (memberId: string, nickname: string | null) => {
    setModalState({
      open: true,
      mode: "jersey",
      memberId,
      memberLabel: nickname ?? "멤버",
    });
  };

  // 강제 탈퇴 — 모달 열기 (window.prompt + window.confirm 대체)
  const openWithdrawModal = (memberId: string, nickname: string | null) => {
    setModalState({
      open: true,
      mode: "withdraw",
      memberId,
      memberLabel: nickname ?? "멤버",
    });
  };

  // 모달에서 확정 — 실제 API 호출 (action 분기)
  const handleModalConfirm = async (payload: {
    newJersey?: number | null;
    reason: string;
  }) => {
    if (!modalState.open) return;
    const { memberId, mode } = modalState;
    setBusy(memberId);
    try {
      const body =
        mode === "jersey"
          ? {
              action: "force_jersey_change",
              newJersey: payload.newJersey ?? null,
              reason: payload.reason || undefined,
            }
          : {
              action: "force_withdraw",
              reason: payload.reason,
            };
      const res = await fetch(
        `/api/web/teams/${teamId}/members/${memberId}/force-action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (!json.success) {
        setToast({ text: `실패: ${json.error ?? "알 수 없음"}`, type: "error" });
      } else {
        setToast({
          text: mode === "jersey" ? "강제 변경 완료" : "강제 탈퇴 완료",
          type: "success",
        });
        setModalState({ open: false });
        loadCandidates();
      }
    } finally {
      setBusy(null);
    }
  };

  // 분류 해제 — 단순 UI 단 처리. confirm 대신 즉시 적용 + toast 안내
  // (운영자는 새로고침 / API 자동 sync 로 복원 가능. 비파괴 액션이므로 별도 모달 불요)
  const handleDismiss = (memberId: string) => {
    setCandidates((prev) => prev.filter((c) => c.memberId !== memberId));
    setToast({
      text: "분류 해제됨 (활동 시 자동 active 유지)",
      type: "success",
    });
  };

  // 마지막 활동 표시 — null = "기록 없음"
  function lastActivityLabel(iso: string | null): string {
    if (!iso) return "기록 없음";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    return `${diffDays}일 전`;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            유령 후보 (3개월 이상 미활동 active 멤버)
          </h3>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            팀 페이지 접속 / 대회 출전 / 매치 통계 / 게시판 작성 / 마이페이지 진입 = 활동
          </p>
        </div>
        <Button onClick={loadCandidates} disabled={loading} variant="ghost">
          새로고침
        </Button>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
          불러오는 중...
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-lg px-5 py-4 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && candidates.length === 0 && (
        <div className="rounded-lg bg-[var(--color-card)] py-16 text-center">
          <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-success)]">
            check_circle
          </span>
          <p className="text-sm text-[var(--color-text-secondary)]">
            유령 후보가 없습니다. 모든 멤버가 최근 3개월 내 활동했습니다.
          </p>
        </div>
      )}

      {!loading && !error && candidates.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-[var(--color-card)]">
          {candidates.map((c) => (
            <div
              key={c.memberId}
              className="grid grid-cols-1 gap-2 border-t border-[var(--color-border)] px-4 py-3 text-sm md:grid-cols-[1fr_120px_120px_280px] md:items-center md:gap-3"
            >
              {/* 멤버 표시 */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-elevated)] text-xs font-bold text-[var(--color-accent)]">
                  {(c.user?.nickname ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-[var(--color-text-primary)]">
                    {c.user?.nickname ?? c.user?.name ?? "—"}{" "}
                    {c.jerseyNumber != null && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        #{c.jerseyNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">
                    {c.role ?? "—"} · {c.position ?? "—"}
                  </div>
                </div>
              </div>

              {/* 가입일 */}
              <div className="text-xs text-[var(--color-text-secondary)]">
                <span className="md:hidden text-[10px] text-[var(--color-text-muted)] mr-1">
                  가입:
                </span>
                {new Date(c.joinedAt).toLocaleDateString("ko-KR", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </div>

              {/* 마지막 활동 */}
              <div className="text-xs">
                <span className="md:hidden text-[10px] text-[var(--color-text-muted)] mr-1">
                  활동:
                </span>
                <span
                  style={{
                    color:
                      c.lastActivityAt === null
                        ? "var(--color-error)"
                        : "var(--color-text-secondary)",
                  }}
                >
                  {lastActivityLabel(c.lastActivityAt)}
                </span>
              </div>

              {/* 액션 버튼들 — 모달 트리거 (window.prompt 대체) */}
              <div className="flex flex-wrap justify-start gap-1.5 md:justify-end">
                <button
                  onClick={() => openJerseyModal(c.memberId, c.user?.nickname ?? null)}
                  disabled={busy === c.memberId}
                  className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-elevated)] disabled:opacity-50"
                >
                  jersey 변경
                </button>
                <button
                  onClick={() =>
                    openWithdrawModal(c.memberId, c.user?.nickname ?? null)
                  }
                  disabled={busy === c.memberId}
                  className="rounded border border-[var(--color-error)] bg-[var(--color-error)] px-2 py-1 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  강제 탈퇴
                </button>
                <button
                  onClick={() => handleDismiss(c.memberId)}
                  disabled={busy === c.memberId}
                  className="rounded border border-[var(--color-border)] bg-transparent px-2 py-1 text-[11px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] disabled:opacity-50"
                >
                  분류 해제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 강제 액션 모달 — window.prompt 대체 */}
      <ForceActionModal
        open={modalState.open}
        mode={modalState.open ? modalState.mode : "jersey"}
        memberLabel={modalState.open ? modalState.memberLabel : ""}
        busy={busy !== null}
        onClose={() => setModalState({ open: false })}
        onConfirm={handleModalConfirm}
      />

      {/* 결과 안내 toast — window.alert 대체 (3초 자동 닫힘) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100,
            padding: "10px 16px",
            borderRadius: 6,
            fontSize: 13,
            maxWidth: "calc(100vw - 32px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            background:
              toast.type === "success"
                ? "color-mix(in srgb, var(--color-success) 90%, black)"
                : "var(--color-error)",
            color: "#fff",
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
