// 경기 후 리포트 페이지 (server wrapper)
// 이유:
//   - Phase 10-1 후속 1: PLACEHOLDER_PLAYERS 제거 → 실제 game 참가자 fetch.
//   - server에서 인증/게임/참가자 fetch + props 전달 → client는 form 로직만.
//   - 비로그인은 server에서 즉시 redirect (client에서 fetch 401 받기 전 차단).
//   - 게임 미존재는 notFound() — 시안 박제 화면이 아닌 Next.js 기본 404 페이지로.
//   - 종료 안 됨/참가자 아님 등 권한 체크는 client GET API 가드(403/400)에 위임.
//     → 이유: 동일한 메시지/UX를 두 번 만들 필요 없음 + DRY. 참가자 fetch는 정책 검증과 관계없이 표시 데이터 전달용.
//
// params.id 는 games.uuid (디렉터리 컨벤션 — /api/web/games/[id]/report/route.ts 와 동일).

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect, notFound } from "next/navigation";
import { GameReportForm, type ReportPlayer } from "./_components/report-form";

// 동적 — 매 요청마다 세션/참가자 변경될 수 있음. 캐시 X.
export const dynamic = "force-dynamic";

export default async function GameReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;

  // 1. 세션 가드 — 비로그인은 로그인 페이지로 (returnTo 보존)
  const session = await getWebSession();
  if (!session) {
    redirect(`/login?returnTo=/games/${id}/report`);
  }

  // 2. uuid → game 조회 (route.ts 와 동일 컨벤션)
  // 2026-04-29 (E-1): /api/web/games/[id]/apply/route.ts:38-51 와 동일하게
  // 8자 단축 UUID도 허용. my-games "후기 작성" 링크는 /games/{uuid.slice(0,8)}/report
  // 형태로 들어오므로 변환 안 하면 무조건 notFound() 됨.
  // hex 8자 외 문자 차단(% 와일드카드 인젝션 방지) — TC-042와 동일 정책.
  let fullUuid = id;
  if (id.length === 8) {
    if (!/^[a-f0-9]{8}$/.test(id)) notFound();
    const rows = await prisma.$queryRaw<{ uuid: string }[]>`
      SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
    `;
    if (!rows[0]?.uuid) notFound();
    fullUuid = rows[0].uuid;
  }

  // organizer는 시안 박제용 — 헤더 "호스트로서 리포트 작성" 라벨에 사용
  const game = await prisma.games.findUnique({
    where: { uuid: fullUuid },
    select: {
      id: true,
      title: true,
      scheduled_at: true,
      organizer_id: true,
      status: true,
      // schema.prisma 1286: relation 이름이 `users` (organizer 아님)
      users: {
        select: {
          id: true,
          nickname: true,
          name: true,
          profile_image: true,
          position: true,
        },
      },
    },
  });
  if (!game) notFound();

  // 3. 승인된 참가 신청자 조회 (status === 1 = approved)
  // 참가자 fetch가 실패하더라도 호스트 1명만으로 폼 진입 가능하도록, organizer는 별도로 합산.
  const applications = await prisma.game_applications.findMany({
    where: { game_id: game.id, status: 1 },
    select: {
      users: {
        select: {
          id: true,
          nickname: true,
          name: true,
          profile_image: true,
          position: true,
        },
      },
    },
  });

  // 4. 호스트 + 참가자 통합 (Map으로 중복 제거 — 호스트가 동시에 신청자일 수도 있음)
  // key는 BigInt id의 string 표현 (id는 BigInt → toString)
  const playerMap = new Map<string, ReportPlayer>();

  // 호스트(organizer) 먼저 추가
  if (game.users) {
    const u = game.users;
    playerMap.set(u.id.toString(), {
      id: u.id.toString(),
      nickname: u.nickname,
      name: u.name,
      image: u.profile_image,
      position: u.position,
    });
  }

  // 신청 승인된 참가자 추가
  for (const a of applications) {
    if (!a.users) continue;
    const u = a.users;
    const key = u.id.toString();
    if (playerMap.has(key)) continue;
    playerMap.set(key, {
      id: key,
      nickname: u.nickname,
      name: u.name,
      image: u.profile_image,
      position: u.position,
    });
  }

  const players: ReportPlayer[] = Array.from(playerMap.values());

  // 5. client 폼 렌더 — 권한 체크/임시저장/제출은 client에서
  return (
    <GameReportForm
      gameId={id}
      game={{
        title: game.title,
        date: game.scheduled_at ? game.scheduled_at.toISOString() : null,
        host_nickname: game.users?.nickname ?? null,
      }}
      players={players}
      currentUserId={session.sub}
    />
  );
}
