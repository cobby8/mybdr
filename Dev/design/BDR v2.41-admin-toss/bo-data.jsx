/* global window */
// ============================================================
// bo-data.jsx — 백오피스(/admin/*) 데이터
//   ▸ 실제 운영 소스에 정합 (cobby8/mybdr@main)
//     · NAV       = src/components/admin/sidebar.tsx  `navStructure` (1단독+5그룹, 역할필터)
//     · 대시보드   = src/app/(admin)/admin/page.tsx (Prisma count + admin_logs)
//     · 페이지     = src/app/(admin)/admin/<route>/page.tsx
//   ▸ 모든 값은 실 데이터 형태를 본뜬 mock. 박제 시 아래 "실소스" 주석의
//     Prisma 모델/라우트로 1:1 바인딩. (DATA-CONTRACT.md 참조)
// ============================================================
(function () {
  const av = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];

  // ── 네비게이션 IA (실소스: sidebar.tsx navStructure) ──────────
  //   id = 라우트 슬러그(/admin/<id>) · roles = 접근 권한(sidebar.tsx 그대로)
  //   icon = Material→lucide 변환 결과(SIDEBAR_ICON 맵) · children = 하위 sub-item
  window.BO_NAV = [
    // 단독 — 대시보드
    { id: "dash", icon: "layout-dashboard", text: "대시보드", roles: "all" },

    { label: "운영", icon: "trophy" },
    { id: "tournaments", icon: "trophy", text: "대회 관리", roles: ["super_admin", "site_admin", "tournament_admin"], badge: 6 },
    { id: "games", icon: "volleyball", text: "경기 관리", roles: ["super_admin", "site_admin"] },
    { id: "teams", icon: "users", text: "팀 관리", roles: ["super_admin", "site_admin"] },
    { id: "organizations", icon: "users", text: "단체 관리", roles: ["super_admin", "site_admin"] },
    { id: "courts", icon: "map-pin", text: "코트 관리", roles: ["super_admin", "site_admin"] },

    { label: "사용자·커뮤니티", icon: "users" },
    { id: "users", icon: "users", text: "유저 관리", roles: ["super_admin", "site_admin"] },
    {
      id: "community", icon: "message-square", text: "커뮤니티", roles: ["super_admin", "site_admin"],
      children: [{ id: "news", icon: "newspaper", text: "BDR NEWS", roles: ["super_admin", "site_admin"] }],
    },
    { id: "season-awards", icon: "trophy", text: "시즌 시상", roles: ["super_admin"] },
    { id: "game-reports", icon: "flag", text: "신고 검토", roles: ["super_admin"], badge: 3 },
    { id: "suggestions", icon: "lightbulb", text: "건의사항", roles: ["super_admin"], badge: 9 },

    { label: "비즈니스", icon: "credit-card" },
    { id: "payments", icon: "credit-card", text: "결제", roles: ["super_admin"], badge: 5 },
    { id: "plans", icon: "credit-card", text: "요금제 관리", roles: ["super_admin"] },
    { id: "campaigns", icon: "megaphone", text: "광고 캠페인", roles: ["super_admin", "partner_member"] },
    { id: "partners", icon: "handshake", text: "파트너 관리", roles: ["super_admin"] },

    { label: "시스템", icon: "settings" },
    { id: "analytics", icon: "bar-chart-3", text: "분석", roles: ["super_admin", "site_admin"] },
    { id: "categories", icon: "layout-grid", text: "종별 관리", roles: ["super_admin"] },
    { id: "notifications", icon: "bell", text: "알림", roles: ["super_admin"] },
    { id: "agents", icon: "bot", text: "에이전트", roles: ["super_admin"] },
    { id: "logs", icon: "list", text: "활동 로그", roles: ["super_admin"] },
    { id: "settings", icon: "settings", text: "시스템 설정", roles: ["super_admin"] },

    { label: "외부 관리", icon: "store" },
    { id: "partner-admin", icon: "store", text: "협력업체 관리", roles: ["partner_member"] },
  ];

  // 역할 라벨 (sidebar.tsx AdminRole) — 역할 미리보기 스위처용
  window.BO_ROLES = [
    { id: "super_admin", label: "슈퍼 관리자" },
    { id: "site_admin", label: "사이트 관리자" },
    { id: "tournament_admin", label: "대회 운영자" },
    { id: "partner_member", label: "협력업체" },
  ];

  // ── 대시보드 (실소스: admin/page.tsx — Prisma) ───────────────
  //   KPI: prisma.user.count / tournament.count / tournamentMatch.count(LIVE) / team.count
  //   delta 없음(실 페이지 = 단순 count). 진행중 경기 = LIVE_MATCH_STATUSES.
  window.BO_KPI = [
    { label: "전체 유저", value: "12,840", icon: "users", tone: "primary" },     // prisma.user.count()
    { label: "대회", value: "128", icon: "trophy", tone: "ok" },                  // prisma.tournament.count()
    { label: "진행중 경기", value: "7", icon: "volleyball", tone: "warn" },        // tournamentMatch.count(status in LIVE)
    { label: "등록 팀", value: "1,206", icon: "users", tone: "violet" },          // prisma.team.count()
  ];

  // 활동 추이 — 최근 7일 admin_logs 일별 건수 ($queryRaw GROUP BY day)
  window.BO_ACTIVITY7 = [
    { day: "06-20", count: 4 }, { day: "06-21", count: 2 }, { day: "06-22", count: 7 },
    { day: "06-23", count: 5 }, { day: "06-24", count: 9 }, { day: "06-25", count: 6 }, { day: "06-26", count: 8 },
  ];

  // 관리자 작업 라벨 (admin/page.tsx ACTION_LABEL — 실 맵 그대로)
  window.BO_ACTION_LABEL = {
    "user.role_change": "역할 변경", "user.status_change": "상태 변경", "user.admin_toggle": "관리자 전환",
    "user.force_withdraw": "강제 탈퇴", "user.delete": "유저 삭제",
    "plan.create": "요금제 생성", "plan.update": "요금제 수정", "plan.deactivate": "요금제 비활성화", "plan.delete": "요금제 삭제",
    "tournament.status_change": "대회 상태 변경", "suggestion.status_change": "건의사항 상태 변경",
    "settings.cache_clear": "캐시 초기화", "settings.maintenance_toggle": "점검모드 변경",
  };

  // 최근 활동 — admin_logs.findMany(take 5) {action, description, severity, admin, created_at}
  window.BO_RECENT_LOGS = [
    { action: "user.status_change", desc: "정하준 — 약관 위반 신고 누적", admin: "관리자 K", at: "06.26 15:02", severity: "warning" },
    { action: "plan.update", desc: "프리미엄 요금제 가격 변경", admin: "관리자 L", at: "06.26 14:48", severity: "info" },
    { action: "tournament.status_change", desc: "BDR 서머 오픈 #4 → 진행중", admin: "BDR 농구문화", at: "06.26 11:20", severity: "success" },
    { action: "user.force_withdraw", desc: "이서준 — 결제 분쟁 반복", admin: "관리자 K", at: "06.25 18:40", severity: "error" },
    { action: "settings.maintenance_toggle", desc: "정기 점검모드 예약 (06.30 02:00)", admin: "시스템", at: "06.25 09:30", severity: "info" },
  ];

  // ── 분석(analytics) — 실소스: admin/analytics/page.tsx ────────
  window.BO_ANALYTICS = {
    kpi: [
      { label: "MAU", value: "8,420", icon: "activity", tone: "primary", delta: 6 },
      { label: "신규 가입", value: "760", icon: "user-plus", tone: "ok", delta: 9 },
      { label: "리텐션 30일", value: "62%", icon: "repeat", tone: "violet", delta: 3 },
      { label: "평균 세션", value: "7.4분", icon: "timer", tone: "warn", delta: -2 },
    ],
    bars: [
      { m: "1월", v: 620 }, { m: "2월", v: 740 }, { m: "3월", v: 810 }, { m: "4월", v: 980 },
      { m: "5월", v: 1120 }, { m: "6월", v: 1340 }, { m: "7월", v: 760, soft: true },
    ],
    breakdown: [
      { id: "b1", t: "코트 예약", v: "34%", icon: "map-pin", color: av[0] },
      { id: "b2", t: "픽업 게임", v: "27%", icon: "users", color: av[1] },
      { id: "b3", t: "대회 참가", v: "19%", icon: "trophy", color: av[2] },
      { id: "b4", t: "팀 운영", v: "12%", icon: "users", color: av[3] },
      { id: "b5", t: "커뮤니티", v: "8%", icon: "message-square", color: av[4] },
    ],
  };

  // ── 페이지 스키마 (테이블형) ──────────────────────────────────
  // type: title|badge|mono|muted|avatar|status|actions
  const T = (page, head, sub, addLabel, cols, rows) => ({ page, head, sub, addLabel, cols, rows });

  window.BO_PAGES = {
    // 대회 관리 — Prisma tournament (status enum 1~4 / GAME_STATUS_MAP)
    tournaments: T("tournaments", "대회 관리", "플랫폼 전체 대회를 운영 관점에서 모니터링합니다. 행을 눌러 운영 워크스페이스로 이동합니다.", null,
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

    // 경기 관리 — Prisma game (픽업/매칭)
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

    // 팀 관리 — Prisma team
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

    // 단체 관리 — Prisma organization (+ organization_members)
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

    // 코트 관리 — Prisma court
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

    // 유저 관리 — Prisma user (status: active/dormant/suspended)
    users: T("users", "유저 관리", "전체 회원 계정을 조회·관리합니다.", "회원 초대",
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

    // 커뮤니티 — Prisma post/comment + report
    community: T("community", "커뮤니티 관리", "게시글·댓글과 신고 콘텐츠를 관리합니다.", null,
      [
        { key: "name", label: "게시글", w: "minmax(0,2.2fr)", type: "title" },
        { key: "board", label: "게시판", w: "minmax(0,1fr)", type: "muted" },
        { key: "engage", label: "반응", w: "110px", align: "center", type: "mono" },
        { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "이번 주말 강남 코트 같이 뛰실 분", sub: "김도윤 · 2시간 전", board: "팀원 모집", engage: "♡ 24 · 댓 12", badge: "정상", tone: "ok" },
        { id: 2, name: "3x3 룰 질문있습니다", sub: "이서준 · 5시간 전", board: "자유게시판", engage: "♡ 8 · 댓 6", badge: "정상", tone: "ok" },
        { id: 3, name: "[신고] 비방성 댓글 포함", sub: "익명 · 어제", board: "자유게시판", engage: "신고 3", badge: "신고", tone: "danger" },
      ]),

    // BDR NEWS — 커뮤니티 하위 (알기자 검수) · admin/news
    news: T("news", "BDR NEWS 검수", "알기자(BDR NEWS) 기사 초안을 검수·발행합니다.", "기사 작성",
      [
        { key: "name", label: "기사", w: "minmax(0,2.4fr)", type: "title" },
        { key: "writer", label: "작성", w: "minmax(0,1fr)", type: "muted" },
        { key: "date", label: "작성일", w: "minmax(0,1fr)", type: "mono" },
        { key: "status", label: "상태", w: "100px", align: "center", type: "badge" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "BDR 서머 오픈 #4 16강 프리뷰", sub: "8개 매치업 분석", writer: "알기자 봇", date: "06.26", badge: "검수 대기", tone: "warn" },
        { id: 2, name: "송파 불스, 3연승으로 조 1위 확정", sub: "A조 최종 정리", writer: "알기자 봇", date: "06.25", badge: "발행됨", tone: "ok" },
        { id: 3, name: "이주의 매너팀 — 노원 클리퍼스", sub: "매너 점수 1위", writer: "알기자 봇", date: "06.24", badge: "보류", tone: "danger" },
      ]),

    // 시즌 시상 — admin/season-awards (super_admin 직접 입력)
    "season-awards": T("season-awards", "시즌 시상", "올스타·MVP·감독상·매너상 등 시즌 시상을 직접 입력합니다.", "시상 추가",
      [
        { key: "name", label: "시상", w: "minmax(0,1.8fr)", type: "title" },
        { key: "season", label: "시즌", w: "minmax(0,1fr)", type: "muted" },
        { key: "winner", label: "수상", w: "minmax(0,1.2fr)", type: "muted" },
        { key: "status", label: "상태", w: "100px", align: "center", type: "status" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "정규시즌 MVP", sub: "최우수 선수", season: "2026 봄", winner: "리딤캡틴 (리딤)", st: "발표완료", sttone: "ok" },
        { id: 2, name: "올스타 5인", sub: "베스트5", season: "2026 봄", winner: "선정 진행중", st: "입력중", sttone: "warn" },
        { id: 3, name: "매너상", sub: "페어플레이", season: "2026 봄", winner: "노원 클리퍼스", st: "발표완료", sttone: "ok" },
        { id: 4, name: "올해의 감독", sub: "지도자상", season: "2026 봄", winner: "미정", st: "대기", sttone: "mute" },
      ]),

    // 신고 검토 — admin/game-reports
    "game-reports": T("game-reports", "신고 검토", "제출된 경기 결과·기록과 신고를 검수합니다.", null,
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

    // 건의사항 — admin/suggestions (suggestion.status_change)
    suggestions: T("suggestions", "건의사항", "사용자 기능 제안·피드백을 관리합니다.", null,
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

    // 결제 — admin/payments (payment.status='paid' + paid_at)
    payments: T("payments", "결제", "참가비·예약 결제와 환불을 처리합니다.", null,
      [
        { key: "name", label: "내역", w: "minmax(0,1.8fr)", type: "title" },
        { key: "method", label: "수단", w: "minmax(0,1fr)", type: "muted" },
        { key: "amount", label: "금액", w: "120px", align: "right", type: "mono" },
        { key: "date", label: "일시", w: "minmax(0,1fr)", type: "mono" },
        { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "BDR 서머 오픈 참가비", sub: "송파 불스", method: "계좌이체", amount: "₩200,000", date: "06.26 14:20", badge: "완료", tone: "ok" },
        { id: 2, name: "코트 예약 결제", sub: "김도윤", method: "카드", amount: "₩45,000", date: "06.26 11:08", badge: "완료", tone: "ok" },
        { id: 3, name: "참가비 환불 요청", sub: "성동 썬더", method: "계좌이체", amount: "-₩200,000", date: "06.25 18:40", badge: "환불대기", tone: "warn" },
        { id: 4, name: "프리미엄 구독 결제", sub: "마포 레이커스", method: "카드", amount: "₩19,900", date: "06.25 09:30", badge: "완료", tone: "ok" },
        { id: 5, name: "코트 예약 결제 실패", sub: "이서준", method: "카드", amount: "₩30,000", date: "06.24 20:15", badge: "실패", tone: "danger" },
      ]),

    // 요금제 관리 — admin/plans · /api/admin/plans (plan.create/update/...)
    plans: T("plans", "요금제 관리", "구독 요금제와 가입자 현황을 관리합니다.", "요금제 추가",
      [
        { key: "name", label: "요금제", w: "minmax(0,1.8fr)", type: "title" },
        { key: "price", label: "월 요금", w: "120px", align: "right", type: "mono" },
        { key: "subs", label: "가입자", w: "100px", align: "center", type: "mono" },
        { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "베이직", sub: "기본 매칭 · 코트 예약", price: "무료", subs: "10,420", st: "운영중", sttone: "ok" },
        { id: 2, name: "프리미엄", sub: "우선 매칭 · 통계 · 광고 제거", price: "₩9,900", subs: "1,840", st: "운영중", sttone: "ok" },
        { id: 3, name: "팀 프로", sub: "팀 운영 · 대회 할인 · 정산", price: "₩19,900", subs: "320", st: "운영중", sttone: "ok" },
        { id: 4, name: "단체 엔터프라이즈", sub: "협회·주최사 전용", price: "협의", subs: "12", st: "비공개", sttone: "mute" },
      ]),

    // 광고 캠페인 — admin/campaigns · /api/admin/campaigns
    campaigns: T("campaigns", "광고 캠페인", "프로모션·배너 캠페인을 운영합니다.", "캠페인 생성",
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

    // 파트너 관리 — admin/partners · /api/admin/partners
    partners: T("partners", "파트너 관리", "시설 제공·후원 협력업체를 관리합니다. 행을 눌러 협력업체 콘솔로 이동합니다.", "업체 등록",
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

    // 종별 관리 — admin/categories (종별 마스터)
    categories: T("categories", "종별 관리", "대회 종별(부) 마스터를 관리합니다. 정원·연령·포맷 기본값을 정의합니다.", "종별 추가",
      [
        { key: "name", label: "종별", w: "minmax(0,1.8fr)", type: "title" },
        { key: "age", label: "연령", w: "minmax(0,1fr)", type: "muted" },
        { key: "format", label: "포맷", w: "100px", align: "center", type: "badge" },
        { key: "used", label: "사용 대회", w: "92px", align: "center", type: "mono" },
        { key: "act", label: "", w: "60px", align: "right", type: "actions" },
      ],
      [
        { id: 1, name: "오픈부", sub: "제한 없음", age: "전 연령", badge: "5x5", tone: "primary", used: "38" },
        { id: 2, name: "아마추어부", sub: "선수 출신 제한", age: "전 연령", badge: "5x5", tone: "primary", used: "24" },
        { id: 3, name: "U18부", sub: "고등부", age: "만 18세 이하", badge: "5x5", tone: "ok", used: "16" },
        { id: 4, name: "U15부", sub: "중등부", age: "만 15세 이하", badge: "3x3", tone: "warn", used: "11" },
      ]),

    // 알림 — admin/notifications (발송 = super_admin)
    notifications: T("notifications", "알림", "발송된 푸시·시스템 알림을 관리합니다.", "알림 발송",
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

    // 에이전트 — admin/agents (기록앱 영향 · record-app-impact-panel)
    agents: T("agents", "에이전트", "기록앱·봇 에이전트 연동 상태와 작업 큐를 점검합니다.", null,
      [
        { key: "name", label: "에이전트", w: "minmax(0,1.8fr)", type: "title" },
        { key: "kind", label: "유형", w: "minmax(0,1fr)", type: "muted" },
        { key: "last", label: "최근 실행", w: "minmax(0,1fr)", type: "mono" },
        { key: "status", label: "상태", w: "100px", align: "center", type: "status" },
      ],
      [
        { id: 1, name: "기록앱 동기화", sub: "Flutter 기록앱 → 서버", kind: "기록 동기화", last: "06.26 15:40", st: "정상", sttone: "ok" },
        { id: 2, name: "알기자 (BDR NEWS)", sub: "경기 결과 → 기사 초안", kind: "콘텐츠 봇", last: "06.26 11:20", st: "정상", sttone: "ok" },
        { id: 3, name: "카페 동기화", sub: "다음카페 게시물 수집", kind: "수집 봇", last: "06.26 06:00", st: "지연", sttone: "warn" },
        { id: 4, name: "랭킹 집계", sub: "주간 랭킹 재계산", kind: "배치", last: "06.24 03:00", st: "정상", sttone: "ok" },
      ]),

    // 활동 로그 — admin/logs (admin_logs 전체)
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
        { id: 3, name: "대회 상태 변경 — BDR 서머 오픈 #4", sub: "준비중 → 진행중", actor: "BDR 농구문화", badge: "정보", tone: "primary", time: "06.26 11:20:05" },
        { id: 4, name: "결제 실패 감지 — 카드 거절", sub: "이서준 코트 예약", actor: "시스템", badge: "오류", tone: "danger", time: "06.24 20:15:44" },
      ]),
  };

  // ── 진입점 연결: 행 클릭 → 실제 관리자 페이지 이동 ──
  window.BO_PAGES.tournaments.rowHref = "대회 운영.html";
  window.BO_PAGES.partners.rowHref = "협력업체 콘솔.html";

  // ── 생성/수정 폼 필드 (form 미지정 페이지는 cols 로 자동 도출) ──
  //   sel(label, key, bind, [[값, 톤], …]) — 상태/뱃지 선택지+토큰쌍
  const sel = (label, key, bind, pairs) => ({
    k: key, label, type: "select", bind,
    options: pairs.map((p) => p[0]),
    tones: pairs.reduce((m, p) => (m[p[0]] = p[1], m), {}),
  });
  const txt = (label, key, opt) => Object.assign({ k: key, label, type: "text" }, opt);

  window.BO_PAGES.tournaments.form = [
    txt("대회명", "name", { required: true, placeholder: "예: BDR 서머 오픈 #5" }),
    txt("개최일", "sub", { mono: true, placeholder: "예: 2026.08.01" }),
    txt("주최 단체", "org", { placeholder: "예: BDR 농구문화" }),
    txt("참가팀", "teams", { mono: true, placeholder: "예: 24팀" }),
    { k: "revenue", label: "참가비 수납", type: "money", mono: true, placeholder: "예: 5.0M" },
    sel("진행 상태", "status", "badge", [["준비중", "warn"], ["접수중", "primary"], ["진행중", "ok"], ["종료", "grey"]]),
  ];
  window.BO_PAGES.games.form = [
    txt("경기명", "name", { required: true, placeholder: "예: 강남 5x5 픽업" }),
    txt("호스트", "sub", { placeholder: "예: 호스트 김도윤" }),
    txt("코트", "court", { placeholder: "예: 강남 스포츠센터" }),
    txt("모집 인원", "players", { mono: true, placeholder: "예: 4/10" }),
    txt("일시", "when", { mono: true, placeholder: "예: 06.30 19:00" }),
    sel("모집 상태", "status", "badge", [["모집중", "primary"], ["모집완료", "ok"], ["종료", "grey"], ["취소", "danger"]]),
  ];
  window.BO_PAGES.teams.form = [
    txt("팀명", "name", { required: true, placeholder: "예: 송파 불스" }),
    txt("팀 소개", "sub", { placeholder: "예: 창단 2023 · 5x5" }),
    txt("활동 지역", "region", { placeholder: "예: 서울 송파" }),
    txt("선수 인원", "members", { mono: true, placeholder: "예: 9명" }),
    sel("전력 등급", "rating", "badge", [["상위 10%", "primary"], ["상위 25%", "ok"], ["신규", "warn"], ["일반", "grey"]]),
    sel("운영 상태", "status", "status", [["운영중", "ok"], ["휴면", "mute"], ["해체", "danger"]]),
  ];
  window.BO_PAGES.organizations.form = [
    txt("단체명", "name", { required: true, placeholder: "예: BDR 농구문화" }),
    txt("비고", "sub", { placeholder: "예: 사업자 등록 완료" }),
    txt("단체 유형", "type", { placeholder: "예: 정식 주최사" }),
    txt("대회 수", "tourn", { mono: true, placeholder: "예: 12개" }),
    sel("인증 상태", "verified", "badge", [["인증됨", "primary"], ["대기", "warn"], ["반려", "danger"]]),
  ];
  window.BO_PAGES.courts.form = [
    txt("코트명", "name", { required: true, placeholder: "예: 장충체육관" }),
    txt("코트 구성", "sub", { placeholder: "예: 실내 · 5면" }),
    txt("지역", "region", { placeholder: "예: 서울 중구" }),
    sel("유형", "type", "badge", [["실내", "primary"], ["야외", "ok"]]),
    txt("월 예약", "bookings", { mono: true, placeholder: "예: 80" }),
    sel("운영 상태", "status", "status", [["운영중", "ok"], ["점검중", "warn"], ["폐쇄", "mute"]]),
  ];
  window.BO_PAGES.users.form = [
    txt("이름", "name", { required: true, placeholder: "예: 김도윤" }),
    txt("이메일", "sub", { placeholder: "예: name@mybdr.kr" }),
    txt("지역", "region", { placeholder: "예: 서울 강남" }),
    txt("소속팀", "teams", { mono: true, placeholder: "예: 2팀" }),
    txt("가입일", "joined", { mono: true, placeholder: "예: 2026.06.30" }),
    sel("계정 상태", "status", "badge", [["활성", "ok"], ["휴면", "grey"], ["정지", "danger"]]),
  ];
  window.BO_PAGES.community.form = [
    txt("제목", "name", { required: true, full: true, placeholder: "게시글 제목" }),
    txt("작성 정보", "sub", { placeholder: "예: 김도윤 · 2시간 전" }),
    txt("게시판", "board", { placeholder: "예: 자유게시판" }),
    txt("반응", "engage", { mono: true, placeholder: "예: ♡ 24 · 댓 12" }),
    sel("처리 상태", "status", "badge", [["정상", "ok"], ["숨김", "warn"], ["신고", "danger"], ["삭제", "grey"]]),
  ];
  window.BO_PAGES.news.form = [
    txt("기사 제목", "name", { required: true, full: true, placeholder: "기사 제목" }),
    txt("요약", "sub", { full: true, placeholder: "한 줄 요약" }),
    txt("작성", "writer", { placeholder: "예: 알기자 봇" }),
    txt("작성일", "date", { mono: true, placeholder: "예: 06.30" }),
    sel("발행 상태", "status", "badge", [["검수 대기", "warn"], ["발행됨", "ok"], ["보류", "danger"]]),
  ];
  window.BO_PAGES["season-awards"].form = [
    txt("시상명", "name", { required: true, placeholder: "예: 정규시즌 MVP" }),
    txt("설명", "sub", { placeholder: "예: 최우수 선수" }),
    txt("시즌", "season", { placeholder: "예: 2026 봄" }),
    txt("수상", "winner", { placeholder: "예: 리딤캡틴 (리딤)" }),
    sel("진행 상태", "status", "status", [["대기", "mute"], ["입력중", "warn"], ["발표완료", "ok"]]),
  ];
  window.BO_PAGES["game-reports"].form = [
    txt("경기", "name", { required: true, full: true, placeholder: "예: 송파 불스 대 마포 레이커스" }),
    txt("소속 대회·조", "sub", { full: true, placeholder: "예: BDR 서머 오픈 · A조 1경기" }),
    txt("스코어", "score", { mono: true, placeholder: "예: 68 : 61" }),
    txt("기록원", "recorder", { placeholder: "예: 정하준" }),
    txt("신고 수", "flag", { mono: true, placeholder: "예: 0" }),
    sel("검수 상태", "status", "badge", [["검수중", "warn"], ["승인", "ok"], ["보류", "danger"]]),
  ];
  window.BO_PAGES.suggestions.form = [
    txt("제안 제목", "name", { required: true, full: true, placeholder: "기능 제안 내용" }),
    txt("제안자", "sub", { placeholder: "예: 박지호 외 142명" }),
    txt("추천 수", "votes", { mono: true, placeholder: "예: 142" }),
    sel("분류", "category", "badge", [["기능", "primary"], ["연동", "ok"], ["UI", "grey"], ["기타", "grey"]]),
    sel("처리 상태", "status", "status", [["접수", "mute"], ["검토중", "warn"], ["예정", "ok"], ["완료", "ok"], ["반려", "danger"]]),
  ];
  window.BO_PAGES.payments.form = [
    txt("내역", "name", { required: true, placeholder: "예: BDR 서머 오픈 참가비" }),
    txt("결제 대상", "sub", { placeholder: "예: 송파 불스" }),
    txt("결제 수단", "method", { placeholder: "예: 카드 / 계좌이체" }),
    txt("금액", "amount", { mono: true, placeholder: "예: ₩200,000" }),
    txt("일시", "date", { mono: true, placeholder: "예: 06.30 14:20" }),
    sel("결제 상태", "status", "badge", [["완료", "ok"], ["환불대기", "warn"], ["환불완료", "grey"], ["실패", "danger"]]),
  ];
  window.BO_PAGES.plans.form = [
    txt("요금제명", "name", { required: true, placeholder: "예: 프리미엄" }),
    txt("설명", "sub", { full: true, placeholder: "예: 우선 매칭 · 통계 · 광고 제거" }),
    txt("월 요금", "price", { mono: true, placeholder: "예: ₩9,900 / 무료 / 협의" }),
    txt("가입자", "subs", { mono: true, placeholder: "예: 1,840" }),
    sel("공개 상태", "status", "status", [["운영중", "ok"], ["비공개", "mute"], ["종료", "grey"]]),
  ];
  window.BO_PAGES.campaigns.form = [
    txt("캠페인명", "name", { required: true, full: true, placeholder: "예: 여름 코트 예약 50% 할인" }),
    txt("노출 위치", "sub", { placeholder: "예: 메인 배너 · 푸시" }),
    txt("기간", "period", { mono: true, placeholder: "예: 06.01 ~ 06.30 / 상시" }),
    txt("클릭률", "ctr", { mono: true, placeholder: "예: 4.2%" }),
    sel("진행 상태", "status", "badge", [["예약", "warn"], ["진행중", "ok"], ["종료", "grey"]]),
  ];
  window.BO_PAGES.partners.form = [
    txt("업체명", "name", { required: true, placeholder: "예: 스포클 시설관리" }),
    txt("비고", "sub", { placeholder: "예: 코트 6면 제공" }),
    txt("파트너 유형", "type", { placeholder: "예: 시설 파트너 / 용품 후원" }),
    txt("제공 시설", "venues", { mono: true, placeholder: "예: 6" }),
    sel("계약 상태", "status", "badge", [["계약중", "ok"], ["갱신예정", "warn"], ["종료", "grey"]]),
  ];
  window.BO_PAGES.categories.form = [
    txt("종별명", "name", { required: true, placeholder: "예: 오픈부" }),
    txt("설명", "sub", { placeholder: "예: 제한 없음" }),
    txt("연령 기준", "age", { placeholder: "예: 만 18세 이하" }),
    sel("경기 포맷", "format", "badge", [["5x5", "primary"], ["3x3", "warn"]]),
    txt("사용 대회", "used", { mono: true, placeholder: "예: 12" }),
  ];
  window.BO_PAGES.notifications.form = [
    txt("알림 제목", "name", { required: true, full: true, placeholder: "예: BDR 서머 오픈 접수 마감 D-3" }),
    txt("대상", "sub", { placeholder: "예: 전체 회원 / 대회 참가자" }),
    sel("발송 채널", "channel", "badge", [["푸시", "primary"], ["시스템", "grey"], ["이메일", "ok"]]),
    txt("도달", "reach", { mono: true, placeholder: "예: 12,840" }),
    txt("발송 시각", "date", { mono: true, placeholder: "예: 06.30 09:00 / 예약됨" }),
    sel("상태", "status", "status", [["예약", "warn"], ["발송완료", "ok"], ["실패", "danger"]]),
  ];

  // 알림 페이지는 발송(생성) 가능하도록 actions 컬럼이 없어도 편집 허용
  window.BO_PAGES.notifications.addLabel = window.BO_PAGES.notifications.addLabel || "알림 발송";

  // 설정(settings) — 폼형 (admin/settings · settings.* 액션)
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
