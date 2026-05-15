import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { calculateSetupProgress, canPublish } from "@/lib/tournaments/setup-status";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/web/tournaments/[id]/site/publish
// body: { publish: boolean }
//
// 2026-05-13 UI-5 — 공개 게이트:
//   publish=true 진입 시 setup-status.ts 의 필수 7항목 검증.
//   미충족 시 400 + missing 배열 응답. 클라이언트 disabled 만으론 DevTools 우회 가능 → 서버 가드 필수.
//   publish=false (비공개 전환) 는 게이트 무관 (즉시 허용).
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: { publish?: boolean } = {};
  try {
    body = await req.json();
  } catch { /* optional */ }

  const site = await prisma.tournamentSite.findFirst({ where: { tournamentId: id } });
  if (!site)
    return apiError("사이트가 없습니다. 먼저 사이트를 설정하세요.", 404);

  const publish = body.publish ?? !site.isPublished;

  // ⭐ 2026-05-13 UI-5 — 공개 게이트 (publish=true 일 때만 검증, 비공개 전환은 무조건 허용)
  if (publish) {
    // 이유: setup-status.ts 의 calculateSetupProgress 입력 형태 그대로 조립 (단일 source).
    //   over-fetch 회피 — 필요한 필드 + relations 만 include.
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        divisionRules: { select: { format: true, settings: true } },
        _count: { select: { tournamentMatches: true } },
      },
    });
    if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

    const progress = calculateSetupProgress(
      id,
      {
        name: tournament.name,
        startDate: tournament.startDate,
        venue_name: tournament.venue_name,
        series_id: tournament.series_id,
        maxTeams: tournament.maxTeams,
        entry_fee: tournament.entry_fee,
        auto_approve_teams: tournament.auto_approve_teams,
        settings: tournament.settings,
      },
      {
        divisionRules: tournament.divisionRules.map((r) => ({
          format: r.format,
          settings: r.settings,
        })),
        hasTournamentSite: true, // 위에서 site 존재 확인 완료
        isSitePublished: !!site.isPublished, // 현재 상태 (boolean 강제 — Prisma nullable 대응)
        matchesCount: tournament._count.tournamentMatches,
      }
    );

    const gate = canPublish(progress);
    if (!gate.ok) {
      // 클라이언트가 missing 배열을 파싱해 상세 안내 노출 가능하도록 response.details 박제
      // 3번째 = code (PUBLISH_GATE_FAILED), 4번째 = extra (missing 배열) — 클라이언트가 상세 안내용으로 파싱
      return apiError(
        `필수 셋업 항목이 완료되지 않았습니다: ${gate.missing.join(", ")}`,
        400,
        "PUBLISH_GATE_FAILED",
        { missing: gate.missing }
      );
    }
  }

  // 2026-05-15 (Option B — 단일 source 보강) — 이전엔 tournamentSite.isPublished 만
  // 토글해서 메인/검색/피드 (= tournament.is_public 필터) 가 stale 인 회귀.
  // wizard 코멘트 "단일 source" 의도와 일치 = 운영자 1회 클릭으로 메인 노출까지 완료.
  // atomic 보장 위해 $transaction 으로 동시 update.
  const [updated] = await prisma.$transaction([
    prisma.tournamentSite.update({
      where: { id: site.id },
      data: {
        isPublished: publish,
        ...(publish && !site.published_at && { published_at: new Date() }),
      },
    }),
    prisma.tournament.update({
      where: { id },
      data: { is_public: publish },
    }),
  ]);

  return apiSuccess(updated);
}
