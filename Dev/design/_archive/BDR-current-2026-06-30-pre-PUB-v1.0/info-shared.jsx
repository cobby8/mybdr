/* global React */
// ============================================================
// BDR v2.30 — info-shared.jsx  (Phase 10 — 정보 페이지 공용)
//   RatingStars / 공용 포맷 + cross-domain mock 데이터.
//   운영 ref(.tsx) 의 데이터 구조 그대로 박제. mock 0 항목은 carry.
// ============================================================

// ---- 별점 (소수 평점 → 5칸, 반칸 포함) ----
window.RatingStars = function RatingStars({ value, size = 15 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let icon = 'star';
    if (value >= i) icon = 'star';
    else if (value >= i - 0.5) icon = 'star_half';
    else icon = 'star_outline';
    stars.push(
      <span key={i} className="ico material-symbols-outlined"
        style={{ fontSize: size, color: value >= i - 0.5 ? 'var(--warn)' : 'var(--ink-dim)' }}>
        {icon}
      </span>
    );
  }
  return <span style={{ display: 'inline-flex', lineHeight: 1 }}>{stars}</span>;
};

// ============================================================
// IU4 — Reviews 데이터  (court_reviews · status='published' 최신순)
//   ref: IU4_reviews_page.tsx — 코트 단일 탭 (4탭→1탭 v3 carry)
//   필드: target / targetSub / rating / title / body / likes(=helpful) /
//         photos(개수) / verified(is_checkin) / author(nickname) /
//         authorLevel("L.—") / createdAt
// ============================================================
window.REVIEWS = [
  { id: 'r1', courtId: 'c1', target: '잠실종합운동장 보조경기장', targetSub: '서울 송파구', rating: 5,
    title: '풀코트 2면 + 바닥 상태 최상', body: '실내 우레탄 바닥이 깔끔하고 미끄럽지 않아요. 야간 조명도 밝고 주차도 넉넉합니다. 픽업 모임 잡기 딱 좋은 코트.',
    likes: 24, photos: 3, verified: true, author: '슛도리', authorLevel: 'L.—', createdAt: '2026-06-09' },
  { id: 'r2', courtId: 'c2', target: '한강공원 망원 농구장', targetSub: '서울 마포구', rating: 4,
    title: '뷰 좋은 야외 하프코트', body: '강바람 맞으며 3x3 하기 좋습니다. 주말 오전엔 사람이 몰려서 대기가 좀 있어요. 골대 림 텐션은 적당.',
    likes: 17, photos: 2, verified: true, author: '리바운드킹', authorLevel: 'L.—', createdAt: '2026-06-07' },
  { id: 'r3', courtId: 'c3', target: '강남구민체육센터 농구장', targetSub: '서울 강남구', rating: 4.5,
    title: '시설 깨끗, 예약제라 쾌적', body: '예약하고 가면 한 면 통째로 쓸 수 있어요. 샤워실도 깔끔합니다. 다만 주차 자리가 협소해서 대중교통 추천.',
    likes: 31, photos: 4, verified: true, author: '코트지박령', authorLevel: 'L.—', createdAt: '2026-06-05' },
  { id: 'r4', courtId: 'c4', target: '용산구민체육센터', targetSub: '서울 용산구', rating: 3.5,
    title: '무난한 실내 코트', body: '가격 대비 괜찮습니다. 바닥이 살짝 미끄러운 구간이 있으니 농구화 그립 신경 쓰세요. 환기는 잘 됩니다.',
    likes: 9, photos: 0, verified: false, author: '드리블러', authorLevel: 'L.—', createdAt: '2026-06-03' },
  { id: 'r5', courtId: 'c5', target: '여의도 한강공원 3x3존', targetSub: '서울 영등포구', rating: 5,
    title: '3x3 성지, 밤늦게까지 OK', body: '조명이 새벽까지 켜져 있어서 야간 픽업 천국. 코트 2면이라 회전 빠릅니다. 편의점도 가까워요.',
    likes: 42, photos: 5, verified: true, author: '미드레인지', authorLevel: 'L.—', createdAt: '2026-06-01' },
  { id: 'r6', courtId: 'c6', target: '성동구민종합체육관', targetSub: '서울 성동구', rating: 4,
    title: '냉난방 잘 되는 실내', body: '한여름·한겨울에 최고예요. 바닥 마감도 좋고. 주말 대관이 빨리 차니 미리 예약하세요.',
    likes: 13, photos: 1, verified: true, author: '포인트가드', authorLevel: 'L.—', createdAt: '2026-05-29' },
  { id: 'r7', courtId: 'c7', target: '동작구 사당체육공원', targetSub: '서울 동작구', rating: 3,
    title: '야외라 날씨 영향 큼', body: '맑은 날은 좋은데 비 온 뒤엔 바닥이 한참 안 말라요. 골대 그물이 일부 없는 곳도 있습니다.',
    likes: 6, photos: 0, verified: false, author: '벤치워머', authorLevel: 'L.—', createdAt: '2026-05-27' },
  { id: 'r8', courtId: 'c8', target: '광진구민체육센터 농구장', targetSub: '서울 광진구', rating: 4.5,
    title: '접근성 + 시설 둘 다 만족', body: '지하철역에서 5분, 실내라 쾌적합니다. 평일 저녁 픽업 정기 모임이 활발해서 게스트로 끼기 좋아요.',
    likes: 20, photos: 2, verified: true, author: '클러치타임', authorLevel: 'L.—', createdAt: '2026-05-25' },
];

// Phase 2 BG2 답습 — 리뷰에서 자주 언급되는 "항목 종류"만 (개별 건수 ❌)
window.REVIEW_FLAGS = [
  { type: 'ok', label: '바닥 상태 좋음', ico: 'check_circle' },
  { type: 'ok', label: '조명 밝음', ico: 'check_circle' },
  { type: 'ok', label: '접근성 좋음', ico: 'check_circle' },
  { type: 'ok', label: '청결', ico: 'check_circle' },
  { type: 'warn', label: '주차 협소', ico: 'error' },
  { type: 'warn', label: '주말 혼잡', ico: 'error' },
];

// ============================================================
// IU2 — News 데이터  (community_posts · category='news' · published)
//   ref: IU2a_news_page.tsx (매거진) + IU2b_news_match_page.tsx (단신)
//   매치 단신 = Phase 1 대회 / Phase 2 경기 cross-domain link.
//   IA1(AdminNews) 발행 결과 = isNew 플래그로 자동 표시.
// ============================================================
window.NEWS_CATS = [
  { key: 'all', label: '전체', ico: 'apps' },
  { key: 'match', label: '매치 단신', ico: 'sports_basketball' },
  { key: 'magazine', label: '매거진', ico: 'auto_stories' },
  { key: 'notice', label: '공지', ico: 'campaign' },
  { key: 'event', label: '이벤트', ico: 'celebration' },
];

window.NEWS = [
  { id: 'n1', cat: 'match', title: '강남BC, 마포컵 우승 — 김지훈 클러치 8연속 득점 MVP',
    preview: '3쿼터까지 동점이던 결승전, 4쿼터 김지훈의 클러치 8연속 득점으로 강남BC가 봄맞이 마포컵 우승컵을 들어올렸다. 서초파이브는 준우승에 그쳤다.',
    date: '2026.06.10', views: 1842, likes: 96, comments: 23, isNew: true, trending: true,
    matchId: 'm-101', tnId: 'tn-5', tnName: '봄맞이 마포컵', homeTeam: '강남BC', awayTeam: '서초파이브',
    homeScore: 78, awayScore: 71, round: '결승' },
  { id: 'n2', cat: 'match', title: '용산레전드, 어울림배 4강 진출 — 정성훈 더블더블',
    preview: '용산구 어울림배 8강에서 정성훈이 16득점 9리바운드 더블더블 활약으로 팀의 4강행을 이끌었다.',
    date: '2026.06.09', views: 921, likes: 41, comments: 8, isNew: true, trending: false,
    matchId: 'm-102', tnId: 'tn-4', tnName: '용산구 어울림배', homeTeam: '용산레전드', awayTeam: '강북코프',
    homeScore: 64, awayScore: 58, round: '8강' },
  { id: 'n3', cat: 'magazine', title: '레이팅 1500은 어떻게 정해질까 — BDR 매칭 시스템 해설',
    preview: '모든 멤버가 1500에서 시작하는 BDR 레이팅. 승패·점수차·상대 레이팅에 따라 매 경기 ±5~40 변동되는 공정 매칭의 원리를 알기자가 정리했다.',
    date: '2026.06.06', views: 2310, likes: 132, comments: 41, isNew: false, trending: true },
  { id: 'n4', cat: 'notice', title: '[공지] 6월 정기 점검 안내 — 6/15 새벽 2~4시',
    preview: '서버 안정화를 위한 정기 점검이 진행됩니다. 점검 시간 동안 예약·결제 기능이 일시 중단됩니다.',
    date: '2026.06.05', views: 740, likes: 5, comments: 2, isNew: false, trending: false },
  { id: 'n5', cat: 'event', title: '한강 3x3 챌린지 참가팀 모집 — 선착순 16팀',
    preview: '여의도 한강공원에서 열리는 3x3 챌린지. 오픈 디비전 단일, 선착순 16팀 마감. 우승팀에는 BDR 스튜디오 촬영권이 주어진다.',
    date: '2026.06.04', views: 1560, likes: 88, comments: 19, isNew: false, trending: false,
    tnId: 'tn-3', tnName: '한강 3x3 챌린지' },
  { id: 'n6', cat: 'match', title: '서초유스, 봄철 농구왕 제패 — U15 디비전 무패 우승',
    preview: '동작구 봄철 농구왕 U15 디비전에서 서초유스가 전승으로 정상에 올랐다. 박서준이 대회 MVP에 선정됐다.',
    date: '2026.06.02', views: 688, likes: 34, comments: 11, isNew: false, trending: false,
    matchId: 'm-103', tnId: 'tn-6', tnName: '동작구 봄철 농구왕', homeTeam: '서초유스', awayTeam: '동작드림',
    homeScore: 52, awayScore: 39, round: '결승' },
  { id: 'n7', cat: 'magazine', title: '픽업 vs 게스트, 뭐가 다를까 — 초보 가이드',
    preview: '처음 BDR을 시작하는 멤버를 위한 경기 유형 안내. 개인이 모여 즉석 팀을 짜는 픽업과, 기존 팀의 빈 자리를 채우는 게스트의 차이를 정리했다.',
    date: '2026.05.30', views: 1980, likes: 110, comments: 28, isNew: false, trending: false },
  { id: 'n8', cat: 'event', title: 'BDR PRO 멤버십 출시 기념 — 첫 달 50% 할인',
    preview: '대회 우선 접수·상세 통계·광고 제거를 제공하는 BDR PRO 멤버십이 출시됐다. 출시 기념 첫 달 50% 할인 프로모션이 진행 중이다.',
    date: '2026.05.28', views: 2740, likes: 156, comments: 52, isNew: false, trending: false },
];

// 매치 단신 본문 (linkify 데모용 — /news/match/[id])
window.NEWS_BODY = {
  'n1': [
    '봄맞이 마포컵 결승전이 마포구민체육센터에서 열렸다. {강남BC}와 {서초파이브}는 1쿼터부터 한 치의 양보 없는 접전을 펼쳤다.',
    '3쿼터 종료 시점 58-58 동점. 승부는 4쿼터에서 갈렸다. {김지훈}이 연속 3점슛 두 방을 포함해 8점을 몰아치며 분위기를 가져왔고, 강남BC는 그대로 78-71로 경기를 마무리했다.',
    '{김지훈}은 이날 24득점 8어시스트로 대회 MVP에 선정됐다. "팀원들이 끝까지 믿고 패스해준 덕분"이라며 공을 돌렸다.',
    '강남BC는 이번 우승으로 {봄맞이 마포컵} 2연패를 달성했다. 다음 회차는 9월에 열릴 예정이다.',
  ],
};
window.NEWS_LINKS = {
  '강남BC': '/teams/team-1',
  '서초파이브': '/teams/team-2',
  '김지훈': '/users/u-101',
  '봄맞이 마포컵': '/tournaments/tn-5',
};

// ============================================================
// IU3 — Help + Glossary 데이터
//   ref: IU3a_help_head_250.tsx (FAQ 6 / GLOSSARY 16 / POLICY 6)
//      + IU3b_glossary_head_200.tsx (rich entries 9 — english/icon/예시/link)
//   Glossary 신규 = A-Z chip 인덱스 + 용어 카드 grid + 검색.
// ============================================================
window.HELP_FAQ = [
  { q: '팀 등록은 어떻게 하나요?', a: '상단 메뉴 [팀] → [팀 등록] 버튼으로 최소 3명 이상이 모인 팀을 등록할 수 있습니다. 팀장 1명, 부팀장 1명, 팀원 1명이 기본 구성입니다.' },
  { q: '대회 신청 후 취소할 수 있나요?', a: '접수 마감 3일 전까지는 자유롭게 취소 가능하며, 참가비는 100% 환불됩니다. 이후에는 50%만 환불됩니다.' },
  { q: '레이팅은 어떻게 계산되나요?', a: '기본 1500에서 시작하여, 각 경기의 승패·점수차·상대 레이팅에 따라 매 경기 ±5~±40 변동됩니다.' },
  { q: '픽업과 게스트의 차이는?', a: '픽업은 개인 단위로 모여 즉석 팀을 구성하는 것이고, 게스트는 기존 팀의 부족한 인원을 일회성으로 채우는 역할입니다.' },
  { q: '대회 성적은 어디에 반영되나요?', a: 'OPEN·PRO 대회는 팀 레이팅에 반영되고, 선수별 기록(PPG/APG/RPG)은 개인 프로필과 선수 랭킹에 반영됩니다.' },
  { q: '유료 멤버십은 꼭 필요한가요?', a: '아니요. 기본 기능은 모두 무료입니다. PRO 멤버십은 대회 우선 접수·상세 통계·광고 제거 등 편의 기능입니다.' },
];

// /help 탭 안 mini 용어 (16건 짧은 정의 — 운영 carry)
window.GLOSSARY_MINI = [
  { term: '픽업 (Pick-up)', desc: '사전 팀 구성 없이 현장에서 인원을 모아 즉석으로 진행하는 경기.' },
  { term: '게스트 (Guest)', desc: '기존 팀에 일회성으로 합류하는 외부 선수. 팀원 공백을 메우기 위함.' },
  { term: '연습경기 (Scrimmage)', desc: '팀 간 합의된 비공식 연습경기. 기록은 개인 기록에만 반영.' },
  { term: '픽앤롤 (Pick & Roll)', desc: '스크리너가 스크린 후 골대 방향으로 돌아 공을 받는 공격 전술.' },
  { term: '풀코트 (Full-court)', desc: '농구장 전체를 사용하는 5v5 경기. 국내 아마추어 표준.' },
  { term: '하프코트 (Half-court)', desc: '골대 한 쪽만 사용. 3v3·픽업의 기본 형식.' },
  { term: 'OPEN', desc: '레벨 제한 없는 대회. 모든 팀 참가 가능.' },
  { term: 'PRO', desc: '선수 등록·경력 제한이 있는 상위 레벨 대회.' },
  { term: 'AMATEUR', desc: '비선출·아마추어 전용 레벨. 참가 자격 심사 있음.' },
  { term: '더블 엘리미네이션', desc: '두 번 패할 때까지 탈락하지 않는 대진 방식.' },
  { term: '싱글 엘리미네이션', desc: '한 번 패하면 탈락하는 대진 방식. 짧은 대회에 적합.' },
  { term: '레이팅', desc: '경기 결과 기반 계산되는 팀·선수 실력 지표. 기본값 1500.' },
  { term: '승률', desc: '승 / (승 + 패) × 100. 시즌 단위로 집계.' },
  { term: 'PPG / APG / RPG', desc: '경기당 평균 득점 / 어시스트 / 리바운드.' },
  { term: 'D-N', desc: '접수 마감까지 남은 일 수. D-0은 오늘 마감.' },
  { term: '운영진', desc: '대회·경기·커뮤니티를 관리하는 BDR 공식 스태프.' },
];

// 정책 카드 6 — terms/privacy 활성, 나머지 4 "준비 중"
window.HELP_POLICY = [
  { title: '이용약관', desc: '커뮤니티 참여, 경기·대회 신청·취소 규정 전반', active: true },
  { title: '개인정보처리방침', desc: '수집 항목, 보관 기간, 제3자 제공 여부', active: true },
  { title: '운영정책', desc: '게시물 관리, 제재 기준, 이의 제기 절차', active: false },
  { title: '환불규정', desc: '대회 참가비, 멤버십 결제 환불 기준', active: false },
  { title: '광고·제휴 문의', desc: '브랜드 제휴, 배너 광고, 코트 스폰서십', active: false },
  { title: '저작권 안내', desc: '이미지·영상 사용, 무단 전재 금지 조항', active: false },
];

// 용어 사전 (rich) — A-Z 인덱스용 english 초성 + 예시 + cross-domain link
window.GLOSSARY = [
  { term: '대회', english: 'Tournament', icon: 'emoji_events',
    desc: '정해진 기간 동안 여러 팀이 우승을 다투는 경기 묶음입니다. 토너먼트, 풀리그, 혼합(리그+토너먼트) 방식이 있습니다.',
    ex: '예: BDR 서울 오픈 2026 (16팀 · 2일간 · 풀리그+결선 토너먼트)',
    links: [{ href: '/tournaments', label: '진행 중인 대회' }] },
  { term: '경기', english: 'Game', icon: 'sports_basketball',
    desc: '단일 경기 단위입니다. 픽업·게스트·연습경기 3가지 유형으로 구분되며, 누구나 만들고 참가 신청할 수 있습니다.',
    ex: '예: 강남구 토요일 저녁 픽업, A팀 게스트 모집',
    links: [{ href: '/games', label: '모집 중인 경기' }] },
  { term: '픽업', english: 'Pickup', icon: 'group_add',
    desc: '개인이 서로 모여 즉석에서 팀을 짜는 공개 경기입니다. 개인 단위 참가 신청으로 팀이 구성됩니다.',
    ex: '예: 10명 모집 → 추첨/순서대로 5:5 팀 배정',
    links: [{ href: '/games?type=pickup', label: '픽업 경기' }] },
  { term: '게스트', english: 'Guest', icon: 'person_add',
    desc: '기존 팀이 부족한 인원을 채우기 위해 외부 선수를 초청하는 경기입니다. 주축은 팀원이고, 게스트 몇 명이 합류합니다.',
    ex: '예: A팀 주축 7명 + 게스트 3명 모집',
    links: [{ href: '/games?type=guest', label: '게스트 경기' }] },
  { term: '연습경기', english: 'Practice Match', icon: 'fitness_center',
    desc: '두 팀이 비공식적으로 만나 치르는 경기입니다. 승패나 개인 기록이 공식 랭킹·커리어에 반영되지 않습니다.',
    ex: '예: B팀 vs C팀 주말 연습경기',
    links: [{ href: '/games?type=practice', label: '연습경기' }] },
  { term: '디비전', english: 'Division', icon: 'category',
    desc: '대회 내에서 실력·나이 등 기준으로 나눈 참가 그룹입니다. 한 대회 안에서 여러 디비전이 동시에 진행될 수 있습니다.',
    ex: '예: 오픈 · 챌린저 · 비기너 3개 디비전' },
  { term: '시드', english: 'Seed', icon: 'star',
    desc: '대진 추첨 시 상위 팀에게 부여하는 우선 배정입니다. 강팀끼리 초반에 만나지 않도록 분산 배치하는 역할을 합니다.',
    ex: '예: 직전 대회 4강 이상 팀에게 1~4번 시드' },
  { term: '엘리미네이션', english: 'Elimination', icon: 'account_tree',
    desc: '승자만 다음 라운드로 올라가는 토너먼트 방식입니다. 한 번 지면(싱글) 또는 두 번 지면(더블) 탈락합니다.',
    ex: '예: 8강 → 4강 → 결승 (싱글 엘리미네이션)' },
  { term: '풀리그', english: 'Round Robin', icon: 'swap_horiz',
    desc: '모든 팀이 서로 한 번씩 경기를 치르는 방식입니다. 순위는 누적 승수와 득실점 차로 결정합니다.',
    ex: '예: 4팀 풀리그 → 총 6경기 → 1~4위 확정' },
  { term: '레이팅', english: 'Rating', icon: 'speed',
    desc: '경기 결과를 기반으로 계산되는 팀·선수 실력 지표입니다. 기본값 1500에서 시작해 매 경기 ±5~40 변동됩니다.',
    ex: '예: 강팀 상대 승리 시 큰 폭 상승',
    links: [{ href: '/rankings', label: '랭킹 보기' }] },
  { term: '승률', english: 'Win Rate', icon: 'percent',
    desc: '승 / (승 + 패) × 100 으로 계산하는 비율입니다. 시즌 단위로 집계됩니다.',
    links: [{ href: '/rankings', label: '랭킹 보기' }] },
  { term: '기록', english: 'PPG · APG · RPG', icon: 'query_stats',
    desc: '경기당 평균 득점(PPG) / 어시스트(APG) / 리바운드(RPG). 선수별 기록은 개인 프로필과 선수 랭킹에 반영됩니다.',
    links: [{ href: '/rankings', label: '선수 랭킹' }] },
  { term: '풀코트', english: 'Full-court', icon: 'crop_landscape',
    desc: '농구장 전체를 사용하는 5v5 경기입니다. 국내 아마추어 표준 형식입니다.' },
  { term: '하프코트', english: 'Half-court', icon: 'crop_square',
    desc: '골대 한 쪽만 사용하는 형식입니다. 3v3·픽업의 기본 형식입니다.' },
  { term: '오픈', english: 'OPEN', icon: 'lock_open',
    desc: '레벨 제한 없이 모든 팀이 참가할 수 있는 대회 등급입니다.',
    links: [{ href: '/tournaments', label: '대회 보기' }] },
  { term: '프로', english: 'PRO', icon: 'military_tech',
    desc: '선수 등록·경력 제한이 있는 상위 레벨 대회 등급입니다.' },
  { term: '매너 점수', english: 'Manner', icon: 'handshake',
    desc: '경기 후 상대가 남기는 매너 평가입니다. 평균과 항목 종류만 공개되며 개별 건수는 비공개입니다(BG2).',
    links: [{ href: '/profile', label: '내 매너 보기' }] },
  { term: '운영진', english: 'Staff', icon: 'shield_person',
    desc: '대회·경기·커뮤니티를 관리하는 BDR 공식 스태프입니다.' },
];

// ============================================================
// IU1 — About 데이터  (ref: IU1_about_page.tsx)
//   통계 = 전 Phase cross-domain 집계 (운영 시점 연동 · 예시).
//   ★ 사용자 결정 §6 = 운영진 실명 ❌ → 일반 팀 라벨 보존.
// ============================================================
window.ABOUT_STATS = [
  { v: '20년', k: '커뮤니티 역사', src: 'since 2006' },
  { v: '48,000+', k: '가입 멤버', src: 'users' },
  { v: '320+', k: '등록 팀', src: 'teams' },
  { v: '1,240회', k: '개최 대회', src: 'tournaments' },
];
// 우리가 만드는 것 (가치 6 · 시안 그대로)
window.ABOUT_VALUES = [
  { icon: '🏀', t: '공정한 매치', d: '레이팅 기반 팀 매칭으로 실력에 맞는 경기를 제공합니다' },
  { icon: '📊', t: '투명한 기록', d: '모든 경기 결과와 개인 스탯이 영구적으로 기록·공개됩니다' },
  { icon: '🌆', t: '지역 연결', d: '동네 코트부터 대회까지, 가까운 농구 활동을 빠르게 찾습니다' },
  { icon: '🤝', t: '열린 커뮤니티', d: '초보부터 선출까지, 누구나 편하게 뛸 수 있는 문화를 지향합니다' },
  { icon: '⚖️', t: '공정한 운영', d: '심판 자격·경기 규정·분쟁 처리 모두 공개된 기준을 따릅니다' },
  { icon: '💡', t: '지속가능성', d: '광고 없는 커뮤니티. 운영은 멤버십과 파트너십으로 충당합니다' },
];
// 운영진 — ★ §6 실명 ❌ → 일반 팀 라벨 (실명 노출 0)
window.ABOUT_TEAM = [
  { name: '기획팀', role: '전략 · 기획', since: '2022' },
  { name: '개발팀', role: '프론트엔드 · 백엔드', since: '2022' },
  { name: '운영팀', role: '콘텐츠 · 운영', since: '2023' },
  { name: '디자인팀', role: 'UX · UI', since: '2023' },
  { name: '커뮤니티팀', role: '파트너십 · 소통', since: '2024' },
  { name: '사업팀', role: '비즈니스 개발', since: '2024' },
];
window.ABOUT_PARTNERS = ['NIKE', 'ADIDAS', 'MOLTEN', 'SPALDING', 'UNDER ARMOUR', 'BODY FRIEND', '11번가', 'BDR STUDIO'];

// ============================================================
// IA1 — AdminNews 데이터  (ref: IA1_admin_news_page.tsx)
//   category='news' · status draft/published/rejected → 발행 form + 이력.
//   Phase 4 OA1 + Phase 9 NA1 답습 · 발행 → IU2 + NU1 동기화.
// ============================================================
window.ANW_STATS = { total: 64, published: 48, draft: 12, this_month: 9 };
window.ANW_CATS = [
  { key: 'magazine', label: '매거진', desc: '기획·해설·가이드 기사' },
  { key: 'match', label: '매치 단신', desc: '알기자 자동 작성 · 매치 연결' },
  { key: 'notice', label: '공지', desc: '점검·정책·운영 안내' },
  { key: 'event', label: '이벤트', desc: '대회 모집·프로모션' },
];
// 매치 단신 cross-domain 선택지 (Phase 1 대회 / Phase 2 경기)
window.ANW_TN_OPTIONS = [
  { id: 'tn-5', name: '봄맞이 마포컵' },
  { id: 'tn-4', name: '용산구 어울림배' },
  { id: 'tn-6', name: '동작구 봄철 농구왕' },
  { id: 'tn-3', name: '한강 3x3 챌린지' },
];
window.ANW_MATCH_OPTIONS = [
  { id: 'm-101', name: '결승 · 강남BC vs 서초파이브' },
  { id: 'm-102', name: '8강 · 용산레전드 vs 강북코프' },
  { id: 'm-103', name: '결승 · 서초유스 vs 동작드림' },
];
// 발행 이력 (community_posts category='news')
window.ANW_HISTORY = [
  { id: 'h1', title: '강남BC, 마포컵 우승 — 김지훈 클러치 8연속 득점 MVP', cat: 'match', views: 1842, status: 'published', time: '2026.06.10 18:24', sender: '알기자 → 운영팀 검수' },
  { id: 'h2', title: '용산레전드, 어울림배 4강 진출 — 정성훈 더블더블', cat: 'match', views: 921, status: 'published', time: '2026.06.09 21:02', sender: '알기자 → 운영팀 검수' },
  { id: 'h3', title: '[공지] 6월 정기 점검 안내 — 6/15 새벽 2~4시', cat: 'notice', views: 740, status: 'published', time: '2026.06.05 10:00', sender: '운영팀' },
  { id: 'h4', title: '레이팅 1500은 어떻게 정해질까 — BDR 매칭 시스템 해설', cat: 'magazine', views: 0, status: 'draft', time: '임시저장 2026.06.11 14:30', sender: '운영팀' },
  { id: 'h5', title: '한강 3x3 챌린지 참가팀 모집 — 선착순 16팀', cat: 'event', views: 0, status: 'scheduled', time: '예약 2026.06.15 09:00', sender: '운영팀' },
];
