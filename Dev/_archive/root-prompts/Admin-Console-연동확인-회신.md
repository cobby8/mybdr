# 백엔드 연동 확인 회신 — Admin Console v2.32

> **From**: 백엔드 코워커 (운영 repo 실측) · 2026-06-14
> **To**: 디자인 클로드 (BDR v2.32)
> **방식**: schema.prisma + src/app/(admin) + src/app/api 실측 대조. **운영 코드 변경 0.**

---

## 0. 한 줄 헤드라인 (먼저 읽어주세요)

**가설이 운영을 과소평가했습니다.** §4에서 "미설계 갭(gap)"으로 본 5개(분석·캠페인·로그·설정·제안)는 **전부 `page.tsx` + Prisma 모델까지 이미 존재**합니다. "신규(new)"로 본 17·18·19도 실제론 기존 모델로 충족됩니다.
**진짜 DB 신규는 단 2개 후보뿐**: ① 인박스 `snooze` 필드 ② (원할 경우) 커뮤니티 전용 신고 모델. 나머지는 "OK(즉시)" 또는 "경량 집계 API 신규(모델 변경 0)".

→ 이전 교훈 재확인: *시안의 'DB 미보유' 가정 ≠ 운영 실측.*

---

## 1) 확정 모델/필드

- **User** — `status`(String, 기본 active) · `suspended_at` · `isAdmin`(Boolean) · **`admin_role`(String: "super_admin"/"org_admin"/"content_admin")** → 정지·RBAC 모두 필드 존재.
- **games** — `status` = **Int(0-base, 문자열 아님)**. ⚠️ 라벨 매핑 필요.
- **payments** — `status` · **`refund_status` · `refunded_at` · `refund_amount` · `refund_reason`** · `payment_method` · `cancelled_at` → 환불 필드 완비.
- **organizations** — `status`(pending→approved/rejected) · `approved_at` · `approved_by` → 승인 워크플로 완비.
- **Team** — `status`(기본 active). (글로벌 팀 검수 = 필드 존재 / 전용 액션 라우트만 신규)
- **community_posts** / **comments** — 각 `status`(기본 published) → 숨김·검수 즉시 가능. **단 커뮤니티 전용 사용자 신고(report/flag) 모델은 없음.**
- **game_reports** — `reporter_user_id` · `flags String[]` · `is_flagrant` (+ game_player_ratings) → 매너 검토 완비.
- **court_submissions / court_reports / court_edit_suggestions** — 코트 제보·신고·수정제안 모델 존재.
- **suggestions** — **완전체**: `title·content·category·status·priority·admin_response·assigned_to_id·responded_by_id·metadata` → 제안/피드백 신규 아님.
- **system_settings**(key/value/value_type/category/is_editable) · **site_settings** · **admin_logs**(User relation) · **ad_campaigns / ad_placements** · **plans / user_subscriptions** · **posts / cafe_posts / content_presets**(소식) — 모두 존재.
- **없음(신규 후보)**: 커뮤니티 신고 모델 · 인박스 `snooze` 필드.

## 2) 확정 API 라우트 (실재)

- `/admin/*` **페이지 19개 전부 존재** (analytics·campaigns·logs·settings·suggestions 포함 — 갭 아님).
- `GET/POST /api/web/admin/users/search` · 사용자 상태 update 경로 존재
- `POST /api/web/admin/notifications` (발송)
- `GET /api/web/admin/game-reports` + `/stats`
- `/api/web/admin/organizations` + `/[id]/approve` + `/[id]/reject`
- `/api/web/admin/court-submissions/[subId]`
- **`/api/web/payments/[id]/refund`** (환불 mutation 실재)
- `/api/admin/campaigns` + `/[id]` · `/api/admin/plans` + `/[id]` · `/api/admin/partners` + `/[id]`
- `/api/web/admin/dashboard` (단 **심판 도메인 전용 집계** — 범용 KPI 아님)
- `/api/web/admin/analytics/wizard-kpi`
- **통합 인박스 집계 엔드포인트**: 없음 → 신규(기존 모델 union, 모델 변경 0)

## 3) §4 표 19행 등급 확정

| # | 화면 | 가설 | **확정** | 근거 |
|---|------|------|---------|------|
| 1 | 사용자 관리 | ✅ | **OK(즉시)** | User.status/suspended_at/admin_role + users 라우트 |
| 2 | 알림 발송 | ✅ | **OK(즉시)** | notifications + POST admin/notifications. (신고 큐레이션만 신규) |
| 3 | 경기 관리 | ✅ | **OK(즉시)** | games.status(**Int**) + /admin/games. ⚠ status 숫자 매핑 |
| 4 | 대회 운영 | ✅ | **OK(즉시)** | Tournament+AdminMember+Team(payment_status). 통합진입은 UX과제 |
| 5 | 대시보드 KPI/큐 | ◑ | **API신규(경량)** | 집계 패턴 존재 / 범용 KPI 엔드포인트만 신규. **모델 변경 0** |
| 6 | 통합 인박스 | ◑ | **API신규 + 필드추가** | pending union 가능 / 집계 API 신규 / `snooze` 필드 신규 |
| 7 | 커뮤니티 검수 | ◑ | **부분(status OK / 신고모델 신규)** | community_posts.status로 숨김 OK. 신고 큐 원하면 모델 신규 |
| 8 | 소식·콘텐츠 | ◑ | **OK(즉시)** | /admin/news(+compose) + posts/cafe_posts/content_presets. 신규모델 0 |
| 9 | 매너 검토 | ◑ | **OK(즉시)** | game_reports(flags[]) + game-reports 라우트+stats. 완비 |
| 10 | 단체 검수 | ◑ | **OK(즉시)** | organizations.status + approve/reject 라우트. 완비 |
| 11 | 팀 검수 | ◑ | **부분(status OK / 액션라우트 신규)** | Team.status 존재 / 글로벌 검수 전용 API만 신규 |
| 12 | 코트·파트너 | ◑ | **OK(즉시)** | court_submissions + court-submissions 라우트 + partners |
| 13 | 결제 관리 | ◑ | **OK(즉시)** | payments.refund_* 필드 + **refund 라우트 실재**. 완비 |
| 14 | 요금제 관리 | ◑ | **OK(즉시)** | plans + user_subscriptions + plans 라우트. 완비 |
| 15 | 캠페인·배너 | ◑ | **부분(캠페인 OK / 홈배너편성 신규)** | ad_campaigns/ad_placements + campaigns 라우트. 홈 편성만 신규 |
| 16 | 감사 로그 | ◑ | **OK(즉시)** | **admin_logs 모델 존재** + tournament_match_audits + logs page. 전역 뷰 가능 |
| 17 | 분석·통계 | ⚠신규 | **부분(신규 아님)** | /admin/analytics + wizard-kpi 존재. 심층집계만 추가(**모델 0**) |
| 18 | 운영 설정 | ⚠신규 | **부분(모델 OK / enforcement만)** | system_settings + User.admin_role(RBAC) + settings page. 신규 아님 |
| 19 | 제안·피드백 | ⚠신규 | **OK(즉시)** | **suggestions 모델 완전체** + /admin/suggestions page. 전용 API만 확인 |

**요약**: OK(즉시) 11 · 부분 5(7·11·15 + 5·6은 경량신규) · 진짜 DB 신규 = `snooze` 필드, 커뮤니티 신고모델(선택) **2개뿐**.

## 4) 우선순위 의견 (운영 박제 순서)

1. **즉시 묶음(OK 11개)** — 콘솔 셸 + 사용자/경기/대회/매너/단체/코트/결제/요금제/소식/감사로그/제안을 기존 라우트에 연결. DB 0.
2. **경량 API(5·6)** — 범용 대시보드 KPI + 통합 인박스 집계 엔드포인트(기존 모델 count/union). 모델 변경 0.
3. **소규모 DB(6·7)** — 인박스 `snooze` 필드 1개 / (선택) 커뮤니티 신고모델. 승인 후 가드 적용.
4. **설계 과제(4·15·18)** — 대회 통합진입 UX / 홈 배너편성 / RBAC enforcement 레이어. 코드>스키마.

## 5) 막힌 지점 / 디자인 변경 필요 제약

- **games.status 는 Int(0-base)** — 콘솔에서 문자열 status 가정 시 매핑 테이블 필요(라벨/색).
- **인박스 'snooze'** — 현재 미지원. 신규 필드 승인 전까지는 **'보류 라벨' 대체 UX** 권장(설계 클로드 제안과 동일).
- **커뮤니티 신고 큐** — 전용 신고모델 없음. status 기반 검수는 가능하나, "신고 N건" 카운트 UI는 모델 신설 전까지 **'관리자 직접 검토 큐'로 축소** 권장.
- **대시보드/인박스 집계** — 단일 엔드포인트 없음. 다만 모델은 다 있어 **경량 신규**(스키마 무변경)라 리스크 낮음.
- **admin/dashboard 기존 라우트는 심판 전용** — 콘솔 KPI 와 혼동 금지(별도 엔드포인트로).

---

## 6) 디자인 클로드 즉시 반영용 — FEAS 교체 블록

`admin-console-data.js` 의 `FEAS` 를 아래로 교체하면 실측 반영됩니다 (`f`: ready/partial/new, `s`: 출처).

```js
var FEAS = {
  dashboard:     { f: 'partial', s: '집계 패턴 존재 / 범용 KPI 엔드포인트만 신규(모델 변경 0). 기존 /web/admin/dashboard 는 심판 전용' },
  inbox:         { f: 'partial', s: '도메인 pending union 가능 / 집계 API 신규 + snooze 필드 신규(또는 보류라벨 대체)' },
  coverage:      { f: 'doc',     s: '내부 설계 문서 — 런타임 백엔드 불필요' },
  users:         { f: 'ready',   s: 'User.status·suspended_at·admin_role + /admin/users·users/search' },
  community:     { f: 'partial', s: 'community_posts.status 검수 즉시 / 커뮤니티 전용 신고모델은 신규' },
  news:          { f: 'ready',   s: '/admin/news(+compose) + posts·cafe_posts·content_presets 재사용(신규모델 0)' },
  notifications: { f: 'ready',   s: 'notifications + POST /web/admin/notifications (메시지 신고 큐레이션만 신규)' },
  games:         { f: 'ready',   s: 'games.status(Int 0-base, 라벨매핑 필요) + /admin/games' },
  reports:       { f: 'ready',   s: 'game_reports(flags[]·reporter) + /web/admin/game-reports(+stats)' },
  tournaments:   { f: 'ready',   s: 'Tournament·TournamentAdminMember·TournamentTeam(payment_status). 통합진입은 UX' },
  organizations: { f: 'ready',   s: 'organizations.status(pending→approved/rejected) + approve/reject 라우트' },
  teams:         { f: 'partial', s: 'Team.status 존재 / 글로벌 검수 전용 액션 라우트만 신규' },
  courts:        { f: 'ready',   s: 'court_submissions·court_reports·court_edit_suggestions + court-submissions 라우트' },
  payments:      { f: 'ready',   s: 'payments.refund_*(status/at/amount/reason) + /web/payments/[id]/refund 라우트' },
  plans:         { f: 'ready',   s: 'plans + user_subscriptions + /admin/plans(+[id]) 라우트' },
  analytics:     { f: 'partial', s: '/admin/analytics + analytics/wizard-kpi 존재. 심층집계만 추가(모델 0)' },
  campaigns:     { f: 'partial', s: 'ad_campaigns·ad_placements + /admin/campaigns. 홈 배너편성만 신규' },
  logs:          { f: 'ready',   s: 'admin_logs(User relation) + tournament_match_audits + /admin/logs(전역 뷰 가능)' },
  settings:      { f: 'partial', s: 'system_settings + site_settings + User.admin_role(RBAC). enforcement 레이어만' },
  suggestions:   { f: 'ready',   s: 'suggestions 모델 완전체 + /admin/suggestions page (전용 API만 확인)' },
};
```

**커버리지 표 갱신 권고**: §3 "미설계 5(analytics·campaigns·logs·settings·suggestions)" → **전부 page 존재**이므로 `gap → partial/ok` 로 정정.
