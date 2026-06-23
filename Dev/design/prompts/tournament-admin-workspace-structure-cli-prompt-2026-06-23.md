# 대회 운영자 도구 워크스페이스 구조 개편 — CLI 작업 지시서

> 작성: Cowork PM (2026-06-23)
> 목적: 대회 운영자 도구의 다중 페이지 왕복을 줄이고, 개별 대회 관리 화면을 “운영 워크스페이스”로 재구성한다.
> 1차 범위: 구조/동선 개편. API/DB/권한/하위 라우트 삭제 없음.

---

## 0. 작업 한 줄 요약

`/tournament-admin/tournaments/[id]`를 단순 체크리스트 허브에서 **대회 운영 워크스페이스**로 승격한다.

기존 `wizard/divisions/teams/bracket/matches/site/admins/recorders/completed` 페이지는 삭제하지 않고, 1차에서는 워크스페이스 안에 **섹션 탭 + 요약 패널 + 핵심 CTA**로 흡수한다.

---

## 1. 왜 하는가

현재 운영자는 개별 대회 하나를 준비하면서 다음 페이지를 계속 왕복한다.

| 흐름 | 현재 문제 | 1차 해결 |
|---|---|---|
| 기본 정보 → 신청 정책 → 사이트 | `wizard`, `wizard?step=2`, `site`로 분산 | “공개 준비” 섹션에서 한눈에 표시 |
| 종별 → 팀 → 대진 → 경기 | 의존 흐름인데 페이지가 끊김 | “경기 구성” 섹션으로 묶어 다음 액션 노출 |
| 경기 관리 + 기록 설정 | 이미 `/matches`에서 한 페이지 패턴 존재 | 워크스페이스 섹션으로 승격 |
| 관리자/기록원 | 운영 권한 설정인데 별도 페이지 | “운영 인력” 섹션으로 노출 |
| 종료 처리 | 마지막 단계가 별도 진입 | “종료/결과” 섹션으로 노출 |

선행 근거:

- `src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx` 주석: “한 페이지 안에서 모든 경기 관리 + 기록 모드 설정 + 스코어 입력 진입”
- `src/lib/tournaments/setup-status.ts`: PR-Admin-5에서 `/divisions`로 가던 “종별 정의 + 운영 방식”을 통합 카드로 축소
- `Dev/admin-flow-audit-2026-05-16.md`: 마법사 이후 5~6페이지 순회와 `divisions/teams/bracket/matches` 단절 지적

---

## 2. 최우선 보존 룰

절대 하지 말 것:

- 기존 하위 라우트 삭제 금지
- API route 변경 금지
- Prisma schema 변경 금지
- 운영 DB write/마이그레이션 금지
- `/api/v1` Flutter 영역 변경 금지
- 권한 가드 변경 금지
- 기존 server action 시그니처 변경 금지

허용:

- `[id]/page.tsx`의 UI 구조 변경
- `[id]/_components/*` 신규/수정
- `setup-status.ts`의 표시 라벨/그룹 메타 추가
- 기존 하위 페이지로 가는 Link 유지 및 CTA 재배치
- CSS는 기존 Toss/admin 토큰 범위에서만 추가

---

## 3. 목표 IA

### 3-1. 워크스페이스 섹션

`/tournament-admin/tournaments/[id]` 본문을 다음 7섹션으로 재구성한다.

| 섹션 | 목적 | 연결 대상 |
|---|---|---|
| 요약 | 상태, 공개 가능 여부, 오늘 해야 할 작업 | 현재 page header + SetupProgress |
| 공개 준비 | 기본 정보, 시리즈, 신청 정책, 사이트 | `/wizard`, `/wizard?step=2`, `/site` |
| 참가팀 | 신청 승인, 입금, 로스터, 시드 | `/teams` |
| 종별/운영 방식 | 종별 정의, format, group settings | `/divisions` |
| 경기/기록 | 기록 모드, 경기 목록, 스코어 입력 | `/matches` |
| 대진/순위전 | bracket, playoffs, 결승/순위전 | `/bracket`, `/playoffs` |
| 운영 인력/종료 | 관리자, 기록원, 종료 처리 | `/admins`, `/recorders`, `/completed` |

### 3-2. URL 정책

1차에서는 새 라우트를 만들지 않는다.

권장:

- 섹션 탭은 client state 또는 hash(`#teams`) 기반.
- 서버 데이터 패칭은 기존 `[id]/page.tsx` 쿼리를 확장하지 않는다.
- 더 필요한 수치는 “상세 페이지로 이동” CTA로 해결한다.

---

## 4. 1차 구현 범위

### PR-WS1 — 워크스페이스 골격만

대상:

- `src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx`
- 신규 가능: `src/app/(admin)/tournament-admin/tournaments/[id]/_components/TournamentWorkspace.tsx`
- 신규 가능: `src/app/(admin)/tournament-admin/tournaments/[id]/_components/workspace-section-tabs.tsx`
- 수정 가능: `src/app/(admin)/tournament-admin/tournaments/[id]/_components/SetupChecklist.tsx`
- 수정 가능: `src/lib/tournaments/setup-status.ts`

작업:

1. 기존 체크리스트를 유지하되, 화면의 주 구조를 “진행 카드 7개”가 아니라 “섹션형 워크스페이스”로 바꾼다.
2. 상단에 섹션 탭을 둔다.
3. 각 섹션에는 현재 상태 요약 + 대표 CTA 1~3개만 둔다.
4. 기존 빠른 액션 4개는 섹션 안으로 재배치한다.
5. 잠금/의존 안내는 유지한다. `canPublish(progress)`도 유지한다.

완료 기준:

- `[id]` 첫 화면에서 운영자가 다음 작업 위치를 바로 볼 수 있다.
- `divisions`, `teams`, `bracket`, `matches`, `site`로 들어가는 CTA가 한 화면에 논리적으로 묶인다.
- 기존 하위 페이지 deep-link가 모두 살아 있다.

---

## 5. 표시 설계

### 5-1. 상단 요약

현재 헤더 패턴은 유지한다.

추가할 것:

- 공개 상태 카드: `공개 가능 / 필수 N개 남음`
- 진행률: 기존 `progress.completed / progress.total`
- 다음 추천 작업: 첫 번째 incomplete required item

### 5-2. 섹션 카드

각 섹션은 다음 구조로 통일한다.

```tsx
{
  title: "공개 준비",
  subtitle: "기본 정보, 신청 정책, 사이트 설정",
  status: "complete | in_progress | locked | empty",
  summary: "필수 3개 중 2개 완료",
  actions: [
    { label: "기본 정보 수정", href: `${base}/wizard` },
    { label: "신청 정책", href: `${base}/wizard?step=2` },
    { label: "사이트 설정", href: `${base}/site` },
  ],
}
```

주의:

- 카드 안에 카드 중첩 금지
- 가짜 링크 금지
- disabled 카드도 “왜 잠겼는지” 텍스트 표시
- 버튼은 44px 이상 터치 영역

### 5-3. 기존 체크리스트 처리

기존 `SetupChecklist`는 완전 삭제하지 않는다.

권장 옵션:

- 기존 카드 그리드를 “요약/진행률 계산 source + 공개 게이트”로 유지
- UI는 새 `TournamentWorkspace`에서 섹션형으로 렌더
- `SetupChecklist`는 접기 가능한 “상세 체크리스트”로 아래쪽 이동하거나, 내부 렌더를 섹션형으로 리팩터

금지:

- `setup-status.ts` 판정 로직을 다시 만들지 말 것
- 같은 의미의 진행도 계산을 page.tsx에 중복 구현하지 말 것

---

## 6. 데이터 사용 원칙

1차는 현재 `[id]/page.tsx`가 이미 가져오는 데이터만 사용한다.

현재 사용 가능:

- tournament 기본 정보
- divisionRules count/format/settings
- tournamentMatches count
- tournamentSite 존재/공개 여부
- setup progress

부족한 데이터는 새 쿼리로 억지로 채우지 않는다.

예:

- 팀 승인/입금 상세 수치가 필요하면 `/teams` CTA로 이동
- bracket 상세 수치가 필요하면 `/bracket` CTA로 이동
- 기록원/관리자 수가 필요하면 상세 페이지 CTA로 이동

---

## 7. 디자인/코딩 룰

- 관리자 영역은 Toss/admin 스타일 유지
- `data-skin="toss"` 유지
- lucide는 기존 `@/components/admin-toss`의 `<Icon>`만 사용
- Material Symbols 신규 사용 금지
- 하드코딩 hex 금지
- CSS 변수는 기존 `toss-admin.css` / admin 토큰 사용
- 모바일 720px 이하 1열, 탭은 가로 스크롤 허용
- 버튼 radius 4px
- pill 9999px 금지
- AppNav frozen 룰은 사용자 web 영역 전용이므로 본 admin workspace에는 직접 적용하지 않음

---

## 8. 검증

필수:

```bash
npx tsc --noEmit --incremental false
```

정적 확인:

```bash
git diff --name-only -- src/app/(admin)/tournament-admin src/lib/tournaments
rg -n "prisma\\.|fetch\\(|/api/v1|schema.prisma" src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx src/app/(admin)/tournament-admin/tournaments/[id]/_components src/lib/tournaments/setup-status.ts
```

수동 확인:

- `/tournament-admin/tournaments/[id]` 접속 시 기존 권한 redirect 유지
- 하위 CTA 8종 정상 이동
  - `/wizard`
  - `/wizard?step=2`
  - `/divisions`
  - `/teams`
  - `/site`
  - `/matches`
  - `/bracket`
  - `/admins`
  - `/recorders`
  - `/completed`
- 공개 불가 상태에서 이유가 보임
- 모바일 390px에서 탭/버튼/카드 텍스트 겹침 없음

---

## 9. 후속 단계

1차가 통과하면 다음 순서로 기능 흡수를 진행한다.

| 단계 | 내용 | 범위 |
|---|---|---|
| WS2 | 공개 준비 섹션 강화 | `wizard`, `site` 요약 + 이동 최소화 |
| WS3 | 참가팀/종별 흐름 연결 | `divisions → teams` CTA와 상태 요약 강화 |
| WS4 | 경기/기록 섹션 강화 | `/matches`의 한페이지 패턴을 워크스페이스에 더 깊게 연결 |
| WS5 | 대진/순위전 연결 | `/bracket`, `/playoffs`, advance trigger 발견성 개선 |
| WS6 | 운영 인력/종료 | `admins`, `recorders`, `completed`를 종료 흐름과 연결 |

WS1에서는 위 후속 작업을 구현하지 않는다. 구조만 먼저 안정화한다.

---

## 10. 보고 형식

완료 보고는 다음 형식으로 한다.

```md
## 완료
- [파일] 변경 요약
- [구조] 섹션 IA 변경 요약
- [보존] API/DB/권한/하위 라우트 변경 없음 확인

## 검증
- tsc 결과
- CTA/라우트 확인 결과
- 모바일 확인 결과

## 다음
- WS2 추천 범위
- 남은 리스크
```
