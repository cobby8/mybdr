"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
// 2026-05-16 PR-Admin-3 — placeholder 매치 검증 배너 (강남구협회장배 사고 재발 방지)
import { PlaceholderValidationBanner } from "../_components/PlaceholderValidationBanner";
// 2026-05-16 PR-Admin-2 — 단일 순위전 진출 trigger (teams 페이지 헤더에서 이동 박제)
import { AdvancePlayoffsButton } from "../_components/AdvancePlayoffsButton";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
import type { RecordingMode } from "@/lib/tournaments/recording-mode";
// 2026-05-28 PR-1C-6 옵션 A — 매치 표 시각 박제 (시안 admin.css amt-table). 데이터/onClick 유지, 시각만.
import "./matches-admin.css";

type TeamInfo = {
  id: string;
  team: { name: string; primaryColor: string | null };
};

type Match = {
  id: string;
  roundName: string | null;
  round_number: number | null;
  bracket_position: number | null;
  match_number: number | null;
  scheduledAt: string | null;
  venue_name: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  status: string;
  winner_team_id: string | null;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
  // 2026-05-16 PR-Admin-3 — placeholder 검증용 notes 필드.
  //   GET /api/web/tournaments/[id]/matches 응답에 이미 포함 (MATCH_LIST_INCLUDE 가 include 만 사용).
  //   PlaceholderValidationBanner 가 parseSlotLabel 통과 여부 검증.
  notes: string | null;
  // 2026-05-11: Phase 1-A 매치별 recording_mode — settings JSON 의 recording_mode 키.
  // apiSuccess 가 snake_case 자동 변환 → settings 객체 안 recording_mode 그대로 노출.
  // null / undefined / "flutter" / 알 수 없는 값 = fallback "flutter" 로 표시.
  settings: { recording_mode?: string | null; division_code?: string | null; [k: string]: unknown } | null;
};

// 2026-05-12 — 매치 settings.division_code 추출 (강남구협회장배 다중 종별 케이스).
function getMatchDivision(m: Match): string | null {
  const s = m.settings as Record<string, unknown> | null;
  if (!s) return null;
  return (s.division_code as string) ?? null;
}

// 2026-05-11: settings JSON 에서 recording_mode 추출 — 서버 헬퍼와 동일 fallback 룰.
// "paper"/"manual" 만 명시적 모드 / 그 외 모두 "flutter" 로 간주.
function readRecordingMode(
  settings: Match["settings"]
): RecordingMode {
  if (!settings || typeof settings !== "object") return "flutter";
  if (settings.recording_mode === "paper") return "paper";
  if (settings.recording_mode === "manual") return "manual";
  return "flutter";
}

type TournamentTeam = {
  id: string;
  team: { name: string };
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

const RECORDING_MODE_LABEL: Record<RecordingMode, string> = {
  flutter: "기록앱",
  paper: "전자기록지",
  manual: "수기",
};

function formatMatchDate(value: string | null) {
  if (!value) return "미정";
  return new Date(value).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function formatMatchTeams(match: Match) {
  return `${match.homeTeam?.team.name ?? "미정"} 대 ${match.awayTeam?.team.name ?? "미정"}`;
}

function ScoreModal({
  match,
  teams,
  onClose,
  onSaved,
}: {
  match: Match;
  teams: TournamentTeam[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore);
  const [awayScore, setAwayScore] = useState(match.awayScore);
  const [status, setStatus] = useState(match.status);
  const [winnerId, setWinnerId] = useState(match.winner_team_id ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    match.scheduledAt ? new Date(match.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [venueName, setVenueName] = useState(match.venue_name ?? "");
  const [homeTeamId, setHomeTeamId] = useState(match.homeTeamId ?? "");
  const [awayTeamId, setAwayTeamId] = useState(match.awayTeamId ?? "");
  // 2026-05-11: Phase 1-A 매치별 기록 모드 토글.
  // 초기값 = 서버 settings.recording_mode (fallback "flutter").
  // 변경 시 save() 안에서 별도 endpoint /api/web/admin/matches/[id]/recording-mode 호출.
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(
    readRecordingMode(match.settings)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { id } = useParams<{ id: string }>();

  const approvedTeams = teams.filter((t) => t.status === "approved");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      // 2026-05-02 회귀 방지 (errors.md "양쪽 같은 팀" 케이스):
      // 변경된 필드만 PATCH body 에 포함 — 운영자가 venue/scheduledAt 만 수정해도
      // home/away 가 같이 send 되어 진출 처리된 슬롯이 stale data 로 덮어써지는 문제 방지.
      const initialHomeTeamId = match.homeTeamId ?? "";
      const initialAwayTeamId = match.awayTeamId ?? "";
      const initialWinnerId = match.winner_team_id ?? "";
      const initialScheduledAt = match.scheduledAt
        ? new Date(match.scheduledAt).toISOString().slice(0, 16)
        : "";
      const initialVenueName = match.venue_name ?? "";

      const body: Record<string, unknown> = {};
      if (homeScore !== match.homeScore) body.homeScore = homeScore;
      if (awayScore !== match.awayScore) body.awayScore = awayScore;
      if (status !== match.status) body.status = status;
      if (winnerId !== initialWinnerId) body.winner_team_id = winnerId || null;
      if (scheduledAt !== initialScheduledAt) body.scheduledAt = scheduledAt || null;
      if (venueName !== initialVenueName) body.venue_name = venueName || null;
      if (homeTeamId !== initialHomeTeamId) body.homeTeamId = homeTeamId || null;
      if (awayTeamId !== initialAwayTeamId) body.awayTeamId = awayTeamId || null;

      // 2026-05-11: Phase 1-A — recording_mode 변경 감지 (settings JSON 키, 별도 endpoint).
      // 기존 PATCH 라우트는 settings 처리를 안 함 → mode 토글은 별도 호출 필요.
      const initialMode = readRecordingMode(match.settings);
      const modeChanged = recordingMode !== initialMode;

      // 변경 사항 0 (점수/상태/팀/모드 모두) → 저장 skip
      if (Object.keys(body).length === 0 && !modeChanged) {
        onClose();
        return;
      }

      // 모드 변경 시 사용자 confirm — 진행 중 매치 사고 방지
      if (modeChanged) {
        const next = RECORDING_MODE_LABEL[recordingMode];
        if (
          !confirm(
            `이 매치 기록 모드를 [${next}] 로 전환합니다.\n진행 중 매치는 신중히 결정하세요.`
          )
        ) {
          // 사용자 취소 — 토글 원복
          setRecordingMode(initialMode);
          return;
        }
      }

      // 1) 기존 PATCH (점수/상태/팀/일정) — 변경 있을 때만
      if (Object.keys(body).length > 0) {
        const res = await fetch(`/api/web/tournaments/${id}/matches/${match.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "저장 실패");
        }
      }

      // 2) 모드 변경 — 별도 endpoint (POST recording-mode)
      if (modeChanged) {
        const reason = window.prompt(
          "모드 전환 사유 (선택 — 운영 history 박제)",
          ""
        );
        const modeRes = await fetch(
          `/api/web/admin/matches/${match.id}/recording-mode`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: recordingMode,
              ...(reason ? { reason } : {}),
            }),
          }
        );
        if (!modeRes.ok) {
          const err = await modeRes.json();
          throw new Error(err.error ?? "모드 전환 실패");
        }
      }

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm("이 경기를 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/web/tournaments/${id}/matches/${match.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } catch { /* ignore */ }
  };

  return (
    <div
      data-skin="toss"
      className="amt-modal-overlay no-print"
      onClick={onClose}
    >
      <div
        className="amt-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="ct-iconbtn absolute right-3 top-3" aria-label="닫기">
          <Icon name="x" size={20} />
        </button>
        <h3 className="mb-1 pr-10 text-lg font-bold text-[var(--ink)]">
          {match.roundName ?? "경기"} {match.match_number ? `#${match.match_number}` : ""}
        </h3>
        <p className="mb-4 text-sm text-[var(--ink-mute)]">{formatMatchTeams(match)}</p>

        {error && (
          <p className="amt-error">
            {error}
          </p>
        )}

        {/* 팀 배정 */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="ts-field__label">홈팀</label>
            <select
              className="ts-select"
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
            >
              <option value="">미정</option>
              {approvedTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ts-field__label">원정팀</label>
            <select
              className="ts-select"
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
            >
              <option value="">미정</option>
              {approvedTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.team.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 점수 */}
        <div className="mb-4 grid grid-cols-3 items-center gap-3">
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(Number(e.target.value))}
            className="ts-input text-center text-xl font-bold sm:text-2xl"
          />
          <div className="amt-score-sep">:</div>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            className="ts-input text-center text-xl font-bold sm:text-2xl"
          />
        </div>

        {/* 상태 */}
        <div className="mb-3">
          <label className="ts-field__label">상태</label>
          <select
            className="ts-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="scheduled">예정</option>
            <option value="in_progress">진행 중</option>
            <option value="completed">종료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>

        {/* 승자 */}
        <div className="mb-3">
          <label className="ts-field__label">승자 팀</label>
          <select
            className="ts-select"
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
          >
            <option value="">미결정</option>
            {homeTeamId && (
              <option value={homeTeamId}>
                {approvedTeams.find((t) => t.id === homeTeamId)?.team.name ?? "홈팀"}
              </option>
            )}
            {awayTeamId && awayTeamId !== homeTeamId && (
              <option value={awayTeamId}>
                {approvedTeams.find((t) => t.id === awayTeamId)?.team.name ?? "원정팀"}
              </option>
            )}
          </select>
        </div>

        {/* 일정 */}
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="ts-field__label">경기 일시</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="ts-input"
            />
          </div>
          <div>
            <label className="ts-field__label">경기장</label>
            <input
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="경기장명"
              className="ts-input"
            />
          </div>
        </div>

        {/* 2026-05-11: Phase 1-A — 매치별 기록 모드 토글.
            기록앱/전자기록지/수기 중 한 매치 = 한 모드 (충돌 자체 차단). */}
        <div className="mb-3">
          <label className="ts-field__label">기록 방식</label>
          <select
            className="ts-select"
            value={recordingMode}
            onChange={(e) =>
              setRecordingMode(e.target.value as RecordingMode)
            }
          >
            <option value="flutter">기록앱</option>
            <option value="paper">전자기록지</option>
            <option value="manual">수기</option>
          </select>
          {recordingMode === "paper" && (
            <>
              <p className="amt-hint" data-tone="warn">
                전자기록지 사용 중에는 기록앱 점수 입력이 차단됩니다.
              </p>
              {/* 2026-05-11: Phase 1-B-2 — paper 모드 매치는 종이 기록지 입력 페이지로 이동 */}
              {match.id && (
                <a
                  href={`/score-sheet/${match.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ts-btn ts-btn--secondary ts-btn--sm mt-2"
                >
                  전자기록지 열기
                </a>
              )}
            </>
          )}
          {recordingMode === "manual" && (
            <p className="amt-hint">
              수기 모드는 BDR 기록앱과 전자기록지를 사용하지 않는 운영 방식입니다.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={onClose} className="ts-btn ts-btn--secondary ts-btn--block sm:flex-1">
            취소
          </button>
          <button
            onClick={del}
            className="ts-btn ts-btn--danger sm:flex-1"
          >
            삭제
          </button>
          <button type="button" onClick={save} disabled={saving} className="ts-btn ts-btn--primary ts-btn--block sm:flex-1">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchesClient() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [error, setError] = useState("");
  // 2026-05-12 — 종별 필터 (강남구협회장배 다중 종별 운영)
  //   URL 쿼리 ?division=i3-U9 로 deep link 가능 (bracket 페이지에서 종별 카드 클릭 진입)
  const [divisionFilter, setDivisionFilter] = useState<string | null>(
    searchParams?.get("division") ?? null
  );
  // 2026-05-15 — 체육관 필터 (강남구협회장배 2 체육관 분리 / PR-G2). ?venue= deep link.
  const [venueFilter, setVenueFilter] = useState<string | null>(
    searchParams?.get("venue") ?? null
  );

  const load = useCallback(async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        fetch(`/api/web/tournaments/${id}/matches`),
        fetch(`/api/web/tournaments/${id}/teams`),
      ]);
      if (mRes.ok) setMatches(await mRes.json());
      if (tRes.ok) setTeams(await tRes.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generateBracket = async (clear = false) => {
    if (clear && !confirm("기존 경기를 모두 삭제하고 다시 생성하시겠습니까?")) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setGenerating(false);
    }
  };

  // 2026-05-12 — 종별 필터 (강남구협회장배 다중 종별)
  // matches 안 division_code 추출 → 종별 selector 표시 (2개 이상일 때만 표시)
  const divisionCodes = Array.from(
    new Set(matches.map(getMatchDivision).filter((c): c is string => !!c)),
  ).sort();
  const hasDivisions = divisionCodes.length > 1;

  // 2026-05-15 — 체육관 필터 (강남구협회장배 2 체육관: 수도공고 / 강남구민체육관 / PR-G2).
  // matches 안 venue_name 추출 → venue selector (2개 이상일 때만 표시).
  const venueNames = Array.from(
    new Set(matches.map((m) => m.venue_name).filter((v): v is string => !!v)),
  ).sort();
  const hasVenues = venueNames.length > 1;

  // 종별 필터 + venue 필터 동시 적용 (교집합)
  const filteredMatches = matches.filter((m) => {
    if (divisionFilter && getMatchDivision(m) !== divisionFilter) return false;
    if (venueFilter && m.venue_name !== venueFilter) return false;
    return true;
  });

  // 라운드별 그룹핑 — round_number 우선, null 이면 roundName 으로 폴백 (강남구협회장배 케이스)
  const useRoundNameFallback = filteredMatches.every((m) => m.round_number == null);
  const rounds = useRoundNameFallback
    ? Array.from(new Set(filteredMatches.map((m) => m.roundName ?? "라운드 미정"))).sort((a, b) =>
        a.localeCompare(b, "ko-KR", { numeric: true }),
      )
    : Array.from(new Set(filteredMatches.map((m) => m.round_number))).sort(
        (a, b) => (a ?? 0) - (b ?? 0),
      );

  if (loading)
    return <div data-skin="toss" className="amt-loading">불러오는 중...</div>;

  return (
    <div data-skin="toss" className="space-y-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--ink)]">경기 운영</h3>
          <p className="mt-1 text-sm text-[var(--ink-mute)]">일정, 점수, 기록 방식을 관리합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {matches.length > 0 ? (
            <button
              type="button"
              onClick={() => generateBracket(true)}
              disabled={generating}
              className="ts-btn ts-btn--secondary ts-btn--sm"
            >
              {generating ? "생성 중..." : "대진표 재생성"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => generateBracket(false)}
              disabled={generating}
              className="ts-btn ts-btn--primary ts-btn--sm"
            >
              {generating ? "생성 중..." : "대진표 생성"}
            </button>
          )}
          {/* 2026-05-16 PR-Admin-2 — 단일 순위전 진출 trigger (matches 페이지 단일 위치).
              teams 페이지 기존 버튼 제거 + 본 위치로 이동 (admin-flow §3 단계 10 정렬).
              호출 후 onSuccess → load() refetch (자동 매핑 결과 즉시 반영). */}
          {matches.length > 0 && (
            <AdvancePlayoffsButton
              tournamentId={id}
              divisionCodes={divisionCodes}
              onSuccess={load}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="amt-errorbox">
          {error}
        </div>
      )}

      {/* 2026-05-16 PR-Admin-3 — placeholder 매치 검증 배너 (강남구협회장배 사고 재발 방지).
          검출 0건 = null 반환 (배너 미표시) / 검출 ≥1건 = warning 톤 카드 + 펼치기 토글.
          현재 필터 적용된 매치만 검증 (운영자가 보고 있는 매치 = 검증 대상). */}
      <PlaceholderValidationBanner matches={filteredMatches} applyFilter />

      {/* 2026-05-12 — 종별 필터 (강남구협회장배 다중 종별 운영). 종별 2개 이상일 때만 표시. */}
      {hasDivisions && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="amt-filter-label">종별:</span>
          <button
            type="button"
            onClick={() => setDivisionFilter(null)}
            className="ts-chip"
            data-active={divisionFilter === null}
          >
            전체 ({matches.length})
          </button>
          {divisionCodes.map((code) => {
            const count = matches.filter((m) => getMatchDivision(m) === code).length;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setDivisionFilter(code)}
                className="ts-chip"
                data-active={divisionFilter === code}
              >
                {code} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 2026-05-15 — 체육관 필터 (PR-G2 / 강남구협회장배 2 체육관). venue 2개 이상일 때만 표시. */}
      {hasVenues && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="amt-filter-label">체육관:</span>
          <button
            type="button"
            onClick={() => setVenueFilter(null)}
            className="ts-chip"
            data-active={venueFilter === null}
          >
            전체
          </button>
          {venueNames.map((v) => {
            const count = matches.filter((m) => m.venue_name === v).length;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVenueFilter(v)}
                className="ts-chip"
                data-active={venueFilter === v}
              >
                {/* Material location_on → lucide map-pin */}
                <Icon name="map-pin" size={14} className="align-middle" style={{ marginRight: 4 }} />
                {v} ({count})
              </button>
            );
          })}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="ct-emptybox py-16 text-center text-[var(--ink-mute)]">
          <div className="mb-3 flex justify-center">
            <Icon name="calendar-plus" size={36} />
          </div>
          <p className="mb-1 font-medium">경기가 없습니다</p>
          <p className="text-sm">
            승인된 팀이{" "}
            {/* 본문 정보 강조 = text-primary + font-semibold (빨강 본문 금지) */}
            <span className="amt-count-strong">
              {teams.filter((t) => t.status === "approved").length}팀
            </span>
            {" "}있습니다. 대진표를 생성하세요.
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="ct-emptybox py-12 text-center text-[var(--ink-mute)]">
          <p className="text-sm">선택한 종별({divisionFilter})에 매치가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {rounds.map((roundKey) => {
            // round_number 또는 roundName 폴백 그룹화
            const roundMatches = useRoundNameFallback
              ? filteredMatches.filter((m) => (m.roundName ?? "라운드 미정") === roundKey)
              : filteredMatches.filter((m) => m.round_number === roundKey);
            const roundLabel = useRoundNameFallback
              ? (roundKey as string)
              : (roundMatches[0]?.roundName ?? `라운드 ${roundKey}`);

            return (
              <div key={String(roundKey ?? "none")}>
                <h2 className="ta-panel-title">
                  {roundLabel}
                </h2>
                <div className="space-y-2 md:hidden">
                  {roundMatches.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => setSelectedMatch(match)}
                      className="amt-mobile-card"
                    >
                      <div className="amt-mobile-card__head">
                        <div className="amt-mobile-card__main">
                          <p className="amt-mobile-card__teams">{formatMatchTeams(match)}</p>
                          <p className="amt-mobile-card__meta">
                            {formatMatchDate(match.scheduledAt)} · {match.venue_name ?? "코트 미정"} · {getMatchDivision(match) ?? "종별 미정"}
                          </p>
                        </div>
                        <span className="amt-status" data-status={match.status}>
                          {STATUS_LABEL[match.status] ?? match.status}
                        </span>
                      </div>
                      <div className="amt-mobile-card__foot">
                        <span className="amt-mobile-card__score">
                          {match.homeScore} : {match.awayScore}
                        </span>
                        <span className="amt-mobile-card__no">
                          #{match.match_number ?? "-"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="hidden md:block">
                  <div className="amt-table-wrap">
                    <table className="amt-table">
                      <thead>
                        <tr>
                          <th>시간</th>
                          <th>코트</th>
                          <th>종별</th>
                          <th>대진</th>
                          <th>스코어</th>
                          <th>상태</th>
                          <th>#</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roundMatches.map((match) => (
                          <tr
                            key={match.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedMatch(match)}
                          >
                            <td>
                              {match.scheduledAt ? (
                                <span className="amt-table__time">
                                  {formatMatchDate(match.scheduledAt)}
                                </span>
                              ) : (
                                <span className="amt-table__div">미정</span>
                              )}
                            </td>
                            <td>
                              {match.venue_name ? (
                                <span className="amt-table__court">{match.venue_name}</span>
                              ) : (
                                <span className="amt-table__div">-</span>
                              )}
                            </td>
                            <td>
                              <span className="amt-table__div">
                                {getMatchDivision(match) ?? "-"}
                              </span>
                            </td>
                            <td>
                              <span className="amt-table__teams">
                                <b className="amt-team" data-winner={match.winner_team_id === match.homeTeamId && match.homeTeamId ? "true" : "false"}>
                                  {match.homeTeam?.team.name ?? "미정"}
                                </b>
                                <span className="vs">대</span>
                                <b className="amt-team" data-winner={match.winner_team_id === match.awayTeamId && match.awayTeamId ? "true" : "false"}>
                                  {match.awayTeam?.team.name ?? "미정"}
                                </b>
                              </span>
                            </td>
                            <td>
                              <span className="amt-table__score">
                                {match.homeScore} : {match.awayScore}
                              </span>
                            </td>
                            <td>
                              <span className="amt-status" data-status={match.status}>
                                {STATUS_LABEL[match.status] ?? match.status}
                              </span>
                            </td>
                            <td>
                              <span className="amt-table__div">
                                #{match.match_number ?? "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMatch && (
        <ScoreModal
          match={selectedMatch}
          teams={teams}
          onClose={() => setSelectedMatch(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
