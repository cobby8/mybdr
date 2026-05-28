/* global React */
// ============================================================
// AdminTournamentWizard1Step.jsx — A2 (Phase 1A QuickCreate 통합)
//   /tournament-admin/tournaments/new/wizard
//
// 진입: A1 대회 목록 hero CTA · 4 옵션 모달 → Quick
// 복귀: AdminTournamentSetupHub (생성 후) · AdminTournamentAdminList (취소)
// 에러: 권한 없음 = redirect · 시리즈 미선택 = inline error
//
// S3 사각지대 해소: 진입점 sub-tab (4 옵션) + draft 복구 배너 + 다음 단계 안내.
// ============================================================

(function () {
  const SUBTABS = [
    { k: 'quick', icon: 'flash_on', lbl: 'Quick', hint: '이름·시작일만', time: '1분', rec: true },
    { k: 'legacy', icon: 'list_alt', lbl: '단계별 설정', hint: '3-step 마법사', time: '5분', rec: false },
    { k: 'prospectus', icon: 'description', lbl: 'PDF 요강', hint: 'AI 추출', time: '3분', rec: false },
    { k: 'association', icon: 'workspace_premium', lbl: '협회 대회', hint: 'super admin', time: '7분', rec: false, admin: true },
  ];

  const SERIES_OPTS = [
    { id: 'bdr-summer', name: 'BDR 서머 오픈 시리즈', next_edition: 5 },
    { id: 'bdr-challenge', name: 'BDR 챌린지 시리즈', next_edition: 9 },
    { id: 'rookie', name: '루키 컵 시리즈', next_edition: 5 },
    { id: 'winter', name: '윈터 인비테이셔널', next_edition: 4 },
  ];

  window.AdminTournamentWizard1Step = function AdminTournamentWizard1Step({ isSuperAdmin = true }) {
    const [subtab, setSubtab] = React.useState('quick');
    const [draftDismissed, setDraftDismissed] = React.useState(false);
    const [series, setSeries] = React.useState('bdr-summer');
    const [name, setName] = React.useState('');
    const [date, setDate] = React.useState('');

    return (
      <window.AdminShell active="list" tournamentName="" crumbTrail={['대회 관리', '내 대회 목록', '새 대회 만들기']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div>
                <div className="admin-page__eyebrow">A2 · Phase 1A · QuickCreate 통합</div>
                <h1 className="admin-page__title">새 대회 만들기</h1>
                <p className="admin-page__sub">생성 방식을 선택하세요. 언제든 다른 방식으로 전환 가능합니다.</p>
              </div>
            </header>

            {/* 진입점 sub-tab (4 옵션) */}
            <div className="awz-subtab" role="tablist">
              {SUBTABS.map(t => {
                if (t.admin && !isSuperAdmin) return null;
                return (
                  <button key={t.k}
                    className={'awz-subtab__tab' + (subtab === t.k ? ' is-on' : '')}
                    onClick={() => setSubtab(t.k)}>
                    <span className="awz-subtab__lbl">
                      <span className="ico material-symbols-outlined">{t.icon}</span>
                      {t.lbl}
                      {t.rec && <span className="awz-subtab__rec-chip">추천</span>}
                      <span className="awz-subtab__time">~{t.time}</span>
                    </span>
                    <span className="awz-subtab__hint">{t.hint}</span>
                  </button>
                );
              })}
            </div>

            {/* draft 복구 배너 */}
            {!draftDismissed && (
              <div className="awz-draft">
                <div className="awz-draft__left">
                  <span className="awz-draft__icon ico material-symbols-outlined">history</span>
                  <div>
                    <div className="awz-draft__title">이전 작성 이어하기</div>
                    <div className="awz-draft__sub">
                      "Q3 오픈 (제목 미정)" · 2일 전 작성 · 1/3 단계 완료
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn--sm" onClick={() => setDraftDismissed(true)}>새로 시작</button>
                  <button className="awz-draft__cta">
                    <span className="ico material-symbols-outlined">arrow_forward</span>
                    이어하기
                  </button>
                </div>
              </div>
            )}

            {/* QuickCreate 폼 */}
            {subtab === 'quick' && (
              <>
                <div className="awz-form">
                  <div className="awz-form__row">
                    <label className="awz-form__lbl">
                      대회 이름 <span className="awz-form__req">필수</span>
                    </label>
                    <input className="awz-form__input"
                      placeholder="BDR 서머 오픈 #5"
                      value={name} onChange={e => setName(e.target.value)} />
                    <p className="awz-form__hint">생성 후 셋업 hub 에서 언제든 변경 가능합니다.</p>
                  </div>

                  <div className="awz-form__grid2">
                    <div className="awz-form__row">
                      <label className="awz-form__lbl">
                        시작일 <span className="awz-form__req">필수</span>
                      </label>
                      <input className="awz-form__input" type="date"
                        value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="awz-form__row">
                      <label className="awz-form__lbl">대회 기간</label>
                      <input className="awz-form__input" placeholder="자동 — 본선 일정에서 계산" disabled
                        style={{ background: 'var(--bg-alt)', color: 'var(--ink-mute)' }} />
                    </div>
                  </div>

                  <div className="awz-form__inline-series">
                    <div className="awz-form__inline-h">
                      <span className="ico">collections_bookmark</span>
                      시리즈 연결 <span style={{ color: 'var(--ink-dim)', fontWeight: 500 }}>· 회차 자동 할당</span>
                    </div>
                    <div className="awz-form__chips">
                      {SERIES_OPTS.map(s => (
                        <button key={s.id}
                          className={'awz-form__chip' + (series === s.id ? ' is-on' : '')}
                          onClick={() => setSeries(s.id)}>
                          {s.name} #{s.next_edition}
                        </button>
                      ))}
                      <button className="awz-form__chip" onClick={() => setSeries('none')}>
                        + 시리즈 미연결
                      </button>
                    </div>
                    <p className="awz-form__hint" style={{ marginTop: 8 }}>
                      시리즈에 연결하면 회차·시리즈 메타데이터가 자동으로 채워집니다.
                    </p>
                  </div>

                  {/* 다음 단계 안내 */}
                  <div className="awz-flow">
                    <div className="awz-flow__step">
                      <div className="awz-flow__num">NOW</div>
                      <div className="awz-flow__t">기본 정보 입력</div>
                      <div className="awz-flow__d">이름 · 시작일 · 시리즈</div>
                    </div>
                    <div className="awz-flow__step">
                      <div className="awz-flow__num">NEXT</div>
                      <div className="awz-flow__t">셋업 hub 8 카드</div>
                      <div className="awz-flow__d">종별 · 팀 · 대진 · 사이트</div>
                    </div>
                    <div className="awz-flow__step">
                      <div className="awz-flow__num">THEN</div>
                      <div className="awz-flow__t">공개하기</div>
                      <div className="awz-flow__d">사용자가 신청 시작</div>
                    </div>
                  </div>
                </div>

                <div className="awz-actions">
                  <button className="btn">취소</button>
                  <button className="btn btn--accent">
                    <span className="ico material-symbols-outlined">arrow_forward</span>
                    생성하고 셋업 hub 로
                  </button>
                </div>
              </>
            )}

            {/* 다른 sub-tab 안내 — 시안 외 분기 */}
            {subtab !== 'quick' && (
              <div className="awz-form" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--ink-dim)' }}>
                  {SUBTABS.find(t => t.k === subtab).icon}
                </span>
                <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 800, margin: '12px 0 6px' }}>
                  {SUBTABS.find(t => t.k === subtab).lbl} 방식으로 전환
                </h3>
                <p style={{ color: 'var(--ink-mute)', fontSize: 13, margin: '0 0 16px' }}>
                  {subtab === 'legacy' && '3-step 마법사로 전환합니다. 대회정보 → 참가설정 → 확인.'}
                  {subtab === 'prospectus' && 'PDF 요강을 업로드하면 AI 가 종별·신청정책을 자동 추출합니다.'}
                  {subtab === 'association' && '협회 대회 박제 4-step 마법사로 전환합니다.'}
                </p>
                <button className="btn btn--primary">
                  <span className="ico material-symbols-outlined">arrow_forward</span>
                  {subtab === 'legacy' && '?legacy=1 로 이동'}
                  {subtab === 'prospectus' && '/wizard/prospectus 로 이동'}
                  {subtab === 'association' && '/wizard/association 로 이동'}
                </button>
              </div>
            )}
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
