"use client";

/**
 * Phase F2 — 공개 페이지 dual_tournament 5단계 시각화 (Stage 1·2 카드 그리드)
 *
 * 이유:
 *  - dual_tournament는 27 매치 / 5단계 (조별 16 + 조별최종 4 + 8강 4 + 4강 2 + 결승 1) 구조라
 *    기존 single elim BracketView SVG 트리로 fall-through 시 페어 매칭이 불균형해서 깨진다.
 *  - 옵션 C 하이브리드: 조별(Stage 1·2)은 카드 그리드로, 8강~결승(Stage 3·4·5)는 기존 BracketView 재사용.
 *  - 이 파일은 Stage 1·2만 담당. Stage 3~5는 wrapper에서 BracketView 호출.
 *
 * Props:
 *  - matches: BracketMatch[] — 27 매치 모두 받음. 자체 필터로 Stage 1·2만 추출.
 *
 * 시안 정합:
 *  - BDR v3 토큰만 (var(--color-*)) — 하드코딩 색상 금지.
 *  - lucide-react 금지 — 아이콘 미사용 (텍스트만으로 충분).
 *  - 모바일 720px 분기 + sticky 단계명 헤더 (사용자 결정 #2).
 *  - 빈 슬롯 = settings.homeSlotLabel italic muted (사용자 결정 #3).
 *  - 미진행 점수 = "—" (사용자 결정 #4).
 */

import Link from "next/link";
import type { BracketMatch } from "@/lib/tournaments/bracket-builder";

// ── dual 5단계 메타 (이 파일은 Stage 1·2만 사용) ──
// admin DUAL_STAGES 와 동일 구조 — round_number 매핑 일치
type DualStage = {
  key: string;
  label: string;
  rounds: number[]; // round_number 필터
};

const STAGE_1: DualStage = {
  key: "stage1",
  label: "Stage 1 · 조별 미니 더블엘리미",
  rounds: [1, 2],
};
const STAGE_2: DualStage = {
  key: "stage2",
  label: "Stage 2 · 조별 최종전 (2위 결정)",
  rounds: [3],
};

// ── 일정 포맷 — KST yyyy.MM.dd HH:mm ──
function formatSchedule(iso: string | null): string {
  if (!iso) return "일정 미정";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── 점수 표시 — completed/in_progress 만 숫자, 그 외 "—" (사용자 결정 #4) ──
function formatScore(m: BracketMatch, side: "home" | "away"): string {
  const isShown = m.status === "completed" || m.status === "in_progress";
  if (!isShown) return "—";
  return String(side === "home" ? m.homeScore : m.awayScore);
}

interface V2DualBracketSectionsProps {
  matches: BracketMatch[];
}

export function V2DualBracketSections({ matches }: V2DualBracketSectionsProps) {
  // Stage 1: round 1·2 → A/B/C/D 조별 그룹핑
  // Stage 2: round 3 → group_name 별 1매치씩 (4매치)
  const stage1Matches = matches.filter((m) => STAGE_1.rounds.includes(m.roundNumber));
  const stage2Matches = matches.filter((m) => STAGE_2.rounds.includes(m.roundNumber));

  return (
    <div className="flex flex-col gap-6">
      {/* Stage 1 — 4조 그리드 */}
      <DualStageBlock label={STAGE_1.label}>
        <DualGroupedGrid matches={stage1Matches} />
      </DualStageBlock>

      {/* Stage 2 — 조별 최종전 4매치 단순 그리드 */}
      <DualStageBlock label={STAGE_2.label}>
        <DualFinalsGrid matches={stage2Matches} />
      </DualStageBlock>
    </div>
  );
}

// ── 단계 블록 (sticky 단계명 헤더) ──
// 이유: 모바일 세로 스크롤 시에도 "지금 보고 있는 단계"를 항상 알 수 있어야 함 (사용자 결정 #2)
function DualStageBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* sticky 단계명 헤더
          top:0 — 페이지 스크롤 컨테이너 기준 (BracketView 와 동일 패턴).
          backgroundColor — 카드와 동일 불투명 배경으로 본문 위에 떠야 함. */}
      <div
        className="sticky z-10 mb-3 flex items-center gap-2 py-2"
        style={{
          top: 0,
          backgroundColor: "var(--color-card)",
        }}
      >
        {/* 좌측 강조 막대 — BracketView 헤더와 동일 패턴 */}
        <span
          className="w-1.5 h-5 rounded-sm"
          style={{ backgroundColor: "var(--color-primary)" }}
        />
        <h3
          className="text-sm font-bold uppercase tracking-wide sm:text-base"
          style={{ color: "var(--color-text-primary)" }}
        >
          {label}
        </h3>
      </div>

      {children}
    </section>
  );
}

// ── Stage 1: A/B/C/D 4조 그리드 ──
// 데스크톱: 2열 / 모바일: 1열
// 한 조 = 4매치 (G1, G2, 승자전, 패자전)
function DualGroupedGrid({ matches }: { matches: BracketMatch[] }) {
  // 조 키 — admin 패턴과 동일 (A/B/C/D 순)
  const groupKeys = ["A", "B", "C", "D"] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {groupKeys.map((g) => {
        const groupMatches = matches
          .filter((m) => m.groupName === g)
          // 라운드 → 매치번호 순으로 정렬 (G1 → G2 → 승자전 → 패자전)
          .sort((a, b) => {
            const r = a.roundNumber - b.roundNumber;
            if (r !== 0) return r;
            return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
          });

        if (groupMatches.length === 0) return null;

        return (
          <div
            key={g}
            className="rounded-md border p-3"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            {/* 조 라벨 */}
            <p
              className="mb-2 text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {g}조 ({groupMatches.length}경기)
            </p>
            <div className="flex flex-col gap-2">
              {groupMatches.map((m) => (
                <DualMatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stage 2: 조별 최종전 4매치 그리드 ──
// 데스크톱: 4열 / 태블릿: 2열 / 모바일: 1열
function DualFinalsGrid({ matches }: { matches: BracketMatch[] }) {
  // 조별 1개씩 정렬 (A/B/C/D)
  const sorted = [...matches].sort((a, b) => {
    const ga = a.groupName ?? "";
    const gb = b.groupName ?? "";
    return ga.localeCompare(gb);
  });

  if (sorted.length === 0) {
    return (
      <p
        className="py-4 text-center text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        조별 최종전 경기가 없습니다.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {sorted.map((m) => (
        <DualMatchCard key={m.id} match={m} showGroupBadge />
      ))}
    </div>
  );
}

// ── 듀얼 전용 매치 카드 ──
// admin DualMatchCard 디자인을 BDR v3 토큰으로 재작성.
// 빈 슬롯 라벨 italic muted (사용자 결정 #3) + 미진행 점수 "—" (사용자 결정 #4)
function DualMatchCard({
  match,
  showGroupBadge = false,
}: {
  match: BracketMatch;
  showGroupBadge?: boolean;
}) {
  const completed = match.status === "completed";
  const isLive = match.status === "in_progress";

  // 승자 판별 — winnerTeamId 우선, 없으면 점수 비교 (completed 일 때만)
  const homeWon =
    match.winnerTeamId != null
      ? match.homeTeam?.teamId === match.winnerTeamId
      : completed && match.homeScore > match.awayScore;
  const awayWon =
    match.winnerTeamId != null
      ? match.awayTeam?.teamId === match.winnerTeamId
      : completed && match.awayScore > match.homeScore;

  return (
    <div
      className="rounded-md border p-3 transition-colors"
      style={{
        borderColor: isLive ? "var(--color-primary)" : "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      {/* 상단 메타 — 매치번호 / 라운드명 / 조 뱃지 (Stage 2 만) / 상태 */}
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            #{match.matchNumber ?? "-"}
          </span>
          <span
            className="font-medium truncate"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {match.roundName}
          </span>
          {showGroupBadge && match.groupName && (
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              {match.groupName}조
            </span>
          )}
        </div>
        {/* LIVE 표시만 (예정/종료는 숨김 — 점수와 중복) */}
        {isLive && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: "var(--color-error)",
              color: "#ffffff",
            }}
          >
            LIVE
          </span>
        )}
      </div>

      {/* 일정 — 작게 한 줄 */}
      <div
        className="mb-2 text-[11px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        {formatSchedule(match.scheduledAt)}
      </div>

      {/* HOME 행 */}
      <DualTeamRow
        match={match}
        side="home"
        won={homeWon}
        loser={completed && !homeWon}
      />

      {/* 구분선 */}
      <div
        className="my-1 h-px"
        style={{ backgroundColor: "var(--color-border)" }}
      />

      {/* AWAY 행 */}
      <DualTeamRow
        match={match}
        side="away"
        won={awayWon}
        loser={completed && !awayWon}
      />
    </div>
  );
}

// ── 한 줄 팀 행 ──
function DualTeamRow({
  match,
  side,
  won,
  loser,
}: {
  match: BracketMatch;
  side: "home" | "away";
  won: boolean;
  loser: boolean;
}) {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const slotLabel =
    side === "home" ? match.homeSlotLabel : match.awaySlotLabel;
  const score = formatScore(match, side);

  return (
    <div className="flex items-center justify-between gap-2">
      {team ? (
        // 팀 확정 — 팀 페이지 링크
        <Link
          href={`/teams/${team.teamId}`}
          className={`flex-1 truncate text-sm leading-tight hover:underline ${
            won ? "font-bold" : "font-medium"
          }`}
          style={{
            color: loser
              ? "var(--color-text-secondary)"
              : "var(--color-text-primary)",
          }}
        >
          {team.team.name}
        </Link>
      ) : (
        // 빈 슬롯 — settings.{home|away}SlotLabel italic muted (사용자 결정 #3)
        <span
          className="flex-1 truncate text-sm italic leading-tight"
          style={{ color: "var(--color-text-muted)" }}
          title={slotLabel ?? "TBD"}
        >
          {slotLabel ?? "미정"}
        </span>
      )}

      {/* 점수 — 미진행 "—" / 승자 강조 */}
      <span
        className={`min-w-[28px] text-right text-sm tabular-nums ${
          won ? "font-extrabold" : "font-medium"
        }`}
        style={{
          color: won
            ? "var(--color-primary)"
            : loser
            ? "var(--color-text-secondary)"
            : "var(--color-text-primary)",
          fontFamily: "var(--font-heading, var(--font-display))",
        }}
      >
        {score}
      </span>
    </div>
  );
}
