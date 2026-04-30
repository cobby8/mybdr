/* ============================================================
 * /profile/bookings — 내 예약 내역 (BDR v2.2 P1-2 박제)
 *
 * 시안 출처: Dev/design/BDR v2.2/screens/ProfileBookings.jsx (D등급 P1-7)
 * 검수 매트릭스 (사용자 결정 §1-3 / §2 준수):
 *
 * | 기능        | 옛                             | v2.2                          | 진입점          | 모바일      |
 * |-------------|--------------------------------|-------------------------------|-----------------|-------------|
 * | 카테고리 탭 | -                              | ✅ 4탭 (전체/코트/대회/게스트) | 더보기 "내 활동" | hscroll     |
 * | 상태 필터   | 단일 status 라벨               | ✅ 칩 (전체/예약중/완료/취소) | -               | flex-wrap   |
 * | 항목 클릭   | -                              | ✅ 상세 라우팅                | -               | OK          |
 * | 코트 예약   | court_bookings (있음)          | court_bookings 그대로         | -               | OK          |
 * | 대회 신청   | -                              | tournament_teams 신규 조회    | -               | OK          |
 * | 게스트 신청 | -                              | game_applications.is_guest   | -               | OK          |
 *
 * 사용자 결정 §1-3 (user-design-decisions): 빌링 탭 X — 결제 영수증과 혼동 방지.
 *   진입점은 더보기 "내 활동" 그룹 + /profile/bookings 직접 라우트만 유지.
 *
 * 데이터: 서버 컴포넌트에서 3종 prisma 쿼리 병렬
 *   - court_bookings (기존 그대로)
 *   - tournament_teams via registered_by_id (신규)
 *   - game_applications via user_id + is_guest=true (신규)
 *
 * 보존: API/route 0 변경. 취소 액션은 시안에 없으므로 제거하고 상세 페이지에서 처리.
 * ============================================================ */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";
import { BookingsListV2, type BookingItemV2 } from "./_bookings-list-v2";

export const metadata: Metadata = {
  title: "예약 내역 | MyBDR",
};

export const dynamic = "force-dynamic";

// 시안 status 매핑 — 사이트 다양한 status 값을 시안 3종(upcoming/done/cancelled)으로 압축
// 이유(왜): 시안의 칩이 3가지뿐이라 사이트의 confirmed/pending/completed/refunded 등을 그룹핑 필요
function mapCourtStatus(status: string, startAt: Date): "upcoming" | "done" | "cancelled" {
  if (status === "cancelled" || status === "refunded") return "cancelled";
  if (status === "completed") return "done";
  // confirmed/pending: 시작 시각 기준으로 분기 — 미래면 예약중, 과거면 완료
  if (startAt.getTime() > Date.now()) return "upcoming";
  return "done";
}

function mapTournamentStatus(
  status: string | null,
  endDate: Date | null,
): "upcoming" | "done" | "cancelled" {
  if (status === "cancelled" || status === "rejected") return "cancelled";
  // 종료일이 과거면 done
  if (endDate && endDate.getTime() < Date.now()) return "done";
  return "upcoming";
}

function mapGuestStatus(
  status: number,
  scheduledAt: Date,
): "upcoming" | "done" | "cancelled" {
  // game_applications.status: 0=pending 1=approved 2=rejected 3=cancelled (사이트 컨벤션)
  if (status === 2 || status === 3) return "cancelled";
  if (scheduledAt.getTime() < Date.now()) return "done";
  return "upcoming";
}

export default async function MyBookingsPage() {
  const session = await getWebSession();
  if (!session) {
    redirect("/login?redirect=/profile/bookings");
  }
  const userId = BigInt(session.sub);

  // 최근 90일 ~ 향후 ∞ — 3종 데이터를 병렬로 페치 (성능)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [courtBookings, tournamentTeams, guestApplications] = await Promise.all([
    // 1) 코트 예약
    prisma.court_bookings.findMany({
      where: {
        user_id: userId,
        status: { not: "blocked" },
        OR: [
          { start_at: { gte: ninetyDaysAgo } },
          { created_at: { gte: ninetyDaysAgo } },
        ],
      },
      include: {
        court: { select: { id: true, name: true } },
      },
      orderBy: { start_at: "desc" },
      take: 100,
    }),
    // 2) 토너먼트 팀 등록 (사용자가 등록한 팀)
    prisma.tournamentTeam.findMany({
      where: {
        registered_by_id: userId,
        createdAt: { gte: ninetyDaysAgo },
      },
      include: {
        tournament: { select: { id: true, name: true, startDate: true, endDate: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // 3) 게스트 신청 (게임 신청 중 is_guest=true)
    prisma.game_applications.findMany({
      where: {
        user_id: userId,
        is_guest: true,
        created_at: { gte: ninetyDaysAgo },
      },
      include: {
        games: {
          select: {
            id: true,
            title: true,
            scheduled_at: true,
            fee_per_person: true,
            venue_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    }),
  ]);

  // 직렬화 + 시안 데이터 형식으로 변환 (id/kind/title/sub/status/meta/href)
  // 이유(왜): 시안은 단일 형태 카드 리스트라 3종을 동일 인터페이스로 통일
  const items: BookingItemV2[] = [
    ...courtBookings.map((b): BookingItemV2 => {
      const startAt = b.start_at;
      const endAt = b.end_at;
      const dateStr = startAt.toLocaleDateString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
      });
      const timeStr = `${startAt.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false })} – ${endAt.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false })}`;
      const amount = Number(b.final_amount);
      const status = mapCourtStatus(b.status, startAt);
      const metaParts: string[] = [];
      if (amount > 0) metaParts.push(`₩${amount.toLocaleString()}`);
      if (status === "done") metaParts.push("이용 완료");
      else if (status === "cancelled") metaParts.push("취소됨");
      else if (b.status === "confirmed") metaParts.push("결제 완료");
      else if (b.status === "pending") metaParts.push("결제 대기");
      return {
        id: `court-${b.id.toString()}`,
        kind: "court",
        title: b.court.name,
        sub: `${dateStr} ${timeStr}`,
        status,
        meta: metaParts.join(" · ") || "-",
        href: `/courts/${b.court.id.toString()}`,
        sortAt: startAt.getTime(),
      };
    }),
    ...tournamentTeams.map((tt): BookingItemV2 => {
      const startDate = tt.tournament.startDate;
      const dateStr = startDate
        ? startDate.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
        : "일정 미정";
      const status = mapTournamentStatus(tt.status, tt.tournament.endDate);
      const statusLabel = (() => {
        if (tt.status === "approved") return "참가 확정";
        if (tt.status === "pending") return "승인 대기";
        if (tt.status === "rejected") return "참가 거절";
        if (tt.status === "cancelled") return "취소됨";
        return tt.status ?? "신청";
      })();
      return {
        id: `tournament-${tt.id.toString()}`,
        kind: "tournament",
        title: tt.tournament.name,
        sub: `${dateStr} · 팀 ${tt.team.name}`,
        status,
        meta: statusLabel,
        href: `/tournaments/${tt.tournamentId}`,
        sortAt: startDate ? startDate.getTime() : tt.createdAt.getTime(),
      };
    }),
    ...guestApplications.map((ga): BookingItemV2 => {
      const scheduledAt = ga.games.scheduled_at;
      const dateStr = scheduledAt.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
      const timeStr = scheduledAt.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });
      const status = mapGuestStatus(ga.status, scheduledAt);
      const statusLabel = (() => {
        if (ga.status === 1) return "호스트 승인";
        if (ga.status === 0) return "승인 대기";
        if (ga.status === 2) return "거절됨";
        if (ga.status === 3) return "취소됨";
        return "신청";
      })();
      const fee = ga.games.fee_per_person ?? 0;
      const metaParts = [statusLabel];
      if (fee > 0) metaParts.push(`₩${fee.toLocaleString()}`);
      return {
        id: `guest-${ga.id.toString()}`,
        kind: "guest",
        title: ga.games.title || ga.games.venue_name || "게스트 경기",
        sub: `${dateStr} ${timeStr}`,
        status,
        meta: metaParts.join(" · "),
        href: `/games/${ga.games.id.toString()}`,
        sortAt: scheduledAt.getTime(),
      };
    }),
  ];

  // 시작 시각 내림차순 정렬 (가장 가까운 미래/최근 과거 먼저)
  items.sort((a, b) => b.sortAt - a.sortAt);

  // Phase 12 §G — 모바일 백버튼을 page wrapper 에 추가
  return (
    <>
      <div style={{ padding: "12px var(--gutter) 0" }}>
        <PageBackButton fallbackHref="/profile" />
      </div>
      <BookingsListV2 items={items} />
    </>
  );
}
