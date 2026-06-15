import { NextRequest, NextResponse } from "next/server";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { scoreboardStateSchema } from "@/lib/validation/scoreboard";

/**
 * POST /api/v1/matches/:id/scoreboard
 *
 * 앱(Flutter) → 서버 쓰기. {id} = TournamentMatch PK(BigInt, 앱 server_id).
 * - 인증: requireRecorder(해당 매치 권한자만) — status/events 라우트와 동형.
 * - body = OBS state JSON(계약 §3) → Zod 검증.
 * - 동작: live_scoreboards upsert(matchId 키). 매치당 1행, 최신 state만 유지.
 *
 * ★payload 보존: 받은 JSON(camelCase 키: scoreH 등)을 그대로 Json 컬럼에 저장한다.
 *   apiSuccess/convertKeysToSnakeCase 를 쓰지 않는 이유 = 읽기 측에서 통짜로 다시 내보내야
 *   오버레이가 깨지지 않기 때문. 응답은 단순 {ok:true}.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId } = auth as { matchId: bigint };

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("잘못된 요청입니다.", 400);
    }

    const parsed = scoreboardStateSchema.safeParse(body);
    if (!parsed.success) return apiError("유효하지 않은 스코어보드 데이터입니다.", 400);

    // ★ parsed.data 를 그대로 payload 로 저장(camelCase 키 보존).
    //   Prisma Json 입력 타입에 맞추기 위해 unknown→Prisma.InputJsonValue 로 캐스팅.
    const payload = parsed.data as unknown as object;

    await prisma.liveScoreboard.upsert({
      where: { matchId },
      create: { matchId, payload },
      update: { payload },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/v1/matches/[id]/scoreboard]", err);
    return apiError("Internal server error", 500);
  }
}
