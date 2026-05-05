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

  // 강제 jersey 변경 — 새 번호 prompt
  // 이유: 별도 모달 만들지 않고 prompt 로 단순 입력 — 운영자만 사용하는 관리 도구
  const handleForceJersey = async (memberId: string) => {
    const newJerseyStr = window.prompt("새 등번호 (0~99, 빈 값=미배정):");
    if (newJerseyStr === null) return; // 취소
    let newJersey: number | null = null;
    if (newJerseyStr.trim() !== "") {
      const n = Number(newJerseyStr.trim());
      if (!Number.isInteger(n) || n < 0 || n > 99) {
        alert("0~99 사이 정수를 입력하세요.");
        return;
      }
      newJersey = n;
    }
    const reason = window.prompt("사유 (선택):") ?? undefined;

    setBusy(memberId);
    try {
      const res = await fetch(
        `/api/web/teams/${teamId}/members/${memberId}/force-action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "force_jersey_change",
            newJersey,
            reason,
          }),
        },
      );
      const json = await res.json();
      if (!json.success) {
        alert(`실패: ${json.error ?? "알 수 없음"}`);
      } else {
        alert("강제 변경 완료");
        loadCandidates();
      }
    } finally {
      setBusy(null);
    }
  };

  // 강제 탈퇴 — 사유 필수
  const handleForceWithdraw = async (memberId: string, nickname: string | null) => {
    const reason = window.prompt(
      `[${nickname ?? "멤버"}] 강제 탈퇴 사유 (필수):`,
    );
    if (!reason || reason.trim().length < 1) return;
    if (!window.confirm(`정말 "${nickname}" 강제 탈퇴 처리합니까? (이력은 보존)`))
      return;

    setBusy(memberId);
    try {
      const res = await fetch(
        `/api/web/teams/${teamId}/members/${memberId}/force-action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "force_withdraw",
            reason: reason.trim(),
          }),
        },
      );
      const json = await res.json();
      if (!json.success) {
        alert(`실패: ${json.error ?? "알 수 없음"}`);
      } else {
        alert("강제 탈퇴 완료");
        loadCandidates();
      }
    } finally {
      setBusy(null);
    }
  };

  // 분류 해제 — UI 단에서만 처리 (서버에는 별도 dismiss 엔드포인트 없음 — 활동 추적이 자동 갱신)
  // 단, 운영자가 "false positive" 수동 표시할 수 있도록 안내만 노출
  const handleDismiss = (memberId: string) => {
    if (
      !window.confirm(
        "분류 해제 — 본 멤버를 유령 후보에서 제외할까요? (UI 표시만 변경되며, 활동 시 자동 active 유지)",
      )
    )
      return;
    setCandidates((prev) => prev.filter((c) => c.memberId !== memberId));
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
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-bright)] text-xs font-bold text-[var(--color-accent)]">
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

              {/* 액션 버튼들 */}
              <div className="flex flex-wrap justify-start gap-1.5 md:justify-end">
                <button
                  onClick={() => handleForceJersey(c.memberId)}
                  disabled={busy === c.memberId}
                  className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bright)] disabled:opacity-50"
                >
                  jersey 변경
                </button>
                <button
                  onClick={() =>
                    handleForceWithdraw(c.memberId, c.user?.nickname ?? null)
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
    </div>
  );
}
