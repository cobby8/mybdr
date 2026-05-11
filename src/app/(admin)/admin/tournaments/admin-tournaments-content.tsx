"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper 제거 / <Badge> → .badge--soft + 상태별 inline color
// - 페이지 크기 / 페이지네이션 → .btn .btn--sm

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

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

// 탭별 .badge--soft inline color (default / info / success / secondary)
const STATUS_STYLE: Record<string, React.CSSProperties | undefined> = {
  draft: undefined, // .badge--soft 기본
  registration: {
    background: "color-mix(in srgb, var(--color-info) 12%, transparent)",
    color: "var(--color-info)",
    borderColor: "transparent",
  },
  in_progress: {
    background: "color-mix(in srgb, var(--color-success) 12%, transparent)",
    color: "var(--color-success)",
    borderColor: "transparent",
  },
  completed: undefined, // .badge--soft 기본 (secondary 톤)
};

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트", double_elimination: "더블 엘리미네이션",
  round_robin: "리그전", group_stage: "조별리그", group_stage_knockout: "조별리그+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트", dual_tournament: "듀얼토너먼트",
  full_league_knockout: "풀리그+토너먼트", swiss: "스위스 라운드",
};

const TRANSITIONS: Record<string, string[]> = {
  draft: ["registration"], registration: ["in_progress"], in_progress: ["completed"],
  completed: [], upcoming: ["registration"], registration_open: ["in_progress"],
  active: ["in_progress"], published: ["registration"], open: ["in_progress"],
  ongoing: ["completed"], live: ["completed"], cancelled: ["draft"],
};

const PAGE_SIZE_OPTIONS = [10, 20, 30];

interface Props {
  tournaments: SerializedTournament[];
  updateStatusAction: (formData: FormData) => Promise<void>;
  toggleVisibilityAction: (formData: FormData) => Promise<void>;
  pagination: Pagination;
}

export function AdminTournamentsContent({
  tournaments,
  updateStatusAction,
  toggleVisibilityAction,
  pagination,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedTournament | null>(null);

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
                    <span className="badge badge--soft" style={STATUS_STYLE[tabKey]}>
                      {STATUS_LABEL[status] ?? status}
                    </span>
                  </td>
                  <td data-label="공개" className="px-4 py-3">
                    <span
                      className="badge badge--soft"
                      style={
                        t.isPublic
                          ? { background: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)", borderColor: "transparent" }
                          : undefined
                      }
                    >
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
            <div className="flex flex-col gap-2">
              {/* 신청서 관리 — 2026-05-11 Phase 1 페이지로 진입 (auto IA 통합) */}
              <Link
                href={`/admin/tournaments/${selected.id}/teams`}
                className="btn btn--primary btn--sm"
                style={{ textAlign: "center" }}
              >
                신청서 관리
              </Link>
              {/* 공개/비공개 토글 */}
              <form action={toggleVisibilityAction} className="flex items-center gap-2">
                <input type="hidden" name="tournament_id" value={selected.id} />
                <input type="hidden" name="is_public" value={selected.isPublic ? "false" : "true"} />
                {/* (web) .btn 패턴 — 공개로 변경은 success 톤 inline */}
                <button
                  type="submit"
                  onClick={() => setSelected((prev) => prev ? { ...prev, isPublic: !prev.isPublic } : null)}
                  className="btn btn--sm flex-1"
                  style={
                    !selected.isPublic
                      ? { background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }
                      : undefined
                  }
                >
                  {selected.isPublic ? "비공개로 변경" : "공개로 변경"}
                </button>
              </form>
              {/* 상태 변경 */}
              {(TRANSITIONS[selected.status ?? "draft"] ?? []).length > 0 && (
                <form action={updateStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="tournament_id" value={selected.id} />
                  <select
                    name="status"
                    defaultValue=""
                    className="flex-1 rounded-[10px] border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)" }}
                  >
                    <option value="" disabled>상태 변경</option>
                    {(TRANSITIONS[selected.status ?? "draft"] ?? []).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                    ))}
                  </select>
                  {/* (web) .btn .btn--primary 패턴 */}
                  <button type="submit" className="btn btn--primary btn--sm">
                    적용
                  </button>
                </form>
              )}
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
    </>
  );
}
