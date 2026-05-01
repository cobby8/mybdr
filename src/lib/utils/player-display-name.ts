/**
 * 선수/유저 표시명 결정 헬퍼.
 *
 * 우선순위: User.name → User.nickname → TournamentTeamPlayer.player_name → '#{jersey}' placeholder
 *
 * 사용처: 경기 관련 모든 페이지 (대회/팀 로스터/라이브/시상/통계/Flutter v1 API)
 * 미사용: 채팅·커뮤니티·본인 프로필 (닉네임 메인 컨텍스트)
 *
 * 규칙: conventions.md [2026-05-01] 참조
 */

export type DisplayUserInput = {
  name?: string | null;
  nickname?: string | null;
} | null | undefined;

export type DisplayPlayerInput = {
  player_name?: string | null;
  jerseyNumber?: number | null;
} | null | undefined;

/**
 * 표시명 1줄 반환.
 * @param user - User 부분 (name, nickname 만 필요)
 * @param ttp - TournamentTeamPlayer 부분 (옵션 — 등록명 fallback 용)
 * @param fallback - 모든 fallback 실패 시 표시할 값 (기본: '선수'). 예: `Player#${id}` (랭킹/시상 컨텍스트)
 * @returns 표시명. 모든 fallback 실패 시 fallback 값 반환 (절대 빈 문자열 X)
 */
export function getDisplayName(
  user: DisplayUserInput,
  ttp?: DisplayPlayerInput,
  fallback?: string,
): string {
  if (user?.name && user.name.trim()) return user.name.trim();
  if (user?.nickname && user.nickname.trim()) return user.nickname.trim();
  if (ttp?.player_name && ttp.player_name.trim()) return ttp.player_name.trim();
  if (ttp?.jerseyNumber !== null && ttp?.jerseyNumber !== undefined) {
    return `#${ttp.jerseyNumber}`;
  }
  return fallback ?? "선수";
}

/**
 * 보조 라인 (실명 옆 닉네임 표시 시).
 * 실명과 닉네임이 모두 있고 다를 때만 닉네임 반환. 그 외 null.
 */
export function getSecondaryNickname(user: DisplayUserInput): string | null {
  if (!user?.name || !user.name.trim()) return null;
  if (!user.nickname || !user.nickname.trim()) return null;
  if (user.name.trim() === user.nickname.trim()) return null;
  return user.nickname.trim();
}
