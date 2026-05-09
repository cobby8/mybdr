/* global React, BOARDS, POSTS, HOT_POSTS, LATEST_POSTS, HOME_STATS, TOURNAMENTS, GAMES, TEAMS, ORGS, OPEN_RUNS, Icon, LevelBadge, Avatar, Poster, NavBadge */

// ============================================================
// 5/10 재설계: BDR 추천 영상 mock — 유튜브 스타일 카드 (5개 + 1 LIVE)
// 운영 src/components/home/recommended-videos.tsx 와 정합 — 5/10 사용자 결정 박제.
// 박제 변경 = NBA 2K 톤 (uppercase + accent 그라디언트) → 유튜브 톤 (mixed case + duration chip + 채널명 + 조회수+시점).
// 박제는 mock 만 — 실제 API (/api/web/youtube/recommend) 연동은 운영 src/ 한정.
// ============================================================
const RECOMMENDED_VIDEOS = [
  { id: 'v1', title: '2026 서울 챌린지 베스트 골 TOP 10', duration: '12:45', channel: '[BDR]동아리농구방', views: '조회수 24.5만', date: '2일 전', accent: 'var(--accent)', isLive: false },
  { id: 'v2', title: '실전 드리블 기술 가이드 — 코트에서 바로 써먹는', duration: '8:20', channel: '[BDR]동아리농구방', views: '조회수 12.8만', date: '1주 전', accent: 'var(--cafe-blue)', isLive: false },
  { id: 'v3', title: 'STORM FC 우승 비결 인터뷰', duration: '15:10', channel: '[BDR]동아리농구방', views: '조회수 5.2만', date: '3일 전', accent: 'var(--ok)', isLive: false },
  { id: 'v4', title: '매치데이 브이로그 — 대회 현장의 열기', duration: '5:45', channel: '[BDR]동아리농구방', views: '조회수 1.9만', date: '22시간 전', accent: 'var(--accent)', isLive: false },
  { id: 'v5', title: 'LIVE — 동호회 최강전 결승전 중계', duration: '', channel: '[BDR]동아리농구방', views: '실시간 1.2천', date: '', accent: 'var(--accent)', isLive: true },
];

// ============================================================
// Phase B — Home (mybdr.kr/ 정합)
//
// 진입: AppNav '홈' 탭 / 로고 클릭 / 직접 접근 (route='home' 또는 default)
// 복귀: AppNav 모든 탭, 본 페이지에서 모든 핵심 라우트 진입 가능
//
// 시스템:
//   - Hero 헤더 grid 1fr auto (eyebrow + h1 + 부제 / 우측 액션)
//   - HeroBento (라이트: 메인 promo + 우 라이브/대회 요약 / 다크: brutalism 포스터)
//   - MySummaryHero (본인 요약 카드 — 로그인 시)
//   - RecommendedRail × 4 (경기 / 대회 / 팀 / 비디오)
//   - NewsFeed + NotableTeams (좌 본문 / 우 사이드바)
//   - 모든 카드 var(--*) 토큰만 / 720px 1열 stack
// ============================================================

function Home({ setRoute, setActiveBoard }) {
  const mainTourney = TOURNAMENTS[0];
  const closingTourney = TOURNAMENTS.find(t => t.status === 'closing') || TOURNAMENTS[1];
  const liveTourney = TOURNAMENTS.find(t => t.status === 'live');
  const liveRun = OPEN_RUNS.find(r => r.live);
  const upcomingGames = GAMES.filter(g => g.status === 'open').slice(0, 6);
  const featuredTeams = [...TEAMS].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const featuredOrgs = ORGS.slice(0, 4);

  return (
    <div className="page home">
      {/* =================================================
          Hero 헤더 — eyebrow + 인사말 + 우측 빠른 액션
          ================================================= */}
      <header style={{
        display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end',
        gap:16, marginBottom:18, flexWrap:'wrap',
      }}>
        <div style={{minWidth:0}}>
          <div className="eyebrow">전국 농구 매칭 플랫폼</div>
          <h1 style={{
            margin:'6px 0 4px',
            fontFamily:'var(--ff-display)',
            fontSize:'var(--fs-h1)',
            fontWeight:800,
            letterSpacing:'-0.015em',
            lineHeight:1.1,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            오늘도 <span style={{color:'var(--accent)'}}>코트</span>에서 만나요
          </h1>
          <div style={{fontSize:13, color:'var(--ink-mute)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
            전국 {HOME_STATS.members.toLocaleString()}명의 플레이어 · 지금 {HOME_STATS.onlineNow}명 접속 중
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8, flex:'0 0 auto'}}>
          <button className="btn btn--sm" onClick={()=>setRoute('search')} aria-label="검색">
            <Icon.search/> 검색
          </button>
          <button className="btn btn--sm btn--accent" onClick={()=>setRoute('createGame')}>
            <Icon.plus/> 모집글 작성
          </button>
        </div>
      </header>

      {/* =================================================
          HeroBento — 좌 메인 promo (대회) + 우 라이브/접수 요약
          ================================================= */}
      <HeroBento
        main={mainTourney}
        closing={closingTourney}
        live={liveTourney}
        liveRun={liveRun}
        setRoute={setRoute}
      />

      {/* =================================================
          MySummaryHero — 본인 요약 (로그인 가정 / 비로그인 → CTA)
          ================================================= */}
      <MySummaryHero setRoute={setRoute}/>

      {/* =================================================
          RecommendedRail #1 — 곧 시작할 경기 (픽업/게스트/스크림)
          ================================================= */}
      <RecommendedRail
        title="곧 시작할 경기"
        eyebrow="GAMES · 픽업 · 게스트"
        more={() => setRoute('games')}
      >
        {upcomingGames.map(g => (
          <GameMiniCard key={g.id} game={g} onClick={() => setRoute('gameDetail')} />
        ))}
      </RecommendedRail>

      {/* =================================================
          RecommendedRail #2 — 진행/접수 대회
          ================================================= */}
      <RecommendedRail
        title="열린 대회"
        eyebrow="TOURNAMENTS"
        more={() => setRoute('match')}
      >
        {TOURNAMENTS.filter(t => ['open','closing','live'].includes(t.status)).map(t => (
          <TourneyMiniCard key={t.id} t={t} onClick={() => setRoute('matchDetail')} />
        ))}
      </RecommendedRail>

      {/* =================================================
          RecommendedRail #2.5 — BDR 추천 영상 (NBA 2K 스타일) ⭐ 5/9 부활
          운영 RecommendedVideos 컴포넌트가 자체 "WATCH NOW" 헤더 보유 (5/9 변경) →
          시안에서는 RecommendedRail eyebrow="WATCH NOW · YOUTUBE" 으로 매핑.
          ================================================= */}
      <RecommendedRail
        title="BDR 추천 영상"
        eyebrow="WATCH NOW · YOUTUBE"
        more={() => window.open('https://www.youtube.com/@BDRBASKET', '_blank')}
      >
        {RECOMMENDED_VIDEOS.map(v => (
          <VideoMiniCard key={v.id} video={v} />
        ))}
      </RecommendedRail>

      {/* =================================================
          본문 (좌) + 사이드바 (우) — with-aside 변형 (우측 280)
          ================================================= */}
      <div className="home__split" style={{
        display:'grid',
        gridTemplateColumns:'minmax(0, 1fr) 300px',
        gap:24, marginTop:32,
      }}>
        <div style={{minWidth:0, display:'flex', flexDirection:'column', gap:24}}>
          {/* 공지 + 인기글 (가로 2분할) */}
          <div className="home__notice-pop" style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
            gap:16,
          }}>
            <NoticeCard setRoute={setRoute} setActiveBoard={setActiveBoard}/>
            <HotPostsCard setRoute={setRoute} setActiveBoard={setActiveBoard}/>
          </div>

          {/* NewsFeed — 방금 올라온 글 (board table) */}
          <NewsFeed setRoute={setRoute} setActiveBoard={setActiveBoard}/>

          {/* RecommendedRail #3 — 주목할 팀 */}
          <RecommendedRail
            title="주목할 팀"
            eyebrow="TEAMS · 레이팅 상위"
            more={() => setRoute('team')}
            inset
          >
            {featuredTeams.map(t => (
              <TeamMiniCard key={t.id} team={t} onClick={() => setRoute('teamDetail')} />
            ))}
          </RecommendedRail>
        </div>

        {/* 사이드바 — 본인 위젯 + 단체 + 통계 */}
        <aside className="home__aside" style={{
          display:'flex', flexDirection:'column', gap:16,
          alignSelf:'start',
        }}>
          <ProfileWidget setRoute={setRoute}/>
          <NotableOrgs orgs={featuredOrgs} setRoute={setRoute}/>
          <CommunityPulse stats={HOME_STATS}/>
        </aside>
      </div>

      {/* =================================================
          모바일 1열 stack 안전장치
          ================================================= */}
      <style>{`
        @media (max-width: 900px) {
          .home__split { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .home h1 { font-size: 22px !important; white-space: normal !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// HeroBento — 좌 promo (대회) + 우 라이브/마감임박 패널
// 라이트: 카페블루(또는 BDR레드 promo) / 다크: brutalism
// ============================================================
function HeroBento({ main, closing, live, liveRun, setRoute }) {
  return (
    <div className="home__bento" style={{
      display:'grid',
      gridTemplateColumns:'minmax(0, 1.6fr) minmax(0, 1fr)',
      gap:14,
      marginBottom:20,
    }}>
      {/* 좌 — 메인 promo */}
      <div className="promo" style={{padding:'28px 28px 24px', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:220}}>
        <div className="promo__accent"/>
        <div>
          <div className="eyebrow" style={{color:'rgba(255,255,255,.78)'}}>NOW OPEN · 접수중</div>
          <h2 style={{margin:'10px 0 8px', fontSize:28, lineHeight:1.15}}>
            {main.title} <span style={{opacity:.85, fontWeight:700, fontSize:18}}>{main.edition}</span>
          </h2>
          <p style={{maxWidth:'52ch'}}>
            {main.subtitle} · {main.court} · {main.dates}
          </p>
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <button className="btn btn--accent" onClick={()=>setRoute('matchDetail')}>지금 신청하기</button>
          <button className="btn" style={{background:'rgba(255,255,255,.14)', color:'#fff', borderColor:'rgba(255,255,255,.32)'}} onClick={()=>setRoute('match')}>
            전체 대회 →
          </button>
        </div>
      </div>

      {/* 우 — 라이브 / 마감임박 / 빠른 진입 */}
      <div className="card" style={{padding:0, display:'flex', flexDirection:'column', minHeight:220}}>
        {live || liveRun ? (
          <button onClick={()=> live ? setRoute('live') : setRoute('games')} style={{
            background:'transparent', border:0, cursor:'pointer', textAlign:'left',
            padding:'14px 16px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <NavBadge variant="live" inline/>
            <div style={{minWidth:0, flex:1}}>
              <div style={{fontWeight:700, fontSize:14, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                {live ? `${live.title} · 경기 중` : `${liveRun.court} · 즉석 매칭`}
              </div>
              <div style={{fontSize:12, color:'var(--ink-mute)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                {live ? live.subtitle : `${liveRun.format} · ${liveRun.on}/${liveRun.on + liveRun.needs}명`}
              </div>
            </div>
            <Icon.chevron style={{color:'var(--ink-dim)'}}/>
          </button>
        ) : null}

        {/* 마감임박 대회 */}
        {closing ? (
          <button onClick={()=>setRoute('matchDetail')} style={{
            background:'transparent', border:0, cursor:'pointer', textAlign:'left',
            padding:'14px 16px', borderBottom:'1px solid var(--border)',
            display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center',
          }}>
            <Poster title={closing.title} edition={closing.edition} accent={closing.accent} width={48} height={48} radius={4}/>
            <div style={{minWidth:0}}>
              <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:2}}>
                <span className="badge badge--red">마감임박</span>
                <span style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{closing.dates}</span>
              </div>
              <div style={{fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                {closing.title} <span style={{color:'var(--ink-mute)', fontWeight:500}}>{closing.edition}</span>
              </div>
              <div style={{fontSize:11, color:'var(--ink-mute)'}}>접수 {closing.applied}/{closing.capacity}팀</div>
            </div>
            <Icon.chevron style={{color:'var(--ink-dim)'}}/>
          </button>
        ) : null}

        {/* 빠른 진입 그리드 */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          flex:1, padding:8,
        }}>
          {[
            ['games', '경기 찾기', Icon.calendar],
            ['court', '코트 찾기', Icon.list],
            ['team', '팀 찾기', Icon.heart],
            ['rank', '랭킹', Icon.eye],
          ].map(([r, label, IconC]) => (
            <button key={r} onClick={()=>setRoute(r)} style={{
              background:'transparent', border:0, cursor:'pointer',
              padding:'10px 12px',
              display:'flex', alignItems:'center', gap:8,
              fontSize:13, fontWeight:600, color:'var(--ink-soft)',
              borderRadius:'var(--radius-chip)',
              transition:'background .15s',
            }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-alt)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <IconC style={{color:'var(--cafe-blue)'}}/>
              {label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .home__bento { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// MySummaryHero — 본인 요약 카드 (로그인 시)
// 운영 my-summary-hero.tsx 정합 (32 위반 → 토큰만 사용)
// ============================================================
function MySummaryHero({ setRoute }) {
  // 가정: 로그인된 상태. 실제 운영은 user 컨텍스트에서 가져옴
  const me = {
    name: '리딤캡틴',
    handle: 'rdm_captain',
    level: 'L.8',
    team: TEAMS[0],
    upcoming: { date: '04.25 (목)', time: '20:30', court: '미사강변체육관', kind: '픽업' },
    badges: [
      { label: '미응답 신청 2건', tone: 'warn', go: 'mygames' },
      { label: '쪽지 3', tone: 'red', go: 'messages' },
    ],
  };

  return (
    <div className="card" style={{
      marginTop:20, padding:0, overflow:'hidden',
      display:'grid',
      gridTemplateColumns:'auto minmax(0, 1fr) auto',
      gap:0, alignItems:'stretch',
    }}>
      {/* 좌 — 팀 컬러 스트립 + 아바타 */}
      <div style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'18px 20px',
        borderRight:'1px solid var(--border)',
        background:'linear-gradient(135deg, var(--bg-alt), var(--bg-elev))',
      }}>
        <Avatar tag={me.team.tag} color={me.team.color} ink={me.team.ink} size={52} radius={6}/>
        <div style={{minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:15, marginBottom:2}}>
            {me.name}
            <span style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-mute)', fontWeight:500}}>@{me.handle}</span>
          </div>
          <div style={{fontSize:12, color:'var(--ink-mute)', display:'flex', alignItems:'center', gap:6}}>
            <span className="badge badge--soft">{me.level}</span>
            <span style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{me.team.name} · 캡틴</span>
          </div>
        </div>
      </div>

      {/* 중 — 다음 일정 + 알림 뱃지 */}
      <div style={{padding:'16px 20px', display:'flex', flexDirection:'column', gap:10, minWidth:0}}>
        <div style={{display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap'}}>
          <span style={{fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-dim)'}}>
            다음 경기
          </span>
          <span style={{fontFamily:'var(--ff-mono)', fontSize:13, color:'var(--cafe-blue-deep)', fontWeight:700}}>
            D-3
          </span>
        </div>
        <div style={{fontWeight:700, fontSize:15, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {me.upcoming.date} {me.upcoming.time} · {me.upcoming.court}
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {me.badges.map(b => (
            <button key={b.label} onClick={()=>setRoute(b.go)}
              className={`badge ${b.tone === 'red' ? 'badge--red' : 'badge--soft'}`}
              style={{cursor:'pointer', border:0, padding:'4px 10px'}}>
              {b.label} →
            </button>
          ))}
        </div>
      </div>

      {/* 우 — 빠른 액션 */}
      <div style={{
        padding:'16px 20px', display:'flex', flexDirection:'column', gap:6,
        borderLeft:'1px solid var(--border)',
        justifyContent:'center',
        background:'var(--bg-alt)',
      }}>
        <button className="btn btn--sm btn--primary" onClick={()=>setRoute('mygames')}>
          내 경기
        </button>
        <button className="btn btn--sm" onClick={()=>setRoute('profile')}>
          프로필
        </button>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .home .card[style*="auto minmax"] { grid-template-columns: 1fr !important; }
          .home .card[style*="auto minmax"] > div { border-right: 0 !important; border-left: 0 !important; border-bottom: 1px solid var(--border); }
          .home .card[style*="auto minmax"] > div:last-child { border-bottom: 0; flex-direction: row !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// RecommendedRail — 가로 스크롤 추천 캐러셀
// inset: 본문 내부에 들어갈 때 (사이드바와 같이 줄어듦)
// ============================================================
function RecommendedRail({ title, eyebrow, more, children, inset = false }) {
  const cards = React.Children.toArray(children);
  return (
    <section style={{marginTop: inset ? 0 : 28}}>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12, gap:12}}>
        <div style={{minWidth:0}}>
          {eyebrow && <div className="eyebrow" style={{marginBottom:2}}>{eyebrow}</div>}
          <h3 style={{margin:0, fontSize:18, fontWeight:800, letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
            {title}
          </h3>
        </div>
        {more && (
          <button onClick={more} style={{
            background:'transparent', border:0, cursor:'pointer',
            fontSize:12, color:'var(--ink-mute)', whiteSpace:'nowrap', flex:'0 0 auto',
          }}>
            전체 보기 →
          </button>
        )}
      </div>
      <div style={{
        display:'grid',
        gridAutoFlow:'column',
        gridAutoColumns: inset ? 'minmax(220px, 1fr)' : 'minmax(260px, 1fr)',
        gap:12,
        overflowX:'auto',
        scrollSnapType:'x mandatory',
        paddingBottom:6,
      }}>
        {cards.map((c, i) => (
          <div key={i} style={{scrollSnapAlign:'start', minWidth:0}}>{c}</div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// GameMiniCard — 경기(픽업/게스트/스크림) 미니 카드
// ============================================================
function GameMiniCard({ game, onClick }) {
  const kindLabel = { pickup: '픽업', guest: '게스트', scrimmage: '연습' };
  const kindColor = { pickup: 'var(--cafe-blue)', guest: 'var(--accent)', scrimmage: 'var(--ok)' };
  const pct = (game.applied / game.spots) * 100;
  const isClosing = game.status === 'closing';
  return (
    <div className="card" onClick={onClick} style={{
      padding:0, overflow:'hidden', cursor:'pointer',
      display:'flex', flexDirection:'column', height:'100%',
    }}>
      <div style={{height:3, background: kindColor[game.kind]}}/>
      <div style={{padding:'12px 14px 10px', flex:1, display:'flex', flexDirection:'column', gap:8, minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <span className="badge" style={{background: kindColor[game.kind], color:'#fff', borderColor:'transparent'}}>
            {kindLabel[game.kind]}
          </span>
          {isClosing && <span className="badge badge--red">마감</span>}
          <span style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)', marginLeft:'auto', whiteSpace:'nowrap'}}>
            {game.area}
          </span>
        </div>
        <div style={{
          fontWeight:700, fontSize:13.5, lineHeight:1.4, color:'var(--ink)',
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          overflow:'hidden',
        }}>
          {game.title}
        </div>
        <div style={{fontSize:12, color:'var(--ink-mute)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
          {game.date} · {game.time}
        </div>
      </div>
      <div style={{padding:'10px 14px 12px', borderTop:'1px dashed var(--border)'}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4}}>
          <span style={{color:'var(--ink-dim)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'60%'}}>{game.court}</span>
          <span style={{fontFamily:'var(--ff-mono)', fontWeight:700, color: isClosing ? 'var(--accent)' : 'var(--ink-soft)'}}>
            {game.applied}/{game.spots}
          </span>
        </div>
        <div style={{height:3, background:'var(--bg-alt)', borderRadius:2, overflow:'hidden'}}>
          <div style={{width:`${pct}%`, height:'100%', background: isClosing ? 'var(--accent)' : kindColor[game.kind]}}/>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TourneyMiniCard — 대회 미니 카드 (Poster + 메타)
// ============================================================
function TourneyMiniCard({ t, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{
      padding:0, overflow:'hidden', cursor:'pointer',
      display:'flex', flexDirection:'column', height:'100%',
    }}>
      <Poster title={t.title} edition={t.edition} accent={t.accent} height={110} radius={0}/>
      <div style={{padding:'12px 14px 14px', display:'flex', flexDirection:'column', gap:6, flex:1}}>
        <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
          {t.status === 'live' && <NavBadge variant="live" inline/>}
          {t.status === 'closing' && <span className="badge badge--red">마감임박</span>}
          {t.status === 'open' && <span className="badge badge--soft">접수중</span>}
          <span style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)', marginLeft:'auto'}}>
            {t.applied}/{t.capacity}팀
          </span>
        </div>
        <div style={{
          fontSize:12, color:'var(--ink-mute)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {t.court} · {t.dates}
        </div>
        <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:'auto'}}>
          {t.format}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VideoMiniCard — BDR 추천 영상 미니 카드 (유튜브 스타일) ⭐ 5/10 재설계
// 운영 src/components/home/recommended-videos.tsx 정합:
//   - 썸네일 16:9 + 좌상 LIVE 배지 + 우하 duration chip (검정 반투명)
//   - 제목 line-clamp 2줄 / fontWeight 600 (mixed case — uppercase 제거)
//   - 채널명 작은 회색 (ink-mute)
//   - 메타 (조회수 · 시점) 더 작은 회색
// 시안은 mock 데이터 (썸네일 = accent 그라디언트 / 실제 운영은 YouTube 썸네일).
// 변경 사유: 사용자 평소 영상 콘텐츠 = 유튜브 → 유튜브 카드 = 친숙한 스캔 패턴.
// ============================================================
function VideoMiniCard({ video }) {
  return (
    <div style={{
      cursor:'pointer',
      display:'flex', flexDirection:'column', height:'100%',
      background:'transparent', // 카드 wrapper border 제거 (유튜브 톤)
    }}>
      {/* 썸네일 — mock: accent 그라디언트 + play_arrow 아이콘 (실제 운영은 YouTube 썸네일) */}
      <div style={{
        aspectRatio:'16 / 9', position:'relative', overflow:'hidden',
        borderRadius:6,
        background:`linear-gradient(135deg, ${video.accent}, var(--bg-elev))`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {/* 중앙 재생 아이콘 (워터마크) */}
        <div style={{
          fontSize:38, color:'rgba(255,255,255,.45)', fontWeight:900,
        }}>▶</div>
        {/* LIVE 뱃지 — 좌상단 */}
        {video.isLive && (
          <span style={{
            position:'absolute', top:6, left:6,
            background:'var(--accent)', color:'#fff',
            fontSize:10, fontWeight:800, letterSpacing:'.04em',
            padding:'3px 7px', borderRadius:3,
            display:'flex', alignItems:'center', gap:4,
          }}>
            <span style={{
              width:5, height:5, borderRadius:'50%',
              background:'#fff',
            }}/>
            LIVE
          </span>
        )}
        {/* duration chip — 우하단 (LIVE 일 때 미표시) */}
        {!video.isLive && video.duration && (
          <span style={{
            position:'absolute', bottom:6, right:6,
            background:'rgba(0,0,0,.85)', color:'#fff',
            fontSize:11, fontWeight:700,
            fontVariantNumeric:'tabular-nums',
            padding:'2px 5px', borderRadius:3, lineHeight:1.3,
          }}>
            {video.duration}
          </span>
        )}
      </div>
      {/* 정보 영역 — 제목 (mixed case) + 채널명 + 메타 */}
      <div style={{
        padding:'8px 2px 0', flex:1,
        display:'flex', flexDirection:'column',
      }}>
        <h4 style={{
          margin:0, fontSize:13, fontWeight:600,
          color:'var(--ink)', lineHeight:1.35,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          overflow:'hidden', wordBreak:'break-word',
        }}>
          {video.title}
        </h4>
        {/* 채널명 — 작은 mute 색 */}
        {video.channel && (
          <div style={{
            marginTop:4, fontSize:11, fontWeight:500,
            color:'var(--ink-mute)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            {video.channel}
          </div>
        )}
        {/* 메타 (조회수 · 시점) — 더 작은 dim 색 */}
        {(video.views || video.date) && (
          <div style={{
            marginTop:2, fontSize:11,
            color:'var(--ink-dim, var(--ink-mute))',
            display:'flex', alignItems:'center', gap:4, flexWrap:'wrap',
          }}>
            {video.views && <span>{video.views}</span>}
            {video.views && video.date && <span aria-hidden="true">·</span>}
            {video.date && <span>{video.date}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TeamMiniCard — 팀 미니 카드 (로고 + 이름 + 레이팅)
// ============================================================
function TeamMiniCard({ team, onClick }) {
  const winRate = Math.round((team.wins / (team.wins + team.losses)) * 100);
  return (
    <div className="card" onClick={onClick} style={{
      padding:'14px', cursor:'pointer',
      display:'flex', alignItems:'center', gap:12, height:'100%', minWidth:0,
    }}>
      <Avatar tag={team.tag} color={team.color} ink={team.ink} size={44} radius={6}/>
      <div style={{minWidth:0, flex:1}}>
        <div style={{
          fontWeight:700, fontSize:14, color:'var(--ink)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{team.name}</div>
        <div style={{fontSize:11, color:'var(--ink-mute)', display:'flex', gap:8}}>
          <span>{team.wins}승 {team.losses}패</span>
          <span style={{color:'var(--ink-dim)'}}>·</span>
          <span style={{fontFamily:'var(--ff-mono)'}}>{winRate}%</span>
        </div>
      </div>
      <div style={{
        fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:800,
        color:'var(--cafe-blue-deep)', flex:'0 0 auto',
      }}>
        {team.rating}
      </div>
    </div>
  );
}

// ============================================================
// NoticeCard — 공지 (운영팀)
// ============================================================
function NoticeCard({ setRoute, setActiveBoard }) {
  const notices = POSTS.filter(p => p.board === 'notice').slice(0, 4);
  return (
    <section className="card" style={{padding:0, display:'flex', flexDirection:'column'}}>
      <header style={{padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <span style={{
            display:'inline-block', width:3, height:14, background:'var(--accent)',
          }}/>
          <span style={{fontWeight:700, fontSize:14}}>공지사항</span>
        </div>
        <button onClick={()=>{setActiveBoard('notice'); setRoute('board');}} style={{
          background:'transparent', border:0, cursor:'pointer',
          fontSize:11, color:'var(--ink-mute)',
        }}>
          전체 보기 →
        </button>
      </header>
      <div style={{flex:1}}>
        {notices.map((p, i) => (
          <button key={p.id} onClick={()=>setRoute('post')} style={{
            background:'transparent', border:0, cursor:'pointer',
            width:'100%', textAlign:'left',
            padding:'10px 16px',
            borderBottom: i < notices.length - 1 ? '1px solid var(--border)' : 0,
            display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center',
            color:'var(--ink)',
          }}>
            <span style={{
              fontSize:10, fontWeight:800, padding:'2px 6px',
              background: p.pinned ? 'var(--accent)' : 'var(--bg-alt)',
              color: p.pinned ? '#fff' : 'var(--ink-mute)',
              borderRadius:3, letterSpacing:'.04em', flex:'0 0 auto',
            }}>
              {p.pinned ? '고정' : '공지'}
            </span>
            <span style={{
              fontSize:13, fontWeight:500,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{p.title}</span>
            <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', flex:'0 0 auto'}}>
              {p.date.slice(5)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// HotPostsCard — 인기글
// ============================================================
function HotPostsCard({ setRoute, setActiveBoard }) {
  return (
    <section className="card" style={{padding:0, display:'flex', flexDirection:'column'}}>
      <header style={{padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <span style={{
            display:'inline-block', width:3, height:14, background:'var(--cafe-blue)',
          }}/>
          <span style={{fontWeight:700, fontSize:14}}>인기글</span>
        </div>
        <button onClick={()=>{setActiveBoard('free'); setRoute('board');}} style={{
          background:'transparent', border:0, cursor:'pointer',
          fontSize:11, color:'var(--ink-mute)',
        }}>
          전체 보기 →
        </button>
      </header>
      <div style={{flex:1}}>
        {HOT_POSTS.map((p, i) => (
          <button key={p.id} onClick={()=>setRoute('post')} style={{
            background:'transparent', border:0, cursor:'pointer',
            width:'100%', textAlign:'left',
            padding:'10px 16px',
            borderBottom: i < HOT_POSTS.length - 1 ? '1px solid var(--border)' : 0,
            display:'grid', gridTemplateColumns:'18px 1fr auto', gap:10, alignItems:'center',
            color:'var(--ink)',
          }}>
            <span style={{
              fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:800,
              color: i < 3 ? 'var(--accent)' : 'var(--ink-dim)',
              textAlign:'center',
            }}>
              {i + 1}
            </span>
            <span style={{
              fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              fontWeight: i < 3 ? 600 : 500,
            }}>
              {p.title}
              {p.comments > 0 && <span style={{color:'var(--accent)', fontWeight:700, fontSize:11, marginLeft:4}}>[{p.comments}]</span>}
            </span>
            <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', flex:'0 0 auto'}}>
              {p.views > 999 ? `${(p.views/1000).toFixed(1)}k` : p.views}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// NewsFeed — 방금 올라온 글 (간소화 board feed)
// 운영 news-feed.tsx 정합 (16 위반 → 토큰만)
// ============================================================
function NewsFeed({ setRoute, setActiveBoard }) {
  const [tab, setTab] = useState('all');
  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'free', label: '자유' },
    { id: 'match', label: '매치' },
    { id: 'team', label: '팀원' },
    { id: 'review', label: '후기' },
  ];
  const shown = tab === 'all'
    ? LATEST_POSTS
    : LATEST_POSTS.filter(p => p.board === tab);

  return (
    <section>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12, gap:12, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">COMMUNITY · 방금</div>
          <h3 style={{margin:'4px 0 0', fontSize:18, fontWeight:800, letterSpacing:'-0.01em'}}>
            방금 올라온 글
          </h3>
        </div>
        <button onClick={()=>{setActiveBoard('free'); setRoute('board');}} style={{
          background:'transparent', border:0, cursor:'pointer',
          fontSize:12, color:'var(--ink-mute)',
        }}>
          전체 보기 →
        </button>
      </div>

      {/* Filter chips */}
      <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:12}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background: tab === t.id ? 'var(--cafe-blue-soft)' : 'transparent',
            color: tab === t.id ? 'var(--cafe-blue-deep)' : 'var(--ink-mute)',
            border:`1px solid ${tab === t.id ? 'var(--cafe-blue-hair)' : 'var(--border)'}`,
            borderRadius:'var(--radius-chip)',
            padding:'5px 11px',
            fontSize:12, fontWeight: tab === t.id ? 700 : 500,
            cursor:'pointer',
            whiteSpace:'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Compact feed */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        {shown.length === 0 && (
          <div style={{padding:'40px 20px', textAlign:'center', color:'var(--ink-mute)', fontSize:13}}>
            아직 새 글이 없습니다.
          </div>
        )}
        {shown.map((p, i) => (
          <button key={p.id} onClick={()=>setRoute('post')} style={{
            background:'transparent', border:0, cursor:'pointer',
            width:'100%', textAlign:'left',
            padding:'12px 16px',
            borderBottom: i < shown.length - 1 ? '1px solid var(--border)' : 0,
            display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, alignItems:'center',
            color:'var(--ink)',
          }}>
            <span className="badge badge--soft" style={{flex:'0 0 auto'}}>
              {BOARDS.find(b => b.id === p.board)?.name || p.board}
            </span>
            <div style={{minWidth:0}}>
              <div style={{
                fontSize:14, fontWeight:500,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                marginBottom:2,
              }}>
                {p.hasImage && <Icon.image style={{color:'var(--ink-dim)', marginRight:4, verticalAlign:-1}}/>}
                {p.title}
                {p.comments > 0 && <span style={{color:'var(--accent)', fontWeight:700, fontSize:12, marginLeft:4}}>[{p.comments}]</span>}
                {p.isNew && <span className="badge badge--new" style={{marginLeft:6}}>N</span>}
              </div>
              <div style={{fontSize:11, color:'var(--ink-dim)', display:'flex', gap:6, alignItems:'center'}}>
                <span>{p.author}</span>
                <span>·</span>
                <span style={{fontFamily:'var(--ff-mono)'}}>{p.date.slice(5)}</span>
                <span>·</span>
                <span style={{fontFamily:'var(--ff-mono)'}}>조회 {p.views}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// ProfileWidget — 사이드바 본인 위젯 (운영 profile-widget.tsx 정합, 21 위반 → 토큰만)
// ============================================================
function ProfileWidget({ setRoute }) {
  return (
    <section className="card" style={{padding:'16px', display:'flex', flexDirection:'column', gap:12}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <Avatar tag="RDM" color={TEAMS[0].color} ink="#fff" size={40} radius={6}/>
        <div style={{minWidth:0, flex:1}}>
          <div style={{fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>리딤캡틴</div>
          <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>L.8 · 412 글</div>
        </div>
      </div>
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6,
        padding:'10px 0',
        borderTop:'1px solid var(--border)',
        borderBottom:'1px solid var(--border)',
      }}>
        {[
          ['승률', '78%'],
          ['경기', '34'],
          ['평점', '8.4'],
        ].map(([k, v]) => (
          <div key={k} style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--ff-mono)', fontSize:14, fontWeight:800, color:'var(--ink)'}}>{v}</div>
            <div style={{fontSize:10, color:'var(--ink-dim)', letterSpacing:'.04em', textTransform:'uppercase'}}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:4}}>
        {[
          ['mygames', '내 경기', '3'],
          ['saved', '저장한 글', '12'],
          ['messages', '쪽지함', '3'],
          ['notifications', '알림', '8'],
        ].map(([go, label, n]) => (
          <button key={go} onClick={()=>setRoute(go)} style={{
            background:'transparent', border:0, cursor:'pointer',
            width:'100%', textAlign:'left',
            padding:'7px 8px', borderRadius:'var(--radius-chip)',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            color:'var(--ink-soft)', fontSize:13,
          }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-alt)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span>{label}</span>
            <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>{n}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// NotableOrgs — 사이드바 단체 추천
// ============================================================
function NotableOrgs({ orgs, setRoute }) {
  return (
    <section className="card" style={{padding:0, overflow:'hidden'}}>
      <header style={{padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{fontWeight:700, fontSize:13}}>추천 단체</div>
        <button onClick={()=>setRoute('orgs')} style={{
          background:'transparent', border:0, cursor:'pointer',
          fontSize:11, color:'var(--ink-mute)',
        }}>더 보기 →</button>
      </header>
      <div>
        {orgs.map((o, i) => (
          <button key={o.id} onClick={()=>setRoute('orgDetail')} style={{
            background:'transparent', border:0, cursor:'pointer',
            width:'100%', textAlign:'left',
            padding:'10px 16px',
            borderBottom: i < orgs.length - 1 ? '1px solid var(--border)' : 0,
            display:'flex', alignItems:'center', gap:10,
            color:'var(--ink)',
          }}>
            <Avatar tag={o.tag} color={o.color} ink="#fff" size={32} radius={4}/>
            <div style={{minWidth:0, flex:1}}>
              <div style={{
                fontWeight:600, fontSize:13,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>{o.name}</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
                {o.kind} · {o.teams}팀 · {o.members}명
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// CommunityPulse — 사이드바 통계
// ============================================================
function CommunityPulse({ stats }) {
  const items = [
    ['전체 회원', stats.members.toLocaleString()],
    ['지금 접속', stats.onlineNow.toLocaleString()],
    ['오늘의 글', stats.postsToday.toLocaleString()],
    ['진행중 대회', stats.tournaments.toLocaleString()],
  ];
  return (
    <section className="card" style={{padding:'14px 16px'}}>
      <div style={{
        fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase',
        color:'var(--ink-dim)', marginBottom:10,
      }}>
        커뮤니티 펄스
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
        {items.map(([k, v]) => (
          <div key={k} style={{
            padding:'10px 12px',
            background:'var(--bg-alt)',
            borderRadius:'var(--radius-chip)',
          }}>
            <div style={{fontFamily:'var(--ff-mono)', fontSize:18, fontWeight:800, lineHeight:1, color:'var(--ink)'}}>{v}</div>
            <div style={{fontSize:10, color:'var(--ink-dim)', letterSpacing:'.04em', textTransform:'uppercase', marginTop:4}}>{k}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

window.Home = Home;
