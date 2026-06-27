"use client";

// ============================================================
// shell.tsx — admin-v2 관리자 공용 셸 (R1 클린 슬레이트 토대)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/admin-shell.jsx
//   AdminShell(사이드바+모바일 토픽바/드로어+상세 드로어+토스트)
//   + PageHead + KpiGrid + DataTable. BackRow / footAction / 외부링크 nav.
//
//   이식 변경점(시각 동일성 보존):
//   - 정본 window.adToast / window.adDetail 데모 전역 → React Context 콜백.
//     (상세 드로어·토스트는 시안 스크린샷의 실제 UI라 거동 보존, 전역만 제거)
//   - className·마크업은 정본 그대로. data-admin="v2" 를 .ts-shell 루트에 부여
//     → src/styles/admin-v2/*.css 스코프 앵커(레거시와 충돌 0).
//   - home 은 하드코딩 "백오피스.html" 대신 라우트 prop(default "/v2").
//   - 레거시 0 import. 자기완결.
// ============================================================

import React from "react";
import { Icon, Btn, Badge, Empty } from "./kit";

// ── 셸 컨텍스트 (정본 window.adToast/adDetail 대체) ───────────────────
export type DetailField = { label: React.ReactNode; value: React.ReactNode };
export type DetailPayload = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  badge?: React.ReactNode;
  tone?: string;
  fields: DetailField[];
};

type AdminShellCtxValue = {
  toast: (msg: React.ReactNode) => void;
  openDetail: (payload: DetailPayload | null) => void;
};

const AdminShellCtx = React.createContext<AdminShellCtxValue>({
  toast: () => {},
  openDetail: () => {},
});

// blocks 등 하위 컴포넌트가 토스트/상세 드로어를 호출(정본 window.adToast/adDetail 자리).
// Provider 밖에서 호출되면 no-op.
export function useAdminShell(): AdminShellCtxValue {
  return React.useContext(AdminShellCtx);
}

// ── nav 항목 타입 ────────────────────────────────────────────────────
// { label } = 그룹 헤더 / { id, icon, text, badge } = 내부 링크 / { href, ... } = 외부 콘솔 링크
export type NavGroup = { label: string };
export type NavLink = {
  id: string;
  icon: string;
  text: string;
  badge?: React.ReactNode;
};
export type NavExternal = {
  href: string;
  icon: string;
  text: string;
  blank?: boolean;
};
export type NavItem = NavGroup | NavLink | NavExternal;

function Nav({
  nav,
  active,
  onNav,
  onClose,
}: {
  nav: NavItem[];
  active?: string;
  onNav: (id: string) => void;
  onClose?: () => void;
}) {
  return (
    <nav className="ts-sidebar__nav">
      {nav.map((it, i) =>
        "label" in it ? (
          <div key={"l" + i} className="ts-sidebar__label">
            {it.label}
          </div>
        ) : "href" in it ? (
          <a
            key={it.href}
            href={it.href}
            className="ts-navlink"
            title={it.text}
            target={it.blank ? "_blank" : undefined}
            rel={it.blank ? "noopener" : undefined}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Icon name={it.icon} size={19} />
            <span style={{ flex: 1 }}>{it.text}</span>
            <Icon name="arrow-up-right" size={14} style={{ color: "var(--ink-dim)" }} />
          </a>
        ) : (
          <button
            key={it.id + (active === it.id ? "-a" : "")}
            className="ts-navlink"
            data-active={active === it.id ? "true" : "false"}
            onClick={() => {
              onNav(it.id);
              onClose && onClose();
            }}
          >
            <Icon name={it.icon} size={19} />
            <span style={{ flex: 1 }}>{it.text}</span>
            {it.badge != null && (
              <span className="ts-navlink__badge">{it.badge}</span>
            )}
          </button>
        )
      )}
    </nav>
  );
}

export type AdminUser = { name: string; role: string; initial: string };

export type AdminShellProps = {
  brand: React.ReactNode;
  brandSub?: React.ReactNode;
  nav: NavItem[];
  active?: string;
  onNav: (id: string) => void;
  user?: AdminUser;
  children?: React.ReactNode;
  home?: string;
  isHome?: boolean;
  footAction?: React.ReactNode;
  onUser?: () => void; // 계정칩 클릭(정본 window.adToast 자리). 없으면 토스트.
};

export function AdminShell({
  brand,
  brandSub,
  nav,
  active,
  onNav,
  user,
  children,
  home,
  isHome,
  footAction,
  onUser,
}: AdminShellProps) {
  const [drawer, setDrawer] = React.useState(false);
  const [toast, setToast] = React.useState<React.ReactNode>(null);
  const [detail, setDetail] = React.useState<DetailPayload | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const homeHref = home || "/v2";

  React.useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
  }, [drawer]);

  const showToast = React.useCallback((msg: React.ReactNode) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const ctxValue = React.useMemo<AdminShellCtxValue>(
    () => ({ toast: showToast, openDetail: setDetail }),
    [showToast]
  );

  const activeText =
    (nav.find((n): n is NavLink => "id" in n && n.id === active)?.text) || "";

  const BackRow = (
    <div className="ts-backrow">
      <button
        type="button"
        className="ts-backbtn"
        onClick={() => window.history.back()}
        title="이전 페이지로"
      >
        <Icon name="arrow-left" size={16} />
        <span>뒤로</span>
      </button>
      <a href={homeHref} className="ts-backbtn" title="관리자 홈으로">
        <Icon name="home" size={16} />
        <span>관리자 홈</span>
      </a>
    </div>
  );

  const Brand = (
    <a
      href={homeHref}
      className="ts-sidebar__brand"
      title="관리자 홈으로"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <span className="ts-sidebar__brand-dot">B</span>
      <div style={{ lineHeight: 1.2 }}>
        <div>{brand}</div>
        {brandSub && (
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-mute)" }}>
            {brandSub}
          </div>
        )}
      </div>
    </a>
  );

  const UserChip = user && (
    <button
      className="ts-userchip"
      onClick={() => (onUser ? onUser() : showToast("계정 메뉴"))}
    >
      <span className="ts-avatar">{user.initial}</span>
      <div style={{ textAlign: "left", lineHeight: 1.3, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{user.role}</div>
      </div>
      <Icon
        name="chevron-right"
        size={16}
        style={{ marginLeft: "auto", color: "var(--ink-dim)" }}
      />
    </button>
  );

  return (
    <AdminShellCtx.Provider value={ctxValue}>
      {/* data-admin="v2" = admin-v2 CSS 스코프 앵커 */}
      <div className="ts-shell" data-admin="v2">
        {/* 데스크톱 사이드바 */}
        <aside className="ts-sidebar">
          {!isHome && BackRow}
          {Brand}
          <Nav nav={nav} active={active} onNav={onNav} />
          <div className="ts-sidebar__foot">
            {UserChip}
            {footAction}
          </div>
        </aside>

        {/* 모바일 토픽바 */}
        <header className="ts-topbar">
          <button className="ts-mtoggle" onClick={() => setDrawer(true)}>
            <Icon name="menu" size={20} />
          </button>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{activeText}</div>
        </header>

        {/* 모바일 드로어 */}
        {drawer && <div className="ts-overlay" onClick={() => setDrawer(false)} />}
        <aside className="ts-drawer" data-open={drawer ? "true" : "false"}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingRight: 12,
            }}
          >
            {Brand}
            <button
              className="ts-mtoggle"
              style={{ background: "transparent" }}
              onClick={() => setDrawer(false)}
            >
              <Icon name="x" size={20} />
            </button>
          </div>
          {!isHome && BackRow}
          <Nav nav={nav} active={active} onNav={onNav} onClose={() => setDrawer(false)} />
          <div className="ts-sidebar__foot">
            {UserChip}
            {footAction}
          </div>
        </aside>

        <main className="ts-main">
          <div className="ts-main__inner">{children}</div>
        </main>

        {/* 행 상세 드로어 (정본 adDetail) */}
        {detail && (
          <>
            <div className="ad-drawer__scrim" onClick={() => setDetail(null)} />
            <aside className="ad-drawer" role="dialog" aria-label="상세">
              <div className="ad-drawer__top">
                <div style={{ minWidth: 0 }}>
                  <div className="ad-drawer__eyebrow">
                    {detail.eyebrow || "상세 정보"}
                  </div>
                  <div className="ad-drawer__title">{detail.title}</div>
                  {detail.sub && <div className="ad-drawer__sub">{detail.sub}</div>}
                </div>
                <button
                  className="ad-iconbtn"
                  onClick={() => setDetail(null)}
                  title="닫기"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
              {detail.badge != null && (
                <div style={{ padding: "0 22px 4px" }}>
                  <Badge tone={(detail.tone as never) || "grey"}>
                    {detail.badge}
                  </Badge>
                </div>
              )}
              <div className="ad-drawer__body">
                {detail.fields.map((f, i) => (
                  <div key={i} className="ad-drawer__field">
                    <span className="ad-drawer__k">{f.label}</span>
                    <span className="ad-drawer__v">
                      {f.value == null || f.value === "" ? "—" : f.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="ad-drawer__foot">
                <Btn
                  variant="secondary"
                  block
                  icon="edit-3"
                  onClick={() => showToast("수정")}
                >
                  수정
                </Btn>
                <Btn
                  block
                  icon="check"
                  onClick={() => {
                    setDetail(null);
                    showToast("처리 완료");
                  }}
                >
                  확인
                </Btn>
              </div>
            </aside>
          </>
        )}

        {toast && (
          <div className="ts-toast">
            <Icon name="check" size={16} />
            {toast}
          </div>
        )}
      </div>
    </AdminShellCtx.Provider>
  );
}

// ── 페이지 헤더 ──────────────────────────────────────────────────────
export type PageHeadProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHead({ eyebrow, title, sub, actions }: PageHeadProps) {
  return (
    <div className="ts-ph">
      <div className="ts-ph__row">
        <div>
          {eyebrow && <div className="ts-ph__eyebrow">{eyebrow}</div>}
          <div className="ts-ph__title">{title}</div>
          {sub && <div className="ts-ph__sub">{sub}</div>}
        </div>
        {actions && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
        )}
      </div>
    </div>
  );
}

// ── KPI 카드 그리드 ─────────────────────────────────────────────────
export type KpiItem = {
  label: React.ReactNode;
  value: React.ReactNode;
  icon: string;
  tone?: string;
  delta?: number;
};

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className="ad-kpi-grid">
      {items.map((k, i) => (
        <div key={i} className="ad-kpi">
          <div className="ad-kpi__top">
            <span className="ad-kpi__icon" data-tone={k.tone || "primary"}>
              <Icon name={k.icon} size={18} />
            </span>
            {k.delta != null && (
              <span className="ad-kpi__delta" data-dir={k.delta >= 0 ? "up" : "down"}>
                {k.delta >= 0 ? "+" : ""}
                {k.delta}%
              </span>
            )}
          </div>
          <div className="ad-kpi__val">{k.value}</div>
          <div className="ad-kpi__label">{k.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── 테이블 (그리드 기반) ────────────────────────────────────────────
export type DataCol = {
  key: string;
  label: React.ReactNode;
  w?: string;
  align?: "left" | "center" | "right";
};

export type DataRow = { id?: string | number } & Record<string, unknown>;

export type DataTableProps = {
  cols: DataCol[];
  rows: DataRow[];
  render: (row: DataRow, key: string) => React.ReactNode;
  empty?: React.ReactNode;
  onRow?: (row: DataRow) => void;
};

export function DataTable({ cols, rows, render, empty, onRow }: DataTableProps) {
  const gt = cols.map((c) => c.w || "1fr").join(" ");
  if (!rows.length)
    return <Empty icon="inbox" title={empty || "데이터가 없습니다"} />;
  return (
    <div className="ad-tablescroll">
      <div className="ts-table ad-table">
        <div className="ts-thead" style={{ gridTemplateColumns: gt }}>
          {cols.map((c) => (
            <div key={c.key} style={{ textAlign: c.align || "left" }}>
              {c.label}
            </div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div
            key={r.id ?? i}
            className="ts-trow"
            style={{
              gridTemplateColumns: gt,
              cursor: onRow ? "pointer" : "default",
            }}
            onClick={onRow ? () => onRow(r) : undefined}
          >
            {cols.map((c) => (
              <div
                key={c.key}
                style={{ textAlign: c.align || "left", minWidth: 0 }}
              >
                {render(r, c.key)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
