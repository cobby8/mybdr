"use client";

// ============================================================
// referee-console/settlements/_settlements-console.tsx — 정산 콘솔 컨테이너
//   3 탭(목록 / 통계 / 일괄 생성)을 ts-segment 세그먼트 컨트롤로 전환.
//   - 목록   = 기존 SettlementsList(서버 rows 박제 — 무수정 재사용).
//   - 통계   = SettlementsStats(레거시 dashboard 박제 · GET summary).
//   - 일괄생성 = SettlementsBulk(레거시 new-batch 박제 · bulk-create GET/POST).
//   ★전부 기존 엔드포인트 재사용 — 백엔드/DB 0변경. 디자인 = admin-v2 키트·var(--*).
// ============================================================

import React from "react";
import { PageHead } from "@/components/admin-v2";
import { SettlementsList, type RfSettleRow } from "./_settlements";
import { SettlementsStats } from "./_settlements-stats";
import { SettlementsBulk } from "./_settlements-bulk";

type Tab = "list" | "stats" | "bulk";

const TABS: { id: Tab; label: string }[] = [
  { id: "list", label: "정산 목록" },
  { id: "stats", label: "통계" },
  { id: "bulk", label: "일괄 생성" },
];

export function SettlementsConsole({ rows }: { rows: RfSettleRow[] }) {
  const [tab, setTab] = React.useState<Tab>("list");

  return (
    <div>
      {/* 세그먼트 탭(토큰 기반 .ts-segment — 하드코딩 색 0) */}
      <div className="ts-segment" style={{ maxWidth: 420, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="ts-segment__btn"
            data-active={tab === t.id ? "true" : "false"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 목록 = 기존 SettlementsList(자체 PageHead 보유) */}
      {tab === "list" && <SettlementsList rows={rows} />}

      {/* 통계 */}
      {tab === "stats" && (
        <>
          <PageHead
            eyebrow="심판 콘솔"
            title="정산 통계"
            sub="월별 정산 현황과 상위 심판/대회 통계를 확인합니다."
          />
          <SettlementsStats />
        </>
      )}

      {/* 일괄 생성 */}
      {tab === "bulk" && (
        <>
          <PageHead
            eyebrow="심판 콘솔"
            title="정산 일괄 생성"
            sub="대회별 완료 배정의 정산을 한 번에 생성합니다."
          />
          <SettlementsBulk />
        </>
      )}
    </div>
  );
}
