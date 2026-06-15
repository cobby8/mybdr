/**
 * 팀(team) 검수 상태 상수 — Admin Console S1-4 팀 검수 도입.
 *
 * 왜 (이유):
 * - 기존 Team.status 는 자유 문자열(@db.VarChar, default "active") 이라 검수 상태 값이
 *   파일마다 흩어지면 오타/불일치 위험이 크다.
 * - 팀 생성(actions/teams) · 공개 목록 필터(api/web/teams) · 인박스 큐(admin/inbox) ·
 *   검수 처리(admin/teams/[id]/review) 가 모두 같은 정의를 공유하도록 단일 source 로 묶는다.
 *
 * 제약: schema 변경 0 (문자열 컬럼 그대로 사용). 기존 active 팀 93건은 소급 변경하지 않는다.
 */

// 팀 검수 상태 3종.
// - active         : 검수 통과(공개). 기존 데이터 기본값과 동일.
// - pending_review : 신규 생성 직후. 운영자 검수 대기(본인에게만 보임).
// - rejected       : 운영자 반려.
export const TEAM_STATUS = {
  ACTIVE: "active",
  PENDING_REVIEW: "pending_review",
  REJECTED: "rejected",
} as const;

export type TeamStatus = (typeof TEAM_STATUS)[keyof typeof TEAM_STATUS];

/**
 * 검수 큐(인박스/카운트) 대상 where 조건.
 *
 * 왜: admin/inbox 목록과 admin/overview 카운트가 "검수 대기 팀" 을 똑같은 기준으로
 *     조회하도록 한 곳에 정의. 둘이 어긋나면 큐 숫자와 실제 목록이 불일치한다.
 *
 * 어떻게: status === "pending_review" 인 팀만. (Prisma where 조각으로 그대로 spread)
 */
export const teamReviewQueueWhere = {
  status: TEAM_STATUS.PENDING_REVIEW,
} as const;
