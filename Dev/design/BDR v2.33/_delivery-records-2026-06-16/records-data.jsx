/* global window */
// ============================================================
// BDR v2.33 — records-data.jsx
// 기록(경기별·대회별·시즌별) 목업 — 백엔드 실측 스키마 형태.
//   경기별  = MatchPlayerStat 행 (전 컬럼 박스스코어)
//   대회별  = MatchPlayerStat.groupBy(tournament) 평균/합계  ← JS 집계
//   시즌별  = MatchPlayerStat → season_year 집계 + UserSeasonStat + ShotZoneStat
//   팀      = 글로벌 Team 로스터(TeamMember.userId) × 각 멤버 집계
// 신규 DB 0 — 집계는 매치에서 계산.
// ============================================================
(function () {
  const pct = (m, a) => (a ? Math.round((m / a) * 1000) / 10 : 0);
  const r1 = (n) => Math.round(n * 10) / 10;

  // ── 선수: 경기별 = MatchPlayerStat 행 (전 컬럼 박스스코어) ──
  // min·pts·fgm/fga·tpm/tpa·ftm/fta·oreb·dreb·reb·ast·stl·blk·tov·pf·rating
  const PLAYER_GAMELOG = [
    { match_id: 5821, date: '2026-04-20', season_year: 2026, opponent: '장충 픽업',  tournament: '봄 픽업 리그',   tournament_id: 'tn-spring',  min: 36, pts: 18, fgm: 7,  fga: 12, tpm: 2, tpa: 5,  ftm: 2, fta: 2, oreb: 1, dreb: 3, ast: 7, stl: 2, blk: 0, tov: 2, pf: 2, pm: 8, rating: 8.4, result: 'W' },
    { match_id: 5810, date: '2026-04-18', season_year: 2026, opponent: '몽키즈',     tournament: '봄 픽업 리그',   tournament_id: 'tn-spring',  min: 40, pts: 22, fgm: 8,  fga: 16, tpm: 3, tpa: 8,  ftm: 3, fta: 4, oreb: 1, dreb: 2, ast: 5, stl: 1, blk: 1, tov: 3, pf: 3, pm: -4, rating: 7.9, result: 'L' },
    { match_id: 5793, date: '2026-04-12', season_year: 2026, opponent: 'IRON',       tournament: '강남구 챔피언십', tournament_id: 'tn-gangnam', min: 38, pts: 14, fgm: 5,  fga: 11, tpm: 1, tpa: 3,  ftm: 3, fta: 3, oreb: 2, dreb: 4, ast: 8, stl: 3, blk: 0, tov: 1, pf: 2, pm: 6, rating: 8.1, result: 'W' },
    { match_id: 5780, date: '2026-04-05', season_year: 2026, opponent: 'KINGS',      tournament: '강남구 챔피언십', tournament_id: 'tn-gangnam', min: 34, pts: 11, fgm: 4,  fga: 10, tpm: 1, tpa: 4,  ftm: 2, fta: 2, oreb: 0, dreb: 2, ast: 4, stl: 1, blk: 0, tov: 2, pf: 4, pm: -7, rating: 6.8, result: 'L' },
    { match_id: 5762, date: '2026-03-29', season_year: 2026, opponent: '3POINT',     tournament: '강남구 챔피언십', tournament_id: 'tn-gangnam', min: 42, pts: 28, fgm: 11, fga: 19, tpm: 4, tpa: 9,  ftm: 2, fta: 2, oreb: 2, dreb: 3, ast: 3, stl: 2, blk: 1, tov: 2, pf: 2, pm: 13, rating: 9.2, result: 'W' },
    { match_id: 5741, date: '2026-03-22', season_year: 2026, opponent: '한강 올스타', tournament: '봄 픽업 리그',  tournament_id: 'tn-spring',  min: 30, pts: 9,  fgm: 3,  fga: 8,  tpm: 0, tpa: 2,  ftm: 3, fta: 4, oreb: 3, dreb: 4, ast: 6, stl: 0, blk: 2, tov: 1, pf: 3, pm: 5, rating: 7.1, result: 'W' },
    { match_id: 5502, date: '2025-12-14', season_year: 2025, opponent: 'WINTER FC',  tournament: '겨울 시즌컵',   tournament_id: 'tn-winter',  min: 35, pts: 16, fgm: 6,  fga: 13, tpm: 2, tpa: 6,  ftm: 2, fta: 3, oreb: 1, dreb: 4, ast: 4, stl: 1, blk: 0, tov: 2, pf: 1, pm: 9, rating: 7.6, result: 'W' },
    { match_id: 5488, date: '2025-12-07', season_year: 2025, opponent: '성수 발러스', tournament: '겨울 시즌컵',  tournament_id: 'tn-winter',  min: 38, pts: 24, fgm: 9,  fga: 17, tpm: 4, tpa: 10, ftm: 2, fta: 2, oreb: 1, dreb: 2, ast: 6, stl: 2, blk: 0, tov: 3, pf: 2, pm: -3, rating: 8.7, result: 'L' },
  ];

  // ── 집계 엔진 (groupBy 평균/합계) — 실제 MatchPlayerStat 집계와 동일 ──
  // 표준 박스 키(min·pts·fgm/fga·tpm/tpa·ftm/fta·oreb·dreb·reb·ast·stl·blk·tov·pf·rating)를
  // 경기별(raw)과 동일하게 노출 → 모든 표가 같은 statCols 컬럼 양식 사용.
  function aggregate(rows) {
    const n = rows.length || 1;
    const s = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
    const a = (k) => r1(s(k) / n);
    return {
      g: rows.length,
      min: a('min'), pts: a('pts'),
      fgm: a('fgm'), fga: a('fga'), tpm: a('tpm'), tpa: a('tpa'), ftm: a('ftm'), fta: a('fta'),
      fg_pct: pct(s('fgm'), s('fga')), tp_pct: pct(s('tpm'), s('tpa')), ft_pct: pct(s('ftm'), s('fta')),
      oreb: a('oreb'), dreb: a('dreb'), reb: r1((s('oreb') + s('dreb')) / n),
      ast: a('ast'), stl: a('stl'), blk: a('blk'), tov: a('tov'), pf: a('pf'), pm: a('pm'),
      // 레거시 별칭(리더보드 등)
      mpg: a('min'), ppg: a('pts'), rpg: r1((s('oreb') + s('dreb')) / n),
      orpg: a('oreb'), drpg: a('dreb'), apg: a('ast'), spg: a('stl'), bpg: a('blk'), topg: a('tov'), pfpg: a('pf'),
      rating: a('rating'),
      wins: rows.filter(r => r.result === 'W').length, losses: rows.filter(r => r.result === 'L').length,
    };
  }
  // 손수 작성한 평균 1줄 → 표준 박스 형태(makes/attempts 기반, pts·pct·reb 파생).
  function avgLine(g, mpg, fgm, fga, tpm, tpa, ftm, fta, or, dr, ast, stl, blk, tov, pf, rating) {
    const pts = r1(2 * fgm + tpm + ftm), reb = r1(or + dr), pm = r1((rating - 7.4) * 7);
    return {
      g, min: mpg, pts, fgm, fga, tpm, tpa, ftm, fta,
      fg_pct: pct(fgm, fga), tp_pct: pct(tpm, tpa), ft_pct: pct(ftm, fta),
      oreb: or, dreb: dr, reb, ast, stl, blk, tov, pf, pm,
      mpg, ppg: pts, rpg: reb, orpg: or, drpg: dr, apg: ast, spg: stl, bpg: blk, topg: tov, pfpg: pf, rating,
    };
  }
  function groupBy(rows, keyFn) {
    const m = new Map();
    rows.forEach(r => { const k = keyFn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
    return m;
  }
  const TN_PERIOD = { 'tn-spring': '2026.03–04', 'tn-gangnam': '2026.03–04', 'tn-winter': '2025.12' };

  // ── 선수: 대회별 ──
  const PLAYER_BY_TOURNAMENT = [...groupBy(PLAYER_GAMELOG, r => r.tournament_id).entries()].map(([id, rows]) => ({
    tournament_id: id, tournament: rows[0].tournament, period: TN_PERIOD[id] || '', ...aggregate(rows),
  }));

  // ── 선수: 시즌(연도)별 ──
  const PLAYER_BY_SEASON = [...groupBy(PLAYER_GAMELOG, r => r.season_year).entries()]
    .map(([yr, rows]) => ({ season_year: yr, ...aggregate(rows) }))
    .sort((x, y) => y.season_year - x.season_year);

  // ── 선수: 시즌 요약 = UserSeasonStat (이미 보유) ──
  const PLAYER_SEASON_SUMMARY = {
    2026: { season_year: 2026, games_played: 6, wins: 4, losses: 2, avg_rating: 7.9, mvp_count: 2, rank_position: 4, rank_of: 128 },
    2025: { season_year: 2025, games_played: 2, wins: 1, losses: 1, avg_rating: 8.2, mvp_count: 1, rank_position: 9, rank_of: 96 },
  };

  // ── 선수: 슛차트 = ShotZoneStat (이미 보유) ──
  const PLAYER_SHOT_ZONES = {
    2026: [
      { zone_code: 'RA', made: 41, attempts: 58 }, { zone_code: 'PAINT', made: 18, attempts: 37 },
      { zone_code: 'MID_L', made: 9, attempts: 22 }, { zone_code: 'MID_C', made: 12, attempts: 26 },
      { zone_code: 'MID_R', made: 8, attempts: 21 }, { zone_code: 'LC3', made: 11, attempts: 23 },
      { zone_code: 'LW3', made: 14, attempts: 36 }, { zone_code: 'TOP3', made: 10, attempts: 28 },
      { zone_code: 'RW3', made: 13, attempts: 33 }, { zone_code: 'RC3', made: 9, attempts: 19 },
    ],
    2025: [
      { zone_code: 'RA', made: 14, attempts: 20 }, { zone_code: 'PAINT', made: 6, attempts: 13 },
      { zone_code: 'MID_C', made: 4, attempts: 11 }, { zone_code: 'LW3', made: 5, attempts: 14 },
      { zone_code: 'TOP3', made: 3, attempts: 10 }, { zone_code: 'RW3', made: 4, attempts: 12 },
    ],
  };
  const ZONE_META = {
    RA: { label: '림 근처', x: 150, y: 56 }, PAINT: { label: '페인트', x: 150, y: 110 },
    MID_L: { label: '미드 좌', x: 58, y: 120 }, MID_C: { label: '미드 중', x: 150, y: 168 }, MID_R: { label: '미드 우', x: 242, y: 120 },
    LC3: { label: '좌 코너 3', x: 30, y: 60 }, LW3: { label: '좌 윙 3', x: 56, y: 200 },
    TOP3: { label: '탑 3', x: 150, y: 232 }, RW3: { label: '우 윙 3', x: 244, y: 200 }, RC3: { label: '우 코너 3', x: 270, y: 60 },
  };

  // ── 팀 로스터 = 글로벌 Team 로스터 × 멤버 MatchPlayerStat (표준 박스 평균) ──
  // 스코프: all(누적) / 2026 / 2025 / tn-spring / tn-gangnam · claimed=false → 미연동
  // avgLine(g, mpg, fgm, fga, tpm, tpa, ftm, fta, or, dr, ast, stl, blk, tov, pf, rating)
  const A = avgLine;
  const TEAM_ROSTER = {
    name: '서초 발러스', logo: 'SB', color: 'var(--bdr-navy)', seasons: [2026, 2025],
    members: [
      { user_id: 1, name: 'rdm_captain', jersey: 7, claimed: true,
        all: A(18, 36, 6.2, 12.6, 2.0, 5.5, 2.8, 3.3, 1.3, 3.3, 5.5, 1.6, 0.3, 2.1, 2.2, 8.0),
        2026: A(6, 37, 6.1, 12.2, 2.0, 5.6, 2.8, 3.2, 1.3, 3.2, 5.5, 1.8, 0.3, 2.0, 2.0, 7.9),
        2025: A(12, 35, 6.3, 13.0, 2.0, 5.5, 2.9, 3.4, 1.4, 3.3, 5.4, 1.5, 0.3, 2.2, 2.3, 8.1),
        tn: { 'tn-spring': A(3, 34, 4.7, 10.1, 0.7, 3.0, 1.9, 2.0, 2.0, 4.0, 6.3, 1.0, 0.7, 1.7, 1.7, 7.5), 'tn-gangnam': A(3, 39, 6.3, 12.6, 1.5, 4.0, 3.6, 3.6, 1.3, 3.0, 5.0, 2.0, 0.3, 2.3, 2.3, 8.0) } },
      { user_id: 2, name: '슈터_민호', jersey: 11, claimed: true,
        all: A(16, 30, 5.0, 11.4, 2.4, 5.8, 1.7, 1.9, 0.7, 2.1, 3.1, 0.9, 0.1, 1.4, 1.6, 7.6),
        2026: A(6, 31, 5.4, 12.0, 2.6, 6.0, 1.8, 2.0, 0.6, 1.9, 2.8, 1.0, 0.1, 1.3, 1.5, 7.8),
        2025: A(10, 29, 4.8, 11.1, 2.2, 5.5, 1.7, 1.9, 0.8, 2.2, 3.3, 0.8, 0.1, 1.5, 1.7, 7.5),
        tn: { 'tn-spring': A(3, 30, 5.7, 12.1, 3.2, 7.2, 1.4, 1.6, 0.6, 1.7, 2.7, 0.9, 0.0, 1.3, 1.3, 7.9), 'tn-gangnam': A(3, 29, 5.0, 11.6, 2.5, 6.0, 1.8, 2.0, 0.7, 2.0, 2.9, 1.0, 0.1, 1.4, 1.7, 7.7) } },
      { user_id: 3, name: '빅맨_재훈', jersey: 33, claimed: true,
        all: A(17, 28, 4.7, 8.4, 0, 0, 1.8, 2.8, 3.5, 6.3, 1.6, 0.7, 1.4, 1.8, 3.0, 7.9),
        2026: A(6, 29, 5.0, 8.6, 0, 0, 2.0, 3.0, 3.7, 6.6, 1.8, 0.8, 1.6, 1.7, 3.1, 8.1),
        2025: A(11, 27, 4.5, 8.1, 0, 0, 1.8, 2.9, 3.4, 6.1, 1.5, 0.6, 1.3, 1.9, 2.9, 7.8),
        tn: { 'tn-spring': A(3, 30, 5.3, 8.8, 0, 0, 2.1, 3.5, 4.0, 7.0, 2.0, 0.7, 1.7, 1.7, 3.3, 8.3), 'tn-gangnam': A(3, 27, 4.7, 8.4, 0, 0, 1.9, 2.9, 3.3, 6.3, 1.7, 0.7, 1.3, 1.8, 3.0, 7.9) } },
      { user_id: 4, name: '가드_지우', jersey: 3, claimed: true,
        all: A(15, 33, 3.4, 8.0, 1.0, 2.9, 1.6, 2.1, 0.6, 2.6, 7.1, 1.8, 0.1, 2.4, 2.0, 7.7),
        2026: A(5, 34, 3.1, 7.6, 0.9, 2.7, 1.7, 2.2, 0.5, 2.5, 7.6, 1.9, 0.1, 2.5, 2.1, 7.6),
        2025: A(10, 32, 3.5, 8.1, 1.0, 2.8, 1.7, 2.2, 0.7, 2.6, 6.9, 1.7, 0.1, 2.3, 1.9, 7.8),
        tn: { 'tn-spring': A(3, 33, 3.2, 7.6, 1.0, 3.0, 1.6, 2.0, 0.6, 2.7, 8.0, 1.8, 0.1, 2.4, 2.0, 7.7), 'tn-gangnam': A(2, 32, 3.0, 7.5, 0.9, 2.6, 1.6, 2.1, 0.5, 2.0, 7.0, 1.7, 0.0, 2.3, 1.8, 7.5) } },
      { user_id: null, name: '윙_상현', jersey: 21, claimed: false, player_name: '윙_상현' },
      { user_id: null, name: '센터_도윤', jersey: 50, claimed: false, player_name: '센터_도윤' },
    ],
  };

  // ── 팀 경기 목록 + 경기별 팀 박스 (드릴다운: 경기 클릭 → 팀 전체 기록) ──
  // ⚠ 실측(2026-06-16): 박스스코어 MatchPlayerStat 는 tournament_match_id 에만 연결 →
  //   팀 "경기별"은 대회 경기(TournamentMatch) 한정. 친선·픽업(games)은 박스 없음.
  //   조인: Team.id → TournamentTeam.team_id → TournamentMatch → MatchPlayerStat.
  const gx = (user_id, name, jersey, min, fgm, fga, tpm, tpa, ftm, fta, or, dr, ast, stl, blk, tov, pf, pm, rating) =>
    ({ user_id, name, jersey, claimed: true, min, pts: 2 * fgm + tpm + ftm, fgm, fga, tpm, tpa, ftm, fta, oreb: or, dreb: dr, reb: or + dr, ast, stl, blk, tov, pf, pm, rating });
  const TEAM_GAMES = [
    { match_id: 5793, date: '2026-04-12', opp: 'IRON', tournament: '강남구 챔피언십', result: 'L', hs: 19, as: 21, box: [
      gx(1, 'rdm_captain', 7, 38, 3, 7, 1, 3, 1, 1, 1, 3, 5, 2, 0, 2, 2, -2, 8.1),
      gx(2, '슈터_민호', 11, 31, 2, 5, 1, 3, 0, 0, 0, 2, 3, 1, 0, 1, 2, -2, 7.4),
      gx(3, '빅맨_재훈', 33, 28, 2, 4, 0, 0, 0, 1, 2, 5, 1, 0, 1, 2, 3, -2, 7.6),
      gx(4, '가드_지우', 3, 33, 1, 4, 0, 1, 0, 0, 0, 2, 6, 1, 0, 2, 2, -2, 7.3),
    ] },
    { match_id: 5780, date: '2026-04-05', opp: 'KINGS', tournament: '강남구 챔피언십', result: 'L', hs: 18, as: 20, box: [
      gx(1, 'rdm_captain', 7, 34, 3, 7, 0, 2, 1, 2, 1, 3, 4, 1, 0, 2, 3, -2, 7.2),
      gx(2, '슈터_민호', 11, 29, 2, 6, 1, 3, 0, 0, 1, 2, 2, 1, 0, 1, 2, -2, 7.3),
      gx(3, '빅맨_재훈', 33, 27, 2, 4, 0, 0, 0, 1, 2, 4, 1, 0, 1, 1, 3, -2, 7.5),
      gx(4, '가드_지우', 3, 32, 1, 4, 0, 1, 0, 0, 0, 2, 5, 2, 0, 2, 2, -2, 7.1),
    ] },
    { match_id: 5762, date: '2026-03-29', opp: '3POINT', tournament: '강남구 챔피언십', result: 'W', hs: 21, as: 17, box: [
      gx(1, 'rdm_captain', 7, 36, 3, 6, 1, 3, 1, 1, 1, 3, 5, 2, 0, 2, 2, 4, 8.0),
      gx(2, '슈터_민호', 11, 30, 2, 5, 2, 4, 0, 0, 0, 2, 2, 1, 0, 1, 1, 4, 7.6),
      gx(3, '빅맨_재훈', 33, 28, 2, 4, 0, 0, 1, 2, 3, 5, 1, 0, 1, 1, 3, 4, 7.8),
      gx(4, '가드_지우', 3, 33, 1, 3, 0, 1, 0, 0, 0, 2, 6, 1, 0, 2, 2, 4, 7.4),
    ] },
  ];
  TEAM_ROSTER.games = TEAM_GAMES;

  const TOURNAMENTS = [
    { id: 'tn-spring', name: '봄 픽업 리그' },
    { id: 'tn-gangnam', name: '강남구 챔피언십' },
    { id: 'tn-winter', name: '겨울 시즌컵' },
  ];

  // ── 대회 기록실 = /tournaments/[id] (한 대회 안 전수 집계) ──
  // 선수 = 참가 전 선수 × MatchPlayerStat(대회 한정) · 팀 = TournamentTeam 집계 · 경기 = TournamentMatch
  const TP = avgLine; // 선수는 선수 테이블과 동일한 표준 박스 양식(avgLine)
  const TOURNAMENT_REC = {
    id: 'tn-gangnam', name: '강남구 챔피언십', period: '2026.03–04', status: '종료',
    division: '남자 3x3 · 오픈부', teams_n: 8, games_n: 14, mvp: 'rdm_captain',
    players: [
      { user_id: 1,  name: 'rdm_captain', team: '서초 발러스', claimed: true, ...TP(3, 39, 6.3, 12.6, 1.5, 4.0, 3.6, 3.6, 1.3, 3.0, 5.0, 2.0, 0.3, 2.3, 2.3, 8.0) },
      { user_id: 7,  name: '에이스_준',   team: 'IRON',        claimed: true, ...TP(3, 36, 6.8, 14.0, 2.5, 6.4, 3.2, 3.8, 0.7, 3.0, 4.0, 1.3, 0.3, 2.7, 2.0, 8.2) },
      { user_id: 3,  name: '빅맨_재훈',   team: '서초 발러스', claimed: true, ...TP(3, 27, 4.7, 8.4, 0, 0, 1.9, 2.9, 3.3, 6.3, 1.7, 0.7, 1.3, 1.8, 3.0, 7.9) },
      { user_id: 9,  name: '리바운더_훈', team: 'KINGS',       claimed: true, ...TP(3, 30, 3.8, 7.0, 0, 0, 1.4, 2.4, 4.0, 7.3, 1.3, 0.7, 1.7, 1.5, 2.7, 7.8) },
      { user_id: 2,  name: '슈터_민호',   team: '서초 발러스', claimed: true, ...TP(3, 29, 5.0, 11.6, 2.5, 6.0, 1.8, 2.0, 0.7, 2.0, 2.9, 1.0, 0.1, 1.4, 1.7, 7.7) },
      { user_id: 12, name: '돌격대_성',   team: '3POINT',      claimed: true, ...TP(3, 33, 5.8, 14.1, 1.9, 5.8, 2.2, 2.8, 1.0, 2.0, 6.7, 2.3, 0.0, 3.0, 2.3, 7.6) },
      { user_id: 4,  name: '가드_지우',   team: '서초 발러스', claimed: true, ...TP(2, 32, 3.0, 7.5, 0.9, 2.6, 1.6, 2.1, 0.5, 2.0, 7.0, 1.7, 0.0, 2.3, 1.5, 7.5) },
      { user_id: 15, name: '락다운_현',   team: 'IRON',        claimed: true, ...TP(3, 31, 2.8, 6.1, 0.9, 3.0, 0.8, 1.1, 1.3, 3.7, 2.0, 2.7, 0.7, 1.0, 3.3, 7.7) },
      { user_id: 21, name: '스윙맨_도',   team: 'KINGS',       claimed: true, ...TP(3, 28, 4.6, 10.1, 1.8, 5.0, 1.0, 1.3, 1.7, 3.0, 3.3, 1.0, 0.3, 1.7, 2.0, 7.4) },
      { user_id: 33, name: '센터_강',     team: '3POINT',      claimed: true, ...TP(3, 26, 4.2, 8.1, 0, 0, 1.6, 2.7, 3.7, 5.0, 1.0, 0.3, 1.8, 1.3, 3.7, 7.5) },
      { user_id: 8,  name: '식스맨_재',   team: 'IRON',        claimed: true, ...TP(3, 22, 4.3, 9.1, 1.6, 4.0, 1.3, 1.5, 1.0, 1.7, 2.3, 0.8, 0.2, 1.2, 1.8, 7.3) },
      { user_id: null, name: '윙_상현',   team: 'IRON',        claimed: false, player_name: '윙_상현' },
    ],
    teams: [
      { team_id: 't1', name: '서초 발러스', g: 3, w: 2, l: 1, oppg: 18.3, diff: 3.4, pm: 3.4, fgm: 8.0, fga: 17.0, tpm: 2.3, tpa: 6.5, ftm: 3.4, fta: 4.1, oreb: 4.5, dreb: 9.8, ppg: 21.7, reb: 14.3, rpg: 14.3, ast: 8.0, stl: 4.7, blk: 1.7, tov: 5.3, pf: 2.0, fg_pct: 47.1, tp_pct: 35.4, ft_pct: 82.9, rating: 7.9 },
      { team_id: 't2', name: 'IRON', g: 3, w: 3, l: 0, oppg: 17.0, diff: 5.3, pm: 5.3, fgm: 8.2, fga: 16.9, tpm: 2.6, tpa: 6.8, ftm: 3.3, fta: 4.1, oreb: 4.0, dreb: 9.0, ppg: 22.3, reb: 13.0, rpg: 13.0, ast: 7.3, stl: 5.0, blk: 1.3, tov: 4.7, pf: 1.7, fg_pct: 48.5, tp_pct: 38.2, ft_pct: 80.5, rating: 8.1 },
      { team_id: 't3', name: 'KINGS', g: 3, w: 1, l: 2, oppg: 20.0, diff: -1.3, pm: -1.3, fgm: 7.0, fga: 15.8, tpm: 1.9, tpa: 6.1, ftm: 2.8, fta: 3.8, oreb: 5.0, dreb: 10.0, ppg: 18.7, reb: 15.0, rpg: 15.0, ast: 6.0, stl: 4.0, blk: 2.0, tov: 5.7, pf: 2.3, fg_pct: 44.3, tp_pct: 31.1, ft_pct: 73.7, rating: 7.3 },
      { team_id: 't4', name: '3POINT', g: 3, w: 1, l: 2, oppg: 20.7, diff: -1.4, pm: -1.4, fgm: 7.0, fga: 16.4, tpm: 2.6, tpa: 7.5, ftm: 2.7, fta: 3.5, oreb: 3.7, dreb: 9.0, ppg: 19.3, reb: 12.7, rpg: 12.7, ast: 7.7, stl: 4.3, blk: 1.0, tov: 6.0, pf: 2.7, fg_pct: 42.7, tp_pct: 34.7, ft_pct: 77.1, rating: 7.4 },
    ],
    games: [
      { match_id: 5762, date: '2026-03-29', round: '예선 1R', home: '서초 발러스', away: '3POINT', hs: 21, as: 17 },
      { match_id: 5765, date: '2026-03-29', round: '예선 1R', home: 'IRON', away: 'KINGS', hs: 22, as: 16 },
      { match_id: 5771, date: '2026-04-05', round: '예선 2R', home: 'KINGS', away: '서초 발러스', hs: 20, as: 18 },
      { match_id: 5774, date: '2026-04-05', round: '예선 2R', home: '3POINT', away: 'IRON', hs: 19, as: 23 },
      { match_id: 5793, date: '2026-04-12', round: '준결승', home: '서초 발러스', away: 'IRON', hs: 19, as: 21 },
      { match_id: 5796, date: '2026-04-12', round: '3·4위전', home: 'KINGS', away: '3POINT', hs: 20, as: 17 },
    ],
  };

  window.RECORDS = {
    pct, PLAYER_GAMELOG, PLAYER_BY_TOURNAMENT, PLAYER_BY_SEASON,
    PLAYER_SEASON_SUMMARY, PLAYER_SHOT_ZONES, ZONE_META, TEAM_ROSTER, TEAM_GAMES, TOURNAMENTS,
    TOURNAMENT_REC,
  };
})();
