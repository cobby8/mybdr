/* global React */
// ============================================================
// BDR v2.21 — TeamManage (TU3 · Phase 3B · 신규 hub)
// 운영 박제 대상: /teams/manage
// 진입: 더보기 등록·예약 → 팀 관리 / TU5 마이페이지 "내 팀" → 더보기
// 복귀: 카드 클릭 → /teams/[id]/manage (TU4)
// 에러: N=0 빈 상태 + /teams + /teams/new CTA
//
// 신규 박제 (운영 357 line · 0/1/N 분기 시각 부족):
//   ① N=0 → 빈 상태 + /teams 둘러보기 + /teams/new 등록 2 CTA
//   ② N=1 → auto redirect (logic 기존 / 시안 UI 0)
//   ③ N≥2 → 카드 그리드 (TeamCard variant="manage")
// A 등급
// ============================================================

function TeamManage() {
  const [variant, setVariant] = React.useState('N');  // '0' / '1' / 'N'
  const myTeams = window.MY_TEAMS;

  // variant='1' = 1 팀만 노출
  const list = variant === '0' ? [] : variant === '1' ? [myTeams[0]] : myTeams;

  return (
    <div className="gm-page">
      <div className="gm-page__inner">
        <header className="gm-page__head">
          <window.Crumbs trail={['홈', '더보기', '팀 관리']}/>
          <div className="eyebrow" style={{marginTop:8}}>/teams/manage · 운영 팀 hub</div>
          <h1 className="gm-page__title">팀 관리</h1>
          <p className="gm-page__sub">내가 캡틴 / 매니저 / 부캡틴인 팀만 표시 — 멤버만인 팀은 /teams/[id] 에서 확인.</p>
        </header>

        {/* Variant toggle — 시안용만 (실제 운영 = role / 팀 개수 자동 분기) */}
        <div className="tu3-variants">
          <span className="tu3-variants__lbl">시안 분기</span>
          <button className={'ctrl__btn' + (variant === '0' ? ' is-on' : '')} onClick={()=>setVariant('0')}>N = 0 (빈 상태)</button>
          <button className={'ctrl__btn' + (variant === '1' ? ' is-on' : '')} onClick={()=>setVariant('1')}>N = 1 (auto redirect)</button>
          <button className={'ctrl__btn' + (variant === 'N' ? ' is-on' : '')} onClick={()=>setVariant('N')}>N ≥ 2 (그리드)</button>
        </div>

        {/* Hero */}
        {variant !== '0' && (
          <div className="tu3-hero">
            <div className="tu3-hero__count">{list.length}</div>
            <div className="tu3-hero__body">
              <h2 className="tu3-hero__title">운영 중인 팀 {list.length}개</h2>
              <p className="tu3-hero__sub">
                {variant === '1' ? '1팀 — 곧 해당 팀 관리 화면으로 이동합니다.' : '카드를 클릭해 멤버 / 가입 신청 / 권한 위임 등을 관리하세요.'}
              </p>
            </div>
            <div className="tu3-hero__cta">
              <a className="btn btn--ghost" href="tu1-teams.html">팀 둘러보기</a>
              <a className="btn btn--accent" href="#">+ 팀 등록</a>
            </div>
          </div>
        )}

        {/* N = 0 빈 상태 */}
        {variant === '0' && (
          <div className="tu3-empty">
            <div className="tu3-empty__icon material-symbols-outlined">groups</div>
            <h2 className="tu3-empty__title">운영 중인 팀이 없습니다</h2>
            <p className="tu3-empty__sub">팀을 만들거나, 기존 팀에 가입해서 활동을 시작하세요.</p>
            <div className="tu3-empty__cta">
              <a className="btn btn--touch" href="tu1-teams.html">팀 둘러보기</a>
              <a className="btn btn--accent btn--touch" href="#">+ 팀 등록</a>
            </div>
          </div>
        )}

        {/* N = 1 redirect 안내 (실제 운영은 즉시 redirect — 시안은 안내 카드) */}
        {variant === '1' && (
          <div className="tu3-redirect">
            <span className="tu3-redirect__icon material-symbols-outlined">double_arrow</span>
            <div className="tu3-redirect__body">
              <h3 className="tu3-redirect__title">{list[0].name} 관리 화면으로 이동합니다</h3>
              <p className="tu3-redirect__sub">운영 중인 팀이 1개일 때는 자동으로 해당 팀 관리 화면으로 이동합니다.</p>
              <p className="tu3-redirect__note">
                /teams/manage → /teams/{list[0].id}/manage · 자동 redirect (운영 logic 유지)
              </p>
            </div>
            <a className="btn btn--accent btn--touch" href="tu4-team-manage-detail.html">바로 가기 →</a>
          </div>
        )}

        {/* N ≥ 2 그리드 */}
        {variant === 'N' && (
          <div className="tu3-grid">
            {list.map(t => (
              <window.TeamCard key={t.id} team={t} variant="manage"/>
            ))}
          </div>
        )}

        {/* 모든 분기에 공통 — 캡틴이 아닌 팀 안내 (멤버만인 팀) */}
        {variant !== '0' && (
          <div style={{marginTop:18}}>
            <div className="tu1-section-h">
              <h2 style={{fontSize:14, color:'var(--ink-mute)'}}>참여 중 (멤버 only)</h2>
              <span className="tu1-section-h__hint">관리 권한 없음 · /teams/[id] 에서 확인</span>
            </div>
            <p style={{margin:0, padding:'12px 14px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', fontSize:12.5, color:'var(--ink-mute)'}}>
              <span className="ico material-symbols-outlined" style={{fontSize:14, verticalAlign:-3, marginRight:4}}>info</span>
              강남BC · 멤버로 활동 중 (운영 권한 없음). <a href="tu2-team-detail.html" style={{color:'var(--cafe-blue-deep)', fontWeight:700}}>팀 상세 →</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

window.TeamManage = TeamManage;
