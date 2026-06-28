# Phase 1 — 데이터 모델 + 운영자 토큰 발급 (강남구협회장배 유소년대회)

> 계획 원본: `Dev/youth-bulk-registration-2026-05-11.md`
> Phase 1 목표: 코치 신청서 토큰 발급 + 종별 룰 등록까지. 코치 입력 페이지(Phase 2) 직전까지.

---

## 0. 사전 확인 (작업 시작 전 — CLAUDE.md "오늘 작업 시작하자" 체크리스트)

1. `git remote -v` (github.com/bdr-tech/mybdr 확인)
2. `git fetch origin --prune` + main/dev/subin 차이
3. 현재 브랜치 = `subin` 확인
4. `.env` 존재 + DATABASE_URL 키 (값 노출 ❌)
5. `.env.local` localhost:3001 오버라이드
6. 결과 요약 → "이대로 작업 시작해도 될까요?" **승인 대기**

승인 후 진행. 승인 전 파일 수정·브랜치 전환·머지·커밋 금지.

---

## 1. 운영자 사전 확인 항목 (사용자에게 묻기)

다음 5개 정보 받기 (없으면 임시값으로 진행 후 메모):

1. **대회 D-Day**
2. **종별 룰** — 예시 형식:
   ```
   U10 / 초3·4부 / 2016~2017년생 / 학년 3~4 / 30,000원
   U12 / 초5·6부 / 2014~2015년생 / 학년 5~6 / 30,000원
   M1  / 중1부  / 2013년생       / 학년 7   / 35,000원
   ```
3. **종별 참가비** (위에 포함 가능)
4. **SMS 발송 채널** — 기존 시스템 유무 (없으면 Phase 3 에서 솔라피/알리고 선택)
5. **이미 등록된 팀 있는지** — Tournament 1건은 미리 만들어둬야 함

---

## 2. 브랜치 시작

```bash
git checkout dev && git pull origin dev
git checkout subin && git merge dev
```

병합 충돌 시 사용자에게 보고.

---

## 3. 작업 (TodoList 등록 후 순서대로)

### 3-1. Prisma schema 추가 — `prisma/schema.prisma`

**기존 모델 확장**:

`model TournamentTeam` — 다음 컬럼 추가:
```prisma
apply_token              String?   @unique @db.VarChar
apply_token_expires_at   DateTime? @db.Timestamp(6)
applied_via              String?   @db.VarChar  // 'coach_token' / 'self' / 'admin'
```

`model TournamentTeamPlayer` — 다음 컬럼 추가:
```prisma
parent_name        String?   @db.VarChar
parent_phone       String?   @db.VarChar
school_name        String?   @db.VarChar
grade              Int?
division_code      String?   @db.VarChar
jersey_size        String?   @db.VarChar
claim_status       String?   @default("pending") @db.VarChar
claimed_user_id    BigInt?
child_profile_id   BigInt?
invited_at         DateTime? @db.Timestamp(6)
claimed_at         DateTime? @db.Timestamp(6)
```
인덱스 추가:
```prisma
@@index([claim_status], map: "index_ttp_on_claim_status")
@@index([claimed_user_id], map: "index_ttp_on_claimed_user_id")
```

**신규 모델 3개**:

```prisma
model ChildProfile {
  id              BigInt    @id @default(autoincrement())
  parentUserId    BigInt    @map("parent_user_id")
  childName       String    @map("child_name") @db.VarChar
  childBirthdate  DateTime  @map("child_birthdate") @db.Date
  childGrade      Int?      @map("child_grade")
  schoolName      String?   @map("school_name") @db.VarChar
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  parent          User                   @relation(fields: [parentUserId], references: [id])
  rosters         TournamentTeamPlayer[]
  @@index([parentUserId])
  @@map("child_profiles")
}

model ClaimToken {
  id              BigInt    @id @default(autoincrement())
  playerId        BigInt    @unique @map("player_id")
  token           String    @unique @db.VarChar
  parentPhone     String    @map("parent_phone") @db.VarChar
  expiresAt       DateTime  @map("expires_at") @db.Timestamp(6)
  consumedAt      DateTime? @map("consumed_at") @db.Timestamp(6)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  @@index([token])
  @@map("claim_tokens")
}

model TournamentDivisionRule {
  id              BigInt    @id @default(autoincrement())
  tournamentId    String    @map("tournament_id") @db.Uuid
  code            String    @db.VarChar
  label           String    @db.VarChar
  birthYearMin    Int?      @map("birth_year_min")
  birthYearMax    Int?      @map("birth_year_max")
  gradeMin        Int?      @map("grade_min")
  gradeMax        Int?      @map("grade_max")
  feeKrw          Int       @default(0) @map("fee_krw")
  sortOrder       Int       @default(0) @map("sort_order")
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  tournament      Tournament @relation(fields: [tournamentId], references: [id])
  @@index([tournamentId])
  @@map("tournament_division_rules")
}
```

User / Tournament 모델의 역참조(`rosters ChildProfile[]` / `divisionRules TournamentDivisionRule[]` 등)도 잊지 말 것.

### 3-2. Schema diff 검토 (DB 단일 정책 — CLAUDE.md §🗄️)

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

또는 `prisma db push --preview-feature` 의 dry-run 옵션.
**diff 결과를 사용자에게 보여주고 승인 받은 후** `npx prisma db push` 실행. 전부 ADD COLUMN / CREATE TABLE 인지 확인 (DROP / ALTER NOT NULL 0건).

### 3-3. Prisma client 재생성

```bash
npx prisma generate
```

### 3-4. 종별 룰 seed 스크립트 — `scripts/_temp/seed-gangnam-divisions.ts`

사용자가 §1 에서 준 룰을 TournamentDivisionRule 에 insert. 스크립트는 작업 후 즉시 삭제 (CLAUDE.md §🗄️ 가드 3번).

```typescript
// 사용: dotenv -e .env -- npx tsx scripts/_temp/seed-gangnam-divisions.ts <tournament-uuid>
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tournamentId = process.argv[2];
  if (!tournamentId) throw new Error('tournament UUID 인자 필수');

  const rules = [
    { code: 'U10', label: '초3·4부', birthYearMin: 2016, birthYearMax: 2017, gradeMin: 3, gradeMax: 4, feeKrw: 30000, sortOrder: 1 },
    // ... 사용자 입력값으로 채움
  ];

  for (const r of rules) {
    await prisma.tournamentDivisionRule.create({ data: { tournamentId, ...r } });
  }
  console.log(`Seeded ${rules.length} rules for ${tournamentId}`);
}
main().finally(() => prisma.$disconnect());
```

작업 후 사후 검증:
```typescript
const count = await prisma.tournamentDivisionRule.count({ where: { tournamentId } });
console.log({ count });  // 예상값과 일치 확인
```

### 3-5. 어드민 API 2개 — `withAuth` + `withValidation`

`src/app/api/web/admin/tournaments/[id]/team-applications/route.ts`
- `GET` — 팀 목록 + 진행 표
- `POST` — 팀 1건 생성 + apply_token 생성 (랜덤 32바이트 hex), 만료 = 대회 D-Day + 7일

토큰 생성 유틸: `src/lib/utils/apply-token.ts`
```typescript
import { randomBytes } from 'crypto';
export const newApplyToken = () => randomBytes(32).toString('hex');
```

응답은 `apiSuccess()` — 자동 snake_case 변환. 프론트도 snake_case 로 받음 (CLAUDE.md §보안 5번 — sailent undefined 5회 재발 주의).

### 3-6. 어드민 UI — `src/app/(web)/admin/tournaments/[id]/teams/page.tsx`

- 팀 표 (팀명 / 코치명 / 코치번호 / 상태 / 인원 / 토큰 URL 복사 버튼)
- "팀 추가" 모달 (팀명·코치명·코치번호 입력)
- 토큰 URL 형식: `https://mybdr.kr/team-apply/{token}`
- AppNav: `Dev/design/BDR-current/` 토큰만 사용, frozen 코드 카피

### 3-7. 디자인 검수 (CLAUDE.md §🎨 13 룰)

자체 점검 — `Dev/design/claude-project-knowledge/06-self-checklist.md` 항목 모두 ✅:
- AppNav main bar 우측 5개 아이콘 순서 (다크/검색/쪽지/알림/햄버거)
- 검색·쪽지·알림 박스 ❌
- pill 9999px ❌ / 정사각형 50% ✅
- `var(--color-*)` 만 사용 / 핑크·살몬·코랄 ❌
- placeholder 5단어 이내

### 3-8. 빌드 검증

```bash
npm run build
npm run lint
```

오류 0건 확인.

### 3-9. Commit + Push

```bash
git add prisma/schema.prisma src/app/api/web/admin/tournaments/[id]/team-applications \
        src/app/(web)/admin/tournaments/[id]/teams src/lib/utils/apply-token.ts
git commit -m "feat(youth): Phase 1 — 팀 신청 토큰 모델 + 어드민 발급 페이지"
git push origin subin
```

GitHub 에서 `subin → dev` PR 생성.

---

## 4. 사후 검증

- [ ] DB 에 새 컬럼 / 테이블 생성 확인 (`prisma studio` 또는 SELECT 1건)
- [ ] 종별 룰 seed count 정확
- [ ] 어드민 페이지 진입 + 팀 1건 생성 + 토큰 URL 카피 동작
- [ ] 다른 사용자 (비-admin) 로 어드민 API 호출 → 403
- [ ] 임시 스크립트 `scripts/_temp/seed-gangnam-divisions.ts` **삭제**

---

## 5. 완료 후 PM 체크리스트 (CLAUDE.md)

- [ ] `.claude/scratchpad.md` 작업 로그 1줄 추가 (10건 이내)
- [ ] 새 패턴 있으면 `conventions.md`
- [ ] 새 모델 4개 → `architecture.md` 갱신
- [ ] 기술 결정 (토큰 길이 32바이트, NULL 허용 ADD 등) → `decisions.md`
- [ ] index.md 갱신
- [ ] 미푸시 커밋 알림
- [ ] Phase 2 의뢰 준비 (`Dev/cli-prompts/2026-05-11-youth-bulk-phase-2.md` 작성)

---

## 6. 금지 사항 (재확인)

- main 직접 push ❌
- destructive SQL 사용자 승인 없이 ❌
- `prisma migrate reset` / `db push --accept-data-loss` ❌
- 운영 DB 에 schema diff 사용자 검토 없이 push ❌
- `BDR v2.X/` 같은 옛 폴더 직접 참조 ❌ → `BDR-current/` 사용

