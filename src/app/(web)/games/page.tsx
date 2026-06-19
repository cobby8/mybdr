import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { listGames, type GameListFilters } from "@/lib/services/game";
import type { KindTabBarCounts } from "@/components/bdr-v2/kind-tab-bar";
// 2026-05-29 Phase 2C UA1 (BG7) — 페이지 상단 sticky LIVE chip row (홈과 동일 컴포넌트·데이터).
import { LiveChipRow } from "@/components/bdr-v2/live-chip-row";
import { getLiveChips } from "@/lib/services/live-chips";
// [M5 2026-06-19] 찾기 UX — "내 동네" 칩 노출 판정을 위해 로그인 세션 + preferred_regions 조회.
import { getWebSession } from "@/lib/auth/web-session";
import {
  GamesClient,
  type GameForClient,
  type SortOptionMeta,
  type ChipOptionMeta,
} from "./_components/games-client";

/* ============================================================
 * /games — BDR v2 Phase 1 재구성
 *
 * 레이아웃 (v2 Games.jsx 시안 기준):
 *   1. .page 쉘 + 헤더(eyebrow + h1 + 서브 문구 + "모집 글쓰기" 버튼)
 *   2. KindTabBar  — 전체/픽업/게스트 모집/연습경기 + 건수
 *   3. FilterChipBar (GamesClient 내부) — 7칩 (URL 4 + 클라 3)
 *   4. 카드 그리드 — auto-fill minmax(320px, 1fr) × GameCard N장
 *
 * 데이터 패칭 방침 (Home 패턴과 동일):
 *   - 서버 컴포넌트에서 listGames + groupBy(typeCounts) 병렬 prefetch
 *   - searchParams 의 q/type/city/date/skill 을 그대로 서비스 함수에 전달
 *   - 클라 전용 필터(주말/무료/초보환영) 는 GamesClient 내부에서 처리
 *
 * 기존 파일 보존:
 *   - _components/games-content.tsx / game-type-tabs.tsx 유지 (이번 재구성에서
 *     import 제거되지만 삭제하지 않음 — Phase 9 cleanup 에서 재평가)
 *   - games-filter.tsx 유지 (v2 Games 에서는 사용하지 않지만 보존)
 *
 * API/Prisma/route.ts 변경 0. listGames 함수는 기존 호출만.
 * ============================================================ */

// SEO: 경기 목록 페이지 메타데이터 (기존 유지)
export const metadata: Metadata = {
  title: "경기 찾기 | MyBDR",
  description: "내 주변 픽업 게임, 게스트 모집, 연습경기를 찾아보세요.",
};

/* -- date 쿼리 → scheduledAt 범위 변환 (route.ts 와 동일 규칙) --
 * 왜: 서버 컴포넌트에서 listGames 를 직접 부르므로 route.ts 의 변환
 * 로직을 여기서도 재현해야 한다. 규칙은 route.ts L105~125 와 동일.
 */
function resolveScheduledRange(
  date: string | undefined,
): { gte?: Date; lt?: Date } | undefined {
  if (!date || date === "all") return undefined;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (date === "today") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { gte: today, lt: tomorrow };
  }
  if (date === "week") {
    // 이번 주 월요일 ~ 다음 주 월요일
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const nextMon = new Date(mon);
    nextMon.setDate(mon.getDate() + 7);
    return { gte: mon, lt: nextMon };
  }
  if (date === "month") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }
  return undefined;
}

// Next.js 15: async page — searchParams 는 Promise
export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // searchParams 풀이 — 문자열 하나만 필요한 키들
  const sp = await searchParams;
  const pick = (k: string): string | undefined => {
    const v = sp[k];
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v[0];
    return undefined;
  };
  const q = pick("q");
  const type = pick("type");
  const city = pick("city");
  const date = pick("date");
  const skill = pick("skill");

  // 서비스 필터 인자 구성 — listGames 시그니처와 정합
  const serviceFilters: GameListFilters = {
    q,
    type,
    city,
    skillLevels: skill && skill !== "all" ? [skill] : undefined,
    scheduledAt: resolveScheduledRange(date),
    take: 60,
  };

  // 유형별 건수 집계용 WHERE — type 제외한 나머지 조건 재구성.
  // route.ts L128~159 의 countWhere 와 동일 규칙으로, 탭 클릭 후 실제 목록
  // 건수와 일치시킨다. (prefer 관련 분기는 제외 — v2 초기 구현은 비로그인 기준)
  const countWhere: {
    status: { not: number };
    title?: { contains: string; mode: "insensitive" };
    city?: { contains: string; mode: "insensitive" };
    skill_level?: { in: string[] };
    scheduled_at?: { gte?: Date; lt?: Date };
  } = {
    status: { not: 4 },
  };
  if (q) countWhere.title = { contains: q, mode: "insensitive" };
  if (city && city !== "all") {
    countWhere.city = { contains: city, mode: "insensitive" };
  }
  if (skill && skill !== "all") {
    countWhere.skill_level = { in: [skill] };
  }
  const scheduledAt = resolveScheduledRange(date);
  if (scheduledAt) countWhere.scheduled_at = scheduledAt;

  // [M5 2026-06-19] "내 동네" 칩 노출 판정용 — 로그인 세션의 preferred_regions 조회.
  //   왜: games 에 좌표(lat/lng)가 없어 거리 기반 "가까운순/near" 는 불가하므로,
  //       "내 동네" 칩은 로그인 + preferred_regions(맞춤 지역) 가 있을 때만 city/district 매칭으로 동작.
  //   세션 없거나 지역 미설정이면 칩 자체를 숨긴다(메타 chip_options 로 클라 제어 — 하드코딩 금지).
  const session = await getWebSession();
  let preferredRegions: string[] = [];
  if (session?.sub) {
    try {
      const me = await prisma.user.findUnique({
        where: { id: BigInt(session.sub) },
        select: { preferred_regions: true },
      });
      // preferred_regions 는 Json 배열(@default("[]")) — 문자열만 추려서 사용.
      if (Array.isArray(me?.preferred_regions)) {
        preferredRegions = (me.preferred_regions as unknown[]).filter(
          (v): v is string => typeof v === "string" && v.trim().length > 0,
        );
      }
    } catch {
      // 세션 sub 가 비정상이면 무시 — "내 동네" 칩만 비노출되고 나머지 동작은 유지.
      preferredRegions = [];
    }
  }

  // 병렬 프리페치 — 하나 실패해도 나머지는 반영
  // (2026-05-29 Phase 2C UA1: liveResult = BG7 LIVE 띠용 진행 중 매치 — 홈과 동일 공유 모듈)
  const [gamesResult, typeCountResult, liveResult] = await Promise.allSettled([
    listGames(serviceFilters),
    prisma.games.groupBy({
      by: ["game_type"],
      where: countWhere,
      _count: { _all: true },
    }),
    getLiveChips(), // BG7 — 진행 중 라이브 매치 (0건이면 띠 hide)
  ]);

  // BG7 라이브 chip: 조회 실패/0건이면 빈 배열 → LiveChipRow 가 null 반환(띠 hide).
  const liveChips = liveResult.status === "fulfilled" ? liveResult.value : [];

  // 결과 직렬화 — GameForClient shape 로 평탄화
  const rawGames = gamesResult.status === "fulfilled" ? gamesResult.value : [];
  const games: GameForClient[] = rawGames.map((g) => ({
    id: g.id.toString(), // BigInt → string
    uuid: g.uuid,
    title: g.title,
    status: g.status,
    gameType: g.game_type,
    city: g.city,
    district: g.district,
    venueName: g.venue_name,
    scheduledAt: g.scheduled_at?.toISOString() ?? null,
    durationHours: g.duration_hours ?? null, // [v2.16] Date Tile 종료 시간 계산용
    currentParticipants: g.current_participants,
    maxParticipants: g.max_participants,
    feePerPerson: g.fee_per_person?.toString() ?? null, // Decimal → string
    skillLevel: g.skill_level,
    // [M5 2026-06-19] "최신순(latest)" 클라 정렬 키 — listGames 가 이미 select 하는 컬럼.
    createdAt: g.created_at?.toISOString() ?? null,
    authorNickname: g.author_nickname ?? null,
    // [2026-05-29 Phase 2C UA1·BG4] 종료 카드 "🏆 MVP" 라인용 닉네임.
    //   final_mvp join 결과 (없으면 null → GameCard 에서 라인 hide / mock 금지).
    finalMvpNickname: g.final_mvp?.nickname ?? null,
  }));

  // typeCounts 딕셔너리 변환 — route.ts L251~263 와 동일 결과
  const typeCountRows =
    typeCountResult.status === "fulfilled" ? typeCountResult.value : [];
  const typeCounts: KindTabBarCounts = {
    "0": 0,
    "1": 0,
    "2": 0,
    all: 0,
  };
  for (const row of typeCountRows) {
    const key = String(row.game_type) as "0" | "1" | "2";
    if (key === "0" || key === "1" || key === "2") {
      typeCounts[key] = row._count._all;
    }
  }
  typeCounts.all = typeCounts["0"] + typeCounts["1"] + typeCounts["2"];

  /* [M5 2026-06-19] 정렬·칩 가용성 메타 (서버 판정 — 클라 하드코딩 금지) -------------
   * 좌표 가용성: games 테이블에 lat/lng 컬럼이 없어 좌표 0 → "가까운순(near)" 정렬과
   *   좌표 기반 near 칩은 원천적으로 제공 불가. 따라서 sortOptions 에서 "가까운순" 제외,
   *   chipOptions 의 "내 동네(near)" 는 좌표 대신 preferred_regions(맞춤 지역) 매칭으로만,
   *   그것도 로그인 + 지역 설정이 있을 때만 노출한다.
   * 클라(GamesClient)는 이 메타가 가진 옵션만 렌더 → UI 에 정렬/칩 종류를 하드코딩하지 않음.
   */
  const sortOptions: SortOptionMeta[] = [
    { key: "soon", label: "임박순" }, // scheduled_at asc (미래 우선)
    { key: "filling", label: "모집임박순" }, // fill_pct desc
    { key: "latest", label: "최신순" }, // created_at desc
    // "가까운순(near)" 은 좌표 0 이라 제외 — 좌표 컬럼 도입 시 여기에 추가.
  ];
  // "내 동네" 노출 = 로그인 AND preferred_regions 비어있지 않음.
  const hasPreferredRegions = preferredRegions.length > 0;
  const chipOptions: ChipOptionMeta[] = [
    { key: "today", label: "오늘" },
    { key: "weekend", label: "이번 주말" },
    { key: "filling", label: "모집임박" },
    { key: "free", label: "무료" },
    // near(내 동네)는 좌표 미존재 → preferred_regions 매칭으로 대체. 조건 충족 시에만 push.
    ...(hasPreferredRegions
      ? [{ key: "near" as const, label: "내 동네" }]
      : []),
  ];

  return (
    // 시안 .page 쉘 + .games-page hook
    // 2026-05-03: 헤더 통합 — GamesClient 가 헤더(좌 title + 우 [필터][만들기]) + 탭 + chips + 카드 모두 렌더
    // 사유: 필터 토글을 "만들기" 좌측으로 이동 (사용자 요청) → filterOpen state 와 같은 client tree 필요
    <div className="page games-page">
      {/* BG7 (Phase 2C UA1) — AppNav 바로 아래 / 헤더 위 sticky LIVE chip row.
       * 진행 중 라이브 매치(tournamentMatch live/in_progress) 0건이면 LiveChipRow 가
       * null 반환 → 띠 전체 hidden (가짜 chip 절대 노출 안 함 — 사용자 결재 2026-05-29).
       * 시안 Games.jsx 순서 답습: LIVE 띠(BG7) → 헤더 → 필터 → 카드 그리드.
       * 데이터 = 홈과 동일 공유 모듈 getLiveChips(). chip 클릭 → /live/[id]. */}
      <LiveChipRow items={liveChips} />
      <GamesClient
        games={games}
        typeCounts={typeCounts}
        sortOptions={sortOptions}
        chipOptions={chipOptions}
        preferredRegions={preferredRegions}
      />
    </div>
  );
}
