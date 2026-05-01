/**
 * Prisma select preset — 회귀 방지용 표준 select 묶음.
 *
 * 사용 이유: select 누락 회귀 방지. 신규 페이지 추가 시마다 매번 inline 으로
 * { name, nickname } 둘 다 select 하는 것을 잊으면 표시 헬퍼가 fallback 으로 빠짐.
 *
 * 규칙: conventions.md [2026-05-01] 참조
 */

/**
 * 선수/유저 표시명 헬퍼 (`getDisplayName`) 호환 select.
 *
 * 사용 예:
 * ```ts
 * const user = await prisma.user.findUnique({
 *   where: { id },
 *   select: { id: true, ...USER_DISPLAY_SELECT, profile_image: true },
 * });
 * ```
 *
 * 또는 nested:
 * ```ts
 * const member = await prisma.teamMember.findMany({
 *   include: { user: { select: USER_DISPLAY_SELECT } },
 * });
 * ```
 */
export const USER_DISPLAY_SELECT = {
  name: true,
  nickname: true,
} as const;
