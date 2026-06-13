# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 10 정보페이지 박제 (v2.30) — §0 선택 sync → §2 사전점검(0스키마) → IU4→IU2→IU3→IU1→IA1 순서 박제
- **상태**: 🔵 진행 — 사전점검 일부 완료(zip 존재·subin 정합). §0 선택 sync 착수 예정
- **현재 담당**: PM → developer(시안별 박제)
- **시안**: `Dev/design/_zips/BDR-v2.30-phase10-info-2026-06-13.zip`, 의뢰서 `prompts/phase-10-v2.30-bake-cli-prompt-2026-06-13.md`
- **결재**: default 자동

## 진행 현황표
| # | 작업 | 상태 |
|---|------|------|
| Phase 10 정보페이지 | About/News/Help/Reviews/AdminNews 5시안 박제 | 🔵 진행 (§0 sync 착수) |
| 대회 삭제 기능 | Soft/Hard + cascade 7스텝 | ✅ `531bdef` 커밋(미푸시) |
| PR-PERM-DISPLAY | 권한/구독 2축 분리 | ✅ #673→#674(`157116c`) 운영 반영 |
| PR-RECORDER-AUDIT | 기록원 감사로그 + admin_role 가시화 | ✅ #670+HOTFIX #672 운영 반영 |
| ③ 대회종료 / ①-b 9C / ②·① | 박제·sync | ✅ 운영 반영 (이력 압축) |

## 기획설계 (planner-architect)
(대회삭제·knockout 설계 완료 — 완료 Phase 압축)

## 구현 기록 (developer)

### Phase 10 박제 #1 — IU4 Reviews (v2.30) (2026-06-14)

📝 구현: `/reviews` v3 → IU4 v2.30 UI 전면 교체 (평균 hero + 평점분포 chart + BG2 flag + 필터 chip 4종 + rv-card 세로스택)

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/reviews/_v2/reviews-content.tsx | StarRow→RatingStars(반별 Material Symbols), 2열헤더→info-hero, 정렬select→필터chip 4종(전체/높은순/사진/인증), 요약카드→rv-summary(평균+분포+BG2 flags 정적라벨), rv-card 세로스택. **Props·CourtReviewItem 인터페이스 무변경** | 수정 |
| src/app/globals.css | `--warn-soft: #FBEED2` 토큰 :root+다크 추가 / `.rv-*` 전체 + info-hero/page__inner 이식(--r-xs/sm→--radius-chip, --r-md→--radius-card 매핑) | 수정 |

- **0 변경 확인**: page.tsx(prisma.court_reviews 쿼리) 무수정 · schema 0 · api/v1 0 · 데이터 패칭 0
- **★ BG2 준수**: REVIEW_FLAGS = 평가 카테고리 정적 배열(바닥/조명/접근성/청결/주차/혼잡). court_reviews 세부 5컬럼(facility/accessibility/surface/lighting/atmosphere) 건수 계산·노출 0. "항목 종류만 · 개별 건수 비공개" 캡션 명시
- **추가 토큰**: `--warn-soft: #FBEED2` (시안 tokens.css L47 원본값 그대로 / 다크도 동일 — rv-flag--warn 텍스트 #8B5A0F 진갈색 가독성 유지)
- **helpful 처리**: helpful_count 컬럼 없음 → likes(=likes_count) 표기
- **tsc --noEmit**: ✅ EXIT 0

💡 tester 참고:
- 테스트: `/reviews` 진입 → 평균 평점 + 분포 5행 + flag chip(자주 언급) + 필터 4종 토글. "사진 리뷰"=photos>0만, "인증 방문"=verified만, "평점 높은순"=내림차순, "전체"=서버 최신순
- 정상: BG2 캡션 "항목 종류만 표시 · 개별 건수 비공개" 노출 / flag에 숫자(건수) 절대 없음
- 주의: 0건 / 필터결과 0건 빈상태 문구 분기, 다크모드 warn flag 가독성

⚠️ reviewer 참고: BG2 flags가 정적 라벨인지(개별 건수 누출 0) / --warn-soft 다크 동일값 처리 적절성

### Phase 10 박제 #2 — IU2 News (v2.30) (2026-06-14)

📝 구현: `/news` 매거진(E1) + `/news/match/[matchId]` 단신(E2) UI 전면 교체. IU4와 동일 패턴(서버 page.tsx 데이터 가공 → 클라 content 컴포넌트 / globals.css .nw-·.nm- 이식).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/news/_v2/news-content.tsx | **신규** 클라 컴포넌트. 카테고리 chip(전체/매치단신/매거진) + 트렌딩 spotlight(view 최다) + 카드 grid + NEW badge. period_type→cat 파생, 0건 chip 숨김 | 신규 |
| src/app/(web)/news/page.tsx | 서버 컴포넌트로 축소. where/select 무변경(take 60 단일 fetch로 전환·페이지네이션 제거). period_type→cat, created_at 7일내→isNew 판정, NewsItem[] 직렬화 후 NewsContent에 전달 | 수정 |
| src/app/(web)/news/match/[matchId]/page.tsx | UI만 .nm-* 시안 톤 교체(crumb/article/byline/스코어보드/cover/body/meta). **fetch(match·linkify·photos)·view증가·props 무변경**. 사진 0건 시 nm-cover placeholder, 있으면 기존 NewsPhotoHero/Gallery 유지 | 수정 |
| src/lib/news/linkify-news-body.tsx | `linkClassName?` prop 추가(미지정 시 기존 Tailwind 유지). news/match만 "linkify" 전달 → .nm-body a.linkify 스타일. **타 호출처(community 등) 영향 0** | 수정 |
| src/app/globals.css | `--accent-deep/--accent-hair/--bdr-navy` 토큰 :root+다크 추가(시안 tokens.css 값) / `.nw-*`+`.nm-*` 전체 이식(--r-xs/sm→--radius-chip, --r-md/lg→--radius-card 매핑) | 수정 |

- **0 변경 확인**: schema diff 0 · api/v1 0 · 데이터 패칭(쿼리 where/select·Promise.all·buildLinkifyEntries·view increment) 무변경
- **★ 운영 데이터 기반 카테고리(mock 금지)**: 시안 5종 chip 중 community_posts에 실존하는 종류만(전체/매치단신/매거진). period_type="match"→매치단신, round·daily→매거진. 공지/이벤트는 news 데이터 소스 없어 omit. 0건 chip 런타임 숨김(데이터 생기면 자동 노출)
- **★ NEW badge**: created_at 7일 이내 UI 판정(신규 컬럼 X). 서버에서 isNew 계산
- **★ cross-domain link 4종**: 팀→/teams(스코어보드), 대회→/tournaments(meta), 매치상세→/live(meta), 선수→/users(본문 linkify·buildLinkifyEntries player entry). 4종 모두 기존 헬퍼/라우트 사용
- **추가 토큰 3종**: --accent-deep(#B3141A)/--accent-hair(#F5C6C8)/--bdr-navy(#1B3C87). 색상 고정값이라 라이트·다크 동일(IU4 --warn-soft 방식). nw-tag--match=navy, nw-card hover=accent-hair/deep
- **tsc --noEmit**: ✅ EXIT 0

💡 tester 참고:
- 테스트 E1: `/news` 진입 → BDR NEWS 헤더 + chip(전체/매치단신/매거진, 데이터 따라 가변) + 트렌딩 spotlight(view 최다) + 카드 grid. chip 토글 시 클라 필터. 7일내 글 NEW badge
- 테스트 E2: `/news/match/[matchId]` → 단신 상세. 알기자 byline + 스코어보드(승팀 빨강) + 본문 내 팀/선수명 자동 link(.linkify) + 매치상세 link
- 정상: 발행 0건 시 "아직 발행된 기사가 없습니다" / chip 0건 종류 숨김 / 사진 없으면 nm-cover placeholder
- 주의: period_type=null인 기존 news 글은 magazine으로 분류됨(round/daily fallback). matchId 없는 글은 카드 클릭 시 /news 자기참조

⚠️ reviewer 참고: linkify-news-body.tsx linkClassName prop이 community 호출처에 영향 0인지(default 유지) / period_type→cat 파생이 mock 아닌 실데이터 기반인지 / 추가 토큰 3종 다크 동일값 적절성

## 테스트 결과 (tester)

### Phase 10 박제 #1 — IU4 Reviews 검증 (2026-06-14, 정적)

| # | 검증 항목 | 결과 | 비고 |
|---|----------|------|------|
| 1 | tsc --noEmit | ✅ PASS | EXIT 0, 에러 0 |
| 2 | ★★ BG2 개별 flag 건수 노출 0 | ✅ PASS | REVIEW_FLAGS=정적 카테고리 배열(바닥/조명/접근성/청결/주차/혼잡). court_reviews 세부5컬럼(facility/accessibility/surface/lighting/atmosphere) 집계·렌더 0. flag JSX에 숫자 없음. "항목 종류만 표시 · 개별 건수 비공개" 캡션 L209 존재 |
| 3 | 평점분포 chart + 평균 hero | ✅ PASS | dist=별5→1 5행 width=pct% 렌더. avg.toFixed(1) hero. total 0건 시 모두 0/0% 안전 |
| 4 | 필터 chip 4종 로직 정합 | ✅ PASS | top=b.rating-a.rating 내림차순(동점 최신순), photo=photos>0 필터, verified=verified 필터, all=서버 최신순 유지. 4종 모두 일치 |
| 5 | 코트 단일(4탭 아님) | ✅ PASS | page.tsx court_reviews 단일 소스, 4탭 UI 제거됨. 탭 없음 |
| 6 | ★ 데이터/패칭 무변경 | ✅ PASS | page.tsx HEAD 대비 diff 0(미수정). prisma.court_reviews 쿼리 그대로. CourtReviewItem 인터페이스·props 무변경 |
| 7 | 회귀 AppNav + 모바일 720 | ✅ PASS | reviews-content는 page 래퍼만, AppNav 미포함(web 레이아웃 자동). @media 720 1열 분기(rv-summary 1fr) 존재 |
| 8 | 디자인 위반 0 | ✅ PASS | lucide-react 0, pill 9999px 0(radius-chip=6px/다크2px, 아바타 50% OK), 핑크·코랄·살몬 0. hex 3건(#fff×2, #8B5A0F)은 기존 관례(#fff 60건)·선례(#C7E8D7/#5EEAA5 가독성 하드코딩) 범위 — 허용 |

📊 종합: 8개 중 8개 PASS / 0개 FAIL

비고: hex #8B5A0F(rv-flag--warn 텍스트)는 warn-soft 배경 가독성용 의도적 하드코딩(scratchpad 명시). #fff는 globals.css 표준 관례. 모두 토큰화 강제 대상 아님 — 수정 요청 없음.

### Phase 10 박제 #2 — IU2 News 검증 (2026-06-14, 정적)

| # | 검증 항목 | 결과 | 비고 |
|---|----------|------|------|
| 1 | tsc --noEmit | ✅ PASS | EXIT 0, 에러 0 |
| 2 | ★★ 데이터 패칭 무변경(정밀) | ✅ PASS | page.tsx git diff 정밀비교: **where**`{category:"news",status:"published"}`·**select**(id/title/content/created_at/view_count/likes_count/comments_count/tournament_match_id/tournament_id/period_type)·**orderBy**`{created_at:"desc"}` **3요소 완전 동일**. 변경=`Promise.all([findMany(skip/take 12),count])`→`findMany(take 60)` 단일+페이지네이션/count 제거. 결과 집합 내용·순서 동일, take↑(12→60)이라 **누락 0·중복 0**(12건 초과분 기존엔 2p 분리·이번엔 60건 한화면). 60건 초과 시만 61+ 미표시(기존도 페이지네이션 접근, 클라 chip 필터 요건상 단일fetch 합리). **데이터 의미 변질 없음** |
| 3 | match 상세 fetch 무변경 | ✅ PASS | match/[matchId] diff에 findMany/findUnique/where/select/orderBy/increment/buildLinkifyEntries/news_photo/match_id 라인 변경 **0**(UI 마크업만 .nm-* 교체). news_photo `where{match_id}`·`orderBy[{is_hero:desc},{display_order:asc}]` 유지. view_count increment 유지 |
| 4 | linkify linkClassName 영향 0 | ✅ PASS | optional prop, default=`text-[var(--color-accent)] hover:underline font-medium`(기존 Tailwind 동일). 호출처 3곳 중 admin-news-content·community 2곳 미전달→default 유지(영향0), news/match만 `"linkify"` 전달 |
| 5 | cross-domain link 4종 | ✅ PASS | 팀→/teams/{id}(스코어보드), 대회→/tournaments/{id}(meta), 매치상세→/live/{id}(meta), 선수→buildLinkifyEntries player→/users(본문 linkify). 4종 모두 기존 라우트/헬퍼 |
| 6 | NEW badge | ✅ PASS | created_at 7일내 서버 isNew 판정(신규 컬럼 X). nw-card__cover-tag UI만 |
| 7 | E1/E2 구조 | ✅ PASS | E1: chip(전체/매치단신/매거진)+트렌딩 spotlight(view 최다 reduce)+grid. E2: byline+스코어보드(승팀 is-win)+linkify. period_type→cat 파생(match→매치단신/그외→매거진), mock 0 |
| 8 | 회귀 AppNav + 모바일 720 + 0건 숨김 | ✅ PASS | content는 page__inner 셸만(AppNav 미포함·web 레이아웃 자동). nw-grid @media 분기. 0건 chip 숨김=`CATS.filter(c.key==="all"\|\|countByCat>0)` 동작 |
| 9 | 디자인 위반 0 | ✅ PASS | 신규 hex=토큰 3종(--accent-deep #B3141A/--accent-hair #F5C6C8/--bdr-navy #1B3C87, :root+다크 양쪽)+#fff 4건(흰글자 관례). 핑크·코랄·살몬 0, lucide 0, pill 9999px 0. Material Symbols만 |

📊 종합: 9개 중 9개 PASS / 0개 FAIL

비고: ★ 핵심 요청(데이터 패칭 변경)을 git diff 정밀비교로 검증 — where/select/orderBy 3요소 무변경, take 12→60 확대는 표시 누락/중복 유발 0, news_photo match_id join·view increment 유지. **데이터 의미 변질 없음 PASS**. 추가 토큰 3종 다크 동일값은 IU4 --warn-soft 선례 답습. 수정 요청 없음.

## 리뷰 결과 (reviewer)

### Phase 10 박제 #1 — IU4 Reviews (v2.30) (2026-06-14)

📊 종합 판정: ✅ **APPROVE** (critical 0 / major 0 / minor 1·후속) · 수정 요청 0 (대회삭제 압축)

✅ 잘된 점:
- **★★ BG2 준수 완벽** — REVIEW_FLAGS는 시안 `info-shared.jsx` L61 `window.REVIEW_FLAGS`와 1:1 일치하는 정적 라벨 배열(바닥/조명/접근성/청결/주차/혼잡). court_reviews 세부 5컬럼(facility/accessibility/surface/lighting/atmosphere) 집계·건수 렌더 코드 0. dist는 rating 단일컬럼 반올림 집계뿐 — 세부항목 건수 누출 경로 없음. "항목 종류만 표시 · 개별 건수 비공개" 캡션 L209 명시. **개별 flag 건수 노출 가능성 0 확인**
- **데이터 무변경** — git diff 2파일만(reviews-content.tsx +451/-403, globals.css +196). page.tsx(prisma court_reviews 쿼리) 무수정, CourtReviewItem/ReviewsContentProps 인터페이스 보존, schema/api/v1/패칭 0
- **--warn-soft 정합** — `#FBEED2` = 시안 tokens.css L47 원본값 정확 일치. 다크도 동일값(rv-flag--warn 텍스트 #8B5A0F 가독성). 시안 admin.css `.atm-pay--warn`/`.atm-status--pending`이 동일 `background:var(--warn-soft)+color:#8B5A0F` 패턴 → 시안 검증 조합 답습
- **시안→운영 라운딩 매핑 적절** — `--r-sm(4px)→--radius-chip(6px)` / `--r-md(6px)→--radius-card(10px)` 운영 표준 토큰 정규화. pill 9999px 0
- **13룰 통과** — rv-* 클래스 토큰 var(--*)만, lucide-react 0, Material Symbols Outlined만. AppNav 재구성·추가 0(web 레이아웃 자동, content는 page__inner 셸만)
- **참조 토큰 무결** — rv-* 사용 토큰(bg-elev/bg-head/ok-soft/cafe-blue-soft/cafe-blue-deep/border-strong 등) 전부 :root+다크 양쪽 정의
- **클래스명 충돌 0** — `.rv-*`/`.info-hero`/`.page__inner` 운영 전체 유니크(타 파일 grep 매칭은 부분문자열 오탐)
- **필터·빈상태·접근성** — top(높은순,동점=최신순)/photo/verified 정합. 0건/필터0건 빈상태 분기 정상. chip `<button type="button">` 시맨틱

🟡 권장 수정 (minor·후속·동작영향 0):
- [globals.css:5285 `.rv-chip.is-on`] 하드코딩 `#fff` 잔존. tester가 #fff 60건 기존관례·선례 범위로 허용 판정 → reviewer 동의. 활성칩 배경=var(--ink)(어두움)이라 흰글자 가독성 정상. 토큰화 강제 대상 아님, 후속 검토

### Phase 10 박제 #2 — IU2 News (v2.30) (2026-06-14)

📊 종합 판정: ✅ **APPROVE** (critical 0 / major 0 / minor 2·후속) · 수정 요청 0

✅ 잘된 점:
- **★ 데이터 패칭 변경 정당성 확인** — git diff HEAD 정밀비교: where`{category:"news",status:"published"}`·select(동일 12컬럼)·orderBy`{created_at:"desc"}` **3요소 완전 동일**. 변경점 = ①`skip/take 12` 페이지네이션→`take 60` 단일 fetch ②`count()` 제거. 카테고리 chip이 **클라 필터**라 전체 후보를 한 번에 받아야 하는 구조적 필요(서버 페이지네이션과 양립 불가). 60건 상한 명시(시안 규모). 누락0·중복0·순서 동일 — API/route/schema 0 변경. **박제 원칙 위반 아닌 합리적 전환(major 아님)**
- **linkify prop 하위호환 완벽** — `linkClassName?` optional, 미지정 시 `?? "text-[var(--color-accent)]…"` 기존 Tailwind 유지. 타 호출처 3곳 검증: community/[id](미전달), admin-news-content(className만), news/match(신규 "linkify"). **community/admin 영향 0**
- **★ period_type 파생 = 실데이터(mock 0)** — schema `period_type String? //"match"|"round"|"daily"` + auto-publish-match-brief.ts L382가 `"match"` 기록 확인. 파생 `match→매치단신 / round·daily·null→매거진` 합리적, null 기존 글 magazine 안전 fallback. 공지/이벤트 omit + 0건 chip 런타임 숨김(`countByCat>0`) — mock 금지 준수
- **★ 추가 토큰 3종 시안 정합** — `--accent-deep:#B3141A`=시안 `--bdr-red-ink:#B3141A`(시안은 별칭이나 최종값 동일), `--accent-hair:#F5C6C8`·`--bdr-navy:#1B3C87` 시안 동일. 3종 라이트·다크 동일값(색상 고정, IU4 --warn-soft 방식). :root+다크 양쪽 정의(L56-58/L172-174)
- **13룰 통과** — pill 9999px 0(globals 9999px 3건은 전부 "금지" 주석·News 무관), lucide 0(Material Symbols만), var(--*)만, 핑크·코랄·살몬 0. 720px 분기 존재
- **AppNav frozen** — news-content는 `.page>.page__inner` 셸만, AppNav 재구성·import 0
- **cross-domain 4종 안전** — 팀→/teams/{id}(id 없으면 `"#"` 폴백), 대회→/tournaments/{id}(존재 시만), 매치상세→/live/{id}, 선수→linkify(buildLinkifyEntries). matchId 없는 카드 `/news` 자기참조(깨진 링크 방지). 모두 기존 라우트
- **보안(XSS) 안전** — dangerouslySetInnerHTML 0. linkify는 content.split(regex)→React 노드(자동 escape)+escapeRegex 특수문자 안전화. HTML 직접 주입 경로 없음
- **클래스 충돌 0** — `.nw-*`/`.nm-*` 운영 전역 유니크(globals+news 코드+시안 info-shared.css만, 타 운영 0). BigInt 직렬화 안전(.toString())

🟡 권장 수정 (minor·후속·동작영향 0):
- [news-content.tsx:82 `rest = rows.filter(n => n !== spotlight)`] 객체 참조(!==) 비교. spotlight가 reduce로 rows 내 동일 참조 반환→현재 정상. 단 `n.id !== spotlight.id`가 의도 명확·견고. 동작 영향 0
- [globals.css:5411/5417/5454 `#fff`] nw-cat.is-on/new tag 흰색 하드코딩. IU4 동일 관례(어두운 배경 위 흰글자). tester #fff 관례 범위 → 동의. 토큰화 강제 대상 아님

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| reviewer | tournament-completed-bracket.tsx (L274 qual 정렬) | [minor·후속] 조내 정렬 승수만 — 승점룰(gnba) 미세 순위차 가능. 조별 동일경기수면 무해 | 후속 검토 |
| reviewer | admin/notifications/page.tsx | [minor·후속] `as FormEvent` 단언 → handleSubmit 시그니처 완화로 캐스팅 제거 가능. 동작영향0 | 후속 검토 |

## 완료 Phase (이력 압축)
- ✅ **대회 삭제 기능 (2026-06-14, `531bdef`)** — admin 대회관리 "대회 삭제" 활성화. Soft(status=cancelled·복구가능) 기본 / super_admin 한정 Hard(?hard=1·완전삭제). route.ts Hard=cascade 7스텝 $transaction(pbp/스탯/라인업→매치→ttp/팀→사이트섹션/페이지/사이트→운영진/대진버전/종별규칙→tournament→series카운터, timeout 30s)·NoAction FK 명시삭제·Cascade자식 자동·P2003 409안전망. page.tsx isSuperAdmin(session) 헬퍼 통일. 이름입력검증 모달·super_admin 2차가드(?hard=1 직접호출 403). schema/v1 변경0·tsc0. tester PASS6/6·reviewer APPROVE(c0/maj0/min2반영). 실DB Hard삭제 미실행(운영안전). +379/-18 5파일
- ✅ **결선 knockout 중복방지+자동등록 설계 (2026-06-14, read-only)** — `Dev/knockout-auto-schedule-plan-2026-06-14.md`. 근본원인=조무시 시드(seeding.ts:19/:128)+가드 round_number단독(우회). PR 8개 2Sprint(S1 가드강화·2개조 throw차단 / S2 group_cross generator). 코드0·DB0. **Sprint1 착수 결재 대기**
- ✅ **PR-RECORDER-AUDIT (2026-06-12, `a897b22`+HOTFIX `e3d757e`)** — recorders adminLog 3지점 add-only + /admin/users admin_role 칩. apiSuccess snake_case 함정 HOTFIX(재발6회). PASS·APPROVE
- ✅ **①-b Phase 9C 박제 (2026-06-12, `cb88c7a`+`8aeb050`+`b759d2d`)** — 9C-1/3/4(9C-2 스킵). 동기화배너/messages 준비중/admin 발송UI. DB/api/role 0변경
- ✅ **③ 대회종료 B안 (2026-06-10~12, `ecca28d`+`7d6f89c`)** — pill탭 재현. 격리=혼합(TournamentTabs 재사용+종료전용 복제). 진행중뷰 회귀0. NBA승자 견고화
- ✅ **② 대회상세 리스킨 (`a9cb476`+`508325a`)** / ① Phase 9 sync (`fb81e53`) / PR-MYBDR-SOCIAL(`72eb2df`) / Phase 8C / Phase 1~7

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-14 | **Phase 10 박제 #2 IU2 News 검증** (tester) | ✅ PASS 9/9. ★데이터패칭 정밀: where/select/orderBy 무변경·take 12→60(누락/중복0)·news_photo join+view increment 유지=의미변질0. linkify default 영향0·cross-domain 4종·디자인위반0·tsc0. 수정요청 없음. 미커밋 |
| 2026-06-14 | **Phase 10 박제 #2 IU2 News** (developer) | ✅ /news+/news/match UI 교체. news-content.tsx 신규(chip/spotlight/NEW badge)+page.tsx 서버축소+match UI .nm-*+linkify linkClassName prop+globals.css .nw-/.nm-·토큰3종. schema/api/패칭 0·cross-domain 4종(teams/tournaments/live/users)·tsc0. 미커밋 |
| 2026-06-14 | **Phase 10 박제 #1 IU4 Reviews 검증** (tester) | ✅ PASS 8/8. tsc0·BG2건수노출0(정적라벨+캡션)·필터4종정합·page.tsx diff0·AppNav/720회귀0·디자인위반0(hex 관례범위). 수정요청 없음. 미커밋 |
| 2026-06-14 | **Phase 10 박제 #1 IU4 Reviews** (developer) | ✅ reviews-content.tsx UI 교체(필터chip4/평점분포/BG2 flag) + globals.css `--warn-soft`+`.rv-*`. Props·schema·api·패칭 0변경. BG2 건수노출0. tsc0. 미커밋 |
| 2026-06-14 | **대회 삭제 기능** (dev/tester/reviewer/pm·되돌림1회) | ✅ `531bdef` Soft/Hard cascade 7스텝. PASS6/6·APPROVE(min2반영). schema/v1 0·tsc0. +379/-18. 미푸시1 |
| 2026-06-14 | **결선 knockout 중복방지+자동등록 설계** (planner) | ✅ read-only 설계. PR 8개 2Sprint. Sprint1 결재대기. 코드0·DB0 |
| 2026-06-13 | **PR-PERM-DISPLAY 권한/구독 2축 분리** (pm) | ✅ `e98e611`→#673→#674 운영. 표시로직만·DB0·+12/-6·tsc0 |
| 2026-06-13 | **Phase 10 Claude.ai paste 준비 + 세션정리** (pm) | ✅ 첨부4건 drag-drop + 회신문구. 미push0 확인 |
| 2026-06-13 | **PR-RECORDER-AUDIT HOTFIX snake_case** (pm) | ✅ `e3d757e` recorders/page.tsx 3곳. apiSuccess함정 재발6회. +7/-5 |
| 2026-06-12 | **PR-RECORDER-AUDIT 감사로그+admin_role** (dev/tester/reviewer/pm) | ✅ `a897b22`→#670 main. PASS5/5·APPROVE. +92/-7 |
| 2026-06-12 | **①-b Phase 9C 박제+커밋** (dev/tester/reviewer/pm) | ✅ 9C-1/3/4·3커밋. PASS·APPROVE |
| 2026-06-12 | **③ 대회종료 B안 박제 커밋** (pm) | ✅ `ecca28d`+`7d6f89c`+`4dbc833` |
| 2026-06-12 | **③ NBA 승자판정 견고화** (dev/tester·되돌림1회) | ✅ teamId 직접비교+점수폴백. 진행중뷰 회귀0 |
| 2026-06-10 | **③ 대회종료 B안 박제+검증+설계** (planner/dev/tester/reviewer) | ✅ 신규5+수정3·회귀게이트 통과 |
