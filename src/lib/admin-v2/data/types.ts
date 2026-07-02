// ============================================================
// types.ts — admin-v2 데이터 계층 camel 도메인 타입 (R1 토대)
//   호출부가 보는 camel 타입. snake 응답은 adminFetch 에서 이미 변환됨.
//   R2(백오피스/대회운영)에서 도메인 타입을 여기에 확장.
// ============================================================

// jsonb 컬럼 키 — adminFetch rawJsonKeys 로 전달하면 값 verbatim 보존.
// (대회 도메인: settings/일정/종별 등 내부 구조 변환 방지)
export const TOURNAMENT_RAW_JSON_KEYS = [
  "settings",
  "scheduleDates",
  "schedule_dates",
  "categories",
  "meta",
] as const;

// 토대 단계 예시 도메인 타입(R2 에서 실엔드포인트별 확장).
export type AdminTournamentSummary = {
  id: string;
  name: string;
  status: string;
  teamCount?: number;
  startDate?: string | null;
};

export type AdminExpense = {
  id: number;
  tournamentId: string;
  label: string;
  amount: number;
  memo?: string | null;
};

// ── R2-A 백오피스 · 유저 콘솔 도메인 타입 ──────────────────────────
// 서버 컴포넌트(user-console/page.tsx)가 Prisma 실데이터를 snake→표시값으로
// 단일 매핑한 뒤 클라 콘솔에 전달하는 행/상세 타입.
//   왜: snake↔camel 변환 지점을 서버 경계 1곳으로 모아 "snake 함정" 차단.
//       (org 인증 mutation 만 adminFetch 경유 — 그쪽은 client.ts 가 변환)

// 회원 — 리스트 행 + 상세 동시 사용(클릭 시 추가 fetch 없이 드릴다운)
export type AdminBoUser = {
  id: string;
  name: string; // 닉네임(없으면 이름)
  email: string;
  phone: string | null;
  region: string; // city + district
  provider: string | null; // 가입 경로
  status: string; // active | suspended
  badge: string; // 활성 | 정지 | 휴면(표시 라벨)
  tone: string; // ok | danger | grey
  isAdmin: boolean; // 본인/슈퍼 가드용
  membershipLabel: string; // 등급 라벨
  joined: string; // 가입일(표시)
  lastSeen: string | null; // 최근 접속(표시)
  teams: { name: string; kind: string; role: string; color: string }[];
};

// 팀 — 리스트 행 + 상세(선수 명단 TeamMember)
export type AdminBoTeam = {
  id: string;
  name: string;
  sub: string; // 창단·종별 요약
  color: string;
  region: string;
  members: string; // "9명"
  status: string; // 운영중 | 휴면 등(표시)
  sttone: string;
  captain: string;
  foundedYear: number | null;
  wins: number;
  losses: number;
  draws: number;
  roster: {
    name: string;
    pos: string;
    role: string;
    jersey: string | null;
    color: string;
  }[];
};

// ── R2-C 백오피스 · 커뮤니티/코트 콘솔 행 타입(표시 전용) ─────────────
// 서버 컴포넌트가 Prisma 실데이터(community_posts/suggestions/court_infos)를
// snake→표시값으로 단일 매핑한 뒤 클라 콘솔에 전달하는 행 타입.
// (커뮤니티/코트는 정본에 커스텀 상세가 없어 SchemaList 기본 드로어 사용 — 추가 fetch 0)

// 게시글 행(자유/모집/후기) — 정본 _board 컬럼(name·engage·status)
export type AdminBoPostRow = {
  id: string;
  name: string; // 제목
  sub: string; // 작성자 · 작성일
  engage: string; // "♡ N · 💬 N"
  badge: string; // 정상 | 숨김 등(표시)
  tone: string; // ok | grey | danger
};

// 건의(제안) 행 — 정본 suggestions 컬럼(name·category·status)
//   ⚠ 정본 votes(추천) 컬럼은 suggestions 모델에 데이터 없음 → 제외(보고 대상)
export type AdminBoSuggestionRow = {
  id: string;
  name: string; // 제목
  sub: string; // 작성자 · 작성일
  category: string; // 분류(suggestions.category 원값)
  tone: string; // 분류 배지 톤
  st: string; // 상태 라벨(대기 | 처리중 | 완료 등)
  sttone: string;
};

// 코트 행(실내/야외) — 정본 _court 컬럼(court·region·bookings·status)
export type AdminBoCourtRow = {
  id: string;
  name: string;
  sub: string; // 주소(아바타 보조줄)
  color: string;
  region: string; // city + district
  bookings: string; // 예약 수(court_bookings count) — 정본 "월 예약" 라벨(보고)
  st: string; // 운영중 | 승인대기 등(표시)
  sttone: string;
};

// 단체 — 리스트 행 + 상세(운영진 = members) + 인증 mutation 대상
export type AdminBoOrg = {
  id: string;
  name: string;
  slug: string;
  region: string;
  type: string; // 표시 유형(상태 기반 라벨)
  status: string; // pending | approved | rejected
  badge: string; // 인증됨 | 대기 | 반려(표시)
  tone: string;
  tourn: string; // 주최 대회 수 "12개"
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  seriesCount: number;
  membersCount: number;
  owner: { name: string; email: string } | null;
  staff: { name: string; role: string; color: string }[];
};
