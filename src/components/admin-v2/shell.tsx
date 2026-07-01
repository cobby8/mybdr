"use client";

// ============================================================
// shell.tsx — admin-v2 관리자 공용 셸 (ADM-V1 듀얼네비 v52)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/admin-shell.jsx
//
//   v52 변경점:
//     단일 .ts-sidebar(248px) → 듀얼네비(adn-rail 76px + adn-panel 236px)
//     - 레일: 섹션별 아이콘 버튼 (parseSections 로 {label} 마커 자동 파싱)
//     - 패널: 컨텍스트 패널 (flatPanel=true: 전 섹션 / false: 활성 섹션)
//     - roles?: 역할 필터 prop (D2: 배선은 후속, 타입만 추가)
//     - NavLink.children: D3 결정에 따라 생략
//   모바일(≤900px): 기존 ts-topbar + ts-drawer 유지 (adn-rail/panel hidden)
//   하위호환: 기존 5개 셸 래퍼(V2Shell/TaShell/OperateShell/PartnerShell/RefereeShell)
//            nav prop 형태 무변경으로 동작.
//
//   이식 변경점(시각 동일성 보존):
//   - 정본 window.adToast / window.adDetail → React Context 콜백
//   - home prop(default "/v2") / isHome prop / footAction prop 유지
//   - [data-admin="v2"] 스코프 앵커 유지
// ============================================================

import React from "react";
import { Icon, Btn, Badge, Empty } from "./kit";

// ── 셸 컨텍스트 ──────────────────────────────────────────────────────────
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

export function useAdminShell(): AdminShellCtxValue {
  return React.useContext(AdminShellCtx);
}

// ── nav 항목 타입 ─────────────────────────────────────────────────────────
export type NavGroup    = { label: string };
export type NavLink     = { id: string; icon: string; text: string; badge?: React.ReactNode };
export type NavExternal = { href: string; icon: string; text: string; blank?: boolean };
export type NavItem     = NavGroup | NavLink | NavExternal;

// ── 섹션 타입 (parseSections 출력) ────────────────────────────────────────
type SectionItem = NavLink | NavExternal;
type Section = {
  label: string;
  icon: string;
  ids: string[];      // NavLink.id 만 (active 감지용)
  hasBadge: boolean;
  items: SectionItem[];
};

// ── 섹션 레이블 → 레일 아이콘 매핑 (정본 LABEL_ICON 확장) ──────────────────
const LABEL_ICON: Record<string, string> = {
  // 공통
  "운영":          "layout-dashboard",
  "운영 콘솔":     "monitor",
  "운영 메뉴":     "menu",
  "회원·팀":       "users",
  "대회·경기":     "trophy",
  "시설·제휴":     "map-pin",
  "정산·플랜":     "credit-card",
  "정산":          "credit-card",
  "커뮤니티":      "message-square",
  "시스템":        "settings-2",
  "구성":          "layers",
  "배정":          "clipboard-list",
  "심판단":        "gavel",
  "명단·신청":     "user-check",
  "경기·평가":     "activity",
  "평가·정산":     "star",
  "설정":          "settings-2",
  "시설":          "building-2",
  "캠페인":        "megaphone",
  "마케팅":        "megaphone",
  // 백오피스(V2Shell) 11콘솔 레이블 (hub-data.jsx icon 명시 준거)
  "유저 콘솔":     "users",
  "매칭 콘솔":     "volleyball",
  "커뮤니티 콘솔": "message-square",
  "코트 콘솔":     "map-pin",
  "대회 콘솔":     "trophy",
  "심판 콘솔":     "gavel",
  "협력업체 콘솔": "handshake",
  "마케팅 콘솔":   "megaphone",
};

// ── grouped nav 배열 → 섹션 파싱 (정본 parseSections 1:1) ────────────────
function parseSections(nav: NavItem[]): Section[] {
  const secs: Section[] = [];
  let cur: Section | null = null;

  for (const it of nav) {
    if ("label" in it) {
      cur = { label: it.label, icon: "", ids: [], hasBadge: false, items: [] };
      secs.push(cur);
    } else {
      // NavLink 또는 NavExternal
      if (!cur) {
        cur = { label: "", icon: "", ids: [], hasBadge: false, items: [] };
        secs.push(cur);
      }
      cur.items.push(it as SectionItem);
      if ("id" in it) {
        cur.ids.push(it.id);
        if (it.badge != null) cur.hasBadge = true;
      }
    }
  }

  // 빈 섹션 제거
  const live = secs.filter((s) => s.items.length > 0);
  live.forEach((s) => {
    // 익명 섹션(라벨 없는 단독 항목): 항목 텍스트를 레이블로 사용
    if (!s.label && s.items.length === 1) {
      s.label = s.items[0].text;
    }
    s.icon =
      LABEL_ICON[s.label] ||
      (s.items[0] ? s.items[0].icon : "") ||
      "square";
  });
  return live;
}

// ── 패널/드로어 공용 nav 링크 (정본 Link → PanelLink) ──────────────────────
function PanelLink({
  it,
  active,
  onNav,
  onClose,
}: {
  it: SectionItem;
  active?: string;
  onNav: (id: string) => void;
  onClose?: () => void;
}) {
  if ("href" in it) {
    // NavExternal — 외부 콘솔 런처
    return (
      <a
        href={it.href}
        className="adn-link"
        target={it.blank ? "_blank" : undefined}
        rel={it.blank ? "noopener" : undefined}
        onClick={onClose}
      >
        <Icon name={it.icon} size={18} />
        <span className="adn-link__t">{it.text}</span>
        <Icon
          name="arrow-up-right"
          size={15}
          style={{ marginLeft: "auto", color: "var(--ink-dim)", flex: "0 0 auto" }}
        />
      </a>
    );
  }
  // NavLink — 내부 상태/라우트 전환
  return (
    <button
      className="adn-link"
      data-active={active === it.id ? "true" : "false"}
      onClick={() => {
        onNav(it.id);
        onClose?.();
      }}
    >
      <Icon name={it.icon} size={18} />
      <span className="adn-link__t">{it.text}</span>
      {it.badge != null && (
        <span className="adn-link__badge">{it.badge}</span>
      )}
    </button>
  );
}

// ── AdminUser / AdminShellProps ───────────────────────────────────────────
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
  onUser?: () => void;
  /** 역할 필터 (D2: 이번 PR은 타입만 — 배선은 후속) */
  roles?: string[];
  /** 패널 표시 모드. true: 전 섹션 나열. false(기본·정본): 레일 선택 섹션만 표시 → 레일 클릭 시 패널 전환. */
  flatPanel?: boolean;
};

// ── AdminShell ────────────────────────────────────────────────────────────
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
  // roles: 후속(D2) — 현재 미사용, 타입 수신만
  // flatPanel=false(정본): 레일 선택 섹션만 패널에 표시. true: 전 섹션 나열(flat).
  flatPanel = false,
}: AdminShellProps) {
  const [drawer, setDrawer] = React.useState(false);
  const [toast, setToast] = React.useState<React.ReactNode>(null);
  const [detail, setDetail] = React.useState<DetailPayload | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const homeHref = home || "/v2";

  // 섹션 파싱 + 활성 섹션 인덱스
  const secs = parseSections(nav);
  const activeSecIdx = Math.max(
    0,
    secs.findIndex((s) => s.ids.includes(active ?? ""))
  );
  const [railSec, setRailSec] = React.useState(activeSecIdx);

  // active prop 변경(딥링크/페이지 이동) 시 레일 섹션 동기화
  React.useEffect(() => {
    setRailSec(activeSecIdx);
  }, [activeSecIdx]);

  const panelSec: Section = secs[railSec] ?? secs[0] ?? {
    label: "",
    icon: "",
    ids: [],
    hasBadge: false,
    items: [],
  };

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

  // 레일 클릭: 섹션 전환 + 해당 섹션의 첫 NavLink로 이동(현재 active가 섹션 밖인 경우만)
  const onRailClick = (i: number) => {
    setRailSec(i);
    const firstLink = secs[i]?.items.find(
      (it): it is NavLink => "id" in it
    );
    if (firstLink && !secs[i].ids.includes(active ?? "")) {
      onNav(firstLink.id);
    }
  };

  // 현재 active id의 텍스트 (모바일 토픽바 표시용)
  const activeText =
    (nav.find((n): n is NavLink => "id" in n && n.id === active)?.text) || "";

  // UserChip (패널 foot + 드로어 foot 공통)
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

  // Brand (모바일 드로어 헤더용 — ts-sidebar__brand 클래스 재사용)
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

  // BackRow — 모바일 드로어에만 표시 (데스크톱은 레일 brand 버튼으로 홈 이동)
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

  return (
    <AdminShellCtx.Provider value={ctxValue}>
      {/* data-admin="v2" = admin-v2 CSS 스코프 앵커 */}
      <div className="ts-shell" data-admin="v2">

        {/* ── 데스크톱 — 아이콘 레일 (76px) ── */}
        <aside className="adn-rail">
          <a href={homeHref} className="adn-rail__brand" title="관리자 홈으로">
            B
          </a>
          <div className="adn-rail__nav">
            {secs.map((s, i) => (
              <button
                key={s.label + i}
                className="adn-railitem"
                data-active={i === railSec ? "true" : "false"}
                onClick={() => onRailClick(i)}
                title={s.label}
              >
                <Icon name={s.icon} size={20} />
                <span className="adn-railitem__lbl">{s.label}</span>
                {s.hasBadge && i !== railSec && (
                  <span className="adn-railitem__dot" />
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* ── 데스크톱 — 컨텍스트 패널 (236px) ── */}
        <aside className="adn-panel">
          <div className="adn-panel__head">
            {/* eyebrow: flatPanel=false(기본) → "brand · brandSub" 계층. true → brand만. */}
            <div className="adn-panel__eyebrow">
              {flatPanel ? (
                brand
              ) : (
                <>
                  {brand}
                  {brandSub != null ? <> · {brandSub}</> : null}
                </>
              )}
            </div>
            {/* title: flatPanel=true → brandSub(없으면 brand). false → 섹션명 */}
            <div className="adn-panel__title">
              {flatPanel
                ? (brandSub ?? brand)
                : (panelSec.label || (brandSub ?? brand))}
            </div>
          </div>
          {/* key=railSec: flatPanel=false 모드에서 레일 클릭 → railSec 변경 → nav remount → CSS slide-in 트리거.
              flatPanel=true 모드에서는 key=undefined → remount 없음(애니메이션 초기 마운트 1회만). */}
          <nav className="adn-panel__nav" key={flatPanel ? undefined : railSec}>
            {(flatPanel ? secs : [panelSec]).map((s, i) => (
              <div key={s.label + i}>
                {/* flatPanel 모드에서만 섹션 레이블 노출 */}
                {flatPanel && s.label && (
                  <div className="adn-dgroup__label">{s.label}</div>
                )}
                {s.items.map((it) => (
                  <PanelLink
                    key={"id" in it ? it.id : it.href}
                    it={it}
                    active={active}
                    onNav={onNav}
                  />
                ))}
              </div>
            ))}
          </nav>
          <div className="adn-panel__foot">
            {UserChip}
            {footAction}
          </div>
        </aside>

        {/* ── 모바일 토픽바 ── */}
        <header className="ts-topbar">
          <button className="ts-mtoggle" onClick={() => setDrawer(true)}>
            <Icon name="menu" size={20} />
          </button>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{activeText}</div>
        </header>

        {/* ── 모바일 드로어 ── */}
        {drawer && (
          <div className="ts-overlay" onClick={() => setDrawer(false)} />
        )}
        <aside className="ts-drawer" data-open={drawer ? "true" : "false"}>
          {/* 드로어 헤더: Brand + 닫기 버튼 */}
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
          {/* 뒤로/홈 버튼 (서브 페이지에서만) */}
          {!isHome && BackRow}
          {/* 섹션별 nav 링크 (adn-link + adn-dgroup__label) */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 12px" }}>
            {secs.map((s, i) => (
              <div key={s.label + i}>
                {s.label && (
                  <div className="adn-dgroup__label">{s.label}</div>
                )}
                {s.items.map((it) => (
                  <PanelLink
                    key={"id" in it ? it.id : it.href}
                    it={it}
                    active={active}
                    onNav={onNav}
                    onClose={() => setDrawer(false)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="ts-sidebar__foot">
            {UserChip}
            {footAction}
          </div>
        </aside>

        {/* ── 컨텐츠 메인 ── */}
        <main className="ts-main">
          <div className="ts-main__inner">{children}</div>
        </main>

        {/* ── 행 상세 드로어 (정본 adDetail) ── */}
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
                  {detail.sub && (
                    <div className="ad-drawer__sub">{detail.sub}</div>
                  )}
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

        {/* ── 토스트 ── */}
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

// ── 페이지 헤더 ──────────────────────────────────────────────────────────
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI 카드 그리드 ─────────────────────────────────────────────────────
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
              <span
                className="ad-kpi__delta"
                data-dir={k.delta >= 0 ? "up" : "down"}
              >
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

// ── 테이블 (그리드 기반) ────────────────────────────────────────────────
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
