"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider, usePreferFilter } from "@/contexts/prefer-filter-context";
import { ToastProvider } from "@/contexts/toast-context";
import { ThemeSwitch } from "@/components/bdr-v2/theme-switch";
import { DualSideNav } from "@/components/bdr-v2/dual-side-nav";
import {
  NAV_SECTIONS,
  NAV_CTX,
  navSectionOf,
  navSubOf,
  getSubHref,
  getSectionHref,
} from "@/components/bdr-v2/nav-ia";
// AppNavUser 타입은 app-nav.tsx(휴면)에서 보존 — layout.tsx 와 타입 호환 유지
import type { AppNavUser } from "@/components/bdr-v2/app-nav";

/* ============================================================
 * WebLayoutInner (Phase PUB-0b PR2)
 *
 * 변경:
 *   - AppNav(상단 가로) → DualSideNav(좌측 2단 레일+패널) 교체
 *   - BottomNav 제거 (PR4 정리 전까지 파일 보존, import만 끊음)
 *   - Footer를 main 컬럼 내부 하단으로 이동
 *
 * 보존:
 *   - initialUser / me 폴링 / 알림 30s / nav-badges 60s — 전부 그대로
 *   - snake_case 응답키 접근 (unread_count / new_game_count / new_community_count)
 *   - data-pub 마커 유지
 *   - AppNavUser 타입 — layout.tsx 호환
 * ============================================================ */

interface WebLayoutInnerProps {
  children: React.ReactNode;
  initialUser: AppNavUser | null;
}

function WebLayoutBody({ children, initialUser }: WebLayoutInnerProps) {
  const { setLoggedIn } = usePreferFilter();
  const pathname = usePathname();
  const router = useRouter();

  // SSR initialUser 로 default 설정 → 첫 paint 부터 정확한 헤더 (2026-05-04 P4 유지)
  const [user, setUser] = useState<AppNavUser | null>(initialUser);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newGameCount, setNewGameCount] = useState(0);
  const [newCommunityCount, setNewCommunityCount] = useState(0);

  // active 판정 — pathname 기반 (client-side, usePathname)
  const activeSection = navSectionOf(pathname ?? "/");
  const activeSub = navSubOf(pathname ?? "/");

  // ── 마운트 시 me + 알림 병렬 fetch (기존 로직 그대로) ───────
  useEffect(() => {
    Promise.all([
      fetch("/api/web/me", { credentials: "include" })
        .then(async (r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/web/notifications", { credentials: "include" })
        .then(async (r) =>
          r.ok ? (r.json() as Promise<{ unread_count?: number }>) : null
        )
        .catch(() => null),
    ]).then(([userData, notifData]) => {
      const u = userData as {
        id?: string | number | null;
        name?: string;
        role?: string;
        prefer_filter_enabled?: boolean;
        is_referee?: boolean;
        admin_info?: { is_admin?: boolean; role?: string } | null;
        recorder_admin?: boolean;
        admin_role?: string | null;
      } | null;
      if (u && u.id) {
        const adminEntryUrl: string | null =
          u.admin_role === "super_admin" || u.admin_info?.role === "super_admin_sentinel"
            ? "/admin"
            : u.admin_info?.is_admin
              ? "/tournament-admin/tournaments"
              : u.recorder_admin
                ? "/referee/admin"
                : null;
        setUser({
          name: u.name ?? "사용자",
          role: u.role ?? "user",
          is_referee: u.is_referee ?? false,
          admin_entry_url: adminEntryUrl,
        });
        setLoggedIn(true, u.prefer_filter_enabled ?? false);
        if (notifData) setUnreadCount(notifData.unread_count ?? 0);
      } else {
        setUser(null);
        setLoggedIn(false, false);
      }
    });
  }, [setLoggedIn]);

  // ── 알림 30초 폴링 (기존 그대로) ─────────────────────────────
  useEffect(() => {
    if (!user) return;
    const poll = () => {
      fetch("/api/web/notifications", { credentials: "include" })
        .then(async (r) => {
          if (r.ok) {
            const data = (await r.json()) as { unread_count?: number };
            setUnreadCount(data.unread_count ?? 0);
          }
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30000);
    const handleReadAll = () => setUnreadCount(0);
    window.addEventListener("notifications:read-all", handleReadAll);
    return () => {
      clearInterval(id);
      window.removeEventListener("notifications:read-all", handleReadAll);
    };
  }, [user]);

  // ── nav-badges 60초 폴링 (기존 그대로) ───────────────────────
  // ⚠️ apiSuccess snake_case: new_game_count / new_community_count
  useEffect(() => {
    const poll = () => {
      fetch("/api/web/nav-badges", { credentials: "include" })
        .then(async (r) => {
          if (!r.ok) return;
          const body = (await r.json()) as {
            ok?: boolean;
            data?: { new_game_count?: number; new_community_count?: number };
            new_game_count?: number;
            new_community_count?: number;
          };
          const d = body.data ?? body;
          setNewGameCount(d.new_game_count ?? 0);
          setNewCommunityCount(d.new_community_count ?? 0);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 60000);
    return () => clearInterval(id);
  }, []);

  // ── 로그아웃 핸들러 ──────────────────────────────────────────
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/web/logout", { method: "POST", credentials: "include" });
    } catch {
      // 네트워크 실패해도 로그인 페이지로 이동
    }
    window.location.href = "/login";
  };

  // ── 레일 푸터: 아바타 / 로그인 버튼 ─────────────────────────
  const railFooter = (
    <>
      {user ? (
        <button
          type="button"
          className="bdr-dsnav__ava"
          title={user.name}
          onClick={() => router.push("/profile")}
        >
          {user.name.slice(0, 2).toUpperCase()}
        </button>
      ) : (
        <button
          type="button"
          className="bdr-dsnav__iconbtn"
          title="로그인"
          onClick={() => router.push("/login")}
        >
          <span className="material-symbols-outlined">person</span>
        </button>
      )}
    </>
  );

  // ── 패널 푸터: ThemeSwitch + 사용자 정보 ─────────────────────
  const panelFooter = (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <ThemeSwitch />
      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            className="bdr-dsnav__ava"
            style={{ flexShrink: 0, cursor: "default", fontSize: "11px" }}
          >
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </div>
            {user.admin_entry_url && (
              <Link
                href={user.admin_entry_url}
                style={{ fontSize: "11px", color: "var(--primary)", textDecoration: "none" }}
              >
                관리자
              </Link>
            )}
          </div>
          <a
            href="/login"
            onClick={handleLogout}
            style={{ fontSize: "12px", color: "var(--mute)", whiteSpace: "nowrap", textDecoration: "none" }}
          >
            로그아웃
          </a>
        </div>
      ) : (
        <Link
          href="/login"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 10px",
            borderRadius: "var(--r-2)",
            background: "var(--alt)",
            color: "var(--ink)",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            login
          </span>
          로그인 / 가입
        </Link>
      )}
    </div>
  );

  // ── nav dot 뱃지: 커뮤니티 섹션 (newCommunityCount 활용) ─────
  // PR3에서 unreadCount/newGameCount 완전 배선. 지금은 커뮤니티 dot만.
  const sectionsWithDot = NAV_SECTIONS.map((s) => ({
    ...s,
    dot: s.id === "board" ? newCommunityCount > 0 : (s.dot ?? false),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }} data-pub>
      <DualSideNav
        sections={sectionsWithDot}
        ctx={NAV_CTX}
        activeSection={activeSection}
        activeSub={activeSub || undefined}
        onNavSection={(id) => router.push(getSectionHref(id))}
        onNavSub={(id) => router.push(getSubHref(id))}
        onHome={() => router.push("/")}
        brand="B"
        railFooter={railFooter}
        panelFooter={panelFooter}
        style={{ minHeight: "100vh" }}
      >
        {/* 메인 컬럼: children + Footer (DualSideNav .bdr-dsnav__main 안) */}
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </DualSideNav>
    </div>
  );
}

export function WebLayoutInner({ children, initialUser }: WebLayoutInnerProps) {
  return (
    <SWRProvider>
      <PreferFilterProvider>
        <ToastProvider>
          <WebLayoutBody initialUser={initialUser}>{children}</WebLayoutBody>
        </ToastProvider>
      </PreferFilterProvider>
    </SWRProvider>
  );
}
