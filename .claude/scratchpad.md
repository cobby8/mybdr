# 작업 스크래치패드

## 현재 작업
- **요청**: 제10회 YOUNGMAN GAME 결선 9경기 중복 정리 + 재발방지(KO Sprint1) + 다른 대회(7f287820) 동일 여부 진단
- **상태**: ✅ DB 정리 완료(트랜잭션) + KO Sprint1 커밋 `a9ebaf6` → **main 머지 진행 중** → 새 대회 진단 대기
- **현재 담당**: pm
- **KO Sprint1**: KO-1(결선판정 강화)·KO-2(2개조 자동생성 throw)·KO-3(silent catch)·KO-9(예선종료 오분류 차단). tester PASS8/8·reviewer APPROVE(min3). vitest55. Sprint2(group_cross 자동등록) 보류
- **병행 대기**: Phase 10 정보페이지 Claude.ai zip(BDR v2.30) 회신(수빈) / PR-PERM-DISPLAY는 이미 main 머지(`157116c`)

## 진행 현황표
| # | 작업 | 상태 |
|---|------|------|
| Phase 10 정보페이지 | About/News/Help/Reviews/AdminNews 5시안 | ⏸ Claude.ai paste 진행 (zip 회신 대기) |
| PR-PERM-DISPLAY | 권한/구독 2축 분리 (역할→구독등급/관리자→운영권한) | ✅ `e98e611` (미push) |
| PR-RECORDER-AUDIT | 기록원 감사로그 + admin_role 가시화 | ✅ #670(`77d014a`)+HOTFIX #672(`3db595c`) 운영 반영 |
| ③ | 대회종료 재구성 박제 (B안) | ✅ #667→#668(`4199d87`) 운영 반영 |
| ①-b | Phase 9C 박제 (9C-1/3/4·9C-2 스킵) | ✅ #667→#668 운영 반영 |
| ②·① | 대회상세 박제 / Phase 9 sync | ✅ #666 / `fb81e53` (이전 세션) |

## 기획설계 (planner-architect)
(완료 — 완료 Phase로 압축)

### 추가 이슈: 예선 종료 → 대회 종료 오분류 (2026-06-14, read-only)
🎯 원인 확정: 제10회 YOUNGMAN GAME 예선 종료 시 자동 종료된 건 **`auto-complete.ts` `checkAndAutoCompleteTournament`(자동 trigger)** 때문. errors.md [2026-06-08] "cron 없음·수동 추정"은 오기 → 자동 trigger 실재로 정정.
- **메커니즘**: 매 매치 종료 시 `finalizeMatchCompletion`이 auto-complete 호출 → `finished===total`이면 status='completed'. total은 결선 존재 무관 "현 DB 매치"만 셈 → **결선 0건이면 예선=전체로 오판**. `isLeagueComplete`도 예선(round_number NULL)만 봐 결선 0건이어도 true. admin PATCH route 순서 = finalize(auto-complete) → **그 다음** auto-knockout-gen(KO-3 silent catch) = 자동 종료가 결선 생성보다 먼저. auto-knockout-gen은 admin PATCH route에만 있음(Flutter/score-sheet 종료 시 결선 생성 안 함). 분기점=skeleton 유무(6/9 수동 대진=skeleton 우회→오분류).
- **방지책**: **KO-9(Sprint 1·XS·회귀0)** = auto-complete에 결선 미생성 가드(full_league_knockout인데 결선 0건이면 종료 차단) + KO-3(silent catch 가시화) 짝. **KO-10(Sprint 2·M)** = 예선 종료 시 결선 placeholder 보장. KO-9 Sprint 1 즉시 편입 권장.
- 산출: `Dev/knockout-auto-schedule-plan-2026-06-14.md` §추가 이슈 append / errors.md [2026-06-08] 보강. 코드·DB 0변경. DB 확정 SELECT 1회 PM 위임(skeleton 유무).

## 구현 기록 (developer)
(완료 — 완료 Phase로 압축)

### Phase 10 박제 #4 IU1 — About (2026-06-14)

📝 구현: About(/about) v2.30 IU1 시안 박제. 기존 304줄(인라인 스타일) → 시안 7섹션 구조(.ab-* 클래스). source: `BDR-current/screens/About.jsx` + `info-shared.css(.ab-*)` + `info-shared.jsx(ABOUT_*)` + 미리보기 iu1-about.html. IU4/IU2/IU3 동일 박제 패턴.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/globals.css | IU1 블록 append(.ab-* 클래스 + 720px 반응형). 토큰 매핑 --r-lg→--radius-card, --r-sm→--radius-chip. 신규 토큰 0(기존 재사용). info-hero/.eyebrow/.t-display는 IU4 공통+기존 재사용 | 수정 |
| src/app/(web)/about/page.tsx | 인라인 스타일 전면 → .ab-* 클래스 교체(7섹션). server 컴포넌트 유지. ★통계 캡션 "운영 시점 연동"(ab-note·mock 새숫자 0)·★운영진 §6 가드 배너(ab-guard) 신규·FAQ 미니 → /help(IU3) 신규. CTA 가입=btn--accent(시안)·/login, 경기=/games | 수정 |

- **★ 통계 처리 방식**: mock 숫자 **새로 지어내지 않음**. 시안 ABOUT_STATS 예시값(20년/48,000+/320+/1,240회·src 라벨)을 시안 그대로 박제 + `ab-note` "운영 시점에 실데이터 연동" 캡션. prisma count 연동 **안 함**(박제 원칙 "데이터 패칭 변경 금지" 준수 — 서버 컴포넌트 유지하되 DB 쿼리 0). 기존 운영도 동일 예시값+캡션 운영 중이라 회귀 0.
- **★ 운영진 실명 0**: 시안 ABOUT_TEAM = 기획팀/개발팀/운영팀/디자인팀/커뮤니티팀/사업팀 (일반 라벨만). 실명/실제 직책 박제 0. §6 가드 배너(ab-guard) 추가 — "실명 비공개·사용자 결정 §6 보존" 명시.
- **검증**: tsc EXIT 0. 위반 0(tsx hex 0·lucide 0·pill 9999 0·핑크/코랄/살몬 0). 아바타 정사각 56x56 border-radius:50%(pill 회피). btn--accent/eyebrow/info-hero 운영 실존 확인.
- **0스키마**: schema 0 / api v1 0 / 데이터 패칭 0(시안 상수만·prisma 0) / mock 새숫자 0. AppNav 직접조작 0(web layout 자동 active="more").
- LOC: page.tsx 304→약 215. 과대 아님.

💡 tester: /about 7섹션(Hero·통계4+캡션·가치6·운영진6+가드배너·파트너8·FAQ미니→/help·CTA). 통계 캡션 "운영 시점 연동" 노출. 운영진 실명 0(팀 라벨만)·ab-guard 배너 표시. FAQ "도움말 보기"→/help. CTA 가입→/login·경기→/games. 720px: 통계 2열/가치 1열/운영진 2열/파트너 2열.
⚠️ reviewer: ★운영진 §6 실명 0 + 가드 배너 / ★통계 mock 새숫자 0(시안 예시값+캡션, prisma 미연동) / btn--accent 시안 충실(기존 btn--primary→시안값 복원).

### Phase 10 박제 #3 IU3 — Help + Glossary (2026-06-14)

📝 구현: IU3-A Help(/help) 통합 허브 보강 + IU3-B Glossary(/help/glossary) 신규 박제. 시안 `BDR-current/screens/Help.jsx` + `info-shared.css(.hlp-*/.glo-*)` + `info-shared.jsx(HELP_FAQ 6/GLOSSARY_MINI 16/HELP_POLICY 6/GLOSSARY 18)` 박제. IU4/IU2와 동일 패턴.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/globals.css | IU3 블록 append(.hlp-* + .glo-* 클래스 + 720px). 토큰 매핑 --r-xs/--r-sm→--radius-chip, --r-md→--radius-card. 신규 토큰 0(기존 재사용) | 수정 |
| src/app/(web)/help/page.tsx | "use client" 전면 교체(405→244). 검색=FAQ+용어 **동시 필터**(시안 신규). 탭 3종/FAQ 아코디언/용어집 mini+CTA Link/정책 6카드(terms·privacy active, 4종 준비중). 1:1 문의 mailto(UI만) | 수정 |
| src/app/(web)/help/glossary/page.tsx | server wrapper(330→29). SEO metadata 보존 + GlossaryClient 렌더. redirect 0 | 수정 |
| src/app/(web)/help/glossary/glossary-client.tsx | **신규** A-Z chip(english 초성·빈글자 disabled·sticky)+검색+카드 grid+cross-domain link(/tournaments·/games·/rankings·/profile). GLOSSARY 18건 | 신규 |

- **검증**: tsc EXIT 0. 위반 0(lucide import 0·tsx hex 0·pill 9999 0). A-Z chip 정사각 30x30 --radius-chip. CSS hex는 #8B5A0F(IU4 .rv-flag--warn 동일)·#fff(칩 흰글씨)만=고정값.
- **★ Stop conditions 준수**: schema 0 / api v1 0 / 데이터 패칭 0(전부 시안 상수·DB 없음) / glossary redirect 0(Link만) / mock 0. AppNav 직접조작 0(web layout 자동 active="more").
- **cross-domain link**: 시안 GLOSSARY links[].href를 운영 실라우트 그대로(미리보기 #href 아님). 10건 link.
- LOC: page.tsx 405→244, glossary 330→server 29 + client 294(분리). 과대 아님.

💡 tester: /help(탭3·검색"픽업"→FAQ+용어 동시·정책 클릭) /help/glossary(A-Z chip·빈글자 비활성·검색·용어 link 도메인 이동). 검색0건=.hlp-empty. 1:1문의 mailto만(정상). glossary→help 무한루프 없어야.
⚠️ reviewer: glossary server/client 분리(metadata=server 보존, 인터랙션=client). 검색 FAQ+용어 동시필터는 시안 사양(회귀 아님).

### KO Sprint1 재발방지 (2026-06-14)

📝 구현: knockout 결선 9경기 중복 사고(제10회 YOUNGMAN GAME) 재발방지 3종 가드. 설계=`Dev/knockout-auto-schedule-plan-2026-06-14.md`(KO-1/2/3).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/lib/tournaments/tournament-seeding.ts | **[KO-1]** `countKnockoutMatches(tournamentId)` 신규(round_number OR bracket_position OR roundName 결승/N강/3·4위전 포함). **[KO-2]** PURE `assertSingleGroupForAutoKnockout(groupNames)`(distinct≥2 throw) + DB `guardAutoKnockoutGroups(tournamentId)` 신규. generator 3곳(generateKnockoutMatches/generateEmptyKnockoutSkeleton/assignTeamsToKnockout) 진입부 KO-2 가드 + 가드키 KO-1 치환 | 수정 |
| src/lib/tournaments/nba-seed-knockout.ts | KO-1/KO-2 import + generateNbaSeedKnockout 진입부 가드 삽입·치환 | 수정 |
| src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts | **[KO-1]** existingKnockout 카운트 → countKnockoutMatches 치환(동적 import 추가). **[KO-3]** auto-knockout-gen silent catch → console.warn + KO-2 사유 메시지 | 수정 |
| src/app/api/web/tournaments/[id]/bracket/route.ts | **[KO-3]** skeleton-gen silent catch → console.warn + KO-2 사유 메시지 | 수정 |
| src/__tests__/lib/tournaments/auto-knockout-guard.test.ts | **신규** KO-2 PURE 회귀게이트(1개조/무그룹/빈문자/trim 통과 6 + 2·3개조 throw 4 = 10) | 신규 |

- **검증**: tsc EXIT 0 / vitest KO-2 10건 + nba 회귀 9건 PASS. 전체 vitest 기존실패 4건(tournament-delete 3·running-score-helpers 1)은 **KO 변경 stash 후에도 동일 실패** = baseline 무관 확인. +128/-19 (4파일) + 신규 테스트
- **Stop conditions 준수**: schema 0 / api/v1 0 / 1개조 경로 보존(distinct≤1 통과·회귀게이트) / group_cross(S2) 미구현 / tsc·vitest(신규) 통과
- ⚠️ **순환import 없음 확인**: tournament-seeding.ts는 nba-seed-knockout.ts를 import 안 함 → nba가 seeding의 가드 단방향 import 안전
- ⚠️ **린터 revert 함정 2회**: Edit 직후 외부 린터가 seeding.ts/route 변경을 통째 revert(2회) → grep 재검증 후 전량 재적용으로 복구. 최종 grep으로 5곳 가드·3 헬퍼·2 catch 모두 확정

#### [KO-9] 결선 미생성 자동종료 오판 가드 (2026-06-14)

📝 버그: full_league_knockout/group_stage_knockout(예선후 결선 별도생성)이 결선 0건일 때 예선만 완료되면 auto-complete가 finished===total로 오판 → 대회 자동종료(completed). 결선 생성 전 종료 차단 가드 추가.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/lib/tournaments/auto-complete.ts | PURE `isKnockoutFormat(format)` 신규(KNOCKOUT_FORMATS=full_league_knockout/group_stage_knockout 포함판정). `checkAndAutoCompleteTournament`: findUnique select에 `format:true` 추가 + total>0 직후 `isKnockoutFormat && countKnockoutMatches===0`이면 early return `{updated:false, reason:"knockout-not-generated"}` + console.warn(종료 UPDATE 안 함). countKnockoutMatches는 KO-1 헬퍼 재사용(import, 중복구현0) | 수정 |
| src/__tests__/lib/tournaments/auto-complete-knockout-guard.test.ts | **신규** PURE isKnockoutFormat 7(knockout 2=true/round_robin·single_elimination·league_advancement·null·undefined=false) + 가드분기 3(결선0=차단/결선有=종료/비knockout=우회·count미호출) = 10 | 신규 |

- **검증**: tsc EXIT 0 / vitest 신규 10/10 + KO-2 10/10 + nba 22/22 PASS. auto-complete.ts +36/-1. 회귀안전=결선없는 format(round_robin/swiss/league_advancement/group_stage_with_ranking/single·double_elimination/dual_tournament)은 isKnockoutFormat=false → 가드 미적용·기존 종료경로 100% 보존(count조차 미호출 테스트로 확인)
- **Stop conditions 준수**: schema 0 / api/v1 0 / 결선없는 format 정상종료 회귀0 / tsc·vitest 통과
- ⚠️ countKnockoutMatches는 글로벌 prisma 사용(client 파라미터 없음) — 결선 카운트는 트랜잭션 미커밋 데이터 의존 안 해 무방. 테스트는 모듈 mock으로 대체(DB I/O 0)

💡 tester 참고(KO-9):
- 테스트: `npx vitest run src/__tests__/lib/tournaments/auto-complete-knockout-guard.test.ts` (10/10 PASS)
- 정상: 결선 format이라도 결선매치 생성 후엔 정상 종료 / 비knockout format은 가드 우회 정상 종료
- 주의: 운영 영향=결선 별도생성 2 format의 "예선만 완료" 시점만 (종료 보류). 결선 생성되면 다음 트리거에서 정상 종료

⚠️ reviewer 참고(KO-9):
- early return 위치가 total>0 직후·finished<total 분기 앞 → 결선 0건이면 finished/total 무관하게 항상 차단되는지
- isKnockoutFormat false인 format은 `&&` 단락평가로 countKnockoutMatches 호출조차 안 되는지(불필요 쿼리·회귀0)

💡 tester 참고:
- 테스트: `npx vitest run src/__tests__/lib/tournaments/auto-knockout-guard.test.ts` (10/10 PASS 확인)
- 정상: 1개조(또는 무그룹) 자동생성 통과 / 2개조+ 자동생성 시 한국어 throw → catch에서 console.warn 노출(메인 플로우 진행). DB 테스트 불필요(PURE만 게이트)
- 주의: 운영 영향은 **자동생성 경로만** (수동 INSERT 크로스 대진은 가드 무관·정상). 2개조 대회 예선완료 시 4강 자동생성이 이제 throw로 차단됨(설계 의도)

⚠️ reviewer 참고:
- countKnockoutMatches OR 조건이 1개조 정상 generator 산출물에 false positive 안 내는지(round_number 부여 매치는 기존과 동일 카운트)
- guardAutoKnockoutGroups가 generator 진입부 최상단(중복카운트·순위계산 전)에 위치해 2개조면 DB write 0으로 차단되는지
- KO-3 console.warn이 메인 플로우(경기완료/리그생성) 응답 성공을 막지 않는지

## 테스트 결과 (tester)
(완료 — 완료 Phase로 압축)

### Phase 10 박제 #4 IU1 — About (2026-06-14, 정적 검증)

| # | 검증 항목 | 결과 | 비고 |
|---|----------|------|------|
| 1 | tsc `--noEmit` | ✅ 통과 | EXIT 0 |
| 2 | ★★ 운영진 실명 0 + §6 가드 배너 | ✅ 통과 | team[] = 기획/개발/운영/디자인/커뮤니티/사업팀(일반 라벨만). 실명/실직책 0. 시안 ABOUT_TEAM과 100% 일치. ab-guard 배너 존재("실명 비공개·사용자 결정 §6 보존" verified_user 아이콘) |
| 3 | ★ 통계 mock 더미 0 + 캡션 + prisma 미연동 | ✅ 통과 | stats[] = 시안 ABOUT_STATS 그대로(20년/48,000+/320+/1,240회). 새 가짜숫자 0. ab-note 캡션 "운영 시점에 실데이터로 연동". prisma/count/findMany import 0(주석 1건만). async/await 0=동기 서버 컴포넌트 |
| 4 | 7섹션 구조 + 링크 | ✅ 통과 | Hero(info-hero)/통계4+캡션/가치6/운영진6+가드/파트너8/FAQ미니/CTA. FAQ미니 btn--primary→/help. CTA 가입 btn--accent btn--xl→/login·경기 btn--xl→/games. /login·/games·/help 라우트 3종 실존 |
| 5 | 0스키마 (schema/api/패칭 0) | ✅ 통과 | DB import 0·prisma 0·서버 컴포넌트 동기 유지. 데이터 전부 시안 상수(stats/values/team/partners) |
| 6 | 회귀 (AppNav 4케이스·모바일 720 1열) | ✅ 통과 | AppNav 직접조작 0(web layout 자동 active="more"). @media 720px: 통계 2열(3번째 border-left:0)/가치 1열/운영진 2열/파트너 2열 |
| 7 | 디자인 (hex 토큰화·핑크코랄살몬 0·lucide 0·pill 9999 0·신규토큰 0) | ✅ 통과 | ab블록 hex 0·tsx hex 0·lucide 0·9999px 0·핑크/코랄/살몬 0. 아바타 56x56 border-radius:50%(pill 회피). 사용 토큰 16종 전부 기존 정의 존재(신규 0·매핑 주석 명시). 재사용 클래스(info-hero/eyebrow/t-display/btn--accent/btn--xl) 전부 실존 |

📊 종합: 7개 중 7개 통과 / 0개 실패

**결론**: IU1 About 박제 정적 검증 전항목 통과. ★★운영진 실명 0(시안 ABOUT_TEAM 일반 팀 라벨 그대로 + §6 가드 배너) / ★통계 mock 새숫자 0(시안 예시값 + ab-note 캡션 + prisma 미연동·데이터 패칭 0). 신규 결함 0. 수정 요청 없음.

### Phase 10 박제 #3 IU3 — Help + Glossary (2026-06-14, 정적 검증)

| # | 검증 항목 | 결과 | 비고 |
|---|----------|------|------|
| 1 | tsc `--noEmit` | ✅ 통과 | EXIT 0 |
| 2 | ★ glossary redirect 0 (무한루프 방지) | ✅ 통과 | page.tsx/client redirect() 호출 0. /help↔/help/glossary 전부 next/link Link. (redirect 단어=주석 4건만) |
| 3 | A-Z chip (english 초성·빈글자 disabled·sticky·radius-chip) | ✅ 통과 | initial()=english 첫글자 대문자. activeLetters Set로 미존재 글자 `disabled`. `.glo-az` position:sticky top:0. 칩 30x30 `--radius-chip`(pill 아님) |
| 4 | Help 검색(FAQ+용어 동시 필터)·탭 3종 | ✅ 통과 | needle로 fFaq(q\|a)+fMini(term\|desc) 동시. 탭 FAQ 아코디언(open 1개)/용어 mini+CTA Link/정책 카드. 정책 terms·privacy active(Link), 4종 is-soon "준비 중" div |
| 5 | cross-domain link 운영 라우트 실존 | ⚠️ 조건부 | /tournaments·/games·/rankings·/profile·/terms·/privacy 디렉터리 6종 전부 실존. **단 `/games?type=pickup\|guest\|practice` 영문 type → listGames `parseInt(type)`=NaN** (game.ts L44, DB game_type=정수 0/1/2). 빈결과/쿼리오류 가능. **단 홈 quick-menu.tsx도 동일 `?type=pickup` 패턴 → IU3 회귀 아님·기존 운영버그 carry** |
| 6 | ★ 0스키마/데이터 무변경·SEO metadata 보존 | ✅ 통과 | FAQ/GLOSSARY/POLICY 전부 시안 상수(DB 없음). schema/api v1/패칭 0. glossary server(page.tsx) metadata 보존 + client 분리 정상 |
| 7 | 회귀(AppNav·모바일 720 1열) | ✅ 통과 | AppNav 직접조작 0(web layout 자동). @media 720px: hlp-policy/hlp-grow/glo-grid 전부 1열 |
| 8 | 디자인(hex 토큰화·핑크/코랄/살몬 0·lucide 0·pill 0·신규토큰 0) | ✅ 통과 | tsx hex 0. CSS hex=#8B5A0F(IU4 동일)·#fff(칩 흰글씨)만. lucide 0(주석만). 9999px/핑크/코랄/살몬 0. 토큰 전부 기존 정의 재사용(신규 0) |

📊 종합: 8개 중 7개 통과 / 1개 조건부(#5 — IU3 회귀 아님·기존 운영 버그 carry)

**결론**: IU3 박제 자체 검증 통과. 박제 범위 내 신규 결함 0. #5는 시안의 운영 라우트를 그대로 박제한 결과로, 홈 quick-menu.tsx와 동일한 `?type=pickup` 컨벤션 → listGames가 영문 type을 못 받아 빈결과/오류 가능하나 **운영 전반의 기존 버그**(glossary가 새로 깨뜨린 것 아님). 후속 분리 처리 권장. (reviewer는 games type 지원으로 보고 #5를 통과 판정했으나, 정적 검증 결과 game.ts L44 parseInt가 영문 미지원 — tester가 더 보수적 판정)

## 리뷰 결과 (reviewer)

### IU1 About 박제 (2026-06-14)

📊 종합 판정: **APPROVE** (c0 / maj0 / min1 — 후속, 동작영향 0)

✅ 잘된 점:
- ★★ §6 운영진 실명 **0 완벽 준수** — team[] = 기획팀/개발팀/운영팀/디자인팀/커뮤니티팀/사업팀 일반 라벨만. 실명·실제 직책 박제 0. 추가로 ab-guard 가드 배너("실명 비공개·사용자 결정 §6 보존") 노출 — 회귀 방지 명문화까지 이상적. 시안 ABOUT_TEAM과 100% 일치
- ★ 통계 mock 새 숫자 0 — stats[] 4건(20년/48,000+/320+/1,240회·src)이 시안 ABOUT_STATS와 한 글자도 안 틀리게 일치. 새 숫자 창작 0. ab-note "운영 시점에 실데이터로 연동" 캡션으로 예시값 명시. prisma count 미추가(서버 컴포넌트지만 DB 쿼리 0) — 박제 원칙 "데이터 패칭 변경 금지" 준수
- 데이터 패칭 무변경 회귀 0 — page.tsx에 prisma/fetch/await 0. metadata(SEO) 기존 보존. import는 next/link·Metadata만. 기존 about도 동일 예시값 운영이라 회귀 0
- 13룰 통과 — var(--*) 토큰만, 신규 토큰 0(매핑 --r-lg→--radius-card / --r-sm→--radius-chip 주석 명시·실측 13개 토큰 전부 globals.css :root 기존 정의 확인). Material Symbols만(sync/verified_user/help · lucide 0). pill 9999 0(아바타 56x56 정사각 border-radius:50%). 핑크/코랄/살몬 0. tsx hex 0(CSS hex도 0 — 전부 토큰)
- 시안 변수 매핑 정합 — globals.css .ab-* 블록이 시안 info-shared.css .ab-* 규칙과 1:1 일치(--r-lg→--radius-card·--r-sm→--radius-chip 2곳[.ab-guard·.ab-partner] 외 전부 동일 토큰). page.tsx도 시안 About.jsx와 구조·텍스트 1:1
- 7섹션·링크 정합 — Hero(info-hero 재사용)/통계4+ab-note/가치6/운영진6+가드/파트너8/FAQ미니→/help/CTA(가입 btn--accent→/login·경기 btn--xl→/games). 시안 href(iu3-help/au1-login-signup/p2-ua1-games) → 운영 라우트(/help·/login·/games) 정확 치환. btn--accent=var(--accent)(BDR Red)로 시안 shell.css btn--accent와 동일 의도(강조 가입버튼)
- AppNav frozen·클래스 충돌 0 — AppNav 직접조작 0(web layout 자동 active="more"). .ab-wrap 단일 정의(중복 0)·.ab- 네임스페이스 globals.css 신규 블록 단독. info-hero/.eyebrow/.t-display/btn--accent/btn--xl/btn--primary 전부 기존 실존 재사용
- schema/api 변경 0 — page.tsx 시안 상수 4종(stats/values/team/partners)만·prisma 0·api v1 0. tsc --noEmit EXIT 0

🔴 필수 수정: 없음

🟡 권장 수정(후속·동작영향 0):
- [about/page.tsx L87·L92] inline style 2곳(`fontSize:42`·`color:var(--ink)`) — 시안 About.jsx가 동일 inline이라 박제 충실 의도는 정합. 운영 컨벤션상 .info-hero__title 오버라이드를 CSS 클래스로 빼면 더 깔끔하나 동작·디자인 영향 0(시안 1:1 우선 시 현행 유지도 OK). 후속 미세 정리

---

### IU3 Help + Glossary 박제 (2026-06-14)

📊 종합 판정: **APPROVE** (c0 / maj0 / min2 — 후속, 동작영향 0)

✅ 잘된 점:
- ★ glossary redirect 금지 100% 준수 — page.tsx redirect 0 / glo-back·CTA·cross-domain 전부 `Link`. 무한루프 없음
- server/client 분리 적절 — metadata(SEO)=server wrapper 보존, useState(A-Z·검색)=client. 이상적 패턴
- 데이터 무변경 확정 — 4 상수(HELP_FAQ 6/GLOSSARY_MINI 16/HELP_POLICY 6/GLOSSARY 18) 전부 시안 박제. schema/api/패칭 0
- 13룰 통과 — var(--*) 토큰만·신규 토큰 0(전부 기존 재사용·CSS 주석에 매핑 명시)·Material Symbols만(lucide 0)·pill 9999 0. tsx hex 0. CSS hex는 #fff(칩 흰글씨)·#8B5A0F(IU4 .rv-flag--warn 동일 고정값)만
- A-Z chip 로직 정확 — english charAt(0).toUpperCase() 초성, activeLetters Set 으로 빈 글자 disabled, position:sticky top:0
- cross-domain link 6개 라우트(/terms·/privacy·/games·/tournaments·/rankings·/profile) 전부 실존. games는 searchParams type 지원 → ?type=pickup/guest/practice 유효(깨진 링크 0)
- AppNav frozen 준수 — 직접 조작 0(web layout active 자동). .hlp-*/.glo- 네임스페이스 충돌 0(globals.css 신규 블록 단독)
- 접근성 — 장식 아이콘 aria-hidden, 비활성 정책카드 aria-disabled, disabled chip 네이티브 속성

🔴 필수 수정: 없음

🟡 권장 수정(후속·동작영향 0):
- [glossary-client.tsx L173 initial()] english 미존재 용어는 초성 "" → activeLetters 에 빈 문자열 포함되나 az 루프(A-Z)와 매칭 안 돼 무해. 현 GLOSSARY 18건 전부 english 보유라 실발생 0. 향후 english 없는 용어 추가 시 '전체'에서만 노출(A-Z 누락) — 의도 확인 또는 fallback(한글 초성) 후속
- [page.tsx L77 open=0] FAQ 검색 필터 후 fFaq 인덱스 i 기준 open 비교 — 필터로 목록 줄면 open 인덱스가 다른 항목 가리킬 수 있음(예: 검색 시 2번째가 열림). UX 미세, 시안 사양 범위. 검색 onChange 시 setOpen(-1) 추가하면 깔끔(후속)

---

### (이전) 감사로그 박제
(완료 — 완료 Phase로 압축)
- 실패 격리 OK — log.ts 전체 try-catch 내부 흡수, 호출부 await throw 0 → 메인 플로우 차단 없음.
- tsc --noEmit 통과(에러 0).

🟡 권장 수정(후속·동작영향 0, 필수 수정 없음):
- [recorders/route.ts L133] POST `tournamentForLog` 조회가 existing 분기 전 무조건 실행 — 409(이미 등록) 케이스는 adminLog 미실행이라 SELECT 1회 낭비. 드문 경로+1쿼리라 무해. 후속 미세 최적화.
- [recorders/route.ts L234] DELETE 대회명을 update 후 별도 findUnique. POST는 분기 전 조회 — 위치 비일관(minor). 동작/안전 영향 0.

## 보류 중 (재개 대기)
- **7f28 5차 뉴비리그 결선 정리 (2026-06-14 보류)** — 2개조 6팀 full_league_knockout. "결승" 9경기=A조3×B조3 전체교차 오생성(KO-2가 향후 차단할 패턴). 정상=각조1위 결승 1경기. **모순**: B조1위=오름 확정 / A조 예선 미완료(291·292 live, 스나이퍼 A조1위 아님·Gots 1승 선두)인데 #301(스나이퍼vs오름 40:52, 기록 mps20·pbp271) 이미 완료. 8경기(296~304 제외 #301)=기록0 삭제명확 / #301 기록보존 처리는 **사용자 운영맥락 확인 후 재개**(스나이퍼가 왜 결승 치렀는지). 정리 시 read-only 재진단부터.

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| reviewer | tournament-completed-bracket.tsx (L274 qual 정렬) | [minor·후속] 조내 정렬 승수만 — 승점룰(gnba) 대회 미세 순위차 가능. 조별 동일경기수면 무해 | 후속 검토 |
| reviewer | admin/notifications/page.tsx | [minor·후속] `as FormEvent` 단언 안전하나 handleSubmit 시그니처 완화로 캐스팅 제거 가능. 동작 영향 0 | 후속 검토 |
| tester | src/lib/services/game.ts (L44) | [후속·IU3 범위 밖·기존버그] `where.game_type = parseInt(type)` — 영문 type("pickup"/"guest"/"practice") → NaN. glossary 링크 `/games?type=pickup` 및 홈 quick-menu.tsx 동일 패턴이 빈결과/쿼리오류 가능. 영문↔정수 매핑(PICKUP=0/GUEST=1/PRACTICE=2) 또는 isNaN 가드 필요. **IU3 박제 회귀 아님(시안 라우트 박제)** | 후속 검토 |

## 완료 Phase (이력 압축)
- ✅ **PR-RECORDER-AUDIT 기록원 감사로그+admin_role 가시화 (2026-06-12, `a897b22`)** — 계기=수빈 "권한 해제" 의혹(실측 해제0·가시성 빈틈). 파트1: recorders/route.ts adminLog 3지점 add-only(assign신규/재활성화=info·remove=warning / 대회명·email 조회 / resourceId=tr.id·target=User / 응답shape불변). 파트2: /admin/users 관리자컬럼 admin_role 칩(recorder_admin="기록원관리자"/association_admin="협회관리자"/super_admin=ON중복생략) + select 2곳(page L98↔loadMore L278) drift0 + interface+getAdminRoleLabel. `admin-stat-pill data-tone="info"`. +92/-7. tester PASS5/5·reviewer APPROVE(c0/maj0/min2후속). 옵션 재배정=스킵(record01/02 이미 recorder_admin 전역권한). 역박제=skip(시안 구조 상이). minor2=route.ts 409 SELECT낭비·DELETE 조회위치 비일관(동작영향0)
- ✅ **①-b Phase 9C 운영 박제 (2026-06-12, `cb88c7a`+`8aeb050`+`b759d2d`)** — NU1/NU2/NA1 v2.29 박제 3PR(9C-2 search 스킵=이미 동등박제). 9C-1 nt-synced 동기화 배너(unreadCount 재사용·AppNav무변경) / 9C-3 messages "준비중" warn-soft 박스(mock·3컬럼·THREADS 0변경·DB미지원 carry) / 9C-4 admin 발송 UI(target 4chip·팀장=DB미지원 disabled 전송차단 2중가드·미리보기·확인모달·카테고리chip 생략·API/role/schema 0변경). +553/-141. tester PASS(정적·회귀10/10)·reviewer APPROVE(c0/maj0/min2). 팀장 전송차단·FormEvent 캐스팅 안전 판정. 잔여=3001 육안(미실행)
- ✅ **③ 대회종료 재구성 박제 B안 (2026-06-10~12, `ecca28d`+`7d6f89c`)** — 시안 v2(11) pill탭 완전재현. 신규5(stat-leaders.ts·stat-leaders-card·news-card·completed-bracket·operator-bar)+수정3(tournament-tabs +60·page.tsx종료분기 +180·completed.css +200)+역박제2. **격리전략=혼합**(탭/일정/팀/규정=TournamentTabs optional prop 재사용·NBA본선+예선=종료전용 신규복제). **진행중뷰 회귀0**(공유브래킷 diff0·진행중 호출부 무변경 3중확인). 0스키마·강조 cafe-blue·승자점수 bdr-red·배너 navy·mock0. NBA승자=winnerTeamId 직접비교+점수폴백(major1 해소). tester PASS·reviewer APPROVE
- ✅ **② 대회상세(진행중) 리스킨 (2026-06-10, `a9cb476`+`508325a`)** — pill탭·팀필터칩 cafe-blue·심판버튼제거·Hero compact. 강조색 7파일 cafe-blue 통일·승자점수 bdr-red 보존
- ✅ ① Phase 9 v2.29 sync (`fb81e53`) — 알림·메시지·검색 4시안 / carry-over diff0
- ✅ PR-MYBDR-SOCIAL (모바일 OAuth `72eb2df` PR#663) / Phase 8C (8시안) / Phase 1~7 (54시안)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-14 | **Phase 10 IU1 About 코드 리뷰** (reviewer) | ✅ APPROVE(c0/maj0/min1). ★★운영진 실명0(시안 ABOUT_TEAM 팀 라벨 100%일치+ab-guard §6 가드 배너) ★통계 mock 새숫자0(시안 ABOUT_STATS 1:1·ab-note 캡션·prisma 미연동·DB쿼리0) 데이터패칭 무변경 회귀0. 13룰 통과(신규토큰0·매핑 정확·Material Symbols·아바타 50%·hex0). 시안 .ab-* 1:1·href→운영라우트 정확치환. AppNav frozen·.ab-wrap 중복0·tsc0. 필수수정 없음 |
| 2026-06-14 | **Phase 10 IU1 About 정적 검증** (tester) | ✅ 7/7 통과. tsc0·★★운영진 실명0(시안 ABOUT_TEAM 팀 라벨+§6 가드 배너)·★통계 mock 새숫자0(시안 예시값+ab-note 캡션·prisma 미연동·async 0=동기 서버컴포넌트)·7섹션(FAQ→/help·CTA→/login·/games 실존)·schema/api/패칭0·720 1열·hex/lucide/pill/핑크코랄살몬0·신규토큰0(16종 기존 재사용)·AppNav 조작0. 수정요청 없음 |
| 2026-06-14 | **Phase 10 IU1 About 박제** (developer) | ✅ 304줄 인라인 → v2.30 시안 7섹션(.ab-* 클래스). globals.css IU1 블록 append(토큰 매핑 --r-lg→--radius-card·신규0). ★통계 mock 새숫자0(시안 예시값+"운영 시점 연동" ab-note·prisma 미연동) ★운영진 실명0(팀 라벨+§6 가드 배너) FAQ미니→/help. CTA btn--accent/login·/games. tsc0·위반0(hex/lucide/pill/핑크코랄 0). schema/api/패칭 0 |
| 2026-06-14 | **Phase 10 IU3 Help+Glossary 정적 검증** (tester) | ✅ 8개 중 7통과/1조건부. tsc0·redirect0(Link만)·A-Z chip(english초성·disabled·sticky·radius-chip)·검색 FAQ+용어 동시·SEO metadata server/client 분리 보존·schema/api/패칭 0·720 1열·핑크/코랄/lucide/pill/신규토큰 0. ⚠️#5: glossary `/games?type=pickup` 영문 type → game.ts L44 parseInt=NaN 빈결과 가능(홈 quick-menu 동일·IU3 회귀 아님·기존버그 carry). 수정요청 후속 1건 추가 |
| 2026-06-14 | **KO-9 결선 미생성 자동종료 오판 가드** (developer) | ✅ auto-complete.ts PURE isKnockoutFormat(full_league_knockout/group_stage_knockout) + checkAndAutoCompleteTournament에 format select·결선0건 early return(knockout-not-generated·console.warn). countKnockoutMatches(KO-1) 재사용. 신규 vitest 10/10·KO-2 10/10·nba 22/22·tsc0. +36/-1. 결선없는 format 회귀0(count미호출 검증). schema/v1 0 |
| 2026-06-14 | **KO Sprint1 결선중복방지 (KO-1/2/3)** (developer) | ✅ countKnockoutMatches(round_number/bracket_position/roundName OR) + assertSingleGroupForAutoKnockout(2개조 throw)/guardAutoKnockoutGroups. generator 4곳 가드·match route catch 가시화·bracket catch 가시화. 신규 vitest 10/10·nba회귀 9/9·tsc0. +128/-19 4파일+테스트. 기존실패4건=baseline무관(stash검증). schema/v1 0 |
| 2026-06-13 | **PR-PERM-DISPLAY 권한/구독 2축 분리** (pm) | ✅ `e98e611` admin-users-table 칼럼 라벨 역할→구독등급·관리자→운영권한(슈퍼관리자 err칩)·page 부제 4→MAX_SUPER_ADMINS(10). 옵션B·DB0·표시로직만·+12/-6·tsc0. 역박제skip·decisions+1. §0 lock 확인(transient·해소) |
| 2026-06-13 | **Phase 10 정보페이지 Claude.ai paste 준비 + 세션 정리** (pm) | ✅ 첨부4건 존재확인 + paste 메시지본체 추출. Claude.ai 1차 "첨부 미도착" 차단 → (A)실데이터 박제 결재 / drag-drop 4건 + 회신문구 제공. ③·9C·RECORDER 전부 머지 확인(미push0). scratchpad 정리 |
| 2026-06-13 | **PR-RECORDER-AUDIT 파트0 HOTFIX 기록원목록 snake_case 표시버그** (pm) | ✅ `e3d757e` tournament-admin recorders/page.tsx camelCase→snake_case 3곳(type/filter/제거). apiSuccess 변환함정 재발6회. tsc0·응답/body/route 무변경. +7/-5. errors+1 |
| 2026-06-12 | **PR-RECORDER-AUDIT 감사로그+admin_role 가시화** (dev/tester/reviewer/pm) | ✅ `a897b22`→#669→#670 main머지. recorders adminLog 3지점 + admin_role 칩. PASS5/5·APPROVE·lessons+1. +92/-7 |
| 2026-06-12 | **①-b Phase 9C 박제+검증+커밋** (developer/tester/reviewer/pm) | ✅ 9C-1/3/4 박제(9C-2 스킵)·tsc0·tester PASS·reviewer APPROVE·라우트별 3커밋(`cb88c7a`/`8aeb050`/`b759d2d`). 팀장 전송차단·mock유지·DB/api/role 0변경 |
