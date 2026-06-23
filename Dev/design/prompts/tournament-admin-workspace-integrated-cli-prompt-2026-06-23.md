# 대회 운영자 도구 워크스페이스 통합 구현 — CLI 지시서

> 작성: Cowork PM (2026-06-23)
> 목적: 기존 여러 하위 페이지로 흩어진 개별 대회 운영 흐름을 `/tournament-admin/tournaments/[id]` 한 화면의 워크스페이스 구조로 통합한다.
> 선행 문서: `Dev/design/prompts/tournament-admin-workspace-structure-cli-prompt-2026-06-23.md`
> 본 지시서 성격: **구현용 통합 지시서**. 이 파일 하나만 읽고 WS1 구현에 착수 가능해야 한다.

---

## 0. 작업명

`/tournament-admin/tournaments/[id]` 대회 운영 워크스페이스 통합 구현

---

## 1. 핵심 결론

기존 구조는 셋업 허브가 중심에 있지만 실제 작업은 `wizard`, `divisions`, `teams`, `bracket`, `matches`, `site`, `admins`, `recorders`, `completed`로 계속 이동해야 한다.

이번 작업은 하위 페이지를 삭제하거나 기능을 옮기는 것이 아니라, `[id]` 첫 화면에서 운영 흐름을 한눈에 보고 바로 이동할 수 있게 **섹션형 워크스페이스**로 재배치한다.

---

## 2. 절대 보존

변경 금지:

- API route 변경 금지
- Prisma schema 변경 금지
- 운영 DB write/마이그레이션 금지
- `/api/v1` Flutter 영역 변경 금지
- 권한 가드 변경 금지
- 기존 하위 라우트 삭제/redirect 변경 금지
- 기존 server action 시그니처 변경 금지
- `setup-status.ts`의 완료 판정 로직 재작성 금지

허용:

- `[id]/page.tsx` UI 구조 변경
- `[id]/_components/*` 신규/수정
- `setup-status.ts`에 표시용 메타/그룹 헬퍼 추가
- 기존 하위 라우트 Link/CTA 재배치
- 기존 `SetupChecklist`를 상세 체크리스트로 격하하거나 내부 렌더를 섹션형으로 변경

---

## 3. 구현 범위

### 대상 파일

필수:

- `src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx`
- `src/app/(admin)/tournament-admin/tournaments/[id]/_components/SetupChecklist.tsx`
- `src/lib/tournaments/setup-status.ts`

신규 권장:

- `src/app/(admin)/tournament-admin/tournaments/[id]/_components/TournamentWorkspace.tsx`
- `src/app/(admin)/tournament-admin/tournaments/[id]/_components/tournament-workspace-tabs.tsx`
- `src/app/(admin)/tournament-admin/tournaments/[id]/_components/tournament-workspace-card.tsx`

CSS:

- 우선 기존 admin/toss 클래스와 inline `style` 최소 사용
- 새 CSS가 필요하면 기존 tournament-admin 관련 CSS에 매우 제한적으로 추가
- 신규 전역 CSS 파일 생성 금지

---

## 4. 목표 화면 구조

`[id]/page.tsx`는 다음 순서로 렌더한다.

1. 기존 `AdminPageHeader`
2. 워크스페이스 요약 바
3. 섹션 탭
4. 섹션 카드 그리드
5. 상세 체크리스트 또는 기존 `SetupChecklist` 축약 영역
6. 모바일 sticky 공개 버튼 유지

기존 헤더/권한/쿼리는 유지한다.

---

## 5. 워크스페이스 섹션

7개 섹션으로 통합한다.

| 섹션 key | 제목 | 포함 흐름 | CTA |
|---|---|---|---|
| `summary` | 요약 | 공개 상태, 진행률, 다음 추천 작업 | 공개 버튼 또는 미완 항목 |
| `ready` | 공개 준비 | 기본 정보, 시리즈, 신청 정책, 사이트 | `/wizard`, `/wizard?step=2`, `/site` |
| `divisions` | 종별/운영 방식 | 종별 정의, 운영 방식, 그룹 설정 | `/divisions` |
| `teams` | 참가팀 | 팀 승인, 입금, 로스터, 시드 | `/teams` |
| `matches` | 경기/기록 | 기록 모드, 경기 일정, 스코어 입력 | `/matches` |
| `bracket` | 대진/순위전 | 대진표, playoffs, 결승/순위전 | `/bracket`, `/playoffs` |
| `staff` | 운영 인력/종료 | 관리자, 기록원, 종료 처리 | `/admins`, `/recorders`, `/completed` |

---

## 6. 데이터 계약

1차 구현은 기존 `[id]/page.tsx`가 이미 계산하는 `progress`를 중심으로 한다.

사용 가능:

- `progress.items`
- `progress.completed`
- `progress.total`
- `progress.allRequiredComplete`
- `canPublish(progress)`
- `site` 존재/공개 여부
- `tournament._count.tournamentMatches`
- `divisionRules` 기반 progress 계산 결과

새 DB query 추가는 원칙적으로 하지 않는다.

부족한 수치는 다음처럼 처리한다.

| 부족한 정보 | 처리 |
|---|---|
| 승인팀/입금팀 상세 수 | `/teams` CTA로 이동 |
| 관리자/기록원 수 | `/admins`, `/recorders` CTA로 이동 |
| 대진표 상세 상태 | `/bracket` CTA로 이동 |
| playoffs 상세 상태 | `/playoffs` CTA로 이동 |

---

## 7. 구현 방식

### 7-1. `setup-status.ts`

추가 가능:

- `getNextRequiredSetupItem(progress)`
- `groupSetupItems(progress)` 또는 `buildWorkspaceSections(progress, base)`
- 표시 전용 타입 `WorkspaceSection`

주의:

- 기존 `calculateSetupProgress` 판정 조건은 바꾸지 않는다.
- 기존 `ChecklistItem` 필드는 깨지지 않게 확장만 한다.
- 기존 링크는 유지한다.

권장 타입:

```ts
export type WorkspaceSectionStatus = "complete" | "in_progress" | "locked" | "empty";

export type WorkspaceAction = {
  label: string;
  href: string;
  icon?: string;
  primary?: boolean;
  disabled?: boolean;
  reason?: string;
};

export type WorkspaceSection = {
  key: string;
  title: string;
  subtitle: string;
  status: WorkspaceSectionStatus;
  summary: string;
  actions: WorkspaceAction[];
  itemSteps: number[];
};
```

### 7-2. `TournamentWorkspace.tsx`

역할:

- `progress`, `tournamentId`, `site`, `canPublish` 결과를 받아 섹션 UI 렌더
- 섹션 탭과 카드 그리드 제공
- 잠금/미완/완료 상태를 한 화면에 표시

권장 props:

```ts
type TournamentWorkspaceProps = {
  tournamentId: string;
  progress: SetupProgress;
  isSitePublished: boolean;
  hasSite: boolean;
};
```

컴포넌트 규칙:

- client state가 필요하면 `TournamentWorkspace`만 `"use client"`
- 서버 쿼리/권한 로직은 넣지 않는다.
- Link는 실제 운영 라우트만 사용한다.
- 가짜 링크 `#` 금지

### 7-3. `SetupChecklist.tsx`

선택지:

1. 기존 그리드를 접기 가능한 “상세 체크리스트”로 유지
2. 기존 UI를 크게 바꾸지 않고 워크스페이스 아래 보조 영역으로 이동
3. 기존 내부 카드를 새 워크스페이스 카드와 공유 가능한 작은 컴포넌트로 분리

금지:

- `SetupChecklist` 삭제
- 공개 게이트 로직 삭제
- 잠금 toast 삭제

---

## 8. 디자인 룰

- 관리자 영역은 Toss/admin 톤 유지
- `data-skin="toss"` 유지
- 아이콘은 `@/components/admin-toss`의 `<Icon>` 사용
- Material Symbols 신규 사용 금지
- 하드코딩 hex 금지
- 버튼 radius 4px
- 모바일 720px 이하 1열
- 탭은 모바일에서 가로 스크롤 허용
- 버튼/탭 터치 영역 44px 이상
- 카드 안에 카드 중첩 금지
- 섹션 제목은 짧게, 설명은 1줄

---

## 9. 사용자 경험 기준

첫 화면에서 운영자가 바로 알아야 하는 것:

1. 지금 공개 가능한가?
2. 공개까지 무엇이 남았나?
3. 다음에 눌러야 할 곳은 어디인가?
4. 종별/팀/대진/경기는 어떤 순서로 처리해야 하나?
5. 관리자/기록원/종료 처리는 어디에 있나?

따라서 워크스페이스 상단에는 반드시 다음을 보여준다.

- 진행률 `N/M`
- 공개 게이트 상태
- 다음 추천 작업 1개
- 필수 미완 항목 수

---

## 10. 검증 명령

필수:

```bash
npx tsc --noEmit --incremental false
```

변경 범위 확인:

```bash
git diff --name-only -- "src/app/(admin)/tournament-admin/tournaments/[id]" "src/lib/tournaments/setup-status.ts"
```

금지 영역 확인:

```bash
git diff --name-only -- prisma "src/app/api/v1" "src/app/api/web"
```

API/DB 변경 흔적 확인:

```bash
rg -n "prisma\\.|fetch\\(|schema.prisma|/api/v1" "src/app/(admin)/tournament-admin/tournaments/[id]" "src/lib/tournaments/setup-status.ts"
```

주의:

- 기존 파일에 이미 있던 `fetch`는 허용. 새 fetch 추가는 금지.
- 기존 page query는 유지. 새 prisma query 추가는 PM 확인 필요.

---

## 11. 수동 확인 체크리스트

| 항목 | 기대 |
|---|---|
| `[id]` 진입 | 기존 권한/redirect 동작 유지 |
| 공개 준비 CTA | `/wizard`, `/wizard?step=2`, `/site` 이동 |
| 종별 CTA | `/divisions` 이동 |
| 참가팀 CTA | `/teams` 이동 |
| 경기/기록 CTA | `/matches` 이동 |
| 대진/순위전 CTA | `/bracket`, `/playoffs` 이동 |
| 운영 인력 CTA | `/admins`, `/recorders` 이동 |
| 종료 CTA | `/completed` 이동 |
| 잠금 상태 | 이유 텍스트 또는 toast 표시 |
| 모바일 390px | 탭/버튼/카드 텍스트 겹침 없음 |

---

## 12. 커밋 기준

소규모 구조 변경이므로 tester 생략 가능 조건:

- `tsc --noEmit --incremental false` 통과
- 변경 범위가 `[id]` page/components + `setup-status.ts`로 제한
- API/DB/schema diff 없음
- 모든 CTA 실제 라우트

커밋 메시지 권장:

```bash
git commit -m "feat(admin): 대회 운영 워크스페이스 구조 통합"
```

커밋 본문에는 필수:

```text
Co-Authored-By: Codex Opus 4.6 (1M context) <noreply@anthropic.com>
```

---

## 13. 완료 보고 형식

```md
## 완료
- `[id]` 페이지를 대회 운영 워크스페이스 구조로 재배치
- 7섹션: 요약 / 공개 준비 / 종별 / 참가팀 / 경기/기록 / 대진/순위전 / 운영 인력·종료
- 기존 하위 라우트와 공개 게이트 로직 보존

## 검증
- tsc: PASS/FAIL
- API/DB/schema diff: 없음/있음
- CTA 확인: N/N

## 다음
- WS2 후보: 공개 준비 섹션에서 `wizard/site` 요약 더 깊게 흡수
- WS3 후보: `divisions → teams → bracket` 흐름의 다음 액션 강화
```

---

## 14. CLI 시작 문장

아래처럼 시작한다.

```text
Read Dev/design/prompts/tournament-admin-workspace-integrated-cli-prompt-2026-06-23.md and implement the tournament admin workspace integration exactly within the allowed scope. Preserve APIs, DB schema, permissions, and all existing sub-routes. Run tsc and report the diff scope.
```
