"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import type { SetupProgress } from "@/lib/tournaments/setup-status";
import { Icon } from "@/components/admin-toss";
import { ImageUploader } from "@/components/shared/image-uploader";
import { SetupChecklist } from "./SetupChecklist";
import {
  ScheduleVenue,
  allCourts,
  ctUid,
  type DateRow,
  type Venue,
} from "../../new/wizard/_components/ct-schedule-venue";
import { CtGameSettings, type GameRules } from "../../new/wizard/_components/ct-game-settings";

type StatusTone = "ok" | "warn" | "info" | "mute" | "err";
type SectionId = "info" | "schedule" | "divisions" | "game" | "publish";
type PanelId = "teams" | "divisions" | "bracket" | "matches" | "recorders" | "admins" | "site";

type MatchStats = {
  total: number;
  paper: number;
  flutter: number;
  inProgress: number;
};

type SetupFormState = {
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venue_name: string;
  venue_address: string;
  maxTeams: number;
  entry_fee: number;
  auto_approve_teams: boolean;
  registration_start_at: string;
  registration_end_at: string;
  organizer: string;
  host: string;
  sponsors: SponsorDraft[];
  gender: string;
  game_time: string;
  game_ball: string;
  game_method: string;
  game_rules: GameRules;
  description: string;
  places: Venue[];
  schedule_dates: DateRow[];
};

type SponsorDraft = {
  id: string;
  name: string;
  logoUrl: string;
};

type Props = {
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
  { id: "publish", label: "게시 설정" },
];

const LEGACY_SECTION_MAP: Record<string, SectionId> = {
  setup: "info",
  teams: "publish",
  structure: "divisions",
  matches: "game",
  staff: "game",
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

function FormGroupTitle({ title, flush = false }: { title: string; flush?: boolean }) {
  return (
    <div
      className={[
        "col-span-full border-t pt-3 md:col-span-2 2xl:col-span-3",
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
}: Props) {
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
  const urgentCount =
    publishGate.missing.length +
    (summary.teamCount === 0 ? 1 : 0) +
    (summary.divisionCount === 0 ? 1 : 0) +
    (summary.matchCount === 0 ? 1 : 0);

  useEffect(() => {
    const rawHash = window.location.hash.replace("#", "");
    const hash = (LEGACY_SECTION_MAP[rawHash] ?? rawHash) as SectionId;
    if (SECTIONS.some((section) => section.id === hash)) {
      moveTo(hash, "auto");
    }
  }, []);

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

  function addVenue(name: string, region: string) {
    const v = name.trim();
    if (!v) return;
    patchForm("places", [
      ...form.places,
      { id: ctUid("v"), name: v, region: region.trim(), courtCount: 1, naming: "num" },
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
      .map((place) => ({
        id: place.id,
        name: place.name.trim(),
        region: place.region.trim(),
        courtCount: Math.max(1, Number(place.courtCount) || 1),
        naming: place.naming === "alpha" ? "alpha" : "num",
      }))
      .filter((place) => place.name);
    const scheduleDates = form.schedule_dates
      .map((date) => ({
        id: date.id,
        date: date.date,
        court_ids: date.courtIds,
      }))
      .filter((date) => date.date);
    const primaryVenue = places[0] ?? null;

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      venue_name: (primaryVenue?.name ?? form.venue_name.trim()) || null,
      venue_address: (primaryVenue?.region ?? form.venue_address.trim()) || null,
      maxTeams: Number(form.maxTeams) > 0 ? Number(form.maxTeams) : undefined,
      entry_fee: Number(form.entry_fee) >= 0 ? Number(form.entry_fee) : 0,
      auto_approve_teams: form.auto_approve_teams,
      registration_start_at: form.registration_start_at || null,
      registration_end_at: form.registration_end_at || null,
      organizer: form.organizer.trim() || null,
      host: form.host.trim() || null,
      sponsors: sponsors.map((s) => s.name).join(", "),
      gender: form.gender.trim() || null,
      game_time: form.game_time.trim() || null,
      game_ball: form.game_ball.trim() || null,
      game_method: form.game_method.trim() || null,
      game_rules: form.game_rules,
      description: form.description.trim() || null,
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

  function renderGlobalSave() {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {message && (
          <p className={saveState === "error" ? "text-sm text-[var(--color-error)]" : "text-sm text-[var(--color-success)]"}>
            {message}
          </p>
        )}
        <button type="button" className="ts-btn ts-btn--primary ts-btn--sm" onClick={saveSetup} disabled={saving}>
          {saving ? "저장 중" : "저장"}
        </button>
      </div>
    );
  }

  return (
    <div data-skin="toss" className="ct-page ct-page--workspace space-y-3 pb-24 lg:pb-0">
      <section className="ts-card ts-card--tight ct-workspace-summary">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <OperationShortcut
                label="참가팀"
                value={`${summary.teamCount}${summary.maxTeams ? ` / ${summary.maxTeams}` : ""}`}
                helper={form.auto_approve_teams ? "자동 승인" : "승인 확인"}
                onClick={() => openPanelAndMove("publish", "teams")}
              />
              <OperationShortcut
                label="종별 설정"
                value={`${summary.divisionCount}개`}
                helper={summary.divisionCount > 0 ? "운영 방식 확인" : "설정 필요"}
                onClick={() => openPanelAndMove("divisions", "divisions")}
              />
              <OperationShortcut
                label="경기 운영"
                value={`${matchStats.total}경기`}
                helper={matchStats.inProgress > 0 ? `${matchStats.inProgress}경기 진행중` : "일정·기록 확인"}
                onClick={() => openPanelAndMove("game", "matches")}
              />
              <OperationShortcut
                label="공개 상태"
                value={summary.sitePublished ? "공개 중" : publishGate.ok ? "공개 가능" : `${urgentCount}개 확인`}
                helper={summary.siteConfigured ? "사이트 설정" : "사이트 필요"}
                onClick={() => openPanelAndMove("publish", "site")}
              />
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-[4px] bg-[var(--grey-100)]">
              <div
                className="h-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: "var(--color-accent)" }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              진행률 {progress.completed}/{progress.total} · {publishGate.ok ? "공개 가능" : `${publishGate.missing.length}개 남음`}
            </p>
          </div>
          <div className="hidden lg:flex lg:flex-col lg:gap-2">
            <SectionNav active={active} onMove={moveTo} compact />
            {renderGlobalSave()}
          </div>
        </div>
      </section>

      <div
        className="sticky top-0 z-30 border-y py-1.5 backdrop-blur lg:hidden"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-background) 92%, transparent)",
        }}
      >
        <SectionNav active={active} onMove={moveTo} compact />
      </div>

      <div className="ct-grid ct-grid--2 ct-grid--workspace">
        <div className="ct-col space-y-3">
      <WorkspaceSection
        id="info"
        title="대회 정보"
        subtitle="기본 정보와 일정·장소를 함께 수정합니다."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
          <div className="grid grid-cols-2 gap-3">
            <FormGroupTitle title="대회 정보" flush />
            <Field label="대회 이름" className="col-span-2">
              <input className="ts-input" value={form.name} onChange={(e) => patchForm("name", e.target.value)} />
            </Field>
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
          <div id="schedule" className="scroll-mt-24">
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
          </div>
          <div className="xl:col-span-2">
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
        </div>
      </WorkspaceSection>

      <WorkspaceSection
        id="game"
        title="경기 설정"
        subtitle="경기 규칙과 기록을 관리합니다."
      >
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="경기 시간">
            <input className="ts-input" value={form.game_time} onChange={(e) => patchForm("game_time", e.target.value)} />
          </Field>
          <Field label="사용구">
            <input className="ts-input" value={form.game_ball} onChange={(e) => patchForm("game_ball", e.target.value)} />
          </Field>
          <Field label="경기 방식" className="col-span-2 md:col-span-1">
            <input className="ts-input" value={form.game_method} onChange={(e) => patchForm("game_method", e.target.value)} />
          </Field>
        </div>
        <div className="mb-3">
          <CtGameSettings value={form.game_rules} onChange={(next) => patchForm("game_rules", next)} />
        </div>
        <PanelSummary
          stats={[
            ["전체 경기", `${matchStats.total}`],
            ["기록 방식", RECORDING_MODE_LABEL[defaultRecordingMode]],
            ["기록앱", `${matchStats.flutter}`],
            ["종이", `${matchStats.paper}`],
            ["진행중", `${matchStats.inProgress}`],
          ]}
          panels={[
            ["matches", "경기 운영"],
            ["recorders", "기록원"],
            ["admins", "운영진"],
          ]}
          openPanels={openPanels}
          onToggle={togglePanel}
        />
        {openPanels.has("matches") && (
          <PanelFrame>
            <MatchesPanel
              tournamentId={tournamentId}
              defaultMode={defaultRecordingMode}
              matchStats={matchStats}
            />
          </PanelFrame>
        )}
        {openPanels.has("recorders") && (
          <PanelFrame>
            <RecordersPanel />
          </PanelFrame>
        )}
        {openPanels.has("admins") && (
          <PanelFrame>
            <AdminsPanel />
          </PanelFrame>
        )}
      </WorkspaceSection>

        </div>
        <div className="ct-col space-y-3 lg:sticky lg:top-3">
      <WorkspaceSection id="divisions" title="종별·디비전" subtitle="종별과 대진을 관리합니다.">
        <PanelSummary
          stats={[
            ["종별", `${summary.divisionCount}`],
            ["대진 경기", `${summary.matchCount}`],
          ]}
          panels={[
            ["divisions", "종별 운영 방식"],
            ["bracket", "대진 생성"],
          ]}
          openPanels={openPanels}
          onToggle={togglePanel}
        />
        {openPanels.has("divisions") && (
          <PanelFrame>
            <DivisionsPanel />
          </PanelFrame>
        )}
        {openPanels.has("bracket") && (
          <PanelFrame>
            <BracketPanel />
          </PanelFrame>
        )}
      </WorkspaceSection>

      <WorkspaceSection
        id="publish"
        title="게시 설정"
        subtitle="접수와 공개 상태를 관리합니다."
      >
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Field label="최대 팀 수">
            <input
              className="ts-input"
              type="number"
              min={1}
              value={form.maxTeams}
              onChange={(e) => patchForm("maxTeams", Number(e.target.value))}
            />
          </Field>
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
          <label className="flex min-h-[52px] items-center gap-3 rounded-[14px] bg-[var(--grey-50)] px-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.auto_approve_teams}
              onChange={(e) => patchForm("auto_approve_teams", e.target.checked)}
            />
            <span className="text-sm font-semibold text-[var(--ink)]">참가팀 자동 승인</span>
          </label>
        </div>
        <PanelSummary
          stats={[
            ["참가팀", `${summary.teamCount}${summary.maxTeams ? ` / ${summary.maxTeams}` : ""}`],
            ["승인 기준", form.auto_approve_teams ? "자동 승인" : "수동 승인"],
            ["사이트", summary.siteConfigured ? "설정됨" : "미설정"],
            ["공개", summary.sitePublished ? "공개 중" : "비공개"],
            ["공개 가능", publishGate.ok ? "가능" : "대기"],
          ]}
          panels={[
            ["teams", "참가팀"],
            ["site", "사이트 공개"],
          ]}
          openPanels={openPanels}
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
        {openPanels.has("teams") && (
          <PanelFrame>
            <TeamsPanel />
          </PanelFrame>
        )}
        {openPanels.has("site") && (
          <PanelFrame>
            <SitePanel />
          </PanelFrame>
        )}
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

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="mx-auto flex max-w-[520px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--color-text-muted)]">저장 상태</p>
            <p className="truncate text-sm font-black text-[var(--color-text-primary)]">
              {saving ? "저장 중입니다" : dirty ? "변경사항이 있습니다" : saveState === "saved" ? "저장되었습니다" : message || "변경사항 없음"}
            </p>
          </div>
          <button type="button" className="ts-btn ts-btn--primary min-w-[112px]" onClick={saveSetup} disabled={saving}>
            {saving ? "저장 중" : "저장"}
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
  compact = false,
}: {
  active: SectionId;
  onMove: (id: SectionId) => void;
  compact?: boolean;
}) {
  return (
    <div className={["ts-segment", compact ? "overflow-x-auto" : ""].join(" ")}>
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-label={section.label}
          aria-current={active === section.id ? "true" : undefined}
          data-active={active === section.id}
          onClick={() => onMove(section.id)}
          className={[
            "ts-segment__btn whitespace-nowrap",
            compact ? "min-w-[112px] shrink-0 text-xs" : "",
          ].join(" ")}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}

function OperationShortcut({
  label,
  value,
  helper,
  onClick,
}: {
  label: string;
  value: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[12px] bg-[var(--grey-50)] p-2.5 text-left transition hover:bg-[var(--primary-weak)]"
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold text-[var(--ink-mute)]">{label}</span>
        <span className="block truncate text-sm font-black text-[var(--ink)]">{value}</span>
        <span className="block truncate text-xs text-[var(--ink-mute)]">{helper}</span>
      </span>
    </button>
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
  return (
    <section
      id={id}
      className="ts-card scroll-mt-24"
    >
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="ct-headicon">
            <Icon name="trophy" size={18} color="var(--primary)" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black text-[var(--ink)]">{title}</h2>
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

function Metric({ label, value, tone = "mute" }: { label: string; value: string; tone?: StatusTone }) {
  return (
    <div className="rounded-[14px] bg-[var(--grey-50)] px-3 py-2">
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
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(([label, value]) => (
          <Metric key={label} label={label} value={value} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
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
  return <div className="ta-panel-embed mt-3">{children}</div>;
}

function PanelLoading() {
  return (
    <div className="ct-emptybox mt-4">
      불러오는 중
    </div>
  );
}
