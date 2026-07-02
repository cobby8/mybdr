# B1.2B Matches and Bracket Internals - Uploadable Markdown

Use this file after B1/B1.1 analysis. It contains only the remaining source files requested by Claude.ai.

## Request

- Update _qa/current-src-inventory.md with B1.2B source measurements.
- Extend _qa/reverse-bake-gap.md with B1.2B findings.
- Extend _qa/bake-fix-checklist-B1.md with B1.2B BDR-current reverse-bake steps.
- Keep scope to BDR-current reverse-bake checklist. Do not propose runtime API, Prisma, or route changes.
- Translate Toss/lucide/rounded-full/ui-kit patterns into BDR 13-rule equivalents in the checklist.

## Files

### File: src/app/(admin)/tournament-admin/tournaments/[id]/matches/matches-client.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
// 2026-05-16 PR-Admin-3 — placeholder 매치 검증 배너 (강남구협회장배 사고 재발 방지)
import { PlaceholderValidationBanner } from "../_components/PlaceholderValidationBanner";
// 2026-05-16 PR-Admin-2 — 단일 순위전 진출 trigger (teams 페이지 헤더에서 이동 박제)
import { AdvancePlayoffsButton } from "../_components/AdvancePlayoffsButton";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
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
        const next = recordingMode === "paper" ? "전자기록지" : "기록앱";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 no-print sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-y-auto rounded-[24px] border bg-[var(--card)] p-4 shadow-[var(--sh-lg)] sm:p-6"
        style={{ borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="ct-iconbtn absolute right-3 top-3" aria-label="닫기">
          <Icon name="x" size={20} />
        </button>
        <h3 className="mb-1 pr-10 text-lg font-bold text-[var(--ink)]">
          {match.roundName ?? "경기"} {match.match_number ? `#${match.match_number}` : ""}
        </h3>
        <p className="mb-4 text-sm text-[var(--ink-mute)]">{formatMatchTeams(match)}</p>

        {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
        {error && (
          <p className="mb-3 text-sm" style={{ color: "var(--color-error)" }}>
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
          <div className="text-center text-sm text-[var(--color-text-muted)]">:</div>
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
            Flutter 기록앱 (기본) ↔ 종이 기록지(웹). 한 매치 = 한 모드 (충돌 자체 차단). */}
        <div className="mb-3">
          <label className="ts-field__label">기록 방식</label>
          <select
            className="ts-select"
            value={recordingMode}
            onChange={(e) =>
              setRecordingMode(e.target.value as "flutter" | "paper")
            }
          >
            <option value="flutter">기록앱</option>
            <option value="paper">전자기록지</option>
          </select>
          {recordingMode === "paper" && (
            <>
              <p className="mt-1 text-xs" style={{ color: "var(--color-warning)" }}>
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
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={onClose} className="ts-btn ts-btn--secondary ts-btn--block sm:flex-1">
            취소
          </button>
          {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 (Tailwind arbitrary + color-mix, hover 10→20%) */}
          {/* 2026-05-12 — pill 9999px ❌ → rounded-[4px]. 위험 액션 = error 톤 보존 */}
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
    return <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">불러오는 중...</div>;

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

      {/* 2026-05-16 PR-Admin-3 — placeholder 매치 검증 배너 (강남구협회장배 사고 재발 방지).
          검출 0건 = null 반환 (배너 미표시) / 검출 ≥1건 = warning 톤 카드 + 펼치기 토글.
          현재 필터 적용된 매치만 검증 (운영자가 보고 있는 매치 = 검증 대상). */}
      <PlaceholderValidationBanner matches={filteredMatches} applyFilter />

      {/* 2026-05-12 — 종별 필터 (강남구협회장배 다중 종별 운영). 종별 2개 이상일 때만 표시. */}
      {hasDivisions && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">종별:</span>
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
          <span className="text-xs text-[var(--color-text-muted)]">체육관:</span>
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
        <Card className="py-16 text-center text-[var(--color-text-muted)]">
          <div className="mb-3 flex justify-center">
            <Icon name="calendar-plus" size={36} />
          </div>
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
                <div className="space-y-2 md:hidden">
                  {roundMatches.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => setSelectedMatch(match)}
                      className="w-full rounded-[16px] border bg-[var(--card)] p-4 text-left shadow-[var(--sh-sm)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-[var(--ink)]">{formatMatchTeams(match)}</p>
                          <p className="mt-1 text-xs text-[var(--ink-mute)]">
                            {formatMatchDate(match.scheduledAt)} · {match.venue_name ?? "코트 미정"} · {getMatchDivision(match) ?? "종별 미정"}
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold ${STATUS_COLOR[match.status] ?? "text-[var(--color-text-muted)]"}`}>
                          {STATUS_LABEL[match.status] ?? match.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono text-lg font-black text-[var(--ink)]">
                          {match.homeScore} : {match.awayScore}
                        </span>
                        <span className="text-xs font-semibold text-[var(--ink-mute)]">
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
                                <b className={match.winner_team_id === match.homeTeamId && match.homeTeamId ? "text-[var(--color-success)]" : ""}>
                                  {match.homeTeam?.team.name ?? "미정"}
                                </b>
                                <span className="vs">대</span>
                                <b className={match.winner_team_id === match.awayTeamId && match.awayTeamId ? "text-[var(--color-success)]" : ""}>
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
                              <span className={`text-xs font-semibold ${STATUS_COLOR[match.status] ?? "text-[var(--color-text-muted)]"}`}>
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

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/bracket-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// 2026-05-04 (P4) — 듀얼 조 배정 에디터 (16팀 → 4그룹 배정 + 페어링 모드 + 저장/생성)
import { DualGroupAssignmentEditor } from "../bracket/_components/dual-group-assignment-editor";
import { PanelLoadingState } from "./panel-loading-state";
import type { SemifinalPairingMode } from "@/lib/tournaments/dual-defaults";
// 2026-05-16 PR-Admin-1 — 단계간 CTA (페이지 footer "다음: 경기 관리 →")
import { NextStepCTA } from "../_components/NextStepCTA";
// 2026-05-16 PR-Admin-4 — 종별 단위 매치 generator trigger (DivisionBracketSections 헤더 박제)
import { DivisionGenerateButton } from "../_components/DivisionGenerateButton";

const MAX_FREE_VERSIONS = 3;

type TeamInfo = { id: string; team: { name: string; primaryColor: string | null } };

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
  // Phase D: dual_tournament 5섹션 그룹핑 + 빈 슬롯 라벨 + 일정/장소 표시용
  // apiSuccess() 가 응답 키를 자동 snake_case 로 변환하므로,
  // 응답에 실제 도착하는 키 (snake_case) + 코드 안전성 위한 camelCase 폴백 둘 다 옵셔널 정의
  group_name?: string | null;
  settings?: {
    homeSlotLabel?: string | null;
    awaySlotLabel?: string | null;
    home_slot_label?: string | null;
    away_slot_label?: string | null;
    // 2026-05-12 — 강남구협회장배 D 진단: 6 종별 매치 안 division_code 박제 / 그룹핑 분기용
    division_code?: string | null;
  } | null;
  scheduledAt?: string | null;
  scheduled_at?: string | null;
  venue_name?: string | null;
  court_number?: string | null;
};

type ApprovedTeam = { id: string; seedNumber: number | null; team: { name: string } };

type BracketVersion = {
  id: string;
  version_number: number;
  created_at: string;
  is_active: boolean;
};

type BracketData = {
  canCreate: boolean;
  needsApproval: boolean;
  currentVersion: number;
  activeVersion: number | null;
  versions: BracketVersion[];
  matches: Match[];
  approvedTeams: ApprovedTeam[];
  /** 풀리그/토너먼트 UI 분기용 — API 가 함께 내려줌 */
  format: string | null;
  // 2026-05-04 (P4) — settings.bracket (dual 조 배정 + 페어링 모드 복원용)
  // apiSuccess() 자동 변환으로 settings 안 키는 snake_case 가능 — 옵셔널로 안전 분기
  settings?: {
    bracket?: {
      groupAssignment?: Record<string, Array<string | number>>;
      group_assignment?: Record<string, Array<string | number>>;
      semifinalPairing?: SemifinalPairingMode;
      semifinal_pairing?: SemifinalPairingMode;
    } | null;
  } | null;
  // 2026-05-16 PR-Admin-4 — 종별 단위 generator 버튼이 code → ruleId 매핑에 사용
  // 옵셔널: divisionRules 미박제 대회는 빈 배열 → 버튼 비노출
  divisionRules?: Array<{
    id: string;
    code: string;
    format: string | null;
  }>;
};

// 풀리그 계열 포맷 판별 — UI 분기용
function isLeagueFormat(fmt: string | null | undefined): boolean {
  return fmt === "round_robin" || fmt === "full_league" || fmt === "full_league_knockout";
}

// 듀얼토너먼트 포맷 판별 — Phase D 5섹션 그룹핑 분기용
function isDualFormat(fmt: string | null | undefined): boolean {
  return fmt === "dual_tournament";
}

// 2026-05-12 — 다중 종별 (division) 분기 헬퍼 (강남구협회장배 케이스).
// 매치 settings.division_code 가 2개 이상이면 division 우선 그룹핑.
// 단일 division (전통 dual_tournament 1대회) = DUAL_STAGES 5섹션 그대로 사용.
function getDivisionCode(m: Match): string | null {
  const s = (m.settings ?? {}) as Record<string, unknown>;
  return (s.division_code as string) ?? null;
}
function hasMultipleDivisions(matches: Match[]): boolean {
  const codes = new Set(matches.map(getDivisionCode).filter((c): c is string => !!c));
  return codes.size > 1;
}

// 일정 표시 — KST yyyy.MM.dd HH:mm
// 응답 키가 scheduled_at (snake_case) / scheduledAt (camelCase) 어느 쪽이든 안전 처리
function formatSchedule(m: { scheduledAt?: string | null; scheduled_at?: string | null }): string {
  const iso = m.scheduledAt ?? m.scheduled_at ?? null;
  if (!iso) return "일정 미정";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 장소 표시 — venue_name 있으면 우선, court_number 보조
function formatVenue(m: Match): string {
  const venue = m.venue_name?.trim();
  const court = m.court_number?.trim();
  if (venue && court) return `${venue} · ${court}`;
  if (venue) return venue;
  if (court) return court;
  return "장소 미정";
}

// 빈 팀 슬롯 라벨 — 팀 확정이면 팀명, 아니면 settings 의 슬롯 라벨, 그래도 없으면 "미정"
function slotLabel(team: TeamInfo | null, fallback: string | null | undefined): string {
  if (team) return team.team.name;
  if (fallback && fallback.trim()) return fallback;
  return "미정";
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

export default function BracketAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generate = async (clear = false) => {
    if (clear && !confirm("기존 경기를 모두 삭제하고 재생성하시겠습니까?")) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "생성 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setGenerating(false);
    }
  };

  const activate = async () => {
    setActivating(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, { method: "PATCH" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "확정 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setActivating(false);
    }
  };

  const updateMatchTeam = async (matchId: string, field: "homeTeamId" | "awayTeamId", value: string | null) => {
    setSavingMatch(matchId);
    try {
      await fetch(`/api/web/tournaments/${id}/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      await load();
    } catch { /* ignore */ } finally {
      setSavingMatch(null);
    }
  };

  if (loading) return <PanelLoadingState label="대진 정보를 준비 중입니다." />;

  // 풀리그는 라운드 개념이 없어 "1라운드 팀 배치 편집"을 숨긴다
  // 듀얼토너먼트는 27 매치를 5섹션으로 표시 — 기존 1라운드 편집/전체 목록 UI 숨기고 dual 전용 섹션 사용
  const isLeague = isLeagueFormat(data?.format);
  const isDual = isDualFormat(data?.format);
  // 1라운드 팀 배치 편집: single elim 만 노출 (league/dual 은 숨김)
  const round1Matches = isLeague || isDual ? [] : (data?.matches.filter((m) => m.round_number === 1) ?? []);
  const hasMatches = (data?.matches.length ?? 0) > 0;
  const versionUsed = data?.currentVersion ?? 0;
  const versionLimit = MAX_FREE_VERSIONS;
  const canGenerate = versionUsed < versionLimit;
  const isActivated = data?.activeVersion != null;
  // 풀리그 예상 경기 수 = n*(n-1)/2
  const approvedCount = data?.approvedTeams?.length ?? 0;
  const expectedLeagueMatches = approvedCount >= 2 ? (approvedCount * (approvedCount - 1)) / 2 : 0;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in (하위 섹션·모달 DOM 상속)
    <div data-skin="toss">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/tournament-admin/tournaments/${id}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          {isLeague ? "풀리그 경기 생성" : "대진표 생성"}
        </h1>
        {isLeague && approvedCount >= 2 && !hasMatches && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            승인된 {approvedCount}팀 기준 총 {expectedLeagueMatches}경기가 생성됩니다.
            {/* Phase 2C: full_league_knockout이면 토너먼트 뼈대도 함께 생성됨을 안내 */}
            {data?.format === "full_league_knockout" && (
              <>
                {" "}
                <span className="text-[var(--color-text-secondary)]">
                  풀리그 경기와 토너먼트 뼈대가 함께 생성됩니다. (토너먼트 슬롯은 리그 완료 후 자동 채워집니다)
                </span>
              </>
            )}
          </p>
        )}
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

      {/* 버전 현황 */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">생성 횟수</p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: versionLimit }).map((_, i) => (
                <div
                  key={i}
                  // 2026-05-12 — admin 빨강 본문 금지 (버전 사용량 dot) → info(Navy)
                  className={`h-3 w-8 rounded-full ${
                    i < versionUsed ? "bg-[var(--color-info)]" : "bg-[var(--color-border)]"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                {versionUsed}/{versionLimit} 사용
              </span>
            </div>
            {!canGenerate && (
              <p className="mt-1 text-xs text-[var(--color-error)]">
                슈퍼관리자 승인 후 추가 생성 가능합니다.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isActivated && (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] px-3 py-1 text-xs font-medium text-[var(--color-success)]">
                ✓ 확정됨 (v{data?.activeVersion})
              </span>
            )}
            {/* 2026-05-12 — pill 9999px ❌ + admin 빨강 본문 금지 룰 → rounded-[4px] + info(Navy) 토큰 */}
            {hasMatches && (
              <button
                onClick={activate}
                disabled={activating || isActivated}
                className="rounded-[4px] bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)] px-4 py-2 text-sm font-medium text-[var(--color-info)] hover:bg-[color-mix(in_srgb,var(--color-info)_15%,transparent)] disabled:opacity-50"
              >
                {activating ? "처리 중..." : "최신 버전 확정"}
              </button>
            )}
            {hasMatches ? (
              <Button
                variant="secondary"
                onClick={() => generate(true)}
                disabled={generating || !canGenerate}
                className="text-sm"
              >
                {generating ? "생성 중..." : "재생성"}
              </Button>
            ) : (
              <Button
                onClick={() => generate(false)}
                disabled={generating || !canGenerate}
              >
                {generating ? "생성 중..." : isLeague ? "경기 자동 생성" : "대진표 생성"}
              </Button>
            )}
          </div>
        </div>

        {/* 버전 히스토리 */}
        {(data?.versions.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
            <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">버전 히스토리</p>
            <div className="flex flex-wrap gap-2">
              {data?.versions.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                    v.is_active
                      ? "bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]"
                      : "bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="font-medium">v{v.version_number}</span>
                  <span>{new Date(v.created_at).toLocaleDateString("ko-KR")}</span>
                  {v.is_active && <span>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 1라운드 팀 배치 편집 */}
      {round1Matches.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            1라운드 팀 배치 편집
          </h2>
          <div className="space-y-3">
            {round1Matches.map((match) => (
              <Card key={match.id} className={match.status === "bye" ? "opacity-60" : ""}>
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-center text-xs text-[var(--color-text-muted)]">
                    #{match.match_number ?? "-"}
                  </span>

                  {/* 홈팀 */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[var(--color-text-muted)]">홈팀</label>
                    <select
                      disabled={match.status === "bye" || savingMatch === match.id}
                      value={match.homeTeamId ?? ""}
                      onChange={(e) => updateMatchTeam(match.id, "homeTeamId", e.target.value || null)}
                      className="w-full rounded-[10px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
                    >
                      <option value="">미정</option>
                      {data?.approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.team.name}</option>
                      ))}
                    </select>
                  </div>

                  <span className="mt-4 text-[var(--color-text-muted)]">vs</span>

                  {/* 원정팀 */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[var(--color-text-muted)]">원정팀</label>
                    <select
                      disabled={match.status === "bye" || savingMatch === match.id}
                      value={match.awayTeamId ?? ""}
                      onChange={(e) => updateMatchTeam(match.id, "awayTeamId", e.target.value || null)}
                      className="w-full rounded-[10px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
                    >
                      <option value="">미정</option>
                      {data?.approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.team.name}</option>
                      ))}
                    </select>
                  </div>

                  {match.status === "bye" && (
                    <span className="mt-4 rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                      부전승
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 2026-05-04 (P4) — dual_tournament + 매치 0건 → 조 배정 에디터 표시
          매치 생성된 5/2 영향 0 (hasMatches 가 true 면 진입 X) */}
      {!hasMatches && isDual && (data?.approvedTeams.length ?? 0) === 16 && (
        <DualGroupAssignmentEditor
          tournamentId={id}
          approvedTeams={data?.approvedTeams ?? []}
          // settings.bracket 의 groupAssignment 복원 — apiSuccess snake_case 변환 양쪽 폴백
          initialAssignment={
            (data?.settings?.bracket?.groupAssignment ??
              data?.settings?.bracket?.group_assignment) as
              | Record<"A" | "B" | "C" | "D", string[]>
              | undefined
          }
          initialPairing={
            data?.settings?.bracket?.semifinalPairing ??
            data?.settings?.bracket?.semifinal_pairing
          }
          onGenerate={() => generate(false)}
          onSaved={() => load()}
          generating={generating}
          canGenerate={canGenerate}
        />
      )}

      {/* Phase D: dual_tournament 일 때 5섹션 그룹핑 UI 우선 표시.
          2026-05-12 — 다중 종별 (예: 강남구협회장배 6종 × 매치들) 케이스 분기:
          settings.division_code 가 2개 이상이면 종별 우선 그룹핑 (DivisionBracketSections).
          그렇지 않으면 기존 단일 대회 5섹션 그룹핑. */}
      {hasMatches && isDual && hasMultipleDivisions(data?.matches ?? []) && (
        <DivisionBracketSections
          matches={data?.matches ?? []}
          tournamentId={id}
          // 2026-05-16 PR-Admin-4 — 종별 단위 generator 버튼이 ruleId 매핑 + refetch 에 사용
          divisionRules={data?.divisionRules ?? []}
          onDivisionGenerated={() => load()}
        />
      )}
      {hasMatches && isDual && !hasMultipleDivisions(data?.matches ?? []) && (
        <DualBracketSections
          matches={data?.matches ?? []}
          tournamentId={id}
        />
      )}

      {/* 전체 경기 목록 — single elim / 풀리그 등 dual 외 포맷 */}
      {hasMatches && !isDual && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              전체 경기 ({data?.matches.length}경기)
            </h2>
            <Link
              href={`/tournament-admin/tournaments/${id}#matches`}
              className="text-xs text-[var(--color-info)] hover:underline"
            >
              경기 관리로 이동 →
            </Link>
          </div>
          <div className="space-y-1.5">
            {Array.from(new Set(data?.matches.map((m) => m.round_number))).sort((a, b) => (a ?? 0) - (b ?? 0)).map((rn) => {
              const rMatches = data?.matches.filter((m) => m.round_number === rn) ?? [];
              return (
                <div key={rn ?? "x"}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    {rMatches[0]?.roundName ?? (rn != null ? `라운드 ${rn}` : "라운드 미정")}
                  </p>
                  {rMatches.map((m) => (
                    <div key={m.id} className="mb-1 flex items-center gap-2 rounded-[10px] bg-[var(--color-surface)] px-3 py-2 text-sm">
                      <span className="w-5 text-center text-xs text-[var(--color-text-muted)]">#{m.match_number ?? "-"}</span>
                      <span className={`flex-1 text-right font-medium ${m.homeTeamId == null ? "text-[var(--color-text-muted)]" : ""}`}>
                        {m.homeTeam?.team.name ?? "미정"}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">vs</span>
                      <span className={`flex-1 font-medium ${m.awayTeamId == null ? "text-[var(--color-text-muted)]" : ""}`}>
                        {m.awayTeam?.team.name ?? "미정"}
                      </span>
                      <span className={`text-xs ${STATUS_LABEL[m.status] ? "text-[var(--color-text-muted)]" : ""}`}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasMatches && (
        <Card className="py-16 text-center text-[var(--color-text-muted)]">
          <div className="mb-3 text-4xl">🏆</div>
          <p className="font-medium">
            {isLeague
              ? "생성된 경기가 없습니다"
              : isDual
                ? "듀얼토너먼트 대진표가 없습니다"
                : "대진표가 없습니다"}
          </p>
          <p className="mt-1 text-sm">
            승인된 팀 {approvedCount}팀이 있습니다.
            {isLeague && approvedCount >= 2 && (
              <> · 생성 시 {expectedLeagueMatches}경기가 만들어집니다.</>
            )}
            {isDual && approvedCount === 16 && (
              <> · 생성 시 27경기 (조별 16 + 조별최종 4 + 8강 4 + 4강 2 + 결승 1) 가 만들어집니다.</>
            )}
            {isDual && approvedCount !== 16 && (
              <> · 듀얼토너먼트는 정확히 16팀이 필요합니다.</>
            )}
          </p>
        </Card>
      )}

      {/* 2026-05-16 PR-Admin-1 — 단계간 CTA (admin-flow-audit §3 단계 7 단절 해소) */}
      <NextStepCTA tournamentId={id} currentStep="bracket" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Phase D: Dual Tournament 5섹션 그룹핑 컴포넌트
// 27 매치를 5단계로 명확히 보여줌 (조별 / 조별최종전 / 8강 / 4강 / 결승)
// 각 섹션 collapsed/expanded 토글 (UX 개선 — 27매치 한 화면 표시 시 길어짐)
// ────────────────────────────────────────────────────────────────────────────

// dual 5단계 메타 — round_number 매핑
type DualStage = {
  key: string;
  label: string;
  // 매치 필터 — round_number 배열
  rounds: number[];
  // 조별 추가 그룹핑 여부 (Stage 1 만 true)
  groupByGroup: boolean;
};

const DUAL_STAGES: DualStage[] = [
  { key: "stage1", label: "조별 미니 더블엘리미", rounds: [1, 2], groupByGroup: true },
  { key: "stage2", label: "조별 최종전 (2위 결정)", rounds: [3], groupByGroup: false },
  { key: "stage3", label: "8강", rounds: [4], groupByGroup: false },
  { key: "stage4", label: "4강", rounds: [5], groupByGroup: false },
  { key: "stage5", label: "결승", rounds: [6], groupByGroup: false },
];

function DualBracketSections({
  matches,
  tournamentId,
}: {
  matches: Match[];
  tournamentId: string;
}) {
  // 모든 섹션 기본 펼침. 사용자가 접고 싶을 때만 접도록.
  // 이유: 관리자가 점수 입력 시 한 번에 보여야 효율적
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 단계별 매치 분류 — 1회만 계산
  const stageMatches = DUAL_STAGES.map((stage) => ({
    ...stage,
    matches: matches.filter(
      (m) => m.round_number != null && stage.rounds.includes(m.round_number),
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          듀얼토너먼트 ({matches.length}경기)
        </h2>
        <Link
          href={`/tournament-admin/tournaments/${tournamentId}#matches`}
          className="text-xs text-[var(--color-info)] hover:underline"
        >
          경기 관리로 이동 →
        </Link>
      </div>

      {stageMatches.map((stage) => {
        const isCollapsed = collapsed[stage.key] === true;
        const count = stage.matches.length;

        return (
          <Card key={stage.key} className="!p-0 overflow-hidden">
            {/* 섹션 헤더 — 클릭 시 토글 */}
            <button
              type="button"
              onClick={() => toggle(stage.key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-elevated)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  {stage.label}
                </span>
                <span className="rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {count}경기
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {isCollapsed ? "펼치기 ▼" : "접기 ▲"}
              </span>
            </button>

            {/* 섹션 본문 */}
            {!isCollapsed && (
              <div className="border-t border-[var(--color-border-subtle)] p-3">
                {stage.groupByGroup ? (
                  // Stage 1: A/B/C/D 4조 추가 그룹핑
                  <DualGroupedMatches matches={stage.matches} />
                ) : (
                  // Stage 2~5: 단순 리스트
                  <div className="space-y-2">
                    {stage.matches.length === 0 ? (
                      <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
                        해당 단계 경기가 없습니다.
                      </p>
                    ) : (
                      stage.matches.map((m) => <DualMatchCard key={m.id} match={m} />)
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// Stage 1 전용 — A/B/C/D 조별로 한번 더 묶기
function DualGroupedMatches({ matches }: { matches: Match[] }) {
  // 조 키 추출 (group_name 기준 — A/B/C/D 순)
  // 이유: generator 가 group_name 으로 구분 저장. round_number 만으로는 조 구분 불가
  const groupKeys = ["A", "B", "C", "D"] as const;

  return (
    <div className="space-y-3">
      {groupKeys.map((g) => {
        const groupMatches = matches
          .filter((m) => m.group_name === g)
          // round_number 1 (G1/G2) → 2 (승자전/패자전) 순 + match_number 보조 정렬
          .sort((a, b) => {
            const r = (a.round_number ?? 0) - (b.round_number ?? 0);
            if (r !== 0) return r;
            return (a.match_number ?? 0) - (b.match_number ?? 0);
          });

        if (groupMatches.length === 0) return null;

        return (
          <div key={g} className="rounded-[8px] bg-[var(--color-surface)] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {g}조 ({groupMatches.length}경기)
            </p>
            <div className="space-y-2">
              {groupMatches.map((m) => <DualMatchCard key={m.id} match={m} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 듀얼 전용 매치 카드 — HOME/AWAY + 빈 슬롯 라벨 + 일정/장소 + 점수
function DualMatchCard({ match }: { match: Match }) {
  // 빈 슬롯 라벨 — settings JSON 의 homeSlotLabel/awaySlotLabel
  // apiSuccess() 자동 변환으로 키가 home_slot_label / away_slot_label 일 가능성 모두 폴백
  const homeFallback = match.settings?.homeSlotLabel ?? match.settings?.home_slot_label;
  const awayFallback = match.settings?.awaySlotLabel ?? match.settings?.away_slot_label;
  const homeLabel = slotLabel(match.homeTeam, homeFallback);
  const awayLabel = slotLabel(match.awayTeam, awayFallback);
  const isHomeUndecided = match.homeTeam == null;
  const isAwayUndecided = match.awayTeam == null;
  // 점수 비교로 승패 표시 (status=completed 일 때만)
  // 향후 winner_team_id 기반 정확 판정으로 대체 가능
  const completed = match.status === "completed";
  const homeWon = completed && match.homeScore > match.awayScore;
  const awayWon = completed && match.awayScore > match.homeScore;

  return (
    <div className="rounded-[8px] bg-[var(--color-elevated)] p-3">
      {/* 상단 메타 — 매치번호 / 라운드명 / 상태 */}
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[var(--color-text-muted)]">
            #{match.match_number ?? "-"}
          </span>
          <span className="font-medium text-[var(--color-text-secondary)]">
            {match.roundName ?? (match.round_number != null ? `라운드 ${match.round_number}` : "라운드 미정")}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 ${
            completed
              ? "bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]"
              : match.status === "in_progress"
                ? "bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-[var(--color-info)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
          }`}
        >
          {STATUS_LABEL[match.status] ?? match.status}
        </span>
      </div>

      {/* 일정 / 장소 — 모바일에서도 한 줄 유지 (작게) */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[var(--color-text-muted)]">
        <span>{formatSchedule(match)}</span>
        <span>·</span>
        <span>{formatVenue(match)}</span>
      </div>

      {/* 팀 + 점수 */}
      <div className="flex items-center gap-2">
        {/* HOME */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span
            className={`flex-1 truncate text-sm ${
              isHomeUndecided
                ? "italic text-[var(--color-text-muted)]"
                : homeWon
                  ? "font-bold text-[var(--color-text-primary)]"
                  : "font-medium text-[var(--color-text-primary)]"
            }`}
            title={homeLabel}
          >
            {homeLabel}
          </span>
          <span
            className={`min-w-[28px] text-right text-sm tabular-nums ${
              homeWon ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {completed ? match.homeScore : "-"}
          </span>
        </div>

        <span className="text-xs text-[var(--color-text-muted)]">vs</span>

        {/* AWAY */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span
            className={`min-w-[28px] text-sm tabular-nums ${
              awayWon ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {completed ? match.awayScore : "-"}
          </span>
          <span
            className={`flex-1 truncate text-sm ${
              isAwayUndecided
                ? "italic text-[var(--color-text-muted)]"
                : awayWon
                  ? "font-bold text-[var(--color-text-primary)]"
                  : "font-medium text-[var(--color-text-primary)]"
            }`}
            title={awayLabel}
          >
            {awayLabel}
          </span>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// 2026-05-12 — 다중 종별 (Division) 대진표 (강남구협회장배 D 진단 fix)
// ============================================================================
//
// 배경:
//   - format='dual_tournament' 대회에 6 종별 (i3-U9 / i2-U11 / i3-U11 / i2-U12 / i3w-U12 / i3-U14)
//     각각 매치 INSERT 됐지만 round_number / group_name 모두 null
//   - 기존 DUAL_STAGES (1~6 라운드) 매핑 실패 → 대진표 0/0/0/0/0 표시
//   - 매치 settings.division_code 만 박제 + roundName (자유 텍스트) 있음
//
// 해결:
//   - 종별 우선 그룹화 (6 종별 카드)
//   - 각 종별 안에서 roundName 으로 sub-그룹화 (예선 1경기 / 예선 2경기 / 결승 등)
//   - roundName 없으면 "기타" 그룹
function DivisionBracketSections({
  matches,
  tournamentId,
  divisionRules,
  onDivisionGenerated,
}: {
  matches: Match[];
  tournamentId: string;
  // 2026-05-16 PR-Admin-4 — divisionCode → ruleId/format 매핑 (DivisionGenerateButton 인자)
  divisionRules: Array<{ id: string; code: string; format: string | null }>;
  // 2026-05-16 PR-Admin-4 — 종별 단위 generator 성공 시 부모 load() 호출 (refetch)
  onDivisionGenerated?: () => void;
}) {
  // divisionCode → rule 빠른 조회용 Map (렌더 1회 빌드)
  const ruleByCode = new Map(divisionRules.map((r) => [r.code, r]));
  // 종별 collapsed/expanded 토글 (기본 펼침)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setCollapsed((prev) => ({ ...prev, [k]: !prev[k] }));
  // 2026-05-12 — 종별 단일 선택 필터 (운영자 격리 보기). null = 전체.
  const [divisionFilter, setDivisionFilter] = useState<string | null>(null);

  // 종별 그룹화 — division_code 기준
  const groupedByDivision = matches.reduce<Map<string, Match[]>>((map, m) => {
    const code = getDivisionCode(m) ?? "_no_division";
    if (!map.has(code)) map.set(code, []);
    map.get(code)!.push(m);
    return map;
  }, new Map());

  // 정렬 — 종별 코드 알파벳 순
  const divisionEntries = Array.from(groupedByDivision.entries()).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  // 필터 적용 — 선택 종별 1개 또는 전체
  const visibleEntries = divisionFilter === null
    ? divisionEntries
    : divisionEntries.filter(([code]) => code === divisionFilter);

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          종별 대진표 ({matches.length}경기 / {divisionEntries.length}종별)
        </h2>
        <Link
          href={`/tournament-admin/tournaments/${tournamentId}#matches`}
          className="text-xs text-[var(--color-info)] hover:underline"
        >
          경기 관리로 이동 →
        </Link>
      </div>

      {/* 2026-05-12 — 종별 필터 (전체 / 종별 1개 선택) */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
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
        {divisionEntries.map(([code, divMatches]) => (
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
            {code === "_no_division" ? "종별 미지정" : code} ({divMatches.length})
          </button>
        ))}
      </div>

      {visibleEntries.map(([divCode, divMatches]) => {
        const isCollapsed = collapsed[divCode] === true;

        // 종별 안에서 roundName 으로 sub-그룹화
        const byRoundName = divMatches.reduce<Map<string, Match[]>>((m, match) => {
          const key = (match.roundName ?? "").trim() || "기타";
          if (!m.has(key)) m.set(key, []);
          m.get(key)!.push(match);
          return m;
        }, new Map());

        // roundName 정렬 — 자연어 순 (예선 1경기 < 예선 2경기 < ... < 결승)
        const roundEntries = Array.from(byRoundName.entries()).sort(([a], [b]) =>
          a.localeCompare(b, "ko-KR", { numeric: true })
        );

        return (
          <Card key={divCode} className="!p-0 overflow-hidden">
            {/* 종별 헤더 — 토글 + deep link */}
            <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-[var(--color-elevated)] transition-colors">
              <button
                type="button"
                onClick={() => toggle(divCode)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  {divCode === "_no_division" ? "종별 미지정" : divCode}
                </span>
                <span className="rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {divMatches.length}경기
                </span>
              </button>
              <div className="flex items-center gap-2">
                {/* 2026-05-16 PR-Admin-4 — 종별 단위 매치 generator 버튼.
                    rule 매칭 + 지원 format 일 때만 노출 (DivisionGenerateButton 내부 가드 중복).
                    "_no_division" 매치는 ruleId 없으므로 버튼 비노출. */}
                {divCode !== "_no_division" && ruleByCode.has(divCode) && (
                  <DivisionGenerateButton
                    tournamentId={tournamentId}
                    ruleId={ruleByCode.get(divCode)!.id}
                    divisionCode={divCode}
                    divisionFormat={ruleByCode.get(divCode)!.format}
                    hasMatches={divMatches.length > 0}
                    onSuccess={onDivisionGenerated}
                  />
                )}
                {/* 2026-05-12 Phase 3.5-B — 종별 deep link → matches 페이지 자동 필터 */}
                {divCode !== "_no_division" && (
                  <Link
                    href={`/tournament-admin/tournaments/${tournamentId}#matches`}
                    className="text-xs text-[var(--color-info)] hover:underline"
                  >
                    경기 관리 →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => toggle(divCode)}
                  className="text-xs text-[var(--color-text-muted)]"
                >
                  {isCollapsed ? "펼치기 ▼" : "접기 ▲"}
                </button>
              </div>
            </div>

            {/* 본문 — roundName 별 sub-그룹 */}
            {!isCollapsed && (
              <div className="border-t border-[var(--color-border-subtle)] p-3">
                {roundEntries.map(([roundName, rMatches]) => (
                  <div key={roundName} className="mb-3 last:mb-0">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      {roundName} ({rMatches.length})
                    </p>
                    <div className="space-y-1">
                      {rMatches.map((m) => (
                        <DualMatchCard key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/bracket/_components/dual-group-assignment-editor.tsx

````tsx
"use client";

// 듀얼 토너먼트 조 배정 에디터 (2026-05-04 P4 신설)
//
// 이유: 듀얼 토너먼트는 16팀을 4그룹 (A/B/C/D × 4팀) 으로 배정해야 매치 생성 가능.
//       기존엔 운영자가 settings.bracket.groupAssignment 를 수동 JSON 으로 입력해야 했음.
//       이제는 admin UI 에서 select dropdown 으로 직관적 배정 + 저장 + 자동 매치 생성.
//
// 동작:
//   1) 승인된 16팀을 받아 select 16개 (4×4 그리드) 로 표시
//   2) 자동 시드 추천 버튼 — seedNumber 또는 팀 등록 순서로 자동 채우기
//   3) 저장 버튼 — settings.bracket.groupAssignment + semifinalPairing PATCH /api/web/tournaments/[id]
//   4) 자동 매치 생성 버튼 — POST /api/web/tournaments/[id]/bracket (저장된 settings 기반 27매치 생성)
//
// 5/2 영향 0: 본 컴포넌트는 매치 0건 + 미배정 상태에서만 의미 있음.
//             기존 27매치가 있는 5/2 대회는 이 UI 진입 X (page.tsx 가 hasMatches 분기 처리).

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DUAL_DEFAULT_PAIRING,
  type SemifinalPairingMode,
} from "@/lib/tournaments/dual-defaults";

// 4조 키 (UI 순서 고정 = 매치 생성 순서와 동일)
const GROUP_KEYS = ["A", "B", "C", "D"] as const;
type GroupKey = (typeof GROUP_KEYS)[number];

// 한 조당 4팀 슬롯 — string("") = 미배정, teamId = 배정
type GroupSlots = [string, string, string, string];
type GroupAssignment = Record<GroupKey, GroupSlots>;

export type ApprovedTeamLite = {
  id: string;
  seedNumber: number | null;
  team: { name: string };
};

type Props = {
  tournamentId: string;
  approvedTeams: ApprovedTeamLite[];
  // 저장된 기존 배정 (settings.bracket.groupAssignment)
  initialAssignment?: Partial<Record<GroupKey, string[]>>;
  // 저장된 페어링 모드 (settings.bracket.semifinalPairing)
  initialPairing?: SemifinalPairingMode;
  // 매치 생성 트리거 — page.tsx 의 generate(false) 호출 (저장 → 생성 두 단계)
  onGenerate: () => void | Promise<void>;
  // 저장 완료 후 부모가 다시 fetch 하도록 알림 (옵션)
  onSaved?: () => void;
  // 매치 0건 + 활성화 가능 여부 (이미 매치 있으면 disabled)
  generating?: boolean;
  canGenerate?: boolean;
};

// 빈 배정 — 16 슬롯 모두 ""
function emptyAssignment(): GroupAssignment {
  return {
    A: ["", "", "", ""],
    B: ["", "", "", ""],
    C: ["", "", "", ""],
    D: ["", "", "", ""],
  };
}

// initialAssignment 를 4×4 슬롯으로 변환 (부족하면 "" 패딩)
function fromInitial(
  initial: Partial<Record<GroupKey, string[]>> | undefined,
): GroupAssignment {
  const a = emptyAssignment();
  if (!initial) return a;
  for (const key of GROUP_KEYS) {
    const list = initial[key] ?? [];
    a[key] = [
      list[0] ?? "",
      list[1] ?? "",
      list[2] ?? "",
      list[3] ?? "",
    ] as GroupSlots;
  }
  return a;
}

export function DualGroupAssignmentEditor({
  tournamentId,
  approvedTeams,
  initialAssignment,
  initialPairing,
  onGenerate,
  onSaved,
  generating = false,
  canGenerate = true,
}: Props) {
  // 배정 상태 (조-슬롯 → teamId)
  const [assignment, setAssignment] = useState<GroupAssignment>(() =>
    fromInitial(initialAssignment),
  );
  // 4강 페어링 모드 — 운영자 변경 가능 (default = sequential)
  const [pairing, setPairing] = useState<SemifinalPairingMode>(
    initialPairing ?? DUAL_DEFAULT_PAIRING,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedOnce, setSavedOnce] = useState(false);

  // initialAssignment / initialPairing 이 늦게 도착해도 동기화 (페이지 첫 fetch 후)
  // 단 사용자가 이미 변경했으면 덮어쓰지 않기 위해 savedOnce 체크
  useEffect(() => {
    if (savedOnce) return;
    setAssignment(fromInitial(initialAssignment));
    setPairing(initialPairing ?? DUAL_DEFAULT_PAIRING);
  }, [initialAssignment, initialPairing, savedOnce]);

  // 사용된 teamId 모음 (다른 슬롯에서 disable 처리용)
  const usedTeamIds = useMemo(() => {
    const used = new Set<string>();
    for (const key of GROUP_KEYS) {
      for (const id of assignment[key]) {
        if (id) used.add(id);
      }
    }
    return used;
  }, [assignment]);

  // 한 슬롯 변경
  function setSlot(group: GroupKey, slotIdx: number, teamId: string) {
    setAssignment((prev) => {
      const next = { ...prev };
      const slots = [...next[group]] as GroupSlots;
      slots[slotIdx] = teamId;
      next[group] = slots;
      return next;
    });
  }

  // 자동 시드 추천 — seedNumber 우선 (없으면 등록 순서) → 4×4 분배
  // 분배 패턴: seed 1·5·9·13 → A조 1번슬롯, B조 1번슬롯 ... (snake draft 변형)
  // 단순화: 1~4 = A조, 5~8 = B조, ... 순차 (운영자가 추후 swap 가능)
  function autoSeed() {
    if (approvedTeams.length !== 16) {
      setSaveError(`승인된 팀이 정확히 16팀이어야 합니다 (현재 ${approvedTeams.length}팀).`);
      return;
    }
    const sorted = [...approvedTeams].sort((a, b) => {
      // seedNumber 우선 (낮은 숫자 = 상위 시드)
      const sA = a.seedNumber ?? Number.MAX_SAFE_INTEGER;
      const sB = b.seedNumber ?? Number.MAX_SAFE_INTEGER;
      if (sA !== sB) return sA - sB;
      // tie-break: id (등록 순서 근사)
      return a.id.localeCompare(b.id);
    });
    const next: GroupAssignment = emptyAssignment();
    for (let i = 0; i < 16; i++) {
      // 1~4 = A조, 5~8 = B조, 9~12 = C조, 13~16 = D조
      const groupIdx = Math.floor(i / 4);
      const slotIdx = i % 4;
      const groupKey = GROUP_KEYS[groupIdx];
      next[groupKey][slotIdx] = sorted[i].id;
    }
    setAssignment(next);
    setSaveError("");
  }

  // 검증 — 16팀 unique 채워졌는지
  function validate(): { ok: boolean; error?: string } {
    const all: string[] = [];
    for (const key of GROUP_KEYS) {
      for (const id of assignment[key]) {
        if (!id) {
          return { ok: false, error: `${key}조에 미배정 슬롯이 있습니다.` };
        }
        all.push(id);
      }
    }
    if (all.length !== 16) {
      return { ok: false, error: `16팀이 모두 배정되어야 합니다 (현재 ${all.length}팀).` };
    }
    const unique = new Set(all);
    if (unique.size !== 16) {
      return { ok: false, error: "한 팀이 두 조에 들어갈 수 없습니다." };
    }
    return { ok: true };
  }

  // 저장 — settings.bracket.groupAssignment + semifinalPairing PATCH
  async function save(): Promise<boolean> {
    const v = validate();
    if (!v.ok) {
      setSaveError(v.error ?? "검증 실패");
      return false;
    }
    setSaving(true);
    setSaveError("");
    try {
      // 기존 settings 머지 — bracket 키만 갱신 (다른 settings 유지)
      // PATCH /api/web/tournaments/[id] 가 settings 머지 처리 (wizard 와 동일 패턴)
      const groupAssignment: Record<GroupKey, string[]> = {
        A: assignment.A,
        B: assignment.B,
        C: assignment.C,
        D: assignment.D,
      };
      const res = await fetch(`/api/web/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            bracket: {
              // dual 표준값 + 사용자 입력
              groupCount: 4,
              teamsPerGroup: 4,
              advancePerGroup: 2,
              knockoutSize: 8,
              hasGroupFinal: true,
              bronzeMatch: false,
              semifinalPairing: pairing,
              groupAssignment,
            },
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? "저장 실패");
      }
      setSavedOnce(true);
      onSaved?.();
      return true;
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장 중 오류");
      return false;
    } finally {
      setSaving(false);
    }
  }

  // 저장 + 매치 자동 생성 (한 번에 처리)
  async function saveAndGenerate() {
    const v = validate();
    if (!v.ok) {
      setSaveError(v.error ?? "검증 실패");
      return;
    }
    const saved = await save();
    if (!saved) return;
    await onGenerate();
  }

  const validation = validate();
  const isReady = validation.ok;

  return (
    <Card className="mb-6">
      {/* 헤더 + 자동 시드 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            조 배정
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            16팀을 4그룹 (A/B/C/D) 에 배정하세요. 각 조 4팀 = 시드 순서.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={autoSeed}
          disabled={approvedTeams.length !== 16 || saving}
          className="text-sm"
        >
          자동 시드 추천
        </Button>
      </div>

      {/* 4×4 그리드 — 모바일 1열 / md 2열 / lg 4열 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {GROUP_KEYS.map((groupKey) => (
          <div
            key={groupKey}
            className="rounded-[8px] bg-[var(--color-surface)] p-3"
          >
            <p className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">
              {groupKey}조
            </p>
            <div className="space-y-2">
              {assignment[groupKey].map((teamId, slotIdx) => (
                <div key={slotIdx} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-[var(--color-text-muted)]">
                    {slotIdx + 1}.
                  </span>
                  <select
                    value={teamId}
                    disabled={saving || generating}
                    onChange={(e) =>
                      setSlot(groupKey, slotIdx, e.target.value)
                    }
                    className="w-full rounded-[6px] border-none bg-[var(--color-elevated)] px-2 py-1.5 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
                  >
                    <option value="">미정</option>
                    {approvedTeams.map((t) => {
                      // 다른 슬롯에서 사용 중인 팀은 disable (단 자기 자신은 허용)
                      const isUsedElsewhere =
                        usedTeamIds.has(t.id) && t.id !== teamId;
                      return (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={isUsedElsewhere}
                        >
                          {t.team.name}
                          {t.seedNumber != null ? ` (#${t.seedNumber})` : ""}
                          {isUsedElsewhere ? " — 배정됨" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 4강 페어링 모드 — 운영자 변경 가능 (default = sequential) */}
      <div className="mt-4 rounded-[8px] bg-[var(--color-surface)] p-3">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
          4강 페어링 모드
        </label>
        <select
          value={pairing}
          disabled={saving || generating}
          onChange={(e) =>
            setPairing(e.target.value as SemifinalPairingMode)
          }
          className="w-full rounded-[6px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
        >
          <option value="sequential">표준 (시드 분리, 단일 코트 순차 진행)</option>
          <option value="adjacent">5/2 패턴 (AB/CD 진영 분리, 멀티 코트 묶기)</option>
        </select>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {pairing === "adjacent"
            ? "8강 1·2 → 4강 1 / 8강 3·4 → 4강 2 (인접) — 5/2 동호회최강전 패턴"
            : "8강 A1+D2 / B1+C2 / C1+B2 / D1+A2 — 같은 조 결승까지 분리"}
        </p>
      </div>

      {/* 검증 오류 */}
      {saveError && (
        <div
          className="mt-3 rounded-[6px] px-3 py-2 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {saveError}
        </div>
      )}

      {/* 저장 / 매치 생성 버튼 */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={save}
          disabled={!isReady || saving || generating}
          className="text-sm"
        >
          {saving ? "저장 중..." : "조 배정 저장"}
        </Button>
        <Button
          onClick={saveAndGenerate}
          disabled={!isReady || saving || generating || !canGenerate}
          className="text-sm"
        >
          {generating ? "생성 중..." : "저장 + 매치 자동 생성"}
        </Button>
      </div>
    </Card>
  );
}

````

