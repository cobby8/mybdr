/* ============================================================
 * NAV IA — DualSideNav 섹션/서브메뉴 데이터 (공개웹)
 *
 * 정본: Dev/design/BDR-current/MyBDR.html L149~247
 * href: 운영 라우트 매핑 (more-groups.ts 기존 href + _pub-ia-delta.md §1-A)
 *
 * Phase PUB-0b PR2
 * ============================================================ */

export interface DSNavSection {
  id: string;
  label: string;
  icon: string;
  dot?: boolean;
}

export interface DSNavSubItem {
  id: string;
  label: string;
  icon: string;
  href?: string; // optional — DualSideNav uses id/label/icon; href used by caller for routing
  count?: number;
  isNew?: boolean;
}

export interface DSNavGroup {
  title?: string;
  items: DSNavSubItem[];
}

export interface DSNavCtxEntry {
  label: string;
  icon: string;
  groups: DSNavGroup[];
}

export const NAV_SECTIONS: DSNavSection[] = [
  { id: "home",       label: "홈",       icon: "home" },
  { id: "games",      label: "경기",     icon: "sports_basketball" },
  { id: "tournament", label: "대회",     icon: "emoji_events" },
  { id: "orgs",       label: "단체",     icon: "groups" },
  { id: "team",       label: "팀",       icon: "group" },
  { id: "court",      label: "코트",     icon: "place" },
  { id: "rank",       label: "랭킹",     icon: "leaderboard" },
  { id: "board",      label: "커뮤니티", icon: "forum", dot: true },
  { id: "mypage",     label: "마이",     icon: "account_circle" },
];

export const NAV_CTX: Record<string, DSNavCtxEntry> = {
  home: { label: "홈", icon: "home", groups: [] },
  games: {
    label: "경기", icon: "sports_basketball", groups: [
      { items: [
        { id: "games",      label: "경기 목록",   icon: "format_list_bulleted", href: "/games" },
        { id: "createGame", label: "경기 만들기", icon: "add_circle",           href: "/games/new" },
        { id: "match",      label: "매칭",        icon: "handshake",            href: "/games" },
        { id: "live",       label: "라이브",      icon: "sensors",              href: "/live" },
        { id: "scrim",      label: "연습경기",    icon: "sports_kabaddi",       href: "/scrim" },
        { id: "bracket",    label: "대진표",      icon: "account_tree",         href: "/tournaments" },
      ] },
      { title: "내 경기", items: [
        { id: "mygames",  label: "내 경기", icon: "sports_basketball", href: "/games/my-games" },
        { id: "calendar", label: "일정",    icon: "calendar_month",   href: "/calendar" },
      ] },
    ],
  },
  tournament: {
    label: "대회", icon: "emoji_events", groups: [
      { items: [
        { id: "tournamentDetail",   label: "대회 상세", icon: "emoji_events",     href: "/tournaments" },
        { id: "tournamentSchedule", label: "대회 일정", icon: "event_note",       href: "/tournaments" },
        { id: "tournamentTeams",    label: "참가팀",    icon: "diversity_3",      href: "/tournaments" },
        { id: "tournamentEnroll",   label: "참가신청",  icon: "app_registration", href: "/tournaments" },
      ] },
      { title: "시리즈", items: [
        { id: "series",       label: "시리즈",      icon: "format_list_numbered", href: "/series" },
        { id: "seriesCreate", label: "시리즈 생성", icon: "playlist_add",         href: "/series/new" },
      ] },
    ],
  },
  orgs: {
    label: "단체", icon: "groups", groups: [
      { items: [
        { id: "orgs",      label: "단체 목록", icon: "groups",         href: "/organizations" },
        { id: "orgDetail", label: "단체 상세", icon: "corporate_fare", href: "/organizations" },
      ] },
    ],
  },
  team: {
    label: "팀", icon: "group", groups: [
      { items: [
        { id: "team",       label: "팀 목록",   icon: "group",           href: "/teams" },
        { id: "teamDetail", label: "팀 상세",   icon: "groups_2",        href: "/teams" },
        { id: "createTeam", label: "팀 만들기", icon: "group_add",       href: "/teams/new" },
        { id: "teamManage", label: "팀 관리",   icon: "manage_accounts", href: "/teams/manage" },
        { id: "teamInvite", label: "팀 초대",   icon: "person_add",      href: "/team-invite" },
      ] },
    ],
  },
  court: {
    label: "코트", icon: "place", groups: [
      { items: [
        { id: "court",        label: "코트 목록", icon: "place",            href: "/courts" },
        { id: "courtDetail",  label: "코트 상세", icon: "location_on",      href: "/courts" },
        { id: "courtBooking", label: "코트 예약", icon: "event_available",  href: "/courts" },
        { id: "courtAdd",     label: "코트 등록", icon: "add_location_alt", href: "/courts/submit" },
      ] },
    ],
  },
  rank: {
    label: "랭킹", icon: "leaderboard", groups: [
      { items: [
        { id: "rank",         label: "랭킹",  icon: "leaderboard",       href: "/rankings" },
        { id: "stats",        label: "통계",  icon: "bar_chart",         href: "/stats" },
        { id: "awards",       label: "어워드", icon: "military_tech",    href: "/awards" },
        { id: "achievements", label: "업적",  icon: "workspace_premium", href: "/profile/achievements" }, // 실존 페이지로 정확 착지(구 /rankings)
      ] },
    ],
  },
  board: {
    label: "커뮤니티", icon: "forum", groups: [
      { items: [
        { id: "board",   label: "게시판", icon: "forum",         href: "/community" },
        { id: "gallery", label: "갤러리", icon: "photo_library", href: "/gallery" },
        { id: "reviews", label: "후기",   icon: "reviews",       href: "/reviews" },
      ] },
    ],
  },
  mypage: {
    label: "마이페이지", icon: "account_circle", groups: [
      { title: "내 활동", items: [
        { id: "myActivity",      label: "내 활동",   icon: "history",       href: "/profile/activity" }, // 실존 페이지(=/my 미존재 404 교정)
        { id: "myRegistrations", label: "신청 현황", icon: "fact_check",    href: "/my/registrations" },
        { id: "saved",           label: "보관함",    icon: "bookmark",      href: "/saved" },
        { id: "messages",        label: "쪽지",      icon: "mail",          href: "/messages" },
        { id: "notifications",   label: "알림",      icon: "notifications", href: "/notifications" },
      ] },
      { title: "계정·설정", items: [
        { id: "profile",     label: "프로필",      icon: "account_circle", href: "/profile" },
        { id: "editProfile", label: "프로필 편집", icon: "edit",           href: "/profile" },
        { id: "settings",    label: "설정",        icon: "settings",       href: "/settings" },
        { id: "pricing",     label: "요금제",      icon: "sell",           href: "/pricing" },
      ] },
    ],
  },
};

/* ── 내부 조회 맵 ────────────────────────────────────────────── */

// sub item id → { section, href }
const _subMap: Record<string, { section: string; href: string }> = {};
Object.entries(NAV_CTX).forEach(([sec, c]) => {
  c.groups.forEach((g) => {
    g.items.forEach((it) => {
      if (it.href) _subMap[it.id] = { section: sec, href: it.href };
    });
  });
});

// pathname prefix → section (순서 중요 — 더 구체적인 것 먼저)
const _prefixToSection: [string, string][] = [
  ["/games",         "games"],
  ["/scrim",         "games"],
  ["/live",          "games"],
  ["/calendar",      "games"],
  ["/tournaments",   "tournament"],
  ["/series",        "tournament"],
  ["/organizations", "orgs"],
  ["/teams",         "team"],
  ["/team-invite",   "team"],
  ["/courts",        "court"],
  ["/rankings",      "rank"],
  ["/stats",         "rank"],
  ["/awards",        "rank"],
  ["/community",     "board"],
  ["/gallery",       "board"],
  ["/reviews",       "board"],
  ["/my",            "mypage"],
  ["/saved",         "mypage"],
  ["/messages",      "mypage"],
  ["/notifications", "mypage"],
  ["/profile",       "mypage"],
  ["/settings",      "mypage"],
  ["/pricing",       "mypage"],
];

// pathname(exact) → sub item id
const _pathToSub: Record<string, string> = {
  "/":                 "home",
  "/games":            "games",
  "/games/new":        "createGame",
  "/games/my-games":   "mygames",
  "/scrim":            "scrim",
  "/live":             "live",
  "/calendar":         "calendar",
  "/tournaments":      "tournamentDetail",
  "/series":           "series",
  "/series/new":       "seriesCreate",
  "/organizations":    "orgs",
  "/teams":            "team",
  "/teams/new":        "createTeam",
  "/teams/manage":     "teamManage",
  "/team-invite":      "teamInvite",
  "/courts":           "court",
  "/courts/submit":    "courtAdd",
  "/rankings":         "rank",
  "/stats":            "stats",
  "/awards":           "awards",
  "/community":        "board",
  "/gallery":          "gallery",
  "/reviews":          "reviews",
  "/profile/activity": "myActivity",
  "/my/registrations": "myRegistrations",
  "/saved":            "saved",
  "/messages":         "messages",
  "/notifications":    "notifications",
  "/profile":          "profile",
  "/settings":         "settings",
  "/pricing":          "pricing",
};

/** pathname → 활성 섹션 id */
export function navSectionOf(pathname: string): string {
  if (pathname === "/") return "home";
  const sub = _pathToSub[pathname];
  if (sub) return _subMap[sub]?.section ?? "home";
  for (const [prefix, section] of _prefixToSection) {
    if (pathname.startsWith(prefix)) return section;
  }
  return "home";
}

/** pathname → 활성 서브메뉴 item id */
export function navSubOf(pathname: string): string {
  if (pathname === "/") return "home";
  return _pathToSub[pathname] ?? "";
}

/** sub item id → href */
export function getSubHref(subId: string): string {
  return _subMap[subId]?.href ?? "/";
}

/** 섹션 id → 기본 진입 href */
export function getSectionHref(sectionId: string): string {
  if (sectionId === "home") return "/";
  const ctx = NAV_CTX[sectionId];
  if (!ctx || !ctx.groups.length || !ctx.groups[0].items.length) return "/";
  return ctx.groups[0].items[0].href ?? "/";
}
