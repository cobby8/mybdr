"use client";

// =====================================================================
// (admin-v2)/v2/tournament-admin/tournaments/page.tsx — 대회 목록(M3 파일럿 2/5)
//   정본: ta-pages.jsx TournamentList (PageHead + 검색/필터 + DataTable)
//
//   데이터 배선(★실데이터):
//   - GET /api/web/tournaments (admin-api tournamentsApi.listTournaments) — adminFetch 경유.
//   - 행 클릭 → 레거시 대회 운영 워크스페이스(/tournament-admin/tournaments/[id]) 링크(진입맵 §9).
//   ⚠️ 범위 갭: 이 route 는 공개+뷰어 관계 대회(viewer-aware)라 "내가 운영하는 대회"만은 아님
//      (전용 HTTP 엔드포인트 부재·레거시는 server Prisma). M4 백엔드 확장 대상.
//   리스트 렌더 = admin-blocks SchemaList(schema={cols,rows,rowHref}).
// =====================================================================

import { tournamentsApi, useAdminQuery } from "@/lib/admin-api";
import { PageHead, SchemaList } from "@/components/admin-v2/blocks";
import type { SchemaDef } from "@/components/admin-v2/blocks";
import type { BadgeTone } from "@/components/admin-toss";
import { SkelTable, ErrState } from "@/components/admin-toss";
import {
  TOURNAMENT_STATUS_LABEL,
  TOURNAMENT_FORMAT_LABEL_SHORT,
  effectiveTournamentStatus,
} from "@/lib/constants/tournament-status";

const CREATE_HREF = "/tournament-admin/tournaments/new/wizard";

// 4종 상태 라벨 → Badge 톤(준비중 회색 / 접수중 파랑 / 진행중 초록 / 종료 회색).
function statusTone(label: string): BadgeTone {
  if (label === "접수중") return "primary";
  if (label === "진행중") return "ok";
  return "grey"; // 준비중 / 종료
}

// ISO → YYYY.MM.DD (KST 표시 보정 — 클라이언트지만 일관성 위해 +9h UTC 계산).
function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${k.getUTCFullYear()}.${String(k.getUTCMonth() + 1).padStart(2, "0")}.${String(k.getUTCDate()).padStart(2, "0")}`;
}

export default function TaTournamentsPage() {
  const { data, loading, error, refetch } = useAdminQuery(
    (signal) => tournamentsApi.listTournaments(undefined, signal),
    [],
  );

  // 로딩/에러 — PageHead 는 항상 노출(SchemaList 의 PageHead 와 동일 톤).
  if (loading) {
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="대회 목록" sub="등록된 대회를 관리합니다. 행을 눌러 운영 워크스페이스로 이동합니다." />
        <SkelTable rows={6} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="대회 목록" sub="등록된 대회를 관리합니다. 행을 눌러 운영 워크스페이스로 이동합니다." />
        <ErrState title="대회 목록을 불러오지 못했습니다" desc={error.message} onRetry={refetch} />
      </div>
    );
  }

  const rows = (data ?? []).map((t) => {
    const eff = effectiveTournamentStatus(t.status, t.startDate, t.endDate);
    const label = TOURNAMENT_STATUS_LABEL[eff] ?? eff ?? "준비중";
    const fmt = t.format ? TOURNAMENT_FORMAT_LABEL_SHORT[t.format] ?? t.format : "";
    return {
      id: t.id,
      name: t.name ?? "(이름 없음)",
      sub: [fmt, t.city].filter(Boolean).join(" · "),
      venue: t.venueName ?? "-",
      date: fmtDate(t.startDate),
      teams: `${t.teamCount ?? 0}팀`,
      badge: label,
      tone: statusTone(label),
    };
  });

  const schema: SchemaDef = {
    head: "대회 목록",
    sub: "등록된 대회를 관리합니다. 행을 눌러 운영 워크스페이스로 이동합니다.",
    cols: [
      { key: "name", label: "대회명", type: "title", w: "minmax(0,2.2fr)" },
      { key: "venue", label: "장소", type: "muted", w: "minmax(0,1.4fr)" },
      { key: "date", label: "개최일", type: "mono", w: "minmax(0,1fr)" },
      { key: "teams", label: "참가팀", type: "mono", w: "84px", align: "center" },
      { key: "status", label: "상태", type: "badge", w: "96px", align: "center" },
      { key: "act", label: "", type: "actions", w: "72px", align: "right" },
    ],
    rows,
    // 행 클릭 → 레거시 대회 운영 워크스페이스(진입맵). 신규 라우트 미존재라 레거시 링크 OK.
    rowHref: (r) => `/tournament-admin/tournaments/${r.id}`,
    addLabel: "새 대회 만들기",
    addHref: CREATE_HREF,
  };

  return <SchemaList schema={schema} eyebrow="대회 관리자" />;
}
