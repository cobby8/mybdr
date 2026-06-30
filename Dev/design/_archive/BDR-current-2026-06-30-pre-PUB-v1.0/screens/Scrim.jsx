/* global React */
// BDR v2.31 — Scrim (/scrim · 자체 디자인 · 스크림(연습경기) 매칭)
function Scrim() {
  const [tab, setTab] = React.useState('find');
  const open = [
    { tag: 'MNK', cl: 'navy', team: 'MONKEYZ', rating: 1812, by: 'monkey_cap', when: '04.27 (일) 14:00 · 장충체육관', format: '5v5 · 풀코트', level: 'OPEN', dl: 'D-4', note: '대회 직전 감각 조율용. 심판 함께 섭외 가능.' },
    { tag: 'IRN', cl: 'ink', team: 'IRON WOLVES', rating: 1705, by: 'iron_coach', when: '05.02 (토) 19:00 · 용산국민체육센터', format: '5v5 · 풀코트', level: 'OPEN/PRO', dl: 'D-9', note: '상급 대응 가능 팀만. 세미 풀타임 40분×2.' },
    { tag: 'SWP', cl: 'accent', team: 'SWEEP', rating: 1650, by: 'sweep_pg', when: '05.04 (월) 20:00 · 성동구민체육관', format: '3v3 · 하프', level: 'AMATEUR', dl: 'D-11', note: '로테이션 돌려가며 편하게. 뒤풀이 가능.' },
    { tag: 'PVT', cl: 'blue', team: 'PIVOT', rating: 1520, by: 'pvt_mng', when: '05.10 (토) 13:00 · 반포종합복지관', format: '5v5 · 풀코트', level: 'AMATEUR', dl: 'D-17', note: '신생팀. 매너 중시. 초보 섞여도 환영.' },
  ];
  const incoming = [
    { tag: 'MNK', cl: 'navy', from: '몽키즈', msg: '토요일 스크림 어떠세요?', at: '2시간 전', st: 'new' },
    { tag: '3PT', cl: 'accent', from: '3POINT', msg: '4/30 저녁 용산 같이 뛰시죠', at: '어제', st: 'replied' },
  ];
  const outgoing = [
    { tag: 'KGS', cl: 'blue', to: '킹스크루', msg: '금요일 저녁 풀코트 제안드려요', at: '1시간 전', st: 'pending' },
    { tag: 'IRN', cl: 'ink', to: 'IRON WOLVES', msg: '5/2 스크림 가능하신지', at: '3일 전', st: 'accepted' },
  ];
  const stMap = { new: ['ex-badge--new', 'NEW'], replied: ['ex-badge--ok', '응답함'], pending: ['ex-badge--warn', '응답 대기'], accepted: ['ex-badge--ok', '수락됨'] };
  const tabs = [['find', '상대 찾기', open.length], ['incoming', '받은 제안', incoming.length], ['outgoing', '보낸 제안', outgoing.length]];
  return (
    <div className="page">
      <div className="page__inner">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><span className="cur">스크림 매칭</span></div>
        <div className="ex-head">
          <div>
            <div className="eyebrow">스크림 · SCRIMMAGE</div>
            <h1 className="ex-head__title">팀 vs 팀, 연습경기 잡기</h1>
            <p className="ex-head__sub">내 팀 레이팅에 맞는 상대를 찾고 바로 제안을 주고받으세요.</p>
          </div>
          <div className="ex-head__actions">
            <button className="btn"><span className="ico material-symbols-outlined">tune</span>매칭 조건</button>
            <button className="btn btn--accent"><span className="ico material-symbols-outlined">add</span>스크림 등록</button>
          </div>
        </div>

        <div className="card sc-me">
          <span className="ex-mono ex-mono--accent sc-me__av">RDM</span>
          <div>
            <div className="sc-me__name">REDEEM · 레이팅 1684</div>
            <div className="sc-me__meta">적합 상대 <b>1550–1820</b> · 활동지역 <b>서울 중·송파</b></div>
          </div>
          <button className="btn btn--sm">조건 편집</button>
        </div>

        <div className="ex-tabs">
          {tabs.map(([k, l, n]) => (
            <button key={k} className={'ex-tab' + (tab === k ? ' is-on' : '')} onClick={() => setTab(k)}>{l}<span className="ex-tab__n">{n}</span></button>
          ))}
        </div>

        {tab === 'find' && (
          <div className="sc-list">
            {open.map((r, i) => (
              <div key={i} className="card sc-row">
                <div className="sc-row__team">
                  <span className={'ex-mono ex-mono--' + r.cl + ' sc-row__av'}>{r.tag}</span>
                  <div>
                    <div className="sc-row__name">{r.team}</div>
                    <div className="sc-row__sub">레이팅 {r.rating} · @{r.by}</div>
                  </div>
                </div>
                <div className="sc-row__mid">
                  <div className="sc-row__tags">
                    <span className="ex-badge ex-badge--soft">{r.format}</span>
                    <span className="ex-badge ex-badge--navy">{r.level}</span>
                    <span className="ex-badge ex-badge--red">{r.dl}</span>
                  </div>
                  <div className="sc-row__when"><span className="ico material-symbols-outlined">event</span>{r.when}</div>
                  <div className="sc-row__note">{r.note}</div>
                </div>
                <div className="sc-row__act">
                  <button className="btn btn--primary btn--sm">제안 보내기</button>
                  <button className="btn btn--sm">메시지</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'incoming' && (
          <div className="sc-list">
            {incoming.map((m, i) => (
              <div key={i} className="card sc-prop">
                <span className={'ex-mono ex-mono--' + m.cl + ' sc-prop__av'}>{m.tag}</span>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                    <b style={{ fontSize: 14 }}>{m.from}</b>
                    <span className={'ex-badge ' + stMap[m.st][0]}>{stMap[m.st][1]}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{m.at}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{m.msg}</div>
                </div>
                <div className="sc-prop__act">
                  <button className="btn btn--sm">거절</button>
                  <button className="btn btn--primary btn--sm">수락</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'outgoing' && (
          <div className="sc-list">
            {outgoing.map((m, i) => (
              <div key={i} className="card sc-prop">
                <span className={'ex-mono ex-mono--' + m.cl + ' sc-prop__av'}>{m.tag}</span>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>To</span>
                    <b style={{ fontSize: 14 }}>{m.to}</b>
                    <span className={'ex-badge ' + stMap[m.st][0]}>{stMap[m.st][1]}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{m.at}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{m.msg}</div>
                </div>
                <button className="btn btn--sm">상세</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
window.Scrim = Scrim;
