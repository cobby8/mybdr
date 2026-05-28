# 클로드 디자인 의뢰 — 라이브 경기 페이지 완성 (v2.17)

> **의뢰일**: 2026-05-20
> **수신**: 클로드 디자인 (Claude.ai Project — bdr 디자인 시스템 관리)
> **대상 시안**: `Dev/design/BDR-current/screens/Live.jsx` (현재 데모 수준 — 운영의 절반 미만) + `LiveResult.jsx` (회귀 픽스 적용 완료)
> **이번 의뢰**: 운영 `/live/[id]` 의 풀스택 기능을 시안에 모두 반영해서 v2.17 라이브 페이지로 완성
> **선행 박제**: v2.16 = 경기 탭 list/detail/create

---

## 0. 진입 — 표준 절차

**Step 1**: `Dev/design/claude-project-knowledge/00-master-guide.md` 읽기 (13 룰 인지)
**Step 2**: 본 의뢰 영향 보조 파일 — 01 / 02 / 03 / 04 / 06
**Step 3**: 첫 응답 (표준 형식):

```
✅ BDR 디자인 의뢰 확인 — 라이브 경기 페이지 완성 (v2.17)
이해: 현재 Live.jsx (player + 채팅 + 스탯바 데모) → 운영 풀스택 (Hero / PBP / 박스스코어 / 쿼터 / YouTube / 운영자 UI / period_format) 박제 가능 시안으로 확장.
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피.
자체 검수: 06 §1~§6 전체 + 회귀 4 케이스.
PM 결정 필요: 채팅·좋아요·해설참여·시청자수 (DB 출처 검증).
작업 시작.
```

---

## 1. 컨텍스트

| 항목 | 값 |
|---|---|
| 대상 페이지 | `/live/[id]` (단일 경기 라이브 진행) + `/live/[id]` finished 분기 (LiveResult) |
| 박제 등급 변화 | C (시안 50% 미만) → A (시안 1:1 박제 가능) |
| 우선순위 | P0 (운영 기능 vs 시안 갭 매우 큼 — 박제 불가 상태) |
| 시급도 | 이번 주 |
| 시안 패턴 | v2.16 라이브 카드 패턴 (LIVE pulse / 종별 컬러 / Pretendard 900 점수) **+** 운영 풀스택 기능 |

### 1-1. 현 상태 — 운영 vs 시안 갭

운영 `src/app/live/[id]/page.tsx` (2662줄) 의 풀스택 기능 중 **시안 미반영 9건**:

| # | 운영 기능 | 시안 (현재) | 시안 (v2.17 필요) |
|---|---|---|---|
| 1 | HeroScoreboard (큰 스코어 + 팀 로고/이니셜 + status + 경기장명) | ❌ (스코어버그만 작음) | ✅ |
| 2 | 쿼터별 점수 테이블 (Q1~Q4 + OT + 진행 쿼터 강조) | ❌ | ✅ |
| 3 | 박스스코어 (선수별 스탯 + 쿼터 필터 + DNP 분리) | ❌ (팀 스탯 6개만) | ✅ |
| 4 | Play-by-Play 섹션 (한글 라벨 + 팀 칩 + 점수 누적) | ❌ | ✅ |
| 5 | YouTube 임베드 (16:9 + 모바일 sticky + PC PIP) | ❌ | ✅ |
| 6 | 같은 날/같은 대회 매치 카드 레일 (가로 스크롤) | △ ("다른 중계" 그리드 — 의미 다름) | ✅ (Rail 형태로 갱신) |
| 7 | 운영자 전용 UI 3개 (기록하기 / 임시 jersey 번호 / YouTube 등록) | ❌ | ✅ |
| 8 | 상태 분기 5종 (scheduled / warmup / live / halftime / finished) | △ (LIVE 만) | ✅ |
| 9 | period_format = "halves" 모드 (전반/후반/OT) | ❌ | ✅ |

→ 본 의뢰의 핵심 = 위 9건을 시안 v2.17 에 모두 반영.

### 1-2. 시안 보존 영역 (PM 결정 §6-1 — 시안 우선 카피)

현재 `Live.jsx` 에 있는 데모 요소 중 운영 미구현 — **PM 결정 필요**:

| # | 시안 요소 | 운영 상태 | 결정 필요 |
|---|---|---|---|
| A | 실시간 채팅 사이드바 (8명 메시지) | DB / API 0 | 시안 유지 or 영구 제거? |
| B | 좋아요 / 저장 / 공유 / 신고 액션 버튼 | DB 0 | 시안 유지 or 영구 제거? |
| C | "🎙 해설 참여 신청" 버튼 | DB 0 | 시안 유지 or 영구 제거? |
| D | 시청자 수 카운트 (`viewers: 1247`) | YouTube embed 있을 때만 측정 가능 | youtube_video_id 분기 표시? |

→ **본 의뢰 진행 전 PM (수빈) 결정 필요**. PM 결정 §13 (신규) 에 영구 보존.

---

## 2. 이번 의뢰의 핵심 — v2.17 라이브 디자인 언어

### 2-1. 핵심 요소 5가지

1. **풀폭 다크 Hero band** (운영 HeroScoreboard 시각 패턴 + v2.16 종별 컬러 언어 적용)
   - 양팀 로고(또는 이니셜 배지) + Pretendard 900 점수 (모바일 56px / PC 96px)
   - 중앙: status 라벨 ("Q3 · 5:24" / "하프타임" / "워밍업" / "FINAL")
   - 우상단: LIVE pulse 빨강 깜박 (`var(--accent)` + animation pulse 1.5s)
   - 하단: 경기장명 + 예정/시작 일시 + 매치 코드 (있으면)

2. **5단계 상태 분기 (모든 시안에 명시)**
   - `scheduled` — 예정 시간 큰 표시 + "곧 시작" 카운트다운 + YouTube 등록 CTA (운영자)
   - `warmup` — "워밍업 중" 상태 라벨 + 양팀 라인업 미리보기
   - `live` (in_progress) — Hero + 쿼터 점수 + PBP + 박스스코어 모두 활성
   - `halftime` — "하프타임" 라벨 + Q1·Q2 점수 강조 + 후반 시작 안내
   - `finished` / `completed` — LiveResult 로 전체 교체 (GameResult 활용)

3. **period_format 분기**
   - `quarters` (기본) — "Q1 / Q2 / Q3 / Q4 / OT1+"
   - `halves` (3x3 / 일부 대회) — "전반 / 후반 / OT1+"
   - Hero status / 쿼터 테이블 / PBP / 박스스코어 필터 4곳 모두 분기

4. **모바일 분기 720px (사용자 결정 §13)**
   - Hero: 2행 (팀A 1행 / 스코어 중앙 / 팀B 1행) — PC 5단 가로
   - YouTube: `sticky top-14` (헤더 아래 고정) — PC: viewport 안 일반 / 밖 PIP (우하단 320×180)
   - 쿼터 테이블 / 박스스코어 / PBP: 가로 스크롤 (`overflow-x-auto` + `#`/이름 sticky)
   - 운영자 버튼: PC 텍스트+아이콘 / 모바일 아이콘만

5. **운영자 권한 UI 영구 마커**
   - 모든 운영자 전용 버튼 = `var(--accent)` 외곽선 + "운영자" 톤
   - 사용자에게는 hidden (`isAdmin` / `canRecord` 분기)
   - 시안 JSDoc 헤더에 "운영자 권한 = ..." 명시

### 2-2. v2.16 디자인 언어 재사용 항목

- Pretendard 900 + Space Grotesk display 폰트 — Hero 점수에 그대로 적용
- Date Tile / Area Chip — 같은 날 매치 Rail 카드에 적용
- 호스트 아바타 — finished 분기의 "MVP" 배너에 적용
- 종별 컬러 — `--kind-pickup/guest/scrim` + 대회 매치는 `--cafe-blue` 추가

---

## 3. 신규 / 갱신 시안 (4 파일)

### 3-1. `Live.jsx` — 전면 재박제 (운영 1:1)

**현 상태**: 데모 (player + 채팅 + 스탯바 6개 + 다른 중계 그리드)
**목표**: 운영 `/live/[id]` 의 in-progress 분기 풀스택 시안

**섹션 (위에서 아래)**:

1. **breadcrumb** — 홈 › 라이브 › [대회명 · N경기]
2. **운영자 액션바** (조건부 — isAdmin 시) — 기록하기 / 임시 jersey 번호 / YouTube 등록 / 자동검색 토스트 (4개 버튼 + 자동검색 상태)
3. **Hero band** — §2-1 §1 그대로 (5단계 상태 분기 모두 명세)
4. **YouTube 임베드** (조건부 — `youtube_video_id != null`) — 16:9 + 모바일 sticky + PC PIP
5. **같은 날 매치 Rail** (조건부 — `same_day_matches.length > 1`) — 가로 스크롤 카드, 현재 매치 강조
6. **쿼터별 점수 테이블** — period_format 분기 (Q1~4+OT vs 전반/후반/OT) + 진행 쿼터 강조 + 모바일 hscroll
7. **박스스코어** — 양팀 별 선수 행 (스타팅 5 상단 + 후보 + DNP 별도) + 쿼터 필터 (전체/Q1~4/OT) + 모바일 #/이름 sticky
8. **Play-by-Play 섹션** — 최근 10건 초기 + "더보기" → 전체 + 팀 칩 (surface bg + border, 흰 글씨 가독성 가드) + 한글 라벨 ("3점 성공" / "수비리바운드" / "U파울" 등 구체)
9. **(PM 결정 후) 채팅 / 좋아요 / 해설참여** — 결정에 따라 유지 or 제거

**컴포넌트 (시안 내부)**:
- `<LiveHero match={...} />` — 상태 + 점수 + 팀
- `<YouTubeEmbed videoId={...} status={...} />` — 모바일 sticky / PC PIP
- `<SameDayMatchRail matches={...} currentId={...} />` — Date Tile 카드 가로
- `<QuarterScoreTable scores={...} format={...} currentQuarter={...} />`
- `<BoxScore homePlayers={...} awayPlayers={...} quarterFilter={...} />` — 쿼터 필터 + DNP 분리
- `<PlayByPlay events={...} limit={10} format={...} />` — 더보기 / 한글 라벨 / 팀 칩
- `<AdminActionBar isAdmin onRecord onJersey onYouTube />` — 운영자 4 버튼

**JSDoc 매트릭스** (시안 상단):
```jsx
/**
 * Live — /live/[id] in-progress 분기 (C → A 박제)
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 데모 | v2.17           | 진입점           | 모바일
 *   Hero              | △ 스코어버그 | ✅ 풀폭 Hero       | 모든 상태       | 2행 stack
 *   YouTube           | ❌       | ✅ sticky/PIP     | youtube_video_id | sticky top-14
 *   같은 날 Rail      | △ 다른 중계 그리드 | ✅ Date Tile Rail | same_day≥2     | hscroll
 *   쿼터 점수 테이블  | ❌       | ✅ period 분기    | live/halftime/finished | hscroll
 *   박스스코어        | ❌       | ✅ 쿼터 필터+DNP   | 모든 상태       | #/이름 sticky
 *   PBP               | ❌       | ✅ 한글 라벨+팀칩  | live/finished   | hscroll
 *   운영자 액션바     | ❌       | ✅ 4 버튼         | isAdmin         | 아이콘만
 *   상태 5분기        | △ LIVE만 | ✅ 5종            | -               | -
 *
 * 진입: /live (목록) / 알림 / Push notif
 * 복귀: /live (← 다른 경기) / /games/[id]
 * 에러: 권한 없음 → /live 리디렉트 / 매치 미존재 → 404
 */
```

---

### 3-2. `LiveResult.jsx` — 회귀 검수 + period_format 분기 추가

**현 상태**: 회귀 픽스 적용 완료 (GameResult 활용 + 하이라이트 클립 + 평가 CTA + 기록 보기)
**목표**: period_format 분기 + 종별 컬러 + 같은 날 Rail 통합

**갱신 사항**:
- 종료 배너 — period_format 분기 ("4쿼터 / 전후반")
- 같은 날 Rail 추가 (LiveResult 하단 — "다음 경기" 진입점)
- 하이라이트 클립 — 종별 컬러 (`--kind-*` 또는 `--cafe-blue`) 박제
- 평가 CTA 카드 / 기록 보기 CTA — v2.16 카드 패턴 + 모바일 1열 stack
- "다른 경기" / "내 경기" 버튼 — `app-nav__icon-btn` 패턴 검토 (현재 `.btn--sm`)

---

### 3-3. (신규) `_live_in_progress_preview.html` — 통합 미리보기

**목적**: Live.jsx + LiveResult.jsx 의 5단계 상태 분기를 한 HTML 에서 토글 시연 (개발자/PM 검토용)

**구조**:
- 상단 status selector (5 버튼 — scheduled / warmup / live / halftime / finished)
- 하단: 선택 상태에 따른 풀폭 시안 렌더
- period_format 토글 (quarters / halves)
- isAdmin 토글 (운영자 UI on/off)
- youtube_video_id 토글 (있음/없음)

→ `Dev/design/BDR-current/_live_in_progress_preview.html` (현 의뢰 산출물)

---

### 3-4. `Live.jsx` 보조 데이터 (`data.jsx` 확장)

**현 상태**: data.jsx 의 LIVE_DATA 가 있는지 / 없는지 시안에서 직접 정의
**목표**: 운영 MatchData interface 모킹 (5 상태 각각 + period_format 2종 + isAdmin 분기)

```jsx
// data.jsx 확장 (v2.17)
const LIVE_MATCH_SAMPLES = {
  scheduled: { status:'scheduled', period_format:'quarters', /* ... */ },
  warmup:    { status:'warmup', /* ... */ },
  live:      { status:'live', current_quarter:3, /* ... */ },
  halftime:  { status:'halftime', /* ... */ },
  finished:  { status:'finished', mvp_player:{...}, /* ... */ },
};
```

---

## 4. 디자인 명세 (세부)

### 4-1. Hero band 명세

**데스크톱 (≥768px)**:
- 5단 grid: `[Logo A] [Score A] [Status 중앙] [Score B] [Logo B]`
- Logo: 80×80px 원형 (없으면 팀색 배경 + 이니셜 2자)
- Score: Pretendard 900 96px (라이트는 ink / 다크는 white)
- Status 중앙: 작은 라벨 (Q3 · 5:24) + LIVE pulse + 경기장명 + 매치 코드
- 배경: 다크 그라데이션 (`linear-gradient(135deg, #1a1a1a, #000)` 보존)
- 우상단: 운영자 액션바 (isAdmin)

**모바일 (≤720px)**:
- 2행: 1행 = `[Logo A] [팀A명]` + `[팀B명] [Logo B]`
- 2행: Score A (좌) · Status (중) · Score B (우)
- Logo: 56×56px
- Score: 56px
- Status 중앙: 12px + LIVE pulse 작게

### 4-2. YouTube 임베드 명세

**youtube_video_id != null 일 때만 마운트** (NULL 이면 영역 자체 hidden — 사용자 결정 §13 / Q11 결재).

**데스크톱 (≥768px)**:
- 일반 위치: Hero 아래 16:9 (max-width 900px 중앙)
- Viewport 밖이면: PIP — IntersectionObserver 로 본문 영역 가시 여부 추적 (`position: fixed; bottom: 20px; right: 20px; width: 320px; height: 180px;`)
- PIP 닫기 버튼 + 본문 복귀 버튼

**모바일 (≤767px)**:
- `position: sticky; top: 56px;` (헤더 아래 고정)
- 16:9 그대로
- 사용자가 스크롤해도 영상은 헤더 바로 아래에 머무름
- **4분기점 분기**: 360px / 720px / 900px / 1024px (iPhone SE 대응 — 영상 비율 보존)

**보안 + 성능 (운영 동일)**:
- iframe `src` 도메인 = **youtube-nocookie.com** (privacy 강화 + CSP 화이트리스트 일치)
- iframe `allow` 화이트리스트: `autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share`
- `loading="lazy"` + `allowFullscreen` 명시

**LIVE / 라이브 뱃지**:
- `var(--color-status-live)` 배경 + 흰 글씨
- **`animate-ping` 1.5s 깜빡임 애니메이션** (운영 youtube-embed.tsx L140-143 동일)
- VOD 모드는 회색 "VOD" 배지 (정적)

**상태 분기 (youtube_status)**:
- `"manual"` — 운영자가 직접 등록 (라이브 또는 VOD)
- `"auto_verified"` — BDR 채널 자동 검색 + 신뢰도 80점 이상 (✓ 배지 표시)
- `"auto_pending"` — 자동 검색 중 (회색 placeholder)

### 4-2-1. YouTube 자동 등록 폴링 (PR-C — 운영자 한정)

**조건**: `isAdmin = true` + 매치 상태 = `scheduled / warmup / live` + 시작 시각 **±10분 윈도우** 안

**동작**:
- `setInterval(30000)` — 30초 주기 폴링
- 의존성 최소화 (5 key): `match.id` / `youtube_video_id` / `status` / `scheduled_at` / `started_at`
- 응답 (`apiSuccess` snake_case 자동 변환): `{ registered, reason, video_id, score, status, match_status }`
- 신뢰도 ≥ 80점 시 자동 INSERT → `fetchMatch` refetch → 임베드 자동 노출

**폴링 멈춤 조건 (3가지)**:
- `already_registered` (이미 등록됨) → fetchMatch refetch + interval clear
- `match_not_live` (매치 종료) → interval clear
- 윈도우 벗어남 (시작 +10분 초과 또는 -10분 전) → 폴링 시작 X 또는 중단

**autoRegisterActive 토스트 UI**:
- 운영자에게만 노출 (`isAdmin` 분기)
- 위치: Hero 우상단 또는 운영자 액션바 아래
- 카피: "BDR 채널에서 자동 검색 중..." (5단어 이내 룰 준수)
- 디자인: `var(--cafe-blue)` 배경 + 흰 글씨 + 작은 spinner

### 4-3. 쿼터별 점수 테이블 명세

**period_format = "quarters"**:
- 컬럼: 팀명 / Q1 / Q2 / Q3 / Q4 / OT1+ / 합계
- 진행 중 쿼터 (`current_quarter`) = `var(--cafe-blue)` 배경 + 흰 글씨
- 미도래 쿼터 = `var(--ink-dim)` 회색

**period_format = "halves"**:
- 컬럼: 팀명 / 전반 / 후반 / OT1+ / 합계
- 같은 강조 룰

**모바일**: `overflow-x-auto` + 팀명 컬럼 sticky

### 4-4. 박스스코어 명세 (2026-04-15 사용자 박제)

**데스크톱**:
- 양팀 각각 행렬 (좌 홈팀 / 우 원정팀)
- 행: 선수 (스타팅 5 상단 + 후보 중단 + DNP 하단 별도 섹션)
- 열: # / 이름 / MIN / PTS / FGM-A / 3PM-A / FTM-A / OREB / DREB / REB / AST / STL / BLK / TO / PF / +/-
- 상단 쿼터 필터 버튼 (전체 / Q1 / Q2 / Q3 / Q4 / OT) — `quarter_stats` 키 "1"~"5" 매핑
- 이벤트 미박제 매치 (`has_quarter_event_detail: false`) — 쿼터 필터 활성 시 안내 배너 + 스탯 "-" 표시
- **zoom 1.1 (PC 한정)** — 박스스코어 가독성 강화 (운영 page.tsx L984)
- **PTS 좌측 띠** — 팀색 + 흰 글씨 가독성 가드 (라이트 모드 흰색 팀 글자 안 보이는 이슈 해결, 운영 L1797-1820)
- **선수명 PlayerLink** (2026-05-10 마이그) — `user_id != null` 시 클릭 → 공개 프로필 / NULL 시 단순 span fallback (placeholder user)
- **DNP 섹션** — `opacity: 0.5` 회색 흐림 + 셀별 "-" 채움 (NBA 스타일) + "출전 없음" 라벨

**모바일**: `overflow-x-auto` + `#` + `이름` 2열 sticky (가로 스크롤 시 식별 가능)

### 4-4-1. 프린트 / PDF 다운로드 (2026-04-16 사용자 박제 — 누락 방지 필수)

**프린트 옵션 다이얼로그** (운영 page.tsx L2237-2443):
- **매트릭스**: 팀 (홈/원정) × 기간 (누적/Q1/Q2/Q3/Q4/OT) — 개별 체크박스
- **기본값**: 양팀 누적 체크 / 쿼터 미체크
- **모드 분기**: `system` (브라우저 `window.print()`) vs `pdf` (html2canvas + jspdf 자동 다운로드)
- **PDF 모드** — 모바일 호환 (`window.print` 미지원 환경)

**프린트 전용 영역**:
- `#box-score-print-area` (화면 hidden / 인쇄 시 block)
- `printSections` 동적 생성 — 선택 옵션 조합별 PrintBoxScoreTable 다중 렌더
- `data-print-hide` CSS 클래스 — 인쇄 시 숨길 영역 마커

**pdfGenerating overlay**:
- PDF 생성 중 (`pdfGenerating: true`) 화면 깜빡임 방지 overlay
- 카피: "PDF 생성 중..." (5단어 이내) + spinner

**버튼 위치**: 박스스코어 우상단 "프린트" / "PDF 다운로드" 2 버튼 (PC 텍스트+아이콘 / 모바일 아이콘만)

### 4-5. PBP 명세 (2026-05-16 긴급 박제)

**행 컬럼**: 시간 / 팀 칩 / # / 선수명 / 액션 (한글 구체 라벨) / 점수 누적
**팀 칩 가독성 가드**: 팀색을 그대로 쓰면 흰색 팀 글씨가 안 읽힘 → `var(--surface)` 배경 + `1px solid` border + 팀색 텍스트 (현재 운영 패턴 보존)

**액션 라벨 한글 매핑** (`formatPbpAction` 함수 — `src/lib/live/pbp-format.ts`):
- `made_shot_3pt` → "3점 성공"
- `missed_shot_3pt` → "3점 실패"
- `made_shot` (2점) → "득점"
- `rebound_def` → "수비리바운드"
- `rebound_off` → "공격리바운드"
- `foul_u` → "U파울"
- `free_throw` (made) → "자유투 성공"
- `turnover` → "턴오버"
- `steal` → "스틸"
- `block` → "블락"
- (전체 매핑은 `src/lib/live/pbp-format.ts` 참조 — `action_type` + `action_subtype` + `meta` 분기)

**선수명 PlayerLink** (2026-05-10 마이그) — `user_id != null` 시 공개 프로필 라우팅

**초기 표시**: 최근 10건 + "더보기 (N건 더)" 버튼 → 전체 펼치기
**모바일**: 가로 스크롤 + 시간 컬럼 sticky

### 4-6. 같은 날 매치 Rail

- `same_day_matches.length >= 2` 일 때만 마운트
- 가로 스크롤 (드래그 + 휠 + 화살표 버튼)
- 카드: Date Tile (v2.16) + 팀A vs 팀B 점수 + 코트 + 상태 (예정/진행/완료)
- 현재 매치 = `var(--accent)` 외곽선 강조

### 4-7. 운영자 액션바 명세

**노출 조건**: `isAdmin = true` (admin-check API 통과) **또는** `canRecord = true` (organizer / recorder / tournament_admin_members.is_active)

**버튼 4종 (PC)**:
1. **기록하기** (canRecord — PR-Live2 2026-05-15) — `var(--accent)` primary 버튼 → `/score-sheet/[matchId]` Link 진입
2. **임시 jersey 번호** (isAdmin + W1 매치 — Phase 1 PR4 2026-05-05) — secondary → MatchJerseyOverrideModal
3. **YouTube 등록** (isAdmin — PR4+PR5 2026-05-09) — secondary → MatchYouTubeModal (수동 입력 탭 + 자동 검색 탭)
4. **자동검색 상태** (autoRegisterActive — PR-C) — 토스트 "BDR 채널에서 자동 검색 중..." (§4-2-1 참조)

**모바일**: 아이콘만 (텍스트 hidden) — 버튼 44px 터치 타겟 보장

### 4-7-1. 운영자 안전장치 (운영 동일 패턴)

- **YouTube DELETE** — `window.confirm("등록된 YouTube 영상을 삭제하시겠습니까?")` 안전장치 필수 (운영 match-youtube-modal.tsx L309-343)
- **MatchYouTubeModal onSave 콜백** — 저장 / 삭제 / 자동 등록 성공 시 라이브 페이지 `fetchMatch` refetch 트리거 (운영 즉시 갱신)
- **수동 URL 입력 검증** — YouTube URL / 비디오 ID 자동 파싱 (정규식: `(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/live/)([a-zA-Z0-9_-]{11})`), 실패 시 에러 토스트
- **자동 검색 신뢰도** — BDR 채널 검색 결과 score ≥ 80 자동 등록 (`auto_verified`) / 60~79 대기 (`auto_pending`) / 60 미만 무시
- **일시 에러 (transientError) 처리** (2026-05-02) — 429 / 5xx / 네트워크 에러 시 `transientError` state + 토스트 "잠시 후 다시 시도" — 사용자 시야에서 깜빡임 방지

### 4-8. 상태 5분기 명세

각 상태에서 Hero / 본문 노출 영역 매트릭스:

| 영역 | scheduled | warmup | live | halftime | finished |
|---|---|---|---|---|---|
| Hero — Status 라벨 | "MM/DD HH:mm 시작" | "워밍업 중" | "Q3 · 5:24" + LIVE pulse | "하프타임" | "FINAL" |
| Hero — Score | 0 - 0 | 0 - 0 | 실시간 점수 | Q1+Q2 점수 | 최종 점수 |
| Hero — 카운트다운 | ✅ | ❌ | ❌ | ❌ | ❌ |
| YouTube | △ (운영자 등록 CTA) | △ | ✅ | ✅ | ✅ (VOD) |
| 같은 날 Rail | ✅ | ✅ | ✅ | ✅ | ✅ |
| 쿼터 점수 테이블 | ❌ | ❌ | ✅ | ✅ (Q1·Q2만) | ✅ |
| 박스스코어 | ❌ | △ (선수 명단) | ✅ | ✅ | ✅ |
| PBP | ❌ | ❌ | ✅ | ✅ | ✅ |
| 운영자 액션바 | ✅ (등록·jersey·YouTube) | ✅ | ✅ (기록) | ✅ | ❌ |
| LiveResult (전체 교체) | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 5. 박제 룰 (자동 적용)

✅ **00-master-guide.md** 의 13 룰 모두 준수
✅ AppNav 는 **03-appnav-frozen-component.md** 의 코드 그대로 카피 (절대 재구성 X)
✅ 디자인 토큰은 **02-design-system-tokens.md** 사용 (하드코딩 hex 금지)
✅ 사용자 결정 §1~§8 (**01-user-design-decisions.md**) 절대 보존
✅ 시안 완료 후 **06-self-checklist.md** §1~§6 모두 ✅ 통과

### 추가 자체 검수 (이번 의뢰 한정)

- 회귀 4 케이스 (Phase 19) — main bar 우측 5 아이콘 / 모바일 듀얼 다크 / 검색·쪽지·알림 박스 / 더보기 dropdown 영구 0
- 카피 — "예: " placeholder 0 / alert("준비 중") 0 / lucide-react 0
- 핑크·살몬·코랄 — 0건 (다크 Hero 배경에 무심코 추가되기 쉬움 — 가드 필수)
- pill 9999px — 아바타·dot·LIVE pulse dot 외 0건
- YouTube iframe — `loading="lazy"` + `allowFullscreen` 명시

---

## 6. PM 결정 필요 (§1-2 §A~§D 4건)

### Q1. 채팅 사이드바 — 시안 유지 / 영구 제거?

**현 상태**: 운영 DB 0 / 시안에만 데모.
**옵션 A** (제거) — `Live.jsx` 에서 통째로 삭제. 향후 Pusher / Ably 도입 시 부활.
**옵션 B** (시안 유지) — placeholder 카피 + "준비 중" 라벨. 단 `alert("준비 중")` 금지 룰과 충돌 → "Coming soon" 톤으로 보존만.
**옵션 C** (YouTube 채팅 통합) — youtube_video_id 있을 때 YouTube live chat iframe (`/live_chat?v=...`) 임베드. 자체 채팅 시스템 0 + 운영 의존성 0.

→ **PM 권장**: **옵션 C** (YouTube 채팅) + youtube_video_id NULL 시 영역 hidden.

### Q2. 좋아요 / 저장 / 공유 / 신고 — 유지 / 제거?

**현 상태**: 시안에 카운트 데모. 운영 DB 0.
**옵션 A** (제거 — 권장) — 본 의뢰에서 영구 제거. 시청자 인터랙션은 YouTube 측에서 처리.
**옵션 B** (공유만 유지) — 공유 = Web Share API 로 구현 가능 (DB 의존 0). 좋아요/저장/신고는 제거.

→ **PM 권장**: **옵션 B** (공유만 — Web Share API + URL 복사 fallback).

### Q3. "🎙 해설 참여 신청" — 유지 / 제거?

**현 상태**: 시안 데모. 운영 0 (해설 시스템 미구현).
**옵션 A** (제거 — 권장) — 본 의뢰에서 영구 제거.
**옵션 B** (placeholder 보존) — "BDR+ 해설 모집 (준비 중)" 톤.

→ **PM 권장**: **옵션 A** (제거).

### Q4. 시청자 수 카운트 — 유지 / 제거?

**현 상태**: 시안 데모 `viewers: 1247`. 운영 0.
**옵션 A** (YouTube 분기) — youtube_video_id 있을 때 YouTube API `liveStreamingDetails.concurrentViewers` 표시. NULL 시 hidden.
**옵션 B** (제거) — 본 의뢰에서 영구 제거.

→ **PM 권장**: **옵션 A** (YouTube 분기 — youtube_video_id 있을 때만).

---

## 7. 산출물

- **폴더**: `Dev/design/BDR v2.17/` (claude.ai/design 자동 생성) 또는 BDR-current 직접 (수신 환경 따라)
- **파일 (4개)**:
  1. `screens/Live.jsx` (전면 재박제 — §3-1)
  2. `screens/LiveResult.jsx` (갱신 — §3-2)
  3. `_live_in_progress_preview.html` (신규 — §3-3)
  4. `data.jsx` 확장 (§3-4 — LIVE_MATCH_SAMPLES 5종)
- **README.md** v2.16 → v2.17 변경 요약 (라이브 페이지 풀스택 박제 + PM 결정 §13)
- **사용자 결정 §13 신규** — 본 의뢰 §6 PM 결정 4건 (Q1~Q4) 영구 보존 → `01-user-design-decisions.md` §13 추가

---

## 8. 자체 검수 결과 보고 형식

시안 완료 후 다음 형식으로 보고:

```
✅ 라이브 경기 페이지 v2.17 시안 검수 결과

§1. AppNav 7 룰: 7/7 통과
§2. 더보기 5그룹 IA: 통과 (가짜링크 0)
§3. 디자인 토큰: 통과 (하드코딩 hex 0 / 핑크·살몬·코랄 0)
§4. 카피: 통과 ("예:" placeholder 0 / alert 0)
§5. 모바일: 통과 (720px / iOS 16px / 44px / YouTube sticky / PBP·박스·쿼터 hscroll)
§6. 연결성: JSDoc 매트릭스 첨부 완료

추가 검수 (이번 의뢰):
§7. 5상태 분기: scheduled / warmup / live / halftime / finished — 모두 시안 명세
§8. period_format 분기: quarters / halves — Hero·쿼터·PBP·박스 4곳 적용
§9. 운영자 액션바: isAdmin · canRecord 분기 명세
§10. YouTube: sticky/PIP 분기 + 상태 3종 (manual/auto_verified/auto_pending)
§11. PM 결정 4건 (Q1~Q4): 권장 옵션 채택 / 사용자 결정 §13 추가
§12. 회귀 4 케이스 (Phase 19): 모두 0건

산출물:
- screens/Live.jsx (전면 재박제)
- screens/LiveResult.jsx (갱신)
- _live_in_progress_preview.html (신규)
- data.jsx 확장 (LIVE_MATCH_SAMPLES 5종)
- README.md v2.16 → v2.17

검수 통과. CLI 박제 의뢰 준비 완료.
```

---

## 9. 후속 — CLI 박제 의뢰

본 시안 완료 후, 같은 폴더의 `live-v2.17-cli-batch-2026-05-20.md` 를 CLI 클로드에게 전달 → 운영 `src/app/live/[id]/page.tsx` + `_v2/` 박제 진행.
