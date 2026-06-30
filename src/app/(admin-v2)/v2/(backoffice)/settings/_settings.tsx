"use client";

// ============================================================
// _settings.tsx — 컷오버 시스템 설정(클라). 레거시 settings 1:1 동작.
//   점검 모드 토글 / 캐시 초기화 = 기존 server action 직접 호출(백엔드 0변경).
//   디자인: admin-v2 키트(PageHead/KpiGrid/ts-card/Btn/Badge/Icon) + var(--*) 토큰만.
//   ⚠ 하드코딩 색상(#fff/hex/rgba) 0. pill 9999px 0.
// ============================================================

import React from "react";
import Link from "next/link";
import {
  PageHead,
  KpiGrid,
  Btn,
  Badge,
  Icon,
  useAdminShell,
} from "@/components/admin-v2";

export function SettingsConsole({
  initialMaintenance,
  toggleMaintenanceAction,
  clearCacheAction,
}: {
  initialMaintenance: boolean;
  // 기존 server action 시그니처 그대로(백엔드 0변경)
  toggleMaintenanceAction: () => Promise<{ ok: boolean; enabled: boolean }>;
  clearCacheAction: () => Promise<{ ok: boolean; message: string }>;
}) {
  const { toast } = useAdminShell();

  // 점검 모드 현재 상태(서버 READ 초기값) — 토글 시 server action 결과로 갱신
  const [maintenanceOn, setMaintenanceOn] = React.useState(initialMaintenance);
  const [maintPending, startMaint] = React.useTransition();
  const [cachePending, startCache] = React.useTransition();

  // 점검 모드 토글 — 기존 toggleMaintenanceModeAction 호출(super 전용·DB upsert)
  const onToggleMaintenance = () => {
    startMaint(async () => {
      try {
        const res = await toggleMaintenanceAction();
        setMaintenanceOn(res.enabled);
        toast(res.enabled ? "점검 모드가 활성화되었습니다" : "점검 모드가 해제되었습니다");
      } catch {
        toast("점검 모드 변경에 실패했습니다");
      }
    });
  };

  // 캐시 초기화 — 기존 clearCacheAction 호출(super 전용·revalidatePath)
  const onClearCache = () => {
    startCache(async () => {
      try {
        const res = await clearCacheAction();
        toast(res.message || "캐시가 초기화되었습니다");
      } catch {
        toast("캐시 초기화에 실패했습니다");
      }
    });
  };

  // KPI 띠 — 점검모드/캐시/활동로그(레거시 StatRow 1:1)
  const kpis = [
    {
      label: "점검 모드",
      value: maintenanceOn ? "활성" : "비활성",
      icon: "construction",
      tone: maintenanceOn ? "danger" : "ok",
    },
    {
      label: "캐시",
      value: cachePending ? "초기화 중" : "대기",
      icon: "refresh-cw",
      tone: "primary",
    },
    { label: "활동 로그", value: "연결됨", icon: "list-checks", tone: "violet" },
  ];

  return (
    <div>
      <PageHead
        eyebrow="백오피스 · 시스템"
        title="시스템 설정"
        sub="사이트 운영 정책·점검 모드·캐시를 관리합니다."
        actions={
          <Link href="/v2/logs" className="ts-btn ts-btn--secondary ts-btn--sm">
            <Icon name="list-checks" size={15} />
            활동 로그
          </Link>
        }
      />

      <KpiGrid items={kpis} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, marginTop: 16 }}>
        {/* 점검 모드 패널 — 활성 시 일반 유저 접근 차단 */}
        <div
          className="ts-card"
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>점검 모드</span>
              {maintenanceOn && <Badge tone="danger" icon="construction">차단 중</Badge>}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 4 }}>
              사이트를 점검 모드로 전환합니다. 일반 유저 접근이 차단됩니다.
            </div>
          </div>
          {/* 활성 = 비활성화(secondary) / 비활성 = 활성화(danger) — 레거시 위험톤 의미 보존 */}
          <Btn
            variant={maintenanceOn ? "secondary" : "danger"}
            disabled={maintPending}
            onClick={onToggleMaintenance}
            icon={maintenanceOn ? "shield-off" : "construction"}
          >
            {maintPending ? "처리 중…" : maintenanceOn ? "비활성화" : "활성화"}
          </Btn>
        </div>

        {/* 캐시 초기화 패널 */}
        <div
          className="ts-card"
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>캐시 초기화</div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 4 }}>
              전체 페이지 캐시를 초기화합니다. 잠시 응답 속도가 느려질 수 있습니다.
            </div>
          </div>
          <Btn
            variant="secondary"
            disabled={cachePending}
            onClick={onClearCache}
            icon="refresh-cw"
          >
            {cachePending ? "초기화 중…" : "실행"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
