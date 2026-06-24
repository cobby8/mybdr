"use client";

import { type CSSProperties, useRef, useState } from "react";

interface ShareLiveButtonProps {
  title: string;
  text?: string;
  label?: string;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function ShareLiveButton({
  title,
  text,
  label = "공유",
  compact = false,
  className,
  style,
}: ShareLiveButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = (nextStatus: string) => {
    setStatus(nextStatus);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => setStatus(null), 1800);
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    const shareText = text ?? title;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text: shareText, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      showStatus("복사됨");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(url);
        showStatus("복사됨");
      } catch {
        showStatus("복사 실패");
      }
    }
  };

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={handleShare}
        className={className}
        style={style}
        aria-label={label}
        title={label}
      >
        <span className="material-symbols-outlined" style={{ fontSize: compact ? 18 : 16 }}>
          ios_share
        </span>
        {!compact && <span>{label}</span>}
      </button>
      {status && (
        <span
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 1,
            whiteSpace: "nowrap",
            border: "1px solid var(--color-border, var(--border))",
            borderRadius: 4,
            padding: "3px 6px",
            background: "var(--color-card, var(--bg))",
            color: "var(--color-text-secondary, var(--ink-soft))",
            fontSize: 11,
            fontWeight: 600,
            boxShadow: "0 4px 12px color-mix(in oklab, var(--color-text-primary, var(--ink)) 12%, transparent)",
          }}
        >
          {status}
        </span>
      )}
    </span>
  );
}
