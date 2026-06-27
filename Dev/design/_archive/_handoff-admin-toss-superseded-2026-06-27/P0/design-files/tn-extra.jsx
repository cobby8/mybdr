/* global React, window, Icon, Btn, Badge, StatusTabs, DataTable, StepDots */
// =====================================================================
// tn-extra.jsx — 대회 생성 위저드 · 기록자 배정 (Toss · 갭 보강)
// =====================================================================
const X0 = () => window.TOSS;

// ── 대회 생성 위저드 (3-step) ─────────────────────────────────────────
function TnWizard({ onDone, onCancel }) {
  const [step, setStep] = React.useState(0);
  const [d, setD] = React.useState({ name: '', start: '', venue: '', fee: 80000, bank: '', account: '', method: '5x5', gameTime: '40분 (10분 × 4쿼터)' });
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const canNext = step === 0 ? d.name.trim() : true;
  const Field = ({ label, children }) => <div className="ts-field"><label className="ts-field__label">{label}</label>{children}</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="ts-ph" style={{ marginBottom: 18 }}><div className="ts-ph__eyebrow">대회 운영 · 생성</div><h1 className="ts-ph__title">새 대회 만들기</h1></div>
      <StepDots step={step} total={3} />
      {step === 0 &&
        <div className="ts-card" style={{ display: 'grid', gap: 4 }}>
          <Field label="대회명"><input className="ts-input" value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="강남구협회장배 #10" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="본선 시작일"><input className="ts-input" type="date" value={d.start} onChange={(e) => set('start', e.target.value)} /></Field>
            <Field label="경기장"><input className="ts-input" value={d.venue} onChange={(e) => set('venue', e.target.value)} placeholder="장충체육관" /></Field>
          </div>
        </div>}
      {step === 1 &&
        <div className="ts-card" style={{ display: 'grid', gap: 4 }}>
          <Field label="경기 방식"><div className="ts-segment" style={{ maxWidth: 240 }}>{['5x5', '3x3'].map((m) => <button key={m} type="button" className="ts-segment__btn" data-active={d.method === m ? 'true' : 'false'} onClick={() => set('method', m)}>{m}</button>)}</div></Field>
          <Field label="경기 시간"><input className="ts-input" value={d.gameTime} onChange={(e) => set('gameTime', e.target.value)} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="참가비 (원)"><input className="ts-input" type="number" step="5000" value={d.fee} onChange={(e) => set('fee', +e.target.value || 0)} /></Field>
            <Field label="입금 은행"><input className="ts-input" value={d.bank} onChange={(e) => set('bank', e.target.value)} placeholder="국민은행" /></Field>
          </div>
          <Field label="계좌번호"><input className="ts-input" value={d.account} onChange={(e) => set('account', e.target.value)} placeholder="123456-78-901234" /></Field>
        </div>}
      {step === 2 &&
        <div className="ts-card">
          {[['대회명', d.name || '(미입력)'], ['본선 시작', d.start || '(미정)'], ['경기장', d.venue || '(미정)'], ['경기 방식', d.method], ['경기 시간', d.gameTime], ['참가비', `${d.fee.toLocaleString()}원`], ['입금', `${d.bank || '—'} ${d.account || ''}`]].map(([k, v]) =>
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)' }}><span style={{ fontSize: 13.5, color: 'var(--ink-mute)' }}>{k}</span><span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{v}</span></div>)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: 13, background: 'var(--grey-50)', borderRadius: 14 }}><Icon name="info" size={18} color="var(--primary)" /><span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>생성 후 <b style={{ color: 'var(--ink)' }}>종별·디비전</b> 탭에서 종별을 추가하면 운영을 시작할 수 있습니다.</span></div>
        </div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 22 }}>
        <Btn variant="secondary" onClick={() => step === 0 ? onCancel() : setStep(step - 1)}>{step === 0 ? '취소' : '이전'}</Btn>
        {step < 2 ? <Btn disabled={!canNext} style={{ opacity: canNext ? 1 : .5 }} iconRight="arrow-right" onClick={() => setStep(step + 1)}>다음</Btn>
          : <Btn icon="check" onClick={() => onDone(d)}>대회 생성</Btn>}
      </div>
    </div>);
}

// ── 기록자 배정 ───────────────────────────────────────────────────────
const RECORDERS = ['배기록', '정세훈', '김기록', '이스코어', '(미배정)'];
function TnRecorders({ categories, teams, toast }) {
  const allDivs = categories.flatMap((c) => c.divisions.map((d) => ({ ...d, cat: c.name })));
  // mock 경기 목록 (디비전별 1~2경기)
  const matches = allDivs.flatMap((dv, i) => [
    { id: `m${i}a`, div: dv.name, cat: dv.cat, label: `${dv.name} 1경기`, when: `06-2${2 + (i % 5)} ${14 + (i % 4)}:00`, court: '장충체육관' },
    { id: `m${i}b`, div: dv.name, cat: dv.cat, label: `${dv.name} 2경기`, when: `06-2${2 + (i % 5)} ${16 + (i % 4)}:00`, court: '올림픽공원' },
  ]);
  const [assign, setAssign] = React.useState(() => Object.fromEntries(matches.map((m, i) => [m.id, RECORDERS[i % 4]])));
  const assignedCount = Object.values(assign).filter((v) => v !== '(미배정)').length;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)' }}>총 <b style={{ color: 'var(--ink)' }}>{matches.length}</b>경기 · 배정 <b style={{ color: 'var(--ink)' }}>{assignedCount}</b> / 미배정 <b style={{ color: 'var(--warn)' }}>{matches.length - assignedCount}</b></div>
        <Btn variant="secondary" icon="wand-sparkles" onClick={() => { setAssign(Object.fromEntries(matches.map((m, i) => [m.id, RECORDERS[i % 4]]))); toast('기록자 자동 배정'); }}>자동 배정</Btn>
      </div>
      <DataTable keyField="id" rows={matches} columns={[
        { key: 'label', label: '경기', width: '1.4fr', render: (r) => <span><b style={{ color: 'var(--ink)' }}>{r.label}</b><span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-dim)' }}>{r.cat}</span></span> },
        { key: 'when', label: '일시', width: 120, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.when}</span> },
        { key: 'court', label: '코트', width: '1fr' },
        { key: 'rec', label: '기록자', width: 150, render: (r) =>
          <select value={assign[r.id]} onChange={(e) => { setAssign((a) => ({ ...a, [r.id]: e.target.value })); toast('기록자 배정 변경'); }}
            className={'ts-badge ' + (assign[r.id] === '(미배정)' ? 'ts-badge--warn' : 'ts-badge--ok')} style={{ border: 0, cursor: 'pointer', fontFamily: 'var(--ff)', fontWeight: 700 }}>
            {RECORDERS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select> },
      ]} />
    </div>);
}

Object.assign(window, { TnWizard, TnRecorders });
