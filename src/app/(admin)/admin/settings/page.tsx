"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> 컴포넌트 wrapper 제거 → div + 직접 토큰 (admin/* 단순화)
// - 점검 모드 활성화 버튼: 자체 rounded bg-error → .btn (위험 톤은 inline color 만 유지)

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useState, useTransition } from "react";
import Link from "next/link"; // Admin-6 박제 — 시안 actions "활동 로그" Link 신규
import { clearCacheAction, toggleMaintenanceModeAction } from "@/app/actions/admin-settings";

// (web) 시안 카드 패턴 — Card 컴포넌트와 동일 룩 (rounded + border + bg + p)
const CARD_CLASS = "rounded-[var(--radius-card)] border p-4 sm:p-5";
const CARD_STYLE: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-card)",
  boxShadow: "var(--shadow-card)",
};

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
    <div>
      {/* Admin-6 박제 — 시안 v2.14 AdminSettings.jsx 헤더 패턴 카피 */}
      {/* eyebrow "ADMIN · 시스템" + breadcrumbs + actions (활동 로그 Link) */}
      <AdminPageHeader
        eyebrow="ADMIN · 시스템"
        title="시스템 설정"
        subtitle="사이트 정보·운영 정책·알림·점검 모드를 관리합니다."
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "시스템" },
          { label: "시스템 설정" },
        ]}
        actions={
          <Link href="/admin/logs" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              list_alt
            </span>
            활동 로그
          </Link>
        }
      />
      <div className="space-y-4">

        {/* 점검 모드 — 모바일 column / sm+ row 분기 */}
        <div className={CARD_CLASS} style={CARD_STYLE}>
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
                  : { background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }
              }
            >
              {isPendingMaintenance ? "처리중..." : maintenanceEnabled ? "비활성화" : "활성화"}
            </button>
          </div>
        </div>

        {/* 캐시 초기화 — 모바일 column / sm+ row 분기 */}
        <div className={CARD_CLASS} style={CARD_STYLE}>
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
        </div>

      </div>
    </div>
  );
}
