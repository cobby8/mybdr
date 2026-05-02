"use client";

import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useState, useTransition } from "react";
import { clearCacheAction, toggleMaintenanceModeAction } from "@/app/actions/admin-settings";

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
      <AdminPageHeader
        eyebrow="ADMIN · SYSTEM"
        title="시스템 설정"
        subtitle="점검 모드 전환 · 캐시 초기화 등 시스템 운영 도구"
      />
      <div className="space-y-4">

        {/* 점검 모드 — 모바일 column / sm+ row 분기 */}
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold">점검 모드</h3>
              <p className="text-sm text-[var(--color-text-muted)]">사이트를 점검 모드로 전환합니다. 일반 유저 접근이 차단됩니다.</p>
              {maintenanceMsg && (
                <p className={`mt-1 text-sm font-medium ${maintenanceEnabled ? "text-[var(--color-warning)]" : "text-[var(--color-accent)]"}`}>
                  {maintenanceMsg}
                </p>
              )}
            </div>
            <button
              onClick={handleMaintenanceToggle}
              disabled={isPendingMaintenance}
              className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 w-full sm:w-auto sm:min-w-[100px] ${
                maintenanceEnabled
                  ? "bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20"
                  : "bg-[var(--color-error)] text-white hover:bg-[var(--color-error-hover,#DC2626)]"
              }`}
            >
              {isPendingMaintenance ? "처리중..." : maintenanceEnabled ? "비활성화" : "활성화"}
            </button>
          </div>
        </Card>

        {/* 캐시 초기화 — 모바일 column / sm+ row 분기 */}
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold">캐시 초기화</h3>
              <p className="text-sm text-[var(--color-text-muted)]">전체 페이지 캐시를 초기화합니다. 잠시 응답 속도가 느려질 수 있습니다.</p>
              {cacheMsg && (
                <p className="mt-1 text-sm font-medium text-[var(--color-accent)]">{cacheMsg}</p>
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
        </Card>

      </div>
    </div>
  );
}
