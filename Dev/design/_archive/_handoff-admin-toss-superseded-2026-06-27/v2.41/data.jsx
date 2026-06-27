/* global window */
// ============================================================
// data.jsx — TournamentWorkspace Toss 역박제 mock 데이터
//   function-lock-B1.md 계약을 시연할 최소 표본. 서버 호출 없음.
// ============================================================

// 종별 진행방식 6 enum (division-formats.ts)
window.FORMAT_LABEL = {
  single_elimination: "토너먼트",
  round_robin: "풀리그",
  dual_tournament: "듀얼토너먼트",
  group_stage_knockout: "조별리그+토너먼트",
  league_advancement: "링크제",
  group_stage_with_ranking: "조별리그+동순위 순위결정전",
};
window.ALLOWED_FORMATS = Object.keys(window.FORMAT_LABEL);

window.WS = {
  tournament: { id: "tn-2026-summer-4", name: "BDR 서머 오픈 #4", dDay: 31 },

  summary: {
    teamCount: 44, maxTeams: 44, divisionCount: 4, matchCount: 27,
    statusLabel: "진행중", statusTone: "ok",
    siteConfigured: true, sitePublished: false, siteSubdomain: "bdr-summer-4",
    progressCompleted: 6, progressTotal: 8, missingCount: 2,
  },

  matchStats: { total: 27, paper: 4, flutter: 21, manual: 0, inProgress: 2 },
  defaultMode: "flutter",

  // 메가폼 초기값
  form: {
    name: "BDR 서머 오픈 #4", organizer: "BDR 운영팀", host: "서울시농구협회",
    description: "전국 아마추어 농구 동호인을 위한 BDR 서머 시리즈 4번째 대회.",
    gameTime: "10분", gameBall: "몰텐 GG7X", gameMethod: "4쿼터",
    rules: "FIBA 룰 적용. 자세한 운영 규칙은 요강 참조.", prize: "우승 200만원 / 준우승 100만원",
    entryFee: 60000, regStart: "2026-05-01T10:00", regEnd: "2026-05-25T18:00",
    bankName: "국민은행", bankAccount: "123456-78-901234", bankHolder: "BDR운영팀",
    feeNotes: "입금자명은 팀명으로 기재. 환불은 접수 마감 3일 전까지.",
    maxTeams: 44, teamSize: 5, rosterMin: 5, rosterMax: 12,
    autoApprove: false, allowWaiting: true, waitingCap: 8,
    sponsors: [{ id: "sp1", name: "몰텐", logo: true }, { id: "sp2", name: "스팔딩", logo: false }],
    venues: [
      { id: "v1", name: "장충체육관", region: "서울 중구", courtCount: 2, naming: "num" },
      { id: "v2", name: "잠실학생체육관", region: "서울 송파구", courtCount: 1, naming: "num" },
    ],
    dates: [
      { id: "d1", date: "2026-06-15", courtIds: ["v1_c0", "v1_c1"] },
      { id: "d2", date: "2026-06-22", courtIds: ["v2_c0"] },
    ],
    // 경기 규정 (game_rules)
    gameRules: {
      homeColor: "#FFFFFF", awayColor: "#1A1E27", vestProvided: true,
      clockMode: "dead", quarterType: "4Q", quarterMinutes: 10, overtimeMinutes: 5,
      lastScoreStopMin: 1, shotClockEnabled: true,
      foulLimit: 5, teamFoulBonus: 5, firstHalfTimeouts: 2, secondHalfTimeouts: 3,
      timeoutDurationSeconds: 60, shortBreakDurationSeconds: 120, halftimeDurationSeconds: 600,
      overtimeBreakDurationSeconds: 120, autoIntervalTimerEnabled: true,
    },
  },

  // teams 패널
  divisionRules: [
    { code: "open", label: "오픈부", cap: 16, fee: 60000, format: "group_stage_knockout",
      settings: { group_size: 4, group_count: 4, advance_per_group: 2 } },
    { code: "ama", label: "아마추어부", cap: 12, fee: 50000, format: "round_robin", settings: { group_count: 1 } },
    { code: "u18", label: "U18", cap: 8, fee: 40000, format: "single_elimination", settings: {} },
    { code: "u15", label: "U15", cap: 8, fee: 40000, format: "dual_tournament", settings: { group_size: 4, advance_per_group: 2 } },
  ],
  teams: [
    { id: "t1",name: "송파 불스",color: "#0F5FCC",category: "open",status: "approved",via: "self",seed: 1,group: "A",players: 7,paid: "paid",waiting: null,manager: "이코치",appliedAt: "2026-05-03" },
    { id: "t2",name: "마포 레이커스",color: "#1CA05E",category: "open",status: "approved",via: "coach_token",seed: 2,group: "B",players: 8,paid: "paid",waiting: null,manager: "박코치",appliedAt: "2026-05-04" },
    { id: "t3",name: "용산 워리어스",color: "#E8A33B",category: "open",status: "approved",via: "admin",seed: 3,group: "C",players: 9,paid: "paid",waiting: null,manager: "정코치",appliedAt: "2026-05-05" },
    { id: "t4",name: "성동 썬더",color: "#6D3AD1",category: "open",status: "approved",via: "self",seed: 4,group: "D",players: 10,paid: "paid",waiting: null,manager: "최코치",appliedAt: "2026-05-06" },
    { id: "t5",name: "서초 호넷츠",color: "#3DA9E0",category: "open",status: "approved",via: "coach_token",seed: 5,group: "A",players: 11,paid: "paid",waiting: null,manager: "장코치",appliedAt: "2026-05-07" },
    { id: "t6",name: "노원 클리퍼스",color: "#D9488A",category: "open",status: "approved",via: "admin",seed: 6,group: "B",players: 12,paid: "paid",waiting: null,manager: "윤코치",appliedAt: "2026-05-08" },
    { id: "t7",name: "은평 제트",color: "#0E8C8C",category: "open",status: "approved",via: "self",seed: 7,group: "C",players: 7,paid: "unpaid",waiting: null,manager: "임코치",appliedAt: "2026-05-09" },
    { id: "t8",name: "광진 스파크",color: "#C2410C",category: "open",status: "approved",via: "coach_token",seed: 8,group: "D",players: 8,paid: "paid",waiting: null,manager: "한코치",appliedAt: "2026-05-10" },
    { id: "t9",name: "강서 타이거즈",color: "#4338CA",category: "open",status: "approved",via: "admin",seed: 9,group: "A",players: 9,paid: "paid",waiting: null,manager: "오코치",appliedAt: "2026-05-11" },
    { id: "t10",name: "동작 팰컨스",color: "#E31B23",category: "open",status: "approved",via: "self",seed: 10,group: "B",players: 10,paid: "paid",waiting: null,manager: "김코치",appliedAt: "2026-05-12" },
    { id: "t11",name: "중랑 울브스",color: "#0F5FCC",category: "open",status: "approved",via: "coach_token",seed: 11,group: "C",players: 11,paid: "paid",waiting: null,manager: "이코치",appliedAt: "2026-05-13" },
    { id: "t12",name: "관악 레이븐스",color: "#1CA05E",category: "open",status: "approved",via: "admin",seed: 12,group: "D",players: 12,paid: "paid",waiting: null,manager: "박코치",appliedAt: "2026-05-14" },
    { id: "t13",name: "영등포 피닉스",color: "#E8A33B",category: "open",status: "approved",via: "self",seed: 13,group: "A",players: 7,paid: "paid",waiting: null,manager: "정코치",appliedAt: "2026-05-15" },
    { id: "t14",name: "종로 코브라스",color: "#6D3AD1",category: "open",status: "approved",via: "coach_token",seed: 14,group: "B",players: 8,paid: "unpaid",waiting: null,manager: "최코치",appliedAt: "2026-05-16" },
    { id: "t15",name: "성북 샤크스",color: "#3DA9E0",category: "open",status: "approved",via: "admin",seed: 15,group: "C",players: 9,paid: "paid",waiting: null,manager: "장코치",appliedAt: "2026-05-17" },
    { id: "t16",name: "강동 이글스",color: "#D9488A",category: "open",status: "approved",via: "self",seed: 16,group: "D",players: 10,paid: "paid",waiting: null,manager: "윤코치",appliedAt: "2026-05-18" },
    { id: "t17",name: "양천 불스",color: "#0E8C8C",category: "ama",status: "approved",via: "self",seed: 1,group: "A",players: 7,paid: "paid",waiting: null,manager: "임코치",appliedAt: "2026-05-19" },
    { id: "t18",name: "구로 레이커스",color: "#C2410C",category: "ama",status: "approved",via: "coach_token",seed: 2,group: "B",players: 8,paid: "paid",waiting: null,manager: "한코치",appliedAt: "2026-05-20" },
    { id: "t19",name: "금천 워리어스",color: "#4338CA",category: "ama",status: "approved",via: "admin",seed: 3,group: "A",players: 9,paid: "paid",waiting: null,manager: "오코치",appliedAt: "2026-05-21" },
    { id: "t20",name: "도봉 썬더",color: "#E31B23",category: "ama",status: "approved",via: "self",seed: 4,group: "B",players: 10,paid: "paid",waiting: null,manager: "김코치",appliedAt: "2026-05-22" },
    { id: "t21",name: "중구 호넷츠",color: "#0F5FCC",category: "ama",status: "approved",via: "coach_token",seed: 5,group: "A",players: 11,paid: "paid",waiting: null,manager: "이코치",appliedAt: "2026-05-23" },
    { id: "t22",name: "서대문 클리퍼스",color: "#1CA05E",category: "ama",status: "approved",via: "admin",seed: 6,group: "B",players: 12,paid: "paid",waiting: null,manager: "박코치",appliedAt: "2026-05-24" },
    { id: "t23",name: "동대문 제트",color: "#E8A33B",category: "ama",status: "approved",via: "self",seed: 7,group: "A",players: 7,paid: "unpaid",waiting: null,manager: "정코치",appliedAt: "2026-05-25" },
    { id: "t24",name: "구리 스파크",color: "#6D3AD1",category: "ama",status: "approved",via: "coach_token",seed: 8,group: "B",players: 8,paid: "paid",waiting: null,manager: "최코치",appliedAt: "2026-05-02" },
    { id: "t25",name: "고양 타이거즈",color: "#3DA9E0",category: "ama",status: "approved",via: "admin",seed: 9,group: "A",players: 9,paid: "paid",waiting: null,manager: "장코치",appliedAt: "2026-05-03" },
    { id: "t26",name: "성남 팰컨스",color: "#D9488A",category: "ama",status: "approved",via: "self",seed: 10,group: "B",players: 10,paid: "paid",waiting: null,manager: "윤코치",appliedAt: "2026-05-04" },
    { id: "t27",name: "수원 울브스",color: "#0E8C8C",category: "ama",status: "approved",via: "coach_token",seed: 11,group: "A",players: 11,paid: "paid",waiting: null,manager: "임코치",appliedAt: "2026-05-05" },
    { id: "t28",name: "안양 레이븐스",color: "#C2410C",category: "ama",status: "approved",via: "admin",seed: 12,group: "B",players: 12,paid: "paid",waiting: null,manager: "한코치",appliedAt: "2026-05-06" },
    { id: "t29",name: "부천 불스",color: "#4338CA",category: "u18",status: "approved",via: "self",seed: 1,group: null,players: 7,paid: "paid",waiting: null,manager: "오코치",appliedAt: "2026-05-07" },
    { id: "t30",name: "인천 레이커스",color: "#E31B23",category: "u18",status: "approved",via: "coach_token",seed: 2,group: null,players: 8,paid: "paid",waiting: null,manager: "김코치",appliedAt: "2026-05-08" },
    { id: "t31",name: "대전 워리어스",color: "#0F5FCC",category: "u18",status: "approved",via: "admin",seed: 3,group: null,players: 9,paid: "paid",waiting: null,manager: "이코치",appliedAt: "2026-05-09" },
    { id: "t32",name: "대구 썬더",color: "#1CA05E",category: "u18",status: "approved",via: "self",seed: 4,group: null,players: 10,paid: "paid",waiting: null,manager: "박코치",appliedAt: "2026-05-10" },
    { id: "t33",name: "부산 호넷츠",color: "#E8A33B",category: "u18",status: "approved",via: "coach_token",seed: 5,group: null,players: 11,paid: "paid",waiting: null,manager: "정코치",appliedAt: "2026-05-11" },
    { id: "t34",name: "광주 클리퍼스",color: "#6D3AD1",category: "u18",status: "approved",via: "admin",seed: 6,group: null,players: 12,paid: "paid",waiting: null,manager: "최코치",appliedAt: "2026-05-12" },
    { id: "t35",name: "울산 제트",color: "#3DA9E0",category: "u18",status: "approved",via: "self",seed: 7,group: null,players: 7,paid: "unpaid",waiting: null,manager: "장코치",appliedAt: "2026-05-13" },
    { id: "t36",name: "청주 스파크",color: "#D9488A",category: "u18",status: "approved",via: "coach_token",seed: 8,group: null,players: 8,paid: "paid",waiting: null,manager: "윤코치",appliedAt: "2026-05-14" },
    { id: "t37",name: "전주 불스",color: "#0E8C8C",category: "u15",status: "approved",via: "self",seed: 1,group: "A",players: 7,paid: "paid",waiting: null,manager: "임코치",appliedAt: "2026-05-15" },
    { id: "t38",name: "창원 레이커스",color: "#C2410C",category: "u15",status: "approved",via: "coach_token",seed: 2,group: "B",players: 8,paid: "paid",waiting: null,manager: "한코치",appliedAt: "2026-05-16" },
    { id: "t39",name: "포항 워리어스",color: "#4338CA",category: "u15",status: "approved",via: "admin",seed: 3,group: "A",players: 9,paid: "paid",waiting: null,manager: "오코치",appliedAt: "2026-05-17" },
    { id: "t40",name: "천안 썬더",color: "#E31B23",category: "u15",status: "approved",via: "self",seed: 4,group: "B",players: 10,paid: "paid",waiting: null,manager: "김코치",appliedAt: "2026-05-18" },
    { id: "t41",name: "김해 호넷츠",color: "#0F5FCC",category: "u15",status: "approved",via: "coach_token",seed: 5,group: "A",players: 11,paid: "paid",waiting: null,manager: "이코치",appliedAt: "2026-05-19" },
    { id: "t42",name: "평택 클리퍼스",color: "#1CA05E",category: "u15",status: "approved",via: "admin",seed: 6,group: "B",players: 12,paid: "paid",waiting: null,manager: "박코치",appliedAt: "2026-05-20" },
    { id: "t43",name: "화성 제트",color: "#E8A33B",category: "u15",status: "approved",via: "self",seed: 7,group: "A",players: 7,paid: "unpaid",waiting: null,manager: "정코치",appliedAt: "2026-05-21" },
    { id: "t44",name: "강남 스파크",color: "#6D3AD1",category: "u15",status: "approved",via: "coach_token",seed: 8,group: "B",players: 8,paid: "paid",waiting: null,manager: "최코치",appliedAt: "2026-05-22" },
  ],

  // matches 패널
  matches: [
    { id: "m1", round: 1, roundName: "예선 1R", num: 1, division: "open", venue: "장충체육관", homeId: "t1", awayId: "t5", home: "송파 불스", away: "서초 호넷츠", hs: 78, as: 65, status: "completed", winner: "home", at: "2026-06-15" },
    { id: "m2", round: 1, roundName: "예선 1R", num: 2, division: "open", venue: "장충체육관", homeId: "t2", awayId: "t10", home: "마포 레이커스", away: "동작 팰컨스", hs: 0, as: 0, status: "scheduled", winner: null, at: "2026-06-15" },
    { id: "m3", round: 2, roundName: "8강", num: 3, division: "open", venue: "잠실학생체육관", homeId: "t1", awayId: null, home: "송파 불스", away: "미정", hs: 0, as: 0, status: "pending", winner: null, at: null },
    { id: "m4", round: 1, roundName: "예선 1R", num: 4, division: "ama", venue: "장충체육관", homeId: "t17", awayId: "t18", home: "양천 불스", away: "구로 레이커스", hs: 0, as: 0, status: "in_progress", winner: null, at: "2026-06-15" },
  ],

  // bracket 패널
  bracket: {
    format: "group_stage_knockout", currentVersion: 1, activeVersion: null, maxFree: 3,
    versions: [{ v: 1, at: "2026-06-10", active: false }],
    approvedCount: 5,
  },

  // recorders 패널
  recorders: [
    { id: "r1", uid: "u1", name: "기록원 김", email: "rec.kim@bdr.kr", active: true },
    { id: "r2", uid: "u2", name: "기록원 이", email: "rec.lee@bdr.kr", active: true },
  ],

  // site 패널
  site: { published: false, subdomain: "bdr-summer-4", template: "classic-tournament", color: "#1B3C87" },
  siteTemplates: [
    { slug: "classic-tournament", name: "Classic", desc: "깔끔한 화이트 배경의 모던 레이아웃", navBg: "#1B3C87", bg: "#F5F7FA", cardBg: "#FFFFFF" },
    { slug: "the-process", name: "Dark", desc: "강렬한 다크 배경의 대담한 스타일", navBg: "#1F2937", bg: "#0F172A", cardBg: "#1E293B" },
    { slug: "minimal-white", name: "Minimal", desc: "타이포그래피 중심의 미니멀한 느낌", navBg: "#FFFFFF", bg: "#FFFFFF", cardBg: "#F5F7FA" },
  ],
  colorPresets: [
    { hex: "#1B3C87", name: "토스 블루" }, { hex: "#EF4444", name: "레드" }, { hex: "#E31B23", name: "BDR Red" },
    { hex: "#22C55E", name: "그린" }, { hex: "#8B5CF6", name: "퍼플" }, { hex: "#FBBF24", name: "골드" },
    { hex: "#0EA5E9", name: "스카이" }, { hex: "#1F2937", name: "다크" },
  ],

  // admins 패널
  admins: [
    { id: "a1", name: "박수빈", email: "subin@bdr.kr", role: "owner" },
    { id: "a2", name: "관리자 정", email: "admin.jung@bdr.kr", role: "admin" },
    { id: "a3", name: "스태프 한", email: "staff.han@bdr.kr", role: "staff" },
  ],

  // 유니폼 16색 (도메인 hex — 토큰화 예외)
  uniformPalette: [
    ["화이트", "#FFFFFF"], ["레드", "#E31B23"], ["블루", "#0F5FCC"], ["네이비", "#1B2A4A"],
    ["블랙", "#1A1E27"], ["그린", "#1CA05E"], ["옐로", "#E8A33B"], ["오렌지", "#E8821B"],
    ["퍼플", "#6D3AD1"], ["스카이", "#3DA9E0"], ["민트", "#19C3A6"], ["핑크", "#E85FA0"],
    ["그레이", "#8A93A0"], ["마룬", "#7A1620"], ["틸", "#0E7C86"], ["골드", "#C9A227"],
  ],
  // 경기 시간 프리셋
  gamePresets: [
    { label: "10분 4쿼터", quarterType: "4Q", quarterMinutes: 10 },
    { label: "8분 4쿼터", quarterType: "4Q", quarterMinutes: 8 },
    { label: "20분 전후반", quarterType: "HALF", quarterMinutes: 20 },
  ],
};

window.ROLE_LABEL = { owner: "주최자", admin: "관리자", staff: "스태프", scorer: "기록원" };
window.MATCH_STATUS = { pending: "대기", scheduled: "예정", in_progress: "진행 중", completed: "종료", cancelled: "취소", bye: "부전승" };
window.MATCH_TONE = { pending: "mute", scheduled: "info", in_progress: "warn", completed: "ok", cancelled: "err", bye: "mute" };
window.TEAM_STATUS = { pending: "대기 중", approved: "승인", rejected: "거절", withdrawn: "취소" };
window.TEAM_TONE = { pending: "warn", approved: "ok", rejected: "err", withdrawn: "mute" };
window.VIA_LABEL = { admin: "운영자", coach_token: "코치", self: "본인" };
window.PAY_LABEL = { paid: "납부", unpaid: "미납", refunded: "환불", waived: "면제" };

// 새 대회 생성 — 빈 폼 (수정과 동일 구조, 값만 초기화)
window.WS.emptyForm = {
  ...window.WS.form,
  name: "", organizer: "", host: "", description: "",
  gameBall: "", rules: "", prize: "",
  bankName: "", bankAccount: "", bankHolder: "", feeNotes: "",
  entryFee: 0, regStart: "", regEnd: "",
  sponsors: [], venues: [], dates: [],
  autoApprove: false, allowWaiting: false,
};
