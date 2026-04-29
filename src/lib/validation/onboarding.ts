// Phase 10-5 — 온보딩 완료 입력 검증 schema
//
// 이유(왜):
//   /onboarding/setup 위저드가 모은 클라이언트 state 를 DB 에 저장할 때
//   route 에서 직접 검증하면 화이트리스트 누락 / 한도 초과 / 잘못된 enum
//   값이 들어올 위험이 있다. zod 로 한 번에 차단한다.
//
// 응답이 snake_case 로 자동 변환되므로 입력 키도 snake_case 통일.
import { z } from "zod";

// 시안 박제: /onboarding/setup page.tsx 의 STYLE_OPTIONS 12종 그대로
export const ONBOARDING_STYLES = [
  "3점 슈터", "돌파형", "포스트업", "패서", "수비수", "올라운더",
  "리바운더", "블락커", "허슬러", "전환 빠른", "시스템 플레이", "야전 타입",
] as const;
export type OnboardingStyle = (typeof ONBOARDING_STYLES)[number];

// 시안 박제: AREA_OPTIONS 18종 그대로 (서울 + 인접 시)
export const ONBOARDING_AREAS = [
  "강남", "서초", "송파", "성동", "용산", "중구",
  "마포", "영등포", "구로", "금천", "관악", "동작",
  "성북", "강동", "광진", "하남", "고양", "부천",
] as const;
export type OnboardingArea = (typeof ONBOARDING_AREAS)[number];

// 시안 박제: GOAL_OPTIONS 6종 v 값
export const ONBOARDING_GOALS = [
  "friends", "fit", "skill", "compete", "team", "fun",
] as const;
export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number];

// 시안 박제: FREQ_OPTIONS 4종 v 값
export const ONBOARDING_FREQUENCIES = [
  "daily", "weekly", "monthly", "rare",
] as const;
export type OnboardingFrequency = (typeof ONBOARDING_FREQUENCIES)[number];

// 시안 박제: POSITIONS 3종
export const ONBOARDING_POSITIONS = ["G", "F", "C"] as const;

// 시안 박제: LEVELS 6종 (한국어 라벨이 그대로 DB 값)
export const ONBOARDING_LEVELS = [
  "초보", "초-중급", "중급", "중-상급", "상급", "선출급",
] as const;

// 알림 4종 키 (시안 NOTI_OPTIONS) — notification_settings JSON 에 저장
export const ONBOARDING_NOTI_KEYS = [
  "games", "tournaments", "messages", "marketing",
] as const;
type NotiKey = (typeof ONBOARDING_NOTI_KEYS)[number];

// 알림 토글 객체 — 4개 키 모두 boolean (선택 누락 시 false 처리는 route 에서)
const notificationsSchema = z.object(
  ONBOARDING_NOTI_KEYS.reduce((acc, k) => {
    acc[k] = z.boolean();
    return acc;
  }, {} as Record<NotiKey, z.ZodBoolean>),
);

// POST /api/web/onboarding/complete body
//
// 단계별 입력 정책:
//   - position / level / play_frequency: 단일 값. 비었으면 null 허용.
//   - styles / areas / goals: 다중 배열. 화이트리스트 외 값은 거부.
//   - styles 는 위저드에서 최대 4 강제 → API 에서도 max(4) 검증.
//   - height: 150~210 정수 (시안 슬라이더 범위).
//   - notification_settings: 토글 4종.
export const completeOnboardingSchema = z.object({
  // 1단계 — 포지션/신장
  position: z.enum(ONBOARDING_POSITIONS).nullable().optional(),
  height: z.number().int().min(150).max(210).nullable().optional(),

  // 2단계 — 실력
  level: z.enum(ONBOARDING_LEVELS).nullable().optional(),

  // 3단계 — 스타일 (최대 4)
  styles: z.array(z.enum(ONBOARDING_STYLES)).max(4).default([]),

  // 4단계 — 지역 + 빈도
  active_areas: z.array(z.enum(ONBOARDING_AREAS)).default([]),
  play_frequency: z.enum(ONBOARDING_FREQUENCIES).nullable().optional(),

  // 5단계 — 목표
  goals: z.array(z.enum(ONBOARDING_GOALS)).default([]),

  // 6단계 — 알림
  notification_settings: notificationsSchema.optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
