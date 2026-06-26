"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Icon, useTossConfirm } from "@/components/admin-toss";
import { PanelLoadingState } from "./panel-loading-state";

type TeamInfo = {
  id: string;
  team: { name: string; primaryColor: string | null };
};

type RawTeamInfo = {
  id: string;
  team: { name: string; primaryColor?: string | null; primary_color?: string | null };
};

type Match = {
  id: string;
  roundName: string | null;
  round_number: number | null;
  bracket_position: number | null;
  match_number: number | null;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
  group_name?: string | null;
  settings?: {
    homeSlotLabel?: string | null;
    awaySlotLabel?: string | null;
    home_slot_label?: string | null;
    away_slot_label?: string | null;
    division_code?: string | null;
    division_tier?: string | null;
    group_name?: string | null;
    stage?: string | null;
  } | null;
  scheduledAt?: string | null;
  scheduled_at?: string | null;
  venue_name?: string | null;
  court_number?: string | null;
};

type RawMatch = Omit<
  Partial<Match>,
  "homeTeam" | "awayTeam" | "homeTeamId" | "awayTeamId" | "homeScore" | "awayScore" | "roundName"
> & {
  id: string;
  roundName?: string | null;
  round_name?: string | null;
  homeTeamId?: string | null;
  home_team_id?: string | null;
  awayTeamId?: string | null;
  away_team_id?: string | null;
  homeScore?: number | null;
  home_score?: number | null;
  awayScore?: number | null;
  away_score?: number | null;
  homeTeam?: RawTeamInfo | null;
  home_team?: RawTeamInfo | null;
  awayTeam?: RawTeamInfo | null;
  away_team?: RawTeamInfo | null;
};

type ApprovedTeam = {
  id: string;
  seedNumber: number | null;
  groupName: string | null;
  group_order: number | null;
  category: string | null;
  team: { name: string };
};

type RawApprovedTeam = {
  id: string;
  seedNumber?: number | null;
  seed_number?: number | null;
  groupName?: string | null;
  group_name?: string | null;
  group_order?: number | null;
  category?: string | null;
  team: { name: string };
};

type DivisionRule = {
  id: string;
  code: string;
  label?: string | null;
  format: string | null;
  settings?: Record<string, unknown> | null;
};

type BracketData = {
  matches: Match[];
  approvedTeams: ApprovedTeam[];
  divisionRules: DivisionRule[];
};

const EMPTY_DIVISION_RULES: DivisionRule[] = [];

type RawBracketData = {
  matches?: RawMatch[];
  approvedTeams?: RawApprovedTeam[];
  approved_teams?: RawApprovedTeam[];
  divisionRules?: DivisionRule[];
  division_rules?: DivisionRule[];
};

type RuleConfig = {
  format: string;
  group_count: number;
  group_size: number;
  advance_per_group: number;
};

type DrawPhase = "config" | "seeding" | "drawn";
type BusyKind = "settings" | "random" | "seeded" | "generate" | null;

const GROUP_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const OPERATE_FORMATS = [
  "single_elimination",
  "round_robin",
  "dual_tournament",
  "group_stage_knockout",
  "league_advancement",
  "group_stage_with_ranking",
] as const;

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트",
  round_robin: "풀리그",
  dual_tournament: "듀얼토너먼트",
  group_stage_knockout: "조별리그+토너먼트",
  league_advancement: "링크제",
  group_stage_with_ranking: "조별리그+동순위전",
};

function normalizeTeamInfo(team: RawTeamInfo | null | undefined): TeamInfo | null {
  if (!team) return null;
  return {
    id: team.id,
    team: {
      name: team.team.name,
      primaryColor: team.team.primaryColor ?? team.team.primary_color ?? null,
    },
  };
}

function normalizeMatch(match: RawMatch): Match {
  return {
    id: match.id,
    roundName: match.roundName ?? match.round_name ?? null,
    round_number: match.round_number ?? null,
    bracket_position: match.bracket_position ?? null,
    match_number: match.match_number ?? null,
    status: match.status ?? "scheduled",
    homeTeamId: match.homeTeamId ?? match.home_team_id ?? null,
    awayTeamId: match.awayTeamId ?? match.away_team_id ?? null,
    homeScore: match.homeScore ?? match.home_score ?? 0,
    awayScore: match.awayScore ?? match.away_score ?? 0,
    homeTeam: normalizeTeamInfo(match.homeTeam ?? match.home_team),
    awayTeam: normalizeTeamInfo(match.awayTeam ?? match.away_team),
    group_name: match.group_name ?? null,
    settings: match.settings ?? null,
    scheduledAt: match.scheduledAt ?? match.scheduled_at ?? null,
    scheduled_at: match.scheduled_at ?? match.scheduledAt ?? null,
    venue_name: match.venue_name ?? null,
    court_number: match.court_number ?? null,
  };
}

function normalizeData(raw: RawBracketData): BracketData {
  const approvedTeams = raw.approvedTeams ?? raw.approved_teams ?? [];
  return {
    matches: (raw.matches ?? []).map(normalizeMatch),
    approvedTeams: approvedTeams.map((team) => ({
      id: team.id,
      seedNumber: team.seedNumber ?? team.seed_number ?? null,
      groupName: team.groupName ?? team.group_name ?? null,
      group_order: team.group_order ?? null,
      category: team.category ?? null,
      team: team.team,
    })),
    divisionRules: raw.divisionRules ?? raw.division_rules ?? [],
  };
}

function numberSetting(settings: Record<string, unknown> | null | undefined, key: string, fallback: number) {
  const value = settings?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function ruleConfig(rule: DivisionRule): RuleConfig {
  const format = rule.format ?? "group_stage_knockout";
  return {
    format,
    group_count: numberSetting(rule.settings, "group_count", format === "single_elimination" ? 1 : 2),
    group_size: numberSetting(rule.settings, "group_size", 4),
    advance_per_group: numberSetting(rule.settings, "advance_per_group", 2),
  };
}

function usesGroups(format: string) {
  return format !== "single_elimination";
}

function usesAdvance(format: string) {
  return format === "group_stage_knockout" || format === "dual_tournament";
}

function canEditAdvancePerGroup(format: string) {
  return format === "group_stage_knockout";
}

function divisionCodeOf(match: Match) {
  return match.settings?.division_code ?? null;
}

function teamsForDivisionRule(teams: ApprovedTeam[], rule: DivisionRule, allRules: DivisionRule[]) {
  const exact = teams.filter((team) => team.category === rule.code);
  if (exact.length > 0) return exact;

  const byLabel = teams.filter((team) => rule.label && team.category === rule.label);
  if (byLabel.length > 0) return byLabel;

  if (allRules.length === 1) return teams;

  return exact;
}

function matchesForRule(matches: Match[], code: string) {
  return matches.filter((match) => divisionCodeOf(match) === code);
}

function buildSlots(config: RuleConfig, teamCount: number) {
  if (!usesGroups(config.format)) {
    return Array.from({ length: Math.max(teamCount, 2) }, (_, index) => `T${index + 1}`);
  }
  const slots: string[] = [];
  for (let groupIndex = 0; groupIndex < config.group_count; groupIndex++) {
    for (let slotIndex = 1; slotIndex <= config.group_size; slotIndex++) {
      slots.push(`${GROUP_LABELS[groupIndex]}${slotIndex}`);
    }
  }
  return slots;
}

function slotForTeam(team: ApprovedTeam) {
  if (!team.groupName) return null;
  return `${team.groupName}${team.group_order ?? team.seedNumber ?? ""}`;
}

function groupTeams(teams: ApprovedTeam[], config: RuleConfig) {
  const groups = new Map<string, ApprovedTeam[]>();
  for (let index = 0; index < Math.max(config.group_count, 1); index++) {
    groups.set(GROUP_LABELS[index], []);
  }
  for (const team of teams) {
    if (!team.groupName) continue;
    if (!groups.has(team.groupName)) groups.set(team.groupName, []);
    groups.get(team.groupName)!.push(team);
  }
  return Array.from(groups.entries()).map(([group, values]) => ({
    group,
    teams: values.sort((a, b) => (a.group_order ?? a.seedNumber ?? 999) - (b.group_order ?? b.seedNumber ?? 999)),
  }));
}

function roundRobinCount(size: number) {
  return Math.max(0, (size * (size - 1)) / 2);
}

function knockoutRoundName(size: number) {
  if (size <= 2) return "결승";
  if (size === 4) return "4강";
  if (size === 8) return "8강";
  if (size === 16) return "16강";
  if (size === 32) return "32강";
  return `${size}강`;
}

function buildKnockoutLeaves(config: RuleConfig, teamCount: number) {
  if (config.format === "round_robin") return [];
  if (config.format === "single_elimination") {
    let size = 2;
    while (size < teamCount) size *= 2;
    return Array.from({ length: size }, (_, index) => `T${index + 1}`);
  }

  const advancePerGroup = config.format === "dual_tournament"
    ? 2
    : Math.min(config.advance_per_group, config.group_size);
  if (config.group_count === 2 && advancePerGroup === 3) {
    return ["A1위", "부전승", "B2위", "A3위", "B1위", "부전승", "A2위", "B3위"];
  }

  const leaves: string[] = [];
  for (let rank = 1; rank <= advancePerGroup; rank++) {
    for (let groupIndex = 0; groupIndex < config.group_count; groupIndex++) {
      leaves.push(`${GROUP_LABELS[groupIndex]}${rank}위`);
    }
  }

  let size = 2;
  while (size < leaves.length) size *= 2;
  while (leaves.length < size) leaves.push("부전승");

  const crossed: string[] = [];
  for (let index = 0; index < size / 2; index++) {
    crossed.push(leaves[index], leaves[size - 1 - index]);
  }
  return crossed;
}

function isByeSlot(slot: string | undefined) {
  return !slot || slot === "부전승";
}

function nextRoundsFromLeaves(leaves: string[]) {
  const rounds: Array<{ name: string; pairs: Array<[string, string]> }> = [];
  let current = leaves;
  while (current.length >= 2) {
    const name = knockoutRoundName(current.length);
    const pairs: Array<[string, string]> = [];
    const next: string[] = [];
    for (let index = 0; index < current.length; index += 2) {
      const home = current[index];
      const away = current[index + 1];
      const homeBye = isByeSlot(home);
      const awayBye = isByeSlot(away);

      if (homeBye && awayBye) {
        next.push("부전승");
        continue;
      }
      if (awayBye) {
        next.push(home);
        continue;
      }
      if (homeBye) {
        next.push(away);
        continue;
      }

      const bracketPosition = index / 2 + 1;
      pairs.push([home, away]);
      next.push(`${name} ${bracketPosition}경기 승자`);
    }
    if (pairs.length > 0) rounds.push({ name, pairs });
    current = next;
  }
  return rounds;
}

function countPairs(rounds: Array<{ pairs: Array<[string, string]> }>) {
  return rounds.reduce((sum, round) => sum + round.pairs.length, 0);
}

function expectedGroupGameCount(config: RuleConfig) {
  if (config.format === "single_elimination") return 0;
  if (config.format === "dual_tournament") return config.group_count * 5;
  return config.group_count * roundRobinCount(config.group_size);
}

function formatSummary(config: RuleConfig, teamCount: number, leaves: string[], hasGroups: boolean) {
  const groupGames = expectedGroupGameCount(config);
  const knockoutGames = countPairs(nextRoundsFromLeaves(leaves));
  const slots = config.format === "single_elimination"
    ? Math.max(2, leaves.length)
    : config.group_count * config.group_size;
  const qualifiers = config.format === "single_elimination"
    ? teamCount
    : config.format === "round_robin"
      ? 0
      : config.group_count * (config.format === "dual_tournament" ? 2 : config.advance_per_group);

  return {
    slots,
    qualifiers,
    groupGames,
    knockoutGames,
    totalGames: groupGames + knockoutGames,
    ready: config.format === "single_elimination" || hasGroups,
  };
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function readApiError(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback;
  const record = json as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;
  if (Array.isArray(record.error)) {
    const issue = record.error.find((item) => item && typeof item === "object" && "message" in item);
    const message = issue && (issue as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  if (typeof record.message === "string") return record.message;
  return fallback;
}

export default function BracketPanel(_props: { showNextStepCTA?: boolean } = {}) {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [configs, setConfigs] = useState<Record<string, RuleConfig>>({});
  const [phaseByCode, setPhaseByCode] = useState<Record<string, DrawPhase>>({});
  const [seedByCode, setSeedByCode] = useState<Record<string, Record<string, string>>>({});
  const [assignmentByCode, setAssignmentByCode] = useState<Record<string, Record<string, string>>>({});
  const [leavesByCode, setLeavesByCode] = useState<Record<string, string[]>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState<BusyKind>(null);
  const tossConfirm = useTossConfirm();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(json, "대진표 정보를 불러오지 못했습니다."));
      setData(normalizeData(json as RawBracketData));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "대진표 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const rules = data?.divisionRules ?? EMPTY_DIVISION_RULES;

  useEffect(() => {
    if (rules.length > 0 && (!activeCode || !rules.some((rule) => rule.code === activeCode))) {
      setActiveCode(rules[0].code);
    }
  }, [activeCode, rules]);

  useEffect(() => {
    if (rules.length === 0) return;
    setConfigs((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const rule of rules) {
        if (!next[rule.code]) {
          next[rule.code] = ruleConfig(rule);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [rules]);

  const activeRule = rules.find((rule) => rule.code === activeCode) ?? rules[0] ?? null;
  const selectedConfig = activeRule ? configs[activeRule.code] ?? ruleConfig(activeRule) : null;
  const approvedTeams = useMemo(
    () => activeRule && data ? teamsForDivisionRule(data.approvedTeams, activeRule, rules) : [],
    [activeRule, data],
  );
  const generatedMatches = useMemo(
    () => activeRule && data ? matchesForRule(data.matches, activeRule.code) : [],
    [activeRule, data],
  );

  if (loading) return <PanelLoadingState label="대진표를 준비 중입니다." />;

  if (!data || rules.length === 0 || !activeRule || !selectedConfig) {
    return (
      <div data-skin="toss" className="ct-emptybox">
        <Icon name="git-merge" size={36} color="var(--ink-dim)" />
        <b>종별 설정이 없습니다</b>
        <span>대회 정보 수정에서 종별을 먼저 저장하면 여기서 조편성과 대진표를 만들 수 있습니다.</span>
      </div>
    );
  }

  const currentRule = activeRule;
  const currentConfig = selectedConfig;
  const serverConfig = ruleConfig(currentRule);
  const configDirty = JSON.stringify(currentConfig) !== JSON.stringify(serverConfig);
  const selectedSeeds = seedByCode[currentRule.code] ?? {};
  const selectedAssignment = assignmentByCode[currentRule.code] ?? {};
  const groupBased = usesGroups(currentConfig.format);
  const hasGroups = approvedTeams.some((team) => team.groupName);
  const hasGeneratedMatches = generatedMatches.length > 0;
  const phase = phaseByCode[currentRule.code] ?? (hasGeneratedMatches || hasGroups ? "drawn" : "config");
  const leaves = leavesByCode[currentRule.code] ?? buildKnockoutLeaves(currentConfig, approvedTeams.length);
  const rounds = nextRoundsFromLeaves(leaves);
  const summary = formatSummary(currentConfig, approvedTeams.length, leaves, hasGroups);
  const groupedTeams = groupTeams(approvedTeams, currentConfig);

  function patchConfig(patch: Partial<RuleConfig>) {
    setConfigs((prev) => ({
      ...prev,
      [currentRule.code]: { ...currentConfig, ...patch },
    }));
    setLeavesByCode((prev) => {
      const next = { ...prev };
      delete next[currentRule.code];
      return next;
    });
  }

  function setPhase(phaseValue: DrawPhase) {
    setPhaseByCode((prev) => ({ ...prev, [currentRule.code]: phaseValue }));
  }

  function setSeed(slot: string, teamId: string) {
    setSeedByCode((prev) => {
      const current = { ...(prev[currentRule.code] ?? {}) };
      if (teamId) current[slot] = teamId;
      else delete current[slot];
      return { ...prev, [currentRule.code]: current };
    });
  }

  function assignLocalDraw(mode: "random" | "seeded") {
    const slots = buildSlots(currentConfig, approvedTeams.length);
    const nextAssignment: Record<string, string> = {};
    const fixedTeamIds = new Set<string>();

    if (mode === "seeded") {
      for (const [slot, teamId] of Object.entries(selectedSeeds)) {
        const team = approvedTeams.find((item) => item.id === teamId);
        if (!team) continue;
        nextAssignment[slot] = team.team.name;
        fixedTeamIds.add(team.id);
      }
    }

    const pool = shuffle(approvedTeams.filter((team) => !fixedTeamIds.has(team.id)));
    let poolIndex = 0;
    for (const slot of slots) {
      if (nextAssignment[slot]) continue;
      const team = pool[poolIndex++];
      nextAssignment[slot] = team?.team.name ?? "부전승";
    }

    setAssignmentByCode((prev) => ({ ...prev, [currentRule.code]: nextAssignment }));
    setLeavesByCode((prev) => ({
      ...prev,
      [currentRule.code]: buildKnockoutLeaves(currentConfig, approvedTeams.length),
    }));
    setPhase("drawn");
    setNotice(mode === "seeded" ? "시드 반영 후 나머지 팀을 랜덤 배정했습니다." : "완전 랜덤 추첨을 완료했습니다.");
  }

  async function saveSettings(options: { quiet?: boolean } = {}) {
    setBusy("settings");
    setError("");
    if (!options.quiet) setNotice("");
    try {
      const settings = {
        ...(currentRule.settings ?? {}),
        group_count: currentConfig.group_count,
        group_size: currentConfig.group_size,
        advance_per_group: currentConfig.advance_per_group,
      };
      const res = await fetch(`/api/web/admin/tournaments/${id}/division-rules/${currentRule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: currentConfig.format, settings }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(json, "종별 설정 저장 실패"));
      if (!options.quiet) setNotice("종별 설정을 저장했습니다.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "종별 설정 저장 중 오류가 발생했습니다.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function draw(mode: "random" | "seeded") {
    if (configDirty) {
      const saved = await saveSettings({ quiet: true });
      if (!saved) return;
    }

    if (!usesGroups(currentConfig.format)) {
      assignLocalDraw(mode);
      return;
    }

    setBusy(mode);
    setError("");
    setNotice("");
    try {
      const seedAssignments = mode === "seeded"
        ? Object.entries(selectedSeeds)
            .filter(([, teamId]) => teamId)
            .map(([slot, teamId]) => ({ slot, teamId }))
        : [];

      const res = await fetch(`/api/web/admin/tournaments/${id}/division-draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divisionCode: currentRule.code,
          groupCount: currentConfig.group_count,
          groupSize: currentConfig.group_size,
          mode,
          seedAssignments,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(json, "조편성 실패"));

      setPhase("drawn");
      setLeavesByCode((prev) => ({
        ...prev,
        [currentRule.code]: buildKnockoutLeaves(currentConfig, approvedTeams.length),
      }));
      setNotice(`${currentRule.label ?? currentRule.code} 조편성을 완료했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "조편성 중 오류가 발생했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function generateMatches() {
    if (configDirty) {
      const saved = await saveSettings({ quiet: true });
      if (!saved) return;
    }
    if (usesGroups(currentConfig.format) && !hasGroups && phase !== "drawn") {
      setError("먼저 조편성을 완료하세요. 조편성 후 대회 방식에 맞춰 경기표가 생성됩니다.");
      return;
    }

    const ok = !hasGeneratedMatches || await tossConfirm.confirm({
      title: "대진표 재생성",
      sub: `${currentRule.label ?? currentRule.code} 기존 경기 ${generatedMatches.length}건을 삭제 후 다시 생성합니다.`,
      body: "이미 일정·점수·기록이 들어간 경기는 영향을 받을 수 있습니다. 운영 전 최종 확인용으로만 재생성하세요.",
      confirmLabel: "재생성",
      tone: "danger",
    });
    if (!ok) return;

    setBusy("generate");
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/division-rules/${currentRule.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: hasGeneratedMatches }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(json, "대진표 생성 실패"));
      const payload = json?.data ?? json;
      if (!payload?.generated) {
        throw new Error(payload?.reason ?? "생성된 경기가 없습니다. 종별 설정과 조편성을 확인하세요.");
      }
      setPhase("drawn");
      setNotice(`${currentRule.label ?? currentRule.code} ${payload.generated}경기를 일정에 반영했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "대진표 생성 중 오류가 발생했습니다.");
    } finally {
      setBusy(null);
    }
  }

  function resetLocalDraw() {
    setPhase("config");
    setSeedByCode((prev) => ({ ...prev, [currentRule.code]: {} }));
    setAssignmentByCode((prev) => ({ ...prev, [currentRule.code]: {} }));
    setLeavesByCode((prev) => {
      const next = { ...prev };
      delete next[currentRule.code];
      return next;
    });
    setNotice("화면의 추첨 상태를 초기화했습니다. DB 조편성은 변경하지 않았습니다.");
  }

  function swapLeaf(toIndex: number) {
    if (dragIndex == null || dragIndex === toIndex) {
      setDragIndex(null);
      return;
    }
    setLeavesByCode((prev) => {
      const current = [...(prev[currentRule.code] ?? leaves)];
      [current[dragIndex], current[toIndex]] = [current[toIndex], current[dragIndex]];
      return { ...prev, [currentRule.code]: current };
    });
    setDragIndex(null);
  }

  return (
    <div data-skin="toss" className="bk-operate">
      {tossConfirm.dialog}
      {error && <div className="bk-alert" data-tone="danger">{error}</div>}
      {notice && <div className="bk-alert" data-tone="ok">{notice}</div>}

      <DivisionTabs
        rules={rules}
        activeCode={currentRule.code}
        matches={data.matches}
        onSelect={(code) => {
          setActiveCode(code);
          setError("");
          setNotice("");
          setDragIndex(null);
        }}
      />

      <section className="ts-card ts-card--flat bk-config">
        <div className="ct-section__head">
          <span className="ct-headicon"><Icon name="settings-2" size={18} /></span>
          <div>
            <h3 className="ct-section__title">대회 방식 · 조 설정</h3>
            <p className="ct-section__sub">대회 생성 시 입력값을 여기서 확인·수정할 수 있습니다.</p>
          </div>
        </div>
        <div className="bk-cfg-grid">
          <label className="ts-field">
            <span className="ts-field__label">대회 방식</span>
            <select className="ts-select" value={currentConfig.format} onChange={(event) => patchConfig({ format: event.target.value })}>
              {OPERATE_FORMATS.map((format) => (
                <option key={format} value={format}>{FORMAT_LABEL[format]}</option>
              ))}
            </select>
          </label>
          <label className="ts-field" data-disabled={!usesGroups(currentConfig.format)}>
            <span className="ts-field__label">조 수</span>
            <input
              className="ts-input"
              type="number"
              min={1}
              max={16}
              disabled={!usesGroups(currentConfig.format)}
              value={currentConfig.group_count}
              onChange={(event) => patchConfig({ group_count: Math.max(1, Number(event.target.value) || 1) })}
            />
          </label>
          <label className="ts-field" data-disabled={!usesGroups(currentConfig.format)}>
            <span className="ts-field__label">조별 팀수</span>
            <input
              className="ts-input"
              type="number"
              min={2}
              max={16}
              disabled={!usesGroups(currentConfig.format)}
              value={currentConfig.group_size}
              onChange={(event) => patchConfig({ group_size: Math.max(2, Number(event.target.value) || 2) })}
            />
          </label>
          <label className="ts-field" data-disabled={!canEditAdvancePerGroup(currentConfig.format)}>
            <span className="ts-field__label">본선 진출(조별)</span>
            <input
              className="ts-input"
              type="number"
              min={1}
              max={currentConfig.group_size}
              disabled={!canEditAdvancePerGroup(currentConfig.format)}
              value={currentConfig.format === "dual_tournament" ? 2 : currentConfig.advance_per_group}
              onChange={(event) => patchConfig({ advance_per_group: Math.max(1, Number(event.target.value) || 1) })}
            />
          </label>
        </div>
        <div className="bk-badges">
          <span className="ct-pill" data-tone="mute">{FORMAT_LABEL[currentConfig.format] ?? currentConfig.format}</span>
          <span className="ct-pill" data-tone="info">참가 {approvedTeams.length}팀</span>
          <span className="ct-pill" data-tone="mute">슬롯 {summary.slots}</span>
          {usesAdvance(currentConfig.format) && (
            <span className="ct-pill" data-tone="ok">
              본선 진출 {summary.qualifiers}팀
            </span>
          )}
          {summary.groupGames > 0 && <span className="ct-pill" data-tone="mute">예선 {summary.groupGames}경기</span>}
          {summary.knockoutGames > 0 && <span className="ct-pill" data-tone="mute">본선 {summary.knockoutGames}경기</span>}
          {configDirty && <span className="ct-pill" data-tone="warn">저장 필요</span>}
          {hasGeneratedMatches && <span className="ct-pill" data-tone="ok">일정 반영됨 {generatedMatches.length}경기</span>}
        </div>
      </section>

      {groupBased ? (
        <section className="ts-card ts-card--flat bk-drawbar">
          <div>
            <p className="bk-subtitle">조편성</p>
            <p className="ct-section__sub">
              {phase === "seeding"
                ? "시드 팀을 조·슬롯에 배정한 뒤 나머지를 랜덤 추첨하세요."
                : phase === "drawn"
                  ? "추첨 완료. 대회 방식에 맞춰 트리와 경기표를 생성할 수 있습니다."
                  : "완전 랜덤 또는 시드 배정 후 랜덤으로 추첨하세요."}
            </p>
          </div>
          <div className="bk-actions">
            <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" disabled={busy != null} onClick={resetLocalDraw}>
              초기화
            </button>
            {configDirty && (
              <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" disabled={busy != null} onClick={() => saveSettings()}>
                {busy === "settings" ? "저장 중..." : "설정 저장"}
              </button>
            )}
            {phase !== "seeding" && (
              <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" disabled={busy != null || approvedTeams.length < 2} onClick={() => draw("random")}>
                {busy === "random" ? "추첨 중..." : "완전 랜덤 추첨"}
              </button>
            )}
            {phase !== "seeding" && (
              <button type="button" className="ts-btn ts-btn--primary ts-btn--sm" disabled={busy != null || approvedTeams.length < 2} onClick={() => setPhase("seeding")}>
                시드 배정
              </button>
            )}
            {phase === "seeding" && (
              <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" disabled={busy != null} onClick={() => setPhase("config")}>
                시드 취소
              </button>
            )}
            {phase === "seeding" && (
              <button type="button" className="ts-btn ts-btn--primary ts-btn--sm" disabled={busy != null} onClick={() => draw("seeded")}>
                {busy === "seeded" ? "추첨 중..." : "시드 완료 → 랜덤 추첨"}
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="ts-card ts-card--flat bk-drawbar">
          <div>
            <p className="bk-subtitle">조편성</p>
            <p className="ct-section__sub">
              {phase === "seeding"
                ? "시드 팀을 토너먼트 슬롯에 배정한 뒤 나머지를 랜덤 추첨하세요."
                : phase === "drawn"
                  ? "추첨 완료. 토너먼트 트리를 드래그로 수정할 수 있습니다."
                  : "단일 토너먼트는 조 없이 완전 랜덤 또는 시드 배정 후 랜덤으로 추첨하세요."}
            </p>
          </div>
          <div className="bk-actions">
            <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" disabled={busy != null} onClick={resetLocalDraw}>
              초기화
            </button>
            {configDirty && (
              <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" disabled={busy != null} onClick={() => saveSettings()}>
                {busy === "settings" ? "저장 중..." : "설정 저장"}
              </button>
            )}
            {phase !== "seeding" && (
              <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" disabled={busy != null || approvedTeams.length < 2} onClick={() => draw("random")}>
                완전 랜덤 추첨
              </button>
            )}
            {phase !== "seeding" && (
              <button type="button" className="ts-btn ts-btn--primary ts-btn--sm" disabled={busy != null || approvedTeams.length < 2} onClick={() => setPhase("seeding")}>
                시드 배정
              </button>
            )}
            {phase === "seeding" && (
              <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" disabled={busy != null} onClick={() => setPhase("config")}>
                시드 취소
              </button>
            )}
            {phase === "seeding" && (
              <button type="button" className="ts-btn ts-btn--primary ts-btn--sm" disabled={busy != null} onClick={() => draw("seeded")}>
                시드 완료 → 랜덤 추첨
              </button>
            )}
          </div>
        </section>
      )}

      {phase === "seeding" && (
        <SeedAssignment
          config={currentConfig}
          teams={approvedTeams}
          selectedSeeds={selectedSeeds}
          onChange={setSeed}
        />
      )}

      {groupBased && (
        <GroupAssignment
          config={currentConfig}
          teams={approvedTeams}
          groups={groupedTeams}
          hasGroups={hasGroups}
        />
      )}

      {phase === "drawn" && currentConfig.format === "dual_tournament" && (
        <DualPreview config={currentConfig} groups={groupedTeams} />
      )}

      <section className="ts-card ts-card--flat">
        <div className="bk-section-row">
          <div>
            <h4 className="bk-subh">토너먼트 트리</h4>
            <p className="ct-section__sub">조편성 결과와 대회 방식에 맞춰 생성될 본선 흐름입니다. 첫 라운드는 드래그해 교체할 수 있습니다.</p>
          </div>
          <button type="button" className="ts-btn ts-btn--primary ts-btn--sm" disabled={busy != null || approvedTeams.length < 2} onClick={generateMatches}>
            {busy === "generate" ? "반영 중..." : hasGeneratedMatches ? "일정에 다시 반영" : "일정에 반영"}
          </button>
        </div>
        {rounds.length > 0 ? (
          <div className="bk-tree">
            {rounds.map((round, roundIndex) => (
              <div key={round.name} className="bk-round">
                <div className="bk-round__name">{round.name}</div>
                <div className="bk-round__body">
                  {round.pairs.map(([home, away], pairIndex) => {
                    const firstRound = roundIndex === 0;
                    const homeIndex = pairIndex * 2;
                    const awayIndex = pairIndex * 2 + 1;
                    return (
                      <div key={`${round.name}-${pairIndex}`} className="bk-cell">
                        <div className="bk-match">
                          <div
                            className={firstRound ? "bk-seedrow bk-seedrow--drag" : "bk-seedrow"}
                            draggable={firstRound}
                            onDragStart={() => firstRound && setDragIndex(homeIndex)}
                            onDragOver={(event) => firstRound && event.preventDefault()}
                            onDrop={() => firstRound && swapLeaf(homeIndex)}
                          >
                            {firstRound && <Icon name="grip-vertical" size={13} color="var(--ink-dim)" />}
                            <span>{firstRound ? selectedAssignment[home] ?? home : home}</span>
                          </div>
                          <div
                            className={firstRound ? "bk-seedrow bk-seedrow--drag" : "bk-seedrow"}
                            draggable={firstRound}
                            onDragStart={() => firstRound && setDragIndex(awayIndex)}
                            onDragOver={(event) => firstRound && event.preventDefault()}
                            onDrop={() => firstRound && swapLeaf(awayIndex)}
                          >
                            {firstRound && <Icon name="grip-vertical" size={13} color="var(--ink-dim)" />}
                            <span>{firstRound ? selectedAssignment[away] ?? away : away}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ct-emptybox">
            <Icon name="calendar-plus" size={36} color="var(--ink-dim)" />
            <b>리그전 방식입니다</b>
            <span>조편성 후 일정에 반영하면 조별 리그 경기표가 생성됩니다.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function DivisionTabs({
  rules,
  activeCode,
  matches,
  onSelect,
}: {
  rules: DivisionRule[];
  activeCode: string;
  matches: Match[];
  onSelect: (code: string) => void;
}) {
  return (
    <div className="bk-rule-tabs" aria-label="종별 선택">
      <span className="bk-rule-tabs__label">종별:</span>
      {rules.map((rule) => {
        const active = rule.code === activeCode;
        const count = matchesForRule(matches, rule.code).length;
        return (
          <button
            key={rule.id}
            type="button"
            className="ts-chip bk-rule-chip"
            data-active={active ? "true" : "false"}
            onClick={() => onSelect(rule.code)}
          >
            {rule.label ?? rule.code}
            {count > 0 && <Icon name="check" size={13} />}
          </button>
        );
      })}
    </div>
  );
}

function SeedAssignment({
  config,
  teams,
  selectedSeeds,
  onChange,
}: {
  config: RuleConfig;
  teams: ApprovedTeam[];
  selectedSeeds: Record<string, string>;
  onChange: (slot: string, teamId: string) => void;
}) {
  const slots = buildSlots(config, teams.length);
  const groups = usesGroups(config.format)
    ? GROUP_LABELS.slice(0, Math.max(config.group_count, 1)).map((group) => ({
        group,
        slots: slots.filter((slot) => slot.startsWith(group)),
      }))
    : [{ group: "토너먼트", slots }];

  return (
    <section className="ts-card ts-card--flat">
      <h4 className="bk-subh">시드 슬롯 — 클릭해 팀 배정</h4>
      <div className="bk-groups">
        {groups.map(({ group, slots: groupSlots }) => (
          <div key={group} className="bk-group">
            <div className="bk-group__name">{usesGroups(config.format) ? `${group}조` : group}</div>
            {groupSlots.map((slot) => {
              const usedByOther = new Set(
                Object.entries(selectedSeeds)
                  .filter(([otherSlot]) => otherSlot !== slot)
                  .map(([, teamId]) => teamId),
              );
              return (
                <label key={slot} className="bk-slot" data-seeded={selectedSeeds[slot] ? "true" : "false"}>
                  <span className="bk-slot__lbl">{slot}</span>
                  <select className="bk-slot__select" value={selectedSeeds[slot] ?? ""} onChange={(event) => onChange(slot, event.target.value)}>
                    <option value="">팀 선택...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id} disabled={usedByOther.has(team.id)}>
                        {team.team.name}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        ))}
      </div>
      <p className="ct-section__sub" style={{ marginTop: 10 }}>
        지정한 시드는 고정되고, 나머지 팀은 빈 슬롯에 랜덤 배정됩니다.
      </p>
    </section>
  );
}

function GroupAssignment({
  config,
  teams,
  groups,
  hasGroups,
}: {
  config: RuleConfig;
  teams: ApprovedTeam[];
  groups: Array<{ group: string; teams: ApprovedTeam[] }>;
  hasGroups: boolean;
}) {
  return (
    <section className="ts-card ts-card--flat">
      <div className="bk-section-row">
        <h4 className="bk-subh">조 편성{config.format === "round_robin" && " · 리그전"}</h4>
        <span className="ct-pill" data-tone={hasGroups ? "ok" : "warn"}>{hasGroups ? "편성됨" : "편성 전"}</span>
      </div>
      {hasGroups ? (
        <div className="bk-groups">
          {groups.map(({ group, teams: groupMembers }) => (
            <div key={group} className="bk-group">
              <div className="bk-group__name">{group}조</div>
              {Array.from({ length: config.group_size }).map((_, index) => {
                const slot = `${group}${index + 1}`;
                const team = groupMembers.find((item) => slotForTeam(item) === slot) ?? groupMembers[index];
                return (
                  <div key={slot} className="bk-slot">
                    <span className="bk-slot__lbl">{slot}</span>
                    <span className="bk-slot__team">{team?.team.name ?? "부전승"}</span>
                  </div>
                );
              })}
              <div className="bk-group__games">
                {config.format === "dual_tournament" ? "더블엘리미 5경기" : `조별 ${roundRobinCount(Math.max(groupMembers.length, 2))}경기`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ct-emptybox">
          <Icon name="git-merge" size={36} color="var(--ink-dim)" />
          <b>아직 조편성 전입니다</b>
          <span>
            참가 {teams.length}팀입니다. 위에서 대회 방식·조 설정을 확인한 뒤 완전 랜덤 추첨 또는 시드 배정을 진행하세요.
          </span>
        </div>
      )}
    </section>
  );
}

function DualPreview({
  config,
  groups,
}: {
  config: RuleConfig;
  groups: Array<{ group: string; teams: ApprovedTeam[] }>;
}) {
  return (
    <section className="ts-card ts-card--flat">
      <h4 className="bk-subh">조별 더블 엘리미네이션 · 1·2경기 → 승자전/패자전 → 조 최종전</h4>
      <div className="bk-groups">
        {groups.map(({ group, teams }) => (
          <div key={group} className="bk-group">
            <div className="bk-group__name">{group}조</div>
            {dualRows(group, config.group_size).map((row) => (
              <div key={row.key} className="bk-dualrow" data-final={row.final ? "true" : "false"}>
                <span className="bk-dualrow__lbl">{row.label}</span>
                <span className="bk-dualrow__vs">
                  <b>{nameBySlot(row.home, teams)}</b>
                  <i>대</i>
                  <b>{nameBySlot(row.away, teams)}</b>
                </span>
              </div>
            ))}
            <div className="bk-group__games">승자전 승자 = 1위 · 최종전 승자 = 2위</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function dualRows(group: string, groupSize: number) {
  return [
    { key: `${group}-1`, label: `${group}조 1경기`, home: `${group}1`, away: `${group}${Math.min(groupSize, 4)}`, final: false },
    { key: `${group}-2`, label: `${group}조 2경기`, home: `${group}2`, away: `${group}3`, final: false },
    { key: `${group}-w`, label: `${group}조 승자전`, home: `${group}조 1경기 승자`, away: `${group}조 2경기 승자`, final: false },
    { key: `${group}-l`, label: `${group}조 패자전`, home: `${group}조 1경기 패자`, away: `${group}조 2경기 패자`, final: false },
    { key: `${group}-f`, label: `${group}조 최종전`, home: `${group}조 승자전 패자`, away: `${group}조 패자전 승자`, final: true },
  ];
}

function nameBySlot(slot: string, teams: ApprovedTeam[]) {
  const team = teams.find((item) => slotForTeam(item) === slot);
  return team?.team.name ?? slot;
}
