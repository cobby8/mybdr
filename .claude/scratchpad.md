# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 10 정보페이지 박제 (v2.30) — 5시안 전부 완료
- **상태**: ✅ **완료·main 운영 반영** (IU4/IU2/IU3/IU1/IA1 + 대회삭제 + KO Sprint1 전부 머지)
- **현재 담당**: 대기 (다음 작업 요청 대기)

## 진행 현황표
| # | 작업 | 상태 |
|---|------|------|
| Phase 10 정보페이지 | Reviews/News/Help+Glossary/About/AdminNews 5시안 | ✅ main 반영(#679→#680 + 선반영) |
| 대회 삭제 기능 | Soft/Hard + cascade 7스텝 | ✅ main(#675→#676 `f2fecc7`) |
| KO Sprint1 | 결선중복방지 KO-1/2/3/9 | ✅ main(`a9ebaf6`+`bf8978e`) |
| PR-PERM-DISPLAY / RECORDER-AUDIT / ③ / 9C / ②·① | 이전 작업 | ✅ 운영 반영 (이력 압축) |

## 기획설계 (planner-architect)
(완료 — 완료 Phase 압축)

## 구현 기록 (developer)
(완료 — 완료 Phase 압축)

## 테스트 결과 (tester)
(Phase 10 5시안 전부 PASS/조건부 — 완료 Phase 압축)

## 리뷰 결과 (reviewer)
(Phase 10 5시안 전부 APPROVE — 완료 Phase 압축)

## 보류 중 (재개 대기)
- **7f28 5차 뉴비리그 #301 결선 슬롯** — 잘못생성 결선 8건(296~304 중 #301 제외·기록0)은 ✅ 삭제완료(2026-06-14·트랜잭션). #301(스나이퍼vs오름 40:52·pbp271·mps20)은 사용자 결정으로 **보존** — 단 여전히 "결승" roundName 오생성 슬롯에 위치(정상 대진 아님). 실제 경기 의미 확정 후 재배치/처리 검토 필요
- **KO Sprint2 (group_cross 자동등록)** — 2개조+ group-aware 크로스 대진 자동생성. Sprint1로 사고는 영구차단됨(편의 기능)
- **IA1 발행 알림 실발송 연동** — 대량 알림 대상 정의 후 createNotification 연동(현재 UI 체크박스만)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| tester | src/lib/services/game.ts (L44) | [후속·기존버그] `where.game_type = parseInt(type)` — 영문 type("pickup"등)→NaN. glossary `/games?type=pickup`·홈 quick-menu 동일 빈결과 가능. 영문↔정수 매핑(PICKUP=0/GUEST=1/PRACTICE=2) 필요. IU3 회귀 아님 | 후속 |
| reviewer | tournament-completed-bracket.tsx (L274) | [minor·후속] 조내 정렬 승수만 — 승점룰(gnba) 미세 순위차 가능 | 후속 |
| reviewer | admin/notifications/page.tsx | [minor·후속] `as FormEvent` 캐스팅 제거 가능. 동작영향0 | 후속 |

## 완료 Phase (이력 압축)
- ✅ **Phase 10 정보페이지 박제 5시안 (2026-06-14)** — v2.30 박제. §0 선택sync(`9c8868f`·②③보존). **IU4 Reviews**(평점분포+BG2 개별건수0·`4b55d3a`) **IU2 News**(E1매거진+E2단신 cross-domain4·`4c73dfd`) **IU3 Help+Glossary**(A-Z chip 용어사전 신규·redirect0·`a9e0af8`) **IU1 About**(통계4 캡션+운영진§6 실명0·mock0·`efa113f`) **IA1 AdminNews**(A안=신규라우트 /admin/news/compose·기존 알기자검수 100%보존·알림 보류·`eb84cc7`). 전 시안 0스키마·데이터패칭0·var(--*)토큰만·신규토큰0(재사용)·tester PASS·reviewer APPROVE. PR #679(subin→dev)→#680(dev→main `1d9f125`)
- ✅ **대회 삭제 기능 (2026-06-14, `f2fecc7`)** — Soft(cancelled)/super_admin Hard(?hard=1) cascade 7스텝 트랜잭션(timeout30s)·이름입력 확인모달·super_admin 2차가드. schema0·tester PASS6/6·reviewer APPROVE. PR #675→#676
- ✅ **KO Sprint1 결선중복방지 (2026-06-14, `a9ebaf6`+`bf8978e`)** — KO-1(countKnockoutMatches 결선판정 강화)·KO-2(2개조 자동생성 throw)·KO-3(silent catch 가시화)·KO-9(결선 미생성 자동종료 오판 차단). vitest PASS·1개조 경로 회귀0. *(다른 세션 작업)*
- ✅ **PR-RECORDER-AUDIT (2026-06-12, `a897b22`+HOTFIX)** — recorders adminLog 3지점 + admin_role 칩. apiSuccess snake_case 함정 재발6회
- ✅ **①-b Phase 9C (`cb88c7a`+`8aeb050`+`b759d2d`)** / **③ 대회종료 B안(`ecca28d`+`7d6f89c`)** / **② 대회상세(`a9cb476`)** / ① Phase9 sync(`fb81e53`) / PR-PERM-DISPLAY / PR-MYBDR-SOCIAL / Phase 8C / Phase 1~7

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-14 | **5차 뉴비리그 잘못생성 결선 8건 삭제** (pm) | ✅ 7f28 결선 296~304 중 #301(기록 pbp271·보존) 제외 8건(기록0) 트랜잭션 삭제. matches_count 15→7. 다중가드(id기준·8건초과·사후검증) 통과·임시스크립트 정리 |
| 2026-06-14 | **Phase 10 IU3/IU1/IA1 push+머지** (pm) | ✅ subin push→PR#679(dev)→#680(main `1d9f125`). 전 브랜치 동기화·미푸시0 |
| 2026-06-14 | **Phase 10 IA1 AdminNews(A안) 박제+검증** (dev/tester/reviewer) | ✅ `eb84cc7` 신규라우트 compose·기존검수 보존·알림보류. PASS8/8·APPROVE(min2) |
| 2026-06-14 | **Phase 10 IU1 About 박제+검증** (dev/tester/reviewer) | ✅ `efa113f` 운영진§6 실명0·통계 mock0. PASS7/7·APPROVE(min1) |
| 2026-06-14 | **Phase 10 IU3 Help+Glossary 박제+검증** (dev/tester/reviewer) | ✅ `a9e0af8` A-Z용어사전·redirect0. 7통과+1조건부·APPROVE(min2) |
| 2026-06-14 | **대회삭제 main 머지** (pm) | ✅ hotfix 분리(cherry-pick 대신 파일이전)→PR#675(dev)→#676(main `f2fecc7`) |
| 2026-06-14 | **Phase 10 IU4/IU2 박제+검증** (dev/tester/reviewer) | ✅ `4b55d3a`/`4c73dfd` 평점분포BG2·뉴스 cross-domain. PASS·APPROVE |
| 2026-06-14 | **Phase 10 §0 선택sync** (pm) | ✅ `9c8868f` BDR-current v2.30 Phase10 14파일·②③보존 검증 |
| 2026-06-14 | **대회삭제 기능 구현+검증** (dev/tester/reviewer·되돌림1회) | ✅ Soft/Hard cascade 7스텝. PASS6/6·APPROVE(min2반영) |
| 2026-06-14 | **KO Sprint1 (KO-1/2/3/9)** (다른 세션) | ✅ 결선중복·예선종료 오분류 방지. vitest PASS·main 머지 |
