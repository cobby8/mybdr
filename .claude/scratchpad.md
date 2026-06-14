# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 10 정보페이지 박제 (v2.30) — 5시안 전부 완료
- **상태**: ✅ **완료·main 운영 반영** (IU4/IU2/IU3/IU1/IA1 + 대회삭제 + KO Sprint1 전부 머지)
- **현재 담당**: 대기 (다음 작업 요청 대기)

## 진행 현황표
| # | 작업 | 상태 |
|---|------|------|
| PR-MOCK-TO-REAL ②③ | calendar 실연결(tournament일정·court_events0행) + about 통계4 실값 | 🟡 구현완료·tester대기(미커밋) |
| Phase 10 정보페이지 | Reviews/News/Help+Glossary/About/AdminNews 5시안 | ✅ main 반영(#679→#680 + 선반영) |
| 대회 삭제 기능 | Soft/Hard + cascade 7스텝 | ✅ main(#675→#676 `f2fecc7`) |
| KO Sprint1 | 결선중복방지 KO-1/2/3/9 | ✅ main(`a9ebaf6`+`bf8978e`) |
| PR-PERM-DISPLAY / RECORDER-AUDIT / ③ / 9C / ②·① | 이전 작업 | ✅ 운영 반영 (이력 압축) |

## 기획설계 (planner-architect)
(완료 — 완료 Phase 압축)

### PR-MOCK-TO-REAL ① /stats 실데이터 연결 설계 (2026-06-14, read-only · 코드·DB 변경 0)
- **목표**: /stats 준비중 빈상태 → 시안 Stats.jsx 대시보드 실데이터 복원. 설계서 `Dev/stats-realdata-bake-plan-2026-06-14.md`
- **★★populated 실측 반전(운영 SELECT 영향0·임시스크립트 정리완료)**: census "3테이블 존재" 맞으나 **UserSeasonStat=0행 / ShotZoneStat=0행 / MatchPlayerStat=2375행**. UserSeasonStat·ShotZoneStat은 cron/배치 미동작(schema 주석 "Phase 13+ 예정")=빈껍데기 → **직접 SELECT 시 영구 빈화면**(mock보다 나쁨). 의뢰 명세 "TOTALS=UserSeasonStat 직접매핑"은 함정.
- **★채택 전략**: **MatchPlayerStat 단일source + JS 시즌가공**(decisions[05-09] Q7=A 채택/Q7=D UserSeasonStat 거부 "cron미동작" 답습 = 공개프로필 동일선례). 본인경로 User.id→ttp.userId→MatchPlayerStat. 시즌경계=매치 scheduledAt 연도(실측 NULL 0/7).
- **★재사용자산**: `getPlayerStats(userId)`(user.ts L252)가 70%커버(aggregate _avg+winRate $queryRaw+officialMatchNestedFilter). 보강필요=시즌필터+FG/3P/FT%(합산made/att)+게임로그+클럽순위. **공유함수라 미변경→신규헬퍼 `my-season-stats.ts` 분리=회귀격리**. `stat-leaders.ts`(0스키마 groupBy) 동형.
- **섹션매핑(연결/hide)**: KPI8칸=✅연결(레이팅만 hide/대체) / TREND=✅(게임로그 득점시계열) / GAME_LOG=✅(매치당1행) / 클럽순위RANKINGS=🟡부분(팀동료대비 득점/어시/리바/3점/자유투만·부족시 row생략) / **ZONES=❌hide**(ShotZoneStat0행+MPS존정보무·억지매핑금지) / **포지션·레벨·구장·시간대SPLIT=❌hide**
- **빈상태(mock❌)**: 비로그인→/login카드 / ttp0→출전이력없음 / 선택시즌0건→"이번 시즌 기록 없음" / ZONES항상 준비중배지. 시안 mock(14.2/장충픽업/trend[]) 전량삭제
- **server/client**: page.tsx[server] getWebSession+getMySeasonStats+빈상태분기 → `_v2/stats-client.tsx`[client] 시즌셀렉터·3탭·SVG. **시즌전환=옵션A 클라필터(page가 전시즌 선계산 prop·신규api라우트0=Stop준수)**. camelCase 일관(apiSuccess미경유→snake혼동 해당없음)
- **실행7단계**: ①헬퍼 ②page.tsx ③client ④CSS(.st-* postcss검증) ⑤tester+reviewer병렬 ⑥커밋. 1~4순차·5병렬·**DB UPDATE/스키마 0**(전부 read-only)
- **규모/위험**: 헬퍼+180~240 / page+60-50 / client+260~340 / css+90~130. 위험=헬퍼·page·css 낮음·client 중. getPlayerStats diff0(회귀격리)·schema0·라우트0
- **PM 확인 3건**: ①강조색 시안 --accent(빨강) 그대로 vs --cafe-blue치환(권장·06-10함정·룰일관) ②KPI 레이팅칸=avg_rating(0행)/PER(억지) 불가→"—"표기 or 7칸 or evaluation_rating대체 ③시즌전환 옵션A(권장·라우트0) 확정

### 순위표 집계 근본 수정 설계 (2026-06-14, read-only · 코드·DB 변경 0)
- **설계서**: `Dev/standings-aggregation-root-fix-plan-2026-06-14.md`
- **목표**: update-standings.ts B안(결승/KO 제외 + 조별격리) — full_league_knockout 결승 혼입 + stale 근본차단
- **★진단 확정(운영 SELECT 실측·영향0·스크립트정리완료)**: 5차뉴비리그(7f287820) format=full_league_knockout·division_rule=0·settings={}. 결승 #301(rn="결승"·좌표NULL·g=NULL)이 오름 예선에 혼입→오름 **W3(실제W2)** + #291(하늘공작단승) stale→하늘 **W0(실제W1)**. 시뮬레이션 정확값 확인
- **★★회귀분석(format별 실측)**: 결승제외 영향=**6대회 전부 full_league_knockout**(모두 현재 결승/4강이 예선혼입 버그상태→수정=개선): 6차스타터스#274/2회W대학#260/10회YOUNGMAN#281+282+283/5차뉴비#301/4차뉴비(결승미완=영향0). 조별격리 영향=**0대회**(조간예선매치 전무→안전망역할). round_robin28/league4/single12=영향0
- **★dual회귀0(몰텐배 실측)**: 팀standings 전부 W0L0PF0PA0=dual은 standings 미사용(progressDualMatch+매치group_name으로 진행). 팀groupName=NULL. completed27건 전부 bracket좌표→좌표제외돼도 무해. **회귀0**
- **★강남구회귀0**: division_code 격리 이미작동·수정은 그 분기 안쪽에 격리/결승제외만 추가
- **수정안(update-standings.ts 1파일·+20~30LOC)**: ①결승제외 강화=isPrelimMatch 헬퍼(순위regex OR KNOCKOUT regex OR round_number+bracket_position 좌표) — completedMatches/drawMatches 양쪽 적용·**SELECT에 round_number/bracket_position 추가필요** ②조별격리=합산loop서 매치 양팀 groupName 둘다NOT NULL이고 다르면 skip·**SELECT에 homeTeam/awayTeam.groupName 추가필요**. 폴백=groupName NULL이면 격리안함(전체1조=기존동작·회귀0)
- **재박제(B권장)**: 전용스크립트 scripts/_temp/recalc-newbie5.ts — tournamentId한정·6팀 SET UPDATE·사전/사후 SELECT검증. **DB UPDATE는 PM승인후**. 예상=A조 스나이퍼1-1/하늘1-1/Gots1-1·B조 오름2-0/스위치1-1/그로우업0-2
- **#301 좌표부여**: round_number=**1**·bracket_position=**0**·bracket_level=0 → buildRoundGroups 1라운드1매치 단일트리 표시. **반드시 수정①머지+재박제 후 실행**(좌표제외 가드가 standings 재혼입 차단·이중안전). 매치1행 UPDATE·PM승인후
- **실행계획7단계**: ①update-standings수정(dev) ②vitest(tester) ③재박제스크립트작성(dev) ④[PM승인]재박제실행 ⑤#301좌표부여[PM승인] ⑥공개탭육안 ⑦정리+decisions. 1~2코드(안전)/3~5 DB(승인게이트2곳). ②③병렬가능
- **위험/규모**: 코드=낮음(폴백견고·영향6대회 모두버그상태) / DB재박제=중(6행·tournamentId한정·승인게이트) / dual·강남구=0
- **PM확인3건**: ①결승제외 3중OR 채택 ②조별격리 채택(단독영향0·안전망) ③재박제 5차만 vs 6대회일괄

### Phase 12 Batch B 박제 설계 (2026-06-14, read-only · 코드·DB 변경 0)
- **목표**: v2.31 Phase 12 Batch B(DB연결 7화면 ST1/CA1/SV1/SE1/TV1/CV1/SC1) 데이터 실측+박제 설계
- **설계서**: `Dev/phase12-batchB-bake-plan-2026-06-14.md`
- **★SE1 라우트 결론**: `[slug]` 존재(`[id]`아님)·**이미 완전 박제됨**(tournament_series+tournaments 회차 실데이터 와이어/4탭/누적순위=DB미지원 폴백). 신규신설0·신규박제도 사실상 불필요 → **옵션A(시각 미세정합·데이터 diff0) or SKIP** PM결정
- **★데이터출처 실측(운영 SELECT 0·schema grep+page.tsx 정독)**: scrim_*/court_submission*/team_invit* **부재**(grep0) / board_favorites L1015·user_favorite_courts L2097·match_player_stats L786 **실재**
- **전략 분기**: ST1/CA1/TV1/SC1=**준비중 빈상태**(더미 전량삭제·mock❌) / **SV1=★이미 DB연결**(board_favorites+user_favorite_courts 실조회·인증·IDOR 완비 → page.tsx 데이터패칭 100%보존·saved-content.tsx 시각만 v2.31·미지원탭 빈상태) / CV1=**정적 폼 박제**(court_submissions 부재→제출 noop·SF1/RI1 동형) / SE1=시각정합 or SKIP
- **AppNav active**(§1·pathname 자동·prop조작0): ST1=rank/CA1=more/SV1=more/SE1=tn/TV1=team/CV1=court/SC1=games
- **CSS 이식**: .ex-* 셸은 Batch A 완료(globals L6394~). B 추가이식 **필수 = .sv-*(SV1)+.fm-*(CV1)**(+옵션A시 .se-*) / 빈상태4화면=.ex-empty만 → 화면별토큰 보류가능. 치환표준 Batch A 답습(--r-*→--radius-*/#8B5A0F→--warn/hero hex→--bdr-navy/#fff→--ink-on-brand/9999→50%)
- **순서**: ①CSS이식 ②빈상태4(병렬) ③CV1폼 ④SV1(데이터보존) ⑤SE1(옵션A) → ⑥tester+reviewer. 빈상태4=옵션B(tester만) / SV1·CV1·SE1=reviewer병렬
- **규모/위험**: 빈상태4=낮음(-450~750LOC) / **SV1=중**(인증·IDOR·데이터패칭 회귀금지) / CV1·SE1=낮음
- **PM 확인 2건**: ①SE1 옵션A vs SKIP(권장 SKIP/A) ②TV1 빈상태 vs CV1 정적폼 비대칭 처리 승인(TV1=가짜초대 mock위험→빈상태 / CV1=폼입력 noop=SF1동형→폼박제)

### Phase 12 Batch A 박제 설계 (2026-06-14, read-only · 코드·DB 변경 0)
- **목표**: v2.31 Phase 11/12 Batch A 정적/저위험 6화면(RI1/SF1/CC1/GL1/SH1/AW1) 박제 설계
- **설계서**: `Dev/phase12-batchA-bake-plan-2026-06-14.md` (화면별 데이터출처·변경명세·토큰매핑·회귀·규모/위험 + AppNav active + Stop conditions 8)
- **★운영 SELECT 1회 실측(영향 0)**: GL1 news_photo 1건(is_hero 0)·앨범0 / CC1 TTP.role coach 4(=대회 코칭스태프≠레슨코치)·player 1018 / AW1 mvp public 0·champion public 0·active series 3·mps 2375
- **데이터출처 확정**: RI1 정적(0스키마) / SF1 정적안전가이드(현 4탭더미→시안 6카드 교체) / CC1·GL1·SH1 **준비중 빈상태(ex-empty·mock❌)** / AW1 **기존 실데이터 서버쿼리 100%보존**(awards-content.tsx만 v2.31 시각교체·page.tsx diff 0 의무)
- **AppNav active**: RI1/SF1/CC1/GL1/SH1=more / AW1=rankings (pathname 자동판정·page active prop 조작금지)
- **토큰매핑**: 시안 --r-lg/md/sm/xs→--radius-card/chip / 하드코딩 #8B5A0F·#F4C76C·#1A1E27→--warn·--bdr-navy / 이모지(🛒♡★▶📷등)→Material Symbols / pill99→--radius-chip. 강조=--cafe-blue(빨강은 CTA·MVP face 의도색만, errors.md61)
- **순서**: ①RI1+SF1 ②CC1+GL1+SH1 ③AW1(page.tsx보존) 전부 병렬가능 → ④tester+reviewer. 준비중5화면=옵션B(tester만) 가능 / AW1만 reviewer 병렬
- **규모/위험**: 5화면 낮음(더미 대량삭제 -300~560 LOC) / AW1 中(실데이터 와이어·best5/스틸왕/매너상 DTO없으면 준비중·mock금지)
- **PM 확인**: SF1 — 현 차단/신고 4탭(전부 더미)을 시안 정적 안전가이드로 교체 = 기능손실 0(더미였음) 진행 여부

### PR-LINEUP-V2 사전 라인업 앱정합 박제 설계 (2026-06-14, read-only)
- **목표**: 웹 2-state(출전+주전)→앱 bdr_stat_v3 roster_confirm 3-state(선발/벤치/제외)+주장(C)+벤치캡7+정원12+포지션제거
- **설계서**: `Dev/lineup-v2-bake-plan-2026-06-14.md` (시안6상태·단계명세·회귀가드R1~R11·schema diff·role결정)
- **[1] 스키마**: `MatchLineupConfirmed`+`captainTtpId BigInt? @map("captain_ttp_id")`. diff실측=`ALTER TABLE match_lineup_confirmed ADD COLUMN captain_ttp_id BIGINT;`(nullable ADD-only 무중단·현 schema↔DB empty diff확인). push는 사용자승인후
- **[2] API**: lineup/route.ts POST add-only — body+`captain?` / 신규검증 벤치캡≤7·정원≤12·주장∈(starters∪subs)+소속+is_active. **기존검증(starters5/중복0/ttp무결성/status가드) 전부 유지**. serializeLineup+captainTtpId(GET/page select+1). ★apiSuccess snake→프론트 `captain_ttp_id`(page서버prisma는 camel)
- **[3] UI**: _components 3파일 재작성(form=roles맵+captain+undo스택 / ttp-row=행순환+C버튼+포지션제거 / page=select+prop+1). substitutes=벤치 재해석(컬럼불변). 데이터패칭 prop 보존. 토큰치환표준(--r-md→--radius-card / --accent-hair→--accent-soft / --err→--color-error). 선발·주장=--accent(의도된빨강·HANDOFF확정)
- **[4]** BDR-current additive add
- **★role 실측**: player 1017 / coach 4 / **manager 0건** → manager 분기 불필요. coach만 코칭스태프바 분리(head/asst 세분 DB없음→coach칩 나열)
- **회귀**: API add-only=하위호환100%(captain optional). 기존 captain=NULL row 정상로드(R6). 규모 [1]~2 [2]~+70 [3]~+450/-300 [4]4파일. 위험 [1]0 [2]낮음 [3]중
- **PM 확인필요**: 주장 미지정 시 확정 차단여부(시안=warn만, 권장=필수)

## 구현 기록 (developer)
(완료 — 완료 Phase 압축)

### PR-MOCK-TO-REAL ②③ calendar+about (2026-06-14)
📝 구현: ②/calendar 준비중 빈상태 → 시안 .cal-* 달력 복원 + 실데이터 연결 / ③/about 통계4 mock → prisma.count() 실값. **count 실측 선행**(운영 read-only 임시스크립트 → 즉시 삭제): court_events=**0행**·court_event_players=0 / ttp.userId NOT NULL=357(344유저) / tournament startDate NOT NULL=60 / users **660**·teams **105**·tournaments **61**·court_infos **672**·courts **0**.

| 파일 | 변경 | LOC | 실연결 소스 | 신규/수정 |
|------|------|-----|-----------|----------|
| `src/app/(web)/about/page.tsx` | server 전환(async). 통계4 mock(48,000+/320+/1,240) → getAboutStats() = user/team/tournament count 실값(병렬). "20년"=정적유지. 캡션 "운영시점연동"→"실시간 집계". **운영진/가치/파트너/Hero/CTA/FAQ diff 0**(통계 영역만 격리) | +41/-35 | user.count/team.count/tournament.count | 수정 |
| `src/app/(web)/calendar/page.tsx` | server component. getWebSession 본인식별. 비로그인→로그인카드 / tournament일정(ttp.userId=나→tournamentTeam→Tournament name·startDate) 실연결 + court_events(organizer OR 참여, 현재0행=빈배열·가드만유지). TODAY=new Date()·표시월=현재월. 월그리드+다가오는일정. 일정0건→"예정된 일정이 없습니다"(더미❌) | +271/-? | tournamentTeamPlayer→Tournament / court_events(0행) | 수정 |
| `src/app/globals.css` | `.cal-*` 22셀렉터 이식(파일끝 append). 토큰치환 --r-sm/--r-xs→--radius-chip. **이벤트 의미색 3종(game=blue/tn=red/court=ok) 시안유지** / **is-today 강조테두리만 --accent→--cafe-blue** 치환. 720분기 1열 | +43 | — | 수정 |

핵심:
- **court_events 0행 분기**: 실측으로 빈껍데기 확인 → 코드 가드(organizer OR court_event_players 참여)는 유지하되 현재 표시는 tournament 일정 위주. mock 복원 0.
- **about 통계 격리**: git diff 운영진(기획팀~사업팀)/ab-team/ab-guard/ab-make/파트너(NIKE 등)/info-hero/ab-cta 변경 라인 0 실측. "20년 역사"·"since 2006" 정적 카피 유지(사용자 결정 §6).
- **강조색**: calendar is-today = cafe-blue(errors 06-10 빨강 폴백 함정 회피). 이벤트 종류색·일요일 dow(--accent)는 시안 의미색.

💡 tester 참고:
- /calendar: 로그인 + 본인이 선수로 등록된 대회(startDate가 이번 달)가 있으면 달력 셀+사이드바에 'tn'(빨강) 표시. court_events 0행이라 'game'/'court'는 안 나옴(정상). 비로그인→로그인 카드. 대회 없는 유저→"예정된 일정이 없습니다". TODAY 셀 = cafe-blue 테두리.
- /about: 통계4 = 20년/멤버 660/팀 105/대회 61(실값·콤마). 운영진 6팀 라벨·실명 0·파트너 8·Hero·CTA·FAQ 시안 그대로.
- 주의입력: 같은 대회 ttp 다중 = tournamentId dedupe(1건). startDate가 다른 월이면 미표시. 표시월 외 일정은 사이드바(다가오는)에도 미포함(현재 월 한정).

⚠️ reviewer 참고:
- court_events 관계 경로 `teams.players.user_id`(court_event_teams→court_event_players) — 0행이라 실행 안 되나 schema 정합 확인 요망.
- about page.tsx: 통계 영역 외 diff 0(운영진 §6 보존). prisma camelCase 직접(apiSuccess 미경유 = snake 무관).
- CSS postcss walkRules .cal-* 33룰 인식(`*/` 조기종료 0). is-today=cafe-blue / 이벤트 의미색 3종 시안유지. 폐기토큰(--r-sm/--r-xs/--err)/9999/lucide/하드코딩hex 0(매칭은 주석텍스트만).
- 신규 스키마/컬럼 0 / mock 복원 0 / api·v1·신규라우트 0 / 임시 count 스크립트 삭제 완료. tsc --noEmit EXIT=0.

### PR-MOCK-TO-REAL ① stats (2026-06-14)
📝 구현: /stats 준비중 빈상태 → 시안 대시보드 복원 + 실데이터 연결. MatchPlayerStat(2375행) 단일 source + JS 시즌 가공(UserSeasonStat·ShotZoneStat 0행 우회). getPlayerStats 미변경(신규 헬퍼 분리 = 회귀 격리).

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/lib/stats/my-season-stats.ts` | 본인 시즌 집계 헬퍼(TOTALS·승패·GAME_LOG·TREND·클럽순위, read-only) | 신규 (+419 LOC) |
| `src/app/(web)/stats/page.tsx` | server 재작성(session→헬퍼→빈상태 4분기→옵션A 시즌 선계산 prop) | 수정 (+166/-29) |
| `src/app/(web)/stats/_v2/stats-client.tsx` | client 뷰(시즌셀렉터·3탭·KPI·TREND SVG·클럽순위·GAME_LOG·ZONES준비중) | 신규 (+357 LOC) |
| `src/app/globals.css` | `.st-*` 이식(토큰치환·강조 cafe-blue·파일 끝 append) | 수정 (+84) |

**연결 섹션**: KPI 7칸(PPG/APG/RPG/SPG/FG%/3P%/FT%) + TREND(경기별 득점) + GAME_LOG(최근 12) + 클럽순위(팀동료 대비 득점/어시/리바/3점/자유투, rows0→카드 hide).
**hide 섹션**: ZONES(슈팅존 항상 준비중) + 포지션/구장/시간대 SPLIT(미구현).
**빈상태 4종**: 비로그인(lock+/login) / ttp0(sports_basketball+/tournaments) / 시즌0건("이번 시즌 기록이 아직 없습니다") / ZONES(준비중).
**강조색**: `var(--cafe-blue)`(KPI값·TREND선/면적/포인트·클럽순위 상위3·로그 20+득점). 승/패 badge만 의미색(ex-badge--ok/--red 기존). 레이팅 칸="—"(--dim, avg_rating 0행 대체 안 함).
**시즌전환**: 옵션A(page 전 시즌 선계산 + 클라 useState 필터, 라우트/API 0).

💡 tester 참고:
- 테스트: userId=2837 계정 = 2026 시즌 7경기 PPG 3.1(실측). 시즌 칩 "2026"+"커리어" 노출, 탭 3개 전환, ZONES 준비중 빈상태.
- 비로그인 = 로그인 카드 / ttp0 user = 출전기록 카드 / FT% 등 att0 = "-"(0% 아님).
- 정상: KPI 8칸(7실값+레이팅 "—"), 득점추이 SVG cafe-blue, 경기로그 W/L badge.
- 주의: winner_team_id NULL 매치 = 결과 "-" / 클럽 동료<2명 = 클럽순위 카드 hide.

⚠️ reviewer 참고:
- getPlayerStats(user.ts) git diff 0 실측 완료(회귀 격리).
- 0스키마/라우트0/api0 — 전부 read-only prisma 직접(camelCase, apiSuccess 미경유 = snake 혼동 무관).
- 강조색 cafe-blue(errors 06-10 폴백함정 회피, 시안 --accent 빨강 미사용). 기존 .ex-tab.is-on(--accent)은 Batch B 동작중 코드라 미변경.
- CSS `.st-*` postcss walkRules 14셀렉터 OK(errors 06-14 `*/` 조기종료 0, 주석 구분자 쉼표).
- tsc --noEmit 통과 / 하드코딩hex·lucide·9999 0.

### 순위표 집계 근본 수정 (2026-06-14) — PR-STANDINGS-ROOT-FIX
📝 구현: full_league_knockout 결승/KO 매치가 예선 standings 에 혼입되는 근본 차단 + 조별 격리. update-standings.ts **1파일만** 수정(멀티세션·다른 파일 미접촉). 재박제/좌표 스크립트는 미접촉(PM 다음 단계).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/tournaments/update-standings.ts` | ①`KNOCKOUT_ROUND_REGEX`+`RANKING_ROUND_REGEX` 상수 추가 ②`isPrelimMatch()` 헬퍼 신규(3중 OR 가드) ③completed/draw SELECT 확장(round_number/bracket_position/homeTeam.groupName/awayTeam.groupName) ④`/순위/` 단일필터→`isPrelimMatch` 흡수(2곳) ⑤합산 loop 양쪽(completed/draw)에 조별 격리 가드 삽입 | 수정 |

핵심 변경:
- **isPrelimMatch 3중 OR**(하나라도 참=예선아님=제외): ①roundName "순위" 포함(기존) ②roundName KO 라운드(결승/준결승/n강/n위전/n·m위) ③`round_number != null && bracket_position != null`(브래킷 좌표=KO 트리). ★느슨한 비교(`!= null`)로 undefined+null 둘 다 "좌표없음" 폴백.
- **조별 격리**: 합산 loop서 `hg=homeTeam.groupName`·`ag=awayTeam.groupName` 둘 다 NOT NULL이고 hg!==ag면 `continue`(skip). ★한쪽이라도 NULL이면 격리 안 함(`?? null` 폴백 → 전체 1조 = 기존 동작 = 회귀 0).

회귀 0 보장:
- groupName NULL 폴백 / divisionCode 분기(matchesWhere) 미접촉 / 시그니처·호출부 변경 0 / schema 0 / api/v1 0.
- 기존 `/순위/` 필터 동작은 isPrelimMatch ①로 그대로 흡수(동작 동일).

💡 tester 참고:
- tsc --noEmit EXIT=0. vitest update-standings 5/5 + standings-points 25/25 통과. tournaments 전체+match-sync 18파일/332테스트 회귀 0.
- 정상: full_league_knockout 대회 → 결승/n강 매치가 예선 순위에서 제외됨. 조별 대회 → 조간 매치 합산 제외. 전체 1조(groupName 전부 NULL) 대회 → 기존과 100% 동일.
- 주의입력: roundName=NULL이고 좌표(round_number+bracket_position) 보유 매치 = KO로 판정(제외). groupName 한쪽만 NULL = 격리 안 함(폴백). KNOCKOUT_ROUND_REGEX 패턴은 "결승"/"준결승"/"준준결승"/"4강"/"8강"/"3·4위전"/"3위전" 등.

⚠️ reviewer 참고:
- KNOCKOUT_ROUND_REGEX 정규식 false positive 여부 봐줄 것(예선 라운드명에 "강"/"위전" 우연 포함 케이스 — 현 운영 roundName 패턴상 위험 낮음).
- isPrelimMatch ③ `!= null`(느슨) 채택 사유: mock/실DB 모두 undefined+null 안전 폴백. 명세(round_number != null && bracket_position != null) 정합.
- 조별 격리 NULL 폴백이 회귀 0의 핵심(현 진단상 조간 예선매치 0대회 = 안전망 역할).
- DB 재박제(5차 뉴비리그 #301)·#301 좌표부여는 본 작업 범위 외(PM 승인 게이트 후속).

### sync completed 역전 차단 가드 (2026-06-14)
📝 구현: Flutter sync 가 이미 completed 박제된 매치를 scheduled/live/in_progress 로 되돌리는 사고 차단. 공통 가드(effectiveStatus)를 2개 sync 경로에 삽입.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/services/match-sync.ts` | update data 직전 effectiveStatus 계산(L489 부근). `status: match.status`→`status: effectiveStatus`. 역전 시 console.warn. **existing 재사용(추가 DB조회 0)**. L528 알기자 trigger 는 `match.status==="completed"` 조건이라 역전 차단 시 미발동(정상) | 수정 |
| `src/app/api/v1/tournaments/[id]/matches/batch-sync/route.ts` | tx.update 직전 effectiveStatus 계산(L88 부근). `status: match.status`→`status: effectiveStatus`. ★throw 금지 — 조용히 status 만 고정 후 점수/QS 박제 → synced++ 정상. existing(L47) 재사용 | 수정 |

가드 룰: `existing.status === "completed" && match.status !== "completed"` → "completed" 유지, 아니면 match.status 그대로. 정방향·completed→completed 재sync 허용(회귀 0). 응답 shape·schema 불변. 점수/기록 sync 그대로(status 역전만 차단).

💡 tester 참고:
- 테스트: completed 매치에 status="in_progress"(또는 scheduled/live) sync → DB status 는 completed 유지·점수/QS 는 박제됨 확인. 서버 로그 `[sync-guard] match ... 역전 차단` 출력.
- 정상: 정방향(scheduled→live→completed)·completed→completed 재sync 는 그대로 통과(차단 0). batch-sync 는 역전이어도 synced++(failed 아님).
- 주의입력: completed→completed(동일) 은 차단 대상 아님(effectiveStatus===match.status). batch 에서 역전 매치 섞여도 다른 매치 정상 처리.

⚠️ reviewer 참고:
- match-sync.ts: 알기자 trigger(L528)가 차단 시 발동 안 하는 것이 의도된 정상(역전이면 completed 신규 전환 아님). isReset(L534)는 match.status 기반 — 역전 차단과 독립.
- batch-sync: throw 금지 의무 준수(synced 카운트 보존). FIBA 가드(L76 throw)는 match.status==="completed" 경로라 역전 차단과 무관.
- tsc --noEmit EXIT=0.

### Phase12 Batch B (2026-06-14)
📝 구현: v2.31 Phase 12 Batch B(DB연결 7화면) 박제. globals.css 끝 Batch B 블록 append(`.ex-tabs`/`.ex-mono*`/`.sv-*`/`.fm-*`) + 화면별 재작성. ST1/CA1/SC1/TV1=준비중 빈상태(`.ex-empty`) / CV1=정적폼(`.fm-*`, 제출 noop) / SV1=`.sv-*`/`.ex-tabs` 시각교체(데이터패칭 보존) / SE1=변경0(점검만).

| 파일 | 변경 | LOC | 데이터출처 | 신규/수정 |
|------|------|-----|-----------|----------|
| `globals.css` | Batch B 블록 append(+97). `.ex-tabs`/`.ex-tab`/`.ex-tab__n`(Batch A 미이식) + `.ex-mono*`(SV1 팀타일) + `.sv-*`(SV1 타일·그리드) + `.fm-*`(CV1 폼) + 720분기(.sv-grid-*/.fm-row 1열). 토큰치환 --r-md→--radius-card·--r-sm/xs→--radius-chip·--err→--color-error. `.se-*` 미이식(SE1 미사용). `*/` 조기종료0 | +97 | — | 수정 |
| ST1 `stats/page.tsx` | "use client" 제거→server. 더미 6상수(TOTALS/SPLITS/ZONES/GAME_LOG/TREND/RANKINGS)+SVG+4탭 전량삭제 → `.ex-empty`(query_stats "시즌 스탯 분석 준비 중")+/awards CTA | -592/+? | 빈상태(0DB) | 수정 |
| CA1 `calendar/page.tsx` | "use client" 제거→server. 더미 EVENTS 17건+월그리드계산+필터+뷰토글+useEffect 전량삭제 → `.ex-empty`(calendar_month "내 일정 준비 중") | -749/+? | 빈상태(0DB) | 수정 |
| SC1 `scrim/page.tsx` | "use client" 제거→server. 더미 4상수(OPEN_REQS/INCOMING/OUTGOING/HISTORY)+3탭+me-bar+ResponsiveTable 전량삭제 → `.ex-empty`(handshake "스크림 매칭 준비 중") | -523/+? | 빈상태(0DB) | 수정 |
| TV1 `team-invite/_v2/team-invite-client.tsx` | "use client" 제거→server. 인라인 더미(team/inviter/invite/ROSTER/TEAM_STATS·MONKEYZ·수락/거절 분기) 전량삭제 → `.ex-empty`(group_add "팀 초대 준비 중"). page.tsx metadata 보존 | -688/+? | 빈상태(0DB) | 수정 |
| CV1 `courts/submit/_form/court-submit-form.tsx` | StepWizard 3-step 박제→시안 `.fm-*` 정적 단일폼 v2.31. 편의시설 칩 toggle(useState)만 시각·사진 dropzone 자리만. 제출=alert("준비 중")·INSERT 0. page.tsx 무변경 | -950/+? | 정적폼(0DB) | 수정 |
| SV1 `saved/_v2/saved-content.tsx` | inline-style→시안 `.ex-tabs`/`.sv-grid-3`/`.sv-tile`/`.ex-sec`/`.ex-empty` 시각교체. **props/타입/필터로직 무변경**(데이터패칭은 page.tsx 전담). 시안 더미(games/tns/teams/MONKEYZ) 박제0·실데이터(boards/courts)만 타일·미지원 4탭 `.ex-empty` 유지 | 시각만 | board_favorites+user_favorite_courts(보존) | 수정 |

💡 tester 참고:
- 테스트: 7화면 각각 렌더 확인. ST1/CA1/SC1/TV1 = 준비중 빈상태(아이콘+안내 1개)·인터랙션0. CV1 = 폼 입력 가능·편의시설 칩 토글 동작·"제보 제출"/"임시저장" 클릭 시 alert("준비 중")·DB INSERT 0. SV1 = 로그인 상태 보관함 탭(전체/게시판/코트=실데이터·게시글/경기/대회/팀=준비중)·비로그인 시 page.tsx 로그인 유도 카드.
- 정상: ST1 빈상태에 "시즌 어워드 보기"→/awards 링크. 7화면 active 탭(rank/more/games/team/court/more/tn)은 pathname 자동판정(prop 조작0). SV1 보관 코트 클릭→/courts/[publicId]·게시판 클릭→/community?category=.
- 주의입력: SV1 비로그인(인라인 카드)·boards/courts 0건(전용탭 빈상태)·nickname 있는 코트(본명 보조표기). CV1 alert 2회(임시저장·제출 둘다 noop).

⚠️ reviewer 참고:
- **SV1 saved/page.tsx diff 0 실측 완료**(데이터패칭·getWebSession 인증·BigInt직렬화·IDOR·CATEGORY_LABEL 보존). SavedBoard/SavedCourt DTO 계약 무변경. saved-content.tsx 는 props만 받음(신규 fetch 0).
- **SE1 series/[slug]/page.tsx + series-detail-tabs.tsx diff 0 실측 완료**(손대지 않음).
- 토큰: `.ex-mono`/`.fm-*` 브랜드배경 `#fff` 텍스트는 Batch A 선례(11회) 동형·의도색(동작영향0). 폐기토큰(--r-*/--err)/9999/lucide/렌더이모지 0. globals Batch B `*/` 조기종료 0.
- 신규 DB/mock/신규라우트/api/v1 0. AppNav 재구성 0. tsc --noEmit EXIT=0.

### Phase12 Batch A (2026-06-14)
📝 구현: v2.31 Phase 12 Batch A 정적/저위험 6화면(RI1/SF1/CC1/GL1/SH1/AW1) 박제. globals.css 끝 `.ex-*`/`.ri-*`/`.sf-*`/`.co-*`/`.gl-*`/`.sh-*`/`.aw-*` 토큰치환 이식 + 화면별 page.tsx 재작성.

| 파일 | 변경 | LOC | 데이터출처 | 신규/수정 |
|------|------|-----|-----------|----------|
| `globals.css` | Phase12 Batch A CSS 블록 append(+391). 토큰치환: --r-lg/md→--radius-card·--r-sm/xs→--radius-chip·--err→--color-error·#8B5A0F/#F4C76C→--warn·#1A1E27/#2B3242→--bdr-navy 그라디언트. `.page__inner` 기존(L5189) 충돌 회피 위해 base max-width를 `.ex-page-w`로 분리 | +391 | — | 수정 |
| RI1 `referee-info/page.tsx` | server(metadata SEO 보존)→본문 client 위임. v2.4 카드3종→시안 8섹션 복원 | -171/+? | 정적(0DB) | 수정 |
| RI1 `referee-info/_components/referee-info-content.tsx` | client·FAQ accordion. 시안 정적 8섹션(Hero/통계4/하는일4/등급3/절차4/정산표/FAQ5/CTA). CTA href #→/referee·/help 실라우트 | +238 | 정적 | **신규** |
| SF1 `safety/page.tsx` | client→server 단순화. 차단/신고 4탭 더미 전량 삭제→시안 안전가이드 6카드+신고/긴급 2카드(도움말 링크 유지) | +120/-330 | 정적 | 수정 |
| CC1 `coaches/page.tsx` | 더미(COACHES6/BOOKED2) 전량 삭제→시안 셸(ex-head+chip client)+`ex-empty`"코치 매칭 준비 중" | +90/-380 | 준비중(mock0) | 수정 |
| GL1 `gallery/page.tsx` | 더미(ITEMS12+lightbox+SVG+이모지) 전량 삭제→client→server. 시안 셸+`ex-empty`"갤러리 준비 중" | +60/-560 | 준비중 | 수정 |
| SH1 `shop/page.tsx` | 더미(PRODUCTS12+cart+이모지) 전량 삭제→client→server. 시안 Hero(토큰화)+`ex-empty`"샵 오픈 준비 중" | +70/-410 | 준비중 | 수정 |
| AW1 `awards/page.tsx` | **미변경(diff 0 실측)** — 서버 prisma 데이터패칭/raw SQL/DTO/officialMatchWhere 가드 전부 보존 | 0 | 실데이터 보존 | 미변경 |
| AW1 `awards/_v2/awards-content.tsx` | v2.31 시각 재작성. hero(bdr-navy 그라디언트+시즌셀렉터 ?series= 흐름 보존)/MVP(seasonMvp DTO·0건 빈상태)/베스트5(leaders 3명 실데이터·나머지2슬롯 준비중)/부문별(scoring/assists/rebounds 실데이터·스틸/레이팅/매너 준비중). best5 mock0 | +? | 실데이터 와이어 | 수정 |

변경량: 7파일 수정(+780/-2627) + 1파일 신규(+238). awards-catalog.ts는 orphan(미import)되나 미삭제(page.tsx 영향0).

💡 tester 참고:
- 테스트: 6라우트 직접 진입(/referee-info·/safety·/coaches·/gallery·/shop·/awards). 비로그인 열람 가능(RI1 SEO).
- 정상: RI1 FAQ 아코디언 토글·CTA /referee·/help 이동 / SF1 6카드+신고2카드 정적·신고카드→/help / CC1 chip 토글되나 결과는 빈상태 "코치 매칭 준비 중" / GL1·SH1 빈상태(SH1은 Hero 정적 노출) / AW1 시즌셀렉터 ?series= 클릭→재페치, MVP 0건이면 "선정된 MVP 없음" 빈상태, best5 leaders 있으면 카드·없으면 "준비 중" 슬롯, 부문별 득점/어시/리바 실데이터.
- AW1 핵심: page.tsx **diff 0**(git diff 실측 통과). 실데이터 와이어(현재 운영 mvp 0건→빈상태 폴백 정상).
- 주의입력: AW1 ?series=<없는slug> → page.tsx가 seasons[0](전체) 폴백 / leaders 0건 시 best5 전부 준비중 / MVP teamName null → "—".

⚠️ reviewer 참고:
- AW1 page.tsx 절대 미변경 — `git diff src/app/(web)/awards/page.tsx`=0 실측 완료. awards-content.tsx만 시각 교체. DTO 타입(AwardsDataDTO/PlayerRefDTO/SeasonMvpDTO) page.tsx export 그대로 import.
- best5 mock 함정: 시안 더미("김지훈" 등) 박제 안 함. DTO leaders 3명만 실데이터·나머지 2슬롯 준비중. 포지션별 best5 데이터 DTO 없어서 슬롯 라벨=부문명(득점/어시/리바/수비/신인)으로 정직 표기.
- 토큰: globals 신규블록 하드코딩색 0(`#fff`=브랜드배경 흰글자 의도색·`rgba(0,0,0/.7)`=오버레이 표준만). 폐기토큰(--r-*/--err) 치환 누락 0. 9999px 0. `*/` 조기종료 0. JSX 이모지/lucide 0.
- `.page__inner` 충돌 회피: 기존 L5189(margin만)는 정보페이지 공유 → base max-width를 `.ex-page-w`로 분리(기존 미변경·회귀0). 시안 화면은 `page__inner ex-page-w` 또는 `page__inner page__inner--wide ex-page-w` 조합.
- tsc --noEmit EXIT=0 / next lint 6파일 이슈0.

### PR-LINEUP-V2 [3] UI (2026-06-14)
📝 구현: 사전 라인업 확정 UI를 앱 bdr_stat_v3 roster_confirm 정합으로 전면 재작성 (2-state→3상태 roles맵+주장(C)+undo+포지션제거). [1]스키마·[2]API 선행 완료.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `_components/ttp-row.tsx` | 행 단일 탭 순환 버튼(번호+이름+닉+주장태그+C버튼+상태칩). **포지션 컬럼 완전 제거**(position prop은 page 호환 위해 타입만 유지). C버튼 stopPropagation으로 행순환과 분리 | 전면 재작성 |
| `_components/lineup-confirm-form.tsx` | roles맵('out'/'starter'/'bench')+captain+undo스택. cycleRole 3상태순환(out→선발(선발<5)/벤치(=5)→벤치→out·정원12초과차단·out시 주장자동해제) / **★주장필수게이트(canConfirm=선발5 AND captain!=null)** / 전체해제·undo·코칭스태프바(role==='coach'분리·manager분기없음)·5슬롯보드 / POST `{teamSide,starters[5],substitutes[],captain}` / isLocked·DELETE·상대팀미노출 유지 | 전면 재작성 |
| `[matchId]/page.tsx` | findUnique select +`captainTtpId:true` / lineup prop +`captain_ttp_id`(server prisma camel→prop snake). **데이터패칭·매치헤더 변경 0** | 최소 수정(+7) |
| `globals.css` | `.lc-*` +`.gm-card`+`.btn--touch` append(+269). 시안 토큰 이식: --r-md→--radius-card / --r-sm·--r-xs→--radius-chip / --err→--color-error / --err-soft→--accent-soft / --ok-hair·--warn-hair→--border / hex#fff→--ink-on-brand·#8B5A0F→--warn·#0E6B3D→--ok. 선발·주장=--accent(의도된빨강) 벤치=--ink-mute 정보=--cafe-blue. 720 sticky·44px·iOS16px | append |

변경량: 4파일 +869/-462 LOC. **/api/v1·데이터패칭·라우트 변경 0**.

💡 tester 참고:
- 테스트: `/lineup-confirm/[matchId]` (팀장/admin 권한). 행 탭→선발(5칸까지)→벤치(7칸)→선택 순환. 정원12 만석이면 선택→ 진입 차단.
- 주장필수: 선발 5 + C 1명 둘 다여야 확정 활성. 주장만 빠지면 "주장(C)을 지정해주세요" warn + 버튼 비활성.
- undo: 변경 직전 스냅샷 복원. 전체해제: 전 역할 out+주장 해제.
- 코칭스태프: role==='coach' 선수는 명단서 빠지고 코칭스태프 바에 칩. coach 0건이면 바 미표시.
- 정상: 선발5+벤치≤7+주장1 → POST 200, 응답 `lineup.captain_ttp_id`(snake). 기존 lineup(captain NULL) 로드 시 captain=null 안전.
- 주의입력: 등번호 null("미정") / 닉==본명(닉 미표시) / 출전 아닌 선수 C버튼 비활성 / isLocked 시 전 입력 disabled.
- 회귀: isLocked·DELETE해제·상대팀미노출 동작 유지 확인.

⚠️ reviewer 참고:
- apiSuccess snake 함정: page.tsx는 server prisma 직접이라 camel(captainTtpId) 읽어 prop엔 snake(captain_ttp_id)로 직렬화 / form은 prop snake 그대로 사용 / POST body는 captain(camel, 클라 송신키). 3계층 케이스 정합 봐줄 것.
- 토큰: 하드코딩 hex/lucide/9999px 0(self-grep 확인, 매칭은 주석텍스트만). --ok-hair/--warn-hair 미실재→--border 대체. --err→--color-error(실재 var(--danger)).
- canConfirm 게이트가 UI 1차, API가 2차(주장필수 422). 이중 가드.
- tsc --noEmit EXIT=0 / CSS */ 조기종료 0.

### PR-LINEUP-V2 [2] API (2026-06-14)
📝 구현: 사전 라인업 확정 API에 **주장(captain) + 벤치캡7 + 정원12** 검증 추가 (앱 roster_confirm 정합). [1] 스키마(captainTtpId ADD)는 선행 완료.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `lineup/route.ts` | PostBodySchema `captain?` optional·nullable 추가 / serializeLineup `captainTtpId` 추가(→apiSuccess `captain_ttp_id` snake) / GET findMany select +captainTtpId / POST 신규검증 3종(벤치캡·정원·주장필수+멤버십) / upsert create·update +captainTtpId | 수정 |

변경량: 1파일 +64/-1 LOC. 본 파일만(/api/v1 미변경).

**신규 검증(기존 검증 전부 통과 후 append)**:
- 벤치캡: `substitutes.length > 7` → 422 "벤치는 최대 7명"
- 정원: `starters + substitutes > 12` → 422 "출전 명단은 최대 12명"
- 주장 필수(POST 한정): `captain == null` → 422 "주장을 지정해주세요"
- 주장 멤버십: captain ∉ (starters∪substitutes) → 422. **소속·is_active는 기존 ttp 무결성 쿼리(8번)에 captain이 이미 포함돼 자동 검증**(별도 쿼리 0).
- captain 형식 오류(bigint 변환 실패) → 기존 zod try/catch가 422 처리.

💡 tester 참고:
- 회귀(R1~R5): starters≠5 / 중복 / ttp 무결성 / status 가드 전부 유지(삭제·약화 0).
- R6: 기존 라인업(captainTtpId=NULL) GET 정상 조회 — serializeLineup null 안전 직렬화.
- R10: substitutes 8건 → 422 / starters5+subs8=13 → 422.
- R11: captain이 출전선수 밖 → 422. captain 미전송 → 422(주장 필수).
- 정상: starters5 + subs≤7 + captain∈출전 → 200, 응답 `lineup.captain_ttp_id`(snake).
- 주의: 주장 필수는 **POST에만**. GET/로드는 nullable 허용.

⚠️ reviewer 참고:
- apiSuccess snake_case 함정: serializeLineup 반환 `captainTtpId`(camel) → 응답 `captain_ttp_id`(snake). POST body는 `captain`(camel, 클라가 보내는 키). page.tsx server prisma 직접은 camel — 혼동 금지.
- 검증 순서: 기존 검증(7) → 신규(7-1~7-4) → ttp 무결성(8)에서 captain 자동 검증. captain이 7-4에서 멤버십 보장돼 allIds에 이미 포함됨.
- tsc --noEmit 통과(0).

## 테스트 결과 (tester)

### PR-MOCK-TO-REAL Batch2 ②/calendar + ③/about 실연결 검증 (2026-06-14) — ✅ PASS (미커밋)
대상: calendar/page.tsx(tournament 일정 실쿼리+court_events 0행 빈배열)·about/page.tsx(통계4 count 실값)·globals.css(.cal-* append +43). 실측 count·mock 0·빈상태·§6 보존·postcss 실파서.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | diff --stat HEAD 실변경 | ✅ 통과 | calendar +271(±)·about +41·globals +43(append-only, 0del). 요청 3소스 정확 일치(+문서 lessons/scratchpad) |
| 2 | tsc --noEmit | ✅ 통과 | EXIT=0, 에러 0 (taskkill 미사용) |
| 3 | calendar 실연결·mock 0 | ✅ 통과 | (A) tournamentTeamPlayer.findMany{userId→tournamentTeam.tournament(name/startDate)} 실쿼리·tournamentId dedupe. (B) court_events.findMany(organizer/참여 OR) **실측 0행→빈배열**(가드만 유지). 더미상수(EVENTS/TODAY 하드코딩) grep **0**(매치 2건 모두 주석 설명). TODAY=`new Date()` 실제 현재일·표시월=현재월 |
| 4 | calendar 빈상태 | ✅ 통과 | ①비로그인→lock "로그인이 필요합니다" 카드+/login(더미❌) ②upcoming 0건→event_busy "예정된 일정이 없습니다"(더미❌). 달력 셀 eventsByDay 실데이터 매핑·is-today=todayDate |
| 5 | about 통계 실값 | ✅ 통과 | getAboutStats() = `Promise.all([user.count(),team.count(),tournament.count()])` 실값. **실측 users=660/teams=105/tournaments=61**(코드 count 일치). "20년"=정적카피 §6 보존. ab-note 캡션 "운영 시점 연동"→"운영 데이터 기준 실시간 집계"(연동 캡션 제거) |
| 5★ | §6 보존 git diff 0 | ✅ 통과 | **운영진(team 6)·가치(values 6)·파트너(partners 8)·Hero·CTA·FAQ git diff 0**(실명0·일반팀라벨·ab-guard 배너 보존). 변경=통계4 영역(stats상수→async count)+ab-note 캡션·import prisma·default async뿐 |
| 6 | 강조색·토큰 | ✅ 통과 | calendar is-today=`var(--cafe-blue)`(border+box-shadow+__n색). 이벤트 의미색 3종 유지(game=cafe-blue-soft/tn=accent-soft/court=ok-soft). 하드코딩hex/lucide/9999/`--r-sm`/`--r-xs`/폐기--color-* **0**(append 블록). 참조 토큰(cafe-blue/-soft/-deep/accent-soft/ok-soft/radius-chip) 전부 :root+다크 실재 |
| 7 | ★postcss 실파서 | ✅ 통과 | postcss.parse(globals.css) **PARSE_OK·.cal-* 33규칙** 정상파싱. 주석 `*/` 조기종료 **0**(`--r-sm/--r-xs → --radius-chip` 표기의 `/`는 닫는주석 아님·errors[06-14] 재발0) |
| 8 | 회귀 | ✅ 통과 | 변경=calendar/about/globals.css+문서뿐. **라우트 추가 0·api 변경 0·다른 페이지 무영향**. globals append-only(43add/0del)→기존 .st-*/.ex-* 무충돌. staged 0(미커밋) |

📊 종합: 8개 항목 전부 통과 / 실패 0. tsc EXIT0. calendar=ttp.userId→Tournament 실쿼리(실측 357행 소스)·court_events 실측 0행→빈배열(가드 유지·가짜 0)·TODAY=new Date()·빈상태 2종(비로그인/0건 더미❌). about=count 실값(660/105/61 정확일치)·"운영시점 연동" 캡션 제거·§6 운영진/가치/파트너/Hero/CTA git diff 0 보존. 강조색 cafe-blue·의미색 3종 유지·하드코딩/lucide/9999/폐기토큰 0. postcss 실파서 .cal-* 33규칙·조기종료 0. append-only 회귀 0. 미커밋.

### PR-MOCK-TO-REAL ① /stats 실데이터 연결 검증 (2026-06-14) — ✅ PASS (미커밋)
대상: my-season-stats.ts(신규)·stats-client.tsx(신규)·stats/page.tsx·globals.css(.st-* append). 실쿼리(MatchPlayerStat 2375행)·mock 0·빈상태 4종·postcss 실파서.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | diff·getPlayerStats 회귀격리 | ✅ 통과 | page.tsx +166/globals.css +84(0del)/신규2(untracked). **getPlayerStats(services/user.ts) diff 0**(신규 헬퍼 분리로 격리) |
| 2 | tsc --noEmit | ✅ 통과 | EXIT=0, 에러 0 |
| 3 | 실쿼리·mock 0 | ✅ 통과 | matchPlayerStat/tournamentTeamPlayer findMany 실집계(KPI/TREND/GAME_LOG/clubRanks). 더미상수(TOTALS/ZONES/SPLITS/GAME_LOG/TREND/RANKINGS) grep **0**. UserSeasonStat/ShotZoneStat 직접SELECT **0**(주석만, 실측 0행 우회) |
| 4 | 빈상태 4종 | ✅ 통과 | ①비로그인→lock 카드(server) ②ttp0→sports_basketball 카드(**실측 hasNoTtp=true·totals=null**) ③시즌0건→"이번 시즌 기록이 아직 없습니다"(seasonEmpty) ④ZONES→"슈팅 존 집계 준비 중". 가짜데이터 0 |
| 5 | att0·winner NULL 처리 | ✅ 통과 | att0→pct() null→client fmt() "-"(**실측 user2880 fgPct=null**). winner NULL→result "-"·winRate null(decided>0 가드/`!=null`). 0% 왜곡 0 |
| 6 | 강조색 var(--cafe-blue) | ✅ 통과 | KPI/TREND/순위/log .st-*--hl 전부 cafe-blue. var(--accent) **실사용 0**(주석1건만). 하드코딩hex/lucide/9999/폐기--color-* **0**. btn--accent=기존 CTA 운영토큰(별개) |
| 7 | ★postcss 실파서 | ✅ 통과 | postcss.parse() → .st-* **31규칙** 정상파싱·핵심셀렉터6 전부존재·빈규칙(decl0) **0**. 주석 `*/` 조기종료 0(errors[06-14] 재발방지·구분자 쉼표만) |
| 8 | count 실측 | ✅ 통과 | **MatchPlayerStat=2375**(정확일치)·UserSeasonStat=0·ShotZoneStat=0. 샘플 user2904 **6경기/PPG 4.7**(수동산출=헬퍼출력 일치)·2승4패 승률33.3%·clubRanks 5·trend 6 |
| 9 | 회귀 | ✅ 통과 | globals.css append-only(84add/0del)→기존 .ex-tab/.ex-chip/.ex-badge 무영향. 시즌전환=클라 useState 필터(라우트0·옵션A perSeason 선계산). src/ 타 파일 변경 0 |

📊 종합: 9개 항목 전부 통과 / 실패 0. tsc EXIT0. 실쿼리 MatchPlayerStat 2375행 집계(헬퍼 실호출 PPG 4.7 검증)·더미상수 grep0·직접SELECT0. 빈상태 4종 분기(실측 ttp0→hasNoTtp). att0→"-"(실측 user2880). postcss 실파서 31규칙·조기종료0. 강조색 cafe-blue·accent 실사용0. append-only 회귀0. 임시검증 스크립트(scripts/_temp) 정리완료. 미커밋.

### 순위표 집계 근본 수정 검증 (2026-06-14) — ✅ PASS (미커밋)
대상: update-standings.ts 1파일(isPrelimMatch 3중OR 결승제외 + 조별격리). 정적검증+tsc+vitest회귀+regex동작실증+diff0.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | tsc --noEmit | ✅ 통과 | EXIT=0, 에러 0 |
| 2 | ★★vitest 회귀 | ✅ 통과 | tournaments 17파일 **301/301**(update-standings 5/5·standings-points 25/25·placeholder 26·advancement 9·dual 8·auto-complete/auto-knockout/swiss/nba-seed/setup-status 등). round_robin/league/division/dual 로직 무영향 |
| 3 | isPrelimMatch 3중OR 정합 | ✅ 통과 | ①RANK `/순위/` ②KO `결승\|준결승\|준준결승\|n강\|n위전\|n·m위` ③`round_number!=null && bracket_position!=null`. 하나라도 참=return false(예선아님=제외). 12개 KO명(결승/준결승/4강~32강/3·4위전/3위전/5·6위) 전부 제외 실증 |
| 4 | ★조별격리 폴백 | ✅ 통과 | `hg=homeTeam?.groupName??null`/`ag=...??null`/`if(hg!==null&&ag!==null&&hg!==ag)continue`. 둘다NULL·한쪽NULL·한쪽undefined→격리안함(기존동작) / 둘다NOTNULL다름→skip / 같음→합산. completed+draw 양 loop 동일 |
| 5 | ★undefined 안전(`!= null`) | ✅ 통과 | 느슨한비교로 null+undefined 둘다 폴백. mock 필드누락(`{roundName:null}`)→prelim=true. **★bracket_position=0 falsy함정**: `!=null`이라 0도 좌표로 인식(#301 rn=1/bp=0 → 제외 OK). truthy비교였으면 0 오판할 뻔 |
| 6 | 기존 `/순위/` 동일흡수 | ✅ 통과 | 순위결정전/순위전/동순위전/최종순위 전부 제외(isPrelimMatch ①). 동작 동일 |
| 7 | divisionCode·시그니처·호출부·schema·api 변경 0 | ✅ 통과 | git diff: export 시그니처 0줄변경/divisionCode·points_rule·calculateMatchPoints 분기 0줄변경(SELECT필드추가+격리가드만 신규)/schema.prisma·api 파일 0/다른.ts 0(update-standings.ts 1파일+scratchpad만) |

📊 종합: 7개 항목 전부 통과 / 실패 0. tsc EXIT0. tournaments 301/301 회귀0. regex 12 KO명 제외+예선명(예선/조별리그/1라운드/리그전/풀리그/A조/라운드로빈) false positive 0 실증. bracket_position=0 falsy함정 회피(`!=null`). 격리 NULL/undefined 폴백 5케이스 정확. divisionCode분기·시그니처·schema·api·호출부 diff0. 미커밋.

🟡 참고(이번 변경과 무관·기존 실패):
- 전체 vitest(1113) 중 **4건 실패**(tournament-delete.test 2 + running-score-helpers.test 2). **★stash 검증**: update-standings.ts 변경 stash 후 변경 전 상태에서도 동일 4건 실패 재현 = **pre-existing 실패(이번 회귀 아님)**. 두 실패 테스트·대상소스 모두 update-standings import 0(의존성 무관). tournament-delete=`tx.tournamentMatch.findMany undefined`(mock 누락) / running-score-helpers=`team_side home/away` 누적 정합. 별도 작업 영역(본 PR 범위 외).

### Phase 12 Batch B 박제 검증 (2026-06-14) — ✅ PASS (미커밋)
대상: globals.css(+97 Batch B 블록)/stats·calendar·scrim(server화 준비중)/team-invite-client(준비중)/court-submit-form(정적폼)/saved-content(시각만). 정적검증+tsc+self-grep+diff0 회귀실측.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | git diff --stat HEAD 실변경 | ✅ 통과 | 7소스(globals+stats+calendar+scrim+team-invite-client+court-submit-form+saved-content)+scratchpad. 593+/3608- |
| 2 | tsc --noEmit | ✅ 통과 | EXIT=0, 에러 0 |
| 3-1 | mock 0: ST1/CA1/SC1/TV1 더미 전량삭제 | ✅ 통과 | grep TOTALS/SPLITS/ZONES/GAME_LOG/EVENTS/OPEN_REQS/INCOMING/OUTGOING/ROSTER/TEAM_STATS/RANKINGS/HISTORY/MONKEYZ 실코드 0. 4화면 .ex-empty "준비중"만(아이콘 query_stats/calendar_month/handshake/group_add). "use client" 제거→server·DB0·API0 |
| 3-2 | CV1 정적폼 제출=alert/noop(INSERT 0) | ✅ 통과 | handleSubmit=alert("준비 중")만. 임시저장·제보제출 둘다 동일 noop. 편의시설 칩 useState 토글만 시각. dropzone 자리만(미동작). DB INSERT 0 |
| 3-3 | SV1 실데이터(props)·시안 더미 박제 0 | ✅ 통과 | boards(board_favorites)/courts(user_favorite_courts) props만 타일. 시안 더미(games/tns/teams/MONKEYZ) 박제 0. 미지원 4탭(게시글/경기/대회/팀)=.ex-empty "북마크 시스템 준비 중" |
| 4 | **diff 0 회귀(중요)** | ✅ 통과 | saved/page.tsx diff=0 + series/[slug]/page.tsx diff=0 + series-detail-tabs.tsx diff=0. 데이터패칭·getWebSession 인증·IDOR 보존(SV1 page 11개 매칭 실재) |
| 5 | v2 토큰(폐기--r-*/--err/hex/emoji/lucide/9999 0) | ✅ 통과 | 7화면 TSX: 폐기토큰/9999/lucide 0. globals 신규블록: 폐기토큰0·9999px0(원형50%)·하드코딩hex 0(#fff만 잔존=브랜드네이비 위 흰글자 의도색·Batch A 11회 선례). 참조 토큰 28종 :root 실재. `*/` 조기종료 0 |
| 6 | AppNav active(pathname 자동·prop조작0) | ✅ 통과 | 7화면 active prop 조작 0. stats→rank/calendar·saved→more/team-invite→team/courts→court/scrim→games 전부 pathname 자동판정 |
| 7 | 모바일 720 1열·44px·16px | ✅ 통과 | @media 720: .sv-grid-2/3/4·.fm-row 1열화. .fm-input/textarea/select font-size 16px(iOS). ex-empty 셸 공용 |
| 8 | 회귀(SV1 분기·링크·기존페이지·CSS충돌0) | ✅ 통과 | SV1 비로그인=page.tsx 전담(보존)·boards/courts 0건 전용탭 빈상태·nickname 코트 본명 보조표기. 코트→/courts/[publicId]·게시판→/community?category= 링크. .ex-tabs/.ex-mono/.sv-tile/.fm-card 각 1회만 정의(중복0). ②③ 무변경 |

📊 종합: 8개 항목 전부 통과 / 실패 0. mock 0(4화면 더미 완전삭제·CV1 noop·SV1 실데이터·시안더미 박제0)·diff0 회귀(saved·series 3파일 데이터패칭/인증/IDOR 보존)·토큰위반0·AppNav prop조작0·720 1열. tsc EXIT0. 미커밋.

🟡 참고(동작영향 0):
- `#fff`(globals L39 .ex-mono): --bdr-navy/--accent 브랜드 배경 위 흰글자 의도색(Batch A 동형·금지색 살몬/코랄 0). SV1 셸이 .ex-mono 미사용(팀타일 박제 0)이나 정의 잔존=무해.
- CV1 페이지 본문 "use client" 유지(편의시설 토글 useState 필요). 나머지 6화면은 server화 완료.

### sync completed 역전 차단 가드 검증 (2026-06-14) — ✅ PASS (미커밋)
대상: match-sync.ts(L491~510) + batch-sync route.ts(L88~108). 정적검증 위주(/api/v1 실호출은 운영이라 금지) + tsc + vitest.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | tsc --noEmit | ✅ 통과 | EXIT=0, 에러 0 |
| 2 | ★★가드 로직 정합(두 파일 동일) | ✅ 통과 | `existing.status==="completed" && match.status!=="completed" ? "completed" : match.status` 문자 그대로 동일. match-sync L496~499 / batch-sync L93~96 |
| 3-1 | 정방향 회귀 0 (scheduled→live 등) | ✅ 통과 | 첫 항 `existing.status==="completed"` false → effectiveStatus=match.status. scheduled→live/live→in_progress/in_progress→completed/scheduled→completed 전부 그대로 통과 |
| 3-2 | completed→completed 재sync 통과 | ✅ 통과 | existing=completed지만 둘째 항 `match.status!=="completed"` false → 조건 false → match.status(completed) 유지. 차단 안 됨 |
| 4 | ★역전 차단(completed→live/in_progress/scheduled) | ✅ 통과 | 두 항 모두 true → effectiveStatus="completed" 고정. update data.status=effectiveStatus(match-sync L510/batch L108). console.warn `[sync-guard]` 출력 |
| 5 | ★batch-sync throw 없음(synced++ 보존) | ✅ 통과 | 가드 블록(L93~101) console.warn만·throw 0. effectiveStatus 후 tx.update 정상완료→synced++(L146). for 루프 독립이라 한 경기 가드가 batch 전체 미실패 |
| 6 | 점수/기록 sync 무영향(status만 차단) | ✅ 통과 | update data에서 status만 effectiveStatus. homeScore/awayScore·quarterScores·player_stats upsert·play_by_plays upsert 전부 가드와 무관하게 그대로 박제(match-sync L508~539·566~702 / batch L106~110) |
| 7 | 응답 shape 불변·추가 DB조회 0 | ✅ 통과 | match-sync data 객체(L747~757)·batch apiSuccess({synced,failed,errors})(L173) 불변. existing 재사용(match-sync L399~415·batch L47)으로 effectiveStatus 계산 추가 쿼리 0 |
| 8 | 알기자 trigger 역전 시 미발동(의도) | ✅ 통과 | match-sync L543 `existing.status!=="completed" && match.status==="completed"` 역전(existing=completed) 첫 항 false→미발동. batch L128 `match.status==="completed"` 역전(비completed) 미발동. 의도된 정상 |
| 9 | vitest match-sync 회귀 | ✅ 통과 | match-sync.test 31 + quarter-scores-sync 10 = 41/41 통과. 역전 가드 전용 케이스는 없으나 기존 sync 로직(existingMatch 분기·BUG-04·QS자동갱신·reset) 회귀 0 |

📊 종합: 9개 항목 전부 통과 / 실패 0. 가드 두 파일 문자 동일·정방향/재sync 회귀0·역전 시 completed 고정·batch throw0(synced++)·점수/기록 무영향·응답shape불변·추가쿼리0·알기자 의도된 미발동. tsc EXIT0·vitest 41/41. 미커밋.

🟡 참고(동작영향 사실상 0·후속 불요):
- batch-sync post-process 분기는 `match.status` 기준(effectiveStatus 아님): completed→in_progress 역전 시 L115 `match.status==="in_progress"` 분기 진입 가능 → 대회 status 자동전환 시도. **단 where 가드(`status in [draft,registration_open,registration_closed]`)로 이미 진행/종료 대회는 영향 0**. completed였던 매치가 속한 대회는 이미 진행단계라 실질 무해. finalize/알기자(L128 `match.status==="completed"`)는 역전(비completed)이라 미발동 — 의도대로 정상.
- 역전 가드 전용 자동 테스트는 부재(effectiveStatus는 인라인 삼항이라 export 헬퍼와 달리 단위테스트 대상 아님). 정적 검증으로 충분 판정.

### Phase 12 Batch A 박제 검증 (2026-06-14) — ✅ PASS (미커밋)
대상: globals.css(+391·L6381~6769)/referee-info(page+content신규)/safety/coaches/gallery/shop/awards-content (8파일 +834/-2627). 정적검증+tsc+self-grep+CSS실측.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | git diff --stat HEAD 실변경 | ✅ 통과 | 8소스+knowledge2. referee-info-content.tsx=untracked 신규(diff 미표시·정상). AW1 page.tsx diff 0 |
| 2 | tsc --noEmit | ✅ 통과 | EXIT=0. **lint: Next16 eslint.config 부재로 실행불가→tsc로 대체**(env 제약·코드결함 아님) |
| 3-1 | RI1/SF1 정적 박제(mock 아님) | ✅ 통과 | RI1=제도안내 상수(DB무관·CTA href 실라우트 /referee·/help). SF1=안전가이드 6+신고2카드(→/help). 더미4탭 삭제 |
| 3-2 | CC1/GL1/SH1 mock 0(더미배열 삭제) | ✅ 통과 | grep: COACHES/BOOKED/ITEMS/PRODUCTS/cart/lightbox 실코드 0(매칭=주석만). 전부 ex-empty 빈상태. SH1만 Hero정적 노출 |
| 3-3 | AW1 실데이터 와이어(mock 0) | ✅ 통과 | seasonMvp/scoring·assists·reboundsLeader DTO 실데이터. best5 leaders3+빈슬롯"준비중"(수비/신인). MVP 0건→빈상태폴백. 시안더미("김지훈")박제 0 |
| 4 | **AW1 page.tsx diff 0줄** | ✅ 통과 | git diff = 빈출력. DTO필드(scoring/assists/reboundsLeader/seasonMvp/seasons) page.tsx export 실재·import 정합. 데이터패칭/raw SQL/officialMatchWhere 보존 |
| 5 | v2토큰 전면(폐기토큰/hex/9999/lucide/emoji 0) | ✅ 통과 | 신규CSS블록(6381~6769): 폐기 --r-*/--err 0·9999px 0(원형=50%)·하드코딩컬러(#8B5A0F등)0. TSX: lucide 0·hex 실코드 0(주석만)·emoji JSX/CSS content 0(매칭=삭제이모지 설명주석·★❌마커 주석만) |
| 6 | AppNav active(pathname 자동·prop조작0) | ✅ 통과 | 6화면 active prop 조작 0. referee-info/safety/coaches/gallery/shop→more, awards→rank 자동판정 |
| 7 | 모바일 720 1열·44px·iOS16px | ✅ 통과 | 720분기 2곳: ri-tiers/sf-grid/co-grid/aw-cats/aw-mvp/sf-report 1열·ri-stats등 2열. ex-empty__t 16px·ri-tier__req .ico 16px·ex-empty .ico 44px |
| 8 | 회귀(②③ 무변경·CSS충돌0·기존무영향) | ✅ 통과 | tournament/completed diff 0건. .page__inner(L5189) 미변경(주석만 매칭). .ex-page-w/--wide/--narrow 신규 중복정의 0. 사용클래스 18종 전부 CSS 정의됨 |

📊 종합: 8개 항목 전부 통과 / 실패 0. mock 0(CC1/GL1/SH1 더미 완전삭제·AW1 실데이터·시안더미 박제0)·AW1 page.tsx diff0(데이터패칭보존)·토큰위반0·회귀0. tsc EXIT0. 미커밋.

🟡 참고(동작영향 0·후속 불요):
- lint: Next16에서 `next lint` deprecated + 프로젝트에 eslint.config 부재 → lint 실행 불가. tsc 0로 품질 대체 판정(코드결함 아닌 환경 제약).
- `#fff`/`rgba(0,0,0,.7)`/`rgba(255,255,255,.x)`: 브랜드 그라디언트 위 흰글자·오버레이 의도색만 잔존(룰 허용 범위·금지색 살몬/코랄 0).
- GL1/SH1 `page__inner page__inner--wide ex-page-w` 동시지정 시 --wide(1180·6396)가 ex-page-w(1080·6395)보다 소스 후행→1180 적용. 레이아웃 깨짐 아님(둘다 max-width 상한·미세 우선순위만).

### PR-LINEUP-V2 [2] API 검증 (2026-06-14) — ✅ PASS (미커밋)
대상: `lineup/route.ts` (+64/-1). 정적 검증 + tsc + vitest.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | git diff 실변경 + /api/v1 미변경 | ✅ 통과 | lineup/route.ts만 변경, /api/v1 diff 0건 |
| 2 | tsc --noEmit | ✅ 통과 | EXIT=0, 에러 0 |
| 3-1 | 벤치캡: substitutes>7 → 422 (7-1) | ✅ 통과 | "벤치는 최대 7명" |
| 3-2 | 정원: starters+subs>12 → 422 (7-2) | ✅ 통과 | "출전 명단은 최대 12명" |
| 3-3 | 주장 필수: captain null → 422 (7-3) | ✅ 통과 | POST 핸들러 한정, GET/zod는 nullable |
| 3-4 | 주장 멤버십: captain∈(starters∪subs) (7-4) | ✅ 통과 | 소속·is_active는 8)ttp무결성에 captain 포함돼 자동검증(allIds) |
| 4-R1 | starters≠5 → 422 유지 | ✅ 통과 | L60 refine 삭제·약화 0 |
| 4-R2 | starters·subs 중복 0 유지 | ✅ 통과 | L344~362 그대로 |
| 4-R3 | ttp 무결성(소속·active) 유지 | ✅ 통과 | L398~421 그대로, allIds에 captain 자동 포함 |
| 4-R4 | status·권한 가드 유지 | ✅ 통과 | L327~341 그대로, 신규검증은 7)~8) 사이 append |
| 4-R6 | GET 기존 라인업(captainTtpId=NULL) 직렬화 | ✅ 통과 | serializeLineup null 안전, GET select +captainTtpId |
| 5 | snake_case 정합 | ✅ 통과 | serialize captainTtpId(camel)→apiSuccess→응답 captain_ttp_id(snake). POST body=captain |
| 6 | vitest lineup 관련 | ✅ 통과 | lineup-selection-modal 13/13 (route 전용 테스트는 없음·score-sheet UI 헬퍼 무회귀) |
| - | schema captainTtpId 존재 | ✅ 통과 | schema.prisma:3323 BigInt? @map("captain_ttp_id"). [1]단계 선커밋 |

📊 종합: 13개 항목 전부 통과 / 실패 0. 검증 순서(기존7 → 신규7-1~7-4 → ttp무결성8) 정합. captain은 7-4 멤버십 보장으로 allIds에 포함돼 8)에서 소속·is_active 자동 검증됨. 회귀 0(삭제·약화 없음).

### PR-LINEUP-V2 [3] UI 검증 (2026-06-14) — ✅ PASS (미커밋)
대상: ttp-row/lineup-confirm-form/page.tsx/globals.css (+897/-462). 정적 검증 + tsc + self-grep.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | git diff --stat 실변경 | ✅ 통과 | 7파일(소스4+knowledge2+scratch). 소스 4파일만 검증대상 |
| 2 | tsc --noEmit | ✅ 통과 | EXIT=0, 에러 0 |
| 3-1 | cycleRole 3상태 순환 | ✅ 통과 | out→선발(<5)/벤치(=5)·starter→벤치(<7)/out(벤치만석)·bench→out. 정원12 만석 시 out→ 진입 차단(L158). out시 주장 자동해제(L171) |
| 3-2 | 주장 필수 게이트 | ✅ 통과 | canConfirm=선발5 AND captain!=null AND !locked !pending(L142). 미지정 시 "주장(C)을 지정해주세요" warn(L300)+버튼 disabled |
| 3-3 | undo(스냅샷)/전체해제 | ✅ 통과 | snapshot push→undo pop(L145·195). clearAll 전역 out+주장해제(L184). undo disabled=!history.length |
| 3-4 | 포지션 칩 미표시 | ✅ 통과 | ttp-row position prop 타입만 유지·UI 렌더 0. CSS .lc-pos 클래스 0건 |
| 3-5 | 코칭스태프 바 분리 | ✅ 통과 | players=role!=='coach'(명단제외)·coaches=role==='coach'(L94·99). coaches.length>0 일 때만 렌더(L453, 0건 미표시) |
| 4 | snake_case 3계층 | ✅ 통과 | page camel captainTtpId(select+prop L163)→prop snake captain_ttp_id(L207)→form 읽기 snake(L120). POST body captain(camel L224). 기존 lineup null 안전(R6) |
| 5-R | 회귀 6종 | ✅ 통과 | isLocked(L91 status가드)·빈명단(L332 group_off)·팀미배정(page L104 안내)·DELETE 해제(L244)·상대팀 미노출(mySide만 prop)·처리중(isPending disabled) 전부 유지 |
| 6 | 토큰: hex/lucide/pill9999 0 | ✅ 통과 | self-grep 매칭=주석/타입텍스트만(실코드 0). CSS hex/9999px 실코드 0. 매핑토큰 13종 전부 :root 실재(--ok/--accent/--warn/--ink-on-brand/--cafe-blue/--border-strong/--color-error/--accent-soft/--radius-card/--radius-chip 등) |
| 7 | 모바일 sticky/720/44px/16px | ✅ 통과 | .lc-sticky 데스크톱 display:none→720 block·sticky bottom:0(L242~). .lc-actions 720 display:none(역분기). .lc-capbtn 44×44·btn--touch min-height:44px. iOS input 16px guard(L275) |

📊 종합: 11개 항목 전부 통과 / 실패 0. cycleRole 경계(정원12 차단·out시 주장해제) 정합. 주장 필수 게이트 UI 1차+API 2차 이중가드. snake 3계층(page camel→prop snake→form snake / POST camel) 함정 회피. 포지션 제거·코칭스태프 분리·회귀6종·토큰·모바일 전부 정상. tsc 0. 미커밋.

## 리뷰 결과 (reviewer)

### PR-MOCK-TO-REAL ① /stats 실데이터 연결 리뷰 (2026-06-14) — ✅ APPROVE (미커밋)
대상: `my-season-stats.ts`(신규+419) / `stats/page.tsx`(server 재작성) / `_v2/stats-client.tsx`(신규) / `globals.css` `.st-*`(+84). tsc EXIT=0(stats 에러 0·전체 0). 변경 4파일·stats 디렉토리 mock 잔존 0 실측.

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 1)

✅ 잘된 점 (리뷰 포커스 1~6 전부 통과):
- **① 0행 테이블 직접매핑 회피**: UserSeasonStat/ShotZoneStat 직접 SELECT 0건(grep 확인). MatchPlayerStat(officialMatchNestedFilter 가드) 단일 source findMany 1건 + JS 시즌가공. 영구 빈화면 함정 정확히 우회. ZONES=항상 준비중 빈상태(억지 매핑 0).
- **② getPlayerStats 회귀 격리 완벽**: `src/lib/services/user.ts:252` getPlayerStats **git diff 0줄** 실측. 신규 `my-season-stats.ts` 분리로 공유함수 미접촉. officialMatchNestedFilter(공식기록 가드) 재사용·재정의 0.
- **③ mock 0 / 빈상태 4종**: 시안 더미상수(14.2/장충픽업/trend[]/RANKINGS) 전량삭제. 비로그인(lock+/login)·ttp0(sports_basketball+/tournaments)·시즌0건(query_stats)·ZONES(준비중) 4분기 전부 실빈상태. 클럽순위 rows0→카드 hide(억지 SPLIT 0). 가짜데이터 잔존 0.
- **④ 집계 정확성 견고**: 시즌경계=scheduledAt.getFullYear()(NULL 방어 `if(at)`). 본인 ttp 조인(userId→ttp.id→MatchPlayerStat.tournamentTeamPlayerId). **att0 분모가드** `pct()`=att≤0→null("-" 표기, 0% 왜곡 금지) 정확. winner_team_id NULL=`winnerId!=null && myTeamId!=null` 가드로 decided 미집계(result="-"). 슈팅%=시즌합 made/att(평균의평균 아님 = 정확). 승률=wins/decided(미정경기 분모 제외). schema 필드명 정합(total_rebounds/winner_team_id=raw / minutesPlayed/fieldGoalsMade=camel @map) — tsc 통과로 관계경로(homeTeam.team.name) 입증.
- **⑤ 강조색·토큰·postcss**: `.st-*` 14셀렉터 전부 `var(--cafe-blue)`(:root #0F5FCC/#3B82F6 실재)·`var(--ink-*)`·`var(--border)`·`var(--radius-card)`. 하드코딩 hex/lucide/9999/폐기--color-* 0. **★주석 구분자 쉼표 사용**(L6873 "슬래시 금지" 명시) → `*/` 조기종료 0 (errors[06-14] 재발 차단 입증 — Batch B L6779/L6388 동일버그를 본 PR은 회피). CSS `--accent`(빨강) 미사용·시안 빨강→cafe-blue 치환 결재 준수.
- **⑥ server/client 분리·타입안전·0스키마**: page=server(getWebSession→getMySeasonStats→빈상태 직접렌더→데이터 시 StatsClient prop). 시즌전환=옵션A(page 전시즌 perSeason 선계산→클라 useState 필터, **신규 라우트/API 0**·Stop 준수). prisma 직접(apiSuccess 미경유)이라 camelCase 일관·snake 혼동 무관. BigInt 없음(전부 number/string)→JSON 직렬화 안전. 인터페이스(MySeasonStatsResult) page↔client 1:1.

🟡 권장 수정 (minor — 동작영향 0·후속·본 PR 범위 밖):
- [브레드크럼/빈상태 중복] page.tsx의 `StatsShell`/`EmptyCard`(server 빈상태)와 stats-client.tsx의 브레드크럼·시즌내 빈상태가 각각 재구현(코드 중복 소량). server/client 경계상 prop 직렬화 불가한 JSX라 불가피·동작영향 0. 향후 공통 마크업 헬퍼 분리 검토 가능하나 본 PR 보류 권장.

발견: 0행 테이블 우회·getPlayerStats diff0 회귀격리·mock0·att0 분모가드·winner NULL 가드·공식기록 가드·cafe-blue 토큰·postcss 조기종료 회피·라우트0·타입안전 전부 통과. 집계 로직(슈팅% 시즌합·승률 decided분모·시즌경계 연도) 정확. 코드 리뷰 관점 커밋 가능. DB 변경 0(전부 read-only).

### 순위표 집계 근본 수정 리뷰 (2026-06-14) — ✅ APPROVE (미커밋) — PR-STANDINGS-ROOT-FIX
대상: `src/lib/tournaments/update-standings.ts` 1파일. isPrelimMatch 3중 OR + 조별 격리 + SELECT 4필드 확장. 설계서 standings-aggregation-root-fix-plan-2026-06-14.md 대조. tsc EXIT=0 / vitest 332 통과(dev 보고).

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 1)

✅ 잘된 점 (리뷰 포인트 1~6 전부 통과):
- **③ undefined/null 안전 — 느슨 비교 채택이 옳음(★검증 입증)**: `m.round_number != null && m.bracket_position != null` → null+undefined 둘 다 폴백. schema 실측 `round_number Int?`/`bracket_position Int?` 둘 다 nullable·SELECT 추가됨(항상 채워짐, 없으면 null). ★결정적 증거: 기존 test의 MockMatch 타입에 신규 필드가 **없는데도** 332테스트 통과 — mock이 undefined 반환 시 `!= null`이 정확히 예선 폴백. 엄격 비교였다면 깨졌을 케이스를 느슨 비교가 흡수.
- **조별 격리 정확**: `hg !== null && ag !== null && hg !== ag` → 양쪽 NOT NULL+다름만 skip. 한쪽 NULL=격리 안 함(전체1조=기존동작). self·동일조 정상 합산. groupName `String?`(nullable)·homeTeam/awayTeam relation 정상. completed/draw 양쪽 loop 동일 적용.
- **회귀 안전**: divisionCode 분기(matchesWhere) 미접촉, 그 안쪽에 필터/격리만 추가. round_robin/league/single=결승·조간매치 부재→영향0. full_league_knockout 6대회=버그상태→개선. dual=standings 미사용·팀 groupName NULL→무해.
- **`/순위/` 흡수 동일성**: RANKING_ROUND_REGEX(`/순위/`)가 isPrelimMatch ①에 그대로. 기존과 동작 동일. ①에 `m.roundName &&` 가드 추가돼 roundName=null 시 정상 통과(더 안전).
- **시그니처/호출부 호환**: `updateTeamStandings(matchId)` 불변. 호출부 5종(finalize/match-sync/batch-sync/web route/match.ts) 무영향. schema/api 변경0. SELECT 4필드 추가는 동일 findMany 컬럼/relation 추가뿐→쿼리수 증가0·성능 무시·무한루프 없음.
- **KNOCKOUT_ROUND_REGEX false positive 위험 낮음**: `[0-9]+\s*강`="n강"만·`[0-9]+\s*위\s*전`="n위전"만 매칭. "예선"/"1라운드"/조명(A/B조) 오제외 0. generator의 예선 roundName은 group_name 기반이라 숫자+강 조합이 예선에 나올 구조 아님(placeholder-helpers buildSlotLabel 확인). #301 같은 좌표NULL 결승은 ② KO 키워드로, 좌표부여 후엔 ③으로도 잡힘(이중).

🟡 권장 수정 (minor — 동작영향 0·후속·본 PR 범위 밖):
- [정규식 중복 정의] RANKING_ROUND_REGEX(`/순위/`)가 update-standings.ts·placeholder-helpers.ts:266·playoffs-client.tsx:88·divisions-view.tsx:87 **4곳 중복**(주석으로 "동일" 명시). KNOCKOUT_ROUND_REGEX도 단독 정의. 현재 동작 무결하나 향후 패턴 변경 시 누락 위험 — 공통 export 통합 검토 가능. **동작하는 코드 리팩토링이라 본 PR선 보류 권장**.

발견: 핵심 로직(3중OR 결승제외·조별격리·NULL폴백) 설계서 정합·null-safe·회귀0. 느슨비교 채택이 기존 test 무수정 통과로 입증됨. DB 재박제(#301)·좌표부여는 본 작업 범위 외(PM 승인 게이트 후속). 코드 리뷰 관점 커밋 가능.

### Phase 12 Batch B 박제 리뷰 (2026-06-14) — 🔴 CHANGES 요청 (미커밋)
대상: globals.css(+97) / stats·calendar·scrim page.tsx / team-invite-client.tsx / court-submit-form.tsx / saved-content.tsx. SV1 page.tsx·SE1 diff 0 실측. tsc EXIT=0.

📊 종합 판정: **CHANGES 요청** (critical 0 / **major 1** / minor 1)

✅ 잘된 점 (리뷰 포커스 1~4·6 전부 통과):
- **SV1 데이터 보존 완벽**: `saved/page.tsx` git diff **0줄** 실측. getWebSession 인증·userId 기반 본인조회(IDOR 없음)·BigInt→string·Date→ISO 직렬화·CATEGORY_LABEL·courts null 필터 전부 보존. saved-content.tsx는 props(boards/courts)만 수신·신규 fetch 0·필터로직(useMemo counts/showBoards/showCourts) 무변경. 시안 더미(games/tns/teams/MONKEYZ) 박제 0 — 실데이터(board_favorites/user_favorite_courts)만 타일, 미지원 4탭=.ex-empty "북마크 준비 중". 인터페이스(SavedBoard/SavedCourt/SavedContentProps) page.tsx export와 1:1 정합.
- **SE1 diff 0 실측**: series/[slug]/page.tsx + series-detail-tabs.tsx git status 미표시(변경 0). 손대지 않음.
- **mock 0 (ST1/CA1/SC1/TV1)**: 4화면 전부 "use client" 제거→server화. 더미 상수(TOTALS/EVENTS/OPEN_REQS/ROSTER 등) 전량 삭제, .ex-empty 빈상태만. 가짜 데이터 잔존 0. ST1만 /awards CTA(실라우트).
- **CV1 정적폼 적정**: court_submissions 부재→제출 noop 정확. handleSubmit=alert("준비 중 — …추후 활성화") · INSERT 0 · API 0. "임시저장"/"제보 제출" 둘 다 동일 alert. 편의시설 칩만 useState 토글(시각). dropzone 자리만. 사용자 오인 방지: 헤더 "운영팀 검수 후 추가"·fm-note "검수(2~3일)" 안내로 준비중 명시 OK. page.tsx diff 0.
- **server화 적절·StepWizard 미고아**: 4화면 use client 제거 정당(인터랙션0). StepWizard는 onboarding/series-new/referee-request 등 5곳서 사용 중 — 고아 아님. 타입 안전(tsc EXIT=0).

🔴 필수 수정 (major — 실제 시각 깨짐·CSS 파서 검증으로 입증):
- **[globals.css L6779] CSS 주석 `*/` 조기종료 → `.ex-tabs` 규칙 완전 소실 (SV1 탭 깨짐)**: 주석 토큰 나열 `…--bdr-navy/--accent*/` 에서 `*/` 시퀀스가 L6772 시작 주석을 **조기 종료**. postcss 실파서 결과 `.ex-tabs { display:flex; border-bottom; … }` 의 셀렉터가 깨진 주석 잔여물(`--bg*/--border*/…--accent*/ --ok/--warn…`)로 **오염**되어 무효 셀렉터에 붙음 → **정상 `.ex-tabs` 규칙 0건**(display:flex·border-bottom·margin 소실). 영향: SV1 보관함 탭 줄(7탭)이 flex·언더라인 잃고 세로로 쌓여 깨짐. **수정**: L6779 주석 내 `--accent*/`의 `*/` 인접 제거(예 `--accent·` 또는 `--accent /` 처럼 별표와 슬래시 분리, 또는 토큰 나열에서 `*` 제거). developer 처리 요망.
  - **★연쇄 발견(Batch A·이전 커밋·동일 근본원인)**: 동일 버그가 **L6388**(Batch A 주석 `…--bdr-navy/--ink*/--bg*/`의 `*/`)에도 존재 → **`.ex-page-w { max-width:1080px; margin:0 auto }` 규칙도 완전 소실**(postcss 정상 규칙 0건). `.ex-page-w`는 Batch A/B **전 7화면이 본문 폭 컨테이너로 사용** → 현재 max-width 무효로 모든 박제 화면 본문이 전체 폭 퍼짐. Batch A tester/reviewer가 grep으로 "조기종료 0" 오판(주석 내 `--ink*/` 우연 형성한 `*/` 미검출). **L6388·L6779 둘 다 수정** 필요.

🟡 권장 수정 (minor — 동작 영향 0):
- [globals.css .ex-mono / .sv-tile__bm 등] `color: #fff`·`'Material Symbols Outlined'` 리터럴 직접 사용. --ink-on-brand 토큰 실재(다른 세션 .lc-*는 토큰 사용). 의도색(브랜드 배경 흰글자)이라 시각영향 0이나 토큰 일관성 위해 후속 치환 가능.

발견: SV1/SE1 데이터·diff 보존, mock 0, CV1 정적폼 적정, server화·타입 안전 모두 통과. **단 globals.css 주석 `*/` 조기종료 2건(L6779 신규·L6388 Batch A)으로 `.ex-tabs`·`.ex-page-w` 핵심 클래스 규칙이 postcss 파서 단계에서 소실 — 빌드 산출 CSS에 미반영(grep 아닌 실파서로 입증).** 시각 회귀이므로 커밋 전 수정 필수.

### sync completed 역전 차단 가드 리뷰 (2026-06-14) — ✅ APPROVE (미커밋)
대상: match-sync.ts(L491~504 가드+L505 update) / batch-sync route.ts(L88~101 가드+L103 update). 가드 표현식 두 파일 완전 동일. tsc EXIT=0.

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 1)

가드 룰: `existing.status === "completed" && match.status !== "completed" ? "completed" : match.status` → update data.status 에 effectiveStatus 적용.

✅ 잘된 점:
- **★★ /api/v1 회귀 안전 완벽**: 명시적 `=== "completed"` 비교라 `existing.status`가 null/undefined/"live"/"in_progress"/"scheduled" 일 때 첫 조건 false → effectiveStatus=match.status(들어온 값 그대로). 정상 sync 차단 0. 정방향(scheduled→live→completed)·completed→completed 재sync(둘째 조건 false) 전부 통과. **completed→비completed 역전만** 차단. `??` falsy 함정 없음(null-safe).
- **winner_team_id 독립**: effectiveStatus는 update data.status에만 적용. winnerTeamId는 별도 decideWinnerTeamId(match.status 입력) + update 조건 `winnerTeamId && !== existing`(L511)으로 기존 winner 보존(idempotent). 역전 시 winner 변경 0. 점수/QS 박제와도 독립(status만 고정).
- **알기자 trigger·post-process 영향 0**: L543 trigger·L719 post-process 모두 `match.status === "completed"` 조건 — effectiveStatus 미사용. 역전(completed→in_progress)에선 match.status≠completed라 미발동(정상 — 신규 전환 아님, 이미 completed 시점 처리 완료). dev 노트의 "L528 trigger 미발동=의도" 정확.
- **batch-sync throw 0 정합**: 가드는 effectiveStatus 계산+warn만, throw 없음 → tx.update 정상 커밋 → synced++(L146). FIBA 가드(L76 throw)는 match.status 기반이라 역전 케이스(status≠completed)는 FIBA ok 통과, 충돌 0. 역전 매치 섞여도 다른 매치 정상 처리.
- **로깅 적절**: console.warn은 역전 발생(드문 사고)에만 출력. 정방향/재sync 미출력 → 스팸 아님. 메시지에 matchId·전이방향 포함(운영 추적 가능).
- **응답 shape·schema 불변 / 멱등**: 두 파일 응답 구조 불변. completed→completed 반복 sync 안정(effectiveStatus 항상 completed·winner 보존). 두 파일 가드 표현식 동일·위치 적절(match-sync=update 직전 / batch=tx 내부 update 직전).

🟡 권장 수정 (minor — 가드 범위 밖·후속·동작영향 현행 유지):
- [match-sync.ts L549~562 isReset] **status는 보호되나 reset 경로 PBP/stats 삭제는 미차단**: completed 매치에 `status=scheduled + stats0 + pbp0` sync 시 effectiveStatus=completed로 DB status는 보호되지만, isReset(match.status 기반)=true → PBP/MPS deleteMany 실행됨(L554~558). 단 이는 **가드 도입 전부터 있던 기존 동작**이며 본 가드의 명시 범위(status 역전만)와 분리됨. 실사용상 completed 매치를 scheduled+빈기록으로 sync하는 경로는 비정상 입력이라 빈도 낮음. 완전 방어가 필요하면 isReset 조건에 `existing.status !== "completed"` 추가 검토. 본 PR 범위 밖·후속 판단.

발견: status 역전 차단 핵심 로직 정확·null-safe·회귀 0·winner/trigger/post-process 독립·batch synced 정합. minor 1건은 가드 범위 밖 기존 동작 관찰점. tsc EXIT=0.

### Phase 12 Batch A 박제 리뷰 (2026-06-14) — ✅ APPROVE (미커밋)
대상: globals.css(+391) / RI1(page+content신규) / SF1·CC1·GL1·SH1 page.tsx / AW1 awards-content.tsx. AW1 page.tsx **diff 0 실측 통과**. tsc EXIT=0.

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 2)

✅ 잘된 점:
- **AW1 page.tsx diff 0 의무 통과**: `git diff --stat HEAD -- awards/page.tsx`=공백(변경0). 서버 prisma 쿼리/raw SQL 3종/officialMatchWhere 가드/DTO export 전부 보존. awards-content.tsx만 시각 교체. DTO 계약 무결 — content가 import하는 타입(AwardsDataDTO/PlayerRefDTO)·사용 필드(seasonMvp/scoringLeader/assistsLeader/reboundsLeader/seasons/currentSeasonSlug)가 page.tsx export와 1:1 일치.
- **best5 mock 함정 회피(핵심) 정직**: best5Slots 득점/어시/리바=실데이터(data.*Leader), 수비/신인=player:null→"준비 중" 빈슬롯. catSlots 득점왕/어시왕/리바왕=실데이터, 스틸왕/레이팅/매너상=null→"준비 중". 시안 더미("김지훈" 등) 박제 0. 슬롯 라벨=부문명 정직 표기. MVP 0건→ex-empty 폴백. 모든 metric null-safe(fmtMetric·mvp?.ppg !== null).
- **준비중 3화면 mock 0**: CC1 코치그리드 삭제→ex-empty "코치 매칭 준비 중"(CATS chip은 카테고리 라벨·데이터 아님). GL1 앨범/그리드/lightbox/SVG/이모지 전량삭제→ex-empty "갤러리 준비 중"(server화). SH1 상품/cart/이모지 삭제→Hero 정적(토큰화)+ex-empty "샵 오픈 준비 중". 가짜 데이터 잔존 0.
- **토큰 매핑 정확·실재**: 폐기토큰(--r-*/--err/--err-soft/--ok-hair/--warn-hair) 잔존 0(git diff +라인 grep). 매핑타깃 --warn/--bdr-navy/--accent-deep/--cafe-blue-deep 전부 :root 실재. 9999px/pill 0. CSS `*/` 조기종료 0(검출=정상 주석종료만). 렌더 이모지 0(검출된 이모지는 전부 page.tsx L5 주석의 "삭제한 이모지 목록" — JSX 본문 0). lucide 0.
- **AppNav/라우트 안전**: active prop 조작 0(pathname 자동). 신규 라우트 0. api/v1 0. RI1 CTA href=/referee·/help 실라우트 매핑(시안 #·iu3-help.html 치환), 둘 다 실재 확인.
- **server/client 분리 적절**: RI1 page.tsx(server)=metadata SEO export 보존, 본문 client 위임(FAQ useState). SF1/GL1/SH1 인터랙션0→server 단순화("use client" 제거). CC1 chip useState→client 유지. AW1 content=시즌셀렉터 router.push→client.
- **.page__inner 충돌 회피**: 기존 L5189(margin만) 미변경, base max-width를 .ex-page-w(L6395)로 분리. 정보페이지 공유 회귀 0. 사용 클래스(ri-/sf-/aw-/ex-/co-*) globals 전부 실재.

🟡 권장 수정 (minor — 동작 영향 0, 후속 가능):
- [globals.css 신규블록 .ex-badge--new/.co-card__av/.sf-hero/.aw-hero 등] **`color: #fff` 직접 사용**: --ink-on-brand 토큰이 :root 실재(#FFFFFF)하고 다른 세션(.lc-*)은 이를 사용 중. 신규 블록은 `color: #fff` 직접. 의도색(브랜드 배경 위 흰 글자)이라 동작·시각 영향 0이나, 토큰 일관성 권장은 --ink-on-brand. 후속 일괄 치환 가능.
- [coaches/page.tsx + globals .co-* 14클래스] **CC1 orphan CSS**: CC1이 빈상태(ex-empty)로 가며 .co-card/.co-card__av 등 코치카드 클래스를 page.tsx에서 직접 쓰지 않음. globals에 .co-* 14건 추가됨(향후 실데이터 연결 대비 선이식). 동작 무해·충돌 0이나 현재 미사용 CSS. 후속.

발견: 위 2건 모두 minor·후속·동작영향0. AW1 DTO 계약 무결, best5/준비중 mock 0, 토큰위반 0, server/client 분리 적절, 타입 안전(tsc 0). 다른 세션(.lc-* PR-LINEUP-V2) 항목 미접촉.

### PR-LINEUP-V2 [3] UI 리뷰 (2026-06-14) — ✅ APPROVE (미커밋)
대상: ttp-row.tsx / lineup-confirm-form.tsx / page.tsx / globals.css(.lc-* +). tsc EXIT=0.

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 2)

✅ 잘된 점:
- snake_case 3계층 정합 정확: page 서버 prisma camel(captainTtpId, select L163) → prop snake(captain_ttp_id, L207, apiSuccess 미경유 server component인데 prop명 snake 통일 OK) → form 읽기 snake(L120). POST body=captain(camel, 클라 송신키 L224). GET/DELETE fetch 응답 snake. 계층 일관성 확보 — 재발6회 함정 회피.
- 이중 가드 정상: UI canConfirm=ready && captain!==null && !isLocked && !isPending(L142) 1차 + API 7-3 captain==null→422(route L384) 2차. 방어 심층 OK.
- 3상태 순환 경계 정확: out→선발(<5)/벤치(=5)·starter→벤치(<7)/out(만석)·bench→out. 정원12 만석 시 out 진입 차단(L158). **out 전환 시 captain===p.id면 자동 해제(L171)** — 주장⊆출전 불변식 유지. clearAll/DELETE도 captain null 동기화.
- undo 스택: snapshot이 {roles, captain} 동시 캡처(L146) → undo가 둘 다 복원(L199~200). captain 정합 깨짐 0. 확정/DELETE 성공 시 history 비움(메모리 정리).
- 토큰 매핑 전부 실재: --color-error는 globals.css L2785/2813에서 var(--danger) 매핑 정의됨(dev 노트의 "--err→--color-error 실재" 정확). --accent/--accent-soft/--accent-hair/--ok/--warn/--ink-on-brand/--cafe-blue/--radius-card/--radius-chip 전부 :root 실재. 선발·주장=--accent(의도된 빨강) 적정. .lc-* 블록 하드코딩 hex/lucide/9999px 0(원형 50%만 사용 — 룰 준수).
- 회귀 보존: 데이터패칭(page select만 +captainTtpId)·라우트·isLocked(L91)·DELETE(L244)·상대팀 미노출(mySide만 prop) 유지. /api/v1 변경 0.

🟡 권장 수정 (minor — 동작 영향 0, 후속 가능):
- [ttp-row.tsx L110~123] **button-in-button (HTML/a11y 유효성)**: C 토글이 `<span role="button">`인데 행 전체 `<button>` 내부에 중첩됨. interactive 요소 중첩은 HTML 사양 위반(브라우저가 DOM 재구성할 여지). stopPropagation으로 동작은 정상이나, 행을 `<div role="button" tabIndex={0}>` + onKeyDown(Enter/Space)로 바꾸거나 C 버튼을 행 밖으로 빼면 유효해짐. 현재 키보드 사용자는 행 button만 포커스되고 C span은 탭 도달 불가(클릭 전용).
- [lineup-confirm-form.tsx L142, 358] **captain 게이트 메시지 일관성 미세**: canConfirm은 captain 필수지만, lc-board__badge--ready 조건(L358 `ready && captain`)과 confirmed lineup 로드 시(기존 captain=null인 구 데이터) 재확정 들어오면 badge가 "선발 진행중"으로 표시될 수 있음. 동작(확정 차단)은 정상 — 표시 라벨만 미세. 후속.

발견: 위 2건 모두 minor·후속. 기존 검증 우회 0, 상태관리 race 0, 타입 안전 OK, undo 메모리 누수 0(확정/DELETE 시 클리어).

(Phase 10 5시안 전부 APPROVE — 완료 Phase 압축)

## 보류 중 (재개 대기)
- **7f28 5차 뉴비리그 #301 결선 슬롯** — 잘못생성 결선 8건(296~304 중 #301 제외·기록0)은 ✅ 삭제완료(2026-06-14·트랜잭션). #301(스나이퍼vs오름 40:52·pbp271·mps20)은 사용자 결정으로 **보존** — 단 여전히 "결승" roundName 오생성 슬롯에 위치(정상 대진 아님). 실제 경기 의미 확정 후 재배치/처리 검토 필요
- **KO Sprint2 (group_cross 자동등록)** — 2개조+ group-aware 크로스 대진 자동생성. Sprint1로 사고는 영구차단됨(편의 기능)
- **IA1 발행 알림 실발송 연동** — 대량 알림 대상 정의 후 createNotification 연동(현재 UI 체크박스만)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| tester | src/lib/services/game.ts (L44) | [후속·기존버그] `where.game_type = parseInt(type)` — 영문 type("pickup"등)→NaN. glossary `/games?type=pickup`·홈 quick-menu 동일 빈결과 가능. 영문↔정수 매핑(PICKUP=0/GUEST=1/PRACTICE=2) 필요. IU3 회귀 아님 | 후속 |
| reviewer | **globals.css L6779** | **[major·필수] 주석 `--accent*/`의 `*/`가 L6772 주석 조기종료 → `.ex-tabs{display:flex…}` 셀렉터 오염·규칙 소실(postcss 입증). SV1 탭 깨짐. `*/` 인접 제거** | **대기** |
| reviewer | **globals.css L6388** | **[major·필수·Batch A연쇄] 동일 `*/` 조기종료 → `.ex-page-w{max-width:1080px}` 소실. 전 7화면 본문폭 무효. 같이 수정** | **대기** |
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
| 2026-06-14 | **PR-MOCK-TO-REAL ① stats 실데이터 연결** (developer) | ✅ /stats 준비중→시안 대시보드+실데이터. MatchPlayerStat(2375행) 단일source+JS시즌가공(UserSeasonStat·ShotZoneStat 0행 우회). 신규 my-season-stats.ts(헬퍼·회귀격리)+stats-client.tsx(시즌셀렉터·3탭·KPI·TREND·클럽순위·로그)+page.tsx server재작성+globals.css `.st-*`(+84). **getPlayerStats diff0**(미변경)·강조색cafe-blue(06-10폴백함정회피)·레이팅"—"·ZONES/SPLIT hide·빈상태4종·옵션A(라우트/api0). 실측 userId=2837=2026 7경기 PPG3.1. postcss 14셀렉터OK(06-14 `*/`0)·tsc EXIT0·하드코딩hex/lucide/9999 0. 4파일(신규2+수정2). 미커밋 |
| 2026-06-14 | **순위표 집계 근본 수정 리뷰** (reviewer) | ✅ APPROVE(c0/maj0/min1). PR-STANDINGS-ROOT-FIX update-standings.ts. ③ `!= null` 느슨비교 안전(schema round_number/bracket_position 둘다 Int?·기존test MockMatch 신규필드 없이 332통과=폴백 입증)·조별격리 NULL폴백 정확·divisionCode분기 미접촉·`/순위/` 흡수동일·시그니처/호출부5종 호환·schema/api0·KNOCKOUT regex false positive 위험낮음(n강/n위전만·예선 group_name기반). minor: RANKING/KNOCKOUT regex 4곳 중복(공통export 후속·동작하는코드 보류). DB재박제(#301)는 범위밖. 미커밋 |
| 2026-06-14 | **Phase 12 Batch B 박제 리뷰** (reviewer) | 🔴 CHANGES(c0/maj1/min1). SV1 데이터보존(page.tsx diff0·인증/IDOR/직렬화·props만·시안더미0)·SE1 diff0·mock0(ST1/CA1/SC1/TV1 server화·.ex-empty)·CV1 정적폼 noop 적정·StepWizard 미고아·tsc0 전부 통과. **★major: globals.css L6779 주석 `--accent*/`의 `*/` 조기종료→`.ex-tabs{display:flex}` 셀렉터 오염·규칙 소실(postcss 실파서 입증)→SV1 탭 깨짐. 연쇄로 L6388(Batch A) 동일 버그→`.ex-page-w{max-width}` 소실(전7화면 본문폭). grep 오판분 실파서로 검출.** L6779·L6388 수정 후 재검 요망. 미커밋 |
| 2026-06-14 | **Phase 12 Batch B 박제 검증** (tester) | ✅ PASS 8/8. mock0(ST1/CA1/SC1/TV1 더미 13종 grep0→.ex-empty·server화 / CV1 제출=alert noop·INSERT0 / SV1 props실데이터·시안더미 박제0·미지원4탭 빈상태)·**diff0 회귀**(saved/page.tsx+series/[slug]/page.tsx+series-detail-tabs.tsx 전부0·데이터패칭/인증/IDOR보존)·토큰위반0(폐기토큰/9999/lucide/hex 0·#fff만 의도색·참조토큰28종 :root실재·`*/`조기종료0·클래스중복정의0)·active prop조작0·720 1열/iOS16px. tsc EXIT0. 미커밋 |
| 2026-06-14 | **Phase 12 Batch B 박제** (developer) | ✅ 7화면. globals.css Batch B 블록 +97(`.ex-tabs`/`.ex-mono*`/`.sv-*`/`.fm-*`+720). ST1/CA1/SC1/TV1=server화·더미전량삭제→`.ex-empty` 준비중 / CV1=`.fm-*` 정적폼(제출 noop alert·INSERT0) / SV1=`.sv-*`/`.ex-tabs` 시각교체(props·필터로직 무변경). **SV1 saved/page.tsx diff0·SE1 page.tsx+series-detail-tabs.tsx diff0 실측**. 7파일 +568/-3608. mock0·하드코딩hex0·폐기토큰0·렌더이모지0·9999·0·lucide0·신규DB/라우트/api/v1 0·active prop조작0. tsc EXIT0. 미커밋 |
| 2026-06-14 | **sync completed 역전 차단 가드 리뷰** (reviewer) | ✅ APPROVE(c0/maj0/min1). /api/v1 회귀안전 완벽(=== "completed" null-safe·정방향/재sync 통과·역전만 차단)·winner/trigger/post-process 독립(effectiveStatus는 data.status에만)·batch throw0→synced++정합·warn 비스팸·두파일 표현식 동일·tsc0. minor: isReset(status=scheduled+빈기록) 경로 PBP/stats 삭제는 가드범위밖 기존동작(후속). 미커밋 |
| 2026-06-14 | **sync completed 역전 차단 가드** (developer) | ✅ match-sync.ts + batch-sync route 2경로에 effectiveStatus 가드. completed→비completed 역전 무시(completed 유지)·console.warn. existing 재사용(DB조회0)·정방향/재sync 회귀0·throw0(synced++보존)·schema/응답shape 불변. tsc EXIT0. 디자인박제 파일 미접촉. 미커밋 |
| 2026-06-14 | **Phase 12 Batch A 박제 검증** (tester) | ✅ PASS 8/8. mock0(CC1/GL1/SH1 더미완전삭제·AW1 실데이터·시안더미박제0)·AW1 page.tsx **diff0**(데이터패칭보존·DTO정합)·토큰위반0(폐기토큰/9999/lucide/렌더이모지 0)·active prop조작0·720 1열/44px/16px·회귀0(②③무변경·.page__inner미변경·클래스18종 CSS정의). tsc EXIT0. lint=Next16 eslint config부재로 실행불가→tsc대체. 미커밋 |
| 2026-06-14 | **Phase 12 Batch B 박제 설계** (planner·read-only) | ✅ 7화면(ST1/CA1/SV1/SE1/TV1/CV1/SC1) 데이터출처 실측+설계서. ★SE1 `[slug]` 존재·이미 박제됨(옵션A/SKIP). schema grep(SELECT0): scrim/court_submission/team_invit 부재 / **SV1=이미 DB연결**(board_favorites+user_favorite_courts→데이터패칭보존) / ST1·CA1·TV1·SC1=준비중 / CV1=정적폼. `Dev/phase12-batchB-bake-plan-2026-06-14.md`. 코드·DB변경0 |
| 2026-06-14 | **Phase 12 Batch A 박제 리뷰** (reviewer) | ✅ APPROVE(critical0/major0/minor2). AW1 page.tsx diff0 통과·DTO계약무결·best5 mock0(수비/신인=준비중)·준비중3화면 mock0·토큰위반0(폐기토큰/9999/조기종료/렌더이모지 0)·active prop조작0·신규라우트0·server/client분리적절·tsc0. minor: ①globals #fff직접(→--ink-on-brand 권장) ②CC1 .co-* orphan CSS. 둘다후속. 미커밋 |
| 2026-06-14 | **Phase 12 Batch A 박제** (developer) | ✅ 6화면(RI1/SF1/CC1/GL1/SH1/AW1) 박제. globals.css +391(토큰치환 .ex/ri/sf/co/gl/sh/aw-*)·RI1 server+client분리(신규 +238)·SF1/GL1/SH1 client→server 더미삭제·CC1 빈상태·AW1 page.tsx **diff0**+content만 v2.31. mock0·이모지0·하드코딩hex0·폐기토큰0·*/조기종료0·tsc EXIT0·lint0. 7수정(+780/-2627)+1신규 |
| 2026-06-14 | **Phase 12 Batch A 박제 설계** (planner·read-only) | ✅ 6화면(RI1/SF1/CC1/GL1/SH1/AW1) 데이터출처 실측확정+설계서. SELECT1회(영향0): GL1·CC1·SH1=준비중 / AW1=실데이터보존(page.tsx diff0). `Dev/phase12-batchA-bake-plan-2026-06-14.md`. 코드·DB변경0 |
| 2026-06-14 | **PR-LINEUP-V2 [3] UI 검증** (tester) | ✅ PASS 11/11. cycleRole 3상태순환·정원12차단·주장필수게이트·undo/전체해제·포지션제거·코칭스태프분리·snake 3계층·회귀6종·토큰0위반·모바일(sticky/720/44/16) 전부 정상. tsc 0. 미커밋 |
| 2026-06-14 | **PR-LINEUP-V2 [3] UI 리뷰** (reviewer) | ✅ APPROVE(critical0/major0/minor2). snake 3계층 정합·canConfirm↔API422 이중가드·cycleRole 경계(정원12·out시 주장해제)·undo {roles,captain} 동시복원·--color-error 실재(=danger)·토큰위반0·회귀보존 확인. minor: ①C버튼 button-in-button a11y ②기존 captain=null lineup 재확정 badge라벨. 둘다 후속·동작영향0. 미커밋 |
| 2026-06-14 | **PR-LINEUP-V2 [3] UI 박제** (dev) | ✅ ttp-row(행순환+C+포지션제거)·form(roles맵+주장필수+undo+코칭스태프바+5슬롯)·page(select+prop)·globals.css(.lc-* +269). 4파일 +869/-462. 토큰위반0·tsc 0·/api/v1·데이터패칭0. 미커밋 |
| 2026-06-14 | **PR-LINEUP-V2 4단계 박제 설계** (planner·read-only) | ✅ 설계서+회귀가드R1~11·schema diff(ADD captain_ttp_id)·role실측(manager 0). `Dev/lineup-v2-bake-plan-2026-06-14.md` |
| 2026-06-14 | **5차 뉴비리그 잘못생성 결선 8건 삭제** (pm) | ✅ 7f28 결선 296~304 중 #301(기록 pbp271·보존) 제외 8건(기록0) 트랜잭션 삭제. matches_count 15→7. 다중가드(id기준·8건초과·사후검증) 통과·임시스크립트 정리 |
| 2026-06-14 | **Phase 10 IU3/IU1/IA1 push+머지** (pm) | ✅ subin push→PR#679(dev)→#680(main `1d9f125`). 전 브랜치 동기화·미푸시0 |
| 2026-06-14 | **Phase 10 IA1 AdminNews(A안) 박제+검증** (dev/tester/reviewer) | ✅ `eb84cc7` 신규라우트 compose·기존검수 보존·알림보류. PASS8/8·APPROVE(min2) |
| 2026-06-14 | **Phase 10 IU1 About 박제+검증** (dev/tester/reviewer) | ✅ `efa113f` 운영진§6 실명0·통계 mock0. PASS7/7·APPROVE(min1) |
| 2026-06-14 | **Phase 10 IU3 Help+Glossary 박제+검증** (dev/tester/reviewer) | ✅ `a9e0af8` A-Z용어사전·redirect0. 7통과+1조건부·APPROVE(min2) |
| 2026-06-14 | **대회삭제 main 머지** (pm) | ✅ hotfix 분리(cherry-pick 대신 파일이전)→PR#675(dev)→#676(main `f2fecc7`) |
| 2026-06-14 | **Phase 10 IU4/IU2 박제+검증** (dev/tester/reviewer) | ✅ `4b55d3a`/`4c73dfd` 평점분포BG2·뉴스 cross-domain. PASS·APPROVE |
| 2026-06-14 | **Phase 10 §0 선택sync** (pm) | ✅ `9c8868f` BDR-current v2.30 Phase10 14파일·②③보존 검증 |
