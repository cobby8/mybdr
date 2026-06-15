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
 *   domain          특정 도메인만 필터 (game_reports|community_posts|court_submissions|organizations|payments)
 *   severity        특정 심각도만 필터 (err|warn|blue)
 *   sort            "priority"(기본, err>warn>blue → created_at asc) | "age"(오래된 순)
 *   cursor          직전 응답 next_cursor (정렬 후 인덱스 기반)
 *   include_snoozed "1" 이면 스누즈/처리완료 항목도 포함 (기본은 제외)
 *
 * S3 (admin_inbox_state 연동):
 *   - union 후 AdminInboxState 를 (refType, refId) batch 조회해 각 item 에 실제 snoozed_until 주입.
 *   - 기본 목록에서는 "스누즈 미만료(snoozed_until > now)" 또는 "처리완료(resolved_at != null)" 항목을 제외.
 *   - ?include_snoozed=1 이면 위 제외를 끄고 전부 노출(스누즈/처리완료 재확인용).
 *
 * item:
 *   { id: "<domain>:<refId>", domain, route, severity, priority, title, sub,
 *     created_at, snoozed_until: string|null }
 *
 * NOTE: 응답은 apiSuccess() 경유 → 키 자동 snake_case 변환 (errors.md 2026-04-17).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
// Admin Console S1-4: 검수 대기 팀 큐 조건(overview 카운트와 동일 기준)
import { teamReviewQueueWhere } from "@/lib/constants/team-status";

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
  // S3: AdminInboxState 의 snoozed_until 주입(없으면 null).
  snoozed_until: string | null;
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
  // S3: 스누즈/처리완료 항목까지 포함할지 여부(기본은 제외).
  const includeSnoozed = searchParams.get("include_snoozed") === "1";

  try {
    // 도메인 필터가 있으면 해당 소스만 조회 (불필요 쿼리 절감).
    const want = (d: string) => !domainFilter || domainFilter === d;

    // ── 6개 소스 병렬 조회 ─────────────────────────────────────
    const [reports, posts, courts, orgs, refunds, teamsReview] = await Promise.all([
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

      // teams: 검수 대기 팀 → severity blue (승인성 작업, court/org 와 동형).
      // Admin Console S1-4. Team.createdAt(@map created_at) 으로 정렬.
      want("teams")
        ? prisma.team.findMany({
            where: teamReviewQueueWhere,
            select: { id: true, name: true, createdAt: true },
            orderBy: { createdAt: "asc" },
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
    // teams: 검수 대기 팀 (Admin Console S1-4) → severity blue.
    for (const t of teamsReview) {
      push(
        "teams",
        t.id.toString(),
        "blue",
        "/admin/teams",
        t.name || `팀 #${t.id.toString()}`,
        "팀 검수 대기",
        t.createdAt,
      );
    }

    // ── S3: AdminInboxState batch 조회 → snoozed_until 주입 + 기본 제외 ──
    // 왜: 원본 테이블에 상태 컬럼을 안 넣고 admin_inbox_state 별도 보관 → 여기서 합류.
    // 어떻게: 화면에 올라온 item 들의 (refType, refId) 쌍만 IN 조회(최대 union 상한 → 소량).
    const now = new Date();
    if (items.length > 0) {
      // item.id = "<domain>:<refId>" → refType=domain, refId 그대로.
      const refTypes = items.map((it) => it.domain);
      const refIds = items.map((it) => it.id.slice(it.id.indexOf(":") + 1));
      // (refType, refId) 조합 조회 — refType IN & refId IN 으로 후보를 좁힌 뒤 Map 으로 정확 매칭.
      const states = await prisma.adminInboxState.findMany({
        where: {
          refType: { in: Array.from(new Set(refTypes)) },
          refId: { in: Array.from(new Set(refIds)) },
        },
        select: {
          refType: true,
          refId: true,
          snoozedUntil: true,
          resolvedAt: true,
        },
      });
      // "<refType>:<refId>" → state 매핑(item.id 와 동일 키 형식).
      const stateMap = new Map(
        states.map((s) => [`${s.refType}:${s.refId}`, s]),
      );

      for (const it of items) {
        const st = stateMap.get(it.id);
        if (st?.snoozedUntil) {
          it.snoozed_until = st.snoozedUntil.toISOString();
        }
      }

      // 기본 모드: 스누즈 미만료(snoozed_until > now) 또는 처리완료(resolved_at != null) 제외.
      if (!includeSnoozed) {
        // O(1) 룩업 위해 제외 대상 item.id Set 구성.
        const excluded = new Set<string>();
        for (const s of states) {
          const snoozedActive = s.snoozedUntil && s.snoozedUntil > now;
          const resolved = s.resolvedAt != null;
          if (snoozedActive || resolved) {
            excluded.add(`${s.refType}:${s.refId}`);
          }
        }
        if (excluded.size > 0) {
          // items 를 in-place 필터(이후 로직은 items 기반).
          for (let i = items.length - 1; i >= 0; i--) {
            if (excluded.has(items[i].id)) items.splice(i, 1);
          }
        }
      }
    }

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
