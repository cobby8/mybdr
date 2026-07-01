export const NBA_NEWS_PLATFORMS = [
  "x",
  "rss",
  "web",
  "official_site",
  "manual",
] as const;

export type NbaNewsPlatform = (typeof NBA_NEWS_PLATFORMS)[number];

export const NBA_NEWS_SOURCE_TYPES = [
  "official_league",
  "official_team",
  "tier_1_insider",
  "tier_2_insider",
  "team_beat",
  "analyst",
  "media_account",
  "rumor_watch",
  "legacy",
] as const;

export type NbaNewsSourceType = (typeof NBA_NEWS_SOURCE_TYPES)[number];

export const NBA_NEWS_TIERS = ["T0", "T1", "T2", "T3", "T4", "T5", "legacy"] as const;

export type NbaNewsTier = (typeof NBA_NEWS_TIERS)[number];

export const NBA_NEWS_USAGE_POLICIES = [
  "official_confirmation",
  "single_source_draft_admin_approval",
  "cross_check_required",
  "background_context_only",
  "queue_only_no_publish",
  "inactive_reference_only",
] as const;

export type NbaNewsUsagePolicy = (typeof NBA_NEWS_USAGE_POLICIES)[number];

export const NBA_NEWS_VERIFY_STATUSES = [
  "needs_manual_check",
  "verified",
  "stale",
  "rejected",
] as const;

export type NbaNewsSourceVerifyStatus = (typeof NBA_NEWS_VERIFY_STATUSES)[number];

export const NBA_NEWS_VERIFICATION_STATUSES = [
  "official",
  "confirmed_multiple",
  "reported_single",
  "developing",
  "rumor",
  "analysis",
] as const;

export type NbaNewsVerificationStatus =
  (typeof NBA_NEWS_VERIFICATION_STATUSES)[number];

export const NBA_NEWS_EDITORIAL_STATUSES = [
  "draft",
  "needs_review",
  "ready",
  "published",
  "rejected",
  "superseded",
  "queue_only",
] as const;

export type NbaNewsEditorialStatus = (typeof NBA_NEWS_EDITORIAL_STATUSES)[number];

export const NBA_NEWS_EVENT_TYPES = [
  "trade",
  "signing",
  "injury",
  "waiver",
  "draft",
  "quote",
  "discipline",
  "analysis",
  "game",
  "league",
] as const;

export type NbaNewsEventType = (typeof NBA_NEWS_EVENT_TYPES)[number];

export const NBA_NEWS_EVENT_RISKS = ["low", "medium", "high"] as const;

export type NbaNewsEventRisk = (typeof NBA_NEWS_EVENT_RISKS)[number];

export const NBA_NEWS_DEFAULT_TRUST_SCORE_BY_TIER: Record<NbaNewsTier, number> = {
  T0: 95,
  T1: 88,
  T2: 78,
  T3: 68,
  T4: 58,
  T5: 25,
  legacy: 0,
};

export type NbaNewsPrimaryTopic = NbaNewsEventType | "free_agency" | "salary_cap";

export interface NbaNewsSource {
  displayName: string;
  platform: NbaNewsPlatform;
  sourceType: NbaNewsSourceType;
  tier: NbaNewsTier;
  trustScore: number;
  handle?: string | null;
  sourceUrl?: string | null;
  teamCode?: string | null;
  primaryTopics: NbaNewsPrimaryTopic[];
  usagePolicy: NbaNewsUsagePolicy;
  isActive: boolean;
  isPublishEligible: boolean;
  verifyStatus: NbaNewsSourceVerifyStatus;
  verifiedAt?: string | null;
  notes?: string | null;
}

export interface NbaSourcePost {
  sourceId: string;
  platform: NbaNewsPlatform;
  externalId: string;
  externalUrl: string;
  postedAt: string;
  capturedAt: string;
  textExcerpt?: string | null;
  aiSummary?: string | null;
  rawMeta?: Record<string, unknown>;
}

export interface NbaNewsEventSource {
  sourcePostId: string;
  role: "primary" | "corroborating" | "official" | "background";
}

export interface NbaNewsEvent {
  id?: string;
  eventType: NbaNewsEventType;
  eventRisk: NbaNewsEventRisk;
  subjectTeamCode?: string | null;
  subjectPlayerName?: string | null;
  normalizedTitle: string;
  verificationStatus: NbaNewsVerificationStatus;
  confidenceScore: number;
  firstSeenAt: string;
  lastSeenAt: string;
  sources: NbaNewsEventSource[];
}

export interface NbaNewsArticleDraft {
  eventId: string;
  title: string;
  lead?: string | null;
  body: string;
  sourceNote?: string | null;
  uncertaintyNote?: string | null;
  verificationStatus: NbaNewsVerificationStatus;
  editorialStatus: NbaNewsEditorialStatus;
  aiModel?: string | null;
  aiPromptVersion?: string | null;
  qualityScore?: number | null;
}

export interface NbaTrustScoreInput {
  sourceTierScore: number;
  independenceScore: number;
  officialityScore: number;
  specificityScore: number;
  riskPenalty: number;
}

export interface NbaTrustScoreResult {
  score: number;
  verificationStatus: NbaNewsVerificationStatus;
  editorialStatus: NbaNewsEditorialStatus;
}
