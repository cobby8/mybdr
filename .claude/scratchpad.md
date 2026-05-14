# 작업 스크래치패드

## 현재 작업
- **요청**: 통합 마법사 (단체 → 시리즈 → 대회 → 회차) — Phase 1 공통 인프라
- **상태**: ✅ Phase 1 박제 완료 (3 파일 신규 / +336 LOC / tsc 0). PM 검증 → commit 대기
- **모드**: no-stop / Phase 1~7 순차

## 진행 현황표
| 단계 | 결과 |
|------|------|
| Phase 19 PR-S1+S2 / Phase 23 PR2+PR3 | ✅ 직전 commit (`ef54e7a`/`4416a91`/`a147bb1`) |
| **마법사 Phase 1** (shared-types / draft / constants) | ✅ 신규 3 파일 / tsc 0 / KEY 1건 |
| 마법사 Phase 2 (Step 0 단체) | ⏳ 대기 |
| 마법사 Phase 3~7 | ⏳ 대기 |

## 구현 기록 (developer) — 마법사 Phase 1

📝 구현한 기능: 통합 마법사 공통 lib 인프라 (DB ❌ / UI ❌ / API ❌). Phase 2~7 이 import 할 단일 source.

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|----------|
| `src/lib/tournaments/wizard-types.ts` | WizardStep / WizardDraft / TournamentPayload / DivisionRulePayload / OrganizationItem / SeriesItem | 163 | 신규 |
| `src/lib/tournaments/wizard-draft.ts` | saveDraft / loadDraft / clearDraft + safeBigIntReplacer (SSR 안전 / silent fail) | 99 | 신규 |
| `src/lib/tournaments/wizard-constants.ts` | STEPS (5단계) + TOURNAMENT_STATUS_DEFAULT="draft" + stepIndexToKey / stepKeyToIndex | 74 | 신규 |

핵심 의사 결정:
- TournamentPayload = **components/tournament/*.tsx 의 실제 export 재사용** (ScheduleFormData / RegistrationSettingsData / TeamSettingsData / BracketSettingsData). 임의 추정 ❌.
- API 응답 타입 (OrganizationItem / SeriesItem) **snake_case 박제** — `my_role` / `tournaments_count` (apiSuccess 자동 변환).
- BigInt 직렬화 안전 — JSON.stringify replacer 박제 (Prisma BigInt 컬럼 회귀 가드).
- SSR 안전 — `typeof window === "undefined"` 가드.
- KEY 단일 source — `wizard:tournament:draft` grep 결과 1건 (검수 PASS).

자체 검수 6/6 PASS:
| # | 항목 | 결과 |
|---|------|------|
| 1 | tsc --noEmit 통과 | ✅ 출력 0 (에러 0) |
| 2 | 신규 export named export 박제 | ✅ 6 타입 + 3 함수 + 2 헬퍼 + 1 상수 |
| 3 | KEY grep = 1건 | ✅ wizard-draft.ts 만 hit |
| 4 | 기존 wizard page.tsx 변경 0 | ✅ git status 신규 3 파일만 |
| 5 | Tailwind 토큰 / 하드코딩 색상 0 | ✅ CSS 변경 0 (자동 충족) |
| 6 | snake_case 응답 타입 박제 | ✅ my_role / tournaments_count 박제 |

💡 tester 참고:
- 본 Phase 는 **순수 lib** (런타임 동작 ❌). E2E 테스트 ❌, 빌드 테스트만 의미.
- 검증 방법: `npx tsc --noEmit` + `npx next build` 통과 확인 (선택).
- 기존 wizard `/tournament-admin/tournaments/new/wizard` 페이지는 변경 0 → 회귀 ❌.

⚠️ reviewer 참고:
- **TournamentPayload 의 4 폼 컴포지션 패턴** — Phase 4 의 prefill / Phase 5 의 회차 복제가 각 폼 데이터를 직접 갱신할 수 있도록 구조화. 단일 평면 타입 (모든 필드 spread) vs 컴포지션 (sub-object) 선택 → 컴포지션 채택 (폼 onChange 시그니처 보존).
- **`organization_id` / `series_id` snake_case 식별자** — WizardDraft 자체는 폼 state 지만 DB 컬럼명 정합 박제. tournament_payload 내부는 camelCase (폼 onChange 표준).
- Phase 2~4 진행 중 TournamentPayload 필드 보강 가능 — 본 Phase 는 "최소 공통 분모" 만 박제. 보강 의도는 주석으로 명시.

다음 단계 (PM):
1. tsc 0 / KEY 1건 / wizard page.tsx 변경 0 확인 → commit 결재
2. `feat(wizard): 통합 마법사 공통 타입·draft 인프라 (Phase 1)` 메시지로 commit
3. push 후 Phase 2 (Step 0 단체) 진입

---

## Phase 19 PR-S2 요약 (commit `4416a91`)

| 파일 | LOC | 변경 |
|------|-----|------|
| `_components/score-sheet-toolbar.tsx` | +130 (신규) | Client Component / 4 버튼 + 모드 segment / ss-shell wrapper |
| `_components/_score-sheet-styles.css` | +95 (신규) | scoresheet.css .ss-toolbar* 룰 이식 (max-width 794px) |
| `layout.tsx` | 단순화 | thin bar = ThemeToggle 만 / back+print 제거 (toolbar 흡수) |
| `match-end-button.tsx` | +39 | controlled props (open/onOpenChange/hideTriggerButton) 추가. 내부 confirm/BFF 변경 0 |
| `score-sheet-form.tsx` | +41 | scoreMode + matchEndOpen state / toolbar JSX / MatchEndButton wiring |

운영 함수 100% 보존: PrintButton.window.print() / MatchEndButton.handleConfirm / localStorage / 4종 모달 / buildSubmitPayload / thin bar (ThemeToggle/RotationGuard/ToastProvider) 모두 변경 0.

검증 8/8 PASS: tsc 0 / vitest 204/204 / 그 외 보존 의무 6건.

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-14 | 마법사 Phase 1 — 공통 lib 인프라 (wizard-types / wizard-draft / wizard-constants) | ✅ 신규 3 파일 +336 LOC / tsc 0 / KEY 1건 / wizard page.tsx 변경 0 |
| 2026-05-14 | Phase 19 PR-S2 — 시안 toolbar 전체 도입 (back + 모드토글 + print + 경기종료) + thin bar 흡수 + MatchEndButton controlled props | ✅ 5 파일 +325/-33 / tsc 0 / vitest 204/204 / commit `4416a91` push |
| 2026-05-14 | Phase 19 PR-S1 — BDR v2.5 시안 토큰 운영 도입 (.ss-shell 스코프 14종 토큰) + D3 운영 PERIOD_LEGEND hex 동기화 | ✅ 신규 1 + 수정 1 +64 LOC / tsc 0 / vitest 204/204 / commit `ef54e7a` push |
| 2026-05-14 | Phase 19 비파괴 통합 분석 (planner-architect / read-only) — PR-S1~S7 분해 + D1~D7 결재 + 위험 매트릭스 9건 | ✅ 분석 박제 / D1 자동 해제 / 사용자 D2~D7 권장안 수락 |
| 2026-05-14 | Phase 23 PR2+PR3 reviewer 검증 결과 박제 | ✅ `5b065ec` docs commit / 머지 OK 판정 |
| 2026-05-14 | Phase 23 PR2+PR3 — 매치 재진입 시 자동 로드 (매치 218 사고 영구 차단) + draft/DB confirm + cross-check | ✅ 3 파일 +368 LOC / tsc 0 / vitest 204/204 / commit `a147bb1` push |
| 2026-05-14 | BDR v2.5 sync + Phase 23 ScoreSheet 시안 5 파일 commit | ✅ commit `1fa9210` (221 파일) / _archive 138 파일 백업 / push |
| 2026-05-14 | Phase 23 PR1 — PBP 역변환 헬퍼 2개 + vitest 24 케이스 | ✅ tsc 0 / vitest 24/24 / commit `b7c44d8` / push |
| 2026-05-14 | Phase 23 설계 분석 (planner-architect / read-only) | ✅ Q1~Q5 결재 수락 / PR 3+1 분해 |
| 2026-05-14 | Phase C — status="completed" score safety net + Phase 22 knowledge | ✅ vitest 8/8 / tsc 0 / 분리 commit |
| 2026-05-13 | FIBA Phase 21+22 — 박스스코어 6 컬럼 hide + LIVE OT 표시 fix | ✅ commit `171de67`+`63c0633` / 운영 배포 |

## 미푸시 commit (subin 브랜치)
**0건** — `ef54e7a` + `5b065ec` + `4416a91` 푸시 완료.

## 후속 큐 (미진입)
- **Phase 19 PR-S3** — RunningScoreGrid `mode` prop 추가 (D2 결재: paper=read-only preview / detail=입력 기본). LOC +80 / 위험 🟡 중간. ⏳ D7 결재대로 진입 전 사용자 재확인
- **Phase 19 PR-S4** — FibaHeader 시각 디테일 (BDR 로고 + 3줄 타이틀)
- **Phase 19 PR-S5** — PeriodScoresSection 시각 (① ② ③ ④ + Winner)
- **Phase 19 PR-S6** — TeamSection head/footer 시각 (모달 진입점 보존). form.tsx 자유 (D1 해제)
- **Phase 19 PR-S7** — FooterSignatures Officials 분리
- **Phase 23 PR4** (선택) — status="completed" 매치 수정 가드
- **Phase 23 PR5** — audit endpoint 박제 + cross-check 호출
- **Phase 23 PR6** — ConfirmModal 박제 + OT cross-check 확장 + PaperPBPRow 명시 mapping
- **Phase A.7** — 시안에 운영 모달 5종 박제 의뢰서 작성 (Claude.ai Project)
- UI-1.4 entry_fee 사용자 보고 재현
- GNBA 8팀 코치 안내
