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
  /** 그룹 내 순위 (1~N) */
  groupRank: number;
};

/**
 * 종별 모든 팀의 standings 조회 + 그룹별 순위 계산.
 *
 * 정렬 룰 (NBA / 한국농구협회 표준):
 *   1. wins desc (승수 많은 팀 우선)
 *   2. point_difference desc (득실차)
 *   3. points_for desc (득점)
 *   4. teamName asc (최종 tie-breaker — 결정 안 되면 이름순)
 *
 * @param prisma - Prisma client 또는 transaction client
 */
export async function getDivisionStandings(
  prisma: PrismaClient | Prisma.TransactionClient,
  tournamentId: string,
  divisionCode: string,
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
      const wd = (b.wins ?? 0) - (a.wins ?? 0);
      if (wd !== 0) return wd;
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
