/* global React */
// ============================================================
// AdminWizardAssociation.jsx — A3 (Phase 1A 협회 마법사 강화)
//   /tournament-admin/wizard/association
//
// 진입: A1 sub-tab 4번째 옵션 · super_admin 권한 가드
// 복귀: AdminTournamentSetupHub (완료 후) · AdminTournamentAdminList (취소)
// 에러: 권한 없음 = 일반 organizer redirect /tournament-admin/tournaments
//
// 4-step: 협회 박제 → 시리즈 → 종별 위임 → 권한 위임.
// ============================================================

(function () {
  const STEPS = [
    {
      k: 1,
      lbl: '협회 박제',
      why: '대회를 어느 협회 명의로 박제할지 정합니다.',
      done: true,
    },
    {
      k: 2,
      lbl: '시리즈 설정',
      why: '시리즈 회차·이전 회차 데이터 상속 여부.',
      done: true,
    },
    {
      k: 3,
      lbl: '종별 위임',
      why: '종별별 운영진 (TAM) 위임 — 종별별로 다른 운영자.',
      cur: true,
    },
    {
      k: 4,
      lbl: '권한 확정',
      why: 'super_admin 최종 결재 — 위임된 권한 확정.',
      locked: true,
    },
  ];

  const ASSOC_LIST = [
    { id: 'gangnam', name: '강남구농구협회', avatar: '강', count: 12 },
    { id: 'mapo', name: '마포구체육회', avatar: '마', count: 8 },
    { id: 'songpa', name: '송파구농구협회', avatar: '송', count: 5 },
  ];

  const DIVS = [
    { div: 'U10', tam: '김민수', avatar: 'KM', ok: true },
    { div: 'U12', tam: '이서연', avatar: 'LS', ok: true },
    { div: 'U14', tam: '박지훈', avatar: 'PJ', ok: true },
    { div: 'U16', tam: null, avatar: null, ok: false },
  ];

  function getCls(s) {
    if (s.done) return 'awz-stepper__cell awz-stepper__cell--done';
    if (s.cur)  return 'awz-stepper__cell awz-stepper__cell--cur';
    if (s.locked) return 'awz-stepper__cell awz-stepper__cell--locked';
    return 'awz-stepper__cell';
  }

  window.AdminWizardAssociation = function AdminWizardAssociation() {
    const cur = STEPS.find(s => s.cur) || STEPS[0];

    return (
      <window.AdminShell active="orgs" tournamentName="" crumbTrail={['대회 관리', '단체', '협회 대회 박제']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div>
                <div className="admin-page__eyebrow">A3 · Phase 1A · 협회 마법사 (super admin)</div>
                <h1 className="admin-page__title">협회 대회 박제 마법사</h1>
                <p className="admin-page__sub">
                  4 단계로 협회 박제 → 시리즈 → 종별 위임 → 권한 확정.
                  <span style={{ marginLeft: 8, padding: '2px 7px', fontSize: 11, fontFamily: 'var(--ff-mono)', fontWeight: 800, color: 'var(--accent)', background: 'var(--accent-soft)', borderRadius: 4 }}>SUPER ADMIN</span>
                </p>
              </div>
            </header>

            {/* 4-step 진행도 stepper */}
            <div className="awz-stepper">
              {STEPS.map(s => (
                <div key={s.k} className={getCls(s)}>
                  <div className="awz-stepper__dot">
                    {s.done && <span className="ico material-symbols-outlined">check</span>}
                    {(s.cur || (!s.done && !s.locked)) && <span className="num">{s.k}</span>}
                  </div>
                  <div className="awz-stepper__lbl">STEP {s.k} · {s.lbl}</div>
                  <div className="awz-stepper__why">{s.why}</div>
                  <span className="awz-stepper__chip">
                    {s.done && '완료'}
                    {s.cur && '진행 중'}
                    {s.locked && '잠김'}
                    {!s.done && !s.cur && !s.locked && '대기'}
                  </span>
                </div>
              ))}
            </div>

            {/* 현재 step body */}
            <div className="awz-step-body">
              <div className="awz-step-body__head">
                <div className="awz-step-body__cur">STEP {cur.k} OF 4 · 진행 중</div>
                <h2 className="awz-step-body__title">{cur.lbl}</h2>
                <p className="awz-step-body__sub">
                  종별별로 운영진(TAM)을 지정합니다. 각 TAM 은 본인 담당 종별의 팀·매치·기록만 관리할 수 있습니다.
                </p>
                <div className="awz-step-body__guard">
                  <span className="ico">policy</span>
                  <span>
                    <b>왜 종별 위임이 필요한가?</b> 협회 대회는 종별별로 다른 운영자(예: U10 = A 운영자, U12 = B 운영자)가 책임지는 게 일반적입니다.
                    super_admin 이 종별별 TAM 을 지정하면 권한이 자동 분리됩니다.
                  </span>
                </div>
              </div>

              {/* 협회 선택 (Step 1 결과 — 보존) */}
              <div style={{ marginBottom: 18 }}>
                <div className="awz-form__lbl" style={{ marginBottom: 8 }}>박제 협회 (STEP 1 결과)</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: 12, background: 'var(--bg-alt)',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontFamily: 'var(--ff-display)',
                  }}>강</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>강남구농구협회</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>운영 대회 12건 · 시리즈 4건 · 대회 이름 prefix: "강남구협회장배"</div>
                  </div>
                  <button className="btn btn--sm">변경</button>
                </div>
              </div>

              {/* 종별 위임 list */}
              <div className="awz-form__lbl" style={{ marginBottom: 8 }}>종별별 TAM 지정</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DIVS.map(d => (
                  <div key={d.div} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: 12, background: 'var(--bg-alt)',
                    border: '1px solid ' + (d.ok ? 'var(--border)' : 'var(--warn-hair)'),
                    borderRadius: 'var(--r-sm)',
                  }}>
                    <div style={{
                      width: 44, padding: '4px 8px',
                      fontFamily: 'var(--ff-mono)', fontWeight: 800,
                      color: 'var(--cafe-blue-deep)', background: 'var(--cafe-blue-soft)',
                      borderRadius: 'var(--r-xs)',
                      textAlign: 'center', fontSize: 12, letterSpacing: '0.02em',
                    }}>{d.div}</div>
                    {d.ok ? (
                      <>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--ink-soft)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 12,
                        }}>{d.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{d.tam}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>TAM · {d.div} 운영</div>
                        </div>
                        <span className="aen-pill aen-pill--live">위임 완료</span>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, color: 'var(--ink-mute)', fontSize: 13 }}>
                          TAM 미지정 — 종별 진행 차단됨
                        </div>
                        <button className="btn btn--sm btn--accent">+ TAM 지정</button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="awz-actions">
                <button className="btn">
                  <span className="ico material-symbols-outlined">arrow_back</span>
                  이전 단계 (시리즈)
                </button>
                <button className="btn btn--accent" disabled={DIVS.some(d => !d.ok)}>
                  다음 단계 (권한 확정)
                  <span className="ico material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
