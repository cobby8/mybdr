# 프로필 저장 500 "Internal error" 진단 + 핫픽스 (Claude CLI 용)

> 운영 (mybdr.kr) 에서 `PATCH /api/web/profile` 가 500 Internal error 떨어지는 이슈.
> 코드 분석으로는 후보 좁힘 못함 → **로그 강화 패치 배포 → 사용자 1회 재시도 → stack trace 확보 → 정확 픽스** 순서로 진행.

---

## 0. 컨텍스트 (Cowork 진단 요약)

DevTools 콘솔 로그 (운영, mybdr.kr/profile/edit):
```
3x 409 → /api/web/profile          (nickname P2002 — 친화 메시지 정상)
1x 500 → /api/web/profile          (← 이게 화면의 "Internal error")
2x 503 → /api/web/profile/generate-bio  (AI bio — 별건, 무관)
```

**확인한 것:**
- 프론트 `handleSave` (`src/app/(web)/profile/edit/page.tsx:361`) 는 정상. `data.error` 키 읽어 표시.
- 백엔드 `apiError` (`src/lib/api/response.ts:10`) 는 `{ error, code?, ...extra }` 형식.
- 백엔드 `PATCH /api/web/profile` (`src/app/api/web/profile/route.ts:79`) 의 catch 블록:
  - P2002 + target=nickname → 409 친화 메시지 (정상)
  - P2002 + 다른 target → 409 "이미 등록된 정보입니다" (정상)
  - **그 외 모든 에러** → 500 "Internal error" ← **이쪽으로 떨어진 것**
- 이미 이전 회귀 (`name_verified`/`verified_at` 컬럼 운영 DB 미존재) 사건 있어 `service/user.ts:43-48` 에 코멘트 박제됨.

**후보 (좁히기 위한 가설):**
1. PrismaClientValidationError — `birth_date` Invalid Date / `height`·`weight` NaN
2. 운영 DB schema drift — 이미 발생한 패턴 재발
3. P2002 with `meta.target=null` — 분기 누락
4. JWT 재발급 외부 사이드이펙트 (가능성 낮음 — inner try/catch 있음)

→ stack trace 한 줄이면 1초 만에 확정.

---

## 1. 사전 점검

```bash
git branch --show-current     # subin 이어야 함
git fetch origin --prune
git status -sb
```

다른 미커밋 변경 있으면 먼저 정리. subin 아니면 checkout.

---

## 2. 작업 1 — 디버그 로깅 강화 패치

`src/app/api/web/profile/route.ts` 의 PATCH catch 블록을 강화.

### Edit 도구로 (기존 catch 블록 교체):

**Before** (line 173-190):
```ts
  } catch (e) {
    // errors.md 04-30: catch에서 raw 에러 삼키면 디버깅 불가 — console.error 명시
    console.error("[PATCH /api/web/profile]", e);
    // P2002 nickname 중복 (2026-04-30 진단 결과) — 사용자 친화 메시지 (errors.md)
    // 캡처 49: 사용자가 다른 사람이 사용 중인 닉네임으로 변경 시도 → P2002 → 'Internal error' 마스킹 → 진단 불가
    // → 진단 패치(3a12221)로 P2002 확정 → 명시적 409 Conflict 응답으로 친화 메시지
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      const target = (e as { meta?: { target?: string[] | string } })?.meta?.target;
      const targets = Array.isArray(target) ? target : target ? [target] : [];
      if (targets.includes("nickname")) {
        return apiError("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.", 409);
      }
      // 다른 unique 제약 위반은 일반 메시지
      return apiError("이미 등록된 정보입니다. 입력값을 확인해주세요.", 409);
    }
    return apiError("Internal error", 500);
  }
```

**After:**
```ts
  } catch (e) {
    // errors.md 04-30 + 2026-05-01: catch fallthrough 진단 강화.
    // 실제 에러 종류·메시지·meta 를 모두 로그 (운영 Vercel functions 로그에서 확인).
    const errObj = e as {
      name?: string;
      code?: string;
      message?: string;
      meta?: unknown;
      stack?: string;
    };
    console.error("[PATCH /api/web/profile] FAILURE", {
      name: errObj?.name,
      code: errObj?.code,
      message: errObj?.message,
      meta: errObj?.meta,
      stack: errObj?.stack?.split("\n").slice(0, 5).join(" | "),
    });

    // P2002 (unique 제약 위반) — 사용자 친화 메시지
    if (errObj?.code === "P2002") {
      const target = (errObj?.meta as { target?: string[] | string } | undefined)?.target;
      const targets = Array.isArray(target) ? target : target ? [target] : [];
      if (targets.includes("nickname")) {
        return apiError("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.", 409);
      }
      if (targets.includes("phone")) {
        return apiError("이미 등록된 전화번호입니다. 다른 번호를 입력해주세요.", 409);
      }
      if (targets.includes("email")) {
        return apiError("이미 등록된 이메일입니다.", 409);
      }
      return apiError(
        `이미 등록된 정보입니다 (${targets.join(", ") || "unknown"}). 입력값을 확인해주세요.`,
        409,
      );
    }

    // PrismaClientValidationError — Invalid Date / NaN / 타입 미스매치 등
    if (errObj?.name === "PrismaClientValidationError") {
      return apiError(
        "입력값 형식이 올바르지 않습니다. 생년월일, 키, 몸무게 형식을 확인해주세요.",
        400,
      );
    }

    // P2025 — 레코드 없음 (드뭄)
    if (errObj?.code === "P2025") {
      return apiError("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.", 404);
    }

    // 운영에서도 디버그 정보 노출 (임시 — 안정화 후 되돌릴 것).
    // 이유: 사용자 환경에서만 재현되는 케이스 추적 위함.
    // TODO 안정화 후 'Internal error' 단순 메시지로 복구.
    return apiError(
      `Internal error: ${errObj?.name ?? "Unknown"} - ${errObj?.message ?? "no message"}`,
      500,
    );
  }
```

**변경점 요약:**
- console.error 출력에 `name`, `code`, `meta`, `stack` 5줄 포함 → Vercel logs 로 stack trace 확인 가능
- P2002 의 `phone` / `email` 분기 추가 (그 외 target 도 명시)
- `PrismaClientValidationError` 명시 분기 — Invalid Date / NaN 케이스 친화 메시지
- `P2025` 분기 추가
- 마지막 fallthrough — **임시로 운영 응답에도 에러 이름·메시지 포함** (사용자 1회 재시도로 진단 확정용)
- TODO 코멘트 박제 — 안정화 후 단순 메시지로 복구

---

## 3. 작업 2 — 빌드 + 배포

```bash
# TypeScript 타입 체크 통과 확인
npx tsc --noEmit 2>&1 | head -20

# (선택) 로컬에서 dev 서버 살아 있으면 한 번 더 저장 시도해 응답 메시지 확인
# 또는 바로 운영 배포로 진행
```

---

## 4. 작업 3 — 커밋 + 푸시

```bash
git add src/app/api/web/profile/route.ts

git commit -m "fix(profile/PATCH): catch fallthrough 진단 강화 + P2002 분기 확장

운영 mybdr.kr/profile/edit 에서 'Internal error' 500 재발 (2026-05-01 캡처 콘솔):
- 3x 409 (nickname P2002) 후 1x 500 ('Internal error') 패턴 — fallthrough 분기에서 떨어짐.
- 코드 분석만으로는 PrismaClientValidationError / 운영 DB drift / P2002 target=null 후보 좁힘 못함.

변경:
- catch 로그에 name/code/meta/stack 포함 → Vercel functions logs 에서 stack trace 확인 가능
- P2002 분기에 phone/email 명시 추가 + 알 수 없는 target 도 메시지 포함
- PrismaClientValidationError 명시 분기 (생년월일/키/몸무게 입력값 형식 안내)
- P2025 (record not found) 분기 추가
- 임시: 운영 fallthrough 응답에도 에러 이름·메시지 포함 (사용자 1회 재시도로 stack 확정용)
  TODO 안정화 후 단순 'Internal error' 로 복구

배경: 내일 대회 D-1 — 사용자 본인 프로필 저장이 안 되는 상태"

git push origin subin
```

푸시 후 GitHub 에서 `subin → dev → main` 빠른 머지 + Vercel 운영 자동 배포.

---

## 5. 작업 4 — 사용자에게 재시도 요청 + 로그 확보

배포 완료 후 사용자에게:

1. mybdr.kr/profile/edit 다시 들어가서 저장 1회 시도
2. **DevTools Network 탭** → `PATCH /api/web/profile` 요청 → **Response** 탭 body 캡처 (이제 진짜 에러 이름·메시지 포함됨)
3. 또는 Vercel functions logs 에서 `[PATCH /api/web/profile] FAILURE` 검색 → stack trace 캡처

받은 응답 / stack trace 로 정확 원인 확정 → 영구 수정 패치 작성.

---

## 6. 기록 (CLAUDE.md 룰)

### 6-1. `.claude/scratchpad.md` 작업 로그 1줄 추가

```
- 2026-05-01: profile PATCH 500 'Internal error' fallthrough 진단 강화 패치 (P2002 분기 확장 + ValidationError + stack 로그). 사용자 재시도 후 진짜 원인 확정 예정.
```

### 6-2. `.claude/knowledge/errors.md` 신규 항목

```markdown
## profile PATCH 500 'Internal error' fallthrough — 진단 중 (2026-05-01)

**증상:** mybdr.kr/profile/edit 에서 저장 시 화면에 'Internal error' 노출. 콘솔 1x 500.

**상태:** 진단 강화 패치 배포 완료 (커밋 <hash>). 사용자 재시도 후 stack trace 캡처해 영구 수정 예정.

**힌트:** 같은 사용자가 nickname P2002 (409) 3회 → 다른 닉으로 변경 → 마지막에 500. 즉 닉 충돌 자체는 정상 처리되고, 다른 필드 (생년월일 / 신장체중 / 운영 DB drift?) 가 마지막 500 트리거 가능성.

**관련 회귀:** `src/lib/services/user.ts:43-48` 의 Phase 12-5 회귀 (name_verified/verified_at 운영 DB 미적용 패턴) — update 경로에서 비슷한 drift 가 또 남아있을 가능성.

**TODO:** 사용자 응답 본문 / Vercel logs 받으면 영구 수정 + 임시 디버그 메시지 복구.
```

### 6-3. `.claude/knowledge/index.md` 갱신 — errors.md 신규 항목 링크

### 6-4. 미푸시 커밋 알림 — `git log origin/subin..subin --oneline`

---

## 7. 완료 보고 형식

```
✅ 진단 강화 패치 — src/app/api/web/profile/route.ts catch 블록 (커밋 <hash>)
   - P2002 분기: phone/email 명시 + unknown target 메시지 포함
   - PrismaClientValidationError 분기 신설 (입력값 형식 안내)
   - P2025 분기 신설
   - 임시: fallthrough 에서 에러 이름·메시지 응답 노출 (TODO 복구)
   - console.error 에 name/code/meta/stack 5줄 포함
✅ 푸시 — origin/subin (dev → main 머지 필요, 운영 배포 후 사용자 재시도 요청)
🔍 다음 — 사용자 재시도 응답 / Vercel logs 받으면 영구 수정
```

---

## 8. 가드레일

- ❌ main 직접 push 금지
- ❌ 임시 디버그 응답 복구 잊지 말 것 (TODO 추적)
- ❌ catch 안에서 raw 에러 그대로 throw 금지 (response 형식 깨짐)
- ❌ DB 변경 / migrate 없음 (이번 작업은 코드 only)

위반 가능성 발견 시 즉시 중단 + 사용자 보고.
