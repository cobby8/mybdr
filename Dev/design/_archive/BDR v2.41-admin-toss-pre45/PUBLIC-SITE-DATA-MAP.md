# PUBLIC-SITE-DATA-MAP.md — 공개 사이트 ↔ 관리자 데이터 대응표 (v2.42)

> 목적: 공개 토너먼트 사이트가 관리자 워크스페이스와 **단일 source**를 쓰는 것으로 보이도록,
> 관리자 입력 → 저장 API → 공개 API/site → 공개 화면 필드 흐름을 정의.
> 기준: **BDR 서머 오픈 #4 = 44팀 / 27경기 / 4종별** (38팀 fiction 폐기).
> 시안 파일: `public-site-preview.html` · `public-site-data.jsx`

---

## 0. 데이터 흐름

```
관리자 입력 (TournamentWorkspace, window.WS / data.jsx)
        │  저장
        ▼
저장 API (운영 src — 본 시안에서 미수정)
        │  발행(publish) 토글
        ▼
공개 API / site (window.PSITE = WS 파생)
        │  발행된 섹션만
        ▼
공개 화면 (public-site-preview.html — BDR 13룰)
```

핵심 원칙
1. 공개 필드는 전부 관리자 입력값 파생 — 공개 사이트 독자 mock 금지.
2. 노출 단위는 "발행된 섹션". 미발행 = 숨김 또는 "준비중".
3. mock 을 운영 저장 완료처럼 표기하지 않음 (발행 상태로 가시성 제어).

---

## 1. 대회 메타

| 공개 표시 | 공개 필드 (`PSITE.meta`) | 관리자 source (`WS`) | 비고 |
|---|---|---|---|
| 대회명 | `name` | `tournament.name` / `form.name` | "BDR 서머 오픈 #4" |
| 시리즈 | `series` | `form` 시리즈 | |
| 주최 | `org` | `form.host` / `organizer` | |
| 기간 | `period` | `form.dates[]` | 06.15 ~ 06.22 |
| 장소 | `venue` | `form.venues[]` | 장충 · 잠실학생 |
| 참가팀 수 | `teamCount` = **44** | `summary.teamCount` | v39 보정 기준 |
| 정원 | `maxTeams` = 44 | `form.maxTeams` | |
| 종별 수 | `divisionCount` = 4 | `summary.divisionCount` | |
| 경기 수 | `matchCount` = **27** | `summary.matchCount` / `matchStats.total` | |
| 상태 | `STATES[].statusLabel` | `summary.statusLabel` + 발행 진행도 | §4 |
| 서브도메인 | `subdomain` | `site.subdomain` | bdr-summer-4 |

---

## 2. 종별 (divisions)

`PSITE.divisions` ← `WS.divisionRules` (1:1)

| 공개 표시 | 공개 필드 | 관리자 source | 값 |
|---|---|---|---|
| 종별명 | `label` | `divisionRules[].label` | 오픈부 / 아마추어부 / U18 / U15 |
| 정원 | `cap` | `divisionRules[].cap` | 16 / 12 / 8 / 8 (합 44) |
| 진행방식 | `format` → `FORMAT_LABEL` | `divisionRules[].format` | 조별리그+토너먼트 / 풀리그 / 토너먼트 / 듀얼토너먼트 |
| 팀 수 | `teams.length` | `WS.teams` 중 `category===code && status==='approved'` | 16 / 12 / 8 / 8 |

---

## 3. 참가팀 / 일정 / 대진 / 결과

| 영역 | 공개 필드 | 관리자 source | 발행 게이트 |
|---|---|---|---|
| 참가팀 | `divisions[].teams[] {name,seed,group}` | `WS.teams` (status=approved) | `teams` 섹션 발행 |
| 일정 | `schedule[] {date,phase,games[]}` | `WS.matches` (발행분) | `matches.published` |
| 경기 상태 | `games[].status` | `WS.matches[].status` | completed/in_progress/scheduled → 종료/진행/예정 |
| 스코어 | `games[].hs / as` | `WS.matches[].hs / as` | live·ended 에서만 노출 |
| 대진 | `bracket.rounds[]` | `WS.bracket` (조 1·2위 교차) | `bracket.published` |
| 최종 결과 | `finalResult {champion,runnerUp,third,mvp}` | 종료 처리 시 집계 | `status==='ended'` |
| 스탯/기사 | `finalResult.hasStats / hasArticle` | 보유 여부 플래그 | **false → "준비중", mock 기사 금지** |

용어 매핑 (BDR 룰14 — UI 한글): `home/away → 홈/원정`, `completed/in_progress/scheduled → 종료/진행/예정`.

---

## 4. 발행 상태 7단계 (`PSITE.STATES`)

각 상태에서 섹션 가시성(`show` / `partial` / `prep` / `hide`):

| # | 상태 | overview | teams | schedule | bracket | results |
|---|---|---|---|---|---|---|
| 01 | 모집 전 | show | hide | prep | hide | hide |
| 02 | 모집 중 | show | partial | prep | hide | hide |
| 03 | 대진 생성 전 | show | show | prep | prep | hide |
| 04 | 대진 생성 후 미발행 | show | show | prep | prep | hide |
| 05 | 대진 발행 후 | show | show | show | show | hide |
| 06 | 진행 중 | show | show | show | show | partial |
| 07 | 종료 | show | show | show | show | show |

- `prep` = "준비중" placeholder + source 주석 (예: `src: matches.published === false`).
- `hide` = 탭 자체 비노출.
- `partial` (teams) = 모집 중 "승인팀만 공개" / (results) = 진행 중 "집계는 종료 후".
- 미리보기에서 상단 데모 바로 7단계 전환 — 동일 데이터가 상태별로 어떻게 보이는지 확인.

---

## 5. 연동 필요 필드 (운영 API — 신설 아님, 매핑만)

> 운영 API/Prisma/라우트 **신설 제안 아님**. 아래는 공개 노출을 위해 기존 저장값에서 읽어야 할 필드 목록.

| 필드 | 용도 | 현재 |
|---|---|---|
| `tournament.publishedSections[]` | 섹션별 발행 토글 (teams/schedule/bracket/results) | 발행 단위 제어에 필요 |
| `match.published` | 경기 단위 발행 여부 | 발행분만 공개 일정에 노출 |
| `bracket.publishedVersion` | 공개에 노출할 대진 버전 | 미발행 시 이전 공개본 유지 |
| `tournament.finalStats` / `finalArticle` | 종료 후 스탯·기사 | 없으면 "준비중" |

---

## 6. 검수 (이 시안)

- [x] 공개 수치 = 44팀 / 27경기 / 4종별 — 관리자와 충돌 없음
- [x] 종별/팀명 = `WS.teams` 와 동일 (38팀 fiction 폐기)
- [x] 발행 전 데이터 비노출 — `prep`/`hide` 로 분리
- [x] mock 기사 미생성 — `hasStats=false` → "공식 기록 준비중"
- [x] BDR 13룰 — Material Symbols, 토큰, AppNav 미적용(별도 서브도메인 사이트), Toss 미적용

---

## 7. 배선 감사 (v2.42 — 구현 시 mock 제거)

> 코드 전수 대조 결과. `PSITE.wiring` 에 동일 내용 기계 표식(bind/placeholder)이 들어 있음.

### 7-1. 발견 & 교정
- 🔴 **교정 완료** — `WS.matches` 샘플 4건이 44팀 로스터에 **없는 팀명**(강남 불스/송파 레이커스/마포 워리어스/용산 썬더/성동 호넷츠)을 참조 → 실재 로스터 팀 + `homeId/awayId`(t1/t5/t2/t10/t17/t18)로 교정. 이제 모든 경기가 실재 팀을 가리킴.
- 🟢 **이상 없음** — 공개 사이트 팀명(`PSITE.divisions[].teams`, `schedule`, `bracket`)은 44팀 로스터와 100% 일치.

### 7-2. bind (실 source 직결 — 그대로 배선)
대회 메타·종별·정원·참가팀(승인)·발행상태 가시성. → §1·§2·§4 + `PSITE.wiring.bind`.

### 7-3. placeholder (시연값 — **구현 시 하드코딩 금지, API 주입**)
| 표시 | 시안 값(시연) | 구현 source |
|---|---|---|
| 일정 페어/시간/코트 | `schedule[]` | matches(published) — 일정엔진·대진 산출 |
| 경기 스코어 | `hs/as` 숫자 | match.homeScore/awayScore (기록 완료분) |
| 결선 대진 | `bracket.rounds[]` | bracket.publishedVersion 산출 |
| 우승/준우승/3위 | `finalResult` | 종료 집계 standings |
| MVP | `finalResult.mvp` | tournament.mvp |
| 스탯/기사 | `hasStats/hasArticle` | 보유 플래그 — false면 "준비중" |

구현 규칙: placeholder 배열은 **빈 배열로 초기화 후 API 결과 주입**. 발행 안 된 섹션은 §4 가시성(`prep`/`hide`)으로 비노출 — mock 값을 채워 노출하지 않음.
