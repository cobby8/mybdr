/**
 * 2026-05-15 PR-Live1 — score-sheet 접근 권한 boolean 게이트 endpoint
 *
 * 사용처: 라이브 페이지 (/live/[matchId]) 헤더 toolbar "기록하기" 버튼 노출 여부 판단.
 *   라이브 페이지는 공개 — 운영자/기록원 식별만 본 endpoint 로 분리.
 *
 * 권한 매트릭스 (사용자 결재 Q3 권고안):
 *   - super_admin                                  → canRecord=true, canEdit=true
 *   - recorder_admin (전역 기록원 관리자)         → canRecord=true, canEdit=false
 *   - tournament.organizerId === userId            → canRecord=true, canEdit=true
 *   - tournament_admin_members (isActive=true)     → canRecord=true, canEdit=true
 *   - tournament_recorders (isActive=true)         → canRecord=true, canEdit=false
 *   - 외 / 미로그인                                 → { canRecord:false, canEdit:false } (silent 200)
 *
 * 왜 (이유):
 *   기존 `requireScoreSheetAccess` 헬퍼는 page/BFF 권한 가드 (throw 패턴).
 *   본 endpoint = 단순 boolean 게이트 — silent fail / 401·403 안 내림 (admin-check 패턴 동일).
 *   라이브 페이지는 공개 → 미로그인 사용자도 200 반환 (UX 일관성).
 *
 * 단일 source 결정:
 *   `requireScoreSheetAccess` / `checkScoreSheetEditAccess` 의 권한 분기 룰을 그대로 인라인 carry.
 *   throw 안 함 (boolean 만 반환) — admin-check route.ts 패턴 정합.
 *
 * 응답 컨벤션:
 *   `apiSuccess({ canRecord, canEdit })` — snake_case 자동 변환 → 클라가 `data.can_record / data.can_edit` 접근.
 */

import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  const session = await getWebSession();
  if (!session) {
    // 미로그인 = 항상 false. 401 안 내림 (라이브 페이지가 공개 — silent fail).
    return apiSuccess({ canRecord: false, canEdit: false });
  }

  const userId = BigInt(session.sub);

  // super_admin = 전역 관리자 → canRecord+canEdit 모두 true (DB 추가 조회 skip / 효율).
  // 이유: admin-guard 의 sentinel role 통과 룰과 동일 — 추가 검증 불필요.
  if (isSuperAdmin(session)) {
    return apiSuccess({ canRecord: true, canEdit: true });
  }

  // recorder_admin = 전역 기록원 관리자 → canRecord=true (모든 대회 기록 가능) / canEdit=false (보수적).
  // 이유: require-score-sheet-access.ts §239 결정 — recorder_admin = recorder 자동 흡수 의미상 동일 → 수정 권한 ❌
  const recorderAdmin = isRecorderAdmin(session);

  // 매치/대회 SELECT — organizer/TAM/recorder 검증 위해 1회 조회.
  // tournament 단위 권한 = matchId 무관 (admin-check 패턴 동일).
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  });

  if (!tournament) {
    // 토너먼트 부재 — 라이브 페이지가 정상 렌더면 tournamentId 는 있음. 방어적 false.
    // recorder_admin 도 false 반환 (존재하지 않는 대회는 권한 무의미)
    return apiSuccess({ canRecord: false, canEdit: false });
  }

  // organizer = 본 대회 운영자 → canRecord+canEdit 모두 true
  if (tournament.organizerId === userId) {
    return apiSuccess({ canRecord: true, canEdit: true });
  }

  // TAM (tournamentAdminMember.isActive=true) → canRecord+canEdit 모두 true
  // recorders (tournament_recorders.isActive=true) → canRecord=true, canEdit=false
  // 이유: parallel SELECT 로 DB 라운드트립 최소화 (require-score-sheet-access §156 패턴).
  const [adminMember, recorder] = await Promise.all([
    prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId, isActive: true },
      select: { id: true },
    }),
    prisma.tournament_recorders.findFirst({
      // isActive=true — 비활성 (권한 회수) 기록원 차단 (require-score-sheet-access §164 룰 동일)
      where: { tournamentId, recorderId: userId, isActive: true },
      select: { id: true },
    }),
  ]);

  if (adminMember) {
    // TAM = 운영진 → 기록 + 수정 모두 가능
    return apiSuccess({ canRecord: true, canEdit: true });
  }

  if (recorder) {
    // recorder = 기록원 → 기록만 가능 (수정 권한 ❌ — 보수적)
    return apiSuccess({ canRecord: true, canEdit: false });
  }

  // recorder_admin 자동 흡수 — 다른 분기 모두 통과 못 했을 때 마지막 확인
  // 이유: recorder_admin 은 대회 무관 전역 권한이므로 organizer/TAM/recorder 검증 후에도 통과.
  //   순서 = super_admin (최상위) → organizer/TAM/recorder (대회별) → recorder_admin (전역 fallback)
  if (recorderAdmin) {
    return apiSuccess({ canRecord: true, canEdit: false });
  }

  // 외 = 일반 user → 모두 false
  return apiSuccess({ canRecord: false, canEdit: false });
}
