// 게임 리포트(평점/신고) 입력 검증 schema
// 이유: 라우트 핸들러에서 withValidation 으로 일관된 검증을 적용하기 위함.
// 응답은 snake_case 변환되므로 입력 키도 snake_case 로 통일.
import { z } from "zod";

// 신고 플래그 6종 — DB 의 game_player_ratings.flags(text[]) 에 저장
// no_show: 노쇼 / late: 지각 / poor_manner: 매너 불량 / foul: 과한 파울
// verbal: 언어 폭력 / cheat: 부정행위
export const PLAYER_FLAGS = [
  "no_show",
  "late",
  "poor_manner",
  "foul",
  "verbal",
  "cheat",
] as const;
export type PlayerFlag = (typeof PLAYER_FLAGS)[number];

// 선수별 평점 — 한 리포트 안에 여러 선수에 대한 평가가 들어옴
export const playerRatingSchema = z.object({
  // user_id 는 BigInt 기반 문자열(전부 숫자) — uuid 가 아님에 주의
  rated_user_id: z.string().regex(/^\d+$/, "유효하지 않은 유저 ID"),
  // 1~5 정수 평점
  rating: z.number().int().min(1).max(5),
  // 신고 플래그 배열 — 빈 배열 기본값
  flags: z.array(z.enum(PLAYER_FLAGS)).default([]),
  // 노쇼 여부 (별도 boolean — flags 와 별개로 manner_count 집계에 사용)
  is_noshow: z.boolean().default(false),
});

// 리포트 제출 (POST body) — 한 게임에 대한 작성자 1명의 전체 평가
export const createReportSchema = z.object({
  // 게임 전체 평점 1~5
  overall_rating: z.number().int().min(1).max(5),
  // 자유 코멘트 — 최대 2000자, 선택값
  comment: z.string().max(2000).optional().nullable(),
  // MVP 로 지목한 유저 — 선택값(미지목 가능)
  mvp_user_id: z.string().regex(/^\d+$/).optional().nullable(),
  // 선수별 평점 — 최소 1명, 최대 20명
  ratings: z.array(playerRatingSchema).min(1).max(20),
});

// PATCH(수정) 는 동일 schema 재사용 — 부분 수정이 아닌 전체 교체 방식
export const updateReportSchema = createReportSchema;

// 라우트 핸들러에서 사용할 타입 export
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type PlayerRatingInput = z.infer<typeof playerRatingSchema>;
