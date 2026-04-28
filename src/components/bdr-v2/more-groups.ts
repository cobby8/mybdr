/* ============================================================
 * MORE_GROUPS — BDR v2 "더보기" 메뉴 5그룹 IA
 *
 * 이유(왜):
 *   기존 단일 7개 항목(moreItems) → 시안의 5그룹 IA로 재편.
 *   AppNav 데스크톱 드롭다운(680px 2-col 그리드)과 AppDrawer 모바일
 *   풀폭 패널이 동일 데이터 구조를 공유한다. 한 곳만 수정하면 양쪽이
 *   같이 갱신되도록 외부 상수로 분리.
 *
 * 시안 출처:
 *   Dev/design/BDR v2 (1)/components.jsx L117-161 moreGroups
 *
 * 라우트 매핑 메모:
 *   - achievements: /profile/achievements (실제 존재 페이지가 더 정확)
 *   - bracket/gameResult/gameReport/scrim/teamManage/refereeRequest 등
 *     "직접 라우트가 없는" 항목은 가장 가까운 허브로 진입시키고 본 페이지에서
 *     해당 액션을 유도한다. (예: 게스트 신청 = /games 상세에서)
 *   - help: 도움말 허브 /help (글로사리는 /help/glossary)
 *
 * 아이콘:
 *   시안 인라인 이모지 그대로 유지. Material Symbols 강제 변환 금지.
 * ============================================================ */

export interface MoreItem {
  id: string;
  label: string;
  icon: string; // 이모지 (시안 그대로)
  href: string;
}

export interface MoreGroup {
  title: string;
  items: MoreItem[];
}

export const MORE_GROUPS: MoreGroup[] = [
  {
    title: "내 활동",
    items: [
      { id: "mygames", label: "내 신청 내역", icon: "📋", href: "/games/my-games" },
      { id: "guestApps", label: "게스트 지원", icon: "🎟️", href: "/guest-apps" },
      { id: "calendar", label: "내 일정", icon: "📅", href: "/calendar" },
      { id: "saved", label: "보관함", icon: "🔖", href: "/saved" },
      { id: "messages", label: "쪽지", icon: "💬", href: "/messages" },
      // achievements: 실제 라우트 /profile/achievements 가 존재하므로 그쪽 우선
      { id: "achievements", label: "업적·배지", icon: "🎖", href: "/profile/achievements" },
      { id: "stats", label: "스탯 분석", icon: "📈", href: "/stats" },
      // P0-C: 글 작성 핵심 액션 — 커뮤니티 작성 페이지 직진입
      { id: "communityNew", label: "글 작성", icon: "✍", href: "/community/new" },
    ],
  },
  {
    title: "경기·대회",
    items: [
      { id: "live", label: "라이브 중계", icon: "🔴", href: "/live" },
      // P0-C: 경기 등록 핵심 액션 — 신규 경기 생성 페이지 직진입
      { id: "gameNew", label: "경기 등록", icon: "➕", href: "/games/new" },
      // gameResult/gameReport: 직접 라우트 없음 → my-games 허브로
      // (종료 경기에서 결과 확인·평가 진입이 자연스러우므로 유지)
      { id: "gameResult", label: "경기 결과", icon: "📊", href: "/games/my-games" },
      { id: "gameReport", label: "경기 신고·평가", icon: "🚩", href: "/games/my-games" },
      { id: "scrim", label: "스크림 매칭", icon: "🆚", href: "/scrim" },
      // P0-B 제거: bracket / tournamentEnroll / guestApply
      //   - 대진표/대회 접수: 토너먼트 선택 후 진입이 자연스러워 가짜 링크 제거
      //   - 게스트 지원 신청: /games 상세에서 직접 진입 흐름이라 가짜 링크 제거
    ],
  },
  {
    title: "등록·예약",
    items: [
      { id: "courtBooking", label: "코트 예약", icon: "📍", href: "/courts" },
      { id: "courtAdd", label: "코트 제보", icon: "📮", href: "/courts/submit" },
      { id: "teamCreate", label: "팀 등록", icon: "➕", href: "/teams/new" },
      { id: "teamManage", label: "팀 관리", icon: "⚙", href: "/teams" },
      // P0-B 제거: refereeRequest
      //   심판 배정은 토너먼트 운영 영역에서 직접 처리되므로 가짜 링크 제거
    ],
  },
  {
    title: "둘러보기",
    items: [
      { id: "searchResults", label: "검색 결과", icon: "🔎", href: "/search" },
      { id: "referee", label: "심판 센터", icon: "🦓", href: "/referee" },
      { id: "coaches", label: "코치·트레이너", icon: "👔", href: "/coaches" },
      { id: "reviews", label: "리뷰", icon: "⭐", href: "/reviews" },
      { id: "awards", label: "수상 아카이브", icon: "🏆", href: "/awards" },
      { id: "gallery", label: "갤러리", icon: "🎞", href: "/gallery" },
      { id: "shop", label: "샵", icon: "🛒", href: "/shop" },
    ],
  },
  {
    title: "계정·도움",
    items: [
      { id: "editProfile", label: "프로필 편집", icon: "✏", href: "/profile/edit" },
      {
        id: "notificationSettings",
        label: "알림 설정",
        icon: "🔔",
        href: "/profile/notification-settings",
      },
      { id: "safety", label: "안전·차단", icon: "🛡", href: "/safety" },
      { id: "passwordReset", label: "비밀번호 찾기", icon: "🔑", href: "/forgot-password" },
      { id: "onboardingV2", label: "가입 설정", icon: "🎯", href: "/onboarding/setup" },
      { id: "about", label: "소개", icon: "ℹ", href: "/about" },
      { id: "pricing", label: "요금제", icon: "💎", href: "/pricing" },
      { id: "help", label: "도움말", icon: "❓", href: "/help" },
    ],
  },
];
