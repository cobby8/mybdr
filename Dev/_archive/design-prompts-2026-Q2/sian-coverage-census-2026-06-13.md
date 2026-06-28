# 시안 커버리지 전수조사 (2026-06-13)

> 방법: 실제 라우트(`src/app/(web)` page.tsx 전수) × 시안(`BDR-current/screens` + `_archive/**/*.jsx`) 교차 대조.
> 판정: **시안 파일이 어디에도(현행+아카이브) 없으면 "시안 없음"**. 아카이브에만 있으면 "시안 보유"(BDR-current 는 최신 sync 배치만 담음 — 옛 시안은 정상적으로 아카이브에 보존).
> 이전 인벤토리(`claude-project-knowledge/04-page-inventory.md`, 117p·A43)는 5월 초 기준 → 본 문서가 갱신본.

---

## 1. 요약

| 구분 | 수 | 상태 |
|------|----|------|
| (web) 사용자 라우트 총 | ~104 | — |
| 시안 보유 (현행 또는 아카이브) | ~99 | ✅ |
| **시안 없음 — 사용자 기능 페이지** | **2** | ⚠️ 박제 의뢰 후보 |
| 시안 불필요 — 기술/리다이렉트 | 2 | — (`/settings` redirect, `/~offline` PWA) |
| 시안 불필요 — E영역 자체셸 | admin/tournament-admin/partner-admin/referee/_site | — (디자인 토큰만 일치) |

→ **결론: 사용자 영역은 거의 전부 시안 보유. 진짜 시안 없는 기능 페이지는 2건뿐.**

---

## 2. ⚠️ 시안 없는 페이지 (사용자 기능 · 박제 의뢰 후보)

| 라우트 | 페이지 | 성격 | 비고 |
|--------|--------|------|------|
| `/lineup-confirm/[matchId]` | 사전 라인업 확정 (팀장용) | 기능 페이지 (2026-05-09 PR3 신설) | server component 자체 마크업. 시안 0 → 토큰만 일치. 모바일 팀장 사용 빈도 ↑ → 박제 가치 있음 |
| `/courts/[id]/booking/payment-fail` | 코트 예약 결제 실패 | 결과 페이지 | 전용 시안 0. `/pricing/fail`(PricingResult.jsx) 패턴 재사용 권장 |

→ 둘 다 **DB/기능은 동작**, 시각 시안만 없음. P1(라인업) / P2(결제실패) 우선순위.

## 2-1. 경계 케이스 (반쪽 시안)

| 라우트 | 상태 |
|--------|------|
| `/team-apply/[token]/edit` | base `/team-apply` = `ApplyFlow.jsx`(아카이브) 보유. **edit 변형 전용 시안만 없음** — base 재사용 가능 |

---

## 3. 시안 불필요 (정상 — 박제 대상 아님)

### 3-1. 기술/리다이렉트
- `/settings` — `/profile/settings` 로 영구 redirect 스텁 (시안 git history 보존). 시안 불필요.
- `/~offline` — PWA 오프라인 폴백. 기술 페이지.

### 3-2. E영역 자체셸 (시안 박제 대상 X — 디자인 토큰만 일치)
- `(admin)/admin/*` — 백오피스 (AdminSidebar)
- `(web)/tournament-admin/*` — 대회 운영자 (TournamentAdminNav)
- `(web)/partner-admin/*` — 파트너 (자체셸, 단 PartnerAdmin/Campaigns/Venue 시안은 존재)
- `(referee)/referee/*` — 심판 플랫폼 (RefereeShell)
- `_site/*` — 서브도메인 토너먼트 (site-templates)

---

## 4. 시안 보유하나 BDR-current 미동기화 (아카이브 only) — 참고용

> 이건 "시안 없음"이 **아님**. BDR-current 는 최신 sync 배치만 담는 단일 폴더라, 과거에 박제된 시안은 아카이브에 정상 보존. 향후 해당 페이지 재작업 시 아카이브에서 참조.

대표: `/about /awards /calendar /coaches /gallery /help /privacy /terms /safety /shop /stats /reviews /saved /scrim /news /invite /guest-apps /referee-info` + onboarding 분할 + profile 서브(payments/subscription/preferences/notification-settings/complete) + `/tournaments/[id]/{bracket,schedule,teams}` + `/series/new` `/series/[slug]/[editionNumber]` + `/teams/{manage,new,[id]/manage/requests}` + `/courts/{submit,[id]/checkin,[id]/manage}` 등.

→ 필요 시 별도 "BDR-current 재sync 후보" 정리 가능 (본 조사 범위 밖).

---

## 5. 다음 단계 (선택)

1. `/lineup-confirm` 시안 박제 의뢰 (P1 — 팀장 모바일 사용) → Claude.ai 디자인 의뢰서
2. `/courts/[id]/booking/payment-fail` = `/pricing/fail` 패턴 재사용 (시안 신규 불필요, 박제만)
3. (선택) 아카이브-only 시안 중 사용빈도 높은 페이지 BDR-current 재sync

---

## 6. 출처
- 라우트: `src/app/(web)/**/page.tsx` 전수 (2026-06-13)
- 시안: `Dev/design/BDR-current/screens/` + `Dev/design/_archive/**/*.jsx`
- 이전: `Dev/design/claude-project-knowledge/04-page-inventory.md` (5월 초, 갱신 전)
