"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "./theme-switch";
import { AppDrawer } from "./app-drawer";
import { NavBadge } from "./nav-badge";

/* ============================================================
 * AppNav (BDR v2 상단 네비게이션)
 *
 * 이유(왜):
 *   기존 좌측 고정 사이드네비 + 상단 헤더 + 하단 탭 + 우측 사이드바 + PWA 배너
 *   구조를 v2 원본의 "상단 가로 네비(유틸리티 바 + 메인 탭)" 단일 구조로
 *   전면 교체한다. 모바일은 햄버거 → AppDrawer 슬라이드로 흡수.
 *
 * [재박제 R-C-4] 03 frozen 재적용 (2026-05-01):
 *   회귀 차단 — `kind: "trigger"` + `moreOpen` state + `MorePanel` JSX 모두 제거.
 *   9번째 탭 '더보기' = drawer 토글 (PC/모바일 동일).
 *   더보기 5그룹 패널은 AppDrawer 안에서만 렌더 (dropdown 패널 X).
 *   근거: Dev/design/BDR v2.4/uploads/03-appnav-frozen-component.md §1 (Phase 19 frozen).
 *
 * v2 원본과의 차이:
 *   - 원본 setRoute 기반 SPA → Next.js Link 기반
 *   - 원본 테마 props 드릴링 → ThemeSwitch 내부에서 DOM 직접 세팅
 *
 * 메뉴 탭 9개 (마지막 더보기 = drawer 트리거):
 *   홈 / 경기 / 대회 / 단체 / 팀 / 코트 / 랭킹 / 커뮤니티 / 더보기
 *
 * 유틸리티바 텍스트 (하드코딩):
 *   MyBDR 커뮤니티 / 소개 / 요금제 / 도움말
 *   우측은 로그인 시 이름/설정/로그아웃, 비로그인 시 로그인 링크
 * ============================================================ */

export interface AppNavUser {
  name: string;
  role: string;
  is_referee?: boolean;
}

interface AppNavProps {
  user: AppNavUser | null;
  unreadCount: number;
  // [2026-04-22] rightAccessory(별 아이콘) prop 제거 — v2 시안에 존재하지 않음
  // [2026-05-03] 메뉴 NEW 뱃지 — 경기/커뮤니티 24h 내 새 글·매치 카운트
  newGameCount?: number;
  newCommunityCount?: number;
}

// 메인 탭 9개 — 마지막 '더보기'는 drawer 토글 트리거 (kind: "trigger" 제거됨)
// [재박제 R-C-4] 03 frozen — 9번째 탭은 단일 종류 (drawer 토글). dropdown trigger 패턴 제거.
const tabs: { id: string; href: string; label: string }[] = [
  { id: "home", href: "/", label: "홈" },
  { id: "games", href: "/games", label: "경기" },
  { id: "tournaments", href: "/tournaments", label: "대회" },
  { id: "orgs", href: "/organizations", label: "단체" },
  { id: "teams", href: "/teams", label: "팀" },
  { id: "courts", href: "/courts", label: "코트" },
  { id: "rankings", href: "/rankings", label: "랭킹" },
  { id: "community", href: "/community", label: "커뮤니티" },
  // 더보기: '#more' (sentinel) — 클릭 시 drawer 토글 (PC/모바일 동일)
  { id: "more", href: "#more", label: "더보기" },
];

// 더보기 메뉴 5그룹은 AppDrawer 안에서 ./more-groups.ts 의 MORE_GROUPS 를 직접 사용

export function AppNav({
  user,
  unreadCount,
  newGameCount = 0,
  newCommunityCount = 0,
}: AppNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 라우트 변경 시 drawer 자동 닫힘
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // 활성 탭 판별 — "/"는 정확 일치, 나머지는 prefix 매치
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // [2026-04-29] 아바타 영역 제거에 따라 initials useMemo 제거

  return (
    <nav className="app-nav">
      {/* ============================================================
       * 유틸리티 바 — v2 원본 하드코딩 텍스트 그대로
       * ============================================================ */}
      <div className="app-nav__utility">
        <div className="app-nav__utility-inner">
          {/* 2026-05-02 v2: BDR 이미지 로고만 utility bar 좌측 (사용자 요청 — 'MyBDR.' 텍스트는 메인 바에 유지) */}
          <Link href="/" className="app-nav__utility-logo" prefetch aria-label="MyBDR 홈">
            <Image
              src="/images/logo.png"
              alt="MyBDR"
              width={140}
              height={40}
              priority
              style={{ height: 18, width: "auto" }}
            />
          </Link>
          <span className="sep util-left" />
          {/* [2026-04-29] 좌측 그룹 — 모바일에서 숨김 (CSS 셀렉터 .util-left 사용)
                          좌/우를 명시 클래스로 분리해 모바일에서 좌측만 hide. */}
          <Link href="/about" className="util-left">소개</Link>
          <span className="sep util-left" />
          <Link href="/pricing" className="util-left">요금제</Link>
          <span className="sep util-left" />
          <Link href="/help/glossary" className="util-left">도움말</Link>
          <span className="app-nav__utility-spacer" />
          {/* 우측 그룹 — 모바일에서도 표시 유지 (작업 1 픽스) */}
          {user ? (
            <>
              <Link href="/profile">{user.name}</Link>
              <span className="sep" />
              <Link href="/profile/settings">설정</Link>
              <span className="sep" />
              <LogoutLink />
            </>
          ) : (
            <>
              <Link href="/login">로그인</Link>
              <span className="sep" />
              <Link href="/signup">회원가입</Link>
            </>
          )}
        </div>
      </div>

      {/* ============================================================
       * 메인 바 — 로고 / 탭 8개 / 우측 액션
       * ============================================================ */}
      <div className="app-nav__main">
        {/* 2026-05-02 v2: 메인 바 로고 — 'MyBDR.' 텍스트만 (이미지는 utility bar 좌측으로 이동, 사용자 요청) */}
        <Link href="/" className="app-nav__logo" prefetch>
          <span>
            MyBDR<span className="dot">.</span>
          </span>
        </Link>

        {/* 탭 9개 — 가로 스크롤 가능 (CSS에서 overflow-x 처리)
            [재박제 R-C-4] 9번째 '더보기' = drawer 토글 button (PC/모바일 동일).
            dropdown 패널 / kind:trigger 패턴 제거. drawer 안에 5그룹 IA 렌더. */}
        <div className="app-nav__tabs">
          {tabs.map((t) => {
            // 더보기 sentinel: drawer 토글 (PC/모바일 동일)
            if (t.id === "more") {
              return (
                <button
                  key={t.id}
                  type="button"
                  className="app-nav__tab"
                  data-active={drawerOpen}
                  onClick={() => setDrawerOpen((v) => !v)}
                  aria-expanded={drawerOpen}
                  aria-haspopup="menu"
                  aria-label="더보기 메뉴 열기"
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                  }}
                >
                  {t.label}
                </button>
              );
            }
            // 일반 라우트 탭 — id 별로 NEW 뱃지 분기
            // 2026-05-03 MVP: 경기 (LIVE) + 커뮤니티 (24h NEW)
            return (
              <Link
                key={t.id}
                href={t.href}
                prefetch
                className="app-nav__tab"
                data-active={isActive(t.href)}
              >
                {t.label}
                {t.id === "games" && newGameCount > 0 && (
                  <NavBadge variant="new" />
                )}
                {t.id === "community" && newCommunityCount > 0 && (
                  <NavBadge variant="new" />
                )}
              </Link>
            );
          })}
        </div>

        {/* 우측 액션 영역 */}
        <div className="app-nav__right">
          <ThemeSwitch />

          {/* 검색 — 박스 제거, 아이콘만 (PM 지시 2026-04-29) */}
          <Link href="/search" className="app-nav__icon-btn" title="검색" aria-label="검색">
            <span className="material-symbols-outlined" aria-hidden="true">
              search
            </span>
          </Link>

          {/* [2026-04-30 Phase 19] 쪽지 · 채팅 — 로그인 시에만 표시.
              이유(왜): AppNav frozen §1 (uploads/03) 시안 순서 = 검색 → 쪽지 → 알림.
                       /messages 페이지는 이미 운영 중 (Phase 8 박제).
              빨간 점 뱃지: 운영에는 messages unread count prop 미존재 — No-badge 로 시작.
                          후속 큐 — messages unread API 연계 시 prop 추가 + 활성화. */}
          {user && (
            <Link
              href="/messages"
              className="app-nav__icon-btn"
              title="쪽지 · 채팅"
              aria-label="쪽지"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                mail_outline
              </span>
            </Link>
          )}

          {/* 알림 — 로그인 시에만 표시, 미확인 수 있으면 빨간 점.
              박스 제거(.app-nav__icon-btn) + 빨간 점 뱃지 유지. */}
          {user && (
            <Link
              href="/notifications"
              className="app-nav__icon-btn app-nav__notif"
              title="알림"
              aria-label="알림"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                notifications
              </span>
              {unreadCount > 0 && <span aria-hidden className="app-nav__notif-dot" />}
            </Link>
          )}

          {/* [재박제 R-C-4] 더보기 dropdown trigger 제거 — 9번째 메인 탭 'more' 가 drawer 토글
                            사용자 결정 §1-3: main bar 우측 = 검색/쪽지/알림/다크/햄버거 5개만 */}

          {/* [2026-04-29] 계정 아바타 + 닉네임 영역 제거 (RDM rdm_captain 회귀 가드)
                          유틸리티 바에 이미 사용자 이름/설정/로그아웃 링크 존재.
                          비로그인 시 "로그인" 버튼은 유일한 진입점이므로 유지. */}
          {!user && (
            <Link href="/login" className="btn btn--accent btn--sm" title="로그인">
              로그인
            </Link>
          )}

          {/* 모바일 햄버거 — 900px 이하에서만 보이도록 CSS에서 처리.
              2026-05-04 (R3 강조): NavBadge dot — drawer 안 신규 컨텐츠 (경기/커뮤니티/알림) 있을 때
              빨간 점 표시. 사용자 진입 유도. */}
          <button
            type="button"
            className="app-nav__burger"
            aria-label="메뉴 열기"
            onClick={() => setDrawerOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            {(newGameCount > 0 || newCommunityCount > 0 || unreadCount > 0) && (
              <NavBadge variant="dot" />
            )}
          </button>
        </div>
      </div>

      {/* 하단 1px 구분선 (다크 모드에서 2px hard 강조) */}
      <div className="app-nav__bottom-line" />

      {/* 모바일 드로어 — open 상태 관리는 여기서.
          2026-05-04: NEW 뱃지 props (경기/커뮤니티/알림) 전달 — drawer 메뉴 항목별 시각 표시. */}
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tabs={tabs}
        isActive={isActive}
        user={user}
        newGameCount={newGameCount}
        newCommunityCount={newCommunityCount}
        unreadCount={unreadCount}
      />
    </nav>
  );
}

/* ============================================================
 * [재박제 R-C-4] MorePanel 함수 영구 제거 (2026-05-01)
 *
 * 이유(왜):
 *   uploads/03 §1 frozen 코드는 main bar / 9번째 메인 탭에 dropdown 패널 미허용.
 *   더보기 = drawer 토글 (PC/모바일 동일). 5그룹 IA + super_admin / referee 운영 그룹은
 *   AppDrawer 컴포넌트 안에 이미 동등하게 구현되어 있음.
 *
 * 회귀 가드:
 *   본 영역에 dropdown 패널 컴포넌트 다시 추가 금지. 사용자 결정 §1-3.
 * ============================================================ */

/* ============================================================
 * LogoutLink — 유틸리티바 "로그아웃" 전용
 * 이유: 기존 ProfileDropdown의 handleLogout과 동일 API(POST /api/web/logout) 사용.
 * 별도 분리 이유 = AppNav utility는 <a> 형태가 필요하기 때문에 button+a 스타일 싱크.
 * ============================================================ */
function LogoutLink() {
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/web/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // 네트워크 실패해도 로그인 페이지로 이동 (세션 클라이언트만 꺼도 UX상 OK)
    }
    window.location.href = "/login";
  };
  return (
    <a href="/login" onClick={handleLogout}>
      로그아웃
    </a>
  );
}
