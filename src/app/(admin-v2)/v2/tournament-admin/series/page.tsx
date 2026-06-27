"use client";

// =====================================================================
// (admin-v2)/v2/tournament-admin/series/page.tsx — 정규대회(M3 파일럿 3/5)
//   정본: ta-pages.jsx Series (★용어확정 v46: 시리즈 → 정규대회)
//
//   데이터 배선(★실데이터):
//   - GET /api/web/series/my (admin-api seriesApi.listMySeries) — 본인 소유 + active 시리즈.
//   - 행 클릭 → 레거시 정규대회 상세(/tournament-admin/series/[id]) 링크.
//   ⚠️ 미배선(갭): 이 route 는 wizard 드롭다운용이라 회차/주기/다음 회차 필드가 없음.
//      → name + 단체만 실배선, 상태는 active 고정("운영중"). M4 백엔드 확장 시 회차 등 보강.
//   리스트 렌더 = admin-blocks SchemaList.
// =====================================================================

import { seriesApi, useAdminQuery } from "@/lib/admin-api";
import { PageHead, SchemaList } from "@/components/admin-v2/blocks";
import type { SchemaDef } from "@/components/admin-v2/blocks";
import { SkelTable, ErrState } from "@/components/admin-toss";

// 아바타 배경 — 토큰만 사용(하드코딩 hex 0). 행 인덱스로 순환해 시각 변화만 부여.
const AVATAR_TOKENS = ["var(--primary)", "var(--ok)", "var(--warn)"];

export default function TaSeriesPage() {
  const { data, loading, error, refetch } = useAdminQuery(
    (signal) => seriesApi.listMySeries(signal),
    [],
  );

  const sub = "정기적으로 반복 개최하는 정규대회를 묶어 관리합니다.";

  if (loading) {
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="정규대회" sub={sub} />
        <SkelTable rows={5} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="정규대회" sub={sub} />
        <ErrState title="정규대회를 불러오지 못했습니다" desc={error.message} onRetry={refetch} />
      </div>
    );
  }

  const rows = (data ?? []).map((s, i) => {
    const org = s.organization?.name ?? "단체 미연결";
    return {
      id: s.id,
      name: s.name,
      sub: org, // 아바타 셀 보조줄
      color: AVATAR_TOKENS[i % AVATAR_TOKENS.length],
      org,
      st: "운영중", // /series/my = active 만 반환
      sttone: "ok",
    };
  });

  const schema: SchemaDef = {
    head: "정규대회",
    sub,
    cols: [
      { key: "name", label: "정규대회", type: "avatar", w: "minmax(0,2.4fr)" },
      { key: "org", label: "단체", type: "muted", w: "minmax(0,1.6fr)" },
      { key: "status", label: "상태", type: "status", w: "110px", align: "center" },
      { key: "act", label: "", type: "actions", w: "72px", align: "right" },
    ],
    rows,
    rowHref: (r) => `/tournament-admin/series/${r.id}`,
    addLabel: "정규대회 만들기",
    addHref: "/tournament-admin/series/new",
  };

  return <SchemaList schema={schema} eyebrow="대회 관리자" />;
}
