# 대회 운영 리빌딩 (Track B) — CLI 작업 지시서 + 스키마 대조 (오판 방지)

> 2026-06-19 · 시안 v2.32 = `Dev/design/BDR-current/_handoff-admin-toss-P0/` (IMPLEMENTATION.md + DATA-BINDING v2 + tn-screens/tn-extra + TournamentAdmin.html)
> 메인 지시서(`관리자Toss전환-CLI작업지시서`)의 **Phase 4(트랙 B 대회관리 리빌딩) 상세 + 백엔드 계약**.
> ⚠️ DATA-BINDING v2의 SQL은 **BDR-join-v1 flavor(generic uuid SQL)**. mybdr는 Prisma+BigInt이고 **대부분의 "신규" 항목을 이미 보유**. 아래 대조 없이 계약서대로 따르면 **중복 테이블 생성 → 기존 대회 시스템 파손**.

---

## 🚨 0. 스키마 대조표 — 계약(신규/ALTER) vs mybdr 실제 (가장 중요)

| 계약(DATA-BINDING v2) | mybdr 실제 모델 | 조치 |
|------|------|------|
| `admin_categories` **신규** | 없음 | ✅ **진짜 신규** — 생성 + 4종 시드 |
| `tournament_division_rules` **ALTER ADD** `format`/`settings`/`fee_krw` | `TournamentDivisionRule`에 **`format`·`settings`·`feeKrw` 이미 존재**(Phase 3.5) | ❌ **ALTER 불필요**. 추가하지 말 것 |
| `tournament_team_players` **신규**(로스터 조인) | **`TournamentTeamPlayer` 이미 존재**(tournamentTeamId/userId/jerseyNumber/position/player_name/birth_date/is_elite/isStarter) | ❌ **신규 생성 금지** → 기존 TTP 재사용. 출전선수 선택 = 기존 TTP에 INSERT |
| `recorder_assignments` **신규**(per-match) | `tournament_recorders`(대회 풀 — tournamentId/recorderId/assignedBy)·**per-match 아님** | ⚠️ 풀은 재사용. **경기별 배정**은 미존재 가능 → 신규 필요 여부 검증(또는 TournamentMatch에 컬럼) |
| `tournament_teams.is_waiting boolean` 추가 | `TournamentTeam.waiting_number Int?` **이미 존재** | ❌ is_waiting 추가 금지 → **waiting_number 사용** |
| §6 `brackets`/`groups`/`matches` **신규** | **`TournamentMatch` 이미 존재**(bracket_position/round_number/group_name/group_letter/next_match_id/quarterScores/round_name/match_code/category_letter/division_tier) + `play_by_plays`·`match_events` | ❌ **신규 테이블 절대 금지** → **TournamentMatch 재사용**. 생성 로직은 mybdr 기존 대진/녹아웃 자동편성(`Dev/knockout-auto-schedule-plan` 등) 재사용 |
| `tournament_format_presets`(선택) | 없음 | 보류(미정) |

**공통**: 계약서 uuid PK·snake SQL → mybdr는 **BigInt id + Prisma 모델 + @map snake**. **raw SQL ALTER 금지, Prisma 스키마 변경**으로. div_caps/div_fees: 시안은 rule 권위라지만 mybdr rule엔 **cap 컬럼 없음** → 정원은 기존 `Tournament.div_caps(jsonb)` 유지하거나 rule에 cap 추가 결정(아래 §1).

---

## 1. 실제 마이그레이션 작업 (대조 후 — 진짜 필요한 것만)
1. ✅ **`admin_categories` 신규** (Prisma 모델 + 4종 시드). BigInt id 또는 uuid는 mybdr 컨벤션 따름. 시드: 일반부(D3~D8) / 유청소년(하모니·i1~i4 + U8~U18) / 대학부(U1~U3) / 시니어(S1~S3 + +40~+70). **BDR-join-v1 운영 Supabase에 살아있으면 복사 우선**.
2. ⚠️ **정원 cap 위치 결정**: 현재 cap=`Tournament.div_caps(jsonb)`. rule에 cap 컬럼 추가 vs jsonb 유지 — **PM/구조 결정** 후 진행. (format/settings/feeKrw는 추가 금지)
3. ⚠️ **경기별 기록자 배정**: tournament_recorders(풀)로 충분한지, per-match 배정 컬럼/테이블이 필요한지 검증 후 최소 추가.
4. ❌ TournamentTeamPlayer / TournamentMatch / is_waiting / division_rules 컬럼 = **추가 작업 없음**(이미 존재).

## 2. status / payment 매핑 (§3 — 배선 핵심)
- 시안 4상태 → mybdr: APPLIED→`status=pending` / WAITING→`status=pending` + **`waiting_number` 부여** / CONFIRMED→`status=approved`+`payment_status=paid` / CANCELED→`status=rejected`.
- ⚠️ mybdr `payment_status` 기본값 **`unpaid`**(계약서 'pending' 아님) → 값 집합 `unpaid|paid|refunded` 확인 후 매핑.
- **입금완료(paid)→자동 approved(CONFIRMED) 트리거**. 인라인 셀렉트가 클라 선반영.

## 3. 참가신청 = TournamentTeamPlayer 재사용 (명단입력 폐지)
- 흐름(§4): 로그인 유저 가입 팀 조회 → 팀 선택·정보확인 → 종별/디비전(WAITING 판정) → **기존 팀 로스터(TournamentTeamPlayer 또는 팀 멤버)에서 출전선수 체크** → 제출 시 TournamentTeam INSERT + 출전선수 = **기존 TournamentTeamPlayer에 기록**(신규 테이블 아님).
- 유니폼 = teams 설정값 표시만. 비번 없음(세션).
- ⏳ 최소인원/게스트 = `MIN_PLAYERS_GUARD`/`ALLOW_GUEST` 토글 off(추후 결정).

## 4. WAITING 서버 재판정 (§5)
- `cap = Tournament.div_caps[division]` / `count = COUNT(TournamentTeam WHERE division=? AND status IN (pending,approved))` ≥ cap → WAITING(+waiting_number). **제출 시 서버 재판정**(클라 숫자 신뢰 금지).
- 확정팀 취소 시 가장 오래된 WAITING 1팀 알림.

## 5. 대진표 = TournamentMatch 재사용 (§6 — 신규 테이블 금지)
- 계약 §6 brackets/groups/matches는 **개념 모델**. mybdr 구현 = **기존 `TournamentMatch`**(group_name/group_letter/round_number/bracket_position/next_match_id/match_code 등) + 기존 대진 생성 로직.
- format별 생성(group_stage_knockout/single_elimination/full_league/dual)은 mybdr 기존 자동편성(녹아웃 auto-schedule) 재사용. 시안은 클라 프리뷰 → 실제 TournamentMatch INSERT.

## 6. 화면 (TournamentAdmin.html — Toss, 트랙 B 리빌딩)
탭 통합 1화면: **종별·디비전(생성기) / 참가팀(인라인 status·payment, 입금→자동확정, 대기알림, 팀상세 로스터, CSV) / 대진표(format별) / 기록자(경기별 배정·자동) / 공개·완료(공개토글·가드·결과/MVP)** + 사이드바 **새 대회 위저드(3-step) + 종별 생성기**. 종별 마스터(CategoryMaster) = 설정 탭 통합. 디자인=Toss(메인 지시서 §0 분기).

## 🚦 7. DB 게이트 (승인 필수)
- 진짜 신규 = **admin_categories**(+ cap/recorder 결정분)만 prisma 스키마 변경 → diff 제시 + 사용자 승인. destructive 0. 운영 단일 DB.
- **중복 추가(TTP/Match/is_waiting/division_rule 컬럼) 시도 자체 금지** — 발견 시 중단·보고.

## 8. 검증
- 스키마: 신규는 admin_categories만(+검증된 최소) / 기존 모델 중복 0 / Prisma migrate diff 무손실.
- 배선: status 매핑·입금→확정 / WAITING 서버판정·waiting_number / 출전선수 TTP 기록 / 대진 TournamentMatch 생성 / curl raw snake_case.
- 디자인: TournamentAdmin Toss(라이트·#3182F6·lucide-react), 프론트 무영향.

## 9. 가드
- subin 브랜치, 단계당 1 PR. main 직접 push 금지. dev→main 수빈 수동.
- 에이전트: 스키마/배선 = planner+developer. 에러→errors.md, 결정→decisions.md.

## 10. PM 확인 미결
1. 정원 cap 위치(rule 컬럼 vs Tournament.div_caps jsonb).
2. 경기별 기록자 배정 신규 필요 여부(tournament_recorders 풀로 충분?).
3. admin_categories 옛 데이터 복원(BDR-join-v1 Supabase) vs 시드.
4. 출전 최소인원/게스트 정책.
5. format_presets 도입 여부.

---

## 부록 — CLI 착수 프롬프트
```
[작업] 대회 운영 리빌딩(Track B) + 백엔드 배선. 시안=BDR-current/_handoff-admin-toss-P0/(IMPLEMENTATION.md·DATA-BINDING v2 정독).
🚨 스키마 대조 필수(지시서 §0): 계약 SQL은 BDR-join-v1 flavor. mybdr는 이미 보유 →
 - admin_categories=진짜 신규(생성+4종시드)
 - TournamentDivisionRule.format/settings/feeKrw=이미존재(ALTER 금지)
 - tournament_team_players=기존 TournamentTeamPlayer 재사용(생성금지)
 - brackets/groups/matches=기존 TournamentMatch 재사용(생성금지)
 - is_waiting=기존 waiting_number 사용 / 기록자=tournament_recorders 풀 확인
 raw SQL 금지, Prisma+BigInt. 중복 테이블/컬럼 추가 금지(발견 시 중단).
배선: status 4→pending/approved/rejected+waiting_number, 입금paid→자동approved, WAITING 서버재판정, 출전선수=TTP, 대진=TournamentMatch.
디자인=Toss(관리자 분기). 🚦게이트: admin_categories 등 진짜 신규만 db push 승인.
브랜치 subin, 단계당 1 PR. 지금 §0 대조부터 보고 후 착수.
```
