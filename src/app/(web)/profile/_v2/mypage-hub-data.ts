/* ============================================================
 * MyPageHub — 데이터 상수 (4 카드 + 4 quick)
 *
 * 왜:
 * - 의뢰서 §3-3 (Tier 1 큰 4 + Tier 2 중간 4) 의 라벨/아이콘/href 를
 *   한 곳에서 관리. mypage-hub.tsx 가 이 상수를 가져와 렌더.
 * - 페이지 컴포넌트에서 props 로 동적 데이터(닉네임/스탯/미확인 알림 등)를
 *   주입할 수 있도록 "정적 메타" 와 "동적 슬롯" 분리.
 *
 * 어떻게:
 * - HUB_CARDS_TIER1: 큰 카드 4종 (프로필/내 농구/내 성장/내 활동)
 *   각 카드의 본문은 page.tsx 에서 직접 JSX 로 그려넣음 (스탯 등 동적 데이터 의존).
 * - HUB_QUICK_LINKS: 작은 quick 카드 4종 (예약/주간/알림/배지)
 *   라벨 + 아이콘 + href + 옵션 뱃지(NEW / unreadCount).
 *
 * 박제 룰:
 * - Material Symbols Outlined 아이콘명만 저장 (lucide 0).
 * - href 는 기존 운영 라우트만 (신규 라우트 0).
 * ============================================================ */

export interface HubQuickLink {
  /** 카드 식별자 — JSX key */
  id: string;
  /** 카드 라벨 (예: "예약 이력") */
  label: string;
  /** Material Symbols Outlined 아이콘명 */
  icon: string;
  /** 클릭 시 이동 라우트 — 운영에 이미 존재하는 페이지만 */
  href: string;
  /** 우측 상단 코너 뱃지 — "NEW" 또는 unread count. 없으면 미표시 */
  cornerBadge?: { text: string; tone: "new" | "alert" };
  /** 시안 캡처 30: 좌상단 큰 컬러 아이콘 — var(--*) 토큰 (룰 10) */
  iconColor?: string;
}

/**
 * Tier 2 — 하단 작은 quick 카드 4종.
 * 의뢰서 §3-3 Tier 2 (예약/주간/알림/배지). "NEW" 와 알림 카운트는 page.tsx 에서 주입.
 */
export const HUB_QUICK_BASE: HubQuickLink[] = [
  {
    id: "bookings",
    label: "예약 이력",
    icon: "event_note",
    href: "/profile/bookings",
    iconColor: "var(--cafe-blue)", // 시안 캡처 30: 보라/파랑 톤 — BDR Navy
  },
  {
    id: "weekly-report",
    label: "주간 리포트",
    icon: "summarize",
    href: "/profile/weekly-report",
    cornerBadge: { text: "NEW", tone: "new" },
    iconColor: "var(--cafe-blue)", // 시안 캡처 30: 파랑
  },
  {
    id: "notifications",
    label: "알림",
    icon: "notifications",
    href: "/notifications",
    // unreadCount 는 page.tsx 에서 주입 (cornerBadge 동적 계산)
    iconColor: "var(--warn)", // 시안 캡처 30: 노랑/오렌지
  },
  {
    id: "achievements",
    label: "배지·업적",
    icon: "emoji_events",
    href: "/profile/achievements",
    iconColor: "var(--accent)", // 시안 캡처 30: 빨강 (BDR Red 트로피)
  },
];

/**
 * Tier 1 카드 4종의 메타 정보 (라벨/아이콘/href만).
 * 본문 JSX 는 page.tsx 가 직접 렌더 (스탯 등 동적 데이터 의존).
 */
export interface HubCardMeta {
  id: "profile" | "basketball" | "growth" | "activity";
  label: string;
  icon: string;
  href: string;
  /** "프로필 편집 →" 처럼 카드 하단 우측에 노출되는 마이크로 카피 */
  ctaLabel: string;
  /** 시안 캡처 29: 카드별 다른 색상 아이콘 — var(--*) 토큰 (룰 10) */
  iconColor: string;
}

export const HUB_CARDS_TIER1: HubCardMeta[] = [
  {
    id: "profile",
    label: "프로필",
    icon: "person",
    href: "/profile/edit",
    ctaLabel: "프로필 편집 →",
    iconColor: "var(--cafe-blue)", // 시안 캡처 29: 보라/파랑 톤
  },
  {
    id: "basketball",
    label: "내 농구",
    icon: "sports_basketball",
    href: "/profile/basketball",
    ctaLabel: "경기 기록 →",
    iconColor: "var(--ink)", // 시안 캡처 29: 검정 농구공
  },
  {
    id: "growth",
    label: "내 성장",
    icon: "trending_up",
    href: "/profile/growth",
    ctaLabel: "성장 추이 →",
    iconColor: "var(--accent)", // 시안 캡처 29: 빨간 line graph
  },
  {
    id: "activity",
    label: "내 활동",
    icon: "bolt",
    href: "/profile/activity",
    ctaLabel: "활동 타임라인 →",
    iconColor: "var(--warn)", // 시안 캡처 29: 노랑 번개
  },
];
