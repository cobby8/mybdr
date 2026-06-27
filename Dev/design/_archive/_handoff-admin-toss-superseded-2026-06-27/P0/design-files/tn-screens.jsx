/* global React, window, Icon, Btn, Badge, Modal, Empty, Toggle, StatusTabs, PanelStat, PanelRow */

// =====================================================================
// tn-screens.jsx — 대회 운영 화면 (Toss · Phase 4)
//   Divisions(+Generator) / Teams / Bracket / Publish
// =====================================================================
const TD = () => window.TN;
const T0 = () => window.TOSS;

function MethodBadge({ method, settings }) {
  const m = T0().METHODS[method]; if (!m) return null;
  const s = TD().tnMethodSummary(method, settings);
  return <span className="ts-badge ts-badge--grey"><Icon name={m.icon} size={12} />{m.short}{s && ` · ${s}`}</span>;
}

function MethodSettings({ d, onChange }) {
  const keys = TD().METHOD_SETTINGS[d.method] || [];
  if (!keys.length) return <span style={{ fontSize: 12, color: 'var(--ink-dim)' }}>추가 설정 없음</span>;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {keys.map((k) => {
        const m = TD().TN_SETTING[k];
        return (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--grey-100)', borderRadius: 10, padding: '5px 10px', fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
            {m.label}
            {m.type === 'select'
              ? <select value={d.settings[k]} onChange={(e) => onChange(k, +e.target.value)} style={{ border: 0, background: 'transparent', font: 'inherit', fontWeight: 700, color: 'var(--ink)', cursor: 'pointer' }}>{m.options.map((o) => <option key={o} value={o}>{m.fmt ? m.fmt(o) : o}</option>)}</select>
              : <input type="number" value={d.settings[k]} onChange={(e) => onChange(k, +e.target.value || 1)} style={{ width: 34, border: 0, background: 'transparent', font: 'inherit', fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }} />}
            {m.suffix && <span style={{ color: 'var(--ink-mute)' }}>{m.suffix}</span>}
          </span>);
      })}
    </div>);
}

// ── Generator modal ───────────────────────────────────────────────────
function Generator({ open, onClose, onGenerate, toast }) {
  const [gender, setGender] = React.useState('남성');
  const [tplId, setTplId] = React.useState('');
  const [divs, setDivs] = React.useState([]);
  React.useEffect(() => { if (open) { setGender('남성'); setTplId(''); setDivs([]); } }, [open]);
  const tpl = T0().CATEGORY_MASTER.find((c) => c.id === tplId);
  const toggle = (d) => setDivs(divs.includes(d) ? divs.filter((x) => x !== d) : [...divs, d]);
  const gen = () => { if (!tpl || !divs.length) return; onGenerate(TD().tnMakeCategory(gender, tpl.name, divs, T0().METHODS.group_stage_knockout ? 'group_stage_knockout' : 'single_elimination')); toast(`'${gender} ${tpl.name}' 종별 생성 · 디비전 ${divs.length}개`); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="새 종별 추가" sub="성별·종별 템플릿을 고르고 디비전을 선택하면 종별이 생성됩니다."
      foot={<><Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>취소</Btn><Btn onClick={gen} disabled={!tpl || !divs.length} icon="plus" style={{ flex: 2, opacity: (tpl && divs.length) ? 1 : .5 }}>종별 생성 {divs.length ? `(${divs.length})` : ''}</Btn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div className="ts-field__label">STEP 1 · 성별</div>
          <div className="ts-segment">{T0().GENDERS.map((g) => <button key={g} type="button" className="ts-segment__btn" data-active={gender === g ? 'true' : 'false'} onClick={() => setGender(g)}>{g}</button>)}</div>
        </div>
        <div>
          <div className="ts-field__label">STEP 2 · 종별 템플릿</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{T0().CATEGORY_MASTER.map((c) => <button key={c.id} type="button" className="ts-chip" data-active={tplId === c.id ? 'true' : 'false'} onClick={() => { setTplId(c.id); setDivs([]); }}>{c.name}</button>)}</div>
        </div>
        <div style={{ opacity: tpl ? 1 : .4, pointerEvents: tpl ? 'auto' : 'none' }}>
          <div className="ts-field__label">STEP 3 · 디비전 {divs.length > 0 && <span style={{ color: 'var(--primary)' }}>({divs.length})</span>}</div>
          {tpl ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{tpl.divisions.map((d) => <button key={d} type="button" className="ts-chip" data-active={divs.includes(d) ? 'true' : 'false'} onClick={() => toggle(d)}>{divs.includes(d) && <Icon name="check" size={13} />}{d}</button>)}</div>
            : <div style={{ padding: 18, textAlign: 'center', color: 'var(--ink-dim)', fontSize: 13, background: 'var(--grey-50)', borderRadius: 12 }}>종별 템플릿을 먼저 선택하세요</div>}
        </div>
      </div>
    </Modal>);
}

// ── Divisions ─────────────────────────────────────────────────────────
function TnDivisions({ categories, setCategories, openGenerator, toast }) {
  const updateDiv = (cid, did, patch) => setCategories(categories.map((c) => c.id === cid ? { ...c, divisions: c.divisions.map((d) => d.id === did ? { ...d, ...patch } : d) } : c));
  const removeDiv = (cid, did) => setCategories(categories.map((c) => c.id === cid ? { ...c, divisions: c.divisions.filter((d) => d.id !== did) } : c));
  const removeCat = (cid) => setCategories(categories.filter((c) => c.id !== cid));
  const totalDiv = categories.reduce((a, c) => a + c.divisions.length, 0);
  const totalCap = categories.reduce((a, c) => a + c.divisions.reduce((s, d) => s + d.cap, 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)' }}><b style={{ color: 'var(--ink)' }}>{categories.length}</b> 종별 · <b style={{ color: 'var(--ink)' }}>{totalDiv}</b> 디비전 · 총 정원 <b style={{ color: 'var(--ink)' }}>{totalCap}</b></div>
        <Btn icon="plus" onClick={openGenerator}>종별 추가</Btn>
      </div>
      {categories.length === 0 ?
        <Empty icon="layout-grid" title="종별을 추가하세요" desc="성별·종별 템플릿을 고르고 디비전을 선택하면 종별이 생성됩니다."><Btn icon="plus" onClick={openGenerator}>종별 추가</Btn></Empty> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categories.map((c) =>
            <div key={c.id} className="ts-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'var(--grey-50)', borderBottom: '1px solid var(--border)' }}>
                <Icon name={c.gender === '여성' ? 'venus' : c.gender === '혼성' ? 'venus-and-mars' : 'mars'} size={18} color="var(--ink-mute)" />
                <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)', flex: 1 }}>{c.name}</span>
                <Badge tone="grey">{c.divisions.length}디비전</Badge>
                <Btn variant="ghost" size="sm" style={{ padding: 7 }} onClick={() => removeCat(c.id)}><Icon name="trash-2" size={16} /></Btn>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.divisions.map((d) =>
                  <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 110px 36px', gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--grey-50)', borderRadius: 14 }} className="tn-dvn">
                    <input value={d.name} onChange={(e) => updateDiv(c.id, d.id, { name: e.target.value })} style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', border: 0, background: 'transparent', fontFamily: 'var(--ff)', outline: 'none', minWidth: 0 }} />
                    <div>
                      <select className="ts-select" style={{ width: 'auto', fontSize: 13, padding: '6px 10px', marginBottom: 6 }} value={d.method} onChange={(e) => updateDiv(c.id, d.id, { method: e.target.value, settings: TD().tnDefaults(e.target.value) })}>
                        {Object.values(T0().METHODS).map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
                      </select>
                      <MethodSettings d={d} onChange={(k, v) => updateDiv(c.id, d.id, { settings: { ...d.settings, [k]: v } })} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="number" value={d.cap} onChange={(e) => updateDiv(c.id, d.id, { cap: +e.target.value || 0 })} style={{ width: 48, textAlign: 'right', border: '1px solid var(--border)', borderRadius: 8, padding: '6px', fontFamily: 'var(--ff-mono)', fontSize: 13 }} /><span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>팀</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>₩</span><input type="number" step="5000" value={d.fee} onChange={(e) => updateDiv(c.id, d.id, { fee: +e.target.value || 0 })} style={{ width: 74, textAlign: 'right', border: '1px solid var(--border)', borderRadius: 8, padding: '6px', fontFamily: 'var(--ff-mono)', fontSize: 13 }} /></div>
                    <Btn variant="ghost" size="sm" style={{ padding: 7 }} onClick={() => removeDiv(c.id, d.id)}><Icon name="x" size={16} /></Btn>
                  </div>)}
              </div>
            </div>)}
          <div className="ts-card ts-card--flat" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ok-weak)', border: 0 }}>
            <Icon name="zap" size={18} color="var(--ok)" />
            <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>저장 시 <b style={{ color: 'var(--ink)' }}>DivisionRule {totalDiv}건</b>이 자동 생성됩니다 (라벨·진행방식·정원·참가비).</span>
          </div>
        </div>}
    </div>);
}

// ── Teams (참가팀) ────────────────────────────────────────────────────
const ROSTER_POOL = ['오영진/4/PG', '김상우/7/SG', '이재현/11/SF', '박도윤/23/PF', '정해성/32/C', '최우진/5/G', '강민호/9/F', '윤서준/14/G', '임지호/21/F', '한동석/3/PG', '서지훈/8/SG', '남기준/15/SF'];
function mockRoster(n) { return Array.from({ length: n }).map((_, i) => { const [name, no, pos] = ROSTER_POOL[i % ROSTER_POOL.length].split('/'); return { name, no, pos }; }); }
function teamsToCsv(teams) {
  const head = '팀명,영문,대표자,연락처,지역,종별,디비전,선수,승인,입금';
  const lines = teams.map((t) => [t.name_ko, t.name_en, t.manager, t.phone, `${t.province || ''} ${t.city || ''}`.trim(), t.category, t.division, t.players, t.status, t.payment].join(','));
  return [head, ...lines].join('\n');
}
function TnTeams({ teams, setTeams, toast }) {
  const D = window.TOSS;
  const [tab, setTab] = React.useState('all');
  const [detail, setDetail] = React.useState(null);
  const update = (id, field, v) => { setTeams(teams.map((t) => t.id === id ? { ...t, [field]: v, ...(field === 'payment' && v === 'paid' ? { status: t.status === 'APPLIED' ? 'CONFIRMED' : t.status } : {}) } : t));
    toast(field === 'payment' ? '입금 상태 변경' : '승인 상태 변경'); };
  const counts = { all: teams.length }; D.STATUS_OPTS.forEach((o) => counts[o.v] = teams.filter((t) => t.status === o.v).length);
  const rows = tab === 'all' ? teams : teams.filter((t) => t.status === tab);
  const stTone = (v) => D.STATUS_OPTS.find((o) => o.v === v)?.tone;
  const pyTone = (v) => D.PAYMENT_OPTS.find((o) => o.v === v)?.tone;
  const exportCsv = () => {
    const blob = new Blob(['\uFEFF' + teamsToCsv(teams)], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '참가팀.csv'; a.click(); toast('참가팀 CSV 내보내기');
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}><Btn variant="secondary" size="sm" icon="download" onClick={exportCsv}>CSV 내보내기</Btn></div>
      <StatusTabs current={tab} onChange={setTab}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, ...D.STATUS_OPTS.map((o) => ({ key: o.v, label: o.label, count: counts[o.v] }))]} />
      <div className="ts-table">
        <div className="ts-thead" style={{ gridTemplateColumns: '1.3fr 1fr 1fr 0.6fr 1fr 1.2fr' }}><span>팀명</span><span>대표자</span><span>종별·디비전</span><span>선수</span><span>참가비</span><span>승인</span></div>
        {rows.map((t) =>
          <div key={t.id} className="ts-trow" style={{ gridTemplateColumns: '1.3fr 1fr 1fr 0.6fr 1fr 1.2fr' }}>
            <button type="button" onClick={() => setDetail(t)} style={{ background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', padding: 0 }}><b style={{ color: 'var(--ink)', fontSize: 14 }}>{t.name_ko}</b><span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-dim)' }}>{t.name_en}</span></button>
            <span style={{ fontSize: 13.5 }}>{t.manager}<a href={`tel:${t.phone}`} style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-mute)' }}>{t.phone}</a></span>
            <span style={{ fontSize: 13 }}>{t.division} <span style={{ color: 'var(--ink-dim)', fontSize: 11.5 }}>{t.category}</span></span>
            <button type="button" onClick={() => setDetail(t)} style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'var(--ff-mono)', color: 'var(--primary)', fontWeight: 700, textAlign: 'left', padding: 0 }}>{t.players}</button>
            <span><select value={t.payment} onChange={(e) => update(t.id, 'payment', e.target.value)} className={`ts-badge ts-badge--${pyTone(t.payment)}`} style={{ border: 0, cursor: 'pointer', fontFamily: 'var(--ff)', fontWeight: 700 }}>{D.PAYMENT_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select></span>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select value={t.status} onChange={(e) => update(t.id, 'status', e.target.value)} className={`ts-badge ts-badge--${stTone(t.status)}`} style={{ border: 0, cursor: 'pointer', fontFamily: 'var(--ff)', fontWeight: 700 }}>{D.STATUS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select>
              {t.status === 'WAITING' && <Btn variant="ghost" size="sm" style={{ padding: 6 }} onClick={() => toast(`'${t.name_ko}' 대기 안내 발송`)}><Icon name="bell" size={14} /></Btn>}
            </span>
          </div>)}
        {rows.length === 0 && <div className="ts-empty"><div className="ts-empty__title">해당 팀이 없습니다</div></div>}
      </div>

      <window.DetailModal open={!!detail} onClose={() => setDetail(null)} title={detail?.name_ko}
        footer={<><Btn variant="secondary" onClick={() => setDetail(null)}>닫기</Btn><Btn icon="mail">대표자 연락</Btn></>}>
        {detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Badge tone={stTone(detail.status)}>{D.STATUS_OPTS.find((o) => o.v === detail.status)?.label}</Badge><Badge tone={pyTone(detail.payment)}>{D.PAYMENT_OPTS.find((o) => o.v === detail.payment)?.label}</Badge><Badge tone="grey">{detail.division}</Badge></div>
          <div><window.PanelRow label="대표자" value={detail.manager} /><window.PanelRow label="연락처" value={detail.phone} /><window.PanelRow label="지역" value={`${detail.province || ''} ${detail.city || ''}`.trim() || '—'} /><window.PanelRow label="종별·디비전" value={`${detail.category} · ${detail.division}`} /></div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 8 }}>출전 선수 ({detail.players}명) <span style={{ fontWeight: 500, color: 'var(--ink-dim)' }}>· 팀 로스터 조인</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mockRoster(detail.players).map((p, i) =>
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--grey-50)', borderRadius: 10 }}>
                  <span style={{ width: 26, textAlign: 'center', fontFamily: 'var(--ff-mono)', fontWeight: 800, color: 'var(--primary)' }}>{p.no}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span><Badge tone="grey">{p.pos}</Badge></div>)}
            </div>
          </div>
        </div>}
      </window.DetailModal>
    </div>);
}

// ── Bracket ───────────────────────────────────────────────────────────
function TnBracket({ categories, teams, toast }) {
  const allDivs = categories.flatMap((c) => c.divisions.map((d) => ({ ...d, cat: c.name, key: c.id + d.id })));
  const [sel, setSel] = React.useState(allDivs[0]?.key);
  const [gen, setGen] = React.useState({});
  const cur = allDivs.find((d) => d.key === sel);
  const divTeams = teams.filter((t) => t.division === cur?.name && t.status !== 'CANCELED');
  const isGen = sel && gen[sel];
  const M = T0().METHODS;
  const tree = (size) => { const rounds = Math.round(Math.log2(size)); const cols = []; let c = size; for (let r = 0; r < rounds; r++) { cols.push({ n: c / 2, label: c / 2 === 1 ? '결승' : `${c}강` }); c /= 2; } return cols; };
  return (
    <div>
      {allDivs.length === 0 ? <Empty icon="git-fork" title="디비전이 없습니다" desc="먼저 종별·디비전을 구성하세요." /> :
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>{allDivs.map((d) => <button key={d.key} type="button" className="ts-chip" data-active={sel === d.key ? 'true' : 'false'} onClick={() => setSel(d.key)}>{d.cat.replace(/^(남성|여성|혼성) /, '')} {d.name}</button>)}</div>
          {cur &&
            <div className="ts-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '14px 20px', background: 'var(--grey-50)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><b style={{ fontSize: 15, color: 'var(--ink)' }}>{cur.cat} · {cur.name}</b><MethodBadge method={cur.method} settings={cur.settings} /><span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>참가 {divTeams.length}팀 / {cur.cap}</span></span>
                <Btn size="sm" icon={isGen ? 'rotate-ccw' : 'sparkles'} onClick={() => { setGen({ ...gen, [sel]: true }); toast('대진표 초안 생성'); }}>{isGen ? '다시 생성' : '대진표 생성'}</Btn>
              </div>
              <div style={{ padding: 20, overflowX: 'auto' }}>
                {!isGen ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-mute)' }}><Icon name="git-fork" size={28} /><div style={{ marginTop: 8, fontWeight: 700, color: 'var(--ink)' }}>대진표 미생성</div><div style={{ fontSize: 13, marginTop: 4 }}>"{M[cur.method].label}" 방식으로 {divTeams.length}팀 대진을 만듭니다.</div></div> :
                cur.method === 'full_league' ?
                  <div><div className="ts-field__label">풀리그 순위표 · {divTeams.length}팀</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{divTeams.map((t, i) => <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--grey-50)', borderRadius: 12 }}><span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 800, width: 24 }}>{i + 1}</span><b style={{ flex: 1, color: 'var(--ink)' }}>{t.name_ko}</b><span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>0승 0패 · 0점</span></div>)}</div></div> :
                cur.method === 'group_stage_knockout' ?
                  <div><div className="ts-field__label">{cur.settings.groupCount}개 조 · 각 조 {cur.settings.advanceCount}팀 진출</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>{Array.from({ length: cur.settings.groupCount }).map((_, gi) => <div key={gi} style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}><div style={{ padding: '8px 12px', background: 'var(--grey-50)', fontWeight: 800, fontSize: 13 }}>{String.fromCharCode(65 + gi)}조</div><div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>{divTeams.filter((_, i) => i % cur.settings.groupCount === gi).map((t) => <span key={t.id} style={{ fontSize: 12.5, padding: '6px 9px', background: 'var(--grey-50)', borderRadius: 8 }}>{t.name_ko}</span>)}</div></div>)}</div></div> :
                  <div><div className="ts-field__label">{cur.method === 'dual_tournament' ? '더블 엘리미네이션' : `싱글 토너먼트 · ${cur.settings.bracketSize || 16}강`}</div>
                    <div style={{ display: 'flex', gap: 24, minWidth: 'min-content' }}>{tree(cur.settings.bracketSize || 16).map((col, ci) => <div key={ci} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 12, minWidth: 150 }}><div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-mute)', textAlign: 'center' }}>{col.label}</div>{Array.from({ length: col.n }).map((_, mi) => <div key={mi} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, background: 'var(--grey-50)', borderRadius: 10 }}><span style={{ fontSize: 12.5, color: ci === 0 && divTeams[mi * 2] ? 'var(--ink)' : 'var(--ink-dim)', fontWeight: 600 }}>{ci === 0 && divTeams[mi * 2] ? divTeams[mi * 2].name_ko : '미정'}</span><span style={{ fontSize: 9, color: 'var(--ink-dim)', textAlign: 'center' }}>VS</span><span style={{ fontSize: 12.5, color: ci === 0 && divTeams[mi * 2 + 1] ? 'var(--ink)' : 'var(--ink-dim)', fontWeight: 600 }}>{ci === 0 && divTeams[mi * 2 + 1] ? divTeams[mi * 2 + 1].name_ko : '미정'}</span></div>)}</div>)}</div></div>}
              </div>
            </div>}
        </>}
    </div>);
}

// ── Publish ───────────────────────────────────────────────────────────
function TnPublish({ categories, teams, preset, toast, go }) {
  const [pub, setPub] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const divCount = categories.reduce((a, c) => a + c.divisions.length, 0);
  const guards = [
    { ok: !!preset, label: '경기 포맷 설정' }, { ok: divCount > 0, label: '종별·디비전 구성' },
    { ok: true, label: '신청 마감일 지정' }, { ok: teams.length > 0, label: '참가팀 모집' },
  ];
  const can = guards.every((g) => g.ok);
  const allDivs = categories.flatMap((c) => c.divisions);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="ts-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: pub ? 'var(--ok)' : 'var(--grey-100)', color: pub ? '#fff' : 'var(--ink-mute)', display: 'grid', placeItems: 'center' }}><Icon name={pub ? 'globe' : 'globe-lock'} size={22} /></span>
            <div><div style={{ fontWeight: 800, fontSize: 15 }}>{pub ? '공개 중' : '비공개'}</div><div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>{pub ? '참가신청 페이지가 공개되어 있습니다.' : '공개하면 신청 페이지가 열립니다.'}</div></div>
          </div>
          <Toggle on={pub} onChange={(v) => { if (v && !can) { toast('공개 전 필수 항목을 완료하세요'); return; } setPub(v); toast(v ? '대회 공개됨' : '비공개 전환'); }} />
        </div>
        {pub && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 14px', background: 'var(--grey-50)', borderRadius: 12 }}><Icon name="link" size={15} color="var(--ink-mute)" /><span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--primary)' }}>mybdr.kr/t/gangnam-9</span><Btn variant="ghost" size="sm" style={{ marginLeft: 'auto', padding: 6 }}><Icon name="copy" size={14} /></Btn></div>}
      </div>
      <div className="ts-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><Icon name="shield-check" size={18} color={can ? 'var(--ok)' : 'var(--warn)'} /><b style={{ fontSize: 15 }}>공개 전 필수 항목</b><span style={{ flex: 1 }} /><Badge tone={can ? 'ok' : 'warn'}>{guards.filter((g) => g.ok).length}/{guards.length}</Badge></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{guards.map((g, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: g.ok ? 'var(--grey-50)' : 'var(--warn-weak)', borderRadius: 10 }}><Icon name={g.ok ? 'check-circle-2' : 'alert-circle'} size={17} color={g.ok ? 'var(--ok)' : 'var(--warn)'} /><span style={{ flex: 1, fontSize: 13.5 }}>{g.label}</span><span style={{ fontSize: 12, fontWeight: 700, color: g.ok ? 'var(--ok)' : 'var(--warn)' }}>{g.ok ? '완료' : '미완'}</span></div>)}</div>
      </div>
      <div className="ts-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><Icon name="trophy" size={18} color="var(--warn)" /><b style={{ fontSize: 15 }}>결과 · 시상</b><span style={{ flex: 1 }} /><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)' }}>대회 종료 <Toggle on={done} onChange={(v) => { setDone(v); toast(v ? '대회 종료 처리' : '종료 해제'); }} /></label></div>
        {!done ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', background: 'var(--grey-50)', borderRadius: 14 }}><Icon name="lock" size={24} /><div style={{ fontSize: 13, marginTop: 8 }}>대회 종료 후 결과를 입력할 수 있습니다.</div></div> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{allDivs.map((d) => <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: 10, alignItems: 'center' }}><span className="ts-badge ts-badge--grey">{d.name}</span>{['🥇 우승', '🥈 준우승', 'MVP'].map((ph2) => <input key={ph2} className="ts-input" style={{ padding: '8px 11px', fontSize: 13, background: '#fff', border: '1px solid var(--border)' }} placeholder={ph2} />)}</div>)}</div>}
      </div>
    </div>);
}

Object.assign(window, { TnDivisions, TnTeams, TnBracket, TnPublish, Generator, TnMethodBadge: MethodBadge });
