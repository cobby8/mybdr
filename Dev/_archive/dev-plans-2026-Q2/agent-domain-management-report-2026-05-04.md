# 서브 에이전트 + 도메인 전문 관리 보고서

> **작성일**: 2026-05-04
> **작성자**: PM (planner-architect 분석 + KPI 6건 실측 데이터 + 사용자 결정 기반)
> **상태**: 시범 종료 (P3 결정 = C 채택)
> **참조 산출물**:
> - 시범 plan: `~/.claude/plans/dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md`
> - 박제: `decisions.md` 100번째 / `lessons.md` 33~35번째
> - 시범 에이전트: `.claude/agents/live-expert.md`

---

## 📋 한눈에 보기

| 항목 | 결과 |
|------|------|
| **시작 동기** | 프로젝트 방대 (web 30+/api 50+/architecture.md 26K 토큰) → 전수조사 디버깅 한계 |
| **검토 옵션** | 5개 (도메인 sub-agent / knowledge 분할 / feature-map / MCP search / 조합) |
| **채택 옵션** | A 도메인 sub-agent (8개 신설 + live-expert 시범) |
| **시범 결과** | KPI 6건 측정 — **잘못된 파일 0회 6/6 = 100%** ✅ |
| **본질 발견** | system prompt 주입 효과 marginal — **planner 사전 분석이 진짜 본질** |
| **최종 결정** | **C 채택**: live-expert 유지 + 신규 박제 0 (현상 유지) |
| **재진입 조건** | ① CC 가 프로젝트 로컬 에이전트 자동 등록 지원 ② 모호 디버깅 케이스 다수 발생 |

---

## 1. 배경 — 왜 시작했나

### 1-1. 프로젝트 규모 진단

| 영역 | 수 |
|------|-----|
| `(web)` 페이지 | **30+** (community/tournaments/teams/courts/rankings/games/news/scrim/series/profile/shop/partner-admin 등) |
| `api/v1` (Flutter) | 8 (auth/duo/matches/players/recorder/site-templates/subdomain/tournaments) |
| `api/web` | **40+** |
| `knowledge` 파일 | 6개 (architecture.md만 **26K 토큰** = 한 번에 read 불가) |
| 글로벌 에이전트 | 8개 (pm/planner-architect/developer/debugger/tester/reviewer/doc-writer/vibe-coder) |
| 프로젝트 로컬 에이전트 | **0** (`.claude/agents/` 없음) |

### 1-2. 사용자 진단 (시작점)

> "프로젝트 규모가 엄청 방대해져서 사이트 전체를 전수조사 하는 방식으로는 디버깅하거나 기능 조사를 정확하게 할 수 없을 거 같아. 에이전트를 더 만들거나, 각 기능별 관리자를 만드는 방법에 대해서 검토하고 계획 작성해봐"

**핵심 페인포인트**:
- `architecture.md` 한 번에 읽기 불가 (26K 토큰 > 25K 한도)
- 매번 grep 으로 전체 훑는 방식 → 시간 낭비 + 정확도 ↓
- 도메인 지식이 누적되지 않고 매 작업마다 재발견

---

## 2. 검토한 옵션 5개

| # | 옵션 | 컨셉 | 도입 비용 | 유지 비용 | 효과 |
|---|------|------|----------|----------|------|
| **A** | **도메인별 sub-agent** | 각 에이전트가 자기 영역만 깊이 알고, 영역 knowledge·핵심 파일 경로를 system prompt에 박제 | 중 | 중 | 도메인 지식 누적 가시화 |
| B | knowledge 도메인 분할 | architecture.md → architecture-tournaments.md / -live.md / ... | 저 | 저 | 토큰 회피 (효과 약) |
| C | 기능 인덱스 파일 | `.claude/feature-map/` 영역별 진입점 1페이지 요약 | 저 | 중 | 디버깅 첫 5분 절약 |
| D | MCP-style 도메인 search agent | 좁은 검색 권한만 가진 에이전트 | 중 | 저 | 코드 변경·판단은 일반 에이전트 책임 (분리 효과 약) |
| E | A+B+C 조합 | 가장 강력 | 고 | 고 | 가장 강력하나 초기 비용↑ |

**채택**: **A** (사용자 명시 결정)

---

## 3. 옵션 A 상세 계획 (planner-architect 작성)

### 3-1. 8 도메인 확정 (정량 근거 = 200 commits scope 빈도)

| 에이전트 | commit 빈도 | 단독 가치 |
|---------|-----------|----------|
| design-system-expert | **133** | BDR-current 13룰 자동 검수 |
| profile-community-expert | 57 | profile 59 + community 17 + Hybrid 박제 |
| admin-expert | 54 | 운영 DB destructive 가드 + cafe-sync + 알기자 |
| **live-expert** ⭐ (시범) | 44 | minutes-engine v3 + STL + PBP 알고리즘 깊이 |
| tournaments-expert | 43 | 회귀 5종 + 매치코드 Phase 1~7 |
| referee-expert | 31 | 라우트 그룹 분리 + 14모델 |
| teams-courts-expert | 29 | mergePlaceholderUser + 코트 대관 |
| flutter-api-expert | ~10 (저빈도·고위험) | 모바일앱 호환 — 원영 사전공지 |

### 3-2. 의도적으로 단독 도메인화 안 한 것

| 영역 | 사유 |
|------|------|
| community 단독 | profile 결합 |
| auth-security 단독 | 저빈도 안정 |
| games 단독 | tournaments+live 분산 |
| news 단독 | admin 결합 |

### 3-3. KPI 3종 (시범 2주 측정)

| KPI | 목표 | 측정 |
|-----|------|------|
| 디버깅 첫 5분 grep/read 횟수 | -50% 이하 | scratchpad "조사 grep N회 / read M회" |
| 동일 작업 완료 시간 | -30% 이하 | commit timestamp 차이 (3건 이상) |
| **잘못된 파일 건드린 횟수** | **0회** | commit diff 자동 grep |

### 3-4. Phase 5단계 (~6주)

| Phase | 산출물 | 시간 | 진입조건 |
|-------|-------|------|---------|
| P1 | live-expert.md 박제 + decisions 입력 | 1.5h | 본 계획 사용자 승인 |
| P2 | 첫 케이스 측정 (KPI baseline) | 실작업 1건 | P1 + 실작업 발생 |
| P3 | KPI 2주 누적 → Go/No-Go 결정 | 2주 | 시범 시작 +14일 |
| P4 | 확대 1 (tournaments + admin) | 3h + 1주 | P3 Go |
| P5 | 전체 8개 + PM 호출 룰 갱신 | 8h + 1주 | P4 + 4주 누적 KPI 달성 |

### 3-5. 롤백 기준 6종

도메인 경계 모호 (3건+ PM 30초+ 고민) / 잘못된 에이전트 호출 30%+ / KPI 미달 (개선 1회 후도) / 잘못된 파일 1회+ / 사용자 정성 부정 / knowledge sync 30일+ 미갱신

### 3-6. 리스크 8종 + 완화

| 리스크 | 완화 |
|--------|------|
| 도메인 경계 모호 | system prompt 담당 영역 100% 명시 + PM 1차 판단 |
| knowledge sync 이중 관리 | 절대 룰만 system prompt 직접 + 핵심 지식은 knowledge 인용 1줄 (single source) |
| 에이전트 수 폭증 (8+8=16) | P1→P4→P5 점진 + PM 호출 룰 명문화 |
| 도메인 에이전트 테스트·리뷰 잘못 처리 | 협업 규칙 = tester/reviewer 위임 의무 |
| 시범 1개 실패 → 전체 부정 | 3건 이상 평가 + referee/tournaments 재시도 1회 기회 |
| 운영 DB 사고 (admin) | admin 절대룰 1번 + P4 이후 도입 (위험 분리) |
| 도메인 미특정 영역 | developer/debugger 일반 처리 |
| Flutter 앱 깨짐 | 응답키 변경 ❌ + 원영 공지 + tester curl 검증 |

---

## 4. P1 박제 (시범 시작)

### 4-1. 시범 영역 = live-expert 단독 (4가지 결정타)

1. 알고리즘 깊이 압도적 (minutes-engine v3 메인 path 4단계 + LRM cap)
2. 측정 용이성 — test 21/21 / git commit hash 별 정확도 추적 가능
3. 회복 비용 최저 — 단일 파일 + STL 응답 가공만 (DB 영구 보정 0)
4. 반복 작업 빈번 — "왜 X 출전시간이 Y인가?" 디버깅 패턴 전형

### 4-2. live-expert.md system prompt 구조

```yaml
---
name: live-expert
description: /live/[id] 라이브 페이지 + minutes-engine v3 + STL + PBP 도메인 전문가
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---

## 담당 영역
- 페이지: `src/app/live/[id]/...`
- API: `src/app/api/live/[id]/route.ts` (STL Phase 1)
- lib: `src/lib/live/minutes-engine.ts` ⭐
- DB: match_events / MatchPlayerStat / tournament_matches / score_at_time

## 절대 룰 (6건)
1. 알고리즘 변경 시 test 21/21 PASS 유지
2. 메인 path 4단계 구조 유지
3. 가드 양팀 union 5~12 일관
4. STL Phase 1 응답 가공만
5. Flutter PBP 누락 본질 인지
6. 측정 시 git commit hash "as of [hash]" 명시

## 핵심 지식 (knowledge 인용 5건)
- minutes-engine v3 메인 path 4단계
- STL 3 Layer 구조
- score_at_time 시계열 활용
- PBP-only 엔진 fallback
- BDR Game Score 공식

## 호출 트리거
- 키워드: "라이브", "/live", "출전시간", "minutes", "MVP", "PBP", "쿼터"
- 파일: app/live/, api/live/, lib/live/, lib/games/mvp-aggregate.ts
```

### 4-3. P1 발견 한계 1건

🚨 **Task subagent_type 미등록**: `.claude/agents/<name>.md` 박제 후에도 Task 도구의 `subagent_type` 목록에 자동 등록 ❌. 글로벌 8 에이전트만 등록.

**우회**: planner-architect 또는 developer 위임 시 system prompt 풀텍스트를 prompt 첫머리에 주입.

---

## 5. P2 KPI 측정 6건 (실측 데이터)

### 5-1. 측정 결과

| Phase | 영역 | grep | read | **잘못된 파일** | 시간 | system prompt 주입 |
|-------|------|------|------|----------|------|---------------------|
| #1 (live-expert 시범) | live | 21 | 18 | **0** ✅ | 62분 | ✅ (planner 거쳐) |
| #2 (매치 코드 v4 P1+2) | tournaments | 1 | 6 | **0** ✅ | 30분 | ❌ |
| #3 (매치 코드 v4 P3 backfill) | tournaments | 2 | 5 | **0** ✅ | 12분 | ❌ |
| #4 (매치 코드 v4 P4 generator) | tournaments | 7 | 9 | **0** ✅ | 50분 | ❌ |
| #5 (매치 코드 v4 P5 UI) | tournaments+UI | 12 | 14 | **0** ✅ | 70분 | ❌ |
| #6 (매치 코드 v4 P7 deep link) | tournaments+route | 5 | 4 | **0** ✅ | 25분 | ❌ |
| **누적** | — | **48** | **56** | **0회 6/6** ✅ | **249분** | 1/6 (live만) |

### 5-2. KPI 평가

| KPI | 목표 | 결과 | 평가 |
|-----|------|------|------|
| KPI 3 (잘못된 파일 0회) | 0회 | **6/6 = 100%** | ✅ **달성** |
| KPI 1 (grep/read -50%) | live vs 일반 비교 | 작업 복잡도 다름 → 비교 불가 | ❓ |
| KPI 2 (시간 -30%) | live vs 일반 비교 | 작업 복잡도 다름 → 비교 불가 | ❓ |

---

## 6. 본질 발견 — system prompt 주입 효과 marginal

### 6-1. 충격적 발견

**잘못된 파일 0회 = 6/6** 달성했지만, **그 중 system prompt 주입 적용은 1/6 (live #1만)**.
나머지 5건 (#2~#6 tournaments) = **일반 dev 컨텍스트** (system prompt 주입 ❌) → **그래도 잘못된 파일 0회**.

### 6-2. 본질 분석

| 가설 | 검증 |
|------|------|
| A. live-expert system prompt 주입 효과? | ❌ (5/6은 주입 없이도 0회) |
| B. **planner 사전 분석으로 파일 경로 정확 박제?** | ✅ **본질** |
| C. 작업 자체가 명확 정의 (예: "page.tsx L696 헤더 sticky 추가") | ✅ **부분 본질** |

→ **B + C 조합**이 진짜 효과. system prompt 주입은 **planner 가 이미 해준 일을 중복 박제**하는 것에 불과.

### 6-3. 도메인 sub-agent 가치 4종 평가

| 가치 후보 | 평가 |
|----------|------|
| 디버깅 첫 5분 효율 | ❌ planner 사전 분석으로 이미 해결 |
| 절대 룰 박제 → 사고 0건 | ❌ planner 가 system prompt 주입으로 동등 효과 |
| 도메인 지식 누적 (architecture/decisions/errors 자동 인지) | ❌ knowledge 파일 read 로 동등 효과 |
| Task subagent_type 직접 호출 → 컨텍스트 분리 | ❌ 미등록 한계로 미작동 |

→ **본질적 가치 = 약함** (실측 데이터 기반)

---

## 7. P3 결정 = C 채택 (단호한 권장)

### 7-1. 5개 후보 비교

| # | 옵션 | 비용 | 효과 | 결정 |
|---|------|------|------|------|
| A | Go (전체 8개 확대) | ~6h | 약 (입증 ❌) | ❌ 매몰비용 |
| B | 부분 Go (2~3개) | ~3h | 약 (입증 ❌) | ❌ 매몰비용 축소판 |
| **C** | **live-expert 유지 + 신규 박제 0** ⭐ | **0** | 현상 유지 | ✅ **권장** |
| D | No-Go (전체 종료) | 0 | live 박제 손실 | △ |
| E | 5/18 정식 결정 대기 | 0 | 한계 효용 ≈ 0 | △ |

### 7-2. C 채택 7가지 사유

1. system prompt 주입 marginal gain ≈ 0 (5/6 일반 dev 0회 달성)
2. 본질 가치 4종 모두 약함/미작동
3. 명확 정의 작업 위주 한계 — 모호 디버깅 케이스 0건
4. 확대 비용 > 효과 (A 6h / B 3h 모두 매몰비용)
5. live-expert 박제 보존 가치 (5/3 7회 보강된 알고리즘 깊이)
6. 5/18 대기 한계 효용 ≈ 0 (본 6건으로 본질 명확)
7. 사용자 의도 부분 존중 (시범 1개 영구 = 에이전트 세분화 정신 보존)

### 7-3. 후속 액션

- ✅ live-expert.md 영구 운영 (삭제 ❌)
- ✅ 신규 도메인 에이전트 박제 0
- ✅ KPI 측정 종료 (P2 #6 마지막)
- ✅ PM 호출 룰 미갱신 (기존 8 일반 + live-expert 1 = 9개 운영)
- ✅ lessons.md 박제 3건
- 📌 미래 모호 디버깅 케이스 발견 시 **재진입 옵션 보존** (문 열어둠)

---

## 8. 향후 활용 룰 (PM 호출 가이드)

### 8-1. 명확 정의 작업 vs 모호 디버깅

| 작업 유형 | 예시 | 처리 방식 |
|----------|------|----------|
| **명확 정의 작업** | "page.tsx L696 헤더 sticky 추가" | **planner 사전 분석만으로 충분** → 일반 dev 위임 |
| **모호 디버깅** | "왜 X가 안 되지?" (영역 미특정) | 도메인 sub-agent 진짜 가치 발휘 가능 (현 시범에서는 케이스 0건) |
| 알고리즘 깊은 작업 (live) | "왜 X 선수 출전시간이 Y인가?" | live-expert 직접 호출 가능 (subagent_type 미등록 한계 시 system prompt 주입) |

### 8-2. knowledge sync 룰

- **절대 룰**: system prompt 직접 박제 (변하지 않는 것)
- **핵심 지식**: knowledge 단일 source + system prompt 1줄 인용 (single source 유지)
- **PM 작업 완료 체크리스트에 sync 검토 1줄 추가** (이중 관리 회피)

### 8-3. 재진입 조건 (P3 → 재평가 가능)

| 조건 | 트리거 |
|------|-------|
| Claude Code 가 프로젝트 로컬 에이전트 자동 등록 지원 | CC 업데이트 (Task subagent_type 자동 등록) |
| 모호 디버깅 케이스 다수 발생 (월 3건+) | 영역 미특정 디버깅 패턴 누적 |
| 도메인 지식 폭증 (architecture.md > 50K 토큰) | knowledge 파일 분할 임계점 |
| 신규 팀원 합류 (도메인 학습 곡선 급경사) | 도메인 에이전트가 onboarding 가속 |

→ 위 조건 1개 이상 충족 시 P3 재평가 + 부분 Go (B) 또는 Go (A) 검토.

---

## 9. 핵심 교훈 3건 (lessons.md 박제됨)

### 9-1. 도메인 sub-agent system prompt 주입 효과 marginal — planner 사전 분석이 진짜 본질

P2 KPI 6건 측정 결과 **잘못된 파일 0회 6/6 ✅**. 그 중 system prompt 주입 적용 = 1/6, 나머지 5건은 일반 dev 컨텍스트로도 0회 달성. → **주입 marginal gain ≈ 0**, planner 가 파일 경로/절대 룰/핵심 지식 사전 박제 → developer 가 주입 없이도 0회.

**재발 방지 룰**:
- 명확 정의 작업 = planner 사전 분석만으로 충분
- 모호 디버깅만 도메인 sub-agent 가치
- knowledge sync = 절대 룰만 system prompt + 핵심 지식 = knowledge 인용

### 9-2. KPI 측정 시 작업 복잡도 통제 없으면 비교 불가

P2 시범 KPI 1 (grep/read -50%) + KPI 2 (시간 -30%) **비교 불가**. 작업별 복잡도 너무 다름 (live page.tsx 1926줄 헤더+팀비교 vs tournaments schema 6컬럼).

**재발 방지 룰**:
- 동일 작업 양쪽 적용 (시범 vs baseline) 또는 작업 복잡도 정규화 변수 사전 정의
- binary 지표 (잘못된 파일 0회 vs 1+회) = 통제 무관 / 시간·횟수 비교 = 통제 필수

### 9-3. Task subagent_type 미등록 = 도메인 에이전트 자동 호출 불가 (CC 한계)

`.claude/agents/<name>.md` 박제 후 Task 도구 `subagent_type` 목록 자동 등록 ❌. 글로벌 8 에이전트만 등록. 우회 = planner/dev 위임 시 system prompt 주입 (planner 단계 거쳐야 함 = 추가 비용).

**본질**: Claude Code 가 프로젝트 로컬 에이전트 자동 인식 ❌. 박제만으로는 직접 호출 불가. **CC 업데이트 시 P3 재평가 가능**.

---

## 10. 부록 A — 전체 plan 파일 위치

### A-1. 옵션 A 도메인 sub-agent 신설 상세 계획
**경로**: `~/.claude/plans/dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md`
**구성**: 10 섹션 + 부록 A/B (8 에이전트 system prompt 풀 텍스트 ~150줄/each / Phase 일정 / 부록 §11 P3 결정 결과)

### A-2. 시범 P1 박제
**경로**: `C:\0. Programing\mybdr\.claude\agents\live-expert.md`
**상태**: ✅ 영구 운영 (P3 = C 채택으로 보존)

### A-3. knowledge 박제 위치

| 파일 | 항목 | 날짜 |
|------|------|------|
| `decisions.md` | 매치 코드 v4 채택 / 도메인 sub-agent 시스템 도입 (옵션 A) / **도메인 sub-agent P3 결정 (C 채택)** | 2026-05-04 |
| `lessons.md` | system prompt 주입 marginal / KPI 측정 함정 / Task subagent_type 미등록 | 2026-05-04 |
| `errors.md` | Prisma relation camelCase ↔ schema @@map snake_case | 2026-05-04 |
| `conventions.md` | prisma db push --accept-data-loss 회피 = prisma db execute 직접 SQL | 2026-05-04 |

---

## 11. 마무리 — 사용자 시점 요약

### 사용자가 처음 의도한 것
> "에이전트 더 만들거나 기능별 관리자 만들기"

### 실제로 한 것
1. ✅ **계획 작성** (옵션 A + 8 도메인 + Phase 5단계)
2. ✅ **시범 박제** (live-expert.md)
3. ✅ **실측 데이터 6건 수집**
4. ✅ **본질 발견** (planner 사전 분석이 진짜 효과)
5. ✅ **결정 박제** (P3 = C 현상 유지)

### 사용자가 얻은 것
- **명확한 답**: "도메인 에이전트 = 효과 약함, planner-architect 가 충분"
- **시범 박제 1개**: live-expert.md (알고리즘 깊은 도메인, 영구 보존)
- **재진입 옵션**: 미래 조건 충족 시 P3 재평가 가능
- **knowledge 박제 7건**: 동일 함정 회피 + 검색 가능

### 비용 vs 가치
- **비용**: ~5h (planner 분석 2회 + P1 박제 + P2 측정 6건 + P3 결정 + 박제)
- **회피한 비용**: ~6h (P4+P5 매몰비용)
- **순 절감**: **+1h + 정직한 데이터 기반 결정**

→ **실패한 시범처럼 보이지만 실은 가장 가치 있는 결과**: 빈약한 효과를 입증하고 매몰비용 회피.

---

> **본 보고서는 미래 PM 또는 사용자가 "도메인 에이전트 다시 검토" 의 욕구가 들 때 첫 번째로 읽어야 할 문서**. 5월 4일 시점의 데이터·결정·교훈 모두 박제. 재진입 시 §8-3 "재진입 조건" 트리거 충족 여부를 먼저 확인.
