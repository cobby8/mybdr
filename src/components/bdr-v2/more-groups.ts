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
 *   [2026-04-29 P0-2 검증] BDR v2.1 components.jsx moreGroups 28개와 대조 →
 *   v2.1 신규 후보 8건(courtAdd / teamManage / searchResults / editProfile /
 *   notificationSettings / safety / passwordReset / onboardingV2)이 본 파일에
 *   이미 모두 등록되어 있음을 확인. 추가 작업 없음. (가짜 링크 정책상
 *   gameReport / guestApply / refereeRequest는 의도적 제외 유지)
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
      // [2026-05-04] 1차 11건 정리 + 2차 추가 제거 — messages (헤더 메시지 아이콘 중복)
      { id: "calendar", label: "내 일정", icon: "📅", href: "/calendar" },
      { id: "saved", label: "보관함", icon: "🔖", href: "/saved" },
      { id: "stats", label: "스탯 분석", icon: "📈", href: "/stats" },
    ],
  },
  {
    title: "경기·대회",
    items: [
      // [2026-05-04] 제거: gameNew(/games/new games하위 — games + 만들기 버튼 있음)
      { id: "live", label: "라이브 중계", icon: "🔴", href: "/live" },
      { id: "scrim", label: "연습경기 매칭", icon: "🆚", href: "/scrim" },
    ],
  },
  // [2026-05-04] "등록·예약" 그룹 전체 제거 — 4 항목 모두 메인 페이지 하위 또는 중복:
  //   courtBooking(/courts BottomNav 코트) / courtAdd(/courts/submit courts하위) /
  //   teamCreate(/teams/new teams하위 — 팀등록 버튼) / teamManage(/teams/manage teams하위)
  // 각 페이지에서 직접 진입.
  {
    title: "둘러보기",
    items: [
      // [2026-05-04] 추가 제거 — searchResults(/search 헤더 검색 + drawer 보조 검색 3중 중복)
      { id: "refereeInfo", label: "심판 센터 안내", icon: "🦓", href: "/referee-info" },
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
      // [2026-05-04] 추가 제거 — passwordReset(로그인 상태 의미 없음) / onboardingV2(가입 wizard 1회성)
      { id: "safety", label: "안전·차단", icon: "🛡", href: "/safety" },
      { id: "about", label: "소개", icon: "ℹ", href: "/about" },
      { id: "pricing", label: "요금제", icon: "💎", href: "/pricing" },
      { id: "help", label: "도움말", icon: "❓", href: "/help" },
    ],
  },
];
