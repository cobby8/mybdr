"use client";

// 2026-06-22 v2.40 Phase A3-1a — 통합 콘솔 키트(console-kit) 통일.
//   변경: Toolbar(탭) + DataTable(행 요약 Drawer) 로 UI 교체.
//   유지(0변경): 데이터 패칭(page.tsx 서버 ?q= + 서버 페이지네이션)·server action
//     (updateStatusAction)·라우트 href·삭제 확인 모달(AdminDetailModal·기존 로직 이식)·
//     권한(isSuperAdmin)·snake 접근자.
//   설계 메모:
//     - 검색은 page.tsx AdminPageHeader 의 서버 ?q= 폼이 담당 → Toolbar 는 탭만(검색칸 미노출).
//       useFilter 는 "클라 탭 필터" 전용(서버 페이징과 충돌 금지·기존 activeTab 동작 보존).
//     - StatRow(status 카운트)는 page.tsx 에서 클라 파생(SELECT 0)해 prop 으로 받음.
//     - 행 클릭 → Drawer(가벼운 요약 + 핵심 액션). 삭제 확인 모달은 별도 AdminDetailModal 유지.
//
// (이전 이력)
// 2026-05-04: (web) 디자인 시스템 통일 / 2026-05-11 Phase 2-C IA / 2026-05-15 Admin-4-A 박제.

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  AdminDetailModal,
} from "@/components/admin/admin-detail-modal";
// v2.40 A3-1a — 통합 콘솔 키트
import {
  Toolbar,
  DataTable,
  Drawer,
  DL,
  PrimaryCell,
  StatusBadge,
  useFilter,
  type Column,
  type StatusMeta,
  type FilterableRow,
} from "@/components/admin/console-kit";
import { Icon, Btn } from "@/components/admin-toss";

interface SerializedTournament {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  isPublic: boolean;
  teamCount: number;
  matchCount: number;
  organizerName: string | null;
  organizerEmail: string | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "준비중", upcoming: "준비중",
  registration: "접수중", registration_open: "접수중", active: "접수중",
  published: "접수중", open: "접수중", opening_soon: "접수중", registration_closed: "접수중",
  in_progress: "진행중", live: "진행중", ongoing: "진행중", group_stage: "진행중",
  completed: "종료", ended: "종료", closed: "종료", cancelled: "종료",
};

// v2.40 A3-1a — StatusBadge map (탭키 → 톤/라벨).
//   기존 admin-stat-pill data-tone 매핑을 키트 Badge tone 으로 변환(승인 규약):
//   draft(mute→grey)·registration(info→primary)·in_progress(ok)·completed(mute→grey).
const STATUS_META: Record<string, StatusMeta> = {
  draft: { tone: "grey", label: "준비중" },
  registration: { tone: "primary", label: "접수중" },
  in_progress: { tone: "ok", label: "진행중" },
  completed: { tone: "grey", label: "종료" },
};

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트", double_elimination: "더블 엘리미네이션",
  round_robin: "리그전", group_stage: "조별리그", group_stage_knockout: "조별리그+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트", dual_tournament: "듀얼토너먼트",
  full_league_knockout: "풀리그+토너먼트", swiss: "스위스 라운드",
};

// 탭 라벨(useFilter 의 클라 탭 필터용)
const TAB_LABEL: Record<string, string> = {
  draft: "준비중", registration: "접수중", in_progress: "진행중", completed: "종료",
};

const PAGE_SIZE_OPTIONS = [10, 20, 30];

// 상태코드 → 탭키 정규화 (컴포넌트 밖 상수 함수 — 매 렌더 재생성 방지)
const TO_TAB_KEY: Record<string, string> = {
  draft: "draft", upcoming: "draft",
  registration: "registration", registration_open: "registration", active: "registration",
  published: "registration", open: "registration", opening_soon: "registration", registration_closed: "registration",
  in_progress: "in_progress", live: "in_progress", ongoing: "in_progress", group_stage: "in_progress",
  completed: "completed", ended: "completed", closed: "completed", cancelled: "completed",
};
const toTabKey = (status: string): string => TO_TAB_KEY[status] ?? "draft";

// useFilter 검색 필드(클라) — 현재 검색은 서버 ?q= 가 담당하므로 빈 배열.
//   탭 필터만 활성. FIELDS 는 컴포넌트 밖 상수(매 렌더 새 참조 방지·승인 규약 §3).
const FILTER_FIELDS: (keyof FilterRow)[] = [];

// useFilter 가 status 로 탭 매칭하므로, 행에 정규화된 status(탭키)를 부여한 형태로 변환.
//   FilterableRow(키트 제약 — status?:string + 인덱스 시그니처) 를 충족하도록 교차.
type FilterRow = SerializedTournament & { status: string } & FilterableRow;

interface Props {
  tournaments: SerializedTournament[];
  // server action 2개는 prop 시그니처 유지(호출처 page.tsx 영향 0).
  updateStatusAction: (formData: FormData) => Promise<void>;
  toggleVisibilityAction: (formData: FormData) => Promise<void>;
  pagination: Pagination;
  isSuperAdmin: boolean;
}

export function AdminTournamentsContent({
  tournaments,
  updateStatusAction,
  toggleVisibilityAction: _toggleVisibilityAction,
  pagination,
  isSuperAdmin,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 행에 정규화된 탭키 status 를 부여 (useFilter 탭 매칭용).
  //   object literal 은 인덱스 시그니처를 구조적으로 추론받지 못하므로 FilterRow 로 단언.
  const rows = tournaments.map(
    (t) => ({ ...t, status: toTabKey(t.status ?? "draft") }) as FilterRow,
  );

  // 클라 탭 필터(검색 X — 서버 ?q= 담당). tab="all" 이면 전체.
  const { tab, setTab, filtered } = useFilter<FilterRow>(rows, FILTER_FIELDS);

  const [selected, setSelected] = useState<SerializedTournament | null>(null);

  // 삭제 확인 모달 상태(기존 로직 100% 보존).
  const [deleteTarget, setDeleteTarget] = useState<SerializedTournament | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [hardMode, setHardMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openDeleteModal = (t: SerializedTournament) => {
    setConfirmName("");
    setHardMode(false);
    setDeleteError(null);
    setDeleteTarget(t);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  // 삭제 실행 — DELETE /api/web/tournaments/:id (hardMode 면 ?hard=1). 기존 로직 그대로.
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const query = hardMode ? "?hard=1" : "";
      const res = await fetch(
        `/api/web/tournaments/${deleteTarget.id}${query}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        let message = "삭제에 실패했습니다.";
        try {
          const body = await res.json();
          message = body?.error?.message ?? body?.message ?? message;
        } catch {
          /* JSON 파싱 실패 시 기본 메시지 */
        }
        setDeleteError(message);
        setDeleting(false);
        return;
      }
      setDeleteTarget(null);
      setSelected(null);
      setDeleting(false);
      router.refresh();
    } catch {
      setDeleteError("네트워크 오류로 삭제하지 못했습니다.");
      setDeleting(false);
    }
  };

  // 탭(전체 + 4 status) — 카운트는 정규화된 status 기준.
  const tabKeys = ["draft", "registration", "in_progress", "completed"];
  const tabs = [
    { id: "all", label: "전체", n: rows.length },
    ...tabKeys.map((k) => ({
      id: k,
      label: TAB_LABEL[k],
      n: rows.filter((r) => r.status === k).length,
    })),
  ];

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";

  // 서버 페이징 네비게이션(기존 로직 그대로).
  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageSize = (size: number) => {
    navigate({ pageSize: String(size), page: "1" });
  };

  const { page, pageSize, totalPages, totalCount } = pagination;
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  // DataTable 컬럼 — 시안 au-screens AuTournaments 패턴(데이터/문구 유지).
  const columns: Column<FilterRow>[] = [
    {
      key: "name",
      label: "대회",
      render: (r) => (
        <PrimaryCell
          initials="🏆"
          title={r.name}
          meta={r.organizerName ?? r.organizerEmail ?? "-"}
        />
      ),
    },
    {
      key: "public",
      label: "공개",
      align: "center",
      width: "80px",
      render: (r) => (
        <StatusBadge
          map={{
            yes: { tone: "ok", label: "공개" },
            no: { tone: "grey", label: "비공개" },
          }}
          value={r.isPublic ? "yes" : "no"}
        />
      ),
    },
    {
      key: "date",
      label: "날짜",
      width: "110px",
      hideSm: true,
      render: (r) => (
        <span style={{ color: "var(--ink-mute)" }}>{fmtDate(r.createdAt)}</span>
      ),
    },
    {
      key: "status",
      label: "상태",
      align: "center",
      width: "92px",
      render: (r) => <StatusBadge map={STATUS_META} value={r.status} />,
    },
  ];

  return (
    <>
      {/* 상태 탭 — 검색칸 미노출(서버 ?q= 가 헤더 폼에서 담당) */}
      <Toolbar tabs={tabs} active={tab} onTab={setTab} />

      {/* 리스트 헤더: 표시 개수 + 페이지 크기 선택(기존 동작 보존) */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--ink-mute)" }}>
          {totalCount > 0 ? `${rangeStart}–${rangeEnd} / ${totalCount}개` : "0개"}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: "var(--ink-mute)" }}>페이지당</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Btn
              key={size}
              size="sm"
              variant={pageSize === size ? "primary" : "ghost"}
              onClick={() => handlePageSize(size)}
            >
              {size}개
            </Btn>
          ))}
        </div>
      </div>

      {/* 키트 DataTable — keyField/onRowClick/서버 pagination */}
      <DataTable
        columns={columns}
        rows={filtered}
        keyField="id"
        onRowClick={(r) => setSelected(r)}
        pagination={{
          page,
          perPage: pageSize,
          total: totalCount,
          onChange: (p) => navigate({ page: String(p) }),
        }}
        emptyTitle="해당하는 대회가 없습니다."
      />

      {/* 행 요약 Drawer — 가벼운 요약 + 핵심 액션(상세/운영 페이지·행정) */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        sub={
          selected
            ? `${selected.organizerName ?? selected.organizerEmail ?? "-"} 주최`
            : ""
        }
        foot={
          selected ? (
            <div className="flex w-full flex-wrap gap-2">
              <Link
                href={`/admin/tournaments/${selected.id}`}
                className="ts-btn ts-btn--primary"
                style={{ flex: 1, textAlign: "center" }}
              >
                상세 페이지 열기
              </Link>
              <Link
                href={`/tournament-admin/tournaments/${selected.id}`}
                className="ts-btn ts-btn--secondary"
                style={{ flex: 1, textAlign: "center" }}
              >
                운영 페이지
              </Link>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div style={{ marginBottom: 18 }}>
              <StatusBadge map={STATUS_META} value={toTabKey(selected.status ?? "draft")} />
            </div>
            <DL
              rows={[
                ["공개 여부", selected.isPublic ? "공개" : "비공개"],
                ["주최자", selected.organizerName ?? selected.organizerEmail ?? "-"],
                ["형식", FORMAT_LABEL[selected.format ?? ""] ?? selected.format ?? "-"],
                ["참가팀", `${selected.teamCount}팀`],
                ["경기수", `${selected.matchCount}경기`],
                ["시작일", fmtDate(selected.startDate)],
                ["종료일", fmtDate(selected.endDate)],
                ["생성일", fmtDate(selected.createdAt)],
              ]}
            />

            {/* 행정 관리 — 기존 server action / 라우트 href 100% 보존 */}
            <div
              className="mt-4 rounded-[8px] border p-3"
              style={{ borderColor: "var(--border)", background: "var(--grey-50)" }}
            >
              <p
                className="mb-2 text-xs font-semibold uppercase"
                style={{ color: "var(--ink-mute)", letterSpacing: "0.04em" }}
              >
                행정 관리
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* 대회 승인 — draft → registration_open (server action) */}
                {selected.status === "draft" ? (
                  <form action={updateStatusAction}>
                    <input type="hidden" name="tournament_id" value={selected.id} />
                    <input type="hidden" name="status" value="registration_open" />
                    <Btn type="submit" size="sm" variant="primary" block>
                      대회 승인
                    </Btn>
                  </form>
                ) : (
                  <Btn type="button" size="sm" variant="ghost" disabled block>
                    이미 승인됨
                  </Btn>
                )}
                {/* 운영자 변경 — 별 페이지 */}
                <Link
                  href={`/admin/tournaments/${selected.id}/transfer-organizer`}
                  className="ts-btn ts-btn--secondary ts-btn--sm"
                  style={{ textAlign: "center" }}
                >
                  운영자 변경
                </Link>
                {/* 감사 로그 — 별 페이지 */}
                <Link
                  href={`/admin/tournaments/${selected.id}/audit-log`}
                  className="ts-btn ts-btn--secondary ts-btn--sm"
                  style={{ textAlign: "center" }}
                >
                  감사 로그
                </Link>
                {/* 대회 삭제 — 이름 확인 모달 open(기존 로직) */}
                <Btn
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => openDeleteModal(selected)}
                >
                  대회 삭제
                </Btn>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--ink-mute)" }}>
                ※ 기본 삭제는 &quot;취소&quot; 처리(복구 가능)입니다.
                {isSuperAdmin ? " 완전 삭제는 복구할 수 없습니다." : ""}
              </p>
            </div>
          </>
        )}
      </Drawer>

      {/* 삭제 확인 모달 — 기존 AdminDetailModal + 로직 100% 보존(데이터/액션 0변경) */}
      {deleteTarget && (
        <AdminDetailModal
          isOpen={!!deleteTarget}
          onClose={closeDeleteModal}
          title="대회 삭제"
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="btn btn--sm flex-1 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || confirmName.trim() !== deleteTarget.name}
                className="btn btn--sm flex-1 disabled:pointer-events-none disabled:opacity-40"
                style={{
                  background: "var(--color-error)",
                  color: "#fff",
                  borderColor: "var(--color-error)",
                }}
              >
                {deleting
                  ? "삭제 중…"
                  : hardMode
                    ? "완전 삭제"
                    : "삭제(취소 처리)"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div
              className="flex items-start gap-2 rounded-md border p-3"
              style={{
                borderColor: "var(--color-error)",
                background: "var(--color-elevated)",
              }}
            >
              <Icon name="triangle-alert" size={20} color="var(--color-error)" />
              <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                {hardMode ? (
                  <>
                    이 대회와 관련된 모든 데이터(경기·팀·기록·사이트)가{" "}
                    <strong>영구 삭제</strong>되며 복구할 수 없습니다.
                  </>
                ) : (
                  <>
                    이 대회를 <strong>취소 처리</strong>합니다. (상태=취소, 추후
                    복구 가능)
                  </>
                )}
              </p>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                확인을 위해 대회명을 정확히 입력하세요:{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {deleteTarget.name}
                </strong>
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="대회명 입력"
                autoFocus
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-card)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {isSuperAdmin && (
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--color-text-primary)" }}
              >
                <input
                  type="checkbox"
                  checked={hardMode}
                  onChange={(e) => setHardMode(e.target.checked)}
                />
                완전 삭제(복구 불가) — 모든 관련 데이터 영구 제거
              </label>
            )}

            {deleteError && (
              <p className="text-sm" style={{ color: "var(--color-error)" }}>
                {deleteError}
              </p>
            )}
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
