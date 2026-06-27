/* global window */
// ============================================================
// bo-data.jsx — 백오피스(admin/*) mock 데이터 + 페이지 스키마
//   18 라우트: dash analytics logs users teams orgs tournaments
//   games game-reports courts partners campaigns payments plans
//   community suggestions notifications settings
// ============================================================
(function () {
  const tones = { ok: "ok", warn: "warn", danger: "danger", mute: "grey", primary: "primary" };
  const av = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];

  // ── 대시보드 KPI ──
  window.BO_KPI = [
    { label: "전체 회원", value: "12,840", icon: "users", tone: "primary", delta: 8 },
    { label: "활성 팀", value: "1,206", icon: "shield", tone: "ok", delta: 5 },
    { label: "이번달 결제", value: "₩48.2M", icon: "credit-card", tone: "violet", delta: 14 },
    { label: "처리 대기", value: "23", icon: "bell", tone: "warn", delta: -11 },
  ];
  window.BO_SIGNUP = [
    { m: "1월", v: 620 }, { m: "2월", v: 740 }, { m: "3월", v: 810 }, { m: "4월", v: 980 },
    { m: "5월", v: 1120 }, { m: "6월", v: 1340 }, { m: "7월", v: 760, soft: true },
  ];
  window.BO_QUEUE = [
    { id: "q1", icon: "flag", tone: "danger", t: "경기 리포트 신고 3건", s: "검수 대기", time: "방금" },
    { id: "q2", icon: "credit-card", tone: "violet", t: "환불 요청 5건", s: "결제 처리", time: "23분 전" },
    { id: "q3", icon: "lightbulb", tone: "warn", t: "기능 제안 신규 9건", s: "제안 보드", time: "1시간 전" },
    { id: "q4", icon: "user-x", tone: "danger", t: "계정 정지 검토 2건", s: "사용자 관리", time: "2시간 전" },
    { id: "q5", icon: "building-2", tone: "primary", t: "단체 인증 요청 4건", s: "단체 관리", time: "어제" },
  ];

  // ── 분석(analytics) ──
  window.BO_ANALYTICS = {
    kpi: [
      { label: "MAU", value: "8,420", icon: "activity", tone: "primary", delta: 6 },
      { label: "신규 가입", value: "760", icon: "user-plus", tone: "ok", delta: 9 },
      { label: "리텐션 30일", value: "62%", icon: "repeat", tone: "violet", delta: 3 },
      { label: "평균 세션", value: "7.4분", icon: "timer", tone: "warn", delta: -2 },
    ],
    bars: window.BO_SIGNUP,
    breakdown: [
      { id: "b1", t: "코트 예약", v: "34%", icon: "map-pin", color: av[0] },
      { id: "b2", t: "픽업 게임", v: "27%", icon: "users", color: av[1] },
      { id: "b3", t: "대회 참가", v: "19%", icon: "trophy", color: av[2] },
      { id: "b4", t: "팀 운영", v: "12%", icon: "shield", color: av[3] },
      { id: "b5", t: "커뮤니티", v: "8%", icon: "message-square", color: av[4] },
    ],
  };

  // ── 요금제 포함 기능 카탈로그 (요금제 편집기에서 토글) ──
  const FEAT_CATALOG = [
    { k: "match", label: "기본 매칭" },
    { k: "priority", label: "우선 매칭" },
    { k: "court", label: "코트 예약" },
    { k: "courtDiscount", label: "코트 예약 할인" },
    { k: "stats", label: "상세 통계" },
    { k: "adfree", label: "광고 제거" },
    { k: "team", label: "팀 운영 도구" },
    { k: "settle", label: "정산 관리" },
    { k: "tournDiscount", label: "대회 참가비 할인" },
    { k: "support", label: "전용 지원" },
  ];
  const PLAN_ON = {
    basic: ["match", "court"],
    premium: ["match", "priority", "court", "stats", "adfree"],
    pro: ["match", "priority", "court", "courtDiscount", "stats", "adfree", "team", "settle", "tournDiscount"],
    ent: FEAT_CATALOG.map(f => f.k),
  };
  const PLAN_FEATS = (key) => FEAT_CATALOG.map(f => ({ k: f.k, label: f.label, on: PLAN_ON[key].includes(f.k) }));

  // ── 페이지 스키마 (테이블형) ──
  // type: title|badge|mono|muted|avatar|status|actions|tags
  const T = (page, head, sub, addLabel, cols, rows) => ({ page, head, sub, addLabel, cols, rows });

  window.BO_PAGES = {
    users: T("users", "사용자 관리", "전체 회원 계정을 조회·관리합니다.", "회원 초대",
      [
        { key: "user", label: "회원", w: "minmax(0,1.8fr)", type: "avatar" },
        { key: "region", label: "지역", w: "minmax(0,1fr)", type: "muted" },
        { key: "teams", label: "소속팀", w: "84px", align: "center", type: "mono" },
        { key: "joined", label: "가입일", w: "minmax(0,1fr)", type: "mono" },
        { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
        { key: "act", label: "", w: "76px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "김도윤", sub: "dy.kim@mybdr.kr", color: av[0], region: "서울 강남", teams: "2팀", joined: "2025.03.11", badge: "활성", tone: "ok" },
        { id: 2, name: "이서준", sub: "sjlee@mybdr.kr", color: av[1], region: "경기 성남", teams: "1팀", joined: "2025.05.02", badge: "활성", tone: "ok" },
        { id: 3, name: "박지호", sub: "jh.park@mybdr.kr", color: av[2], region: "인천 부평", teams: "3팀", joined: "2024.11.20", badge: "활성", tone: "ok" },
        { id: 4, name: "최민재", sub: "mj.choi@mybdr.kr", color: av[3], region: "서울 송파", teams: "0팀", joined: "2026.01.08", badge: "휴면", tone: "grey" },
        { id: 5, name: "정하준", sub: "hj.jung@mybdr.kr", color: av[4], region: "부산 해운대", teams: "1팀", joined: "2025.08.17", badge: "정지", tone: "danger" },
        { id: 6, name: "강시우", sub: "sw.kang@mybdr.kr", color: av[5], region: "대구 수성", teams: "2팀", joined: "2025.12.30", badge: "활성", tone: "ok" },
      ]),

    teams: T("teams", "팀 관리", "등록된 모든 팀을 관리합니다.", "팀 등록",
      [
        { key: "team", label: "팀", w: "minmax(0,1.8fr)", type: "avatar" },
        { key: "region", label: "활동 지역", w: "minmax(0,1fr)", type: "muted" },
        { key: "members", label: "선수", w: "84px", align: "center", type: "mono" },
        { key: "rating", label: "전력", w: "92px", align: "center", type: "badge" },
        { key: "status", label: "상태", w: "96px", align: "center", type: "status" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "송파 불스", sub: "창단 2023 · 5x5", color: av[0], region: "서울 송파", members: "9명", badge: "상위 10%", tone: "primary", st: "운영중", sttone: "ok" },
        { id: 2, name: "마포 레이커스", sub: "창단 2022 · 5x5", color: av[1], region: "서울 마포", members: "11명", badge: "상위 25%", tone: "ok", st: "운영중", sttone: "ok" },
        { id: 3, name: "성동 썬더", sub: "창단 2024 · 3x3", color: av[2], region: "서울 성동", members: "6명", badge: "신규", tone: "warn", st: "운영중", sttone: "ok" },
        { id: 4, name: "용산 워리어스", sub: "창단 2021 · 5x5", color: av[3], region: "서울 용산", members: "8명", badge: "상위 25%", tone: "ok", st: "휴면", sttone: "mute" },
        { id: 5, name: "노원 클리퍼스", sub: "창단 2023 · 3x3", color: av[4], region: "서울 노원", members: "7명", badge: "일반", tone: "grey", st: "운영중", sttone: "ok" },
      ]),

    organizations: T("organizations", "단체 관리", "주최 단체·협회·동호회의 인증과 권한을 관리합니다.", "단체 등록",
      [
        { key: "org", label: "단체", w: "minmax(0,1.8fr)", type: "avatar" },
        { key: "type", label: "유형", w: "minmax(0,1fr)", type: "muted" },
        { key: "tourn", label: "대회", w: "84px", align: "center", type: "mono" },
        { key: "verified", label: "인증", w: "100px", align: "center", type: "badge" },
        { key: "act", label: "", w: "76px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "BDR 농구문화", sub: "사업자 등록 완료", color: av[0], type: "정식 주최사", tourn: "12개", badge: "인증됨", tone: "primary" },
        { id: 2, name: "한강 스포츠클럽", sub: "제휴 계약 2025", color: av[1], type: "제휴 단체", tourn: "4개", badge: "인증됨", tone: "primary" },
        { id: 3, name: "인천농구협회", sub: "지역 협회", color: av[2], type: "지역 협회", tourn: "7개", badge: "인증됨", tone: "primary" },
        { id: 4, name: "강남 바스켓 크루", sub: "인증 요청 검토중", color: av[3], type: "동호회", tourn: "2개", badge: "대기", tone: "warn" },
      ]),

    tournaments: T("tournaments", "대회 관리(운영)", "플랫폼 전체 대회를 운영 관점에서 모니터링합니다.", null,
      [
        { key: "name", label: "대회", w: "minmax(0,2fr)", type: "title" },
        { key: "org", label: "주최", w: "minmax(0,1.2fr)", type: "muted" },
        { key: "teams", label: "참가팀", w: "84px", align: "center", type: "mono" },
        { key: "revenue", label: "참가비 수납", w: "minmax(0,1fr)", type: "mono" },
        { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
      ],
      [
        { id: 1, name: "BDR 서머 오픈 #4", sub: "2026.06.15", org: "BDR 농구문화", teams: "44팀", revenue: "₩7.6M", badge: "진행중", tone: "ok" },
        { id: 2, name: "한강 3x3 페스타", sub: "2026.07.02", org: "한강 스포츠클럽", teams: "21팀", revenue: "₩3.2M", badge: "접수중", tone: "primary" },
        { id: 3, name: "U18 윈터컵", sub: "2026.07.20", org: "BDR 농구문화", teams: "12팀", revenue: "₩1.4M", badge: "준비중", tone: "warn" },
        { id: 4, name: "BDR 스프링 리그", sub: "2026.05.10", org: "BDR 농구문화", teams: "44팀", revenue: "₩9.9M", badge: "종료", tone: "grey" },
      ]),

    games: T("games", "경기 관리", "픽업·매칭 게임을 모니터링합니다.", null,
      [
        { key: "name", label: "경기", w: "minmax(0,2fr)", type: "title" },
        { key: "court", label: "코트", w: "minmax(0,1.2fr)", type: "muted" },
        { key: "players", label: "인원", w: "92px", align: "center", type: "mono" },
        { key: "when", label: "일시", w: "minmax(0,1fr)", type: "mono" },
        { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
      ],
      [
        { id: 1, name: "강남 5x5 픽업", sub: "호스트 김도윤", court: "강남 스포츠센터", players: "10/10", when: "06.27 19:00", badge: "모집완료", tone: "ok" },
        { id: 2, name: "송파 3x3 번개", sub: "호스트 박지호", court: "올림픽공원 코트", players: "4/6", when: "06.27 20:30", badge: "모집중", tone: "primary" },
        { id: 3, name: "마포 게스트 게임", sub: "호스트 마포 레이커스", court: "망원 한강 코트", players: "8/10", when: "06.28 10:00", badge: "모집중", tone: "primary" },
        { id: 4, name: "용산 야간 픽업", sub: "호스트 이서준", court: "용산 실내체육관", players: "10/10", when: "06.26 21:00", badge: "종료", tone: "grey" },
      ]),

    "game-reports": T("game-reports", "경기 리포트", "제출된 경기 결과·기록과 신고를 검수합니다.", null,
      [
        { key: "name", label: "경기", w: "minmax(0,2fr)", type: "title" },
        { key: "score", label: "스코어", w: "110px", align: "center", type: "mono" },
        { key: "recorder", label: "기록원", w: "minmax(0,1fr)", type: "muted" },
        { key: "flag", label: "신고", w: "84px", align: "center", type: "mono" },
        { key: "status", label: "검수", w: "100px", align: "center", type: "badge" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "송파 불스 대 마포 레이커스", sub: "BDR 서머 오픈 · A조 1경기", score: "68 : 61", recorder: "정하준", flag: "0", badge: "승인", tone: "ok" },
        { id: 2, name: "용산 워리어스 대 성동 썬더", sub: "BDR 서머 오픈 · A조 3경기", score: "55 : 55", recorder: "강시우", flag: "2", badge: "검수중", tone: "warn" },
        { id: 3, name: "노원 클리퍼스 대 은평 제트", sub: "BDR 서머 오픈 · B조 2경기", score: "72 : 49", recorder: "김도윤", flag: "1", badge: "보류", tone: "danger" },
      ]),

    courts: T("courts", "코트 관리", "등록된 코트와 예약 가능 시설을 관리합니다.", "코트 등록",
      [
        { key: "court", label: "코트", w: "minmax(0,1.8fr)", type: "avatar" },
        { key: "region", label: "지역", w: "minmax(0,1fr)", type: "muted" },
        { key: "type", label: "유형", w: "100px", align: "center", type: "badge" },
        { key: "bookings", label: "월 예약", w: "92px", align: "center", type: "mono" },
        { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "장충체육관", sub: "실내 · 5면", color: av[0], region: "서울 중구", badge: "실내", tone: "primary", bookings: "82", st: "운영중", sttone: "ok" },
        { id: 2, name: "올림픽공원 코트", sub: "야외 · 3면", color: av[1], region: "서울 송파", badge: "야외", tone: "ok", bookings: "140", st: "운영중", sttone: "ok" },
        { id: 3, name: "망원 한강 코트", sub: "야외 · 2면", color: av[2], region: "서울 마포", badge: "야외", tone: "ok", bookings: "96", st: "운영중", sttone: "ok" },
        { id: 4, name: "고양체육관", sub: "실내 · 4면", color: av[3], region: "경기 고양", badge: "실내", tone: "primary", bookings: "38", st: "점검중", sttone: "warn" },
      ]),

    partners: T("partners", "협력업체 관리", "시설 제공·후원 협력업체를 관리합니다.", "업체 등록",
      [
        { key: "org", label: "업체", w: "minmax(0,1.8fr)", type: "avatar" },
        { key: "type", label: "유형", w: "minmax(0,1fr)", type: "muted" },
        { key: "venues", label: "시설", w: "84px", align: "center", type: "mono" },
        { key: "status", label: "계약", w: "100px", align: "center", type: "badge" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "스포클 시설관리", sub: "코트 6면 제공", color: av[0], type: "시설 파트너", venues: "6", badge: "계약중", tone: "ok" },
        { id: 2, name: "윌슨 코리아", sub: "공인구 후원", color: av[1], type: "용품 후원", venues: "0", badge: "계약중", tone: "ok" },
        { id: 3, name: "한강사업본부", sub: "야외 코트 임대", color: av[2], type: "시설 파트너", venues: "3", badge: "갱신예정", tone: "warn" },
      ]),

    campaigns: T("campaigns", "캠페인 관리", "프로모션·배너 캠페인을 운영합니다.", "캠페인 생성",
      [
        { key: "name", label: "캠페인", w: "minmax(0,2fr)", type: "title" },
        { key: "period", label: "기간", w: "minmax(0,1.4fr)", type: "mono" },
        { key: "ctr", label: "클릭률", w: "92px", align: "center", type: "mono" },
        { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "여름 코트 예약 50% 할인", sub: "메인 배너 · 푸시", period: "06.01 ~ 06.30", ctr: "4.2%", badge: "진행중", tone: "ok" },
        { id: 2, name: "신규 가입 첫 게임 무료", sub: "온보딩 배너", period: "상시", ctr: "6.8%", badge: "진행중", tone: "ok" },
        { id: 3, name: "BDR 서머 오픈 모집", sub: "대회 홍보", period: "05.10 ~ 06.10", ctr: "3.1%", badge: "종료", tone: "grey" },
      ]),

    payments: T("payments", "결제 관리", "참가비·예약 결제와 환불을 처리합니다.", null,
      [
        { key: "name", label: "내역", w: "minmax(0,1.8fr)", type: "title" },
        { key: "method", label: "수단", w: "minmax(0,1fr)", type: "muted" },
        { key: "amount", label: "금액", w: "120px", align: "right", type: "mono" },
        { key: "date", label: "일시", w: "minmax(0,1fr)", type: "mono" },
        { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "BDR 서머 오픈 참가비", sub: "송파 불스", method: "계좌이체", amount: "₩200,000", date: "06.26 14:20", badge: "완료", tone: "ok", txid: "TX-20260626-0042", gateway: "토스페이먼츠" },
        { id: 2, name: "코트 예약 결제", sub: "김도윤", method: "카드", amount: "₩45,000", date: "06.26 11:08", badge: "완료", tone: "ok", txid: "TX-20260626-0031", gateway: "토스페이먼츠" },
        { id: 3, name: "참가비 환불 요청", sub: "성동 썬더", method: "계좌이체", amount: "-₩200,000", date: "06.25 18:40", badge: "환불대기", tone: "warn", txid: "TX-20260625-0188", gateway: "토스페이먼츠" },
        { id: 4, name: "프리미엄 구독 결제", sub: "마포 레이커스", method: "카드", amount: "₩19,900", date: "06.25 09:30", badge: "완료", tone: "ok", txid: "TX-20260625-0090", gateway: "토스페이먼츠" },
        { id: 5, name: "코트 예약 결제 실패", sub: "이서준", method: "카드", amount: "₩30,000", date: "06.24 20:15", badge: "실패", tone: "danger", txid: "TX-20260624-0205", gateway: "토스페이먼츠" },
      ]),

    plans: T("plans", "요금제 관리", "구독 요금제와 가입자 현황을 관리합니다.", "요금제 추가",
      [
        { key: "name", label: "요금제", w: "minmax(0,1.8fr)", type: "title" },
        { key: "price", label: "월 요금", w: "120px", align: "right", type: "mono" },
        { key: "subs", label: "가입자", w: "100px", align: "center", type: "mono" },
        { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "베이직", sub: "기본 매칭 · 코트 예약", price: "무료", subs: "10,420", st: "운영중", sttone: "ok", features: PLAN_FEATS("basic") },
        { id: 2, name: "프리미엄", sub: "우선 매칭 · 통계 · 광고 제거", price: "₩9,900", subs: "1,840", st: "운영중", sttone: "ok", features: PLAN_FEATS("premium") },
        { id: 3, name: "팀 프로", sub: "팀 운영 · 대회 할인 · 정산", price: "₩19,900", subs: "320", st: "운영중", sttone: "ok", features: PLAN_FEATS("pro") },
        { id: 4, name: "단체 엔터프라이즈", sub: "협회·주최사 전용", price: "협의", subs: "12", st: "비공개", sttone: "mute", features: PLAN_FEATS("ent") },
      ]),

    community: T("community", "커뮤니티 관리", "게시글·댓글과 신고 콘텐츠를 관리합니다.", null,
      [
        { key: "name", label: "게시글", w: "minmax(0,2.2fr)", type: "title" },
        { key: "board", label: "게시판", w: "minmax(0,1fr)", type: "muted" },
        { key: "engage", label: "반응", w: "110px", align: "center", type: "mono" },
        { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "이번 주말 강남 코트 같이 뛰실 분", sub: "김도윤 · 2시간 전", board: "팀원 모집", engage: "♡ 24 · 💬 12", badge: "정상", tone: "ok" },
        { id: 2, name: "3x3 룰 질문있습니다", sub: "이서준 · 5시간 전", board: "자유게시판", engage: "♡ 8 · 💬 6", badge: "정상", tone: "ok" },
        { id: 3, name: "[신고] 비방성 댓글 포함", sub: "익명 · 어제", board: "자유게시판", engage: "🚩 3", badge: "신고", tone: "danger" },
      ]),

    suggestions: T("suggestions", "제안 관리", "사용자 기능 제안·피드백을 관리합니다.", null,
      [
        { key: "name", label: "제안", w: "minmax(0,2.2fr)", type: "title" },
        { key: "votes", label: "추천", w: "92px", align: "center", type: "mono" },
        { key: "category", label: "분류", w: "minmax(0,1fr)", type: "badge" },
        { key: "status", label: "상태", w: "100px", align: "center", type: "status" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "경기 영상 하이라이트 자동 생성", sub: "박지호 외 142명", votes: "142", badge: "기능", tone: "primary", st: "검토중", sttone: "warn" },
        { id: 2, name: "팀 캘린더 구글 연동", sub: "최민재 외 88명", votes: "88", badge: "연동", tone: "ok", st: "예정", sttone: "ok" },
        { id: 3, name: "심판 평점 시스템", sub: "강시우 외 56명", votes: "56", badge: "기능", tone: "primary", st: "접수", sttone: "mute" },
        { id: 4, name: "다크모드 코트맵", sub: "정하준 외 31명", votes: "31", badge: "UI", tone: "grey", st: "완료", sttone: "ok" },
      ]),

    notifications: T("notifications", "알림 관리", "발송된 푸시·시스템 알림을 관리합니다.", "알림 발송",
      [
        { key: "name", label: "알림", w: "minmax(0,2.2fr)", type: "title" },
        { key: "channel", label: "채널", w: "100px", align: "center", type: "badge" },
        { key: "reach", label: "도달", w: "100px", align: "center", type: "mono" },
        { key: "date", label: "발송", w: "minmax(0,1fr)", type: "mono" },
        { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
      ],
      [
        { id: 1, name: "BDR 서머 오픈 접수 마감 D-3", sub: "대회 참가자 대상", badge: "푸시", tone: "primary", reach: "1,240", date: "06.26 09:00", st: "발송완료", sttone: "ok" },
        { id: 2, name: "여름 코트 예약 할인 안내", sub: "전체 회원", badge: "푸시", tone: "primary", reach: "12,840", date: "06.25 18:00", st: "발송완료", sttone: "ok" },
        { id: 3, name: "정기 점검 안내 (06.30 02:00)", sub: "전체 회원", badge: "시스템", tone: "grey", reach: "-", date: "예약됨", st: "예약", sttone: "warn" },
      ]),

    logs: T("logs", "활동 로그", "관리자 작업과 시스템 이벤트 기록입니다.", null,
      [
        { key: "name", label: "이벤트", w: "minmax(0,2.4fr)", type: "title" },
        { key: "actor", label: "수행자", w: "minmax(0,1fr)", type: "muted" },
        { key: "level", label: "레벨", w: "92px", align: "center", type: "badge" },
        { key: "time", label: "시각", w: "minmax(0,1.1fr)", type: "mono" },
      ],
      [
        { id: 1, name: "사용자 계정 정지 — 정하준", sub: "사유: 약관 위반 신고 누적", actor: "관리자 K", badge: "경고", tone: "warn", time: "06.26 15:02:11" },
        { id: 2, name: "환불 승인 — ₩200,000", sub: "성동 썬더 참가비", actor: "관리자 L", badge: "정보", tone: "primary", time: "06.26 14:48:30" },
        { id: 3, name: "대회 생성 — U18 윈터컵", actor: "BDR 농구문화", sub: "", badge: "정보", tone: "primary", time: "06.26 11:20:05" },
        { id: 4, name: "결제 실패 감지 — 카드 거절", sub: "이서준 코트 예약", actor: "시스템", badge: "오류", tone: "danger", time: "06.24 20:15:44" },
      ]),
  };

  // ── 진입점 연결: 행 클릭 → 실제 관리자 페이지 이동 ──
  // ── 매칭 콘솔 신규 스키마 (게스트 / 픽업 / 연습경기) ──
  window.BO_PAGES.guest = T("guest", "게스트 모집", "팀이 올린 게스트 모집 공고를 관리합니다.", null,
    [
      { key: "name", label: "모집 공고", w: "minmax(0,2fr)", type: "title" },
      { key: "team", label: "모집 팀", w: "minmax(0,1.2fr)", type: "muted" },
      { key: "pos", label: "포지션", w: "100px", align: "center", type: "muted" },
      { key: "when", label: "경기 일시", w: "minmax(0,1fr)", type: "mono" },
      { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
    ],
    [
      { id: 1, name: "주말 리그 가드 1명 급구", sub: "실력 D3 이상 · 송파 불스", pos: "가드", team: "송파 불스", when: "06.29 14:00", badge: "모집중", tone: "ok" },
      { id: 2, name: "센터 게스트 구합니다", sub: "친선 경기 · 마포 레이커스", pos: "센터", team: "마포 레이커스", when: "06.30 19:00", badge: "모집중", tone: "ok" },
      { id: 3, name: "포워드 2명 (매너 우대)", sub: "정기전 · 용산 워리어스", pos: "포워드", team: "용산 워리어스", when: "07.02 20:00", badge: "마감", tone: "grey" },
    ]);

  window.BO_PAGES.pickup = T("pickup", "픽업 게임", "개인 단위로 모이는 픽업 게임을 관리합니다.", null,
    [
      { key: "name", label: "픽업 게임", w: "minmax(0,2fr)", type: "title" },
      { key: "court", label: "코트", w: "minmax(0,1.2fr)", type: "muted" },
      { key: "players", label: "인원", w: "92px", align: "center", type: "mono" },
      { key: "when", label: "일시", w: "minmax(0,1fr)", type: "mono" },
      { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
    ],
    [
      { id: 1, name: "강남 5x5 픽업", sub: "호스트 김도윤", court: "강남 스포츠센터", players: "10/10", when: "06.27 19:00", badge: "모집완료", tone: "ok" },
      { id: 2, name: "송파 3x3 번개", sub: "호스트 박지호", court: "올림픽공원 코트", players: "4/6", when: "06.27 20:30", badge: "모집중", tone: "primary" },
      { id: 3, name: "용산 야간 픽업", sub: "호스트 이서준", court: "용산 실내체육관", players: "10/10", when: "06.26 21:00", badge: "종료", tone: "grey" },
    ]);

  window.BO_PAGES.scrim = T("scrim", "연습 경기", "팀 간 연습 경기(스크림) 매칭을 관리합니다.", null,
    [
      { key: "name", label: "연습 경기", w: "minmax(0,2fr)", type: "title" },
      { key: "court", label: "코트", w: "minmax(0,1.2fr)", type: "muted" },
      { key: "level", label: "수준", w: "92px", align: "center", type: "muted" },
      { key: "when", label: "일시", w: "minmax(0,1fr)", type: "mono" },
      { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
    ],
    [
      { id: 1, name: "송파 불스 vs 마포 레이커스", sub: "5x5 풀코트", court: "장충체육관", level: "상급", when: "06.28 15:00", badge: "확정", tone: "ok" },
      { id: 2, name: "성동 썬더 상대팀 구함", sub: "5x5 친선", court: "미정", level: "중급", when: "07.01 19:00", badge: "매칭중", tone: "primary" },
      { id: 3, name: "강남 새벽 크루 vs 직장인 농구회", sub: "3x3", court: "올림픽공원 코트", level: "중급", when: "06.25 06:30", badge: "종료", tone: "grey" },
    ]);

  // ── 코트 콘솔 (실내 / 야외 / 제휴) ──
  const _court = (page, head, sub, rows) => T(page, head, sub, "코트 등록",
    [
      { key: "court", label: "코트", w: "minmax(0,1.8fr)", type: "avatar" },
      { key: "region", label: "지역", w: "minmax(0,1fr)", type: "muted" },
      { key: "bookings", label: "월 예약", w: "92px", align: "center", type: "mono" },
      { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
      { key: "act", label: "", w: "60px", align: "right", type: "actions" },
    ], rows);
  window.BO_PAGES["court-indoor"] = _court("court-indoor", "실내 코트", "실내 체육관·전용 코트를 관리합니다.", [
    { id: 1, name: "장충체육관", sub: "실내 · 5면", color: av[0], region: "서울 중구", bookings: "82", st: "운영중", sttone: "ok" },
    { id: 2, name: "용산 실내체육관", sub: "실내 · 3면", color: av[4], region: "서울 용산", bookings: "61", st: "운영중", sttone: "ok" },
    { id: 3, name: "고양체육관", sub: "실내 · 4면", color: av[3], region: "경기 고양", bookings: "38", st: "점검중", sttone: "warn" },
  ]);
  window.BO_PAGES["court-outdoor"] = _court("court-outdoor", "야외 코트", "야외·공원 농구 코트를 관리합니다.", [
    { id: 1, name: "올림픽공원 코트", sub: "야외 · 3면", color: av[1], region: "서울 송파", bookings: "140", st: "운영중", sttone: "ok" },
    { id: 2, name: "망원 한강 코트", sub: "야외 · 2면", color: av[2], region: "서울 마포", bookings: "96", st: "운영중", sttone: "ok" },
    { id: 3, name: "반포 한강 코트", sub: "야외 · 2면", color: av[5], region: "서울 서초", bookings: "88", st: "운영중", sttone: "ok" },
  ]);
  window.BO_PAGES["court-partner"] = _court("court-partner", "제휴 코트", "협력업체가 제공하는 제휴 코트를 관리합니다.", [
    { id: 1, name: "스포클 강남점", sub: "제휴 · 2면", color: av[6], region: "서울 강남", bookings: "120", st: "운영중", sttone: "ok" },
    { id: 2, name: "스포클 분당점", sub: "제휴 · 3면", color: av[7], region: "경기 성남", bookings: "75", st: "운영중", sttone: "ok" },
    { id: 3, name: "한강사업본부 임대코트", sub: "제휴 · 3면", color: av[2], region: "서울 영등포", bookings: "54", st: "갱신예정", sttone: "warn" },
  ]);

  // ── 커뮤니티 콘솔 (게시판별) ──
  const _board = (page, head, name, rows) => T(page, head, `${name} 게시글·댓글과 신고를 관리합니다.`, null,
    [
      { key: "name", label: "게시글", w: "minmax(0,2.4fr)", type: "title" },
      { key: "engage", label: "반응", w: "120px", align: "center", type: "mono" },
      { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
      { key: "act", label: "", w: "60px", align: "right", type: "actions" },
    ], rows);
  window.BO_PAGES["board-free"] = _board("board-free", "자유게시판", "자유게시판의", [
    { id: 1, name: "3x3 룰 질문있습니다", sub: "이서준 · 5시간 전", engage: "♡ 8 · 💬 6", badge: "정상", tone: "ok" },
    { id: 2, name: "[신고] 비방성 댓글 포함", sub: "익명 · 어제", engage: "🚩 3", badge: "신고", tone: "danger" },
    { id: 3, name: "서울 동부 야외 코트 추천", sub: "성동썬더 · 2일 전", engage: "♡ 14 · 💬 9", badge: "정상", tone: "ok" },
  ]);
  window.BO_PAGES["board-recruit"] = _board("board-recruit", "팀원 모집", "팀원 모집 게시판의", [
    { id: 1, name: "이번 주말 강남 코트 같이 뛰실 분", sub: "김도윤 · 2시간 전", engage: "♡ 24 · 💬 12", badge: "정상", tone: "ok" },
    { id: 2, name: "송파 5x5 정기팀 멤버 모집", sub: "박지호 · 6시간 전", engage: "♡ 11 · 💬 7", badge: "정상", tone: "ok" },
  ]);
  window.BO_PAGES["board-review"] = _board("board-review", "후기", "후기 게시판의", [
    { id: 1, name: "스프링 리그 우승 후기 (장문)", sub: "마포불스 · 3일 전", engage: "♡ 52 · 💬 21", badge: "정상", tone: "ok" },
    { id: 2, name: "장충체육관 코트 상태 후기", sub: "용산러버 · 4일 전", engage: "♡ 18 · 💬 5", badge: "정상", tone: "ok" },
  ]);

  // ── 진입점 연결: 행 클릭 → 실제 관리자 페이지 이동 ──
  window.BO_PAGES.tournaments.rowHref = "대회 운영.html";
  window.BO_PAGES.tournaments.sub = "플랫폼 전체 대회를 운영 관점에서 모니터링합니다. 행을 눌러 운영 워크스페이스로 이동합니다.";
  window.BO_PAGES.partners.rowHref = "협력업체 콘솔.html";
  window.BO_PAGES.partners.sub = "시설 제공·후원 협력업체를 관리합니다. 행을 눌러 협력업체 콘솔로 이동합니다.";

  // ── Phase 2 전용 상세 화면 라우팅 (행 클릭 → 셸 내 상세 전환) ──
  window.BO_PAGES.users.detail = "user";
  window.BO_PAGES.users.sub = "전체 회원 계정을 조회·관리합니다. 행을 눌러 회원 상세·계정 관리로 이동합니다.";
  window.BO_PAGES.teams.detail = "team";
  window.BO_PAGES.teams.sub = "등록된 모든 팀을 관리합니다. 행을 눌러 팀 상세·선수 명단으로 이동합니다.";
  window.BO_PAGES.organizations.detail = "org";
  window.BO_PAGES.organizations.sub = "주최 단체·협회·동호회의 인증과 권한을 관리합니다. 행을 눌러 단체 상세·인증 처리로 이동합니다.";
  window.BO_PAGES.payments.detail = "payment";
  window.BO_PAGES.payments.sub = "참가비·예약 결제와 환불을 처리합니다. 행을 눌러 결제 상세·환불 처리로 이동합니다.";
  window.BO_PAGES.plans.detail = "plan";
  window.BO_PAGES.plans.sub = "구독 요금제와 가입자 현황을 관리합니다. 행을 눌러 요금제 편집기로 이동합니다.";

  // 설정(settings) — 폼형, 별도 처리
  window.BO_SETTINGS = [
    { group: "서비스 운영", items: [
      { k: "maintenance", label: "점검 모드", desc: "활성화 시 사용자 접속이 차단됩니다.", on: false, type: "toggle" },
      { k: "signup", label: "신규 가입 허용", desc: "신규 회원 가입을 받습니다.", on: true, type: "toggle" },
      { k: "autoApprove", label: "단체 자동 인증", desc: "사업자 정보 확인 시 자동 인증.", on: false, type: "toggle" },
    ]},
    { group: "결제·정산", items: [
      { k: "fee", label: "플랫폼 수수료", desc: "참가비 결제 시 부과되는 수수료율.", value: "3.5%", type: "value" },
      { k: "payout", label: "정산 주기", desc: "주최사 정산 지급 주기.", value: "주 1회 (월요일)", type: "value" },
      { k: "refundWindow", label: "환불 가능 기간", desc: "대회 시작 며칠 전까지 환불 허용.", value: "7일 전", type: "value" },
    ]},
    { group: "알림", items: [
      { k: "pushReport", label: "신고 즉시 알림", desc: "신고 발생 시 관리자에게 푸시.", on: true, type: "toggle" },
      { k: "weeklyReport", label: "주간 리포트 메일", desc: "운영 지표 요약 메일 발송.", on: true, type: "toggle" },
    ]},
  ];
})();
