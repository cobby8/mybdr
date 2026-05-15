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
}

export function AdminTournamentsContent({
  tournaments,
  updateStatusAction,
  toggleVisibilityAction: _toggleVisibilityAction,
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
                  {/* 대회 삭제 = 별 PR (cascade 정책 + 위험 가드 필요) */}
                  <button
                    type="button"
                    disabled
                    className="btn btn--sm opacity-50 cursor-not-allowed"
                    style={{ color: "var(--color-error)" }}
                    title="대회 삭제는 별 PR 에서 cascade 가드 + 이름 확인 dialog 와 함께 추가 예정"
                  >
                    대회 삭제
                  </button>
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  ※ 대회 삭제는 cascade 정책 검토 후 별 PR 에서 활성화 예정.
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
    </>
  );
}
