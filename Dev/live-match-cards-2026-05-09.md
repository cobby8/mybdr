# 라이브 페이지 — 오늘 진행중/예정 경기 카드 패널 (네이버 패턴) 기획서

**작성일**: 2026-05-09
**작성**: planner-architect
**관련 작업**: 5/9 라이브 YouTube 임베딩 PR1~5 + sticky (✅ main 미푸시 / 검증대기)
**상태**: 결재 대기 (Q1~Q9)

---

## §1. 배경 / 사용자 요구사항

### 1-1. 사용자 의도
- 5/9 `/live/[id]` YouTube 임베딩 + sticky 작업 마무리 직후
- **네이버 농구 라이브 페이지 패턴 도입** — "현재 매치 페이지에 같은 날 다른 경기 카드 노출 + 클릭 이동"
- 참고 이미지:
  - **이미지 27**: 메인 매치 (뉴욕 108 - 필라델피아 94) + 가로 스크롤 매치 카드 4개 (1쿼터 샌안vs미네소타 / 경기종료 / 빈 슬롯 2개)
  - **이미지 28**: 매치 카드 + 탭 (전력/중계/뉴스/역사/기록)

### 1-2. 핵심 가치
| 항목 | 가치 |
|------|------|
| 같은 날 다른 매치 노출 | 사용자가 메인 매치 시청 중 다음/다른 경기 빠르게 인지 |
| 매치 간 이동 마찰 0 | 클릭 1회로 다른 매치 라이브로 점프 |
| 진행중/예정/종료 분류 | 시청자가 본인 관심 매치 즉시 파악 (1쿼터 / Q3 / 종료) |
| 네이버 UX 차용 | 모바일 농구 라이브 사용자가 이미 익숙한 패턴 (학습 비용 0) |

### 1-3. 현재 상태 (5/9 PR1~5+sticky)
- 라이브 페이지 = 단일 매치 풀 페이지 (영상 sticky / hero / 박스 / PBP / minutes / 사전 라인업)
- 같은 날 다른 매치 진입 동선 = AppNav `/live` 목록 페이지 (1번 클릭) → 매치 클릭 (2번 클릭) = 2 step
- **본 작업 완료 시**: 라이브 페이지 안 매치 카드 클릭 1회 = 0~1 step

---

## §2. 데이터 모델 / 출처

### 2-1. 같은 날 매치 정의

| 옵션 | 정의 | pros | cons |
|------|------|------|------|
| **A. 같은 대회 + 같은 날** ⭐ 권장 | `tournamentId = X AND DATE(scheduledAt) = DATE(currentMatch.scheduledAt)` | 동일 대회 진행중 매치 모임 (네이버 패턴 = "오늘 KBL 경기") | 1일 단일 대회만 있는 날 = 1 매치만 있을 수 있음 |
| B. 같은 대회 + ±1일 (자정경계 보정) | `tournamentId = X AND scheduledAt BETWEEN -1d~+1d` | 자정 경계 매치 포함 | 노이즈 ↑ (다음날 경기까지) |
| C. 같은 대회 + 같은 stage (round_name) | `tournamentId = X AND round_name = currentMatch.round_name` | 같은 라운드 매치 (예: 8강 4경기) | round_name 정의 일관성 X (대회별 다름) |

**권장**: 옵션 A. KST 기준 같은 날 = `00:00 KST ~ 23:59 KST` 윈도우. `prisma` 쿼리 시 `gte: startOfDay(KST)` `lt: endOfDay(KST)` (Q2 결재).

### 2-2. 매치 상태 분류 (`status` 컬럼)

| 분류 | DB 조건 | UI 표시 |
|------|---------|---------|
| **진행중** | `status IN ('in_progress', 'live', 'halftime')` | "1쿼터" / "Q3" / "하프타임" + 점수 |
| **예정** | `status = 'scheduled'` (또는 NULL) | "19:00" 시간만 |
| **종료** | `status IN ('completed', 'finished')` | "경기종료" + 최종 점수 |
| **취소** | `status = 'cancelled'` | "경기 취소" (회색 dim) |

### 2-3. 정렬 룰 (Q5 결재)

| 옵션 | 룰 | 직관성 |
|------|----|----|
| **A. 시간순** ⭐ 권장 | `scheduledAt ASC` (오전 → 저녁) | 같은 날 = 시간순이 자연 |
| B. 진행중 우선 | 진행중 → 예정 → 종료 → 시간순 | 라이브 시청자 친화 (BUT 시간 순서 깨짐) |
| C. 현재 매치 중심 | 현재 매치를 기준으로 좌(이전) / 우(이후) 정렬 | 시청 흐름 자연 |

**권장**: 옵션 A (시간순). 현재 매치는 별도 highlight (accent border) — 정렬 흐트러뜨릴 필요 0. 종료 매치도 같은 줄에 시간순 그대로 (네이버 패턴 동일).

### 2-4. 빈 슬롯 정책 (Q4 결재)

| 옵션 | 룰 | 케이스 |
|------|----|----|
| **A. 가변 — 매치 N건만 노출** ⭐ 권장 | 매치 4건 = 4 카드 / 7건 = 7 카드 (가로 스크롤) | 네이버는 사실 가변 (예: 8경기 날) |
| B. 4 슬롯 고정 (네이버 이미지처럼) | 매치 N건 < 4 시 빈 슬롯 placeholder | 1~2 매치 날 = 빈 슬롯 어색 |

**권장**: 옵션 A. 가변. 1~3 매치 날도 자연스럽고, 4+ 매치 날도 가로 스크롤로 모두 노출.

---

## §3. 신규 컴포넌트

### 3-1. `LiveMatchCardRail` (가로 스크롤 컨테이너)

**위치**: `src/app/live/[id]/_v2/match-card-rail.tsx` (신규)
**타입**: client component (Next Link 클릭 / 모바일 가로 스크롤 지원)
**props**:
```ts
interface MatchCardRailProps {
  matches: SameDayMatch[];          // 같은 날 매치 list (현재 매치 포함)
  currentMatchId: number;           // 현재 매치 ID (highlight 분기)
  tournamentName?: string | null;   // 헤더 라벨 ("ABC 대회 — 오늘의 경기")
}
```
**구조**:
- 헤더 row — "오늘의 경기" + 매치 N건 카운트
- 가로 스크롤 영역 (`overflow-x-auto` + `snap-x` snap-mandatory)
- 카드 N개 (`LiveMatchCard`)

### 3-2. `LiveMatchCard` (매치 1건 카드)

**위치**: `src/app/live/[id]/_v2/match-card.tsx` (신규)
**타입**: client component (`<Link>` Next routing)
**props**:
```ts
interface LiveMatchCardProps {
  match: SameDayMatch;
  isCurrent: boolean;       // 현재 매치 = accent border highlight
}
```
**카드 구조** (네이버 패턴 + BDR 토큰):
```
┌──────────────────────────┐
│ [상태 라벨]    [라이브 ●] │  ← 1쿼터 / 종료 / 19:00
│                          │
│  [홈 로고]    [어웨이]    │  ← 팀 로고 + 약칭
│   BDR  vs    EAGLES      │
│                          │
│   108        94          │  ← 점수 (예정은 "vs" 만)
│                          │
│   round_name (8강 1경기)  │  ← 옵션
└──────────────────────────┘
```
**상태별 분기**:
- **진행중**: 라이브 ● (red ping) + "1쿼터" / "Q3" + 점수 (현재값)
- **예정**: 시간 (HH:MM) + "vs" 만 (점수 0:0 X)
- **종료**: "경기종료" + 최종 점수 + 승팀 강조 (Bold)
- **현재 매치**: accent border (var(--PLACEHOLDER-accent)) + 약간 더 큰 사이즈

### 3-3. 재사용 vs 신규 판정

| 기존 컴포넌트 | 재사용 가능? | 사유 |
|-------------|-----------|------|
| `PlayerMatchCard` | ❌ | 선수 1명의 매치 1건 카드 (스탯 노출) — 라이브 매치 카드와 도메인 다름 |
| `TournamentRow` | ❌ | 대회 1건 row (매치 0~N건 통합) — 라이브 매치 카드와 도메인 다름 |
| `RecommendedRail` | ❌ | YouTube 영상 추천 카드 row — 매치 row 아님 |
| `HeroScoreboard` (`_v2/`) | 부분 | 점수 + 팀 로고 표시 룰 카피 가능 (TeamLogo + getTeamInitials) |

**결론**: `LiveMatchCard` 신규 (네이버 패턴 + 라이브 도메인 전용). `_v2/hero-scoreboard.tsx` 의 TeamLogo / 점수 표시 룰만 카피.

---

## §4. 매치 카드 UX 상세

### 4-1. 상태 라벨 (Q6 결재)

| 상태 | 라벨 | 색상 |
|------|------|------|
| 진행중 (in_progress) | "1쿼터" / "2쿼터" / "Q3" / "Q4" / "연장1" + ● 라이브 ping | accent (red) |
| 하프타임 (halftime) | "하프타임" | warning (amber) |
| 워밍업 (warmup) | "경기 준비중" | info (blue) |
| 예정 (scheduled) | "HH:MM" (시작 시간) | text-secondary |
| 종료 (completed/finished) | "경기종료" | text-muted |
| 취소 (cancelled) | "경기 취소" | text-muted (dim) |

### 4-2. 라이브 ping 애니메이션
- 5/9 RecommendedVideos 패턴 카피 (red dot + ping pulse)
- `animate-ping` Tailwind 또는 `@keyframes` CSS

### 4-3. 클릭 동작
- `<Link href={"/live/" + match.id}>` Next routing
- Soft navigation (기존 페이지 영상 sticky 유지 X — 페이지 자체 전환)
- 향후 옵션: history.pushState 만 + 라이브 데이터만 fetch (현재 PR 외 작업)

---

## §5. 데이터 흐름 (Q3 결재)

### 5-1. 옵션 비교

| 옵션 | 구현 | pros | cons |
|------|------|------|------|
| **A. `/api/live/[id]` 응답에 `same_day_matches[]` 추가** ⭐ 권장 | 기존 라우트 1건 수정 + 응답 키 추가 | 페이지 fetch 1회 / 폴링 3초 자동 갱신 (5/9 PR4 폴링 그대로) | 매치 페이지 응답 페이로드 ↑ (~20 매치 × 80B = 1.6KB / 무시 가능) |
| B. 별도 API `/api/web/tournaments/[id]/matches/same-day` | 신규 라우트 + 클라 fetch 추가 | 라이브 응답 페이로드 0 추가 / 캐시 분리 가능 | fetch 2회 (라이브 + same-day) / 로딩 동기화 처리 필요 |
| C. SSR prefetch (`page.tsx` server component 일 때만) | next.js fetch + 첫 렌더링 시 즉시 노출 | 첫 paint 빠름 | 현재 라이브 페이지 = `"use client"` (line 1) → 적용 불가 (대규모 리팩터 필요) |

**권장**: 옵션 A. 옵션 C 는 클라 컴포넌트라 불가. 옵션 B 는 폴링 동기 부담.

### 5-2. 옵션 A — 응답 확장 상세

**`/api/live/[id]/route.ts` 응답 키 추가**:
```
{
  "id": 148,
  ...기존 응답...,
  "same_day_matches": [
    {
      "id": 145,
      "scheduled_at": "2026-05-09T10:00:00.000Z",
      "started_at": "2026-05-09T10:05:00.000Z",
      "status": "completed",
      "round_name": "8강 1경기",
      "home_team": { "id": 12, "name": "BDR Eagles", "color": "#E31B23", "logo_url": null },
      "away_team": { "id": 13, "name": "Seoul Lions", "color": "#1B3C87", "logo_url": null },
      "home_score": 78,
      "away_score": 65,
      "current_quarter": null
    },
    ...
  ]
}
```
**스키마**:
- `same_day_matches[]` array (현재 매치 포함 / 없으면 빈 배열)
- 각 매치: `id / scheduled_at / started_at / status / round_name / home_team / away_team / home_score / away_score / current_quarter`
- 정렬: `scheduledAt ASC`
- 가드: 같은 `tournamentId` + DATE(scheduledAt KST) = DATE(currentMatch.scheduledAt KST)

### 5-3. SSR vs CSR
- 현재 라이브 페이지 = client component
- 본 PR 도 client fetch 그대로 (옵션 A) — 폴링 3초 자동 갱신 시 상태 라벨/점수 자동 sync

---

## §6. 위치 / 배치 (Q7 결재)

### 6-1. 옵션 비교

| 옵션 | 위치 | pros | cons |
|------|------|------|------|
| **A. YouTube 영상 sticky 아래 + hero(스코어카드) 위** ⭐ 권장 | 영상 → 매치 카드 → hero → 박스 | 영상 보면서 다른 매치 즉시 인지 / 영상 등록 매치 = sticky 영역과 시각적 묶음 | 영상 미등록 매치 = 카드 영역 위에 빈 공간 |
| B. hero 아래 + 박스/PBP 위 | 영상 → hero → 매치 카드 → 박스 | 메인 정보 후 보조 정보 흐름 | 영상 sticky 시 hero 와 매치 카드가 떨어짐 |
| C. 데스크탑 사이드바 우측 (1024px+ 분할) | 영상+hero 좌 / 매치 카드 우 | 데스크탑 화면 활용 ↑ | 1024px 미만 = 옵션 A or B 분기 필요 / 컴포넌트 복잡도 ↑ |

**권장**: 옵션 A. 영상 sticky 와 묶음. 모바일/PC 동일 1열. 옵션 C 는 후속 PR 가능 (네이버도 모바일 = 1열, PC = 사이드바 분할 — 본 PR 에서는 단순화).

### 6-2. 모바일 sticky 영역과 충돌
- 5/9 sticky 작업 = 영상 sticky `top-14` (모바일) — AppNav 아래
- **매치 카드 = sticky X** (영상만 sticky 유지 / 카드는 일반 스크롤)
- 매치 카드 위치 = 영상 sticky 영역 바로 아래 = 스크롤 시 영상이 카드를 덮음 (정상)

---

## §7. 모바일 가드 (5/9 conventions.md 4 분기점)

### 7-1. 분기점별 카드 폭 / 그리드

| 분기 | 폭 | 룰 |
|------|----|----|
| `≤360px` | 카드 폭 ~140px / 가로 스크롤 / snap-mandatory | iPhone SE 호환 |
| `≤720px` | 카드 폭 ~160px / 가로 스크롤 / snap-mandatory | 일반 모바일 (주력 분기) |
| `≤900px` | 카드 폭 ~180px / 가로 스크롤 또는 4 카드 grid | 태블릿 |
| `≥1024px` | 카드 폭 ~200px / 4 카드 grid (`auto-fit, minmax(200px, 1fr)`) | 데스크탑 |

### 7-2. iOS 16px 룰
- 매치 카드 안에 `<input>` 0 (read-only display) → 16px 룰 미적용
- 클릭 영역 44px 이상 (카드 자체 = 충분)

### 7-3. 가로 스크롤 룰
- `overflow-x-auto` + `snap-x` `snap-mandatory`
- 각 카드 `snap-start`
- 모바일 `scrollbar-width: none` (스크롤바 미노출 / iOS 자연 스크롤)

### 7-4. errors.md `[2026-05-09]` 룰 (Tailwind arbitrary 금지)
- 본 보고서 **본문**에 `bg-[var(--TOKEN)]` 류 invalid Tailwind 클래스 표기 금지
- 실제 코드 = 인라인 `style={{ backgroundColor: "var(--PLACEHOLDER-elevated)" }}` 사용
- Tailwind arbitrary `[var(...)]` 0 — 코드 생성 시 inline style 또는 globals.css class 통과

---

## §8. 권한 / API

### 8-1. 인증
- 라이브 페이지 자체 = 공개 (인증 0)
- 매치 카드 = 공개 매치만 노출 (`tournament.is_public = true`)
- `withWebAuth` 미적용 (`/api/live/[id]` 기존 그대로)

### 8-2. IDOR 가드
- 매치 ID 수신 시 같은 `tournamentId` 검증 후 노출 (옵션 A 응답 추가 시)
- 다른 대회 매치 노출 0 (가드 명시)

### 8-3. 비공개 대회 처리
- `tournament.is_public = false` (대기/조 미공개) → `same_day_matches = []` 반환 (현재 매치만 노출)
- 또는 본 매치도 같은 대회면 노출 (사용자 결정 필요 — 후속 큐)

---

## §9. 회귀 / 영향

| 영역 | 영향 |
|------|------|
| **Flutter v1 (`/api/v1/...`)** | ✅ 0 — `/api/live/[id]` 는 web 전용 |
| **DB schema** | ✅ 0 — 기존 `TournamentMatch` 모델 재사용 |
| **라이브 페이지 기존 영역** | ✅ 0 — 영상/hero/박스/PBP/minutes/사전 라인업 모두 그대로 |
| **`/api/live/[id]` 응답 키** | 추가만 (기존 키 변경 0 / camelCase → snake_case 자동변환 룰 그대로) |
| **다른 페이지** | ✅ 0 — `LiveMatchCard` / `LiveMatchCardRail` 신규 컴포넌트 라이브 페이지 단독 사용 |
| **5/9 sticky / PIP** | ✅ 0 — 영상 sticky 위치 변경 0 / 매치 카드는 영상 아래 in-flow |
| **5/9 사전 라인업** | ✅ 0 — 라인업은 별도 페이지 (`/lineup-confirm/[id]`) / 라이브 페이지 import 0 |

### 9-1. 폴링 영향
- 5/9 PR4 폴링 = 3초/회 `/api/live/[id]` GET (라이브 매치만)
- `same_day_matches[]` 추가 = 응답 페이로드 ~1.6KB ↑ (20 매치 × 80B)
- DB 쿼리 1건 ↑ (`prisma.tournamentMatch.findMany({ where: same_day, select: minimum })`)
- **임팩트**: 미미 (인덱스 `index_tournament_matches_on_tournament_id_and_bracket_position` 또는 `_on_status_and_scheduledAt` 사용)

### 9-2. 레이트 리밋
- 5/9 라이브 라우트 = `RATE_LIMITS.liveDetail` (120/60s)
- 본 작업 추가 부담 0 (같은 라우트 응답 확장만)

---

## §10. PR 분할

| PR | 작업 | 추정 | 의존 |
|----|------|------|------|
| **PR1** | `/api/live/[id]` 응답 확장 (`same_day_matches[]` 추가 + DB 쿼리 1건) | 1h | - |
| **PR2** | `LiveMatchCard` 신규 컴포넌트 (카드 1건 / 상태 라벨 분기 / 클릭 Link) | 1.5h | PR1 |
| **PR3** | `LiveMatchCardRail` 신규 컴포넌트 (가로 스크롤 컨테이너 + 모바일 4 분기점 가드) | 1h | PR2 |
| **PR4** | `page.tsx` 통합 (영상 sticky 아래 + hero 위 마운트) | 30분 | PR3 |
| **PR5** (선택) | 시안 박제 `Dev/design/BDR-current/screens/Live.jsx` 매치 카드 영역 추가 | 1h | PR4 / Q9 |
| 검증 | tester (curl 4 시나리오 + tsc + 모바일 가드) + reviewer 병렬 | 30분 | PR 별 |

**총 추정**: 5h (PR1~4 = 4h / PR5 = 1h / 검증 = 30분 PR 별)

### 10-1. PR 단독 머지 가능 여부

| PR | 단독 머지? | 사유 |
|----|---------|------|
| PR1 | ✅ | 응답 키 추가만 (클라 미사용 시 무시) — Flutter v1 영향 0 / 라이브 페이지 영향 0 |
| PR2 | ❌ | 컴포넌트 단독 = 사용처 0 (PR3 와 묶음 권장) |
| PR3 | ❌ | 컴포넌트 단독 = 사용처 0 (PR4 와 묶음 권장) |
| PR4 | PR1+PR2+PR3 후 | 페이지 통합 = 모두 의존 |

**권장 머지 순서**: PR1 단독 → PR2+PR3 묶음 → PR4 단독 → PR5 (선택)

---

## §11. 추정 시간 합계

| 영역 | 시간 |
|------|------|
| PR1 (API 응답 확장) | 1h |
| PR2 (LiveMatchCard) | 1.5h |
| PR3 (LiveMatchCardRail) | 1h |
| PR4 (page.tsx 통합) | 30분 |
| PR5 (시안 박제 — 선택) | 1h |
| 검증 (tester + reviewer 병렬, PR 별) | 30분 × 4 = 2h |
| **총합** | **6.5h ~ 7.5h** (PR5 포함 시) |

---

## §12. 사용자 결재 항목 (Q1~Q9)

### Q1. 데이터 출처 (옵션 A/B/C)
- **A. `/api/live/[id]` 응답 확장** ⭐ 권장
- B. 별도 API `/api/web/tournaments/[id]/matches/same-day`
- C. SSR prefetch — 적용 불가 (현재 client component)
- **권장 사유**: 폴링 3초 자동 갱신 / fetch 1회 / 응답 페이로드 영향 미미

### Q2. 같은 날 정의 (KST 기준 / ±1일)
- **A. KST 같은 날 (00:00 ~ 23:59)** ⭐ 권장
- B. ±1일 (자정 경계 보정)
- C. 같은 stage (round_name)
- **권장 사유**: 네이버 패턴 = 같은 날. ±1일은 노이즈 ↑.

### Q3. 정렬 (시간순 / 진행중 우선 / 현재 중심)
- **A. 시간순 (scheduledAt ASC)** ⭐ 권장
- B. 진행중 우선
- C. 현재 매치 중심 (좌/우 분리)
- **권장 사유**: 현재 매치 highlight 별도 처리 / 시간순이 자연

### Q4. 빈 슬롯 정책 (가변 / 4 고정)
- **A. 가변 — 매치 N건만 노출** ⭐ 권장
- B. 4 슬롯 고정 (네이버 이미지 패턴)
- **권장 사유**: 1~3 매치 날 빈 슬롯 어색

### Q5. 위치 (영상 아래 / hero 아래 / 사이드바)
- **A. 영상 sticky 아래 + hero 위** ⭐ 권장
- B. hero 아래 + 박스 위
- C. 데스크탑 사이드바 (후속 PR)
- **권장 사유**: 영상 sticky 와 시각 묶음 / 모바일/PC 동일 1열 단순화

### Q6. 상태 라벨 표기 (1쿼터 vs Q1 / 시간 vs "예정")
- **A. 진행중 = "1쿼터" / "2쿼터" / "Q3" / "Q4" / "연장1"** ⭐ 권장 (한국어 친화)
- B. 진행중 = "Q1" / "Q2" / "Q3" / "Q4" / "OT1" (NBA 영어 스타일)
- 예정 = HH:MM (둘 다 동일)
- 종료 = "경기종료" (둘 다 동일)
- **권장 사유**: 라이브 페이지 hero 와 일관 (`getCenterStatusLabel` 함수 5/4 룰 = "1쿼터" 한국어)

### Q7. 사이드바 옵션 (1024px+ 분할 vs 1컬럼 유지)
- **A. 1컬럼 유지 (모바일/PC 동일)** ⭐ 권장 (본 PR)
- B. 1024px+ 사이드바 분할 (영상 좌 / 매치 카드 우)
- **권장 사유**: 본 PR 단순화 / 후속 PR 에서 옵션 B 가능 (네이버도 모바일 = 1열)

### Q8. 시안 박제 시점 (이번 PR / 별도)
- **A. PR4 와 묶음** (시안 즉시 동기화 — 운영 → 시안 역박제 룰 5/7)
- **B. 별도 PR (PR5 분리)** ⭐ 권장
- **권장 사유**: PR4 미커밋 4건 (검증대기) 산적 → PR5 별도 분리 / push 시점 일괄

### Q9. 진행 시점 (즉시 / 다음 작업 / 5/10 D-day 후)
- **A. 즉시 (5/9 푸시 후 바로)**
- **B. 5/10 D-day 종료 후** ⭐ 권장 (본 PR 운영 영향 0지만 미푸시 4건 검증 후 진행)
- C. 미푸시 commit 검증 + push 후
- **권장 사유**: 5/10 D-day 동호회최강전 진행 중 — 안정성 우선. 본 PR 운영 영향 0 이지만 미푸시 commit 검증 후 진행 권장.

---

## §13. 빌드 에러 회피 룰 (5/9 errors.md `[2026-05-09]`)

본 보고서 작성 시 주의:
- 본문에 invalid Tailwind 클래스 (`bg-[var(--*)]`) 절대 금지
- placeholder 사용: `--TOKEN` / `--ASTERISK` / `--PLACEHOLDER`
- 실제 코드 작성 시 = 인라인 `style={{ backgroundColor: "var(--color-elevated)" }}` 또는 `globals.css` class 통과

본 보고서 본문 = 모두 placeholder 통과 ✅ (Tailwind arbitrary 표기 0).

---

## §14. 요약 / 결재 후 진행

### 핵심 추천안
- **Q1** = A (API 응답 확장)
- **Q2** = A (KST 같은 날)
- **Q3** = A (시간순)
- **Q4** = A (가변 슬롯)
- **Q5** = A (영상 sticky 아래 + hero 위)
- **Q6** = A ("1쿼터" 한국어)
- **Q7** = A (1컬럼 유지 / 사이드바는 후속 PR)
- **Q8** = B (시안 박제 PR5 별도)
- **Q9** = B (5/10 D-day 후)

### 결재 통과 시 진행 순서
1. PR1 (API 응답 확장) — 단독 머지 가능
2. PR2+PR3 묶음 (컴포넌트 신규) — 사용처 없으니 묶음
3. PR4 (page.tsx 통합) — 영상 sticky 아래 마운트
4. PR5 (선택 — 시안 박제) — 운영 → 시안 역박제 룰

### 산출물
- 신규 컴포넌트: 2개 (`LiveMatchCard` / `LiveMatchCardRail`)
- 신규 API: 0 (`/api/live/[id]` 응답 확장만)
- DB schema 변경: 0
- 추정 시간: 6.5h ~ 7.5h (PR5 포함)

---

**결재 대기**. 사용자 답변 후 developer 진입.
