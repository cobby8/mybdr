"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider, usePreferFilter } from "@/contexts/prefer-filter-context";
import { ToastProvider } from "@/contexts/toast-context";
// BDR v2 신규 가로 네비 — 유틸리티 바 + 메인 탭 + 모바일 드로어 일체형
import { AppNav, type AppNavUser } from "@/components/bdr-v2/app-nav";
// BDR v2 모바일 fixed 하단 네비 — Phase B 풀 도입 (2026-05-01)
// localStorage 기반 5슬롯 / 카탈로그 14항목 / ≤720px 만 노출 (CSS @media)
import { BottomNav } from "@/components/BottomNav";
import "@/components/bottom-nav.css";

/* ============================================================
 * WebLayoutInner (BDR v2 client 부분)
 *
 * 이유(왜) — 2026-05-04 P4 fix:
 *   기존 (web)/layout.tsx 가 "use client" 라 SSR 시 user=null → 첫 paint 가 비로그인 헤더.
 *   운영 사용자 신고 — 로그아웃 화면 + 로그인 메뉴 잠깐 노출.
 *   → 부모 layout 을 server component 로 전환하고 initialUser 를 prop 주입.
 *   → 본 inner 컴포넌트는 폴링/이벤트 (실시간성) + 알림 카운트만 client 로 보존.
 *
 * 어떻게:
 *   - initialUser prop = SSR 시점 세션 read 결과 (null = 비로그인).
 *   - state default 값으로 initialUser 사용 → 첫 paint 부터 헤더 정확.
 *   - useEffect 의 /api/web/me fetch 는 prefer_filter_enabled / nickname stale 갱신 용도로만.
 *   - 알림 30s / nav-badges 60s 폴링은 그대로 (실시간성 필요).
 * ============================================================ */

interface WebLayoutInnerProps {
  children: React.ReactNode;
  initialUser: AppNavUser | null;
}

function WebLayoutBody({ children, initialUser }: WebLayoutInnerProps) {
  const { setLoggedIn } = usePreferFilter();
  // 2026-05-04 P4: SSR initialUser 로 default 설정 → 첫 paint 부터 정확한 헤더.
  const [user, setUser] = useState<AppNavUser | null>(initialUser);
  const [unreadCount, setUnreadCount] = useState(0);
  // 2026-05-03 — AppNav NEW 뱃지 (MVP: 경기 LIVE + 커뮤니티 24h NEW)
  const [newGameCount, setNewGameCount] = useState(0);
  const [newCommunityCount, setNewCommunityCount] = useState(0);

  // 마운트 시 유저 + 알림 병렬 fetch — prefer_filter_enabled / 닉네임 stale 시 갱신.
  // (initialUser 가 SSR 결과라 첫 paint 는 정확. 본 fetch 는 추가 정보 / 동기화용.)
  useEffect(() => {
    Promise.all([
      fetch("/api/web/me", { credentials: "include" })
        .then(async (r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/web/notifications", { credentials: "include" })
        // ⚠️ apiSuccess snake_case 변환: unread_count 로 접근 (errors.md 재발 이력 참조)
        .then(async (r) => (r.ok ? (r.json() as Promise<{ unread_count?: number }>) : null))
        .catch(() => null),
    ]).then(([userData, notifData]) => {
      // userData는 라우트에서 snake_case/camelCase 혼재 가능성 → AppNav에는 최소 필드만
      if (userData) {
        const u = userData as {
          name?: string;
          role?: string;
          prefer_filter_enabled?: boolean;
          is_referee?: boolean;
        };
        setUser({
          name: u.name ?? "사용자",
          role: u.role ?? "user",
          is_referee: u.is_referee ?? false,
        });
        setLoggedIn(true, u.prefer_filter_enabled ?? false);
        if (notifData) setUnreadCount(notifData.unread_count ?? 0);
      } else {
        // 401 등 → 비로그인 (SSR 과 일치)
        setUser(null);
        setLoggedIn(false, false);
      }
    });
  }, [setLoggedIn]);

  // 알림 30초 폴링 + "모두 읽음" 이벤트 즉시 갱신 (기존 로직 유지)
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

    // notifications 페이지에서 "모두 읽음" 시 헤더 뱃지 즉시 0으로 (M6)
    const handleReadAll = () => setUnreadCount(0);
    window.addEventListener("notifications:read-all", handleReadAll);

    return () => {
      clearInterval(id);
      window.removeEventListener("notifications:read-all", handleReadAll);
    };
  }, [user]);

  // 2026-05-03 — AppNav NEW 뱃지 폴링 (60s, 비로그인도 동일 — 공개 데이터)
  // ⚠️ apiSuccess 미들웨어 snake_case 변환 → new_game_count / new_community_count
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

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      {/* 상단 가로 네비 — utility bar + 메인 탭 + 모바일 drawer 일체.
       * [2026-04-22] v2 시안 매칭: rightAccessory(별 아이콘) 제거.
       * [2026-05-04 P4] SSR initialUser 주입 → 첫 paint 부터 정확. */}
      <AppNav
        user={user}
        unreadCount={unreadCount}
        newGameCount={newGameCount}
        newCommunityCount={newCommunityCount}
      />

      {/* 메인 — 풀폭. 각 페이지가 자체 `.page` 컨테이너로 폭 제어 */}
      <main className="flex-1">{children}</main>

      {/* 푸터 — 기존 그대로 재사용, 풀폭 하단 */}
      <Footer />

      {/* 모바일 fixed 하단 네비 — Phase B (2026-05-01).
       * PC 에서는 CSS @media 로 hidden (display:none), 모바일 ≤720px 만 노출.
       * (admin)/(referee) 라우트 그룹은 별도 layout 이라 영향 0. */}
      <BottomNav />
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
