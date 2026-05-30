"use client";

/**
 * CommunityContent — BDR v2 BoardList 시안 기반 (Phase 4)
 *
 * 이유: BDR v2 시안 `screens/BoardList.jsx`를 그대로 따르면서
 *       기존 API 호출/SSR fallback/preferFilter Context/searchParams 동기화 100% 보존.
 *       UI만 v2로 교체 (with-aside 2열 레이아웃 + 좌측 CommunityAside + board 테이블).
 *
 * 보존 사항:
 *   - `/api/web/community?...` API 호출 그대로 (apiSuccess snake_case)
 *   - SSR 프리페치 fallbackPosts 즉시 렌더 패턴 그대로
 *   - usePreferFilter Context (전역 맞춤 필터) 그대로
 *   - searchParams 동기화 (?category= / ?q=) 그대로
 *   - decodeHtmlEntities 카페 원문 디코드 그대로
 *
 * 변경 사항:
 *   - 토스 스타일 1열 카드 → 시안 .with-aside 2열 (좌 사이드바 + 우 board 테이블)
 *   - 페이지당 10개 → 20개 (PM 결정, 시안 충실)
 *   - 정렬 4종 추가 (최신순/인기순/댓글많은순/조회순) — 클라 사이드 정렬
 *   - 새글 24h 뱃지 (badge--new "N")
 *   - 공지(category=notice)는 시안의 pinned 패턴처럼 항상 상단에 고정 표시
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { decodeHtmlEntities } from "@/lib/utils/decode-html";
import { LoadMoreButton } from "@/components/load-more-button";
import { CommunityAside } from "./community-aside";

// API에서 내려오는 게시글 데이터 타입 (apiSuccess가 snake_case로 자동 변환)
interface PostFromApi {
  id: string;
  public_id: string;
  title: string;
  category: string | null;
  view_count: number;
  comments_count: number;
  likes_count: number;
  created_at: string | null;
  author_nickname: string;
  author_profile_image: string | null;   // 작성자 프로필 이미지 URL (현재 v2 board 테이블에서는 미사용)
  content_preview: string;               // 본문 미리보기 (현재 v2 board 테이블에서는 미사용)
  // 2026-05-04: 알기자 (BDR NEWS) 카드 썸네일 — Hero 사진 우선, news 카테고리만 채워짐
  // SSR fallback (community/page.tsx) 호환 위해 optional
  thumbnail_url?: string | null;
}

interface CommunityApiResponse {
  posts: PostFromApi[];
  preferred_categories: string[];
}

// 페이지당 게시글 수 — PM 결정: 시안 충실 (한 페이지 20개)
const POSTS_PER_PAGE = 60; // 2026-05-03: 최초 노출 3배 확대 (20→60)

// 새글 판정 임계: 24시간 (시안의 isNew 패턴)
const NEW_BADGE_MS = 24 * 60 * 60 * 1000;

// 정렬 옵션 4종 — 시안 그대로
type SortKey = "latest" | "likes" | "comments" | "views";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "latest",   label: "최신순" },
  { key: "likes",    label: "인기순" },
  { key: "comments", label: "댓글많은순" },
  { key: "views",    label: "조회순" },
];

// 카테고리 라벨 매핑 (board 행 + 헤더 eyebrow에 사용)
const CATEGORY_LABEL: Record<string, string> = {
  general:     "자유게시판",
  recruit:     "팀원모집",
  review:      "대회후기",
  info:        "정보공유",
  qna:         "질문답변",
  notice:      "공지사항",
  marketplace: "농구장터",
  news:        "BDR NEWS", // 2026-05-03: 알기자 (BDR NEWS AI) Phase 2
};

// 카테고리 → 그룹 (헤더 eyebrow 표시용)
const CATEGORY_TO_GROUP: Record<string, "메인" | "플레이" | "이야기"> = {
  notice:      "메인",
  news:        "메인", // 2026-05-03: 알기자 BDR NEWS
  general:     "메인",
  recruit:     "플레이",
  review:      "플레이",
  marketplace: "플레이",
  qna:         "이야기",
  info:        "이야기",
};

// 2026-05-30 (5C-2): 시안 CU1 카테고리 chip row — 운영 8종 taxonomy 그대로.
// 운영 액션/표시 카테고리(community_posts.category)를 시안 칩 형태로만 박제.
// alkija(news)는 강조색 칩(is-alkija) 적용. 데이터 출처/패칭 변경 0.
const CHIP_CATEGORIES: { key: string | null; label: string; icon: string; alkija?: boolean }[] = [
  { key: null,          label: "전체글",    icon: "apps" },
  { key: "news",        label: "BDR NEWS", icon: "newspaper",   alkija: true },
  { key: "general",     label: "자유게시판", icon: "forum" },
  { key: "recruit",     label: "팀원모집",  icon: "group_add" },
  { key: "review",      label: "대회후기",  icon: "rate_review" },
  { key: "qna",         label: "질문답변",  icon: "help" },
  { key: "info",        label: "정보공유",  icon: "lightbulb" },
  { key: "marketplace", label: "농구장터",  icon: "storefront" },
  { key: "notice",      label: "공지사항",  icon: "campaign" },
];

// -- 날짜 포맷 (MM-DD) — 시안의 p.date.slice(5) 패턴 --
function formatBoardDate(isoString: string | null): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    // YYYY-MM-DD에서 MM-DD만 추출
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${m}-${d}`;
  } catch {
    return "";
  }
}

// -- 새글 판정 (created_at이 24시간 이내) --
function isNewPost(isoString: string | null): boolean {
  if (!isoString) return false;
  try {
    const created = new Date(isoString).getTime();
    return Date.now() - created < NEW_BADGE_MS;
  } catch {
    return false;
  }
}

// -- 스켈레톤 (시안 board 테이블 형태) --
function BoardSkeleton() {
  return (
    <div className="board" aria-busy="true">
      <div className="board__head">
        <div>번호</div><div>제목</div><div>작성자</div><div>날짜</div><div>조회</div><div>추천</div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="board__row" style={{ opacity: 0.5 }}>
          <div className="num">…</div>
          <div className="title">로딩 중…</div>
          <div style={{ fontSize: 12 }}>—</div>
          <div style={{ fontSize: 12 }}>—</div>
          <div style={{ fontSize: 12 }}>—</div>
          <div style={{ fontSize: 12 }}>—</div>
        </div>
      ))}
    </div>
  );
}

// 서버 프리페치 데이터를 받기 위한 props 타입
interface CommunityContentProps {
  fallbackPosts?: PostFromApi[];
}

export function CommunityContent({ fallbackPosts }: CommunityContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 게시글 데이터 + 로딩 상태 (기존 패턴 그대로)
  const [posts, setPosts] = useState<PostFromApi[]>(fallbackPosts ?? []);
  const [loading, setLoading] = useState(!fallbackPosts);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(!!fallbackPosts);
  const [currentPage, setCurrentPage] = useState(1);
  // 2026-05-04 (5차 fix): games 헤더 패턴 차용 — 검색/정렬을 아이콘 토글로.
  // searchOpen / sortOpen 으로 펼침 panel 표시. 기본은 닫힘 (Hero 압축 효과).
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // 정렬 상태 — 클라이언트 사이드 (시안 4종)
  const [sortKey, setSortKey] = useState<SortKey>("latest");

  // 전역 맞춤 필터 Context
  const { preferFilter } = usePreferFilter();

  // URL에서 필터 상태 읽기
  const category = searchParams.get("category") || null;
  const appliedQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(appliedQuery);

  // 카테고리 변경 — CommunityAside 클릭 시 호출됨
  const handleCategoryChange = useCallback((cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set("category", cat);
    } else {
      params.delete("category");
    }
    router.push(`${pathname}?${params.toString()}`);
    setCurrentPage(1);
  }, [searchParams, router, pathname]);

  // API 호출: searchParams 또는 preferFilter 변경 시 (기존 로직 그대로)
  useEffect(() => {
    const hasFiltersInUrl = searchParams.get("category") || searchParams.get("q") || preferFilter;
    if (initialLoadDone && !hasFiltersInUrl) {
      setInitialLoadDone(false);
      return;
    }
    setInitialLoadDone(false);

    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());
    if (preferFilter) {
      params.set("prefer", "true");
    } else {
      params.delete("prefer");
    }
    const url = `/api/web/community?${params.toString()}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<CommunityApiResponse>;
      })
      .then((data) => {
        if (data) {
          setPosts(data.posts ?? []);
          setPreferredCategories(data.preferred_categories ?? []);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setPosts([]);
      })
      .finally(() => {
        setLoading(false);
        setCurrentPage(1);
      });

    return () => controller.abort();
  }, [searchParams, preferFilter]);

  // 검색 폼 제출
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // -- 공지/일반 분리 + 정렬 + 페이지네이션 --
  // 이유: 시안에서 pinned는 항상 상단 고정. DB에 is_pinned 컬럼이 없으므로
  //       category=notice를 사실상 공지로 간주해 항상 상단 노출.
  //       단, 사용자가 notice 카테고리를 선택한 경우엔 분리하지 않음(자체 목록).
  const { pinnedPosts, regularPosts, paginatedRegular, hasMore, remaining } = useMemo(() => {
    const isNoticeBoard = category === "notice";
    const pinned = isNoticeBoard ? [] : posts.filter((p) => p.category === "notice");
    const rest = isNoticeBoard ? posts : posts.filter((p) => p.category !== "notice");

    // 정렬 (클라이언트 사이드)
    const sorted = [...rest].sort((a, b) => {
      switch (sortKey) {
        case "likes":    return (b.likes_count ?? 0) - (a.likes_count ?? 0);
        case "comments": return (b.comments_count ?? 0) - (a.comments_count ?? 0);
        case "views":    return (b.view_count ?? 0) - (a.view_count ?? 0);
        case "latest":
        default: {
          // created_at 내림차순 (null은 뒤로)
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        }
      }
    });

    // 2026-05-03: 페이지네이션 → 더보기 누적 슬라이스
    const visibleCount = currentPage * POSTS_PER_PAGE;
    const slice = sorted.slice(0, visibleCount);
    return {
      pinnedPosts: pinned,
      regularPosts: sorted,
      paginatedRegular: slice,
      hasMore: sorted.length > visibleCount,
      remaining: Math.max(0, sorted.length - visibleCount),
    };
  }, [posts, sortKey, currentPage, category]);

  // 2026-05-30 (5C-2): 이 주 인기 글 — 시안 COMM_HOT 자리. mock 금지 → 실데이터 파생.
  // 현재 로드된 posts(공지+일반 전체)를 view_count 내림차순 정렬해 상위 5건.
  // 별도 API/패칭 추가 0 (이미 로드된 데이터 재사용).
  const hotPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
      .slice(0, 5);
  }, [posts]);

  const hasFilters = !!(category || appliedQuery || preferFilter);

  // 페이지 헤더 — 카테고리/검색에 따라 동적
  const headerInfo = (() => {
    if (category && CATEGORY_LABEL[category]) {
      return {
        eyebrow: CATEGORY_TO_GROUP[category] ?? "커뮤니티",
        title: CATEGORY_LABEL[category],
      };
    }
    if (appliedQuery) {
      return { eyebrow: "검색 결과", title: `"${appliedQuery}"` };
    }
    return { eyebrow: "커뮤니티", title: "전체글" };
  })();

  // 카테고리 변경 시 검색어 입력값도 URL 동기화 (기존 동작)
  useEffect(() => {
    setSearchQuery(appliedQuery);
  }, [appliedQuery]);

  // 맞춤 필터가 활성화되어 있고 선호 카테고리가 비어있을 때 사용자가 알 수 있도록
  // (현재 설계는 선호 카테고리 토글 UI는 헤더 영역에 두지 않음 — 전역 컨텍스트가 담당)
  void preferredCategories;

  /* Hero 우측 액션 영역 — 검색 / 정렬 / 만들기 3 아이콘 (games 헤더 패턴 차용).
     2026-05-04 (5차 fix): 사용자 요청 "games 페이지처럼 우측 상단에 3개 아이콘".
     - 검색: 토글 → searchOpen 시 .page-hero 직후 input row 펼침
     - 정렬: 토글 → sortOpen 시 .page-hero 직후 sort-bar-mobile-wrap 펼침
     - 만들기: Link (PC/모바일 동일 "+ 만들기")
     클래스: .games-filter-btn (검색/정렬 32×32 정사각형) + .games-create-btn (만들기). */
  const renderHeaderActions = () => (
    <div
      className="community-header__actions"
      style={{ display: "flex", gap: 8, alignItems: "center" }}
    >
      <button
        type="button"
        className={`games-filter-btn${searchOpen ? " is-open" : ""}`}
        onClick={() => setSearchOpen((o) => !o)}
        aria-label="검색"
        aria-expanded={searchOpen}
        title="검색"
      >
        <span className="material-symbols-outlined" aria-hidden="true">search</span>
      </button>
      <button
        type="button"
        className={`games-filter-btn${sortOpen ? " is-open" : ""}`}
        onClick={() => setSortOpen((o) => !o)}
        aria-label="정렬"
        aria-expanded={sortOpen}
        title="정렬"
      >
        <span className="material-symbols-outlined" aria-hidden="true">swap_vert</span>
      </button>
      <Link href="/community/new" className="btn btn--primary games-create-btn">
        <span className="material-symbols-outlined" aria-hidden="true">add</span>
        <span>글쓰기</span>
      </Link>
    </div>
  );

  return (
    <div className="page">
      <div className="with-aside">
        {/* 좌측 사이드바: 게시판 그룹 트리 */}
        <CommunityAside
          activeCategory={category}
          onSelect={handleCategoryChange}
        />

        {/* 우측 메인: 헤더 + 카테고리 탭(모바일) + 정렬 바 + 게시글 테이블 + 페이저 */}
        <main>
          {/* 1. 헤더 — eyebrow + 제목 + 글 수 + 우측 actions(검색/정렬/만들기 3 아이콘).
              2026-05-04 (5차 fix): games 헤더 패턴 차용 — grid 1fr auto 로 좌측 title / 우측 actions.
              인라인 flex+wrap 폐기 (4차 옵션 B의 wrap 본질 영구 차단). */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "start",
              columnGap: 12,
            }}
            className="page-hero"
          >
            <div style={{ minWidth: 0 }}>
              <div className="eyebrow page-hero__eyebrow">{headerInfo.eyebrow}</div>
              {/* 시안 충실: h1/글수에 whiteSpace:nowrap 박제 (.page-hero__title 에 포함) */}
              <h1 className="page-hero__title">{headerInfo.title}</h1>
              <div className="page-hero__subtitle">
                {/* 공지(pinned)도 합산 */}
                전체 {(pinnedPosts.length + regularPosts.length).toLocaleString()}개의 글
              </div>
            </div>

            {/* 우측 액션 — 검색 / 정렬 / 만들기 3 아이콘 (games 패턴) */}
            {renderHeaderActions()}
          </div>

          {/* 검색 펼침 row — searchOpen 시에만. 검색 아이콘 토글 결과. */}
          {searchOpen && (
            <form
              onSubmit={handleSearch}
              className="community-search-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 10px",
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-chip)",
                marginBottom: 10,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: "var(--ink-dim)", flexShrink: 0 }}
              >
                search
              </span>
              <input
                className="input"
                style={{
                  flex: 1,
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  fontSize: 13,
                  minWidth: 0,
                }}
                placeholder="게시판 내 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </form>
          )}

          {/* 2. 정렬 바 — 4종 토글 + 우측 "한 페이지 N개" 캡션.
              2026-05-04 (5차 fix): sortOpen 조건부 렌더 — 정렬 아이콘 클릭 시에만 펼침.
              기본 hidden 으로 Hero 직후 빈공간 최소화 (사용자 요청 "games 페이지처럼 컴팩트"). */}
          {sortOpen && (
          <div className="sort-bar-mobile-wrap">
            <div className="sort-bar-mobile">
              <span style={{ color: "var(--ink-dim)", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                정렬
              </span>
              {SORT_OPTIONS.map((opt) => {
                const active = sortKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSortKey(opt.key);
                      setCurrentPage(1); // 정렬 변경 시 1페이지로
                    }}
                    style={{
                      padding: "4px 8px",
                      border: 0,
                      background: active ? "var(--cafe-blue-soft)" : "transparent",
                      color: active ? "var(--cafe-blue-deep)" : "var(--ink-mute)",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: active ? 700 : 500,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <span style={{ flex: 1, minWidth: 8 }} />
              <span style={{ color: "var(--ink-dim)", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
                한 페이지 {POSTS_PER_PAGE}개
              </span>
            </div>
            {/* 우측 fade + 화살표 — 카테고리 탭과 동일. aria-hidden + pointer-events:none(CSS). */}
            <div className="sort-bar-mobile-fade" aria-hidden="true">
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </div>
          )}

          {/* 3. 카테고리 chip row (BC2) — 2026-05-30 (5C-2) 시안 CU1 박제.
              운영 8종 taxonomy 그대로. 칩 클릭 = 기존 handleCategoryChange(URL ?category=) 재사용.
              sticky chip — 데스크톱/모바일 공통. (기존 CommunityMobileTabs 는 제거하고 이 칩으로 통합) */}
          <div className="cu1-chips" role="tablist">
            {CHIP_CATEGORIES.map((c) => {
              // 활성: key=null 칩은 카테고리 미선택 시, 그 외는 key 일치 시
              const isOn = c.key === null ? !category : category === c.key;
              return (
                <button
                  key={c.key ?? "all"}
                  type="button"
                  role="tab"
                  aria-selected={isOn}
                  className={`cu1-chip${isOn ? " is-on" : ""}${c.alkija ? " is-alkija" : ""}`}
                  onClick={() => handleCategoryChange(c.key)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">{c.icon}</span>
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* 4. 본문 그리드 — 좌: 게시글 카드 리스트 / 우: 이 주 인기 글 (실데이터 파생) */}
          {loading ? (
            <BoardSkeleton />
          ) : posts.length === 0 ? (
            // 빈 상태
            <div
              className="board"
              style={{ padding: "60px 20px", textAlign: "center" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}
              >
                forum
              </span>
              <p style={{ fontSize: 14, color: "var(--ink-mute)", marginBottom: 16 }}>
                {hasFilters ? "조건에 맞는 게시글이 없습니다" : "아직 게시글이 없어요"}
              </p>
              <Link href="/community/new" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                첫 글쓰기
              </Link>
            </div>
          ) : (
            <div className="cu1-grid">
              {/* 좌측: 게시글 카드 리스트 (공지 핀 → 일반 정렬·페이지네이션) */}
              <div className="cu1-list">
                {/* 공지 핀 — 항상 상단 (카테고리=notice 선택 시는 분리 안 함) */}
                {pinnedPosts.map((p) => (
                  <PostCard key={`pin-${p.id}`} post={p} pinned />
                ))}
                {/* 일반 글 — 정렬 + 더보기 누적 슬라이스 */}
                {paginatedRegular.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}

                {/* 더보기 버튼 — 기존 누적 페이지네이션 보존 */}
                <LoadMoreButton
                  hasMore={hasMore ?? false}
                  onMore={() => setCurrentPage((p) => p + 1)}
                  remaining={remaining}
                />
              </div>

              {/* 우측 사이드바: 이 주 인기 글 (실데이터 파생 — mock 금지).
                  내 활동 카드는 mock 데이터(7/34/12/5)라 박제 제외(drop). */}
              <aside className="cu1-side">
                <div className="cu-side-card">
                  <h4 className="cu-side-card__h">
                    <span className="material-symbols-outlined" aria-hidden="true">local_fire_department</span>
                    이 주 인기 글
                  </h4>
                  {hotPosts.length === 0 ? (
                    <div className="cu-side-empty">표시할 인기 글이 없습니다</div>
                  ) : (
                    hotPosts.map((p, i) => (
                      <Link
                        key={p.id}
                        className="cu-hot-row"
                        href={`/community/${p.public_id}`}
                      >
                        <span className="cu-hot-row__rank">{i + 1}</span>
                        <span className="cu-hot-row__title">{decodeHtmlEntities(p.title)}</span>
                        <span className="cu-hot-row__v">{p.view_count.toLocaleString()}</span>
                      </Link>
                    ))
                  )}
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * PostCard — 게시글 카드 1개 (시안 .cu-post · Phase 5C-2 박제)
 *
 * 시안 CU1 카드 구조를 박제하되, board API 미제공 필드는 hide:
 *   - team.name (작성자 옆 소속 팀)  → hide (API 미제공)
 *   - is_official (작성자 verified) → hide (API 미제공)
 *   - image_count (썸네일 +N)        → hide (API 미제공) / thumbnail_url 만 노출
 *   - tournament 알기자 band         → hide (A4 cross-domain mock 0)
 *
 * pinned=true → 고정(공지) 칩 + is-pinned 강조. news → is-alkija 좌측 띠.
 * 표시 데이터: category badge / 제목 / content_preview / 작성자 / 시간 / 조회 / 좋아요 / 댓글.
 */
function PostCard({ post, pinned }: { post: PostFromApi; pinned?: boolean }) {
  const isNew = !pinned && isNewPost(post.created_at);
  // news 카테고리 = BDR NEWS(알기자) → 좌측 강조 띠
  const isAlkija = post.category === "news";
  // 조회수 1500 초과 시 "is-hot" 강조 (시안 동일 임계)
  const isHotView = (post.view_count ?? 0) > 1500;

  return (
    <Link
      href={`/community/${post.public_id}`}
      className={`cu-post${pinned ? " is-pinned" : ""}${isAlkija ? " is-alkija" : ""}`}
    >
      <div className="cu-post__body">
        {/* 상단: 고정 칩 + 카테고리 badge (+ 새글 N) */}
        <div className="cu-post__top">
          {pinned && (
            <span className="cu-post__pin">
              <span className="material-symbols-outlined" aria-hidden="true">push_pin</span>
              고정
            </span>
          )}
          {post.category && (
            <span className="cat-badge" data-cat={post.category}>
              {CATEGORY_LABEL[post.category] ?? post.category}
            </span>
          )}
          {isNew && <span className="badge badge--new">N</span>}
        </div>

        {/* 제목 */}
        <h3 className="cu-post__title">{decodeHtmlEntities(post.title)}</h3>

        {/* 본문 미리보기 — content_preview (board API 제공) */}
        {post.content_preview && (
          <p className="cu-post__excerpt">{decodeHtmlEntities(post.content_preview)}</p>
        )}

        {/* 메타: 작성자 · 시간 · 조회 · 좋아요 · 댓글 (team / is_official 은 API 미제공 hide) */}
        <div className="cu-post__meta">
          <span className="comm-author">
            <span className="comm-author__name">{decodeHtmlEntities(post.author_nickname)}</span>
          </span>
          <span className="cu-post__dot">·</span>
          <span>{formatBoardDate(post.created_at)}</span>
          <span className="cu-post__dot">·</span>
          <span className={`cu-post__meta-stat${isHotView ? " is-hot" : ""}`}>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            {post.view_count.toLocaleString()}
          </span>
          <span className="cu-post__meta-stat">
            <span className="material-symbols-outlined" aria-hidden="true">favorite</span>
            {(post.likes_count ?? 0).toLocaleString()}
          </span>
          <span className="cu-post__meta-stat">
            <span className="material-symbols-outlined" aria-hidden="true">chat_bubble</span>
            {(post.comments_count ?? 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 우측 썸네일 — thumbnail_url(news Hero 사진) 있을 때만. image_count 미지원이므로 +N 카운트 hide */}
      {post.thumbnail_url && (
        <div className="cu-post__thumb">
          <img src={post.thumbnail_url} alt="" loading="lazy" />
        </div>
      )}
    </Link>
  );
}
