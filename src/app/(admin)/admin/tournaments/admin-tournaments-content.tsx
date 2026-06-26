"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Badge,
  Btn,
  DataTable,
  Icon,
  type Column,
} from "@/components/admin-toss";

export interface SerializedTournament {
  id: string;
  name: string;
  format: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  isPublic: boolean;
  teamCount: number;
  matchCount: number;
  organizerName: string | null;
  organizerEmail: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

interface Props {
  tournaments: SerializedTournament[];
  pagination: Pagination;
}

const STATUS_TAB = [
  { key: "all", label: "전체" },
  { key: "draft", label: "준비중" },
  { key: "registration", label: "접수중" },
  { key: "in_progress", label: "진행중" },
  { key: "completed", label: "종료" },
];

const STATUS_BADGE: Record<
  string,
  { label: string; tone: "primary" | "ok" | "warn" | "danger" | "grey" }
> = {
  draft: { label: "준비중", tone: "grey" },
  registration: { label: "접수중", tone: "primary" },
  in_progress: { label: "진행중", tone: "ok" },
  completed: { label: "종료", tone: "grey" },
};

const FORMAT_LABEL: Record<string, string> = {
  tournament: "토너먼트",
  league: "리그",
  group_stage_knockout: "조별리그+본선",
  dual_tournament: "듀얼토너먼트",
};

const PAGE_SIZE_OPTIONS = [10, 20, 30];

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}

function formatPeriod(row: SerializedTournament) {
  if (!row.startDate && !row.endDate) return "-";
  if (row.startDate === row.endDate || !row.endDate) return formatDate(row.startDate);
  return `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`;
}

export function AdminTournamentsContent({ tournaments, pagination }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    if (tab === "all") return tournaments;
    return tournaments.filter((t) => t.status === tab);
  }, [tab, tournaments]);

  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const openWorkspace = (id: string) => {
    router.push(`/tournament-admin/tournaments/${id}`);
  };

  const columns: Column<SerializedTournament>[] = [
    {
      key: "name",
      label: "대회",
      width: "minmax(280px, 1.5fr)",
      render: (row) => (
        <div className="adm-tournament-cell">
          <span className="adm-tournament-cell__icon">
            <Icon name="trophy" size={18} />
          </span>
          <span className="adm-tournament-cell__body">
            <strong>{row.name}</strong>
            <small>{row.organizerName ?? row.organizerEmail ?? "운영자 미지정"}</small>
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "상태",
      width: 110,
      align: "center",
      render: (row) => {
        const meta = STATUS_BADGE[row.status] ?? STATUS_BADGE.draft;
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "isPublic",
      label: "공개",
      width: 90,
      align: "center",
      render: (row) => (
        <Badge tone={row.isPublic ? "ok" : "grey"}>
          {row.isPublic ? "공개" : "비공개"}
        </Badge>
      ),
    },
    {
      key: "teamCount",
      label: "팀",
      width: 80,
      align: "right",
      render: (row) => <span className="adm-mono">{row.teamCount}팀</span>,
    },
    {
      key: "matchCount",
      label: "경기",
      width: 86,
      align: "right",
      render: (row) => <span className="adm-mono">{row.matchCount}경기</span>,
    },
    {
      key: "format",
      label: "형식",
      width: 150,
      hideSm: true,
      render: (row) => (
        <span>{row.format ? FORMAT_LABEL[row.format] ?? row.format : "-"}</span>
      ),
    },
    {
      key: "startDate",
      label: "일정",
      width: 190,
      hideSm: true,
      render: (row) => <span>{formatPeriod(row)}</span>,
    },
    {
      key: "id",
      label: "",
      width: 130,
      align: "right",
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Btn
            variant="secondary"
            size="sm"
            iconRight="arrow-right"
            onClick={() => openWorkspace(row.id)}
          >
            운영
          </Btn>
        </span>
      ),
    },
  ];

  return (
    <div className="adm-list-stack">
      <div className="adm-status-tabs" role="tablist" aria-label="대회 상태">
        {STATUS_TAB.map((item) => {
          const count =
            item.key === "all"
              ? tournaments.length
              : tournaments.filter((t) => t.status === item.key).length;
          return (
            <button
              key={item.key}
              type="button"
              className="adm-status-tabs__item"
              data-active={tab === item.key ? "true" : "false"}
              onClick={() => setTab(item.key)}
            >
              <span>{item.label}</span>
              <span className="adm-status-tabs__count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="adm-list-meta">
        <span>
          {pagination.totalCount > 0
            ? `${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                pagination.page * pagination.pageSize,
                pagination.totalCount,
              )} / ${pagination.totalCount}개`
            : "0개"}
        </span>
        <div className="adm-page-size" aria-label="페이지 크기">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Btn
              key={size}
              variant={pagination.pageSize === size ? "primary" : "ghost"}
              size="sm"
              onClick={() => navigate({ pageSize: String(size), page: "1" })}
            >
              {size}개
            </Btn>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        keyField="id"
        onRowClick={(row) => openWorkspace(row.id)}
        pagination={{
          page: pagination.page,
          perPage: pagination.pageSize,
          total: pagination.totalCount,
          onChange: (page) => navigate({ page: String(page) }),
        }}
        emptyTitle="조건에 맞는 대회가 없습니다."
        emptyDesc="검색어 또는 상태 필터를 다시 확인하세요."
      />
    </div>
  );
}
