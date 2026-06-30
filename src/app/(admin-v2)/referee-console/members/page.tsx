// ============================================================
// referee-console/members/page.tsx — 심판 명단 (정본 referee-pages RF_REFS 1:1)
//   ★글로벌 super 스코프 — 협회 필터 0(전 협회 심판 통합). 목록 READ only.
//   서버 컴포넌트 Prisma 직접 READ → 클라(_members) SchemaList.
//   - 등급 = referee.level(DB enum) 매핑(정본 1/2/3급은 cert_grade 데모 → DB 컬럼 사용).
//   - 배정 수 = _count.assignments / 활동지역 = region_sido·sigungu.
//   - 데이터 0행 → SchemaList Empty(mock 0).
//   ★컷오버 4-4b 배선: rows 의 id(=referee.id)로 _members 에서
//     rowHref(→상세 [id]) · addHref(→신규 new) 네비게이션을 건다. 본 페이지는 목록 데이터만 매핑.
// ============================================================

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  refereeName,
  levelBadge,
  refereeStatus,
  regionLabel,
  roleTypeLabel,
  avColor,
  getRefereeScope,
} from "../_referee-data";
import { MembersList, type RfMemberRow } from "./_members";

export const dynamic = "force-dynamic";

export default async function RefereeMembersPage() {
  // ★4-2 스코프 — 협회 admin 은 자기 협회 심판만(referee.association_id), 전역=전 협회.
  const scope = await getRefereeScope();
  if (!scope) notFound();

  // 심판 목록(스코프 필터) — 최근 등록 우선. 표시 필드만 select.
  const referees = await prisma.referee.findMany({
    where: scope.isSuper ? {} : { association_id: scope.associationId },
    orderBy: { created_at: "desc" },
    take: 200,
    select: {
      id: true,
      registered_name: true,
      verified_name: true,
      level: true,
      role_type: true,
      region_sido: true,
      region_sigungu: true,
      status: true,
      match_status: true,
      _count: { select: { assignments: true } },
    },
  });

  const rows: RfMemberRow[] = referees.map((r, i) => {
    const lv = levelBadge(r.level);
    const stt = refereeStatus(r.status);
    return {
      id: r.id.toString(),
      name: refereeName(r),
      sub: `${roleTypeLabel(r.role_type)} · ${
        r.match_status === "matched" ? "매칭" : "미매칭"
      }`,
      color: avColor(i),
      grade: "badge",
      badge: lv.label,
      tone: lv.tone,
      region: regionLabel(r.region_sido, r.region_sigungu),
      games: r._count.assignments,
      st: stt.st,
      sttone: stt.sttone,
    };
  });

  return <MembersList rows={rows} />;
}
