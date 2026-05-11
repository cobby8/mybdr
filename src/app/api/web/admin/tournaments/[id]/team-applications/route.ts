/**
 * 2026-05-11 Phase 1 — 강남구협회장배 유소년 일괄 등록 (운영자 어드민 API).
 *
 * 도메인 컨텍스트:
 *   - 운영자가 팀별 신청서 토큰을 발급하면, 코치가 그 토큰 URL 로 비로그인 진입해 명단 입력.
 *   - 본 라우트는 Phase 1 어드민 = 팀 1건 생성 + apply_token 발급 + 진행 표 조회.
 *
 * 엔드포인트:
 *   GET  /api/web/admin/tournaments/[id]/team-applications
 *        → 팀 목록 + 진행 표 (팀명·코치·상태·인원·토큰 URL)
 *
 *   POST /api/web/admin/tournaments/[id]/team-applications
 *        body: { teamName, managerName, managerPhone }
 *        → 팀 신규 1건 생성 + apply_token 발급 (응답: 토큰 URL)
 *
 * 권한 (tournament-permission.ts):
 *   super_admin / tournament.organizerId / tournamentAdminMember(is_active=true).
 *
 * 응답 envelope: apiSuccess() / apiError() — snake_case 자동 변환.
 *   ⚠️ 프론트 접근자도 snake_case 로 사용 (CLAUDE.md §보안 5번 — silent undefined 5회 재발 주의).
 *
 * captainId 임시값 정책:
 *   - 신규 Team INSERT 시 captainId NOT NULL 제약 때문에 임시값 필수.
 *   - Phase 1 = tournament.organizerId 사용 (admin 이 만든 팀이라 organizer 가 임시 captain).
 *   - Phase 2 = 코치가 명단 제출 시 코치 본인 user_id 로 교체 (별도 PATCH).
 *
 * 만료 정책:
 *   - tournament.startDate 가 있으면 startDate + 7일 (대회 시작 후 1주일 유예).
 *   - 없으면 now + 30일 (fallback).
 *   - UTC 기준 (DateTime @db.Timestamp(6)).
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { newApplyToken } from "@/lib/utils/apply-token";
import { adminLog } from "@/lib/admin/log";

// POST 입력 zod 스키마
// - teamName: 1~50자 (한글/영문/숫자 자유)
// - managerName: 코치 실명 1~30자
// - managerPhone: 010-XXXX-XXXX 또는 숫자 11자리 (둘 다 허용 — UI 친화)
const PostBodySchema = z.object({
  teamName: z.string().trim().min(1, "팀명을 입력하세요").max(50),
  managerName: z.string().trim().min(1, "코치 이름을 입력하세요").max(30),
  managerPhone: z
    .string()
    .trim()
    .regex(/^(010-\d{4}-\d{4}|01\d{9})$/, "휴대폰 번호 형식이 올바르지 않습니다"),
});

type Ctx = { params: Promise<{ id: string }> };

// origin 산출 — host 헤더 + proto 헤더 기반.
// 이유(왜): NEXT_PUBLIC_* 변수는 시크릿 노출 룰(§보안)에 걸릴 수 있고,
//   배포 환경별로 도메인이 다르므로 요청 host 를 우선 사용 (Vercel 프리뷰 URL 자동 대응).
function resolveOrigin(req: NextRequest): string {
  const host = req.headers.get("host") ?? "mybdr.kr";
  const proto = req.headers.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

// 만료 시각 계산 — startDate 가 있으면 +7일, 없으면 +30일 (CLI prompt §3-5 룰)
function resolveExpiresAt(startDate: Date | null): Date {
  if (startDate) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + 7);
    return d;
  }
  const fallback = new Date();
  fallback.setUTCDate(fallback.getUTCDate() + 30);
  return fallback;
}

// =============================================================================
// GET — 팀 목록 + 진행 표
// =============================================================================
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  // 1) 세션 + 권한 검증 (대회 단위 어드민 헬퍼)
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) {
    // 대회가 아예 없는 경우와 권한 없는 경우 모두 403 (정보 노출 차단 — 운영자 권한 detection 회피)
    return apiError("권한이 없습니다.", 403);
  }

  // 2) 팀 목록 조회 (Team + 신청자 user 조인)
  // 2026-05-11 Phase 3-D — 검토 보고서 §D 권장 4건 응답 확장:
  //   - applied_at (신청 시각) / waiting_number (대기접수 N번)
  //   - registered_by user nickname (일반 신청 시 신청자 표시)
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      manager_name: true,
      manager_phone: true,
      status: true,
      applied_via: true,
      apply_token: true,
      apply_token_expires_at: true,
      applied_at: true,
      waiting_number: true,
      registered_by_id: true,
      createdAt: true,
      team: { select: { name: true } },
      _count: { select: { players: true } },
      users: { select: { id: true, nickname: true, email: true } }, // registered_by_id → User
    },
  });

  const origin = resolveOrigin(req);
  const now = new Date();

  const rows = teams.map((tt) => {
    // 만료 안된 토큰만 URL 노출 — 만료된 토큰은 null 처리 (UI 가 "재발급" 표시 가능)
    const tokenAlive =
      tt.apply_token &&
      tt.apply_token_expires_at &&
      tt.apply_token_expires_at > now;
    return {
      id: tt.id.toString(),
      teamName: tt.team?.name ?? "(이름 없음)",
      managerName: tt.manager_name,
      managerPhone: tt.manager_phone,
      status: tt.status,
      appliedVia: tt.applied_via,
      appliedAt: tt.applied_at?.toISOString() ?? null,
      waitingNumber: tt.waiting_number,
      registeredBy: tt.users
        ? { nickname: tt.users.nickname, email: tt.users.email }
        : null,
      applyTokenExpiresAt: tt.apply_token_expires_at?.toISOString() ?? null,
      applyTokenUrl: tokenAlive ? `${origin}/team-apply/${tt.apply_token}` : null,
      playerCount: tt._count.players,
    };
  });

  return apiSuccess({ teams: rows });
}

// =============================================================================
// POST — 팀 1건 신규 생성 + apply_token 발급
// =============================================================================
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  // 1) 세션 + 권한 검증
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  // 2) zod 입력 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력입니다.", 422, "VALIDATION_ERROR");
  }
  const { teamName, managerName, managerPhone } = parsed.data;

  // 3) 대회 fetch — startDate + organizerId (captainId 임시값 + 만료 계산 source)
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, organizerId: true, startDate: true },
  });
  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  // 4) Team 재사용 정책 — 동일 이름 Team 검색.
  //    이유(왜): 같은 팀이 여러 대회 참가 가능 → 중복 INSERT 방지.
  //    captainId 가 organizer(임시) 인 team 만 매칭 (실제 운영 팀 captain 충돌 회피).
  //    Phase 2 에서 코치 user_id 로 교체될 예정 — 임시 row 만 재사용.
  let team = await prisma.team.findFirst({
    where: { name: teamName, captainId: tournament.organizerId },
    select: { id: true, name: true, captainId: true },
  });

  if (!team) {
    // 5) 신규 Team INSERT — captainId 임시값 = organizerId
    //    uuid 컬럼 NOT NULL → 명시 생성 (DB default 없을 수 있음)
    team = await prisma.team.create({
      data: {
        uuid: randomUUID(),
        name: teamName,
        captainId: tournament.organizerId,
        status: "active",
        is_public: false, // 대회 전용 임시 팀 — 공개 검색 노출 X
        accepting_members: false,
      },
      select: { id: true, name: true, captainId: true },
    });
  }

  // 6) 동일 (tournamentId, teamId) 중복 가드 — TournamentTeam @@unique 위반 회피
  const existing = await prisma.tournamentTeam.findFirst({
    where: { tournamentId, teamId: team.id },
    select: { id: true },
  });
  if (existing) {
    return apiError(
      "이미 등록된 팀입니다. 기존 신청서를 사용하세요.",
      409,
      "DUPLICATE_TEAM",
    );
  }

  // 7) apply_token 발급 + 만료 계산
  const token = newApplyToken();
  const expiresAt = resolveExpiresAt(tournament.startDate);

  // 8) TournamentTeam INSERT
  //    status='pending' (운영자가 confirm 단계 별도), payment_status='unpaid'
  //    applied_via='coach_token' (Phase 2 코치가 토큰으로 진입할 예정 표식)
  const tt = await prisma.tournamentTeam.create({
    data: {
      tournamentId,
      teamId: team.id,
      manager_name: managerName,
      manager_phone: managerPhone,
      status: "pending",
      payment_status: "unpaid",
      apply_token: token,
      apply_token_expires_at: expiresAt,
      applied_via: "coach_token",
      registered_by_id: userId, // 운영자 본인 (감사용)
      applied_at: new Date(),
    },
    select: { id: true },
  });

  // 9) admin_logs 박제 — info 등급 (운영 액션 추적)
  await adminLog("team_application_create", "TournamentTeam", {
    resourceId: tt.id,
    targetType: "Tournament",
    targetId: tournamentId,
    description: `${teamName} (${managerName}) 신청 토큰 발급`,
    changesMade: {
      team_id: team.id.toString(),
      team_name: teamName,
      manager_name: managerName,
      manager_phone: managerPhone,
      apply_token_expires_at: expiresAt.toISOString(),
    },
    severity: "info",
  });

  // 10) 응답 — 토큰 URL 직접 제공 (운영자 UI 가 즉시 복사 가능)
  const origin = resolveOrigin(req);
  return apiSuccess(
    {
      team: {
        id: tt.id.toString(),
        teamName: team.name,
        managerName,
        managerPhone,
        applyTokenUrl: `${origin}/team-apply/${token}`,
        applyTokenExpiresAt: expiresAt.toISOString(),
      },
    },
    201,
  );
}
