import { z } from "zod";

/**
 * 관리자 API 응답 Zod 스키마 — **고위험 신규필드 우선**(전면 강제 금지).
 *
 * ⚠️ Zod 4 문법(이 프로젝트 zod ^4.3.6):
 *  - 옵션 객체(`z.number({ invalid_type_error })`) 금지 — 이전 빌드 사고 원인.
 *  - 정수는 `z.number().int()` 체인 패턴.
 *
 * 검증 시점: adminFetch 가 snake→camel 변환을 끝낸 **camelCase 결과**를 parse.
 *   따라서 스키마 키도 camelCase.
 *
 * 직렬화 규칙 반영:
 *  - id: BigInt → 문자열(z.string())
 *  - amount: 정수(z.number().int())
 *  - createdAt: Date → ISO 문자열(z.string())
 */

/** 대회 지출 1건(오늘 추가된 tournament_expense — 신규필드라 런타임 계약 검증 가치 높음). */
export const expenseSchema = z.object({
  id: z.string(),
  tournamentId: z.string(),
  label: z.string(),
  amount: z.number().int(),
  category: z.string().nullable(),
  memo: z.string().nullable(),
  createdAt: z.string(),
  // updatedAt 은 모델에 없을 수 있어 옵셔널·nullable 로 느슨하게
  updatedAt: z.string().nullable().optional(),
});

/** 지출 목록 응답(배열). */
export const expenseListSchema = z.array(expenseSchema);

/** 지출 생성 입력 검증(클라 사전검증용 — 선택적). camelCase. */
export const createExpenseSchema = z.object({
  label: z.string().trim().min(1).max(100),
  amount: z.number().int().positive(),
  category: z.string().trim().max(50).nullable().optional(),
  memo: z.string().trim().max(500).nullable().optional(),
});

/** 삭제 응답 — `{ deleted: true }`. */
export const deleteResultSchema = z.object({
  deleted: z.boolean(),
});

// 스키마에서 역추론한 타입(types.ts 의 수기 타입과 동등 — 필요 시 둘 중 선택 사용)
export type ExpenseFromSchema = z.infer<typeof expenseSchema>;
export type CreateExpenseFromSchema = z.infer<typeof createExpenseSchema>;
