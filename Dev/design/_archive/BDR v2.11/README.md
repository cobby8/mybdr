# BDR v2.11 — Phase D · 시스템 + me 그룹 박제 (4 페이지) — **Admin 전체 박제 완료**

## 작업 요약

v2.10 → v2.11. Admin Phase D (시스템 + me) 4 페이지 신규 박제.
- Phase A (Shell/Dashboard/Wizard) + B (콘텐츠 6) + C (사용자+비즈니스 8) + **D (시스템+me 4) = 총 18 admin 라우트 박제 완료**
- AdminComingSoon placeholder 페이지는 더 이상 어떤 라우트에서도 노출되지 않음 (안전망으로만 유지)
- AppNav frozen / 일반 사용자 페이지 / Phase B·C 변경 0 보존

## 신규 페이지 (4건)

| route | 패턴 | 핵심 구성 |
|---|---|---|
| `adminAnalytics` | **KPI 대시보드** (DataTable X) | 상단 KPI 4 (MAU·매출·신규가입·전환률) + 기간 segmented (7d/30d/90d) · SVG 라인 차트 (DAU 7d) + 채널 분포 (CSS bar) + 상위 5 페이지 + 전환 깔때기 4단계 |
| `adminSettings` | **섹션 폼** (DataTable X) | 4 섹션 카드 — 기본정보 / 운영정책 / 알림 / 점검모드(위험) · sticky 저장 바 (dirty/저장됨 상태) · 점검모드 ON 시 상단 빨강 배너 · 우측 ToC nav |
| `adminLogs` | **DataTable** (재사용) | 상태탭: 전체/INFO/WARN/ERROR/CRIT · 컬럼: 시간 · 레벨(MONO) · 출처 · 주체(👤/💾 icon) · 액션(코드) · 메시지 · DetailModal 에 JSON meta pre-formatted |
| `adminMe` | **마이페이지** (DataTable X) | 좌: 프로필+권한 배지+2FA + 계정정보 + 빠른 액션 / 우: 통계 4 타일 + 7일 활동 막대 + 최근 활동 5건 + 활성 세션 목록 (현재 표시 + 종료 버튼) |

## 변경 파일

```
신규 (5)
├── screens/AdminAnalytics.jsx           (~15kb · SVG 라인 + CSS bar + 깔때기)
├── screens/AdminSettings.jsx            (~15kb · 4 섹션 + sticky 바)
├── screens/AdminLogs.jsx                (~17kb · DataTable + JSON meta)
├── screens/AdminMe.jsx                  (~15kb · 2 컬럼 + 7일 막대)
└── README.md                            (this)

변경 (2)
├── MyBDR.html                           (+ 4 script src · + 4 route · isAdmin +4)
└── screens/AdminComingSoon.jsx          (ADMIN_LIVE_ROUTES Set: 14 → 18, 전체 admin 박제 완료)
```

## 자체 검수 (uploads/06-self-checklist.md)

- [x] AppNav frozen 변경 0 (admin 페이지는 AppNav 미노출)
- [x] 13 룰 준수
  - **#10 토큰만** — `var(--accent)`, `var(--err)`, `var(--ok)`, `var(--bg-card)`, `var(--bg-alt)`, `var(--ink-mute)`, `var(--ink-soft)`, `var(--ink-dim)`, `var(--border)`, `var(--cafe-blue, #1B3C87)` 등. 신규 하드코딩 hex 0 (라인 차트 SVG fill/stroke 도 모두 var 사용).
  - **#11 Material Symbols** — group, payments, person_add, conversion_path, trending_up/down, file_download, badge, policy, notifications, construction, warning, check_circle, save, list_alt, content_copy, memory, person, today, date_range, gavel, computer, phone_iphone, password, shield, add_moderator, logout, edit, verified_user 등.
  - **#12 4px 라운딩** — 모든 카드 borderRadius 4~6, 토글 11 (원형), 아바타 50 (원형). pill 0.
  - **#13 모바일** — admin 페이지는 데스크톱 전용 (`admin.css` 1024px 분기 유지). 신규 페이지도 동일.
- [x] 사용자 결정 §1~§8 보존
  - AppNav / utility bar / 다크모드 / main bar — 일반 사용자 화면에만 적용. admin shell 의 topbar 는 별도 컴포넌트로 분리되어 룰 적용 대상 아님.
- [x] sidebar nav (components-admin.jsx) 의 ADMIN_NAV 키와 매핑 일치 — components-admin.jsx 변경 0
- [x] AdminComingSoon Set 18 라우트 → COMING_SOON 페이지 미노출 (모든 sidebar 항목이 실제 페이지로 연결)
- [x] 회귀 방지 4 케이스 — admin shell 한정, AppNav 영향 없음

## Admin 박제 전체 완료 (Phase A + B + C + D)

| Phase | 그룹 | 라우트 수 | 비고 |
|---|---|---|---|
| **A** | Shell + Dashboard + Wizard | 4 | adminDashboard, adminWizardTournament, adminWizardAssociation, (Shell) |
| **B** | 콘텐츠 | 6 | adminTournaments, adminGames, adminTeams, adminCourts, adminCommunity, adminNews |
| **C** | 사용자 + 비즈니스 + 외부 | 8 | adminUsers, adminReports, adminSuggestions, adminPlans, adminPayments, adminCampaigns, adminPartners, partnerAdminEntry |
| **D** | 시스템 + me | 4 | adminAnalytics, adminSettings, adminLogs, adminMe |
| **합계** |  | **22** | (Phase A 의 wizard 2 + Dashboard 1 + Shell 포함) |

## 다음 단계 후보

Admin 영역 박제는 완료. 후속 후보:
- **일반 사용자 화면** 보강 / 모바일 audit / 신규 기능 시안
- 또는 Admin 영역 polish (반응형 / 권한별 분기 / 실 API 연동 준비)

## 메모

- mock 데이터는 모두 비실명/가공. KRW 금액·MAU·전환률 등은 mock.
- `adminSettings` 의 "저장" 은 mock — toast 2.2초 후 사라지고 실 저장 X.
- `adminMe` 의 "로그아웃" 클릭 시 `route='home'` 으로 이동 (실 로그아웃 X).
- 모든 admin 페이지 sidebar 의 link 가 이제 실제 페이지로 이어집니다.
