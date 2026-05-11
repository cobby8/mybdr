/**
 * PlayerSelectModal — Running Score 빈 칸 1탭 시 노출되는 풀스크린 선수 선택 모달.
 *
 * 2026-05-12 — Phase 2 신규.
 *
 * 왜 (이유):
 *   FIBA 양식 Running Score 칸 자체는 약 48×22 px (768×1024 viewport 정합).
 *   터치 룰 44px+ 위반 → 모달로 풀스크린 선수 큰 버튼 (60px+ row) 전환 — UX 보완.
 *
 * 방법 (어떻게):
 *   - props: open / team / players (12명) / inferredPoints / onSelect / onClose
 *   - body: 점수 종류 안내 (1점/2점/3점) + 선수 12 큰 버튼 그리드 (3 col × 4 row)
 *   - Esc / 외부 영역 클릭 / 좌상단 "취소" 버튼 모두 onClose
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ / 강조 = var(--color-accent)
 *   - 터치 영역 44px+ (큰 버튼 60px row)
 */

"use client";

import { useEffect } from "react";
import type { RosterItem } from "./team-section-types";

interface PlayerSelectModalProps {
  open: boolean;
  team: "home" | "away";
  teamName: string;
  // 출전 가능 선수 (TeamSection 의 playerIn 체크 기준 — caller 가 필터링)
  // 다만 사용자가 playerIn 체크 안 했어도 득점 가능 (UX 우선) — caller 가 필터 안 함
  players: RosterItem[];
  // 추론된 점수 (마지막 마킹 + 새 클릭 칸 차이 = 1/2/3)
  inferredPoints: 1 | 2 | 3 | null;
  // 클릭된 칸 번호 (1~160) — 사용자 컨텍스트 안내
  newPosition: number | null;
  onSelect: (playerId: string) => void;
  onClose: () => void;
}

export function PlayerSelectModal({
  open,
  team,
  teamName,
  players,
  inferredPoints,
  newPosition,
  onSelect,
  onClose,
}: PlayerSelectModalProps) {
  // ESC 키 닫기
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const pointsLabel =
    inferredPoints === 1
      ? "1점 (자유투)"
      : inferredPoints === 2
        ? "2점 (필드골)"
        : inferredPoints === 3
          ? "3점 (3점슛)"
          : "점수";

  return (
    <div
      // 풀스크린 오버레이 — 외부 클릭 시 닫기.
      // Phase 6 — `no-print` = 인쇄 시 모달 완전히 제거 (FIBA 양식 정합).
      className="no-print fixed inset-0 z-50 flex items-stretch justify-stretch"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${teamName} 득점 선수 선택`}
    >
      <div
        // 모달 본체 — 클릭 전파 차단
        className="m-auto flex max-h-[92vh] w-[min(540px,94vw)] flex-col rounded-[8px] shadow-2xl"
        style={{
          backgroundColor: "var(--color-bg)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 점수 종류 + 닫기 */}
        <div
          className="flex items-center justify-between rounded-t-[8px] px-4 py-3"
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="flex flex-col">
            <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              {team === "home" ? "TEAM A" : "TEAM B"} — {teamName}
            </div>
            <div
              className="mt-0.5 flex items-center gap-2 text-base font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              <span
                className="inline-flex items-center justify-center rounded-[4px] px-2 py-0.5 text-sm"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "white",
                }}
              >
                {pointsLabel}
              </span>
              {newPosition !== null && (
                <span className="text-sm text-[var(--color-text-muted)]">
                  칸 #{newPosition}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            // 터치 영역 44px+ 보장
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-[4px] px-3 text-sm font-medium"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              touchAction: "manipulation",
            }}
            aria-label="취소"
          >
            <span className="material-symbols-outlined text-base">close</span>
            <span className="ml-1">취소</span>
          </button>
        </div>

        {/* 본문 — 선수 큰 버튼 그리드 */}
        <div className="flex-1 overflow-y-auto p-3">
          {players.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-[var(--color-text-muted)]">
              선수 명단이 비어있습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {players.map((p) => (
                <button
                  key={p.tournamentTeamPlayerId}
                  type="button"
                  onClick={() => onSelect(p.tournamentTeamPlayerId)}
                  // 큰 버튼 — 터치 영역 60px (룰 13 초과 충족)
                  className="flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-[4px] px-2 py-2 text-center"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    touchAction: "manipulation",
                  }}
                >
                  <div
                    className="text-2xl font-bold leading-none"
                    // 등번호 강조 = accent (BDR Red — 강조용)
                    style={{ color: "var(--color-accent)" }}
                  >
                    {p.jerseyNumber ?? "-"}
                  </div>
                  <div className="line-clamp-1 text-xs leading-tight">
                    {p.displayName}
                  </div>
                  {p.isStarter && (
                    <div className="text-[10px] text-[var(--color-text-muted)]">
                      ◉ 주전
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 안내 */}
        <div
          className="rounded-b-[8px] px-4 py-2 text-[11px]"
          style={{
            backgroundColor: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          ※ FIBA 양식 — 칸 위치 차이로 1/2/3점 자동 추론. 잘못 선택했다면
          모달 닫고 마지막 마킹 칸을 다시 탭하면 해제됩니다.
        </div>
      </div>
    </div>
  );
}
