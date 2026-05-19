# BDR v2.13 — Admin-B/C/D 통합 의뢰 1차 (6 페이지)

## 작업 요약

v2.12 → v2.13. **Admin-B/C/D/E 통합 의뢰서 (28 페이지) 의 분할 1차 박제 — 6 페이지**

분할 합의 (의뢰서 §11 fallback 적용):
- **v2.13 (이번)** = B 신규 3 + C 신규 1 + D 갱신/신규 2 = **6 페이지**
- v2.14 (다음) = E 핵심 5 (운영 5/14 commit 6건 반영 필수)
- v2.15 (그 다음) = E 나머지 17

## 신규/재박제 페이지 (6건)

### 영역 B · 콘텐츠 (신규 3)

| route | 패턴 | 핵심 |
|---|---|---|
| `adminTournamentDetail` | 좌 정보+KPI 카드 + 우 액션 카드 + **5 sub-tab** (개요/참가팀/매치/종별/감사로그) | 운영자/공개 토글/위험 액션 카드 + 4 상태군 (error/loading 분기 포함) |
| `adminTournamentAuditLog` | DataTable + status 탭 (전체/INFO/WARN/ERROR) | `resource_type=Tournament` 필터 배너 + changes_made JSON pre-formatted |
| `adminTournamentTransferOrganizer` | 2 컬럼: 좌 폼 (현재 운영자 → 새 운영자 검색 → 사유 → 더블 confirm) / 우 위험 안내 + 진행 단계 | 4 단계 step indicator + 대회 이름 입력 confirm + 빨강 borderLeft 위험 영역 |

### 영역 C · 외부관리 (신규 1)

| route | 패턴 | 핵심 |
|---|---|---|
| `adminOrganizations` | DataTable + status 탭 (대기 default / 승인 / 거절 / 전체) | 행 인라인 액션 [승인][거절] + 거절 사유 모달 (최소 10자) + OrgDetailPanel |

### 영역 D · 시스템 + me

| route | 패턴 | 핵심 |
|---|---|---|
| `adminMe` **재박제** | 12-grid 7 카드 구조 (운영 그대로) | 1.로그인정보 (비번/2FA/세션 흡수) / 2.본인인증 (mock·portone·null) / 3.미확인 알림 / 4.배정 건의사항 / 5.권한 매트릭스 7종 / 6.관리 토너먼트 (live/apply/done) / 7.최근 활동 (활동 통계 흡수) |
| `adminNotifications` 신규 | 좌 60% 발송 폼 / 우 40% 미리보기 + 발송 이력 | 발송 대상 4종 (전체/일반/관리자/팀장) · 위험 confirm 모달 (전체/일반 시) · 발송 후 toast |

## 변경 파일 요약

```
신규 (5)
├── screens/AdminTournamentDetail.jsx              (~24kb · 5 sub-tab + 4 상태군)
├── screens/AdminTournamentAuditLog.jsx            (~16kb · DataTable + JSON meta)
├── screens/AdminTournamentTransferOrganizer.jsx   (~16kb · 2 컬럼 폼 + step indicator)
├── screens/AdminOrganizations.jsx                 (~21kb · DataTable + reject 모달)
├── screens/AdminNotifications.jsx                 (~19kb · 발송 폼 + 위험 confirm + toast)

재박제 (1)
├── screens/AdminMe.jsx                            (~24kb · 12-grid 7 카드 — v2.11 5 카드 → 7 카드)

변경 (3)
├── components-admin.jsx                           (ADMIN_NAV — sys 그룹 adminNotifications 추가 + external 그룹 adminOrganizations 추가)
├── MyBDR.html                                     (+ 5 script src + 5 route 분기 + 5 isAdmin 분기)
└── screens/AdminComingSoon.jsx                    (ADMIN_LIVE_ROUTES Set 14 → 23, COMING_SOON_LABELS 5건 추가)

README.md ← this
```

## ADMIN_NAV 최종 (v2.13)

| 그룹 | 항목 수 | v2.13 추가 |
|---|---|---|
| 단독 | 1 (대시보드) | — |
| 콘텐츠 | 5 + 2 children = 7 | — (B-2/3/4 는 link-only route, sidebar 없음) |
| 사용자 | 3 | — |
| 비즈니스 | 4 | — |
| 시스템 | 3 + **1 신규** = 4 | **adminNotifications** (분석 ↔ 시스템 설정 사이) |
| 외부 관리 | 2 + **1 신규** = 3 | **adminOrganizations** (첫 항목) |
| **총 sidebar 항목** | **22** (이전 19 + 신규 3) | |

B-2/3/4 (TournamentDetail / AuditLog / TransferOrganizer) 는 sidebar 가 아닌 **AdminTournaments row 클릭 → 진입** 패턴 (route 만 등록, ADMIN_NAV 미노출).

## 자체 검수 (uploads/06-self-checklist.md)

### 영역 B (신규 3)
- [x] AdminTournamentDetail — 5 sub-tab (개요/참가팀/매치/종별/감사로그) ✅
- [x] AdminTournamentAuditLog — admin_logs 필터링 + AdminEmptyState ✅
- [x] AdminTournamentTransferOrganizer — 검색 + 사유 + 더블 confirm + 위험 안내 ✅
- [x] 4 상태군 (filled/empty/error/loading) 박제 ✅

### 영역 C (신규 1)
- [x] AdminOrganizations — pending(default)/approved/rejected/all 탭 + 거절 사유 모달 ✅
- [x] ADMIN_NAV `external` 그룹 첫 항목 `adminOrganizations` icon `domain` ✅

### 영역 D (갱신 1 + 신규 1)
- [x] AdminMe **대대적 재박제** — 운영 7 카드 구조 (1.로그인정보 / 2.본인인증 / 3.알림 / 4.건의 / 5.권한매트릭스 / 6.관리토너먼트 / 7.최근활동) ✅
- [x] v2.11 의 활동 통계 → 카드 7 흡수 / 빠른 액션·세션 → 카드 1 흡수 (q2 가정 적용) ✅
- [x] AdminNotifications — 발송 폼 + 미리보기 + 이력 + 위험 confirm 모달 ✅
- [x] ADMIN_NAV `sys` 그룹 분석 ↔ 설정 사이 `adminNotifications` icon `notifications_active` ✅

### 공통
- [x] AppNav frozen 변경 0 (admin 자체 셸)
- [x] 13 룰 — 토큰만 (`var(--accent)`, `var(--err)`, `var(--ok)`, `var(--overlay)` 등) / Material Symbols / 4~6px 라운딩 / 모바일 1024 분기 유지
- [x] snake_case mock data (tournament_id / log_id / user_id / org_id 등)
- [x] AdminShell / Sidebar / MobileNav / PageHeader / StatusTabs / DataTable / DetailModal = v2.7.1 그대로 (재사용)
- [x] MyBDR.html — 5 신규 route + isAdmin 분기 정상 등록
- [x] ADMIN_LIVE_ROUTES Set 14 → 23 (안전망)

## 다음 단계 후보 (v2.14)

**영역 E 핵심 5 페이지 (운영 5/14 commit 6건 반영 필수)**:
- `adminTournamentAdminHome` (E-1)
- `adminTournamentAdminList` (E-2)
- **`adminTournamentSetupHub`** (E-3 · UI-1 + UI-5 commit) — 8 체크리스트 hub + 진행도 + 공개 가드
- **`adminTournamentWizard1Step`** (E-10 · UI-1.1~1.5 + UI-2 commit) — 1-step 압축 + 즉시 draft
- **`adminTournamentEditWizard`** (E-11 · UI-3+4 commit) — bracketSettings + 사이트 영역 제거

신규 컴포넌트 도입 후보 (v2.14): AdminProgressBar / AdminChecklistCard / AdminInlineForm

## 메모

- AdminTournamentDetail 의 mock 데이터는 BDR 서머 오픈 #4 (tn_2026_summer_4) 단일 대회. 실제 운영 시 [id] 기반 동적 로드.
- AdminTournamentTransferOrganizer 의 "이전 실행" 버튼은 mock — toast 만 표시 / 실제 처리 없음.
- AdminOrganizations 의 승인/거절 버튼은 mock — UI 변화 없이 confirm 만 표시.
- AdminMe 의 portone 인증 상태는 mock = 'portone' (완료 상태). MOCK 셀렉터로 다른 상태 토글은 미구현 (운영 7 카드 구조 박제가 우선).
- AdminNotifications 발송은 mock — 위험 confirm 모달까지 동작, 발송 후 toast.
