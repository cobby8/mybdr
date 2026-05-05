"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * TransferRequestModal — Phase 3 PR10+PR11
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 본인 이적 신청 흐름. 팀 페이지 로스터 본인 row 의 액션 메뉴에서
 *   "이적 신청" 클릭 → 모달 진입 → 새 팀 검색/선택 → POST /api/web/transfer-requests.
 *   양쪽 팀장 모두 승인 시 자동 이동 (PATCH state machine 끝점).
 *
 * UX:
 *  - 새 팀 검색 input + 자동완성 dropdown (debounce 250ms / 글자 수 ≥ 2)
 *  - 검색 API = `/api/web/teams/search?q=` (없으면 자동 fallback 내부 list 호출)
 *  - 사유 textarea (선택, 200자)
 *  - 안내 박스: "현 팀장 + 새 팀장 모두 승인 시 이적 완료. 한쪽이라도 거부 시 취소."
 *  - 신청 버튼 → POST → 성공 시 800ms 토스트 후 닫기 + router.refresh
 */

type Props = {
  fromTeamId: string;
  fromTeamName?: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // 부모 pending 상태 갱신 콜백
};

type TeamCandidate = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
};

export function TransferRequestModal({
  fromTeamId,
  fromTeamName,
  open,
  onClose,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<TeamCandidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamCandidate | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모달 열림 시 초기화
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCandidates([]);
    setSelectedTeam(null);
    setReasonInput("");
    setMessage(null);
  }, [open]);

  // 검색 debounce — query >= 2자 + 250ms
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setCandidates([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void searchTeams(query.trim());
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  async function searchTeams(q: string) {
    setSearchLoading(true);
    try {
      // 이유: 1차 = /api/web/teams/search 시도. 없으면 silent fallback (검색 결과 0).
      // 향후 검색 API 신설 시 별도 작업 0.
      const res = await fetch(`/api/web/teams/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        setCandidates([]);
        return;
      }
      const json = await res.json().catch(() => ({}));
      // apiSuccess envelope 또는 raw — 양쪽 모두 호환
      const list = (json?.data?.teams ?? json?.teams ?? []) as Array<{
        id: string | number | bigint;
        name: string;
        city?: string | null;
        district?: string | null;
      }>;
      const normalized: TeamCandidate[] = list
        .map((t) => ({
          id: String(t.id),
          name: t.name ?? "",
          city: t.city ?? null,
          district: t.district ?? null,
        }))
        // 현재 팀 자체는 후보에서 제외 (이적 의미 없음)
        .filter((t) => t.id !== fromTeamId);
      setCandidates(normalized.slice(0, 10));
    } catch {
      setCandidates([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function selectTeam(t: TeamCandidate) {
    setSelectedTeam(t);
    setQuery(t.name);
    setCandidates([]);
  }

  function clearSelection() {
    setSelectedTeam(null);
    setQuery("");
  }

  function close() {
    if (loading) return;
    onClose();
  }

  async function handleSubmit() {
    setMessage(null);

    if (!selectedTeam) {
      setMessage({ text: "이적할 팀을 선택해 주세요.", type: "error" });
      return;
    }
    if (selectedTeam.id === fromTeamId) {
      setMessage({ text: "이적할 팀은 현 팀과 달라야 합니다.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const reason = reasonInput.trim();
      const res = await fetch(`/api/web/transfer-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromTeamId,
          toTeamId: selectedTeam.id,
          ...(reason ? { reason } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          text: "이적 신청이 완료됐습니다. 양쪽 팀장 승인을 기다려 주세요.",
          type: "success",
        });
        onSuccess();
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 800);
      } else {
        const err = json?.error ?? json?.message ?? "오류가 발생했습니다.";
        setMessage({ text: err, type: "error" });
      }
    } catch {
      setMessage({ text: "네트워크 오류가 발생했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-request-modal-title"
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: 8,
          padding: 20,
          maxWidth: 500,
          width: "100%",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          id="transfer-request-modal-title"
          style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "var(--ink)" }}
        >
          이적 신청
        </h2>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
          현 팀:{" "}
          <strong style={{ color: "var(--ink)" }}>{fromTeamName ?? "현재 팀"}</strong>
        </p>

        {/* 안내 박스 — 양쪽 팀장 승인 흐름 설명 */}
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            marginBottom: 14,
            padding: "10px 12px",
            background: "var(--surface-2, var(--bg))",
            borderRadius: 4,
            borderLeft: "3px solid var(--info, #0079B9)",
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: "var(--ink)" }}>현 팀장 + 새 팀장 모두 승인</strong>해야 이적이
          완료됩니다. 한쪽이라도 거부하면 신청이 취소됩니다. 이적 완료 후 새 팀에서 등번호를 다시
          등록해 주세요.
        </div>

        {/* 새 팀 검색 / 선택 */}
        <label style={{ display: "block", marginBottom: 12, position: "relative" }}>
          <span
            style={{
              fontSize: 13,
              color: "var(--ink)",
              display: "block",
              marginBottom: 4,
            }}
          >
            이적할 팀 <span style={{ color: "var(--danger)" }}>*</span>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedTeam && e.target.value !== selectedTeam.name) {
                setSelectedTeam(null);
              }
            }}
            placeholder="팀명 2자 이상 입력"
            disabled={loading}
            className="input"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--ink)",
              fontSize: 14,
            }}
          />
          {/* 검색 결과 dropdown — selectedTeam 없을 때만 표시 */}
          {!selectedTeam && candidates.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 10,
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {candidates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTeam(t)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 13,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  {(t.city || t.district) && (
                    <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                      {[t.city, t.district].filter(Boolean).join(" ")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {!selectedTeam && query.trim().length >= 2 && !searchLoading && candidates.length === 0 && (
            <span style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 4, display: "block" }}>
              검색 결과가 없습니다.
            </span>
          )}
          {selectedTeam && (
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--ok, #16a34a)" }}>
              선택됨: <strong>{selectedTeam.name}</strong>{" "}
              <button
                type="button"
                onClick={clearSelection}
                disabled={loading}
                style={{
                  fontSize: 11,
                  marginLeft: 6,
                  padding: "2px 6px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 3,
                  cursor: "pointer",
                  color: "var(--ink-mute)",
                }}
              >
                변경
              </button>
            </div>
          )}
        </label>

        {/* 사유 textarea */}
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--ink)", display: "block", marginBottom: 4 }}>
            사유 (선택, 200자 이내)
          </span>
          <textarea
            maxLength={200}
            rows={3}
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="예) 활동 지역 이동 / 친한 친구가 있는 팀 / 더 잘 맞는 팀 분위기"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--ink)",
              fontSize: 13,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
            {reasonInput.trim().length}/200
          </span>
        </label>

        {message && (
          <p
            style={{
              fontSize: 12,
              marginBottom: 12,
              color: message.type === "success" ? "var(--ok)" : "var(--danger)",
            }}
          >
            {message.text}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="btn"
            style={{ minWidth: 80 }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedTeam}
            className="btn btn--primary"
            style={{ minWidth: 100, opacity: loading || !selectedTeam ? 0.7 : 1 }}
          >
            {loading ? "신청 중..." : "이적 신청"}
          </button>
        </div>
      </div>
    </div>
  );
}
