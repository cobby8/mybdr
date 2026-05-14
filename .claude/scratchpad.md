# 작업 스크래치패드

## 현재 작업
- **요청**: 2026-05-14 작업 마감
- **상태**: idle
- **모드**: no-stop

## 진행 현황표 (오늘 누적)
| 영역 | 결과 |
|------|------|
| main release | ✅ 2건 (`1c843b1` + `0ad2a40`) — Phase C / 23 PR1 / 23 PR2+PR3 / 22 knowledge / 19 PR-S1 운영 적용 |
| subin 누적 (dev 보다 앞섬) | 6 commit (PR-S2 / Phase 1 / PR-S3 / PR-S4 / PR-S2 후속 / PR-S5) |
| reviewer 검증 | 5건 통과 (PR-S2 8/8 / PR-S3 6/6 / PR-S4 7/7 / Phase 23 PR2+PR3 7/7 / PR-S2 후속 본 turn) |
| 미검증 commit | **1건** — `fe022c6` PR-S5 (Claude Desktop / 다음 세션 reviewer 후보) |
| tester (vitest 회귀) | 204/204 PASS (누적 검증) |
| tsc strict | 에러 0 (누적 검증) |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-14 | release #3 (dev → main) — sidebar fix + 마법사 Phase 5 A+B + Phase 19 PR-S2~S5 + 마법사 Phase 1 | ✅ PR #480 (subin→dev) `918d079` + PR #481 (dev→main) `4bcaefa` 머지 / Vercel 자동 배포 |
| 2026-05-14 | fix(admin): sidebar — tournament_admin 사용자에게 child-only visible parent 노출 | ✅ 1 파일 +20 -5 / tsc 0 / vitest 757/757 / commit `4af0379` (최영철 사이드바 "대시보드" 1개만 보이던 회귀 영구 차단) |
| 2026-05-14 | 마법사 Phase 5 작업 A+B — last-edition API 신규 + editions 확장 | ✅ tsc 0 / 자체검수 10/10 / 작업 C (DB unique) 사용자 결재 대기 |
| 2026-05-14 | 신유경(3410) 본인인증 수동 부여 + GNBA(org_id=3) admin INSERT | ✅ user UPDATE (name="신유경"/name_verified=true/identity_method="manual"/verified_at=now) + organization_members id=7 (admin/active) + admin_logs 2건 박제(114 warning + 115 info). organizer는 1슬롯 제약으로 skip / 운영 DB 3 row 추가, 코드 변경 0 |
| 2026-05-14 | 강남구협회장배 유소년부 TAM 등록 — 신유경(id=3410) INSERT | ✅ TAM id=11 (role=admin/active) / 최영철(3408)은 organizer+기존 TAM(id=10)+GNBA admin 3중 권한 보유 (작업 skip) / 운영 DB 1 row 추가, 코드 변경 0 |
| 2026-05-14 | Phase 19 PR-S3+PR-S4 reviewer 검증 (Claude Desktop) | ✅ 6/6 + 7/7 통과 / 후속 권장 3건 (CSS selector / fiba-frameless 인쇄 / section 시맨틱) |
| 2026-05-14 | Phase 19 PR-S2 후속 권장 3건 수정 (3중 방어선) | ✅ 3 파일 +50 / vitest 204/204 / commit `4e0a43d` |
| 2026-05-14 | 마법사 Phase 1 — 공통 타입·draft 인프라 (lib 3 파일) | ✅ +336 / self-check 6/6 / commit `7be3aca` |
| 2026-05-14 | Phase 19 PR-S2 reviewer 검증 (Claude Desktop) | ✅ 8/8 통과 / 후속 권장 본 turn 처리 완료 |
| 2026-05-14 | release #2 (dev → main) — Phase 23 PR2+PR3 + Phase 19 PR-S1 + BDR sync | ✅ PR #479 머지 `0ad2a40` / Vercel Production SUCCESS |
| 2026-05-14 | Phase 23 PR2+PR3 reviewer 검증 (Claude Desktop) | ✅ 7/7 통과 / 매치 218 사고 영구 차단 |
| 2026-05-14 | release #1 (dev → main) — Phase C + Phase 23 PR1 | ✅ PR #477 머지 `1c843b1` / Vercel Production SUCCESS |
| 2026-05-14 | Phase 23 PR1 — PBP 역변환 헬퍼 + vitest 24 | ✅ tsc 0 / 24/24 / 회귀 204/204 / commit `b7c44d8` |
| 2026-05-14 | Phase 23 설계 분석 (planner-architect / read-only) | ✅ 7 항목 + edge case 10 + 위험 9 / 사용자 결재 5건 수락 |
| 2026-05-14 | Phase C — status="completed" score safety net + Phase 22 knowledge | ✅ vitest 8/8 / commit `eb4ad9c` + `074c1f7` |

## 미푸시 commit (subin 브랜치)
**0건** — 전부 push 완료.

## subin 미release commit (dev 보다 앞섬, 다음 세션 release 후보)
| commit | 작업 | 검증 |
|--------|------|------|
| `fe022c6` | feat(score-sheet): Phase 19 PR-S5 — PeriodScoresSection 시안 정합 | ⚠️ 미검증 (Claude Desktop) |
| `4e0a43d` | fix(score-sheet): Phase 19 PR-S2 후속 권장 3건 (3중 방어선) | ✅ 본 turn |
| `1388eae` | feat(score-sheet): Phase 19 PR-S4 — FibaHeader 시안 정합 | ✅ reviewer 7/7 |
| `1a37981` | feat(score-sheet): Phase 19 PR-S3 — RunningScoreGrid mode prop | ✅ reviewer 6/6 |
| `7be3aca` | feat(wizard): 통합 마법사 공통 타입·draft 인프라 (Phase 1) | ✅ 본 turn (tsc 0 / self-check 6/6) |
| `4416a91` | feat(score-sheet): Phase 19 PR-S2 — 시안 toolbar 전체 도입 | ✅ reviewer 8/8 |

## 후속 큐 (미진입)

### Phase 19 후속 권장 (소규모 cleanup PR 후보)
- PR-S3 후속: CSS selector `.ss-shell [data-score-mode="paper"]` 미매칭 (wrapper 에 ss-shell 없음 — JS early return 으로 입력 차단 보장. CSS opacity/cursor 만 누락)
- PR-S4 후속 (1): `fiba-frameless` className 누락 (인쇄 정합 — print.css 에 `.ss-header` 룰 추가 또는 outermost 에 frameless className 추가)
- PR-S4 후속 (2): `<section>` 3개 중첩 시맨틱 (접근성 — aria-label 추가 또는 `<div>` 강등)
- PR-S5 reviewer 검증 (다음 세션 진입 후보)

### 마법사 (통합 wizard) 후속 Phase
- **Phase 2** (Step 0 단체 UI): BLOCKED — `Dev/design/BDR-current/screens/TournamentWizardStep0.jsx` 필요 (D1+D3 디자인 시안 선행)
- **Phase 3** (Step 1 시리즈 UI): BLOCKED — `TournamentWizardStep1.jsx` 필요 (D1 시안)
- **Phase 4** (Step 2 prefill): 가이드 점검 후 진입 (시안 의존도 확인 필요)
- **Phase 5** (API 신규 + DB unique 인덱스): 시안 무관 / 위험도 중간 (DB schema 변경 — 사용자 결재 필수)
- **Phase 6** (Association 마법사): BLOCKED — D4 시안 필요
- **Phase 7** (자동 검증): 시안 무관 / Playwright + 스모크

### Phase 23 후속 PR
- PR4 (선택): status="completed" 매치 수정 가드 (Q3 별도 결재)
- PR5: audit endpoint 박제 + cross-check useEffect fetch
- PR6: ConfirmModal 도메인 컴포넌트 + PaperPBPRow 명시 mapping + OT cross-check

### 기타
- UI-1.4 entry_fee 사용자 보고 재현 (커뮤니케이션 — 코드 0)
- GNBA 8팀 코치 안내 (자가수정 진입 시 본인 이름/전화 입력 = 자동 setup)

## 운영 가동 중 (오늘 적용)
- Phase C status="completed" score safety net — sync 누락 자동 보정 (Flutter 매치 #132 패턴 영구 차단)
- Phase 23 PR2+PR3 — score-sheet 매치 재진입 자동 로드 (매치 218 사고 영구 차단)
- Phase 23 PR1 — PBP → ScoreMark/FoulMark 역변환 헬퍼 (lib only)
- Phase 19 PR-S1 — BDR v2.5 시안 토큰 운영 도입 (.ss-shell 스코프)
- Phase 22 knowledge — paper PBP clock=0 STL 보정 충돌 + 잘못 백필 lesson

---

## 구현 기록 (developer) — 마법사 Phase 5 작업 A+B

📝 구현한 기능:
- **작업 A**: GET `/api/web/series/[id]/last-edition` — 시리즈 마지막 회차 + 종별 룰 조회 (마법사 "이전 회차 복제" prefill 용)
- **작업 B**: POST `/api/web/series/[id]/editions` 확장 — `tournament_payload` / `division_rules` 받으면 마법사 path / 미전송 시 기존 path (회귀 0)
- **작업 C** (DB unique 인덱스 추가): ❌ 본 turn 미진행 — 사용자 결재 대기

### 변경 파일

| 파일 경로 (절대) | LOC | 신규/수정 | 한 줄 설명 |
|------|-----|----------|----------|
| `C:\0. Programing\mybdr\src\app\api\web\series\[id]\last-edition\route.ts` | +91 | **신규** | GET — series + last_edition (status 제외) + division_rules / IDOR=organizer+super_admin |
| `C:\0. Programing\mybdr\src\app\api\web\series\[id]\editions\route.ts` | +130 -71 | 수정 | POST 확장 — hasFullPayload 분기 / 마법사 path status="draft" 강제 / 트랜잭션 안에 DivisionRule createMany 추가 |

### 응답 스키마

**작업 A — GET last-edition**
```json
{
  "series": { "id": "123", "name": "...", "tournaments_count": 5 },
  "last_edition": { "id": "uuid", "edition_number": 5, "name": "...", "format": "...", "max_teams": 16, /* ... Tournament 전체 필드 / status 제외 */ },
  "division_rules": [{ "id": "...", "tournament_id": "...", "code": "...", "label": "...", "fee_krw": 50000, "sort_order": 0, "settings": {} }]
}
```
- 빈 시리즈: `last_edition: null` + `division_rules: []`
- BigInt → string 자동 변환 (`apiSuccess` → `convertKeysToSnakeCase`)

**작업 B — POST editions (마법사 path)**
- 입력: `{ tournament_payload: {...}, division_rules: [...] }`
- 출력: 기존 호환 — `{ success, tournament_id, edition_number, name, redirect_url }`

### IDOR 가드 위치

- **작업 A** (`last-edition/route.ts`) L62-64:
  ```ts
  if (series.organizer_id !== ctx.userId && !isSuperAdmin(ctx.session)) {
    return apiError("본인 시리즈만 조회 가능합니다.", 403);
  }
  ```
- **작업 B** (`editions/route.ts`) L66-68: 기존 organizer 검증 유지 (super_admin 우회 X — 기존 동작 보존)

### 트랜잭션 패턴

`prisma.$transaction(async (tx) => { ... })` — 3 단계 원자 처리:
1. `tx.tournament.create({ data: tournamentCreateData })`
2. (마법사 path 만) `tx.tournamentDivisionRule.createMany({ data: rulesData })`
3. `tx.tournament_series.update({ tournaments_count: { increment: 1 } })`

→ 실패 시 자동 롤백 (카운터 +1 안 됨 / 자체 검수 #5 충족)

### 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 에러 0 |
| 기존 호출자 회귀 | ✅ `src/app/(admin)/tournament-admin/series/[id]/add-edition/page.tsx` 단일 호출처 / `{ startDate, venueName, maxTeams }` 미변경 path / 응답 키 `success` `editionNumber` `redirectUrl` 그대로 유지 |
| status="draft" 강제 | ✅ 마법사 path 만 `"draft"` (기존 add-edition path = `"registration_open"` 유지 — 호출자 회귀 방지) |
| `any` 사용 | ✅ 0건 (Prisma 타입 import / Record<string, unknown> 만) |
| BigInt 직렬화 | ✅ apiSuccess `case.ts` L8 자동 처리 |
| snake_case 응답 | ✅ apiSuccess 자동 변환 |
| 빈 시리즈 응답 | ✅ `last_edition: null` / `division_rules: []` 명시 처리 |
| DB schema 변경 | ✅ 0 (작업 C 결재 대기) |

### 작업 C 진입 시 보강 사항 (미진행)

1. `prisma/schema.prisma` Tournament model 에 `@@unique([series_id, edition_number])` 추가
2. **사전 검증 2건 (운영 DB SELECT)**:
   - 카운터 drift (02-db-changes §7-a)
   - 중복 (series_id, edition_number) 행 (02-db-changes §7-b)
   - 둘 다 0건이면 진행 / 1건+ 이면 중단
3. 사용자에게 schema diff 보고 + 승인 (CLAUDE.md DB 가드 2)
4. `npx prisma db push`
5. 사후 검증: 같은 (series_id, edition_number) INSERT 2회 시도 → 두 번째 23505 에러 확인
6. `editions/route.ts` 에 retry 로직 보강 (P2002/23505 catch → count 재조회 → 1회 retry → 그래도 실패 시 409)

### tester 참고

- **테스트 방법**:
  - 작업 A: `curl -b "_web_session=..." http://localhost:3001/api/web/series/{id}/last-edition | jq`
  - 작업 B (기존 호환): `curl -X POST .../editions -d '{"startDate":"2026-06-01","venueName":"강남","maxTeams":16}'`
  - 작업 B (마법사 path): `curl -X POST .../editions -d '{"tournament_payload":{...},"division_rules":[...]}'`
- **정상 동작**:
  - 작업 A: 본인 시리즈 → 200 + `last_edition` 또는 null / 타인 시리즈 → 403 / 시리즈 없음 → 404
  - 작업 B: 기존 path 응답 키 (`success`/`editionNumber`/`redirectUrl`) 그대로
- **주의할 입력**:
  - 빈 시리즈 (tournaments_count=0) → `last_edition: null` 정상
  - `tournament_payload.status = "registration_open"` 입력해도 → DB 박제는 `"draft"` (강제 무시)
  - 시리즈 ID 가 BigInt 변환 실패 → 400
  - super_admin 세션 → 타인 시리즈도 GET 통과 (B 는 organizer 만 — 기존 동작 보존)

### reviewer 참고

- **특별히 봐줬으면 하는 부분**:
  - 작업 B 의 마법사 path 와 기존 path 분기 (`hasFullPayload`) — body 에 `tournament_payload` 있으면 마법사, 없으면 기존. 회귀 발생 시 add-edition 페이지 부서짐
  - status 강제 무시 destructuring (L97-99) — payload 에 status 키 있어도 무시되는지 확인
  - 트랜잭션 안에 createMany 위치 (Tournament create 직후, series counter +1 이전) — 실패 케이스에서 카운터 +1 안 되는지
  - last-edition 의 status 제외 destructuring (L93-99) — Prisma findFirst 결과의 status 키만 제거 후 나머지 spread

### 다음 단계

작업 C (DB unique 인덱스 추가) 사용자 결재 대기 — 가이드 §C 절차:
1. 운영 DB 검증 쿼리 2건 0건 확인
2. schema diff 사용자 보고 + 승인
3. `prisma db push`
4. retry 로직 보강 (`editions/route.ts`)

PM 결재 받음. commit/push 는 PM 이 진행.

---

## 디버깅 — 유소년 명단 제출 네트워크 오류 (2026-05-14)

### 발생 상황
운영 (mybdr.kr) — 코치(최영철) 가 `/team-apply/9d638dde.../edit` 에서 11명 명단 prefill 후 "명단 제출" 클릭 시 빨간 박스 **"네트워크 오류가 발생했습니다."** 표시.

### 운영 DB SELECT 결과 (가드 면제 — SELECT only)
| 항목 | 값 |
|------|------|
| token 상태 | **정상** (만료 2026-05-23, applied_via='coach_token') |
| TournamentTeam | id=273 / 스티즈강남 / category=`i3-U11` / manager_name="최영철" / manager_phone="010-4725-2105" |
| DivisionRule | birthYearMin/Max=2015 / gradeMax=5 (5학년 이하) |
| 기존 명단 | 11명 박제 / jerseyNumber 1·2·6·10·17·18·23·24·30·33·39 unique / parent_phone 모두 표준 `010-XXXX-XXXX` |
| FK 참조 | match_player_stats=0 / play_by_plays=0 (deleteMany 안전) |

→ **DB / 토큰 자체는 정상**. PUT 트랜잭션 시도 시 P2003 가능성 0.

### 코드 정밀 분석

| 파일 | 라인 | 발견 |
|------|------|------|
| `src/app/(web)/team-apply/[token]/team-apply-form.tsx` | L213 | `catch { setError("네트워크 오류...") }` — fetch 예외 **또는 res.json() 파싱 실패** 모두 동일 메시지 |
| `src/app/api/web/team-apply/[token]/route.ts` PUT | L320-357 | 코치 인증 4-분기 — DB에 manager_* 박제 있음 → 분기 1 (둘 다 매칭 검증). 입력값 mismatch 시 401 + COACH_AUTH_FAILED (`json.error` 로 표시되어야 정상) |
| route.ts PUT | L380-403 | 트랜잭션 — deleteMany + createMany 11건. FK 참조 0 = 정상 동작 |
| route.ts PUT 응답 | L405 | `apiSuccess({ ok, updatedCount })` → snake_case 자동 변환 (`updated_count`) — form L210 정확히 snake_case 접근 (이 함정은 회피됨) |

### 의심 원인 순위

| 순위 | 원인 | 근거 |
|------|------|------|
| **1위** | catch 블록이 4xx/5xx 응답 + JSON parse 실패 + fetch 예외를 **모두 "네트워크 오류"로 뭉뚱그림** | L195 `await res.json()` 가 실패하면 (HTML 500 페이지 등) catch 진입. 진단 불가능 |
| 2위 | PUT 응답이 Vercel runtime timeout / 502 (HTML 응답) → JSON parse 실패 → catch | 트랜잭션 11건 빠르지만 cold start + region latency 가능 |
| 3위 | edit-flow.tsx 인증 통과 후 manager_name 입력값과 DB 값(`최영철` / `010-4725-2105`) **mismatch** → PUT L327 → 401 → 정상 json.error 메시지여야 정상 분기, but catch 까지 떨어졌다면 다른 케이스 |

→ DB/API 코드는 정상. **catch 블록의 광범위 메시지가 진짜 원인을 가립니다**.

### 사용자 진단 방법 (F12)

크롬 F12 → **Network 탭** → "명단 제출" 다시 클릭 → `PUT /api/web/team-apply/9d638dde.../` 항목 클릭:
- **Status**: 200/401/422/500 중 무엇?
- **Response** 탭: `{ error, code }` JSON 또는 HTML?
- 결과 알려주시면 정확한 원인 1초 안에 특정 가능.

### 임시 해결책 (사용자 즉시 시도)

1. **페이지 새로고침** 후 코치 정보 재입력 (이름 정확히 "최영철" + 전화 "010-4725-2105")
2. 브라우저 캐시/쿠키 클리어 후 재시도
3. 다른 브라우저(크롬↔사파리)로 시도

### 근본 해결 패치 제안 (사용자 승인 대기)

`team-apply-form.tsx` L195-215 catch 블록 정밀화:

```ts
try {
  const res = await fetch(...);
  const text = await res.text();                          // ← 먼저 text 로 받기
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* HTML 응답 */ }

  if (!res.ok) {
    if (json.code === "DIVISION_VALIDATION_FAILED" && ...) { ... }
    else if (json.code === "COACH_AUTH_FAILED") setError("코치 정보 불일치");
    else if (json.code === "TOKEN_EXPIRED") setError("토큰 만료");
    else if (json.error) setError(json.error);
    else setError(`서버 오류 (${res.status})`);            // ← HTML 응답이면 status 표시
    return;
  }
  ...
} catch (e) {
  setError(`네트워크 오류: ${e instanceof Error ? e.message : "알 수 없음"}`);
}
```

→ edit-flow.tsx L125 catch 도 동일 패턴 적용.

### 변경 파일 (승인 시)
- `C:\0. Programing\mybdr\src\app\(web)\team-apply\[token]\team-apply-form.tsx`
- `C:\0. Programing\mybdr\src\app\(web)\team-apply\[token]\edit\edit-flow.tsx`

### errors.md 박제 예정
"운영 catch 블록이 4xx/5xx + JSON parse 실패 + fetch 예외를 모두 '네트워크 오류' 단일 메시지로 뭉뚱그리는 진단 불가 UX 함정" — snake_case 함정 재발 5회와 동일한 사일런트 버그 유형.

### 구현 기록 (developer)

📝 구현한 기능: team-apply 페이지 catch 블록 정밀화 — 4xx/5xx 응답의 진짜 에러 메시지 노출 (진단 함정 제거)

| 파일 경로 | 변경 라인 | 핵심 변경 | 신규/수정 |
|----------|---------|----------|----------|
| `src/app/(web)/team-apply/[token]/team-apply-form.tsx` | L190-237 (+19 / -3) | text 선 받기 → 안전 JSON parse → res.ok 분기 → 4xx body 메시지 추출 (error/message/error_message/code) → catch 는 진짜 network 예외만 (e.message 포함) | 수정 |
| `src/app/(web)/team-apply/[token]/edit/edit-flow.tsx` | L87-141 (+22 / -2) | 동일 패턴 적용. setError + setVerifying state 그대로 보존 / finally 블록 유지 (verifying 정리) | 수정 |

#### 적용 패턴 (4단계)

```ts
// 1) 안전한 text → JSON parse (HTML 5xx 페이지 대응)
const text = await res.text();
let json: any = null;
try { json = text ? JSON.parse(text) : null; } catch { /* HTML/empty */ }

// 2) res.ok 분기 — 4xx/5xx body 진짜 메시지 추출
if (!res.ok) {
  const code = json?.code ?? json?.error_code;
  const msg = json?.error ?? json?.message ?? json?.error_message
    ?? (code ? `요청 실패 (${code})` : `서버 오류 (${res.status})`);
  setError(msg);
  return;
}

// 3) 성공 분기 (기존 onSuccess 유지)
// 4) catch 는 진짜 network 예외만 (DNS 실패 / offline / abort)
catch (e) {
  const reason = e instanceof Error ? e.message : "알 수 없는 오류";
  setError(`네트워크 오류: ${reason}`);
}
```

#### 호환성 보존 체크리스트 (7/7 PASS)

| # | 보존 항목 | 결과 |
|---|----------|------|
| 1 | API 호출 method / URL / payload 변경 0 | ✅ POST/PUT, endpoint, body 동일 |
| 2 | 성공 분기 (setSuccess / setPhase) 변경 0 | ✅ form L233, edit-flow L141 그대로 |
| 3 | 응답 키 snake_case 우선 (apiSuccess/apiError 자동 변환 함정 회피) | ✅ inserted_count / updated_count / players 그대로 |
| 4 | 에러 표시 UI (빨간 박스) 변경 0 | ✅ setError 호출만 정밀 메시지로 |
| 5 | 다른 함수 / import / type 변경 0 | ✅ 본 catch 블록 + 응답 처리만 |
| 6 | DIVISION_VALIDATION_FAILED / COACH_AUTH_FAILED 친절 메시지 보존 | ✅ json?.code optional chaining 으로 동일 분기 |
| 7 | setSubmitting / setVerifying state 정리 정상 | ✅ form: setSubmitting(false) 추가 / edit-flow: finally 그대로 |

#### 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT=0 (에러 0) |
| 변경 외 영향 범위 | 0 (catch + 응답 처리만 / 다른 함수/state/UI 0) |
| any 사용 | ✅ 2건 (각 파일 1건) — eslint-disable 주석 + 사유 명시 (서버 응답 통합 타입 없음 / case-by-case) |
| optional chaining | ✅ `json?.code` / `json?.error` 등 — JSON parse 실패 시 null 안전 |

#### tester 참고

- **테스트 방법**:
  1. 운영 (mybdr.kr) → `/team-apply/{token}/edit` 진입
  2. F12 → Network 탭 켜기
  3. "명단 제출" → PUT 응답 status 확인
     - **200**: 기존 정상 흐름 (success 박스 표시)
     - **4xx with json**: 빨간 박스에 진짜 에러 메시지 (예: "코치 정보 불일치", "DIVISION_VALIDATION_FAILED" 분기 등)
     - **5xx with json**: `json.error` 또는 `서버 오류 (500)` 표시
     - **5xx with HTML** (Vercel timeout): `서버 오류 (502)` 등 status 코드 노출
     - **offline / DNS 실패**: `네트워크 오류: Failed to fetch` 등 진짜 원인
- **정상 동작**: 사용자가 "네트워크 오류" 만 보이던 케이스 → 진짜 status + 메시지 노출 → 운영자 진단 가능
- **주의할 입력**:
  - 코치 정보 mismatch → `COACH_AUTH_FAILED` → "코치 이름 또는 연락처가 일치하지 않습니다" (기존 친절 메시지 보존)
  - 종별 검증 실패 → `DIVISION_VALIDATION_FAILED` → "N번 선수 생년월일/학년: ..." (기존 분기 보존)
  - 토큰 만료 → `json.error` 그대로 표시 (예: "토큰이 만료되었습니다")

#### reviewer 참고

- **특별히 봐줬으면 하는 부분**:
  1. `json?.code` optional chaining — JSON parse 실패 (null) 시 분기 정상 통과 (false 평가 → else 진입)
  2. `setSubmitting(false)` catch 블록에 추가 (기존 누락된 정리) — form L237
  3. edit-flow 는 finally 블록 유지 (verifying state 항상 정리)
  4. `any` 타입 사용 — eslint-disable 주석으로 명시. 통합 타입 없음 (성공/실패 페이로드 다름) — case-by-case 처리
  5. `text ? JSON.parse(text) : null` — 빈 응답 (204 No Content 등) 대응

#### errors.md 박제 (다음 PM turn)

- **패턴명**: catch 블록 광범위 메시지 진단 함정
- **사일런트 유형**: 사용자에게 "네트워크 오류" 만 표시 → 운영자 진단 불가능
- **재발 5회 추적**: snake_case 함정과 동일 카테고리 — UI 가 진짜 원인 가림
- **방어선**: (1) text 선 받기 + 안전 parse (2) !res.ok 분기 분리 (3) catch 는 진짜 network 예외만 + e.message 포함
