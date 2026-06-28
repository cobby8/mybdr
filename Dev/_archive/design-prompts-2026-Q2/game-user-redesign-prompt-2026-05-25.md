# 클로드 디자인 의뢰 — 경기 사용자 측 + 사용자↔관리자 연결 다리 (Phase 2B)

> **의뢰일**: 2026-05-25
> **수신**: 클로드 디자인 (Claude.ai Project — bdr 디자인 시스템 관리)
> **선행 자료**:
> - `Dev/design/prompts/game-user-admin-connectivity-plan-2026-05-25.md` (상위 계획서 / BG1~BG7 갭)
> - `Dev/design/prompts/game-admin-redesign-prompt-2026-05-25.md` (Phase 2A 짝 의뢰)
> - `Dev/design/prompts/tournament-user-redesign-prompt-2026-05-25.md` (Phase 1B — 동일 형식)
> **이번 의뢰 (Phase 2B)**: 사용자 측 5 부분수정 + 신규 3 (variant 1 / 마이페이지 통합 1 / 홈 LIVE 띠 1) = **총 8 시안**
> **활성 시안**: `Dev/design/BDR-current/` 단일 폴더
> **운영 코드 변경**: 0 — 시안 박제만 (운영 박제는 별 Phase 2C)
> **결재 결과 (2026-05-25)**:
> - 범위 = BG1~BG7 (BG8 자동 매칭 = 별 Phase)
> - **BG7 라이브 띠 = Hero 카로셀 위 sticky chip row** (사용자 결정 §5 보존)
> - **BG2 "내 매너" 노출 수위 = 평균 평점 + flag 종류 (개별 건수 ❌)**
> - Phase 1A 먼저 Claude.ai 전달 → 그 사이 본 의뢰 작성 (병행)

---

## 0. 진입 — 표준 절차 (BDR 디자인 시스템 관리)

**Step 1**: `Dev/design/claude-project-knowledge/00-master-guide.md` 읽기 (13 룰 인지)
**Step 2**: 본 의뢰의 영향 받는 보조 파일 — **01 (사용자 결정 §1~§8) / 02 (토큰) / 03 (AppNav frozen — A 등급 강제) / 04 (페이지 인벤토리 §3.5 v2.16 경기 디자인 언어) / 06 (자체 검수)**
**Step 3**: 첫 응답 (표준 형식):

```
✅ BDR 디자인 의뢰 확인 — 경기 사용자 측 + 사용자↔관리자 연결 다리 (Phase 2B)
이해: UA1~UA5 부분수정 5 + UB1 신규 1 (GameResult variant) + UC1 마이페이지 통합 1 + UC2 홈 LIVE 띠 1 = 8 시안
사용자 결정 §1~§8 보존 (특히 §5 Hero 카로셀 — UC2 가 위 sticky 띠로 명시) / AppNav frozen — 03 카피 (A 등급)
결재 룰 반영 = BG2 평균+종류만 / BG7 Hero 위 sticky
자체 검수: 06 §1, §2, §3, §5, §6 (A 등급) + §7 (관리자 보강 시 E 등급)
작업 시작.
```

---

## 1. 의뢰 배경 (BG1~BG7 — 사용자 측 + 연결 다리)

본 의뢰는 **운영 코드 변경 0** / 시안 박제만. 상위 계획서의 7 갭 중 사용자 측 또는 양측 보강이 필요한 갭 7건 모두 처리.

### 1-1. BG4 — MVP 시상 UI 미구현 (★★★★★)

- 시안 `GameResult.jsx` 존재 + DB `games.final_mvp_user_id` + `recomputeFinalMvp()` 모두 박제. **단 운영 페이지 0**. `/games/[id]?status=3` 분기 시 자동 렌더 안 됨.
- **시나리오**: "어제 픽업게임 끝났는데 누가 MVP였지? 결과 페이지 어디?"
- **비유**: 시상식은 했는데 트로피가 어디 있는지 모름.

### 1-2. BG6 — 사용자 경기 통합 hub 부재 (★★★★)

- Phase 1B UC1 (마이페이지 "내 대회") = 대회만 / `/games/my-games` 별 페이지 = 경기만. **대회 + 경기 통합 hub 부재**.
- **비유**: 일정 앱이 회사 / 개인 / 가족 각자 별 앱.

### 1-3. BG7 — 라이브 중계 진입점 분산 (★★★★)

- `/live/[id]` 라우트 존재 / 진입 트리거 = 어디서 라이브 진행 중인지 발견성 0.
- **사용자 결재**: Hero 카로셀 **위** sticky LIVE chip row (사용자 결정 §5 Hero 카로셀 보존 / 위에 추가 sticky 영역).
- **비유**: 케이블 TV 채널은 있는데 편성표가 없음.

### 1-4. BG1 — 신청 승인/거절 상태 동기 (★★★)

- 사용자 신청 → 호스트 승인 → status 업데이트. **UI 갱신 약함** — 사용자가 새로고침해야 확인.

### 1-5. BG2 — 매너 평가 검토 큐 비대칭 (★★★)

- 사용자 본인이 본인 평점 / flags 어디서 보는지 불명. 마이페이지에 "내 매너" 카드 부재.
- **사용자 결재**: **평균 평점 + flag 종류 (키워드 / 뉘앙스) 만 노출 / 개별 건수 ❌**.

### 1-6. BG3 — 게스트 experience vs user.skill_level 이원화 (★★★)

- `game_applications.experience_years` (경기별) + `user.skill_level` (온보딩) 분리. 사용자가 매번 입력 = 마찰.

### 1-7. BG5 — 호스트 액션 범위 (★★)

- HostPanel 의 호스트 액션 룰 (자동 승인 vs 수동 승인) UI 부재. 경기 생성 시 명시 필요.

### 1-8. 본 의뢰에서 제외 (별 Phase)

- **BG8 자동 매칭** = 추천 알고리즘 설계 + admin 대시보드 필요. 별 Phase.

---

## 2. 대상 페이지 (4 영역 / 8 시안)

### 영역 UA. 사용자 경기 페이지 (부분수정 5)

| 파일 | 라우트 | 박제 등급 | 보강 내용 |
|------|------|---------|---------|
| `Games.jsx` (UA1) | `/games` | B → v2.16 박제 | BG7 Hero 위 sticky LIVE chip row + BG4 종료 카드 우승팀 라인 |
| `GameDetail.jsx` (UA2) | `/games/[id]` | A (`_v2`) | BG1 신청 step indicator (sidebar) + BG4 status='completed' 분기 (UB1 으로) |
| `CreateGame.jsx` (UA3) | `/games/new` | A | BG5 자동 승인 토글 + BG3 게스트 옵션 강화 |
| `GuestApply.jsx` (UA4) | `/games/[id]/guest-apply` | A | BG3 user.skill_level 자동 채우기 |
| `Live.jsx` (UA5) | `/live/[id]` | A (`_v2`) | BG7 진입점 강화 + 대회/일반 경기 라이브 분기 라벨 |

### 영역 UB. 사용자 신규 (variant 1)

| 파일 | 라우트 | 역할 |
|------|------|------|
| `GameResult.jsx` 운영 박제 (UB1) | `/games/[id]` (status='completed' variant) | BG4 — 우승팀 + MVP + 최종 score + 매너 평가 진입 |

### 영역 UC. 마이페이지 통합 + 홈 LIVE 띠 (2)

| 파일 | 라우트 | 역할 |
|------|------|------|
| `MyActivity.jsx` (UC1) 보강 | `/profile/activity` | BG6 — Phase 1B 의 "내 대회" 위에 "내 경기" 섹션 추가 (대회+경기 통합 hub) + "내 매너" 카드 (BG2) |
| `Home.jsx` (UC2) | `/` | BG7 — Hero 카로셀 **위** sticky LIVE chip row (사용자 결정 §5 Hero 카로셀 보존) |

---

## 3. 각 페이지 상세 요구사항

### 3-UA1. `Games.jsx` — 목록 + Hero 위 LIVE 띠 + 종료 우승팀 라인

**현재 결함**:
- 04-page-inventory §3.5 v2.16 디자인 언어 (GameCard / Date Tile / Area Chip / 종별 컬러 / Pretendard 900 / Concept B) **이미 박제 완료**.
- 단 **BG7 LIVE 띠 부재** (사용자가 라이브 중인 경기 발견 어려움) / BG4 종료 카드의 우승팀 라인 없음.

**시안 요구사항**:
- **상단 LIVE chip row sticky (BG7)** — page 진입 시 hero 자리 위에 sticky:
  - 좌측 라벨 = "🔴 LIVE" (`var(--err)` 표시 + 깜박임)
  - chip = 진행 중 경기 카드 1개당 mini chip (예: "U10 결승 · 강남BC vs 마포FC · Q3 14-10")
  - 클릭 시 `/live/[id]` 진입
  - 라이브 0 건 = 띠 hidden (chip row 자체 안 보임)
  - 모바일 = 가로 스크롤
- **종료 카드 우승팀 라인 (BG4)** — status=completed 경기 카드 = hero 자리에 "🏆 강남BC 우승 · MVP 박수빈" 1줄 (`var(--accent)` 라인)
- **기존 7칩 필터** = 보존 (전체 / 모집 중 / 진행 / 종료 / 픽업 / 게스트 / 연습) + 종별 탭 보존
- **카드 grid** = v2.16 GameCard 그대로 + BG4 우승팀 라인 추가

**보존 항목**:
- `GET /api/web/games` 응답 / 페이지네이션
- v2.16 GameCard 디자인 언어 (Date Tile / Area Chip / 호스트 아바타 / Progress)
- 클릭 시 `/games/[id]` 이동

**모바일 (≤720px)**:
- LIVE chip row = 가로 스크롤 sticky (max-height 56px)
- 카드 1열 stack
- 필터 chip = 가로 스크롤

**자체 검수 — A 등급 강제**:
- 06 §1 AppNav (03 frozen 카피 / 위반 검수 4 케이스 통과)
- 06 §2 더보기 (가짜링크 신규 추가 ❌)
- 06 §3 디자인 토큰 (var(--*) / `--color-*` 0)
- 06 §5 모바일
- 06 §6 연결성 (JSDoc — 진입 / LIVE chip 클릭 흐름 / 종료 카드 흐름)

---

### 3-UA2. `GameDetail.jsx` — 상세 + 신청 step indicator (sidebar)

**현재 결함**:
- Concept B (5×2 슬롯 보드) / GameDetailHero (V2 Hero-led) / SummaryCard / AboutCard / ParticipantList / ApplyPanel / HostPanel / ApplyRibbon / MobileStickyBar **이미 박제 완료** (v2.16).
- **BG1 신청 step indicator 부재** = 본인이 신청한 상태를 본 페이지에서 한 눈에 못 봄.
- BG4 status='completed' variant 분기 = UB1 으로 분리.

**시안 요구사항**:
- **기존 Hero + 5 섹션 골격 보존** (v2.16)
- **Sidebar (또는 ApplyPanel 영역) 에 "내 신청 현황" step indicator 추가 (BG1)**:
  - 3 단계 step = ⓵ 신청 완료 → ⓶ 호스트 승인 대기 → ⓷ 참가 확정
  - 본인이 신청 안 한 상태 = step indicator hidden / ApplyPanel "신청하기" CTA 만
  - 본인 신청 = step indicator 표시 + 현재 단계 `var(--accent)` / 완료 `var(--ok)` / 미달 `var(--ink-mute)`
  - 단계별 시간 (예: "5/24 22:30 신청 / 5/25 09:15 승인")
  - 클릭 시 `/profile/activity` "내 경기" 섹션 deep-link (BG6 와 연결)
- **status='completed' 분기** = UB1 (GameResult variant) — 본 시안에 분기 명시만 (상세는 UB1 참조)

**보존 항목**:
- v2.16 박제 골격 (Hero / SummaryCard / AboutCard / ParticipantList / ApplyPanel / HostPanel / ApplyRibbon / MobileStickyBar / Concept B)
- 5 단계 신청 데이터 모델 (`game_applications.status` = 0/1/2)

**모바일 (≤720px)**:
- step indicator = 가로 chip row + MobileStickyBar 와 충돌 안 하게 위치
- 기존 v2.16 모바일 sticky 보존

**자체 검수 — A 등급 강제**: 06 §1 / §2 / §3 / §5 / §6 모두 통과

---

### 3-UA3. `CreateGame.jsx` — 자동 승인 토글 + 게스트 옵션 강화

**현재 결함 (BG5 / BG3)**:
- 경기 생성 위저드 v2 박제 완료. 단 **자동 승인 vs 수동 승인 토글 부재** (BG5) / 게스트 모집 옵션 시각 약함 (BG3 보조).

**시안 요구사항**:
- **위저드 안 "신청 정책" 섹션 신규**:
  - 토글 = "자동 승인" (ON = 신청 즉시 참가 확정 / OFF = 호스트 수동 승인) — 기본 ON
  - 보조 텍스트 = "ON 권장: 빠른 매칭" / "OFF: 신청자 사전 검토" 1줄
  - 자동 승인 = `var(--ok)` 뱃지 / 수동 = `var(--warn)` 뱃지
- **"게스트 모집" 옵션 강화 (BG3)**:
  - 토글 = "게스트 신청 허용" — 기본 OFF
  - ON 시 = "최소 경력" select (1년 / 2년 / 3년 / 무제한) + "약관 동의 필수" 체크박스 (기본 ✅)
- **고급 아코디언 (기존)** = 보존 + 신청 정책 / 게스트 옵션 노출

**보존 항목**:
- v2 위저드 골격 (3카드 폼 + 라이브 프리뷰)
- POST `/api/web/games` API 시그니처 (운영 변경 0)

**모바일 (≤720px)**:
- 토글 풀폭 / 라이브 프리뷰 = 하단으로 stack

**자체 검수 — A 등급 강제**: 06 §1 / §2 / §3 / §5 / §6 모두 통과

---

### 3-UA4. `GuestApply.jsx` — user.skill_level 자동 채우기

**현재 결함 (BG3)**:
- `game_applications.experience_years` 와 `user.skill_level` 이원화. 사용자가 본인 정보 매번 다시 입력.

**시안 요구사항**:
- **폼 진입 시 user.skill_level → experience_years 자동 추론 + prefill**:
  - skill_level 1 = experience 1년 (입문) / level 2 = 2년 / level 3 = 5년 / level 4 = 10년 / level 5 = 15년+
  - 추론된 값 옆에 ⓘ 라벨 = "내 프로필 실력에서 자동" — 수정 가능
- **약관 스냅샷 영역 (기존)** = 보존
- **신청 완료 후 안내** = "호스트 승인 시 알림으로 알려드립니다" 1줄 (BG1 사후 안내와 통일)

**보존 항목**:
- 폼 필드 (경력 / 약관 / 인사말 / 알러지)
- POST `/api/web/games/[id]/apply` (is_guest=true) 시그니처

**모바일 (≤720px)**:
- 폼 1열 stack / 약관 풀폭

**자체 검수 — A 등급 강제**: 06 §1 / §2 / §3 / §5 / §6 모두 통과

---

### 3-UA5. `Live.jsx` — 진입점 강화 + 대회/일반 경기 분기

**현재 결함 (BG7)**:
- `/live/[id]` 라우트 v2 박제 완료. 단 **대회 매치 vs 일반 경기 시각 분리 0** / 진입 시 "어떤 종류 라이브인지" 즉시 인지 어려움.

**시안 요구사항**:
- **Hero 라벨 강화**:
  - 대회 매치 = `🏆 [대회명] · [라운드]` (예: "강남구협회장배 · 4강")
  - 일반 경기 (픽업/게스트/연습) = `🏀 [종별] · [경기 유형]` (예: "5x5 · 픽업")
  - 라벨 색상 분리 (`var(--cafe-blue)` 대회 / `var(--accent)` 일반)
- **하단 "다음 경기" / "관련 경기" 영역 신규**:
  - 같은 대회 다음 매치 또는 같은 호스트 다음 경기 추천 (없으면 hidden)
- **본문 (스코어 / 기간 / 통계)** = v2 박제 보존

**보존 항목**:
- 스코어 / 기간 / 통계 데이터 모델
- WebSocket 또는 polling 갱신 동작

**모바일 (≤720px)**:
- Hero 라벨 1줄 / 본문 1열

**자체 검수 — A 등급 강제**: 06 §1 / §2 / §3 / §5 / §6 모두 통과

---

### 3-UB1. `GameResult.jsx` 운영 박제 — `/games/[id]` status='completed' variant (신규)

**현재 결함 (BG4 핵심 ★★★★★)**:
- 시안 `GameResult.jsx` 존재. 단 운영 `/games/[id]` 의 status='completed' 분기 시 자동 렌더링 안 됨.

**시안 요구사항**:
- **같은 라우트 status 분기** = `/games/[id]` 에서 status='completed' 시 본 variant 렌더 (신규 라우트 X — 더보기 가짜링크 룰 통과)
- **Hero band 신규**:
  - 🏆 + MVP 닉네임 (Pretendard 900 큰) + 아바타
  - 부제 = 경기명 + 종료 시간 + 종별
  - 우측 = 최종 score (홈 vs 어웨이)
- **본문 카드 grid (4 카드)**:
  1. **참가자 전체** (Concept B 스타일 — 5×2 슬롯 보존) + 매너 평점 평균 (`game_player_ratings` 평균)
  2. **MVP / 베스트 플레이어** = MVP 카드 1 + 베스트 3 (rating 상위)
  3. **매너 평가 진입** = "평가 제출하기" CTA → `/games/[id]/report`
  4. **호스트 한마디** = 종료 메시지 입력 가능 (호스트만)
- **하단 CTA** = "공유하기" + "다른 경기 둘러보기" (`/games`)

**보존 항목**:
- 같은 라우트 (`/games/[id]`) status 분기 — 신규 라우트 X
- `games.final_mvp_user_id` / `recomputeFinalMvp()` 데이터 출처
- 평가 제출 라우트 (`/games/[id]/report`) — 기존

**모바일 (≤720px)**:
- Hero 풀폭 / 4 카드 1열 stack / CTA sticky bottom

**자체 검수 — A 등급 강제**:
- 06 §6-2 About 운영진 실명 ❌ — 본 시안 MVP 닉네임 = DB 출처 (`mvp_player_id → user.nickname`) — 운영진 실명과 별개 → 충돌 0
- 06 §1 / §2 / §3 / §5 / §6 모두 통과

---

### 3-UC1. `MyActivity.jsx` 보강 — "내 경기" 섹션 + "내 매너" 카드 (BG6 + BG2)

**현재 결함 (BG6 / BG2)**:
- Phase 1B 의뢰의 UC1 (MyActivity.jsx "내 대회" 섹션) 박제 완료 (BDR-current v2.18). **단 경기 통합 X / 내 매너 X**.
- 사용자가 본인 매너 점수 어디서 봐야 할지 불명 (BG2).

**시안 요구사항**:
- **Phase 1B "내 대회" 섹션 보존** + 다음 추가:
  - **"내 경기" 섹션 (신규 / BG6)**:
    - 카드 list = 본인이 신청한 경기 (`game_applications` 조회) — 상태별 정렬:
      - 🟡 승인 대기 (status=0) — 상단
      - 🟢 참가 확정 (status=1) + 진행 중
      - ✅ 종료 (status=3, 완료된 경기) — 시간 역순
      - ❌ 취소 (status=2) — 하단
    - 각 카드 = 경기명 + 종별 + 호스트 + step indicator (UA2 와 동일 톤) + deep-link
  - **"내 매너" 카드 (신규 / BG2)** — 사용자 결재 룰 = **평균 + flag 종류만** (개별 건수 ❌):
    - 헤더 = "내 매너 평가" + ⓘ "최근 50건 평균"
    - 큰 숫자 = 평균 평점 (예: 4.3 / 5.0) + 색상 분기 (`var(--ok)` 4.5+ / `var(--warn)` 3.0~4.4 / `var(--err)` 3.0 미만)
    - 평가 받은 횟수 (예: "32명에게 평가 받음")
    - 받은 flag 키워드 (있는 경우만) = "정확한 시간 도착 👍 / 약속 시간 늦음 ⚠" — 키워드 / 뉘앙스만 / **개별 건수 ❌**
    - **빈 상태** = "아직 매너 평가가 없습니다. 더 많은 경기에 참가해보세요"
- **상단 진입 카운트** = "내 대회 N건 · 내 경기 M건 · 평균 매너 X.Y" 한 줄
- **빈 상태** (전체) = "아직 신청한 활동 없음. 모집 중인 경기/대회 둘러보기" → `/games` `/tournaments`

**보존 항목**:
- Phase 1B UC1 "내 대회" 섹션 골격 (BDR v2.18 박제)
- 마이페이지 hub 룰 (Phase 13)
- `MyRegistrationStatus` 컴포넌트 시그니처 (대회/경기 양쪽 재사용 가능)
- 더보기 메뉴 신규 추가 ❌

**모바일 (≤720px)**:
- 3 섹션 1열 stack (내 대회 → 내 경기 → 내 매너)
- 카드 list 1열

**자체 검수 — A 등급 강제**:
- 06 §1 / §2 (가짜링크 추가 ❌) / §3 / §5 / §6 모두 통과
- **사용자 결재 룰 (BG2 = 평균 + flag 종류만 / 개별 건수 ❌) 적용** — flag 키워드는 가독성 있게 (예: "✓ 시간 약속 / ⚠ 늦음" 같이 / 단 "no_show 2회" ❌)

---

### 3-UC2. `Home.jsx` — Hero 카로셀 **위** sticky LIVE chip row (BG7)

**현재 결함 (BG7)**:
- 사용자 라이브 발견성 0. 홈 진입 시 "지금 라이브 중인 경기" 인지 0.

**시안 요구사항** (사용자 결재 반영 = Hero 카로셀 **위** sticky):
- **Hero 카로셀 (사용자 결정 §5 보존)** 그대로 / **위에 sticky LIVE chip row 신규**:
  - 위치 = AppNav 바로 아래 / Hero 카로셀 위 (PC + 모바일 동일)
  - 라벨 = "🔴 LIVE" (`var(--err)` + 깜박임 1.5s loop)
  - chip = 진행 중 경기 mini card (예: "U10 결승 · 강남BC vs 마포FC · Q3 14-10 · 5분")
  - 라이브 0건 = 띠 hidden (carousel 만)
  - 라이브 1~4건 = chip row (가로 정렬)
  - 라이브 5건+ = 가로 스크롤 (chevron 좌우 화살표 PC 만)
  - 클릭 시 `/live/[id]` 진입
- **Hero 카로셀 (사용자 결정 §5)** = 변경 0 / 보존
- **본문** = 변경 0 (기존 홈 섹션 보존)

**보존 항목**:
- **사용자 결정 §5 — Hero 카로셀 — 그대로 보존** (절대 변경 ❌)
- 홈 본문 섹션 (추천 / 최근 / 단체 / 코트 / 커뮤니티 등) 모두 변경 0
- AppNav frozen — 03 카피

**모바일 (≤720px)**:
- LIVE chip row 가로 스크롤 sticky / max-height 48px
- 라이브 0건 = 띠 hidden / 모바일 viewport 차지 안 함

**자체 검수 — A 등급 강제**:
- 06 §1 AppNav 03 frozen — **본 시안 AppNav 변경 ❌**
- 06 §2 더보기 가짜링크 추가 ❌
- 06 §3 토큰 (LIVE chip = `var(--err)` 깜박임 / 본문 = `var(--accent)` / `var(--cafe-blue)`)
- 06 §5 모바일
- 06 §6 연결성 — JSDoc 매트릭스 (LIVE chip 클릭 → /live/[id] / 라이브 0건 처리)

→ **PM 결재 룰 명시**: 사용자 결정 §5 = Hero 카로셀 보존. 본 시안은 **카로셀을 변경하지 않고 위에 추가 영역** = §5 충돌 0 (사용자 결재 확인 — Hero 카로셀 위치와 우선순위 = "위 sticky 띠").

---

## 4. 디자인 원칙 13 룰 (00-master-guide §13 룰)

> 본 의뢰는 **사용자 측 8 시안 = A 등급**. 13 룰 전체 강제.

### 4-A. AppNav (헤더) 7 룰 — **사용자 측 강제 적용 ⭐**

`03-appnav-frozen-component.md` 코드 그대로 카피. 위반 검수 4 케이스 통과:

1. 9 메인 탭 = 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기
2. utility bar 우측 (계정/설정/로그아웃) 모바일에서도 표시
3. main bar 우측 = 검색/쪽지/알림/다크/햄버거 **5개** (Phase 19)
4. 다크모드 — PC 듀얼 / 모바일 단일 아이콘
5. 검색·쪽지·알림 = `app-nav__icon-btn` (border/bg 박스 X)
6. 모바일 닉네임 hidden
7. 더보기 = 9번째 탭 (drawer + 5그룹 패널)

**본 의뢰 강조**: UC2 Home 시안에서 AppNav 본체는 변경 ❌ / LIVE chip row 만 AppNav 바로 **아래** 위치.

### 4-B. 더보기 5그룹 IA 룰 (룰 8~9)

```
8. 가짜링크 4건 영구 제거: gameResult / gameReport / guestApps / referee ❌
9. refereeInfo + mypage 유지
```

**본 의뢰 강조**:
- UC1 "내 경기" / "내 매너" 섹션 = 마이페이지 안 카드 / 더보기 메뉴 신규 추가 ❌
- UB1 GameResult variant = 같은 라우트 status 분기 / 신규 라우트 ❌
- UC2 LIVE chip row = `/live/[id]` 진입 (기존 라우트) / 신규 라우트 ❌

### 4-C. 디자인 토큰 룰 4가지 (룰 10~13)

```
10. 색상: var(--*) 토큰만 / `--color-*` 폐기 토큰 ❌
11. 아이콘: Material Symbols Outlined / lucide-react ❌
12. 라운딩: 4px / pill 9999px X (정사각형 50% OK)
13. 모바일: 720px / iOS input 16px / 버튼 44px
```

**본 의뢰 강조**:
- UC2 LIVE 라벨 = `var(--err)` 깜박임 (1.5s loop)
- UB1 우승팀/MVP hero = `var(--accent)` 트로피
- UA1 종료 카드 우승팀 라인 = `var(--accent)` 1줄
- UC1 매너 카드 = `var(--ok)` (4.5+) / `var(--warn)` (3.0~4.4) / `var(--err)` (3.0-)
- 모든 시안 = `--color-*` 폐기 토큰 사용 ❌

### 4-D. 카피 / 모바일 룰

- placeholder 5단어 이내 / "예: " 시작 ❌
- 카피 = 시안 우선 (사용자 결정 §6-1)
- 모바일 720px / iOS 16px / 44px

---

## 5. 사용자 결정 §1~§8 보존 명시

| § | 결정 | 본 의뢰 영향 |
|---|------|------------|
| §1 AppNav | 9 메인 탭 / 더보기 / utility bar | **강제** — 03 frozen 카피 / 위반 검수 4 케이스 통과 |
| §2 더보기 5그룹 | 가짜링크 4건 ❌ | **본 의뢰 강조** — UC1 / UB1 / UC2 모두 신규 라우트 X (마이페이지 sub-link / status 분기 / 기존 라우트 진입) |
| §3 팀 페이지 레이팅 stat 제거 | 팀 페이지 한정 | UC1 "내 매너" = 마이페이지 본인 카드 (별 맥락) → 충돌 0 |
| §4 프로필 이모지 / 사이드바 | 프로필 한정 | UC1 마이페이지 보강 — 기존 이모지 / 사이드바 패턴 보존 |
| §5 **메인 페이지 Hero 카로셀** | 홈 한정 | **본 의뢰 핵심** — UC2 가 Hero 카로셀 변경 ❌ / 카로셀 **위** sticky LIVE 띠 추가만. 사용자 결재 확인 = "Hero 위 sticky 띠" |
| §6-1 글로벌 카피 시안 우선 | "서울 3x3 농구 커뮤니티" 보존 | 본 의뢰 카피 시안 우선 |
| §6-2 About 운영진 실명 ❌ | About 한정 | UB1 MVP 닉네임 = DB 데이터 출처 (별 맥락) → 충돌 0 |
| §7 모바일 (720px / iOS 16px / 44px) | 글로벌 | **본 의뢰 적용 의무** ✅ — 모든 8 시안 |
| §8 인증/권한 captainId 매칭 | 인증 일반 | 본 의뢰 직접 영향 0 |

→ **본 의뢰 강제 적용 = §1 / §2 / §5 / §6 / §7** (사용자 측 시안 8건 모두).

---

## 6. 산출물 형식

### 6-1. 산출물 위치

```
사용자 → Claude.ai Project (BDR 디자인 시스템 관리) 에 본 의뢰 + Phase 2A 의뢰 묶음 전달
  ↓
Claude.ai → 새 zip 생성 (BDR v2.X — 다음 버전 번호)
  ↓
사용자 → zip 풀이 → scripts/sync-bdr-current.ps1 실행
```

### 6-2. 산출물 파일 (8 시안)

**부분수정 시안 5건** (기존 `Dev/design/BDR-current/screens/` 갱신):
1. `Games.jsx` (UA1 / Hero 위 LIVE chip row + 종료 우승팀 라인)
2. `GameDetail.jsx` (UA2 / sidebar 신청 step indicator)
3. `CreateGame.jsx` (UA3 / 자동 승인 토글 + 게스트 옵션 강화)
4. `GuestApply.jsx` (UA4 / skill_level 자동 채우기)
5. `Live.jsx` (UA5 / 대회/일반 분기 라벨 + 다음 경기 영역)

**신규 시안 1건**:
6. `GameResult.jsx` 운영 박제 (UB1 / `/games/[id]` status='completed' variant)

**보강 시안 2건**:
7. `MyActivity.jsx` (UC1 / "내 경기" + "내 매너" 섹션 — Phase 1B 의 "내 대회" 위에 추가)
8. `Home.jsx` (UC2 / Hero 위 sticky LIVE chip row — Hero 카로셀 보존)

### 6-3. README.md 갱신

`Dev/design/BDR-current/README.md` 에 다음 추가:
```markdown
## v2.X 갱신 (2026-05-XX) — 경기 사용자 측 + 사용자↔관리자 연결 다리 (Phase 2B)

### 부분수정 (5건)
- Games — Hero 위 LIVE chip row + 종료 우승팀 라인
- GameDetail — sidebar 신청 step indicator
- CreateGame — 자동 승인 토글 + 게스트 옵션
- GuestApply — skill_level 자동 채우기
- Live — 대회/일반 분기 라벨

### 신규 (1건)
- GameResult — /games/[id] status='completed' variant (MVP hero + 4 카드)

### 보강 (2건)
- MyActivity — "내 경기" + "내 매너" 섹션 (Phase 1B "내 대회" 위에 추가)
- Home — Hero 카로셀 위 sticky LIVE chip row (사용자 결정 §5 Hero 보존)
```

### 6-4. 박제 후 자체 검수 (06 의무)

- §1 AppNav — 03 frozen 카피 / 위반 검수 4 케이스 통과
- §2 더보기 — 가짜링크 4건 추가 ❌ / 신규 라우트 0
- §3 디자인 토큰 — var(--*) 100% / `--color-*` 0 / lucide-react 0
- §5 모바일 — 720px / iOS 16px / 44px
- §6 연결성 — JSDoc 매트릭스 첨부

---

## 7. 첫 응답 형식 (Claude.ai 응답 의무)

```
✅ BDR 디자인 의뢰 확인 — 경기 사용자 측 + 사용자↔관리자 연결 다리 (Phase 2B)

이해:
- 부분수정 5 (UA1 Games LIVE 띠 / UA2 step indicator / UA3 자동 승인 / UA4 skill 자동 / UA5 라이브 분기)
- 신규 1 (UB1 GameResult variant — BG4)
- 보강 2 (UC1 마이페이지 통합 + 내 매너 / UC2 홈 Hero 위 LIVE 띠)
- 7 갭 매핑 = BG1 신청 알림 / BG2 매너 / BG3 경력 자동 / BG4 MVP / BG5 자동 승인 / BG6 통합 hub / BG7 라이브

사용자 결정 §1~§8 보존:
- §5 Hero 카로셀 — UC2 가 카로셀 위 sticky 띠로 명시 (사용자 결재 2026-05-25)
- §1 / §2 / §3 / §6 / §7 모두 적용
- §3 (팀 페이지 레이팅) vs UC1 "내 매너" = 별 맥락 (충돌 0)
- BG2 노출 룰 = 평균 + flag 종류만 / 개별 건수 ❌

AppNav frozen — 03 카피 (위반 검수 4 케이스 통과)

자체 검수 (06): §1 / §2 / §3 / §5 / §6

산출물: Dev/design/BDR-current/screens/ (부분수정 5 + 신규 1 + 보강 2 = 8 시안)

질문 / 가정 (PM 결정 필요 시):
1. UC2 LIVE chip row 가 라이브 0건일 때 hidden — 빈 상태 = "곧 시작하는 경기" 같은 fallback 필요한가 (가정: 그대로 hidden / 빈 상태 X)
2. UA1 종료 카드 우승팀 라인이 일반 경기 (픽업/게스트) 에는 MVP 만 / 우승팀 개념 없음 — "🏆 MVP 박수빈" 으로 단순화 (가정 — 변경 시 알림)

작업 시작.
```

---

## 8. 위반 시 즉시 중단

00-master-guide §"위반 시 즉시 중단" + 본 의뢰 결재 룰:

- **사용자 결정 §5 위반** — UC2 가 Hero 카로셀 자체를 변경하거나 카로셀 안에 LIVE 슬라이드 추가 ❌. **카로셀 위 별 sticky 영역** 만.
- **BG2 노출 룰 위반** — UC1 "내 매너" 에 개별 평가 건수 (예: "no_show 2회") 표기 ❌. 평균 + flag 종류 (키워드 / 뉘앙스) 만.
- **신규 라우트 추가** — UB1 / UC1 / UC2 / UA5 모두 기존 라우트 status 분기 또는 마이페이지 sub-card. 신규 라우트 X.
- **더보기 메뉴 신규 추가** — UC1 / UB1 모두 마이페이지 / status 분기로 진입.
- **DB 미지원 기능을 시안에**:
  - `games.final_mvp_user_id` + `recomputeFinalMvp()` (UB1) ✅
  - `game_applications` (UA2/UC1) ✅
  - `game_player_ratings` 평균 + flags (UC1) ✅
  - 라이브 데이터 모델 (UA5 / UC2) ✅
- **API/데이터 패칭 변경 제안** — 본 의뢰는 UI만 (운영 코드 0)
- **AppNav frozen 변경 제안** — 03 카피만, 재구성 ❌

### 위반 자동 검수 4 케이스 (00 §회귀 방지)

- ❌ main bar 우측에 "더보기 ▼" / "RDM" 아바타
- ❌ 모바일 듀얼 다크 라벨
- ❌ 검색/쪽지/알림 박스 (.btn / .btn--sm)
- ❌ main bar 우측 아이콘 순서 변경

→ 8 시안 모두 위 4 케이스 통과 의무 (UC2 Home 시안에서 특히 검수).

---

## 부록 A — BG1~BG7 → 시안 매핑

| 갭 | 영향도 | 사용자 측 시안 | 관리자 측 시안 (Phase 2A) |
|----|-------|--------------|------------------------|
| BG1 신청 알림 | ★★★ | UA2 step indicator + UC1 마이페이지 | UD1 알림 액션 |
| BG2 매너 | ★★★ | UC1 "내 매너" (평균 + 종류만) | UD2 매너 통계 탭 |
| BG3 경력 자동 | ★★★ | UA3 게스트 옵션 + UA4 자동 채우기 | (해당 없음) |
| BG4 MVP | ★★★★★ | UB1 GameResult variant + UA1 종료 카드 | (해당 없음) |
| BG5 자동 승인 | ★★ | UA3 토글 | UD1 액션 출처 컬럼 |
| BG6 통합 hub | ★★★★ | UC1 마이페이지 "내 경기" | (해당 없음) |
| BG7 라이브 | ★★★★ | UC2 홈 LIVE 띠 + UA1 Games LIVE 띠 + UA5 진입점 강화 | (해당 없음) |
| BG8 자동 매칭 | (제외) | — | — |

---

## 부록 B — Phase 2A 와의 의존 (같은 zip 묶음)

| 데이터 출처 | Phase 2A 시안 | Phase 2B 시안 | 비고 |
|----------|------------|------------|-----|
| `game_applications.status` | UD1 (status 변경 + 알림) | UA2 step indicator + UC1 마이페이지 | BG1 — 양측 동시 박제 권장 |
| `game_player_ratings` 평균 + flags | UD2 매너 통계 탭 | UC1 "내 매너" 카드 | BG2 — 노출 룰 일관 (평균 + 종류만) |

→ **본 의뢰는 Phase 2A 와 같은 zip 묶음 권장**. 두 의뢰서 Claude.ai 에 같이 전달.

---

## 부록 C — Phase 2 시안 합산 (총 10 시안)

본 의뢰 + Phase 2A 합산:

### Phase 2A (관리자 — `game-admin-redesign-prompt-2026-05-25.md`)
- 보강 2: AdminGames / AdminGameReports
- 합계 **2 시안**

### Phase 2B (본 의뢰 — 사용자 + 연결 다리)
- 부분수정 5: Games / GameDetail / CreateGame / GuestApply / Live
- 신규 1: GameResult variant
- 보강 2: MyActivity (Phase 1B "내 대회" 위에 추가) / Home (Hero 위 LIVE 띠)
- 합계 **8 시안**

→ **Phase 2 총 = 10 시안** (Phase 1 = 19 시안 / Phase 2 = 10 시안 / Phase 2 가 사용자 측이 이미 v2.16 박제로 완성도 높음).

---

**의뢰 끝.** 사용자가 본 파일 + Phase 2A 의뢰 (`game-admin-redesign-prompt-2026-05-25.md`) 를 같은 zip 묶음으로 Claude.ai Project (BDR 디자인 시스템 관리) 에 붙여 넣어 의뢰 시작 가능.
