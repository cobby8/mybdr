# Phase 8 — 코트·장소 Claude.ai 의뢰 (단일 paste)

> **선행**: Phase 1~7 박제 완료 (v2.27 도착)
> **본 의뢰**: 8 시안 (사용자 4 + 파트너 3 + super-admin 1) · 3 측 stakeholder

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

### Step 1 — Claude.ai + 4 건 drag-drop

**첨부**:
- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase8-baseline-2026-05-31.zip` (542KB / 181 파일)
- `courts-venues-user-partner-admin-connectivity-plan-2026-05-31.md`
- `courts-venues-user-redesign-prompt-2026-05-31.md`
- `courts-venues-partner-admin-redesign-prompt-2026-05-31.md`

### Step 2 — 아래 §메시지 본체 paste

---

## 메시지 본체

```
Phase 8 — 코트·장소 (Courts/Venues+Partner) 리디자인 의뢰 (총 8 시안 + BV1~BV8) 시작합니다.

[선행]
- Phase 1~7 박제+운영 완료 + Phase 7 박제 v2.27 도착
- 첨부 zip = BDR v2.27 (BDR-current = 65 jsx + 7 css + 8 shared = auth-shared 포함)

[★ 본 Phase 특수]
- 3 측 stakeholder = 사용자 + 파트너 (Court Operator) + super-admin (Site Operator)
- Phase 1/2/5/6.2 cross-domain 강함 (venue / court_id / 랭킹 / 예약 결제)
- 토스페이먼츠 = 운영 실연결 (Phase 6.2 답습 · VU3 booking 예약 결제)
- 옛 박제: VU1 Phase 3 v2 / VU2 v3 / VU4 v2.2 (carry-over + 보강)

[상위 계획서]
courts-venues-user-partner-admin-connectivity-plan-2026-05-31.md (BV1~BV8 = 8 갭)

[의뢰서 2건 — 첨부]
1. courts-venues-user-redesign-prompt-2026-05-31.md (사용자 4 = VU1~VU4)
2. courts-venues-partner-admin-redesign-prompt-2026-05-31.md (파트너 3 + super-admin 1 = VP1+VP2+VP3+VA1)

[첨부 zip 안]
BDR-current/ — Phase 1~7 박제 v2.27
_phase8_operational_refs/ — 13 운영 파일:
  - VU1~VU4 운영 (courts list/detail/booking/checkin/payment-fail + venues)
  - VP1~VP3 운영 (partner-admin hub/venue/campaigns + [id])
  - VA1 운영 (admin courts + admin partners)
  - SPEC.md (Prisma 코트 10 모델 + cross-domain + 3 측)

[Phase 8 박제 시안 = 8]

사용자 측 (VU1~VU4 · A 등급):
- VU1 Courts list 보강 /courts · BV1 발견성 (검색/필터/지도/즐겨찾기/앰배서더) · Phase 3 v2 carry
- VU2 CourtDetail 보강 /courts/[id] · BV3 v3 carry (5항목 평균 + 리뷰 + 신고 + 편집 제안) + cross-domain (Phase 1/2/5 link)
- VU3 CourtBooking 통합 신규 /courts/[id]/booking + payment-fail + checkin · BV2 ★★★★★ 3-step wizard (Phase 6.2 BU2 토스 위젯 답습)
- VU4 VenueDetail 보강 /venues/[slug] · BV1 v2.2 carry + cross-domain (venue 안 코트 list)

파트너 측 (VP1~VP3 · Court Operator · E 등급):
- VP1 PartnerAdmin hub /partner-admin · BV4 Hero stat (코트/예약/매출/평점) + 코트 list
- VP2 PartnerVenue /partner-admin/venue · BV5 4 sub-tab (기본/시간가격/정책/통계) · Phase 4 OO2 답습
- VP3 PartnerCampaigns 통합 /partner-admin/campaigns + [id] · BV6 광고 캠페인 carad + 상세 모달

관리자 측 (VA1 · Site Operator · E 등급):
- VA1 AdminCourtsPartners 통합 신규 /admin/courts + /admin/partners · BV7 Hero stat + 4 탭 (코트/파트너/신고/편집) · Phase 4 OA1 + Phase 6.1 PA1 답습

[2026-05-31 결재 룰]
- BV2 = VU3 예약 wizard = Phase 6.2 BU2 토스 위젯 실연결 답습 (mock 0)
- BV3 = VU2 v3 carry (5항목 평균 + ReviewForm 토글)
- BV8 cross-domain = Phase 1 venue / Phase 2 court_id / Phase 5 /courts/[id]/rankings / Phase 6.2 BU4 court_bookings 동일 source
- 2 측 badge = Court Operator (파트너 · navy+silver) vs Site Operator (super-admin · dark+gold)
- Phase 4 OA1 / Phase 6.1 PA1 / Phase 6.2 BA1 모달 답습 (알림 ✅ 기본)
- Phase 1~7 carry-over (변경 ❌)
- AppNav / 새 라우트 ❌

[작업 흐름]
1. 첫 응답 = 의뢰서 2건 §7 형식
   ✅ Phase 8B 사용자 (VU1~VU4)
   ✅ Phase 8A 관리자 (VP1~VP3 + VA1)

2. 박제 순서:
   사용자: VU1 보강 → VU4 보강 → VU2 보강 → VU3 (가장 큰 wizard)
   관리자: VA1 (super-admin) → VP1 → VP2 → VP3

3. 박제 완료 → 새 zip (BDR v2.28/ 예상)

4. 13 룰 위반 시 reject + 알림

[양측 의존 검증]
- BV1: VU1 즐겨찾기/앰배서더 = user_favorite_courts + court_ambassadors
- BV2: VU3 토스 위젯 = Phase 6.2 BU2 동일 위젯 + court_bookings 실연결
- BV3: VU2 v3 = court_reviews 5항목 평균 + court_reports + court_edit_suggestions
- BV4~BV7: 파트너+super-admin = Phase 4 OO2/OA1 + Phase 6.1 PA1 답습
- BV8: 데이터 source 동일 (Phase 1/2/5/6.2 cross-domain)

[자체 검수 4 + 8 + Phase 8 특수 4]

4 frozen + 8 self — Phase 7 답습.

Phase 8 특수:
- ✅ VU3 3-step wizard = Phase 6.2 BU2 토스 위젯 답습 (mock 0)
- ✅ 2 측 badge 시각 분리 (Court Operator vs Site Operator)
- ✅ cross-domain link Phase 1/2/5/6.2 정합 (시각 일관)
- ✅ VP2 4 sub-tab = Phase 4 OO2 답습 / VA1 4 탭 = OA1+PA1 답습

[질문/가정]
- 캠페인 광고 = partners 모델 활용 / 광고 자산 (이미지/문구) form
- 코트 운영 사장 시야 가드 = courts.partner_id 또는 court_infos 권한 (운영 확인 필요)

시작해 주세요.
```

---

## 예상 첫 응답

```
✅ Phase 8B 사용자 (VU1~VU4) — 발견성 + 상세 + 예약 wizard (BU2 답습) + venue
✅ Phase 8A 관리자 (VP1~VP3 + VA1) — Court Operator + Site Operator 2측
```

---

## zip 회신 후

```
☐ Cowork 에 "Phase 8 zip 도착"
```

→ Cowork 자동 sync + Phase 8C Auto Chain (8 PR).

---

**의뢰서 끝.**
