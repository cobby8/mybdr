"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper 제거 / <Badge> → .badge--soft + 상태별 inline color
// - 페이지 크기 / 페이지네이션 자체 rounded → .btn .btn--sm (활성 .btn--primary)

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";
// Phase 1 (Toss 전환) — Material Symbols → lucide(<Icon>)
import { Icon } from "@/components/admin-toss";

// 2026-05-29 PR-2C-9 (UD1 BG1) — 신청 1건 (game_applications 직렬화)
// status: 0=대기 / 1=승인 / 2=거절 (game_applications.status 단일 진실, 2C-7 확정)
interface GameApplication {
  id: string;
  status: number;
  isGuest: boolean;
  applicantName: string;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
}

interface SerializedGame {
  id: string;
  title: string | null;
  gameType: number;
  venueName: string | null;
  city: string | null;
  scheduledAt: string;
  currentParticipants: number | null;
  maxParticipants: number | null;
  status: number;
  createdAt: string;
  hostName: string | null;
  hostEmail: string;
  // BG1 — 신청 현황 (실데이터, mock 없음)
  applications: GameApplication[];
  pendingCount: number;
}

// BG1 — 신청 상태 라벨 (game_applications.status 0/1/2 단일 진실 그대로)
const APP_STATUS_LABEL: Record<number, string> = {
  0: "대기", 1: "승인", 2: "거절",
};
// 신청 상태별 톤 — 대기=warn / 승인=ok / 거절=err (admin-stat-pill data-tone)
const APP_STATUS_TONE: Record<number, "mute" | "info" | "ok" | "warn" | "err" | "accent"> = {
  0: "warn", 1: "ok", 2: "err",
};

interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const STATUS_LABEL: Record<number, string> = {
  1: "모집중", 2: "확정", 3: "완료", 4: "취소",
};

// 2026-05-15 Admin-4-B 박제 — STATUS_STYLE inline 색 → admin-stat-pill data-tone 매핑.
// 1.모집중=ok / 2.확정=info / 3.완료=mute / 4.취소=err (시안 AdminGames.jsx v2.9 status_tone 박제 패턴)
const STATUS_TONE: Record<number, "mute" | "info" | "ok" | "warn" | "err" | "accent"> = {
  1: "ok",
  2: "info",
  3: "mute",
  4: "err",
};

const TYPE_LABEL: Record<number, string> = {
  0: "픽업", 1: "게스트", 2: "연습",
};

const TRANSITIONS: Record<number, number[]> = {
  1: [2, 4], 2: [3, 4], 3: [], 4: [],
};

const PAGE_SIZE_OPTIONS = [10, 20, 30];

interface Props {
  games: SerializedGame[];
  updateStatusAction: (formData: FormData) => Promise<void>;
  pagination: Pagination;
}

export function AdminGamesContent({ games, updateStatusAction, pagination }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedGame | null>(null);

  const filtered =
    activeTab === "all"
      ? games
      : games.filter((g) => g.status === Number(activeTab));

  const tabs = [
    { key: "all", label: "전체", count: games.length },
    { key: "1", label: "모집중", count: games.filter((g) => g.status === 1).length },
    { key: "2", label: "확정", count: games.filter((g) => g.status === 2).length },
    { key: "3", label: "완료", count: games.filter((g) => g.status === 3).length },
    { key: "4", label: "취소", count: games.filter((g) => g.status === 4).length },
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

  const { page, pageSize, totalPages, totalCount } = pagination;
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  // BG1 — 현재 페이지 내 전체 대기(status=0) 신청 합계 (시안 totalPending)
  const totalPending = games.reduce((s, g) => s + g.pendingCount, 0);

  const fmtDateTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("ko-KR", {
          month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : "-";

  return (
    <>
      {/* BG1 — 신청 대기 알림 배너 (대기 건수 > 0 일 때만, 시안 atm-notify-bar 박제) */}
      {totalPending > 0 && (
        <div
          className="mb-3 flex items-center justify-between gap-3 rounded-md px-4 py-3"
          style={{
            background: "var(--color-primary-soft, var(--color-elevated))",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <Icon name="bell-ring" size={24} color="var(--color-primary)" />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                신청 대기 {totalPending}건 — 호스트 승인 필요
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                현재 페이지 기준 / 행 클릭 시 경기별 신청 현황 확인
              </p>
            </div>
          </div>
        </div>
      )}

      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 페이지 크기 선택 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {totalCount > 0 ? `${rangeStart}–${rangeEnd} / ${totalCount}개` : "0개"}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>페이지당</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => navigate({ pageSize: String(size), page: "1" })}
              className={`btn btn--sm ${pageSize === size ? "btn--primary" : ""}`}
            >
              {size}개
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto admin-table-wrap">
        {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 font-medium">제목</th>
              <th className="w-[60px] px-3 py-4 font-medium">유형</th>
              <th className="w-[80px] px-3 py-4 font-medium">상태</th>
              {/* BG1 — 신청 대기 컬럼 신규 */}
              <th className="w-[80px] px-3 py-4 font-medium">신청 대기</th>
              <th className="w-[95px] px-4 py-4 font-medium">예정일 ↓</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} onClick={() => setSelected(g)} className="cursor-pointer">
                <td data-primary="true" className="px-5 py-3">
                  <p className="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {g.title ?? "(제목 없음)"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {g.hostName ?? g.hostEmail ?? "-"}
                  </p>
                </td>
                <td data-label="유형" className="px-3 py-3" style={{ color: "var(--color-text-muted)" }}>
                  {TYPE_LABEL[g.gameType] ?? g.gameType}
                </td>
                <td data-label="상태" className="px-3 py-3">
                  {/* Admin-4-B 박제 — admin-stat-pill[data-tone] (admin.css) */}
                  <span className="admin-stat-pill" data-tone={STATUS_TONE[g.status] ?? "mute"}>
                    {STATUS_LABEL[g.status] ?? "알 수 없음"}
                  </span>
                </td>
                {/* BG1 — 신청 대기 건수 (실데이터, 0건이면 — 표시 / mock 없음) */}
                <td data-label="신청 대기" className="px-3 py-3">
                  {g.pendingCount > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold"
                      style={{
                        background: "var(--color-primary-soft, var(--color-elevated))",
                        color: "var(--color-primary)",
                      }}
                    >
                      <Icon name="user-plus" size={14} />
                      {g.pendingCount}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-text-muted)" }}>—</span>
                  )}
                </td>
                {/* whitespace-nowrap으로 날짜 줄바꿈 방지 */}
                <td data-label="예정일" className="whitespace-nowrap px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                  {fmtDate(g.scheduledAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
          해당하는 경기가 없습니다.
        </div>
      )}

      {/* 페이지네이션 — (web) .btn 패턴 적용 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button
            onClick={() => navigate({ page: String(page - 1) })}
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
                <span key={`e-${idx}`} className="px-2 text-sm" style={{ color: "var(--color-text-muted)" }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => navigate({ page: String(p) })}
                  className={`btn btn--sm min-w-[32px] ${page === p ? "btn--primary" : ""}`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => navigate({ page: String(page + 1) })}
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
          title={selected.title ?? "(제목 없음)"}
          actions={
            (TRANSITIONS[selected.status] ?? []).length > 0 ? (
              <form
                action={updateStatusAction}
                className="flex items-center gap-2"
                onSubmit={() => setSelected(null)}
              >
                <input type="hidden" name="game_id" value={selected.id} />
                <select
                  name="status"
                  defaultValue=""
                  className="flex-1 rounded-[10px] border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)" }}
                >
                  <option value="" disabled>상태 변경</option>
                  {(TRANSITIONS[selected.status] ?? []).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s] ?? String(s)}</option>
                  ))}
                </select>
                {/* (web) .btn .btn--primary 패턴 */}
                <button type="submit" className="btn btn--primary btn--sm">
                  적용
                </button>
              </form>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="경기 정보"
              rows={[
                ["주최자", selected.hostName ?? selected.hostEmail ?? "-"],
                ["유형", TYPE_LABEL[selected.gameType] ?? String(selected.gameType)],
                ["장소", selected.venueName ?? selected.city ?? "-"],
                ["참가자", `${selected.currentParticipants ?? 0} / ${selected.maxParticipants ?? "-"}`],
              ]}
            />
            <ModalInfoSection
              title="일정"
              rows={[
                ["예정일", fmtDate(selected.scheduledAt)],
                ["생성일", fmtDate(selected.createdAt)],
              ]}
            />

            {/* BG1 — 신청 현황: game_applications status 0/1/2 실데이터 (조회 전용) */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest pr-1" style={{ color: "var(--color-text-muted)" }}>
                신청 현황
                {selected.pendingCount > 0 && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal"
                    style={{
                      background: "var(--color-primary-soft, var(--color-elevated))",
                      color: "var(--color-primary)",
                    }}
                  >
                    대기 {selected.pendingCount}
                  </span>
                )}
              </p>
              {selected.applications.length === 0 ? (
                // 신청 0건 — mock 없이 빈 상태 그대로 표시
                <div
                  className="rounded-md border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                >
                  신청 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--color-border)" }}>
                  {selected.applications.map((a, i) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 px-4 py-2"
                      style={i > 0 ? { borderTop: "1px solid var(--color-border-subtle)" } : undefined}
                    >
                      <Icon name={a.isGuest ? "user-plus" : "user"} size={18} color="var(--color-text-muted)" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {a.applicantName}
                          {a.isGuest && (
                            <span className="ml-1.5 text-[10px] font-normal" style={{ color: "var(--color-text-muted)" }}>
                              게스트
                            </span>
                          )}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                          신청 {fmtDateTime(a.createdAt)}
                          {a.status === 1 && a.approvedAt && ` · 승인 ${fmtDateTime(a.approvedAt)}`}
                          {a.status === 2 && a.rejectedAt && ` · 거절 ${fmtDateTime(a.rejectedAt)}`}
                        </p>
                      </div>
                      {/* status 0/1/2 라벨 (단일 진실) */}
                      <span className="admin-stat-pill shrink-0" data-tone={APP_STATUS_TONE[a.status] ?? "mute"}>
                        {APP_STATUS_LABEL[a.status] ?? "알 수 없음"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* 승인/거절은 호스트 권한 (PATCH /api/web/games/[id]/applications/[appId]) — admin 화면은 조회 전용 */}
              <p className="mt-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                신청 승인·거절은 경기 호스트가 처리합니다 (조회 전용).
              </p>
            </div>
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
