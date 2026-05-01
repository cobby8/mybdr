# 프로필 저장 500 — 로컬에서 운영 DB 직접 진단 (배포 우회)

> Vercel 로그 접근 불가. 디버그 패치 배포 사이클 거칠 시간 없음.
> → 로컬에서 .env 의 운영 DB 에 직접 같은 prisma 쿼리를 쏴서 stack trace 즉시 추출.

---

## 0. 컨텍스트

운영 mybdr.kr/profile/edit 에서 `PATCH /api/web/profile` 가 500 떨어짐.
응답 body: `{"error":"Internal error"}` 만 (확인 완료). → `route.ts:189` fallthrough 에서 떨어진 케이스. P2002 도 아닌 다른 종류 에러.

`.env` 의 DATABASE_URL 은 운영 DB 가리키므로, 로컬 tsx 스크립트로 운영 DB 에 직접 connect 후 같은 prisma.user.update 를 재현하면 진짜 에러가 즉시 throw 됨.

사용자: 수빈 (snukobe@gmail.com, 닉네임 "수빈", PG, 182cm — 화면 캡처 기준)

---

## 1. 사전 점검

```bash
git branch --show-current      # subin 이어야 함 (수정 작업 X, 그래도 룰)
test -f .env && echo "ok"      # .env 존재 확인
```

---

## 2. 작업 1 — 진단 스크립트 작성

`scripts/_temp/` 디렉토리에 임시 스크립트 생성.

```bash
mkdir -p scripts/_temp
```

`scripts/_temp/diagnose-profile-save.ts` 파일을 다음 내용으로 작성 (Write 도구 사용):

```ts
/**
 * 프로필 저장 500 진단 — 운영 DB 직접 호출하여 진짜 에러 stack trace 캡처.
 *
 * 실행: npx tsx scripts/_temp/diagnose-profile-save.ts
 *
 * 운영 mybdr.kr/profile/edit 의 PATCH 와 동일한 prisma.user.update 호출을
 * 단계별로 재현. 어떤 필드/값 조합에서 에러가 터지는지 좁힘.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function logError(label: string, e: unknown) {
  const err = e as {
    name?: string;
    code?: string;
    message?: string;
    meta?: unknown;
    stack?: string;
  };
  console.error(`\n❌ [${label}] FAILED`);
  console.error("  name:   ", err?.name);
  console.error("  code:   ", err?.code);
  console.error("  message:", err?.message);
  console.error("  meta:   ", JSON.stringify(err?.meta, null, 2));
  console.error("  stack(top 8):");
  err?.stack?.split("\n").slice(0, 8).forEach((line) => console.error("    " + line));
}

(async () => {
  // ─── 1) 수빈 user 조회 ─────────────────────────────────────
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "snukobe@gmail.com" },
        { nickname: "수빈" },
      ],
    },
    select: {
      id: true, email: true, nickname: true, name: true,
      position: true, city: true, district: true,
      height: true, weight: true, birth_date: true,
      bio: true, phone: true, profile_image_url: true,
    },
  });
  if (!user) {
    console.error("❌ user not found");
    return;
  }
  console.log("✅ Current user record:");
  console.log(JSON.stringify(user, (_k, v) => typeof v === "bigint" ? v.toString() : v, 2));

  const userId = user.id;

  // updateProfile 의 select 부분 (lib/services/user.ts:178-193) 그대로 재현
  const RESPONSE_SELECT = {
    nickname: true,
    position: true,
    height: true,
    weight: true,
    city: true,
    district: true,
    bio: true,
    name: true,
    birth_date: true,
  } as const;

  // ─── 2) 단계별 재현 — 어떤 필드 조합에서 에러 터지는지 좁힘 ──

  // Test A: 변경 없이 닉네임만 동일 값 update (기준선)
  try {
    const r = await prisma.user.update({
      where: { id: userId },
      data: { nickname: user.nickname },
      select: RESPONSE_SELECT,
    });
    console.log("\n✅ [A: 닉네임만 같은 값] OK:", r);
  } catch (e) { logError("A: 닉네임만 같은 값", e); }

  // Test B: 포지션 PG 로 변경 (캡처 1=SG, 캡처 2=PG → 사용자가 변경한 필드)
  try {
    const r = await prisma.user.update({
      where: { id: userId },
      data: { position: "PG" },
      select: RESPONSE_SELECT,
    });
    console.log("\n✅ [B: position=PG] OK:", r);
  } catch (e) { logError("B: position=PG", e); }

  // Test C: 키 182 로 변경 (현재 값과 같은 값)
  try {
    const r = await prisma.user.update({
      where: { id: userId },
      data: { height: 182 },
      select: RESPONSE_SELECT,
    });
    console.log("\n✅ [C: height=182] OK:", r);
  } catch (e) { logError("C: height=182", e); }

  // Test D: 운영 PATCH 의 전형적 풀 payload 재현
  try {
    const r = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname: user.nickname,
        position: "PG",
        height: user.height ?? 182,
        weight: user.weight ?? null,
        city: user.city,
        district: user.district,
        bio: user.bio,
        name: user.name,
        birth_date: user.birth_date,
      },
      select: RESPONSE_SELECT,
    });
    console.log("\n✅ [D: 풀 payload] OK:", r);
  } catch (e) { logError("D: 풀 payload", e); }

  // Test E: birth_date 를 string 으로 넣어보기 (route.ts 가 new Date() 변환)
  // route.ts:119: birth_date: birth_date ? new Date(birth_date as string) : null
  // 폼이 빈 string "" 또는 잘못된 형식 보내면? (frontend 는 form.birth_date || null)
  try {
    const r = await prisma.user.update({
      where: { id: userId },
      data: { birth_date: new Date("") }, // Invalid Date — 가설 검증
      select: RESPONSE_SELECT,
    });
    console.log("\n✅ [E: Invalid Date] OK:", r);
  } catch (e) { logError("E: Invalid Date 가설", e); }

  // Test F: 운영 DB drift 가설 — name_verified 컬럼이 schema 에는 있는데
  // 운영 DB 에 없는 경우. update data 에는 안 넣지만, prisma client 가
  // schema 기준 query 보낼 때 SELECT 에 자동 포함되는지 검증.
  try {
    const r = await prisma.user.findUnique({
      where: { id: userId },
      // @ts-expect-error — 일부러 schema 에 있을 수 있는 필드 SELECT
      select: { id: true, name_verified: true, verified_at: true },
    });
    console.log("\n✅ [F: name_verified SELECT] OK:", r);
  } catch (e) { logError("F: name_verified SELECT 가설 (schema drift)", e); }

  console.log("\n진단 완료.");
})().finally(() => prisma.$disconnect());
```

---

## 3. 작업 2 — 실행

```bash
npx tsx scripts/_temp/diagnose-profile-save.ts 2>&1 | tee scripts/_temp/diagnose-output.log
```

출력 끝까지 캡처. 사용자에게 다음 항목을 보여줌:
- 각 Test (A~F) 의 OK / FAILED 결과
- FAILED 의 경우 name / code / message / meta / stack(top 8)

---

## 4. 작업 3 — 결과 해석 가이드

| 어디서 실패 | 의미 | 영구 수정 방향 |
|---|---|---|
| **A 실패** | 운영 DB schema drift 또는 prisma generate 누락 | `prisma generate` + drift 컬럼 식별 |
| **B 실패** | position 컬럼 타입 / enum 미스매치 | schema vs DB 비교 |
| **C 실패** | height 컬럼 타입 미스매치 | 동일 |
| **D 실패** | 위 단일 필드는 OK 인데 조합에서 실패 = unique 제약 또는 trigger | 추가 진단 |
| **D 까지 OK + E 실패** | Invalid Date — 프론트가 잘못된 birth_date 보냄 | route.ts 에서 isNaN(new Date) 가드 추가 |
| **F 실패** | name_verified/verified_at 등 schema-DB drift | schema.prisma 에서 그 컬럼 제거 또는 운영 DB SQL 적용 |
| **모두 OK** | 순수 prisma 호출은 OK = 다른 사이드이펙트 (matchPlayersByPhone / generateToken 등) | route.ts 의 try/catch 외부 코드 점검 |

---

## 5. 작업 4 — 사용자에게 보고 + 영구 픽스 단계

진단 결과를 사용자에게 보고. 가장 가능성 높은 영구 픽스 1개 제안:

### 케이스별 픽스 prompt:

**(케이스 1) F 실패 — schema drift 확정**
- `prisma/schema.prisma` 의 User 모델에서 운영 DB 미존재 컬럼 (예: name_verified, verified_at) 주석 처리
- 또는 운영 DB 에 `ALTER TABLE` 로 컬럼 추가 (사용자 운영 DB 변경 OK 했음)
- `prisma generate` 후 빌드

**(케이스 2) E 실패 — Invalid Date**
- `src/app/api/web/profile/route.ts:119` 의 birth_date 처리에 isNaN 가드 추가:
```ts
let parsedBirthDate: Date | null = null;
if (birth_date) {
  const d = new Date(birth_date as string);
  if (!isNaN(d.getTime())) parsedBirthDate = d;
  else return apiError("생년월일 형식이 올바르지 않습니다.", 400);
}
// ...
...(birth_date !== undefined && { birth_date: parsedBirthDate }),
```

**(케이스 3) 다른 결과** — 결과 보고 받은 뒤 별도 픽스 프롬프트 작성

---

## 6. 작업 5 — 정리

```bash
rm -rf scripts/_temp
```

(스택 트레이스/출력은 결과 보고 후 사용자가 별도 보존하길 원하면 다른 위치로 이동)

---

## 7. 기록 (CLAUDE.md 룰)

### 7-1. `.claude/scratchpad.md` 작업 로그 1줄 추가 (진단 단계)

```
- 2026-05-01: profile PATCH 500 'Internal error' — 로컬 tsx 진단 스크립트로 운영 DB 직접 호출 [Test X 실패 = 원인]. 영구 픽스 진행 중.
```

### 7-2. 영구 픽스 적용 후 `.claude/knowledge/errors.md` 본 진단 결과 + 픽스 박제

---

## 8. 가드레일

- ❌ 운영 DB UPDATE 는 진단 스크립트 안에서만 (현재 user 본인의 무해한 update 만 시도)
- ❌ scripts/_temp 정리 누락 금지
- ❌ 진단 결과 받기 전 영구 픽스 추측으로 코드 수정 금지
- ❌ 운영 DB 다른 사용자 데이터에 영향 주는 쿼리 절대 금지

위반 가능성 발견 시 즉시 중단 + 사용자 보고.

---

## 작업 흐름 요약

1. CLI: 위 진단 스크립트 작성 → 실행 → 출력 캡처
2. CLI → 사용자: 어느 Test 가 실패했는지 + stack trace 보고
3. 사용자 → CLI (또는 Cowork): 결과 기반 영구 픽스 prompt 요청
4. CLI: 영구 픽스 적용 → 커밋 → 푸시 (subin → dev → main)
5. 사용자: mybdr.kr/profile/edit 재시도하여 정상 저장 확인
