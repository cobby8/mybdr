/**
 * JumpBallModal — PR-Possession-2 (2026-05-16).
 *
 * 왜 (이유):
 *   FIBA Article 12 (Alternating Possession) — 경기 시작 시 점프볼 (Opening Jump Ball)
 *   1회 발생. 승자 팀이 첫 점유권을 가지며, 패자 팀 방향으로 공격권 화살표가 향함
 *   (= 다음 헬드볼 발생 시 패자 팀이 공격권 획득).
 *
 *   라인업 confirm 직후 자동 open → 운영자가 승자 팀 + 점프볼 승리 선수 선택 →
 *   applyOpeningJumpBall 호출 (PR-1 helper) → 화살표 박제.
 *
 * 사용자 결재 (PR-2 진입 전):
 *   - 위치: 라인업 confirm 후 (handleLineupConfirm trigger)
 *   - 단계 1: 팀 선택 (Team A / Team B 2 버튼)
 *   - 단계 2: 선택 팀의 라인업(starters+substitutes) 중 1인 선택 (null 허용)
 *   - "확정" → onConfirm(winner, winnerPlayerId)
 *
 * 절대 룰 (시안 13 룰):
 *   - var(--color-*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ — 강조 = bold + var(--color-info) (빨강 금지)
 *   - 터치 영역 44px+
 *   - 4종 모달 UX 패턴 정합 (ESC + backdrop + sm:flex-row footer + 모바일 stack)
 *   - 인쇄 시 `.no-print` 클래스로 모달 제거
 */

"use client";

import { useEffect, useState } from "react";
import type { RosterItem } from "./team-section-types";

interface JumpBallModalProps {
  open: boolean;
  homeTeamName: string;
  awayTeamName: string;
  // 라인업 confirm 결과의 starters + substitutes 합집합 (= 출전 명단)
  homePlayers: RosterItem[];
  awayPlayers: RosterItem[];
  // 승자 팀 + 승리 선수 (선수 미선택 = null 허용 — 운영 fallback)
  onConfirm: (winner: "home" | "away", winnerPlayerId: string | null) => void;
  onClose: () => void;
}

export function JumpBallModal({
  open,
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
  onConfirm,
  onClose,
}: JumpBallModalProps) {
  // 단계 1: 점프볼 승자 팀 (Team A = home / Team B = away)
  //   null = 미선택 상태 (단계 1 진행 중) — 단계 2 버튼 비활성
  const [winner, setWinner] = useState<"home" | "away" | null>(null);
  // 단계 2: 승자 팀의 선수 1인 (null = 선수 미선택 — 운영 fallback 허용)
  const [winnerPlayerId, setWinnerPlayerId] = useState<string | null>(null);

  // open 토글 시 초기 상태 재설정 (모달 재오픈 시 이전 선택 잔존 방지)
  useEffect(() => {
    if (open) {
      setWinner(null);
      setWinnerPlayerId(null);
    }
  }, [open]);

  // ESC 키 = 닫기 (4종 모달 패턴 일관)
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  // winner === null 시 = 단계 1 진행 중 = 확정 비활성 (선수 선택은 옵셔널 — 팀만 필수)
  const canConfirm = winner !== null;

  // 단계 2 dropdown 박제 — 승자 팀이 home/away 인지에 따라 분기
  const players = winner === "home" ? homePlayers : winner === "away" ? awayPlayers : [];
  const winnerTeamName = winner === "home" ? homeTeamName : winner === "away" ? awayTeamName : "";

  function handleConfirm() {
    if (!canConfirm) return;
    // winner 는 canConfirm 가드로 null 제외 (TS narrowing)
    onConfirm(winner!, winnerPlayerId);
  }

  return (
    // 4종 모달 UX 패턴 — ESC + backdrop click + 인쇄 차단 (`no-print`)
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "color-mix(in srgb, #000 60%, transparent)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="jump-ball-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-4"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        // 내부 클릭 시 backdrop 전파 차단 (4종 모달 패턴)
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 제목 + 우측 X 닫기 버튼 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h2
              id="jump-ball-modal-title"
              className="text-base font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              경기 시작 점프볼
            </h2>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              점프볼 승리 팀을 선택해주세요. 승리 팀이 첫 공격권을 가지며,
              공격권 화살표는 패배 팀 방향으로 향합니다 (FIBA Article 12).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="모달 닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center"
            style={{
              color: "var(--color-text-muted)",
              touchAction: "manipulation",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              close
            </span>
          </button>
        </div>

        {/* 단계 1: 점프볼 승자 팀 선택 — Team A / Team B 2 버튼 */}
        <section className="mt-4">
          <h3
            className="mb-2 text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            1. 점프볼 승자 팀
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {/* Team A (home) 버튼 — 선택 시 var(--color-accent) 강조 */}
            <button
              type="button"
              onClick={() => {
                setWinner("home");
                // 팀 변경 시 선수 선택 초기화 (다른 팀 선수 잔존 방지)
                setWinnerPlayerId(null);
              }}
              className="flex flex-col items-center justify-center px-3 py-3 text-sm font-semibold"
              style={{
                backgroundColor:
                  winner === "home"
                    ? "var(--color-accent)"
                    : "var(--color-surface)",
                color:
                  winner === "home"
                    ? "var(--color-on-accent, #fff)"
                    : "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                minHeight: 56,
                touchAction: "manipulation",
              }}
              aria-label={`Team A — ${homeTeamName} 점프볼 승리`}
              aria-pressed={winner === "home"}
            >
              <span className="text-xs opacity-80">Team A</span>
              <span className="mt-1 truncate">{homeTeamName}</span>
            </button>
            {/* Team B (away) 버튼 — 선택 시 var(--color-accent) 강조 */}
            <button
              type="button"
              onClick={() => {
                setWinner("away");
                setWinnerPlayerId(null);
              }}
              className="flex flex-col items-center justify-center px-3 py-3 text-sm font-semibold"
              style={{
                backgroundColor:
                  winner === "away"
                    ? "var(--color-accent)"
                    : "var(--color-surface)",
                color:
                  winner === "away"
                    ? "var(--color-on-accent, #fff)"
                    : "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                minHeight: 56,
                touchAction: "manipulation",
              }}
              aria-label={`Team B — ${awayTeamName} 점프볼 승리`}
              aria-pressed={winner === "away"}
            >
              <span className="text-xs opacity-80">Team B</span>
              <span className="mt-1 truncate">{awayTeamName}</span>
            </button>
          </div>
        </section>

        {/* 단계 2: 점프볼 승리 선수 dropdown (옵셔널 — null 허용)
            winner === null = 비활성 / winner 박제 후 = 활성 */}
        <section className="mt-4">
          <h3
            className="mb-2 text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            2. 점프볼 승리 선수
            <span
              className="ml-2 text-xs font-normal"
              style={{ color: "var(--color-text-muted)" }}
            >
              (선택 사항)
            </span>
          </h3>
          {winner === null ? (
            // 팀 미선택 상태 = dropdown 비활성 안내
            <p
              className="py-3 text-center text-xs"
              style={{
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              점프볼 승자 팀을 먼저 선택해주세요.
            </p>
          ) : (
            <>
              <p
                className="mb-1 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {winnerTeamName} 에서 점프볼을 잡은 선수 (생략 가능)
              </p>
              <select
                value={winnerPlayerId ?? ""}
                onChange={(e) =>
                  setWinnerPlayerId(e.target.value === "" ? null : e.target.value)
                }
                className="w-full px-2 py-2 text-sm"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  // iOS 16px 룰 (모바일 자동 줌 방지)
                  fontSize: 16,
                  minHeight: 44,
                  touchAction: "manipulation",
                }}
                aria-label="점프볼 승리 선수 선택"
              >
                {/* 첫 옵션 = null (미선택) — 운영 fallback 허용 */}
                <option value="">— 선택 안 함 —</option>
                {players.map((p) => (
                  <option
                    key={p.tournamentTeamPlayerId}
                    value={p.tournamentTeamPlayerId}
                  >
                    {p.jerseyNumber !== null ? `#${p.jerseyNumber} ` : ""}
                    {p.displayName}
                    {p.isStarter ? " (선발)" : ""}
                  </option>
                ))}
              </select>
            </>
          )}
        </section>

        {/* 버튼 영역 — 4종 모달 패턴 (모바일 column / 데스크탑 sm:flex-row) */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              touchAction: "manipulation",
            }}
            aria-label="점프볼 선택 취소"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 py-3 text-sm font-semibold disabled:opacity-40"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-on-accent, #fff)",
              border: "1px solid var(--color-border)",
              touchAction: "manipulation",
            }}
            aria-label={
              canConfirm
                ? "점프볼 승자 확정"
                : "점프볼 승자 확정 — 팀 선택 필요"
            }
          >
            확정
          </button>
        </div>
      </div>
    </div>
  );
}
