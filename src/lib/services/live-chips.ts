/**
 * Live Chips Service — BG7 라이브 띠 데이터 공유 모듈 (Phase 2C · UC2/UA1/UA5 공용)
 *
 * 왜 공유 모듈인가:
 *   홈(UC2) page.tsx 와 경기 목록(UA1) games/page.tsx 가 동일한 LIVE 데이터를 쓴다.
 *   각자 조회하면 쿼리/매핑 규칙이 표류(divergence)할 위험이 있어 한 곳에서 관리한다.
 *   PR-2C-1 의 홈 전용 prefetchLiveChips() 를 이 모듈로 추출 — 동작/결과는 100% 동일.
 *
 * 데이터 출처 = tournamentMatch (status in ["live","in_progress"]).
 *   시안 LiveChipRow 의 "Q3 14-10"(라이브 스코어) / 팀 vs 팀 / 대회 round 는
 *   라이브 스코어 추적이 있는 tournamentMatch 에만 존재 (픽업 games 엔 라이브 스코어 필드 없음).
 *   /api/live route 와 동일한 status 쿼리 패턴을 답습.
 *
 * 결과 0건이면 빈 배열 → LiveChipRow 가 null 반환(띠 hide). 가짜 데이터 절대 생성 안 함.
 */
import { prisma } from "@/lib/db/prisma";
import type { LiveChipItem } from "@/components/bdr-v2/live-chip-row";
import { LIVE_MATCH_STATUSES } from "@/lib/constants/match-status";

/* -- BG7: 진행 중 라이브 매치(대회 경기) 조회 → LiveChipItem[] 매핑 --
 * take: 8 — Hero/페이지 상단 띠라 과다 노출 방지 (5건+ 가로 스크롤). started_at desc = 최근 시작 우선.
 * (PR-2C-1 홈 page.tsx 의 로컬 prefetchLiveChips() 와 동일 로직 — 그대로 이전) */
export async function getLiveChips(): Promise<LiveChipItem[]> {
  const matches = await prisma.tournamentMatch.findMany({
    where: { status: { in: [...LIVE_MATCH_STATUSES] } },
    orderBy: { started_at: "desc" },
    take: 8,
    include: {
      homeTeam: { include: { team: { select: { name: true } } } },
      awayTeam: { include: { team: { select: { name: true } } } },
      tournament: { select: { name: true } },
    },
  });

  return matches.map((m) => {
    // 팀명 — 미연결 매치 방어용 fallback (시안 "홈/원정" 톤 유지)
    const home = m.homeTeam?.team?.name ?? "홈";
    const away = m.awayTeam?.team?.name ?? "원정";
    // 대회명 · round → meta (round 없으면 대회명만, 둘 다 없으면 빈 문자열)
    const meta = [m.tournament?.name, m.roundName].filter(Boolean).join(" · ");
    return {
      id: Number(m.id),
      title: `${home} vs ${away}`,
      // 라이브 스코어 라벨 "14 - 10" (DB camelCase 필드 그대로 — null 시 0)
      label: `${m.homeScore ?? 0} - ${m.awayScore ?? 0}`,
      meta,
    };
  });
}
