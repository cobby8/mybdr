/**
 * ManagedTournamentsCard — admin 마이페이지 관리 토너먼트 목록 카드.
 *
 * 2026-05-11 — Phase 2 (관리 토너먼트 / 본인인증 / 최근 활동).
 *
 * 데이터 소스:
 *   - tournamentAdminMembers (admin-roles.ts — TAM JOIN Tournament)
 *   - tournamentRecorders (admin-roles.ts — recorder JOIN Tournament)
 *
 * 사용자가 한 토너먼트에서 TAM + recorder 둘 다 보유 가능 → 토너먼트 단위로 묶어서
 * "운영자·기록원" 같이 합쳐서 표시. 중복 행 회피.
 *
 * UX:
 *   - 상태별 분리: 진행 중 (in_progress) / 예정 (draft·registration_open) / 완료 (completed) / 취소 (cancelled)
 *   - 5건+ 이면 펼치기 ("+N건 더보기" 버튼) — useState 로 클라이언트 분기
 *   - 0건 = "관리하는 토너먼트가 없습니다" 안내
 *   - 상한 51건 도달 시 안내
 *
 * 디자인 토큰만 — var(--*) / Material Symbols Outlined / 4px rounded.
 * client component (펼치기 토글 상태 보유).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  TournamentAdminEntry,
  TournamentRecorderEntry,
} from "@/lib/auth/admin-roles";

export interface ManagedTournamentsCardProps {
  tournamentAdminMembers: TournamentAdminEntry[];
  tournamentRecorders: TournamentRecorderEntry[];
}

// 화면 표시 단위 — 같은 tournamentId 의 TAM/recorder 권한을 합친 행
interface ManagedTournamentRow {
  tournamentId: string;
  tournamentName: string;
  status: string; // 정규화된 status
  startDate: Date | null;
  endDate: Date | null;
  roles: Array<"admin" | "recorder">; // 보유 권한 (둘 다 가능)
  adminRole?: string; // TAM 의 role 필드 ("admin"/"manager")
}

// 상태 분류 — TournamentStatus → 화면 그룹 4종
type StatusGroup = "in_progress" | "upcoming" | "completed" | "cancelled";

function classifyStatus(status: string | null | undefined): StatusGroup {
  // 이유: tournament.status 가 draft / registration_open / registration / in_progress / completed / cancelled 등 다양
  //       → 마이페이지에서는 4 그룹으로 단순화 (진행 중 / 예정 / 완료 / 취소).
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      // draft / registration_open / registration / null → "예정"
      return "upcoming";
  }
}

const STATUS_LABELS: Record<StatusGroup, string> = {
  in_progress: "진행 중",
  upcoming: "예정",
  completed: "완료",
  cancelled: "취소",
};

// 상태별 색상 — 디자인 토큰 (var(--*)) — 핑크/살몬/코랄 ❌
const STATUS_COLORS: Record<StatusGroup, { bg: string; text: string }> = {
  in_progress: { bg: "var(--color-primary)", text: "white" }, // BDR Red 강조
  upcoming: { bg: "var(--color-elevated)", text: "var(--color-primary)" },
  completed: { bg: "var(--color-surface)", text: "var(--color-text-secondary)" },
  cancelled: { bg: "var(--color-surface)", text: "var(--color-text-secondary)" },
};

// 날짜 표시 — "5/11 ~ 5/13" 또는 "5/11" 단일
function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start && !end) return "";
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  if (start && end) {
    // 같은 날짜면 1개만
    if (start.getTime() === end.getTime()) return fmt(start);
    return `${fmt(start)} ~ ${fmt(end)}`;
  }
  return start ? fmt(start) : fmt(end as Date);
}

/**
 * TAM + recorder 결과를 토너먼트 단위로 머지.
 * 이유: 한 사용자가 같은 대회에서 운영자 + 기록원 둘 다 가능 → 중복 행 회피.
 */
function mergeRows(
  tams: TournamentAdminEntry[],
  recorders: TournamentRecorderEntry[]
): ManagedTournamentRow[] {
  // tournamentId → row
  const map = new Map<string, ManagedTournamentRow>();

  for (const tam of tams) {
    map.set(tam.tournamentId, {
      tournamentId: tam.tournamentId,
      tournamentName: tam.tournamentName ?? "(이름 없음)",
      status: tam.tournamentStatus ?? "",
      startDate: tam.tournamentStartDate ?? null,
      endDate: tam.tournamentEndDate ?? null,
      roles: ["admin"],
      adminRole: tam.role,
    });
  }

  for (const rec of recorders) {
    const existing = map.get(rec.tournamentId);
    if (existing) {
      // 이미 TAM 으로 등록된 토너먼트 — recorder 권한 추가
      existing.roles.push("recorder");
    } else {
      // recorder 만 보유한 토너먼트
      map.set(rec.tournamentId, {
        tournamentId: rec.tournamentId,
        tournamentName: rec.tournamentName ?? "(이름 없음)",
        status: rec.tournamentStatus ?? "",
        startDate: rec.tournamentStartDate ?? null,
        endDate: rec.tournamentEndDate ?? null,
        roles: ["recorder"],
      });
    }
  }

  return Array.from(map.values());
}

// 그룹별 정렬 우선순위 — 진행 중 → 예정 → 완료 → 취소
const STATUS_ORDER: StatusGroup[] = [
  "in_progress",
  "upcoming",
  "completed",
  "cancelled",
];

// 권한 라벨 — "운영자" / "기록원" / "운영자·기록원"
function rolesLabel(roles: Array<"admin" | "recorder">): string {
  const hasAdmin = roles.includes("admin");
  const hasRec = roles.includes("recorder");
  if (hasAdmin && hasRec) return "운영자·기록원";
  if (hasAdmin) return "운영자";
  return "기록원";
}

// 개별 토너먼트 행
function TournamentRow({ row }: { row: ManagedTournamentRow }) {
  const group = classifyStatus(row.status);
  const colors = STATUS_COLORS[group];
  const dateRange = formatDateRange(row.startDate, row.endDate);

  return (
    <li
      className="flex items-center justify-between gap-2 rounded border px-3 py-2 text-xs"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
        borderRadius: "4px",
      }}
    >
      <div className="flex-1 min-w-0">
        {/* 토너먼트명 + 상태 뱃지 */}
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/tournaments/${row.tournamentId}`}
            className="font-medium truncate hover:underline"
            style={{ color: "var(--color-text-primary)" }}
          >
            {row.tournamentName}
          </Link>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              borderRadius: "4px",
            }}
          >
            {STATUS_LABELS[group]}
          </span>
        </div>

        {/* 날짜 + 권한 */}
        <div
          className="mt-0.5 flex items-center gap-2 text-[11px]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {dateRange && (
            <span className="inline-flex items-center gap-0.5">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 12 }}
              >
                event
              </span>
              {dateRange}
            </span>
          )}
          <span className="inline-flex items-center gap-0.5">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 12 }}
            >
              shield_person
            </span>
            {rolesLabel(row.roles)}
          </span>
        </div>
      </div>
    </li>
  );
}

// 상태별 그룹 섹션 (진행 중 우선 5건 노출 후 펼치기)
function StatusGroupSection({
  group,
  rows,
}: {
  group: StatusGroup;
  rows: ManagedTournamentRow[];
}) {
  // 펼치기 기본값 — 진행 중 그룹만 펼침 (가장 자주 보는 그룹). 나머지는 접힘.
  const [expanded, setExpanded] = useState(group === "in_progress");
  const VISIBLE_COUNT = 5;

  if (rows.length === 0) return null;

  const showAll = expanded || rows.length <= VISIBLE_COUNT;
  const visible = showAll ? rows : rows.slice(0, VISIBLE_COUNT);
  const remaining = rows.length - VISIBLE_COUNT;

  return (
    <div>
      <div
        className="mb-2 flex items-center gap-2 text-sm font-semibold"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span>{STATUS_LABELS[group]}</span>
        <span
          className="text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          ({rows.length}건)
        </span>
      </div>

      <ul className="space-y-1.5">
        {visible.map((row) => (
          <TournamentRow key={row.tournamentId} row={row} />
        ))}
      </ul>

      {/* 펼치기 / 접기 토글 */}
      {rows.length > VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium"
          style={{
            color: "var(--color-primary)",
            borderRadius: "4px",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16 }}
          >
            {expanded ? "expand_less" : "expand_more"}
          </span>
          {expanded ? "접기" : `+${remaining}건 더보기`}
        </button>
      )}
    </div>
  );
}

export function ManagedTournamentsCard({
  tournamentAdminMembers,
  tournamentRecorders,
}: ManagedTournamentsCardProps) {
  // 1) TAM + recorder 머지 (토너먼트 단위)
  const allRows = mergeRows(tournamentAdminMembers, tournamentRecorders);

  // 2) 상태별 그룹화
  const grouped = new Map<StatusGroup, ManagedTournamentRow[]>();
  for (const group of STATUS_ORDER) {
    grouped.set(group, []);
  }
  for (const row of allRows) {
    const group = classifyStatus(row.status);
    grouped.get(group)!.push(row);
  }

  // 3) 상한 도달 검출 — admin-roles take: 51 패턴 (TAM 또는 recorder 중 한쪽 도달 시)
  const TAKE_LIMIT = 50;
  const tamTruncated = tournamentAdminMembers.length > TAKE_LIMIT;
  const recTruncated = tournamentRecorders.length > TAKE_LIMIT;
  const isTruncated = tamTruncated || recTruncated;

  // 0건 케이스
  if (allRows.length === 0) {
    return (
      <section
        className="rounded-lg border p-6"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <header className="mb-3">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            관리 토너먼트
          </h2>
        </header>
        <div
          className="rounded-md border p-4 text-sm text-center"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-elevated)",
            color: "var(--color-text-secondary)",
          }}
        >
          관리하는 토너먼트가 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border p-6"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <header className="mb-4">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          관리 토너먼트
        </h2>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          내가 운영자 또는 기록원으로 참여 중인 대회입니다.
        </p>
      </header>

      <div className="space-y-4">
        {STATUS_ORDER.map((group) => (
          <StatusGroupSection
            key={group}
            group={group}
            rows={grouped.get(group)!}
          />
        ))}
      </div>

      {/* 상한 안내 */}
      {isTruncated && (
        <div
          className="mt-4 flex items-center gap-1 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            info
          </span>
          <span>
            표시 상한 {TAKE_LIMIT}건 — 더 많은 권한이 있을 수 있습니다.
            운영자에게 문의하세요.
          </span>
        </div>
      )}
    </section>
  );
}
