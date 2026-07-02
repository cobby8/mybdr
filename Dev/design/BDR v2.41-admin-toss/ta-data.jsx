/* global React, window */
// ============================================================
// ta-data.jsx — 대회 관리자(tournament-admin) mock 데이터
// ============================================================
(function () {
  const C = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B"];
  const col = (i) => C[i % C.length];

  // 대회 목록 (장소 컬럼 포함)
  window.TA_TOURNAMENTS = [
    { id: "t1", name: "BDR 서머 오픈 #4", series: "BDR 오픈 시리즈", org: "BDR 농구문화", venue: "장충체육관", region: "서울 중구", date: "2026.06.15", status: "진행중", statusTone: "ok", teams: 44, divisions: 4 },
    { id: "t2", name: "한강 3x3 페스타", series: "한강 시리즈", org: "한강 스포츠클럽", venue: "잠실학생체육관", region: "서울 송파", date: "2026.07.02", status: "접수중", statusTone: "primary", teams: 21, divisions: 3 },
    { id: "t3", name: "U18 윈터컵", series: "유스 디벨롭", org: "BDR 농구문화", venue: "고양체육관", region: "경기 고양", date: "2026.07.20", status: "준비중", statusTone: "warn", teams: 12, divisions: 2 },
    { id: "t4", name: "BDR 스프링 리그", series: "BDR 정규리그", org: "BDR 농구문화", venue: "올림픽공원 SK핸드볼", region: "서울 송파", date: "2026.05.10", status: "종료", statusTone: "mute", teams: 44, divisions: 5 },
    { id: "t5", name: "인천 오픈 클래식", series: "지역 오픈", org: "인천농구협회", venue: "인천삼산월드체육관", region: "인천 부평", date: "2026.08.08", status: "준비중", statusTone: "warn", teams: 0, divisions: 3 },
    { id: "t6", name: "마스터즈 40+ 대회", series: "마스터즈", org: "BDR 농구문화", venue: "장충체육관", region: "서울 중구", date: "2026.04.18", status: "종료", statusTone: "mute", teams: 16, divisions: 1 },
  ];

  // 단체·주최
  window.TA_ORGS = [
    { id: "o1", name: "BDR 농구문화", type: "정식 주최사", admins: 6, tournaments: 12, members: 1840, color: col(0), verified: true },
    { id: "o2", name: "한강 스포츠클럽", type: "제휴 단체", admins: 2, tournaments: 4, members: 320, color: col(1), verified: true },
    { id: "o3", name: "인천농구협회", type: "지역 협회", admins: 3, tournaments: 7, members: 980, color: col(2), verified: true },
    { id: "o4", name: "강남 바스켓 크루", type: "동호회", admins: 1, tournaments: 2, members: 144, color: col(3), verified: false },
    { id: "o5", name: "유스 디벨롭 센터", type: "제휴 단체", admins: 2, tournaments: 3, members: 210, color: col(4), verified: true },
  ];

  // 시리즈
  window.TA_SERIES = [
    { id: "s1", name: "BDR 오픈 시리즈", org: "BDR 농구문화", cadence: "분기", editions: 4, next: "2026.09.14", active: true, color: col(0) },
    { id: "s2", name: "BDR 정규리그", org: "BDR 농구문화", cadence: "시즌", editions: 2, next: "2026.09.01", active: true, color: col(1) },
    { id: "s3", name: "한강 시리즈", org: "한강 스포츠클럽", cadence: "월간", editions: 8, next: "2026.07.02", active: true, color: col(2) },
    { id: "s4", name: "유스 디벨롭", org: "유스 디벨롭 센터", cadence: "비정기", editions: 3, next: "미정", active: false, color: col(3) },
    { id: "s5", name: "마스터즈", org: "BDR 농구문화", cadence: "연간", editions: 1, next: "2027.04.18", active: true, color: col(4) },
  ];

  // 템플릿
  window.TA_TEMPLATES = [
    { id: "tp1", name: "3x3 오픈 토너먼트", desc: "조별예선 + 토너먼트 · 4종별 기본", format: "조별리그+토너먼트", divisions: 4, used: 9, color: col(0) },
    { id: "tp2", name: "5x5 정규 리그", desc: "풀리그 · 홈/원정 · 순위 산정", format: "풀리그", divisions: 2, used: 5, color: col(1) },
    { id: "tp3", name: "유스 듀얼 토너먼트", desc: "조별 더블엘리미 + 본선", format: "듀얼토너먼트", divisions: 3, used: 3, color: col(2) },
    { id: "tp4", name: "원데이 녹아웃", desc: "단판 토너먼트 · 단일 종별", format: "토너먼트", divisions: 1, used: 7, color: col(3) },
  ];

  // 대시보드 KPI
  window.TA_KPI = [
    { label: "운영 중 대회", value: "5", icon: "trophy", tone: "primary", delta: 25 },
    { label: "이번달 참가팀", value: "152", icon: "users", tone: "ok", delta: 12 },
    { label: "접수 대기", value: "8", icon: "clock", tone: "warn", delta: -4 },
    { label: "등록 단체", value: "5", icon: "building-2", tone: "violet", delta: 0 },
  ];

  // 대시보드 — 최근 활동
  window.TA_ACTIVITY = [
    { id: "a1", icon: "user-plus", tone: "ok", t: "한강 불스 외 3팀 참가 신청", s: "한강 3x3 페스타", time: "12분 전" },
    { id: "a2", icon: "check-circle", tone: "primary", t: "U18 윈터컵 대진표 생성 완료", s: "U18 윈터컵", time: "1시간 전" },
    { id: "a3", icon: "credit-card", tone: "violet", t: "참가비 입금 6건 확인", s: "BDR 서머 오픈 #4", time: "2시간 전" },
    { id: "a4", icon: "calendar", tone: "warn", t: "일정 자동 생성 — 27경기", s: "BDR 서머 오픈 #4", time: "3시간 전" },
    { id: "a5", icon: "megaphone", tone: "primary", t: "인천 오픈 클래식 접수 시작", s: "인천 오픈 클래식", time: "어제" },
  ];

  // 대시보드 — 월별 대회 수 (미니 차트)
  window.TA_CHART = [
    { m: "1월", v: 2 }, { m: "2월", v: 3 }, { m: "3월", v: 3 }, { m: "4월", v: 4 },
    { m: "5월", v: 5 }, { m: "6월", v: 6 }, { m: "7월", v: 4, soft: true }, { m: "8월", v: 2, soft: true },
  ];
})();
