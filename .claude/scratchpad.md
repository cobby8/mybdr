# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 8 Auto Chain — v2.28 sync + Phase 8C 박제 8 PR (코트·장소)
- **상태**: 🔵 진행 중 — §2 통과 / sync v2.28 ✅ / 8C 박제 진행
- **현재 담당**: pm → developer
- **의뢰서**: `Dev/design/prompts/phase-8-auto-chain-cli-prompt-2026-06-07.md`

### Phase 8C 진행 (8 PR / ★ 3측 stakeholder)
| PR | 시안 → 운영 | 상태 |
|----|------|------|
| 8C-1 | VP1 PartnerAdmin → /partner-admin (BV4) | ⏳ |
| 8C-2 | VU4 VenueDetail → /venues/[slug] 보강 (BV8) | ✅ |
| 8C-3 | VP2 PartnerVenue → /partner-admin/venue (BV5) | ✅ |
| 8C-4 | VP3 PartnerCampaigns → /partner-admin/campaigns (BV6) | ⏳ |
| 8C-5 | VU1 Courts → /courts 보강 (BV1) | ⏳ |
| 8C-6 | VA1 AdminCourtsPartners → /admin/courts + /admin/partners (BV7) | ⏳ |
| 8C-7 | VU2 CourtDetail → /courts/[id] 보강 (BV3) | ✅ |
| 8C-8 | VU3 CourtBooking 통합 → /booking + payment-fail + checkin (BV2) | ⏳ |
- lock: VU3 토스=Phase6.2 BU2 실연결 답습(mock 0) / 2측 badge(Court Operator navy+silver / Site Operator dark+gold 분리) / 옛 carry-over(VU1 Phase3 v2·VU2 v3·VU4 v2.2 큰변경❌) / Phase4 OO2/OA1+6.1 PA1+6.2 BA1 모달 답습
- 데이터 정책: server 조회 허용 / stop = `/api/v1`·DB schema·LOC>+2000·tsc실패·회귀6·토스 mock·옛박제 큰변경·badge 통합

## 완료 Phase (이력)
- ✅ **Phase 7** (인증·온보딩 4, v2.27, PR #661 빌드 pass / 머지 대기) — AppNav 현상유지(해석A) / 10-5·12-5 가드 보존
- ✅ **Phase 6 묶음** (6.1+6.2+6.3 = 16 시안 / #658·#660 / main `32153c7`) — 토스 실연결 mock 0 / BP1 privacy
- ✅ Phase 5 (#658) / Phase 1~4 (#653/#655)
- 누적: Phase 1~7 = 54 시안 박제 (Phase 1~6 운영 반영 / Phase 7 머지 대기)

## 구현 기록 (developer) — Phase 8C

### 8C-1 — VP1 PartnerAdmin → /partner-admin (BV4 Court Operator hub)

📝 구현: VP1 navy hero 셸 박제 + Court Operator badge(navy+silver). mock(매출·예약·코트리스트) hide / hero stat = 실 캠페인 통계(노출·클릭·CTR + 총 캠페인) / quick action 기존 실링크(campaigns·venue) 유지 / cross-domain note(토스 결제 연동 안내, 정보성) 추가.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/partner-admin/page.tsx | navy hero + Court Operator badge + hero stat 실통계 + cross-domain note (+81 −57) | 수정 |

- layout.tsx(권한 가드) 0 변경 / useSWR 2종(`/api/web/partner/me`·`/stats`) 0 변경
- badge 분리: Court Operator navy+silver (`#1B3C87→#2A4D9E` + silver `#C0CCDB`) — Site Operator dark+gold와 분리
- prefix 충돌 0: 운영 className 전부 Tailwind. vp1-/bv-/cv-/bl- 식별자 미도입 (주석 내 시안 참조 2건만)
- tsc --noEmit = 0

💡 tester 참고:
- 테스트: 파트너 계정으로 /partner-admin 진입 → navy hero + Court Operator badge + 통계 4종(노출/클릭/CTR/총캠페인) 표시
- 정상: mock 코트 리스트/매출 없음(hide) / quick action 2개(campaigns·venue) 링크 동작 / cross-domain note 표시
- 주의: super_admin 진입 시 sentinel "(super_admin 권한으로 진입)" + 통계 데이터 없을 때 0 표시

⚠️ reviewer 참고:
- hero gradient·badge는 시안 hex 직접 박제(Court Operator 측 색 = navy+silver 분리 요구). 운영 var(--color-*) 토큰에 없는 색이라 인라인 hex 사용 — 의도된 예외

### 8C-2 — VU4 VenueDetail → /venues/[slug] 보강 (BV8 cross-domain venue)

📝 구현: v2.2 carry-over 셸 보존(큰 시각 변경❌) 위 2점 보강만. (1) hero badge에 골대 수(court.hoops_count) 실데이터 노출 — 시설 정보 카드에만 있던 값을 hero 진입 시점으로 격상. (2) 리뷰 별점 하드코딩 #F59E0B → var(--warn)(=globals.css #E8A33B) 토큰 교정. BV8 코트 list = venue↔court 그룹핑 필드 부재로 hide(mock 0) 정합 유지.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/venues/[slug]/page.tsx | hero 골대수 badge 실데이터 + 별점 var(--warn) 토큰 교정 (+8 −2 ≈ LOC +6) | 수정 |

- 데이터 패칭 0 변경: hoops_count는 기존 findUnique 전체 select에 포함된 필드(시설 정보 L444서 이미 사용) → 신규 쿼리 0
- var(--warn) 토큰 존재 검증: src/app/globals.css:51 `--warn: #E8A33B` 정의 확인 (색 빠짐 없음)
- v2.2 carry-over 구조 보존: hero/갤러리/리뷰/사이드바 레이아웃 0 변경 (보강만)
- tsc --noEmit = 0
- prefix 충돌 0: vu4-/bv- 식별자 미도입 (주석 8C-2/v2.28 표기만, grep 0건)

💡 tester 참고:
- 테스트: /venues/[코트id] 진입 → hero 좌상단 badge 줄에 `골대 N개` 노출(hoops_count 있는 코트) / 리뷰 별점 노란색(앰버) 정상
- 정상: hoops_count null/0 코트는 골대 badge 미노출(기존 동작) / 별점 색 #F59E0B→#E8A33B 미세 변화(거의 동일 앰버)
- 주의: hoops_count 0인 코트(badge 숨김), 리뷰 0건 코트(리뷰 카드 자체 미노출 — 별점 코드 도달 안 함)

⚠️ reviewer 참고:
- BV8 코트 list hide = venue↔court 그룹핑 DB 필드 부재로 의도적 mock 0(정합). 운영 court_infos는 단일 코트 엔티티 → venue 묶음 불가
- var(--warn)은 #F59E0B와 다른 hex(#E8A33B)지만 동일 앰버 계열 — 토큰 정합 우선(하드코딩 색상 금지 룰)

### 8C-3 — VP2 PartnerVenue → /partner-admin/venue (BV5 ★★★ Court Operator)

📝 구현: 옵션 A 채택 — VP2 셸 + 2 sub-tab(기본정보 / 시간·가격)만 박제. Court Operator badge(navy+silver, 8C-1 답습) + "대관 정보 관리" 헤더 + cv-vtabs 시안 셸을 운영 토큰 탭바로 박제. 기본정보 탭=대관여부/신청URL/담당자연락처 / 시간·가격 탭=fee 편집(기존 유지)+operating_hours read-only 표시(요일별, gw-srow 박제). 정책·통계 탭 미생성(DB 미지원 mock → 박제 0). handleSave·useEffect·인터페이스·`/api/web/partner/venue` PATCH = 0 변경.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/partner-admin/venue/page.tsx | VP2 셸 + 2 sub-tab + badge + operating_hours read-only (+130 −23) | 수정 |

- 데이터 패칭 0 변경: handleSave(PATCH 4필드 그대로) / useEffect(빈 로직 보존) / CourtVenueInfo 인터페이스 0 변경
- operating_hours: 기존 인터페이스에 이미 있던 필드를 read-only 표시만 (저장 대상 추가 0, fee만 편집)
- tab 상태 = 페이지 전역(코트별 X) — 시안 단일 탭바 셸 답습
- badge: Court Operator navy+silver(#1B3C87→#2A4D9E + silver #C0CCDB) — 8C-1과 동일 hex(Site Operator dark+gold와 분리)
- tsc --noEmit = 0
- prefix 충돌 0: vp2-/bv-/cv-/gw-/pm-/bl- 식별자 미도입. className 전부 Tailwind+var(--color-*). 주석 내 시안 참조 2건(.cv-vtabs / .gw-srow)만

💡 tester 참고:
- 테스트: 파트너 계정 /partner-admin/venue 진입 → Court Operator badge + "대관 정보 관리" + 탭바 2개(기본 정보 / 시간·가격) 표시. 탭 전환 시 폼 그룹 교체
- 정상: 기본정보=대관여부/URL/연락처 / 시간·가격=비용 input + 영업시간 read-only 리스트. 저장 버튼은 두 탭 공통(코트 카드별 개별 저장)
- 주의: courts.length===0 빈 상태(현재 API 미구현 → 항상 빈 상태 안내) / operating_hours null인 코트(영업시간 "정보 없음" 안내) / DAY_LABELS 미매핑 key(원본 표시)

⚠️ reviewer 참고:
- 옵션 A: 정책·통계 탭 의도적 미생성(시안 mock = DB 미지원). 사진/매출/평점/추세 차트 박제 0
- badge hex 인라인 = 8C-1 답습(운영 var 토큰에 navy+silver 없음 — 의도된 예외)
- 현재 courts 조회 API 미구현 → 폼은 빈 상태에서만 안내 노출(실데이터 렌더는 API 추가 후). 셸 박제가 목적이라 패칭 미구현은 기존 상태 보존

### 8C-4 — VP3 PartnerCampaigns → /partner-admin/campaigns (BV6 ★★★ Court Operator)

📝 구현: 인라인 폼 유지(모달 전환❌) — VP3 톤 4가지만 박제. 시안 mock 필드(revenue·budget·period·상세모달)는 운영 Campaign 인터페이스 부재로 회피. handleCreate POST·useSWR·formData·인라인 form·statusConfig·카드 내부 통계 0 변경.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/partner-admin/campaigns/page.tsx | VP3 톤 4종(Court Operator badge / grid 2열 / 필터칩 rounded-full+border / 헤더 노출·클릭 합계) (+62 −31, 순 +31) | 수정 |

- VP3 톤 4가지:
  ① Court Operator badge — navy+silver(#1B3C87→#2A4D9E + silver #C0CCDB), 8C-1 답습 hex. 헤더 h2 위 배치
  ② 카드 grid 2열 — 목록 `space-y-3` → `grid sm:grid-cols-2 gap-3` (로딩/빈상태는 grid 깨짐 방지 위해 별도 분기, 스켈레톤 3→4개)
  ③ 필터칩 톤 — `rounded` → `rounded-full` + 비활성 칩 border 추가 (시안 cv-fchip 톤)
  ④ 헤더 합계 — `노출 N · 클릭 N` toLocaleString (campaigns reduce). 시안엔 매출(revenue)까지 있으나 운영 mock 부재로 노출·클릭만
- [id]/page.tsx = **0 변경** (git diff 미등장 확인)
- 데이터 패칭 0 변경: handleCreate(POST formData 그대로) / useSWR(apiUrl) / mutate / formData 5필드 유지
- tsc --noEmit = 0
- prefix 충돌 0: vp3-/bv-/cv-/bl-/pm-/gw- 식별자 미도입. className 전부 Tailwind+var(--color-*). 주석 내 시안 참조 2건(cv-fchip / cv-cmp-grid)만(grep 식별자 0)

💡 tester 참고:
- 테스트: 파트너 계정 /partner-admin/campaigns 진입 → 상단 Court Operator badge + "캠페인 관리" + 노출·클릭 합계 줄 / 필터칩 pill 형태(활성=red, 비활성=border) / 캠페인 2개 이상 시 2열 grid
- 정상: "새 캠페인" 클릭 → 인라인 폼 토글(모달 아님) → 생성 시 POST + 목록 갱신(기존 동작 동일). 카드 클릭 → /campaigns/[id] 이동
- 주의: 캠페인 0건(빈상태 1열 center 유지) / 로딩(스켈레톤 4개 2열) / 모바일(<640px)에서 grid 1열로 떨어짐

⚠️ reviewer 참고:
- badge hex 인라인 = 8C-1 답습(운영 var 토큰에 navy+silver 없음 — 의도된 예외)
- 시안 매출·예산·기간·상세모달 의도적 미박제(운영 Campaign 인터페이스 부재 mock). 헤더 합계도 노출·클릭만(매출 제외)
- 인라인 폼 유지 = PM 승인사항(모달 전환❌). 시안 모달 폼 박제 0

### 8C-5 — VU1 Courts → /courts 보강 (BV1 ★★★★ 발견성)

📝 구현: Phase 3 v2 carry-over 셸 보존(큰 시각 변경❌) 위 발견성 2점 보강만. (1) 코트 등록 신청 CTA — 5필터칩 직후 배치, `/courts/submit` 실라우트 link(cv-submit-cta 톤 cafe-blue 답습). (2) cross-domain 랭킹 link — 좌측 카드 컬럼 맨 아래, `/rankings` 실라우트 link(cv-xlink 톤). 즐겨찾기(favOnly·user_favorite_courts)·앰배서더(court_ambassadors) = 모델 부재로 hide(mock 0). 시안 검색 input = 클라 필터 로직 추가 필요(패칭 변경 영역) → 이번 보강 제외.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/courts/_components/courts-content-v2.tsx | CTA(/courts/submit) + 랭킹 link(/rankings) 발견성 2점 (+103 −2 ≈ LOC +101) | 수정 |

- 데이터 패칭 0 변경: page.tsx·filtered·정렬·히트맵·근접감지·KakaoMap 0 변경. Link 2개 추가만(import 기존)
- 즐겨찾기·앰배서더 hide = user_favorite_courts·court_ambassadors 모델 운영 미연결(PM 승인 mock 0)
- 실라우트 검증: /courts/submit/page.tsx · /rankings/page.tsx 존재 확인 (dead link 0)
- Phase 3 v2 carry-over 구조 보존: 좌측 카드 그리드 + 우측 sticky 지도 + 5필터칩 + 히트맵 0 변경(보강만)
- tsc --noEmit = 0
- prefix 충돌 0: vu1-/bv- 식별자 미도입. className 전부 Tailwind+인라인 var(--color-*). 주석 내 시안 참조 3건(cv-submit-cta / cv-xlink)만(grep 식별자 0)

💡 tester 참고:
- 테스트: /courts 진입 → 5필터칩 아래 "찾는 코트가 없나요?" CTA 카드(클릭 → /courts/submit) / 좌측 카드 목록 맨 아래 "코트별 체크인 랭킹" 링크(클릭 → /rankings)
- 정상: CTA·랭킹 link 모두 실페이지 이동(404 아님) / 기존 필터·지도·히트맵·근접감지 동작 동일 / 빈 상태에서도 랭킹 link 노출
- 주의: 빈 상태(필터 0건)일 때 랭킹 link 여전히 노출(의도) / cafe-blue 토큰 미정의 환경 fallback(var(--bg-elev)/var(--accent)) 동작 확인

⚠️ reviewer 참고:
- 즐겨찾기/앰배서더/검색 의도적 미박제 = 모델/패칭 영역(PM 승인 mock 0). 시안 cv-fav·cv-amb·cv-search 박제 0
- cafe-blue 계열은 운영 globals.css 정의 시 사용 / 미정의 시 fallback(var(--cafe-blue-soft, var(--bg-elev)) 식). 기존 5필터칩(L428)도 동일 fallback 패턴 답습
- CTA·랭킹 모두 `<Link>` affordance(chevron) — 시안 btn 대신 카드 전체 클릭(모바일 안전)

### 8C-6 — VA1 AdminCourtsPartners → /admin/courts + /admin/partners (BV7 ★★ Site Operator)

📝 구현: 2라우트 구조 보존(통합❌). VA1 톤 = Site Operator 뱃지(dark+gold) 양쪽 박제 + courts hero stat strip(전체/활성/미승인/신고). SiteOperatorBadge 공용 컴포넌트 신규(team-shared .operator-badge 박제, Court Operator navy+silver와 hex 분리). 신고 = court_reports active(미처리) count-only만 hero에 포함(탭/모달/액션 미생성). mock(매출·평점·신고리스트·편집제안 탭) 박제 0.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/components/admin/site-operator-badge.tsx | SiteOperatorBadge 공용 컴포넌트(dark+gold) 신규 (+44) | 신규 |
| src/app/(admin)/admin/courts/page.tsx | badge(actions) + hero stat strip 4종 + count 쿼리 3개 (+45 −3 ≈ LOC +42) | 수정 |
| src/app/(admin)/admin/partners/page.tsx | badge(actions, 등록버튼 옆) (+9 −3 ≈ LOC +6) | 수정 |

- 합계 LOC ≈ +92 (신규 44 + courts 42 + partners 6) — stop LOC>+2000 무관
- **추가 count 쿼리 3개** (전부 court_infos/court_reports `.count()` — count-only, server 허용 범위):
  ① `court_infos.count({status:"active"})` = 활성
  ② `court_infos.count({status:"pending"})` = 미승인
  ③ `court_reports.count({status:"active"})` = 신고 pending(미처리) — court_reports.status default=active=미처리
- hero stat = 검색 q 무관(전체 현황 지표) / 기존 totalCount(검색 반영)는 그대로 subtitle·전체stat 공용
- 데이터 패칭·권한가드·액션 0 변경: courts(findMany/server actions/AdminCourtsContent 0) / partners(fetch/handleStatusChange/handleCreate/state/테이블 0)
- 권한 가드 = (admin)/layout 레벨(페이지 내 0 변경)
- badge 분리: Site Operator dark+gold(`#1A1E27→#404755` + gold `#F4C76C`) — Court Operator navy+silver(8C-1~4)와 hex 명확 분리
- admin 공용 클래스 재사용: pa1-hero-stats / pa1-hero-stat__num[data-tone] / admin-pageheader actions slot (운영 admin.css 기존 정의). 시안 oa1-hero/ca1-tabs/cv-atable는 운영 미정의라 미사용
- tsc --noEmit = 0
- prefix 충돌 0: va1-/bv-/cv-atable/oa1-hero/ca1-tab 식별자 미도입 (grep 0건, courts·partners 양쪽)

💡 tester 참고:
- 테스트: super-admin 계정 /admin/courts 진입 → 헤더 우측 "Site Operator"(dark+gold) 뱃지 + 검색폼 / 헤더 아래 stat strip 4개(전체 코트/활성/미승인/신고). /admin/partners 진입 → 헤더 우측 Site Operator 뱃지 + "파트너 등록" 버튼 나란히
- 정상: stat 숫자 전부 실측(DB count) / 코트 테이블·승인 액션·검색·파트너 목록·상태변경 모두 기존 동작 동일 / 신고 stat 숫자만 노출(클릭 액션 없음)
- 주의: court_reports 0건 환경(신고 stat=0 표시) / status=active 코트 0건(활성=0) / 검색 시 전체stat은 검색 반영(totalCount), 활성/미승인/신고 stat은 전체 기준(의도)

⚠️ reviewer 참고:
- badge hex 인라인(공용 컴포넌트) = 운영 var 토큰에 dark+gold 없음(의도된 예외, Court Operator 측과 동일 정책). 2측 badge 시각 분리 lock 준수
- 신고 탭/모달/액션 의도적 미생성 = PM 지시(액션 0 변경). 신고 pending count만 hero stat 포함(server count 허용 범위). 시안 reports/edits 탭 + 상태 모달 박제 0
- 2라우트 통합 ❌ = PM 지시(분리 유지). 시안은 단일 통합 4탭이나 운영 courts(서버)/partners(클라) 구조·패칭 보존
- hero stat where 미적용(전체 기준)은 의도 — 현황 지표는 검색과 무관. totalCount만 검색 반영(기존 subtitle 일관)

### 8C-7 — VU2 CourtDetail → /courts/[id] 보강 (BV3 ★ 옛 v3 carry-over)

📝 구현: 옛 v3 carry-over 셸 보존(큰 시각 변경❌) 위 1점 보강만. 5항목 세부 별점 평균 카드 상단에 **평점 헤더 1개** 추가 — reviews 의 rating 평균(useMemo, 반올림 .1) + StarRating(정수 반올림) + "리뷰 N개". 데이터·액션·탭·hero·ContextReviews·삭제·작성폼 0 변경.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/courts/[id]/_components/court-reviews-section.tsx | overallAverage useMemo + 평점 헤더 div(평균숫자+StarRating+리뷰수) (+38 −0 ≈ LOC +38) | 수정 |

- 데이터 패칭 0 변경: SWR `/api/web/courts/${courtId}/reviews` / DELETE / ReviewForm POST 0. reviews 배열 재사용만(신규 쿼리 0)
- overallAverage = reviews 의 rating 평균(reduce/length, 반올림 .1) — categoryAverages 와 동일 패턴
- StarRating 은 `Math.round(overallAverage)` 정수값 전달(컴포넌트 시그니처 그대로)
- 카드 자체는 기존(`reviews.length > 0` 조건부) — 헤더는 카드 내부 h3 위 1개만 추가
- var(--*)만: ink/ink-mute/border-subtle. hex 0
- tsc --noEmit = 0
- prefix 충돌 0: vu2-/bv- 식별자 미도입. className/style 전부 운영 토큰. 주석 표기만

💡 tester 참고:
- 테스트: /courts/[id] 진입 → 리뷰 1건+ 있는 코트의 "세부 항목 평균" 카드 최상단에 평점 헤더(큰 평균숫자 + 별 + "리뷰 N개") 노출
- 정상: 평균 숫자 = 전체 rating 평균(.1 단위) / 별점은 정수 반올림 / 리뷰 0건 코트는 카드 자체 미노출(헤더도 안 보임)
- 주의: 리뷰 1건(평균=그 값) / rating 소수 평균(예 3.7→별 4개 반올림 표시 정상)

⚠️ reviewer 참고:
- 헤더 1개만 추가(PM 승인 범위). hero/탭/ContextReviews/삭제버튼/사진/작성폼 0 변경
- 별점 정수 반올림 = StarRating value 정수 시그니처 답습(소수 별 미지원). 숫자는 .1 정밀 표기로 보완

### 8C-8 — VU3 CourtBooking 통합 → /booking + payment-fail + checkin (BV2 ★★★★★)

📝 구현: 시안 wizard 통합·QR·가짜 토스 위젯 미박제. PM 승인 **정보성 톤 4종**만 박제. 토스 흐름(SDK 로드/requestPayment/successUrl/failUrl/payment-cancel)·예약/cancel/checkin 액션·약관 게이트 0 변경.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/courts/[id]/booking/_booking-client.tsx | 결제수단 안내 칩(PAY_METHODS 3종 비활성) + "토스 안전결제창에서 선택" lock 안내 + 결제 버튼 lock 아이콘 (+83 −0) | 수정 |
| src/app/(web)/courts/[id]/booking/payment-fail/page.tsx | code 박스 → bl-result__errchip 톤("오류 코드" 라벨 + code 칩 accent) (+18 −5 ≈ LOC +13) | 수정 |
| src/app/(web)/courts/[id]/checkin/page.tsx | "현장 체크인 · CHECK-IN" eyebrow(성공/이미체크인 시만) (+11 −0) | 수정 |

- 톤 4종: ① 결제수단 안내 칩(card/transfer/easy, 시안 VU3_PM 답습 — 비활성 정보성 only, 가짜 위젯 미박제) ② 안전결제 lock 아이콘(bl-widget__note + bl-paybtn 톤) ③ payment-fail errchip 톤 ④ checkin eyebrow
- 합계 LOC ≈ +107 — stop LOC>+2000 무관
- **토스 흐름 보존**: requestPayment/successUrl/failUrl/customerEmail 인자·SDK 동적로드·MeInfo 조회 0 변경 / payment-cancel API useEffect 0 변경 / checkin POST(method:qr) 0 변경 / 약관 4종 게이트(allRequiredAgreed) 0 변경
- 가짜 토스 위젯(bl-pm-skel 카드번호 입력 등) 미박제 — 정보성 안내 칩만(실 수단 선택=토스 안전결제창)
- 결제수단 칩·lock 안내는 isPaid(유료)일 때만 노출 / checkin eyebrow는 success·already 상태만(loading/error transitional 제외)
- var(--*)만: ink-soft/ink-dim/border/bg-alt/accent + checkin은 var(--color-text-muted) (기존 토큰 답습). hex 0
- tsc --noEmit = 0
- prefix 충돌 0: vu3-/bv-/cv-/bl- 식별자 미도입. className 전부 Tailwind+인라인 var(--*). 주석 내 시안 참조 3건(bl-widget__note/bl-paybtn/bl-result__errchip)만(grep 식별자 0)

💡 tester 참고:
- 테스트: /courts/[id]/booking 진입 → 유료 코트 우측 요약카드 결제버튼 위 결제수단 칩 3개(카드/계좌이체/간편결제, 클릭 비활성) + "토스 안전결제창에서 선택" lock 안내 + 결제버튼 lock 아이콘. payment-fail 진입(매핑 안된 code) → "오류 코드" 라벨+code 칩. checkin QR 진입 성공 → "현장 체크인 · CHECK-IN" eyebrow
- 정상: 무료 코트는 결제수단 칩/lock 안내 미노출(기존대로) / 결제 흐름·약관 게이트·체크인 동작 전부 기존 동일 / errchip은 매핑 안된 code 만 노출
- 주의: 무료 코트(칩 hide) / 매핑된 code(USER_CANCEL 등 — errchip 미노출, 한글 메시지만) / checkin loading·error(eyebrow 미노출)

⚠️ reviewer 참고:
- 정보성 톤 4종만(PM 승인) — wizard 통합·QR hero·가짜 토스 위젯·성공/실패 토글 미박제. 토스 실연결 흐름 보존(mock 0)
- 결제수단 칩 = 비활성 `<span>`(button 아님) — 실제 선택은 토스 안전결제창. 오해 방지 위해 lock 안내 동반
- stop condition: **없음** (토스 mock 미사용 / DB·api/v1·LOC·회귀·badge 통합 무관)

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-07 | **8C-8** VU3 CourtBooking → /booking+payment-fail+checkin (BV2) | ✅ 정보성 톤4(결제수단칩+lock안내 / 버튼 lock / errchip톤 / checkin eyebrow) / 토스흐름·cancel·checkin·약관게이트 0 / 가짜위젯 미박제(mock0) / tsc 0 / 충돌 0 / stop 없음 |
| 2026-06-07 | **8C-7** VU2 CourtDetail → /courts/[id] (BV3) | ✅ 5항목 평균 카드에 평점 헤더1(overallAverage+StarRating+리뷰N) / 데이터·액션·탭·hero 0 / var(--*)만 / tsc 0 / 충돌 0 |
| 2026-06-07 | **8C-6** VA1 AdminCourtsPartners → /admin/courts + /admin/partners (BV7) | ✅ 2라우트 보존 / SiteOperatorBadge 공용 신규(dark+gold) 양쪽 박제 / courts hero stat4 + count쿼리3(count-only) / 신고 탭·모달·액션 미생성 / 패칭·가드 0 / tsc 0 / 충돌 0 |
| 2026-06-07 | **8C-4** VP3 PartnerCampaigns → /partner-admin/campaigns (BV6) | ✅ 인라인폼 유지 / VP3 톤4(badge·grid2열·필터칩·헤더합계) / mock회피 / handleCreate 0 / [id] 0 / tsc 0 / 충돌 0 |
| 2026-06-07 | **8C-3** VP2 PartnerVenue → /partner-admin/venue (BV5) | ✅ 옵션A VP2 셸+2탭(기본/시간가격) / badge + operating_hours read-only + fee편집 / 정책·통계 미생성 / handleSave 0 / tsc 0 / 충돌 0 |
| 2026-06-07 | **8C-2** VU4 VenueDetail → /venues/[slug] (BV8) | ✅ 골대수 hero badge 실데이터 + 별점 var(--warn) 교정 / list hide(mock0) / 패칭0 / tsc 0 / 충돌 0 |
| 2026-06-07 | **8C-1** VP1 PartnerAdmin → /partner-admin (BV4) | ✅ navy hero + Court Operator badge / mock hide / 실통계 / tsc 0 / 충돌 0 |
| 2026-06-07 | Phase 8 v2.28 sync | ✅ court-shared + 8 jsx / carry diff 0 |
| 2026-06-07 | **Phase 7 chain** (v2.27 + 7C 4 PR #661) | ✅ `788501f`+`cd261b5`~`239b779` / AppNav 현상유지 / stop 0 |
| 2026-06-06 | **Phase 6.2+6.3 dev→main** (#660) | ✅ main `32153c7` Vercel success / Phase 6 묶음 종료 |
| 2026-05-31 | Phase 6.3 chain (v2.26 + 3 PR) | ✅ 보강 / stop 0 |
| 2026-05-31 | Phase 6.2 chain (v2.25 + 7 PR) | ✅ 토스 실연결 mock 0 |
| 2026-05-31 | Phase 6.1 chain (v2.24 + 6 PR #657) | ✅ BP1 privacy·BP5 가드 |
