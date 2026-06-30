/* global React */
// ============================================================
// BDR v2.23 — comm-shared.jsx
// Phase 5 (랭킹 · 커뮤니티 영역) 박제 공용 데이터 + mini components.
// shared.jsx + game-shared.jsx + team-shared.jsx + org-shared.jsx 답습.
//
// 토큰 출처 (PRISMA spec carry-over):
//   community_posts (category / type / title / content / image_url / author_id /
//     team_id / view_count / likes_count / comments_count / is_pinned / status)
//   community_post_likes / comments (commentable_type="CommunityPost")
//   랭킹 = 별 model 없음 → Phase 2 games.final_mvp_user_id + Phase 3 Team.wins/losses/draws
// ============================================================

// ============================================================
// 1) 카테고리 (community_posts.category) — 운영 8종
//    "대회 알기자" = news (BDR NEWS) = Phase 1A 대회 연결 (BC2 cross-domain)
//    notice = 운영진 전용 (CU3 작성 ❌) · news = 검수 후 게시 (draft→published)
// ============================================================
window.COMM_CATEGORIES = [
  { key: 'all',         label: '전체글',   icon: 'apps' },
  { key: 'news',        label: 'BDR NEWS', icon: 'newspaper',   alkija: true },
  { key: 'general',     label: '자유게시판', icon: 'forum' },
  { key: 'recruit',     label: '팀원모집',  icon: 'group_add' },
  { key: 'review',      label: '대회후기',  icon: 'rate_review' },
  { key: 'qna',         label: '질문답변',  icon: 'help' },
  { key: 'info',        label: '정보공유',  icon: 'lightbulb' },
  { key: 'marketplace', label: '농구장터',  icon: 'storefront' },
  { key: 'notice',      label: '공지사항',  icon: 'campaign',    adminOnly: true },
];
// CU3/CU4 작성 가능 카테고리 (notice 제외 — 운영진 전용)
window.COMM_WRITE_CATEGORIES = window.COMM_CATEGORIES.filter(c => c.key !== 'all' && c.key !== 'notice');

window.commCat = function commCat(key) {
  return window.COMM_CATEGORIES.find(c => c.key === key) || { key, label: key, icon: 'tag' };
};

// 유형 (community_posts.type) — Prisma spec
window.COMM_TYPES = [
  { key: 'text',  label: '텍스트',  icon: 'subject',     desc: '글 위주 게시물' },
  { key: 'image', label: '이미지',  icon: 'image',       desc: '사진 갤러리 첨부' },
  { key: 'video', label: '영상',    icon: 'play_circle', desc: '영상 링크 임베드' },
];

// ============================================================
// 2) 커뮤니티 게시글 (community_posts) — CU1 list + CU2 detail
// ============================================================
window.COMM_POSTS = [
  {
    id: 'cp-201', public_id: 'mapo-cup-7-final',
    category: 'news', type: 'image',
    title: '강남BC, 마포컵 Vol.7 우승 — 김지훈 4쿼터 클러치 8연속',
    excerpt: '3쿼터까지 동점이던 결승전, 김지훈의 클러치 8연속 득점으로 강남BC가 마포컵을 들어올렸다.',
    author: { id: 'u-2', nickname: 'BDR 알기자', avatar: 'B', is_official: true },
    team: null,
    view_count: 2840, likes_count: 184, comments_count: 37,
    image_count: 6, is_pinned: true, status: 'published',
    created_at: '2026-05-27T18:20:00',
    // BC2 cross-domain — Phase 1A 대회 (prospectus 후속)
    tournament: { id: 'tn-5', name: '봄맞이 마포컵 Vol.7', org: '마포구체육회' },
  },
  {
    id: 'cp-202', public_id: 'gangnam-spring-preview',
    category: 'news', type: 'text',
    title: '강남구협회장배 봄대회 #8 프리뷰 — 4종별 188팀 격돌',
    excerpt: 'U12·U15·U18·오픈 4개 종별, 역대 최다 188팀. 디펜딩 챔피언 강남BC의 3연패 도전.',
    author: { id: 'u-2', nickname: 'BDR 알기자', avatar: 'B', is_official: true },
    team: null,
    view_count: 1620, likes_count: 92, comments_count: 14,
    image_count: 1, is_pinned: false, status: 'published',
    created_at: '2026-05-26T10:00:00',
    tournament: { id: 'tn-1', name: '강남구협회장배 봄 농구대회', org: '강남구농구협회' },
  },
  {
    id: 'cp-203', public_id: 'weekday-night-guard',
    category: 'recruit', type: 'text',
    title: '[송파] 평일 야간 가드 1명 구합니다 (수·금 9시)',
    excerpt: '송파구민체육센터 수/금 21시 정기런. 가드 포지션 1자리. 매너 좋은 분 환영.',
    author: { id: 'u-4', nickname: '한지원', avatar: '한', is_official: false },
    team: { id: 'tm-7', name: 'rdm 농구단' },
    view_count: 412, likes_count: 8, comments_count: 11,
    image_count: 0, is_pinned: false, status: 'published',
    created_at: '2026-05-29T22:10:00',
    tournament: null,
  },
  {
    id: 'cp-204', public_id: 'crossover-drill-tip',
    category: 'info', type: 'video',
    title: '크로스오버 후 스텝백 3점, 무릎 부담 줄이는 풋워크',
    excerpt: '체중 이동 타이밍만 바꿔도 무릎 부담이 확 줄어듭니다. 30초 슬로우모션 정리.',
    author: { id: 'u-10', nickname: '정성훈', avatar: '정', is_official: false },
    team: null,
    view_count: 988, likes_count: 64, comments_count: 9,
    image_count: 0, is_pinned: false, status: 'published',
    created_at: '2026-05-29T14:30:00',
    tournament: null,
  },
  {
    id: 'cp-205', public_id: 'summer-open-4-review',
    category: 'review', type: 'image',
    title: 'BDR 서머 오픈 #4 예선 후기 — 우리 팀 8강 진출까지',
    excerpt: '첫 출전이라 긴장했는데 조 2위로 8강 진출. 코트별 분위기랑 운영 정리해봤어요.',
    author: { id: 'u-12', nickname: '서태원', avatar: '서', is_official: false },
    team: { id: 'tm-3', name: '서초파이브' },
    view_count: 734, likes_count: 41, comments_count: 6,
    image_count: 4, is_pinned: false, status: 'published',
    created_at: '2026-05-28T20:45:00',
    tournament: { id: 'tn-2', name: 'BDR 서머 오픈 #4', org: 'BDR 운영팀' },
  },
  {
    id: 'cp-206', public_id: 'used-ball-spalding',
    category: 'marketplace', type: 'image',
    title: '스팔딩 TF-1000 실내구 (상태 좋음) 2.5만 직거래',
    excerpt: '실내 전용으로 3개월 사용. 강남역 직거래 또는 택배 가능.',
    author: { id: 'u-13', nickname: '백승호', avatar: '백', is_official: false },
    team: null,
    view_count: 256, likes_count: 3, comments_count: 4,
    image_count: 2, is_pinned: false, status: 'published',
    created_at: '2026-05-28T11:05:00',
    tournament: null,
  },
  {
    id: 'cp-207', public_id: 'zone-defense-qna',
    category: 'qna', type: 'text',
    title: '2-3 지역방어 상대로 외곽 안 통할 때 어떻게 푸세요?',
    excerpt: '하이포스트 투입을 시도하는데 자꾸 끊깁니다. 동호회 레벨 팁 부탁드려요.',
    author: { id: 'u-14', nickname: '강민호', avatar: '강', is_official: false },
    team: null,
    view_count: 521, likes_count: 12, comments_count: 18,
    image_count: 0, is_pinned: false, status: 'published',
    created_at: '2026-05-27T09:15:00',
    tournament: null,
  },
  {
    id: 'cp-208', public_id: 'community-rules-2026',
    category: 'notice', type: 'text',
    title: '[공지] 커뮤니티 이용 규칙 개정 안내 (2026-06 시행)',
    excerpt: '상호 존중 · 광고성 게시물 제한 · 거래 분쟁 가이드 등 일부 조항이 개정됩니다.',
    author: { id: 'u-op', nickname: 'MyBDR 운영', avatar: 'M', is_official: true },
    team: null,
    view_count: 1340, likes_count: 21, comments_count: 0,
    image_count: 0, is_pinned: true, status: 'published',
    created_at: '2026-05-25T09:00:00',
    tournament: null,
  },
];

// CU2 상세 — 좋아요/조회/댓글 본문 (본인 게시글 = is_mine)
window.COMM_DETAIL = (function () {
  const post = window.COMM_POSTS[0]; // 마포컵 알기자 기사
  return {
    ...post,
    is_mine: false,            // 알기자 글 (타인) — 수정/삭제 CTA 미노출
    is_liked: true,
    body: [
      '3쿼터까지 48-48 동점. 마포컵 Vol.7 결승전은 마지막 쿼터에 모든 것이 갈렸다.',
      '4쿼터 중반, 강남BC 김지훈이 연속 8득점을 몰아치며 흐름을 가져왔다. 상대 서초파이브의 지역방어를 외곽 슈팅과 백도어 컷으로 무너뜨린 장면이 결정적이었다.',
      '최종 스코어 72-65. 김지훈은 평균 24.3득점·8어시스트로 대회 MVP에 선정됐다.',
    ],
  };
})();

// CU2 댓글 (운영 comments 모델 확인됨 — commentable_type="CommunityPost")
window.COMM_COMMENTS = [
  { id: 'cm-1', nickname: '윤호석', avatar: '윤', body: '현장에서 봤는데 4쿼터 진짜 소름이었습니다. 클러치 그 자체.', created_at: '2026-05-27T19:02:00', likes: 12, is_author: false },
  { id: 'cm-2', nickname: 'BDR 알기자', avatar: 'B', body: '응원 감사합니다! 시상식 사진도 곧 갤러리에 추가할게요.', created_at: '2026-05-27T19:20:00', likes: 4, is_author: true },
  { id: 'cm-3', nickname: '이태우', avatar: '이', body: '서초파이브도 잘 싸웠어요. 내년엔 우리가...', created_at: '2026-05-27T21:48:00', likes: 7, is_author: false },
];

// CU2 사이드 추천 — "이 작성자의 다른 글" / "이 카테고리 다른 글"
window.COMM_RECO_AUTHOR = window.COMM_POSTS.filter(p => p.author.id === 'u-2' && p.id !== 'cp-201').slice(0, 3);
window.COMM_RECO_CATEGORY = window.COMM_POSTS.filter(p => p.category !== 'news').slice(0, 5);

// CU1 사이드 — 이 주 인기 글 5
window.COMM_HOT = [...window.COMM_POSTS].sort((a, b) => b.view_count - a.view_count).slice(0, 5);

// ============================================================
// 3) 랭킹 (RU1) — 별 model 없음. Phase 2/3 cross-domain (BC1 / BC7)
// ============================================================

// 개인 부문 (game_player_stats 집계) — 부문별 정렬 키
window.RANK_PLAYERS = [
  { rank: 1, id: 'u-21', name: '김지훈', team: '강남BC',     avatar: '김', points: 24.3, rebounds: 6.1, assists: 8.0, manner: 4.9, games: 18 },
  { rank: 2, id: 'u-22', name: '이태우', team: '서초파이브', avatar: '이', points: 21.0, rebounds: 4.2, assists: 6.4, manner: 4.7, games: 16 },
  { rank: 3, id: 'u-23', name: '정성훈', team: '용산레전드', avatar: '정', points: 16.2, rebounds: 9.3, assists: 3.1, manner: 4.8, games: 17 },
  { rank: 4, id: 'u-24', name: '박재현', team: '강남BC',     avatar: '박', points: 18.7, rebounds: 5.5, assists: 4.0, manner: 4.6, games: 18 },
  { rank: 5, id: 'u-25', name: '윤호석', team: '서초파이브', avatar: '윤', points: 14.0, rebounds: 11.2, assists: 2.2, manner: 4.9, games: 15 },
  { rank: 6, id: 'u-26', name: '박서준', team: '강남유스',   avatar: '박', points: 17.4, rebounds: 4.8, assists: 5.2, manner: 4.5, games: 14 },
  { rank: 7, id: 'u-27', name: '한지원', team: 'rdm 농구단', avatar: '한', points: 12.8, rebounds: 3.4, assists: 7.1, manner: 5.0, games: 12 },
  { rank: 8, id: 'u-28', name: '서태원', team: '서초파이브', avatar: '서', points: 13.5, rebounds: 6.7, assists: 3.9, manner: 4.4, games: 16 },
];

// 팀 부문 (Phase 3 Team.wins/losses/draws — BC1)
window.RANK_TEAMS = [
  { rank: 1, id: 'tm-1', name: '강남BC',     city: '서울 강남', color: '#1B3C87', logo: '강', wins: 22, losses: 4, draws: 1, titles: 6 },
  { rank: 2, id: 'tm-3', name: '서초파이브', city: '서울 서초', color: '#0A5132', logo: '서', wins: 19, losses: 6, draws: 0, titles: 3 },
  { rank: 3, id: 'tm-5', name: '용산레전드', city: '서울 용산', color: '#8B0E15', logo: '용', wins: 17, losses: 8, draws: 2, titles: 2 },
  { rank: 4, id: 'tm-7', name: 'rdm 농구단', city: '서울 송파', color: '#0F5FCC', logo: 'R', wins: 15, losses: 9, draws: 1, titles: 1 },
  { rank: 5, id: 'tm-9', name: '강남유스',   city: '서울 강남', color: '#B47A11', logo: 'Y', wins: 14, losses: 10, draws: 0, titles: 1 },
];

// BC1 — 이달의 MVP (Phase 2 games.final_mvp_user_id 최근 30일 집계)
window.RANK_MVP = {
  id: 'u-21', name: '김지훈', team: '강남BC', avatar: '김',
  period: '2026.05',
  mvp_count: 5,          // 최근 30일 final_mvp 횟수
  points: 24.3, assists: 8.0,
  source_game: { id: 'tn-5', name: '봄맞이 마포컵 Vol.7 결승' },
};

// BC1 — 팀 wins 리더 (Phase 3 Team.wins 상위 = RANK_TEAMS[0])
window.RANK_TEAM_LEADER = window.RANK_TEAMS[0];

// 개인 부문 chip 정의 (RU1-A)
window.RANK_PLAYER_SORTS = [
  { key: 'points',   label: '득점',   unit: 'PPG' },
  { key: 'rebounds', label: '리바운드', unit: 'RPG' },
  { key: 'assists',  label: '어시스트', unit: 'APG' },
  { key: 'manner',   label: '매너',   unit: '점' },
];

// ============================================================
// 4) Mini components
// ============================================================

// 상대 시간 포맷
window.commTime = function commTime(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
  if (diff < 604800) return Math.floor(diff / 86400) + '일 전';
  return ('' + d.getFullYear()).slice(2) + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
};

window.commNum = function commNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return '' + n;
};

// CategoryBadge — 카테고리 색상 badge (data-cat → CSS 토큰 매핑)
window.CategoryBadge = function CategoryBadge({ cat, withIcon = false }) {
  const c = window.commCat(cat);
  return (
    <span className="cat-badge" data-cat={cat}>
      {withIcon && <span className="ico material-symbols-outlined">{c.icon}</span>}
      {c.label}
    </span>
  );
};

// PostTypeIcon — 유형(텍스트/이미지/영상) 작은 아이콘
window.PostTypeIcon = function PostTypeIcon({ type, count = 0 }) {
  if (type === 'text') return null;
  const t = window.COMM_TYPES.find(x => x.key === type);
  if (!t) return null;
  return (
    <span className="post-type-ico" title={t.label}>
      <span className="ico material-symbols-outlined">{t.icon}</span>
      {count > 0 && <span>{count}</span>}
    </span>
  );
};

// CommAuthor — 작성자 아바타 + 닉네임 (공식 = verified)
window.CommAuthor = function CommAuthor({ author, size = 26 }) {
  return (
    <span className="comm-author">
      <span className="comm-author__av" style={{ width: size, height: size, fontSize: size * 0.45 }}>{author.avatar}</span>
      <span className="comm-author__name">
        {author.nickname}
        {author.is_official && <span className="ico material-symbols-outlined comm-author__badge" title="공식">verified</span>}
      </span>
    </span>
  );
};

// CommunityAsideNav — 좌측 카테고리 트리 (CU1/CU2/CU3/CU4 공용)
window.CommunityAsideNav = function CommunityAsideNav({ active = 'all' }) {
  return (
    <aside className="comm-aside">
      <a className="comm-aside__write" href="cu3-community-new.html">
        <span className="ico material-symbols-outlined">edit_square</span>
        글 쓰기
      </a>
      <div className="comm-aside__group">게시판</div>
      <nav className="comm-aside__nav">
        {window.COMM_CATEGORIES.map(c => (
          <a key={c.key} className={'comm-aside__item' + (active === c.key ? ' is-active' : '')}
            href={c.key === 'all' ? 'cu1-community-list.html' : 'cu1-community-list.html'}>
            <span className="ico material-symbols-outlined">{c.icon}</span>
            <span className="comm-aside__item-lbl">{c.label}</span>
            {c.alkija && <span className="comm-aside__item-tag">대회</span>}
            {c.adminOnly && <span className="ico material-symbols-outlined comm-aside__item-lock">lock</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
};
