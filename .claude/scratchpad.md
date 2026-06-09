# 작업 스크래치패드

## 현재 작업
- **요청**: 대회 상세(진행 중·6팀 조별리그) 재구성 시안 운영 박제 (의뢰서 `tournament-detail-redesign-bake-cli-prompt-2026-06-09.md`)
- **상태**: 🔵 진행 중 — 기획설계 완료 → developer 박제 대기 (실데이터 이미 와이어됨 = 시각 리스킨)
- **현재 담당**: planner-architect
- **핵심 제약**: ① 강조색 `var(--cafe-blue)` (#0F5FCC, 빨강❌ §3 함정) ② `status==='completed'` 분기(L287~401) 보존 ③ API·Prisma·탭화이트리스트 0 변경 UI만 ④ Tweaks패널·심판버튼 제거 ⑤ 승자점수만 `var(--bdr-red)`

## §2 사전 점검 결과 (2026-06-10)
| 항목 | 결과 |
|------|------|
| 브랜치/트리 | subin / src 변경0(문서만) → 무충돌 |
| dev 최신화 | subin..dev=0커밋 → 머지 불필요 |
| 시안 zip | BDR-v2-9-대회상세-redesign-2026-06-09.zip 존재 |
| 종료 분기 | L287 `status==='completed'`→L401 return (UB1 보존) |
| 진행중 뷰 | L712 return / L749 Hero / L814 Tabs / L876 aside / L887 OperatorPreview / L889 Sidebar / L909 BracketPrediction |
| 불변요소 | ALLOWED_TABS(L111)/isTournamentInsider/GnbaRules/SeriesCard 존재 |

## 기획설계 (planner-architect)

🎯 목표: 대회 상세 "진행 중 뷰"(L712~)를 시안 td-redesign 레이아웃으로 **시각 리스킨**. 데이터/API/탭/가드 0변경, 강조색=cafe-blue.

### ⭐ 핵심 발견 (developer 필독)
**운영 page는 이미 시안의 모든 정보구조를 실데이터로 렌더 중이다.** 이 작업은 **데이터 재구축이 아니라 CSS/마크업 리스킨**이다.
| 시안 영역 | 운영에 이미 존재? | 위치 |
|----------|------------------|------|
| 매치 카드(로고·실점수·승자색·종료배지) | ✅ 완성 | `schedule-timeline.tsx` (public-schedule API 와이어) |
| 팀별 필터칩 | ✅ 완성 | `schedule-timeline.tsx` L444~ |
| stat strip(참가팀·완료·진행중·라운드·상금) | ✅ 완성 | `v2-bracket-status-bar` (wrapper L322 / prizeMoney=null 이미 처리) |
| 조별 A/B조 순위표 | ✅ 완성 | `GroupStandings` (wrapper L383, groupTeams 와이어) |
| 다크 팀카드 | ✅ 완성 | `TeamsTabContent`+`TeamCardV2` (public-teams API) |
| 운영자 전환/상태카드/우승예측 | ✅ 완성 | OperatorPreview / V2RegistrationSidebar / V2BracketPrediction |
→ **시안 jsx의 mock(TEAMS/MATCHES/GROUPS)은 박제 금지.** 이미 와이어된 실데이터를 새 스킨으로 감싸기만 한다.

### 📍 만들/수정 위치
| 파일 | 역할 | 신규/수정 |
|------|------|----------|
| `tournament-detail.css` | tdr-* 스타일 토큰화 병합 (cafe-blue 치환) | 수정(append) |
| `tournament-tabs.tsx` | 탭 nav를 pill 탭(.tdr-pilltabs 스킨)으로 + 활성=cafe-blue | 수정 |
| `v2-tournament-hero.tsx` | 그라데이션 compact 톤 (선택적 — 의뢰서 §4 "스타일 갱신") | 수정(경미) |
| `page.tsx` L838~865 | "심판 배정 요청" 버튼 블록(L851~864) 제거 | 수정(제거) |
| schedule-timeline / v2-bracket-status-bar / GroupStandings / TeamCardV2 | 카드/순위표/칩 시각만 tdr 스킨 근접 | 수정(시각 미세) |

> **추천: 최소 침습안.** 데이터 컴포넌트 내부 마크업은 손대지 말고, **래퍼 컨테이너 클래스 + tournament-detail.css 추가 규칙**으로 시각을 시안에 근접시킨다. 매치카드/순위표 내부 JSX 대수술 = 회귀 위험↑ + LOC↑. 1차는 탭(pill)+강조색+Hero compact+심판버튼제거에 집중하고, 카드 디테일(점수 폰트·종료배지 톤)은 CSS만으로 맞춘다.

### 🎨 강조색 가드 체크리스트 (★★ §3 함정)
| 위치 | 색 | 비고 |
|------|-----|------|
| pill 탭 활성(.on) | `var(--cafe-blue)` | tournament-tabs 활성 배경/텍스트 |
| 팀별 필터칩 활성 | `var(--cafe-blue)` | 시안 .tdr-chip.on / 운영 schedule-timeline 필터칩 활성색을 primary→cafe-blue로 |
| 진행방식 step 번호 동그라미(.tdr-fmt__n) | `var(--cafe-blue)` | overview pane (신규 마크업 시) |
| stat strip 강조 hl | `var(--cafe-blue)` | 순위표 "승" 컬럼 헤더 등 |
| **승자 점수(매치카드 win)** | `var(--bdr-red)` | ⚠️유일한 의도적 빨강. schedule-timeline은 현재 승자=`--color-primary`(=bdr-red) 이미 일치 |
| Hero 그라데이션 | navy/dark hsl 톤 | 강조색 아님 — primary_color 폴백 유지 |
| 사이드바 CTA(btn--primary) | `var(--cafe-blue)` | globals.css L283 이미 cafe-blue |
**금지**: `#0F5FCC` 하드코딩 / `--accent`(=빨강) / `--cta` 신토큰 신설. 시안 css의 `var(--cta)` → 박제 시 전부 `var(--cafe-blue)`로 치환.

### 🔗 tdr-* → tournament-detail.css 병합/토큰화 계획
시안 td-redesign.css의 토큰 매핑(시안=운영):
| 시안 토큰 | 운영 토큰 |
|----------|----------|
| `var(--cta)` | `var(--cafe-blue)` ⭐ |
| `var(--accent)`(빨강 강조) | `var(--cafe-blue)` (단, 매치 win 점수만 `--bdr-red`) |
| `--r-sm/-md/-lg` | `var(--radius-chip)` / `var(--radius-card)` |
| `--r-xs` | `4px` |
| `--bg-elev/--border/--ink*` | 그대로 (운영 globals에 동일 존재) |
| `--cafe-blue-deep`(diff.pos) | 그대로 |
→ tdr-* 클래스를 통째 복붙하지 말고 **필요한 규칙만** tournament-detail.css에 append. 핵심 = `.tdr-pilltabs/.tdr-pill(.on)` + (선택) overview pane 스타일. 매치카드/순위표/팀카드는 운영 기존 클래스 유지.

### 🔌 실데이터 와이어링 (mock → 운영 변수)
| 시안 mock | 운영 실데이터 source |
|----------|---------------------|
| MATCHES sa/sb/win | schedule-timeline `match.homeScore/awayScore` + homeWins/awayWins (public-schedule) — **이미 와이어** |
| `종료` 배지 | StatusBadge status==='completed' — **이미 와이어** |
| GROUPS rows(rank/w/l/diff) | GroupStandings `groupTeams` (public-bracket) — **이미 와이어** |
| STATS(참가팀/완료/진행중/라운드) | V2BracketStatusBar props — **이미 와이어** |
| STATS **우승상금** | 운영 미존재 → `prizeMoney={null}` 이미 처리 (카드 hide/"-" 표기 유지). **신규 필드 금지** |
| 팀카드 "창단 2026" | TeamCardV2 `created_at` (public-teams) — **이미 와이어** |
| 사이드바 참가비/접수/정원 | V2RegistrationSidebar props — **이미 와이어** |
| Hero edition/venue/teams | V2TournamentHero props — **이미 와이어** |

### 📋 실행 계획 (developer 단계별)
| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | `page.tsx` 심판배정요청 버튼(L851~864) + isInsider 단독사용 정리 — isInsider는 OperatorPreview에 여전히 쓰이므로 변수 유지, 버튼 JSX만 제거 | developer | 없음 |
| 2 | `tournament-detail.css`에 `.tdr-pilltabs/.tdr-pill` 토큰화 규칙 append (cta→cafe-blue) | developer | 없음 |
| 3 | `tournament-tabs.tsx` 탭 nav를 pill 스킨 적용 (활성=cafe-blue / 비활성 ink-mute) | developer | 2 |
| 4 | `v2-tournament-hero.tsx` compact 톤 미세조정 (padding↓ — 의뢰서 §4, 과수술 금지) | developer | 없음 |
| 5 | schedule 필터칩 활성색 primary→cafe-blue 치환 (승자점수는 bdr-red 유지 확인) | developer | 2 |
| 6 | tsc --noEmit + lint + 로컬 3001 진행중1·종료1 육안 (강조 오박0) | tester | 1~5 |
| 7 | BDR-current 역박제(TournamentDetail.jsx/css) — 별 commit | developer | 6 |

⚠️ developer 주의사항:
- **종료 분기(L287~449) 절대 무변경** — 진행중 뷰(L712~)만.
- ALLOWED_TABS(L111) / public-* API / Prisma select / generateMetadata / isTournamentInsider 0변경.
- `isInsider` 변수 자체는 비공개 가드(L223)+OperatorPreview(L887)에서 계속 사용 → **변수 삭제 금지**, 심판버튼 JSX(L851~864)만 제거.
- mock 박제 0. tdr-* 통째 복붙 금지 — 필요한 규칙만.
- `#0F5FCC` 하드코딩 금지 / pill 9999px 금지(정사각 원형만 50%).
- AppNav(shared.jsx) 재구성 0 (frozen).

### 🚨 회귀 위험 + Stop Condition
| 위험 | 가드 |
|------|------|
| 매치카드 내부 JSX 대수술 → 점수/팀링크/필터 회귀 | 1차는 CSS만, 내부 마크업 보존 |
| 필터칩 색 치환 시 종별필터(getDivisionColorVar) 오염 | 종별색은 그대로, 팀필터 active만 cafe-blue |
| 심판버튼 제거 시 isInsider 미사용 lint warn | 변수 유지 (OperatorPreview에서 사용) |
**Stop Condition 점검**: LOC>+2000 ❌(리스킨이라 ~+200 예상) / status분기 ❌(무변경) / 탭화이트리스트 ❌(무변경) → **모두 미해당. 진행 가능.**

### ✅ planner 2차 검증 보강 (전 파일 통독 후 확정)
1. **cafe-blue 다크 자동 대응 확인** — globals.css: 라이트 `--cafe-blue:#0F5FCC`(L96) / 다크 `#3B82F6`(L150). 토큰만 쓰면 다크 자동 전환. **하드코딩 시 다크 깨짐** → 반드시 `var(--cafe-blue)`.
2. **빨강 의미색 보존 목록(치환 ❌)** — 혼동 방지: ⓐ schedule-timeline 완료매치 승자 점수=`--color-primary`(=bdr-red, 이미 일치 → 그대로) ⓑ StatusBadge LIVE=`--color-status-live`(빨강) ⓒ v2-bracket-status-bar 진행중 highlight=`--color-error`(빨강) ⓓ globals btn--primary 다크=bdr-red(L305). → 이 4개는 강조색 치환 대상 아님. **cafe-blue로 바꿀 건 "탭 활성·팀필터 활성칩·조별 승컬럼/세로막대·prediction %바·hero 폴백 그라데이션" 뿐.**
3. **schedule-timeline 팀필터 vs 종별필터 색 분리** — 팀필터 active(L451·465·417·431) = primary → cafe-blue 치환 OK / 종별필터(L324~362 getDivisionColorVar) = 6종별 분류색 = **치환 ❌**(별개 의미체계).
4. **TeamCardV2(/teams 공유) 변경 ❌** — 시안 "다크 팀카드"가 운영과 톤 다르면 본 작업 범위 밖. 시각 차이 크면 PM 확인 후 별도 PR (회귀 위험).
5. **CSS 주석 `*/` 함정(errors.md 60)** — tournament-detail.css append 시 `--ink*`/`--ff-mono` 같은 `*/` 인접 주석 금지(Turbopack 빌드 실패). 머지 전 Vercel preview 빌드 확인 권장.
6. **결론**: 기존 설계(최소 침습 리스킨) 그대로 진행 권장. 실데이터 와이어 0 변경 / 강조색 5지점 치환 + pill탭 + 심판버튼 제거 + hero compact = 예상 +150~250 LOC. developer 착수 가능.

## 구현 기록 (developer)

📝 구현한 기능: 대회 상세 "진행 중 뷰" td-redesign 시각 리스킨 (pill 탭 + cafe-blue 강조 + 심판버튼 제거 + Hero compact). 데이터/API/탭/가드 0변경 = CSS·마크업만.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `…/[id]/page.tsx` | 심판배정요청 버튼 JSX(L851~864) 제거. isInsider 변수 유지 | 수정 |
| `…/_components/tournament-detail.css` | `.td-pilltabs/.td-pill(.on)` pill 탭 규칙 토큰화 append (cta→cafe-blue) | 수정(append) |
| `…/_components/tournament-tabs.tsx` | 탭 nav를 .td-pilltabs/.td-pill 스킨 적용. 활성=.on(cafe-blue). 탭 로직 0변경 | 수정 |
| `…/_components/v2-tournament-hero.tsx` | compact 톤 미세조정(grad 135→155deg / padding·marginBottom↓). props·데이터 0변경 | 수정 |
| `…/_components/schedule-timeline.tsx` | 팀필터칩(전체+팀버튼, L451·453·465·467) 활성색 primary→cafe-blue | 수정 |
| `BDR-current/screens/tournament-detail.css` | 역박제: 밑줄형 td-tab → pill + 활성 cafe-blue | 수정 |
| `BDR-current/screens/TournamentDetail.jsx` | 역박제: TabBar 주석(pill 리스킨 표기) | 수정 |

총계: 7 files / +101 / -53 (git diff --stat 실측). tsc --noEmit = **0** (1~3단계 후 0 / 4~5단계 후 0 / 최종 0). CSS `*/` 조기종료 함정 = 0건. 임시 zip 폴더 정리 완료.

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-06-10 | 잔여 강조색 2파일 cafe-blue 치환 (5지점) | group-standings.tsx, v2-bracket-prediction.tsx | PM 요청: 조별순위표·우승예측 강조색이 빨강(--color-primary)으로 남아 §3 cafe-blue 통일 미완 → 마저 치환 |

📌 1차 수정 상세 (강조색 잔여 치환 — 이번 세션):
| 파일 경로 | 변경 라인 | 변경 내용 | 신규/수정 |
|----------|----------|----------|----------|
| `…/bracket/_components/group-standings.tsx` | L93 세로막대 / L138 "승" 헤더 / L148 승점 헤더(강남구) / L249 승점 셀 | `var(--color-primary)`(빨강) → `var(--cafe-blue)` 4지점 | 수정 |
| `…/_components/v2-bracket-prediction.tsx` | L66 % 바 폴백색 | `p.color ?? "var(--color-primary)"` → `?? "var(--cafe-blue)"` | 수정 |

→ **src 코드 전체 변경 파일 = 7개** (이전 세션 5: page.tsx / tournament-detail.css / tournament-tabs.tsx / v2-tournament-hero.tsx / schedule-timeline.tsx + 이번 2: group-standings.tsx / v2-bracket-prediction.tsx). (BDR-current 역박제 2파일은 시안 동기화 분으로 별도)

전체 7파일 강조색 통일 후 상태 (cafe-blue 치환 vs 빨강 보존):
| 파일 | cafe-blue 치환 지점 | 빨강 보존(치환❌) |
|------|--------------------|------------------|
| tournament-tabs.tsx | pill 탭 활성(.on) | — |
| tournament-detail.css | .td-pill 활성 | — |
| v2-tournament-hero.tsx | (compact 톤만, 강조색 무관) | hero 폴백 그라데이션(navy/dark) |
| schedule-timeline.tsx | 팀필터칩 활성 | 승자점수(--color-primary)·종별필터(getDivisionColorVar)·날짜칩 |
| **group-standings.tsx** | **세로막대·"승"헤더·승점헤더·승점셀** | — |
| **v2-bracket-prediction.tsx** | **% 바 폴백색** | p.color 명시값(팀 고유색) |
| page.tsx | (심판버튼 제거만) | LIVE/진행중 stat(타 컴포넌트) |

💡 tester 추가 참고 (이번 2파일):
- **조별리그 순위표**: 제목 옆 세로막대·"승"컬럼 헤더 글씨 = **cafe-blue**(빨강❌). 강남구협회장배 대회는 "승점" 헤더·승점 숫자도 cafe-blue.
- **우승 예측(BracketPrediction)**: % 진행바에서 팀 고유색(p.color)이 없을 때 폴백색이 **cafe-blue**(빨강❌). p.color가 지정된 경우는 그 색 그대로(무영향).
- **데이터/로직 0변경** — 색 토큰 문자열만 교체. 순위 계산·승점·% 수치 동일.
- **lint**: `tsc --noEmit`=0 통과 / `npm run lint`은 프로젝트 ESLint 미구성(루트 config 부재 + Next15 cwd 오인)으로 본 변경 이전부터 실행 불가 = 색 토큰 치환과 무관. PM 판단 요청.

💡 tester 참고:
- **테스트 절차**: 로컬 3001 → 진행중 대회(예: 제10회 BDR YOUNGMAN GAME) 상세 진입.
  1. 탭 5개가 **pill 그룹**으로 표시 + 활성 탭이 **cafe-blue 배경+흰 글씨**인지.
  2. 경기일정 탭 → 팀별 필터칩 클릭 시 활성칩이 **cafe-blue**인지(빨강❌).
  3. 매치카드 **승자 점수는 빨강(bdr-red) 유지**인지(필터칩 치환에 휩쓸리지 않음). 날짜칩·종별필터색도 그대로.
  4. 진행중 뷰 하단 **심판 배정 요청 버튼 미노출**(운영자 계정으로도). "다른 대회 보기"만.
  5. Hero가 약간 compact(여백↓)한지.
  6. 모바일(≤720px) pill 탭 가로 스크롤 정상인지.
- **정상**: 활성 pill·팀필터칩 = cafe-blue / 승자점수·LIVE 배지 = 빨강 / 심판버튼 0 / 종료 대회 상세(별건)는 변경 없음.
- **주의 입력**: ① 운영자(isInsider) 로그인 → 사이드바 OperatorPreview는 **여전히 노출**돼야 함. ② 종료 대회(status=completed) 상세 → page.tsx L287~ 분기 무변경이므로 시각 동일.

⚠️ reviewer 참고:
- 강조색 가드: detail 진행중뷰 변경 파일에 `#0F5FCC` 하드코딩 0 / `--accent`(빨강) 0 / `--cta` 신토큰 0 → 전부 `var(--cafe-blue)`. (grep 잡힌 join·referee-request의 #0F5FCC는 작업대상 외 기존 파일, 무변경)
- planner §2 보존목록 준수: 승자점수(--color-primary 유지)·종별필터(getDivisionColorVar)·LIVE 배지 무변경. 팀필터칩만 분리 치환.
- isInsider lint 우려 없음 — page.tsx L221/225 가드 + L871 OperatorPreview에서 계속 사용.
- Stop Condition 전부 미해당(LOC +101<2000 / status분기·탭화이트리스트 무변경 / mock 0 / api·schema 0).

## 테스트 결과 (tester)

### 정적 검증 (2026-06-10)
| 테스트 항목 | 결과 | 근거 |
|-----------|------|------|
| ① tsc --noEmit | ✅ 통과 | EXIT=0 (오류 0) |
| ② lint (next lint) | ⚠️ 실행불가 | 환경: cwd 경로 공백("0. Programing")으로 next CLI가 "...\lint" 잘못파싱 / eslint v9 flat config 부재로 직접실행도 불가. **대체검증**: isInsider 미사용 warn 우려는 grep 무효확인(④e) + diff에 신규 import·변수 0 = 새 warn 발생패턴 없음 |
| ③ #0F5FCC 하드코딩 0 | ✅ 통과 | 변경 5개 src 파일 diff에 0 (grep 잡힌 join·referee-request의 #0F5FCC는 작업대상 외 기존파일·무변경) |
| ③ --cta 신토큰 0 | ✅ 통과 | tournament-detail.css의 `--cta` 언급은 주석 매핑설명뿐, 실제 토큰 신설 0 |
| ③ --accent(빨강강조) 0 | ✅ 통과 | 변경 5파일 diff에 `var(--accent)` 신규사용 0 |
| ③ 탭활성·필터칩활성 = cafe-blue | ✅ 통과 | `.td-pill.on{background:var(--cafe-blue)}` / schedule 팀필터칩 `--color-primary`→`var(--cafe-blue)` 치환. globals.css 라이트/다크 토큰 정의 → 다크 자동대응 |
| ③ 승자점수 = bdr-red 체인 유지 | ✅ 통과 | schedule-timeline 승자점수 `--color-primary`(=bdr-red) 그대로, 팀필터칩만 분리치환(주석명시) |
| ④a status==='completed' 무변경 | ✅ 통과 | page.tsx L287 무변경 (diff 변경구간=L835~864 심판버튼뿐) |
| ④b ALLOWED_TABS 무변경 | ✅ 통과 | L111 무변경 |
| ④c isTournamentInsider 가드 무변경 | ✅ 통과 | L221/225 무변경 |
| ④d 심판배정요청 버튼 JSX 완전제거 | ✅ 통과 | `<Link href=".../referee-request">` 블록 완전삭제. 잔존 "심판"=L838~840 제거설명 주석뿐(정상) |
| ④e isInsider 변수 여전히 사용 | ✅ 통과 | L218 선언 → L221/225 가드 + L871 `{isInsider && <OperatorPreview/>}` 사용 = 미사용 아님 |
| BDR-current 역박제 정합 | ✅ 통과 | jsx 주석 + css 밑줄형→pill+cafe-blue 활성, 운영 src .td-pill.on 과 1:1 정합 |

📊 종합: 12/12 통과 (tsc0 / 강조색 가드 전항 / 회귀 5항 / 역박제) — lint만 환경제약 실행불가(대체검증 완료)

### 로컬 3001 육안 — 미실행 (PM 안내)
- 3001 포트 LISTEN 없음(`netstat :3001`=NO_3001_LISTENER) = dev 서버 미가동. 의뢰 지침대로 **tester가 새로 띄우지 않음**.
- 정적검증 12/12 통과로 박제 자체 안전. **육안 확인 권장**(PM이 3001 띄운 뒤): ⓐ진행중 상세 pill탭 활성 cafe-blue / ⓑ팀필터칩 활성 cafe-blue(빨강❌) / ⓒ승자점수 빨강유지 / ⓓ심판버튼 미노출(운영자 포함) / ⓔHero compact / ⓕ종료 대회 상세=기존동일.

## 리뷰 결과 (reviewer)

📊 종합 판정: **통과 (머지 가능)** — critical 0 / major 0 / minor 1

✅ 잘된 점:
- **강조색 가드(§3 ★★) 완벽 준수** — 변경 5파일(src) 전체 `#0F5FCC` 하드코딩 0 / `--cta` 신토큰 0 / `--accent`(빨강) 신규사용 0. pill탭·팀필터칩 강조 = 전부 `var(--cafe-blue)`. grep에 잡힌 `--accent`/`--bdr-red`는 기존 무변경 코드(L83~144)·설명주석뿐.
- **빨강 의미색 4종 보존 정확** — schedule-timeline에서 팀필터칩(L453·455·467·469)만 cafe-blue 치환, 날짜칩(--color-primary)·종별필터(getDivisionColorVar)·승자점수(L697·704·713 --color-primary=bdr-red)는 무변경. planner §2 보존목록 1:1 일치.
- **토큰 다크 자동대응** — cafe-blue/cafe-blue-deep globals.css 라이트(L96·97)+다크(L150·151) 양쪽 실존 → 다크 깨짐 없음.
- **불변 보존(§5)** — page.tsx diff 범위 L835~864(액션블록)만, status==='completed'(L287) 분기·Prisma·ALLOWED_TABS·generateMetadata·isTournamentInsider 무변경. tournament-tabs는 className/마크업만 교체(handleTabChange/?tab=/lazy 로직 0변경).
- **isInsider 변수 유지 적절** — L218·221·225 가드 + L871 OperatorPreview에서 계속 사용 → lint warning 우려 없음. 심판버튼 JSX만 제거. referee-request 죽은 링크 0(라우트 페이지는 직접접근 보존).
- **CSS append 토큰화 + `*/` 함정 회피** — 신규 .td-pilltabs/.td-pill 영역 `*/[^ ]` 0건(Turbopack 빌드 안전). radius-card(4px톤) 사용·9999px pill 0.
- **mock 박제 0 / API·Prisma·schema·/api/v1 0변경** — 시각 리스킨만. BDR-current 역박제(td-tab→pill, cafe-blue) 정합.
- tsc --noEmit = **0** (reviewer 직접 실행 확인).

🔴 필수 수정:
- 없음.

🟡 권장 수정(minor, 머지 차단 아님):
- [v2-tournament-hero.tsx:169 / tournament-detail.css:93] 그라데이션 끝색 `#0B0D10`·pill 활성 텍스트 `#fff` 하드코딩. 단 `#0B0D10`은 **기존 코드에 이미 있던 값**(각도 135→155deg만 변경, 색 무변경)이고 `#fff`는 기존 .is-on 패턴과 동일 관행이라 본 작업 신규 도입 아님. 디자인 토큰 엄격화 시 후속 정리 후보(이번 PR 범위 밖, 회귀 위험 없음).

⚠️ 머지 전 권장(리스킨 특성): tsc·코드검토는 PASS. 시각 회귀(빨강 오박0/종료뷰 무변경/모바일 pill 스크롤)는 코드상 안전 확인됐으나 로컬 3001 육안 1회(tester 6단계) 권장.

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 완료 Phase (이력 압축)
- ✅ PR-MYBDR-SOCIAL (모바일 OAuth /api/v1/auth/kakao·google, `72eb2df` push + PR #663 빌드pass·머지대기) — upsertOAuthUser 공용추출/웹콜백3종무수정/google aud+iss검증/proxy PUBLIC등록(tester버그fix)/tsc0
- ✅ Phase 8C (8C-1~8C-8, Court Operator hub 8시안 박제) — VP1~3·VU1~4·VA1, badge분리(Court=navy+silver / Site=dark+gold), mock 0
- ✅ Phase 1~7 = 54 시안 박제 (1~6 운영반영 / 7 머지대기)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-10 | **대회상세 강조색 잔여2파일 cafe-blue 치환** (developer) | ✅ group-standings(세로막대L93·승헤더L138·승점헤더L148·승점셀L249)+v2-bracket-prediction(%바폴백L66) `--color-primary`→`var(--cafe-blue)` 5지점. 데이터/로직0변경 색토큰만. 승자점수·LIVE·진행중stat·종별필터 보존. **src 전체 7파일(이전5+이번2)**. tsc0 / npm lint은 프로젝트 ESLint미구성으로 실행불가(기존상태·치환무관) PM판단요청. 미커밋 |
| 2026-06-10 | **대회상세 td-redesign 리스킨 검증** (tester) | ✅ 정적 12/12 통과. tsc0 / 강조색가드(변경5파일 #0F5FCC·--cta·--accent 0, 탭·팀필터칩=cafe-blue, 승자점수 bdr-red유지) / 회귀5항(status분기·ALLOWED_TABS·isTournamentInsider·심판버튼완전제거·isInsider유지) / BDR-current역박제정합. lint만 환경제약(cwd공백+eslint v9 flat없음)으로 실행불가→isInsider미사용warn은 grep+diff로 대체확인. 3001 미가동→육안은 PM안내(tester가 안띄움) |
| 2026-06-10 | **대회상세 td-redesign 리스킨 리뷰** (reviewer) | ✅ 통과(머지가능) critical0/major0/minor1. 강조색가드§3 완벽(cafe-blue / #0F5FCC·--cta·--accent 0) / 빨강의미색4종 보존(팀필터칩만 치환·승자점수·종별·날짜칩 무변경) / status분기·API·schema·isInsider 0변경 / referee버튼만제거(죽은링크0) / CSS `*/`함정0 / tsc0 직접확인. minor=hero #0B0D10(기존값)·#fff(기존관행) 토큰엄격화 후속후보 |
| 2026-06-10 | **대회상세 td-redesign 리스킨 박제** (developer) | ✅ 7파일 +101/-53 / tsc0 / 1~5단계+7역박제. pill탭(td-pilltabs/td-pill 활성=cafe-blue) + 팀필터칩 cafe-blue + 심판버튼제거(isInsider유지) + Hero compact(155deg/padding↓) + BDR-current 역박제(td-tab→pill). 승자점수bdr-red·종별필터·LIVE 무변경. #0F5FCC하드코딩0·mock0·api0. tester대기(6단계 PM) |
| 2026-06-10 | **대회상세 재구성 박제설계** (planner) | ✅ 시안8파일+운영7컴포넌트 통독 → **핵심발견=운영이 이미 시안 전 정보구조를 실데이터 와이어중(schedule-timeline/v2-bracket-wrapper/TeamsTab) = 데이터재구축X 시각리스킨O**. 강조색가드표(cafe-blue vs 승자bdr-red)·tdr→detail.css토큰화·7단계계획·심판버튼제거(isInsider변수유지) 기록. LOC~+200 Stop미해당 |
| 2026-06-10 | **대회상세 재구성 기획설계** (planner) | ✅ 시안8파일+운영page923줄+_components33개 통독 → 본질=재구성아닌 강조색 cafe-blue통일+최소침습리스킨(운영이미 실데이터 와이어완료) / 5지점 강조색치환+pill탭+심판버튼제거+hero compact / 보존목록·빨강의미색4종·다크토큰·TeamCardV2금지 확정 → developer 위임 |
| 2026-06-10 | **대회상세 재구성 박제** §2 점검 (pm) | ✅ subin/트리클린(문서만)/dev=0커밋 머지불필요/zip존재/종료분기 L287~401·진행중뷰 L712~909 확인 → planner 위임 |
| 2026-06-09 | 제10회 BDR YOUNGMAN GAME 4강·결승 일정 생성 | ✅ 조기반 크로스대진 수동INSERT3(SF1·SF2·결승)/결승 next_match_id연결/errors.md기록 |
| 2026-06-08 | 종료 대회 상세 열람 복원 시안 의뢰서 작성 | ✅ 원인=UB1(5/28)종료화면 early return(디자인의도) / restore 의뢰서 작성 |
| 2026-06-08 | 대회 종료 오표시 수정 (제10회 BDR YOUNGMAN GAME) | ✅ DB status completed오염 → in_progress UPDATE(승인+사전후검증)/코드0 |
| 2026-06-08 | PR-MYBDR-SOCIAL proxy.ts 재검증 (tester) | ✅ PASS 4/4 — kakao/google {}→422 / 무효토큰→401 / tsc0 |
| 2026-06-08 | PR-MYBDR-SOCIAL 모바일 OAuth 신설 | ✅ upsert공용추출/웹콜백무수정/aud+iss검증/탈퇴403/tsc0 |
| 2026-06-07 | 8C-8 VU3 CourtBooking → /booking+payment-fail+checkin | ✅ 정보성톤4/토스흐름0/가짜위젯미박제/tsc0 |
| 2026-06-07 | 8C-7 VU2 CourtDetail → /courts/[id] | ✅ 평점헤더1/데이터·액션0/var(--*)만/tsc0 |
| 2026-06-07 | 8C-6 VA1 AdminCourtsPartners → /admin/courts+partners | ✅ 2라우트보존/SiteOperatorBadge공용/hero stat4/tsc0 |
| 2026-06-07 | 8C-4 VP3 PartnerCampaigns → /partner-admin/campaigns | ✅ 인라인폼유지/VP3톤4/mock회피/tsc0 |
