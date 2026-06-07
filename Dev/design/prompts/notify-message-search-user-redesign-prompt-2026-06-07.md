# 클로드 디자인 의뢰 — 알림·메시지·검색 사용자 측 (Phase 9B)

> **선행**: Phase 1~8 박제 완료
> **본 의뢰**: 3 시안 (NU1+NU2+NU3) · 사용자 측

---

## 0. 진입 표준 절차

Phase 8 의뢰서 §0 답습. Phase 1~8 carry-over (변경 ❌).

---

## 1. 한 줄 요약

`/notifications` (NU1 보강) + `/messages` (NU2 보강 carry) + `/search` (NU3 보강 carry) = **3 시안**.

---

## 2. 결재 룰

- ✅ **NU1 알림 카테고리** = NotifCategory enum carry (대회/경기/팀/단체 등) + chip filter + 읽음 여부
- ✅ **NU2 메시지** = v2 박제 carry + DB 미지원 = "준비 중" 유지 / mock 더미 carry (운영 지침)
- ✅ **NU3 검색** = BDR v2 carry + 카테고리 chip + cross-domain Phase 1~8
- ❌ DB 변경 / messages 모델 신설 ❌ (운영 지침: DB 미지원도 제거 금지 + "준비 중")
- ❌ 새 라우트 / Phase 1~8 시안 변경 ❌

---

## 3. 3 시안 사양

### NU1 — Notifications (보강) · `/notifications`

**현황**: 96 line · NotificationsClient v2 흔적

**보강**:
- Hero band — "알림" + 읽지 않음 카운트
- 카테고리 chip row sticky (전체/대회/경기/팀/단체/시스템 — NotifCategory carry)
- 읽음 / 안 읽음 토글
- 카드 list (icon + 카테고리 badge + 메시지 + 시간 + status)
- 일괄 "모두 읽음" CTA
- main bar 5 아이콘 안 알림 카운트 동기화 (cross-domain · 전 Phase)
- 카드 클릭 → 해당 화면 deep link (Phase 1~8 진입)

### NU2 — Messages (보강 carry) · `/messages`

**현황**: 655 line · Phase 8 v2 박제 ✅ (3컬럼 / DB 미지원 정적 더미 / "준비 중")

**보강** (작은 시각만):
- "준비 중" 안내 = warn-soft tone 통일 (Phase 6.3 GU2 답습)
- 모바일 분기 = 스레드 list → 대화창 → 프로필 레일 (가로 swipe 또는 탭)
- mock 더미 carry (DB 0% 운영 / 변경 ❌)

### NU3 — Search (보강 carry) · `/search?q=...`

**현황**: 261 line · BDR v2 재구성 ✅

**보강**:
- Hero band — 검색바 (자동완성 + 최근 검색)
- 카테고리 chip = 전체 / 경기 / 대회 / 팀 / 단체 / 코트 / 유저 / 커뮤니티 (Phase 1~5 cross-domain)
- 카테고리별 결과 섹션 (각 5 + "더 보기" link → 해당 Phase list)
- 빈 상태 = "검색 결과가 없어요" + 추천 검색어

---

## 4. 양측 의존 검증

| BN | 본 의뢰 | cross-domain |
|----|---------|-------------|
| BN1 | NU1 카테고리 | NotifCategory enum + main bar 카운트 (전 Phase) |
| BN2 | NU2 carry | (단독 · DB 미지원 더미) |
| BN3 | NU3 검색 | Phase 1~8 결과 진입 link |

---

## 5. 13 룰 + Phase 1~8 carry-over

- ❌ AppNav / 새 라우트 / Phase 1~8 시안 변경 ❌
- ✅ NU2 mock 더미 carry (DB 미지원 유지)
- ✅ "준비 중" warn-soft tone 통일

---

## 6. 자체 검수

기본 12 + Phase 9 특수 3:
- ✅ NU1 main bar 카운트 동기화
- ✅ NU2 "준비 중" warn-soft tone
- ✅ NU3 카테고리 chip = Phase 1~5 cross-domain

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 알림·메시지·검색 사용자 (Phase 9B · NU1~NU3)

이해: NU1 알림 카테고리 보강 + NU2 메시지 carry ("준비 중") + NU3 검색 cross-domain.
양측 의존 = BN1~BN3.
사용자 결정 §1~§8 / 13 룰 / Phase 1~8 carry-over / DB 미지원 carry.
자체 검수: 06 §사용자
작업 시작.
```

---

**의뢰서 끝.**
