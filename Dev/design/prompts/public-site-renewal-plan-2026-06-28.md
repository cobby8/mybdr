# 공개웹(mybdr.kr) 전면 리뉴얼 — 계획 + CLI 박제 프롬프트 (Cowork → CLI)

> 작성: Cowork(허브) · 2026-06-28 · 시안: `BDR v2 (49).zip` + `BDR v2 (50).zip` (둘 다 정본)
> 범위: **공개 사용자 영역 `(web)` 전체** / 깊이: **UI + IA(네비·정보구조)** / 데이터·API·라우트는 보존
> 핸드오프 위치: 시안 완료됨 → **Phase NC(CLI 운영 박제)** 단계. 본 문서 = 박제 계획 + paste-ready 프롬프트.
> ⚠ admin/tournament-admin/partner-admin/referee/_site (E등급 50p)는 **공개웹 아님 → 이번 범위 제외**(토큰 일치만).

---

## 0. 전제 / source of truth

- 디자인 정본 = `Dev/design/BDR-current/` 단일 폴더(zip sync 후). 시안 직접 참조는 항상 여기.
- 룰 우선순위(WORKFLOW §4): CLAUDE.md → WORKFLOW.md → `claude-project-knowledge/00~06`(디자인 영역 우선) → phase-ledger → prompts.
- 공개웹 디자인 시스템 = **BDR 시스템**(BDR Red `#E31B23`, 다크 기본, Material Symbols, radius 4px, `var(--*)` 토큰). ⚠ admin-v2의 Toss 시스템(Blue·lucide·radius 24)과 **완전 별개** — 섞지 말 것.
- 박제 핵심 룰(CLAUDE.md): **리디자인 = API/데이터 패칭/라우트 유지 + UI만 변경.** 응답 키 snake_case 자동 변환(프론트 접근자도 snake_case, 신규 필드 전 curl 1회 검증).

---

## 1. 작업 단위 명명 (WORKFLOW §2 준용)

이번 리뉴얼 = **Phase PUB**(공개웹). 4개 배치로 분할, PR 그룹 = `PR-PUB-*`.

| 배치 | 내용 | 페이지 수(약) |
|------|------|---------|
| **PUB-0** | 토대 — zip sync·머지 / 시안↔라우트 매핑 / IA 델타 검토 / 공유 셸·토큰 | 0 (기반) |
| **PUB-1** | P0 핵심(가입·진입·대회·경기·팀·프로필 핵심) | ~18 |
| **PUB-2** | P1 경험(프로필 부가·코트·커뮤니티·메시지·검색·시리즈·단체·랭킹 등) | ~22 |
| **PUB-3** | P2 보조/정적(소개·도움·약관·코치·샵·갤러리 등) | ~12 |

근거: `claude-project-knowledge/04-page-inventory.md` §7 우선순위(P0/P1/P2) + §2~3 등급.

---

## 2. PUB-0 — 토대 (먼저, 반드시 단독 완료)

### 2-1. zip 49+50 → BDR-current 머지 (⚠ 주의)

`sync-bdr-current.ps1`는 BDR-current를 **통째 교체**(기존→_archive). zip이 2개(다른 페이지 묶음)라 **두 번 돌리면 먼저 것이 archive로 밀려 사라짐.** 따라서:

```
1) 49·50 각각 임시 폴더에 풀기
2) 두 폴더의 시안 화면(screens/, *.html, tokens)을 하나의 폴더로 머지
   - 같은 파일명 충돌 시: 50(최신 회차)이 우선, 49의 고유 화면만 추가
3) 머지된 단일 폴더를 sync-bdr-current.ps1 로 1회 sync (-DryRun 먼저)
```

> Cowork 추출 샌드박스가 다운이라 이 머지는 **수빈/CLI가 로컬에서 수행**. 머지 후 BDR-current에 두 zip의 화면이 모두 있어야 함(검증: `ls Dev/design/BDR-current/screens` 로 화면 수 확인).

### 2-2. CLI — 시안↔라우트 매핑 + IA 델타 리포트 (사람 검토용)

대량 박제 전에 CLI가 먼저 산출(코드 수정 0, 읽기만):

- `BDR-current/`의 모든 공개 화면 ↔ `src/app/(web)/*` 라우트 매핑 표
- **IA 델타**: 시안이 (a) 메인 9탭 변경, (b) 더보기 5그룹/`src/components/bdr-v2/more-groups.ts` 변경, (c) Phase19에서 제거된 항목(mygames/messages/achievements/communityNew/gameNew/courtBooking/courtAdd/teamCreate/teamManage/searchResults/mypage 등) 재등장, (d) 신규/삭제 라우트 — 있는지 표로.
- 산출물: `Dev/design/prompts/_pub-ia-delta.md` → **수빈 결재 후** PUB-1 진행.

### 2-3. IA 변경 가드 (UI+IA라서 핵심)

- **AppNav(헤더)는 frozen** — `claude-project-knowledge/03-appnav-frozen-component.md` 코드 그대로 카피, 재구성 금지(13룰 A 1~7). 시안이 헤더를 바꿔도 frozen 코드 우선, 변경은 **수빈 결재 필수**.
- 메인 9탭(홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기) 변경·추가 = **PM 확인 필수**.
- 더보기 IA source of truth = `more-groups.ts`. Phase19 슬림화(30→15) 회귀 금지(제거 항목 재추가 ❌).

### 2-4. 공유 셸·토큰 (한 번만, 전 페이지 영향)

- AppNav/Drawer/Footer/더보기 패널 = frozen 카피 + more-groups 반영.
- 폐기 토큰 `--color-*`(04 §5-B: (web) 157p + components 75p 잔존) → BDR v2 토큰(`--accent`/`--bg-card`/`--ink`/`--ink-mute` 등)으로 마이그레이션. 매핑 = `02-design-system-tokens.md §9`. 공유 컴포넌트(game-card/board-row 등) 우선.
- 검증: `npm run build` + tsc + AppNav 4-케이스 회귀(아래 §5) + `grep -r "--color-" src/` 잔존 수 감소 확인.

---

## 3. PUB-1 / PUB-2 / PUB-3 — 페이지 목록

> 각 배치 안에서 2~4 페이지씩 PR로 쪼개 박제(PR-PUB-1-1 …). 한 PR = 데이터 패칭 유지 + UI만.

**PUB-1 (P0)**: `/` 홈 · `/signup` · `/login` · `/verify` · `/onboarding/*` · `/tournaments` · `/tournaments/[id]` · `/tournaments/[id]/join` · `/pricing` · `/pricing/checkout` · `/games` · `/games/[id]` · `/games/my-games` · `/teams` · `/teams/[id]` · `/profile` · `/profile/edit` · `/profile/settings`

**PUB-2 (P1)**: `/profile/*`(activity·achievements·growth·weekly-report·billing·payments·bookings·subscription) · `/courts` · `/courts/[id]` · `/community` · `/community/[id]`(+new/edit) · `/messages` · `/notifications` · `/search` · `/series`·`/series/[slug]` · `/organizations`·`/organizations/[slug]` · `/rankings` · `/stats` · `/calendar` · `/saved` · `/reviews` · `/scrim` · `/teams/[id]/manage` · `/guest-apps`

**PUB-3 (P2)**: `/about` · `/help`·`/help/glossary` · `/privacy` · `/terms` · `/coaches` · `/shop` · `/gallery` · `/awards` · `/safety` · `/referee-info` · `/news` · `/games/[id]`(report·guest-apply 등 잔여 서브)

**제외(이번 범위 X)**: `/admin/*`, `/tournament-admin/*`, `/partner-admin/*`, `(referee)/*`, `_site/*` — 공개웹 아님(운영/심판 콘솔). 토큰 일치만 유지.

---

## 4. 박제 가드 (전 배치 공통 — 위반 시 reject)

1. **리디자인 = UI만.** 라우트·서버컴포넌트 데이터 패칭·API 호출·Zod·Prisma 쿼리 보존. 마크업/스타일만 교체.
2. **snake_case 응답.** `apiSuccess()`가 키를 snake_case로 변환 → 프론트 접근자도 snake_case. 신규/변경 필드 전 `curl`로 raw 응답 1회 확인(errors.md 재발 5회).
3. **AppNav frozen** — 03 코드 카피. main bar 우측 5개(검색·쪽지·알림·다크·햄버거)만, 더보기 ▼/아바타 ❌, 모바일 듀얼 다크 ❌, 검색·쪽지·알림 박스 ❌.
4. **토큰만** `var(--*)`, 핑크·살몬·코랄 ❌, lucide ❌(공개웹은 Material Symbols), pill 9999px ❌(정사각 원형은 50% 허용).
5. **카피 = 시안 우선**(사용자 결정 §6). About 운영진 실명·"서울 3x3"·"다음카페" 카피 보존.
6. **모바일** 720px 분기 / iOS input 16px / 버튼 44px / 모바일 G-10·G-9 보호.
7. **역박제 동기화**(CLAUDE.md §🔄): 운영 src/ UI 변경 시 BDR-current도 같이 갱신(stale 방지).
8. **DB 단일 운영** — destructive SQL/`prisma db push` 스키마 변경 = 수빈 승인. 이번 작업은 SELECT만(스키마 변경 0 전제).

---

## 5. 검증 체계 (배치마다 + 완료 시)

각 PR 완료 후 CLI 자체:
- `npm run build` + `tsc --noEmit` 통과
- **AppNav 4-케이스 회귀**(13룰): ❌더보기▼/아바타 노출 / ❌모바일 듀얼 다크 / ❌검색·쪽지·알림 박스 / ❌우측 아이콘 순서·누락
- `06-self-checklist.md` 전 항목 통과
- 신규 필드 있으면 `curl`로 snake_case raw 확인
- 변경 페이지 스크린샷 → 시안과 대조(가능하면 dev 프리뷰 https로 — 로컬 localhost는 Cowork 제어 탭이 못 잡음, 프리뷰 권장)

배치 종료 시(고위험): subagent로 security-reviewer(권한/IDOR)·design-system-expert(13룰) 병렬 검수.

---

## 6. CLI 프롬프트 (paste-ready)

> Claude CLI(dev 브랜치)에 그대로 붙여넣기. 한 번에 한 배치/PR.

### 6-0. PUB-0 (토대)

```
[Phase PUB-0 — 공개웹 전면 리뉴얼 토대]
전제: Dev/design/BDR-current/ 에 BDR v2 (49)+(50) 시안이 머지·sync 완료돼 있다(안 됐으면 중단하고 알려줘).

작업:
1. 읽기만으로 매핑 리포트 작성 → Dev/design/prompts/_pub-ia-delta.md:
   - BDR-current/ 공개 화면 ↔ src/app/(web)/* 라우트 매핑 표
   - IA 델타: 메인 9탭 변경 / more-groups.ts(더보기 5그룹) 변경 / Phase19 제거 항목 재등장 / 신규·삭제 라우트
   - 결론에 "수빈 결재 필요 항목" 목록
2. 공유 셸 박제: AppNav/Drawer/Footer/더보기 패널 = claude-project-knowledge/03-appnav-frozen 코드 그대로 카피 + more-groups.ts 반영(Phase19 15항목 유지).
3. 토큰 마이그레이션: src/components/* 와 (web) 공유 컴포넌트의 폐기 --color-* → BDR v2 토큰(02-design-system-tokens §9 매핑). 일괄 치환 후 시각 회귀 확인.
가드: 리디자인=UI만(데이터/라우트 유지) / AppNav frozen 재구성 금지 / var(--*)만·lucide 금지·Material Symbols / 핑크·코랄 금지.
검증: npm run build + tsc + AppNav 4-케이스 회귀 + grep -r "--color-" src/ 잔존 수 보고.
끝나면 _pub-ia-delta.md 요약 + 미푸시 커밋 알림. IA 변경 결재 전 PUB-1 진행 금지.
```

### 6-1. PUB-1 (P0 핵심) — PR 단위 반복

```
[Phase PUB-1 — P0 공개웹 박제 / PR-PUB-1-{n}]
대상(이번 PR 2~4개): {예: /, /tournaments, /tournaments/[id], /tournaments/[id]/join}
정본: Dev/design/BDR-current/ 의 해당 화면(screens/*.jsx, *.html). 없으면 알려줘.

규칙:
- 리디자인=UI만: 기존 라우트·서버컴포넌트 데이터 패칭·API·Zod·Prisma 쿼리 그대로 두고 마크업/스타일만 시안으로 교체.
- 응답 키 snake_case — 프론트 접근자 snake_case 유지, 신규 필드 쓰면 curl로 raw 1회 확인.
- AppNav/헤더 영역 나오면 03 frozen 코드 카피(재구성 금지).
- 토큰 var(--*)·Material Symbols·핑크/코랄 금지·버튼 radius 4px·pill 9999px 금지.
- 카피는 시안 우선(사용자 결정 §6 보존).
- 모바일 720px 분기 / input 16px / 버튼 44px.
검증: npm run build + tsc / AppNav 4-케이스 회귀 / 06-self-checklist / 변경 페이지 dev 프리뷰 스크린샷 대조.
산출: PR-PUB-1-{n} 커밋(영역 경로만 git add) + scratchpad 작업로그 1줄 + 미푸시 알림.
운영 UI를 시안과 다르게 바꿨다면 BDR-current도 같이 갱신(역박제 룰).
```

### 6-2. PUB-2 / PUB-3

```
위 6-1 템플릿 그대로, 헤더만 교체:
[Phase PUB-2 — P1 공개웹 박제 / PR-PUB-2-{n}]  대상: {§3 PUB-2 목록에서 2~4개}
[Phase PUB-3 — P2 공개웹 박제 / PR-PUB-3-{n}]  대상: {§3 PUB-3 목록에서 2~4개}
P2 정적 페이지(약관·소개 등)는 데이터 거의 없음 → 마크업 교체 위주, 카피 시안 보존.
```

---

## 7. 수빈 수동 액션 (WORKFLOW §3-1)

```
☐ 49·50 머지 → sync-bdr-current.ps1 (-DryRun 먼저) → BDR-current 갱신 + 커밋
☐ PUB-0 _pub-ia-delta.md 검토 → IA 변경 결재(특히 9탭/더보기 변경)
☐ 배치별 dev → main PR 결재(수빈 단독 권한)
☐ phase-ledger 상태 갱신 트리거(Cowork/CLI에 한 줄)
```

## 8. 진행 순서 요약

```
머지+sync → PUB-0(토대·IA델타) → [수빈 IA결재] → PUB-1(P0) → PUB-2(P1) → PUB-3(P2)
각 배치: 2~4p PR 반복 → build+회귀검증 → 스크린샷 대조 → PR 머지
```
