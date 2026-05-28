# Phase 1C — 대회 영역 운영 박제 (kickoff / scoping) CLI 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 완료**: Phase 1B v2.18 sync (2026-05-26) + Phase 1A v2.19 sync (2026-05-26) — BDR-current/ = v2.19 cumulative (17 시안 jsx + 6 user css)
> **본 의뢰 범위**: **scoping + 1차 PR 1 건까지** (PR 전체 일괄 ❌). 사용자 결재 단위로 진행
> **상위 ledger**: `.claude/phase-ledger.md` Phase 1 ⑪ ⑫ ⑬ 단계
> **이번에는 ZIP 동기화 ❌** — BDR-current/ 는 이미 v2.19 / 본 의뢰는 운영 src/ 박제 시작

---

## 1. 한 줄 요약

`BDR-current/` 의 17 시안 (관리자 11 + 사용자 6) 을 운영 `src/` 코드에 박제. **본 의뢰는 ① 사전 점검 → ② 17 시안 ↔ 운영 라우트 매핑 표 작성 → ③ PR 그룹핑 제안 (~16-19 PR) → ④ 사용자 결재 대기 → ⑤ 결재 시 PR-1C-1 1 건만 박제** 까지. 그 다음 PR 은 별 의뢰.

---

## 2. 사전 점검 (CLAUDE.md "오늘 작업 시작하자" 6 단계 — 필수)

```
□ git remote -v (github.com/bdr-tech/mybdr)
□ git fetch origin --prune + main/dev/subin 차이 요약
□ 현재 브랜치 = subin
□ .env 존재 + DATABASE_URL 키만 확인 (값 노출 ❌) — 운영 DB 정상
□ .env.local 에 localhost:3001 오버라이드 있는지
□ BDR-current/screens 파일 수 = 32 (jsx 26 + css 6) 확인
  → jsx 26 = admin 11 (PA*) + user 6 (Tournament* + MyActivity + MyRegistrationStatus) + game baseline 9 (Home/Games/Live/...)
  → game 9 = Phase 2 baseline (본 의뢰 대상 ❌)
□ phase-ledger Phase 1 ⑩ (1B + 1A) 모두 ✅ 완료 확인
```

→ 결과 요약 → **"이대로 Phase 1C scoping 시작해도 될까요?" 사용자 결재.** 결재 전 매핑/제안 작성 ❌.

---

## 3. 17 시안 ↔ 운영 라우트 매핑 표 작성

**Phase 1A 관리자 11 시안** (BDR-current/screens/Admin*.jsx + admin.css)

| ID | 시안 jsx | 운영 src/ 라우트 (Cowork 추정) | 신규/갱신 |
|----|---------|--------------------------|----------|
| PA1 | AdminTournamentAdminList.jsx | src/app/(admin)/tournament-admin/tournaments/page.tsx (137 lines) | 갱신 |
| PA2 | AdminTournamentWizard1Step.jsx | src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx (1668 lines) | 갱신 |
| PA3 | AdminWizardAssociation.jsx | src/app/(admin)/tournament-admin/wizard/association/page.tsx (353 lines) | 갱신 |
| PA4 | AdminTournamentSetupHub.jsx | src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx (289 lines) | 갱신 |
| PA5 | AdminTournamentMatches.jsx | src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx (74 lines) | 갱신 |
| PA6 | AdminTournamentDivisions.jsx | src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx (547 lines) | 갱신 |
| PA7 | AdminTournamentCompleted.jsx | src/app/(admin)/tournament-admin/tournaments/[id]/completed/page.tsx | **신규** |
| PA8 | AdminTournamentPlayoffs.jsx | src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/page.tsx (165 lines) | 갱신 |
| PA9 | AdminTournamentProspectus.jsx | src/app/(admin)/tournament-admin/tournaments/new/wizard/prospectus/page.tsx (387 lines) | 갱신 |
| (보조) | AdminTournamentTeams.jsx | src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx (1599 lines) — v2.18 carryover | 갱신 |
| (보조) | AdminTournamentBracket.jsx | src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx (976 lines) — v2.18 carryover | 갱신 |

**Phase 1B 사용자 6 시안** (BDR-current/screens/Tournament*.jsx, MyActivity.jsx, MyRegistrationStatus.jsx + 6 css)

| ID | 시안 jsx + css | 운영 src/ 라우트 (Cowork 추정) | 신규/갱신 |
|----|--------------|--------------------------|----------|
| UA1 | Tournaments.jsx + tournaments.css | src/app/(web)/tournaments/page.tsx (81 lines) | 갱신 |
| UA2 | TournamentDetail.jsx + tournament-detail.css | src/app/(web)/tournaments/[id]/page.tsx (684 lines) | 갱신 |
| UA3 | TournamentEnroll.jsx + tournament-enroll.css | src/app/(web)/tournaments/[id]/join/page.tsx (1563 lines) | 갱신 |
| UB1 | TournamentCompleted.jsx + tournament-completed.css | src/app/(web)/tournaments/[id]/page.tsx status 분기 또는 `[id]/completed` 신규 | **확인 필요** |
| UC1 | MyActivity.jsx + my-activity.css | src/app/(web)/profile/activity/page.tsx (881 lines) | 갱신 |
| UC2 | MyRegistrationStatus.jsx + my-registration-status.css | UA2 / UC1 안 sub 또는 별 라우트 | **확인 필요** |

→ CLI 가 위 표를 **실제 grep 으로 검증**한 후 확정 매핑 산출. 추정 라우트 ≠ 실제 라우트 인 경우 발견 시 알림.

→ UB1 / UC2 의 운영 라우트 후보가 애매하면 explore 에이전트로 확인.

---

## 4. PR 그룹핑 제안 (CLI 가 산출)

각 PR 의 원칙:
- **1 PR = 1 시안** (또는 매우 작은 보조 시안 묶기 OK)
- 시안 1 개 의 src/ 변경 = 1 page.tsx 갱신 + 추출 컴포넌트 0~3 개 + 라우트 신규 0~1
- API / 데이터 패칭 / DB 변경 **0** (리디자인 룰 — CLAUDE.md §코딩 컨벤션 "리디자인: API/데이터 패칭 유지 + UI만 변경")
- 의존성 있는 PR 순서 명시 (예: PA1 → PA2 → PA3 = 진입 → 마법사 → 협회 흐름)

**산출 형식 예시**:
```
PR-1C-1 = UA1 Tournaments 박제 (사용자 진입 — 가장 안전)
  · src/app/(web)/tournaments/page.tsx 갱신
  · src/app/(web)/tournaments/_components/ 신규 컴포넌트 0~2 추출
  · 영향: 사용자 측 대회 list. 다른 라우트 영향 0
  · 검증: dev:3001 list 화면 / 카드 / 필터 동작 + lint + typecheck

PR-1C-2 = UA2 TournamentDetail 박제
  ...
PR-1C-3 = UA3 TournamentEnroll 박제
  ...
PR-1C-17 = PA7 AdminTournamentCompleted 박제 (신규 라우트)
  · src/app/(admin)/tournament-admin/tournaments/[id]/completed/page.tsx 신규
  · 사이드바 링크 추가
  ...
```

**제안 순서 추천 안**:
1. **선행 그룹 (사용자 진입 — 위험 ↓)**: UA1 → UA2 → UB1 (사용자 대회 흐름 끝까지 한 줄)
2. **중간 그룹 (사용자 가입 / 마이페이지)**: UA3 → UC1 → UC2
3. **관리자 그룹 (위험 ↑ — Flutter 사전 공지 ❌ 비대상 / 웹 admin only)**: PA1 → PA2 → PA3 → PA4 → PA5 → PA6 → PA8 → PA9 → PA7 (신규)
4. **보조 (v2.18 carryover)**: AdminTournamentTeams / AdminTournamentBracket (필요 시)

→ CLI 가 위 안을 검토 + 자체 수정안 제출.

---

## 5. PR-1C-1 박제 실행 (사용자 결재 후)

매핑 + PR 그룹핑 + 순서 모두 사용자 결재 받은 후, **PR-1C-1 만 박제**.

권장: **PR-1C-1 = UA1 Tournaments** (사용자 진입 / 라우트 81 lines / 위험 ↓ / 박제 흐름 검증).

박제 절차:
```
[Step 1] git checkout subin && git pull origin subin
[Step 2] git checkout -b subin (이미 있으면 skip)
[Step 3] BDR-current/screens/Tournaments.jsx + tournaments.css 읽기
[Step 4] src/app/(web)/tournaments/page.tsx 갱신 — 시각만, API/Prisma 호출 유지
[Step 5] 필요 시 src/app/(web)/tournaments/_components/ 컴포넌트 추출
[Step 6] dev:3001 로컬 검증 — list / 필터 / 빈 상태 / 다크모드
[Step 7] lint + typecheck — npm run lint && npx tsc --noEmit
[Step 8] 자체 회귀 검수 (아래 §6 6 케이스)
[Step 9] commit (`design(1C-1): UA1 Tournaments v2.18 시안 박제`) + push
[Step 10] subin → dev PR 생성 (CLAUDE.md §🚦) + Cowork 알림
[Step 11] phase-ledger Phase 1 ⑪ 에 PR-1C-1 ✅ 마킹 + Phase 1 ⑫ 회귀 검수 ✅
```

→ PR-1C-2 는 별 의뢰. **본 의뢰는 PR-1C-1 끝나면 stop**.

---

## 6. 자체 회귀 검수 6 케이스 (각 PR 박제 후 필수)

CLAUDE.md §회귀 방지 + Dev/design/claude-project-knowledge/06-self-checklist.md 적용:

```
□ ❌ main bar 우측에 "더보기 ▼" dropdown / 아바타 노출 = 없음
□ ❌ 모바일(≤768px) 듀얼 라벨 = 없음
□ ❌ 검색/쪽지/알림 버튼 box (.btn 박스) = 없음
□ ❌ main bar 우측 5 아이콘 순서 = [다크, 검색, 쪽지, 알림, 햄버거]
□ ❌ 하드코딩 색상 = 0 (var(--color-*) 변수만)
□ ❌ lucide-react import = 0 (Material Symbols Outlined 만)
□ ❌ rounded-full / 9999px = 0 (정사각형 W=H 원형은 50% OK)
□ ❌ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
```

→ 위반 1 건이라도 발견 → PR 자체 reject + 사용자 보고.

---

## 7. 🔄 역박제 룰 적용 (CLAUDE.md §🔄)

PR 박제 중 **운영 측 시각 패턴이 BDR-current/ 와 다를 경우 (drift)** → BDR-current/ 갱신도 같은 PR 또는 별 commit (`design(sync): 운영 X 시안 박제`).

본 의뢰는 BDR-current/ → src/ 박제이므로 일반적으로 역방향 갱신 ❌. 단, **시안과 운영 사이 새로운 공유 컴포넌트 (예: NavBadge)** 가 추가되면 BDR-current/components.jsx 도 갱신.

---

## 8. 안전 가드 (CLAUDE.md §🚦 + §DB)

### 절대 금지
- ❌ main 직접 push (subin → dev PR 만)
- ❌ 운영 DB destructive 작업 — 본 의뢰 = UI 박제이므로 DB 변경 0 이 정상. 만약 schema 변경 필요 = 즉시 stop + 사용자 보고
- ❌ prisma migrate reset / db push --accept-data-loss
- ❌ /api/v1/* 변경 (Flutter 영향) — 본 의뢰 = 웹 UI 만이므로 비대상

### 의무
- ✅ Phase 1A admin 박제 시 **/api/web/* 의 응답 키 = snake_case** 점검 (errors.md 재발 5회 — 신규 필드 추가 전 curl 1회 raw 응답 확인)
- ✅ 리디자인 = UI 만 / API 호출 / 데이터 흐름 유지 (CLAUDE.md §코딩 컨벤션)
- ✅ Material Symbols Outlined / Pretendard / Space Grotesk 만 / lucide-react 금지 (BDR-current/tokens.css 변수 그대로)
- ✅ 13 룰 위반 자동 reject (claude-project-knowledge/00-master-guide.md)

---

## 9. 산출물 (CLI → 사용자)

본 의뢰 끝나면 사용자가 받을 것:

```
1. 17 시안 ↔ 운영 라우트 매핑 표 (확정) — 본 prompt §3 표 + CLI 검증 결과
2. PR 그룹핑 제안 (~16-19 PR) — 본 prompt §4 형식 + 의존성 순서
3. PR-1C-1 박제 1 건 + subin → dev PR 링크
4. phase-ledger 갱신 (Phase 1 ⑪ 에 PR-1C-1 ✅ + 향후 PR ⏸ 보류)
5. .claude/scratchpad.md 작업 로그 1 줄 추가
6. 미푸시 commit 알림 (있을 경우)
```

→ 사용자 (수빈) 의 다음 액션:
```
☐ PR-1C-1 결재 (subin → dev → main)
☐ PR-1C-2 의뢰서 새로 요청 (또는 본 의뢰 패턴 그대로 "PR-1C-2 박제해줘" 한 줄)
```

---

## 10. 사용자 본인 수동 액션 (5 단계 — WORKFLOW.md §부록 A 답습)

```
[1] 본 prompt 를 CLI 에 전달 (또는 `Read Dev/design/prompts/phase-1C-kickoff-cli-prompt-2026-05-28.md` 한 줄)
[2] 사전 점검 결과 결재 (§2)
[3] 매핑 + PR 그룹핑 결재 (§3 §4)
[4] PR-1C-1 결과 검토 (subin → dev → main 결재)
[5] PR-1C-2 추가 의뢰 (별 prompt 또는 본 prompt 의 §5 답습)
```

→ 총 5 회 의사결정 / 박제 자체 = CLI 가 함.

---

## 11. 참조 문서 (CLI 가 본 의뢰 수행 중 항상 곁에 둘 것)

1. `CLAUDE.md` (프로젝트 root) — 🚦 브랜치 / 🗄️ DB / 🔄 역박제
2. `Dev/design/claude-project-knowledge/00-master-guide.md` — 13 룰
3. `Dev/design/claude-project-knowledge/03-appnav-frozen-component.md` — AppNav frozen 코드
4. `Dev/design/claude-project-knowledge/06-self-checklist.md` — 자체 검수
5. `Dev/design/BDR-current/` — sync 된 17 시안 (source of truth — 본 의뢰의 입력)
6. `.claude/phase-ledger.md` — Phase 단계 ledger (⑪ ⑫ ⑬ 갱신 대상)
7. `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` — Phase 1A 의뢰 (시안 의도 참조)
8. `Dev/design/prompts/tournament-user-redesign-prompt-2026-05-25.md` — Phase 1B 의뢰 (시안 의도 참조)

---

## 12. 결재 후 CLI 다음 한 줄 응답 형식

```
✅ Phase 1C kickoff 의뢰 확인 — 대회 영역 운영 박제 scoping

이해: BDR-current/ 17 시안 → src/ 박제. PR ~16-19 묶음. 본 의뢰는 ① 사전 점검 → ② 매핑 → ③ PR 그룹핑 → ④ 사용자 결재 → ⑤ PR-1C-1 1 건만.

사전 점검 6 단계 시작. 결재 받기 전 매핑/제안 ❌ / 박제 ❌.
```

→ 위 형식으로 응답 후 §2 사전 점검 6 단계 실행.

---

**의뢰 끝.** 본 prompt 한 줄로 CLI 에 전달:
`Read Dev/design/prompts/phase-1C-kickoff-cli-prompt-2026-05-28.md 하고 §2 사전 점검부터 시작해줘.`
