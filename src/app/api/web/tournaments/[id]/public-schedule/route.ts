import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 일정 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-schedule
 *
 * 대회 상세 페이지에서 "일정" 탭 클릭 시 호출
 * 기존 page.tsx의 scheduleRawMatches + scheduleRawTeams 쿼리를 그대로 사용
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // UUID 형식 검증
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  const [matches, teams] = await Promise.all([
    // 일정 탭: 경기 목록
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: { scheduledAt: "asc" },
      include: {
        // Phase 2C: 일정 카드 팀명 한/영 표시를 위해 name_en/name_primary 포함
        // 2026-05-02: 일정 탭 매치 카드 팀 로고 표시를 위해 logoUrl 추가
        // 4단계 C: 일정 카드 팀명 클릭 → 팀페이지 이동을 위해 team.id 추가 select (페이로드 미미 증가)
        homeTeam: { include: { team: { select: { id: true, name: true, name_en: true, name_primary: true, logoUrl: true } } } },
        awayTeam: { include: { team: { select: { id: true, name: true, name_en: true, name_primary: true, logoUrl: true } } } },
      },
    }),
    // 일정 탭: 참가팀 목록
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      select: {
        id: true,
        // Phase 2C: 팀 필터 버튼 라벨 한/영 표시
        team: { select: { name: true, name_en: true, name_primary: true } },
      },
      orderBy: { team: { name: "asc" } },
    }),
  ]);

  // 직렬화 (page.tsx의 scheduleMatches/scheduleTeams 변환 로직과 동일)
  const serializedMatches = matches.map((m) => {
    // 2026-05-02: 팀 미확정 매치의 slot 라벨 추출
    // 왜? 일정 카드에서 "TBD" 대신 generator 가 부여한 의미있는 라벨
    // (예: "A조 1경기 패자" / "8강 1경기 승자") 를 보여주기 위함.
    // 데이터 출처 = tournament_matches.settings JSON (dual-tournament-generator 등이 저장).
    // public-bracket route 와 동일한 추출 패턴 사용 → 일관성 유지.
    //
    // 2026-05-15 — division_code 추출 (강남구협회장배 6 종별 분리 UI 용).
    //   설정 박제: division-generator-modal cross-product / 종별 관리 페이지 PATCH.
    //   예: "i2-U11" / "i3-U9" / "i3w-U12" — 종별·체육관 분리 표시 root key.
    const settings = m.settings as {
      homeSlotLabel?: string;
      awaySlotLabel?: string;
      division_code?: string;
    } | null;

    return {
      id: m.id.toString(),
      homeTeamName: m.homeTeam?.team.name ?? null,
      // Phase 2C: 일정 카드에서 한 줄 대표 언어 표기용
      homeTeamNameEn: m.homeTeam?.team.name_en ?? null,
      homeTeamNamePrimary: m.homeTeam?.team.name_primary ?? null,
      // 2026-05-02: 일정 탭 매치 카드 팀 로고 표시 (TBD/예정 매치는 null → fallback 렌더)
      homeTeamLogoUrl: m.homeTeam?.team.logoUrl ?? null,
      // 4단계 C: 팀명 클릭 → /teams/{id} 이동용. BigInt → string 직렬화 (TBD 매치는 null).
      homeTeamId: m.homeTeam?.team.id?.toString() ?? null,
      awayTeamName: m.awayTeam?.team.name ?? null,
      awayTeamNameEn: m.awayTeam?.team.name_en ?? null,
      awayTeamNamePrimary: m.awayTeam?.team.name_primary ?? null,
      awayTeamLogoUrl: m.awayTeam?.team.logoUrl ?? null,
      // 4단계 C: 어웨이 팀 ID — 동일 패턴
      awayTeamId: m.awayTeam?.team.id?.toString() ?? null,
      // 2026-05-02: 미정 매치 라벨 (팀 확정 시 무시됨, fallback 우선순위: 팀명 > slotLabel > "미정")
      homeSlotLabel: settings?.homeSlotLabel ?? null,
      awaySlotLabel: settings?.awaySlotLabel ?? null,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      roundName: m.roundName,
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
      courtNumber: m.court_number,
      // 2026-05-02: 일정 카드 콤팩트 + 매치번호 표시 (사용자 요청)
      matchNumber: m.match_number,
      groupName: m.group_name,
      // Phase 5 (매치 코드 v4) — 일정 카드에 글로벌 코드 표시
      // null 가능: short_code/region_code 미부여 대회의 매치는 null
      // 클라이언트는 NULL 안전 분기로 매치번호 fallback
      matchCode: m.match_code,
      // 2026-05-15 — 강남구협회장배 6 종별 × 2 체육관 분리 UI (PR-G3).
      //   division: 종별 코드 (예: "i2-U11"). null = 종별 미부여 (단일 종별 대회).
      //   venueName: 체육관 이름 (예: "수도공고"). null = 체육관 미부여.
      division: settings?.division_code ?? null,
      venueName: m.venue_name,
    };
  });

  const serializedTeams = teams.map((t) => ({
    id: t.id.toString(),
    name: t.team.name,
    // Phase 2C: 팀 필터 버튼 한 줄 대표 언어 표기용
    nameEn: t.team.name_en,
    namePrimary: t.team.name_primary,
  }));

  return apiSuccess({ matches: serializedMatches, teams: serializedTeams });
}
