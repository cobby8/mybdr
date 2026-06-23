# MyBDR 마스터 진행 계획 (2026-06-08)

> **목적**: 현재 정확한 상태 기반 / 탄탄한 단계별 진행 / 위험 최소화 / 머지 적체 방지
> **현재 정합**: subin = dev = main = `7531ef8` (Phase 8 #663/#664 머지 완료)
> **마지막 sync**: v2.28 (Phase 8)

---

## 1. 현재 상태 (정확 점검 2026-06-08)

### 완료 (✅)

| Phase | Claude.ai 박제 | BDR-current sync | 운영 박제 | 머지 |
|-------|--------------|----------------|---------|------|
| 1A/1B (대회) | v2.19 / v2.18 | ✅ | ✅ | ✅ #650~#655 |
| 1C 운영 박제 | - | - | ✅ 15/16 (PA3 SKIP) | ✅ |
| 2 (경기) | v2.20 | ✅ | ✅ 10/10 | ✅ #654 |
| 3 (팀) | v2.21 | ✅ | ✅ 6/6 | ✅ #654 |
| 4 (단체) | v2.22 | ✅ | ✅ 8/8 | ✅ #654 |
| 5 (랭킹·커뮤) | v2.23 | ✅ | ✅ 4/4 | ✅ #657/#658 |
| 6.1 (프로필) | v2.24 | ✅ | ✅ 6/6 | ✅ #658/#660 |
| 6.2 (결제) | v2.25 | ✅ | ✅ 7/7 | ✅ #660 |
| 6.3 (성장·설정) | v2.26 | ✅ | ✅ 3/3 | ✅ #660 (Phase 6 묶음 종료) |
| 7 (인증·온보딩) | v2.27 | ✅ | ✅ 4/4 | ✅ #661/#662 |
| 8 (코트·장소) | v2.28 | ✅ | ✅ 8/8 | ✅ #663/#664 |

→ **53 + 38 = 91 page 박제 + 머지 완료** (web + admin 통합).

### 진행 중 / 대기 (⏸)

| Phase | 상태 |
|-------|------|
| **9 (알림·메시지·검색)** | Claude.ai 박제 ✅ v2.29 / **sync ⏸ / 운영 박제 ❌** |
| **10 (정보 페이지)** | Claude.ai 의뢰 진행 중 / zip 아직 도착 안 함 |
| **회귀 P0 (종료 대회 v2)** | Claude.ai 의뢰서 작성 완료 / 전달 대기 |

### 미박제 잔여

| 그룹 | 페이지 수 | 우선순위 |
|------|---------|---------|
| 잔여 사용자 측 (lineup-confirm / games/edit + report / my-games / guest-apps / referee-info / profile/complete / tournaments/referee-request) | 7 | 작은 단위 |
| Phase 11 작은 영역 (awards/calendar/coaches/gallery/scrim/shop/stats/saved/invite) | 9 | 묶음 |
| Phase 12 super-admin 잔여 (admin/analytics/me/logs/settings/suggestions/campaigns + tournament-admin/templates/admins/recorders/site/wizard/audit-log/transfer-organizer + admin/tournaments) | ~13 | 운영자 |
| Phase 13 홈 full + 법적 (/privacy/terms/safety/~offline + / full) | 5 | SEO |
| referee 시스템 | 25+ | 별 영역 / 원영 |
| 보류 PA3 | 1 | planner 재설계 |

---

## 2. 핵심 원칙 (위반 시 stop)

1. **누적 sync 금지** — 시안 박제 도착하면 즉시 sync (drift 방지)
2. **batch 분할** — 한 session 6~10 PR 이내 (stop conditions 발동 방지)
3. **머지 정기 처리** — 매 Phase batch 끝나면 즉시 subin→dev→main (적체 방지)
4. **회귀 신고 우선 (P0)** — 사용자 보고 발생 시 별 흐름 처리
5. **자동 결재 default** — sync A / 결제 B / 라우트 모달 / Q1~Q4 lock 답습
6. **Stop Conditions** — lint/tsc 실패 / 회귀 6 위반 / DB destructive / `/api/v1` 변경 / LOC>+2000 / mock 사용 / 시안 사용자 결정 §1~§8 위반

---

## 3. 단계별 STAGE 계획

### 🟢 STAGE A — 정합 회복 (지금 ~1 session)

**목표**: 누적 잔여 + 회귀 신고 우선 처리.

```
A-1. Phase 9 sync + Phase 9C 운영 박제 batch (4 PR)
     의뢰서: phase-9-auto-chain-cli-prompt-2026-06-07.md (작성됨)
     예상: ~1 session

A-2. 회귀 신고 v2 (종료 대회) Claude.ai 박제
     의뢰서: completed-tournament-detail-v2-prompt-2026-06-08.md (작성됨)
     예상: Claude.ai 박제 ~수십분 + sync ~5분 + 운영 박제 1 PR ~10분

A-3. STAGE A 끝 → 머지 (subin → dev → main / 1 회 일괄)
```

### 🟢 STAGE B — Phase 10 정보 페이지 종료 (Claude.ai 박제 도착 후 ~1 session)

```
B-1. Phase 10 박제 zip 도착 대기 (의뢰 패키지 작성됨)
B-2. v2.30 sync + Phase 10C 운영 박제 batch (5 PR)
B-3. 머지
```

### 🟢 STAGE C — Phase 11 작은 영역 묶음 (~2 session)

```
C-1. 영역 결재 (분할 방식 — 시각 콘텐츠 vs 활동 vs 통합)
C-2. Claude.ai 의뢰 패키지 → 박제 → zip → sync → 운영 박제 batch (9 PR)
C-3. 머지
```

### 🟢 STAGE D — Phase 12 super-admin hub (~1 session)

```
D-1. /admin (대시보드) + analytics + me + logs + settings + suggestions + campaigns + tournament-admin 잔여 = ~13 page
D-2. 의뢰서 작성 → 박제 → sync → 운영 박제 batch
D-3. 머지
```

### 🟢 STAGE E — Phase 13 홈 + 법적 (~1 session)

```
E-1. / (홈) full 박제 + /privacy + /terms + /safety + /~offline = 5 page
E-2. 의뢰서 작성 → 박제 → sync → 운영 박제 batch
E-3. 머지
```

### 🟡 STAGE F — 잔여 사용자 측 7 page (~수십분)

```
F-1. /lineup-confirm + /games/edit + /games/report + /my-games + /guest-apps + /referee-info + /profile/complete = 작은 단위 묶음 또는 개별 박제
F-2. 의뢰서 + 박제 + 머지
```

### 🔴 STAGE G — 보류 결정 (별도 결재)

```
G-1. PA3 재설계 (planner DB 실측 + 신규 기능 vs 리디자인 결정)
G-2. referee 시스템 (Flutter 협업 / 원영 측 / 별 Phase)
```

---

## 4. 위험 관리

| 위험 | 대응 |
|------|------|
| BDR-current drift | Phase 9 sync 즉시 (STAGE A-1) |
| 운영 박제 stop 발동 | batch 분할 (4~10 PR 이내) |
| 머지 PR 적체 | STAGE 마다 일괄 머지 (subin → dev → main) |
| 회귀 추가 발생 | STAGE 사이 P0 처리 (별 흐름) |
| Claude.ai 박제 지연 | Cowork 측 다음 의뢰서 + 점검 병행 진행 |
| PA3 / referee 결정 지연 | 별도 처리 / 본 chain 영향 0 |

---

## 5. 예상 종료 시점

```
STAGE A: ~1 session (지금)
STAGE B: ~1 session (Phase 10 박제 도착 후)
STAGE C: ~2 session
STAGE D: ~1 session
STAGE E: ~1 session
STAGE F: ~수십분
STAGE G: 별 결정

전체 = ~6 session + 별 결정
```

→ STAGE A~F 끝나면 **MyBDR 박제 100%** (referee + PA3 제외).

---

**계획 끝.** STAGE A 즉시 시작 (아래 §6).

---

## 6. STAGE A 실행 — 즉시 진행

### A-1. Phase 9 sync + 운영 박제 (의뢰서 작성 완료)

📄 의뢰서: `Dev/design/prompts/phase-9-auto-chain-cli-prompt-2026-06-07.md`

**CLI 한 줄**:
```
Read Dev/design/prompts/phase-9-auto-chain-cli-prompt-2026-06-07.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용.
```

→ v2.29 sync + Phase 9C 4 PR (NU1+NU2+NU3+NA1) auto chain / ~1 session.

### A-2. 회귀 신고 v2 (종료 대회) — 사용자 행위

📄 의뢰서: `Dev/design/prompts/completed-tournament-detail-v2-prompt-2026-06-08.md`

**수빈 본인 액션**:
1. 위 의뢰서 1건 Claude.ai 채팅에 drag-drop
2. paste 메시지 본문 (이미 작성 — 직전 응답 §메시지 본체 참조)
3. Claude.ai 박제 → 새 zip 회신
4. Cowork 에 알림 → 자동 sync + 운영 박제 1 PR

### A-3. STAGE A 머지 결재 (PR 도착 후)

```
GitHub → subin → dev PR 머지 → dev → main PR 머지 → main 운영 배포
```

→ STAGE A 종료 시 BDR-current = v2.29 / 운영 = Phase 9 박제 머지 / 회귀 P0 해결.
