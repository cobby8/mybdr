"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// 2026-05-04 (P4) — 듀얼 조 배정 에디터 (16팀 → 4그룹 배정 + 페어링 모드 + 저장/생성)
import { DualGroupAssignmentEditor } from "./_components/dual-group-assignment-editor";
import type { SemifinalPairingMode } from "@/lib/tournaments/dual-defaults";

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
};

// 풀리그 계열 포맷 판별 — UI 분기용
function isLeagueFormat(fmt: string | null | undefined): boolean {
  return fmt === "round_robin" || fmt === "full_league" || fmt === "full_league_knockout";
}

// 듀얼토너먼트 포맷 판별 — Phase D 5섹션 그룹핑 분기용
function isDualFormat(fmt: string | null | undefined): boolean {
  return fmt === "dual_tournament";
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

  if (loading)
    return <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">불러오는 중...</div>;

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
    <div>
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
                  className={`h-3 w-8 rounded-full ${
                    i < versionUsed ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
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
              <span className="rounded-full bg-[rgba(74,222,128,0.1)] px-3 py-1 text-xs font-medium text-[var(--color-success)]">
                ✓ 확정됨 (v{data?.activeVersion})
              </span>
            )}
            {/* 2026-05-12 — pill 9999px ❌ + admin 빨강 본문 금지 룰 → rounded-[4px] + info(Navy) 토큰 */}
            {hasMatches && (
              <button
                onClick={activate}
                disabled={activating || isActivated}
                className="rounded-[4px] bg-[rgba(27,60,135,0.08)] px-4 py-2 text-sm font-medium text-[var(--color-info)] hover:bg-[rgba(0,102,255,0.15)] disabled:opacity-50"
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
                      ? "bg-[rgba(74,222,128,0.1)] text-[var(--color-success)]"
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

      {/* Phase D: dual_tournament 일 때 5섹션 그룹핑 UI 우선 표시 */}
      {hasMatches && isDual && (
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
              href={`/tournament-admin/tournaments/${id}/matches`}
              className="text-xs text-[var(--color-accent)] hover:underline"
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
                    {rMatches[0]?.roundName ?? `라운드 ${rn}`}
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
          href={`/tournament-admin/tournaments/${tournamentId}/matches`}
          className="text-xs text-[var(--color-accent)] hover:underline"
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
            {match.roundName ?? `라운드 ${match.round_number ?? "?"}`}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 ${
            completed
              ? "bg-[rgba(74,222,128,0.1)] text-[var(--color-success)]"
              : match.status === "in_progress"
                ? "bg-[rgba(0,121,185,0.1)] text-[var(--color-info)]"
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
