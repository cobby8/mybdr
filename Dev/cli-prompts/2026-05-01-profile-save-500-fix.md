# 프로필 저장 500 — 영구 픽스 (Claude CLI 용)

> 진단 완료 (Test E 실패 — Invalid Date). 이제 이중 가드 적용 + 커밋 + 박제.

---

## 0. 컨텍스트

운영 mybdr.kr/profile/edit `PATCH /api/web/profile` 가 500 떨어지던 원인 확정:

- **원인:** `route.ts:119` 의 `new Date(birth_date as string)` 가 잘못된 형식 입력 시 Invalid Date 생성 → `prisma.user.update()` 가 `PrismaClientValidationError: Provided Date object is invalid. Expected Date.` throw → catch fallthrough → 500 "Internal error".
- **진단 근거:** 로컬에서 운영 DB 직접 호출한 진단 스크립트 (`Dev/cli-prompts/2026-05-01-profile-save-500-direct-diagnose.md`) Test E 가 동일 에러 재현.
- **사용자 DB 상태:** id=2836, nickname="수빈", birth_date=null (현재). 즉 사용자가 폼에서 잘못된 birth_date 값을 입력했고 그게 그대로 백엔드로 전송됨.

진단 결과 발견된 **별건 이슈** 2개도 본 작업과 함께 errors.md 에 박제:
- API route 의 `new Date(externalString)` 패턴이 다른 곳에도 가드 없이 박혀있을 가능성 (회귀 방지 룰)
- 운영 DB 의 `position` 컬럼이 comma-separated multi (예: "PG,SG,SF") 인데 시안 폼은 단일 선택 — 저장 시 multi 데이터 손실 위험 (별건 추적)

---

## 1. 사전 점검

```bash
git branch --show-current      # subin 이어야 함
git fetch origin --prune
git status -sb                 # 다른 미커밋 변경 확인
```

다른 미커밋 변경 있으면 정리 후 진행. subin 아니면 checkout.

---

## 2. 작업 1 — 백엔드 가드 (route.ts)

`src/app/api/web/profile/route.ts` 의 PATCH 핸들러 수정. `updateProfile()` 호출 직전에 birth_date 파싱 분리 + isNaN 가드.

### Edit 도구로:

**Before** (line 110-123 부근):

```ts
    const updated = await updateProfile(ctx.userId, {
      ...(nickname !== undefined && { nickname: nickname as string || null }),
      ...(position !== undefined && { position: position as string || null }),
      ...(height !== undefined && { height: height ? Number(height) : null }),
      ...(city !== undefined && { city: city as string || null }),
      ...(bio !== undefined && { bio: bio as string || null }),
      ...(name !== undefined && { name: name as string || null }),
      ...(phone !== undefined && { phone: phone as string || null }),
      ...(birth_date !== undefined && { birth_date: birth_date ? new Date(birth_date as string) : null }),
      ...(district !== undefined && { district: district as string || null }),
      ...(weight !== undefined && { weight: weight ? Number(weight) : null }),
      ...bankUpdate,
    });
```

**After:**

```ts
    // 2026-05-01: birth_date Invalid Date 가드 (errors.md 박제 — PATCH 500 'Internal error' 원인)
    // new Date("invalid string") → Invalid Date → prisma 에 넘기면 PrismaClientValidationError
    // → catch fallthrough → 500. 명시적 400 응답으로 분기.
    let parsedBirthDate: Date | null = null;
    if (birth_date) {
      const d = new Date(birth_date as string);
      if (!isNaN(d.getTime())) {
        parsedBirthDate = d;
      } else {
        return apiError("생년월일 형식이 올바르지 않습니다. (예: 1995-03-15)", 400);
      }
    }

    const updated = await updateProfile(ctx.userId, {
      ...(nickname !== undefined && { nickname: nickname as string || null }),
      ...(position !== undefined && { position: position as string || null }),
      ...(height !== undefined && { height: height ? Number(height) : null }),
      ...(city !== undefined && { city: city as string || null }),
      ...(bio !== undefined && { bio: bio as string || null }),
      ...(name !== undefined && { name: name as string || null }),
      ...(phone !== undefined && { phone: phone as string || null }),
      ...(birth_date !== undefined && { birth_date: parsedBirthDate }),
      ...(district !== undefined && { district: district as string || null }),
      ...(weight !== undefined && { weight: weight ? Number(weight) : null }),
      ...bankUpdate,
    });
```

---

## 3. 작업 2 — 프론트 방어선 (page.tsx)

`src/app/(web)/profile/edit/page.tsx` 의 `handleSave` payload 구성 부분 수정. UX 보정 — 잘못된 입력은 null 로 변환해서 보내 저장 자체는 성공시킴.

### Edit 도구로:

**Before** (line 370 부근):

```ts
        birth_date: form.birth_date || null,
```

**After:**

```ts
        // 2026-05-01: 잘못된 birth_date 형식이면 null 로 보내 백엔드 400 회피 (errors.md 박제).
        // 백엔드(route.ts) 도 isNaN 가드 있음 — 이중 방어선.
        birth_date:
          form.birth_date && !isNaN(new Date(form.birth_date).getTime())
            ? form.birth_date
            : null,
```

---

## 4. 작업 3 — 빌드 검증

```bash
# TypeScript 타입 체크
npx tsc --noEmit 2>&1 | head -30
```

에러 0건 확인. 에러 있으면 중단하고 사용자 보고.

(선택) 로컬 dev 서버 가능하면 `/profile/edit` 에서 birth_date 빈/잘못된/올바른 3 케이스 모두 저장 시도해 확인.

---

## 5. 작업 4 — 임시 진단 스크립트 정리

```bash
rm -rf scripts/_temp
```

진단 출력 로그 (`scripts/_temp/diagnose-output.log`) 가 errors.md 박제 가치 있으면 그 내용을 errors.md 에 인용 후 삭제.

---

## 6. 작업 5 — errors.md 박제

`.claude/knowledge/errors.md` 에 다음 항목 추가 (또는 기존 진단 중 항목 갱신).

```markdown
## profile PATCH 500 'Internal error' — Invalid Date 미가드 (2026-05-01 해결)

**증상:** mybdr.kr/profile/edit 에서 저장 시 화면 'Internal error'. 콘솔 1x 500. 응답 body `{"error":"Internal error"}`.

**원인:** `src/app/api/web/profile/route.ts:119` 의 `new Date(birth_date as string)` 이 잘못된 형식 (예: 빈 문자열도 아닌 부분 입력 "2024-13-45" / 사용자 임의 텍스트) 받으면 `Invalid Date` 객체 생성 → `prisma.user.update()` 가 `PrismaClientValidationError: Provided Date object is invalid. Expected Date.` throw → catch fallthrough → 500.

**진단 방법:** 로컬에서 .env 운영 DB 로 connect 후 prisma.user.update 를 단계별 (필드별) 직접 호출하는 진단 스크립트 (`scripts/_temp/diagnose-profile-save.ts`) 로 재현. Test E (`new Date("")` 에 해당하는 Invalid Date) 만 실패 → 원인 확정. **Vercel 로그 접근 불가 환경에서 효과적인 진단 패턴.**

**픽스 (이중 방어선):**
1. 백엔드 (`route.ts:119`): birth_date 파싱을 update 호출 전 분리 + `isNaN(d.getTime())` 가드 → 잘못되면 400 명시 응답.
2. 프론트 (`page.tsx:370`): payload 구성 시 동일 isNaN 체크 → 잘못된 입력은 null 로 송출 (UX 보정).

**회귀 방지 룰 (신설):**
- API route 에서 `new Date(externalString)` 패턴 사용 시 **항상 `isNaN(d.getTime())` 가드 필수**. 가드 없으면 prisma 호출 시 PrismaClientValidationError 로 500 fallthrough.
- 점검 대상 후보 (이번 픽스 범위 밖, 추후 일괄 점검): tournament `startDate`/`endDate`/`registration_start_at`/`registration_end_at`, game `scheduled_at`, 기타 string→Date 변환 지점.

**관련 부수 발견 (별건):**
- 사용자 (id=2836, nickname=수빈) DB 의 `position` 컬럼 값이 "PG,SG,SF" — comma-separated multi. 시안 폼은 단일 선택만 보내므로 사용자가 저장 시 multi 데이터 손실 위험. 별건으로 추적 필요 (이번 픽스 범위 밖).
```

`.claude/knowledge/index.md` 에 위 항목 링크 추가.

---

## 7. 작업 6 — 별건 이슈 lessons.md 박제 (선택)

`.claude/knowledge/lessons.md` 에 진단 패턴 박제 (30분+ 삽질이 다시 발생하지 않도록):

```markdown
## Vercel 로그 접근 불가 환경에서 prisma 500 진단 (2026-05-01)

운영 API 가 500 떨어지는데 응답 body 가 `{"error":"Internal error"}` 만 오고 Vercel 로그 접근이 막힌 상황에서 가장 빠른 진단:

**로컬 tsx 스크립트로 운영 DB 에 직접 connect → 같은 prisma 호출을 단계별 (필드별) 재현.** `.env` 의 DATABASE_URL 이 운영 가리키면 즉시 연결 가능. 배포·머지·로그 사이클 다 우회.

스크립트 템플릿 — `Dev/cli-prompts/2026-05-01-profile-save-500-direct-diagnose.md` §2.

장점: 1분 내 stack trace 추출. 단점: 다른 사용자 데이터 영향 위험 — 본인 user 한 명 update 만 시도하는 가드 필수.
```

---

## 8. 작업 7 — 커밋 + 푸시

```bash
git add src/app/api/web/profile/route.ts \
        "src/app/(web)/profile/edit/page.tsx" \
        .claude/knowledge/errors.md \
        .claude/knowledge/index.md \
        .claude/knowledge/lessons.md \
        .claude/scratchpad.md

git commit -m "fix(profile/PATCH): birth_date Invalid Date 가드 — 500 'Internal error' 영구 해결

증상: mybdr.kr/profile/edit 저장 시 'Internal error' 500.
원인: new Date(birth_date) Invalid Date → PrismaClientValidationError → catch fallthrough.
진단: 로컬 tsx 스크립트로 운영 DB 직접 호출 (Vercel 로그 접근 불가 우회). Test E 재현 → 확정.

픽스 (이중 방어선):
- route.ts: birth_date 파싱 분리 + isNaN 가드 → 명시적 400 응답
- profile/edit/page.tsx: payload 구성 시 동일 가드 (UX 보정 — 잘못된 입력 null 송출)

박제:
- .claude/knowledge/errors.md — 본 사례 + 회귀 방지 룰 (new Date 패턴 가드 필수)
- .claude/knowledge/lessons.md — Vercel 로그 접근 불가 환경 진단 패턴
- .claude/knowledge/index.md — 링크 갱신

별건 추적 (errors.md 메모):
- position 컬럼 multi (예: 'PG,SG,SF') vs 시안 단일 선택 — 데이터 손실 위험. 별건 처리.

배경: 내일 대회 D-1, 사용자 본인 프로필 저장 차단 해소."

git push origin subin
```

푸시 후 GitHub 에서 `subin → dev` PR 생성 (수동). 내일 대회 임박 → `dev → main` 빠른 머지 + Vercel 자동 배포.

---

## 9. 작업 8 — scratchpad.md 갱신

`.claude/scratchpad.md` 작업 로그 1줄 추가 (10건 이내 유지, 100줄 이내):

```
- 2026-05-01: profile PATCH 500 'Internal error' 영구 해결 — birth_date Invalid Date 이중 가드 (route.ts + page.tsx). 로컬 tsx 진단 스크립트로 Vercel 로그 우회. 부수 발견: position 컬럼 multi 손실 위험 (별건).
```

---

## 10. 완료 보고 형식

```
✅ 백엔드 가드 — route.ts birth_date isNaN 분기 (400 명시 응답)
✅ 프론트 가드 — page.tsx payload 구성 isNaN 체크 (UX 보정)
✅ 빌드 — npx tsc --noEmit 통과
✅ 정리 — scripts/_temp 삭제
✅ 박제 — errors.md / lessons.md / index.md / scratchpad.md 갱신
✅ 커밋 — <hash> push origin/subin
🔍 다음 — subin → dev PR + dev → main 머지 + Vercel 배포 → 사용자 재시도 확인
🔖 별건 — position 멀티 (예: 'PG,SG,SF') 손실 위험 추적 필요 (errors.md 메모)
```

---

## 11. 가드레일

- ❌ main 직접 push 금지
- ❌ scripts/_temp 정리 누락 금지
- ❌ DB 변경 / migrate 없음 (이번 작업은 코드 only — 사용자 DB 의 birth_date=null 은 그대로 유지)
- ❌ 별건 (position multi) 을 본 픽스 범위에 포함 금지 (별건 추적만)
- ❌ 빌드 에러 무시하고 커밋 금지

위반 가능성 발견 시 즉시 중단 + 사용자 보고.

---

## 작업 흐름 요약

1. CLI: 사전 점검 (브랜치/git status)
2. CLI: route.ts 가드 추가 (Edit 도구)
3. CLI: page.tsx 가드 추가 (Edit 도구)
4. CLI: `npx tsc --noEmit` 빌드 검증
5. CLI: scripts/_temp 정리
6. CLI: errors.md / lessons.md / index.md / scratchpad.md 박제
7. CLI: commit + push to subin
8. CLI: 완료 보고
9. 사용자: GitHub PR (subin→dev) → 머지 의뢰 (원영) → Vercel 배포 → 재시도 확인
