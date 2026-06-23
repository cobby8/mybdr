"use client";

/* ============================================================
 * Admin 파트너 관리 페이지
 * 파트너사 목록 / 상태 변경(승인/반려) / 신규 등록
 *
 * 2026-05-15: Admin-5-C 박제 (BDR v2.14)
 * - AdminPageHeader eyebrow + breadcrumbs (시안 v2.14)
 * - statusBadge(inline bg) → STATUS_TONE + admin-stat-pill[data-tone]
 *   (pending=warn / approved=ok / rejected=err / suspended=mute)
 * - 비즈 로직 (fetch/handleStatusChange/handleCreate/state) 100% 보존
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
// Toss Phase 2 2B — lucide 키트 Icon (Material Symbols 교체)
import { Icon } from "@/components/admin-toss";
// 8C-6 박제 — VA1 Site Operator 뱃지 (dark+gold, /admin/courts 와 공용)
import { SiteOperatorBadge } from "@/components/admin/site-operator-badge";
import {
  DataTable,
  PageHead,
  PrimaryCell,
  StatRow,
  StatusBadge,
  Toolbar,
  type Column,
} from "@/components/admin/console-kit";

// 파트너 타입 정의
interface Partner {
  id: string;
  uuid: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  status: string;
  description: string | null;
  owner: { id: string; nickname: string; email: string };
  campaigns_count: number;
  members_count: number;
  created_at: string;
}

const STATUS_META = {
  pending: { tone: "warn" as const, label: "대기" },
  approved: { tone: "ok" as const, label: "승인" },
  rejected: { tone: "danger" as const, label: "반려" },
  suspended: { tone: "grey" as const, label: "정지" },
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(""); // 상태 필터
  const [showForm, setShowForm] = useState(false);

  // 파트너 목록 조회
  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/partners${qs}`);
    if (res.ok) {
      const data = await res.json();
      setPartners(data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // 상태 변경 핸들러 (승인/반려/정지)
  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchPartners(); // 목록 새로고침
  };

  // 신규 파트너 등록 핸들러
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      contact_email: form.get("contact_email"),
      website_url: form.get("website_url"),
      description: form.get("description"),
      owner_id: form.get("owner_id"),
    };
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      fetchPartners();
    }
  };

  const tabs = [
    { id: "", label: "전체" },
    { id: "pending", label: "대기" },
    { id: "approved", label: "승인" },
    { id: "rejected", label: "반려" },
  ];

  const columns: Column<Partner>[] = [
    {
      key: "name",
      label: "파트너사",
      width: "minmax(220px,1.5fr)",
      render: (p) => (
        <PrimaryCell
          initials={p.name.slice(0, 1)}
          title={p.name}
          meta={p.contact_email || "-"}
          accent
        />
      ),
    },
    {
      key: "owner",
      label: "소유자",
      width: "minmax(150px,1fr)",
      render: (p) => p.owner.nickname || p.owner.email,
    },
    {
      key: "campaigns_count",
      label: "캠페인",
      width: "100px",
      align: "center",
      render: (p) => `${p.campaigns_count}개`,
    },
    {
      key: "status",
      label: "상태",
      width: "100px",
      align: "center",
      render: (p) => <StatusBadge map={STATUS_META} value={p.status} />,
    },
    {
      key: "id",
      label: "관리",
      width: "160px",
      align: "right",
      render: (p) => (
        <span className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {p.status === "pending" && (
            <>
              <button onClick={() => handleStatusChange(p.id, "approved")} className="btn btn--sm">
                승인
              </button>
              <button
                onClick={() => handleStatusChange(p.id, "rejected")}
                className="btn btn--sm"
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
              >
                반려
              </button>
            </>
          )}
          {p.status === "approved" && (
            <button
              onClick={() => handleStatusChange(p.id, "suspended")}
              className="btn btn--sm"
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
            >
              정지
            </button>
          )}
          {p.status === "suspended" && (
            <button onClick={() => handleStatusChange(p.id, "approved")} className="btn btn--sm">
              재승인
            </button>
          )}
        </span>
      ),
    },
  ];

  return (
    <div data-skin="toss">
      {/* 시안 v2.14 — eyebrow + breadcrumbs + actions (파트너 등록 버튼은 actions slot) */}
      <PageHead
        icon="handshake"
        eyebrow="ADMIN / 비즈니스"
        title="파트너 관리"
        sub="광고 파트너사 등록 / 승인 / 관리"
        actions={
          // 8C-6 박제 — VA1: Site Operator 뱃지(dark+gold) + 기존 등록 버튼
          <div className="flex items-center gap-2">
            <SiteOperatorBadge />
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn--primary"
            >
              <Icon name="plus" size={16} />
              파트너 등록
            </button>
          </div>
        }
      />

      <StatRow
        items={[
          { icon: "handshake", label: "현재 목록", value: partners.length.toLocaleString() },
          { icon: "clock", label: "대기", value: partners.filter((p) => p.status === "pending").length.toLocaleString() },
          { icon: "megaphone", label: "캠페인", value: partners.reduce((sum, p) => sum + p.campaigns_count, 0).toLocaleString() },
          { icon: "users", label: "멤버", value: partners.reduce((sum, p) => sum + p.members_count, 0).toLocaleString() },
        ]}
      />

      <Toolbar tabs={tabs} active={filter} onTab={setFilter} />

      {/* 신규 등록 폼 (토글) */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-md border p-5 space-y-3"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
            신규 파트너 등록
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="파트너사명 *" required
              className="rounded border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
            <input name="owner_id" placeholder="소유자 User ID *" required type="number"
              className="rounded border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
            <input name="contact_email" placeholder="담당자 이메일"
              className="rounded border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
            <input name="website_url" placeholder="웹사이트 URL"
              className="rounded border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            />
          </div>
          <textarea name="description" placeholder="파트너 소개" rows={2}
            className="w-full rounded border px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded text-sm font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}>
              등록
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded text-sm"
              style={{ color: "var(--color-text-muted)" }}>
              취소
            </button>
          </div>
        </form>
      )}

      {/* 파트너 목록 테이블 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--color-surface)" }} />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "var(--color-text-muted)" }}>
          등록된 파트너가 없습니다
        </div>
      ) : (
        <DataTable columns={columns} rows={partners} keyField="id" emptyTitle="등록된 파트너가 없습니다" />
      )}
    </div>
  );
}
