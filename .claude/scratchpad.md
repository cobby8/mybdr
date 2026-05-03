# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[P2 측정 #1 구현 완료 / tester+reviewer 대기] live-expert 첫 케이스** (~25분 / `as of 3cd1249`) — 3 파일 변경 + tsc exit 0. tester + reviewer 병렬 호출 → 통과 시 PM 자동 커밋.

### 구현 기록 (developer / live-expert 컨텍스트)

📝 구현한 기능: 라이브 페이지 헤더 sticky + 모바일 미니스코어 + 팀 비교 막대 옵션 C 정규화 분기 + HOME/AWAY 색 분리

| 파일 | 변경 | 신규/수정 |
|------|------|---------|
| `src/app/live/[id]/page.tsx` | 헤더 sticky top-0 z-20 backdrop-blur + 모바일 미니스코어 (라이브만, sm:hidden) + abbreviateTeamName helper 추가 + LIVE 라벨 sm:flex 로 PC 만 + 토너먼트명 sm:inline | 수정 |
| `src/app/live/[id]/_v2/tab-team-stats.tsx` | StatRow.kind 필드 (count/percent) + normalizeBar 함수 + StatCompareRow 에서 색/weak 모디파이어 적용 | 수정 |
| `src/app/live/[id]/_v2/tab-team-stats.css` | `.tts-bar--home` (var(--accent)) / `.tts-bar--away` (var(--cafe-blue)) / `.tts-bar--weak` (opacity 0.4) 추가 | 수정 |

💡 tester 참고:
- 테스트 1: 라이브 매치 페이지 모바일 (≤640px) → 헤더 sticky 동작 (스크롤 시 고정) + 미니스코어 노출 확인 (예: "라이 57:73 셋업 Q3")
- 테스트 2: PC (≥640px) → 토너먼트명 + LIVE 라벨 + ThemeToggle 정상, 미니스코어 미노출
- 테스트 3: 종료 매치 → sticky 헤더 적용됨 (요청대로) + 미니스코어 미노출 (isLive=false)
- 테스트 4: 팀 비교 탭 — 블록 1 vs 0 → opacity 0.4 약화 / 스틸 2 vs 2 → 50%/50% + HOME 빨강 / AWAY 파랑 색 구별
- 테스트 5: FG% 43% vs 49% → width 43% / 49% (절반 가까이 / 합 정규화 X)
- 회귀: tts-bar 단일 클래스 사용처 = 본 컴포넌트만 (grep 검증)
- tsc --noEmit exit 0 확인

⚠️ reviewer 참고:
- `abbreviateTeamName` 한글/영문 분기 — Hangul Syllables 정규식 `[가-힯]` (보존 OK / 헷갈리면 `[가-힣]` 동일)
- `var(--accent)` = `var(--bdr-red)` (BDR Red) / `var(--cafe-blue)` 라이트=#0F5FCC, 다크=#3B82F6 (globals.css L98 / L90 / L141)
- sticky z-20 < AppNav z-30 (글로벌 헤더 우선 — 충돌 0)
- 헤더 backdrop-blur — sticky 시 컨텐츠 비치는 자연스러운 오버레이 (배경 var(--color-card) 위)

#### KPI 자가 측정 (P2 #1 / live-expert 첫 케이스)
- **grep**: 3 (tts-bar 사용처 / isLive 변수 / team_abbr 컬럼 존재 여부)
- **read**: 4 (scratchpad / page.tsx L680~760 / tab-team-stats.tsx 전체 / .css 전체) + 추가 1 (page.tsx L340 helper 위치 확인)
- **잘못된 파일 read**: 0회 ✅
- **edit**: 6 (page.tsx 헤더 + helper + tab-team-stats.tsx StatRow 3구간 + .css 1구간)
- **시작→tsc 통과**: ~25분
- **체감 효과**: live-expert 컨텍스트 주입으로 ① 변경 대상 3파일 정확히 인지 (page.tsx / `_v2/tab-team-stats.{tsx,css}`) ② planner 분석 결과 (옵션 C 분기 / HOME=accent / AWAY=cafe-blue / 합≤2 weak / 진입점 5종 변경 ❌) 그대로 카피 ③ 절대 룰 (API/route 미수정 / AppNav frozen / 종료 모드 game-result.tsx 미수정 / 토큰만) 사전 인지로 사고 0건. 일반 developer 대비 page.tsx 1926줄 헤매기 0 / 잘못된 파일 read 0
- **as of**: 3cd1249

**KPI 누적** (분석 baseline = grep 8 / read 5 / 잘못된 파일 0 / 12분 / `05677ed`).

## 리뷰 결과 (reviewer)

### [2026-05-04 / live-expert P2 #1 리뷰] sticky 헤더 + 팀 비교 막대 옵션 C

| # | 영역 | 결과 | 비고 |
|---|------|------|------|
| 1 | 코드 품질 | ✅ | normalizeBar 순수함수+clamp+kind 분기 / StatRow.kind 12행 모두 부여 / `[가-힯]` Hangul Syllables 정확 (가-힣 동치) |
| 2 | BDR-current 13룰 | ✅ | 토큰만(`var(--accent)/(--cafe-blue)/(--color-card)/(--color-border)`) / lucide ❌ / pill ❌ / AppNav 미수정 (라이브 라우트는 `(web)` 그룹 밖이라 AppNav 자체 미렌더 → z 충돌 우려 0) |
| 3 | 보안 (UI만) | ✅ N/A | DB·auth·API·외부 fetch 영향 0 (UI 한정) |
| 4 | 성능 | ✅ | normalizeBar 12행 × 단순 산술 = useMemo 불필요 / sticky+backdrop-blur 모바일 paint 비용 미미 / opacity transition 0.3s 가벼움 |
| 5 | 접근성 | ✅ | 미니스코어 `aria-label="홈팀 N 대 N 원정팀"` 명시 / 색맹 — 위치(좌/우) + 라벨로 보강 / 수치 라벨 항상 노출 (시각 막대 외 보강 OK) |
| 6 | 도메인 일관성 | ✅ | minutes-engine / api/live/[id]/route / game-result.tsx / 진입점 5종 모두 변경 0 (git diff 검증) |
| 7 | 회귀 / 사이드 이펙트 | ✅ | `.tts-bar` 사용처 = 본 컴포넌트만 / `--accent`·`--cafe-blue` globals.css 정의 정상 / `abbreviateTeamName` page.tsx 단독 |

**개선 제안** (LOW — 본 작업 범위 외 큐):
- LOW: `abbreviateTeamName` 향후 다른 모바일 컴팩트 뷰에서도 쓸 가능성 → `src/lib/utils/team-display.ts` 추출 후보 (현재 단일 사용처라 인라인 OK)
- LOW: 미니스코어 color 막대 ❌ (텍스트만) — 색맹 사용자 추가 보강 불필요 (위치+라벨로 충분)
- LOW: page.tsx 1926줄 → 컴포넌트 분리 큐 (live-expert 별도 사이클)

**판정**: ✅ 통과 (LOW 개선 큐 3건만, 본 작업 범위 외)
**KPI**: reviewer grep 4 / read 4 / tsc exit 0 검증 / ~10 분 / as of 3cd1249 + unstaged

## 테스트 결과 (tester)

### [2026-05-04 / live-expert P2 #1 검증] sticky 헤더 + 팀 비교 막대 옵션 C — ✅ 통과

| # | 검증 항목 | 결과 |
|---|----------|------|
| 1 | tsc --noEmit exit 0 | ✅ |
| 2 | normalizeBar 5 케이스 trace (0/0·1/0·57/73·43%/49%·110/-5) | ✅ |
| 3 | sticky z-20 < `.app-nav` z-50 (globals.css L377) 충돌 회피 (라이브는 `(web)` 그룹 밖이라 미렌더 추가 안전) | ✅ |
| 4 | 종료 모드(game-result.tsx)·진입점(tournaments)·AppNav·schema·api/lib/live 변경 0 | ✅ |
| 5 | 토큰 정합 (`--accent`/`--cafe-blue` 라이트 L98/90 + 다크 L148/141 정의 OK / 변경 파일 하드코딩 색 0) | ✅ |
| 6 | minutes-engine 회귀 vitest 21/21 PASS | ✅ |
| 7 | 시나리오 5종 trace (라이브×모바일/PC / 종료=v2 분기 / 블록 1:0 weak / FG% 절대) | ✅ |

**발견 사항**:
- 종료 모드는 page.tsx L685~687 가 `<GameResultV2 .../>` 분기 → 본 sticky/미니스코어 코드 미실행 (game-result.tsx 자체 헤더, 미수정 = 명세대로 의도된 분기).
- StatRow 12 항목 kind 부여 정확 (count 9 + percent 3).
- git status에 미커밋 `globals.css`/`community-content.tsx` 잔여 (직전 커뮤니티 fade 작업 — 본 검증 범위 외, live 영역 0 영향).
- reviewer 와 결과 일치 (병렬 검증) — 통과 판정 동일.

**판정**: ✅ 통과 (실패 0 / 수정 요청 없음 — 즉시 커밋 가능)
**KPI**: tester grep 6 / read 5 / bash 4 (tsc / vitest 21/21 / git diff stat 2회) / ~10분 / as of 3cd1249

## 기획설계 (planner-architect)

### [2026-05-04] 옵션 A — 도메인 sub-agent 신설 상세 계획 (전체 보고서 박제)

> 전체 계획 = `C:\Users\user\.claude\plans\dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md` (10 섹션 + 부록 A/B). 이하 PM 보고용 압축 요약.

#### 1. 도메인 8개 확정 (정량 근거 = (web)/api/lib 파일 수 + 200 commits scope 빈도)
| 에이전트 | 담당 영역 | commit 빈도 (200) | 단독 가치 |
|---------|----------|------------------|----------|
| tournaments-expert | (web)/tournaments 48 + tournament-admin 24 + series + api/web 23 routes + lib/tournaments 13파일 | 43 | architecture 9항목 / 회귀 5종 / 매치코드 Phase 1~7 |
| **live-expert ⭐ (시범)** | /live/[id] + minutes-engine v3 + STL + PBP + mvp-aggregate | **44** | 알고리즘 깊이 (5/3 7회 보강) / 단일 파일 / test 21/21 |
| referee-expert | (referee) 26 pages + 38 routes + Association 14모델 | 31 | 라우트 그룹 분리 / 14모델 schema |
| flutter-api-expert | api/v1 27 routes + JWT + recorder + duo + batch sync | ~10 (저빈도·고위험) | 변경 시 모바일앱 깨짐 — 원영 사전공지 |
| admin-expert | (admin) 19 pages + admin/partner API 19 routes + cafe-sync 5파일 + news 7파일 + 알기자 | 54 | 운영 영향 최대 (DB destructive 가드) |
| teams-courts-expert | (web)/teams 25 + courts 29 + 픽업·대관 + mergePlaceholderUser | 29 | 핵심 함수 단위 응집 |
| profile-community-expert | profile 59 tsx + users + community 17 + 알림 + 인증 + Hybrid 박제 패턴 | 57 | D-N 8박제 + page-hero 공통룰 |
| design-system-expert | BDR-current 13룰 + AppNav frozen + globals.css + Hero + 모바일가드 | **133** | 모든 도메인 UI 박제 자동 검수자 |

**의도적으로 단독 도메인 안 한 것**: community(profile 결합) / auth-security(저빈도 안정) / games(tournaments+live 분산) / news(admin 결합)

#### 2. 시범 영역 = **live-expert 단독** (4가지 결정타)
1. 알고리즘 깊이 압도적 (minutes-engine v3 메인 path 4단계 + LRM cap + 양팀 union 가드 5~12)
2. 측정 용이성 — test 21/21 / git commit hash 별 정확도 추적 가능
3. 회복 비용 최저 — 단일 파일 + STL 응답 가공만 (DB 영구 보정 0)
4. 반복 작업 빈번 — "왜 X 출전시간이 Y인가?" 디버깅 패턴 전형

**보류 사유**: tournaments(작업 단위 너무 큼) / admin(운영 사고 위험) / referee(5월 첫주 빈도 0)

#### 3. KPI 3종 (시범 2주 측정)
| KPI | 목표 | 측정 |
|-----|------|------|
| 디버깅 첫 5분 grep/read 횟수 | -50% 이하 | scratchpad "조사 grep N회 / read M회" 명시 |
| 동일 작업 완료 시간 | -30% 이하 | commit timestamp 차이 (3건 이상) |
| 잘못된 파일 건드린 횟수 | 0회 | commit diff 자동 grep |

#### 4. Phase 5단계 (총 ~6주)
| Phase | 산출물 | 시간 | 진입조건 |
|-------|-------|------|---------|
| P1 | live-expert.md 박제 + decisions 입력 | 1.5h | 본 계획 사용자 승인 |
| P2 | 첫 케이스 측정 (KPI baseline) | 실작업 1건 (1~3h) | P1 + 실작업 발생 |
| P3 | KPI 2주 누적 → Go/No-Go 결정 | 2주 | 시범 시작 +14일 |
| P4 | 확대 1 (tournaments + admin) | 3h + 1주 | P3 Go |
| P5 | 전체 8개 + PM 호출 룰 갱신 | 8h + 1주 | P4 + 4주 누적 KPI 달성 |

#### 5. 롤백 기준 6종
- 도메인 경계 모호 (3건 이상 PM 30초+ 고민) / 잘못된 에이전트 호출 30%+ / KPI 미달 (개선 1회 후도) / 잘못된 파일 1회+ / 사용자 정성 부정 / knowledge sync 부담 ↑ (30일+ 미갱신)

#### 6. 리스크 8종 + 완화 (요약)
| 리스크 | 완화 |
|--------|------|
| 도메인 경계 모호 | system prompt 담당 영역 100% 명시 + PM 1차 판단 |
| knowledge sync 이중 관리 | 절대 룰만 system prompt 직접 + 핵심 지식은 knowledge 인용 1줄 (single source) |
| 에이전트 수 폭증 (8+8=16) | P1→P4→P5 점진 + PM 호출 룰 명문화 |
| 도메인 에이전트가 테스트·리뷰 잘못 처리 | 협업 규칙 = tester/reviewer 위임 의무 |
| 시범 1개 실패 → 전체 부정 | 3건 이상 평가 + referee/tournaments 재시도 1회 기회 |
| 운영 DB 사고 (admin) | admin 절대룰 1번 + P4 이후 도입 (위험 분리) |
| 도메인 미특정 영역 | developer/debugger 일반 처리 |
| Flutter 앱 깨짐 | 응답키 변경 ❌ + 원영 공지 + tester curl 검증 |

#### 7. 기존 시스템 통합
- **knowledge sync 룰**: 절대 룰 = system prompt 직접 박제 (변하지 않는 것) / 핵심 지식 = knowledge 단일 source + system prompt 1줄 인용 / PM 작업 완료 체크리스트에 "system prompt 영향 검토" 1줄 추가
- **PM 호출 우선순위** (P5 후): 1순위 도메인 에이전트(트리거 매칭) → 2순위 planner-architect(메타) → 3순위 developer/debugger(미특정) → 항상 tester+reviewer(병렬)
- **scratchpad**: 도메인 에이전트 별도 섹션 ❌ → 기존 섹션 공용 ("발견자" 필드만 도메인 명시). 작업 로그 한 줄 형식 유지 (도메인 prefix `[live]` 옵션)

#### 8. 8 에이전트 저장 위치 권장
`C:\0. Programing\mybdr\.claude\agents\<name>.md` (프로젝트 폴더 — mybdr 전용 도메인 격리). 글로벌(`~/.claude/agents/`) 도 무해하나 다른 프로젝트 노이즈.

#### 9. decisions.md 박제 형식 제안
> PM 이 본 계획 승인 후 decisions.md 최상단에 다음 추가 (전체 plan 부록 §9 참조):
```
### [2026-05-04] 도메인 sub-agent 시스템 도입 — 옵션 A 채택 + 시범 live-expert 단독 시작
- **분류**: decision
- **발견자**: planner-architect
- **내용**: [...8 도메인 확정 / 시범 live-expert / KPI 3종 / Phase 5단계 / 롤백 6종 / 리스크 8종 / sync 룰...]
- **참조횟수**: 0
```

#### 10. PM 즉시 액션
1. ✅ scratchpad "기획설계" 섹션 박제 (본 항목)
2. (다음) decisions.md 최상단 §9 형식 항목 추가
3. (다음) 사용자에게 P1 진행 승인 요청 — "live-expert.md 박제 1.5h 시작할까요?"
4. (P1 진행 시) `C:\0. Programing\mybdr\.claude\agents\live-expert.md` 작성 (전체 plan §2-2 카피)
5. (다음) 작업 로그 +1줄 / index.md 갱신 (decisions 94→95)

> **8 에이전트 system prompt 풀 텍스트 = 전체 plan 파일 §2-1~§2-8** (각 ~150줄 / 박제 가능 완성도). 본 scratchpad 압축 박제는 PM 보고용 개요만.

### [2026-05-04 추가 / live-expert P2 첫 케이스] 라이브 페이지 뒤로가기 + 팀 비교 막대 분석 (as of 05677ed)

**§1 뒤로가기 / iPhone UI 진단** (코드 변경 0):
- 라이브 모드: `page.tsx` L705~720 `window.history.back() + length>1 fallback "/"`. 모바일 `<span hidden sm:inline>` 텍스트 숨김 → 아이콘만 노출 (iOS 패턴 근접). sticky ❌ (L696 일반 border-b)
- 종료 모드: `game-result.tsx` L256~272 동일 패턴 + `btn btn--sm`. sticky ❌
- **탭 처리**: 종료만 5탭 (`useState<TabId>` L168 / 요약·팀·박스·타임·샷). URL ?tab= 동기화 ❌ (history 누적 0 / 탭 직링크 ❌ / 새로고침 시 요약 fallback). 라이브 모드 = 탭 0
- **진입점 5종**: `tournaments/[id]` schedule-timeline (L231) / bracket league-schedule (L113) / dashboard-header LIVE 카드 (L112) + 최근 MVP (L209) / dual-bracket-sections (L289). 모두 `<Link href={/live/${id}}>` push (default) — 뒤로가기 정상
- **tournament-tabs.tsx L319 단서**: "/live/{id} → 뒤로가기 시 원 탭 + 스크롤 위치 정확 복귀" 위해 `router.replace + scroll:false` 패턴 적용됨 (라이브 진입점에서 뒤로가기 복귀 OK)
- **알림 진입**: Grep 결과 0 → 알림 → /live/[id] 직링크 진입점 미식별 (사용자 결정 대기)
- **iPhone 패턴 매핑**:
  | iOS HIG | 현재 | 적용 가능성 |
  |---------|------|------------|
  | Navigation Bar (좌< / 가운데제목 / 우액션) | 좌 뒤로+홈 / 좌 토너먼트명 / 우 LIVE+테마 | ⚠️ 토너먼트명을 가운데 정렬 시 PC AppNav 충돌 → **모바일만** |
  | Sticky 헤더 (스크롤 시 고정) | ❌ | ✅ 라이브 모드 우선 (스코어 항상 보이기) |
  | Large Title → 스크롤 시 축소 | ❌ | ⚠️ HeroScoreboard 와 겹침 — 보류 |
  | Back Swipe Gesture | 브라우저 기본 의존 (iOS Safari ✅ / Android ❌) | iOS 기본 동작이므로 추가 구현 불필요 |
  | Modal vs Push 구분 | 전부 push | ✅ 현재 OK |
- **AppNav frozen 충돌 검수**: 라이브 페이지 로컬 헤더 (L696) ≠ AppNav. AppNav 는 더 위. 라이브 헤더는 페이지 내 sub-nav → 변경 자유 (13룰 §A 미해당). globals.css `--color-card / --color-border / --color-text-secondary` 토큰 사용 중 (✅ §C-10 토큰 룰 일치)

**§1 권장 (사용자 결정 대기)**:
- (즉시·저비용) 라이브 모드 헤더에 `sticky top-0 z-20` 추가 + 모바일 스코어 미니버전 (스크롤 시 노출) — 라이브 진행 중 스코어 항상 보이게. 종료 모드는 보류
- (중비용) 종료 모드 5탭 URL 동기화 (tournament-tabs 패턴 카피 — `router.replace + ?tab=team` + initialTab from searchParams) — 직링크 + 새로고침 시 탭 보존 + 뒤로가기 시 탭간 이동 history 누적 ❌
- (보류) Large Title / Back Swipe — iOS 기본 동작으로 충분, mybdr 디자인 시스템 (BDR-current 13룰) 과 충돌 위험. **단계 도입 ❌ 권장**
- 영향 범위: 라이브만 (다른 페이지 확산 ❌) — Phase 1 단독 단계

---

**§2 팀 비교 막대 그래프 진단** (코드 변경 0):
- 위치: `_v2/tab-team-stats.tsx` L145 `total = home + away || 1` / `homePct = home/total*100` / `awayPct = away/total*100`. CSS `_v2/tab-team-stats.css` L156 `.tts-bar { background: var(--cafe-blue) }` (HOME/AWAY 동일 색)
- **사용자 스크린샷 검증**:
  | 항목 | home | away | home% | away% | 사용자 인상 | 진단 |
  |------|------|------|-------|-------|------------|------|
  | 득점 | 57 | 73 | 44 | 56 | 거의 같음 | ⚠️ 작은 시각차 (요인: 합 정규화 + 동일 색) |
  | 블록 | 1 | 0 | 100 | 0 | 1이 풀폭 | ❌ **합 1 → 풀폭 = 비현실적** |
  | 스틸 | 2 | 2 | 50 | 50 | 둘 다 같음 | ⚠️ 색 차이 ❌ → 구별 X |
  | FG% | 43% | 49% | 46.7 | 53.3 | 거의 같음 | ❌ **% 항목인데 합 정규화 = 의미 손실** (절대 0~100 스케일이어야 50%=절반) |
- **3 본질**: ① % 항목 (FG%/3P%/FT%) 도 합 정규화 → 50% 가 절반이 아닌 비례로 표시 ② 카운트 항목에서 0 vs N 극단값 → 100% vs 0% 풀폭/제로 ③ HOME/AWAY 색 동일 → 좌우 구별이 시각이 아닌 위치만
- **권장 옵션 C (분기 처리)**:
  - 합산 항목 (득점/리바/오펜스/디펜스/어시/스틸/블록/턴오버/파울): `home/(home+away) * 100` (현재 유지) + **시각 보정**: 양쪽 합이 작을 때 (≤2) 풀 스케일 적용 X — 예 `min(scale, 100 * total / domainMax)` 도메인 max (블록 5 / 스틸 8 / 파울 25 등 도메인 상수) 또는 `if (total <= 2) opacity: 50%` 같은 시각 약화
  - % 항목 (FG%/3P%/FT%): **절대 0~100 스케일 — `width: ${homeNum}%` 직접**. 50% = 절반. 합 무관
  - 0 vs 0 처리: 양쪽 모두 `min-width: 2px` (현재 유지) + 라벨 옆 "—" N/A 표기
  - HOME = `var(--accent)` (BDR Red), AWAY = `var(--cafe-blue)` 색 분리 (좌우 시각 구별)
- **회귀 테스트 케이스 5종**: (a) 0/0 양쪽 0 → N/A (b) 1/0 카운트 → 시각 약화 또는 도메인 max 기준 (c) 동일값 → 50/50 + 색 구별 (d) 큰 차이 (50 vs 10) → 정상 (e) % 항목 (40%/45%) → width 40% vs 45% 직접
- **변경 영향 범위**: 1 파일 (`tab-team-stats.tsx` 분기 + `.css` 색 분리). lib 추출 ❌ 가치 (단일 컴포넌트). API/데이터 패칭 0 변경 (UI 룰 충실)
- **AppNav frozen / 13룰 충돌 ❌**: 토큰만 쓰고 (`var(--accent)/(--cafe-blue)`) lucide ❌ / pill ❌

**§2 권장 (사용자 결정 대기)**:
- 옵션 C 채택 + 색 분리 (HOME=accent / AWAY=cafe-blue) 동시
- 5종 회귀 테스트 (Vitest 추가) — live 도메인 lib 추출 X / 컴포넌트 단위 snapshot
- 영향 = 1 파일 + 1 CSS (~30분 작업)

---

**KPI 자가 측정 (P2 baseline / live-expert 첫 케이스)**:
- **grep**: 8회 (Glob 1 + Grep 7)
- **read**: 5회 (scratchpad / page.tsx 부분 / game-result.tsx 전체 / tab-team-stats.tsx 전체 / tab-team-stats.css 전체 / tournament-tabs.tsx L300~ 부분)
- **잘못된 파일 read**: 0회 ✅ (전부 live 도메인 또는 진입점 정상)
- **시작→박제 완료**: ~12분 (도구 호출 timestamps 추정)
- **체감 효과**: live-expert 컨텍스트 주입으로 **메인 path 4단계 / STL Phase 1 / `_v2/` 위치 즉시 인지** → page.tsx 1926줄 전체 읽기 회피 + 진입점 5종 grep 1회로 식별. 일반 에이전트 대비 read 헛 호출 0 + 보고서 도메인 정확도 ↑ 체감. 단 **한계**: live 도메인 = `/live/[id]` + `_v2/` + `api/live/` 명확하지만 진입점 (tournaments/_components/...) 은 tournaments-expert 영역 침범 우려 — P3 KPI 평가 시 "도메인 경계 모호도" 1건 기록
- **as of**: 05677ed (HEAD)

> **PM 검증**: scratchpad "## 기획설계 (planner-architect)" 섹션 끝에 본 항목 추가. 작업 로그 갱신은 PM 책임.

---

## 🎯 다음 세션 진입점 (2026-05-02 종료 시점)

### **🚀 1순위 — 매치 코드 신규 체계 도입 (Phase 1~7, ~3~4h)**

**형식**: `{short_code}[종별][디비전]-{NNN}` 7~10자 (예: `M21-001` / `M21-D1-001` / `M21-A-001` / `M21-A1-001`)

**Phase**: ① schema (short_code + match_code + UNIQUE + category denorm) → ② helper module → ③ 운영 backfill (몰텐배 27매치) → ④ generator 4종 통합 → ⑤ UI 노출 → ⑥ 미부여 backfill (TEST 16/열혈 31) → ⑦ deep link (옵션)

**결정 4건 대기**: Q1 자동생성 알고리즘 A/B/C(권장 C 하이브리드) / Q2 형식(3~7자/영대+숫자/첫글자영문) / Q3 변경정책(영구 추천) / Q4 `series.short_code` 컬럼 신설 여부

**핵심 분석 (운영 25개 대회)**: `tournaments.categories` JSON 만 채워짐 (몰텐배·TEST), `tournament_teams.category/division_tier` 거의 null, 매치번호 부여 일관성 X, `match_number` UNIQUE 인덱스 부재

---

### 🟡 HOLD 큐
- **자율 QA 봇 시스템** (사용자: "내가 얘기 안 꺼내면 환기해줘") — Phase 1~5 / 9d
- **BDR 기자봇 v2** — Phase 1 완료 (알기자 / Gemini 2.5 Flash). Phase 2~7 (DB articles + 게시판 'news' 카테고리 + 사용자 선별 + 피드백) 대기

---

## 🔴 5/2 대회 종료 후 잔여 큐 (미완료만)

| # | 항목 | 상태 |
|---|---|---|
| **A** | **placeholder User 89명** — 5/3 누적 -21 (박백호 -1 + 셋업 -2 + 18건 일괄 -18). 보류 3건 (오승준/이상현/이정민 동명이인). 잔여 86건 LOW (본인 미가입 — 본인 가입 시점에 mergeTempMember 자동 처리) | 🟡 89/107 |
| **B** | **ttp 부족팀 5팀** — MI 9 / 슬로우 8 / MZ 11 / SA 9 / 우아한 9 (12명 미만). 운영팀 명단 컨택 필요 | 🟡 사용자 액션 |

**5/2~5/3 완료** (압축 — 상세는 git log): 셋업팀 가입 대기 17명 정리 + approveJoinRequests 함수 ✅ / 셋업 ttp 매핑 ✅ / mergeTempMember 강화 (e029fac) ✅ / 미가입 명단 INSERT (블랙라벨 11/MSA 5/슬로우 8) ✅ / 가입신청 pending 16건 일괄 approve ✅

---

## 우선순위 2 — 결정 대기 큐 (사용자 판단 후 구현)

| 영역 | 결정 건수 | 산출물 |
|---|---|---|
| **관리자페이지 UI 개선** | 6건 (Phase A 모바일 가드 1순위) | `git log -- .claude/scratchpad.md` "관리자페이지 UI 개선" |
| **Games 박제 Phase A** (dead code 정리) | 별도 commit 큐 | commit `f4b55c2` 직전 |
| **Phase F2 wrapper 연결** | mount 완료 (a437829) | commit `2dc9af8` |
| **Teams Phase A** | dead code 5 파일 삭제 commit | commit `dfe5eb5` 직전 |

---

## 우선순위 3 — 인프라 / 영구 큐
- 카카오맵 SDK Places 통합 / 미매칭 placeholder 73명 통합 / PortOne 본인인증 / 대회 로컬룰
- 슛존 / 스카우팅 / 시즌통계 / VS비교 / 커뮤니티 답글 / waitlist / QR 티켓
- AppNav 쪽지 unread count 뱃지 / D-6 §2~§4 / D-3 §02·§05 / Q1 후속 옛 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| **5/2 동호회최강전 D-day 운영** | ✅ DB 16팀 + 27경기 + 회귀 방지 5종 + audit log |
| **dual_tournament 진출 슬롯 회귀 방지** | ✅ A~E 5종 (자가 치유 / PATCH 차단 / dirty tracking / 검출 / audit log) |
| **PC UI** | ✅ 우승예측 사이드바 / 일정 카드 콤팩트+그리드+매치번호 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| **Live `/live/[id]` v2** | ✅ STL Phase 1~2 + **minutes-engine v3 (메인 path 4단계 + LRM cap, 종료 100%/라이브 99%, test 21/21)** |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-04 | (developer / 미커밋, tester+reviewer 대기) | **[live] P2 측정 #1 구현 — 라이브 헤더 sticky + 모바일 미니스코어 + 팀 비교 막대 옵션 C 정규화** — 3 파일 / tsc exit 0. ① `page.tsx` 헤더 sticky top-0 z-20 backdrop-blur + 모바일 미니스코어 (홈약칭 NN:NN 원정약칭 + Q표기, 라이브만 sm:hidden) + `abbreviateTeamName` helper (한글 첫2자 / 영문 머릿글자 4자 / 단어 4자) + LIVE 라벨 sm:flex 로 PC 만 + 토너먼트명 sm:inline. ② `_v2/tab-team-stats.tsx` `StatKind = "count"\|"percent"` + `normalizeBar()` 함수 (percent: 0~100 절대 / count: 합 정규화 + 합≤2 visualWeak / 0:0 visualWeak) + StatCompareRow 에서 `.tts-bar--home/away/weak` 모디파이어 적용. ③ `.css` HOME=`var(--accent)` / AWAY=`var(--cafe-blue)` / weak=opacity 0.4 + transition opacity 추가. **회귀**: `.tts-bar` 단일 클래스 사용처 = 본 컴포넌트만 (grep 검증) / API/route 변경 0 / DB 영향 0 / AppNav frozen 0 / 토큰만. **KPI #1**: grep 3 / read 5 / 잘못된파일 0 / edit 6 / 25분 / `as of 3cd1249`. live-expert 컨텍스트 주입 효과 = 변경 3파일 정확히 인지 + 절대룰 사전 인지로 사고 0건 | ⏳ tester+reviewer |
| 2026-05-04 | (P1 schema + P2~P3 코드 + P4 backfill 34건 + P5 박제) | **알기자 Phase 1 DB 영구 저장 마이그 (사용자 의도 100% 일치)** — 사용자 의도 ("경기종료 트리거 → 본기사+요약 2종 매치당 1회 보장 / 본=admin 검수 / 요약=즉시") vs 5/3 구현 비교 → Gap 4건 (G2 트리거 시점 / G3 영구 저장 / G4 트리거 통합 / G5 매치당 1회) 모두 해소. **P1**: `tournament_matches.summary_brief Json?` NULL 허용 ADD COLUMN (무중단) + prisma db push + dev server PID 2648 종료 후 client 재생성. **P2**: `auto-publish-match-brief.ts` 통합 — `Promise.allSettled([publishPhase1Summary, publishPhase2MatchBrief])` 독립 병렬, 한쪽 실패 ≠ 다른쪽 영향. fire-and-forget 패턴 + 시그니처 유지 (호출자 변경 0). **P3**: `tab-summary.tsx` client fetch 완전 제거 (useState/useEffect/BriefResponse 모두 삭제) → `match.summary_brief` props 직접 사용. `/api/live/[id]` 응답에 `summaryBrief` 필드 추가. cold start LLM 재호출 X. **P4**: backfill 35매치 (운영 endpoint phase1-section 호출 → DB UPDATE) — 34/35 성공 (평균 175자, 목표 150~250 적중) / 실패 1건 (#88 validate-brief "땀" reject — prompt 개선 큐). 1초 간격 rate-limit 회피, 임시 스크립트 2개 즉시 삭제. **P5**: architecture +1, decisions +2 (요약 저장 위치 / 트리거 통합 패턴), errors fix 항목 영구 해소 박제, index.md 갱신. tsc exit 0. 미푸시 = backfill DB 변경 + 코드 변경 미커밋 | ✅ |
| 2026-05-04 | (planner-architect / 메타 — 코드 0) | **옵션 A 도메인 sub-agent 신설 상세 계획 박제** — 정량 데이터 수집 (web 페이지/api routes/lib 파일/200 commits scope 빈도) 후 **8 도메인 확정** (tournaments-expert / live-expert / referee-expert / flutter-api-expert / admin-expert / teams-courts-expert / profile-community-expert / design-system-expert). 단독 도메인 안 한 것 = community(profile 결합) / auth-security(저빈도) / games(분산) / news(admin 결합). **시범 = live-expert 단독** (알고리즘 깊이 / 단일 파일 / test 21/21 / DB 영향 0 / 회복 비용 최저). KPI 3종 (grep/read -50% / 작업시간 -30% / 잘못된 파일 0회) 2주 측정. **Phase 5단계 (~6주)**: P1 박제 1.5h → P2 첫 케이스 → P3 KPI 2주 + Go/No-Go → P4 확대 3개 (tournaments+admin) → P5 전체 8개 + PM 룰 갱신. **롤백 6종** (도메인 모호 / 잘못된 호출 30%+ / KPI 미달 / 잘못된 파일 1회+ / 사용자 부정 / sync 부담). **리스크 8종 + 완화 명시**. system prompt vs knowledge sync 룰 = 절대 룰만 system prompt 박제 + 핵심 지식은 knowledge 인용 1줄 (single source). 8 에이전트 system prompt 풀 텍스트 (각 ~150줄) = `C:\Users\user\.claude\plans\dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md` 부록 §2-1~§2-8. scratchpad "기획설계" 압축 박제 완료 (10 섹션 요약). PM 다음 액션: decisions.md +1 (§9 형식) + 사용자 P1 승인 요청 + index.md 갱신 (decisions 94→95) | ✅ |
| 2026-05-04 | 9b4019a (dev) + 887b89c (main) merge + 운영 DB INSERT 7건 (post 1373~1379) | **알기자 누락 7매치 backfill 완료 (#141~#147)** — (a) subin→dev→main 머지 (settings.local.json conflict 해결: jumpball/awk/xargs git 3개 권한 통합) (b) 일회성 스크립트가 운영 endpoint `/api/live/{141..147}/brief?mode=phase2-match` 7번 fetch (1초 간격, rate-limit 회피) → 응답 brief 받아 운영 DB community_posts INSERT (status=draft, category=news, alkija user_id=3350, period_type=match) (c) 결과: 7/7 created, 0 skipped, 0 failed (post_id 1373~1379) (d) 임시 스크립트 2개 (`scripts/_temp/check-news-backfill.ts` + `backfill-news-141-147.ts`) 즉시 삭제 (e) errors.md 알기자 silent fail entry fix 항목에 ✅ backfill 완료 박제 (f) 운영자 admin/news 검수 → publish 대기 | ✅ |
| 2026-05-04 | 0b47489 + 9d72cf5 + 2bfb873 + 78b0bae + b141e53 (5 commits push) | **대회·경기 헤더 UI 개편** — (a) 대회 헤더 좌측 제목 + 우측 컨트롤 5개 (.games-header 패턴, 경기와 동일) (b) segmented 탭 풀폭 (글자 잘림 0) (c) 컨트롤 90% 축소: 검색/필터 36→32 (모바일 25 → 사용자 의도로 28 복원) / ViewToggle 모바일 px-1 py-0.5 (d) `.games-create-btn` height 36→32 + padding 0×10 / `.games-filter-btn` 32×32 통일 (e) GamesClient 가 헤더 통합 렌더 (filterOpen state 같은 client tree 보장) / KindTabBar filter 토글 prop 미전달. 미푸시 0 | ✅ |
| 2026-05-04 | 4658963 | **시간 데이터 소실 매치 안내 배너 + #141 stat 14건 박제** — 매치 #141 (블랙라벨 vs MSA 52:31) matchPlayerStat 14건 INSERT (블랙 8 + MSA 6 / minutesPlayed=null / isStarter=null). settings.timeDataMissing=true 플래그 + reason 메모. API route timeDataMissing 응답 추가 + game-result.tsx 인터페이스 +1 + Hero 직후 안내 배너 (info 아이콘 + warn 색). 합산 검증 PTS/FG/3P/REB/AST 모두 TEAM 합 정확 일치 | ✅ |
| 2026-05-04 | (debugger / 진단) | **카테고리 가로 스크롤 fade overlay 미표시 — 코드/CSS/배포 모두 정상 = 사용자 브라우저 캐시 본질** — 운영 HTML(`https://www.mybdr.kr/community`) curl + CSS chunk 4종 다운로드 검증. ① `community-aside.tsx` L100~131 wrap+fade 마크업 정상 (`<div className="aside-mobile-tabs-wrap">` + `<div className="aside-mobile-tabs-fade" aria-hidden>` + `chevron_right`). ② `community-content.tsx` L383~424 sort-bar-mobile-wrap+fade 정상. ③ `globals.css` L540~593 + L601~656 wrap/fade/PC 숨김 모두 정상. ④ 운영 CSS 빌드 정상: `.aside-mobile-tabs-wrap{margin:0 0 10px;position:relative}` + `.aside-mobile-tabs-fade{...display:flex;position:absolute;top:0;bottom:6px;right:0}` + `@media (min-width:1024px){.aside-mobile-tabs-wrap{display:none!important}}`. ⑤ 운영 머지 정상 (a049dcd → main `22e11e3`). ⑥ Material Symbols 폰트 운영 head 정상 로드 (Google Fonts). ⑦ Vercel cache STALE → revalidate 정상 (서버는 새 HTML/CSS 보유). **본질 = 시나리오 1(브라우저 캐시) — 사용자가 머지(05:04 01:52) 이전부터 열린 community 탭에서 hard reload 안 해 옛 hydrated 상태 유지**. SSR 미렌더 (community-content가 `"use client"` + fallbackPosts JSON props만 SSR) 이므로 hydration 후 client에서만 wrap/fade 마크업 생성됨. 옛 빌드 client bundle은 wrap 마크업 없음. **즉시 fix = 사용자에게 "Ctrl+F5 (또는 모바일 시크릿창)으로 hard reload 안내"**. 추가 코드 수정 불필요 | ✅ |
| 2026-05-04 | (developer / 미커밋) | **카테고리/정렬 바 가로 스크롤 시각 indicator 강화 (3차 fix)** — 사용자 3회 보고 "카테고리 4개만 보이고 우측 잘림 인지 못함". mask-image (24px fade) → wrap 래퍼 + fade overlay div + chevron_right 아이콘 마크업 패턴으로 교체. ① community-aside.tsx `CommunityMobileTabs` — `<div className="aside-mobile-tabs-wrap">` 래퍼 + 우측 fade overlay (`aria-hidden`). ② community-content.tsx 정렬바 — `sort-bar-mobile-wrap` 래퍼 + fade overlay. ③ globals.css — mask-image 제거, `.aside-mobile-tabs-wrap` (position:relative) + `.aside-mobile-tabs-fade` (position:absolute, right:0, bottom:6px, width:32px, linear-gradient bg, pointer-events:none, z-index:1) 신규. sort-bar 동일 패턴 (border-radius 우측 둥근 모서리 보존). 기존 .aside-mobile-tabs padding-right 24→36 (overlay 32px + 여유). PC(≥1024px) wrap 자체 숨김. tsc exit 0 | ✅ |
<!-- 5/3 모바일 Hero 추가 압축 / 5/3 모바일 카테고리 fix + Hero 공통 룰 도입 2건 절단 (5/4 알기자 Phase 1 마이그 신규 prepend로 10건 유지) — 필요 시 git log -- .claude/scratchpad.md 로 복원 -->
| 2026-05-03 | (debugger / SELECT only + curl) | **알기자 Phase 2 자동 트리거 진단** — 5/2~5/3 종료 매치 30건 vs 알기자 게시물 9건 (모두 published / cat=news / tournament_match_id 보유 / 132~139 매치). 자동 트리거 deploy = 5/3 13:44 (commit 2e6d367 / PR #130). deploy 이후 종료 7매치 (141,142,143,144,145,146,147) **게시물 0건**. 운영 curl 검증: 7매치 모두 `{ok:false, reason:"missing_api_key"}`. **본질 = 운영 GEMINI_API_KEY 미설정 + fire-and-forget silent fail (호출은 발동했으나 brief route 가 missing_api_key 응답 → community_posts INSERT skip)**. fix = 사용자가 Vercel production env 에 GEMINI_API_KEY 추가 + 재배포 + (옵션) admin/news 에서 누락 7매치 regenerate. errors.md 신규 entry 1건 추가. _temp 스크립트 정리 | ✅ |
<!-- 5/3 마무리 압축 / 매치 #145 진단 / 듀얼 시뮬 ROLLBACK / Admin-Web 시각 통합 / SKD #5 안원교 진단 5건 절단 (10건 유지 — 5/4 P2 #1 live-expert 구현 prepend) — 필요 시 git log -- .claude/scratchpad.md 로 복원 -->
