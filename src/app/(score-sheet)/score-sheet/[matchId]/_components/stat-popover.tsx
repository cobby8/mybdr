/**
 * StatPopover — Phase 19 PR-Stat2 (2026-05-15).
 *
 * 왜 (이유):
 *   FIBA 종이기록지 player row 안 OR/DR/A/S/B/TO 6 stat cell 을 클릭 시 +1/-1 옵션 popover 표시.
 *   사용자 결재 Q2 = 신규 StatPopover 컴포넌트 (모달 아닌 popover — 빠른 입력).
 *   기존 4종 모달 (FoulType / PlayerSelect / LineupSelection / QuarterEnd) 패턴은 큰 dialog →
 *   stat 6 cell 마다 모달 진입은 무거움. popover = 빠른 +1/-1 + 외부 클릭 자동 닫기.
 *
 * 방법 (어떻게):
 *   - fixed 오버레이 backdrop 클릭 = onClose (모달 패턴 일관)
 *   - 본체 = 가운데 정렬 작은 popover (overlay 위)
 *   - [+1] [-1] 2 버튼 (사용자 결재 Q2 — 추가 옵션 없음)
 *   - currentValue=0 시 -1 disabled (음수 차단 — helper removeStat 의 min 0 룰 시각)
 *   - 모바일 터치 영역 44px+ (룰 13)
 *   - var(--pap-*) 토큰 + var(--color-*) 토큰 (운영 score-sheet 토큰 일관)
 *   - radius 4px (디자인 시스템 default)
 *
 * 운영 동작 보존:
 *   - 4종 모달 패턴 (open / playerId / onClose) 일관
 *   - 인쇄 차단 (.no-print) — FIBA 양식 정합
 *   - ESC 키 = onClose (4종 모달 일관)
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌
 *   - 터치 영역 44px+ (사용자 결재 의뢰서 명시)
 *   - 정사각형 (W=H) 원형은 50% 사용 (9999px 회피 룰)
 */

"use client";

import { useEffect } from "react";
import type { StatKey } from "@/lib/score-sheet/player-stats-types";

// stat key → 화면 라벨 매핑 (FIBA 표준)
const STAT_LABELS: Record<StatKey, { code: string; name: string }> = {
  or: { code: "OR", name: "Offensive Rebound" },
  dr: { code: "DR", name: "Defensive Rebound" },
  a: { code: "A", name: "Assist" },
  s: { code: "S", name: "Steal" },
  b: { code: "B", name: "Block" },
  to: { code: "TO", name: "Turnover" },
};

export interface StatPopoverProps {
  open: boolean;
  // 컨텍스트 박제 — 헤더 표시용
  playerName: string;
  jerseyNumber: number | null;
  // 클릭한 cell 의 stat 종류 + 현재 카운트
  statKey: StatKey;
  currentValue: number;
  // +1 / -1 액션
  onAdd: () => void;
  onRemove: () => void;
  // ESC / backdrop / 외부 클릭
  onClose: () => void;
}

export function StatPopover({
  open,
  playerName,
  jerseyNumber,
  statKey,
  currentValue,
  onAdd,
  onRemove,
  onClose,
}: StatPopoverProps) {
  // ESC 키 = onClose (4종 모달 패턴 일관)
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

  const label = STAT_LABELS[statKey];
  // -1 disabled: 현재 0 = 음수 차단 (helper removeStat min 0 룰 시각)
  const removeDisabled = currentValue <= 0;

  return (
    // 인쇄 시 popover 제거 — FIBA 양식 정합
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        backgroundColor: "color-mix(in srgb, #000 50%, transparent)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stat-popover-title"
      // backdrop 클릭 = 닫기 (4종 모달 패턴 일관)
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs p-3"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
        }}
        // 내부 클릭 = backdrop 전파 차단
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 컨텍스트 (선수 + 등번호 + stat 종류) */}
        <div className="mb-2">
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            {label.code} · {label.name}
          </div>
          <div
            id="stat-popover-title"
            className="mt-0.5 text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {jerseyNumber !== null ? `#${jerseyNumber} ` : ""}
            {playerName}
          </div>
        </div>

        {/* 현재 카운트 표시 — 운영자가 +1/-1 클릭 전 인지 */}
        <div
          className="mb-2 flex items-center justify-between text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span>현재</span>
          <span
            className="font-mono text-base font-bold"
            style={{ color: "var(--color-text-primary)" }}
            aria-label={`현재 카운트 ${currentValue}`}
          >
            {currentValue}
          </span>
        </div>

        {/* +1 / -1 2 버튼 — 사용자 결재 Q2 (옵션 정확히 2건) */}
        <div className="flex gap-2">
          {/* +1 버튼 — primary 강조 */}
          <button
            type="button"
            onClick={onAdd}
            className="flex-1 py-3 text-sm font-bold"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-on-accent, #fff)",
              border: "1px solid var(--color-accent)",
              borderRadius: "4px",
              touchAction: "manipulation",
              minHeight: "44px",
            }}
            aria-label={`${label.name} +1`}
          >
            +1
          </button>
          {/* -1 버튼 — currentValue=0 시 disabled */}
          <button
            type="button"
            onClick={onRemove}
            disabled={removeDisabled}
            className="flex-1 py-3 text-sm font-bold"
            style={{
              backgroundColor: removeDisabled
                ? "var(--color-surface)"
                : "var(--color-background)",
              color: removeDisabled
                ? "var(--color-text-muted)"
                : "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              touchAction: "manipulation",
              minHeight: "44px",
              opacity: removeDisabled ? 0.5 : 1,
              cursor: removeDisabled ? "not-allowed" : "pointer",
            }}
            aria-label={`${label.name} -1 ${removeDisabled ? "(0 — 차감 불가)" : ""}`}
          >
            -1
          </button>
        </div>

        {/* 닫기 버튼 — 우하단 */}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs"
            style={{
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              touchAction: "manipulation",
            }}
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
