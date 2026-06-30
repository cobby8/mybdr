"use client";

// ============================================================
// _console.tsx — 컷오버 ② 매칭 콘솔(목록) 클라.
//   매칭 = 픽업/게스트/연습 경기(레거시 /admin/games 의 v2 포팅).
//   구성: KpiGrid(통계 띠) + status 탭(bo-constabs) + 검색폼(서버 ?q) +
//         DataTable + 페이지네이션 + 행클릭 요약 Modal(상태변경 + 신청현황 읽기전용).
//   ⚠ 백엔드 0변경 — 리스트 데이터는 서버 props 주입(추가 fetch 0).
//     상태변경만 기존 server action(updateGameStatusAction) 호출(신규 API 0).
//   설계 메모(레거시 1:1):
//     - 검색(?q)·페이징은 서버 담당 → URL 네비게이션으로 위임.
//     - status 탭은 "현재 페이지" 클라 필터(레거시 useFilter 동작과 동일).
//       전체 분포는 KpiGrid(서버 groupBy 실측)가 별도로 보여줌.
// ============================================================

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PageHead,
  KpiGrid,
  DataTable,
  Modal,
  Badge,
  Btn,
  Icon,
  useAdminShell,
  type DataCol,
  type DataRow,
  type BadgeTone,
} from "@/components/admin-v2";

// ── 직렬화 타입(page.tsx 서버 매핑과 1:1) ──
export interface GameApplication {
  id: string;
  status: number; // 0=대기 / 1=승인 / 2=거절
  isGuest: boolean;
  applicantName: string;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
}

export interface SerializedGame {
  id: string;
  title: string | null;
  gameType: number; // 0=픽업 / 1=게스트 / 2=연습
  venueName: string | null;
  city: string | null;
  scheduledAt: string;
  currentParticipants: number | null;
  maxParticipants: number | null;
  status: number; // 1=모집중 / 2=확정 / 3=완료 / 4=취소
  createdAt: string;
  hostName: string | null;
  hostEmail: string;
  applications: GameApplication[];
  pendingCount: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

// ── 라벨/톤 매핑(레거시 동일) ──
const STATUS_LABEL: Record<number, string> = { 1: "모집중", 2: "확정", 3: "완료", 4: "취소" };
const STATUS_TONE: Record<number, BadgeTone> = { 1: "ok", 2: "primary", 3: "grey", 4: "danger" };
const TYPE_LABEL: Record<number, string> = { 0: "픽업", 1: "게스트", 2: "연습" };

// 신청 상태(game_applications.status 0/1/2 단일 진실)
const APP_STATUS_LABEL: Record<number, string> = { 0: "대기", 1: "승인", 2: "거절" };
const APP_STATUS_TONE: Record<number, BadgeTone> = { 0: "warn", 1: "ok", 2: "danger" };

// 상태 전이(레거시 admin-games TRANSITIONS 동일): 1모집→{2확정,4취소} / 2확정→{3완료,4취소}
const TRANSITIONS: Record<number, number[]> = { 1: [2, 4], 2: [3, 4], 3: [], 4: [] };

// 상태 탭(전체 + 1~4)
const TAB_KEYS = [1, 2, 3, 4];
const PAGE_SIZE_OPTIONS = [10, 20, 30];

// ── 표 컬럼(admin-v2 DataTable) ──
const COLS: DataCol[] = [
  { key: "title", label: "경기", w: "minmax(0,1.8fr)" },
  { key: "pending", label: "신청 대기", w: "92px", align: "center" },
  { key: "when", label: "예정일", w: "120px", align: "center" },
  { key: "status", label: "상태", w: "96px", align: "center" },
];

// 날짜 포맷(클라) — 레거시 동일 ko-KR 표기
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";
const fmtDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("ko-KR", {
        month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "-";

export function MatchConsole({
  games,
  updateStatusAction,
  pagination,
  statusCounts,
  q,
}: {
  games: SerializedGame[];
  updateStatusAction: (formData: FormData) => Promise<void>;
  pagination: Pagination;
  statusCounts: Record<number, number>;
  q: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useAdminShell();

  // 검색 입력(서버 ?q 폼) — 제출 시 URL 네비게이션
  const [search, setSearch] = React.useState(q);
  // 상태 탭(현재 페이지 클라 필터·레거시 동작)
  const [tab, setTab] = React.useState<"all" | number>("all");
  // 행 클릭 요약 Modal 선택 행
  const [selected, setSelected] = React.useState<SerializedGame | null>(null);
  // 상태 변경 select 값 + 전송 상태
  const [nextStatus, setNextStatus] = React.useState<string>("");
  const [pending, startTransition] = React.useTransition();

  const { page, pageSize, totalPages, totalCount } = pagination;

  // URL 쿼리 갱신(검색/페이지/페이지크기) — 서버 재조회 트리거
  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // KpiGrid 통계 띠 — 서버 groupBy 실측(전체 기준 분포)
  const kpis = [
    { label: "전체", value: totalCount, icon: "swords", tone: "primary" },
    { label: "모집중", value: statusCounts[1] ?? 0, icon: "loader", tone: "violet" },
    { label: "확정", value: statusCounts[2] ?? 0, icon: "circle-check", tone: "ok" },
    { label: "완료", value: statusCounts[3] ?? 0, icon: "flag", tone: "warn" },
    { label: "취소", value: statusCounts[4] ?? 0, icon: "circle-x", tone: "danger" },
  ];

  // 상태 탭 라벨/카운트 — 현재 페이지(games) 기준(레거시 동일)
  const tabs = [
    { id: "all" as const, label: "전체", n: games.length },
    ...TAB_KEYS.map((k) => ({
      id: k,
      label: STATUS_LABEL[k],
      n: games.filter((g) => g.status === k).length,
    })),
  ];

  // 현재 탭 필터 적용된 행
  const filtered = tab === "all" ? games : games.filter((g) => g.status === tab);

  // 현재 페이지 대기 신청 합계(배너)
  const totalPending = games.reduce((s, g) => s + g.pendingCount, 0);

  const rangeStart = totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  // 행 클릭 → 요약 Modal 오픈(상태변경 select 초기화)
  const openRow = (row: DataRow) => {
    const g = games.find((x) => x.id === row.id) ?? null;
    setSelected(g);
    setNextStatus("");
  };

  // 상태 변경 실행 — 기존 server action 호출(백엔드 0변경)
  const applyStatus = () => {
    if (!selected || !nextStatus) return;
    const fd = new FormData();
    fd.set("game_id", selected.id);
    fd.set("status", nextStatus);
    startTransition(async () => {
      try {
        await updateStatusAction(fd);
        toast(`상태를 ${STATUS_LABEL[Number(nextStatus)]}(으)로 변경했습니다`);
        setSelected(null);
        router.refresh();
      } catch {
        toast("상태 변경에 실패했습니다");
      }
    });
  };

  // 표 셀 렌더 — DataRow 를 SerializedGame 으로 복원해 표시
  const renderCell = (row: DataRow, key: string) => {
    const g = row as unknown as SerializedGame;
    switch (key) {
      case "title":
        return (
          <div style={{ minWidth: 0 }}>
            <div
              style={{ fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {g.title || "(제목 없음)"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-mut)" }}>
              {TYPE_LABEL[g.gameType] ?? g.gameType} · {g.hostName ?? g.hostEmail ?? "-"}
            </div>
          </div>
        );
      case "pending":
        return g.pendingCount > 0 ? (
          <Badge tone="warn" icon="user-plus">{g.pendingCount}</Badge>
        ) : (
          <span style={{ color: "var(--ink-mut)" }}>—</span>
        );
      case "when":
        return <span style={{ color: "var(--ink-soft)", fontFamily: "var(--ff-mono)" }}>{fmtDate(g.scheduledAt)}</span>;
      case "status":
        return <Badge tone={STATUS_TONE[g.status] ?? "grey"}>{STATUS_LABEL[g.status] ?? g.status}</Badge>;
      default:
        return null;
    }
  };

  const allowed = selected ? TRANSITIONS[selected.status] ?? [] : [];

  return (
    <div>
      <PageHead
        eyebrow="백오피스 · 매칭"
        title="매칭 콘솔"
        sub={`픽업·게스트·연습 경기 관리 · 전체 ${totalCount}개`}
      />

      {/* 통계 띠 — 전체 status 분포(서버 groupBy 실측) */}
      <KpiGrid items={kpis} />

      {/* 신청 대기 배너(현재 페이지 기준·대기 > 0 일 때만) */}
      {totalPending > 0 && (
        <div
          className="ts-card"
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", margin: "16px 0" }}
        >
          <Icon name="bell-ring" size={22} color="var(--primary)" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
              신청 대기 {totalPending}건 — 호스트 승인 필요
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-mut)" }}>
              현재 페이지 기준 / 행을 눌러 경기별 신청 현황을 확인하세요
            </div>
          </div>
        </div>
      )}

      {/* 상태 탭(현재 페이지 클라 필터) */}
      <div className="bo-constabs">
        {tabs.map((t) => (
          <button
            key={String(t.id)}
            type="button"
            className="bo-constab"
            data-on={tab === t.id ? "true" : "false"}
            onClick={() => setTab(t.id)}
          >
            {t.label} {t.n}
          </button>
        ))}
      </div>

      {/* 검색 폼(서버 ?q) + 페이지 크기 선택 */}
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "12px 0" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ q: search, page: "1" });
          }}
          style={{ display: "flex", gap: 8, flex: 1, minWidth: 220 }}
        >
          <input
            className="ts-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목·장소 검색"
            aria-label="경기 검색"
            style={{ flex: 1 }}
          />
          <Btn type="submit" variant="secondary" size="sm" icon="search">검색</Btn>
          {q && (
            <Btn type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); navigate({ q: null, page: "1" }); }}>
              초기화
            </Btn>
          )}
        </form>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--ink-mut)" }}>
            {totalCount > 0 ? `${rangeStart}–${rangeEnd} / ${totalCount}개` : "0개"}
          </span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Btn
              key={size}
              type="button"
              size="sm"
              variant={pageSize === size ? "primary" : "ghost"}
              onClick={() => navigate({ pageSize: String(size), page: "1" })}
            >
              {size}
            </Btn>
          ))}
        </div>
      </div>

      {/* 목록 표 — 행 클릭 시 요약 Modal */}
      <DataTable
        cols={COLS}
        rows={filtered as unknown as DataRow[]}
        render={renderCell}
        onRow={openRow}
        empty="해당하는 경기가 없습니다."
      />

      {/* 서버 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
          <Btn
            type="button"
            variant="secondary"
            size="sm"
            icon="chevron-left"
            disabled={page <= 1}
            onClick={() => navigate({ page: String(page - 1) })}
          >
            이전
          </Btn>
          <span style={{ fontSize: 13, color: "var(--ink-soft)", fontFamily: "var(--ff-mono)" }}>
            {page} / {totalPages}
          </span>
          <Btn
            type="button"
            variant="secondary"
            size="sm"
            iconRight="chevron-right"
            disabled={page >= totalPages}
            onClick={() => navigate({ page: String(page + 1) })}
          >
            다음
          </Btn>
        </div>
      )}

      {/* 행 요약 Modal — 경기정보 + 상태변경 + 신청현황(읽기전용) + 레거시 deep-link */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || "(제목 없음)"}
        sub={selected ? TYPE_LABEL[selected.gameType] : ""}
        maxWidth={560}
        foot={
          selected ? (
            <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "center", flexWrap: "wrap" }}>
              {/* 행 요약 → v2 매칭 상세(3탭) 페이지로 이동 */}
              <Link
                href={`/v2/match-console/${selected.id}`}
                className="ts-btn ts-btn--secondary ts-btn--sm"
              >
                상세 보기
              </Link>
              {allowed.length > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
                  <select
                    className="ts-select"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    disabled={pending}
                  >
                    <option value="" disabled>상태 변경</option>
                    {allowed.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s] ?? String(s)}</option>
                    ))}
                  </select>
                  <Btn
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!nextStatus || pending}
                    onClick={applyStatus}
                  >
                    {pending ? "적용 중…" : "적용"}
                  </Btn>
                </div>
              )}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Badge tone={STATUS_TONE[selected.status] ?? "grey"}>
                {STATUS_LABEL[selected.status] ?? selected.status}
              </Badge>
            </div>

            {/* 경기 정보 DL(bo-field) */}
            <div className="bo-field"><span className="bo-field__k">주최자</span><span className="bo-field__v">{selected.hostName ?? selected.hostEmail ?? "-"}</span></div>
            <div className="bo-field"><span className="bo-field__k">유형</span><span className="bo-field__v">{TYPE_LABEL[selected.gameType] ?? String(selected.gameType)}</span></div>
            <div className="bo-field"><span className="bo-field__k">장소</span><span className="bo-field__v">{selected.venueName ?? selected.city ?? "-"}</span></div>
            <div className="bo-field"><span className="bo-field__k">참가자</span><span className="bo-field__v">{selected.currentParticipants ?? 0} / {selected.maxParticipants ?? "-"}</span></div>
            <div className="bo-field"><span className="bo-field__k">예정일</span><span className="bo-field__v" style={{ fontFamily: "var(--ff-mono)" }}>{fmtDate(selected.scheduledAt)}</span></div>
            <div className="bo-field"><span className="bo-field__k">생성일</span><span className="bo-field__v" style={{ fontFamily: "var(--ff-mono)" }}>{fmtDate(selected.createdAt)}</span></div>

            {/* 신청 현황(읽기전용) — game_applications status 0/1/2 실데이터 */}
            <div style={{ marginTop: 20 }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", color: "var(--ink-mut)" }}
              >
                신청 현황
                {selected.pendingCount > 0 && <Badge tone="warn">대기 {selected.pendingCount}</Badge>}
              </div>
              {selected.applications.length === 0 ? (
                <div className="ad-cell-muted" style={{ padding: "12px 0", fontWeight: 600 }}>
                  신청 내역이 없습니다.
                </div>
              ) : (
                <div className="ts-card" style={{ padding: 0, overflow: "hidden" }}>
                  {selected.applications.map((a, i) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                      }}
                    >
                      <Icon name={a.isGuest ? "user-plus" : "user"} size={18} color="var(--ink-mut)" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.applicantName}
                          {a.isGuest && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: "var(--ink-mut)" }}>게스트</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-mut)" }}>
                          신청 {fmtDateTime(a.createdAt)}
                          {a.status === 1 && a.approvedAt && ` · 승인 ${fmtDateTime(a.approvedAt)}`}
                          {a.status === 2 && a.rejectedAt && ` · 거절 ${fmtDateTime(a.rejectedAt)}`}
                        </div>
                      </div>
                      <Badge tone={APP_STATUS_TONE[a.status] ?? "grey"}>{APP_STATUS_LABEL[a.status] ?? a.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ marginTop: 8, fontSize: 11, color: "var(--ink-mut)" }}>
                신청 승인·거절은 경기 호스트가 처리합니다 (조회 전용).
              </p>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
