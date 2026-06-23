/* global React, window */
// =====================================================================
// au-kit.jsx — 통합 콘솔 공용 화면 프리미티브
//   PageHead · StatRow · Toolbar(Search+Tabs) · DataTable · Drawer · Panel
//   모든 섹션이 이 프리미티브로 구성되어 "통일감" 확보.
// =====================================================================
(function () {
const { useState, useMemo } = React;
const Icon = window.Icon, Btn = window.Btn, Badge = window.Badge;

// 상단 페이지 헤더 — eyebrow + 제목 + 우측 액션
function PageHead({ eyebrow, icon, title, sub, actions }) {
  return (
    <div className="au-head">
      <div className="au-head__row">
        <div style={{ minWidth: 0 }}>
          {eyebrow && <div className="au-head__eyebrow">{icon && <Icon name={icon} size={15} />}{eyebrow}</div>}
          <h1>{title}</h1>
          {sub && <div className="au-head__sub">{sub}</div>}
        </div>
        {actions && <div className="au-head__actions">{actions}</div>}
      </div>
    </div>
  );
}

// 통계 카드 행
function StatRow({ items }) {
  return (
    <div className="au-stats">
      {items.map((s, i) => (
        <div className="au-stat" key={i}>
          <div className="au-stat__top">
            <span className="au-stat__icon"><Icon name={s.icon} size={20} /></span>
            <span className="au-stat__label">{s.label}</span>
          </div>
          <div className="au-stat__value">{s.value}</div>
          {s.delta && (
            <div className="au-stat__delta" data-trend={s.trend || 'flat'}>
              {s.trend && <Icon name={s.trend === 'up' ? 'trending-up' : s.trend === 'down' ? 'trending-down' : 'minus'} size={14} />}
              {s.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 필터 툴바 — 검색 + 상태 탭 + 우측 슬롯
function Toolbar({ search, onSearch, placeholder = '검색', tabs, active, onTab, right }) {
  return (
    <div className="au-toolbar">
      {onSearch && (
        <label className="au-search">
          <Icon name="search" size={18} />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} />
        </label>
      )}
      {tabs && (
        <div className="au-tabs">
          {tabs.map((t) => (
            <button key={t.id} type="button" className="au-tab" data-active={active === t.id ? 'true' : 'false'} onClick={() => onTab(t.id)}>
              {t.label}{t.n != null && <span className="au-tab__n">{t.n}</span>}
            </button>
          ))}
        </div>
      )}
      {right && <><div className="au-toolbar__spacer" />{right}</>}
    </div>
  );
}

// 여유 데이터 테이블 — columns 설정으로 구동
//   columns: [{ key, label, w, align:'l'|'c'|'r', cls, hideSm, render(row) }]
function DataTable({ columns, rows, onRow, page, footNote }) {
  const grid = columns.map((c) => c.w || 'minmax(0,1fr)').join(' ');
  const alignCls = (a) => (a === 'r' ? ' au-cell-r' : a === 'c' ? ' au-cell-c' : '');
  return (
    <div className="au-table">
      <div className="au-thead" style={{ gridTemplateColumns: grid }}>
        {columns.map((c) => (
          <div key={c.key} className={(c.hideSm ? 'au-hide-sm' : '') + alignCls(c.align)}>{c.label}</div>
        ))}
      </div>
      {rows.length === 0 ? (
        <window.Empty icon="search-x" title="결과 없음" desc="조건에 맞는 항목이 없습니다." />
      ) : rows.map((row, ri) => (
        <div className="au-trow" key={row.id || ri} style={{ gridTemplateColumns: grid }} onClick={onRow ? () => onRow(row) : undefined}>
          {columns.map((c) => (
            <div key={c.key} className={(c.hideSm ? 'au-hide-sm ' : '') + (c.cls || '') + alignCls(c.align)}>
              {c.render ? c.render(row) : row[c.key]}
            </div>
          ))}
        </div>
      ))}
      <div className="au-table__foot">
        <span>{footNote != null ? footNote : `총 ${rows.length}건`}</span>
        {page !== false && (
          <div className="au-pager">
            <button className="au-pager__btn" type="button">‹</button>
            <button className="au-pager__btn" type="button" data-active="true">1</button>
            <button className="au-pager__btn" type="button">2</button>
            <button className="au-pager__btn" type="button">3</button>
            <button className="au-pager__btn" type="button">›</button>
          </div>
        )}
      </div>
    </div>
  );
}

// 좌측 아바타 + 제목/메타 셀
function PrimaryCell({ initials, title, meta, accent }) {
  return (
    <div className="au-primary-cell">
      {initials != null && <span className={'au-av' + (accent ? ' au-av--p' : '')}>{initials}</span>}
      <span style={{ minWidth: 0 }}>
        <div className="au-primary-cell__title">{title}</div>
        {meta && <div className="au-primary-cell__meta">{meta}</div>}
      </span>
    </div>
  );
}

// 우측 상세 드로어
function Drawer({ open, onClose, title, sub, children, foot }) {
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="au-drawer-overlay" onClick={onClose} />
      <aside className="au-drawer" role="dialog" aria-modal="true">
        <div className="au-drawer__head">
          <div style={{ minWidth: 0 }}>
            <div className="au-drawer__title">{title}</div>
            {sub && <div className="au-drawer__sub">{sub}</div>}
          </div>
          <button className="au-drawer__x" onClick={onClose} type="button"><Icon name="x" size={18} /></button>
        </div>
        <div className="au-drawer__body">{children}</div>
        {foot && <div className="au-drawer__foot">{foot}</div>}
      </aside>
    </>
  );
}

// 정의 목록 (key/value 행)
function DL({ rows }) {
  return (
    <div className="au-dl">
      {rows.map(([k, v], i) => (
        <div className="au-dl__row" key={i}><span className="au-dl__k">{k}</span><span className="au-dl__v">{v}</span></div>
      ))}
    </div>
  );
}

// 카드 래퍼
function Panel({ title, sub, right, pad = 24, children, style }) {
  return (
    <div className="ts-card" style={{ padding: pad, ...style }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: sub ? 4 : 16 }}>
          {title && <div className="au-card-title">{title}</div>}
          {right}
        </div>
      )}
      {sub && <div className="au-card-sub">{sub}</div>}
      {children}
    </div>
  );
}

// status helper → Badge
function StatusBadge({ map, value }) {
  const s = map[value]; if (!s) return null;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

// 검색 필터 훅 헬퍼
function useFilter(rows, fields) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const filtered = useMemo(() => rows.filter((r) => {
    const okTab = tab === 'all' || r.status === tab;
    const okQ = !q || fields.some((f) => String(r[f] || '').toLowerCase().includes(q.toLowerCase()));
    return okTab && okQ;
  }), [rows, q, tab, fields]);
  return { q, setQ, tab, setTab, filtered };
}

Object.assign(window, { PageHead, StatRow, Toolbar, DataTable, PrimaryCell, Drawer, DL, Panel, StatusBadge, useFilter });
})();
