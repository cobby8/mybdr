/**
 * 2026-05-09 PR3 — 사전 라인업 확정 팀장 페이지 (server component).
 *
 * 라우트: /lineup-confirm/[matchId]
 *   matchId 단일 파라미터로 깔끔. tournamentId 는 DB 1회 조회로 획득.
 *
 * 왜 server component:
 *   - 권한 가드 (DB 조회 + redirect) 는 서버에서 처리해야 보안 안전
 *   - 매치/팀/ttp/기존 lineup 데이터는 서버에서 prefetch 하여 prop 전달 → CSR 한 번에 렌더
 *   - getWebSession + getLineupCanEdit + getMatchWithTeams 헬퍼 (PR2 박제) 그대로 재사용
 *
 * 주요 흐름:
 *   1. 세션 검증 → 미로그인 = /login redirect
 *   2. matchId 파싱 → 실패 = notFound
 *   3. 매치 1건 조회 (tournamentId 미상이라 PR2 헬퍼 직접 사용 X — DB 직접 1회)
 *   4. tournamentId 확보 후 getMatchWithTeams + getLineupCanEdit
 *   5. 권한 0 = "/" redirect (UI 노출 X)
 *   6. ttp 명단 + 기존 lineup 조회 (PR2 GET 라우트 동일 패턴)
 *   7. mySide 결정 (admin = home 통일 / captain·manager = 본인 측)
 *   8. LineupConfirmForm 마운트
 *
 * 사용자 결정 반영:
 *   - 상대팀 영역 미노출 → mySide 측만 prop 전달 (away 데이터는 fetch 하나 사용 X)
 *   - 단일 토글 버튼은 form 컴포넌트 내부 로직
 *
 * Flutter v1 영향 0 — web only 페이지 / API 변경 0
 */

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getWebSession } from "@/lib/auth/web-session";
import {
  getMatchWithTeams,
  getLineupCanEdit,
} from "@/lib/auth/match-lineup";
import { prisma } from "@/lib/db/prisma";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import {
  LineupConfirmForm,
  type LineupTeam,
  type LineupMatchInfo,
} from "./_components/lineup-confirm-form";
import type { TtpItem } from "./_components/ttp-row";

type PageProps = {
  params: Promise<{ matchId: string }>;
};

export const dynamic = "force-dynamic"; // 권한 가드 + 세션 의존 → SSR

export default async function LineupConfirmPage({ params }: PageProps) {
  const { matchId } = await params;

  // 1) 세션 검증 — 미로그인 = /login (?next=... 으로 복귀 유도)
  const session = await getWebSession();
  if (!session) {
    redirect(`/login?next=/lineup-confirm/${matchId}`);
  }
  const userId = BigInt(session.sub);

  // 2) matchId 파싱
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    notFound();
  }

  // 3) 매치 1건 조회로 tournamentId 확보 (PR2 헬퍼는 tournamentId 입력 필수)
  //    select 최소화 — id + tournamentId 만
  const matchBasic = await prisma.tournamentMatch.findUnique({
    where: { id: matchBigInt },
    select: { id: true, tournamentId: true },
  });
  if (!matchBasic) {
    notFound();
  }
  const tournamentId = matchBasic.tournamentId;

  // 4) PR2 헬퍼로 매치 + 양 팀 정보 조회 (IDOR 가드 = tournamentId 일치)
  const match = await getMatchWithTeams(matchBigInt, tournamentId);
  if (!match) {
    notFound();
  }

  // 5) 권한 계산 — admin / captain / manager
  const canEdit = await getLineupCanEdit(userId, tournamentId, match, session);
  if (!canEdit.home && !canEdit.away && !canEdit.isAdmin) {
    // 권한 0 = 홈으로 (UI 노출 차단)
    redirect("/");
  }

  // 6) mySide 결정 — admin 은 home 으로 통일 (상대팀 미노출 룰 + 단순화)
  //    captain·manager 는 본인 팀 측만 (canEdit.home / canEdit.away 중 하나만 true)
  const mySide: "home" | "away" = canEdit.isAdmin
    ? "home"
    : canEdit.home
      ? "home"
      : "away";

  // 7) 본인 측 ttp 명단 조회 (PR2 GET 라우트와 동일 select)
  const targetTtpId =
    mySide === "home" ? match.homeTeam?.id ?? null : match.awayTeam?.id ?? null;

  if (targetTtpId === null) {
    // 매칭 미정 = 입력 불가 안내 (UI 표시 — redirect 대신 안내 화면)
    return (
      <main
        className="mx-auto w-full max-w-3xl px-4 py-8"
        style={{ color: "var(--color-text-primary)" }}
      >
        <PageHeader matchId={matchId} />
        <div
          className="rounded-md border p-6 text-sm"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-warning)",
          }}
        >
          아직 팀이 배정되지 않은 경기입니다. 대진 확정 후 다시 시도해주세요.
        </div>
      </main>
    );
  }

  const players = await prisma.tournamentTeamPlayer.findMany({
    where: {
      tournamentTeamId: targetTtpId,
      is_active: true,
    },
    select: {
      id: true,
      tournamentTeamId: true,
      jerseyNumber: true,
      role: true,
      position: true,
      player_name: true,
      isStarter: true,
      users: {
        select: {
          id: true,
          name: true,
          nickname: true,
          profile_image_url: true,
        },
      },
    },
    orderBy: [{ jerseyNumber: "asc" }, { id: "asc" }],
  });

  // 8) 본인 측 기존 lineup (있으면)
  const existingLineup = await prisma.matchLineupConfirmed.findUnique({
    where: {
      matchId_teamSide: {
        matchId: matchBigInt,
        teamSide: mySide,
      },
    },
    select: {
      id: true,
      matchId: true,
      teamSide: true,
      starters: true,
      substitutes: true,
      confirmedById: true,
      confirmedAt: true,
      updatedAt: true,
    },
  });

  // 9) prop 직렬화 — bigint → string (form 컴포넌트는 string 만 다룸)
  //    PR2 GET 라우트 serializeTtp / serializeLineup 와 동일 키 (snake_case)
  const targetTeam =
    mySide === "home" ? match.homeTeam : match.awayTeam;
  const teamName = targetTeam?.team?.name ?? "(팀명 미정)";
  const teamId = targetTeam?.team?.id?.toString() ?? "";
  const ttpId = targetTeam?.id?.toString() ?? "";

  const serializedPlayers: TtpItem[] = players.map((p) => ({
    id: p.id.toString(),
    jersey_number: p.jerseyNumber,
    role: p.role,
    position: p.position,
    player_name: p.player_name,
    user: p.users
      ? {
          id: p.users.id.toString(),
          name: p.users.name,
          nickname: p.users.nickname,
        }
      : null,
  }));

  const homeTeamProp: LineupTeam = {
    tournament_team_id: ttpId,
    team_id: teamId,
    name: teamName,
    players: serializedPlayers,
    lineup: existingLineup
      ? {
          id: existingLineup.id.toString(),
          match_id: existingLineup.matchId.toString(),
          team_side: existingLineup.teamSide,
          starters: existingLineup.starters.map((b) => b.toString()),
          substitutes: existingLineup.substitutes.map((b) => b.toString()),
          confirmed_by_id: existingLineup.confirmedById.toString(),
          confirmed_at: existingLineup.confirmedAt.toISOString(),
          updated_at: existingLineup.updatedAt.toISOString(),
        }
      : null,
  };

  const matchProp: LineupMatchInfo = {
    id: match.id.toString(),
    scheduled_at: match.scheduledAt?.toISOString() ?? null,
    // schema 상 status 는 String? — null 케이스를 "scheduled" 로 fallback
    // (PR2 라우트의 status 가드 룰과 동일 — null = 시작 전 취급)
    status: match.status ?? "scheduled",
  };

  return (
    <main
      className="mx-auto w-full max-w-3xl px-4 py-6"
      style={{ color: "var(--color-text-primary)" }}
    >
      <PageHeader matchId={matchId} />

      {/* 매치 메타 — 시간 / 상태 */}
      <section
        className="mb-4 rounded-md border p-4"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <h1
          className="mb-2 text-lg font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          라인업 확정
        </h1>
        <div
          className="flex flex-wrap gap-x-4 gap-y-1 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {matchProp.scheduled_at && (
            <span>
              <span className="material-symbols-outlined align-middle text-base">
                schedule
              </span>{" "}
              {formatDateTime(matchProp.scheduled_at)}
            </span>
          )}
          <span>
            <span className="material-symbols-outlined align-middle text-base">
              info
            </span>{" "}
            상태: {labelStatus(matchProp.status)}
          </span>
          {canEdit.isAdmin && (
            <span style={{ color: "var(--color-info)" }}>운영자 권한</span>
          )}
        </div>
      </section>

      {/* 폼 */}
      <LineupConfirmForm
        tournamentId={tournamentId}
        matchId={matchId}
        match={matchProp}
        homeTeam={homeTeamProp}
        mySide={mySide}
      />
    </main>
  );
}

// =====================================================================
// 헤더 — 뒤로가기 / 페이지 타이틀
// =====================================================================
function PageHeader({ matchId }: { matchId: string }) {
  return (
    <header className="mb-4 flex items-center justify-between">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span>홈으로</span>
      </Link>
      <span
        className="text-xs tabular-nums"
        style={{ color: "var(--color-text-muted)" }}
      >
        match #{matchId}
      </span>
    </header>
  );
}

// 매치 status → 한국어 라벨 (server / client 모두 사용 가능한 순수 함수)
function labelStatus(status: string): string {
  switch (status) {
    case "scheduled":
      return "예정";
    case "ready":
      return "준비";
    case "in_progress":
      return "진행 중";
    case "completed":
      return "종료";
    default:
      return status;
  }
}

// ISO → "MM/DD HH:mm" 단순 표시 (서버 측 — Asia/Seoul 가정)
function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}/${dd} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}
