"use client";

/**
 * 2026-05-05 Phase 1 PR4 — 매치 임시 jersey 번호 운영자 모달 (W1)
 *
 * 사용처: 라이브 페이지 헤더 "임시 번호" 버튼 클릭 시 노출 (운영자만).
 *
 * 기능:
 *  - 선수 dropdown (home + away 합산, 매치 시점 jersey 우선순위 표시)
 *    우선순위 = override(현재 적용 중) → ttp.jersey_number → "-"
 *  - 새 번호 input (0~99 정수)
 *  - 같은 매치 사용 중 jersey 표시 ("사용 중: #1, #5, #10")
 *  - 사유 textarea (예: "유니폼 미지참 / 빌림")
 *  - 저장 → POST /api/web/tournaments/[id]/matches/[matchId]/jersey-override
 *  - 성공 시 모달 닫기 + 부모 onSuccess 콜백 (라이브 페이지 fetchMatch refetch)
 *
 * 권한 검증: API 가 단일 source. 모달은 단순 form.
 *   라이브 페이지가 admin-check 통과한 운영자에게만 버튼 노출 → 모달 진입.
 */

import { useState, useEffect, useMemo } from "react";

interface PlayerRow {
  id: number;
  jersey_number: number | null;
  name: string;
  team_id: number;
}

export interface MatchJerseyOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 라이브 페이지 응답 그대로 전달 (snake_case, 변환 안 함)
  tournamentId: string;
  matchId: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  homePlayers: PlayerRow[];
  awayPlayers: PlayerRow[];
  // 저장 성공 시 부모 호출 — 라이브 페이지가 fetchMatch() 재호출하여 새 jersey 반영
  onSuccess?: () => void;
}

export function MatchJerseyOverrideModal({
  isOpen,
  onClose,
  tournamentId,
  matchId,
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  onSuccess,
}: MatchJerseyOverrideModalProps) {
  // 모달 내부 폼 상태 — 닫을 때 reset
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [jerseyInput, setJerseyInput] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 모달 닫힐 때 폼 초기화 (재오픈 시 클린 상태 보장)
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlayerId(null);
      setJerseyInput("");
      setReason("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  // 사용 중 jersey 목록 — 양 팀 합산 (현재 라이브 응답 기준).
  // 운영자에게 충돌 사전 안내용 (정확한 final 검증은 서버 UNIQUE).
  const usedJerseys = useMemo(() => {
    const list: number[] = [];
    for (const p of [...homePlayers, ...awayPlayers]) {
      if (p.jersey_number != null) list.push(p.jersey_number);
    }
    // 정렬 + 중복 제거 (같은 번호 중복 시 표시는 1번만)
    return Array.from(new Set(list)).sort((a, b) => a - b);
  }, [homePlayers, awayPlayers]);

  // 선택된 선수의 현재 jersey (안내 표시용)
  const selectedPlayer = useMemo(() => {
    if (selectedPlayerId == null) return null;
    return (
      homePlayers.find((p) => p.id === selectedPlayerId) ??
      awayPlayers.find((p) => p.id === selectedPlayerId) ??
      null
    );
  }, [selectedPlayerId, homePlayers, awayPlayers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedPlayerId == null) {
      setErrorMsg("선수를 선택하세요.");
      return;
    }
    const num = Number(jerseyInput);
    if (!Number.isInteger(num) || num < 0 || num > 99) {
      setErrorMsg("등번호는 0~99 정수여야 합니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/matches/${matchId}/jersey-override`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournamentTeamPlayerId: selectedPlayerId,
            jerseyNumber: num,
            reason: reason.trim() || undefined,
          }),
        },
      );

      if (!res.ok) {
        // 충돌 / 권한 / 검증 — 서버 메시지 그대로 노출
        let msg = "저장에 실패했습니다.";
        try {
          const data = await res.json();
          if (typeof data.error === "string") msg = data.error;
        } catch {
          // 파싱 실패 — 기본 메시지
        }
        setErrorMsg(msg);
        return;
      }

      setSuccessMsg("임시 번호가 저장되었습니다.");
      // 부모에 알림 → 라이브 페이지 refetch
      onSuccess?.();
      // 0.6초 뒤 자동 close (사용자가 success 메시지 인지)
      setTimeout(() => {
        onClose();
      }, 600);
    } catch {
      setErrorMsg("네트워크 오류입니다. 잠시 후 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="매치 임시 번호 등록"
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        // 백드롭 클릭 시 닫기 (모달 본체 클릭은 stopPropagation)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-md p-5 shadow-lg"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 제목 + 닫기 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">매치 임시 번호 등록</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="px-2 py-1 rounded-md hover:bg-[var(--color-elevated)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* 안내 — 매치 한정 적용 / 영구 변경 X */}
        <p
          className="text-xs mb-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          이 경기 한정으로 적용됩니다. 선수 본인의 기본 등번호는 변경되지
          않습니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 선수 dropdown — home + away 그룹 분리 표시 */}
          <div>
            <label
              htmlFor="player-select"
              className="block text-xs font-medium mb-1.5"
            >
              선수
            </label>
            <select
              id="player-select"
              value={selectedPlayerId ?? ""}
              onChange={(e) =>
                setSelectedPlayerId(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              required
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{
                backgroundColor: "var(--color-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="">선수 선택...</option>
              <optgroup label={`홈팀 — ${homeTeam.name}`}>
                {homePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`#${p.jersey_number ?? "-"} ${p.name}`}
                  </option>
                ))}
              </optgroup>
              <optgroup label={`원정팀 — ${awayTeam.name}`}>
                {awayPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`#${p.jersey_number ?? "-"} ${p.name}`}
                  </option>
                ))}
              </optgroup>
            </select>
            {selectedPlayer && (
              <p
                className="text-[11px] mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                현재 적용:{" "}
                {selectedPlayer.jersey_number != null
                  ? `#${selectedPlayer.jersey_number}`
                  : "없음"}
              </p>
            )}
          </div>

          {/* 새 번호 input */}
          <div>
            <label
              htmlFor="jersey-input"
              className="block text-xs font-medium mb-1.5"
            >
              새 등번호 (0~99)
            </label>
            <input
              id="jersey-input"
              type="number"
              min={0}
              max={99}
              step={1}
              value={jerseyInput}
              onChange={(e) => setJerseyInput(e.target.value)}
              required
              inputMode="numeric"
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{
                backgroundColor: "var(--color-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                // iOS 16px 룰 — 자동 줌 회피
                fontSize: "16px",
              }}
            />
            {usedJerseys.length > 0 && (
              <p
                className="text-[11px] mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                이 경기 사용 중:{" "}
                {usedJerseys.map((n) => `#${n}`).join(", ")}
              </p>
            )}
          </div>

          {/* 사유 textarea (선택) */}
          <div>
            <label
              htmlFor="reason-input"
              className="block text-xs font-medium mb-1.5"
            >
              사유 (선택)
            </label>
            <textarea
              id="reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="유니폼 미지참 / 빌림"
              className="w-full px-3 py-2 rounded-md text-sm resize-none"
              style={{
                backgroundColor: "var(--color-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                fontSize: "14px",
              }}
            />
          </div>

          {/* 에러 / 성공 메시지 — 서버 응답 그대로 노출 */}
          {errorMsg && (
            <div
              role="alert"
              className="text-xs px-3 py-2 rounded-md"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent)",
                color: "var(--color-error, #ef4444)",
              }}
            >
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div
              role="status"
              className="text-xs px-3 py-2 rounded-md"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-success, #10b981) 15%, transparent)",
                color: "var(--color-success, #10b981)",
              }}
            >
              {successMsg}
            </div>
          )}

          {/* 액션 버튼 — 취소 / 저장 (rounded 4px = BDR 토큰) */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm rounded"
              style={{
                backgroundColor: "var(--color-elevated)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded font-medium"
              style={{
                backgroundColor: "var(--color-primary, #E31B23)",
                color: "#fff",
                borderRadius: "4px",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
