// ============================================================
// (admin-v2)/v2/(backoffice)/categories/page.tsx — 종별 마스터 콘솔 (컷오버 포팅)
//   레거시 (admin)/admin/categories/page.tsx 를 admin-v2 백오피스로 포팅.
//   서버 컴포넌트: 권한 가드 + READ(Prisma 직접)만 담당. CRUD UI 는 _categories(클라).
//
//   ⚠ 백엔드 0변경 — route/Prisma/스키마/server action 수정 0. 신규 API 0.
//     mutation 은 클라가 기존 REST(/api/web/admin/categories ·[id]) 를 adminFetch 로 호출.
//   ⚠ 권한 — /v2 layout 은 tournament_admin 까지 허용하지만, 종별 마스터는 레거시와 동일
//     super_admin 전용이다. 레거시 page.tsx 의 페이지 레벨 super 가드를 그대로 재현(신규 로직 0).
//   ⚠ 직렬화 — server prisma 는 camelCase(sortOrder). adminFetch 응답도 snake→camel 변환되어
//     camel(sortOrder) 로 들어오므로, 초기 데이터도 camel 로 맞춰 클라 타입과 정합시킨다.
// ============================================================

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { CategoriesConsole, type CategoryItem } from "./_categories";

export const dynamic = "force-dynamic";

export default async function AdminV2CategoriesPage() {
  // ── 페이지 단위 super_admin 방어 가드 (레거시 동일·기존 헬퍼 재사용) ──
  // /v2 layout 은 tournament_admin 도 통과시키므로, super 가 아니면 백오피스 홈으로 되돌린다.
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/v2");
  }

  // server prisma = camelCase(sortOrder). orderBy 도 camel 키(레거시 동일 쿼리).
  const rows = await prisma.adminCategory
    .findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
    .catch(() => []);

  // 직렬화: BigInt id → string, camel(sortOrder) 유지.
  // divisions/ages 는 Json(string[]) — 방어적으로 배열만 통과시킨다.
  const initial: CategoryItem[] = rows.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    divisions: Array.isArray(c.divisions) ? (c.divisions as string[]) : [],
    ages: Array.isArray(c.ages) ? (c.ages as string[]) : [],
    sortOrder: c.sortOrder,
  }));

  return <CategoriesConsole initial={initial} />;
}
