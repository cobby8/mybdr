"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
      <div className="mb-4">
        {isLeague && approvedCount >= 2 && !hasMatches && (
          <p className="ta-bracket-note">
            승인된 {approvedCount}팀 기준 총 {expectedLeagueMatches}경기가 생성됩니다.
            {/* Phase 2C: full_league_knockout이면 토너먼트 뼈대도 함께 생성됨을 안내 */}
            {data?.format === "full_league_knockout" && (
              <>
                {" "}
                <span className="ta-bracket-note__sub">
                  풀리그 경기와 토너먼트 뼈대가 함께 생성됩니다. (토너먼트 슬롯은 리그 완료 후 자동 채워집니다)
                </span>
              </>
            )}
          </p>
        )}
      </div>

      {error && (
        <div className="ta-bracket-alert" data-tone="danger">
          {error}
        </div>
      )}

      {/* 버전 현황 */}
      <section className="ts-card ta-bracket-card">
        <div className="ta-bracket-versions">
          <div className="ta-bracket-usage">
            <p className="ta-bracket-usage__label">생성 횟수</p>
            <div className="ta-version-dots">
              {Array.from({ length: versionLimit }).map((_, i) => (
                <div
                  key={i}
                  className="ta-version-dot"
                  data-on={i < versionUsed ? "true" : "false"}
                />
              ))}
              <span className="ta-version-usage">
                {versionUsed}/{versionLimit} 사용
              </span>
            </div>
            {!canGenerate && (
              <p className="ta-version-limit">
                슈퍼관리자 승인 후 추가 생성 가능합니다.
              </p>
            )}
          </div>

          <div className="ta-bracket-actions">
            {isActivated && (
              <span className="ta-version-status">
                ✓ 확정됨 (v{data?.activeVersion})
              </span>
            )}
            {hasMatches && (
              <button
                onClick={activate}
                disabled={activating || isActivated}
                className="ta-version-confirm"
              >
                {activating ? "처리 중..." : "최신 버전 확정"}
              </button>
            )}
            {hasMatches ? (
              <button
                type="button"
                onClick={() => generate(true)}
                disabled={generating || !canGenerate}
                className="ts-btn ts-btn--secondary ts-btn--sm"
              >
                {generating ? "생성 중..." : "재생성"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => generate(false)}
                disabled={generating || !canGenerate}
                className="ts-btn ts-btn--primary"
              >
                {generating ? "생성 중..." : isLeague ? "경기 자동 생성" : "대진표 생성"}
              </button>
            )}
          </div>
        </div>

        {/* 버전 히스토리 */}
        {(data?.versions.length ?? 0) > 0 && (
          <div className="ta-version-history">
            <p className="ta-version-history__title">버전 히스토리</p>
            <div className="ta-version-chips">
              {data?.versions.map((v) => (
                <div
                  key={v.id}
                  className="ta-version-chip"
                  data-active={v.is_active ? "true" : "false"}
                >
                  <span className="ta-version-chip__num">v{v.version_number}</span>
                  <span>{new Date(v.created_at).toLocaleDateString("ko-KR")}</span>
                  {v.is_active && <span>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 1라운드 팀 배치 편집 */}
      {round1Matches.length > 0 && (
        <div className="ta-round-edit">
          <h2 className="ta-panel-title">
            1라운드 팀 배치 편집
          </h2>
          <div className="ta-round-list">
            {round1Matches.map((match) => (
              <div key={match.id} className="ts-card ta-round-card" data-bye={match.status === "bye" ? "true" : "false"}>
                <div className="ta-round-card__body">
                  <span className="ta-round-number">
                    #{match.match_number ?? "-"}
                  </span>

                  {/* 홈팀 */}
                  <div className="ta-round-field">
                    <label className="ta-round-label">홈팀</label>
                    <select
                      disabled={match.status === "bye" || savingMatch === match.id}
                      value={match.homeTeamId ?? ""}
                      onChange={(e) => updateMatchTeam(match.id, "homeTeamId", e.target.value || null)}
                      className="ta-round-select"
                    >
                      <option value="">미정</option>
                      {data?.approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.team.name}</option>
                      ))}
                    </select>
                  </div>

                  <span className="ta-round-vs">vs</span>

                  {/* 원정팀 */}
                  <div className="ta-round-field">
                    <label className="ta-round-label">원정팀</label>
                    <select
                      disabled={match.status === "bye" || savingMatch === match.id}
                      value={match.awayTeamId ?? ""}
                      onChange={(e) => updateMatchTeam(match.id, "awayTeamId", e.target.value || null)}
                      className="ta-round-select"
                    >
                      <option value="">미정</option>
                      {data?.approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.team.name}</option>
                      ))}
                    </select>
                  </div>

                  {match.status === "bye" && (
                    <span className="ta-bye-badge">
                      부전승
                    </span>
                  )}
                </div>
              </div>
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
        <div className="ct-emptybox py-16 text-center text-[var(--ink-mute)]">
          <div className="mb-3 text-4xl">대진표</div>
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
        </div>
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
    <div className="ta-dual-sections">
      <div className="ta-section-head">
        <h2 className="ta-panel-title">
          듀얼토너먼트 ({matches.length}경기)
        </h2>
        <Link
          href={`/tournament-admin/tournaments/${tournamentId}#matches`}
          className="ta-panel-link"
        >
          경기 관리로 이동 →
        </Link>
      </div>

      {stageMatches.map((stage) => {
        const isCollapsed = collapsed[stage.key] === true;
        const count = stage.matches.length;

        return (
          <section key={stage.key} className="ts-card ta-dual-stage">
            {/* 섹션 헤더 — 클릭 시 토글 */}
            <button
              type="button"
              onClick={() => toggle(stage.key)}
              className="ta-dual-stage__toggle"
            >
              <div className="ta-dual-stage__title">
                <span>
                  {stage.label}
                </span>
                <span className="ta-dual-stage__count">
                  {count}경기
                </span>
              </div>
              <span className="ta-dual-stage__state">
                {isCollapsed ? "펼치기 ▼" : "접기 ▲"}
              </span>
            </button>

            {/* 섹션 본문 */}
            {!isCollapsed && (
              <div className="ta-dual-stage__body">
                {stage.groupByGroup ? (
                  // Stage 1: A/B/C/D 4조 추가 그룹핑
                  <DualGroupedMatches matches={stage.matches} />
                ) : (
                  // Stage 2~5: 단순 리스트
                  <div className="ta-match-list">
                    {stage.matches.length === 0 ? (
                      <p className="ta-stage-empty">
                        해당 단계 경기가 없습니다.
                      </p>
                    ) : (
                      stage.matches.map((m) => <DualMatchCard key={m.id} match={m} />)
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
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
    <div className="ta-dual-group-list">
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
          <div key={g} className="ta-dual-group">
            <p className="ta-dual-group__title">
              {g}조 ({groupMatches.length}경기)
            </p>
            <div className="ta-match-list">
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
    <div className="ta-match-card">
      {/* 상단 메타 — 매치번호 / 라운드명 / 상태 */}
      <div className="ta-match-meta">
        <div className="ta-match-meta__main">
          <span className="ta-match-no">
            #{match.match_number ?? "-"}
          </span>
          <span className="ta-match-round">
            {match.roundName ?? (match.round_number != null ? `라운드 ${match.round_number}` : "라운드 미정")}
          </span>
        </div>
        <span
          className="ta-match-status"
          data-status={completed ? "completed" : match.status}
        >
          {STATUS_LABEL[match.status] ?? match.status}
        </span>
      </div>

      {/* 일정 / 장소 — 모바일에서도 한 줄 유지 (작게) */}
      <div className="ta-match-info">
        <span>{formatSchedule(match)}</span>
        <span>·</span>
        <span>{formatVenue(match)}</span>
      </div>

      {/* 팀 + 점수 */}
      <div className="ta-match-teams">
        {/* HOME */}
        <div className="ta-match-side">
          <span
            className="ta-match-team"
            data-undecided={isHomeUndecided ? "true" : "false"}
            data-won={homeWon ? "true" : "false"}
            title={homeLabel}
          >
            {homeLabel}
          </span>
          <span
            className="ta-match-score"
            data-won={homeWon ? "true" : "false"}
          >
            {completed ? match.homeScore : "-"}
          </span>
        </div>

        <span className="ta-match-vs">vs</span>

        {/* AWAY */}
        <div className="ta-match-side">
          <span
            className="ta-match-score"
            data-won={awayWon ? "true" : "false"}
          >
            {completed ? match.awayScore : "-"}
          </span>
          <span
            className="ta-match-team"
            data-undecided={isAwayUndecided ? "true" : "false"}
            data-won={awayWon ? "true" : "false"}
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
          <section key={divCode} className="ts-card !p-0 overflow-hidden">
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
          </section>
        );
      })}
    </div>
  );
}
