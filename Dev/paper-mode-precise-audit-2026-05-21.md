# paper 모드 정밀 조사 — 강남구 6 매치 분포 + audit 추적

- 실행 시각: 2026-05-20T16:06:06.489Z
- DB: 운영 (Supabase / SELECT only)
- 목적: C/D/B 분류 결함 패턴 근본 원인 추적

## C 매치 159 — MPS 9/3 (헤더 7/3) (id=159)

### 매치 헤더
| 컬럼 | 값 |
|------|-----|
| home / away | 분당SFA (288) vs 위례삼성 (289) |
| homeScore / awayScore | 7 / 3 |
| status / winner | completed / 288 |
| recording_mode | paper |
| quarter_scores | `{"away":{"ot":[],"q1":1,"q2":2,"q3":0,"q4":0},"home":{"ot":[],"q1":1,"q2":6,"q3":0,"q4":0}}` |
| created / updated / ended | 2026-05-11T10:35:18.781Z / 2026-05-16T01:04:47.206Z / NULL |

### MatchPlayerStat (points > 0 / updated_at ASC)
| ttp_id | 팀 | 등번호 | 선수 | points | FG/FT/3P made | updated_at |
|--------|-----|--------|------|--------|----------------|------------|
| 2852 | H | 30 | - | 2 | 1/0/0 | 2026-05-16T01:04:34.178Z |
| 2849 | H | 8 | - | 3 | 1/1/0 | 2026-05-16T01:04:44.836Z |
| 2856 | H | 11 | - | 4 | 2/0/0 | 2026-05-16T01:04:44.838Z |
| 3679 | A | 20 | - | 3 | 1/1/0 | 2026-05-16T01:04:44.839Z |

> **MPS 합**: 홈 9 / 어웨이 3

### PBP 분포 (action_type별)
| 팀 | Q | action | subtype | 건수 | pts 합 | local_id 샘플 |
|-----|---|--------|---------|------|--------|---------------|
| H | 1 | foul | - | 4 | 0 | paper-fix-27a68dba-a734-40ea-b |
| H | 1 | shot_made | 1pt | 1 | 1 | paper-fix-64d98d5e-ab48-4c5d-b |
| A | 1 | foul | - | 1 | 0 | paper-fix-dcc68452-d991-4fd4-8 |
| A | 1 | shot_made | 1pt | 1 | 1 | paper-fix-0cab14bf-546c-43dd-8 |
| H | 2 | foul | - | 6 | 0 | paper-fix-0309569c-be12-4e16-8 |
| H | 2 | shot_made | 2pt | 3 | 6 | paper-fix-036b7ced-4175-498a-a |
| A | 2 | shot_made | 2pt | 1 | 2 | paper-fix-ac175cc8-4bdc-433b-8 |

### tournament_match_audits (시간순)
| id | source | context | by | changed_at | changes 키 |
|----|--------|---------|-----|------------|------------|
| 266 | mode_switch | bulk_mode_switch all → paper: 경기원 교육 및 인원 부족 | 2999 | 2026-05-15T07:20:38.542Z | scope,reason,recording_mode |
| 386 | web-score-sheet | record-cancel by BDR_Admin master / 완전 초기화 | 1 | 2026-05-15T12:59:21.184Z | actor,action,reset_at |
| 387 | web-score-sheet | record-cancel by BDR_Admin master / 완전 초기화 | 1 | 2026-05-15T12:59:49.646Z | actor,action,reset_at |
| 388 | web-score-sheet | record-cancel by BDR_Admin master / 완전 초기화 | 1 | 2026-05-15T13:28:34.014Z | actor,action,reset_at |
| 389 | web-score-sheet | record-cancel by BDR_Admin master / 완전 초기화 | 1 | 2026-05-15T13:49:07.004Z | actor,action,reset_at |
| 390 | web-score-sheet | record-cancel by 김수빈 / 완전 초기화 | 2999 | 2026-05-15T13:58:47.804Z | actor,action,reset_at |
| 414 | web-score-sheet | record-cancel by 김수빈 / 완전 초기화 | 2999 | 2026-05-15T21:21:41.368Z | actor,action,reset_at |
| 415 | web-score-sheet | record-cancel by BDR_Admin master / 완전 초기화 | 1 | 2026-05-15T21:37:05.495Z | actor,action,reset_at |
| 416 | web-score-sheet | record-cancel by BDR_Admin master / 완전 초기화 | 1 | 2026-05-15T21:38:00.487Z | actor,action,reset_at |
| 419 | web-score-sheet | record-cancel by BDR_Admin master / 완전 초기화 | 1 | 2026-05-15T22:39:50.980Z | actor,action,reset_at |
| 420 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:02:45.981Z | input |
| 421 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:02:54.973Z | input |
| 422 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:03:04.944Z | input |
| 423 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:03:14.952Z | input |
| 424 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:03:24.881Z | input |
| 425 | web-score-sheet | record-cancel by 김수빈 / 완전 초기화 | 2999 | 2026-05-15T23:03:29.883Z | actor,action,reset_at |
| 426 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:03:34.921Z | input |
| 427 | web-score-sheet | record-cancel by 김수빈 / 완전 초기화 | 2999 | 2026-05-15T23:04:19.449Z | actor,action,reset_at |
| 428 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:04:37.050Z | input |
| 429 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:05:37.113Z | input |
| 430 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:06:37.080Z | input |
| 433 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:07:37.036Z | input |
| 434 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:08:19.716Z | input |
| 435 | web-score-sheet | score-sheet 입력 by BDR_Admin master / 점수 2-2 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 8명 / away 6명 | 1 | 2026-05-15T23:08:23.851Z | input |
| 436 | web-score-sheet | record-cancel by BDR_Admin master / 완전 초기화 | 1 | 2026-05-15T23:08:31.534Z | actor,action,reset_at |
| 437 | web-score-sheet | record-cancel by 김수빈 / 완전 초기화 | 2999 | 2026-05-15T23:08:42.067Z | actor,action,reset_at |
| 544 | web-score-sheet | record-cancel by 김수빈 / 완전 초기화 | 2999 | 2026-05-15T23:28:07.546Z | actor,action,reset_at |
| 639 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:02:50.867Z | input |
| 640 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:03:00.494Z | input |
| 641 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 1건 (score 1 / foul 0) / Stat 1명 / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:03:10.603Z | input |
| 642 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 1건 (score 1 / foul 0) / Stat 1명 / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:03:20.622Z | input |
| 643 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 1건 (score 1 / foul 0) / Stat 1명 / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:03:30.558Z | input |
| 644 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 2건 (score 1 / foul 0 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:03:33.797Z | input |
| 645 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 2건 (score 1 / foul 0 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:03:40.549Z | input |
| 646 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 2건 (score 1 / foul 0 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:03:50.597Z | input |
| 647 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:04:14.601Z | input |
| 648 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:04:24.481Z | input |
| 649 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:04:34.525Z | input |
| 650 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:04:44.599Z | input |
| 651 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T00:04:54.650Z | input |
| 846 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 1건 (score 1 / foul 0) / Stat 1명 / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T01:04:24.289Z | input |
| 848 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 1건 (score 1 / foul 0) / Stat 1명 / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T01:04:34.328Z | input |
| 850 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-3 / status completed / PBP 22건 (score 6 / foul 11 / poss 5 = JB1+HB4) / Stat 8명 / TO 3건 (home 2 / away 1) / Lineup home 8명 / away 6명 | 3431 | 2026-05-16T01:04:45.224Z | input |

## C 매치 164 — MPS 9/23 (헤더 9/21) (id=164)

### 매치 헤더
| 컬럼 | 값 |
|------|-----|
| home / away | 그로우 (293) vs 넥스트레벨 (295) |
| homeScore / awayScore | 9 / 21 |
| status / winner | completed / 295 |
| recording_mode | paper |
| quarter_scores | `{"away":{"ot":[],"q1":5,"q2":16,"q3":0,"q4":0},"home":{"ot":[],"q1":7,"q2":2,"q3":0,"q4":0}}` |
| created / updated / ended | 2026-05-11T10:35:20.441Z / 2026-05-16T03:04:28.683Z / NULL |

### MatchPlayerStat (points > 0 / updated_at ASC)
| ttp_id | 팀 | 등번호 | 선수 | points | FG/FT/3P made | updated_at |
|--------|-----|--------|------|--------|----------------|------------|
| 3613 | A | 30 | - | 2 | 1/0/0 | 2026-05-16T02:50:21.302Z |
| 3745 | H | 7 | - | 5 | 1/3/0 | 2026-05-16T03:04:26.700Z |
| 3752 | H | 30 | - | 4 | 2/0/0 | 2026-05-16T03:04:26.701Z |
| 3611 | A | 8 | - | 19 | 8/3/0 | 2026-05-16T03:04:26.702Z |
| 3610 | A | 7 | - | 2 | 1/0/0 | 2026-05-16T03:04:26.702Z |

> **MPS 합**: 홈 9 / 어웨이 23

### PBP 분포 (action_type별)
| 팀 | Q | action | subtype | 건수 | pts 합 | local_id 샘플 |
|-----|---|--------|---------|------|--------|---------------|
| H | 1 | foul | - | 5 | 0 | paper-fix-2659c2ea-bdd2-49e0-b |
| H | 1 | shot_made | 1pt | 3 | 3 | paper-fix-37bc28db-8fe3-4a48-a |
| H | 1 | shot_made | 2pt | 2 | 4 | paper-fix-22dab6dd-65c1-4a51-a |
| A | 1 | foul | - | 3 | 0 | paper-fix-45b7b4ba-a654-403e-b |
| A | 1 | shot_made | 1pt | 1 | 1 | paper-fix-971d9572-bac1-464a-b |
| A | 1 | shot_made | 2pt | 2 | 4 | paper-fix-80d18ef2-85ac-4c88-b |
| H | 2 | foul | - | 3 | 0 | paper-fix-4d3f397f-6004-4d05-a |
| H | 2 | shot_made | 2pt | 1 | 2 | paper-fix-d74e7d2a-e742-4427-b |
| A | 2 | foul | - | 3 | 0 | paper-fix-1714b0f7-10c5-4180-a |
| A | 2 | shot_made | 1pt | 2 | 2 | paper-fix-296383e6-1948-4d3d-a |
| A | 2 | shot_made | 2pt | 7 | 14 | paper-fix-1a9f4129-d5a9-4a9d-9 |

### tournament_match_audits (시간순)
| id | source | context | by | changed_at | changes 키 |
|----|--------|---------|-----|------------|------------|
| 214 | mode_switch | bulk_mode_switch all → paper: 경기원 교육 및 인원 부족 | 2999 | 2026-05-15T07:20:38.542Z | scope,reason,recording_mode |
| 1744 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:40:43.079Z | input |
| 1746 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:40:53.084Z | input |
| 1748 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:41:03.082Z | input |
| 1750 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:41:13.011Z | input |
| 1752 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:41:23.116Z | input |
| 1754 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:41:33.304Z | input |
| 1756 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:41:43.075Z | input |
| 1757 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:41:47.854Z | input |
| 1759 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:41:53.235Z | input |
| 1761 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 2건 (score 0 / foul 1 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:42:03.237Z | input |
| 1763 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 2건 (score 0 / foul 1 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:42:13.113Z | input |
| 1765 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 2건 (score 0 / foul 1 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:42:23.125Z | input |
| 1767 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 3건 (score 0 / foul 2 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:42:33.141Z | input |
| 1769 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 3건 (score 0 / foul 2 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:42:43.254Z | input |
| 1771 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 3건 (score 0 / foul 2 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:42:53.145Z | input |
| 1773 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 4건 (score 0 / foul 3 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:43:03.309Z | input |
| 1775 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / PBP 4건 (score 0 / foul 3 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:43:13.378Z | input |
| 1777 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 1-0 / status in_progress / PBP 5건 (score 1 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:43:23.055Z | input |
| 1779 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:43:33.199Z | input |
| 1781 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:43:43.079Z | input |
| 1783 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:43:53.252Z | input |
| 1785 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:44:03.130Z | input |
| 1787 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:44:13.152Z | input |
| 1789 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:44:23.286Z | input |
| 1791 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:44:33.112Z | input |
| 1793 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:44:43.097Z | input |
| 1795 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 6건 (score 2 / foul 3 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:44:53.141Z | input |
| 1797 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-0 / status in_progress / PBP 7건 (score 2 / foul 4 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:45:03.043Z | input |
| 1799 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-2 / status in_progress / PBP 8건 (score 3 / foul 4 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:45:12.994Z | input |
| 1801 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-2 / status in_progress / PBP 9건 (score 3 / foul 5 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:45:23.138Z | input |
| 1803 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-2 / status in_progress / PBP 9건 (score 3 / foul 5 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:45:33.224Z | input |
| 1805 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-3 / status in_progress / PBP 10건 (score 4 / foul 5 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:45:43.095Z | input |
| 1807 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-3 / status in_progress / PBP 10건 (score 4 / foul 5 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:45:53.132Z | input |
| 1809 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-3 / status in_progress / PBP 10건 (score 4 / foul 5 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:46:03.083Z | input |
| 1811 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-3 / status in_progress / PBP 10건 (score 4 / foul 5 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:46:13.119Z | input |
| 1813 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-3 / status in_progress / PBP 11건 (score 4 / foul 6 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:46:23.152Z | input |
| 1815 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-3 / status in_progress / PBP 11건 (score 4 / foul 6 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:46:33.096Z | input |
| 1817 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-3 / status in_progress / PBP 11건 (score 4 / foul 6 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:46:43.169Z | input |
| 1819 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-3 / status in_progress / PBP 11건 (score 4 / foul 6 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:46:53.096Z | input |
| 1821 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 12건 (score 5 / foul 6 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:47:03.042Z | input |
| 1823 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 12건 (score 5 / foul 6 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:47:13.157Z | input |
| 1825 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:47:23.118Z | input |
| 1827 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:47:33.214Z | input |
| 1829 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:47:43.213Z | input |
| 1831 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:47:53.148Z | input |
| 1833 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:48:03.264Z | input |
| 1835 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:48:13.199Z | input |
| 1837 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:48:23.169Z | input |
| 1839 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:48:33.195Z | input |
| 1841 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:48:43.094Z | input |
| 1843 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:48:53.147Z | input |
| 1845 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:49:03.270Z | input |
| 1847 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:49:13.050Z | input |
| 1849 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:49:23.162Z | input |
| 1851 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 13건 (score 5 / foul 7 / poss 1 = JB1+HB0) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:49:33.260Z | input |
| 1855 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-3 / status in_progress / PBP 12건 (score 5 / foul 7) / Stat 4명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:50:01.455Z | input |
| 1857 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-5 / status in_progress / PBP 13건 (score 6 / foul 7) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:50:11.515Z | input |
| 1859 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-5 / status in_progress / PBP 14건 (score 7 / foul 7) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:50:21.482Z | input |
| 1861 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-3 / status in_progress / PBP 13건 (score 6 / foul 7) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:50:31.494Z | input |
| 1863 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-3 / status in_progress / PBP 14건 (score 6 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:50:41.572Z | input |
| 1865 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-5 / status in_progress / PBP 15건 (score 7 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:50:51.653Z | input |
| 1867 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-5 / status in_progress / PBP 15건 (score 7 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:51:01.495Z | input |
| 1869 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-5 / status in_progress / PBP 15건 (score 7 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:51:11.443Z | input |
| 1871 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-5 / status in_progress / PBP 15건 (score 7 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:51:21.465Z | input |
| 1873 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-5 / status in_progress / PBP 15건 (score 7 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:51:31.451Z | input |
| 1875 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 16건 (score 8 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:51:41.376Z | input |
| 1877 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-5 / status in_progress / PBP 15건 (score 7 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:51:53.784Z | input |
| 1879 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 16건 (score 8 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:52:01.458Z | input |
| 1881 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 16건 (score 8 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:52:11.457Z | input |
| 1882 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:52:11.853Z | input |
| 1884 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:52:21.482Z | input |
| 1886 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:52:31.451Z | input |
| 1888 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:52:41.446Z | input |
| 1890 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:52:51.427Z | input |
| 1892 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:53:01.508Z | input |
| 1894 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:53:11.483Z | input |
| 1896 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:53:21.445Z | input |
| 1898 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:53:31.366Z | input |
| 1900 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 17건 (score 8 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:53:41.450Z | input |
| 1903 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-5 / status in_progress / PBP 16건 (score 8 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:54:00.675Z | input |
| 1905 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-7 / status in_progress / PBP 17건 (score 9 / foul 8) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:54:10.664Z | input |
| 1906 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-7 / status in_progress / PBP 18건 (score 9 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:54:16.258Z | input |
| 1908 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-7 / status in_progress / PBP 18건 (score 9 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:54:20.627Z | input |
| 1910 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-7 / status in_progress / PBP 18건 (score 9 / foul 8 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:54:30.553Z | input |
| 1912 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-7 / status in_progress / PBP 19건 (score 9 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:54:41.153Z | input |
| 1914 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-7 / status in_progress / PBP 19건 (score 9 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:54:50.607Z | input |
| 1916 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-8 / status in_progress / PBP 20건 (score 10 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 1건 (home 0 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:55:00.753Z | input |
| 1918 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:55:10.550Z | input |
| 1920 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:55:20.589Z | input |
| 1922 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:55:30.901Z | input |
| 1924 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:55:40.760Z | input |
| 1926 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:55:50.731Z | input |
| 1928 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:56:00.576Z | input |
| 1930 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:56:10.490Z | input |
| 1932 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:56:20.424Z | input |
| 1934 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:56:30.679Z | input |
| 1936 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:56:40.606Z | input |
| 1938 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:56:50.545Z | input |
| 1940 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 21건 (score 11 / foul 9 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:57:00.637Z | input |
| 1942 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 22건 (score 11 / foul 10 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:57:10.651Z | input |
| 1943 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 22건 (score 11 / foul 10 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:57:20.973Z | input |
| 1946 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 22건 (score 11 / foul 10 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:57:30.590Z | input |
| 1948 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 22건 (score 11 / foul 10 / poss 1 = JB1+HB0) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:57:40.718Z | input |
| 1950 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 23건 (score 11 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:57:50.638Z | input |
| 1952 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 23건 (score 11 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:58:00.613Z | input |
| 1954 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-9 / status in_progress / PBP 23건 (score 11 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:58:10.611Z | input |
| 1956 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 24건 (score 12 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:58:20.625Z | input |
| 1958 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 24건 (score 12 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:58:30.674Z | input |
| 1960 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 24건 (score 12 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:58:40.673Z | input |
| 1962 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 24건 (score 12 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:58:50.614Z | input |
| 1964 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 24건 (score 12 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:59:00.655Z | input |
| 1966 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 24건 (score 12 / foul 10 / poss 2 = JB1+HB1) / Stat 5명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:59:10.616Z | input |
| 1968 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 25건 (score 12 / foul 11 / poss 2 = JB1+HB1) / Stat 6명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:59:20.661Z | input |
| 1970 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 25건 (score 12 / foul 11 / poss 2 = JB1+HB1) / Stat 6명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:59:30.650Z | input |
| 1972 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 26건 (score 12 / foul 12 / poss 2 = JB1+HB1) / Stat 6명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:59:40.638Z | input |
| 1974 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 26건 (score 12 / foul 12 / poss 2 = JB1+HB1) / Stat 6명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T02:59:50.688Z | input |
| 1976 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-11 / status in_progress / PBP 26건 (score 12 / foul 12 / poss 2 = JB1+HB1) / Stat 6명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:00:00.665Z | input |
| 1978 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-11 / status in_progress / PBP 27건 (score 13 / foul 12 / poss 2 = JB1+HB1) / Stat 6명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:00:10.618Z | input |
| 1980 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-11 / status in_progress / PBP 27건 (score 13 / foul 12 / poss 2 = JB1+HB1) / Stat 6명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:00:20.709Z | input |
| 1982 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-13 / status in_progress / PBP 29건 (score 14 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:00:30.660Z | input |
| 1984 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-13 / status in_progress / PBP 29건 (score 14 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:00:40.622Z | input |
| 1986 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-13 / status in_progress / PBP 29건 (score 14 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:00:50.647Z | input |
| 1988 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-13 / status in_progress / PBP 29건 (score 14 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:01:00.718Z | input |
| 1990 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-13 / status in_progress / PBP 29건 (score 14 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:01:10.651Z | input |
| 1992 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-15 / status in_progress / PBP 30건 (score 15 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:01:20.810Z | input |
| 1994 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-15 / status in_progress / PBP 30건 (score 15 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:01:30.612Z | input |
| 1996 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-15 / status in_progress / PBP 30건 (score 15 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:01:40.682Z | input |
| 1998 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-15 / status in_progress / PBP 30건 (score 15 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:01:50.702Z | input |
| 2000 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-15 / status in_progress / PBP 30건 (score 15 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:02:00.706Z | input |
| 2002 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-15 / status in_progress / PBP 30건 (score 15 / foul 13 / poss 2 = JB1+HB1) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:02:10.708Z | input |
| 2004 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-15 / status in_progress / PBP 31건 (score 15 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:02:20.964Z | input |
| 2006 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-15 / status in_progress / PBP 31건 (score 15 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:02:30.701Z | input |
| 2008 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-17 / status in_progress / PBP 32건 (score 16 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:02:40.663Z | input |
| 2010 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-17 / status in_progress / PBP 32건 (score 16 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:02:50.661Z | input |
| 2012 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-17 / status in_progress / PBP 32건 (score 16 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:03:00.699Z | input |
| 2014 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-17 / status in_progress / PBP 32건 (score 16 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:03:10.609Z | input |
| 2016 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-19 / status in_progress / PBP 33건 (score 17 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:03:20.708Z | input |
| 2018 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-19 / status in_progress / PBP 33건 (score 17 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:03:30.872Z | input |
| 2020 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-21 / status in_progress / PBP 34건 (score 18 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:03:40.769Z | input |
| 2022 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-21 / status in_progress / PBP 34건 (score 18 / foul 13 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:03:50.717Z | input |
| 2024 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-21 / status in_progress / PBP 35건 (score 18 / foul 14 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:04:00.702Z | input |
| 2026 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-21 / status in_progress / PBP 35건 (score 18 / foul 14 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:04:10.740Z | input |
| 2028 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-21 / status in_progress / PBP 35건 (score 18 / foul 14 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:04:20.672Z | input |
| 2029 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 9-21 / status completed / PBP 35건 (score 18 / foul 14 / poss 3 = JB1+HB2) / Stat 7명 / TO 2건 (home 1 / away 1) / Lineup home 9명 / away 6명 | 3431 | 2026-05-16T03:04:27.190Z | input |

### admin_logs (시간순)
| id | action | admin | created_at |
|----|--------|-------|------------|
| 131 | auto_match_youtube_cron | 1 | 2026-05-16T02:45:24.569Z |

## C 매치 186 — MPS 18/41 (헤더 16/41) (id=186)

### 매치 헤더
| 컬럼 | 값 |
|------|-----|
| home / away | 강동SK (301) vs 인천현대모비스 (299) |
| homeScore / awayScore | 16 / 41 |
| status / winner | completed / 299 |
| recording_mode | paper |
| quarter_scores | `{"away":{"ot":[],"q1":24,"q2":17,"q3":0,"q4":0},"home":{"ot":[],"q1":3,"q2":13,"q3":0,"q4":0}}` |
| created / updated / ended | 2026-05-11T10:35:26.699Z / 2026-05-16T09:21:45.846Z / NULL |

### MatchPlayerStat (points > 0 / updated_at ASC)
| ttp_id | 팀 | 등번호 | 선수 | points | FG/FT/3P made | updated_at |
|--------|-----|--------|------|--------|----------------|------------|
| 4244 | H | 10 | - | 2 | 1/0/0 | 2026-05-16T08:58:42.740Z |
| 4249 | H | 71 | - | 11 | 4/1/2 | 2026-05-16T09:21:44.243Z |
| 4246 | H | 14 | - | 3 | 1/1/0 | 2026-05-16T09:21:44.244Z |
| 3656 | A | 16 | - | 3 | 1/0/1 | 2026-05-16T09:21:44.245Z |
| 3651 | A | 1 | - | 2 | 1/0/0 | 2026-05-16T09:21:44.245Z |
| 3650 | A | 15 | - | 10 | 5/0/0 | 2026-05-16T09:21:44.246Z |
| 3655 | A | 0 | - | 7 | 3/0/1 | 2026-05-16T09:21:44.246Z |
| 3654 | A | 5 | - | 6 | 3/0/0 | 2026-05-16T09:21:44.246Z |
| 3649 | A | 12 | - | 5 | 2/0/1 | 2026-05-16T09:21:44.246Z |
| 3653 | A | 32 | - | 4 | 2/0/0 | 2026-05-16T09:21:44.246Z |
| 3652 | A | 13 | - | 4 | 2/0/0 | 2026-05-16T09:21:44.246Z |
| 4245 | H | 13 | - | 2 | 1/0/0 | 2026-05-16T09:21:44.246Z |

> **MPS 합**: 홈 18 / 어웨이 41

### PBP 분포 (action_type별)
| 팀 | Q | action | subtype | 건수 | pts 합 | local_id 샘플 |
|-----|---|--------|---------|------|--------|---------------|
| A | 1 | foul | - | 2 | 0 | paper-fix-b547b83d-1aae-4c01-8 |
| A | 1 | shot_made | 2pt | 9 | 18 | paper-fix-44136cb1-fcc1-4307-b |
| A | 1 | shot_made | 3pt | 2 | 6 | paper-fix-35a892e1-9977-4b6b-a |
| H | 1 | foul | - | 1 | 0 | paper-fix-38d09de9-2e35-4a4d-9 |
| H | 1 | shot_made | 3pt | 1 | 3 | paper-fix-d6156119-d99f-461e-8 |
| A | 2 | foul | - | 4 | 0 | paper-fix-31dada8d-a0fb-4553-9 |
| A | 2 | shot_made | 2pt | 7 | 14 | paper-fix-2be38c84-0644-4fdf-9 |
| A | 2 | shot_made | 3pt | 1 | 3 | paper-fix-e16023b3-e6e3-498e-9 |
| H | 2 | foul | - | 1 | 0 | paper-fix-b6cac95a-7808-47b4-a |
| H | 2 | shot_made | 1pt | 2 | 2 | paper-fix-8e0d90fb-62d9-4dc5-a |
| H | 2 | shot_made | 2pt | 4 | 8 | paper-fix-10d64d81-be7a-4a5c-a |
| H | 2 | shot_made | 3pt | 1 | 3 | paper-fix-ba0b856d-93aa-4d92-9 |

### tournament_match_audits (시간순)
| id | source | context | by | changed_at | changes 키 |
|----|--------|---------|-----|------------|------------|
| 240 | mode_switch | bulk_mode_switch all → paper: 경기원 교육 및 인원 부족 | 2999 | 2026-05-15T07:20:38.542Z | scope,reason,recording_mode |
| 5120 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-0 / status in_progress / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:57:42.693Z | input |
| 5122 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-2 / status in_progress / PBP 2건 (score 1 / foul 0 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:57:49.164Z | input |
| 5123 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-2 / status in_progress / PBP 2건 (score 1 / foul 0 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:57:52.819Z | input |
| 5125 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-2 / status in_progress / PBP 2건 (score 1 / foul 0 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:58:02.768Z | input |
| 5127 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-4 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:58:12.763Z | input |
| 5129 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-4 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:58:22.842Z | input |
| 5131 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 0-4 / status in_progress / PBP 3건 (score 2 / foul 0 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:58:32.840Z | input |
| 5133 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 2-6 / status in_progress / PBP 5건 (score 4 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:58:42.870Z | input |
| 5135 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-6 / status in_progress / PBP 5건 (score 4 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:58:52.885Z | input |
| 5137 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-9 / status in_progress / PBP 6건 (score 5 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:59:02.867Z | input |
| 5139 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-9 / status in_progress / PBP 6건 (score 5 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:59:12.991Z | input |
| 5141 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-9 / status in_progress / PBP 6건 (score 5 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:59:22.898Z | input |
| 5143 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-9 / status in_progress / PBP 6건 (score 5 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:59:32.899Z | input |
| 5145 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-11 / status in_progress / PBP 7건 (score 6 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:59:43.202Z | input |
| 5147 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-11 / status in_progress / PBP 7건 (score 6 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T08:59:52.757Z | input |
| 5149 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 8건 (score 7 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:00:02.883Z | input |
| 5151 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 8건 (score 7 / foul 0 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:00:12.907Z | input |
| 5153 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 9건 (score 7 / foul 1 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:00:22.904Z | input |
| 5155 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 9건 (score 7 / foul 1 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:00:32.799Z | input |
| 5157 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 9건 (score 7 / foul 1 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:00:42.977Z | input |
| 5159 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 9건 (score 7 / foul 1 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:00:52.890Z | input |
| 5161 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 9건 (score 7 / foul 1 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:01:02.962Z | input |
| 5163 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 9건 (score 7 / foul 1 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:01:12.853Z | input |
| 5165 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-13 / status in_progress / PBP 9건 (score 7 / foul 1 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:01:22.822Z | input |
| 5167 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 10건 (score 8 / foul 1 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:01:33.032Z | input |
| 5169 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 10건 (score 8 / foul 1 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:01:43.011Z | input |
| 5171 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 10건 (score 8 / foul 1 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:01:52.901Z | input |
| 5173 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 10건 (score 8 / foul 1 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:02:02.903Z | input |
| 5175 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 10건 (score 8 / foul 1 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:02:12.892Z | input |
| 5178 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:02:24.546Z | input |
| 5179 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:02:33.679Z | input |
| 5181 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:02:42.899Z | input |
| 5183 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:02:52.887Z | input |
| 5185 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:03:02.930Z | input |
| 5187 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:03:13.004Z | input |
| 5189 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:03:22.982Z | input |
| 5191 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:03:32.960Z | input |
| 5193 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:03:42.874Z | input |
| 5195 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:03:53.064Z | input |
| 5197 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:04:03.007Z | input |
| 5199 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:04:12.878Z | input |
| 5201 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:04:22.890Z | input |
| 5203 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:04:32.911Z | input |
| 5205 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-15 / status in_progress / PBP 11건 (score 8 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:04:42.862Z | input |
| 5207 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-18 / status in_progress / PBP 12건 (score 9 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:04:52.794Z | input |
| 5209 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-18 / status in_progress / PBP 12건 (score 9 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:05:02.879Z | input |
| 5211 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-18 / status in_progress / PBP 12건 (score 9 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:05:12.858Z | input |
| 5213 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 13건 (score 10 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:05:22.881Z | input |
| 5215 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 13건 (score 10 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:05:32.975Z | input |
| 5217 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 13건 (score 10 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:05:43.002Z | input |
| 5219 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 13건 (score 10 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:05:52.869Z | input |
| 5221 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 13건 (score 10 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:06:02.897Z | input |
| 5223 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 13건 (score 10 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:06:12.793Z | input |
| 5225 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 13건 (score 10 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:06:22.952Z | input |
| 5227 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 13건 (score 10 / foul 2 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:06:32.876Z | input |
| 5229 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 14건 (score 10 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:06:42.899Z | input |
| 5231 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 14건 (score 10 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:06:52.861Z | input |
| 5233 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 14건 (score 10 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:07:02.805Z | input |
| 5235 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 14건 (score 10 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:07:13.057Z | input |
| 5237 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 14건 (score 10 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:07:22.892Z | input |
| 5239 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 14건 (score 10 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:07:32.819Z | input |
| 5241 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 14건 (score 10 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:07:42.888Z | input |
| 5243 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-20 / status in_progress / PBP 14건 (score 10 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:07:52.995Z | input |
| 5245 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-22 / status in_progress / PBP 15건 (score 11 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:08:02.998Z | input |
| 5247 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-22 / status in_progress / PBP 15건 (score 11 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:08:12.914Z | input |
| 5249 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-22 / status in_progress / PBP 15건 (score 11 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:08:23.071Z | input |
| 5251 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-22 / status in_progress / PBP 15건 (score 11 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:08:33.011Z | input |
| 5253 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 16건 (score 12 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:08:42.865Z | input |
| 5255 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 16건 (score 12 / foul 3 / poss 1 = JB1+HB0) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:08:52.835Z | input |
| 5257 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 17건 (score 12 / foul 3 / poss 2 = JB1+HB1) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:09:02.906Z | input |
| 5259 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 18건 (score 12 / foul 3 / poss 3 = JB1+HB2) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:09:12.928Z | input |
| 5261 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 18건 (score 12 / foul 3 / poss 3 = JB1+HB2) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:09:22.825Z | input |
| 5263 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 18건 (score 12 / foul 3 / poss 3 = JB1+HB2) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:09:32.951Z | input |
| 5265 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 18건 (score 12 / foul 3 / poss 3 = JB1+HB2) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:09:42.859Z | input |
| 5267 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 18건 (score 12 / foul 3 / poss 3 = JB1+HB2) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:09:52.840Z | input |
| 5269 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 18건 (score 12 / foul 3 / poss 3 = JB1+HB2) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:10:02.969Z | input |
| 5271 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 3-24 / status in_progress / PBP 19건 (score 12 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:10:12.865Z | input |
| 5273 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-24 / status in_progress / PBP 20건 (score 13 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:10:22.840Z | input |
| 5275 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-24 / status in_progress / PBP 20건 (score 13 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:10:32.859Z | input |
| 5277 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-24 / status in_progress / PBP 20건 (score 13 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:10:42.851Z | input |
| 5279 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-26 / status in_progress / PBP 21건 (score 14 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:10:52.980Z | input |
| 5281 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-26 / status in_progress / PBP 21건 (score 14 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:11:03.391Z | input |
| 5283 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-26 / status in_progress / PBP 21건 (score 14 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:11:12.978Z | input |
| 5285 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-26 / status in_progress / PBP 21건 (score 14 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:11:22.982Z | input |
| 5287 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-26 / status in_progress / PBP 21건 (score 14 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:11:32.878Z | input |
| 5289 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-26 / status in_progress / PBP 21건 (score 14 / foul 3 / poss 4 = JB1+HB3) / Stat 7명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:11:42.898Z | input |
| 5291 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-26 / status in_progress / PBP 22건 (score 14 / foul 4 / poss 4 = JB1+HB3) / Stat 8명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:11:52.956Z | input |
| 5293 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 5-26 / status in_progress / PBP 22건 (score 14 / foul 4 / poss 4 = JB1+HB3) / Stat 8명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:12:02.993Z | input |
| 5295 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-26 / status in_progress / PBP 23건 (score 15 / foul 4 / poss 4 = JB1+HB3) / Stat 8명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:12:12.970Z | input |
| 5297 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-28 / status in_progress / PBP 24건 (score 16 / foul 4 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:12:22.981Z | input |
| 5299 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-28 / status in_progress / PBP 24건 (score 16 / foul 4 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:12:32.963Z | input |
| 5301 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-28 / status in_progress / PBP 24건 (score 16 / foul 4 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:12:43.012Z | input |
| 5303 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-28 / status in_progress / PBP 24건 (score 16 / foul 4 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:12:52.935Z | input |
| 5305 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-30 / status in_progress / PBP 25건 (score 17 / foul 4 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:13:02.935Z | input |
| 5307 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-30 / status in_progress / PBP 25건 (score 17 / foul 4 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:13:13.227Z | input |
| 5310 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-30 / status in_progress / PBP 25건 (score 17 / foul 4 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:13:22.884Z | input |
| 5311 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-30 / status in_progress / PBP 26건 (score 17 / foul 5 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:13:32.902Z | input |
| 5312 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-30 / status in_progress / PBP 26건 (score 17 / foul 5 / poss 4 = JB1+HB3) / Stat 9명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:13:42.956Z | input |
| 5313 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-33 / status in_progress / PBP 27건 (score 18 / foul 5 / poss 4 = JB1+HB3) / Stat 10명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:13:52.933Z | input |
| 5314 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-33 / status in_progress / PBP 27건 (score 18 / foul 5 / poss 4 = JB1+HB3) / Stat 10명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:14:02.874Z | input |
| 5315 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-33 / status in_progress / PBP 28건 (score 18 / foul 6 / poss 4 = JB1+HB3) / Stat 10명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:14:12.974Z | input |
| 5316 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-33 / status in_progress / PBP 28건 (score 18 / foul 6 / poss 4 = JB1+HB3) / Stat 10명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:14:22.924Z | input |
| 5317 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 7-33 / status in_progress / PBP 28건 (score 18 / foul 6 / poss 4 = JB1+HB3) / Stat 10명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:14:33.003Z | input |
| 5318 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 8-33 / status in_progress / PBP 29건 (score 19 / foul 6 / poss 4 = JB1+HB3) / Stat 11명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:14:42.909Z | input |
| 5319 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 8-33 / status in_progress / PBP 29건 (score 19 / foul 6 / poss 4 = JB1+HB3) / Stat 11명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:14:52.960Z | input |
| 5320 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 8-33 / status in_progress / PBP 29건 (score 19 / foul 6 / poss 4 = JB1+HB3) / Stat 11명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:15:03.035Z | input |
| 5321 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 8-33 / status in_progress / PBP 29건 (score 19 / foul 6 / poss 4 = JB1+HB3) / Stat 11명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:15:12.928Z | input |
| 5322 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 10-33 / status in_progress / PBP 30건 (score 20 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:15:22.890Z | input |
| 5323 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 10-33 / status in_progress / PBP 30건 (score 20 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:15:32.969Z | input |
| 5324 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 10-33 / status in_progress / PBP 30건 (score 20 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:15:42.930Z | input |
| 5326 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 10-33 / status in_progress / PBP 30건 (score 20 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:15:52.952Z | input |
| 5327 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 10-33 / status in_progress / PBP 30건 (score 20 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:16:02.887Z | input |
| 5330 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 10-33 / status in_progress / PBP 30건 (score 20 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:16:12.946Z | input |
| 5332 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 10-33 / status in_progress / PBP 30건 (score 20 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:16:22.989Z | input |
| 5334 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 10-33 / status in_progress / PBP 30건 (score 20 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:16:32.998Z | input |
| 5336 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-33 / status in_progress / PBP 31건 (score 21 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:16:42.920Z | input |
| 5338 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-33 / status in_progress / PBP 31건 (score 21 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:16:52.846Z | input |
| 5340 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-33 / status in_progress / PBP 31건 (score 21 / foul 6 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:17:02.938Z | input |
| 5342 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-33 / status in_progress / PBP 32건 (score 21 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:17:13.048Z | input |
| 5344 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-33 / status in_progress / PBP 32건 (score 21 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:17:22.918Z | input |
| 5346 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-33 / status in_progress / PBP 32건 (score 21 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:17:32.948Z | input |
| 5348 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-33 / status in_progress / PBP 32건 (score 21 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:17:42.926Z | input |
| 5350 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-33 / status in_progress / PBP 32건 (score 21 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:17:52.952Z | input |
| 5352 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-35 / status in_progress / PBP 33건 (score 22 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:18:02.918Z | input |
| 5355 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 12-35 / status in_progress / PBP 33건 (score 22 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:18:12.905Z | input |
| 5357 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 15-35 / status in_progress / PBP 34건 (score 23 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:18:23.090Z | input |
| 5359 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 15-35 / status in_progress / PBP 34건 (score 23 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:18:32.923Z | input |
| 5361 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 15-35 / status in_progress / PBP 34건 (score 23 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:18:42.970Z | input |
| 5363 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 15-35 / status in_progress / PBP 34건 (score 23 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:18:53.031Z | input |
| 5365 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 15-35 / status in_progress / PBP 34건 (score 23 / foul 7 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:19:02.938Z | input |
| 5367 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 15-35 / status in_progress / PBP 35건 (score 23 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:19:13.102Z | input |
| 5369 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 15-35 / status in_progress / PBP 35건 (score 23 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:19:22.994Z | input |
| 5371 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 15-35 / status in_progress / PBP 35건 (score 23 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:19:32.979Z | input |
| 5373 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-35 / status in_progress / PBP 36건 (score 24 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:19:42.990Z | input |
| 5375 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-35 / status in_progress / PBP 36건 (score 24 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:19:52.977Z | input |
| 5377 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-37 / status in_progress / PBP 37건 (score 25 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:20:03.050Z | input |
| 5379 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-37 / status in_progress / PBP 37건 (score 25 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:20:12.933Z | input |
| 5381 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-37 / status in_progress / PBP 37건 (score 25 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:20:22.949Z | input |
| 5383 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-39 / status in_progress / PBP 38건 (score 26 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:20:32.957Z | input |
| 5385 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-39 / status in_progress / PBP 38건 (score 26 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:20:42.901Z | input |
| 5387 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-39 / status in_progress / PBP 38건 (score 26 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:20:52.969Z | input |
| 5389 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-41 / status in_progress / PBP 39건 (score 27 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:21:02.952Z | input |
| 5391 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-41 / status in_progress / PBP 39건 (score 27 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:21:12.984Z | input |
| 5393 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-41 / status in_progress / PBP 39건 (score 27 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:21:23.004Z | input |
| 5395 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-41 / status in_progress / PBP 39건 (score 27 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:21:32.996Z | input |
| 5397 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-41 / status in_progress / PBP 39건 (score 27 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:21:42.977Z | input |
| 5398 | web-score-sheet | score-sheet 입력 by BDR기록원관리자 / 점수 16-41 / status completed / PBP 39건 (score 27 / foul 8 / poss 4 = JB1+HB3) / Stat 12명 / Lineup home 6명 / away 8명 | 3431 | 2026-05-16T09:21:44.645Z | input |

### admin_logs (시간순)
| id | action | admin | created_at |
|----|--------|-------|------------|
| 152 | auto_match_youtube_cron | 1 | 2026-05-16T09:00:13.314Z |

## D 매치 170 — 헤더 11/1 / 다른 source 0/0 (id=170)

### 매치 헤더
| 컬럼 | 값 |
|------|-----|
| home / away | 분당SFA (288) vs 스티즈강남 (294) |
| homeScore / awayScore | 11 / 1 |
| status / winner | completed / 288 |
| recording_mode | paper |
| quarter_scores | `{"away":{"ot":[],"q1":0,"q2":0,"q3":0,"q4":0},"home":{"ot":[],"q1":0,"q2":0,"q3":0,"q4":0}}` |
| created / updated / ended | 2026-05-11T10:35:21.927Z / 2026-05-17T03:10:24.470Z / 2026-05-16T11:36:50.825Z |

### MatchPlayerStat (points > 0 / updated_at ASC)
> MPS 박제 0건

### PBP 분포 (action_type별)
> PBP 박제 0건

### tournament_match_audits (시간순)
| id | source | context | by | changed_at | changes 키 |
|----|--------|---------|-----|------------|------------|
| 218 | mode_switch | bulk_mode_switch all → paper: 경기원 교육 및 인원 부족 | 2999 | 2026-05-15T07:20:38.542Z | scope,reason,recording_mode |

### admin_logs (시간순)
| id | action | admin | created_at |
|----|--------|-------|------------|
| 169 | auto_match_youtube_cron | 1 | 2026-05-17T03:10:21.503Z |

## D 매치 187 — 헤더 26/13 / 다른 source 0/0 (id=187)

### 매치 헤더
| 컬럼 | 값 |
|------|-----|
| home / away | 업핑 (298) vs 스티즈 (300) |
| homeScore / awayScore | 26 / 13 |
| status / winner | completed / 298 |
| recording_mode | paper |
| quarter_scores | `{"away":{"ot":[],"q1":0,"q2":0,"q3":0,"q4":0},"home":{"ot":[],"q1":0,"q2":0,"q3":0,"q4":0}}` |
| created / updated / ended | 2026-05-11T10:35:26.978Z / 2026-05-16T11:36:50.760Z / 2026-05-16T11:36:50.760Z |

### MatchPlayerStat (points > 0 / updated_at ASC)
> MPS 박제 0건

### PBP 분포 (action_type별)
> PBP 박제 0건

### tournament_match_audits (시간순)
| id | source | context | by | changed_at | changes 키 |
|----|--------|---------|-----|------------|------------|
| 236 | mode_switch | bulk_mode_switch all → paper: 경기원 교육 및 인원 부족 | 2999 | 2026-05-15T07:20:38.542Z | scope,reason,recording_mode |

## B 매치 208 — PBP 12/12 (헤더 22/16) (id=208)

### 매치 헤더
| 컬럼 | 값 |
|------|-----|
| home / away | 강남삼성 (277) vs 강동SK (278) |
| homeScore / awayScore | 22 / 16 |
| status / winner | completed / 277 |
| recording_mode | paper |
| quarter_scores | `{"away":{"ot":[],"q1":6,"q2":6,"q3":2,"q4":2},"home":{"ot":[],"q1":8,"q2":4,"q3":5,"q4":5}}` |
| created / updated / ended | 2026-05-11T10:35:32.682Z / 2026-05-17T06:24:14.802Z / NULL |

### MatchPlayerStat (points > 0 / updated_at ASC)
| ttp_id | 팀 | 등번호 | 선수 | points | FG/FT/3P made | updated_at |
|--------|-----|--------|------|--------|----------------|------------|
| 3856 | H | 7 | - | 11 | 3/4/1 | 2026-05-17T06:24:12.259Z |
| 3855 | H | 23 | - | 7 | 2/3/0 | 2026-05-17T06:24:12.260Z |
| 3854 | H | 2 | - | 2 | 1/0/0 | 2026-05-17T06:24:12.260Z |
| 3864 | H | 0 | - | 2 | 1/0/0 | 2026-05-17T06:24:12.260Z |
| 2881 | A | 22 | - | 9 | 2/4/1 | 2026-05-17T06:24:12.261Z |
| 2882 | A | 7 | - | 7 | 2/3/0 | 2026-05-17T06:24:12.261Z |

> **MPS 합**: 홈 22 / 어웨이 16

### PBP 분포 (action_type별)
| 팀 | Q | action | subtype | 건수 | pts 합 | local_id 샘플 |
|-----|---|--------|---------|------|--------|---------------|
| H | 1 | foul | - | 5 | 0 | paper-fix-017ab5fe-5117-4082-9 |
| H | 1 | shot_made | 2pt | 4 | 8 | paper-fix-0148f49f-cebf-45d5-8 |
| A | 1 | foul | - | 1 | 0 | paper-fix-4c84c41b-57b4-446b-b |
| A | 1 | shot_made | 1pt | 4 | 4 | paper-fix-20dea836-5866-4242-8 |
| A | 1 | shot_made | 2pt | 1 | 2 | paper-fix-1a9b6e58-13d7-4e1d-a |
| H | 2 | foul | - | 3 | 0 | paper-fix-2f0e54c9-a26d-4e28-8 |
| H | 2 | shot_made | 1pt | 4 | 4 | paper-fix-0183ff9e-462e-4812-9 |
| A | 2 | foul | - | 2 | 0 | paper-fix-e4fc9c16-7cc1-459e-b |
| A | 2 | shot_made | 1pt | 1 | 1 | paper-fix-a2ad5735-7744-4808-b |
| A | 2 | shot_made | 2pt | 1 | 2 | paper-fix-35c330f6-cad2-47d1-8 |
| A | 2 | shot_made | 3pt | 1 | 3 | paper-fix-b945b729-611d-4401-a |

### tournament_match_audits (시간순)
| id | source | context | by | changed_at | changes 키 |
|----|--------|---------|-----|------------|------------|
| 252 | mode_switch | bulk_mode_switch all → paper: 경기원 교육 및 인원 부족 | 2999 | 2026-05-15T07:20:38.542Z | scope,reason,recording_mode |
| 8677 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:44:56.184Z | input |
| 8678 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:45:06.143Z | input |
| 8679 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:45:16.141Z | input |
| 8680 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:45:26.093Z | input |
| 8681 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:45:36.129Z | input |
| 8682 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:45:46.099Z | input |
| 8683 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:45:56.039Z | input |
| 8684 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:46:06.156Z | input |
| 8685 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:46:16.030Z | input |
| 8686 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:46:26.180Z | input |
| 8687 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:46:36.151Z | input |
| 8688 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:47:00.385Z | input |
| 8689 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:47:10.381Z | input |
| 8690 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:47:20.362Z | input |
| 8691 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:47:25.148Z | input |
| 8692 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:47:30.420Z | input |
| 8693 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:47:40.409Z | input |
| 8694 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:47:50.381Z | input |
| 8695 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:48:00.392Z | input |
| 8696 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:48:10.410Z | input |
| 8697 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:48:20.418Z | input |
| 8698 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:48:31.776Z | input |
| 8699 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 1건 (score 0 / foul 0 / poss 1 = JB1+HB0) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:48:41.640Z | input |
| 8700 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-0 / status in_progress / PBP 2건 (score 0 / foul 1 / poss 1 = JB1+HB0) / Stat 1명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:48:51.810Z | input |
| 8701 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-1 / status in_progress / PBP 3건 (score 1 / foul 1 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:49:01.766Z | input |
| 8702 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 0-1 / status in_progress / PBP 3건 (score 1 / foul 1 / poss 1 = JB1+HB0) / Stat 2명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:49:11.771Z | input |
| 8703 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 3-1 / status in_progress / PBP 4건 (score 2 / foul 1 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:49:21.776Z | input |
| 8704 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 2-1 / status in_progress / PBP 4건 (score 2 / foul 1 / poss 1 = JB1+HB0) / Stat 3명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:49:34.759Z | input |
| 8705 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 2-1 / status in_progress / PBP 5건 (score 2 / foul 2 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:49:44.748Z | input |
| 8706 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 2-1 / status in_progress / PBP 5건 (score 2 / foul 2 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:49:54.787Z | input |
| 8707 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 2-1 / status in_progress / PBP 5건 (score 2 / foul 2 / poss 1 = JB1+HB0) / Stat 4명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:50:04.705Z | input |
| 8708 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-1 / status in_progress / PBP 6건 (score 3 / foul 2 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:50:14.733Z | input |
| 8709 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-1 / status in_progress / PBP 6건 (score 3 / foul 2 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:50:24.787Z | input |
| 8710 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-1 / status in_progress / PBP 6건 (score 3 / foul 2 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:50:35.029Z | input |
| 8711 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-1 / status in_progress / PBP 7건 (score 3 / foul 3 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:50:44.843Z | input |
| 8712 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-3 / status in_progress / PBP 8건 (score 4 / foul 3 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:50:54.832Z | input |
| 8713 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-3 / status in_progress / PBP 8건 (score 4 / foul 3 / poss 1 = JB1+HB0) / Stat 5명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:51:04.755Z | input |
| 8714 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-3 / status in_progress / PBP 9건 (score 4 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:51:14.747Z | input |
| 8715 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-3 / status in_progress / PBP 9건 (score 4 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:51:24.871Z | input |
| 8716 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-3 / status in_progress / PBP 9건 (score 4 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:51:34.770Z | input |
| 8717 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-3 / status in_progress / PBP 9건 (score 4 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:51:45.502Z | input |
| 8718 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-3 / status in_progress / PBP 9건 (score 4 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:51:55.083Z | input |
| 8719 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 4-3 / status in_progress / PBP 9건 (score 4 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:52:04.764Z | input |
| 8720 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 10건 (score 5 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:52:14.949Z | input |
| 8721 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 10건 (score 5 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:52:24.910Z | input |
| 8722 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 10건 (score 5 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:52:34.831Z | input |
| 8723 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 10건 (score 5 / foul 4 / poss 1 = JB1+HB0) / Stat 6명 / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:52:44.797Z | input |
| 8724 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:52:54.826Z | input |
| 8725 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:53:04.829Z | input |
| 8726 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:53:14.770Z | input |
| 8727 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:53:24.853Z | input |
| 8728 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:53:34.880Z | input |
| 8729 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:53:44.893Z | input |
| 8730 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:53:54.824Z | input |
| 8731 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:54:04.826Z | input |
| 8732 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:54:14.886Z | input |
| 8733 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:54:24.835Z | input |
| 8734 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:54:34.851Z | input |
| 8735 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-3 / status in_progress / PBP 11건 (score 5 / foul 5 / poss 1 = JB1+HB0) / Stat 6명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:54:44.813Z | input |
| 8736 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-4 / status in_progress / PBP 12건 (score 6 / foul 5 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:54:54.823Z | input |
| 8737 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-4 / status in_progress / PBP 12건 (score 6 / foul 5 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:55:04.753Z | input |
| 8738 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-4 / status in_progress / PBP 12건 (score 6 / foul 5 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:55:14.667Z | input |
| 8739 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-4 / status in_progress / PBP 12건 (score 6 / foul 5 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:55:24.676Z | input |
| 8740 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-4 / status in_progress / PBP 13건 (score 6 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:55:34.769Z | input |
| 8741 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-4 / status in_progress / PBP 13건 (score 6 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:55:44.649Z | input |
| 8742 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-5 / status in_progress / PBP 14건 (score 7 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:55:54.916Z | input |
| 8743 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-6 / status in_progress / PBP 15건 (score 8 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:56:04.872Z | input |
| 8744 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 6-6 / status in_progress / PBP 15건 (score 8 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:56:14.859Z | input |
| 8745 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:56:24.863Z | input |
| 8746 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:56:34.847Z | input |
| 8747 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:56:44.781Z | input |
| 8748 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:56:55.019Z | input |
| 8749 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:57:04.829Z | input |
| 8750 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:57:14.892Z | input |
| 8751 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:57:24.835Z | input |
| 8752 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:57:34.850Z | input |
| 8753 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:57:44.919Z | input |
| 8754 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:57:54.879Z | input |
| 8755 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:58:04.855Z | input |
| 8756 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 16건 (score 9 / foul 6 / poss 1 = JB1+HB0) / Stat 7명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:58:14.846Z | input |
| 8757 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 8-6 / status in_progress / PBP 17건 (score 9 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:58:24.814Z | input |
| 8758 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 9-6 / status in_progress / PBP 18건 (score 10 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:58:34.792Z | input |
| 8759 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 9-6 / status in_progress / PBP 18건 (score 10 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:58:44.759Z | input |
| 8760 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-6 / status in_progress / PBP 19건 (score 11 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:58:54.801Z | input |
| 8761 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-6 / status in_progress / PBP 19건 (score 11 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:59:04.740Z | input |
| 8762 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-6 / status in_progress / PBP 19건 (score 11 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:59:14.897Z | input |
| 8763 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:59:24.798Z | input |
| 8764 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:59:34.861Z | input |
| 8765 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:59:44.891Z | input |
| 8766 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T05:59:55.231Z | input |
| 8767 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:00:04.864Z | input |
| 8768 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:00:14.998Z | input |
| 8769 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:00:24.864Z | input |
| 8770 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:00:34.967Z | input |
| 8771 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:00:45.233Z | input |
| 8772 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:00:54.887Z | input |
| 8773 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 20건 (score 12 / foul 7 / poss 1 = JB1+HB0) / Stat 8명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:01:04.962Z | input |
| 8774 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 21건 (score 12 / foul 8 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:01:14.927Z | input |
| 8775 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 21건 (score 12 / foul 8 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:01:25.085Z | input |
| 8776 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 21건 (score 12 / foul 8 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:01:35.064Z | input |
| 8777 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 21건 (score 12 / foul 8 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:01:45.050Z | input |
| 8778 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 21건 (score 12 / foul 8 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:01:54.871Z | input |
| 8779 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 21건 (score 12 / foul 8 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:02:04.881Z | input |
| 8780 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 21건 (score 12 / foul 8 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:02:14.871Z | input |
| 8781 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 22건 (score 12 / foul 9 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:02:25.419Z | input |
| 8782 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 22건 (score 12 / foul 9 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:02:35.126Z | input |
| 8783 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 22건 (score 12 / foul 9 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:02:46.508Z | input |
| 8784 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 22건 (score 12 / foul 9 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:02:54.962Z | input |
| 8785 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 22건 (score 12 / foul 9 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:03:04.939Z | input |
| 8786 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 10-9 / status in_progress / PBP 22건 (score 12 / foul 9 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:03:14.947Z | input |
| 8787 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-9 / status in_progress / PBP 24건 (score 14 / foul 9 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:03:25.045Z | input |
| 8788 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-9 / status in_progress / PBP 24건 (score 14 / foul 9 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:03:34.878Z | input |
| 8789 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-9 / status in_progress / PBP 25건 (score 14 / foul 10 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:03:45.208Z | input |
| 8790 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-9 / status in_progress / PBP 25건 (score 14 / foul 10 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:03:54.927Z | input |
| 8791 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-9 / status in_progress / PBP 25건 (score 14 / foul 10 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:04:04.873Z | input |
| 8792 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-9 / status in_progress / PBP 25건 (score 14 / foul 10 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:04:14.877Z | input |
| 8793 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-9 / status in_progress / PBP 26건 (score 14 / foul 11 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:04:24.960Z | input |
| 8794 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-9 / status in_progress / PBP 26건 (score 14 / foul 11 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:04:34.865Z | input |
| 8795 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-10 / status in_progress / PBP 27건 (score 15 / foul 11 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:04:44.881Z | input |
| 8796 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-10 / status in_progress / PBP 27건 (score 15 / foul 11 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:04:54.843Z | input |
| 8797 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-12 / status in_progress / PBP 28건 (score 16 / foul 11 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:05:04.868Z | input |
| 8798 | web-score-sheet | score-sheet 입력 by 신유경 / 점수 12-12 / status in_progress / PBP 28건 (score 16 / foul 11 / poss 1 = JB1+HB0) / Stat 9명 / TO 1건 (home 0 / away 1) / Lineup home 11명 / away 6명 | 3410 | 2026-05-17T06:05:14.852Z | input |

### admin_logs (시간순)
| id | action | admin | created_at |
|----|--------|-------|------------|
| 174 | auto_register_youtube_video | 1 | 2026-05-17T05:45:38.639Z |
