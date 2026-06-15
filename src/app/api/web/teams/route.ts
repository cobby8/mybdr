import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";
// Admin Console S1-4: 로그인 사용자에게 "내 검수대기 팀" 을 추가 노출하기 위한 세션/상수
import { getWebSession } from "@/lib/auth/web-session";
import { TEAM_STATUS } from "@/lib/constants/team-status";

/**
 * GET /api/web/teams
 *
 * 팀 목록 + 도시 목록을 한번에 반환하는 공개 API
 * - 인증 불필요 (공개 목록)
 * - 쿼리 파라미터: q(검색), city(도시)
 * - BigInt 필드를 JSON 직렬화 가능한 형태로 변환
 */
export async function GET(request: NextRequest) {
  // 공개 API — IP 기반 rate limit (분당 100회)
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`web-teams:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  try {
    const { searchParams } = request.nextUrl;

    // 쿼리 파라미터 추출
    const q = searchParams.get("q") || undefined;
    const city = searchParams.get("city") || undefined;
    // A-1 (2026-04-29): v2 정렬 칩 — newest(최신), members(멤버 많은 순), wins(승순=기본)
    // 이유: v2 헤더 chip-bar 에 정렬 옵션 노출. 화이트리스트로만 받아 SQL 인젝션/잘못된 키 차단.
    const sort = searchParams.get("sort") || undefined;

    // Admin Console S1-4: 가시성(검수 상태) 분기 — 옵션2.
    // 왜: 신규 팀이 pending_review 로 생성되므로 모두에게 숨기면 생성자가 본인 팀을 못 본다.
    //   비로그인/타인 = 기존과 100% 동일(active + is_public). 로그인 사용자에게만
    //   "내 검수대기 팀(주장 or 멤버)" 을 OR 로 추가한다.
    // 어떻게: getWebSession 을 시도하되 실패/미로그인은 비로그인으로 폴백(공개 API 보장).
    let visibilityWhere: Record<string, unknown> = {
      // 비로그인/타인 기본: 검수 통과 + 공개 팀만 (현행 유지 → 회귀 0)
      status: TEAM_STATUS.ACTIVE,
      is_public: true,
    };

    let session = null;
    try {
      session = await getWebSession();
    } catch {
      session = null; // 세션 조회 실패해도 공개 목록은 정상 동작해야 함
    }

    if (session) {
      const myId = BigInt(session.sub);
      // 로그인 사용자: ① 공개 active 팀 + ② 내가 주장인 검수대기 팀 +
      //   ③ 내가 멤버로 속한 검수대기 팀. (타인 검수대기 팀은 여전히 숨김)
      visibilityWhere = {
        OR: [
          { status: TEAM_STATUS.ACTIVE, is_public: true },
          { status: TEAM_STATUS.PENDING_REVIEW, captainId: myId },
          {
            status: TEAM_STATUS.PENDING_REVIEW,
            teamMembers: { some: { userId: myId } },
          },
        ],
      };
    }

    // where 조건 구성 — 가시성 + 검색/도시 필터를 AND 로 결합.
    // 이유: 가시성에 OR 가 들어갈 수 있으므로, q 의 OR(이름 검색)과 충돌하지 않게
    //   최상위 AND 배열로 묶는다(같은 OR 키 덮어쓰기 방지).
    const andClauses: Record<string, unknown>[] = [visibilityWhere];

    // 검색어가 있으면 팀 이름(한글/영문 동시)으로 부분 검색
    // Phase 2A-2: name_en이 있는 팀은 영문 키워드(eagle 등)로도 찾을 수 있도록 OR 조건 적용
    if (q) {
      andClauses.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { name_en: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    // 도시 필터 ("all"이 아닌 경우에만 적용)
    if (city && city !== "all") {
      andClauses.push({ city: { contains: city, mode: "insensitive" } });
    }

    const where: Record<string, unknown> = { AND: andClauses };

    // A-1: 정렬 옵션 결정 (화이트리스트 — wins/newest/members 만 허용)
    // - wins (기본): 승수 desc → 최신 desc (기존)
    // - newest: 최신 가입(생성) desc
    // - members: _count.teamMembers desc (Prisma 가 _relation 정렬 지원)
    type TeamOrderBy = NonNullable<Parameters<typeof prisma.team.findMany>[0]>["orderBy"];
    let orderBy: TeamOrderBy;
    if (sort === "newest") {
      orderBy = [{ createdAt: "desc" }];
    } else if (sort === "members") {
      // Prisma: 관계 카운트 정렬은 _count.<relation> 형태로 표기
      orderBy = [{ teamMembers: { _count: "desc" } }, { createdAt: "desc" }];
    } else {
      orderBy = [{ wins: "desc" }, { createdAt: "desc" }];
    }

    // 팀 목록 + 도시 목록 병렬 조회 (네트워크 요청 1회로 최적화)
    const [teams, citiesRaw] = await Promise.all([
      prisma.team.findMany({
        where,
        orderBy,
        take: 60,
        select: {
          id: true,
          name: true,
          // Phase 2A-2: 영문명/대표언어 필드 (이후 UI에서 "상단 언어" 스위칭에 사용)
          name_en: true,
          name_primary: true,
          primaryColor: true,
          secondaryColor: true,
          // 로고 URL — 있으면 이미지, 없으면 city 기반 플레이스홀더로 렌더링
          logoUrl: true,
          city: true,
          district: true,
          wins: true,
          losses: true,
          accepting_members: true,
          tournaments_count: true,
          // A-1: 카드 v2 의 "창단 YYYY" 표시에 필요 — 응답 직렬화에 createdAt 포함
          createdAt: true,
          _count: { select: { teamMembers: true } },
        },
      }).catch(() => []),
      prisma.team.groupBy({
        by: ["city"],
        where: { city: { not: null }, status: "active", is_public: true },
        orderBy: { _count: { city: "desc" } },
        take: 30,
      }).catch(() => []),
    ]);

    // 도시 목록에서 null 제거
    const cities = citiesRaw.map((r) => r.city!).filter(Boolean);

    // BigInt 필드를 string으로 변환 (JSON 직렬화 불가능하므로)
    const serializedTeams = teams.map((t) => ({
      id: t.id.toString(),                         // BigInt -> string
      name: t.name,
      // Phase 2A-2: 영문명/대표언어도 응답에 포함
      // → Phase 2C에서 UI가 name_primary 기준으로 상단 언어를 스위칭할 수 있게 필드를 내려줌
      name_en: t.name_en,
      name_primary: t.name_primary,
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      // 로고 URL — 프론트에서 이미지/플레이스홀더 분기 판단용
      logoUrl: t.logoUrl,
      city: t.city,
      district: t.district,
      wins: t.wins,
      losses: t.losses,
      acceptingMembers: t.accepting_members,
      tournamentsCount: t.tournaments_count,
      memberCount: t._count.teamMembers,            // _count를 평탄화
      // A-1: 카드 v2 의 "창단 YYYY" 표시 — Date → ISO string 직렬화
      createdAt: t.createdAt ? t.createdAt.toISOString() : null,
    }));

    // 1분 캐시: 팀 목록은 비교적 정적이므로 CDN/브라우저 캐시 활용
    const response = apiSuccess({ teams: serializedTeams, cities });
    response.headers.set("Cache-Control", "public, s-maxage=60, max-age=60");
    return response;
  } catch (error) {
    console.error("[GET /api/web/teams] Error:", error);
    return apiError("팀 목록을 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
