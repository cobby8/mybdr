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

## 테스트 결과 (tester)

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
| 2026-06-19 | 매칭 M1 성사코어+취소정합 (developer) | ✅ 정원 1→2 자동전환(apply reserve)·2→1 복귀(거절/본인취소)·취소 status 5→4 통일·취소 시 신청자 bulk 알림. 게이트A: status=5 잔존 0건(UPDATE 불필요). schema변경0·tsc통과 |
| 2026-06-19 | B2(앱 비번재설정+Resend)+B3(앱버전) 구현 (developer) | ✅ resend 설치·email.ts mybdr.kr·공통lib(password-reset.ts)·v1 라우트 3종(reset-request/reset/app-version)·웹 라우트 무수정(안전)·tsc 통과 |
| 2026-06-16 | 기록 출전시간 PBP재계산+토글 main (pm+live-expert) | ✅ 90d67e7→PR#713/#714. minutes-engine 공용추출·999회피·종이'–'·파란토글. 라이브 회귀 maxDiff=0·vitest21/21. knowledge 3파일 기록 |
| 2026-06-16 | 갭①② main 머지 (pm) | ✅ 1bf805f/7cfe0a8 → PR#711/#712 main. 선별커밋으로 멀티세션 충돌0·미푸시0 |
| 2026-06-16 | 갭①② 검증 (tester/reviewer) | ✅ tester 10/10·reviewer 통과(차단0). 변경 2파일 tsc0 |
| 2026-06-16 | 갭① 팀PATCH 재검수 + 갭② 프로필 보정 (developer) | ✅ active+식별정보 실변경만 pending_review / basketball effectiveTournamentStatus(camel 정정) |
| 2026-06-16 | 의뢰서 STAGE1/2 갭 검증 (Explore) | 본체 완료 확인 + 갭2개 발견(로고변경 재검수 / 프로필 dead code→basketball 실파일) |
| 2026-06-16 | 기록(Records) 3화면 운영반영 (타 세션) | ✅ PR#707~712 main. 공식가드 집계 |
| 2026-06-16 | STAGE1 effectiveStatus main머지 + 작업트리 정리 (pm) | ✅ 502fe53/ec2d7b7·gallery stash 보존 |
| 2026-06-15 | Admin S1~S3 + 팀검수 + 시즌시상 + 코트제보 (다수) | ✅ main. reviewer 전건 APPROVE |
| 2026-06-15 | 대회종료 후속 ①②③ (planner+dev) | ✅ set-champion/auto-complete cron·Phase2/3 백필 |
