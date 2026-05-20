# BDR v2.10 — Phase C · 사용자 + 비즈니스 그룹 박제 (8 페이지)

## 작업 요약

v2.9 → v2.10. Admin Phase C (사용자 + 비즈니스 + 외부 관리) 8 페이지 신규 박제.
- 기존 AdminTournaments prototype (Phase B-1) 패턴 그대로 적용
- 신규 컴포넌트 0건 (v2.8 prototype 재사용)
- AppNav frozen / Wizard / 콘텐츠 그룹 (Phase B) 변경 0 보존

## 신규 페이지 (8건)

### 사용자 그룹 (3)
| route | 상태탭 | 핵심 컬럼 | 차별화 |
|---|---|---|---|
| `adminUsers` | 활성 / 신규 / 휴면 / 정지 | 닉네임(avatar) · 등급(VVIP~F) · 지역 · 경기수 · 신고 · 최근활동 · 가입 | 등급 배지 7단계 + 신고 누적 표시 |
| `adminReports` | 미처리 / 처리중 / 완료 / 반려 | 우선도(긴급/높음/보통/낮음) · 대상(유저/게시물/팀/코트) · 사유 · 신고자수 · 담당자 · 접수 | 우선도 정렬 + 신고자 5명 이상 빨강 |
| `adminSuggestions` | 접수 / 검토중 / 채택 / 반려 | 제안 제목+발췌 · 카테고리(기능/버그/운영) · 추천(👍👎) · 댓글수 · 작성자 | thumb_up/down 컬럼 + 점수 합산 |

### 비즈니스 그룹 (4)
| route | 상태탭 | 핵심 컬럼 | 차별화 |
|---|---|---|---|
| `adminPlans` | 운영중 / 예정 / 종료 | 플랜명(추천star) · 가격(KRW) · 가입자수 · 갱신률 · 기능수 · 시작 | 큰 가격 카드 + 예상 매출 계산 |
| `adminPayments` | 완료 / 대기 / 환불 / 실패 | 결제일시 · 유저 · 플랜 · 금액 · 결제수단(icon) · 승인번호 | 상단 매출 요약 3카드 + 환불 시 line-through |
| `adminCampaigns` | 진행중 / 예정 / 종료 / 초안 | 캠페인명 · 채널(icon) · 집행/예산(progress bar) · 클릭 · 전환률 · ROI 배수 · 기간 | 채널 4종 + ROI 배수 + 인라인 progress bar |
| `adminPartners` | 활성 / 심사중 / 정지 | 파트너명(icon-square) · 카테고리(코트/장비/스폰서/협회) · 등급(PLATINUM~BRONZE) · 누적매출 · 캠페인 · 계약만료 | 4 카테고리 + 4 등급 배지 |

### 외부 관리 (1) — landing 패턴
| route | 패턴 | 핵심 구성 |
|---|---|---|
| `partnerAdminEntry` | DataTable 없음. 2 컬럼 landing/gate | 좌: 헤더 + 제공기능 4종 + 신청절차 3step / 우: 로그인 폼 ↔ partner_member 상태 분기 + 운영진(super_admin) 만 보이는 심사 큐 미리보기 + 안내 박스 |

## 변경 파일

```
신규 (9)
├── screens/AdminUsers.jsx               (~20kb)
├── screens/AdminReports.jsx             (~21kb)
├── screens/AdminSuggestions.jsx         (~17kb)
├── screens/AdminPlans.jsx               (~17kb)
├── screens/AdminPayments.jsx            (~19kb)
├── screens/AdminCampaigns.jsx           (~20kb)
├── screens/AdminPartners.jsx            (~18kb)
├── screens/PartnerAdminEntry.jsx        (~14kb)
└── README.md                            (this)

변경 (2)
├── MyBDR.html                           (+ 9 script src · + 9 route · isAdmin +9)
└── screens/AdminComingSoon.jsx          (ADMIN_LIVE_ROUTES Set 확장: 6 → 14)
```

## 자체 검수 (uploads/06-self-checklist.md)

- [x] AppNav frozen 변경 0 (admin 페이지는 AppNav 미노출 — isAdmin 분기)
- [x] 13 룰 준수
  - #10 토큰만 사용 (`var(--accent)`, `var(--err)`, `var(--ok)`, `var(--bg-card)`, `var(--bg-alt)`, `var(--ink-mute)` 등). 하드코딩 hex 0.
  - #11 Material Symbols Outlined 만 사용 (group, report, lightbulb, payments, credit_card, campaign, handshake, storefront, search, photo_camera, chat, location_on, sports_basketball, local_drink, verified, checkroom, account_balance, account_balance_wallet 등).
  - #12 4px 라운딩 (모든 카드/버튼). pill 0건.
  - #13 모바일 — admin 페이지는 데스크톱 전용 (`admin.css` 1024px 분기). 신규 페이지도 동일.
- [x] 사용자 결정 §1~§8 보존
  - §3 utility bar / §4 다크모드 토글 / §5 main bar 우측 — admin shell 의 topbar 는 별도 (AppNav 와 분리), 본 룰은 일반 화면에만 적용
  - 신규 admin 라우트는 모두 sidebar nav 의 `adminUsers`/`adminReports`/... 와 동일 키 사용 — 변경 0
- [x] AdminShell + sidebar 의 ADMIN_NAV 키와 매핑 일치 (components-admin.jsx 변경 0)
- [x] AdminComingSoon → ADMIN_LIVE_ROUTES Set 으로 8 라우트 제외 → COMING_SOON 페이지 미노출
- [x] 회귀 방지 4 케이스 — 본 작업은 admin shell 에 한정되어 AppNav 영향 없음

## 다음 단계 후보

- **Phase D · 시스템 + me + 알림 (4 페이지)** — adminAnalytics / adminSettings / adminLogs / adminMe
- 잔여 COMING_SOON 라우트: `adminAnalytics`, `adminSettings`, `adminLogs`, `adminMe` (4건)
- 또는 어드민 외 작업으로 전환 (사용자 시나리오 / 모바일 audit 등)

## 메모

- mock 데이터는 모두 비실명/가공. KRW 금액·전환률·매출 등은 mock.
- `partnerAdminEntry` 의 ROLE 셀렉터로 `super_admin` ↔ `partner_member` ↔ `guest` 전환 시 우측 카드 분기 확인 가능.
- DetailModal 의 운영 액션 버튼은 mock — 클릭 시 실제 처리 없음 (UI 박제용).
