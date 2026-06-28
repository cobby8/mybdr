# PR-1C-3 — UB1 TournamentCompleted (status='completed' 분기) 박제 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 완료**: PR-1C-1 UA1 ✅ PR #650 / PR-1C-2 UA2+UC2 ⏳ (사용자 결재 중)
> **선행 의뢰**: `phase-1C-kickoff-cli-prompt-2026-05-28.md` (§6 자체 검수 / §7 역박제 / §8 안전 가드)
> **PR-1C-2 의뢰서**: `phase-1C-2-ua2-uc2-cli-prompt-2026-05-28.md` (UA2 의 status 분기 패턴 / _components 추출 패턴 답습)
> **본 의뢰 범위**: PR-1C-3 1 건만 박제

---

## 1. 한 줄 요약

`BDR-current/screens/TournamentCompleted.jsx` (UB1 · 216 lines · 시안 헤더 명시: `status='completed' variant · 같은 라우트 status 분기 · 신규 라우트 X`) 박제. **`[id]/page.tsx` 안 `tournament.status === 'completed'` 분기 추가** + 5 카드 컴포넌트 추출.

---

## 2. 대상 시안 + 운영 라우트

| 시안 | 라인 | 운영 라우트 | 비고 |
|------|------|-----------|------|
| UB1 TournamentCompleted.jsx | 216 | `src/app/(web)/tournaments/[id]/page.tsx` (684 + PR-1C-2 갱신분) | **status='completed' 분기 추가** |
| tournament-completed.css | 333 | `src/app/(web)/tournaments/[id]/_components/tournament-completed.css` (신규) | 시안 className (tc-hero / tc-card / tc-story) 그대로 |

### 라우트 결정 — 시안 헤더 명시값 그대로

```
시안 line 3~8:
//   진입: setRoute('tournamentDetail', { id }) — same route, status 분기
//   B6 종료 발표 해소.
//   같은 라우트 status 분기 (신규 라우트 X / 더보기 가짜링크 X — 룰 §2 통과).
```

→ ❌ `[id]/completed/` 신규 라우트 만들지 ❌
→ ✅ `[id]/page.tsx` 안 `tournament.status === 'completed'` 일 때 별 layout 렌더

---

## 3. UB1 시안 구조

```
Layout:
  Hero band                  = 🏆 우승팀 + 부제 (champion logo / name / 대회 메타)
  5 카드 grid (2 / 3 / 모바일 1 column):
    카드 1 = 최종 순위 (standings)
    카드 2 = MVP · 베스트5
    카드 3 = 명장면 갤러리 (사진 grid)
    카드 4 = 대회 알기자 (스토리 / 본문)
    카드 5 = 다음 회차 (next edition CTA)
  하단 CTA                   = 공유 + 다른 대회
```

className 패턴: `tc-hero` / `tc-card` / `tc-card__h` / `tc-story` 등 — 시안 그대로 박제.

---

## 4. 데이터 패칭 정책 — 신규 추가 ❌ (CLAUDE.md §리디자인 룰)

**운영 Tournament 모델 기존 필드 활용**:

| 시안 영역 | 운영 데이터 | 처리 |
|---------|-----------|------|
| Hero 🏆 우승팀 | `Tournament.champion_team_id` + `teams` relation | ✅ 진짜 렌더 |
| MVP | `Tournament.mvp_player_id` + `users_tournaments_mvp_player_idTousers` relation | ✅ 진짜 렌더 |
| 최종 순위 | `TournamentTeam` (또는 `tournament_matches` winner) 기반 도출 | ✅ 진짜 렌더 (기존 데이터 활용) |
| 베스트5 | 운영 모델 미확인 | **카드 hide** (데이터 도착 후 별 PR) |
| 명장면 갤러리 | 운영 모델 미확인 (`Tournament.media` 등 별 relation 가능성) | **카드 hide** 또는 placeholder + 추후 PR |
| 대회 알기자 (스토리) | 운영 모델 미확인 (`Tournament.recap / description` 등) | **카드 hide** 또는 description 활용 |
| 다음 회차 (next edition) | 같은 `series_id` 의 다음 `edition_number` 검색 | ✅ 가능하면 진짜 / 없으면 카드 hide |

**핵심 룰**:
- ❌ Prisma 쿼리 추가 / API 호출 추가 / 새 fetch ❌
- ✅ 기존 `getTournamentById` (또는 동등) 결과 활용
- ✅ 데이터 없으면 카드 hide — placeholder/mock 데이터 노출 ❌ (운영 사용자 혼란 방지)

→ CLI 가 박제 중 운영 query 결과 spec 을 verify (curl 또는 raw query 1회). 운영 응답 키 = snake_case (CLAUDE.md §보안 — 재발 5회).

---

## 5. 박제 절차

```
[Step 1] git checkout subin && git pull origin subin
[Step 2] BDR-current/screens/TournamentCompleted.jsx + tournament-completed.css 읽기
[Step 3] 운영 [id]/page.tsx 안 tournament 데이터 spec 확인 (curl /api/web/tournaments/<id> 또는 raw query)
         · champion_team_id / mvp_player_id 채워진 종료 대회 1건 sample
         · standings / next_edition 도출 가능 여부 확인
[Step 4] _components/ 안 5 신규 컴포넌트 추출:
         · tournament-completed-hero.tsx (Hero band)
         · tournament-final-standings-card.tsx
         · tournament-mvp-best5-card.tsx (베스트5 데이터 없으면 MVP only fallback)
         · tournament-gallery-card.tsx (데이터 없으면 hide)
         · tournament-story-card.tsx (description 활용 또는 hide)
         · tournament-next-edition-card.tsx (series 다음 edition fetch — 없으면 hide)
         · tournament-completed.css (시안 css 그대로)
[Step 5] [id]/page.tsx 안 status 분기 추가:
         · 기존 layout 분기 (recruit / closed) 가 어떻게 처리되는지 먼저 확인
         · status === 'completed' 일 때 = TournamentCompletedView 컴포넌트 (위 5 카드 묶음) 렌더
         · 또는 [id]/page.tsx 안 conditional block — 패턴은 운영 기존 처리 답습
[Step 6] dev:3001 검증
         · status='completed' tournament 1건 fixture 데이터 또는 운영 DB 의 종료 대회 1건
         · /tournaments/<id> 접근 → 🏆 hero + 카드 grid 렌더
         · 데이터 없는 카드 = hide (placeholder X)
         · 다크모드 / 모바일 720px / iOS input 16px
[Step 7] lint + typecheck — npm run lint && npx tsc --noEmit
[Step 8] 자체 회귀 검수 6 케이스 (kickoff §6 답습) + UB1 특수:
         · ❌ 신규 라우트 [id]/completed/ 생성 = 0
         · ❌ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
         · ❌ mock/placeholder 데이터 노출 = 0 (운영 데이터 없으면 hide)
         · ✅ tc-hero / tc-card className 시안 패턴 일치
         · ✅ 5 카드 grid = 2/3 모바일 1 column
[Step 9] commit + push
         git commit -m "design(1C-3): UB1 TournamentCompleted v2.18 시안 박제 (status='completed' 분기)"
         git push origin subin
[Step 10] subin → dev PR 생성 + Cowork 알림
[Step 11] phase-ledger Phase 1 ⑪ 에 PR-1C-3 ✅ 추가
```

---

## 6. 안전 가드 (kickoff §8 by reference — 추가 주의)

본 PR 만의 특수 주의:
- ❌ **PA7 AdminTournamentCompleted 와 혼동 금지**: PA7 = 관리자 측 종료 후 5 카드 hub (결과/통계/알기자/사진영상/사이트 archive) → **PR-1C-12 별 PR**. 본 PR (UB1) = 사용자 측 종료 페이지.
- ❌ **신규 라우트 [id]/completed/ 만들지 마**: 시안 헤더 + 사용자 결정 §2 (가짜링크 ❌) 위반
- ❌ **Prisma 쿼리 추가 ❌ / 새 fetch ❌**: 리디자인 룰 (API/데이터 패칭 유지). 단, series next_edition 도출용 단순 query 1건은 허용 (기존 series 데이터 활용 — 신규 API ❌)
- ✅ 데이터 없는 카드 hide 룰 — 운영 사용자 혼란 방지 / mock 절대 ❌
- ✅ champion / mvp 데이터 도출 시 응답 키 = snake_case 확인 (errors.md 재발 5회)

---

## 7. 자체 검수 (kickoff §6 + UB1 특수)

기본 6 케이스 + 본 PR 특수:
- ✅ Hero 🏆 우승팀 = champion_team_id null 일 때 = hero 자체 hide 또는 fallback ("종료된 대회") — 우승팀 없는 종료 대회도 그라데이션 ❌
- ✅ MVP 카드 = mvp_player_id null 일 때 = 카드 hide
- ✅ 5 카드 grid responsive = ≥1024 3 column / ≥768 2 column / 모바일 1 column
- ✅ 하단 CTA "공유 + 다른 대회" 링크 = 가짜링크 ❌ (운영 라우트 매핑)
- ✅ `var(--color-info-soft)` (in-progress) / completed 색상 = `var(--color-neutral-soft)` 또는 시안 tokens 일치

---

## 8. 산출물 (CLI → 사용자)

```
1. PR-1C-3 박제 + subin → dev PR 링크 (예: #652)
2. _components/ 안 5 신규 컴포넌트 + tournament-completed.css
3. [id]/page.tsx 안 status='completed' 분기 추가
4. phase-ledger Phase 1 ⑪ 에 PR-1C-3 ✅ 추가
5. scratchpad 작업 로그 1줄
6. 미푸시 commit 알림 (있을 경우)
```

→ 사용자 (수빈) 의 다음 액션:
```
☐ PR-1C-3 결재 (subin → dev → main)
☐ "PR-1C-4 박제해줘" 한 줄 의뢰 → Cowork 가 PR-1C-4 의뢰서 자동 작성 (UA3 TournamentEnroll · 1563 line — 가장 큰 사용자 PR)
```

---

## 9. 결재 후 CLI 다음 한 줄 응답 형식

```
✅ PR-1C-3 의뢰 확인 — UB1 TournamentCompleted (status='completed' 분기) 박제

이해: [id]/page.tsx 안 status 분기 추가 + 5 카드 컴포넌트 추출 + 데이터 없는 카드 hide + 신규 라우트 ❌ + PA7 관리자측 분리.

사전 점검 6 단계 시작. 결재 받기 전 박제 ❌.
```

---

**의뢰서 끝.** 수빈이 CLI 에 한 줄로 전달:
`Read Dev/design/prompts/phase-1C-3-ub1-cli-prompt-2026-05-28.md 하고 §5 박제 절차 시작해줘.`
