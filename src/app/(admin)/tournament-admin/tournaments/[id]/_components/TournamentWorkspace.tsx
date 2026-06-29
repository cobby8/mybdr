"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import type { SetupProgress } from "@/lib/tournaments/setup-status";
import {
  getGameRuleClockModeLabel,
  getGameRuleStructureLabel,
} from "@/lib/tournaments/game-rules";
import { Icon } from "@/components/admin-toss";
import { ImageUploader } from "@/components/shared/image-uploader";
import { SetupChecklist } from "./SetupChecklist";
import {
  ScheduleVenue,
  allCourts,
  ctUid,
  serializeVenue,
  venueFromDraft,
  type DateRow,
  type Venue,
  type VenueDraft,
} from "../../new/wizard/_components/ct-schedule-venue";
import { CtGameSettings, type GameRules } from "../../new/wizard/_components/ct-game-settings";

export type StatusTone = "ok" | "warn" | "info" | "mute" | "err";
type SectionId = "info" | "schedule" | "divisions" | "game" | "publish";
type PanelId = "teams" | "divisions" | "bracket" | "matches" | "recorders" | "admins" | "site";

export type MatchStats = {
  total: number;
  paper: number;
  flutter: number;
  manual: number;
  inProgress: number;
};

export type SetupFormState = {
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venue_name: string;
  venue_address: string;
  maxTeams: number;
  team_size: number;
  roster_min: number;
  roster_max: number;
  entry_fee: number;
  allow_waiting_list: boolean;
  waiting_list_cap: number | null;
  auto_approve_teams: boolean;
  registration_start_at: string;
  registration_end_at: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  fee_notes: string;
  organizer: string;
  host: string;
  sponsors: SponsorDraft[];
  gender: string;
  game_time: string;
  game_ball: string;
  game_method: string;
  game_rules: GameRules;
  rules: string;
  prize_info: string;
  description: string;
  logo_url: string;
  banner_url: string;
  places: Venue[];
  schedule_dates: DateRow[];
};

export type SponsorDraft = {
  id: string;
  name: string;
  logoUrl: string;
};

export type TournamentWorkspaceProps = {
  tournamentId: string;
  progress: SetupProgress;
  publishGate: { ok: boolean; missing: string[] };
  matchStats: MatchStats;
  defaultRecordingMode: RecordingMode;
  setup: SetupFormState;
  summary: {
    statusLabel: string;
    statusTone: StatusTone;
    teamCount: number;
    maxTeams: number | null;
    matchCount: number;
    divisionCount: number;
    siteConfigured: boolean;
    sitePublished: boolean;
    siteSubdomain: string | null;
  };
};

type PanelComponent = ComponentType<object>;

const TeamsPanel = dynamic(() => import("../_panels/teams-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const DivisionsPanel = dynamic(() => import("../_panels/divisions-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const BracketPanel = dynamic(() => import("../_panels/bracket-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const RecordersPanel = dynamic(() => import("../_panels/recorders-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const AdminsPanel = dynamic(() => import("../_panels/admins-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const SitePanel = dynamic(() => import("../_panels/site-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const MatchesPanel = dynamic(() => import("../_panels/matches-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
});

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "info", label: "대회 정보" },
  { id: "schedule", label: "일정·장소" },
  { id: "divisions", label: "종별·디비전" },
  { id: "game", label: "경기 설정" },
  { id: "publish", label: "접수·공개" },
];

// PR-3 3-D §정합: 정본 workspace.jsx mode=edit 스텝 헤더 per-step 아이콘(고정 trophy → 단계별). lucide kebab.
const SECTION_ICONS: Record<SectionId, string> = {
  info: "info",
  schedule: "calendar-days",
  divisions: "layout-grid",
  game: "sliders-horizontal",
  publish: "globe",
};

const LEGACY_SECTION_MAP: Record<string, SectionId> = {
  setup: "info",
  teams: "publish",
  structure: "divisions",
  bracket: "divisions",
  matches: "game",
  staff: "game",
  recorders: "game",
  admins: "game",
  site: "publish",
};

const HASH_PANEL_MAP: Record<string, PanelId> = {
  teams: "teams",
  divisions: "divisions",
  structure: "divisions",
  bracket: "bracket",
  matches: "matches",
  recorders: "recorders",
  admins: "admins",
  site: "site",
};

const RECORDING_MODE_LABEL: Record<RecordingMode, string> = {
  flutter: "기록앱",
  paper: "전자기록지",
  manual: "수기",
};

function isFormDirty(form: SetupFormState, baseline: SetupFormState) {
  return (Object.keys(form) as Array<keyof SetupFormState>).some(
    (key) => form[key] !== baseline[key],
  );
}

function getScrollOffset() {
  if (typeof window === "undefined") return 96;
  return window.matchMedia("(max-width: 1023px)").matches ? 118 : 96;
}

function cleanSponsors(sponsors: SponsorDraft[]) {
  return sponsors
    .map((s) => ({ ...s, name: s.name.trim(), logoUrl: s.logoUrl.trim() }))
    .filter((s) => s.name);
}

function positiveInt(value: number | null | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

function nonNegativeNumber(value: number | null | undefined, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function FormGroupTitle({ title, flush = false }: { title: string; flush?: boolean }) {
  return (
    <div
      className={[
        "col-span-full border-t pt-3",
        flush ? "mt-0 border-t-0 pt-0" : "mt-1",
      ].join(" ")}
      style={{ borderColor: "var(--color-border)" }}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{title}</p>
    </div>
  );
}

export function TournamentWorkspace({
  tournamentId,
  progress,
  publishGate,
  matchStats,
  defaultRecordingMode,
  setup,
  summary,
}: TournamentWorkspaceProps) {
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("info");
  const [openPanels, setOpenPanels] = useState<Set<PanelId>>(new Set());
  const [form, setForm] = useState(setup);
  const [lastSavedForm, setLastSavedForm] = useState(setup);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const siteUrl = summary.siteSubdomain ? `https://${summary.siteSubdomain}.mybdr.kr` : null;
  const courts = useMemo(() => allCourts(form.places), [form.places]);
  const dirty = useMemo(() => isFormDirty(form, lastSavedForm), [form, lastSavedForm]);
  const visibleOpenPanels = useMemo(() => {
    const next = new Set(openPanels);
    if (active === "divisions") next.add("divisions");
    return next;
  }, [active, openPanels]);
  const urgentCount =
    publishGate.missing.length +
    (summary.teamCount === 0 ? 1 : 0) +
    (summary.divisionCount === 0 ? 1 : 0) +
    (summary.matchCount === 0 ? 1 : 0);

  useEffect(() => {
    const rawHash = window.location.hash.replace("#", "");
    const hash = (LEGACY_SECTION_MAP[rawHash] ?? rawHash) as SectionId;
    const panel = HASH_PANEL_MAP[rawHash];
    if (panel) {
      setOpenPanels((current) => {
        const next = new Set(current);
        next.add(panel);
        return next;
      });
    }
    if (SECTIONS.some((section) => section.id === hash)) {
      moveTo(hash, "auto");
    }
  }, []);

  useEffect(() => {
    const defaultPanel: PanelId | null =
      active === "divisions"
        ? "divisions"
        : active === "game"
          ? "matches"
          : active === "publish"
            ? "teams"
            : null;
    if (!defaultPanel) return;

    setOpenPanels((current) => {
      if (current.has(defaultPanel)) return current;
      const next = new Set(current);
      next.add(defaultPanel);
      return next;
    });
  }, [active]);

  function moveTo(id: SectionId, behavior: ScrollBehavior = "smooth") {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    const target = document.getElementById(id);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top: Math.max(top, 0), behavior });
  }

  function openPanelAndMove(id: SectionId, panel?: PanelId) {
    if (panel) {
      setOpenPanels((current) => {
        const next = new Set(current);
        next.add(panel);
        return next;
      });
    }
    moveTo(id);
  }

  function togglePanel(id: PanelId) {
    setOpenPanels((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function patchForm<K extends keyof SetupFormState>(key: K, value: SetupFormState[K]) {
    setSaveState("idle");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setSponsors(next: SponsorDraft[]) {
    patchForm("sponsors", next);
  }

  function addVenue(draft: VenueDraft) {
    const venue = venueFromDraft(draft);
    if (!venue.name) return;
    if (form.places.some((item) => item.name === venue.name || (venue.placeId && item.placeId === venue.placeId))) {
      setMessage("이미 등록된 장소입니다.");
      setSaveState("error");
      return;
    }
    patchForm("places", [
      ...form.places,
      venue,
    ]);
  }

  function updateVenue(id: string, patch: Partial<Venue>) {
    patchForm(
      "places",
      form.places.map((venue) => (venue.id === id ? { ...venue, ...patch } : venue)),
    );
  }

  function removeVenue(id: string) {
    const nextPlaces = form.places.filter((venue) => venue.id !== id);
    const removedCourtPrefix = `${id}_c`;
    patchForm("places", nextPlaces);
    patchForm(
      "schedule_dates",
      form.schedule_dates.map((date) => ({
        ...date,
        courtIds: date.courtIds.filter((courtId) => !courtId.startsWith(removedCourtPrefix)),
      })),
    );
  }

  function syncDates(dateStrings: string[]) {
    const sorted = [...dateStrings].sort();
    const nextDates = sorted.map(
        (date) =>
          form.schedule_dates.find((item) => item.date === date) ?? {
            id: ctUid("dt"),
            date,
            courtIds: [],
          },
      );
    setSaveState("idle");
    setForm((current) => ({
      ...current,
      schedule_dates: nextDates,
      startDate: sorted[0] ?? "",
      endDate: sorted[sorted.length - 1] ?? "",
    }));
  }

  function removeDate(id: string) {
    const nextDates = form.schedule_dates.filter((date) => date.id !== id);
    const sorted = nextDates.map((date) => date.date).filter(Boolean).sort();
    setSaveState("idle");
    setForm((current) => ({
      ...current,
      schedule_dates: nextDates,
      startDate: sorted[0] ?? "",
      endDate: sorted[sorted.length - 1] ?? "",
    }));
  }

  function toggleDateCourt(dateId: string, courtId: string) {
    patchForm(
      "schedule_dates",
      form.schedule_dates.map((date) =>
        date.id === dateId
          ? {
              ...date,
              courtIds: date.courtIds.includes(courtId)
                ? date.courtIds.filter((id) => id !== courtId)
                : [...date.courtIds, courtId],
            }
          : date,
      ),
    );
  }

  async function saveSetup() {
    setSaving(true);
    setMessage("");
    setSaveState("idle");

    const sponsors = cleanSponsors(form.sponsors);
    const sponsorLogos = sponsors
      .filter((s) => s.logoUrl)
      .map((s) => ({ name: s.name, logoUrl: s.logoUrl }));
    const places = form.places
      .map(serializeVenue)
      .filter((place) => place.name);
    const scheduleDates = form.schedule_dates
      .map((date) => ({
        id: date.id,
        date: date.date,
        court_ids: date.courtIds,
      }))
      .filter((date) => date.date);
    const primaryVenue = places[0] ?? null;
    const venueName = primaryVenue ? primaryVenue.name : null;
    const venueAddress = primaryVenue ? primaryVenue.region || null : null;
    const teamSize = positiveInt(form.team_size, 5);
    const rosterMin = positiveInt(form.roster_min, 5);
    const rosterMax = positiveInt(form.roster_max, 12);
    const waitingListCap = form.allow_waiting_list
      ? positiveInt(form.waiting_list_cap, 0) || null
      : null;

    if (rosterMin > rosterMax) {
      setSaving(false);
      setSaveState("error");
      setMessage("최소 로스터 수는 최대 로스터 수보다 클 수 없습니다.");
      return;
    }

    const gameRuleStructure = getGameRuleStructureLabel(form.game_rules);
    const gameRuleClockMode = getGameRuleClockModeLabel(form.game_rules.clockMode);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      venue_name: venueName,
      venue_address: venueAddress,
      maxTeams: Number(form.maxTeams) > 0 ? Number(form.maxTeams) : undefined,
      team_size: teamSize,
      roster_min: rosterMin,
      roster_max: rosterMax,
      entry_fee: nonNegativeNumber(form.entry_fee),
      allow_waiting_list: form.allow_waiting_list,
      waiting_list_cap: waitingListCap,
      auto_approve_teams: form.auto_approve_teams,
      registration_start_at: form.registration_start_at || null,
      registration_end_at: form.registration_end_at || null,
      bank_name: form.bank_name.trim() || null,
      bank_account: form.bank_account.trim() || null,
      bank_holder: form.bank_holder.trim() || null,
      fee_notes: form.fee_notes.trim() || null,
      organizer: form.organizer.trim() || null,
      host: form.host.trim() || null,
      // 후원사 → 배열 `[{id,name}]`(DB sponsors Json 컬럼 정합 — 구 콤마 문자열에서 전환).
      //   로고URL 은 위 sponsorLogos(settings.sponsor_logos)로 별도 보존(읽기 경로 무변경).
      sponsors: sponsors.map((s) => ({ id: s.id, name: s.name })),
      gender: form.gender.trim() || null,
      game_time: gameRuleStructure,
      game_ball: form.game_ball.trim() || null,
      game_method: gameRuleClockMode,
      game_rules: form.game_rules,
      rules: form.rules.trim() || null,
      prize_info: form.prize_info.trim() || null,
      description: form.description.trim() || null,
      logo_url: form.logo_url.trim() || null,
      banner_url: form.banner_url.trim() || null,
      places,
      schedule_dates: scheduleDates,
      settings: { sponsor_logos: sponsorLogos },
    };

    try {
      const res = await fetch(`/api/web/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
      setSaveState("saved");
      setMessage("저장 완료");
      setLastSavedForm(form);
      router.refresh();
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const activeIndex = Math.max(0, SECTIONS.findIndex((section) => section.id === active));
  const stateMessage = saving
    ? "저장 중입니다"
    : dirty
      ? "변경사항이 있습니다"
      : saveState === "saved"
        ? "저장되었습니다"
        : message || "변경사항 없음";

  return (
    <div data-skin="toss" className="tw-shell" data-step={active}>
      <div className="ts-ph">
        <div className="ts-ph__row">
          <div className="min-w-0">
            <div className="ts-ph__eyebrow">대회 수정 · v2.41 Toss</div>
            <h1 className="ts-ph__title">{form.name || setup.name}</h1>
            <div className="tw-badges">
              <span className="ct-pill" data-tone={summary.statusTone}>{summary.statusLabel}</span>
              <span className="ct-pill" data-tone={summary.sitePublished ? "ok" : "mute"}>
                {summary.sitePublished ? "공개 중" : "비공개"}
              </span>
              <span className="ct-pill" data-tone={publishGate.ok ? "ok" : "warn"}>
                {publishGate.ok ? "공개 가능" : `필수 ${publishGate.missing.length}개 남음`}
              </span>
              <span className="ct-pill" data-tone="info">
                참가 {summary.teamCount}{summary.maxTeams ? ` / ${summary.maxTeams}` : ""}
              </span>
              <span className="ct-pill" data-tone="mute">{summary.divisionCount}종별 · {summary.matchCount}경기</span>
            </div>
          </div>
          <button type="button" className="ts-btn ts-btn--secondary ts-btn--sm" onClick={() => router.push("/tournament-admin/tournaments")}>
            목록으로
          </button>
        </div>
      </div>

      <SectionNav active={active} onMove={moveTo} />
      <div className="ct-progress">
        <div className="ct-progress__fill" style={{ width: `${((activeIndex + 1) / SECTIONS.length) * 100}%` }} />
      </div>

      <div className="tw-body">
        <div className="ct-col space-y-3">
      <WorkspaceSection
        id="info"
        title="대회 정보"
        subtitle="기본 정보와 일정·장소를 함께 수정합니다."
      >
        <div className="grid gap-4">
          <div className="tw-name-block grid grid-cols-2 gap-3">
            <FormGroupTitle title="대회 정보" flush />
            <Field label="대회 이름" className="col-span-2">
              <input className="ts-input" value={form.name} onChange={(e) => patchForm("name", e.target.value)} />
            </Field>
          </div>
          <div className="tw-info-fields grid grid-cols-2 content-start gap-3 self-start">
              <Field label="주최">
                <input className="ts-input" value={form.organizer} onChange={(e) => patchForm("organizer", e.target.value)} />
              </Field>
              <Field label="주관">
                <input className="ts-input" value={form.host} onChange={(e) => patchForm("host", e.target.value)} />
              </Field>
              <div className="col-span-2">
                <SponsorEditor sponsors={form.sponsors} setSponsors={setSponsors} />
              </div>
          </div>
          <div className="tw-description-block">
            <FormGroupTitle title="소개" />
            <Field label="대회 소개">
              <textarea
                className="ts-input min-h-24 resize-y"
                value={form.description}
                onChange={(e) => patchForm("description", e.target.value)}
                placeholder="대회 소개"
              />
            </Field>
          </div>
          <details
            className="tw-media-block border-t pt-3"
            style={{ borderColor: "var(--color-border)" }}
          >
            <summary className="min-h-[44px] cursor-pointer py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              대표 이미지 관리
            </summary>
            <div className="grid gap-3 md:grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)]">
              <ImageUploader
                value={form.logo_url}
                onChange={(url) => patchForm("logo_url", url)}
                bucket="tournament-images"
                path={`tournaments/${tournamentId}/logo`}
                label="대회 로고"
                aspectRatio="1/1"
                maxSizeMB={5}
              />
              <ImageUploader
                value={form.banner_url}
                onChange={(url) => patchForm("banner_url", url)}
                bucket="tournament-images"
                path={`tournaments/${tournamentId}/banner`}
                label="포스터/배너"
                aspectRatio="16/9"
                maxSizeMB={5}
              />
            </div>
          </details>
        </div>
      </WorkspaceSection>

      <WorkspaceSection
        id="schedule"
        title="일정·장소"
        subtitle="대회 일정과 경기장을 관리합니다."
      >
        <ScheduleVenue
          embedded
          dates={form.schedule_dates}
          venues={form.places}
          courts={courts}
          syncDates={syncDates}
          removeDate={removeDate}
          addVenue={addVenue}
          updateVenue={updateVenue}
          removeVenue={removeVenue}
          toggleDateCourt={toggleDateCourt}
        />
      </WorkspaceSection>

      <WorkspaceSection
        id="game"
        title="경기 설정"
        subtitle="경기 규칙과 기록을 관리합니다."
      >
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <ReadOnlyMetric label="시간 구성" value={getGameRuleStructureLabel(form.game_rules)} />
          <Field label="사용구">
            <input className="ts-input" value={form.game_ball} onChange={(e) => patchForm("game_ball", e.target.value)} />
          </Field>
          <ReadOnlyMetric label="운영 방식" value={getGameRuleClockModeLabel(form.game_rules.clockMode)} />
        </div>
        <div className="mb-3">
          <CtGameSettings value={form.game_rules} onChange={(next) => patchForm("game_rules", next)} />
        </div>
        <div className="mb-3 grid gap-3">
          <FormGroupTitle title="운영 안내" flush />
          <Field label="대회 규칙">
            <textarea
              className="ts-input min-h-24 resize-y"
              value={form.rules}
              onChange={(e) => patchForm("rules", e.target.value)}
              placeholder="대회 규칙"
            />
          </Field>
          <Field label="상금/시상 안내">
            <textarea
              className="ts-input min-h-20 resize-y"
              value={form.prize_info}
              onChange={(e) => patchForm("prize_info", e.target.value)}
              placeholder="상금 또는 시상 안내"
            />
          </Field>
        </div>
        <PanelSummary
          stats={[
            ["전체 경기", `${matchStats.total}`],
            ["기록 방식", RECORDING_MODE_LABEL[defaultRecordingMode]],
            ["기록앱", `${matchStats.flutter}`],
            ["전자기록지", `${matchStats.paper}`],
            ["수기", `${matchStats.manual}`],
            ["진행중", `${matchStats.inProgress}`],
          ]}
          panels={[
            ["matches", "경기 운영"],
            ["recorders", "기록원"],
            ["admins", "운영진"],
          ]}
          openPanels={visibleOpenPanels}
          onToggle={togglePanel}
        />
        {visibleOpenPanels.has("matches") && (
          <PanelFrame>
            <MatchesPanel
              tournamentId={tournamentId}
              defaultMode={defaultRecordingMode}
              matchStats={matchStats}
            />
          </PanelFrame>
        )}
        {visibleOpenPanels.has("recorders") && (
          <PanelFrame>
            <RecordersPanel />
          </PanelFrame>
        )}
        {visibleOpenPanels.has("admins") && (
          <PanelFrame>
            <AdminsPanel />
          </PanelFrame>
        )}
      </WorkspaceSection>

        </div>
        <div className="ct-col space-y-3">
      <WorkspaceSection id="divisions" title="종별·디비전" subtitle="종별과 대진을 관리합니다.">
        <PanelSummary
          stats={[
            ["종별", `${summary.divisionCount}`],
            ["대진 경기", `${summary.matchCount}`],
          ]}
          panels={[
            ["bracket", "대진 생성"],
          ]}
          openPanels={visibleOpenPanels}
          onToggle={togglePanel}
        />
        <PanelFrame>
          <DivisionsPanel />
        </PanelFrame>
        {visibleOpenPanels.has("bracket") && (
          <PanelFrame>
            <BracketPanel />
          </PanelFrame>
        )}
      </WorkspaceSection>

      <WorkspaceSection
        id="publish"
        title="접수·공개"
        subtitle="참가 접수, 팀 기준, 공개 상태를 운영합니다."
      >
        <PanelSummary
          stats={[
            ["참가팀", `${summary.teamCount}${summary.maxTeams ? ` / ${summary.maxTeams}` : ""}`],
            ["승인", form.auto_approve_teams ? "자동" : "수동"],
            ["대기접수", form.allow_waiting_list ? "허용" : "미허용"],
            ["사이트", summary.siteConfigured ? "설정됨" : "미설정"],
            ["공개", summary.sitePublished ? "공개 중" : "비공개"],
            ["공개 가능", publishGate.ok ? "가능" : "대기"],
          ]}
          panels={[
            ["teams", "참가팀 관리"],
            ["site", "사이트 공개"],
          ]}
          openPanels={visibleOpenPanels}
          onToggle={togglePanel}
        />
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ts-btn ts-btn--secondary ts-btn--sm mt-3"
          >
            공개 사이트 보기
          </a>
        )}
        {visibleOpenPanels.has("teams") && (
          <PanelFrame>
            <TeamsPanel />
          </PanelFrame>
        )}
        {visibleOpenPanels.has("site") && (
          <PanelFrame>
            <SitePanel />
          </PanelFrame>
        )}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <FormGroupTitle title="접수·결제" flush />
          <Field label="참가비">
            <input
              className="ts-input"
              type="number"
              min={0}
              value={form.entry_fee}
              onChange={(e) => patchForm("entry_fee", Number(e.target.value))}
            />
          </Field>
          <Field label="접수 시작" className="col-span-2 sm:col-span-1">
            <input
              className="ts-input"
              type="datetime-local"
              value={form.registration_start_at}
              onChange={(e) => patchForm("registration_start_at", e.target.value)}
            />
          </Field>
          <Field label="접수 종료" className="col-span-2 sm:col-span-1">
            <input
              className="ts-input"
              type="datetime-local"
              value={form.registration_end_at}
              onChange={(e) => patchForm("registration_end_at", e.target.value)}
            />
          </Field>
          <Field label="은행명">
            <input
              className="ts-input"
              value={form.bank_name}
              onChange={(e) => patchForm("bank_name", e.target.value)}
              placeholder="은행명"
            />
          </Field>
          <Field label="계좌번호">
            <input
              className="ts-input"
              value={form.bank_account}
              onChange={(e) => patchForm("bank_account", e.target.value)}
              placeholder="계좌번호"
            />
          </Field>
          <Field label="예금주">
            <input
              className="ts-input"
              value={form.bank_holder}
              onChange={(e) => patchForm("bank_holder", e.target.value)}
              placeholder="예금주"
            />
          </Field>
          <Field label="참가비 안내" className="col-span-2">
            <textarea
              className="ts-input min-h-20 resize-y"
              value={form.fee_notes}
              onChange={(e) => patchForm("fee_notes", e.target.value)}
              placeholder="입금 및 환불 안내"
            />
          </Field>
          <FormGroupTitle title="팀 설정" />
          <Field label="최대 팀 수">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.maxTeams}
              onChange={(e) => patchForm("maxTeams", Number(e.target.value))}
            />
          </Field>
          <Field label="경기 인원">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.team_size}
              onChange={(e) => patchForm("team_size", Number(e.target.value))}
            />
          </Field>
          <Field label="최소 선수">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.roster_min}
              onChange={(e) => patchForm("roster_min", Number(e.target.value))}
            />
          </Field>
          <Field label="최대 선수">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.roster_max}
              onChange={(e) => patchForm("roster_max", Number(e.target.value))}
            />
          </Field>
          <label className="flex min-h-[52px] items-center gap-3 rounded-[14px] bg-[var(--grey-50)] px-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.auto_approve_teams}
              onChange={(e) => patchForm("auto_approve_teams", e.target.checked)}
            />
            <span className="text-sm font-semibold text-[var(--ink)]">참가팀 자동 승인</span>
          </label>
          <label className="flex min-h-[52px] items-center gap-3 rounded-[14px] bg-[var(--grey-50)] px-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.allow_waiting_list}
              onChange={(e) => patchForm("allow_waiting_list", e.target.checked)}
            />
            <span className="text-sm font-semibold text-[var(--ink)]">대기 접수 허용</span>
          </label>
          {form.allow_waiting_list && (
            <Field label="대기팀 상한" className="col-span-2 sm:col-span-1">
              <input
                className="ts-input"
                type="number"
                min={1}
                value={form.waiting_list_cap ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  patchForm("waiting_list_cap", value ? Number(value) : null);
                }}
                placeholder="제한 없음"
              />
            </Field>
          )}
        </div>
        <details className="mt-3 rounded-[14px] bg-[var(--grey-50)] p-3">
          <summary className="min-h-[40px] cursor-pointer py-1.5 text-sm font-bold text-[var(--ink)]">
            공개 체크리스트
          </summary>
          <div className="mt-3">
            <SetupChecklist
              progress={progress}
              tournamentId={tournamentId}
              isSitePublished={summary.sitePublished}
              hasSite={summary.siteConfigured}
            />
          </div>
        </details>
      </WorkspaceSection>
        </div>
      </div>

      <div className="tw-foot">
        <button
          type="button"
          className="ts-btn ts-btn--secondary"
          onClick={() => moveTo(SECTIONS[Math.max(0, activeIndex - 1)].id)}
          disabled={activeIndex === 0}
        >
          이전
        </button>
        <div className="tw-foot__mid">
          <span className="ct-savebar__state">{stateMessage}</span>
          {saveState === "error" && message && <span className="tw-msg" data-tone="err">{message}</span>}
        </div>
        <div className="tw-foot__actions">
          <button type="button" className="ts-btn ts-btn--secondary" onClick={saveSetup} disabled={saving}>
            {saving ? "저장 중" : "저장"}
          </button>
          <button
            type="button"
            className="ts-btn ts-btn--primary"
            onClick={() => {
              if (activeIndex < SECTIONS.length - 1) moveTo(SECTIONS[activeIndex + 1].id);
              else void saveSetup();
            }}
            disabled={saving}
          >
            {activeIndex < SECTIONS.length - 1 ? "다음" : "저장하고 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SponsorEditor({
  sponsors,
  setSponsors,
}: {
  sponsors: SponsorDraft[];
  setSponsors: (next: SponsorDraft[]) => void;
}) {
  const [name, setName] = useState("");

  function addSponsor() {
    const nextName = name.trim();
    if (!nextName) return;
    if (sponsors.some((s) => s.name.trim() === nextName)) return;
    setSponsors([...sponsors, { id: ctUid("sp"), name: nextName, logoUrl: "" }]);
    setName("");
  }

  function updateSponsor(id: string, patch: Partial<SponsorDraft>) {
    setSponsors(sponsors.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  return (
    <div className="ts-field">
      <span className="ts-field__label">후원사</span>
      <div className="flex gap-2">
        <input
          className="ts-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              addSponsor();
            }
          }}
          placeholder="후원사명"
        />
        <button type="button" className="ts-btn ts-btn--secondary shrink-0" onClick={addSponsor}>
          추가
        </button>
      </div>
      {sponsors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {sponsors.map((s) => (
            <div key={s.id} className="ct-sptile">
              <button
                type="button"
                className="ct-sptile__x"
                onClick={() => setSponsors(sponsors.filter((item) => item.id !== s.id))}
                aria-label="후원사 삭제"
              >
                <Icon name="x" size={13} />
              </button>
              <ImageUploader
                value={s.logoUrl}
                onChange={(url) => updateSponsor(s.id, { logoUrl: url })}
                bucket="tournament-assets"
                path="tournaments/sponsors"
                label="로고"
                aspectRatio="1/1"
              />
              <input
                className="ts-input mt-2 text-center"
                value={s.name}
                onChange={(e) => updateSponsor(s.id, { name: e.target.value })}
                aria-label="후원사명"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionNav({
  active,
  onMove,
}: {
  active: SectionId;
  onMove: (id: SectionId) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeButton = rootRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
    activeButton?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <div ref={rootRef} className="tw-steps">
      {SECTIONS.map((section, index) => {
        const activeIndex = SECTIONS.findIndex((item) => item.id === active);
        const isActive = active === section.id;
        const isDone = index < activeIndex;
        return (
        <button
          key={section.id}
          type="button"
          aria-label={section.label}
          aria-current={isActive ? "true" : undefined}
          data-active={isActive}
          onClick={() => onMove(section.id)}
          className={["tw-step", isActive ? "is-active" : "", isDone ? "is-done" : ""].join(" ")}
        >
          <span className="tw-step__num">
            {isDone ? <Icon name="check" size={15} /> : index + 1}
          </span>
          <span className="tw-step__lbl">{section.label}</span>
        </button>
        );
      })}
    </div>
  );
}

function WorkspaceSection({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id: SectionId;
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  // 정본 mode=edit 정합: 섹션 헤더 = 단계별 아이콘 + "{N}단계 · {제목}" (SectionNav 번호와 일치).
  const stepNo = SECTIONS.findIndex((section) => section.id === id) + 1;
  const icon = SECTION_ICONS[id] ?? "trophy";
  return (
    <section
      id={id}
      className="ts-card scroll-mt-24"
    >
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="ct-headicon">
            <Icon name={icon} size={18} color="var(--primary)" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black text-[var(--ink)]">{stepNo}단계 · {title}</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-mute)]">{subtitle}</p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={["ts-field block", className].join(" ")}>
      <span className="ts-field__label">
        {label}
      </span>
      {children}
    </label>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ts-field block">
      <span className="ts-field__label">{label}</span>
      <div
        className="flex min-h-[44px] items-center rounded-[4px] border px-3 text-sm font-bold text-[var(--ink)]"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--grey-50)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "mute" }: { label: string; value: string; tone?: StatusTone }) {
  return (
    <div className="ct-metric rounded-[14px] bg-[var(--grey-50)] px-3 py-2">
      <p className="text-xs font-bold text-[var(--ink-mute)]">{label}</p>
      <p className="mt-0.5 text-sm font-black text-[var(--ink)]">
        {value}
        {tone !== "mute" && <span className="sr-only"> {tone}</span>}
      </p>
    </div>
  );
}

function PanelSummary({
  stats,
  panels,
  openPanels,
  onToggle,
}: {
  stats: Array<[string, string]>;
  panels: Array<[PanelId, string]>;
  openPanels: Set<PanelId>;
  onToggle: (id: PanelId) => void;
}) {
  return (
    <div className="ct-panel-summary">
      <div className="ct-panel-stats">
        {stats.map(([label, value]) => (
          <Metric key={label} label={label} value={value} />
        ))}
      </div>
      <div className="ct-panel-actions">
        {panels.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={[
              "ts-btn ts-btn--sm",
              openPanels.has(id) ? "ts-btn--primary" : "ts-btn--secondary",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelFrame({ children }: { children: ReactNode }) {
  return <div className="ct-panel-embed">{children}</div>;
}

function PanelLoading() {
  return (
    <div className="ct-emptybox mt-4">
      불러오는 중
    </div>
  );
}
