/* global React */

/**
 * VenueDetail — /venues/[slug] (D등급 P1-8 신규)
 *
 * Why: 공개 SEO 코트 페이지 (비로그인 열람 가능)
 *      검색엔진/공유 링크로 들어온 비로그인 유저 → 가입 유도
 * Pattern: CourtDetail.jsx 의 hero + info 카드 단순화 (예약/일정 hidden)
 *
 * 진입: 외부 검색엔진 (SEO) / 코트 공유 링크
 * 복귀: 비로그인 → /login (예약/모집 클릭 시) / 로그인 → /courts/[id] 자동 redirect 옵션
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점     | 모바일
 *   코트 기본 정보    | CourtDetail ✅ | ✅ hero + info  | SEO/공유  | 1열
 *   지도              | CourtDetail ✅ | ✅ static map    | -        | OK
 *   사진 갤러리       | -        | ✅ 4-up grid       | -        | 2열
 *   리뷰 요약         | -        | ✅ 평점 + 3개      | -        | OK
 *   비로그인 CTA      | -        | ✅ 스티키 카드     | -        | 하단 sticky
 *   로그인 redirect   | -        | ✅ /courts/[id]   | -        | OK
 */

function VenueDetail({ setRoute, isLoggedIn = false }) {
  // 가짜 코트 데이터 (extras-data 의 COURT_DETAIL 활용 가능하지만 SEO 페이지는 단순화)
  const venue = {
    slug: 'jangchung-arena',
    name: '장충체육관',
    addr: '서울 중구 동호로 241',
    type: '실내',
    courts: 2,
    fee: '시간당 ₩30,000부터',
    hours: '06:00 – 23:00',
    parking: '유료 100대',
    locker: '유료 락커',
    phone: '02-2128-2800',
    desc: '서울 중심부의 대표 실내 농구장. 2면 풀코트와 관중석을 갖추고 있어 대회장으로 자주 활용됩니다. 픽업·정기모임이 활발합니다.',
    tags: ['대회장', '픽업 다수', '관중석'],
    rating: 4.6,
    reviewCount: 128,
    upcomingGames: 7,
  };

  const reviews = [
    { name:'jang_player', rating:5, body:'코트 컨디션이 좋고 관중석이 있어 분위기가 살아납니다.' },
    { name:'pickup_lover', rating:5, body:'주말 픽업이 활발해요. 처음 가도 끼기 편합니다.' },
    { name:'coach_kim', rating:4, body:'주차가 유료라 단점, 그 외에는 만족.' },
  ];

  const requireAuth = (action) => () => {
    if (isLoggedIn) {
      // 로그인된 사용자는 풀 기능 페이지로 자동 redirect
      setRoute('courtDetail');
    } else {
      // 비로그인 → 로그인 페이지
      setRoute('login');
    }
  };

  return (
    <div className="page page--wide" style={{paddingBottom:120}}>
      {/* SEO breadcrumb (구조화 데이터 친화) */}
      <nav style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12, flexWrap:'wrap'}} aria-label="Breadcrumb">
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span>코트</span><span>›</span>
        <span>서울 중구</span><span>›</span>
        <span style={{color:'var(--ink)'}}>{venue.name}</span>
      </nav>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:24, alignItems:'flex-start'}}>
        <div>
          {/* HERO */}
          <div className="card" style={{padding:0, overflow:'hidden', marginBottom:14}}>
            <div style={{aspectRatio:'16/9', background:'linear-gradient(135deg, #1a1a1a, #000)', position:'relative', display:'grid', placeItems:'center'}}>
              <span className="material-symbols-outlined" style={{fontSize:80, color:'rgba(255,255,255,0.2)'}}>sports_basketball</span>
              <div style={{position:'absolute', top:14, left:14, display:'flex', gap:6, flexWrap:'wrap'}}>
                {venue.tags.map(t => (
                  <span key={t} style={{background:'rgba(0,0,0,.7)', color:'#fff', fontSize:11, padding:'3px 10px', borderRadius:3, fontWeight:600}}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{padding:'22px 26px'}}>
              <div className="eyebrow" style={{marginBottom:6}}>VENUE · 서울 중구</div>
              <h1 style={{margin:'0 0 8px', fontSize:30, fontWeight:800, letterSpacing:'-0.015em'}}>{venue.name}</h1>
              <div style={{display:'flex', alignItems:'center', gap:12, fontSize:13, color:'var(--ink-mute)', flexWrap:'wrap', marginBottom:12}}>
                <span style={{display:'flex', alignItems:'center', gap:4}}>
                  <span className="material-symbols-outlined" style={{fontSize:16}}>place</span>
                  {venue.addr}
                </span>
                <span style={{color:'var(--border)'}}>·</span>
                <span style={{display:'flex', alignItems:'center', gap:4}}>
                  <span style={{color:'#F59E0B'}}>★</span>
                  <b style={{color:'var(--ink)'}}>{venue.rating}</b>
                  <span style={{color:'var(--ink-dim)'}}>({venue.reviewCount})</span>
                </span>
              </div>
              <p style={{margin:0, fontSize:14, lineHeight:1.7, color:'var(--ink-soft)'}}>{venue.desc}</p>
            </div>
          </div>

          {/* 사진 갤러리 (placeholder) */}
          <div className="card" style={{padding:'18px 22px', marginBottom:14}}>
            <h2 style={{margin:'0 0 12px', fontSize:15, fontWeight:700}}>코트 사진</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{aspectRatio:'1', background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:6, display:'grid', placeItems:'center', color:'var(--ink-dim)', fontSize:11}}>
                  사진 {i}
                </div>
              ))}
            </div>
          </div>

          {/* [Phase 17] 방문 후기 — ContextReviews 통일 */}
          <ContextReviews
            kind="court"
            targetName={venue.name}
            reviews={reviews.map(r => ({
              author: r.name,
              rating: r.rating,
              body: r.body,
              date: r.date || '',
              verified: true,
            }))}
            summary={{ avg: venue.rating?.toFixed?.(1) ?? '4.6', total: venue.reviewCount, dist:[Math.round(venue.reviewCount*0.6), Math.round(venue.reviewCount*0.25), Math.round(venue.reviewCount*0.1), Math.round(venue.reviewCount*0.04), Math.round(venue.reviewCount*0.01)] }}
            onWrite={requireAuth()}
            onViewAll={requireAuth()}
          />
        </div>

        {/* Side */}
        <aside style={{position:'sticky', top:80}}>
          {/* Map */}
          <div className="card" style={{padding:0, overflow:'hidden', marginBottom:14}}>
            <div style={{aspectRatio:'4/3', background:'var(--bg-alt)', display:'grid', placeItems:'center', position:'relative'}}>
              <span className="material-symbols-outlined" style={{fontSize:42, color:'var(--ink-dim)'}}>map</span>
              <div style={{position:'absolute', bottom:10, left:10, right:10, padding:'8px 12px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:6, fontSize:12}}>
                {venue.addr}
              </div>
            </div>
          </div>

          {/* 시설 정보 */}
          <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', color:'var(--ink-dim)', textTransform:'uppercase', marginBottom:12}}>시설 정보</div>
            <div style={{display:'grid', gridTemplateColumns:'80px 1fr', rowGap:9, fontSize:13}}>
              <div style={{color:'var(--ink-dim)'}}>유형</div><div>{venue.type} · {venue.courts}코트</div>
              <div style={{color:'var(--ink-dim)'}}>이용료</div><div>{venue.fee}</div>
              <div style={{color:'var(--ink-dim)'}}>운영시간</div><div>{venue.hours}</div>
              <div style={{color:'var(--ink-dim)'}}>주차</div><div>{venue.parking}</div>
              <div style={{color:'var(--ink-dim)'}}>락커</div><div>{venue.locker}</div>
              <div style={{color:'var(--ink-dim)'}}>전화</div><div>{venue.phone}</div>
            </div>
          </div>

          {/* 비로그인 CTA */}
          {!isLoggedIn ? (
            <div className="card" style={{padding:'18px 22px', marginBottom:14, background:'linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, transparent), transparent)'}}>
              <div style={{fontSize:14, fontWeight:800, marginBottom:6}}>이 코트에서 더 많이 즐기려면</div>
              <ul style={{margin:'0 0 14px', padding:'0 0 0 18px', fontSize:12, color:'var(--ink-soft)', lineHeight:1.8}}>
                <li>{venue.upcomingGames}건의 진행 예정 픽업·게스트 모집</li>
                <li>실시간 예약 가능 시간 확인</li>
                <li>이 코트 멤버 채팅방 참여</li>
              </ul>
              <button className="btn btn--primary btn--xl" onClick={()=>setRoute('signup')} style={{width:'100%'}}>가입하고 시작 →</button>
              <button className="btn" onClick={()=>setRoute('login')} style={{width:'100%', marginTop:8}}>이미 회원이에요</button>
            </div>
          ) : (
            <button className="btn btn--primary btn--xl" onClick={()=>setRoute('courtDetail')} style={{width:'100%'}}>이 코트 풀 페이지 보기 →</button>
          )}

          {/* 공유 */}
          <div style={{display:'flex', gap:6, marginTop:6}}>
            <button className="btn btn--sm" style={{flex:1}}>
              <span className="material-symbols-outlined" style={{fontSize:14}}>share</span> 공유
            </button>
            <button className="btn btn--sm" style={{flex:1}}>
              <span className="material-symbols-outlined" style={{fontSize:14}}>bookmark</span> 저장
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.VenueDetail = VenueDetail;
