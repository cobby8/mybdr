# BDR v2.18 — 대회 사용자 측 + 사용자↔관리자 연결 다리 (Phase 1B)

> **의뢰**: `uploads/tournament-user-admin-connectivity-plan-2026-05-25/tournament-user-redesign-prompt-2026-05-25.md`
> **상위 계획서**: `tournament-user-admin-connectivity-plan-2026-05-25.md`
> **운영 코드 변경**: **0** — 시안 박제만 (운영 박제는 Phase 1C 별 Phase)

---

## v2.18 갱신 (2026-05-25) — Phase 1B

### 전면교체 (1건)
- **Tournaments** (목록) — 새 카드 grid + sticky 필터 + 정원 progress bar + status 뱃지 + 종료 우승팀 라인

### 부분수정 (4건)
- **TournamentDetail** — 종별 selector sticky chip row (B2) + 5 탭 통합 (overview/schedule/bracket/teams/rules) + sidebar 5-단계 step + bracket 탭 버전 표시 (B5)
- **TournamentEnroll** — 5단계 stepper 보존 + step 5 결제 시각 강화 (결제수단 3종 + 명세) + 사후 안내 page
- **MyActivity** — "내 대회" 섹션 신설 (pending 상단 / rejected 하단 정렬)
- **MyRegistrationStatus** — sidebar (UA2) + 마이페이지 list (UC1) 양쪽 재사용 컴포넌트. `--color-*` 폐기 토큰 교체.

### 신규 (1건)
- **TournamentCompleted** — 종료 발표 variant (상세 status='completed' 분기, 신규 라우트 X). 🏆 우승팀 hero + 5 카드 + 공유.

### 관리자 보강 (3건)
- **AdminTournamentTeams** — B1 알림 액션 + B3 payment_status 컬럼 + B4 정원 진행도 카드
- **AdminTournamentBracket** — B5 publish 시 알림 체크박스 + 변경 이력 panel
- **AdminTournamentSetupHub** — Phase 1A B1 (진행도 bar) 보존 + B7 "사용자 미리보기" link 카드 (9번째 secondary)

---

## 파일 구조

```
BDR v2.18/
├── README.md                            (본 파일)
├── index.html                           (Phase 1B 시안 목차 hub)
├── tokens.css                           (디자인 토큰 single source)
├── shell.css                            (showcase + AppNav frozen + AdminShell mock)
├── admin.css                            (UD1/UD2/UD3 공용 admin UI)
├── shared.jsx                           (AppNav / AdminShell / Crumbs / 공용 mock data)
│
├── ua1-tournaments.html                 (UA1 preview)
├── ua2-tournament-detail.html           (UA2 preview · 일반/운영자 2 variant)
├── ua3-tournament-enroll.html           (UA3 preview · STEP 5 + Success 2 variant)
├── ub1-tournament-completed.html        (UB1 preview)
├── uc1-my-activity.html                 (UC1 preview)
├── ud1-admin-teams.html                 (UD1 preview)
├── ud2-admin-bracket.html               (UD2 preview)
├── ud3-admin-setup.html                 (UD3 preview)
│
└── screens/
    ├── Tournaments.jsx + tournaments.css
    ├── TournamentDetail.jsx + tournament-detail.css
    ├── TournamentEnroll.jsx + tournament-enroll.css
    ├── TournamentCompleted.jsx + tournament-completed.css
    ├── MyActivity.jsx + my-activity.css
    ├── MyRegistrationStatus.jsx + my-registration-status.css  (UA2 + UC1 공용)
    ├── AdminTournamentTeams.jsx
    ├── AdminTournamentBracket.jsx
    └── AdminTournamentSetupHub.jsx
```

---

## B1~B7 갭 → 시안 매핑

| 갭 | 영향도 | 사용자 측 | 관리자 측 |
|----|-------|---------|---------|
| B1 신청 결과 통보 | ★★★★★ | UA2 sidebar step + UC1 마이페이지 | UD1 알림 액션 |
| B2 종별 진입 | ★★★★ | UA2 종별 selector chip row | (Phase 1A C2) |
| B3 결제 흐름 | ★★★★ | UA3 결제 step 강화 + 사후 안내 | UD1 payment 컬럼 |
| B4 정원 진행도 | ★★★ | UA1 목록 + UA2 hero | UD1 진행도 카드 |
| B5 대진 변경 알림 | ★★★★ | UA2 bracket 탭 버전 + 본인 팀 하이라이트 | UD2 publish 알림 + 버전 히스토리 |
| B6 종료 발표 | ★★★★★ | UB1 종료 variant | (Phase 1A D1) |
| B7 공개 게이트 | ★★★ | UA1 status 뱃지 | UD3 사용자 미리보기 link |

---

## 자체 검수 (06-self-checklist)

### 사용자 측 5 시안 (UA1~3 + UB1 + UC1) — A 등급

- ✅ §1 AppNav — `shared.jsx` 의 `<window.AppNav />` 컴포넌트 카피. 9 메인 탭 / utility bar / 5개 icon-btn (검색·쪽지·알림·다크·햄버거) / `app-nav__icon-btn` 무 border / 모바일 닉네임 hidden.
  - 위반 검수 4 케이스 ❌ 모두 통과: 더보기 dropdown 0 / 모바일 듀얼 라벨 0 / 아이콘 박스 0 / 순서 변경 0
- ✅ §2 더보기 — 가짜링크 4건 신규 추가 ❌. UB1 = status 분기 / UC1 = 마이페이지 sub-link
- ✅ §3 디자인 토큰 — `tokens.css` var(--*) 100%. hex 색상 / `--color-*` 폐기 토큰 / lucide-react 0
- ✅ §5 모바일 — 720px 분기 / iOS input 16px (UA1 검색 / UA3 폼) / 버튼 44px (`.btn--touch`)
- ✅ §6 연결성 — 각 JSX 상단 JSDoc 매트릭스 (진입 / 복귀 / 에러)
- ✅ §6-2 About 운영진 실명 ❌ — UB1 의 MVP / 베스트5 = DB 출처 (`mvp_player.nickname` / `champion_team.name`) — 운영진 실명과 별개

### 관리자 보강 3 시안 (UD1~3) — E 등급

- ✅ §3 디자인 토큰 (동일)
- ✅ §5 모바일 (admin sidebar 모바일 hidden / table 가로 스크롤)
- ✅ §6 연결성 (JSDoc)
- ✅ §7 E 등급 자체 영역 — `<window.AdminShell />` 자체 sidebar (AppNav 적용 외)

---

## 사용자 결정 §1~§8 보존

| § | 결정 | 본 의뢰 |
|---|------|------|
| §1 헤더 | 9 메인 탭 / 더보기 / utility bar | ✅ 사용자 측 5 시안 강제 (shared.jsx AppNav) |
| §2 더보기 5그룹 | 가짜링크 4건 ❌ | ✅ UB1 = status 분기 / UC1 = sub-link |
| §3 팀 페이지 | 레이팅 stat 제거 | 영향 없음 |
| §4 프로필 | 이모지 아이콘 / 사이드바 | ✅ UC1 마이페이지 사이드바 보존 |
| §5 메인 페이지 | Hero 카로셀 | 영향 없음 |
| §6-1 카피 | "서울 3x3 농구 커뮤니티" 보존 | ✅ placeholder / status 뱃지 시안 우선 |
| §6-2 About 운영진 실명 ❌ | 일반 라벨 | ✅ MVP = DB 출처 / 충돌 0 |
| §7 모바일 (720px / iOS 16px / 44px) | 글로벌 가드 | ✅ 8 시안 모두 적용 |
| §8 인증/권한 | captainId 매칭 | UD3 사용자 미리보기 시안만 (운영 구현 Phase 1C) |

---

## 다음 단계 (Phase 1C — 운영 박제)

본 시안 박제 완료 후 운영 코드 박제는 별 Phase. PR 그룹 제안:

- **사용자 측 PR 그룹** (5개): Tournaments / TournamentDetail (+ 종별 + bracket 버전) / TournamentEnroll (+ 결제 사후 안내) / TournamentCompleted (status 분기) / MyActivity 내 대회 + MyRegistrationStatus 컴포넌트 (`--color-*` 교체)
- **관리자 PR 그룹** (3개): AdminTournamentTeams (B1+B3+B4) / AdminTournamentBracket (B5) / AdminTournamentSetupHub (B7 카드 추가)

Phase 1A + Phase 1B 합산 = 18 시안 + 1 컴포넌트 = 19 파일 / 8 + 5 = 13 PR.
