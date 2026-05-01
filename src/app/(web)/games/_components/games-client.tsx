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
  currentParticipants: number | null;
  maxParticipants: number | null;
  feePerPerson: string | null;
  skillLevel: string | null;
  authorNickname: string | null;
}

export interface GamesClientProps {
  /** 서버 프리페치 결과 — listGames 반환분을 직렬화한 배열 */
  games: GameForClient[];
  /** 종류 탭 카운트 — page.tsx 에서 prisma.groupBy 로 계산해 내려줌 */
  typeCounts: KindTabBarCounts;
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

export function GamesClient({ games, typeCounts }: GamesClientProps) {
  // 클라 전용 필터 상태 (weekend/free/beginner) — Set 으로 다중 활성 관리
  const [clientFilters, setClientFilters] = useState<Set<ClientFilterKey>>(
    () => new Set(),
  );
  // 필터 chips 영역 펼침 상태 — 시안 collapsible
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

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

  // 클라 필터 적용 — 서버에서 내려온 games 배열을 한 번 더 거른다 (AND 결합)
  const filtered = useMemo(() => {
    if (clientFilters.size === 0) return games;
    return games.filter((g) => {
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
  }, [games, clientFilters]);

  return (
    <>
      {/* 종류 탭 (segmented) + filter 토글 버튼 — 시안 .games-toolbar */}
      <KindTabBar
        counts={typeCounts}
        filterOpen={filterOpen}
        activeFilterCount={activeFilterCount}
        onToggleFilter={handleToggleFilter}
      />

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
            skillLevel={g.skillLevel}
            feePerPerson={g.feePerPerson}
            currentParticipants={g.currentParticipants}
            maxParticipants={g.maxParticipants}
            authorNickname={g.authorNickname}
            tags={deriveTags(g)}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {filtered.length === 0 && (
        <div
          style={{
            padding: "48px 18px",
            textAlign: "center",
            color: "var(--ink-dim)",
            fontSize: 14,
          }}
        >
          {games.length === 0
            ? "등록된 경기가 없습니다."
            : "조건에 맞는 경기가 없습니다. 필터를 조정해 보세요."}
        </div>
      )}
    </>
  );
}
