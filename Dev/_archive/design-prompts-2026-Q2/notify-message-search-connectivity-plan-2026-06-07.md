# Phase 9 — 알림·메시지·검색 점검 리포트

> **작성일**: 2026-06-07
> **결재**: Phase 9 = **알림·메시지·검색** ✅
> **선행 박제**: Phase 1~8 완료

---

## 0. 영역 매핑

| ID | 화면 | 라우트 | LOC | 박제 흔적 |
|----|------|--------|-----|----------|
| NU1 | Notifications (보강) | /notifications | 96 | ⚠ NotificationsClient v2 |
| NU2 | Messages (보강) | /messages | 655 | ✅ Phase 8 v2 박제 (3컬럼 · DB 미지원 정적 더미 / "준비 중") |
| NU3 | Search (보강) | /search | 261 | ✅ BDR v2 재구성 |
| NA1 | AdminNotifications (신규) | /admin/notifications | 251 | ❌ |

**총 LOC = 1263**

### Prisma 모델
- `notifications` (1765) — 알림 모델 (활성)
- `messages` 모델 = **없음** (DB 0% 지원 — /messages 정적 더미)

---

## 1. 갭 식별 (BN1~BN4)

> **명명**: BN = "Bridge Notify"

### BN1 — 알림 카테고리·필터 (★★★★)
NU1: 전체/대회/경기/팀/단체/시스템 등 카테고리 chip + 읽음 여부 분리 + main bar 카운트 동기화.

### BN2 — 메시지 hub (DB 미지원 carry) (★★★)
NU2: v2 박제 carry + "준비 중" 유지. 3컬럼 (스레드 / 대화 / 프로필) / 모바일 분기.

### BN3 — 통합 검색 (★★★)
NU3: 전역 검색 (경기/대회/팀/코트/유저/커뮤니티) + 카테고리 chip 결과 + 모든 Phase cross-domain.

### BN4 — 관리자 알림 발송 (★★)
NA1: target 분리 (전체/일반/팀장/관리자) + 알림 작성 + 발송 이력 + Phase 4 OA1 답습.

---

## 2. 의뢰 범위 — 4 시안 (사용자 3 + super-admin 1)

| ID | 분류 |
|----|------|
| NU1 | 보강 (NotificationsClient v2 carry + 카테고리 chip + 카운트) |
| NU2 | 보강 (v2 박제 carry + "준비 중" 유지 + 시각 정리) |
| NU3 | 보강 (BDR v2 carry + cross-domain Phase 1~8) |
| NA1 | 신규 (Phase 4 OA1 + Phase 6.1 PA1 답습) |

---

**리포트 끝.**
