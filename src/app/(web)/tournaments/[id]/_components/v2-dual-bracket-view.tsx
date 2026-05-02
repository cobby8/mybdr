"use client";

/**
 * 듀얼토너먼트 공개 대진표 (Phase F2 — 2026-05-02 갱신)
 *
 * 사용자 결정 (2026-05-02 갱신):
 *  - 영문 부제 "(Knockout Stage)" 삭제 → "토너먼트 대진표" 만
 *  - 조별 경기 카드 모두 제거 → "조편성" 단일 섹션만 표시
 *  - 라벨 갱신: "조별 미니 더블엘리미" → "조별 듀얼토너먼트" (5경기 = G1·G2·G3 승자전·G4 패자전·최종전)
 *  - 8강~결승 SVG V자 트리 (NBA 크로스 재정렬) 그대로 유지
 *
 * 듀얼토너먼트 명확화 (사용자 정의):
 *  - 조별 5경기 = G1·G2 (1라) + G3 승자전·G4 패자전 (2라) + 최종전 (3라)
 *  - 승자전 승자 = 조 1위 / 승자전 패자 vs 패자전 승자 → 최종전 → 승자 = 조 2위
 *  - 4조 × 5경기 = 조별 20경기 / + 8강 4 + 4강 2 + 결승 1 = 27경기
 *
 * 표시 구조:
 *  ┌──────────────────────────────┐
 *  │ 듀얼토너먼트 (27경기)         │
 *  ├──────────────────────────────┤
 *  │ [SVG V자 트리]                │
 *  │ 8강 → 4강 → 결승 (7경기)      │
 *  ├──────────────────────────────┤
 *  │ 조편성 (4조 × 4팀 = 16팀)     │
 *  │ A조: 4팀                     │
 *  │ B조: 4팀                     │
 *  │ C조: 4팀                     │
 *  │ D조: 4팀                     │
 *  └──────────────────────────────┘
 *
 * BDR v3 토큰만 (var(--*)) / lucide-react ❌ / pill 9999px ❌
 */

import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { RoundGroup, BracketMatch, TeamSlot } from "@/lib/tournaments/bracket-builder";
import { BracketView } from "../bracket/_components/bracket-view";
// Phase F2 활성화 (2026-05-02) — 조별 듀얼토너먼트 round 1~3 시각화 (20매치 카드 그리드)
import { V2DualBracketSections } from "./v2-dual-bracket-sections";

// ── 8강~결승 SVG 트리용 매치 재정렬 (NBA 크로스 매핑) ───
function buildKnockoutRounds(allMatches: BracketMatch[]): RoundGroup[] {
  const qf = allMatches.filter((m) => m.roundNumber === 4);
  const sf = allMatches.filter((m) => m.roundNumber === 5);
  const f = allMatches.filter((m) => m.roundNumber === 6);

  if (qf.length === 0) return [];

  // 8강 NBA 크로스 순서로 재정렬: [pos1, pos4, pos2, pos3]
  // → BracketView 단순 i*2 페어링 = NBA 크로스 자동 일치
  // (matches[0]+[1] → SF1 = QF1+QF4 / matches[2]+[3] → SF2 = QF2+QF3)
  const qfReordered = [1, 4, 2, 3]
    .map((p) => qf.find((m) => m.bracketPosition === p))
    .filter((m): m is BracketMatch => m !== undefined);

  const result: RoundGroup[] = [
    {
      roundNumber: 4,
      roundName: "8강",
      matches: qfReordered,
      hasLive: qfReordered.some((m) => m.status === "in_progress"),
      hasCompleted: qfReordered.some((m) => m.status === "completed"),
    },
  ];
  if (sf.length > 0) {
    const sfSorted = [...sf].sort((a, b) => a.bracketPosition - b.bracketPosition);
    result.push({
      roundNumber: 5,
      roundName: "4강",
      matches: sfSorted,
      hasLive: sfSorted.some((m) => m.status === "in_progress"),
      hasCompleted: sfSorted.some((m) => m.status === "completed"),
    });
  }
  if (f.length > 0) {
    result.push({
      roundNumber: 6,
      roundName: "결승",
      matches: f,
      hasLive: f.some((m) => m.status === "in_progress"),
      hasCompleted: f.some((m) => m.status === "completed"),
    });
  }
  return result;
}

// ── 조편성 빌드 ─────────────────────────────────────
// 각 조의 4팀 = round 1 (G1·G2) 매치 2건의 homeTeam + awayTeam
// 정렬: bracket_position 1 (G1) home·away → bracket_position 2 (G2) home·away
type GroupComposition = {
  groupName: string;
  teams: TeamSlot[]; // 4팀 (시드 1~4 순)
};

function buildGroupComposition(allMatches: BracketMatch[]): GroupComposition[] {
  const byGroup = new Map<string, BracketMatch[]>();
  for (const m of allMatches) {
    if (m.roundNumber === 1 && m.groupName) {
      if (!byGroup.has(m.groupName)) byGroup.set(m.groupName, []);
      byGroup.get(m.groupName)!.push(m);
    }
  }

  const result: GroupComposition[] = [];
  for (const [g, matches] of byGroup.entries()) {
    matches.sort((a, b) => a.bracketPosition - b.bracketPosition);
    const teams: TeamSlot[] = [];
    for (const m of matches) {
      if (m.homeTeam) teams.push(m.homeTeam);
      if (m.awayTeam) teams.push(m.awayTeam);
    }
    result.push({ groupName: g, teams });
  }
  return result.sort((a, b) => a.groupName.localeCompare(b.groupName));
}

// ── 팀 표시명 ─────────────────────────────────────
// 한·영 병기 — name_primary === "en" 이면 영문, 아니면 한글
// TeamSlot 이 union (object | null) 이라 NonNullable 추출
type SlotTeam = NonNullable<TeamSlot>["team"];
function getTeamDisplayName(team: SlotTeam): string {
  if (team.namePrimary === "en" && team.nameEn) return team.nameEn;
  return team.name;
}

// ── Props ────────────────────────────────────────────
interface Props {
  rounds: RoundGroup[];
  tournamentId: string;
}

export function V2DualBracketView({ rounds, tournamentId }: Props) {
  const allMatches = rounds.flatMap((r) => r.matches);
  const knockoutRounds = buildKnockoutRounds(allMatches);
  const groupComposition = buildGroupComposition(allMatches);
  const hasKnockoutTree = knockoutRounds.length > 0;
  const hasGroupComposition = groupComposition.length > 0;

  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          듀얼토너먼트 ({allMatches.length}경기)
        </h2>
      </div>

      {/* 사용자 결정 (2026-05-02 v3): 조편성을 먼저, 토너먼트 트리는 나중에 */}

      {/* 1) 조편성 — 4조 × 4팀 (UI 개선: 조 헤더 색상 + 팀 색띠 + 시드 뱃지) */}
      {hasGroupComposition && (
        <GroupCompositionCard groups={groupComposition} />
      )}

      {/* 2) 조별 듀얼토너먼트 round 1~3 — Phase F2 박제 컴포넌트 (20매치 카드 그리드) */}
      {/* 자체 round_number 필터 → matches prop 전체(27매치) 전달 OK */}
      <V2DualBracketSections matches={allMatches} />

      {/* 3) 최종 토너먼트 트리 — 8강·4강·결승 SVG V자 트리 (NBA 크로스 정합) */}
      {hasKnockoutTree && (
        <Card className="!p-4 sm:!p-6 overflow-x-auto">
          <BracketView rounds={knockoutRounds} tournamentId={tournamentId} />
        </Card>
      )}
    </div>
  );
}

// 조 색상 매핑 — A/B/C/D 별 accent 색상
// BDR 토큰 기반 (cafe-blue / bdr-red / 그리고 기존 토큰 fallback)
const GROUP_ACCENT: Record<string, string> = {
  A: "var(--cafe-blue, #0079B9)",
  B: "var(--bdr-red, #E31B23)",
  C: "var(--color-success, #16a34a)",
  D: "var(--color-warning, #d97706)",
};

// 조편성 카드 — 4조 × 4팀 그리드 (UI 개선)
// 사용자 결정 (2026-05-02): 조별 경기 카드 표시 X, 조편성만 노출
// 라벨: "조별 듀얼토너먼트" (G1·G2·승자전·패자전·최종전 = 5경기/조)
function GroupCompositionCard({ groups }: { groups: GroupComposition[] }) {
  const totalMatches = groups.length * 5; // 4조 × 5경기 = 20

  return (
    <Card className="!p-4 sm:!p-6">
      {/* 헤더 — 그라디언트 배경 강조 */}
      <div
        className="mb-5 -m-4 sm:-m-6 mb-5 sm:mb-5 rounded-t-md p-4 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, var(--color-elevated) 0%, var(--color-surface) 100%)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] sm:text-xl">
              조별 듀얼토너먼트
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
              조별 5경기 (G1·G2·승자전·패자전·최종전) · 총 {totalMatches}경기
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              <span className="font-semibold text-[var(--color-text-secondary)]">1위</span>=
              승자전 승자 · <span className="font-semibold text-[var(--color-text-secondary)]">2위</span>=
              최종전 승자 · 1·2위 8강 진출
            </p>
          </div>
          <span className="shrink-0 rounded-[4px] bg-[var(--color-card)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            {groups.length}조 · 16팀
          </span>
        </div>
      </div>

      {/* 4조 그리드 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {groups.map((g) => {
          const accent = GROUP_ACCENT[g.groupName] ?? "var(--color-accent)";
          return (
            <div
              key={g.groupName}
              className="overflow-hidden rounded-[10px] border transition-shadow hover:shadow-md"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
              }}
            >
              {/* 조 헤더 — accent 색상 띠 */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-5 w-1 rounded-[2px]"
                    style={{ backgroundColor: accent }}
                  />
                  <p
                    className="text-base font-bold sm:text-lg"
                    style={{ color: accent }}
                  >
                    {g.groupName}조
                  </p>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {g.teams.length}팀
                </span>
              </div>

              {/* 4팀 리스트 — 호버 효과 + 색띠 */}
              <ul className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
                {g.teams.map((t, idx) => (
                  <li
                    key={t?.id ?? idx}
                    className="flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-[var(--color-elevated)]"
                  >
                    {/* 시드 뱃지 — 조내 1·2·3·4 */}
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-xs font-bold"
                      style={{
                        backgroundColor: idx < 2
                          ? `color-mix(in srgb, ${accent} 18%, transparent)`
                          : "var(--color-elevated)",
                        color: idx < 2 ? accent : "var(--color-text-muted)",
                      }}
                      title={idx < 2 ? "조내 상위 시드" : "조내 하위 시드"}
                    >
                      {idx + 1}
                    </span>
                    {/* 팀 유니폼 색띠 — home_color 우선 (대표 유니폼), 없으면 primaryColor */}
                    {t && (t.team.homeColor || t.team.primaryColor) && (
                      <span
                        className="inline-block h-4 w-1 rounded-[2px]"
                        style={{ backgroundColor: t.team.homeColor || t.team.primaryColor || undefined }}
                      />
                    )}
                    {/* 팀명 (링크) */}
                    {t ? (
                      <Link
                        href={`/teams/${t.teamId}`}
                        className="flex-1 truncate text-sm font-medium text-[var(--color-text-primary)] hover:underline"
                      >
                        {getTeamDisplayName(t.team)}
                      </Link>
                    ) : (
                      <span className="flex-1 italic text-sm text-[var(--color-text-muted)]">
                        미정
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
