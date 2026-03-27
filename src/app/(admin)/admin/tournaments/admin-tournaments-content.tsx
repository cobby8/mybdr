"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 토너먼트 타입
interface SerializedTournament {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  teamCount: number;
  matchCount: number;
  organizerName: string | null;
  organizerEmail: string | null;
}

// 상태/형식 라벨은 서버에서 전달받으므로 클라이언트에서도 동일하게 매핑
const STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  open: "접수중",
  in_progress: "진행중",
  completed: "종료",
};

const STATUS_BADGE: Record<string, "default" | "success" | "info" | "warning" | "secondary"> = {
  draft: "default",
  open: "success",
  in_progress: "info",
  completed: "secondary",
};

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미네이션",
  double_elimination: "더블 엘리미네이션",
  round_robin: "라운드 로빈",
  swiss: "스위스",
};

// 상태 전환 규칙
const TRANSITIONS: Record<string, string[]> = {
  draft: ["open"],
  open: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};

interface Props {
  tournaments: SerializedTournament[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminTournamentsContent({
  tournaments,
  updateStatusAction,
}: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedTournament | null>(null);

  // 탭별 필터링 — 서버 전체 데이터를 클라이언트에서 filter
  const filtered =
    activeTab === "all"
      ? tournaments
      : tournaments.filter((t) => (t.status ?? "draft") === activeTab);

  // 탭 목록 + 각 상태별 개수 계산
  const tabs = [
    { key: "all", label: "전체", count: tournaments.length },
    { key: "draft", label: "준비중", count: tournaments.filter((t) => (t.status ?? "draft") === "draft").length },
    { key: "open", label: "접수중", count: tournaments.filter((t) => t.status === "open").length },
    { key: "in_progress", label: "진행중", count: tournaments.filter((t) => t.status === "in_progress").length },
    { key: "completed", label: "종료", count: tournaments.filter((t) => t.status === "completed").length },
  ];

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";

  return (
    <>
      {/* 상태별 탭 */}
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 대회명 / 상태 / 날짜 (3칸) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">대회명</th>
                <th className="w-[100px] px-5 py-4 font-medium">상태</th>
                <th className="w-[100px] px-5 py-4 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const status = t.status ?? "draft";
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-elevated)]"
                  >
                    {/* 대회명 + 주최자 미리보기 */}
                    <td className="px-5 py-3">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">
                        {t.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t.organizerName ?? t.organizerEmail ?? "-"}
                      </p>
                    </td>
                    {/* 상태 뱃지 */}
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_BADGE[status] ?? "default"}>
                        {STATUS_LABEL[status] ?? status}
                      </Badge>
                    </td>
                    {/* 생성일 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
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

      {/* 상세 모달 — 행 클릭 시 표시 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          actions={
            // 상태 변경 폼 (전환 가능한 상태가 있을 때만)
            (TRANSITIONS[selected.status ?? "draft"] ?? []).length > 0 ? (
              <form action={updateStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="tournament_id" value={selected.id} />
                <select
                  name="status"
                  defaultValue=""
                  className="flex-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="" disabled>상태 변경</option>
                  {(TRANSITIONS[selected.status ?? "draft"] ?? []).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s] ?? s}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
                >
                  적용
                </button>
              </form>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="대회 정보"
              rows={[
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
