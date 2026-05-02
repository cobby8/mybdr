"use client";

/**
 * Admin 단체 승인 관리 페이지
 * pending 단체를 승인/거절하고, 전체 단체 목록을 관리한다.
 */

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// 단체 타입 정의
interface Organization {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  status: string;
  apply_note: string | null;
  contact_email: string | null;
  owner: { id: string; nickname: string; email: string };
  series_count: number;
  members_count: number;
  created_at: string;
  approved_at: string | null;
}

// 상태별 뱃지 색상
function statusBadge(status: string) {
  const map: Record<string, { bg: string; label: string }> = {
    pending:  { bg: "var(--color-warning)", label: "대기" },
    approved: { bg: "var(--color-success)", label: "승인" },
    rejected: { bg: "var(--color-error)",   label: "거절" },
  };
  return map[status] || map.pending;
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending"); // 기본: 대기 목록
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 처리 중인 ID
  const [rejectId, setRejectId] = useState<string | null>(null); // 거절 사유 입력 중인 ID
  const [rejectReason, setRejectReason] = useState("");

  // 단체 목록 조회
  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/web/admin/organizations${qs}`);
    if (res.ok) {
      const data = await res.json();
      setOrgs(data.data?.organizations || []);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  // 승인 처리
  async function handleApprove(id: string) {
    setActionLoading(id);
    const res = await fetch(`/api/web/admin/organizations/${id}/approve`, {
      method: "POST",
    });
    if (res.ok) {
      await fetchOrgs(); // 목록 새로고침
    }
    setActionLoading(null);
  }

  // 거절 처리
  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    const res = await fetch(`/api/web/admin/organizations/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason.trim() }),
    });
    if (res.ok) {
      setRejectId(null);
      setRejectReason("");
      await fetchOrgs();
    }
    setActionLoading(null);
  }

  return (
    <div>
      <AdminPageHeader
        title="단체 관리"
        subtitle="단체 신청 승인/거절 및 전체 단체 목록을 관리합니다."
      />

      {/* 상태 필터 탭 */}
      <div className="mb-4 flex gap-2">
        {[
          { value: "pending", label: "대기" },
          { value: "approved", label: "승인" },
          { value: "rejected", label: "거절" },
          { value: "", label: "전체" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded px-4 py-2 text-sm font-medium transition ${
              filter === tab.value
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-bright)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 테이블 */}
      {loading ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">
          불러오는 중...
        </p>
      ) : orgs.length === 0 ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">
          {filter === "pending" ? "대기 중인 신청이 없습니다." : "해당 단체가 없습니다."}
        </p>
      ) : (
        <div className="overflow-x-auto admin-table-wrap rounded border border-[var(--color-border)]">
          {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
          <table className="admin-table w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-bright)]">
              <tr>
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">단체명</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">지역</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">신청자</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">상태</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">신청일</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">액션</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const badge = statusBadge(org.status);
                return (
                  <tr key={org.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td data-primary="true" className="px-4 py-3">
                      <div className="font-medium text-[var(--color-text-primary)]">{org.name}</div>
                      {org.apply_note && (
                        <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          메모: {org.apply_note}
                        </div>
                      )}
                    </td>
                    <td data-label="지역" className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {org.region || "-"}
                    </td>
                    <td data-label="신청자" className="px-4 py-3">
                      <div className="text-[var(--color-text-primary)]">{org.owner.nickname}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{org.owner.email}</div>
                    </td>
                    <td data-label="상태" className="px-4 py-3">
                      <span
                        className="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: badge.bg }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td data-label="신청일" className="px-4 py-3 text-[var(--color-text-muted)]">
                      {new Date(org.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td data-actions="true" className="px-4 py-3">
                      {/* pending일 때만 승인/거절 버튼 표시 */}
                      {org.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(org.id)}
                            disabled={actionLoading === org.id}
                            className="rounded bg-[var(--color-success)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => setRejectId(org.id)}
                            disabled={actionLoading === org.id}
                            className="rounded bg-[var(--color-error)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            거절
                          </button>
                        </div>
                      )}
                      {/* 거절 사유 입력 폼 */}
                      {rejectId === org.id && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="거절 사유"
                            className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
                          />
                          <button
                            onClick={() => handleReject(org.id)}
                            disabled={!rejectReason.trim() || actionLoading === org.id}
                            className="rounded bg-[var(--color-error)] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            확인
                          </button>
                          <button
                            onClick={() => { setRejectId(null); setRejectReason(""); }}
                            className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)]"
                          >
                            취소
                          </button>
                        </div>
                      )}
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
