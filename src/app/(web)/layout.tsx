"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider, usePreferFilter } from "@/contexts/prefer-filter-context";
import { BellIcon } from "@/components/shared/bell-icon";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TextSizeToggle } from "@/components/shared/text-size-toggle";
import {
  Home, Dribbble, Trophy, MapPin, Users, BarChart3,
  Settings, LogOut, User, LayoutGrid, Sparkles
} from "lucide-react";

/* ============================================================
 * 사이드바 네비게이션 항목 정의
 * bdr_6 시안 기준: 6개 메인 메뉴 + 하단 Settings/Logout
 * ============================================================ */
const sideNavItems = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/games", label: "경기 찾기", Icon: Dribbble },
  { href: "/tournaments", label: "대회", Icon: Trophy },
  { href: "#", label: "코트 정보", Icon: MapPin },
  { href: "/community", label: "커뮤니티", Icon: Users },
  { href: "#", label: "랭킹", Icon: BarChart3 },
];

/* 모바일 하단 네비바 항목: bdr_6 기준 5개 */
const bottomNavItems = [
  { href: "/", label: "Home", Icon: LayoutGrid },
  { href: "/games", label: "Matches", Icon: Dribbble },
  { href: "#", label: "Courts", Icon: MapPin },
  { href: "#", label: "Ranking", Icon: BarChart3 },
  { href: "/profile", label: "Profile", Icon: User },
];

/* ============================================================
 * WebLayoutInner — PreferFilterProvider 내부에서 usePreferFilter 사용
 * bdr_6 레이아웃: 좌측 사이드바(데스크탑) + 상단 미니헤더 + 하단 모바일 네비
 * ============================================================ */
function WebLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { preferFilter, togglePreferFilter, setLoggedIn } = usePreferFilter();
  const [user, setUser] = useState<{ name: string; role: string; prefer_filter_enabled?: boolean } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  /* 마운트 시 로그인 + 알림 병렬 fetch (waterfall 방지) */
  useEffect(() => {
    Promise.all([
      fetch("/api/web/me", { credentials: "include" })
        .then(async (r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/web/notifications", { credentials: "include" })
        .then(async (r) => (r.ok ? (r.json() as Promise<{ unreadCount: number }>) : null))
        .catch(() => null),
    ]).then(([userData, notifData]) => {
      setUser(userData);
      // DB의 선호 설정 여부를 preferFilter 기본값으로 전달
      setLoggedIn(!!userData, userData?.prefer_filter_enabled ?? false);
      if (userData && notifData) setUnreadCount(notifData.unreadCount ?? 0);
    });
  }, [setLoggedIn]);

  /* 페이지 이동 시 알림 카운트만 갱신 */
  useEffect(() => {
    if (!user) return;
    fetch("/api/web/notifications", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = (await r.json()) as { unreadCount: number };
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch(() => {});
  }, [user, pathname]);

  /* 현재 경로가 활성 메뉴인지 판별 */
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /* 로그아웃 핸들러 */
  const handleLogout = async () => {
    await fetch("/api/web/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    /* 전체 컨테이너: flex + min-h-screen으로 푸터를 항상 하단에 고정 */
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* ========================================
       * 데스크탑 사이드바 (md 이상에서만 표시)
       * bdr_6: fixed left-0, w-64, bg-surface-low
       * ======================================== */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col gap-2 px-4 py-8 md:flex"
        style={{
          backgroundColor: "var(--color-surface-low)",
          boxShadow: "48px 0 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* BDR 로고 이미지 — 사이드바 상단 */}
        <div className="mb-8 px-4">
          <Link href="/" prefetch={true}>
            <Image
              src="/images/logo.png"
              alt="BDR"
              width={140}
              height={42}
              className="h-[42px] w-auto"
              priority
            />
          </Link>
        </div>

        {/* 메인 네비게이션 메뉴 */}
        <nav className="flex flex-1 flex-col gap-1">
          {sideNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "translate-x-1 text-white shadow-lg"
                    : "opacity-70 hover:bg-white/5 hover:opacity-100"
                }`}
                style={
                  active
                    ? {
                        /* 활성 메뉴: Red→Navy 그라디언트 배경 */
                        background: "linear-gradient(to right, var(--color-primary), var(--color-accent))",
                      }
                    : { color: "var(--color-text-primary)" }
                }
              >
                <item.Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 하단: Settings + Logout */}
        <div
          className="mt-auto flex flex-col gap-1 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-sm opacity-70 transition-all hover:bg-white/5 hover:opacity-100"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm opacity-70 transition-all hover:bg-white/5 hover:opacity-100"
            style={{ color: "var(--color-text-primary)" }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ========================================
       * 상단 미니 헤더 (fixed)
       * 모바일: BDR 로고 + 알림/프로필
       * 데스크탑: 지역명 + 알림/프로필 (사이드바 우측 영역에만)
       * ======================================== */}
      <header
        className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/10 px-6 py-4 backdrop-blur-xl md:pl-[calc(16rem+1.5rem)]"
        style={{ backgroundColor: "rgba(19, 19, 19, 0.80)" }}
      >
        {/* BDR 로고 이미지 — 모바일+데스크탑 공통 */}
        <Link href="/" prefetch={true} className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="BDR"
            width={120}
            height={36}
            className="h-[36px] w-auto"
            priority
          />
        </Link>

        {/* 우측: 선호모드 + 큰글씨 + 다크모드 + 벨 + 프로필/로그인 */}
        <div className="flex items-center gap-1.5">
          {/* 선호 필터 토글 — 로그인 유저에게만 표시 */}
          {user && (
            <button
              onClick={togglePreferFilter}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              title={preferFilter ? "전체 보기" : "내 선호만 보기"}
              style={{
                color: preferFilter ? "var(--color-primary)" : "var(--color-text-muted)",
                backgroundColor: preferFilter ? "var(--color-primary-light)" : "transparent",
              }}
            >
              <Sparkles size={20} />
            </button>
          )}
          {/* 큰글씨 토글 */}
          <TextSizeToggle />
          {/* 다크모드 토글 */}
          <ThemeToggle />
          {/* 알림 벨 — 로그인 유저에게만 표시 */}
          {user && <BellIcon unreadCount={unreadCount} />}
          {/* 프로필 / 로그인 버튼 */}
          {user ? (
            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <User size={22} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-4 py-1.5 text-sm font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* ========================================
       * 메인 콘텐츠 영역
       * pt-20: 상단 미니헤더 아래 여백
       * pb-24: 모바일 하단 네비바 여백
       * md:pl-64: 데스크탑 사이드바 너비만큼 좌측 여백
       * ======================================== */}
      {/* 메인 콘텐츠: flex-1로 남은 공간을 모두 차지하여 푸터를 하단으로 밀어냄 */}
      <main className="flex-1 pt-20 pb-24 md:pb-12 md:pl-64">
        <div className="mx-auto max-w-7xl px-6">
          {children}
        </div>
      </main>

      {/* 푸터: 데스크탑에서만 표시 (모바일은 하단 네비바가 있으므로 숨김) */}
      {/* mt-auto로 콘텐츠가 짧아도 항상 화면 하단에 배치 */}
      <div className="mt-auto hidden md:block md:pl-64">
        <Footer />
      </div>

      {/* ========================================
       * 모바일 하단 네비바 (md 이하에서만 표시)
       * bdr_6: 5개 아이콘, 활성=bg-primary rounded-2xl
       * ======================================== */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex w-full items-end justify-around border-t border-white/5 px-4 pb-6 pt-2 backdrop-blur-2xl md:hidden"
        style={{
          backgroundColor: "rgba(19, 19, 19, 0.90)",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
                active
                  ? "mb-2 scale-110 rounded-2xl p-3 text-white"
                  : "p-2"
              }`}
              style={
                active
                  ? { backgroundColor: "var(--color-primary)" }
                  : { color: "var(--color-text-primary)", opacity: 0.6 }
              }
            >
              <item.Icon size={24} />
              <span
                className="mt-1 text-[10px] font-semibold"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================================================
 * WebLayout — 최상위 레이아웃
 * SWRProvider + PreferFilterProvider로 감싸고 WebLayoutInner 렌더
 * ============================================================ */
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <PreferFilterProvider>
        <WebLayoutInner>{children}</WebLayoutInner>
      </PreferFilterProvider>
    </SWRProvider>
  );
}
