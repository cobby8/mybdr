"use client";

/**
 * Admin 단체 승인 관리 페이지
 * pending 단체를 승인/거절하고, 전체 단체 목록을 관리한다.
 *
 * 2026-05-15: Admin-5-C 박제 (BDR v2.14)
 * - AdminPageHeader eyebrow + breadcrumbs (시안 v2.14)
 * - statusBadge(inline bg) → STATUS_TONE + admin-stat-pill[data-tone]
 *   (pending=warn / approved=ok / rejected=err)
 * - 비즈 로직 (fetch/handleApprove/handleReject/state) 100% 보존
 *
 * 2026-05-29: OA1 박제 (BDR v2.22 · PR-4C-5)
 * - Hero 4상태 분포 stat (대기/승인/보관/거절) — 전체 목록 실측 count
 * - archived(보관) 필터 탭 추가 (시안 4분면)
 * - 행 클릭 → 상세 모달(BO1): AdminDetailModal/ModalInfoSection 재사용
 *   · 신청 정보 = OU3 신청 form 동일 organizations 컬럼
 *     (name·description·region·contact_email·website_url·apply_note)
 *   · approved → 운영 활동 통계(series_count·members_count 실측)
 * - BO5 status 전환:
 *   · 승인/거절 = 기존 워크플로우(approve/reject route) 활용
 *   · 해산(archived)/복구 = owner 전용 archive route(Phase E 정책) → admin은 disabled 안내
 *   · 정지(suspend) = 운영 status/route 없음 → hide
 * - 비즈 로직(fetch/handleApprove/handleReject/state) 100% 보존
 */

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 단체 타입 정의
interface Organization {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  status: string;
  apply_note: string | null;
  contact_email: string | null;
  // OA1(BO1) — 모달 신청 정보 표시용 추가 컬럼 (route.ts 조회 전용 노출)
  description: string | null;
  website_url: string | null;
  rejection_reason: string | null;
  owner: { id: string; nickname: string; email: string };
  series_count: number;
  members_count: number;
  created_at: string;
  approved_at: string | null;
}

// 시안 v2.14 — admin-stat-pill[data-tone] 매핑
// (pending=warn / approved=ok / rejected=err / archived=mute)
const STATUS_TONE: Record<string, "ok" | "warn" | "err" | "info" | "mute"> = {
  pending: "warn",
  approved: "ok",
  rejected: "err",
  archived: "mute",
};

// 상태별 라벨 매핑 (OA1 — archived=보관 추가)
const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "거절",
  archived: "보관",
};

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending"); // 기본: 대기 목록
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 처리 중인 ID
  const [rejectId, setRejectId] = useState<string | null>(null); // 거절 사유 입력 중인 ID
  const [rejectReason, setRejectReason] = useState("");
  // OA1 — Hero 4상태 분포 stat용 전체 목록 (필터 무관 status 집계)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  // OA1 — 행 클릭 시 표시할 상세 모달 대상 (BO1)
  const [selected, setSelected] = useState<Organization | null>(null);

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

  // OA1 — Hero stat용 전체 분포 조회 (필터와 독립, status별 count 집계)
  const fetchStatusCounts = useCallback(async () => {
    const res = await fetch(`/api/web/admin/organizations`); // status 미지정 = 전체
    if (res.ok) {
      const data = await res.json();
      const all: Organization[] = data.data?.organizations || [];
      const counts: Record<string, number> = {};
      for (const o of all) counts[o.status] = (counts[o.status] || 0) + 1;
      counts.all = all.length; // 전체 합계
      setStatusCounts(counts);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  // OA1 — 마운트 시 1회 + 액션 후 분포 갱신 (handleApprove/Reject에서 재호출)
  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  // 승인 처리
  async function handleApprove(id: string) {
    setActionLoading(id);
    const res = await fetch(`/api/web/admin/organizations/${id}/approve`, {
      method: "POST",
    });
    if (res.ok) {
      await fetchOrgs(); // 목록 새로고침
      await fetchStatusCounts(); // OA1 — Hero 분포 갱신
      setSelected(null); // OA1 — 모달 닫기
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
      await fetchStatusCounts(); // OA1 — Hero 분포 갱신
      setSelected(null); // OA1 — 모달 닫기
    }
    setActionLoading(null);
  }

  return (
    <div>
      {/* 시안 v2.14 — eyebrow + breadcrumbs (Admin-5-C 박제) */}
      <AdminPageHeader
        eyebrow="ADMIN · 외부 관리"
        title="단체 관리"
        subtitle="단체 신청 승인 / 거절 및 전체 단체 목록을 관리합니다."
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "외부 관리" },
          { label: "단체 관리" },
        ]}
      />

      {/* OA1 — Hero 4상태 분포 stat (실측 count, 시안 4분면) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { key: "pending", label: "대기", tone: "warn" as const },
          { key: "approved", label: "승인", tone: "ok" as const },
          { key: "archived", label: "보관", tone: "mute" as const },
          { key: "rejected", label: "거절", tone: "err" as const },
        ].map((s) => (
          <div
            key={s.key}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3"
          >
            {/* 숫자: 상태별 토큰 색 (data-tone과 동일 의미 톤) */}
            <div
              className="text-2xl font-black tabular-nums"
              style={{
                color:
                  s.tone === "ok"
                    ? "var(--color-success)"
                    : s.tone === "warn"
                      ? "var(--color-warning)"
                      : s.tone === "err"
                        ? "var(--color-error)"
                        : "var(--color-text-muted)",
              }}
            >
              {statusCounts[s.key] ?? 0}
            </div>
            <div className="mt-0.5 text-xs font-medium text-[var(--color-text-muted)]">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* 상태 필터 탭 — (web) .btn 패턴 (OA1 — archived 추가) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: "pending", label: "대기" },
          { value: "approved", label: "승인" },
          { value: "archived", label: "보관" },
          { value: "rejected", label: "거절" },
          { value: "", label: "전체" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`btn btn--sm ${filter === tab.value ? "btn--primary" : ""}`}
          >
            {tab.label}
            {/* OA1 — 탭별 실측 건수 (전체는 all 키) */}
            <span className="ml-1.5 opacity-60 tabular-nums">
              {tab.value === "" ? statusCounts.all ?? 0 : statusCounts[tab.value] ?? 0}
            </span>
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
          {filter === "pending"
            ? "대기 중인 신청이 없습니다."
            : filter === "archived"
              ? "보관된 단체가 없습니다."
              : "해당 단체가 없습니다."}
        </p>
      ) : (
        <div className="overflow-x-auto admin-table-wrap">
          {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
          <table className="admin-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium">단체명</th>
                <th className="px-4 py-3 font-medium">지역</th>
                <th className="px-4 py-3 font-medium">신청자</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">신청일</th>
                <th className="px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                return (
                  // OA1 — 행 클릭 시 상세 모달 열기 (BO1). 액션 버튼 클릭은 stopPropagation으로 분리
                  <tr
                    key={org.id}
                    onClick={() => setSelected(org)}
                    className="cursor-pointer"
                  >
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
                      {/* 시안 v2.14 — admin-stat-pill data-tone (미매치 시 mute 폴백) */}
                      <span className="admin-stat-pill" data-tone={STATUS_TONE[org.status] ?? "mute"}>
                        {STATUS_LABEL[org.status] ?? org.status}
                      </span>
                    </td>
                    <td data-label="신청일" className="px-4 py-3 text-[var(--color-text-muted)]">
                      {new Date(org.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    {/* OA1 — 액션 셀 클릭은 모달 열기와 분리 (stopPropagation) */}
                    <td
                      data-actions="true"
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* pending일 때만 승인/거절 버튼 표시 — (web) .btn 패턴 (success/error 톤 inline) */}
                      {org.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(org.id)}
                            disabled={actionLoading === org.id}
                            className="btn btn--sm disabled:opacity-50"
                            style={{ background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => setRejectId(org.id)}
                            disabled={actionLoading === org.id}
                            className="btn btn--sm disabled:opacity-50"
                            style={{ background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }}
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
                            className="flex-1 rounded border px-2 py-1 text-xs"
                            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                          />
                          <button
                            onClick={() => handleReject(org.id)}
                            disabled={!rejectReason.trim() || actionLoading === org.id}
                            className="btn btn--sm disabled:opacity-50"
                            style={{ background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }}
                          >
                            확인
                          </button>
                          <button
                            onClick={() => { setRejectId(null); setRejectReason(""); }}
                            className="btn btn--sm"
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

      {/* OA1 — 상세 모달 (BO1): 행 클릭 시 신청 정보 + 운영 활동 + status 액션 */}
      <AdminDetailModal
        isOpen={selected !== null}
        onClose={() => {
          setSelected(null);
          // 모달 닫을 때 거절 입력 상태도 초기화 (모달 내 거절 폼 사용 시)
          setRejectId(null);
          setRejectReason("");
        }}
        title={selected ? selected.name : ""}
        actions={
          selected ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {/* pending — 승인/거절 (기존 워크플로우 활용) */}
              {selected.status === "pending" && rejectId !== selected.id && (
                <>
                  <button
                    onClick={() => setRejectId(selected.id)}
                    disabled={actionLoading === selected.id}
                    className="btn btn--sm disabled:opacity-50"
                    style={{ background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }}
                  >
                    <span className="material-symbols-outlined text-base align-middle">close</span>
                    거절
                  </button>
                  <button
                    onClick={() => handleApprove(selected.id)}
                    disabled={actionLoading === selected.id}
                    className="btn btn--sm disabled:opacity-50"
                    style={{ background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }}
                  >
                    <span className="material-symbols-outlined text-base align-middle">check</span>
                    승인
                  </button>
                </>
              )}
              {/* pending — 거절 사유 입력 모드 */}
              {selected.status === "pending" && rejectId === selected.id && (
                <>
                  <button
                    onClick={() => { setRejectId(null); setRejectReason(""); }}
                    className="btn btn--sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleReject(selected.id)}
                    disabled={!rejectReason.trim() || actionLoading === selected.id}
                    className="btn btn--sm disabled:opacity-50"
                    style={{ background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }}
                  >
                    <span className="material-symbols-outlined text-base align-middle">block</span>
                    거절 확정
                  </button>
                </>
              )}
              {/* approved — BO5 해산(archived). owner 전용 archive route(Phase E) → admin disabled 안내 */}
              {selected.status === "approved" && (
                <button
                  disabled
                  title="단체 해산은 단체 소유자(owner)만 단체 설정에서 처리할 수 있습니다."
                  className="btn btn--sm opacity-50 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base align-middle">archive</span>
                  해산 (소유자 전용)
                </button>
              )}
              {/* archived/rejected — 복구. owner 전용 archive route → admin disabled 안내 */}
              {(selected.status === "archived" || selected.status === "rejected") && (
                <button
                  disabled
                  title="복구는 단체 소유자(owner)만 처리할 수 있습니다."
                  className="btn btn--sm opacity-50 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base align-middle">restart_alt</span>
                  복구 (소유자 전용)
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* 상태 뱃지 + slug (헤더 보조 정보) */}
            <div className="flex items-center gap-2">
              <span className="admin-stat-pill" data-tone={STATUS_TONE[selected.status] ?? "mute"}>
                {STATUS_LABEL[selected.status] ?? selected.status}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                /{selected.slug}
                {selected.region ? ` · ${selected.region}` : ""}
              </span>
            </div>

            {/* BO1 — 신청 정보 (OU3 신청 form 동일 organizations 컬럼) */}
            <ModalInfoSection
              title="신청 정보"
              rows={[
                [
                  "신청자",
                  `${selected.owner.nickname} · ${selected.owner.email}`,
                ],
                ["소개", selected.description],
                ["활동 지역", selected.region],
                ["연락 이메일", selected.contact_email],
                ["웹사이트", selected.website_url],
                ["신청 메모", selected.apply_note],
                [
                  "신청일",
                  new Date(selected.created_at).toLocaleDateString("ko-KR"),
                ],
                [
                  "승인일",
                  selected.approved_at
                    ? new Date(selected.approved_at).toLocaleDateString("ko-KR")
                    : null,
                ],
                // 거절 상태일 때만 사유 표시
                ...(selected.status === "rejected"
                  ? ([["거절 사유", selected.rejection_reason]] as [
                      string,
                      string | null,
                    ][])
                  : []),
              ]}
            />

            {/* approved — BO5 운영 활동 통계 (실측: series_count / members_count) */}
            {selected.status === "approved" && (
              <div>
                <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                  운영 활동
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 text-center">
                    <div className="text-xl font-black tabular-nums text-[var(--color-success)]">
                      {selected.series_count}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      시리즈
                    </div>
                  </div>
                  <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 text-center">
                    <div className="text-xl font-black tabular-nums text-[var(--color-text-primary)]">
                      {selected.members_count}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      멤버
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* pending — 거절 사유 입력 (모달 내 거절 모드일 때만) */}
            {selected.status === "pending" && rejectId === selected.id && (
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-[var(--color-error)]">
                  거절 사유 (필수)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="단체 등록 요건 미충족"
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--color-error)",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </AdminDetailModal>
    </div>
  );
}
