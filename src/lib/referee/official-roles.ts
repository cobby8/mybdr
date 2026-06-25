export const OFFICIAL_ROLE_TYPES = ["referee", "game_official"] as const;

export type OfficialRoleType = (typeof OFFICIAL_ROLE_TYPES)[number];

export const LEGACY_GAME_OFFICIAL_ROLE_TYPES = ["scorer", "timer"] as const;

export type LegacyGameOfficialRoleType =
  (typeof LEGACY_GAME_OFFICIAL_ROLE_TYPES)[number];

export const OFFICIAL_ROLE_LABELS: Record<OfficialRoleType, string> = {
  referee: "심판",
  game_official: "경기원",
};

export const GAME_OFFICIAL_CAPABILITY_LABELS = {
  scorekeeping: "기록",
  timekeeping: "계시",
  shot_clock: "24초 계시",
  stats: "통계",
} as const;

export const KBA_REFEREE_CERT_GRADES = ["1급", "2급", "3급"] as const;
export const KBA_GAME_OFFICIAL_CERT_GRADES = ["1급", "2급", "3급"] as const;

export const OFFICIAL_LEVEL_LABELS: Record<string, string> = {
  beginner: "3급",
  intermediate: "2급",
  advanced: "1급",
  international: "FIBA/국제",
};

export const OFFICIAL_LEVEL_OPTIONS = [
  { value: "", label: "선택 안 함" },
  { value: "beginner", label: OFFICIAL_LEVEL_LABELS.beginner },
  { value: "intermediate", label: OFFICIAL_LEVEL_LABELS.intermediate },
  { value: "advanced", label: OFFICIAL_LEVEL_LABELS.advanced },
  { value: "international", label: OFFICIAL_LEVEL_LABELS.international },
] as const;

export function formatOfficialLevel(level: string | null | undefined): string {
  if (!level) return "-";
  return OFFICIAL_LEVEL_LABELS[level] ?? level;
}

export const REFEREE_DISCIPLINE_LABELS = {
  "5x5": "5x5 심판",
  "3x3": "3x3 심판",
} as const;

const ROLE_TYPE_ALIASES: Record<string, OfficialRoleType> = {
  referee: "referee",
  심판: "referee",
  game_official: "game_official",
  경기원: "game_official",
  통계원: "game_official",
  scorer: "game_official",
  기록: "game_official",
  기록원: "game_official",
  timer: "game_official",
  계시: "game_official",
  계시원: "game_official",
  타이머: "game_official",
};

export function normalizeOfficialRoleType(value: string): OfficialRoleType {
  return ROLE_TYPE_ALIASES[value.trim().toLowerCase()] ?? "referee";
}

export function isGameOfficialRoleType(value: string): boolean {
  return normalizeOfficialRoleType(value) === "game_official";
}
