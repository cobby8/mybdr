/**
 * BDR v2 Hero 카로셀 슬라이드 데이터 타입
 *
 * 왜 이 파일이 필요한가:
 * 메인 hero 영역에 4종(대회/게임/MVP/정적)의 서로 다른 슬라이드를 한 배열로 다룬다.
 * 각 슬라이드는 카드 컴포넌트가 다르므로 `kind` 필드로 식별하는 discriminated union을 쓴다.
 * (서로 다른 모양의 책 4권을 같은 책장에 꽂아두고, 표지에 라벨을 붙여 구분하는 것과 같다)
 *
 * 핵심 규칙: snake_case 유지
 * - apiSuccess() 응답이 자동으로 snake_case 변환되므로 (errors.md 04-17 재발 7회 예방)
 * - SSR 프리페치 결과도 동일하게 snake_case로 통일하여 클라이언트 접근 일관성 확보.
 */

// 1) 대회 슬라이드 — 임박/접수중/진행 중 대회 1건
// 2026-05-02: is_registration_open + live_match 추가 (사용자 요청)
//  - 접수 중일 때만 "지금 신청하기" 노출
//  - 진행 중인 매치 정보 (팀명/스코어/라이브 여부) 표시
//  - 라이브 매치 시 LIVE 아이콘 → /live/[id] 진입
export type HeroSlideTournament = {
  kind: "tournament";
  data: {
    id: string; // tournament.id 자체가 UUID(String)이므로 string
    uuid: string | null; // 별도 uuid 필드는 없으므로 id와 동일하게 채우거나 null
    name: string;
    short_name: string | null; // 스키마에 없으면 null
    status: string; // 'registration' | 'in_progress'
    start_date: string | null; // ISO
    registration_close_at: string | null; // ISO (스키마의 registration_end_at)
    teams_count: number;
    max_teams: number | null;
    cover_image_url: string | null; // 스키마의 banner_url 매핑
    // 2026-05-02: 접수 가능 여부 — registration_end_at > NOW
    is_registration_open: boolean;
    // 2026-05-02: 진행 중인 매치 (없으면 null)
    live_match: {
      id: string; // tournamentMatch.id (BigInt → string)
      home_team_name: string;
      home_score: number;
      away_team_name: string;
      away_score: number;
      is_live: boolean; // status='live' 또는 'in_progress'
    } | null;
  };
};

// 2) 게임 슬라이드 — 24시간 내 모집중 게임 1건
export type HeroSlideGame = {
  kind: "game";
  data: {
    id: string; // games.id 는 BigInt → string 변환
    uuid: string;
    title: string;
    scheduled_at: string; // ISO
    location: string | null; // venue_name 또는 city
    current_count: number;
    max_count: number | null;
    status: number; // 1=recruiting
    organizer_nickname: string | null;
  };
};

// 3) MVP 슬라이드 — 최근 평가된 MVP 1건
export type HeroSlideMvp = {
  kind: "mvp";
  data: {
    game_uuid: string;
    game_title: string;
    mvp_user_id: string; // BigInt → string
    mvp_nickname: string | null;
    mvp_profile_image: string | null;
    overall_rating: number; // 1-5
    reported_at: string; // ISO
  };
};

// 4) 정적 fallback 슬라이드 — 데이터 0건일 때 빈 hero를 막기 위함
export type HeroSlideStatic = {
  kind: "static";
  data: {
    title: string;
    description: string;
    cta_label: string;
    cta_href: string;
  };
};

// 4종 union — page.tsx에서 HeroSlide[] 형태로 캐로셀에 주입
export type HeroSlide =
  | HeroSlideTournament
  | HeroSlideGame
  | HeroSlideMvp
  | HeroSlideStatic;
