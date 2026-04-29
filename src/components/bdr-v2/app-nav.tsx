"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "./theme-switch";
import { AppDrawer } from "./app-drawer";
import { MORE_GROUPS, type MoreGroup } from "./more-groups";

/* ============================================================
 * AppNav (BDR v2 상단 네비게이션)
 *
 * 이유(왜):
 *   기존 좌측 고정 사이드네비 + 상단 헤더 + 하단 탭 + 우측 사이드바 + PWA 배너
 *   구조를 v2 원본의 "상단 가로 네비(유틸리티 바 + 메인 탭)" 단일 구조로
 *   전면 교체한다. 모바일은 햄버거 → AppDrawer 슬라이드로 흡수.
 *
 * v2 원본과의 차이:
 *   - 원본 setRoute 기반 SPA → Next.js Link 기반
 *   - 원본 테마 props 드릴링 → ThemeSwitch 내부에서 DOM 직접 세팅
 *   - ProfileDropdown "더보기"는 원본 moreItems(28개 중 실제 라우트만 추린 12개)
 *     + 아바타 자체는 /profile 이동 Link 로 분리 (PM 확정안)
 *
 * 메뉴 탭 8개 (PM 확정안 2026-04-24):
 *   홈 / 경기 / 대회 / 단체 / 팀 / 코트 / 랭킹 / 커뮤니티
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
}

// 메인 탭 9개 — PM 확정안 (2026-04-29: "더보기" 추가)
// kind:
//   - "link"    : 일반 라우트 이동
//   - "trigger" : "더보기" 드롭다운 토글 (href 미사용)
// 이유(왜): 메인 바에서 떨어져 있던 "더보기" 트리거를 메인 탭 9번째로 흡수.
//         탭 자체가 모바일 햄버거를 대체하는 역할로 일관성 부여.
const tabs: { id: string; href: string; label: string; kind?: "link" | "trigger" }[] = [
  { id: "home", href: "/", label: "홈", kind: "link" },
  { id: "games", href: "/games", label: "경기", kind: "link" },
  { id: "tournaments", href: "/tournaments", label: "대회", kind: "link" },
  { id: "orgs", href: "/organizations", label: "단체", kind: "link" },
  { id: "teams", href: "/teams", label: "팀", kind: "link" },
  { id: "courts", href: "/courts", label: "코트", kind: "link" },
  { id: "rankings", href: "/rankings", label: "랭킹", kind: "link" },
  { id: "community", href: "/community", label: "커뮤니티", kind: "link" },
  // 더보기: 클릭 시 기존 더보기 드롭다운 패널을 토글 (작업 4)
  { id: "more", href: "#", label: "더보기", kind: "trigger" },
];

// 더보기 메뉴 5그룹은 ./more-groups.ts 의 MORE_GROUPS 상수에서 import
// (데스크톱 드롭다운 + 모바일 드로어 더보기 패널 공유)

export function AppNav({ user, unreadCount }: AppNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // 더보기 드롭다운: 외부 클릭/ESC 닫힘 (v2 원본 동작 그대로)
  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  // 라우트 변경 시 드롭다운/드로어 자동 닫힘
  useEffect(() => {
    setMoreOpen(false);
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
          {/* [2026-04-29] 좌측 그룹 — 모바일에서 숨김 (CSS 셀렉터 .util-left 사용)
                          좌/우를 명시 클래스로 분리해 모바일에서 좌측만 hide. */}
          <span className="util-left">MyBDR 커뮤니티</span>
          <span className="sep util-left" />
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
        {/* 로고 (홈 이동) */}
        <Link href="/" className="app-nav__logo" prefetch>
          <Image
            src="/images/logo.png"
            alt="MyBDR"
            width={140}
            height={40}
            priority
            style={{ height: 28, width: "auto" }}
          />
          <span>
            MyBDR<span className="dot">.</span>
          </span>
        </Link>

        {/* 탭 9개 — 가로 스크롤 가능 (CSS에서 overflow-x 처리)
            "더보기"(kind: trigger) 탭은 Link 대신 button 으로 드롭다운 토글.
            드롭다운 패널은 기존 컴포넌트 그대로 재사용 (moreOpen state 공유) */}
        <div className="app-nav__tabs">
          {tabs.map((t) => {
            // 더보기 트리거: 일반 Link 가 아닌 button + 드롭다운 컨테이너
            if (t.kind === "trigger") {
              return (
                <div
                  key={t.id}
                  ref={moreRef}
                  style={{ position: "relative", display: "inline-flex" }}
                >
                  <button
                    type="button"
                    className="app-nav__tab"
                    data-active={moreOpen}
                    onClick={() => setMoreOpen((v) => !v)}
                    aria-expanded={moreOpen}
                    aria-haspopup="menu"
                    style={{
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      font: "inherit",
                      color: "inherit",
                    }}
                  >
                    {t.label}
                    <span
                      aria-hidden
                      style={{
                        fontSize: 9,
                        marginLeft: 4,
                        display: "inline-block",
                        transform: moreOpen ? "rotate(180deg)" : "none",
                        transition: "transform .15s",
                      }}
                    >
                      ▼
                    </span>
                  </button>
                  {moreOpen && <MorePanel groups={MORE_GROUPS} user={user} isActive={isActive} onClose={() => setMoreOpen(false)} />}
                </div>
              );
            }
            // 일반 라우트 탭
            return (
              <Link
                key={t.id}
                href={t.href}
                prefetch
                className="app-nav__tab"
                data-active={isActive(t.href)}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* 우측 액션 영역 */}
        <div className="app-nav__right">
          <ThemeSwitch />

          {/* 검색 */}
          <Link href="/search" className="btn btn--sm" title="검색" aria-label="검색">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              search
            </span>
          </Link>

          {/* 알림 — 로그인 시에만 표시, 미확인 수 있으면 빨간 점 */}
          {user && (
            <Link
              href="/notifications"
              className="btn btn--sm"
              title="알림"
              aria-label="알림"
              style={{ position: "relative" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                notifications
              </span>
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              )}
            </Link>
          )}

          {/* [2026-04-29] 더보기 드롭다운 트리거: 메인 탭 9번째로 이동 (작업 2/4)
                          드롭다운 패널은 MorePanel 컴포넌트로 보존 — 메인 탭에서 재사용 */}

          {/* [2026-04-29] 계정 아바타 + 닉네임 영역 제거 (작업 2)
                          유틸리티 바에 이미 사용자 이름/설정/로그아웃 링크 존재.
                          비로그인 시 "로그인" 버튼은 유일한 진입점이므로 유지. */}
          {!user && (
            <Link href="/login" className="btn btn--accent btn--sm" title="로그인">
              로그인
            </Link>
          )}

          {/* 모바일 햄버거 — 900px 이하에서만 보이도록 CSS에서 처리 */}
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
          </button>
        </div>
      </div>

      {/* 하단 1px 구분선 (다크 모드에서 2px hard 강조) */}
      <div className="app-nav__bottom-line" />

      {/* 모바일 드로어 — open 상태 관리는 여기서 */}
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tabs={tabs}
        isActive={isActive}
        user={user}
      />
    </nav>
  );
}

/* ============================================================
 * MorePanel — 더보기 드롭다운 패널 (메인 탭 "더보기" 트리거에서 사용)
 *
 * 이유(왜):
 *   기존 우측 액션 영역의 "더보기" 트리거를 메인 탭으로 이동하면서,
 *   드롭다운 패널 JSX를 별도 컴포넌트로 분리. 코드 폐기 X — 마크업 그대로
 *   재사용. super_admin / 심판 전용 그룹도 동일하게 유지.
 *
 * 위치:
 *   parent <div ref={moreRef}>는 메인 탭 내부의 "더보기" 버튼을 감싼다.
 *   panel 자체는 absolute 포지셔닝으로 버튼 바로 아래에 펼쳐짐.
 * ============================================================ */
function MorePanel({
  groups,
  user,
  isActive,
  onClose,
}: {
  groups: MoreGroup[];
  user: AppNavUser | null;
  isActive: (href: string) => boolean;
  onClose: () => void;
}) {
  return (
    // 데스크톱: 680px 2-col 그리드 / 모바일(<=720px): globals.css의
    // .app-nav__more-panel 룰이 풀스크린 시트로 변환 (1-col stack)
    <div
      role="menu"
      className="app-nav__more-panel"
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        // [2026-04-29] 메인 탭 내부로 이동했으므로 left 기준 정렬
        // (기존 우측 끝 정렬 → 탭 위치에 맞춘 좌측 정렬)
        left: 0,
        width: 680,
        maxHeight: "70vh",
        overflowY: "auto",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh-lift, var(--sh-lg))",
        borderRadius: 10,
        padding: 12,
        zIndex: 30,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px 18px",
      }}
    >
      {/* 5그룹 그리드: 각 그룹은 헤더 + 항목 리스트 */}
      {groups.map((g) => (
        <div key={g.title} style={{ breakInside: "avoid" }}>
          {/* 그룹 헤더 — 시안 톤(uppercase + letter-spacing) */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "var(--ink-mute)",
              textTransform: "uppercase",
              padding: "8px 10px 4px",
            }}
          >
            {g.title}
          </div>
          {g.items.map((m) => {
            const active = isActive(m.href);
            return (
              <Link
                key={m.id + g.title}
                href={m.href}
                role="menuitem"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "7px 10px",
                  background: active ? "var(--bg-alt)" : "transparent",
                  fontSize: 12.5,
                  color: "var(--ink)",
                  textDecoration: "none",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {/* 시안 인라인 이모지 그대로 (Material Symbols 변환 X) */}
                <span
                  style={{
                    width: 18,
                    textAlign: "center",
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  {m.icon}
                </span>
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}

      {/* super_admin / 심판 전용은 별도 그룹으로 마지막에 배치 */}
      {(user?.role === "super_admin" || user?.is_referee) && (
        <div style={{ breakInside: "avoid", gridColumn: "1 / -1" }}>
          <div
            aria-hidden
            style={{
              height: 1,
              background: "var(--border)",
              margin: "8px 0 4px",
            }}
          />
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "var(--ink-mute)",
              textTransform: "uppercase",
              padding: "4px 10px",
            }}
          >
            운영
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 18px",
            }}
          >
            {user?.role === "super_admin" && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 10px",
                  fontSize: 12.5,
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontWeight: 700,
                  borderRadius: 6,
                }}
              >
                <span style={{ width: 18, textAlign: "center", fontSize: 13 }} aria-hidden>
                  🛠
                </span>
                <span>관리자</span>
              </Link>
            )}
            {user?.is_referee && (
              <Link
                href="/referee"
                role="menuitem"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 10px",
                  fontSize: 12.5,
                  color: "var(--ink)",
                  textDecoration: "none",
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                <span style={{ width: 18, textAlign: "center", fontSize: 13 }} aria-hidden>
                  🦓
                </span>
                <span>심판 센터</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
