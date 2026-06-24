export type QuarterTypeCode = "4Q" | "HALF";
export type ClockModeCode = "nonstop" | "dead";

export type TournamentGameRules = {
  quarterType: QuarterTypeCode;
  quarterMinutes: number;
  overtimeMinutes: number;
  lastScoreStopMin: number;
  totalQuarters: number;
  clockMode: ClockModeCode;
  foulLimit: number;
  teamFoulBonus: number;
  shotClockEnabled: boolean;
  firstHalfTimeouts: number;
  secondHalfTimeouts: number;
  timeoutDurationSeconds: number;
  shortBreakDurationSeconds: number;
  halftimeDurationSeconds: number;
  overtimeBreakDurationSeconds: number;
  autoIntervalTimerEnabled: boolean;
  homeColor: string;
  awayColor: string;
  vestProvided: boolean;
};

export type GameRulePreset = {
  label: string;
  quarterType: QuarterTypeCode;
  quarterMinutes: number;
  clockMode: ClockModeCode;
  firstHalfTimeouts: number;
  secondHalfTimeouts: number;
};

export const GAME_RULE_DEFAULTS: TournamentGameRules = {
  quarterType: "4Q",
  quarterMinutes: 10,
  overtimeMinutes: 5,
  lastScoreStopMin: 2,
  totalQuarters: 4,
  clockMode: "dead",
  foulLimit: 5,
  teamFoulBonus: 5,
  shotClockEnabled: true,
  firstHalfTimeouts: 2,
  secondHalfTimeouts: 3,
  timeoutDurationSeconds: 30,
  shortBreakDurationSeconds: 120,
  halftimeDurationSeconds: 300,
  overtimeBreakDurationSeconds: 120,
  autoIntervalTimerEnabled: true,
  homeColor: "#E31B23",
  awayColor: "#0F5FCC",
  vestProvided: false,
};

export const GAME_RULE_PRESETS: readonly GameRulePreset[] = [
  { label: "7분 4쿼터 · 논스톱", quarterType: "4Q", quarterMinutes: 7, clockMode: "nonstop", firstHalfTimeouts: 1, secondHalfTimeouts: 2 },
  { label: "7분 4쿼터 · 올데드", quarterType: "4Q", quarterMinutes: 7, clockMode: "dead", firstHalfTimeouts: 2, secondHalfTimeouts: 3 },
  { label: "6분 4쿼터 · 논스톱", quarterType: "4Q", quarterMinutes: 6, clockMode: "nonstop", firstHalfTimeouts: 1, secondHalfTimeouts: 1 },
  { label: "6분 4쿼터 · 올데드", quarterType: "4Q", quarterMinutes: 6, clockMode: "dead", firstHalfTimeouts: 1, secondHalfTimeouts: 2 },
  { label: "10분 4쿼터 · 논스톱", quarterType: "4Q", quarterMinutes: 10, clockMode: "nonstop", firstHalfTimeouts: 2, secondHalfTimeouts: 3 },
  { label: "10분 4쿼터 · 올데드", quarterType: "4Q", quarterMinutes: 10, clockMode: "dead", firstHalfTimeouts: 2, secondHalfTimeouts: 3 },
  { label: "10분 전후반 · 논스톱", quarterType: "HALF", quarterMinutes: 10, clockMode: "nonstop", firstHalfTimeouts: 1, secondHalfTimeouts: 1 },
  { label: "10분 전후반 · 올데드", quarterType: "HALF", quarterMinutes: 10, clockMode: "dead", firstHalfTimeouts: 1, secondHalfTimeouts: 2 },
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return asRecord(parsed);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function pickString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function pickNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function pickBoolean(source: Record<string, unknown>, key: string): boolean | undefined {
  const value = source[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return undefined;
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number) {
  if (value === undefined) return fallback;
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return fallback;
  return rounded;
}

function normalizeHex(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(withHash)
    ? withHash.toUpperCase()
    : fallback;
}

function normalizeQuarterType(source: Record<string, unknown>): QuarterTypeCode {
  const raw = pickString(source, "quarterType");
  if (raw === "HALF") return "HALF";
  if (raw === "4Q") return "4Q";
  return pickNumber(source, "totalQuarters") === 2 ? "HALF" : GAME_RULE_DEFAULTS.quarterType;
}

function normalizeClockMode(source: Record<string, unknown>): ClockModeCode {
  const raw = pickString(source, "clockMode")?.trim().toLowerCase();
  if (raw === "nonstop") return "nonstop";
  if (raw === "dead" || raw === "all_dead" || raw === "alldead") return "dead";
  return GAME_RULE_DEFAULTS.clockMode;
}

function intervalPreset(
  quarterType: QuarterTypeCode,
  quarterMinutes: number,
  clockMode: ClockModeCode,
) {
  if (quarterType !== "4Q") {
    return {
      shortBreakDurationSeconds: GAME_RULE_DEFAULTS.shortBreakDurationSeconds,
      halftimeDurationSeconds: GAME_RULE_DEFAULTS.halftimeDurationSeconds,
      overtimeBreakDurationSeconds: GAME_RULE_DEFAULTS.overtimeBreakDurationSeconds,
      autoIntervalTimerEnabled: GAME_RULE_DEFAULTS.autoIntervalTimerEnabled,
    };
  }
  if (quarterMinutes === 10 && clockMode === "dead") {
    return {
      shortBreakDurationSeconds: 120,
      halftimeDurationSeconds: 300,
      overtimeBreakDurationSeconds: 120,
      autoIntervalTimerEnabled: true,
    };
  }
  if (quarterMinutes === 6 || quarterMinutes === 7 || (quarterMinutes === 10 && clockMode === "nonstop")) {
    return {
      shortBreakDurationSeconds: 60,
      halftimeDurationSeconds: 180,
      overtimeBreakDurationSeconds: 120,
      autoIntervalTimerEnabled: true,
    };
  }
  return {
    shortBreakDurationSeconds: GAME_RULE_DEFAULTS.shortBreakDurationSeconds,
    halftimeDurationSeconds: GAME_RULE_DEFAULTS.halftimeDurationSeconds,
    overtimeBreakDurationSeconds: GAME_RULE_DEFAULTS.overtimeBreakDurationSeconds,
    autoIntervalTimerEnabled: GAME_RULE_DEFAULTS.autoIntervalTimerEnabled,
  };
}

export function applyGameRulePreset(
  current: TournamentGameRules,
  preset: GameRulePreset,
): TournamentGameRules {
  const interval = intervalPreset(preset.quarterType, preset.quarterMinutes, preset.clockMode);
  return {
    ...current,
    quarterType: preset.quarterType,
    quarterMinutes: preset.quarterMinutes,
    totalQuarters: preset.quarterType === "HALF" ? 2 : 4,
    clockMode: preset.clockMode,
    firstHalfTimeouts: preset.firstHalfTimeouts,
    secondHalfTimeouts: preset.secondHalfTimeouts,
    ...interval,
  };
}

export function normalizeGameRules(input?: unknown): TournamentGameRules {
  const source = asRecord(input);
  const quarterType = normalizeQuarterType(source);
  const clockMode = normalizeClockMode(source);
  const quarterMinutes = clampInt(
    pickNumber(source, "quarterMinutes"),
    GAME_RULE_DEFAULTS.quarterMinutes,
    1,
    20,
  );
  const interval = intervalPreset(quarterType, quarterMinutes, clockMode);

  return {
    quarterType,
    quarterMinutes,
    overtimeMinutes: clampInt(pickNumber(source, "overtimeMinutes"), GAME_RULE_DEFAULTS.overtimeMinutes, 1, 20),
    lastScoreStopMin: clampInt(pickNumber(source, "lastScoreStopMin"), GAME_RULE_DEFAULTS.lastScoreStopMin, 0, 2),
    totalQuarters: quarterType === "HALF" ? 2 : 4,
    clockMode,
    foulLimit: clampInt(pickNumber(source, "foulLimit"), GAME_RULE_DEFAULTS.foulLimit, 4, 6),
    teamFoulBonus: clampInt(pickNumber(source, "teamFoulBonus"), GAME_RULE_DEFAULTS.teamFoulBonus, 3, 7),
    shotClockEnabled:
      pickBoolean(source, "shotClockEnabled") ??
      pickBoolean(source, "shotClock") ??
      GAME_RULE_DEFAULTS.shotClockEnabled,
    firstHalfTimeouts: clampInt(
      pickNumber(source, "firstHalfTimeouts"),
      GAME_RULE_DEFAULTS.firstHalfTimeouts,
      0,
      4,
    ),
    secondHalfTimeouts: clampInt(
      pickNumber(source, "secondHalfTimeouts"),
      GAME_RULE_DEFAULTS.secondHalfTimeouts,
      0,
      4,
    ),
    timeoutDurationSeconds: clampInt(
      pickNumber(source, "timeoutDurationSeconds") ?? pickNumber(source, "timeoutDuration"),
      GAME_RULE_DEFAULTS.timeoutDurationSeconds,
      30,
      90,
    ),
    shortBreakDurationSeconds: clampInt(
      pickNumber(source, "shortBreakDurationSeconds"),
      interval.shortBreakDurationSeconds,
      0,
      1800,
    ),
    halftimeDurationSeconds: clampInt(
      pickNumber(source, "halftimeDurationSeconds"),
      interval.halftimeDurationSeconds,
      0,
      1800,
    ),
    overtimeBreakDurationSeconds: clampInt(
      pickNumber(source, "overtimeBreakDurationSeconds"),
      interval.overtimeBreakDurationSeconds,
      0,
      1800,
    ),
    autoIntervalTimerEnabled:
      pickBoolean(source, "autoIntervalTimerEnabled") ?? interval.autoIntervalTimerEnabled,
    homeColor: normalizeHex(source.homeColor, GAME_RULE_DEFAULTS.homeColor),
    awayColor: normalizeHex(source.awayColor, GAME_RULE_DEFAULTS.awayColor),
    vestProvided: pickBoolean(source, "vestProvided") ?? GAME_RULE_DEFAULTS.vestProvided,
  };
}

export function toGameRulesResponse(input?: unknown) {
  const rules = normalizeGameRules(input);
  return {
    game_rules: rules,
    game_rules_json: JSON.stringify(rules),
    quarter_minutes: rules.quarterMinutes,
    total_quarters: rules.totalQuarters,
    first_half_timeouts: rules.firstHalfTimeouts,
    second_half_timeouts: rules.secondHalfTimeouts,
  };
}
