# BDR v2.42 델타 — 데이터 정합 & 배선 교정 (구현 상세)

> **이 델타 = "마지막 전체 패키지(BDR v2.42 폴더) 이후" 변경분만.**
> 작성일 2026-06-26 · 적용 대상: `Dev/design/BDR v2.41-admin-toss/`
> 목적: 공개 토너먼트 사이트를 **관리자 데이터와 단일 source** 로 통일하고, 구현 시 **mock 데이터 없이** 배선되도록 source 경로를 필드 단위로 확정.

---

## 0. 변경 파일 (3건)

| 파일 | 변경 종류 | 한 줄 요약 |
|---|---|---|
| `data.jsx` | 🔴 **데이터 버그 교정** | `WS.matches` 샘플 4건이 로스터에 없는 팀명 참조 → 실재 팀 + `homeId/awayId` 로 교정 |
| `public-site-data.jsx` | ➕ **배선 메타 추가** | `PSITE.wiring{ bind, placeholder }` — 필드별 source 경로 & 하드코딩 금지 표식 |
| `PUBLIC-SITE-DATA-MAP.md` | ➕ **§7 배선 감사** | 감사 결과 + bind/placeholder 표 |

> 나머지 v2.42 산출물(`public-site-preview.html`, `admin-state-preview.html`, 문서 등)은 직전 전체 패키지와 동일 — 본 델타에 미포함.

---

## 1. 🔴 data.jsx — WS.matches 팀명 버그 (필수 교정)

### 1-1. 문제
관리자 워크스페이스의 결과 기록 샘플(`window.WS.matches`) 4건이, **44팀 로스터(`WS.teams`)에 존재하지 않는 팀명**을 참조하고 있었음:

```
강남 불스 · 송파 레이커스 · 마포 워리어스 · 용산 썬더 · 성동 호넷츠   ← 로스터에 없음
```

→ 실 구현에서 경기가 실재 팀 레코드를 못 가리켜 **조인 실패 / 빈 팀 표시 / FK 위반** 발생. 코드 전수 대조(team 44 vs match home/away)로 검출.

### 1-2. 교정 (before → after)

| 경기 | before home / away | after home / away | 종별 | 비고 |
|---|---|---|---|---|
| m1 | 강남 불스 / 송파 레이커스 | **송파 불스(t1) / 서초 호넷츠(t5)** | open | 종료 78:65 |
| m2 | 마포 워리어스 / 용산 썬더 | **마포 레이커스(t2) / 동작 팰컨스(t10)** | open | 예정 |
| m3 | 강남 불스 / 미정 | **송파 불스(t1) / 미정(null)** | open | 8강 대기 |
| m4 | 용산 썬더 / 성동 호넷츠 | **양천 불스(t17) / 구로 레이커스(t18)** | ama | 진행중 |

### 1-3. 핵심 변경 — `homeId/awayId` 신설
각 경기에 **팀 ID 참조** 추가. 구현 시 경기는 팀명 문자열이 아니라 **ID 로 조인**:

```js
// after (data.jsx)
{ id: "m1", ..., division: "open",
  homeId: "t1", awayId: "t5",
  home: "송파 불스", away: "서초 호넷츠",   // 표시용 캐시 — 진실의 원천은 id
  hs: 78, as: 65, status: "completed", winner: "home", at: "2026-06-15" },
```

**구현 규칙**: `home/away` 문자열은 표시용 캐시일 뿐, **진실의 원천은 `homeId/awayId`**. 팀명은 `teams` 조인으로 렌더 (팀명 변경 시 자동 반영). `away: "미정"` / `awayId: null` = 상위 라운드 미확정 슬롯.

### 1-4. 회귀 확인 (완료)
- 전체 검색: 교정 전 5개 고아 팀명 잔존 참조 **0건**.
- `summary.teamCount=44`, `matchCount=27` 불변 — 카운트 영향 없음.
- 패널 렌더(`panels-ops`/`schedule`/`bracket`)는 `home/away` 문자열 사용 → UI 무변.

---

## 2. ➕ public-site-data.jsx — 배선 메타 (`PSITE.wiring`)

공개 사이트 데이터에 **필드별 source 경로**를 기계 표식으로 추가. 구현 개발자가 이 객체만 보고 "그대로 배선" vs "API 대체"를 구분.

```js
window.PSITE = { meta, divisions, schedule, bracket, finalResult, STATES, FORMAT_LABEL, wiring };
```

### 2-1. `wiring.bind` — 실 source 직결 (그대로 배선)
관리자 저장값에서 **1:1 로 읽는** 필드. 시안 값 = 실 값 구조 동일.

| 공개 필드 | 관리자 source |
|---|---|
| `meta.name` | `tournament.name` |
| `meta.period` | `tournament.dates[]` (min~max) |
| `meta.venue` | `tournament.venues[].name` |
| `meta.teamCount` (=44) | `count(teams where status='approved')` |
| `meta.matchCount` (=27) | `count(matches where published)` |
| `meta.divisionCount` (=4) | `divisions.length` |
| `divisions[].label/cap/format` | `divisionRules[].label/cap/format` |
| `divisions[].teams[]` | `teams where category=code & status='approved'` (name/seed/group) |
| `STATES[].sec` | `tournament.publishedSections[] + status` (가시성 제어) |

### 2-2. `wiring.placeholder` — 시연값 (**하드코딩 금지, API 주입**)
본 시안에 박힌 값은 **데모용**. 구현 시 반드시 API 결과로 대체:

| 공개 필드 | 시안 시연값 | 구현 source |
|---|---|---|
| `schedule[]` | 페어/시간/코트 샘플 | `matches where published` — 일정엔진·대진 산출 |
| `schedule[].hs/as` | 78:65 등 | `match.homeScore / awayScore` (기록 완료분만) |
| `bracket.rounds[]` | 8강~결승 샘플 | `bracket.publishedVersion` 산출 (조 1·2위 교차) |
| `finalResult.champion/runnerUp/third` | 송파 불스 등 | 종료 집계 `standings` 1·2·3위 |
| `finalResult.mvp` | 김도윤 | `tournament.mvp` (수동 선정 or 스탯 산출) |
| `finalResult.hasStats/hasArticle` | false | 보유 플래그 — **false면 "준비중", mock 생성 금지** |

### 2-3. 구현 규칙 (mock 제거)
1. `placeholder` 배열은 **빈 배열로 초기화** 후 API 결과 주입. 시안의 샘플 객체를 그대로 ship 하지 말 것.
2. **발행 안 된 섹션은 채우지 않음** — §3 가시성(`prep`/`hide`)으로 비노출. 빈 값을 노출용으로 채우는 패턴 금지.
3. 스코어/우승/MVP/기사는 **데이터 미존재 = "준비중"** 으로 표기. 가짜 기록 생성 절대 금지(BDR 룰9).

---

## 3. 발행 상태 → 섹션 가시성 (구현 핵심 로직)

공개 노출은 "발행된 섹션만". 상태별 5섹션(overview/teams/schedule/bracket/results) 가시성:

| 상태(`STATES[].id`) | overview | teams | schedule | bracket | results |
|---|---|---|---|---|---|
| `before` 모집 전 | show | hide | prep | hide | hide |
| `reg` 모집 중 | show | partial | prep | hide | hide |
| `predraw` 대진 생성 전 | show | show | prep | prep | hide |
| `drawn` 생성 후 미발행 | show | show | prep | prep | hide |
| `published` 대진 발행 후 | show | show | show | show | hide |
| `live` 진행 중 | show | show | show | show | partial |
| `ended` 종료 | show | show | show | show | show |

- `show` = 노출 · `partial` = 일부(teams=승인팀만 / results=종료 후) · `prep` = "준비중" placeholder · `hide` = 탭 자체 비노출.
- 구현: `tournament.publishedSections[]` + `status` 로 위 매트릭스를 산출 → 섹션 컴포넌트 렌더 게이트.

---

## 4. 구현 체크리스트 (이 델타 적용 시)

- [ ] `matches` 는 `homeId/awayId` (FK) 로 팀 조인 — 팀명 문자열 하드코딩 금지
- [ ] `away=미정 / awayId=null` 슬롯 = 상위 라운드 미확정 처리
- [ ] 공개 `schedule/bracket/finalResult` 는 API 결과 주입 — 시안 샘플 ship 금지
- [ ] 스코어·우승·MVP·기사: 데이터 없으면 "준비중", 가짜 생성 금지
- [ ] 섹션 노출은 발행 상태 매트릭스(§3)로 게이트 — 미발행 비노출
- [ ] 공개 수치 = 44팀 / 27경기 / 4종별, 관리자와 단일 source

---

## 5. 적용 순서 (운영 코드 반영 시)

1. `data.jsx` 교정분 반영 → `matches` 스키마에 `homeId/awayId` 추가, 시드/샘플 데이터 팀 참조 정합.
2. 공개 API 응답을 `PSITE.wiring.bind` 경로대로 매핑(직결).
3. `PSITE.wiring.placeholder` 항목은 실 집계/대진/일정 API 로 연결 — 빈 배열 초기화 후 주입.
4. 발행 상태 매트릭스(§3)를 섹션 렌더 게이트로 구현.
5. QA: 7상태 전환 시 비노출 섹션에 데이터가 새지 않는지 확인(`public-site-preview.html` 데모 바로 재현).
