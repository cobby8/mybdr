# DATA-CONTRACT.md — 화면별 데이터 계약 (v2.42)

> 목적: 운영 코드가 시안을 **실 DB/API로 박제**할 때 필요한 필드를 화면별로 확정.
> 표식: 🟢 운영 존재 추정(그대로 바인딩) · 🔴 `NEW FIELD NEEDED`(현 스키마 미존재 가능 — 추가 검토) · ⚪ 시연/클라이언트 계산값(저장 불필요)
> 원칙: **운영에 없는 데이터를 저장 완료처럼 보이게 하는 mock 금지.** 🔴 필드는 화면에서 hidden/disabled 또는 "준비중" 처리.
> 필드명은 시안 `window.WS`(data.jsx) 키 기준.

---

## 0. API/Prisma/라우트 변경 제안 아님
본 문서는 **매핑·필요 필드 식별만** 한다. 🔴 표식은 "이 값이 화면에 필요한데 현 스키마에 없을 수 있으니 백엔드가 확인" 의 의미. 신규 마이그레이션을 지시하지 않는다.

---

## 1. workspace (OperateWorkspace · summary)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| `tournament.id/name/dDay` | 대회 식별·이름·D-day | 🟢 |
| `summary.teamCount/maxTeams/divisionCount/matchCount` | 집계 | 🟢 (count 파생) |
| `summary.statusLabel/statusTone` | 상태 | 🟢 (status 파생) |
| `summary.siteConfigured/sitePublished/siteSubdomain` | 사이트 게이트 | 🟢 |
| `summary.progressCompleted/progressTotal/missingCount` | 준비 진행도 | 🔴 진행도 산식(필수 단계 충족 수) — 정의 필요 |

## 2. schedule (SchedulePanel)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| `form.venues[] {id,name,region,courtCount,naming}` | 장소·코트 | 🟢 |
| `form.dates[] {id,date,courtIds[]}` | 일자별 사용 코트 | 🟢 |
| `__BRACKET[code].games[]` | 대진 산출 경기(발행분) | ⚪ 대진 publish 산출(2번) |
| 종별 경기시간(分) `divDur` | 종별 경기 길이 | 🔴 종별별 `match_duration_min` — 저장 필드 필요 |
| 코트 시작시간 `laneStart` | lane별 시작 | 🔴 `court_start_time`(date×court) — 저장 필드 필요 |
| 배치/순서/휴식 `assign` | 코트별 경기 순서·break | 🔴 `schedule_slot {matchId, laneKey, order, breakMin}` — 배치 결과 저장 |
| 경기번호(코트약어-MMDD-순번) | 표시용 | ⚪ 클라이언트 생성 |

## 3. bracket (BracketPanel)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| `divisionRules[] {code,label,cap,fee,format,settings}` | 종별 규칙 | 🟢 |
| `settings {group_size,group_count,advance_per_group}` | 조 설정 | 🟢 |
| `teams[] {category,status,name,seed,group,color}` | 참가팀(승인) | 🟢 |
| `bracket {format,currentVersion,maxFree,versions[],activeVersion,approvedCount}` | 대진 버전 | 🟢 (`maxFree` 정책값) |
| 조편성 결과 `assign`(slot→team) | 추첨 결과 | 🔴 `bracket_seed {slot, teamId}` — 추첨 산출 저장 |
| 시드 `seeds`(slot→team) | 시드 고정 | 🔴 `bracket_seed.locked` |
| `leaves`(토너먼트 1R 슬롯) | 트리 구조 | ⚪ 산출(저장은 생성 경기로) |
| publish → `__BRACKET[code].games[]` | 생성 경기 | 🟢 (matches 생성) |

## 4. matches (MatchesPanel)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| `matches[] {id,round,roundName,num,division,venue,homeId,awayId,home,away,hs,as,status,winner,at}` | 경기 | 🟢 (**homeId/awayId = FK, home/away = 표시 캐시**) |
| `status` enum | pending/scheduled/in_progress/completed/cancelled/bye | 🟢 (MATCH_STATUS) |
| `matchStats {total,paper,flutter,manual,inProgress}` | 기록모드 집계 | 🟢 (파생) |
| 경기 기록 방식 `mode`(flutter/paper/manual) | 매치별 기록방식 | 🔴 `match.recording_mode`(대회 기본 + override) — 매치별 저장 필요 |
| `defaultMode` | 대회 기본 기록방식 | 🟢 |
| 변경 사유(모드 변경) | 감사 로그 | 🔴 `match_mode_change.reason` |

## 5. teams (TeamsPanel)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| `teams[] {id,name,color,category,status,via,seed,group,players,paid,waiting,manager,appliedAt}` | 팀 | 🟢 |
| `status` enum | pending/approved/rejected/withdrawn | 🟢 (TEAM_STATUS) |
| `via` enum | admin/coach_token/self | 🟢 (VIA_LABEL) |
| `paid` enum | paid/unpaid/refunded/waived | 🟢 (PAY_LABEL) |
| `waiting`(대기번호) | 대기열 | 🟢 (`allowWaiting/waitingCap` 정책) |
| 코치 토큰 / 재발급 | coach_token flow | 🔴 `team.coach_token {value, expiresAt}` + 재발급 — 토큰 수명 필드 |
| 선수 명단 | 로스터 | 🔴 `player {name,birth,number,pos,school,guardian,phone}` (시안은 더미 생성) |
| import(카톡 텍스트) 파싱 | 일괄 입력 | ⚪ 클라이언트 파싱 → player 생성 |

## 6. recorders (RecordersPanel)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| `recorders[] {id,uid,name,email,active}` | 기록원 풀 | 🟢 |
| 경기별 배정 `match.recorder`(uid) | 매치-기록원 | 🔴 `match_recorder {matchId, uid}` — 배정 저장 |
| 자동 배정(round-robin) | 배정 산식 | ⚪ 클라이언트 |

## 7. site (SitePanel)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| `site {published,subdomain,template,color}` | 사이트 설정 | 🟢 |
| `siteTemplates[] {slug,name,desc,navBg,bg,cardBg}` | 템플릿 | 🟢 (정적) |
| `colorPresets[] {hex,name}` | 색상 | 🟢 (정적) |
| 서브도메인 중복 검사 | 발행 검증 | 🔴 `subdomain unique check` — 검증 응답 필요(중복 시 error) |
| 발행 섹션 가시성 | 공개 노출 | 🔴 `publishedSections[]` (PUBLIC-SITE-DATA-MAP §4) |

## 8. admins (AdminsPanel)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| `admins[] {id,name,email,role}` | 운영진 | 🟢 |
| `role` enum | owner/admin/staff/scorer | 🟢 (ROLE_LABEL) |
| 초대 상태 | invite pending/accepted | 🔴 `admin_invite.status` — 초대 흐름 상태 |
| 권한 매트릭스 | role별 액션 허용 | 🔴 role→permission 매핑 정의(권한 부족 disabled용) |

## 9. settle (Settle)

| 시안 필드 | 의미 | 판정 |
|---|---|---|
| 입금 합계 | `teams.paid='paid'` × 종별 fee | 🟢 (파생) |
| `divisionRules[].fee` | 참가비 | 🟢 |
| 지출 `expenses[] {label,amount}` | 지출 항목 | 🔴 `tournament_expense` — 지출 엔티티(시안은 하드코딩) |

## 10. 생성/수정 마법사 (form / gameRules)

| 시안 필드 | 판정 |
|---|---|
| `form` 전체(name~feeNotes, maxTeams/teamSize/roster, autoApprove/allowWaiting/waitingCap, sponsors, venues, dates) | 🟢 |
| `form.gameRules` 전체(유니폼·쿼터·파울·타임아웃·샷클락…) | 🟢 (기록앱 정합) |
| `emptyForm` | ⚪ 생성 모드 초기값 |

---

## 11. 🔴 NEW FIELD NEEDED 요약 (백엔드 확인 목록)
1. `summary.progress*` 진행도 산식
2. schedule: 종별 `match_duration_min`, `court_start_time`, `schedule_slot`(배치/순서/break)
3. bracket: `bracket_seed {slot, teamId, locked}`
4. matches: `recording_mode`(매치별), 모드 변경 `reason`
5. teams: `coach_token {value, expiresAt}`, `player` 로스터 스키마
6. recorders: `match_recorder` 배정
7. site: 서브도메인 unique check, `publishedSections[]`
8. admins: `admin_invite.status`, role→permission 매핑
9. settle: `tournament_expense`

> 위 🔴 항목은 화면에서 값이 없으면 **저장된 것처럼 보이지 않게** — 빈/disabled/"준비중"으로 표기하고, 시연 토스트(`(시연)`)로 mock임을 명시한다.
