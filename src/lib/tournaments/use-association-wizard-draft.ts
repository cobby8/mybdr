/**
 * 협회 마법사 sessionStorage hook — 2026-05-15 신규.
 *
 * 왜:
 *   - Step 1~3 사이에 입력값 유지 (실수로 새로고침해도 draft 보존).
 *   - `wizard-draft.ts` (Phase 1 통합 마법사) 패턴 답습 — conventions.md 2026-05-15 박제.
 *   - 마법사 본체 (page.tsx) 와 4 컴포넌트 (Step1~3 + Confirm) 가 동일 hook 호출.
 *
 * 어떻게 (3 핵심 가드 — conventions.md):
 *   1. SSR 안전 — useState lazy init 시 typeof window 체크.
 *   2. BigInt 안전 — JSON.stringify replacer (BigInt → string). 본 draft 는 user_id/parent_id 가
 *      이미 string 으로 박제되어 있지만 방어 차원에서 답습.
 *   3. silent fail — sessionStorage 에러 (용량 / private mode) 무시. UI 흐름 영향 0.
 *
 * 반환:
 *   - draft: 현재 draft (lazy init 시 sessionStorage 복원 시도, 없으면 INITIAL_DRAFT)
 *   - setDraft: 갱신 함수 (state + sessionStorage 동시 박제)
 *   - clearDraft: 최종 생성 성공 / 명시 취소 시 호출 (sessionStorage 제거)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { AssociationWizardDraft } from "./association-wizard-types";
import { INITIAL_DRAFT, STORAGE_KEY } from "./association-wizard-constants";

// BigInt 안전 replacer — wizard-draft.ts 패턴 답습.
// 본 draft 는 user_id/parent_id 가 string 으로 박제되지만 방어 차원에서 동일 패턴 유지.
function safeBigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}

// sessionStorage 에서 draft 복원 시도. SSR 환경 / 손상 JSON / 빈 storage → null 반환.
function loadDraftSync(): AssociationWizardDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssociationWizardDraft;
    // 최소한의 shape 검증 — 옛 버전 draft / 손상 데이터 방어.
    if (!parsed.association || !parsed.admin || !parsed.fee_setting) return null;
    return parsed;
  } catch {
    return null;
  }
}

export interface UseAssociationWizardDraftReturn {
  draft: AssociationWizardDraft;
  setDraft: (next: AssociationWizardDraft) => void;
  clearDraft: () => void;
}

export function useAssociationWizardDraft(): UseAssociationWizardDraftReturn {
  // lazy init — 첫 마운트 시 sessionStorage 1회 복원. 이후 setDraft 호출 시 동기 박제.
  // 이유: useEffect 로 비동기 박제 시 첫 render 가 빈 draft 로 깜빡임 (UX 저하).
  const [draft, setDraftState] = useState<AssociationWizardDraft>(() => {
    return loadDraftSync() ?? INITIAL_DRAFT;
  });

  // hydration 안전 — SSR/CSR 첫 render 가 동일하도록 mount 후 1회 재로드.
  // Next.js 15 App Router 의 server component 가 hook module 만 import 해도 동작 (실행은 client 만).
  useEffect(() => {
    const loaded = loadDraftSync();
    if (loaded) setDraftState(loaded);
  }, []);

  // setDraft — state + sessionStorage 동시 박제. silent fail.
  const setDraft = useCallback((next: AssociationWizardDraft) => {
    setDraftState(next);
    if (typeof window === "undefined") return;
    try {
      const serialized = JSON.stringify(next, safeBigIntReplacer);
      sessionStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // 운영 영향 0 — draft 손실 시 사용자가 다시 입력. 마법사 자체 다운 ❌.
    }
  }, []);

  // clearDraft — 최종 생성 성공 / 명시 취소 시 호출.
  const clearDraft = useCallback(() => {
    setDraftState(INITIAL_DRAFT);
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시 — 다음 진입 시 자연 덮어쓰기.
    }
  }, []);

  return { draft, setDraft, clearDraft };
}
