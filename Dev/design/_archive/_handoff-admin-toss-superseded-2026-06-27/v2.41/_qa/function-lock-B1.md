# _qa/function-lock-B1.md — B1 워크스페이스 기능·상태 잠금

> 작성 2026-06-26 · 출처: B1/B1.1/B1.2 운영 src 직접 실측.
> **기능 잠금(function lock)** = 스타일과 무관하게 관리자 시안이 **반드시 재현**해야 하는 화면 동작·상태 분기·데이터 계약. 누락 시 reject.
> 모든 서버 호출은 시안에서 **mock 상태 시연**(실 API/Prisma/라우트 금지). 순수 클라이언트 동작(CSV/클립보드/프린트/파싱/캘린더/필터/토글)은 실제 구현.
> 스타일 잠금은 `admin-toss-style-lock-B1.md` 참조(본 문서는 "무엇을 하는가"만).

---

## A. 워크스페이스 셸 (`TournamentWorkspace`)
- [ ] 상태: `active`(섹션) · `openPanels:Set<PanelId>` · `form` · `lastSavedForm` · `saving`/`saveState`/`message` · `dirty`(=`isFormDirty`).
- [ ] 5섹션 anchor: `info`/`schedule`/`divisions`/`game`/`publish`. `moveTo`=스크롤(offset lg 96·모바일 118)+해시 replaceState. 초기 진입 시 `LEGACY_SECTION_MAP`(setup→info·teams→publish·structure→divisions·matches→game·staff→game) 변환.
- [ ] 요약 4 `OperationShortcut`(참가팀·종별·경기 운영·공개 상태) → `openPanelAndMove(section,panel)`(스크롤+패널 펼침). progress %, `urgentCount`.
- [ ] 2컬럼: 좌 info+game / 우 divisions+publish. `schedule`=info 내 `ScheduleVenue` 블록.
- [ ] 인라인 메가폼 단일 `form`. 저장 3종 UI(요약 inline · lg sticky 하단 · 모바일 fixed 하단). `saveSetup` = mock(검증: roster_min ≤ roster_max). `patchForm`/`setSponsors`/장소·날짜·코트 핸들러(`addVenue`/`updateVenue`/`removeVenue`/`syncDates`/`removeDate`/`toggleDateCourt`).
- [ ] 7 패널 lazy 토글(`togglePanel`). 마운트 맵: game→matches·recorders·admins / divisions→divisions·bracket / publish→teams·site. `matches`만 props(`tournamentId/defaultMode/matchStats`), 나머지 propless. `PanelSummary`(stats+panels 버튼) + `PanelFrame`.

## B. teams 패널
- [ ] 로드: `/teams` + `/admin/.../team-applications`(토큰·코치·경로·납부·종별 매핑) → `tokenMap`. `rosterRule`·`divisionRules`.
- [ ] 등록경로 stat 4(admin/coach_token/self/null). 필터 5(all/pending/approved/rejected/**coach_pending**=admin+선수0). 종별 그룹핑 카드(category, "기타" 마지막).
- [ ] **종별 배정 현황**: `divisionReadiness`(approved/total/cap, overCapacity/ready[≥2]) + 랜덤·시드 **조편성**(`autoDrawDivision`, 승인≥2 가드) + 미배정 경고.
- [ ] 액션(mock): `updateStatus`(승인/거절/변경) · `updatePayment`(paid→자동 승인 토스트 분기) · `updateSeed` · `updateGroup` · `reissueToken` · `saveManager` · `changeCategory`.
- [ ] **TeamDetailModal**: 종별 select · `PaymentBadge`+납부 select(미납/납부/환불) · 코치 inline 편집(tel 링크) · 조/시드 input · 토큰 만료+재발급 · URL 복사 · 승인/거절 · **프린트**(`#team-detail-printable` 전용 CSS) · 선수 명단 table[#·이름·생년월일·학교·포지션·학부모·연락처]+모바일 카드 · 선수 추가/삭제.
- [ ] **ImportPlayersModal**: 카톡 텍스트(`이름/생년월일/등번호/포지션/학교/보호자/연락처`) 파싱→오류 줄→미리보기, overwrite·strict(클라이언트 파싱 실제 구현).
- [ ] 도구: **CSV 다운로드**(BOM) + **카톡 문구 일괄 복사**(클립보드) — 실제 구현. 우상단 toast(3초). `NextStepCTA` currentStep=teams.
- [ ] 배지 헬퍼: `ViaBadge/StatusBadge/PaymentBadge/RosterProgressBadge`.

## C. divisions 패널
- [ ] 로드 `/admin/.../division-rules`(rules·allowed_formats·master/current categories·div_schedule·schedule_dates·places).
- [ ] **종별 구성**: master chip 토글 → 디비전 행(이름·정원·참가비 + 일정 select + 체육관 select[date.court_ids 필터] + 삭제) + `syncDivisions`(결과: 신규/갱신/삭제 N, mock).
- [ ] **룰 카드**: code 칩+라벨+학년/참가비 + 날짜·코트(resolveDivisionSchedule) + **진행 방식 select**(`FORMAT_LABEL` 6 enum) + `GroupSettingsInputs` + **진출 매핑**(`advanceDivision`, 결과 갱신/제외).
- [ ] `GroupSettingsInputs`: 조 크기·조 개수·ranking_format(2조↓ 단판 안내)·advance_per_group. dual=고정(4/2). 총 팀수·총 진출 계산. 가드: `showGroupSettings`/`showRankingFormat`/`shouldShowAdvancePerGroup`.

## D. matches 패널 (= 기록 모드 트리거 + `MatchesClient`)
- [ ] `RecordingModeTriggerClient`(기록 모드 카드/모달: 3택 flutter/paper/manual + scope 3 + 사유≥5 + confirm 영향 N, mock). `matchStats` 5필드(total/paper/flutter/**manual**/inProgress).
- [ ] `MatchesClient`: 로드 `/matches`+`/teams`. 대진표 생성/재생성(`generateBracket`, mock) + `AdvancePlayoffsButton` + `PlaceholderValidationBanner`.
- [ ] **종별 필터**(division_code≥2)·**체육관 필터**(venue≥2) chip, `?division=`/`?venue=` deep link. 라운드 그룹핑(round_number 우선, roundName 폴백).
- [ ] 데스크톱 표(amt-table: 시간·코트·종별·대진·스코어·상태·#) / 모바일 카드. `STATUS_LABEL`/`STATUS_COLOR`.
- [ ] **ScoreModal**: 홈/원정 팀 select(approved) · 점수 · 상태 · 승자 · 일정 · 경기장 · **기록 방식 토글**(flutter/paper, paper→"전자기록지 열기" `/score-sheet/[id]` + 경고). 변경 필드만 PATCH(mock) · 모드 변경=별 endpoint+사유 prompt(mock) · 삭제(mock).

## E. bracket 패널
- [ ] 로드 `/bracket`(canCreate·needsApproval·versions·matches·approvedTeams·format·settings.bracket·divisionRules). `MAX_FREE_VERSIONS=3`.
- [ ] 포맷 분기: `isLeagueFormat`(round_robin/full_league/full_league_knockout) · `isDualFormat`(dual_tournament) · `hasMultipleDivisions`(division_code≥2).
- [ ] 버전 현황(dot 3 + 사용량 + 확정 `activate` + 재생성 `generate`, mock) + 버전 히스토리.
- [ ] **1라운드 팀 배치 편집**(single elim만): home/away select(`updateMatchTeam`, mock), bye 표시.
- [ ] `DualGroupAssignmentEditor`(dual + 16팀 + 매치0): 4조×4슬롯 select + autoSeed + validate(16 unique) + save(`settings.bracket.groupAssignment`+`semifinalPairing`, mock) + 생성.
- [ ] `DualBracketSections`(단일 dual): 5단계 collapsible(조별 미니 더블엘리미/조별 최종전/8강/4강/결승), Stage1 A/B/C/D 그룹핑(`DualGroupedMatches`), `DualMatchCard`(슬롯 라벨·일정·장소·승패).
- [ ] `DivisionBracketSections`(다종별): division 필터 chip + roundName sub-group + `DivisionGenerateButton`(rule 매칭 시) + deep link.
- [ ] 전체 목록(single/league) · empty(승인팀 수·예상 경기 안내). `NextStepCTA` currentStep=bracket.

## F. recorders 패널
- [ ] 로드 `/recorders`(snake_case) + `/matches`. `activeRecorders`=is_active.
- [ ] 기록원 추가(이메일 POST, mock) · 제거(confirm DELETE, mock). 목록 아바타/닉네임/이메일.
- [ ] **경기별 기록자 배정**: `assignRecorder`(settings.recorder_id PATCH, 낙관 갱신, mock) · **자동 배정**(`autoAssign` 라운드로빈, overwrite=false, 미배정만, mock). `unassignedCount`·`recorderNameById`. 빈 상태 분기(경기0/풀0).

## G. site 패널
- [ ] 로드 `/site`(snake_case: is_published·primary_color·subdomain·site_template). 상태: `step`(0~3)·`selectedTemplate`·`selectedColor`·`subdomain`.
- [ ] **3-step 위자드**: ① 템플릿 3(Classic/Dark/Minimal, `TemplateMockup`) ② 색상 8 프리셋 + 미리보기 nav ③ 서브도메인(`[^a-z0-9-]` 정제) + 요약 + 임시저장/공개. step indicator(완료 ✓).
- [ ] **발행 완료 상태**(is_published): 공개 중 카드(`{subdomain}.mybdr.kr`·방문·비공개 전환) + 수정 버튼 3(템플릿/색상/공지). `save`(PATCH, mock)·`togglePublish`(mock)·`handleNextFromStep2`(subdomain 있을 때만 중간 저장).

## H. 생성 마법사 공용 (info/game 섹션 + 새 대회)
- [ ] `ct-schedule-venue`: `VenueSearch`(자동완성 mock `VENUE_DB` + 직접 추가, debounce 250 — 시안은 mock) · `CalendarModal`(다중 날짜, 실제 토글) · `Stepper`(코트 1~8) · `SegSm`(숫자/알파벳) · 날짜별 코트 배정 chip. court id `${venueId}_c${idx}`. 지도/길안내 링크.
- [ ] `ct-game-settings`(controlled `GameRules`): 유니폼 규칙(swap·조끼) + 16색 모달 + 프리셋 + 운영방식/쿼터/연장/막판/샷클락 + `<details>` 파울·타임아웃 + 휴식. `applyGameRulePreset`/`applyGameRuleClockMode`.
- [ ] `division-formats`: 6 enum 라벨 + 가드(`showGroupSettings`/`showRankingFormat`/`shouldShowAdvancePerGroup`/`ADVANCE_PER_GROUP_DEFAULT=2`/`calculateTotalTeams`) 단일 source.

## I. 부속 (B1)
- [ ] `SetupChecklist`(progress+8카드+`PublishGate` 4분기+잠금 toast+depends_on) · `setup-hub-mobile-sticky`(공개 sticky) · `recording-mode-card/-trigger` · `NextStepCTA`(divisions→teams→bracket→matches) · `admins-panel`(관리자/스태프/기록원 추가·목록·제거, ROLE_LABEL owner/admin/staff/scorer).

---

## J. 누락 금지 체크 (시안 완료 후)
- [ ] 위 A~I의 모든 상태 분기·조건부 렌더·empty/loading·모달·필터·토글이 시안에 존재.
- [ ] mock이라도 **상태 전이는 시연**(예: 승인→배지 변경, 토글→패널 펼침, 필터→목록 변화, 저장→dirty 해제).
- [ ] 순수 클라이언트 동작(CSV·클립보드·프린트·캘린더·파싱·필터)은 **실제 작동**.
- [ ] DB 미지원 추정 기능(recorders 자동 배정 등)은 "준비 중" 톤 — 실기능처럼 위장 금지.
