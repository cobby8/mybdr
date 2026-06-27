# DATA-BINDING v2 — 관리자 Toss 모듈 (CLI 박제 계약)

> 기준: BDR-join-v1 Supabase 실모델 + mybdr `TournamentTeam`/`TournamentDivisionRule`
> 목적: 디자인 시안 ↔ 실제 백엔드 배선. 아래 스키마·매핑·의사코드를 그대로 박제.
> 2026-06-21 rev2 — 필드 단위 확정.

---

## 0. 신규/확장 테이블 요약 (마이그레이션 대상)

| 테이블 | 구분 | 비고 |
|--------|------|------|
| `admin_categories` | 신규(복원) | 종별 마스터. BDR-join-v1 운영 DB에서 마이그레이션 |
| `tournament_division_rules` | 확장 | `format`/`settings`/`fee_krw` 컬럼 추가 |
| `tournament_team_players` | 신규 | 출전선수 = 팀 로스터 조인 (명단입력 폐지 핵심) |
| `recorder_assignments` | 신규 | 경기별 기록자 배정 |
| `tournament_format_presets` | 선택 | 경기포맷 프리셋(저장/재사용). 미정 시 보류 가능 |

⚠ BDR-join-v1 `tournament_presets` / PresetManager 는 **미연결 고아** → 박제 금지.

---

## 1. admin_categories (종별 마스터 — 복원)

```sql
CREATE TABLE admin_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,          -- 종별명: 일반부/유청소년/대학부/시니어
  divisions   jsonb NOT NULL DEFAULT '[]',  -- string[]  예: ["D3","D4",...]
  ages        jsonb NOT NULL DEFAULT '[]',  -- string[]  예: ["U8",...] (없을 수 있음)
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
```
**4종 시드** (사용자 실데이터 복원):
```json
[
 {"name":"일반부",  "divisions":["D3","D4","D5","D6","D7","D8"], "ages":[]},
 {"name":"유청소년","divisions":["하모니","i1","i2","i3","i4"],   "ages":["U8","U9","U10","U11","U12","U13","U14","U15","U16","U17","U18"]},
 {"name":"대학부",  "divisions":["U1","U2","U3"],                 "ages":[]},
 {"name":"시니어",  "divisions":["S1","S2","S3"],                 "ages":["+40","+45","+50","+55","+60","+65","+70"]}
]
```
**마이그레이션**: BDR-join-v1 운영 Supabase `admin_categories` 가 살아있으면 그대로 복사. 없으면 위 시드 INSERT.
**시안 매핑**: `CategoryMaster.jsx` / 설정>종별 마스터 탭. 태그 입력 = `divisions`/`ages` 배열 push/filter → row UPDATE.

---

## 2. tournament_division_rules (확장)

기존 mybdr `TournamentDivisionRule` 에 본 도구의 진행방식/참가비 3컬럼 추가:
```sql
ALTER TABLE tournament_division_rules
  ADD COLUMN format   text,    -- single_elimination|group_stage_knockout|full_league|dual_tournament
  ADD COLUMN settings jsonb DEFAULT '{}',  -- 아래 §2-1
  ADD COLUMN fee_krw  int DEFAULT 0;
```
기존 컬럼 유지: `tournament_id, category(종별명), label/code(디비전명), cap/max_teams, sort_order`.

### 2-1. settings (format별 키)
| format | settings JSON |
|--------|---------------|
| `single_elimination` | `{ "bracketSize": 8\|16\|32 }` |
| `group_stage_knockout` | `{ "groupCount": int, "advanceCount": int }` |
| `full_league` | `{ "rounds": 1\|2 }` |
| `dual_tournament` | `{}` |

### 2-2. 종별 확정 시 자동생성 (의사코드)
```
on 종별 추가/확정 (GeneratorModal onGenerate):
  for each 선택 디비전 dn in 종별:
    INSERT tournament_division_rules {
      tournament_id, category: "{성별} {종별명}", label: dn,
      format: 종별 기본 method, settings: defaults(method),
      cap: 0, fee_krw: 0, sort_order: idx
    }
  // 동시에 상위 Tournament 집계 갱신
  Tournament.divs[category]   += dn
  Tournament.div_caps[dn]      = cap   (디비전 행 편집 시)
  Tournament.div_fees[dn]      = fee_krw
```
**시안 매핑**: `tn-screens.jsx > TnDivisions`(인라인 편집) · `GeneratorModal`. "저장 시 DivisionRule N건 자동 생성" 배너 = 이 INSERT.

---

## 3. 상태 enum 매핑 (시안 ↔ mybdr) — ⭐ 배선 핵심

mybdr `TournamentTeam.status` 가 4값(pending/approved/rejected/paid)이라 **1:1이 아님**. 아래 매핑 고정:

| 시안 status | 시안 의미 | mybdr `status` | mybdr `payment_status` |
|-------------|----------|----------------|------------------------|
| `APPLIED`   | 접수완료(정원 내) | `pending` | `pending` |
| `WAITING`   | 대기접수(정원 초과) | `pending` (+ `is_waiting=true` 플래그) | `pending` |
| `CONFIRMED` | 참가확정 | `approved` | `paid` |
| `CANCELED`  | 취소 | `rejected` | `pending`\|`refunded` |

- mybdr 에 대기 구분 컬럼이 없으면 **`is_waiting boolean` 추가** 권장(없으면 status='pending' + 정원초과 계산으로 런타임 판정).
- 시안 `payment`(pending/paid/refunded) = mybdr `payment_status` 그대로.

### 3-1. 입금완료 → 자동 참가확정 (트리거)
```
on payment_status: pending → paid :
  status = approved (CONFIRMED)
  // 시안 TnTeams/Admin-Teams 인라인 셀렉트가 이 트리거를 클라에서 미리 반영
```
**시안 매핑**: `tn-screens.jsx > TnTeams` update() — `payment==='paid'` 시 `status` APPLIED→CONFIRMED 자동.

---

## 4. tournament_team_players (출전선수 = 로스터 조인) — ⭐ 명단입력 폐지

```sql
CREATE TABLE tournament_team_players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_team_id uuid REFERENCES tournament_teams(id) ON DELETE CASCADE,
  team_player_id  uuid REFERENCES players(id),   -- 기존 팀 로스터 선수
  is_guest        boolean DEFAULT false,         -- 게스트(팀원 외) — 정책 추후
  created_at      timestamptz DEFAULT now()
);
```
**신청 흐름 (Apply.jsx)**:
```
1. GET teams WHERE 로그인유저 ∈ members          → Step1 팀 선택
2. 팀 선택 → 팀 정보 + GET players WHERE team_id  → 로스터 표시(입력 X)
3. 종별/디비전 선택 → §5 WAITING 판정
4. 출전선수 = 체크 선택분만 INSERT tournament_team_players (team_player_id)
5. 제출 → tournament_teams INSERT (status §3) + 위 조인 INSERT
```
- 유니폼: `teams.uniform_*` 표시만(신청 시 미입력).
- ⏳ 출전 최소인원(`MIN_PLAYERS_GUARD`) / 게스트(`ALLOW_GUEST`) = 정책 확정 후 토글 on.

---

## 5. 정원 집계 · WAITING 판정 (서버 권위)

```
cap   = div_caps[division]  (또는 division_rule.cap)
count = COUNT(tournament_teams WHERE tournament_id=? AND division=?
              AND status IN ('pending','approved'))   -- 취소/거절 제외
판정: count >= cap  → WAITING(대기접수) , else APPLIED
```
- 클라(Apply Step2 / 참가신청 미리보기)는 표시용 집계, **제출 시 서버 재판정**(레이스 방지).
- 대기팀 자리 발생(확정팀 취소) 시 → 가장 오래된 WAITING 1팀 알림 대상.

---

## 6. 대진표 (brackets/groups/matches) — BDR-join-v1 모델 그대로

```
brackets { id, tournament_id, division, type(=format), settings, status('draft'|'published'), title }
groups   { id, bracket_id, name('A조'..), order_index }
matches  { id, bracket_id, stage('group'|'knockout'), group_id, round_number, match_number,
           home_team_id, away_team_id, status('scheduled'|'finished'), home_score, away_score }
```
**생성 (TnBracket "대진표 생성")** — division.format 분기:
- `group_stage_knockout`: 팀을 `groupCount` 조로 분배(index % groupCount) → 조별 라운드로빈 matches(nC2) + 본선 knockout(groupCount×advanceCount 강)
- `single_elimination`: `bracketSize` 시드 트리
- `full_league`: 전 팀 라운드로빈 순위표
- `dual_tournament`: 승자/패자조
> BDR-join-v1 `generateHybridBracket` 로직 재사용. 현 시안은 클라 프리뷰 → 실제는 위 INSERT.

---

## 7. recorder_assignments (기록자 배정 — 신규)

```sql
CREATE TABLE recorder_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid REFERENCES matches(id) ON DELETE CASCADE,
  recorder_id uuid REFERENCES users(id),   -- null = 미배정
  assigned_at timestamptz DEFAULT now()
);
```
**시안 매핑**: `tn-extra.jsx > TnRecorders` — 경기별 기록자 select → upsert. 자동 배정 = 가용 기록자 라운드로빈.

---

## 8. 화면 ↔ 엔드포인트 (제안)

| 화면 | read | write |
|------|------|-------|
| 종별 마스터 | `GET /admin/categories` | `PUT /admin/categories/[id]` (divisions/ages) |
| 대회 생성 위저드 | — | `POST /tournament-admin/tournaments` |
| 종별·디비전 | `GET .../division-rules` | `POST .../division-rules:bulkUpsert` |
| 참가팀 | `GET .../teams?status=&division=&page=` | `PATCH .../teams/[id]` (status/payment) |
| 대진표 | `GET .../brackets?division=` | `POST .../brackets:generate` |
| 기록자 | `GET .../matches` | `PUT .../matches/[id]/recorder` |
| 공개·완료 | — | `PATCH .../tournaments/[id]` (published, results) |
| 참가신청 | `GET /tournaments/[id]`, `GET /me/teams` | `POST /tournaments/[id]/apply` |

- 목록은 **서버 페이지네이션**(`page`/`size` + `total`) 권장. 현 시안 mock 클라 필터 → count/range 쿼리로 교체.

---

## 9. CLI 박제 체크리스트
- [ ] `admin_categories` 마이그레이션(복원 or 4종 시드)
- [ ] `tournament_division_rules` + format/settings/fee_krw 컬럼
- [ ] status enum 매핑(§3) + 입금→확정 트리거
- [ ] `tournament_team_players` 조인 + Apply 흐름
- [ ] WAITING 서버 재판정(§5)
- [ ] brackets/groups/matches 생성(§6)
- [ ] `recorder_assignments`(§7)
- [ ] (선택) `tournament_format_presets`
