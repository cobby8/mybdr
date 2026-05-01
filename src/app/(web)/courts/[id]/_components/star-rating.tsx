"use client";

/**
 * StarRating -- 별점 입력/표시 공용 컴포넌트
 *
 * - value: 현재 별점 (1~5)
 * - onChange: 클릭 시 값 변경 (없으면 읽기 전용)
 * - size: 별 아이콘 크기 (px)
 */

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  // 읽기 전용 여부: onChange가 없으면 클릭 불가
  const isReadonly = !onChange;

  return (
    <span className="inline-flex items-center gap-0.5">
      {/* 1~5까지 5개의 별을 렌더링 */}
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`material-symbols-outlined select-none ${
            isReadonly ? "" : "cursor-pointer"
          }`}
          style={{
            fontSize: `${size}px`,
            // 현재 값 이하면 채워진 별 (FILL 1), 초과면 빈 별 (FILL 0)
            fontVariationSettings: star <= value ? "'FILL' 1" : "'FILL' 0",
            // BDR v3 토큰 마이그 — color-primary → accent / color-text-disabled → ink-dim
            color: star <= value ? "var(--accent)" : "var(--ink-dim)",
            transition: "color 0.15s",
          }}
          onClick={() => {
            if (onChange) onChange(star);
          }}
          // 접근성: 키보드로 별점 선택
          role={isReadonly ? undefined : "button"}
          tabIndex={isReadonly ? undefined : 0}
          onKeyDown={(e) => {
            if (onChange && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onChange(star);
            }
          }}
          aria-label={`${star}점`}
        >
          star
        </span>
      ))}
    </span>
  );
}
