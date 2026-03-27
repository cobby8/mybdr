import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  createCourtAction,
  updateCourtAction,
  deleteCourtAction,
} from "@/app/actions/admin-courts";

export const dynamic = "force-dynamic";

// 코트 유형 라벨
const COURT_TYPE_LABEL: Record<string, string> = {
  indoor: "실내",
  outdoor: "실외",
};

// 코트 상태 라벨/뱃지
const STATUS_LABEL: Record<string, string> = {
  active: "운영중",
  inactive: "비활성",
};
const STATUS_BADGE: Record<string, "success" | "error"> = {
  active: "success",
  inactive: "error",
};

// 관리자 코트 관리 페이지
export default async function AdminCourtsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // 검색: 코트명 또는 주소로 필터링
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { address: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  // 코트 목록 + 전체 개수 병렬 조회
  const [courts, totalCount] = await Promise.all([
    prisma.court_infos.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        district: true,
        court_type: true,
        status: true,
        is_free: true,
        reviews_count: true,
        created_at: true,
      },
    }),
    prisma.court_infos.count({ where }),
  ]);

  return (
    <div>
      {/* 공통 헤더: 제목 + 부제 + 검색 */}
      <AdminPageHeader
        title="코트 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="코트명, 주소 검색"
        searchDefaultValue={q ?? ""}
      />

      {/* 코트 등록 폼 */}
      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-bold text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined mr-1 align-middle text-base">add_circle</span>
          새 코트 등록
        </h2>
        <form action={createCourtAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">코트명 *</label>
            <input
              name="name"
              required
              placeholder="예: 서울숲 농구장"
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">주소 *</label>
            <input
              name="address"
              required
              placeholder="예: 서울시 성동구 ..."
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">도시 *</label>
            <input
              name="city"
              required
              placeholder="예: 서울"
              className="w-24 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">구/군</label>
            <input
              name="district"
              placeholder="예: 성동구"
              className="w-24 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">유형 *</label>
            <select
              name="court_type"
              defaultValue="outdoor"
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
            >
              <option value="outdoor">실외</option>
              <option value="indoor">실내</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            등록
          </button>
        </form>
      </Card>

      {/* 코트 목록 테이블 */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col />
              <col />
              <col className="w-[80px]" />
              <col className="w-[70px]" />
              <col className="w-[70px]" />
              <col className="w-[90px]" />
              <col className="w-[200px]" />
            </colgroup>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">코트명</th>
                <th className="px-5 py-4 font-medium">주소</th>
                <th className="px-5 py-4 font-medium">도시</th>
                <th className="px-5 py-4 font-medium">유형</th>
                <th className="px-5 py-4 font-medium">상태</th>
                <th className="px-5 py-4 font-medium">등록일</th>
                <th className="px-5 py-4 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {courts.map((c) => (
                <tr
                  key={c.id.toString()}
                  className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-elevated)] transition-colors"
                >
                  {/* 코트명 */}
                  <td className="px-5 py-3">
                    <span className="block truncate font-medium text-[var(--color-text-primary)]">
                      {c.name}
                    </span>
                  </td>
                  {/* 주소 */}
                  <td className="px-5 py-3 truncate text-[var(--color-text-muted)]">
                    {c.address}
                  </td>
                  {/* 도시 */}
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {c.city}
                    {c.district ? ` ${c.district}` : ""}
                  </td>
                  {/* 유형 */}
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {COURT_TYPE_LABEL[c.court_type] ?? c.court_type}
                  </td>
                  {/* 상태 */}
                  <td className="px-5 py-3">
                    <Badge variant={STATUS_BADGE[c.status] ?? "default"}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </Badge>
                  </td>
                  {/* 등록일 */}
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {c.created_at.toLocaleDateString("ko-KR")}
                  </td>
                  {/* 관리: 수정(인라인 폼) + 삭제 */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {/* 수정: 간단히 이름/유형만 인라인 수정 가능 */}
                      <form action={updateCourtAction} className="flex items-center gap-1">
                        <input type="hidden" name="court_id" value={c.id.toString()} />
                        <input type="hidden" name="name" value={c.name} />
                        <input type="hidden" name="address" value={c.address} />
                        <input type="hidden" name="city" value={c.city} />
                        <input type="hidden" name="district" value={c.district ?? ""} />
                        {/* 유형 토글: 실내 <-> 실외 */}
                        <input
                          type="hidden"
                          name="court_type"
                          value={c.court_type === "indoor" ? "outdoor" : "indoor"}
                        />
                        <button
                          type="submit"
                          className="rounded-[10px] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                          title={`${c.court_type === "indoor" ? "실외" : "실내"}로 변경`}
                        >
                          <span className="material-symbols-outlined text-sm">swap_horiz</span>
                        </button>
                      </form>
                      {/* 삭제 (소프트 삭제: inactive로 변경) */}
                      <form action={deleteCourtAction}>
                        <input type="hidden" name="court_id" value={c.id.toString()} />
                        <button
                          type="submit"
                          className="rounded-[10px] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                          title="비활성화(삭제)"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {courts.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            등록된 코트가 없습니다.
          </div>
        )}
      </Card>
    </div>
  );
}
