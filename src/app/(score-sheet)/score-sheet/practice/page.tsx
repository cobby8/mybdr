/**
 * 연습용 FIBA SCORESHEET 페이지 — `/score-sheet/practice` (server entry).
 *
 * 2026-05-17 신규 (사용자 결재 옵션 E + 기록원 인증 가드).
 *
 * 왜 (이유):
 *   미교육 기록원 / 신규 운영자가 실제 매치 없이도 종이 기록지 양식 흐름 (점프볼 /
 *   마킹 / 파울 / 임시번호 / 라인업 등) 을 자유롭게 연습할 수 있도록 가상 fixture
 *   기반 연습 모드 박제. 운영 DB / Flutter / 라이브 발행 영향 0.
 *
 * 접근 가드 (사용자 명시):
 *   1. 미로그인 = redirect("/login?redirect=/score-sheet/practice")
 *   2. 로그인 + 기록원/운영자/super_admin 권한 = 연습 양식 진입 ✅
 *   3. 로그인 + 권한 없음 = 안내 페이지 (= "기록원 등록 후 사용 가능") 403
 *
 *   권한 매트릭스 (= 어떤 대회든 1건 이상 기록원/운영 권한 보유 시 통과):
 *     - super_admin                  → 자동 통과
 *     - recorder_admin               → 자동 통과 (전역 기록원 관리자)
 *     - tournament.organizerId       → 1개 이상 운영 대회 보유 시 통과
 *     - tournamentAdminMember        → 1개 이상 active 운영진 멤버 시 통과
 *     - tournament_recorders         → 1개 이상 active 기록원 등록 시 통과
 *
 *   사유: 연습 = 매치 단위가 아니라 "기록원 자격 학습용". 매치별 권한이 아닌
 *   기록원 자격(글로벌) 만 요구. 가장 넓은 권한 = 운영자 유입 마찰 최소화.
 *
 * 보존 (절대 룰):
 *   - DB schema 변경 0 (가상 fixture 만 사용 / Tournament/Match INSERT 0)
 *   - BFF API 변경 0 (호출 skip 만 — ScoreSheetForm isPractice 분기)
 *   - 운영 `/score-sheet/[matchId]` 영향 0 (별도 라우트)
 *   - Flutter v1 영향 0
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";
import { ScoreSheetForm } from "../[matchId]/_components/score-sheet-form";
import {
  PRACTICE_TOURNAMENT,
  PRACTICE_MATCH,
  PRACTICE_HOME_ROSTER,
  PRACTICE_AWAY_ROSTER,
  PRACTICE_INITIAL_LINEUP,
} from "@/lib/score-sheet/practice-fixture";

// Vercel 캐시 무력화 — 세션 검증 + 권한 SELECT 매번 (운영 매치 page.tsx 패턴 동일).
export const dynamic = "force-dynamic";

/**
 * 기록원/운영자 권한 1건 이상 보유 여부 판정.
 *
 * 룰 (사용자 명시 = 가장 넓은 권한):
 *   - super_admin 또는 recorder_admin = JWT/세션 payload 만으로 즉시 true (DB 0).
 *   - 그 외 = 3 테이블 OR 조회 (병렬 / 1건 이상 매칭 시 true).
 *
 * 효율:
 *   - super_admin / recorder_admin 진입 시 DB 라운드트립 0.
 *   - 일반 사용자 = Promise.all 3 SELECT (count 사용 — 작은 비용).
 */
async function hasRecorderOrAdminAccess(
  userId: bigint,
  session: { role?: string; admin_role?: string },
): Promise<boolean> {
  // super_admin / recorder_admin = 즉시 통과 (DB 0)
  if (isSuperAdmin(session)) return true;
  if (isRecorderAdmin(session)) return true;

  // 3 테이블 병렬 count — 1건 이상 매칭 시 통과.
  //   organizer = 본인 운영 대회 1건 이상
  //   TAM = 본인 active 운영진 1건 이상
  //   recorder = 본인 active 기록원 등록 1건 이상
  const [organizerCount, tamCount, recorderCount] = await Promise.all([
    prisma.tournament.count({
      where: { organizerId: userId },
    }),
    prisma.tournamentAdminMember.count({
      where: { userId, isActive: true },
    }),
    prisma.tournament_recorders.count({
      where: { recorderId: userId, isActive: true },
    }),
  ]);

  return organizerCount > 0 || tamCount > 0 || recorderCount > 0;
}

export default async function ScoreSheetPracticePage() {
  // 1) 세션 확인 — 미로그인 = login 페이지 redirect (원래 페이지 자동 복귀)
  const session = await getWebSession();
  if (!session) {
    redirect("/login?redirect=/score-sheet/practice");
  }

  const userId = BigInt(session.sub);

  // 2) 기록원/운영자 권한 확인 (= 어떤 대회든 1건 이상)
  const hasAccess = await hasRecorderOrAdminAccess(userId, session);

  if (!hasAccess) {
    // 권한 없음 = 안내 페이지 (= "기록원 등록 후 사용 가능") 403 톤 다운.
    //   운영 매치 page.tsx 의 권한 없음 안내 패턴 답습 (= 빨강 박스 + 홈 링크).
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12 text-center">
        <div
          className="rounded-[4px] px-4 py-8"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-info) 10%, transparent)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-info)",
          }}
        >
          <p className="text-base font-semibold">
            <span className="material-symbols-outlined mr-1 align-middle text-base">
              school
            </span>
            연습 모드는 기록원 등록 후 사용 가능합니다
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            FIBA 종이 기록지 연습 양식은 기록원 또는 운영자 권한 보유자만 진입할
            수 있습니다. 대회 운영자에게 기록원 등록을 요청해주세요.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-block rounded-[4px] px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              홈으로
            </Link>
            <Link
              href="/referee"
              className="inline-block rounded-[4px] border px-4 py-2 text-sm font-medium"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              기록원 안내
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3) 권한 OK = 가상 fixture 로 ScoreSheetForm 렌더.
  //    isPractice=true 전달 = 모든 BFF 호출 skip (submit / auto-sync / cross-check-audit /
  //    reset / jersey-override). localStorage draft 박제는 그대로 (= 새로고침 보존).
  return (
    <ScoreSheetForm
      match={PRACTICE_MATCH}
      tournament={PRACTICE_TOURNAMENT}
      homeRoster={PRACTICE_HOME_ROSTER}
      awayRoster={PRACTICE_AWAY_ROSTER}
      // initialLineup 박제 = LineupSelectionModal 자동 skip + 양 팀 starters/substitutes 자동 fill.
      //   사유: 연습 진입 즉시 양식 렌더 → 운영자 모달 입력 부담 0.
      initialLineup={PRACTICE_INITIAL_LINEUP}
      // PBP / fouls / timeouts / signatures / playerStats = undefined (= 빈 폼 시작).
      //   localStorage draft 가 있으면 ScoreSheetForm 내부에서 자동 복원 (운영 매치와 동일).
      pbpCount={0}
      // 종료 매치 가드 미사용 (status=null → isCompleted=false → canEdit 무관).
      canEdit={false}
      editAuditLogs={[]}
      // 4쿼터 기본 (i3 종별 분기 미진입 — 연습 매치는 종별 무관).
      initialPeriodFormat={undefined}
      // 2026-05-17 연습 모드 (사용자 결재 옵션 E) — BFF 호출 일괄 skip.
      //   ScoreSheetForm 의 isPractice 분기가 5건 BFF + LineupSelectionModal 의 jersey BFF 모두 skip.
      isPractice
    />
  );
}
