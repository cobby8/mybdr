import { Prisma, PrismaClient } from "@prisma/client";
import { buildSlotLabel } from "./placeholder-helpers";
import {
  planGroupStageKnockoutMatches,
  type GenerateOptions,
  type GenerateResult,
} from "./division-advancement";

type TxClient = PrismaClient | Prisma.TransactionClient;

type DualDivisionGroup = {
  groupName: string;
  teams: Array<{ id: bigint }>;
};

function toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function slotTargetMapFromKnockoutSpecs(
  specs: ReturnType<typeof planGroupStageKnockoutMatches>,
): Map<string, { key: string; slot: "home" | "away" }> {
  const targets = new Map<string, { key: string; slot: "home" | "away" }>();
  for (const spec of specs) {
    targets.set(spec.homeSlot, { key: spec.key, slot: "home" });
    targets.set(spec.awaySlot, { key: spec.key, slot: "away" });
  }
  return targets;
}

async function createMatch(
  prisma: TxClient,
  data: Prisma.TournamentMatchUncheckedCreateInput,
): Promise<bigint> {
  const created = await prisma.tournamentMatch.create({
    data,
    select: { id: true },
  });
  return created.id;
}

/**
 * 종별 단위 듀얼토너먼트 generator.
 *
 * 4팀 1개조를 기본 단위로 두고 group_count 만큼 N개조로 확장한다.
 * 각 조는 G1/G2/승자전/패자전/최종전 5경기를 만들고,
 * 조 1위(G3 승자)와 조 2위(최종전 승자)를 본선 토너먼트로 연결한다.
 */
export async function generateDivisionDualTournamentMatches(
  prisma: TxClient,
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
  if (rule.format !== "dual_tournament") {
    return {
      divisionCode,
      generated: 0,
      skipped: 0,
      reason: `format=${rule.format} (dual_tournament 아님)`,
      matchIds: [],
    };
  }

  const settings = (rule.settings ?? {}) as Record<string, unknown>;
  const groupSize = Number(settings.group_size ?? 4);
  const configuredGroupCount = Number(settings.group_count ?? 0);
  if (groupSize !== 4) {
    return {
      divisionCode,
      generated: 0,
      skipped: 0,
      reason: "dual_tournament는 조별 4팀 고정 포맷입니다.",
      matchIds: [],
    };
  }

  const existing = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      settings: { path: ["division_code"], equals: divisionCode },
    },
    select: { id: true },
  });
  if (existing.length > 0) {
    return {
      divisionCode,
      generated: 0,
      skipped: existing.length,
      reason: `이미 종별 매치 ${existing.length}건 존재 (idempotent skip)`,
      matchIds: [],
    };
  }

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, status: "approved", category: divisionCode },
    orderBy: [{ groupName: "asc" }, { seedNumber: "asc" }, { createdAt: "asc" }],
    select: { id: true, groupName: true },
  });
  if (teams.length < 4) {
    return {
      divisionCode,
      generated: 0,
      skipped: 0,
      reason: "듀얼토너먼트는 최소 1개조 4팀이 필요합니다.",
      matchIds: [],
    };
  }

  const missingGroupCount = teams.filter((team) => !team.groupName).length;
  if (missingGroupCount > 0) {
    return {
      divisionCode,
      generated: 0,
      skipped: 0,
      reason: `조편성이 없는 승인팀 ${missingGroupCount}팀이 있습니다. 먼저 조편성을 완료하세요.`,
      matchIds: [],
    };
  }

  const byGroup = new Map<string, Array<{ id: bigint }>>();
  for (const team of teams) {
    const groupName = team.groupName?.trim();
    if (!groupName) continue;
    const groupTeams = byGroup.get(groupName) ?? [];
    groupTeams.push({ id: team.id });
    byGroup.set(groupName, groupTeams);
  }

  const groups: DualDivisionGroup[] = [...byGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, groupTeams]) => ({ groupName, teams: groupTeams }));

  if (configuredGroupCount > 0 && configuredGroupCount !== groups.length) {
    return {
      divisionCode,
      generated: 0,
      skipped: 0,
      reason: `설정된 조 개수(${configuredGroupCount})와 실제 조편성(${groups.length})이 다릅니다.`,
      matchIds: [],
    };
  }

  const invalidGroup = groups.find((group) => group.teams.length !== 4);
  if (invalidGroup) {
    return {
      divisionCode,
      generated: 0,
      skipped: 0,
      reason: `${invalidGroup.groupName}조가 ${invalidGroup.teams.length}팀입니다. 듀얼토너먼트는 각 조 4팀이어야 합니다.`,
      matchIds: [],
    };
  }

  const matchIds: string[] = [];
  const groupRefs = new Map<string, { g1: bigint; g2: bigint; g3: bigint; g4: bigint; final: bigint }>();
  const intervalMs = (opts.intervalMinutes ?? 30) * 60 * 1000;
  let matchNumber = 1;

  for (const group of groups) {
    const [seed1, seed2, seed3, seed4] = group.teams;
    const scheduledAt = (offset: number) =>
      opts.startScheduledAt
        ? new Date(opts.startScheduledAt.getTime() + offset * intervalMs)
        : null;
    const baseSettings = {
      division_code: divisionCode,
      stage: "dual_group",
      group_name: group.groupName,
    };

    const g1 = await createMatch(prisma, {
      tournamentId,
      homeTeamId: seed1.id,
      awayTeamId: seed2.id,
      status: "scheduled",
      roundName: `${group.groupName}조 1경기`,
      round_number: 1,
      bracket_level: 0,
      bracket_position: 1,
      match_number: matchNumber,
      group_name: group.groupName,
      venue_name: opts.venueName ?? null,
      scheduledAt: scheduledAt(matchNumber - 1),
      settings: toJson(baseSettings),
    });
    matchIds.push(g1.toString());
    matchNumber++;

    const g2 = await createMatch(prisma, {
      tournamentId,
      homeTeamId: seed3.id,
      awayTeamId: seed4.id,
      status: "scheduled",
      roundName: `${group.groupName}조 2경기`,
      round_number: 1,
      bracket_level: 0,
      bracket_position: 2,
      match_number: matchNumber,
      group_name: group.groupName,
      venue_name: opts.venueName ?? null,
      scheduledAt: scheduledAt(matchNumber - 1),
      settings: toJson(baseSettings),
    });
    matchIds.push(g2.toString());
    matchNumber++;

    const g3 = await createMatch(prisma, {
      tournamentId,
      status: "pending",
      roundName: `${group.groupName}조 승자전`,
      round_number: 2,
      bracket_level: 0,
      bracket_position: 3,
      match_number: matchNumber,
      group_name: group.groupName,
      venue_name: opts.venueName ?? null,
      settings: toJson({
        ...baseSettings,
        homeSlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G1", result: "winner" }),
        awaySlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G2", result: "winner" }),
      }),
    });
    matchIds.push(g3.toString());
    matchNumber++;

    const g4 = await createMatch(prisma, {
      tournamentId,
      status: "pending",
      roundName: `${group.groupName}조 패자전`,
      round_number: 2,
      bracket_level: 0,
      bracket_position: 4,
      match_number: matchNumber,
      group_name: group.groupName,
      venue_name: opts.venueName ?? null,
      settings: toJson({
        ...baseSettings,
        homeSlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G1", result: "loser" }),
        awaySlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G2", result: "loser" }),
      }),
    });
    matchIds.push(g4.toString());
    matchNumber++;

    const final = await createMatch(prisma, {
      tournamentId,
      status: "pending",
      roundName: `${group.groupName}조 최종전`,
      round_number: 3,
      bracket_level: 0,
      bracket_position: 1,
      match_number: matchNumber,
      group_name: group.groupName,
      venue_name: opts.venueName ?? null,
      settings: toJson({
        ...baseSettings,
        homeSlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G3", result: "loser" }),
        awaySlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G4", result: "winner" }),
      }),
    });
    matchIds.push(final.toString());
    matchNumber++;

    groupRefs.set(group.groupName, { g1, g2, g3, g4, final });
  }

  const knockoutSpecs =
    groups.length >= 2
      ? planGroupStageKnockoutMatches({ groupCount: groups.length, advancePerGroup: 2 })
      : [];
  const specByKey = new Map(knockoutSpecs.map((spec) => [spec.key, spec]));
  const idByKey = new Map<string, bigint>();

  for (const spec of [...knockoutSpecs].sort((a, b) => b.roundNumber - a.roundNumber || a.bracketPosition - b.bracketPosition)) {
    const scheduledAt =
      spec.roundNumber === 1 && opts.startScheduledAt
        ? new Date(opts.startScheduledAt.getTime() + (matchNumber + spec.matchIndex - 1) * intervalMs)
        : null;
    const nextSpec = spec.nextKey ? specByKey.get(spec.nextKey) : null;
    const nextMatchId = nextSpec ? idByKey.get(nextSpec.key) ?? null : null;
    const created = await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        homeTeamId: null,
        awayTeamId: null,
        roundName: spec.roundName,
        round_number: spec.roundNumber + 3,
        bracket_level: spec.bracketLevel,
        bracket_position: spec.bracketPosition,
        match_number: matchNumber + spec.matchIndex,
        venue_name: opts.venueName ?? null,
        scheduledAt,
        notes: spec.notes,
        settings: toJson({
          division_code: divisionCode,
          stage: "dual_knockout",
          homeSlotLabel: spec.homeSlot,
          awaySlotLabel: spec.awaySlot,
        }),
        status: spec.status,
        next_match_id: nextMatchId,
        next_match_slot: spec.nextSlot,
      },
      select: { id: true },
    });
    idByKey.set(spec.key, created.id);
    matchIds.push(created.id.toString());
  }

  const slotTargets = slotTargetMapFromKnockoutSpecs(knockoutSpecs);
  for (const group of groups) {
    const refs = groupRefs.get(group.groupName);
    if (!refs) continue;
    const firstTarget = slotTargets.get(buildSlotLabel({ kind: "group_rank", group: group.groupName, rank: 1 }));
    const secondTarget = slotTargets.get(buildSlotLabel({ kind: "group_rank", group: group.groupName, rank: 2 }));

    await prisma.tournamentMatch.update({
      where: { id: refs.g1 },
      data: {
        next_match_id: refs.g3,
        next_match_slot: "home",
        settings: toJson({
          division_code: divisionCode,
          stage: "dual_group",
          group_name: group.groupName,
          loserNextMatchId: refs.g4.toString(),
          loserNextMatchSlot: "home",
        }),
      },
    });
    await prisma.tournamentMatch.update({
      where: { id: refs.g2 },
      data: {
        next_match_id: refs.g3,
        next_match_slot: "away",
        settings: toJson({
          division_code: divisionCode,
          stage: "dual_group",
          group_name: group.groupName,
          loserNextMatchId: refs.g4.toString(),
          loserNextMatchSlot: "away",
        }),
      },
    });
    await prisma.tournamentMatch.update({
      where: { id: refs.g3 },
      data: {
        next_match_id: firstTarget ? idByKey.get(firstTarget.key) ?? null : null,
        next_match_slot: firstTarget?.slot ?? null,
        settings: toJson({
          division_code: divisionCode,
          stage: "dual_group",
          group_name: group.groupName,
          homeSlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G1", result: "winner" }),
          awaySlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G2", result: "winner" }),
          loserNextMatchId: refs.final.toString(),
          loserNextMatchSlot: "home",
        }),
      },
    });
    await prisma.tournamentMatch.update({
      where: { id: refs.g4 },
      data: {
        next_match_id: refs.final,
        next_match_slot: "away",
        settings: toJson({
          division_code: divisionCode,
          stage: "dual_group",
          group_name: group.groupName,
          homeSlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G1", result: "loser" }),
          awaySlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G2", result: "loser" }),
        }),
      },
    });
    await prisma.tournamentMatch.update({
      where: { id: refs.final },
      data: {
        next_match_id: secondTarget ? idByKey.get(secondTarget.key) ?? null : null,
        next_match_slot: secondTarget?.slot ?? null,
        settings: toJson({
          division_code: divisionCode,
          stage: "dual_group",
          group_name: group.groupName,
          homeSlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G3", result: "loser" }),
          awaySlotLabel: buildSlotLabel({ kind: "group_match_result", group: group.groupName, matchSlot: "G4", result: "winner" }),
        }),
      },
    });
  }

  return { divisionCode, generated: matchIds.length, skipped: 0, reason: "OK", matchIds };
}
