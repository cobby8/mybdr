"use client";

import { type ReactNode } from "react";
import { Icon } from "@/components/admin-toss";

interface AdminStatCardProps {
  label: string;
  value: string | number | ReactNode;
  icon?: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  onClick?: () => void;
  skeleton?: boolean;
}

export function AdminStatCard({
  label,
  value,
  icon,
  delta,
  trend = "flat",
  onClick,
  skeleton,
}: AdminStatCardProps) {
  if (skeleton) {
    return (
      <div className="ad-stat ad-stat--skel">
        <div className="ad-stat__top"></div>
        <div className="ad-stat__value"></div>
        <div className="ad-stat__delta"></div>
      </div>
    );
  }

  const content = (
    <>
      <div className="ad-stat__top">
        {icon && (
          <span className="ad-stat__icon">
            <Icon name={icon} size={20} />
          </span>
        )}
        <span className="ad-stat__label">{label}</span>
      </div>
      <div className="ad-stat__value">{value}</div>
      {delta && (
        <div className="ad-stat__delta" data-trend={trend}>
          <Icon
            name={trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "move-right"}
            size={14}
          />
          {delta}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="ad-stat" data-link="true" onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div className="ad-stat" data-link="false">
      {content}
    </div>
  );
}
