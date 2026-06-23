# BDR v2.34 — 데이터 바인딩 명세 (DATA-BINDING)

> 시안 A~D(M2~M5) UI ↔ 실제 DB·API 매핑. 박제(`sync-bdr-current.ps1`) 후 구현 기준 문서.
> 확정 정책(의뢰서): **대기열=알림후수동 승격 / 취소 status=4 / 종료=lazy update / 결제 보류 / manner_score=Phase 10 구현 완료**.
> ⚠️ 본 문서는 기존 버전 status enum 컨벤션 + 의뢰 확정 결정으로 작성한 **제안 계약**. 운영 스키마(`matchmaking-advancement-plan-2026-06-18.md`)와 1건이라도 다르면 그 문서가 우선 — 필드명 대조 후 박제.

---

## 0. 시안 → 데이터 의존 요약

| 시안 | 새 데이터 의존 | 신규 쓰기 액션 |
|:--:|------|------|
| A (Games) | `game.status`, `game.applied/spots`, `game.starts_at`, 정렬·필터 파생값 | 없음 (읽기 전용) |
| B (대기열) | `registration.status=waiting`, `waitlist_position`, `promotion_deadline` | 대기 신청 / 대기 취소 / 승격 확정 |
| C (출석) | `attendance.status`, `registration.noshow` | 출석 토글 / 리포트 노쇼 플래그 |
| D (평점) | `manner_score`, `mvp_count`, `games_played`, `rating.exists` | 평점 제출(기존 리포트) |

---

## 1. status 코드 (단일 출처)

### 1-1. `game.status` (경기 상태 — lazy update)
| 코드 | 의미 | UI |
|:--:|------|------|
| 1 | 모집중 | 카드 "모집중"(--ok) / 상세 신청 패널 |
| 2 | 확정(정원·시간 확정) | "확정" 뱃지 / 출석 체크 활성 조건 |
| 3 | 완료 | "경기 종료" / 평점 CTA / 리포트 |
| 4 | 취소 | 카드·상세 비활성 |

> **lazy update**: status 2→3 전환은 배치가 아니라 **다음 조회 시점에 `starts_at + duration < now()` 면 3으로 간주**. 프론트는 `game.status===2 && endsAt < now ? 3 : game.status` 로 파생 표시. 서버는 리포트 작성·조회 트리거 시 실제 컬럼 갱신.

### 1-2. `registration.status` (신청 상태)
| 값 | 라벨 | 화면 |
|------|------|------|
| `applied` | 신청완료 | MyReg 신청완료 / 상세 모집중 |
| `confirmed` | 확정 | MyReg 확정 / 상세 확정 패널 |
| `waiting` | 대기 N번 | MyReg 대기중 / 상세 "대기 N번" |
| `promoted` | 승격(확정 대기) | MyReg 승격 배너 / 상세 카운트다운 CTA |
| `rejected` | 거절됨 | (기존) |
| `cancelled`(status=4 연동) | 취소 | (기존) |

> `promoted`는 **별도 컬럼이 아니라 파생 상태**: `status=waiting AND promotion_deadline IS NOT NULL AND promotion_deadline > now()`. 마감 초과 시 서버가 `waiting`(다음 순번)으로 강등 + 본인은 `expired` 안내.

---

## 2. 테이블 / 필드 추가

### 2-1. `games` (기존 확장)
```
starts_at        timestamptz   -- 정렬(임박순)·lazy 종료 판정. 현재 시안의 date/time 문자열 대체
duration_min     int           -- 종료시각 = starts_at + duration
capacity         int           -- 시안 spots
applied_count    int           -- 시안 applied (승인완료 수, 비정규화 카운터)
waitlist_count   int           -- 시안 waitlist
lat, lng         numeric|null  -- "가까운순"·"내 동네" 칩 (null이면 정렬 옵션 비활성)
fee_amount       int           -- 0 = 무료칩. 현재 "₩5,000" 문자열은 표시용 파생
```
파생(서버 계산 또는 프론트):
- `fill_pct = round(applied_count / capacity * 100)`
- `is_full = applied_count >= capacity`
- `is_filling = !is_full && (fill_pct >= 70)` → "마감임박"(--accent)
- 상태 뱃지: `is_full ? (대기 허용? '대기 가능':'마감') : is_filling ? '마감임박' : '모집중'`

### 2-2. `registrations` (대기열)
```
status                enum   -- §1-2
waitlist_position     int|null   -- 대기 순번 (1부터). 승급/취소 시 재정렬
promotion_deadline    timestamptz|null  -- 승격 알림 발송시각 + 30분. 카운트다운 source
noshow                bool   default false  -- 리포트 노쇼 플래그 (기존 유지)
```
> **카운트다운 = `promotion_deadline - now()`**. 클라이언트 타이머는 표시용일 뿐, 확정 가부는 **서버가 deadline 으로 판정**(클라 타이머 0 도달 ≠ 확정 불가 확정).

### 2-3. `attendances` (시안 C 신규)
```
game_id, user_id      (PK 복합)
status                enum  present | absent | null(미체크)
checked_by            user_id  -- 호스트
checked_at            timestamptz
```
> `absent` 저장 → 리포트에서 해당 참가자 `noshow=true` 기본값으로 prefill. 출석 미체크(null)는 노쇼 아님.

### 2-4. `user_stats` / profile (시안 D, Phase 10)
```
manner_score    numeric(2,1)   -- 0.0~5.0. **숫자 비노출**, 등급 라벨로만 표시
mvp_count       int
games_played    int
has_ratings     bool           -- false면 신뢰 카드 "아직 기록 없음"
```
**등급 라벨 매핑** (시안 제안 — `01 §3` 갱신 대상):
| manner_score | 라벨 | 토큰 |
|:--:|------|------|
| ≥ 4.5 | 아주 좋음 | --ok |
| 4.0–4.4 | 좋음 | --cafe-blue |
| 3.0–3.9 | 보통 | --ink-mute |
| < 3.0 | 주의 필요 | --warn |

---

## 3. API 엔드포인트

| 시안 | 메서드·경로 | 요청 | 응답·효과 |
|:--:|------|------|------|
| A | `GET /games?sort=&chips[]=&kind=` | sort: soon\|filling\|latest · chips: today,weekend,near,filling,free | 필터·정렬된 목록. `near`는 lat/lng 있을 때만 |
| B | `POST /games/:id/waitlist` | — | registration.status=waiting, waitlist_position 부여 |
| B | `DELETE /games/:id/waitlist` | — | 대기 취소, 뒤 순번 −1 재정렬 |
| B | `POST /registrations/:id/confirm` | — | **서버가 promotion_deadline 검증** → 통과 시 confirmed + applied_count+1, 실패 시 410 expired |
| B | (서버 내부) 빈자리 발생 트리거 | — | 대기 1번에게 알림 + promotion_deadline=now+30m 세팅. **자동승격 아님** |
| C | `PUT /games/:id/attendance` | `{user_id, status}` | attendance upsert (호스트 권한 필요) |
| C | `POST /games/:id/report` | 기존 폼 + `noshow[]` | 리포트 저장 → manner_score 반영 잡 |
| D | `GET /users/:id/profile` | — | manner_score·mvp_count·games_played·has_ratings |
| D | `GET /me/registrations` | — | MyRegistrationStatus 목록 |

권한: C의 출석/리포트는 `game.host_id === me` 일 때만 노출·허용(시안에서 `isHost` 토글로 표현).

---

## 4. 시안별 mock → 실데이터 치환 포인트

### 시안 A `Games.jsx`
- `GAMES` 배열 → `GET /games` 응답. 현재 `date/time` 문자열 정렬용 `dateKey()` 는 임시 → **`starts_at` 으로 교체**(서버 정렬 권장, 클라 정렬은 fallback).
- `isWeekend()` 정규식(`(토)/(일)`) → `starts_at` 요일 계산으로 교체.
- `near` 불리언 mock → 사용자 위치 vs `lat/lng` 거리. **좌표 없으면 "가까운순" 정렬·"내 동네" 칩 숨김**.

### 시안 B `GameDetail.jsx` / `MyRegistrationStatus.jsx`
- 상단 **"시안 미리보기" 점선 바(phase·applyState·isHost) 박제 시 제거** — 실제는 `game.status` + 내 `registration.status` + 권한으로 자동 분기.
- `CountdownText seconds={1790}` 하드코딩 → `(promotion_deadline - now)/1000`.
- MyReg 4행 mock → `GET /me/registrations`.

### 시안 C `GameDetail.jsx`(출석) / `GameReport.jsx`
- `attendance` 로컬 state → `PUT /attendance` 낙관적 업데이트(+ 저장중/실패 롤백).
- `showAttendance = isHost && (gameday|ended)` → `me===host_id && game.status>=2`.
- GameReport `noshows=[6]` 초기값 → attendance.absent 목록 prefill.

### 시안 D `Profile.jsx` / `MyActivity.jsx`
- `trust` 객체 mock → `GET /users/:id/profile`. `has_ratings=false` → 빈 상태.
- 평점 CTA 노출 조건 `status==='past' && rated===false` → `game.status===3 && !my_rating.exists`. 작성 완료 시 배너 제거.

---

## 5. 엣지 / 동시성

- **승격 경쟁**: 대기 1번 confirm 과 호스트 정원 변경이 겹칠 때 → confirm 은 트랜잭션 내 `applied_count < capacity` 재확인 후 commit. 초과 시 409.
- **deadline 만료**: 클라 타이머 0 ≠ 확정. 서버 `promotion_deadline < now()` 면 confirm 거부(410) + 다음 순번 승격.
- **lazy 종료 중복 리포트**: status 2→3 파생 표시 중 두 호스트가 동시 리포트 → 첫 제출만 채택, 이후 read-only.
- **정렬 가용성**: `lat/lng` null 비율 높으면 "가까운순" 옵션 자체를 응답 메타(`sort_options`)로 제어 — 클라 하드코딩 금지.

---

## 6. 박제 체크 (이번 문서 관련)
- [ ] status 코드(1/2/3/4, registration enum)가 운영 스키마와 일치하는가
- [ ] `promotion_deadline` 30분이 정책값과 일치(의뢰서 "예: 30분")
- [ ] 출석 `absent` → 리포트 `noshow` prefill 연동 확인
- [ ] manner_score 등급 구간 4단계 PM 확정(§2-4) → `01 §3` 갱신
- [ ] "시안 미리보기" 점선 바 제거 확인 (GameDetail)
