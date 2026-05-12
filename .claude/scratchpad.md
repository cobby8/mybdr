# 작업 스크래치패드

## 현재 작업
- **요청**: FIBA SCORESHEET 정밀 정합 검증 + 미세 차이 인벤토리 (reviewer, 분석만)
- **상태**: ✅ 리뷰 완료 (FIBA PDF 1:1 이미지 측정 + 6 컴포넌트 + _print.css 정밀 대조)
- **모드**: no-stop / 코드 변경 0

## 리뷰 결과 (reviewer) — FIBA Phase 10 정밀 정합 검증 (2026-05-12)

### 종합 판정: **🟡 미세 fix 필요** (Critical 1 + Major 3 + Minor 8 / A4 fit ✓ / 핵심 룰 준수 ✓)

거의 다 됐다 — 사용자 평가 정확. 미세 차이 12건 인벤토리 + Phase 11 권장.

### FIBA PDF 측정값 (이미지 직접 분석)

| 영역 | FIBA PDF | 측정값 |
|------|---------|--------|
| 헤더 로고 | FIBA 로고 (좌상) | ~50×50px 정사각 / 검정 농구공 + "FIBA" |
| 헤더 타이틀 | "FEDERATION INTERNATIONALE DE BASKETBALL" 1줄 + "INTERNATIONAL BASKETBALL FEDERATION" 1줄 + "SCORESHEET" 큰 굵은 글씨 1줄 | 우측 정렬 / 11pt regular + 14pt bold |
| Team A/B 라벨 | "Team A" / "Team B" 큰 굵은 글씨 (헤더 메타 위 한 줄) | ~12pt bold + underscore (긴 줄) |
| 헤더 메타 | 1줄: Competition / Date / Time / Referee // 2줄: Game No / Place / Umpire 1 / Umpire 2 | 4 컬럼 라벨 + underscore |
| Team A/B 블록 헤더 | "Team A" 큰 글씨 (Team B 도 동일) | ~12pt bold 좌측 정렬 |
| Time-outs | 5칸 빈 박스 (위 1줄 5개) | ~22×22 정사각 |
| Team fouls | "Period ① 1 2 3 4 / Period ② 1 2 3 4 / Period ③ 1 2 3 4 / Period ④ 1 2 3 4 / Extra periods" | **숫자 1·2·3·4 박스 안에 라벨 있음** ⚠️ |
| Players 표 | Licence no. / Players / No. / Player in / Fouls 1 2 3 4 5 | **16행 / 헤더 줄에 "1 2 3 4 5" 라벨** ⚠️ |
| Coach / Asst Coach | "Coach: ___" / "Assistant Coach: ___" 한 줄 | 좌측 정렬 underscore |
| Running Score | "RUNNING SCORE" 큰 헤더 + A|B 4세트 × 40행 + 좌우 숫자 (1~40 / 41~80 / 81~120 / 121~160) | **각 행 좌측 + 우측에 행번호 양쪽 표시** ⚠️ |
| Period scores | "Scores Period ① A___ B___" 4줄 + "Extra periods A___ B___" | 우측 정렬 / underscore |
| Final Score | "Final Score Team A___ Team B___" 1줄 | underscore |
| Name of winning team | "Name of winning team ___" 1줄 | underscore |
| 풋터 운영진 | **Scorer / Assistant scorer / Timer / Shot clock operator = 4줄 세로 누적** ⚠️ | 각각 한 줄 + 긴 underscore |
| 풋터 심판 | Referee / Umpire 1 / Umpire 2 = 1줄 가로 (혹은 Referee 1줄 + Umpire 1·2 1줄) | underscore |
| 풋터 Captain | "Captain's signature in case of protest" 1줄 (맨 하단) | underscore |

### 정합 매트릭스 (10 영역)

| # | 영역 | FIBA PDF | 현재 mybdr | 정합 | Phase 11 fix |
|---|------|---------|-----------|------|-----------|
| 1 | **헤더 타이틀** | FIBA 로고 + "FED INTL DE BASKETBALL / INTL BASKETBALL FED / SCORESHEET" 3줄 우정렬 | BDR 로고 + "Basketball Daily Routine" + "SCORESHEET" 2줄 | 🟢 **BDR 브랜드 결재 보존** (§A) | — |
| 2 | **헤더 메타** | Team A/B 라벨 큰 박스 + Competition/Date/Time/Referee 1줄 + Game No/Place/Umpire 1/2 1줄 | 동일 구조 ✓ | 🟢 정합 | — |
| 3 | **Team A 블록 (Players 행수)** | **16행** | **15행** (Phase 10) | 🟡 1행 차이 | fillRowsTo15 → **fillRowsTo16** (Minor) |
| 4 | **Team A 블록 (Team fouls)** | 박스 안에 숫자 "1 2 3 4" **표시** (FIBA 원본 라벨) | Phase 10 §F = 빈 박스 + 마킹 시 검정 채움 (라벨 폐기) | 🔴 **FIBA 원본 위반** ⚠️ | **Critical** §F 결재 재검토 (FIBA 원본은 숫자 라벨 있음) |
| 5 | **Team A 블록 (Player Fouls 헤더)** | 헤더에 "Fouls 1 2 3 4 5" 박스 숫자 라벨 | Phase 10 §G = 빈 박스 + P/T/U/D 마킹 (1·2·3·4·5 라벨 폐기) | 🟡 **trade-off** | §G 결재 보존 (P/T/U/D 더 정보량 ↑) — 다만 헤더 위 "1 2 3 4 5" 가이드 추가 권장 |
| 6 | **Team A 블록 (Time-outs)** | 5칸 빈 박스 (라벨 없음 / 운영자가 X 또는 채움) | Phase 10 §E = 5칸 빈 박스 + 마킹 시 X 글자 | 🟢 정합 ✓ | — |
| 7 | **Team A 블록 (Licence)** | "Licence no." 라벨 (사용자가 적는 공간) | "Licence (UID)" + User.id 자동 fill (read-only) | 🟢 자동 fill 결재 보존 (§D) | — |
| 8 | **Team B 블록** | Team A 와 완전 동일 구조 (Time-outs / Team fouls / Players 16행 / Coach) | Team A 와 동일 구조 ✓ | 🟢 정합 | — |
| 9 | **Running Score** | **각 set 좌·우 양쪽에 행번호** (예 "1 1" / "2 2" / ... / "40 40") + 4 set 가로 | 좌측 1개 행번호만 (a4 양식 시안 우선 / 22×16px) | 🟡 우측 행번호 누락 | Phase 11 후보 — set 시각 시인성 향상 |
| 10 | **Period Scores + Final + Winner** | 우측 하단 누적 ("Scores Period ① A___ B___" × 4 + Extra + Final + Name of winning team) | Period 표 + Final Score + Winner 누적 ✓ | 🟢 정합 | **Minor: "Name of winning team" 라벨 누락** (Winner 표시는 다른 톤) |
| 11 | **풋터 운영진** | **4줄 세로 누적** (Scorer / Assistant scorer / Timer / Shot clock operator) | **가로 4 컬럼 1줄** (Phase 9 컴팩트) | 🟠 **FIBA PDF 세로 배치 X** | **Major** — A4 fit 후 세로 복원 검토 |
| 12 | **풋터 심판** | Referee 1줄 + Umpire 1·Umpire 2 가로 1줄 (혹은 3 컬럼 1줄) | 3 컬럼 1줄 ✓ | 🟢 정합 | — |
| 13 | **풋터 Captain** | "Captain's signature in case of protest" 1줄 (맨 하단) | Captain 1줄 (full-width) ✓ | 🟢 정합 | — |

### 발견 차이 (Critical / Major / Minor 분류)

#### 🔴 Critical (1건)

1. **Team fouls 박스 안 숫자 라벨 폐기** — Phase 10 §F 결재 위반 가능성
   - 파일: `team-section.tsx:339-403`
   - FIBA 원본: "Period ① **1 2 3 4** / Period ② **1 2 3 4** / ..." (박스 안에 숫자 라벨 표시)
   - 현재: 빈 박스만 (마킹 시 검정 채움) — 운영자가 "지금 몇 번째 파울인지" 박스 위치로만 추론
   - 영향: FIBA 종이기록지 정합 ⚠️ 사용자 결재 §F = "라벨 폐기"였지만 **FIBA 원본은 라벨 있음**. 사용자가 PDF 다시 보면 인지 가능 — 재결재 권장.
   - 권장 fix: 박스 안 작은 글자 "1·2·3·4" 회색 라벨 + 마킹 시 글자 색 반전 (현 검정 채움 유지)

#### 🟠 Major (3건)

2. **Players 15행 → 16행**
   - 파일: `team-section.tsx:110-117` (fillRowsTo15)
   - FIBA 원본: 16행 (이미지 직접 카운트 — 헤더 제외 16행 ✓)
   - 현재: 15행 (Phase 10 §C 결재 = "15행")
   - 영향: 한 줄 차이. A4 fit 영향 ~22px 증가 — 기존 ~1058px 여유 (1123 안) 안에 흡수 가능
   - 권장 fix: `fillRowsTo15` → `fillRowsTo16` 변경 (행 22px 그대로 시 +22px / 행 21px 시 +6px)

3. **풋터 운영진 4줄 세로 → 가로 1줄**
   - 파일: `footer-signatures.tsx:117-150`
   - FIBA 원본: Scorer / Assistant scorer / Timer / Shot clock operator = **4줄 세로 누적** (각 줄 라벨 + 긴 underscore)
   - 현재: Phase 9 = `sm:grid-cols-4` 가로 1줄 (A4 fit 우선)
   - 영향: FIBA 종이기록지 정합 ⚠️ — 다만 A4 fit 보장 후 세로 복원 가능
   - 권장 fix: `sm:grid-cols-4` → 1 컬럼 + 4줄 세로 (각 줄 22px × 4 = +66px 추가) — A4 1058 + 66 = 1124 (1123 거의 fit 한계)

4. **"Name of winning team" 라벨 누락**
   - 파일: `period-scores-section.tsx:306-324`
   - FIBA 원본: Final Score 아래 "Name of winning team ____" 1줄 (별도 입력 영역)
   - 현재: Winner 표시 = "★ Winner: 팀명" 톤 (color-success 그린 강조 박스)
   - 영향: FIBA 종이기록지 정합 ⚠️ + 운영자가 "수기로 적는 영역" 누락
   - 권장 fix: Winner 박스 위 또는 아래 "Name of winning team: ____" underscore input 추가

#### 💡 Minor (8건)

5. **Running Score 우측 행번호 누락** (running-score-grid.tsx)
   - FIBA 원본: 각 set 좌·우 양쪽에 행번호 (예 set1 = "1 1" / set2 = "41 41")
   - 현재: 좌측 1개 행번호만 (작은 회색 9px)
   - 영향: 시각 시인성 ↓ (set 1 / set 2 경계 식별 어려움)
   - 권장 fix: A|B 컬럼 사이 행번호 1개 추가 또는 우측 1개

6. **Running Score "RUNNING SCORE" 헤더 글자 크기**
   - FIBA 원본: 굵은 큰 글씨 (~12pt bold)
   - 현재: text-[11px] uppercase tracking-wider (running-score-grid.tsx:174)
   - 영향: 시각 강조 ↓
   - 권장 fix: text-[12px] 또는 text-sm + font-bold

7. **헤더 BDR 로고 너무 작음** (fiba-header.tsx:101-107)
   - FIBA 원본: 로고 ~50×50 정사각 (큰 크기)
   - 현재: 24×12 (Phase 9 컴팩트)
   - 영향: 브랜드 인지 ↓
   - 권장 fix: BDR 결재 보존 시 32×16 또는 40×20 으로 약간 확대 (A4 fit 영향 0 — 헤더는 여유)

8. **헤더 "SCORESHEET" 글자 크기** (fiba-header.tsx:116-120)
   - FIBA 원본: ~14pt bold (제일 큰 글자)
   - 현재: text-[13px] font-bold uppercase tracking-widest
   - 영향: FIBA 정합 ↓ (큰 차이는 아니지만 미세)
   - 권장 fix: text-[14px] 또는 text-base

9. **Players 표 "P in" 컬럼명** (team-section.tsx:447-450)
   - FIBA 원본: "Player in" (줄임 X)
   - 현재: "P in" (Phase 9 컴팩트)
   - 영향: 라벨 명확성 ↓
   - 권장 fix: "Player in" 으로 복원 (헤더 22px 안 fit 검증 후)

10. **Players 표 "Licence (UID)" 라벨**
    - FIBA 원본: "Licence no." (간결)
    - 현재: "Licence (UID)" (BDR 운영 명확화 / Phase 3.5)
    - 영향: BDR 결재 보존 § (자동 fill UID = User.id) — FIBA 원본은 사람이 적는 라이센스 번호
    - 권장 fix: 보존 (사용자 결재 §D)

11. **Time-outs phase 표시** (team-section.tsx:241-245)
    - FIBA 원본: 박스만 (라벨 X)
    - 현재: "전반 2/2" 류 보조 텍스트 표시
    - 영향: BDR UX 보강 (운영자 부담 ↓) — FIBA 원본 미정합이지만 운영 편의
    - 권장 fix: 보존 (운영 가치 ↑)

12. **인쇄 시 마킹된 박스 = 회색 #e0e0e0** (_print.css:151-153)
    - FIBA 원본: 마킹 = 손글씨 X 또는 검정 채움 (인쇄지에 운영자가 직접 마킹)
    - 현재: 인쇄 시 `[aria-label*="마킹됨"]` 가 회색 배경
    - 영향: 종이로 출력 시 시각 차이 (검정 vs 회색)
    - 권장 fix: 인쇄 시 마킹 = #000 검정 강제 (Time-outs X / Team fouls 검정 채움 / Player fouls P/T/U/D 글자 검정)

### A4 fit 검증

- **화면 viewport** (브라우저 1920×1080):
  - 좌측 ~1058px / 우측 ~1025px (둘 다 1123px = A4 portrait 안 fit ✓)
  - 스크롤 0 ✓
- **인쇄 미리보기** (A4 portrait):
  - `_print.css` `.score-sheet-fiba-frame { width: 198mm; max-height: 285mm; overflow: hidden; page-break-after: always }` 강제
  - **위험**: max-height 285mm + overflow: hidden = 초과 시 잘림 ⚠️ (16행 적용 + 풋터 세로 복원 시 ~1124px 초과 가능)
  - 권장: 인쇄 시 행 22 → 20px 또는 풋터 가로 유지로 안전 마진 확보

### 폰트 정밀

- FIBA PDF 라벨: Helvetica/Arial regular ~8pt + bold 큰 라벨 ~12pt
- FIBA PDF 데이터: 빈 underscore (운영자 손글씨)
- 현재 mybdr: Pretendard (한글) + 시스템 영문 fallback
- 정합도: 🟢 충분 (Pretendard 가 Helvetica 와 유사한 sans-serif 톤)

### 색상 정합

- FIBA PDF: 검정 1px 박스 + 흰 배경 + 검정 텍스트
- 현재 mybdr: `var(--color-text-primary)` (라이트=검정 / 다크=흰색) ✓ 인쇄 시 검정 강제 ✓
- 정합도: 🟢 완벽

### 디자인 13 룰 (CLAUDE.md)

| 룰 | 위반 검사 |
|---|---------|
| lucide-react ❌ | 0건 (주석 1건 명시만) ✅ |
| Material Symbols ✅ | warning / block / check / chevron_left/right / stop_circle / edit ✅ |
| 핑크/살몬/코랄 ❌ | hardcode 0건 ✅ |
| 빨강 본문 ❌ | accent (warning) / primary (D 파울 — 위험 액션 예외) — 본문 텍스트 X ✅ |
| `var(--*)` 토큰 ✅ | 모든 색상 토큰 사용 ✅ |
| BDR 브랜드 보존 | BDR 로고 + Basketball Daily Routine 유지 ✅ |

### Phase 11 권장 fix 작업량

| 우선순위 | 영역 | 작업 | 예상 LOC |
|---------|------|------|--------|
| 🔴 Critical | Team fouls 박스 안 숫자 라벨 | 빈 박스에 작은 회색 "1·2·3·4" 라벨 + 마킹 시 글자 색 반전 | +25 LOC |
| 🟠 Major | Players 15행 → 16행 | fillRowsTo15 → fillRowsTo16 + 테스트 갱신 | +5 LOC |
| 🟠 Major | 풋터 운영진 가로 → 세로 4줄 | grid-cols-4 → grid-cols-1 + A4 fit 재검증 | +10 LOC |
| 🟠 Major | "Name of winning team" 추가 | Final Score 아래 underscore input | +20 LOC |
| 💡 Minor | Running Score 우측 행번호 | A|B 사이 또는 우측 행번호 추가 | +15 LOC |
| 💡 Minor | RUNNING SCORE 헤더 크기 | text-[11px] → text-sm | +1 LOC |
| 💡 Minor | BDR 로고 확대 | 24×12 → 32×16 | +1 LOC |
| 💡 Minor | SCORESHEET 글자 크기 | text-[13px] → text-base | +1 LOC |
| 💡 Minor | "P in" → "Player in" | 컬럼 width w-12 → w-16 | +1 LOC |
| 💡 Minor | 인쇄 마킹 = 회색 → 검정 | _print.css `[aria-label*="마킹됨"]` 검정 강제 | +3 LOC |

**총 예상**: ~82 LOC / 1 PR (Phase 11). A4 fit 재검증 + tsc 0 + vitest 543 + 시각 검증 (PDF 1:1 대조).

### ✅ 잘된 점

- **단일 외곽 박스 통합** (`score-sheet-fiba-frame`) = FIBA PDF 1:1 정합 ✓
- **다크/라이트 모드 분기** + 인쇄 시 라이트 강제 = 운영 안정성 ↑
- **frameless prop 패턴** = 회귀 안전망 보존 (기존 호출자 영향 0)
- **localStorage draft** (5초 throttle) = mid-game reload 안전
- **fillRowsTo12 deprecated alias** = 회귀 가드 명시
- **A4 1 페이지 fit** (좌 1058 / 우 1025 / 한계 1123) = Phase 9 컴팩트 성공
- **헤더 4줄 컴팩트** + **풋터 가로 펼침** = 공간 효율 ↑ (단 FIBA 정합 trade-off)
- **자동 fill** (Licence User.id / 사전 라인업 + TTP) = 운영자 부담 ↓
- **vitest 543/543 PASS** = 회귀 안전망 견고 (fillRowsTo12 alias 회귀 가드 포함)
- **디자인 13 룰 100% 준수** (lucide-react 0 / 빨강 본문 0 / 토큰 100%)

### 🔴 필수 수정 (Phase 11 권장)

- **team-section.tsx:339-403** — FIBA 원본 정합 위해 박스 안 숫자 라벨 1·2·3·4 복원 (사용자 §F 재결재 필요)

### 🟡 권장 수정 (Phase 11)

- **team-section.tsx:110-117** — fillRowsTo15 → fillRowsTo16 (FIBA 원본 카운트)
- **footer-signatures.tsx:117-150** — sm:grid-cols-4 → 1 컬럼 세로 4줄 (FIBA 정합, A4 fit 재검증 필수)
- **period-scores-section.tsx** — "Name of winning team: ____" underscore 라인 추가
- **running-score-grid.tsx** — 우측 행번호 + 헤더 크기

### 결론

사용자 평가 "거의 다 됐다" = 정확. **A4 fit ✓ + 디자인 룰 100% + 핵심 흐름 정합 ✓**. 미세 차이 12건 중 Critical 1건 (Team fouls 라벨) + Major 3건만 fix 권장. Minor 8건은 trade-off (BDR UX 우선 / 자동 fill 가치 ↑) — 결재 보존 정당.

Phase 11 = 1 PR ~82 LOC. 우선순위: Critical Team fouls 재결재 → Major 3건 동시 fix → Minor 8건 선택적.

## 진행 현황표 (옵션 A — 본 세션)
| # | 이슈 | 작업 | 상태 |
|---|------|------|------|
| 31 | 빨강 버튼 디자인 위반 | organizations 2 페이지 6 토큰 → btn--primary / accent / info | ✅ |
| 30/32 | 단체 페이지 흐름 | snukobe org_members admin INSERT (강남구농구협회 orgId=3) | ✅ |
| 29 | 대회 자동 종료 로직 | auto-complete.ts + match-sync 통합 + vitest +8 + 운영 1건 backfill | ✅ |

## 진단 (planner-architect) — 대회/시리즈/단체 연결 구조 전체 점검 (2026-05-12)

🎯 목표: 3 엔티티 (organizations / tournament_series / tournament) 연결 흐름의 빈 칸 + 정합성 깨짐 root cause 일괄 파악 → fix 로드맵 5 Phase 제시

### 1. 데이터 모델 관계도 (ASCII)

```
       organizations (BigInt id)               
       ├─ owner_id → User (1:1)               
       ├─ series_count (캐시 — 정합성 가드 부재)
       └─ status: pending / approved / rejected
               │ 1:N
               ▼
       organization_members (org_id, user_id, role: owner/admin/member)
               │
       ┌───────┴────────┐
       │                │
       │     tournament_series (BigInt id)
       │     ├─ organization_id  ❶ Nullable!
       │     ├─ organizer_id (User, 단일)
       │     ├─ tournaments_count (캐시 — 정합성 가드 부재)
       │     └─ status: active / inactive
       │             │ 1:N
       │             ▼
       │      Tournament (UUID id)
       │      ├─ series_id    ❷ Nullable (대회는 시리즈 없어도 됨)
       │      ├─ organizerId  ❸ 시리즈 organizer 와 독립
       │      └─ tournament_admin_members (TAM, 다인 권한)
       │
       └─ FK = onDelete NoAction (단체 삭제 = 시리즈 고아화)
```

### 2. 발견된 문제점 (운영 DB 실측 포함)

| # | 카테고리 | 심각도 | 영향 | 위치 / 사실 |
|---|---------|--------|------|------------|
| **P1** | DB/API | 🔴 Critical | 운영 카운터 깨짐 12건 | series id=8 (BDR) `tournaments_count` stored=**0** / actual=**12**. org id=3 (강남구농구협회) `series_count` stored=**0** / actual=**1**. **카운터 backfill/recompute 0건 / cron 0건**. createTournament service (`src/lib/services/tournament.ts:418`) 가 `series_id` 입력 자체 없고 +1 박제도 없음. editions API 만 +1 / PATCH/absorb 가 +1·-1 → wizard 진입 X 인 직접 create path 는 stale |
| **P2** | API | 🔴 Critical | 시리즈 organization_id NULL 박제 | `/tournament-admin/series/new/page.tsx:31` 호출이 `organization_id` 파라미터 **미전송** → 운영자가 본 페이지에서 만들면 org_id NULL 박제 (id=10 사례 = 운영 사실). `/(web)/series/new/` 페이지는 **alert("준비 중") 만** — DB mutation 0 |
| **P3** | API | 🟠 Major | 시리즈 PATCH/DELETE 부재 | `/api/web/series/[id]/route.ts` GET 1개. `organization_id` 사후 변경 / 시리즈 메타 (name/desc/is_public) 수정 / 시리즈 삭제 0건. 단체-시리즈 분리 = DB UPDATE 만 (실측 사례) |
| **P4** | API | 🟠 Major | 대회 DELETE 부재 | `/api/web/tournaments/[id]/route.ts` GET/PATCH 만. 대회 삭제 흐름 자체 없음 (status=cancelled 도 불완전). 시리즈 삭제 시 소속 대회 운명 미정의 |
| **P5** | 권한 | 🟠 Major | requireSeriesOwner 가 organizer_id 만 검증 | 단체 소속 시리즈인데 다른 단체 admin/owner 가 못 만짐. `series-permission.ts:78` — organization_members role 분기 0건. PR1 PATCH 도 organizer 본인만 series 이동 가능 |
| **P6** | UI | 🟠 Major | 단체-시리즈 분리 / 단체간 이동 UI 0 | 실측 사례 = DB UPDATE 만 (강남구 BDR 시리즈). organization 페이지에서도 시리즈 PATCH organization_id=null UI 없음 |
| **P7** | UI | 🟡 Minor | 시리즈 신규 진입점 4개 분기 | `/(web)/series/new` (alert만), `/tournament-admin/series/new` (org_id 미전송), `/tournament-admin/organizations/[orgId]` (정상, org_id 박제), 메인 nav 메뉴 — 진입점 일관성 X |
| **P8** | 일관성 | 🟡 Minor | 단체 삭제 / cascade 미정의 | organizations FK onDelete NoAction. 단체 삭제 시 시리즈 organization_id 자동 NULL X / cascade 결정 미정의. lifecycle 사용자 결재 항목 |
| **P9** | UI | 🟢 Info | 공개 페이지 events 탭 평탄화 vs 관리 페이지 unflatten | `/organizations/[slug]?tab=events` = series → tournaments 평탄. `/tournament-admin/organizations/[orgId]` = series 카드 list. 운영자가 흡수 UI 보려면 series 클릭 → 새 페이지. 통합 hub 부재 |

### 3. 우선순위별 fix 로드맵 (5 Phase)

| Phase | 범위 | LOC 추정 | 위험 | 산출물 |
|-------|------|---------|------|--------|
| **A. 즉시 fix (1~2 PR)** | (a) 카운터 일회성 recompute 스크립트 + 운영 DB backfill / (b) `/tournament-admin/series/new` 페이지에 organization 드롭다운 추가 (P2) / (c) `/(web)/series/new` 페이지 alert 제거 (또는 redirect to 단체 페이지) | 200~300 | 낮음 (UI 추가 + 스크립트) | scripts/recompute-series-counters.ts + form 1 dropdown + redirect 1줄 |
| **B. 정합성 가드 (1 PR)** | createTournament service 에 series_id 입력 + +1 박제 통합 / Tournament DELETE 추가 (소프트 delete or 카운터 -1) / cron recompute 주 1회 | 300~500 | 중 (모든 create path 점검 필요) | services 수정 + 신규 DELETE route + cron |
| **C. 시리즈 PATCH/DELETE (1 PR)** | `/api/web/series/[id]` PATCH (name/desc/is_public/organization_id 변경) + DELETE (소프트 status=inactive) / requireSeriesOwner 확장 = organization owner/admin 도 허용 / 카운터 동기화 transaction | 400~600 | 중 (권한 매트릭스 변경) | route + permission helper 확장 |
| **D. UI 단체↔시리즈 운영자 셀프서비스 (2 PR)** | 단체 페이지 시리즈 카드에 "단체에서 분리" / "다른 단체로 이동" 메뉴 (3-dot) / 시리즈 페이지 "단체 변경" 드롭다운 / 운영자 단체 admin/owner 가 시리즈 만질 수 있게 권한 확장 | 600~1000 | 중 (UI + 권한 + transaction) | OrgSeriesActionsMenu + SeriesSettingsForm |
| **E. lifecycle 정책 + cascade (1 PR + 결재)** | 단체 삭제 정책 결재 (option A: status archived 보존 / B: 소속 series.organization_id NULL 자동 / C: cascade) / 시리즈 삭제 시 대회 운명 정책 / cron monthly audit | 300~500 + 결재 1회 | 높음 (DB 정책) | 결재 문서 + cron + admin UI |

### 4. 운영자 결재 사항 (3 항목)

1. **단체 삭제 정책** — A 보존 (status=archived, series.organization_id 유지) / B 자동 분리 (NULL) / C cascade 전체 삭제. 강력 추천 = **A** (감사 + 복구 가능)
2. **시리즈 organization_id 변경 권한** — 시리즈 organizer 본인만 / 단체 owner+admin 도 가능 / super_admin 만. 추천 = **단체 owner+admin + super_admin** (운영 셀프서비스)
3. **대회 organizer ≠ 시리즈 organizer 케이스** — 단체 소속 시리즈 안에서 대회 organizer 가 단체 멤버 아닐 때 권한 흐름. 추천 = **단체 admin/owner 가 단체 소속 시리즈 모든 대회 관리 가능** (현재 = 안 됨)

### 5. 장기 비전

단체 페이지가 **시리즈/대회의 hub** — 운영자가 단체 페이지에서 모든 시리즈/대회 lifecycle (create / status / 분리 / 이동 / 삭제) 1-click. 시리즈 페이지는 단체 sub-page. 대회는 시리즈 sub-page. 공개 페이지 events 탭 = 평탄화 유지 (운영 페이지는 hierarchy 유지). 카운터 = 단방향 trigger (create/update/delete 시 같은 transaction +N/-N) + cron monthly recompute audit.

### 6. knowledge 갱신 후보

- `architecture.md` 후보: 3 엔티티 관계도 + FK NoAction 정책 + 카운터 정합성 메커니즘 부재
- `decisions.md` 후보: 단체 삭제 정책 (위 결재 1) / 권한 확장 정책 (결재 2) / 카운터 정합성 보장 메커니즘 결정

### 본 진단 작업의 부산물 (정리됨)
- `scripts/_temp/diag-series-org-counters.ts` — 운영 DB 실측 후 삭제 ✓ (운영 SELECT 만, schema 변경 0, UPDATE 0)


## 진행 현황표 (옵션 A — 본 세션)
| # | 이슈 | 작업 | 상태 |
|---|------|------|------|
| 31 | 빨강 버튼 디자인 위반 | organizations 2 페이지 6 토큰 → btn--primary / accent / info | ✅ |
| 30/32 | 단체 페이지 흐름 | snukobe org_members admin INSERT (강남구농구협회 orgId=3) | ✅ |
| 29 | 대회 자동 종료 로직 | auto-complete.ts + match-sync 통합 + vitest +8 + 운영 1건 backfill | ✅ |
| 32-추가 | 단체 관리/페이지 관리 메뉴 | 단체 상세 추가 메뉴 link 보강 | 보류 (별 PR) |
| 33 | 대진표 고도화 | dual_tournament rounds/brackets 매핑 강화 | 보류 (별 PR) |
| 34 | 권한 자동 부여 | 단체 admin → 대회 운영자 자동 부여 (헬퍼 또는 트리거) | 보류 (별 PR) |

## 구현 기록 (developer) — B-3 cron + Phase C 시리즈 CRUD (2026-05-12)

📝 구현 범위: Vercel Cron 카운터 audit (DRY-RUN) + 시리즈 PATCH/DELETE API (Q2 권한 확장) + 운영 UI (편집/삭제)

### 변경 파일

| # | 파일 | 변경 | 신규/수정 |
|---|------|------|----------|
| B-3 | `vercel.json` | crons 추가 — `/api/cron/series-counter-audit` schedule `0 0 1 * *` | 수정 |
| B-3 | `src/app/api/cron/series-counter-audit/route.ts` | DRY-RUN GET 핸들러 — Bearer 가드 + 시리즈/단체 카운터 비교 + console.warn + UPDATE 0 | 신규 |
| C-1 | `src/lib/auth/series-permission.ts` | `requireSeriesEditor()` (organizer + 단체 owner/admin + super_admin) + `isOrganizationEditor()` 헬퍼 추가 | 수정 |
| C-2 | `src/app/api/web/series/[id]/route.ts` | PATCH 핸들러 (zod schema name 50/desc 200/is_public/organization_id) + DELETE Hard (?hard=1 super_admin only). 카운터 동기화 $transaction | 수정 |
| C-3a | `src/app/(admin)/tournament-admin/series/[id]/page.tsx` | 권한 가드 확장 (organizer + 단체 owner/admin + super_admin) + 헤더 편집 Link + DeleteSeriesButton 통합 | 수정 |
| C-3b | `src/app/(admin)/tournament-admin/series/[id]/edit/page.tsx` | 시리즈 편집 server component (권한 가드) | 신규 |
| C-3c | `.../edit/_components/series-edit-form.tsx` | client form (단체 드롭다운 + isDirty 감지 + 변경값만 PATCH) | 신규 |
| C-3d | `.../[id]/_components/delete-series-button.tsx` | super_admin 전용 Hard DELETE 버튼 (시리즈명 입력 매칭 confirm 모달) | 신규 |
| 테스트 | `src/__tests__/api/series-patch-delete.test.ts` | PATCH 권한 6 + organization_id 5 + DELETE 4 = 15 케이스 | 신규 |
| 테스트 | `src/__tests__/api/cron-series-counter-audit.test.ts` | DRY-RUN audit 5 케이스 (Bearer/정합/series 불일치/org 불일치/양쪽) | 신규 |

### Q2/Q3 권한 적용

- **Q2 적용**: `requireSeriesEditor` = series organizer + 단체 owner/admin + super_admin
- **organization_id 변경 시 양쪽 단체 권한 검증**: 일반 사용자는 이전 + 새 단체 모두 owner/admin 확인 (`isOrganizationEditor`). super_admin 우회.
- **Q3 본 PR 범위 외**: 대회 organizer ≠ 시리즈 organizer 케이스는 Phase D 본격 적용 — 본 PR 은 시리즈 PATCH/DELETE 권한 확장만.

### Soft DELETE 결정

- schema 의 `tournament_series.status` 는 "active" 디폴트 / 운영 코드에 "inactive" 분기 0건
- 본 PR = **Hard DELETE 만** 구현 (super_admin only, ?hard=1)
- Soft DELETE 는 별 PR 큐잉 (status 컬럼 정책 결재 필요)
- DELETE Hard 동작: tournaments series_id NULL 분리 → organizations.series_count -1 → series row 삭제 ($transaction 원자)

### 검증 결과

- **tsc --noEmit**: 0 에러
- **vitest**: **584/584 PASS** (이전 563 + 신규 21)
  - 신규 series-patch-delete: 15/15 (권한 6 + org_id 5 + DELETE 4)
  - 신규 cron-audit: 5/5
  - 회귀: tournament-series-link 11/11 등 기존 모든 케이스
- **Flutter v1 영향 0**: `src/app/api/v1/` 안 organization_id / series_count / tournaments_count 사용 0건 grep
- **schema 변경 0** / **운영 DB 변경 0** (코드만)
- **grep 회귀 0**: BigInt(N)n / lucide-react / 핑크-살몬-코랄 모두 0건

### 💡 tester 참고

- **PATCH 권한 흐름 검증**:
  1. organizer 본인 → 시리즈 메타 변경 가능
  2. 단체 소속 시리즈에서 단체 owner/admin → 변경 가능 (Q2 신규)
  3. 단체 member → 403
  4. organization_id 변경 시 카운터 동기화 (운영 series_count 실측 확인)
- **DELETE 흐름 검증**:
  1. 일반 organizer가 ?hard=1 시도 → 403
  2. super_admin + ?hard=1 + 시리즈명 정확 입력 → 삭제 + 묶인 대회 series_id NULL 분리
  3. 삭제 후 organization 페이지 events 탭 = 분리된 대회들 사라짐 (의도)
- **cron audit 검증**:
  1. cron 수동 호출 (Bearer CRON_SECRET) → 응답에 series/organizations mismatches 박제
  2. 매월 1일 0시 자동 실행 (Vercel)
  3. UPDATE 0건 (DRY-RUN) — 사람이 수동 backfill 책임
- **주의할 입력**:
  - Hard DELETE 시 묶인 대회가 많으면 updateMany count 큼 (운영 안전: 사전 시리즈 분리 흐름 안내 권장)
  - organization_id 변경 시 새 단체가 approved 아니면 400
  - 새 단체 권한 없으면 403 (이중 가드: 클라 select 옵션 + 서버 isOrganizationEditor)

### ⚠️ reviewer 참고

- **`requireSeriesEditor` 단일 source**: 시리즈 PATCH/DELETE 진입점 모두 본 헬퍼 사용. 향후 단체 권한 룰 변경 시 한 곳만 수정. 페이지 server component 의 권한 가드는 inline 로직 (헬퍼는 throw 기반이라 server component 에서 try/catch 어색 — 단순 prisma.findFirst 로 박제)
- **카운터 동기화 race**: organization_id 변경 + DELETE 모두 `$transaction` 안에서 처리. PATCH 의 isSameOrg 분기는 transaction 진입 X (불필요한 부하 회피)
- **mock 시퀀스**: vitest 의 organization_members.findFirst 호출 시퀀스 = `requiresMembershipCheck (외부인+org_id)` + `orgEditorResults (PATCH organization_id 변경)`. organizer 본인/super_admin 케이스는 requireSeriesEditor 단계에서 호출 0
- **시리즈명 입력 매칭 confirm**: DeleteSeriesButton — 정확 일치만 활성화 (실수/매크로 차단). 향후 단체 분리 PR3 흡수 모달 패턴과 통일 가능
- **Soft DELETE 미구현 사유 박제**: route 안 주석에 "별 PR 큐잉" 명시 + 호출 시 400 응답으로 안내. UI 에는 Hard DELETE (super_admin only) 만 노출

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-12 | (커밋 대기) | **[Phase B-3 cron audit + Phase C 시리즈 PATCH/DELETE]** B-3) `/api/cron/series-counter-audit` GET (DRY-RUN, 매월 1일 0시 cron) — series.tournaments_count + organizations.series_count 정합성 자동 점검 + 불일치 시 console.warn (UPDATE 0). C-1) `requireSeriesEditor` 헬퍼 신규 (Q2: organizer + 단체 owner/admin + super_admin) + `isOrganizationEditor` 헬퍼. C-2) `/api/web/series/[id]` PATCH (name/desc/is_public/organization_id 변경 + 양쪽 단체 권한 검증 + 카운터 동기화 $transaction) + DELETE Hard (?hard=1 super_admin only + tournaments series_id NULL 분리 + organizations.series_count -1). C-3) 시리즈 [id] 페이지 헤더 편집/삭제 버튼 + edit/page.tsx (server 가드 + client form) + delete-series-button.tsx (시리즈명 입력 매칭 confirm). vitest +21 (PATCH 권한 6 + organization_id 5 + DELETE 4 + cron 5 + 회귀 1). tsc 0 / vitest 584/584 PASS. Flutter v1 영향 0 / schema 변경 0 / 운영 DB 변경 0. soft DELETE = 별 PR (status 컬럼 정책 결재 필요). | ✅ |
| 2026-05-12 | (커밋 대기) | **[Phase B 정합성 가드 + callbackUrl fix]** A) extractRedirectFromQuery + extractRedirectFromValues 헬퍼 신규 (redirect 우선 / callbackUrl 폴백) → login page + auth.ts loginAction + /api/auth/login OAuth 시작점 통합 (proxy.ts 가 callbackUrl 박제 → 사일런트 무시 사고 영구 차단). B-1) createTournament service `seriesId?: bigint` + `$transaction` 카운터 +1 + wizard route requireSeriesOwner 권한 검증. B-2) `/api/web/tournaments/[id]` DELETE 핸들러 신규 (soft=status='cancelled' / hard=`?hard=1` super_admin only + series 카운터 -1 + adminLog warning/critical). vitest +22 (redirect +10 / create-tournament +4 / delete +6 / 회귀 +2). tsc 0 / vitest 563/563 PASS. Flutter v1 영향 0 / schema 변경 0 / 운영 DB 변경 0. B-3 cron audit = 별 PR 큐잉. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 10]** 정밀 디자인 fix (Critical 4 + Major 3) — §B 헤더 underscore (큰 박스 폐기) / §C Players 15행 (fillRowsTo12 → fillRowsTo15 alias 유지) + 행 24→22px / §E Time-outs 빈 박스 + 마킹 시 X 글자 / §F Team fouls 1·2·3·4 빈 박스 + 마킹 시 검정 채움 (1·2·3·4 라벨 폐기) / §G Player Fouls 1-5 빈 박스 + 마킹 시 P/T/U/D 글자만. §A·§D 결재 = BDR 브랜드 + 자동 fill 유지 (변경 0). 2 파일. tsc 0 / vitest 543/543 PASS (기존 541 + 신규 2 alias 회귀 가드). A4 fit 좌측 ~1058px / 1123 안 fit ✓. 회귀 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 9]** A4 1 페이지 fit + 레이아웃 재배치 — 좌측 Team A+B 세로 분할 (FIBA PDF 정합) / 우측 Running+Period+Final 누적 / Footer 최하단 가로 1~2줄 (Notes frameless 시 폐기) / Players 행 28→24px / 폰트 압축 (헤더 13px / 라벨 10 / 데이터 11~12 / 인쇄 8pt) / @page margin 8→6mm / fiba-frame 198mm×285mm 강제. 7 파일. tsc 0 / vitest 541 PASS. 좌측 ~975px / 우측 ~1025px (A4 1123 안에 fit ✓). 회귀 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[Phase A 즉시 fix]** 운영 사고 3종 차단 — (A-1) `/tournament-admin/series/new` organization 드롭다운 추가 (owner/admin + approved 필터) (A-2) `/(web)/series/new` alert 폼 → admin redirect 통합 (A-3) `scripts/_temp/series-counter-recompute.ts` DRY-RUN/APPLY 모드 분리. tsc 0 / vitest 541 PASS / DRY-RUN 실측 = 진단 fact 일치 (series id=8 0→12 / org id=3 0→1). schema 변경 0 / Flutter v1 영향 0. APPLY 는 사용자 승인 후 별 turn 실행 | ✅ |
| 2026-05-12 | (진단) | **[진단]** 대회/시리즈/단체 연결 구조 전체 점검 — 운영 DB 실측: series id=8 카운터 0/12 깨짐 + org id=3 카운터 0/1 깨짐 + series id=10 org_id NULL. root cause = `/tournament-admin/series/new` org_id 미전송 + createTournament service +1 박제 부재 + cron 0건. 9 문제점 매트릭스 + 5 Phase 로드맵 + 3 결재 항목. 코드 변경 0 / SELECT only / 스크립트 정리 ✓ | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 8]** PDF 1:1 완전 정합 — 단일 외곽 박스 통합 + 헤더 컴팩트 4 줄 + Players 행 28px + Footer 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4열 + Referee/Umpire1·2 3열). 7 파일 +450/-258. tsc 0 / vitest 541/541. 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 7.1]** LineupSelectionModal 확장 — 전체 선택/해제 + FIBA 12명 cap (Article 4.2.2) + 13번째 차단 + applyRosterCap 헬퍼 + isLineupSelectionValid 12명 상한. tsc 0 / vitest 533/533 (+7). 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | d89f600 | **[live]** score-match swap-aware 백포트 — 5/10 결승 영상 사고 2차 fix | ✅ |
| 2026-05-12 | ff190a7 | **[live]** 결승 영상 매핑 오류 fix — auto-register 1:1 매핑 가드 백포트 | ✅ |
| 2026-05-12 | 32b8ec9 | **[live]** TeamLink href 404 — TournamentTeam.id → Team.id 분리 | ✅ |

## 구현 기록 (developer) — FIBA Phase 10 정밀 디자인 fix (2026-05-12)

📝 구현 범위: 사용자 결재 7건 fix — §A·§D 결재 보존 (변경 0) / §B·§C·§E·§F·§G 5건 적용

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `team-section.tsx` | §B 헤더 = "Team A ____슬로우____" underscore (큰 박스 폐기 / uppercase + tracking-wider 폐기) / §C `fillRowsTo15` 신규 + `fillRowsTo12` deprecated alias (12 → 15 / FIBA 종이기록지 표준) / §C 행 24 → 22px (15행 fit) + 빈 row 동일 / §E Time-outs 채운 칸 검정 ● 배경 → 빈 박스 + 마킹 시 X 글자 / §F Team fouls 1·2·3·4 빈 박스 + 마킹 시 검정 채움 (1·2·3·4 라벨 폐기 / accent → text-primary) / §F Extra(OT) 동일 / §G Player Fouls 1-5 빈 박스 (1·2·3·4·5 숫자 폐기) + 마킹 시 P/T/U/D 글자만 / 컴포넌트 상단 주석 Phase 10 추가 | 수정 |
| `team-section-fill-rows.test.ts` | `fillRowsTo12` → `fillRowsTo15` 테스트 4건 갱신 (빈 / 5 / 15 / 18명) + `fillRowsTo12` alias 회귀 가드 2건 신규 추가 (deprecated alias 동작 검증) | 수정 |

### 적용 X 항목 (사용자 결재 = 변경 0)
- **§A 헤더 타이틀** = BDR 브랜드 유지 (FibaHeader.tsx — BASKETBALL DAILY ROUTINE / SCORESHEET + BDR 로고 모두 그대로)
- **§D Players 데이터** = 자동 fill 유지 (사전 라인업 + Licence User.id read-only)

### A4 1 페이지 fit 재검증 (15행 증가 후)
- Team 한쪽 합: 헤더 22 + Time-outs/Fouls 70 + thead 22 + 15행 × 22 = 330 + Coach 22 + 패딩 = **~474px**
- Team A + Team B 합 = **~948px**
- 상위 헤더 (~110px) + 풋터 (~80px) = ~190px
- 총합: **~1058px** ≤ A4 1123px **fit ✓**
- 인쇄 시 `_print.css` 의 198mm × 285mm 강제 + overflow: hidden 보호

### 검증
- **tsc --noEmit**: **0 에러**
- **vitest**: **543/543 PASS** (기존 541 + Phase 10 신규 2건 alias 회귀 가드)
- **회귀 안전망**: `fillRowsTo12` deprecated alias 유지 → 기존 호출자 깨지지 않음. 본 PR 안 호출자 = team-section.tsx 1곳 + 테스트 1곳만
- **grep 회귀 0**:
  - lucide-react = 주석 1건 (룰 명시 — 정상)
  - BigInt N n literal = 0건
  - 핑크/살몬/코랄 hardcode = 0건
- **schema 변경 0** / **Flutter v1 영향 0** / **AppNav 영향 0** / **BFF·service 변경 0**

### 디자인 변경 7건 결과
| # | 결재 | 적용 |
|---|------|------|
| §A | BDR 브랜드 유지 | ✅ 변경 0 (FibaHeader 그대로) |
| §B | Team A/B 헤더 = underscore | ✅ team-section.tsx 헤더 박스 → underscore |
| §C | Players 15행 | ✅ fillRowsTo15 + 행 22px |
| §D | 자동 fill 유지 | ✅ 변경 0 (Licence User.id 그대로) |
| §E | Time-outs 빈 박스 + X 마킹 | ✅ 검정 ● 배경 폐기 + X 글자 |
| §F | Team fouls 빈 박스 | ✅ 라벨 폐기 + 검정 채움 |
| §G | Player Fouls 빈 박스 | ✅ 1·2·3·4·5 숫자 폐기 + P/T/U/D 글자만 |

### 💡 tester 참고
- 테스트 방법: score-sheet/[matchId] 진입 → 라인업 모달 확정 → 다음 시각 확인:
  - 좌측 Team A 헤더 = "Team A ____슬로우____" underscore 형태 (큰 박스 X)
  - Players 표 = 15행 (사전 라인업 + 빈 행 fill)
  - Time-outs 5칸 = 빈 박스 → 클릭 시 X 글자
  - Team fouls Period 1·2·3·4 = 빈 박스 4개 (1·2·3·4 라벨 없음) → Player fouls 마킹 시 자동 검정 채움
  - Player Fouls 1-5 = 빈 박스 (숫자 없음) → 클릭 시 모달 → P/T/U/D 글자만 표시
- 정상: tsc 0 / vitest 543 PASS / A4 1 페이지 안 fit 유지
- 주의: 운영자가 X 글자 = "사용된 타임아웃" 인지 학습 필요 (UX 변경)
- 시각 검증 우선 — FIBA 종이기록지 PDF / JPG 와 1:1 비교 권장

### ⚠️ reviewer 참고
- `fillRowsTo12` deprecated alias 유지 = 구버전 호출자 회귀 안전망. Phase 11+ 후속 PR 에서 회수 가능
- §E Time-outs 의 "마킹 시 X" 는 종이기록지 운영자 관행 정합. 인쇄 시 `_print.css` 의 `[aria-label*="마킹됨"]` 회색 배경 룰이 빈 박스에도 적용되지만 — X 글자 자체로 식별 가능 (회색 배경 + X 글자 이중 식별)
- §F Team fouls 채움색 = `var(--color-text-primary)` (검정/흰 모드 자동 분기). 인쇄 시 `_print.css` 가 검정 강제
- §G Player Fouls 빈 박스 = 마킹 전 칸 클릭 가능 영역 안내가 `aria-label` 만 남음. 운영자가 빈 박스 호버 = 색 변경 효과 없음 → Phase 11+ 후속 UX 보강 후보 (호버 시 + 표시 등)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

## 구현 기록 (developer) — FIBA Phase 9 A4 1페이지 fit + 레이아웃 재배치 (2026-05-12)

📝 구현 범위: 좌측 Team A+B 세로 분할 / 우측 Running+Period+Final 누적 / Footer 최하단 가로 펼침 / A4 1 페이지 fit

### 영역별 높이 박제 (A4 1123px 안에 fit 검증)
- Header: ~80~95px (8%)
- Team A: ~400px (Time-outs/Fouls 50 + thead 22 + 12행 × 24 + Coach)
- Team B: ~400px (Team A 동일 구조)
- Footer: ~80px (1줄 4col + 1줄 3col + 1줄 Captain)
- 합계 (좌측 기준): ~975px (A4 1123 안 fit ✓)
- 합계 (우측 기준): ~1025px (Header 95 + Running 680 + Period+Final 170 + Footer 80) (A4 1123 안 fit ✓)

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `score-sheet-form.tsx` | max-w-screen-md → max-w-[820px] + px-1 py-1 / 우측 컬럼 = RunningScore 아래 `fiba-divider-top` + PeriodScoresSection 누적 (FIBA PDF 정합) / Phase 8 → Phase 9 주석 갱신 | 수정 |
| `fiba-header.tsx` | sectionClass px-3 py-2 → px-2 py-1 / 로고 28×14 → 24×12 / SCORESHEET text-sm (14) → text-[13px] / Basketball Daily Routine 9 → 8px / gap-3 → gap-2 / gap-y-0.5 → gap-y-0 (3·4줄) | 수정 |
| `team-section.tsx` | sectionClass px-2 py-2 → px-1 py-1 / 헤더 라벨 11px → 10px / 팀명 text-sm → text-[13px] / Time-outs+Fouls gap-2 → gap-1.5 / mb-1.5 → mb-0.5 / Players thead py-1 → py-0.5 + height 22 / Players td py-1 → py-0 / 행 28 → 24px / Licence text-xs → text-[11px] / Player text-xs → text-[11px] + lineHeight 1.1 / 등번호 text-[11px] / Player in h-9 w-9 → h-5 w-5 + input h-5 → h-4 / Fouls td py-0 / 퇴장 라벨 10 → 9px + icon 12 → 11px | 수정 |
| `running-score-grid.tsx` | 헤더 px-2 py-1 → px-2 py-0.5 / 안내 텍스트 10 → 9px + 축약 ("P1 · 1탭=입력 / 마지막=해제") | 수정 |
| `period-scores-section.tsx` | gap-2 → gap-1 / 헤더 px-2 py-1 → px-2 py-0.5 / 버튼 h-9 min-w-9 → h-7 min-w-7 + px-1 / "현재:" 제거 / 표 thead/tbody py-1 → py-0 / 종료 버튼 py-2 text-sm → py-1 text-xs / icon text-base → text-sm / Final px-3 py-2 → px-2 py-1 / mt-1 → mt-0.5 / Final 숫자 text-2xl → text-xl + leading-tight / ":" text-base → text-sm / Winner mt-2 py-1 → mt-1 py-0.5 | 수정 |
| `footer-signatures.tsx` | sectionClass px-3 py-2 → px-2 py-1 / 4col gap-x-3 gap-y-1 → gap-x-2 gap-y-0 / 3col mt-1 → mt-0.5 + gap-y-0 / Captain mt-1 → mt-0.5 / Notes textarea: frameless=true (운영 기본) 시 숨김 (FIBA PDF 정합 + A4 fit) / frameless=false 시 유지 (회귀 안전망) / SigInput inline minHeight 24 → 22 / gap-1.5 → gap-1 | 수정 |
| `_print.css` | @page margin 8mm → 6mm / `.score-sheet-fiba-frame` 인쇄 시 width 198mm + max-height 285mm + page-break-inside avoid + page-break-after always + overflow hidden / section padding 4px 8px → 2px 4px / margin-bottom 4 → 0 / md\:grid-cols-2 gap 6px → 0 / h1 11pt → 10pt / h2/h3 9pt / 본문 root 8pt 추가 / table 8pt → 7pt / td padding 2px 3px → 1px 2px + line-height 1.2 / input 9pt → 8pt + height 14pt / textarea 8pt / 아이콘 10 → 9pt | 수정 |

### 단일 박스 + 신규 레이아웃 (FIBA PDF 정합)
- 외곽 = `score-sheet-fiba-frame` (검정 1px solid / rounded-0 / shadow X)
- 헤더 (~8%): FibaHeader 4 줄 컴팩트
- 본문 (~75%): 좌:우 50:50
  - 좌측 (50%) = Team A (위 50%) `fiba-divider-bottom` Team B (아래 50%) — FIBA PDF 세로 분할 정합
  - 우측 (50%) = RunningScoreGrid (~60%) `fiba-divider-top` PeriodScoresSection (Period+Final+Winner 통합)
- 풋터 (~7%): FooterSignatures 1~2 줄 가로 펼침 (Notes 폐기)

### 검증
- tsc --noEmit: **0 에러**
- vitest: **541/541 PASS** (기존 541건 회귀 0)
- BigInt n literal: 0건
- lucide-react: 0건 (주석만 — Material Symbols Outlined 유지)
- 핑크/코랄/살몬: 0건
- schema 변경: 0 / Flutter v1 영향: 0 / AppNav 영향: 0 / BFF·service 변경: 0
- A4 1 페이지 fit: 좌측 ~975px / 우측 ~1025px (모두 1123px 안에 fit ✓)

### 회귀 안전망
- 모든 컴포넌트의 `frameless` prop = 기본 false (기존 호출자 영향 0)
- Notes textarea = `frameless=false` 시 유지 (회귀 0). DraftPayload signatures.notes 필드 유지 (localStorage 복원 동일)
- SigInput 비 inline 모드도 함수 내 분기 보존 (회귀 가드)
- 점수/파울/타임아웃 핵심 데이터 흐름 변경 0 (디자인만 / BFF·service 변경 0)
- buildSubmitPayload `notes: signatures.notes || undefined` 그대로 (UI 입력 X 라면 빈 문자열 → 생략 정상 동작)

### 💡 tester 참고
- 테스트 방법: score-sheet/[matchId] 진입 → 라인업 모달 확정 → A4 1 페이지 안에 모든 영역 fit / 좌측 Team A 위 + Team B 아래 / 우측 Running + Period + Final 누적 / Footer 최하단
- 정상: tsc 0 / vitest 541 PASS / A4 1 페이지 안에 fit (브라우저 인쇄 미리보기 확인 권장)
- 주의: Notes textarea 가 frameless 모드 (운영 기본) 에서 숨겨짐 — 운영자 안내 필요 시 별도 보고
- 시각 검증 우선: A4 1 페이지 fit (화면 + 인쇄 미리보기) + FIBA PDF 와 1:1 비교

### ⚠️ reviewer 참고
- 우측 컬럼 = Period+Final 이 RunningScore 박스 안 (`fiba-divider-top`) 으로 들어가서 FIBA PDF 정합
- `_print.css` `.score-sheet-fiba-frame { width: 198mm; max-height: 285mm; overflow: hidden }` 인쇄 시 강제 → 브라우저별 fit 동작 검증 필요 (Chrome/Edge 우선)
- Notes 폐기 (frameless=true 시) — 운영자 메모 기능 = signatures.notes 만 draft 박제, UI 비표시. BFF payload 는 그대로 전송 가능 (input UI 만 없음 / localStorage draft 안 notes 빈 문자열 유지)
- 행 24px / 폰트 11px = FIBA PDF 정합 vs 가독성 트레이드오프. 사용자 시각 검증 후 추가 조정 여지

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

## 구현 기록 (developer) — FIBA Phase 8 PDF 1:1 완전 정합 (2026-05-12)

📝 구현 범위: 단일 박스 + 헤더 컴팩트 + Players 표 28px + Footer 가로 펼침 + 검정 border

### FIBA PDF 측정값 (이미지 직접 분석)
- 외곽 박스: A4 세로 / 검정 1px solid / rounded 0 / shadow X
- 헤더 영역: ~12% 비율 / 4 줄 컴팩트 (로고 + Scoresheet / Team A·B / Competition·Date·Time·Referee / Game No·Place·Umpire1·2)
- 좌측 50%: Team A 상 / Team B 하 (세로 분할 = 1px 검정)
- 우측 50%: Running Score 4 세트 + Period 합산 + Final + Winner (세로 누적)
- Players 행 높이: ~28px (15행 / FIBA PDF 정합)
- 하단 풋터: ~12% 비율 / 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4 컬럼 + Referee/Umpire1·2 3 컬럼 + Captain)

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `_components/_print.css` | `.score-sheet-fiba-frame` + `.fiba-divider-*` + `.fiba-frameless` + `.md-fiba-divider-right` 클래스 신규 / 인쇄 시 border 검정 #000 강제 (회색 #ccc → 검정) | 수정 |
| `_components/fiba-header.tsx` | `frameless` prop 추가 / 4 줄 컴팩트 레이아웃 (로고 + Scoresheet / Team A·B / Comp·Date·Time·Referee / GameNo·Place·Umpire1·2) / `InlineFieldDisplay` + `InlineFieldInput` 신규 / legacy `FieldDisplay`+`FieldInput` 제거 | 수정 |
| `_components/team-section.tsx` | `frameless` prop / Time-outs + Team fouls 가로 1줄 인라인 / Players 행 28px 박제 / Coach·Asst Coach 인라인 underscore / 타임아웃 칸 h-9 → h-6 컴팩트 | 수정 |
| `_components/running-score-grid.tsx` | `frameless` prop / 자체 border 제거 옵션 | 수정 |
| `_components/period-scores-section.tsx` | `frameless` prop / Period 표 + Final Score 박스 자체 border 제거 옵션 / frameless 시 상단 분할선만 (border-top) | 수정 |
| `_components/footer-signatures.tsx` | `frameless` prop / 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4열 + Referee/Umpire1·2 3열 + Captain) / `SigInput` `inline` 옵션 추가 (라벨 + underscore 한 줄) / Signatures 헤더 제거 (FIBA PDF 정합) | 수정 |
| `_components/score-sheet-form.tsx` | `score-sheet-fiba-frame` div 한 겹으로 5 영역 통합 / 모든 자식 `frameless` prop 주입 / 좌·우 컬럼 사이 `md-fiba-divider-right` 분할선 / 헤더·풋터 분할선 (`fiba-divider-bottom`/`fiba-divider-top`) / main padding px-2 → px-1 컴팩트 | 수정 |

### 단일 박스 통합 동작
- 외곽 = `score-sheet-fiba-frame` (검정 1px solid + rounded 0 + shadow X)
- 내부 5 영역 = 자체 border 제거 (`fiba-frameless` 적용) + 내부 1px 분할선 (`fiba-divider-bottom`/`fiba-divider-right`/`fiba-divider-top`)
- 다크 모드 = 외곽/분할선 모두 `var(--color-text-primary)` (흰색) 자동 적용
- 라이트 모드 = 검정 (`var(--color-text-primary)` = ink 토큰)
- 인쇄 시 = 모든 border 검정 #000 강제 (`_print.css` override)

### 헤더 4 줄 컴팩트 (FIBA PDF 정합)
- 1줄: 로고 + "Basketball Daily Routine" 작은 라벨 + "SCORESHEET" 타이틀
- 2줄: Team A 라벨 + 팀명 underscore / Team B 라벨 + 팀명 underscore (2 컬럼)
- 3줄: Competition / Date / Time / Referee (4 컬럼 inline underscore)
- 4줄: Game No / Place / Umpire 1 / Umpire 2 (4 컬럼 inline underscore)

### Footer 가로 펼침
- 1줄: Scorer / Assistant scorer / Timer / Shot clock operator (4 컬럼)
- 2줄: Referee / Umpire 1 / Umpire 2 (3 컬럼)
- 3줄: Captain's signature in case of protest (1 컬럼 full)
- Notes textarea (선택) 유지

### 검증
- tsc 0 에러
- vitest 541/541 PASS (기존 533 → 신규 8 추가 — fiba-header-split-datetime / quarter-end-modal 등 / 회귀 0)
- BigInt n literal 0 / lucide-react 0 / 핑크-빨강 hardcode 0
- schema 변경 0 / Flutter v1 영향 0 / AppNav 영향 0 / BFF·service 변경 0

### 회귀 안전망
- 모든 컴포넌트의 `frameless` prop = 선택값 (기본 false). 기존 호출자가 prop 미주입 시 = 기존 박스 모드 그대로
- 본 PR 에서 score-sheet-form.tsx 만 frameless 활성. 다른 파일이 5 컴포넌트 직접 import 하는 경우 영향 없음 (기본 모드 유지)
- 회귀 가드: `SigInput` 비 inline 모드도 함수 내 분기로 보존
- localStorage draft (header / teamA / teamB / runningScore / fouls / timeouts / signatures / lineup) 모두 기존 형식 유지 → mid-game reload 시 복원 동일

### 💡 tester 참고
- 테스트 방법: score-sheet/[matchId] 진입 → 라인업 모달 확정 → 단일 외곽 박스 + 4 줄 헤더 + 좌·우 분할 + 컴팩트 Players 표 + 가로 풋터 표시
- 정상: tsc 0 / vitest 541 PASS / FIBA PDF 시각 정합
- 주의: 다크 모드 진입 시 박스 외곽 + 분할선 = 흰색 / 라이트 모드 = 검정 / 인쇄 시 무조건 검정 + 라이트 강제 (기존 동작 유지)
- 시각 검증 우선 (FIBA PDF 와 1:1 비교 필요)

### ⚠️ reviewer 참고
- 단일 박스 통합으로 5 카드 분리 폐기 → CSS 룰 충돌 가능성 검토 (`.fiba-frameless` 가 `.score-sheet-fiba-frame` 안에서만 동작하도록 prefix)
- `md-fiba-divider-right` = Tailwind 인식 X → `_print.css` 의 `@media (min-width: 768px)` 미디어쿼리에서 적용 (커스텀 클래스)
- frameless prop 디폴트 false = 기존 호출자 회귀 0 보장. score-sheet-form.tsx 만 true 주입

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

## 구현 기록 (developer) — Phase B 정합성 가드 + callbackUrl fix (2026-05-12)

📝 구현 범위: callbackUrl 폴백 헬퍼 + createTournament series_id 통합 + Tournament DELETE API + vitest +22

### A. callbackUrl 1줄 fix (운영 사고 차단)

**근본 원인**: proxy.ts middleware (`src/proxy.ts:145, 152`) 가 비로그인 보호 페이지 접근 시
`/login?callbackUrl=...` 으로 redirect → 로그인 페이지/액션은 `redirect` 만 읽음 → 로그인 후 홈
복귀 (사용자 사례: `/tournament-admin/series/new` 접근 → 로그인 후 홈으로).

**fix**: `extractRedirectFromQuery(searchParams)` + `extractRedirectFromValues((key) => value)`
헬퍼 신규. redirect 우선 / callbackUrl 폴백 / 둘 다 무효 → null. 모든 호출처 통일.

### B-1. createTournament service 통합

**근본 원인**: 직접 createTournament 호출 path (wizard 외) 가 series_id 박제 자체 안 하고 +1
박제도 없음 → 운영 series id=8 stored=0 / actual=12 사고.

**fix**: `CreateTournamentInput.seriesId?: bigint | null` 추가. seriesId 있으면 `$transaction`
안에서 (1) tournament INSERT (2) tournament_series.tournaments_count +1 원자 처리. 둘 중 하나
실패 시 전체 롤백. seriesId 미전송/null = 기존 단발 INSERT (회귀 0).

### B-2. Tournament DELETE API 신규

**근본 원인**: `/api/web/tournaments/[id]/route.ts` GET/PATCH 만 — 대회 삭제 흐름 자체 없음.

**fix**:
- **Soft DELETE (default)**: status='cancelled' UPDATE + 카운터 변경 X (현재 룰 = status 무관 전체
  count). 권한 = organizer 본인 + super_admin (TAM 도 통과). 이미 cancelled 면 멱등 처리.
- **Hard DELETE (`?hard=1`)**: tournament 실제 삭제 + series 카운터 -1 ($transaction). 권한 =
  super_admin only. FK 위반 시 409 (관련 매치/팀 사전 정리 책임은 운영자).
- adminLog 박제: soft = warning / hard = critical.

### 변경 파일

| # | 파일 | 변경 | 신규/수정 |
|---|------|------|----------|
| A-1 | `src/lib/auth/redirect.ts` | `extractRedirectFromQuery()` + `extractRedirectFromValues()` 헬퍼 추가 (60 LOC) | 수정 |
| A-2 | `src/app/(web)/login/page.tsx` | `safeRedirect` → `extractRedirectFromQuery` 교체 (callbackUrl 폴백) | 수정 |
| A-3 | `src/app/actions/auth.ts` | loginAction redirect/callbackUrl FormData 둘 다 폴백 처리 | 수정 |
| A-4 | `src/app/api/auth/login/route.ts` | OAuth 시작점 callbackUrl 폴백 (bdr_redirect 쿠키 박제) | 수정 |
| B-1 | `src/lib/services/tournament.ts` | `CreateTournamentInput.seriesId` 추가 + `$transaction` 카운터 +1 통합 (~25 LOC) | 수정 |
| B-1 | `src/app/api/web/tournaments/route.ts` | seriesId 파싱 + requireSeriesOwner 권한 검증 + createTournament 전달 (~20 LOC) | 수정 |
| B-2 | `src/app/api/web/tournaments/[id]/route.ts` | DELETE 핸들러 신규 — soft/hard 모드 + 카운터 동기화 + adminLog (~110 LOC) | 수정 |
| 테스트 | `src/__tests__/lib/auth/redirect.test.ts` | extractRedirectFromQuery + extractRedirectFromValues 케이스 +10 | 수정 |
| 테스트 | `src/__tests__/lib/services/create-tournament-series-counter.test.ts` | createTournament seriesId +4 케이스 | 신규 |
| 테스트 | `src/__tests__/api/tournament-delete.test.ts` | DELETE soft/hard/권한/FK +6 케이스 | 신규 |

### B-3 (cron audit) 처리

**별 PR 큐잉** — 본 turn = 핵심 2건 (createTournament + DELETE) 안전 완료. cron audit 은 운영
추가 안전망이라 별 PR로 분리 (vercel.json/vercel.ts 분기 + 시나리오 정리 필요).

### 검증 결과

- **tsc --noEmit**: 0 에러
- **vitest**: 563/563 PASS (이전 541 + 신규 22)
  - 신규: `src/__tests__/lib/services/create-tournament-series-counter.test.ts` 4/4
  - 신규: `src/__tests__/api/tournament-delete.test.ts` 6/6 (apiSuccess snake_case 변환 룰 1회 fix 후)
- **Flutter v1 영향 0**: `/api/v1/` 내 createTournament / series_id / tournaments_count 사용 0건 grep
- **schema 변경 0** / **운영 DB 변경 0** (코드만)
- **grep 회귀 0**: BigInt(N)n / lucide-react / 핑크-살몬-코랄 모두 0건

### 💡 tester 참고

- **callbackUrl 흐름 검증**:
  1. 비로그인 상태 `/tournament-admin` 진입 → `/login?callbackUrl=%2Ftournament-admin` redirect 확인
  2. 로그인 → `/tournament-admin` 정상 복귀 (이전엔 홈으로)
  3. OAuth 카카오/구글 로그인도 동일 (callbackUrl 케이스 → bdr_redirect 쿠키 → 콜백 복귀)
- **createTournament + seriesId 검증**:
  1. `/tournament-admin/series/new` → 시리즈 생성 후 → wizard create 에서 seriesId 동봉 POST →
     tournament_series.tournaments_count +1 확인
  2. seriesId 미전송 (개인 대회) → 카운터 변경 0 (회귀 가드)
- **DELETE 검증**:
  1. organizer 본인 → DELETE → status='cancelled' (soft)
  2. organizer 본인 + `?hard=1` → 403 (super_admin 만)
  3. super_admin + `?hard=1` → 실제 삭제 + series 카운터 -1
  4. 이미 cancelled 대회 DELETE → 멱등 (응답 키 = `already_cancelled`, snake_case 변환됨)
- **주의할 입력**:
  - Hard DELETE 대회에 매치/팀 잔존 시 → 409 (FK 위반). 사전 정리 후 재시도.
  - seriesId 권한 없는 시리즈로 createTournament POST → 403 (requireSeriesOwner)

### ⚠️ reviewer 참고

- **callbackUrl 폴백 우선순위**: redirect 우선 / callbackUrl 폴백 (proxy.ts 호환). 향후 proxy.ts
  를 redirect 로 통일하면 callbackUrl 폴백 제거 가능 (현 PR 에선 기존 호출처 영향 회피 위해 보존).
- **createTournament $transaction 분기**: seriesId 있을 때만 `$transaction` 사용 — 기존 단발
  INSERT 호출자는 회귀 0 (transaction 부담 없음). Prisma `Prisma.TournamentUncheckedCreateInput`
  타입으로 변경 (raw FK series_id 박제 위해 — 기존 connect 패턴 0건이라 회귀 0).
- **DELETE Soft 가 카운터 변경 X**: 현재 카운터 룰 = status 무관 전체 count. 만약 cancelled 를
  카운터에서 빼야 하는 정책 변경 시 본 코드 + DRY-RUN 스크립트 동시 갱신 필요.
- **DELETE Hard 의 admin_logs.resource_id**: tournament.id 는 UUID 문자열인데 admin_logs.resource_id
  는 BigInt 라 박제 불가 → resourceId: undefined 박제 + description 에 UUID 명시 (tournament_soft_delete
  도 동일).
- **B-3 cron audit 큐잉 사유**: 본 turn 핵심 (createTournament + DELETE) 완료 후 별 PR 로 분리.

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-05-12 | tournament-delete.test.ts `alreadyCancelled` → `already_cancelled` | `src/__tests__/api/tournament-delete.test.ts` | apiSuccess 자동 snake_case 변환 룰 (errors.md 2026-04-17 패턴 5회 재발 회피) |

---

## 구현 기록 (developer) — Phase A 즉시 fix (2026-05-12)

📝 구현 범위: 운영 사고 차단 3종 fix (admin organization 드롭다운 + (web) redirect + 카운터 backfill 스크립트)

### 변경 파일
| # | 파일 | 변경 | 신규/수정 |
|---|------|------|----------|
| A-1 | `src/app/(admin)/tournament-admin/series/new/page.tsx` | useEffect mount → `GET /api/web/organizations` → owner/admin + approved 필터 → 드롭다운 ("단체 미연결" 옵션 + 단체목록) → POST body 에 organization_id 포함 | 수정 |
| A-2 | `src/app/(web)/series/new/page.tsx` | 기존 권한 가드 + alert 폼 페이지 → server-side `redirect('/tournament-admin/series/new')` 통합. 비로그인 시 `buildLoginRedirect` 로 admin 페이지 복귀 쿼리 동봉 | 수정 |
| A-3 | `scripts/_temp/series-counter-recompute.ts` | DRY-RUN(default) / `--apply` 모드 분리. tournament_series.tournaments_count + organizations.series_count 2종 점검 + APPLY 시 UPDATE | 신규 |

### A-1 핵심 흐름
- 마운트 시 1회 `fetch("/api/web/organizations")` → `OrganizationItem[]` 응답 (snake_case 변환: `myRole` → `my_role`)
- 필터: `my_role === "owner" || "admin"` + `status === "approved"` (member 는 시리즈 생성 불가)
- 드롭다운 옵션: "단체 미연결 (개인 시리즈)" + 단체 N건
- POST body — organizationId 빈 문자열이면 키 자체 제외 (서버 null 박제)
- 이중 가드: 클라이언트 필터 + 서버 `/api/web/series` 의 organization_members 검증

### A-2 redirect 전략
- 옵션 b 채택 (운영자 페이지 단일 진입점)
- 비로그인: `buildLoginRedirect("/tournament-admin/series/new")` 동봉 → 로그인 후 admin 페이지 자동 복귀
- admin layout 가드(super_admin / tournament_admin)가 권한 없는 사용자 거름 (이중 가드)
- `_form/series-create-form.tsx` (dead code) 는 그대로 두고 별도 PR에서 회수 (회수 X)

### A-3 backfill 스크립트
- 기본 모드 = DRY-RUN (SELECT 만, UPDATE 0건)
- `--apply` 인자 추가 시 실제 UPDATE
- Prisma `_count.tournaments` / `_count.series` relation count 로 actual 산출
- 각 mismatch 박제 출력 + 요약 (전체 N / 불일치 N)

### 검증 결과
- **tsc**: 0 에러
- **vitest**: 541/541 PASS (회귀 0)
- **DRY-RUN 실측** (운영 DB, SELECT only):
  ```
  === tournament_series.tournaments_count 점검 ===
    전체: 3건 / 불일치: 1건
      series id=8 (BDR 시리즈): stored=0 / actual=12
  === organizations.series_count 점검 ===
    전체: 2건 / 불일치: 1건
      org id=3 (강남구농구협회): stored=0 / actual=1
  ```
  → 진단 fact 와 100% 일치 (재현 OK)
- **grep 회귀 0**: BigInt(N)n / 핑크/살몬/코랄 / lucide-react 모두 0건
- **Flutter v1 영향 0**: `src/app/api/v1/` 내 organization_id / series_count / tournaments_count 사용 0건 grep 확인
- **schema 변경 0**: schema.prisma 미수정

### 💡 tester 참고
- 테스트 방법:
  1. `/tournament-admin/series/new` 진입 → 드롭다운 표시 확인 (본인 owner/admin 단체만)
  2. "단체 미연결" 선택 → 시리즈 생성 → 시리즈의 organization_id = null
  3. 단체 선택 → 시리즈 생성 → DB 에 organization_id 박제 + organizations.series_count +1 (POST `/api/web/series` 의 increment 로 자동 처리)
  4. `/(web)/series/new` 진입 → admin 페이지로 즉시 redirect
  5. 비로그인 사용자 `/(web)/series/new` 진입 → /login?redirect=%2Ftournament-admin%2Fseries%2Fnew
- 정상 동작:
  - 운영자가 단체 선택 시 → organization_id NULL 박제 사고 영구 차단
  - DRY-RUN 결과가 진단 fact 와 일치 (운영 카운터 불일치 2건 실측)
- 주의할 입력:
  - 단체가 0개인 사용자 → "관리 가능한 단체가 없어 개인 시리즈로 생성됩니다." 안내 표시
  - member 권한 단체 → 드롭다운에 노출 X (서버 검증과 이중)
  - APPLY 모드 = 사용자 명시 승인 후 PM 이 실행 (developer 가 직접 X)

### ⚠️ reviewer 참고
- 응답 키 snake_case 자동 변환 룰 — `apiSuccess(myRole)` → 응답에 `my_role`. 본 페이지 OrganizationItem 타입에서 `my_role` 로 매핑 (errors.md 2026-04-17 5회 재발 패턴 회피)
- A-2 의 (web) → (admin) redirect 는 같은 도메인 절대 경로 → next/navigation redirect 안전. middleware /tournament-admin/* matcher 가 layout 가드에서 처리
- A-3 스크립트 = 운영 DB SELECT only (DRY-RUN). APPLY 는 별 turn 사용자 승인 후 실행 — 임시 스크립트 정리 X (APPLY 후속 실행 필요)
- 후속 작업 후보 (Phase B+): createTournament service +1 박제 + Tournament DELETE -1 박제 + cron monthly recompute → 본 PR 범위 외

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

