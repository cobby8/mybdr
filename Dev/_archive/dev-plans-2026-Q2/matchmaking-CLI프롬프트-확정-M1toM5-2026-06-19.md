# 매칭 고도화 — CLI 박제 확정 프롬프트 (M1~M6, schema 실측 대조본)

> (2026-06-19 갱신: 시안 E 호스트 콘솔 반영 — M2에 호스트 신청·대기열 관리(E-1) 추가 / M6 내 경기 대시보드+status맵 정리(E-2) 신설. 결제는 M7로.)

> 2026-06-19 · 운영 `schema.prisma` 실측 대조 완료. v2.35 시안 + DATA-BINDING 계약 기준.
> **상태(2026-06-19)**: 매칭 고도화(M1~M5) **CLI 박제 0건** — git/scratchpad에 흔적 없음(현 CLI 세션은 앱 백엔드 트랙). 즉 M1부터 paste 필요.
> 사용법: 한 Phase = 한 PR(`subin→dev`). 순서 M1 → M2 → M3 → M4 → M5 → M6. 앞 단계 머지 후 다음. (M6의 status맵 정리는 M1 머지 직후 우선 처리 가능.)

---

## ⚠️ 0. DATA-BINDING ↔ 운영 schema 필드명 대조 (전 Phase 공통 — 시안 제안명 그대로 쓰면 버그)

| 시안/DATA-BINDING 제안 | **운영 실제 (사용할 것)** | 비고 |
|------|------|------|
| `starts_at` | **`games.scheduled_at`** | 정렬·종료판정 |
| `duration_min` | **`games.duration_hours`** | 분 아님, 시간 |
| `capacity` | **`games.max_participants`** | |
| `applied_count` | **`games.current_participants`** | 승인된 참가자 수 |
| `fee_amount` | **`games.fee_per_person`** | 0=무료 |
| `lat`,`lng` | **games에 없음** | 좌표는 `courts` 조인 필요. 없으면 "가까운순"·"내 동네" 칩 **비활성** |
| `registrations` 테이블 | **`game_applications`** | |
| `registration.status` 문자열 enum | **`game_applications.status` Int** | 0=신청완료(대기·호스트승인전) / 1=승인(=확정참가) / 2=거절. **waitlist는 신규값 3 추가** |
| `promotion_deadline`,`waitlist_position` | **신규 컬럼(M2 추가)** | NULL 허용 ADD COLUMN |
| `attendances` 테이블 | **불필요 → `game_applications.attended_at`(기존)** | DateTime, 값=출석 / null=미체크 |
| `noshow` 컬럼 | **`game_player_ratings.is_noshow`(기존)** + 출석 파생 | game_applications엔 noshow 컬럼 없음 |
| `manner_score` | **`users.manner_score` Decimal(3,2)** + `manner_count` | 기존(Phase 10) |
| `mvp_count` | **파생** = `games where final_mvp_user_id = user` count | 컬럼 없음 |
| `games_played` | **파생** = 승인+출석 game_applications count | 컬럼 없음 |
| `has_ratings` | **`manner_count > 0`** | |

**status enum 단일 출처**: `src/lib/constants/game-status.ts` (1=모집중,2=확정,3=완료,4=취소). 신청 status는 game_applications 0/1/2(+M2의 3=대기).

---

## ▶ M1 — 성사 코어 + 취소 status 정합 (백엔드, 시안 불필요) — **선행 필수**

```
[작업] 픽업/게스트 경기 "성사·취소" 상태 전환 정상화. (매칭 고도화 Phase M1)
브랜치 subin → subin→dev PR. main 직접 push 금지. DB 운영단일 — schema 변경 없음(status 활용). destructive 시 사용자 승인.

배경(실측):
- 정원 도달해도 games.status 1→2 자동전환 없음 (applications/[appId]/route.ts).
- 취소 DELETE가 status=5 set인데 STATUS_LABEL(game-status.ts)엔 4까지(4=취소) → 라벨 깨짐.
- 취소 시 신청자 알림 미발송 (NOTIFICATION_TYPES.GAME_CANCELLED 상수만, 호출처 0).

요구사항:
1. game-status.ts: status 의미 주석 명문화(0=초안/1=모집중/2=확정/3=완료/4=취소). 취소=4 통일 → DELETE(src/app/api/web/games/[id]/route.ts)의 status:5를 4로. 기존 status=5 데이터 있으면 SELECT count 보고→승인후 UPDATE 4.
2. 정원 자동전환: current_participants==max_participants 도달 시 status 1→2 (apply reserve 또는 승인 트랜잭션 내, apply/route.ts:119 조건부 UPDATE 패턴 활용). 취소/거절로 current<max & status=2면 →1 복귀.
3. 취소 알림: 취소 처리 시 신청자(status 0,1) 전원에게 GAME_CANCELLED 알림 발송(기존 notification 유틸).

검증: 정원 채움→status 2 / 1명 취소→1 복귀 / 취소→신청자 notification + 라벨 "취소" / curl GET raw status(snake_case).
```

---

## ▶ M2 — 대기열 (Waitlist) — 시안 B (v2.35)

```
[작업] 정원 마감 경기를 대기 신청으로 받고, 빈자리 발생 시 알림 후 수동 승격. (Phase M2)
정책 확정: 알림 후 수동(자동승격 아님). 시안=BDR-current/_handoff-matchmaking-M2-M5/(v2.35) GameDetail/MyRegistrationStatus, 계약=DATA-BINDING.md §2-2.
브랜치 subin. schema 변경=NULL 허용 ADD COLUMN만(무중단) → prisma db push 전 diff 사용자 검토.

필드(운영 실측 기준):
- game_applications.status: 0=신청완료/1=승인(확정)/2=거절 + **신규 3=대기(waiting)**.
- 신규 컬럼: game_applications.waitlist_position INT NULL / promotion_deadline TIMESTAMPTZ NULL.
- "promoted"는 별도값 아님 → 파생: status=3 AND promotion_deadline > now(). 만료 시 다음 순번.

요구사항:
1. ADD COLUMN waitlist_position, promotion_deadline (NULL 허용). prisma 모델 반영.
2. 신청(apply/route.ts): 정원 마감(current>=max)이면 FULL 거절 대신 status=3 + waitlist_position=(현재 대기 max+1) 등록. 응답에 "대기 N번".
3. 대기 취소: DELETE → 뒤 순번 −1 재정렬.
4. 빈자리 트리거(승인참가자 취소/거절로 자리 발생): 대기 1번에게 GAME_* 알림 + promotion_deadline=now()+30분 set. **자동 승인 금지.**
5. 승격 확정 API(예: POST /api/web/games/[id]/applications/[appId]/confirm): 서버가 promotion_deadline 검증(만료=410, 다음 순번 승격) → 통과 시 status=1 + current_participants+1 (트랜잭션 내 current<max 재확인, 초과=409).
6. UI 참가자측(시안 B): GameDetail 신청 패널 상태 분기(open/full/waiting/promoted/confirmed) + MyRegistrationStatus(신규 /my/registrations) 대기 표시·카운트다운(promotion_deadline-now 표시용) + Games 카드 "대기 가능"/"마감" 뱃지. 카운트다운은 표시용, 확정 가부는 서버.
7. UI 호스트측(시안 E-1, v2.37 GameDetail HostApplicationsPanel): 호스트 전용(me===organizer_id) 신청 관리 패널 3구획 — ① 대기 승인(status 0) 행별 [승인][거절], 게스트 GUEST 뱃지+경력 라벨, 정원 마감 시 승인 disabled / ② 확정 참가자(status 1) {승인}/{max} + 출석 체크 연결(M3) / ③ 대기열(status 3) 순번(waitlist_position) + [승격 알림]→"전송됨·응답 대기"+카운트다운 + 수동 승격(보조). 기존 host-applications.tsx 승인/거절·게스트 라벨·PlayerLink 보존하며 확장.

검증: 정원 마감→대기신청 시 status=3+position / 승인자 1명 취소→대기1번 알림+deadline set / 만료 confirm→410+다음순번 / 호스트 패널 3구획 승인·거절·승격 동작 / curl raw에 waitlist_position·promotion_deadline(snake_case).
```

---

## ▶ M3 — 출석 확정 → 평점 권한 연동 — 시안 C (v2.35)

```
[작업] 호스트가 출석 체크, 종료 경기 status 실DB 전환, 출석/노쇼를 리포트에 연동. (Phase M3)
시안=GameDetail(호스트 출석 섹션)+GameReport(출석/노쇼 구분). 계약=DATA-BINDING §2-3.
브랜치 subin. **schema 변경 없음** — 기존 game_applications.attended_at 사용(신규 attendances 테이블 만들지 말 것).

요구사항:
1. 출석 토글 API(예: PUT /api/web/games/[id]/attendance, body {user_id, present:bool}): 호스트만(IDOR 검증). present=true→attended_at=now(), false→attended_at=null. 낙관적 업데이트.
2. 호스트 출석 섹션(GameDetail): 노출조건 me===organizer_id && game.status>=2. 승인참가자(status=1) 리스트에 출석 토글(44px). 출석/미출석 카운터.
3. 종료 경기 status 실DB 전환(결정=lazy update): 조회 시 scheduled_at + duration_hours < now() 이고 status 1/2면 DB status를 3으로 1회 UPDATE(멱등). 기존 game.ts 메모리 오버라이드를 실DB 동기화로 승격(평점이 DB status=3 요구).
4. GameReport 출석/노쇼: 평가대상 = status=1(승인) 중. attended_at null인 승인자=노쇼 → is_noshow prefill. 노쇼는 opacity·뱃지 구분 + MVP 버튼 disabled. 기존 폼(전체평점/MVP/동행자평점/flags 5종) 보존.

검증: 출석 토글→attended_at 기록/해제 / 종료경기 조회→DB status=3 / 리포트 폼 노쇼 prefill·MVP disabled / "시안 미리보기" 점선 바 제거.
```

---

## ▶ M4 — 평점 작성 유도 + 프로필 신뢰 카드 — 시안 D (v2.35)

```
[작업] 종료 경기 평점 CTA + 프로필 신뢰 카드(매너 등급 라벨). (Phase M4)
시안=GameDetail/MyActivity(CTA 배너)+Profile(신뢰 카드). 계약=DATA-BINDING §2-4.
브랜치 subin. schema 변경 없음(기존 users.manner_score/manner_count + 파생).

데이터(운영 파생):
- manner_score=users.manner_score(Decimal). 등급 라벨로만 노출(숫자 비노출). 매핑: ≥4.5 아주 좋음(--ok)/4.0–4.4 좋음(--cafe-blue)/3.0–3.9 보통(--ink-mute)/<3.0 주의 필요(--warn).
- mvp_count = games where final_mvp_user_id=user count(파생).
- games_played = 승인(status=1)+attended_at 있는 game_applications count(파생).
- has_ratings = manner_count>0. false면 신뢰 카드 "아직 기록 없음".

요구사항:
1. 평점 CTA 배너: 노출조건 game.status===3 && 내 game_reports 없음. GameDetail 종료단계 + MyActivity 상단. 작성 완료 시 사라짐.
2. 종료 후 평점 알림: status→3 시 호스트+승인참가자에게 "평점 남기기" 알림. 미작성자 종료+24h 1회 리마인드(중복 방지).
3. 프로필 신뢰 카드(Profile.jsx): HeroCard와 별도. 매너 등급 라벨 + MVP N회 + 참여 N경기. **manner_score 숫자 비노출, HeroCard 점수 미노출(§3 보존)**.
4. 룰 갱신: 01-user-design-decisions.md §3 "레이팅 노출 금지"를 "매너점수는 등급 라벨로 별도 카드 노출 허용, HeroCard 점수는 여전히 금지"로 갱신.

검증: 종료 경기→CTA 노출→작성 후 사라짐 / 알림+24h 리마인드 1회 / 프로필 등급 라벨·MVP·참여수 / 미평가 빈상태 / manner_score 숫자 비노출 확인.
```

---

## ▶ M5 — 찾기/검색 UX 고도화 — 시안 A (v2.35)

```
[작업] 경기 목록 정렬·빠른필터·진행률·빈상태. 기존 listGames/필터 유지 위에 레이어. (Phase M5)
시안=Games.jsx. 계약=DATA-BINDING §2-1, §4.
브랜치 subin. schema 변경 없음(정렬/필터는 쿼리·메모리).

요구사항:
1. 정렬(sort): soon=scheduled_at asc(미래우선) / filling=current_participants/max_participants desc / latest=created_at desc. 데스크톱 드롭다운 / 모바일 하단시트. **"가까운순"은 games에 좌표 없음 → courts 좌표 조인 가능 시에만, 아니면 옵션 숨김**(응답 sort_options 메타로 제어, 클라 하드코딩 금지).
2. 빠른필터 칩(다중 AND): today/weekend(scheduled_at 요일·당일 파생)/near·내동네(좌표 또는 preferred_regions)/filling(fill_pct≥70)/free(fee_per_person=0). 좌표 의존 칩은 데이터 없으면 숨김.
3. 카드: 진행률 바 = current_participants/max_participants. 상태 뱃지: is_full(>=max) & 대기허용→"대기 가능"(.badge--soft)/is_full→"마감"/fill≥70%→"마감임박"(.badge--red)/else "모집중"(.badge--ok). STATUS_LABEL 토큰 재사용.
4. 빈 상태: 0건→안내 + [맞춤필터 끄기](칩 리셋)/[인접 지역 보기] CTA. 문구 5단어 이내.

검증: 각 정렬·칩 동작 / 좌표 없을 때 가까운순·내동네 숨김 / 진행률 바 정확 / 0건 빈상태.
```

---

## ▶ M6 — 호스트 콘솔: 신청·대기열 관리(E-1) + 내 경기 대시보드(E-2) + status맵 정리 — 시안 E (v2.37)

> ⚠️ M2가 E-1 없이 dev 머지됨 → **E-1 운영 구현은 M6로 이관**(2026-06-19 수빈 결정). E-1 시안은 BDR-current GameDetail.jsx에 복구 완료(485줄, HostApplicationsPanel).

```
[작업] 호스트 신청·대기열 관리 패널(E-1) + 내 경기 대시보드(E-2) + status 라벨 정본 통일. (Phase M6)
시안: GameDetail.jsx HostApplicationsPanel(E-1) + MyGames.jsx(E-2, 신규). 운영: GameDetail 호스트뷰 + src/app/(web)/games/my-games/page.tsx + _components/. 계약=DATA-BINDING.
브랜치 subin. schema 변경 없음(M2의 status 3·waitlist_position·promotion_deadline 재사용).

E-1 호스트 신청·대기열 관리 패널 (GameDetail 호스트 전용, me===organizer_id):
- 3구획 — ① 대기 승인(status 0) 행별 [승인][거절], 게스트 GUEST 뱃지+경력 라벨, 정원 마감 시 승인 disabled / ② 확정 참가자(status 1) {current_participants}/{max_participants} + 출석 체크(M3) 연결 / ③ 대기열(status 3) 순번(waitlist_position) + [승격 알림]→"전송됨·응답 대기"+카운트다운(promotion_deadline) + 수동 승격(보조).
- 기존 host-applications.tsx(승인/거절·게스트 라벨·PlayerLink) 보존하며 확장. M2 승격 confirm API 재사용.

🔴 선결(우선 처리 — M1 머지 후 버그):
- src/app/(web)/games/my-games/page.tsx 의 로컬 GAME_STATUS_LABEL(3=진행중/4=완료/5=취소)은 **오류** → 폐기.
  game-status.ts 정본(1=모집중/2=확정/3=완료/4=취소) import 사용. M1 통일로 취소=4인데 로컬맵은 4를 "완료"로 오표시 → 취소 경기 오표시 버그. 전 사용처 grep 후 정본으로 교체.

요구사항:
1. 내 경기(호스트) 대시보드: my-games 하단 "내가 만든 경기"를 호스트 운영 카드로 강화. 상단 참가자 신청내역(confirmed/pending/completed/cancelled) 보존 + 대기(waiting) 탭 추가(M2 본인 대기 경기).
2. 호스트 경기 카드: 상태 뱃지(정본 라벨) + 신청 현황(승인 {current_participants}/{max_participants} · 대기 {waitlist count}) + 일시·장소 + 빠른 액션 [신청 관리](→GameDetail E-1) [수정](/edit) [마감·확정](모집중·정원미달 수동 status 2) [취소](status 4 확인 모달→신청자 GAME_CANCELLED 알림).
3. 상단 요약 stat: 모집중/확정/완료 N (호스트 경기 기준). 시안 mg-summary 3칸.
4. 빈 상태: 호스트 경기 0건 → 안내(5단어 이내) + [경기 만들기]→/games/new.

검증: E-1 호스트 패널 3구획(승인/거절/대기 순번/승격) 동작 / status 라벨 정본 통일(취소 경기 "취소" 표시 확인) / 호스트 카드 현황·빠른 액션 동작 / 취소 모달→신청자 알림 / 모바일 1열·44px.
```

---

## 부록 — M7 결제: 보류(설계만). 진행 결정 시 별도 의뢰.
```
