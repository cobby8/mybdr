/* global React */
// ============================================================
// BDR v2.20 — CreateGame (Phase 2B · UA3)
// 운영 박제 대상: /games/new
// 진입: Home / Games '모집글 작성' / 마이 빈 상태 CTA
// 복귀: 저장 시 /games/[id] 이동 / 취소 시 /games 복귀
// 에러: 자동승인 OFF 시 호스트 알림 안내 / 게스트 ON 시 최소경력 select 필수
//
// BG5 = "신청 정책" 토글 — 자동 승인 (기본 ON) vs 호스트 수동 (UI 만 / 운영 API 별 Phase)
// BG3 보조 = "게스트 모집" 토글 + 최소 경력 select + 약관 동의 필수
// v2 wizard 골격 보존 — 3 카드 폼 + 라이브 프리뷰
// A 등급
// ============================================================

function CreateGame() {
  const [autoApprove, setAutoApprove] = React.useState(true);
  const [guestAllow, setGuestAllow] = React.useState(false);
  const [minYears, setMinYears] = React.useState('2');
  const [kind, setKind] = React.useState('pickup');

  return (
    <div className="gm-page">
      <div className="gm-page__inner" style={{maxWidth:1100}}>
        <header className="gm-page__head">
          <div className="eyebrow">/games/new · 새 경기 모집</div>
          <h1 className="gm-page__title">모집글 작성</h1>
          <p className="gm-page__sub">3 단계로 1분 안에 작성 — 기본 정보 / 일시·장소 / 신청 정책 + 게스트 옵션 (BG5 + BG3).</p>
        </header>

        <div className="cg-grid">
          {/* Form */}
          <div style={{display:'flex', flexDirection:'column', gap:14, minWidth:0}}>
            {/* 1. 기본 정보 */}
            <div className="gm-card">
              <h3 className="gm-card__h"><span className="ico material-symbols-outlined">edit_note</span> ① 기본 정보</h3>
              <div className="awz-form" style={{padding:0, border:0, background:'transparent', gap:14}}>
                <div className="awz-form__row">
                  <label className="awz-form__lbl">종별 <span className="awz-form__req">필수</span></label>
                  <div className="awz-form__chips">
                    {['pickup', 'guest', 'scrimmage'].map(k => (
                      <button key={k} className={'awz-form__chip' + (kind === k ? ' is-on' : '')} onClick={() => setKind(k)}>
                        {{pickup:'픽업', guest:'게스트 모집', scrimmage:'연습 경기'}[k]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="awz-form__row">
                  <label className="awz-form__lbl">제목 <span className="awz-form__req">필수</span></label>
                  <input className="awz-form__input" placeholder="강남 평일 픽업 5x5" />
                  <div className="awz-form__hint">검색에 노출되는 짧은 제목 (40자 이내)</div>
                </div>
                <div className="awz-form__grid2">
                  <div className="awz-form__row">
                    <label className="awz-form__lbl">인원 <span className="awz-form__req">필수</span></label>
                    <input className="awz-form__input" placeholder="10" />
                  </div>
                  <div className="awz-form__row">
                    <label className="awz-form__lbl">참가비 (원)</label>
                    <input className="awz-form__input" placeholder="8000" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 일시 · 장소 */}
            <div className="gm-card">
              <h3 className="gm-card__h"><span className="ico material-symbols-outlined">event</span> ② 일시 · 장소</h3>
              <div className="awz-form" style={{padding:0, border:0, background:'transparent', gap:14}}>
                <div className="awz-form__grid2">
                  <div className="awz-form__row">
                    <label className="awz-form__lbl">날짜 <span className="awz-form__req">필수</span></label>
                    <input className="awz-form__input" type="date" />
                  </div>
                  <div className="awz-form__row">
                    <label className="awz-form__lbl">시간 <span className="awz-form__req">필수</span></label>
                    <input className="awz-form__input" type="time" />
                  </div>
                </div>
                <div className="awz-form__row">
                  <label className="awz-form__lbl">코트 <span className="awz-form__req">필수</span></label>
                  <input className="awz-form__input" placeholder="강남구민체육센터" />
                </div>
              </div>
            </div>

            {/* 3. 신청 정책 (BG5) + 게스트 옵션 (BG3) — 핵심 */}
            <div className="gm-card">
              <h3 className="gm-card__h">
                <span className="ico material-symbols-outlined">tune</span>
                ③ 신청 정책 · 게스트 옵션
                <span className="cg-badge">BG5 + BG3</span>
              </h3>

              {/* BG5 — 자동 승인 토글 */}
              <div className="cg-policy" data-on={autoApprove}>
                <label className="cg-policy__row">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={e => setAutoApprove(e.target.checked)}
                    className="cg-toggle-input"
                  />
                  <span className="cg-toggle">
                    <span className="cg-toggle__handle" />
                  </span>
                  <div className="cg-policy__body">
                    <div className="cg-policy__t">
                      자동 승인
                      <span className={'cg-policy__chip cg-policy__chip--' + (autoApprove ? 'ok' : 'warn')}>
                        {autoApprove ? '🟢 자동 승인 (권장)' : '🟡 호스트 수동 승인'}
                      </span>
                    </div>
                    <div className="cg-policy__d">
                      {autoApprove
                        ? '신청 즉시 참가 확정 — 빠른 매칭'
                        : '신청자 사전 검토 후 호스트가 직접 승인'}
                    </div>
                  </div>
                </label>
              </div>

              {/* BG3 — 게스트 허용 토글 (only when kind=guest 또는 보조) */}
              <div className="cg-policy" data-on={guestAllow} style={{marginTop:10}}>
                <label className="cg-policy__row">
                  <input
                    type="checkbox"
                    checked={guestAllow}
                    onChange={e => setGuestAllow(e.target.checked)}
                    className="cg-toggle-input"
                  />
                  <span className="cg-toggle">
                    <span className="cg-toggle__handle" />
                  </span>
                  <div className="cg-policy__body">
                    <div className="cg-policy__t">게스트 신청 허용</div>
                    <div className="cg-policy__d">팀 외부 게스트가 신청 가능 — 최소 경력 / 약관 동의 설정</div>
                  </div>
                </label>

                {guestAllow && (
                  <div className="cg-guest-opt">
                    <div className="awz-form__row">
                      <label className="awz-form__lbl">최소 경력</label>
                      <div className="awz-form__chips">
                        {['1', '2', '3', '0'].map(y => (
                          <button
                            key={y}
                            className={'awz-form__chip' + (minYears === y ? ' is-on' : '')}
                            onClick={() => setMinYears(y)}
                          >
                            {y === '0' ? '무제한' : y + '년 이상'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="cg-guest-opt__check">
                      <input type="checkbox" defaultChecked />
                      <span>약관 동의 필수 — 게스트는 신청 시 약관 동의 체크박스 표시</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="awz-actions">
              <button className="btn">취소</button>
              <button className="btn btn--ghost">임시 저장</button>
              <button className="btn btn--accent btn--touch">
                <span className="ico material-symbols-outlined">publish</span>
                모집글 등록
              </button>
            </div>
          </div>

          {/* Live preview */}
          <aside className="cg-preview">
            <div className="cg-preview__h">
              <span className="ico material-symbols-outlined">preview</span>
              실시간 미리보기
            </div>
            <div className="gm-card" style={{padding:16}}>
              <div style={{display:'flex', gap:6, marginBottom:8, alignItems:'center'}}>
                <window.GMKindBadge kind={kind} small />
                <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-dim)', fontWeight:700, marginLeft:'auto'}}>강남구</span>
              </div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:15, fontWeight:800, marginBottom:6}}>
                강남 평일 픽업 5x5
              </div>
              <div style={{fontSize:11.5, color:'var(--ink-mute)', display:'flex', flexDirection:'column', gap:2}}>
                <span><span className="ico material-symbols-outlined" style={{fontSize:13, color:'var(--ink-dim)', verticalAlign:'-2px'}}>schedule</span> 20:00 · 120분</span>
                <span><span className="ico material-symbols-outlined" style={{fontSize:13, color:'var(--ink-dim)', verticalAlign:'-2px'}}>place</span> 강남구민체육센터</span>
              </div>
              <div style={{marginTop:10, paddingTop:8, borderTop:'1px dashed var(--border)', fontSize:11.5}}>
                <div style={{color:autoApprove ? 'var(--ok)' : 'var(--warn)', fontWeight:700}}>
                  {autoApprove ? '🟢 자동 승인' : '🟡 호스트 수동 승인'}
                </div>
                {guestAllow && (
                  <div style={{color:'var(--cafe-blue)', fontWeight:700, marginTop:2}}>
                    👥 게스트 허용 ({minYears === '0' ? '경력 무제한' : minYears + '년 이상'}, 약관 ✓)
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.CreateGame = CreateGame;
