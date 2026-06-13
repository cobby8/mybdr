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
