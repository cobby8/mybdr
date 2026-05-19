# 작업 스크래치패드

## 현재 작업
- **요청**: prospectus AI wizard Phase 1 의존성 0 박제 (schema + prompt)
- **상태**:
  - ✅ Phase 1-A 박제 완료 — `src/lib/ai/prospectus-schema.ts` (167L) + `prospectus-prompt.ts` (120L) / tsc 0 errors
  - ⏳ Phase 1-B (gateway.ts + ai SDK 설치) = 사용자 vercel 액션 후
  - ⏳ Phase 1-C (prisma schema + db push) = 사용자 결재 필요
- **현재 담당**: pm

## 구현 기록 (developer / PM 직접 박제 2026-05-19)
- **신규 파일 2건** (의존성 0 / 외부 npm 0)
  - `src/lib/ai/prospectus-schema.ts` (167L) — Zod schema 4 그룹 (schedule / team / registration / meta)
    - 각 leaf 필드 `<필드>_confidence` (0~1 nullable) + `<필드>_source_excerpt` (≤200자 nullable) suffix 박제
    - divisions 배열 element 단위 confidence
    - `CONFIDENCE_AUTO_APPLY=0.95` / `CONFIDENCE_REVIEW=0.6` (UI ✅⚠️❌ 분기)
    - 필드명 camelCase (4 폼 컴포넌트 export 정합)
  - `src/lib/ai/prospectus-prompt.ts` (120L) — system / user prompt 빌더
    - `PROSPECTUS_PROMPT_VERSION="v1"` (audit 추적)
    - `MAX_INPUT_TOKENS=30000` / `MAX_OUTPUT_TOKENS=2000` (비용 가드)
    - `buildSystemPrompt()` — 한국어 / FIBA 5x5 + 3x3 / 종별 + format enum 명시 / 추측 ❌ 룰
    - `buildUserPrompt({source: pdf|image, textContent?})` — PDF/이미지 분기
    - few-shot = TODO Phase 2 (사용자 샘플 PDF 도착 시)
- **검증**: `npx tsc --noEmit` → 0 errors / `git status src/lib/ai/` = untracked 2 신규 파일
- **회귀 영향**: 0 (신규 폴더 `src/lib/ai/` / 기존 파일 시그니처 변경 0)
- **참조 보고서**: `Dev/prospectus-ai-wizard-plan-2026-05-18.md` §3 §4 §"developer 주의사항"

## 기획설계 (2026-05-18 — prospectus-ai-wizard)

🎯 목표: 대회 요강 PDF/이미지 업로드 → Claude Sonnet 4 분석 → wizard ~25 필드 자동 채움 (opt-in / 운영 DB 영향 0)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `src/lib/ai/gateway.ts` | Vercel AI Gateway 클라이언트 래퍼 | 신규 |
| `src/lib/ai/prospectus-prompt.ts` | system/user prompt + few-shot 2건 | 신규 |
| `src/lib/ai/prospectus-schema.ts` | Zod schema (필드 + confidence + source) | 신규 |
| `src/app/api/web/tournaments/wizard/analyze-prospectus/route.ts` | POST endpoint | 신규 |
| `prisma/schema.prisma` | `prospectus_ai_analysis` 모델 추가 (NULL 허용 ADD) | 수정 |
| `src/app/(admin)/.../wizard/prospectus/page.tsx` | 업로드+미리보기 UI | 신규 |
| `src/components/tournament/prospectus-upload-dropzone.tsx` | drag&drop+MIME 검증 | 신규 |
| `src/components/tournament/prospectus-analysis-preview.tsx` | 결과 표 (✅⚠️❌ 토글) | 신규 |
| `src/lib/tournaments/prospectus-to-draft.ts` | analysis → WizardDraft 매핑 | 신규 |
| `src/app/(admin)/.../wizard/page.tsx` | 헤더 우측 "📄 요강 업로드" 버튼 (시그니처 0) | 수정 |

🔗 기존 코드 연결:
- WizardDraft sessionStorage (`wizard:tournament:draft`) 그대로 사용 — 매핑만 추가
- 기존 4 폼 시그니처 변경 0 (회귀 0 보장)
- `apiSuccess`/`withAuth`/`RATE_LIMITS` 기존 패턴 재사용

📋 실행 계획:
| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | AI Gateway 활성화 + env | 사용자 | 결재 |
| 2 | schema + db push (NULL ADD) | developer | 1 |
| 3 | lib/ai/ 3파일 | developer | 2 |
| 4 | API route + 가드 | developer | 3 |
| 5 | vitest 단위 (mock AI) | tester | 4 |
| 6 | wizard/prospectus UI 3파일 | developer | 4 |
| 7 | tester + reviewer (병렬) | 둘 | 6 |

⚠️ developer 주의: snake_case 응답 / 4 폼 시그니처 동결 / Zod safeParse 통과 필드만 적용 / 비용 max_tokens 강제

## 진행 현황
| 영역 | 상태 |
|------|------|
| 강남구협회장배 5/16~5/17 시합 운영 | ✅ 완료 (60+ PR main 머지) |
| 열혈농구단 전국최강전 4위 플레이오프 | ✅ 완료 |
| 연습용 score-sheet (`/score-sheet/practice`) | ✅ 완료 |
| 강남구 한정 승점 룰 + 영구 컬럼 + 백필 31팀 | ✅ 완료 |
| FIBA Bench Tech + Delay of Game | ✅ 완료 (PR-Possession 1+2+3) |
| 임시번호 = 라인업 모달 단일 진입점 | ✅ 완료 |
| 종이 기록지 7장 → DB 박제 (i3 순위결정전) | ✅ 완료 |
| 순위결정전 advancer 가드 영구 fix | ✅ 완료 (= 전수 완료 시에만 매핑) |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-19 | nonggudan@mybdr.kr 비밀번호 변경 (제작진용 계정) | ✅ id=2989 / bcrypt salt 12 / 검증 PASS / DB UPDATE 1행 / 임시 스크립트 즉시 삭제 |
| 2026-05-18 | 대회 요강 AI 분석 → wizard 자동 채움 기획설계 보고서 | ✅ `Dev/prospectus-ai-wizard-plan-2026-05-18.md` 박제 / 2026-05-19 사용자 결재 완료 |
| 2026-05-17 | 열혈농구단 플레이오프 4위까지 강조 (league-standings isPlayoff) | ✅ commit `4b51d2f` / PR #616 main 머지 |
| 2026-05-17 | 연습 모드 [기록 취소] 버튼 노출 fix (canEdit || isPractice) | ✅ commit `263b9e0` / PR #614 main 머지 |
| 2026-05-17 | 연습용 score-sheet 박제 (`/score-sheet/practice` + 5종 권한 가드 + fixture + localStorage) | ✅ commit `d06a6ce` / PR #612 main 머지 |
| 2026-05-17 | 임시번호 = 라인업 모달 row input 이동 (jersey-edit-modal 삭제) | ✅ commit `0a5a96c` / PR #608 main 머지 |
| 2026-05-17 | 강남구 대회 규정 4 섹션 박제 (`?tab=rules`) | ✅ commit `a0e2acb` / PR #605 main 머지 |
| 2026-05-17 | 강남구 한정 승점 룰 박제 + win_points 영구 컬럼 + 31팀 백필 | ✅ commit `e05e71a` / PR #598 main 머지 |
| 2026-05-17 | 모바일 hero column stack (Galaxy Z Fold 5 / < 480px) | ✅ commit `d681b5f` / PR #594 main 머지 |
| 2026-05-17 | 순위결정전 advancer 가드 영구 fix (전수 완료 시에만 매핑) | ✅ commit `552a8d6` / PR #586 main 머지 |

## 미푸시 commit
- 0건 (모든 commit main 까지 머지 완료)

## 메모
- 강남구협회장배 시합 5/16~5/17 = 운영 중 즉시 fix 다수 (60+ PR main 머지)
- 시안 13 룰 / 운영 DB 정책 (destructive 작업 명시 결재) 모두 보존
- Flutter 앱 연동 = 별도 박제 예정 (사용자 명시)
- scratchpad 압축 룰: 100줄 이내 / 작업 로그 10건 / 가장 오래된 항목 자동 삭제
