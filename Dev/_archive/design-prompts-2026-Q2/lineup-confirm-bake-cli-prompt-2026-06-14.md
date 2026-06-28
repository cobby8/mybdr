# CLI 의뢰서 — 사전 라인업 확정 앱정합 박제 (PR-LINEUP-V2)

> **작성**: Cowork 2026-06-14. 시안 = `BDR v2 (14).zip` = **v2.31 LC1** (라인업 확정).
> **보존**: `Dev/design/_zips/BDR-v2.31-lineup-confirm-2026-06-14.zip` (HANDOFF.md + LineupConfirm.jsx + lineup-confirm.css)
> **수빈 결재**: ① 모델 = **앱 정합 전면 채택**(3상태/벤치캡/포지션 제거) · ② 주장(C) = **도입**(스키마+API 확장)
> **선행 브리프**: `prompts/lineup-confirm-design-brief-2026-06-13.md`

---

## §0. ★ 본 PR 성격 — 스키마+API+UI 전면 (큰 PR · 단계 분리 권장)

```
시안 LC1 = Flutter 기록앱(bdr_stat_v3 roster_confirm) 모델 정합으로 재설계됨.
현행 웹 2-state(출전+주전) → 앱 3-state(선발/벤치/제외) + 주장(C) + 벤치캡 + 포지션 제거.
→ DB(ADD 1컬럼) + API(검증 확장) + UI(인터랙션 재작성) 3층 동시. 단계 분리 박제 권장.
```

---

## §1. 변경 범위 3층

### 1-A. DB 스키마 — `match_lineup_confirmed` 에 주장 컬럼 ADD (무중단)

```prisma
model MatchLineupConfirmed {
  ... 기존 starters / substitutes 유지 ...
  captainTtpId  BigInt?  @map("captain_ttp_id")   // ★ 신규 — 경기 단위 주장 ttp.id (nullable)
}
```
- **ADD-only nullable** → CLAUDE.md §🗄️ DB 정책 guard 2 "무중단 변경" = `prisma db push` 자동 진행 가능. 단 **schema diff 사용자 1회 검토 후** push (운영 DB 단일).
- 기존 starters(5)/substitutes(=벤치) 의미 유지. captain 은 별도 단일 컬럼.

### 1-B. API — `/api/web/tournaments/[id]/matches/[matchId]/lineup` POST 확장 (web only)

- body 확장: `{ teamSide, starters[5], substitutes[], captain?: ttpId }`
- 검증 추가:
  - **벤치캡**: `substitutes.length ≤ 7` (앱 `_kBenchMax=7`)
  - **정원**: `starters.length + substitutes.length ≤ 12` (앱 정원 12)
  - **주장**: captain 제공 시 `captain ∈ (starters ∪ substitutes)` (출전 선수만) + 해당 teamSide 소속 ttp + is_active
  - 기존: starters 정확히 5 / 중복 0 / ttp 무결성 — **유지**
- GET 응답: lineup 에 `captainTtpId` 추가 (serializeLineup). upsert create/update 에 captainTtpId 반영.
- **응답 snake_case** 주의 (apiSuccess 자동 변환 — 프론트 접근자 `captain_ttp_id`). curl 1회 raw 확인 (재발 함정).
- ⚠️ `/api/v1/**` (Flutter roster, PR5) **변경 ❌** — 본 PR 은 web only. §3 원영 공지만.

### 1-C. UI — `lineup-confirm/[matchId]/_components/` 재작성 (시안 LineupConfirm.jsx 답습)

- **3상태 행 순환** (`_cycleRole`): 제외→선발→벤치→제외. 선발<5 면 선발, 5 차면 벤치 우선.
- **선발 5슬롯 보드** (시안 추가 요소 · PM 승인) + **선발 N/5 · 벤치 b/7 · 정원 12** 카운터
- **주장(C) 버튼**: 경기 단위 단일 토글 · 출전 선수만 · "주장" 태그
- **코칭스태프 바**: role=coach 분리 표시 (명단 제외). role=manager 없음(앱 정합 — 기존 manager 데이터 있으면 coach 취급 또는 제외, 실측 확인)
- **전체 해제** / **실행취소(undo)** (변경 직전 스냅샷 push→pop)
- **포지션 칩 제거** (앱 roster_confirm 정합)
- 잠금/빈명단/팀미배정/성공/에러/처리중 상태 (시안 §6)
- 모바일 하단 sticky 액션 · 720px 분기 · 44px · iOS 16px
- 토큰: 선발·주장=var(--accent) / 벤치=var(--ink-mute) / 정보=var(--cafe-blue). 하드코딩 hex ❌

### 1-D. 시안 BDR-current 동기화 (선택 add)
- `BDR-current/screens/LineupConfirm.jsx` + `lineup-confirm.css` **신규 추가** (additive — ②③ 등 기존 무영향)
- commit: `design(sync): LineupConfirm v2.31 시안 추가`

---

## §2. 박제 순서 (단계 분리)

```
[1] 스키마 ADD captainTtpId (schema diff 검토 → db push) — 단독 commit
[2] API POST/GET 확장 (captain + 벤치캡7 + 정원12) — curl raw 검증
[3] UI 재작성 (3상태/슬롯보드/주장/undo/코칭스태프/포지션제거)
[4] BDR-current 시안 add
```

---

## §3. ★ 원영 공지 (Flutter 정합 — 차단 아님, 사후 공지)

```
· 본 PR = web /lineup 만. /api/v1 roster(PR5) 무변경 → Flutter 빌드 영향 0.
· 단 시안이 기록앱 roster_confirm 모델로 의도적 수렴 (주장/벤치캡/정원). 
  향후 web↔app 라인업 sync 시 captain 정합 필요 → 원영에게 "web 라인업에 주장 도입" 사후 공지.
· 공지 대상 = 원영 (Flutter 기록앱 + /api/v1 담당).
```

---

## §4. Stop conditions

```
· /api/v1/** 변경 (원영 도메인 — 본 PR 범위 밖)
· match_lineup_confirmed 기존 컬럼(starters/substitutes) 의미 변경 / destructive
· prisma migrate reset / db push --accept-data-loss (운영 DB 파괴 — 절대 금지)
· schema diff 미검토 push
· starters 5명 강제 / 중복 0 / ttp 무결성 가드 제거 (기존 검증 회귀)
· 하드코딩 hex / 핑크·코랄·살몬 / lucide / pill 9999px
· 포지션을 못 빼서 시안과 불일치 방치 (앱 정합 = 제거 확정)
· AppNav 재구성
```

---

## §5. 검증 (tester)

```
1. tsc/lint 0
2. 스키마: captain_ttp_id nullable ADD · 기존 데이터 무영향 (count 동일)
3. API: captain 저장/조회 · 벤치>7=422 · 정원>12=422 · captain∉출전=422 · starters≠5=422(회귀) · curl raw snake_case 확인
4. UI: 3상태 순환 정확(선발5초과시 벤치) · 주장 단일 · undo · 전체해제 · 포지션 미표시 · 코칭스태프 분리
5. 상태: 잠금/빈명단/팀미배정/5-5확정활성/주장미지정 안내
6. 모바일 sticky · 720 1열 · 44px
7. 회귀: 기존 라인업(주장 null) 정상 로드 · 다른 페이지 무영향
8. 3001 또는 운영 1회 육안
```

---

## §6. 커밋 / 마무리

```
· commit 분리: ① schema ② api ③ ui ④ design(sync). 또는 PR 1개 단계 커밋.
· decisions.md: "웹 라인업 주장 도입 + 앱(roster_confirm) 모델 정합" 결정 1줄
· errors.md: 해당 시 (snake_case captain 등)
· phase-ledger: 라인업 확정 = 시안커버리지 P1 신규 박제 행 추가
· 원영 공지 1건 (§3) — 사후
· 머지: STAGE B (subin→dev→main)
· 큐 갱신
```

---

## 즉시 시작 명령 (CLI)

```
Read Dev/design/prompts/lineup-confirm-bake-cli-prompt-2026-06-14.md 하고 §2 순서대로(스키마 ADD→API→UI→시안add) 박제해줘. 시안 = _zips/BDR-v2.31-lineup-confirm-2026-06-14.zip 의 HANDOFF.md + LineupConfirm.jsx. 앱정합 전면+주장 도입 확정. schema diff 1회 검토 후 db push. /api/v1 ❌. 결재 default 자동.
```
