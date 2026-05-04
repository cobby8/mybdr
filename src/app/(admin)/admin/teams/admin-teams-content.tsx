"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper 제거 → 직접 .admin-table-wrap (community/news 패턴 일치)
// - <Badge> → .badge--soft + 상태별 inline color
// - thead/tr 자체 className 제거 (admin-table CSS 자동)

import { useState } from "react";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 팀 타입
interface SerializedTeam {
  id: string;
  name: string;
  city: string | null;
  membersCount: number;
  wins: number;
  losses: number;
  draws: number;
  status: string;
  createdAt: string;
  captainName: string | null;
  captainEmail: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  active: "활동중",
  inactive: "비활성",
};

// 상태별 .badge--soft inline color (success / error 톤)
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  active: {
    background: "color-mix(in srgb, var(--color-success) 12%, transparent)",
    color: "var(--color-success)",
    borderColor: "transparent",
  },
  inactive: {
    background: "color-mix(in srgb, var(--color-error) 12%, transparent)",
    color: "var(--color-error)",
    borderColor: "transparent",
  },
};

interface Props {
  teams: SerializedTeam[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminTeamsContent({ teams, updateStatusAction }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedTeam | null>(null);

  const filtered =
    activeTab === "all"
      ? teams
      : teams.filter((t) => t.status === activeTab);

  const tabs = [
    { key: "all", label: "전체", count: teams.length },
    { key: "active", label: "활성", count: teams.filter((t) => t.status === "active").length },
    { key: "inactive", label: "비활성", count: teams.filter((t) => t.status === "inactive").length },
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 팀명 / 도시 / 상태 (3칸) */}
      <div className="overflow-x-auto admin-table-wrap">
        {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B], 2026-05-02) */}
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 font-medium">팀명</th>
              <th className="w-[100px] px-5 py-4 font-medium">도시</th>
              <th className="w-[90px] px-5 py-4 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer">
                <td data-primary="true" className="px-5 py-3">
                  <p className="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {t.membersCount}명
                  </p>
                </td>
                <td data-label="도시" className="px-5 py-3" style={{ color: "var(--color-text-muted)" }}>
                  {t.city ?? "-"}
                </td>
                <td data-label="상태" className="px-5 py-3">
                  <span className="badge badge--soft" style={STATUS_STYLE[t.status]}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
          해당하는 팀이 없습니다.
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          actions={
            <form
              action={updateStatusAction}
              className="flex items-center gap-2"
              onSubmit={() => setSelected(null)}
            >
              <input type="hidden" name="team_id" value={selected.id} />
              <input
                type="hidden"
                name="status"
                value={selected.status === "active" ? "inactive" : "active"}
              />
              {/* (web) .btn 패턴 — 활성화는 success 톤 inline color */}
              <button
                type="submit"
                className={`btn btn--sm ${selected.status !== "active" ? "btn--primary" : ""}`}
                style={
                  selected.status !== "active"
                    ? { background: "var(--color-success)", borderColor: "var(--color-success)", color: "#fff" }
                    : undefined
                }
              >
                {selected.status === "active" ? "비활성화" : "활성화"}
              </button>
            </form>
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="팀 정보"
              rows={[
                ["팀장", selected.captainName ?? selected.captainEmail ?? "-"],
                ["도시", selected.city ?? "-"],
                ["멤버수", `${selected.membersCount}명`],
              ]}
            />
            <ModalInfoSection
              title="전적"
              rows={[
                ["승", `${selected.wins}W`],
                ["패", `${selected.losses}L`],
                ["무", `${selected.draws}D`],
              ]}
            />
            <ModalInfoSection
              title="기타"
              rows={[["생성일", fmtDate(selected.createdAt)]]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
