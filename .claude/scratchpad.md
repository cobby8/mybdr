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

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
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
| 2026-05-10 | (PM 커밋 대기) | **[stats] 통산 3결함 fix** — mpg /60 + 승률 winner_team_id + FG%/3P% NBA. | ✅ |
