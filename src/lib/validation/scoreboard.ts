import { z } from "zod";

/**
 * OBS 라이브 스코어보드 state 스키마 (계약서 §3)
 *
 * ★앱(Flutter)이 POST로 보내는 OBS JSON 본문 검증용.
 * - 키는 camelCase(scoreH 등) 그대로 — DB payload Json 컬럼에 통짜 저장되고
 *   읽기 응답에서도 변환 없이 그대로 오버레이로 나간다.
 * - 오버레이 표시용 데이터라 모든 필드가 단순 원시값 + sponsors 배열.
 * - 미래에 필드가 추가돼도 오버레이가 무시할 수 있도록 .passthrough()로
 *   알 수 없는 키는 보존(앱↔오버레이 버전 스큐 내성). theme은 선택.
 */
export const scoreboardStateSchema = z
  .object({
    tTitle: z.string(),          // 대회명 (예: "몰텐배 동호회 최강전")
    tSub: z.string(),            // 시즌·라운드 (예: "2026 SPRING · 8강")
    homeName: z.string(),
    homeCode: z.string(),        // 약칭 (예: "HK")
    awayName: z.string(),
    awayCode: z.string(),
    scoreH: z.number().int(),
    scoreA: z.number().int(),
    period: z.string(),          // "Q1"~"Q4"/"OT" 등 (앱이 quarter→문자열 변환)
    clock: z.string(),           // "07:00"
    sc24: z.string(),            // 샷클락 "24"
    homeFouls: z.number().int(),
    awayFouls: z.number().int(),
    sponsors: z.array(z.string()),
    // theme은 오버레이 URL 파라미터가 우선 결정 → 본문은 선택값
    theme: z.string().optional(),
  })
  .passthrough();

export type ScoreboardState = z.infer<typeof scoreboardStateSchema>;
