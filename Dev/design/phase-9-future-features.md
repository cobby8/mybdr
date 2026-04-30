# Phase 9 시안-Only 기능 — 추후 구현 + 메뉴 숨김 정리

> **상태**: active
> **갱신 주기**: Phase 단위
> **상위 문서**: [README.md](./README.md)
> **함께 보는 문서**: [phase-9-audit.md](./phase-9-audit.md) (진입점) · [phase-9-paste-completeness.md](./phase-9-paste-completeness.md) (충실도)
> **작성일**: 2026-04-29
> **마지막 갱신**: 2026-04-29 (Phase 10 운영 DB SQL 적용 완료 + More 4건 제거 반영)
> **목적**: 시안에는 있지만 실제 DB/API/비즈니스 로직이 미지원인 기능을 식별 → 메뉴 진입점 숨김 + 추후 구현 큐로 이관

---

## 정책 (PM 결정 — 2026-04-29)

> **이전 정책 (2026-04-25)**: "DB 미지원 기능도 제거 금지 — UI 배치 + '준비 중' 표시 + 빈 상태로 두고 추후 구현"
>
> **변경된 정책 (오늘)**: 시안에만 있고 DB/API 미지원 기능은:
> 1. **메뉴 진입점에서는 숨김 처리** — 사용자가 클릭해서 빈 페이지/준비중 토스트만 보는 경험 차단
> 2. **페이지/UI 자체는 유지** — 코드 폐기 아님. DB/API 구현 후 한 줄 활성화로 복귀
> 3. **추후 구현 큐로 이관** — 본 문서 + `.claude/scratchpad.md` "추후 구현 목록" 양쪽 갱신
>
> **왜**: "준비 중" 라벨이 너무 많아져서 신뢰도 저하. 진짜 동작하는 메뉴만 보이게 하고, 동작 안 하는 건 코드만 남기고 메뉴에선 빼는 정책.

---

## KPI

| 지표 | 수치 | 비고 |
|------|------|------|
| 시안 화면 수 | 72 | `BDR v2/screens/*.jsx` |
| 박제 완료된 시안 | 60+ | (paste-completeness.md A+B+C) |
| **DB/API 미지원 기능** (메뉴 숨김 대상) | **15+** | 아래 섹션 1-3 합계 |
| **부분 구현 기능** (UI 일부만) | **8+** | DB 일부 컬럼 누락 — 보강 후 활성 |
| 완전 구현 기능 (현 상태 그대로) | 다수 | 박제 + DB 모두 OK |

---

## 섹션 1 — 메뉴 진입점에서 숨길 기능 (P0 — 즉시)

박제 작업으로 More 메뉴 / 카드 / 사이드바 등에 노출됐지만 **DB/API 미지원으로 클릭 시 동작 X 또는 alert("준비 중")** 인 항목.

### 1-A. More 메뉴 / 글로벌 네비 — ✅ 2026-04-29 처리 완료 (`aa61003`)

| 메뉴 항목 | href | DB/API 상태 | 액션 | 진행 상태 |
|----------|------|------------|------|----------|
| 심판 센터 | `/referee` | **라우트 없음** | More 메뉴에서 제거 | ✅ 제거 (`aa61003`) |
| 게스트 지원 신청 | `/games` (가짜 링크) | ✅ Phase 10 SQL 적용 — `guest_applications` 신규 테이블 | More 제거 + 게임 상세 "게스트 모집중" 배지 노출 시 CTA | ✅ More 제거 / ⏳ CTA 후속 |
| 경기 신고·평가 | `/games/my-games` (가짜) | ✅ Phase 10 SQL 적용 — `game_reports` + `game_player_ratings` | More 제거 + 종료된 경기 카드 "평가" 버튼 | ✅ More 제거 / ⏳ CTA 후속 |
| 심판 배정 요청 | `/tournaments` (가짜) | DB 일부 — referee_requests 부분 | More 제거 + 토너먼트 운영자 영역에서만 노출 | ✅ More 제거 / ⏳ CTA 후속 |

→ **`src/components/bdr-v2/more-groups.ts`** 4개 항목 제거 완료 (commit `aa61003`).

### 1-B. 페이지 내부 카드/CTA

| 위치 | 카드/CTA | DB 상태 | 액션 |
|------|---------|--------|------|
| `/teams/[id]` hero | "팀 팔로우" | `team_follows` 테이블 없음 | 버튼 자체 제거 또는 `display:none`, scratchpad 추후 구현 |
| `/teams/[id]` hero | "쪽지 보내기" | DM 모델 없음 | 동일 처리 |
| `/teams/[id]` 상세 | "매치 신청" | `team_match_requests` 없음 (입단용 JoinButton만 있음) | 동일 처리 |
| `/games/[id]` | "한마디 메시지" 입력 | `game_applications.message` 서버 미전송 | 입력 필드 숨김 |
| `/games/[id]` | "저장/북마크" 버튼 | `bookmarks` 테이블 없음 | 버튼 숨김 |
| `/profile` | "슛존 성공률" 카드 | `match_player_stat` zone 컬럼 없음 | 카드 숨김 처리 (현재 더미 표시) |
| `/profile` | "스카우팅 리포트" | `scouting_reports` 없음 | 카드 숨김 |
| `/profile` | "VS 나" 탭 | `match_player_stat` 조인 미구현 | 탭 숨김 |
| `/users/[id]` | "메시지 보내기" 버튼 (E-2, 2026-04-29) | `/messages`는 `?thread=` 만 처리, `?to=<userId>` 미지원 + DM 모델 없음 | alert 유지. `/messages`에 `?to=` 핸들러 + 스레드 자동 생성 로직 + DM DB 모델 셋트 필요 |

→ 각 페이지 컴포넌트에 `FEATURE_FLAGS.<key>` 패턴으로 가드. 또는 단순히 해당 JSX를 주석 처리(코드는 유지). DB/API 구현 후 한 줄로 복귀.

### 1-C. 시안 only 위저드 단계

| 시안 | 단계 | DB 상태 | 액션 |
|------|-----|--------|------|
| OnboardingV2 | 활동 지역 / 플레이 스타일 / 목표 | `users.styles` / `users.areas` / `users.goals` 컬럼 없음 | 단계 자체 숨기거나 옵션 toast (저장 안 됨 안내) |
| TeamCreate Step3 | 활동 요일 / 실력 수준 / 주 활동 코트 / 공개 설정 | `teams.practice_days` / `teams.level` / `teams.home_court_id` / `teams.is_public` 없음 | Step3 단계 단축 또는 필드 숨김 |
| CourtAdd | 사진 업로더 | S3 파이프라인 미정 | input[type=file] 자체 disabled |

---

## 섹션 2 — 페이지 자체는 유지 / 메뉴에서만 숨김

페이지(`/courts/submit`, `/games/[id]/report`, `/series/new` 등)는 잘 박제되어 있으나 **DB/API 미지원**이면 메뉴에서 직접 노출하지 않는 게 사용자 신뢰도에 좋음. 그 자리에 노출 가능한 자연 진입점 도입 후 활성.

| 라우트 | 박제 상태 | DB 의존 | 권장 |
|--------|---------|--------|------|
| `/games/[id]/report` | A — 완벽 | `game_reports`+`game_player_ratings` 신규 필요 | More 메뉴에서 제거. DB 구현 후 게임 상세 종료 카드에 "평가" CTA 활성 |
| `/games/[id]/guest-apply` | A — 완벽 | `guest_applications` (또는 game_applications 확장) 필요 | More 제거. 게임 상세 "게스트 모집중" 배지 활성 시 CTA |
| `/tournaments/[id]/referee-request` | A — 완벽 | 기존 referee 시스템 위에 빌드 가능 | More 제거. 토너먼트 운영자 영역에 CTA |
| `/courts/submit` | A — 완벽 | `courts.submitted_by`+`submission_status` 또는 `court_submissions` 신규 | More 유지 가능 (간단한 폼). 또는 `/courts` 상단 "코트 제보" CTA |
| `/series/new` | A — 완벽 | `series` 테이블 + 운영자 권한 가드 필요 | 일반 사용자에게는 메뉴 노출 X. 운영자만 `/series` 허브에 노출 |
| `/onboarding/setup` | A — 완벽 | users 컬럼 일부 부족 | More "가입 설정" 유지하되 회원가입 직후 자동 redirect 도입 |
| `/match` | A — 완벽 (시안 박제) | DB 더미 데이터만 — 정책 결정 필요 | (a) admin/preview 영역으로 이동 (b) 폐기 — PM 결정 |

---

## 섹션 3 — 부분 구현 (DB 컬럼 일부만 누락)

기능은 부분 동작. DB 컬럼/테이블 한두 개만 추가하면 완전 활성. 메뉴는 보일 수 있되 숨겨진 메트릭만 빼기.

| 페이지 | 부분 구현 항목 | 추가 필요 컬럼 | 백로그 우선도 |
|--------|--------------|--------------|------------|
| `/games/[id]` | 종료 시각 `HH:mm ~ HH:mm` | `games.duration_hours` / `ended_at` | P2 |
| `/teams/[id]` | 팀 ELO 레이팅 | `teams.rating` | P2 |
| `/teams/[id]` | 팀 태그 | `teams.tag` (현재 이름 첫 3자 fallback) | P2 |
| `/courts/[id]` | 운영시간 / 시설 / 시간대별 혼잡도 | `courts.operating_hours` / `shower` / `locker` / `phone` / `court_visits` | P2 |
| `/tournaments/[id]/bracket` | 우승 예측 / 시드 ELO / LIVE 실시간 점수 | `tournament_predictions` / `teams.rating` / 실시간 인프라 | P3 |
| `/tournaments/[id]` | 우승 상금 | `tournaments.prize_money` | P3 |

---

## 섹션 4 — 구현 우선순위 (Phase 10+ 백로그)

DB 구현 후 메뉴 활성 복귀 순서. 사용자 임팩트 큰 것부터.

### Phase 10 후보 (큰 임팩트) — ✅ 2026-04-29 운영 DB SQL 적용 완료

> 사용자가 운영 DB에 직접 SQL 실행 → 4건 신규 테이블/컬럼 적용 완료. 이제 라우트 활성화(API 구현 + UI mutation 연결) 후속 작업만 남음.
> 통합 SQL 파일: commit `f9d2e45`

| # | 항목 | DB 적용 상태 | 활성화 잔여 작업 |
|---|------|------------|-----------------|
| 1 | **경기 평가/신고 시스템** — `game_reports` + `game_player_ratings` | ✅ Phase 10-1 | API 구현 + /games/[id]/report 진입점 CTA + mutation 연결 |
| 2 | **게스트 지원 흐름** — `guest_applications` | ✅ Phase 10-3 | API 구현 + /games/[id]/guest-apply 진입점 CTA + mutation 연결 |
| 3 | **팀 팔로우 + 매치 신청** — `team_follows` + `team_match_requests` | ✅ Phase 10-4 | API 구현 + 팀 hero CTA 활성화 |
| 4 | **온보딩 사용자 데이터** — `users.styles` / `areas` / `goals` 컬럼 | ✅ Phase 10-5 | OnboardingV2 mutation 연결 + verify 직후 자동 redirect |

### Phase 11+ 후보 (DB 미적용)

5. **북마크/저장** — `bookmarks` 테이블 + UI 활성화 (커뮤니티 게시글 스크랩 + 게임 저장 공통)
6. **DM/쪽지** — DM 모델 (현재 messages는 알림 메시지만)
7. **심판 배정 요청** — referee_requests 백엔드 완성
8. **코트 사진 업로더** — S3 파이프라인
9. **팀 ELO 레이팅** — `teams.rating` + 산정 로직
10. **실시간 라이브 스코어** — websocket + tournament_matches.current_quarter 확장
11. **프로필 시즌 통계 탭** — `season_stats` 또는 `user_season_stats` 집계 테이블 + cron 또는 마감 시점 일괄 집계 (A-2 ghost 처리, 2026-04-29)
12. **프로필 슛존 성공률 (heatmap)** — `match_player_stat.zone` 컬럼 + 좌표 집계 (A-2 ghost)
13. **프로필 스카우팅 리포트** — `scouting_reports` 테이블 + 작성/조회 API (A-2 ghost)
14. **프로필 VS 나** — `match_player_stat` 양방향 조인 + 비교 UI (A-2 ghost)
15. **커뮤니티 댓글 답글** — `comments.parent_id` DB는 있지만 createCommentAction + comment-list UI 미연결 (A-4 ghost, 2026-04-29). depth=1 1단계만 우선
16. **커뮤니티 댓글 좋아요** — `comment_likes` 테이블 + toggleCommentLikeAction 연결 (A-4 ghost). action 함수는 이미 community.ts:370 에 작성돼 있음 — UI 만 연결하면 활성화 가능 (Phase 11 첫 후보)
17. **/about 통계 4건 동적화** — 현재 `src/app/(web)/about/page.tsx` L48-51 가데이터 + L159 "예시" 라벨 명시. 추후 DB 집계로 교체 (2026-04-29 박제 텍스트 정리 작업 큐 추가):
    - 가입 멤버 수: `SELECT COUNT(*) FROM users` (또는 `is_active=true` 필터)
    - 등록 팀 수: `SELECT COUNT(*) FROM teams`
    - 개최 대회 수: `SELECT COUNT(*) FROM tournaments`
    - 운영 기간(20년): 정적 표시 + 매년 자동 갱신 (커뮤니티 시작년 2005 기준 동적 산출 가능)
    - 구현 시 about 페이지 server component fetch 추가 + L159 "예시" 캡션 제거

---

## 섹션 5 — 즉시 실행 작업 (Phase 9 종료 전 — 2-3h)

### 5-1. More 메뉴 정리 (`src/components/bdr-v2/more-groups.ts`) — ✅ 완료 (2026-04-29 `aa61003`)

- ✅ 4개 가짜링크 제거: `gameReport`, `guestApply`, `refereeRequest`, `referee`
- 5그룹 IA 유지하되 항목 줄어든 그룹은 다른 항목으로 채우거나 축약

### 5-2. 페이지 내부 카드 숨김 (작은 PR 다수)

- `/teams/[id]` hero 의 "팀 팔로우" / "쪽지 보내기" / "매치 신청" 3 버튼 → 코드 주석 처리
- `/games/[id]` 의 "한마디 메시지" / "저장/북마크" → 숨김
- `/profile` 의 슛존 / 스카우팅 / VS나 탭 → 숨김
- 위저드 단계에서 DB 미지원 필드 → 숨김 또는 옵션 라벨

### 5-3. scratchpad 추후 구현 목록 갱신

`.claude/scratchpad.md` 의 "추후 구현 목록" 섹션에 본 문서 섹션 1-3 내용 통합. 각 항목에 본 문서 link.

### 5-4. 본 문서 + audit + paste-completeness 통합 인덱스를 README 에 갱신

(이미 작업 — README 인덱스에 본 문서 추가됨)

---

## 부록 — DB/API 미지원 식별 방법

박제 작업 시 다음 패턴이 보이면 "시안 only 기능" 의심:

1. **`alert("준비 중")` / `alert("곧 제공됩니다")` 호출** — 명백한 placeholder
2. **`disabled` + `title="준비 중"` 버튼** — 명시적 미구현
3. **컴포넌트 props에 시안 더미 데이터 인라인** — DB에서 안 가져옴
4. **mutation 호출 없이 setSubmitted(true) 만 toggle** — 양식 제출 안 함
5. **`useState` 만 있고 서버 액션/API call 없음**
6. **시안 jsx 의 hardcoded `series = [...]`, `players = [...]` 등이 그대로 박제됨** — DB 미연결

이 패턴들이 페이지에 남아있으면 본 문서 섹션 1-3 후보. 점진적으로 식별 + 정리.

---

**문서 작성**: 2026-04-29 PM 정책 변경 반영
**다음 갱신**: Phase 10 백로그 진행 시 + DB 구현 후 메뉴 활성 복귀 시 항목별 체크
