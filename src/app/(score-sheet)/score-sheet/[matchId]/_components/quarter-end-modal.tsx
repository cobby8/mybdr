/**
 * QuarterEndModal — Phase 7-C (2026-05-12).
 *
 * 왜 (이유):
 *   Q4 종료 시 자동 OT1 진입 = 운영 사고 (대부분 매치 OT 없음).
 *   사용자 결재 §5 §6: Q4 종료 시점 + OT 종료 시점에 "경기 종료" / "다음 진행" 2 버튼 분기.
 *   동점일 때 OT 강제 (FIBA 룰) — "경기 종료" 비활성.
 *
 * 동작:
 *   - mode="quarter4": Q4 종료 → 경기 종료 / 연장전 진행 (OT1 진입)
 *   - mode="overtime": OTn 종료 → 경기 종료 / 다음 OT 진행 (OTn+1)
 *   - 동점 (homeTotal === awayTotal) → "경기 종료" 비활성 (FIBA 룰)
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ — 종료 버튼은 primary (위험 액션 예외)
 *   - 터치 영역 44px+
 */

"use client";

import { useEffect } from "react";

interface QuarterEndModalProps {
  open: boolean;
  // Q4 종료인지 OT 종료인지 분기
  mode: "quarter4" | "overtime";
  // 현재 period (mode="overtime" 일 때 OT 라벨 산출용 — 5=OT1 / 6=OT2 / 7=OT3)
  currentPeriod: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTotal: number;
  awayTotal: number;
  // "경기 종료" 클릭 → caller 가 BFF submit (status=completed)
  onEndMatch: () => void;
  // "다음 진행" 클릭 → caller 가 currentPeriod++ (OT 진입 또는 다음 OT)
  // 룰: OT3 (period=7) 종료 시 = 더 이상 OT 진행 불가 → "다음 진행" 비활성 (caller 가 제어)
  onContinueToOvertime: () => void;
  onCancel?: () => void;
}

export function QuarterEndModal({
  open,
  mode,
  currentPeriod,
  homeTeamName,
  awayTeamName,
  homeTotal,
  awayTotal,
  onEndMatch,
  onContinueToOvertime,
  onCancel,
}: QuarterEndModalProps) {
  // ESC 키 = 취소 (모달 닫기)
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && onCancel) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  // 동점 = FIBA 룰 OT 강제 (사용자 결재 §6).
  // 이유: 농구는 동점으로 끝낼 수 없음 — OT 진행 필수.
  const isTie = homeTotal === awayTotal;

  // 현재 period 라벨 (종료될 period)
  const endedLabel =
    mode === "quarter4" ? "Q4" : `OT${currentPeriod - 4}`;

  // 다음 OT 라벨 ("다음 진행" 버튼)
  // - Q4 종료 → OT1
  // - OT1 종료 → OT2
  // - OT2 종료 → OT3
  // - OT5 종료 → 진행 불가 (PR-Stat3.7 — OT max 7 → 9 / OT5 확장 / 사용자 결재).
  const nextOtNumber = mode === "quarter4" ? 1 : currentPeriod - 4 + 1;
  const nextOtLabel = `OT${nextOtNumber}`;
  // PR-Stat3.7 (2026-05-15) — OT max 7 → 9 (OT5 까지 확장 / 무한 OT 차단).
  const canContinue = currentPeriod < 9;

  return (
    // Phase 7 — `no-print` = 인쇄 시 모달 제거
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "color-mix(in srgb, #000 60%, transparent)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quarter-end-modal-title"
    >
      <div
        className="w-full max-w-md p-4"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="quarter-end-modal-title"
          className="text-base font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {endedLabel} 종료
        </h2>

        {/* 점수 요약 */}
        <div
          className="mt-3 p-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 text-center">
              <div
                className="line-clamp-1 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {homeTeamName}
              </div>
              <div
                className="font-mono text-2xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {homeTotal}
              </div>
            </div>
            <div
              className="text-base font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              :
            </div>
            <div className="flex-1 text-center">
              <div
                className="line-clamp-1 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {awayTeamName}
              </div>
              <div
                className="font-mono text-2xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {awayTotal}
              </div>
            </div>
          </div>
        </div>

        {/* 동점 안내 */}
        {isTie && (
          <div
            className="mt-3 px-3 py-2 text-xs"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-warning) 15%, transparent)",
              color: "var(--color-warning)",
              border: "1px solid var(--color-warning)",
            }}
            aria-live="polite"
          >
            <span className="material-symbols-outlined mr-1 align-middle text-sm">
              warning
            </span>
            동점입니다. FIBA 룰에 따라 연장전(OT) 진행이 필요합니다.
          </div>
        )}

        {/* 안내 텍스트 */}
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isTie
            ? `${nextOtLabel} 진행 후 다시 종료 여부를 판단할 수 있습니다.`
            : `경기를 종료하거나 ${nextOtLabel} 으로 진행할 수 있습니다.`}
        </p>

        {/* 버튼 영역 — 2 버튼 (경기 종료 / 다음 진행) */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onEndMatch}
            // 동점 = 종료 불가 (FIBA 룰 OT 강제)
            disabled={isTie}
            className="flex-1 py-3 text-sm font-semibold disabled:opacity-30"
            style={{
              backgroundColor: isTie
                ? "var(--color-surface)"
                : "var(--color-primary)",
              color: isTie ? "var(--color-text-muted)" : "#fff",
              touchAction: "manipulation",
              border: "1px solid var(--color-border)",
            }}
            aria-label={
              isTie
                ? "경기 종료 (동점 — 비활성)"
                : "경기 종료 — 라이브 페이지에 발행"
            }
            aria-disabled={isTie}
          >
            <span className="material-symbols-outlined mr-1 align-middle text-base">
              flag
            </span>
            경기 종료
          </button>
          <button
            type="button"
            onClick={onContinueToOvertime}
            disabled={!canContinue}
            className="flex-1 py-3 text-sm font-semibold disabled:opacity-30"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-on-accent, #fff)",
              touchAction: "manipulation",
              border: "1px solid var(--color-border)",
            }}
            aria-label={
              canContinue
                ? `${nextOtLabel} 으로 진행`
                : `다음 OT 진행 불가 (OT${currentPeriod - 4} 최종)`
            }
            aria-disabled={!canContinue}
          >
            <span className="material-symbols-outlined mr-1 align-middle text-base">
              skip_next
            </span>
            {/* PR-Stat3.7 (2026-05-15) — 라벨 동적 (currentPeriod 기반). max OT5 시 "OT5 최종" 표시. */}
            {canContinue ? `${nextOtLabel} 진행` : `OT${currentPeriod - 4} 최종`}
          </button>
        </div>

        {/* 취소 (모달 닫기만 — period 진행 X) */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 w-full py-2 text-xs"
            style={{
              color: "var(--color-text-muted)",
              touchAction: "manipulation",
            }}
            aria-label="모달 닫기 (period 진행 안 함)"
          >
            나중에 결정 (모달 닫기)
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * QuarterEndModal 표시 여부 판정 헬퍼 — vitest 회귀 가드용 export.
 *
 * 룰:
 *   - period 1~3 종료 = 모달 X (자동 다음 period 진입)
 *   - period 4 (Q4) 종료 = mode="quarter4"
 *   - period 5+ (OTn) 종료 = mode="overtime"
 */
export function getQuarterEndMode(
  endedPeriod: number
): "quarter4" | "overtime" | null {
  if (endedPeriod === 4) return "quarter4";
  if (endedPeriod >= 5 && endedPeriod <= 7) return "overtime";
  return null;
}

/**
 * "경기 종료" 가능 여부 (동점 차단) — vitest 회귀 가드용 export.
 *
 * 룰: 동점 = FIBA 룰 OT 강제. 비동점 = 종료 가능.
 */
export function canEndMatchAtEnd(
  homeTotal: number,
  awayTotal: number
): boolean {
  return homeTotal !== awayTotal;
}
