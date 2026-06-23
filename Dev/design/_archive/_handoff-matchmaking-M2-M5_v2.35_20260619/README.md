# Handoff: 매칭 고도화 M2~M5 UI (시안 A~D)

> BDR v2.35 · 2026-06-19 · 코워크(Claude Code) 구현용 핸드오프 패키지
> 동봉: `DATA-BINDING.md`(데이터 계약) · `design-files/`(HTML 시안 원본)

## 변경 요약 (v2.34 → v2.35) — 룰 위반 수정 리비전
감사(06 자체검수 + 13룰) 지적 반영. 시안 의도·레이아웃·데이터 계약은 그대로 보존.

**P0 (필수)**
- `GameReport.jsx` 운영 특이사항 textarea placeholder → `경기 후기를 남겨주세요` (5단어 이내·"예:" 제거. 사용자 결정 §B / 룰 12).
- `MyActivity.jsx` 상단 카운터(인라인 `repeat(4,1fr)`) → `.mya-counters` 클래스 + 컴포넌트 내 `<style>`에 `@media(max-width:720px)` `!important` 2칸 분기. 인라인 우선 문제 해소(06 §5).
- `Profile.jsx` 시즌 스탯(인라인 `repeat(6,1fr)`, 분기 없음) → `.stats-strip` 클래스 + 기존 `<style>`에 ≤720px 3칸(2행)·행 경계 정리. 6칸 압축 제거.

**P1 (토큰화 권장)**
- `GameReport.jsx` mock 유니폼색 `#DC2626`/`#0F5FCC` → `var(--bdr-red)`/`var(--cafe-blue)`. 알파 합성은 `p.color+'22'` → `color-mix(in oklab, … 13%, transparent)`로 토큰 호환.
- on-brand 흰 텍스트 `#fff` → `var(--ink-on-brand)` (`GameReport`/`MyActivity` 칩·별점, `GameDetail` 출석 토글·미리보기 세그). `--warn` 위 `#000`은 대응 토큰 없어 유지.

**확정**
- 매너 등급 4단계 임계값: ≥4.5 아주 좋음 / 4.0–4.4 좋음 / 3.0–3.9 보통 / <3.0 주의 필요 — 확정. 라벨·색 토큰 유지.

**보존(미변경)**
- AppNav(`components.jsx`) frozen / 신뢰 카드 `manner_score` 숫자 비노출(등급 라벨만) / HeroCard 점수 미노출 / GameDetail "시안 미리보기" 점선 바 / 대기열 "알림 후 수동 승격" 정책.
- `MyRegistrationStatus.jsx`(`.reg-counters` ≤720px 2칸) · `Profile.jsx`(`.profile-hub-grid`/`.trust-grid` ≤720px) — 기존 `!important` media 분기로 이미 준수, 변경 없음. `GameDetail.jsx:88` 정보 그리드(2칸)는 모바일 저위험 — 점검만, 변경 없음. `responsive.css` 미변경(분기는 컴포넌트 `<style>`에 co-locate).

## Overview
픽업/게스트 경기 매칭 루프 고도화. 4개 sub-UI를 기존 MyBDR 화면에 얹는다.
- **A (M5)** 경기 목록 찾기 UX — 정렬·빠른 필터 칩·상태 뱃지·진행률·빈 상태
- **B (M2)** 대기열(Waitlist) — 정원 마감 시 대기 신청 → 알림 후 **수동** 승격(확정 카운트다운)
- **C (M3)** 호스트 출석 체크 + 리포트 출석/노쇼 구분
- **D (M4)** 종료 경기 평점 CTA 배너 + 프로필 신뢰 카드(매너 등급 라벨)

## About the Design Files
`design-files/` 안의 HTML/JSX는 **디자인 레퍼런스**입니다 — 의도한 외관·동작을 보여주는 프로토타입이지, 그대로 가져다 쓰는 프로덕션 코드가 아닙니다. React + Babel(브라우저 트랜스파일) + 전역 스코프 컴포넌트로 된 시안 환경이며, 운영 코드베이스(Next.js `src/`)의 기존 패턴·컴포넌트·라우팅으로 **다시 구현**해야 합니다. 토큰·클래스 값은 픽셀 정확도 기준으로 그대로 쓰세요.

열어보기: `design-files/MyBDR.html` 를 브라우저로 열고 `?route=games` / `?route=gameDetail` / `?route=myRegistrations` / `?route=profile` / `?route=myActivity` / `?route=gameReport` 쿼리로 각 화면 확인.

## Fidelity
**High-fidelity.** 최종 색상·타이포·간격·인터랙션 확정. 운영 디자인 토큰(`tokens.css` = 02-design-system-tokens)을 그대로 사용해 픽셀 정확하게 재현. 단 **데이터·상태 전환은 mock** — 실제 바인딩은 `DATA-BINDING.md` 참조.

## 박제(고정) 규칙 — 반드시 준수
- **AppNav frozen**: 헤더(9탭/utility bar/우측 5컨트롤/다크 토글/더보기 5그룹)는 `03-appnav-frozen-component.md` 코드 그대로. 재구성 금지. 이번 작업에서 `components.jsx` 의 AppNav 미수정.
- **토큰만 사용**: 하드코딩 hex 금지(`var(--*)`/`color-mix`). 핑크·살몬·코랄 금지. `lucide-react` 금지(Material Symbols 또는 검증된 이모지). pill `9999px` 금지(`--radius-chip`/`--radius-card` 사용).
- **모바일**: 720px 분기 / iOS input 16px / 버튼·토글 44px 터치 타깃.
- **placeholder**: 5단어 이내, "예:" 시작 금지.

---

## Screens / Views

### A. GamesList — `screens/Games.jsx` (운영 `/games`)
**Purpose**: 같이 뛸 경기를 정렬·필터로 빠르게 찾는다.
**Layout**: `.page`(max 1200px) 단일 컬럼.
- 헤더 row: 좌측 eyebrow+제목+서브텍스트 / 우측 [정렬 버튼][만들기 버튼] (`display:flex; justify-content:space-between; flex-wrap:wrap; gap:16px`).
- kind 탭 row: 전체/픽업/게스트/연습, `border-bottom:1px var(--border)`, 활성 탭 `border-bottom:3px var(--cafe-blue)`, 카운트는 mono 11px var(--ink-dim).
- 빠른 필터 칩 row: `display:flex; gap:8px; overflow-x:auto` (가로 스크롤, 다중 토글).
- 카드 그리드: `grid; gridTemplateColumns: repeat(auto-fill, minmax(320px, 1fr)); gap:14px`.

**Components**:
- **정렬 컨트롤** — 데스크톱: `.btn.btn--sm` "정렬 · {임박순|모집임박순|최신순}" + caret. 클릭 시 우측 정렬 메뉴(`position:absolute; min-width:200px; .card; box-shadow:var(--sh-lg)`). 모바일(≤720px): 라벨 숨기고 ⇅ 아이콘만, 메뉴는 **하단 시트**(`position:fixed; left/right/bottom:0; border-radius:var(--radius-card) var(--radius-card) 0 0`, grip + 제목). 항목 44px(모바일 14px padding). 옵션 "가까운순"은 좌표 데이터 있을 때만 — 현재 시안엔 미포함, 서버 `sort_options` 메타로 제어.
- **빠른 필터 칩** `.games-chip` — `padding:7px 14px; border-radius:var(--radius-pill); background:var(--bg-card); border:1px var(--border); color:var(--ink-soft); font:600 13px`. active `[data-active=true]`: `background:var(--cafe-blue); color:#fff`. hover `background:var(--bg-alt)`. 5종: 오늘 / 이번 주말 / 내 동네 / 모집임박 / 무료. 1개+ 선택 시 "초기화 ✕" 칩(투명) 노출.
- **경기 카드** `.card` (padding:0, overflow:hidden, flex-column):
  - 상단 4px 컬러 바 — kind 색: pickup `var(--cafe-blue)` / guest `var(--bdr-red)` / scrimmage `var(--ok)`.
  - 본문 16/18px padding: 뱃지 row(kind 뱃지 채움색 + 상태 뱃지 + area mono), 제목(700 15px), 정보 그리드(`gridTemplateColumns:68px 1fr` 장소/일시/레벨/비용 — 무료는 `var(--ok)` 700), 태그 칩.
  - 푸터(`border-top:1px dashed var(--border)`): 좌측 host + `applied/spots`(mono 700), 진행률 바(height:4px, `background:var(--bg-alt)`, fill width=`fill_pct%`). 80%+ 또는 closing → fill `var(--accent)`. 마감 → fill `var(--ink-mute)`. 우측 [신청] 또는 마감 시 [대기 신청]/[마감].
  - **상태 뱃지 매핑**: `is_full && 대기허용` → "대기 가능"(`.badge--soft`) / `is_full` → "마감"(`.badge--ghost`) / `is_filling`(≥70%) → "마감임박"(`.badge--red`) / else "모집중"(`.badge--ok`).
- **빈 상태** — 결과 0건: `.card` 중앙정렬, 🔍 + "조건에 맞는 모집이 없어요" + 서브 + CTA 2개([맞춤필터 끄기]=`.btn--primary` 칩 리셋 / [인접 지역 보기]=near 칩 해제+탭 all).

---

### B. 대기열 — `GameDetail.jsx`(신청 패널) + `MyRegistrationStatus.jsx`(신규) + `Games.jsx`(카드 뱃지)
**확정 정책: 알림 후 수동 승격 (자동 아님).**

**GameDetail 신청 패널** (`ApplyPanel`, 우측 sticky aside 340px):
상태머신 — `registration.status` + 정원으로 분기:
- `open` 모집중: 신청자 정보 카드 + 한마디 textarea + 동의 체크 + `[신청하기 · {fee}]`(.btn--primary.btn--xl).
- `full` 정원 마감: "정원이 찼어요…" + `[대기 신청 · 현재 N명]`(`.btn--accent.btn--xl`) + "대기는 무료" 안내.
- `waiting` 대기중: 큰 순번 숫자(display 900, `var(--warn)`) + "대기 N번" + `[대기 취소]` + "알림 받으면 30분 안에 확정" 안내.
- `promoted` 승격: 강조 박스(`color-mix(in oklab, var(--accent) 10%, transparent)`, `border-left:3px var(--accent)`) "🔔 자리가 났어요" + **카운트다운**(`CountdownText`, MM:SS) + `[참가 확정하기]`(.btn--primary.btn--xl) + "시간 초과 시 다음 순번" 안내. 클릭 시 `WaitlistPromoteModal`.
- `confirmed` 확정: ✓ 원형 배지(`color-mix var(--ok) 16%`) + "참가 확정 완료" + "3시간 전까지 취소".
- 패널 상단: 진행률 바(height:8px) + "{remain}자리 남음" 또는 "정원 마감 · 대기 N".

**WaitlistPromoteModal** (승격 확정 모달, `MyRegistrationStatus.jsx`에 정의·export):
- backdrop `rgba(0,0,0,.55)`, `.card` max-width 400.
- 헤더(`color-mix var(--accent) 12%`): "🔔 자리가 났어요" + 경기명 + 코트·시간.
- 본문: "확정 마감까지" + 카운트다운(`var(--accent)`) + 안내문 + `[참가 확정하기]`(.btn--primary.btn--xl) + `[다음에 하기]`.

**CountdownText** (공유 컴포넌트): `seconds` prop, 1초 setInterval, MM:SS mono 700. **표시용** — 확정 가부는 서버 `promotion_deadline` 판정(DATA-BINDING §2-2, §5).

**MyRegistrationStatus** (신규 화면, 운영 `/my/registrations`):
- breadcrumb(프로필 › 내 신청 현황) + 제목.
- 승격 알림 배너(promoted 1건+): `border-left:3px var(--accent)` + 🔔 + `[확정하기]`.
- 카운터 4칸(`grid repeat(4,1fr)`, ≤720px 2칸): 확정/확정 대기/대기중/신청완료 — 각 `.card` `border-top:3px {tone}`, display 숫자 900.
- 신청 리스트 `.card`: 행 `grid 40px 1fr auto`, `border-left:3px {accent}`. kind 이모지 + 상태 뱃지 + (waiting:"대기 N번" warn / promoted:카운트다운) + 시간 + 제목 + 코트 + 우측 액션 버튼. ≤720px: `grid 32px 1fr`, 액션 full-width.
- 상태 뱃지: promoted `.badge--red` / waiting `.badge--warn` / confirmed `.badge--ok` / applied `.badge--soft`.

**Games 카드 뱃지**: 정원 마감 경기 → "대기 가능"/"마감"(위 A 매핑).

---

### C. 출석 — `GameDetail.jsx`(호스트 출석 섹션) + `GameReport.jsx`(출석/노쇼 구분)
**호스트 전용.** 노출 조건: `me === game.host_id && game.status >= 2`(확정~완료).

**호스트 출석 체크 섹션** (GameDetail, 신규 패턴):
- `.card`, 제목 "출석 체크" + "호스트 전용"(`var(--accent)` 11px) + 우측 카운터(출석 N `var(--ok)` / 미출석 N `var(--warn)` / 저장중).
- 안내: 당일="현장에서 출석 확인" / 종료="미출석=리포트 노쇼".
- 참가자 행 `grid 40px 1fr auto`: 아바타 + 닉네임/레벨·포지션 + **출석 토글**.
- **출석 토글** `.att-toggle`: `inline-flex; border:1px var(--border); border-radius:var(--radius-pill)`. 버튼 2개 [출석][미출석], `min-height:44px; padding:0 16px; font:700 13px`. active present → `background:var(--ok); color:var(--ink-on-brand)` / active absent → `background:var(--warn); color:#000`(on-warn 토큰 없음, 유지). 저장: 낙관적 업데이트(`PUT /attendance`), 0.5s 저장중 표시.

**GameReport 출석/노쇼 구분** (기존 폼 보존 + 레이어):
- 선수별 평가 섹션 헤더에 범례(출석 N `var(--ok)` dot / 노쇼 N `var(--warn)` dot).
- 각 선수 행: `noshow` 면 `opacity:.68`, 닉네임 옆 뱃지 출석(`.badge--ok`)/노쇼(`.badge--warn`), 노쇼는 **MVP 버튼 disabled**.
- 기존 구조(전체 평점·MVP·동행자 평점·신고 플래그 5종) 그대로. 출석 레이어만 추가. 초기 noshow 목록 = attendance.absent prefill.

---

### D. 평점 — CTA 배너(`GameDetail.jsx`/`MyActivity.jsx`) + 신뢰 카드(`Profile.jsx`)

**평점 CTA 배너** (종료 경기 한정, 미작성 시):
- `.card` `border-left:3px var(--accent)`, `background:color-mix(in oklab, var(--accent) 7%, transparent)`.
- ⭐ + "끝난 경기 평점을 남겨주세요" + "평점은 매너 점수에 반영 · 미작성 N건" + `[평점 남기기 →]`(.btn--primary).
- 노출: `game.status===3 && !my_rating.exists`. 작성 완료 시 사라짐. GameDetail 종료 단계 + MyActivity 상단 동일 배너.

**프로필 신뢰 카드** (`Profile.jsx`, HeroCard와 **별도**):
- §3 보존: HeroCard 는 레이팅/점수 미노출 그대로. 신뢰 stat은 본문 별도 카드에만.
- `.card`, 제목 "신뢰" + "함께 뛰기 좋은 상대" + "활동 기록 →".
- 3칸 그리드(`1.4fr 1fr 1fr`, 테두리 분할, ≤720px 2칸·등급 full-width):
  1. **매너 등급** — `manner_score` 숫자 비노출, **등급 라벨만**. dot + 라벨(800 18px {tone}) + 4단계 진행 막대.
  2. **MVP N회** — display 900 24px.
  3. **참여 N경기** — display 900 24px.
- `has_ratings===false` → "아직 기록 없음" 빈 상태.
- **등급 매핑** (시안 제안, PM 확정 대기): ≥4.5 아주 좋음(`--ok`) / 4.0–4.4 좋음(`--cafe-blue`) / 3.0–3.9 보통(`--ink-mute`) / <3.0 주의 필요(`--warn`).

---

## Interactions & Behavior
- **카드 클릭** → GameDetail. **빈 상태 CTA** → 필터 리셋.
- **정렬 메뉴**: 데스크톱 드롭다운(바깥 클릭 닫힘 오버레이) / 모바일 하단 시트. 선택 시 즉시 재정렬·닫힘.
- **칩**: 다중 토글, AND 결합. `near`/`weekend`/`today`는 데이터 파생(좌표·요일·당일 플래그).
- **대기 신청 흐름**: full→[대기 신청]→waiting(순번). 서버 빈자리 발생 → 대기 1번 알림 + `promotion_deadline=now+30m` → promoted → [확정]→confirmed. 무응답·만료 → 다음 순번. **자동 승급 없음.**
- **카운트다운**: 클라 setInterval 표시용. 확정 POST는 서버가 deadline 검증(만료 시 410 + 다음 순번).
- **출석 토글**: 낙관적 업데이트 + 저장중 → 실패 시 롤백. 호스트 권한 게이트.
- **transition**: 칩/버튼 `all .12s`, caret `transform .15s`. (`prefers-reduced-motion` 존중 권장.)
- **반응형**: GameDetail 2컬럼 → ≤900px 단일(aside static). 정렬 ≤720px 시트. 카운터/신뢰 그리드 ≤720px 축소.

## State Management
시안 로컬 state(구현 시 서버/쿼리로 대체):
- Games: `tab`, `chips[]`, `sort`, `sortOpen`.
- GameDetail: `phase`(미리보기용·**박제 시 제거**, 실제=game.status), `applyState`(=registration.status), `isHost`(=권한), `rated`, `promoOpen`, `attendance{}`, `savingAtt`.
- MyRegistrationStatus: `items[]`(=GET /me/registrations), `promo`.
- 데이터 페칭·status·필드·API: **`DATA-BINDING.md` 전체** 참조.

## Design Tokens (tokens.css = 02-design-system-tokens, dual theme)
**색상(라이트/다크 자동)**: `--accent`(#E31B23 BDR Red) · `--cafe-blue`(#0F5FCC / dark #3B82F6) · `--ok`(#1CA05E) · `--warn`(#E8A33B) · `--danger`(#E24C4B) · `--bg`/`--bg-elev`/`--bg-card`/`--bg-alt`/`--bg-head` · `--ink`/`--ink-soft`/`--ink-mute`/`--ink-dim` · `--border`/`--border-strong`/`--border-hard`. **하드코딩 금지.**
**라운딩**: `--radius-card`(라이트 10px / 다크 0) · `--radius-chip`(6px / 2px). 버튼·뱃지=chip, 카드=card. pill 999는 토글/칩 트랙 한정.
**그림자**: `--sh-xs/sm/md/lg` (라이트 soft / 다크 hard offset).
**간격**: `--s-1`~`--s-20`(4·8·12·16·20·24·32·40·48·64·80). gutter 24, maxw 1200.
**타이포**: body `Pretendard`/Noto Sans KR · display `Archivo`/Bebas · mono `JetBrains Mono`. fs-h1 28 / body 14 / micro 11 (라이트). display 900 letter-spacing -0.01em.
**컴포넌트 클래스**: `.btn`(+`--primary`/`--accent`/`--ghost`/`--sm`/`--lg`/`--xl`) · `.badge`(+`--red`/`--blue`/`--soft`/`--ok`/`--warn`/`--ghost`) · `.card` · `.input`/`.textarea` · `.eyebrow` · `.page`. 다크 테마는 브루탈리즘(테두리 2px·라운드 0·display 폰트 대문자) 자동 적용 — 새 컴포넌트도 `[data-theme="dark"]` 분기 따를 것.

## Assets
신규 이미지·아이콘 없음. 아이콘은 인라인 SVG(`Icon` 객체, `components.jsx`) + 검증된 이모지(🏀🤝🆚🔔⭐✓). 운영 구현 시 Material Symbols Outlined 또는 기존 아이콘 시스템 사용. 아바타는 이니셜(닉네임 2글자) 플레이스홀더.

## Files (design-files/)
- `MyBDR.html` — 앱 셸·라우팅. 스크립트 로드 순서/`?route=` 분기 참고.
- `screens/Games.jsx` · `GameDetail.jsx` · `MyRegistrationStatus.jsx`(신규) · `GameReport.jsx` · `Profile.jsx` · `MyActivity.jsx`
- `tokens.css` · `responsive.css` — 디자인 토큰·반응형(운영 정합).
- `components.jsx` · `components-global.jsx` — AppNav(frozen)·Icon·Avatar·공유 컴포넌트.
- `data.jsx` · `extras-data.jsx`(GAMES) · `community-data.jsx` — mock 데이터(실 스키마는 DATA-BINDING).
- `../DATA-BINDING.md` — **status 코드·테이블 필드·API·엣지 케이스 (구현 필독)**.

## 구현 검증 체크 (코워크)
- [ ] AppNav 7룰 회귀 없음(우측 5컨트롤·다크 PC듀얼/모바일단일·아이콘 border 없음).
- [ ] 신규 코드 하드코딩 hex 0 / pill 9999 0 / lucide 0.
- [ ] 모바일 720 분기·44px 토글·iOS 16px input.
- [ ] 대기 승격: 자동 아님(알림→수동 확정), 서버 deadline 판정.
- [ ] 출석 absent→리포트 noshow prefill.
- [ ] manner_score 숫자 비노출(등급 라벨만), HeroCard 점수 미노출 유지.
- [ ] GameDetail "시안 미리보기" 점선 바 제거.
- [ ] status 코드·필드명 운영 스키마와 대조(DATA-BINDING §0 경고).
