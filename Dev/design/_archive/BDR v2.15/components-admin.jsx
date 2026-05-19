/* global React */

// =====================================================================
// components-admin.jsx — admin 영역 전용 8 컴포넌트
//
// Admin Phase A (2026-05-15)
//   - AdminShell           — sidebar + topbar + main wrapper
//   - AdminSidebar         — 6 group nav + 권한 필터
//   - AdminMobileNav       — 햄버거 + 드로어 (<1024)
//   - AdminPageHeader      — eyebrow / title / subtitle / actions
//   - AdminStatCard        — 통계 카드 (label / value / delta)
//   - AdminStatusTabs      — 상태 필터 탭 + count 뱃지
//   - AdminDetailModal     — 우측 슬라이드인 패널
//   - AdminEmptyState      — 빈 상태 카드 (icon / title / desc / CTA)
//
// 진입: AdminShell wrap 안에서 사용
// 복귀: setRoute('adminDashboard') = admin 영역 home 역할
// 에러: 각 컴포넌트가 EmptyState 자체 fallback
// =====================================================================

// 권한 별 sidebar 메뉴 — snake_case role
//   IA = 운영 src/components/admin/sidebar.tsx 의 navStructure 와 sync (2026-05-15)
//   - super_admin       — 모든 그룹 + 모든 항목 노출
//   - site_admin        — 콘텐츠 (대회/경기/팀/코트/커뮤니티+NEWS) + 사용자 (유저관리만) + 시스템 (분석)
//   - tournament_admin  — 콘텐츠 > 대회 관리 (parent click → adminWizardTournament 자동 진입 / G7) > 대회 운영자 도구
//   - partner_member    — 비즈니스 (광고 캠페인) + 외부 관리 (협력업체 관리)
//
// 단독 항목 (그룹 헤더 없음) 은 group_id='_standalone' 으로 표시 (대시보드)
const ADMIN_NAV = [
{
  group_id: '_standalone',
  group_title: null,
  roles: ['super_admin', 'site_admin', 'tournament_admin', 'partner_member'],
  items: [
  { key: 'adminDashboard', label: '대시보드', icon: 'dashboard' }]

},
{
  group_id: 'content',
  group_title: '콘텐츠',
  roles: ['super_admin', 'site_admin', 'tournament_admin'],
  items: [
  {
    key: 'adminTournaments',
    label: '대회 관리',
    icon: 'emoji_events',
    roles: ['super_admin', 'site_admin'],
    children: [
    { key: 'adminTournamentAdminHome', label: '대회 운영자 도구', icon: 'manage_accounts', roles: ['super_admin', 'site_admin', 'tournament_admin'] },
    { key: 'adminTournamentNew', label: '새 대회 만들기', icon: 'add_circle', roles: ['super_admin', 'site_admin', 'tournament_admin'] },
    { key: 'adminWizardTournament', label: '5-step 마법사 (v2.6)', icon: 'auto_fix_high', roles: ['super_admin', 'site_admin', 'tournament_admin'] }]

  },
  { key: 'adminGames', label: '경기 관리', icon: 'sports_basketball', roles: ['super_admin', 'site_admin'] },
  { key: 'adminTeams', label: '팀 관리', icon: 'groups', roles: ['super_admin', 'site_admin'] },
  { key: 'adminCourts', label: '코트 관리', icon: 'location_on', roles: ['super_admin', 'site_admin'] },
  {
    key: 'adminCommunity',
    label: '커뮤니티',
    icon: 'forum',
    roles: ['super_admin', 'site_admin'],
    children: [
    { key: 'adminNews', label: 'BDR NEWS', icon: 'newspaper', roles: ['super_admin', 'site_admin'] }]

  }]

},
{
  group_id: 'users',
  group_title: '사용자',
  roles: ['super_admin', 'site_admin'],
  items: [
  { key: 'adminUsers', label: '유저 관리', icon: 'group', roles: ['super_admin', 'site_admin'] },
  { key: 'adminGameReports', label: '신고 검토', icon: 'report', roles: ['super_admin'] },
  { key: 'adminSuggestions', label: '건의사항', icon: 'lightbulb', roles: ['super_admin'] }]

},
{
  group_id: 'biz',
  group_title: '비즈니스',
  roles: ['super_admin', 'partner_member'],
  items: [
  { key: 'adminPlans', label: '요금제 관리', icon: 'payments', roles: ['super_admin'] },
  { key: 'adminPayments', label: '결제', icon: 'credit_card', roles: ['super_admin'] },
  { key: 'adminCampaigns', label: '광고 캠페인', icon: 'campaign', roles: ['super_admin', 'partner_member'] },
  { key: 'adminPartners', label: '파트너 관리', icon: 'handshake', roles: ['super_admin'] }]

},
{
  group_id: 'sys',
  group_title: '시스템',
  roles: ['super_admin', 'site_admin'],
  items: [
  { key: 'adminAnalytics', label: '분석', icon: 'analytics', roles: ['super_admin', 'site_admin'] },
  { key: 'adminNotifications', label: '알림 발송', icon: 'notifications_active', roles: ['super_admin'] },
  { key: 'adminSettings', label: '시스템 설정', icon: 'settings', roles: ['super_admin'] },
  { key: 'adminLogs', label: '활동 로그', icon: 'list_alt', roles: ['super_admin'] }]

},
{
  group_id: 'external',
  group_title: '외부 관리',
  roles: ['super_admin', 'partner_member'],
  items: [
  { key: 'adminOrganizations', label: '단체 관리', icon: 'domain', roles: ['super_admin'] },
  { key: 'partnerAdminEntry', label: '협력업체 관리', icon: 'storefront', roles: ['partner_member'] },
  { key: 'adminWizardAssociation', label: '협회 마법사', icon: 'verified', roles: ['super_admin'] }]

}];


// =====================================================================
// AdminShell — wrapper
// =====================================================================
function AdminShell({
  title,
  eyebrow,
  subtitle,
  actions,
  breadcrumbs,
  sidebarVariant = 'default',
  route,
  setRoute,
  adminRole = 'super_admin',
  setAdminRole,
  theme,
  setTheme,
  children,
  hideHeader = false,
  topbarLeft = null,
  topbarRight = null
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const hidden = sidebarVariant === 'hidden';
  return (
    <div className={`admin-shell ${hidden ? 'admin-shell--hidden-aside' : ''}`}>
      {!hidden &&
      <AdminSidebar route={route} setRoute={setRoute} adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme} />
      }
      {!hidden &&
      <AdminMobileNav
        open={mobileOpen}
        setOpen={setMobileOpen}
        route={route}
        setRoute={setRoute}
        adminRole={adminRole}
        setAdminRole={setAdminRole}
        theme={theme}
        setTheme={setTheme} />

      }

      <main className="admin-main">
        <div className="admin-topbar">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {topbarLeft}
          </div>
          {topbarRight ||
          <button className="admin-user" type="button">
              <div className="admin-user__avatar">DH</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>김도훈</span>
                <span className="admin-user__role">{adminRole.replace('_', ' ')}</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
            </button>
          }
        </div>

        <div className="admin-main__inner">
          {!hideHeader &&
          <AdminPageHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            actions={actions}
            breadcrumbs={breadcrumbs} />

          }
          {children}
        </div>
      </main>
    </div>);

}

// =====================================================================
// AdminSidebar
// =====================================================================
function filterNavByRole(role) {
  // G7 (2026-05-15) — 운영 sidebar.tsx 의 effectiveHref 패턴 sync.
  //   parent self-blocked + child visible 시: parent 라벨/아이콘 유지하되
  //   key 를 child 첫 항목으로 rewrite → 클릭 시 권한 있는 child 페이지로 자연 진입 (1 click UX).
  //   header_only 분기 완전 제거.
  const out = [];
  for (const grp of ADMIN_NAV) {
    if (!grp.roles.includes(role)) continue;
    const items = [];
    for (const it of grp.items) {
      // 1) children 먼저 재귀 필터
      const filteredChildren = (it.children || []).filter((c) => !c.roles || c.roles.includes(role));
      const hasVisibleChildren = filteredChildren.length > 0;
      // 2) self 가시성
      const selfVisible = !it.roles || it.roles.includes(role);
      // 3) self / children 모두 차단 → 항목 제거
      if (!selfVisible && !hasVisibleChildren) continue;
      // 4) self 차단 + child 노출 → key 를 child 의 첫 key 로 rewrite
      //    (UX: parent label/icon 유지 + click 시 권한 있는 child 페이지로 진입)
      const effectiveKey = !selfVisible && hasVisibleChildren ? filteredChildren[0].key : it.key;
      items.push({ ...it, key: effectiveKey, children: filteredChildren });
    }
    if (items.length > 0) out.push({ ...grp, items });
  }
  return out;
}

function AdminSidebar({ route, setRoute, adminRole, setAdminRole, theme, setTheme }) {
  const nav = filterNavByRole(adminRole);
  return (
    <aside className="admin-aside">
      <div className="admin-aside__logo">
        <span>MyBDR</span>
        <span className="admin-aside__logo-badge">ADMIN</span>
      </div>

      {/* MOCK 권한 토글 — 시안 검증용 */}
      <div style={{
        padding: '8px 12px', margin: '8px 8px 0',
        background: 'var(--bg-alt)', borderRadius: 4,
        fontFamily: 'var(--ff-mono)', fontSize: 10,
        color: 'var(--ink-mute)', letterSpacing: '0.04em'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>MOCK · 권한</div>
        <select
          value={adminRole}
          onChange={(e) => setAdminRole?.(e.target.value)}
          style={{ width: '100%', fontSize: 11, padding: '3px 4px' }}>

          <option value="super_admin">super_admin</option>
          <option value="site_admin">site_admin</option>
          <option value="tournament_admin">tournament_admin</option>
          <option value="partner_member">partner_member</option>
        </select>
      </div>

      <nav className="admin-aside__nav">
        {nav.map((grp) =>
        <div key={grp.group_id} className="admin-aside__group">
            {grp.group_title && <div className="admin-aside__title">{grp.group_title}</div>}
            {grp.items.map((it) =>
          <React.Fragment key={it.key}>
                <button
              type="button"
              className="admin-aside__link"
              data-active={route === it.key ? 'true' : 'false'}
              onClick={() => setRoute(it.key)}>

                  <span className="material-symbols-outlined">{it.icon}</span>
                  <span>{it.label}</span>
                </button>
                {(it.children || []).map((c) =>
            <button
              key={c.key}
              type="button"
              className="admin-aside__link"
              data-active={route === c.key ? 'true' : 'false'}
              data-child="true"
              onClick={() => setRoute(c.key)}>

                    <span className="material-symbols-outlined">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
            )}
              </React.Fragment>
          )}
          </div>
        )}

        {nav.length === 0 &&
        <div style={{ padding: 16, fontSize: 12, color: 'var(--ink-mute)', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, marginBottom: 4 }}>lock</span>
            <div>관리 권한 없음</div>
          </div>
        }
      </nav>

      <div className="admin-aside__foot">
        {setTheme && (
          <div style={{ padding: '4px 6px 6px', display: 'flex', justifyContent: 'center' }}>
            <ThemeSwitch theme={theme} setTheme={setTheme} />
          </div>
        )}
        <button type="button" className="admin-aside__foot-link" onClick={() => setRoute('adminMe')}>
          <span className="material-symbols-outlined">account_circle</span>
          마이페이지
        </button>
        <button type="button" className="admin-aside__foot-link" onClick={() => setRoute('home')}>
          <span className="material-symbols-outlined">arrow_back</span>
          사이트로 돌아가기
        </button>
      </div>
    </aside>);

}

// =====================================================================
// AdminMobileNav — 햄버거 + 드로어 (<1024)
// =====================================================================
function AdminMobileNav({ open, setOpen, route, setRoute, adminRole, setAdminRole, theme, setTheme }) {
  const nav = filterNavByRole(adminRole);
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, setOpen]);

  return (
    <>
      <button
        className="admin-mobile-toggle"
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="메뉴 열기">

        <span className="material-symbols-outlined">menu</span>
      </button>

      <div className="admin-mobile-overlay" data-open={open ? 'true' : 'false'} onClick={() => setOpen(false)}></div>
      <aside className="admin-mobile-drawer" data-open={open ? 'true' : 'false'}>
        <div className="admin-mobile-drawer__head">
          <div className="admin-mobile-drawer__head-avatar">DH</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="admin-mobile-drawer__head-name">김도훈</div>
            <div className="admin-mobile-drawer__head-email">admin@mybdr.kr</div>
          </div>
          <button
            type="button"
            className="admin-detail-modal__close"
            onClick={() => setOpen(false)}
            aria-label="닫기">

            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={{ padding: '8px 12px' }}>
          <select
            value={adminRole}
            onChange={(e) => setAdminRole?.(e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '6px 8px', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 4 }}>

            <option value="super_admin">super_admin</option>
            <option value="site_admin">site_admin</option>
            <option value="tournament_admin">tournament_admin</option>
            <option value="partner_member">partner_member</option>
          </select>
        </div>

        <div className="admin-mobile-drawer__body">
          {nav.map((grp) =>
          <div key={grp.group_id} className="admin-aside__group">
              {grp.group_title && <div className="admin-aside__title">{grp.group_title}</div>}
              {grp.items.map((it) =>
            <React.Fragment key={it.key}>
                  <button
                type="button"
                className="admin-aside__link"
                data-active={route === it.key ? 'true' : 'false'}
                onClick={() => {
                  setRoute(it.key);
                  setOpen(false);
                }}>

                    <span className="material-symbols-outlined">{it.icon}</span>
                    <span>{it.label}</span>
                  </button>
                  {(it.children || []).map((c) =>
              <button
                key={c.key}
                type="button"
                className="admin-aside__link"
                data-child="true"
                data-active={route === c.key ? 'true' : 'false'}
                onClick={() => {
                  setRoute(c.key);
                  setOpen(false);
                }}>

                      <span className="material-symbols-outlined">{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
              )}
                </React.Fragment>
            )}
            </div>
          )}
        </div>

        <div className="admin-mobile-drawer__foot">
          {setTheme && (
            <div style={{ padding: '4px 6px 6px', display: 'flex', justifyContent: 'center' }}>
              <ThemeSwitch theme={theme} setTheme={setTheme} />
            </div>
          )}
          <button type="button" className="admin-aside__foot-link" onClick={() => { setRoute('adminMe'); setOpen(false); }}>
            <span className="material-symbols-outlined">account_circle</span>마이페이지
          </button>
          <button type="button" className="admin-aside__foot-link" onClick={() => { setRoute('home'); setOpen(false); }}>
            <span className="material-symbols-outlined">arrow_back</span>사이트로 돌아가기
          </button>
          <button type="button" className="admin-aside__foot-link">
            <span className="material-symbols-outlined">logout</span>로그아웃
          </button>
        </div>
      </aside>
    </>);

}

// =====================================================================
// AdminPageHeader
// =====================================================================
function AdminPageHeader({ eyebrow, title, subtitle, actions, breadcrumbs }) {
  return (
    <header className="admin-pageheader">
      <div className="admin-pageheader__body">
        {breadcrumbs &&
        <div className="admin-pageheader__breadcrumbs">
            {breadcrumbs.map((b, i) =>
          <React.Fragment key={i}>
                {i > 0 && <span style={{ opacity: 0.4 }}>›</span>}
                {b.onClick ?
            <a onClick={b.onClick}>{b.label}</a> :

            <span style={{ color: 'var(--ink)' }}>{b.label}</span>
            }
              </React.Fragment>
          )}
          </div>
        }
        {eyebrow && <div className="admin-pageheader__eyebrow">{eyebrow}</div>}
        {title && <h1 className="admin-pageheader__title">{title}</h1>}
        {subtitle && <p className="admin-pageheader__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="admin-pageheader__actions">{actions}</div>}
    </header>);

}

// =====================================================================
// AdminStatCard
// =====================================================================
function AdminStatCard({ label, value, icon, delta, trend = 'flat', link, onClick, skeleton }) {
  if (skeleton) {
    return (
      <div className="admin-stat admin-stat--skel">
        <div className="admin-stat__head"></div>
        <div className="admin-stat__value"></div>
        <div className="admin-stat__delta"></div>
      </div>);

  }
  const Tag = link || onClick ? 'button' : 'div';
  return (
    <Tag
      className="admin-stat"
      data-link={link || onClick ? 'true' : 'false'}
      onClick={onClick}
      style={{ border: 0, background: 'var(--bg-card)' }}>

      <div className="admin-stat__head">
        {icon && <span className="material-symbols-outlined">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="admin-stat__value">{value}</div>
      {delta &&
      <div className="admin-stat__delta" data-trend={trend}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat'}
          </span>
          {delta}
        </div>
      }
    </Tag>);

}

// =====================================================================
// AdminStatusTabs
// =====================================================================
function AdminStatusTabs({ tabs, current, onChange }) {
  return (
    <div className="admin-status-tabs" role="tablist">
      {tabs.map((t) =>
      <button
        key={t.key}
        type="button"
        role="tab"
        className="admin-status-tab"
        data-active={current === t.key ? 'true' : 'false'}
        onClick={() => onChange(t.key)}>

          <span>{t.label}</span>
          {t.count != null && (
          <span className="admin-status-tab__count" data-overflow={t.count > 99 ? 'true' : 'false'}>
              {t.count > 99 ? '99+' : t.count}
            </span>
          )}
        </button>
      )}
    </div>);

}

// =====================================================================
// AdminDetailModal — right slide-in
// =====================================================================
function AdminDetailModal({ open, onClose, title, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="admin-detail-overlay" onClick={onClose}></div>
      <aside className="admin-detail-modal" role="dialog" aria-modal="true">
        <header className="admin-detail-modal__head">
          <span className="admin-detail-modal__title">{title}</span>
          <button
            type="button"
            className="admin-detail-modal__close"
            onClick={onClose}
            aria-label="닫기">

            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <div className="admin-detail-modal__body">{children}</div>
        {footer && <div className="admin-detail-modal__foot">{footer}</div>}
      </aside>
    </>);

}

// =====================================================================
// AdminEmptyState
// =====================================================================
function AdminEmptyState({ icon = 'inbox', title, description, ctaLabel, onCta }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty__icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="admin-empty__title">{title}</h3>
      {description && <p className="admin-empty__desc">{description}</p>}
      {ctaLabel &&
      <div className="admin-empty__cta">
          <button type="button" className="btn btn--primary" onClick={onCta}>{ctaLabel}</button>
        </div>
      }
    </div>);

}

// =====================================================================
// AdminFilterBar — 검색 + 셀렉트 N개 + 우측 액션 (Admin-B prototype)
// Props:
//   - search        { value, onChange, placeholder }
//   - filters       [{ key, label, value, onChange, options: [{value,label}] }]
//   - actions       오른쪽 액션 영역 (보조 버튼들)
//   - onReset       (옵션) 전체 초기화 콜백 — 있으면 "필터 초기화" 링크 노출
// =====================================================================
function AdminFilterBar({ search, filters = [], actions, onReset }) {
  return (
    <div className="admin-filterbar">
      {search && (
        <div className="admin-filterbar__search">
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <input
            type="search"
            className="admin-filterbar__search-input"
            placeholder={search.placeholder || '검색'}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)} />
        </div>
      )}
      <div className="admin-filterbar__filters">
        {filters.map((f) => (
          <label key={f.key} className="admin-filterbar__filter">
            <span className="admin-filterbar__filter-label">{f.label}</span>
            <select
              className="admin-filterbar__filter-select"
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}>
              {(f.options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        ))}
        {onReset && (
          <button
            type="button"
            className="admin-filterbar__reset"
            onClick={onReset}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>restart_alt</span>
            초기화
          </button>
        )}
      </div>
      {actions && <div className="admin-filterbar__actions">{actions}</div>}
    </div>);
}

// =====================================================================
// AdminDataTable — 데이터 테이블 (Admin-B prototype)
// Props:
//   - columns       [{ key, label, width, align, sortable, render(row) }]
//   - rows          [{ id, ...fields }]
//   - keyField      'id' (default)
//   - state         'filled' | 'empty' | 'loading' | 'error'
//   - emptyTitle    (state='empty' 시 노출)
//   - emptyDesc
//   - emptyCtaLabel / onEmptyCta
//   - onRowClick    (row) => void
//   - sort          { key, dir }
//   - onSortChange  (newSort) => void
//   - selectable    행 체크박스 노출
//   - selected      Set | array of selected ids
//   - onSelectChange (next) => void
//   - pagination    { page, total, perPage, onChange(newPage) }
// =====================================================================
function AdminDataTable({
  columns,
  rows = [],
  keyField = 'id',
  state = 'filled',
  emptyTitle = '데이터가 없어요',
  emptyDesc,
  emptyCtaLabel,
  onEmptyCta,
  onRowClick,
  sort,
  onSortChange,
  selectable,
  selected = [],
  onSelectChange,
  pagination
}) {
  const isAllSelected = selectable && rows.length > 0 && rows.every((r) => selected.includes(r[keyField]));
  const isSomeSelected = selectable && rows.some((r) => selected.includes(r[keyField])) && !isAllSelected;

  const toggleAll = () => {
    if (!onSelectChange) return;
    if (isAllSelected) onSelectChange([]);
    else onSelectChange(rows.map((r) => r[keyField]));
  };
  const toggleOne = (id) => {
    if (!onSelectChange) return;
    if (selected.includes(id)) onSelectChange(selected.filter((s) => s !== id));
    else onSelectChange([...selected, id]);
  };

  const handleSort = (col) => {
    if (!col.sortable || !onSortChange) return;
    if (sort?.key === col.key) {
      onSortChange({ key: col.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ key: col.key, dir: 'asc' });
    }
  };

  return (
    <div className="admin-table-wrap">
      {state === 'error' ? (
        <AdminEmptyState
          icon="cloud_off"
          title="데이터 로드 실패"
          description="잠시 후 다시 시도하세요."
          ctaLabel="다시 시도"
          onCta={onEmptyCta} />
      ) : state === 'loading' ? (
        <div className="admin-table">
          <table>
            <thead><tr>
              {selectable && <th style={{ width: 36 }}></th>}
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width, textAlign: c.align || 'left' }}>{c.label}</th>
              ))}
            </tr></thead>
            <tbody>
              {[1,2,3,4,5].map((i) => (
                <tr key={i} className="admin-table__row admin-table__row--skel">
                  {selectable && <td></td>}
                  {columns.map((c) => (
                    <td key={c.key}><span className="admin-skel" style={{ display: 'inline-block', height: 12, width: '70%' }}></span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : state === 'empty' || rows.length === 0 ? (
        <AdminEmptyState
          icon="inventory_2"
          title={emptyTitle}
          description={emptyDesc}
          ctaLabel={emptyCtaLabel}
          onCta={onEmptyCta} />
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                {selectable && (
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                      onChange={toggleAll}
                      aria-label="모두 선택"/>
                  </th>
                )}
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{ width: c.width, textAlign: c.align || 'left', cursor: c.sortable ? 'pointer' : 'default' }}
                    data-sortable={c.sortable ? 'true' : 'false'}
                    onClick={() => handleSort(c)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {c.label}
                      {c.sortable && (
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 14, opacity: sort?.key === c.key ? 1 : 0.3 }}>
                          {sort?.key === c.key ? (sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r[keyField]}
                  className="admin-table__row"
                  data-clickable={onRowClick ? 'true' : 'false'}
                  data-selected={selectable && selected.includes(r[keyField]) ? 'true' : 'false'}
                  onClick={(e) => {
                    if (e.target.closest('input,button,a,.admin-row-stop')) return;
                    onRowClick?.(r);
                  }}>
                  {selectable && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(r[keyField])}
                        onChange={() => toggleOne(r[keyField])}
                        aria-label="선택"/>
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && state === 'filled' && rows.length > 0 && (
        <AdminPagination {...pagination} />
      )}
    </div>);
}

function AdminPagination({ page, total, perPage = 20, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const pageList = [];
  const minP = Math.max(1, page - 2);
  const maxP = Math.min(totalPages, page + 2);
  for (let i = minP; i <= maxP; i++) pageList.push(i);
  return (
    <div className="admin-pagination">
      <div className="admin-pagination__info">
        <span style={{ fontFamily: 'var(--ff-mono)' }}>{start}–{end}</span> / 총 <span style={{ fontFamily: 'var(--ff-mono)' }}>{total}</span>건
      </div>
      <div className="admin-pagination__pages">
        <button type="button" className="admin-pagination__btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
        </button>
        {minP > 1 && (
          <>
            <button type="button" className="admin-pagination__btn" onClick={() => onChange(1)}>1</button>
            {minP > 2 && <span className="admin-pagination__ellipsis">…</span>}
          </>
        )}
        {pageList.map((p) => (
          <button
            key={p}
            type="button"
            className="admin-pagination__btn"
            data-active={p === page ? 'true' : 'false'}
            onClick={() => onChange(p)}>
            {p}
          </button>
        ))}
        {maxP < totalPages && (
          <>
            {maxP < totalPages - 1 && <span className="admin-pagination__ellipsis">…</span>}
            <button type="button" className="admin-pagination__btn" onClick={() => onChange(totalPages)}>{totalPages}</button>
          </>
        )}
        <button type="button" className="admin-pagination__btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
        </button>
      </div>
    </div>);
}

Object.assign(window, {
  ADMIN_NAV,
  filterNavByRole,
  AdminShell,
  AdminSidebar,
  AdminMobileNav,
  AdminPageHeader,
  AdminStatCard,
  AdminStatusTabs,
  AdminDetailModal,
  AdminEmptyState,
  AdminDataTable,
  AdminFilterBar
});
