"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper 제거 / <Badge> → .badge--soft + 상태별 inline color
// - 페이지 크기 / 페이지네이션 → .btn .btn--sm
//
// 2026-05-11 Phase 2-C IA 재설계:
// - admin/tournaments 모달 = "행정" 전용으로 단순화 (운영자 페이지에 모든 운영 위임)
// - 제거: 공개 토글 / 상태 변경 dropdown / 신청서 관리 Link (운영자 페이지로 이관)
// - 추가: "대회 운영 페이지로 이동" Link (primary) + 행정 placeholder 4건 (Phase 3 예정)
// - server action 2개 (updateStatus / toggleVisibility) 는 import 제거 (행정 모달 미사용)
//
// 2026-05-15 Admin-4-A 박제 (v2.14):
// - 상태 뱃지: .badge--soft + inline color → .admin-stat-pill[data-tone=...] (admin.css 박제)
// - 공개 뱃지: 동일 패턴. 비즈 로직 / state / props 시그니처 100% 보존.
// - 토큰 --color-* 는 globals.css alias 로 신 토큰 자동 매핑 — 추가 치환 불필요.

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";
// Phase 1 (Toss 전환) — Material Symbols → lucide(<Icon>)
import { Icon } from "@/components/admin-toss";

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

// 2026-05-15 Admin-4-A 박제 — STATUS_STYLE inline 색 → admin-stat-pill data-tone 매핑.
// draft=mute / registration=info / in_progress=ok / completed=mute (시안 v2.14 박제 패턴)
const STATUS_TONE: Record<string, "mute" | "info" | "ok" | "warn" | "err" | "accent"> = {
  draft: "mute",
  registration: "info",
  in_progress: "ok",
  completed: "mute",
};

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트", double_elimination: "더블 엘리미네이션",
  round_robin: "리그전", group_stage: "조별리그", group_stage_knockout: "조별리그+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트", dual_tournament: "듀얼토너먼트",
  full_league_knockout: "풀리그+토너먼트", swiss: "스위스 라운드",
};

// Phase 2-C 행정 모달은 상태 변경 / 공개 토글 모두 운영자 페이지로 이관 — TRANSITIONS 사용 안 함.

const PAGE_SIZE_OPTIONS = [10, 20, 30];

interface Props {
  tournaments: SerializedTournament[];
  // Phase 2-C — server action 2개는 prop 시그니처 유지 (호출처 page.tsx 영향 0)
  // 실제 사용은 안 함. Phase 3 행정 메뉴 구현 시 다시 활용 가능.
  updateStatusAction: (formData: FormData) => Promise<void>;
  toggleVisibilityAction: (formData: FormData) => Promise<void>;
  pagination: Pagination;
  // 2026-06-14 대회 삭제 — super_admin 일 때만 "완전 삭제(복구불가)" Hard 옵션 노출.
  //   일반 운영/관리자는 Soft(취소) 만 가능 (API 측 super_admin 가드와 동일 정책).
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

  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedTournament | null>(null);

  // 2026-06-14 대회 삭제 모달 상태.
  //   deleteTarget: 삭제 확인 모달 대상 (null = 닫힘)
  //   confirmName: 사용자가 입력한 대회명 (정확히 일치해야 삭제 버튼 활성)
  //   hardMode: super_admin 이 "완전 삭제(복구불가)" 체크 시 true → ?hard=1 전송
  //   deleting: 요청 진행 중 (중복 클릭 방지)
  //   deleteError: 실패 메시지 표시
  const [deleteTarget, setDeleteTarget] = useState<SerializedTournament | null>(
    null,
  );
  const [confirmName, setConfirmName] = useState("");
  const [hardMode, setHardMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 삭제 확인 모달 열기 — 입력값 초기화하며 대상 지정.
  const openDeleteModal = (t: SerializedTournament) => {
    setConfirmName("");
    setHardMode(false);
    setDeleteError(null);
    setDeleteTarget(t);
  };

  // 삭제 확인 모달 닫기 — 진행 중이 아닐 때만.
  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  // 삭제 실행 — DELETE /api/web/tournaments/:id (hardMode 면 ?hard=1).
  //   성공 시: 모달 2개(삭제 확인 + 상세) 모두 닫고 router.refresh() 로 목록 갱신.
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
        // API 는 apiError() 로 { error: { message } } 형태 반환 (snake_case 변환 영향 없음).
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
      // 성공 — 모달 닫고 목록 새로고침.
      setDeleteTarget(null);
      setSelected(null);
      setDeleting(false);
      router.refresh();
    } catch {
      setDeleteError("네트워크 오류로 삭제하지 못했습니다.");
      setDeleting(false);
    }
  };

  const toTabKey = (status: string): string => {
    const map: Record<string, string> = {
      draft: "draft", upcoming: "draft",
      registration: "registration", registration_open: "registration", active: "registration",
      published: "registration", open: "registration", opening_soon: "registration", registration_closed: "registration",
      in_progress: "in_progress", live: "in_progress", ongoing: "in_progress", group_stage: "in_progress",
      completed: "completed", ended: "completed", closed: "completed", cancelled: "completed",
    };
    return map[status] ?? "draft";
  };

  const filtered =
    activeTab === "all"
      ? tournaments
      : tournaments.filter((t) => toTabKey(t.status ?? "draft") === activeTab);

  const tabs = [
    { key: "all", label: "전체", count: tournaments.length },
    { key: "draft", label: "준비중", count: tournaments.filter((t) => toTabKey(t.status ?? "draft") === "draft").length },
    { key: "registration", label: "접수중", count: tournaments.filter((t) => toTabKey(t.status ?? "draft") === "registration").length },
    { key: "in_progress", label: "진행중", count: tournaments.filter((t) => toTabKey(t.status ?? "draft") === "in_progress").length },
    { key: "completed", label: "종료", count: tournaments.filter((t) => toTabKey(t.status ?? "draft") === "completed").length },
  ];

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";

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

  const handlePage = (p: number) => {
    navigate({ page: String(p) });
  };

  const { page, pageSize, totalPages, totalCount } = pagination;
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <>
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 리스트 헤더: 표시 개수 + 페이지 크기 선택 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {totalCount > 0 ? `${rangeStart}–${rangeEnd} / ${totalCount}개` : "0개"}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>페이지당</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => handlePageSize(size)}
              className={`btn btn--sm ${pageSize === size ? "btn--primary" : ""}`}
            >
              {size}개
            </button>
          ))}
        </div>
      </div>

      {/* admin-table-wrap: 모바일 카드 변환 시 overflow-x: visible 강제 (globals.css [Admin Phase B]) */}
      <div className="overflow-x-auto admin-table-wrap">
        {/* admin-table: 모바일 (≤720px) 카드형 자동 변환 (globals.css [Admin Phase B], 2026-05-02) */}
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 font-medium">대회명</th>
              <th className="w-[90px] px-5 py-4 font-medium">상태</th>
              <th className="w-[70px] px-4 py-4 font-medium">공개</th>
              <th className="w-[100px] px-5 py-4 font-medium">날짜</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const status = t.status ?? "draft";
              const tabKey = toTabKey(status);
              return (
                <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer">
                  {/* data-primary="true": 모바일에서 카드 헤딩 (큰 폰트 + dashed border) */}
                  <td data-primary="true" className="px-5 py-3">
                    <p className="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {t.organizerName ?? t.organizerEmail ?? "-"}
                    </p>
                  </td>
                  <td data-label="상태" className="px-5 py-3">
                    {/* Admin-4-A 박제 — admin-stat-pill[data-tone] 시안 패턴 (admin.css) */}
                    <span className="admin-stat-pill" data-tone={STATUS_TONE[tabKey] ?? "mute"}>
                      {STATUS_LABEL[status] ?? status}
                    </span>
                  </td>
                  <td data-label="공개" className="px-4 py-3">
                    {/* 공개=ok / 비공개=mute (시안 박제) */}
                    <span className="admin-stat-pill" data-tone={t.isPublic ? "ok" : "mute"}>
                      {t.isPublic ? "공개" : "비공개"}
                    </span>
                  </td>
                  {/* whitespace-nowrap으로 날짜 줄바꿈 방지 */}
                  <td data-label="날짜" className="whitespace-nowrap px-5 py-3" style={{ color: "var(--color-text-muted)" }}>
                    {fmtDate(t.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
          해당하는 토너먼트가 없습니다.
        </div>
      )}

      {/* 페이지네이션 — (web) .btn 패턴 적용 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1}
            className="btn btn--sm disabled:pointer-events-none disabled:opacity-30"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-sm" style={{ color: "var(--color-text-muted)" }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePage(p as number)}
                  className={`btn btn--sm min-w-[32px] ${page === p ? "btn--primary" : ""}`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page >= totalPages}
            className="btn btn--sm disabled:pointer-events-none disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          actions={
            <div className="flex flex-col gap-3">
              {/* Phase 2-C — "대회 운영 페이지로 이동" primary CTA. 모든 운영(공개/상태/팀/매치)은 운영자 페이지에서 처리. */}
              <Link
                href={`/tournament-admin/tournaments/${selected.id}`}
                className="btn btn--primary"
                style={{ textAlign: "center" }}
              >
                대회 운영 페이지로 이동
              </Link>

              {/* 2026-05-12 Phase 4 — 행정 관리 실 액션 활성화 (대회 승인 / 운영자 변경 / 감사 로그) */}
              <div
                className="rounded-[8px] border p-3"
                style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
              >
                <p
                  className="mb-2 text-xs font-semibold uppercase"
                  style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
                >
                  행정 관리
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {/* 대회 승인 — draft → registration_open 으로 status 변경 (server action) */}
                  {selected.status === "draft" ? (
                    <form action={updateStatusAction}>
                      <input type="hidden" name="tournament_id" value={selected.id} />
                      <input type="hidden" name="status" value="registration_open" />
                      <button
                        type="submit"
                        className="btn btn--sm w-full"
                        style={{ background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }}
                      >
                        대회 승인
                      </button>
                    </form>
                  ) : (
                    <button type="button" disabled className="btn btn--sm opacity-50 cursor-not-allowed">
                      이미 승인됨
                    </button>
                  )}
                  {/* 운영자 변경 — 별 페이지 */}
                  <Link
                    href={`/admin/tournaments/${selected.id}/transfer-organizer`}
                    className="btn btn--sm w-full"
                    style={{ textAlign: "center" }}
                  >
                    운영자 변경
                  </Link>
                  {/* 감사 로그 — 별 페이지 */}
                  <Link
                    href={`/admin/tournaments/${selected.id}/audit-log`}
                    className="btn btn--sm w-full"
                    style={{ textAlign: "center" }}
                  >
                    감사 로그
                  </Link>
                  {/* 2026-06-14 대회 삭제 활성화 — 클릭 시 이름 확인 모달 open. */}
                  <button
                    type="button"
                    onClick={() => openDeleteModal(selected)}
                    className="btn btn--sm"
                    style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
                  >
                    대회 삭제
                  </button>
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  ※ 기본 삭제는 "취소" 처리(복구 가능)입니다.
                  {isSuperAdmin ? " 완전 삭제는 복구할 수 없습니다." : ""}
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="대회 정보"
              rows={[
                ["공개 여부", selected.isPublic ? "공개" : "비공개"],
                ["주최자", selected.organizerName ?? selected.organizerEmail ?? "-"],
                ["형식", FORMAT_LABEL[selected.format ?? ""] ?? selected.format ?? "-"],
                ["참가팀", `${selected.teamCount}팀`],
                ["경기수", `${selected.matchCount}경기`],
              ]}
            />
            <ModalInfoSection
              title="일정"
              rows={[
                ["시작일", fmtDate(selected.startDate)],
                ["종료일", fmtDate(selected.endDate)],
                ["생성일", fmtDate(selected.createdAt)],
              ]}
            />
          </div>
        </AdminDetailModal>
      )}

      {/* 2026-06-14 대회 삭제 확인 모달 — AdminDetailModal 재사용 (디자인 일관).
          이름 정확 입력 시에만 삭제 버튼 활성 / 기본 Soft(취소) / super_admin 만 Hard 옵션 노출. */}
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
              {/* 이름 정확 입력 시에만 활성. hardMode 면 강조(빨강) 표시. */}
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
            {/* 경고 안내 — Soft/Hard 분기 설명 */}
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

            {/* 이름 확인 입력 — 정확 일치해야 삭제 활성 */}
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

            {/* super_admin 전용 — 완전 삭제(복구불가) 옵션 */}
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

            {/* 실패 메시지 */}
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
