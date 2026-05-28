"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  TOURNAMENT_STATUS_LABEL,
  TOURNAMENT_FORMAT_LABEL,
} from "@/lib/constants/tournament-status";

/* ============================================================
 * AdminTournamentList — A1 (PR-1C-7 박제 2026-05-28)
 *
 * 박제 source: Dev/design/BDR-current/screens/AdminTournamentAdminList.jsx
 *              (aen-tabs / aen-list / aen-row / aen-pill / adv-empty)
 * 박제 target: 본 파일 (admin 대회 목록 — 상태 탭 + 검색 + 카드 list)
 *
 * 이유 (왜):
 *   - 시안 상태 탭 / 대회명 검색은 클라이언트 상태(tab / q)가 필요 →
 *     server component(page.tsx) 가 Prisma 로 fetch 한 데이터를 prop 으로 받아
 *     클라이언트에서 필터링만 수행 (새 fetch / query ❌).
 *   - 시안 행의 신청기간 / 본선기간 / 팀수 bar 는 운영 page.tsx 가
 *     fetch 하지 않는 데이터 → mock ❌ 룰에 따라 컬럼 제외 (시작일만 표시).
 *
 * 어떻게:
 *   1. 시안 5탭(작성중/신청중/진행중/완료) + 전체 = 운영 4종 status 그룹에 매핑.
 *      (시안 archived 보관 탭 = 운영 미구분 → 제외)
 *   2. aen-pill 5종(draft/apply/live/done) tone 매핑.
 *   3. 행 클릭 = 운영 기존 라우트 `/tournament-admin/tournaments/{id}` (Link 보존).
 * ============================================================ */

// page.tsx 가 넘기는 대회 행 데이터 (운영 Prisma 결과 일부 — 새 필드 0)
export interface AdminTournamentRow {
  id: string;
  name: string;
  status: string | null;
  startDate: string | null; // ISO (server 에서 toISOString) — 클라이언트에서 표시 포맷
  format: string | null;
}

// 시안 status 그룹 키 (탭 / pill 클래스 공통)
type StatusGroup = "draft" | "apply" | "live" | "done";

// 운영 status(다양) → 시안 4 그룹 매핑.
// TOURNAMENT_STATUS_LABEL 의 4종(준비중/접수중/진행중/종료) 분류와 1:1.
const STATUS_GROUP: Record<string, StatusGroup> = {
  // 준비중 → draft(작성중)
  draft: "draft",
  upcoming: "draft",
  // 접수중 → apply(신청중)
  registration: "apply",
  registration_open: "apply",
  active: "apply",
  published: "apply",
  open: "apply",
  opening_soon: "apply",
  registration_closed: "apply",
  // 진행중 → live
  in_progress: "live",
  live: "live",
  ongoing: "live",
  group_stage: "live",
  // 종료 → done(완료)
  completed: "done",
  ended: "done",
  closed: "done",
  cancelled: "done",
};

// 탭 정의 — 시안 순서 (전체 + 4 그룹). archived 탭은 운영 미구분 → 제외
const TABS: { k: "all" | StatusGroup; label: string }[] = [
  { k: "all", label: "전체" },
  { k: "draft", label: "작성중" },
  { k: "apply", label: "신청중" },
  { k: "live", label: "진행중" },
  { k: "done", label: "완료" },
];

// 공개 판정 — 접수중/진행중/종료 그룹 = 공개로 간주 (draft 만 비공개)
function isPublished(group: StatusGroup): boolean {
  return group !== "draft";
}

export function AdminTournamentList({ rows }: { rows: AdminTournamentRow[] }) {
  const [tab, setTab] = useState<"all" | StatusGroup>("all");
  const [q, setQ] = useState("");

  // 각 행에 시안 그룹 키를 미리 부여 (탭 필터 / pill 공통 사용)
  const grouped = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        group: STATUS_GROUP[r.status ?? "draft"] ?? "draft",
      })),
    [rows],
  );

  // 탭 + 검색어 필터 (클라이언트만 — 새 fetch ❌)
  const filtered = useMemo(() => {
    let list = grouped;
    if (tab !== "all") list = list.filter((r) => r.group === tab);
    if (q.trim()) {
      const kw = q.trim().toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(kw));
    }
    return list;
  }, [grouped, tab, q]);

  // 탭별 카운트 — 시안 aen-tabs__count
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: grouped.length,
      draft: 0,
      apply: 0,
      live: 0,
      done: 0,
    };
    grouped.forEach((r) => {
      c[r.group] = (c[r.group] ?? 0) + 1;
    });
    return c;
  }, [grouped]);

  return (
    <>
      {/* 상태 탭 + 검색 toolbar */}
      <div className="aen-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.k}
            type="button"
            className={"aen-tabs__tab" + (tab === t.k ? " is-on" : "")}
            onClick={() => setTab(t.k)}
          >
            {t.label}
            <span className="aen-tabs__count">{counts[t.k]}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* 검색 — 대회명 (시안은 시리즈도 검색하나 운영 fetch 미포함 → 이름만) */}
        <div className="atm-toolbar__search" style={{ marginLeft: "auto" }}>
          <span className="ico material-symbols-outlined">search</span>
          <input
            placeholder="대회명 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ fontSize: 14 }}
          />
        </div>
      </div>

      {/* 대회 카드 list */}
      <div className="aen-list">
        {filtered.map((r) => {
          const statusKey = r.status ?? "draft";
          const statusLabel = TOURNAMENT_STATUS_LABEL[statusKey] ?? statusKey;
          const published = isPublished(r.group);
          return (
            // 행 클릭 = 운영 기존 setup hub 라우트 (가짜링크 ❌)
            <Link
              key={r.id}
              href={`/tournament-admin/tournaments/${r.id}`}
              className="aen-row"
            >
              <div className="aen-row__name">
                <div className="aen-row__t1">
                  <span className="aen-row__title">{r.name}</span>
                  <span className={"aen-row__pub" + (published ? " is-on" : "")}>
                    {published ? "공개" : "비공개"}
                  </span>
                </div>
                {/* 시리즈 미연결 — 운영 page.tsx 가 series fetch 안 함 (mock ❌) */}
                <div
                  className="aen-row__series"
                  style={{ fontStyle: "italic", color: "var(--ink-dim)" }}
                >
                  {r.format
                    ? TOURNAMENT_FORMAT_LABEL[r.format] ?? r.format
                    : "형식 미지정"}
                </div>
              </div>
              {/* 상태 pill — 시안 4 그룹 톤 */}
              <span className={"aen-pill aen-pill--" + r.group}>
                {statusLabel}
              </span>
              {/* 시작일 — 운영 fetch 보유 데이터만 (신청/본선 기간은 미fetch → 제외) */}
              <div className="aen-row__date">
                {r.startDate ? (
                  <>
                    {new Date(r.startDate).toLocaleDateString("ko-KR")}
                    <small>시작</small>
                  </>
                ) : (
                  <span style={{ color: "var(--ink-dim)" }}>날짜 미정</span>
                )}
              </div>
              <span className="aen-row__cta">
                <span className="ico material-symbols-outlined">chevron_right</span>
              </span>
            </Link>
          );
        })}
        {/* 검색/필터 결과 0건 — adv-empty */}
        {filtered.length === 0 && (
          <div className="adv-empty">
            <span className="adv-empty__icon ico material-symbols-outlined">inbox</span>
            <div className="adv-empty__h">조건에 맞는 대회가 없어요</div>
            <div className="adv-empty__sub">
              {grouped.length === 0
                ? "아직 운영하는 대회가 없습니다. 위에서 새 대회를 만들어 보세요."
                : "필터를 초기화하거나 검색어를 다시 입력하세요."}
            </div>
            {grouped.length > 0 && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setTab("all");
                  setQ("");
                }}
              >
                필터 초기화
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
