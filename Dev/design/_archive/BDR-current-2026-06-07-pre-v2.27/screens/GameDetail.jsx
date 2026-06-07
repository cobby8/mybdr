/* global React */
// ============================================================
// BDR v2.20 — GameDetail (Phase 2B · UA2)
// 운영 박제 대상: /games/[id]
// 진입: Games (UA1) 카드 / Home 추천 / 마이 (UC1) 내 경기 / 알림
// 복귀: 본인 신청 후 새로 진입 시 step indicator 본인 진행 상태 표시
// 에러: status='completed' 분기 시 GameResult variant (UB1) 렌더
//
// BG1 = sidebar "내 신청 현황" step indicator (신청 / 호스트 승인 / 참가 확정)
//   본인 신청 안 한 상태 = step hidden / ApplyPanel "신청하기" CTA 만
//   본인 신청 = step + 단계별 시간 + /profile/activity 딥링크
// BG4 = status='completed' 분기 → UB1 GameResult variant 안내
// A 등급 (AppNav 강제)
// ============================================================

function GameDetail() {
  // 본인 신청 상태 토글 (시안 데모 — 실제는 game_applications 조회)
  const [applyMode, setApplyMode] = React.useState('mine'); // 'guest' | 'mine'
  const game = window.GM_DATA.list.find(g => g.id === 'gm-2'); // 마포 게스트 모집
  const myApp = window.MY_GAMES.find(m => m.game_id === 'gm-2'); // 승인 대기 상태

  return (
    <div className="gm-page">
      <div className="gm-page__inner" style={{maxWidth:1100}}>
        {/* Hero */}
        <div className="gd-hero" data-kind={game.kind}>
          <div className="gd-hero__band">
            <window.GMKindBadge kind={game.kind} />
            <span className="gd-hero__meta">{game.area} · {game.court}</span>
            <window.GMStatusBadge status="open" label="모집중" />
          </div>
          <h1 className="gd-hero__title">{game.title}</h1>
          <div className="gd-hero__sub">
            <div className="gd-hero__when">
              <span className="ico material-symbols-outlined">event</span>
              <span><strong>2026.05.30 (토)</strong> · {game.time} · {game.duration}분</span>
            </div>
            <div className="gd-hero__where">
              <span className="ico material-symbols-outlined">place</span>
              <span>{game.court}</span>
            </div>
            <div className="gd-hero__fee">
              <span className="ico material-symbols-outlined">payments</span>
              <span>참가비 <strong>{game.fee.toLocaleString()}원</strong></span>
            </div>
          </div>
        </div>

        {/* 시안 데모용 토글 */}
        <div className="ctrl" style={{marginTop:14, marginBottom:14, marginLeft:0, marginRight:0, gridTemplateColumns:'1fr'}}>
          <div className="ctrl__group">
            <div className="ctrl__lbl">시안 데모 — 본인 신청 상태 (BG1 step indicator)</div>
            <div className="ctrl__btns">
              <button className={'ctrl__btn' + (applyMode === 'guest' ? ' is-on' : '')} onClick={() => setApplyMode('guest')}>
                미신청 (게스트 view)
              </button>
              <button className={'ctrl__btn' + (applyMode === 'mine' ? ' is-on' : '')} onClick={() => setApplyMode('mine')}>
                신청 완료 (승인 대기)
              </button>
            </div>
          </div>
        </div>

        {/* 2 컬럼 — 본문 / sidebar */}
        <div className="gd-grid">
          <div className="gd-main">
            {/* Summary card */}
            <div className="gm-card">
              <h3 className="gm-card__h"><span className="ico material-symbols-outlined">info</span> 경기 안내</h3>
              <div className="gd-summary">
                <div className="gd-summary__row">
                  <span className="gd-summary__l">호스트</span>
                  <span className="gd-summary__v"><strong>{game.host.name}</strong> · 평점 4.6</span>
                </div>
                <div className="gd-summary__row">
                  <span className="gd-summary__l">종별</span>
                  <span className="gd-summary__v">5x5 게스트 모집 / 자유 매칭</span>
                </div>
                <div className="gd-summary__row">
                  <span className="gd-summary__l">신청 정책</span>
                  <span className="gd-summary__v">
                    {game.auto_approve ? '🟢 자동 승인' : '🟡 호스트 수동 승인'}
                  </span>
                </div>
                {game.guest_allowed && (
                  <div className="gd-summary__row">
                    <span className="gd-summary__l">게스트 조건</span>
                    <span className="gd-summary__v">최소 경력 {game.min_years}년 · 약관 동의 필수</span>
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            <div className="gm-card">
              <h3 className="gm-card__h"><span className="ico material-symbols-outlined">description</span> 호스트 소개</h3>
              <p style={{margin:0, lineHeight:1.7, color:'var(--ink-soft)'}}>
                마포 평일 야간 정기 모임입니다. 실력 무관 환영, 매너 우선. 부상 방지 위해 워밍업 15분 의무. 약속 시간 5분 이상 늦으시면 다음 신청자에게 자리 넘어갑니다.
              </p>
            </div>

            {/* Participant slots (Concept B 5×2) */}
            <div className="gm-card">
              <h3 className="gm-card__h">
                <span className="ico material-symbols-outlined">group</span>
                참가자 ({game.spots_now}/{game.spots_max})
                <span style={{marginLeft:'auto', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-dim)'}}>
                  남은 자리 {game.spots_max - game.spots_now}석
                </span>
              </h3>
              <div className="gd-slots">
                {['박수빈', '김지훈', '이태우', '박재현', '정성훈', '강민호', '윤호석', '한지원', '서태원', null].map((p, i) => (
                  <div key={i} className={'gd-slot' + (p ? ' is-filled' : ' is-empty')}>
                    <div className="gd-slot__avatar">{p ? p[0] : '+'}</div>
                    <div className="gd-slot__name">{p || '빈자리'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="gd-side">
            {/* BG1 — 내 신청 현황 (본인 신청한 경우만 노출) */}
            {applyMode === 'mine' && (
              <div className="gm-card gd-mine">
                <h3 className="gm-card__h">
                  <span className="ico material-symbols-outlined" style={{color:'var(--accent)'}}>where_to_vote</span>
                  내 신청 현황
                  <span className="gd-mine__chip">BG1</span>
                </h3>
                <window.ApplyStep
                  stepIdx={1}
                  status="pending"
                  applied_at="5/27 22:30 신청"
                  compact
                />
                <div className="gd-mine__note">
                  <span className="ico material-symbols-outlined">schedule</span>
                  관리자 승인 대기 중 — 보통 24시간 이내 결과 알림
                </div>
                <a href="#" className="gd-mine__link">
                  마이페이지 "내 경기" 에서 모든 신청 보기
                  <span className="ico material-symbols-outlined">arrow_forward</span>
                </a>
              </div>
            )}

            {/* ApplyPanel (미신청 시) */}
            {applyMode === 'guest' && (
              <div className="gm-card gd-apply">
                <h3 className="gm-card__h"><span className="ico material-symbols-outlined">how_to_reg</span> 신청하기</h3>
                <div className="gd-apply__fee">
                  <span>참가비</span>
                  <strong>{game.fee.toLocaleString()}원</strong>
                </div>
                <div className="gd-apply__progress">
                  <div className="gd-apply__bar">
                    <div className="gd-apply__fill" style={{width: `${game.spots_now / game.spots_max * 100}%`}} />
                  </div>
                  <span>{game.spots_now}/{game.spots_max}명</span>
                </div>
                <button className="btn btn--accent btn--touch" style={{width:'100%', marginTop:10}}>
                  <span className="ico material-symbols-outlined">how_to_reg</span>
                  게스트 신청하기
                </button>
                <div className="gd-apply__hint">
                  호스트 승인 시 알림으로 알려드립니다
                </div>
              </div>
            )}

            {/* Quick info */}
            <div className="gm-card">
              <h3 className="gm-card__h"><span className="ico material-symbols-outlined">share</span> 공유</h3>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                <button className="btn btn--sm"><span className="ico material-symbols-outlined">link</span> 링크</button>
                <button className="btn btn--sm"><span className="ico material-symbols-outlined">share</span> 카카오</button>
                <button className="btn btn--sm"><span className="ico material-symbols-outlined">bookmark</span> 저장</button>
              </div>
            </div>
          </aside>
        </div>

        {/* BG4 분기 안내 (status='completed' 시 UB1 GameResult 으로) */}
        <div style={{
          marginTop:18, padding:'12px 16px',
          background:'var(--cafe-blue-soft)', borderLeft:'3px solid var(--cafe-blue)',
          borderRadius:'0 var(--r-sm) var(--r-sm) 0',
          fontSize:12, color:'var(--cafe-blue-deep)',
          display:'flex', gap:8,
        }}>
          <span className="ico material-symbols-outlined" style={{fontSize:18, flexShrink:0}}>info</span>
          <div>
            <strong>BG4 분기</strong> — status='completed' 시 같은 라우트 (<code>/games/[id]</code>) 에서 UB1 GameResult variant 자동 렌더. 신규 라우트 X / 더보기 가짜링크 룰 통과.
          </div>
        </div>

        {/* Mobile sticky bar */}
        {applyMode === 'guest' && (
          <div className="gd-mobile-sticky">
            <div>
              <div style={{fontSize:11, color:'var(--ink-mute)', fontWeight:700}}>참가비</div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:800}}>{game.fee.toLocaleString()}원</div>
            </div>
            <button className="btn btn--accent btn--touch">게스트 신청</button>
          </div>
        )}
        {applyMode === 'mine' && (
          <div className="gd-mobile-sticky">
            <div style={{flex:1}}>
              <div style={{fontSize:11, color:'var(--accent)', fontWeight:800, letterSpacing:'0.04em'}}>BG1 · 내 신청 현황</div>
              <div style={{fontSize:13, fontWeight:700}}>호스트 승인 대기 — 5/27 22:30 신청</div>
            </div>
            <button className="btn btn--touch">마이로 →</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.GameDetail = GameDetail;
