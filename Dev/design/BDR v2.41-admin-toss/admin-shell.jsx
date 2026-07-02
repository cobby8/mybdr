/* global React, window */
// ============================================================
// admin-shell.jsx — 관리자 공용 셸 (Toss · 듀얼 사이드네비)
//   v2.42: 단일 사이드바 → 2단 듀얼네비 개편
//     · 아이콘 레일(그룹=섹션) + 컨텍스트 패널(섹션 내 링크)
//     · grouped nav 배열({label} 구분자)을 섹션으로 자동 파싱 — 페이지 코드 무변경
//     · 모바일: 토픽바 + 드로어(그룹 전체 목록)
//   toss.css 토큰/lucide 그대로 유지. 스타일은 이 파일이 1회 주입.
//   tournament-admin / 백오피스 / 협력업체 / 심판 양쪽이 nav 설정만 바꿔 재사용.
// ============================================================
(function () {
  const { useState, useEffect } = React;
  const { Icon } = window;

  // ── 듀얼네비 스타일 1회 주입 ───────────────────────────────
  if (!window.__adnInjected) {
    window.__adnInjected = true;
    const RAIL = 76, PANEL = 236;
    const css = `
:root { --adn-rail: ${RAIL}px; --adn-panel: ${PANEL}px; --sidebar-w: ${RAIL + PANEL}px; }

/* 아이콘 레일 */
.adn-rail { position: fixed; top: 0; left: 0; bottom: 0; width: var(--adn-rail);
  background: var(--bg); border-right: 1px solid var(--border); z-index: 32;
  display: flex; flex-direction: column; align-items: center; }
.adn-rail__brand { width: 40px; height: 40px; border-radius: 12px; background: var(--primary);
  color: #fff; display: grid; place-items: center; font-size: 18px; font-weight: 900;
  margin: 16px 0 10px; text-decoration: none; flex: 0 0 auto; }
.adn-rail__brand:hover { background: var(--primary-hover); }
.adn-rail__nav { flex: 1; width: 100%; padding: 4px 0; display: flex; flex-direction: column;
  align-items: center; gap: 3px; overflow-y: auto; scrollbar-width: none; }
.adn-rail__nav::-webkit-scrollbar { display: none; }
.adn-railitem { position: relative; width: 58px; padding: 9px 0; border: 0; background: transparent;
  border-radius: 14px; display: flex; flex-direction: column; align-items: center; gap: 5px;
  cursor: pointer; color: var(--ink-mute); font-size: 10.5px; font-weight: 700;
  font-family: var(--ff); transition: background .12s, color .12s; }
.adn-railitem:hover { background: var(--grey-50); color: var(--ink); }
.adn-railitem[data-active="true"] { background: var(--primary-weak); color: var(--primary); }
.adn-railitem[data-active="true"]::before { content: ""; position: absolute; left: -9px; top: 50%;
  transform: translateY(-50%); width: 3px; height: 24px; border-radius: 0 3px 3px 0; background: var(--primary); }
.adn-railitem__lbl { max-width: 60px; line-height: 1.15; text-align: center; word-break: keep-all; }
.adn-railitem__dot { position: absolute; top: 7px; right: 11px; width: 7px; height: 7px;
  border-radius: 50%; background: var(--primary); border: 1.5px solid var(--bg); }

/* 컨텍스트 패널 */
.adn-panel { position: fixed; top: 0; left: var(--adn-rail); bottom: 0; width: var(--adn-panel);
  background: #fff; border-right: 1px solid var(--border); z-index: 31;
  display: flex; flex-direction: column; }
.adn-panel__head { padding: 22px 18px 10px; flex: 0 0 auto; }
.adn-panel__eyebrow { font-size: 11px; font-weight: 700; color: var(--ink-dim); letter-spacing: .02em; }
.adn-panel__title { font-size: 19px; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; margin-top: 3px; }
.adn-panel__nav { flex: 1; overflow-y: auto; padding: 6px 14px 12px; display: flex; flex-direction: column; gap: 2px; }
.adn-panel__foot { padding: 14px; border-top: 1px solid var(--border); flex: 0 0 auto; }

/* 공용 nav 링크 (패널/드로어) */
.adn-link { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border: 0;
  background: transparent; cursor: pointer; text-align: left; width: 100%; font-size: 14.5px;
  font-weight: 600; color: var(--ink-soft); border-radius: 12px; font-family: var(--ff);
  transition: background .12s, color .12s; }
.adn-link:hover { background: var(--grey-50); color: var(--ink); }
.adn-link[data-active="true"] { background: var(--primary-weak); color: var(--primary); font-weight: 700; }
.adn-link__t { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.adn-link__badge { margin-left: auto; font-size: 11.5px; font-family: var(--ff-mono); font-weight: 700;
  background: var(--grey-100); color: var(--ink-mute); padding: 2px 8px; border-radius: 8px; flex: 0 0 auto; }
.adn-link[data-active="true"] .adn-link__badge { background: var(--primary); color: #fff; }

/* main 여백은 toss.css --sidebar-w 가 처리 (RAIL+PANEL) */
@media (max-width: 900px) {
  .adn-rail, .adn-panel { display: none; }
}

/* 모바일 드로어 그룹 */
.adn-dgroup__label { font-size: 11px; font-weight: 700; color: var(--ink-dim); padding: 14px 12px 6px; letter-spacing: .02em; }
`;
    const s = document.createElement('style');
    s.id = 'adn-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── grouped nav 배열 → 섹션 파싱 ───────────────────────────
  const LABEL_ICON = {
    '운영': 'layout-dashboard', '회원·팀': 'users', '대회·경기': 'trophy', '시설·제휴': 'map-pin',
    '정산·플랜': 'credit-card', '커뮤니티': 'message-square', '시스템': 'settings-2', '구성': 'layers',
    '배정': 'clipboard-list', '명단·신청': 'user-check', '평가·정산': 'star', '설정': 'settings-2',
    '시설': 'building-2', '캠페인': 'megaphone', '정산': 'credit-card',
  };
  // 역할 필터 — 운영 sidebar.tsx filterStructureByRoles 미러 (it.roles: 배열 | 'all')
  //   roles 미지정 시 필터 없음(다른 셸 호환). children 도 재귀 필터.
  function visibleByRole(it, roles) {
    if (!roles) return true;
    if (!it.roles || it.roles === 'all') return true;
    return roles.some((r) => it.roles.indexOf(r) !== -1);
  }
  function filterNav(nav, roles) {
    if (!roles) return nav;
    // 1) 라벨은 유지, 항목·children 은 역할로 필터
    const kept = nav.map((it) => {
      if (it.label) return it;
      const kids = it.children ? it.children.filter((c) => visibleByRole(c, roles)) : undefined;
      if (visibleByRole(it, roles) || (kids && kids.length)) return { ...it, children: kids };
      return null;
    });
    // 2) 뒤따르는 항목이 없는 라벨(빈 그룹) 제거
    const out = [];
    for (let i = 0; i < kept.length; i++) {
      const it = kept[i];
      if (!it) continue;
      if (it.label) {
        let hasItem = false;
        for (let j = i + 1; j < kept.length; j++) {
          if (!kept[j]) continue;
          if (kept[j].label) break;
          hasItem = true; break;
        }
        if (!hasItem) continue;
      }
      out.push(it);
    }
    return out;
  }
  function parseSections(nav) {
    const secs = [];
    let cur = null;
    nav.forEach((it) => {
      if (it.label) { cur = { label: it.label, labelIcon: it.icon, items: [] }; secs.push(cur); }
      else {
        if (!cur) { cur = { label: '', items: [] }; secs.push(cur); }
        cur.items.push(it);
      }
    });
    // 빈 섹션 제거
    const live = secs.filter((s) => s.items.length > 0);
    live.forEach((s) => {
      // 단독 항목(라벨 없는 단일) → 항목 텍스트를 섹션명으로
      if (!s.label && s.items.length === 1) s.label = s.items[0].text;
      s.icon = s.labelIcon || LABEL_ICON[s.label] || (s.items[0] && s.items[0].icon) || 'square';
      s.ids = [];
      s.items.forEach((it) => { s.ids.push(it.id); (it.children || []).forEach((c) => s.ids.push(c.id)); });
      s.hasBadge = s.items.some((it) => it.badge != null || (it.children || []).some((c) => c.badge != null));
    });
    return live;
  }

  // ── 컨텍스트 패널 / 드로어 링크 (children = 들여쓰기 하위) ──
  function Link({ it, active, onNav, onClose, depth }) {
    const isExt = !!it.ext;
    const handle = () => { if (isExt) { window.location.href = it.ext; } else { onNav(it.id); } onClose && onClose(); };
    return (
      <>
        <button className="adn-link" data-active={!isExt && active === it.id ? 'true' : 'false'}
          style={depth ? { paddingLeft: 34 } : undefined}
          onClick={handle}>
          <Icon name={it.icon} size={depth ? 16 : 18} />
          <span className="adn-link__t">{it.text}</span>
          {isExt && <Icon name="arrow-up-right" size={15} style={{ marginLeft: 'auto', color: 'var(--ink-dim)', flex: '0 0 auto' }} />}
          {it.badge != null && <span className="adn-link__badge">{it.badge}</span>}
        </button>
        {(it.children || []).map((c) => (
          <Link key={c.id} it={c} active={active} onNav={onNav} onClose={onClose} depth={(depth || 0) + 1} />
        ))}
      </>
    );
  }

  window.AdminShell = function AdminShell({ brand, brandSub, nav, active, onNav, user, roles, flatPanel = true, children }) {
    const [drawer, setDrawer] = useState(false);
    const [toast, setToast] = useState(null);
    const [detail, setDetail] = useState(null);
    const secs = parseSections(filterNav(nav, roles));
    const activeSecIdx = Math.max(0, secs.findIndex((s) => s.ids.indexOf(active) !== -1));
    const [railSec, setRailSec] = useState(activeSecIdx);
    // active prop 변경(딥링크/페이지 이동) 시 레일 섹션 동기화
    useEffect(() => { setRailSec(activeSecIdx); }, [activeSecIdx]);
    const panelSec = secs[railSec] || secs[0] || { label: '', items: [] };

    useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : ''; }, [drawer]);
    useEffect(() => {
      window.adToast = (msg) => { setToast(msg); clearTimeout(window.__adToastT); window.__adToastT = setTimeout(() => setToast(null), 2200); };
      window.adDetail = (payload) => setDetail(payload);
      return () => { delete window.adToast; delete window.adDetail; };
    }, []);

    const onRailClick = (i) => {
      setRailSec(i);
      const first = secs[i] && secs[i].items[0];
      // 현재 active 가 이 섹션에 없을 때만 첫 링크로 이동
      if (first && secs[i].ids.indexOf(active) === -1) onNav(first.id);
    };

    const UserChip = user && (
      <button className="ts-userchip" onClick={() => window.adToast && window.adToast('계정 메뉴 (시연)')}>
        <span className="ts-avatar">{user.initial}</span>
        <div style={{ textAlign: 'left', lineHeight: 1.3, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{user.role}</div>
        </div>
        <Icon name="chevron-right" size={16} style={{ marginLeft: 'auto', color: 'var(--ink-dim)' }} />
      </button>
    );

    return (
      <div className="ts-shell">
        {/* 데스크톱 — 아이콘 레일 */}
        <aside className="adn-rail">
          <a href="관리자 홈.html" className="adn-rail__brand" title="관리자 홈으로">B</a>
          <div className="adn-rail__nav">
            {secs.map((s, i) => (
              <button key={s.label + i} className="adn-railitem" data-active={i === railSec ? 'true' : 'false'}
                onClick={() => onRailClick(i)} title={s.label}>
                <Icon name={s.icon} size={20} />
                <span className="adn-railitem__lbl">{s.label}</span>
                {s.hasBadge && i !== railSec && <span className="adn-railitem__dot" />}
              </button>
            ))}
          </div>
        </aside>

        {/* 데스크톱 — 컨텍스트 패널 (flatPanel: 전체 노출 / 기본: 레일 섹션 전환) */}
        <aside className="adn-panel">
          <div className="adn-panel__head">
            <div className="adn-panel__eyebrow">{brand}{flatPanel ? '' : (brandSub ? ' · ' + brandSub : '')}</div>
            <div className="adn-panel__title">{flatPanel ? (brandSub || brand) : (panelSec.label || brandSub || brand)}</div>
          </div>
          <nav className="adn-panel__nav">
            {(flatPanel ? secs : [panelSec]).map((s, i) => (
              <div key={s.label + i} className="adn-panel__group">
                {flatPanel && s.label && <div className="adn-dgroup__label">{s.label}</div>}
                {s.items.map((it) => (
                  <Link key={it.id} it={it} active={active} onNav={onNav} />
                ))}
              </div>
            ))}
          </nav>
          <div className="adn-panel__foot">{UserChip}</div>
        </aside>

        {/* 모바일 토픽바 */}
        <header className="ts-topbar">
          <button className="ts-mtoggle" onClick={() => setDrawer(true)}><Icon name="menu" size={20} /></button>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{(nav.find((n) => n.id === active) || {}).text || ''}</div>
        </header>

        {/* 모바일 드로어 — 그룹 전체 */}
        {drawer && <div className="ts-overlay" onClick={() => setDrawer(false)} />}
        <aside className="ts-drawer" data-open={drawer ? 'true' : 'false'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 12px 8px 22px' }}>
            <a href="관리자 홈.html" className="ts-sidebar__brand" style={{ padding: 0, textDecoration: 'none', color: 'inherit' }}>
              <span className="ts-sidebar__brand-dot">B</span>
              <div style={{ lineHeight: 1.2 }}>
                <div>{brand}</div>
                {brandSub && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)' }}>{brandSub}</div>}
              </div>
            </a>
            <button className="ts-mtoggle" style={{ background: 'transparent' }} onClick={() => setDrawer(false)}><Icon name="x" size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px' }}>
            {secs.map((s, i) => (
              <div key={s.label + i}>
                {s.label && <div className="adn-dgroup__label">{s.label}</div>}
                {s.items.map((it) => (
                  <Link key={it.id} it={it} active={active} onNav={onNav} onClose={() => setDrawer(false)} />
                ))}
              </div>
            ))}
          </div>
          <div className="ts-sidebar__foot">{UserChip}</div>
        </aside>

        <main className="ts-main">
          <div className="ts-main__inner">{children}</div>
        </main>

        {detail && (
          <>
            <div className="ad-drawer__scrim" onClick={() => setDetail(null)} />
            <aside className="ad-drawer" role="dialog" aria-label="상세">
              <div className="ad-drawer__top">
                <div style={{ minWidth: 0 }}>
                  <div className="ad-drawer__eyebrow">{detail.eyebrow || '상세 정보'}</div>
                  <div className="ad-drawer__title">{detail.title}</div>
                  {detail.sub && <div className="ad-drawer__sub">{detail.sub}</div>}
                </div>
                <button className="ad-iconbtn" onClick={() => setDetail(null)} title="닫기"><Icon name="x" size={18} /></button>
              </div>
              {detail.badge != null && <div style={{ padding: '0 22px 4px' }}><window.Badge tone={detail.tone || 'grey'}>{detail.badge}</window.Badge></div>}
              <div className="ad-drawer__body">
                {detail.fields.map((f, i) => (
                  <div key={i} className="ad-drawer__field">
                    <span className="ad-drawer__k">{f.label}</span>
                    <span className="ad-drawer__v">{f.value == null || f.value === '' ? '—' : f.value}</span>
                  </div>
                ))}
              </div>
              <div className="ad-drawer__foot">
                {detail.onDelete && (
                  <button type="button" className="ts-btn ts-btn--secondary" style={{ color: 'var(--danger)' }}
                    onClick={() => { const d = detail; setDetail(null); d.onDelete && d.onDelete(); }}>
                    <Icon name="trash-2" size={17} />삭제
                  </button>
                )}
                {detail.onEdit
                  ? <window.Btn block icon="edit-3" onClick={() => { const d = detail; setDetail(null); d.onEdit && d.onEdit(); }}>수정</window.Btn>
                  : <window.Btn block icon="check" onClick={() => { setDetail(null); window.adToast && window.adToast('확인했습니다'); }}>확인</window.Btn>}
              </div>
            </aside>
          </>
        )}

        {toast && <div className="ts-toast"><Icon name="check" size={16} />{toast}</div>}
      </div>
    );
  };

  // ── 페이지 헤더 ──────────────────────────────────────────
  window.PageHead = function PageHead({ eyebrow, title, sub, actions }) {
    return (
      <div className="ts-ph">
        <div className="ts-ph__row">
          <div>
            {eyebrow && <div className="ts-ph__eyebrow">{eyebrow}</div>}
            <div className="ts-ph__title">{title}</div>
            {sub && <div className="ts-ph__sub">{sub}</div>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
        </div>
      </div>
    );
  };

  // ── KPI 카드 그리드 ─────────────────────────────────────
  window.KpiGrid = function KpiGrid({ items }) {
    return (
      <div className="ad-kpi-grid">
        {items.map((k) => (
          <div key={k.label} className="ad-kpi">
            <div className="ad-kpi__top">
              <span className="ad-kpi__icon" data-tone={k.tone || 'primary'}><Icon name={k.icon} size={18} /></span>
              {k.delta != null && <span className="ad-kpi__delta" data-dir={k.delta >= 0 ? 'up' : 'down'}>{k.delta >= 0 ? '+' : ''}{k.delta}%</span>}
            </div>
            <div className="ad-kpi__val">{k.value}</div>
            <div className="ad-kpi__label">{k.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // ── 테이블 (그리드 기반) ────────────────────────────────
  window.DataTable = function DataTable({ cols, rows, render, empty, onRow }) {
    const gt = cols.map(c => c.w || '1fr').join(' ');
    if (!rows.length) return <window.Empty icon="inbox" title={empty || '데이터가 없습니다'} />;
    return (
      <div className="ad-tablescroll">
        <div className="ts-table ad-table">
          <div className="ts-thead" style={{ gridTemplateColumns: gt }}>
            {cols.map(c => <div key={c.key} style={{ textAlign: c.align || 'left' }}>{c.label}</div>)}
          </div>
          {rows.map((r, i) => (
            <div key={r.id || i} className="ts-trow" style={{ gridTemplateColumns: gt, cursor: onRow ? 'pointer' : 'default' }}
              onClick={onRow ? () => onRow(r) : undefined}>
              {cols.map(c => <div key={c.key} style={{ textAlign: c.align || 'left', minWidth: 0 }}>{render(r, c.key)}</div>)}
            </div>
          ))}
        </div>
      </div>
    );
  };
})();
