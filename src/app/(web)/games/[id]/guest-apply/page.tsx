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
// 2026-05-12 로그인 redirect 통합 — `next=` 쿼리 → `redirect=` 표준 통일 (login page 가 redirect 만 읽음)
import { buildLoginRedirect } from "@/lib/auth/redirect";
import { GuestApplyForm } from "./_components/guest-apply-form";
// [v2.16 Phase 3-3] 상단 GameCard 미니 — 작업지시서 §3-3 "guest-apply 상단에 GameCard 미니 표시"
import { GameCard } from "@/components/bdr-v2/game-card";

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

  // 1) 인증 가드 — 미로그인 시 로그인 페이지로 보내고, 로그인 후 다시 돌아오게 redirect 파라미터 동봉.
  //    2026-05-12: `next=` → `redirect=` 통일 (login page 가 redirect 쿼리만 읽음).
  const session = await getWebSession();
  if (!session) {
    redirect(buildLoginRedirect(`/games/${id}/guest-apply`));
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

  // 5-1) [PR-2C-6 BG3] 본인(신청자) 프로필 조회 — 게스트 신청 폼 prefill 용
  // 왜 추가했나: 기존 page.tsx 는 host 정보만 조회했고, 폼의 구력/포지션 기본값과
  //   "내 프로필 미리보기" 박스가 하드코딩(mock)이었다. 본인 skill_level/position 을
  //   실데이터로 가져와 신청 폼에 자동 채우기(prefill)하기 위한 server 조회 1건.
  //   schema 변경 없음 — 기존 user 컬럼만 select. (데이터 정책 결재 2026-05-29 허용)
  const me = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      nickname: true,
      name: true,
      skill_level: true, // 문자열: beginner | intermediate | advanced | all | null
      position: true, // 주 포지션 문자열 (Guard/Forward/Center 등 자유 입력 가능)
      level: true, // 게이미피케이션 XP 레벨 (미리보기 Lv.N)
      manner_score: true, // 매너 평균 (Decimal, 평가 0건이면 null)
      total_games_participated: true, // 누적 참가 횟수 (픽업 이력)
    },
  });

  // 호스트 표시명: nickname > name > "호스트" 순서로 fallback
  const hostName = host?.nickname || host?.name || "호스트";
  // 시안 host.tag 는 식별용 짧은 라벨 — 닉네임 앞 3자 또는 "HOST"
  const hostTag = (host?.nickname || host?.name || "HOST").slice(0, 3).toUpperCase();

  // 6) 시안 카드용 표시 문자열 조립 — 모든 필드 server 에서 포맷팅 완료
  const courtName = [game.venue_name, game.venue_address].filter(Boolean).join(" ") || "장소 미정";

  // [v2.16 Phase 3-3] GameCard 미니 prop 매핑 (자동 tags 인라인 파생)
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

  // [PR-2C-6 BG3] skill_level(문자열) → 구력 select 인덱스("0"~"4") 매핑
  // 왜: 시안은 skill 숫자(1~5)를 가정했지만 운영 user.skill_level 은 문자열이다.
  //   운영 폼은 이미 select 5종("1년미만"~"10년이상") 이므로, 본인 실력 문자열을
  //   가장 가까운 구력 인덱스로 합리적 매핑해 기본값으로 제공한다 (수정 가능).
  //   null/미설정이면 undefined 반환 → 폼이 기존 기본값("2") 유지 + 힌트 숨김.
  function skillToExpIndex(skill: string | null | undefined): string | undefined {
    switch (skill) {
      case "beginner":
        return "0"; // 1년 미만
      case "intermediate":
        return "2"; // 3~5년
      case "advanced":
        return "3"; // 5~10년
      default:
        return undefined; // "all" / null / 미상 → prefill 안 함
    }
  }

  // skill_level 문자열 → 한글 라벨 (힌트 표시용). null 이면 undefined.
  function skillKoLabel(skill: string | null | undefined): string | undefined {
    switch (skill) {
      case "beginner":
        return "초급";
      case "intermediate":
        return "중급";
      case "advanced":
        return "고급";
      default:
        return undefined;
    }
  }

  // position(자유 입력 문자열) → G/F/C 매핑. 한/영 흔한 표기를 폭넓게 수용.
  // 매핑 안 되면 undefined → 폼이 기존 기본값("G") 유지.
  function positionToGFC(p: string | null | undefined): "G" | "F" | "C" | undefined {
    if (!p) return undefined;
    const s = p.toLowerCase();
    if (s.includes("center") || s.includes("센터") || s === "c") return "C";
    if (s.includes("forward") || s.includes("포워드") || s === "f") return "F";
    if (s.includes("guard") || s.includes("가드") || s === "g") return "G";
    return undefined;
  }

  // 폼에 넘길 prefill 셋 — 모두 본인 user 실데이터(없으면 undefined → 폼이 기본값 유지)
  const expDefault = skillToExpIndex(me?.skill_level);
  const posDefault = positionToGFC(me?.position);
  const skillLabel = skillKoLabel(me?.skill_level);

  return (
    <div className="page">
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* [v2.16 Phase 3-3] 상단 GameCard 미니 — 시안 §3-3 의도 박제 */}
        <div className="gd-mini-card-wrap" style={{ marginBottom: 18 }}>
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
            지원할 경기
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
            authorNickname={hostName}
            tags={tags}
          />
        </div>

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
          // [PR-2C-6 BG3] 본인 프로필 prefill — 모두 실데이터(없으면 undefined → 폼이 기본값 유지)
          me={{
            nickname: me?.nickname || me?.name || "나",
            expDefault, // skill_level → 구력 select 기본값("0"~"4")
            skillLabel, // 힌트용 실력 한글 라벨 (있을 때만 prefill 힌트 노출)
            posDefault, // position → 주 포지션 기본값(G/F/C)
            level: me?.level ?? null,
            mannerScore: me?.manner_score ? Number(me.manner_score) : null,
            gamesPlayed: me?.total_games_participated ?? null,
          }}
        />
      </div>
    </div>
  );
}
