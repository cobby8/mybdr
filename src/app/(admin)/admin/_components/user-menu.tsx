"use client";

/**
 * Admin 우상단 사용자 드롭다운 메뉴.
 *
 * 2026-05-11 — admin 마이페이지 Phase 1 (사용자 결재 §2).
 *
 * 이유 (왜):
 *   - admin 영역 우상단에 사용자 표시 + 진입점 0 — 표준 UX (Gmail/Notion/Vercel 패턴) 부재.
 *   - 마이페이지 + 사이트로 돌아가기 + 로그아웃 3개를 1 클릭으로 노출.
 *
 * 어떻게:
 *   1. 트리거: 아바타(이니셜) + 닉네임 + expand_more 아이콘 → 클릭 시 드롭다운.
 *   2. 드롭다운: 우측 정렬 (right-0) / Z-index 50 (햄버거 30 보다 위).
 *   3. 외부 클릭 닫기: document.mousedown listener + ref.contains() 체크.
 *   4. ESC 키 닫기 (접근성).
 *   5. PC 전용 (모바일은 layout 에서 lg:hidden 으로 숨김 — 드로어 상단에서 처리).
 *
 * 디자인 토큰:
 *   - var(--color-*) 만 사용 (하드코딩 색상 ❌).
 *   - Material Symbols Outlined (lucide-react ❌).
 *   - 닉네임 없으면 이메일 사용 → 이니셜.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

export interface UserMenuProps {
  nickname: string | null;
  email: string;
}

// 이니셜 생성 — 닉네임 또는 이메일 첫 글자
function getInitial(nickname: string | null, email: string): string {
  const source = nickname?.trim() || email;
  return (source[0] ?? "?").toUpperCase();
}

export function UserMenu({ nickname, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 표시 이름 — 닉네임 우선, 없으면 이메일 앞부분
  const displayName = nickname?.trim() || email.split("@")[0];
  const initial = getInitial(nickname, email);

  // 외부 클릭으로 닫기 (mousedown — 클릭 발생 전에 닫혀야 Link 클릭과 충돌 없음)
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ESC 키로 닫기 (접근성)
  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* 트리거 버튼 — 아바타 + 닉네임 + chevron */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="사용자 메뉴"
        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-elevated)]"
        style={{ color: "var(--color-text-primary)" }}
      >
        {/* 아바타 — 정사각형 50% 원 (디자인 토큰 §4-1) — pill 9999px 회피 */}
        <span
          className="flex h-7 w-7 items-center justify-center text-xs font-bold"
          style={{
            borderRadius: "50%", // W=H 원형 — 9999px 회피 (디자인 룰 10)
            backgroundColor: "var(--color-primary)",
            color: "white",
          }}
        >
          {initial}
        </span>
        <span className="hidden md:inline max-w-[120px] truncate">
          {displayName}
        </span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: "var(--color-text-secondary)" }}
        >
          expand_more
        </span>
      </button>

      {/* 드롭다운 메뉴 — 우측 정렬, 외부 클릭 시 닫힘 */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          {/* 사용자 정보 헤더 — 작게 표시 */}
          <div
            className="border-b border-[var(--color-border)] px-4 py-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <div
              className="text-sm font-medium truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {displayName}
            </div>
            <div className="text-xs truncate">{email}</div>
          </div>

          {/* 메뉴 항목 */}
          <Link
            href="/admin/me"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-elevated)]"
            style={{ color: "var(--color-text-primary)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
            >
              account_circle
            </span>
            <span>마이페이지</span>
          </Link>
          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-elevated)]"
            style={{ color: "var(--color-text-primary)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
            >
              arrow_back
            </span>
            <span>사이트로 돌아가기</span>
          </Link>
          {/* 로그아웃 구분선 */}
          <div className="border-t border-[var(--color-border)]" />
          <LogoutButton
            variant="menu-item"
            onBeforeLogout={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
