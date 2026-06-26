export type PublicSection =
  | "overview"
  | "teams"
  | "schedule"
  | "bracket"
  | "results"
  | "registration";

export type PublicVisibility = "show" | "partial" | "prep" | "hide";

export type PublicVisibilityState =
  | "before"
  | "reg"
  | "drawn"
  | "published"
  | "live"
  | "ended";

export type PublicVisibilityInput = {
  sitePublished?: boolean | null;
  status?: string | null;
  approvedTeamCount?: number | null;
  matchCount?: number | null;
  scheduledMatchCount?: number | null;
  bracketMatchCount?: number | null;
  completedMatchCount?: number | null;
  liveMatchCount?: number | null;
};

export type PublicVisibilityResult = {
  state: PublicVisibilityState;
  sections: Record<PublicSection, PublicVisibility>;
};

const BEFORE_STATUSES = new Set(["draft", "upcoming", "opening_soon", "preopen", "final"]);
const REG_STATUSES = new Set([
  "registration",
  "registration_open",
  "active",
  "published",
  "open",
  "registration_closed",
]);
const LIVE_STATUSES = new Set(["in_progress", "live", "ongoing", "group_stage"]);
const ENDED_STATUSES = new Set(["completed", "ended", "closed", "cancelled"]);

const EMPTY_SECTIONS: Record<PublicSection, PublicVisibility> = {
  overview: "hide",
  teams: "hide",
  schedule: "hide",
  bracket: "hide",
  results: "hide",
  registration: "hide",
};

const SECTION_MATRIX: Record<PublicVisibilityState, Record<PublicSection, PublicVisibility>> = {
  before: {
    overview: "show",
    teams: "hide",
    schedule: "prep",
    bracket: "hide",
    results: "hide",
    registration: "show",
  },
  reg: {
    overview: "show",
    teams: "partial",
    schedule: "prep",
    bracket: "hide",
    results: "hide",
    registration: "show",
  },
  drawn: {
    overview: "show",
    teams: "show",
    schedule: "prep",
    bracket: "prep",
    results: "hide",
    registration: "show",
  },
  published: {
    overview: "show",
    teams: "show",
    schedule: "show",
    bracket: "show",
    results: "hide",
    registration: "show",
  },
  live: {
    overview: "show",
    teams: "show",
    schedule: "show",
    bracket: "show",
    results: "partial",
    registration: "show",
  },
  ended: {
    overview: "show",
    teams: "show",
    schedule: "show",
    bracket: "show",
    results: "show",
    registration: "show",
  },
};

function count(value: number | null | undefined): number {
  return Math.max(0, value ?? 0);
}

function stateFromStatus(status: string | null | undefined): PublicVisibilityState {
  const normalized = (status ?? "").toLowerCase();
  if (ENDED_STATUSES.has(normalized)) return "ended";
  if (LIVE_STATUSES.has(normalized)) return "live";
  if (REG_STATUSES.has(normalized)) return "reg";
  if (BEFORE_STATUSES.has(normalized)) return "before";
  return "before";
}

export function derivePublicVisibility(input: PublicVisibilityInput): PublicVisibilityResult {
  if (input.sitePublished === false) {
    return { state: "before", sections: EMPTY_SECTIONS };
  }

  const approvedTeamCount = count(input.approvedTeamCount);
  const matchCount = count(input.matchCount);
  const scheduledMatchCount = count(input.scheduledMatchCount);
  const bracketMatchCount = count(input.bracketMatchCount);
  const completedMatchCount = count(input.completedMatchCount);
  const liveMatchCount = count(input.liveMatchCount);

  let state = stateFromStatus(input.status);

  if (state !== "ended" && completedMatchCount > 0) {
    state = matchCount > 0 && completedMatchCount >= matchCount ? "ended" : "live";
  }

  if (state === "before" && approvedTeamCount > 0) {
    state = "reg";
  }

  if (state === "reg" && approvedTeamCount > 0 && (matchCount > 0 || bracketMatchCount > 0)) {
    state = "drawn";
  }

  if (state !== "ended" && state !== "live" && scheduledMatchCount > 0) {
    state = "published";
  }

  if (state === "published" && liveMatchCount > 0) {
    state = "live";
  }

  return { state, sections: SECTION_MATRIX[state] };
}

export function exposesPublicSection(
  visibility: PublicVisibilityResult,
  section: PublicSection,
): boolean {
  const value = visibility.sections[section];
  return value === "show" || value === "partial";
}

export function preparesPublicSection(
  visibility: PublicVisibilityResult,
  section: PublicSection,
): boolean {
  return visibility.sections[section] === "prep";
}
