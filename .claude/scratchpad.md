# 작업 스크래치패드

## 현재 작업
- **요청**: 결선(knockout) 9경기 중복 사고 재발방지안 + 대회생성 시 결선 자동등록 설계 (read-only)
- **상태**: ✅ 설계 완료 — `Dev/knockout-auto-schedule-plan-2026-06-14.md` 산출. PM 검토 후 Sprint 1(KO-1~4) 착수 결재 대기
- **병행 대기**: Phase 10 정보페이지 Claude.ai zip(BDR v2.30) 회신 대기 (수빈)
- **현재 담당**: PM (Sprint 1 착수 결재) / 수빈 (Phase 10 Claude.ai)
- **끼어든 단독 PR**: PR-PERM-DISPLAY 권한/구독 2축 분리 ✅ **main 머지 완료** (#673→#674 `157116c`)
- **Phase 10 다음 액션**: zip 도착 시 → `sync-bdr-current.ps1 -NewVersion v2.30` → Phase 10C Auto Chain 5 PR (IU1~4 + IA1)

## 진행 현황표
| # | 작업 | 상태 |
|---|------|------|
| Phase 10 정보페이지 | About/News/Help/Reviews/AdminNews 5시안 | ⏸ Claude.ai paste 진행 (zip 회신 대기) |
| PR-PERM-DISPLAY | 권한/구독 2축 분리 (역할→구독등급/관리자→운영권한) | ✅ #673→#674(`157116c`) 운영 반영 |
| PR-RECORDER-AUDIT | 기록원 감사로그 + admin_role 가시화 | ✅ #670(`77d014a`)+HOTFIX #672(`3db595c`) 운영 반영 |
| ③ | 대회종료 재구성 박제 (B안) | ✅ #667→#668(`4199d87`) 운영 반영 |
| ①-b | Phase 9C 박제 (9C-1/3/4·9C-2 스킵) | ✅ #667→#668 운영 반영 |
| ②·① | 대회상세 박제 / Phase 9 sync | ✅ #666 / `fb81e53` (이전 세션) |

## 기획설계 (planner-architect)

### 결선 knockout 중복방지 + 자동등록 설계 (2026-06-14, read-only)

🎯 목표: YOUNGMAN GAME 9경기 중복 사고 재발 방지 + 대회 생성 시 결선 자동 placeholder 등록 설계. **코드 0·DB 0·설계만**. 산출 = `Dev/knockout-auto-schedule-plan-2026-06-14.md`

📍 근본원인 코드 위치 (실측):
- 원인1 조 무시: `tournament-seeding.ts:19` calculateLeagueRanking(groupName 미참조) + `:128` buildKnockoutBracket(표준 1vsN 시드) → 같은 조 4강 재대결. NBA seed도 동일.
- 원인2 가드 우회: idempotent 가드 3곳(`:220`/`:349`/nba`:286`) = `round_number IS NOT NULL` count. 6/9 수동 INSERT가 round_number NULL이면 가드 카운트 0 → 재생성 통과. + `POST /bracket:202`·match PATCH`:343` silent catch(중복 인지 실패) + `assignTeamsToKnockout:487`은 가드 자체 없음.

🔗 기존 자산 재활용: buildSlotLabel(group_rank/match_winner) / buildPlaceholderNotes / ADVANCEMENT_REGEX(`division-advancement.ts:23` "A조1위 vs B조2위" 매칭됨·수정불필요) / advanceTournamentPlaceholders(standingsMap "그룹:랭크" 키 호환) / next_match_id 연결.

📋 PR 분해 (2 Sprint):
| 순서 | PR | 담당 | 선행 |
|------|-----|------|------|
| S1-1 | KO-1 countKnockoutMatches 가드 강화(round_number+roundName) | developer | 없음 |
| S1-2 | KO-2 2개조+ 자동생성 throw 차단(groupName distinct≥2) | developer | KO-1 |
| S1-3 | KO-3 silent catch→warning 가시화 | developer | 병렬 |
| S1-4 | KO-4 운영절차 문서(수동 INSERT round_number 의무) | pm | 없음 |
| S2-5 | KO-5 crossSeedPairs PURE+vitest | developer | 없음 |
| S2-6 | KO-6 generateGroupCrossKnockout(신규 seedingMode group_cross) | developer | KO-5 |
| S2-7 | KO-7 route group_cross 분기 | developer | KO-6 |
| S2-8 | KO-8 예선종료 auto-fill = advanceTournamentPlaceholders 단일화 | developer | KO-6/7 |

⚠️ developer 주의사항:
- KO-2/KO-8 회귀게이트: 1개조 full_league_knockout(4차 뉴비리그) groupName distinct=1 → 기존경로 100% 보존 vitest 필수.
- group_cross = opt-in 신규 mode. sequential/nba/dual/강남구 division_rule 경로 영향 0.
- Sprint 1만으로 이번 사고 영구차단(KO-2가 자동생성 막아 수동 크로스 안전). Sprint 2는 편의.
- 정확한 사고경로 확정엔 DB SELECT 1회 필요(round_number 분포) — 이미 운영정리 완료라 audit/백업 의존. 본 설계는 코드 레벨 3경로 분기로 확정.

(이전 완료 Phase는 아래 압축 섹션 참조)

## 구현 기록 (developer)

### 대회 삭제 기능 구현 (2026-06-14)

📝 구현한 기능: 대회 관리 admin 페이지에서 "대회 삭제" 활성화. Soft(취소·복구가능) 기본 / super_admin 만 Hard(완전삭제·복구불가) 옵션. Hard 삭제 시 FK NoAction 체인 cascade 7스텝 명시 삭제.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/tournaments/[id]/route.ts | DELETE Hard 분기 `tournament.delete()` 단독 → cascade 7스텝 트랜잭션(매치 손자 pbp/스탯/라인업 → 매치 → ttp/팀 → 사이트섹션/페이지/사이트 → 운영진/대진버전/종별규칙 → tournament → series 카운터-1). P2003 409 안전망 유지 | 수정 |
| src/app/(admin)/admin/tournaments/page.tsx | getAuthUser+getAdminRoles 로 isSuperAdmin 계산 → content 에 prop 전달 | 수정 |
| src/app/(admin)/admin/tournaments/admin-tournaments-content.tsx | "대회 삭제" disabled 해제→삭제 확인 모달. 이름 정확입력시만 삭제활성/기본 Soft/super_admin Hard 체크박스(?hard=1). fetch DELETE→router.refresh(). 안내문 교체 | 수정 |

💡 tester 참고:
- 테스트 방법: /admin/tournaments → 대회 클릭 → 행정관리 "대회 삭제" → 모달에서 대회명 입력
- 정상 동작: 이름 불일치=삭제버튼 비활성 / Soft=status 'cancelled'(목록 잔존·종료탭) / super_admin Hard 체크=완전삭제(목록 사라짐)
- 주의할 입력: 비-super_admin 은 Hard 체크박스 안 보임. Hard API 직접호출(?hard=1)도 super_admin 아니면 403. 관련 데이터 남은 대회 Hard 시 cascade 정상 삭제(P2003 안 떠야 정상)

⚠️ reviewer 참고:
- cascade 순서/필드명: schema.prisma 재확인 완료 (play_by_plays.tournament_match_id / MatchPlayerStat.tournamentMatchId / MatchLineupConfirmed.matchId / TournamentTeamPlayer.tournamentTeam / site_pages.tournament_sites / site_sections.site_pages / tournament_bracket_versions.tournament_id / TournamentDivisionRule.tournamentId). Cascade FK 자식(match_events/news_photos/site_registrations/tournament_recorders 등)은 자동삭제라 명시 제외
- schema.prisma 변경 0 / /api/v1 변경 0 / tsc --noEmit 통과

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-06-14 | (1) super_admin 판정을 getAdminRoles().roles.includes("super_admin") → isSuperAdmin(auth.session) 헬퍼로 통일(API route.ts와 동일 source, admin_role="super_admin"도 Hard 옵션 노출). (2) Hard 삭제 $transaction 에 { timeout: 30000 } 추가 | page.tsx, route.ts | reviewer minor 2건: UI/API super_admin 판정 불일치 + 대량 데이터 트랜잭션 기본 타임아웃(5s) 초과 위험 |

## 테스트 결과 (tester)

### 대회 삭제 기능 검증 (2026-06-14, 정적+tsc / 실 Hard 삭제 미실행)

📊 종합: 6개 항목 전부 PASS (실DB Hard 삭제는 운영안전상 미실행)

| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| tsc --noEmit | ✅ PASS | EXIT_CODE=0, 에러 0 |
| cascade 순서/delegate/필드명 schema 대조 | ✅ PASS | 12개 모델 전수 대조 일치 (아래 상세) |
| Hard(?hard=1) super_admin only 가드 | ✅ PASS | route.ts:269 `!isSuperAdmin(auth.session)` → 403. requireTournamentAdmin 통과 후 추가 가드 |
| 7스텝 단일 $transaction + series 카운터 | ✅ PASS | route.ts:280~336 STEP1~7 모두 tx 내. 카운터 decrement(STEP7)도 tx 내 |
| 프론트(이름검증/super_admin조건/refresh) | ✅ PASS | confirmName 정확일치만 활성(:458) / isSuperAdmin && Hard체크박스(:532) / 성공시 router.refresh()(:160) |
| Soft 삭제 회귀(status=cancelled) | ✅ PASS | route.ts:367~392 무변경. cancelled 멱등처리(:369) |

✅ cascade 필드명 schema.prisma 전수 대조 (전부 일치):
- play_by_plays.tournament_match_id ✓ (:1849) / matchPlayerStat.tournamentMatchId @map(tournament_match_id) ✓ (:788) / matchLineupConfirmed.matchId @map(match_id) ✓ (:3314)
- tournamentMatch.tournamentId ✓ / tournamentTeamPlayer relation `tournamentTeam`+tournamentId ✓ (:616) / tournamentTeam.tournamentId ✓ (:554)
- site_sections relation `site_pages` ✓ (:1950) / site_pages relation `tournament_sites` ✓ (:1927) / tournamentSite.tournamentId ✓ (:839)
- tournamentAdminMember.tournamentId ✓ (:378) / tournament_bracket_versions.tournament_id ✓ (:769) / tournamentDivisionRule.tournamentId ✓ (:3380) / tournament_series.tournaments_count ✓ (:2072)
- 삭제 순서 = 손자(pbp/스탯/라인업)→매치→ttp→팀→섹션→페이지→사이트→운영진/버전/규칙→tournament→series카운터. NoAction FK 역순 위상정렬 정합.

🟢 발견사항(동작영향 0·참고):
- [경미] 권한 source 비대칭: 프론트 isSuperAdmin=getAdminRoles().roles(DB) / API=isSuperAdmin(session)(JWT role·admin_role). 결론 동일하나 source 상이 — API가 최종 가드라 보안 영향 0. UI에서 체크박스 숨겨도 비-super_admin ?hard=1 직접 호출 시 403 차단(이중 안전).
- [정상] P2003 catch는 msg 문자열 매칭("Foreign key"/"P2003")으로 409 변환 — Prisma 에러 메시지 의존이나 안전망 용도라 무해.
- [정상] adminLog resourceId=undefined (UUID↔BigInt 불일치로 의도적 생략, description에 id 박제).

★ 실DB Hard 삭제 미실행 — 운영 단일 DB. 실검증 필요시 "더미 대회 생성→Hard 삭제→재생성0 확인" 절차 제안(미실행).

## 리뷰 결과 (reviewer)

### 대회 삭제 기능 리뷰 (2026-06-14)

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 2 — 모두 후속·동작영향 0)

✅ 잘된 점:
- **cascade 7스텝 완전 정합**: architecture.md "Tournament Hard 삭제 cascade 의존성 그래프"와 1:1 대조 완료. NoAction 직접 자식 6종(admin_members/teams/matches/bracket_versions/sites/division_rules) + NoAction 손자(pbp/스탯/라인업·ttp·site_pages/sections) 전부 역순 명시 삭제. Cascade FK(site_registrations/tournament_recorders/match_events/match_player_jersey/news_photos 등)는 명시 제외 — schema 실측 검증 결과 정확(match_player_jersey = match·ttp 양쪽 onDelete:Cascade라 매치/ttp 삭제 시 DB 자동 정리). **누락·과잉 명시 0건**.
- **트랜잭션 안전**: 전체 $transaction 원자 처리 — 부분 실패 시 전체 롤백. matchIds 빈 배열이어도 deleteMany({ in: [] })는 0건 정상 동작(에러 없음). P2003/FK 위반 → 409 안전망 유지.
- **권한 가드 견고**: Hard는 requireTournamentAdmin(organizer/TAM 통과) **위에** isSuperAdmin(session) 2차 가드 추가 → ?hard=1 직접 호출도 비-super_admin 403. IDOR 방어 유지(requireTournamentAdmin가 대회 소유/권한 검증). isSuperAdmin은 JWT role+DB admin_role 양면 평가로 stale 함정 회피.
- **응답 키 규칙 준수**: apiSuccess/apiError 일관 사용. 프론트 에러 핸들링도 `body?.error?.message` (apiError 형태) 정확 접근 — snake_case 변환 함정 회피.
- **프론트 검증 견고**: 대회명 정확 일치(confirmName.trim() === name)해야 삭제 버튼 활성 / deleting 플래그로 중복 클릭·모달 닫기 차단 / 성공·실패·네트워크오류 3분기 핸들링 / hardMode 체크박스는 isSuperAdmin일 때만 렌더(API 가드와 이중 안전).
- **디자인 규칙 준수**: var(--color-*) 토큰만 사용(하드코딩 hex는 #fff 1곳뿐 — 기존 admin 버튼 패턴 답습으로 허용 범위) / Material Symbols Outlined(`warning`) / AdminDetailModal 재사용으로 기존 admin 모달 패턴 일관.

🔴 필수 수정: 없음

🟡 권장 수정(후속·동작영향 0):
- [page.tsx L77-82 ↔ is-super-admin.ts L49] super_admin 판정 기준 **불일치**: 프론트(getAdminRoles.superAdmin)는 JWT `role`만 평가 / API(isSuperAdmin)는 `role || admin_role` 평가. → admin_role="super_admin"(JWT role은 일반)인 사용자는 UI에서 Hard 체크박스를 못 봄(API는 허용). **보안 영향 0**(UI가 더 엄격 / API 가드 견고 = 우회 불가), 순수 UX 불일치. 후속: page.tsx도 isSuperAdmin(session) 헬퍼로 통일 권장.
- [route.ts L280 $transaction] 대량 데이터 대회 Hard 삭제 시 **기본 타임아웃(5초)** 초과 가능성(매치/pbp 수천 건). 현재 운영 규모(대회당 매치 수십~수백)에선 무해하나, 후속으로 `{ timeout: 30000 }` 옵션 추가 검토(approve-join-requests.ts가 timeout 60s 선례). 초과 시에도 롤백되므로 데이터 안전성은 보장.

🟡 권장 수정(후속·동작영향 0, 필수 수정 없음):
- [recorders/route.ts L133] POST `tournamentForLog` 조회가 existing 분기 전 무조건 실행 — 409(이미 등록) 케이스는 adminLog 미실행이라 SELECT 1회 낭비. 드문 경로+1쿼리라 무해. 후속 미세 최적화.
- [recorders/route.ts L234] DELETE 대회명을 update 후 별도 findUnique. POST는 분기 전 조회 — 위치 비일관(minor). 동작/안전 영향 0.

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| reviewer | admin/tournaments/page.tsx (L77) | [minor·후속] super_admin 판정 UI(role만)≠API(role\|\|admin_role) 불일치 → admin_role super는 Hard 체크박스 미노출(보안영향0·UX만). isSuperAdmin(session) 헬퍼로 통일 권장 | ✅ 완료(2026-06-14) |
| reviewer | tournaments/[id]/route.ts (L280) | [minor·후속] Hard 삭제 $transaction 기본 타임아웃(5s) — 대량 데이터 대회 초과 가능. timeout:30000 옵션 검토(초과해도 롤백=안전) | ✅ 완료(2026-06-14) |
| reviewer | tournament-completed-bracket.tsx (L274 qual 정렬) | [minor·후속] 조내 정렬 승수만 — 승점룰(gnba) 대회 미세 순위차 가능. 조별 동일경기수면 무해 | 후속 검토 |
| reviewer | admin/notifications/page.tsx | [minor·후속] `as FormEvent` 단언 안전하나 handleSubmit 시그니처 완화로 캐스팅 제거 가능. 동작 영향 0 | 후속 검토 |

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
| 2026-06-14 | **대회 삭제 기능 구현** (developer) | ✅ 3파일. DELETE Hard cascade 7스텝(FK NoAction 체인 명시삭제)+P2003 409유지. admin page isSuperAdmin prop. content 삭제확인모달(이름입력검증/Soft기본/super_admin Hard?hard=1). schema/v1 변경0·tsc0. tester 대기 |
| 2026-06-14 | **결선 knockout 중복방지+자동등록 설계** (planner) | ✅ read-only 설계 `Dev/knockout-auto-schedule-plan-2026-06-14.md`. 근본원인=조무시 시드(seeding.ts:19/:128)+가드 round_number단독(우회). PR 8개 2 Sprint(S1 가드강화·2개조 throw차단 / S2 group_cross generator). 코드0·DB0. decisions+errors 기록 |
| 2026-06-13 | **PR-PERM-DISPLAY 권한/구독 2축 분리** (pm) | ✅ `e98e611` admin-users-table 칼럼 라벨 역할→구독등급·관리자→운영권한(슈퍼관리자 err칩)·page 부제 4→MAX_SUPER_ADMINS(10). 옵션B·DB0·표시로직만·+12/-6·tsc0. 역박제skip·decisions+1. §0 lock 확인(transient·해소) |
| 2026-06-13 | **Phase 10 정보페이지 Claude.ai paste 준비 + 세션 정리** (pm) | ✅ 첨부4건 존재확인 + paste 메시지본체 추출. Claude.ai 1차 "첨부 미도착" 차단 → (A)실데이터 박제 결재 / drag-drop 4건 + 회신문구 제공. ③·9C·RECORDER 전부 머지 확인(미push0). scratchpad 정리 |
| 2026-06-13 | **PR-RECORDER-AUDIT 파트0 HOTFIX 기록원목록 snake_case 표시버그** (pm) | ✅ `e3d757e` tournament-admin recorders/page.tsx camelCase→snake_case 3곳(type/filter/제거). apiSuccess 변환함정 재발6회. tsc0·응답/body/route 무변경. +7/-5. errors+1 |
| 2026-06-12 | **PR-RECORDER-AUDIT 감사로그+admin_role 가시화** (dev/tester/reviewer/pm) | ✅ `a897b22`→#669→#670 main머지. recorders adminLog 3지점 + admin_role 칩. PASS5/5·APPROVE·lessons+1. +92/-7 |
| 2026-06-12 | **①-b Phase 9C 박제+검증+커밋** (developer/tester/reviewer/pm) | ✅ 9C-1/3/4 박제(9C-2 스킵)·tsc0·tester PASS·reviewer APPROVE·라우트별 3커밋(`cb88c7a`/`8aeb050`/`b759d2d`). 팀장 전송차단·mock유지·DB/api/role 0변경 |
| 2026-06-12 | **③ 대회종료 B안 박제 커밋** (pm) | ✅ `ecca28d`(feat 8파일 +1239/-53)+`7d6f89c`(역박제)+`4dbc833`(회고) |
| 2026-06-12 | **③ NBA 승자판정 견고화+재검증** (developer/tester·되돌림1회) | ✅ teamId 직접비교+점수폴백·major1 해소·진행중뷰 회귀0 |
| 2026-06-10 | **③ 대회종료 B안 박제+검증** (developer/tester/reviewer) | ✅ 신규5+수정3+역박제2·진행중뷰 회귀게이트 통과·PASS·APPROVE(major1→해소) |
| 2026-06-10 | **③ 대회종료 B안 설계보강** (planner) | ✅ 격리전략 혼합·~+1700LOC. TournamentTabs status무관 재사용·NBA/예선 신규복제 |
