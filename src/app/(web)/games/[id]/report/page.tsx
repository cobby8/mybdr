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
// 2026-05-12 로그인 redirect 통합 — `returnTo=` 쿼리 → `redirect=` 표준 통일
import { buildLoginRedirect } from "@/lib/auth/redirect";
import { GameReportForm, type ReportPlayer } from "./_components/report-form";
// [v2.16 Phase 3-3] 상단 GameCard 미니 — 작업지시서 §3-3 일관성
import { GameCard } from "@/components/bdr-v2/game-card";
// [M3 보완 ①, 2026-06-19] report 직링크로 진입한 종료 경기를 DB status=3 으로 동기화.
//   - getGame 을 거치지 않는 직링크 경로라 lazyEndGame 미발동 → 권한검사(canReportGame) 400 차단 결함 보강.
import { lazyEndGame } from "@/lib/services/game";

// 동적 — 매 요청마다 세션/참가자 변경될 수 있음. 캐시 X.
export const dynamic = "force-dynamic";

export default async function GameReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;

  // 1. 세션 가드 — 비로그인은 로그인 페이지로 (redirect 쿼리에 현재 경로 보존)
  //    2026-05-12: `returnTo=` → `redirect=` 통일 (login page 가 redirect 쿼리만 읽음).
  const session = await getWebSession();
  if (!session) {
    redirect(buildLoginRedirect(`/games/${id}/report`));
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
  const gameRow = await prisma.games.findUnique({
    where: { uuid: fullUuid },
    select: {
      id: true,
      title: true,
      scheduled_at: true,
      organizer_id: true,
      status: true,
      // [v2.16 Phase 3-3] GameCard 미니 상단 표시용 추가 필드
      game_type: true,
      city: true,
      district: true,
      venue_name: true,
      duration_hours: true,
      fee_per_person: true,
      skill_level: true,
      max_participants: true,
      current_participants: true,
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
  if (!gameRow) notFound();

  // [M3 보완 ①, 2026-06-19] 권한검사(canReportGame) 전에 lazy 종료 동기화 먼저 발동.
  //   왜: report 직링크는 getGame 미경유라, 종료시각이 지난 경기라도 DB status 가 아직 1/2 면
  //       client 폼이 호출하는 GET /report API 의 canReportGame 이 status!==3 으로 400 차단함.
  //   방법: 종료시각(scheduled_at + duration_hours) 지난 1/2 경기를 멱등 UPDATE 로 DB status=3 으로 승급.
  //       lazyEndGame 은 status 만 보정한 동일 객체를 반환하므로 이후 game.users 등 사용에 영향 0.
  //       select 4컬럼(id/status/scheduled_at/duration_hours)은 위에 이미 포함 → 추가 조회 0.
  const game = await lazyEndGame(gameRow);

  // 3. 승인된 참가 신청자 조회 (status === 1 = approved)
  // 참가자 fetch가 실패하더라도 호스트 1명만으로 폼 진입 가능하도록, organizer는 별도로 합산.
  const applications = await prisma.game_applications.findMany({
    where: { game_id: game.id, status: 1 },
    select: {
      // [M3 wave2] 출석 여부 prefill 용 — attended_at 유무로 노쇼 후보 판정.
      attended_at: true,
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

  // 호스트(organizer) 먼저 추가 — 호스트는 출석 체크 대상이 아니므로 항상 attended=true(노쇼 아님).
  if (game.users) {
    const u = game.users;
    playerMap.set(u.id.toString(), {
      id: u.id.toString(),
      nickname: u.nickname,
      name: u.name,
      image: u.profile_image,
      position: u.position,
      attended: true,
    });
  }

  // 신청 승인된 참가자 추가 — attended_at(DateTime|null) 유무로 출석 판정.
  //   attended_at !== null → 출석(true) / null → 미출석(false, 노쇼 후보).
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
      attended: a.attended_at !== null,
    });
  }

  const players: ReportPlayer[] = Array.from(playerMap.values());

  // [M3 보완 ③, 2026-06-19] 출석 섹션 "실사용" 여부 파생.
  //   왜: 호스트가 출석 체크를 안 쓰면 승인자 전원 attended_at=null → 신규 리포트에서 전원 노쇼 제안되어 혼란.
  //   판정: 승인 참가 신청(applications) 중 1명이라도 attended_at!==null 이면 = 호스트가 출석 섹션을 실제 사용한 것.
  //        → 이때만 노쇼 prefill 발동(미체크자만 노쇼). 전원 null(아무도 체크 안 함)이면 미사용 → prefill 0.
  //   호스트 본인은 출석 체크 대상이 아니므로(playerMap에서 항상 attended=true) 판정에서 제외 — applications 만 본다.
  const attendanceUsed = applications.some((a) => a.attended_at !== null);

  // [v2.16 Phase 3-3] GameCard 미니 prop 매핑
  const tags: string[] = [];
  if (!game.fee_per_person || game.fee_per_person === 0) tags.push("무료");
  if (
    game.skill_level &&
    ["beginner", "lowest", "low"].includes(game.skill_level)
  ) {
    tags.push("초보환영");
  }
  if (game.scheduled_at) {
    const dow = game.scheduled_at.getDay();
    if (dow === 0 || dow === 6) tags.push("주말");
  }
  const areaLabel = [game.city, game.district].filter(Boolean).join(" ");
  const hostNickname = game.users?.nickname ?? game.users?.name ?? null;

  // 5. client 폼 렌더 — 권한 체크/임시저장/제출은 client에서
  return (
    <div className="page">
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* [v2.16 Phase 3-3] 상단 GameCard 미니 — 시안 §3-3 일관성 */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 8,
            }}
          >
            평가 대상 경기
          </div>
          <GameCard
            href={`/games/${id}`}
            gameType={game.game_type}
            status={game.status}
            title={game.title}
            venueName={game.venue_name}
            areaLabel={areaLabel}
            scheduledAt={game.scheduled_at?.toISOString() ?? null}
            durationHours={game.duration_hours ?? null}
            skillLevel={game.skill_level}
            feePerPerson={game.fee_per_person?.toString() ?? null}
            currentParticipants={game.current_participants ?? 0}
            maxParticipants={game.max_participants ?? 10}
            authorNickname={hostNickname}
            tags={tags}
          />
        </div>

        <GameReportForm
          gameId={id}
          game={{
            title: game.title,
            date: game.scheduled_at ? game.scheduled_at.toISOString() : null,
            host_nickname: game.users?.nickname ?? null,
          }}
          players={players}
          currentUserId={session.sub}
          // [M3 보완 ③] 출석 섹션 실사용 여부 — false 면 신규 노쇼 prefill 0(빈 배열).
          attendanceUsed={attendanceUsed}
        />
      </div>
    </div>
  );
}
