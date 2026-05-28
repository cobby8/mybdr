/* global React */
// ============================================================
// BDR v2.20 — MyActivity (Phase 2B · UC1 보강)
// 운영 박제 대상: /profile/activity
// 진입: AppNav 계정 / 우측 utility / 더보기 마이페이지
// 복귀: 카드 클릭 → 각 대회/경기 상세 / "더보기" → /games or /tournaments
// 에러: my_games / my_tournaments / my_manner 빈 상태 = 안내 + CTA
//
// Phase 1B (v2.18) "내 대회" 섹션 보존 + 본 Phase 2B 보강:
//   ① BG6 — "내 경기" 섹션 신규 (game_applications 조회)
//      상태별 정렬: pending → approved → completed → rejected
//   ② BG2 — "내 매너" 카드 신규 (평균 + flag 종류만 / 개별 건수 ❌)
// 상단 카운트 = "내 대회 N · 내 경기 M · 평균 매너 X.Y"
// A 등급
// ============================================================

function MyActivity() {
  const myTn = window.MY_TOURNAMENTS || [];
  const myGames = window.MY_GAMES || [];
  const manner = window.MY_MANNER;

  const order = { pending: 0, approved: 1, live: 2, completed: 3, rejected: 4 };
  const sortedGames = [...myGames].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

  return (
    <div className="gm-page">
      <div className="gm-page__inner" style={{maxWidth:1100}}>
        <header className="gm-page__head">
          <div className="eyebrow">/profile/activity · 내 활동</div>
          <h1 className="gm-page__title">내 활동</h1>
          <p className="gm-page__sub">
            내 대회 <strong>{myTn.length}건</strong> ·
            내 경기 <strong>{myGames.length}건</strong> ·
            평균 매너 <strong style={{color: manner.avg >= 4.5 ? 'var(--ok)' : manner.avg >= 3.0 ? 'var(--warn)' : 'var(--err)'}}>
              {manner.avg.toFixed(1)} / 5
            </strong>
          </p>
        </header>

        {/* 3 섹션 1열 stack — 내 대회 (보존) → 내 경기 (신규) → 내 매너 (신규) */}
        <div className="ma-stack">

          {/* ① 내 대회 (Phase 1B 보존) */}
          <section className="gm-card">
            <h3 className="gm-card__h">
              <span className="ico material-symbols-outlined">military_tech</span>
              내 대회
              <span className="ma-count">{myTn.length}건</span>
              <a className="ma-more" href="ua1-tournaments.html">전체 보기 →</a>
            </h3>
            <div className="ma-list">
              {myTn.slice(0, 3).map(t => (
                <div key={t.id} className="ma-row">
                  <div className="ma-row__date">
                    <span className="ma-row__d">{t.submitted_at?.slice(8, 10)}</span>
                    <span className="ma-row__m">{t.submitted_at?.slice(5, 7)}월</span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="ma-row__title">{t.tn_name}</div>
                    <div className="ma-row__sub">{t.division} · {t.team_name}</div>
                    <div className="ma-row__next">{t.next_action}</div>
                  </div>
                  <window.GMStatusBadge
                    status={t.status}
                    label={
                      { pending:'승인 대기', approved:'결제 대기', in_progress:'진행 중', completed:'종료', rejected:'거절' }[t.status] || t.status
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ② 내 경기 (BG6 신규 — 상태별 정렬) */}
          <section className="gm-card">
            <h3 className="gm-card__h">
              <span className="ico material-symbols-outlined" style={{color:'var(--accent)'}}>sports_basketball</span>
              내 경기
              <span className="ma-new">NEW · BG6</span>
              <span className="ma-count">{myGames.length}건</span>
              <a className="ma-more" href="p2-ua1-games.html">전체 보기 →</a>
            </h3>
            <div className="ma-list">
              {sortedGames.map(g => (
                <div key={g.id} className={'ma-row ma-row--game ma-row--' + g.status}>
                  <div className="ma-row__date">
                    <span className="ma-row__d">{g.starts_at?.slice(8, 10)}</span>
                    <span className="ma-row__m">{g.starts_at?.slice(5, 7)}월</span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap'}}>
                      <window.GMKindBadge kind={g.kind} small />
                      <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-dim)', fontWeight:700}}>{g.time}</span>
                    </div>
                    <div className="ma-row__title">{g.title}</div>
                    <div className="ma-row__sub">{g.host} · {g.court}</div>
                    {/* BG1 step indicator (compact, sidebar 와 동일) */}
                    {g.status !== 'completed' && (
                      <div style={{marginTop:8}}>
                        <window.ApplyStep
                          stepIdx={g.step_idx}
                          status={g.status === 'pending' ? 'pending' : g.status === 'rejected' ? 'rejected' : 'approved'}
                          applied_at={g.applied_at?.slice(5)}
                          approved_at={g.approved_at?.slice(5)}
                          rejected_at={g.rejected_at?.slice(5)}
                          reject_reason={g.reject_reason}
                          compact
                        />
                      </div>
                    )}
                    {g.status === 'completed' && (
                      <div style={{
                        marginTop:6, padding:'5px 10px',
                        background:'var(--cafe-blue-soft)', borderRadius:'var(--r-xs)',
                        fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--cafe-blue-deep)',
                        display:'inline-flex', alignItems:'center', gap:5,
                      }}>
                        <span className="ico material-symbols-outlined" style={{fontSize:13}}>military_tech</span>
                        종료 — 결과 보기
                      </div>
                    )}
                  </div>
                  <window.GMStatusBadge
                    status={g.status}
                    label={
                      { pending:'승인 대기', approved:'참가 확정', live:'진행 중', completed:'종료', rejected:'거절' }[g.status]
                    }
                  />
                </div>
              ))}
              {myGames.length === 0 && (
                <div className="ma-empty">
                  아직 신청한 경기가 없습니다.
                  <a className="btn btn--sm btn--accent" href="p2-ua1-games.html">경기 둘러보기 →</a>
                </div>
              )}
            </div>
          </section>

          {/* ③ 내 매너 (BG2 신규 — 평균 + flag 종류만 / 개별 건수 ❌) */}
          <section>
            <window.MannerCard data={manner} />
          </section>
        </div>
      </div>
    </div>
  );
}

window.MyActivity = MyActivity;
