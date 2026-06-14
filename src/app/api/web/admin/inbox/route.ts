/**
 * GET /api/web/admin/inbox — Admin Console S2 통합 인박스(처리 대기 항목 union)
 *
 * 왜 (이유):
 * - 운영자가 도메인별 화면을 일일이 돌지 않고, 처리해야 할 항목(신고/검수/제보/승인/환불)을
 *   한 목록에서 우선순위대로 보게 하기 위함.
 *
 * 어떻게:
 * - 세션 + super_admin 가드 (getWebSession + isSuperAdmin) → 비통과 403.
 * - 6개 소스(game_reports / community_posts / court_submissions / organizations / payments / teams)를
 *   각각 조회해 공통 item 형태로 정규화한 뒤 메모리에서 union → 정렬 → take 50 + next_cursor.
 * - schema 변경 0, 읽기 전용. teams 는 DB 미지원 → 항상 0건.
 *
 * 쿼리 파라미터:
 *   domain   특정 도메인만 필터 (game_reports|community_posts|court_submissions|organizations|payments)
 *   severity 특정 심각도만 필터 (err|warn|blue)
 *   sort     "priority"(기본, err>warn>blue → created_at asc) | "age"(오래된 순)
 *   cursor   직전 응답 next_cursor (정렬 후 인덱스 기반)
 *
 * item:
 *   { id: "<domain>:<refId>", domain, route, severity, priority, title, sub,
 *     created_at, snoozed_until: null }
 *
 * NOTE: 응답은 apiSuccess() 경유 → 키 자동 snake_case 변환 (errors.md 2026-04-17).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// 한 화면 페이지 크기.
const PAGE_SIZE = 50;

// severity → priority 가중치 (정렬용, 작을수록 먼저).
const SEVERITY_PRIORITY: Record<string, number> = {
  err: 0,
  warn: 1,
  blue: 2,
};

// 인박스 공통 항목 형태.
interface InboxItem {
  id: string;
  domain: string;
  route: string;
  severity: "err" | "warn" | "blue";
  priority: number;
  title: string;
  sub: string;
  created_at: string;
  snoozed_until: null;
}

export async function GET(req: NextRequest) {
  // 세션 + super_admin 가드
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { searchParams } = new URL(req.url);
  const domainFilter = searchParams.get("domain"); // null 이면 전체
  const severityFilter = searchParams.get("severity"); // null 이면 전체
  const sort = searchParams.get("sort") === "age" ? "age" : "priority";
  const cursor = Number(searchParams.get("cursor") ?? 0); // 정렬 후 시작 인덱스

  try {
    // 도메인 필터가 있으면 해당 소스만 조회 (불필요 쿼리 절감).
    const want = (d: string) => !domainFilter || domainFilter === d;

    // ── 6개 소스 병렬 조회 ─────────────────────────────────────
    const [reports, posts, courts, orgs, refunds] = await Promise.all([
      // game_reports: 제출된 신고 → severity err
      want("game_reports")
        ? prisma.game_reports.findMany({
            where: { status: "submitted" },
            select: { id: true, created_at: true },
            orderBy: { created_at: "asc" },
            take: 200, // union 후 정렬·페이지네이션 — 소스별 상한
          })
        : Promise.resolve([]),

      // community_posts: 임시저장(검수 대기) → severity warn. title 노출.
      want("community_posts")
        ? prisma.community_posts.findMany({
            where: { status: "draft" },
            select: { id: true, title: true, created_at: true },
            orderBy: { created_at: "asc" },
            take: 200,
          })
        : Promise.resolve([]),

      // court_submissions: 승인 대기 → severity blue. name 노출.
      want("court_submissions")
        ? prisma.court_submissions.findMany({
            where: { status: "pending" },
            select: { id: true, name: true, created_at: true },
            orderBy: { created_at: "asc" },
            take: 200,
          })
        : Promise.resolve([]),

      // organizations: 승인 대기 → severity blue. name 노출.
      want("organizations")
        ? prisma.organizations.findMany({
            where: { status: "pending" },
            select: { id: true, name: true, created_at: true },
            orderBy: { created_at: "asc" },
            take: 200,
          })
        : Promise.resolve([]),

      // payments: 환불 요청 → severity err.
      want("payments")
        ? prisma.payments.findMany({
            where: { refund_status: "requested" },
            select: { id: true, created_at: true },
            orderBy: { created_at: "asc" },
            take: 200,
          })
        : Promise.resolve([]),
    ]);

    // ── 공통 item 으로 정규화 ──────────────────────────────────
    const items: InboxItem[] = [];

    const push = (
      domain: string,
      refId: string,
      severity: "err" | "warn" | "blue",
      route: string,
      title: string,
      sub: string,
      createdAt: Date,
    ) => {
      items.push({
        id: `${domain}:${refId}`,
        domain,
        route,
        severity,
        priority: SEVERITY_PRIORITY[severity],
        title,
        sub,
        created_at: createdAt.toISOString(),
        snoozed_until: null,
      });
    };

    for (const r of reports) {
      push(
        "game_reports",
        r.id.toString(),
        "err",
        "/admin/game-reports",
        `경기 평가 #${r.id.toString()}`,
        "신고 검토 대기",
        r.created_at,
      );
    }
    for (const p of posts) {
      push(
        "community_posts",
        p.id.toString(),
        "warn",
        "/admin/community",
        p.title || `게시글 #${p.id.toString()}`,
        "검수 대기",
        p.created_at,
      );
    }
    for (const c of courts) {
      push(
        "court_submissions",
        c.id.toString(),
        "blue",
        "/admin/courts",
        c.name || `코트 제보 #${c.id.toString()}`,
        "코트 제보 승인 대기",
        c.created_at,
      );
    }
    for (const o of orgs) {
      push(
        "organizations",
        o.id.toString(),
        "blue",
        "/admin/organizations",
        o.name || `단체 #${o.id.toString()}`,
        "단체 승인 대기",
        o.created_at,
      );
    }
    for (const pay of refunds) {
      push(
        "payments",
        pay.id.toString(),
        "err",
        "/admin/payments",
        `환불 요청 #${pay.id.toString()}`,
        "환불 처리 대기",
        pay.created_at,
      );
    }
    // teams: DB 미지원 (팀 승인 큐 모델 부재) → 항목 0건.

    // ── severity 필터 ─────────────────────────────────────────
    let filtered = severityFilter
      ? items.filter((it) => it.severity === severityFilter)
      : items;

    // ── 정렬 ──────────────────────────────────────────────────
    // priority: severity 가중치 오름차순 → 같으면 created_at asc(오래된 것 먼저).
    // age: created_at asc 단일 기준(오래된 순).
    filtered = filtered.slice().sort((a, b) => {
      if (sort === "priority" && a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.created_at.localeCompare(b.created_at);
    });

    // ── 페이지네이션 (정렬 후 인덱스 커서) ─────────────────────
    const start = Number.isFinite(cursor) && cursor > 0 ? cursor : 0;
    const page = filtered.slice(start, start + PAGE_SIZE);
    const nextCursor =
      start + PAGE_SIZE < filtered.length ? start + PAGE_SIZE : null;

    return apiSuccess({
      items: page,
      next_cursor: nextCursor,
    });
  } catch {
    return apiError("인박스 정보를 불러올 수 없습니다", 500);
  }
}
