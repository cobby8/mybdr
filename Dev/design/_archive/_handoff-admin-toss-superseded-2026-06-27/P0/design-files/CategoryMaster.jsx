/* global React, window, Icon, Btn, Badge, Empty */

// =====================================================================
// CategoryMaster.jsx — 종별 마스터 관리 (admin_categories 복원체)
//   종별 CRUD + divisions·ages 태그 입력. "잃어버린 종별 프리셋"의 복원.
//   레퍼런스: BDR-join-v1 CategoryManager.
// =====================================================================

const CM = window.TOSS;

function TagInput({ items, onAdd, onRemove, kind, placeholder }) {
  const [val, setVal] = React.useState('');
  const commit = () => { const v = val.trim(); if (v) { onAdd(v); setVal(''); } };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, minHeight: 34, alignItems: 'center', marginBottom: 10 }}>
        {items.map((it) =>
          <span key={it} className={'ts-chip ts-chip--tag' + (kind === 'age' ? ' ts-chip--age' : '')}>{it}
            <button type="button" onClick={() => onRemove(it)}><Icon name="x" size={12} /></button>
          </span>)}
        {items.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>없음</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="ts-input" style={{ padding: '10px 14px', fontSize: 14 }} value={val} placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} />
        <Btn variant="secondary" size="sm" icon="plus" onClick={commit}>추가</Btn>
      </div>
    </div>);
}

function CategoryMaster({ master, setMaster, toast, embedded }) {
  const [newName, setNewName] = React.useState('');
  const update = (id, field, value) => setMaster(master.map((c) => c.id === id ? { ...c, [field]: value } : c));
  const addCat = () => { const v = newName.trim(); if (!v) return; setMaster([...master, { id: `cm_${Date.now()}`, name: v, divisions: [], ages: [] }]); setNewName(''); toast(`'${v}' 종별 추가`); };
  const addItem = (id, field, item) => { const c = master.find((x) => x.id === id); if (c[field].includes(item)) return; update(id, field, [...c[field], item]); };
  const removeItem = (id, field, item) => update(id, field, master.find((x) => x.id === id)[field].filter((i) => i !== item));

  return (
    <div>
      {!embedded &&
      <div className="ts-ph">
        <div className="ts-ph__eyebrow">설정 · 종별 마스터</div>
        <h1 className="ts-ph__title">종별 관리</h1>
        <p className="ts-ph__sub">대회 생성 시 불러올 종별·디비전·연령 기본 구성을 관리합니다. 여기서 정의한 종별이 대회 생성기에서 그대로 사용됩니다.</p>
      </div>}

      <div className="ts-card" style={{ marginBottom: 20 }}>
        <label className="ts-field__label">새 종별 추가</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="ts-input" value={newName} placeholder="일반부 · 대학부 · 유청소년 …" onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCat()} />
          <Btn icon="plus" onClick={addCat}>추가</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {master.map((c) =>
          <div key={c.id} className="ts-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input value={c.name} onChange={(e) => update(c.id, 'name', e.target.value)}
                style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)', border: 0, background: 'transparent', outline: 'none', fontFamily: 'var(--ff)', letterSpacing: '-0.02em', flex: 1, minWidth: 0 }} />
              <Badge tone="grey">{c.divisions.length} 디비전{c.ages.length ? ` · ${c.ages.length} 연령` : ''}</Badge>
              <Btn variant="ghost" size="sm" onClick={() => { setMaster(master.filter((x) => x.id !== c.id)); toast(`'${c.name}' 삭제`); }} style={{ padding: 8 }}><Icon name="trash-2" size={17} /></Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}><Icon name="layout-grid" size={15} /> 디비전</div>
                <TagInput items={c.divisions} placeholder="추가 (Enter)" onAdd={(v) => addItem(c.id, 'divisions', v)} onRemove={(v) => removeItem(c.id, 'divisions', v)} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#6D5AE6', marginBottom: 12 }}><Icon name="cake" size={15} /> 연령 / 옵션</div>
                <TagInput items={c.ages} kind="age" placeholder="추가 (Enter)" onAdd={(v) => addItem(c.id, 'ages', v)} onRemove={(v) => removeItem(c.id, 'ages', v)} />
              </div>
            </div>
          </div>)}
      </div>

      <div className="ts-card ts-card--flat" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--primary-weak)', border: 0 }}>
        <Icon name="info" size={20} color="var(--primary)" />
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          이 종별 마스터는 운영 Supabase의 <b style={{ color: 'var(--ink)' }}>admin_categories</b> 와 연결됩니다. 현재 4종(일반부·유청소년·대학부·시니어)은 기존 데이터 복원 시드입니다.
        </div>
      </div>
    </div>);
}

window.CategoryMaster = CategoryMaster;
