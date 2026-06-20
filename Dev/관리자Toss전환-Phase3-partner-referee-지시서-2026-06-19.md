# 관리자 Toss 전환 — Phase 3 추가 지시서 (partner-admin + referee)

> 2026-06-19 · 시안 v2.39 업데이트(zip31)로 **Phase 3 보류 해제**. 본 문서는 메인 지시서(`관리자Toss전환-CLI작업지시서-2026-06-19.md`)의 **Phase 3 상세 보강** — 메인 지시서 §0 디자인 분기·트랙 A 규칙·§2 디자인시스템·§7 가드 전부 그대로 적용.
> 시안: `Dev/design/BDR-current/_handoff-admin-toss-P0/design-files/` 신규 — `PartnerReferee.html`(진입점) · `pr-screens.jsx`(화면) · `pr-data.jsx`(mock).

---

## 1. 성격 = 트랙 A 리스킨 (기능 1:1 유지, 비주얼만 Toss)
partner-admin·referee는 **자체 셸**(PartnerShell·RefereeShell) 골격 유지 + Toss 토큰·키트로 **재스킨만**. 기능·컬럼·필터·액션·문구·라우트 **변경 금지**. 디자인시스템(toss.css/toss-kit/toss-admin)은 Phase 0 이식분 재사용. lucide=lucide-react(CDN 주입 금지).

---

## 2. ⚠️ 시안 = 대표 화면, 적용 = 전체 라우트
시안은 **대표 6화면만** 디자인(파트너 3 + 심판 3). CLI는 이 6개를 **패턴 레퍼런스**로 삼아 **partner-admin 전체(4) + referee 전체(26)** 를 동일 키트로 리스킨한다. 시안에 없는 화면도 같은 규칙(테이블=.ts-table, KPI=StatCard, 상태=.ts-badge tone, 헤더=eyebrow+title+sub+actions).

### 시안 6화면 → 패턴
- **PartnerHome**(대시보드): KPI 4(예약/정산/평점/캠페인) + 오늘 예약 + "코트 추가".
- **PartnerVenue**(코트): 테이블(코트/유형/요금/시간/상태 active·maintenance·closed) + "코트 추가".
- **PartnerCampaigns**(캠페인): 테이블(캠페인/기간/노출/예약/상태 active·ended·scheduled).
- **RefHome**(대시보드): KPI 4(배정/완료/정산/평점) + 다가오는 배정 + "배정 보기".
- **RefAssignments**(배정): 테이블(경기/대회/코트/일시/역할/상태) + 행 액션 [수락][거절](pending만), confirmed·pending·declined.
- **RefSettlements**(정산): 테이블(정산월/경기수/금액/상태 pending·paid).

---

## 3. 실제 라우트 매핑 (신규 생성 금지 — 기존 리스킨)

### partner-admin (4) — `(web)/partner-admin/*`
- `/partner-admin`(대시보드 ← PartnerHome) · `/partner-admin/venue`(코트 ← PartnerVenue) · `/partner-admin/campaigns`(캠페인 ← PartnerCampaigns) · `/partner-admin/campaigns/[id]`(캠페인 상세 — 시안 없음, 동일 키트로).

### referee (26) — `(referee)/referee/*`
- **회원용**: `/referee`(home ← RefHome 패턴) · `/referee/assignments`(← RefAssignments) · `/referee/settlements`(← RefSettlements) · `/referee/applications` · `/referee/certificates`(+`/[id]`) · `/referee/documents` · `/referee/notifications` · `/referee/profile`(+`/edit`).
- **referee/admin (협회 운영)**: `/referee/admin`(대시보드) · `/referee/admin/assignments` · `/referee/admin/members`(+`/[id]`(+`/documents`)·`/new`) · `/referee/admin/settlements`(+`/dashboard`·`/new-batch`) · `/referee/admin/announcements`(+`/[id]`) · `/referee/admin/pools` · `/referee/admin/bulk-register` · `/referee/admin/bulk-verify` · `/referee/admin/fee-settings` · `/referee/admin/settings`.
→ 회원 화면은 RefHome/Assignments/Settlements 패턴, 운영(admin) 화면은 콘솔 키트(toss-admin: StatusTabs/FilterBar/DataTable/DetailModal/StatCard) 재사용.

---

## 4. 셸(사이드바/네비) 처리
- 시안 `PartnerReferee.html`은 **모드 스위치**로 파트너/심판 두 셸을 한 데모에서 전환(데모 편의) — 운영은 **각각 별도 셸 유지**(PartnerShell, RefereeShell, referee/admin 셸). 셸 메뉴 구성·라우팅 그대로, 비주얼만 Toss 사이드바(`.ts-sidebar`/`.ts-navlink`).
- referee는 회원/운영(admin) 2개 네비 컨텍스트 → 기존 구분 유지.

## 5. 데이터 — mock은 참고용, 실제 우선
`pr-data.jsx`(예약/정산/평점/배정/정산 등)는 시안 mock. 실제는 기존 partner-admin·referee route.ts/페이지 데이터·컬럼을 그대로. mock과 다르면 **실제 우선**(필드명·snake_case 확인). 신규 데이터·스키마 변경 없음 → **DB 게이트 불필요**(순수 리스킨).

## 6. 검증
- 6 대표 화면 + 전 라우트 Toss 적용(테이블/KPI/뱃지/버튼/사이드바). 라이트 전용·lucide·#3182F6.
- 기능 회귀 0: 기존 필터·정렬·액션(배정 수락/거절, 캠페인 관리, 정산 등)·문구·라우트 불변.
- 디자인 분기: partner/referee에 mybdr var토큰/Material/AppNav 0 / 사용자 프론트 무영향.

## 7. 가드 (메인 지시서 동일)
- subin 브랜치, 단계당 1 PR(partner / referee 회원 / referee admin 분리 가능). main 직접 push 금지. dev→main 수빈 수동.
- 순수 리스킨이라 schema·destructive 0. 응답 키 snake_case 유지.

---

## 부록 — CLI 착수 프롬프트
```
[작업] Phase 3 — partner-admin + referee Toss 재스킨(트랙 A 리스킨). 시안=BDR-current/_handoff-admin-toss-P0/design-files/(PartnerReferee.html·pr-screens·pr-data) + 메인 지시서 정독.
규칙: 자체 셸(Partner/Referee/referee-admin) 골격·기능·컬럼·문구·라우트 1:1 유지, 비주얼만 toss.css/toss-kit으로. lucide-react. 라이트·#3182F6.
범위: 시안 6화면=대표 패턴 → partner-admin 4 + referee 26 전 라우트 적용(신규 라우트 금지).
mock(pr-data)은 참고, 실제 기존 데이터 우선. schema 변경 없음(게이트 불필요).
검증: 기능 회귀 0 + 디자인 분기(프론트 무영향). subin, PR 분리(partner/referee회원/referee admin).
```
