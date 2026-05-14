/**
 * 통합 마법사 sessionStorage 헬퍼.
 *
 * 사용 위치: client component 만 (window 의존).
 * - saveDraft: Step 전환 / 폼 변경 시 호출
 * - loadDraft: 마법사 페이지 마운트 시 1회 호출 (이어하기)
 * - clearDraft: 최종 생성 성공 / 마법사 명시적 취소 시 호출
 *
 * 박제 룰:
 * - SSR 안전 (window 체크) — Next.js App Router 의 server component 가 동일 모듈 import 가능.
 * - BigInt 안전 — Prisma `BigInt` 컬럼 (예: TournamentDivisionRule.fee_krw)이 응답에 섞일 수 있어
 *   JSON.stringify replacer 박제. errors.md 2026-04-17 의 sentry "BigInt 직렬화 실패" 회귀 가드.
 * - 에러 silent 처리 — sessionStorage 용량 초과 / private mode / 비표준 브라우저 무시.
 *   운영 영향 0 (draft 손실 = 사용자가 다시 입력. 마법사 자체 다운 ❌).
 *
 * KEY 단일 source — grep "wizard:tournament:draft" 가 본 파일 1건만 hit (검수 룰).
 */

import type { WizardDraft } from "./wizard-types";

// sessionStorage 의 단일 키. 다른 곳에서 직접 sessionStorage.getItem 금지 (Phase 2~7 자체 검수).
const KEY = "wizard:tournament:draft";

/**
 * BigInt 직렬화 안전 replacer.
 *
 * JSON.stringify 가 BigInt 를 native 로 처리 못 함 → TypeError.
 * Prisma `BigInt` 컬럼 (organization_id / fee_krw 등) 이 draft 에 섞이면 본 replacer 가 string 변환.
 * 역직렬화 (loadDraft) 시 number 로 다시 캐스팅하지 않음 — 폼 state 는 number 가정 / 캐스팅 책임은 caller.
 *
 * 참고: score-from-pbp.ts 의 `Number()` 캐스팅 패턴 (errors.md 2026-04-17 의 BigInt 사고 재발 가드).
 */
function safeBigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}

/**
 * draft 박제. 호출 위치: Step 전환 / 폼 변경 useEffect.
 *
 * 실패 케이스 (silent 무시):
 * - SSR 환경 (window === undefined) — 그냥 return
 * - sessionStorage 용량 초과 (5MB) — try/catch
 * - private mode / Safari ITP — try/catch
 *
 * 사용 후 size 모니터링 필요 시 추가 (Phase 2 운영 후 결정).
 */
export function saveDraft(draft: WizardDraft): void {
  // SSR 안전 — server component 가 module import 만 해도 본 함수 실행은 client 에서만.
  if (typeof window === "undefined") return;

  try {
    const serialized = JSON.stringify(draft, safeBigIntReplacer);
    sessionStorage.setItem(KEY, serialized);
  } catch {
    // 운영 영향 0 — draft 손실 시 사용자가 다시 입력하면 됨.
    // Sentry 박제 필요 시 추가 (Phase 2 운영 후 결정).
  }
}

/**
 * draft 로드. 호출 위치: 마법사 페이지 마운트 시 1회 (useEffect).
 *
 * 반환:
 * - null: 기존 draft 없음 (신규 마법사 진입) 또는 SSR 환경
 * - WizardDraft: 기존 draft 복원 (이어하기)
 *
 * ⚠️ caller 가 schema validation 책임 — 옛 버전 draft 와 신규 타입 불일치 시
 * loadDraft 결과를 그대로 신뢰하지 말고 필드별 fallback 박제.
 */
export function loadDraft(): WizardDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardDraft;
  } catch {
    // JSON parse 실패 (옛 버전 / 손상된 데이터) → null 반환. caller 가 신규 draft 시작.
    return null;
  }
}

/**
 * draft 제거. 호출 위치:
 * - 마법사 최종 생성 성공 (대회 created) → clearDraft 후 redirect
 * - 사용자 명시적 "취소" 버튼
 *
 * silent 처리 — sessionStorage 미지원 환경 무시.
 */
export function clearDraft(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // 무시 — 다음 진입 시 자연 덮어쓰기.
  }
}
