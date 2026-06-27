/* global React, window, Icon, Btn, Badge */

// =====================================================================
// toss-admin.jsx — 관리자 공용 테이블/필터/탭/상세 컴포넌트 (Toss)
//   기존 admin (AdminStatusTabs/FilterBar/DataTable/DetailModal/StatCard)의
//   기능을 1:1 유지하고 Toss 비주얼로 재스킨.
// =====================================================================

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 14px' }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{children}</h3>
      {action}
    </div>);
}

// 상태 탭 (pill 형)
function StatusTabs({ tabs, current, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {tabs.map((t) =>
        <button key={t.key} type="button" onClick={() => onChange(t.key)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--ff)', fontSize: 14, fontWeight: 700,
            background: current === t.key ? 'var(--ink)' : 'var(--grey-100)', color: current === t.key ? '#fff' : 'var(--ink-soft)' }}>
          {t.label}
          {t.count != null && <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, opacity: current === t.key ? .85 : .6 }}>{t.count}</span>}
        </button>)}
    </div>);
}

// 필터 바 (검색 + 셀렉트 + 액션)
function FilterBar({ search, filters = [], onReset, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {search &&
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-dim)', display: 'flex' }}><Icon name="search" size={18} /></span>
          <input className="ts-input" style={{ paddingLeft: 42, background: '#fff', border: '1px solid var(--border)', fontSize: 14 }}
            value={search.value} placeholder={search.placeholder} onChange={(e) => search.onChange(e.target.value)} />
        </div>}
      {filters.map((f) =>
        <select key={f.key} className="ts-select" style={{ flex: '0 0 auto', width: 'auto', fontSize: 14 }} value={f.value} onChange={(e) => f.onChange(e.target.value)}>
          {f.options.map((o) => <option key={o.value} value={o.value}>{f.label}: {o.label}</option>)}
        </select>)}
      {onReset && <Btn variant="ghost" size="sm" icon="rotate-ccw" onClick={onReset}>초기화</Btn>}
      <span style={{ flex: 1 }} />
      {actions}
    </div>);
}

function SortHead({ col, sort, onSortChange }) {
  if (!col.sortable) return <span>{col.label}</span>;
  const active = sort?.key === col.key;
  return (
    <button type="button" onClick={() => onSortChange({ key: col.key, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'none', border: 0, cursor: 'pointer', font: 'inherit', color: active ? 'var(--primary)' : 'inherit', fontWeight: 700, padding: 0 }}>
      {col.label}<Icon name={active ? (sort.dir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={13} />
    </button>);
}

// 데이터 테이블 (정렬·선택·페이지네이션·empty/loading)
function DataTable({ columns, rows, keyField, state = 'filled', sort, onSortChange, selectable, selected = [], onSelectChange, onRowClick, pagination, emptyTitle, emptyDesc, emptyCtaLabel, onEmptyCta }) {
  const gridCols = (selectable ? '44px ' : '') + columns.map((c) => typeof c.width === 'number' ? c.width + 'px' : (c.width || '1fr')).join(' ');
  const allOn = rows.length > 0 && rows.every((r) => selected.includes(r[keyField]));
  const toggleAll = () => onSelectChange(allOn ? [] : rows.map((r) => r[keyField]));
  const toggleRow = (id) => onSelectChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (state === 'loading') {
    return <div className="ts-table"><div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-mute)' }}>불러오는 중…</div></div>;
  }
  if (state === 'error') {
    return (
      <div className="ts-table"><div className="ts-empty">
        <div className="ts-empty__icon" style={{ background: 'var(--danger-weak)', color: 'var(--danger)' }}><Icon name="cloud-off" size={28} /></div>
        <div className="ts-empty__title">데이터를 불러오지 못했습니다</div>
        <div className="ts-empty__desc">잠시 후 다시 시도하세요.</div>
        {onEmptyCta && <div style={{ marginTop: 16 }}><Btn variant="secondary" icon="rotate-ccw" onClick={onEmptyCta}>다시 시도</Btn></div>}
      </div></div>);
  }
  if (state === 'denied') {
    return (
      <div className="ts-table"><div className="ts-empty">
        <div className="ts-empty__icon" style={{ background: 'var(--warn-weak)', color: 'var(--warn)' }}><Icon name="lock" size={28} /></div>
        <div className="ts-empty__title">접근 권한이 없습니다</div>
        <div className="ts-empty__desc">이 화면은 상위 권한이 필요합니다. 관리자에게 권한을 요청하세요.</div>
      </div></div>);
  }
  if (state === 'empty' || rows.length === 0) {
    return (
      <div className="ts-table"><div className="ts-empty">
        <div className="ts-empty__icon"><Icon name="inbox" size={28} /></div>
        <div className="ts-empty__title">{emptyTitle || '데이터가 없습니다'}</div>
        {emptyDesc && <div className="ts-empty__desc">{emptyDesc}</div>}
        {emptyCtaLabel && <div style={{ marginTop: 16 }}><Btn variant="secondary" onClick={onEmptyCta}>{emptyCtaLabel}</Btn></div>}
      </div></div>);
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1;

  return (
    <div className="ts-table">
      <div className="ts-thead" style={{ gridTemplateColumns: gridCols }}>
        {selectable && <span><button type="button" className="ts-check" data-on={allOn ? 'true' : 'false'} style={{ width: 20, height: 20 }} onClick={toggleAll}>{allOn && <Icon name="check" size={13} />}</button></span>}
        {columns.map((c) => <span key={c.key} style={{ textAlign: c.align || 'left' }}><SortHead col={c} sort={sort} onSortChange={onSortChange} /></span>)}
      </div>
      {rows.map((r) =>
        <div key={r[keyField]} className="ts-trow" style={{ gridTemplateColumns: gridCols, cursor: onRowClick ? 'pointer' : 'default' }} onClick={() => onRowClick?.(r)}>
          {selectable && <span onClick={(e) => e.stopPropagation()}><button type="button" className="ts-check" data-on={selected.includes(r[keyField]) ? 'true' : 'false'} style={{ width: 20, height: 20 }} onClick={() => toggleRow(r[keyField])}>{selected.includes(r[keyField]) && <Icon name="check" size={13} />}</button></span>}
          {columns.map((c) => <span key={c.key} style={{ textAlign: c.align || 'left', minWidth: 0, fontSize: 14, color: 'var(--ink-soft)' }}>{c.render ? c.render(r) : r[c.key]}</span>)}
        </div>)}
      {pagination && totalPages > 1 &&
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" size="sm" disabled={pagination.page <= 1} onClick={() => pagination.onChange(pagination.page - 1)}><Icon name="chevron-left" size={16} /></Btn>
          <span style={{ fontSize: 13, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', padding: '0 8px' }}>{pagination.page} / {totalPages}</span>
          <Btn variant="ghost" size="sm" disabled={pagination.page >= totalPages} onClick={() => pagination.onChange(pagination.page + 1)}><Icon name="chevron-right" size={16} /></Btn>
        </div>}
    </div>);
}

// 상세 슬라이드인 패널
function DetailModal({ open, onClose, title, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ts-modal-overlay" style={{ placeItems: 'stretch', justifyContent: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 440, maxWidth: '100%', height: '100%', background: '#fff', boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', animation: 'tsrise .2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)' }}>{title}</h3>
          <button type="button" className="ts-btn ts-btn--ghost ts-btn--sm" style={{ padding: 8 }} onClick={onClose}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)' }}>{footer}</div>}
      </div>
    </div>);
}

// KPI 카드
function StatCard({ icon, label, value, delta, trend }) {
  const tcolor = trend === 'up' ? 'var(--ok)' : trend === 'down' ? 'var(--danger)' : 'var(--ink-mute)';
  return (
    <div className="ts-card ts-card--tight">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--primary-weak)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name={icon} size={22} /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{value}</span>
            {delta && <span style={{ fontSize: 12, fontWeight: 700, color: tcolor }}>{delta}</span>}
          </div>
        </div>
      </div>
    </div>);
}

// 상세 패널 row helpers
function PanelStat({ label, value, tone }) {
  return (
    <div style={{ background: 'var(--grey-50)', borderRadius: 14, padding: 14, flex: 1 }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: tone === 'danger' ? 'var(--danger)' : 'var(--ink)' }}>{value}</div>
    </div>);
}
function PanelRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13.5, color: 'var(--ink-mute)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
    </div>);
}

// mock 상태 토글
function MockToggle({ value, onChange }) {
  return (
    <select className="ts-select" style={{ width: 'auto', fontSize: 12.5, padding: '7px 10px' }} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="filled">데이터 있음</option>
      <option value="empty">빈 상태</option>
      <option value="loading">로딩</option>
      <option value="error">에러</option>
      <option value="denied">권한없음</option>
    </select>);
}

Object.assign(window, { SectionTitle, StatusTabs, FilterBar, DataTable, DetailModal, StatCard, PanelStat, PanelRow, MockToggle });
