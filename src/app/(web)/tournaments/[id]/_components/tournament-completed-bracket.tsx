"use client";

/**
 * 대회 종료 — 대진표 탭 (B안 §3·§4 / 전략 나: 종료 전용 신규 복제)
 *
 * 왜 신규 복제인가 (공유 컴포넌트 restyle ❌):
 *   시안 NBA 브래킷(nba-bracket: row 카드 + 순수 CSS 커넥터)과 예선 qual(조별 grid)은
 *   운영 BracketView(SVG 트리) / GroupStandings 와 마크업 구조가 근본적으로 다르다.
 *   CSS override 로 NBA 재현 불가 + 공유 컴포넌트 수정 시 진행중 뷰 즉시 회귀.
 *   → 종료 전용 컴포넌트로 데이터만 와이어 = 진행중 뷰 회귀 0.
 *
 * 데이터 소스:
 *   기존 /api/web/tournaments/{id}/public-bracket (V2BracketWrapper 와 동일 SWR / API 0 변경)
 *   - rounds: 본선 토너먼트 (roundName + matches[] / homeTeam·awayTeam·score·winnerTeamId)
 *   - groupTeams: 예선 조별 (teamName·wins·losses·pointsFor·pointsAgainst·groupName)
 *   둘 다 0 → 해당 섹션 hide.
 *
 * 0 스키마: 예선 득실(pointsFor/pointsAgainst)이 public-bracket 응답에 이미 포함됨 → 폴백 불필요.
 *
 * 강조색: 승자점수=var(--bdr-red) / 승자행 inset=var(--bdr-navy) (시안 의미색 그대로) /
 *         예선 상위2 강조·흐름마크 on = var(--cafe-blue) (시안 --accent 빨강 → 치환)
 */

import useSWR from "swr";
import { convertKeysToCamelCase } from "@/lib/utils/case";
import { Skeleton } from "@/components/ui/skeleton";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- API 응답 구조 다양 (V2BracketWrapper 패턴 동일)
type ApiResponse = Record<string, any>;
const fetcher = (url: string): Promise<ApiResponse> =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`);
      return r.json();
    })
    .then((json) => convertKeysToCamelCase(json) as ApiResponse);

// ── public-bracket 응답 타입 (필요 필드만) ──
// teamId: 슬롯 팀의 실제 Team.id 문자열 (bracket-builder toTeamSlot 에서 직렬화됨).
//   winnerTeamId(= winner_team_id.toString()) 와 동일 식별자 → 승자 직접 비교에 사용.
type ApiTeamSlot = {
  teamId?: string;
  seedNumber: number | null;
  team: { name: string; logoUrl?: string | null } | null;
} | null;
type ApiMatch = {
  homeTeam: ApiTeamSlot;
  awayTeam: ApiTeamSlot;
  homeScore: number;
  awayScore: number;
  winnerTeamId: string | null;
  status: string;
};
type ApiRound = { roundName: string; matches: ApiMatch[] };
type ApiGroupTeam = {
  teamName: string;
  groupName: string | null;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
};

interface Props {
  tournamentId: string;
}

/** 라운드명 → 한국어 단축 라벨 (V2BracketWrapper shortRoundLabel 패턴) */
function shortRoundLabel(roundName: string | null | undefined): string {
  if (!roundName) return "-";
  const lower = String(roundName).toLowerCase();
  if (lower.includes("final") && !lower.includes("semi") && !lower.includes("quarter"))
    return "결승";
  if (lower.includes("semi")) return "준결승";
  if (lower.includes("quarter") || lower === "qf") return "8강";
  if (lower.includes("16")) return "16강";
  if (lower.includes("32")) return "32강";
  return roundName;
}

/** 팀명 이니셜 (시안 TeamDot 대체) */
function initial(name: string | null | undefined): string {
  const t = (name ?? "").trim();
  return t ? t.slice(0, 1) : "?";
}

// ── NBA 식 한 팀 행 ──
function NbaRow({ slot, score, isWin }: { slot: ApiTeamSlot; score: number; isWin: boolean }) {
  const name = slot?.team?.name ?? "미정";
  return (
    <div className={"nba-row" + (isWin ? " is-win" : "")}>
      <span className="nba-row__seed">{slot?.seedNumber != null ? `#${slot.seedNumber}` : "-"}</span>
      <span className="nba-row__dot">{initial(name)}</span>
      <span className="nba-row__name">{name}</span>
      <span className="nba-row__score">{score}</span>
    </div>
  );
}

// ── 한 경기 (홈/어웨이 2행) ──
function NbaGame({ m }: { m: ApiMatch }) {
  // 승자 판정 — winnerTeamId 직접 비교 우선, 없으면 점수 비교 폴백 (완료 매치 한정).
  //   winnerTeamId 와 슬롯 teamId 는 둘 다 Team.id 문자열(bracket-builder) → === 비교가 가장 정확.
  //   동점인데 winner_team_id 가 세팅된 케이스(추첨/승부결정)도 직접 비교로 정확히 강조된다.
  //   winnerTeamId 가 null(미확정) 일 때만 완료 매치 점수 비교로 폴백.
  const homeWin =
    m.winnerTeamId != null
      ? m.homeTeam?.teamId === m.winnerTeamId
      : m.status === "completed" && m.homeScore > m.awayScore;
  const awayWin =
    m.winnerTeamId != null
      ? m.awayTeam?.teamId === m.winnerTeamId
      : m.status === "completed" && m.awayScore > m.homeScore;
  return (
    <div className="nba-game">
      <NbaRow slot={m.homeTeam} score={m.homeScore} isWin={homeWin} />
      <NbaRow slot={m.awayTeam} score={m.awayScore} isWin={awayWin} />
    </div>
  );
}

// ── 한 라운드 컬럼 ──
function NbaRound({ label, matches }: { label: string; matches: ApiMatch[] }) {
  return (
    <div className="nba-col nba-round">
      <div className="nba-col__title">{label}</div>
      <div className="nba-col__body">
        {matches.map((m, i) => (
          <NbaGame key={i} m={m} />
        ))}
      </div>
    </div>
  );
}

// ── 커넥터 (라운드 간 브래킷 선) ──
//   pairs = 다음 라운드 경기 수 (이전 라운드 2경기 → 1쌍). single = 결승→우승 단일선.
function NbaConn({ pairs, single }: { pairs: number; single?: boolean }) {
  return (
    <div className={"nba-col nba-conn" + (single ? " nba-conn--single" : "")}>
      <div className="nba-col__title" />
      <div className="nba-col__body">
        {Array.from({ length: pairs }).map((_, i) => (
          <div key={i} className="nba-conn__cell">
            {single ? <span className="nba-conn__line" /> : <span className="nba-conn__br" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 본선 NBA 브래킷 (가변 라운드) ──
function NbaBracket({ rounds, champName }: { rounds: ApiRound[]; champName: string | null }) {
  // 라운드 사이에 커넥터 삽입. 마지막 라운드 뒤 + 우승 컬럼.
  const cols: React.ReactNode[] = [];
  rounds.forEach((rd, idx) => {
    cols.push(
      <NbaRound key={`r-${idx}`} label={shortRoundLabel(rd.roundName)} matches={rd.matches} />,
    );
    // 라운드 간 커넥터: 다음 라운드가 있으면 다음 라운드 경기 수만큼 br 커넥터
    if (idx < rounds.length - 1) {
      const nextPairs = rounds[idx + 1].matches.length || 1;
      cols.push(<NbaConn key={`c-${idx}`} pairs={nextPairs} />);
    }
  });
  // 마지막 라운드(결승)가 1경기면 우승 단일 커넥터 + 챔피언 카드
  if (champName) {
    cols.push(<NbaConn key="c-champ" pairs={1} single />);
    cols.push(
      <div key="champ" className="nba-col nba-champ-col">
        <div className="nba-col__title">우승</div>
        <div className="nba-col__body">
          <div className="nba-champ">
            <span className="nba-champ__trophy">🏆</span>
            <span className="nba-champ__dot">{initial(champName)}</span>
            <span className="nba-champ__team">{champName}</span>
            <span className="nba-champ__lbl">CHAMPION</span>
          </div>
        </div>
      </div>,
    );
  }
  return <div className="nba-bracket">{cols}</div>;
}

// ── 예선 한 조 ──
function QualGroup({ name, rows }: { name: string; rows: ApiGroupTeam[] }) {
  return (
    <div className="qual">
      <div className="qual__h">
        <b>{name}</b>
        <span>예선 리그</span>
      </div>
      <div className="qual__head">
        <span>순위</span>
        <span>팀</span>
        <span>전적</span>
        <span>득실</span>
      </div>
      {rows.map((r, i) => {
        const diff = r.pointsFor - r.pointsAgainst;
        return (
          <div key={r.teamName + i} className={"qual__row" + (i < 2 ? " is-adv" : "")}>
            {/* 시드 라벨 = 조 첫글자 + 조내 순위 (예: A1) */}
            <span className="qual__seed">{(name?.[0] ?? "") + (i + 1)}</span>
            <span className="qual__team">
              <span className="qual__dot">{initial(r.teamName)}</span>
              <b>{r.teamName}</b>
            </span>
            <span className="qual__rec">
              {r.wins}
              <i>승</i> {r.losses}
              <i>패</i>
            </span>
            <span className={"qual__diff" + (diff >= 0 ? " pos" : " neg")}>
              {diff >= 0 ? "+" : ""}
              {diff}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TournamentCompletedBracket({ tournamentId }: Props) {
  const { data, isLoading, error } = useSWR(
    `/api/web/tournaments/${tournamentId}/public-bracket`,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) return <Skeleton className="h-96 w-full rounded-md" />;
  if (error)
    return (
      <div
        className="rounded-md border p-6 text-center text-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
          color: "var(--color-text-muted)",
        }}
      >
        대진표 데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    );

  const d = data ?? {};
  const rounds: ApiRound[] = d.rounds ?? [];
  const groupTeams: ApiGroupTeam[] = d.groupTeams ?? [];

  // 본선 챔피언 = 마지막 라운드(결승)의 승자 (1경기일 때만)
  const champName: string | null = (() => {
    if (rounds.length === 0) return null;
    const lastRound = rounds[rounds.length - 1];
    if (lastRound.matches.length !== 1) return null; // 결승이 단판 아니면 챔피언 카드 hide
    const final = lastRound.matches[0];
    if (final.status !== "completed") return null;
    if (final.homeScore === final.awayScore) return null; // 동점 = 미확정
    return final.homeScore > final.awayScore
      ? final.homeTeam?.team?.name ?? null
      : final.awayTeam?.team?.name ?? null;
  })();

  // 예선 조별 그룹핑 (groupName 기준)
  const groups: { name: string; rows: ApiGroupTeam[] }[] = (() => {
    if (groupTeams.length === 0) return [];
    const map = new Map<string, ApiGroupTeam[]>();
    for (const t of groupTeams) {
      const key = t.groupName ?? "예선";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    // 조내 정렬: 승 → 득실차 (조별 순위)
    for (const [, rows] of map) {
      rows.sort(
        (a, b) =>
          b.wins - a.wins ||
          b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst),
      );
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, rows]) => ({ name, rows }));
  })();

  const hasQual = groups.length > 0;
  const hasKnockout = rounds.length > 0;

  // 둘 다 없으면 빈 안내
  if (!hasQual && !hasKnockout) {
    return (
      <div className="tdr-pane">
        <div
          className="rounded-md border p-8 text-center text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text-muted)",
          }}
        >
          대진 정보가 아직 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="tdr-pane">
      {/* ① 예선 결과 (조별 리그) — groupTeams 0 시 hide */}
      {hasQual && (
        <div className="tdr-stcard">
          <h3 className="tdr-stcard__h">
            <span className="tdr-stcard__bar" />
            예선 결과 <small>(조별 리그 · 본선 시드 결정)</small>
          </h3>
          <div className="qual-grid">
            {groups.map((g) => (
              <QualGroup key={g.name} name={g.name} rows={g.rows} />
            ))}
          </div>
          <div className="qual-legend">
            <span className="qual-legend__dot" />
            상위 2팀 = 본선 상위 시드 <b>(조 순위로 대진 배정)</b>
          </div>
        </div>
      )}

      {/* 흐름 표시 — 예선·본선 둘 다 있을 때만 */}
      {hasQual && hasKnockout && (
        <div className="tdc-flowmark">
          <span>예선 리그</span>
          <span className="tdc-flowmark__arr">↓</span>
          <span className="on">본선 토너먼트</span>
        </div>
      )}

      {/* ② 본선 토너먼트 (NBA 식) — rounds 0 시 hide */}
      {hasKnockout && (
        <div className="tdr-stcard tdr-brcard">
          <h3 className="tdr-stcard__h">
            <span className="tdr-stcard__bar" />
            본선 토너먼트 <small>(단판 토너먼트 · 최종 결과)</small>
          </h3>
          <div className="tdr-brscroll">
            <NbaBracket rounds={rounds} champName={champName} />
          </div>
        </div>
      )}
    </div>
  );
}
