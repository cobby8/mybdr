/**
 * TeamSection 관련 공유 타입 — page.tsx (server) ↔ TeamSection (client) 간 prop 정합.
 *
 * 2026-05-11 — Phase 1 신규.
 *
 * 왜 (이유):
 *   page.tsx server component 는 prisma 모델 → 직렬화 후 client prop 전달.
 *   본 타입을 별도 파일에 두면 server 측에서도 import 가능 (client-only "use client"
 *   파일에서 import 시 직렬화 룰 위반 회피).
 */

export interface RosterItem {
  tournamentTeamPlayerId: string; // bigint → string
  jerseyNumber: number | null;
  role: string | null;
  displayName: string;
  userId: string | null;
  isStarter: boolean; // 사전 라인업 starters[] 포함 여부
  isInLineup: boolean; // starters + substitutes 합집합 포함 여부
}

export interface TeamRosterData {
  teamSide: "home" | "away";
  teamName: string;
  tournamentTeamId: string | null;
  hasConfirmedLineup: boolean;
  players: RosterItem[];
}
