/**
 * FoulTypeModal — 파울 종류 (P/T/U/D) 선택 모달.
 *
 * 2026-05-12 — Phase 3.5 신규.
 *
 * 왜 (이유):
 *   FIBA Article 36-39 = 4 종류 (Personal / Technical / Unsportsmanlike / Disqualifying).
 *   기존 Phase 3 = "다음 빈 칸 자동 채움" 단순 토글이라 종류 분기 미지원 → 사용자 결재 §1
 *   에서 4 종류 모달 진입 결정. Article 41 5반칙 룰 정확 적용을 위해 type 별 카운트가
 *   필수 → 종류 입력 강제.
 *
 * 방법 (어떻게):
 *   - 파울 빈 칸 클릭 → 모달 open (선택 시 type 결정)
 *   - 4 큰 버튼 (60px+ 터치 — 사용자 결재 §2):
 *       P (Personal) — 회색 — 가장 흔함
 *       T (Technical) — warning (노랑/주황) — 비스포츠
 *       U (Unsportsmanlike) — accent (주황/빨강 계열) — 거친 행동
 *       D (Disqualifying) — primary (BDR Red) — 즉시 퇴장 (위험 액션 = 빨강 예외 허용)
 *   - 각 버튼 클릭 → onSelect(type) + close
 *   - ESC / 외부 클릭 = onCancel
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ — D 버튼 배경 빨강 = 위험 액션 (예외 허용)
 *   - 터치 영역 44px+ (실제 60px+ — 4 종류 정확 선택)
 */

"use client";

import { useEffect } from "react";
import type { FoulType } from "@/lib/score-sheet/foul-types";
import { FOUL_TYPE_LABEL } from "@/lib/score-sheet/foul-types";

interface FoulTypeModalProps {
  // 모달 표시 여부 — false 면 null 반환 (DOM 미마운트)
  open: boolean;
  // 컨텍스트 (선수명 + Period — 사용자 인지)
  playerName: string;
  jerseyNumber: number | null;
  period: number;
  // 종류 선택 콜백 — 부모가 addFoul 호출
  onSelect: (type: FoulType) => void;
  // 취소 (ESC / 외부 클릭 / 닫기 버튼)
  onCancel: () => void;
}

// 종류별 버튼 스타일 매핑 (var(--*) 토큰만)
//
// 이유: 시각적 우선순위 = P (회색, 가장 흔함) → T/U (warning/accent) → D (primary 빨강, 즉시 퇴장)
// D 빨강 = 위험 액션 강조 (사용자 결재 — 빨강 본문 텍스트 금지의 예외)
const TYPE_BUTTON_STYLES: Record<
  FoulType,
  { bg: string; color: string; description: string }
> = {
  P: {
    bg: "var(--color-elevated)",
    color: "var(--color-text-primary)",
    description: "신체 접촉 (가장 흔함)",
  },
  T: {
    bg: "color-mix(in srgb, var(--color-warning) 20%, transparent)",
    color: "var(--color-warning)",
    description: "비스포츠 행위",
  },
  U: {
    bg: "color-mix(in srgb, var(--color-accent) 25%, transparent)",
    color: "var(--color-accent)",
    description: "고의 거친 행동",
  },
  D: {
    // D = 위험 액션 (즉시 퇴장) → primary 빨강 배경 강조 (예외 허용)
    bg: "var(--color-primary)",
    color: "#fff",
    description: "즉시 퇴장",
  },
};

const FOUL_TYPES: FoulType[] = ["P", "T", "U", "D"];

export function FoulTypeModal({
  open,
  playerName,
  jerseyNumber,
  period,
  onSelect,
  onCancel,
}: FoulTypeModalProps) {
  // ESC 키 = 취소 (모달 표준)
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
    // 백드롭 — 외부 클릭 = 취소.
    // Phase 6 — `no-print` 클래스 = 인쇄 시 모달 완전히 제거 (FIBA 양식 정합).
    //   모달은 운영 중 일시 노출 — 인쇄 시점에 열려있어도 종이엔 인쇄 안 됨.
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "color-mix(in srgb, #000 60%, transparent)" }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="foul-type-modal-title"
    >
      {/* 모달 본체 — 클릭 전파 차단 */}
      <div
        className="w-full max-w-sm rounded-[4px] p-4"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 컨텍스트 표시 */}
        <div className="mb-3">
          <h2
            id="foul-type-modal-title"
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            파울 종류 선택
          </h2>
          <p
            className="mt-1 text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {jerseyNumber !== null ? `#${jerseyNumber} ` : ""}
            {playerName}
            <span
              className="ml-2 text-xs font-normal"
              style={{ color: "var(--color-text-muted)" }}
            >
              · Period {period}
            </span>
          </p>
        </div>

        {/* 4 큰 버튼 — 60px+ 터치 영역 */}
        <div className="grid grid-cols-2 gap-2">
          {FOUL_TYPES.map((type) => {
            const style = TYPE_BUTTON_STYLES[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelect(type)}
                // 터치 영역 60px+ (사용자 결재 §2 Phase 3.5)
                className="flex min-h-[64px] flex-col items-center justify-center rounded-[4px] px-2 py-3 text-center transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: style.bg,
                  color: style.color,
                  border: "1px solid var(--color-border)",
                  touchAction: "manipulation",
                }}
                aria-label={`${FOUL_TYPE_LABEL[type]} 파울 선택`}
              >
                <span className="text-xl font-bold">{type}</span>
                <span className="mt-0.5 text-[10px] font-medium">
                  {FOUL_TYPE_LABEL[type]}
                </span>
                <span className="mt-0.5 text-[9px] opacity-80">
                  {style.description}
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
            aria-label="파울 종류 선택 취소"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
