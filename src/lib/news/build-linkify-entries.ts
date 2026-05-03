// 2026-05-04: 알기자 기사 본문 linkify entries 빌더 (server-side, 재사용 헬퍼)
// 호출처: community/[id]/page.tsx, news/match/[matchId]/page.tsx, admin/news/page.tsx
// 매치 정보 → 양 팀 + 출전 선수 → LinkifyEntry[] 변환.
//
// 정책:
//   - 팀: tournamentTeam.team.id + name → `/teams/{id}`
//   - 선수: is_active=true + userId 있음 + name 길이 >=2
//   - 이름 fallback: users.name → player_name → users.nickname
//   - 중복 이름 제거 (첫 등장 entry 우선)

import { prisma } from "@/lib/db/prisma";
import type { LinkifyEntry } from "./linkify-news-body";

export async function buildLinkifyEntries(matchId: bigint): Promise<LinkifyEntry[]> {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
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
    },
  });
  if (!match) return [];

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
