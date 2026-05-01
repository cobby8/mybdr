# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22 재정의)

> 일반 모드 / 카페 모드 분리 — 기존 룰 그대로

- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)

## 🚧 추후 구현 목록 (DB/API 확장 필요)

**미해결 ⏳**
- 슛존 성공률 (heatmap) / 스카우팅 리포트
- 프로필 시즌 통계 / VS 비교
- 커뮤니티 댓글 답글 / 좋아요 / 게시글 북마크
- waitlist / no-show / QR 티켓
- AppNav 쪽지 unread count 뱃지 (messages unread API 추가 시 prop 활성화)
- D-6 EditProfile §2 사용손/실력/강점 + §4 공개 7항목 → PATCH `/api/web/profile` 확장
- D-6 EditProfile §3 인스타·유튜브 (`instagram_url` / `youtube_url` 컬럼 추가 시 활성화)
- D-3 §02 Highlight (MatchPlayerStat 평점 시스템 연동) / §05 다음 주 추천 (추천 엔진 연동)
- ComingSoonBadge 공통 컴포넌트 격상 (다른 v3 페이지 재사용)
- Tournament.status 'published' 잔재 cleanup
- organizations 단체 생성 → 목록 노출 e2e 스모크 테스트 부재
- Q1 후속: `_components/` 11 파일 + `courts/[id]/page.tsx` 19건 옛 토큰 마이그
- Q1 후속: ContextReviews kind="series" /tournaments[id] + kind="player" /users[id] 도입
- Q1 후속: `/reviews?courtId=...` deep-link → onViewAll 활성화
- **대회 선수 가입 시 이름 기준 자동 매칭 hook 부재** — 현재 `matchPlayersByPhone` 만 가입 hook에서 자동 호출 추정. `linkPlayersToUsers` (이름 기준) 는 수동 호출만 → 명단 사전 등록 시 phone 없으면 추후 가입해도 자동 연결 X. 가입 hook 또는 cron 추가 필요

## 현재 작업

- **요청**: v3-rebake 결정 큐 순차 진행 (Q1 채택 → 다음 큐) (Auto mode)
- **상태**: Q1 박제 완료 (tester+reviewer 통과) → commit + push 진행
- **현재 담당**: PM
- **브랜치**: subin

### D-1~D-8 + Q1~Q4 진행 결과

| 단계 | 결과 |
|------|------|
| **D-1~D-8** 마이페이지 8/8 | ✅ 완료 (D-1/D-3/D-6 박제 + 5건 변경 0) |
| **ProfileShell 폐기 + cleanup** | ✅ push (6e81996 + 8d0f1f2) |
| **organizations status fix** | ✅ push (08898cb + 5e21130 — Cowork 다른 세션) |
| **Q1** Reviews + ContextReviews | ✅ Hybrid 박제 (옵션 A/B/C 채택) — commit 대기 |
| **Q2** VenueDetail | ✅ 변경 0 (운영 우위) |
| **Q3** GameEdit | ✅ 변경 0 (운영 우위) |
| **Q4** PostEdit | ✅ 변경 0 (운영 우위) |

### 추후 큐 (사용자 결정 받은 것 / 보류)

- **다음 큐**: Settings + BottomNavEditor (큰 구조 변경, 결정 4건 필요) / LiveResult (/games/[id] 흡수 검토) / HelpGlossary (옵션 C 보류 유지 가능)

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| Dev/design/ 단일 폴더 룰 | _archive/ + BDR-current/ + 보존 3 파일 | ✅ |
| 디자인 시안 박제 | 38% (40+/117) — D-1~D-8 + Q1~Q4 | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| Phase 12 (시즌 통계 + Portone) | schema/SQL/API/UI 4단계 | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 + Phase 19 쪽지 | ✅ |
| ProfileShell 폐기 + cleanup | /profile/* sidebar 0 + 컴포넌트 삭제 | ✅ |
| 마이페이지 영역 박제 | D-1~D-8 8/8 | ✅ |
| Reviews 통합 | 4탭 → 1탭 + ContextReviews 신규 (Q1) | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-05-01 | (DB only) | **피벗 팀 선수 13명 등록 + B 대회 16팀 디비전/결제 일괄 처리**: (1) 피벗 (TT id=245, Team id=225) 13명 INSERT, 자동 매칭 **8/13** (강동진/김명석/전인규/천호현/김수성/고상모/김도연/박성진 → userId 연결, 피벗 Team 활성 12명 풍부). (2) B 대회 categories 단일 디비전 ("일반부": ["D3"]) 확인 → 16팀 모두 division="D3" UPDATE → /tournaments/[id] page.tsx groupBy 카운트 0→16 (디비전별 현황 0/16 → 16/16). (3) 16팀 모두 payment_status="paid" + paid_at=now UPDATE (entry_fee 50만원 일괄). 사후 검증 통과 (groupBy division 16 / payment_status 16). | ✅ |
| 2026-05-01 | (DB only) | **크로스오버 팀 선수 18명 일괄 등록 + 자동 매칭 (예시 진행)**: B 대회 TournamentTeam id=242 (크로스오버 Team id=228) 에 18명 INSERT. 운영 패턴 정합 (`POST /api/web/tournaments/[id]/teams/[teamId]/players`): player_name + jerseyNumber + role="player" + is_active=true. 자동 매칭 = `linkPlayersToUsers` 인라인 (같은 Team 활성 TeamMember 중 nickname/name === player_name 정확 일치 + 1명만 매칭, 동명이인 안전). 결과: **18 등록 / 1 자동 매칭** (성윤호 → userId=3110). 크로스오버 Team 활성 멤버 3명뿐 → 17명은 미가입/팀 미등록 → userId=null 보존. | ✅ |
| 2026-05-01 | (DB only) | **동호회최강전 B 참가팀 16팀 일괄 등록**: 사진 추출 16팀 모두 기존 Team 매칭 (id=233/232/231/230/229/228/227/226/225/224/223/222/221/220/218/196). false positive 4건 정리 (BDR✗→DR BASKET / DYNAMIC✗→MI / DASAN·MSA✗→SA / merged✗→196). 트랜잭션 INSERT 16건 + teams_count 0→16 (maxTeams 풀 채움). | ✅ |
| 2026-05-01 | 5e21130 (push) | **docs(knowledge) organizations status fix 기록 (Cowork 다른 세션)**: errors.md +1 / lessons.md / index.md 갱신 | ✅ |
| 2026-05-01 | 08898cb (push) | **fix(organizations) status 'active' → 'approved' (Cowork 다른 세션)**: page.tsx 1줄 fix. DB 동호회최강전 중복 2건 정리. | ✅ |
| 2026-05-01 | 7883ed3 (push) | **D-3/8 ProfileWeeklyReport Hybrid 박제**: page.tsx 920→1125. v2.4 6섹션 + TOP 3 코트 보존. ComingSoonBadge 신설. | ✅ |
| 2026-05-01 | 8d0f1f2 (push) | **chore(cleanup) ProfileShell + ProfileSideNav 컴포넌트 삭제**: -280줄. | ✅ |
| 2026-05-01 | c3676ed (push) | **D-6/8 EditProfile Hybrid 박제**: page.tsx 1547→1233 + edit-profile.css 603. 5탭 → 단일 스크롤 + Hero + 5섹션. | ✅ |
| 2026-05-01 | 6e81996 (push) | **fix(profile) ProfileShell 제거**: layout.tsx → `<>{children}</>`. v2.3 hub sidebar 0 정합. | ✅ |
<!-- 05-01 일부 절단 (85944e3 D-1 + 22ce7f2 P0 hub + cef0a2b DEV 머지 절단 — 피벗+디비전+결제 신규 추가로 인한 정리) -->
