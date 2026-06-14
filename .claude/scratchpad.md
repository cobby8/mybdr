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
| 2026-06-14 | **PR-LINEUP-V2 [3] UI 검증** (tester) | ✅ PASS 11/11. cycleRole 3상태순환·정원12차단·주장필수게이트·undo/전체해제·포지션제거·코칭스태프분리·snake 3계층·회귀6종·토큰0위반·모바일(sticky/720/44/16) 전부 정상. tsc 0. 미커밋 |
| 2026-06-14 | **PR-LINEUP-V2 [3] UI 리뷰** (reviewer) | ✅ APPROVE(critical0/major0/minor2). snake 3계층 정합·canConfirm↔API422 이중가드·cycleRole 경계(정원12·out시 주장해제)·undo {roles,captain} 동시복원·--color-error 실재(=danger)·토큰위반0·회귀보존 확인. minor: ①C버튼 button-in-button a11y ②기존 captain=null lineup 재확정 badge라벨. 둘다 후속·동작영향0. 미커밋 |
| 2026-06-14 | **PR-LINEUP-V2 [3] UI 박제** (dev) | ✅ ttp-row(행순환+C+포지션제거)·form(roles맵+주장필수+undo+코칭스태프바+5슬롯)·page(select+prop)·globals.css(.lc-* +269). 4파일 +869/-462. 토큰위반0·tsc 0·/api/v1·데이터패칭0. 미커밋 |
| 2026-06-14 | **PR-LINEUP-V2 [2] API 검증** (tester) | ✅ PASS 13/13. 벤치캡7·정원12·주장필수·멤버십 정합 / 회귀(R1~R4·R6) 삭제·약화 0 / tsc 0 / vitest lineup 13/13 / snake captain_ttp_id 정합 / /api/v1 미변경. 미커밋 |
| 2026-06-14 | **PR-LINEUP-V2 [2] API 박제** (dev) | ✅ lineup/route.ts 주장+벤치캡7+정원12 검증 add-only(+64/-1). 기존검증 전부유지·apiSuccess→captain_ttp_id snake·tsc 0. /api/v1 미변경 |
| 2026-06-14 | **PR-LINEUP-V2 4단계 박제 설계** (planner·read-only) | ✅ 설계서+회귀가드R1~11·schema diff(ADD captain_ttp_id)·role실측(manager 0). `Dev/lineup-v2-bake-plan-2026-06-14.md` |
| 2026-06-14 | **5차 뉴비리그 잘못생성 결선 8건 삭제** (pm) | ✅ 7f28 결선 296~304 중 #301(기록 pbp271·보존) 제외 8건(기록0) 트랜잭션 삭제. matches_count 15→7. 다중가드(id기준·8건초과·사후검증) 통과·임시스크립트 정리 |
| 2026-06-14 | **Phase 10 IU3/IU1/IA1 push+머지** (pm) | ✅ subin push→PR#679(dev)→#680(main `1d9f125`). 전 브랜치 동기화·미푸시0 |
| 2026-06-14 | **Phase 10 IA1 AdminNews(A안) 박제+검증** (dev/tester/reviewer) | ✅ `eb84cc7` 신규라우트 compose·기존검수 보존·알림보류. PASS8/8·APPROVE(min2) |
| 2026-06-14 | **Phase 10 IU1 About 박제+검증** (dev/tester/reviewer) | ✅ `efa113f` 운영진§6 실명0·통계 mock0. PASS7/7·APPROVE(min1) |
| 2026-06-14 | **Phase 10 IU3 Help+Glossary 박제+검증** (dev/tester/reviewer) | ✅ `a9e0af8` A-Z용어사전·redirect0. 7통과+1조건부·APPROVE(min2) |
| 2026-06-14 | **대회삭제 main 머지** (pm) | ✅ hotfix 분리(cherry-pick 대신 파일이전)→PR#675(dev)→#676(main `f2fecc7`) |
| 2026-06-14 | **Phase 10 IU4/IU2 박제+검증** (dev/tester/reviewer) | ✅ `4b55d3a`/`4c73dfd` 평점분포BG2·뉴스 cross-domain. PASS·APPROVE |
| 2026-06-14 | **Phase 10 §0 선택sync** (pm) | ✅ `9c8868f` BDR-current v2.30 Phase10 14파일·②③보존 검증 |
