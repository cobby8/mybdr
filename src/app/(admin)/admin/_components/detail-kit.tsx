import Link from "next/link";
import type React from "react";
import { Icon } from "@/components/admin-toss";

export type DetailTab = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  count?: number;
};

type DetailHeadProps = {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  eyebrowIcon?: string;
  avatar?: string;
  avatarGrey?: boolean;
  title: string;
  sub?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
};

type MiniStatItem = {
  label: string;
  value: React.ReactNode;
};

type UserLabel = {
  nickname?: string | null;
  name?: string | null;
  email?: string | null;
};

export function parseBigIntId(value: string): bigint | null {
  return /^\d+$/.test(value) ? BigInt(value) : null;
}

export function initials(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 2).toUpperCase();
}

export function displayUser(user: UserLabel | null | undefined): string {
  if (!user) return "-";
  return user.nickname ?? user.name ?? user.email ?? "-";
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  // 서버 컴포넌트에서 호출 — Vercel 서버 UTC 회피 위해 Asia/Seoul 강제
  return new Date(value).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  // 서버 컴포넌트에서 호출 — Vercel 서버 UTC 회피 위해 Asia/Seoul 강제 (KST 표시)
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWon(value: unknown): string {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : value != null
          ? Number(String(value))
          : 0;
  return `${Number.isFinite(amount) ? amount.toLocaleString("ko-KR") : "0"}원`;
}

export function formatJsonValue(value: unknown): string {
  if (value == null) return "-";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String).join(", ") : "-";
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${String(v)}`);
    return entries.length > 0 ? entries.join(" / ") : "-";
  }
  return String(value);
}

export function DetailHead({
  backHref,
  backLabel,
  eyebrow,
  eyebrowIcon,
  avatar,
  avatarGrey,
  title,
  sub,
  badges,
  actions,
}: DetailHeadProps) {
  return (
    <div>
      <Link className="ad-back" href={backHref}>
        <Icon name="arrow-left" size={16} />
        {backLabel}
      </Link>
      <div className="ad-dhead">
        {avatar && (
          <div className={`ad-dhead__avatar${avatarGrey ? " ad-dhead__avatar--grey" : ""}`}>
            {avatar}
          </div>
        )}
        <div className="ad-dhead__main">
          <div className="ad-dhead__eyebrow">
            {eyebrowIcon && <Icon name={eyebrowIcon} size={14} />}
            {eyebrow}
          </div>
          <div className="ad-dhead__title">{title}</div>
          {sub && <div className="ad-dhead__sub">{sub}</div>}
          {badges && <div className="ad-dhead__badges">{badges}</div>}
        </div>
        {actions && <div className="ad-dhead__actions">{actions}</div>}
      </div>
    </div>
  );
}

export function MiniStat({ items }: { items: MiniStatItem[] }) {
  return (
    <div
      className="ad-ministat"
      style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div className="ad-ministat__cell" key={item.label}>
          <div className="ad-ministat__v">{item.value}</div>
          <div className="ad-ministat__l">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function DetailTabs({ tabs, active }: { tabs: DetailTab[]; active: string }) {
  return (
    <nav className="ad-dtabs" aria-label="상세 탭">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          className="ad-dtab"
          data-active={tab.id === active ? "true" : "false"}
          href={tab.href}
        >
          {tab.icon && <Icon name={tab.icon} size={16} />}
          {tab.label}
          {tab.count != null && <span className="ad-dtab__n">{tab.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyDetail({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="ad-empty-detail">
      <Icon name="inbox" size={32} />
      <div className="ad-empty-detail__title">{title}</div>
      {desc && <div className="ad-empty-detail__desc">{desc}</div>}
    </div>
  );
}
