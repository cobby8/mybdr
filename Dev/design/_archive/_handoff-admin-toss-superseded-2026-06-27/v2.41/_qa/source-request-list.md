# _qa/source-request-list.md — 원본 소스 추가 첨부 요청

> 작성 2026-06-25 · slim manifest 방식 후속.
> 아래 파일만 다음 첨부 단위로 보내주시면 해당 역박제 batch를 확정·박제할 수 있습니다.
> 우선순위 = `reverse-bake-gap.md`의 batch 순서. 표의 "필요도": ● 필수(코드 없이는 박제 불가) · ◐ 권장(추정 가능하나 확인 시 정확).
> 전체를 한 번에 보낼 필요 없음 — **batch 단위(B1→B2→B3…)로 끊어** 보내면 토큰 부담 없이 진행됩니다.

---

## 1순위 — B1 (P0 대회 워크스페이스) ●

```text
src/app/(admin)/tournament-admin/tournaments/[id]/_components/TournamentWorkspace.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/teams-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/bracket-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/divisions-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/matches-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/admins-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/recorders-panel.tsx
src/app/(admin)/tournament-admin/tournaments/[id]/_panels/site-panel.tsx
src/app/(admin)/tournament-admin/layout.tsx
```
필요 이유: 패널 전환 구조·각 패널 섹션 구성·완료/잠금 상태가 시안에 없어 추정 불가. 워크스페이스 셸 레이아웃 확정에 필수.
보조(◐): `src/lib/tournaments/setup-status.ts` — 패널 상태/스텝 잠금 로직.

---

## 2순위 — B2 (P0 생성 마법사) ●

```text
src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-create-tournament.tsx
src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-divisions.tsx
src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-game-settings.tsx
src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-schedule-venue.tsx
src/components/shared/place-autocomplete.tsx
```
필요 이유: 종별 일정·경기장·유니폼 규정 step과 Kakao 장소 검색 UI가 신규라 필드/상태 추정 불가.
보조(◐): `src/lib/tournaments/game-rules.ts`(규정 기본값), `src/lib/validation/tournament.ts`(검증 카피).

---

## 3순위 — B3 (P0 기록앱 영향 admin) ●

```text
src/app/(admin)/admin/agents/page.tsx
src/app/(admin)/admin/agents/record-app-impact-panel.tsx
src/app/(admin)/admin/logs/page.tsx
src/components/admin/sidebar.tsx
```
필요 이유: `/admin/agents` 화면군이 BDR-current에 전무. 영향 패널 구성·감사 로그 연결 동선 확정 필수.

---

## 4순위 — B4/B5 (P1 길안내 · 심판/경기원 라벨) ●◐

```text
src/lib/maps/navigation-links.ts
src/components/tournament/schedule-form.tsx
src/app/(web)/tournaments/[id]/_components/schedule-timeline.tsx
src/lib/referee/official-roles.ts
src/lib/validation/referee.ts
src/app/(admin)/tournament-admin/wizard/association/_components/Step3FeeSettings.tsx
src/app/(admin)/tournament-admin/wizard/association/_components/Step4RefereeRegister.tsx
src/app/(admin)/tournament-admin/wizard/association/_components/WizardConfirm.tsx
```
필요 이유: 길안내 링크 생성 규칙(navigation-links)과 심판/경기원 역할·등급 라벨(official-roles)은 UI 카피를 직접 결정 → 정확 박제에 필요.

---

## 5순위 — frozen 확인 ● (구조 위반 여부 판정용)

```text
src/components/bdr-v2/app-nav.tsx
src/components/shared/user-dropdown.tsx
src/app/(web)/layout.tsx
```
필요 이유: AppNav frozen 7룰 대상. 운영 변경이 **구조 변경인지 / 라벨·뱃지 추가인지** 확인해야 역박제 허용 범위 판정 가능. 구조 변경이면 역박제 금지하고 별도 보고.

---

## 6순위 — P2 시각 정합 ◐ (일관성 QA batch · 후순위)

```text
src/app/(web)/users/[id]/_v2/player-hero.tsx
src/app/(web)/users/[id]/page.tsx
src/app/(web)/profile/page.tsx
src/app/(web)/profile/basketball/page.tsx
src/app/(web)/pricing/page.tsx
src/app/(admin)/admin/plans/page.tsx
src/app/(admin)/admin/users/[id]/page.tsx
src/app/(admin)/admin/users/admin-users-table.tsx
src/app/(admin)/admin/tournaments/[id]/page.tsx
src/lib/membership/entitlements.ts
prisma/schema.prisma
```
필요 이유: 엘리트 배지·구독 권한 카피/뱃지 정합. 추정 가능하나 entitlement 라벨·필드 확인 시 정확. `consistency-audit.md` 단계에서 사용.

---

## 첨부 형식 안내 (재요청)

- 위 목록을 **batch별 작은 zip** 또는 채팅 직접 첨부로 보내주세요(파일 단위도 가능).
- 전체 `src` zip 업로드가 다시 가능해지면 그게 가장 빠릅니다 — 그 경우 본 목록은 무시하고 `current-src-inventory.md`를 코드 실측본으로 갱신합니다.
- 미요청 lib 파일(`services/tournament.ts`, `division-advancement.ts`, `division-rule-sync.ts`)은 UI 비직접이라 역박제 비대상으로 두었습니다 — 필요 시 알려주세요.
