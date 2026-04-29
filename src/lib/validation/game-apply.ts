// 경기 참가 신청 입력 검증 schema
// 이유: /api/web/games/[id]/apply 가 일반 신청과 게스트(GUEST 게임) 신청 두 가지를 받아야 한다.
//      두 흐름의 body 구조가 달라서 zod discriminator 또는 union 으로 분기해야 한다.
// 입력 키는 snake_case 통일 (응답 변환과 동일 컨벤션).
import { z } from "zod";

// 게스트 신청 body — role:"guest" 디스크리미네이터 + 추가 필드 강제
// position: 포지션 한 글자(G/F/C)
// experience_years: 0~4 (UI: 입문/초보/중급/상급/선출)
// message: 호스트에게 한마디 (선택, 최대 300자)
// accepted_terms: 보험 동의 + 취소 정책 동의 모두 true 강제
export const guestApplySchema = z.object({
  role: z.literal("guest"),
  position: z.enum(["G", "F", "C"]),
  experience_years: z.number().int().min(0).max(4),
  message: z.string().max(300).optional().nullable(),
  accepted_terms: z.object({
    insurance: z.literal(true),
    cancel: z.literal(true),
  }),
});

// 일반 신청 body — 비어있거나 role 없음
// 이유: 기존 호출자(웹/모바일)는 빈 body 로 POST 하므로 빈 객체도 허용.
//      role:"regular" 명시도 허용해서 향후 확장 여지 둠.
export const regularApplySchema = z
  .object({
    role: z.literal("regular").optional(),
  })
  .strict();

// 분기 schema — role 이 "guest" 면 guestApplySchema, 아니면 regular
// 이유: discriminatedUnion 은 모든 분기가 같은 키를 가져야 해서 까다로움.
//      union 으로 두 schema 중 하나에 매칭되면 통과시킨다.
export const applySchema = z.union([guestApplySchema, regularApplySchema]);

export type ApplyInput = z.infer<typeof applySchema>;
export type GuestApplyInput = z.infer<typeof guestApplySchema>;
export type RegularApplyInput = z.infer<typeof regularApplySchema>;

// 게스트 신청인지 좁혀주는 타입 가드
export function isGuestApply(input: ApplyInput): input is GuestApplyInput {
  return (input as { role?: string }).role === "guest";
}

// 구력 라벨 — 호스트 알림 content 에 사용
export const EXPERIENCE_LABELS = ["입문", "초보", "중급", "상급", "선출"] as const;
export function experienceLabel(years: number): string {
  return EXPERIENCE_LABELS[years] ?? `${years}년`;
}
