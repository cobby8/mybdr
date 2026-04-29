import { z } from "zod";

/**
 * Phase 10-4 — 팀 팔로우 + 매치 신청 zod 스키마
 *
 * 이유(왜): API route 에서 body 검증을 일관되게 처리하기 위해 zod schema를 분리한다.
 * 팔로우는 path param만 사용하므로 별도 body schema가 없고,
 * 매치 신청은 from_team_id 필수 + message/preferred_date 선택 형태이다.
 *
 * 보안 메모:
 * - to_team_id 는 URL path 의 [id] 로부터 받으므로 body에는 없음 (스푸핑 방지)
 * - from_team_id 는 body 에서 받되, API 에서 실제 운영진(captain/manager) 인지 검증
 * - message 길이 제한: 1,000자 (UI/알림 가독성 위해)
 */

// 매치 신청 — POST body
export const teamMatchRequestCreateSchema = z.object({
  // 제안자 측 팀 (보통 신청자가 운영진인 팀). API 단에서 권한 재검증.
  from_team_id: z.string().regex(/^\d+$/, "유효하지 않은 값입니다."),
  // 메시지 — 최대 1,000자, 빈 문자열은 null 처리(트리밍 후)
  message: z.string().max(1000).optional().nullable(),
  // 선호 일시 — ISO 8601. 검증만 하고 변환은 route 에서 new Date() 처리.
  preferred_date: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable(),
});

export type TeamMatchRequestCreateInput = z.infer<
  typeof teamMatchRequestCreateSchema
>;
