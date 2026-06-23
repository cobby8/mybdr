# CLI 의뢰서 — 더미→실데이터 연결 박제 (PR-MOCK-TO-REAL)

> **작성**: Cowork 2026-06-14. 근거: `Dev/mock-data-census-2026-06-14.md` 버킷 A.
> **원칙**: 0스키마(기존 테이블 집계/재사용) · mock 제거 · 행 0이면 빈 상태(더미 복원 ❌).
> **★ 함정**: 시안이 "DB 0%"라 적었어도 schema 실측상 연결 가능 — 본 의뢰는 그 실측 결과.

---

## §0. 공통 가드

```
· 0스키마 — 신규 테이블/컬럼 ❌. 기존 테이블 집계/조인만.
· mock 제거 — MOCK_/더미 상수 삭제. 행 0 = 빈 상태 컴포넌트(ex-empty), 가짜 데이터 ❌.
· snake_case 응답 함정 — apiSuccess 자동 변환. 신규 집계 필드 curl raw 1회 확인.
· /api/v1 ❌ · 라우트 변경 ❌ · UI 레이아웃 시안 보존(데이터만 실연결).
· 박제 전 페이지별 count 실측 — populated 여부 확인 후 연결(빈 상태 분기 포함).
```

---

## §1. 박제 대상 (우선순위 순)

### ① /stats ⭐ 최우선·최고가치
- 현재: `src/app/(web)/stats/page.tsx` 의 TOTALS/ZONES/SPLITS/GAME_LOG/TREND/RANKINGS 전부 더미 상수.
- 실연결:
  - **TOTALS/시즌** = `UserSeasonStat` (games_played/wins/losses/avg_rating/mvp_count/rank_position/total_minutes) where user_id=본인, season_year=현시즌
  - **ZONES/슈팅존** = `ShotZoneStat` (zone_code/attempts/made/efficiency) where user_id, season_year
  - **GAME_LOG/RANKINGS** = `MatchPlayerStat` (points/3P/FT/rebounds/assists/minutes) 본인 ttp 조인 최근 N + 집계 랭킹
- 빈 상태: 해당 시즌 행 0 = "이번 시즌 기록이 아직 없습니다" (준비중 더미 ❌)
- SPLITS(포지션/레벨/구장/시간대) = MatchPlayerStat 조인 집계 가능 범위만, 불가 항목은 hide(준비중 배지 유지 가능)

### ② /calendar
- 현재: EVENTS 17 더미 + TODAY="2026-04-23" 하드코딩.
- 실연결: 본인 참여 **court_events**(event_date/start_time/title/status) + 본인 **tournament 참가 일정**(TournamentTeamPlayer→Tournament.startDate) 합산. TODAY = 실제 현재일.
- 빈 상태: 일정 0 = "예정된 일정이 없습니다".

### ③ /about 통계4
- 현재: stats 예시값 + "운영 시점 연동" 캡션.
- 실연결: `users`/`Team`/`Tournament`/`court_info` count. 캡션 제거(실값). §6 운영진 실명 ❌ 보존(변경 X).

### ④ /scrim (★의도 확인 후)
- 현재: OPEN_REQS/INCOMING/OUTGOING/HISTORY 더미.
- 실연결 후보: `team_match_requests` (팀 매치 요청 = 스크림). 스키마 필드 실측 후 상대찾기/받은/보낸/지난 4탭 매핑.
- ⚠️ team_match_requests 가 스크림 의도와 불일치하면 STOP+보고(버킷 B 재분류). 억지 매핑 ❌.

### ⑤ /team-invite
- 현재: team/inviter/invite/ROSTER 인라인 더미.
- 실연결: `team_join_requests` / `TeamMemberRequest` (초대/요청 모델) + Team/TeamMember 로스터. 토큰 진입(`/team-apply/[token]` 흐름)과 정합 확인.
- ⚠️ 시안의 토큰-초대 UX 와 기존 요청 모델 차이 크면 보고(부분 연결 또는 B 재분류).

### ⑥ /saved 잔여 탭
- 현재: 게시판/코트 2탭 실연결(board_favorites/user_favorite_courts), 경기/대회/팀 3탭 빈 더미.
- 실연결: 경기/대회/팀 즐겨찾기 **테이블 없음** → 해당 탭은 "준비중" 명시 유지(빈 상태). 0스키마 = 신규 favorite 테이블 ❌ → 본 PR 범위 밖(B 로 이관).
- → ⑥은 "현 2탭 정상 + 3탭 준비중 라벨 정리"만. 신규 연결 없음.

### ⑦ /awards 기본부
- 현재: 6필드 "준비중" 배지 + 실쿼리 혼합.
- 실연결: `UserSeasonStat`(mvp_count/rank_position) + rankings 집계로 가능한 항목 실값. 고급필드(올스타/MVP코멘트/감독/루키)=테이블 0 → 준비중 유지(B).

---

## §2. 권장 배치

```
[Batch 1] ① /stats (최고가치 단독 PR) — 3 테이블 집계 + 빈상태
[Batch 2] ② /calendar + ③ /about (집계 단순)
[Batch 3] ④ /scrim + ⑤ /team-invite (의도/모델 확인 — STOP 가드)
[정리]   ⑥ /saved 라벨 + ⑦ /awards 기본부 (준비중 경계 정리)
```

---

## §3. Stop conditions
```
· 신규 테이블/컬럼(0스키마 위반) · /api/v1 · 라우트 변경
· 억지 매핑(team_match_requests↔scrim, team_join↔invite 의도 불일치 시 STOP+보고)
· 행 0인데 더미 데이터로 채움(빈 상태가 정답)
· UI 레이아웃 변경(데이터만 연결) · 하드코딩 색/lucide/pill
· lint/tsc 실패
```

## §4. 검증 (tester)
```
1. tsc/lint 0
2. /stats: UserSeasonStat/ShotZoneStat/MatchPlayerStat 실쿼리 · 더미 상수 0 · 빈상태 분기 · curl raw snake_case
3. /calendar: court_events+tournament 실집계 · TODAY 실제일
4. /about: count 실값 · 운영진 실명 0(보존)
5. ④⑤: 모델 정합 또는 STOP 보고 근거
6. 회귀: 레이아웃 시안 보존 · 다른 페이지 무영향
7. 운영 count 실측 로그 첨부(populated 증빙)
```

## §5. 마무리
```
· commit: feat(data): 더미→실데이터 연결 [페이지] (PR-MOCK-TO-REAL)
· decisions: "DB 0% 오판 페이지 실연결(stats 등)" + [[lesson-sian-db-assumption]] 강화 1줄
· census 갱신(버킷 A 처리 표시) · phase-ledger
· 머지 STAGE B
```

---

## 즉시 시작 명령 (CLI)
```
Read Dev/design/prompts/mock-to-realdata-bake-cli-prompt-2026-06-14.md 하고 §1 ① /stats 부터 — UserSeasonStat/ShotZoneStat/MatchPlayerStat 집계로 더미 제거+실연결. 박제 전 count 실측(빈 상태 분기). 0스키마·mock 복원 ❌. ④⑤는 모델 의도 불일치 시 STOP 보고. 결재 default 자동.
```
