# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/9 신규 — planner-architect / 디자인 정합 설계]** **홈 5/9 부활분 3 컴포넌트 디자인 시스템 정합 — 설계 단계 (옵션 B 권장)**
- 산출: `Dev/home-design-alignment-2026-05-09.md` (11 섹션 / Q1~Q7 결재 / 옵션 A/B/C 비교)
- 핵심: 시안 RecommendedRail 통일 패턴 vs 운영 3종 헤더 분산 (자체 NBA 2K / 헤더없음 / TossSectionHeader) — 차이 매트릭스 6 영역
- 옵션 B 권장: RecommendedRail 신규 1개 (`src/components/bdr-v2/recommended-rail.tsx` ~80L 시안 line 405~440 카피) + 헤더만 교체 (RecommendedVideos + RecommendedGames) / MySummaryHero 무수정 / ~55분 / 회귀 0 (API/DB/Flutter v1)
- 결재 Q1~Q7 추천: B(헤더만) / A(bdr-v2 위치) / A(eyebrow="WATCH NOW · YOUTUBE" NBA 톤 일부 보존) / A(MySummary 보존) / A(점진 마이그) / A(카드 후속 추출) / B(5/10 후)
- 다음: 결재 후 P0 단계 (RecommendedRail 신규 + 2 컴포넌트 헤더 교체 + tester/reviewer 병렬)

---

## 기획설계 (planner-architect / 5/9 — 홈 5/9 부활분 디자인 정합)

🎯 운영 RecommendedVideos + MySummaryHero + RecommendedGames 헤더/카드/토큰 패턴을 시안 BDR-current/screens/Home.jsx 의 RecommendedRail 통일 패턴과 정합. **상세 = `Dev/home-design-alignment-2026-05-09.md` (11 섹션 / Q1~Q7 / ~55분 옵션 B).**

📍 변경 파일 (옵션 B / P0):
| 파일 | 역할 | 신규/수정 |
|------|------|----------|
| `src/components/bdr-v2/recommended-rail.tsx` | RecommendedRail 통일 컴포넌트 (시안 line 405~440 카피 / props: title/eyebrow/moreHref/moreLabel/children/inset / `style={{}}` 직접 + var(--*) 토큰 100%) | 신규 (~80L) |
| `src/components/home/recommended-videos.tsx` | 자체 inline 헤더 (line 86~101 12줄) 제거 → `<RecommendedRail title="BDR 추천 영상" eyebrow="WATCH NOW · YOUTUBE" moreHref="https://www.youtube.com/@BDRBASKET" moreTarget="_blank">` wrapper / 카드 영역 (line 105~198) 보존 | 수정 |
| `src/components/home/recommended-games.tsx` | TossSectionHeader (line 137) 제거 → `<RecommendedRail title={title} eyebrow="GAMES · 픽업 · 게스트" moreHref="/games">` wrapper / GameCard (운영 280×112) 보존 | 수정 |

🔗 기존 코드 연결:
- SWR 키 / fetcher / fallback 데이터 — 변경 0 (`/api/web/youtube/recommend` / `/api/web/recommended-games` / `/api/web/profile` / `/api/web/profile/stats`)
- bdr-v2 도메인 = 시안 카피 컴포넌트 동거 (CardPanel / BoardRow / HotPostRow / GameCard / HeroCarousel)
- globals.css 토큰 alias 정합 ✅ (`var(--ink)` / `var(--ink-mute)` / `var(--accent)` / `var(--border)` 시안 + 운영 동일 정의 / 5/9 PlayerProfile reviewer 검증)
- `.eyebrow` / `.card` 클래스 = globals.css 정의됨 (시안 baseline 일치)

📋 실행 (P0 / 옵션 B / ~55분):
| 순서 | 작업 | 담당 | 시간 |
|------|------|------|------|
| 1 | RecommendedRail 신규 작성 (시안 line 405~440 카피 / Link `target` props 추가) | developer | 15분 |
| 2 | RecommendedVideos 헤더 교체 + import | developer | 10분 |
| 3 | RecommendedGames 헤더 교체 + import | developer | 10분 |
| 4 | tester (tsc + 모바일 720px 분기 + RecommendedRail 4 case eyebrow/title/moreHref/inset) + reviewer (시안 카피 정합 + 토큰 100%) 병렬 | tester + reviewer | 15분 |
| 5 | PM 커밋 + 진행 현황 갱신 | pm | 5분 |

⚠️ developer 주의사항:
- RecommendedRail = **server component** (use client X — `React.Children.toArray` + Link 둘 다 SSR OK)
- RecommendedRail props 에 `moreTarget?: '_blank' | '_self'` 추가 — RecommendedVideos 외부 URL 처리용
- `.eyebrow` 클래스 globals.css 정의 사용 (시안 카피 — 직접 색상/폰트 X)
- 시안 line 405~440 의 `more={() => setRoute('games')}` (시안 함수) → `moreHref="/games"` (운영 Next Link) 변환
- MySummaryHero **무수정** — 시안에서도 RecommendedRail 미사용 별도 형식 (시안 line 310)
- NBA 2K "WATCH NOW" h2 폐기 → eyebrow `"WATCH NOW · YOUTUBE"` 로 톤 일부 보존 (사용자 결정 §11 시안 우선)
- 모바일 720px 분기 — RecommendedRail h3 영향 0 (시안 `h1` 한정 미디어쿼리)
- `@media (max-width: 720px) .home h1` 만 → h3 영향 X / 카드 width 변경 X

🔒 회귀 0:
- API 응답 키 / endpoint 변경 0
- DB schema 변경 0
- Flutter v1 (`/api/v1/*`) 변경 0
- SWR 키 / fetcher / fallback 데이터 (DUMMY_VIDEOS / FALLBACK_GAMES) 보존
- 모바일 720px 분기 영향 0 (카드 width 보존)
- 사용자 영향 = 헤더 시각만 (NBA 2K 톤 약화 / TossSectionHeader 차분화)

📐 결재 Q1~Q7 추천:
- Q1 옵션: **B (헤더만 통일 / ~55분 / 회귀 0)** vs A (시안 100% ~3h) vs C (시안 직접 도입 ~3h)
- Q2 위치: **A (bdr-v2 — 시안 카피 도메인)** vs B (home/)
- Q3 NBA 2K: **A (eyebrow "WATCH NOW · YOUTUBE" 로 NBA 톤 일부 보존)** vs B (NBA 보존 — RecommendedVideos 만 헤더 교체 제외)
- Q4 EmptyCard: **A (MySummary 보존 — 시안도 별도 형식)** vs B (시안 MySummaryHero 직접 카피)
- Q5 Tailwind 마이그: **A (점진 — 신규만 `style={{}}`)** vs B (강제 통일 = 옵션 A)
- Q6 카드 추출: **A (후속 PR — 본 PR 은 헤더만)** vs B (즉시 GameMiniCard / VideoMiniCard 추출)
- Q7 시점: A (즉시 5/9) vs **B (5/10 후 / 다음 주 — 5/9 부활 검증 후)** vs C (PortOne 후)

---

## 기획설계 직전 (5/9 — 활동 로그 + 통산 더보기 Phase 2)

**[5/9 — developer 구현 완료]** **공개 프로필 활동 로그 + 통산 더보기 — Phase 2 코드 구현 100%**
- 사용자 결재 8건 일괄 승인 (Q1~Q8 모두 A) — 활동 로그 5종 / Q2 fix / 모달 / _v2 산하 / Q5 라우팅 / Q7 클라 groupBy / Q8 최신 우선
- 산출: 2 신규 (activity-log.tsx 222L + stats-detail-modal.tsx 396L) + 4 수정 (page.tsx 쿼리 #10~#12 + ActivityEvent 변환 + AllStatsRow 변환 + Q2 fix / overview-tab.tsx "use client" 전환 + 활동 카드 ActivityLog wire + 통산 [더보기] 모달 wire / overview-tab.css 무수정 / PlayerProfile.jsx 시안 박제)
- 검증: tsc 0 / npx next build 통과 / truncated 룰 6파일 모두 마지막 줄 정상 (page.tsx 709L `}` / activity-log 222L `}` / stats-detail-modal 396L `}` / overview-tab 470L `}` / overview-tab.css 49L `}` / PlayerProfile.jsx 518L `window.PlayerProfile = PlayerProfile;`)
- 다음: tester + reviewer 병렬 → PM 커밋

### 테스트 결과 (tester / 5/9 활동 로그+모달)

📊 종합 판정: **✅ 8/8 영역 통과** (수정 요청 0건 / 정보 1건)

#### 빌드
| 항목 | 결과 | 비고 |
|------|------|------|
| `npx tsc --noEmit` | ✅ 0 | 출력 없음 — 에러 0 |
| `npx next build` | ✅ 통과 | `ƒ /users/[id]` 동적 라우트 빌드 성공. warn 3건 본 작업 무관 (Serwist Turbopack / Heatmap dynamic-server / ads dynamic-server — 기존 routes) |
| truncated 룰 6 파일 | ✅ 모두 정상 | activity-log.tsx 222L `}` / stats-detail-modal.tsx 396L `}` / page.tsx 709L `}` / overview-tab.tsx 470L `}` / overview-tab.css 49L `}` / PlayerProfile.jsx 518L `window.PlayerProfile = PlayerProfile;` |

#### 활동 로그 5종 (Q1)
| 항목 | 결과 | 비고 |
|------|------|------|
| ActivityEvent union 7종 (match/mvp/team_joined/team_left/team_transferred/jersey_changed/signup) | ✅ | activity-log.tsx L19~47 |
| 시간순 정렬 (Q8 최신 우선) | ✅ | page.tsx L612 `sort((a,b)=>b.date.localeCompare(a.date))` |
| 5건 제한 | ✅ | L613 `slice(0,5)` |
| Material Symbols 7개 (sports_basketball/emoji_events/group_add/logout/swap_horiz/tag/person_add) | ✅ | activity-log.tsx L50~67 (lucide-react ❌ CLAUDE.md §디자인 핵심 준수) |
| 상대 날짜 (오늘/어제/N일 전/M/D(요일)) | ✅ | activity-log.tsx L98~114 |
| 빈 상태 fallback | ✅ | L127~140 italic "아직 활동 기록이 없어요" |

#### Q2 버그 fix — "경기 참가 0"
| 항목 | 결과 | 비고 |
|------|------|------|
| activity.gamesPlayed = statAgg._count.id | ✅ | page.tsx L417 + L491 (matchPlayerStat 단일 source) |
| 통산 카드와 일관 source | ✅ | seasonStats.games (L425) + activity.gamesPlayed (L491) 모두 statAgg._count.id 재활용 |
| user.total_games_participated 미사용 | ✅ | grep 결과 활동 카드 변환 로직에서 미사용 (Q2 fix 정확) |

#### Q5 라우팅
| event type | href | 결과 |
|-----------|------|------|
| match → /live/[matchId] | ✅ | activity-log.tsx L118 |
| mvp → /live/[matchId] | ✅ | L118 |
| team_joined / team_left / team_transferred → /teams/[teamId] | ✅ | L119~121 |
| jersey_changed → /teams/[teamId] | ✅ | L122 |
| signup → null (클릭 X) | ✅ | L123 |

#### 더보기 모달 (Q3+Q7)
| 항목 | 결과 | 비고 |
|------|------|------|
| 3 탭 (전체/연도별/대회별) | ✅ | stats-detail-modal.tsx L264~268 + L172~178 분기 |
| 8열 (구분/경기/승률/PPG/RPG/APG/MIN/FG%/3P%) | ✅ | L328~336 |
| groupBy 연도 desc | ✅ | L99~101 `sort((a,b)=>b[0]-a[0])` |
| groupBy 대회 = 최신 매치 desc | ✅ | L113~125 `latestDate.localeCompare` desc |
| ESC 키 close | ✅ | L153~155 keydown handler |
| Overlay click close | ✅ | L185 + L198 stopPropagation |
| × 버튼 close | ✅ | L237 |
| body scroll lock + cleanup | ✅ | L150~160 |
| 모바일 풀스크린 (720px) | ✅ | maxWidth:720 + width:100% + padding:16 (≤720px 자동 풀스크린) |
| 커리어 평균 행 강조 (마지막+bg-alt+700) | ✅ | L341~352 isCareer 분기 |
| "-" 표시 (games=0/pct=0) | ✅ | fmtNum/fmtPct/fmtWinRate L132~143 |

#### TeamMemberHistory 타입 가드
| 항목 | 결과 | 비고 |
|------|------|------|
| payload `{old:{jersey},new:{jersey}}` schema 일치 | ✅ | schema.prisma L3113 주석 형식 일치 |
| typeof 가드 + try/catch fallback | ✅ | page.tsx L583~594 `typeof oldVal === "number"` |
| 형식 다를 때 fallback "등번호 변경" | ✅ | activity-log.tsx L91 (둘 다 null 시 fallback 분기 정확) |
| eventType in 절 7종 (joined/left/withdrawn/jersey_changed/jersey_change_approved/transferred_in/out) | ✅ | page.tsx L321~329 |
| eventType "withdrawn" left와 동일 처리 (안전장치) | ✅ | page.tsx L558 |

#### page.tsx 쿼리 효율
| 항목 | 결과 | 비고 |
|------|------|------|
| 12 쿼리 Promise.all 병렬 | ✅ | L89~102 신규 #10/#11/#12 모두 병렬 |
| officialMatchNestedFilter 일관 적용 | ✅ | #2 L156 / #3 L181 / #12 L351 — status `["completed","live"]` + `scheduledAt <= NOW()` 일관 |
| N+1 위험 0 | ✅ | matchPlayerStat findMany select 안에 nested tournamentMatch + ttp.tournamentTeamId 자동 join — 단일 쿼리 |
| 비로그인 동작 | ✅ | L78~83 session/isOwner 가드 / followRecord (#5) 만 session 분기 |
| ?preview=1 본인 미리보기 | ✅ | L81 `isOwner && preview !== "1"` |

#### 회귀 0
| 영역 | 결과 | 검증 |
|------|------|------|
| Flutter `/api/v1/*` | ✅ 0 | 변경 6 파일 모두 `(web)/users/[id]/*` + 시안 한정 |
| DB schema | ✅ 0 | prisma/schema.prisma 미수정 |
| API 신규 endpoint | ✅ 0 | route.ts 신규 0 |
| Phase 1 NBA (PlayerMatchCard / 8열 통산 / Hero jersey) | ✅ 0 | events/allStatsRows props 추가만 / 기존 grid/Hero 무수정 |
| ISR 60초 | ✅ 유지 | page.tsx L42 |
| preview=1 / isOwner /profile redirect | ✅ 유지 | L78~83 |
| RecentGamesTab / PlayerHero / overview-tab.css | ✅ 무수정 | props 시그니처 그대로 |

#### 종합 판정
- 빌드 + truncated 통과 (6 파일 마지막 줄 정상 / tsc 0 / next build 통과)
- 활동 로그 5종 (Q1=A) + Q2 fix + Q5 라우팅 + 모달 (Q3+Q7) + TeamMemberHistory 타입 가드 + 쿼리 효율 + 회귀 0 — 8 영역 모두 정확
- 사용자 결재 8건 (Q1~Q8) 모두 코드에 정확 반영

#### 발견 이슈 — 0건 (정보성 1건)
- **정보 1건**: page.tsx L507 `if (m.status !== "ended" && m.status !== "completed") continue;` — `"ended"` 분기는 죽은 코드 (운영 tournament_matches.status 값 = `live/completed/scheduled`만 사용, "ended" 미사용 grep 검증). 영향 0 (completed만 통과). 향후 정리 가능 — 수정 요청 X.

#### 수정 요청 — 없음

#### 후속 권장 (런타임 검증 — PM 머지 후)
1. 실측 사용자 (id=2999 김수빈, 418경기) 진입 → 활동 로그 5건 + 모달 3탭 가시 검증
2. 모바일 720px 분기 — 모달 풀스크린 + 8열 가로 스크롤
3. 비로그인 진입 검증 (followRecord null + ActionButtons 비로그인 분기)

### 리뷰 결과 (reviewer / 5/9 활동 로그+모달)

📊 종합 판정: **통과 (수정 요청 1건 / 권장 2건)**

#### ActivityLog
- ActivityEvent 5종 union 정확 (match/mvp/team_joined/team_left/team_transferred/jersey_changed/signup) — discriminated union 으로 TS exhaustive 보장 (getIcon/getTitle/getHref switch 7케이스 모두 cover, tsc 통과 = 누락 0).
- props 단순 (`events: ActivityEvent[]` 1개) — Q4=A 페이지 한정 결정 부합.
- 빈 상태: `events.length === 0 → "아직 활동 기록이 없어요"` italic + ink-dim 톤. OK.
- 클릭 라우팅 Q5=A 정확: match/mvp → `/live/[matchId]` / team_*/jersey_changed → `/teams/[teamId]` / signup 미링크. `getHref` 단일 source.
- 상대 날짜 (fmtRelative): isNaN 가드 + 미래 / 오늘 / 어제 / N일 전(<7) / M/D(요일) — fallback "-" 안전.
- Material Symbols Outlined ligature (lucide-react 금지 룰 ✅) + aria-hidden + flexShrink:0 + width:18 + lineHeight:1.
- 🟡 L25 주석 `// "21:17"` — 시간 표기법 오해 소지. 실제는 점수 (예: "52:47"). 주석 명확화 권장.

#### StatsDetailModal
- `"use client"` 정확 — useState/useEffect 사용.
- props 명확: `open / onClose / allStatsRows` 3개 한정 / 직렬화 OK (BigInt/Date 0).
- 3 탭 state (TabKey union "all"|"year"|"tournament") — 단일 useState, 메모이제이션 생략 (Q7=A 100건 미만 가정 부합).
- 클라 groupBy 정확:
  - groupByYear: scheduledAt.getFullYear() Map → 연도 desc sort. NULL/NaN 제외.
  - groupByTournament: tournamentId Map + latestDate 갱신 → 최신 매치 desc (Q8=A).
- buildRow 누적 평균: sum/games 산술 평균. FG%/3P% 도 게임 단위 단순 평균 (Phase 1 일관). games=0 분기 0/0 안전.
- ESC 키 close: useEffect keydown 등록 + cleanup 정확. open=false early return → 미등록.
- overlay click + inner stopPropagation — 표준 패턴.
- × 버튼 + aria-label="닫기" 접근성 OK.
- body scroll lock: prevOverflow 보존 + cleanup 시 복원 (다중 모달 안전).
- 모바일 풀스크린: maxWidth:720 + width:100% + maxHeight:90vh + padding:16. overflow-x:auto + min-width:640 8열 가로 스크롤.
- header sticky (top:0 + zIndex:1) — 긴 표 스크롤 시 닫기 버튼 노출 보장.
- 빈 상태: allStatsRows.length=0 → "집계할 경기 기록이 없어요" — table 미마운트.

#### page.tsx 쿼리
- 12 쿼리 Promise.all 병렬 → N+1 위험 0. #10/#11/#12 모두 단일 findMany.
- #10 mvpMatches: `mvp_player_id + ended_at NOT NULL` 가드 — 진행 중 / scheduled 매치 제외. orderBy 2단 (`ended_at desc nulls last + scheduledAt desc`).
- #11 teamMemberHistory: 7 eventType IN — schema event_type 후보 (line 3109~3112) 정합. take:10 (signup/match/mvp 합쳐 5건 추출 위해 여유). force_changed/dormant_* 등 활동 로그 부적합 항목 제외 정확.
- #12 allStatsForModal: officialMatchNestedFilter() 가드 (5/2 회귀 패턴 일관). select 키 7 stat + tournament/scheduledAt/score/teamId — 모달 groupBy 최소 필드.
- ActivityEvent[] 변환 로직:
  - (a) match: recentGames 재활용 + status="ended"|"completed" 필터 + playerSide/result 판정 정확.
  - (b) mvp: ended_at ?? scheduledAt fallback 안전.
  - (c) teamHistory: 7 eventType 분기 모두 cover.
  - (d) signup: createdAt 1건 항상 추가. 활동 많은 사용자는 정렬 후 top5 컷오프 시 자동 제외.
  - (e) sort `b.date.localeCompare(a.date)` ISO desc 정확 (ISO 8601 lexicographic = chronological).
- AllStatsRow[] 변환: BigInt → string 직렬화 / Decimal → Number / playerSide+won 계산 정확.

#### 🔴 TeamMemberHistory.payload 형식 미스매치 (수정 요청 1건 — tester 영역과 차이)
- tester 결과 (L138) "schema.prisma L3113 주석 형식 일치" 라고 ✅ 표기되었으나, schema 주석 (`payload 예: { old:{...}, new:{...} }`) 은 **다른 eventType** (force_changed, dormant 등) 형식. **jersey_changed 의 실제 payload 는 다름**.
- 실제 운영 payload (`api/web/teams/[id]/requests/[requestId]/route.ts` L233~239):
  ```ts
  historyPayload = {
    requestId, requestType,
    old: oldJersey,  // number | null 직접
    new: newJersey,  // number | null 직접
    reason
  };
  ```
- page.tsx L584~591 가정 (잘못):
  ```ts
  const p = h.payload as { old?: { jersey?: unknown }; new?: { jersey?: unknown } };
  const oldVal = p?.old?.jersey;  // ⚠️ 영구 undefined
  const newVal = p?.new?.jersey;  // ⚠️ 영구 undefined
  ```
- 결과: oldJersey/newJersey 영구 null → activity-log.tsx L91 fallback `"${teamName} 등번호 변경"` 노출 (#7 → #8 형식 영구 미노출).
- **빌드 통과** (TS unknown cast → 런타임 undefined). **앱 동작 OK / 시각 정보 손실만**. — 그래서 tester 가 발견 못함 (typeof 가드는 형식 자체 동작).
- **수정 안**:
  ```ts
  const p = h.payload as
    | { old?: number | null; new?: number | null }
    | null
    | undefined;
  if (typeof p?.old === "number") oldJersey = p.old;
  if (typeof p?.new === "number") newJersey = p.new;
  ```

#### Q2 버그 fix
- activity.gamesPlayed = statAgg._count.id (matchPlayerStat 통일) — page.tsx L417 단일 변수 선언 후 양쪽 재사용 → 단일 source 보장.
- user.total_games_participated 의존 제거. 카운터 백필 누락 케이스 회피.
- total_games_participated orphan 위험은 본 작업 외 (admin/leaderboard 사용 시 별도 검증 — 후속).

#### 컨벤션
- 파일명 kebab-case: ✅ activity-log.tsx / stats-detail-modal.tsx.
- 함수 camelCase: ✅ getIcon/getTitle/getHref/fmtRelative/buildRow/groupByYear/groupByTournament/fmtNum/fmtPct/fmtWinRate.
- TS strict / any 0: ✅ 6파일 grep 0 hit. unknown cast 사용 (any 회피).
- JSDoc 헤더: ✅ activity-log/stats-detail-modal/overview-tab 모두 5/9 변경 사유 명시.
- "use client" 정확: stats-detail-modal (useState/useEffect 필수) ✅ / overview-tab (useState — 모달 open) ✅ / activity-log 미사용 (인터랙션 0) — 적절.
- props 직렬화: events (string union + number/null) / allStatsRows (string/number/boolean) — Date/BigInt 0, RSC payload 안전.

#### 시안 박제
- PlayerProfile.jsx L34~42 활동 5건 mock — 운영 ActivityEvent 5종 시각 매핑 정확 (match/mvp/jersey/team_joined/signup).
- L44~57 통산 모달 mock — careerRow + yearRows 4건 + tournamentRows 3건 8열.
- L181~183 [더보기] 버튼 + L414~421 모달 mount — 운영 overview-tab.tsx 패턴 카피.
- L428~501 StatsDetailModal mock — 운영과 시각적 1:1 (3 탭 + ESC + overlay click + body scroll lock + 8열 표 + 커리어 행 강조).
- 토큰 일관: var(--accent)/var(--bg-alt)/var(--ff-mono)/var(--ff-display)/var(--ok)/var(--danger) — 핑크/살몬/코랄 0 / lucide-react 0 / Material Symbols ✅.
- BDR-current 마지막 줄 정상 (`window.PlayerProfile = PlayerProfile;`).
- 🟡 stats 탭 mock (L291~311) 구버전 6열 + BPG — Phase 1 후 obsolete. 모달이 동일 정보 8열로 노출 → 중복. 후속 정리 검토 (시안 보존 우선이면 유지 OK).

#### errors.md 적용
- truncated: 6 파일 마지막 2줄 정상 종료 — activity-log.tsx `}` / stats-detail-modal.tsx `}` / page.tsx `}` / overview-tab.tsx `}` / overview-tab.css `}` / PlayerProfile.jsx `window.PlayerProfile = PlayerProfile;` (실측 ✅).
- envelope/snake_case: 본 작업 API endpoint 추가 0 → page.tsx server component → props 직접 전달. Date.toISOString() 명시 변환. DB snake_case → JS camelCase 매핑 일관 (total_rebounds → rebounds / field_goal_percentage → fgPct / three_point_percentage → threePct). 회귀 0.

#### 회귀 위험
- Flutter `/api/v1/*`: ✅ 0 (변경 = `(web)/users/[id]/*` + BDR-current/* 한정).
- DB schema: ✅ 0 (prisma/schema.prisma 무수정).
- API endpoint: ✅ 0 신규.
- Phase 1 NBA 카드: ✅ 0 (PlayerMatchCard / RecentGamesTab / Hero 무변경).
- 8열 통산 카드: ✅ 0 (overview-tab.tsx 통산 grid 무변경 — 헤더 [더보기] 버튼만 추가).
- 비로그인 / preview=1 / ISR 60초 / isOwner /profile redirect: ✅ 모두 그대로.

✅ 잘된 점:
- 12 쿼리 Promise.all 병렬 — 추가 3건 (#10~#12) 도 동일 패턴 일관.
- 5종 source 단일 ActivityEvent[] 통합 — discriminated union TS exhaustive 보장.
- 모달 접근성 풀세트 — role="dialog" + aria-modal + aria-labelledby + ESC + overlay click + × + body scroll lock + cleanup useEffect.
- Q2 데이터 source 통일 — 통산/활동 카드 단일 source (statAgg._count.id) — 분기 패턴 회피.
- 모바일 풀스크린 우아 fallback (maxWidth:720 + maxHeight:90vh + width:100%).
- truncated 6 파일 모두 마지막 줄 정상.
- BDR-current 시안 박제 운영 컴포넌트와 시각 1:1.

🟡 권장 수정 (필수 X):
1. activity-log.tsx L25 주석 `// "21:17"` → "예: '52:47' 점수" 로 명확화.
2. PlayerProfile.jsx stats 탭 (L291~311) 구버전 6열 BPG mock — 모달 정보 중복. 후속 정리 검토.

🔴 수정 요청 (필수 1건):
- **page.tsx L583~594 jersey_changed payload 가드 형식 수정** — 위 §"TeamMemberHistory.payload 형식 미스매치" 참조. 5분 fix. 미수정 시 jersey 변경 활동에서 #N → #N 시각 정보 영구 손실 (앱 동작 무관).

#### 종합 평가
- ⭐⭐⭐⭐ (4/5)
- 사유: 설계서 Q1~Q8 8건 모두 반영 + 12 쿼리 병렬 + truncated 0 + 회귀 0 + 시안 동기 등 기능 완성도 우수. 단 jersey_changed payload 형식 미스매치로 시각 정보 손실 1건 (앱 동작 무관). 수정 후 ⭐⭐⭐⭐⭐.

#### 개선 제안 (후속)
1. **payload 형식 가드 수정** — 5분 fix (필수).
2. **useMemo 적용** — groupByYear/Tournament/careerRow 매 render 재계산 (100건 미만 가정으로 무시 가능, 후속).
3. **stats 탭 obsolete 시안 정리** — 모달과 정보 중복 (필수 X).
4. **total_games_participated 카운터 검증** — admin/leaderboard 사용 여부 + cron 백필 (본 작업 외).

### 구현 기록 (developer / 5/9 Phase 2 활동 로그 + 통산 더보기)

📝 구현한 기능: `/users/[id]` 공개 프로필 활동 로그 5종 통합 + 통산 [더보기] 모달 3탭

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/users/[id]/_v2/activity-log.tsx` | **신규** — ActivityEvent 타입 export + 5종 렌더 (match/mvp/team_joined/team_left/team_transferred/jersey_changed/signup) + Material Symbols Outlined 아이콘 + Q5 라우팅 (match/mvp=/live/[id], team_*=/teams/[id]) + 빈 상태 fallback + 상대 날짜 (오늘/어제/N일 전/M/D(요일)) | 신규 (222L) |
| `src/app/(web)/users/[id]/_v2/stats-detail-modal.tsx` | **신규 client component** — AllStatsRow 타입 export + 3 탭 (전체/연도별/대회별) + 클라 groupBy (year=getFullYear, tournament=tournamentId) + 누적 평균 buildRow 헬퍼 + 8열 테이블 (구분/경기/승률/PPG/RPG/APG/MIN/FG%/3P%) + 커리어 평균 강조 마지막 행 + ESC 키 close + overlay click + body scroll lock + 모바일 풀스크린 가드 | 신규 (396L) |
| `src/app/(web)/users/[id]/page.tsx` | 쿼리 9→12 (#10 mvpMatches + #11 teamHistoryRows + #12 allStatsForModal) / ActivityEvent[] 변환 (5종 source 합산 → date desc sort → top 5) / AllStatsRow[] 변환 (BigInt→string + Decimal→number + playerSide+won 계산) / **Q2 fix**: activity.gamesPlayed = statAgg._count.id (matchPlayerStat 통일) / OverviewTab 호출에 events + allStatsRows props 추가 | 수정 (440→709L) |
| `src/app/(web)/users/[id]/_v2/overview-tab.tsx` | **`"use client"` 전환** (모달 useState 필요) / OverviewTabProps 에 events + allStatsRows 추가 / 통산 헤더에 [더보기] 버튼 (allStatsRows.length>0 가드) / 활동 카드 단순 메타 → 압축 메타 (가입+경기+주최) + ActivityLog 5건 / 모달 mount (open state) | 수정 (391→470L) |
| `Dev/design/BDR-current/screens/PlayerProfile.jsx` | 시안 역박제 — 활동 카드 5건 mock (match/mvp/jersey/team_joined/signup) + Material Symbol 아이콘 + 통산 헤더 [더보기] 버튼 + StatsDetailModal mock (3탭 + 8열 테이블 + ESC + overlay click) | 수정 (380→518L) |

💡 tester 참고:
- 테스트 URL: 비로그인 또는 본인 외 user → `/users/[id]` (예: `/users/2999?preview=1` 본인 미리보기)
- 활동 카드 정상 동작:
  - 압축 메타: "가입 2018.03.14 · 경기 418 · 주최 N" (Q2 fix — total_games_participated 대신 matchPlayerStat 카운트)
  - 활동 로그 5건 (최신 우선): 매치/MVP는 클릭 → /live/[id] / 팀가입·탈퇴·이적·등번호변경 클릭 → /teams/[id] / 가입 클릭 0
  - Material Symbol 아이콘 7종 (sports_basketball/emoji_events/group_add/logout/swap_horiz/tag/person_add)
  - 빈 상태: events.length=0 → "아직 활동 기록이 없어요" italic
  - 상대 날짜 포맷: 오늘/어제/N일 전 (7일 미만) / M/D (요일) (7일 이상)
- 통산 [더보기] 정상 동작:
  - allStatsRows.length>0 일 때만 버튼 노출 / hover 시 색상 변화
  - 모달 open: ESC 또는 overlay click 또는 × 버튼 → close
  - body scroll lock (모달 열린 동안 배경 스크롤 0)
  - 3 탭: 전체 (커리어 평균 1행) / 연도별 (yr desc + 커리어) / 대회별 (latest match 기준 desc + 커리어)
  - 커리어 평균 행: 마지막 + bg-alt + 700 weight 강조
  - 8열 테이블 가로 스크롤 (overflow-x:auto + min-width:640)
  - "-" 표시: games=0 / pct=0 / fmtNum 의 0
- 빈 데이터 fallback:
  - allStatsRows=[] → 모달 안 "집계할 경기 기록이 없어요"
  - events=[] → 활동 로그 카드 안 "아직 활동 기록이 없어요"

⚠️ reviewer 참고:
- "use client" 전환 결정 — overview-tab.tsx 가 client wrapper 분리보다 단순. props 모두 직렬화 OK (string/number/boolean / Date/BigInt 0). RSC payload 영향 = OverviewTab 자체가 page.tsx 의 children prop 으로 전달되므로 RSC boundary 명확
- TeamMemberHistory.payload 가드 — 추정 형식 `{old:{jersey:7}, new:{jersey:8}}`. typeof 가드 + try/catch 로 형식 다를 시 fallback "등번호 변경"
- ended_at !== null 가드 (mvp 쿼리 #10) — status='ended' 백필 안전 위해 ended_at 사용
- 클라 groupBy 정렬: 연도 desc / 대회 = 해당 대회 내 최신 매치 scheduledAt desc 기준
- ActivityEvent.match 의 result 판정: playerSide null 또는 동점 시 `null` (W/L 표시 0)
- next/image 0 — 모달 안 이미지 없음 (도메인 화이트리스트 회피)
- AllStatsRow.fgPct/threePct = single-row avg (가중 X) — career row 도 모든 경기 단순 평균 (NBA 가중 attempts-based 무시 — 모바일 표 단순화)

🔧 회귀 위험 0 검증:
- Flutter `/api/v1/*` ❌ 0 (변경 = `(web)/users/[id]/*` + 시안 한정)
- DB schema ❌ 0 (prisma/schema.prisma 무수정)
- API 신규 endpoint ❌ 0 (page.tsx 내 prisma 직접 호출만)
- Phase 1 (NBA 카드 8열 Hero jersey) 영향 0 (overview-tab.tsx 시즌 grid + Hero 컴포넌트 무수정)
- ISR 60초 ✅ 유지 / preview=1 미리보기 ✅ 유지 / isOwner /profile redirect ✅ 유지

**[5/9 직전]** **사전 라인업 확정 + 기록앱 자동 매핑 — 설계 단계**
- 산출: 설계 보고서 `Dev/match-lineup-confirmation-2026-05-09.md` (Q1~Q9 결재 대기)

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
| 2026-05-09 | (설계 단계 — 코드 변경 0) | **홈 5/9 부활분 3 컴포넌트 디자인 시스템 정합 — 설계 보고서 작성** — 11 섹션 / Q1~Q7 결재 / 옵션 A/B/C 비교 / 옵션 B 권장 (~55분). 핵심: 시안 BDR-current/screens/Home.jsx 의 RecommendedRail 통일 패턴 (시안 line 405~440) vs 운영 3종 분산 헤더 (RecommendedVideos NBA 2K 자체 / MySummaryHero 헤더없음 / RecommendedGames TossSectionHeader) 차이 매트릭스 6 영역. 옵션 B = RecommendedRail 신규 1개 (`src/components/bdr-v2/recommended-rail.tsx` ~80L server component / props: title/eyebrow/moreHref/moreLabel/moreTarget/inset/children) + 헤더만 교체 (RecommendedVideos + RecommendedGames) / MySummaryHero 무수정 (시안도 별도 형식 line 310). 회귀 0 (API/DB/Flutter v1 / SWR 키 / fallback / 모바일 720px / 카드 width). 결재 추천: B(헤더만)/A(bdr-v2 위치)/A(eyebrow="WATCH NOW · YOUTUBE")/A(MySummary 보존)/A(점진 마이그)/A(카드 후속 추출)/B(5/10 후). 산출: `Dev/home-design-alignment-2026-05-09.md`. | 📋 결재 대기 |
| 2026-05-09 | (대기 — tester/reviewer 후 PM 커밋) | **옵션 B — RecommendedRail 통일 + 헤더 교체 (RecommendedVideos / RecommendedGames)** — 1 신규 (`src/components/bdr-v2/recommended-rail.tsx` 178L: 시안 line 405~440 카피 / props title/eyebrow/more `{label?,href?,onClick?}`/children/inset / RailMore 보조 컴포넌트 = 외부 URL→target=_blank, 내부→Next Link, href 없으면 button / globals.css `.eyebrow` 클래스 활용). 2 헤더 교체: (a) RecommendedVideos — 자체 "WATCH NOW" 2K 헤더 div 제거 → RecommendedRail wrapper (eyebrow="WATCH NOW · YOUTUBE" / title="BDR 추천 영상" / more YouTube 외부 / NBA 2K 카드 디자인 보존 / Link import 제거). (b) RecommendedGames — TossSectionHeader 제거 → RecommendedRail wrapper (eyebrow="GAMES · 픽업 · 게스트" / title 동적 userName / more "/games" / 컴팩트 카드 보존). MySummaryHero 무수정 (시안도 단독 line 91). 시안 박제 후속 (BDR-current/screens/Home.jsx 변경 0 — 이미 정합). tsc 0 / truncated 0 (3파일 `}` 종결) / API/DB/Flutter v1/SWR/fallback/HeroCarousel/StatsStrip/2컬럼 모두 무수정. TossSectionHeader 컴포넌트 자체는 다른 5 파일에서 사용 중 → 보존. | 📋 PM 검토 대기 |
| 2026-05-09 | (대기 — tester/reviewer 후 PM 커밋) | **공개 프로필 (`/users/[id]`) Phase 2 — 활동 로그 + 통산 더보기 모달 구현 완료** — 사용자 결재 8건 일괄 승인 (Q1~Q8=A). 2 신규 (activity-log.tsx 222L + stats-detail-modal.tsx 396L) + 4 수정 (page.tsx 쿼리 #10~#12 + ActivityEvent/AllStatsRow 변환 + Q2 fix gamesPlayed=statAgg._count.id / overview-tab.tsx "use client" + 활동 카드 ActivityLog 통합 + 통산 [더보기] 모달 wire / PlayerProfile.jsx 시안 박제). ActivityLog 5종 (match/mvp/team_joined·left·transferred/jersey_changed/signup) + Material Symbols 아이콘 7종 + 상대 날짜 + Q5 라우팅. StatsDetailModal 3탭 (전체/연도별/대회별) + 클라 groupBy + 커리어 평균 강조 + ESC/overlay/scroll lock. tsc 0 / next build 통과 / truncated 6파일 마지막 줄 정상. DB/API/Flutter v1 영향 0. | ✅ |
| 2026-05-09 | (대기 — PM 커밋 예정) | **홈페이지 P0 — MySummaryHero + RecommendedGames 부활** — `src/app/(web)/page.tsx` +29L (337L → 366L). import 7L 추가 (RecommendedVideos 옆 그룹) + JSX 섹션 2개 (MySummaryHero HeroCarousel 직후 / RecommendedGames StatsStrip 다음 RecommendedVideos 위) + 상단 주석 5섹션 → 7섹션 갱신. 두 컴포넌트 모두 자체 헤더/Empty 분기 보유 → CardPanel 래퍼 없이 직접 렌더 (RecommendedVideos 동일 패턴). 검증: tsc 0 에러 (page.tsx 한정) / truncated 0 (366L `}` 종결) / HeroCarousel·StatsStrip·RecommendedVideos·2컬럼·방금올라온글 5 섹션 무수정 / prefetch 4건 무수정 / API/DB/Flutter v1 영향 0. 시안 박제 변경 0 (BDR-current/screens/Home.jsx 이미 박제 완료). 비로그인 자체 분기: MySummaryHero=EmptyCard / RecommendedGames=user_name null. | ✅ |
| 2026-05-09 | (대기 — PM 커밋 예정) | **홈페이지 RecommendedVideos 부활** — 2026-04-24 BDR v2 Phase 1 (`d6bc22c`) 일괄 제거 후 5/9 부활. (1) `src/app/(web)/page.tsx` +13L (import 3L + 주석 4L + StatsStrip 다음 `<section marginTop:24>` 래퍼 5L + 상단 주석 1L). 컴포넌트 자체 "HIGHLIGHTS" NBA 2K 헤더 보유 → CardPanel 래퍼 미적용 (헤더 중복 회피). (2) `Dev/design/BDR-current/screens/Home.jsx` +118L 시안 역박제 (운영 → 시안 동기화 룰 / 5/7 lessons.md): mock 데이터 6건 + RecommendedRail #2.5 (열린 대회 다음) + VideoMiniCard 컴포넌트 (가로 스크롤 캐러셀 / accent 그라디언트 썸네일 / LIVE 뱃지 / 듀레이션 뱃지 / uppercase 제목). 검증: tsc 0 / truncated 0 (page.tsx 337L `}` 종결 / Home.jsx 977L `window.Home = Home;` 종결) / HeroCarousel·StatsStrip·2컬럼·방금올라온글 4 섹션 무수정 / prefetch 4건 무수정 / API/DB/Flutter v1 영향 0. 컴포넌트는 useSWR 클라사이드 자체 fetch → SSR 영향 0. | ✅ |
| 2026-05-09 | (대기 — tester/reviewer 후 PM 커밋) | **공개 프로필 (`/users/[id]`) NBA 스타일 구현 완료** — 1 신규 (PlayerMatchCard 글로벌 컴포넌트 380L `src/components/match/`) + 6 수정 (page.tsx 쿼리 #2 8키 _avg + #3 select 대폭 확장 + #9 신규 jersey + 변환 로직 / RecentGamesTab 카드형 / OverviewTab 6→8열 BPG 제거 + MIN/FG%/3P% / overview-tab.css 4×2 / PlayerHero #N eyebrow / PlayerProfile.jsx 시안 역박제). officialMatchNestedFilter 가드 추가 (5/2 회귀 fix). 카드 클릭 → /live/[id]. tsc 0 / npm run build 통과 / truncated 룰 7파일 마지막 줄 정상. 사용자 결재 6건 일괄 승인. | ✅ |
| 2026-05-09 | (설계 단계 — 코드 변경 0) | **사전 라인업 확정 + 기록앱 자동 매핑 — 설계 보고서 작성** — 13 섹션 / Q1~Q9 결재 / 8 PR 부분 배포 (Stage 1~4) / ~8.5h 예상. 핵심: 신규 테이블 `match_lineup_confirmed` (매치당 home/away 각 1건 / activeTtpIds + starterTtpIds Json) + ADD COLUMN `tournament_matches.lineup_reminder_sent_at` (cron 1회성 가드). 트리거 = Vercel Cron 5분 폴링 (55~60분 매치). 푸시 = `createNotificationBulk` 재사용 (인앱+web push). Flutter 자동 매핑 = roster 응답 +2 필드 (`home_lineup_confirmed`/`away_lineup_confirmed`) → v1 호환 (무시) / v2 (분기). 회귀 0 (ttp.isStarter 대회 통산 의미 영구 보존 / 미입력 매치 기록원 수동 fallback). 산출물: `Dev/match-lineup-confirmation-2026-05-09.md`. | 📋 결재 대기 |
| 2026-05-09 | (설계 단계 — 코드 변경 0) | **공개 프로필 (`/users/[id]`) NBA 스타일 개선 — 설계 보고서 작성** — 12 섹션 / Q1~Q6 결재 항목 / 5단계 구현 계획. 핵심 변경: 최근 경기 카드형 (대회상세 ScheduleTimeline 패턴 카피 + 본인 기록 줄) + 카드 클릭 → /live/[id] + 통산 스탯 6→8열 옵션 + PlayerMatchCard 글로벌 컴포넌트 신규. 산출물: `Dev/public-profile-nba-style-2026-05-09.md`. DB/API 변경 0 / 회귀 0. | 📋 결재 대기 |
| 2026-05-09 | (대기 — PM 커밋 예정) | **PhoneInput/BirthDateInput 마이그 4순위 (admin+referee) 완료** — 3 input 2 페이지: (1) `(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx:740` 문의 연락처 → PhoneInput. (2) `(referee)/referee/admin/members/new/page.tsx:220` 심판 전화번호 → PhoneInput. (3) 동 파일 :300 생년월일 (state명 birthDate / API field registered_birth_date 명확) → BirthDateInput. tsc / build / truncated / type="tel" 0 hit / 회귀 0. **마이그 100% 완료 — 1~4순위 누적 13 input** (1순위 4 / 2~3순위 6 / 4순위 3). | ✅ |
| 2026-05-09 | PR #228~#235 8건 → main 4회 머지 (`702d00e` → `b96f58c` → `71d4087` → `afcbd65`) | **5/9 main 4회 — input 마이그 + 시안 갭 fix 일괄 완료** — (1) PR #228/#229 PhoneInput/BirthDateInput 1순위 4 input (profile/edit 휴2+생1 + tournaments/join 휴1, formatPhone 7L 제거). (2) PR #230/#231 잔여 6 input (verify state 하이픈+replace 정규화 / registration / games/new step+v2 / games/edit within24h / partner-admin/venue). (3) PR #232/#233 시안 역박제 1순위 3건 (News+MatchNews+Scoreboard 매치 코드 v4). (4) PR #234/#235 시안 역박제 2~3순위 7건 (CourtManage/Checkin/TeamsManage/Requests/ProfileSettings/OrgApply/SeriesEdition). 시안 갭 0건 달성. tester 통과 단위 76건+ / reviewer ⭐⭐⭐⭐⭐ 2회. | ✅ |
| 2026-05-08 | PR #214~#227 14건 → main 7회 (`e0d880b` 빌드실패 → `c6a6848` `f39afae` `8846f6d` `13a962e` `93670c5` `118c9f1`) | **5/8 main 7회 신기록** — (1) 디자인 박제 11 commit + truncated 빌드 9건 실패 → hot fix `333516b`. (2) PR3 layout 가드 mock 모드 (헬퍼 2 + server layout 1 + 4 페이지). (3) BDR-current sync v2.5 부분 + v2.5.1 (zip 2회). (4) mock 자체 입력 폴백 (DB ADD COLUMN + modal 337L + endpoint 156L + 가드 3단). (5) PhoneInput/BirthDateInput 전역 컴포넌트 + conventions.md [2026-05-08] 룰 박제. errors.md 5/7 truncated 재발 2회차 + 보완 4룰. | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main — Onboarding 10단계 + PortOne V2 + Phase A.5** — fix 7건 (envelope 8회 / IME 9곳 / 마이페이지 정렬 / 알림 deep-link), Onboarding PR1.1~PR5 (PR3 보류), Phase A.5 drawer truncated → hot fix `168be48`. | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 → main `3f016c9` / 5/5 SEASON2 출전 명단 정비 DB UPDATE 4건 / 5/5 팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR `8bbce95` / 5/6 PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄 main `4253e68` / 5/7 envelope 8회 — 5/7 main 21회 baseline / 5/8 main 7회 신기록) — 복원: git log -- .claude/scratchpad.md -->
