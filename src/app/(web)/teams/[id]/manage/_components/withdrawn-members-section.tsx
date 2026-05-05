"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 5 PR16 — 탈퇴 멤버 이력 탭 (captain only)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 보고서 §3-A — 회원 상태 정비. status='withdrawn' 멤버 별도 표시.
//   사용자 결정 #5 — captain 만 명단 완전 삭제 가능 (위임 X).
// UI:
//   1. status='withdrawn' team_members row 목록 (탈퇴 시각 / 사유 추정 — history 없으면 표시 X)
//   2. 각 row 옆 "완전 삭제" 버튼 — captain only, confirmation 모달 후 DELETE row
//   3. 완전 삭제 후 history 보존 (eventType='permanent_deleted' INSERT)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface WithdrawnMember {
  id: string;
  user_id: string;
  nickname: string | null;
  jerseyNumber: number | null;
  role: string | null;
  position: string | null;
  left_at: string | null;
  createdAt: string;
}

interface Props {
  teamId: string;
}

export function WithdrawnMembersSection({ teamId }: Props) {
  const [members, setMembers] = useState<WithdrawnMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // 본 컴포넌트 전용 — 멤버 페이지의 기존 GET roster 가 active 만 반환하므로
  // 별도 endpoint 가 필요. 하지만 본 PR 범위에서는 기존 members API 의 status 필터를
  // 사용한다. 만약 기존 members API 가 active 고정이면 본 endpoint 추가 필요.
  // 현재 코드베이스 — `/api/web/teams/[id]/members?status=withdrawn` 호환 가정.
  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/members?status=withdrawn`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.members)) {
        setMembers(json.data.members);
      } else {
        setError(json.error || "불러오기 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // 완전 삭제 — captain only confirmation 모달 후 DELETE
  const handlePermanentDelete = async (memberId: string, nickname: string | null) => {
    if (
      !window.confirm(
        `정말 "${nickname ?? "멤버"}" 명단에서 완전 삭제할까요?\n\n이 작업은 되돌릴 수 없습니다.\n(이력은 보존됩니다 — team_member_history)`,
      )
    ) {
      return;
    }

    setBusy(memberId);
    try {
      const res = await fetch(
        `/api/web/teams/${teamId}/members/${memberId}/permanent-delete`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!json.success) {
        alert(`실패: ${json.error ?? "알 수 없음"}`);
      } else {
        alert("명단에서 완전 삭제 완료");
        loadMembers();
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            탈퇴 멤버 이력
          </h2>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            완전 삭제는 팀장만 가능 (이력은 team_member_history 에 영구 보존).
          </p>
        </div>
        <Button onClick={loadMembers} disabled={loading} variant="ghost">
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

      {!loading && !error && members.length === 0 && (
        <div className="rounded-lg bg-[var(--color-card)] py-16 text-center">
          <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-text-muted)]">
            person_off
          </span>
          <p className="text-sm text-[var(--color-text-secondary)]">탈퇴 멤버가 없습니다.</p>
        </div>
      )}

      {!loading && !error && members.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-[var(--color-card)]">
          {members.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-1 gap-2 border-t border-[var(--color-border)] px-4 py-3 text-sm md:grid-cols-[1fr_140px_140px_140px] md:items-center md:gap-3"
              style={{
                opacity: 0.7, // withdrawn 톤 다운
              }}
            >
              {/* 멤버 표시 */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-bright)] text-xs font-bold text-[var(--color-text-muted)]">
                  {(m.nickname ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-[var(--color-text-secondary)]">
                    {m.nickname ?? "—"}
                    {m.jerseyNumber != null && (
                      <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                        #{m.jerseyNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">
                    {m.role ?? "—"} · {m.position ?? "—"}
                  </div>
                </div>
              </div>

              {/* 가입일 */}
              <div className="text-xs text-[var(--color-text-muted)]">
                <span className="md:hidden text-[10px] mr-1">가입:</span>
                {new Date(m.createdAt).toLocaleDateString("ko-KR")}
              </div>

              {/* 탈퇴일 */}
              <div className="text-xs" style={{ color: "var(--color-error)" }}>
                <span className="md:hidden text-[10px] mr-1">탈퇴:</span>
                {m.left_at ? new Date(m.left_at).toLocaleDateString("ko-KR") : "—"}
              </div>

              {/* 완전 삭제 버튼 */}
              <div className="flex justify-start md:justify-end">
                <button
                  onClick={() => handlePermanentDelete(m.id, m.nickname)}
                  disabled={busy === m.id}
                  className="rounded border border-[var(--color-error)] bg-transparent px-2.5 py-1 text-[11px] font-bold text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white disabled:opacity-50"
                >
                  완전 삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
