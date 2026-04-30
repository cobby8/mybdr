"use client";

// StarRating — 별점 표시/입력 컴포넌트
// 이유: GameReport 등 여러 화면에서 별점 UI가 필요. onChange 유무로 readonly/interactive를 자동 분기하여
//        호출부 코드를 단순화한다. 시안 색상 변수(var(--accent), var(--ink-dim))를 그대로 사용해
//        다크/라이트 테마에 자동으로 따라가도록 inline style을 채택한다.

import { ReactElement, useState } from "react";

export interface StarRatingProps {
  // 0 ~ max 사이 값. 소수점은 디스플레이 모드에서만 의미가 있음.
  value: number;
  // 변경 콜백. 미지정 시 readonly로 동작.
  onChange?: (next: number) => void;
  // 최대 별 개수. 기본 5.
  max?: number;
  // 별 크기. sm=16 / md=24(기본) / lg=32 px.
  size?: "sm" | "md" | "lg";
  // 좌측 라벨 (예: "경기력")
  label?: string;
  // 우측에 숫자값(소수점 1자리) 표시 여부. 기본 false.
  showValue?: boolean;
  // 빈 별 색. 기본 var(--ink-dim).
  emptyColor?: string;
  // 채운 별 색. 기본 var(--accent).
  fillColor?: string;
  // 외부 컨테이너 className 패스스루.
  className?: string;
}

// 사이즈 토큰 → 픽셀 매핑. 디자인 토큰처럼 한 곳에 모아둠.
const SIZE_MAP = { sm: 16, md: 24, lg: 32 } as const;

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  label,
  showValue = false,
  emptyColor = "var(--ink-dim)",
  fillColor = "var(--accent)",
  className,
}: StarRatingProps): ReactElement {
  // onChange가 있으면 인터랙티브 모드. 이게 button vs span 분기의 단일 진실.
  const isInteractive = typeof onChange === "function";

  // hover/focus 중인 별의 인덱스(1-based). null이면 실제 value를 표시.
  // readonly에선 사용되지 않지만, 훅 순서 안정성을 위해 항상 호출.
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // 표시 기준 값: hover 중이면 hover 값, 아니면 실제 value.
  const displayValue = hoverValue ?? value;

  const iconSize = SIZE_MAP[size];

  // [1, 2, ..., max] 인덱스 생성.
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      {label && (
        <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>{label}</span>
      )}
      <div
        style={{ display: "inline-flex", gap: 2 }}
        // 마우스가 별 그룹을 벗어나면 hover preview 해제.
        onMouseLeave={() => setHoverValue(null)}
        // ARIA: 인터랙티브일 때만 radiogroup 역할 부여.
        role={isInteractive ? "radiogroup" : undefined}
        aria-label={label ?? "별점"}
      >
        {stars.map((n) => {
          // displayValue 이하 인덱스는 채워진 별로 표시.
          const filled = n <= displayValue;

          // 별 글리프(공통). interactive에선 button, readonly에선 span으로 감싼다.
          const Star = (
            <span
              style={{
                fontSize: iconSize,
                color: filled ? fillColor : emptyColor,
                lineHeight: 1,
                // hover 중인 별만 살짝 확대 — 마이크로 인터랙션.
                transition: "color 0.15s ease, transform 0.15s ease",
                transform:
                  isInteractive && hoverValue === n ? "scale(1.15)" : "scale(1)",
              }}
              aria-hidden="true"
            >
              ★
            </span>
          );

          // readonly 모드: 단순 span. 키보드 포커스/클릭 불가.
          if (!isInteractive) {
            return <span key={n}>{Star}</span>;
          }

          // interactive 모드: button + ARIA radio.
          // 같은 별을 다시 클릭하면 0(해제) — 토글 UX.
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange!(n === value ? 0 : n)}
              onMouseEnter={() => setHoverValue(n)}
              onFocus={() => setHoverValue(n)}
              onBlur={() => setHoverValue(null)}
              role="radio"
              aria-checked={n === value}
              aria-label={`${n}점${value === n ? " (선택됨)" : ""}`}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                // 버튼 기본 폰트 상속 차단(★ 글리프 크기는 내부 span이 결정).
                font: "inherit",
                color: "inherit",
                lineHeight: 0,
              }}
            >
              {Star}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 13,
            color: "var(--ink-mute)",
          }}
        >
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
