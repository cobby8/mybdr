/* global React */
// BDR v2.31 — Stats (/stats · 자체 디자인 · 시즌 스탯 분석)
function Stats() {
  const [season, setSeason] = React.useState('2026S');
  const [mode, setMode] = React.useState('overview');
  const kpi = [['PPG', '14.2', '경기당 득점'], ['APG', '5.1', '어시스트'], ['RPG', '3.8', '리바운드'], ['SPG', '1.4', '스틸'], ['FG%', '48.3', '야투'], ['3P%', '37.1', '3점'], ['FT%', '82.4', '자유투'], ['레이팅', '1684', '+62']];
  const ranks = [['득점', 4, 12], ['어시스트', 2, 12], ['리바운드', 7, 12], ['3점 성공률', 3, 12], ['자유투', 1, 12]];
  const zones = [
    { name: '림 근처', pct: 68, made: 97, att: 142 },
    { name: '페인트', pct: 49, made: 42, att: 86 },
    { name: '미드레인지', pct: 41, made: 46, att: 112 },
    { name: '탑 3점', pct: 39, made: 28, att: 71 },
    { name: '윙 3점', pct: 40, made: 40, att: 100 },
    { name: '코너 3점', pct: 48, made: 22, att: 46 },
  ];
  const zc = (p) => p >= 50 ? 'var(--accent)' : p >= 40 ? 'var(--warn)' : 'var(--ink-mute)';
  const log = [
    { date: '04.20', opp: '장충픽업', min: 36, pts: 18, reb: 4, ast: 7, fg: '7/12', tp: '2/5', r: 'W' },
    { date: '04.18', opp: '몽키즈', min: 40, pts: 22, reb: 3, ast: 5, fg: '8/16', tp: '3/8', r: 'L' },
    { date: '04.12', opp: 'IRON', min: 38, pts: 14, reb: 6, ast: 8, fg: '5/11', tp: '1/3', r: 'W' },
    { date: '04.05', opp: 'KINGS', min: 34, pts: 11, reb: 2, ast: 4, fg: '4/10', tp: '1/4', r: 'L' },
    { date: '03.29', opp: '3POINT', min: 42, pts: 28, reb: 5, ast: 3, fg: '11/19', tp: '4/9', r: 'W' },
  ];
  const trend = [10, 12, 8, 14, 16, 11, 18, 15, 13, 17, 22, 14, 16, 20, 18, 14, 12, 16, 19, 22, 28, 14, 18, 11, 22, 18];
  const seasons = [['2026S', '26 봄'], ['2025W', '25 겨울'], ['2025F', '25 가을'], ['career', '커리어']];
  const modes = [['overview', '요약'], ['zones', '슈팅 존'], ['log', '경기 로그']];
  return (
    <div className="page">
      <div className="page__inner page__inner--wide">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><a>프로필</a><span className="sep">›</span><span className="cur">스탯 분석</span></div>
        <div className="ex-head">
          <div>
            <div className="eyebrow">ADVANCED STATS</div>
            <h1 className="ex-head__title">rdm_captain · 시즌 스탯</h1>
            <p className="ex-head__sub">슈팅 존, 클럽 내 순위, 경기 로그까지 — 한 시즌을 숫자로 되짚어보세요.</p>
          </div>
          <div className="ex-head__actions">
            <div className="ex-chips" style={{ margin: 0 }}>
              {seasons.map(([v, l]) => <button key={v} className={'ex-chip' + (season === v ? ' is-on' : '')} onClick={() => setSeason(v)}>{l}</button>)}
            </div>
          </div>
        </div>

        <div className="st-kpi">
          {kpi.map(([l, v, s], i) => (
            <div key={i} className="st-kpi__cell">
              <div className="st-kpi__l">{l}</div>
              <div className="st-kpi__v" style={i === 7 ? { color: 'var(--accent)' } : null}>{v}</div>
              <div className="st-kpi__s">{s}</div>
            </div>
          ))}
        </div>

        <div className="ex-tabs">
          {modes.map(([k, l]) => <button key={k} className={'ex-tab' + (mode === k ? ' is-on' : '')} onClick={() => setMode(k)}>{l}</button>)}
        </div>

        {mode === 'overview' && (
          <div className="st-2col">
            <div className="card st-panel">
              <h3 className="st-panel__h">시즌 득점 추이 <span style={{ color: 'var(--ink-mute)', fontWeight: 400, marginLeft: 6, fontSize: 12 }}>최근 26경기</span></h3>
              <svg viewBox="0 0 520 160" style={{ width: '100%', height: 180 }}>
                {[0, 10, 20, 30].map(y => <line key={y} x1="0" x2="520" y1={140 - y * 4} y2={140 - y * 4} stroke="var(--border)" strokeDasharray="3 3" />)}
                <polygon fill="var(--accent)" opacity="0.1" points={`0,140 ${trend.map((v, i) => `${i / (trend.length - 1) * 520},${140 - v * 4}`).join(' ')} 520,140`} />
                <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={trend.map((v, i) => `${i / (trend.length - 1) * 520},${140 - v * 4}`).join(' ')} />
                {trend.map((v, i) => <circle key={i} cx={i / (trend.length - 1) * 520} cy={140 - v * 4} r="2.5" fill="var(--accent)" />)}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)', marginTop: 4 }}>
                <span>25경기 전</span><span>최근</span>
              </div>
            </div>
            <div className="card st-panel">
              <h3 className="st-panel__h">클럽 내 순위</h3>
              {ranks.map(([l, r, of], i) => (
                <div key={i} className="st-rank">
                  <span>{l}</span>
                  <span className="st-rank__v" style={r <= 3 ? { color: 'var(--accent)' } : null}>{r}<small>/{of}</small></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'zones' && (
          <div className="card st-panel">
            <h3 className="st-panel__h">슈팅 존별 성공률</h3>
            {zones.map((z, i) => (
              <div key={i} className="st-zone">
                <div className="st-zone__top"><span>{z.name}</span><span style={{ fontFamily: 'var(--ff-mono)', color: zc(z.pct) }}>{z.pct}%</span></div>
                <div className="st-zone__bar"><div className="st-zone__fill" style={{ width: z.pct + '%', background: zc(z.pct) }} /></div>
                <div className="st-zone__sub">{z.made}/{z.att}</div>
              </div>
            ))}
          </div>
        )}

        {mode === 'log' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--ff-mono)', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg-alt)', textAlign: 'right' }}>
                  {['날짜', '상대', 'MIN', 'PTS', 'REB', 'AST', 'FG', '3P', '결과'].map((h, i) => (
                    <th key={i} style={{ padding: '11px 14px', fontSize: 10, fontWeight: 800, color: 'var(--ink-mute)', letterSpacing: '0.04em', textAlign: i === 1 ? 'left' : 'right', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px', color: 'var(--ink-dim)' }}>{g.date}</td>
                    <td style={{ padding: '11px 14px', fontFamily: 'var(--ff-display)', fontWeight: 700, textAlign: 'left' }}>{g.opp}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--ink-soft)' }}>{g.min}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: g.pts >= 20 ? 800 : 500, color: g.pts >= 20 ? 'var(--accent)' : 'inherit' }}>{g.pts}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--ink-soft)' }}>{g.reb}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--ink-soft)' }}>{g.ast}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--ink-soft)' }}>{g.fg}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--ink-soft)' }}>{g.tp}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right' }}><span className={'ex-badge ' + (g.r === 'W' ? 'ex-badge--ok' : 'ex-badge--red')}>{g.r}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
window.Stats = Stats;
