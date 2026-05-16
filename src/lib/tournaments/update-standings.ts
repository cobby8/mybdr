import { prisma } from "@/lib/db/prisma";

/**
 * 경기 결과 기록 후 승자 진출 처리
 * TournamentMatch.winner_team_id → next_match_id의 빈 슬롯에 배치
 *
 * ⚠️ single elim 전용. dual_tournament 는 progressDualMatch 가 진출 처리 (loser bracket 포함).
 * (2026-05-03 가드 추가: dual 매치에 본 함수가 호출되어 home/away 모두 winner 로 set 되는
 *  무한 루프 corrupt 발생 — sync route 의 진입 차단과 더불어 함수 자체에도 이중 가드.)
 */
export async function advanceWinner(matchId: bigint): Promise<void> {
  // dual_tournament 가드 — format 만 조회하여 본 함수 대상 외이면 즉시 종료
  const matchForGuard = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { tournament: { select: { format: true } } },
  });
  if (matchForGuard?.tournament?.format === "dual_tournament") return;

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      next_match_id: true,
      winner_team_id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      tournamentId: true,
    },
  });

  if (!match?.next_match_id || !match.winner_team_id) return;

  const nextMatch = await prisma.tournamentMatch.findUnique({
    where: { id: match.next_match_id },
    select: { homeTeamId: true, awayTeamId: true },
  });
  if (!nextMatch) return;

  // 빈 슬롯에 승자 배치 (home 먼저, 이미 채워졌으면 away)
  const slot = nextMatch.homeTeamId === null ? "homeTeamId" : "awayTeamId";

  await prisma.tournamentMatch.update({
    where: { id: match.next_match_id },
    data: { [slot]: match.winner_team_id },
  });
}

/**
 * 경기 완료 시 팀 전적 SET 방식 박제 (idempotent — 동일 매치 N회 호출 안전).
 *
 * 2026-05-16 영구 fix (errors.md 6회째 회귀 차단 — PR-G5.5-followup-B):
 *   기존 increment 방식 → 동일 매치 다중 path 호출 시 N배 박제 (은평 PA 17→34 사고).
 *   본 함수 = 매치 단건 trigger → 종별 모든 매치 재계산 SET 방식 — 호출 가드 의존 0.
 *
 * 동작:
 *   1. 매치 단건 SELECT (tournamentId / home/away teamId / settings.division_code)
 *   2. 같은 tournament + 같은 division_code 의 status=completed + winner_team_id NOT NULL 매치 N건 SELECT
 *      (division_code 없으면 같은 tournament 전체 — 4차 뉴비리그 패턴 호환)
 *   3. in-memory 합산 (wins/losses/draws/PF/PA/PD — 각 팀이 참여한 모든 매치)
 *   4. TournamentTeam.updateMany (영향 받는 2건 — home + away) SET 방식 박제
 *
 * race 안전: concurrent 2회 호출 시 마지막 호출이 정확한 결과 SET (증분 누적 X).
 * 가드 무관: caller 가드 (alreadyCompleted / prev status) 우회해도 항상 정확.
 * 외부 스크립트 안전: scripts/_temp/* 가 직접 호출해도 안전 (SET 재계산).
 *
 * 시그니처 변경 0 — 기존 caller 5종 (admin/match-sync/batch-sync/status PATCH/score-sheet) 호환.
 */
export async function updateTeamStandings(
  matchId: bigint,
): Promise<void> {
  // ─────────────────────────────────────────────────────────────────────
  // 1. 매치 단건 SELECT — tournamentId + home/away + division_code 식별
  // ─────────────────────────────────────────────────────────────────────
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
      settings: true,
    },
  });

  // 매치 미존재 또는 양 팀 NULL → 무처리 (기존 동작 보존)
  if (!match || match.homeTeamId === null || match.awayTeamId === null) return;

  // settings.division_code 추출 — 종별 격리 매핑
  // 사유: 같은 tournament 의 다른 종별 매치가 standings 에 영향 주면 안 됨 (격리 의무)
  const settingsRaw = (match.settings ?? {}) as Record<string, unknown>;
  const divisionCode =
    typeof settingsRaw.division_code === "string" ? settingsRaw.division_code : null;

  // ─────────────────────────────────────────────────────────────────────
  // 2. 같은 tournament + 같은 division_code 의 완료 매치 전체 SELECT
  //   사유: 종별 모든 매치 합산이 idempotent 보장의 핵심.
  //   divisionCode 없음 → 4차 뉴비리그 (settings.division_code 미설정) 패턴 → tournament 전체.
  //   divisionCode 있음 → 강남구협회장배 등 종별 격리 (다른 종별 매치 영향 차단).
  // ─────────────────────────────────────────────────────────────────────
  const matchesWhere: {
    tournamentId: string;
    status: "completed";
    winner_team_id: { not: null };
    settings?: { path: string[]; equals: string };
  } = {
    tournamentId: match.tournamentId,
    status: "completed",
    winner_team_id: { not: null },
  };
  if (divisionCode !== null) {
    matchesWhere.settings = { path: ["division_code"], equals: divisionCode };
  }

  const completedMatches = await prisma.tournamentMatch.findMany({
    where: matchesWhere,
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winner_team_id: true,
    },
  });

  // 무승부 매치도 standings 에 포함 — winner_team_id NOT NULL 필터 후 별도 SELECT 1건
  // 사유: 현 비즈니스 룰상 무승부 매치도 PF/PA + draws 박제 의무.
  //   기존 함수 (L75) 의 isDraw 분기 호환 — winner_team_id === null + scores 있음 = draws++
  //   완료 매치 중 winner_team_id NULL 인 매치 = 무승부 케이스.
  const drawMatchesWhere: {
    tournamentId: string;
    status: "completed";
    winner_team_id: null;
    settings?: { path: string[]; equals: string };
  } = {
    tournamentId: match.tournamentId,
    status: "completed",
    winner_team_id: null,
  };
  if (divisionCode !== null) {
    drawMatchesWhere.settings = { path: ["division_code"], equals: divisionCode };
  }
  const drawMatches = await prisma.tournamentMatch.findMany({
    where: drawMatchesWhere,
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. in-memory 합산 (영향 받는 2 팀: home + away 만 계산)
  //   사유: 모든 팀을 합산할 필요 없음 — 본 함수는 매치 단건 trigger 이므로 영향 받는 2 팀만 UPDATE.
  //   (전체 종별 reset 은 scripts/_temp/recalc-standings-set.ts 의 역할이었음 — 본 함수 통합 후 삭제)
  // ─────────────────────────────────────────────────────────────────────
  type Stats = { wins: number; losses: number; draws: number; pf: number; pa: number };
  const init = (): Stats => ({ wins: 0, losses: 0, draws: 0, pf: 0, pa: 0 });

  const homeId = match.homeTeamId;
  const awayId = match.awayTeamId;
  const homeStats = init();
  const awayStats = init();

  // 승부 결정 매치 합산
  for (const m of completedMatches) {
    if (m.homeTeamId === null || m.awayTeamId === null) continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    const hs = m.homeScore;
    const as = m.awayScore;
    const winnerId = m.winner_team_id;
    // 매치의 home/away 가 본 함수의 home/away 와 같을 수도, 반대일 수도 있음 — 양 케이스 모두 처리
    // (한 팀이 home 으로 출전한 매치 + away 로 출전한 매치 모두 합산 필요)
    if (m.homeTeamId === homeId) {
      homeStats.pf += hs;
      homeStats.pa += as;
      if (winnerId === homeId) homeStats.wins++;
      else if (winnerId === m.awayTeamId) homeStats.losses++;
    } else if (m.awayTeamId === homeId) {
      // homeId 팀이 본 매치에서 away 로 출전
      homeStats.pf += as;
      homeStats.pa += hs;
      if (winnerId === homeId) homeStats.wins++;
      else if (winnerId === m.homeTeamId) homeStats.losses++;
    }
    if (m.homeTeamId === awayId) {
      awayStats.pf += hs;
      awayStats.pa += as;
      if (winnerId === awayId) awayStats.wins++;
      else if (winnerId === m.homeTeamId) awayStats.losses++;
    } else if (m.awayTeamId === awayId) {
      awayStats.pf += as;
      awayStats.pa += hs;
      if (winnerId === awayId) awayStats.wins++;
      else if (winnerId === m.homeTeamId) awayStats.losses++;
    }
  }

  // 무승부 매치 합산 (PF/PA + draws)
  for (const m of drawMatches) {
    if (m.homeTeamId === null || m.awayTeamId === null) continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    const hs = m.homeScore;
    const as = m.awayScore;
    if (m.homeTeamId === homeId) {
      homeStats.pf += hs;
      homeStats.pa += as;
      homeStats.draws++;
    } else if (m.awayTeamId === homeId) {
      homeStats.pf += as;
      homeStats.pa += hs;
      homeStats.draws++;
    }
    if (m.homeTeamId === awayId) {
      awayStats.pf += hs;
      awayStats.pa += as;
      awayStats.draws++;
    } else if (m.awayTeamId === awayId) {
      awayStats.pf += as;
      awayStats.pa += hs;
      awayStats.draws++;
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // 4. TournamentTeam UPDATE (영향 받는 2 팀만 SET 방식 — 트랜잭션 wrap)
  //   사유: increment 가 아닌 SET → race / 다중 호출 / 외부 스크립트 모두 안전.
  // ─────────────────────────────────────────────────────────────────────
  // 2026-05-16 BUG FIX — where 절이 `teamId: homeId` 였음 (Team.id 매칭) → 다른 종별 섞임.
  //   `homeId` = `match.homeTeamId` = **TournamentTeam.id** (FK) 인데 Team.id 컬럼으로 검색.
  //   결과: 매치 0건 매칭 → standings 박제 안 됨 + 우연히 매칭된 다른 종별 row 에 박힘.
  //   수정: `id: homeId` 로 TournamentTeam.id 직접 매칭.
  await prisma.$transaction([
    prisma.tournamentTeam.updateMany({
      where: { id: homeId },
      data: {
        wins: homeStats.wins,
        losses: homeStats.losses,
        draws: homeStats.draws,
        points_for: homeStats.pf,
        points_against: homeStats.pa,
        point_difference: homeStats.pf - homeStats.pa,
      },
    }),
    prisma.tournamentTeam.updateMany({
      // BUG FIX (위 home 동일) — teamId → id (TournamentTeam.id FK 직접 매칭)
      where: { id: awayId },
      data: {
        wins: awayStats.wins,
        losses: awayStats.losses,
        draws: awayStats.draws,
        points_for: awayStats.pf,
        points_against: awayStats.pa,
        point_difference: awayStats.pf - awayStats.pa,
      },
    }),
  ]);
}
