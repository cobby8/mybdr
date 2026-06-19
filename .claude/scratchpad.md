# 작업 스크래치패드

## 현재 작업
- **요청**: [통합] 픽업/게스트 경기 매칭 고도화 M1→M5 auto-chain 박제 (각 Phase=한 PR subin→dev)
- **상태**: 🔨 M1 착수 (성사코어+취소정합). 게이트 A(status=5 잔존 UPDATE)=수빈 승인 대기
- **현재 담당**: pm → developer(M1)
- **스펙**: `Dev/matchmaking-CLI프롬프트-확정-M1toM5-2026-06-19.md` + `Dev/design/BDR-current/_handoff-matchmaking-M2-M5/DATA-BINDING.md`
- **프리플라이트(2026-06-19)**: subin 푸시(f5f04fc)·dev머지완료·DATABASE_URL키존재·.env.local 3001 확인 ✅
- **🔒 §0 필드 대조표(시안명→운영실제, 전 Phase 공통)**:
  - 시간 `scheduled_at` / 길이 `duration_hours`(분아님) / 정원 `max_participants` / 승인참가수 `current_participants` / 참가비 `fee_per_person`(0=무료)
  - 좌표=games에 없음→courts 조인 필요, 없으면 "가까운순"·"내동네" 칩 숨김
  - 신청테이블 `game_applications` / 신청 status **Int** 0=신청완료·1=승인(확정)·2=거절 (+M2 신규 3=대기)
  - **game status**(`game-status.ts`): 1=모집중·2=확정·3=완료·4=취소 (M1: 0=초안 주석화, 취소=4 통일, status=5 오염 제거)
  - 출석=`game_applications.attended_at`(DateTime, attendances 테이블 만들지말것) / 노쇼=`game_player_ratings.is_noshow`+출석파생
  - 매너=`users.manner_score`Decimal+`manner_count` / mvp_count·games_played·has_ratings=파생
  - M2 신규컬럼: `waitlist_position`INT NULL / `promotion_deadline`TIMESTAMPTZ NULL (게이트 B)
- **게이트**: A(M1 status=5 UPDATE 승인) / B(M2 ADD COLUMN db push diff 승인). 그 외 검증통과 시 자동 다음 Phase
- **직전완료**: B2/B3 백엔드(커밋 73951f2→push). Records/갭①② main(06-16)

## 진행 현황표 (대기/후속만)
| 작업 | 상태 |
|------|------|
| gallery P2 (news_photo 실연결) | ⏸️ `stash@{0}` 보관 — 다른 세션 작업물. 복원 시 `git stash pop` |
| scrim 보낸취소 [id] 버그 | ⏳ developer 재작업 (아래 수정요청 표) |
| 버킷B 관리자 잔여(시상/코치/갤러리/심판/샵/쪽지) | ⏸️ 결정 대기 `mock-data-absent-admin-plan-2026-06-14.md` |
| 대회상태 Phase2/3 후속 | ⏸️ 실진행/공지전용 백필 일부 완료, 잔여 대기 |

## 기획설계 (planner-architect)
(완료분은 작업 로그로 압축 — 신규 작업 시 기록)

## 구현 기록 (developer)

(B2/B3 완료 — 커밋 73951f2 push. 상세는 작업로그.)

### 매칭 고도화 M1 — 성사 코어 + 취소 status 정합 (2026-06-19, 비파괴)

📝 구현: 정원 도달 자동전환(1→2)·미달 복귀(2→1)·취소 status 5→4 통일·취소 시 신청자 전원 알림. **schema 변경 0** (status 활용만).

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/lib/constants/game-status.ts` | status 0=초안 주석 명문화 + 취소=4 통일 주석(5→4 정정 사유). STATUS_LABEL은 이미 4=취소 정합 | 수정 |
| `src/app/api/web/games/[id]/route.ts` | DELETE: status `5→4`. 취소 시 신청자(status 0,1) 전원 GAME_CANCELLED `createNotificationBulk` 발송. PATCH/DELETE 가드에 완료(3)도 차단(+5 잔존방어 유지) | 수정 |
| `src/app/api/web/games/[id]/apply/route.ts` | reserve 트랜잭션 내: 증가 후 current>=max & status=1이면 조건부 UPDATE로 →2 자동전환 | 수정 |
| `src/app/api/web/games/[id]/applications/[appId]/route.ts` | 거절 트랜잭션 내: 감소 후 current<max & status=2면 조건부 UPDATE로 →1 복귀 | 수정 |
| `src/app/api/web/games/[id]/apply/cancel/route.ts` | 신청자 본인취소 트랜잭션 내: 감소 후 current<max & status=2면 →1 복귀 (스펙 "취소로 복귀"에 해당) | 수정 |

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-06-19 | 본인취소 이중감소 차단: ①경기 status 1·2일 때만 취소 허용(완료3/취소4 차단) ②decrement+복귀UPDATE를 `application.status===0‖1` 조건으로 감쌈(거절2 신청은 차감 스킵, delete만 유지). tsc 통과 | `apply/cancel/route.ts` | tester+reviewer 독립발견: 거절(2) 신청 본인취소 시 current_participants 이중감소→M1 자동전환 왜곡 |

🔒 **게이트 A (status=5 잔존)**: 읽기전용 groupBy 결과 → **status=5 잔존 0건** (status 분포: 0=136 / 1=158 / 4=1). 오염 데이터 없음 → UPDATE 불필요, 코드 정정만으로 충분. 임시 스크립트 즉시 정리함.

🏗️ 구조적 결정:
- 이 코드베이스는 **"신청=좌석 선점"** 모델 (apply 시점에 `current_participants` 증가). 따라서 **정원 자동전환은 apply reserve 트랜잭션**에 배치(승인 경로 아님 — 승인 시 current 불변). 복귀는 current 감소가 일어나는 **거절·신청취소** 두 경로에 배치.
- 자동전환/복귀 모두 **조건부 raw UPDATE**(`WHERE status=N AND current vs max`)로 구현 → 같은 $transaction 내 race-safe, 조건 불충족 시 0 rows no-op.
- 취소 알림은 다수 발송 → `createNotificationBulk` 사용, fire-and-forget(취소 update는 이미 커밋). 거절(2) 신청자는 제외(이미 탈락).

✅ tsc --noEmit: **통과 (exit 0, 에러 0)**. prisma diff 비어있음(schema 무변경).

💡 tester 참고:
- 정원 채움: max=N인 모집중(1) 경기에 N번째 신청 → status 2 확인.
- 복귀: 위 상태에서 1명 거절 또는 본인취소 → status 1 복귀 확인.
- 취소: 신청자 있는 경기 DELETE → 신청자(0/1) notifications에 `game.cancelled` row + 경기 status=4 + 라벨 "취소".
- curl GET `/api/web/games/[uuid]` raw → `status` 필드 snake_case(이미 snake) 확인.

⚠️ reviewer 참고:
- PATCH/DELETE 가드를 `status===4||5` → `3||4||5`로 확장(완료 경기 수정/취소 차단 버그 보완). 기존 동작 영향 검토 요청.
- 조건부 UPDATE의 `current_participants >= max_participants` 경계(== vs >=): 초과 데이터 방어 위해 >= 사용.

### 매칭 고도화 M2 — 대기열 백엔드 + 스키마 (2026-06-19)

📝 구현: 정원 마감 시 FULL 거절 대신 status=3(대기)+순번 부여. 빈자리 발생(거절/승인취소) 시 대기 1번 승격 안내(30분 마감, 자동승인 X). 승격 확정 API 신규.

🗄️ **db push 결과(게이트 B)**: `prisma migrate diff` 결과에 **M2 무관 live_scoreboards 드리프트**(DropForeignKey + ALTER COLUMN updated_at DROP DEFAULT)가 섞여 나옴 → 스펙 "DROP/ALTER 보이면 중단" 룰에 따라 **broad `prisma db push` 미실행**. 대신 **targeted SQL로 2컬럼만** 적용:
  - `ALTER TABLE game_applications ADD COLUMN IF NOT EXISTS waitlist_position SMALLINT` (NULL)
  - `ALTER TABLE game_applications ADD COLUMN IF NOT EXISTS promotion_deadline TIMESTAMP(6)` (NULL)
  - 사후검증(information_schema 읽기): 둘 다 생성 확인 — nullable=YES / smallint·timestamp without time zone. destructive 0. **live_scoreboards 드리프트는 손대지 않음**(별도 결정 필요 — 아래 reviewer 참고).
  - prisma generate: 타입(.d.ts) 재생성 성공(91 occ). 단 query engine DLL은 dev서버(PID 78724, port 3001) 점유로 EPERM — **런타임 엔진만 미교체**(tsc 영향 0). dev서버 재시작 시 자동 해소(broad node kill 금지 준수).

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `prisma/schema.prisma` | game_applications에 waitlist_position(SmallInt?)·promotion_deadline(Timestamp?) 추가 | 수정 |
| `src/lib/notifications/types.ts` | `GAME_WAITLIST_PROMOTED`("game.waitlist.promoted") 신규 | 수정 |
| `src/lib/games/waitlist.ts` | **신규 공통 헬퍼**: promoteNextWaitlist(tx)·sendPromotionNotice·triggerWaitlistPromotion. 대기1번(position 최소·미승격) 30분 deadline set+status3 유지. 중복승격 방지(살아있는 deadline 후보 제외) | 신규 |
| `apply/route.ts` | 정원 마감(reserve 0rows) 시 FULL 거절→status=3+waitlist_position=max+1(같은 tx aggregate). 응답 waitlisted/waitlist_position(snake). 호스트/신청자 알림 대기 분기 | 수정 |
| `apply/cancel/route.ts` | status=3 취소: delete+position>취소분 −1 재정렬(current 미변경). status=1 취소: M1 차감/복귀 후 promoteNextWaitlist(같은 tx)+커밋후 알림 | 수정 |
| `applications/[appId]/route.ts` | reject 시 M1 차감/복귀 후 promoteNextWaitlist(같은 tx)+커밋후 알림 | 수정 |
| `applications/[appId]/confirm/route.ts` | **신규 POST**: deadline null/만료→410(+다음순번 재발동). 통과 시 tx로 current<max 재확인(초과409)→status1+current+1+필드클리어+정원차면 game1→2. IDOR=본인‖호스트 | 신규 |

✅ tsc --noEmit: **통과 (exit 0)**.

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-06-19 | **수정1(차단)**: cancel 승격 트리거를 `status===1`에만→좌석 차감 블록(`status 0‖1`) 안에서 **무조건** `promoteNextWaitlist` 호출. "신청=좌석선점" 모델이라 status=0도 좌석 점유→취소 시 좌석 비므로 0·1 모두 트리거. 거절 경로(applications/[appId] status=0 무조건 트리거)와 대칭 일치 | `apply/cancel/route.ts` L79~89 | reviewer(차단)+tester(비차단) 독립확인: status=0 본인취소 빈자리 영구 미충원(M2 목적 훼손). 사용자 승인: status 0·1 모두 트리거 |
| 1차 | 2026-06-19 | **수정2(minor)**: confirm 만료 시 단순 deadline=null 정리+재선출 → `demoteExpiredAndPromoteNext` 신규 헬퍼로 교체. 만료자를 waitlist_position 맨 뒤(max)로 강등 + 뒤 순번 −1 당김(같은 tx)→ 이후 promoteNextWaitlist는 실제 다음 순번 승격(만료자는 맨 뒤라 자연 제외). 무한 자기승격 방지 | `confirm/route.ts` L54~71 import / `waitlist.ts` demoteExpiredAndPromoteNext 추가 | reviewer+tester: 만료자가 최앞 순번이면 본인 즉시 재승격(새 30분) 미세편차. 스펙 "만료→다음순번"에 정합 |

✅ tsc --noEmit (수정 후 재검증): **통과 (exit 0)**.

#### UI (wave2) — 대기열 화면 박제 (2026-06-19, 비파괴 / 운영 write 0)

📝 구현: M2 백엔드 위에 대기열 UI 박제. 상세 ApplyPanel 상태분기(대기/승격/확정), 승격 확정 클라 컴포넌트, /me/registrations GET + 내 신청 현황 화면, 경기카드 "대기 가능/마감" 뱃지. 데이터패칭 신규=confirm/registrations 연결만, 기존 apply/cancel 경로 무변경.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `(web)/games/[id]/page.tsx` | ApplyPanel에 myApplicationId(string)·waitlist_position·promotion_deadline(ISO) 전달. myApplication(이미 본인것만)에서 추출, 신규 조회 0 | 수정 |
| `(web)/games/[id]/_v2/apply-panel.tsx` | 상태분기 확장: isWaiting(status3)·isPromoted(status3+deadline 미래) 파생. waiting=대기N번+CancelApplyButton재사용 / promoted=PromoteConfirm / confirmed(1)·rejected(2)·applied(0)·open(null) 기존유지. open/full은 기존 GameApplyButton(백엔드가 full이면 자동 status=3) | 수정 |
| `(web)/games/[id]/_v2/promote-confirm.tsx` | **신규** 승격확정 클라: POST confirm + 카운트다운((deadline-now)/1000 표시용, setInterval 1s). **타이머 0이어도 버튼 유지**(서버 판정). 200/410(만료·다음순번)/409(정원초과) 분기→router.refresh | 신규 |
| `api/web/me/registrations/route.ts` | **신규** GET withWebAuth 읽기전용. game_applications(user_id=본인)+games select 조인. snake_case 응답 | 신규 |
| `(web)/my/registrations/page.tsx` + `registrations-client.tsx` | **신규** MyRegistrationStatus 박제. deriveState(0=applied/1=confirmed/2=rejected/3=promoted‖waiting) 분기. counters 4종·승격배너·행별 확정/취소/상세 액션. 720px 분기·44px 터치 | 신규 |
| `components/bdr-v2/game-card.tsx` | 만석+픽업/게스트(0,1)+status1 → "대기 가능"칩+"대기"버튼+비흐림. 만석+(status≥2‖연습2) → "마감". 기존 isFull/isClosing 재사용, 만석일 때 무료/주말 등 칩 숨김 | 수정 |

**상태분기 방식**: promoted=`status===3 && promotion_deadline 미래`(클라는 표시분기만, 확정 가부=서버 deadline 판정). waiting=`status===3 && !promoted`. confirmed=1·rejected=2·applied=0·open=null(미신청). 카운트다운은 표시용, 버튼 비활성화 안 함.

**/me/registrations 응답형태**: `{ items: [{ id, status, waitlist_position, promotion_deadline, created_at, game:{ id, uuid, short_id, title, game_type, scheduled_at, venue_name, city, district, status, max_participants, current_participants } }] }` — 전부 snake_case(apiSuccess 자동변환), BigInt→string.

**디자인룰 준수**: var(--*) 토큰만(color-mix accent 틴트)·하드코딩 hex 0·Material Symbols(notifications_active/group_add 등)·pill 9999px 0(정사각 원형 미사용)·720px @media 분기·버튼 minHeight 44px. AppNav 무관(콘텐츠만). 시안 점선 미리보기바·하드코딩 카운트다운(1790) 미포함.

##### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| wave2-1 | 2026-06-19 | **만석 대기 신청 카피**: GameApplyButton에 선택적 `isFull` prop 추가 → true(만석+모집중+미신청) 시 버튼 라벨 "🏀 참가 신청"→"대기 신청". apply-panel은 기존 remaining/max로 `isFull=max>0&&remaining===0` 판정(신규 조회 0), 미신청 분기에 전달 + "정원 마감 · 대기 등록"(var(--warn)) 안내 1줄. **클릭 동작/fetch body/엔드포인트 무변경**(백엔드 자동 status=3 대기). 여석 있으면 기존 "참가 신청" 유지 | `apply-button.tsx`(isFull prop+라벨), `apply-panel.tsx`(isFull 판정+전달+안내) | 사용자 결정(reviewer 권장①·dev명시 갭): 만석 미신청자가 "참가 신청" 보고 정상참가 오인 |
| wave2-2 | 2026-06-19 | **#fff 하드코딩 제거**: 빈상태 CTA "경기 둘러보기" 버튼 `color:"#fff"` → `color:"var(--ink-on-brand)"`. accent 배경 위 텍스트 표준 토큰(globals.css L95/151 light·dark 양쪽 정의·L6228 등 accent 버튼 텍스트에 이미 사용). 룰10 하드코딩 hex 0 달성 | `registrations-client.tsx` L355 | tester/reviewer minor(룰10 경미위반) |

✅ **wave2 tsc --noEmit: 통과 (exit 0)**. 데이터/패칭/엔드포인트 무변경. 디자인룰(var(--*)만·Material Symbols·하드코딩 hex 0) 준수.

✅ **tsc --noEmit: 통과 (exit 0)**. 신규 GET curl raw: 401(withWebAuth 정상 가드, 무세션) — 응답 shape는 라우트코드+apiSuccess로 snake_case 확정. 운영 write 0(confirm/cancel 미호출).

💡 tester 참고:
- 상태분기 엣지: status3+deadline 과거(만료직후)=waiting 표시되나 confirm 누르면 서버 410. status3+deadline null=waiting. promotion_deadline 미래=promoted+카운트다운.
- 카운트다운: PromoteConfirm·RegRow CountdownText 모두 0 도달 시 "마감 임박" 텍스트만, **버튼 유지**. 1s setInterval, left<=0이면 정리.
- 뱃지: game-card 만석 픽업/게스트 모집중(1)=대기가능. 만석 연습경기(2)=마감. 만석 완료/취소(3/4)=마감. 만석 아님=기존 무료/마감임박/주말 칩.
- /me/registrations: 무세션 401, 세션 시 items 배열. short_id로 상세 딥링크. 빈배열=빈상태 카드.
- 디자인 회귀: 720px에서 reg-row 2칼럼·액션 줄바꿈. 모든 액션버튼 44px.

⚠️ reviewer 참고:
- IDOR: /me/registrations where.user_id=본인 고정. confirm/cancel은 short_id+appId로 기존 라우트(본인/호스트 가드) 재사용.
- apply-panel full 경기: status=1 만석이면 GameApplyButton이 그대로 POST /apply → 백엔드가 status=3 자동대기. 별도 "대기 신청" 버튼 미신설(요구6 open/full 기존 재사용 명시 준수). 단 시안 "정원 마감 · 대기 신청" 전용 카피는 미박제(GameApplyButton 라벨이 "참가 신청" 유지) — 의도(데이터패칭 무변경). 필요 시 후속.
- 카운트다운 서버권위: 클라 left는 표시뿐. confirm 버튼 항상 활성(loading 제외)→서버 410/409가 최종.

**코드경로 설명**:
- **"status=0 본인취소 → 승격 트리거 발동"**: cancel L56 delete → L63 `status===0||1` 블록 진입 → current-1(좌석 해제) → L88 `promoteNextWaitlist(tx, game.id)` **무조건 호출**(status===1 조건 제거됨). status=0 취소도 좌석이 비므로 대기 1번이 승격됨. 거절 경로와 동일 의미.
- **"만료자 재승격 안 됨"**: confirm L62 만료 감지 → `demoteExpiredAndPromoteNext`. tx 내 ①만료자 waitlist_position=max(맨 뒤) ②뒤 순번 −1 당김 → 만료자가 더 이상 최앞 아님 → `promoteNextWaitlist`의 `position asc` 선출에서 실제 다음 사람이 뽑힘. 만료자는 맨 뒤라 deadline=null이어도 다음 좌석해제까지 재선출 안 됨.

💡 tester 참고:
- **운영 write 금지** — 코드경로로만 검증. 신규컬럼 GET raw 확인은 game_applications 테이블 현재 0행이라 빈배열(information_schema로 컬럼 존재·snake_case·nullable 확정).
- 대기신청: max인 모집중 경기에 추가 신청 → status=3, waitlist_position=1,2,3… 순차. 응답 `waitlist_position`.
- 대기취소: 대기2번 취소 → 3번이 2번으로 당겨짐(재정렬). current 불변.
- 승격: 확정(2) 경기 승인참가자 1명 거절/취소 → 대기1번 promotion_deadline=+30분 set + GAME_WAITLIST_PROMOTED 알림. status는 3 유지(자동승인 안 됨).
- 확정: 승격 안내받은 대기자가 confirm POST → status=1+current+1. 만료 후 confirm → 410 + 다음순번 재발동.

⚠️ reviewer 참고 (동시성):
- **승격 confirm race**: confirm은 tx 내 `current+1 WHERE current<max`(0rows→409 롤백) + M1 자동전환 재사용 → 두 대기자 동시 confirm해도 한쪽만 통과. 정원 초과 불가.
- **트리거 중복방지**: promoteNextWaitlist는 "살아있는 promotion_deadline" 후보 제외 + id단건 status=3 조건부 updateMany(0rows→무효) → 두 좌석해제 동시 발생해도 같은 대기자 중복승격 방지.
- **재정렬 정합**: status=3 취소만 position −1. status=0/1 취소는 M1 차감경로(position 무관). 승격확정 시 position=null 클리어로 잔여 순번과 분리.
- **스펙 편차 2건 판단 필요**: ①스펙 "거절 status=1→2"이나 실제 reject는 0→2(코드상 status=0만 승인/거절 가능). 좌석 해제 시점=reject이므로 트리거를 reject에 배치(정상). ②**status=0 취소도 이 코드베이스에선 좌석 점유**(apply 시 current+1)라 좌석 해제됨. 스펙은 "status=0 취소 트리거 X"라 status=1 취소만 승격 트리거 → 좌석은 비는데 승격 안 일어나는 갭 가능(M1 모집중 복귀는 됨). 스펙 준수로 status=1만 트리거함 — PM/사용자 확인 필요.
- **DB 드리프트 게이트 B**: live_scoreboards 드리프트(SQL레벨 FK + updated_at default)는 schema가 의도적으로 관계 미선언(L780 주석)인데 db push가 DROP하려 함. targeted SQL로 회피했으나, 향후 누군가 broad db push 시 FK 날아갈 위험 — 별도 정리/주석 보강 후속 필요.

## 테스트 결과 (tester)

### 매칭 고도화 M2 검증 — 대기열 백엔드+스키마 (2026-06-19, 정적+읽기전용)

**환경**: write HTTP/SQL 0(운영DB 보호). tsc + 정적 코드경로 + information_schema/git diff 읽기전용만. 임시 mjs 2회 즉시삭제.

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 | ✅ 통과 | exit 0, 에러 0 |
| 스키마 컬럼 실DB 존재(information_schema) | ✅ 통과 | waitlist_position=smallint/nullable, promotion_deadline=timestamp without time zone/nullable |
| live_scoreboards 무변경(읽기) | ✅ 통과 | schema git diff=game_applications 2컬럼 3줄만. 실DB live_scoreboards.updated_at default=CURRENT_TIMESTAMP 그대로(M2 SQL 미접촉) |
| §0 필드명 snake_case 일치 | ✅ 통과 | waitlist_position/promotion_deadline/current_participants/max_participants/game_id/user_id 전부 schema 실재·snake. 응답 waitlist_position(snake) |
| GAME_WAITLIST_PROMOTED 타입 | ✅ 통과 | types.ts "game.waitlist.promoted" 실재. createNotification 시그니처 전부 일치 |
| 대기 신청(apply): 마감→status3+순번 | ✅ 통과 | reserve 0rows→isWaitlisted, 같은 tx aggregate `_max(waitlist_position)+1`로 직렬 순번. 여석 있으면 status0 정상. max_participants=null이면 단순증가(대기 미발생) |
| 대기 취소(cancel): status3 delete+재정렬 | ✅ 통과 | L85-97 status===3 && position!=null → delete + `position > 취소분` −1 updateMany. current 미변경. tx 내 race-safe |
| 빈자리 트리거(waitlist.ts) status1 해제 시 | ✅ 통과 | promoteNextWaitlist: position asc 1번 + deadline=now+30분 set, status3 유지(자동승인 X). cancel L82 `status===1`만 트리거(스펙 §5 준수) |
| 트리거 중복방지 | ✅ 통과 | 후보 where `OR[deadline null, deadline<now]`로 살아있는 deadline 제외 + id단건 `status:3` 조건부 updateMany(count=0→null) → 동시 좌석해제 중복승격 차단 |
| 승격 confirm: deadline null/만료→410 | ✅ 통과 | L62 null‖<now → 본인 deadline null 정리 + triggerWaitlistPromotion(다음순번 재발동) + 410 |
| confirm race: tx 내 current<max 재확인 | ✅ 통과 | $executeRaw `current+1 WHERE current<max`(reserved=0→FULL throw→409 롤백) + M1 자동전환 재사용(>=max→status2). 동시 confirm 한쪽만 통과, 초과 불가. max=null이면 단순증가 |
| confirm 통과: status1+컬럼 null+정원차면 1→2 | ✅ 통과 | tx 내 app status=1+approved_at+waitlist_position=null+promotion_deadline=null. game 정원차면 1→2. approved 알림 |
| IDOR(confirm 본인/호스트) | ✅ 통과 | isApplicant ‖ isHost 외 403. status!==3→409. app.game_id!==game.id→404 |
| 거절 트리거(applications/[appId]) | ✅ 통과 | reject만 current-1 → M1 복귀(status2&current<max→1) + promoteNextWaitlist(같은 tx). approve는 current 불변·트리거 없음 정상 |
| 재정렬 원자성 | ✅ 통과 | status3 취소만 position −1. status0/1 취소는 M1 차감경로(position 무관). 승격확정 시 position=null 클리어로 분리 |

📊 종합: **15개 중 15개 통과 / 0개 실패**. 🟡 비차단 관찰 2건(아래).

#### 🟡 비차단 관찰 (동작영향 경미 — 후속 정책 확인)
- **[confirm L62~74] 만료 confirm 시 동일 신청 재선출 가능성(이론, 무한루프 아님)**: 만료된 본인 신청을 deadline=null로 정리 후 triggerWaitlistPromotion이 `OR[deadline null]`+position asc로 후보를 뽑음 → 만료자가 여전히 최앞 순번이면 다시 본인에게 새 deadline+30분 부여 가능. 스펙 "만료→다음순번"과 미세 편차. ①다음 confirm에서 또 만료처리되어 정체는 아님 ②실 피해는 "만료자에게 30분 더 줌" 수준. 운영 안전, 후속 정책 확인.
- **[apply/cancel 스펙 편차 — developer reviewer참고②와 동일]**: status=0(미승인) 취소는 좌석 점유 해제(current-1)되나 승격 트리거 안 됨(L82 status===1만). 스펙 §5 준수로 의도된 동작이나 좌석은 비는데 승격 미발생 갭(M1 모집중 복귀는 됨). PM/사용자 정책 확인 필요(developer 이미 박제).

#### UI (wave2) — 대기열 화면 박제 검증 (2026-06-19, 정적+읽기전용 GET)

**환경**: write HTTP/SQL 0(운영DB 보호). tsc + 정적 코드경로 + 디자인 grep + dev서버 3001 무세션 GET(curl 읽기전용)만. node 전체 kill 안 함.

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 | ✅ 통과 | exit 0, 에러 0 |
| apply-panel 상태분기(0/1/2/3+promoted) | ✅ 통과 | null→GameApplyButton(open/full, 백엔드 자동 status3) / 0→CancelApplyButton(applied) / 1→승인배지 / 2→거절배지 / 3+promoted(deadline 미래)→PromoteConfirm / 3+!promoted→대기N번+CancelApplyButton(waiting). 5케이스 누락·중복 0 |
| promoted 파생 판정 서버권위 | ✅ 통과 | isPromoted=status3&deadline!=null&deadline>now(표시분기). PromoteConfirm 카운트다운 표시용·타이머0이어도 버튼 유지(disabled=loading만)→서버 410/409 최종판정 |
| promote-confirm 410/409 분기 | ✅ 통과 | 200→success+router.refresh / 410→만료안내+refresh / 409→정원초과안내+refresh / 그외→error. setInterval 1s, left<=0이면 clearInterval+"마감 임박" |
| page.tsx→ApplyPanel props 전달 | ✅ 통과 | myApplicationId=id.toString()·waitlistPosition·promotionDeadline=ISO. myApplication(L143 본인것만, IDOR안전)에서 추출, 신규조회 0. listGameApplications가 `include`(select 없음)라 waitlist_position/promotion_deadline 스칼라 전부 반환→타입 정합 |
| `/me/registrations` GET 무세션 401 | ✅ 통과 | curl raw `{"error":"로그인이 필요합니다.","code":"UNAUTHORIZED"}` 401. withWebAuth 가드 정상 |
| `/me/registrations` 응답 shape snake_case | ✅ 통과 | 코드+apiSuccess 경로: items[].{id,status,waitlist_position,promotion_deadline,created_at,game{id,uuid,short_id,title,game_type,scheduled_at,venue_name,city,district,status,max_participants,current_participants}}. BigInt→toString. where.user_id=ctx.userId 고정(IDOR) |
| registrations-client deriveState | ✅ 통과 | 1→confirmed/2→rejected/3+deadline미래→promoted/3+그외→waiting/0→applied. counters 4종·승격배너(promoted>0만)·행별 확정/취소/상세 액션 정합 |
| game-card 뱃지 분기 | ✅ 통과 | canWaitlist=isFull&status1&(픽업0‖게스트1)→"대기 가능"칩+"대기"버튼+비흐림(opacity1). isClosedFull=isFull&!canWaitlist(status≥2‖연습2)→"마감". 만석 시 무료/주말 등 칩 숨김 |
| 디자인 회귀(grep): 하드코딩 hex | 🟡 부분 | 신규 UI: promote-confirm/apply-panel 신규분 hex 0(color-mix·var만). **registrations-client L355 `color:"#fff"` 1건**(빈상태 CTA)→수정요청. apply-panel L510/536 rgba는 Phase C 기존(63ff686, M2 무관). game-card #hex는 주석뿐 |
| 디자인 회귀: lucide/9999px/핑크살몬코랄 | ✅ 통과 | 신규/수정 4파일 전부 0. Material Symbols 사용(notifications_active/group_add/sports_basketball 등). rounded-full 0 |
| 720px 분기 · 44px 터치 | ✅ 통과 | registrations-client @media(max-width:720px) reg-row 2칼럼+액션 줄바꿈. 액션버튼 minHeight:44. promote-confirm Button cta+py-3(44 톤) |
| AppNav 미변경(git diff) | ✅ 통과 | diff에 헤더/nav/app-nav 파일 0. 변경=games/[id]·_v2·me/registrations·game-card·apply/cancel·types 만 |

📊 종합: **13개 중 12개 통과 / 1개 부분(🟡 디자인 minor — 하드코딩 #fff 1건)**. 차단 0.

#### 🟡 디자인 minor (동작영향 0 — 토큰화 권장)
- **[registrations-client.tsx L355] 빈상태 CTA "경기 둘러보기" 버튼에 `color:"#fff"` 하드코딩**: 신규 파일. `var(--accent)` 배경 위 흰 텍스트. CLAUDE.md "하드코딩 색상 금지" 룰상 흰색도 토큰(예 `var(--on-accent)` 또는 기존 흰색 토큰) 권장. 다크/라이트 모두 accent 배경이 진해 가독성 문제는 없음→동작영향 0, 차단 아님. (apply-panel L510/536 rgba 2건은 Phase C 기존 코드라 M2 검증 범위 밖.)

### B2(앱 비번재설정)+B3(앱버전) 검증 — 2026-06-19

**환경**: dev 서버 localhost:3001 (PID 78724) 실 HTTP curl 테스트.

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 | ✅ 통과 | 에러 0 (exit 0) |
| Prisma 스키마 변경 0 | ✅ 통과 | `git diff prisma/` 비어있음. 운영DB 정책 준수 |
| 스키마 필드명 일치 | ✅ 통과 | passwordDigest/status/provider/reset_token/reset_token_expires 전부 schema.prisma 실재 |
| resend 설치 | ✅ 통과 | package.json `"resend":"^6.14.0"` |
| **app/version** GET → 200 + 캐시헤더 | ✅ 통과 | `cache-control: public, max-age=300` + snake_case raw JSON 확인 |
| reset-request 형식틀린 email → 422 | ✅ 통과 | |
| reset-request 미존재 email → 200 {ok:true} | ✅ 통과 | enumeration 방지 동작 |
| reset-request 빈body/깨진JSON → 422 | ✅ 통과 | |
| reset-password 무효토큰 → 410 RESET_TOKEN_INVALID | ✅ 통과 | code 일치 |
| reset-password 비번<8자 → 422 | ✅ 통과 | |
| reset-password 빈토큰/토큰누락/깨진JSON → 422 | ✅ 통과 | |
| 토큰검증 정합성(유효·재사용·만료) | ✅ 정적통과 | lib가 운영중 웹 reset-password와 byte동일(reset_token+gte만료+사용후 null·rounds=12). 운영DB 무변경 위해 실 비번변경은 생략, 정적검증 갈음 |
| 웹 라우트(api/web/auth/*) 회귀 | ✅ 통과 | 웹 미수정. 영향 0 |

📊 종합: **12개 중 11개 통과 / 1개 실패(❌ critical)**

#### ❌ 실패 — proxy.ts 화이트리스트 누락 (CRITICAL — 라우트는 정상이나 proxy가 전부 401 차단)
- **증상**: JWT 없이 호출 시 신규 3 라우트 전부 **401 UNAUTHORIZED** → 라우트 코드 도달 불가.
  reset-password-request / reset-password / app/version (Bearer 없음) → 모두 401.
- **원인**: `src/proxy.ts` L65~71 `PUBLIC_API_ROUTES`에 신규 3경로 누락. L125~136이 `/api/v1` 중 화이트리스트 외 경로는 Bearer/Token 헤더 없으면 401 early reject.
- **왜 치명적**: 비번재설정은 로그인 전(JWT 없음), app/version은 앱 부팅 시(로그인 전) 호출 → JWT 있을 수 없는데 proxy가 요구 → 정상 사용자 100% 401. 기능 전체 무력화.
- **검증**: 더미 `Authorization: Bearer dummy`로 proxy만 통과시키면 라우트 로직 전부 정상(위 표 200/422/410). **라우트 코드 무결, proxy 화이트리스트만 추가하면 해결.**
- **수정안**: `src/proxy.ts` `PUBLIC_API_ROUTES`에 3줄 추가
  `"/api/v1/auth/reset-password-request"`, `"/api/v1/auth/reset-password"`, `"/api/v1/app/version"`
  (참고: startsWith 매칭 — reset-password가 reset-password-request도 prefix 포함하나 둘 다 공개대상이라 무방. 둘 다 명시 권장)

### 매칭 고도화 M1 검증 — 성사코어+취소정합 (2026-06-19, 정적+읽기전용)

**환경**: write HTTP 호출 0(운영DB 보호). 정적 코드경로 분석 + tsc + 읽기전용 groupBy 만.

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 | ✅ 통과 | exit 0, 에러 0 |
| Prisma schema 변경 0 | ✅ 통과 | `git diff prisma/` 비어있음. 운영DB 정책 준수 |
| §0 필드명 대조표 일치 | ✅ 통과 | scheduled_at/max_participants/current_participants/duration_hours/fee_per_person/organizer_id 전부 schema 실재·snake_case. game/app status 둘 다 Int |
| 정원 자동전환 race-safe (apply reserve) | ✅ 통과 | 같은 $transaction 내 ①조건부 +1(current<max, 0rows→FULL throw) ②`status=1 AND current>=max`→2 조건부 raw UPDATE. 증가 후 최대 current==max라 >= 정확. max=null 분기는 단순증가(전환 없음=정상) |
| 복귀 — 거절 경로 (applications/[appId]) | ✅ 통과 | reject만 current-1 → 트랜잭션 내 `status=2 AND current<max`→1. approve는 current 불변 정상 |
| 복귀 — 본인취소 경로 (apply/cancel) | ✅ 통과 | delete+current-1 → 동일 조건부 →1. max=null이면 `current<NULL`=false→no-op 안전. (단 이중감소 결함은 아래 ❌ 참조) |
| 취소 알림 (DELETE bulk) | ✅ 통과 | status `{in:[0,1]}`만 조회→거절(2) 제외 ✓. createNotificationBulk fire-and-forget(.catch). GAME_CANCELLED="game.cancelled" 실재. notifiableId=game.id(BigInt) 타입OK |
| createNotificationBulk 시그니처 | ✅ 통과 | CreateNotificationInput[]·전달키 전부 인터페이스 존재. tsc 통과로 확정 |
| status 5→4 + STATUS_LABEL 정합 | ✅ 통과 | DELETE가 status=4 set. STATUS_LABEL 4=취소 존재. game-status.ts 0=초안·5→4 정정 사유 명문화 |
| 게이트A: status=5 잔존 | ✅ 통과 | 읽기전용 groupBy 재확인 — 분포 0=136/1=158/4=1. **status=5 잔존 0건**. 임시스크립트 즉시 삭제 |
| **회귀 — 가드 3‖4‖5 확장 (완료경기 차단)** | ✅ 통과 | edit page.tsx L413 `isFinished=status===3‖4` 클라가드와 일관. 완료경기 진입 시 noEdit view→리포트 안내(L463). report는 별도 `/report` 라우트라 가드 무관→완료경기 정당동작(리포트) 정상. 서버가드는 클라가드 백업으로 적절 |

📊 종합: **11개 중 10개 통과 / 1개 실패(❌ 정적 재현된 결함 — apply/cancel 이중감소)**

#### ❌ 실패 — apply/cancel 본인취소 status 필터 부재 → current_participants 이중감소/오염 (정적 경로 재현 확인, reviewer 권장①과 동일)
- **재현 경로(코드 추적)**: ①호스트가 신청 거절 → applications/[appId] L74-78에서 `current-1` 됨(신청 status=2). ②**그 거절된 신청자가 본인취소 호출** → apply/cancel L34 findUnique는 **status 필터 없음** → status=2 신청을 또 delete + L44-47 `current-1` → **이중 감소**(같은 1명이 2번 차감).
- **왜 M1에서 critical로 격상**: M1 이전엔 단순 카운트 부정합으로 끝났으나, M1 자동전환이 `current>=max`/`current<max`로 status를 좌우 → 오염된 current(음수/초과)가 확정/모집중 전환을 영구 왜곡(음수면 영영 확정 불가, 과거 초과면 즉시 재확정). **정합성 PR(M1)이 의존하는 current가 신뢰 불가능해짐.**
- **부가 결함(권장②)**: cancel은 경기 status 가드도 없음(scheduled_at만 검사). 완료(3)/취소(4)/자동확정(2) 경기의 신청도 delete+decrement → current 부적절 차감.
- **수정안**: delete/decrement 전 `if (application.status !== 0 && application.status !== 1)` 이면 정원 차감 스킵(또는 조건부 raw `current-1 WHERE current>0`). + 경기 status 1·2일 때만 본인취소 허용. **운영DB write 금지로 실 HTTP 재현은 생략, 코드경로 정적추적으로 확정**. reviewer도 독립 발견(권장①②).

#### 🟡 비차단 관찰 (동작영향 0 — 후속)
- **완료(3) 경기 호스트 "경기 취소" 버튼 노출 잔존**: page.tsx L579 HostPanel은 isHost만 보고 status 무관 렌더. 클릭 시 서버가드가 400 GAME_ENDED→alert → **데이터 안전**(취소 안 됨). UI 숨김은 후속.
- **host-actions.tsx L8/L10 주석 stale**: "soft delete → status=5" 주석 잔존(실제 status=4). 동작영향0·주석만.

## 리뷰 결과 (reviewer)

### 매칭 M2 UI(시안 B) 리뷰 — 2026-06-19

📊 종합 판정: **통과 (조건부)** — 차단 0 / 권장 3 / 후속 3
대상 6파일(apply-panel·promote-confirm·me/registrations·my/registrations page+client·game-card). 디자인 13룰·상태분기·IDOR 전부 견고. 차단 사유 없음. 단 권장①(full→"참가 신청" 라벨이 대기 신청 인지 어려움 — dev 명시 갭)은 사용자 결정 필요.

✅ 잘된 점:
- **디자인 13룰 준수.** 색상 토큰 전부 실재(`--bdr-red`/`--danger`/`--warn`/`--ok`/`--cafe-blue`/`--ink-*`/`--bg-alt`/`--bg-elev`/`--ff-mono`/`--ff-display` globals.css 확인). lucide 0(Material Symbols만: notifications_active/group_add/sports_basketball/check_circle/cancel/mail/arrow_forward). pill 9999px 0(전부 4~6px borderRadius). 720px @media 분기(registrations-client `.reg-row`/`.reg-actions`). 터치 44px(confirm/cancel/상세 버튼 minHeight 44 + Button min-h-[44px]). color-mix 틴트로 하드코딩 hex 회피. AppNav 무관(콘텐츠만 — 헤더 미변경).
- **상태분기 정확·누락/중복 없음.** apply-panel: open(null)/applied(0)/confirmed(1)/rejected(2)/waiting(3&!promoted)/promoted(3&deadline미래) 6분기 상호배타. promoted 파생 = `status===3 && deadline!=null && new Date(deadline)>now` 정확. waiting=`status===3 && !isPromoted`로 보수. registrations-client deriveState도 동일 로직(1→confirmed/2→rejected/3+deadline미래→promoted/3→waiting/else→applied) 일관.
- **서버권위 카운트다운 준수.** PromoteConfirm·CountdownText 모두 `left<=0`이어도 버튼 비활성화 안 함(disabled=loading만). 카운트다운은 표시용, confirm 가부는 서버 410/409가 최종(DATA-BINDING §2-2 충족). `secondsLeft` 음수 0 클램프 + `left<=0`이면 setInterval 정리(누수 방지).
- **confirm UX 분기 명확.** 200=성공 메시지+refresh / 410=만료(다음순번 안내)+refresh / 409=정원초과 안내+refresh / 그외=일반 오류 / catch=네트워크 오류. 성공·만료·초과 모두 router.refresh로 상태 재동기화. registrations-client는 alert+load()+refresh로 동일.
- **/me/registrations 보안 견고.** withWebAuth 가드. `where.user_id = ctx.userId` 고정(IDOR 안전 — 타인 신청 조회 불가). select로 컬럼 화이트리스트(과다 노출 0 — passwordDigest 등 민감필드 미포함). limit 1~100 클램프(과다 전송 방지). BigInt→string 직렬화. 응답 snake_case(apiSuccess 자동변환) + 프론트 접근자도 snake_case 정합(waitlist_position/promotion_deadline/short_id/game_type). try/catch로 500 흡수.
- **IDOR(상세 page).** ApplyPanel에 넘기는 myApplication은 page.tsx L143-145 `applications.find(a => a.user_id === BigInt(session.sub))`로 이미 본인 것만 추출 → myApplicationId/waitlistPosition/promotionDeadline 전부 본인 데이터. confirm/cancel은 short_id+appId로 기존 라우트(본인/호스트 가드) 재사용.
- **game-card 만석 분기 정확.** `canWaitlist = isFull && status===1 && (gameType 0‖1)` / `isClosedFull = isFull && !canWaitlist`. 대기 가능 카드는 비흐림(opacity 1), 마감은 흐림(0.55~0.6). 만석일 때 무료/마감임박/주말/초보 칩 숨김(`!isFull` 가드). 연습경기(2)·status≥2 만석은 "마감" 정확.
- **mock 금지 준수.** waitlistPosition null이면 "–" 폴백(L476). 승격 배너는 `counts.promoted>0`일 때만. 빈 상태 카드(items.length===0). finalMvp 없으면 라인 미렌더. 하드코딩 카운트다운(시안 1790)·점선 미리보기바 미박제.

🟡 권장 수정:
- **[apply-panel.tsx L427~434 — UX 갭(dev 플래그 ⑤)] 만석(status=1) 경기에서 GameApplyButton 라벨이 "참가 신청" 유지 → 사용자가 "대기 신청"임을 인지 못함.** myApplicationStatus==null인 미신청자는 만석이어도 기존 GameApplyButton이 렌더되고, POST 시 백엔드가 자동 status=3(대기) 등록함. 그러나 버튼 라벨·패널 어디에도 "정원 마감 · 대기 신청"임을 알리는 카피가 없음 → 사용자는 정상 참가로 오인하고 신청 후 대기 N번 화면을 보고 당황 가능. 패널 상단 "N자리 남음"은 remaining=0이면 "0자리 남음"으로 표시되나 약함. **심각도: 중(機能 정상·데이터 안전, UX 혼란).** 데이터패칭 무변경 원칙상 dev가 의도적으로 미박제(요구6 준수)했으나, 최소한 ①remaining===0일 때 패널에 "정원 마감 — 신청 시 대기열 등록" 안내 1줄 추가, 또는 ②GameApplyButton에 만석 시 라벨 오버라이드 prop 전달이 바람직. 시안 전용 카피 박제 여부 = **사용자 결정 필요**.
- **[apply-panel.tsx L510, L536] rgba 하드코딩 잔존(룰10 경미 위반).** 승인 배지 `background: rgba(22,163,74,0.10)` / 거절 배지 `rgba(220,38,38,0.10)`은 var 토큰이 아닌 raw rgba. 다른 곳(promote-confirm·registrations-client)은 `color-mix(in srgb, var(--ok/--accent) N%, transparent)` 패턴 사용 → 일관성 위해 `color-mix(in srgb, var(--ok) 10%, transparent)` / `var(--danger) 10%`로 교체 권장. 동작·시각 영향 거의 0(같은 녹/적 틴트)이나 룰10 "하드코딩 색상 금지" 형식 위반 + 코드 일관성.
- **[apply-panel.tsx L391] 동의 체크박스 `defaultChecked`인데 미전송·검증 0(결정 5=B).** "취소 시 최소 3시간 전 통보 동의"가 체크 상태로 박제되나 서버 전송·차단 없음 → 사용자가 실제로 동의한 적 없는데 동의 표시. UI만 박제임은 주석에 명시됐으나, 법적 동의류는 기본 체크 해제(또는 안내문구 추가)가 안전. (현재 기능 미연결이라 동작영향 0 — 활성화 시점 전 정리 권장)

🔵 후속 (동작영향 0):
- **[promote-confirm.tsx L147] `text-[var(--danger)]`** — danger 토큰 실재(globals.css L59 #E24C4B) 정상. 단 apply-panel 거절 배지는 `--bdr-red`, registrations-client rejected는 `--ink-mute` → 에러/거절 색상 표현이 파일마다 `--danger`/`--bdr-red`/`--err`(미정의 위험)로 갈림. `--err` 토큰은 globals.css에 **미정의**이므로 만약 어디서 `var(--err)` 쓰면 무효 — M2 UI 파일엔 사용 0(확인 완료) 이나 향후 통일 권장.
- **[registrations-client.tsx L421] `place` nullish 체인 우선순위.** `g?.venue_name ?? [g?.city,g?.district].filter(Boolean).join(" ") ?? ""` — venue_name이 빈 문자열("")이면 ??가 통과시켜 city/district로 안 떨어짐(빈 장소 표시). 실데이터 영향 경미(venue_name 보통 null), 후속.
- **[apply-panel.tsx L488] waiting 상태 CancelApplyButton 재사용 — 라벨이 "신청 취소"일 가능성.** 대기 취소 맥락인데 버튼 내부 라벨이 "대기 취소"인지 미확인(CancelApplyButton 내부). registrations-client는 stateKey로 "대기 취소"/"신청 취소" 구분하나 apply-panel은 컴포넌트 통째 재사용 → 라벨 불일치 가능. 후속 확인.

### 매칭 M2 대기열 백엔드+스키마 리뷰 — 2026-06-19

📊 종합 판정: **수정 필요** (차단 1 / 권장 3 / 후속 2)
M2 동시성·정합 코어는 견고. 단 차단①(status=0 취소 좌석해제인데 승격 트리거 누락 — 스펙편차 #2)은 "신청=좌석선점" 모델에서 빈자리 영구 미충원 갭이라 머지 전 보완 권장.

✅ 잘된 점:
- **승격 confirm race 차단 정확.** confirm tx 내 `current+1 WHERE current<max`(0rows→FULL throw→409 롤백) → 두 대기자 동시 confirm해도 한쪽만 통과, 정원 초과 불가. 좌석 확보 후 status=1 전환·필드 클리어가 같은 tx에 묶여 원자적. promotion_deadline 검증(410)도 `application.promotion_deadline < now` **서버 시각 권위**로 판정 — 클라 타이머 신뢰 안 함(올바름).
- **트리거 중복방지 견고.** promoteNextWaitlist는 ①후보 선정 시 `OR[deadline:null, deadline<now]`로 "살아있는 deadline 보유자" 제외 + ②`updateMany WHERE id+status=3`(0rows→null 반환)의 2중 가드. 두 좌석 해제가 동시 발생해도 같은 대기자 중복 승격 불가. 같은 대기자에게 이미 deadline set돼 있으면 후보에서 빠짐.
- **재정렬 원자성.** status=3 취소 시 `updateMany WHERE position > 취소분 → decrement 1`을 같은 tx에서 단일 쿼리로 처리 → race-safe. current_participants 미변경(좌석 미점유) 정확.
- **알림 tx 분리 일관.** 승격 알림은 PromotionResult 반환받아 **커밋 후** sendPromotionNotice fire-and-forget → 롤백 시 유령 알림 0. cancel/reject/confirm 세 경로 모두 동일 패턴. confirm 만료 시 다음 순번 재발동(triggerWaitlistPromotion)도 헬퍼 재사용으로 일관.
- **IDOR/권한 정확.** confirm: `isApplicant = user_id===userId || isHost = organizer_id===userId` 아니면 403. 대기취소: `game_id_user_id` 복합키로 본인 신청만 조회. 거절 PATCH: organizer_id 검증.
- **컨벤션·보안 준수.** 응답 snake_case(waitlist_position/waitlisted). game-status.ts 단일출처 주석 참조. GAME_WAITLIST_PROMOTED 알림 타입 types.ts 한 곳 추가(주석 명료). short UUID hex 8자리 정규식 검증(LIKE 인젝션 방지) 전 경로 일관. schema 변경 = M2 2컬럼만(무관 변경 0, NULL 허용 무중단).

🔴 필수 수정 (차단 — 머지 전 보완 권장):
- **[apply/cancel/route.ts L82~84] status=0 본인취소가 좌석 해제하는데 승격 트리거 누락 (스펙편차 #2 — 갭).**
  이 코드베이스는 **"신청=좌석선점"**(apply 시 status=0도 current+1로 좌석 점유). cancel L63은 status `0‖1` 모두 `current-1`로 좌석을 해제하는데, 승격 트리거는 L82 `if (application.status === 1)`로 **status=1 취소에만** 걸려있음.
  → **결과 갭**: status=0(미승인) 참가자가 본인취소하면 좌석은 비는데(current-1) 대기열 승격이 안 일어남. 정원 마감으로 대기자가 쌓인 경기에서, 미승인 참가자가 빠진 빈자리가 **영구 미충원**으로 남을 수 있음(누군가 거절/status=1취소를 트리거하기 전까지).
  → **비대칭 증거**: 같은 status=0 좌석이 **거절(applications/[appId] L96)**로 비면 `promoteNextWaitlist` **무조건 호출**됨. 즉 "호스트 거절 → 승격 O / 본인취소 → 승격 X"로 동일 좌석해제에 트리거가 갈림. 일관성 결여.
  → **심각도 평가**: 데이터 오염은 아님(current는 정확). 그러나 M2 핵심 가치(빈자리 자동 승격)가 status=0 취소 경로에서 누락되는 **기능 갭**. "신청=좌석선점" 모델에선 status 0·1 구분 없이 좌석이 비므로 트리거도 0·1 모두여야 정합.
  → **권장안**: L82 조건을 `if (application.status === 0 || application.status === 1)`로 확장(즉 좌석 차감이 일어난 `if (application.status === 0 || application.status === 1)` 블록 안에서 무조건 트리거). 거절 경로와 동일 의미가 됨.
  → **스펙과의 관계**: 스펙 §5 "status=0 취소 트리거 X"는 "status=0=좌석 미점유" 모델을 전제한 듯하나, 이 코드베이스는 status=0도 좌석 점유 → 스펙 전제가 안 맞음. **코드베이스 실제 모델 기준으로 트리거 0·1 확장이 옳음.** (developer reviewer참고 ②와 동일 사안 — 차단으로 격상: 영구 미충원이 M2 목적 자체를 훼손하므로.)

🟡 권장 수정:
- **[applications/[appId]/route.ts] 승격 트리거가 거절(reject)에만 — 승인(approve)엔 없음(정상이나 명시 필요).** approve는 current 불변(좌석 이동 아님)이라 트리거 없는 게 맞음. 다만 confirm에서 status=0→? 흐름과 헷갈리지 않게 주석 보강 권장. (동작 정상)
- **[confirm/route.ts L62~75] 만료 confirm 시 "다음 순번 재발동"이 현재 신청 정리 전 race 여지(minor).** 만료 감지 → L64 updateMany(현 신청 deadline=null) → L69 triggerWaitlistPromotion 순서. updateMany와 trigger가 **별도 호출**(단일 tx 아님)이라, 극단적으로 동시 confirm 2건이 같은 만료자를 처리하면 trigger가 중복 실행될 수 있음. 단 promoteNextWaitlist 자체의 중복방지 가드(살아있는 deadline 제외 + updateMany 0rows)가 2차 방어 → **실질 중복 승격은 막힘**. 알림만 2회 가능성(경미). 후속 모니터링 가능. (차단 아님)
- **[confirm/route.ts L62] 만료 confirm이 410 반환 — 대기자 입장에선 자기 신청이 어떻게 됐는지 불명확(UX).** 만료 시 status는 3 유지, deadline만 클리어 → 대기열에 남아있음. 응답이 410 "만료"만이라 "다시 대기 중"인지 "탈락"인지 모호. 응답 body에 현재 상태 힌트 권장(후속 UI).

🔵 후속 (동작영향 0):
- **[waitlist.ts L57] 후보 선정 `OR[deadline:null, deadline<now]`에서 `deadline<now`(만료자 재선출) — 만료된 대기1번이 confirm 안 하고 방치되면, 다음 좌석 해제 시 그 만료자가 다시 1번 후보로 뽑힘(deadline 재set).** 의도된 동작(만료=기회 소멸 아니라 재대기)이나, 무한 재승격으로 뒤 순번이 영영 못 받을 이론적 가능성. 현재 30분 deadline + confirm 안 하면 계속 1번 유지 → 정책 확인 후속(만료 N회 시 후순위 강등 등).
- **[apply/route.ts L145~149] 대기 순번 부여 aggregate `_max + 1`** — status=3 취소 재정렬(decrement)과 결합 시 순번 연속성 유지됨. 단 승격확정으로 position=null 클리어된 자리는 max 계산에서 빠지므로, 매우 드물게 순번 점프 가능(표시상). 동작영향 0.

### 매칭 M1 성사코어+취소정합 백엔드 리뷰 — 2026-06-19

📊 종합 판정: **통과 (조건부)** — 차단 0 / 권장 2 / 후속 3. M1 변경분 자체는 race-safe·정합. 단 권장①(본인취소 status 필터 부재 — 기존 결함이나 M1 자동전환과 결합 시 오염 확대)은 머지 전 보완 권장.

✅ 잘된 점:
- **자동전환/복귀 조건부 raw UPDATE가 정확히 race-safe.** 모두 `WHERE status=N AND current vs max`로 같은 `$transaction` 내 실행 → 조건 불충족 시 0 rows no-op. apply는 reserve(`current+1 WHERE current<max`, 0 rows면 FULL throw) 직후 전환 UPDATE를 같은 트랜잭션에 배치 → current 증가와 status=2 전환이 원자적. 거절/본인취소도 decrement와 복귀 UPDATE 동일 트랜잭션. 두 동시 신청이 같은 마지막 슬롯을 다퉈도 reserve의 조건부 UPDATE가 한쪽만 통과시키므로 정원 초과 불가.
- **경계조건 처리 적절.** 자동전환에 `>=`(== 아님) 사용 → current가 이미 max 이상으로 오염된 데이터에서도 전환 누락 없음(reviewer 참고 ②의 의도대로). 복귀는 `< max` → max 도달 시 모집중 복귀 안 함(정합).
- **취소 알림 설계 타당.** `createNotificationBulk`(createMany + Promise.allSettled push)는 다수 발송에 적합. status DB update가 이미 커밋된 **후** `.catch(()=>{})` fire-and-forget → 알림 실패가 취소를 롤백 못 함(올바름). 대상 필터 `status: { in: [0, 1] }`로 거절(2) 제외 정확. `GAME_CANCELLED`("game.cancelled") 타입·시그니처 실재 확인.
- **권한/IDOR 유지.** PATCH/DELETE는 `organizer_id !== userId` → 403. 승인/거절 PATCH도 `game.organizer_id !== ctx.userId` → 403. 본인취소는 `game_id_user_id` 복합키로 본인 신청만 조회. apply는 주최자 본인 신청 차단. 회귀 0.
- **컨벤션 준수.** 응답 snake_case(game-status.ts 단일출처 라벨 4=취소 정합, GET raw `status` snake). 매직넘버 대신 status 의미는 game-status.ts 주석에 명문화(0=초안/4=취소 통일 사유 포함). §0 필드명 일치(current_participants/max_participants/scheduled_at).
- **schema 변경 0·destructive 0.** prisma diff 비어있음. 게이트 A(status=5 잔존 0건) 읽기전용 groupBy로 확인 후 코드 정정만 — DB 무변경. UPDATE도 단일 row 조건부, 운영 안전.
- **가드 확장(3 추가) 정당.** PATCH/DELETE 별도 분기 없음(완료 경기 후속작업=기록제출 등은 다른 라우트). 완료(3) 경기를 수정/취소하는 건 막아야 정상 → 확장이 막는 건 "버그성 동작"이지 정당한 동작 아님. 회귀 위험 낮음(아래 후속① UI 노출만 정리 필요).

🟡 권장 수정 (머지 전 보완 권장):
- **[apply/cancel/route.ts L42~47] 본인취소가 거절(status=2)·이미처리 신청도 무조건 decrement (기존 결함, M1로 영향 확대).** 본인취소는 `game_applications` status 필터 없이 delete + `decrement: 1`. 거절 경로(applications/[appId])는 거절 시 이미 decrement 했는데, 그 신청자가 본인취소를 호출하면 **이중 감소** → current_participants 음수/오염 가능. M1 이전엔 status 부정합으로 끝났지만, M1 자동전환 도입 후엔 오염된 current가 자동전환 `>=` 판정을 왜곡(예: 음수 current면 영영 확정 안 됨, 또는 과거 오염으로 max 초과면 즉시 재확정). **수정안: delete 전 `if (application.status === 2) → 이미 거절된 신청은 정원 차감 스킵`, 또는 조건부 raw `current-1 WHERE current>0 AND status IN(0,1 신청)`로 가드.** (※ M1 신규 코드 아님 → 차단 아닌 권장. 다만 M1이 정합성 PR이므로 같이 잡는 게 일관됨.)
- **[apply/cancel/route.ts] 본인취소에 경기 status 가드 부재.** 취소(4)·완료(3)·확정후 자동전환된 경기에서도 신청이 delete+decrement 됨. apply는 `status!==1` 차단하나 cancel은 scheduled_at만 검사. 완료/취소된 경기의 신청을 본인이 취소하면 current가 부적절히 깎임. **수정안: `game.status`가 1·2(모집중/확정)일 때만 취소 허용, 또는 최소 4(취소)는 차단.** (정합성 강화 — 강제 아님)

🔵 후속 (동작영향 0 또는 UI):
- **HostActions/HostPanel 완료(3) 경기 버튼 노출.** page.tsx는 `isHost`면 status 무관하게 HostPanel 렌더 → 완료 경기에서도 수정/취소 버튼 노출 가능. 가드 확장으로 이제 클릭 시 400("이미 종료된 경기"). **백엔드 가드는 정상**(잘못된 호출 차단)이나 UX상 완료 경기엔 버튼 숨김/비활성 권장. 후속 UI PR.
- **host-actions.tsx 주석 stale.** L10/L8 주석에 "soft delete → status=5" 잔존(실제 코드는 4로 변경됨). 라벨/동작엔 영향 0, 주석만 정정 후속.
- **apply 자동전환 후 current>max 오염 시 복귀 불가(이론).** 복귀 UPDATE `< max` 조건이라, 만약 오염으로 current가 max 초과 상태면 거절/취소로 1 감소해도 여전히 >max → 모집중 복귀 안 됨. 게이트 A에서 오염 0건 확인됐고 reserve가 `< max` 가드로 신규 초과를 막으므로 **현재 실데이터 위험 0**. 권장①의 음수/이중감소만 정리되면 완전 해소. 후속 모니터링.

### B2·B3 백엔드 리뷰 — 2026-06-19

📊 종합 판정: **수정 필요** (차단 1 / 권장 2 / 후속 3)

✅ 잘된 점:
- 토큰 규격이 웹 라우트와 **완전 일치**(randomBytes(32) 64자hex / 30분 / bcrypt rounds=12). 회귀 위험 0.
- enumeration 방지가 라우트+lib 이중으로 견고: 미존재/탈퇴/소셜 모두 동일 반환, lib throw도 라우트 try/catch로 흡수해 항상 200 {ok:true}. 에러 로그는 메시지만(토큰값 노출 없음).
- 토큰 일회성: confirm 성공 시 reset_token=null 클리어 → 재사용 차단. findFirst에 `reset_token_expires:{gte:now}` 만료 가드 정확.
- 웹 라우트 무수정 결정 **타당**. 웹은 rate-limit/dev-token/withdrawn 분기가 섞여 리팩터 리스크 큼 → v1 전용 lib 신규는 옳은 트레이드오프(중복 일부 잔존 < 회귀안전).
- B3 캐시헤더 위해 NextResponse.json 직접 사용 + snake_case 수기 작성 일관. placeholder에 TODO 주석 명시.
- 시크릿 노출 없음(RESEND_API_KEY 서버전용, NEXT_PUBLIC_ 위반 0).

🔴 필수 수정 (차단):
- **[v1/auth/reset-password-request/route.ts] rate-limit 부재** — 웹 forgot-password는 `checkRateLimit(login)` 적용(L17-21)인데 v1 신규 라우트엔 **없음**. v1은 인증 게이트(withAuth) 없는 공개 엔드포인트라 무제한 메일 트리거 가능 → ①Resend 발송량 폭주(비용/평판) ②동일 이메일 반복 시 reset_token 계속 덮어쓰기 ③enumeration 외 또 다른 남용 벡터. 웹과 동일하게 IP 기준 rate-limit 추가 필요(`getClientIp` + `checkRateLimit('v1-reset-req:'+ip, RATE_LIMITS.login)`). 초과 시 **429도 enumeration 무관하게 일률 반환**(이메일과 무관한 IP 기준이므로 안전).

🟡 권장 수정:
- **[password-reset.ts L48-56] 타이밍 사이드채널(minor)** — 미존재 이메일은 `findUnique` 1회 후 즉시 return하지만, 존재 이메일은 추가로 `update`+`sendEmail`(네트워크 왕복)까지 수행 → 응답 시간차로 가입여부 추정 가능. 실무상 대부분 무시하지만, 방어하려면 발송을 fire-and-forget(await 안 함)하거나 라우트에서 요청을 비동기 큐로 흘리는 방식 검토. (강제 아님 — rate-limit이 더 우선)
- **[reset-password/route.ts] confirm 라우트 try/catch 부재(minor)** — request 라우트는 try/catch로 throw 흡수하나, confirm은 `confirmPasswordReset` 호출을 감싸지 않음. prisma update 실패 시 Next 기본 500(스택 노출 가능). 웹 라우트처럼 try/catch로 감싸 `internalError()` 반환 권장. (동작 영향: 정상 흐름엔 0, 장애 시 응답 안정성)

🔵 후속 (동작영향 0):
- email.ts `sendEmail`은 Resend 실패 시 {success:false} 반환만 하고 throw 안 함 → request 라우트는 성공으로 간주(enumeration엔 오히려 안전, 의도된 동작). 단 발송 실패 사일런트 → 운영 모니터링(실패율 로그/알림) 후속 고려.
- B3 apk_url placeholder가 `/downloads/placeholder.apk`로 실경로처럼 보임 → 404 응답이긴 하나, 앱이 is_mandatory=false라 다운로드 안 함(현재 안전). 단 실배포 전 sha256="" / size_bytes=0 검증 가드(앱측 또는 라우트에서 빈값이면 latest_version_code를 0/노출안함)는 후속.
- v1 reset 라우트들 OpenAPI/문서 동기화는 앱측 호출코드 작성 시 후속.

## 보류 중 (재개 대기)
- **버킷 B 관리자 계획** — 데이터부재 7기능 신규테이블. 결정 5건 대기(`mock-data-absent-admin-plan-2026-06-14.md`)
- **디자인 일관성 QA 패스** — Claude.ai 산출(bake-fix-checklist) 대기
- **7f28 #301 결선 슬롯** — #301(pbp271 보존) "결승" 오생성 슬롯 잔존(경기 의미 확정 후 재배치). 예선 #291(OT1동점 미종료)·#292(미기록) 대기
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨(편의 기능)
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만)

## 수정 요청 (후속·동작영향0)
| 대상 | 문제 | 상태 |
|------|------|------|
| src/proxy.ts L65~71 PUBLIC_API_ROUTES (CRITICAL, tester) | 신규 3경로 누락 → reset-password-request/reset-password/app/version 전부 401(JWT 없는 로그인전·앱부팅 호출인데 proxy가 토큰 요구). 기능 전체 불통. 화이트리스트에 3줄 추가 시 해결(라우트 코드는 무결 검증됨) | ✅ 완료(1차) |
| v1/auth/reset-password-request/route.ts (blocker) | rate-limit 부재. 공개 엔드포인트라 무제한 메일 트리거 가능(Resend 폭주/토큰 덮어쓰기). 웹 forgot-password처럼 IP기준 checkRateLimit(login) 추가. 초과 시 429 일률 반환 | ✅ 완료(1차) |
| v1/auth/reset-password/route.ts (권장) | confirm 호출에 try/catch 없음 → prisma 실패 시 기본500 스택노출. 웹처럼 try/catch+internalError() 권장 | ✅ 완료(1차) |
| password-reset.ts 타이밍 사이드채널(minor, reviewer 권장2) | 미존재/존재 이메일 응답 시간차 → sendEmail fire-and-forget(void+.catch)으로 완화 | ✅ 완료(1차) |
| apply/cancel/route.ts (reviewer 권장, M1) | 본인취소가 status 필터 없이 무조건 decrement → 거절(2) 신청 본인취소 시 이중감소·음수 current 오염. M1 자동전환 `>=` 판정 왜곡 가능. delete 전 거절분 차감 스킵 or 조건부 raw `WHERE current>0`. + 경기 status(4/3) 가드 추가 권장 | M1 머지 전 검토 |
| apply/cancel/route.ts L82~84 (M2 차단, reviewer+tester 독립확인 — 스펙편차 #2) | status=0 본인취소가 좌석 해제(current-1)하는데 승격 트리거는 status===1에만 걸림. "신청=좌석선점" 모델이라 status=0도 좌석 점유 → 미승인 참가자 본인취소 시 빈자리 **영구 미충원**(M2 목적 훼손). 거절 경로는 status=0도 무조건 트리거하므로 **비대칭**. 수정안: L82 조건을 `status===0 ‖ status===1`로 확장(좌석 차감 블록 안에서 무조건 promoteNextWaitlist). 코드베이스 실제 모델 기준 트리거 0·1이 옳음(스펙 §5 전제 불일치) | ✅ 완료(M2 보완1차) — 좌석 차감 블록 안에서 무조건 트리거. 거절 경로와 대칭. 사용자 승인 반영 |
| apply-panel.tsx L427~434 (M2 UI 권장 — 사용자 결정 필요, reviewer) | 만석(status=1) 미신청자에 GameApplyButton "참가 신청" 라벨 그대로 → 백엔드가 자동 대기(status=3) 등록하나 "대기 신청"임을 알리는 카피 없음. 사용자 정상참가 오인 가능(機能·데이터는 안전). 데이터패칭 무변경 원칙상 dev 의도적 미박제(요구6). 보완안 ①remaining===0 시 "정원 마감—신청 시 대기열 등록" 안내 1줄 ②GameApplyButton 만석 라벨 오버라이드. 시안 전용카피 박제 여부 사용자 결정 | ✅ 완료(wave2) — 사용자 결정 반영. GameApplyButton isFull prop→라벨 "대기 신청" + 패널 "정원 마감 · 대기 등록" 안내(보완안 ①②). 데이터패칭 무변경 |
| apply-panel.tsx L510/L536 (M2 UI 권장 minor, reviewer) | 승인/거절 배지 background가 raw rgba(22,163,74,0.10)/(220,38,38,0.10) 하드코딩(룰10 경미위반). 타 파일 패턴인 color-mix(var(--ok/--danger) 10%, transparent)로 교체 권장. 시각영향 0 | 후속 |
| registrations-client.tsx L355 (M2 UI minor, tester) | 빈상태 CTA "경기 둘러보기" 버튼에 `color:"#fff"` 하드코딩(신규 파일, 룰10 경미위반). accent 배경 위 흰 텍스트—가독성 문제 0이나 토큰(var(--on-accent) 등) 권장. 동작영향 0 | ✅ 완료(wave2) — `var(--ink-on-brand)` 교체(accent 배경 텍스트 표준 토큰, light/dark 정의됨). 하드코딩 hex 0 |
| confirm/route.ts L62~74 (M2 minor, tester) | 만료 confirm 시 본인 deadline=null 정리 후 triggerWaitlistPromotion이 `OR[deadline null]`+position asc로 후보 재선출 → 만료자가 여전히 최앞 순번이면 본인이 다시 승격(새 30분). "만료→다음순번" 스펙과 미세편차. 무한루프 아님(다음 confirm서 또 만료처리). 운영 안전, 후속 정책 확인 | ✅ 완료(M2 보완1차) — demoteExpiredAndPromoteNext 신규: 만료자 맨 뒤 강등 후 재선출. 무한 자기승격 방지 |
| apply/cancel/route.ts L34~58 (M1 critical, tester+reviewer 독립발견) | 본인취소 findUnique에 status 필터 없음 → 거절(2)된 신청 본인취소 시 current_participants **이중감소**(거절서 1차감+취소서 또 1차감). M1 자동전환이 오염된 current로 확정/모집중 판정 영구왜곡. delete/decrement 전 `status===0‖1`만 차감 + 경기 status 1·2일때만 취소 허용 가드 추가 | ✅ 완료(1차) |
| scrim-tabs.tsx L295 (critical) | 보낸취소가 URL[id]=from_team 전송→PATCH(to_team 강제) 항상 400. `patchStatus(counterpart.id)` + null가드 필요 | developer 재작업 |
| scrim PATCH 가드(minor) | 수락/거절 captain only(vice/manager 없음)→isCaptain 헬퍼 통일 검토 | 후속 |
| game.ts L44 | game_type=parseInt(영문type)→NaN. 영문↔정수 매핑 필요(기존버그) | 후속 |
| tournament-completed-bracket.tsx L274 | 조내 정렬 승수만(gnba 미세순위차) | 후속 |
| stats / lineup minor | server/client 마크업 중복·C버튼 a11y·badge라벨 | 후속 |

## 완료 Phase (이력 압축)
- ✅ **의뢰서 STAGE1/2 + 갭①② (2026-06-16)** — effectiveTournamentStatus(공개화면)·Admin S1~S3·팀검수·통합디스패처 + 갭①(팀 핵심정보 변경 재검수)·갭②(프로필 대회 종료 표시). 전부 main
- ✅ **기록(Records) 3화면 + 출전시간 PBP 재계산 (2026-06-16, PR#707~714)** — 대회/선수/팀 기록 탭. 공식가드 집계·평점null'–'·21컬럼 box. 출전시간=minutes-engine 공용추출(`match-minutes.ts`)·999truncate회피·종이'–'·평균/누적 파란토글. 라이브 회귀 maxDiff=0
- ✅ **대회종료 후속 (2026-06-15)** — ①우승팀 set-champion ②auto-complete cron ③Phase2/3 백필. champion=Team.id/winner=TT.id 변환
- ✅ **PR-MOCK-TO-REAL ①②③ (`ee1a0c3`) / Phase12 13화면 / LINEUP-V2 / Phase10 5시안 (2026-06-14)**
- ✅ **PR-RECORDER-AUDIT / 대회종료B안 / 9C / Phase1~9 / PR-PERM-DISPLAY** (이전)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-19 | 매칭 M2 UI(시안 B) 검증 (tester) | ✅ 12/13 통과·1부분(디자인minor). tsc0·apply-panel 5케이스(open/full/waiting/promoted/confirmed) 누락중복0·promote-confirm 410/409 서버권위·/me/registrations 무세션 401(curl실측)+snake select·game-card 대기가능/마감(픽업게스트status1↔status2연습) 정합·720px·44px·Material Symbols·AppNav diff0. 🟡 registrations-client L355 color:"#fff" 하드코딩 1건→수정요청(동작영향0). 운영write 0 |
| 2026-06-19 | 매칭 M2 UI(시안 B) 리뷰 (reviewer) | 📊 통과(조건부) 차단0/권장3/후속3. 디자인13룰(토큰 전부실재·lucide0·pill0·720px·44px)·상태분기6종 상호배타·서버권위 카운트다운·confirm 410/409 UX·/me/registrations IDOR+snake+select화이트리스트 전부 견고. 권장①=full시 "참가신청" 라벨이 대기신청 인지 어려움(dev명시 갭, **사용자 결정 필요**). 권장②=rgba 하드코딩 2곳 color-mix 교체. 권장③=동의 체크박스 defaultChecked 미전송 |
| 2026-06-19 | 매칭 M2 wave2 대기열 UI (developer) | ✅ page.tsx ApplyPanel에 대기열필드 전달·apply-panel waiting/promoted/confirmed 분기·promote-confirm.tsx(카운트다운+confirm POST 410/409)·/me/registrations GET·/my/registrations 화면·game-card 대기가능/마감 뱃지. tsc 통과. 신규 GET 401 가드정상. 운영write 0. 디자인룰(토큰/44px/720px) 준수 |
| 2026-06-19 | 매칭 M2 보완루프 1차 (developer) | ✅ 수정1(차단): cancel 승격 트리거를 좌석차감 블록(status 0‖1) 안 무조건 호출(거절경로와 대칭, status=0 본인취소 빈자리 미충원 해소). 수정2(minor): confirm 만료 시 demoteExpiredAndPromoteNext 신규(만료자 맨뒤 강등 후 재선출→무한 자기승격 방지). tsc 통과·운영write 0·schema 무변경 |
| 2026-06-19 | 매칭 M2 대기열 백엔드 리뷰 (reviewer) | 📊 수정필요(차단1/권장3/후속2). 동시성·confirm race·중복방지·IDOR·snake 전부 견고. 차단①=status=0 본인취소 좌석해제인데 승격 트리거 누락(스펙편차#2, 거절경로와 비대칭→빈자리 영구미충원). cancel L82 조건 0·1 확장 권장 |
| 2026-06-19 | 매칭 M2 대기열 백엔드 검증 (tester) | ✅ 15/15 통과(tsc·실DB컬럼 smallint/timestamp nullable·live_scoreboards 무변경·순번/재정렬/승격트리거/confirm race·IDOR·snake). 🟡비차단 2(status=0 취소 승격갭=reviewer중복확인 M2머지전 검토 / confirm 만료자 재선출 minor). 운영write 0·임시mjs 삭제 |
| 2026-06-19 | 매칭 M2 대기열 백엔드+스키마 (developer) | ✅ waitlist_position/promotion_deadline 2컬럼 **targeted SQL**(broad db push는 live_scoreboards 드리프트 섞여 회피)·GAME_WAITLIST_PROMOTED·lib/games/waitlist.ts 헬퍼·apply 대기(3)·cancel 재정렬+승격트리거·reject 승격트리거·confirm API(410/409/IDOR). tsc통과. 운영write 0 |
| 2026-06-19 | 매칭 M1 성사코어+취소정합 (developer) | ✅ 정원 1→2 자동전환(apply reserve)·2→1 복귀(거절/본인취소)·취소 status 5→4 통일·취소 시 신청자 bulk 알림. 게이트A: status=5 잔존 0건(UPDATE 불필요). schema변경0·tsc통과 |
| 2026-06-19 | B2(앱 비번재설정+Resend)+B3(앱버전) 구현 (developer) | ✅ resend 설치·email.ts mybdr.kr·공통lib(password-reset.ts)·v1 라우트 3종(reset-request/reset/app-version)·웹 라우트 무수정(안전)·tsc 통과 |
| 2026-06-16 | 기록 출전시간 PBP재계산+토글 main (pm+live-expert) | ✅ 90d67e7→PR#713/#714. minutes-engine 공용추출·999회피·종이'–'·파란토글. 라이브 회귀 maxDiff=0·vitest21/21. knowledge 3파일 기록 |
| 2026-06-16 | 갭①② main 머지 (pm) | ✅ 1bf805f/7cfe0a8 → PR#711/#712 main. 선별커밋으로 멀티세션 충돌0·미푸시0 |
| 2026-06-16 | 갭①② 검증 (tester/reviewer) | ✅ tester 10/10·reviewer 통과(차단0). 변경 2파일 tsc0 |
| 2026-06-16 | STAGE1 effectiveStatus main머지 + 작업트리 정리 (pm) | ✅ 502fe53/ec2d7b7·gallery stash 보존 |
| 2026-06-15 | Admin S1~S3 + 팀검수 + 시즌시상 + 코트제보 (다수) | ✅ main. reviewer 전건 APPROVE |
| 2026-06-15 | 대회종료 후속 ①②③ (planner+dev) | ✅ set-champion/auto-complete cron·Phase2/3 백필 |
