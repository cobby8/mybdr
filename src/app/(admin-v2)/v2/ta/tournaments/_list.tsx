"use client";

// ============================================================
// ta/tournaments/_list.tsx — 대회 목록 (클라). 정본 ta-pages TournamentList 1:1.
//   검색 + 상태 필터칩 + DataTable(정본 컬럼/render). 데이터는 서버 props.
//   행 클릭/운영/사이트 = 운영 워크스페이스(R4)·공개 사이트 미배선 → 준비 중 토스트.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  PageHead,
  DataTable,
  Badge,
  Btn,
  Icon,
  useAdminShell,
  type DataCol,
  type DataRow,
  type BadgeTone,
} from "@/components/admin-v2";

export type TaTournamentRow = {
  id: string;
  name: string;
  sub: string;
  venue: string;
  region: string;
  date: string;
  teams: number;
  status: string;
  statusTone: BadgeTone;
};

// 정본 상태 필터(라벨 = 표시 status 와 동일 문자열로 매칭)
const STATUS_FILTERS: [string, string][] = [
  ["all", "전체"],
  ["진행중", "진행중"],
  ["접수중", "접수중"],
  ["준비중", "준비중"],
  ["종료", "종료"],
];

// 정본 컬럼
const COLS: DataCol[] = [
  { key: "name", label: "대회명", w: "minmax(0,2.2fr)" },
  { key: "venue", label: "장소", w: "minmax(0,1.4fr)" },
  { key: "date", label: "개최일", w: "minmax(0,1fr)" },
  { key: "teams", label: "참가팀", w: "84px", align: "center" },
  { key: "status", label: "상태", w: "92px", align: "center" },
  { key: "act", label: "", w: "92px", align: "right" },
];

export function TournamentList({ rows }: { rows: TaTournamentRow[] }) {
  const { toast } = useAdminShell();
  const router = useRouter();
  // 행 클릭/운영 버튼 → 대회별 운영 워크스페이스(R4). ta 콘솔 셸 밖 라우트라 셸 중첩 0.
  const goOperate = (id: string) => router.push(`/v2/operate/${id}`);
  const [q, setQ] = React.useState("");
  const [f, setF] = React.useState("all");

  const filtered = rows.filter(
    (t) =>
      (f === "all" || t.status === f) &&
      (!q ||
        t.name.includes(q) ||
        t.venue.includes(q) ||
        t.sub.includes(q))
  );

  return (
    <div>
      <PageHead
        eyebrow="대회 관리자"
        title="대회 목록"
        sub="등록된 모든 대회를 관리합니다. 행을 눌러 운영 워크스페이스로 이동합니다."
        actions={
          <>
            <Btn
              variant="secondary"
              icon="download"
              size="sm"
              onClick={() => toast("대회 목록 내보내기는 준비 중입니다")}
            >
              내보내기
            </Btn>
            <Btn icon="plus" onClick={() => router.push("/v2/ta/tournaments/new")}>
              새 대회 만들기
            </Btn>
          </>
        }
      />
      <div className="ad-toolbar">
        <div className="ad-search">
          <Icon name="search" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="대회명 · 장소 · 단체 검색"
          />
        </div>
        <div className="ad-filters">
          {STATUS_FILTERS.map(([id, l]) => (
            <button
              key={id}
              className="ts-chip"
              data-active={f === id ? "true" : "false"}
              onClick={() => setF(id)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        cols={COLS}
        rows={filtered as unknown as DataRow[]}
        empty="조건에 맞는 대회가 없습니다"
        onRow={(row) => goOperate((row as unknown as TaTournamentRow).id)}
        render={(row, k) => {
          const r = row as unknown as TaTournamentRow;
          if (k === "name")
            return (
              <div>
                <div className="ad-cell-strong">{r.name}</div>
                <div className="ad-cell-sub">{r.sub}</div>
              </div>
            );
          if (k === "venue")
            return (
              <div>
                <div className="ad-cell-strong" style={{ fontWeight: 600 }}>
                  {r.venue}
                </div>
                <div className="ad-cell-sub">{r.region}</div>
              </div>
            );
          if (k === "date") return <span className="ad-cell-mono">{r.date}</span>;
          if (k === "teams")
            return (
              <span
                className="ad-cell-strong"
                style={{ fontFamily: "var(--ff-mono)" }}
              >
                {r.teams}
                <span style={{ color: "var(--ink-dim)", fontWeight: 600 }}>팀</span>
              </span>
            );
          if (k === "status")
            return <Badge tone={r.statusTone}>{r.status}</Badge>;
          if (k === "act")
            return (
              <span className="ad-rowact">
                <button
                  className="ad-iconbtn"
                  title="운영"
                  onClick={(e) => {
                    e.stopPropagation();
                    goOperate(r.id);
                  }}
                >
                  <Icon name="settings-2" size={16} />
                </button>
                <button
                  className="ad-iconbtn"
                  title="사이트"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast("공개 사이트 연결은 준비 중입니다");
                  }}
                >
                  <Icon name="external-link" size={16} />
                </button>
              </span>
            );
          return null;
        }}
      />
    </div>
  );
}
