# 라이브 경기 페이지 v2.17 박제 CLI 작업지시서

> **작성일**: 2026-05-20
> **트리거**: v2.17 시안 zip 업로드 (`BDR v2.17.zip` 또는 그에 준하는 파일) — 클로드 디자인 의뢰 (`live-gap-design-prompt-2026-05-20.md`) 산출물 도착 후
> **수행 주체**: `mybdr/` 레포 CLI 클로드 (Claude Code / Cursor)
> **선행 조건**: PM 수빈의 Phase 0 결정 4건 (아래 §0) + zip 도착
> **참조 룰**: CLAUDE.md §🗂️ Dev/design 워크플로우 5단계 + §🔄 운영 → 시안 동기화 + §⚡ 에이전트 실행 규칙
> **대상 페이지**: `/live/[id]` (in-progress) + `/live/[id]` finished 분기 (LiveResult)

---

## 0. ✅ Phase 0 — PM 결정 필요 (시작 전 작성)

박제 진행 전 결정 4건 — 아래 답변 채우고 시작.

### 0-1. Q1 채팅 사이드바 → [ ] 채택 옵션 = **C** (YouTube 채팅 통합 / 권장)

- **A** = 제거 (단순)
- **B** = "Coming soon" placeholder 유지
- **C** = `youtube_video_id != null` 분기 — YouTube live chat iframe (`https://www.youtube.com/live_chat?v=<id>&embed_domain=<host>`) 임베드. NULL 이면 영역 hidden.

### 0-2. Q2 액션 버튼 (좋아요/저장/공유/신고) → [ ] 채택 옵션 = **B** (공유만 / 권장)

- **A** = 모두 제거
- **B** = 공유만 유지 — `navigator.share()` (지원 시) + URL 복사 fallback. 좋아요·저장·신고는 제거.

### 0-3. Q3 해설 참여 신청 → [ ] 채택 옵션 = **A** (제거 / 권장)

- **A** = 본 박제에서 영구 제거
- **B** = "준비 중" placeholder 보존

### 0-4. Q4 시청자 수 카운트 → [ ] 채택 옵션 = **A** (YouTube 분기 / 권장)

- **A** = `youtube_video_id != null` 시 YouTube API `liveStreamingDetails.concurrentViewers` 표시 / NULL 시 hidden
- **B** = 모두 제거

→ PM 답변 받은 후 옵션 ID 위에 체크 + `01-user-design-decisions.md` §13 영구 추가 후 박제 시작.

---

## 1. Phase 1 — BDR-current 동기화 (zip 도착 후 즉시 진행)

CLAUDE.md §🗂️ 워크플로우 5단계 따름.

### 1-1. 사전 점검

```bash
# subin 브랜치 확인 + .env 안전 가드
git status -sb
git checkout subin
git pull origin subin

# 현재 BDR-current 상태
cat "Dev/design/BDR-current/README.md" | head -10
ls "Dev/design/BDR-current/screens/" | grep -iE "Live|GameResult"
# → Live.jsx + LiveResult.jsx + GameResult.jsx 확인

# uploads 디렉터리에 zip 도착 확인
ls -la /mnt/c/Users/*/AppData/Roaming/Claude/local-agent-mode-sessions/*/local_*/uploads/ 2>/dev/null | grep -i "BDR v2" | tail -5
```

→ PM 보고: "현재 BDR-current = v2.16. v2.17 zip 도착. 동기화 진행해도 될까요?" 승인 후 진행.

### 1-2. zip → 임시 폴더 풀이

```bash
mkdir -p /tmp/bdr_v2.17_sync
cd /tmp/bdr_v2.17_sync
unzip -q "/path/to/uploads/BDR v2.17.zip"
ls
# 기대: Dev/design/BDR v2.17/ 또는 zip 최상위 screens/Live.jsx + LiveResult.jsx + _live_in_progress_preview.html
```

### 1-3. 기존 BDR-current → _archive/BDR v2.16/ 이동

```bash
cd /path/to/mybdr
mv "Dev/design/BDR-current" "Dev/design/_archive/BDR v2.16"
git add -A "Dev/design/_archive/BDR v2.16"
```

### 1-4. v2.17 → BDR-current/ 카피 + 누락 자산 보강

v2.17 폴더가 **델타** (Live + LiveResult + preview HTML + data.jsx 확장만) 일 가능성 → v2.16 base 위에 v2.17 델타 덮어쓰기.

```bash
# Step 1: 직전 버전 (_archive/BDR v2.16) 복사 → BDR-current
cp -r "Dev/design/_archive/BDR v2.16" "Dev/design/BDR-current"

# Step 2: v2.17 델타 덮어쓰기
cp "/tmp/bdr_v2.17_sync/Dev/design/BDR v2.17/screens/Live.jsx" "Dev/design/BDR-current/screens/Live.jsx"
cp "/tmp/bdr_v2.17_sync/Dev/design/BDR v2.17/screens/LiveResult.jsx" "Dev/design/BDR-current/screens/LiveResult.jsx"
cp "/tmp/bdr_v2.17_sync/Dev/design/BDR v2.17/_live_in_progress_preview.html" "Dev/design/BDR-current/_live_in_progress_preview.html"
cp "/tmp/bdr_v2.17_sync/Dev/design/BDR v2.17/data.jsx" "Dev/design/BDR-current/data.jsx"

# Step 3: zip 최상위 screens/ 가 가장 최신일 수 있음 — 비교 후 덮어쓰기
ls -la /tmp/bdr_v2.17_sync/screens/Live.jsx "Dev/design/BDR-current/screens/Live.jsx" 2>/dev/null
# 더 최신 파일이 zip 최상위에 있으면 덮어쓰기
```

→ **주의**: zip 최상위 `screens/Live.jsx` 가 `Dev/design/BDR v2.17/screens/Live.jsx` 보다 최신일 가능성. 더 큰 + 더 늦은 mtime 파일 = 최신으로 선택.

### 1-5. _archive/ 옛 폴더 정리

```bash
# v2.17 도 _archive 보존 (원본 zip 폴더)
mv "/tmp/bdr_v2.17_sync/Dev/design/BDR v2.17" "Dev/design/_archive/BDR v2.17"

# 정리 완료 후 임시 폴더 제거
rm -rf /tmp/bdr_v2.17_sync
```

### 1-6. README.md 갱신

`Dev/design/BDR-current/README.md` 첫 5줄 갱신:

```markdown
# BDR-current = v2.17 (v2.16 base + v2.17 라이브 페이지 풀스택 박제)

## 작업 요약 (2026-05-20)

v2.16 → v2.17 동기화. **라이브 경기 페이지 (/live/[id]) 풀스택 박제 가능 시안 완성.**

- Live.jsx 전면 재박제 ✅ — Hero / YouTube / 같은날 Rail / 쿼터 / 박스스코어 / PBP / 운영자 액션바 / 5상태 분기 / period_format 2종
- LiveResult.jsx 갱신 ✅ — period_format 분기 + 같은날 Rail 통합
- _live_in_progress_preview.html 신규 ✅ — 5상태 + period + isAdmin + youtube 분기 통합 시연
- data.jsx 확장 ✅ — LIVE_MATCH_SAMPLES 5상태 (scheduled/warmup/live/halftime/finished)
- PM 결정 §13 — 채팅·액션·해설·시청자 4건 영구 보존
```

### 1-7. claude-project-knowledge 갱신

`Dev/design/claude-project-knowledge/04-page-inventory.md`:
- `/live/[id]` 등급 **C → A** 승격 (in-progress / finished 모두 박제 가능)
- `/live` 목록 등급 검토 (별도 의뢰 시 처리)

`Dev/design/claude-project-knowledge/01-user-design-decisions.md`:
- §13 신규 추가 — 라이브 페이지 PM 결정 4건 (§0 답변 기준)

### 1-8. commit + push

```bash
git add Dev/design/
git commit -m "design: BDR-current sync v2.17 (Live 풀스택 박제 + PM 결정 §13)"
git push origin subin
```

→ PM 보고: "Phase 1 완료. BDR-current = v2.17. 영향 페이지 0 (시안 폴더만 갱신). Phase 2 박제 진행해도 될까요?"

---

## 2. Phase 2 — 운영 박제 (UI 만 / API·데이터 패칭 0 변경)

**범위 가드 (CLAUDE.md "리디자인: API/데이터 패칭 유지 + UI만 변경" 룰 절대 준수)**:
- ✅ 변경 OK: JSX 구조 / CSS / 컴포넌트 분리 / 스타일 토큰 / 모바일 분기 / 시각 디테일
- ❌ 변경 X: API 호출 / fetch 로직 / state 구조 / TypeScript interface / PBP 라벨 (이미 운영) / period_format 분기 (이미 운영)

### 2-1. 박제 대상 파일 (영향 범위)

```
src/app/live/[id]/page.tsx                (2662줄 — 메인 렌더 + 상태 관리)
src/app/live/[id]/_v2/hero-scoreboard.tsx (Hero band)
src/app/live/[id]/_v2/box-score-table.tsx (박스스코어 — 쿼터 필터)
src/app/live/[id]/_v2/live-match-card-rail.tsx (같은 날 Rail)
src/app/live/[id]/_v2/live-match-card.tsx (Rail 카드)
src/app/live/[id]/_v2/youtube-embed.tsx   (YouTube sticky/PIP)
src/app/live/[id]/_v2/match-youtube-modal.tsx (운영자 YouTube 등록)
src/app/live/[id]/_v2/match-jersey-override-modal.tsx (운영자 jersey)
src/app/live/[id]/_v2/game-result.tsx     (finished 분기 — LiveResult 박제)
src/app/live/[id]/_v2/mvp-banner.tsx      (MVP)
src/app/live/[id]/_v2/tab-*.tsx           (탭 5종 — finished)
```

운영자 권한 검증 / PBP 포맷 / API 폴링 / interface 정의 = **변경 0**.

### 2-2. 박제 순서 (Phase 2.1 ~ 2.5)

#### Phase 2.1 — Hero band 박제

**시안 source**: `Dev/design/BDR-current/screens/Live.jsx` §3-1 §4-1 + `_live_in_progress_preview.html` 의 hero 영역

**대상**: `src/app/live/[id]/_v2/hero-scoreboard.tsx`

**핵심 변경**:
- 데스크톱 5단 grid 레이아웃 보존 + 모바일 2행 stack 분기 강화 (720px 기준)
- Pretendard 900 점수 (모바일 56px / PC 96px)
- 5상태 분기 라벨 (scheduled / warmup / live / halftime / finished) — 시안 카피 그대로
- period_format 분기 ("Q3 · 5:24" vs "후반 · 5:24")
- LIVE pulse `var(--accent)` + animation pulse 1.5s

**금지**:
- 팀 로고 / 이니셜 배지 디자인 변경 (운영 패턴 보존)
- 운영자 액션바 위치 변경 (우상단 고정)

#### Phase 2.2 — YouTube 임베드 박제

**시안 source**: §4-2 + `_live_in_progress_preview.html` 의 youtube 영역

**대상**: `src/app/live/[id]/_v2/youtube-embed.tsx`

**핵심 변경**:
- 모바일 `sticky top-14` 스타일 보강 (헤더 56px 아래 고정)
- 모바일 4분기점 분기 확인 (360 / 720 / 900 / 1024px — iPhone SE 호환)
- PC PIP 모드 디자인 다듬기 (IntersectionObserver 기반 / 320×180 우하단 + 닫기 버튼 + 본문 복귀 버튼)
- 상태 3종 시각 분기 (manual / auto_verified / auto_pending — ✓ 배지 분기)
- LIVE 뱃지 `animate-ping` 1.5s 깜빡임 애니메이션 보존 (운영 youtube-embed.tsx L140-143)
- `loading="lazy"` + `allowFullscreen` 명시

**보존 (변경 0)**:
- iframe `src` 도메인 = **youtube-nocookie.com** (CSP 화이트리스트 일치 — 변경 시 CSP 갱신 필요)
- iframe `allow` 화이트리스트: `autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share`

**금지**:
- youtube_video_id NULL 일 때 영역 마운트 X (영원히 hidden) — 사용자 결정 §13 보존
- iframe src 변경 X (현재 PR3 패턴 보존)
- youtube.com (nocookie 아닌) 변경 X (privacy + CSP)

#### Phase 2.2-1 — YouTube 자동 등록 폴링 (PR-C) 검수

**대상**: `src/app/live/[id]/page.tsx` L695-803 (auto-register useEffect)

**검수 항목 (변경 0 — 로직 보존)**:
- `setInterval(30000)` 30초 주기 폴링 유지
- 의존성 5 key 보존: `match.id` / `youtube_video_id` / `status` / `scheduled_at` / `started_at`
- 시작 ±10분 윈도우 가드 보존
- 멈춤 조건 3가지 보존:
  1. `already_registered` → fetchMatch refetch + interval clear
  2. `match_not_live` → interval clear
  3. 윈도우 벗어남 → 폴링 시작 X 또는 중단
- 응답 처리 (`apiSuccess` snake_case 자동 변환) 보존: `{ registered, reason, video_id, score, status, match_status }`

**UI 박제만**:
- `autoRegisterActive` 토스트 위치 / 스타일 / 카피만 시안 일치 (운영자 한정)
- 카피: "BDR 채널에서 자동 검색 중..." (5단어 이내)

**금지**:
- 폴링 interval 변경 X (30초 보존)
- 멈춤 조건 변경 X
- 의존성 추가 X (성능 저하 위험)

#### Phase 2.2-2 — MatchYouTubeModal 박제

**시안 source**: §4-1 + §4-7-1

**대상**: `src/app/live/[id]/_v2/match-youtube-modal.tsx`

**핵심 변경 (UI 만)**:
- 수동 입력 탭 / 자동 검색 탭 — 탭 UI 토큰 일치 (v2.16 카드 패턴)
- URL/ID 검증 입력 필드 — iOS 16px / 44px 터치 타겟
- 자동 검색 결과 카드 — 신뢰도 분기 (≥80 자동 등록 / 60~79 대기 / <60 무시)
- 현재 영상 삭제 버튼 — `var(--err)` outline 패턴

**보존 (운영 안전장치)**:
- `window.confirm("등록된 YouTube 영상을 삭제하시겠습니까?")` 안전장치 (L309-343)
- `onSave` 콜백 → 라이브 페이지 `fetchMatch` refetch (L195, 235, 264)
- 수동 URL 정규식 파싱 (`youtube\.com/watch\?v=|youtu\.be/|youtube\.com/live/`)

**금지**:
- API 엔드포인트 변경 X (POST/DELETE `/youtube-stream` 보존)
- `skipVerify` 플래그 변경 X

#### Phase 2.3 — 같은 날 매치 Rail 박제

**시안 source**: §4-6 + v2.16 Date Tile 카드 패턴

**대상**: `src/app/live/[id]/_v2/live-match-card-rail.tsx` + `live-match-card.tsx`

**핵심 변경**:
- Date Tile 적용 (v2.16 카드 패턴 — 종별 컬러 좌측 컬럼)
- 현재 매치 카드 `var(--accent)` 외곽선 강조
- 드래그 + 휠 스크롤 + 좌우 화살표 버튼

**금지**:
- `same_day_matches.length <= 1` 시 Rail 자체 null 반환 (Q4 가변 보존)

#### Phase 2.4 — 박스스코어 / 쿼터 / PBP 박제

**시안 source**: §4-3 / §4-4 / §4-5

**대상**:
- `src/app/live/[id]/_v2/box-score-table.tsx` (박스스코어)
- `src/app/live/[id]/page.tsx` 내 QuarterScoreTable 섹션 (쿼터)
- `src/app/live/[id]/page.tsx` 내 PbpSection (PBP)

**핵심 변경 (UI 만)**:
- 쿼터 필터 버튼 디자인 토큰 일치 (전체/Q1~4/OT) — `quarter_stats` 키 "1"~"5" 매핑 보존
- DNP 섹션 회색 흐림 (`opacity: 0.5`) + 셀별 "-" 채움 (NBA 스타일) + "출전 없음" 라벨 강화
- 스타팅 5 상단 + 후보 중단 + DNP 하단 별도 섹션 구조 보존
- **PTS 좌측 띠 + 팀색** 보존 (운영 L1797-1820 — 라이트 모드 가독성 가드)
- **PC zoom 1.1** 보존 (운영 L984 — 박스스코어 가독성 강화)
- PBP 팀 칩 가독성 가드 (`var(--surface)` bg + 팀색 텍스트) — 운영 패턴 보존
- 모바일 가로 스크롤 (#/이름 sticky)
- period_format 분기 시각:
  - `"quarters"` → "Q1 / Q2 / Q3 / Q4 / OT1+"
  - `"halves"` → "전반 / 후반 / OT1+" (Hero / 쿼터 테이블 / PBP / 박스 4곳 모두)
- **PlayerLink / TeamLink** 보존 (2026-05-10 마이그 — `user_id != null` 시 공개 프로필 라우팅)
- **이벤트 미박제 매치** (`has_quarter_event_detail: false`) — 쿼터 필터 활성 시 안내 배너 + 스탯 "-" 표시 (운영 L1440-1452)

**금지**:
- `formatPbpAction()` 매핑 변경 X (이미 운영 PR — 한글 라벨 / `src/lib/live/pbp-format.ts` 보존)
- 쿼터별 스탯 집계 로직 변경 X (sharedPlayers.quarter_stats)
- `period_format` 분기 로직 변경 X (2026-05-16 긴급 박제 보존)
- `PlayerLink` / `TeamLink` 컴포넌트 변경 X (운영 라우팅 보존)

#### Phase 2.4-1 — 프린트 / PDF 다운로드 박제 (2026-04-16 사용자 박제 — 필수)

**대상**:
- `src/app/live/[id]/_v2/print-options-dialog.tsx` (프린트 옵션 다이얼로그)
- `src/app/live/[id]/_v2/print-box-score.tsx` (프린트 출력 영역)
- `src/app/live/[id]/page.tsx` L827-935 (PDF 생성 로직) + L2237-2443 (다이얼로그 트리거)

**핵심 변경 (UI 만)**:
- 다이얼로그 매트릭스 시안 일치 (팀 × 기간 = 홈/원정 × 누적/Q1/Q2/Q3/Q4/OT 체크박스)
- 기본값 보존 — 양팀 누적 체크 / 쿼터 미체크
- 모드 분기 시각 (system / pdf 라디오 또는 토글)
- `pdfGenerating` overlay UI — "PDF 생성 중..." (5단어 이내) + spinner
- 프린트 / PDF 다운로드 버튼 — 박스스코어 우상단 (PC 텍스트+아이콘 / 모바일 아이콘만)

**보존 (로직 0 변경)**:
- `system` 모드 = `window.print()` 호출
- `pdf` 모드 = `html2canvas` + `jspdf` 자동 다운로드 (모바일 호환)
- `printSections` 동적 생성 — 선택 옵션 조합별 PrintBoxScoreTable 다중 렌더
- `#box-score-print-area` 화면 hidden / 인쇄 시 block
- `data-print-hide` CSS 클래스 — 인쇄 시 숨길 영역 마커
- `data-live-root` 프린트 타겟 (2026-04-15 운영 L1082)

**금지**:
- html2canvas / jspdf 의존성 변경 X (운영 호환)
- 프린트 영역 ID 변경 X (CSS @media print 룰 일치)

#### Phase 2.5 — 운영자 액션바 + 모달 박제

**시안 source**: §4-7 + §4-7-1

**대상**:
- `src/app/live/[id]/page.tsx` 내 운영자 헤더 영역
- `src/app/live/[id]/_v2/match-youtube-modal.tsx` (Phase 2.2-2 에서 이미 박제)
- `src/app/live/[id]/_v2/match-jersey-override-modal.tsx`

**핵심 변경 (UI 만)**:
- 4 버튼 정렬:
  1. **기록하기** (canRecord — PR-Live2 2026-05-15) — `var(--accent)` primary + `Link` to `/score-sheet/[matchId]`
  2. **임시 jersey 번호** (isAdmin + W1 매치 — Phase 1 PR4 2026-05-05) — secondary outline
  3. **YouTube 등록** (isAdmin — PR4+PR5 2026-05-09) — secondary outline
  4. **자동검색 상태** (autoRegisterActive — PR-C) — 토스트 (§4-2-1)
- 모바일 텍스트 hidden → 아이콘만 (PC 텍스트+아이콘) + 44px 터치 타겟
- 모달 카드 패턴 v2.16 일치

**보존 (운영 안전장치)**:
- `isAdmin` / `canRecord` 분기 로직 보존 (admin-check API 통과 + recorder/organizer/TAM 권한)
- `transientError` state 처리 (2026-05-02 — 429/5xx/네트워크 에러 일시적 처리)
- 일반 사용자에게는 운영자 UI 0 노출 (`isAdmin: false` 시 mount 0)

**금지**:
- isAdmin / canRecord 분기 로직 변경 X
- admin-check API 호출 변경 X
- jersey override W1 매치 가드 변경 X

### 2-3. 자체 검수 (각 Phase 끝)

```bash
# 1. lucide-react import 0
rg -n "from ['\"]lucide-react" src/app/live/

# 2. 핑크 / 살몬 / 코랄 0
rg -n "#FF[8AB][0-9A-Fa-f]{4}|pink-[0-9]|salmon|coral" src/app/live/

# 3. 하드코딩 hex 0 (var(-- 안 fallback 외)
rg -nE "#[0-9A-Fa-f]{3,8}" src/app/live/ | grep -v "var(--"

# 4. pill 9999px 0 (아바타 / dot / LIVE pulse 외)
rg -nE "border-radius:\s*9999px|rounded-full" src/app/live/

# 5. YouTube 도메인 보존 — youtube-nocookie.com 필수 (CSP 일치)
rg -n "youtube\.com/embed" src/app/live/[id]/_v2/youtube-embed.tsx
# → youtube-nocookie.com 만 매칭 기대 / youtube.com (nocookie 없음) 0건

# 6. YouTube iframe allow 화이트리스트 보존
rg -n "allow=" src/app/live/[id]/_v2/youtube-embed.tsx
# → autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share 포함

# 7. animate-ping LIVE 뱃지 보존
rg -n "animate-ping" src/app/live/[id]/_v2/youtube-embed.tsx
# → 1건 이상 매칭 기대 (운영 L140-143)

# 8. YouTube DELETE confirm() 안전장치 보존
rg -n "confirm\(" src/app/live/[id]/_v2/match-youtube-modal.tsx
# → 1건 이상 매칭 기대 (운영 L309-343)

# 9. 자동 등록 폴링 30초 + 의존성 5 key 보존
rg -n "setInterval\(.*30000\|interval.*30000" src/app/live/[id]/page.tsx
# → 1건 매칭 기대 (auto-register useEffect)

# 10. PlayerLink / TeamLink 마이그 보존
rg -n "PlayerLink|TeamLink" src/app/live/[id]/page.tsx
# → 다수 매칭 기대 (박스스코어 + 쿼터 + MVP)

# 11. period_format 분기 보존
rg -n 'period_format|"halves"|"quarters"' src/app/live/[id]/page.tsx
# → 다수 매칭 기대 (Hero / 쿼터 / PBP / 박스 4곳)

# 12. formatPbpAction 호출 보존
rg -n "formatPbpAction" src/app/live/[id]/page.tsx
# → 1건 이상 매칭 기대 (PBP 행 렌더)

# 13. lighthouse / 빌드
npm run lint
npm run typecheck
npm run build  # vercel preview 확인용
```

### 2-4. 회귀 검수 (Phase 19 4 케이스)

본 박제는 라이브 페이지만 — AppNav 변경 0 이지만 그래도 회귀 검수:

```bash
# AppNav 회귀 4 케이스 — 라이브 페이지 박제 도중 AppNav 영향 0 확인
rg -n "더보기 ▼|RDM rdm_captain" src/components/bdr-v2/app-nav.tsx
# → 0 매칭 기대

rg -n "btn btn--sm.*title=.검색" src/components/bdr-v2/app-nav.tsx
# → 0 매칭 기대

rg -n "라이트.*다크" src/components/bdr-v2/app-nav.tsx | grep -v "768px\|sm:\|md:"
# → 모바일 듀얼 라벨 노출 0 확인 (분기 있어야 OK)
```

---

## 3. Phase 3 — 운영 검증

### 3-1. 로컬 검증 (PM 직접 확인)

```bash
# subin 브랜치에서
npm run dev  # http://localhost:3001/live

# 5 상태 분기 시각 확인
# /live/[id] 에 진행 중 매치 ID 입력 → live 분기
# /live/[id] 에 finished 매치 ID 입력 → LiveResult 분기

# 모바일 (DevTools 360×640)
# - Hero 2행 stack 확인
# - YouTube sticky top-14 확인
# - 박스스코어 / PBP 가로 스크롤 확인
```

### 3-2. Playwright 자동 검증 (선택)

```typescript
// e2e/live-page.spec.ts (신규)
test('라이브 페이지 5상태 분기 시각 회귀', async ({ page }) => {
  for (const status of ['scheduled', 'warmup', 'live', 'halftime', 'finished']) {
    await page.goto(`/live/${MATCH_IDS[status]}`);
    await expect(page.locator('[data-hero-status]')).toHaveText(STATUS_LABEL[status]);
    await expect(page).toHaveScreenshot(`live-${status}-desktop.png`);
    await page.setViewportSize({ width: 360, height: 640 });
    await expect(page).toHaveScreenshot(`live-${status}-mobile.png`);
  }
});

test('YouTube 임베드 sticky / PIP', async ({ page }) => {
  await page.goto(`/live/${MATCH_WITH_YOUTUBE}`);
  await page.scroll(0, 800);
  // 모바일 sticky 확인
  await page.setViewportSize({ width: 360, height: 640 });
  const stickyTop = await page.locator('[data-youtube]').evaluate(el => getComputedStyle(el).position);
  expect(stickyTop).toBe('sticky');
});

test('운영자 액션바 노출 분기', async ({ page }) => {
  // 일반 유저 → 0 노출
  await page.goto(`/live/${MATCH_ID}`);
  await expect(page.locator('[data-admin-actions]')).not.toBeVisible();
  // 운영자 → 4 버튼 노출
  // (운영자 세션 setup 후) ...
});
```

### 3-3. 박제 갭 검증 (시안 vs 운영 차이 0)

```bash
# 시안 vs 운영 시각 비교 (스크린샷)
# 1. _live_in_progress_preview.html 5상태 캡처
# 2. 운영 /live/[id] 5상태 캡처 (각 상태별 매치 ID)
# 3. side-by-side 비교 — 갭 1 이상 발견 시 추가 박제
```

→ PM 보고: "Phase 3 완료. 박제 갭 0. PR 생성 준비 완료."

---

## 4. Phase 4 — PR + 머지

### 4-1. PR 생성

```bash
git checkout subin
git add src/app/live/
git commit -m "feat(live): v2.17 풀스택 박제 — Hero / YouTube / Rail / 박스스코어 / PBP / 운영자 액션바 / 5상태 분기"
git push origin subin

# GitHub PR
# subin → dev
# 제목: "feat(live): v2.17 라이브 페이지 풀스택 박제"
# 본문: 박제 요약 + 회귀 검수 결과 + 스크린샷 5상태 PC/모바일 = 10장
```

### 4-2. dev → main 머지 (PM + 원영 권한)

```bash
# subin 브랜치 PR 머지 → dev 갱신 후
# dev → main PR (수빈 또는 원영 권한)
# 본 박제는 Flutter app /api/v1/ 변경 0 → 원영 사전 공지 불필요
```

### 4-3. 운영 → 시안 역방향 동기화 (CLAUDE.md §🔄 룰)

박제 결과 운영 src/ 가 변경됐으나 **이번 박제는 시안 → 운영 방향** 이라 역방향 갱신 0.
단 박제 중 시안에 없는 디테일 추가 시:
- BDR-current/ 시안 같이 갱신 (`screens/Live.jsx` 또는 components.jsx)
- commit `design(sync): 운영 라이브 미세 조정 시안 박제`

---

## 5. 최종 보고 형식

```
✅ Phase 2 — 라이브 경기 페이지 v2.17 박제 완료

박제 갭:
- Hero band: ✅ (5단/2행 / 5상태 / period_format / LIVE pulse)
- YouTube: ✅ (sticky / PIP / 상태 3종)
- 같은 날 Rail: ✅ (Date Tile / 현재 매치 강조)
- 쿼터 점수 테이블: ✅ (period_format 2종 / 진행 쿼터 강조)
- 박스스코어: ✅ (쿼터 필터 / DNP / 모바일 sticky)
- PBP: ✅ (한글 라벨 / 팀 칩 가독성)
- 운영자 액션바: ✅ (기록 / jersey / YouTube / 자동검색)
- LiveResult 갱신: ✅ (period_format / 같은날 Rail / 종별 컬러)

검수 통과:
§1. lucide-react 0건
§2. 핑크·살몬·코랄 0건
§3. 하드코딩 hex 0건 (var(-- 외)
§4. pill 9999px 0건 (아바타·dot·pulse 외)
§5. AppNav 회귀 4 케이스 0건
§6. 5상태 / period_format / isAdmin / youtube 분기 모두 시안 명세 일치
§7. 모바일 720px 분기 + iOS 16px + 44px 터치

API / 데이터 패칭 변경: 0
TypeScript interface 변경: 0
Flutter /api/v1/ 변경: 0 (원영 사전 공지 불필요)

PR: subin → dev 머지 완료. dev → main 대기.
```

---

## 6. 안전 가드 (DB 정책)

CLAUDE.md §🚨 절대 금지 + §🗄️ DB 정책 준수:

- ❌ destructive SQL 없음 (UI 박제만)
- ❌ schema 변경 없음 (Prisma 미사용)
- ✅ 운영 DB 영향 0 (SELECT 0 — 시각 박제만)
- ✅ Flutter /api/v1/ 변경 0 (원영 사전 공지 불필요)
- ✅ `.env` / `.env.local` 변경 0

→ 본 박제는 **운영 영향 0 작업** (§DB 정책 §5) — 안전 가드 자동 통과.

---

## 7. 참고 — 운영 갭 분석 매트릭스 (Phase 2 박제 전 확인)

### 7-1. 큰 기능 9건

| # | 운영 기능 | 박제 전 시안 | 박제 후 시안 |
|---|---|---|---|
| 1 | HeroScoreboard | ❌ | ✅ |
| 2 | 쿼터별 점수 테이블 | ❌ | ✅ |
| 3 | 박스스코어 | ❌ | ✅ |
| 4 | Play-by-Play | ❌ | ✅ |
| 5 | YouTube 임베드 | ❌ | ✅ |
| 6 | 같은 날 매치 Rail | △ | ✅ |
| 7 | 운영자 액션바 | ❌ | ✅ |
| 8 | 상태 5분기 | △ | ✅ |
| 9 | period_format | ❌ | ✅ |

### 7-2. YouTube 풀 인벤토리 18건 (사용자 직접 박제)

| # | 항목 | 박제 단계 |
|---|---|---|
| 1 | YouTubeEmbed 컴포넌트 (16:9 + 라이브/VOD) | Phase 2.2 |
| 2 | youtube_video_id 조건부 마운트 (Q11) | Phase 2.2 |
| 3 | 모바일 sticky top-14 (4분기점 360/720/900/1024) | Phase 2.2 |
| 4 | PC PIP (IntersectionObserver / 320×180) | Phase 2.2 |
| 5 | LIVE 뱃지 animate-ping 1.5s | Phase 2.2 |
| 6 | youtube-nocookie.com 도메인 | Phase 2.2 (보존) |
| 7 | iframe allow 화이트리스트 | Phase 2.2 (보존) |
| 8 | MatchYouTubeModal 수동 입력 탭 | Phase 2.2-2 |
| 9 | MatchYouTubeModal 자동 검색 탭 (BDR 채널) | Phase 2.2-2 |
| 10 | 현재 영상 삭제 + confirm() | Phase 2.2-2 (보존) |
| 11 | youtube_status 3종 (manual/auto_verified/auto_pending) | Phase 2.2 |
| 12 | isAdmin 권한 분기 (admin-check) | Phase 2.5 (보존) |
| 13 | onSave 콜백 + fetchMatch refetch | Phase 2.2-2 (보존) |
| 14 | auto-register 30초 폴링 | Phase 2.2-1 (보존) |
| 15 | autoRegisterActive 토스트 (운영자 한정) | Phase 2.2-1 |
| 16 | 폴링 의존성 5 key 최소화 | Phase 2.2-1 (보존) |
| 17 | 폴링 멈춤 조건 3가지 | Phase 2.2-1 (보존) |
| 18 | apiSuccess snake_case 응답 처리 | Phase 2.2-1 (보존) |

### 7-3. 사용자 박제 디테일 22건 (시간순)

| # | 일자 | PR/Phase | 박제 단계 |
|---|---|---|---|
| 1 | 2026-04-15 | 쿼터 필터 + DNP 분리 | Phase 2.4 (보존) |
| 2 | 2026-04-15 | zoom 1.1 (PC 박스스코어) | Phase 2.4 (보존) |
| 3 | 2026-04-15 | 팀 로고 object-contain | Phase 2.1 (보존) |
| 4 | 2026-04-15 | 팀명 brightness 자동 색상 | Phase 2.1 (보존) |
| 5 | 2026-04-15 | 4/11~12 클럭 부정확 안내 | Phase 2.1 (보존) |
| 6 | 2026-04-15 | DNP NBA 스타일 cell 채움 | Phase 2.4 (보존) |
| 7 | 2026-04-15 | PTS 좌측 띠 + 팀색 가독성 | Phase 2.4 (보존) |
| 8 | 2026-04-15 | 쿼터별 집계 (quarter_stats) | Phase 2.4 (보존) |
| 9 | 2026-04-16 | 프린트 옵션 다이얼로그 | Phase 2.4-1 |
| 10 | 2026-04-16 | 프린트 전용 영역 + printSections | Phase 2.4-1 (보존) |
| 11 | 2026-04-16 | has_quarter_event_detail 안내 | Phase 2.4 (보존) |
| 12 | 2026-04-16 | PDF 모드 (html2canvas+jspdf) | Phase 2.4-1 (보존) |
| 13 | 2026-04-16 | pdfGenerating overlay | Phase 2.4-1 |
| 14 | 2026-04-17 | 모바일 미니스코어 제거 | (이미 운영) |
| 15 | 2026-04-22 | GameResult v2 분기 (finished) | Phase 2.6 (LiveResult) |
| 16 | 2026-04-30 | LiveResult 회귀 픽스 | Phase 2.6 (보존) |
| 17 | 2026-05-02 | transientError 일시 에러 처리 | Phase 2.5 (보존) |
| 18 | 2026-05-05 | jersey override 모달 (W1) | Phase 2.5 (보존) |
| 19 | 2026-05-10 | PlayerLink/TeamLink 마이그 | Phase 2.4 (보존) |
| 20 | 2026-05-15 | PR-Live2 score-sheet 진입 | Phase 2.5 (보존) |
| 21 | 2026-05-16 | PBP 한글 라벨 (formatPbpAction) | Phase 2.4 (보존) |
| 22 | 2026-05-16 | period_format halves/quarters | Phase 2.1/2.4 (보존) |

→ 박제 후 모든 운영 기능 (큰 9건 + YouTube 18건 + 박제 디테일 22건) 시안 1:1 반영 + 운영 로직 0 변경 = A 등급 박제.
