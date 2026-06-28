# Phase 4+ 후보 영역 — Claude.ai 다음 시안 의뢰 검토

> **작성**: Cowork (2026-05-28 · Phase 3 박제 완료 후)
> **목적**: 수빈이 다음 Phase 영역 결재할 수 있도록 후보 영역 종합 표 + 추천

---

## 1. 완료된 Phase (참조)

| Phase | 영역 | Claude.ai | sync | 운영 박제 |
|-------|------|-----------|------|---------|
| 1A | 대회 관리자 (10) | ✅ v2.19 | ✅ | ⏳ batch (PR-1C-1 ✅) |
| 1B | 대회 사용자 (8) | ✅ v2.18 | ✅ | ⏳ batch |
| 2 | 경기 (10) | ✅ v2.20 | ⏸ 의뢰 A 대기 | ⏸ |
| 3 | 팀 (7) | ✅ v2.21 | ⏸ 의뢰 A 대기 | ⏸ |

→ 남은 영역 = AppNav 9 탭 중 **단체 (4번째) / 코트·장소 (6번째) / 랭킹 (7번째) / 커뮤니티 (8번째)** + 더보기 안 메뉴 + 그 외 운영 영역.

---

## 2. 후보 영역 종합 표 (★★★★ ~ ★)

### 🟢 ★★★★ 강 권장 (높은 영향 + 자연 연결)

#### A. 단체 (Organizations) — Phase 4 최우선 후보

- **AppNav**: 4번째 탭
- **라우트**: `/organizations` + `/organizations/apply` + `/organizations/[slug]` + `/organizations/[slug]/series/[seriesSlug]`
- **운영 LOC**: ~700 (4 page.tsx + _components/)
- **시안 박제 흔적**: 2/12 (부분 — org-card-v2.tsx / orgs-list-v2.tsx)
- **양측 다리**: Phase 1A PA3 (협회 마법사) 자연 후속 + super-admin `/admin/organizations` (243)
- **권장 이유**:
  - Phase 1A 와 직접 연결 (PA3 가 협회 단체 마법사)
  - 시리즈/구단/협회 위계 = MyBDR 핵심 데이터 모델
  - 운영 LOC 적정 (~700) — 1 Phase 안 의뢰서 적당
- **갭 예상**: BO1 시리즈 ↔ 대회 다리 / BO2 단체 신청 흐름 / BO3 super-admin 검수 등

#### B. 코트·장소 (Courts/Venues) — Phase 4 또는 5

- **AppNav**: 6번째 탭
- **라우트**: `/courts` (list) + `/courts/[id]` (상세) + `/booking` (예약) + `/[id]/manage` (파트너 관리) + `/[id]/checkin` (체크인) + `/courts/submit` (신청) + `/venues/[slug]` (대형 venue) + `/partner-admin/campaigns` (파트너 캠페인)
- **운영 LOC**: ~1500+ (8+ page.tsx + _components/)
- **시안 박제 흔적**: 4/29 (부분)
- **양측 다리**: Phase 1 (대회 장소) + Phase 2 (경기 장소) 의존 / 파트너 측 (코트 사장님)
- **권장 이유**:
  - cross-domain reference (모든 Phase 영향)
  - 결제 / 예약 / 체크인 = 운영 핵심
  - venue ↔ court 위계 (큰 venue 안 court 여러 개)
- **갭 예상**: BV1 예약 흐름 / BV2 파트너 관리 / BV3 venue 위계 등

#### C. 프로필 / 마이페이지 본체 (UC1 외) — Phase 4 또는 5

- **AppNav**: 더보기 안 (또는 사용자 아바타 클릭)
- **라우트**: `/profile` (831) + `/profile/edit` (1689) + `/profile/basketball` (1068) + 그 외 sub 16 (achievements / billing / bookings / growth / notification-settings / preferences / settings / subscription / weekly-report 등)
- **운영 LOC**: ~3700+ (16 page.tsx + 64 tsx)
- **시안 박제 흔적**: 11/64 (부분)
- **양측 다리**: 모든 Phase 영향 (사용자 본인 정보 hub)
- **권장 이유**:
  - 사용자 매일 보는 영역
  - 16+ sub-page = 큰 작업
- **권장도 ↓**: 복잡도 ★★★★ — 분할 의뢰 필요할 수 있음 (의뢰서 2~3 회 분리)

### 🟡 ★★★ 중 권장 (적정 영향)

#### D. 랭킹 (Rankings)

- **AppNav**: 7번째 탭
- **라우트**: `/rankings` (25 wrapper + RankingsContent)
- **운영 LOC**: ~수백
- **양측 다리**: Phase 2 BG4 (MVP) + Phase 3 BT6 (팀 wins) — cross-domain stat
- **권장 이유**: 매우 작은 영역 / 빠른 진행 가능

#### E. 커뮤니티 (Community)

- **AppNav**: 8번째 탭
- **라우트**: `/community` (47) + `/community/[id]` (539) + `/community/new` (399) + `/community/[id]/edit`
- **운영 LOC**: ~1000
- **양측 다리**: Phase 1A 대회 알기자 (community-data.jsx) + super-admin `/admin/community` (91)
- **권장 이유**: 사용자 게시판 / 댓글 / 좋아요 — 별도 단위 작업

#### F. 알림 / 메시지 — AppNav main bar 5 아이콘 (★★★)

- **라우트**: `/notifications` (96) + `/messages` (655)
- **AppNav**: main bar 우측 5 아이콘 안 (Phase 19 추가) — 매우 자주 접근
- **양측 다리**: 모든 Phase 의 알림 발신처 + super-admin `/admin/notifications` (251)
- **권장 이유**: 통합 알림 / 메시지 hub — Phase 2/3 사용자 알림 흐름 후속

### 🔵 ★★ 약 권장 (정리 단위)

#### G. About / 마케팅 / Pricing

- **라우트**: `/about` (304) + `/pricing` (41) + `/news` (156) + `/reviews`
- **사용자 결정**: §6 "About 운영진 실명 박제 ❌" 보존 룰
- **권장 이유**: 외부 진입 영역 / 정보 페이지 정리

#### H. 검색 / 발견성

- **라우트**: `/search` (261)
- **양측 다리**: 전역 검색 — 모든 Phase 와 연결
- **권장 이유**: AppNav main bar 검색 아이콘 진입처

#### I. 온보딩 / 회원가입 흐름

- **라우트**: `/onboarding/basketball` (105) + `/onboarding/setup` (19) + `/login` (549) + `/signup` (311) + `/verify` + `/forgot-password` + `/reset-password`
- **권장 이유**: 첫 사용자 진입 / conversion funnel
- **권장도 ↓**: 박제 흔적 0 — 시안 박제 0 부터 시작 (큰 작업)

### ⚫ ★ 영구 보존 / 단순 정리

- /referee-info / /scrim / /stats / /gallery / /awards / /calendar / /coaches / /shop / /saved / /invite / /team-invite
- 모두 ✅ Phase 1B UD3 답습 시안 박제됨 or 작은 단위 영역
- **권장 이유**: 별 Phase 만들 필요성 낮음

### 🟣 super-admin (사이트 운영자) hub 묶음

- `/admin` (216) — 대시보드
- `/admin/users` (152) / `/admin/community` (91) / `/admin/organizations` (243) / `/admin/notifications` (251) / `/admin/plans` (397) / `/admin/partners` (279) / `/admin/news` (163) / `/admin/payments` (66) / `/admin/analytics` (193) / `/admin/courts` (132) / `/admin/me` / `/admin/settings`
- 총 LOC: ~2500+
- **권장**: 각 사용자 영역 Phase 끝마다 super-admin 측 함께 의뢰 (Phase 3 TA1/TA2 답습 패턴)

---

## 3. 권장 진행 순서 (Cowork 추천)

### 🥇 1순위 — Phase 4 = 단체 (Organizations)

- Phase 1A 자연 후속 (협회 마법사 PA3 → 단체 페이지)
- 적정 LOC (~700) — 1 의뢰서 안 처리 가능
- 핵심 데이터 모델 (시리즈 / 구단 / 협회)
- 갭 예상 ~5~7 (BO1~BO7)
- 시안 ~6~8 시안 (사용자 4~5 + 관리자 2~3)

### 🥈 2순위 — Phase 5 = 코트·장소 (Courts/Venues)

- cross-domain reference (Phase 1/2 모두)
- LOC ~1500 — 의뢰서 분할 가능성
- 결제 + 예약 + 체크인 = 별 결재 룰 필요
- 시안 ~8~10 시안 (사용자 5~6 + 파트너 2~3 + super-admin 1)

### 🥉 3순위 — Phase 6 = 알림·메시지 + 검색 묶음

- 작은 영역 묶음 (각 영역 단독으로 작아서)
- AppNav main bar 5 아이콘 ★★★
- 시안 ~5~7 시안

### 그 외 (Phase 7+) — 우선순위 ↓

- 프로필 / 마이페이지 본체 (Phase 7 또는 8 · 복잡도 ★★★★)
- 랭킹 + 커뮤니티 묶음 (작은 단위)
- About / 마케팅 (정리 단위)
- 온보딩 / 회원가입 (큰 작업 / 별 Phase)

---

## 4. 다음 액션 — 수빈 결재 필요

> 본 표 검토 후 Phase 4 영역 결재. Cowork 가 결재 받은 영역의 점검 리포트 + 의뢰서 2건 + delivery prompt + zip 자동 생성 (Phase 3 답습 패턴).

**Cowork 권장 = Phase 4 단체 (Organizations)** — Phase 1A 자연 연결 + 적정 복잡도.

→ 결재 후 수빈 본인 액션 = 2 단계 (~2분):
1. Cowork 가 산출물 5건 생성 (점검 + 의뢰서 2 + delivery + zip)
2. 수빈이 Claude.ai 에 drag-drop + paste

---

**검토 끝.** AskUserQuestion 으로 영역 결재.
