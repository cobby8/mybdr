"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MENU_POOL = [
  { id: "find_game",    label: "경기",  icon: "🏀", href: "/games" },
  { id: "my_team",      label: "내팀",  icon: "👥", href: "/teams" },
  { id: "tournaments",  label: "대회",  icon: "🏆", href: "/tournaments" },
  { id: "pickup",       label: "픽업",  icon: "⚡", href: "/games?type=pickup" },
  { id: "my_schedule",  label: "일정",  icon: "📅", href: "/schedule" },
  { id: "stats",        label: "기록",  icon: "📊", href: "/profile?tab=stats" },
  { id: "community",   label: "게시판", icon: "💬", href: "/community" },
  { id: "ranking",      label: "랭킹",  icon: "🥇", href: "/ranking" },
  { id: "venue",        label: "코트",  icon: "📍", href: "/courts" },
] as const;

type MenuId = (typeof MENU_POOL)[number]["id"];

const DEFAULT_ITEMS: MenuId[] = ["find_game", "my_team", "tournaments", "pickup"];
const MAX_ITEMS = 4;

export function QuickMenu() {
  const [items, setItems] = useState<MenuId[]>(DEFAULT_ITEMS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pending, setPending] = useState<MenuId[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/web/user/quick-menu", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json() as { menu_items: MenuId[] };
          setItems(data.menu_items ?? DEFAULT_ITEMS);
          setIsLoggedIn(true);
        }
        // 401: 미로그인 -> 기본값 유지
      })
      .catch(() => {});
  }, []);

  const menuItems = MENU_POOL.filter((m) => items.includes(m.id));

  const openEdit = () => {
    setPending([...items]);
    setEditMode(true);
  };

  const toggleItem = (id: MenuId) => {
    setPending((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_ITEMS) return prev; // 최대 4개
      return [...prev, id];
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    // 낙관적 업데이트
    setItems(pending);
    setEditMode(false);
    try {
      await fetch("/api/web/user/quick-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ menu_items: pending }),
      });
    } catch {
      // silent fail -- UI already updated optimistically
    } finally {
      setSaving(false);
    }
  };

  /* 편집 모드: 카드 배경/테두리/텍스트를 CSS 변수로 전환 */
  if (editMode) {
    return (
      <section
        className="rounded-[20px] p-4"
        style={{
          backgroundColor: "var(--color-card)",
          borderWidth: "1px",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
          >
            메뉴 편집 ({pending.length}/{MAX_ITEMS}개 선택)
          </span>
          <button
            onClick={saveEdit}
            disabled={saving || pending.length === 0}
            className="rounded-[10px] px-4 py-1.5 text-xs font-bold disabled:opacity-60"
            style={{ backgroundColor: "var(--color-text-primary)", color: "var(--color-text-on-primary)" }}
          >
            완료
          </button>
        </div>

        {/* 현재 선택된 메뉴 칩 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {MENU_POOL.filter((m) => pending.includes(m.id)).map((m) => (
            <button
              key={m.id}
              onClick={() => toggleItem(m.id)}
              className="flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
            >
              {m.icon} {m.label} ✕
            </button>
          ))}
        </div>

        {/* 전체 후보 목록 */}
        <div className="pt-3" style={{ borderTopWidth: "1px", borderColor: "var(--color-border-subtle)" }}>
          <p className="mb-2 text-xs" style={{ color: "var(--color-text-muted)" }}>추가 가능한 메뉴</p>
          <div className="grid grid-cols-3 gap-2">
            {MENU_POOL.filter((m) => !pending.includes(m.id)).map((m) => (
              <button
                key={m.id}
                onClick={() => toggleItem(m.id)}
                disabled={pending.length >= MAX_ITEMS}
                className="flex flex-col items-center gap-1 rounded-[12px] py-3 text-xs transition-colors disabled:opacity-40"
                style={{
                  borderWidth: "1px",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* 기본 표시 모드: 카드 배경/테두리/호버를 CSS 변수로 전환 */
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          자주 쓰는 메뉴
        </span>
        {isLoggedIn && (
          <button
            onClick={openEdit}
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            편집
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {menuItems.map((m) => (
          <Link key={m.id} href={m.href}>
            {/* 퀵 메뉴 카드: CSS 변수 배경/테두리 + 호버 시 웜 오렌지 보더 */}
            <div
              className="flex flex-col items-center gap-1.5 rounded-[16px] py-3 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              style={{
                backgroundColor: "var(--color-card)",
                borderWidth: "1px",
                borderColor: "var(--color-border)",
              }}
            >
              <span className="text-xl">{m.icon}</span>
              <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{m.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
