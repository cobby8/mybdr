# 작업 스크래치패드

## 현재 작업
- **요청**: PR-MOCK-TO-REAL 버킷A 더미→실데이터 연결 (잔여 ④⑤⑥⑦)
- **상태**: ①②③(stats/calendar/about) ✅ main 반영(`ee1a0c3`) → **④/scrim ⑤/team-invite 진행 중**(STOP 가드)
- **현재 담당**: pm → planner/developer 위임

## 진행 현황표
| 작업 | 상태 |
|------|------|
| PR-MOCK-TO-REAL ④⑤ scrim/team-invite | ⏳ 진행 중(STOP가드: team_match_requests/team_join 의도 확인) |
| PR-MOCK-TO-REAL ⑥⑦ saved/awards | ⏳ 준비중 경계 정리(잔여) |
| PR-MOCK-TO-REAL ①②③ stats/calendar/about | ✅ main(`ee1a0c3`) |
| Phase12 Batch A/B 13화면 / PR-LINEUP-V2 / Phase10 5시안 | ✅ main 반영 |

## 기획설계 (planner-architect)
### PR-MOCK-TO-REAL ④/scrim ⑤/team-invite 실측+설계 (2026-06-15, read-only)
- 🎯 ④⑤ 더미→실데이터 연결 가능성 실측. 결과 = `Dev/scrim-teaminvite-realdata-plan-2026-06-14.md`
- **④ /scrim = 연결 가능(인프라 완성·데이터 0행)**: `team_match_requests`(L503) 실재+의도정합(from→to 친선/연습제안). 백엔드 GET(받은제안)/POST(생성+알림)/PATCH(수락·거절·취소) **완비**. **populated=0행** → mock복원❌·빈상태로 정직 와이어. 상대찾기탭만 모델부재=준비중. me/activity captainId패턴으로 내 운영팀 해소. 規模 中(+200~350). **사용자 결재 1건: (가)지금 인프라연결 vs (나)데이터 생길때 연결**.
- **⑤ /team-invite = STOP(억지매핑)**: `team_join_requests`(L2019) 238행 populated지만 **방향 반대**(유저→팀 가입신청 ≠ 시안 팀→유저 초대) + 토큰/만료/초대자/초대메시지 **필드 전무**. `TeamMemberRequest`(L3165) 6행=jersey/dormant/withdraw(초대무관). → 현행 준비중 유지가 정답. 연결=신규 TeamInvitation 테이블 필요(0스키마 위반·범위밖).
- populated 실측: tmr=0 / tjr=238(approved215/rej18/pend5) / tmreq=6. 임시 audit script 작성→삭제 완료(가드3).
(이전 완료 — 압축)

## 구현 기록 (developer)

### PR-MOCK-TO-REAL ④ scrim (2026-06-15, developer)

📝 구현: /scrim 더미(OPEN_REQS/INCOMING/OUTGOING/HISTORY) 전량 제거 → team_match_requests 실데이터 와이어. 0스키마/0신규라우트(기존 API+모달 재사용).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `scrim/page.tsx` | server component 재작성: getWebSession 인증→내운영팀(captainId 1순위+role fallback)→받은(to=내팀)/보낸(from=내팀)/지난(accepted·rejected·cancelled) prisma 직접조회→ScrimTabs 전달. 빈상태 3분기(비로그인/운영팀없음/0건) | 수정 |
| `scrim/_components/scrim-tabs.tsx` | 신규 "use client" 4탭(받은=수락/거절 PATCH·보낸=취소 PATCH·지난=읽기·상대찾기=준비중+/teams). router.refresh 동기화. snake_case 접근(counterpart/primary_color/preferred_date) | 신규 |
| `globals.css` | `.sc-*` 27규칙 추가(시안 extras-pages.css 역박제, 토큰 var(--*), 쉼표 구분→조기종료0) | 수정 |

설계 차이: 상대찾기탭은 스크림 추천모델(레이팅 자동매칭) DB 부재 → 준비중+/teams 링크로 정직 와이어. 제안 보내기 자체는 팀상세 매치신청 모달(team-match-request-modal) 기존 경로 유지. 인터랙션 액션 경로 [id]=내팀(받은 수락/거절은 to_team=내팀, 보낸 취소는 from_team=내팀) — 기존 PATCH 권한가드 정합.

💡 tester 참고:
- 테스트: 로그인+운영팀 보유 계정으로 /scrim 접속. team_match_requests 0행이면 4탭 전부 빈상태(정상). 비로그인→로그인안내 / 운영팀없음→"팀 운영자만".
- 정상: 받은 제안 수락/거절·보낸 제안 취소 시 router.refresh로 즉시 지난기록 이동. tsc --noEmit PASS / postcss .sc-* 25규칙 파싱 에러0.
- 주의 입력: tmr 0행 환경 → 인터랙션은 더미생성 없이 빈상태만 검증 가능(MONKEYZ 더미 복원❌). 실제 PATCH 테스트는 행 생성 후.

⚠️ reviewer 참고:
- 내 운영팀 "1개 대표선택"(captainTeam findFirst→없으면 manager membership). 다팀 운영자는 첫 팀만 노출 — 의도(스크림=팀단위, 팀선택 UI는 범위밖).
- 지난기록 counterpart = "내가 아닌 쪽"(iAmReceiver 분기). 받은/보낸 모두 OR 조회 take:50.
- 신규 API 0 / api/v1 0 / 하드코딩hex·lucide·9999·폐기--color- 0.

### Phase 1 대회 상태 표시 레이어 (2026-06-15, developer)

📝 구현: DB status가 in_progress/published로 박제된 채 종료일만 지난 대회를 **라벨 표시 단계에서만** "종료"로 보정. DB/CTA(접수) 로직 0 변경.

핵심 = `effectiveTournamentStatus(status, startDate, endDate)` 신규 (tournament-status.ts).
- 규칙: ①종료/취소(TERMINAL) 원본보존 ②draft/upcoming/FINAL/PREOPEN 보정제외 ③그외 종료일(end??start) 당일 23:59:59 경과 시 "completed" ④날짜 둘다 null 원본보존. Invalid Date도 원본보존.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/constants/tournament-status.ts` | effectiveTournamentStatus + TERMINAL/NO_TIME_OVERRIDE 가드 추가 | 수정 |
| `_components/v2-tournament-list.tsx` | deriveV2Status 진입부 eff 적용 | 수정 |
| `[id]/_components/tournament-hero.tsx` | statusLabel/badge eff 적용(prop 기보유) | 수정 |
| `[id]/_components/v2-tournament-hero.tsx` | statusLabel eff 적용(prop 기보유) | 수정 |
| `[id]/_components/v2-registration-sidebar.tsx` | startDate/endDate prop 신규+statusLabel eff(CTA 미접촉) | 수정 |
| `[id]/page.tsx` L1051 | V2RegistrationSidebar에 start/end 전달 | 수정 |
| `components/tournaments/registration-sticky-card.tsx` | start/end **optional** prop+폴백(미렌더 컴포넌트) | 수정 |
| `_components/calendar-view.tsx` | 선택날짜 목록 라벨 eff 적용 | 수정 |
| `_components/week-view.tsx` | 칼럼 라벨 eff 적용 | 수정 |
| `site-templates/classic.tsx` | statusLabel()에 start/end 인자+2호출부 전달 | 수정 |
| `__tests__/lib/effective-tournament-status.test.ts` | 8케이스 단위테스트 | 신규 |

조사 vs 지시문 차이: tournament-hero / v2-tournament-hero는 이미 start/end prop 보유 → prop 추가 없이 적용만. v2-registration-sidebar만 prop 신규.
미수정(의도): profile tournaments-section(start/end 데이터 없음)·admin 화면(raw 유지).

💡 tester 참고:
- 단위테스트: `npx vitest run src/__tests__/lib/effective-tournament-status.test.ts` → 8 PASS
- build: `npm run build` → ✓ Compiled successfully (ads/heatmap dynamic-server 로그는 기존 무관)
- 정상: 종료일 지난 in_progress 대회 라벨이 목록/상세/캘린더/주간/site에서 "종료"로 표시. CTA 버튼 동작은 종전 그대로(isRegistrationOpen 미접촉).
- 주의 입력: 종료일 "오늘"인 대회는 보정 안 됨(당일 진행). draft/cancelled는 과거여도 라벨 유지.

⚠️ reviewer 참고:
- 시간 의존 유틸 — 테스트는 Date.now() 상대 오프셋으로 안정화(고정날짜 미하드코딩).
- classic.tsx statusLabel() 시그니처 변경(optional 인자) → 기존 2호출부만 영향, 외부 import 없음 확인.
- DB/prisma/schema 0. registration-sticky-card는 현재 미렌더(import만) — 안전.

(이전 — 압축)

## 테스트 결과 (tester)

### Phase 1 대회 상태 표시 레이어 검증 (2026-06-15, tester)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npm run build` (TS strict) | ✅ 통과 | `✓ Compiled successfully in 21.9s` / 158 페이지 생성. ads·heatmap dynamic-server 로그는 기존 무관 |
| 단위테스트 8케이스 (`effective-tournament-status.test.ts`) | ✅ 8/8 | published어제→completed / 내일→published / 오늘→published(당일미종료) / in_progress 2년전→completed / cancelled과거→cancelled / draft과거→draft / end null+start과거→completed / 둘다null→원본 |
| effectiveTournamentStatus 로직 (TERMINAL/NO_TIME_OVERRIDE 가드·end??start·23:59:59 경과·Invalid Date 폴백) | ✅ 통과 | 코드 L103~142 규칙1~4 + isNaN 폴백 확인. lower 비교로 대문자 FINAL/PREOPEN 포함 |
| ★ CTA 미접촉 (v2-registration-sidebar) | ✅ 통과 | CTA 분기는 `isRegistrationOpen` 그대로(L259/275). 보정 effStatus는 disabled 버튼 라벨 텍스트(L294)에만 사용. isRegistrationOpen 변경 0 |
| ★ admin 제외 | ✅ 통과 | `(admin)/` 디렉토리 내 effectiveTournamentStatus 적용 0건. 적용 9파일 전부 (web)/components/site-templates 측 |
| (c2) sticky-card optional+폴백 | ✅ 통과 | `startDate?/endDate?` optional, 미전달 시 둘다 null→원본 라벨 폴백. 미렌더 컴포넌트 |
| (d3) profile tournaments-section 미수정 | ✅ 통과 | git diff에 profile 변경 0 (raw 유지) |
| classic.tsx statusLabel() 시그니처 | ✅ 통과 | start/end optional 인자 추가, 2호출부(L547/711) 모두 전달. 외부 import 없음 |
| 회귀: 전체 vitest (1121 tests) | ✅ 통과(Phase1 무관 실패 제외) | 1117 pass / 4 fail. **4 fail은 Phase1 변경분 stash 후 baseline에서도 동일 재현 = 사전 존재 실패** (tournament-delete 3 + running-score-helpers 1, Phase1 변경파일과 무접점) |

📊 종합: 9개 항목 전부 통과 / 0 실패. Phase 1 변경(상태 라벨 보정 레이어)은 의도대로 동작하며 회귀 영향 0.

⚠️ 참고(Phase 1 무관): 전체 회귀 중 사전 존재 실패 2파일 4건 발견 — `tournament-delete.test.ts`(3), `running-score-helpers.test.ts`(1, team_side home/away 정합). Phase 1 변경분을 stash한 baseline에서도 동일 실패 → 본 작업 책임 아님. 별도 후속 처리 대상.

## 리뷰 결과 (reviewer)

### Phase 1 대회 상태 표시 레이어 (2026-06-15, reviewer)

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 2)

✅ 잘된 점:
- effectiveTournamentStatus 가드 정확: TERMINAL(completed/ended/closed/cancelled) + NO_TIME_OVERRIDE(draft/upcoming/final/preopen) 원본 보존, 그 외만 endDate??startDate 23:59:59 경과 시 completed. null/Invalid Date 모두 원본 폴백 — 안전.
- ★ CTA 무영향 확인: v2-sidebar isRegistrationOpen은 prop 값 그대로 사용(L76), effStatus는 statusLabel(L108)에만. CTA 분기(L112/259)는 isRegistrationOpen만 참조 → 신청 가능 대회 안 막힘.
- ★ admin raw 유지: 변경 9파일 모두 공개화면. admin/tournament-admin 미접촉 확인.
- 필드명 정합: 목록/캘린더/주간 snake(start_date/end_date) ↔ API 타입 일치. hero/v2-hero/classic/sidebar camel prop ↔ Prisma select(page.tsx L139-140 startDate/endDate) 일치. 신규 prop(v2-sidebar) 호출부(page.tsx L1062-63) 정확 전달.
- 회귀 안전: hero/v2-hero는 기존 start/end prop 재활용(formatDateRange 이미 사용) → 신규 데이터 흐름 0. 정상 대회(미래/진행중) 라벨 무영향. registration-sticky-card optional 폴백 — 미렌더 안전.
- 검증: 단위 8 PASS / tsc --noEmit 변경파일 에러 0.

🟡 권장 수정 (minor, 후속·동작영향 낮음):
- [tournament-status.ts L128] 타임존 경계: 23:59:59.999 비교가 **렌더 환경 로컬 TZ** 기준. SSR(hero/sidebar/classic)=서버 UTC vs 클라(calendar/week-view "use client")=브라우저 KST → 종료일 익일 최대 ~9h(KST 오전) 동안 SSR이 "진행중" 유지 가능. 23:59 버퍼가 보수적이라 원 문제(끝난 대회 며칠 진행중)는 해소. 엄밀히 하려면 KST 고정 비교 고려(후속).
- [calendar-view L322 / week-view L279] 라벨 JSX 내 IIFE `(() => {...})()` 패턴 — 동작 정상이나 useMemo 목록 가공부에서 eff 미리 계산해 두면 가독성↑(선택).

미수정 결정 타당성:
- d3 profile tournaments-section raw 유지 → start/end 데이터 자체 없음(보정 입력 부재) = **타당**.
- c2 registration-sticky-card optional 폴백 → 현재 미렌더(import만), optional 설계로 raw 폴백 = **타당**.

## 보류 중 (재개 대기)
- **버킷 B 관리자 계획** — 데이터부재 7기능(코트제보/시상/코치/갤러리/심판/샵/쪽지) 신규테이블. 결정 5건 대기(`mock-data-absent-admin-plan-2026-06-14.md`)
- **디자인 일관성 QA 패스** — Claude.ai 산출(bake-fix-checklist) 대기
- **7f28 #301 결선 슬롯** — 잘못생성 결승 8건 삭제완료·#301(pbp271 보존)은 "결승" 오생성 슬롯 잔존(실제 경기 의미 확정 후 재배치). 예선 #291(OT1동점 미종료)·#292(미기록) 실결과 대기
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨(편의 기능)
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만)

## 수정 요청 (후속·동작영향0)
| 대상 | 문제 | 상태 |
|------|------|------|
| game.ts L44 | game_type=parseInt(영문type)→NaN. 영문↔정수 매핑 필요(기존버그) | 후속 |
| tournament-completed-bracket.tsx L274 | 조내 정렬 승수만(gnba 미세순위차) | 후속 |
| stats / lineup minor | server/client 마크업 중복·C버튼 a11y·badge라벨 | 후속 |

## 완료 Phase (이력 압축)
- ✅ **PR-MOCK-TO-REAL ①②③ (2026-06-14, `ee1a0c3`)** — /stats(MatchPlayerStat 2375행 단일source+JS시즌가공·UserSeasonStat/ShotZoneStat 0행 우회)·/calendar(tournament일정357+court_events0빈배열·TODAY실제일)·/about(count 660/105/61·운영진§6보존). 0스키마. lessons "테이블존재≠populated" 강화
- ✅ **Phase 12 Batch A/B 13화면 v2.31 (2026-06-14)** — RI1+12라우트. A(RI1/SF1정적·CC1/GL1/SH1준비중·AW1실데이터) + B(ST1/CA1/SC1/TV1준비중·CV1정적폼·SV1실데이터보존diff0·SE1변경0). mock0·§0선택sync(②③보존). CSS `*/`조기종료 fix(postcss검증)
- ✅ **PR-LINEUP-V2 라인업 앱정합 (2026-06-14)** — 스키마(captain_ttp_id ADD)+API(벤치캡7/정원12/주장필수)+UI(3상태/슬롯/undo/포지션제거)+시안. 주장 필수 이중가드
- ✅ **원영 이탈 반영 (2026-06-14)** — 머지권한 수빈단독·Flutter/api-v1 담당공백·wonyoung 비활성 (CLAUDE.md/WORKFLOW.md/decisions)
- ✅ **Phase 10 정보페이지 5시안(`1d9f125`) / 대회삭제(`f2fecc7`) / KO Sprint1(`a9ebaf6`) / 순위표 근본수정 / sync역전차단 (2026-06-14)**
- ✅ **PR-RECORDER-AUDIT(`a897b22`) / ③대회종료(`ecca28d`) / ②대회상세(`a9cb476`) / 9C / Phase1~9 / PR-PERM-DISPLAY** (이전)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-15 | Phase 1 상태 레이어 리뷰 (reviewer) | ✅ APPROVE (c0/maj0/min2) — CTA/admin 무영향·필드정합·tsc0. TZ경계 minor |
| 2026-06-15 | Phase 1 대회 상태 표시 레이어 (developer) | ✅ effectiveTournamentStatus+10파일·테스트8 PASS·build ✓·DB0 |
| 2026-06-14 | PR-MOCK-TO-REAL ①②③ 머지 (pm) | ✅ main `ee1a0c3` stats/calendar/about |
| 2026-06-14 | PR-MOCK-TO-REAL ②③ calendar+about (dev/tester) | ✅ tournament일정+count실값·운영진보존·PASS8 |
| 2026-06-14 | PR-MOCK-TO-REAL ① stats (dev/tester/reviewer) | ✅ MPS단일source·0행우회·PASS9·APPROVE |
| 2026-06-14 | Phase12 Batch B 7화면 (dev/tester/reviewer) | ✅ 준비중/정적폼/SV1보존·CSS major fix·main |
| 2026-06-14 | Phase12 Batch A 6화면 (dev/tester/reviewer) | ✅ 정적/준비중/AW1실데이터·main |
| 2026-06-14 | PR-LINEUP-V2 4단계 (planner/dev/tester/reviewer) | ✅ 스키마+API+UI+시안·주장필수·main |
| 2026-06-14 | 원영 이탈 반영 + 라인업 머지 (pm) | ✅ CLAUDE/WORKFLOW/decisions·main |
| 2026-06-14 | Phase 10 정보페이지 5시안 (multi) | ✅ `1d9f125` 머지 |
| 2026-06-14 | 대회삭제 / KO Sprint1 (multi) | ✅ `f2fecc7`/`a9ebaf6` |
</content>
