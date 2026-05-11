"use client";

/**
 * 2026-05-12 Phase 4 — 운영자 변경 폼 (client component).
 *
 * 흐름: user search (email/nickname/id) → 선택 → 사유 입력 → POST API
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

type FoundUser = {
  id: string;
  nickname: string | null;
  email: string;
  name: string | null;
};

interface Props {
  tournamentId: string;
  currentOrganizerId: string;
}

export function TransferOrganizerForm({ tournamentId, currentOrganizerId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoundUser[]>([]);
  const [selected, setSelected] = useState<FoundUser | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/web/admin/users/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const json = await res.json();
        // apiSuccess raw 응답 — { users: [...] } 형태 가정
        setResults((json.users ?? []) as FoundUser[]);
      } else {
        setError("검색 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setSearching(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return setError("신규 운영자를 선택하세요.");
    if (selected.id === currentOrganizerId) return setError("현 운영자와 동일합니다.");
    if (!reason.trim()) return setError("변경 사유를 입력하세요 (최소 5자).");
    if (reason.trim().length < 5) return setError("변경 사유는 최소 5자 이상 입력하세요.");

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${tournamentId}/transfer-organizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOrganizerId: selected.id, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "이관 실패");
        setSubmitting(false);
        return;
      }
      // 성공 — 같은 페이지 refresh (현 운영자 표시 갱신) + 성공 토스트
      // 2026-05-12 사용자 요청: 변경 완료까지 명확 확인 (alert → toast + refresh)
      setSuccess(`운영자가 ${selected.nickname ?? selected.email} 으로 변경되었습니다.`);
      router.refresh();
      // 3초 후 토스트 자동 dismiss
      setTimeout(() => setSuccess(null), 3000);
      setSubmitting(false);
    } catch {
      setError("네트워크 오류");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* 검색 영역 */}
      <div>
        <label
          className="mb-1 block text-xs font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          신규 운영자 검색 (닉네임 / 이메일 / userId)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="snukobe@gmail.com"
            className="flex-1 rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-card)",
              color: "var(--color-text-primary)",
            }}
          />
          <button
            type="button"
            onClick={search}
            disabled={searching || !query.trim()}
            className="btn btn--sm"
          >
            {searching ? "검색 중..." : "검색"}
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            검색 결과 {results.length}건
          </p>
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u)}
              className={`flex w-full items-center justify-between rounded-[4px] border p-3 text-left text-sm transition-colors ${
                selected?.id === u.id ? "ring-2" : "hover:bg-[var(--color-elevated)]"
              }`}
              style={{
                borderColor: selected?.id === u.id ? "var(--color-accent)" : "var(--color-border)",
                background: selected?.id === u.id ? "color-mix(in srgb, var(--color-accent) 5%, transparent)" : undefined,
              }}
            >
              <div>
                <p className="font-medium">{u.nickname ?? u.name ?? "(이름 없음)"}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {u.email} · userId {u.id}
                </p>
              </div>
              {u.id === currentOrganizerId && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "var(--color-elevated)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  현 운영자
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 변경 사유 */}
      {selected && (
        <div>
          <label
            className="mb-1 block text-xs font-semibold"
            style={{ color: "var(--color-text-muted)" }}
          >
            변경 사유 (필수, 최소 5자)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="예: 기존 운영자 부재로 신규 협회 담당자 이관"
            className="w-full rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-card)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>
      )}

      {success && (
        <div
          className="rounded-[4px] border p-3 text-sm"
          style={{
            borderColor: "var(--color-success)",
            background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
            color: "var(--color-success)",
          }}
        >
          <span className="material-symbols-outlined align-middle mr-1 text-base">check_circle</span>
          {success}
        </div>
      )}
      {error && (
        <p className="text-sm" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={submitting || !selected} className="btn btn--primary">
          {submitting ? "이관 중..." : "운영자 변경 실행"}
        </button>
      </div>
    </form>
  );
}
