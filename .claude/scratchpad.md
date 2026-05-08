# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/9 마무리 — main 8회 머지 신기록]** PR #228~#243 16건 / 작업 8회차. PhoneInput 마이그 100% (13 input) + 시안 갭 fix 100% (10 페이지) + onboarding 검증 5/5 + 공개프로필 Phase 1+2 (NBA 8열 + 활동 로그 + 더보기 모달) + 내농구 강화 (super-set 10 영역). Production = `76bf5f3`. 미푸시 0 / 동기화 깨끗.

5/7~5/9 3일 누적 main 머지 = **36회** (5/7 21 + 5/8 7 + 5/9 8).

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **활성화 직후 자동 전환**: PR3 가드 활성 / mock 폴백 503 자동 / SDK 모드 전환 (코드 변경 0)
- **롤백 1초**: 환경변수 제거

### 🚀 1순위 — PortOne 활성화 후 검증
- 미인증 계정 → /games/[id] /teams/[id] /tournaments/[id]/join 진입 → /onboarding/identity?returnTo redirect
- mock 통과자 (identity_method='mock' 1건 — id=2999) 권유 안내 (강제 invalidate X)

### 🚀 2순위 — PlayerMatchCard 글로벌 재사용 확장
- /teams/[id] "최근 경기" 탭에 PlayerMatchCard 적용 (E-1 효과 확장)
- 다른 사용처 inventory 후 점진 적용

### 🚀 3순위 — Phase 3 (cron 활성화 시)
- Stats Per Season (UserSeasonStat cron) — 시즌별 평균 자동 집계
- Splits (홈/원정/승/패/월별)
- Shot Chart (ShotZoneStat cron)

### 🚀 4순위 — manage 탭 그룹화 (P2-6 보류) / game.game_type / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/9 라이브 YouTube)

🎯 목표: `/live/[id]` 라이브 페이지에 YouTube 영상 임베딩 (수동 URL + 자동 검색)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `prisma/schema.prisma` `TournamentMatch` | ADD COLUMN `youtube_video_id` + `youtube_status` + `youtube_verified_at` (NULL 허용 무중단) | 수정 |
| `src/lib/auth/match-stream.ts` | `canManageMatchStream(userId, matchId)` 권한 헬퍼 | 신규 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/youtube-stream/route.ts` | POST 등록/PATCH 갱신/DELETE 제거 (zod + IDOR 가드) | 신규 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/youtube-stream/search/route.ts` | GET BDR 채널 자동 검색 (Redis cache + 신뢰도 점수) | 신규 |
| `src/app/live/[id]/_v2/youtube-embed.tsx` | iframe 컴포넌트 (16:9 + 라이브/VOD 분기 + 모바일 4 분기점) | 신규 |
| `src/app/live/[id]/_v2/match-youtube-modal.tsx` | 운영자 모달 (수동 URL + 자동 검색 결과 N건) — `MatchJerseyOverrideModal` 패턴 재사용 | 신규 |
| `src/app/live/[id]/page.tsx` | hero 아래 임베드 영역 + 운영자 버튼 분기 | 수정 |

🔗 기존 코드 연결:
- `/api/web/youtube/recommend/route.ts` — `fetchEnrichedVideos()` / `fetchVideoDetails()` 재사용 (uploads playlist 150건 / Redis cache)
- `next.config.ts` CSP — 이미 `frame-src https://www.youtube.com https://www.youtube-nocookie.com` 등록 → 변경 0
- `tournament-auth.ts` — 권한 검증 (organizer / tournamentAdminMember / super_admin)
- `MatchJerseyOverrideModal` (5/5 PR4) — 운영자 모달 패턴 재사용

📋 실행 계획 (5 PR):
| 순서 | 작업 | 담당 | 선행 | 추정 |
|------|------|------|------|------|
| PR1 | DB schema ADD COLUMN + 권한 헬퍼 + Prisma generate | developer | 결재 (Q1~Q9) | 30분 |
| PR2 | 등록/제거 API + zod + IDOR 가드 | developer | PR1 | 1.5h |
| PR3 | 라이브 페이지 임베딩 (iframe + 모바일 가드) | developer | PR1 | 2h |
| PR4 | 운영자 모달 (수동 URL 입력) | developer | PR2+PR3 | 2h |
| PR5 | 자동 검색 API + 신뢰도 점수 + 모달 통합 | developer | PR4 | 3h |
| 검증 | tester (Flutter v1 회귀 + quota + iframe) + reviewer 병렬 | tester+reviewer | PR 별 | 30분 |

⚠️ developer 주의사항:
- **DB 단일 정책**: ADD COLUMN NULL 허용 → `prisma db push` 무중단. destructive 작업 0
- **Flutter v1 영향 0**: `/api/v1/...` schema query 비포함 컬럼만 추가
- **YouTube quota**: search API 미사용 (uploads playlist 재사용 + cache hit 99%)
- **video_id 검증**: 정규식 11자 + `/videos` API 실존 검증 (악의적 입력 차단)
- **iframe**: `youtube-nocookie.com` 우선 / `referrerPolicy="strict-origin-when-cross-origin"` / `autoplay=1&mute=1` (Chrome 정책)
- **시안 동기화**: PR3 후 BDR-current/screens/Live.jsx 영상 영역 후속 큐 등록 (운영 → 시안 역박제 룰)
- **권한**: super_admin / organizer / tournamentAdminMember.is_active=true 3종 (recorder 제외 — Q7 결재 따름)
- **5/10 D-day 후 진입** (Q9 권장): 본 D-day 기간 운영 영향 0

📄 보고서: `Dev/live-youtube-embed-2026-05-09.md` (15 섹션 / Q1~Q11 결재)

---

## 기획설계 (5/8~5/9 main 배포 완료 작업)

- **PR3 layout 가드 + mock 모드** ✅ main `f39afae` (5/8)
- **본인인증 mock 자체 입력 폴백** ✅ main `93670c5` (5/8)
- **사이트 전역 PhoneInput / BirthDateInput** ✅ main `118c9f1` 박제 + 5/9 마이그 100% (13 input)
- **운영 → 시안 역박제 갭 fix** ✅ main `71d4087` `afcbd65` (10 페이지)
- **공개프로필 NBA 스타일 Phase 1** ✅ main `7d68cce` (Dev/public-profile-nba-style-2026-05-09.md)
- **공개프로필 Phase 2** ✅ main `fff4c54` (Dev/public-profile-activity-stats-2026-05-09.md)
- **내농구 강화 super-set** ✅ main `76bf5f3` (Dev/profile-basketball-private-2026-05-09.md)

---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) / 듀얼토너먼트 풀 시스템 | ✅ |
| 디자인 시안 박제 | ✅ ~95% (시안 갭 0건) |
| 도메인 sub-agent (옵션 A) | ✅ P1+P2+P3 (C 채택) |
| 매치 코드 v4 | ✅ Phase 1+2+3+4+5+7 |
| **PR3 layout 가드 mock 모드** | ✅ main 배포 (PortOne env 추가 시 자동 활성) |
| **mock 자체 입력 폴백** | ✅ main 배포 (PortOne 활성화 시 자동 SDK 전환) |
| **사이트 전역 input 룰** | ✅ 13 input 100% 마이그 |
| **운영 → 시안 역박제 갭 fix** | ✅ 10 페이지 (시안 갭 0) |
| **공개프로필 NBA 스타일 Phase 1+2** | ✅ main 배포 (8열 + PlayerMatchCard + 활동 로그 + 더보기 모달) |
| **내농구 강화 super-set** | ✅ main 배포 (10 영역 / CareerStatsGrid 글로벌 / 14 쿼리 server) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-09 | (developer) 사전 라인업 PR1+PR2 / 미커밋 | **사전 라인업 PR1+PR2 — DB CREATE TABLE match_lineup_confirmed + API 3 + 권한 헬퍼** — schema.prisma 신규 모델 1 (UNIQUE(matchId,teamSide) + index 2) + User/TournamentMatch 역참조 / prisma db push 무중단 (CREATE TABLE 1 / 운영 영향 0) / match-lineup.ts 권한 헬퍼 200L (resolveLineupAuth + getLineupCanEdit / admin 양쪽 / captain·manager 본인측만) / lineup/route.ts 462L (GET 매치+양팀ttp+lineup+canEdit / POST upsert + Q6=A 5명강제 + 중복0 + ttp 무결성 / DELETE 해제) / tsc 0 / Flutter v1 영향 0 / PR3~PR8 후속 큐 | 검증대기 |
| 2026-05-09 | (developer) PR4+PR5 통합 / 미커밋 | **라이브 YouTube PR4+PR5 통합** — match-youtube-modal.tsx 신규 (727L, 탭 2개: 수동 URL 입력 + BDR 자동 검색 / 백드롭+ESC+iOS 16px input / 80점 임계 강조 + dim / 후보 0건 fallback / 삭제 confirm) + page.tsx 통합 (import + streamModalOpen state + 영상 미등록 운영자 등록 CTA + onManageClick 연결 + 모달 마운트 onSave→fetchMatch refetch) / tsc 0 / Tailwind arbitrary 0 (errors.md 룰 통과) / 시안 박제 후속 큐 / Flutter v1 영향 0 | 검증대기 |
| 2026-05-09 | (developer) PR1+PR2+PR3 통합 / 미커밋 | **라이브 YouTube PR1~3 통합** — DB ADD COLUMN 3 + match-stream.ts (164L) + enriched-videos.ts (355L) + POST/PATCH/DELETE 라우트 (288L) + GET search 신뢰도 80 (270L) + YouTubeEmbed (189L) + page.tsx 마운트 + game-result.tsx + /api/live/[id] 3 필드 / tsc 0 / quota 0~2 / Flutter v1 영향 0 | 검증대기 |
| 2026-05-09 | (구현) P0 6 파일 헬퍼 마이그 | **displayName P0 6 파일 헬퍼 마이그** — getDisplayName 통일 (games/[id] MVP / public-bracket recentMvp / jersey-override admin_log POST+DELETE / officer-permissions 응답 displayName 추가 / home.ts prefetchRecentMvp / build-linkify-entries) / 응답 키 변경 0 (officer-permissions 만 displayName 추가, 나머지 표시 문자열만 변경) / tsc 0 / Flutter v1 영향 0 / 라이브 YouTube PR2 youtube-stream API 계열은 현재 미존재 (PR1 결재 대기 중) — 충돌 0 | 검증대기 |
| 2026-05-09 | (기획) `Dev/live-youtube-embed-2026-05-09.md` | **라이브 페이지 YouTube 임베딩 기획** — 옵션 A 단일컬럼 (ADD COLUMN 3건 무중단) / 5 PR 분할 (~9h) / 신규 컴포넌트 2 + API 3 / 자동 검색 신뢰도 80 임계값 / search API 미사용 (uploads 재사용 quota 0~2) / CSP 변경 0 (이미 등록) / Flutter v1 영향 0 / Q1~Q11 결재 대기 / 5/10 D-day 후 진입 권장 | ✅ 결재 |
| 2026-05-09 | PR #228~#243 16건 → main 8회 (`702d00e` → `b96f58c` → `71d4087` → `afcbd65` → `d833569` → `7d68cce` → `fff4c54` → `76bf5f3`) | **5/9 단일 일 main 8회 신기록** — (1) PhoneInput 1순위 4 input. (2) 잔여 6 input + verify 하이픈 정규화. (3) 시안 역박제 1순위 News+MatchNews+Scoreboard. (4) 시안 역박제 2~3순위 7건 → 시안 갭 0 달성. (5) PhoneInput 4순위 admin+referee 3 input → 마이그 100% + onboarding 검증 tester 5/5 통과. (6) 공개프로필 NBA Phase 1 (PlayerMatchCard 380L + 8열 + Hero jersey + officialMatchNestedFilter). (7) Phase 2 활동 로그 5종 + 더보기 모달 3탭 + 경기참가 0 버그 fix. (8) 내농구 super-set 10 영역 (server 전환 + 14 쿼리 + CareerStatsGrid 글로벌 + MyPendingRequestsCard + NextTournamentMatchCard). tester 38건+ / reviewer ⭐⭐⭐⭐⭐ 4회. | ✅ |
| 2026-05-08 | PR #214~#227 14건 → main 7회 (`e0d880b` 빌드실패 → `c6a6848` `f39afae` `8846f6d` `13a962e` `93670c5` `118c9f1`) | **5/8 main 7회 신기록** — 디자인 박제 11 commit + truncated 빌드 9건 실패 → hot fix `333516b`. PR3 layout 가드 mock. BDR-current v2.5 + v2.5.1 (zip 2회). mock 자체 입력 폴백 (DB ADD COLUMN). PhoneInput/BirthDateInput 전역 컴포넌트. errors.md 5/7 truncated 재발 2회차 + 보완 4룰. | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main — Onboarding 10단계 + PortOne V2 + Phase A.5** | ✅ |
| 2026-05-06 | `7211f97` ~ `f6b43ab` → main `4253e68` | **5/6 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄** | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 재설계 5 Phase 16 PR main `8bbce95` / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계 → main `3f016c9` / 5/6 UI fix 13 + apiError / 5/7 envelope 8회 — 5/7 main 21회 baseline / 5/8 main 7회 / 5/9 main 8회 신기록) — 복원: git log -- .claude/scratchpad.md -->
