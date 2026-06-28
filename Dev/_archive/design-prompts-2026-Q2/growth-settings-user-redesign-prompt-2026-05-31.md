# 클로드 디자인 의뢰 — 마이페이지 후반부 보강 (Phase 6.3)

> **선행**: Phase 1~5 + Phase 6.1 + Phase 6.2 박제 완료
> **본 의뢰**: 3 시안 (GU1~GU3) · 사용자 측 만 / **모두 옛 v2 박제됨 = 보강 의뢰**
> **★ Phase 6 묶음 종료**: 본 의뢰 후 Phase 6 = 16 시안 (6.1 본체 6 + 6.2 결제 7 + 6.3 후반부 3) 완전 종료

---

## 0. 진입 표준 절차

Phase 6.2 의뢰서 §0 답습. Phase 1~6.2 carry-over (변경 ❌) — BDR-current/ 안 58 jsx + 7 css + 6 shared (game/team/org/comm/profile/billing).

---

## 1. 한 줄 요약

`/profile/growth` (GU1 v2.2 보강) + `/profile/weekly-report` (GU2 v2.4 보강) + `/profile/settings` (GU3 v2.3 7 섹션 보강) = **3 시안**. Phase 6.2 BU3 ProfileBilling 박제 후 GU3 billing 섹션 link 활성.

---

## 2. 결재 룰

- ✅ **모두 옛 v2 박제됨** = 시안 ID 재사용 (GU1=v2.2 / GU2=v2.4 / GU3=v2.3 답습)
- ✅ **GU3 billing 섹션** = Phase 6.2 BU3 link 활성 (운영 박제 후 자동)
- ✅ **danger zone** (계정 삭제) = BDR Red + 2차 confirm 강화
- ✅ DB 미지원 (xp / streak / Highlight 등) = "곧 제공" placeholder
- ❌ 새 라우트 ❌ / Phase 1~6.2 시안 변경 ❌

---

## 3. 3 시안 사양

### GU1 — ProfileGrowth (보강) · `/profile/growth`

**현황**: 835 line · v2.2 P1-1 박제 ✅ (게이미피케이션 + 12주 spark + 마일스톤 6 + 다음 목표 progress)

**보강**:
- GU1-A · Hero band 레벨·XP = Phase 6.1 PU1 시각 일관
- GU1-B · 마일스톤 6 카드 = Phase 6.1 PU4 user_badges 동일 source / 시각 정합 (badge icon + 이름 + 조건)
- GU1-C · "다음 목표" progress + CTA = 활동/박제 link (UC1 진입)
- GU1-D · DB 미지원 표시 ("준비 중" 라벨) = warn-soft tone 통일

### GU2 — WeeklyReport (보강) · `/profile/weekly-report`

**현황**: 1125 line · v2.4 D-3 Hybrid 박제 ✅ (KPI 4 + Highlight placeholder + 인사이트 + TOP 3 코트 + 다음 주 추천 + 지난주 비교)

**보강** (작은 시각 정리):
- GU2-A · placeholder 섹션 ("곧 제공" / Highlight 베스트 1경기 / 다음 주 추천 3종) = 시각 통일 (warn-soft tone)
- GU2-B · 이메일 구독 관리 CTA → GU3 `?section=notify` link
- GU2-C · KPI 4 = Phase 6.1 PU3 시즌 stat 데이터 source 정합

### GU3 — ProfileSettings (보강) · `/profile/settings`

**현황**: 256 line · v2.3 박제 ✅ (Settings 7 섹션 = account/feed/notify/bottomNav/billing/display/danger + 좌측 sticky nav + PreferenceForm 8섹션 흡수)

**보강**:
- GU3-A · **billing 섹션 link 활성** = Phase 6.2 BU3 ProfileBilling 진입 (운영 박제 후) + 미리보기 (현재 구독 plan + 다음 결제일)
- GU3-B · bottomNav 편집기 (C3 Phase B 옵션) = 추가 시각 보강
- GU3-C · danger zone = BDR Red + 2차 confirm 모달 (계정 삭제 사유 입력)
- GU3-D · account 안 IdentityVerifyButton = 시각 강화 (success badge if verified / warn if not)
- GU3-E · `/profile/preferences` + `/profile/notification-settings` wrapper redirect = `?section=feed` / `?section=notify` 매핑 유지 (변경 ❌)

---

## 4. 양측 의존 검증

| BG | 사용자 측 (본 의뢰) | cross-domain |
|----|-------------------|-------------|
| BG1 | GU1 마일스톤 | Phase 6.1 PU4 user_badges 동일 source |
| BG2 | GU2 KPI 4 | Phase 6.1 PU3 시즌 stat |
| BG3 | GU3 billing 섹션 link | Phase 6.2 BU3 ProfileBilling |

---

## 5. 13 룰 + Phase 1~6.2 carry-over

- ❌ AppNav / 새 라우트 / wrapper redirect 변경 ❌
- ✅ DB 미지원 = "곧 제공" placeholder (mock 0)
- ✅ GU3 billing 섹션 = Phase 6.2 운영 박제 시점 활성
- ✅ danger zone = BDR Red + 2차 confirm

---

## 6. 자체 검수

기본 12 + Phase 6.3 특수 3:
- ✅ "곧 제공" placeholder 시각 통일 (warn-soft tone)
- ✅ GU3 billing 섹션 link 시각 (Phase 6.2 박제 전 = "준비 중" / 박제 후 = 활성)
- ✅ danger zone = BDR Red + 2차 confirm 모달

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 마이페이지 후반부 보강 (Phase 6.3 · GU1~GU3)

이해: GU1 ProfileGrowth (v2.2 보강 / 마일스톤 PU4 정합) + GU2 WeeklyReport (v2.4 placeholder 정리) + GU3 ProfileSettings (v2.3 billing link 활성 + danger 강화).
양측 의존 = BG1 (마일스톤) + BG2 (KPI) + BG3 (billing).
사용자 결정 §1~§8 / AppNav / 13 룰 / Phase 1~6.2 carry-over.
자체 검수: 06 §보강 / placeholder
작업 시작.
```

---

**의뢰서 끝.** Phase 6 묶음 = 16 시안 완전 종료.
