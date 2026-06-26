"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Check, Icon, Modal } from "@/components/admin-toss";
import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import "./../matches/matches-admin.css";

type Props = {
  tournamentId: string;
  defaultMode: RecordingMode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    manual: number;
    inProgress: number;
  };
};

type TeamInfo = {
  id: string;
  team: { name: string; primaryColor?: string | null };
};

type Match = {
  id: string;
  roundName: string | null;
  round_number: number | null;
  bracket_position: number | null;
  match_number: number | null;
  scheduledAt: string | null;
  venue_name: string | null;
  court_number: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  status: string;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
  settings: Record<string, unknown> | null;
};

type TournamentDetail = {
  start_date: string | null;
  end_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  places?: unknown;
  schedule_dates?: unknown;
  division_rules?: DivisionRule[];
  divisionRules?: DivisionRule[];
};

type DivisionRule = {
  code?: string | null;
  label?: string | null;
  name?: string | null;
};

type VenueDraft = {
  id: string;
  name: string;
  courtCount: number;
};

type ScheduleDateDraft = {
  id: string;
  date: string;
  courtIds: string[];
};

type ScheduleLane = {
  key: string;
  date: string;
  venueName: string;
  courtNumber: string;
  courtId: string;
  abbrev: string;
};

type ScheduledGroup = {
  key: string;
  label: string;
  lane: ScheduleLane | null;
  matches: Match[];
};

type Toast = { tone: "ok" | "danger"; text: string } | null;

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function textFrom(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberFrom(value: unknown, fallback = 1) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function normalizeVenues(tournament: TournamentDetail | null): VenueDraft[] {
  const rows = Array.isArray(tournament?.places) ? tournament?.places : [];
  const venues = rows.flatMap((row, index): VenueDraft[] => {
    if (!isRecord(row)) return [];
    const name = textFrom(row.name);
    if (!name) return [];
    return [{
      id: textFrom(row.id) ?? `v_${index}`,
      name,
      courtCount: numberFrom(row.courtCount ?? row.court_count, 1),
    }];
  });
  if (venues.length > 0) return venues;
  if (!tournament?.venue_name) return [];
  return [{ id: "v_legacy_0", name: tournament.venue_name, courtCount: 1 }];
}

function normalizeScheduleDates(tournament: TournamentDetail | null): ScheduleDateDraft[] {
  const rows = Array.isArray(tournament?.schedule_dates) ? tournament?.schedule_dates : [];
  const dates = rows.flatMap((row, index): ScheduleDateDraft[] => {
    if (!isRecord(row)) return [];
    const date = textFrom(row.date);
    if (!date) return [];
    const rawCourtIds = row.courtIds ?? row.court_ids;
    return [{
      id: textFrom(row.id) ?? `dt_${index}`,
      date,
      courtIds: Array.isArray(rawCourtIds)
        ? rawCourtIds.filter((courtId): courtId is string => typeof courtId === "string")
        : [],
    }];
  });
  if (dates.length > 0) return dates;
  const start = tournament?.start_date?.slice(0, 10);
  if (!start) return [];
  return [{ id: "dt_legacy_0", date: start, courtIds: [] }];
}

function venueAbbrev(name: string) {
  const cleaned = name.replace(/(생활체육관|문화체육관|체육관|스포츠센터|센터|관)$/g, "");
  const source = cleaned.trim() || name.trim();
  return source.slice(0, 2).toUpperCase();
}

function buildScheduleLanes(tournament: TournamentDetail | null): ScheduleLane[] {
  const venues = normalizeVenues(tournament);
  const dates = normalizeScheduleDates(tournament);
  const venueMap = new Map(venues.map((venue) => [venue.id, venue]));
  const allCourtIds = venues.flatMap((venue) =>
    Array.from({ length: venue.courtCount }, (_, index) => `${venue.id}_c${index}`),
  );

  const lanes: ScheduleLane[] = [];
  for (const date of dates) {
    const courtIds = date.courtIds.length > 0 ? date.courtIds : allCourtIds;
    for (const courtId of courtIds) {
      const [venueId, rawCourtIndex] = courtId.split("_c");
      const venue = venueMap.get(venueId);
      if (!venue) continue;
      const courtIndex = Number(rawCourtIndex);
      const courtNumber = Number.isFinite(courtIndex) ? String(courtIndex + 1) : "1";
      lanes.push({
        key: `${date.date}|${courtId}`,
        date: date.date,
        venueName: venue.name,
        courtNumber,
        courtId,
        abbrev: `${venueAbbrev(venue.name)}${courtNumber}`,
      });
    }
  }
  return lanes;
}

function addMinutesToTime(time: string, minutes: number) {
  const [hour = 9, minute = 0] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function toKstIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute)).toISOString();
}

function formatKstDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function formatKstTime(value: string | null) {
  if (!value) return "미정";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

function shortDate(value: string) {
  const [, month, day] = value.split("-");
  return month && day ? `${month}.${day}` : value;
}

function getDivisionCode(match: Match) {
  const code = textFrom(match.settings?.division_code);
  return code ?? "종별 미정";
}

function sortMatchesForSchedule(a: Match, b: Match) {
  const ad = getDivisionCode(a);
  const bd = getDivisionCode(b);
  if (ad !== bd) return ad.localeCompare(bd, "ko-KR", { numeric: true });
  return (
    (a.round_number ?? 999) - (b.round_number ?? 999) ||
    (a.bracket_position ?? 999) - (b.bracket_position ?? 999) ||
    (a.match_number ?? 999) - (b.match_number ?? 999) ||
    String(a.id).localeCompare(String(b.id), "ko-KR", { numeric: true })
  );
}

function stageLabel(match: Match) {
  const raw = `${match.roundName ?? ""} ${textFrom(match.settings?.stage) ?? ""}`.toLowerCase();
  if (raw.includes("group") || raw.includes("조별") || raw.includes("예선")) return "예선";
  if (raw.includes("dual") || raw.includes("듀얼")) return "듀얼";
  if (raw.includes("knockout") || raw.includes("본선") || raw.includes("결승")) return "토너먼트";
  return match.roundName ?? "경기";
}

function slotOrTeam(match: Match, side: "home" | "away", showResolvedName: boolean) {
  const team = side === "home" ? match.homeTeam?.team.name : match.awayTeam?.team.name;
  if (showResolvedName && team) return team;
  const slot = textFrom(match.settings?.[side === "home" ? "homeSlotLabel" : "awaySlotLabel"]);
  return slot ?? team ?? "미정";
}

async function readJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.");
  return res.json() as Promise<T>;
}

export default function MatchesPanel({ tournamentId }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const [showResolvedName, setShowResolvedName] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [draggedMatchId, setDraggedMatchId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextMatches, nextTournament] = await Promise.all([
        readJson<Match[]>(`/api/web/tournaments/${tournamentId}/matches`),
        readJson<TournamentDetail>(`/api/web/tournaments/${tournamentId}`),
      ]);
      setMatches([...nextMatches].sort(sortMatchesForSchedule));
      setTournament(nextTournament);
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const lanes = useMemo(() => buildScheduleLanes(tournament), [tournament]);
  const defaultLaneStart = useMemo(() => (
    Object.fromEntries(lanes.map((lane, index) => [lane.key, index === 0 ? "09:00" : index === 1 ? "09:30" : "10:00"]))
  ), [lanes]);
  const [laneStart, setLaneStart] = useState<Record<string, string>>({});

  useEffect(() => {
    setLaneStart((current) => {
      const next: Record<string, string> = {};
      for (const lane of lanes) next[lane.key] = current[lane.key] ?? defaultLaneStart[lane.key] ?? "09:00";
      return next;
    });
  }, [defaultLaneStart, lanes]);

  const divisionLabels = useMemo(() => {
    const rules = tournament?.division_rules ?? tournament?.divisionRules ?? [];
    return new Map(
      rules.flatMap((rule) => {
        const code = rule.code?.trim();
        if (!code) return [];
        return [[code, rule.label?.trim() || rule.name?.trim() || code] as const];
      }),
    );
  }, [tournament]);

  const divisionCodes = useMemo(() => {
    const codes = new Set(matches.map(getDivisionCode));
    for (const code of divisionLabels.keys()) codes.add(code);
    return [...codes].sort((a, b) => a.localeCompare(b, "ko-KR", { numeric: true }));
  }, [divisionLabels, matches]);

  const [durationByDivision, setDurationByDivision] = useState<Record<string, number>>({});
  const durations = useMemo(() => {
    const next: Record<string, number> = {};
    for (const code of divisionCodes) next[code] = durationByDivision[code] ?? 40;
    return next;
  }, [divisionCodes, durationByDivision]);

  const scheduledGroups = useMemo<ScheduledGroup[]>(() => {
    const groups = new Map<string, ScheduledGroup>();
    for (const match of matches) {
      if (!match.scheduledAt) continue;
      const date = formatKstDate(match.scheduledAt) ?? "날짜 미정";
      const venueName = match.venue_name ?? "체육관 미정";
      const courtNumber = match.court_number ?? "코트 미정";
      const key = `${date}|${venueName}|${courtNumber}`;
      const lane = lanes.find((item) =>
        item.date === date &&
        item.venueName === venueName &&
        item.courtNumber === courtNumber,
      ) ?? null;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          lane,
          label: `${lane?.abbrev ?? courtNumber} · ${date} · ${venueName} ${courtNumber === "코트 미정" ? "" : `${courtNumber}코트`}`.trim(),
          matches: [],
        });
      }
      groups.get(key)?.matches.push(match);
    }
    return [...groups.values()]
      .map((group) => ({
        ...group,
        matches: group.matches.sort((a, b) =>
          new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime(),
        ),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [lanes, matches]);

  const unscheduledMatches = useMemo(
    () => matches.filter((match) => !match.scheduledAt).sort(sortMatchesForSchedule),
    [matches],
  );
  const totalCount = matches.length;
  const scheduledCount = totalCount - unscheduledMatches.length;

  const patchSchedule = useCallback(async (
    match: Match,
    lane: ScheduleLane | null,
    scheduledAt: string | null,
  ) => {
    const res = await fetch(`/api/web/tournaments/${tournamentId}/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt,
        venue_name: lane?.venueName ?? null,
        court_number: lane?.courtNumber ?? null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error ?? "일정 저장에 실패했습니다.");
    }
  }, [tournamentId]);

  const runAutoSchedule = async (overwrite: boolean) => {
    if (lanes.length === 0) {
      setError("대회 정보 수정에서 일정·장소와 코트를 먼저 저장해 주세요.");
      return;
    }
    const targets = matches
      .filter((match) => overwrite || !match.scheduledAt)
      .sort(sortMatchesForSchedule);
    if (targets.length === 0) {
      setToast({ tone: "ok", text: "미배치 경기가 없습니다." });
      setAutoOpen(false);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const cursorByLane = new Map(lanes.map((lane) => [lane.key, laneStart[lane.key] ?? "09:00"]));
      for (const [index, match] of targets.entries()) {
        const lane = lanes[index % lanes.length];
        if (!lane) continue;
        const start = cursorByLane.get(lane.key) ?? "09:00";
        await patchSchedule(match, lane, toKstIso(lane.date, start));
        const nextStart = addMinutesToTime(start, durations[getDivisionCode(match)] ?? 40);
        cursorByLane.set(lane.key, nextStart);
      }
      await load();
      setAutoOpen(false);
      setToast({ tone: "ok", text: `${targets.length}경기 일정 저장 완료` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 자동 생성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const clearMatchSchedule = async (match: Match) => {
    setSaving(true);
    setError("");
    try {
      await patchSchedule(match, null, null);
      await load();
      setToast({ tone: "ok", text: "일정 배치 해제 완료" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 배치 해제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const reorderScheduledGroup = async (group: ScheduledGroup, targetMatchId: string) => {
    if (!draggedMatchId || draggedMatchId === targetMatchId || group.matches.length < 2) return;
    const fromIndex = group.matches.findIndex((match) => match.id === draggedMatchId);
    const toIndex = group.matches.findIndex((match) => match.id === targetMatchId);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...group.matches];
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved) return;
    reordered.splice(toIndex, 0, moved);

    const first = group.matches[0];
    const date = formatKstDate(first?.scheduledAt ?? null) ?? group.lane?.date;
    const startTime = formatKstTime(first?.scheduledAt ?? null);
    if (!date || startTime === "미정") return;

    setSaving(true);
    setError("");
    try {
      let cursor = startTime;
      for (const match of reordered) {
        const lane = group.lane ?? {
          key: group.key,
          date,
          venueName: first?.venue_name ?? "",
          courtNumber: first?.court_number ?? "",
          courtId: group.key,
          abbrev: group.label.split(" · ")[0] ?? "코트",
        };
        await patchSchedule(match, lane, toKstIso(date, cursor));
        cursor = addMinutesToTime(cursor, durations[getDivisionCode(match)] ?? 40);
      }
      await load();
      setToast({ tone: "ok", text: "경기 순서 저장 완료" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "경기 순서 저장에 실패했습니다.");
    } finally {
      setSaving(false);
      setDraggedMatchId(null);
    }
  };

  if (loading) {
    return (
      <div data-skin="toss" className="amt-loading">
        일정을 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div data-skin="toss" className="op-schedule-panel">
      {error && <div className="amt-errorbox">{error}</div>}

      <div className="ts-card ts-card--flat sc-scheduler-card">
        {matches.length > 0 && (
          <div className="bk-fromnote">
            <Icon name="git-merge" size={15} />
            <span>
              대진표 반영됨 — 전체 {totalCount}경기 · 배치 {scheduledCount}경기 · 미배치 {unscheduledMatches.length}경기 · 코트 {lanes.length}면
            </span>
          </div>
        )}

        <div className="sc-scheduler-head">
          <div className="sc-scheduler-title">
            <span className="ct-headicon"><Icon name="calendar-clock" size={18} /></span>
            <div>
              <h3>경기 시간 · 코트 시작 시간</h3>
              <p>종별 경기 시간과 코트별 시작 시간을 정한 뒤 자동 생성하거나 직접 배치하세요.</p>
            </div>
          </div>
          <label className="ct-checkrow op-schedule-panel__check">
            <Check on={showResolvedName} onChange={setShowResolvedName} />
            <span>추첨 결과 반영(팀명 표기)</span>
          </label>
        </div>

        <span className="ts-field__label sc-section-label">종별 경기 시간(분)</span>
        <div className="sc-durgrid">
          {(divisionCodes.length > 0 ? divisionCodes : ["종별 미정"]).map((code) => {
            const count = matches.filter((match) => getDivisionCode(match) === code).length;
            return (
              <div key={code} className="sc-durcell">
                <span className="sc-durcell__lbl">{divisionLabels.get(code) ?? code}</span>
                <input
                  className="ts-input"
                  type="number"
                  min={5}
                  step={5}
                  value={durations[code] ?? 40}
                  onChange={(e) =>
                    setDurationByDivision((current) => ({
                      ...current,
                      [code]: Number(e.target.value) || 40,
                    }))
                  }
                />
                <span className="sc-durcell__cnt">{count}경기</span>
              </div>
            );
          })}
        </div>

        <span className="ts-field__label sc-section-label">코트별 시작 시간</span>
        {lanes.length > 0 ? (
          <div className="sc-durgrid">
            {lanes.map((lane) => (
              <div key={lane.key} className="sc-durcell">
                <span className="sc-lane-court">{lane.abbrev}</span>
                <input
                  className="ts-input"
                  type="time"
                  value={laneStart[lane.key] ?? "09:00"}
                  onChange={(e) =>
                    setLaneStart((current) => ({
                      ...current,
                      [lane.key]: e.target.value,
                    }))
                  }
                />
                <span className="sc-durcell__cnt">{shortDate(lane.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="ct-emptybox op-schedule-panel__compact-empty">
            <Icon name="map-pin" size={28} color="var(--ink-dim)" />
            <b>일정·장소 코트 설정이 필요합니다.</b>
            <span>대회 정보 수정에서 날짜와 체육관 코트를 먼저 저장해 주세요.</span>
          </div>
        )}

        <div className="sc-scheduler-foot">
          <span>전체 {totalCount}경기 · 배치 {scheduledCount}경기 · 미배치 {unscheduledMatches.length}경기</span>
          <div className="op-schedule-panel__actions">
            <Btn
              variant="secondary"
              size="sm"
              icon="hand"
              disabled={saving || lanes.length === 0 || matches.length === 0}
              onClick={() => setManualOpen(true)}
            >
              직접 배치
            </Btn>
            <Btn
              size="sm"
              icon="wand-2"
              disabled={saving || lanes.length === 0 || matches.length === 0}
              onClick={() => setAutoOpen(true)}
            >
              일정 자동 생성
            </Btn>
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="ct-emptybox ct-emptybox--tall">
          <Icon name="calendar-plus" size={36} color="var(--ink-dim)" />
          <b style={{ color: "var(--ink)" }}>아직 작성된 일정이 없습니다</b>
          <span>대진표에서 경기를 생성한 뒤 일정 자동 생성 또는 직접 배치로 시간표를 구성하세요.</span>
        </div>
      ) : scheduledGroups.length === 0 ? (
        <div className="ct-emptybox ct-emptybox--tall">
          <Icon name="calendar-clock" size={36} color="var(--ink-dim)" />
          <b style={{ color: "var(--ink)" }}>아직 배치된 일정이 없습니다</b>
          <span>일정 자동 생성으로 일자·코트별 종별을 배정하거나, 직접 배치로 경기를 넣으세요.</span>
        </div>
      ) : (
        <div className="op-schedule-panel__lanes">
          {scheduledGroups.map((group) => (
            <div key={group.key} className="sc-lane-block">
              <div className="sc-lane-head">
                <span className="sc-lane-court">{group.lane?.abbrev ?? group.label.split(" · ")[0]}</span>
                <div>
                  <b>{group.label}</b>
                  <span>{group.matches.length}경기 배치됨 · 드래그로 순서 변경</span>
                </div>
              </div>
              <div className="amt-table-wrap">
                <table className="amt-table sc-table">
                  <thead>
                    <tr>
                      <th style={{ width: 34 }} />
                      <th>경기번호</th>
                      <th>종별</th>
                      <th>시간</th>
                      <th style={{ textAlign: "right" }}>홈</th>
                      <th style={{ width: 28 }} />
                      <th>원정</th>
                      <th>상태</th>
                      <th style={{ width: 38 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {group.matches.map((match, index) => (
                      <tr
                        key={match.id}
                        draggable
                        className={draggedMatchId === match.id ? "sc-dragging" : ""}
                        onDragStart={() => setDraggedMatchId(match.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          void reorderScheduledGroup(group, match.id);
                        }}
                      >
                        <td className="sc-handle"><Icon name="grip-vertical" size={15} color="var(--ink-dim)" /></td>
                        <td>
                          <span className="amt-table__court">
                            {group.lane?.abbrev ?? "G"}-{String(index + 1).padStart(2, "0")}
                          </span>
                        </td>
                        <td>
                          <span className="sc-divtag" data-ko={stageLabel(match) !== "예선"}>
                            {divisionLabels.get(getDivisionCode(match)) ?? getDivisionCode(match)}
                            <i>{stageLabel(match)}</i>
                          </span>
                        </td>
                        <td className="amt-table__time">{formatKstTime(match.scheduledAt)}</td>
                        <td style={{ textAlign: "right", fontWeight: 800 }}>
                          {slotOrTeam(match, "home", showResolvedName)}
                        </td>
                        <td style={{ textAlign: "center", color: "var(--ink-dim)", fontSize: 12 }}>대</td>
                        <td style={{ fontWeight: 800 }}>{slotOrTeam(match, "away", showResolvedName)}</td>
                        <td>
                          <span className="amt-status" data-status={match.status}>
                            {STATUS_LABEL[match.status] ?? match.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="sc-del"
                            disabled={saving}
                            onClick={() => void clearMatchSchedule(match)}
                            aria-label="일정 배치 해제"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {autoOpen && (
        <AutoScheduleModal
          saving={saving}
          totalCount={totalCount}
          unscheduledCount={unscheduledMatches.length}
          scheduledCount={scheduledCount}
          lanes={lanes}
          onClose={() => setAutoOpen(false)}
          onRun={(overwrite) => void runAutoSchedule(overwrite)}
        />
      )}
      {manualOpen && (
        <ManualPlacementModal
          saving={saving}
          matches={unscheduledMatches}
          lanes={lanes}
          laneStart={laneStart}
          divisionLabels={divisionLabels}
          showResolvedName={showResolvedName}
          onClose={() => setManualOpen(false)}
          onPlace={async (match, lane, time) => {
            setSaving(true);
            setError("");
            try {
              await patchSchedule(match, lane, toKstIso(lane.date, time));
              await load();
              setManualOpen(false);
              setToast({ tone: "ok", text: "경기 일정 배치 완료" });
            } catch (e) {
              setError(e instanceof Error ? e.message : "경기 일정 배치에 실패했습니다.");
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
      {toast && (
        <div className="ts-toast" data-tone={toast.tone}>
          <Icon name={toast.tone === "ok" ? "check" : "triangle-alert"} size={16} />
          {toast.text}
        </div>
      )}
    </div>
  );
}

function AutoScheduleModal({
  saving,
  totalCount,
  unscheduledCount,
  scheduledCount,
  lanes,
  onClose,
  onRun,
}: {
  saving: boolean;
  totalCount: number;
  unscheduledCount: number;
  scheduledCount: number;
  lanes: ScheduleLane[];
  onClose: () => void;
  onRun: (overwrite: boolean) => void;
}) {
  const [overwrite, setOverwrite] = useState(false);
  return (
    <Modal
      open
      onClose={onClose}
      title="일정 자동 생성"
      sub="코트별 시작 시간과 종별 경기 시간을 기준으로 경기 일정을 자동 배정합니다."
      maxWidth={720}
      foot={(
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>취소</Btn>
          <Btn icon="wand-2" onClick={() => onRun(overwrite)} disabled={saving || totalCount === 0 || lanes.length === 0}>
            {saving ? "저장 중" : overwrite ? "전체 다시 생성" : "미배치 생성"}
          </Btn>
        </>
      )}
    >
      <div className="op-schedule-modal__summary">
        <div><b>{totalCount}</b><span>전체 경기</span></div>
        <div><b>{unscheduledCount}</b><span>미배치</span></div>
        <div><b>{scheduledCount}</b><span>배치됨</span></div>
        <div><b>{lanes.length}</b><span>코트</span></div>
      </div>
      <label className="ct-checkrow op-schedule-modal__check">
        <Check on={overwrite} onChange={setOverwrite} />
        <span>이미 배치된 경기까지 전체 다시 생성</span>
      </label>
      <div className="op-schedule-modal__lanes">
        {lanes.map((lane) => (
          <div key={lane.key} className="op-schedule-modal__lane">
            <span className="sc-lane-court">{lane.abbrev}</span>
            <div>
              <b>{lane.venueName} {lane.courtNumber}코트</b>
              <span>{lane.date}</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function ManualPlacementModal({
  saving,
  matches,
  lanes,
  laneStart,
  divisionLabels,
  showResolvedName,
  onClose,
  onPlace,
}: {
  saving: boolean;
  matches: Match[];
  lanes: ScheduleLane[];
  laneStart: Record<string, string>;
  divisionLabels: Map<string, string>;
  showResolvedName: boolean;
  onClose: () => void;
  onPlace: (match: Match, lane: ScheduleLane, time: string) => Promise<void>;
}) {
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? "");
  const [selectedLaneKey, setSelectedLaneKey] = useState(lanes[0]?.key ?? "");
  const selectedLane = lanes.find((lane) => lane.key === selectedLaneKey) ?? lanes[0];
  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? matches[0];
  const [time, setTime] = useState(selectedLane ? laneStart[selectedLane.key] ?? "09:00" : "09:00");

  useEffect(() => {
    if (selectedLane) setTime(laneStart[selectedLane.key] ?? "09:00");
  }, [laneStart, selectedLane]);

  return (
    <Modal
      open
      onClose={onClose}
      title="직접 배치"
      sub="미배치 경기와 일자·코트를 선택해 시간표에 넣습니다."
      maxWidth={880}
      foot={(
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>닫기</Btn>
          <Btn
            icon="calendar-plus"
            disabled={saving || !selectedMatch || !selectedLane}
            onClick={() => selectedMatch && selectedLane ? void onPlace(selectedMatch, selectedLane, time) : undefined}
          >
            {saving ? "저장 중" : "선택 경기 배치"}
          </Btn>
        </>
      )}
    >
      <div className="op-manual">
        <div className="op-manual__pool">
          <h4>미배치 경기 ({matches.length})</h4>
          {matches.length === 0 ? (
            <div className="ct-emptybox op-schedule-panel__compact-empty">
              <Icon name="check-circle" size={28} color="var(--ok)" />
              <b>모든 경기가 배치되었습니다.</b>
            </div>
          ) : (
            <div className="op-manual__list">
              {matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  className="op-manual__match"
                  data-on={match.id === selectedMatch?.id}
                  onClick={() => setSelectedMatchId(match.id)}
                >
                  <span className="sc-divtag" data-ko={stageLabel(match) !== "예선"}>
                    {divisionLabels.get(getDivisionCode(match)) ?? getDivisionCode(match)}
                    <i>{stageLabel(match)}</i>
                  </span>
                  <b>{slotOrTeam(match, "home", showResolvedName)} 대 {slotOrTeam(match, "away", showResolvedName)}</b>
                  <span>#{match.match_number ?? "-"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="op-manual__settings">
          <label className="ts-field">
            <span className="ts-field__label">일자·코트</span>
            <select className="ts-select" value={selectedLaneKey} onChange={(e) => setSelectedLaneKey(e.target.value)}>
              {lanes.map((lane) => (
                <option key={lane.key} value={lane.key}>
                  {lane.date} · {lane.venueName} {lane.courtNumber}코트
                </option>
              ))}
            </select>
          </label>
          <label className="ts-field">
            <span className="ts-field__label">시작 시간</span>
            <input className="ts-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          {selectedLane && (
            <div className="op-manual__preview">
              <span className="sc-lane-court">{selectedLane.abbrev}</span>
              <div>
                <b>{selectedLane.date}</b>
                <span>{selectedLane.venueName} {selectedLane.courtNumber}코트 · {time}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
