"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const STATUS_BADGE: Record<string, "default" | "success" | "info" | "warning" | "secondary"> = {
  draft: "default", registration: "info", in_progress: "success", completed: "secondary",
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
        <span className="text-sm text-[var(--color-text-muted)]">
          {totalCount > 0 ? `${rangeStart}–${rangeEnd} / ${totalCount}개` : "0개"}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--color-text-muted)]">페이지당</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => handlePageSize(size)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                pageSize === size
                  ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]"
              }`}
            >
              {size}개
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
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
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-elevated)]"
                  >
                    <td className="px-5 py-3">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">
                        {t.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t.organizerName ?? t.organizerEmail ?? "-"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_BADGE[tabKey] ?? "default"}>
                        {STATUS_LABEL[status] ?? status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.isPublic
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {t.isPublic ? "공개" : "비공개"}
                      </span>
                    </td>
                    {/* whitespace-nowrap으로 날짜 줄바꿈 방지 */}
                    <td className="whitespace-nowrap px-5 py-3 text-[var(--color-text-muted)]">
                      {fmtDate(t.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            해당하는 토너먼트가 없습니다.
          </div>
        )}
      </Card>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1}
            className="rounded px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)] disabled:pointer-events-none disabled:opacity-30"
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
                <span key={`ellipsis-${idx}`} className="px-2 text-sm text-[var(--color-text-muted)]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePage(p as number)}
                  className={`min-w-[32px] rounded px-2 py-1.5 text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page >= totalPages}
            className="rounded px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)] disabled:pointer-events-none disabled:opacity-30"
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
              {/* 공개/비공개 토글 */}
              <form action={toggleVisibilityAction} className="flex items-center gap-2">
                <input type="hidden" name="tournament_id" value={selected.id} />
                <input type="hidden" name="is_public" value={selected.isPublic ? "false" : "true"} />
                <button
                  type="submit"
                  onClick={() => setSelected((prev) => prev ? { ...prev, isPublic: !prev.isPublic } : null)}
                  className={`flex-1 rounded-[10px] px-4 py-2 text-sm font-semibold transition-colors ${
                    selected.isPublic
                      ? "border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-elevated)]"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
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
                    className="flex-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="" disabled>상태 변경</option>
                    {(TRANSITIONS[selected.status ?? "draft"] ?? []).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)]"
                  >
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
