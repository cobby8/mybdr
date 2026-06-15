/**
 * GET /api/web/admin/overview — Admin Console S2 개요(KPI + 운영 큐)
 *
 * 왜 (이유):
 * - Admin Console 메인 화면 상단에 4개 KPI 카드(신규 가입 / 진행 중 경기 / 이번 달 매출 /
 *   모집 중 대회)와 처리 대기 큐(6종 카운트)를 한 번에 보여주기 위함.
 * - 화면이 여러 API를 따로 호출하면 느리고 깜빡임 → 단일 엔드포인트로 묶어 1회 패칭.
 *
 * 어떻게:
 * - 세션 + super_admin 가드 (getWebSession + isSuperAdmin) → 비통과 403.
 * - 모든 집계를 Promise.all 로 병렬 조회 (읽기 전용, schema 변경 0).
 * - 응답은 apiSuccess() 경유 → 키 자동 snake_case 변환 (errors.md 2026-04-17).
 *
 * 응답 구조:
 *   { kpis: { new_users, active_games, month_revenue, recruiting_tournaments },
 *     queue: { game_reports, community_posts, teams, payments, court_submissions, organizations } }
 *
 * 제약: 읽기 전용. KST(UTC+9) 경계 보정. api/v1 미접촉.
 */
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
// Admin Console S1-4: 검수 대기 팀 큐 조건(인박스와 동일 기준)
import { teamReviewQueueWhere } from "@/lib/constants/team-status";

export const dynamic = "force-dynamic";

// KST(UTC+9) 기준 "오늘 00:00"의 UTC 시각을 구한다.
// 이유: 서버/DB는 UTC 로 저장되므로, 한국 날짜 경계를 그대로 쓰면 9시간 어긋남.
// 방법: 현재 UTC 에 +9h 한 시각의 연/월/일을 취해 그 날 00:00(KST)을 다시 UTC(-9h)로 환산.
function kstMidnightUtc(base: Date): Date {
  const kstNow = new Date(base.getTime() + 9 * 60 * 60 * 1000); // UTC → KST 로 환산
  // KST 자정 = KST 연·월·일 00:00. Date.UTC 로 만든 뒤 -9h 하면 해당 KST 자정의 UTC 값.
  const kstMidnight = Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate(),
  );
  return new Date(kstMidnight - 9 * 60 * 60 * 1000);
}

// KST 기준 "이번 달 1일 00:00"의 UTC 시각.
function kstMonthStartUtc(base: Date): Date {
  const kstNow = new Date(base.getTime() + 9 * 60 * 60 * 1000);
  const kstMonthStart = Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    1, // 이번 달 1일
  );
  return new Date(kstMonthStart - 9 * 60 * 60 * 1000);
}

// 모집 중으로 간주하는 대회 status 화이트리스트 (확정 매핑).
const RECRUITING_TOURNAMENT_STATUSES = [
  "registration",
  "registration_open",
  "published",
  "open",
  "active",
  "opening_soon",
];

// 진행 중 경기로 간주하는 games.status (Int 컬럼). 1·2 = 진행 단계.
const ACTIVE_GAME_STATUSES = [1, 2];

export async function GET() {
  // 세션 + super_admin 가드
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  try {
    const now = new Date();
    const todayStart = kstMidnightUtc(now); // KST 오늘 00:00 (UTC 값)
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000); // 어제 00:00
    const monthStart = kstMonthStartUtc(now); // 이번 달 1일 00:00 (KST → UTC)
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000); // 7일 버킷 시작(오늘 포함 7일)

    // ── KPI + 큐를 전부 병렬 조회 (읽기 전용) ──────────────────────
    const [
      newUsersToday, // 오늘 신규 가입 (KPI new_users)
      newUsersYesterday, // 어제 신규 가입 (delta 계산용)
      newUsersTrendRaw, // 최근 7일 가입(트렌드 day-bucket 용)
      activeGames, // 진행 중 경기 (KPI active_games)
      monthRevenueAgg, // 이번 달 매출 합계 (KPI month_revenue)
      recruitingTournaments, // 모집 중 대회 (KPI recruiting_tournaments)
      // ── 큐 카운트 6종 ──
      qGameReports,
      qCommunityPosts,
      qPaymentsRefund,
      qCourtSubmissions,
      qOrganizations,
      qTeamsReview,
    ] = await Promise.all([
      // new_users: KST 오늘 0시 이후 가입
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      // 어제 가입 (delta = 오늘 - 어제)
      prisma.user.count({
        where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      // 최근 7일 가입자 createdAt 목록 → 코드에서 day-bucket 집계 (DB groupBy date 캐스팅 회피)
      prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),

      // active_games: games.status in [1,2]
      prisma.games.count({ where: { status: { in: ACTIVE_GAME_STATUSES } } }),

      // month_revenue: paid + paid_at >= 이번달 1일 → final_amount 합계
      prisma.payments.aggregate({
        where: { status: "paid", paid_at: { gte: monthStart } },
        _sum: { final_amount: true },
      }),

      // recruiting_tournaments: status 화이트리스트
      prisma.tournament.count({
        where: { status: { in: RECRUITING_TOURNAMENT_STATUSES } },
      }),

      // 큐: 제출된 경기 평가 신고
      prisma.game_reports.count({ where: { status: "submitted" } }),
      // 큐: 임시저장(검수 대기) 커뮤니티 글
      prisma.community_posts.count({ where: { status: "draft" } }),
      // 큐: 환불 요청 결제
      prisma.payments.count({ where: { refund_status: "requested" } }),
      // 큐: 승인 대기 코트 제보
      prisma.court_submissions.count({ where: { status: "pending" } }),
      // 큐: 승인 대기 단체
      prisma.organizations.count({ where: { status: "pending" } }),
      // 큐: 검수 대기 팀 (Admin Console S1-4)
      prisma.team.count({ where: teamReviewQueueWhere }),
    ]);

    // 7일 트렌드 day-bucket — KST 날짜(YYYY-MM-DD) 키로 묶어 0포함 7칸 배열 생성.
    const trendMap = new Map<string, number>();
    for (const u of newUsersTrendRaw) {
      const kst = new Date(u.createdAt.getTime() + 9 * 60 * 60 * 1000);
      const key = `${kst.getUTCFullYear()}-${kst.getUTCMonth()}-${kst.getUTCDate()}`;
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
    const trend: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      const key = `${kst.getUTCFullYear()}-${kst.getUTCMonth()}-${kst.getUTCDate()}`;
      trend.push(trendMap.get(key) ?? 0);
    }

    // payments.final_amount 는 Decimal → Number 변환 (직렬화/표시용)
    const monthRevenue = Number(monthRevenueAgg._sum.final_amount ?? 0);

    return apiSuccess({
      kpis: {
        new_users: {
          value: newUsersToday,
          delta: newUsersToday - newUsersYesterday, // 어제 대비 증감
          trend, // 최근 7일 day-bucket
        },
        active_games: {
          value: activeGames,
          delta: null, // 시점 비교 기준 부재 → null
        },
        month_revenue: {
          value: monthRevenue,
          delta: null,
        },
        recruiting_tournaments: {
          value: recruitingTournaments,
          delta: null,
        },
      },
      queue: {
        game_reports: qGameReports,
        community_posts: qCommunityPosts,
        teams: qTeamsReview, // Admin Console S1-4: 검수 대기 팀(pending_review) 건수
        payments: qPaymentsRefund, // 환불 요청 건수
        court_submissions: qCourtSubmissions,
        organizations: qOrganizations,
      },
    });
  } catch {
    return apiError("개요 정보를 불러올 수 없습니다", 500);
  }
}
