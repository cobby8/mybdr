/**
 * Game Service — 픽업/게스트/팀대결 경기 관련 비즈니스 로직 중앙화
 *
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
// [M4] 종료(status→3) 즉시 평점(=리포트) 작성 요청 알림.
//   ⓐ 판단: 기존 GAME_REPORT_REQUEST 타입 + game-report-reminders cron 과 "동일 기능"(평점=리포트=game_reports).
//   따라서 신규 타입/cron 을 만들지 않고 기존 타입을 재사용한다 → 같은 경기에 중복 알림이 나지 않는다.
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

export interface GameListFilters {
  q?: string;
  type?: string;
  city?: string;
  /** 맞춤 지역 필터 — 여러 도시를 OR 조건으로 검색 (prefer=true 시 사용) */
  cities?: string[];
  /** 맞춤 경기 유형 필터 — game_type IN (...) 조건 (prefer=true 시 사용) */
  gameTypes?: number[];
  /** 맞춤 실력 수준 필터 — skill_level IN (...) 조건 (prefer=true 시 사용) */
  skillLevels?: string[];
  scheduledAt?: { gte?: Date; lt?: Date };
  take?: number;
}

// ---------------------------------------------------------------------------
// Service 함수
// ---------------------------------------------------------------------------

/**
 * 경기 목록 조회 (필터 + 페이지네이션)
 */
export async function listGames(filters: GameListFilters = {}) {
  const { q, type, city, cities, gameTypes, skillLevels, scheduledAt, take = 60 } = filters;

  const where: Prisma.gamesWhereInput = {
    // 취소(4) 제외
    status: { not: 4 },
  };
  if (q) where.title = { contains: q, mode: "insensitive" };
  // 명시적 type 파라미터가 우선, 없으면 맞춤 경기 유형(gameTypes)으로 필터
  if (type && type !== "all") {
    where.game_type = parseInt(type);
  } else if (gameTypes && gameTypes.length > 0) {
    // 맞춤 경기 유형이 설정되어 있으면 해당 유형만 표시 (city 필터와 AND 결합)
    where.game_type = { in: gameTypes };
  }

  // 맞춤 지역(cities) 우선, 단일 도시(city) 차선 — 둘 다 있으면 cities 사용
  if (cities && cities.length > 0) {
    // 선택한 지역이거나 지역이 아직 미정(null)인 경기도 포함
    // AND로 감싸서 status 등 다른 조건과 충돌하지 않도록 한다
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as Prisma.gamesWhereInput[]) : []),
      {
        OR: [
          // 각 도시명에 대해 부분 매칭 (예: "서울" → "서울특별시" 매칭)
          ...cities.map(c => ({ city: { contains: c, mode: "insensitive" as const } })),
          { city: null },
        ],
      },
    ];
  } else if (city && city !== "all") {
    where.city = { contains: city, mode: "insensitive" };
  }

  // 맞춤 실력 수준 필터: skill_level이 선택한 레벨 중 하나와 일치하는 경기만 표시
  if (skillLevels && skillLevels.length > 0) {
    where.skill_level = { in: skillLevels };
  }

  if (scheduledAt) where.scheduled_at = scheduledAt;

  // 카드 표시에 필요한 컬럼만 select (description, notes 등 불필요한 긴 텍스트 제외)
  // [2026-04-20] 다음카페 게시 순서 tie-break 를 위해 `metadata` 도 select 에 추가.
  //   - Prisma 6.x 는 JSON path 정렬을 지원하지 않으므로 DB orderBy 는 created_at 만 유지하고
  //     메모리에서 `metadata.cafe_article_id` (Int) 로 2차 정렬한다.
  //   - take=60 기준 성능 차 무의미 (정렬 복잡도 O(n log n) × n=60).
  const games = await prisma.games.findMany({
    where,
    orderBy: { created_at: "desc" },
    take,
    select: {
      id: true,
      uuid: true,
      title: true,
      status: true,
      game_type: true,
      city: true,
      district: true,
      venue_name: true,
      scheduled_at: true,
      duration_hours: true, // [2026-05-20 v2.16] GameCard Date Tile 종료 시간 표시 (start ~ end)
      max_participants: true,
      current_participants: true,
      fee_per_person: true,
      skill_level: true,
      author_nickname: true,
      created_at: true,
      metadata: true, // [2026-04-20] tie-break 키(cafe_article_id) 접근용
      // [2026-05-29 Phase 2C UA1·BG4] 종료 카드 "🏆 MVP" 라인용 — schema 기존 필드.
      //   final_mvp 관계로 닉네임 1건만 join (값 없으면 null → 카드에서 라인 hide / mock 금지).
      final_mvp_user_id: true,
      final_mvp: { select: { nickname: true } },
    },
  });

  // [2026-04-20] 다음카페 게시 순서 tie-break (메모리 정렬).
  //
  // 왜:
  //   - 같은 분(minute)에 올라온 카페 글은 `created_at` 이 동률이 되어 DB 정렬만으론
  //     카페 원본 게시 순서를 보장하지 못함 (실측 확인).
  //   - dataid 가 단조 증가(숫자 ↑ = 더 나중 게시)이므로 desc 로 정렬하면 카페 순서와 일치.
  //   - `metadata.cafe_article_id` 가 null 인 글(기존 15건 백필 전 or 일반 게임)은 맨 뒤로 밀린다
  //     (null last 동작 — -Infinity 로 대체해서 bId - aId desc 계산).
  //
  // 주의:
  //   - 기존 반환 형식(status override 포함)은 그대로 유지.
  //   - metadata 는 클라이언트 응답에서 게이트 없이 노출되므로 민감 키가 없는지 주기 점검 필요
  //     (현재는 cafe_* 메타만 저장 → 공개 노출 OK).
  const sorted = [...games].sort((a, b) => {
    // 1차: created_at desc
    const tA = a.created_at?.getTime() ?? 0;
    const tB = b.created_at?.getTime() ?? 0;
    if (tB !== tA) return tB - tA;
    // 2차: metadata.cafe_article_id desc (null last)
    const aId =
      typeof (a.metadata as { cafe_article_id?: number } | null)?.cafe_article_id === "number"
        ? (a.metadata as { cafe_article_id: number }).cafe_article_id
        : -Infinity;
    const bId =
      typeof (b.metadata as { cafe_article_id?: number } | null)?.cafe_article_id === "number"
        ? (b.metadata as { cafe_article_id: number }).cafe_article_id
        : -Infinity;
    return bId - aId;
  });

  // 날짜 지난 모집중(1)/확정(2) 경기 → 종료(3)로 표시
  const now = new Date();
  return sorted.map((g) => {
    if ((g.status === 1 || g.status === 2) && g.scheduled_at && g.scheduled_at < now) {
      return { ...g, status: 3 };
    }
    return g;
  });
}

/**
 * 경기 가능한 도시 목록 (게임 수 내림차순)
 */
export async function listGameCities(take = 30) {
  const rows = await prisma.games.groupBy({
    by: ["city"],
    where: { city: { not: null } },
    orderBy: { _count: { city: "desc" } },
    take,
  });
  return rows.map((r) => r.city!).filter(Boolean);
}

/**
 * 홈페이지용 최근/추천 경기 (status 1=모집중, 2=마감)
 */
export async function listRecentGames(take = 4) {
  return prisma.games.findMany({
    where: { status: { in: [1, 2] } },
    orderBy: { scheduled_at: "asc" },
    take,
    select: {
      id: true,
      uuid: true,
      title: true,
      scheduled_at: true,
      venue_name: true,
      city: true,
    },
  });
}

/**
 * [M3, 2026-06-19] lazy 종료 status 실DB 전환.
 *
 * 왜:
 *   - 평점/리포트 작성 권한은 DB의 games.status === 3(완료)을 요구한다.
 *   - 기존 listGames 의 메모리 오버라이드(scheduled_at < now 면 표시만 3)는
 *     "보이기만 3" 이라 DB status 는 여전히 1/2 → 평점 권한 판정이 막힌다.
 *   - 따라서 상세/리포트가 공유하는 단일 조회 진입점(getGame)에서 조회 시점에
 *     실제 종료된 경기를 DB status=3 으로 1회 동기화(승급)한다.
 *
 * 종료 판정:
 *   - scheduled_at + duration_hours(시간) < now() 이고 status 가 1 또는 2.
 *   - duration_hours 가 null 이면 종료 시각을 계산할 수 없으므로 전환 보류(no-op).
 *     (listGames 메모리 오버라이드는 duration 무시·scheduled_at 만 보지만, 여기서는
 *      실DB 를 바꾸므로 정확한 종료 시각을 쓴다. 보류된 건 종료시각 불명확이라 안전.)
 *
 * 멱등·race-safe:
 *   - 조건부 UPDATE(WHERE status IN (1,2) AND duration_hours IS NOT NULL
 *     AND scheduled_at + duration_hours 시간 < now()).
 *   - 이미 3(완료)/4(취소)이면 WHERE 불충족 → 0 rows no-op. 취소는 전환 안 함.
 *   - 조회된 해당 경기 1건만 갱신(WHERE id = ...). 대량 일괄 UPDATE 금지.
 *   - GET 시 write 가 일어나는 lazy 패턴 — M3 스펙상 의도된 동작.
 *
 * @param game getGame 으로 막 조회한 row (status/scheduled_at/duration_hours 보유)
 * @returns 전환이 일어났으면 status=3 으로 보정한 객체, 아니면 원본 그대로
 */
// [M3 보완 ①, 2026-06-19] report 직링크 경로(report/page.tsx)에서도 재사용하기 위해 export.
//   - 상세 페이지는 getGame 경유로 이미 lazy 전환되지만, my-games "후기 작성" 직링크는
//     report/page.tsx 가 getGame 을 거치지 않고 prisma 직접 조회 → DB status 1/2 그대로라
//     canReportGame 이 GAME_NOT_FINISHED(400) 로 평점 작성을 차단하는 결함이 있었다.
//   - 멱등·race-safe(아래 조건부 UPDATE) 라 직링크/상세 양쪽에서 중복 호출돼도 안전.
export async function lazyEndGame<
  T extends { id: bigint; status: number | null; scheduled_at: Date | null; duration_hours: number | null }
>(game: T): Promise<T> {
  // 모집중(1)/확정(2) + scheduled_at·duration_hours 모두 존재할 때만 종료 판정.
  if (
    (game.status === 1 || game.status === 2) &&
    game.scheduled_at !== null &&
    game.duration_hours !== null
  ) {
    // 종료 시각 = scheduled_at + duration_hours 시간. 이미 지났으면 전환 대상.
    const endsAt = new Date(game.scheduled_at.getTime() + game.duration_hours * 60 * 60 * 1000);
    if (endsAt < new Date()) {
      // 조건부 UPDATE — DB 시각(NOW) 기준으로 다시 한 번 검증해 race-safe.
      // 이미 3/4 이면 status IN (1,2) 불충족 → 0 rows no-op(멱등).
      const updated = await prisma.$executeRaw`
        UPDATE games
        SET status = 3, updated_at = NOW()
        WHERE id = ${game.id}
          AND status IN (1, 2)
          AND duration_hours IS NOT NULL
          AND scheduled_at + (duration_hours || ' hours')::interval < NOW()
      `.catch(() => 0);
      // 우리가 전환했거나(>0) 동시에 다른 요청이 이미 전환했어도, 응답 객체는 3 으로 보정.
      if (updated && updated > 0) {
        // [M4] 실제 1/2 → 3 전환이 "우리 UPDATE"로 일어난 경우에만(멱등) 평점 작성 요청 알림 발송.
        //   - 조건부 UPDATE 의 rowCount>0 = 이 호출이 전환의 주체 → 알림도 정확히 1회만 발송.
        //   - 동시에 다른 요청이 먼저 전환했다면 그쪽 updated 가 1, 우리는 0 rows → 우리는 발송 안 함(중복 방지).
        //   - fire-and-forget: 알림 실패가 종료 전환/상세 조회를 깨면 안 되므로 await 하지 않고 catch 로 흡수.
        notifyReportRequestOnEnd(game.id).catch(() => {
          // 알림 발송 실패는 조용히 무시 — 다음 사이클의 game-report-reminders cron 이 dedupe 후 재시도(보강).
        });
        return { ...game, status: 3 };
      }
    }
  }
  return game;
}

/**
 * [M4] 종료(status→3 전환) 직후 호스트 + 승인 참가자에게 평점(=리포트) 작성 요청 알림.
 *
 * 왜 별도 함수로 빼는가:
 *   - lazyEndGame 은 제네릭(id/status/scheduled_at/duration_hours 만 보장)이라 uuid/organizer_id/
 *     승인 참가자 등 알림에 필요한 필드를 갖고 있지 않다. 전환이 실제 일어난 1건에 대해서만
 *     가벼운 추가 조회 1회로 발송 대상을 모은다(과다 조회 0 — WHERE id 단건).
 *
 * 중복 방지(핵심):
 *   - 알림 타입 = 기존 NOTIFICATION_TYPES.GAME_REPORT_REQUEST(신규 타입 금지).
 *   - action_url = `/games/{uuid}/report` — game-report-reminders cron 과 "동일 키".
 *   - 따라서 즉시 알림(여기)과 cron 리마인드가 같은 (user_id + type + action_url) 을 공유 →
 *     cron 의 기존 dedupe(findFirst) 가 이미 보낸 즉시 알림을 보고 재발송을 스킵한다(일관 dedupe).
 *   - 같은 경기 종료가 다시 lazyEndGame 으로 들어와도 status 가 이미 3 → 0 rows 라 여기 자체가 호출 안 됨(멱등).
 */
async function notifyReportRequestOnEnd(gameId: bigint): Promise<void> {
  // 전환된 경기 1건만 조회 — 알림 대상(호스트 + 승인 참가자) + action_url 생성용 uuid/title.
  const game = await prisma.games.findUnique({
    where: { id: gameId },
    select: {
      uuid: true,
      title: true,
      organizer_id: true,
      // 승인된 참가자(status=1)만 평점 대상 — cron(route.ts)과 동일한 모집단 정의.
      game_applications: {
        where: { status: 1 },
        select: { user_id: true },
      },
    },
  });
  // uuid 없으면 action_url 을 만들 수 없으므로 발송 스킵(안전 가드 — cron 과 동일).
  if (!game || !game.uuid) return;

  const actionUrl = `/games/${game.uuid}/report`;
  const title = game.title ?? "경기";

  // 호스트 + 승인 참가자 user_id 를 set 으로 중복 제거(호스트가 참가자로도 잡히는 경우 1회만).
  const userIds = new Set<bigint>();
  if (game.organizer_id) userIds.add(game.organizer_id);
  for (const a of game.game_applications) {
    userIds.add(a.user_id);
  }

  // 각 대상에게 발송. dedupe 는 cron 과 동일 키(user+type+action_url)이므로,
  // 여기서도 같은 키의 기존 알림이 있으면 재발송하지 않도록 findFirst 로 사전 확인한다.
  for (const userId of userIds) {
    const existing = await prisma.notifications.findFirst({
      where: {
        user_id: userId,
        notification_type: NOTIFICATION_TYPES.GAME_REPORT_REQUEST,
        action_url: actionUrl,
      },
      select: { id: true },
    });
    if (existing) continue; // 이미 보냄(cron 또는 이전 즉시 발송) → 중복 방지

    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.GAME_REPORT_REQUEST,
      title: "경기 평가 작성 요청",
      content: `"${title}" 경기가 종료되었습니다. 평가를 작성해 주세요.`,
      actionUrl,
    }).catch(() => {
      // 개별 알림 실패는 전체를 깨지 않음 — 나머지 대상 발송 계속, cron 이 후속 보강.
    });
  }
}

/**
 * 경기 상세 조회 (UUID 또는 short UUID)
 * shortId (8자)이면 LIKE 검색, 아니면 정확 매칭.
 * @returns game 또는 null
 *
 * ※ [M3] 조회 시 종료된 경기는 DB status=3 으로 lazy 동기화(lazyEndGame).
 */
export async function getGame(idOrShortUuid: string) {
  if (!idOrShortUuid) return null;

  // 숫자 ID로 조회 시도
  const numId = Number(idOrShortUuid);
  if (!isNaN(numId) && numId > 0) {
    const game = await prisma.games.findUnique({ where: { id: BigInt(numId) } }).catch(() => null);
    if (game) return lazyEndGame(game); // [M3] 종료 경기 DB status=3 승급
  }

  // UUID (8자 이상)로 조회
  if (idOrShortUuid.length >= 8) {
    let fullUuid: string | undefined;

    if (idOrShortUuid.length === 8) {
      const rows = await prisma.$queryRaw<{ uuid: string }[]>`
        SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${idOrShortUuid + "%"} LIMIT 1
      `.catch(() => [] as { uuid: string }[]);
      fullUuid = rows[0]?.uuid;
    } else {
      fullUuid = idOrShortUuid;
    }

    if (fullUuid) {
      const game = await prisma.games.findUnique({ where: { uuid: fullUuid } }).catch(() => null);
      return game ? lazyEndGame(game) : null; // [M3] 종료 경기 DB status=3 승급
    }
  }

  return null;
}

/**
 * 경기 신청자 목록 조회
 */
export async function listGameApplications(gameId: bigint) {
  return prisma.game_applications.findMany({
    where: { game_id: gameId },
    include: {
      users: {
        select: {
          nickname: true,
          name: true,
          phone: true,
          position: true,
          city: true,
          district: true,
          // Phase C (2026-05-02) — 참가자 행 메타 "L.5 · 가드" 노출용.
          // 응답 형식 변경 0 (기존 키 유지, 추가 키 1개). 외부 노출 API 없음
          // (서버 컴포넌트 직접 호출 → page.tsx 만 사용).
          skill_level: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
  });
}
