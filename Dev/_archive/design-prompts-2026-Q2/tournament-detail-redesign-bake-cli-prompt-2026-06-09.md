# 대회 상세 재구성 — 운영 박제 CLI 의뢰서 (2026-06-09)

> **작성**: Cowork (허브) · **실행**: Claude CLI · **결재 default 자동** (반대 시에만 중단)
> **시안 출처**: `Dev/design/_zips/BDR-v2-9-대회상세-redesign-2026-06-09.zip` (BDR v2 (9), 2026-06-09 도착 · "확정본")
> **종류**: 타깃 단일 페이지 운영 박제 + BDR-current 역박제. **풀 Phase sync 아님** (sync-bdr-current.ps1 미사용)

---

## 0. 한 줄

운영 중 **대회 상세(진행 중 · 6팀 조별리그)** 페이지 재구성 시안을 `tournaments/[id]/page.tsx`에 박제.
**신규 라우트 0 / API·Prisma 0 변경 / UI(레이아웃·정보구조)만**. 데이터 패칭·탭·가드 전부 보존.

---

## 1. source / target

**시안 source** (8 파일, 풀어서 참고):
```
Dev/design/_zips/BDR-v2-9-대회상세-redesign-2026-06-09.zip
  └ BDR v2.29/_handoff-대회상세-redesign/
      HANDOFF.md                       ← 연동 가이드 (먼저 읽기)
      tournament-detail-redesign.html  ← 진입점 (브라우저로 시각 확인)
      td-redesign.jsx (422)            ← 레이아웃·컴포넌트·확정 기본값
      td-redesign.css (239)            ← tdr-* 전용 스타일
      shared.jsx / shell.css / tokens.css ← AppNav frozen + 토큰 (운영과 동일)
      tweaks-panel.jsx                 ← 데모용 (박제 시 제거)
```

**운영 타깃**:
```
src/app/(web)/tournaments/[id]/page.tsx           (923줄, 서버 컴포넌트 · Prisma 직접)
src/app/(web)/tournaments/[id]/_components/        (v2-tournament-hero / tournament-tabs / v2-registration-sidebar / v2-bracket-prediction / tournament-operator-preview / tournament-detail.css 등)
```

**BDR-current 역박제** (운영→시안 동기화 룰):
```
Dev/design/BDR-current/screens/TournamentDetail.jsx
Dev/design/BDR-current/screens/tournament-detail.css
```

---

## 2. 사전 점검 (옵션 A 자동)

1. `git branch --show-current` = subin / working-tree 클린
2. `git checkout dev && git pull origin dev && git checkout subin && git merge dev`
3. 운영 `page.tsx` 현재 구조 1회 통독 — 특히 **L287 `status==='completed'` 분기**(UB1 박제)와 **L749 V2TournamentHero / L793 `<aside>` 사이드바** 위치 확인
4. 결과 요약 → 이상 없으면 박제 진행 (사용자 반대 시에만 중단)

---

## 3. ★★ 핵심 함정 — 강조색 (사일런트 색 오류 방지)

시안 CSS와 확정값이 **불일치**한다. 그대로 카피하면 빨강으로 잘못 박힌다.

- `td-redesign.css` L5: `.tdr { --cta: var(--accent); ... }` → `--accent` = `--bdr-red` (#E31B23, **빨강**) = **CSS 폴백일 뿐**
- `td-redesign.jsx` L390: `TWEAK_DEFAULTS = { ..., accent: '#0F5FCC' }` / L402: `style={{ '--cta': t.accent }}` → **런타임 inline 으로 #0F5FCC 주입 = 실제 확정값**
- `tokens.css`: `--cafe-blue: #0F5FCC` (이미 운영 토큰에 존재)
- HANDOFF·수빈 메시지: **"강조색 #0F5FCC (밝은 블루)"** 확정

→ **박제 룰**:
- 강조색(탭 활성 `.on` / 필터칩 활성 / CTA 등) = **`var(--cafe-blue)`** 사용
- `#0F5FCC` 하드코딩 ❌ / `--accent`(빨강) ❌ / 신규 `--cta` 토큰 신설 ❌
- **승자 점수만** 의미색 `var(--bdr-red)` 고정 (이건 의도된 빨강)
- `td-redesign.css`의 `.tdr-vnav__item.on`(L66) / `.tdr-chip.on`(L88) `background/border: var(--cta)` → `var(--cafe-blue)` 로 치환

---

## 4. 박제 매핑 (시안 영역 → 운영 _component)

| 시안 영역 | 확정 스펙 | 운영 반영 |
|----------|----------|----------|
| Hero | **그라데이션** 톤 / compact | `v2-tournament-hero` 스타일 갱신 |
| 상단 탭 | 가로 **pill 탭** (활성 = `--cafe-blue`) | `tournament-tabs` (기존 5탭 유지: overview/bracket/schedule/teams/rules) |
| 경기일정(schedule) | 날짜 그룹 + **매치 카드**(팀로고·실점수·**승자 점수 빨강 `--bdr-red`**·`종료` 배지) + **팀별 필터칩** | schedule 탭 콘텐츠 |
| 대진표(bracket) | **stat strip**(참가팀·완료·진행중·라운드·우승상금) + **조별리그 A조/B조 순위표** | bracket 탭 콘텐츠 |
| 참가팀(teams) | **다크 팀 카드**(로고 + 창단연도 + 상세) | teams 탭 콘텐츠 |
| 우측 사이드바 | 운영자 화면 전환(관리자/사용자) · 진행중 상태카드(참가비·접수·정원) · **우승예측 투표**(준비 중 disabled) | `v2-registration-sidebar` + `v2-bracket-prediction` + `tournament-operator-preview` (isInsider) |
| 전용 스타일 | `tdr-*` | `tournament-detail.css` 에 병합 + **토큰화** (var(--*)) |
| 하단 액션 | `다른 대회 보기` | 유지 |

> 시안 jsx의 표시값(팀명·점수·순위)은 **mock**. 운영 page는 이미 Prisma 실데이터를 패칭 중이므로, **레이아웃·마크업만 교체하고 기존 실데이터를 그대로 와이어링**한다 (mock 값 박제 ❌).

---

## 5. 불변 — 반드시 보존 (회귀 0)

- ✅ **`status==='completed'` 분기 (L287~)** = UB1 종료 발표 카드 그대로. **재구성은 진행 중(비종료) 뷰 한정.**
- ✅ 모든 **Prisma 데이터 패칭** / `ALLOWED_TABS` 화이트리스트(L111) / `?tab=` 폴백 / 비공개 가드(`isTournamentInsider`) / SEO 메타(`generateMetadata`)
- ✅ **AppNav frozen** (03 룰) — `shared.jsx` AppNav 그대로, 재구성 ❌
- ✅ `GnbaRules` 조건부 렌더(`points_rule==='gnba'`) / `SeriesCard` / `Breadcrumb`
- ✅ 토큰만 사용 — 핑크/살몬/코랄 ❌ / lucide-react ❌ / Material Symbols / 9999px pill ❌

---

## 6. 제거 / 정리 (요청 반영)

- ❌ **Tweaks 패널** 제거 → 확정 기본값 **하드코딩**: Hero `그라데이션` / 밀도 `compact` / 강조 `--cafe-blue`
- ❌ **심판 배정 요청 버튼** 제거 (이미 시안에서 제거됨 — 운영에 잔존 시 같이 제거)
- ❌ mock 데이터 박제 금지 (§4 주석)

---

## 7. Stop Conditions (발동 시 즉시 중단 + 보고)

```
lint / tsc 실패 · 회귀 6 위반(AppNav) · DB schema 변경 · /api/v1 변경
· LOC > +2000 · mock 데이터 사용 · 사용자 결정 §1~§8 위반
· status==='completed' 분기 깨짐 · 데이터 패칭/탭 화이트리스트 변경
```

---

## 8. 자체 검수 (`claude-project-knowledge/06-self-checklist.md` + 회귀 4)

박제 후 전 항목 ✅:
- [ ] main bar 우측 = 검색/쪽지/알림/다크/햄버거 **5개** 순서 (더보기▼/RDM 아바타 노출 ❌)
- [ ] 모바일(≤768px) 다크 단일 아이콘 (듀얼 라벨 ❌)
- [ ] 검색·쪽지·알림 = `app-nav__icon-btn` (border/bg 박스 ❌)
- [ ] 강조색 = `--cafe-blue` 적용 / 승자 점수만 `--bdr-red` / **빨강 강조 오박 0**
- [ ] 진행 중 뷰 = 신규 레이아웃 / **종료 뷰(completed) = 무변경**
- [ ] 720px·1040px 반응형 (사이드바→스택 / 매치 2열→1열 / 탭 가로 스크롤)
- [ ] `npm run lint` + `npx tsc --noEmit` 통과
- [ ] 로컬 3001 — 진행 중 대회 1건 + 종료 대회 1건 둘 다 육안 확인

---

## 9. 완료 후

1. `subin` commit (`feat(ui): 대회 상세 진행중 뷰 재구성 박제 v2(9)`) + push
2. **BDR-current 역박제** — `screens/TournamentDetail.jsx` + `tournament-detail.css` 같은 신규 레이아웃으로 갱신 (같은 PR 또는 `design(sync): 대회상세 재구성 시안 박제` 별 commit)
3. PR `subin → dev` (머지는 STAGE A 일괄 처리 시점에)
4. `_handoff-대회상세-redesign/` 패키지 → `Dev/design/_archive/` 이동 (선택 · BDR-current 단일 폴더 룰)
5. `.claude/phase-ledger.md` + `scratchpad.md` 1줄 기록

---

## 10. CLI 한 줄 (수빈 → Claude CLI)

```
Read Dev/design/prompts/tournament-detail-redesign-bake-cli-prompt-2026-06-09.md 하고 §2 사전 점검부터 시작해줘.
강조색 = var(--cafe-blue) (§3 함정 주의) / status==='completed' 분기 보존 / 결재 default 자동 적용.
```

---

**의뢰서 끝.** 핵심 = ① 강조색 `--cafe-blue` (빨강 ❌) ② 종료 분기 보존 ③ 데이터·API 0 변경 UI만 ④ Tweaks·심판버튼 제거.
