# 클로드 디자인 의뢰 — 경기 탭 갭 보완 (v2.16 후속)

> **의뢰일**: 2026-05-20
> **수신**: 클로드 디자인 (Claude.ai Project — bdr 디자인 시스템 관리)
> **선행 박제**: v2.16 = `_games_card_final.html` (목록 카드 최종) / `_game_detail_explore.html` (상세 V1+V2) / `_create_game_explore.html` (개설)
> **이번 의뢰**: v2.16 박제 후 **시안 갭** 및 **디자인 언어 불일치 페이지** 보완

---

## 0. 진입 — 표준 절차

**Step 1**: `Dev/design/claude-project-knowledge/00-master-guide.md` 읽기 (13 룰 인지)
**Step 2**: 본 의뢰의 영향 받는 보조 파일 — 01/02/03/04/06
**Step 3**: 첫 응답 (표준 형식):

```
✅ BDR 디자인 의뢰 확인 — 경기 탭 갭 보완 (v2.16 후속)
이해: 미구현 5건 + v2.16 디자인 언어 확장 4건. 카드 final 패턴(Date Tile + Area Chip + 종별 컬러 + 호스트 아바타) 일관 적용.
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피
자체 검수: 06 §A, B, C, D 전체
작업 시작.
```

---

## 1. 이번 의뢰의 핵심 — v2.16 디자인 언어 4 요소

v2.16 카드(`_games_card_final.html`)에서 확정된 디자인 언어를 다음 페이지로 확장 / 갭 채움:

1. **종별 컬러** (`--kind-pickup` 크림슨 / `--kind-guest` 오렌지 / `--kind-scrim` 그린) — 카드 좌측 Date Tile + 호스트 아바타 배경 + 진행바 fill
2. **Date Tile** (카드 좌측 세로 컬럼 — 종별 라벨 / 날짜 / 시간)
3. **Area Chip** (지역 칩 — 카드 row1 상단)
4. **호스트 아바타** (둥근 28~32px / 종별 컬러 배경 + 닉네임 + "주최자" 라벨)

→ 본 의뢰 모든 시안은 위 4 요소 일관 적용 필수.

---

## 2. 미구현 시안 — 신규 박제 5건

### 2-1. `/tournaments/[id]/bracket` — 대회 대진표 (사용자 영역)

**현 상태**: 운영 라우트 존재 / **시안 부재** (Dev/design/BDR-current/screens/ 에 없음).
**구분**: 본 라우트는 사용자(참가자/관전자)가 보는 공개 대진표. `(admin)/tournament-admin/.../bracket` (관리자 — `AdminTournamentBracket.jsx` 존재)와 **다름**.

**필요 패턴**:
- 종별 selector (3x3 男 / 3x3 女 / 5x5 등)
- 조 단계 (4 그룹 × 4 팀 그리드, 순위 + 승점)
- 결선 토너먼트 viewer (8강 → 4강 → 결승)
- 각 매치 카드: 팀A vs 팀B 점수 + 코트 + 시간
- LIVE pulse (진행 중 매치 마커 — 빨강 깜박)
- 모바일: 종별 selector + 한 단계씩 swipe / accordion

**자체 검수 추가**:
- AdminTournamentBracket.jsx 와 시각 컴포넌트 통일 (운영 패널 vs 공개 표시 — 정보 동일, action 없음)

---

### 2-2. `/tournaments/[id]/schedule` — 대회 일정표 (사용자 영역)

**현 상태**: 운영 라우트 존재 / 시안 부재.

**필요 패턴**:
- 일자별 그룹화 timeline (관리자 `AdminTournamentMatches` 와 유사하나 사용자용 — action 없음)
- 종별 필터 칩
- 코트별 필터 칩
- 매치 카드: 시간 / 코트 / 팀A vs 팀B / 종별 / 상태(예정/진행/완료) — **종별 컬러 적용**
- 모바일: 칩 필터 sticky + 카드 1열
- 빈 일자 / 빈 코트 = empty state

---

### 2-3. `/tournaments/[id]/teams` — 대회 참가팀 목록 (사용자 영역)

**현 상태**: 운영 라우트 존재 / 시안 부재.

**필요 패턴**:
- 종별 필터 + 시드 정렬
- 팀 카드: 로고 / 팀명 / 출전 종별 / 선수 명단 (펼치기)
- 진출 단계 뱃지 (조별리그 / 8강 / 4강 / 결승 / 우승)
- 모바일: 카드 1열
- 검색 (팀명 / 선수명)

---

### 2-4. `/live` 목록 — 라이브 중계 진입 (사용자 영역)

**현 상태**: 운영 라우트 존재 (`src/app/live/page.tsx`) / 시안 부재.
**참고**: `screens/Live.jsx` (15kb) 가 BDR-current 에 있음 — 본 의뢰 대상이 이것인지 확인 후 작업.

**필요 패턴**:
- 진행 중 라이브 = 풀폭 hero 카드 (LIVE pulse + 점수판 + 남은 쿼터)
- 예정 라이브 = GameCard 패턴 재사용 + "예정" 라벨
- 종료 라이브 = LiveResult 미니 카드 (스코어 + 보기 CTA)
- 종별 컬러 적용 (`--kind-pickup/guest/scrim` 외에 대회 매치 = `--cafe-blue` 추가 검토)
- 모바일: 진행 중 1열 + 예정 1열 + 종료 1열

---

### 2-5. `/live/[id]` 진행 중 — 라이브 중계 화면 (사용자 영역)

**현 상태**: 운영 `_v2` 적용 + 종료 화면 (`LiveResult.jsx`) 만 박제 / **진행 중 화면 시안 부재**.

**필요 패턴**:
- 풀폭 다크 hero — 양팀 로고 + 큰 점수 (Pretendard 900) + 쿼터 / 남은 시간
- LIVE pulse 빨강 깜박
- 실시간 스코어 갱신 (Pusher / SSE)
- 쿼터별 점수 누적 표
- 슈팅 차트 / 파울 / 타임아웃
- 댓글 / 응원 (DB 미연결 시 placeholder)
- 모바일: hero 가 그대로 화면 절반 채우기 + 본문 1열

---

## 3. v2.16 디자인 언어 확장 — 갱신 4건

다음 페이지는 시안 존재하나 v2.16 디자인 언어 (§1) 와 충돌. 갱신 박제 필요.

### 3-1. `/games/my-games` — 내 경기 (MyGames.jsx)

**현 시안 상태**: B등급 — alert 6건 정리 필요 (04-page-inventory.md).
**갱신 사유**:
- 카드 패턴이 v2.15 base — **v2.16 Date Tile + Area Chip 미반영**
- 종별 컬러 미적용 (`--kind-*` 토큰 없음)

**갱신 작업**:
- 탭별 (다가오는 / 진행 중 / 완료) 카드 = `_games_card_final.html` 패턴 그대로 카피
- 상태별 mini badge 추가 (대기 / 승인 / 거절)
- alert 6건 정리: 정원 미달 알림 / 마감임박 / 시간 변경 등 — 카드 상단 가로 띠로 통합
- 빈 탭 empty state

---

### 3-2. `/games/[id]/edit` — 경기 수정 (GameEdit.jsx)

**현 시안 상태**: A (v2.2 박제).
**갱신 사유**: 개설(`/games/new`) v2.16 = 단일 페이지 + 라이브 프리뷰. 수정도 동일 패턴이어야 일관.

**갱신 작업**:
- `_create_game_explore.html` 패턴 그대로 + 우측 프리뷰 = 현재 카드 미리보기 (수정 전/후 비교 옵션)
- 7섹션 동일 / 단 종류(1) 는 disabled (변경 불가)
- 하단 [수정 저장] CTA + [삭제] secondary 버튼
- 모바일 동일

---

### 3-3. `/games/[id]/guest-apply` — 게스트 신청 (GuestApply.jsx)

**현 시안 상태**: A.
**갱신 사유**: 상단에 대상 경기 GameCard 미니 노출 시 종별 컬러 / Date Tile 패턴 적용 필요.

**갱신 작업**:
- 상단 GameCard 미니 (v2.16 패턴 그대로, but `gcard--compact` 변형 — 호스트 푸트 생략)
- 본문: 신청 폼 (포지션 / 레벨 / 자기소개 / 평점 기록 보기 동의)
- 호스트가 보는 화면 vs 신청자가 보는 화면 분기
- 모바일: 카드 + 폼 1열 + 하단 sticky [신청] CTA

---

### 3-4. `/guest-apps` — 내 게스트 신청 모아보기 (GuestApps.jsx)

**현 시안 상태**: A.
**갱신 사유**: 카드 패턴 v2.16 미반영.

**갱신 작업**:
- 탭 (신청 중 / 승인 / 거절 / 취소)
- 각 항목 = GameCard 패턴 + 상단에 신청 상태 뱃지
- 호스트 응답 메시지 (있을 시) 카드 하단 인용 박스
- 모바일 동일

---

## 4. 추가 검토 — Scrim & Series

### 4-1. `/scrim` — 연습경기 매칭 (Scrim.jsx)

**현 시안 상태**: **C등급 — DB 미연결 / 부분 박제**.
**의뢰 옵션**:
- (a) v2.16 GameCard 패턴 (종별 = scrim 그린) 그대로 적용 + 매칭 알고리즘 UI (팀 vs 팀)
- (b) DB 미연결 상태 → 디자인은 우선, 데이터 연결은 후속 PR

**판단**: PM 결정 필요. 본 의뢰에서는 옵션(a) 만 박제, DB 연결은 별도 의뢰.

---

### 4-2. `/series/*` — 시리즈 (Series / SeriesDetail / SeriesCreate)

**현 시안 상태**: A.
**검토 포인트**: 시리즈 상세에서 "이번 대회" / "이전 대회" 매치 목록이 노출되는 경우 v2.16 패턴 (Date Tile + 종별 컬러) 적용 검토. **현재 본 의뢰 범위 외 — 후속 의뢰**.

---

## 5. 우선순위 추천

| 순위 | 페이지 | 이유 | 예상 산출 |
|---|---|---|---|
| 1 | `/games/my-games` (3-1) | 사용자 일상 사용 빈도 ↑↑ | MyGames.jsx 갱신 |
| 2 | `/live/[id]` 진행 중 (2-5) | LIVE 화면 = 임팩트 ↑ + 시안 갭 큼 | Live.jsx 갱신 / LiveInProgress.jsx 신규 |
| 3 | `/tournaments/[id]/schedule` (2-2) | 대회 참가자 + 관전자 진입 | TournamentSchedule.jsx 신규 |
| 4 | `/tournaments/[id]/bracket` (2-1) | 대회 절정 화면 | TournamentBracket.jsx 신규 |
| 5 | `/games/[id]/edit` (3-2) | 개설과 일관성 | GameEdit.jsx 갱신 |
| 6 | `/tournaments/[id]/teams` (2-3) | 데이터 풍부도 ↑ | TournamentTeams.jsx 신규 |
| 7 | `/guest-apps` (3-4) | 카드 패턴 일관 | GuestApps.jsx 갱신 |
| 8 | `/games/[id]/guest-apply` (3-3) | 동일 | GuestApply.jsx 갱신 |
| 9 | `/live` 목록 (2-4) | 시안 부재 | Live.jsx 신규 |
| 10 | `/scrim` (4-1) | C → A 승격 | Scrim.jsx 갱신 |

---

## 6. 출력 형식

각 페이지마다 다음 산출물 제공:

1. **screens/{Name}.jsx** — React 시안 (BDR-current/screens/ 추가)
2. **assumptions** — DB 출처 / 라우트 / 카드 컴포넌트 재사용 명시
3. **states** — filled / empty / loading / error 최소 2개
4. **mobile** — 720px 분기 변형 (별도 viewport mock)
5. **screenshots** (옵션) — PC + 모바일 캡처
6. **자체 검수** — 06-self-checklist 모든 항목 ✅

---

## 7. 데이터 출처 (BDR-current/data.jsx 참고)

본 의뢰 페이지에서 사용할 mock 데이터 스키마:

```js
// Game
{ id, kind: 'pickup'|'guest'|'scrim', date, time, area, place,
  isRecurring, isFree, fee, title,
  host: { id, nickname, avatar }, filled, total, closingSoon,
  description, conditions: { minLevel, position[] } }

// Tournament
{ id, name, divisions: ['3x3M', '3x3W', '5x5M'],
  matches: [{ id, division, group, round, court, time,
              teamA: { id, name, logo, score }, teamB: {...},
              status: 'scheduled'|'live'|'final' }],
  teams: [{ id, name, logo, division, seed, players: [...] }] }

// Live
{ gameId, kind, teamA: {...}, teamB: {...},
  scoreA, scoreB, quarter, timeLeft, status: 'live'|'final' }
```

→ 운영 DB 미반영 필드는 `// TODO DB` 코멘트 처리.

---

## 8. 차단 / 위반 가드

- ❌ 핑크/살몬/코랄 — `--kind-*` + `--bdr-red` + `--cafe-blue` + `--ok` + `--warn` 만 사용
- ❌ lucide-react — Material Symbols Outlined 만
- ❌ 9999px pill — 4px 라운딩 (정사각 원형은 50% OK)
- ❌ "예: " 시작 placeholder
- ❌ AppNav main bar 우측에 dropdown / 아바타 추가
- ❌ 신규 메인 탭 추가
- ❌ DB 미지원 기능을 시안에 (예: 슈팅 차트 = DB 연결 검토 필요)

위반 발견 시 즉시 중단 + PM 보고.

---

## 9. 산출물 패키지 — zip 전달

작업 완료 시 다음 구조로 zip 패키지 (`BDR v2.17.zip` 가정):

```
Dev/design/BDR v2.17/
├── README.md                     # 본 의뢰 응답 요약
├── screens/
│   ├── MyGames.jsx                 (갱신)
│   ├── LiveInProgress.jsx          (신규 — 라이브 진행 중)
│   ├── Live.jsx                    (갱신 — 목록)
│   ├── TournamentSchedule.jsx      (신규)
│   ├── TournamentBracket.jsx       (신규 — 사용자용)
│   ├── TournamentTeams.jsx         (신규)
│   ├── GameEdit.jsx                (갱신)
│   ├── GuestApply.jsx              (갱신)
│   ├── GuestApps.jsx               (갱신)
│   └── Scrim.jsx                   (갱신)
├── tokens.css                     (v2.16 base + 다크 변형 추가)
├── games.css                       (확장 — bracket / schedule / live)
└── screenshots/                   (각 페이지 PC + 모바일)
```

zip 받은 후 PM 이 `BDR-current/` 동기화 (워크플로우 5단계).

---

## 10. 첫 응답 표준 (다시 명시)

```
✅ BDR 디자인 의뢰 확인 — 경기 탭 갭 보완 (v2.16 후속)
이해: 미구현 5건 (bracket/schedule/teams/live목록/live진행중) + v2.16 언어 확장 4건 (my-games/edit/guest-apply/guest-apps) + 옵션 1건 (scrim)
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피
자체 검수: 06 §A,B,C,D 전체
우선순위 §5 표 1~10번 순서로 진행
작업 시작 → 1번 (/games/my-games) 부터.
```
