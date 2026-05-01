"use client";

/**
 * 듀얼토너먼트 공개 대진표 (Phase F2 — 옵션 D 채택)
 *
 * 왜 옵션 D (5섹션 모두 카드 그리드, BracketView SVG 트리 X):
 *  - planner 옵션 C 의 BracketView 재사용은 단순 i*2 페어링이라
 *    NBA 컨퍼런스 모형 4강 크로스 (8강 1+4 / 2+3) 와 시각 불일치 → 잘못된 트리
 *  - admin Phase D 의 5섹션 카드 패턴이 정확. 공개 페이지에도 그대로 이식
 *
 * 5섹션 구조 (admin/bracket/page.tsx 의 DUAL_STAGES 동일):
 *  Stage 1: 조별 미니 더블엘리미 (rounds 1·2, A/B/C/D × 4매치 = 16)
 *  Stage 2: 조별 최종전 (round 3, 4매치)
 *  Stage 3: 8강 (round 4, 4매치)
 *  Stage 4: 4강 (round 5, 2매치)
 *  Stage 5: 결승 (round 6, 1매치)
 *
 * 빈 슬롯: settings.homeSlotLabel/awaySlotLabel italic muted
 * 점수: 진행 안 된 매치는 "—"
 * 모바일: 세로 스크롤 + sticky 단계명 헤더 (사용자 결정)
 *
 * BDR v3 토큰만 (var(--*)) / lucide-react ❌ / pill 9999px ❌
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { RoundGroup, BracketMatch } from "@/lib/tournaments/bracket-builder";

// ── Stage 메타 ────────────────────────────────────────
type DualStage = {
  key: string;
  label: string;
  rounds: number[];
  groupByGroup: boolean;
};

const DUAL_STAGES: DualStage[] = [
  { key: "stage1", label: "조별 미니 더블엘리미", rounds: [1, 2], groupByGroup: true },
  { key: "stage2", label: "조별 최종전 (2위 결정)", rounds: [3], groupByGroup: false },
  { key: "stage3", label: "8강", rounds: [4], groupByGroup: false },
  { key: "stage4", label: "4강", rounds: [5], groupByGroup: false },
  { key: "stage5", label: "결승", rounds: [6], groupByGroup: false },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

// ── 일정 표시 (KST yyyy.MM.dd HH:mm) ─────────────────
function formatSchedule(iso: string | null): string {
  if (!iso) return "일정 미정";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 빈 슬롯 라벨 — 팀 확정이면 팀명, 아니면 settings 슬롯 라벨, 그래도 없으면 "미정"
function slotLabel(team: BracketMatch["homeTeam"], fallback: string | null): string {
  if (team) return team.team.name;
  if (fallback && fallback.trim()) return fallback;
  return "미정";
}

// ── Props ────────────────────────────────────────────
interface Props {
  rounds: RoundGroup[];
}

export function V2DualBracketView({ rounds }: Props) {
  // 평평하게 매치 추출
  const allMatches = rounds.flatMap((r) => r.matches);

  // 모든 섹션 기본 펼침
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 단계별 매치 분류
  const stageMatches = DUAL_STAGES.map((stage) => ({
    ...stage,
    matches: allMatches.filter((m) => stage.rounds.includes(m.roundNumber)),
  }));

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          듀얼토너먼트 ({allMatches.length}경기)
        </h2>
      </div>

      {stageMatches.map((stage) => {
        const isCollapsed = collapsed[stage.key] === true;
        const count = stage.matches.length;

        return (
          <Card key={stage.key} className="!p-0 overflow-hidden">
            {/* sticky 헤더 — 스크롤 시 단계명 항상 보임 */}
            <button
              type="button"
              onClick={() => toggle(stage.key)}
              className="sticky top-0 z-10 flex w-full items-center justify-between bg-[var(--color-card)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-elevated)]"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  {stage.label}
                </span>
                <span className="rounded-[4px] bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {count}경기
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {isCollapsed ? "펼치기 ▼" : "접기 ▲"}
              </span>
            </button>

            {!isCollapsed && (
              <div className="p-3">
                {stage.groupByGroup ? (
                  <DualGroupedMatches matches={stage.matches} />
                ) : (
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

// Stage 1 전용 — A/B/C/D 조별 추가 그룹핑
function DualGroupedMatches({ matches }: { matches: BracketMatch[] }) {
  const groupKeys = ["A", "B", "C", "D"] as const;

  return (
    <div className="space-y-3">
      {groupKeys.map((g) => {
        const groupMatches = matches
          .filter((m) => m.groupName === g)
          .sort((a, b) => {
            // round_number 1 (G1·G2) → 2 (G3 승자전·G4 패자전)
            const r = a.roundNumber - b.roundNumber;
            if (r !== 0) return r;
            return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
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

// 듀얼 전용 매치 카드 — BracketMatch 기반
function DualMatchCard({ match }: { match: BracketMatch }) {
  const homeLabel = slotLabel(match.homeTeam, match.homeSlotLabel);
  const awayLabel = slotLabel(match.awayTeam, match.awaySlotLabel);
  const isHomeUndecided = match.homeTeam == null;
  const isAwayUndecided = match.awayTeam == null;
  const completed = match.status === "completed";
  // winnerTeamId 우선 (정확), 없으면 점수 비교 fallback
  const homeWon = completed && (match.winnerTeamId
    ? match.winnerTeamId === match.homeTeam?.id
    : match.homeScore > match.awayScore);
  const awayWon = completed && (match.winnerTeamId
    ? match.winnerTeamId === match.awayTeam?.id
    : match.awayScore > match.homeScore);

  return (
    <div className="rounded-[8px] bg-[var(--color-elevated)] p-3">
      {/* 상단 메타 */}
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[var(--color-text-muted)]">
            #{match.matchNumber ?? "-"}
          </span>
          <span className="font-medium text-[var(--color-text-secondary)]">
            {match.roundName}
          </span>
        </div>
        <span
          className={`rounded-[4px] px-2 py-0.5 ${
            completed
              ? "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]"
              : match.status === "in_progress"
                ? "bg-[color-mix(in_srgb,var(--color-info)_15%,transparent)] text-[var(--color-info)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
          }`}
        >
          {STATUS_LABEL[match.status] ?? match.status}
        </span>
      </div>

      {/* 일정 */}
      <div className="mb-2 flex items-center gap-x-2 text-[11px] text-[var(--color-text-muted)]">
        <span>{formatSchedule(match.scheduledAt)}</span>
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
            {completed ? match.homeScore : "—"}
          </span>
        </div>

        <span className="text-xs text-[var(--color-text-muted)]">vs</span>

        {/* AWAY */}
        <div className="flex flex-1 items-center gap-2 min-w-0 justify-end">
          <span
            className={`min-w-[28px] text-left text-sm tabular-nums ${
              awayWon ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {completed ? match.awayScore : "—"}
          </span>
          <span
            className={`flex-1 truncate text-sm text-right ${
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
