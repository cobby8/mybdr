// ============================================================
// backoffice.ts — R2-A 백오피스 유저 콘솔 mutation 엔드포인트(adminFetch 경유)
//   단체 인증 처리(approve/reject)는 실 REST 가 존재 → adminFetch 로 타입드 호출.
//   (리스트/상세 READ 는 서버 컴포넌트 Prisma 단일 매핑 — 백엔드 0변경)
//   ⚠ 신규 백엔드 0 — 기존 /api/web/admin/organizations/[id]/* 재사용만.
// ============================================================

import { adminFetch } from "./client";
import { adminOrgActionSchema, type AdminOrgActionResult } from "./schemas";

// 단체 승인: POST .../approve (body 없음) → { success, name, status }
export async function approveOrganization(
  id: string,
  signal?: AbortSignal
): Promise<AdminOrgActionResult> {
  return adminFetch(`/api/web/admin/organizations/${id}/approve`, {
    method: "POST",
    schema: adminOrgActionSchema,
    signal,
  });
}

// 단체 반려: POST .../reject (body { reason }) → { success, name, status }
//   reason 은 camel→snake 변환 대상 없음(단어 1개) → 그대로 전송.
export async function rejectOrganization(
  id: string,
  reason: string,
  signal?: AbortSignal
): Promise<AdminOrgActionResult> {
  return adminFetch(`/api/web/admin/organizations/${id}/reject`, {
    method: "POST",
    body: { reason },
    schema: adminOrgActionSchema,
    signal,
  });
}
