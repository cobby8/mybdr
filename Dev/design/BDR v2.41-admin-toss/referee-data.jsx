/* global window */
// ============================================================
// referee-data.jsx — 심판 관리자 데이터 (referee/admin)
// ============================================================
window.RF_KPI = [
  { label: "이번주 배정", value: "86", delta: 9, icon: "clipboard-check", tone: "primary" },
  { label: "활동 심판", value: "142", delta: 4, icon: "users", tone: "violet" },
  { label: "미배정 경기", value: "7", delta: -22, icon: "alert-triangle", tone: "warn" },
  { label: "정산 대기", value: "₩3.18M", delta: 6, icon: "wallet", tone: "ok" },
];

window.RF_WEEK = [
  { m: "월", v: 12 }, { m: "화", v: 9 }, { m: "수", v: 14 },
  { m: "목", v: 11 }, { m: "금", v: 16 }, { m: "토", v: 24 }, { m: "일", v: 18 },
];

window.RF_QUEUE = [
  { id: 1, icon: "alert-triangle", tone: "warn", t: "토요일 강남 리그 3경기 미배정", s: "마감 D-2 · 주심 1·부심 2 필요", time: "긴급" },
  { id: 2, icon: "user-check", tone: "primary", t: "신규 심판 4명 자격 검증 대기", s: "KBA 2급 서류 확인 필요", time: "방금" },
  { id: 3, icon: "calendar-clock", tone: "violet", t: "일요일 송파 토너먼트 일정 변경", s: "배정 6건 재확인", time: "32분 전" },
  { id: 4, icon: "star", tone: "ok", t: "5월 심판 평가 12건 제출 완료", s: "평균 4.6 / 5.0", time: "1시간 전" },
];

// 배정 현황
window.RF_ASSIGN = {
  head: "배정 현황", sub: "경기별 심판 배정 상태를 관리합니다.", addLabel: "수동 배정",
  cols: [
    { key: "game", label: "경기", w: "minmax(0,2fr)", type: "title" },
    { key: "when", label: "일시", w: "minmax(0,1.2fr)", type: "mono" },
    { key: "court", label: "코트", w: "minmax(0,1fr)", type: "muted" },
    { key: "crew", label: "배정", w: "minmax(0,1.1fr)", type: "muted" },
    { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
    { key: "act", label: "", w: "60px", align: "right", type: "actions" },
  ],
  rows: [
    { id: "a1", name: "강남 주말리그 8R · A조", sub: "성인부 5인제", when: "06.28 (토) 09:00", court: "강남 실내 A", crew: "주심1 · 부심2", status: "badge", badge: "배정완료", tone: "ok" },
    { id: "a2", name: "강남 주말리그 8R · B조", sub: "성인부 5인제", when: "06.28 (토) 11:00", court: "강남 실내 A", crew: "주심1 · 부심1", status: "badge", badge: "부분배정", tone: "amber" },
    { id: "a3", name: "송파 청소년 토너먼트 4강", sub: "U-18", when: "06.29 (일) 14:00", court: "송파 야외", crew: "미배정", status: "badge", badge: "미배정", tone: "red" },
    { id: "a4", name: "동대문 직장인 리그 3R", sub: "혼성부", when: "06.30 (월) 20:00", court: "동대문 체육관", crew: "주심1 · 부심2", status: "badge", badge: "배정완료", tone: "ok" },
    { id: "a5", name: "마포 3대3 챌린지 예선", sub: "3x3", when: "07.01 (화) 19:00", court: "마포 코트", crew: "주심1", status: "badge", badge: "배정완료", tone: "ok" },
  ],
};

// 캘린더 (주간 보드 — 커스텀)
window.RF_CAL = {
  days: ["월 6/23", "화 6/24", "수 6/25", "목 6/26", "금 6/27", "토 6/28", "일 6/29"],
  events: [
    { day: 0, t: "동대문 리그 2R", time: "20:00", crew: "3명", tone: "ok" },
    { day: 2, t: "강남 평일리그", time: "19:30", crew: "2명", tone: "ok" },
    { day: 4, t: "마포 챌린지", time: "19:00", crew: "1명", tone: "amber" },
    { day: 5, t: "강남 주말리그 8R", time: "09:00", crew: "6명", tone: "ok" },
    { day: 5, t: "강남 주말리그 8R", time: "11:00", crew: "4명", tone: "amber" },
    { day: 5, t: "성수 오픈매치", time: "15:00", crew: "2명", tone: "ok" },
    { day: 6, t: "송파 토너먼트 4강", time: "14:00", crew: "미배정", tone: "red" },
    { day: 6, t: "송파 토너먼트 결승", time: "16:30", crew: "미배정", tone: "red" },
  ],
};

// 심판 명단
window.RF_REFS = {
  head: "심판 명단", sub: "활동 심판의 등급·자격·배정 현황을 관리합니다.", addLabel: "심판 등록",
  cols: [
    { key: "ref", label: "심판", w: "minmax(0,1.8fr)", type: "avatar" },
    { key: "grade", label: "등급", w: "92px", align: "center", type: "badge" },
    { key: "region", label: "활동 지역", w: "minmax(0,1fr)", type: "muted" },
    { key: "games", label: "배정", w: "84px", align: "center", type: "mono" },
    { key: "rating", label: "평점", w: "84px", align: "center", type: "mono" },
    { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
    { key: "act", label: "", w: "60px", align: "right", type: "actions" },
  ],
  rows: [
    { id: "r1", name: "정현우", sub: "KBA 1급 · 8년차", color: "#3182F6", grade: "badge", badge: "1급", tone: "blue", region: "서울 강남·송파", games: 18, rating: "4.8", st: "활동중", sttone: "ok" },
    { id: "r2", name: "이서연", sub: "KBA 2급 · 5년차", color: "#6D5AE6", grade: "badge", badge: "2급", tone: "violet", region: "서울 마포·서대문", games: 14, rating: "4.6", st: "활동중", sttone: "ok" },
    { id: "r3", name: "박도훈", sub: "KBA 2급 · 3년차", color: "#16a34a", grade: "badge", badge: "2급", tone: "violet", region: "서울 동대문", games: 11, rating: "4.5", st: "활동중", sttone: "ok" },
    { id: "r4", name: "최민재", sub: "KBA 3급 · 1년차", color: "#E2A03F", grade: "badge", badge: "3급", tone: "grey", region: "경기 성남", games: 6, rating: "4.2", st: "수습", sttone: "warn" },
    { id: "r5", name: "김지호", sub: "KBA 1급 · 10년차", color: "#1B3C87", grade: "badge", badge: "1급", tone: "blue", region: "서울 전역", games: 21, rating: "4.9", st: "활동중", sttone: "ok" },
    { id: "r6", name: "한유진", sub: "KBA 2급 · 4년차", color: "#dc2626", grade: "badge", badge: "2급", tone: "violet", region: "인천 부평", games: 0, rating: "—", st: "휴면", sttone: "mute" },
  ],
};

// 신청 관리
window.RF_APPS = {
  head: "신청 관리", sub: "심판들이 제출한 경기 배정 신청을 승인·반려합니다.", addLabel: null,
  cols: [
    { key: "ref", label: "심판", w: "minmax(0,1.5fr)", type: "avatar" },
    { key: "game", label: "신청 경기", w: "minmax(0,2fr)", type: "muted" },
    { key: "role", label: "희망 역할", w: "minmax(0,1fr)", type: "muted" },
    { key: "when", label: "신청일", w: "minmax(0,1fr)", type: "mono" },
    { key: "status", label: "처리", w: "96px", align: "center", type: "badge" },
  ],
  rows: [
    { id: "ap1", name: "이서연", sub: "2급", color: "#6D5AE6", game: "강남 주말리그 8R · B조", role: "부심", when: "06.25", status: "badge", badge: "대기", tone: "amber" },
    { id: "ap2", name: "박도훈", sub: "2급", color: "#16a34a", game: "송파 토너먼트 4강", role: "주심", when: "06.25", status: "badge", badge: "대기", tone: "amber" },
    { id: "ap3", name: "최민재", sub: "3급", color: "#E2A03F", game: "마포 3대3 챌린지", role: "부심", when: "06.24", status: "badge", badge: "승인", tone: "ok" },
    { id: "ap4", name: "한유진", sub: "2급", color: "#dc2626", game: "동대문 직장인 리그", role: "주심", when: "06.23", status: "badge", badge: "반려", tone: "red" },
  ],
};

// 자격·서류 검증
window.RF_VERIFY = {
  head: "자격·서류 검증", sub: "심판 자격증·신분 서류의 검증 상태를 관리합니다.", addLabel: null,
  cols: [
    { key: "ref", label: "심판", w: "minmax(0,1.6fr)", type: "avatar" },
    { key: "doc", label: "서류", w: "minmax(0,1.4fr)", type: "muted" },
    { key: "issued", label: "발급일", w: "minmax(0,1fr)", type: "mono" },
    { key: "expire", label: "만료", w: "minmax(0,1fr)", type: "mono" },
    { key: "status", label: "검증", w: "100px", align: "center", type: "badge" },
    { key: "act", label: "", w: "60px", align: "right", type: "actions" },
  ],
  rows: [
    { id: "vf1", name: "최민재", sub: "신규 심판", color: "#E2A03F", doc: "KBA 3급 자격증", issued: "2025.11", expire: "2027.11", status: "badge", badge: "검증 대기", tone: "amber" },
    { id: "vf2", name: "신규 A", sub: "가입 신청", color: "#3182F6", doc: "신분증 + 자격증", issued: "2026.01", expire: "—", status: "badge", badge: "서류 부족", tone: "red" },
    { id: "vf3", name: "한유진", sub: "갱신", color: "#dc2626", doc: "KBA 2급 갱신", issued: "2026.03", expire: "2028.03", status: "badge", badge: "검증 완료", tone: "ok" },
    { id: "vf4", name: "정현우", sub: "정기 확인", color: "#3182F6", doc: "KBA 1급 자격증", issued: "2024.06", expire: "2026.06", status: "badge", badge: "만료 임박", tone: "amber" },
  ],
};

// 배정 요청 (대회측)
window.RF_REQ = {
  head: "배정 요청", sub: "대회·단체가 제출한 심판 배정 요청을 처리합니다.", addLabel: null,
  cols: [
    { key: "org", label: "요청 단체", w: "minmax(0,1.6fr)", type: "avatar" },
    { key: "game", label: "대상 경기", w: "minmax(0,2fr)", type: "muted" },
    { key: "need", label: "필요 인원", w: "minmax(0,1fr)", type: "muted" },
    { key: "when", label: "경기일", w: "minmax(0,1fr)", type: "mono" },
    { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
  ],
  rows: [
    { id: "rq1", name: "송파농구협회", sub: "공인 단체", color: "#1B3C87", game: "송파 청소년 토너먼트", need: "주심2 · 부심4", when: "06.29", status: "badge", badge: "처리중", tone: "amber" },
    { id: "rq2", name: "강남리그운영위", sub: "공인 단체", color: "#3182F6", game: "강남 주말리그 8R", need: "주심2 · 부심4", when: "06.28", status: "badge", badge: "배정완료", tone: "ok" },
    { id: "rq3", name: "마포농구회", sub: "동호회", color: "#16a34a", game: "마포 3대3 챌린지", need: "주심1", when: "07.01", status: "badge", badge: "검토 대기", tone: "grey" },
  ],
};

// 평가 리포트
window.RF_EVAL = {
  head: "평가 리포트", sub: "경기 후 제출된 심판 평가를 검토합니다.", addLabel: null,
  cols: [
    { key: "ref", label: "심판", w: "minmax(0,1.6fr)", type: "avatar" },
    { key: "game", label: "평가 경기", w: "minmax(0,2fr)", type: "muted" },
    { key: "score", label: "평점", w: "92px", align: "center", type: "mono" },
    { key: "by", label: "평가자", w: "minmax(0,1fr)", type: "muted" },
    { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
  ],
  rows: [
    { id: "ev1", name: "정현우", sub: "1급", color: "#3182F6", game: "강남 주말리그 7R", score: "4.9", by: "리그운영위", status: "badge", badge: "확정", tone: "ok" },
    { id: "ev2", name: "이서연", sub: "2급", color: "#6D5AE6", game: "마포 챌린지 예선", score: "4.6", by: "마포농구회", status: "badge", badge: "확정", tone: "ok" },
    { id: "ev3", name: "최민재", sub: "3급", color: "#E2A03F", game: "동대문 리그 2R", score: "3.8", by: "직장인리그", status: "badge", badge: "검토 필요", tone: "amber" },
  ],
};

// 정산
window.RF_SETTLE = {
  head: "정산", sub: "심판 수당의 정산 내역을 확인·승인합니다.", addLabel: null,
  cols: [
    { key: "ref", label: "심판", w: "minmax(0,1.6fr)", type: "avatar" },
    { key: "count", label: "경기 수", w: "92px", align: "center", type: "mono" },
    { key: "amount", label: "수당", w: "minmax(0,1fr)", type: "money" },
    { key: "period", label: "정산 기간", w: "minmax(0,1.2fr)", type: "mono" },
    { key: "status", label: "상태", w: "100px", align: "center", type: "badge" },
  ],
  rows: [
    { id: "se1", name: "정현우", sub: "1급", color: "#3182F6", count: 18, amount: "₩1.08M", period: "2026.06", status: "badge", badge: "지급 대기", tone: "amber" },
    { id: "se2", name: "김지호", sub: "1급", color: "#1B3C87", count: 21, amount: "₩1.26M", period: "2026.06", status: "badge", badge: "지급 대기", tone: "amber" },
    { id: "se3", name: "이서연", sub: "2급", color: "#6D5AE6", count: 14, amount: "₩0.70M", period: "2026.06", status: "badge", badge: "지급 완료", tone: "ok" },
    { id: "se4", name: "박도훈", sub: "2급", color: "#16a34a", count: 11, amount: "₩0.55M", period: "2026.06", status: "badge", badge: "지급 완료", tone: "ok" },
  ],
};

// 등급·수당 정책 (커스텀 카드)
window.RF_GRADES = [
  { id: "g1", grade: "1급", color: "#3182F6", main: "₩60,000", sub: "₩40,000", note: "공인 대회 주심 자격 · 8년 이상", count: 24 },
  { id: "g2", grade: "2급", color: "#6D5AE6", main: "₩45,000", sub: "₩30,000", note: "리그·토너먼트 배정 가능 · 3년 이상", count: 68 },
  { id: "g3", grade: "3급", color: "#E2A03F", main: "₩30,000", sub: "₩20,000", note: "예선·친선 경기 부심 · 수습 포함", count: 50 },
];

// 알림 발송
window.RF_NOTI = {
  head: "알림", sub: "심판 대상 공지·배정 알림 발송 내역입니다.", addLabel: "알림 발송",
  cols: [
    { key: "title", label: "제목", w: "minmax(0,2.4fr)", type: "title" },
    { key: "channel", label: "채널", w: "minmax(0,1fr)", type: "muted" },
    { key: "target", label: "대상", w: "minmax(0,1fr)", type: "muted" },
    { key: "sent", label: "발송", w: "minmax(0,1fr)", type: "mono" },
    { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
  ],
  rows: [
    { id: "n1", name: "토요일 배정 확정 안내", sub: "강남 주말리그 8R", channel: "앱 푸시 · SMS", target: "배정 6명", sent: "06.27 18:00", status: "badge", badge: "발송완료", tone: "ok" },
    { id: "n2", name: "송파 토너먼트 배정 요청", sub: "주심·부심 모집", channel: "앱 푸시", target: "1급·2급 32명", sent: "06.26 10:00", status: "badge", badge: "발송완료", tone: "ok" },
    { id: "n3", name: "7월 정산 명세 발행 예정", sub: "정산 안내", channel: "이메일", target: "활동 심판 142명", sent: "예약 07.05", status: "badge", badge: "예약", tone: "amber" },
  ],
};

// 설정
window.RF_SETTINGS = [
  {
    group: "배정 정책", items: [
      { k: "rf_auto", type: "toggle", on: true, label: "자동 배정 추천", desc: "등급·지역·평점 기반으로 후보 심판을 자동 추천합니다." },
      { k: "rf_conflict", type: "toggle", on: true, label: "일정 충돌 차단", desc: "같은 시간대 중복 배정을 자동으로 막습니다." },
      { k: "rf_min", type: "value", value: "주심 1 · 부심 2", label: "기본 배정 구성", desc: "공인 경기의 기본 심판 구성입니다." },
    ]
  },
  {
    group: "자격·검증", items: [
      { k: "rf_expire", type: "toggle", on: true, label: "자격 만료 알림", desc: "자격증 만료 30일 전 자동 알림을 보냅니다." },
      { k: "rf_probation", type: "value", value: "5경기", label: "수습 해제 기준", desc: "신규 심판의 수습 해제에 필요한 경기 수입니다." },
    ]
  },
  {
    group: "정산", items: [
      { k: "rf_cycle", type: "value", value: "매월 5일", label: "정산 주기", desc: "심판 수당 정산·지급 기준일입니다." },
      { k: "rf_tax", type: "toggle", on: true, label: "원천징수 적용", desc: "수당 지급 시 3.3% 원천징수를 자동 계산합니다." },
    ]
  },
];
