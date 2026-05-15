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
import { AdminPageHeader } from "@/components/admin/admin-page-header";

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

// 시안 v2.14 — admin-stat-pill[data-tone] 매핑
// (pending=warn / approved=ok / rejected=err / suspended=mute)
const STATUS_TONE: Record<string, "ok" | "warn" | "err" | "info" | "mute"> = {
  pending: "warn",
  approved: "ok",
  rejected: "err",
  suspended: "mute",
};

// 상태별 라벨 매핑 (운영 4개 상태 보존)
const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
  suspended: "정지",
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

  return (
    <div>
      {/* 시안 v2.14 — eyebrow + breadcrumbs + actions (파트너 등록 버튼은 actions slot) */}
      <AdminPageHeader
        eyebrow="ADMIN · 비즈니스"
        title="파트너 관리"
        subtitle="광고 파트너사 등록 / 승인 / 관리"
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "비즈니스" },
          { label: "파트너 관리" },
        ]}
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn--primary"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            파트너 등록
          </button>
        }
      />

      {/* 상태 필터 탭 — (web) .btn 패턴 (Organizations 박제와 일관) */}
      <div className="mb-4 flex gap-2">
        {[
          { value: "", label: "전체" },
          { value: "pending", label: "대기" },
          { value: "approved", label: "승인" },
          { value: "rejected", label: "반려" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`btn btn--sm ${filter === tab.value ? "btn--primary" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
        <div className="rounded-md border overflow-hidden admin-table-wrap"
          style={{ borderColor: "var(--color-border)" }}>
          {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
          <table className="admin-table w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>파트너사</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>소유자</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>캠페인</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>상태</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--color-text-secondary)" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                return (
                  <tr key={p.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    <td data-primary="true" className="px-4 py-3">
                      <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{p.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.contact_email || "-"}</p>
                    </td>
                    <td data-label="소유자" className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {p.owner.nickname || p.owner.email}
                    </td>
                    <td data-label="캠페인" className="px-4 py-3 text-center" style={{ color: "var(--color-text-secondary)" }}>
                      {p.campaigns_count}개
                    </td>
                    <td data-label="상태" className="px-4 py-3 text-center">
                      {/* 시안 v2.14 — admin-stat-pill data-tone (미매치 시 mute 폴백) */}
                      <span className="admin-stat-pill" data-tone={STATUS_TONE[p.status] ?? "mute"}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td data-actions="true" className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* 승인 대기 상태일 때 승인/반려 버튼 */}
                        {p.status === "pending" && (
                          <>
                            <button onClick={() => handleStatusChange(p.id, "approved")}
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: "var(--color-success)" }}>
                              승인
                            </button>
                            <button onClick={() => handleStatusChange(p.id, "rejected")}
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: "var(--color-error)" }}>
                              반려
                            </button>
                          </>
                        )}
                        {/* 승인 상태일 때 정지 버튼 */}
                        {p.status === "approved" && (
                          <button onClick={() => handleStatusChange(p.id, "suspended")}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ color: "var(--color-error)" }}>
                            정지
                          </button>
                        )}
                        {/* 정지 상태일 때 재승인 버튼 */}
                        {p.status === "suspended" && (
                          <button onClick={() => handleStatusChange(p.id, "approved")}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ color: "var(--color-success)" }}>
                            재승인
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
