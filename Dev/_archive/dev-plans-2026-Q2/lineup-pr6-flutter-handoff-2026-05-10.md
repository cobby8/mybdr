# 사전 라인업 자동 매핑 — PR6 Flutter 클라 핸드오프

> 작성일: 2026-05-10 / 작성자: doc-writer (수빈 측 박제) / 담당자: **원영** (Flutter 앱 / `bdr_stat_temp`)
> 선행 PR (web): PR1~PR5 ✅ (수빈 박제, 미푸시 검증 대기)
> 본 문서 범위: PR6 (Flutter `starter_select_screen.dart` 자동 매핑)
> Self-contained — 본 문서 1건만 보고 PR6 작업 가능

---

## §1 배경 / 목적

### 1.1 사전 라인업 도메인 도입 배경

기록원이 매치 시작 시점 (`/match/{id}/starter-select`) 에 16명+ ttp 명단에서:
1. 출전 선수 체크 (전체선택 버튼 사용)
2. 주전 5명 토글
3. 경기 룰 (쿼터 / 타임아웃 / 색상) 설정
4. "경기 시작" 클릭

**문제**: 매치 직전 5분 내 1인 기록원이 양 팀 합계 ~30 항목 수동 클릭. 익숙치 않은 팀명/등번호 → 오기록 발생 가능. 팀장은 명단을 사전에 확정해뒀지만 기록원에게 전달 채널 0.

### 1.2 기존 흐름 한계

```dart
// 현재 starter_select_screen.dart _loadData() 핵심
final homeStarterIds = homePlayers
  .where((p) => p.isStarter)  // ttp.isStarter = "대회 통산" 의미
  .take(5)                     // 5명까지 hardcoded
  .map((p) => p.id)
  .toSet();
```

- `ttp.isStarter` 는 **대회 통산 starter** 를 뜻함 (TournamentTeamPlayer 도메인 영구 의미)
- `take(5)` = 매치별 라인업 정보 부재 → 단순 5명 자르기
- 팀장이 매치 전 확정한 라인업을 반영 0 — 기록원이 매번 수동 변경

### 1.3 PR6 목표

Flutter 가 사전 라인업 응답을 받아 **자동 매핑 + 기록원 변경 자유** (Q5=C 결재).
- 사전 라인업 입력 매치 → 자동 채움 (기록원 클릭 0 시작)
- 미입력 매치 → 기존 흐름 (`ttp.isStarter` take(5)) 그대로 — 회귀 0

---

## §2 web 측 박제 현황 (PR1~PR5)

### 2.1 DB 모델 — `MatchLineupConfirmed` (PR1)

`prisma/schema.prisma` line 3242 박제. 매치당 home/away 각 1건 (UNIQUE 가드).

| 컬럼 | 타입 | 의미 |
|------|------|------|
| `id` | BigInt | PK |
| `matchId` | BigInt | TournamentMatch.id FK |
| `teamSide` | "home" / "away" | UNIQUE(matchId, teamSide) |
| `starters` | BigInt[] | 주전 ttp.id 5건 (Q6=A 강제) |
| `substitutes` | BigInt[] | 출전 가능 후보 ttp.id (5명 외 — 가변, 0건 허용) |
| `confirmedById` | BigInt | 입력자 user.id (팀장 / 운영자 대리) |
| `confirmedAt` | DateTime | 입력 시각 |
| `updatedAt` | DateTime | 재입력 추적 |

**도메인 룰**:
- `starters ⊆ active` (출전 = starters ∪ substitutes)
- `starters` 정확히 5건 (API/UI 모두 검증)
- 부분 입력 허용 (home 만 입력 / away 미입력 → home row 만 생성)

### 2.2 web API endpoints (PR2)

`/api/web/tournaments/[id]/matches/[matchId]/lineup`:

| Method | 동작 |
|--------|------|
| `GET` | 매치 + 양 팀 ttp + 기존 라인업 + canEdit (권한) |
| `POST` | 라인업 입력/재입력 (upsert) |
| `DELETE` | 라인업 해제 (자동 채움 fallback 복귀) |

**권한 (resolveLineupAuth)**:
- admin 3종 (super_admin / organizer / tournamentAdminMember) → 양쪽
- team.captain / team.manager → 해당 측만
- 그 외 → 403

### 2.3 팀장 UI `/lineup-confirm/[matchId]` (PR3)

사용자 결정 2건 반영:
- **단일 토글 버튼** — "전체 출전 선택" 라벨 자동 변경 (해제 시 자동 starters 비움)
- **상대팀 영역 미노출** — 팀장 본인 측만 표시 (admin 도 home 통일)

디자인 13 룰 100% 준수 (color-* 토큰 / Material Symbols / 44px 터치).

### 2.4 PR5 roster API 확장 — **신규 응답 필드 2개** (Flutter 핵심)

`src/app/api/v1/matches/[id]/roster/route.ts` 응답에 `home_lineup_confirmed` / `away_lineup_confirmed` 추가.
기존 키 (`home_players` / `away_players`) 변경 0 → **Flutter v1 호환 (회귀 0)**.

---

## §3 PR6 작업 명세 — Flutter 클라 변경

### 3.1 대상 파일 (예상)

원영이 정확한 경로 확인 후 적용:

| 파일 | 변경 내용 | 추정 라인 |
|------|----------|----------|
| `bdr_stat_temp/lib/presentation/screens/match/starter_select_screen.dart` 또는 비슷 | `_loadData()` 함수 분기 추가 | +30L |
| `bdr_stat_temp/lib/data/api/api_client.dart` 또는 응답 모델 | `home_lineup_confirmed` / `away_lineup_confirmed` 모델 매핑 | +20L |

### 3.2 변경 흐름 — dart 코드

#### AS-IS (현재)

```dart
// starter_select_screen.dart _loadData()
final response = await apiClient.getMatchRoster(matchId);
final homePlayers = response.homePlayers;
final awayPlayers = response.awayPlayers;

// 주전 5명 추출 — ttp.isStarter 기반 take(5)
final homeStarterIds = homePlayers
  .where((p) => p.isStarter)
  .take(5)
  .map((p) => p.id)
  .toSet();

final awayStarterIds = awayPlayers
  .where((p) => p.isStarter)
  .take(5)
  .map((p) => p.id)
  .toSet();

// 출전 명단 = 빈 set (사용자가 수동 토글)
final homeActiveIds = <int>{};
final awayActiveIds = <int>{};
```

#### TO-BE (PR6)

```dart
// starter_select_screen.dart _loadData()
final response = await apiClient.getMatchRoster(matchId);
final homePlayers = response.homePlayers;
final awayPlayers = response.awayPlayers;

// 신규: 사전 라인업 응답 필드 2개
final homeLineup = response.data['home_lineup_confirmed']; // null 가능
final awayLineup = response.data['away_lineup_confirmed']; // null 가능

// home 분기
final homeStarterIds = homeLineup != null
  ? Set<int>.from(
      (homeLineup['starter_ttp_ids'] as List).map((s) => int.parse(s as String)),
    )
  : homePlayers.where((p) => p.isStarter).take(5).map((p) => p.id).toSet();

final homeActiveIds = homeLineup != null
  ? Set<int>.from(
      (homeLineup['active_ttp_ids'] as List).map((s) => int.parse(s as String)),
    )
  : <int>{};  // 라인업 미입력 시 빈 Set (기존 흐름 유지)

// away 분기 (동일 패턴)
final awayStarterIds = awayLineup != null
  ? Set<int>.from(
      (awayLineup['starter_ttp_ids'] as List).map((s) => int.parse(s as String)),
    )
  : awayPlayers.where((p) => p.isStarter).take(5).map((p) => p.id).toSet();

final awayActiveIds = awayLineup != null
  ? Set<int>.from(
      (awayLineup['active_ttp_ids'] as List).map((s) => int.parse(s as String)),
    )
  : <int>{};

// (선택) UI 안내 — 사전 라인업 적용 여부 표시
final homeFromLineup = homeLineup != null;
final awayFromLineup = awayLineup != null;
```

### 3.3 핵심 변환 포인트

| 변환 | 사유 |
|------|------|
| `int.parse(s as String)` | 응답이 **string ttp_id** (BigInt 직렬화 룰). dart 에서 int 변환 필요 |
| `Set<int>.from(...)` | 기존 set 자료구조와 호환 (UI 토글 그대로 작동) |
| `homeLineup != null` 분기 | null = 미입력 → 기존 흐름 fallback (회귀 0) |
| `active_ttp_ids` 와 `starter_ttp_ids` 둘 다 채움 | 기록원이 출전/주전 모두 즉시 시각화 가능 |

---

## §4 신규 응답 필드 명세 (필수 — dart 모델 작성용)

### 4.1 응답 형식

`GET /api/v1/matches/[id]/roster` 응답:

```json
{
  "success": true,
  "data": {
    "home_players": [
      { "id": 3001, "name": "김수빈", "jersey_number": 7, "is_starter": false, "position": "PG" }
    ],
    "away_players": [],
    "home_lineup_confirmed": {
      "active_ttp_ids": ["3001", "3002", "3003", "3004", "3005", "3006"],
      "starter_ttp_ids": ["3001", "3002", "3003", "3004", "3005"],
      "confirmed_at": "2026-05-10T12:30:00.000Z"
    },
    "away_lineup_confirmed": null
  }
}
```

### 4.2 필드 명세표

| 키 | 타입 | 의미 |
|----|------|------|
| `active_ttp_ids` | `List<String>` | 출전 명단 ttp.id (주전 5 + 후보 N 합집합) / 정렬됨 |
| `starter_ttp_ids` | `List<String>` | 주전 ttp.id 5건 (Q6=A 강제) / 정렬됨 |
| `confirmed_at` | `String` (ISO 8601) | 팀장이 확정 저장한 시각 |
| 응답 = `null` | — | 라인업 미입력 매치 (기존 흐름 fallback 트리거) |

### 4.3 주의사항

- **id 는 string** — BigInt 직렬화 룰 (`apiSuccess()` 자동 변환). dart 에서 `int.parse()` 필수
- **정렬 순서** = ttp.id 오름차순 (응답 안정성 / Flutter Set 사용 시 영향 0 이지만 박제 가치)
- **v1 앱 호환** — 신규 키 무시 → 기존 흐름 (`ttp.isStarter` take(5)) → 회귀 0
- **active ⊇ starter 보장** — 서버 단 (POST API zod 검증) 에서 이미 보장 → 클라는 신뢰 가능

### 4.4 dart 모델 매핑 예시

```dart
// data/models/match_lineup_confirmed.dart 신규
class MatchLineupConfirmed {
  final Set<int> activeTtpIds;
  final Set<int> starterTtpIds;
  final DateTime confirmedAt;

  MatchLineupConfirmed({
    required this.activeTtpIds,
    required this.starterTtpIds,
    required this.confirmedAt,
  });

  factory MatchLineupConfirmed.fromJson(Map<String, dynamic> json) {
    return MatchLineupConfirmed(
      activeTtpIds: Set<int>.from(
        (json['active_ttp_ids'] as List).map((s) => int.parse(s as String)),
      ),
      starterTtpIds: Set<int>.from(
        (json['starter_ttp_ids'] as List).map((s) => int.parse(s as String)),
      ),
      confirmedAt: DateTime.parse(json['confirmed_at'] as String),
    );
  }
}
```

---

## §5 자동 매핑 적용 정책 (Q5=C 결재)

### 5.1 정책 — C 채택 (자동 채움 + 변경 자유)

| 옵션 | 동작 | 채택 |
|------|------|------|
| A — 즉시 자동 적용 (강제) | 기록원 클릭 0, "이미 확정됨" 표시 | ❌ |
| B — 운영자 검토 후 "적용" 버튼 | 검토 가능, 수동 트리거 | ❌ |
| **C — 자동 채움 + 기록원 변경 자유** | 자동 채움 + 토글 자유 | ✅ |

### 5.2 사유

- **현장 변동 대응** — 부상 / 지각 / 컨디션 난조 등 매치 직전 변경 빈번
- **사전 입력 가치 보존** — 자동 채움 = 클릭 N → 0 효과
- **기록원 책임 유지** — 최종 라인업 = 기록원 시작 시점 확정 (도메인 단일 source)

### 5.3 UI 권장사항 (선택)

```dart
// "사전 라인업 적용됨" 안내 배지
if (homeFromLineup) {
  // 예: home 팀 헤더 옆에 작은 라벨
  // "팀장 사전 라인업 적용 — 변경 가능"
  // 출처 인지 + 기록원 변경 자유 시그널
}
```

UX 효과:
- 기록원이 "왜 이 5명이 자동으로 채워졌지?" 의문 해소
- 사전 입력자가 누구인지 (팀장 vs 운영자) 추적 시 추가 표시 가능 (선택)

---

## §6 검증 시나리오

### 6.1 핵심 시나리오 5종

| # | 시나리오 | 예상 결과 |
|---|---------|---------|
| 1 | 라인업 미입력 매치 진입 | 기존 흐름 (`ttp.isStarter` take(5)) — 회귀 0 |
| 2 | home 만 입력 매치 진입 | home = 사전 라인업 starter 5명 / away = 기존 흐름 (take(5)) |
| 3 | 양 팀 입력 매치 진입 | 양쪽 사전 라인업 starter 5명 자동 채움 |
| 4 | 사전 라인업 적용 후 기록원 수정 | 자유 (강제 잠금 X) — 토글 정상 작동 |
| 5 | starter_ttp_ids 와 active_ttp_ids 도메인 검증 | starter ⊆ active (서버 단 검증 통과 확인) |

### 6.2 edge case

| # | 시나리오 | 예상 결과 |
|---|---------|---------|
| 6 | 응답 `confirmed_at` 파싱 실패 | try/catch 또는 fallback (예외 시 미입력 취급) |
| 7 | `active_ttp_ids` 가 빈 배열 | starter_ttp_ids 만 사용 / active = 빈 Set |
| 8 | starter_ttp_ids 길이 ≠ 5 | 서버 단 검증 통과 0 (방어적: take(5) fallback 또는 경고 로그) |
| 9 | 사전 라인업 ttp.id 가 현재 roster 에 없음 | 무시 (서버는 매치 시점 ttp 그대로 보냄 → 정합 보장됨) |

### 6.3 회귀 테스트

| # | 항목 | 예상 |
|---|------|------|
| R1 | v1 앱 (배포 중인 구버전) → roster 호출 | 신규 필드 무시 / 기존 흐름 100% 보존 |
| R2 | 사전 라인업 미입력 매치 (현재 운영 중 거의 모든 매치) | 기존 흐름 유지 — 사용자 영향 0 |
| R3 | 매치 종료 후 stats 동기화 | 변경 0 (라인업 = 시작 시점만 영향, 종료 후 무관) |
| R4 | 다른 v1 API (`/api/v1/...`) | 변경 0 (PR5 은 roster 단일 라우트 추가) |

---

## §7 Flutter v1 호환 보장

### 7.1 점진 마이그 정책

| 앱 버전 | roster 응답 처리 | 동작 |
|--------|--------------|------|
| **v1** (현재 배포) | 신규 필드 무시 | 기존 흐름 (`ttp.isStarter` take(5)) — 회귀 0 |
| **v2** (PR6 배포 후) | 사전 라인업 우선 | 자동 채움 + 변경 자유 |

### 7.2 서버 측 호환 보장

- roster 응답 = 기존 키 (`home_players` / `away_players`) 그대로
- 신규 키 (`home_lineup_confirmed` / `away_lineup_confirmed`) 추가만
- 미입력 매치 = `null` → v1/v2 모두 안전

### 7.3 강제 업데이트 0

- v1 앱 = 기능 제한 0 (사전 라인업 효과만 안 받음)
- v2 앱 = 자동 매핑 효과
- → 운영자에게 v2 앱 업데이트 권장 안내 (앱스토어 / 플레이스토어 경유)

---

## §8 후속 영역 (PR6 외 — 수빈 담당)

본 PR6 와 병행 또는 선후 진행 (모두 web only / Flutter 영향 0):

| PR | 작업 | 담당 | 의존 |
|----|------|------|------|
| **PR4** | Vercel Cron 5분 폴링 — 시작 1h 전 푸시 (`/api/cron/match-lineup-reminder`) | 수빈 | PR2 |
| **PR7** | `createNotificationBulk` 푸시 알림 통합 + deep-link `/lineup-confirm/[matchId]` | 수빈 | PR4 |
| 진입 링크 | 매치 페이지 → `/lineup-confirm/[matchId]` 진입 버튼 (팀장용) | 수빈 | PR3 |

PR6 (Flutter) 는 PR4/PR7 진행과 무관 — 독립 진행 가능.

---

## §9 질문 / 결정 대기

원영이 PR6 진입 시 막히는 항목 발견 시 본 섹션에 추가 + 수빈에게 회신.

(현재 비어있음 — 작업 시작 후 갱신)

---

## 부록 A — 참조 파일

| 파일 | 역할 |
|------|------|
| `Dev/match-lineup-confirmation-2026-05-09.md` | 전체 도메인 기획서 (Q1~Q9 결재) — §6 "기록앱 자동 매핑" 참조 |
| `prisma/schema.prisma` line 3242 | `MatchLineupConfirmed` 모델 |
| `src/app/api/v1/matches/[id]/roster/route.ts` | PR5 변경 후 — 본 문서 §4 응답 명세의 source |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/lineup/route.ts` | web 측 입력 API (POST/GET/DELETE) — Flutter 영향 0 (참조용) |
| `src/lib/auth/match-lineup.ts` | 권한 헬퍼 (`resolveLineupAuth` / `getLineupCanEdit`) — Flutter 영향 0 (참조용) |
| `src/app/(web)/lineup-confirm/[matchId]/` | 팀장 UI (PR3) — Flutter 영향 0 (참조용) |

## 부록 B — 결재 요약 (PR6 관련만)

| Q | 항목 | 결재 | PR6 영향 |
|---|------|------|---------|
| Q1 | 데이터 모델 | A (신규 테이블) | 응답 필드 2개로 전달 |
| Q4 | 자동 매핑 방식 | A (roster 응답 확장) | **본 PR6 핵심** |
| Q5 | 자동 매핑 적용 정책 | C (자동 채움 + 변경 자유) | UI 강제 잠금 X |
| Q6 | 주전 5명 정책 | A (강제) | starter_ttp_ids 길이 = 5 신뢰 가능 |
| Q7 | 양 팀 미입력 시 | A (기록원 수동 fallback) | null 분기 = 기존 흐름 |

---

**END.** PR6 진입 시 본 문서 §3 (dart 코드) + §4 (응답 명세) + §6 (검증) 우선 참조.
