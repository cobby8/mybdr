# 본인인증 mock 자체 입력 폴백 모드 설계 (2026-05-08)

> **목적**: PortOne 콘솔 채널 발급 전까지 (이번 주 내 예상) `/onboarding/identity` 진입 사용자가
> 빨간 에러 ("본인인증 설정이 완료되지 않았습니다") 에 막히지 않도록, **간단 폼 입력 폴백 모드** 활성.
> 환경변수 추가 = 자동으로 PortOne 모드 복귀 (코드 변경 0).
>
> **사용자 결정** (5/8): **B 톤 다운 + 사용자 직접 정보 입력 폴백**.
>
> **제약**: 이 문서는 **설계만**. 코드/DB 변경 0.

---

## §1. 현황 분석

### 1.1 5/7~5/8 누적 상태

| 항목 | 상태 | 커밋 |
|---|---|---|
| `/onboarding/identity` 페이지 + IdentityStep | ✅ | 5/7 `c9fe34b` |
| IdentityVerifyButton — PortOne V2 SDK 호출 | ✅ | 5/7 `d7a82b5` |
| `/api/web/identity/verify` 서버 endpoint (V2 재조회) | ✅ | 5/7 `00d001b` |
| PR3 layout 가드 (3 페이지 강제 redirect) | ✅ | 5/8 `f55105e` (mock 모드 default) |
| `isIdentityGateEnabled()` 헬퍼 (channel key 환경변수 기반) | ✅ | 5/8 |
| **PortOne 채널 발급 + 환경변수 추가** | ⏳ | 사용자 외부 작업 (이번 주) |

### 1.2 현재 사용자가 보는 화면 (5/8 운영)

```
mybdr.kr/onboarding/identity 진입
    ↓
[IdentityStep 안내 박스]
  · 실명 (한글)
  · 휴대폰 번호
  · 생년월일 (선택)
[본인인증 시작] 버튼  ← 클릭
    ↓
IdentityVerifyButton.handleClick()
    ↓
storeId or channelKey 둘 중 하나라도 비어있음 →
빨간 에러 "본인인증 설정이 완료되지 않았습니다. 운영자에게 문의해 주세요."
사용자: 진행 불가 / dead end
```

→ **문제**: 사용자가 onboarding 1단계에서 완전히 막힘. 다음 단계 (`/onboarding/environment`) 로 갈 수 없음.

### 1.3 현재 코드 분기 위치

**`identity-verify-button.tsx`** Line 69~77:
```tsx
const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const channelKey = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY;

if (!storeId || !channelKey) {
  setErrorText("본인인증 설정이 완료되지 않았습니다. 운영자에게 문의해 주세요.");
  return;
}
```

→ 이 지점이 mock 폴백 분기점. `if (!storeId || !channelKey)` 시 mock 모달 오픈으로 전환.

### 1.4 사용 중인 DB 컬럼 (User 모델)

```prisma
// Phase 12-C (200~218 line)
verified_name  String?   @db.VarChar(100)
verified_phone String?   @db.VarChar(20)
verified_birth DateTime? @db.Date
name_verified  Boolean   @default(false)
verified_at    DateTime? @db.Timestamp(6)

// 동기화 대상 (5/7 사용자 결정 §1)
name       String?   @db.VarChar
phone      String?   @db.VarChar
birth_date DateTime? @db.Date
```

→ PortOne 인증 완료 시 `verified_*` + `name` / `phone` / `birth_date` 모두 동기화.
mock 폴백도 같은 컬럼 사용 — 단, **mock 출처 표식 필요** (위험 분석 §2.2).

---

## §2. 보안 + 운영 영향 검토

### 2.1 위험 1 — mock 모드 우회 (가짜 정보 통과)

| 항목 | 분석 |
|---|---|
| **시나리오** | 사용자가 가짜 이름 / 가짜 휴대폰 / 임의 생년월일 입력 → name_verified=true |
| **영향 범위** | 대회 출전 게이트 / 팀 가입 가드 통과 / `/games/[id]`, `/teams/[id]`, `/tournaments/[id]/join` 진입 가능 |
| **현재 운영 사용 기간** | 며칠 (PortOne 활성화까지 — 사용자 추정 "이번 주 내") |
| **예상 영향 사용자 수** | 적음 (출시 전 임시) |
| **실제 위험도** | **낮음** — mock 폴백은 channel key 미설정 시에만 켜지고, 사용자에게 "임시 모드" 명시 안내 |

**대응**:
- mock 모드 = 데이터 신뢰도 낮음 = `identity_method = "mock"` 표식 필수 (§3.2)
- 운영팀이 mock 모드 통과 사용자를 사후 식별 가능 → PortOne 활성화 후 재인증 권유 결정
- mock 모드 자체에 사용자 안내 카피 추가 — "출시 준비 중 임시 입력 모드입니다. 정식 인증은 이번 주 내 활성화됩니다."

### 2.2 위험 2 — 데이터 무결성 (PortOne 활성화 후 처리)

**옵션 비교**:

| 옵션 | 내용 | 장점 | 단점 |
|---|---|---|---|
| **A. 그대로 인정** | mock 통과 데이터 그대로 유지, name_verified=true | 사용자 재인증 불필요 (UX 우수) | 가짜 정보 영구 잔존 / 대회 출전 시 신원 미확인 |
| **B. 자동 invalidate** | PortOne 활성화 시 mock 통과자 name_verified=false 일괄 |  데이터 정합성 100% | 사용자 갑자기 막힘 / 신뢰 손상 |
| **C. 권유 안내 (강제 X)** | mock 통과자에게 "정식 인증 받기" 배너 노출, 차단 X | 균형 — UX + 정합성 | 사용자 무시 가능 |
| **D. 첫 핵심 액션 시점 invalidate** | 대회 출전/팀 가입 시 verified_method='portone' 만 통과시키고 mock 은 차단 | 정합성 + 핫스팟 한정 | 구현 복잡 / 가드 로직 변경 |

**권장**: **C (권유 안내) + 운영 모니터링** — mock 통과자 수가 적을 것으로 예상되므로 강제 차단 비용 > 효과.
→ 사용자 결재 필요 (Q3).

### 2.3 위험 3 — 서버 endpoint 분기 (보안)

**옵션 비교**:

| 옵션 | 내용 | 보안 |
|---|---|---|
| **A. 기존 endpoint 분기** | `/api/web/identity/verify` 가 body 에 `mock=true` 받으면 mock 처리 | 클라가 mock=true 강제 가능 → PortOne 활성화 후에도 mock 우회 가능 ❌ |
| **B. 별도 endpoint** | `/api/web/identity/mock-verify` 신규 (mock 전용) | endpoint 자체에서 `isIdentityGateEnabled()` 체크 → channel key 있으면 503 거부 ✅ |
| **C. 서버 미사용 (클라 직접 user 업데이트)** | profile/route.ts PATCH 로 처리 | 서버 게이트 없음 → 클라 위변조 가능 ❌ |

**권장**: **옵션 B — 별도 endpoint**.
- `POST /api/web/identity/mock-verify` 신규
- 진입 시점 `isIdentityGateEnabled()` 체크 → true 면 503 응답 ("PortOne 활성화 상태에서는 mock 사용 불가")
- 환경변수 추가 = 자동으로 mock endpoint 비활성화 (코드 변경 0)
- 보안 가드 = "PortOne 미활성 + 본인 user 만 본인 데이터 update" 한정

### 2.4 운영 영향 시뮬레이션

| 시나리오 | mock 폴백 적용 시 |
|---|---|
| **현재 (5/8 운영)** | 빨간 에러 → 사용자 onboarding 1단계 막힘 → 영향 100% |
| **mock 폴백 활성 (며칠)** | 사용자 자체 입력 → name_verified=true / 임시 모드 안내 표시 → 다음 단계 진입 가능 |
| **PortOne 환경변수 추가 직후** | mock endpoint 503 자동 / IdentityVerifyButton 자동 PortOne SDK 호출 모드 / 신규 사용자는 PortOne 인증 |
| **mock 통과 기존 사용자** | 옵션 C (권유 안내) — 그대로 인정 + 배너 노출 / 옵션 B (강제) — 일괄 invalidate (사용자 결재) |

---

## §3. 클라이언트 컴포넌트 설계

### 3.1 컴포넌트 구조

```
IdentityStep (현재)
├── IdentityVerifyButton (현재 — PortOne SDK 호출 전용)
│   └── 분기 추가:
│       if (!isIdentityGateEnabled()) → 모달 오픈
│       else → PortOne SDK 호출 (기존)
└── MockIdentityModal (신규)
    ├── 입력 폼:
    │   · 실명 (한글) — required, minLength 2
    │   · 휴대폰 번호 — required, /^010-?\d{4}-?\d{4}$/ 정규식 (또는 010\d{8})
    │   · 생년월일 — optional, YYYY-MM-DD
    └── [확인] 버튼 → POST /api/web/identity/mock-verify
```

### 3.2 신규 컴포넌트 — `MockIdentityModal.tsx`

**경로**: `src/components/identity/mock-identity-modal.tsx` (신규, ≈ 180 라인)

**props**:
```tsx
interface Props {
  open: boolean;
  onClose: () => void;
  onVerified: (data: { verified_name: string; verified_phone: string }) => void;
}
```

**디자인 톤** (사용자 결정 §B 톤 다운):
- ForceActionModal 패턴 카피 (max-width 460 / padding 16 / iOS 16px input)
- 헤더 카피: "임시 정보 입력 (출시 준비 중)"
- 안내 박스 (회색 톤): "정식 본인인증은 이번 주 내 활성화됩니다. 임시 입력 정보는 정식 인증 후 자동 갱신됩니다."
- 색상: `var(--ink-mute)` / `var(--bg-elev)` / `var(--border)` (빨간 색 ❌, 노란 안내 톤)

**검증**:
- 클라 zod-like 검증 (실명 한글 2자+, 휴대폰 11자리)
- 서버에서 동일 검증 재수행 (신뢰 X)

### 3.3 IdentityVerifyButton 분기 추가

**Line 65~77 변경 (≈ 20 라인 추가)**:

```tsx
const handleClick = async () => {
  if (submitting) return;
  setErrorText(null);

  // 5/8 mock 폴백 — channel key 미설정 시 자체 입력 모달 오픈
  if (!isIdentityGateEnabled()) {
    setMockModalOpen(true);  // 신규 state
    return;
  }

  // 기존 PortOne SDK 호출 흐름
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY;
  // ... (기존 코드 그대로)
};

// 렌더링 추가:
<MockIdentityModal
  open={mockModalOpen}
  onClose={() => setMockModalOpen(false)}
  onVerified={(data) => {
    setMockModalOpen(false);
    onVerified(data);
    setVerified(true);
  }}
/>
```

### 3.4 톤 다운 — 빨간 에러 제거

**제거 대상**: Line 72~76 의 `setErrorText("본인인증 설정이 완료되지 않았습니다. 운영자에게 문의해 주세요.")`
→ mock 모달 오픈으로 대체 (에러 표시 안 함).

**버튼 라벨 분기**:
- mock 모드: "임시 정보 입력" (회색 톤 또는 연한 cafe-blue)
- PortOne 활성: "본인인증 시작" (기존)

---

## §4. 서버 endpoint 설계

### 4.1 신규 endpoint — `POST /api/web/identity/mock-verify`

**경로**: `src/app/api/web/identity/mock-verify/route.ts` (신규, ≈ 100 라인)

**진입 가드 (보안 핵심)**:

```ts
import { isIdentityGateEnabled } from "@/lib/auth/identity-gate-flag";

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  // 가드 1 — channel key 환경변수 있으면 mock endpoint 자동 비활성화
  if (isIdentityGateEnabled()) {
    return apiError(
      "정식 본인인증이 활성화되어 임시 입력은 사용할 수 없습니다.",
      503,
      "MOCK_DISABLED",
    );
  }

  // 가드 2 — body 검증 (zod)
  const body = await req.json();
  const parsed = mockVerifySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("입력값 검증 실패", 400);
  }
  const { name, phone, birthDate } = parsed.data;

  // 가드 3 — 본인 user 만 본인 데이터 update (withWebAuth 가 보장)
  const updated = await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      verified_name: name,
      verified_phone: phone,
      verified_birth: birthDate ? new Date(birthDate) : null,
      name_verified: true,
      verified_at: new Date(),
      identity_method: "mock",  // §5 — 신규 컬럼
      // 사용자 결정 §1: name / phone / birth_date 동기화 (PortOne 패턴 동일)
      name,
      phone,
      ...(birthDate ? { birth_date: new Date(birthDate) } : {}),
    },
    select: {
      id: true, verified_name: true, verified_phone: true,
      name_verified: true, verified_at: true, identity_method: true,
    },
  });

  // 감사 로그 — admin_logs 또는 별도 audit
  // 옵션: admin_logs 에 severity="info", description="mock_identity_verified" 1건
  // (사용자 결정 Q5)

  return apiSuccess({
    id: updated.id.toString(),
    verified_name: updated.verified_name,
    verified_phone: updated.verified_phone,
    name_verified: updated.name_verified,
    verified_at: updated.verified_at,
  });
});

const mockVerifySchema = z.object({
  name: z.string().min(2).max(50),
  phone: z.string().regex(/^010-?\d{4}-?\d{4}$/),  // 한국 휴대폰
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
```

### 4.2 기존 endpoint — 변경 0

`/api/web/identity/verify` (5/7 PortOne V2 재조회 라우트) = **변경 없음**.

**자동 분기 보장**:
- mock 모드 = 클라가 `/api/web/identity/mock-verify` 호출
- PortOne 활성 = 클라가 `/api/web/identity/verify` 호출 (기존)
- 클라 분기 = `isIdentityGateEnabled()` 단일 신호

---

## §5. DB 스키마 변경

### 5.1 신규 컬럼 — `user.identity_method`

**필요 사유**:
- mock 통과 / PortOne 통과 / 백필 / null(미인증) 4 케이스 식별
- PortOne 활성화 후 mock 통과자 사후 식별 + 권유 안내 + 통계
- 운영 모니터링 (mock 통과자 수 추적)

**스키마**:
```prisma
model user {
  // ...
  // 5/8 — 본인인증 출처 표식 (mock / portone / null=미인증)
  // 백필 X — 신규 인증 시점부터 기록. 기존 통과자 (5/7 이전) = null 유지
  identity_method String? @db.VarChar(20)
}
```

**값**:
- `null` — 미인증 또는 백필 안 됨 (기존 사용자)
- `"mock"` — 5/8~PortOne 활성화 전까지 임시 입력
- `"portone"` — PortOne V2 인증 (5/7 이후 + PortOne 활성화 후)

**무중단성**:
- NULL 허용 ADD COLUMN = 무중단 변경 (운영 DB 즉시 적용 가능, CLAUDE.md §DB 정책 §3-2 자동 진행 가능 케이스)
- 단, **사용자 사전 검토 + 명시 승인 필요** (CLAUDE.md §DB 정책 §3-2)

### 5.2 변경 0 보장

- 기존 `verified_name` / `verified_phone` / `verified_birth` / `name_verified` / `verified_at` 그대로 사용
- prisma migrate 사용 X — `prisma db push` 1회 (NULL 허용 ADD COLUMN)

---

## §6. PortOne 활성화 시 자동 전환 메커니즘

### 6.1 단일 신호 — `isIdentityGateEnabled()`

**3 위치 모두 동일 헬퍼 사용**:

| 위치 | 동작 |
|---|---|
| **클라 IdentityVerifyButton** | `false` → mock 모달 / `true` → PortOne SDK |
| **서버 mock-verify endpoint** | `true` → 503 거부 ("MOCK_DISABLED") |
| **서버 layout 가드** (`require-identity-for-page`) | `false` → noop / `true` → 강제 redirect (5/8 PR3 동일) |

→ 환경변수 1개 (`NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY`) 추가 = 3 위치 일괄 전환.
→ 코드 변경 0 / 롤백 = 환경변수 제거.

### 6.2 build inline 주의 (Next.js 15)

- `NEXT_PUBLIC_*` = build 시 inline → 환경변수 변경 = **Vercel 재배포 필요**
- 런타임 hot swap 불가
- 이미 `identity-gate-flag.ts` 주석에 명시되어 있음

---

## §7. 톤 다운 결정 (UI 카피 / 색상)

### 7.1 색상

| 위치 | 현재 | 변경 |
|---|---|---|
| IdentityVerifyButton 에러 텍스트 | `color: "var(--accent)"` (빨간) | **삭제** (모달 오픈으로 대체) |
| MockIdentityModal 안내 박스 | — | `color: "var(--ink-mute)"` (회색) / `background: "var(--bg-elev)"` (회색 톤) |
| MockIdentityModal 헤더 | — | `color: "var(--ink)"` 일반 톤 |
| 확인 버튼 | — | `background: "var(--cafe-blue)"` (기존 본인인증 시작 버튼과 동일) |

**노란 톤은 사용 안 함** — 사용자 결정 §B "톤 다운" → 회색 안내가 가장 안전.

### 7.2 카피

**IdentityStep 안내 박스 (현재)**:
```
실명 (한글)
휴대폰 번호
생년월일 (선택)
```
→ **변경 0** (mock 모드도 동일 입력 항목).

**IdentityStep 하단 카피 (Line 76~80 현재)**:
```
Portone PASS 통합 전 임시 mock 단계입니다.
실제 출시 시 SMS / PASS 인증으로 자동 교체됩니다.
```
→ **유지** — 이미 적절한 톤.

**MockIdentityModal 헤더**: `"임시 정보 입력 (출시 준비 중)"`

**MockIdentityModal 안내**:
```
정식 본인인증은 곧 활성화됩니다.
임시 입력 정보는 정식 인증 시 자동 갱신됩니다.
```
(실명/휴대폰 등 입력 후 정식 인증 받으면 PortOne 응답값으로 덮어쓰기)

**버튼 라벨 분기** (IdentityVerifyButton):
- mock 모드: `"임시 정보 입력"` (출시 전 임시 톤)
- PortOne 활성: `"본인인증 시작"` (기존)

---

## §8. mock 데이터 정책 (PortOne 활성화 후)

### 8.1 사용자 결재 옵션 (Q3)

**옵션 C (권장) — 권유 안내 + 그대로 인정**:
- mock 통과 사용자 = `name_verified=true` 그대로 유지 / `identity_method='mock'` 표식
- 마이페이지 또는 `/onboarding/identity` 진입 시 안내 배너 노출:
  > "정식 본인인증이 활성화되었어요. 정확한 신원 확인을 위해 다시 인증해 주세요. (선택)"
- 강제 차단 X / 사용자가 무시해도 차단 0
- 출전/가입 게이트 = `name_verified=true` 만 검사 (변경 0)

**옵션 D (대안) — 핵심 액션 시점 차단**:
- 대회 출전 / 팀 가입 시점에 `identity_method='portone'` 검사 (mock 차단)
- 사용자 → "정식 인증 받기" 배너 노출 → 인증 후 액션 진행
- 구현 복잡 (가드 3 페이지 + 해당 API 4건)

→ **권장 = 옵션 C** (mock 통과자 수가 적어 강제 차단 비용 > 효과).
→ **사용자 결재 필요 (Q3)**.

---

## §9. 구현 단계 (5 step)

| 순서 | 작업 | 담당 | 산출 파일 | 라인 | 선행 |
|---|---|---|---|---|---|
| **1** | DB ADD COLUMN — `user.identity_method` (NULL 허용) | developer | `prisma/schema.prisma` (수정) | +5 | 사용자 승인 (Q4) |
| **2** | 신규 컴포넌트 `MockIdentityModal.tsx` | developer | `src/components/identity/mock-identity-modal.tsx` (신규) | ~180 | 1 |
| **3** | 신규 endpoint `POST /api/web/identity/mock-verify` | developer | `src/app/api/web/identity/mock-verify/route.ts` (신규) | ~100 | 1 |
| **4** | `IdentityVerifyButton` 분기 추가 (mock 모달 오픈) | developer | `src/components/identity/identity-verify-button.tsx` (수정) | +25 | 2, 3 |
| **5** | 테스트 + 검증 | tester | mock 모드 / PortOne 활성 / 회귀 9 시나리오 | — | 4 |

**병렬 가능**: 2 + 3 동시 진행 (모달 컴포넌트 + endpoint 독립).

**총 분량**: ≈ 310 라인 (기존 200~ 라인의 PR3 와 비슷).

---

## §10. 테스트 계획

### 10.1 mock 모드 (현재 운영 = 환경변수 미설정)

| 시나리오 | 기대 |
|---|---|
| /onboarding/identity 진입 → "임시 정보 입력" 버튼 클릭 | MockIdentityModal 오픈 |
| 모달 입력 → 확인 클릭 | name_verified=true / identity_method='mock' / 다음 단계 redirect |
| 빈 입력 / 잘못된 휴대폰 | 클라 검증 에러 표시 (서버 도달 X) |
| `POST /api/web/identity/mock-verify` 직접 호출 | 본인 user 만 update (withWebAuth) |
| `POST /api/web/identity/verify` (PortOne) 직접 호출 | 503 (PORTONE_NOT_CONFIGURED — 기존 동작) |

### 10.2 PortOne 활성 (환경변수 추가 후)

| 시나리오 | 기대 |
|---|---|
| /onboarding/identity 진입 → "본인인증 시작" 버튼 (라벨 자동 변경) | PortOne SDK 호출 (기존) |
| `POST /api/web/identity/mock-verify` 직접 호출 (curl) | 503 ("MOCK_DISABLED") — 자동 차단 |
| 기존 mock 통과자 진입 | 옵션 C (권장) — 그대로 인정 + 배너 안내 |

### 10.3 회귀 (9 시나리오)

| # | 시나리오 | 기대 |
|---|---|---|
| 1 | 인증 완료 사용자 진입 | / 또는 /onboarding/environment redirect (변경 0) |
| 2 | 비로그인 사용자 진입 | /login redirect (변경 0) |
| 3 | PR1.5.a 서버 endpoint 게이트 | 변경 0 |
| 4 | PR1.5.b 클라 안내 (4 페이지) | 변경 0 |
| 5 | PR3 layout 가드 (3 페이지) | 변경 0 (mock 모드 default 유지) |
| 6 | PortOne 환경변수 추가 직후 | mock endpoint 503 자동 / 클라 PortOne SDK 자동 |
| 7 | 환경변수 제거 (롤백) | 즉시 mock 폴백 자동 (코드 revert 0) |
| 8 | 기존 user.identity_method=null | NULL 허용 → 회귀 0 |
| 9 | Flutter v1 API (`/api/v1/...`) | 변경 0 (web 전용 endpoint 신규) |

---

## §11. 위험 + 회귀 0 보장

### 11.1 보안 가드 (3 단)

1. **환경변수 단일 신호** — `isIdentityGateEnabled()` 가 클라/서버/가드 3 위치에서 동일 판정
2. **서버 endpoint 분리** — mock 전용 endpoint 가 channel key 환경변수 있으면 503 자동 거부 (PortOne 활성 후 mock 우회 불가)
3. **withWebAuth + 본인 user 한정** — 타 사용자 데이터 update 불가

### 11.2 회귀 0 보장

| 영역 | 변경 |
|---|---|
| Flutter API (`/api/v1/...`) | **0** (web 전용 endpoint 신규) |
| 기존 `/api/web/identity/verify` | **0** (PortOne 흐름 변경 X) |
| 기존 IdentityStep server page | **0** (returnTo 흐름 유지) |
| 5/8 PR3 layout 가드 (3 페이지) | **0** (mock 모드 default 유지) |
| 5/7 PR1.5.a/b 게이트 | **0** |
| DB 기존 컬럼 (verified_*) | **0** (변경 X / 신규 컬럼만 ADD) |

### 11.3 롤백 1초

- 환경변수 추가 (`NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=...`) → mock 자동 OFF
- 환경변수 제거 → mock 자동 ON
- 코드 변경 0 / Vercel 재배포 1회

### 11.4 mock 통과자 사후 처리

- `identity_method='mock'` 표식 → 사후 SELECT 가능 (`SELECT count(*) FROM user WHERE identity_method='mock'`)
- 옵션 C (권유 안내) 또는 옵션 D (강제 차단) 선택 가능
- 데이터 보존 — invalidate 안 해도 식별 가능

---

## §12. 사용자 결재 필요 항목 (Q1~Q5)

| # | 항목 | 옵션 | 권장 |
|---|---|---|---|
| **Q1** | 자체 입력 폼 필드 — 생년월일 필수 vs 선택? | 필수 / **선택** | **선택** (PortOne 응답에서도 선택, 사용자 결정 §1.1 안내 박스 "생년월일 (선택)" 일관성) |
| **Q2** | mock 모드 안내 톤 — 회색 vs 노란? | **회색** / 노란 | **회색** (사용자 결정 §B "톤 다운" 충실, 노란 = 경고 톤) |
| **Q3** | PortOne 활성화 후 mock 통과자 처리 | A 그대로 인정 / B 강제 invalidate / **C 권유 안내 (그대로 인정 + 배너)** / D 핵심 액션 차단 | **C** (사용자 영향 0 + 표식 보존) |
| **Q4** | DB 스키마 변경 — `user.identity_method` ADD COLUMN (NULL 허용 무중단) | **ADD** / 사용 안 함 (감사 로그만) | **ADD** (사후 식별 + 통계 + 권유 안내 분기 핵심) |
| **Q5** | mock 통과 시 admin_logs 기록 여부 | **기록** / 미기록 | **기록** (severity=info / description="mock_identity_verified" / 운영 추적) |

---

## §13. 구현 후 PortOne 활성화 흐름 (사용자 외부 작업)

1. PortOne 콘솔 — 본인인증 채널 발급 (PASS / SMS / KCP)
2. Vercel 환경변수 추가:
   - `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx`
   - `PORTONE_V2_API_SECRET=...` (이미 결제용 공유)
3. Vercel 재배포 (자동 또는 수동 redeploy)
4. 검증:
   - /onboarding/identity 진입 → "본인인증 시작" 버튼 라벨 자동 변경
   - PortOne SDK 호출 → PASS 인증
   - `/api/web/identity/mock-verify` curl → 503 ("MOCK_DISABLED")
   - 기존 mock 통과자 (옵션 C) → 배너 안내 노출

→ **코드 변경 0 / 롤백 1초 (환경변수 제거)**.

---

## §14. 다음 진입점 (developer 진입)

**선행**: 사용자 Q1~Q5 결재.

**developer 진입 후 작업 순서**:
1. Q4 승인 → DB ADD COLUMN (`prisma db push` — 사용자 사전 검토 필수)
2. MockIdentityModal 컴포넌트 작성 (Q1 결정 반영)
3. `/api/web/identity/mock-verify` endpoint 작성 (Q5 결정 반영)
4. IdentityVerifyButton 분기 추가
5. tester 검증 (mock 모드 / 회귀 9 시나리오)
6. PR (subin → dev → main)

**추정 시간**: 2~3시간 (3 파일 신규 + 1 파일 수정 + DB 1 컬럼 + 테스트).
