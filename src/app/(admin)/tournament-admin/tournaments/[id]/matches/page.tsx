/**
 * 2026-05-12 — 경기/기록시스템 관리 페이지 (server wrap).
 *
 * 변경 (사용자 요청):
 *   - 메인 대시보드의 RecordingModeCard 제거 → 본 페이지 상단으로 이동
 *   - 라벨 "경기 관리" → "경기/기록시스템 관리" (대시보드 메뉴 변경)
 *   - 한 페이지 안에서 모든 경기 관리 + 기록 모드 설정 + 스코어 입력 진입
 *
 * 구조:
 *   - page.tsx (server) — 권한 + 기록 모드 stats fetch + RecordingModeCard 렌더
 *   - matches-client.tsx (client) — 기존 매치 표 / 폼 / 스코어 모달 / 생성
 */

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import {
  getTournamentMatchStats,
  getTournamentDefaultMode,
} from "@/lib/tournaments/recording-mode";
import { RecordingModeTriggerClient } from "../_components/recording-mode-trigger";
import MatchesClient from "./matches-client";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  // 대회 + 권한 검증 (대시보드 page.tsx 동일 패턴 — super_admin / organizer / TAM)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, organizerId: true, settings: true },
  });
  if (!tournament) notFound();

  if (session.role !== "super_admin") {
    const isOrganizer = tournament.organizerId === userId;
    if (!isOrganizer) {
      const member = await prisma.tournamentAdminMember.findFirst({
        where: { tournamentId: id, userId, isActive: true },
      });
      if (!member) notFound();
    }
  }

  // 기록 모드 server-side 산출 (대시보드에서 옮겨옴)
  const recordingDefaultMode = getTournamentDefaultMode({ settings: tournament.settings });
  const matchStats = await getTournamentMatchStats(id);

  return (
    <div>
      {/* 2026-05-12 — 기록 모드 설정 (사용자 요청: 큰 카드 → 메뉴 1개 + 플로팅 모달).
          MatchesClient 상단 액션 영역에 "기록 모드 설정" 버튼 + 모달 트리거.
          서버에서 산출한 stats / defaultMode 를 client wrapper 에 전달. */}
      <RecordingModeTriggerClient
        tournamentId={id}
        defaultMode={recordingDefaultMode}
        matchStats={matchStats}
      />

      {/* 매치 관리 + 스코어 입력 진입 (기존 client) */}
      <MatchesClient />
    </div>
  );
}

