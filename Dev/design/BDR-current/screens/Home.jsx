/* global React */
// ============================================================
// BDR v2.20 — Home (Phase 2B · UC2 보강)
// 운영 박제 대상: /
// 진입: AppNav '홈' / 로고 / 기본 라우트
// 복귀: AppNav 모든 탭 + 본문에서 각 라우트 진입
// 에러: LIVE 0건 → chip row hidden / 본문 정상 표시
//
// BG7 ★★★★ — Hero 카로셀 **위** sticky LIVE chip row 신규
//   AppNav 바로 아래 / Hero 카로셀 위 (PC + 모바일 동일)
//   라이브 0건 = 띠 hidden (carousel 만)
//   라이브 5건+ = 가로 스크롤
//   라이브 chip 클릭 → /live/[id]
// 사용자 결정 §5 = Hero 카로셀 보존 (변경 ❌) / 본 시안은 위 추가 영역만
// AppNav 03 frozen — 본 시안 AppNav 변경 ❌
// A 등급
// ============================================================

function Home() {
  // 시안 데모 — LIVE 0건 / 정상 / 다수 (5+) 토글
  const [liveMode, setLiveMode] = React.useState('many');
  const allLive = window.LIVE_NOW || [];
  const liveItems = liveMode === 'none' ? [] : liveMode === 'one' ? allLive.slice(0, 1) : allLive;

  return (
    <div>
      {/* BG7 — AppNav 바로 아래 / Hero 카로셀 위 sticky LIVE chip row */}
      <window.LiveChipRow items={liveItems} />

      {/* Hero 카로셀 (사용자 결정 §5 — 변경 ❌ / 보존) */}
      <div className="hm-hero">
        <div className="hm-hero__slide">
          <div className="hm-hero__band">
            <div className="eyebrow" style={{color:'rgba(255,255,255,.8)'}}>NOW OPEN · 접수중</div>
            <h1 className="hm-hero__title">강남구협회장배 봄 농구대회</h1>
            <p className="hm-hero__sub">잠실학생체육관 · 2026.05.09 ~ 05.10 · 24팀 모집</p>
            <div className="hm-hero__cta">
              <button className="btn btn--accent btn--touch">지금 신청하기</button>
              <button className="btn" style={{background:'rgba(255,255,255,.14)', color:'#fff', borderColor:'rgba(255,255,255,.32)'}}>전체 대회 →</button>
            </div>
          </div>
          <div className="hm-hero__dots">
            <span className="is-on" /><span /><span /><span />
          </div>
        </div>
        <div className="hm-hero__preserve">
          <span className="ico material-symbols-outlined">lock</span>
          사용자 결정 §5 — Hero 카로셀 변경 ❌ (보존)
        </div>
      </div>

      {/* 시안 데모 토글 */}
      <div style={{maxWidth:1200, margin:'14px auto 0', padding:'0 24px'}}>
        <div className="ctrl" style={{marginLeft:0, marginRight:0, gridTemplateColumns:'1fr'}}>
          <div className="ctrl__group">
            <div className="ctrl__lbl">BG7 라이브 띠 — 데모 (라이브 건수)</div>
            <div className="ctrl__btns">
              <button className={'ctrl__btn' + (liveMode === 'none' ? ' is-on' : '')} onClick={() => setLiveMode('none')}>0건 (띠 hidden)</button>
              <button className={'ctrl__btn' + (liveMode === 'one' ? ' is-on' : '')} onClick={() => setLiveMode('one')}>1건</button>
              <button className={'ctrl__btn' + (liveMode === 'many' ? ' is-on' : '')} onClick={() => setLiveMode('many')}>{allLive.length}건 (현재 mock 전체)</button>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 — 변경 0 (간략 mock) */}
      <div className="gm-page" style={{paddingTop:14}}>
        <div className="gm-page__inner">
          {/* 본인 요약 */}
          <div className="hm-mine">
            <div className="hm-mine__av">RDM</div>
            <div style={{flex:1, minWidth:0}}>
              <div className="hm-mine__name">리딤캡틴 <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-mute)', fontWeight:500}}>@rdm_captain</span></div>
              <div className="hm-mine__sub">
                <span className="hm-mine__lvl">L.8</span>
                <span>rdm 농구단 · 캡틴</span>
              </div>
            </div>
            <div className="hm-mine__upcoming">
              <div style={{fontFamily:'var(--ff-mono)', fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase'}}>다음 경기 · D-1</div>
              <div style={{fontWeight:700, fontSize:13}}>5/29 (목) 20:00 · 강남구민체육센터</div>
            </div>
            <button className="btn btn--sm btn--primary">내 활동</button>
          </div>

          {/* 추천 — 곧 시작할 경기 */}
          <section style={{marginTop:24}}>
            <div className="hm-rail-head">
              <div>
                <div className="eyebrow">GAMES · 곧 시작</div>
                <h2 className="hm-rail-h">곧 시작할 경기</h2>
              </div>
              <a href="p2-ua1-games.html" className="hm-more">전체 보기 →</a>
            </div>
            <div className="hm-rail">
              {window.GM_DATA.list.filter(g => g.status === 'open').slice(0, 4).map(g => (
                <div key={g.id} className="hm-game-mini">
                  <div style={{height:3, background: g.kind === 'pickup' ? 'var(--cafe-blue)' : g.kind === 'guest' ? 'var(--accent)' : 'var(--ok)'}} />
                  <div style={{padding:12, display:'flex', flexDirection:'column', gap:6, flex:1}}>
                    <div style={{display:'flex', gap:5, alignItems:'center'}}>
                      <window.GMKindBadge kind={g.kind} small />
                      <span style={{fontFamily:'var(--ff-mono)', fontSize:10, color:'var(--ink-dim)', fontWeight:700, marginLeft:'auto'}}>{g.area}</span>
                    </div>
                    <div style={{fontFamily:'var(--ff-display)', fontSize:13, fontWeight:800, lineHeight:1.35, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{g.title}</div>
                    <div style={{fontSize:11.5, color:'var(--ink-mute)'}}>{g.starts_at?.slice(5)} · {g.time}</div>
                    <div style={{marginTop:'auto', paddingTop:8, borderTop:'1px dashed var(--border)', display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:'var(--ff-mono)', fontWeight:700, color:'var(--ink-soft)'}}>
                      <span style={{color:'var(--ink-dim)'}}>{g.court}</span>
                      <span>{g.spots_now}/{g.spots_max}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 본문 변경 0 안내 */}
          <div style={{
            marginTop:24, padding:'14px 18px',
            background:'var(--bg-elev)', border:'1px dashed var(--border-strong)',
            borderRadius:'var(--r-md)', textAlign:'center',
            color:'var(--ink-mute)', fontSize:13,
          }}>
            <strong style={{color:'var(--ink-soft)'}}>본 시안 핵심 = BG7 sticky LIVE 띠만</strong>
            <br />
            <span style={{fontSize:12}}>홈 본문 (대회 / 팀 / 코트 / 커뮤니티 등) 모두 v2.16 박제 보존 — 변경 ❌</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Home = Home;
