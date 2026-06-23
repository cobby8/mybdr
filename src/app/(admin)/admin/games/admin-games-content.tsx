"use client";

// 2026-06-22 v2.40 Phase A3-1a — 통합 콘솔 키트(console-kit) 통일.
//   변경: Toolbar(탭) + DataTable(행 요약 Drawer) 로 UI 교체.
//   유지(0변경): 데이터 패칭(page.tsx 서버 ?q= + 서버 페이지네이션)·server action
//     (updateGameStatusAction)·신청 현황 리스트(game_applications 실데이터·조회 전용)·
//     상태 전이(TRANSITIONS)·snake/직렬화 접근자.
//   설계 메모:
//     - 검색은 page.tsx AdminPageHeader 서버 ?q= 폼 담당 → Toolbar 는 탭만(검색칸 미노출).
//       useFilter 는 "클라 탭 필터" 전용(서버 페이징과 충돌 금지).
//     - 신청 현황 리스트는 Drawer body 에 기존 로직 그대로 이식(데이터/문구 0변경).
//
// (이전 이력) 2026-05-04: (web) 디자인 시스템 통일 / 2026-05-29 PR-2C-9(UD1 BG1) 신청 현황.

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
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

// 신청 1건 (game_applications 직렬화) — status: 0=대기 / 1=승인 / 2=거절 (2C-7 단일 진실)
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
  applications: GameApplication[];
  pendingCount: number;
}

// 신청 상태 라벨 (game_applications.status 0/1/2 단일 진실)
const APP_STATUS_LABEL: Record<number, string> = {
  0: "대기", 1: "승인", 2: "거절",
};
// 신청 상태별 톤 — 대기=warn / 승인=ok / 거절=danger (키트 Badge tone)
const APP_STATUS_TONE: Record<number, "primary" | "ok" | "warn" | "danger" | "grey"> = {
  0: "warn", 1: "ok", 2: "danger",
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

// v2.40 A3-1a — StatusBadge map (game status → 톤/라벨).
//   기존 admin-stat-pill 매핑을 키트 Badge tone 으로 변환(승인 규약):
//   1.모집중(ok)·2.확정(info→primary)·3.완료(mute→grey)·4.취소(err→danger).
const STATUS_META: Record<string, StatusMeta> = {
  "1": { tone: "ok", label: "모집중" },
  "2": { tone: "primary", label: "확정" },
  "3": { tone: "grey", label: "완료" },
  "4": { tone: "danger", label: "취소" },
};

const TYPE_LABEL: Record<number, string> = {
  0: "픽업", 1: "게스트", 2: "연습",
};

const TRANSITIONS: Record<number, number[]> = {
  1: [2, 4], 2: [3, 4], 3: [], 4: [],
};

const PAGE_SIZE_OPTIONS = [10, 20, 30];

// useFilter 검색 필드 — 검색은 서버 ?q= 담당이라 빈 배열(탭 필터만). 컴포넌트 밖 상수.
const FILTER_FIELDS: (keyof FilterRow)[] = [];

// useFilter 가 r.status(string) 로 탭 매칭하므로, 행에 문자열 status 부여한 형태로 변환.
//   원본 status 는 number 라 Omit 후 string 재정의 + FilterableRow(키트 제약) 교차.
type FilterRow = Omit<SerializedGame, "status"> & { status: string } & FilterableRow;

interface Props {
  games: SerializedGame[];
  updateStatusAction: (formData: FormData) => Promise<void>;
  pagination: Pagination;
}

export function AdminGamesContent({ games, updateStatusAction, pagination }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // useFilter 탭 매칭용 — status 를 문자열로 변환(렌더는 원본 number 데이터 그대로 사용).
  //   object literal 은 인덱스 시그니처를 추론받지 못하므로 FilterRow 로 단언.
  const rows = games.map((g) => ({ ...g, status: String(g.status) }) as FilterRow);

  // 클라 탭 필터(검색 X — 서버 ?q= 담당).
  const { tab, setTab, filtered } = useFilter<FilterRow>(rows, FILTER_FIELDS);

  const [selected, setSelected] = useState<SerializedGame | null>(null);

  const tabKeys = ["1", "2", "3", "4"];
  const tabs = [
    { id: "all", label: "전체", n: rows.length },
    ...tabKeys.map((k) => ({
      id: k,
      label: STATUS_LABEL[Number(k)],
      n: rows.filter((r) => r.status === k).length,
    })),
  ];

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";

  const fmtDateTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("ko-KR", {
          month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : "-";

  // 서버 페이징 네비게이션(기존 로직 그대로).
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

  // 현재 페이지 내 전체 대기(status=0) 신청 합계 (기존 totalPending 배너)
  const totalPending = games.reduce((s, g) => s + g.pendingCount, 0);

  // DataTable 컬럼 — 시안 au-screens AuGames 패턴(데이터/문구 유지).
  const columns: Column<FilterRow>[] = [
    {
      key: "title",
      label: "경기",
      render: (r) => (
        <PrimaryCell
          initials="🏀"
          title={r.title ?? "(제목 없음)"}
          meta={`${TYPE_LABEL[r.gameType] ?? r.gameType} · ${r.hostName ?? r.hostEmail ?? "-"}`}
        />
      ),
    },
    {
      key: "pending",
      label: "신청 대기",
      align: "center",
      width: "84px",
      render: (r) =>
        r.pendingCount > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold"
            style={{ background: "var(--primary-weak)", color: "var(--primary)" }}
          >
            <Icon name="user-plus" size={14} />
            {r.pendingCount}
          </span>
        ) : (
          <span style={{ color: "var(--ink-mute)" }}>—</span>
        ),
    },
    {
      key: "when",
      label: "예정일",
      width: "110px",
      hideSm: true,
      render: (r) => (
        <span style={{ color: "var(--ink-mute)" }}>{fmtDate(r.scheduledAt)}</span>
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
      {/* 신청 대기 알림 배너 (대기 건수 > 0 일 때만) */}
      {totalPending > 0 && (
        <div
          className="mb-3 flex items-center justify-between gap-3 rounded-md px-4 py-3"
          style={{ background: "var(--primary-weak)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <Icon name="bell-ring" size={24} color="var(--primary)" />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                신청 대기 {totalPending}건 — 호스트 승인 필요
              </p>
              <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
                현재 페이지 기준 / 행 클릭 시 경기별 신청 현황 확인
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 상태 탭 — 검색칸 미노출(서버 ?q= 가 헤더 폼에서 담당) */}
      <Toolbar tabs={tabs} active={tab} onTab={setTab} />

      {/* 페이지 크기 선택(기존 동작 보존) */}
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
              onClick={() => navigate({ pageSize: String(size), page: "1" })}
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
        // FilterRow(status:string) → 원본 SerializedGame(status:number) 으로 복원해 선택.
        onRowClick={(r) => setSelected(games.find((g) => g.id === r.id) ?? null)}
        pagination={{
          page,
          perPage: pageSize,
          total: totalCount,
          onChange: (p) => navigate({ page: String(p) }),
        }}
        emptyTitle="해당하는 경기가 없습니다."
      />

      {/* 행 요약 Drawer — 요약 DL + 상태 변경 액션 + 신청 현황 리스트(기존 이식) */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "(제목 없음)"}
        sub={selected ? TYPE_LABEL[selected.gameType] : ""}
        foot={
          selected ? (
            <div className="flex w-full items-center gap-2">
              <Link
                href={`/admin/games/${selected.id}`}
                className="btn btn--sm flex-1 justify-center"
              >
                상세 페이지 열기
              </Link>
              {(TRANSITIONS[selected.status] ?? []).length > 0 && (
                <form
                  action={updateStatusAction}
                  className="flex items-center gap-2"
                  style={{ flex: 1.5 }}
                  onSubmit={() => setSelected(null)}
                >
                  <input type="hidden" name="game_id" value={selected.id} />
                  <select
                    name="status"
                    defaultValue=""
                    className="ts-select"
                    style={{ flex: 1 }}
                  >
                    <option value="" disabled>상태 변경</option>
                    {(TRANSITIONS[selected.status] ?? []).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s] ?? String(s)}</option>
                    ))}
                  </select>
                  <Btn type="submit" size="sm" variant="primary">적용</Btn>
                </form>
              )}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div style={{ marginBottom: 18 }}>
              <StatusBadge map={STATUS_META} value={String(selected.status)} />
            </div>
            <DL
              rows={[
                ["주최자", selected.hostName ?? selected.hostEmail ?? "-"],
                ["유형", TYPE_LABEL[selected.gameType] ?? String(selected.gameType)],
                ["장소", selected.venueName ?? selected.city ?? "-"],
                ["참가자", `${selected.currentParticipants ?? 0} / ${selected.maxParticipants ?? "-"}`],
                ["예정일", fmtDate(selected.scheduledAt)],
                ["생성일", fmtDate(selected.createdAt)],
              ]}
            />

            {/* 신청 현황: game_applications status 0/1/2 실데이터 (조회 전용·기존 로직 이식) */}
            <div className="mt-4">
              <p
                className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest pr-1"
                style={{ color: "var(--ink-mute)" }}
              >
                신청 현황
                {selected.pendingCount > 0 && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal"
                    style={{ background: "var(--primary-weak)", color: "var(--primary)" }}
                  >
                    대기 {selected.pendingCount}
                  </span>
                )}
              </p>
              {selected.applications.length === 0 ? (
                <div
                  className="rounded-md border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)", color: "var(--ink-mute)" }}
                >
                  신청 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--border)" }}>
                  {selected.applications.map((a, i) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 px-4 py-2"
                      style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                    >
                      <Icon name={a.isGuest ? "user-plus" : "user"} size={18} color="var(--ink-mute)" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                          {a.applicantName}
                          {a.isGuest && (
                            <span className="ml-1.5 text-[10px] font-normal" style={{ color: "var(--ink-mute)" }}>
                              게스트
                            </span>
                          )}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--ink-mute)" }}>
                          신청 {fmtDateTime(a.createdAt)}
                          {a.status === 1 && a.approvedAt && ` · 승인 ${fmtDateTime(a.approvedAt)}`}
                          {a.status === 2 && a.rejectedAt && ` · 거절 ${fmtDateTime(a.rejectedAt)}`}
                        </p>
                      </div>
                      {/* status 0/1/2 라벨 (단일 진실) */}
                      <span className="shrink-0">
                        <StatusBadge
                          map={{
                            "0": { tone: APP_STATUS_TONE[0], label: APP_STATUS_LABEL[0] },
                            "1": { tone: APP_STATUS_TONE[1], label: APP_STATUS_LABEL[1] },
                            "2": { tone: APP_STATUS_TONE[2], label: APP_STATUS_LABEL[2] },
                          }}
                          value={String(a.status)}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* 승인/거절은 호스트 권한 — admin 화면은 조회 전용 */}
              <p className="mt-1.5 text-[11px]" style={{ color: "var(--ink-mute)" }}>
                신청 승인·거절은 경기 호스트가 처리합니다 (조회 전용).
              </p>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
