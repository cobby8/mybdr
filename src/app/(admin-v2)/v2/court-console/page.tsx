// ============================================================
// (admin-v2)/v2/court-console/page.tsx — R2-C 코트 콘솔(BO-4)
//   탭 2(실내/야외). 정본 bo-pages courtConsole 에서 partner(제휴) 탭 제외.
//   ⚠ 백엔드 0변경 — 리스트 READ 는 서버 컴포넌트 Prisma 단일 매핑(snake→표시값 1곳).
//   매핑(확정): 실내=court_infos.court_type="indoor" / 야외="outdoor".
//   partner 제외 사유: court_type "partner" 값 0건 · partners 테이블 0건(DB 미지원).
//   레거시 /admin/courts 의 court_infos 직접조회 패턴을 동일 재현.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import type { AdminBoCourtRow } from "@/lib/admin-v2/data";
import { CourtConsole } from "./_console";

export const dynamic = "force-dynamic";

// 아바타 색 팔레트(정본 av — 데이터 주입용, 컴포넌트 하드코딩 아님)
const AV = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];

// court_infos.status → 표시 라벨/톤 (active 기본)
function courtStatus(s: string): { st: string; sttone: string } {
  if (s === "active") return { st: "운영중", sttone: "ok" };
  if (s === "pending") return { st: "승인대기", sttone: "warn" };
  if (s === "inactive") return { st: "비활성", sttone: "mute" };
  if (s === "closed") return { st: "폐쇄", sttone: "mute" };
  return { st: s, sttone: "mute" };
}

export default async function AdminV2CourtConsole() {
  // court_infos 를 court_type 별로 병렬 조회 — 예약 수(court_bookings) _count 동반.
  const courtSelect = {
    id: true,
    name: true,
    address: true,
    city: true,
    district: true,
    status: true,
    _count: { select: { court_bookings: true } },
  } as const;
  const courtQuery = (court_type: string) =>
    prisma.court_infos.findMany({
      where: { court_type },
      orderBy: { created_at: "desc" },
      take: 50,
      select: courtSelect,
    });

  const [indoor, outdoor] = await Promise.all([
    courtQuery("indoor"),
    courtQuery("outdoor"),
  ]);

  // ── snake → 표시 도메인 단일 매핑 ──
  type CourtRecord = (typeof indoor)[number];
  const mapCourts = (rows: CourtRecord[]): AdminBoCourtRow[] =>
    rows.map((c, i) => {
      const { st, sttone } = courtStatus(c.status);
      const region = [c.city, c.district].filter(Boolean).join(" ") || "-";
      return {
        id: c.id.toString(),
        name: c.name,
        sub: c.address, // 아바타 보조줄 = 주소(정본은 "실내 · 5면" — DB는 주소로 대체)
        color: AV[i % AV.length],
        region,
        // 정본 라벨 "월 예약" — DB 는 court_bookings 전체 예약 수(월 분할 데이터 없음·보고)
        bookings: `${c._count.court_bookings}`,
        st,
        sttone,
      };
    });

  return <CourtConsole indoor={mapCourts(indoor)} outdoor={mapCourts(outdoor)} />;
}
