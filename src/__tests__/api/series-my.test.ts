/**
 * 2026-05-12 — GET /api/web/series/my (PR2) 회귀 가드.
 *
 * 검증 매트릭스:
 *   1) 비로그인 → 401 (withWebAuth 차단)
 *   2) 로그인 + 본인 시리즈 2건 + 타인 시리즈 1건 → 응답에 본인 것 2건만 (where organizer_id 필터)
 *   3) 본인 시리즈 중 organization 연결 있는 것 + null 인 것 → organization 필드 분기 정상
 *   4) 본인 시리즈 0건 → 빈 배열 + 200
 *
 * mock 전략:
 *   - next/headers cookies — withWebAuth 가 쿠키에서 JWT 추출. 비로그인 = 쿠키 없음 → unauthorized.
 *   - lib/auth/jwt verifyToken — 로그인 케이스에서 ORGANIZER_ID 세션 반환.
 *   - lib/db/prisma — tournament_series.findMany 결과만 spy.
 *   - apiSuccess 의 snake_case 변환은 body 키만 변환 — organization 등 nested object 의 키도 변환됨.
 *     테스트는 NextResponse.json() 결과 body 를 직접 검증 (Response.json() 으로 파싱).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const ORGANIZER_ID = BigInt(100);
const OTHER_USER_ID = BigInt(200);

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

/**
 * mock setup — cookies / verifyToken / prisma 격리.
 * @param opts.loggedIn — false 면 cookies.get() 가 undefined 반환 (비로그인)
 * @param opts.seriesRows — prisma.tournament_series.findMany 결과
 */
function setupMocks(opts: {
  loggedIn: boolean;
  seriesRows: Array<{
    id: bigint;
    name: string;
    organization: { id: bigint; name: string; slug: string } | null;
  }>;
}) {
  // next/headers cookies mock — 로그인 여부 분기.
  vi.doMock("next/headers", () => ({
    cookies: vi.fn().mockResolvedValue({
      get: (_name: string) => (opts.loggedIn ? { value: "fake-token" } : undefined),
    }),
  }));

  // verifyToken mock — 로그인이면 JWT payload, 비로그인은 호출 안 됨 (쿠키 없으므로).
  vi.doMock("@/lib/auth/jwt", () => ({
    verifyToken: vi.fn().mockResolvedValue(
      opts.loggedIn
        ? { sub: String(ORGANIZER_ID), role: "user" }
        : null,
    ),
  }));

  // prisma mock — findMany 결과만 spy.
  const findManyMock = vi.fn().mockResolvedValue(opts.seriesRows);
  vi.doMock("@/lib/db/prisma", () => ({
    prisma: {
      tournament_series: {
        findMany: findManyMock,
      },
    },
  }));

  return { findManyMock };
}

describe("GET /api/web/series/my — 본인 시리즈 드롭다운 (PR2)", () => {
  it("1) 비로그인 → 401", async () => {
    setupMocks({ loggedIn: false, seriesRows: [] });

    const { GET } = await import("@/app/api/web/series/my/route");
    // withWebAuth 시그니처 — (req, ctx) 형태로 호출되지만 ctx 미사용. 빈 객체 전달.
    const res = await GET(new Request("http://localhost/api/web/series/my"));

    expect(res.status).toBe(401);
  });

  it("2) 로그인 + where 절에 organizer_id=본인 + status=active 필터 적용", async () => {
    const { findManyMock } = setupMocks({
      loggedIn: true,
      // findMany 가 이미 where 로 본인 것만 SELECT — 응답엔 2건만 와야 함.
      seriesRows: [
        {
          id: BigInt(8),
          name: "내 시리즈 A",
          organization: { id: BigInt(3), name: "강남구농구협회", slug: "org-ny6os" },
        },
        {
          id: BigInt(12),
          name: "내 시리즈 B",
          organization: null,
        },
      ],
    });

    const { GET } = await import("@/app/api/web/series/my/route");
    const res = await GET(new Request("http://localhost/api/web/series/my"));

    expect(res.status).toBe(200);
    // where 절 검증 — organizer_id 필터링 의무.
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizer_id: ORGANIZER_ID,
          status: "active",
        }),
      }),
    );
    // 응답 body 검증
    const body = await res.json();
    // apiSuccess 가 한 번 더 래핑 → { data: { data: [...] } } 형태.
    // route 가 apiSuccess({ data }) 호출 + apiSuccess 가 키 변환 시 data 키 그대로 유지.
    expect(body.data).toHaveLength(2);
  });

  it("3) organization 연결 있는 것 + null 인 것 분기 정상", async () => {
    setupMocks({
      loggedIn: true,
      seriesRows: [
        {
          id: BigInt(8),
          name: "BDR 시리즈",
          organization: { id: BigInt(3), name: "강남구농구협회", slug: "org-ny6os" },
        },
        {
          id: BigInt(12),
          name: "내 단독 시리즈",
          organization: null,
        },
      ],
    });

    const { GET } = await import("@/app/api/web/series/my/route");
    const res = await GET(new Request("http://localhost/api/web/series/my"));

    expect(res.status).toBe(200);
    const body = await res.json();
    const list = body.data as Array<{
      id: string;
      name: string;
      organization: { id: string; name: string; slug: string } | null;
    }>;

    // (a) BigInt → 문자열 직렬화 검증
    expect(list[0].id).toBe("8");
    expect(list[1].id).toBe("12");

    // (b) organization 연결 있을 때
    expect(list[0].organization).not.toBeNull();
    expect(list[0].organization?.id).toBe("3");
    expect(list[0].organization?.name).toBe("강남구농구협회");
    expect(list[0].organization?.slug).toBe("org-ny6os");

    // (c) organization 미연결 (null) 시 그대로 null
    expect(list[1].organization).toBeNull();
  });

  it("4) 본인 시리즈 0건 → 빈 배열 + 200", async () => {
    setupMocks({ loggedIn: true, seriesRows: [] });

    const { GET } = await import("@/app/api/web/series/my/route");
    const res = await GET(new Request("http://localhost/api/web/series/my"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it("5) 타인 시리즈 mock 에 섞여도 prisma 가 where 로 1차 차단 — route 가 추가 필터링 안 하는지 확인", async () => {
    // 실제 DB 는 where 가 차단하지만, 본 테스트는 findMany 가 받은 row 를 그대로 직렬화하는지만 검증.
    // (만약 route 코드에 추가 필터링 버그가 들어가면 catch — 현재는 mock 결과 그대로 통과 expected.)
    setupMocks({
      loggedIn: true,
      // mock 이라 타인 row 도 prisma 가 통과시킨 척 — route 단에서 추가 필터링 의도 없음을 확인.
      seriesRows: [
        {
          id: BigInt(8),
          name: "내 시리즈",
          organization: null,
        },
        {
          // 실제 DB 에서는 where 가 막아야 하지만 mock 통과 — route 가 그대로 직렬화하면 OK
          // (where 의무는 case 2 가 검증).
          id: BigInt(99),
          name: "(가상) 타인 시리즈",
          organization: null,
        },
      ],
    });

    const { GET } = await import("@/app/api/web/series/my/route");
    const res = await GET(new Request("http://localhost/api/web/series/my"));

    expect(res.status).toBe(200);
    const body = await res.json();
    // 2건 그대로 직렬화 — route 단에 user-side 추가 필터링 없음 (DB where 가 단일 source).
    expect(body.data).toHaveLength(2);
  });
});

// type stub — TS noUnusedLocal 회피용
export type _OtherUserCheck = typeof OTHER_USER_ID;
