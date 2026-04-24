"use client";

/**
 * 검색 페이지 클라이언트 컴포넌트 — BDR v2 재구성
 *
 * 왜 분리됐는가:
 * - controlled input (value + onChange) + form submit 시 router.push 는 "use client" 필요.
 * - 탭 전환은 클라이언트 상태 — 서버 재요청 없이 이미 받은 결과를 필터만 바꾼다.
 * - page.tsx(서버)가 Prisma로 6테이블을 먼저 검색 → 직렬화 → 이 컴포넌트에 props로 전달.
 *
 * v2 톤:
 * - .page 쉘 + maxWidth 780px (Phase 1/2 일관)
 * - 탭 7종: 전체 / 팀 / 경기 / 대회 / 커뮤니티 / 코트 / 유저
 *   (사용자 원칙: 데이터 있으면 표시)
 * - Material Symbols Outlined 아이콘만 사용
 * - 하드코딩 색상 금지 — var(--ink / --ink-mute / --ink-dim / --accent / --border) 사용
 *
 * 불변:
 * - API / Prisma / 서비스 레이어 변경 없음
 * - 6종 데이터 모두 화면에 보존
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  SerializedGame,
  SerializedTournament,
  SerializedTeam,
  SerializedPost,
  SerializedUser,
  SerializedCourt,
} from "../page";

// 경기 유형 한글 매핑 (서버에서 쓰던 것 그대로 옮김)
const GAME_TYPE_LABELS: Record<number, string> = {
  0: "픽업게임",
  1: "팀매치",
  2: "대회경기",
};

// 커뮤니티 카테고리 한글 매핑
const CATEGORY_LABELS: Record<string, string> = {
  general: "자유",
  question: "질문",
  info: "정보",
  recruit: "모집",
  trade: "거래",
  review: "후기",
};

// 대회 상태 한글 매핑 (4종 통일)
const STATUS_LABELS: Record<string, string> = {
  draft: "준비중",
  upcoming: "준비중",
  registration: "접수중",
  active: "접수중",
  open: "접수중",
  in_progress: "진행중",
  live: "진행중",
  ongoing: "진행중",
  completed: "종료",
  ended: "종료",
  cancelled: "종료",
};

// 코트 유형 한글 매핑
const COURT_TYPE_LABELS: Record<string, string> = {
  outdoor: "야외",
  indoor: "실내",
  rooftop: "옥상",
};

// 포지션 한글 매핑
const POSITION_LABELS: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

// 탭 키 — "all"은 전체, 나머지는 개별 섹션
type TabKey =
  | "all"
  | "teams"
  | "games"
  | "tournaments"
  | "community"
  | "courts"
  | "users";

// 탭 정의 (PM 확정 순서: 전체 / 팀 / 경기 / 대회 / 커뮤니티 / 코트 / 유저)
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "teams", label: "팀" },
  { key: "games", label: "경기" },
  { key: "tournaments", label: "대회" },
  { key: "community", label: "커뮤니티" },
  { key: "courts", label: "코트" },
  { key: "users", label: "유저" },
];

interface SearchClientProps {
  q: string;
  games: SerializedGame[];
  tournaments: SerializedTournament[];
  teams: SerializedTeam[];
  posts: SerializedPost[];
  users: SerializedUser[];
  courts: SerializedCourt[];
}

export function SearchClient({
  q,
  games,
  tournaments,
  teams,
  posts,
  users,
  courts,
}: SearchClientProps) {
  const router = useRouter();

  // controlled input — 서버 q 값으로 초기화, 사용자 타이핑 상태 보존
  const [inputValue, setInputValue] = useState(q);
  // 현재 활성 탭
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // form submit → URL push (Enter / 돋보기 클릭)
  // 이유: 탭 필터는 클라가 하지만, 실제 DB 재검색은 서버에서 해야 하므로 URL 변경 필수.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = inputValue.trim();
    if (next === "") {
      router.push("/search");
    } else {
      router.push(`/search?q=${encodeURIComponent(next)}`);
    }
  }

  // 전체 결과 건수 (탭별 뱃지 / 빈 상태 판정용)
  const counts = useMemo(
    () => ({
      all:
        games.length +
        tournaments.length +
        teams.length +
        posts.length +
        users.length +
        courts.length,
      teams: teams.length,
      games: games.length,
      tournaments: tournaments.length,
      community: posts.length,
      courts: courts.length,
      users: users.length,
    }),
    [games, tournaments, teams, posts, users, courts],
  );

  // 현재 탭에서 어떤 섹션을 노출할지 판정
  const showGames = activeTab === "all" || activeTab === "games";
  const showTournaments = activeTab === "all" || activeTab === "tournaments";
  const showTeams = activeTab === "all" || activeTab === "teams";
  const showCommunity = activeTab === "all" || activeTab === "community";
  const showCourts = activeTab === "all" || activeTab === "courts";
  const showUsers = activeTab === "all" || activeTab === "users";

  // 활성 탭 기준 결과 건수 (활성 탭이 all 이면 전체, 아니면 해당 카테고리)
  const activeTabCount =
    activeTab === "all" ? counts.all : counts[activeTab];

  return (
    // .page 쉘 — Phase 2 일관 패턴. 검색 페이지는 780px로 좁힘.
    <div className="page" style={{ maxWidth: 780 }}>
      {/* ==== 헤더: 제목 + 검색 input ==== */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: "0 0 12px 0",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
          }}
        >
          검색
        </h1>

        {/* controlled form — Enter / 돋보기 클릭으로 URL push */}
        <form onSubmit={handleSubmit} role="search">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              height: 44,
              padding: "0 12px",
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 20,
                color: "var(--ink-mute)",
                marginRight: 8,
              }}
            >
              search
            </span>
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="경기, 대회, 팀, 코트, 유저, 커뮤니티를 검색하세요"
              aria-label="통합 검색"
              style={{
                flex: 1,
                minWidth: 0,
                height: "100%",
                background: "transparent",
                border: 0,
                outline: "none",
                color: "var(--ink)",
                fontSize: 14,
              }}
            />
            {/* 입력값 초기화 버튼 — 값이 있을 때만 표시 */}
            {inputValue.length > 0 && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                aria-label="입력값 지우기"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  padding: 0,
                  border: 0,
                  background: "transparent",
                  color: "var(--ink-mute)",
                  cursor: "pointer",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                >
                  close
                </span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ==== 빈 쿼리 상태: 기존 "검색어를 입력해주세요" 유지 + v2 톤 ==== */}
      {q === "" ? (
        <div
          style={{
            padding: "80px 16px",
            textAlign: "center",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              display: "block",
              fontSize: 48,
              color: "var(--ink-dim)",
              marginBottom: 12,
            }}
          >
            search
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            검색어를 입력해주세요
          </p>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: 13,
              color: "var(--ink-mute)",
            }}
          >
            경기, 대회, 팀, 코트, 유저, 커뮤니티 글을 한번에 검색할 수 있어요
          </p>
        </div>
      ) : (
        <>
          {/* ==== 검색 결과 요약: "키워드" 검색 결과 + 총 N건 ==== */}
          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--ink-mute)",
              }}
            >
              <span style={{ color: "var(--ink)", fontWeight: 700 }}>
                &ldquo;{q}&rdquo;
              </span>{" "}
              검색 결과 · 총{" "}
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  color: "var(--ink)",
                  fontWeight: 700,
                }}
              >
                {counts.all}
              </span>
              건
            </p>
          </div>

          {/* ==== 탭 7개: KindTabBar 스타일 (border-bottom 밑줄 + mono 숫자) ==== */}
          <div
            className="no-scrollbar"
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              borderBottom: "1px solid var(--border)",
              overflowX: "auto",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              // 탭 뱃지 숫자 — "all" 탭은 전체 건수, 나머지는 카테고리 건수
              const n =
                tab.key === "all" ? counts.all : counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  aria-pressed={isActive}
                  style={{
                    padding: "10px 16px",
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    // 활성 탭 하단 3px --accent 밑줄, 비활성은 투명 3px (레이아웃 흔들림 방지)
                    borderBottom: isActive
                      ? "3px solid var(--accent)"
                      : "3px solid transparent",
                    color: isActive ? "var(--ink)" : "var(--ink-mute)",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 14,
                    // 상위 container 하단 1px 와 겹치도록 -1px offset
                    marginBottom: -1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      marginLeft: 4,
                    }}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ==== 결과가 0건일 때 (현재 탭 기준) ==== */}
          {activeTabCount === 0 ? (
            <div
              style={{
                padding: "64px 16px",
                textAlign: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  display: "block",
                  fontSize: 48,
                  color: "var(--ink-dim)",
                  marginBottom: 12,
                }}
              >
                search_off
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                검색 결과가 없어요
              </p>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: 13,
                  color: "var(--ink-mute)",
                }}
              >
                다른 키워드로 다시 검색해보세요
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* ==== 경기 섹션 ==== */}
              {showGames && games.length > 0 && (
                <SearchSection
                  icon="sports_basketball"
                  iconBg="var(--accent)"
                  title="경기"
                  count={games.length}
                  moreHref={`/games?q=${encodeURIComponent(q)}`}
                >
                  {games.map((game) => (
                    <SearchResultItem
                      key={game.id}
                      href={`/games/${game.id}`}
                      title={game.title || "제목 없음"}
                      subtitle={[
                        GAME_TYPE_LABELS[game.game_type] || "경기",
                        game.venue_name || game.city,
                        game.scheduled_at
                          ? new Date(game.scheduled_at).toLocaleDateString(
                              "ko-KR",
                              { month: "short", day: "numeric" },
                            )
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))}
                </SearchSection>
              )}

              {/* ==== 대회 섹션 ==== */}
              {showTournaments && tournaments.length > 0 && (
                <SearchSection
                  icon="emoji_events"
                  iconBg="var(--cafe-blue)"
                  title="대회"
                  count={tournaments.length}
                  moreHref="/tournaments"
                >
                  {tournaments.map((t) => (
                    <SearchResultItem
                      key={t.id}
                      href={`/tournaments/${t.id}`}
                      title={t.name}
                      subtitle={[
                        STATUS_LABELS[t.status || "draft"] || t.status,
                        t.city,
                        // 팀수 병합 (DB 필드: teams_count / max_teams)
                        t.teams_count != null && t.max_teams
                          ? `${t.teams_count}/${t.max_teams}팀`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))}
                </SearchSection>
              )}

              {/* ==== 팀 섹션 ==== */}
              {showTeams && teams.length > 0 && (
                <SearchSection
                  icon="groups"
                  iconBg="#6366f1"
                  title="팀"
                  count={teams.length}
                  moreHref="/teams"
                >
                  {teams.map((team) => (
                    <SearchResultItem
                      key={team.id}
                      href={`/teams/${team.id}`}
                      title={team.name}
                      subtitle={[
                        team.city,
                        team.members_count != null
                          ? `${team.members_count}명`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))}
                </SearchSection>
              )}

              {/* ==== 코트 섹션 ==== */}
              {showCourts && courts.length > 0 && (
                <SearchSection
                  icon="location_on"
                  iconBg="var(--cafe-blue)"
                  title="코트"
                  count={courts.length}
                  moreHref="/courts"
                >
                  {courts.map((court) => (
                    <SearchResultItem
                      key={court.id}
                      href={`/courts/${court.id}`}
                      title={court.name}
                      subtitle={[
                        COURT_TYPE_LABELS[court.court_type] || court.court_type,
                        court.district || court.city,
                        court.average_rating != null
                          ? `${court.average_rating.toFixed(1)}점`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))}
                </SearchSection>
              )}

              {/* ==== 유저 섹션 ==== */}
              {showUsers && users.length > 0 && (
                <SearchSection
                  icon="person"
                  iconBg="#8b5cf6"
                  title="유저"
                  count={users.length}
                  moreHref={`/search?q=${encodeURIComponent(q)}`}
                >
                  {users.map((user) => (
                    <SearchResultItem
                      key={user.id}
                      href={`/users/${user.id}`}
                      title={user.nickname || user.name || "알 수 없음"}
                      subtitle={[
                        user.position
                          ? POSITION_LABELS[user.position] || user.position
                          : null,
                        user.city,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))}
                </SearchSection>
              )}

              {/* ==== 커뮤니티 섹션 ==== */}
              {showCommunity && posts.length > 0 && (
                <SearchSection
                  icon="forum"
                  iconBg="#10b981"
                  title="커뮤니티"
                  count={posts.length}
                  moreHref="/community"
                >
                  {posts.map((post) => (
                    <SearchResultItem
                      key={post.id}
                      href={`/community/${post.id}`}
                      title={post.title}
                      subtitle={[
                        CATEGORY_LABELS[post.category || "general"] ||
                          post.category,
                        post.comments_count > 0
                          ? `댓글 ${post.comments_count}`
                          : null,
                        post.created_at
                          ? new Date(post.created_at).toLocaleDateString(
                              "ko-KR",
                              { month: "short", day: "numeric" },
                            )
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))}
                </SearchSection>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================
 * SearchSection — 카테고리별 결과 섹션
 * 카드 내부에 아이콘 + 제목(건수) + 더보기 링크 + 리스트
 * ============================================================ */
function SearchSection({
  icon,
  iconBg,
  title,
  count,
  moreHref,
  children,
}: {
  icon: string;
  iconBg: string;
  title: string;
  count: number;
  moreHref: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 20,
      }}
    >
      {/* 섹션 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 999,
              background: iconBg,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: "#fff" }}
            >
              {icon}
            </span>
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            {title}
            <span
              style={{
                marginLeft: 6,
                fontFamily: "var(--ff-mono)",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-dim)",
              }}
            >
              {count}
            </span>
          </h3>
        </div>
        <Link
          href={moreHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          더보기
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16 }}
          >
            chevron_right
          </span>
        </Link>
      </div>

      {/* 리스트 — 아이템 사이 구분선 */}
      <div>{children}</div>
    </div>
  );
}

/* ============================================================
 * SearchResultItem — 개별 결과 링크 카드
 * ============================================================ */
function SearchResultItem({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 4px",
        borderBottom: "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              margin: "2px 0 0 0",
              fontSize: 12,
              color: "var(--ink-mute)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <span
        className="material-symbols-outlined"
        style={{
          flexShrink: 0,
          fontSize: 18,
          color: "var(--ink-dim)",
        }}
      >
        chevron_right
      </span>
    </Link>
  );
}
