# 작업 스크래치패드

## 현재 작업
- **요청**: 점수 정합성 시스템 분석 — 운영 DB 전수 audit + 영구 fix 6건 우선순위 박제 (2026-05-21 세션)
- **상태**: ✅ audit 실측 완료 (`Dev/score-consistency-audit-2026-05-21.md` 박제 / SELECT only / 운영 영향 0) → Sprint 1 결재 대기
- **현재 담당**: pm (사용자 결재 대기)
- **세션 산출물**:
  - audit script 박제 (`scripts/_temp/score-consistency-audit.ts` / 사후 정리 예정)
  - 실측 보고서 박제 (`Dev/score-consistency-audit-2026-05-21.md`)
  - errors.md + decisions.md + lessons.md 박제 ([2026-05-21] 시스템 차원 결함 + F1~F6 영구 fix)
- **핵심 발견 (125 completed 매치)**: A(정합) 55건 / 불일치 70건 (56%) — 토너먼트별 = 열혈농구단·몰텐배·4차뉴비리그 100% 불일치 / 강남구 10% / TEST 87%

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
| 2026-05-21 | 점수 정합성 시스템 분석 — 운영 DB 전수 audit + F1~F6 영구 fix 우선순위 박제 | ✅ audit script 박제 (`scripts/_temp/score-consistency-audit.ts` SELECT only) + 실측 (125 매치 / 56% 불일치 / 5 토너먼트 분포) + `Dev/score-consistency-audit-2026-05-21.md` 박제 + errors.md/decisions.md/lessons.md 각 +1 / **다음 단계**: Sprint 1 결재 (F5 2h + F2 4h 묶음 = 신규 사고 방지 + 검출 layer 동시 박제) |
| 2026-05-21 | 매치 124 (라이징 vs 제이크루 OT2 75:82) 박제 + 점수 4 source 불일치 진단 + 시스템 분석 | ✅ commit `95ddbea` (OT2 점수+stat+standings) + `d5e3805` (paper+nested) + `b0a49ae` (박스스코어 OT1/OT2 분리 UI) + `a4932bb` (knowledge 박제) / 모두 push / OT2 PBP 41건 INSERT / errors.md +1 lessons.md +2 decisions.md +1 / 영구 fix F1~F6 우선순위 박제 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-3 후속 — /games/[id]/edit 코트 picker 카드 | ✅ commit `fdfff27` / push / PR #633 / 1 파일 +36 -1 / .court-picker 카드 read-only / globals.css 재사용 / tsc 0 / GET /games/552/edit 200 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-3 — guest-apply + report 상단 GameCard 미니 | ✅ commit `7f2fc03` / PR #632 머지 / 2 파일 +138 -21 / 상단 GameCard + tags + report select 확장 / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-2c — 모바일 collapsible 미리보기 + 하단 fixed CTA | ✅ commit `43539f8` / PR #631 머지 / 2 파일 +125 -5 / mobile collapsible + 토글 + fixed CTA 44px / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-2b — 정기 모집 요일 picker + 코트 picker 카드 | ✅ commit `ced6c37` / PR #630 머지 / 3 파일 +371 -55 / RRULE BYDAY + 4주 예고 + court-picker 카드 / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-2a — /games/new 라이브 프리뷰 + 종별 컬러 즉시 반영 | ✅ commit `ffc46c3` / PR #629 머지 / 4 파일 +163 -7 / 2-col grid + 우 sticky GameCard + 인라인 매핑 / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-1c + admin view fix | ✅ commit `c8eaac3` (3-1c) + `f493c9f` (admin fix) / PR #628 머지 / 8 파일 +698 -65 / 2-col → 1-col + Ribbon + 모바일 sticky + 8 CTA 분기 (admin 포함) / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-1b — ParticipantsSlotBoard Concept B 10인 슬롯 | ✅ commit `ed4dcc7` / PR #627 머지 / 3 파일 +504 -8 / 5×2 grid + 호스트 prisma + apply-panel anchor / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-1a — GameDetailHero 풀폭 다크 hero band | ✅ commit `ac5e1be` / PR #626 머지 / 3 파일 +572 / hero gradient + countdown + 4-col meta / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 2-3 — /games/my-games 호스팅 GameCard 통일 | ✅ commit `3a9d52a` / PR #625 머지 / 1 파일 +44 -55 / .games-grid + deriveTags 인라인 / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 2-1 — GameCard 전면 리디자인 (Date Tile + Area Chip + Host) | ✅ commit `0399b73` / PR #624 머지 / 5 파일 +617 -262 / globals.css 398L 추가 / listGames +duration_hours / tsc 0 / GET /games 200 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 1 — BDR-current 동기화 (v2.14 → v2.16) | ✅ commit `d66eb90` / PR #623 머지 (cobby8) / subin = dev fast-forward / 1218 파일 +279k -1.1k / v2.16 델타 + screens-gd + _archive 보존 |
| 2026-05-20 | prospectus AI wizard Phase 3 (wizard UI 진입 + 분석 미리보기 + sessionStorage 통합) | ✅ commit `c046f73` / +1154L / 4 신규 파일 + 헤더 1건 / 5 상태 분기 (idle/uploading/analyzing/done/failed) / tsc 0 |
| 2026-05-20 | prospectus AI wizard Phase 2 (analyze-prospectus API route + pdf-parse + file-type) | ✅ commit `138d1de` / +670L / 가드 다층 8단 / 응답 분기 8종 / RATE_LIMITS.aiAnalyze 5/min + 일 20건 / tsc 0 |
| 2026-05-20 | prospectus AI wizard Phase 1 PR #620 머지 + subin↔dev 동기화 | ✅ PR #620 머지 (mergedBy=cobby8) / subin = dev fast-forward (8c52ff8) |
| 2026-05-20 | prospectus AI wizard Phase 1-C (prisma `prospectus_ai_analysis` 모델 + db push) | ✅ commit `ea1bd44` / CREATE TABLE 1 + INDEX 3 / 운영 DB 1.55s / 무중단 / tsc 0 / .prisma 타입 399건 |
| 2026-05-20 | prospectus AI wizard Phase 1-B (gateway.ts + ai SDK v6 설치) | ✅ commit `e37ae80` / +345L / tsc 0 / AI_GATEWAY_API_KEY 사용자 발급 완료 |
| 2026-05-20 | 오늘 작업 시작 — dev 머지 + dev서버 실행 | ✅ `492819f` Merge origin/dev (7커밋 catch-up, 충돌 0) / npm run dev port 3001 Ready 4s (Next 16.1.6 Turbopack) |
| 2026-05-19 | prospectus AI wizard Phase 1-A 박제 (Zod schema + prompt 빌더) | ✅ commit `ca99e94` / 2 신규 파일 287L / tsc 0 |
| 2026-05-19 | nonggudan@mybdr.kr 비밀번호 변경 (제작진용 계정) | ✅ id=2989 / bcrypt salt 12 / 검증 PASS / DB UPDATE 1행 / 임시 스크립트 즉시 삭제 |
| 2026-05-18 | 대회 요강 AI 분석 → wizard 자동 채움 기획설계 보고서 | ✅ `Dev/prospectus-ai-wizard-plan-2026-05-18.md` 박제 / 2026-05-19 사용자 결재 완료 |

## 미푸시 commit
- **0건** (모두 push 완료. PR #623 머지 완료 / PR #624 머지 대기)

## 메모
- 강남구협회장배 시합 5/16~5/17 = 운영 중 즉시 fix 다수 (60+ PR main 머지)
- 시안 13 룰 / 운영 DB 정책 (destructive 작업 명시 결재) 모두 보존
- Flutter 앱 연동 = 별도 박제 예정 (사용자 명시)
- scratchpad 압축 룰: 100줄 이내 / 작업 로그 10건 / 가장 오래된 항목 자동 삭제

## 🔜 다음 단계 — Sprint 결재 진입
- **완료**:
  - ✅ 운영 DB 전수 audit (125 매치 SELECT only / 운영 영향 0)
  - ✅ 영구 fix 6건 (F1~F6) 우선순위 결정 (decisions.md [2026-05-21])
  - ✅ 시스템 차원 결함 3대 패턴 박제 (errors.md [2026-05-21])
  - ✅ DB trigger vs service layer vs cron 비교 결정 (옵션 A service layer 채택 / decisions.md [2026-05-21])
- **Sprint 1 결재 (≤6h / 운영 영향 0 / 즉시 진입 가능)**:
  - **F5 (2h)** FIBA 룰 가드 (OT1 동점 시 completed 차단 / 매치 124 재발 방지 / Flutter v1 영향 0)
  - **F2 (4h)** PBP 검증 cron (daily PBP vs MPS 비교 + admin 대시보드 알림)
- **Sprint 2 결재 (≤8h / 운영 데이터 backfill 별도)**:
  - **F1 (8h)** quarterScores 자동 갱신 service layer (PBP/MPS → QS sync / 매치 종료 시점 trigger)
- **Sprint 3 결재 (≤22h+ / 사용자 결재 다수)**:
  - **F3 (6h)** score-sheet submit 시 헤더 자동 갱신
  - **F4 (16h+)** SSOT migration 일괄 정정 (E 분류 48건 매치별 결재)
- **사후 정리**: `scripts/_temp/score-consistency-audit.ts` 삭제 (운영 DB 자격 노출 방지 / Sprint 1 종료 시점)
