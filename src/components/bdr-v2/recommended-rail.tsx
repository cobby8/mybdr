/* ============================================================
 * RecommendedRail — BDR v2 가로 스크롤 추천 캐러셀 통일 헤더
 *
 * 왜 이 컴포넌트가 있는가:
 * 시안 `Dev/design/BDR-current/screens/Home.jsx` (line 405~440) 에서
 * "곧 시작할 경기 / 열린 대회 / BDR 추천 영상 / 주목할 팀" 4개 섹션이
 * 동일한 RecommendedRail 패턴(eyebrow + title + 우측 "전체 보기 →"
 * + 가로 스크롤 grid)을 사용한다. 운영 코드의 RecommendedVideos /
 * RecommendedGames 가 각자 다른 헤더(2K WATCH NOW / TossSectionHeader)
 * 를 쓰고 있어 시안과 어긋났다 → 헤더 통일을 위해 시안 카피로 박제.
 *
 * 시안 카피 원칙:
 * - eyebrow: 빨간 줄 (`var(--accent)`) + 영문 카테고리 (globals.css `.eyebrow`)
 * - title: Display 폰트 일부 (시안은 fontWeight:800, letterSpacing:-0.01em)
 * - more: 우측 "전체 보기 →" — 시안은 button onClick 만, 운영은 href 지원 확장
 * - 가로 스크롤 grid (gridAutoFlow:column, scroll-snap)
 *
 * props 확장:
 * 시안의 `more: () => void` 를 운영에서는 `{ href?, onClick?, label? }`
 * 객체로 받아 외부 링크(YouTube)와 내부 라우팅(/games) 모두 지원.
 *
 * 서버 컴포넌트 — children 만 받으므로 인터랙션 없음.
 * BDR v2 토큰 (`var(--*)`) 100% 사용.
 * ============================================================ */

import Link from "next/link";
import type { ReactNode } from "react";

export interface RecommendedRailMore {
  /** 우측 라벨 (기본 "전체 보기") */
  label?: string;
  /** 내부 라우팅 또는 외부 링크 (외부면 자동으로 target=_blank) */
  href?: string;
  /** 클릭 핸들러 (href 가 없을 때만 button 으로 렌더) */
  onClick?: () => void;
}

export interface RecommendedRailProps {
  /** 섹션 타이틀 (한글 + 영문 혼용 가능) */
  title: string;
  /** 상단 eyebrow — 빨간 줄 + 영문 카테고리 (예: "GAMES · 픽업 · 게스트") */
  eyebrow?: string;
  /** 우측 "전체 보기 →" 액션 — 생략 시 미표시 */
  more?: RecommendedRailMore;
  /** 가로 스크롤 카드 children */
  children: ReactNode;
  /** true면 사이드바 내부 변형 (marginTop 0 + 카드 폭 축소 220px) */
  inset?: boolean;
}

/**
 * 가로 스크롤 추천 캐러셀의 통일 헤더 + 컨테이너.
 * 자식 카드들은 `gridAutoColumns` 로 자동 배치되며 scroll-snap 적용.
 */
export function RecommendedRail({
  title,
  eyebrow,
  more,
  children,
  inset = false,
}: RecommendedRailProps) {
  // 시안 카피 — line 408~424
  // marginTop: inset 일 때 0 (사이드바 내부) / 아니면 28px (메인 본문 섹션 간격)
  return (
    <section style={{ marginTop: inset ? 0 : 28 }}>
      {/* 헤더 바: 좌측 (eyebrow + title) + 우측 (more 액션) */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {/* eyebrow: globals.css `.eyebrow` 클래스 — 빨간 줄 + uppercase */}
          {eyebrow && (
            <div className="eyebrow" style={{ marginBottom: 2 }}>
              {eyebrow}
            </div>
          )}
          {/* title: 시안 fontWeight 800, letterSpacing -0.01em, ellipsis */}
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h3>
        </div>

        {/* more 액션: href 가 있으면 Link, 없고 onClick 만 있으면 button */}
        {more && <RailMore more={more} />}
      </div>

      {/* 가로 스크롤 grid: 시안 line 425~437 카피
          - gridAutoFlow column → 자식이 가로로 자동 배치
          - gridAutoColumns minmax → inset 220 / 일반 260 폭
          - scrollSnapType x mandatory → 카드 단위 스냅 */}
      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: inset ? "minmax(220px, 1fr)" : "minmax(260px, 1fr)",
          gap: 12,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: 6,
        }}
        className="no-scrollbar"
      >
        {/* children 은 그대로 펼쳐서 배치 — 운영의 카드(GameCard / 영상 카드 등)
            가 자체 폭/디자인을 가지므로 시안처럼 wrapper div 추가하지 않음.
            scroll-snap-align 은 children 측에서 필요 시 적용. */}
        {children}
      </div>
    </section>
  );
}

/**
 * 우측 "전체 보기 →" 렌더러.
 * href 우선 → 외부 URL(http) 이면 새 탭, 내부면 Next Link.
 * href 없으면 onClick button.
 */
function RailMore({ more }: { more: RecommendedRailMore }) {
  const label = more.label ?? "전체 보기";
  const text = `${label} →`;

  // 시안 카피 — line 417~422 스타일 (transparent button 톤)
  const baseStyle: React.CSSProperties = {
    background: "transparent",
    border: 0,
    cursor: "pointer",
    fontSize: 12,
    color: "var(--ink-mute)",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
    textDecoration: "none",
  };

  if (more.href) {
    // 외부 링크 (http/https) 는 새 탭으로
    const isExternal = /^https?:\/\//.test(more.href);
    if (isExternal) {
      return (
        <a
          href={more.href}
          target="_blank"
          rel="noopener noreferrer"
          style={baseStyle}
        >
          {text}
        </a>
      );
    }
    // 내부 라우팅
    return (
      <Link href={more.href} style={baseStyle}>
        {text}
      </Link>
    );
  }

  // href 없으면 onClick button
  return (
    <button type="button" onClick={more.onClick} style={baseStyle}>
      {text}
    </button>
  );
}
