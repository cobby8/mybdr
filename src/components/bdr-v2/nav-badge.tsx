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
}

export function NavBadge({ variant, count, hidden }: Props) {
  if (hidden) return null;
  if (variant === "count" && (count === undefined || count <= 0)) return null;

  if (variant === "dot") {
    return <span className="nav-badge nav-badge--dot" aria-label="새 활동" />;
  }
  if (variant === "live") {
    return (
      <span className="nav-badge nav-badge--live" aria-label="라이브 진행 중">
        LIVE
      </span>
    );
  }
  if (variant === "new") {
    return (
      <span className="nav-badge nav-badge--new" aria-label="새 게시물">
        N
      </span>
    );
  }
  // count
  return (
    <span
      className="nav-badge nav-badge--count"
      aria-label={`알림 ${count}건`}
    >
      {count! > 99 ? "99+" : count}
    </span>
  );
}
