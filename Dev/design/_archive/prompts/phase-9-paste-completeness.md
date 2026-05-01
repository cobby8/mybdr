# Phase 9 UI 박제 완성도 감사 보고서

> **상태**: active
> **갱신 주기**: Phase 단위
> **상위 문서**: [README.md](./README.md)
> **함께 보는 문서**: [phase-9-audit.md](./phase-9-audit.md) (진입점 단절) · [phase-9-plan.md](./phase-9-plan.md) (계획)
> **작성일**: 2026-04-29
> **마지막 갱신**: 2026-04-29 (오늘 세션 변경 페이지 등급 갱신)
> **대상**: subin 브랜치

---

## 📌 2026-04-29 세션 변경 페이지 (등급 영향)

오늘 세션에서 모바일 폴리시 / 헤더 / 팀 / 단체 신청 등 다수 페이지가 갱신됨. 등급은 유지되나 모바일 충실도 향상.

| 라우트 | 변경 사항 | 커밋 | 등급 변화 |
|--------|---------|------|---------|
| `/` (홈) | Hero 카로셀 (3슬라이드 + fallback) | `79cc57e` | B → 유지 (모바일 향상) |
| `/teams`, `/teams/[id]` | 모바일 최적화 + 레이팅 제거 + Avatar overflow + 카드 세로 배치 | `61a170d` `87c59d4` | B → 유지 |
| `/organizations/[slug]/apply` | 단체 신청 폼 사일런트 실패 픽스 | `35e54b0` | A → 유지 |
| 글로벌 헤더 | 헤더 구조 정리 + 더보기 가짜 4건 제거 | `aa61063` | — |
| 모바일 (다수 페이지) | grid 안티패턴 8건 일괄 정리 + 가로 overflow 글로벌 가드 | `4afb4f9` `f972aaf` | — |
| 모바일 (다수 페이지) | board separator + input 16px + btn 44px + card min-h | `dc1e38a` | — |
| AppNav | 모바일 닉네임 표시 | `db69eea` | — |
| 더보기 패널 / GameCard | 모바일 + ellipsis | `e8171d7` | — |

> **모바일 박제 충실도** 전반적으로 향상. 등급(A/B/C/D) 변화는 없으나 시안 충실도 KPI 상향.

---

## KPI (등급별 카운트)

| 등급 | 정의 | 라우트 수 |
|------|------|---------|
| ✅ **A — 완벽 박제** | 시안 구조 + 핵심 인터랙션 + 시각 톤 일치 | 32 |
| 🟢 **B — 대체로 박제** | 시안 80%+ 반영. 주변 디테일 누락 | 14 |
| 🟡 **C — 부분 박제** | 시안 일부만. 핵심 섹션/탭/위젯 누락 OR 옛 UI 잔존 | 9 |
| 🔴 **D — 박제 안됨** | 박제 미진행. v2 이전 상태 | 11 |
| ⚫ **E — 시안 없음** | 시안에 대응 화면 없음 (admin/유틸 등) | 50 |
| ❌ **F — 라우트 누락** | 시안에는 있지만 Next.js 페이지 없음 | 1 |
| **총** | | **117** |

> 산출 근거
> - 페이지 116개 (`(web)/**/page.tsx` 카운트)
> - 시안 72개 + admin 라우트 47개
> - 시안 출처 명시 직접 매칭 페이지 20개 (`grep "Dev/design/BDR v2"` = 20)
> - `feat(design-v2)` 커밋 78건, `_components_v2/` 디렉토리 3개, `*-v2.tsx` 31개
> - F는 `Referee.jsx` 시안 (라우트 `/referee` 없음) 1건

---

## 🔴 D 등급 — 박제 안됨 (P0/P1 — 즉시 처리)

박제 작업이 안 된 v2 이전 상태 또는 시안과 동떨어진 페이지.

| 라우트 | 시안 파일 | 현재 상태 | 권장 액션 | 우선도 |
|--------|----------|---------|----------|-------|
| `/community/[id]/edit` | (PostWrite 응용) | 박제 흔적 0. `Card`/`Button` 기본 컴포넌트만 사용. 시안 없음 처리에 가까움 | PostWrite v2 폼 톤 반영 (with-aside + eyebrow + 카드 컨테이너) | P1 |
| `/games/[id]/edit` | (CreateGame 응용) | 박제 흔적 0. CreateGame v2 톤 미반영 | CreateGame v2 폼 패턴 차용 (3카드 분할) | P1 |
| `/games/new` | CreateGame.jsx | 별도 `NewGameForm` 컴포넌트 — Phase 2에 CreateGame 박제 커밋 있음. page.tsx 자체는 server wrapper로 v2 흔적 표면화 X | NewGameForm 내부 v2 시안 적용 여부 검수 → 안되어있으면 박제 (phase 2 CreateGame 커밋 확인) | P2 |
| `/teams/new` | CreateTeam.jsx | 별도 `NewTeamForm` 컴포넌트. server wrapper만 존재 — Phase 3 TeamCreate 4-step 커밋 존재 | NewTeamForm 내부 박제 여부 검수 (커밋엔 있으나 시안 명시 코멘트 누락) | P2 |
| `/profile/bookings` | (시안 없음 / Phase A 자체 디자인) | "시안 없음 → 자체 디자인" 명시 | 시안이 정말 없다면 E로 재분류. 자체 디자인이라도 v2 토큰 일치 확인 | P3 |
| `/profile/growth` | (Profile 응용) | v2 흔적 없음. `useEffect` 구식 fetch 패턴 | Profile 시안의 게이미피케이션 섹션 톤으로 재정렬 | P2 |
| `/profile/weekly-report` | (시안 없음) | v2 흔적 없음. 자체 디자인 | 시안 없음이면 E. 토큰 일치는 검수 | P3 |
| `/profile/complete` | OnboardingV2.jsx (응용) | "M5 온보딩 압축" — v2 시안 미반영 | OnboardingV2 톤 일치 (또는 /onboarding/setup 으로 통합 검토) | P2 |
| `/profile/complete/preferences` | (없음) | 단계 페이지. v2 흔적 0 | onboarding 흐름과 통합 또는 v2 적용 | P3 |
| `/venues/[slug]` | (시안 없음 — Court 응용 가능) | "공개 SEO 페이지" — `Link` + 기본 마크업. v2 흔적 0 | CourtDetail v2 톤 일부 차용 (히어로 + 정보 카드) | P2 |
| `/help/glossary` | (Help 응용) | 박제 흔적 0 (Help 페이지가 통합 허브로 흡수했으므로 레거시일 가능성) | /help 으로 redirect 또는 v2 톤 일치 | P3 |

### 주의

- `/games/new`, `/teams/new` 는 `feat(design-v2): Phase 2 CreateGame` / `Phase 3 TeamCreate` 커밋이 있음 → page.tsx가 server wrapper라 박제 흔적이 form 컴포넌트에 있을 가능성. **C/B 가능성 있음**. NewGameForm/NewTeamForm 내부 검수 후 등급 재조정.

---

## 🟡 C 등급 — 부분 박제 (P1/P2)

핵심 일부만 박제됐고 시안 대비 누락 있음.

| 라우트 | 시안 파일 | 박제 상태 | 누락 부분 | 우선도 |
|--------|----------|---------|----------|-------|
| `/community` | BoardList.jsx | Phase 4 with-aside 6열 board 박제 (커밋 0aefffd) | community-content 컴포넌트 — page.tsx 헤더 코멘트 부재 | P3 (커밋 흔적 충분) |
| `/notifications` | Notifications.jsx | Phase 2 박제 커밋 (6b78668). 7탭 + unread + 설정 링크 | 코멘트는 wrapper에 없고 client에 분산 | P3 |
| `/rankings` | Rank.jsx | v2-podium / v2-team-board / v2-player-board 컴포넌트 존재 (커밋 62c02e7) | page.tsx wrapper엔 v2 코멘트 없음 (rankings-content가 본체) | P3 |
| `/help/glossary` | (Help 일부) | 단순 redirect | /help 시안에 통합되었는지 검토 | P3 |
| `/safety` | Safety.jsx | Phase 6 박제. 4탭 + 더미 UI | DB 0% — 정상. 진입점 부재 (audit) | P2 |
| `/scrim` | Scrim.jsx | Phase 7 박제. v2 시안 1:1 | DB 0% — 정상 | P3 |
| `/match` | Match.jsx | Phase 8 박제. 시안 1:1 | DB 미연결 + 진입점 0건 (audit P1). 라우트 정책 결정 필요 | P1 |
| `/onboarding/setup` | OnboardingV2.jsx | Phase 9 P1-1b 박제 | 회원가입 직후 자동 redirect 미구현 (audit) | P1 |
| `/courts/[id]/manage` | (시안 없음 / 자체) | "시안 없음 → BDR v2 토큰 자체 디자인" 명시 | 자체 디자인이라 시안 없음 처리 가능 — E로 재분류 가능 | — |

---

## ❌ F 등급 — 라우트 누락 (시안 있음 / 페이지 없음)

| 시안 파일 | 예상 라우트 | 현재 상태 | 권장 액션 | 우선도 |
|----------|-----------|---------|----------|-------|
| `Referee.jsx` | `/referee` | 라우트 없음 (`(web)/referee/page.tsx` 미존재) | (1) 사용자용이면 라우트 생성 (2) 시안만 보존이면 시안 폐기 + admin 영역 검토 | P2 |

> 그 외 시안 모두 매핑 라우트 존재. `Match.jsx`, `Live.jsx`, `Reviews.jsx` 등도 모두 있음.

---

## 🟢 B 등급 — 대체로 박제 (P2/P3)

핵심 박제 됐으나 page.tsx 헤더 코멘트, 시안 출처 표기, 일부 디테일 누락.

| 라우트 | 시안 파일 | 누락 디테일 | 우선도 |
|--------|----------|-----------|-------|
| `/` (홈) | Home.jsx | Phase 1 박제 (커밋 d6bc22c). 시안 출처 코멘트 OK | P3 (이미 충분) |
| `/games` | Games.jsx | Phase 1 박제 (커밋 93a4a49). pickup/guest/team-match v2 카드 분리 | P3 |
| `/games/my-games` | MyGames.jsx | Phase 2 + 8 박제. 이모지 meta 추가 | P3 |
| `/games/[id]` | GameDetail.jsx | Phase 1 v2 재구성 (커밋 e70e673). SummaryCard 6요소 | P3 |
| `/teams` | Team.jsx | Phase 3 박제. teams-content-v2 사용 | P3 |
| `/teams/[id]` | TeamDetail.jsx | Phase 3 박제. 6개 v2 컴포넌트 (`_components_v2/`) | P3 |
| `/courts` | Court.jsx | Phase 3 박제. courts-content-v2 + 5 필터칩 + 카카오맵 | P3 |
| `/courts/[id]` | CourtDetail.jsx | Phase 3 박제. court-detail-v2 + KakaoMap | P3 |
| `/organizations` | Orgs.jsx | Phase 3 박제. orgs-list-v2 | P3 |
| `/profile` | Profile.jsx | Phase 1 박제. 서버 컴포넌트 + 게이미피케이션 | P3 |
| `/users/[id]` | PlayerProfile.jsx | Phase 1 박제 (커밋 28be75f) | P3 |
| `/login` | Login.jsx | Phase 6 v2 재구성. 탭 + 인라인 폼 | P3 |
| `/signup` | Signup.jsx | Phase 6 3-step 위저드 | P3 |
| `/notifications` | Notifications.jsx | Phase 2 박제. 7탭 + unread | P3 |

---

## ✅ A 등급 — 완벽 박제 (시안 출처 명시, 1:1 박제)

`grep "Dev/design/BDR v2"` 으로 시안 파일 직접 명시한 페이지 위주 (20개 매칭) + 강한 박제 명세 페이지:

| 라우트 | 시안 파일 |
|--------|----------|
| `/about` | About.jsx |
| `/awards` | Awards.jsx |
| `/calendar` | Calendar.jsx |
| `/coaches` | Coaches.jsx |
| `/community/new` | PostWrite.jsx |
| `/community/[id]` | PostDetail.jsx |
| `/courts/[id]/booking` | CourtBooking.jsx |
| `/forgot-password` | PasswordReset.jsx |
| `/gallery` | Gallery.jsx |
| `/games/[id]/guest-apply` | GuestApply.jsx |
| `/games/[id]/report` | GameReport.jsx |
| `/guest-apps` | GuestApps.jsx |
| `/help` | Help.jsx |
| `/match` | Match.jsx |
| `/messages` | Messages.jsx |
| `/onboarding/setup` | OnboardingV2.jsx |
| `/organizations/[slug]` | OrgDetail.jsx |
| `/pricing` | Pricing.jsx |
| `/pricing/checkout` | Checkout.jsx |
| `/pricing/fail` | PricingFail.jsx |
| `/pricing/success` | PricingSuccess.jsx |
| `/privacy` | Privacy.jsx |
| `/profile/billing` | Billing.jsx |
| `/profile/edit` | EditProfile.jsx |
| `/profile/activity` | MyActivity.jsx |
| `/profile/settings` | Settings.jsx |
| `/profile/achievements` | Achievements.jsx |
| `/safety` | Safety.jsx |
| `/saved` | Saved.jsx |
| `/reset-password` | PasswordReset.jsx |
| `/reviews` | Reviews.jsx |
| `/scrim` | Scrim.jsx |
| `/search` | Search.jsx |
| `/series` | Series.jsx |
| `/series/new` | SeriesCreate.jsx |
| `/series/[slug]` | SeriesDetail.jsx |
| `/settings` | Settings.jsx |
| `/shop` | Shop.jsx |
| `/stats` | Stats.jsx |
| `/team-invite` | TeamInvite.jsx |
| `/teams/[id]/manage` | TeamManage.jsx |
| `/terms` | Terms.jsx |
| `/tournaments` | Match.jsx (목록) |
| `/tournaments/[id]` | Match.jsx (상세) |
| `/tournaments/[id]/bracket` | Bracket.jsx (redirect wrapper) |
| `/tournaments/[id]/join` | TournamentEnroll.jsx |
| `/tournaments/[id]/referee-request` | RefereeRequest.jsx |
| `/courts/submit` | CourtAdd.jsx |
| `/verify` | Verify.jsx |

---

## ⚫ E 등급 — 시안 없음 (박제 무관)

시안에 대응 화면 없음 — admin / 운영 / 유틸리티 / 레거시 redirect 라우트.

**Tournament Admin (15)**: `/tournament-admin/**` 전부 (organizations / series / templates / tournaments wizard / matches / bracket / recorders / site / teams / admins)

**Partner Admin (4)**: `/partner-admin`, `/partner-admin/venue`, `/partner-admin/campaigns`, `/partner-admin/campaigns/[id]`

**Court 운영 (2)**: `/courts/[id]/manage`, `/courts/[id]/booking/payment-fail`, `/courts/[id]/checkin` (QR)

**Profile 통합 redirect (4)**: `/profile/payments`, `/profile/preferences`, `/profile/notification-settings`, `/profile/subscription` — 전부 `/profile/billing` / `/profile/settings` 로 redirect만 수행

**Tournament redirect (3)**: `/tournaments/[id]/bracket`, `/tournaments/[id]/schedule`, `/tournaments/[id]/teams` — next.config.ts redirects의 백업 wrapper

**기타 (5)**: `/teams/manage` (간이 팀 관리 허브), `/invite` (다음카페 랜딩), `/organizations/apply`, `/organizations/[slug]/series/[seriesSlug]`, `/series/[slug]/[editionNumber]` (redirect)

**유틸 (3)**: `/~offline` (PWA), `/teams/manage`, `/profile/basketball` (Profile 분할 페이지)

> 50개 내외. 시안 박제 대상 아님. 단, BDR v2 토큰 일치(색상/폰트)는 별도 검수 필요.

---

## 우선순위 권고 (실행 순서)

### P0 (이번 주 — 진입점 작업과 연계, 4시간)

1. **D등급 `games/new` / `teams/new` form 컴포넌트 박제 검수** — 커밋엔 v2 박제 있음. 코멘트만 보강 또는 누락 시 보강. (1h)
2. **F등급 `Referee.jsx` 처리 결정** — 라우트 생성 vs 시안 폐기 (15분 결정 + 처리 1~2h)

### P1 (다음 주 — 박제 미진행 잡기, 8시간)

3. **D등급 `/community/[id]/edit` 박제** — PostWrite 패턴 차용 (1.5h)
4. **D등급 `/games/[id]/edit` 박제** — CreateGame 패턴 차용 (1.5h)
5. **D등급 `/profile/complete` 박제** — OnboardingV2 톤 일치 (1.5h) — 또는 `/onboarding/setup` 으로 통합 검토
6. **D등급 `/profile/growth` 박제** — Profile 게이미피케이션 톤 (1.5h)
7. **C등급 `/match` 정책 결정** — 보존 / 진입점 추가 / 폐기 (audit P1과 연계)
8. **C등급 `/onboarding/setup` 자동 redirect 보강** — verify 직후 진입 (audit 1-A 연계, 1h)

### P2 (다다음 주 — 디테일 보강, 4시간)

9. **D등급 `/venues/[slug]` 박제** — CourtDetail v2 톤 차용 (2h)
10. **D등급 `/profile/weekly-report`, `/profile/bookings`** — 시안 없음이면 E로 재분류, 있으면 토큰 일치만 검수 (1h)
11. **D등급 `/help/glossary` 처리** — `/help` 으로 redirect 또는 박제 (30분)

### P3 (백로그 — 코멘트/표지 보강, 2시간)

12. **B등급 페이지 헤더 코멘트 보강** — `community/page.tsx`, `rankings/page.tsx`, `notifications/page.tsx` 등에 시안 출처 표기 (10건 × 5분)

> **총 견적**: P0 (4h) + P1 (8h) + P2 (4h) + P3 (2h) = **약 18시간 / 2~3 작업일**.

### 박제 작업과 진입점 작업의 우선순위 비교

`phase-9-audit.md` 의 신규 박제 라우트 진입점 단절 4건(`/match`, `/games/[id]/report`, `/games/[id]/guest-apply`, `/tournaments/[id]/referee-request`) 은 **박제 충실도는 A등급(완벽)** 이다. 즉 페이지 자체는 잘 만들어졌고 **연결만 안 된 상태**. 진입점 작업이 박제 작업보다 우선이다.

박제 작업(D등급 처리)은 모두 사용자가 잘 안 들어가는 보조 동선(edit/complete/growth/venues 등)이라 P1로 분류 가능. **D 처리보다 audit 의 P0/P1 (진입점 단절) 이 사용자 임팩트 더 큼**.
