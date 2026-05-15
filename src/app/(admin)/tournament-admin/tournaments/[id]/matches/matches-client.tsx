"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
// "paper" 만 명시적 paper / 그 외 모두 "flutter" 로 간주.
function readRecordingMode(
  settings: Match["settings"]
): "flutter" | "paper" {
  if (!settings || typeof settings !== "object") return "flutter";
  return settings.recording_mode === "paper" ? "paper" : "flutter";
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

// 경기 상태별 텍스트 색상 - semantic CSS 변수 사용
const STATUS_COLOR: Record<string, string> = {
  pending: "text-[var(--color-text-muted)]",
  scheduled: "text-[var(--color-info)]",
  in_progress: "text-[var(--color-warning)]",
  completed: "text-[var(--color-success)]",
  cancelled: "text-[var(--color-error)]",
  bye: "text-[var(--color-text-muted)]",
};

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
  // 2026-05-11: Phase 1-A 매치별 기록 모드 토글 (Flutter 기록앱 vs 웹 종이 기록지).
  // 초기값 = 서버 settings.recording_mode (fallback "flutter").
  // 변경 시 save() 안에서 별도 endpoint /api/web/admin/matches/[id]/recording-mode 호출.
  const [recordingMode, setRecordingMode] = useState<"flutter" | "paper">(
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
        const next = recordingMode === "paper" ? "종이 기록지(웹)" : "Flutter 기록앱";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[20px] border border-[var(--color-border)] bg-[var(--color-card)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold">
          {match.roundName ?? "경기"} – {match.match_number ? `#${match.match_number}` : ""}
        </h3>

        {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
        {error && (
          <p className="mb-3 text-sm" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        {/* 팀 배정 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">홈팀</label>
            <select
              className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
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
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">원정팀</label>
            <select
              className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
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
            className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-3 text-center text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]"
          />
          <div className="text-center text-sm text-[var(--color-text-muted)]">:</div>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-3 text-center text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]"
          />
        </div>

        {/* 상태 */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-[var(--color-text-muted)]">상태</label>
          <select
            className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
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
          <label className="mb-1 block text-xs text-[var(--color-text-muted)]">승자 팀</label>
          <select
            className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
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
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">경기 일시</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">경기장</label>
            <input
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="경기장명"
              className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </div>

        {/* 2026-05-11: Phase 1-A — 매치별 기록 모드 토글.
            Flutter 기록앱 (기본) ↔ 종이 기록지(웹). 한 매치 = 한 모드 (충돌 자체 차단). */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
            기록 모드
          </label>
          <select
            className="w-full rounded-[12px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            value={recordingMode}
            onChange={(e) =>
              setRecordingMode(e.target.value as "flutter" | "paper")
            }
          >
            <option value="flutter">Flutter 기록앱 (기본)</option>
            <option value="paper">종이 기록지 (웹)</option>
          </select>
          {recordingMode === "paper" && (
            <>
              <p className="mt-1 text-xs" style={{ color: "var(--color-warning)" }}>
                ⚠ 종이 모드 — Flutter 앱에서 점수 입력이 차단됩니다.
              </p>
              {/* 2026-05-11: Phase 1-B-2 — paper 모드 매치는 종이 기록지 입력 페이지로 이동 */}
              {match.id && (
                <a
                  href={`/score-sheet/${match.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block rounded-[4px] px-3 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  📝 종이 기록지 입력 페이지로 이동 →
                </a>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">취소</Button>
          {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 (Tailwind arbitrary + color-mix, hover 10→20%) */}
          {/* 2026-05-12 — pill 9999px ❌ → rounded-[4px]. 위험 액션 = error 톤 보존 */}
          <button
            onClick={del}
            className="rounded-[4px] px-4 py-2 text-sm bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-error)_20%,transparent)] text-[var(--color-error)]"
          >
            삭제
          </button>
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? "저장 중..." : "저장"}
          </Button>
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
    return <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">불러오는 중...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            ← 대회 관리
          </Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">경기 관리</h1>
        </div>
        <div className="flex gap-2">
          {matches.length > 0 ? (
            <Button
              variant="secondary"
              onClick={() => generateBracket(true)}
              disabled={generating}
              className="text-xs"
            >
              {generating ? "생성 중..." : "대진표 재생성"}
            </Button>
          ) : (
            <Button onClick={() => generateBracket(false)} disabled={generating}>
              {generating ? "생성 중..." : "대진표 생성"}
            </Button>
          )}
        </div>
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-[12px] px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* 2026-05-12 — 종별 필터 (강남구협회장배 다중 종별 운영). 종별 2개 이상일 때만 표시. */}
      {hasDivisions && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">종별:</span>
          <button
            type="button"
            onClick={() => setDivisionFilter(null)}
            className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
              divisionFilter === null
                ? "bg-[var(--color-info)] text-white"
                : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
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
                className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  divisionFilter === code
                    ? "bg-[var(--color-info)] text-white"
                    : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
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
          <span className="text-xs text-[var(--color-text-muted)]">체육관:</span>
          <button
            type="button"
            onClick={() => setVenueFilter(null)}
            className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
              venueFilter === null
                ? "bg-[var(--color-info)] text-white"
                : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
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
                className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  venueFilter === v
                    ? "bg-[var(--color-info)] text-white"
                    : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span className="material-symbols-outlined align-middle" style={{ fontSize: 14, marginRight: 4 }}>
                  location_on
                </span>
                {v} ({count})
              </button>
            );
          })}
        </div>
      )}

      {matches.length === 0 ? (
        <Card className="py-16 text-center text-[var(--color-text-muted)]">
          <div className="mb-3 text-4xl">📋</div>
          <p className="mb-1 font-medium">경기가 없습니다</p>
          <p className="text-sm">
            승인된 팀이{" "}
            {/* 본문 정보 강조 = text-primary + font-semibold (빨강 본문 금지) */}
            <span className="text-[var(--color-text-primary)] font-semibold">
              {teams.filter((t) => t.status === "approved").length}팀
            </span>
            {" "}있습니다. 대진표를 생성하세요.
          </p>
        </Card>
      ) : filteredMatches.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <p className="text-sm">선택한 종별({divisionFilter})에 매치가 없습니다.</p>
        </Card>
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
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {roundLabel}
                </h2>
                <div className="space-y-2">
                  {roundMatches.map((match) => (
                    <div
                      key={match.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedMatch(match)}
                    >
                    <Card className="transition-colors hover:bg-[var(--color-elevated)]">
                      <div className="flex items-center gap-4">
                        {/* 경기 번호 */}
                        <span className="w-8 text-center text-xs text-[var(--color-text-muted)]">
                          #{match.match_number ?? "-"}
                        </span>

                        {/* 홈팀 */}
                        <div className="flex-1 text-right">
                          {/* 승자 팀명 = success 토큰 (승리=긍정 시맨틱). 빨강 본문 금지 */}
                          <p className={`font-semibold ${match.winner_team_id === match.homeTeamId && match.homeTeamId ? "text-[var(--color-success)] font-bold" : ""}`}>
                            {match.homeTeam?.team.name ?? "미정"}
                          </p>
                        </div>

                        {/* 점수 */}
                        <div className="flex items-center gap-2 text-center">
                          <span className="min-w-[2rem] text-xl font-bold">{match.homeScore}</span>
                          <span className="text-[var(--color-text-muted)]">:</span>
                          <span className="min-w-[2rem] text-xl font-bold">{match.awayScore}</span>
                        </div>

                        {/* 원정팀 */}
                        <div className="flex-1">
                          {/* 승자 팀명 = success 토큰 (승리=긍정 시맨틱). 빨강 본문 금지 */}
                          <p className={`font-semibold ${match.winner_team_id === match.awayTeamId && match.awayTeamId ? "text-[var(--color-success)] font-bold" : ""}`}>
                            {match.awayTeam?.team.name ?? "미정"}
                          </p>
                        </div>

                        {/* 상태 */}
                        <div className="w-20 text-right">
                          <span className={`text-xs ${STATUS_COLOR[match.status] ?? "text-[var(--color-text-muted)]"}`}>
                            {STATUS_LABEL[match.status] ?? match.status}
                          </span>
                          {match.scheduledAt && (
                            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                              {new Date(match.scheduledAt).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                    </div>
                  ))}
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
