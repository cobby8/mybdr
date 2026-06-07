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
| 8C-7 | VU2 CourtDetail → /courts/[id] 보강 (BV3) | ⏳ |
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

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
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
