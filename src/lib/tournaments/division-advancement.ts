/**
 * 2026-05-11 Phase 3-B — 종별 standings 기반 순위전 placeholder 자동 채우기.
 *
 * 컨텍스트:
 *   - 강남구협회장배 = "조별 풀리그/링크제 후 순위 결정전" 패턴
 *   - 예선 매치 종료 → TournamentTeam.wins / losses / point_difference 자동 박제 (match PATCH route)
 *   - 순위전 매치 = homeTeamId / awayTeamId NULL placeholder + notes "A조 N위 vs B조 N위" 박제
 *   - 본 모듈 = 예선 종료 후 standings 계산 → notes 파싱 → placeholder 슬롯 자동 UPDATE
 *
 * 기존 dual-progression.ts 와 차이:
 *   - dual-progression = "winner → next_match 1:1 진출" (토너먼트형)
 *   - 본 모듈 = "standings rank → match slot 매핑" (조별 풀리그/링크제형)
 *
 * 호출 위치:
 *   - 매치 PATCH route 통합 (status='completed' UPDATE 시) — 종별 모든 예선 완료 감지
 *   - 또는 운영자 manual trigger (어드민 API)
 */

import { Prisma, PrismaClient } from "@prisma/client";
// 2026-05-15 PR-G5.1 — placeholder 박제 공통 헬퍼 (강남구 사고 영구 차단 단일 source).
import { buildSlotLabel, buildPlaceholderNotes } from "./placeholder-helpers";

const ADVANCEMENT_REGEX = /([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/;

// ─────────────────────────────────────────────────────────────────────────
// Standings (종별 조별 순위)
// ─────────────────────────────────────────────────────────────────────────

export type DivisionStanding = {
  tournamentTeamId: string;
  teamName: string;
  groupName: string;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  /**
   * 2026-05-17 — 강남구 승점 (DB 박제값 직접 읽음 / TournamentTeam.win_points).
   *   - 강남구 룰: 승 +3, 무 +1, 패 +0 (+ 점수차 가산점은 DB 박제 단계 처리).
   *   - default 룰: wins*3 자연 박제 (다른 대회는 winPoints 컬럼 hide 가능).
   *   - 회귀 0 — 기존 정렬 (wins desc) 변경 0 / showWinPoints 분기는 client.
   */
  winPoints: number;
  /** 그룹 내 순위 (1~N) */
  groupRank: number;
};

/**
 * 종별 모든 팀의 standings 조회 + 그룹별 순위 계산.
 *
 * 정렬 룰:
 *   - pointsRule="gnba" (강남구협회장배 규정):
 *       1. winPoints desc (승점 — 승 +3 / 무 +1 / 패 +0 + 점수차 가산점)
 *       2. point_difference desc (득실차)
 *       3. points_for desc (득점)
 *       4. teamName asc (최종 tie-breaker)
 *   - pointsRule="default" (NBA / 한국농구협회 표준 / 기존 동작):
 *       1. wins desc (승수 많은 팀 우선)
 *       2. point_difference desc (득실차)
 *       3. points_for desc (득점)
 *       4. teamName asc (최종 tie-breaker)
 *
 * 회귀 0: pointsRule 인자 미전달 시 default = "default" → 기존 wins desc 정렬과 동치.
 *
 * @param prisma - Prisma client 또는 transaction client
 * @param pointsRule - 승점 룰 분기 (default "default" — admin /playoffs 등 호환)
 */
export async function getDivisionStandings(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
  divisionCode: string,
  pointsRule: "gnba" | "default" = "default",
): Promise<DivisionStanding[]> {
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, category: divisionCode },
    select: {
      id: true,
      groupName: true,
      wins: true,
      losses: true,
      draws: true,
      points_for: true,
      points_against: true,
      point_difference: true,
      // 2026-05-17 — 강남구 승점 박제값 SELECT (update-standings.ts 가 SET).
      win_points: true,
      team: { select: { name: true } },
    },
  });

  // 그룹별로 분류 (groupName null 이면 "X" 그룹 처리)
  const byGroup: Record<string, typeof teams> = {};
  for (const t of teams) {
    const g = t.groupName ?? "X";
    (byGroup[g] ??= []).push(t);
  }

  const result: DivisionStanding[] = [];
  for (const group of Object.keys(byGroup).sort()) {
    const sorted = [...byGroup[group]].sort((a, b) => {
      // 2026-05-17 강남구 룰 분기 — 1차키 = winPoints (그 외 = wins / 기존 정렬 보존).
      if (pointsRule === "gnba") {
        const wpd = (b.win_points ?? 0) - (a.win_points ?? 0);
        if (wpd !== 0) return wpd;
      } else {
        const wd = (b.wins ?? 0) - (a.wins ?? 0);
        if (wd !== 0) return wd;
      }
      const pd = (b.point_difference ?? 0) - (a.point_difference ?? 0);
      if (pd !== 0) return pd;
      const pf = (b.points_for ?? 0) - (a.points_for ?? 0);
      if (pf !== 0) return pf;
      return (a.team?.name ?? "").localeCompare(b.team?.name ?? "");
    });
    sorted.forEach((t, i) => {
      result.push({
        tournamentTeamId: t.id.toString(),
        teamName: t.team?.name ?? "(이름 없음)",
        groupName: group,
        wins: t.wins ?? 0,
        losses: t.losses ?? 0,
        draws: t.draws ?? 0,
        pointsFor: t.points_for ?? 0,
        pointsAgainst: t.points_against ?? 0,
        pointDifference: t.point_difference ?? 0,
        // 2026-05-17 — DB 박제값 (단일 source / 재계산 회피).
        winPoints: t.win_points ?? 0,
        groupRank: i + 1,
      });
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────
// Placeholder advancement
// ─────────────────────────────────────────────────────────────────────────

/**
 * 매치 notes 에서 "A조 N위 vs B조 N위" 형식 파싱.
 *
 * @example
 *   parseAdvancement("종: i3 U9 | 매치 placeholder: A조 1위 vs B조 1위 — ...")
 *   → { home: { group: "A", rank: 1 }, away: { group: "B", rank: 1 } }
 */
export function parseAdvancement(notes: string | null): {
  home: { group: string; rank: number };
  away: { group: string; rank: number };
} | null {
  if (!notes) return null;
  const m = notes.match(ADVANCEMENT_REGEX);
  if (!m) return null;
  return {
    home: { group: m[1], rank: Number(m[2]) },
    away: { group: m[3], rank: Number(m[4]) },
  };
}

export type AdvanceResult = {
  divisionCode: string;
  updated: number;
  skipped: number;
  errors: Array<{ matchId: string; reason: string }>;
  standings: DivisionStanding[];
};

/**
 * 종별 placeholder 매치 (homeTeamId 또는 awayTeamId NULL) 를 standings 기반으로 자동 채움.
 *
 * 동작:
 *   1) 종별 standings 계산 (그룹별 순위)
 *   2) settings.division_code = divisionCode + (homeTeamId IS NULL OR awayTeamId IS NULL) 매치 fetch
 *   3) notes 파싱 → "A조 N위" → standings 매핑 → homeTeamId/awayTeamId UPDATE
 *
 * 안전성:
 *   - tx 트랜잭션 권장 (caller 가 묶음)
 *   - 이미 채워진 슬롯도 덮어쓰지 않음 (NULL 일 때만 UPDATE — 운영자 수동 변경 보호)
 *   - 동률 standings = 안정적 (이름순 tie-breaker 적용)
 *
 * @param prisma - Prisma client 또는 transaction client
 */
export async function advanceDivisionPlaceholders(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
  divisionCode: string,
): Promise<AdvanceResult> {
  // 2026-05-17 영구 fix — 예선 전수 종료 가드 (i3w-U12 stale 매핑 사고 영구 차단).
  //   사용자 결재 (2026-05-17): "순위결정전 매칭은 해당 종별 group 매치 전부 종료 후 진행".
  //
  //   사고 케이스 (i3w-U12 2026-05-17):
  //     - 예선 1건 완료 시점에 advancer 진입 → 동률 standings (남은 팀 0:0)
  //       → 이름 asc tie-break → stale 매핑으로 매치 207 (13:30 김포훕스타 vs YNC A) 잘못 박제.
  //     - 이전 가드 (prelimCompleted >= 1) 가 partial completion 시 진입 허용 = 사고 원인.
  //
  //   새 룰: 종별 예선 매치 (roundName "순위" 미포함) prelimTotal === prelimCompleted 시에만 진입.
  //     - prelimTotal === 0 → group 매치 자체 없음 → skip (방어)
  //     - prelimCompleted < prelimTotal → partial → skip (사고 차단)
  //     - prelimCompleted === prelimTotal → 모든 group 매치 종료 → advancer 진입 안전
  const [prelimTotal, prelimCompleted] = await Promise.all([
    prisma.tournamentMatch.count({
      where: {
        tournamentId,
        settings: { path: ["division_code"], equals: divisionCode },
        NOT: { roundName: { contains: "순위" } },
      },
    }),
    prisma.tournamentMatch.count({
      where: {
        tournamentId,
        settings: { path: ["division_code"], equals: divisionCode },
        status: "completed",
        NOT: { roundName: { contains: "순위" } },
      },
    }),
  ]);
  if (prelimTotal === 0 || prelimTotal !== prelimCompleted) {
    // 운영 추적 로그 — partial completion 시 advancer skip 사유 명시
    console.log(
      `[advanceDivisionPlaceholders] skip — group matches partial: ${prelimCompleted} completed / ${prelimTotal} total (division=${divisionCode}, tournament=${tournamentId})`,
    );
    return {
      divisionCode,
      updated: 0,
      skipped: 0,
      errors: [
        {
          matchId: "(advancer-guard)",
          reason:
            prelimTotal === 0
              ? "예선 매치 0건 — group 매치 자체 없음 / advancer skip"
              : `예선 매치 partial 완료 (${prelimCompleted}/${prelimTotal}) — 전수 종료 후 진입 가능 / advancer skip`,
        },
      ],
      standings: [],
    };
  }

  // 1) standings 계산
  const standings = await getDivisionStandings(prisma, tournamentId, divisionCode);

  // standings 매핑 key = "그룹:랭크" (예: "A:1")
  const standingsMap: Record<string, bigint> = {};
  for (const s of standings) {
    standingsMap[`${s.groupName}:${s.groupRank}`] = BigInt(s.tournamentTeamId);
  }

  // 2) 종별 placeholder 매치 fetch (settings.division_code 매칭 + null slot)
  const placeholders = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      OR: [{ homeTeamId: null }, { awayTeamId: null }],
      settings: {
        path: ["division_code"],
        equals: divisionCode,
      },
    },
    select: {
      id: true,
      notes: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });

  let updated = 0;
  let skipped = 0;
  const errors: AdvanceResult["errors"] = [];

  for (const m of placeholders) {
    const parsed = parseAdvancement(m.notes);
    if (!parsed) {
      errors.push({ matchId: m.id.toString(), reason: "notes 파싱 실패 (A조 N위 vs B조 N위 형식 부재)" });
      skipped++;
      continue;
    }

    const homeKey = `${parsed.home.group}:${parsed.home.rank}`;
    const awayKey = `${parsed.away.group}:${parsed.away.rank}`;
    const homeTtId = standingsMap[homeKey];
    const awayTtId = standingsMap[awayKey];

    if (!homeTtId || !awayTtId) {
      errors.push({
        matchId: m.id.toString(),
        reason: `standings 매핑 실패 (home=${homeKey} ${homeTtId ? "✓" : "✗"} / away=${awayKey} ${awayTtId ? "✓" : "✗"})`,
      });
      skipped++;
      continue;
    }

    // 이미 채워진 슬롯 덮어쓰지 않음 (운영자 수동 변경 보호) — null 인 슬롯만 UPDATE
    const updateData: { homeTeamId?: bigint; awayTeamId?: bigint } = {};
    if (m.homeTeamId === null) updateData.homeTeamId = homeTtId;
    if (m.awayTeamId === null) updateData.awayTeamId = awayTtId;

    if (Object.keys(updateData).length === 0) {
      skipped++;
      continue;
    }

    await prisma.tournamentMatch.update({
      where: { id: m.id },
      data: updateData,
    });
    updated++;
  }

  return {
    divisionCode,
    updated,
    skipped,
    errors,
    standings,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 2026-05-12 Phase 3.5-D — group_stage_with_ranking 진출 매핑 (stub)
// ─────────────────────────────────────────────────────────────────────────
//
// 신규 enum group_stage_with_ranking 의 매핑 로직 placeholder.
//
// 기존 advanceDivisionPlaceholders 와 차이:
//   - league_advancement = settings.linkage_pairs (예: [[1,2],[3,4]]) 명시 → 특정 조끼리만 매칭
//   - group_stage_with_ranking = group_size × group_count 만 박제 → 모든 동순위 자동 매칭
//     (1위×N팀 동순위전 / 2위×N팀 동순위전 / ...)
//
// 본 PR (Phase 3.5-D) 범위:
//   - enum + UI input 만 박제 (운영자가 group_size / group_count 입력 가능)
//   - 매칭 placeholder 자동 생성 = TODO (별 PR 큐잉)
//
// TODO 후속 PR:
//   1. 종별 settings.group_size / group_count 조회
//   2. standings 계산 (기존 getDivisionStandings 재사용)
//   3. 1위×group_count / 2위×group_count / ... settings.group_size 위까지 placeholder 매치 자동 생성
//      (settings.ranking_format = round_robin → 풀리그 매치 / single_elimination → 토너먼트 매치)
//   4. notes "{N}위 동순위전" 형식 박제
//   5. advanceDivisionPlaceholders 와 동일하게 standings 기반 자동 채움
//
// ─────────────────────────────────────────────────────────────────────────
// 2026-05-15 PR-G5.3 / G5.4 — placeholder 매치 spec (순수 plan 함수)
// ─────────────────────────────────────────────────────────────────────────
//
// 사유 (강남구 사고 영구 차단):
//   - generator 의 plan 부분 = 순수 함수 분리 → vitest 단위 검증 친화
//   - DB INSERT 부분 = 별도 generator 함수 (caller 사용)
//   - 두 함수 모두 placeholder-helpers.ts 의 buildSlotLabel/buildPlaceholderNotes 호출
//     → notes 형식 위반 영구 차단

export interface PlaceholderMatchSpec {
  rank: number; // group_rank 시 순위 (1~N) / tie_rank 시 동순위전 N위
  groupHome: string; // "A" 등 (league_advancement) / "" (group_stage_with_ranking 동순위전)
  groupAway: string;
  homeSlot: string; // buildSlotLabel 결과
  awaySlot: string;
  notes: string; // buildPlaceholderNotes 결과 (ADVANCEMENT_REGEX 호환 또는 tie_rank)
  matchIndex: number; // 시간 순 매치 index (0 부터) — caller 가 scheduledAt 계산
}

/**
 * G5.3 (PURE) — league_advancement (링크제) 순위전 매치 plan.
 *
 * 운영 케이스 (강남구 i3-U9):
 *   - 4팀 × 2조 / linkage_pairs = [[1, 2]] (A↔B 페어)
 *   - plan 결과: A조 4위 vs B조 4위 / A조 3위 vs B조 3위 / A조 2위 vs B조 2위 / A조 1위 vs B조 1위
 *   - 순서: groupSize → 1 (낮은 순위가 일찍 시작 — 운영 자료 패턴)
 *
 * @param opts.groupSize - 조당 팀 수 (예: 4)
 * @param opts.groupCount - 조 수 (페어 검증용 — 미사용 시 무시)
 * @param opts.linkagePairs - 페어 배열 (1-indexed, 예: [[1,2],[3,4]] = A↔B, C↔D)
 */
export function planLeagueAdvancementPlaceholders(opts: {
  groupSize: number;
  groupCount: number;
  linkagePairs: number[][];
}): PlaceholderMatchSpec[] {
  const { groupSize, linkagePairs } = opts;
  if (groupSize < 2 || linkagePairs.length === 0) return [];

  const specs: PlaceholderMatchSpec[] = [];
  let matchIndex = 0;
  for (const pair of linkagePairs) {
    if (pair.length !== 2) continue;
    const [gA, gB] = pair;
    if (gA < 1 || gB < 1) continue;
    const groupA = String.fromCharCode("A".charCodeAt(0) + gA - 1);
    const groupB = String.fromCharCode("A".charCodeAt(0) + gB - 1);
    // 낮은 순위 (groupSize 위) → 1위 순서 — 운영 자료 i3-U9 패턴 (낮은 순위 일찍 시작)
    for (let rank = groupSize; rank >= 1; rank--) {
      const homeSlot = buildSlotLabel({ kind: "group_rank", group: groupA, rank });
      const awaySlot = buildSlotLabel({ kind: "group_rank", group: groupB, rank });
      specs.push({
        rank,
        groupHome: groupA,
        groupAway: groupB,
        homeSlot,
        awaySlot,
        notes: buildPlaceholderNotes(homeSlot, awaySlot),
        matchIndex: matchIndex++,
      });
    }
  }
  return specs;
}

/**
 * G5.4 (PURE) — group_stage_with_ranking (조별리그+동순위전) plan.
 *
 * 차이 (vs league_advancement):
 *   - linkage_pairs 미사용 — 모든 조의 동순위 자동 매칭
 *   - groupCount === 2 케이스 (강남구 i3-U11 / i3-U14 / i3w-U12): N위 × 1매치 = groupSize 매치
 *   - groupCount > 2 케이스: N위 동순위전 풀리그/토너먼트 — settings.ranking_format 분기 (본 PR 범위 = 2조 단순 케이스)
 *
 * 운영 케이스 (강남구 i3-U11):
 *   - 3팀 × 2조 (A=[3팀], B=[3팀])
 *   - plan 결과: A조 3위 vs B조 3위 / A조 2위 vs B조 2위 / A조 1위 vs B조 1위
 *   - 순서: groupSize → 1 (낮은 순위 일찍)
 *
 * @param opts.groupSize - 조당 팀 수
 * @param opts.groupCount - 조 수 (2 = 단순 페어 / 3+ = 동순위전 풀리그 — 후속 PR)
 */
export function planGroupStageRankingPlaceholders(opts: {
  groupSize: number;
  groupCount: number;
}): PlaceholderMatchSpec[] {
  const { groupSize, groupCount } = opts;
  if (groupSize < 2) return [];

  // 본 PR 범위 = groupCount === 2 (강남구 운영 케이스 100%)
  // groupCount > 2 = 후속 PR (N×N 풀리그 동순위전)
  if (groupCount !== 2) return [];

  // 2조 단순 페어 — league_advancement linkage_pairs=[[1,2]] 와 동일 결과
  return planLeagueAdvancementPlaceholders({
    groupSize,
    groupCount,
    linkagePairs: [[1, 2]],
  });
}

// ─────────────────────────────────────────────────────────────────────────
// PR-G5.3 / G5.4 (DB INSERT generator — caller 호출)
// ─────────────────────────────────────────────────────────────────────────

export interface GenerateOptions {
  venueName?: string | null;
  /** ISO date (YYYY-MM-DD) + HH:mm — caller 가 KST 시각 박제 */
  startScheduledAt?: Date | null;
  /** 매치 간 분 간격 (default 30) */
  intervalMinutes?: number;
}

export interface GenerateResult {
  divisionCode: string;
  generated: number;
  skipped: number;
  reason: string;
  matchIds: string[];
}

/**
 * G5.3 (DB) — league_advancement (링크제) 순위전 매치 자동 INSERT.
 *
 * 안전성:
 *   - 동일 종별 + homeTeamId/awayTeamId NULL 매치 존재 시 skip (중복 방지)
 *   - division_rule.format !== "league_advancement" 시 skip
 *   - settings.linkage_pairs / group_size 누락 시 skip
 *
 * 호출 위치:
 *   - admin "종별 매치 자동 생성" 버튼 (G5.5 통합 라우트)
 *   - 또는 대진표 생성 시 종별 loop (G5.5 통합)
 */
export async function generateLeagueAdvancementMatches(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
  divisionCode: string,
  opts: GenerateOptions = {},
): Promise<GenerateResult> {
  // 1) division_rule fetch
  const rule = await prisma.tournamentDivisionRule.findFirst({
    where: { tournamentId, code: divisionCode },
    select: { format: true, settings: true },
  });
  if (!rule) {
    return { divisionCode, generated: 0, skipped: 0, reason: "rule-not-found", matchIds: [] };
  }
  if (rule.format !== "league_advancement") {
    return { divisionCode, generated: 0, skipped: 0, reason: `format=${rule.format} (league_advancement 아님)`, matchIds: [] };
  }

  const settings = (rule.settings ?? {}) as Record<string, unknown>;
  const groupSize = Number(settings.group_size ?? 0);
  const groupCount = Number(settings.group_count ?? 0);
  const linkagePairs = (settings.linkage_pairs as number[][] | undefined) ?? [];
  if (groupSize < 2 || linkagePairs.length === 0) {
    return { divisionCode, generated: 0, skipped: 0, reason: "missing group_size/linkage_pairs", matchIds: [] };
  }

  // 2) 기존 placeholder / 실팀 박제 매치 중복 차단 (idempotent)
  const existing = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      AND: [
        { settings: { path: ["division_code"], equals: divisionCode } },
        { roundName: "순위결정전" },
      ],
    },
    select: { id: true },
  });
  if (existing.length > 0) {
    return {
      divisionCode,
      generated: 0,
      skipped: existing.length,
      reason: `이미 순위결정전 ${existing.length}건 존재 (idempotent skip)`,
      matchIds: [],
    };
  }

  // 3) plan → INSERT
  const specs = planLeagueAdvancementPlaceholders({ groupSize, groupCount, linkagePairs });
  const intervalMs = (opts.intervalMinutes ?? 30) * 60 * 1000;
  const matchIds: string[] = [];
  for (const spec of specs) {
    const scheduledAt = opts.startScheduledAt
      ? new Date(opts.startScheduledAt.getTime() + spec.matchIndex * intervalMs)
      : null;
    const created = await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        homeTeamId: null,
        awayTeamId: null,
        roundName: "순위결정전",
        venue_name: opts.venueName ?? null,
        scheduledAt,
        notes: spec.notes,
        settings: {
          division_code: divisionCode,
          homeSlotLabel: spec.homeSlot,
          awaySlotLabel: spec.awaySlot,
        },
        status: "scheduled",
      },
      select: { id: true },
    });
    matchIds.push(created.id.toString());
  }

  return { divisionCode, generated: matchIds.length, skipped: 0, reason: "OK", matchIds };
}

/**
 * G5.4 (DB) — group_stage_with_ranking (조별+동순위전) 매치 자동 INSERT.
 *
 * 차이 (vs G5.3):
 *   - linkage_pairs 미사용 — group_count 만 사용
 *   - 본 PR 범위: groupCount === 2 단순 페어 (강남구 운영 케이스 100%)
 *   - groupCount > 2: 후속 PR (N×N 풀리그 동순위전)
 *
 * 호출 위치: G5.5 통합 라우트 또는 자동 trigger.
 */
export async function generateGroupStageRankingMatches(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
  divisionCode: string,
  opts: GenerateOptions = {},
): Promise<GenerateResult> {
  const rule = await prisma.tournamentDivisionRule.findFirst({
    where: { tournamentId, code: divisionCode },
    select: { format: true, settings: true },
  });
  if (!rule) {
    return { divisionCode, generated: 0, skipped: 0, reason: "rule-not-found", matchIds: [] };
  }
  if (rule.format !== "group_stage_with_ranking") {
    return { divisionCode, generated: 0, skipped: 0, reason: `format=${rule.format} (group_stage_with_ranking 아님)`, matchIds: [] };
  }

  const settings = (rule.settings ?? {}) as Record<string, unknown>;
  const groupSize = Number(settings.group_size ?? 0);
  const groupCount = Number(settings.group_count ?? 0);
  if (groupSize < 2 || groupCount < 2) {
    return { divisionCode, generated: 0, skipped: 0, reason: "missing group_size/group_count", matchIds: [] };
  }

  // 본 PR 범위 = 2조 단순 페어 (강남구 i3-U11/i3-U14/i3w-U12 운영 케이스)
  if (groupCount !== 2) {
    return { divisionCode, generated: 0, skipped: 0, reason: `groupCount=${groupCount} 미지원 (본 PR = 2조만, 후속 PR 큐)`, matchIds: [] };
  }

  const existing = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      AND: [
        { settings: { path: ["division_code"], equals: divisionCode } },
        { roundName: "순위결정전" },
      ],
    },
    select: { id: true },
  });
  if (existing.length > 0) {
    return {
      divisionCode,
      generated: 0,
      skipped: existing.length,
      reason: `이미 순위결정전 ${existing.length}건 존재 (idempotent skip)`,
      matchIds: [],
    };
  }

  const specs = planGroupStageRankingPlaceholders({ groupSize, groupCount });
  const intervalMs = (opts.intervalMinutes ?? 30) * 60 * 1000;
  const matchIds: string[] = [];
  for (const spec of specs) {
    const scheduledAt = opts.startScheduledAt
      ? new Date(opts.startScheduledAt.getTime() + spec.matchIndex * intervalMs)
      : null;
    const created = await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        homeTeamId: null,
        awayTeamId: null,
        roundName: "순위결정전",
        venue_name: opts.venueName ?? null,
        scheduledAt,
        notes: spec.notes,
        settings: {
          division_code: divisionCode,
          homeSlotLabel: spec.homeSlot,
          awaySlotLabel: spec.awaySlot,
        },
        status: "scheduled",
      },
      select: { id: true },
    });
    matchIds.push(created.id.toString());
  }

  return { divisionCode, generated: matchIds.length, skipped: 0, reason: "OK", matchIds };
}

/**
 * @deprecated 2026-05-15 — generateGroupStageRankingMatches 사용. 본 stub 은 회귀 호환용.
 *   기존 호출자 0건 (Phase 3.5-D 단계에서 stub 만 박제) → 안전 제거 가능하지만 추적용 유지.
 */
export async function generateGroupStageRankingPlaceholders(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
  divisionCode: string,
): Promise<{ generated: number; skipped: number; reason: string }> {
  const result = await generateGroupStageRankingMatches(prisma, tournamentId, divisionCode);
  return {
    generated: result.generated,
    skipped: result.skipped,
    reason: result.reason,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// G5.5 — group_stage_knockout 본선 generator (stub + 후속 PR 큐)
// ─────────────────────────────────────────────────────────────────────────
//
// 운영 사용처: 본 시점 0 (강남구협회장배 미사용 / 다른 협회배 운영 시점에 진입).
//
// 본 PR 범위 = stub + 후속 PR 명시.
//   사유: 교차 시드 알고리즘 (A1 vs B2, B1 vs A2, ... — 같은 조 팀이 1R 에서 만나지 않도록)
//         + 본선 사이즈 2^N 올림 + bye 처리 — 복잡도 ↑
//   대안: 본선 1R = placeholder (NULL + slot label) → 2R+ = G5.6 single_elim 트리 재사용 가능
//
// 후속 PR (G5.5-followup):
//   1. planGroupStageKnockoutFirstRound — 교차 시드 패턴 (groupCount × advanceCount → 2^N 매치)
//   2. generateGroupStageKnockoutMatches — 본선 1R placeholder INSERT + single_elim 2R+ 트리 호출
//   3. 운영 사용 시점에 사용자 결재 받고 진입

/**
 * G5.5 (stub) — group_stage_knockout 본선 generator.
 *
 * @deprecated 후속 PR (G5.5-followup) — 운영 사용 시점에 구현. 현재는 stub.
 */
export async function generateGroupStageKnockoutMatches(
  _prisma: PrismaClient | Prisma.TransactionClient,
  _tournamentId: string,
  divisionCode: string,
): Promise<GenerateResult> {
  return {
    divisionCode,
    generated: 0,
    skipped: 0,
    reason: "stub: group_stage_knockout 본선 generator 후속 PR (G5.5-followup) — 운영 사용 0 / 교차 시드 알고리즘 별 PR",
    matchIds: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// G5.7 (후속 큐) — double_elimination generator (운영 사용 0)
// G5.8 (후속 큐) — swiss generator (운영 사용 0)
// ─────────────────────────────────────────────────────────────────────────
//
// 본 PR 미진입 사유: 운영 사용처 0 + 복잡도 ↑ + 강남구 사고 영구 차단 무관.
// 후속 진입 = 운영 사용 시점에 사용자 결재.

// ─────────────────────────────────────────────────────────────────────────
// 2026-05-15 PR-G5.5-followup — Tournament 단위 standings + placeholder applier
// ─────────────────────────────────────────────────────────────────────────
//
// 컨텍스트 (4차 BDR 뉴비리그 — Tournament 443f23f8 / 5/16 시작):
//   - division_rule = 0건 (종별 룰 없음)
//   - 매치 settings.division_code 도 없음
//   - 단판 결승 매치 (예: 매치 232) 가 placeholder 로 박혀야 하나, 기존
//     advanceDivisionPlaceholders 는 division_code 매칭 필수라 진입 불가
//
// 해결: division_code 무관 Tournament 단위 applier 신규 박제 (옵션 A — 신규 함수).
//   - getTournamentStandings: getDivisionStandings 의 category 필터 제거 버전
//   - advanceTournamentPlaceholders: settings.division_code 매칭 제거 + groupName 기준 매핑
//   - 기존 advanceDivisionPlaceholders / getDivisionStandings 시그니처/동작 변경 0 (회귀 차단)
//
// 호출처 (본 PR 범위 X — 후속 PR 큐):
//   - G5.5-followup-B: 매치 PATCH route 통합 (status='completed' UPDATE 시 division_rule=0 분기 → advanceTournamentPlaceholders 호출)
//   - 또는 운영자 manual trigger (어드민 API)

/**
 * Tournament 전체의 standings 조회 + 그룹별 순위 계산 (category 필터 없음).
 *
 * getDivisionStandings 와 차이:
 *   - category 매칭 제거 — 모든 TournamentTeam SELECT (4차 뉴비리그 케이스)
 *   - groupName 기준으로 그룹핑 (null → "X" 폴백, 기존 동일)
 *
 * 정렬 룰 (getDivisionStandings 동일 — pointsRule 분기):
 *   - "gnba": winPoints desc → PD → PF → name asc
 *   - "default" (기본): wins desc → PD → PF → name asc (기존)
 *
 * 회귀 0: pointsRule 인자 미전달 시 default = "default" → 기존 정렬과 동치.
 *
 * @param prisma - Prisma client 또는 transaction client
 * @param tournamentId - 대회 UUID
 * @param pointsRule - 승점 룰 분기 (default "default")
 */
export async function getTournamentStandings(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
  pointsRule: "gnba" | "default" = "default",
): Promise<DivisionStanding[]> {
  // 사유: category 필터 제거 — 4차 뉴비리그처럼 division_rule=0 인 대회 진입 가능
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    select: {
      id: true,
      groupName: true,
      wins: true,
      losses: true,
      draws: true,
      points_for: true,
      points_against: true,
      point_difference: true,
      // 2026-05-17 — winPoints 박제 (getDivisionStandings 와 시그니처 호환).
      win_points: true,
      team: { select: { name: true } },
    },
  });

  // 그룹별 분류 (getDivisionStandings 와 동일 — groupName null = "X" 폴백)
  const byGroup: Record<string, typeof teams> = {};
  for (const t of teams) {
    const g = t.groupName ?? "X";
    (byGroup[g] ??= []).push(t);
  }

  const result: DivisionStanding[] = [];
  for (const group of Object.keys(byGroup).sort()) {
    // 정렬 룰 = getDivisionStandings 동일 (단일 source 룰).
    const sorted = [...byGroup[group]].sort((a, b) => {
      if (pointsRule === "gnba") {
        const wpd = (b.win_points ?? 0) - (a.win_points ?? 0);
        if (wpd !== 0) return wpd;
      } else {
        const wd = (b.wins ?? 0) - (a.wins ?? 0);
        if (wd !== 0) return wd;
      }
      const pd = (b.point_difference ?? 0) - (a.point_difference ?? 0);
      if (pd !== 0) return pd;
      const pf = (b.points_for ?? 0) - (a.points_for ?? 0);
      if (pf !== 0) return pf;
      return (a.team?.name ?? "").localeCompare(b.team?.name ?? "");
    });
    sorted.forEach((t, i) => {
      result.push({
        tournamentTeamId: t.id.toString(),
        teamName: t.team?.name ?? "(이름 없음)",
        groupName: group,
        wins: t.wins ?? 0,
        losses: t.losses ?? 0,
        draws: t.draws ?? 0,
        pointsFor: t.points_for ?? 0,
        pointsAgainst: t.points_against ?? 0,
        pointDifference: t.point_difference ?? 0,
        // 2026-05-17 — DB 박제값 (단일 source / 재계산 회피).
        winPoints: t.win_points ?? 0,
        groupRank: i + 1,
      });
    });
  }
  return result;
}

/**
 * Tournament 단위 advanceResult — divisionCode 무관 (4차 뉴비리그 케이스).
 *
 * 본 PR (G5.5-followup) 의 placeholder applier 반환 타입. AdvanceResult 와 차이:
 *   - divisionCode 필드 → tournamentId (Tournament 단위 진입)
 *   - 그 외 (updated/skipped/errors/standings) 100% 동일 — 호환성 위해 동일 형식
 */
export type TournamentAdvanceResult = {
  tournamentId: string;
  updated: number;
  skipped: number;
  errors: Array<{ matchId: string; reason: string }>;
  standings: DivisionStanding[];
};

/**
 * Tournament 전체 placeholder 매치를 standings 기반으로 자동 채움
 * (division_code 무관 / division_rule=0 대회 진입 가능).
 *
 * advanceDivisionPlaceholders 와 차이:
 *   - placeholder fetch where 절에서 settings.division_code 필터 제거
 *   - standings 계산도 category 무관 (getTournamentStandings 호출)
 *
 * 안전성 (기존 advanceDivisionPlaceholders 동일 룰 — 회귀 0):
 *   - 이미 채워진 슬롯 보호 — NULL slot 만 UPDATE (운영자 수동 변경 보호)
 *   - notes 형식 위반 → errors 박제 + skip (UPDATE 0)
 *   - standings 매핑 실패 → errors 박제 + skip
 *   - idempotent 가드 — homeTeamId/awayTeamId 모두 NOT NULL row 는 fetch 자체 안 됨
 *
 * @param prisma - Prisma client 또는 transaction client
 * @param tournamentId - 대회 UUID
 */
export async function advanceTournamentPlaceholders(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
): Promise<TournamentAdvanceResult> {
  // 1) Tournament 전체 standings 계산 (category 필터 없음)
  const standings = await getTournamentStandings(prisma, tournamentId);

  // standings 매핑 key = "그룹:랭크" (예: "A:1")
  const standingsMap: Record<string, bigint> = {};
  for (const s of standings) {
    standingsMap[`${s.groupName}:${s.groupRank}`] = BigInt(s.tournamentTeamId);
  }

  // 2) placeholder 매치 fetch — division_code 필터 제거 (본 함수 차별점)
  //    homeTeamId OR awayTeamId 하나라도 NULL 이면 진입 (절반 NULL 케이스 포함)
  const placeholders = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      OR: [{ homeTeamId: null }, { awayTeamId: null }],
    },
    select: {
      id: true,
      notes: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });

  let updated = 0;
  let skipped = 0;
  const errors: TournamentAdvanceResult["errors"] = [];

  for (const m of placeholders) {
    // notes 파싱 — "A조 N위 vs B조 N위" 형식 (parseAdvancement 재사용)
    const parsed = parseAdvancement(m.notes);
    if (!parsed) {
      errors.push({
        matchId: m.id.toString(),
        reason: "notes 파싱 실패 (A조 N위 vs B조 N위 형식 부재)",
      });
      skipped++;
      continue;
    }

    const homeKey = `${parsed.home.group}:${parsed.home.rank}`;
    const awayKey = `${parsed.away.group}:${parsed.away.rank}`;
    const homeTtId = standingsMap[homeKey];
    const awayTtId = standingsMap[awayKey];

    if (!homeTtId || !awayTtId) {
      errors.push({
        matchId: m.id.toString(),
        reason: `standings 매핑 실패 (home=${homeKey} ${homeTtId ? "✓" : "✗"} / away=${awayKey} ${awayTtId ? "✓" : "✗"})`,
      });
      skipped++;
      continue;
    }

    // 이미 채워진 슬롯 덮어쓰지 않음 (운영자 수동 변경 보호 — null 인 슬롯만 UPDATE)
    const updateData: { homeTeamId?: bigint; awayTeamId?: bigint } = {};
    if (m.homeTeamId === null) updateData.homeTeamId = homeTtId;
    if (m.awayTeamId === null) updateData.awayTeamId = awayTtId;

    if (Object.keys(updateData).length === 0) {
      // 양 슬롯 모두 NOT NULL — placeholder fetch where 절상 진입 자체 불가능하지만 방어
      skipped++;
      continue;
    }

    await prisma.tournamentMatch.update({
      where: { id: m.id },
      data: updateData,
    });
    updated++;
  }

  return {
    tournamentId,
    updated,
    skipped,
    errors,
    standings,
  };
}

/**
 * 모든 종별 placeholder 일괄 처리 (운영자 manual trigger 용).
 *
 * @param prisma - Prisma client 또는 transaction client
 * @param tournamentId - 대회 UUID
 * @returns 종별 결과 배열
 */
export async function advanceAllDivisions(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
): Promise<AdvanceResult[]> {
  // 종별 룰 fetch
  const rules = await prisma.tournamentDivisionRule.findMany({
    where: { tournamentId },
    select: { code: true },
    orderBy: { sortOrder: "asc" },
  });

  const results: AdvanceResult[] = [];
  for (const r of rules) {
    const result = await advanceDivisionPlaceholders(prisma, tournamentId, r.code);
    results.push(result);
  }
  return results;
}
