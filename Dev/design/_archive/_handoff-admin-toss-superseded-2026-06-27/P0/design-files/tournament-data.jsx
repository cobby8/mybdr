/* global window */

// =====================================================================
// tournament-data.jsx — 대회 운영(tournament-admin) 데이터 (Toss · Phase 4)
//   종별→디비전(진행방식/정원/참가비) · 생성기(종별 마스터 연동) · 참가팀
// =====================================================================
const T = window.TOSS;

const TN_METHODS = T.METHODS; // 토너먼트/조별+토너/리그전/더블엘리
const TN_SETTING = {
  bracketSize:  { label: '대진 규모', type: 'select', options: [8, 16, 32], def: 16, fmt: (v) => `${v}강` },
  groupCount:   { label: '조 수',     type: 'num', suffix: '조', def: 4 },
  advanceCount: { label: '조별 진출', type: 'num', suffix: '팀', def: 2 },
  rounds:       { label: '리그 회전', type: 'select', options: [1, 2], def: 1, fmt: (v) => v === 2 ? '홈앤어웨이' : '단판' },
};
const METHOD_SETTINGS = {
  single_elimination: ['bracketSize'], group_stage_knockout: ['groupCount', 'advanceCount'],
  full_league: ['rounds'], dual_tournament: [],
};
function tnDefaults(m) { return (METHOD_SETTINGS[m] || []).reduce((a, k) => (a[k] = TN_SETTING[k].def, a), {}); }
function tnMethodSummary(m, s) {
  if (!s) return '';
  if (m === 'single_elimination') return `${s.bracketSize || 16}강`;
  if (m === 'group_stage_knockout') return `${s.groupCount}조→${s.advanceCount}`;
  if (m === 'full_league') return s.rounds === 2 ? '홈앤어웨이' : '단판';
  return '';
}
let _did = 0;
function tnDivision(name, method, opts = {}) {
  return { id: `d${++_did}`, name, method, settings: { ...tnDefaults(method), ...(opts.settings || {}) }, cap: opts.cap ?? 16, fee: opts.fee ?? 60000, age: opts.age || null };
}
function tnMakeCategory(gender, tplName, divNames, method) {
  return { id: `c${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, name: `${gender} ${tplName}`.trim(), gender,
    divisions: divNames.map((dn) => tnDivision(dn, method)) };
}

// 시드 대회 구성 (남성 일반부 D3·D4·D5)
const TN_CATEGORIES = [
  { id: 'c_seed', name: '남성 일반부', gender: '남성', divisions: [
    tnDivision('D3', 'group_stage_knockout', { cap: 24, fee: 80000 }),
    tnDivision('D4', 'group_stage_knockout', { cap: 16, fee: 70000 }),
    tnDivision('D5', 'single_elimination', { cap: 16, fee: 60000 }),
  ]},
];

// 추천 경기포맷 (간단)
const TN_PRESET = { matchType: '5x5', gameTime: '40분 (10분 × 4쿼터)', ball: 'KBL 공인구', rule: 'FIBA', method: 'group_stage_knockout' };

window.TN = { TN_METHODS, TN_SETTING, METHOD_SETTINGS, tnDefaults, tnMethodSummary, tnDivision, tnMakeCategory, TN_CATEGORIES, TN_PRESET };
