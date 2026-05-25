# 경기 영역 UI/UX 점검 리포트 — Phase 2 재계획 (2026-05-25)

> **의뢰**: 수빈 — Phase 1 (대회) 완료 후 Phase 2 (경기 + 경기관리) 동일 절차 시작
> **선행 자료**: `Dev/design/prompts/tournament-user-admin-connectivity-plan-2026-05-25.md` (Phase 1 연결성 계획서)
> **본 리포트 위치**: Phase 2 의 **상위 계획서**. 결재 후 Phase 2A (관리자 의뢰) + 2B (사용자 + 다리) 의뢰 문서 작성 트리거.
> **명명 통일** (WORKFLOW.md §2): Phase 2A / 2B / 2C / BG1~BGN (Bridge Game 갭) / GA1~GD3 (시안 ID)

---

## 0. 30초 요약

1. **경기 영역의 구조적 특수성 3가지** — 대회와 다른 점이 의외로 큼:
   - **공식 매치 vs 일반 경기 이원화** — 대회 매치는 Flutter 기록앱 (`api/v1/matches`) / 일반 경기는 웹 전용 (`api/web/games`). 두 출구가 사용자 화면에서 만나지 않음.
   - **호스트 권한 = 사용자 권한 안에 있음** — 대회는 organizer/TAM/super_admin 3 권한이 별 셸이지만 경기는 호스트 자신이 사용자. UI 분리는 OK 인데 흐름이 혼재.
   - **MVP / 매너 평가가 사용자 ↔ 사용자 흐름** — 대회는 admin 이 결과 박제 / 경기는 참가자 본인이 평가 제출. 검토 큐 (admin) 가 별로 떨어져 있음.
2. **연결 다리 갭 8건 (BG1~BG8) 식별** — 가장 critical = BG4 MVP 시상 UI 미구현 (★★★★★) / BG6 사용자 경기 통합 hub 부재 (★★★★) / BG7 라이브 진입점 분산 (★★★★).
3. **사용자 측 박제는 Phase 2 v2.16 (5/20) 으로 상당히 완성도 높음** — BDR-current 에 GameCard / GameDetailHero / ParticipantsSlotBoard (Concept B) / ApplyRibbon / MobileStickyBar 등 신규 디자인 언어 적용 완료. 단 운영 src/ 의 미박제 페이지 있음.
4. **권장 = Phase 2A (관리자 신규/보강) + Phase 2B (사용자 측 보강 + 연결 다리) 짝으로 진행**. Phase 1 보다 시안 건수 적음 (~12 시안 예상 / Phase 1 = 19). 운영 박제 (Phase 2C) PR ~10 그룹 예상.

---

## 1. 작업 범위 (WORKFLOW.md §부록 B 표준 절차)

| 구분 | 결정 | 영향 |
|------|------|------|
| 단위 | Phase 2 = 경기 + 경기관리 통합 (Phase 1 와 동일 패턴) | 사용자 측 + 관리자 측 + 양측 다리 한 묶음 |
| 산출물 범위 | **본 리포트만** (점검 / 갭 / 판단). 의뢰 문서는 결재 후 별도 | Phase 1 와 동일 |
| 전면교체 적극도 | **적극 제안** (Phase 1 와 동일) | 흐름 단절 화면은 전면교체 권장 |

---

## 2. 현재 구현 인벤토리

### 2-A. 사용자 경기 영역 — `src/app/(web)/games/`

| 라우트 | 핵심 | 박제 등급 | 시안 |
|--------|------|---------|------|
| `/games` | 목록 + 7칩 필터 + 종별 탭 | B → v2.16 박제로 A 승격 진행 중 | Games.jsx |
| `/games/[id]` | 상세 (Hero + SummaryCard + AboutCard + ParticipantList + ApplyPanel + HostPanel) | A (`_v2` 적용) | GameDetail.jsx |
| `/games/[id]/edit` | 호스트 수정 | A | GameEdit.jsx |
| `/games/[id]/guest-apply` | 게스트 신청 폼 (경력 + 약관 스냅샷) | A | (GuestApply 또는 GameDetail 통합) |
| `/games/[id]/report` | 평가/신고 제출 (Phase 10-1 B-5/B-6) | A | GameReport.jsx |
| `/games/new` | 생성 위저드 (v2 3카드 + 고급 아코디언) | A | CreateGame.jsx |
| `/games/my-games` | 신청 내역 4 탭 + 호스트 경기 섹션 | B (시안 매핑 완료 / 박제 진행) | MyGames.jsx |
| `/scrim` | 연습경기 매칭 | C (DB 미연결) | Scrim.jsx |
| `/live/[id]` | 라이브 중계 (대회/일반?) | A (`_v2` 적용) | Live.jsx (또는 LiveResult) |
| `/guest-apps` | 게스트 모집 list (?) | A 시안 / 운영 미박제 가능 | GuestApps.jsx |

### 2-B. 관리자 경기 영역 — `src/app/(admin)/admin/`

| 라우트 | 핵심 | 박제 등급 | 시안 |
|--------|------|---------|------|
| `/admin/games` | 전체 경기 list + status 수정 | E (백오피스 자체) | AdminGames.jsx |
| `/admin/game-reports` | 신고 검토 큐 (flags 배열 있는 ratings 만) | E | AdminGameReports.jsx |

**관찰**: 경기는 대회처럼 별도 `(admin)/tournament-admin` 셸이 없음. 관리자 셸 = 백오피스 (`/admin/`) 1 곳. 호스트 권한 = 일반 사용자 권한 안에서 `/games/[id]` 의 HostPanel 로 처리.

### 2-C. Flutter 기록앱 vs 웹 API 경계

| 영역 | Flutter (api/v1) | 웹 (api/web) |
|------|-----------------|------------|
| 대회 매치 기록 (공식) | ✅ `/api/v1/matches/[id]/events` (분기록 / 통계) | (조회만) |
| 일반 경기 (픽업/게스트/연습) | ❌ 없음 | ✅ `/api/web/games/*` |
| MVP 집계 | ❌ | ✅ `recomputeFinalMvp()` (game_reports 그룹바이) |
| 평가/신고 | ❌ | ✅ `/api/web/games/[id]/report` |
| 게스트 신청 | ❌ | ✅ `/api/web/games/[id]/apply` (is_guest=true) |

→ **공식 기록 (Flutter) ↔ 일반 경기 (웹)** 의 두 경로가 사용자 화면에서 통합되지 않음. 사용자 입장에서는 "내 경기" 일관성 없음 = BG6 핵심.

### 2-D. Prisma 데이터 모델 (5건)

```
games              — host_id=organizer_id / status(0~4) / game_type(0~2) / final_mvp_user_id
game_applications  — user × game / status(0신청/1승인/2취소) / is_guest / experience_years / accepted_terms / payment_status
game_reports       — game × reporter / overall_rating(1-5) / mvp_user_id / status(submitted/draft/reviewed/dismissed)
game_player_ratings — report × rated_user / rating(1-5) / flags[]: no_show/late/poor_manner/foul/verbal/cheat
game_templates     — user × 개인 템플릿 / use_count
```

**관찰**:
- `games.final_mvp_user_id` 필드 있음 → MVP 시상 UI 시안만 (GameResult.jsx) / 운영 페이지 미구현 = BG4
- `game_applications.payment_status` 있음 → 결제 흐름 추적 가능 (대회의 B3 와 유사)
- `game_player_ratings.flags[]` → 신고 plain text 가 아닌 6 enum 배열

### 2-E. BDR-current/screens/ 시안 매핑 (9 시안)

```
Games.jsx              — /games            (v2.16 신규 디자인 언어)
GameDetail.jsx         — /games/[id]       (V2 Hero + Concept B)
CreateGame.jsx         — /games/new        (단일 페이지 + 라이브 프리뷰)
GameEdit.jsx           — /games/[id]/edit
MyGames.jsx            — /games/my-games   (4 탭)
GameReport.jsx         — /games/[id]/report
GameResult.jsx         — /games/[id]?status=3 (MVP 시상 — 시안만 / 운영 0)
AdminGames.jsx         — /admin/games       (E)
AdminGameReports.jsx   — /admin/game-reports (E)
```

**관찰**:
- 04-page-inventory §3.5 (v2.16 경기 탭 신규 디자인 언어 2026-05-20) = 종별 컬러 / Date Tile / Area Chip / Pretendard 900 / Concept B (5×2 슬롯 보드) 등 **이미 도입됨**.
- **시안에 GameResult.jsx 있는데 운영 페이지 없음** = BG4 갭.

---

## 3. Phase 1 (대회) 와의 구조적 차이

> 같은 절차로 가지만 갭의 성격이 다름. 다음 표가 Phase 2 의뢰 작성 시 핵심 가이드.

| 항목 | Phase 1 (대회) | Phase 2 (경기) |
|------|--------------|---------------|
| **관리자 권한 계층** | organizer / TAM / super_admin 3 권한 + 별도 `tournament-admin` 셸 | **호스트 1 권한** (사용자 안) + super_admin (백오피스만) |
| **공식성** | 모든 매치 = 공식 (Tournament 안) | **이원화** — 대회 매치 공식 / 일반 경기 비공식 |
| **참가 흐름** | 팀 단위 (TournamentTeam) + 승인/거절 + 결제 | 개인 단위 (game_applications) + 일반/게스트 분기 + 자동/수동 승인 |
| **결과/시상** | 우승팀 + MVP (champion_team / mvp_player) 명시 박제 | MVP (final_mvp_user_id) + 매너 평가 ratings 합산 |
| **신고/평가** | (없음 — 대회는 admin 운영) | **6 enum flags** (no_show / late / poor_manner / foul / verbal / cheat) — 사용자 ↔ 사용자 |
| **라이브** | bracket 안에서 자연스러움 | `/live/[id]` 별 라우트 — 진입점 모호 |
| **Flutter 기록앱** | 대회 매치만 (`/api/v1/matches`) — 공식 기록 | 일반 경기 = 웹 전용 (`api/v1` 없음) |
| **마이페이지 진입** | 신청한 대회 (TournamentTeam) | `/games/my-games` (별 페이지) — 마이페이지와 별도 |

→ **본 Phase 2 의 가장 큰 디자인 결정** = "마이페이지 안에 대회 + 경기 통합 hub 를 만들 것인가, 별 페이지로 유지할 것인가" (BG6).

---

## 4. 사용자↔관리자 연결 다리 갭 8건 (BG1~BG8)

### BG4. MVP 시상 UI 미구현 (★★★★★)

- **현 상태**: 시안 `GameResult.jsx` 존재 + DB `games.final_mvp_user_id` + `recomputeFinalMvp()` 비즈 로직 모두 박제. **단 운영 페이지 0**. `/games/[id]?status=3` 분기 시 자동 렌더 되지 않음.
- **시나리오**: "어제 픽업게임 끝났는데 누가 MVP였지? 평가는 어디서 보지?"
- **비유**: 시상식은 했는데 트로피가 어디 있는지 모름.
- **양측 시안**:
  - 사용자: **GameResult 운영 박제** — `/games/[id]` 의 status='completed' variant (Phase 1 의 TournamentCompleted 와 동일 패턴)
  - 관리자: AdminGameReports 에 MVP 집계 결과 확인 view 보강

### BG6. 사용자 경기 통합 hub 부재 (★★★★)

- **현 상태**: 마이페이지 안 "내 대회" 섹션 = Phase 1B 에서 신규 (UC1). 단 **경기 (game) 는 별도 `/games/my-games` 페이지** = 마이페이지에서 한 곳에서 못 봄.
- **시나리오**: "이번 주말 내가 신청한 거 = 대회 1건 + 픽업 2건 + 게스트 1건. 캘린더 어디? 마이페이지 들어가서 따로따로 찾아야 함."
- **비유**: 일정 앱이 회사 일정 / 개인 일정 / 가족 일정 각자 별 앱.
- **양측 시안**:
  - 사용자: 마이페이지 "내 활동" hub 에 **대회 + 경기 통합 카드 list** — Phase 1B 의 UC1 (내 대회) + Phase 2B 의 UC1 (내 경기) 가 같은 hub
  - 캘린더 (/calendar) 와의 정합 — 신청한 대회/경기 자동 등록 정책 결정 필요

### BG7. 라이브 중계 진입점 분산 (★★★★)

- **현 상태**: `/live/[id]` 라우트 존재 / 더보기 메뉴 "경기·대회" 그룹 안에 "라이브 중계" 항목. 단 진입 트리거 = "어디서 라이브 진행 중인지" 발견성 0. 대회 매치인지 일반 경기인지 라이브 룰 불명.
- **시나리오**: "주말에 우리 동네 경기 라이브 중계 있어? 모르겠음."
- **비유**: 케이블 TV 채널은 있는데 편성표가 없음.
- **양측 시안**:
  - 사용자: 홈 / `/games` / `/tournaments` 에 **현재 라이브 중인 경기 띠** (Hero band 또는 sticky chip)
  - 관리자: 호스트가 라이브 시작 토글 / 자동 감지 룰 (대회 매치 시작 시 자동) 명시

### BG1. 신청 승인/거절 상태 동기 (★★★)

- **현 상태**: 사용자 신청 → host 승인/거절 → game_applications.status 업데이트. UI 갱신 약함 — 사용자가 새로고침해야 확인.
- **양측 시안**:
  - 사용자: `/games/[id]` ApplyPanel 에 **본인 신청 상태 step indicator** (Phase 1B 의 MyRegistrationStatus 와 동일 패턴 — 경기 버전)
  - 호스트: HostPanel 에 신청자 승인 시 "사용자에게 알림 보내기" 체크박스 (대회 의뢰의 UD1 패턴)

### BG2. 매너 평가 검토 큐 비대칭 (★★★)

- **현 상태**: game_player_ratings 의 flags 배열 있는 ratings 만 admin 큐. 깨끗한 평가는 admin 안 보임 = 매너 점수 통계 누락 / 사용자 본인이 본인 평점 어디서 보는지 불명.
- **양측 시안**:
  - 사용자: 마이페이지 "내 매너" 카드 — 본인 평균 평점 + 받은 flags 통계 (어디까지 노출? 사용자 결정 필요)
  - 관리자: AdminGameReports 에 flags 외 깨끗한 평가도 통계로 볼 수 있는 view

### BG3. 게스트 experience vs user.skill_level 이원화 (★★★)

- **현 상태**: game_applications.experience_years (경기별 입력) + user.skill_level (온보딩) 분리. 사용자가 매번 입력 = 마찰.
- **양측 시안**:
  - 사용자: 게스트 신청 시 **user.skill_level / experience_years 자동 채우기** (수정 가능)
  - 데이터: 두 필드 통합 검토 (별 Phase / 본 의뢰 직접 영향 0)

### BG5. 호스트 액션 범위 (★★)

- **현 상태**: HostPanel 의 호스트 액션 = (1) 신청자 승인/거절 / (2) 경기 수정 / (3) 경기 취소. **자동 승인 vs 수동 승인** 룰 UI 가 부재 (현재는 모두 수동?). super_admin 의 강제 status 변경과의 경계 표시 부재.
- **양측 시안**:
  - 사용자/호스트: 경기 생성 시 "자동 승인" 토글 + 수동 모드 명시
  - 관리자: AdminGames 에 호스트 액션 vs super_admin 액션 시각 분리 (예: 액션 출처 컬럼)

### BG8. 게스트 모집 (guest-apps) vs 자동 매칭 (★★)

- **현 상태**: `/guest-apps` 라우트 = 게스트 모집 list. 단 사용자에게 "본인 조건에 맞는 게스트 자리 자동 추천" 부재 (Scrim 영역의 자동 매칭과도 별개).
- **양측 시안**:
  - 사용자: 마이페이지 또는 `/games` 에 **본인 조건 매칭 추천 카드** (skill_level / 지역 / 시간대 기반)
  - 관리자: 추천 룰 / 알고리즘 admin 영역은 Phase 2 외 (별 Phase)

---

## 5. 화면별 판단 표

> Phase 1 와 동일 — **흐름 단절 (BG1~BG8) 에 관여하는 화면 = 전면교체 또는 신규**. 나머지는 보강.

### 5-A. 사용자 측 (10 라우트)

| 라우트 | 박제 등급 | 판단 | 근거 |
|--------|---------|------|------|
| `/games` | B → A 진행 중 | **부분수정** | v2.16 디자인 언어 적용 완료. BG7 라이브 띠 + BG8 추천 카드 추가만 |
| `/games/[id]` | A | **부분수정** | Concept B (참가자 슬롯) 보존. BG1 step indicator + BG4 종료 variant 추가 |
| `/games/[id]?status=3` (variant) | — | **신규 시안 필요** | BG4 핵심 — GameResult.jsx 시안 운영 박제 |
| `/games/[id]/edit` | A | **유지** | 골격 OK / BG5 자동 승인 토글 추가만 |
| `/games/[id]/guest-apply` | A | **부분수정** | BG3 user.skill_level 자동 채우기 |
| `/games/[id]/report` | A | **유지** | 골격 OK |
| `/games/new` | A | **부분수정** | BG5 자동 승인 토글 + BG8 게스트 모집 옵션 강화 |
| `/games/my-games` | B → A 진행 중 | **부분수정 → 마이페이지 통합 검토** | BG6 — 마이페이지 hub 통합 시 본 페이지 위치 재검토 |
| `/scrim` | C (DB 미연결) | **선검증 → 판단** | 운영 동작 여부 / Phase 2 포함 여부 결정 필요 |
| `/live/[id]` | A | **부분수정** | BG7 진입점 강화 — 일반 경기 vs 대회 매치 라이브 룰 명시 |
| `/guest-apps` | A 시안 / 운영 미박제? | **선검증 → 판단** | BG8 추천 카드와 어떻게 연결할지 |

### 5-B. 관리자 측 (2 라우트 + 통합 영역)

| 라우트 | 박제 등급 | 판단 | 근거 |
|--------|---------|------|------|
| `/admin/games` | E | **부분수정 (보강)** | BG1 status 변경 알림 + BG5 액션 출처 컬럼 |
| `/admin/game-reports` | E | **부분수정 (보강)** | BG2 깨끗한 평가 통계 view |
| 마이페이지 "내 매너" 카드 | — | **신규 시안 필요** | BG2 사용자 측 — 본인 평점/flags 노출 |
| 마이페이지 "내 활동" hub | — | **신규 시안 필요 또는 Phase 1B UC1 확장** | BG6 — 대회 + 경기 통합 |

### 5-C. 라이브 / 추천 / scrim 영역

| 영역 | 판단 | 근거 |
|------|------|------|
| 홈 / `/games` / `/tournaments` 라이브 띠 | **신규 시안** | BG7 |
| 추천 매칭 카드 | **신규 시안** | BG8 (Phase 2 안 또는 후속) |
| `/scrim` | 선검증 → 결정 | DB 미연결 시 Phase 2 외로 분리 |

---

## 6. 권장 다음 단계 (실행 순서)

```
[Step 0] 본 리포트 사용자 승인 ◀ ← 현재 위치
   ↓
[Step 1] 선검증 (작업 시간 30분 이내)
  - /scrim 운영 동작 여부 (DB 미연결 → Phase 2 포함 여부 결정)
  - /guest-apps 운영 박제 상태 (시안 매핑 / _v2 존재)
  - /live/[id] = 대회 매치 vs 일반 경기 라이브 룰 확인
  - GameResult.jsx 시안 ↔ 운영 status=3 분기 로직 확인
  - 마이페이지 hub 의 현재 구조 (Phase 13 hub) 와 BG6 통합 가능성
   ↓
[Step 2] 의뢰 문서 작성 (WORKFLOW.md §부록 B Step 3)
  - Phase 2A (관리자 보강 + 신규) = AdminGames / AdminGameReports / 통합 매너 view ~3~4 시안
  - Phase 2B (사용자 측 + 연결 다리) = GameResult 신규 + 4~5 화면 보강 + 통합 hub
  - 위치: Dev/design/prompts/game-{admin,user}-redesign-prompt-2026-05-XX.md
   ↓
[Step 3] 사용자 결재 → Claude.ai 전달 (WORKFLOW.md ⑦)
   ↓
[Step 4] zip 받으면 sync-bdr-current.ps1 실행 (⑩)
   ↓
[Step 5] Phase 2C 운영 박제 (CLI) — PR 그룹 ~10건 예상
   ↓
[Step 6] Phase 3 시작 결정 (영역 후보: 팀 / 코트 / 단체 / 커뮤니티)
```

→ **이번 사용자 승인 항목**:
1. 8 갭 (BG1~BG8) 중 어디까지 Phase 2 에 포함 / 어디서부터 별 Phase
2. BG6 (마이페이지 hub 통합) 방향 — Phase 1B UC1 확장 vs Phase 2 신규 hub
3. /scrim, /guest-apps 선검증 결과에 따른 시안 묶음 조정
4. Phase 1A (관리자 10 시안) 이 아직 Claude.ai 전달 안 됨 — Phase 2 의뢰와 어떤 순서로 묶을지

---

## 7. 13 룰 / 사용자 결정 §1~§8 충돌 점검

| 권장 사항 | 충돌 가능 룰 | 점검 결과 |
|---------|-------------|----------|
| GameResult 신규 시안 (`/games/[id]?status=3` variant) | §1 AppNav / 신규 라우트 X | 같은 라우트 status 분기 → 충돌 0 ✅ |
| 마이페이지 hub 통합 (BG6) | §1 / §2 (가짜링크 X) | 마이페이지 sub-card 만 → 충돌 0 ✅ |
| 홈 / 목록 라이브 띠 (BG7) | §1 (AppNav) / §5 (Hero 카로셀 — 사용자 결정 §5) | Hero 위에 추가 띠 = §5 Hero 카로셀 변경 → **PM 결정 필요** |
| BG2 마이페이지 "내 매너" 노출 | §3 팀 페이지 레이팅 stat 제거 | §3 = 팀 페이지에서 레이팅 제거 (사용자 결정). 마이페이지 본인 매너 = 다른 맥락 → 충돌 0 ✅ 단 노출 수위 (받은 flags 직접 표시 vs 평균 평점만) 사용자 결정 필요 |
| 추천 매칭 카드 (BG8) | §1 / §6 (글로벌 카피) | 신규 카드 / 카피는 시안 우선 → 충돌 0 ✅ |
| 호스트 vs admin 액션 출처 (BG5) | (E 등급 자체 영역) | AppNav 적용 외 → 충돌 0 ✅ |

→ **PM 결정 필요 2건**:
1. BG7 라이브 띠가 Hero 카로셀 (§5) 위치인지 별 영역인지
2. BG2 "내 매너" 노출 수위 (받은 flags 직접 vs 평균만)

---

## 8. 다음 산출물 후보

본 리포트 승인 후 작성 예정 (사용자 결재 시 별도 작업):

1. **`Dev/design/prompts/game-admin-redesign-prompt-2026-05-XX.md`** (Phase 2A — 관리자 보강 + 통합)
2. **`Dev/design/prompts/game-user-redesign-prompt-2026-05-XX.md`** (Phase 2B — 사용자 + 다리)
3. **Phase 3 점검 리포트** (영역 결정 후)

---

## 부록 A — Phase 2 시안 합산 (예상 ~12 시안)

### Phase 2A (관리자 보강 + 신규)
- 보강 2: AdminGames / AdminGameReports
- 신규 1~2: 통합 매너 view / 추천 매칭 admin (Phase 2 외 가능)
- 합계 **2~4 시안**

### Phase 2B (사용자 + 연결 다리)
- 부분수정 5: Games / GameDetail / CreateGame / GameEdit / GuestApply / Live
- 신규 1: GameResult 운영 박제 (시안 → 운영 분기)
- 마이페이지 통합 1~2: "내 활동" hub (대회+경기 통합) / "내 매너" 카드 (BG2 결과 따라)
- 라이브 띠 1: 홈/목록 sticky band (BG7 결과 따라)
- 합계 **8~10 시안**

→ **Phase 2 총 ~10~14 시안** (Phase 1 = 19 시안보다 작음 — 경기는 사용자 측이 이미 v2.16 박제로 상당히 완성).

---

## 부록 B — 사용자↔관리자 연결성 시각화 (경기 영역)

```
사용자 여정                       연결점 (BG번호)              호스트/관리자 여정
─────────────                    ─────────                  ────────────────
1. 경기 발견                                                  1. 경기 생성
   /games                                                       /games/new
   추천 카드 (BG8) ◀──────────────────────────────────────────  (BG5 자동 승인 토글)
   라이브 띠 (BG7)                                                │
            │                                                     ▼
            ▼                                                  2. 호스트 = 운영
2. 신청                                                          /games/[id] HostPanel
   /games/[id]/apply ──── BG1 알림 ────────────────────────────  - 신청자 승인/거절
   /games/[id]/guest-apply (BG3 자동 채움)                       (BG1 알림 액션)
            │                                                     │
            ▼                                                     ▼
3. 신청 결과                                                  3. 경기 진행
   step indicator (BG1)                                          (Flutter 기록앱 또는 수동)
            │                                                     │
            ▼                                                     ▼
4. 경기 참가                                                  4. 종료 처리
            │                                                  /games/[id]/report (호스트도 가능)
            ▼                                                  /admin/game-reports (BG2)
5. 평가/신고                                                       │
   /games/[id]/report ──── BG2 검토 큐 ──────────────────────── (관리자)
            │                                                     │
            ▼                                                     ▼
6. 결과/MVP 발표 ◀──── BG4 GameResult 운영 박제 ───────────── 6. MVP 자동 집계
   /games/[id]?status=3                                          (recomputeFinalMvp)
            │
            ▼
7. 마이페이지 hub ◀──── BG6 통합 (대회 + 경기) ──────────── (사용자 본인만)
   /profile/activity
   "내 활동" + "내 매너"
```

---

## 부록 C — 본 리포트 작성 근거

- `Dev/design/claude-project-knowledge/00~06` + `04-page-inventory §3.5 v2.16 경기 탭 신규 디자인 언어`
- Explore agent 가 본 `src/app/(web)/games/`, `src/app/(admin)/admin/games/`, `src/app/(admin)/admin/game-reports/`, `src/app/api/web/games/`, `prisma/schema.prisma`
- `Dev/design/BDR-current/screens/` 안 경기 시안 9건 (Games / GameDetail / CreateGame / GameEdit / MyGames / GameReport / GameResult / AdminGames / AdminGameReports)
- Phase 1 연결성 계획서 (`tournament-user-admin-connectivity-plan-2026-05-25.md`) — 동일 형식 / 같은 결정 패턴 답습
- WORKFLOW.md §2 명명 통일 (Phase 2A/2B/2C, BG1~BG8, GA1~GD3 시안 ID 예약)
- `uploads/BDR v2 (2).zip` 의 v2.18 README — Phase 1B 박제 완료 확인
