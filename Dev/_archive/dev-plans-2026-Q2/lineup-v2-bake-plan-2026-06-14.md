# PR-LINEUP-V2 — 사전 라인업 확정 앱정합 박제 설계 보고서

> 작성: planner-architect · 2026-06-14 · **read-only 분석/설계만 (코드·DB·db push 0)**
> 의뢰: Cowork 2026-06-14 (수빈 결재: 앱정합 전면 + 주장 도입)
> 목표: 현행 웹 2-state(출전+주전) → 앱(bdr_stat_v3 roster_confirm) **3-state(선발/벤치/제외) + 주장(C) + 벤치캡7 + 정원12 + 포지션 제거**

---

## 0. 한 줄 요약 (PM 보고용)

| 단계 | 변경 대상 | 규모 | 회귀 위험 | DB |
|------|----------|------|----------|-----|
| [1] 스키마 | `MatchLineupConfirmed` +1 컬럼 | ~2 LOC | **0** (NULL ADD-only 무중단) | `ADD COLUMN captain_ttp_id BIGINT` |
| [2] API | lineup/route.ts POST 확장 + GET serialize | ~+70 LOC | **낮음** (기존 검증 전부 유지·추가만) | 0 |
| [3] UI | _components/ 3파일 재작성 | ~+450/-300 LOC | **중** (페이지 전면 재작성 — 데이터 패칭 prop은 보존) | 0 |
| [4] 시안 sync | BDR-current/ additive add | 신규 4파일 | 0 | 0 |

- **manager 처리 결정**: 운영 실측 `role=manager` **0건** (player 1017 / coach 4). → manager 분기 코드 불필요. coach만 코칭스태프 바로 분리, 그 외 전부 선수.
- **schema diff**: `ALTER TABLE "match_lineup_confirmed" ADD COLUMN "captain_ttp_id" BIGINT;` (단일 nullable ADD, push 전 사용자 검토 필수)

---

## (a) 시안 6상태·인터랙션 요약 — bdr_stat_v3 roster_confirm 정합

### 핵심 모델 (LineupConfirm.jsx)
- **역할 3상태 (`LC_ROLE`)**: `out(제외)` / `starter(선발)` / `bench(벤치)`
- **정원 상수**: `LC_STARTER_MAX=5` (`_kStarterMax`) / `LC_BENCH_MAX=7` (`_kBenchMax`) → 정원 12
- **행 단일 탭 순환 (`cycleRole` = 앱 `_cycleRole`)**:
  - `out → starter` (선발<5일 때) **또는** `out → bench` (선발이 이미 5면 벤치 우선)
  - `starter → bench` (벤치<7) **또는** `starter → out` (벤치 만석이면 바로 out)
  - `bench → out`
  - 정원 12 초과(선발5+벤치7 만석)면 out→ 진입 차단
  - out 전환 시 그 선수가 주장이면 **주장 자동 해제** (주장 ⊆ 출전)
- **주장 C (`toggleCaptain` = `setCaptain` 단일강제)**: 행 우측 C 버튼. 같은 팀 1명만. **출전 선수(starter∪bench)만** 지정 가능. 토글식(다시 누르면 해제).
- **코칭스태프 바**: `role=coach`를 명단에서 분리해 감독/코치 칩으로 표시. (시안은 head/asst 2칩이지만 — §e 참조)
- **전체 해제 (`clearAll` = `clearTeamEntry`)**: 모든 역할 out (주장도 정리). 시안 주석상 "출석+선발만 비움"이나 실제 코드는 전부 out.
- **실행취소 undo (`rosterDraft` 스냅샷 스택)**: 변경 직전 `{roles, captain}` push → undo 시 pop 재적용.
- **포지션 칩 제거**: 앱 roster_confirm 행에 PG/SG 없음 → 시안도 제거. (운영 현행엔 포지션 컬럼 있음 → 제거 대상)

### 6+ 인터랙션 상태 (HANDOFF §6 / route 검증 정합)
| 상태 | 표시 | 확정버튼 |
|------|------|---------|
| 선발 미달 | "선발 N명을 더 선택하세요 (현재 N/5)" (warn) | disabled |
| 주장 미지정 | "주장(C)을 지정해주세요" (warn) | disabled(제안) |
| 선발 5/5 | "선발 5명 확정 · 라인업을 확정할 수 있습니다" (info) | 활성 |
| 잠금(status≠scheduled/ready) | "이미 시작된 경기입니다" (err) | 전 입력 disabled |
| 빈 명단 | "등록된 선수가 없습니다" (state) | — |
| 팀 미배정 | "아직 팀이 배정되지 않은 경기입니다" (warn) | — |
| 확정 완료 | "라인업이 확정되었습니다" (ok) | "라인업 재확정" |
| 처리중 | "처리중…" | disabled |

### 시각 요소
- 선발 5슬롯 보드(웹 추가 강점·PM §6-1 승인), 카운터(선발 N/5 · 벤치 b/7), 코칭스태프 바, 3상태 행 리스트, 메시지 배너, 데스크톱 액션 / 모바일 sticky 진행바.
- **강조색(의뢰서 = 시안 토큰 그대로, 이번엔 의도된 빨강)**: 선발·주장 = `var(--accent)`(BDR red) / 벤치 = `var(--ink-mute)` / 정보 = `var(--cafe-blue)` / 경고 = warn / 잠금 = err.
  - ⚠️ errors.md 강조색 폴백 함정과 **구별**: 이번 시안은 HANDOFF §5에서 "선발/주장 = `--accent`(BDR red)"를 **확정 명시**. Tweaks 런타임 inline 주입 없음. → 시안 CSS의 `--accent` 그대로 사용이 정답.

---

## (b) 단계별 변경 명세

### [1] 스키마 — `MatchLineupConfirmed` +1 컬럼 (무중단 ADD-only)

**위치**: `prisma/schema.prisma` L3312~3335 `model MatchLineupConfirmed`

기존 구조(실측):
```
starters      BigInt[]   // 선발 5 (= 앱 starter)
substitutes   BigInt[]   // 벤치 (= 앱 bench). 0건 허용. starters와 중복0
confirmedById BigInt
```
→ **앱 매핑**: `starters`=선발 / `substitutes`=벤치 / "제외(out)"=양쪽에 없음(미저장). **기존 의미 변경 0** — substitutes를 "벤치"로 해석만 추가, 컬럼·타입·이름 불변.

**추가 (substitutes 줄 바로 뒤)**:
```prisma
captainTtpId  BigInt?  @map("captain_ttp_id")  // 경기단위 주장 ttp.id (NULL=미지정). starters∪substitutes 소속 + teamSide + is_active (API 검증)
```

**schema diff 미리보기 (실측, push 아님)**:
```sql
ALTER TABLE "match_lineup_confirmed" ADD COLUMN "captain_ttp_id" BIGINT;
```
- 단일 nullable ADD COLUMN. 기존 row의 captain_ttp_id = NULL 자동. **운영 무중단 100%**.
- 인덱스 불필요(captain은 row 1건 안의 스칼라, 별도 조회 키 아님).
- ❗ push 절차: `prisma db push` 전 위 diff를 사용자에게 보여주고 검토 후 진행. `--accept-data-loss` 절대 사용 금지(불필요 — ADD-only라 data-loss 없음).

### [2] API — `lineup/route.ts` POST 확장 + GET serialize (기존 검증 전부 유지)

**위치**: `src/app/api/web/tournaments/[id]/matches/[matchId]/lineup/route.ts`

**(2-1) `PostBodySchema` 확장 (L57~65)** — `captain?` optional 추가:
```ts
const PostBodySchema = z.object({
  teamSide: TeamSideEnum,
  starters: TtpIdArray.refine((arr) => arr.length === 5, {...}),  // ★기존 유지: 정확히 5
  substitutes: TtpIdArray,                                         // ★기존 유지: 가변
  captain: z.union([z.string(), z.number()]).optional()           // ★신규: 단일 ttpId(옵션)
    .transform((v) => v == null ? null : parseBigIntParam(String(v))),
});
```
- 벤치캡/정원은 zod `.refine`보다 **핸들러 단계 명시 검증**이 메시지 친화적(아래 2-2).

**(2-2) POST 핸들러 신규 검증 (L298 이후 — 기존 검증 블록에 추가만)**:
| 검증 | 위치 | 신규/유지 | 실패 응답 |
|------|------|----------|----------|
| starters 정확히 5 | zod refine L60 | **유지** | 422 "주전은 정확히 5명" |
| starters∩substitutes=∅ | L318~328 | **유지** | 422 "주전과 후보가 중복" |
| starters 자체 중복0 | L330~333 | **유지** | 422 |
| substitutes 자체 중복0 | L334~337 | **유지** | 422 |
| ttp 무결성(소속+is_active) | L339~362 | **유지** (allIds에 영향 없음·captain은 아래 별도) | 422 |
| **벤치캡 `substitutes.length ≤ 7`** | 신규 | **신규** | 422 "벤치는 최대 7명" |
| **정원 `starters.length + substitutes.length ≤ 12`** | 신규 | **신규** | 422 "출전 명단은 최대 12명" |
| **주장 `captain ∈ (starters ∪ substitutes)`** | 신규 | **신규** | 422 "주장은 출전 선수 중에서" |
| **주장 teamSide 소속 + is_active** | 신규 (8번 ttp 무결성 검증에 captain 포함하면 자동 충족) | **신규** | 422 |

  - 구현 팁: L347 `allIds = [...starters, ...substitutes]`에 captain을 합쳐 검증하면 "소속+is_active"가 자동 보장됨. 단 captain은 starters∪substitutes 안에 있어야 하므로(위 주장 검증), 이미 allIds에 포함됨 → **별도 ttp 쿼리 불필요**. 멤버십 검증만 set 비교로 추가.

**(2-3) upsert에 captainTtpId 반영 (L365~385)**:
```ts
create: { ..., captainTtpId: captain ?? null },
update: { ..., captainTtpId: captain ?? null },
```

**(2-4) `serializeLineup` 확장 (L75~96)** — GET/POST 응답 둘 다 영향:
```ts
function serializeLineup(row) {
  return {
    ...,
    captainTtpId: row.captainTtpId == null ? null : row.captainTtpId.toString(),  // ★신규
  };
}
```
- GET의 findMany select(L179)와 page.tsx의 findUnique select(L157~166)에 `captainTtpId: true` 추가.

**(2-5) ★apiSuccess snake_case 함정 (errors.md 재발 6회 — 최우선 주의)**:
- `apiSuccess()`는 응답 전 키를 **snake_case 자동 변환** → 프론트 GET fetch 시 접근자는 **`captain_ttp_id`** (camelCase `captainTtpId` ❌).
- 단, **page.tsx는 server component에서 prisma 직접 조회**(apiSuccess 미경유) → camelCase `captainTtpId` 그대로 읽음. **혼동 금지**.
- POST는 클라→서버 요청 body라 route가 받는 키는 camelCase `captain` 기대(클라가 보내는 대로). serializeLineup 응답 키만 snake 변환 대상.
- 검증 의무: 박제 후 `curl`로 GET raw 응답 1회 확인 — `captain_ttp_id` 키 존재 확인.

**(2-6) DELETE**: 변경 0 (row 통째 삭제 → captain도 함께 사라짐).

### [3] UI — `_components/` 3파일 재작성 (데이터 패칭 prop 보존)

**현행 구조(실측)**:
- `page.tsx` (server) — 세션·권한·매치·ttp·기존 lineup prefetch → prop 직렬화 → `LineupConfirmForm` 마운트. **이 데이터 패칭 로직은 보존** (captainTtpId select +1줄, prop +1필드만).
- `lineup-confirm-form.tsx` (client) — 2-state(activeIds+starterIds Set) + 단일 토글 + POST/DELETE. **재작성 대상**.
- `ttp-row.tsx` (presentational) — 출전 체크박스 + 주전 별 + 포지션 컬럼. **재작성 대상** (행 순환 + C 버튼 + 포지션 제거).

**(3-1) `page.tsx`** — 최소 변경:
- findUnique select에 `captainTtpId: true` 추가(L157).
- `homeTeamProp.lineup`에 `captain_ttp_id` 필드 추가(L197~208). (server prisma 직접이라 camelCase `existingLineup.captainTtpId` → prop엔 snake `captain_ttp_id`로 직렬화, form 타입과 일치)
- 매치 메타/헤더 마크업은 시안 `lc-meta` 스타일로 교체 가능(선택). **기능 변경 0**.

**(3-2) `lineup-confirm-form.tsx`** — 시안 LineupConfirm.jsx 답습 재작성:
| 항목 | 현행 | 신규(시안) |
|------|------|-----------|
| state | `activeIds` + `starterIds` (Set 2개) | `roles: Record<ttpId, 'out'|'starter'|'bench'>` + `captain: ttpId|null` + `history[]`(undo 스택) |
| 초기화 | lineup.starters→starter / +substitutes→active | lineup.starters→starter / lineup.substitutes→bench / captain_ttp_id→captain |
| 인터랙션 | 출전 체크 + 주전 별 (2단계) | **행 단일 탭 순환** `cycleRole` |
| 주장 | 없음 | **C 버튼 단일 토글** (출전 선수만) |
| 카운터 | "출전 N · 주전 N/5" | 선발 N/5 + 벤치 b/7 |
| 보조 도구 | 단일 토글 버튼 | 전체해제 + 실행취소(undo) |
| 코칭스태프 | role 텍스트만 | **role=coach 분리 → 코칭스태프 바** |
| 선발 슬롯 | 없음 | 5슬롯 보드(웹 강점) |
| POST body | `{teamSide, starters, substitutes}` | `{teamSide, starters, substitutes, captain}` |
| 확정 게이트 | starterCount===5 | starterCount===5 (주장 미지정은 warn만·확정은 허용 또는 차단 — §주의 참조) |
| 포지션 | ttp-row 별도 컬럼 | **제거** |

- 파생값: `starters = entries(roles).filter(=starter)` / `benchers = filter(=bench)` / substitutes(POST) = benchers. **API 계약 동일** (starters[5] + substitutes[] + captain?).
- 잠금(`isLocked = status≠scheduled&&≠ready`) 분기 유지.

**(3-3) `ttp-row.tsx`** — 행 = `<button onClick={cycleRole}>` (번호 + 이름 + 주장태그 + C버튼 + 토글칩). 포지션 컬럼 삭제. C 버튼은 `e.stopPropagation()`로 행 순환과 분리.

**(3-4) CSS** — 신규 `lineup-confirm.css` 또는 globals.css 섹션 추가. **시안 토큰 → 운영 토큰 치환** (§아래 표준 매핑).

---

## (c) 회귀 가드 (★박제 후 필수 검증)

| # | 가드 | 검증 방법 |
|---|------|----------|
| R1 | **starters 정확히 5** | zod refine L60 그대로 유지. 4명/6명 POST → 422 |
| R2 | **starters∩substitutes 중복 0** | L318~328 유지. 동일 ttp 양쪽 → 422 |
| R3 | **starters/substitutes 자체 중복 0** | L330~337 유지 |
| R4 | **ttp 무결성(소속+is_active)** | L339~362 유지. 타팀/비활성 ttp → 422 |
| R5 | **매치 잠금(status 가드)** | L314 `status!==scheduled&&!==ready` → 409 유지 |
| R6 | **★기존 라인업 captain=NULL 정상 로드** | captainTtpId nullable → 기존 row(captain 미존재) GET/page 로드 시 `null`로 안전 직렬화. form 초기화 시 captain=null. **에러 0** |
| R7 | **권한(admin 양쪽 / 팀장 본인측 / 403)** | resolveLineupAuth·getLineupCanEdit 변경 0 |
| R8 | **상대팀 미노출(frozen)** | page.tsx mySide 단일측 prop 유지 |
| R9 | **AppNav frozen** | (web) 그룹·03 카피. 헤더 재구성 0 |
| R10 | **벤치캡 7 / 정원 12** | substitutes 8건 → 422 / starters+subs 13 → 422 (신규 — vitest 권장) |
| R11 | **주장 멤버십** | captain이 starters∪substitutes 밖 → 422 (신규) |

- **회귀 핵심**: API는 **add-only**(기존 검증 줄 삭제·수정 0, 신규 검증·필드 append만) → 기존 호출(captain 미전송)도 정상 동작. captain optional이라 **하위호환 100%**.

---

## (d) schema diff 미리보기 (실측 완료)

```
$ npx prisma migrate diff --from-schema-datasource ... --to-schema-datamodel (captain 추가본)
-- AlterTable
ALTER TABLE "match_lineup_confirmed" ADD COLUMN "captain_ttp_id" BIGINT;
```
- 현재 schema.prisma ↔ 운영 DB = **완전 동기(empty diff)** 확인. 즉 captain 컬럼만 신규 추가됨(다른 drift 없음).
- ADD-only nullable → **DROP/ALTER/data-loss 0**. CLAUDE.md §DB 정책 "NULL 허용 ADD COLUMN 무중단 변경만 자동" 부합. 단 의뢰서 지시대로 **push는 사용자 검토 후**.

---

## (e) role=manager 처리 결정 (실측 근거)

**운영 DB 실측 (SELECT only, 운영 영향 0)**:
| role | 전체 | is_active=true |
|------|------|----------------|
| player | 1018 | 1017 |
| coach | 4 | 4 |
| **manager** | **0** | **0** |

**결정**:
1. **manager 분기 코드 불필요** — 운영에 manager 0건. 시안 HANDOFF도 "매니저 role 없음"(앱 = player/captain/coach만) 명시. → 정합.
2. **코칭스태프 바**: `role==='coach'`만 명단에서 분리. 그 외(player) 전부 선수 풀.
3. **시안의 감독/코치(head/asst) 2칩 구분은 실데이터에 없음** — TTP.role엔 head/asst 세분 없이 `coach` 단일. → 박제 시 **coach 전원을 코칭스태프 바에 "코치" 칩으로 나열**(head/asst 하드 구분 제거). coach 0건 팀이면 바 자체 hide 또는 "코칭스태프 미등록".
   - (※ captain은 role 컬럼이 아니라 **MatchLineupConfirmed.captainTtpId**로 경기단위 관리 — TTP.role='captain'과 무관. 현행 form의 eligible 필터 `role==='player'||'captain'`도 유지 안전하나, 신규는 `role!=='coach'`로 단순화 권장.)
4. **방어**: 혹시 미래 manager가 들어와도 `role!=='coach'`면 선수 취급(현행 eligible과 동일 보수적 동작). 깨짐 0.

---

## (f) 시안 토큰 → 운영 토큰 치환 매핑 (박제 표준 — 기존 박제 답습)

globals.css L4659/L4826 확립된 표준 매핑 적용:
| 시안 토큰 | 운영 토큰 | 비고 |
|----------|----------|------|
| `--r-md` | `--radius-card` | 라운딩 |
| `--r-sm` / `--r-xs` | `--radius-chip` | 라운딩 |
| `--accent-hair` | `--accent-soft` | (globals 미정의) |
| `--ok-hair` | `--ok-soft` 또는 border 생략 | globals 미정의 |
| `--warn-hair` | `--warn-soft` | globals 미정의 |
| `--err` | `--color-error` 또는 `--bdr-red`(의미색) | globals 미정의 → 매핑 필요 |
| `--err-soft` | `--accent-soft` 또는 신규 | globals 미정의 |
| `--accent` / `--accent-soft` / `--ink-mute` / `--cafe-blue*` / `--bg*` / `--border*` / `--ink*` / `--ok` / `--warn` / `--bdr-navy` / `--ff-*` | **그대로 존재** | 치환 불필요 |

- ❌ 금지: 하드코딩 hex(시안 CSS의 `#8B5A0F`·`#0E6B3D`·`#fff` 등 → 토큰 또는 기존 박제 관행대로 처리), lucide-react, pill 9999px(아바타·badge 50%만 허용).
- 강조색(선발/주장)은 **의도된 `--accent`(빨강)** — 의뢰서·HANDOFF 확정. (errors.md 폴백 함정 대상 아님)

---

## 실행 계획 (담당·순서)

| 순서 | 작업 | 담당 | 선행 | 회귀위험 |
|------|------|------|------|---------|
| 1 | [1] schema +captainTtpId → **사용자에 diff 보고 → 승인 후 db push** | developer + PM(승인) | 없음 | 0 |
| 2 | [2] API POST/GET/serialize 확장 (검증 add-only) | developer | 1 | 낮음 |
| 3 | [2-검증] vitest (R1~R5 회귀 + R10·R11 신규) | tester | 2 | — |
| 4 | [3] UI 재작성 (form/ttp-row 3상태+C+undo / page select+prop / CSS) | developer | 1,2 | 중 |
| 5 | [3-검증] tsc + 시각 회귀(6상태) + curl raw 응답 `captain_ttp_id` 확인 | tester + reviewer (병렬) | 4 | — |
| 6 | [4] BDR-current/ 시안 additive add | PM(design sync) | 4 | 0 |

---

## ⚠️ developer 주의사항

1. **API는 add-only** — 기존 검증/직렬화 줄 **삭제·수정 금지**, 신규만 append. starters===5 refine, 중복 가드, ttp 무결성, status 가드 전부 보존.
2. **apiSuccess snake_case 함정(재발 6회)** — GET 응답 프론트 접근자 = `captain_ttp_id`(snake). page.tsx server prisma 직접은 `captainTtpId`(camel). POST 요청 body는 `captain`(camel, 클라가 보내는 키). 혼동 시 사일런트 undefined.
3. **db push 전 사용자 승인 필수** — diff(`ADD COLUMN captain_ttp_id BIGINT`) 보고 → 승인 → push. `--accept-data-loss` 금지(불필요).
4. **substitutes = 벤치** 의미 재해석만(컬럼 불변). "제외(out)"는 양쪽 미포함으로 표현 — 저장 안 함.
5. **포지션 완전 제거** — ttp-row position 컬럼 + form 헤더 "포지션" 삭제. (DB position 컬럼은 보존, UI만 제거)
6. **주장 게이트 결정 필요** — 시안은 주장 미지정 시 warn만 띄우고 확정 활성. **확정 차단할지(권장: 주장 필수) PM 확인**. API에선 captain optional이라 미전송도 200 — 정책은 UI 게이트로 결정.
7. **manager 분기 코드 작성 금지** — 실측 0건. `role==='coach'` 분리만.
8. **하드코딩 hex 금지** — 시안 CSS의 `#8B5A0F`/`#0E6B3D`/`#fff` 등은 §f 매핑 또는 기존 박제 관행대로 토큰화.
9. **AppNav frozen / 상대팀 미노출 / 신규 라우트 0** — frozen 룰 보존.
