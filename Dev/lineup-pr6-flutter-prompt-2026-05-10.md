# 사전 라인업 자동 매핑 — PR6 Flutter AI 프롬프트

> 작성일: 2026-05-10 / 작성자: doc-writer (수빈 본인용)
> 용도: **사용자 본인이 Flutter repo 의 별도 AI (Claude Code 또는 다른 AI) 에 붙여넣을 self-contained 프롬프트**
> 차이점: `Dev/lineup-pr6-flutter-handoff-2026-05-10.md` = 사람 (원영) 용 핸드오프 / 본 문서 = AI 용 프롬프트
> 선행 PR (web): PR1~PR5 ✅ (수빈 박제, 미푸시 검증 대기)

---

## §1 사용 가이드 (수빈 본인이 읽는 부분)

### 1.1 본 문서의 목적

수빈 본인이 Flutter repo 측 PR6 작업을 **본인이 직접 / 또는 별도 AI 인스턴스에게 위임** 하기로 결정. 본 문서 §2 "프롬프트 본문" 을 통째로 복사해서 Flutter repo 의 Claude Code 또는 다른 AI 채팅에 붙여넣으면 작업 가능하도록 self-contained 로 작성됨.

### 1.2 사용 방법

1. **§2 프롬프트 본문 코드 블록 전체** (`PROMPT_START` ~ `PROMPT_END` 사이) 를 통째로 copy
2. Flutter repo 의 AI (Claude Code / Cursor / 다른 채팅) 에 paste
3. AI 가 작업 후 보고 → §6 검증 시나리오 13건 따라 수동 검증
4. 막히는 부분 발생 시 §3~§7 부록 참조

### 1.3 주의사항

- AI 는 mybdr web repo 의 어떤 정보도 자동으로 알 수 없음 → 프롬프트 본문 안에 모든 컨텍스트 포함됨
- Flutter repo 의 dart 파일 정확 경로는 AI 가 grep 으로 직접 확인하도록 명시됨
- 응답 필드 신규 키 무시해도 회귀 0 보장 (서버 PR5 호환 룰)

### 1.4 작업 후 사용자 본인 확인 사항

- Flutter repo 위치 / 브랜치 (`bdr_stat_temp` 추정)
- 변경 후 빌드 + 시뮬레이터 검증
- v2 앱 배포 (TestFlight / Play Console) — 기존 v1 사용자 점진 마이그
- 운영 매치 1건 실제 사전 라인업 입력 → 시뮬레이터에서 자동 채움 확인

---

## §2 프롬프트 본문 (그대로 copy / paste)

```text
PROMPT_START
========================================
[작업 개요 — Flutter PR6: 사전 라인업 자동 매핑]
========================================

매치 시작 1시간 전 팀장이 사전 라인업을 확정한 데이터를 Flutter 기록앱이
매치 시작 시점 (`starter_select_screen.dart` 진입 시) 자동으로 받아 출전선수 / 주전선수 기본값으로 사용한다.

서버 측 (mybdr web repo) PR1~PR5 박제 완료. Flutter 측 (PR6) 만 남음.
본 PR6 = `_loadData()` 함수에 사전 라인업 응답 분기 추가 (~30L) + 모델 매핑 (~20L).


========================================
[변경 대상 파일 — repo 내에서 grep 으로 정확 경로 확인]
========================================

다음 명령으로 정확 경로 확인:
  grep -rn "getMatchRoster\|home_players" lib/

예상 파일:
1. lib/presentation/screens/match/starter_select_screen.dart (또는 비슷한 이름)
   - `_loadData()` 함수 변경
2. lib/data/api/api_client.dart 또는 응답 모델
   - 신규 응답 필드 2개 (`home_lineup_confirmed` / `away_lineup_confirmed`) 매핑


========================================
[현재 흐름 (AS-IS)]
========================================

1. Flutter 매치 진입 → `getMatchRoster(matchId)` 1회 호출
2. 응답: `{ home_players: [{id, name, jersey_number, is_starter, position}], away_players: [...] }`
3. `is_starter=true` 인 ttp 만 take(5) 로 `_homeStarters` set 채움
4. 사용자(기록원)가 출전 / 주전 수동 클릭

핵심 코드:
```
final homeStarterIds = homePlayers
  .where((p) => p.isStarter)  // ttp.isStarter = "대회 통산" 의미
  .take(5)
  .map((p) => p.id)
  .toSet();
final homeActiveIds = <int>{};  // 사용자 수동 토글
```


========================================
[변경 흐름 (TO-BE)]
========================================

1. roster 응답에 신규 필드 `home_lineup_confirmed` / `away_lineup_confirmed` 추가됨 (서버 PR5)
2. null = 라인업 미입력 → 기존 흐름 fallback (회귀 0)
3. 객체 = 사전 라인업 우선 → `starter_ttp_ids` 5명 + `active_ttp_ids` 합집합 사용

핵심 코드 (TO-BE):
```dart
final response = await apiClient.getMatchRoster(matchId);
final homePlayers = response.homePlayers;
final awayPlayers = response.awayPlayers;

// 신규: 사전 라인업 응답 필드 2개 (null 가능)
final homeLineup = response.data['home_lineup_confirmed'];
final awayLineup = response.data['away_lineup_confirmed'];

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
  : <int>{};

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

// (선택) UI 안내용 플래그
final homeFromLineup = homeLineup != null;
final awayFromLineup = awayLineup != null;
```


========================================
[신규 응답 필드 명세]
========================================

`GET /api/v1/matches/[id]/roster` 응답 형식:
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

필드 명세:
| 키 | 타입 | 의미 |
|----|------|------|
| `active_ttp_ids` | `List<String>` | 출전 명단 ttp.id (주전 5 + 후보 N 합집합) / 정렬됨 |
| `starter_ttp_ids` | `List<String>` | 주전 ttp.id 5건 강제 / 정렬됨 |
| `confirmed_at` | `String` (ISO 8601) | 팀장이 확정 저장한 시각 |
| 응답 = `null` | — | 라인업 미입력 매치 (기존 흐름 fallback 트리거) |

[중요] id 들은 모두 string (BigInt 직렬화 룰). dart 에서 `int.parse()` 변환 필수.


========================================
[적용 정책 (Q5=C 결재)]
========================================

- **자동 채움 + 변경 자유** — UI 강제 잠금 X
- 기록원이 사전 라인업 받은 후에도 토글 자유 수정 가능
- "사전 라인업 적용됨" 안내 표시 권장 (UX — 출처 인지)

사유:
- 현장 변동 대응 (부상 / 지각 / 컨디션)
- 사전 입력 가치 보존 (자동 채움 = 클릭 N → 0 효과)
- 기록원 책임 유지 (최종 라인업 = 시작 시점 확정)


========================================
[회귀 보장 룰]
========================================

1. 라인업 미입력 매치 = 기존 흐름 (`ttp.isStarter` take(5)) 그대로 — 회귀 0
2. 응답 신규 필드 무시해도 기존 코드 깨지지 않음
3. `starters ⊆ active` 는 서버 단 검증됨 (POST API zod) — 클라는 신뢰 가능
4. 응답 키 변경 0 — `home_players` / `away_players` 기존 그대로


========================================
[검증 시나리오 5건 (필수)]
========================================

1. 라인업 미입력 매치 진입 → 기존 흐름 정상 (회귀 0)
2. home 만 입력 매치 → home = 사전 starter 5 / away = 기존 흐름
3. 양 팀 입력 매치 → 양쪽 사전 라인업 자동 채움
4. 사전 라인업 적용 후 기록원이 출전 / 주전 수정 → 자유 (강제 잠금 X)
5. (선택) "사전 라인업 적용됨" UI 안내 표시


========================================
[제약 — 변경 금지]
========================================

- API 응답 키 변경 X (서버 PR5 가 Flutter v1 호환 보장)
- 권한 가드 변경 X (`requireRecorder` 그대로)
- 신규 endpoint 추가 X (roster API 응답 확장만 사용)
- DB schema 변경 X (Flutter repo 는 DB 직접 접근 0)


========================================
[작업 후 보고 형식]
========================================

1. 변경 파일 + 라인 수
2. 검증 시나리오 5건 통과 여부
3. dart 분석 / lint 결과 (`flutter analyze`)
4. 빌드 + 시뮬레이터 테스트 결과
5. 발견한 함정 / 추가 사항


========================================
[자주 막히는 함정]
========================================

1. id 가 string (BigInt 직렬화 룰) — `int.parse()` 안 하면 type error
2. null 분기 누락 — 라인업 미입력 매치에서 NPE
3. Set 중복 처리 — `Set<int>.from(List<int>)` 시 중복 자동 제거 (정상)
4. active vs starter 혼동 — active = 출전 명단 / starter = 주전 5명 / starter ⊆ active
5. confirmed_at 파싱 — ISO 8601 (Z 포함) → `DateTime.parse()` OK


PROMPT_END
```

---

## §3 부록 — Web 측 박제 현황

### 3.1 DB 모델 — `MatchLineupConfirmed` (PR1)

`prisma/schema.prisma` line 3242. 매치당 home/away 각 1건.

| 컬럼 | 타입 | 의미 |
|------|------|------|
| `id` | BigInt | PK |
| `matchId` | BigInt | TournamentMatch.id FK |
| `teamSide` | "home" / "away" | UNIQUE(matchId, teamSide) |
| `starters` | BigInt[] | 주전 ttp.id 5건 (Q6=A 강제) |
| `substitutes` | BigInt[] | 후보 ttp.id (가변, 0건 허용) |
| `confirmedById` | BigInt | 입력자 user.id |
| `confirmedAt` | DateTime | 입력 시각 |
| `updatedAt` | DateTime | 재입력 추적 |

### 3.2 web API endpoints (PR2)

`/api/web/tournaments/[id]/matches/[matchId]/lineup`:

| Method | 동작 |
|--------|------|
| `GET` | 매치 + 양 팀 ttp + 기존 라인업 + canEdit |
| `POST` | 라인업 입력 / 재입력 (upsert) |
| `DELETE` | 라인업 해제 (자동 채움 fallback 복귀) |

권한 (`resolveLineupAuth`):
- admin 3종 (super_admin / organizer / tournamentAdminMember) → 양쪽
- team.captain / team.manager → 해당 측만
- 그 외 → 403

**Flutter 영향 0** — 본 endpoint 는 web 팀장 UI 전용.

### 3.3 팀장 UI `/lineup-confirm/[matchId]` (PR3)

사용자 결정 2건 반영:
- **단일 토글 버튼** — "전체 출전 선택" 라벨 자동 변경 (해제 시 자동 starters 비움)
- **상대팀 영역 미노출** — 팀장 본인 측만 표시 (admin 도 home 통일)

**Flutter 영향 0** — 본 UI 는 web 팀장 전용.

### 3.4 PR5 roster API 확장 — Flutter PR6 의 핵심 의존

`src/app/api/v1/matches/[id]/roster/route.ts` 응답에 `home_lineup_confirmed` / `away_lineup_confirmed` 추가됨.
- 기존 키 (`home_players` / `away_players`) 변경 0
- 신규 키 추가만 → Flutter v1 호환 (회귀 0)

---

## §4 응답 예시 — 시나리오별

### 4.1 시나리오 A — 라인업 미입력 (운영 중 거의 모든 매치)

```json
{
  "success": true,
  "data": {
    "home_players": [
      { "id": 3001, "name": "김수빈", "jersey_number": 7, "is_starter": true, "position": "PG" }
    ],
    "away_players": [
      { "id": 4001, "name": "이원영", "jersey_number": 23, "is_starter": false, "position": "SF" }
    ],
    "home_lineup_confirmed": null,
    "away_lineup_confirmed": null
  }
}
```

→ Flutter: 기존 흐름 100% 유지 (`ttp.isStarter` take(5))

### 4.2 시나리오 B — home 만 입력

```json
{
  "success": true,
  "data": {
    "home_players": [/* 8명 */],
    "away_players": [/* 8명 */],
    "home_lineup_confirmed": {
      "active_ttp_ids": ["3001", "3002", "3003", "3004", "3005", "3006", "3007"],
      "starter_ttp_ids": ["3001", "3002", "3003", "3004", "3005"],
      "confirmed_at": "2026-05-10T12:30:00.000Z"
    },
    "away_lineup_confirmed": null
  }
}
```

→ Flutter: home 사전 라인업 적용 / away 기존 흐름

### 4.3 시나리오 C — 양 팀 입력

```json
{
  "success": true,
  "data": {
    "home_players": [/* 8명 */],
    "away_players": [/* 8명 */],
    "home_lineup_confirmed": {
      "active_ttp_ids": ["3001", "3002", "3003", "3004", "3005", "3006"],
      "starter_ttp_ids": ["3001", "3002", "3003", "3004", "3005"],
      "confirmed_at": "2026-05-10T12:30:00.000Z"
    },
    "away_lineup_confirmed": {
      "active_ttp_ids": ["4001", "4002", "4003", "4004", "4005", "4006", "4007"],
      "starter_ttp_ids": ["4001", "4002", "4003", "4004", "4005"],
      "confirmed_at": "2026-05-10T12:35:00.000Z"
    }
  }
}
```

→ Flutter: 양쪽 사전 라인업 자동 채움

---

## §5 dart 모델 (참고용)

```dart
// data/models/match_lineup_confirmed.dart 신규 (선택 — inline 매핑도 가능)
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

  static MatchLineupConfirmed? fromJsonOrNull(Map<String, dynamic>? json) {
    if (json == null) return null;
    return MatchLineupConfirmed.fromJson(json);
  }
}
```

사용 예:
```dart
final homeLineup = MatchLineupConfirmed.fromJsonOrNull(
  response.data['home_lineup_confirmed'] as Map<String, dynamic>?,
);

final homeStarterIds = homeLineup?.starterTtpIds
  ?? homePlayers.where((p) => p.isStarter).take(5).map((p) => p.id).toSet();

final homeActiveIds = homeLineup?.activeTtpIds ?? <int>{};
```

---

## §6 검증 시나리오 — 상세 13건

### 6.1 핵심 5건

| # | 시나리오 | 입력 조건 | 예상 결과 |
|---|---------|---------|---------|
| 1 | 라인업 미입력 | DB `MatchLineupConfirmed` row 0건 | `home_lineup_confirmed: null` / 기존 흐름 (`ttp.isStarter` take(5)) |
| 2 | home 만 입력 | home row 만 (away 미입력) | home 사전 starter 5명 자동 / away 기존 흐름 |
| 3 | 양 팀 입력 | 둘 다 row 존재 | 양쪽 사전 라인업 자동 채움 |
| 4 | 적용 후 수정 | 라인업 적용 후 기록원 클릭 | 토글 자유 (강제 잠금 X) |
| 5 | starter ⊆ active | 서버 검증됨 | 클라는 신뢰 (방어 코드 0 OK) |

### 6.2 edge case 4건

| # | 시나리오 | 입력 조건 | 예상 결과 |
|---|---------|---------|---------|
| 6 | `active_ttp_ids` 빈 배열 | substitutes 0건 + starters 0건 (이론상) | active = 빈 Set / 모두 비활성 처리 |
| 7 | 사전 라인업 적용 후 매치 시작 | 진행 중 매치 | 영향 0 (라인업 = 시작 전 기준) |
| 8 | `confirmed_at` 미래 시각 | 시계 오차 케이스 | 그대로 표시 (방어 코드 X) |
| 9 | 응답에 신규 필드 누락 | v1 호환 케이스 (서버 롤백 시) | null 처리 (회귀 0) |

### 6.3 회귀 4건

| # | 항목 | 예상 |
|---|------|------|
| R1 | v1 앱 = 신규 필드 무시 | 기존 빌드 / 기존 흐름 정상 |
| R2 | API 응답 키 변경 0 | `home_players` / `away_players` 변경 0 검증 |
| R3 | 권한 가드 변경 0 | `requireRecorder` 그대로 |
| R4 | DB schema 변경 0 | PR1 그대로 (Flutter repo 는 DB 직접 접근 0) |

### 6.4 시뮬레이터 검증 절차 (수빈 본인 수행)

1. 운영 web `/lineup-confirm/[matchId]` 접속 → 본인 팀장 매치에 사전 라인업 5명 입력 + 후보 3명 추가
2. Flutter v2 빌드 → 시뮬레이터 / 실기기에 install
3. 해당 매치 진입 (`/match/{id}/starter-select`)
4. 출전 8명 (주전 5 + 후보 3) 자동 체크 / 주전 5명 별표 자동 확인
5. 임의 출전 1명 해제 → 정상 동작 (강제 잠금 X)
6. 다른 매치 (라인업 미입력) 진입 → 기존 흐름 (`take(5)`) 정상 확인

---

## §7 자주 막히는 함정 (Flutter AI 가 만날 수 있는)

### 7.1 BigInt 직렬화 룰

서버는 BigInt 를 string 으로 직렬화 (JSON spec 호환).
- `id: 3001` (number) ❌ → `id: "3001"` (string) ✅
- 응답 `active_ttp_ids` / `starter_ttp_ids` 모두 `List<String>`
- dart 에서 `int.parse(s as String)` 변환 필수
- 변환 누락 시 → type error

### 7.2 null 분기 누락 NPE

라인업 미입력 매치 (운영 중 거의 모든 매치) 에서 NPE 가능:
```dart
// ❌ NPE 발생 가능
final ids = response.data['home_lineup_confirmed']['starter_ttp_ids'];

// ✅ null 분기
final lineup = response.data['home_lineup_confirmed'];
final ids = lineup != null ? lineup['starter_ttp_ids'] : null;
```

### 7.3 Set 중복 처리

`Set<int>.from(List<int>)` 시 중복 자동 제거 (정상 — 서버는 이미 unique 보장).

### 7.4 active vs starter 혼동

- `active_ttp_ids` = 출전 명단 (주전 5 + 후보 N 합집합)
- `starter_ttp_ids` = 주전 5명만
- 도메인 룰: `starter ⊆ active` (서버 검증됨)
- UI 매핑: 출전 체크박스 = active / 주전 별표 = starter

### 7.5 confirmed_at 파싱

ISO 8601 (Z 포함) → `DateTime.parse()` OK:
```dart
DateTime.parse("2026-05-10T12:30:00.000Z")  // OK
DateTime.parse("2026-05-10T12:30:00Z")       // OK
DateTime.parse("2026-05-10T12:30:00")        // OK (local time)
```

### 7.6 응답 envelope 처리

서버 응답 구조: `{ success: true, data: { ... } }`. dart 에서 `response.data` 접근법은 기존 `getMatchRoster` 매핑과 동일.

---

## §8 사용자 (수빈) 가 직접 확인할 사항

### 8.1 작업 전

- Flutter repo 위치 / 브랜치 (`bdr_stat_temp` 추정)
- 현재 `_loadData()` 정확 위치 (grep 결과 확인)
- 응답 모델 위치 (`api_client.dart` 또는 `roster_response.dart`)

### 8.2 작업 후

- `flutter analyze` 통과 (lint 0 권장)
- 빌드 성공 (`flutter build ios` / `flutter build apk`)
- 시뮬레이터 검증 13건 (§6) 수행
- v2 앱 배포 (TestFlight / Play Console) — 기존 v1 사용자 점진 마이그
- 운영 매치 1건 실제 사전 라인업 입력 → 시뮬레이터에서 자동 채움 확인

### 8.3 v1 → v2 마이그 정책

| 앱 버전 | roster 응답 처리 | 동작 |
|--------|--------------|------|
| v1 (현재 배포) | 신규 필드 무시 | 기존 흐름 (`ttp.isStarter` take(5)) — 회귀 0 |
| v2 (PR6 배포 후) | 사전 라인업 우선 | 자동 채움 + 변경 자유 |

강제 업데이트 0 — v1 = 기능 제한 0 (사전 라인업 효과만 안 받음). 운영자에게 v2 권장 안내.

---

## §9 후속 영역 (PR6 외 — 수빈 web 측 담당)

본 PR6 와 병행 또는 선후 진행 (모두 web only / Flutter 영향 0):

| PR | 작업 | 의존 |
|----|------|------|
| **PR4** | Vercel Cron 5분 폴링 — 시작 1h 전 푸시 (`/api/cron/match-lineup-reminder`) | PR2 |
| **PR7** | `createNotificationBulk` 푸시 알림 통합 + deep-link `/lineup-confirm/[matchId]` | PR4 |
| 진입 링크 | 매치 페이지 → `/lineup-confirm/[matchId]` 진입 버튼 (팀장용) | PR3 |

PR6 (Flutter) 는 PR4/PR7 진행과 무관 — 독립 진행 가능.

---

## 부록 A — 참조 파일 (수빈 본인 확인용)

| 파일 | 역할 |
|------|------|
| `Dev/lineup-pr6-flutter-handoff-2026-05-10.md` | 사람 (원영) 용 핸드오프 문서 — 원본 |
| `Dev/match-lineup-confirmation-2026-05-09.md` | 전체 도메인 기획서 (Q1~Q9 결재) — §6 "기록앱 자동 매핑" |
| `prisma/schema.prisma` line 3242 | `MatchLineupConfirmed` 모델 |
| `src/app/api/v1/matches/[id]/roster/route.ts` | PR5 변경 후 — 응답 명세 source |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/lineup/route.ts` | web 측 입력 API (Flutter 영향 0) |
| `src/lib/auth/match-lineup.ts` | 권한 헬퍼 (Flutter 영향 0) |
| `src/app/(web)/lineup-confirm/[matchId]/` | 팀장 UI (PR3) — Flutter 영향 0 |

## 부록 B — 결재 요약 (PR6 관련)

| Q | 항목 | 결재 | PR6 영향 |
|---|------|------|---------|
| Q1 | 데이터 모델 | A (신규 테이블) | 응답 필드 2개로 전달 |
| Q4 | 자동 매핑 방식 | A (roster 응답 확장) | **본 PR6 핵심** |
| Q5 | 자동 매핑 적용 정책 | C (자동 채움 + 변경 자유) | UI 강제 잠금 X |
| Q6 | 주전 5명 정책 | A (강제) | starter_ttp_ids 길이 = 5 신뢰 가능 |
| Q7 | 양 팀 미입력 시 | A (기록원 수동 fallback) | null 분기 = 기존 흐름 |

---

**END.** 사용자가 §2 프롬프트 본문 (`PROMPT_START` ~ `PROMPT_END` 사이) 통째로 복사해서 Flutter repo 의 AI 에 붙여넣으면 작업 진입 가능.
