/**
 * GET /api/web/admin/game-reports/stats — super_admin 매너 통계 (Phase 2C · UD2 · BG2)
 *
 * 왜 (이유):
 * - 기존 /admin/game-reports 는 "신고 큐"(flags 달린 개별 리포트)만 보여준다.
 * - UD2 시안은 그 위에 "매너 통계" + "30일 추세" 탭을 추가한다.
 * - ⚠️ BG2 사용자 결재 룰: 마이페이지 "내 매너" 카드(UC1, /api/web/me/activity?type=manner)
 *   와 동일하게 **평균 평점 + 받은 flag "종류"(키워드)만** 노출. flag별 "개별 건수"는
 *   집계/노출 금지. 즉 "no_show 3회" 같은 건수는 절대 만들지 않는다.
 *   → UC1 의 집계 원칙(평균 = rating 합/건수, flagKinds = Set distinct)을 그대로 따른다.
 *
 * 어떻게:
 * - super_admin 가드 (org-permission.ts isSuperAdmin) — 기존 game-reports route 와 동일
 * - 최근 30일 game_player_ratings 를 한 번 조회 후 메모리 집계 (테이블 0건이면 빈 통계)
 * - 통계 종류:
 *   1) total_evaluations(전체 건수) / avg_rating(평균) / report_rate(flags 있는 비율)
 *      / top_flag(가장 많이 등장한 flag "종류")
 *   2) distribution: 평점 1~5 구간별 비율(%) — 개별 평가자/본문 ❌, 비율만
 *   3) top_users: 평균 4.5+ & 평가 10+ 상위 매너 사용자 (평균만)
 *   4) low_users: 평균 3.0- 또는 flags 누적 5+ 하위 사용자 (평균 + flag "종류"만)
 *   5) trend: 일자별 평균/건수 (30일)
 *
 * NOTE:
 * - 응답은 apiSuccess() → 자동 snake_case 변환 (errors.md 2026-04-17). 프론트 snake_case 접근.
 * - DB 실측(2026-05-29): game_player_ratings 0건 → 모든 통계 빈/0 으로 반환 (mock ❌).
 * - flag별 "개별 건수"는 응답에 절대 포함하지 않는다 (BG2). top_flag 는 "어떤 종류가
 *   가장 흔한가" 판별 용도로만 내부 카운트 후 라벨만 노출한다.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/org-permission";
import { apiSuccess, apiError } from "@/lib/api/response";

// 상위/하위 사용자 판정 기준 (시안 라벨과 일치)
const TOP_AVG_MIN = 4.5; // 상위 매너: 평균 4.5+
const TOP_EVAL_MIN = 10; // 상위 매너: 평가 10건+
const LOW_AVG_MAX = 3.0; // 하위 매너: 평균 3.0-
const LOW_FLAG_MIN = 5; // 하위 매너: flags 누적 5건+ (어떤 종류든)

export async function GET(req: NextRequest) {
  // 세션 + super_admin 가드 (신고 큐 route 와 동일 패턴 — 세션 변조 대비 재검증)
  const session = await getWebSession();
  if (!session || !isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  // 집계 기간 — 최근 30일 (KST 무관, UTC 기준 30일 전부터)
  const since = new Date();
  since.setDate(since.getDate() - 30);

  // 최근 30일 평가 전체를 한 번에 조회 후 메모리 집계.
  // (운영 DB 0건이라 부하 無. 데이터 증가 시 단순 30일 윈도우라 인덱스 created_at 활용)
  const ratings = await prisma.game_player_ratings.findMany({
    where: { created_at: { gte: since } },
    select: {
      rating: true,
      flags: true,
      is_noshow: true,
      created_at: true,
      rated_user_id: true,
      rated_user: { select: { id: true, nickname: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const totalEvaluations = ratings.length;

  // ── 데이터 0건이면 빈 통계로 즉시 반환 (mock ❌ / 프론트가 빈 상태 분기) ──
  if (totalEvaluations === 0) {
    return apiSuccess({
      stats: {
        totalEvaluations: 0,
        avgRating: 0,
        reportRate: 0,
        topFlag: null,
        distribution: [], // 평점 분포 없음
        topUsers: [], // 상위 매너 사용자 없음
        lowUsers: [], // 하위 매너 사용자 없음
      },
      trend: [], // 30일 추세 없음
    });
  }

  // ── 1) 전체 평균 평점 (UC1 동일: rating 합 / 건수) ──
  const avgRating = ratings.reduce((s, r) => s + r.rating, 0) / totalEvaluations;

  // ── 신고 발생률 = flags 있는 평가 비율 (건수가 아닌 "비율"만 노출) ──
  const withFlags = ratings.filter((r) => (r.flags?.length ?? 0) > 0).length;
  const reportRate = Math.round((withFlags / totalEvaluations) * 100);

  // ── top_flag: 가장 흔한 flag "종류" 1개만. 내부 카운트는 하되 건수는 응답에 노출 ❌ ──
  const flagCount = new Map<string, number>();
  for (const r of ratings) {
    for (const f of r.flags ?? []) {
      flagCount.set(f, (flagCount.get(f) ?? 0) + 1);
    }
  }
  let topFlag: string | null = null;
  let topFlagN = 0;
  for (const [f, n] of flagCount) {
    if (n > topFlagN) {
      topFlag = f;
      topFlagN = n;
    }
  }

  // ── 2) 평점 분포 — 1~5 구간별 비율(%)만. 개별 평가자/본문 ❌ ──
  const scoreBucket = [0, 0, 0, 0, 0, 0]; // index 1~5 사용
  for (const r of ratings) {
    if (r.rating >= 1 && r.rating <= 5) scoreBucket[r.rating]++;
  }
  // 시안은 5 → 1 순으로 표시 (별점 높은 순)
  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    pct: Math.round((scoreBucket[score] / totalEvaluations) * 100),
  }));

  // ── 사용자별 집계 (평균 + flag 종류 distinct만 / 개별 건수 ❌) ──
  // rated_user_id 기준으로 묶어서 합/건수/flag 종류 Set 만 보관 (flag별 건수 미보관)
  type UserAgg = {
    id: string;
    name: string;
    sum: number;
    count: number;
    flagKinds: Set<string>; // 종류만 (건수 ❌ — UC1 동일)
    flagTotal: number; // 하위 판정용 누적 flag 수 (응답 노출 ❌, 임계값 비교용)
  };
  const userMap = new Map<string, UserAgg>();
  for (const r of ratings) {
    const key = r.rated_user_id.toString();
    let agg = userMap.get(key);
    if (!agg) {
      agg = {
        id: key,
        name: r.rated_user?.nickname || "이름없음",
        sum: 0,
        count: 0,
        flagKinds: new Set<string>(),
        flagTotal: 0,
      };
      userMap.set(key, agg);
    }
    agg.sum += r.rating;
    agg.count += 1;
    for (const f of r.flags ?? []) {
      agg.flagKinds.add(f);
      agg.flagTotal += 1; // 임계값 비교용 (응답에는 미포함)
    }
  }

  const users = Array.from(userMap.values()).map((u) => ({
    id: u.id,
    name: u.name,
    avg: u.sum / u.count,
    evalCount: u.count, // "평가 건수"(사람당 받은 평가 수)는 노출 OK — flag별 건수만 ❌
    flagKinds: Array.from(u.flagKinds), // 받은 flag 종류 (건수 없음)
    flagTotal: u.flagTotal, // 정렬/필터용 (응답 매핑에서 제외)
  }));

  // ── 3) 상위 매너 사용자: 평균 4.5+ & 평가 10+ (평균 내림차순 상위 8명) ──
  const topUsers = users
    .filter((u) => u.avg >= TOP_AVG_MIN && u.evalCount >= TOP_EVAL_MIN)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8)
    .map((u) => ({ name: u.name, avg: u.avg, evalCount: u.evalCount }));

  // ── 4) 하위 매너 사용자: 평균 3.0- 또는 flags 누적 5+ (평균 + flag 종류만) ──
  const lowUsers = users
    .filter((u) => u.avg <= LOW_AVG_MAX || u.flagTotal >= LOW_FLAG_MIN)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 10)
    .map((u) => ({
      name: u.name,
      avg: u.avg,
      evalCount: u.evalCount,
      flags: u.flagKinds, // ⚠️ 종류만 — 개별 건수 ❌ (BG2)
    }));

  // ── 5) 30일 추세: 일자별 평균/건수 (KST 날짜 라벨) ──
  type DayAgg = { sum: number; count: number };
  const dayMap = new Map<string, DayAgg>();
  for (const r of ratings) {
    // KST(UTC+9) 기준 YYYY-MM-DD 키
    const kst = new Date(r.created_at.getTime() + 9 * 60 * 60 * 1000);
    const key = kst.toISOString().slice(0, 10); // YYYY-MM-DD
    const d = dayMap.get(key) ?? { sum: 0, count: 0 };
    d.sum += r.rating;
    d.count += 1;
    dayMap.set(key, d);
  }
  // 날짜 오름차순 + "M/D" 짧은 라벨 (시안 trend.d)
  const trend = Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, d]) => {
      const [, m, day] = key.split("-");
      return {
        d: `${Number(m)}/${Number(day)}`,
        avg: d.sum / d.count,
        count: d.count,
      };
    });

  return apiSuccess({
    stats: {
      totalEvaluations,
      avgRating,
      reportRate,
      topFlag, // 종류 키워드 1개 (가장 흔함). 건수는 미노출
      distribution,
      topUsers,
      lowUsers,
    },
    trend,
  });
}
