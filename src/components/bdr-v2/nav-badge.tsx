// 2026-05-03: AppNav 메뉴 NEW 뱃지 컴포넌트
// 4 variant: dot / count / new / live
//
// 사용 예:
//   <NavBadge variant="live" />          → 🟢 LIVE (깜빡임)
//   <NavBadge variant="new" />           → 🔴 N (점)
//   <NavBadge variant="count" count={3} /> → 🔴 3
//   <NavBadge variant="dot" />           → 🔴 작은 점

import "./nav-badge.css";

export type NavBadgeVariant = "dot" | "count" | "new" | "live";

interface Props {
  variant: NavBadgeVariant;
  count?: number; // count variant 에서만 사용
  hidden?: boolean; // count===0 일 때 숨김 등
  // 2026-05-03: inline=true 시 absolute 해제 (사이드바/모바일탭 등)
  // default false = absolute (AppNav 탭 폭 변동 방지)
  inline?: boolean;
}

export function NavBadge({ variant, count, hidden, inline }: Props) {
  if (hidden) return null;
  if (variant === "count" && (count === undefined || count <= 0)) return null;

  const inlineClass = inline ? " nav-badge--inline" : "";

  if (variant === "dot") {
    return (
      <span
        className={`nav-badge nav-badge--dot${inlineClass}`}
        aria-label="새 활동"
      />
    );
  }
  if (variant === "live") {
    return (
      <span
        className={`nav-badge nav-badge--live${inlineClass}`}
        aria-label="라이브 진행 중"
      >
        LIVE
      </span>
    );
  }
  if (variant === "new") {
    return (
      <span
        className={`nav-badge nav-badge--new${inlineClass}`}
        aria-label="새 게시물"
      >
        N
      </span>
    );
  }
  // count
  return (
    <span
      className={`nav-badge nav-badge--count${inlineClass}`}
      aria-label={`알림 ${count}건`}
    >
      {count! > 99 ? "99+" : count}
    </span>
  );
}
