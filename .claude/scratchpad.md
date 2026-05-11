# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 1 — 강남구협회장배 유소년대회 데이터 모델 + 운영자 토큰 발급
- **상태**: ✅ 완료 (커밋 대기)
- **모드**: no-stop

## 진행 현황표
| 단계 | 상태 |
|------|------|
| §0 사전 점검 (git/env) | ✅ |
| §2 dev → subin 머지 | ✅ (fast-forward 55 commits) |
| §3-1 schema 추가 | ✅ developer (TournamentTeam +3 / TTP +11 / 신규 3모델) |
| §3-2 schema diff 검토 + push | ✅ 사용자 승인 + apply_token UNIQUE 우회 처리 (옵션 B) |
| §3-3 prisma generate | ✅ (dev 서버 3001 PID 86584 종료 후 재실행) |
| §3-4 seed 템플릿 | ✅ scripts/_temp/seed-gangnam-divisions.ts (사용자 룰 제공 시 INSERT) |
| §3-5 어드민 API | ✅ team-applications/route.ts + tournament-permission.ts |
| §3-6 어드민 UI | ✅ (admin)/admin/tournaments/[id]/teams page + client |
| §3-7 디자인 검수 | ✅ reviewer 차단 0 / Minor 3 (Phase 2 흡수) |
| §3-8 tester 검증 | ✅ tsc 0 / schema row 17+3 / BigInt 함정 회피 / vitest 275/277 (별건 2 fail) |
| §3-9 commit | 진행 중 |

## 구현 기록 (developer)
**신규 6**: apply-token.ts / tournament-permission.ts / team-applications/route.ts / (admin)/admin/tournaments/[id]/teams/page.tsx + teams-client.tsx / scripts/_temp/seed-gangnam-divisions.ts
**수정 1**: prisma/schema.prisma (+101 line — TournamentTeam +3 / TTP +11 / FK +2 / 인덱스 +2 / 신규 3 모델)
**주요 결정**: canManageTournament 헬퍼 추출 (match-stream 패턴) / captainId = tournament.organizerId 임시값 (is_public=false 가드) / origin = host 헤더 기반

## 테스트 결과 (tester)
- **tsc --noEmit**: ✅ 0 에러 (prisma generate 후 17건 자동 해결)
- **vitest**: ⚠️ 275/277 (실패 2건 = admin-roles.test.ts L145/L166 → admin 마이페이지 Phase 2 회귀, 본 작업 무관)
- **lint**: ⚠️ Next 16 next lint 제거 — 인프라 이슈 (별건)
- **BigInt 리터럴**: ✅ n suffix 0 / BigInt(session.sub) 3건 패턴 정합
- **schema row**: ✅ 17/17 + 3/3 운영 DB 반영 확인

## 리뷰 결과 (reviewer)
- **디자인 13 룰**: ✅ 0 위반 (E등급 admin 셸 / lucide-react 0 / 9999px 0 / 핑크 0 / hex 0)
- **보안**: ✅ getWebSession + canManageTournament 이중 가드 / IDOR 403 통일 / snake_case 자동 변환 정합
- **토큰 보안**: ✅ CSPRNG 256bit / DB UNIQUE / 만료 분리 / 만료 URL null
- **Minor 3 (Phase 2 흡수)**: (1) Team→TT→adminLog 비-트랜잭션 (2) tournament SELECT 2회 (3) resolveOrigin host spoofing 가드 부재

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|
| tester | src/lib/auth/admin-roles.ts L213-225 + admin-roles.test.ts L145/L166 | admin 마이페이지 Phase 2 mapper 4 필드 null 매핑 vs test toEqual 불일치 | 별건 — admin 마이페이지 작업에서 처리 |

## 구현 기록 (developer) — admin 마이페이지 Phase 3

📝 구현 범위: 알림 카드 + 건의사항 카드 + 비번 변경 진입점

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(admin)/admin/me/_components/notifications-card.tsx | 본인 알림 카드 (미확인 카운트 + 최근 5건 + 전체보기) — 약 190 LOC | 신규 |
| src/app/(admin)/admin/me/_components/suggestions-card.tsx | 본인 배정 건의사항 카드 (pending 카운트 + 최근 5건 + status 뱃지) — 약 230 LOC | 신규 |
| src/app/(admin)/admin/me/_components/user-info-card.tsx | 비번 변경 진입점 (Material Symbols `key` + Link) 추가 | 수정 (+33 LOC) |
| src/app/(admin)/admin/me/page.tsx | Phase 3 SELECT 4건 (notif count/list + sug count/list) + 카드 2개 배치 (Identity 뒤, RoleMatrix 앞) | 수정 (+70 LOC) |

### 비번 변경 path 결정
- **destination**: `/profile/settings?section=account`
- **사유**:
  - `/reset-password` 는 token 쿼리 필수 (forgot-password 이메일 링크 경로) — 직접 진입 불가
  - `/profile/settings?section=account` = 이메일·비밀번호·본인인증 통합 진입점 (account-section-v2.tsx L45 → `/reset-password` 라우팅)
  - settings 의 7섹션 nav 구조에서 URL 파라미터로 정확한 섹션 활성화 (resolveSection 헬퍼 박제)

### 검증
- **tsc --noEmit**: ✅ 0 에러
- **vitest**: ✅ 286/286 PASS (회귀 0)
- **lucide-react**: ✅ 0 import
- **BigInt n suffix**: ✅ 0 (Nn 패턴 없음 — page.tsx 의 모든 bigint → string 변환)
- **핑크/살몬/코랄 hardcode**: ✅ 0
- **9999px**: ✅ 0 (4px / 50% 만 사용)

### 데이터 정합성 (schema 컬럼명 박제)
- `notifications.user_id` (BigInt) — 본인 알림만 SELECT (IDOR 0)
- `notifications.status = "unread"` — 1764 line @default("unread") 박제
- `suggestions.assigned_to_id` (BigInt?) — 1967 line 박제 (assignedTo 가 아님)
- `suggestions.status = "pending"` — 1971 line @default("pending") 박제

### 디자인 룰 (13 룰)
- ✅ var(--*) 토큰만 (핑크 0 / 코랄 0)
- ✅ Material Symbols Outlined (notifications_active / feedback / key / task_alt / mail / event)
- ✅ 4px rounded (9999px 0)
- ✅ AppNav frozen — 영향 0

### 흐름 (사용자 경험)
1. 마이페이지 진입 → "알림 (3건 미확인)" 헤더로 시급 처리 인식
2. 미확인 알림 = BDR Red 아이콘 + 굵은 글자 강조 / 읽음 = 회색 보통
3. "전체 보기 →" 링크로 `/admin/notifications` 페이지로 진입
4. 비번 변경 = UserInfoCard 우측 상단 `key` 아이콘 클릭 → settings account 섹션

⚠️ reviewer 참고:
- 카드 배치 순서 = "지금 처리할 일(알림/건의)" → "참조 정보(권한/관리/활동)" 결정 (사용자 결재 박제)
- 알림/건의사항 데이터 = 모두 본인 데이터만 (IDOR 보장) — userId 키로 필터
- snake_case 응답 키 errors.md 2026-04-17 룰 = N/A (이번 작업 = server component prop 전달, API 응답 X)
- 잠재 향상: notifications.findMany + count → 2 쿼리 (Promise.all 병렬) — Phase 4 흡수 가능 (단일 쿼리로 통합 가능하나 schema/index 분석 필요)

💡 tester 참고:
- 테스트 방법: `/admin/me` 진입 → 7 카드 표시 + 알림/건의사항 카드 위치 + 비번 변경 링크 동작 (settings?section=account 진입)
- 정상 동작: 미확인 0 = "알림" (카운트 생략), 미확인 N+ = "알림 (N건 미확인)" — pendingCount 도 동일 룰
- 주의할 입력: 알림 0건 = "새 알림이 없습니다" / 건의사항 0건 = "처리 대기 건의사항이 없습니다" (graceful empty state)
- vitest 신규 회귀 가드 작성은 선택 — 본 구현 = server component prop 분기 위주라 컴포넌트 단위 테스트 ROI 낮음

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 3]** 알림 + 건의사항 + 비번 변경 진입점. 신규 2 컴포넌트 (notifications-card 190 / suggestions-card 230) + user-info-card 비번 변경 진입점 추가 + me/page Phase 3 SELECT 4건 (notif count/list + sug count/list). 비번 destination = `/profile/settings?section=account`. tsc 0 / vitest 286/286 / lucide-react 0 / BigInt n 0 / 핑크 0. 약 +523 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 2]** 관리 토너먼트 + 본인인증 + 최근 활동 + Phase 1 Minor 3건 fix. 신규 3 컴포넌트 (identity-status 163 / managed-tournaments 391 / recent-activity 179) + me/page 확장 + admin-roles 시그니처 발전 (status/startDate/endDate 추가) + admin-roles.test +135 (회귀 가드) + admin-me-phase2.test 50 (컴포넌트). developer stream timeout — PM 마무리 (tsc 0 / vitest 286/286 PASS / lucide-react 0 / BigInt n 0 / 핑크 0). 약 +1,025 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1 강남구협회장배 유소년 데이터 모델 + 운영자 토큰]** schema TournamentTeam +3 / TTP +11 / 신규 3모델 (ChildProfile / ClaimToken / TournamentDivisionRule) + admin 페이지 `/admin/tournaments/[id]/teams` (team 신청 + token URL 복사) + canManageTournament 헬퍼 + apply-token util (CSPRNG 256bit + DB UNIQUE) + seed 템플릿. 운영 DB push 사용자 승인 (옵션 B — @unique 우회 처리). tsc 0 / vitest 275/277 (별건 admin-roles 2) / reviewer 차단 0 + Minor 3 (Phase 2 흡수). | ✅ |
| 2026-05-11 | (조회만) | **펜타곤 김대진 명단 + 오늘 경기 등록 검증** — ttp.id=2562 active / matchId=123 ⑤예선 / venue=화성시 종합경기타운 (대회 단위 패턴 정상). | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 tester ✅]** tsc 0 / vitest 267/267. 권한 8/8 + BFF 5/5 + existingMatch 2/2. 차단 0 / Minor 3. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 종이 기록지 폼]** 14 파일 / +2,053. 권한 헬퍼 + score-sheet + 컴포넌트 5 + BFF zod + audit `web-score-sheet`. tsc 0 / vitest 267. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-1 sync route refactor]** match-sync service 추출 (494→204) + syncSingleMatch core. vitest 252/252. Flutter v1 envelope 100% 보존. | ✅ |
| 2026-05-11 | subin `05fa45b` | **[Phase 1-A recording_mode 게이팅]** settings JSON / 헬퍼 3종 + Flutter v1 3 라우트 가드 + admin 토글. vitest 231/231. | ✅ |
| 2026-05-11 | DB 작업 | **[열혈최강전 D-day 명단 검증]** 라이징이글스 13 + 펜타곤 11 / 박성후 TTP id=2848 INSERT. | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **[live] 결승 영상 swap-aware 백포트** — score-match swap-aware + cron v3 통합. vitest 217/217. | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **[live] 5/10 결승 영상 긴급 fix** — auto-register 1:1 가드 + 158 video_id NULL. | ✅ |
