# PR-1C-4 — UA3 TournamentEnroll (B3 결제 보강 + 사후 안내) 박제 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 의뢰**: `phase-1C-kickoff-cli-prompt-2026-05-28.md` (§6 자체 검수 / §7 역박제 / §8 안전 가드) + PR-1C-2, PR-1C-3 답습
> **본 의뢰 범위**: PR-1C-4 1 건만 박제
> **특수 사항**: 운영 [id]/join/page.tsx (1563 line) **이미 v2 시안 박제됨** → 본 PR = **B3 결제 보강 + 사후 안내 보강** 만

---

## 1. 한 줄 요약

UA3 시안의 **B3 결제 step 보강** (3 옵션 결제수단 + 결제 명세 + 안내) 과 **사후 안내 page** (success hero + CTA) 를 운영 `[id]/join/page.tsx` 의 기존 5-step / 4-step adaptive 흐름 위에 박제.

---

## 2. 대상 시안 + 운영 라우트

| 시안 | 라인 | 운영 라우트 | 상태 |
|------|------|-----------|------|
| UA3 TournamentEnroll.jsx | 277 | `src/app/(web)/tournaments/[id]/join/page.tsx` (1563) | **이미 v2 박제됨** — B3 보강만 추가 |
| tournament-enroll.css | 265 | `src/app/(web)/tournaments/[id]/join/_v2/*.tsx` 안 className 또는 globals.css | 시안 className (te-step / te-h3 / te-aside 등) 그대로 |

### 운영 _v2/ 폴더 (4 컴포넌트 추출 완료 — 변경 최소)

```
enroll-stepper.tsx      (98)    — Stepper UI (시안 te-stepper)
enroll-aside.tsx        (218)   — 우측 sticky aside (포스터 + D-카운터 + 환불 정책)
enroll-poster.tsx       (106)   — 포스터 카드
enroll-step-docs.tsx    (137)   — 서류 step "준비 중"
```

→ 본 PR 에서 **추가 0~2 컴포넌트** (예: `enroll-step-payment.tsx` / `enroll-success-hero.tsx`).

---

## 3. UA3 시안의 보강 포인트 (시안 헤더 line 8~10)

```
5단계 stepper 보존 (대회확인 / 디비전 / 로스터 / 서류 / 결제)
 + step 5 결제: 결제수단 / 명세 / 안내
 + 5단계 완료 후 "사후 안내" page (success hero + CTA)
```

### 시안 결제 수단 (3 옵션)

```
bank     계좌이체     발급된 가상계좌로 입금              account_balance
manual   무통장 입금  운영팀 계좌 직접 입금 (수동 확인)  receipt_long
card     카드 결제    신용/체크카드 즉시 결제             credit_card
```

### 운영 현황 (확인 결과)

- ✅ `Tournament.bank_name` / `bank_account` / `bank_holder` — bank 옵션 데이터 있음
- ✅ `TournamentTeam.payment_status` (default `unpaid`) — 상태 추적 가능
- ❌ **카드 결제 = 토스페이먼츠 Phase B 에서 도입 예정 — 현재 미연결** (schema line 1299 주석)
- ❌ manual 옵션 = bank 와 별 처리 미구현 (운영에 manual flag 부재)
- ✅ 완료 화면 = 이미 별 화면 (page.tsx line 406 / step="done" 전환)

---

## 4. 사용자 결재 필요 — 결제 옵션 처리 (CLI 가 사전 점검 후 사용자에 질의)

**옵션 A**: 3 옵션 모두 시각 박제
- bank = active (기본 / 운영 데이터 활용)
- manual = active (bank 와 같은 안내 흐름 — `payment_status` 만 사용)
- card = **시각 박제 + disabled + "준비 중" 안내** (토스 도입 후 활성화)

**옵션 B** (권장 — 보수적):
- bank 만 노출 (현 운영 그대로) + 시안의 카드/안내 시각 보강만
- manual / card = 시안 박제 보류 → 토스 Phase B 도입 시점 별 PR

**옵션 C** (보수 — 최소):
- B3 보강 전체 보류 → UA3 = 사후 안내 page 만 박제 + 결제 step 시각 변경 ❌

→ CLI 가 사전 점검 후 위 3 옵션 중 사용자 결재 받고 진행. **권장 = 옵션 B** (운영 영향 최소 / B3 보강 부분 반영 / 카드 결제 도입 시점에 옵션 A 로 전환).

---

## 5. 박제 절차 (옵션 B 권장 기준 — 옵션 결재 후 조정)

```
[Step 1] git checkout subin && git pull origin subin
[Step 2] BDR-current/screens/TournamentEnroll.jsx + tournament-enroll.css 읽기
         · 시안 결제 step (line ~50-100) + 사후 안내 (line ~120-150) 정독
[Step 3] 운영 join/page.tsx 안 결제 step (line 411-505) + 완료 step (line 406-) 위치 확인
[Step 4] 사용자 결재 — §4 옵션 A/B/C 중 결정
[Step 5] (옵션 B 기준) 박제:
         5-1. enroll-step-payment.tsx 신규 추출 (또는 page.tsx 안 inline)
              · 결제 명세 카드 (entry_fee / div_fees / 합계)
              · 입금 안내 카드 (bank_name / bank_account / bank_holder)
              · 시안 className (te-pay / te-h3) 그대로
         5-2. enroll-success-hero.tsx 신규 추출 (사후 안내 page)
              · 시안 te-success__title "신청이 접수되었습니다" + CTA
              · 기존 step="done" 분기 안에서 신규 컴포넌트 렌더
         5-3. _v2/ 안 기존 4 컴포넌트 = 변경 최소 (시각 token 만 정렬)
[Step 6] dev:3001 검증
         · /tournaments/<id>/join 5-step flow 끝까지 (4-step adaptive 도)
         · Step 5 결제 시각 = 결제 명세 + 입금 안내 카드
         · Step done 사후 = success hero + CTA
         · 모바일 720px / iOS input 16px / 버튼 44px
[Step 7] lint + typecheck — npm run lint && npx tsc --noEmit
[Step 8] 자체 회귀 검수 6 케이스 (kickoff §6 답습) + UA3 특수 (§7 아래)
[Step 9] commit + push
         git commit -m "design(1C-4): UA3 TournamentEnroll B3 결제 보강 + 사후 안내 박제 (옵션 B)"
         git push origin subin
[Step 10] subin → dev PR 생성 + Cowork 알림
[Step 11] phase-ledger Phase 1 ⑪ 에 PR-1C-4 ✅ 추가
```

---

## 6. 안전 가드 (kickoff §8 by reference — 추가 주의)

본 PR 만의 특수 주의:
- ❌ **API/Prisma 변경 ❌** — join API (`/api/web/tournaments/[id]/join` route.ts) 변경 0. 시각만.
- ❌ **새 라우트 만들지 ❌** — `[id]/join/success/` 같은 신규 라우트 ❌. 시안도 step="done" 분기 명시.
- ❌ **토스페이먼츠 코드 추가 ❌** — Phase B 별 작업 (schema line 1299 주석). 본 PR 옵션 B 권장 = card 옵션 박제 보류.
- ✅ 기존 `_v2/` 4 컴포넌트 활용 — 새 추출 최소 (0~2 컴포넌트)
- ✅ 5-step / 4-step adaptive (`hasCategories=true/false`) 보존 — 운영 line 334~349 분기 답습
- ✅ 약관 동의 step (page.tsx line 144 "Step 5+: 결제 동의") 보존
- ✅ payment_status (`unpaid` default) 변경 ❌

---

## 7. 자체 검수 (kickoff §6 + UA3 특수)

기본 6 케이스 + 본 PR 특수:
- ✅ 5-step (hasCategories=true) / 4-step (false) adaptive 보존 — 토글로 양쪽 확인
- ✅ Step 5 결제 = bank 단일 옵션 (옵션 B) + 결제 명세 카드 + 입금 안내 카드
- ✅ Step done 사후 = success hero "신청이 접수되었습니다" + CTA
- ✅ 우측 sticky aside (포스터 + D-카운터 + 환불 정책) 보존
- ✅ enroll-stepper 시각 = 시안 te-stepper className 일치 (done / cur / mute state)
- ✅ payment_status (`unpaid` → `paid` 전환 흐름) 운영 흐름 변경 ❌

---

## 8. 산출물 (CLI → 사용자)

```
1. PR-1C-4 박제 + subin → dev PR 링크 (예: #653)
2. _v2/ 안 신규 0~2 컴포넌트 (enroll-step-payment / enroll-success-hero — 추출 시)
3. [id]/join/page.tsx 안 결제 step + 완료 step 시각 갱신
4. phase-ledger Phase 1 ⑪ 에 PR-1C-4 ✅ 추가
5. §4 결재 결과 메모 (옵션 A/B/C 중 어느 거 채택)
6. scratchpad 작업 로그 1줄
7. 미푸시 commit 알림 (있을 경우)
```

→ 사용자 (수빈) 의 다음 액션:
```
☐ §4 옵션 결재 (CLI 가 사전 점검 후 질의 시점)
☐ PR-1C-4 결재 (subin → dev → main)
☐ "PR-1C-5 박제해줘" 한 줄 의뢰 → Cowork 가 PR-1C-5 의뢰서 자동 작성 (UC1 MyActivity)
```

---

## 9. 결재 후 CLI 다음 한 줄 응답 형식

```
✅ PR-1C-4 의뢰 확인 — UA3 TournamentEnroll B3 결제 보강 + 사후 안내 박제

이해: 운영 [id]/join/page.tsx 이미 v2 박제됨 → B3 결제 step + 사후 안내 만 보강. API/토스 ❌ / 새 라우트 ❌ / _v2/ 4 컴포넌트 활용 + 0~2 추출.

§4 옵션 A/B/C 사용자 결재 후 박제 시작. 권장 = 옵션 B (bank 단일).
```

---

**의뢰서 끝.** 수빈이 CLI 에 한 줄로 전달:
`Read Dev/design/prompts/phase-1C-4-ua3-cli-prompt-2026-05-28.md 하고 §4 결제 옵션 결재부터 받아줘.`
