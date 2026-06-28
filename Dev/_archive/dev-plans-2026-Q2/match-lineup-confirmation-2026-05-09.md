# 사전 라인업 확정 + 기록앱 자동 매핑 — 기획서

> 작성일: 2026-05-09 / 작성자: planner-architect / 상태: 결재 대기 (Q1~Q9)
> 다음 대회 대비 (5/9 동호회최강전 D-day 후속)
> Flutter v1 호환 / 회귀 0 / DB destructive 0 — 우선순위

---

## §1 배경 / 요구사항

### 1.1 현황 (5/9 운영 시점)

기록원이 매치 시작 시점 (`/match/{id}/starter-select`) 에 16명+ ttp 명단에서:
1. 출전 선수 체크 (전체선택 버튼 사용)
2. 주전 5명 토글
3. 경기 룰 (쿼터 / 타임아웃 / 색상) 설정
4. "경기 시작" 클릭

**문제**: 매치 직전 5분 내 1인 기록원이 양 팀 합계 ~30 항목 수동 클릭. 익숙치 않은 팀명/등번호 → 오기록 발생 가능. 팀장은 명단을 사전에 확정해뒀지만 기록원에게 전달 채널 0.

### 1.2 사용자 요구사항 (명시)

| # | 요구 | 기대 효과 |
|---|------|----------|
| R1 | 경기 시작 1시간 전 양 팀 팀장에게 푸시 | 사전 입력 유도 |
| R2 | 팀장 UI = 출전 선수 + 주전 5 선택 | 정식 라인업 확정 |
| R3 | 사전 라인업 영구 저장 | 대회 후 분석/감사 |
| R4 | 기록앱 자동 매핑 | 기록원 클릭 0 → 즉시 시작 |

### 1.3 비기능 요구

- **Flutter v1 호환** = 라인업 미입력 매치는 기존 흐름 (기록원 수동) 그대로 작동
- **DB destructive 0** = ADD COLUMN / 신규 테이블만, DROP/UPDATE 대량 ❌
- **회귀 0** = ttp.isStarter 도메인 보존 (대회 단위 통산 starter 의미)

---

## §2 데이터 모델 — 옵션 3종

### 2.1 옵션 A — 신규 테이블 `match_lineup_confirmed` ⭐ 권장

새 테이블 1건 + ADD COLUMN 1건 (TournamentMatch).

```prisma
// 매치별 사전 라인업 확정 (팀장 입력 / 기록원 자동 매핑)
// 양 팀 = 매치당 row 2건 (home / away 각 1건). 부분 입력 (한 팀만) 허용.
model MatchLineupConfirmed {
  id                  BigInt    @id @default(autoincrement())
  tournamentMatchId   BigInt    @map("tournament_match_id")
  tournamentTeamId    BigInt    @map("tournament_team_id")  // home or away (FK = TournamentTeam.id)
  side                String    @db.VarChar(4)              // "home" / "away" (조회 인덱스)
  // 출전 선수 ttpId 배열 (Json 배열 권장 — 5~16개 가변)
  // 예: [3001, 3002, ..., 3015]
  activeTtpIds        Json      @map("active_ttp_ids")
  // 주전 5 ttpId 배열 (정확히 5건)
  // 예: [3001, 3002, 3003, 3004, 3005]
  starterTtpIds       Json      @map("starter_ttp_ids")
  // 누가 입력했는지 (팀장 user_id / 운영자 대리 입력 케이스 식별)
  confirmedByUserId   BigInt    @map("confirmed_by_user_id")
  confirmedByRole     String    @db.VarChar(16)             // "leader" / "admin" / "captain"
  confirmedAt         DateTime  @default(now()) @map("confirmed_at") @db.Timestamp(6)
  // 마지막 수정 시각 (재입력 케이스)
  updatedAt           DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  // 기록원이 자동 매핑 적용했는지 (한번 매핑 후 잠금)
  appliedAt           DateTime? @map("applied_at") @db.Timestamp(6)

  tournamentMatch     TournamentMatch     @relation(fields: [tournamentMatchId], references: [id], onDelete: Cascade)
  tournamentTeam      TournamentTeam      @relation(fields: [tournamentTeamId], references: [id], onDelete: Cascade)
  confirmedByUser     User                @relation("LineupConfirmer", fields: [confirmedByUserId], references: [id], onDelete: NoAction)

  @@unique([tournamentMatchId, side], map: "idx_match_lineup_confirmed_match_side")  // 매치당 home/away 각 1건
  @@index([tournamentMatchId])
  @@index([tournamentTeamId])
  @@map("match_lineup_confirmed")
}
```

**+ ADD COLUMN** TournamentMatch:
```sql
ALTER TABLE tournament_matches ADD COLUMN lineup_reminder_sent_at TIMESTAMP NULL;  -- 푸시 1회성 가드
```

#### 장점
- 매치 단위 명확 — `tournamentMatchId` 단일 키 (조회/검증 단순)
- ttp.isStarter (대회 통산) 도메인 영구 보존 — 회귀 0
- 부분 입력 허용 (home만 입력 / away 미입력 → home row만 생성)
- 재입력/수정 자유 — `appliedAt IS NULL` 까지 변경 가능 (기록원 매핑 전 잠금)
- 감사 추적 (`confirmedByUserId` + `confirmedAt`)

#### 단점
- 신규 테이블 1건 (마이그 학습 비용)
- Json 배열 → ttp 무결성 (FK 0) — 별도 검증 로직 필요 (zod / 서비스 레이어)

---

### 2.2 옵션 B — 기존 `MatchPlayerJersey` 흡수 (확장)

기존 테이블에 컬럼 추가. ADD COLUMN 4건.

```sql
ALTER TABLE match_player_jersey ADD COLUMN is_lineup_confirmed BOOLEAN DEFAULT false;
ALTER TABLE match_player_jersey ADD COLUMN is_starter BOOLEAN DEFAULT false;
ALTER TABLE match_player_jersey ADD COLUMN confirmed_by_user_id BIGINT NULL;
ALTER TABLE match_player_jersey ADD COLUMN confirmed_at TIMESTAMP NULL;
```

매치별 출전 = `MatchPlayerJersey` row 존재 / 주전 = `is_starter=true`.

#### 장점
- 신규 테이블 0
- 매치별 jersey 의미 확장 (이미 매치 단위 row)

#### 단점 (탈락 사유)
- **MatchPlayerJersey 본래 의미 = jersey 임시 변경** — 라인업 흡수 시 의미 혼재
- 출전인데 jersey 변경 안 한 ttp → row 생성 강요 (현재는 변경된 ttp만 row)
- "사전 확정" vs "운영자 매치 시점 jersey 수정" 구분 어려움
- 회귀 위험: PR4 기존 흐름 (운영자 W1 모달) 영향

---

### 2.3 옵션 C — `TournamentTeamPlayer.isStarter` 매치별 확장 (탈락)

ttp.isStarter 가 매치별이 아닌 대회 통산 의미. 매치별 row 분리 시 ttp 도메인 깨짐. **고려 안 함**.

---

### 2.4 결정 추천

| 항목 | 옵션 A (신규 테이블) | 옵션 B (Jersey 확장) |
|------|--------------------|--------------------|
| 매치 단위 명확성 | ⭐⭐⭐ | ⭐⭐ |
| 도메인 분리 | ⭐⭐⭐ | ⭐ (혼재) |
| 회귀 위험 | 0 | 중 (PR4) |
| 마이그 비용 | 신규 테이블 1건 | ADD COLUMN 4건 |
| **권장** | **A** ⭐ | — |

→ **Q1 결재** = A (신규 테이블) 권장

---

## §3 트리거 — 옵션 2종

### 3.1 옵션 A — Vercel Cron 5분 폴링 ⭐ 권장

`vercel.json` 에 cron 1건 추가.

```json
{
  "path": "/api/cron/match-lineup-reminder",
  "schedule": "*/5 * * * *"
}
```

#### 동작 (의사 코드)

```typescript
// /api/cron/match-lineup-reminder/route.ts (≈80L)
const now = new Date();
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
const fiftyFiveMinLater = new Date(now.getTime() + 55 * 60 * 1000);

// 55~60분 후 시작 매치 + 푸시 미발송
const matches = await prisma.tournamentMatch.findMany({
  where: {
    status: { in: ["scheduled", "ready"] },
    scheduledAt: { gte: fiftyFiveMinLater, lt: oneHourLater },
    lineup_reminder_sent_at: null,  // 1회성 가드
    homeTeamId: { not: null },       // 매칭 미정 매치 제외
    awayTeamId: { not: null },
  },
  select: {
    id: true,
    homeTeam: { select: { team: { select: { teamMembers: { where: { role: "leader" }, select: { userId: true } } } } } },
    awayTeam: { select: { team: { select: { teamMembers: { where: { role: "leader" }, select: { userId: true } } } } } },
  },
});

for (const m of matches) {
  // 양 팀 팀장 user_id 모음 (1팀당 최대 1명)
  const targets = [...m.homeTeam.team.teamMembers, ...m.awayTeam.team.teamMembers].map(t => t.userId);
  await createNotificationBulk(targets.map(userId => ({
    userId,
    notificationType: "MATCH_LINEUP_REMINDER",
    title: "경기 1시간 전 — 라인업 확정해주세요",
    content: `[${tournament.name}] ${formatTime(m.scheduledAt)} 매치 라인업 입력`,
    actionUrl: `/lineup-confirm/${m.id}`,
  })));
  // 1회성 가드
  await prisma.tournamentMatch.update({ where: { id: m.id }, data: { lineup_reminder_sent_at: now } });
}
```

#### 장점
- 기존 cron 5건 패턴 그대로 (`tournament-reminders` 동일 구조)
- 5분 폴링 = 정확도 ±5분 (1시간 ±5 = 55~65분) — 실용적 충분
- `lineup_reminder_sent_at` UNIQUE 가드 = 중복 발송 0

#### 단점
- 5분 정밀도 (1분 단위 X) — 사용자 체감 거의 무관

---

### 3.2 옵션 B — Vercel Scheduled Function (1분 폴링)

`*/1 * * * *` cron. 정밀도 ↑ 비용 ↑.

#### 단점
- Vercel Hobby 플랜 cron 제한 = 분 단위 가능하나 비용 증가
- 5분 폴링 대비 사용자 체감 차이 0

→ **Q2 결재** = A (5분 폴링) 권장

---

## §4 푸시 채널 — 옵션 3종

### 4.1 현재 인프라

- `push_subscriptions` (web push, VAPID 설정 완료) — 사용자 브라우저 구독 시
- `notifications` (인앱 알림) — 항상 저장
- `createNotificationBulk` 헬퍼 = 인앱 + web push 동시 발송

### 4.2 옵션 A — 기존 `createNotificationBulk` 재사용 ⭐ 권장

cron 에서 `createNotificationBulk` 호출 → 인앱 + web push 자동 발송. 별도 인프라 0.

#### 장점
- 신규 코드 0 (기존 헬퍼 그대로)
- 인앱 알림 영구 저장 → 푸시 미수신 (브라우저 미구독) 케이스도 알림 페이지에서 확인 가능
- VAPID 키 설정된 환경에서만 web push, 미설정 = 인앱만 (graceful fallback)

#### 단점
- 팀장이 web push 미구독 + 인앱 알림 페이지 미접속 시 푸시 누락
- → **알림톡 / SMS 추가 옵션 필요?** (Q3)

### 4.3 옵션 B — SMS 추가 (외부 인프라)

NHN Toast SMS / Twilio. 비용 = 건당 ~10원.

#### 장점
- 푸시 누락 0 (휴대폰 SMS 직접 도달)

#### 단점
- 신규 인프라 (API 키 / 환경변수 / 발송 헬퍼 ~50L)
- 비용 발생 (대회당 ~30매치 × 2 팀장 = 60건 / ~600원)
- 팀장 휴대폰 미입력 케이스 처리 필요

### 4.4 옵션 C — 카카오 알림톡 (Bizm / NHN)

#### 장점
- SMS 대비 저렴 (건당 ~7원)
- 카카오톡 도달률 높음

#### 단점
- 사전 템플릿 등록 (검수 1~2일)
- 신규 인프라 + 환경변수

→ **Q3 결재** = A (web push + 인앱) → 운영 추적 후 누락 케이스 발견 시 B/C 추가

---

## §5 팀장 UI — 새 페이지

### 5.1 라우트 + 권한

`/lineup-confirm/[matchId]` (web 페이지 — `(web)` 그룹).

#### 권한 가드 (server component layout)

```typescript
const auth = await getAuthUser();
if (auth.state !== "active") redirect("/login");

const match = await prisma.tournamentMatch.findUnique({
  where: { id: BigInt(matchId) },
  select: {
    homeTeam: { select: { teamId: true, team: { select: { captainId: true, manager_id: true, teamMembers: { where: { role: "leader" } } } } } },
    awayTeam: { select: { ... } },
  },
});

// 권한 체크: 양 팀 중 1팀의 leader / captain / manager 여부
const myTeamSide = isLeaderOf(auth.user.id, match.homeTeam) ? "home"
                 : isLeaderOf(auth.user.id, match.awayTeam) ? "away"
                 : null;

if (!myTeamSide) {
  // 운영자 대리 입력 케이스: tournamentAdminMember 검증
  const isAdmin = await isTournamentAdmin(auth.user.id, match.tournamentId);
  if (!isAdmin) redirect("/");  // 권한 없음 = 홈으로
}
```

### 5.2 UI 와이어프레임 (텍스트)

```
┌─────────────────────────────────────────────┐
│  ← 라인업 확정 [몰텐배 16강 #5]              │
├─────────────────────────────────────────────┤
│                                              │
│  ⏰ 13:30 시작 (45분 전)                     │
│  📍 코트 A                                   │
│                                              │
│  ┌─ 우리팀 (열혈농구단) ──────────┐         │
│  │                                  │         │
│  │  [출전 ☑] [주전 ☆]  #7  김수빈   │         │
│  │  [출전 ☑] [주전 ★]  #10 이도균   │  ⭐     │
│  │  [출전 ☑] [주전 ★]  #15 박지훈   │  ⭐     │
│  │  [출전 ☐] [주전 -]  #22 최영수   │         │
│  │  [출전 ☑] [주전 ☆]  #33 정훈     │         │
│  │  ...                              │         │
│  │                                  │         │
│  │  ✅ 출전 8명 / 주전 2/5          │         │
│  │  [전체 출전 선택] [출전 해제]    │         │
│  └─────────────────────────────────┘         │
│                                              │
│  ┌─ 상대팀 (BDR Pro) ────────────────┐       │
│  │  (읽기 전용 — 상대 팀장이 입력 중) │       │
│  │  ⏳ 미입력                          │       │
│  └────────────────────────────────────┘       │
│                                              │
│  [라인업 확정 — 변경 불가 잠금]              │
│  (주전 5명 미달 시 비활성화)                 │
└─────────────────────────────────────────────┘
```

### 5.3 동작 정의

| 동작 | 결과 |
|------|------|
| 출전 토글 | ttpId → activeTtpIds 추가/제거 (주전이면 주전도 함께 제거) |
| 주전 토글 | activeTtpIds 에 있어야만 가능 (5명 미달 시 추가 / 5명 도달 시 차단) |
| "전체 출전 선택" | role=player|captain ttp 모두 active |
| "라인업 확정" 버튼 | POST `/api/web/match-lineup/confirm` → DB 저장 + 잠금 |
| 우리팀 영역 | 권한 있는 팀만 (1 페이지에 1팀, 양 팀 동시 X) |
| 상대팀 영역 | 읽기 전용 + 입력 상태 표시 ("⏳ 미입력" / "✅ 확정 완료") |

### 5.4 모바일 최적화

- 720px 이하 = 1열 레이아웃 (우리팀 → 상대팀 세로 배치)
- 출전/주전 체크박스 = 44px 최소 터치 영역
- 스크롤 = 16명 ttp 1화면 안 가능 (각 row 60px → 16 × 60 = 960px → 스크롤 필요)

### 5.5 컴포넌트 구조

```
src/app/(web)/lineup-confirm/[matchId]/
├── page.tsx                        // server component (권한 가드 + 데이터 fetch)
├── _components/
│   ├── lineup-confirm-form.tsx     // 클라 (체크 상태 관리)
│   ├── ttp-row.tsx                 // ttp 1건 카드 (출전/주전/이름/번호)
│   └── opposite-team-status.tsx    // 상대팀 입력 상태 표시
```

---

## §6 기록앱 자동 매핑 — Flutter 영향 범위

### 6.1 현재 흐름

1. Flutter 매치 진입 → `getMatchRoster(matchId)` 1회 호출
2. 응답 = `{ home_players: [{id, name, jersey_number, is_starter, position}], away_players: [...] }`
3. `is_starter=true` 인 ttp 만 `_homeStarters` set 채움 (`take(5)`)
4. 사용자 (기록원) 가 출전/주전 수동 클릭

### 6.2 자동 매핑 옵션 — 3종

#### 옵션 A — roster API 응답 확장 (필드 추가) ⭐ 권장

`GET /api/v1/matches/[id]/roster` 응답에 사전 라인업 필드 추가:

```json
{
  "success": true,
  "data": {
    "home_players": [
      { "id": 3001, "name": "김수빈", "jersey_number": 7, "is_starter": false, "position": "PG" },
      ...
    ],
    "away_players": [...],
    "home_lineup_confirmed": {           // 신규 ⭐
      "active_ttp_ids": [3001, 3002, 3003, ...],
      "starter_ttp_ids": [3001, 3002, 3003, 3004, 3005],
      "confirmed_at": "2026-05-09T12:30:00Z",
      "confirmed_by_role": "leader"
    },
    "away_lineup_confirmed": null         // 미입력 = null
  }
}
```

Flutter (`starter_select_screen.dart` `_loadData()`):

```dart
// AS-IS: ttp.isStarter 기반 take(5)
final homeStarterIds = homePlayers.where((p) => p.isStarter).take(5).map((p) => p.id).toSet();

// TO-BE: 사전 라인업 우선 + ttp.isStarter fallback
final lineup = response.data['home_lineup_confirmed'];
final homeStarterIds = lineup != null
  ? Set<int>.from(lineup['starter_ttp_ids'])           // 사전 입력 사용
  : homePlayers.where((p) => p.isStarter).take(5).map((p) => p.id).toSet();  // fallback
final homeActiveIds = lineup != null
  ? Set<int>.from(lineup['active_ttp_ids'])
  : <int>{};
```

##### 장점
- API 1회 호출 (별도 endpoint 0)
- snake_case 자동 (`apiSuccess()` 변환)
- Flutter 변경 = `_loadData()` 30줄 추가 (조건부 분기)
- 미입력 매치 = 기존 흐름 (회귀 0)

##### 단점
- roster 응답 크기 증가 (~200byte / 큰 영향 0)
- Flutter 클라 업데이트 필요 (앱 빌드 + 배포)

#### 옵션 B — 신규 endpoint `/api/v1/matches/[id]/lineup`

별도 endpoint. Flutter 가 roster + lineup 2회 호출.

##### 단점
- 호출 2회 (네트워크 비효율)
- Flutter 클라 변경 폭 ↑

#### 옵션 C — Flutter 변경 0 (서버에서 ttp.isStarter 동적 갱신)

cron 1시간 전 트리거 시 사전 라인업 → ttp.isStarter PATCH (5명만 true / 나머지 false). roster 응답 필드 0.

##### 단점 (탈락)
- **ttp.isStarter 도메인 깨짐** — 대회 통산 의미 vs 매치 단위 의미 혼재
- 매치 종료 후 다시 원상 복구 PATCH 필요 (이중 cron)
- 다른 매치 동시 진행 시 의미 충돌 (같은 팀 다른 매치 starter 다른 경우)
- → **고려 안 함**

#### 결정 추천

| 항목 | A (roster 확장) | B (별도 endpoint) | C (ttp PATCH) |
|------|---------------|------------------|--------------|
| Flutter 변경 | ~30줄 | ~80줄 | 0 |
| 회귀 위험 | 0 | 0 | 높음 |
| 네트워크 | 1회 | 2회 | 1회 |
| **권장** | **A** ⭐ | — | — |

→ **Q4 결재** = A (roster 응답 확장) 권장

### 6.3 Flutter 호환 정책

- v1 (현재 배포) Flutter 앱 = roster 응답에 신규 필드 무시 (기존 흐름) → 회귀 0
- v2 (라인업 매핑 적용) Flutter 앱 = 사전 라인업 우선 / 미입력 fallback
- → **점진 마이그**: 서버는 v1+v2 동시 지원 / 운영자에게 v2 앱 업데이트 권장 안내

### 6.4 자동 매핑 적용 시점 — Q5

| 옵션 | 동작 |
|------|------|
| A — 즉시 자동 적용 (강제) | 기록원 클릭 0, "이미 확정됨" 표시 |
| B — 운영자 검토 후 적용 | "사전 라인업 적용" 버튼 / 검토 가능 |
| C — 자동 적용 + 변경 가능 | 자동 채움 + 기록원 수정 자유 |

→ **Q5 결재** = C (자동 채움 + 변경 자유) 권장 — 사전 입력 활용 + 현장 변경 (부상 등) 대응

---

## §7 보안 / 권한 / Flutter v1 호환

### 7.1 팀장 인증 흐름 (web)

| 단계 | 검증 |
|------|------|
| 1 | `getAuthUser()` 진입점 → `auth.state === "active"` |
| 2 | 매치 → 양 팀 leader/captain/manager 멤버십 확인 |
| 3 | 운영자 대리 입력 시 `tournamentAdminMember` 검증 |
| 4 | API endpoint = `withWebAuth` + `withValidation(zod)` 필수 |

### 7.2 매치 권한 검증

```typescript
// /api/web/match-lineup/confirm — POST 검증 흐름
const session = await getWebSession();
const { matchId, side, activeTtpIds, starterTtpIds } = await req.json();

// 1. 매치 존재 + 미시작 + 미적용 (appliedAt IS NULL)
const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId }, ... });
if (!match) return apiError("매치를 찾을 수 없습니다", 404);
if (match.status !== "scheduled" && match.status !== "ready") return apiError("이미 시작된 매치입니다", 409);

// 2. 사용자 권한 (leader / captain / manager / admin)
const targetTeam = side === "home" ? match.homeTeam : match.awayTeam;
const isAuthorized =
  targetTeam.team.captainId === session.userId ||
  targetTeam.team.manager_id === session.userId ||
  targetTeam.team.teamMembers.some(m => m.userId === session.userId && m.role === "leader") ||
  await isTournamentAdmin(session.userId, match.tournamentId);
if (!isAuthorized) return apiError("권한 없음", 403);

// 3. ttp 무결성 (모두 해당 팀 ttp인지)
const validTtpIds = await prisma.tournamentTeamPlayer.findMany({
  where: { tournamentTeamId: targetTeam.id, id: { in: [...activeTtpIds, ...starterTtpIds] } },
  select: { id: true },
});
if (validTtpIds.length !== new Set([...activeTtpIds, ...starterTtpIds]).size) {
  return apiError("선수 명단이 유효하지 않습니다", 422);
}

// 4. 주전 5명 룰 (Q6 = 강제 vs 권장)
if (starterTtpIds.length !== 5) return apiError("주전은 정확히 5명이어야 합니다", 422);

// 5. 주전 ⊆ 출전
if (!starterTtpIds.every(id => activeTtpIds.includes(id))) {
  return apiError("주전은 출전 선수 안에서 선택해야 합니다", 422);
}

// 6. upsert (재입력 허용)
await prisma.matchLineupConfirmed.upsert({
  where: { tournamentMatchId_side: { tournamentMatchId: matchId, side } },
  create: { tournamentMatchId: matchId, side, tournamentTeamId: targetTeam.id, activeTtpIds, starterTtpIds, confirmedByUserId: session.userId, confirmedByRole: "leader", confirmedAt: new Date() },
  update: { activeTtpIds, starterTtpIds, confirmedByUserId: session.userId, updatedAt: new Date() },
});

return apiSuccess({ confirmed: true });
```

### 7.3 Flutter v1 호환 보장

- 신규 필드 `home_lineup_confirmed` / `away_lineup_confirmed` 추가 = **응답 키 변경 0** (기존 키 유지)
- v1 앱 = 신규 필드 무시 → 기존 흐름 (ttp.isStarter take(5)) 그대로 작동
- 단일 회귀 케이스 = v1 앱 + 사전 라인업 입력 매치 → 기록원 클릭 0 효과 안 받음 (불편 0)

### 7.4 IDOR / 멀티테넌트

- 매치 → 토너먼트 → 팀장 멤버십 검증 시 `tournamentId` 명시 (서브도메인 환경 호환)

---

## §8 마이그 단계 — 8 PR

| PR | 파일 변경 | 라인 수 | 의존 |
|----|---------|--------|------|
| **PR1** DB 마이그 | `prisma/schema.prisma` (모델 1 추가 + ADD COLUMN 1) | ~30L | 없음 |
| **PR2** API endpoint (web) | `src/app/api/web/match-lineup/confirm/route.ts` 신규 / `src/app/api/web/match-lineup/[matchId]/route.ts` GET (기존 입력 fetch) | ~200L | PR1 |
| **PR3** Web 페이지 | `src/app/(web)/lineup-confirm/[matchId]/page.tsx` + `_components/` 3 파일 | ~400L | PR2 |
| **PR4** Cron 푸시 | `src/app/api/cron/match-lineup-reminder/route.ts` 신규 / `vercel.json` cron 1건 추가 / `src/lib/notifications/types.ts` `MATCH_LINEUP_REMINDER` 추가 | ~120L | PR2 |
| **PR5** roster API 확장 (v1) | `src/app/api/v1/matches/[id]/roster/route.ts` 응답에 `home_lineup_confirmed` / `away_lineup_confirmed` 필드 추가 | ~40L | PR1 |
| **PR6** Flutter 클라 | `bdr_stat_temp/lib/presentation/screens/match/starter_select_screen.dart` `_loadData()` 분기 / `bdr_stat_temp/lib/data/api/api_client.dart` 응답 모델 확장 | ~50L | PR5 |
| **PR7** 알림 페이지 deep-link | `src/app/(web)/notifications/page.tsx` `MATCH_LINEUP_REMINDER` 클릭 → `/lineup-confirm/[matchId]` 이동 (자동 actionUrl 적용) | ~10L | PR4 |
| **PR8** 운영 검증 + 박제 | tester (curl 4종) + reviewer + scratchpad/architecture 갱신 | — | 전체 |

### 8.1 PR 의존 그래프

```
PR1 (DB) ──┬─ PR2 (API) ── PR3 (Web 페이지)
           │              └─ PR4 (Cron) ── PR7 (deep-link)
           └─ PR5 (roster) ── PR6 (Flutter)
                                                ↓
                                              PR8 (검증)
```

### 8.2 부분 배포 가능

- **Stage 1** (PR1+PR2+PR3) — 팀장 입력 UI 만 활성, 자동 매핑 X. 사용자 영향 0
- **Stage 2** (PR4+PR7) — 푸시 알림 추가. 입력률 측정 가능
- **Stage 3** (PR5+PR6) — Flutter 자동 매핑 적용. v1 앱 호환 유지
- **Stage 4** (PR8) — 1회 운영 검증 + 박제

---

## §9 회귀 위험 / Fallback 정책

### 9.1 사전 미입력 매치 처리

| 케이스 | 동작 |
|--------|------|
| 양 팀 모두 미입력 | 기존 흐름 (기록원 수동 선택 / ttp.isStarter take(5)) |
| 한 팀만 입력 | 입력 팀만 자동 채움 / 미입력 팀 = 수동 |
| 양 팀 모두 입력 | 양 팀 자동 채움 / 기록원 검토 후 변경 가능 (Q5=C) |

### 9.2 Flutter v1 (구버전) 앱 호환

- roster 응답 신규 필드 무시 → 기존 흐름 100% 보존
- 입력률 통계 만 영향 (자동 매핑 효과 X)

### 9.3 푸시 누락 케이스

- web push 미구독 → 인앱 알림 (notifications 페이지) 에서 확인
- 인앱도 미접속 → 매치 시작 시점 입력 0 → 기록원 수동 fallback (현재와 동일)
- 운영자 대리 입력 가능 (`/lineup-confirm/[matchId]` 직접 진입)

### 9.4 잘못된 입력 (실수)

- `appliedAt IS NULL` 까지 재입력 자유 (기록원이 starter 화면 진입 시점 = `appliedAt` 채움 → 잠금)
- 매치 시작 후 변경 = `MatchPlayerJersey` (PR4 운영자 모달) 또는 substitution 으로 처리 (별개 흐름)

### 9.5 양 팀 팀장 모두 입력 안 했을 때 — Q7

| 옵션 | 동작 |
|------|------|
| A — 기록원 수동 fallback (현재와 동일) ⭐ | 자동 매핑 X / 기록원 클릭 |
| B — 운영자 대리 입력 강제 | 매치 시작 차단 / 운영자 입력 강요 |
| C — 시간 임박 시 운영자 대시보드 알림 | 푸시 + 대시보드 우선순위 표시 |

→ **Q7 결재** = A (수동 fallback) 권장 — 회귀 0 / 운영 부담 0

### 9.6 주전 5명 강제 vs 권장 — Q6

| 옵션 | 동작 |
|------|------|
| A — 강제 (5명 미달 시 저장 차단) ⭐ | UI/API 모두 5명 검증 — Flutter 자동 매핑 안전 |
| B — 권장 (저장 가능, 부족하면 기록원 수동 추가) | 유연 / Flutter 분기 복잡 |

→ **Q6 결재** = A (5명 강제) 권장 — Flutter 자동 매핑 단순화

---

## §10 추정 시간

### 10.1 PR별 예상

| PR | 작업 | Web | Flutter | 인프라 | 합계 |
|----|------|----:|--------:|------:|----:|
| PR1 | DB 마이그 (모델 + ADD COLUMN) | 30분 | — | — | 30분 |
| PR2 | API endpoint 2건 | 90분 | — | — | 90분 |
| PR3 | Web 팀장 페이지 | 180분 | — | — | 180분 |
| PR4 | Cron + 푸시 | 60분 | — | — | 60분 |
| PR5 | roster 응답 확장 | 30분 | — | — | 30분 |
| PR6 | Flutter 클라 분기 | — | 60분 | — | 60분 |
| PR7 | 알림 deep-link | 15분 | — | — | 15분 |
| PR8 | 검증 + 박제 | 30분 | 15분 | — | 45분 |
| **합계** | | **435분 (7.25h)** | **75분 (1.25h)** | — | **510분 (8.5h)** |

### 10.2 마일스톤

- **D1 (8.5h)** — 풀 스택 신규 기능 (Stage 1~4 일괄)
- **D0.5 (4.25h)** — Stage 1 (PR1+PR2+PR3) 만 (팀장 입력 UI 활성, 자동 매핑 후속) — 빠른 검증

### 10.3 Flutter 앱 빌드/배포

- 별도 cycle (앱스토어/플레이스토어 심사 ~3~7일)
- → Stage 3 (PR6) 는 Flutter 앱 배포 cycle 에 묶어서 진행

---

## §11 결재 항목 — Q1~Q9

### Q1. 데이터 모델

- A. **신규 테이블 `match_lineup_confirmed`** ⭐ (도메인 분리 / 회귀 0)
- B. 기존 `MatchPlayerJersey` 흡수 (테이블 0 / 의미 혼재)

### Q2. 트리거

- A. **Vercel Cron 5분 폴링** ⭐ (기존 패턴 / ±5분 정밀도)
- B. 1분 폴링 (정밀도 ↑ / 비용 ↑)

### Q3. 푸시 채널

- A. **web push + 인앱 (`createNotificationBulk` 재사용)** ⭐ (코드 0 / VAPID 활용)
- B. SMS 추가 (건당 ~10원 / 누락 0)
- C. 카카오 알림톡 (검수 1~2일 / 도달률 ↑)

### Q4. 기록앱 자동 매핑 — Flutter 영향 범위

- A. **roster API 응답 확장 (신규 필드)** ⭐ (1회 호출 / Flutter 30줄)
- B. 신규 endpoint (Flutter 80줄 / 호출 2회)
- C. ttp.isStarter 동적 갱신 (도메인 깨짐 — 탈락)

### Q5. 자동 매핑 적용 시점

- A. 즉시 자동 적용 (강제)
- B. 운영자 검토 후 "적용" 버튼
- C. **자동 채움 + 기록원 변경 자유** ⭐ (현장 부상 등 대응)

### Q6. 주전 5명 정책

- A. **강제 (5명 미달 시 저장 차단)** ⭐ (Flutter 단순화)
- B. 권장 (부족 가능)

### Q7. 양 팀 모두 미입력 시

- A. **기록원 수동 fallback (현재와 동일)** ⭐ (회귀 0)
- B. 운영자 대리 입력 강제
- C. 시간 임박 시 운영자 대시보드 알림

### Q8. 푸시 시점

- A. **시작 1시간 전** ⭐ (사용자 명시)
- B. 추가 D-1 (전날) 알림
- C. 30분 전 추가 알림

### Q9. 운영자 대리 입력

- A. **허용 (tournamentAdminMember)** ⭐ — 팀장 응답 0 케이스 대비
- B. 차단 (팀장만)

---

## §12 회귀 방지 체크리스트 (PR8 검증)

### 12.1 단위

- [ ] Q1=A — `match_lineup_confirmed` 테이블 생성 + UNIQUE (match, side) 작동
- [ ] Q2=A — cron 55~60분 매치 SELECT 정확
- [ ] Q3=A — `createNotificationBulk` 인앱 + web push 동시 발송
- [ ] Q4=A — roster 응답 `home_lineup_confirmed` / `away_lineup_confirmed` 필드 (snake_case)
- [ ] Q5=C — Flutter `_loadData()` 사전 라인업 채움 + 사용자 변경 가능
- [ ] Q6=A — 주전 4명 저장 시 422 차단
- [ ] Q7=A — 양 팀 미입력 매치 = 기록원 수동 (현재 흐름 그대로)
- [ ] Q8=A — `lineup_reminder_sent_at` 1회성 가드 (재발송 0)

### 12.2 회귀

- [ ] ttp.isStarter 도메인 영구 보존 (대회 통산 의미 유지)
- [ ] Flutter v1 (구버전) 앱 = roster 응답 신규 필드 무시 → 기존 흐름 100% 보존
- [ ] 사전 라인업 미입력 매치 = 기록원 수동 fallback (회귀 0)
- [ ] 5/9 종료 매치 (`status="completed"`) 영향 0 (cron 필터 `scheduled` / `ready` 만)

### 12.3 보안

- [ ] 팀장 (leader/captain/manager) 외 사용자 = 403
- [ ] ttp 무결성 검증 (다른 팀 ttp 입력 = 422)
- [ ] 매치 시작 후 입력 = 409 차단

### 12.4 인프라

- [ ] cron CRON_SECRET 가드
- [ ] VAPID 키 미설정 환경 = web push fallback (인앱만 / 에러 0)

---

## §13 부록 — 의사 결정 기록

### 13.1 5/9 (작성자) 검토 사항

- **ttp.isStarter** = 대회 통산 starter (TournamentTeamPlayer 580~ 행 / `isStarter Boolean? @default(false)`)
- **MatchPlayerJersey** (PR4 5/5 도입) = 매치별 임시 jersey 변경 (UNIQUE: match_id × ttp / match_id × jersey)
- **getMatchRoster** = `is_starter` 필드 그대로 노출 (`is_starter: p.isStarter ?? false`)
- **starter_select_screen** = `_loadData()` 에서 ttp.isStarter `take(5)` → `_homeStarters` set 채움 / 사용자 토글
- **현재 라인업 데이터 흐름** = 클라(Flutter) 로컬 DB만 / 서버 매핑 0 / 매치 종료 후 stats 동기화

### 13.2 도메인 보존 원칙

- ttp.isStarter = 대회 통산 starter (5/9 기존 의미)
- match_lineup_confirmed.starter_ttp_ids = 매치 단위 starter (신규)
- → 두 의미 분리 = 회귀 0

### 13.3 Flutter 앱 v1+v2 동시 운영

- 서버 = roster 응답 +2 필드 항상 노출
- v1 앱 = 무시 (기존 흐름)
- v2 앱 = 분기 처리
- → 점진 마이그 / 강제 업데이트 0

---

**END.** Q1~Q9 결재 후 PR1~PR8 8단계 진행 (총 ~8.5h).
