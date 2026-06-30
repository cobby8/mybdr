"use client";

// =====================================================================
// _transfer-form.tsx — 운영자 관리 폼 (클라). 레거시 transfer-organizer-form.tsx 1:1 동작.
//   super_admin 이 소속 단체 멤버 중에서 ① 주최자 변경(transfer) 또는 ② 위임 운영자 추가(add)를 수행.
//
//   ⚠ 백엔드 0변경·mutation=기존 수단 그대로 — 레거시의 raw fetch() 를 verbatim 유지한다.
//     · 검색 = GET  /api/web/admin/tournaments/[id]/eligible-users?q=  (소속 단체 멤버 한정)
//     · 변경 = POST /api/web/admin/tournaments/[id]/transfer-organizer { newOrganizerId, reason }
//     · 추가 = POST /api/web/admin/tournaments/[id]/admins             { userId, role }
//   ★ adminFetch 미사용 이유: 위 라우트들의 Zod 계약이 camelCase(newOrganizerId/userId) 라
//     adminFetch 의 camel→snake 변환을 거치면 Zod 가 깨진다. 레거시 raw fetch 그대로가 곧 "기존 수단".
//   ⚠ 디자인만 admin-v2 — var(--*) 토큰 + ts-input/ts-btn/ts-card/bo-constabs + admin-v2 Icon(lucide).
//     하드코딩 색상 0. pill 9999px 0. 로직(검증/분기/상태)은 레거시 1:1 보존.
// =====================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/admin-v2";

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

  // 검색 — 기존 eligible-users 엔드포인트 raw fetch(레거시 1:1)
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
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 액션 토글 — bo-constabs(admin-v2 탭) 재사용 */}
      <div className="ts-card ts-card--tight">
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--ink-mute)",
          }}
        >
          작업 선택
        </p>
        <div className="bo-constabs">
          <button
            type="button"
            className="bo-constab"
            data-on={action === "add" ? "true" : "false"}
            onClick={() => {
              setAction("add");
              reset();
            }}
          >
            + 운영자 추가
          </button>
          <button
            type="button"
            className="bo-constab"
            data-on={action === "transfer" ? "true" : "false"}
            onClick={() => {
              setAction("transfer");
              reset();
            }}
          >
            ⇄ 주최자 변경
          </button>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--ink-mute)" }}>
          {action === "add"
            ? "위임 운영자를 추가합니다. TournamentAdminMember 에 INSERT 됩니다."
            : "현 주최자 권한을 다른 사용자로 이관합니다. (주의: 위험 작업)"}
        </p>
      </div>

      {/* 검색 영역 */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ink-soft)",
          }}
        >
          {action === "add" ? "운영자 후보 검색" : "신규 주최자 검색"}{" "}
          {organizationName && (
            <span style={{ color: "var(--primary)" }}>· {organizationName} 멤버 한정</span>
          )}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
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
            placeholder="닉네임 / 이메일 / userId 일부 (빈 값 = 전체 멤버)"
            className="ts-input"
            style={{ flex: 1 }}
            disabled={!hasOrganization}
          />
          <button
            type="button"
            onClick={search}
            disabled={searching || !hasOrganization}
            className="ts-btn ts-btn--secondary ts-btn--sm"
          >
            {searching ? "검색 중..." : "검색"}
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-mute)" }}>
            검색 결과 {results.length}건
          </p>
          {results.map((u) => {
            const on = selected?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelected(u)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: 12,
                  textAlign: "left",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: on ? "var(--primary)" : "var(--border)",
                  background: on
                    ? "color-mix(in srgb, var(--primary) 6%, transparent)"
                    : "var(--card)",
                  cursor: "pointer",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--ink)" }}>
                    {u.nickname ?? u.name ?? "(이름 없음)"}
                    {u.name && u.name !== u.nickname && (
                      <span style={{ marginLeft: 4, fontSize: 12, color: "var(--ink-mute)" }}>
                        ({u.name})
                      </span>
                    )}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-mute)" }}>
                    {u.email} · userId {u.id}
                    {u.role && ` · 단체 ${u.role}`}
                  </p>
                </div>
                {u.id === currentOrganizerId && (
                  <span
                    style={{
                      flexShrink: 0,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--ink-mute)",
                      background: "var(--bg)",
                    }}
                  >
                    현 주최자
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 변경 사유 (transfer 액션만) */}
      {selected && action === "transfer" && (
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-soft)",
            }}
          >
            변경 사유 (필수, 최소 5자)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="예: 기존 주최자 부재로 신규 협회 담당자 이관"
            className="ts-input"
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>
      )}

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--ok)",
            background: "var(--ok-weak)",
            color: "var(--ok)",
            fontSize: 14,
          }}
        >
          <Icon name="check-circle" size={16} color="var(--ok)" />
          {success}
        </div>
      )}
      {error && (
        <p style={{ margin: 0, fontSize: 14, color: "var(--danger)" }}>{error}</p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          type="submit"
          disabled={submitting || !selected || !hasOrganization}
          className="ts-btn ts-btn--primary"
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
