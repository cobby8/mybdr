/* global window */
// ============================================================
// hub-data.jsx — 관리자 콘솔 홈(관리자 홈.html) 데이터
//   ▸ 듀얼 사이드바 IA: "콘솔" 항목 = 하위메뉴를 가진 단독 레일 섹션,
//     콘솔이 아닌 단일 항목(관리자 홈/활동 로그/결제/요금제/시스템…) = 그룹.
//   ▸ 대회·심판·협력업체 콘솔은 전용 앱(.html)으로 바로 열기 링크 제공.
//   ▸ 모든 값은 실 데이터 형태를 본뜬 mock (정적 프로토타입).
// ============================================================
(function () {
  const AV = ["var(--primary)", "var(--ok)", "var(--warn)", "#6D5AE6", "var(--danger)"];

  // ── 네비게이션 IA (듀얼 사이드바) ────────────────────────────
  //   { label } = 레일 섹션 시작. 콘솔은 각자 섹션(하위메뉴 패널 전개).
  window.HUB_NAV = [
    { label: "운영", icon: "layout-dashboard" },
    { id: "home", icon: "layout-dashboard", text: "관리자 홈" },
    { id: "logs", icon: "list", text: "활동 로그" },

    { label: "유저 콘솔", icon: "users" },
    { id: "user-members", icon: "user", text: "사용자", badge: 693 },
    { id: "user-teams", icon: "users", text: "팀", badge: 121 },
    { id: "user-orgs", icon: "building-2", text: "단체" },

    { label: "매칭 콘솔", icon: "volleyball" },
    { id: "match-guest", icon: "user-plus", text: "게스트 모집" },
    { id: "match-pickup", icon: "volleyball", text: "픽업게임" },
    { id: "match-scrim", icon: "swords", text: "연습경기" },

    { label: "커뮤니티 콘솔", icon: "message-square" },
    { id: "comm-board", icon: "message-square", text: "게시판" },
    { id: "comm-hot", icon: "flame", text: "인기글" },
    { id: "comm-report", icon: "flag", text: "신고 검토", badge: 3 },
    { id: "comm-news", icon: "newspaper", text: "BDR NEWS" },

    { label: "코트 콘솔", icon: "map-pin" },
    { id: "court-indoor", icon: "building-2", text: "실내코트" },
    { id: "court-outdoor", icon: "map-pin", text: "야외코트" },
    { id: "court-checkin", icon: "check-circle", text: "체크인" },

    { label: "대회 콘솔", icon: "trophy" },
    { id: "tour-dash", icon: "layout-dashboard", text: "대시보드" },
    { id: "tour-list", icon: "trophy", text: "대회 목록", badge: 6 },
    { id: "tour-league", icon: "layers", text: "정규대회" },
    { id: "tour-tpl", icon: "layout-template", text: "템플릿" },

    { label: "심판 콘솔", icon: "gavel" },
    { id: "ref-assign", icon: "clipboard-list", text: "배정", badge: 4 },
    { id: "ref-verify", icon: "shield-check", text: "검증" },
    { id: "ref-grade", icon: "star", text: "등급" },
    { id: "ref-pay", icon: "credit-card", text: "수당 정산" },

    { label: "협력업체 콘솔", icon: "handshake" },
    { id: "partner-fac", icon: "building-2", text: "제휴 시설" },
    { id: "partner-camp", icon: "megaphone", text: "캠페인" },
    { id: "partner-settle", icon: "credit-card", text: "정산" },

    { label: "마케팅 콘솔", icon: "megaphone" },
    { id: "mkt-campaign", icon: "megaphone", text: "광고 캠페인" },
    { id: "mkt-promo", icon: "ticket", text: "프로모션" },
    { id: "mkt-banner", icon: "image", text: "배너 관리" },

    { label: "정산·플랜", icon: "credit-card" },
    { id: "pay", icon: "credit-card", text: "결제", badge: 5 },
    { id: "plans", icon: "layers", text: "요금제" },

    { label: "시스템", icon: "settings-2" },
    { id: "categories", icon: "layout-grid", text: "종별 관리" },
    { id: "awards", icon: "award", text: "시즌 시상" },
    { id: "manner", icon: "scale", text: "매너 평가" },
    { id: "noti", icon: "bell", text: "알림" },
    { id: "settings", icon: "settings", text: "설정" },
    { id: "me", icon: "user", text: "마이페이지" },
    { id: "site", icon: "globe", text: "공개 사이트", ext: "../../MyBDR.html" },
  ];

  // ── 대시보드(관리자 홈) ────────────────────────────────────
  window.HUB_KPI = [
    { icon: "users", value: "693", label: "전체 회원", delta: 8, tone: "primary" },
    { icon: "shield-check", value: "121", label: "활성 팀", delta: 44, tone: "ok" },
    { icon: "building-2", value: "0", label: "인증 대기 단체", tone: "warn" },
    { icon: "user-x", value: "0", label: "정지 회원", tone: "danger" },
  ];
  window.HUB_SIGNUP = [
    { m: "1월", v: 2 }, { m: "2월", v: 3 }, { m: "3월", v: 4 },
    { m: "4월", v: 38 }, { m: "5월", v: 52 }, { m: "6월", v: 6, soft: true },
  ];
  window.HUB_SHORTCUTS = [
    { id: "tour", icon: "trophy", title: "대회 콘솔", sub: "대시보드 · 대회 목록 · 정규대회 · 템플릿", href: "대회 관리자.html" },
    { id: "ref", icon: "gavel", title: "심판 콘솔", sub: "배정 · 검증 · 등급 · 수당 정산", href: "심판 관리자.html" },
    { id: "partner", icon: "handshake", title: "협력업체 콘솔", sub: "제휴 시설 · 캠페인 · 정산", href: "협력업체 콘솔.html" },
  ];

  // ── 콘솔별 하위 페이지 스키마 (SchemaList 재사용) ───────────
  //   ext = { href, label } → 전용 콘솔 앱으로 여는 안내 바.
  const R = (o) => o; // 가독성용 패스스루
  window.HUB_PAGES = {
    // 운영
    logs: {
      head: "활동 로그", sub: "관리자 작업·시스템 이벤트 기록을 확인합니다.", readOnly: true,
      cols: [
        { key: "name", label: "활동", type: "title", w: "minmax(0,2.2fr)" },
        { key: "admin", label: "수행자", type: "muted", w: "minmax(0,1fr)" },
        { key: "st", label: "유형", type: "status", w: "120px", align: "center" },
        { key: "at", label: "시각", type: "mono", w: "150px", align: "right" },
      ],
      rows: [
        R({ name: "단체 인증 승인", sub: "한강 농구문화", admin: "운영자 김", st: "성공", sttone: "ok", at: "방금 전" }),
        R({ name: "게시글 신고 처리", sub: "커뮤니티 · 비방", admin: "운영자 박", st: "처리", sttone: "primary", at: "12분 전" }),
        R({ name: "결제 환불 승인", sub: "U18 윈터컵 참가비", admin: "운영자 이", st: "성공", sttone: "ok", at: "1시간 전" }),
        R({ name: "회원 정지", sub: "노쇼 누적 3회", admin: "운영자 김", st: "경고", sttone: "warn", at: "3시간 전" }),
      ],
    },

    // 유저 콘솔
    "user-members": {
      head: "사용자", sub: "전체 회원 계정과 활동 상태를 관리합니다.", addLabel: "회원 추가",
      cols: [
        { key: "name", label: "회원", type: "avatar", w: "minmax(0,1.8fr)" },
        { key: "lv", label: "레벨", type: "mono", w: "90px", align: "center" },
        { key: "pos", label: "포지션", type: "muted", w: "100px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
        { key: "act", label: "", type: "actions", w: "70px", align: "right" },
      ],
      rows: [
        R({ name: "이수빈", sub: "subin_h", color: AV[0], lv: "Lv.7", pos: "가드", st: "활성", sttone: "ok" }),
        R({ name: "박재훈", sub: "jaehoon", color: AV[1], lv: "Lv.5", pos: "포워드", st: "활성", sttone: "ok" }),
        R({ name: "정민기", sub: "minki_c", color: AV[3], lv: "Lv.6", pos: "센터", st: "본인인증", sttone: "warn" }),
        R({ name: "한도윤", sub: "doyoon", color: AV[2], lv: "Lv.4", pos: "가드", st: "정지", sttone: "danger" }),
      ],
    },
    "user-teams": {
      head: "팀", sub: "등록된 팀과 소속 인원을 관리합니다.", addLabel: "팀 추가",
      cols: [
        { key: "name", label: "팀", type: "avatar", w: "minmax(0,1.8fr)" },
        { key: "members", label: "인원", type: "mono", w: "90px", align: "center" },
        { key: "region", label: "지역", type: "muted", w: "120px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "한강 불스", sub: "정규 운영", color: AV[4], members: "12", region: "서울 마포", st: "활성", sttone: "ok" }),
        R({ name: "강남 호퍼스", sub: "정규 운영", color: AV[0], members: "9", region: "서울 강남", st: "활성", sttone: "ok" }),
        R({ name: "수원 페이서스", sub: "신규", color: AV[1], members: "7", region: "경기 수원", st: "모집중", sttone: "primary" }),
        R({ name: "부산 웨이브", sub: "정규 운영", color: AV[3], members: "11", region: "부산 해운대", st: "활성", sttone: "ok" }),
      ],
    },
    "user-orgs": {
      head: "단체", sub: "주최 단체·협회의 인증과 운영 현황을 관리합니다.", addLabel: "단체 추가",
      cols: [
        { key: "name", label: "단체", type: "title", w: "minmax(0,2fr)" },
        { key: "tournaments", label: "개최 대회", type: "mono", w: "110px", align: "center" },
        { key: "members", label: "소속 회원", type: "mono", w: "110px", align: "center" },
        { key: "st", label: "인증", type: "status", w: "120px", align: "center" },
        { key: "act", label: "", type: "actions", w: "70px", align: "right" },
      ],
      rows: [
        R({ name: "한강 농구문화", sub: "정식 주최사", tournaments: "12", members: "1,840", st: "인증 완료", sttone: "ok" }),
        R({ name: "서울 3x3 협회", sub: "지역 협회", tournaments: "8", members: "920", st: "인증 완료", sttone: "ok" }),
        R({ name: "경기 동호인연합", sub: "제휴 단체", tournaments: "3", members: "410", st: "심사중", sttone: "warn" }),
      ],
    },

    // 매칭 콘솔
    "match-guest": {
      head: "게스트 모집", sub: "게스트 모집 글과 신청 현황을 관리합니다.", readOnly: true,
      cols: [
        { key: "name", label: "모집 글", type: "title", w: "minmax(0,2.4fr)" },
        { key: "apply", label: "신청", type: "mono", w: "90px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
        { key: "at", label: "일시", type: "mono", w: "140px", align: "right" },
      ],
      rows: [
        R({ name: "주말 3x3 게스트 2명", sub: "마포 실내코트", apply: "6", st: "모집중", sttone: "ok", at: "06.29 19:00" }),
        R({ name: "평일 야간 픽업 게스트", sub: "강남 야외코트", apply: "3", st: "마감 임박", sttone: "warn", at: "06.30 21:00" }),
        R({ name: "5:5 풀코트 게스트 4명", sub: "수원 체육관", apply: "8", st: "마감", sttone: "mute", at: "06.28 10:00" }),
      ],
    },
    "match-pickup": {
      head: "픽업게임", sub: "픽업게임 매칭과 진행 상태를 관리합니다.", readOnly: true,
      cols: [
        { key: "name", label: "경기", type: "title", w: "minmax(0,2.4fr)" },
        { key: "players", label: "참여", type: "mono", w: "90px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
        { key: "at", label: "일시", type: "mono", w: "140px", align: "right" },
      ],
      rows: [
        R({ name: "한강 픽업 5:5", sub: "마포 농구장", players: "10/10", st: "진행중", sttone: "ok" }),
        R({ name: "강남 하프코트 3:3", sub: "강남 야외코트", players: "5/6", st: "모집중", sttone: "primary" }),
        R({ name: "분당 픽업 4:4", sub: "분당 체육관", players: "8/8", st: "종료", sttone: "mute" }),
      ],
    },
    "match-scrim": {
      head: "연습경기", sub: "팀 간 연습경기(스크림) 매칭을 관리합니다.", readOnly: true,
      cols: [
        { key: "name", label: "매치", type: "title", w: "minmax(0,2.6fr)" },
        { key: "st", label: "상태", type: "status", w: "120px", align: "center" },
        { key: "at", label: "일시", type: "mono", w: "150px", align: "right" },
      ],
      rows: [
        R({ name: "한강 불스 vs 강남 호퍼스", sub: "5:5 풀코트", st: "확정", sttone: "ok", at: "07.05 14:00" }),
        R({ name: "수원 페이서스 vs 부산 웨이브", sub: "5:5 풀코트", st: "조율중", sttone: "warn", at: "미정" }),
      ],
    },

    // 커뮤니티 콘솔
    "comm-board": {
      head: "게시판", sub: "전체 게시판 글을 검토하고 관리합니다.", readOnly: true,
      cols: [
        { key: "name", label: "제목", type: "title", w: "minmax(0,2.6fr)" },
        { key: "board", label: "게시판", type: "muted", w: "120px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
        { key: "at", label: "작성", type: "mono", w: "130px", align: "right" },
      ],
      rows: [
        R({ name: "주말 코트 추천 부탁드려요", sub: "doyoon", board: "자유", st: "공개", sttone: "ok", at: "06.30 09:12" }),
        R({ name: "중고 농구화 판매합니다", sub: "minki_c", board: "장터", st: "공개", sttone: "ok", at: "06.29 22:40" }),
        R({ name: "심판 배정 관련 문의", sub: "subin_h", board: "질문", st: "검토중", sttone: "warn", at: "06.29 18:03" }),
      ],
    },
    "comm-hot": {
      head: "인기글", sub: "조회·추천 상위 게시글을 관리합니다.", readOnly: true,
      cols: [
        { key: "name", label: "제목", type: "title", w: "minmax(0,2.8fr)" },
        { key: "views", label: "조회", type: "mono", w: "90px", align: "center" },
        { key: "likes", label: "추천", type: "mono", w: "90px", align: "center" },
        { key: "board", label: "게시판", type: "muted", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "3x3 룰 완벽 정리 (2026 개정)", views: "12,408", likes: "842", board: "정보" }),
        R({ name: "초보가 알아야 할 픽업 매너", views: "9,120", likes: "611", board: "자유" }),
        R({ name: "전국 야외코트 지도 모음", views: "7,650", likes: "498", board: "정보" }),
      ],
    },
    "comm-report": {
      head: "신고 검토", sub: "신고된 글·댓글·사용자를 검토하고 조치합니다.", readOnly: true,
      cols: [
        { key: "name", label: "신고 대상", type: "title", w: "minmax(0,2.4fr)" },
        { key: "reason", label: "사유", type: "muted", w: "130px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
        { key: "act", label: "", type: "actions", w: "70px", align: "right" },
      ],
      rows: [
        R({ name: "댓글: 비방성 표현", sub: "자유게시판", reason: "욕설·비방", st: "대기", sttone: "danger" }),
        R({ name: "게시글: 광고 도배", sub: "장터", reason: "스팸", st: "대기", sttone: "warn" }),
        R({ name: "사용자: 반복 노쇼", sub: "matcher_99", reason: "약속 불이행", st: "대기", sttone: "warn" }),
      ],
    },
    "comm-news": {
      head: "BDR NEWS", sub: "공식 뉴스·매거진 기사를 발행하고 관리합니다.", addLabel: "기사 작성",
      cols: [
        { key: "name", label: "기사", type: "title", w: "minmax(0,2.6fr)" },
        { key: "cat", label: "분류", type: "muted", w: "120px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
        { key: "at", label: "발행", type: "mono", w: "130px", align: "right" },
      ],
      rows: [
        R({ name: "2026 상반기 매칭 리포트", cat: "리포트", st: "발행", sttone: "ok", at: "06.25" }),
        R({ name: "U18 윈터컵 프리뷰", cat: "대회", st: "예약", sttone: "primary", at: "07.02" }),
        R({ name: "이달의 코트: 한강 농구장", cat: "코트", st: "초안", sttone: "mute", at: "—" }),
      ],
    },

    // 코트 콘솔
    "court-indoor": {
      head: "실내코트", sub: "제휴 실내 체육관·코트를 관리합니다.", addLabel: "코트 추가",
      cols: [
        { key: "name", label: "코트", type: "title", w: "minmax(0,2.2fr)" },
        { key: "region", label: "지역", type: "muted", w: "120px", align: "center" },
        { key: "fee", label: "시간당", type: "money", w: "110px", align: "right" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "마포 실내체육관", sub: "풀코트 1면", region: "서울 마포", fee: "₩40,000", st: "운영", sttone: "ok" }),
        R({ name: "강남 스포츠센터", sub: "하프코트 2면", region: "서울 강남", fee: "₩55,000", st: "운영", sttone: "ok" }),
        R({ name: "수원 실내코트", sub: "풀코트 1면", region: "경기 수원", fee: "₩35,000", st: "점검", sttone: "warn" }),
      ],
    },
    "court-outdoor": {
      head: "야외코트", sub: "야외 농구장 정보와 체크인 현황을 관리합니다.", addLabel: "코트 추가",
      cols: [
        { key: "name", label: "코트", type: "title", w: "minmax(0,2.4fr)" },
        { key: "region", label: "지역", type: "muted", w: "130px", align: "center" },
        { key: "courts", label: "면수", type: "mono", w: "90px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "한강 농구장", sub: "무료 개방", region: "서울 마포", courts: "4", st: "운영", sttone: "ok" }),
        R({ name: "양재천 코트", sub: "무료 개방", region: "서울 강남", courts: "2", st: "운영", sttone: "ok" }),
        R({ name: "해운대 비치코트", sub: "무료 개방", region: "부산 해운대", courts: "3", st: "운영", sttone: "ok" }),
      ],
    },
    "court-checkin": {
      head: "체크인", sub: "코트 체크인 기록과 실시간 혼잡도를 확인합니다.", readOnly: true,
      cols: [
        { key: "name", label: "코트", type: "title", w: "minmax(0,2.2fr)" },
        { key: "now", label: "현재", type: "mono", w: "100px", align: "center" },
        { key: "today", label: "오늘 누적", type: "mono", w: "110px", align: "center" },
        { key: "st", label: "혼잡도", type: "status", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "한강 농구장", now: "18명", today: "64", st: "혼잡", sttone: "danger" }),
        R({ name: "양재천 코트", now: "6명", today: "22", st: "여유", sttone: "ok" }),
        R({ name: "마포 실내체육관", now: "10명", today: "31", st: "보통", sttone: "warn" }),
      ],
    },

    // 대회 콘솔 (전용 앱 정합)
    "tour-dash": {
      head: "대회 대시보드", sub: "대회 운영 현황을 요약합니다. 전용 콘솔에서 상세 운영이 가능합니다.",
      ext: { href: "대회 관리자.html", label: "대회 콘솔 열기" }, readOnly: true,
      cols: [
        { key: "name", label: "대회", type: "title", w: "minmax(0,2.4fr)" },
        { key: "teams", label: "참가팀", type: "mono", w: "100px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
        { key: "at", label: "개최일", type: "mono", w: "130px", align: "right" },
      ],
      rows: [
        R({ name: "U18 윈터컵", sub: "한강 농구문화", teams: "16", st: "접수중", sttone: "ok", at: "07.20" }),
        R({ name: "한강 3x3 페스타", sub: "서울 3x3 협회", teams: "24", st: "진행중", sttone: "primary", at: "06.30" }),
      ],
    },
    "tour-list": {
      head: "대회 목록", sub: "등록된 모든 대회를 관리합니다.",
      ext: { href: "대회 관리자.html", label: "대회 콘솔 열기" }, addLabel: "대회 만들기",
      cols: [
        { key: "name", label: "대회명", type: "title", w: "minmax(0,2.4fr)" },
        { key: "venue", label: "장소", type: "muted", w: "minmax(0,1.2fr)" },
        { key: "teams", label: "참가팀", type: "mono", w: "90px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
        { key: "act", label: "", type: "actions", w: "70px", align: "right" },
      ],
      rows: [
        R({ name: "U18 윈터컵", sub: "U18 · 토너먼트", venue: "마포 실내체육관", teams: "16", st: "접수중", sttone: "ok" }),
        R({ name: "한강 3x3 페스타", sub: "오픈 · 3x3", venue: "한강 농구장", teams: "24", st: "진행중", sttone: "primary" }),
        R({ name: "강남 오픈리그", sub: "오픈 · 리그", venue: "강남 스포츠센터", teams: "12", st: "종료", sttone: "mute" }),
      ],
    },
    "tour-league": {
      head: "정규대회", sub: "시즌제 정규 리그·시리즈를 관리합니다.",
      ext: { href: "대회 관리자.html", label: "대회 콘솔 열기" }, addLabel: "시리즈 추가",
      cols: [
        { key: "name", label: "시리즈", type: "title", w: "minmax(0,2.2fr)" },
        { key: "cadence", label: "주기", type: "muted", w: "100px", align: "center" },
        { key: "editions", label: "회차", type: "mono", w: "80px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "BDR 오픈 시리즈", cadence: "분기", editions: "4", st: "운영중", sttone: "ok" }),
        R({ name: "수도권 윈터리그", cadence: "시즌", editions: "2", st: "운영중", sttone: "ok" }),
      ],
    },
    "tour-tpl": {
      head: "템플릿", sub: "대회 생성 템플릿(대진·종별)을 관리합니다.",
      ext: { href: "대회 관리자.html", label: "대회 콘솔 열기" }, addLabel: "템플릿 추가",
      cols: [
        { key: "name", label: "템플릿", type: "title", w: "minmax(0,2.6fr)" },
        { key: "format", label: "포맷", type: "muted", w: "minmax(0,1.2fr)" },
        { key: "used", label: "사용", type: "mono", w: "90px", align: "center" },
      ],
      rows: [
        R({ name: "3x3 오픈 토너먼트", sub: "조별+토너먼트 · 4종별", format: "조별리그+토너먼트", used: "12" }),
        R({ name: "5:5 풀리그", sub: "단일 리그", format: "풀리그", used: "5" }),
      ],
    },

    // 심판 콘솔
    "ref-assign": {
      head: "심판 배정", sub: "경기·대회에 심판을 배정하고 일정을 관리합니다.",
      ext: { href: "심판 관리자.html", label: "심판 콘솔 열기" }, readOnly: true,
      cols: [
        { key: "name", label: "경기", type: "title", w: "minmax(0,2.4fr)" },
        { key: "ref", label: "배정 심판", type: "muted", w: "130px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
        { key: "at", label: "일시", type: "mono", w: "130px", align: "right" },
      ],
      rows: [
        R({ name: "U18 윈터컵 8강 1경기", sub: "마포 실내체육관", ref: "미배정", st: "대기", sttone: "danger", at: "07.20 10:00" }),
        R({ name: "한강 3x3 페스타 결승", sub: "한강 농구장", ref: "김심판 외 1", st: "확정", sttone: "ok", at: "06.30 16:00" }),
      ],
    },
    "ref-verify": {
      head: "심판 검증", sub: "심판 자격·신원 인증을 검토하고 승인합니다.", readOnly: true,
      ext: { href: "심판 관리자.html", label: "심판 콘솔 열기" },
      cols: [
        { key: "name", label: "심판", type: "title", w: "minmax(0,2fr)" },
        { key: "cert", label: "자격", type: "muted", w: "140px", align: "center" },
        { key: "st", label: "검증", type: "status", w: "120px", align: "center" },
      ],
      rows: [
        R({ name: "김심판", sub: "심판 경력 6년", cert: "협회 1급", st: "인증 완료", sttone: "ok" }),
        R({ name: "이심판", sub: "심판 경력 2년", cert: "협회 2급", st: "심사중", sttone: "warn" }),
      ],
    },
    "ref-grade": {
      head: "심판 등급", sub: "심판 평가·등급과 누적 운영 기록을 관리합니다.", readOnly: true,
      ext: { href: "심판 관리자.html", label: "심판 콘솔 열기" },
      cols: [
        { key: "name", label: "심판", type: "title", w: "minmax(0,2fr)" },
        { key: "grade", label: "등급", type: "badge", w: "100px", align: "center" },
        { key: "games", label: "운영 경기", type: "mono", w: "110px", align: "center" },
        { key: "score", label: "평점", type: "mono", w: "90px", align: "center" },
      ],
      rows: [
        R({ name: "김심판", badge: "A", tone: "ok", games: "128", score: "4.9" }),
        R({ name: "이심판", badge: "B", tone: "primary", games: "42", score: "4.6" }),
      ],
    },
    "ref-pay": {
      head: "수당 정산", sub: "심판 수당 정산 내역을 관리합니다.", readOnly: true,
      ext: { href: "심판 관리자.html", label: "심판 콘솔 열기" },
      cols: [
        { key: "name", label: "심판", type: "title", w: "minmax(0,1.8fr)" },
        { key: "games", label: "정산 경기", type: "mono", w: "110px", align: "center" },
        { key: "amount", label: "정산액", type: "money", w: "120px", align: "right" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "김심판", games: "12", amount: "₩480,000", st: "정산 완료", sttone: "ok" }),
        R({ name: "이심판", games: "5", amount: "₩200,000", st: "정산 대기", sttone: "warn" }),
      ],
    },

    // 협력업체 콘솔
    "partner-fac": {
      head: "제휴 시설", sub: "협력업체가 등록한 제휴 시설을 관리합니다.",
      ext: { href: "협력업체 콘솔.html", label: "협력업체 콘솔 열기" }, readOnly: true,
      cols: [
        { key: "name", label: "시설", type: "title", w: "minmax(0,2.2fr)" },
        { key: "partner", label: "협력업체", type: "muted", w: "minmax(0,1.2fr)" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "강남 스포츠센터", sub: "실내 2면", partner: "GS스포츠", st: "운영", sttone: "ok" }),
        R({ name: "분당 아레나", sub: "실내 1면", partner: "분당체육문화", st: "승인 대기", sttone: "warn" }),
      ],
    },
    "partner-camp": {
      head: "협력업체 캠페인", sub: "협력업체 광고·프로모션 캠페인을 관리합니다.",
      ext: { href: "협력업체 콘솔.html", label: "협력업체 콘솔 열기" }, readOnly: true,
      cols: [
        { key: "name", label: "캠페인", type: "title", w: "minmax(0,2.4fr)" },
        { key: "partner", label: "협력업체", type: "muted", w: "minmax(0,1fr)" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "여름 코트 할인 프로모션", sub: "배너 · 피드", partner: "GS스포츠", st: "진행중", sttone: "ok" }),
        R({ name: "신규 시설 오픈 광고", sub: "피드", partner: "분당체육문화", st: "검수중", sttone: "warn" }),
      ],
    },
    "partner-settle": {
      head: "협력업체 정산", sub: "제휴 수수료·광고비 정산 내역을 관리합니다.", readOnly: true,
      ext: { href: "협력업체 콘솔.html", label: "협력업체 콘솔 열기" },
      cols: [
        { key: "name", label: "협력업체", type: "title", w: "minmax(0,1.8fr)" },
        { key: "month", label: "정산월", type: "mono", w: "100px", align: "center" },
        { key: "amount", label: "정산액", type: "money", w: "130px", align: "right" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "GS스포츠", month: "2026.06", amount: "₩1,240,000", st: "정산 완료", sttone: "ok" }),
        R({ name: "분당체육문화", month: "2026.06", amount: "₩380,000", st: "정산 대기", sttone: "warn" }),
      ],
    },

    // 마케팅 콘솔
    "mkt-campaign": {
      head: "광고 캠페인", sub: "플랫폼 광고 캠페인을 생성·집행합니다.", addLabel: "캠페인 만들기",
      cols: [
        { key: "name", label: "캠페인", type: "title", w: "minmax(0,2.4fr)" },
        { key: "place", label: "지면", type: "muted", w: "120px", align: "center" },
        { key: "ctr", label: "CTR", type: "mono", w: "90px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "윈터컵 참가 모집", sub: "07.01–07.15", place: "홈 배너", ctr: "3.8%", st: "진행중", sttone: "ok" }),
        R({ name: "신규 가입 이벤트", sub: "상시", place: "피드", ctr: "2.1%", st: "진행중", sttone: "ok" }),
        R({ name: "여름 코트 프로모션", sub: "예약", place: "홈 배너", ctr: "—", st: "예약", sttone: "primary" }),
      ],
    },
    "mkt-promo": {
      head: "프로모션", sub: "쿠폰·할인 프로모션을 관리합니다.", addLabel: "프로모션 추가",
      cols: [
        { key: "name", label: "프로모션", type: "title", w: "minmax(0,2.2fr)" },
        { key: "code", label: "코드", type: "mono", w: "130px", align: "center" },
        { key: "used", label: "사용", type: "mono", w: "100px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "첫 대회 참가 20% 할인", code: "BDRFIRST20", used: "312", st: "활성", sttone: "ok" }),
        R({ name: "팀 단체 등록 할인", code: "TEAM10", used: "84", st: "활성", sttone: "ok" }),
      ],
    },
    "mkt-banner": {
      head: "배너 관리", sub: "홈·앱 노출 배너를 등록하고 순서를 관리합니다.", addLabel: "배너 추가",
      cols: [
        { key: "name", label: "배너", type: "title", w: "minmax(0,2.6fr)" },
        { key: "place", label: "위치", type: "muted", w: "120px", align: "center" },
        { key: "order", label: "순서", type: "mono", w: "80px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "U18 윈터컵 메인 배너", place: "홈 상단", order: "1", st: "노출", sttone: "ok" }),
        R({ name: "신규 가입 혜택 배너", place: "홈 중단", order: "2", st: "노출", sttone: "ok" }),
        R({ name: "여름 코트 프로모션", place: "홈 상단", order: "—", st: "대기", sttone: "mute" }),
      ],
    },

    // 정산·플랜
    pay: {
      head: "결제", sub: "참가비·이용권 결제와 환불 내역을 관리합니다.", readOnly: true,
      cols: [
        { key: "name", label: "결제 항목", type: "title", w: "minmax(0,2.4fr)" },
        { key: "method", label: "수단", type: "muted", w: "110px", align: "center" },
        { key: "amount", label: "금액", type: "money", w: "120px", align: "right" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "U18 윈터컵 참가비", sub: "한강 불스", method: "카드", amount: "₩60,000", st: "완료", sttone: "ok" }),
        R({ name: "프리미엄 이용권", sub: "subin_h", method: "카드", amount: "₩9,900", st: "완료", sttone: "ok" }),
        R({ name: "참가비 환불", sub: "강남 호퍼스", method: "카드", amount: "−₩60,000", st: "환불", sttone: "warn" }),
      ],
    },
    plans: {
      head: "요금제", sub: "이용권·요금제 구성과 가격을 관리합니다.", addLabel: "요금제 추가",
      cols: [
        { key: "name", label: "요금제", type: "title", w: "minmax(0,2.2fr)" },
        { key: "price", label: "월 요금", type: "money", w: "120px", align: "right" },
        { key: "subs", label: "구독", type: "mono", w: "100px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "베이직", sub: "기본 매칭", price: "무료", subs: "612", st: "운영", sttone: "ok" }),
        R({ name: "프리미엄", sub: "기록·통계 확장", price: "₩9,900", subs: "74", st: "운영", sttone: "ok" }),
        R({ name: "팀 플랜", sub: "팀 운영 도구", price: "₩29,000", subs: "21", st: "운영", sttone: "ok" }),
      ],
    },

    // 시스템
    categories: {
      head: "종별 관리", sub: "대회·매칭 종별(부문) 마스터를 관리합니다.", addLabel: "종별 추가",
      cols: [
        { key: "name", label: "종별", type: "title", w: "minmax(0,2.4fr)" },
        { key: "type", label: "유형", type: "muted", w: "120px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
      ],
      rows: [
        R({ name: "U18", sub: "만 18세 이하", type: "연령", st: "사용", sttone: "ok" }),
        R({ name: "오픈", sub: "제한 없음", type: "오픈", st: "사용", sttone: "ok" }),
        R({ name: "여성부", sub: "여성 전용", type: "성별", st: "사용", sttone: "ok" }),
      ],
    },
    awards: {
      head: "시즌 시상", sub: "시즌별 시상·랭킹 보상을 관리합니다.", readOnly: true,
      cols: [
        { key: "name", label: "시상", type: "title", w: "minmax(0,2.4fr)" },
        { key: "season", label: "시즌", type: "muted", w: "120px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "2026 상반기 MVP", sub: "개인", season: "2026 H1", st: "집계중", sttone: "warn" }),
        R({ name: "베스트 팀", sub: "팀", season: "2026 H1", st: "집계중", sttone: "warn" }),
      ],
    },
    manner: {
      head: "매너 평가", sub: "경기 후 매너 평가와 누적 점수·제재를 관리합니다.", readOnly: true,
      cols: [
        { key: "name", label: "회원", type: "avatar", w: "minmax(0,1.8fr)" },
        { key: "score", label: "매너 점수", type: "mono", w: "110px", align: "center" },
        { key: "reviews", label: "평가 수", type: "mono", w: "100px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "110px", align: "center" },
      ],
      rows: [
        R({ name: "이수빈", sub: "subin_h", color: AV[0], score: "4.9", reviews: "62", st: "우수", sttone: "ok" }),
        R({ name: "박재훈", sub: "jaehoon", color: AV[1], score: "4.6", reviews: "38", st: "양호", sttone: "ok" }),
        R({ name: "matcher_99", sub: "반복 노쇼", color: AV[2], score: "2.8", reviews: "21", st: "주의", sttone: "danger" }),
      ],
    },
    noti: {
      head: "알림", sub: "푸시·시스템 알림 발송과 템플릿을 관리합니다.", addLabel: "알림 발송",
      cols: [
        { key: "name", label: "알림", type: "title", w: "minmax(0,2.6fr)" },
        { key: "target", label: "대상", type: "muted", w: "120px", align: "center" },
        { key: "st", label: "상태", type: "status", w: "100px", align: "center" },
        { key: "at", label: "발송", type: "mono", w: "130px", align: "right" },
      ],
      rows: [
        R({ name: "윈터컵 접수 마감 D-1 안내", target: "참가팀", st: "발송", sttone: "ok", at: "06.29 10:00" }),
        R({ name: "신규 코트 오픈 안내", target: "전체", st: "예약", sttone: "primary", at: "07.01 09:00" }),
      ],
    },
    me: {
      head: "마이페이지", sub: "관리자 계정 정보와 권한을 확인합니다.", readOnly: true,
      cols: [
        { key: "name", label: "항목", type: "title", w: "minmax(0,1.6fr)" },
        { key: "value", label: "값", type: "muted", w: "minmax(0,2fr)" },
      ],
      rows: [
        R({ name: "계정", value: "BDR_Admin master" }),
        R({ name: "권한", value: "최고 관리자 (super_admin)" }),
        R({ name: "최근 로그인", value: "2026.06.30 09:02" }),
      ],
    },
  };

  // 설정 페이지 그룹 (AdSettings)
  window.HUB_SETTINGS = [
    {
      group: "운영 정책", items: [
        { k: "auto_approve", type: "toggle", on: false, label: "단체 인증 자동 승인", desc: "사업자 인증 완료 단체를 자동 승인합니다." },
        { k: "noshow_limit", type: "value", value: "3회", label: "노쇼 자동 제재 기준", desc: "누적 노쇼 횟수 초과 시 매칭을 제한합니다." },
      ],
    },
    {
      group: "알림·발송", items: [
        { k: "push", type: "toggle", on: true, label: "푸시 알림 사용", desc: "앱 푸시 알림을 발송합니다." },
        { k: "digest", type: "toggle", on: true, label: "운영 리포트 메일", desc: "주간 운영 요약 리포트를 발송합니다." },
      ],
    },
  ];
})();
