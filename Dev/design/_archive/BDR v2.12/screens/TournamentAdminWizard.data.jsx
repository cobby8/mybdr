/* global React */

// =====================================================================
// TournamentAdminWizard — mock data
// snake_case 정책 — 응답 키 = my_role / tournaments_count / last_edition_number
// 4 상태군 mock toggle 은 TournamentAdminWizard.jsx 의 상태 컨트롤에서 제어
// =====================================================================

const WIZARD_USER = {
  user_id: "u_kim_03",
  display_name: "김도훈",
  email: "kim03@mybdr.kr",
  // role 가정값 — wizard 토글에서 변경
  role: "tournament_admin",                  // 'tournament_admin' | 'association_admin' | 'super_admin'
  permissions: ["tournament:create", "org:create"]
};

const WIZARD_ORGS = [
{
  organization_id: "org_seoul_3x3",
  name: "서울 3x3 위원회",
  type: "협회",
  region: "서울",
  my_role: "owner",
  tournaments_count: 12,
  series_count: 3,
  member_count: 184,
  logo_color: "#1B3C87"
},
{
  organization_id: "org_gangnam_basket",
  name: "강남 농구 클럽",
  type: "클럽",
  region: "서울 · 강남",
  my_role: "admin",
  tournaments_count: 4,
  series_count: 1,
  member_count: 42,
  logo_color: "#E31B23"
},
{
  organization_id: "org_run_n_gun",
  name: "Run N Gun 동호회",
  type: "동호회",
  region: "서울 · 마포",
  my_role: "admin",
  tournaments_count: 1,
  series_count: 0,
  member_count: 28,
  logo_color: "#0F5FCC"
}];


const WIZARD_SERIES = [
{
  series_id: "ser_summer_open",
  organization_id: "org_seoul_3x3",
  name: "BDR 서머 오픈",
  slug: "summer-open",
  last_edition_number: 3,
  last_edition_date: "2025-08-17",
  edition_count: 3,
  divisions_count: 4,
  description: "여름 시즌 오픈 토너먼트"
},
{
  series_id: "ser_challenge",
  organization_id: "org_seoul_3x3",
  name: "BDR 챌린지",
  slug: "challenge",
  last_edition_number: 7,
  last_edition_date: "2025-11-02",
  edition_count: 7,
  divisions_count: 6,
  description: "월간 챌린지 시리즈"
},
{
  series_id: "ser_rookie_cup",
  organization_id: "org_seoul_3x3",
  name: "루키 컵",
  slug: "rookie-cup",
  last_edition_number: 2,
  last_edition_date: "2025-09-21",
  edition_count: 2,
  divisions_count: 3,
  description: "신인 / U18 전용"
}];


// 이전 회차 prefill — series_id 의 last edition snapshot
const WIZARD_LAST_EDITION = {
  ser_summer_open: {
    series_id: "ser_summer_open",
    last_edition_number: 3,
    name: "BDR 서머 오픈 #3",
    venue: "장충체육관",
    address: "서울 중구 동호로 241",
    description: "여름 시즌 오픈 — 4종별 16팀",
    cover_image_url: "",
    division_rules: [
    { division_name: "남자 오픈", entry_fee: 80000, max_teams: 16, min_age: null, max_age: null },
    { division_name: "남자 마스터즈 (35+)", entry_fee: 80000, max_teams: 8, min_age: 35, max_age: null },
    { division_name: "여자 오픈", entry_fee: 70000, max_teams: 12, min_age: null, max_age: null },
    { division_name: "U18 남자", entry_fee: 50000, max_teams: 8, min_age: null, max_age: 18 }],

    account_holder: "",
    bank_name: "",
    account_number: ""
  },
  ser_challenge: {
    series_id: "ser_challenge",
    last_edition_number: 7,
    name: "BDR 챌린지 #7",
    venue: "올림픽공원 K-아트홀",
    address: "서울 송파구 올림픽로",
    description: "월간 챌린지 — 정규 6종별",
    cover_image_url: "",
    division_rules: [
    { division_name: "Pro Open", entry_fee: 120000, max_teams: 16, min_age: null, max_age: null },
    { division_name: "Pro Women", entry_fee: 100000, max_teams: 12, min_age: null, max_age: null },
    { division_name: "Amateur A", entry_fee: 60000, max_teams: 16, min_age: null, max_age: null },
    { division_name: "Amateur B", entry_fee: 60000, max_teams: 16, min_age: null, max_age: null },
    { division_name: "U18", entry_fee: 40000, max_teams: 12, min_age: null, max_age: 18 },
    { division_name: "U15", entry_fee: 30000, max_teams: 8, min_age: null, max_age: 15 }],

    account_holder: "",
    bank_name: "",
    account_number: ""
  }
};

// AssociationWizard 단가표 mock
const WIZARD_FEE_GRID = [
{ division: "Pro Open", grade: "A", duration: "60분", referee_fee: 80000, recorder_fee: 50000 },
{ division: "Pro Open", grade: "B", duration: "60분", referee_fee: 60000, recorder_fee: 40000 },
{ division: "Amateur", grade: "A", duration: "40분", referee_fee: 50000, recorder_fee: 30000 },
{ division: "Amateur", grade: "B", duration: "40분", referee_fee: 40000, recorder_fee: 25000 },
{ division: "U18", grade: "A", duration: "40분", referee_fee: 40000, recorder_fee: 25000 }];


// AssociationWizard 사무국장 후보
const WIZARD_USER_CANDIDATES = [
{ user_id: "u_kim_03", display_name: "김도훈", email: "kim03@mybdr.kr", region: "서울", referee_level: "1급" },
{ user_id: "u_lee_park", display_name: "이박재", email: "leepark@mybdr.kr", region: "경기 남부", referee_level: "2급" },
{ user_id: "u_jung_sh", display_name: "정세훈", email: "jsh@mybdr.kr", region: "서울 · 강남", referee_level: "1급" },
{ user_id: "u_oh_yj", display_name: "오영진", email: "ohyj@mybdr.kr", region: "인천", referee_level: "3급" }];


Object.assign(window, { WIZARD_USER, WIZARD_ORGS, WIZARD_SERIES, WIZARD_LAST_EDITION, WIZARD_FEE_GRID, WIZARD_USER_CANDIDATES });
