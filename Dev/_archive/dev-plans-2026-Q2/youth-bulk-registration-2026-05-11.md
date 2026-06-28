# 강남구협회장배 유소년대회 — 팀 단위 일괄 등록 + 부모 클레임 시스템

작성: 2026-05-11 / 작성자: PM (수빈 협업) / 대상: Claude CLI Phase 분할 의뢰용

---

## 0. 결정 요약 (사용자 답변 반영)

| 항목 | 결정 |
|---|---|
| 1차 입력 주체 | **팀 코치** — 운영자가 팀별 참가신청서 링크 공유 → 코치가 선수 명단 작성 |
| 부모 연결 | **SMS/카톡 매직링크 클레임** — 부모가 가입 후 신청서 정보와 자동 대조 |
| 종별 분류 | **자녀 생년월일·학년 기준 자동 매핑** |
| 범위 | **이번 대회용 최소 + 재사용 가능 설계** |

추가 결정 (사용자 답변에서 추출):
- 합계 자동 계산 (팀당 선수 수 × 종별 참가비) — 코치 제출 시점에 계산되어 정산 UI에 노출

---

## 1. 전체 플로우 (한 장 그림)

```
[운영자]                [코치]                  [부모]                [선수(자녀)]
   │                       │                       │                       │
   ├─ 팀 등록·             │                       │                       │
   │  참가신청 토큰 발급 →─┤                       │                       │
   │                       │                       │                       │
   │                       ├─ 토큰 링크 진입 (비로그인)                    │
   │                       ├─ 선수 명단 입력                               │
   │                       │  (이름·생년월일·학교·학년·부모연락처·사이즈) │
   │                       │  → 종별 자동 추론 표시                        │
   │                       │                                               │
   │                       └─ 제출 → TournamentTeamPlayer N건 생성        │
   │                                  (claim_status: PENDING)              │
   │                                  총 참가비 자동 계산                  │
   │                                            │                          │
   │                                            ├─ 부모번호로 SMS ─→       │
   │                                            │                       │  │
   │                                            │                       ▼  │
   │                                            │            ┌────────────────┐
   │                                            │            │ 매직링크 클릭  │
   │                                            │            │ → 가입/로그인  │
   │                                            │            │ → 이름+생년월일│
   │                                            │            │   매칭 검증   │
   │                                            │            │ → 자녀 자동연결│
   │                                            │            └────────────────┘
   ├─ 대시보드 ─→ 팀별 진행률 / 종별 인원 / 참가비 정산                    │
```

---

## 2. 데이터 모델 (기존 스키마 재사용 우선)

### 2-1. 기존 모델 확장

**`TournamentTeam`** — 코치 토큰 추가
```prisma
// 추가 컬럼 (NULL 허용 — 무중단 ADD COLUMN)
apply_token              String?   @unique @db.VarChar
apply_token_expires_at   DateTime? @db.Timestamp(6)
applied_via              String?   @db.VarChar  // 'coach_token' / 'self' / 'admin'
```

**`TournamentTeamPlayer`** — 부모·학교·학년·클레임 상태 추가
```prisma
// 추가 컬럼 (모두 NULL 허용)
parent_name        String?   @db.VarChar
parent_phone       String?   @db.VarChar
school_name        String?   @db.VarChar
grade              Int?
division_code      String?   @db.VarChar  // 'U10', 'U12', 'M1' 등
jersey_size        String?   @db.VarChar
claim_status       String?   @default("pending") @db.VarChar  // pending/invited/claimed
claimed_user_id    BigInt?
child_profile_id   BigInt?
invited_at         DateTime? @db.Timestamp(6)
claimed_at         DateTime? @db.Timestamp(6)

// 인덱스
@@index([claim_status])
@@index([claimed_user_id])
```

> 💡 기존 `userId`, `auto_registered`, `player_name`, `phone`, `birth_date` 필드가 이미 있어서 코치 입력 자체는 그대로 사용 가능.

### 2-2. 신규 모델 (3개)

```prisma
// 부모 계정에 종속된 자녀 프로필 — 재사용 가능
model ChildProfile {
  id              BigInt    @id @default(autoincrement())
  parentUserId    BigInt    @map("parent_user_id")
  childName       String    @map("child_name") @db.VarChar
  childBirthdate  DateTime  @map("child_birthdate") @db.Date
  childGrade      Int?      @map("child_grade")
  schoolName      String?   @map("school_name") @db.VarChar
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  parent          User      @relation(fields: [parentUserId], references: [id])
  rosters         TournamentTeamPlayer[]
  @@index([parentUserId])
  @@map("child_profiles")
}

// 매직링크 클레임 토큰
model ClaimToken {
  id              BigInt    @id @default(autoincrement())
  playerId        BigInt    @unique @map("player_id")  // TournamentTeamPlayer.id
  token           String    @unique @db.VarChar
  parentPhone     String    @map("parent_phone") @db.VarChar
  expiresAt       DateTime  @map("expires_at") @db.Timestamp(6)
  consumedAt      DateTime? @map("consumed_at") @db.Timestamp(6)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  @@index([token])
  @@map("claim_tokens")
}

// 종별 매핑 룰 (대회별로 다를 수 있어 별도)
model TournamentDivisionRule {
  id              BigInt    @id @default(autoincrement())
  tournamentId    String    @map("tournament_id") @db.Uuid
  code            String    @db.VarChar           // 'U10'
  label           String    @db.VarChar           // '초3·4부'
  birthYearMin    Int?      @map("birth_year_min")
  birthYearMax    Int?      @map("birth_year_max")
  gradeMin        Int?      @map("grade_min")
  gradeMax        Int?      @map("grade_max")
  feeKrw          Int       @default(0) @map("fee_krw")  // 종별 참가비
  sortOrder       Int       @default(0) @map("sort_order")
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  tournament      Tournament @relation(fields: [tournamentId], references: [id])
  @@index([tournamentId])
  @@map("tournament_division_rules")
}
```

### 2-3. DB 운영 정책 준수
- 모든 컬럼 NULL 허용 → ADD COLUMN 무중단
- `prisma db push` 전 schema diff 사용자 검토 (CLAUDE.md §🗄️ DB 정책)
- destructive 작업 없음 (전부 ADD)

---

## 3. 종별 자동 매핑 로직

위치: `src/lib/tournaments/youth-division-mapper.ts`

```typescript
type MapInput = { birthdate: Date; grade?: number };
type Rule = { code: string; birthYearMin?: number; birthYearMax?: number; gradeMin?: number; gradeMax?: number };

export function mapPlayerToDivision(input: MapInput, rules: Rule[]): { code: string; rule: Rule } | { error: string } {
  const year = input.birthdate.getFullYear();
  // 1) 생년월일 우선
  const byBirth = rules.find(r =>
    (r.birthYearMin == null || year >= r.birthYearMin) &&
    (r.birthYearMax == null || year <= r.birthYearMax)
  );
  // 2) 학년 검증 (있는 경우)
  if (byBirth && input.grade != null) {
    const gradeOk =
      (byBirth.gradeMin == null || input.grade >= byBirth.gradeMin) &&
      (byBirth.gradeMax == null || input.grade <= byBirth.gradeMax);
    if (!gradeOk) return { error: `생년월일(${year}) 과 학년(${input.grade}) 불일치 — 운영자 확인 필요` };
  }
  return byBirth ? { code: byBirth.code, rule: byBirth } : { error: '해당 종별 없음' };
}
```

경계 케이스:
- 학년 입력 없음 → 생년월일만으로 매핑 (OK)
- 12월생 → birthYearMax 룰에 의해 다음 종별로 넘어갈 수 있음. 사용자 ↔ 협회 컷오프 합의 후 seed 확정
- 학년-생년월일 불일치 (예: 빠른년생 / 늦은년생) → 에러 반환, 운영자 화면에서 수동 지정 허용

---

## 4. API 엔드포인트

### 4-1. 운영자 (web, `withAuth` + admin role)
```
POST   /api/web/admin/tournaments/[id]/team-applications
       → 팀 1건 생성 + apply_token 발급 (응답: 토큰 URL)
GET    /api/web/admin/tournaments/[id]/team-applications
       → 팀별 진행 표 (status, player count, fee total, claim ratio)
POST   /api/web/admin/tournaments/[id]/team-applications/[teamId]/send-claim
       → 해당 팀 PENDING 선수 부모번호로 일괄 SMS 발송
POST   /api/web/admin/tournaments/[id]/team-applications/[teamId]/confirm
       → 신청서 확정 (CONFIRMED) 또는 반려 (REJECTED)
GET    /api/web/admin/tournaments/[id]/divisions
       → 종별 인원 + 정산 합계
POST   /api/web/admin/tournaments/[id]/divisions
       → DivisionRule 일괄 등록 (대회 초기 setup)
```

### 4-2. 코치 (web, 공개 토큰 인증 — 로그인 불필요)
```
GET    /api/web/team-apply/[token]
       → 신청서 본문 + 기존 선수 명단 (있으면)
PATCH  /api/web/team-apply/[token]
       → 선수 명단 저장 (draft, 여러 번 가능)
POST   /api/web/team-apply/[token]/submit
       → 최종 제출 (status DRAFT → SUBMITTED, 총 참가비 확정)
```

토큰 검증 미들웨어: `src/lib/auth/coach-token.ts`
- `apply_token` + `apply_token_expires_at` 검증
- IP 레이트리밋 (10 req/min)
- 다른 팀 토큰으로 접근 차단 (IDOR)

### 4-3. 부모 (web, 매직링크 토큰)
```
GET    /api/web/claim/[token]
       → 토큰 검증 + 자녀 미리보기 (이름·생년월일·소속팀·종별)
POST   /api/web/claim/[token]
       → 가입/로그인 후 자녀 연결
         (이름 + 생년월일 매칭 검증 → ChildProfile 생성 → player.claimed_user_id 세팅)
```

토큰 보안:
- 72시간 만료
- 일회용 (consumed_at 세팅 후 무효)
- 토큰 자체에 player_id 추론 불가 (랜덤 32바이트 hex)

### 4-4. 마이페이지 자녀 관리 (web, 로그인 부모)
```
GET    /api/web/me/children          → 내 자녀 목록 + 클레임된 대회
POST   /api/web/me/children          → 자녀 직접 추가 (대회와 무관)
PATCH  /api/web/me/children/[id]
DELETE /api/web/me/children/[id]
```

---

## 5. 화면 (BDR 디자인 룰 준수)

### 5-1. 운영자 어드민
- `/admin/tournaments/[id]/teams` — 팀 표 (팀명 / 코치 / 진행상태 / 인원 / 정산 / 토큰 URL 복사)
- `/admin/tournaments/[id]/teams/[teamId]` — 팀 1개 상세 + 선수 목록 + "부모에게 SMS 발송" 버튼
- `/admin/tournaments/[id]/divisions` — 종별 룰 편집 + 인원/정산 요약

### 5-2. 코치 신청서 (`/team-apply/[token]`, 비로그인)
- 모바일 우선 (코치가 폰으로 입력 가능성 큼)
- 인라인 행 편집 (이름 / 생년월일 / 학년 / 학교 / 부모이름 / 부모번호 / 사이즈)
- 종별 자동 추론 결과를 행 우측에 chip 표시 (예: `초3·4부 (U10)`)
- 제출 버튼 옆에 총 참가비 라이브 계산 (`5명 × 30,000원 = 150,000원`)
- 저장 자동 (debounce 1초), 제출 전에 "수정 확정" 모달

### 5-3. 부모 클레임 (`/claim/[token]`, 비로그인 → 가입 흐름)
- 카드: "○○○ 학생의 강남구협회장배 △△부 참가가 신청되었습니다"
- 자녀 정보 미리보기 (생년월일·학교·팀명)
- CTA: "본인 인증하고 자녀 연결하기" → 가입/로그인 흐름
- 가입 완료 후 자동으로 `/mypage/children` 이동

### 5-4. 마이페이지 자녀 관리 (`/mypage/children`)
- 자녀 카드 N개 (재사용 가능 컴포넌트)
- 각 카드: 이름·생년월일·학교 + 클레임된 대회 이력
- "자녀 추가" 버튼 (대회 무관 등록 가능)

### 5-5. 디자인 룰 (CLAUDE.md §🎨 13 룰 — 위반 자동 reject)
- AppNav: `Dev/design/claude-project-knowledge/03-appnav-frozen-component.md` 코드 그대로 카피
- 검색·쪽지·알림 = `app-nav__icon-btn` (border/bg 박스 ❌)
- 색상: `var(--color-*)` 토큰만 / 핑크·살몬·코랄 ❌
- 정사각형(W=H) 원형은 50% 사용 (9999px ❌)
- 720px 분기 / iOS input 16px / 버튼 44px
- placeholder 5단어 이내 / "예: " 시작 ❌

### 5-6. UX 카피 (design:ux-copy 룰 적용)
- SMS 본문: `[BDR] {child_name} 학생 강남구협회장배 참가 확인 ▶ {url}` (45자 이내)
- 코치 신청서 헤더: `강남구협회장배 — {team_name} 참가신청`
- 부모 클레임 페이지: 안내 톤 정중 / 자녀 사진 자리 비워두기 (선택사항)
- 에러: `이름·생년월일이 신청서와 다릅니다. 코치에게 확인 부탁드려요.`

---

## 6. 구현 단계 (PR 6개, 약 5~6일)

| Phase | 산출물 | 의뢰자 | 소요 |
|---|---|---|---|
| 1 | 데이터 모델 + 종별 룰 + 운영자 토큰 발급 | developer | 1일 |
| 2 | 코치 신청서 입력 페이지 + 종별 자동 매핑 | developer + 디자인 | 1.5일 |
| 3 | 부모 매직링크 + SMS + 클레임 흐름 | developer | 1.5일 |
| 4 | 운영자 대시보드 (진행률/종별/정산) | developer + 디자인 | 0.5일 |
| 5 | 마이페이지 자녀 관리 | developer + 디자인 | 0.5일 |
| 6 | 자동 검증 (단위 + E2E + IDOR) | tester | 1일 |

각 Phase 별 CLI 프롬프트는 `Dev/cli-prompts/2026-05-11-youth-bulk-phase-N.md` 에 별도 저장.

---

## 7. 자동 검증 (Phase 6 상세)

### 단위 테스트
- `mapPlayerToDivision()` — 12월생 경계, 학년 불일치, NULL 학년, 룰 외 생년월일
- 클레임 매칭 검증 — 이름 정확/오타/생년월일 ±1년/동명이인

### E2E (Playwright)
1. 운영자 토큰 발급 → 토큰 URL 획득
2. (다른 브라우저) 코치 토큰 진입 → 선수 3명 입력 → 제출
3. 운영자 대시보드에서 SMS 발송 (mock)
4. 매직링크 URL 추출 → 부모 가입 → 자녀 연결
5. `/mypage/children` 에서 자녀 + 대회 이력 확인

### 보안 점검
- 다른 팀 토큰으로 접근 → 403
- 만료 토큰 / 재사용 토큰 → 거부
- 부모 클레임 시 다른 자녀 ID 주입 → 거부 (이름+생년월일 매칭 검증)
- 운영자 권한 없는 사용자가 admin API 호출 → 403
- 코치 토큰 brute-force → 레이트리밋 + 토큰 충돌 0 (32바이트 hex)

### 회귀 방지 체크 (CLAUDE.md Phase 19)
- AppNav main bar 우측 = 검색/쪽지/알림/다크/햄버거 5개만
- 모바일 다크모드 듀얼 라벨 ❌
- pill border-radius 9999px ❌

---

## 8. 운영 사전 확인 (사용자/협회 결정 필요)

다음 항목은 PM 단독 결정 ❌ — 운영진과 협의 필요:

1. **대회 D-Day** — 일정 역산 위해 필수
2. **종별 컷오프 생년월일/학년** — DivisionRule seed 데이터
   - 예: `U10 = 2016년생, 초3~4 / U12 = 2014년생, 초5~6 / M1 = 2013년생, 중1` 같이 정확한 룰
3. **종별 참가비** — 종별 다른지 / 팀당 다른지
4. **SMS 발송 채널** — 기존 시스템 유무 확인. 없으면:
   - 솔라피(SOLAPI) / NHN Toast SMS / 알리고 중 선택
   - 알림톡 (카카오) 사용 시 템플릿 사전 등록 필요 (1~2 영업일)
5. **개인정보 동의 문구** — 미성년자 보호자 동의 필수 (법적 요구)
6. **참가비 입금 방식** — 무통장 / 카카오송금 / 토스 / 가상계좌
7. **이미 가입한 부모 처리** — 기존 회원 부모인 경우 매직링크 클릭 시 즉시 연결 (가입 스킵)

---

## 9. 위험 + Mitigation

| 위험 | 영향 | 대응 |
|---|---|---|
| SMS 도달 실패 (스팸/번호변경) | 클레임 누락 → 현장 혼란 | 알림톡 백업, 이메일 옵션, 코치가 부모에게 직접 링크 재전달 가능하도록 토큰 URL 제공 |
| 동명이인 매칭 충돌 | 다른 자녀 잘못 연결 | 이름+생년월일+학교 3-key 매칭, 의심 시 운영자 수동 승인 |
| 클레임 안한 자녀 (대회 당일) | 데이터 결손 | 현장 신분증 인증 fallback, 부모 동의서 종이 양식 |
| 운영 DB 단일 정책 | schema 변경이 즉시 운영 반영 | 모든 변경 NULL 허용 ADD COLUMN, schema diff 사용자 승인 |
| 코치 토큰 유출 | 다른 사람이 명단 조작 | 토큰 만료 + IP 레이트리밋 + 제출 후 잠금 |
| 종별 컷오프 변경 | 이미 입력된 선수 종별 재계산 필요 | 종별은 player 레코드에 stored, 룰 변경 시 재매핑 배치 스크립트 |
| 부모 비협조 | 클레임률 저조 | 운영자 대시보드에 미클레임 명단 노출 + 재발송 버튼 |

---

## 10. Phase 1 CLI 프롬프트 (즉시 사용 가능)

별도 파일: `Dev/cli-prompts/2026-05-11-youth-bulk-phase-1.md`

---

## 11. 재사용 시나리오 (향후 다른 유소년 대회)

이번 작업이 만드는 재사용 가능 자산:
- `ChildProfile` 모델 — 부모-자녀 영구 관계
- `TournamentDivisionRule` 모델 — 대회별 종별 룰
- 매직링크 클레임 시스템 — 모든 청소년 대회 공통
- 코치 토큰 신청서 흐름 — 일반 성인 대회에도 적용 가능 (parent_* 필드만 NULL)
- 종별 자동 매핑 유틸 — 다른 연령 구간 룰도 동일 함수
- `/mypage/children` UI — 향후 자녀 직접 대회 참가 신청 시 재사용

다음 유소년 대회: DivisionRule seed + SMS 템플릿만 갱신하면 즉시 적용.

---

## 12. 체크리스트 (PM)

- [ ] 운영진과 §8 7개 항목 협의 (특히 D-Day, 종별 룰, SMS 채널)
- [ ] 강남구협회 개인정보 동의 문구 확보
- [ ] Phase 1 CLI 프롬프트 검토 후 `subin` 브랜치에서 시작
- [ ] schema diff 출력 → 사용자 승인 → push
- [ ] 각 Phase 완료 시 PR `subin → dev`, dev 머지 후 다음 Phase
- [ ] Phase 6 검증 완료 후 `dev → main` (수빈 또는 원영 승인)
- [ ] Flutter 앱 영향 검토 — `/api/v1/...` 변경 없으면 원영 사전 공지 불요. ChildProfile 이 앱에서도 필요해지면 원영과 협의

