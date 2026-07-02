/* global window */
// ============================================================
// ops-data.jsx — 대회 운영 워크스페이스(대회 운영.html) mock 데이터
//   ▸ 대상 대회 = BDR 서머 오픈 #4 (ta-data t1 · 진행중 · 44팀 · 4종별)
//   ▸ 7패널: 참가팀 · 대진표 · 일정 · 매치 · 정산 · 공개 사이트 · 운영 설정
//   ▸ 실 운영 NEW FIELD 형태를 본뜬 mock (DATA-CONTRACT §11 대응).
// ============================================================
(function () {
  const C = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];

  // ── 대회 기본(요약 메가폼 5섹션) ───────────────────────────
  window.WS_TOUR = {
    id: "t1", name: "BDR 서머 오픈 #4", status: "진행중", statusTone: "ok",
    series: "BDR 오픈 시리즈", org: "BDR 농구문화", venue: "장충체육관", region: "서울 중구",
    date: "2026.06.15", dday: "D+2", fee: "₩200,000",
    sections: [
      { k: "기본 정보", v: "BDR 서머 오픈 #4 · BDR 오픈 시리즈" },
      { k: "일정·장소", v: "2026.06.15 ~ 06.16 · 장충체육관 (서울 중구)" },
      { k: "참가 규정", v: "팀당 8~12인 · 본인인증 필수 · 참가비 ₩200,000" },
      { k: "종별 구성", v: "오픈부 · 아마추어부 · U18부 · 40+ 마스터즈 (4종별)" },
      { k: "공개 설정", v: "summer-open-4.mybdr.kr · 부분 공개 (3/6 섹션)" },
    ],
  };

  // ── 요약 KPI · 진행 체크리스트 ─────────────────────────────
  window.WS_KPI = [
    { icon: "users", value: "44", label: "참가 확정 팀", tone: "primary" },
    { icon: "volleyball", value: "27", label: "편성 경기", tone: "ok" },
    { icon: "credit-card", value: "86%", label: "참가비 수납률", tone: "violet" },
    { icon: "clock", value: "D+2", label: "대회 진행", tone: "warn" },
  ];
  window.WS_CHECKLIST = [
    { t: "참가팀 모집·승인", s: "44팀 확정 · 대기 3팀", st: "done" },
    { t: "대진표 생성·발행", s: "4종별 전체 생성 완료", st: "done" },
    { t: "경기 일정 배정", s: "27경기 · 2코트 자동 편성", st: "done" },
    { t: "심판 배정", s: "12경기 미배정 — 확인 필요", st: "current" },
    { t: "공개 사이트 발행", s: "결과·기사 섹션 미발행", st: "todo" },
  ];
  window.WS_ACTIVITY = [
    { id: "a1", icon: "user-plus", tone: "ok", t: "한강 불스 외 3팀 참가 승인", s: "오픈부", time: "12분 전" },
    { id: "a2", icon: "credit-card", tone: "violet", t: "참가비 입금 6건 확인", s: "정산", time: "1시간 전" },
    { id: "a3", icon: "calendar", tone: "warn", t: "일정 자동 생성 — 27경기", s: "일정", time: "3시간 전" },
    { id: "a4", icon: "check-circle", tone: "primary", t: "오픈부 대진표 발행", s: "대진표", time: "어제" },
  ];

  // ── 참가팀 (승인/대기/거절 · 납부 · 코치 · import) ─────────
  window.WS_TEAMS = [
    { id: 1, name: "한강 불스", div: "오픈부", captain: "김도윤", players: 11, pay: "완납", payTone: "ok", coach: "있음", status: "승인", statusTone: "ok", color: C[0] },
    { id: 2, name: "마포 레이커스", div: "오픈부", captain: "박지호", players: 10, pay: "완납", payTone: "ok", coach: "있음", status: "승인", statusTone: "ok", color: C[1] },
    { id: 3, name: "성동 썬더", div: "아마추어부", captain: "이서준", players: 9, pay: "부분", payTone: "warn", coach: "없음", status: "승인", statusTone: "ok", color: C[2] },
    { id: 4, name: "용산 워리어스", div: "오픈부", captain: "최민재", players: 8, pay: "완납", payTone: "ok", coach: "있음", status: "승인", statusTone: "ok", color: C[3] },
    { id: 5, name: "노원 클리퍼스", div: "아마추어부", captain: "강시우", players: 7, pay: "미납", payTone: "danger", coach: "없음", status: "대기", statusTone: "warn", color: C[4] },
    { id: 6, name: "은평 제트", div: "U18부", captain: "정하준", players: 10, pay: "완납", payTone: "ok", coach: "있음", status: "승인", statusTone: "ok", color: C[5] },
    { id: 7, name: "강북 호크스", div: "U18부", captain: "윤재원", players: 9, pay: "미납", payTone: "danger", coach: "있음", status: "대기", statusTone: "warn", color: C[6] },
    { id: 8, name: "송파 피닉스", div: "40+ 마스터즈", captain: "한도현", players: 8, pay: "완납", payTone: "ok", coach: "없음", status: "승인", statusTone: "ok", color: C[7] },
    { id: 9, name: "관악 스파르탄", div: "오픈부", captain: "오세훈", players: 6, pay: "미납", payTone: "danger", coach: "없음", status: "거절", statusTone: "danger", color: C[0] },
    { id: 10, name: "동작 디펜더스", div: "아마추어부", captain: "임건우", players: 11, pay: "부분", payTone: "warn", coach: "있음", status: "대기", statusTone: "warn", color: C[1] },
  ];
  window.WS_TEAM_FILTERS = [["all", "전체"], ["승인", "승인"], ["대기", "대기"], ["거절", "거절"]];

  // ── 대진표 (종별 → 조별 + 토너먼트) ───────────────────────
  window.WS_BRACKET = {
    divisions: ["오픈부", "아마추어부", "U18부", "40+ 마스터즈"],
    published: { "오픈부": true, "아마추어부": true, "U18부": true, "40+ 마스터즈": false },
    groups: [
      { name: "A조", rows: [
        { team: "한강 불스", w: 2, l: 0, pf: 142, seed: 1 },
        { team: "용산 워리어스", w: 1, l: 1, pf: 118, seed: 4 },
        { team: "관악 스파르탄", w: 1, l: 1, pf: 109, seed: 5 },
        { team: "동작 디펜더스", w: 0, l: 2, pf: 88, seed: 8 },
      ]},
      { name: "B조", rows: [
        { team: "마포 레이커스", w: 2, l: 0, pf: 136, seed: 2 },
        { team: "성동 썬더", w: 1, l: 1, pf: 121, seed: 3 },
        { team: "노원 클리퍼스", w: 1, l: 1, pf: 104, seed: 6 },
        { team: "은평 제트", w: 0, l: 2, pf: 79, seed: 7 },
      ]},
    ],
    knockout: [
      { round: "4강", matches: [
        { home: "한강 불스", away: "성동 썬더", hs: 72, as: 61, done: true },
        { home: "마포 레이커스", away: "용산 워리어스", hs: 0, as: 0, done: false },
      ]},
      { round: "결승", matches: [
        { home: "한강 불스", away: "승자 미정", hs: 0, as: 0, done: false },
      ]},
    ],
  };

  // ── 일정 (자동 편성 · 코트×시간) ──────────────────────────
  window.WS_SCHEDULE = [
    { day: "06.15 (토)", slots: [
      { time: "10:00", court: "A코트", div: "오픈부", home: "한강 불스", away: "동작 디펜더스", st: "종료", stTone: "mute" },
      { time: "10:00", court: "B코트", div: "오픈부", home: "용산 워리어스", away: "관악 스파르탄", st: "종료", stTone: "mute" },
      { time: "11:30", court: "A코트", div: "아마추어부", home: "마포 레이커스", away: "은평 제트", st: "종료", stTone: "mute" },
      { time: "13:00", court: "A코트", div: "오픈부", home: "한강 불스", away: "성동 썬더", st: "진행중", stTone: "ok" },
      { time: "13:00", court: "B코트", div: "U18부", home: "은평 제트", away: "강북 호크스", st: "예정", stTone: "warn" },
    ]},
    { day: "06.16 (일)", slots: [
      { time: "10:00", court: "A코트", div: "오픈부", home: "마포 레이커스", away: "용산 워리어스", st: "예정", stTone: "warn" },
      { time: "12:00", court: "A코트", div: "오픈부", home: "결승 진출팀", away: "결승 진출팀", st: "예정", stTone: "warn" },
    ]},
  ];

  // ── 매치 (예정/진행/종료 · 기록방식 · 심판) ────────────────
  window.WS_MATCHES = [
    { id: "m1", title: "한강 불스 vs 동작 디펜더스", div: "오픈부 A조", score: "78 : 54", st: "종료", stTone: "mute", rec: "앱 기록", ref: "김심판", time: "06.15 10:00" },
    { id: "m2", title: "용산 워리어스 vs 관악 스파르탄", div: "오픈부 A조", score: "66 : 63", st: "종료", stTone: "mute", rec: "앱 기록", ref: "이심판", time: "06.15 10:00" },
    { id: "m3", title: "마포 레이커스 vs 은평 제트", div: "아마추어부", score: "81 : 49", st: "종료", stTone: "mute", rec: "수기 기록", ref: "박심판", time: "06.15 11:30" },
    { id: "m4", title: "한강 불스 vs 성동 썬더", div: "오픈부 4강", score: "42 : 38", st: "진행중", stTone: "ok", rec: "앱 기록", ref: "김심판", time: "06.15 13:00" },
    { id: "m5", title: "은평 제트 vs 강북 호크스", div: "U18부", score: "— : —", st: "예정", stTone: "warn", rec: "앱 기록", ref: "미배정", time: "06.15 13:00" },
    { id: "m6", title: "마포 레이커스 vs 용산 워리어스", div: "오픈부 4강", score: "— : —", st: "예정", stTone: "warn", rec: "앱 기록", ref: "미배정", time: "06.16 10:00" },
  ];
  window.WS_MATCH_FILTERS = [["all", "전체"], ["예정", "예정"], ["진행중", "진행중"], ["종료", "종료"]];

  // ── 정산 (수입 - 수수료 - 지출 = 정산액) ──────────────────
  window.WS_SETTLE = {
    summary: [
      { label: "참가비 수입", value: "₩8,800,000", tone: "ok", hint: "44팀 × ₩200,000" },
      { label: "플랫폼 수수료", value: "−₩308,000", tone: "danger", hint: "3.5%" },
      { label: "운영 지출", value: "−₩1,240,000", tone: "danger", hint: "코트·심판·용품" },
      { label: "정산 예정액", value: "₩7,252,000", tone: "primary", hint: "주최: BDR 농구문화" },
    ],
    expenses: [
      { id: 1, name: "장충체육관 대관료", cat: "코트", amount: "₩640,000", st: "지급완료", stTone: "ok" },
      { id: 2, name: "심판 수당 (12경기)", cat: "심판", amount: "₩480,000", st: "지급대기", stTone: "warn" },
      { id: 3, name: "공인구·기록용품", cat: "용품", amount: "₩120,000", st: "지급완료", stTone: "ok" },
    ],
    pays: [
      { id: 1, team: "한강 불스", amount: "₩200,000", st: "완납", stTone: "ok" },
      { id: 2, team: "성동 썬더", amount: "₩120,000", st: "부분", stTone: "warn" },
      { id: 3, team: "노원 클리퍼스", amount: "₩0", st: "미납", stTone: "danger" },
    ],
  };

  // ── 공개 사이트 (publishedSections) ───────────────────────
  window.WS_PUBLISH = {
    url: "summer-open-4.mybdr.kr",
    sections: [
      { k: "overview", label: "대회 개요", desc: "일정·장소·종별·규정", on: true },
      { k: "teams", label: "참가팀", desc: "승인된 팀 명단", on: true },
      { k: "bracket", label: "대진표", desc: "조별·토너먼트 대진", on: true },
      { k: "schedule", label: "경기 일정", desc: "코트·시간표", on: false },
      { k: "results", label: "경기 결과", desc: "스코어·순위", on: false },
      { k: "news", label: "BDR NEWS", desc: "알기자 경기 기사", on: false },
    ],
  };

  // ── 운영 설정 ──────────────────────────────────────────────
  window.WS_SETTINGS = [
    { group: "기록·진행", items: [
      { k: "recMode", label: "기본 기록 방식", desc: "경기 기록 입력 기본값.", value: "앱 기록", type: "value" },
      { k: "autoRef", label: "심판 자동 배정", desc: "일정 생성 시 가용 심판을 자동 배정.", on: false, type: "toggle" },
      { k: "liveScore", label: "실시간 스코어 공개", desc: "진행중 경기 점수를 공개 사이트에 노출.", on: true, type: "toggle" },
    ]},
    { group: "권한·초대", items: [
      { k: "coachToken", label: "코치 초대 토큰", desc: "팀 코치에게 로스터 관리 권한 부여.", value: "활성 (8팀)", type: "value" },
      { k: "adminInvite", label: "공동 운영자", desc: "대회 운영을 함께할 관리자 초대.", value: "2명", type: "value" },
    ]},
  ];

  // 워크스페이스 탭 (요약 + 7패널)
  window.WS_TABS = [
    { id: "summary", icon: "layout-dashboard", label: "요약" },
    { id: "teams", icon: "users", label: "참가팀" },
    { id: "bracket", icon: "git-fork", label: "대진표" },
    { id: "schedule", icon: "calendar", label: "일정" },
    { id: "matches", icon: "volleyball", label: "매치" },
    { id: "settle", icon: "credit-card", label: "정산" },
    { id: "site", icon: "globe", label: "공개 사이트" },
    { id: "settings", icon: "settings", label: "운영 설정" },
  ];
})();
