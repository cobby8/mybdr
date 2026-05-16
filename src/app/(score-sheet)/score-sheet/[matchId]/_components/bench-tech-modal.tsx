/**
 * BenchTechModal — 코치 위반 종류 (C / B_HEAD / B_BENCH) 선택 모달.
 *
 * 2026-05-16 (긴급 박제 — FIBA Article 36.3 / 36.4 정확 룰 / 사용자 결재 권장안 100%).
 *
 * 왜 (이유):
 *   Coach row 우측 빈 cell 클릭 → 본 모달 open. 운영자가 위반 종류 선택:
 *     - "C"       = Head Coach 본인 위반 (Article 36.3)
 *     - "B_HEAD"  = Head Coach 본인 B 파울
 *     - "B_BENCH" = Asst Coach / 서브스티튜트 / 팔로워 위반 → Head 통계 가산 (Article 36.4)
 *   모두 Head Coach 통계 (head[]) 에 박제 — 누적 3건 = 추방.
 *
 * 방법 (어떻게):
 *   - 3 큰 버튼 (60px+ 터치 — foul-type-modal 패턴 일관)
 *   - C 버튼 = warning 톤 / B_HEAD 버튼 = accent 톤 / B_BENCH 버튼 = elevated 톤
 *   - ESC / 외부 클릭 = onCancel
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌
 *   - 터치 영역 44px+ (실제 64px+ — 3 종류 정확 선택)
 */

"use client";

import { useEffect } from "react";
import {
  type CoachFoulKind,
  COACH_FOUL_KIND_LABEL,
} from "@/lib/score-sheet/bench-tech-types";

interface BenchTechModalProps {
  /** 모달 표시 여부 — false 면 null 반환 (DOM 미마운트). */
  open: boolean;
  /** 컨텍스트 — 어느 팀의 코치 위반인지 (UI 헤더 표시). */
  teamLabel: string;
  /** 현재 진행 Period (모달 박제 시점). */
  period: number;
  /** 종류 선택 콜백 — 부모가 addCoachFoul 호출. */
  onSelect: (kind: CoachFoulKind) => void;
  /** 취소 (ESC / 외부 클릭 / 닫기 버튼). */
  onCancel: () => void;
}

// 종류별 버튼 스타일 매핑 (var(--*) 토큰만).
//   - C       = warning 톤 (Head Coach 직접 위반 — 경고 강조)
//   - B_HEAD  = accent 톤 (Head 본인 B — accent 차별)
//   - B_BENCH = elevated 톤 (Asst/벤치 위반 — 흔한 케이스 / 회색)
const KIND_BUTTON_STYLES: Record<
  CoachFoulKind,
  { bg: string; color: string; description: string; tag: string }
> = {
  C: {
    bg: "color-mix(in srgb, var(--color-warning) 22%, transparent)",
    color: "var(--color-warning)",
    description: "Head Coach 본인 위반",
    tag: "C",
  },
  B_HEAD: {
    bg: "color-mix(in srgb, var(--color-accent) 22%, transparent)",
    color: "var(--color-accent)",
    description: "Head Coach 본인 B 파울",
    tag: "B",
  },
  B_BENCH: {
    bg: "var(--color-elevated)",
    color: "var(--color-text-primary)",
    description: "Asst Coach / 벤치 인원",
    tag: "B",
  },
};

const KIND_ORDER: CoachFoulKind[] = ["C", "B_HEAD", "B_BENCH"];

export function BenchTechModal({
  open,
  teamLabel,
  period,
  onSelect,
  onCancel,
}: BenchTechModalProps) {
  // ESC 키 = 취소 (foul-type-modal 패턴 일관).
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "color-mix(in srgb, #000 60%, transparent)" }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bench-tech-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-[4px] p-4"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 컨텍스트 (어느 팀 / Period) */}
        <div className="mb-3">
          <h2
            id="bench-tech-modal-title"
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            벤치 테크니컬 박제
          </h2>
          <p
            className="mt-1 text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {teamLabel}
            <span
              className="ml-2 text-xs font-normal"
              style={{ color: "var(--color-text-muted)" }}
            >
              · Period {period}
            </span>
          </p>
          <p
            className="mt-1 text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            * 누적 3건 = Head Coach 추방 (어시 코치 인계).
          </p>
        </div>

        {/* 3 큰 버튼 — 64px+ 터치 영역 (foul-type-modal 패턴 일관). */}
        <div className="flex flex-col gap-2">
          {KIND_ORDER.map((kind) => {
            const style = KIND_BUTTON_STYLES[kind];
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onSelect(kind)}
                className="flex min-h-[64px] items-center gap-3 rounded-[4px] px-3 py-3 text-left transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: style.bg,
                  color: style.color,
                  border: "1px solid var(--color-border)",
                  touchAction: "manipulation",
                }}
                aria-label={`${COACH_FOUL_KIND_LABEL[kind]} 박제`}
              >
                {/* 종류 약자 — 큰 글자 */}
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-xl font-bold"
                  style={{
                    backgroundColor: "color-mix(in srgb, currentColor 18%, transparent)",
                  }}
                  aria-hidden="true"
                >
                  {style.tag}
                </span>
                {/* 라벨 + 설명 */}
                <span className="flex flex-col">
                  <span className="text-sm font-bold">
                    {COACH_FOUL_KIND_LABEL[kind]}
                  </span>
                  <span className="mt-0.5 text-[10px] opacity-80">
                    {style.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* 취소 버튼 */}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[4px] px-3 py-2 text-xs"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              touchAction: "manipulation",
            }}
            aria-label="벤치 테크니컬 선택 취소"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
