# BDR v2.15 — Admin-E 보조 7 페이지 박제

## 작업 요약

v2.14 → v2.15. **Admin-B/C/D/E 통합 의뢰서 분할 3차 — 영역 E 보조 7 페이지 박제.**

분할 진행도:
- v2.13 ✅ = B 신규 3 + C 신규 1 + D 갱신/신규 2 = 6 페이지
- v2.14 ✅ = E 핵심 5 페이지 + 컴포넌트 3 (운영 5/14 commit 6건 반영)
- **v2.15 ✅ (이번)** = E 보조 7 페이지 (Teams / Admins / Recorders / Site / Bracket / Matches / Divisions)
- v2.16 (다음) = Series 5 + Templates 1
- v2.17 (다음) = Org 4

## 신규 페이지 (7건)

| route | 패턴 | 차별화 |
|---|---|---|
| `adminTournamentTeams` (E-4) | DataTable + 5 상태탭 + bulk 승인/거절 | 다중 선택 + bulk action bar |
| `adminTournamentAdmins` (E-5) | 카드 grid + inline 초대 폼 + 역할 안내 사이드 | 역할 3 (owner/co_admin/leader) 가시화 |
| `adminTournamentRecorders` (E-6) | 2열 — 좌 기록원 list / 우 미배정 경기 + 배정 | 평점·인증 뱃지 + drag-assign mock |
| `adminTournamentSite` (E-7) | 2열 — 좌 폼 4섹션 / 우 sticky 미리보기 | 컬러·히어로 실시간 반영 (브라우저 chrome 미니어처) |
| `adminTournamentBracket` (E-8) | 종별 selector + 그룹 4 + 결선 토너먼트 viewer | 재생성 확인 modal + 락 상태 + PDF 내보내기 |
| `adminTournamentMatches` (E-9) | 일자별 그룹화 timeline + LIVE pulse | DataTable 대신 카드형 row + 종별 pill |
| `adminTournamentDivisions` (E-12) | 카드형 row + inline 추가/수정 폼 | 5-칼럼 grid + 참가비/팀수 bar + 삭제 가드 |

각 페이지 모두:
- AdminShell + topbarRight (MOCK selector) + breadcrumbs 4단 + actions 2개
- `filled` / `empty` mock state (일부 `loading` / `error`)
- snake_case mock (tournament_id / division_id / match_id / recorder_id 등)
- Material Symbols Outlined 아이콘만
- 4~6px 라운딩, 토큰 색상만

## SetupHub deep link 갱신 (E-3)

`AdminTournamentSetupHub.jsx` 두 곳 갱신:

### 8 체크리스트 카드 클릭 핸들러
| # | 항목 | v2.14 | **v2.15** |
|---|---|---|---|
| 1 | 기본 정보 | EditWizard | EditWizard |
| 2 | 시리즈 연결 | (no-op) | EditWizard |
| 3 | **종별 정의** | (no-op) | **Divisions** ← 신규 |
| 4 | 운영 방식 | (no-op) | EditWizard |
| 5 | 신청 정책 | EditWizard | EditWizard |
| 6 | **사이트 설정** | TournamentDetail(임시) | **Site** ← 신규 |
| 7 | 기록 설정 | (no-op) | EditWizard |
| 8 | **대진표 생성** | (no-op) | **Bracket** ← 신규 |

### 보조 액션 4 (하단 우 카드)
| 라벨 | v2.14 | **v2.15** |
|---|---|---|
| 참가팀 | (no-op) | **Teams** ← 신규 |
| 관리자 | (no-op) | **Admins** ← 신규 |
| 기록원 | (no-op) | **Recorders** ← 신규 |
| ~~공개 사이트~~ | (no-op) | **경기** (Matches) ← 신규 (공개 사이트는 6. 사이트 설정 hub 항목으로 통합) |

## 변경 파일 요약

```
신규 (7)
├── screens/AdminTournamentTeams.jsx                    (~13kb · DataTable + bulk + 상태탭 5)
├── screens/AdminTournamentAdmins.jsx                   (~12kb · 카드 grid + 초대 inline + 역할 안내)
├── screens/AdminTournamentRecorders.jsx                (~14kb · 2열 list/배정)
├── screens/AdminTournamentSite.jsx                     (~15kb · 4 섹션 form + sticky 미리보기)
├── screens/AdminTournamentBracket.jsx                  (~14kb · 종별 + 그룹 + 결선 + 재생성 modal)
├── screens/AdminTournamentMatches.jsx                  (~13kb · 일자별 timeline + LIVE pulse)
└── screens/AdminTournamentDivisions.jsx                (~14kb · 카드 row + inline form)

변경 (3)
├── MyBDR.html                                          (+ 7 script src + 7 route + 7 isAdmin)
├── screens/AdminTournamentSetupHub.jsx                 (8 항목 deep link 4건 + 보조 액션 4건 갱신)
└── screens/AdminComingSoon.jsx                         (ADMIN_LIVE_ROUTES Set 28 → 35)

README.md ← this
```

## 자체 검수 (uploads/06-self-checklist.md)

- [x] **E-4 Teams** — DataTable + 5 상태탭 (전체/대기/승인/거절/취소) + bulk 승인/거절 + 다중 선택 ✅
- [x] **E-5 Admins** — 카드 grid + 초대 inline (email+role) + 역할 3 안내 사이드 ✅
- [x] **E-6 Recorders** — 2열 (기록원 list / 미배정 경기) + 평점·인증 + 배정 mock ✅
- [x] **E-7 Site** — 4섹션 폼 + sticky 미리보기 (실시간 반영) + 공개 토글 + dirty 저장 가드 ✅
- [x] **E-8 Bracket** — 종별 selector + 그룹 4 + 결선 토너먼트 + 재생성 confirm modal + 락 상태 ✅
- [x] **E-9 Matches** — 일자별 timeline + LIVE pulse + 종별 pill + 기록원 미배정 경고 ✅
- [x] **E-12 Divisions** — 카드형 row + inline 추가/수정 폼 + 참가비/팀수 bar + 삭제 가드 (팀>0) ✅
- [x] SetupHub deep link 갱신 — 8 항목 / 보조 액션 4 모두 박제 페이지로 jump ✅
- [x] AppNav frozen 변경 0 (admin 자체 셸)
- [x] 13 룰 — 토큰만 (var(--accent), var(--ok), var(--err), var(--bg-card) 등) / Material Symbols / 4~6px 라운딩 ✅
- [x] snake_case mock 일관 ✅
- [x] AdminShell + v2.14 박제 컴포넌트 (DataTable / StatusTabs / FilterBar / EmptyState / StatCard) 재사용 ✅
- [x] ADMIN_LIVE_ROUTES Set 28 → 35

## 다음 단계 (v2.16+)

- **v2.16** = Series 5 + Templates 1 (Wizard1Step 의 시리즈 inline 과 연계)
  - SeriesList / SeriesDetail / SeriesNew / SeriesEdit / SeriesAddEdition
  - TournamentTemplate
- **v2.17** = Org 4 (단체 관리)
  - OrgList / OrgDetail / OrgMembers / OrgNew

## 메모

- 모든 7 페이지 → SetupHub 으로 돌아가는 breadcrumbs 4단 (`ADMIN · 대회 운영자 도구 · [대회명] · [페이지명]`).
- SetupHub 에서 deep link 클릭 시 각 페이지로 jump, 페이지에서 [대회명] 클릭 시 SetupHub 복귀.
- Site 페이지 미리보기는 **컬러 / 히어로 / 제목 / 태그라인 / 푸터** 변경 시 실시간 반영 (React state).
- Bracket 재생성은 confirm modal — 기존 입력 결과 초기화 경고.
- Matches LIVE 행은 `var(--accent)` 테두리 + pulse 애니메이션.
- Divisions 삭제는 `team_count > 0` 시 거부 (mock toast).
- 사이드바 `ADMIN_NAV` 변경 없음 — 보조 페이지는 SetupHub 진입 흐름이 표준 (sidebar 노출 X).
