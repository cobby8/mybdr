/* ============================================================
 * Phase 10-3 B-5 — 게스트 지원 페이지 (server wrapper)
 *
 * 왜 server wrapper 로 분리했는가:
 *  - 박제 페이지는 useState/useRouter 가 필요한 client 였지만,
 *    실제 데이터(게임/호스트)는 server 에서 fetch + 가드해야 한다.
 *  - 미인증 사용자가 도달하지 못하도록 redirect, 게스트 모집이 닫힌
 *    경기는 상세로 되돌리는 등 UI 분기를 server 에서 차단해
 *    client 에 잘못된 props 가 흘러들어가지 않게 한다.
 *
 * 흐름:
 *   1) params.id 추출
 *   2) getWebSession() — 미로그인 → /login?next=...
 *   3) getGame(id)     — 없음 → notFound()
 *   4) game_type !== 1  또는 allow_guests === false → /games/[id]
 *   5) organizer_id === 본인 → /games/[id] (자기 경기에는 지원 불가)
 *   6) host (organizer) 닉네임/이름 별도 조회 → host props
 *   7) 시안 카드용 when/court/level/fee 포맷팅 후 client form 에 주입
 *
 * API/route.ts 변경 0 — POST /api/web/games/[id]/apply 의 게스트 분기는
 * B-3+B-4 에서 이미 구현됨.
 * ============================================================ */

import { notFound, redirect } from "next/navigation";
import { getGame } from "@/lib/services/game";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { GuestApplyForm } from "./_components/guest-apply-form";

// 게임 상세와 동일한 캐시 정책 — 신청 직후 폼 진입 시 데이터가 너무 오래되지 않게
export const revalidate = 30;

// skill_level (DB) → 한글 라벨. games 상세 페이지의 매핑과 동일하게 맞춤
function levelLabel(level: string | null | undefined): string {
  switch (level) {
    case "beginner":
      return "초급";
    case "intermediate":
      return "중급";
    case "advanced":
      return "고급";
    case "all":
    default:
      return "전체";
  }
}

// scheduled_at + duration_hours → "2026.04.27 (토) 07:00 - 09:00" 형태
// 시안 라인 14 (g.when) 와 동일 포맷 — Asia/Seoul 기준
function formatWhen(scheduledAt: Date, durationHours: number | null | undefined): string {
  const start = new Date(scheduledAt);
  const dur = durationHours ?? 2;
  const end = new Date(start.getTime() + dur * 60 * 60 * 1000);

  const dows = ["일", "월", "화", "수", "목", "금", "토"];
  const tz = "Asia/Seoul";
  const dateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // en-CA → "2026-04-27" 형식 → "2026.04.27" 로 치환
  const datePart = dateFmt.format(start).replace(/-/g, ".");
  const dow = dows[start.getDay()];
  const startTime = timeFmt.format(start);
  const endTime = timeFmt.format(end);
  return `${datePart} (${dow}) ${startTime} - ${endTime}`;
}

// fee_per_person (Int, 원 단위) → "5,000원" / "무료"
function formatFee(fee: number | null | undefined): string {
  if (!fee || fee <= 0) return "무료";
  return `${fee.toLocaleString("ko-KR")}원`;
}

export default async function GuestApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1) 인증 가드 — 미로그인 시 로그인 페이지로 보내고, 로그인 후 다시 돌아오게 next 파라미터 동봉
  const session = await getWebSession();
  if (!session) {
    redirect(`/login?next=/games/${encodeURIComponent(id)}/guest-apply`);
  }

  // 2) 게임 조회 — short uuid / full uuid / 숫자 id 모두 처리
  const game = await getGame(id);
  if (!game) return notFound();

  // 3) 게스트 모집 가능 게임인가? (game_type=1 = GUEST, allow_guests !== false)
  // 이유: 호스트가 모집을 닫았거나 게스트 게임이 아닌데 직접 URL 입력 시
  //       client 단에서 빈 폼이 그려지지 않도록 server 에서 차단.
  if (game.game_type !== 1 || game.allow_guests === false) {
    redirect(`/games/${id}`);
  }

  // 4) 본인이 호스트인 경기는 지원 불가 — apply route 에서도 막지만 UX 차원에서 사전 차단
  const currentUserId = BigInt(session.sub);
  if (game.organizer_id === currentUserId) {
    redirect(`/games/${id}`);
  }

  // 5) 호스트(organizer) 정보 — 시안 라인 17 의 host.name / host.tag 채우기 위해 별도 조회
  // getGame() 은 users 관계를 include 하지 않아 별도 쿼리. select 최소화.
  const host = await prisma.user.findUnique({
    where: { id: game.organizer_id },
    select: { name: true, nickname: true },
  });

  // 호스트 표시명: nickname > name > "호스트" 순서로 fallback
  const hostName = host?.nickname || host?.name || "호스트";
  // 시안 host.tag 는 식별용 짧은 라벨 — 닉네임 앞 3자 또는 "HOST"
  const hostTag = (host?.nickname || host?.name || "HOST").slice(0, 3).toUpperCase();

  // 6) 시안 카드용 표시 문자열 조립 — 모든 필드 server 에서 포맷팅 완료
  const courtName = [game.venue_name, game.venue_address].filter(Boolean).join(" ") || "장소 미정";

  return (
    <GuestApplyForm
      gameId={id}
      game={{
        title: game.title ?? "경기",
        when: formatWhen(game.scheduled_at, game.duration_hours),
        court: courtName,
        level: levelLabel(game.skill_level),
        fee: formatFee(game.fee_per_person),
      }}
      host={{ name: hostName, tag: hostTag }}
    />
  );
}
