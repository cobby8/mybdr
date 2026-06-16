/**
 * match-stat-aggregate.ts — 기록(Records) 박스스코어 집계 PURE 헬퍼
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 선수/팀/대회 기록 모두 MatchPlayerStat 행 배열 → 표준 21컬럼 박스
 *   평균 DTO 로 가공하는 동일 로직을 쓴다. DB/IO 없는 순수 함수로 분리해
 *   API route(공식가드 적용 후 호출)에서 재사용·단위테스트 가능하게 한다.
 *
 * 방법(어떻게): 입력 = MatchPlayerStat 의 정수 박스 필드만 정규화한 RawBox 배열.
 *   출력 = snake_case 키(시안 statCols 가 읽는 키) 평균 박스 + 리더보드 별칭(ppg 등).
 *
 * 신규 DB 0 — 집계는 전부 매치 행에서 계산. season_year 는 scheduledAt 연도 파생(호출자).
 * 평점(rating)은 매치 단위 소스 부재 → 항상 null('–' 표기). (PM 결재 Q1)
 */

/** MatchPlayerStat 1행에서 추출한 정규화 박스 (전부 number, null은 0 처리 후 입력) */
export interface RawBox {
  min: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  pm: number;
}

/** 표준 박스 평균 DTO (snake_case = 시안 statCols 키) */
export interface BoxAvg {
  g: number;
  // min: 출전시간. 종이(score-sheet) 모드 대회는 minutesPlayed=0 하드코딩이라
  //   집계 단위 전체가 0이면 데이터 부재 → null('–' 표기, 평점 정책과 동일).
  min: number | null;
  pts: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  tpm: number;
  tpa: number;
  tp_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  pm: number;
  rating: null;
  // 리더보드 별칭 (평균)
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  // ── 누적(합계) 필드 ── STAGE B 갭 보완: sum 모드 토글이 읽는 정수 누적값.
  //   aggregateBox 내부에서 이미 sum(k) 로 계산 중 → 출력에 함께 담기만(평균×G 역산 금지).
  //   %·평점은 누적/평균 동일값이라 sum_ 별도 필드 없음(fg_pct 등 공용).
  sum_min: number | null;
  sum_pts: number;
  sum_fgm: number;
  sum_fga: number;
  sum_tpm: number;
  sum_tpa: number;
  sum_ftm: number;
  sum_fta: number;
  sum_oreb: number;
  sum_dreb: number;
  sum_reb: number;
  sum_ast: number;
  sum_stl: number;
  sum_blk: number;
  sum_to: number;
  sum_pf: number;
  sum_pm: number;
}

const r1 = (n: number): number => Math.round(n * 10) / 10;
const pct = (made: number, att: number): number =>
  att ? Math.round((made / att) * 1000) / 10 : 0;

/** null/undefined → 0 정규화 */
const num = (v: number | null | undefined): number => v ?? 0;

/**
 * Prisma MatchPlayerStat select 결과(정수 박스 필드)를 RawBox 로 정규화.
 * 호출자가 select 한 필드명(Prisma camelCase/snake 혼용)을 그대로 받는다.
 */
export function toRawBox(
  s: {
    minutesPlayed?: number | null;
    points?: number | null;
    fieldGoalsMade?: number | null;
    fieldGoalsAttempted?: number | null;
    threePointersMade?: number | null;
    threePointersAttempted?: number | null;
    freeThrowsMade?: number | null;
    freeThrowsAttempted?: number | null;
    offensive_rebounds?: number | null;
    defensive_rebounds?: number | null;
    total_rebounds?: number | null;
    assists?: number | null;
    steals?: number | null;
    blocks?: number | null;
    turnovers?: number | null;
    personal_fouls?: number | null;
    plusMinus?: number | null;
  },
  opts?: {
    // 2026-06-16: PBP 기반 출전초(라이브와 단일 source) 주입.
    //   - number(초): min = Math.round(sec/60) (라이브 변환과 동일). 0초도 그대로 0분.
    //   - null/undefined: minutesPlayed 컬럼 사용 안 함 → min=0 (종이/PBP없음 매치).
    //     집계(aggregateBox)에서 scope 전체 합=0 이면 null('–') 표기. minutesPlayed 의
    //     999 truncate 버그를 PBP 기반 주입으로 자동 회피.
    minOverrideSec?: number | null;
  },
): RawBox {
  const oreb = num(s.offensive_rebounds);
  const dreb = num(s.defensive_rebounds);
  // total_rebounds 있으면 사용, 없으면 OR+DR
  const reb = s.total_rebounds != null ? num(s.total_rebounds) : oreb + dreb;
  // min: PBP override 우선(라이브 단일 source). override 부재 시 0 (minutesPlayed 미신뢰 — 999 버그/종이 0).
  const min =
    opts?.minOverrideSec != null ? Math.round(opts.minOverrideSec / 60) : 0;
  return {
    min,
    pts: num(s.points),
    fgm: num(s.fieldGoalsMade),
    fga: num(s.fieldGoalsAttempted),
    tpm: num(s.threePointersMade),
    tpa: num(s.threePointersAttempted),
    ftm: num(s.freeThrowsMade),
    fta: num(s.freeThrowsAttempted),
    oreb,
    dreb,
    reb,
    ast: num(s.assists),
    stl: num(s.steals),
    blk: num(s.blocks),
    tov: num(s.turnovers),
    pf: num(s.personal_fouls),
    pm: num(s.plusMinus),
  };
}

/**
 * 박스 행 배열 → 표준 평균 DTO.
 * - 합계 후 게임수(rows.length)로 나눈 평균. %는 합산 makes/attempts 기준(가중 정확).
 * - rows 비면 전부 0 / g=0.
 */
export function aggregateBox(rows: RawBox[]): BoxAvg {
  const g = rows.length;
  const n = g || 1;
  const sum = (k: keyof RawBox): number => rows.reduce((a, r) => a + r[k], 0);
  const avg = (k: keyof RawBox): number => r1(sum(k) / n);

  const oreb = avg("oreb");
  const dreb = avg("dreb");
  const reb = r1((sum("oreb") + sum("dreb")) / n);
  const ast = avg("ast");
  const stl = avg("stl");
  const blk = avg("blk");

  // 출전시간 데이터 존재 여부: 집계 단위 전체 합이 0이면 부재(종이모드) → null('–').
  //   하나라도 >0이면(라이브 sync 대회) 평균/합계 그대로 표기.
  const sumMin = sum("min");
  const hasMin = sumMin > 0;

  return {
    g,
    min: hasMin ? avg("min") : null,
    pts: avg("pts"),
    fgm: avg("fgm"),
    fga: avg("fga"),
    fg_pct: pct(sum("fgm"), sum("fga")),
    tpm: avg("tpm"),
    tpa: avg("tpa"),
    tp_pct: pct(sum("tpm"), sum("tpa")),
    ftm: avg("ftm"),
    fta: avg("fta"),
    ft_pct: pct(sum("ftm"), sum("fta")),
    oreb,
    dreb,
    reb,
    ast,
    stl,
    blk,
    tov: avg("tov"),
    pf: avg("pf"),
    pm: avg("pm"),
    rating: null,
    // 리더보드 별칭
    ppg: avg("pts"),
    rpg: reb,
    apg: ast,
    spg: stl,
    bpg: blk,
    // 누적(합계) — sum(k) 원본 그대로(평균×G 역산 ❌). reb 는 oreb+dreb 합산 규칙 동일.
    sum_min: hasMin ? sumMin : null,
    sum_pts: sum("pts"),
    sum_fgm: sum("fgm"),
    sum_fga: sum("fga"),
    sum_tpm: sum("tpm"),
    sum_tpa: sum("tpa"),
    sum_ftm: sum("ftm"),
    sum_fta: sum("fta"),
    sum_oreb: sum("oreb"),
    sum_dreb: sum("dreb"),
    sum_reb: sum("oreb") + sum("dreb"),
    sum_ast: sum("ast"),
    sum_stl: sum("stl"),
    sum_blk: sum("blk"),
    sum_to: sum("tov"),
    sum_pf: sum("pf"),
    sum_pm: sum("pm"),
  };
}

/**
 * 팀 박스 평균: 매치별로 팀 소속 선수 stat 을 합산(팀 1경기 총합) 후 게임수로 평균.
 * @param byMatch 매치ID → 그 매치에서 이 팀 선수들의 RawBox 배열
 * @param gamesPlayed 팀이 뛴 공식 매치 수(분모)
 */
export function aggregateTeamBox(
  byMatch: Map<string, RawBox[]>,
  gamesPlayed: number,
): BoxAvg {
  // 매치별 팀 합계 행을 만들어 평균
  const perGameTotals: RawBox[] = [];
  for (const boxes of byMatch.values()) {
    const total: RawBox = {
      min: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
      oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, pm: 0,
    };
    for (const b of boxes) {
      total.pts += b.pts; total.fgm += b.fgm; total.fga += b.fga;
      total.tpm += b.tpm; total.tpa += b.tpa; total.ftm += b.ftm; total.fta += b.fta;
      total.oreb += b.oreb; total.dreb += b.dreb; total.reb += b.reb;
      total.ast += b.ast; total.stl += b.stl; total.blk += b.blk;
      total.tov += b.tov; total.pf += b.pf;
      // min/pm 은 팀 합산 의미 약함 → 0 유지(팀 박스에서 MIN 컬럼 제외, pm 은 득실로 대체)
    }
    perGameTotals.push(total);
  }
  const box = aggregateBox(perGameTotals);
  // gamesPlayed 로 g 보정(매치 0인 경우 방어)
  box.g = gamesPlayed;
  return box;
}
