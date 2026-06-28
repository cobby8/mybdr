# 대회 요강 AI 분석 → Wizard 자동 채움 — 기획설계 보고서

- **작성**: planner-architect
- **작성일**: 2026-05-18
- **상태**: 사용자 결재 대기 (Phase 1 박제 진입 전)
- **참조**: `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx`, `src/lib/tournaments/wizard-types.ts`, `src/lib/tournaments/wizard-draft.ts`, `Dev/design/claude-project-knowledge/02-design-system-tokens.md`

---

## 1. 핵심 결정 요약

| 항목 | 결정 |
|------|------|
| AI 모델 | **Claude Sonnet 4** (한국어 OCR 강함 + structured output native) |
| 통합 | **Vercel AI Gateway** + `ai` SDK (`"anthropic/claude-sonnet-4-20250514"` string) |
| 입력 포맷 | **PDF + 이미지(PNG/JPG)** 만. .hwp = "PDF 변환 안내" 텍스트만 노출 (직접 파싱 ❌) |
| 진입점 | **Step 0 이전 = `/wizard/prospectus`** 별도 라우트. 기본 wizard 영향 0 (opt-in) |
| DB 영향 | wizard 완료까지 **운영 DB UPDATE 0**. 분석 결과 = sessionStorage WizardDraft 박제만 |
| 신규 모델 | **`prospectus_ai_analysis`** 1개만 (audit + 비용 추적 / 캐싱). NULL 허용 ADD COLUMN 룰 적용 |
| 비용 가드 | 단일 단체 owner/admin 일/월 한도 (일 20건 / 월 200건 / 파일 10MB) |

---

## 2. Phase 구분 + 일정

### Phase 1 — 인프라 + API 단일 endpoint (반나절~1일)
- **선행**: 사용자 결재 + Vercel AI Gateway 활성화 (대시보드)
- **산출물**:
  - `src/lib/ai/gateway.ts` — AI Gateway client 박제 (`generateObject` 래퍼)
  - `src/lib/ai/prospectus-prompt.ts` — system / user prompt + few-shot (강남구협회장배 / 열혈농구단 JSON 예시 2건)
  - `src/lib/ai/prospectus-schema.ts` — Zod schema (analysis 결과 + 필드별 confidence + source_excerpt)
  - `src/app/api/web/tournaments/wizard/analyze-prospectus/route.ts` — POST endpoint
  - `prisma/schema.prisma` — `prospectus_ai_analysis` 모델 추가 (NULL 허용 ADD 만 / destructive 0)
  - `prisma/migrations/...` — 사용자 명시 결재 후 `prisma db push`
- **결재 트리거**: schema diff 검토 + db push 1회 (DB 정책 §1 가드)

### Phase 2 — Wizard 진입 UI + Form 자동 채움 (1일)
- **선행**: Phase 1 endpoint 200 OK 응답 + Zod 통과
- **산출물**:
  - `src/app/(admin)/tournament-admin/tournaments/new/wizard/prospectus/page.tsx` — 업로드 + 미리보기 UI
  - `src/components/tournament/prospectus-upload-dropzone.tsx` — drag&drop + MIME 검증
  - `src/components/tournament/prospectus-analysis-preview.tsx` — 결과 표 (필드별 ✅⚠️❌ + 적용/거절 토글)
  - `src/lib/tournaments/prospectus-to-draft.ts` — analysis 결과 → WizardDraft 변환 (Zod 안전 매핑)
  - 메인 wizard `page.tsx` 헤더 우측 "📄 요강 업로드" 버튼 추가 (기존 폼 시그니처 변경 0)
- **결재 트리거**: 강남구협회장배 실제 PDF 1건 회귀 테스트 (사용자 직접 확인)

### Phase 3 — 운영 가드 + audit + 비용 모니터링 (반나절)
- **선행**: Phase 2 사용자 검수 완료 + 실제 PDF 2~3건 정확도 80%+ 확인
- **산출물**:
  - rate-limit 추가 (`RATE_LIMITS.aiAnalyze`)
  - `prospectus_ai_analysis` 로그 작성 (요청 메타 + 응답 토큰 수 + 비용 추정)
  - 운영자별 일/월 한도 enforcement
  - admin 대시보드 "최근 분석" 표 (옵션 — 실 사용 후 결정)

> MVP1 = Phase 1+2. MVP2 = Phase 3. MVP3(.hwp / 학습 피드백) = **본 보고서 범위 외** (운영 1개월 후 재평가).

---

## 3. 신규 API 설계

### `POST /api/web/tournaments/wizard/analyze-prospectus`

| 항목 | 내용 |
|------|------|
| 인증 | `withAuth({ roles: ["admin", "organizer"] })` — 운영자 + 시스템 admin만 |
| 권한 | 본인이 owner/admin 인 organization 1건 이상 보유 검증 (기존 `/api/web/organizations` GET 패턴 재사용) |
| Rate Limit | `RATE_LIMITS.aiAnalyze = { maxRequests: 5, windowMs: 60_000 }` (분당 5건) + 일 20건 (DB count) |
| Request | `multipart/form-data` — `file` (PDF/PNG/JPG, max 10MB), `organizationId` (number) |
| 파일 검증 | MIME(application/pdf / image/png / image/jpeg) + magic bytes 재검증 + page 수 ≤ 20 + 크기 ≤ 10MB |
| 응답 | `apiSuccess({ analysis_id, payload: ProspectusAnalysisResult })` (snake_case 자동) |
| 비동기 | 동기 처리 (Sonnet 평균 5~15s) — Vercel function timeout 30s 안 |

### Zod schema (응답)

```ts
ProspectusAnalysisResult = {
  schedule: { startDate, endDate, registrationStartAt, registrationEndAt, venueName, venueAddress, city }
  team:     { maxTeams, teamSize, rosterMin, rosterMax }
  registration: { entryFee, bankName, bankAccount, bankHolder, feeNotes, divisions: [{ name, feeKrw, cap }] }
  meta:     { title, description?, format? }
  // 각 leaf 필드 옆에 동일 키의 _confidence (0~1) + _source_excerpt (원문 발췌 ≤ 200자)
}
```

### DB 추가 (NULL 허용 ADD ONLY)
```
model prospectus_ai_analysis {
  id              BigInt   @id @default(autoincrement())
  user_id         BigInt
  organization_id BigInt?
  file_name       String
  file_size_bytes Int
  mime_type       String
  prompt_version  String   // "v1" — prompt 변경 추적
  model_id        String   // "anthropic/claude-sonnet-4-20250514"
  input_tokens    Int?
  output_tokens   Int?
  cost_usd_est    Decimal? @db.Decimal(10, 6)
  analysis_json   Json?    // 응답 캐싱 (재사용 가능)
  error_message   String?
  created_at      DateTime @default(now()) @db.Timestamptz(6)
}
```

---

## 4. UX 흐름

```
[Wizard 진입] → [헤더 우측 "📄 요강 업로드"] → /wizard/prospectus
   ↓
[drag&drop / 파일선택] → MIME/크기 client 사전 검증
   ↓
[분석 중...] (15s spinner + "Claude 가 요강을 읽고 있어요" 카피)
   ↓
[결과 미리보기 표]
  ✅ 95%+ 자동 체크 / ⚠️ 60~95% 사용자 검토 / ❌ <60% 기본 거절
  필드별 토글 + 원문 발췌 hover tooltip
   ↓
[ "이대로 적용하고 wizard 진입" 버튼 ]
   ↓
WizardDraft sessionStorage 박제 → 기존 wizard `/new/wizard` 로 redirect (Step 0)
```

### 디자인 토큰 준수
- 색상: `var(--color-success)` (✅) / `var(--color-warning)` (⚠️) / `var(--color-danger)` (❌)
- 버튼 `rounded-[4px]` / 정사각형 아이콘 50% / Material Symbols Outlined
- 카피 5단어 이내 ("예: " ❌) / 모바일 720px 분기

---

## 5. 보안 + 운영 가드

| 위험 | 완화 |
|------|------|
| MIME spoofing | magic-bytes (`file-type` npm) 서버 재검증 |
| 거대 파일 | client + server 양쪽 10MB cap + page≤20 (`pdf-parse` 메타로 사전 검사) |
| API 키 유출 | `AI_GATEWAY_API_KEY` server only (`NEXT_PUBLIC_` 금지) |
| Rate abuse | Upstash slidingWindow (분 5건) + DB count (일 20건) 이중 |
| 악성 PDF | sandbox 처리 (서버에서 실행 0 / Claude API 로 stream 전달만) |
| 비용 폭주 | analysis 1건 ≤ 30k input + 2k output tokens 가드 (prompt 측 max_tokens). 월 한도 organization 별 200건 |
| AI 부정확 → 사용자 무비판 confirm | 신뢰도 <95% 필드 = **기본 OFF**. 95%+만 자동 체크 |

---

## 6. 회귀 위험 + 가드

| 영역 | 가드 |
|------|------|
| 기존 4 폼 시그니처 | 변경 0 (props / export 타입 그대로) — grep 회귀 검증 |
| `wizard-types.ts` `WizardDraft` | 필드 추가 ❌. analysis 결과 → 기존 필드 매핑만 |
| 기존 wizard 진입 | `/new/wizard` 직접 URL 유지 (opt-in / 분석 없이도 정상) |
| sessionStorage 키 | `wizard:tournament:draft` 그대로. analysis 임시 키 `wizard:tournament:analysis:<id>` 별도 |
| BigInt | `safeBigIntReplacer` 그대로 (`feeKrw` 등) |

---

## 7. 테스트 전략

- **vitest 단위**: prompt 빌더 / Zod parser / prospectus-to-draft 매핑 (mock AI 응답)
- **샘플 PDF**: **사용자 제공 필요** — 강남구협회장배 / 열혈농구단 / U12 1건 (최소 3건)
- **AI mock**: `vi.mock('@/lib/ai/gateway')` 패턴 / 재현성 보장
- **수동 회귀**: `?legacy=1` quick form / 기본 3-step / 분석 후 진입 3 경로 모두 정상

---

## 8. 사용자 사전 확인 필요 항목

| # | 항목 | 결재 |
|---|------|------|
| 1 | Vercel AI Gateway 활성화 (대시보드 1회) + `AI_GATEWAY_API_KEY` env 등록 | ☐ |
| 2 | `prospectus_ai_analysis` 신규 모델 `prisma db push` (NULL 허용 ADD only / destructive 0) | ☐ |
| 3 | 비용 한도 정책: organization 일 20건 / 월 200건 / 파일 10MB | ☐ |
| 4 | 샘플 PDF 3건 제공 (강남구 / 열혈 / U12 — Phase 2 회귀 테스트용) | ☐ |
| 5 | Phase 1+2 = MVP1 / Phase 3 = MVP2 / .hwp + 학습 = 운영 후 재평가 | ☐ |
| 6 | 진입점 = wizard 헤더 우측 "📄 요강 업로드" 버튼 (Step 0 이전 별도 라우트) | ☐ |

---

## 9. 실행 순서 (담당 / 선행)

| # | 작업 | 담당 | 선행 | 시간 |
|---|------|------|------|------|
| 1 | Vercel AI Gateway 활성화 + env 등록 | **사용자** | 결재 | 10분 |
| 2 | `prospectus_ai_analysis` schema + db push | developer | 1 | 30분 |
| 3 | `lib/ai/` 3 파일 (gateway / prompt / schema) | developer | 2 | 2h |
| 4 | API route + Zod + auth + rate-limit | developer | 3 | 2h |
| 5 | vitest 단위 (mock AI) | tester | 4 | 1h |
| 6 | `/wizard/prospectus` page + 2 컴포넌트 | developer | 4 | 3h |
| 7 | `prospectus-to-draft.ts` 매핑 + sessionStorage 통합 | developer | 6 | 1h |
| 8 | 회귀 (legacy / quick / new — 3 경로) + reviewer | tester + reviewer (병렬) | 7 | 1h |
| 9 | Phase 3 rate-limit / audit / 비용 모니터링 | developer | MVP1 운영 1주 후 | 2h |

**총**: Phase 1+2 ≈ 1.5일 / Phase 3 ≈ 반나절

---

## ⚠️ developer 주의사항

1. **DB 정책 §1 준수**: `prisma db push` 전 schema diff 사용자 검수 + NULL 허용 ADD COLUMN 만
2. **응답 키 snake_case**: `apiSuccess` 자동 변환 — 프론트 접근자 snake_case (errors.md 2026-04-17 5회 재발 가드)
3. **기존 4 폼 시그니처 절대 변경 ❌** — props / export type 그대로
4. **시안 13 룰 준수**: var(--color-*) / Material Symbols / lucide-react ❌ / pill 9999px ❌
5. **AI 응답 신뢰 ❌**: Zod safeParse 통과한 필드만 적용. 실패 필드 = analysis_json 에 raw 보존 + UI 표시 X
6. **비용 가드**: 분석 1건당 max_input_tokens 30k / max_output_tokens 2k 강제. prompt 측에서 잘라낼 것

---

이 보고서 결재 후 Phase 1 박제 진입 가능.
