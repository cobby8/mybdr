"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> 컴포넌트 wrapper 제거 → div + 직접 토큰 (admin/* 단순화)
// - 점검 모드 활성화 버튼: 자체 rounded bg-error → .btn (위험 톤은 inline color 만 유지)

import { useState, useTransition } from "react";
import Link from "next/link"; // Admin-6 박제 — 시안 actions "활동 로그" Link 신규
import { clearCacheAction, toggleMaintenanceModeAction } from "@/app/actions/admin-settings";
// Phase 2A (Toss 전환) — Material Symbols → lucide(<Icon>) 키트
import { Icon } from "@/components/admin-toss";
import { PageHead, Panel, StatRow } from "@/components/admin/console-kit";

export default function AdminSettingsPage() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [cacheMsg, setCacheMsg] = useState<string | null>(null);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null);
  const [isPendingCache, startCacheTransition] = useTransition();
  const [isPendingMaintenance, startMaintenanceTransition] = useTransition();

  function handleCacheClear() {
    setCacheMsg(null);
    startCacheTransition(async () => {
      const res = await clearCacheAction();
      setCacheMsg(res.message);
      setTimeout(() => setCacheMsg(null), 3000);
    });
  }

  function handleMaintenanceToggle() {
    setMaintenanceMsg(null);
    startMaintenanceTransition(async () => {
      const res = await toggleMaintenanceModeAction();
      setMaintenanceEnabled(res.enabled);
      setMaintenanceMsg(res.enabled ? "점검 모드가 활성화되었습니다." : "점검 모드가 해제되었습니다.");
      setTimeout(() => setMaintenanceMsg(null), 3000);
    });
  }

  return (
    // Phase 2A (Toss 전환) — 페이지 루트에 data-skin="toss" opt-in
    <div data-skin="toss">
      {/* Admin-6 박제 — 시안 v2.14 AdminSettings.jsx 헤더 패턴 카피 */}
      {/* eyebrow "ADMIN · 시스템" + breadcrumbs + actions (활동 로그 Link) */}
      <PageHead
        icon="settings"
        eyebrow="ADMIN / 시스템"
        title="시스템 설정"
        sub="사이트 정보·운영 정책·알림·점검 모드를 관리합니다."
        actions={
          <Link href="/admin/logs" className="btn">
            {/* list_alt → lucide list-checks */}
            <Icon name="list-checks" size={16} />
            활동 로그
          </Link>
        }
      />
      <StatRow
        items={[
          { icon: "construction", label: "점검 모드", value: maintenanceEnabled ? "활성" : "비활성", trend: maintenanceEnabled ? "down" : "flat", delta: maintenanceEnabled ? "차단 중" : "정상" },
          { icon: "refresh-cw", label: "캐시", value: isPendingCache ? "초기화 중" : "대기" },
          { icon: "list-checks", label: "활동 로그", value: "연결됨" },
        ]}
      />
      <div className="space-y-4">

        {/* 점검 모드 — 모바일 column / sm+ row 분기 */}
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold">점검 모드</h3>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>사이트를 점검 모드로 전환합니다. 일반 유저 접근이 차단됩니다.</p>
              {maintenanceMsg && (
                <p
                  className="mt-1 text-sm font-medium"
                  style={{ color: maintenanceEnabled ? "var(--color-warning)" : "var(--color-accent)" }}
                >
                  {maintenanceMsg}
                </p>
              )}
            </div>
            {/* (web) .btn 패턴 — 활성화 시 위험 톤은 inline style 로만 (.btn--sm + 색상) */}
            <button
              onClick={handleMaintenanceToggle}
              disabled={isPendingMaintenance}
              className="btn btn--sm shrink-0 w-full sm:w-auto sm:min-w-[100px] disabled:opacity-50"
              style={
                maintenanceEnabled
                  ? { borderColor: "var(--color-error)", color: "var(--color-error)" }
                  : { background: "var(--color-error)", color: "var(--color-text-on-primary)", borderColor: "var(--color-error)" }
              }
            >
              {isPendingMaintenance ? "처리중..." : maintenanceEnabled ? "비활성화" : "활성화"}
            </button>
          </div>
        </Panel>

        {/* 캐시 초기화 — 모바일 column / sm+ row 분기 */}
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold">캐시 초기화</h3>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>전체 페이지 캐시를 초기화합니다. 잠시 응답 속도가 느려질 수 있습니다.</p>
              {cacheMsg && (
                <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-accent)" }}>{cacheMsg}</p>
              )}
            </div>
            <button
              onClick={handleCacheClear}
              disabled={isPendingCache}
              className="btn btn--sm shrink-0 w-full sm:w-auto sm:min-w-[100px] disabled:opacity-50"
            >
              {isPendingCache ? "초기화중..." : "실행"}
            </button>
          </div>
        </Panel>

      </div>
    </div>
  );
}
