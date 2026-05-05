# Jersey 도메인 재설계 보고서 (2026-05-05, v2 — 옵션 C 채택)

## 0. 요약 — 권장 옵션

**권장 = 옵션 C (매치별 override, `match_player_jersey` 테이블 신설)**

> v1 보고서는 옵션 B (대회 단위 임시 번호) 권장이었으나, 사용자 명시 요구 "현장에서 갑작스러운 임시 번호 변경" → 매치 단위 override 필수 → 옵션 C 로 수정.

- `user.default_jersey_number` 삭제 (PR7 / 보류 가능)
- `team_members.jersey_number` = source-of-truth (팀별 영구 번호)
- `tournament_team_players.jerseyNumber` = **대회 시점 스냅샷** (영구 변경 시 historical 보존)
- **`match_player_jersey` 신설** = 매치 단위 임시 번호 override (현장 변경 대응)
- 우선순위: `match_player_jersey` (있으면) → `ttp.jerseyNumber` → `team_members.jersey_number`
- 다중 팀 = team_members 가 (team_id, user_id) 별 row → 팀별 다른 번호 자동

핵심 사유:
1. **현장 임시 번호** = 매치 단위 (옵션 B 의 대회 단위로는 부족)
2. **통계 historical 보존** = ttp 는 대회 시점 스냅샷 그대로 (옵션 B 와 동일)
3. **v1 영향** = 백엔드 우선순위 로직만 추가 (Flutter 코드 변경 0, 응답 스키마 유지)

---

## 1. AS-IS — 현재 3 컬럼 + 사용처

| 컬럼 | 위치 | 의미 | unique | 자동 sync |
|------|------|------|--------|----------|
| `user.default_jersey_number` | User | 본인 선호값 (메모) | — | ❌ |
| `team_members.jersey_number` | TeamMembers | 팀 멤버 시점 번호 | (team_id, jersey_number) | ❌ |
| `tournament_team_players.jerseyNumber` | TTP | 대회 시점 번호 | (tournament_team_id, jersey_number) | ❌ |

**보조 history 컬럼** (참조만, 변경 0):
- `team_join_requests.jersey_number` + `preferred_jersey_number` = 가입신청 history
- `team_member_history.jersey_number` = 팀 멤버 변경 이력

### 사용처 핵심

| 위치 | 어느 컬럼 읽음 | 함정 |
|------|--------------|------|
| `/api/web/profile/route.ts` | `user.default_jersey_number` rw | 메모만, 다른 컬럼 sync ❌ |
| `/api/web/tournaments/[id]/join/route.ts` | captain 검증 시 `user.default_jersey_number` 필수 + ttp INSERT 시 `jerseyNumber` 입력 | 둘 다 따로 |
| `/api/web/tournaments/[id]/teams/[teamId]/players/[playerId]` | ttp.jerseyNumber 직접 수정 | team_members sync ❌ |
| **`/api/v1/matches/[id]/stats`** (Flutter) | **`ttp.jerseyNumber` 직접** | PBP/box-score 통계 키 |
| **`/api/v1/players/[id]/stats`** (Flutter) | **`ttp.jerseyNumber` 직접** | 시즌통계 표시 |
| `/api/v1/matches/[id]/roster` | ttp.jerseyNumber | 라이브 코트 노출 |
| 마이페이지 / 팀 roster | team_members.jersey_number | 팀 페이지 |

### AS-IS 문제 (errors.md 5/2 + 5/5)

- 마이페이지 등번호 입력 = 메모만 (이도균 사례 — 본인 입력했지만 대회 출전 시 누락)
- 운영자 수동 fix 필요 (5/5 jersey UPDATE 4건 + 이도균 INSERT)
- 임시 번호 / 영구 변경 / 다중 팀 모두 명세 없음

---

## 2. TO-BE 옵션 3개 비교

| 차원 | 옵션 A: 단일 (`team_members` 만) | 옵션 B: Sync (B 권장) | 옵션 C: 매치별 override |
|------|------|------|------|
| `user.default_jersey_number` | ❌ 삭제 | ❌ 삭제 | ❌ 삭제 |
| `team_members.jersey_number` | ✅ 유일한 source | ✅ source (영구 번호) | ✅ source |
| `ttp.jerseyNumber` | ❌ 삭제 (조인으로 derive) | ✅ **시점 스냅샷** (자동 복사) | ✅ override (NULL = team_members 위임) |
| 매치별 (game-level) | ❌ 미지원 | ❌ 미지원 (ttp 단위) | ✅ `match_player_jersey` 테이블 신설 |
| 임시 번호 | ❌ 불가 | ttp 수동 변경 | match 단위 override |
| 영구 변경 (시즌 중) | team_members UPDATE → 과거 통계 ❌ 어긋남 | team_members + ttp 분리 → 과거 보존 ✅ | match 단위 추적 ✅ |
| 다중 팀 다른 번호 | ✅ (team_id 별 row) | ✅ (team_id 별 row) | ✅ |
| 마이그레이션 위험 | 🔴 높음 (ttp 컬럼 삭제 = v1 6 endpoints + PBP 영향) | 🟢 낮음 (컬럼 유지 + 의미 재정의) | 🟡 중 (테이블 신설 + v1 신규 join) |
| Flutter v1 영향 | 🔴 6 파일 + PBP 재구성 | 🟢 0 (스키마 유지) | 🟡 v1 stats 우선순위 로직 추가 |
| 작업 분량 | ~3d (DB 변경 + v1 재작성) | ~1d (UI hook + 검증) | ~2.5d (테이블 + UI + v1) |

### 옵션 별 시나리오 동작

**[시나리오 1] 임시 번호 (생활체육 — 빌려 입은 유니폼)**
- A: ❌ 불가 (team_members 영구 변경 → 과거 통계 어긋남)
- B: ttp.jerseyNumber 만 임시값으로 UPDATE → team_members 그대로 → 통계 = 그 경기는 임시값으로 박제 ✅
- C: match_player_jersey INSERT 1건 → ttp/team_members 둘 다 그대로 ✅ (가장 깨끗)

**[시나리오 2] 영구 변경 (시즌 중 #10 → #99)**
- A: team_members UPDATE → 과거 PBP/box-score 의 #10 = 깨짐 🔴
- B: team_members UPDATE + ttp 는 새 대회부터 #99 (기존 대회 ttp 는 그대로) → 과거 통계 보존 ✅
- C: B 와 동일

**[시나리오 3] 다중 팀 (선수가 A팀 #7 / B팀 #23)**
- A/B/C 모두: team_members 가 (team_id, user_id) 별 row → 팀별 다른 번호 자연 지원 ✅

---

## 3. 임시 번호 메커니즘 (옵션 C 기준 — 매치 단위 override)

생활체육 = 현장에서 갑작스러운 유니폼 변경. 매치 단위 대응 필수.

### 3-1. `match_player_jersey` 테이블 신설

```sql
CREATE TABLE match_player_jersey (
  id BIGSERIAL PRIMARY KEY,
  tournament_match_id BIGINT NOT NULL REFERENCES tournament_matches(id),
  tournament_team_player_id BIGINT NOT NULL REFERENCES tournament_team_players(id),
  jersey_number INT NOT NULL,
  reason VARCHAR(100),  -- 예: "유니폼 미지참 / 빌림"
  created_by_id BIGINT REFERENCES users(id),  -- 운영자/captain
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (tournament_match_id, tournament_team_player_id),
  UNIQUE (tournament_match_id, jersey_number)  -- 같은 매치 내 번호 충돌 방지
);
```

### 3-2. 우선순위 로직 (백엔드 read 시)

```
1. match_player_jersey (해당 매치 + 해당 ttp 가 있으면) → 최우선 (임시)
2. ttp.jerseyNumber → 대회 시점 스냅샷
3. team_members.jersey_number → 팀 영구 번호
```

### 3-3. UI 진입점

- **라이브 페이지 매치 진입 전**: 운영자/captain "임시 번호 변경" 버튼 → 모달 (선수 선택 + 새 번호 + 사유) → match_player_jersey INSERT
- **이미 진행 중인 매치**: 같은 모달 (단, PBP 진행 중 변경은 admin_logs warning)
- **본인 액션**: 권장 X (운영자/captain 권한)

### 3-4. 제약 및 가드

- `UNIQUE (tournament_match_id, jersey_number)` 로 같은 매치 내 번호 중복 차단
- 매치 종료 후 변경 = admin_logs warning + 사유 필수
- 영구 변경이 필요한 경우 = team_members.jersey_number UPDATE (다른 흐름)

### 3-5. 시나리오 동작 (옵션 C)

| 시나리오 | 동작 |
|---------|------|
| 평소 매치 (영구 번호 그대로) | match_player_jersey 0건 → ttp.jerseyNumber 사용 |
| 현장 임시 변경 (#10 → #99) | match_player_jersey INSERT (해당 매치만) → ttp/team_members 그대로 |
| 다음 매치 다시 #10 | 새 매치는 match_player_jersey 없음 → ttp.jerseyNumber=#10 자동 복귀 |
| 영구 변경 #10 → #99 | team_members UPDATE + 새 대회부터 ttp 새 번호 (과거 매치 통계 보존) |

---

## 4. Historical Jersey 보존 (통계 무결성)

**핵심 원칙**: PBP/box-score/시즌통계는 **그 경기 시점의 번호**를 보여줘야 함.

옵션 B 가 보존하는 방식:
- ttp = 대회 시작 시점 jersey **스냅샷** (영구 변경되어도 그대로)
- 다음 대회 = 새 ttp row → 새 jersey 반영
- 결과: 대회별 정확한 번호로 통계 표시

**위험 가드**:
- ttp.jerseyNumber UPDATE 는 **대회 시작 전** 까지만 허용 (운영자 권한)
- 대회 종료 후 ttp 변경 = 차단 (admin_logs 경고)
- → conventions.md 추가 필요

---

## 5. 마이그레이션 단계 (PR 분해, 옵션 C 기준)

| PR | 분량 | 위험도 | 내용 |
|----|------|------|------|
| **PR1** | 0.3d | 🟢 | UI 라벨 명확화 — 마이페이지 등번호 입력 옆에 "팀별 다른 번호 가능. 대회 출전 시 별도 등록" 안내. 사용자 혼란 즉시 차단. |
| **PR2** | 0.5d | 🟢 | join 시 default_jersey_number → team_members.jersey_number 자동 채우기 hook (NULL 인 경우만). 기존 데이터 영향 0. |
| **PR3** | 0.5d | 🟡 | tournament join 시 team_members → ttp 자동 복사 hook (대회 시점 스냅샷). team_members 변경되어도 기존 ttp 보존. |
| **PR4** | 1.0d | 🟡 | **`match_player_jersey` 테이블 신설** + Prisma migration (NULL 허용 ADD TABLE 무중단) + 라이브 페이지 임시 번호 입력 UI (운영자/captain 모달) + admin_logs 박제. |
| **PR5** | 0.5d | 🟡 | v1 6 endpoints 우선순위 로직 적용 — `match_player_jersey` (있으면) → `ttp.jerseyNumber` → `team_members.jersey_number`. 백엔드만 변경, 응답 스키마 그대로 → Flutter 앱 변경 0. **원영 의미 변경 공지** (코드 변경 X). |
| **PR6** | 0.3d | 🟡 | ttp.jerseyNumber UPDATE 가드 (대회 시작 후 변경 차단). conventions.md + admin_logs 경고. |
| **PR7** | 0.5d | 🔴 | `user.default_jersey_number` 삭제 — 모든 사용처 team_members 로 치환. DB column DROP (운영 영향 ⚠ 사용자 명시 승인 필수). 보류 가능 (메모 유지해도 무해). |

총 ~3.6d. **PR1~5 가 핵심** (~2.8d). PR6 가드 + PR7 column DROP 은 옵션.

### 운영 DB 영향 평가

- **PR4 ADD TABLE**: NULL 허용 신규 테이블 = 무중단 ✅
- **PR5 백엔드 우선순위 로직**: 응답 스키마 유지 = 무중단 ✅
- **PR7 DROP COLUMN**: ⚠ destructive — 사용자 명시 승인 + 사용처 0 검증 필수

---

## 6. Flutter v1 영향 (옵션 C 기준)

| 파일 | 사용 | 옵션 C 영향 |
|------|------|----------|
| `v1/matches/[id]/stats/route.ts` | ttp.jerseyNumber | 🟡 우선순위 로직 1줄 (match_player_jersey 조인) |
| `v1/players/[id]/stats/route.ts` | ttp.jerseyNumber | 🟡 동일 (선수 시즌통계 표시 정확성) |
| `v1/matches/[id]/roster/route.ts` | ttp.jerseyNumber | 🟡 동일 (라이브 코트 노출 — 가장 중요) |
| `v1/tournaments/[id]/teams/[teamId]/players/route.ts` | ttp.jerseyNumber | 🟡 동일 |
| `v1/tournaments/[id]/player-stats/route.ts` | ttp.jerseyNumber | 🟡 동일 |
| `v1/tournaments/[id]/full-data/route.ts` | ttp.jerseyNumber | 🟡 동일 |

**옵션 C 의 v1 영향**:
- **응답 스키마 = 유지** (jerseyNumber 필드 그대로) → Flutter 앱 코드 변경 **0**
- **백엔드 SELECT 로직 = 6 파일 우선순위 코드 추가** (~30줄/파일, helper 1개로 공유 가능)
- **의미 변화** = "그 매치 시점의 jersey" → 더 정확. 운영자/선수 인지에 도움.

→ **원영(앱 담당) 공지**: jerseyNumber 의미 변경 통보 (코드 변경 X). 박제 후 통보로 충분.

### 우선순위 helper 설계 (PR5)

```ts
// src/lib/jersey/resolve.ts (신규)
export async function resolveMatchJersey(
  matchId: bigint,
  ttpId: bigint,
  fallbackTtpJersey: number | null,
  fallbackTeamJersey: number | null
): Promise<number | null> {
  const override = await prisma.matchPlayerJersey.findUnique({
    where: { tournamentMatchId_tournamentTeamPlayerId: { tournamentMatchId: matchId, tournamentTeamPlayerId: ttpId } },
    select: { jersey_number: true },
  });
  return override?.jersey_number ?? fallbackTtpJersey ?? fallbackTeamJersey ?? null;
}
```

v1 6 파일에서 SELECT 후 위 helper 통과 → 응답 jerseyNumber 결정.

---

## 7. 권장 옵션 + 핵심 trade-off

### 권장 = 옵션 C (매치별 override)

**핵심 사유 3가지**:
1. **현장 임시 번호 대응**: 매치 단위 override → 갑작스러운 유니폼 변경 즉시 반영
2. **통계 historical 보존**: ttp = 대회 시점 스냅샷 (옵션 B 와 동일) + match_player_jersey = 매치 시점 스냅샷
3. **Flutter 앱 변경 0**: 백엔드 우선순위 로직만 추가, 응답 스키마 유지

### Trade-off

| 얻는 것 | 잃는 것 |
|---------|--------|
| 매치 단위 임시 번호 (현장 대응) | v1 6 파일 우선순위 로직 추가 (~30줄 × 6 = helper 공유) |
| 통계 historical 3 계층 보존 | 운영자가 3 컬럼 시야 (team_members / ttp / override) — 문서/UI 보완 |
| 영구 변경 vs 임시 변경 명확 분리 | match_player_jersey 신규 테이블 = 운영자 학습 곡선 |
| 다중 팀 다른 번호 자동 | 옵션 B 보다 +1.5d (~3.6d 전체) |

### 사용자 결정 필요 항목 (Y/N)

| # | 항목 | 추천 |
|---|------|------|
| 1 | 옵션 C 채택 (매치별 override) | **Y** |
| 2 | match_player_jersey 테이블 신설 (PR4) | **Y** (옵션 C 핵심) |
| 3 | 임시 번호 입력 권한 = 운영자 + captain (본인 X) | **Y** (오용 방지) |
| 4 | PR1~5 우선 진행 (PR6 가드 + PR7 default_jersey_number DROP 보류) | **Y** |
| 5 | ttp 변경 가드 (PR6, 대회 시작 후 차단) 추가 | **Y** (통계 무결성) |
| 6 | PR7 (`user.default_jersey_number` 컬럼 DROP) 진행 | **N** (컬럼 유지 + 메모만 — 무해) |
| 7 | 라이브 페이지 임시 번호 변경 UI 위치 = 매치 카드 우측 "⚙ 임시 번호" 버튼 (운영자 view 만 노출) | **Y** |
