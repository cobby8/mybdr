/**
 * ConfirmModal — Phase 23 PR6 (2026-05-15).
 *
 * 왜 (이유):
 *   Phase 23 PR3 가 draft vs DB 우선순위 사용자 선택용으로 inline `window.confirm()` 을 사용함.
 *   reviewer WARN 1건 = 운영 4종 모달 (FoulType / PlayerSelect / LineupSelection / QuarterEnd)
 *   과 다른 패턴 — UX 분기 / 시각 토큰 불일치 / 인쇄 시 차단 룰 부재.
 *   본 컴포넌트로 4종 모달 시각 정합 + score-sheet 전용 confirm 다이얼로그 통일.
 *
 * 방법 (어떻게):
 *   - options[] = 사용자가 선택 가능한 버튼 목록 (각 value / label / isPrimary / isDestructive)
 *   - onSelect(value) = 호출자가 선택값 받음 (Promise.resolve(value) 래핑 패턴 캡슐화 가능)
 *   - onClose() = 모달 닫기 (ESC / backdrop / 기본 닫기 흐름)
 *   - 시각: QuarterEndModal 패턴 토큰 정합 (var(--color-*) / 인쇄 차단 `.no-print` / 44px 터치)
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ — destructive 버튼만 `--color-primary` (위험 액션 예외)
 *   - 터치 영역 44px+
 *   - 인쇄 시 `no-print` 클래스로 모달 제거
 */

"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

/**
 * 모달 선택 옵션 1건.
 *
 * 룰:
 *   - value: 호출자 식별용 string (예: "draft" / "db" / "cancel")
 *   - label: 화면 라벨
 *   - isPrimary: true 시 강조 (primary 배경)
 *   - isDestructive: true 시 빨강 배경 (위험 액션 — 빨강 본문 텍스트 룰 예외)
 */
export interface ConfirmModalOption {
  value: string;
  label: string;
  isPrimary?: boolean;
  isDestructive?: boolean;
}

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  // ReactNode 로 받아 줄바꿈 / 강조 텍스트 자유롭게 렌더
  message: ReactNode;
  options: ConfirmModalOption[];
  onSelect: (value: string) => void;
  // ESC / backdrop / 외부 닫기 트리거. 옵션 0건 선택 = onClose 만 호출.
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  options,
  onSelect,
  onClose,
}: ConfirmModalProps) {
  // ESC 키 핸들러 — 4종 모달 패턴 일관
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

  return (
    // 인쇄 시 모달 제거 (.no-print 룰 일관)
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "color-mix(in srgb, #000 60%, transparent)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      // backdrop 클릭 = 닫기 (4종 모달 패턴 일관)
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-4"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        // 내부 클릭 = backdrop 전파 차단
        onClick={(e) => e.stopPropagation()}
      >
        {/* 제목 — 4종 모달 패턴 일관 (`text-base font-bold`) */}
        <h2
          id="confirm-modal-title"
          className="text-base font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>

        {/* 본문 메시지 — ReactNode 로 줄바꿈 / 강조 자유 렌더 */}
        <div
          className="mt-3 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {message}
        </div>

        {/* 버튼 영역 — QuarterEndModal 패턴 (모바일 column / 데스크탑 row) */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {options.map((opt) => {
            // 우선순위: destructive > primary > default
            const bgColor = opt.isDestructive
              ? "var(--color-primary)"
              : opt.isPrimary
                ? "var(--color-accent)"
                : "var(--color-surface)";
            const textColor =
              opt.isDestructive || opt.isPrimary
                ? "var(--color-on-accent, #fff)"
                : "var(--color-text-primary)";
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                className="flex-1 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  touchAction: "manipulation",
                  border: "1px solid var(--color-border)",
                }}
                aria-label={opt.label}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
