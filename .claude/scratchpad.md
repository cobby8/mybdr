# 작업 스크래치패드

## 현재 작업
- **요청**: 경기 메뉴 리디자인 — 클로드 디자인(`BDR-current/screens/Game*.jsx`) 운영 src/ 적용 (2026-05-20 세션)
- **상태**: 세션 컨텍스트 세팅 / 시안↔운영 매핑 분석 완료 / 페이지 우선순위 사용자 결재 대기
- **현재 담당**: pm
- **Phase 1+2+3 완료** (end-to-end 흐름): 1-A (`ca99e94`) + 1-B (`e37ae80`) + 1-C (`ea1bd44`) + 2 (`138d1de`) + 3 (`c046f73`) 박제 / Phase 1 dev 머지 (PR #620) / Phase 2+3 PR 생성 예정

## 구현 기록 (prospectus AI Phase 1-A + 1-B / PM 직접 박제 2026-05-19~20)
- **신규 파일 3건** (총 527L / 외부 npm 1건 추가 = `ai@^6.0.185`)
  - `src/lib/ai/prospectus-schema.ts` (167L / 1-A) — Zod schema 4그룹 + 필드별 `_confidence`+`_source_excerpt` + thresholds (0.95/0.6) + camelCase
  - `src/lib/ai/prospectus-prompt.ts` (120L / 1-A) — `buildSystemPrompt()` / `buildUserPrompt({source})` / `PROSPECTUS_PROMPT_VERSION="v1"` / `MAX_OUTPUT_TOKENS=2000`
  - `src/lib/ai/gateway.ts` (240L / 1-B 신규) — `analyzeProspectus()` + `AIAnalysisError(code)` 5종 분리 + AI_GATEWAY_API_KEY 사전 가드
- **Phase 1-B 핵심**: 모델 = `"anthropic/claude-sonnet-4"` plain 문자열 (Vercel Gateway 자동) / PDF (prompt) + image (vision messages `type:"image"` + `mediaType`) 분기 / `AbortSignal.timeout(30_000)` / audit 반환 = `usage`+`durationMs`+`promptVersion`+`modelId`
- **검증**: `npx tsc --noEmit` → 0 errors (양 commit) / 회귀 0 (신규 폴더 / 시그니처 변경 0)
- **참조 보고서**: `Dev/prospectus-ai-wizard-plan-2026-05-18.md` §3 §4

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
| 2026-05-20 | prospectus AI wizard Phase 3 (wizard UI 진입 + 분석 미리보기 + sessionStorage 통합) | ✅ commit `c046f73` / +1154L / 4 신규 파일 + 헤더 1건 / 5 상태 분기 (idle/uploading/analyzing/done/failed) / tsc 0 |
| 2026-05-20 | prospectus AI wizard Phase 2 (analyze-prospectus API route + pdf-parse + file-type) | ✅ commit `138d1de` / +670L / 가드 다층 8단 / 응답 분기 8종 / RATE_LIMITS.aiAnalyze 5/min + 일 20건 / tsc 0 |
| 2026-05-20 | prospectus AI wizard Phase 1 PR #620 머지 + subin↔dev 동기화 | ✅ PR #620 머지 (mergedBy=cobby8) / subin = dev fast-forward (8c52ff8) |
| 2026-05-20 | prospectus AI wizard Phase 1-C (prisma `prospectus_ai_analysis` 모델 + db push) | ✅ commit `ea1bd44` / CREATE TABLE 1 + INDEX 3 / 운영 DB 1.55s / 무중단 / tsc 0 / .prisma 타입 399건 |
| 2026-05-20 | prospectus AI wizard Phase 1-B (gateway.ts + ai SDK v6 설치) | ✅ commit `e37ae80` / +345L / tsc 0 / AI_GATEWAY_API_KEY 사용자 발급 완료 |
| 2026-05-20 | 오늘 작업 시작 — dev 머지 + dev서버 실행 | ✅ `492819f` Merge origin/dev (7커밋 catch-up, 충돌 0) / npm run dev port 3001 Ready 4s (Next 16.1.6 Turbopack) |
| 2026-05-19 | prospectus AI wizard Phase 1-A 박제 (Zod schema + prompt 빌더) | ✅ commit `ca99e94` / 2 신규 파일 287L / tsc 0 |
| 2026-05-19 | nonggudan@mybdr.kr 비밀번호 변경 (제작진용 계정) | ✅ id=2989 / bcrypt salt 12 / 검증 PASS / DB UPDATE 1행 / 임시 스크립트 즉시 삭제 |
| 2026-05-18 | 대회 요강 AI 분석 → wizard 자동 채움 기획설계 보고서 | ✅ `Dev/prospectus-ai-wizard-plan-2026-05-18.md` 박제 / 2026-05-19 사용자 결재 완료 |
| 2026-05-17 | 열혈농구단 플레이오프 4위까지 강조 (league-standings isPlayoff) | ✅ commit `4b51d2f` / PR #616 main 머지 |

## 미푸시 commit
- **2건** — `138d1de` Phase 2 + `c046f73` Phase 3 (subin 로컬 only / Phase 2+3 PR 생성 대기)

## 메모
- 강남구협회장배 시합 5/16~5/17 = 운영 중 즉시 fix 다수 (60+ PR main 머지)
- 시안 13 룰 / 운영 DB 정책 (destructive 작업 명시 결재) 모두 보존
- Flutter 앱 연동 = 별도 박제 예정 (사용자 명시)
- scratchpad 압축 룰: 100줄 이내 / 작업 로그 10건 / 가장 오래된 항목 자동 삭제
