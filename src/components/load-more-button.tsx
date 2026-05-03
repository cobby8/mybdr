// 2026-05-03: 페이지네이션 → 더보기 버튼 공용 컴포넌트
// 사용처: tournaments / community / news 등 list 페이지
//
// 사용 예:
//   <LoadMoreButton
//     hasMore={visible < total}
//     onMore={() => setPage((p) => p + 1)}
//     remaining={total - visible}
//   />

"use client";

interface Props {
  hasMore: boolean;
  onMore: () => void;
  remaining?: number;
  label?: string; // 기본 "더보기"
}

export function LoadMoreButton({ hasMore, onMore, remaining, label }: Props) {
  if (!hasMore) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 24,
        marginBottom: 24,
      }}
    >
      <button
        type="button"
        onClick={onMore}
        className="btn btn--sm"
        style={{
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 600,
          minWidth: 140,
        }}
      >
        {label ?? "더보기"}
        {remaining !== undefined && remaining > 0 && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 12,
              opacity: 0.7,
              fontFamily: "var(--ff-mono)",
            }}
          >
            +{remaining}
          </span>
        )}
      </button>
    </div>
  );
}
