"use client";

// =====================================================================
// _console.tsx — 협력업체(파트너사) 관리 콘솔 (클라). 레거시 admin/partners/page.tsx 1:1 동작.
//   super_admin 이 파트너사 목록을 보고 상태(승인/반려/정지/재승인)를 바꾸거나 신규 등록한다.
//   구성: KpiGrid(현재목록/대기/캠페인/멤버) + 상태탭(클라 필터) + DataTable +
//         행클릭 상세 Modal(상태변경) + "파트너 등록" 폼 Modal.
//
//   ⚠ 백엔드 0변경 — 목록은 서버 props 주입(추가 fetch 0). mutation 만 기존 REST 를 adminFetch 로 호출:
//     · 등록   = POST  /api/admin/partners        (name, ownerId, contactEmail?, websiteUrl?, description?)
//     · 상태변경 = PATCH /api/admin/partners/[id]    ({ status })
//   ⚠ adminFetch = snake↔camel 단일 변환점 — 요청 body camel→snake(ownerId→owner_id 등), 응답 snake→camel.
//     변경 후에는 router.refresh() 로 서버 컴포넌트(page.tsx)가 Prisma 재조회 → 목록 갱신.
//   ⚠ 디자인 — admin-v2 키트(PageHead/KpiGrid/DataTable/Modal/Badge/Btn/Icon) + .ts-* 클래스 + var(--*) 토큰만.
//     하드코딩 색상(#fff/hex/rgba) 0. pill 9999px 0.
// =====================================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  PageHead,
  KpiGrid,
  DataTable,
  Modal,
  Badge,
  Btn,
  Icon,
  useAdminShell,
  type DataCol,
  type DataRow,
  type BadgeTone,
} from "@/components/admin-v2";
import { adminFetch } from "@/lib/admin-v2/data";

// ── 직렬화 타입(page.tsx 서버 매핑과 1:1·camel) ──
export interface PartnerItem {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  status: string; // pending | approved | rejected | suspended
  description: string | null;
  owner: { id: string; nickname: string | null; email: string };
  campaignsCount: number;
  membersCount: number;
  createdAt: string;
}

const API = "/api/admin/partners";

// ── 상태 라벨/톤(레거시 STATUS_META 동일) ──
const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
  suspended: "정지",
};
const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warn",
  approved: "ok",
  rejected: "danger",
  suspended: "grey",
};

// 상태 전이(레거시 핸들러 동일): pending→{승인,반려} / approved→{정지} / suspended→{재승인}.
// rejected 는 레거시에 액션이 없었으므로 동일하게 비워 둔다(1:1).
type Transition = { to: string; label: string; variant: "primary" | "danger" | "secondary" };
const TRANSITIONS: Record<string, Transition[]> = {
  pending: [
    { to: "approved", label: "승인", variant: "primary" },
    { to: "rejected", label: "반려", variant: "danger" },
  ],
  approved: [{ to: "suspended", label: "정지", variant: "danger" }],
  suspended: [{ to: "approved", label: "재승인", variant: "primary" }],
  rejected: [],
};

// 상태 탭 — 레거시(전체/대기/승인/반려) + 정지(suspended 도 실존 상태라 필터 추가).
const TABS: { id: string; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "pending", label: "대기" },
  { id: "approved", label: "승인" },
  { id: "rejected", label: "반려" },
  { id: "suspended", label: "정지" },
];

// ── 표 컬럼(admin-v2 DataTable) ──
const COLS: DataCol[] = [
  { key: "name", label: "파트너사", w: "minmax(0,1.6fr)" },
  { key: "owner", label: "소유자", w: "minmax(0,1fr)" },
  { key: "campaigns", label: "캠페인", w: "92px", align: "center" },
  { key: "status", label: "상태", w: "96px", align: "center" },
];

// 날짜 포맷(클라) — 레거시 동일 ko-KR
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";

export function PartnerConsole({ partners }: { partners: PartnerItem[] }) {
  const router = useRouter();
  const { toast } = useAdminShell();

  // 상태 탭(클라 필터) / 행클릭 상세 Modal / 등록 폼 Modal / 진행중 플래그
  const [tab, setTab] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<PartnerItem | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // 현재 탭 필터 적용
  const filtered = tab === "all" ? partners : partners.filter((p) => p.status === tab);

  // KPI 띠 — 레거시 StatRow 1:1 (현재 목록/대기/캠페인/멤버).
  const kpis = [
    { label: "현재 목록", value: partners.length.toLocaleString(), icon: "handshake", tone: "primary" },
    {
      label: "대기",
      value: partners.filter((p) => p.status === "pending").length.toLocaleString(),
      icon: "clock",
      tone: "warn",
    },
    {
      label: "캠페인",
      value: partners.reduce((s, p) => s + p.campaignsCount, 0).toLocaleString(),
      icon: "megaphone",
      tone: "violet",
    },
    {
      label: "멤버",
      value: partners.reduce((s, p) => s + p.membersCount, 0).toLocaleString(),
      icon: "users",
      tone: "ok",
    },
  ];

  // 상태 변경 — 기존 PATCH /api/admin/partners/[id] 호출(백엔드 0변경). 성공 시 refresh.
  const changeStatus = async (id: string, to: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await adminFetch(`${API}/${id}`, { method: "PATCH", body: { status: to } });
      toast(`상태를 '${STATUS_LABEL[to] ?? to}'(으)로 변경했습니다`);
      setSelected(null);
      router.refresh(); // page.tsx 서버 컴포넌트 재조회 → 목록 갱신
    } catch (e) {
      toast(e instanceof Error ? e.message : "상태 변경에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  // 신규 등록 — 기존 POST /api/admin/partners 호출(자동 승인). 성공 시 폼 닫고 refresh.
  const createPartner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string)?.trim();
    const ownerId = (form.get("ownerId") as string)?.trim();
    // 클라 선검증(서버 Zod 와 동일 필수항목) — name·ownerId 필수.
    if (!name || !ownerId) {
      toast("파트너사명과 소유자 User ID는 필수입니다");
      return;
    }
    setBusy(true);
    try {
      // body 는 camel — adminFetch 가 owner_id/contact_email/website_url 로 변환해 전송.
      await adminFetch(API, {
        method: "POST",
        body: {
          name,
          ownerId,
          contactEmail: (form.get("contactEmail") as string)?.trim() || undefined,
          websiteUrl: (form.get("websiteUrl") as string)?.trim() || undefined,
          description: (form.get("description") as string)?.trim() || undefined,
        },
      });
      toast("파트너를 등록했습니다");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "등록에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  // 표 셀 렌더 — DataRow 를 PartnerItem 으로 복원해 표시
  const renderCell = (row: DataRow, key: string) => {
    const p = row as unknown as PartnerItem;
    switch (key) {
      case "name":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {/* 아바타 — 이니셜(정사각 원형 50%·하드코딩색 0·primary 소프트틴트) */}
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
                fontWeight: 800,
                color: "var(--primary)",
                background: "var(--primary-weak)",
              }}
            >
              {p.name.slice(0, 1)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{p.contactEmail || "-"}</div>
            </div>
          </div>
        );
      case "owner":
        return (
          <span style={{ color: "var(--ink-soft)" }}>{p.owner.nickname || p.owner.email}</span>
        );
      case "campaigns":
        return <span style={{ color: "var(--ink-soft)" }}>{p.campaignsCount}개</span>;
      case "status":
        return <Badge tone={STATUS_TONE[p.status] ?? "grey"}>{STATUS_LABEL[p.status] ?? p.status}</Badge>;
      default:
        return null;
    }
  };

  // 선택된 파트너의 허용 전이
  const allowed = selected ? TRANSITIONS[selected.status] ?? [] : [];

  return (
    <div>
      <PageHead
        eyebrow="백오피스 · 비즈니스"
        title="협력업체 관리"
        sub="광고 파트너사 등록 · 승인 · 관리"
        actions={
          <Btn icon="plus" onClick={() => setShowForm(true)}>
            파트너 등록
          </Btn>
        }
      />

      {/* KPI 띠 */}
      <KpiGrid items={kpis} />

      {/* 상태 탭(클라 필터) */}
      <div className="bo-constabs" style={{ marginTop: 16 }}>
        {TABS.map((t) => {
          const n =
            t.id === "all" ? partners.length : partners.filter((p) => p.status === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              className="bo-constab"
              data-on={tab === t.id ? "true" : "false"}
              onClick={() => setTab(t.id)}
            >
              {t.label} {n}
            </button>
          );
        })}
      </div>

      {/* 목록 표 — 행 클릭 시 상세/상태변경 Modal */}
      <div style={{ marginTop: 12 }}>
        <DataTable
          cols={COLS}
          rows={filtered as unknown as DataRow[]}
          render={renderCell}
          onRow={(row) => setSelected(partners.find((x) => x.id === row.id) ?? null)}
          empty="등록된 파트너가 없습니다."
        />
      </div>

      {/* 행 상세 Modal — 파트너 정보 + 상태변경 버튼(전이규칙대로만 노출) */}
      <Modal
        open={!!selected}
        onClose={() => !busy && setSelected(null)}
        title={selected?.name}
        sub={selected ? STATUS_LABEL[selected.status] ?? selected.status : ""}
        maxWidth={520}
        foot={
          selected ? (
            <div style={{ display: "flex", gap: 8, width: "100%", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {allowed.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>변경 가능한 상태가 없습니다</span>
              ) : (
                allowed.map((tr) => (
                  <Btn
                    key={tr.to}
                    variant={tr.variant}
                    size="sm"
                    disabled={busy}
                    onClick={() => changeStatus(selected.id, tr.to)}
                  >
                    {busy ? "처리 중…" : tr.label}
                  </Btn>
                ))
              )}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Badge tone={STATUS_TONE[selected.status] ?? "grey"}>
                {STATUS_LABEL[selected.status] ?? selected.status}
              </Badge>
            </div>

            <div className="bo-field"><span className="bo-field__k">소유자</span><span className="bo-field__v">{selected.owner.nickname || selected.owner.email}</span></div>
            <div className="bo-field"><span className="bo-field__k">이메일</span><span className="bo-field__v">{selected.contactEmail || "-"}</span></div>
            <div className="bo-field">
              <span className="bo-field__k">웹사이트</span>
              <span className="bo-field__v">
                {selected.websiteUrl ? (
                  <a href={selected.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>
                    {selected.websiteUrl}
                  </a>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <div className="bo-field"><span className="bo-field__k">캠페인</span><span className="bo-field__v">{selected.campaignsCount}개</span></div>
            <div className="bo-field"><span className="bo-field__k">멤버</span><span className="bo-field__v">{selected.membersCount}명</span></div>
            <div className="bo-field"><span className="bo-field__k">등록일</span><span className="bo-field__v" style={{ fontFamily: "var(--ff-mono)" }}>{fmtDate(selected.createdAt)}</span></div>
            {selected.description && (
              <div className="bo-field"><span className="bo-field__k">소개</span><span className="bo-field__v">{selected.description}</span></div>
            )}
          </>
        )}
      </Modal>

      {/* 신규 등록 Modal — 레거시 등록 폼 1:1(name*·ownerId*·이메일·웹사이트·소개) */}
      <Modal
        open={showForm}
        onClose={() => !busy && setShowForm(false)}
        title="신규 파트너 등록"
        sub="관리자가 직접 등록하면 바로 승인 상태가 됩니다"
        maxWidth={520}
      >
        <form id="partner-create-form" onSubmit={createPartner}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>파트너사명 *</span>
              <input name="name" className="ts-input" required placeholder="예: 나이키 코리아" />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>소유자 User ID *</span>
              <input name="ownerId" className="ts-input" required type="number" placeholder="예: 1024" />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>담당자 이메일</span>
              <input name="contactEmail" className="ts-input" type="email" placeholder="예: ad@brand.com" />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>웹사이트 URL</span>
              <input name="websiteUrl" className="ts-input" type="url" placeholder="예: https://brand.com" />
            </label>
          </div>
          <label style={{ display: "block", marginTop: 12 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>파트너 소개</span>
            <textarea name="description" className="ts-input" rows={3} placeholder="파트너 소개" style={{ resize: "vertical" }} />
          </label>
          {/* foot 대신 폼 내부 버튼 — submit 으로 createPartner 트리거 */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
            <Btn type="button" variant="ghost" disabled={busy} onClick={() => setShowForm(false)}>
              취소
            </Btn>
            <Btn type="submit" icon="check" disabled={busy}>
              {busy ? "등록 중…" : "등록"}
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
