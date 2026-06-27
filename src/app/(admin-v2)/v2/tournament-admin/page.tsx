"use client";

// =====================================================================
// (admin-v2)/v2/tournament-admin/page.tsx — 대회관리자 셸 대시보드(M3 파일럿 1/5)
//   정본: ta-pages.jsx Dashboard (PageHead + KPI + 월별차트 + 최근활동)
//
//   데이터 배선(★실데이터):
//   - 대회/단체/정규대회 3종을 admin-api(adminFetch)로 병렬 fetch → KPI/월별차트 파생.
//   - "최근 활동" 피드는 실 source 없음 → 준비(빈) 상태로 표시(mock 0). M4 백엔드 확장 갭.
//   raw fetch 0 — 전부 admin-api 경유. snake→camel 은 adminFetch 단일 지점 처리.
// =====================================================================

import { tournamentsApi, organizationsApi, seriesApi, useAdminQuery } from "@/lib/admin-api";
import { PageHead, AdBarPanel } from "@/components/admin-v2/blocks";
import { Btn, Empty, Icon, SkelTable, ErrState } from "@/components/admin-toss";

// 진입맵(정본 §9): 대시보드 "새 대회" → 대회 생성(현재 레거시 마법사 라우트로 링크).
const CREATE_HREF = "/tournament-admin/tournaments/new/wizard";

export default function TaDashboardPage() {
  // 대회 + 단체 + 정규대회 병렬 fetch(한 쿼리로 묶어 로딩/에러 상태 일원화).
  const { data, loading, error, refetch } = useAdminQuery(async (signal) => {
    const [tournaments, orgs, series] = await Promise.all([
      tournamentsApi.listTournaments(undefined, signal),
      organizationsApi.listMyOrganizations(signal),
      seriesApi.listMySeries(signal),
    ]);
    return { tournaments, orgs, series };
  }, []);

  return (
    <div>
      <PageHead
        eyebrow="대회 관리자"
        title="대시보드"
        sub="운영 중인 대회 현황과 등록 단체를 한눈에 확인합니다."
        actions={
          <Btn icon="plus" onClick={() => { window.location.href = CREATE_HREF; }}>
            새 대회 만들기
          </Btn>
        }
      />

      {/* 로딩/에러 상태 — use-admin-query {loading,error} + admin-toss 키트 */}
      {loading && <SkelTable rows={4} />}
      {!loading && error && (
        <ErrState
          title="대시보드를 불러오지 못했습니다"
          desc={error.message}
          onRetry={refetch}
        />
      )}

      {!loading && !error && data && (
        <DashboardBody
          tournaments={data.tournaments}
          orgsCount={data.orgs.length}
          seriesCount={data.series.length}
        />
      )}
    </div>
  );
}

// ── 본문(파생 지표 + 패널) ───────────────────────────────────────────
function DashboardBody({
  tournaments,
  orgsCount,
  seriesCount,
}: {
  tournaments: import("@/lib/admin-api").AdminTournamentListItem[];
  orgsCount: number;
  seriesCount: number;
}) {
  // KPI — 실 fetch 결과에서 파생(추측/mock 0).
  const teamSum = tournaments.reduce((acc, t) => acc + (t.teamCount ?? 0), 0);
  const kpis: { label: string; value: number; icon: string; tone: string }[] = [
    { label: "대회", value: tournaments.length, icon: "trophy", tone: "primary" },
    { label: "참가팀 합계", value: teamSum, icon: "users", tone: "ok" },
    { label: "등록 단체", value: orgsCount, icon: "building-2", tone: "violet" },
    { label: "정규대회", value: seriesCount, icon: "layers", tone: "warn" },
  ];

  // 월별 개최 차트 — 올해 월별 대회 수 파생. 현재월 이후는 soft(예정).
  const year = new Date().getFullYear();
  const nowMonth = new Date().getMonth();
  const counts = Array.from({ length: 12 }, () => 0);
  tournaments.forEach((t) => {
    if (!t.startDate) return;
    const d = new Date(t.startDate);
    if (!Number.isNaN(d.getTime()) && d.getFullYear() === year) counts[d.getMonth()] += 1;
  });
  const hasChart = counts.some((c) => c > 0);
  const chart = counts.map((v, i) => ({ m: `${i + 1}월`, v, soft: i > nowMonth }));

  return (
    <>
      {/* KPI 그리드 — ad-kpi(정본 마크업). data-tone 은 클래스 선택자(하드코딩 hex 0). */}
      <div className="ad-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="ad-kpi">
            <div className="ad-kpi__top">
              <span className="ad-kpi__icon" data-tone={k.tone}>
                <Icon name={k.icon} size={20} />
              </span>
            </div>
            <div className="ad-kpi__val">{k.value.toLocaleString()}</div>
            <div className="ad-kpi__label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* 2열: 월별 차트 / 최근 활동 */}
      <div className="ad-cols" style={{ marginTop: 20 }}>
        {hasChart ? (
          <AdBarPanel title={`월별 개최 대회 · ${year}년`} badge={`${year}년`} data={chart} />
        ) : (
          <div className="ad-panel">
            <div className="ad-panel__head">
              <div className="ad-panel__title">월별 개최 대회</div>
            </div>
            <Empty icon="bar-chart-3" title="표시할 대회가 없습니다" desc="대회를 만들면 월별 분포가 표시됩니다." />
          </div>
        )}

        {/* 최근 활동 — 실 source 없음 → 준비 상태(mock 0). M4 확장 갭. */}
        <div className="ad-panel">
          <div className="ad-panel__head">
            <div className="ad-panel__title">최근 활동</div>
          </div>
          <Empty icon="history" title="활동 피드 준비 중" desc="대회 신청·입금·일정 등의 활동 로그가 이 영역에 표시될 예정입니다." />
        </div>
      </div>
    </>
  );
}
