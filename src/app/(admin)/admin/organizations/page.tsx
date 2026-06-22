"use client";

/**
 * Admin 단체 승인 관리 페이지
 * pending 단체를 승인/거절하고, 전체 단체 목록을 관리한다.
 *
 * 2026-05-15: Admin-5-C 박제 (BDR v2.14)
 * 2026-05-29: OA1 박제 (BDR v2.22 · PR-4C-5)
 *
 * 2026-06-22: v2.40 A3-1b — 통합 콘솔 키트(console-kit) 리스킨.
 * - AdminPageHeader → PageHead / 4-stat grid → StatRow / .btn 탭 → Toolbar+useFilter(클라)
 * - <table> → DataTable(PrimaryCell·StatusBadge·pagination) / AdminDetailModal → Drawer(DL)
 * - 데이터/액션/라우트 0변경 — fetch/handleApprove/handleReject/fetchStatusCounts/state 전부 유지(UI만).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
// v2.40 A3-1b — 통합 콘솔 키트로 교체
import {
  PageHead,
  StatRow,
  Toolbar,
  DataTable,
  Drawer,
  DL,
  PrimaryCell,
  StatusBadge,
  useFilter,
  type Column,
  type StatusMeta,
} from "@/components/admin/console-kit";

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
  // v2.40 A3-1b — useFilter<T extends FilterableRow> 제약(인덱스 시그니처) 충족용
  [key: string]: unknown;
}

// v2.40 A3-1b — StatusBadge 매핑(상태코드 → 톤/라벨).
//   (기존 STATUS_LABEL/STATUS_TONE 를 Badge 매핑으로 통합)
// 기존 admin-stat-pill tone(warn/ok/err/mute) → Badge tone(primary/ok/danger/grey)로 변환.
//   pending=대기(primary) / approved=승인(ok) / rejected=거절(danger) / archived=보관(grey)
const STATUS_BADGE_MAP: Record<string, StatusMeta> = {
  pending: { tone: "primary", label: "대기" },
  approved: { tone: "ok", label: "승인" },
  rejected: { tone: "danger", label: "거절" },
  archived: { tone: "grey", label: "보관" },
};

// useFilter 검색 대상 필드 — 컴포넌트 밖 상수(매 렌더 새 참조 방지)
const FILTER_FIELDS: (keyof Organization)[] = ["name", "region"];

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending"); // 기본: 대기 목록
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 처리 중인 ID
  const [rejectId, setRejectId] = useState<string | null>(null); // 거절 사유 입력 중인 ID
  const [rejectReason, setRejectReason] = useState("");
  // OA1 — Hero 4상태 분포 stat용 전체 목록 (필터 무관 status 집계)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  // OA1 — 행 클릭 시 표시할 상세 모달(→ Drawer) 대상 (BO1)
  const [selected, setSelected] = useState<Organization | null>(null);
  // v2.40 A3-1b — DataTable 페이지네이션 현재 페이지(클라)
  const [page, setPage] = useState(1);
  const perPage = 20;

  // 단체 목록 조회 — 기존 fetch 로직 100% 유지(서버 status 필터)
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

  // OA1 — Hero stat용 전체 분포 조회 (필터와 독립, status별 count 집계) — 신규 쿼리 0(기존 그대로)
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

  // OA1 — 마운트 시 1회 + 액션 후 분포 갱신
  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  // 승인 처리 — 기존 로직 100% 유지
  async function handleApprove(id: string) {
    setActionLoading(id);
    const res = await fetch(`/api/web/admin/organizations/${id}/approve`, {
      method: "POST",
    });
    if (res.ok) {
      await fetchOrgs();
      await fetchStatusCounts();
      setSelected(null);
    }
    setActionLoading(null);
  }

  // 거절 처리 — 기존 로직 100% 유지
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
      await fetchStatusCounts();
      setSelected(null);
    }
    setActionLoading(null);
  }

  // v2.40 A3-1b — 검색만 useFilter로 클라 필터(탭은 서버 status 필터라 유지).
  //   tab은 "all" 고정으로 두고(서버에서 이미 status 분리됨) 검색어만 적용.
  const { q, setQ, filtered } = useFilter<Organization>(orgs, FILTER_FIELDS);

  // 검색 결과 변동 시 페이지 1로 리셋(범위 밖 페이지 방지)
  useEffect(() => {
    setPage(1);
  }, [q, filter]);

  // 현재 페이지 슬라이스
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );

  // 상태 필터 탭 — 기존 5탭(대기/승인/보관/거절/전체) 유지. value "" = 전체.
  const tabs = useMemo(
    () => [
      { id: "pending", label: "대기", n: statusCounts.pending ?? 0 },
      { id: "approved", label: "승인", n: statusCounts.approved ?? 0 },
      { id: "archived", label: "보관", n: statusCounts.archived ?? 0 },
      { id: "rejected", label: "거절", n: statusCounts.rejected ?? 0 },
      { id: "all", label: "전체", n: statusCounts.all ?? 0 },
    ],
    [statusCounts]
  );

  // DataTable 컬럼 정의 — 기존 6열(단체명/지역/신청자/상태/신청일) 유지(액션은 Drawer foot로 이동)
  const columns: Column<Organization>[] = useMemo(
    () => [
      {
        key: "name",
        label: "단체명",
        render: (org) => (
          <PrimaryCell
            initials={(org.name ?? "?")[0]}
            title={org.name}
            meta={org.apply_note ? `메모: ${org.apply_note}` : undefined}
          />
        ),
      },
      {
        key: "region",
        label: "지역",
        width: 120,
        hideSm: true,
        render: (org) => org.region || "-",
      },
      {
        key: "owner",
        label: "신청자",
        width: 200,
        hideSm: true,
        render: (org) => (
          <div>
            <div>{org.owner.nickname}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {org.owner.email}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        label: "상태",
        width: 90,
        align: "center",
        render: (org) => <StatusBadge map={STATUS_BADGE_MAP} value={org.status} />,
      },
      {
        key: "created_at",
        label: "신청일",
        width: 120,
        align: "right",
        hideSm: true,
        render: (org) => new Date(org.created_at).toLocaleDateString("ko-KR"),
      },
    ],
    []
  );

  return (
    // 페이지 루트에 data-skin="toss" opt-in 유지
    <div data-skin="toss">
      {/* PageHead — eyebrow(아이콘+라벨) + 제목 + 보조설명 */}
      <PageHead
        eyebrow="ADMIN · 외부 관리"
        icon="building-2"
        title="단체 관리"
        sub="단체 신청 승인 / 거절 및 전체 단체 목록을 관리합니다."
      />

      {/* StatRow — OA1 4상태 분포(실측 statusCounts 재사용, 신규 쿼리 0) */}
      <StatRow
        items={[
          { icon: "clock", label: "대기", value: statusCounts.pending ?? 0 },
          { icon: "circle-check", label: "승인", value: statusCounts.approved ?? 0 },
          { icon: "archive", label: "보관", value: statusCounts.archived ?? 0 },
          { icon: "ban", label: "거절", value: statusCounts.rejected ?? 0 },
        ]}
      />

      {/* Toolbar — 검색(클라 useFilter) + 상태 탭(서버 status 필터) */}
      <Toolbar
        search={q}
        onSearch={setQ}
        placeholder="단체명, 지역 검색"
        tabs={tabs}
        active={filter === "" ? "all" : filter}
        onTab={(id) => setFilter(id === "all" ? "" : id)}
      />

      {/* DataTable — 행 클릭 시 Drawer 열기. 페이지네이션 클라 */}
      <DataTable<Organization>
        columns={columns}
        rows={pageRows}
        keyField="id"
        state={loading ? "loading" : "filled"}
        onRowClick={(org) => setSelected(org)}
        pagination={{
          page,
          perPage,
          total: filtered.length,
          onChange: setPage,
        }}
        emptyTitle={
          filter === "pending"
            ? "대기 중인 신청이 없습니다."
            : filter === "archived"
              ? "보관된 단체가 없습니다."
              : "해당 단체가 없습니다."
        }
      />

      {/* Drawer — 행 클릭 시 신청 정보 요약 + (pending) 승인/거절 액션 */}
      <Drawer
        open={selected !== null}
        onClose={() => {
          setSelected(null);
          setRejectId(null);
          setRejectReason("");
        }}
        title={selected ? selected.name : ""}
        sub={
          selected
            ? `/${selected.slug}${selected.region ? ` · ${selected.region}` : ""}`
            : undefined
        }
        foot={
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
                    거절
                  </button>
                  <button
                    onClick={() => handleApprove(selected.id)}
                    disabled={actionLoading === selected.id}
                    className="btn btn--sm disabled:opacity-50"
                    style={{ background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }}
                  >
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
                    거절 확정
                  </button>
                </>
              )}
              {/* approved — 해산은 owner 전용(Phase E) → admin disabled 안내 */}
              {selected.status === "approved" && (
                <button
                  disabled
                  title="단체 해산은 단체 소유자(owner)만 단체 설정에서 처리할 수 있습니다."
                  className="btn btn--sm opacity-50 cursor-not-allowed"
                >
                  해산 (소유자 전용)
                </button>
              )}
              {/* archived/rejected — 복구도 owner 전용 → admin disabled 안내 */}
              {(selected.status === "archived" || selected.status === "rejected") && (
                <button
                  disabled
                  title="복구는 단체 소유자(owner)만 처리할 수 있습니다."
                  className="btn btn--sm opacity-50 cursor-not-allowed"
                >
                  복구 (소유자 전용)
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* 상태 뱃지 */}
            <div>
              <StatusBadge map={STATUS_BADGE_MAP} value={selected.status} />
            </div>

            {/* BO1 — 신청 정보(DL 요약). OU3 신청 form 동일 organizations 컬럼 */}
            <DL
              rows={[
                ["신청자", `${selected.owner.nickname} · ${selected.owner.email}`],
                ["소개", selected.description || "-"],
                ["활동 지역", selected.region || "-"],
                ["연락 이메일", selected.contact_email || "-"],
                ["웹사이트", selected.website_url || "-"],
                ["신청 메모", selected.apply_note || "-"],
                ["신청일", new Date(selected.created_at).toLocaleDateString("ko-KR")],
                [
                  "승인일",
                  selected.approved_at
                    ? new Date(selected.approved_at).toLocaleDateString("ko-KR")
                    : "-",
                ],
                // 거절 상태일 때만 사유 표시
                ...(selected.status === "rejected"
                  ? ([["거절 사유", selected.rejection_reason || "-"]] as [string, string][])
                  : []),
              ]}
            />

            {/* approved — BO5 운영 활동 통계(실측 series_count / members_count) */}
            {selected.status === "approved" && (
              <DL
                rows={[
                  ["시리즈", `${selected.series_count}개`],
                  ["멤버", `${selected.members_count}명`],
                ]}
              />
            )}

            {/* pending — 거절 사유 입력(모달 내 거절 모드일 때만) */}
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
      </Drawer>
    </div>
  );
}
