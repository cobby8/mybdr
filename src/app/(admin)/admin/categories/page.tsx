import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { CategoriesContent, type CategoryItem } from "./categories-content";

export const dynamic = "force-dynamic";

/**
 * 종별 마스터 관리 (Track B) — 서버 컴포넌트: 가드 + 데이터 패칭만.
 *
 * - admin layout 1차 가드 위에 페이지 단위 방어 가드 추가(super_admin).
 * - prisma.adminCategory.findMany (server = camelCase: c.sortOrder).
 * - BigInt id → string · sortOrder → sort_order 로 직렬화해 클라로 전달.
 *   ⚠ 클라(content)의 fetch 응답은 apiSuccess 의 snake (sort_order) 이므로,
 *     초기 데이터 형태를 동일하게 snake 로 맞춰 혼동을 차단한다(errors.md 재발 6회).
 */
export default async function AdminCategoriesPage() {
  // ── 페이지 단위 super_admin 방어 가드 ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/admin");
  }

  // server prisma = camelCase (sortOrder). orderBy 도 camel 키.
  const rows = await prisma.adminCategory
    .findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
    .catch(() => []);

  // 직렬화: BigInt → string, camel(sortOrder) → snake(sort_order).
  // divisions/ages 는 Json(string[]) — 방어적으로 배열만 통과시킨다.
  const initial: CategoryItem[] = rows.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    divisions: Array.isArray(c.divisions) ? (c.divisions as string[]) : [],
    ages: Array.isArray(c.ages) ? (c.ages as string[]) : [],
    sort_order: c.sortOrder,
  }));

  return (
    // Track B (Toss 전환) — 페이지 루트에만 data-skin="toss" opt-in (content 는 DOM 상속)
    <div data-skin="toss">
      <CategoriesContent initial={initial} />
    </div>
  );
}
