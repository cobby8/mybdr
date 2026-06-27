/* global window */
// ============================================================
// public-site-data.jsx — 공개 토너먼트 사이트 canonical 데이터 (v2.42)
//   ⚠ 관리자 워크스페이스(window.WS, data.jsx)와 동일한 단일 source 기준.
//   BDR 서머 오픈 #4 = 44팀 / 27경기 / 4종별 — 38팀 fiction 폐기본.
//
//   원칙
//   1) 모든 공개 필드는 관리자 입력값에서 파생 (PUBLIC-SITE-DATA-MAP.md 대응표).
//   2) 공개 노출은 "발행(publish)된 섹션"만. 미발행 = 숨김 또는 준비중.
//   3) mock 을 운영 저장 완료처럼 표기하지 않음 — 발행 상태로 가시성 제어.
// ============================================================
(function () {
  // ── 관리자 종별(divisionRules) → 공개 표기 매핑 ──────────────
  // data.jsx: open/ama/u18/u15, cap 16/12/8/8 = 44, 포맷 4종.
  const FORMAT_LABEL = {
    group_stage_knockout: "조별리그 + 토너먼트",
    round_robin: "풀리그",
    single_elimination: "토너먼트",
    dual_tournament: "듀얼토너먼트",
  };

  // ── 종별 + 승인팀(관리자 teams[status=approved]에서 파생) ──────
  // 팀명은 data.jsx teams[] 와 1:1 동일. seed/group 도 동일.
  const open = [
    ["송파 불스", 1, "A"], ["마포 레이커스", 2, "B"], ["용산 워리어스", 3, "C"], ["성동 썬더", 4, "D"],
    ["서초 호넷츠", 5, "A"], ["노원 클리퍼스", 6, "B"], ["은평 제트", 7, "C"], ["광진 스파크", 8, "D"],
    ["강서 타이거즈", 9, "A"], ["동작 팰컨스", 10, "B"], ["중랑 울브스", 11, "C"], ["관악 레이븐스", 12, "D"],
    ["영등포 피닉스", 13, "A"], ["종로 코브라스", 14, "B"], ["성북 샤크스", 15, "C"], ["강동 이글스", 16, "D"],
  ];
  const ama = [
    ["양천 불스", 1], ["구로 레이커스", 2], ["금천 워리어스", 3], ["도봉 썬더", 4],
    ["중구 호넷츠", 5], ["서대문 클리퍼스", 6], ["동대문 제트", 7], ["구리 스파크", 8],
    ["고양 타이거즈", 9], ["성남 팰컨스", 10], ["수원 울브스", 11], ["안양 레이븐스", 12],
  ];
  const u18 = [
    ["부천 불스", 1], ["인천 레이커스", 2], ["대전 워리어스", 3], ["대구 썬더", 4],
    ["부산 호넷츠", 5], ["광주 클리퍼스", 6], ["울산 제트", 7], ["청주 스파크", 8],
  ];
  const u15 = [
    ["전주 불스", 1], ["창원 레이커스", 2], ["포항 워리어스", 3], ["천안 썬더", 4],
    ["김해 호넷츠", 5], ["평택 클리퍼스", 6], ["화성 제트", 7], ["강남 스파크", 8],
  ];
  const mkTeam = (arr, code, region) => arr.map(([name, seed, group]) => ({
    name, seed, group: group || null, div: code,
  }));

  const divisions = [
    { code: "open", label: "오픈부", cap: 16, format: "group_stage_knockout",
      note: "4개 조 리그 후 조 1·2위 토너먼트", teams: mkTeam(open, "open") },
    { code: "ama", label: "아마추어부", cap: 12, format: "round_robin",
      note: "전 팀 단일 풀리그 순위전", teams: mkTeam(ama, "ama") },
    { code: "u18", label: "U18", cap: 8, format: "single_elimination",
      note: "8강 단판 토너먼트", teams: mkTeam(u18, "u18") },
    { code: "u15", label: "U15", cap: 8, format: "dual_tournament",
      note: "더블 엘리미네이션", teams: mkTeam(u15, "u15") },
  ];

  // ── 발행된 일정 (관리자 matches 발행분 — 27경기 중 표본) ─────────
  // 경기수 합계 27 = 오픈 조별12 + 오픈 토너먼트7 + 아마 풀리그(표본) + U18 7 + U15 ...
  // 공개 사이트는 "발행된 경기"만 노출. 미발행 경기는 목록에서 제외.
  const schedule = [
    { date: "06.15 (일)", phase: "오픈부 조별리그 1일차", court: "장충체육관", games: [
      { no: "G-101", time: "10:00", court: "1코트", div: "오픈부", home: "송파 불스", away: "서초 호넷츠", hs: 78, as: 65, status: "completed" },
      { no: "G-102", time: "10:50", court: "2코트", div: "오픈부", home: "마포 레이커스", away: "동작 팰컨스", hs: 71, as: 69, status: "completed" },
      { no: "G-103", time: "11:40", court: "1코트", div: "오픈부", home: "용산 워리어스", away: "은평 제트", hs: 80, as: 62, status: "completed" },
      { no: "G-104", time: "12:30", court: "2코트", div: "아마추어부", home: "양천 불스", away: "구로 레이커스", hs: 66, as: 58, status: "completed" },
    ]},
    { date: "06.18 (수)", phase: "U18 8강 · 진행 중", court: "장충체육관", games: [
      { no: "G-210", time: "14:00", court: "1코트", div: "U18", home: "부천 불스", away: "청주 스파크", hs: 54, as: 49, status: "in_progress" },
      { no: "G-211", time: "14:50", court: "1코트", div: "U18", home: "인천 레이커스", away: "울산 제트", hs: null, as: null, status: "scheduled" },
      { no: "G-212", time: "15:40", court: "2코트", div: "아마추어부", home: "금천 워리어스", away: "도봉 썬더", hs: null, as: null, status: "scheduled" },
    ]},
    { date: "06.22 (일)", phase: "오픈부 4강 · 결승", court: "잠실학생체육관", games: [
      { no: "G-320", time: "13:00", court: "메인코트", div: "오픈부", home: "조별 1위 A", away: "조별 2위 C", hs: null, as: null, status: "scheduled" },
      { no: "G-321", time: "14:00", court: "메인코트", div: "오픈부", home: "조별 1위 B", away: "조별 2위 D", hs: null, as: null, status: "scheduled" },
      { no: "G-330", time: "16:00", court: "메인코트", div: "오픈부", home: "4강 승자 1", away: "4강 승자 2", hs: null, as: null, status: "scheduled" },
    ]},
  ];

  // ── 오픈부 결선 토너먼트 (조 1·2위 8팀 교차 시딩) ───────────────
  const bracket = {
    div: "오픈부", note: "각 조 1·2위 진출 — 8강 교차 대진",
    rounds: [
      { name: "8강", games: [
        { home: "송파 불스", hs: null, away: "관악 레이븐스", as: null, st: "scheduled" },
        { home: "마포 레이커스", hs: null, away: "은평 제트", as: null, st: "scheduled" },
        { home: "용산 워리어스", hs: null, away: "동작 팰컨스", as: null, st: "scheduled" },
        { home: "성동 썬더", hs: null, away: "노원 클리퍼스", as: null, st: "scheduled" },
      ]},
      { name: "4강", games: [
        { home: "8강 승자 1", hs: null, away: "8강 승자 2", as: null, st: "pending" },
        { home: "8강 승자 3", hs: null, away: "8강 승자 4", as: null, st: "pending" },
      ]},
      { name: "결승", games: [
        { home: "4강 승자 1", hs: null, away: "4강 승자 2", as: null, st: "pending" },
      ]},
    ],
  };

  // ── 종료 상태용 최종 결과 (관리자 종료 처리 시 발행) ─────────────
  const finalResult = {
    champion: "송파 불스", runnerUp: "용산 워리어스", third: "마포 레이커스",
    mvp: { name: "김도윤", team: "송파 불스" },
    hasStats: false,   // 공식 스탯/기사 미보유 → "준비중" 표기, mock 기사 금지
    hasArticle: false,
  };

  // ── 대회 메타 (관리자 form/summary 파생) ──────────────────────
  const meta = {
    name: "BDR 서머 오픈 #4",
    series: "BDR 오픈 정규대회", org: "BDR 농구문화",
    subdomain: "bdr-summer-4", navy: "#1B3C87",
    period: "2026.06.15 ~ 06.22", venue: "장충체육관 · 잠실학생체육관", region: "서울",
    tagline: "전국 농구 매칭 플랫폼 — 여름을 여는 4종별 오픈전",
    teamCount: 44, maxTeams: 44, divisionCount: 4, matchCount: 27,
    regClose: "2026.05.25 18:00", entryFee: "종별 4~6만원",
  };

  // ── 7 발행 상태 (관리자 입력 진행도 → 공개 가시성) ───────────────
  //   각 상태에서 어떤 섹션이 보이는지(visible) / 준비중인지(prep) 정의.
  //   sec: overview / teams / schedule / bracket / results
  const STATES = [
    { id: "before",   label: "모집 전",          tone: "mute",
      statusLabel: "모집 예정", regState: "예정",
      sec: { overview: "show", teams: "hide",  schedule: "prep", bracket: "hide", results: "hide" },
      hint: "대회 소개·일정 예정만 공개. 팀/대진/결과 전부 비공개." },
    { id: "reg",      label: "모집 중",          tone: "primary",
      statusLabel: "참가 모집 중", regState: "모집중",
      sec: { overview: "show", teams: "partial", schedule: "prep", bracket: "hide", results: "hide" },
      hint: "참가팀 수/정원/마감일 공개. 승인된 팀만 명단 노출." },
    { id: "predraw",  label: "대진 생성 전",      tone: "primary",
      statusLabel: "접수 마감 · 대진 준비", regState: "마감",
      sec: { overview: "show", teams: "show", schedule: "prep", bracket: "prep", results: "hide" },
      hint: "승인 팀 명단은 공개. 대진/일정은 준비중." },
    { id: "drawn",    label: "대진 생성 후 미발행", tone: "warn",
      statusLabel: "대진 확정 · 발행 대기", regState: "마감",
      sec: { overview: "show", teams: "show", schedule: "prep", bracket: "prep", results: "hide" },
      hint: "관리자에 대진 존재하나 미발행 → 공개엔 이전 공개본 유지 또는 준비중." },
    { id: "published",label: "대진 발행 후",      tone: "ok",
      statusLabel: "대진 발행 완료", regState: "마감",
      sec: { overview: "show", teams: "show", schedule: "show", bracket: "show", results: "hide" },
      hint: "27경기 기준 일정/대진 공개. 결과는 경기 시작 후." },
    { id: "live",     label: "진행 중",          tone: "ok",
      statusLabel: "대회 진행 중", regState: "마감",
      sec: { overview: "show", teams: "show", schedule: "show", bracket: "show", results: "partial" },
      hint: "완료/진행/예정 경기 상태 구분. 실시간 점수 노출." },
    { id: "ended",    label: "종료",            tone: "mute",
      statusLabel: "대회 종료", regState: "종료",
      sec: { overview: "show", teams: "show", schedule: "show", bracket: "show", results: "show" },
      hint: "최종 순위/우승/MVP 공개. 스탯·기사는 보유 시에만." },
  ];

  // ── 배선 메타 — 구현 시 mock 제거 가이드 ──────────────────────
  //   bind        : 관리자 저장값에서 직접 읽는 필드 (1:1)
  //   placeholder : 본 시안의 시연 값. 구현 시 API 결과로 대체 — 하드코딩 금지.
  const wiring = {
    bind: {
      "meta.name": "tournament.name",
      "meta.period": "tournament.dates[] (min~max)",
      "meta.venue": "tournament.venues[].name",
      "meta.teamCount": "count(teams where status='approved') = 44",
      "meta.matchCount": "count(matches where published) = 27",
      "meta.divisionCount": "divisions.length = 4",
      "divisions[].label/cap/format": "divisionRules[].label/cap/format",
      "divisions[].teams[]": "teams where category=code & status='approved' (name/seed/group)",
      "STATES[].sec": "tournament.publishedSections[] + status (가시성 제어)",
    },
    // 아래는 전부 시연용 placeholder — 구현 시 절대 하드코딩하지 말 것.
    placeholder: {
      "schedule[]": "matches where published — 일정/페어/시간/코트는 일정엔진·대진 산출물",
      "schedule[].hs/as": "match.homeScore/awayScore (기록 완료분만)",
      "bracket.rounds[]": "bracket.publishedVersion 산출 — 조 1·2위 교차 결과",
      "finalResult.champion/runnerUp/third": "종료 집계 — standings 1·2·3위",
      "finalResult.mvp": "tournament.mvp (수동 선정 or 스탯 산출)",
      "finalResult.hasStats/hasArticle": "보유 플래그 — false면 '준비중', mock 생성 금지",
    },
    note: "공개 노출 = 발행된 섹션만. placeholder 배열은 빈 배열로 초기화 후 API 결과 주입.",
  };

  window.PSITE = { meta, divisions, schedule, bracket, finalResult, STATES, FORMAT_LABEL, wiring };
})();
