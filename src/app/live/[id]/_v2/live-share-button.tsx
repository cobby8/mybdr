"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

interface LiveShareButtonProps {
  iconOnlyOnMobile?: boolean;
  style?: CSSProperties;
}

export function LiveShareButton({ iconOnlyOnMobile = false, style }: LiveShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const markCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const copyUrl = async (url: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      markCopied();
      return;
    }

    window.prompt("공유 링크를 복사하세요.", url);
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    const title = document.title || "BDR Live Score";

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await copyUrl(url);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyUrl(url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="라이브 페이지 공유"
      title={copied ? "링크가 복사되었습니다" : "라이브 페이지 공유"}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-opacity hover:opacity-85"
      style={{
        color: "var(--color-text-secondary, var(--ink-soft))",
        backgroundColor: "var(--color-card, var(--bg-elev))",
        border: "1px solid var(--color-border, var(--border))",
        touchAction: "manipulation",
        ...style,
      }}
    >
      <span className="material-symbols-outlined text-base" aria-hidden>
        {copied ? "done" : "ios_share"}
      </span>
      <span className={iconOnlyOnMobile ? "hidden sm:inline" : undefined}>
        {copied ? "복사됨" : "공유"}
      </span>
    </button>
  );
}
