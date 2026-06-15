import { NextRequest, NextResponse } from "next/server";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import {
  buildCourtRef,
  encodeCourtKey,
  signCourtKey,
  getReadSecret,
} from "@/lib/live/court-key";

/**
 * GET /api/v1/matches/:id/scoreboard-url
 *
 * 앱(Flutter) → 서버. **JWT 인증**(requireRecorder — 비공개. PUBLIC 등록 금지).
 *
 * ── 왜 필요한가 ───────────────────────────────────────────────
 * 방송 담당이 OBS 브라우저소스에 넣을 "코트별 오버레이 full URL"을 받으려면 courtKey 가
 * 필요한데, 앱(LocalMatches)에는 대회/날짜/코트 컬럼이 없어 courtKey 를 조립할 수 없다.
 * 코트 묶기는 서버만 안다. 그래서 앱이 아는 매치 PK(server_id)만 주면, 서버가 그 매치의
 * tournamentId / scheduledAt / venue_id / court_number 로 courtKey + 읽기 key + full URL 을
 * 조립해 돌려준다. (기존 GET /live/courts/[courtKey]/key 와 동일한 HMAC·URL 조립을
 *  재사용하되, 앞단에 "matchId → courtKey resolve" 만 추가한 것이다.)
 *
 * 동작:
 *   1) requireRecorder(req, id)  — 해당 매치 권한 확인(401/403/404, 기존 라우트와 동형)
 *   2) findUnique → tournamentId / scheduledAt / venue_id / court_number (+ 코트 이름 폴백)
 *   3) buildCourtRef(venue_id, court_number)  — 둘 다 null 이면 코트 미배정 → 422
 *   4) scheduledAt → KST "YYYY-MM-DD"  (resolve-live-match 의 kstDateToUtcRange 와 역방향·동일 기준)
 *   5) encodeCourtKey → signCourtKey → 오버레이 페이지 full URL 조립
 *
 * 응답 200: { court_key, key, url, court, date }
 *   - url   = OBS 가 열 오버레이 웹페이지 full URL (theme=chroma 기본)
 *   - court = court_number 우선, 없으면 venue(코트) 이름 폴백 (표시용)
 *   - date  = KST YYYY-MM-DD
 *
 * ★응답은 apiSuccess(snake 변환)를 거치지 않고 NextResponse.json 으로 직접 반환한다.
 *   필드 이름(court_key/key/url/court/date)을 계약대로 정확히 유지하기 위함.
 */

/**
 * UTC DateTime → KST 기준 "YYYY-MM-DD".
 * scheduled_at 은 UTC 로 저장되므로(+9h) KST 날짜를 뽑는다.
 * ★resolve-live-match.kstDateToUtcRange 와 동일한 KST 기준이어야 courtKey 의 date 가
 *   읽기 측 resolve 와 매칭된다(타임존 함정 회피).
 */
function toKstDateString(utc: Date): string {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kst = new Date(utc.getTime() + KST_OFFSET_MS);
  // getUTC* 로 뽑아야 서버 로컬 타임존 영향 없이 "KST 로 이동시킨 시각"의 날짜가 나온다.
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1) 권한 검증 (matchId 반환). 실패 시 401/403/404 그대로 반환.
    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId } = auth as { matchId: bigint };

    // 2) 매치의 코트/일시 정보 조회 (+ 코트 이름은 폴백 표시용)
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: {
        tournamentId: true,
        scheduledAt: true,
        venue_id: true,
        court_number: true,
        venue_name: true,
        courts: { select: { name: true } },
      },
    });
    if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

    // scheduled_at 미설정(즉석경기 등)은 송출 대상 아님 — 날짜 축이 없어 courtKey 를 못 만든다.
    if (!match.scheduledAt) {
      return apiError("경기 일정이 지정되지 않아 송출 URL을 만들 수 없습니다.", 422);
    }

    // 3) 코트 참조 구성. venue_id 우선, 없으면 court_number 폴백. 둘 다 없으면 null.
    const courtRef = buildCourtRef(match.venue_id, match.court_number);
    if (courtRef === null) {
      return apiError("코트 미배정", 422);
    }

    // 4) KST 날짜
    const date = toKstDateString(match.scheduledAt);

    // 5) courtKey 인코딩 + 읽기 key 서명 (기존 헬퍼 그대로 — 신규 암호로직 0)
    const courtKey = encodeCourtKey({
      tournamentId: match.tournamentId,
      date,
      courtRef,
    });

    let key: string;
    try {
      getReadSecret(); // 미설정이면 throw → 명확한 500
      key = signCourtKey(courtKey);
    } catch {
      return apiError("서버 설정 오류: SCOREBOARD_READ_SECRET 미설정", 500);
    }

    // 오버레이 웹페이지(A-2) full URL. OBS 브라우저소스에 그대로 붙여 쓴다.
    // theme 은 오버레이 배경 결정용(기본 chroma=크로마키). c=courtKey, k=읽기 key.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mybdr.kr";
    const url = `${baseUrl}/obs/scoreboard?c=${courtKey}&k=${key}&theme=chroma`;

    // 표시용 코트 이름: court_number 우선, 없으면 코트(venue) 이름 폴백.
    const court =
      (match.court_number && match.court_number.trim() !== ""
        ? match.court_number.trim()
        : null) ??
      match.courts?.name ??
      match.venue_name ??
      null;

    // ★계약대로 정확한 필드명 유지(snake 변환 우회).
    return NextResponse.json(
      { court_key: courtKey, key, url, court, date },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/v1/matches/[id]/scoreboard-url]", err);
    return apiError("Internal server error", 500);
  }
}
