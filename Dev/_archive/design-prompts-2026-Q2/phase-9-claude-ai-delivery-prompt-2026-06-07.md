# Phase 9 — 알림·메시지·검색 Claude.ai 의뢰 (단일 paste)

> **선행**: Phase 1~8 박제 완료 (v2.28 도착)
> **본 의뢰**: 4 시안 (사용자 3 + super-admin 1) · 작은 묶음

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

### Step 1 — Claude.ai + 4 건 drag-drop

- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase9-baseline-2026-06-07.zip` (567KB / 191 파일)
- `notify-message-search-connectivity-plan-2026-06-07.md`
- `notify-message-search-user-redesign-prompt-2026-06-07.md`
- `notify-admin-redesign-prompt-2026-06-07.md`

### Step 2 — 아래 §메시지 본체 paste

---

## 메시지 본체

```
Phase 9 — 알림·메시지·검색 리디자인 의뢰 (총 4 시안 + BN1~BN4) 시작합니다.

[선행]
- Phase 1~8 박제+운영 + Phase 8 v2.28 박제
- 첨부 zip = BDR v2.28 (BDR-current = 73 jsx + 7 css + 9 shared = court-shared 포함)

[★ 본 Phase 특수]
- 작은 묶음 (4 시안 · ~1263 LOC)
- 대부분 옛 박제됨 (NU2 v2 Phase 8 / NU3 v2 / NU1 v2 흔적) — 보강 의뢰
- NA1 신규 (super-admin)
- main bar 5 아이콘 (NU1) 자주 접근 / 전 Phase 알림 발신처

[상위 계획서]
notify-message-search-connectivity-plan-2026-06-07.md (BN1~BN4 = 4 갭)

[의뢰서 2건 — 첨부]
1. notify-message-search-user-redesign-prompt-2026-06-07.md (사용자 3 = NU1+NU2+NU3)
2. notify-admin-redesign-prompt-2026-06-07.md (super-admin 1 = NA1)

[첨부 zip 안]
BDR-current/ — v2.28 그대로
_phase9_operational_refs/ — 5 운영 파일 + SPEC.md

[Phase 9 박제 시안 = 4]

사용자 측 (NU1+NU2+NU3 · A 등급):
- NU1 Notifications 보강 /notifications · BN1 알림 카테고리 (NotifCategory carry) + chip filter + 읽음 + main bar 카운트 동기화
- NU2 Messages 보강 carry /messages · BN2 v2 박제 carry + DB 미지원 "준비 중" 유지 (mock 더미 carry / 운영 지침 보존)
- NU3 Search 보강 carry /search · BN3 BDR v2 carry + 카테고리 chip (Phase 1~5 cross-domain) + 결과 섹션

관리자 측 (NA1 · super-admin):
- NA1 AdminNotifications 신규 /admin/notifications · BN4 Hero stat + 작성 form (target 4종) + 발송 이력 + 모달 (Phase 4 OA1 답습)

[2026-06-07 결재 룰]
- BN1 = NU1 = NotifCategory enum carry + main bar 카운트 동기화 (전 Phase)
- BN2 = NU2 = DB 미지원 carry / "준비 중" 유지 / messages 모델 신설 ❌
- BN3 = NU3 = 카테고리 chip = Phase 1~5 cross-domain (경기/대회/팀/단체/커뮤니티)
- BN4 = NA1 = Phase 4 OA1 + Phase 6.1 PA1 + Phase 6.2 BA1 + Phase 8 VA1 답습 (Site Operator + 모달 + 알림 ✅)
- Phase 1~8 carry-over (변경 ❌)
- DB 변경 ❌ / 새 라우트 ❌

[작업 흐름]
1. 첫 응답 = 의뢰서 2건 §7 형식
   ✅ Phase 9B 사용자 (NU1~NU3)
   ✅ Phase 9A 관리자 (NA1)

2. 박제 순서:
   사용자: NU2 carry (작은 시각) → NU1 보강 → NU3 cross-domain
   관리자: NA1 신규

3. 박제 완료 → 새 zip (BDR v2.29/ 예상)

4. 13 룰 위반 시 reject + 알림

[양측 의존 검증]
- BN1: NU1 카운트 = main bar 5 아이콘 카운트 = notifications.* 미읽음 수
- BN2: NU2 mock 더미 carry (DB 0% 운영 지침 / 변경 ❌)
- BN3: NU3 카테고리별 결과 → Phase 1~5 list 진입 link
- BN4: NA1 발송 → NU1 수신 (notifications.* 표시)

[자체 검수 4 + 8 + Phase 9 특수 3]

Phase 9 특수:
- ✅ NU2 "준비 중" warn-soft tone 통일 (Phase 6.3 GU2 답습)
- ✅ NU3 카테고리 chip = Phase 1~5 link 정합
- ✅ NA1 발송 모달 = "X명에게 발송" confirm (실수 방지)

[질문/가정]
- messages 모델 신설 = 본 의뢰 외 (DB 0% 운영 지침 유지)
- 푸시 알림 = Web Push API or push_subscriptions 운영 흐름 답습

시작해 주세요.
```

---

## 예상 첫 응답

```
✅ Phase 9B 사용자 (NU1~NU3) — 알림 카테고리 + 메시지 carry + 검색 cross-domain
✅ Phase 9A 관리자 (NA1) — 발송 form + 이력 + 모달
```

---

## zip 회신 후

```
☐ Cowork 에 "Phase 9 zip 도착"
```

→ Cowork 자동 sync + Phase 9C Auto Chain (4 PR).

---

**의뢰서 끝.**
