# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22 재정의)

> 일반 모드 / 카페 모드 분리 — 기존 룰 그대로

- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)
- 두 세션은 컨텍스트/지식/커밋이 섞이지 않도록 분리

## 🚧 추후 구현 목록 (DB/API 확장 필요)

> Phase 10 적용으로 일부 해결됨

**해결됨 ✅**
- 경기 평가/신고
- 게스트 지원
- 팀 팔로우
- 온보딩 데이터

**미해결 ⏳**
- 슛존 성공률 (heatmap) — A-2 ghost (phase-9-future-features.md #12)
- 스카우팅 리포트 — A-2 ghost (#13)
- 프로필 시즌 통계 탭 — A-2 ghost (#11), season_stats 집계 테이블 필요
- 프로필 VS 나 비교 — A-2 ghost (#14)
- 커뮤니티 댓글 답글 — A-4 ghost (#15), parent_id DB 있음 + UI/action 미연결
- 커뮤니티 댓글 좋아요 — A-4 ghost (#16), action 함수만 있고 UI 미연결
- 커뮤니티 게시글 북마크 — bookmarks 테이블 미구현 (#5)
- waitlist (대기열)
- no-show 처리
- QR 티켓 발급/검증
- 기타 박제 시안 중 데이터 패칭이 필요한 항목들

**해결됨 추가 ✅ (2026-04-29 P0-A)**
- /teams v2 지역/정렬 chip-bar 재구현 (A-1)
- /teams/[id] 부팀장·매니저 manage 진입점 — captainId 매칭 보강 (A-3)
- /notifications actionUrl 클릭 시 자동 read 처리 (A-5)

## 현재 작업

- **요청**: scratchpad.md 100줄 이내 정리 (5814줄 → 압축)
- **상태**: 진행 중 (doc-writer)
- **현재 담당**: doc-writer
- **백업**: `.claude/backup-2026-04-29/scratchpad-pre-cleanup-5814lines.md`

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| 디자인 시안 박제 (Phase 9) | 31% (32/117) | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| Hero 카로셀 | 3슬라이드 + fallback | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 | ✅ |
| 모바일 최적화 (P1~P5) | board separator + input 16px + btn 44px + card min-h | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-04-29 | (미커밋) | **P2-A 좀비 코드 정리 8건 삭제** (design_v2): import 0건 v1 컴포넌트 일괄 삭제 — teams-filter.tsx, games-filter.tsx, teams/_components/{teams-content,team-card}.tsx, courts/_components/courts-content.tsx, community/[id]/_components/{like-button,share-button}.tsx, games/_components/games-content.tsx. 각 파일 grep 검증 후 일괄 git rm. tsc 0건. 남은 코멘트의 "보존(롤백용)" 문구는 후속 정리 가능. floating-filter-panel은 tournaments-filter가 사용 중이라 보존(B-2 후 결정). 근거: ghost-features-and-breakage-2026-04-29.md §4 | ✅ |
| 2026-04-29 | (미커밋) | **E형 라우팅 누락 3건** (design_v2): E-1 my-games "후기 작성" alert→/games/{uuid8}/report Link (reg-row.tsx, isTour 가드+r.href!=="#" 체크+alert fallback) + report page.tsx 8자 단축 UUID→full UUID 변환 추가 (apply/route.ts:38-51 동일, hex 8자 정규식+$queryRaw LIKE+TC-042 인젝션 차단). E-2 /users/[id] "메시지 보내기" 검증: /messages는 ?thread=만 처리+?to=<userId> 미지원+DM DB 모델 부재→alert 유지+phase-9-future-features.md §1-B 큐 추가+action-buttons.tsx 코멘트 1줄. E-3 reg-row.tsx 헤더 주석 1줄(E형 결과: 결제하기·후기작성만 라우트 OK / 5건 D형). 3 파일+문서 1. tsc 0건. 근거: ghost-features-and-breakage-2026-04-29.md §5 D-1 | ✅ |
| 2026-04-29 | (미커밋) | **B-1+W-1+W-2 일괄 픽스 (design_v2)**: B-1 tournaments [id] 참가팀 탭 TeamCard(v1)→TeamCardV2 — v2→v1 변환 로직(BigInt 캐스팅·_count 매핑) 통째 삭제 후 v2 카드 인터페이스에 직접 매핑(W-3 TypeError 자동 해결), public-teams API select에 createdAt 추가 + ISO 직렬화(창단 연도 표시), 그리드 /teams 와 동일 (grid-cols-2 md:3 xl:4). W-1 community/new 툴바 flexWrap:nowrap+overflowX:auto → flex-wrap:wrap (모바일 13개 disabled 버튼 잘림 방지). W-2 floating-filter-panel backdrop z-50 → z-40 (slide-menu와 충돌 방지, panel은 z-50 유지). 3 파일 + 1 API. tsc 0건. 근거: ghost-features-and-breakage-2026-04-29.md §3,§6 | ✅ |
| 2026-04-29 | (미커밋) | **유령 기능 P0-A 5건 일괄** (design_v2): A-5 /notifications actionUrl 클릭 시 markAsRead PATCH + 헤더 벨 동기화 이벤트 (notifications-client.tsx onClick 추가, action_url 없는 경우도 div onClick 처리) / A-3 /teams/[id] page.tsx canManage 조건에 team.captainId === userId OR 매칭 추가 (김병곤 사례 보강 — 본조회 select 재활용, 추가 쿼리 0) / A-1 /teams v2 chip-bar 재구현: API teams/route.ts 에 sort 화이트리스트(wins/newest/members) + orderBy 분기 + createdAt 응답 직렬화 추가, teams-content-v2.tsx 에 지역(전국+cities) chip-bar 1줄 + 정렬(랭킹/최신/멤버) chip-bar 1줄 추가, URL ?city=&sort= 동기화, scrollbar-hide 가로 스크롤 / A-4 /community/[id] 댓글 수정·삭제는 이미 완료된 상태 확인 후, 답글/좋아요는 phase-9-future-features 큐로 이전 (comment-list.tsx 답글·좋아요 버튼 onClick alert + opacity .55) / A-2 /profile 시즌 통계는 season_stats 테이블 미구현이라 phase-9-future-features.md #11~14 + scratchpad 추후 구현 목록 갱신. 5 파일: api/web/teams/route.ts, (web)/teams/_components/teams-content-v2.tsx, (web)/teams/[id]/page.tsx, (web)/notifications/_components/notifications-client.tsx, (web)/community/[id]/_components/comment-list.tsx + 문서 2 (phase-9-future-features.md, scratchpad.md). tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | 팀 관리 권한 체크 captain_id 직접 매칭 추가 (김병곤 사례 — team_members.role='director'로 등록되어 TEAM_MANAGER_ROLES 필터 차단) — 3 파일: (web)/teams/manage/page.tsx (기존 memberships 외 prisma.team.findMany({where:{captainId}}) 합산 + dedup), api/web/teams/[id]/route.ts (isCaptain 함수에 team.captainId === userId 1차 매칭 추가 + GET 가드/my_role/is_captain 보강 — 기존 select 의 captainId 재활용), api/web/teams/[id]/members/route.ts (GET/PATCH 가드 — isManager 누락 시 team.captainId 추가 1쿼리 후 통과). DB 변경 0, 디자인 변경 0. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | 팀 관리 페이지 settings 탭 누락 3필드 추가 (design_v2): home_color/away_color 컬러 picker(기존 primary/secondary 카드 안에 분리선 + 2열 grid), logo_url 신규 카드(즉시 업로드 /api/web/upload, 5MB+image/* 검증, 미리보기/교체/제거). 4 파일: manage/page.tsx (TeamEditData 3필드+useState 5개+handleLogoFile 핸들러+fetchTeamData 폴백 로직+handleSaveSettings body), api/web/teams/[id]/route.ts (GET select+응답 매핑+PATCH updateData 3건), validation/team.ts (updateTeamSchema home_color/away_color/logo_url 추가). schema home_color/away_color는 @map 없는 snake, logoUrl은 @map "logo_url" camelCase. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | [debugger] 김병곤 사용자 "카카오 OAuth 후 루나틱 팀 분리" 보고 진단 — dev DB 직접 조회(scripts/debug-kakao-link-2026-04-29.ts) 결과 user 1명만 존재(id=3007, provider=kakao, captain_id=3007 ↔ team id=215 정상 연결, team_member id=2348 active director). 일반 가입 user A 자체가 없어 "분리" 재현 불가. user 생성(4-28) ← 팀 생성(4-29) 순서. 코드 결함 X. errors.md에 진단 절차 표준화 항목 추가 | ✅ |
| 2026-04-29 | (미커밋) | 프로필+설정 nav/탭 v2 통일 (design_v2) — 3 파일 수정: profile-side-nav.tsx 모바일 chip(rounded+bg-primary+icon+font-bold uppercase) → v2 탭(텍스트만 + border-b-2 primary + font-medium/semibold) | settings-side-nav-v2.tsx PC 사이드바 유지(hidden lg:block) + 모바일(<lg) 가로 v2 탭 추가 | activity/page.tsx 3탭 chip(btn--sm+cafe-blue 활성+icon+count) → v2 탭(텍스트 + count 보존). billing/page.tsx 이미 v2 패턴 무수정. PC 좌측 사이드바 모두 유지. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | /teams 검색바 중복 + 필터 패널 깨짐 픽스 (design_v2) — page.tsx + teams-content-v2.tsx에서 옛 TeamsFilterComponent prop/import/사용 제거. v2 헤더 내장 검색박스(URL q 동기화)만 유지. teams-filter.tsx는 v1 롤백용 보존. 지역/정렬 필터는 추후 v2 재구현 (scratchpad 추후 구현 목록 추가). tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | [debugger] /teams/new prisma create 오류 진단: schema(home_color/away_color)+DB push+prisma generate 모두 정상, 직접 tsx 재현 시 성공 → dev 서버 PID 53552(15:38:34 시작)가 prisma client 재생성(20:35:08)보다 먼저 켜져 옛 client 메모리 캐싱이 원인. **코드 수정 0건**, dev 서버 재시작만으로 해결. errors.md 신규 항목 추가(워크플로우 함정 — schema 변경 후 dev 서버 재시작 필수) | ✅ |
