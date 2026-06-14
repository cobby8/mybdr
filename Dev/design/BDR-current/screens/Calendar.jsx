/* global React */
// BDR v2.31 — Calendar (/calendar · 자체 디자인 · 내 일정)
function Calendar() {
  // 2026년 5월 — 1일=금(요일 인덱스 5)
  const monthLabel = '2026년 5월';
  const firstDow = 5; // Fri
  const days = 31;
  const today = 9;
  const events = {
    2: [['game', '토요 픽업']],
    9: [['tn', '한강 3x3'], ['game', '게스트']],
    12: [['court', '코트 예약']],
    16: [['tn', '성동 가족전']],
    21: [['game', 'BDR 서머']],
    24: [['court', '장충 예약']],
  };
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const dow = ['일', '월', '화', '수', '목', '금', '토'];
  const up = [
    { d: '09', m: 'MAY', t: '한강 3x3 챌린지', meta: ['대회 · 여의도', 'event'], badge: 'tn' },
    { d: '09', m: 'MAY', t: 'A팀 게스트 경기', meta: ['20:00 · 용산', 'sports_basketball'], badge: 'game' },
    { d: '12', m: 'MAY', t: '장충체육관 예약', meta: ['18:00–20:00', 'place'], badge: 'court' },
    { d: '16', m: 'MAY', t: '성동구 가족 농구한마당', meta: ['대회 · 성동', 'event'], badge: 'tn' },
    { d: '21', m: 'MAY', t: 'BDR 서머 오픈 #4 예선', meta: ['장충체육관', 'event'], badge: 'tn' },
  ];
  return (
    <div className="page">
      <div className="page__inner page__inner--wide">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><span className="cur">내 일정</span></div>
        <div className="ex-head">
          <div>
            <div className="eyebrow">CALENDAR · 내 일정</div>
            <h1 className="ex-head__title">경기 · 대회 · 예약 한눈에</h1>
            <p className="ex-head__sub">참가 예정 경기와 대회, 코트 예약을 달력으로 관리하세요.</p>
          </div>
          <div className="ex-head__actions">
            <button className="btn"><span className="ico material-symbols-outlined">ios_share</span>일정 내보내기</button>
          </div>
        </div>

        <div className="cal-layout">
          <div className="card cal-card">
            <div className="cal-bar">
              <div className="cal-bar__month">{monthLabel}</div>
              <div className="cal-bar__nav">
                <button className="cal-nav-btn"><span className="ico material-symbols-outlined">chevron_left</span></button>
                <button className="cal-nav-btn"><span className="ico material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
            <div className="cal-grid">
              {dow.map((d, i) => <div key={'h' + i} className="cal-dow" style={i === 0 ? { color: 'var(--accent)' } : null}>{d}</div>)}
              {cells.map((d, i) => (
                <div key={i} className={'cal-cell' + (d === null ? ' is-out' : '') + (d === today ? ' is-today' : '')}>
                  {d !== null && <>
                    <div className="cal-cell__n">{d}</div>
                    {(events[d] || []).map(([t, l], j) => <div key={j} className={'cal-ev cal-ev--' + t}>{l}</div>)}
                  </>}
                </div>
              ))}
            </div>
            <div className="cal-legend">
              <span><i style={{ background: 'var(--cafe-blue)' }} />경기</span>
              <span><i style={{ background: 'var(--accent)' }} />대회</span>
              <span><i style={{ background: 'var(--ok)' }} />코트 예약</span>
            </div>
          </div>

          <div className="card cal-card">
            <h3 className="cal-side__h">다가오는 일정</h3>
            <div className="cal-up">
              {up.map((u, i) => (
                <div key={i} className="cal-up__row">
                  <div className="cal-up__date"><div className="d">{u.d}</div><div className="m">{u.m}</div></div>
                  <div>
                    <div className="cal-up__t">{u.t}</div>
                    <div className="cal-up__meta"><span className="ico material-symbols-outlined">{u.meta[1]}</span>{u.meta[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Calendar = Calendar;
