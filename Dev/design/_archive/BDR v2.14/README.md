# BDR v2.14 — Admin-E 핵심 5 페이지 + 신규 컴포넌트 3 (운영 5/14 commit 반영)

## 작업 요약

v2.13 → v2.14. **Admin-B/C/D/E 통합 의뢰서 분할 2차 — 영역 E 핵심 5 페이지 박제.**

분할 진행도:
- v2.13 ✅ = B 신규 3 + C 신규 1 + D 갱신/신규 2 = 6 페이지
- **v2.14 ✅ (이번)** = E 핵심 5 페이지 + 컴포넌트 3 (운영 5/14 commit 6건 반영)
- v2.15 (다음) = E 나머지 17 (보조 페이지 / Series / Org / Templates)

## 신규 페이지 (5건)

| route | 패턴 | 5/14 commit 반영 |
|---|---|---|
| `adminTournamentAdminHome` (E-1) | 통계 4 카드 + 빠른 액션 4 + 좌 최근 활동 / 우 곧 시작 대회 | — |
| `adminTournamentAdminList` (E-2) | DataTable + 6 상태 탭 (전체/작성중/신청중/진행중/완료/보관) | — |
| `adminTournamentSetupHub` (E-3) | **8 체크리스트 hub + 진행도 바 + 공개 가드** | **c3474db UI-1 + 3d8d5bf UI-5** ✅ |
| `adminTournamentNew` (E-10) | 1-step 압축 wizard + 시리즈 inline + ?step anchor | **60dd37e UI-2 + 71b0eaa UI-1.1~1.3 + e8adc1a UI-1.5** ✅ |
| `adminTournamentEditWizard` (E-11) | 다중 섹션 폼 + 좌 sticky ToC + bracketSettings 통합 + 사이트 영역 제거 | **8478a24 UI-3+4** ✅ |

## 신규 컴포넌트 (3건, `components-admin-checklist.jsx`)

| 컴포넌트 | 사용처 | 주요 props |
|---|---|---|
| **AdminProgressBar** | SetupHub 진행도 | completed / total / label / size / tone |
| **AdminChecklistCard** | SetupHub 8 항목 | num / label / desc / icon / **status** (done/progress/idle/locked) / required / locked_reason / onClick |
| **AdminInlineForm** | Wizard1Step 시리즈 inline | label / placeholder / onAdd / ctaLabel — open/close toggle 내장 |

## E-3 SetupHub 8 항목 (운영 c3474db UI-1)

| # | 항목 | 필수 | 의존 | 잠금 사유 |
|---|---|---|---|---|
| 1 | 기본 정보 | ✅ | — | — |
| 2 | 시리즈 연결 | — | — | — |
| 3 | 종별 정의 | ✅ | — | — |
| 4 | 운영 방식 | ✅ | 3 | 3. 종별 정의 선행 필요 |
| 5 | 신청 정책 | ✅ | — | — |
| 6 | 사이트 설정 | ✅ | 1 | 1. 기본 정보 선행 필요 |
| 7 | 기록 설정 | ✅ | 4 | 4. 운영 방식 선행 필요 |
| 8 | 대진표 생성 | ✅ | 4 | 4. 운영 방식 선행 필요 |

**공개 가드**: 필수 7항목 (1·3·4·5·6·7·8) 모두 ✅ 일 때만 [공개하기] 활성 (3d8d5bf UI-5). 시리즈 (2) 는 선택.

**Progression 셀렉터** (`PROG` 상단 토글): `0/8` / `3/8` / `7/8` / `8/8` — 각 단계에서 잠금/공개 가드 동작 확인.

## E-10 Wizard1Step (운영 60dd37e + 71b0eaa + e8adc1a)

- **1-step 압축** (UI-2): 진입 → 짧은 폼 (대회명 + 시리즈) → [draft 만들고 hub 로 이동] CTA → 0.9s mock delay → SetupHub redirect
- **시리즈 inline** (UI-1.2): `AdminInlineForm` — 기존 시리즈 select + "신규 시리즈 inline 추가" 버튼 → expand 시 input + [추가] / [×]
- **회차 자동 부여** (UI-1.3): 선택 시리즈의 `edition_next` 가 미리보기 박스에 표시
- **?step=2 anchor 점프** (UI-1.5): 각 섹션에 `id="step1/2/3/4"` 추가 (URL anchor 로 jump 가능)
- **game_method 비고** (UI-1.1): 4. 운영 방식 select + 안내 박스 (종별별 다른 방식 가능 안내)

## E-11 EditWizard (운영 8478a24 UI-3+4)

- **bracketSettings 통합 (UI-3)**: 6. 대진표 설정 섹션 신설 — 조 크기 / 결선 시드 방식 / 3·4위전 / "UI-3 통합" 뱃지
- **사이트 영역 제거 (UI-4)**: 사이트 섹션 placeholder 만 남기고 "UI-4 — 별도 페이지" 안내 + hub 6. 사이트 설정 으로 이동 링크
- 6 섹션 구조: 1 기본정보 / 2 종별 / 3 운영방식 / 4 신청정책 / 5 기록설정 / 6 대진표설정
- 좌 sticky ToC + 우 본문 + sticky 저장 바 (dirty 상태)

## 변경 파일 요약

```
신규 (6)
├── components-admin-checklist.jsx                       (~10kb · ProgressBar + ChecklistCard + InlineForm)
├── screens/AdminTournamentAdminHome.jsx                 (~15kb · 통계 + 빠른 액션 + 활동/다가오는 대회)
├── screens/AdminTournamentAdminList.jsx                 (~12kb · DataTable 6 탭)
├── screens/AdminTournamentSetupHub.jsx                  (~13kb · 8 체크리스트 + 공개 가드)
├── screens/AdminTournamentWizard1Step.jsx               (~15kb · 1-step + inline 시리즈)
└── screens/AdminTournamentEditWizard.jsx                (~20kb · 6 섹션 + ToC + sticky save)

변경 (3)
├── MyBDR.html                                           (+ 6 script src + 5 route + 5 isAdmin)
├── components-admin.jsx                                 (ADMIN_NAV adminTournaments.children — adminTournamentAdminHome + adminTournamentNew + adminWizardTournament(v2.6 미리보기))
└── screens/AdminComingSoon.jsx                          (ADMIN_LIVE_ROUTES Set 23 → 28, LABELS 5건 추가)

README.md ← this
```

## ADMIN_NAV 최종 (v2.14)

```
콘텐츠 > 대회 관리 children:
  ├── 대회 운영자 도구 (adminTournamentAdminHome)        ← v2.14 신규 진입점
  ├── 새 대회 만들기 (adminTournamentNew)                ← v2.14 1-step
  └── 5-step 마법사 (v2.6) (adminWizardTournament)       ← v2.6 시안 미리보기 (q4 결정 — 공존)
```

브리프 §10 q4 결정 (둘 다 보존): v2.6 5-step 시안과 운영 1-step 모두 라우트 등록. 사이드바에 두 항목 동시 노출.

## 자체 검수 (uploads/06-self-checklist.md)

- [x] E-1 / E-2 — 통계 + DataTable + 4 상태군 ✅
- [x] **E-3** — 8 체크리스트 (운영 UI-1) + 진행도 바 + 공개 가드 (UI-5 — 필수 7항목 ALL ✅) + 잠금 사유 표시 ✅
- [x] **E-10** — 1-step 압축 (UI-2) + 시리즈 inline 생성 (UI-1.2) + 회차 자동 (UI-1.3) + step anchor (UI-1.5) ✅
- [x] **E-11** — bracketSettings 통합 (UI-3) + 사이트 영역 제거 (UI-4) + 6 섹션 + ToC ✅
- [x] 신규 컴포넌트 3 — `AdminProgressBar` / `AdminChecklistCard` / `AdminInlineForm` 박제 ✅
- [x] AppNav frozen 변경 0 (admin 자체 셸)
- [x] 13 룰 — 토큰만 (var(--accent), var(--ok), var(--err), var(--bg-card) 등) / Material Symbols / 4~6px 라운딩
- [x] snake_case mock (tournament_id / series / division_id 등)
- [x] AdminShell / v2.7.1 컴포넌트 재사용 / v2.6 wizard 미변경
- [x] ADMIN_LIVE_ROUTES Set 23 → 28
- [x] v2.6 5-step 시안과 v2.14 1-step 공존 (sidebar 두 항목 모두 노출)

## 다음 단계 (v2.15)

영역 E 나머지 17 페이지:
- 보조 페이지 7 — Teams / Admins / Recorders / Site / Bracket / Matches / Divisions
- Series 5 — List / Detail / New / Edit / AddEdition
- Org 4 — List / Detail / Members / New
- Templates 1

## 메모

- E-3 SetupHub: progression 셀렉터로 0/8 → 3/8 → 7/8 → 8/8 토글 → 잠금/공개 가드 시각 변화 확인 가능. 공개 버튼은 7/8 → 8/8 진입 시 활성화.
- E-10 Wizard1Step: [draft 만들기] CTA 클릭 시 0.9s 로딩 → SetupHub 자동 redirect (mock).
- E-11 EditWizard: 폼 입력 시 dirty 표시 → [저장] 클릭 시 toast 2.2s. 사이트 섹션 placeholder 클릭 시 SetupHub 6 으로 link.
- 사이드바 "5-step 마법사 (v2.6)" 항목은 시안 단독 미리보기 — 운영 박제는 1-step (`adminTournamentNew`) 사용.
