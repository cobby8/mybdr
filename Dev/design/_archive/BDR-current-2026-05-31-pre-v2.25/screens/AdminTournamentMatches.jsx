/* global React */
// ============================================================
// AdminTournamentMatches.jsx — C1 (Phase 1A 검증 배너 표준)
//   /tournament-admin/tournaments/[id]/matches
//
// 진입: 셋업 hub STEP 8 카드 / sidebar "경기"
// 복귀: AdminTournamentSetupHub
// 에러: 매치 0건 = empty state / 권한 없음 = redirect
//
// S8 사각지대 해소: PlaceholderValidationBanner 표준 (err / warn / ok 3-tone).
//   본 시안의 banner 위치 + 톤이 모든 어드민 페이지의 baseline.
// ============================================================

(function () {
  const TN = { name: 'BDR 서머 오픈 #4' };

  // 검증 결과 mock — 3 톤
  const VAL = {
    tone: 'err',
    title: '공개 차단됨 — 필수 항목 미완 3건',
    sub: '아래 항목을 완료해야 사용자가 신청할 수 있습니다.',
    items: ['사이트 미박제', '기록 모드 미설정', 'U18 종별 매치 0건'],
    cta: '셋업 hub 로',
  };

  // 매치 mock
  const RECORDING_MODES = [
    { k: 'sheet', name: '점수 시트', desc: '득점만 기록 (간단)', time: '경기당 1분', icon: 'edit_note' },
    { k: 'qbq', name: 'Q-by-Q', desc: '쿼터별 득점 + 시간', time: '경기당 3분', icon: 'timeline', on: true },
    { k: 'full', name: 'FIBA 기록지', desc: '개인별 통계 전체', time: '경기당 10분', icon: 'description' },
  ];

  const MATCHES = [
    { id: 'm1', time: '06-15 10:00', court: 'A1', div: '오픈', a: '강남BC', b: '서초파이브', score: [78, 65], status: 'done' },
    { id: 'm2', time: '06-15 11:30', court: 'A1', div: '오픈', a: '용산레전드', b: '강북코프', score: [62, 71], status: 'done' },
    { id: 'm3', time: '06-15 13:00', court: 'A2', div: '아마추어', a: '마포웨이브', b: '동작유스', score: [null, null], status: 'live' },
    { id: 'm4', time: '06-15 14:30', court: 'A2', div: '아마추어', a: '광진레인저', b: '성동가디언', score: [null, null], status: 'sched' },
    { id: 'm5', time: '06-15 16:00', court: 'A1', div: 'U18', a: '강남유스', b: '서초유스', score: [null, null], status: 'sched' },
  ];

  function Banner({ tone, title, sub, items, cta }) {
    const cls = 'vban vban--' + tone;
    const icon = tone === 'err' ? 'error' : tone === 'warn' ? 'warning' : 'check_circle';
    return (
      <div className={cls}>
        <span className={'vban__icon ico material-symbols-outlined'}>{icon}</span>
        <div>
          <div className="vban__title">{title}</div>
          <div className="vban__sub">{sub}</div>
          {items && items.length > 0 && (
            <div className="vban__items">
              {items.map((it, i) => <span key={i} className="vban__item">{it}</span>)}
            </div>
          )}
        </div>
        {cta && <button className="vban__cta">{cta}</button>}
      </div>
    );
  }

  function StatusChip({ s }) {
    if (s === 'live') return <span className="apl-match__live">LIVE</span>;
    if (s === 'done') return <span className="aen-pill aen-pill--done">종료</span>;
    return <span className="aen-pill aen-pill--draft">예정</span>;
  }

  window.AdminTournamentMatches = function AdminTournamentMatches() {
    const [bannerTone, setBannerTone] = React.useState('err');

    const banner = bannerTone === 'err'
      ? VAL
      : bannerTone === 'warn'
      ? { tone: 'warn', title: '권장 항목 미완 2건', sub: '공개는 가능하지만 사용자 경험에 영향이 있습니다.', items: ['포스터 미첨부', '알기자 draft 0건'], cta: '확인하기' }
      : { tone: 'ok', title: '모든 검증 통과', sub: '대회를 언제든 공개할 수 있습니다.', items: [], cta: null };

    return (
      <window.AdminShell active="matches" tournamentName={TN.name} crumbTrail={['대회 관리', TN.name, '경기']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div className="admin-page__title-row">
                <div>
                  <div className="admin-page__eyebrow">C1 · Phase 1A · 검증 배너 표준</div>
                  <h1 className="admin-page__title">경기 관리 · {TN.name}</h1>
                  <p className="admin-page__sub">총 {MATCHES.length} 경기 · 종료 2 · 진행 중 1 · 예정 2</p>
                </div>
                <div className="admin-page__actions">
                  <button className="btn"><span className="ico material-symbols-outlined">file_download</span>FIBA 기록지</button>
                  <button className="btn btn--primary"><span className="ico material-symbols-outlined">add</span>경기 추가</button>
                </div>
              </div>
            </header>

            {/* 표준 PlaceholderValidationBanner */}
            <Banner {...banner} tone={banner.tone || bannerTone} />

            {/* 배너 톤 데모 — 시안 검수용 (운영에는 없음) */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: 14,
              padding: 10, background: 'var(--bg-elev)', border: '1px dashed var(--border)',
              borderRadius: 'var(--r-sm)', alignItems: 'center', fontSize: 11.5, color: 'var(--ink-mute)',
            }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.06em' }}>DEMO TONE</span>
              {['err', 'warn', 'ok'].map(t => (
                <button key={t} className={'btn btn--sm' + (bannerTone === t ? ' btn--primary' : '')}
                  onClick={() => setBannerTone(t)}>{t.toUpperCase()}</button>
              ))}
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 10.5 }}>
                위 배너 패턴 = 모든 어드민 페이지의 baseline.
              </span>
            </div>

            {/* 기록 모드 카드 */}
            <div className="admin-card__head" style={{ marginTop: 6 }}>
              <h3 className="admin-card__h">기록 모드</h3>
              <span className="admin-card__sub">경기 시작 시 운영자에게 노출되는 입력 화면</span>
            </div>
            <div className="amt-modes">
              {RECORDING_MODES.map(m => (
                <div key={m.k} className={'amt-mode' + (m.on ? ' is-on' : '')}>
                  <div className="amt-mode__h">
                    <span className="ico material-symbols-outlined">{m.icon}</span>
                    {m.name}
                  </div>
                  <div className="amt-mode__d">{m.desc}</div>
                  <div className="amt-mode__time">{m.time}</div>
                </div>
              ))}
            </div>

            {/* 매치 표 */}
            <div className="admin-card__head" style={{ marginTop: 16 }}>
              <h3 className="admin-card__h">경기 일정</h3>
              <span className="admin-card__sub">{MATCHES.length} 경기</span>
            </div>
            <div className="amt-table-wrap">
              <table className="amt-table">
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>코트</th>
                    <th>종별</th>
                    <th>대진</th>
                    <th>스코어</th>
                    <th>상태</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {MATCHES.map(m => (
                    <tr key={m.id}>
                      <td><span className="amt-table__time">{m.time}</span></td>
                      <td><span className="amt-table__court">{m.court}</span></td>
                      <td><span className="amt-table__div">{m.div}</span></td>
                      <td>
                        <span className="amt-table__teams">
                          <b>{m.a}</b><span className="vs">vs</span><b>{m.b}</b>
                        </span>
                      </td>
                      <td>
                        {m.score[0] != null
                          ? <span className="amt-table__score">{m.score[0]} : {m.score[1]}</span>
                          : <span className="amt-table__score amt-table__score--ph">— : —</span>}
                      </td>
                      <td><StatusChip s={m.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn--sm">
                          {m.status === 'live' ? '입력' : m.status === 'done' ? '수정' : '준비'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
