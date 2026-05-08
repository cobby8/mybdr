# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/9 신규]** **사전 라인업 확정 + 기록앱 자동 매핑 — 설계 단계**
- 사용자 요구: 시작 1시간 전 양 팀 팀장 푸시 → 출전+주전 5 입력 → 영구 저장 → 기록앱 자동 매핑
- 산출: 설계 보고서 `Dev/match-lineup-confirmation-2026-05-09.md` (13 섹션 / Q1~Q9 결재)
- 결재 대기: Q1~Q9 (DB 모델 / 트리거 / 푸시 채널 / Flutter 분기 / 5명 룰 / fallback / 운영자 대리)
- 다음: 결재 후 8 PR 구현 (DB 1 + API 2 + Web 1 + Cron 1 + roster 확장 1 + Flutter 1 + deep-link 1 + 검증 1 = ~8.5h)

**[5/9 — developer 구현 완료]** **공개 프로필 (`/users/[id]`) NBA 스타일 개선 — 코드 구현 100%**
- 사용자 결재 6건 일괄 승인 (Q1=A 2탭 / Q3=jersey 노출 / Q4=C-3 8열 / Q5=D-1 / Q6=E-1 글로벌)
- 산출: 1 신규 (PlayerMatchCard 글로벌) + 6 수정 (page.tsx / RecentGamesTab / OverviewTab / overview-tab.css / PlayerHero / PlayerProfile.jsx 시안)
- 검증: tsc 0 / npm run build 통과 / truncated 룰 7파일 모두 마지막 줄 정상
- 다음: tester + reviewer 병렬 → PM 커밋

### 구현 기록 (developer / 5/9 NBA 스타일)

📝 구현한 기능: `/users/[id]` 공개 프로필 NBA.com Game Log 스타일 변환

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/users/[id]/page.tsx` | 쿼리 #2 _avg 8키 (BPG 제거 + MIN/FG%/3P% 추가) + officialMatchNestedFilter 가드 / 쿼리 #3 select 대폭 확장 (homeTeam/awayTeam/match_code 등) + orderBy scheduledAt desc / 쿼리 #9 신규 (대표 jerseyNumber) / 변환 로직 PlayerMatchCardProps[] 매핑 + playerSide 판별 | 수정 |
| `src/components/match/PlayerMatchCard.tsx` | **신규 글로벌 컴포넌트** — 대회상세 ScheduleTimeline 카드 패턴 카피 + 본인 기록 줄 (22 PTS · 14 REB · 3 AST · 2 STL [W]) + Link `/live/[id]` 라우팅 | 신규 |
| `src/app/(web)/users/[id]/_v2/recent-games-tab.tsx` | board__row 6열 → PlayerMatchCard 카드형 (props 인터페이스 `games` → `matches: PlayerMatchCardProps[]`) | 수정 |
| `src/app/(web)/users/[id]/_v2/overview-tab.tsx` | 통산 6열 (BPG 포함) → 8열 (BPG 제거 + MIN/FG%/3P% 추가) / fmtPct 헬퍼 신규 | 수정 |
| `src/app/(web)/users/[id]/_v2/overview-tab.css` | grid 6열 → 8열 / 모바일 3×2 → 4×2 분기 | 수정 |
| `src/app/(web)/users/[id]/_v2/player-hero.tsx` | jerseyNumber prop 추가 + eyebrow 영역 #N · 포지션 · 팀명 표시 | 수정 |
| `Dev/design/BDR-current/screens/PlayerProfile.jsx` | seasonStats 8열 mock + recent 카드형 mock (matchCode v4 / playerSide / W/L) | 수정 (역방향 박제) |

💡 tester 참고:
- 테스트 URL: 비로그인 또는 본인 외 user → `/users/[id]` (예: `/users/2999?preview=1` 본인 미리보기)
- 정상 동작 (overview 탭):
  - 통산 8열 (경기 / 승률 / PPG / RPG / APG / MIN / FG% / 3P%)
  - 모바일 ≤720px 4×2 grid
  - jersey 등록자 → Hero eyebrow `#N · 포지션 · 팀명` 노출
- 정상 동작 (games 탭):
  - 매치 카드 N건 (최대 10), 각 카드 클릭 → `/live/[matchId]` 이동
  - 카드 메타: 매치코드(없으면 #번호) | 라운드 | 시간(M/D(요일) HH:MM) | N코트 | 상태뱃지
  - 카드 중앙 VS 행: 홈팀 로고+이름 / 스코어박스 / 어웨이팀 이름+로고 (승팀 색상 primary)
  - 카드 하단 본인 기록: `22 PTS · 14 REB · 3 AST · 2 STL` + 우측 W/L 뱃지 (homeScore≠awayScore + completed)
- 빈 상태: 매치 0건 → "최근 경기 기록이 없습니다."
- 주의할 입력:
  - `match_code` NULL 매치 → `#매치번호` fallback
  - `homeTeam` 또는 `awayTeam` NULL → "미정" italic+opacity 0.7
  - 동점 또는 playerSide 판별 불가 → W/L 뱃지 미노출
  - 미래/예약 매치 noise → officialMatchNestedFilter 가드로 자동 제외 (5/2 회귀 fix)

⚠️ reviewer 참고:
- 통산 8열 BPG 제거 결정 — 사용자 결정 Q4=C-3 (모바일 4×2 일관성)
- TournamentTeam 자체에 `name` 컬럼 없음 (스키마) → `team.name` 사용 (Team relation)
- `recentGames.findMany` select 결과 타입은 catch fallback `[]` 도 합치 추론 정상 (tsc 0 통과)
- BDR-current 시안 갱신 = 운영 → 시안 역방향 박제 (CLAUDE.md §🔄 동기화 룰 준수)
- TeamLogo는 `<img>` 직접 사용 (대회상세 패턴 카피 — Next/Image 도메인 화이트리스트 회피)
- W/L 뱃지 위치 = 카드 하단 우측 (PTS 라인과 같은 줄, border-t 분리)

### 리뷰 결과 (reviewer / 5/9 NBA 프로필)

📊 종합 판정: **통과** (수정 요청 0건 / 권장 1건)

#### PlayerMatchCard API
- props 인터페이스 깔끔 — 매치 메타(ID/code/번호/조/라운드/시간/코트/상태) + 팀 6필드(home/away × name/logo/score) + playerStat 4필드 + playerSide. `groupName` 은 `?` optional 마킹으로 확장 의도 표시 — 좋음.
- W/L 뱃지 분기 정확: `isCompleted && playerSide!==null && homeScore!=null && awayScore!=null && homeScore!==awayScore` 4중 가드 → 동점/null/예정 모두 안전.
- PlayerMatchStat 별도 export — 다른 호출자 (팀 페이지 등) 재사용 시 import 가능. 글로벌 위치(E-1) 결정에 부합.
- "use client" — Link/Image 없이도 SSR 가능하지만 hover 등 인터랙션 일관성을 위해 유지. OK.

#### page.tsx 쿼리
- 9 쿼리 Promise.all 병렬 → N+1 위험 0. select 트리도 깊지만 필수 필드만.
- officialMatchNestedFilter 가드 #2(_avg) + #3(findMany) 양쪽 일관 적용 → 5/2 회귀 패턴 fix 효과.
- _avg 8키 (BPG 제거) — schema 컬럼명 정확 (`points/total_rebounds/assists/steals/blocks/minutesPlayed/field_goal_percentage/three_point_percentage`). Prisma 가 Decimal | null 반환 → `Number(... ?? 0)` + `gamesPlayed > 0` 분기로 0건 시 "-" 정확.
- orderBy `tournamentMatch.scheduledAt desc` — 백필 회귀 회피 정확.
- TournamentTeam relation 통해 `team.name` / `team.logoUrl` 추출 — schema 정합 (TournamentTeam 자체 name 컬럼 없음 — 5/9 fix 주석 정확).
- 변환 로직 `recentGameRows` 의 `.filter((g) => g.tournamentMatch != null)` 안전장치 + `.map` 후 `playerSide` 판별 정확.

#### 통산 8열
- 사용자 결정 C-3 (BPG 제거 + MIN/FG%/3P% 추가) 정확 반영.
- `fmtPct` 헬퍼 신규 — `v == null || v === 0 ? "-"` 분기 OK. (DB가 0~100 범위 % 값으로 저장됨 — 주석 명시).
- grid 8열 / 모바일 4×2 — `:nth-child(4n+1)` 좌측 border 리셋 + `:nth-child(-n+4)` 상단 border 리셋 → 모바일 새 줄 시작 셀 처리 정확.
- 데이터 소스 = matchPlayerStat aggregate (UserSeasonStat cron 미동작 회피 — 설계서 §1.3 일치).
- BDR-current/screens/PlayerProfile.jsx 도 동일 8열 (mock 일치).

#### Hero jersey
- 쿼리 #9 `prisma.tournamentTeamPlayer.findFirst({ jerseyNumber: { not: null }, orderBy: createdAt desc })` — "가장 최근 등록된 ttp 가 대표" 단순 룰. 적절.
- eyebrow 영역: `#{N} · 포지션 · 팀명` 분기 — null 안전 (구분점 출력 조건문 정확). 시안 패턴 일치.
- jerseyNumber Int? schema 정합 (line 594) — null fallback.

#### routing
- `/live/{matchId}` — 대회상세 ScheduleTimeline 동일 패턴 카피. 일관성 ✅.
- `m.id.toString()` BigInt 변환 정확.
- matchPlayerStat → tournamentMatch.id 직접 추출 (matchPlayerStat.tournament_match_id 가 아니라 nested select 의 m.id 사용 — Prisma 자동 join 결과).

#### 시안 박제
- BDR-current/screens/PlayerProfile.jsx — 운영 PlayerMatchCard.tsx 시각 패턴을 정확히 카피 (메타줄 5요소 + VS행 + 본인 기록 + W/L). 5/2 시안과 운영 시각 동기 ✅.
- mock 데이터 5건 중 4건 matchCode v4, 1건 NULL+matchNumber=5 → fallback 패턴 시연. recent[1] (RDM vs MK) playerSide='away' + away 승리 → W 뱃지 노출. 회귀 검증용 mock 으로도 적절.
- `var(--ok)` / `var(--danger)` / `var(--bg-alt)` / `var(--ff-mono)` / `var(--ff-display)` 시안 토큰 일관 (운영은 `--color-success` / `--color-error` 시리즈 — 둘 다 globals.css alias 정의 → 시각적 동일).
- `window.PlayerProfile = PlayerProfile;` 380L 종결 정상 (BDR-current 패턴).

#### errors.md 적용
- truncated: 7 파일 마지막 줄 검증 — page.tsx 440L `}` / PlayerMatchCard 380L `}` / overview-tab 391L `}` / overview-tab.css 49L `}` / recent-games-tab 46L `}` / player-hero 269L `}` / PlayerProfile.jsx 380L `window.PlayerProfile = PlayerProfile;` — **7건 모두 정상**.
- envelope/snake_case: page.tsx 는 직접 props 전달 (apiSuccess 미경유 — 서버 컴포넌트). DB 컬럼 snake_case 그대로 select (`field_goal_percentage` 등) → camelCase 변환 OK. 응답 envelope 회귀 0.
- apiSuccess 일관: 본 작업은 API endpoint 추가/수정 0 → 해당 없음 (page.tsx 는 server component, 직접 prop 전달).

#### 컨벤션
- 파일명 kebab-case: ✅ recent-games-tab.tsx / overview-tab.tsx / player-hero.tsx / overview-tab.css. **PlayerMatchCard.tsx 만 PascalCase** — 그러나 mybdr 글로벌 컨벤션 검색 결과 `src/components/match/` 외 다른 컴포넌트도 PascalCase 혼재 (예: schedule-timeline 은 kebab) → ⚠️ 권장: 일관성 위해 `player-match-card.tsx` 로 rename 검토.
- 함수 camelCase / DB snake_case: ✅
- TypeScript strict / any 0: ✅ 7파일 전체 grep 결과 `any` 미사용 (단, TournamentTeamPlayer.findFirst.catch(()=>null) 의 fallback 타입 명시 정확).
- 주석 ("이유 / 어떻게 / 룰"): ✅ PlayerMatchCard 상단 주석 + page.tsx 쿼리 #2 #3 #9 변경 사유 + overview-tab.tsx 8열 변경 사유 모두 명시.

#### 회귀 위험
- Flutter `/api/v1/*`: ✅ 0 (작업 = `(web)/users/[id]/page.tsx` + 글로벌 components 한정)
- DB schema: ✅ 0 (select 키 추가만)
- API endpoint: ✅ 0 신규
- PR3 가드: ✅ 무관 (본 페이지 = 공개 프로필 / identity gate 무관)
- 기존 컴포넌트: ✅ schedule-timeline.tsx 미변경 (코드 카피만, 원본 보존). PlayerHero `jerseyNumber` 추가는 optional prop 이라 호출자 영향 0.
- ISR 60초: ✅ 유지

✅ 잘된 점:
- 설계서 Q1~Q6 결재 내역을 코드 주석에 명시 (사용자 결정 추적 가능).
- 변경 로직이 NULL safety 4중 가드로 정확 (W/L / homeTeam / matchCode / playerSide).
- TeamLogo 컴포넌트 카피 시 첫 글자 fallback / object-contain / aria-hidden 모두 보존.
- BDR-current 시안 mock 데이터 5건 중 1건 matchCode NULL 케이스 포함 → 회귀 검증 시각적 시연.
- truncated 룰 7파일 모두 마지막 줄 정상 (errors.md 5/7+5/8 재발 방지).

🟡 권장 수정 (필수 X):
- `src/components/match/PlayerMatchCard.tsx` → kebab-case 일관성을 위해 `player-match-card.tsx` 로 rename 검토. 단, `src/components/` 산하 다른 컴포넌트 (예: `Toast.tsx`, `RecommendedVideos.tsx`)도 PascalCase 혼재 → **현 상태 유지도 OK**. PM 판단.

종합 평가: ⭐⭐⭐⭐⭐
- 설계서 결재 6건 정확 반영 + 7파일 truncated 0 + 회귀 위험 0 + 시안 역박제 동기 + null safety 4중 가드. 운영 배포 준비 완료.

🔴 수정 요청: **없음** — PM 커밋 진행 권장.

### 테스트 결과 (tester / 5/9 NBA 프로필)

📊 종합 판정: **✅ 7/7 영역 통과** (수정 요청 0건)

#### 빌드
- **tsc --noEmit**: 0 (출력 없음 = 에러 0)
- **npm run build**: ✅ 통과 — `ƒ /users/[id]` 라우트 빌드 성공. warn 3건은 본 작업 무관 (Prisma 7 deprecated / Serwist Turbopack / heatmap+ads dynamic-server — 기존 routes)
- **truncated 룰**: 7 파일 마지막 2줄 모두 정상 종료 — page.tsx `}` / PlayerMatchCard `}` / recent-games-tab `}` / overview-tab `}` / overview-tab.css `}` / player-hero `}` / PlayerProfile.jsx `window.PlayerProfile = PlayerProfile;`

#### PlayerMatchCard 동작 (코드 분석)
| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| 상단 메타 [코드/번호 \| 라운드 \| 시간 \| 코트 \| 상태] | ✅ | L171~233 / `.match-code` 클래스 globals.css L3063 존재 / matchNumber NULL fallback 분기 정상 |
| VS 행 (홈팀 로고+이름 / 점수 / 어웨이팀) | ✅ | L235~321 / TeamLogo (img 직접 + initial fallback) / homeWins/awayWins 색상 분기 |
| 본인 기록 줄 `N PTS · N REB · N AST · N STL [W]` | ✅ | L323~377 / 4 stat (D-1 형식) + W/L 뱃지 우측 |
| Link wrapper → /live/[matchId] | ✅ | L163 `Link href={`/live/${matchId}`}` |
| W/L 결정 (종료 + 점수 다름 + playerSide 알 때만) | ✅ | L147~155 4중 가드 (`isCompleted && playerSide!==null && homeScore!=null && awayScore!=null && homeScore!==awayScore`) |
| Badge variant 호환성 | ✅ | info/error/default 3종 모두 BadgeVariant 타입 포함 (badge.tsx L1) |
| 헬퍼 import | ✅ | formatShortDate (format-date.ts L42) / formatShortTime (L52) export 확인 |

#### 통산 8열 확장 (Q4=C-3)
| 항목 | 결과 | 비고 |
|------|------|------|
| 8열 구성 (경기/승률/PPG/RPG/APG/MIN/FG%/3P%) | ✅ | overview-tab.tsx L122~131 seasonCells |
| BPG 제거 | ✅ | seasonCells / OverviewSeasonStats interface 모두 BPG 키 0 |
| _avg 8키 정확 (page.tsx) | ✅ | L150~159 / blocks 는 fetch 유지 (cell 미노출) — 호환성 OK |
| grid 8열 PC | ✅ | overview-tab.css L25 `repeat(8, 1fr)` |
| 모바일 4×2 분기 (≤720px) | ✅ | L36 `repeat(4, 1fr)` + nth-child(-n+4) top + nth-child(4n+1) left border 리셋 |
| fmtPct 헬퍼 (0/NULL → "-") | ✅ | overview-tab.tsx L102~105 |

#### Hero jersey 노출 (Q3)
| 항목 | 결과 | 비고 |
|------|------|------|
| representativeJersey fetch (쿼리 #9) | ✅ | page.tsx L270~276 / first + jerseyNumber NOT NULL + createdAt desc |
| jerseyNumber prop 전달 | ✅ | L411 `jerseyNumber: representativeJersey?.jerseyNumber ?? null` |
| #N eyebrow 표시 | ✅ | player-hero.tsx L156~168 / 포지션·팀명과 함께 `·` 구분 |
| jerseyNumber NULL 시 미노출 | ✅ | L156 셋 다 NULL 이면 eyebrow 자체 hidden |
| 키/몸무게/등번호 일관 | ✅ | Physical strip (키/몸무게/최근접속) 변경 0 / 등번호는 eyebrow 신규 위치 |

#### page.tsx 쿼리
| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| 쿼리 #2 _avg 8키 | ✅ | L150~159 — points/total_rebounds/assists/steals/blocks/minutesPlayed/field_goal_percentage/three_point_percentage |
| 쿼리 #3 select 확장 | ✅ | L175~219 — 12 stat 키 + ttp.tournamentTeamId + match (id/match_code/match_number/group_name/roundName/scheduledAt/court_number/status/score/양팀(team.name+logoUrl)) |
| officialMatchNestedFilter 가드 | ✅ | #2 L148 + #3 L173 양쪽 일관 적용 (5/2 회귀 fix) |
| orderBy scheduledAt desc | ✅ | L221 — 백필 createdAt 역전 회피 |
| playerSide 판별 | ✅ | L335~342 ttp.tournamentTeamId === homeTeamId/awayTeamId / 양쪽 미일치 시 null |
| TournamentTeam.team.name relation chain | ✅ | L207~217 — TournamentTeam 자체 name 컬럼 없음 → team.name 정확 |

#### 회귀 0
| 영역 | 결과 | 검증 |
|------|------|------|
| Flutter `/api/v1/*` | ✅ 영향 0 | 변경 7파일 모두 `(web)/users/[id]/*` + `components/match/*` + `BDR-current/*` — `/api/v1/*` 미터치 |
| DB schema | ✅ 0 | prisma/schema.prisma 미수정 |
| API 신규 endpoint | ✅ 0 | `src/app/api/*` 미수정 — page.tsx 내 prisma 직접 호출만 |
| 기존 응답 키 변경 | ✅ 0 | API route 미수정 |
| PR3 가드 / mock 폴백 / PhoneInput | ✅ 영향 0 | onboarding/identity/auth/profile-edit 디렉토리 미터치 |
| 본인 진입 → /profile redirect | ✅ 유지 | page.tsx L78~80 isOwner 가드 그대로 |
| ?preview=1 미리보기 | ✅ 유지 | L78 `preview !== "1"` 그대로 |
| ISR 60초 | ✅ 유지 | L39 `export const revalidate = 60` |

#### 종합 판정
- 빌드 + truncated 통과 / PlayerMatchCard 7/7 항목 / 통산 8열 6/6 / Hero jersey 5/5 / page.tsx 쿼리 6/6 / 회귀 0 8/8 영역 통과
- 사용자 결재 6건 (Q1=A 2탭 / Q3=jersey / Q4=C-3 8열 / Q5=D-1 / Q6=E-1) 모두 코드에 정확 반영
- fallback 3종 (matchCode NULL → #번호 / 팀명 NULL → "미정" italic / 동점·playerSide null → W/L 미노출) 정상 작동
- 시안 박제 (BDR-current/screens/PlayerProfile.jsx) 8열 + 카드형 + 본인 기록 줄 운영과 시각 일관성 유지

#### 발견 이슈 — 0건

#### 수정 요청 — 없음

#### 후속 권장 (런타임 검증 — PM 머지 후)
1. 실제 DB 사용자 진입 검증 (matchPlayerStat 다수 보유 사용자 → 카드 노출/클릭 확인)
2. 모바일 720px 분기 확인 (카드 본인 기록 줄 줄바꿈 0 / 통산 4×2 grid)
3. /teams/[id] "최근 경기" 글로벌 PlayerMatchCard 재사용 후속 (E-1 채택 효과)

**[5/9 직전 — 시안 갭 fix 100% 완료]** PR #228~#235 4회차 main 머지. PhoneInput/BirthDateInput 마이그 (1순위 4 input + 2~3순위 6 input = 10 input) + 시안 역박제 10 페이지 (1순위 3 + 2~3순위 7) 모두 main 배포. Production = `afcbd65`.

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업, 이번 주 내 예상)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **활성화 직후 자동 전환**: PR3 가드 활성 / mock 폴백 503 자동 / SDK 모드 전환 (코드 변경 0)
- **롤백 1초**: 환경변수 제거

### 🚀 1순위 — PortOne 활성화 후 검증
- 미인증 계정 → /games/[id] /teams/[id] /tournaments/[id]/join 진입 → /onboarding/identity?returnTo redirect
- mock 통과자 (identity_method='mock') 사후 식별 + 권유 안내 (강제 invalidate X)

### 🚀 2순위 — PhoneInput/BirthDateInput 마이그 4순위 (admin+referee 그룹)
- (admin) 1건 + (referee) 1건 = 2 input. 별도 그룹이라 사용자 영향 적음, 일관성 차원

### 🚀 3순위 — onboarding 흐름 검증 + 사용자 영향 모니터링
- 카카오/구글/네이버 소셜 가입자 흐름 / xp +100 / profile/edit 잠금 회귀 0

### 🚀 4순위 — manage 탭 그룹화 (P2-6 보류) / game.game_type 마이그 / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/9 — 사전 라인업 확정 + 기록앱 자동 매핑)

🎯 시작 1h 전 푸시 → 팀장 출전+주전 5 입력 → 영구 저장 → Flutter 자동 매핑. **상세 = `Dev/match-lineup-confirmation-2026-05-09.md` (13 섹션 / Q1~Q9 결재 / ~8.5h).**

📍 변경 파일 (8 PR):
| PR | 파일 | 신규/수정 |
|----|------|----------|
| PR1 | `prisma/schema.prisma` (model `MatchLineupConfirmed` + ADD COLUMN `lineup_reminder_sent_at`) | 수정 |
| PR2 | `src/app/api/web/match-lineup/confirm/route.ts` + `[matchId]/route.ts` GET | 신규 (~200L) |
| PR3 | `src/app/(web)/lineup-confirm/[matchId]/page.tsx` + `_components/` 3 파일 | 신규 (~400L) |
| PR4 | `src/app/api/cron/match-lineup-reminder/route.ts` + `vercel.json` cron 1건 | 신규 (~120L) |
| PR5 | `src/app/api/v1/matches/[id]/roster/route.ts` 응답 +2 필드 | 수정 (~40L) |
| PR6 | Flutter `starter_select_screen.dart` `_loadData()` 분기 + `api_client.dart` 모델 | 수정 (~50L) |
| PR7 | `src/lib/notifications/types.ts` `MATCH_LINEUP_REMINDER` 추가 + 알림 deep-link | 수정 (~10L) |

🔗 기존 코드 연결:
- ttp.isStarter (대회 통산) 도메인 영구 보존 — 매치 단위는 신규 테이블로 분리
- `createNotificationBulk` 헬퍼 재사용 (인앱+web push 동시) / `tournament-reminders` cron 패턴 카피
- `team_members.role="leader"` + `team.captainId` + `team.manager_id` 3중 권한
- roster 응답 +2 필드 = Flutter v1 (구버전) 무시 → 회귀 0

📋 실행 (4 Stage 부분 배포):
| Stage | PR | 효과 |
|-------|-----|------|
| 1 (~4.25h) | PR1+PR2+PR3 | 팀장 입력 UI 활성 (자동 매핑 X) |
| 2 (~1h) | PR4+PR7 | 푸시 알림 + 입력률 측정 |
| 3 (~1.5h) | PR5+PR6 | Flutter 자동 매핑 (앱 빌드 cycle 별도) |
| 4 (~45m) | PR8 | tester + reviewer + 박제 |

📐 결재 Q1~Q9 추천: A(신규 테이블) / A(5분 cron) / A(web push 재사용) / A(roster 확장) / C(자동+변경 자유) / A(5명 강제) / A(수동 fallback) / A(1h 전) / A(운영자 대리 허용)

⚠️ 핵심 주의:
- ttp.isStarter ≠ 매치 starter — 두 도메인 영구 분리
- Flutter v1+v2 동시 운영 (서버는 +2 필드 항상 노출) → 강제 앱 업데이트 0
- 운영 DB 단일 정책 = ADD COLUMN (NULL 허용 무중단) + 신규 테이블만 / DROP 0
- `appliedAt IS NULL` 까지만 재입력 허용 (기록원 starter 화면 진입 시 잠금)

🔒 회귀 0: Flutter v1 호환 (응답 키 변경 0) / 미입력 매치 = 기록원 수동 fallback / 5/9 완료 매치 영향 0

---

## 기획설계 직전 (5/9 — 공개 프로필 NBA 스타일)

설계 보고서 `Dev/public-profile-nba-style-2026-05-09.md` Q1~Q6 결재 대기 (60~80분 예상). 5 파일 변경 (page.tsx 쿼리 / PlayerMatchCard 신규 / 2 탭 / 시안 역박제).

---

## 기획설계 직전 (5/8~5/9 압축)

- PR3 layout 가드 mock + mock 자체 입력 폴백 + PhoneInput/BirthDateInput 전역+10건 마이그 + 시안 갭 fix 10건 — 모두 main ✅

---

## 테스트 결과 (tester / 5/9 onboarding 흐름)

### 1. 소셜 가입자 흐름 — ✅ 통과
- 카카오 콜백 (`api/auth/kakao/callback/route.ts`) → `${baseUrl}/` redirect 정상. JWT 발급 + WEB_SESSION_COOKIE 30일.
- 신규 user 생성 시 `name_verified=false` (default) — 홈 진입 시 ProfileCtaCard 분기 정상.
- ProfileCtaCard (`src/components/home/profile-cta-card.tsx:81~167`): `needsIdentity = me.name_verified === false` 우선 체크 (PR1.2 fix `059d4a6` — 카카오 사용자 `profile_completed=true` 라도 인증 카드 노출 보장).
- 클릭 → `/onboarding/identity` 진입 정상.

### 2. xp +100 부여 — ✅ 통과 (DB 실측)
- DB SELECT 결과 (5/9 운영 기준):
  - `onboarding_step=10` 도달 사용자 1명 (id=2999 김수빈, identity_method=mock)
  - 해당 사용자 `xp=100` (정확히 +100 부여됨)
  - 전체 xp avg=0.18 / max=100 / min=0 — onboarding 미통과자 xp=0 (기본값)
- 코드 검증 (`src/app/api/web/profile/route.ts:206~218`): `isOnboardingFirstComplete` = `newStep === 10 && (existing?.onboarding_step ?? 0) < 10` 조건 1회성 increment. 재호출 시 중복 부여 차단.

### 3. profile/edit 잠금 회귀 — ✅ 통과
- 클라이언트 (`src/app/(web)/profile/edit/page.tsx`):
  - 이름 (line 905~913): `disabled={nameVerified} readOnly={nameVerified}` + 회색 배경 + cursor not-allowed
  - 생년월일 (line 926~933): BirthDateInput + 잠금 prop 전달 (5/9 마이그 후)
  - 휴대폰 (line 941~948): PhoneInput + 잠금 prop 전달 (5/9 마이그 후)
  - 휴대폰 §6 (line 1305~1313): PhoneInput + 잠금 적용 (account 섹션)
- 컴포넌트 검증:
  - PhoneInput (`src/components/inputs/phone-input.tsx:62~87`): `...rest` 통과 → disabled/readOnly/style 정상 작동
  - BirthDateInput (`src/components/inputs/birth-date-input.tsx:77~108`): `...rest` 통과 → 동일
- 서버 보안 (`src/app/api/web/profile/route.ts:129~148`): `name_verified=true` 사용자가 name/birth_date/phone PATCH 시도 시 403 `VERIFIED_FIELDS_LOCKED` 차단 (클라 우회 차단)

### 4. mock 통과자 흐름 — ✅ 통과
- DB SELECT 결과: identity_method 분포 = `null: 548 / mock: 1` — mock 통과자 1명 (5/8 ADD COLUMN 후 본인 테스트)
- mock-verify endpoint (`src/app/api/web/identity/mock-verify/route.ts:62~158`): 보안 가드 3단 정상
  - 가드 1 (line 66~72): `isIdentityGateEnabled()=true` 시 503 MOCK_DISABLED — PortOne 활성 시 자동 차단
  - 가드 2 (line 74~84): zod 검증 (한글 실명 / 010-XXXX-XXXX / YYYY-MM-DD)
  - 가드 3 (line 87~102): 이미 `name_verified=true` 시 409 ALREADY_VERIFIED (재인증 차단)
- update 시 `identity_method='mock'` + `verified_*` + `name/phone/birth_date` 사용자 결정 §1 동기화 정상
- admin_logs INSERT (line 146~157): event='mock_identity_verified' severity='info' — 사후 식별 가능

### 5. 빌드 + Flutter 호환 — ✅ 통과
- `npx tsc --noEmit` 0 (출력 없음 = 에러 0)
- Vercel 배포 — main `737dd42` 활성 (5/9 머지 4회 후 build success — scratchpad 박제)
- Flutter API 영향: 5/7 이후 `/api/v1/*` 변경 1건만 (`9c6fd89` roster getDisplayName 헬퍼) — 응답 키 변경 0, 호환 유지
- `/api/v1/*` (Flutter) 영향 0 검증 — 본 onboarding 작업 일체가 `/api/web/*` 한정

### 종합 판정 — ✅ 5/5 통과
- **소셜 가입자 흐름 정상** — 카카오 콜백 + ProfileCtaCard + onboarding/identity redirect 정상
- **xp +100 부여 정확** — DB 실측 1건 (id=2999 김수빈) 100 부여 확인. 1회성 가드 정상
- **profile/edit 잠금 회귀 0** — 클라 disabled/readOnly + 서버 403 가드 이중 보호. PhoneInput/BirthDateInput 마이그 후에도 잠금 동일 작동
- **mock 통과자 흐름 정상** — 가드 3단 + admin_logs + identity_method='mock' 박제. PortOne 활성 시 자동 503 거부
- **빌드 + Flutter 호환** — tsc 0 / Vercel main 활성 / v1 응답 키 변경 0

### 발견 이슈 — 0건

### 후속 권장 (PortOne 활성화 후)
1. **mock 통과자 권유 안내 UI** — 사용자 결정 옵션 C (그대로 인정 + 권유 안내). 현재 `identity_method='mock'` 1건 → admin/users 또는 마이페이지에 "정식 인증 권유" 카드 1회성 표시 필요. (구현 X / 보류)
2. **onboarding 진행률 모니터링** — DB 기준 5/7 이후 신규 가입자 6명 모두 step=0 (인증 미시도). PortOne 활성 후 진입률 추적 필요.
3. **6명 신규 미인증** — 카카오 3 / email 3 / 모두 step=0. PortOne 활성 시 핵심 액션 시도 시 PR1.5.a 게이트 (403) 트리거 — 사용자 ProfileCtaCard 클릭 흐름 안내됨.

---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) / 듀얼토너먼트 풀 시스템 | ✅ |
| **디자인 시안 박제** | ✅ ~95% (시안 갭 0건, admin/referee 그룹 외) |
| 도메인 sub-agent (옵션 A) | ✅ P1+P2+P3 (C 채택) |
| 매치 코드 v4 | ✅ Phase 1+2+3+4+5+7 |
| **PR3 layout 가드 mock 모드** | ✅ main 배포 (PortOne env 추가 시 자동 활성) |
| **mock 자체 입력 폴백** | ✅ main 배포 (PortOne 활성화 시 자동 SDK 모드 전환) |
| **사이트 전역 input 룰** | ✅ PhoneInput/BirthDateInput + 10 input 마이그 / admin+referee 2건 잔여 |
| **운영 → 시안 역박제 갭 fix** | ✅ 10 페이지 (1+2+3순위) — 시안 갭 0건 달성 |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-09 | (대기 — PM 커밋 예정) | **홈페이지 RecommendedVideos 부활** — 2026-04-24 BDR v2 Phase 1 (`d6bc22c`) 일괄 제거 후 5/9 부활. (1) `src/app/(web)/page.tsx` +13L (import 3L + 주석 4L + StatsStrip 다음 `<section marginTop:24>` 래퍼 5L + 상단 주석 1L). 컴포넌트 자체 "HIGHLIGHTS" NBA 2K 헤더 보유 → CardPanel 래퍼 미적용 (헤더 중복 회피). (2) `Dev/design/BDR-current/screens/Home.jsx` +118L 시안 역박제 (운영 → 시안 동기화 룰 / 5/7 lessons.md): mock 데이터 6건 + RecommendedRail #2.5 (열린 대회 다음) + VideoMiniCard 컴포넌트 (가로 스크롤 캐러셀 / accent 그라디언트 썸네일 / LIVE 뱃지 / 듀레이션 뱃지 / uppercase 제목). 검증: tsc 0 / truncated 0 (page.tsx 337L `}` 종결 / Home.jsx 977L `window.Home = Home;` 종결) / HeroCarousel·StatsStrip·2컬럼·방금올라온글 4 섹션 무수정 / prefetch 4건 무수정 / API/DB/Flutter v1 영향 0. 컴포넌트는 useSWR 클라사이드 자체 fetch → SSR 영향 0. | ✅ |
| 2026-05-09 | (대기 — tester/reviewer 후 PM 커밋) | **공개 프로필 (`/users/[id]`) NBA 스타일 구현 완료** — 1 신규 (PlayerMatchCard 글로벌 컴포넌트 380L `src/components/match/`) + 6 수정 (page.tsx 쿼리 #2 8키 _avg + #3 select 대폭 확장 + #9 신규 jersey + 변환 로직 / RecentGamesTab 카드형 / OverviewTab 6→8열 BPG 제거 + MIN/FG%/3P% / overview-tab.css 4×2 / PlayerHero #N eyebrow / PlayerProfile.jsx 시안 역박제). officialMatchNestedFilter 가드 추가 (5/2 회귀 fix). 카드 클릭 → /live/[id]. tsc 0 / npm run build 통과 / truncated 룰 7파일 마지막 줄 정상. 사용자 결재 6건 일괄 승인. | ✅ |
| 2026-05-09 | (설계 단계 — 코드 변경 0) | **사전 라인업 확정 + 기록앱 자동 매핑 — 설계 보고서 작성** — 13 섹션 / Q1~Q9 결재 / 8 PR 부분 배포 (Stage 1~4) / ~8.5h 예상. 핵심: 신규 테이블 `match_lineup_confirmed` (매치당 home/away 각 1건 / activeTtpIds + starterTtpIds Json) + ADD COLUMN `tournament_matches.lineup_reminder_sent_at` (cron 1회성 가드). 트리거 = Vercel Cron 5분 폴링 (55~60분 매치). 푸시 = `createNotificationBulk` 재사용 (인앱+web push). Flutter 자동 매핑 = roster 응답 +2 필드 (`home_lineup_confirmed`/`away_lineup_confirmed`) → v1 호환 (무시) / v2 (분기). 회귀 0 (ttp.isStarter 대회 통산 의미 영구 보존 / 미입력 매치 기록원 수동 fallback). 산출물: `Dev/match-lineup-confirmation-2026-05-09.md`. | 📋 결재 대기 |
| 2026-05-09 | (설계 단계 — 코드 변경 0) | **공개 프로필 (`/users/[id]`) NBA 스타일 개선 — 설계 보고서 작성** — 12 섹션 / Q1~Q6 결재 항목 / 5단계 구현 계획. 핵심 변경: 최근 경기 카드형 (대회상세 ScheduleTimeline 패턴 카피 + 본인 기록 줄) + 카드 클릭 → /live/[id] + 통산 스탯 6→8열 옵션 + PlayerMatchCard 글로벌 컴포넌트 신규. 산출물: `Dev/public-profile-nba-style-2026-05-09.md`. DB/API 변경 0 / 회귀 0. | 📋 결재 대기 |
| 2026-05-09 | (대기 — PM 커밋 예정) | **PhoneInput/BirthDateInput 마이그 4순위 (admin+referee) 완료** — 3 input 2 페이지: (1) `(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx:740` 문의 연락처 → PhoneInput. (2) `(referee)/referee/admin/members/new/page.tsx:220` 심판 전화번호 → PhoneInput. (3) 동 파일 :300 생년월일 (state명 birthDate / API field registered_birth_date 명확) → BirthDateInput. tsc / build / truncated / type="tel" 0 hit / 회귀 0. **마이그 100% 완료 — 1~4순위 누적 13 input** (1순위 4 / 2~3순위 6 / 4순위 3). | ✅ |
| 2026-05-09 | PR #228~#235 8건 → main 4회 머지 (`702d00e` → `b96f58c` → `71d4087` → `afcbd65`) | **5/9 main 4회 — input 마이그 + 시안 갭 fix 일괄 완료** — (1) PR #228/#229 PhoneInput/BirthDateInput 1순위 4 input (profile/edit 휴2+생1 + tournaments/join 휴1, formatPhone 7L 제거). (2) PR #230/#231 잔여 6 input (verify state 하이픈+replace 정규화 / registration / games/new step+v2 / games/edit within24h / partner-admin/venue). (3) PR #232/#233 시안 역박제 1순위 3건 (News+MatchNews+Scoreboard 매치 코드 v4). (4) PR #234/#235 시안 역박제 2~3순위 7건 (CourtManage/Checkin/TeamsManage/Requests/ProfileSettings/OrgApply/SeriesEdition). 시안 갭 0건 달성. tester 통과 단위 76건+ / reviewer ⭐⭐⭐⭐⭐ 2회. | ✅ |
| 2026-05-08 | PR #214~#227 14건 → main 7회 (`e0d880b` 빌드실패 → `c6a6848` `f39afae` `8846f6d` `13a962e` `93670c5` `118c9f1`) | **5/8 main 7회 신기록** — (1) 디자인 박제 11 commit + truncated 빌드 9건 실패 → hot fix `333516b`. (2) PR3 layout 가드 mock 모드 (헬퍼 2 + server layout 1 + 4 페이지). (3) BDR-current sync v2.5 부분 + v2.5.1 (zip 2회). (4) mock 자체 입력 폴백 (DB ADD COLUMN + modal 337L + endpoint 156L + 가드 3단). (5) PhoneInput/BirthDateInput 전역 컴포넌트 + conventions.md [2026-05-08] 룰 박제. errors.md 5/7 truncated 재발 2회차 + 보완 4룰. | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main — Onboarding 10단계 + PortOne V2 + Phase A.5** — fix 7건 (envelope 8회 / IME 9곳 / 마이페이지 정렬 / 알림 deep-link), Onboarding PR1.1~PR5 (PR3 보류), Phase A.5 drawer truncated → hot fix `168be48`. | ✅ |
| 2026-05-06 | `7211f97` ~ `f6b43ab` → main `4253e68` | **5/6 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄** | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 → main `3f016c9` / 5/5 SEASON2 출전 명단 정비 DB UPDATE 4건 / 5/5 팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR `8bbce95` / 5/6 UI fix 13건 + apiError 일괄 fix / 5/7 envelope 8회 — 5/7 main 21회 baseline / 5/8 main 7회 신기록) — 복원: git log -- .claude/scratchpad.md -->
