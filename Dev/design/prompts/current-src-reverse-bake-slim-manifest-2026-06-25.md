# BDR 역박제 QA slim manifest — 2026-06-25

> 큰 `src` 전체 zip이 업로드되지 않는 상황을 위한 경량 컨텍스트.
> Claude.ai는 이 manifest와 의뢰서를 먼저 읽고, 실제 원본 파일이 필요한 경우 `_qa/source-request-list.md`에 우선순위별로 요청한다.

---

## 1. 기준

| 항목 | 값 |
|---|---|
| BDR-current 마지막 역박제 | `5dbc9b4` — 2026-06-23 18:03 |
| 조사 범위 | `5dbc9b4` 이후 운영 UI/UX 관련 src 변경 |
| 기존 큰 zip | `BDR-current-plus-src-reverse-QA-2026-06-25.zip` — 업로드 실패로 대체 |
| 새 방식 | manifest 기반 전수 설계 + 필요한 파일만 후속 요청 |

---

## 2. 역박제 갭 후보 축

| 우선 | 축 | 대표 파일 |
|---|---|---|
| P0 | 대회 운영자 워크스페이스 재구성 | `src/app/(admin)/tournament-admin/tournaments/[id]/_components/TournamentWorkspace.tsx`, `_panels/*.tsx`, `layout.tsx` |
| P0 | 대회 생성/관리 상세 흐름 | `ct-create-tournament.tsx`, `ct-divisions.tsx`, `ct-game-settings.tsx`, `ct-schedule-venue.tsx`, `teams-panel.tsx`, `divisions-panel.tsx` |
| P1 | 장소/길안내 UX | `schedule-timeline.tsx`, `tournament-tabs.tsx`, `place-autocomplete.tsx`, `schedule-form.tsx`, `navigation-links.ts` |
| P1 | 기록앱 영향 관리자 UI | `src/app/(admin)/admin/agents/page.tsx`, `record-app-impact-panel.tsx`, `admin/logs/page.tsx`, `components/admin/sidebar.tsx` |
| P1 | 심판/경기원 라벨 정리 | association wizard `Step3FeeSettings.tsx`, `Step4RefereeRegister.tsx`, `WizardConfirm.tsx`, `official-roles.ts` |
| P2 | 엘리트 선수 배지 | `profile/page.tsx`, `profile/basketball/page.tsx`, `users/[id]/_v2/player-hero.tsx` |
| P2 | 멤버십/구독 권한 표시 | `pricing/page.tsx`, `profile/page.tsx`, `admin/users/*`, `admin/plans/page.tsx`, `membership/entitlements.ts` |

---

## 3. 변경 파일 목록

```text
prisma/schema.prisma
src/app/(admin)/admin/agents/page.tsx
src/app/(admin)/admin/agents/record-app-impact-panel.tsx
src/app/(admin)/admin/logs/page.tsx
src/app/(admin)/admin/plans/page.tsx
src/app/(admin)/admin/tournaments/[id]/page.tsx
src/app/(admin)/admin/users/[id]/page.tsx
src/app/(admin)/admin/users/admin-users-table.tsx
src/app/(admin)/tournament-admin/layout.tsx
src/app/(admin)/tournament-admin/page.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_components/TournamentWorkspace.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/admins-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/bracket-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/divisions-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/matches-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/recorders-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/site-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/teams-panel.tsx
src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-create-tournament.tsx
src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-divisions.tsx
src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-game-settings.tsx
src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-schedule-venue.tsx
src/app/(admin)/tournament-admin/wizard/association/_components/Step3FeeSettings.tsx
src/app/(admin)/tournament-admin/wizard/association/_components/Step4RefereeRegister.tsx
src/app/(admin)/tournament-admin/wizard/association/_components/WizardConfirm.tsx
src/app/(web)/layout.tsx
src/app/(web)/pricing/page.tsx
src/app/(web)/profile/page.tsx
src/app/(web)/profile/basketball/page.tsx
src/app/(web)/tournaments/[id]/_components/schedule-timeline.tsx
src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx
src/app/(web)/users/[id]/_v2/player-hero.tsx
src/app/(web)/users/[id]/page.tsx
src/components/admin/sidebar.tsx
src/components/bdr-v2/app-nav.tsx
src/components/shared/place-autocomplete.tsx
src/components/shared/user-dropdown.tsx
src/components/tournament/schedule-form.tsx
src/lib/maps/navigation-links.ts
src/lib/membership/entitlements.ts
src/lib/referee/official-roles.ts
src/lib/services/tournament.ts
src/lib/tournaments/division-advancement.ts
src/lib/tournaments/division-rule-sync.ts
src/lib/tournaments/game-rules.ts
src/lib/tournaments/setup-status.ts
src/lib/validation/referee.ts
src/lib/validation/tournament.ts
```

---

## 4. Claude.ai 산출 요청

1. 이 manifest 기준으로 `_qa/current-src-inventory.md` 초안을 만든다.
2. 원본 소스 확인이 꼭 필요한 파일만 `_qa/source-request-list.md`에 P0/P1/P2로 요청한다.
3. `BDR-current` 대응 여부를 추정 가능한 범위에서 분류한다.
4. 역박제 우선순위와 다음 첨부 단위를 제안한다.

