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

// ── 날짜+시간 짧은 포맷 — "5/2(토) 10:00" ──
// 이유: 2026-05-02 사용자 요청 — 대진표 매치 카드에 날짜 정보 추가
// (이전엔 시간만 표시했으나, 다일 대회 / 카드 단독 조회 케이스에서 날짜 식별 필요).
// 폴드5 (~388px) 대응: "5/2(토) 10:00" = 약 12자 — flex-wrap 으로 줄바꿈 안전.
// 기존 schedule-timeline 의 formatGroupDate 와 다른 형태인 이유: 카드 inline 메타 한 줄에
// 욱여넣기 위해 더 짧은 표기가 필요 (formatGroupDate 는 "5월 2일 (토)" — 날짜 헤더용).
function formatDateTimeShort(iso: string | null): string {
  if (!iso) return "--/-- (-) --:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--/-- (-) --:--";
  const pad = (n: number) => String(n).padStart(2, "0");
  // 한국어 요일 단축 (일~토)
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${dow}) ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── 팀 로고 (일정 카드와 동일 패턴) ──
// 이유: 일정 탭/대진표 탭에서 팀 식별 기준이 일관되어야 사용자 인지 부하 0.
// 사이즈 32/36 (모바일/데스크톱) — schedule-timeline 의 24/28 대비 30% 확대 (사용자 결정)
function DualTeamLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null | undefined;
  name: string | null;
}) {
  // 첫 글자 fallback — 한글/영문 모두 1자
  const initial = name && name.length > 0 ? name.charAt(0) : "·";
  return (
    <span
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-9 sm:w-9"
      style={{
        border: "1px solid var(--color-border)",
        backgroundColor: logoUrl ? "var(--color-surface)" : "var(--color-elevated)",
      }}
      aria-hidden="true"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <span
          className="text-xs font-bold sm:text-sm"
          style={{ color: "var(--color-text-tertiary)", fontFamily: "var(--font-heading)" }}
        >
          {initial}
        </span>
      )}
    </span>
  );
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
// 2026-05-02 사용자 요청: 일정 탭 카드 (schedule-timeline.tsx) 와 시각 통일.
// 구조: 가로 inline 1줄.
//   상단: [#매치번호 | 라운드명 (조뱃지) | 시간] | [LIVE/상태]
//   하단: [로고 홈팀명] | [점수:점수 / VS] | [어웨이팀명 로고]
// 빈 슬롯 라벨 italic muted (사용자 결정 #3) + 미진행 "VS" (일정 카드와 동일)
function DualMatchCard({
  match,
  showGroupBadge = false,
}: {
  match: BracketMatch;
  showGroupBadge?: boolean;
}) {
  const completed = match.status === "completed";
  const isLive = match.status === "in_progress";
  // 점수/VS 표시 분기 — 진행 중·종료만 점수, 그 외는 VS
  const showScore = completed || isLive;

  // 승자 판별 — winnerTeamId 우선, 없으면 점수 비교 (completed 일 때만)
  // 2026-05-02 fix: TournamentTeam.id (slot.id) 비교. teamId(Team.id) 비교는 도메인 다름 → 항상 false
  const homeWon =
    match.winnerTeamId != null
      ? match.homeTeam?.id === match.winnerTeamId
      : completed && match.homeScore > match.awayScore;
  const awayWon =
    match.winnerTeamId != null
      ? match.awayTeam?.id === match.winnerTeamId
      : completed && match.awayScore > match.homeScore;

  // 빈 슬롯 라벨 — 팀 미확정 시 settings.homeSlotLabel/awaySlotLabel 표시
  const homeName = match.homeTeam?.team.name ?? null;
  const awayName = match.awayTeam?.team.name ?? null;
  const homeIsTbd = match.homeTeam == null;
  const awayIsTbd = match.awayTeam == null;
  const homeDisplay = homeName ?? match.homeSlotLabel ?? "미정";
  const awayDisplay = awayName ?? match.awaySlotLabel ?? "미정";

  // 카드 외곽 — LIVE 강조 / 그 외 일반 보더
  // 2026-05-02 사용자 요청: 카드 클릭 시 /live/[id] 매치 상세로 이동 (일정 카드와 동일)
  return (
    <Link
      href={`/live/${match.id}`}
      className="block rounded-lg border p-3 transition-all hover:opacity-80"
      style={{
        borderColor: isLive ? "var(--color-primary)" : "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      {/* 상단 메타 — schedule-timeline 카드 패턴: 좌측 inline (시간|구분선|라운드명|조뱃지), 우측 상태 배지 */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {/* 매치번호 */}
          <span
            className="font-mono text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            #{match.matchNumber ?? "-"}
          </span>
          {/* 구분선 */}
          <span className="text-xs" style={{ color: "var(--color-border)" }}>
            |
          </span>
          {/* 라운드명 */}
          <span
            className="text-xs font-medium truncate"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {match.roundName}
          </span>
          {/* 조 뱃지 — Stage 2 (조별 최종전)에서만 표시 */}
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
          {/* 날짜+시간 — 2026-05-02 사용자 요청으로 시간만→날짜+시간 확장
              폴드5 388px 대응: 부모 div 가 flex-wrap 이미 적용 — 메타 길어지면 다음 줄로 wrap. */}
          <span className="text-xs" style={{ color: "var(--color-border)" }}>
            |
          </span>
          <span
            className="text-xs font-bold whitespace-nowrap"
            style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-heading)" }}
          >
            {formatDateTimeShort(match.scheduledAt)}
          </span>
        </div>
        {/* 상태 배지 — LIVE/종료/예정 모두 표시 (일정 카드와 동일 패턴) */}
        <DualStatusBadge status={match.status} />
      </div>

      {/* 하단: 팀 로고 + 팀명 — 가운데 점수/VS — 팀명 + 팀 로고 */}
      <div className="flex items-center justify-between">
        {/* 홈팀 — 좌측 (로고 + 팀명) */}
        <div className="flex flex-1 items-center gap-2 text-left min-w-0">
          <DualTeamLogo
            logoUrl={match.homeTeam?.team.logoUrl ?? null}
            name={homeName}
          />
          {match.homeTeam ? (
            // 팀 확정 — 카드 전체가 매치 상세 Link 라 중첩 회피 위해 span 처리
            <span
              className={`truncate text-base leading-tight ${
                homeWon ? "font-bold" : "font-medium"
              }`}
              style={{
                color: homeWon
                  ? "var(--color-text-primary)"
                  : completed && !homeWon
                  ? "var(--color-text-secondary)"
                  : "var(--color-text-primary)",
              }}
            >
              {homeDisplay}
            </span>
          ) : (
            // 빈 슬롯 — italic muted
            <span
              className="truncate text-base italic leading-tight"
              style={{ color: "var(--color-text-muted)" }}
              title={homeDisplay}
            >
              {homeDisplay}
            </span>
          )}
        </div>

        {/* 가운데 — 점수 박스 또는 VS (일정 카드와 동일 패턴)
            2026-05-02 사용자 요청: 점수 박스 30% 확대 (일정 카드와 동일 비율)
            - 글자: text-sm(14) → text-lg(18) ≈ 28%↑, 콜론 text-xs → text-sm
            - 박스: px-3 py-1 → px-4 py-1.5
            - VS: text-xs → text-base */}
        <div className="mx-3 flex-shrink-0">
          {showScore ? (
            <div
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5"
              style={{ backgroundColor: "var(--color-elevated)" }}
            >
              <span
                className="text-lg font-bold tabular-nums"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: homeWon ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
              >
                {homeIsTbd ? "—" : formatScore(match, "home")}
              </span>
              <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                :
              </span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: awayWon ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
              >
                {awayIsTbd ? "—" : formatScore(match, "away")}
              </span>
            </div>
          ) : (
            <span
              className="rounded-full px-4 py-1.5 text-base font-bold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "white",
              }}
            >
              VS
            </span>
          )}
        </div>

        {/* 어웨이팀 — 우측 (팀명 + 로고) */}
        <div className="flex flex-1 items-center justify-end gap-2 text-right min-w-0">
          {match.awayTeam ? (
            <span
              className={`truncate text-base leading-tight ${
                awayWon ? "font-bold" : "font-medium"
              }`}
              style={{
                color: awayWon
                  ? "var(--color-text-primary)"
                  : completed && !awayWon
                  ? "var(--color-text-secondary)"
                  : "var(--color-text-primary)",
              }}
            >
              {awayDisplay}
            </span>
          ) : (
            <span
              className="truncate text-base italic leading-tight"
              style={{ color: "var(--color-text-muted)" }}
              title={awayDisplay}
            >
              {awayDisplay}
            </span>
          )}
          <DualTeamLogo
            logoUrl={match.awayTeam?.team.logoUrl ?? null}
            name={awayName}
          />
        </div>
      </div>
    </Link>
  );
}

// ── 듀얼 매치 카드 상태 배지 ──
// 일정 탭 StatusBadge 와 동일 시각 (Badge ui 컴포넌트 미사용 — 박제 컴포넌트 의존 최소화)
function DualStatusBadge({ status }: { status: BracketMatch["status"] }) {
  if (status === "completed") {
    return (
      <span
        className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-info) 14%, transparent)",
          color: "var(--color-info)",
        }}
      >
        종료
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
        style={{
          backgroundColor: "var(--color-error)",
          color: "#ffffff",
        }}
      >
        LIVE
      </span>
    );
  }
  // 예정/그 외
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
      style={{
        backgroundColor: "var(--color-elevated)",
        color: "var(--color-text-tertiary)",
      }}
    >
      예정
    </span>
  );
}
