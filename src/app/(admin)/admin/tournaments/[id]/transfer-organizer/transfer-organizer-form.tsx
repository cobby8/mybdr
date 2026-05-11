"use client";

/**
 * 2026-05-12 — 운영자 관리 폼 (사이트 관리자 / super_admin).
 *
 * 변경:
 *   - 검색: /api/web/admin/users/search → /api/web/admin/tournaments/[id]/eligible-users
 *     · 소속 단체 멤버 한정 (organization_members.organization_id = tournament.series.organization_id)
 *   - 액션 분기: "주최자 변경" / "운영자 추가" (TAM INSERT)
 *   - placeholder 안내 텍스트화 (snukobe@gmail.com 제거)
 *
 * 소속 단체 미연결 (tournament.series.organization_id = null) 시:
 *   - 안내 메시지 + 폼 비활성 ("이 대회를 단체 시리즈에 연결한 후 다시 시도하세요")
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

type FoundUser = {
  id: string;
  nickname: string | null;
  email: string;
  name: string | null;
  role?: string;
};

type Action = "transfer" | "add";

interface Props {
  tournamentId: string;
  currentOrganizerId: string;
  organizationName: string | null;
  hasOrganization: boolean;
}

export function TransferOrganizerForm({
  tournamentId,
  currentOrganizerId,
  organizationName,
  hasOrganization,
}: Props) {
  const router = useRouter();
  const [action, setAction] = useState<Action>("add");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoundUser[]>([]);
  const [selected, setSelected] = useState<FoundUser | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const search = async () => {
    setError(null);
    if (!hasOrganization) {
      setError("대회가 단체 시리즈에 연결되어 있지 않습니다. 단체 연결 후 다시 시도하세요.");
      return;
    }
    setSearching(true);
    try {
      const url = new URL(
        `/api/web/admin/tournaments/${tournamentId}/eligible-users`,
        window.location.origin,
      );
      if (query.trim()) url.searchParams.set("q", query.trim());
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setResults((json.users ?? []) as FoundUser[]);
        if ((json.users ?? []).length === 0) {
          setError("검색 결과 없음 — 소속 단체 가입자만 후보로 표시됩니다.");
        }
      } else {
        setError("검색 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setSearching(false);
    }
  };

  // 빈 query 검색 = 전체 단체 멤버 목록 (사용자가 검색어 입력 안 해도 후보 표시)
  // useEffect 로 마운트 시 자동 호출
  // (action 변경 시 결과 리셋)
  const reset = () => {
    setResults([]);
    setSelected(null);
    setReason("");
    setError(null);
    setSuccess(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selected) return setError("후보를 선택하세요.");

    if (action === "transfer") {
      if (selected.id === currentOrganizerId) return setError("현 주최자와 동일합니다.");
      if (!reason.trim()) return setError("변경 사유를 입력하세요 (최소 5자).");
      if (reason.trim().length < 5) return setError("변경 사유는 최소 5자 이상.");

      setSubmitting(true);
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
        setSuccess(`주최자가 ${selected.nickname ?? selected.email} 으로 변경되었습니다.`);
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
        setSubmitting(false);
        reset();
      } catch {
        setError("네트워크 오류");
        setSubmitting(false);
      }
      return;
    }

    // action === 'add' (운영자 추가)
    setSubmitting(true);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${tournamentId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, role: "admin" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "운영자 추가 실패");
        setSubmitting(false);
        return;
      }
      setSuccess(`${selected.nickname ?? selected.email} 을(를) 위임 운영자로 추가했습니다.`);
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
      setSubmitting(false);
      reset();
    } catch {
      setError("네트워크 오류");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* 액션 토글 */}
      <div
        className="rounded-[4px] border p-3"
        style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
        >
          작업 선택
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setAction("add"); reset(); }}
            className="btn btn--sm"
            style={
              action === "add"
                ? { background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }
                : undefined
            }
          >
            + 운영자 추가
          </button>
          <button
            type="button"
            onClick={() => { setAction("transfer"); reset(); }}
            className="btn btn--sm"
            style={
              action === "transfer"
                ? { background: "var(--color-warning)", color: "#fff", borderColor: "var(--color-warning)" }
                : undefined
            }
          >
            ⇄ 주최자 변경
          </button>
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {action === "add"
            ? "위임 운영자를 추가합니다. TournamentAdminMember 에 INSERT 됩니다."
            : "현 주최자 권한을 다른 사용자로 이관합니다. (warning 박제)"}
        </p>
      </div>

      {/* 검색 영역 */}
      <div>
        <label
          className="mb-1 block text-xs font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          {action === "add" ? "운영자 후보 검색" : "신규 주최자 검색"}{" "}
          {organizationName && (
            <span style={{ color: "var(--color-accent)" }}>
              · {organizationName} 멤버 한정
            </span>
          )}
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
            placeholder="닉네임 / 이메일 / userId 일부 입력 (빈 값 검색 = 전체 멤버)"
            className="flex-1 rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-card)",
              color: "var(--color-text-primary)",
            }}
            disabled={!hasOrganization}
          />
          <button
            type="button"
            onClick={search}
            disabled={searching || !hasOrganization}
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
                <p className="font-medium">
                  {u.nickname ?? u.name ?? "(이름 없음)"}
                  {u.name && u.name !== u.nickname && (
                    <span className="ml-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      ({u.name})
                    </span>
                  )}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {u.email} · userId {u.id}
                  {u.role && ` · 단체 ${u.role}`}
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
                  현 주최자
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 변경 사유 (transfer 액션만) */}
      {selected && action === "transfer" && (
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
            placeholder="기존 주최자 부재로 신규 협회 담당자 이관"
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
        <button
          type="submit"
          disabled={submitting || !selected || !hasOrganization}
          className="btn btn--primary"
        >
          {submitting
            ? "처리 중..."
            : action === "add"
              ? "운영자 추가 실행"
              : "주최자 변경 실행"}
        </button>
      </div>
    </form>
  );
}
