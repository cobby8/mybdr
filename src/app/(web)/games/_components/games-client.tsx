"use client";

/* ============================================================
 * GamesClient — BDR-current Games 페이지 클라이언트 래퍼 (Phase B 박제)
 *
 * 왜 이 컴포넌트가 있는가:
 * page.tsx 는 서버 컴포넌트로 DB 프리페치(listGames + typeCounts) 를
 * 수행하고, 결과 배열 + 종류탭 카운트를 prop 으로 이 래퍼에 내려준다.
 * 래퍼는:
 *   1. KindTabBar (segmented + filter 토글) 렌더 + chips 영역 펼침 상태 관리
 *   2. FilterChipBar 의 클라이언트 전용 필터(weekend/free/beginner) state 관리
 *   3. 활성 필터 개수(URL+클라 합산) 계산해 KindTabBar dot 뱃지에 전달
 *   4. 서버가 내려준 games 배열을 클라 필터로 한번 더 걸러냄
 *   5. 자동 파생 태그 계산 → GameCard 그리드 렌더
 *
 * Phase B 변경 핵심:
 * - 종류 탭 segmented 화 + filter 아이콘 토글 도입 (KindTabBar props 확장)
 * - 필터 칩 collapsible — filterOpen 시에만 FilterChipBar 렌더
 * - dot count + 전체해제 버튼 (KindTabBar / FilterChipBar 협업)
 *
 * API/데이터 패칭 변경 0 — UI 렌더링만 교체.
 * ============================================================ */

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GameCard } from "@/components/bdr-v2/game-card";
import {
  KindTabBar,
  type KindTabBarCounts,
} from "@/components/bdr-v2/kind-tab-bar";
import {
  FilterChipBar,
  type ClientFilterKey,
} from "@/components/bdr-v2/filter-chip-bar";

// 서버(page.tsx)가 내려주는 정규화된 게임 shape.
export interface GameForClient {
  id: string;
  uuid: string | null;
  title: string | null;
  status: number;
  gameType: number;
  city: string | null;
  district: string | null;
  venueName: string | null;
  scheduledAt: string | null;
  /** [v2.16] 경기 시간 (시간 단위) — Date Tile 종료 시간 = scheduledAt + durationHours */
  durationHours: number | null;
  currentParticipants: number | null;
  maxParticipants: number | null;
  feePerPerson: string | null;
  skillLevel: string | null;
  /** [M5 2026-06-19] "최신순(latest)" 정렬 키 — ISO 문자열 (없으면 null → 맨 뒤) */
  createdAt: string | null;
  authorNickname: string | null;
  /** [2026-05-29 Phase 2C·BG4] 종료 경기 최종 MVP 닉네임 — 없으면 null (라인 hide) */
  finalMvpNickname: string | null;
}

/* [M5 2026-06-19] 정렬·칩 가용성 메타 — page.tsx(서버)가 좌표/세션 판정 후 내려줌.
 * 클라는 이 배열이 가진 옵션만 렌더한다 (정렬 종류·칩 종류를 UI 에 하드코딩하지 않음).
 * 좌표(lat/lng) 미존재로 "가까운순" 정렬은 sortOptions 에서 제외되고,
 * "내 동네(near)" 칩은 로그인 + preferred_regions 가 있을 때만 chipOptions 에 포함된다. */
export type SortKey = "soon" | "filling" | "latest";
export interface SortOptionMeta {
  key: SortKey;
  label: string;
}
export type ChipKey = "today" | "weekend" | "filling" | "free" | "near";
export interface ChipOptionMeta {
  key: ChipKey;
  label: string;
}

export interface GamesClientProps {
  /** 서버 프리페치 결과 — listGames 반환분을 직렬화한 배열 */
  games: GameForClient[];
  /** 종류 탭 카운트 — page.tsx 에서 prisma.groupBy 로 계산해 내려줌 */
  typeCounts: KindTabBarCounts;
  /** [M5] 노출 가능한 정렬 옵션 (가까운순은 좌표 0 이라 서버에서 제외됨) */
  sortOptions: SortOptionMeta[];
  /** [M5] 노출 가능한 빠른필터 칩 (near 는 로그인+preferred_regions 일 때만 포함) */
  chipOptions: ChipOptionMeta[];
  /** [M5] 로그인 사용자의 맞춤 지역 — "내 동네" 칩이 city/district 매칭에 사용 */
  preferredRegions: string[];
}

/* [M5 2026-06-19] 정렬 드롭다운(데스크톱) / 하단 시트(모바일) — 시안 Games.jsx 박제.
 * 옵션은 sortOptions 메타로만 렌더(좌표 0 → "가까운순" 미포함). CSS 는 globals.css .games-sort-* 토큰. */
function SortMenu({
  options,
  sort,
  onChange,
}: {
  options: SortOptionMeta[];
  sort: SortKey;
  onChange: (next: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === sort) ?? options[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn--sm games-sort-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Material Symbols — 시안의 ⇅ 유니코드 대신 토큰 아이콘 사용(룰: lucide 금지) */}
        <span
          className="material-symbols-outlined games-sort-icon"
          aria-hidden="true"
        >
          swap_vert
        </span>
        <span className="games-sort-label">정렬 · {current?.label}</span>
        <span
          className="material-symbols-outlined games-sort-caret"
          aria-hidden="true"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <>
          {/* 바깥 클릭 닫기 오버레이 */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div className="games-sort-menu" role="listbox">
            <div className="games-sort-sheet-grip" aria-hidden="true" />
            <div className="games-sort-sheet-title">정렬 기준</div>
            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={sort === o.key}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className="games-sort-item"
                data-active={sort === o.key}
              >
                <span>{o.label}</span>
                {sort === o.key && (
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    style={{ color: "var(--accent)", fontSize: 18 }}
                  >
                    check
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 2026-05-03: 헤더 우측 actions = filter 토글 + 만들기 버튼 묶음 (사용자 요청 — 필터를 만들기 좌측으로 이동)
// [M5] 정렬 메뉴를 필터 토글 좌측에 추가 (시안 Games.jsx — 정렬·만들기 우측 묶음).
function HeaderActions({
  filterOpen,
  activeFilterCount,
  onToggleFilter,
  sortOptions,
  sort,
  onChangeSort,
}: {
  filterOpen: boolean;
  activeFilterCount: number;
  onToggleFilter: () => void;
  sortOptions: SortOptionMeta[];
  sort: SortKey;
  onChangeSort: (next: SortKey) => void;
}) {
  const filterBtnClasses = [
    "games-filter-btn",
    filterOpen ? "is-open" : "",
    activeFilterCount > 0 ? "has-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="games-header__actions"
      style={{ display: "flex", gap: 8, alignItems: "center" }}
    >
      {/* [M5] 정렬 메뉴 — 옵션 1개 이하면 의미 없으므로 숨김(현재는 항상 3개) */}
      {sortOptions.length > 1 && (
        <SortMenu options={sortOptions} sort={sort} onChange={onChangeSort} />
      )}
      <button
        type="button"
        className={filterBtnClasses}
        onClick={onToggleFilter}
        aria-label="필터"
        aria-expanded={filterOpen}
        title="필터"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          tune
        </span>
        {activeFilterCount > 0 && (
          <span className="games-filter-btn__dot">{activeFilterCount}</span>
        )}
      </button>
      <Link href="/games/new" className="btn btn--primary games-create-btn">
        <span className="material-symbols-outlined" aria-hidden="true">
          add
        </span>
        <span>만들기</span>
      </Link>
    </div>
  );
}

/* ============================================================
 * [M5 2026-06-19] 정렬 · 빠른필터 메모리 레이어 유틸
 *
 * 서버 패칭(listGames)·API·route.ts 는 그대로 두고, 클라이언트에서 이미 내려받은
 * games 배열을 정렬/필터링만 한다. listGames 는 take=60 단일 호출(skip/cursor·무한스크롤
 * 없음 = 전체 로드)이라 메모리 정렬이 현재 목록 전체에 정확히 적용된다.
 * ============================================================ */

// fill_pct = round(current / max * 100). max 가 0/없으면 0.
function fillPct(g: GameForClient): number {
  const max = g.maxParticipants ?? 0;
  const cur = g.currentParticipants ?? 0;
  if (max <= 0) return 0;
  return Math.min(100, Math.round((cur / max) * 100));
}

// 정렬 비교 — soon(임박순)/filling(모집임박순)/latest(최신순).
//   soon: scheduled_at 오름차순, 단 "미래 우선"(과거·null 은 맨 뒤로 밀어 미래 경기가 먼저).
//   filling: fill_pct 내림차순(많이 찬 순).
//   latest: created_at 내림차순(최근 등록 우선).
function sortGames(list: GameForClient[], sort: SortKey): GameForClient[] {
  const now = Date.now();
  const arr = [...list]; // 원본 불변 유지 후 정렬
  if (sort === "soon") {
    return arr.sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : NaN;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : NaN;
      // 미래(>= now) 를 과거/무효보다 앞에 둔다.
      const aFuture = !Number.isNaN(ta) && ta >= now;
      const bFuture = !Number.isNaN(tb) && tb >= now;
      if (aFuture !== bFuture) return aFuture ? -1 : 1;
      // 둘 다 미래거나 둘 다 과거면 시간 오름차순(임박순). 무효는 맨 뒤.
      const va = Number.isNaN(ta) ? Infinity : ta;
      const vb = Number.isNaN(tb) ? Infinity : tb;
      return va - vb;
    });
  }
  if (sort === "filling") {
    return arr.sort((a, b) => fillPct(b) - fillPct(a));
  }
  // latest: created_at desc (없으면 맨 뒤)
  return arr.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
    return tb - ta;
  });
}

// 빠른필터 칩 매칭 — 다중 AND. preferredRegions 는 "내 동네(near)" 매칭용.
//   today: scheduled_at 이 오늘(로컬 자정~내일 자정)
//   weekend: scheduled_at 요일이 토(6)·일(0)
//   filling: fill_pct >= 70
//   free: fee_per_person == 0 (또는 null = 무료)
//   near: preferredRegions 중 하나가 city/district 에 포함(부분 매칭)
function matchesChip(
  g: GameForClient,
  chip: ChipKey,
  preferredRegions: string[],
): boolean {
  if (chip === "today") {
    if (!g.scheduledAt) return false;
    const d = new Date(g.scheduledAt);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  if (chip === "weekend") {
    if (!g.scheduledAt) return false;
    const dow = new Date(g.scheduledAt).getDay();
    return dow === 0 || dow === 6;
  }
  if (chip === "filling") {
    return fillPct(g) >= 70;
  }
  if (chip === "free") {
    const fee = g.feePerPerson ? Number(g.feePerPerson) : 0;
    return !g.feePerPerson || fee === 0;
  }
  // near = 내 동네: 좌표 대신 preferred_regions 와 city/district 부분 매칭.
  if (chip === "near") {
    if (preferredRegions.length === 0) return false;
    const area = `${g.city ?? ""} ${g.district ?? ""}`;
    return preferredRegions.some((r) => r && area.includes(r));
  }
  return true;
}

/* -- 태그 자동 파생 유틸 (DQ3) -- */
const BEGINNER_SKILLS = new Set(["beginner", "lowest", "low"]);
function deriveTags(g: GameForClient): string[] {
  const tags: string[] = [];
  const fee = g.feePerPerson ? Number(g.feePerPerson) : 0;
  if (!g.feePerPerson || fee === 0) tags.push("무료");
  if (g.skillLevel && BEGINNER_SKILLS.has(g.skillLevel)) tags.push("초보환영");
  if (g.scheduledAt) {
    const d = new Date(g.scheduledAt);
    if (!Number.isNaN(d.getTime())) {
      const dow = d.getDay();
      if (dow === 0 || dow === 6) tags.push("주말");
    }
  }
  return tags;
}

/* -- areaLabel 유틸 -- */
function formatArea(g: GameForClient): string {
  const city = g.city?.trim() ?? "";
  const district = g.district?.trim() ?? "";
  if (city && district) return `${city} ${district}`;
  return city || district || "";
}

/* -- 카드 href -- */
function gameHref(g: GameForClient): string {
  const short = g.uuid?.slice(0, 8);
  return `/games/${short ?? g.id}`;
}

// URL 칩 활성 판정 — KindTabBar dot count 계산용 (FilterChipBar 와 동일 규칙)
// 왜 여기서 따로 계산하는가: dot 뱃지는 chips 가 닫혀있어도 표시돼야 하므로
// 부모(GamesClient) 가 직접 URL 을 읽어 카운트해야 한다.
function countActiveUrlFilters(params: URLSearchParams): number {
  let n = 0;
  // date 칩 — today / week 두 값 중 하나면 1개
  const date = params.get("date");
  if (date === "today" || date === "week") n += 1;
  // city 칩 — 서울 / 경기 부분 매칭
  const city = params.get("city");
  if (city) {
    if (city.includes("서울")) n += 1;
    else if (city.includes("경기")) n += 1;
  }
  return n;
}

export function GamesClient({
  games,
  typeCounts,
  sortOptions,
  chipOptions,
  preferredRegions,
}: GamesClientProps) {
  // 클라 전용 필터 상태 (weekend/free/beginner) — Set 으로 다중 활성 관리
  const [clientFilters, setClientFilters] = useState<Set<ClientFilterKey>>(
    () => new Set(),
  );
  // 필터 chips 영역 펼침 상태 — 시안 collapsible
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // [M5] 정렬 상태 — 기본 soon(임박순). sortOptions 가 가진 키만 유효.
  const [sort, setSort] = useState<SortKey>("soon");
  // [M5] 빠른필터 칩 상태 (today/weekend/filling/free/near) — 다중 AND.
  //   clientFilters(FilterChipBar) 와는 별개 레이어로, 둘 다 적용되면 AND 누적된다.
  const [quickChips, setQuickChips] = useState<Set<ChipKey>>(() => new Set());

  const handleChangeSort = useCallback((next: SortKey) => {
    setSort(next);
  }, []);

  // 빠른필터 칩 토글 — Set 불변성 유지.
  const handleToggleQuickChip = useCallback((key: ChipKey) => {
    setQuickChips((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // 빈상태 CTA① "맞춤필터 끄기" — 클라가 거르는 모든 필터 전체 리셋.
  //   왜: filtered(0건)는 ①clientFilters(FilterChipBar weekend/free/beginner)
  //       ②quickChips(M5 빠른필터) 두 레이어의 AND 로 만들어진다. quickChips 만
  //       비우면 clientFilters 로 0건일 때는 눌러도 여전히 0건(사용자 갇힘).
  //   → 0건을 유발할 수 있는 클라 메모리 필터(quickChips + clientFilters)를 함께
  //     비워 목록이 전체(정렬만 적용)로 복구되게 한다.
  //   KindTab(kind)·URL 칩(date/city)은 리셋 대상에서 제외:
  //     - KindTab(종류 탭)은 "현재 보는 경기 종류" 컨텍스트라 필터 끄기와 무관(유지).
  //     - URL 칩(date/city)은 서버 listGames 가 처리하는 별개 레이어로, 클라 filtered
  //       에 직접 영향을 주지 않으므로 클라 측 "맞춤필터 끄기" 범위 밖(FilterChipBar 책임).
  const handleResetQuickChips = useCallback(() => {
    setQuickChips(new Set());
    setClientFilters(new Set());
  }, []);

  // 빈상태 CTA② "인접 지역 보기" — "내 동네(near)" 해제(인접 지역까지 노출).
  const handleShowNearby = useCallback(() => {
    setQuickChips((prev) => {
      if (!prev.has("near")) return prev;
      const next = new Set(prev);
      next.delete("near");
      return next;
    });
  }, []);

  // URL 파라미터 — useSearchParams 로 활성 URL 칩 카운트 산출
  const searchParams = useSearchParams();
  const urlActiveCount = countActiveUrlFilters(
    new URLSearchParams(searchParams.toString()),
  );
  // KindTabBar dot 뱃지에 표시할 총 활성 필터 개수
  const activeFilterCount = urlActiveCount + clientFilters.size;

  // 칩 토글 콜백 — Set 불변성 유지
  const handleToggleClientFilter = useCallback((key: ClientFilterKey) => {
    setClientFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // 전체 해제 (클라 필터만) — URL 측은 FilterChipBar 가 직접 처리
  const handleClearClientFilters = useCallback(() => {
    setClientFilters(new Set());
  }, []);

  // filter 토글 — chips 영역 펼침/접힘
  const handleToggleFilter = useCallback(() => {
    setFilterOpen((o) => !o);
  }, []);

  // 클라 필터 적용 — 서버에서 내려온 games 배열을 한 번 더 거른다 (AND 결합).
  //   ① clientFilters(FilterChipBar weekend/free/beginner) ② quickChips(M5 빠른필터) 둘 다 AND.
  //   마지막에 sort 로 정렬(메모리). listGames 가 전체 로드(take=60)라 정렬이 목록 전체에 정확.
  const filtered = useMemo(() => {
    let list = games;

    // ① 기존 FilterChipBar 필터 (동작 보존)
    if (clientFilters.size > 0) {
      list = list.filter((g) => {
        if (clientFilters.has("free")) {
          const fee = g.feePerPerson ? Number(g.feePerPerson) : 0;
          if (g.feePerPerson && fee > 0) return false;
        }
        if (clientFilters.has("beginner")) {
          if (!g.skillLevel || !BEGINNER_SKILLS.has(g.skillLevel)) return false;
        }
        if (clientFilters.has("weekend")) {
          if (!g.scheduledAt) return false;
          const dow = new Date(g.scheduledAt).getDay();
          if (dow !== 0 && dow !== 6) return false;
        }
        return true;
      });
    }

    // ② M5 빠른필터 칩 — 활성 칩 모두 만족(AND)해야 통과.
    if (quickChips.size > 0) {
      list = list.filter((g) =>
        [...quickChips].every((chip) =>
          matchesChip(g, chip, preferredRegions),
        ),
      );
    }

    // ③ 정렬 (메모리)
    return sortGames(list, sort);
  }, [games, clientFilters, quickChips, sort, preferredRegions]);

  return (
    <>
      {/* 2026-05-03: 헤더 — 좌측 title / 우측 actions(필터+만들기) — 사용자 요청 (필터를 만들기 좌측으로) */}
      <div className="games-header">
        <div className="games-header__title">
          <div className="eyebrow">경기 · GAMES</div>
          <h1 className="games-header__h1">픽업 · 게스트 모집</h1>
          <div className="games-header__sub">
            같이 뛸 사람을 찾는 {typeCounts.all}건의 모집이 열려 있습니다
          </div>
        </div>
        <HeaderActions
          filterOpen={filterOpen}
          activeFilterCount={activeFilterCount}
          onToggleFilter={handleToggleFilter}
          sortOptions={sortOptions}
          sort={sort}
          onChangeSort={handleChangeSort}
        />
      </div>

      {/* 종류 탭 (segmented만) — filter 토글 prop 안 넘김 → 자동으로 우측 filter 버튼 렌더 X */}
      <KindTabBar counts={typeCounts} />

      {/* [M5] 빠른필터 칩 바 — 가로 스크롤, 다중 선택(AND). chipOptions 메타가 가진 칩만 렌더.
       *   near(내 동네)는 로그인+preferred_regions 일 때만 chipOptions 에 포함되어 노출됨. */}
      {chipOptions.length > 0 && (
        <div className="games-chips" role="group" aria-label="빠른 필터">
          {chipOptions.map((c) => {
            const on = quickChips.has(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => handleToggleQuickChip(c.key)}
                className="games-chip"
                data-active={on}
                aria-pressed={on}
              >
                {c.label}
              </button>
            );
          })}
          {quickChips.size > 0 && (
            <button
              type="button"
              onClick={handleResetQuickChips}
              className="games-chip games-chip--clear"
            >
              초기화 ✕
            </button>
          )}
        </div>
      )}

      {/* 필터 칩 영역 — collapsible (filterOpen 일 때만 렌더) */}
      {filterOpen && (
        <FilterChipBar
          activeClientFilters={clientFilters}
          onToggleClientFilter={handleToggleClientFilter}
          onClearClientFilters={handleClearClientFilters}
        />
      )}

      {/* 카드 그리드 — 시안 .games-grid (auto-fill minmax(320px, 1fr)) */}
      <div className="games-grid">
        {filtered.map((g) => (
          <GameCard
            key={g.id}
            href={gameHref(g)}
            gameType={g.gameType}
            status={g.status}
            title={g.title}
            venueName={g.venueName}
            areaLabel={formatArea(g)}
            scheduledAt={g.scheduledAt}
            durationHours={g.durationHours}
            skillLevel={g.skillLevel}
            feePerPerson={g.feePerPerson}
            currentParticipants={g.currentParticipants}
            maxParticipants={g.maxParticipants}
            authorNickname={g.authorNickname}
            finalMvpNickname={g.finalMvpNickname}
            tags={deriveTags(g)}
          />
        ))}
      </div>

      {/* 빈 상태 — [M5] 시안 박제. 필터로 0건이면 안내 + CTA(맞춤필터 끄기 / 인접 지역 보기).
       *   games 자체가 0건(필터와 무관)이면 CTA 없이 단순 안내만. 문구 5단어 이내. */}
      {filtered.length === 0 &&
        (games.length === 0 ? (
          <div
            style={{
              padding: "48px 18px",
              textAlign: "center",
              color: "var(--ink-dim)",
              fontSize: 14,
            }}
          >
            등록된 경기가 없습니다.
          </div>
        ) : (
          <div
            className="card"
            style={{ padding: "56px 24px", textAlign: "center" }}
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{
                fontSize: 34,
                marginBottom: 10,
                color: "var(--ink-dim)",
              }}
            >
              search_off
            </span>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>
              조건에 맞는 모집이 없어요
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--ink-mute)",
                marginBottom: 18,
              }}
            >
              필터를 줄이거나 인접 지역을 둘러보세요
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {/* CTA① 맞춤필터 끄기 — 빠른필터 칩 전체 리셋(5단어 이내) */}
              <button
                type="button"
                className="btn btn--primary"
                style={{ minHeight: 44 }}
                onClick={handleResetQuickChips}
              >
                맞춤필터 끄기
              </button>
              {/* CTA② 인접 지역 보기 — "내 동네" 칩이 켜져 있을 때만 의미 있으므로 그때만 노출 */}
              {quickChips.has("near") && (
                <button
                  type="button"
                  className="btn"
                  style={{ minHeight: 44 }}
                  onClick={handleShowNearby}
                >
                  인접 지역 보기
                </button>
              )}
            </div>
          </div>
        ))}
    </>
  );
}
