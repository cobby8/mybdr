// ============================================================
// (admin-v2)/v2/(backoffice)/settings/page.tsx — 컷오버 시스템 설정
//   레거시 (admin)/admin/settings 의 v2 포팅(점검모드 토글·캐시 초기화).
//   ⚠ 백엔드 0변경 — mutation 은 기존 server action 2종(clearCacheAction·
//     toggleMaintenanceModeAction) 그대로 클라에서 호출(신규 API 0).
//     서버 컴포넌트는 site_settings 의 현재 점검모드 값만 READ(write 0)해서
//     초기 토글 상태를 정확히 반영(레거시는 false 고정 → v2 는 실제 값 반영).
// ============================================================

import { prisma } from "@/lib/db/prisma";
import { clearCacheAction, toggleMaintenanceModeAction } from "@/app/actions/admin-settings";
import { SettingsConsole } from "./_settings";

export const dynamic = "force-dynamic";

export default async function AdminV2SettingsPage() {
  // 점검모드 현재 값 READ — site_settings.key="maintenance_mode" (write 0·서버 액션과 동일 키)
  const row = await prisma.site_settings.findUnique({
    where: { key: "maintenance_mode" },
    select: { value: true },
  }).catch(() => null);
  const initialMaintenance = row?.value === "true";

  // 기존 server action 2종을 클라 컴포넌트로 그대로 전달(백엔드 0변경)
  return (
    <SettingsConsole
      initialMaintenance={initialMaintenance}
      toggleMaintenanceAction={toggleMaintenanceModeAction}
      clearCacheAction={clearCacheAction}
    />
  );
}
