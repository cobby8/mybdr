import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { buildRoundGroups } from "@/lib/tournaments/bracket-builder";
// 5/9 displayName P0 — 공식 기록(MVP) 실명 우선 헬퍼
import { getDisplayName } from "@/lib/utils/player-display-name";
// 2026-05-16 PR-Public-1 — 종별 standings 산출 (admin /playoffs 와 동일 server-side 패턴 / 단일 source).
//   강남구협회장배 같은 다종별 대회에서 공개 bracket 탭에 종별 view 노출용.
//   getDivisionStandings 는 Promise.all 안에서 종별별 1쿼리 (admin 동등 부담).
import { getDivisionStandings, type DivisionStanding } from "@/lib/tournaments/division-advancement";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 대진표 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-bracket
 *
 * 대회 상세 페이지에서 "대진표" 탭 클릭 시 호출
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  // 대회 기본 정보 (대진표 헤더용)
  // format / status도 함께 조회해서 클라이언트가 포맷별 분기 렌더링을 할 수 있게 한다.
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    // 2026-05-17 — settings 추가 SELECT (points_rule 분기 — 강남구 P 컬럼 노출 결정).
    select: { name: true, venue_name: true, city: true, entry_fee: true, format: true, status: true, settings: true },
  });

  if (!tournament) {
    return apiError("Tournament not found", 404);
  }

  // 풀리그 포맷 판별 (리그 순위표/일정을 추가로 반환할지 결정)
  // round_robin: 순수 풀리그 / full_league: 풀리그만 / full_league_knockout: 풀리그 후 토너먼트
  // 2026-05-15 PR-G5.9 — league_advancement / group_stage_with_ranking 추가 (강남구 다종별 운영).
  //   tournament.format 이 null 인 다종별 대회 (종별마다 다른 format) 도 leagueMatches 노출 위해
  //   bracketOnlyMatches (round_number+bracket_position) 미해당 매치는 모두 leagueMatches 분기.
  // 2026-05-16 PR-Public-1 fix — divisionRules.length >= 1 (다종별 대회) 도 leagueMatches 노출.
  //   강남구협회장배 (format="dual_tournament" + 6 종별) 케이스 — DivisionsView 가 매치 0건 받지 않도록.
  //   divisionRules SELECT 가 line 109 에 있어 const 대신 let + 재할당 패턴.
  let isLeague =
    tournament.format === "round_robin" ||
    tournament.format === "full_league" ||
    tournament.format === "full_league_knockout" ||
    tournament.format === "league_advancement" ||
    tournament.format === "group_stage_with_ranking" ||
    tournament.format == null; // 다종별 대회 (종별별 다른 format)

  const [matches, tournamentTeams] = await Promise.all([
    // 매치 데이터
    // Phase F1: dual_tournament 5섹션 그룹핑용 group_name + settings(homeSlotLabel/awaySlotLabel/loserNextMatchId) 추가
    // bracket-builder가 옵셔널로 받기 때문에 single elim 회귀 0 (필드만 추가됨)
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
      include: {
        // 홈팀: 매치카드 시드 뱃지용 seedNumber 필드 명시 포함
        // select로 한정하면 불필요한 필드 전송을 줄이고 타입 일관성 확보
        // Phase 2C: 대진표 카드에 대표 언어 기준 한 줄만 표기하기 위해 name_en/name_primary 포함
        homeTeam: {
          select: {
            id: true,
            teamId: true,
            seedNumber: true,
            team: { select: { name: true, name_en: true, name_primary: true, primaryColor: true, home_color: true, away_color: true, logoUrl: true } },
          },
        },
        awayTeam: {
          select: {
            id: true,
            teamId: true,
            seedNumber: true,
            team: { select: { name: true, name_en: true, name_primary: true, primaryColor: true, home_color: true, away_color: true, logoUrl: true } },
          },
        },
        // 핫픽스(2026-04-16): Flutter "최종 스탯 입력 모드"로 저장된 경기는
        // TournamentMatch.homeScore/awayScore가 0인 채로 저장되는 경우가 있어서
        // 리그 순위표 wins/losses 집계가 전부 0으로 나오는 버그가 있음.
        // MatchPlayerStat.points 합산을 fallback으로 쓰기 위해 include 추가.
        // points와 tournamentTeamId만 가져와서 응답 크기 부담 최소화.
        playerStats: {
          select: {
            points: true,
            tournamentTeamPlayer: {
              select: { tournamentTeamId: true },
            },
          },
        },
      },
    }),
    // 참가팀
    // 2026-05-16 PR-Public-1: groupTeams 가 종별 필터링 가능하도록 category (division_code) 도 가져옴.
    //   (include 는 select 와 함께 못 쓰니 기존 include 유지 + tournamentTeam 자체 필드는 자동 포함됨 / category 도 자동 포함)
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: {
        // Phase 2C: 리그/조별 순위표 한 줄 표기용 name_en/name_primary 포함
        team: { select: { name: true, name_en: true, name_primary: true, logoUrl: true } },
      },
      orderBy: [{ wins: "desc" }, { losses: "asc" }],
    }),
  ]);

  // 2026-05-16 PR-Public-1 — 종별 룰 fetch (라벨 / format / settings).
  //   admin /playoffs:50 동일 패턴. divisionRules 0건이면 단일 종별 운영 ('default' 폴백 X — 빈 배열 그대로 반환).
  //   클라이언트가 divisionRules.length 로 종별 view 분기 결정.
  const divisionRulesRaw = await prisma.tournamentDivisionRule.findMany({
    where: { tournamentId: id },
    select: { code: true, label: true, sortOrder: true, format: true, settings: true },
    orderBy: { sortOrder: "asc" },
  });

  // 2026-05-17 강남구 승점 룰 — tournament.settings.points_rule 추출 (P 컬럼 + 정렬 분기).
  //   먼저 추출해서 종별 standings 산출 시 pointsRule 인자로 전달 (server-side 정렬 단일 source).
  const tournamentSettingsRaw = (tournament.settings ?? {}) as Record<string, unknown>;
  const pointsRule: "gnba" | "default" =
    tournamentSettingsRaw.points_rule === "gnba" ? "gnba" : "default";

  // 2026-05-16 PR-Public-1 — 종별별 standings 병렬 산출 (Promise.all / N+1 회피).
  //   admin /playoffs:77 동일 패턴. divisionRules 0건 = 빈 배열 (회귀 0).
  //   각 종별 standings = DivisionStanding[] (groupName 별 정렬 + groupRank 부여 / division-advancement.ts:54).
  // 2026-05-17 — pointsRule 인자 추가 (강남구협회장배 i3 U9 등 다종별 view P 컬럼 + 승점 정렬).
  //   bundle 안에 pointsRule 박제 → DivisionsView 가 그대로 사용 (단일 source).
  const divisionStandings: Array<{
    code: string;
    label: string;
    pointsRule: "gnba" | "default";
    standings: DivisionStanding[];
  }> =
    divisionRulesRaw.length > 0
      ? await Promise.all(
          divisionRulesRaw.map(async (r) => ({
            code: r.code,
            label: r.label,
            // 2026-05-17 — bundle 안에 pointsRule 박제 (클라이언트 컴포넌트가 그대로 사용).
            pointsRule,
            standings: await getDivisionStandings(prisma, id, r.code, pointsRule),
          })),
        )
      : [];

  // divisionRules 응답 페이로드 (settings JSON은 그대로 — 클라이언트가 group_size / group_count 등 활용).
  const divisionRules = divisionRulesRaw.map((r) => ({
    code: r.code,
    label: r.label,
    format: r.format,
    settings: r.settings,
  }));

  // 2026-05-16 PR-Public-1 fix — 다종별 대회 (divisionRules >= 1) 는 isLeague=true 강제.
  //   강남구협회장배 (format="dual_tournament" + 6 종별) 같은 케이스 — leagueMatches 빌드 의무.
  //   회귀 0 — 단일 종별 dual_tournament 대회 (divisionRules=0) 는 영향 0.
  if (divisionRulesRaw.length >= 1) {
    isLeague = true;
  }

  // 2026-05-02: live + in_progress 둘 다 라이브로 인식 (Flutter app 은 'live' 사용)
  const liveMatchList = matches.filter((m) => m.status === "live" || m.status === "in_progress");
  const liveMatchCount = liveMatchList.length;
  // LIVE 카드 클릭 → /live/[id] 이동용 — 첫 라이브 매치 정보 (단일 매치만)
  // 응답 가벼움 위해 첫 매치만 포함. 여러 라이브 시 클라이언트는 count 만 활용.
  const firstLive = liveMatchList[0];
  const liveMatchPreview = firstLive
    ? {
        id: firstLive.id.toString(),
        homeName: firstLive.homeTeam?.team.name ?? null,
        awayName: firstLive.awayTeam?.team.name ?? null,
      }
    : null;

  // 전체/완료 경기 수 (대시보드 진행률 카드용)
  // 2026-05-02 사용자 요청: 진행률 = (completed + live) / total — 라이브 경기도 진행 중으로 카운트
  const totalMatchCount = matches.length;
  const completedMatchCount = matches.filter((m) => m.status === "completed").length;
  const isAllCompleted = totalMatchCount > 0 && completedMatchCount === totalMatchCount;

  // 핫팀 계산: 경기 결과 기반 승률→득실차→다득점 1위 팀
  // (pointsRule 은 위 divisionStandings 산출 시점에 이미 추출됨 — 재추출 0)
  // Phase 2C: teamStats에 name_en/name_primary도 캐시해두어 리그 순위표/핫팀 응답에 함께 내려줌
  // 2026-05-17 — winPoints 추가 (강남구 승점 / DB 박제값 기반).
  const teamStats: Record<string, {
    wins: number; losses: number;
    pointsFor: number; pointsAgainst: number;
    winPoints: number;
    teamId: bigint; teamName: string;
    teamNameEn: string | null; teamNamePrimary: string | null;
  }> = {};

  for (const t of tournamentTeams) {
    teamStats[t.id.toString()] = {
      wins: 0, losses: 0,
      pointsFor: 0, pointsAgainst: 0,
      // 2026-05-17 — DB 박제 win_points 직접 사용 (update-standings.ts 가 SET).
      //   재계산 vs DB 박제 — 후자 (단일 source / 회귀 위험 0).
      winPoints: t.win_points ?? 0,
      teamId: t.teamId, teamName: t.team.name,
      // Phase 2C: 한/영 병기 필드
      teamNameEn: t.team.name_en,
      teamNamePrimary: t.team.name_primary,
    };
  }

  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    if (m.status !== "completed" && m.status !== "live") continue;
    const hid = m.homeTeamId.toString();
    const aid = m.awayTeamId.toString();

    // 핫픽스(2026-04-16): DB 점수가 0이면 MatchPlayerStat.points 합산으로 fallback
    // Flutter 최종 스탯 입력 모드로 저장된 경기 대응 (homeScore/awayScore=0인 채 저장됨)
    // BigInt 비교: ps.tournamentTeamPlayer.tournamentTeamId와 m.homeTeamId 모두 bigint라 === 가능
    const homePtsSum = (m.playerStats ?? [])
      .filter((ps) => ps.tournamentTeamPlayer?.tournamentTeamId === m.homeTeamId)
      .reduce((s, p) => s + (p.points ?? 0), 0);
    const awayPtsSum = (m.playerStats ?? [])
      .filter((ps) => ps.tournamentTeamPlayer?.tournamentTeamId === m.awayTeamId)
      .reduce((s, p) => s + (p.points ?? 0), 0);

    // DB 점수가 0보다 크면 그대로 사용, 아니면 playerStats 합산으로 대체
    const hs = m.homeScore && m.homeScore > 0 ? m.homeScore : homePtsSum;
    const as_ = m.awayScore && m.awayScore > 0 ? m.awayScore : awayPtsSum;

    if (teamStats[hid]) { teamStats[hid].pointsFor += hs; teamStats[hid].pointsAgainst += as_; }
    if (teamStats[aid]) { teamStats[aid].pointsFor += as_; teamStats[aid].pointsAgainst += hs; }

    if (m.status === "completed" || m.status === "live") {
      if (hs > as_) {
        if (teamStats[hid]) teamStats[hid].wins++;
        if (teamStats[aid]) teamStats[aid].losses++;
      } else if (as_ > hs) {
        if (teamStats[aid]) teamStats[aid].wins++;
        if (teamStats[hid]) teamStats[hid].losses++;
      }
    }
  }

  // 경기 1개 이상 한 팀 중 승률→득실차→다득점 순 정렬
  const ranked = Object.values(teamStats)
    .filter((t) => (t.wins + t.losses) > 0)
    .sort((a, b) => {
      const aRate = a.wins / (a.wins + a.losses);
      const bRate = b.wins / (b.wins + b.losses);
      if (bRate !== aRate) return bRate - aRate;
      const aDiff = a.pointsFor - a.pointsAgainst;
      const bDiff = b.pointsFor - b.pointsAgainst;
      if (bDiff !== aDiff) return bDiff - aDiff;
      return b.pointsFor - a.pointsFor;
    });

  // 2026-05-02: 직전 종료 매치 MVP 추출 (HOT 카드 — 대회 진행 중 표시)
  // mvp_player_id 컬럼은 Flutter app 이 자동 채우지 않음 → playerStats 기반 GameScore 공식으로 추정.
  // 가장 최근 종료 매치 1건만 별도 fetch (응답 부담 최소화).
  let recentMvp: {
    matchId: string;
    homeTeamName: string;
    awayTeamName: string;
    playerId: number;
    name: string;
    jerseyNumber: number | null;
    teamName: string;
    pts: number;
    reb: number;
    ast: number;
  } | null = null;
  const completedSorted = matches
    .filter((m) => m.status === "completed" && m.ended_at)
    .sort((a, b) => (b.ended_at?.getTime() ?? 0) - (a.ended_at?.getTime() ?? 0));
  const recentMatch = completedSorted[0];
  if (recentMatch) {
    const recentDetail = await prisma.tournamentMatch.findUnique({
      where: { id: recentMatch.id },
      select: {
        id: true,
        homeTeam: { select: { team: { select: { name: true } } } },
        awayTeam: { select: { team: { select: { name: true } } } },
        playerStats: {
          select: {
            tournamentTeamPlayerId: true,
            points: true,
            fieldGoalsMade: true,
            fieldGoalsAttempted: true,
            freeThrowsMade: true,
            freeThrowsAttempted: true,
            offensive_rebounds: true,
            defensive_rebounds: true,
            total_rebounds: true,
            assists: true,
            steals: true,
            blocks: true,
            personal_fouls: true,
            turnovers: true,
            tournamentTeamPlayer: {
              select: {
                id: true,
                jerseyNumber: true,
                player_name: true,
                users: { select: { name: true, nickname: true } },
                tournamentTeam: { select: { team: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });
    if (recentDetail && recentDetail.playerStats.length > 0) {
      // GameScore 공식 (route.ts /api/live/[id] 와 동일)
      const candidates = recentDetail.playerStats.map((s) => {
        const fgm = s.fieldGoalsMade ?? 0;
        const fga = s.fieldGoalsAttempted ?? 0;
        const fta = s.freeThrowsAttempted ?? 0;
        const ftm = s.freeThrowsMade ?? 0;
        const oreb = s.offensive_rebounds ?? 0;
        const dreb = s.defensive_rebounds ?? 0;
        const score = (s.points ?? 0) + 0.4 * fgm - 0.7 * fga - 0.4 * (fta - ftm)
          + 0.7 * oreb + 0.3 * dreb + (s.steals ?? 0) + 0.7 * (s.assists ?? 0)
          + 0.7 * (s.blocks ?? 0) - 0.4 * (s.personal_fouls ?? 0) - (s.turnovers ?? 0);
        return { stat: s, score };
      });
      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.stat.points ?? 0) - (a.stat.points ?? 0);
      });
      const top = candidates[0];
      if (top && (top.stat.points ?? 0) > 0) {
        const p = top.stat.tournamentTeamPlayer;
        // 5/9 displayName P0 — 공식 기록(MVP)은 실명 우선.
        // 헬퍼: name → nickname → ttp.player_name → '#'+jersey → fallback
        // fallback = `#-` (jerseyNumber 도 null 인 극단 케이스).
        const playerName = getDisplayName(
          p.users,
          { player_name: p.player_name, jerseyNumber: p.jerseyNumber },
          `#${p.jerseyNumber ?? "-"}`,
        );
        recentMvp = {
          matchId: recentDetail.id.toString(),
          homeTeamName: recentDetail.homeTeam?.team.name ?? "",
          awayTeamName: recentDetail.awayTeam?.team.name ?? "",
          playerId: Number(p.id),
          name: playerName,
          jerseyNumber: p.jerseyNumber,
          teamName: p.tournamentTeam?.team.name ?? "",
          pts: top.stat.points ?? 0,
          reb: top.stat.total_rebounds ?? 0,
          ast: top.stat.assists ?? 0,
        };
      }
    }
  }

  const hotTeam = ranked[0]
    ? {
        teamId: ranked[0].teamId.toString(),
        teamName: ranked[0].teamName,
        // Phase 2C: 핫팀 카드도 대표언어 기준 표기를 위해 내려줌
        teamNameEn: ranked[0].teamNameEn,
        teamNamePrimary: ranked[0].teamNamePrimary,
      }
    : null;

  const bracketOnlyMatches = matches.filter(
    (m) => m.round_number != null && m.bracket_position != null
  );

  const finalsDate = bracketOnlyMatches.length > 0
    ? (() => {
        const maxRound = Math.max(...bracketOnlyMatches.map((m) => m.round_number!));
        const finalMatch = bracketOnlyMatches.find((m) => m.round_number === maxRound);
        return finalMatch?.scheduledAt?.toISOString() ?? null;
      })()
    : null;

  // 그룹 팀 데이터
  // 2026-05-16 PR-Public-1: 종별 분류 필요 (다종별 view 에서 종별 탭 클릭 시 해당 종별 그룹만 표시).
  //   tournamentTeam.category = 종별 코드 (TournamentDivisionRule.code 와 매핑 / 다종별 단일 source).
  //   기존 단일 종별 운영은 division=null 그대로 → 클라이언트가 모든 그룹 표시 (회귀 0).
  const groupTeams = tournamentTeams
    .filter((t) => t.groupName != null)
    .map((t) => ({
      id: t.id.toString(),
      teamId: t.teamId.toString(), // Team 테이블의 실제 id (팀 페이지 링크용)
      teamName: t.team.name,
      // Phase 2C: 조별 순위표 한 줄 표기용
      teamNameEn: t.team.name_en,
      teamNamePrimary: t.team.name_primary,
      // 2026-05-15 — 팀 로고 표시 (사용자 결재 옵션 B). 없으면 클라이언트가 이니셜 fallback.
      logoUrl: t.team.logoUrl ?? null,
      groupName: t.groupName,
      // 2026-05-16 PR-Public-1: 종별 코드 (다종별 view 에서 필터링용 / 단일 종별은 null).
      division: t.category ?? null,
      wins: t.wins ?? 0,
      losses: t.losses ?? 0,
      draws: t.draws ?? 0,
      pointsFor: t.points_for ?? 0,
      pointsAgainst: t.points_against ?? 0,
      pointDifference: t.point_difference ?? 0,
      // 2026-05-17 강남구 승점 — DB 박제값 (강남구 한정 의미. 다른 대회는 wins*3 자연 박제).
      winPoints: t.win_points ?? 0,
    }));

  // 라운드 그룹 빌드
  const rounds = bracketOnlyMatches.length > 0 ? buildRoundGroups(bracketOnlyMatches) : [];

  // 풀리그(리그전) 순위표 데이터
  // 이미 위에서 teamStats로 집계한 wins/losses/pointsFor/pointsAgainst를 재사용한다.
  // 순위 탭(public-standings)과 동일한 형식(winRate, gamesPlayed, pointDifference)으로 맞춰서 클라이언트가 그대로 렌더링 가능하게 한다.
  const leagueTeams = isLeague
    ? tournamentTeams
        .map((t) => {
          const stats = teamStats[t.id.toString()] ?? {
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            winPoints: 0,
          };
          const gamesPlayed = stats.wins + stats.losses;
          // 소수점 3자리까지 유지 (KBL 형식)
          const winRate = gamesPlayed > 0 ? Math.round((stats.wins / gamesPlayed) * 1000) / 1000 : 0;
          return {
            id: t.id.toString(),
            teamId: t.teamId.toString(),
            teamName: t.team.name,
            // Phase 2C: 리그 순위표 한 줄 표기용
            teamNameEn: t.team.name_en,
            teamNamePrimary: t.team.name_primary,
            wins: stats.wins,
            losses: stats.losses,
            gamesPlayed,
            winRate,
            pointsFor: stats.pointsFor,
            pointsAgainst: stats.pointsAgainst,
            pointDifference: stats.pointsFor - stats.pointsAgainst,
            // 2026-05-17 강남구 승점 — DB 박제값.
            winPoints: stats.winPoints,
          };
        })
        .sort((a, b) => {
          // 2026-05-17 정렬 분기 (사용자 명시 이미지 #182):
          //   - 강남구 (pointsRule="gnba"): 승점 desc → 득실차 desc → 다득점 desc (규정 정합)
          //   - default 대회: 승률 desc → 득실차 desc → 다득점 desc (= 기존 정렬 복원)
          //     사유: default 대회는 winPoints=wins*3 이라 경기수 다를 시 winPoints ≠ winRate.
          //     예: 5승 2패 (winPoints 15 / .714) vs 4승 0패 (winPoints 12 / 1.000) → 승률 정렬 정합.
          if (pointsRule === "gnba") {
            if (b.winPoints !== a.winPoints) return b.winPoints - a.winPoints;
          } else {
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          }
          if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
          return b.pointsFor - a.pointsFor;
        })
    : [];

  // 풀리그 경기 일정 (전체 경기 시간순 정렬)
  // 토너먼트 트리와 달리 풀리그는 라운드 개념이 없으므로 시간순 리스트로 표시
  const leagueMatches = isLeague
    ? matches
        .map((m) => {
          // 2026-05-15 PR-G5.9 — placeholder 매치 + 다종별 시각화용 필드 추가.
          //   settings.division_code / homeSlotLabel / awaySlotLabel → bracket 탭 카드에서
          //   종별 chip + "A조 1위" 슬롯 라벨 표시 가능. venue_name 도 동시 노출.
          //   schedule-timeline 와 동일 필드 (UI 컴포넌트 재사용 친화).
          const s = m.settings as {
            division_code?: string;
            homeSlotLabel?: string;
            awaySlotLabel?: string;
          } | null;
          return {
            id: m.id.toString(),
            // homeTeam/awayTeam은 TournamentTeam을 가리키고, 그 안의 teamId가 실제 Team.id
            homeTeamId: m.homeTeam?.teamId?.toString() ?? null,
            awayTeamId: m.awayTeam?.teamId?.toString() ?? null,
            homeTeamName: m.homeTeam?.team?.name ?? null,
            awayTeamName: m.awayTeam?.team?.name ?? null,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status: m.status,
            scheduledAt: m.scheduledAt?.toISOString() ?? null,
            courtNumber: m.court_number,
            roundName: m.roundName,
            // PR-G5.9 신규 필드
            venueName: m.venue_name,
            division: s?.division_code ?? null,
            homeSlotLabel: s?.homeSlotLabel ?? null,
            awaySlotLabel: s?.awaySlotLabel ?? null,
          };
        })
        .sort((a, b) => {
          // 일정 미정(scheduledAt=null)은 맨 뒤로
          if (!a.scheduledAt && !b.scheduledAt) return 0;
          if (!a.scheduledAt) return 1;
          if (!b.scheduledAt) return -1;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        })
    : [];

  return apiSuccess({
    tournamentName: tournament.name,
    totalTeams: tournamentTeams.length,
    liveMatchCount,
    liveMatchPreview, // 2026-05-02: LIVE 카드 클릭 → /live/[id] 이동용
    finalsDate,
    totalMatches: totalMatchCount,
    completedMatches: completedMatchCount,
    isAllCompleted, // 2026-05-02: HOT 카드 — 모든 경기 종료 후 핫팀 노출
    hotTeam,
    recentMvp, // 2026-05-02: HOT 카드 — 진행 중에는 직전 종료 매치 MVP 노출
    groupTeams,
    rounds,
    venueName: tournament.venue_name,
    city: tournament.city,
    entryFee: tournament.entry_fee ? Number(tournament.entry_fee) : null,
    // 포맷별 조건부 렌더링용
    format: tournament.format,
    tournamentStatus: tournament.status,
    leagueTeams,
    leagueMatches,
    // 2026-05-16 PR-Public-1 — 다종별 view 용 신규 필드 3건.
    //   divisionRules: 종별 라벨 / 진행 방식 / settings (group_size 등).
    //   divisionStandings: 종별별 standings (admin /playoffs 와 동일 server-side 산출 / 단일 source).
    //   기존 필드 변경 0 — 단일 종별 대회 회귀 0.
    divisionRules,
    divisionStandings,
    // 2026-05-17 강남구 승점 룰 — 클라이언트 컴포넌트 P 컬럼 분기 노출용.
    //   "gnba" 박제 = LeagueStandings/GroupStandings 가 P 컬럼 렌더링.
    //   "default" = P 컬럼 hide (회귀 0).
    pointsRule,
  });
}
