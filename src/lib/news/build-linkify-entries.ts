// 2026-05-04: 알기자 기사 본문 linkify entries 빌더 (server-side, 재사용 헬퍼)
// 호출처:
//   - 단일: community/[id]/page.tsx, news/match/[matchId]/page.tsx → buildLinkifyEntries
//   - 배치: admin/news/page.tsx (N개 게시물 일괄) → buildLinkifyEntriesBatch (N+1 query 방지)
// 매치 정보 → 양 팀 + 출전 선수 → LinkifyEntry[] 변환.
//
// 정책:
//   - 팀: tournamentTeam.team.id + name → `/teams/{id}`
//   - 선수: is_active=true + userId 있음 + name 길이 >=2
//   - 이름 fallback: users.name → player_name → users.nickname
//   - 중복 이름 제거 (첫 등장 entry 우선)

import { prisma } from "@/lib/db/prisma";
import type { LinkifyEntry } from "./linkify-news-body";

// match select 공통 (단일/배치 동일)
const MATCH_SELECT = {
  homeTeam: {
    select: {
      team: { select: { id: true, name: true } },
      players: {
        where: { is_active: true },
        select: {
          userId: true,
          player_name: true,
          users: { select: { id: true, name: true, nickname: true } },
        },
      },
    },
  },
  awayTeam: {
    select: {
      team: { select: { id: true, name: true } },
      players: {
        where: { is_active: true },
        select: {
          userId: true,
          player_name: true,
          users: { select: { id: true, name: true, nickname: true } },
        },
      },
    },
  },
} as const;

// findMany 결과 1건 → LinkifyEntry[] 변환 (내부 재사용)
type MatchWithTeams = {
  homeTeam: {
    team: { id: bigint; name: string } | null;
    players: Array<{
      userId: bigint | null;
      player_name: string | null;
      users: { id: bigint; name: string | null; nickname: string | null } | null;
    }>;
  } | null;
  awayTeam: {
    team: { id: bigint; name: string } | null;
    players: Array<{
      userId: bigint | null;
      player_name: string | null;
      users: { id: bigint; name: string | null; nickname: string | null } | null;
    }>;
  } | null;
};

function matchToEntries(match: MatchWithTeams): LinkifyEntry[] {
  const entries: LinkifyEntry[] = [];
  const seenNames = new Set<string>();

  for (const tt of [match.homeTeam, match.awayTeam]) {
    if (!tt) continue;
    if (tt.team) {
      entries.push({
        name: tt.team.name,
        href: `/teams/${tt.team.id}`,
        type: "team",
      });
    }
    for (const p of tt.players) {
      if (!p.userId) continue;
      const name = (p.users?.name || p.player_name || p.users?.nickname || "").trim();
      if (name.length >= 2 && !seenNames.has(name)) {
        seenNames.add(name);
        entries.push({
          name,
          href: `/users/${p.userId}`,
          type: "player",
        });
      }
    }
  }

  return entries;
}

/**
 * 단일 매치의 LinkifyEntry[] 빌드.
 * 호출처: community/[id]/page.tsx, news/match/[matchId]/page.tsx
 */
export async function buildLinkifyEntries(matchId: bigint): Promise<LinkifyEntry[]> {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: MATCH_SELECT,
  });
  if (!match) return [];
  return matchToEntries(match);
}

/**
 * 배치 — N개 매치 한 번의 findMany 로 처리.
 * 호출처: admin/news/page.tsx (N개 알기자 게시물 일괄 처리)
 * 반환: Map<matchId.toString(), LinkifyEntry[]>
 */
export async function buildLinkifyEntriesBatch(
  matchIds: bigint[],
): Promise<Map<string, LinkifyEntry[]>> {
  const result = new Map<string, LinkifyEntry[]>();
  if (matchIds.length === 0) return result;

  const matches = await prisma.tournamentMatch.findMany({
    where: { id: { in: matchIds } },
    select: { id: true, ...MATCH_SELECT },
  });

  for (const m of matches) {
    result.set(m.id.toString(), matchToEntries(m));
  }
  return result;
}
