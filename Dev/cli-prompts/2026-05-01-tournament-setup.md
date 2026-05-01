# 내일 대회 세팅 — 단체·대회 노출 일괄 해결 (Claude CLI 용 프롬프트)

> 이 파일을 통째로 Claude CLI 에 붙여넣어서 실행. CLAUDE.md 룰 준수 (subin 브랜치, 커밋 정책 등).

---

## 0. 컨텍스트 (Cowork 세션에서 진단 완료)

내일 대회를 위해 어제 **동호회최강전** 대회 + **BDR 단체** 를 만들었는데 둘 다 프론트에 안 나오는 상황. 코드 분석 결과 **두 개의 서로 다른 원인**이 확인됨:

### 원인 ① — 단체 노출: 코드 버그 (확정)

- `src/app/(web)/organizations/page.tsx:34` 의 필터: `status: "active"`
- 그런데 단체 생성 API (`src/app/api/web/organizations/route.ts:45,75`) 는 `"approved"` (어드민) 또는 `"pending"` (일반) 으로 저장
- 다른 모든 코드 (`admin/approve`, `admin/reject`, `series/route.ts`, `prisma/schema.prisma:2222`) 는 모두 `"approved"` 사용
- → `"active"` 가 잘못 박힌 1줄 버그. `"approved"` 로 수정 필요.

### 원인 ② — 대회 노출: 의도된 동작 (status flow)

- 대회는 생성 시 무조건 `status: "draft"` (`src/lib/services/tournament.ts:405`)
- 목록 API (`src/app/api/web/tournaments/route.ts:229`) 는 `status: { not: "draft" }` 로 draft 제외
- 허용 status (`src/lib/validation/tournament.ts:21`): `"draft" | "registration_open" | "in_progress" | "completed" | "cancelled"`
- → `"registration_open"` 으로 변경하면 노출됨. 사용자가 "운영 DB 변경해도 됨" 명시 허가함.

---

## 1. 사전 점검 (작업 시작 전 필수)

```bash
# 브랜치 확인 — subin 이어야 함
git branch --show-current

# 최신 동기화
git fetch origin --prune
git status -sb

# .env 의 DATABASE_URL 이 어느 환경 가리키는지 한 번 더 확인 (값 노출 금지)
grep -c "DATABASE_URL" .env
```

✋ **중단 조건:**
- 현재 브랜치가 subin 이 아니면 → `git checkout subin` 한 후 진행
- 미커밋 변경이 다른 작업 거면 → 먼저 commit/stash
- DATABASE_URL 이 비어있거나 형식 이상하면 → 사용자에게 보고 후 중단

---

## 2. 작업 1 — 단체 노출 코드 수정

`src/app/(web)/organizations/page.tsx:34` 의 `status: "active"` → `status: "approved"` 로 수정.

### Edit 도구로:

```ts
// before
where: { is_public: true, status: "active" },

// after
where: { is_public: true, status: "approved" },
```

### 회귀 점검 (이미 Cowork 에서 1차 확인했지만 한번 더):

```bash
# prisma.organizations + status: "active" 패턴 다른 곳에 없는지
rg 'prisma\.organizations[\s\S]{0,300}status.*"active"' src --multiline -n
```

추가 매칭 있으면 사용자 확인 후 같이 수정. 없으면 통과.

---

## 3. 작업 2 — 동호회최강전 status 변경 (DB UPDATE)

운영 DB 직접 변경. **반드시 SELECT 로 매칭 확인 → 1건이면 UPDATE**. 다중이면 중단.

### 3-1. SELECT 로 매칭 확인

옵션 A — `npx prisma db execute` 는 SELECT 결과를 안 보여주니, **tsx 임시 스크립트** 사용:

```bash
mkdir -p scripts/_temp
cat > scripts/_temp/check-tournament.ts <<'EOF'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  // 모델명은 schema.prisma 의 model Tournament (PascalCase) → client 는 prisma.tournament (camelCase) 일 가능성. 안 되면 prisma.tournaments 시도.
  const matches = await prisma.tournament.findMany({
    where: { name: { contains: "동호회최강전" } },
    select: { id: true, name: true, status: true, is_public: true, organizerId: true, startDate: true },
  });
  console.log(JSON.stringify(matches, null, 2));
  console.log(`\n매칭: ${matches.length}건`);
})().finally(() => prisma.$disconnect());
EOF

npx tsx scripts/_temp/check-tournament.ts
```

⚠️ Prisma client 의 모델 키 이름이 `tournament` 인지 `tournaments` 인지 모를 수 있음 — `prisma/schema.prisma` 에서 `model Tournament` 또는 `model tournaments` 라인 직접 grep 해서 확인 후 스크립트 보정.

### 3-2. 결과 검토

- **1건 + status='draft'** → 3-3 진행
- **0건** → 사용자에게 "동호회최강전" 정확한 이름 / 다른 키워드 확인 요청 후 중단
- **2건 이상** → 어느 거 업데이트할지 사용자 확인 후 중단

### 3-3. UPDATE 실행

```bash
cat > scripts/_temp/publish-tournament.ts <<'EOF'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const matches = await prisma.tournament.findMany({
    where: { name: { contains: "동호회최강전" } },
    select: { id: true, name: true, status: true },
  });
  if (matches.length !== 1) {
    throw new Error(`예상 1건, 실제 ${matches.length}건. 중단.`);
  }
  const target = matches[0];
  if (target.status !== "draft") {
    console.log(`이미 status='${target.status}'. 추가 변경 없이 종료.`);
    return;
  }
  const updated = await prisma.tournament.update({
    where: { id: target.id },
    data: { status: "registration_open", is_public: true },
    select: { id: true, name: true, status: true, is_public: true },
  });
  console.log("업데이트 완료:", JSON.stringify(updated, null, 2));
})().finally(() => prisma.$disconnect());
EOF

npx tsx scripts/_temp/publish-tournament.ts
```

### 3-4. 임시 스크립트 정리

```bash
rm -rf scripts/_temp
```

---

## 4. 작업 3 — 검증

### 4-1. 코드 변경 검증

```bash
# organizations/page.tsx 의 status 필터가 "approved" 인지 확인
grep -n 'status: "approved"' "src/app/(web)/organizations/page.tsx"
```

### 4-2. DB 상태 검증

3-3 의 update 결과 로그에 `status: "registration_open"`, `is_public: true` 확인.

### 4-3. (선택) 로컬 dev 서버 실행 시 페이지 확인

dev 서버가 켜져 있다면 (port 3001):
- `http://localhost:3001/organizations` — BDR 카드 노출
- `http://localhost:3001/tournaments` — 동호회최강전 노출

ISR 60초 캐시 있음 → 안 뜨면 60초 대기 또는 서버 재시작.

---

## 5. 작업 4 — 커밋 + 푸시

```bash
git add "src/app/(web)/organizations/page.tsx"

git commit -m "fix(organizations): 목록 status 필터 active → approved

- 단체 생성 API 는 'approved'/'pending' 저장하는데 목록 페이지가 'active' 로 잘못 필터링하던 버그
- prisma.organizations + status 사용처 전부 점검: 다른 곳은 모두 'approved' 일관 (admin/approve, reject, series 등)
- 영향: BDR 단체 등 기존 단체들 모두 노출 안 되던 상태 → 정상 노출

배경: 내일 동호회최강전 대회 세팅 중 발견 (2026-05-01)"

git push origin subin
```

푸시 후 GitHub 에서 `subin → dev` PR 생성 (수동). 내일 대회 임박이라면 원영님께 빠른 머지 요청.

---

## 6. 기록 (CLAUDE.md 룰)

### 6-1. `.claude/scratchpad.md` — 작업 로그 1줄 추가

```
- 2026-05-01: organizations 목록 status 필터 active→approved 버그 fix + 동호회최강전 발행 (status: draft → registration_open via DB)
```

100줄 이내 유지 (오래된 거 정리).

### 6-2. `.claude/knowledge/errors.md` — 에러 사례 등록

```markdown
## organizations 목록 status 필터 'active' (실재하지 않는 status) — 2026-05-01

**증상:** /organizations 페이지가 항상 빈 목록. 단체 생성해도 노출 안 됨.

**원인:** `src/app/(web)/organizations/page.tsx:34` 의 필터가 `status: "active"`. 
하지만 schema/생성 API/admin approve route 등 모든 곳은 `"approved" | "pending" | "rejected"` 사용. `"active"` 는 절대 발생하지 않는 값.

**수정:** `status: "active"` → `status: "approved"`.

**교훈:**
- 새로운 status 필터를 추가할 때는 schema.prisma 의 default + 생성 API + admin route 까지 cross-check.
- 단체 생성 후 목록 페이지에서 노출 확인하는 e2e/스모크 테스트가 없어서 버그가 production 에 그대로 갔을 가능성.

**관련:** `src/app/api/web/organizations/route.ts:45,75` (생성 API), `prisma/schema.prisma:2222` (스키마).
```

### 6-3. `.claude/knowledge/lessons.md` — 30분+ 삽질 시에만

이 케이스는 코드 1줄 버그라 lessons 등록은 생략 가능. 단, "API/페이지 status 값 불일치 패턴" 으로 일반화하면 lessons 가치 있음 — 등록 여부는 PM 판단.

### 6-4. `.claude/knowledge/index.md` — errors.md 신규 항목 링크 추가

### 6-5. 미푸시 커밋 알림

`git log origin/subin..subin --oneline` 로 미푸시 커밋 확인 → 위 작업 5 의 푸시로 해결됐는지 재확인.

---

## 7. 완료 보고 형식

작업 끝나면 다음 형식으로 보고:

```
✅ 단체 노출 — organizations/page.tsx status 필터 active→approved (커밋 <hash>)
✅ 대회 노출 — 동호회최강전 status: draft → registration_open (DB UPDATE 완료, id=<id>)
✅ 검증 — [grep / DB select 결과 한 줄씩]
✅ 푸시 — origin/subin 에 반영. dev PR 생성 필요 (수동).
🔍 후속 — .env 운영 도메인 박힌 점, 단일 Supabase project 운영/개발 겸용 운영 점검 권장 (별건).
```

---

## 8. 가드레일 (위반 시 즉시 중단)

- ❌ main 직접 push 금지
- ❌ prisma db push / migrate 실행 금지 (단순 데이터 UPDATE 만 OK)
- ❌ `.env` 의 DATABASE_URL 값 출력 / 로그 노출 금지
- ❌ DB UPDATE 시 SELECT 매칭 1건 확인 안 하고 진행 금지
- ❌ scripts/_temp 정리 누락 금지

위반 가능성 발견 시 → 즉시 중단 + 사용자 보고.
