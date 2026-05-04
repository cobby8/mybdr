# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[기획설계 완료 — 사용자 승인 대기]** 듀얼토너먼트 표준 포맷화 + 대회관리자 자동 적용 분석. 옵션 C 권장 (점진 수정 — generator는 대부분 OK / settings 표준화 + admin UI 신설 / bracket-builder UI fix 1건). 7 Phase 추정 7~10시간. 본 turn은 **분석만** — PM 승인 후 실작업 진입. 상세는 §기획설계 섹션.

---

## 🎯 다음 세션 진입점

### 🚀 1순위 — 매치 코드 v4 전 Phase 완료, 미커밋 정리

**진행 상태**: Phase 1+2+3+4+5+7 완료. 미커밋 (Phase 4 + Phase 5 + Phase 7).

tester+reviewer 병렬 후 누적 커밋 1건 (3 Phase 묶음) — PM 처리.

**plan**: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md`

### 🚀 2순위 — 도메인 sub-agent P2 측정 누적 (P3 5/18 결정)
- live-expert P2 #1 baseline 완료 (live 도메인). P2 #2~#3 (Phase 1+2 / Phase 3 tournaments 영역) baseline = 일반 dev 컨텍스트 (system prompt 주입 0)
- 한계 1건: subagent_type 미등록 → P3 lessons 후보
- plan: `~/.claude/plans/dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md`

### 🚀 3순위 — 미커밋 잔여 (Option D 보존)
- `.claude/settings.local.json` 잔여 (이전 권한 통합 후속)

---

## 기획설계 (planner-architect / 5/4 듀얼 표준 포맷화)

### 🎯 목표
5/2 동호회최강전 (`138b22d8-7b20-…`) 27 매치 포맷을 듀얼토너먼트의 **system 표준**으로 정의.
대회관리자 UI 에서 `format=dual_tournament` 선택 → 자동 적용 → 사용자는 **조 배정만** 입력 → 27 매치 자동 생성.

---

### 📊 현재 코드 점검 결과

#### A. 코드 책임 분리 (혼선 0 — 명확함)

| 파일 | 책임 | dual 관련성 | 평가 |
|------|------|------------|------|
| `dual-tournament-generator.ts` (458) | 27 매치 정의 배열 생성 | dual 전담 | ✅ 깔끔 |
| `dual-progression.ts` (234) | winner/loser 자동 진출 (audit + self-heal) | dual 전담 | ✅ 깔끔 |
| `bracket-generator.ts` (132) | single elim 트리 + bye | dual 영향 0 | ✅ 분리 |
| `league-generator.ts` (166) | 풀리그 N\*(N-1)/2 생성 | dual 영향 0 | ✅ 분리 |
| `tournament-seeding.ts` (556) | 시드 + skeleton (full_league_knockout) | dual 영향 0 | ✅ 분리 |
| `update-standings.ts` (107) | advanceWinner + 전적. dual 가드 진입 차단 | guard 1줄 | ✅ 정확 |
| `bracket-builder.ts` (380) | DB → BracketMatch[] 변환 + SVG paths | dual 무지(`groupName` 옵셔널만) | ⚠️ UI 트리 i/2 페어링 한계 |
| `match-code.ts` (498) | 매치 코드 v4 dual `group_name` 자동 복사 | dual 통합 완료 | ✅ |
| `bracket/route.ts` (566) | dual format 분기 (211~398줄) | dual 전담 generator 호출 | ✅ |
| `sync/route.ts` | flutter sync — dual 분기로 advanceWinner skip + progressDualMatch | guard 정확 | ✅ |

→ **중복 코드 0** (5/3 fix `cf2eea1` + `9b4d3d5` 가 advanceWinner / progressDualMatch 책임 명확 분리 끝남).

#### B. 진출 처리 주체 (sync vs services/match.ts vs web matches/[matchId])

| 호출자 | dual 분기 | 동작 |
|--------|----------|------|
| `api/v1/.../sync/route.ts` (Flutter) | isDual + winnerTeamId 시 `progressDualMatch` (advanceWinner skip) | ✅ 정확 |
| `api/web/.../matches/[matchId]/route.ts` (web admin) | format dual 시 `progressDualMatch` 호출 | ✅ |
| `lib/services/match.ts` updateMatch/updateMatchStatus | format dual 시 progressDualMatch 통합 | ✅ |

→ 3 호출자 모두 동일 함수 사용. 주체 명확.

#### C. 5/4 fix 본질 (NBA 크로스 → 1+2 페어 변경)

운영 DB 실측 결과:
- 8강 `bracket_position` = 1, 3, 2, 4 (`#21=P1, #22=P3, #23=P2, #24=P4`)
- 4강 #25(SF1) = #21+#23 (next_match_id 추적) = **QF1+QF2** (1+2 페어)
- 4강 #26(SF2) = #22+#24 = **QF3+QF4** (3+4 페어)

**generator 코드** (`SEMI_FINAL_SPECS`):
```ts
{ matchIndex: 1, homeFromQfIndex: 1, awayFromQfIndex: 4 } // SF1 = QF1+QF4 (NBA 크로스)
{ matchIndex: 2, homeFromQfIndex: 2, awayFromQfIndex: 3 } // SF2 = QF2+QF3
```

→ **격차**: generator는 NBA 크로스(1+4 / 2+3), 운영 DB는 1+2 / 3+4. 5/4 운영 SQL 직접 패치 (commit 부재 — git log 확인). 
→ **본질**: bracket_position swap 이 i/2 페어링 (`bracket-builder` 라인 322,324)에 맞추기 위한 **UI 우회**. 4강 매치업도 1+2 → 3+4 페어로 갈음.

**bracket-builder.ts 의도**:
- `computeMatchPositions` (266~293): `prevIdx1=i*2, prevIdx2=i*2+1` — 단순 i/2 페어링
- `computeConnectorPaths` (304~358): 동일 i/2 매핑
- `next_match_id` 무시 — 위치/연결선만 그림

→ 의도된 design (single elim 트리 일반 패턴). 단 dual 의 NBA 크로스 (1+4) 는 i/2 페어링과 충돌. v2-dual-bracket-view 의 `qfReordered = [1, 4, 2, 3]` (49줄) 으로 임시 우회.

#### D. 5/2 baseline 매핑 (운영 DB ↔ generator)

| 항목 | 코드 (generator) | 운영 DB | 일치? |
|------|----------------|---------|-------|
| 27 매치 수 | 27 | 27 | ✅ |
| 조별 16 (R1·R2) | OK | OK | ✅ |
| 조별 최종전 4 (R3) | OK | OK | ✅ |
| 8강 4 (R4) bracket_position | 1,2,3,4 | 1,3,2,4 | ❌ swap fix 박힘 |
| 8강 매치업 | B1vsA2, A1vsB2, D1vsC2, C1vsD2 | 동일 | ✅ |
| 4강 페어링 | 1+4 / 2+3 (NBA) | 1+2 / 3+4 | ❌ |
| 결승 매핑 | 4강1+4강2 | 동일 | ✅ |
| settings.bracket | groupAssignment 등 | 동일 | ✅ |

---

### 📍 표준 포맷 정의 위치

| 새 위치 | 역할 | 신규/수정 |
|---------|------|----------|
| `src/lib/tournaments/dual-defaults.ts` (신규 ~80줄) | `DUAL_DEFAULT_BRACKET` 상수 + `DUAL_FORMAT_SPEC` 메타 (16팀/4조/27매치 고정값) + `getDefaultDualBracket()` 헬퍼 | 신규 |
| `src/lib/tournaments/dual-tournament-generator.ts` | `SEMI_FINAL_SPECS` NBA 크로스 → 사용자 결정 페어링으로 결정 (1+2 / 3+4 vs 1+4 / 2+3 — 사용자 확인 필요) | 수정 (8줄) |
| `src/components/tournament/bracket-settings-form.tsx` | dual 선택 시 `DUAL_DEFAULT_BRACKET` 자동 적용 (현재 read-only 표시만) | 수정 (~30줄) |
| `src/app/(web)/tournament-admin/tournaments/[id]/bracket/page.tsx` | dual format 진입 시 4조×4팀 배정 UI (드래그/select 16개) 추가 | 수정 (~150줄) |
| `src/lib/tournaments/bracket-builder.ts` | `next_match_id` 기반 페어링 옵션 추가 (dual 만 사용) — i/2 페어링과 분기 | 수정 (~40줄) |

#### 표준 스키마 (`dual-defaults.ts` 안)
```ts
export const DUAL_DEFAULT_BRACKET = {
  groupCount: 4,
  teamsPerGroup: 4,
  advancePerGroup: 2,
  knockoutSize: 8,
  hasGroupFinal: true,
  bronzeMatch: false,
  autoGenerateMatches: false, // generator 가 별도 호출
  groupAssignment: { A: [], B: [], C: [], D: [] }, // 사용자 입력 필요
};

export const DUAL_FORMAT_SPEC = {
  totalTeams: 16,
  totalMatches: 27,
  groupStage: { matches: 16, perGroup: 4 }, // G1, G2, 승자전, 패자전
  groupFinals: 4,                            // R3
  knockoutStage: { qf: 4, sf: 2, final: 1 }, // R4·R5·R6
  semiPairing: "1-2/3-4" as const,           // 또는 "1-4/2-3" — 사용자 결정
} as const;
```

→ 16팀 외 (8/24/32) 대응은 **Phase 2 보류** (현재 5/2 사례만 표준화).

---

### 🔗 기존 코드 연결

- `dual-defaults.ts` → `dual-tournament-generator.ts` (SEMI_FINAL_SPECS) + `bracket/route.ts` (settings 검증) + `bracket-settings-form.tsx` (자동 적용) 3곳에서 import
- `DualGroupAssignmentEditor` (신규 컴포넌트) → `bracket/page.tsx` 안에서 `isDual` 분기 시 표시
- `bracket-builder.ts` 신규 옵션 → `v2-dual-bracket-view.tsx` 의 `qfReordered` 임시 우회 제거

---

### 📋 실행 계획 (옵션 C — 점진 수정 / 권장)

| 순서 | Phase | 작업 | 담당 | 추정 | 위험 | 선행 |
|------|-------|------|------|------|------|------|
| 1 | P1 | `dual-defaults.ts` 신규 + 사용자 결정 받기 (NBA 크로스 vs 1+2/3+4) | planner | 30분 | 낮음 | 없음 |
| 2 | P2 | `dual-tournament-generator.ts` SEMI_FINAL_SPECS 갱신 + bracket_position 표준화 + vitest 5건 | developer + tester (병렬) | 1.5h | 중간 (5/2 운영 영향 0 — 신규 대회만 적용) | P1 |
| 3 | P3 | `bracket-settings-form.tsx` dual 선택 시 `DUAL_DEFAULT_BRACKET` 자동 적용 | developer | 1h | 낮음 | P1 |
| 4 | P4 | `bracket/page.tsx` 에 `<DualGroupAssignmentEditor>` 신규 컴포넌트 (4조×4팀 select 16개 + 검증) | developer | 2.5h | 중간 (UI 분량) | P3 |
| 5 | P5 | `bracket-builder.ts` `next_match_id` 페어링 옵션 추가 + v2-dual-bracket-view 우회 제거 | developer + tester (병렬) | 1.5h | 중간 (회귀 위험 — single elim 영향 0 검증 필요) | 없음 |
| 6 | P6 | E2E 시뮬 (시뮬레이션 스크립트 1건 — 신규 대회 생성 → 27 매치 자동 → 진출 4건 확인) | tester | 1h | 낮음 | P2+P4 |
| 7 | P7 | 5/2 운영 대회 영향 0 검증 (기존 27 매치 / settings 그대로 / progress 정상) | tester | 30분 | 낮음 (read-only 검증) | P5 |

**총 추정**: 8.5시간. 병렬 (P3‖P5 / P2‖P5) 활용 시 6.5h.

---

### ⚠️ 재작성 vs 점진 수정 판단

| 옵션 | 작업량 | 회귀 위험 | 권장도 |
|------|--------|-----------|--------|
| A. generator 재작성 | 6h | 높음 (5/2 진행 중 대회 영향) | ❌ |
| **B. 점진 수정 (옵션 C 권장)** | 8.5h | 낮음 (5/2 영향 0 — 신규 대회 +) | ⭐⭐⭐ |
| C. 일부 재작성 (admin UI 만) | 7h | 중간 | ⭐⭐ |

**판단 근거**:
- 코드 점검 결과 **중복 0**, 책임 분리 명확. generator 재작성 불필요.
- 격차는 1) `SEMI_FINAL_SPECS` 4강 페어링 (사용자 결정 필요) 2) admin UI 부재 (조 배정 입력 UI) 3) `bracket-builder` UI 트리 페어링 한계 — 모두 **점진 수정 가능**.
- 운영 5/2 대회 진행 중 → destructive 변경 **금지** (CLAUDE.md DB 정책).

---

### ⚠️ developer 주의사항

1. **운영 5/2 대회 영향 0 절대 보장** — settings 변경 / 매치 변경 모두 **신규 대회만** 적용. 기존 데이터 destructive 작업 사용자 승인 필수.
2. **SEMI_FINAL_SPECS 결정**: 사용자에게 NBA 크로스(1+4) vs 단순(1+2) 어느 쪽이 표준인지 확인 후 P2 진입. (운영 DB는 1+2 페어로 패치돼 있음 — 5/4 SQL 우회).
3. **bracket-builder 변경 시 single elim 회귀** — vitest + 시뮬 필수.
4. **DualGroupAssignmentEditor** 16팀 select 시 **승인된 팀 (status=approved)** 만 옵션 제공. 16팀 미만이면 disable + "16팀 승인 필요" 안내.
5. **autoGenerateMatches=true 자동 트리거 보류** — 사용자 명시 "대진표 생성" 버튼 클릭 시만. (조 배정 변경 후 재생성 = `clear=true` 옵션).

---

### 🛡 운영 영향 / 마이그

- **5/2 대회 (id=`138b22d8-7b20-…`)**: 영향 0. settings.bracket / 27 매치 모두 그대로. 진행 중 매치는 `progressDualMatch` 로 정상 진출.
- **신규 dual 대회**: P3 완료 시점부터 `DUAL_DEFAULT_BRACKET` 자동 적용. 조 배정 UI 진입 후 16팀 입력 → 27 매치 자동.
- **schema 변경 0** — `next_match_id` / `settings` JSON 활용 (5/2 결정 그대로 유지).

---

### 🚦 사용자 승인 요청 사항

1. **4강 페어링 표준 결정**: NBA 크로스 (1+4 / 2+3) 또는 단순 (1+2 / 3+4) — 어느 쪽?
2. **옵션 C (점진 수정 8.5h) 승인 여부**
3. **Phase 진입 순서 OK?** (P1 → P2‖P3 → P4 → P5 → P6 → P7)

---

## 🟡 HOLD 큐
- **자율 QA 봇 시스템** — Phase 1~5 / 9d
- **BDR 기자봇 v2** — Phase 1 완료, Phase 2~7 대기

---

## 🔴 5/2 대회 종료 후 잔여 큐

| # | 항목 | 상태 |
|---|---|---|
| **A** | placeholder User 89명 — 잔여 86건 LOW (본인 가입 시 mergeTempMember 자동) | 🟡 89/107 |
| **B** | ttp 부족팀 5팀 — MI 9 / 슬로우 8 / MZ 11 / SA 9 / 우아한 9 | 🟡 사용자 액션 |

---

## 우선순위 2 — 결정 대기 큐

| 영역 | 결정 건수 | 산출물 |
|---|---|---|
| 관리자페이지 UI 개선 | 6건 (Phase A 모바일 가드) | `git log` "관리자페이지 UI 개선" |
| Games 박제 Phase A (dead code) | 별도 큐 | commit `f4b55c2` 직전 |
| Phase F2 wrapper 연결 | mount 완료 | commit `2dc9af8` |
| Teams Phase A | dead code 5파일 | commit `dfe5eb5` 직전 |

---

## 우선순위 3 — 인프라 / 영구 큐
카카오맵 SDK / placeholder 73명 통합 / PortOne / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 커뮤니티 답글 / waitlist / QR 티켓 / AppNav 쪽지 뱃지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 (1f8ee19) |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| **도메인 sub-agent (옵션 A)** | ✅ P1+P2+P3 완료 (C 채택 — live-expert 영구 / 신규 박제 0) |
| **매치 코드 v4** | ✅ Phase 1+2+3+4+5+7 (전 Phase 완료) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-04 | (developer / 미커밋) | **회원가입 Step 2 활성화 — 포지션·키·등번호 DB 저장** — 2 파일 (signup/page.tsx + actions/auth.ts). signup/page: "준비 중" 뱃지 3건 제거 + POSITION_OPTIONS 영문코드/한글라벨 매핑 + togglePosition 멀티 토글 + active 시 accent-soft 스타일 + height/jersey number input(type=number, min/max) + hidden inputs 3건 (position CSV / height / jersey_number). actions/auth: signupAction 에 position(CSV trim) + height(100~250 검증) + default_jersey_number(0~99 검증) 3 필드 추가. 잘못된 입력은 NULL 저장 (가입 흐름 무영향). schema 변경 0 (User.position/height/default_jersey_number 컬럼 이미 존재). profile/edit POSITIONS=["PG","SG","SF","PF","C"] CSV 패턴과 일관성 유지. tsc exit 0 / vitest 203/203 회귀 0. | ✅ |
| 2026-05-04 | (planner / 분석 only / scratchpad 박제) | **듀얼토너먼트 표준 포맷화 기획설계 — 옵션 C 점진 수정 권장 (8.5h / 7 Phase)** — 5/2 baseline 운영 DB 실측 + 코드 점검 (lib/tournaments 9파일 + bracket-settings-form + admin bracket page). 핵심 발견: 코드 중복 0 / 책임 분리 명확. 격차 3종: ① `SEMI_FINAL_SPECS` 4강 페어링 (코드 NBA 크로스 1+4 vs 운영 DB 1+2 페어 — 5/4 SQL 우회 박힘 / commit 부재) ② admin UI 부재 (조 배정 16개 select) ③ bracket-builder i/2 페어링 한계 (next_match_id 무시 / dual 만 우회). 표준 정의 위치 = `dual-defaults.ts` 신규 + `DUAL_DEFAULT_BRACKET` 상수. Phase 1~7. 운영 5/2 대회 영향 0 보장 (신규 대회만 적용 / schema 변경 0). 본 turn 분석만 — 실작업 ❌. | ✅ |
| 2026-05-04 | (planner / 메타 / plan §11 갱신) | **도메인 sub-agent P3 Go/No-Go 결정 — C 권장 (live-expert 유지 + 신규 박제 0)** — P2 6건 KPI 누적 분석. 잘못된 파일 0회 6/6 중 5건 = system prompt 주입 ❌ (일반 dev) → **planner 사전 분석이 진짜 효과의 본질**, system prompt 주입 marginal gain ≈ 0. 본질 가치 4종 모두 약함/미작동 (KPI 1·2 측정 불가, KPI 3 planner 동등, Task subagent_type 미등록). 명확 정의 작업 위주 한계 (모호 디버깅 케이스 0건). 7 사유로 **C 권장** (A 6h 매몰비용 / B 3h 매몰비용 / D live 박제 손실 / E 14일 추가 한계 효용 0 모두 거부). 후속: live-expert.md 영구 운영 + 신규 박제 0 + KPI 측정 종료 + PM 호출 룰 미갱신 + lessons 3건 박제 (system prompt marginal / KPI 작업 복잡도 통제 / Task 미등록 한계). plan §11 (P3 결정 결과 + decisions.md 박제 형식 제안) 갱신. PM 액션 = 사용자 C 승인 받기 → lessons 박제 + decisions.md 항목 추가. | ✅ |
| 2026-05-04 | (developer / 미커밋) | **매치 코드 v4 Phase 7 — deep link `/match/[code]` 라우트 (옵션, v4 마지막)** — 신규 라우트 2 파일 (page.tsx + not-found.tsx) + generateMetadata. tsc 0 / vitest 65/65 회귀 0. KPI: 5 grep + 4 read + 잘못된 파일 0회 + ~25분. 매치 코드 v4 Phase 1+2+3+4+5+7 모두 완료. | ✅ |
| 2026-05-04 | (developer / 미커밋) | **매치 코드 v4 Phase 5 — UI 노출 (3페이지)** — 3페이지 매치 카드에 `match_code` 표시. ① `/live/[id]` v2 hero-scoreboard 상단 배지 (FINAL · 대회명 옆 `.match-code--hero` 어두운 배경 대비) ② `/tournaments/[id]?tab=bracket` MobileMatchCard + DualMatchCard 매치번호 자리 우선 표시 (NULL 시 `#매치번호` fallback) ③ `/tournaments/[id]?tab=schedule` schedule-timeline 카드 inline 메타 우선 표시. 변경 8 파일: globals.css(.match-code+.match-code--hero 클래스 신규) / bracket-builder.ts(BracketMatch.matchCode + DbMatch.match_code 옵셔널 추가) / public-bracket route(include 자동) / public-schedule route(matchCode select+직렬화) / admin bracket route(select 명시) / live route(응답 matchCode 추가) / hero-scoreboard.tsx(배지) / match-card.tsx MobileMatchCard / v2-dual-bracket-sections.tsx DualMatchCard / schedule-timeline.tsx + tournament-tabs.tsx 매핑. NULL 안전 (모두 `{match.matchCode && ...}` 분기). BDR-current 13룰 토큰만 (var(--*)) / Material Symbols X / pill 9999px X / 하드코딩 색 X. 모바일 360px viewport 14자 영숫자 한 줄 안전 (font-size 10px + tabular-nums). tsc 0 / vitest 65/65 (minutes-engine 21 + match-code 44) 회귀 0. KPI: 12 grep + 14 read + 잘못된 파일 0회 + ~70분 (tournaments+UI 영역, live-expert 영역 침범 1건 — `/live/[id]` 헤더). | ✅ |
| 2026-05-04 | (developer / 미커밋) | **매치 코드 v4 Phase 4 — generator 4종 통합** — `match-code.ts` 신규 함수 4종 (`categoryNameToLetter` 5매핑 / `parseCategoryDivision` 케이스①+④ 분기 / `applyMatchCodeFields` 호출자영향0 헬퍼 / `generateUniqueMatchCode` UNIQUE fallback maxRetry10) + 4 generator 통합 (league-generator createMany / tournament-seeding knockout+skeleton 2곳 / bracket route dual createMany + single elim closure 인라인). NULL 안전 (short_code/region_code 둘 중 하나라도 NULL → match_code NULL). 호출자 영향 0 (generator 내부 변경만). vitest 27→44 (8 신규 케이스, 사실상 17건 신규 — describe 블록 분리). tsc 0 / minutes-engine 21/21 회귀 0. KPI: 7 grep + 9 read + 잘못된 파일 0회 + ~50분 (as of 작업 시점) — 일반 dev 컨텍스트 (tournaments-expert 미박제). plan: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` | ✅ |
| 2026-05-04 | 8af51eb push + bec591b 미푸시 + knowledge +3 | **매치 코드 v4 Phase 1+2+3 + knowledge 박제** — P1 schema 6컬럼 (Tournament short_code/region_code + Match match_code/category_letter/division_tier/group_letter, 운영 무중단 prisma db execute 우회) + P2 helper (`src/lib/tournaments/match-code.ts` 순수 함수 4종 + REGION_CODE_MAP 17 + alias 6 + CITY_TO_SIDO 26, vitest 27/27) + P3 backfill 61매치 (몰텐 27 case④ A/D3/group A-D + 열혈 34 case① 모두 NULL, 트랜잭션 wrap, UNIQUE 충돌 0). knowledge: errors+1 prisma relation camelCase / lessons+1 prisma generate EPERM Windows / conventions+1 prisma db execute 우회. tester+reviewer 모두 ✅. KPI P2 #2~#3 baseline (일반 dev 컨텍스트, tournaments 영역). plan: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` | ✅ |
| 2026-05-04 | 1f8ee19 push | **[live] P2 #1 — 라이브 sticky 헤더 + 모바일 미니스코어 + 팀 비교 막대 옵션 C + P1 박제** — live-expert 시범 첫 케이스. 3파일 (page.tsx / tab-team-stats.tsx StatRow.kind+normalizeBar / .css HOME=accent AWAY=cafe-blue weak=opacity 0.4) + `.claude/agents/live-expert.md` P1. tsc 0 / vitest 21/21. KPI baseline 4에이전트: 21grep+18read+잘못된파일 0회+62분. 한계 1건: subagent_type 미등록 | ✅ |
| 2026-05-04 | 095938d | **알기자 linkify entries 헬퍼 통합 + conventions 박제 2건** — buildLinkifyEntries / Batch 헬퍼 통합 (-50줄) | ✅ |
| 2026-05-04 | (P1 schema + 코드 + P4 backfill + P5 박제) | **알기자 Phase 1 DB 영구 저장 마이그** — `tournament_matches.summary_brief Json?` ADD COLUMN + Promise.allSettled 트리거 통합 + tab-summary client fetch 제거 + backfill 34/35 | ✅ |
| 2026-05-04 | (planner / 메타) | **옵션 A 도메인 sub-agent 신설 상세 계획 박제** — 8도메인 + 시범 live-expert + KPI 3 + Phase 5 + 롤백 6 + 리스크 8 | ✅ |
<!-- 5/4 알기자 누락 7매치 backfill + 가로 스크롤 indicator + 5/3 알기자 진단 + 5/4 카테고리 fade overlay + 시간 데이터 소실 매치 안내 배너 + 5/4 대회·경기 헤더 UI 개편 절단 (듀얼 표준 포맷화 기획설계 prepend로 10건 유지) — 복원: git log -- .claude/scratchpad.md -->
