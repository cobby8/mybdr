import { adminFetch } from "../client";
import type {
  AdminOrganizationSummary,
  AdminOrganizationsResponse,
} from "../types";

/**
 * 단체(organizations) 타입드 엔드포인트 — 대회관리자 셸 "단체·주최" 화면.
 * route: GET /api/web/organizations (내가 멤버인 단체 목록 — withWebAuth scoped)
 *
 * 레거시 단체 페이지(tournament-admin/organizations/page.tsx)가 raw fetch 로 쓰던 그 source.
 * adminFetch 가 응답 snake→camel 변환 + `{ organizations }` 래핑이라 여기서 배열만 언래핑.
 */
export function listMyOrganizations(
  signal?: AbortSignal
): Promise<AdminOrganizationSummary[]> {
  return adminFetch<AdminOrganizationsResponse>("/api/web/organizations", {
    signal,
  }).then((res) => res.organizations ?? []);
}
