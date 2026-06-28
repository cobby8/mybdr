# 대회 종료 재구성 — 운영 박제 CLI 의뢰서 (2026-06-09)

> **작성**: Cowork (허브) · **실행**: Claude CLI · **결재 default 자동** (반대 시에만 중단)
> **시안 출처**: `Dev/design/_zips/BDR-v2-11-대회종료-redesign-v2-2026-06-09.zip` (BDR v2 (11) · 기사 2열 갱신본 · v2(10) supersede)
> **종류**: 타깃 단일 페이지(종료 분기) 운영 박제 + BDR-current 역박제. **풀 Phase sync 아님**
> **★ 선행 의존**: BDR v2 (9) 대회상세(진행중) 박제 — 종료뷰가 `tdr-*` 공용 스타일 재사용. **(9) 박제 후 진행**

---

## 0. 한 줄

운영 **대회 종료 페이지**(`status==='completed'`) 재구성 시안을 박제.
사이드바 제거 + 본문 밀도 보강(스탯 리더·대회 기사) + 대진표 NBA 브래킷.
**신규 라우트 0 / DB 스키마 0 변경 / `/api/v1` 0 변경 / UI + 기존데이터 와이어링만.**

---

## 1. ★ 데이터 출처 — 수빈 결재 = "0 스키마 박제" (신규 DB 신설 ❌)

시안 HANDOFF §5는 스탯·기사를 "DB 미보유"로 적었으나 **운영 DB 실측 결과 둘 다 기존 데이터로 가능** (Cowork 2026-06-09 schema 검증). **신규 테이블/컬럼 추가 금지** — 발견 시 STOP.

### 03 스탯 리더 (부문별 누적 TOP3) — `match_player_stats` 집계

- 테이블: `match_player_stats` (schema L786) — 컬럼 이미 존재:
  - 득점 = `points` (L792, 인덱스 O) / 리바운드 = `total_rebounds` (L804, 인덱스 O) / 어시스트 = `assists` (L805, 인덱스 O) / 3점 = `threePointersMade`(@map `three_pointers_made`, L796)
- 집계: **본 대회의 완료 매치**들의 stat → `tournamentTeamPlayerId` 별 합산 → 부문별 `ORDER BY desc` → **TOP3**
  - 경로: `match_player_stats.tournamentMatch`(L826) → 본 tournament 필터 / `.tournamentTeamPlayer`(L827, schema L616) → 선수명·팀
  - Prisma `groupBy` 또는 `$queryRaw` 합산. 서버 컴포넌트(page.tsx) 내 신규 헬퍼 `lib/tournaments/stat-leaders.ts` 권장
- 데이터 0 (스탯 미기록 대회) → 섹션 자동 hide (UB1 패턴 답습)

### 04 대회 기사 (2열: 대표기사 + 목록 최신순) — 알기자 인프라 재사용

v2(11) 갱신: 단일 기사 → **2열 뉴스**(좌 대표기사 + 우 전체 목록 최신순 / `tdc-news`·`tdc-newsrow`).
- 목록(우) = 본 대회 **알기자 글 리스트** = `community_posts` (category=`news`, `tournament_id`=본 대회, `period_type` in match/round/daily, schema L1094) → `created_at` desc 최신순. 시안 5건(결승리포트/MVP/4강/8강/프리뷰)은 mock — 실제 글 N건 바인딩
- 대표(좌) = 목록 최신글(보통 결승 리포트) 본문 + 대표사진. 본문 = 해당 글 또는 결승 매치 `tournament_matches.summary_brief`(Json `{brief}`) / 생성기 `src/lib/news/auto-publish-match-brief.ts`·`match-brief-generator.ts`(가동 중)
- 대표사진 = `news_photo` (match_id, `is_hero=true`, schema L3100) — gallery-card 데이터원
- 글 0건 → 섹션 자동 hide. **mock(C_ARTICLES 5건) 박제 금지** — 실제 community_posts/summary_brief 사용

---

## 2. source / target

**시안 source** (풀어서 참고):
```
Dev/design/_zips/BDR-v2-11-대회종료-redesign-v2-2026-06-09.zip
  └ BDR v2.29/_handoff-대회종료-redesign/
      HANDOFF.md / tournament-end-redesign.html (진입점)
      td-completed.jsx (499) ← 종료 레이아웃·신규 2섹션·NBA 브래킷·기사 2열(tdc-news)
      td-completed.css (235) ← tdc-* / qual-* / nba-* / tdc-news*(기사 2열)
      td-redesign.css (272) ← tdr-* 공용 (v2(9)와 동일)
      tournament-completed.css (463) ← tc-* 챔피언 Hero·결산
      tokens.css / shell.css / shared.jsx
```

**운영 타깃**:
```
src/app/(web)/tournaments/[id]/page.tsx  (L287~ status==='completed' 분기)
src/app/(web)/tournaments/[id]/_components/  (아래 매핑)
src/lib/tournaments/stat-leaders.ts  ← 신규 집계 헬퍼 (스탯 리더)
```

**BDR-current 역박제**:
```
Dev/design/BDR-current/screens/TournamentCompleted.jsx + tournament-completed.css
```

---

## 3. ★★ 강조색 함정 (v2(9)와 동일)

`td-completed.jsx` L461: `style={{ '--cta': '#0F5FCC' }}` 인라인 = 확정값.
→ **강조색 = `var(--cafe-blue)`** (운영 토큰 기존, #0F5FCC). 하드코딩 ❌ / `--accent`(빨강) ❌ / 신규 토큰 ❌.
→ 의미색 고정: **승자 점수 = `var(--bdr-red)`** / **다음회차 배너 = `var(--bdr-navy)`**.

---

## 4. 레이아웃 재구성 (HANDOFF §2) + 컴포넌트 매핑

| 시안 영역 | 변경 | 운영 _component |
|----------|------|----------------|
| 우측 사이드바 | **제거** (최종순위↔종료결과 중복 해소) | 완료분기 `<aside>` 제거 → 전폭 1열 |
| 운영자 전환 | 사이드바 → **본문 상단 컴팩트 바** | `tournament-operator-preview` 재배치 (isInsider) |
| 챔피언 Hero | 다크 톤 | `tournament-completed-hero` |
| 01 최종 순위 | 유지 | `tournament-final-standings-card` |
| 02 MVP·베스트5 | 유지 | `tournament-mvp-best5-card` |
| **03 스탯 리더** | **신규** | 🆕 `tournament-stat-leaders-card` + §1 집계 |
| **04 대회 기사** | **신규 · 2열**(대표+목록 최신순) | 🆕 `tournament-news-card` (§1 community_posts 리스트 + news_photo hero) · story/gallery 데이터원 재사용 |
| 다음 회차 | 사이드바 → **하단 전폭 네이비 배너** | `tournament-next-edition-card` (`--bdr-navy`) |
| 대진표: 예선결과 | 조별 A/B조(시드·전적·득실, 상위2 강조) | `v2-bracket-seed-ranking` / `v2-dual-bracket-sections` |
| 대진표: 본선 | **NBA식 브래킷**(시드·커넥터·승자 하이라이트·챔피언 카드) | `v2-bracket-wrapper`/`v2-dual-bracket-view` restyle (`nba-*` CSS, 순수CSS 커넥터·라이브러리 0) |
| 경기일정/참가팀/규정 | 매치카드(승자 빨강·종료배지)/다크 팀카드+순위배지/규정 | 기존 탭 콘텐츠 |
| tdc-*/qual-*/nba-*/tc-* | — | `tournament-completed.css` 병합 + **토큰화** |

---

## 5. 불변 — 보존 (회귀 0)

- ✅ **`status` 분기 구조** — 진행중 뷰(=v2(9) 박제)와 종료 뷰 분기 그대로. 본 작업 = **종료 분기만**.
- ✅ 모든 **Prisma 데이터 패칭** / `ALLOWED_TABS` / `?tab=` 폴백 / 비공개 가드 / SEO 메타
- ✅ **AppNav frozen** (03 룰) / `GnbaRules` 조건부 / `Breadcrumb`
- ✅ 토큰만 / 핑크·살몬·코랄 ❌ / lucide ❌ / Material Symbols / 9999px ❌
- ✅ **DB 스키마 0 변경 / `/api/v1` 0 변경** (집계는 읽기 전용 서버 쿼리)

---

## 6. 제거 / 정리

- ❌ 완료뷰 우측 사이드바 (종료 결과 카드 = 최종 순위와 중복)
- ❌ Tweaks 패널 → 확정값 하드코딩(Hero 다크 / compact / 강조 `--cafe-blue`)
- ❌ mock 데이터(C_LEADERS·C_ARTICLE·mock 팀/점수) 박제 — **실데이터 와이어링만**

---

## 7. Stop Conditions (발동 시 즉시 중단 + 보고)

```
lint/tsc 실패 · 회귀 6 위반(AppNav) · ★DB 스키마 변경 필요 판단(신규 컬럼/테이블) ·
/api/v1 변경 · LOC > +2000 · mock 데이터 사용 · 사용자결정 §1~§8 위반 ·
진행중(비종료) 뷰 깨짐 · 데이터 패칭/탭 화이트리스트 변경
```
> ★ 집계가 기존 컬럼으로 불가능하다고 판단되면 박제 멈추고 보고 (Cowork 실측은 가능 결론).

---

## 8. 자체 검수 (`06-self-checklist.md` + 회귀 4)

- [ ] main bar 우측 = 검색/쪽지/알림/다크/햄버거 5개 순서 (더보기▼/아바타 ❌)
- [ ] 모바일 다크 단일 아이콘 / 검색·쪽지·알림 = `app-nav__icon-btn` (박스 ❌)
- [ ] 강조색 `--cafe-blue` / 승자점수 `--bdr-red` / 네이비배너 `--bdr-navy` / 빨강 오박 0
- [ ] 스탯 리더 = 실제 `match_player_stats` 집계값 (mock ❌) / 데이터 0 시 자동 hide
- [ ] 대회 기사 = 실제 summary_brief/news_photo (mock 텍스트 ❌) / 데이터 0 시 자동 hide
- [ ] 종료 뷰 = 신규 레이아웃 / **진행중 뷰 = 무변경**
- [ ] NBA 브래킷 가로 스크롤 / 480·720·1040px 반응형
- [ ] `npm run lint` + `npx tsc --noEmit` 통과
- [ ] 로컬 3001 — 종료 대회 1건(스탯 有/無 각각) 육안 확인

---

## 9. 완료 후

1. `subin` commit (`feat(ui): 대회 종료 재구성 박제 v2(10) — 스탯리더·기사·NBA브래킷 0스키마`) + push
2. **BDR-current 역박제** — `screens/TournamentCompleted.jsx` + `tournament-completed.css` 갱신 (같은 PR 또는 `design(sync):`)
3. PR `subin → dev` (머지는 STAGE A 일괄)
4. `_handoff-대회종료-redesign/` → `_archive/` 이동 (선택)
5. `phase-ledger.md` + `scratchpad.md` 1줄 + **errors/lessons**: "시안 'DB 미보유' 가정 ≠ 운영 실측 (match_player_stats·news_photo 기보유). 신규 박제 전 schema 실측 1회" 기록

---

## 10. CLI 한 줄 (수빈 → Claude CLI · ★ v2(9) 박제 후)

```
Read Dev/design/prompts/tournament-completed-redesign-bake-cli-prompt-2026-06-09.md 하고 §1 데이터출처 + §2 사전점검부터 시작해줘.
0 스키마(신규 DB ❌)·강조색 var(--cafe-blue)·종료 분기만·mock 박제 ❌. 결재 default 자동.
```

---

**의뢰서 끝.** 핵심 = ① **0 스키마**(스탯=match_player_stats 집계 / 기사=community_posts 알기자 리스트+news_photo) ② 강조 `--cafe-blue` ③ 사이드바 제거·NBA 브래킷·네이비 배너·**기사 2열** ④ 진행중 뷰 불변 ⑤ mock 박제 금지.
