# TOURNAMENT-OPS-STATES.md — 대회 운영 상태표 (v2.42)

> workspace 셸 + 패널별 상태(idle/dirty/saving/saved/error/empty/permission/mobile/destructive) 명세.
> 운영 미존재 데이터는 저장 완료처럼 보이지 않게 — `NEW FIELD NEEDED`(DATA-CONTRACT.md)·disabled·"준비중" 처리.
> 표식: ✅ 시안 구현 · ➕ 보강 제공(admin-state) · ⚠ 구현 시 적용 · — 해당 없음

---

## 0. 공통 상태 컴포넌트 (admin-state.jsx / `st-*`)
loading=`Skel/SkelTable` · error=`ErrState` · saving=disabled+spin · saved=`ts-toast`+dirty reset · permission=`PermState` · mobile=`st-phone` · destructive=`Modal`+danger. 상세 = `ADMIN-TOSS-STATE-QA.md`.

---

## 1. 워크스페이스 셸 (OperateWorkspace)

| 상태 | 동작 |
|---|---|
| idle | 헤더(상태 pill 진행중/D-day/참가팀·종별) + 6메뉴 + 첫 탭(참가팀) |
| 탭 전환 | `op-menu__item[data-active]` · `window.scrollTo(0)` · 본문 교체 |
| empty(신규 대회) | ⚠ 팀/대진/일정 0 → 각 패널 empty CTA로 위임 |
| permission | ⚠ owner/admin/staff별 탭 노출·액션 제한 (DATA-CONTRACT admins) |
| mobile 390 | 6메뉴 줄바꿈/스크롤 · 카드 1열 · 표 가로 스크롤 |
| 수정 진입 | "대회 정보 수정" → `대회 수정.html` |

---

## 2. 참가팀 (TeamsPanel)

| 상태 | UI |
|---|---|
| 승인/대기/거절 | `ct-pill[data-tone]` (TEAM_TONE) · 행 액션 분기(대기:승인·거절 / 승인:거절 / 거절:승인으로) |
| 대기번호/정원초과 | `대기 N번` pill · 종별 현황 `정원 초과` (ct-pill err) |
| 코치 미입력 | `coach_pending`(via=admin & players=0) → "코치 입력 대기" pill |
| 납부 상태 | TeamModal select 미납/납부/환불(PAY_LABEL) · 납부=자동 승인(시연) |
| 선수 없음 | TeamModal "등록된 선수가 없습니다" → 일괄 입력 CTA |
| import 성공/오류 | ImportModal 줄단위 파싱 카운트 · "기존 명단 삭제 후 입력" 체크 |
| 토큰 재발급 | TeamModal "토큰 재발급"(시연) · 상단 "토큰 파일 받기"/"카톡 문구 복사" |
| saving/saved | ⚠ 승인·납부·import 시 disabled+toast |
| mobile | 행 줄바꿈 · stat 4열 유지 |

## 3. 대진표 (BracketPanel)

| 상태 | UI |
|---|---|
| 팀 부족 | 2팀 미만 → 추첨 버튼 disabled · config 안내 |
| config | 대회 방식·조 설정 카드 + 방식 배지 |
| 조별리그 | 조 편성(bk-group) + 조별 경기수 |
| 싱글 토너먼트 | 슬롯 T1.. + bk-tree + 1R 드래그 스왑 |
| 듀얼토너먼트 16 | 4조 더블엘리미(bk-dualrow 5경기/조) + 최종전 + 1·2위 본선 |
| seeding | 슬롯 클릭 팀 지정 → "시드 완료 → 랜덤 추첨" |
| 기존 경기 존재 | ⚠ 재생성 경고 + 버전(생성 N/maxFree dots) — `WS.bracket.currentVersion/maxFree` |
| 버전 3회 제한 | dots UI(`b.maxFree`) |
| 종별 다중 | 종별 칩 전환 · 종별별 독립(✓) |
| 일정 반영 | "일정에 반영" → `__BRACKET` 발행 + `bracket:publish` |

## 4. 일정 (SchedulePanel)

| 상태 | UI |
|---|---|
| 경기 없음 | `ct-emptybox` + 자동생성/직접배치 CTA |
| 대진 반영됨 | `bk-fromnote` 안내 + 종별 경기수 |
| 다중 날짜 | lane = 코트@날짜 · `buildLanes` |
| 다중 체육관/코트 | 코트약어(venueAbbrev)+번호 · lane head |
| 자동 배정 | AutoModal 코트별 종별·예선/토너먼트 칩 → `runAuto` |
| 수동 배정 | ManualModal 풀→코트 드래그 · 순서 변경 · 휴식 삽입/삭제 |
| 저장 성공/실패 | ⚠ 저장 시 toast / 실패 배너 |
| mobile | 표 가로 스크롤 · 설정 그리드 1열 |

## 5. 경기 (MatchesPanel)

| 상태 | UI |
|---|---|
| 예정 | 점수 0:0 · 일정/코트 · `MATCH_STATUS` 예정 |
| 진행 | 진행 pill · 기록 모드 카드(기록앱/전자기록지/진행중 카운트) |
| 종료 | 스코어 · 승자 강조 · 종료 pill |
| 필터 | 종별/체육관 chip(2+ 일 때) |
| ScoreModal | 홈/원정 점수 · 상태 select · 기록 방식(기록앱/전자기록지) |
| 전자기록지 | mode=paper → "전자기록지 열기" CTA |
| 변경 필드만 저장 | ⚠ ScoreModal onSave는 변경분(hs/as/status)만 patch |
| 삭제 | ScoreModal "삭제"(danger) |
| error/saving/saved | ⚠ admin-state 패턴 적용 |
| mobile | amt-table 가로 스크롤 |

## 6. 기록원 (RecordersPanel)

| 상태 | UI |
|---|---|
| 기록원 없음 | "등록된 기록원이 없습니다" + 이메일 추가 |
| 추가/초대 실패 | ⚠ 이메일 검증 실패 인라인 에러 |
| 경기별 배정 | 경기 행 select(미배정/기록원) |
| 자동 배정 | round-robin(`i % active.length`) · 미배정 카운트 |
| 미배정 경고 | ⚠ `unassigned` → warning badge |

## 7. 사이트 (SitePanel)

| 상태 | UI |
|---|---|
| 미생성 | 3스텝 위자드(템플릿→색상→발행) StepDots |
| 작성중(임시저장) | step3 "임시 저장"(시연) |
| 발행 완료 | 공개 URL + 비공개 전환 + 수정 카드 |
| 서브도메인 중복 | ⚠ `NEW FIELD NEEDED`(중복 검사 API) → error state |
| 공개 preview | 관리자=Toss / 공개=BDR (분리) — public-site-preview.html |

## 8. 운영진 (AdminsPanel)

| 상태 | UI |
|---|---|
| 운영진 없음 | 추가 폼만 |
| 역할 선택 | select 관리자/스태프/기록원 (+owner) ROLE_LABEL |
| 제거 | owner 제외 "제거" |
| 권한 부족 | ⚠ 권한 없는 액션 disabled/PermState |

## 9. 정산 (Settle)

| 상태 | UI |
|---|---|
| 요약 | 입금/지출/잔액 3카드(색상 분기) |
| 입금 현황 | 팀별 참가비·납부 pill |
| 지출 | 지출 행 + "지출 추가"(⚠ NEW FIELD: expenses) |

---

## 10. 반응형 분기 기준 (요약 — 상세 RESPONSIVE-QA.md)
- **390/720**: 표 = `amt-table-wrap` 가로 스크롤, 그리드 1열, 모달 풀폭, input 16px, 버튼 44px
- **1024**: 카드 2열 그리드 전환
- **1440**: 시안 기준 최대 폭
