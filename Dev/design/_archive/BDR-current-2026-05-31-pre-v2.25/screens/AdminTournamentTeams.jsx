/* global React */
// ============================================================
// AdminTournamentTeams.jsx — UD1 (보강)
//   /tournament-admin/tournaments/[id]/teams
//
//   B1 알림 액션 + B3 payment_status 컬럼 + B4 정원 진행도 카드
//   기존 시안 (참가팀 표 / 토큰 발급) 보존
// ============================================================

(function () {
  const { useState } = React;

  const TN = { name: 'BDR 서머 오픈 #4', max: 32 };

  const TEAMS = [
    { id: 1, team: 'rdm 농구단', div: '아마추어', captain: 'rdm_captain', roster: 8, status: 'pending',  pay: 'unpaid',  note: '신청 5/1', dues: 55000 },
    { id: 2, team: '강남BC',     div: '오픈',    captain: 'gn_lee',     roster: 10, status: 'approved', pay: 'paid',    note: '결제 4/22', dues: 75000 },
    { id: 3, team: '서초파이브', div: '오픈',    captain: 'sc_park',    roster: 9,  status: 'approved', pay: 'paid',    note: '결제 4/24', dues: 75000 },
    { id: 4, team: '용산레전드', div: '오픈',    captain: 'yong_kim',   roster: 8,  status: 'approved', pay: 'pending', note: '입금 확인 중', dues: 75000 },
    { id: 5, team: '마포드림',   div: '아마추어', captain: 'mp_choi',   roster: 7,  status: 'pending',  pay: 'unpaid',  note: '신청 5/2', dues: 55000 },
    { id: 6, team: '동작볼러스', div: 'U18',     captain: 'dj_jung',    roster: 8,  status: 'rejected', pay: 'unpaid',  note: '서류 미비', dues: 0 },
    { id: 7, team: '광진코프',   div: '아마추어', captain: 'gj_yang',   roster: 9,  status: 'approved', pay: 'paid',    note: '결제 4/26', dues: 55000 },
    { id: 8, team: '성동슈터',   div: 'U18',     captain: 'sd_hong',    roster: 8,  status: 'approved', pay: 'paid',    note: '결제 4/27', dues: 40000 },
  ];

  const STATUS_LABEL = {
    pending: '승인 대기',
    approved: '승인',
    rejected: '거절',
  };
  const PAY_META = {
    paid:    { label: '완료', ico: 'check_circle', tone: 'ok' },
    pending: { label: '확인 중', ico: 'schedule',  tone: 'warn' },
    unpaid:  { label: '미결제', ico: 'cancel',    tone: 'err' },
  };

  window.AdminTournamentTeams = function AdminTournamentTeams() {
    const [filter, setFilter] = useState('all');
    const [notify, setNotify] = useState(true);
    const [selected, setSelected] = useState(new Set([1, 5])); // pending 2건 선택

    const filtered = TEAMS.filter(t => filter === 'all' ? true : t.status === filter);
    const counts = { all: TEAMS.length, pending: TEAMS.filter(t => t.status==='pending').length, approved: TEAMS.filter(t => t.status==='approved').length, rejected: TEAMS.filter(t => t.status==='rejected').length };

    const approvedCount = counts.approved;
    const pct = Math.round((approvedCount / TN.max) * 100);

    const toggle = (id) => {
      const n = new Set(selected);
      if (n.has(id)) n.delete(id); else n.add(id);
      setSelected(n);
    };

    return (
      <window.AdminShell active="teams" tournamentName={TN.name} crumbTrail={['대회 관리', TN.name, '참가팀']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div className="admin-page__title-row">
                <div>
                  <div className="admin-page__eyebrow">UD1 / B1+B3+B4 보강</div>
                  <h1 className="admin-page__title">참가팀 관리 · {TN.name}</h1>
                  <p className="admin-page__sub">팀 승인 / 결제 확인 / 정원 진행도. 변경 시 사용자에게 알림 발송 (기본 ✅).</p>
                </div>
                <div className="admin-page__actions">
                  <button className="btn"><span className="ico material-symbols-outlined">file_download</span>CSV 내보내기</button>
                  <button className="btn btn--accent"><span className="ico material-symbols-outlined">person_add</span>매뉴얼 추가</button>
                </div>
              </div>
            </header>

            {/* ============================================================
                 B4 — 정원 진행도 카드 (셋업 hub 와 같은 톤)
                 ============================================================ */}
            <div className="atm-prog">
              <div className="atm-prog__big">{approvedCount}<small>/{TN.max}팀</small></div>
              <div className="atm-prog__body">
                <div className="atm-prog__title">현재 정원 진행도</div>
                <div className="atm-prog__sub">승인 {approvedCount} · 대기 {counts.pending} · 거절 {counts.rejected} · 잔여 {TN.max - approvedCount - counts.pending}</div>
                <div className="atm-prog__bar"><div className="atm-prog__fill" style={{width: pct + '%'}} /></div>
              </div>
              <div className="atm-prog__d">접수마감 D-11<br/><small style={{opacity:.85, fontSize:11}}>2026.05.09</small></div>
            </div>

            {/* ============================================================
                 B1 — 알림 액션 bar
                 ============================================================ */}
            <div className="atm-notify-bar">
              <div className="atm-notify-bar__left">
                <span className="ico material-symbols-outlined">campaign</span>
                <div>
                  <div className="atm-notify-bar__title">선택한 {selected.size}개 팀 일괄 처리</div>
                  <div className="atm-notify-bar__sub">승인 / 거절 변경 시 사용자에게 자동 알림</div>
                </div>
              </div>
              <div className="atm-notify-bar__right">
                <label className="atm-notify-bar__check">
                  <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />
                  알림 보내기 (기본 ✅)
                </label>
                <button className="btn"><span className="ico material-symbols-outlined">check</span>일괄 승인</button>
                <button className="btn"><span className="ico material-symbols-outlined">close</span>일괄 거절</button>
              </div>
            </div>

            {/* ============================================================
                 B3 — payment 컬럼 포함 표
                 ============================================================ */}
            <div className="atm-toolbar" style={{marginTop:14}}>
              <span className="atm-toolbar__lbl">필터</span>
              {[
                ['all', '전체'],
                ['pending', '승인 대기'],
                ['approved', '승인'],
                ['rejected', '거절']
              ].map(([k, l]) => (
                <button key={k}
                  className={'atm-toolbar__chip' + (filter === k ? ' is-on' : '')}
                  onClick={() => setFilter(k)}>
                  {l}
                  <span className="atm-toolbar__count">{counts[k]}</span>
                </button>
              ))}
              <button className="btn btn--sm" style={{marginLeft:8}}>
                <span className="ico material-symbols-outlined">toggle_on</span>
                일괄 수동 입금 확인
              </button>
              <div className="atm-toolbar__search">
                <span className="ico material-symbols-outlined">search</span>
                <input type="search" placeholder="팀명·주장" />
              </div>
            </div>

            <div className="atm-table-wrap">
              <table className="atm-table">
                <thead>
                  <tr>
                    <th style={{width:36}}></th>
                    <th>팀명</th>
                    <th>종별</th>
                    <th>주장</th>
                    <th>엔트리</th>
                    <th>신청 상태</th>
                    <th>결제 상태</th>
                    <th>참가비</th>
                    <th>메모</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const pay = PAY_META[t.pay];
                    return (
                      <tr key={t.id} className={selected.has(t.id) ? 'is-selected' : ''}>
                        <td>
                          <span
                            className={'atm-table__chk' + (selected.has(t.id) ? ' is-on' : '')}
                            onClick={() => toggle(t.id)}
                          />
                        </td>
                        <td className="atm-table__team">{t.team}</td>
                        <td><span className="td-divtag" style={{background:'var(--bg-head)', color:'var(--ink-soft)'}}>{t.div}</span></td>
                        <td className="atm-table__captain">@{t.captain}</td>
                        <td style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{t.roster}명</td>
                        <td>
                          <span className={'atm-status atm-status--' + t.status}>{STATUS_LABEL[t.status]}</span>
                        </td>
                        <td>
                          <span className={'atm-pay atm-pay--' + pay.tone}>
                            <span className="ico material-symbols-outlined">{pay.ico}</span>
                            {pay.label}
                          </span>
                        </td>
                        <td style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>
                          {t.dues ? t.dues.toLocaleString() + '원' : '–'}
                        </td>
                        <td style={{color:'var(--ink-mute)', fontSize:12}}>{t.note}</td>
                        <td>
                          <div className="atm-action-row">
                            {t.status === 'pending'
                              ? <>
                                  <button className="btn btn--sm btn--primary">승인</button>
                                  <button className="btn btn--sm">거절</button>
                                </>
                              : <>
                                  <button className="btn btn--sm btn--ghost">상세</button>
                                  {t.pay !== 'paid' && <button className="btn btn--sm">입금 확인</button>}
                                </>
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
