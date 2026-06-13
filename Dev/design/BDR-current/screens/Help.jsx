/* global React */
// ============================================================
// BDR v2.30 — Help (IU3 · Phase 10B · 보강 carry + Glossary 신규 · BI3 ★★★)
// 운영: /help (Phase 6 carry 405) + /help/glossary (신규 330).
//
// IU3-A Help: 검색 + 탭 3종(FAQ 아코디언 / 용어집 mini / 정책 카드) + 문의.
// IU3-B Glossary: A-Z chip 인덱스 + 용어 카드 grid + 검색 + cross-domain link.
// ============================================================

// ---- /help 통합 허브 ----
function Help() {
  const faq = window.HELP_FAQ;
  const mini = window.GLOSSARY_MINI;
  const policy = window.HELP_POLICY;
  const [tab, setTab] = React.useState('faq');
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(0);

  const needle = q.trim().toLowerCase();
  const fFaq = faq.filter(f => !needle || f.q.toLowerCase().includes(needle) || f.a.toLowerCase().includes(needle));
  const fMini = mini.filter(g => !needle || g.term.toLowerCase().includes(needle) || g.desc.toLowerCase().includes(needle));

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 820 }}>
        {/* Hero + 검색 */}
        <header className="info-hero" style={{ paddingBottom: 4 }}>
          <div className="eyebrow">도움말 · HELP</div>
          <h1 className="info-hero__title">무엇을 도와드릴까요?</h1>
          <div className="hlp-search">
            <span className="ico material-symbols-outlined">search</span>
            <input className="input" placeholder="용어·FAQ 검색 (예: 픽업, 레이팅)" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </header>

        {/* 탭 3종 */}
        <div className="hlp-tabs">
          {[['faq', '자주 묻는 질문'], ['glossary', '용어집'], ['policy', '정책']].map(([k, l]) => (
            <button key={k} className={'hlp-tab' + (tab === k ? ' is-on' : '')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* FAQ */}
        {tab === 'faq' && (
          fFaq.length > 0 ? (
            <div className="card hlp-faq">
              {fFaq.map((f, i) => (
                <div key={i} className={'hlp-faq__item' + (open === i ? ' is-open' : '')}>
                  <button className="hlp-faq__q" onClick={() => setOpen(open === i ? -1 : i)}>
                    <span className="hlp-faq__qnum">Q{i + 1}.</span>
                    <span className="hlp-faq__qtext">{f.q}</span>
                    <span className="hlp-faq__chev material-symbols-outlined">expand_more</span>
                  </button>
                  {open === i && <div className="hlp-faq__a">{f.a}</div>}
                </div>
              ))}
            </div>
          ) : <div className="card hlp-empty"><span className="ico material-symbols-outlined">search_off</span>검색 결과가 없습니다</div>
        )}

        {/* 용어집 mini */}
        {tab === 'glossary' && (
          <>
            {fMini.length > 0 ? (
              <div className="card hlp-glist">
                {fMini.map((g, i) => (
                  <div key={i} className="hlp-grow">
                    <div className="hlp-grow__term">{g.term}</div>
                    <div className="hlp-grow__desc">{g.desc}</div>
                  </div>
                ))}
              </div>
            ) : <div className="card hlp-empty"><span className="ico material-symbols-outlined">search_off</span>검색 결과가 없습니다</div>}
            <a className="hlp-glossary-cta" href="iu3-glossary.html">
              <div className="hlp-glossary-cta__t">전체 용어 사전 보기
                <small>A-Z 인덱스 · 예시 · 관련 페이지 link 포함 (9+ 핵심 용어)</small>
              </div>
              <span className="btn btn--primary btn--sm"><span className="ico material-symbols-outlined">menu_book</span>용어 사전 →</span>
            </a>
          </>
        )}

        {/* 정책 */}
        {tab === 'policy' && (
          <div className="hlp-policy">
            {policy.map((p, i) => (
              <div key={i} className={'hlp-pcard' + (p.active ? '' : ' is-soon')}>
                <div className="hlp-pcard__t">{p.title}{!p.active && <span className="hlp-pcard__soon">준비 중</span>}</div>
                <div className="hlp-pcard__d">{p.desc}</div>
                {p.active && <span className="hlp-pcard__arr material-symbols-outlined">arrow_forward</span>}
              </div>
            ))}
          </div>
        )}

        {/* 1:1 문의 */}
        <div className="hlp-contact">
          <h3 className="hlp-contact__t">원하는 답을 찾지 못하셨나요?</h3>
          <p className="hlp-contact__d">운영팀이 평일 1~2일 내에 답변드립니다.</p>
          <a className="btn btn--accent"><span className="ico material-symbols-outlined">mail</span>1:1 문의하기</a>
        </div>
      </div>
    </div>
  );
}
window.Help = Help;

// ---- /help/glossary 신규 — A-Z chip 인덱스 + 카드 grid + 검색 ----
function Glossary() {
  const all = window.GLOSSARY;
  const [letter, setLetter] = React.useState('all');
  const [q, setQ] = React.useState('');

  const az = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const initial = (e) => (e.english || '').trim().charAt(0).toUpperCase();
  const activeLetters = new Set(all.map(initial));

  const needle = q.trim().toLowerCase();
  let rows = all;
  if (letter !== 'all') rows = rows.filter(e => initial(e) === letter);
  if (needle) rows = rows.filter(e =>
    e.term.toLowerCase().includes(needle) ||
    (e.english || '').toLowerCase().includes(needle) ||
    e.desc.toLowerCase().includes(needle));

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 820 }}>
        <a className="glo-back" href="iu3-help.html"><span className="ico material-symbols-outlined">arrow_back</span>도움말로 돌아가기</a>

        <header style={{ marginBottom: 18 }}>
          <div className="eyebrow">용어 사전 · GLOSSARY</div>
          <h1 className="info-hero__title" style={{ fontSize: 28, textAlign: 'left', margin: '10px 0 8px' }}>농구 용어 한눈에 보기</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.6, margin: 0 }}>
            MyBDR에서 자주 쓰는 핵심 용어를 예시·관련 페이지와 함께 정리했습니다. 용어를 누르면 해당 화면으로 이동합니다.
          </p>
        </header>

        {/* 검색 */}
        <div className="hlp-search" style={{ margin: '0 0 4px', maxWidth: '100%' }}>
          <span className="ico material-symbols-outlined">search</span>
          <input className="input" placeholder="용어 검색 (예: 레이팅, 디비전, seed)" value={q}
            onChange={e => { setQ(e.target.value); setLetter('all'); }} />
        </div>

        {/* A-Z 인덱스 chip */}
        <div className="glo-az">
          <button className={'glo-az__chip glo-az__chip--all' + (letter === 'all' ? ' is-on' : '')} onClick={() => setLetter('all')}>전체</button>
          {az.map(L => (
            <button key={L} className={'glo-az__chip' + (letter === L ? ' is-on' : '')}
              disabled={!activeLetters.has(L)}
              onClick={() => { setLetter(L); setQ(''); }}>{L}</button>
          ))}
        </div>

        {/* 카드 grid */}
        {rows.length > 0 ? (
          <div className="glo-grid">
            {rows.map((e, i) => (
              <article key={i} className="glo-card">
                <div className="glo-card__head">
                  <span className="glo-card__icon material-symbols-outlined">{e.icon}</span>
                  <span className="glo-card__term">{e.term}</span>
                  {e.english && <span className="glo-card__en">{e.english}</span>}
                </div>
                <div className="glo-card__desc">{e.desc}</div>
                {e.ex && <div className="glo-card__ex">{e.ex}</div>}
                {e.links && (
                  <div className="glo-card__links">
                    {e.links.map((l, j) => (
                      <a key={j} className="glo-card__link" href={'#' + l.href}>
                        <span className="ico material-symbols-outlined">north_east</span>{l.label}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : <div className="card hlp-empty"><span className="ico material-symbols-outlined">search_off</span>해당 용어가 없습니다</div>}
      </div>
    </div>
  );
}
window.Glossary = Glossary;
