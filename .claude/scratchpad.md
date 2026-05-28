# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 1C 종료 + Phase 2C 진입 (사용자 결재 2026-05-29)
- **상태**: ✅ Phase 1C 종료 (15/16, PA3 보류) / 🔵 Phase 2C 운영 박제 진입 준비
- **현재 담당**: pm
- **참고**: phase-ledger (`.claude/phase-ledger.md`) = Phase 1/2 source of truth

## 진행 현황 (Phase 1C 디자인 운영 박제)
- **✅ 전체 main 머지 완료**: 1차 PR #650/#651 (12 PR) + 2차 PR #652 `7da6fc4`/#653 `3de14c9` (대형 3) → **subin=dev=main 정합** / Vercel 운영 배포
- **운영 반영 15 PR**: PR-1C-1~9 + 11~16 (PA3 제외 전부). 대형 3 = PA2 `d33177e` / Teams `044527d` / Bracket `7694763`
- **⏸ PR-1C-10 PA3 SKIP**: 시안(종별위임 마법사) ≠ 운영(협회생성 마법사) — planner 재설계 대기 (Phase 1C 유일 잔여)
- **Phase 1C**: 16개 중 **15 박제+머지 완료** + PA3 1건 SKIP → **박제 본체 종료**
- **🔜 다음 세션 재개점**: ① PA3 재설계 (planner — 시안 vs 운영 기능 갭 분석) **또는** ② Phase 2C 운영 박제 시작 (v2.20 sync 완료 / PR ~10건 + css hex 23 토큰화). 새 세션 시작 시 `Read .claude/phase-ledger.md`

## 기획설계 (planner-architect)

### [2026-05-29] PR-1C-10 PA3 AdminWizardAssociation 갭 분석 — 결론 B (SKIP 유지)

🎯 목표: 시안 PA3(종별위임 마법사) vs 운영(협회생성 마법사) 갭 본질 규명 → 박제 가능 여부 결론

📍 시안 4-step (`Dev/design/BDR-current/screens/AdminWizardAssociation.jsx`):
| step | 라벨 | 다루는 데이터/액션 |
|------|------|------|
| 1 | 협회 박제 | 대회를 어느 협회 명의로 등록 (ASSOC_LIST 선택) |
| 2 | 시리즈 설정 | 시리즈 회차 + 이전 회차 데이터 상속 |
| 3 (현재) | **종별 위임** | **종별별(U10/U12/U14/U16) 다른 운영자(TAM) 배정** — 핵심 |
| 4 | 권한 확정 | super_admin 최종 결재 |

📍 운영 5-step (`wizard/association/page.tsx` + Step1~4 + WizardConfirm):
| step | 컴포넌트 | 데이터 | API |
|------|---------|--------|-----|
| 1 | Step1AssociationForm | 협회 name/code/level/region_sido/parent_id | POST /associations |
| 2 | Step2AdminPicker | 사무국장 1명 (user 검색) + role 9종 | POST /[id]/admins |
| 3 | Step3FeeSettings | 배정비 4정수 (주/부/기록/타이머) | POST /[id]/fee-setting |
| 4 | Step4RefereeRegister | 심판 사전등록 N건 (옵션) | POST /[id]/referees |
| 5 | WizardConfirm | 1~4 미리보기 + 생성 트리거 | (위 3~4 순차) |

🔗 핵심: 같은 URL(`/wizard/association`) / 완전히 다른 기능. 운영=**협회를 신규 생성**. 시안=**기존 협회 대회에 종별 운영자 위임**.

📊 갭 매핑 (시안 step → 운영 대응 / 4분류):
| 시안 step | 운영 대응 | 판정 | 사유 |
|----------|----------|------|------|
| 1 협회 박제(선택) | Step1 협회 생성(입력) | 🔴 다른 의도 | 시안=기존협회 select / 운영=신규 입력 폼. 시각 박제 불가 |
| 2 시리즈 설정 | 없음 | 🔴 미지원 | 협회 마법사에 시리즈 step 0. 시리즈는 일반 wizard 소관 |
| 3 종별 위임(TAM) | 없음 | 🔴 DB 미지원 | **결정타**. `TournamentDivisionRule`=운영자 필드 0 / `TournamentAdminMember`=대회 전체 권한(종별 단위 X). 종별별 운영자 배정 데이터 출처 부재 |
| 4 권한 확정 | Step5 확인생성 | 🟡 표면 유사 | 둘 다 "최종 확정"이나 시안=권한 위임 결재 / 운영=협회 INSERT 트리거. 내용 다름 |
| (없음) | Step2 사무국장 | — | 운영 고유 |
| (없음) | Step3 배정비 | — | 운영 고유 |
| (없음) | Step4 심판등록 | — | 운영 고유 |

→ 1:1 대응 0건. 🟢(시각만 박제) 0건. 시안 4-step 중 3건이 🔴(운영 미지원/다른 의도).

**🟦 결론: 옵션 B (SKIP 유지)** — 시안과 운영은 같은 URL이나 근본적으로 다른 기능. 박제 자체 무의미.

핵심 근거 (DB 실측):
1. `TournamentDivisionRule` (schema:3380) = code/label/birthYear/grade/fee/format/settings만. **운영자(userId) 연결 필드 0**
2. `TournamentAdminMember` (schema:378) = tournament 단위 전체 권한. **division/category 컬럼 0** (종별별 운영자 불가)
3. 시안 "U10=김민수 / U12=이서연" 식 종별별 TAM = 운영 DB에 데이터 출처 전무 → mock 금지 룰상 박제 불가
4. 시안 step2 "시리즈" = 협회 마법사가 아닌 일반 wizard 소관 (운영 협회 마법사엔 시리즈 step 0)

→ CLAUDE.md "DB 미지원 기능 시안 금지" + "mock 금지(hide)" 룰 직결. 이전 세션 SKIP 판단 = **정확**. 박제 보류 확정.

**Claude.ai 재의뢰 시 명시할 사항 (택1, 사용자 결재 필요)**:
- (의도 X) "종별 위임"이 **신규 기능 기획**이면 → DB 모델 신설 선행 필요 (TournamentDivisionRule에 admin_user_id 추가 or 신규 DivisionAdmin 모델). 이건 박제가 아닌 **신규 개발** = Phase 1C(시각 박제) 범위 밖. 별도 Phase로 분리 결재.
- (의도 O) PA3가 **협회생성 마법사 리디자인**이 목적이었다면 → 시안을 운영 5-step(협회정보/사무국장/배정비/심판/확인)에 맞춰 **다시 그려야** 함. Claude.ai에 "운영 = 협회 신규 생성 5-step. 종별위임/시리즈 step 제거. 운영 실제 step 기준으로 stepper+폼 시각 재설계" 의뢰.

⚠️ 사용자 결재 포인트:
- PA3 시안의 원래 의도가 (A) 종별위임 신규 기능인가 (B) 협회생성 리디자인인가 = **사용자만 판단 가능**. (A)면 신규 개발 Phase, (B)면 Claude.ai 재시안 의뢰. 둘 다 Phase 1C(15/16 완료) 범위 밖 → Phase 1C는 PA3 SKIP 상태로 종료 권장.

## 구현 기록 (developer)

### PR-1C-14 PA2 Wizard1Step (`d33177e`, +175/-1) — 2026-05-28
- 대상: `new/wizard/page.tsx` QuickCreateForm 만 (Legacy 무수정)
- ① 4 옵션 sub-tab: quick=폼 / legacy·prospectus·association=전환 안내+`router.push`(기존 라우트, 가짜링크 0). association 탭=showAssociationCard 권한만
- ② draft 배너: `loadDraft()` 있을 때만 + !dismiss. 제목+step/4(DRAFT_STEP_LABELS). **작성시각 미저장→hide (mock 금지)**. useEffect 1회 재사용
- ③ 3-step flow: NOW/NEXT/THEN 순수 텍스트
- 보존: 시리즈 select+InlineSeriesForm / 요강분석 진입점. 토큰: `--bg-alt`→`--color-elevated` / 활성=`--color-info`
- ✅ tsc 0 / 추가 diff 하드코딩색·rgba·lucide·rounded-full 0 / 라우팅·API·POST body 0

### PR-1C-16 Bracket (`7694763`) + PR-1C-15 Teams (`044527d`) carryover — 2026-05-28
- Bracket: rgba→color-mix 6건 (success/info 톤). editor 무수정(위반0)
- Teams: rgba→error토큰 1 / #fff→"white" 2 / rounded-full→[50%] 1(정사각형)·→[4px] 2(종별pill)
- 유지: 모달 검은 오버레이 rgba(0,0,0,.5/.6)(다크 시각 역전 회피) / count chip bg-black/20(룰10 예외)
- ✅ tsc 0 / API·데이터 0 변경 / 순수 시각 토큰만

## 테스트 결과 (tester)
PM 직접 검증 모드 (기존 12 PR 동일): git diff 실측 + tsc 0 + 회귀 grep(하드코딩색/lucide/가짜링크 0) + diff 정독. 회귀 6/6.

## 리뷰 결과 (reviewer)
(생략 — PM 직접 검증, 회귀 위험 낮음: UI 추가/기존 로직 미변경)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-29 | PR-1C-10 PA3 갭 분석 (planner) + Phase 1C 종료 결정 | ✅ 결론 B(SKIP 유지) — DB 실측: TournamentDivisionRule 운영자필드0 + TournamentAdminMember 종별컬럼0 → 종별별 TAM 데이터출처 부재 / **사용자 결재 = Phase 1C 15/16 종료 (PA3 보류) + Phase 2C 진행** |
| 2026-05-28 | Phase 1C 대형 3 박제+push+머지 (PA2/Teams/Bracket) | ✅ commit 3 (`d33177e`/`044527d`/`7694763`) / PM 직접검증 tsc0+회귀6/6+diff정독 / subin→dev #652 `7da6fc4` → main #653 `3de14c9` / 운영 배포 / subin=dev=main 정합 |
| 2026-05-28 | subin → dev → main 머지 (PR #650 + #651) | ✅ Phase 1C 12 PR + Phase 2 v2.20 sync / main `5976dca` / Vercel 배포 / 사용자 승인 |
| 2026-05-28 | Phase 1C batch 현 세션 (PR-1C-5~13 / PA3 SKIP = 8 PR) | ✅ PR #650 누적 12 PR / 각 tsc 0 + 회귀 6/6 / mock❌(hide) / 운영 보존 |
| 2026-05-28 | PR-1C-13 PA7 Completed 신규 라우트 (`32f4d2b`) | ✅ 관리자 종료 hub 5 카드 + 🏆 hero / 가짜링크 0 / admin nav 미변경 |
| 2026-05-28 | PR-1C-12 PA6 Divisions (`05d961d`) | ✅ 종별 hero CTA + empty state + code 칩 / 메트릭·4버튼 운영 보존 |
| 2026-05-28 | PR-1C-11 PA9 Prospectus (`4f5d4cc`) | ✅ 진행도 bar + 수동 fallback / 신뢰도 chip 운영 % 보존 / AI 로직 0 |
| 2026-05-28 | PR-1C-9 PA4 SetupHub (`b468436`) | ✅ B1 depends_on 시각화 + 잠금 toast + 모바일 sticky / B7 운영 보존 |
| 2026-05-28 | PR-1C-8 PA8 Playoffs (`30f60a5`) | ✅ 5섹션→4탭 / 8강·4강→순위전 통합 / 결과탭 static (mock❌) |
| 2026-05-28 | PR-1C-7 PA1 AdminList (`0cf3e1f`) | ✅ 4 옵션 진입점 통합 (실재 라우트) / 다크 #fff→var(--bg) |
