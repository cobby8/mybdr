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
- 슛존 성공률 (heatmap)
- 스카우팅 리포트
- waitlist (대기열)
- no-show 처리
- QR 티켓 발급/검증
- /teams 필터 기능 — v2 디자인으로 재구현 필요 (지역/정렬, 옛 FloatingFilterPanel 제거됨)
- 기타 박제 시안 중 데이터 패칭이 필요한 항목들

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
| 2026-04-29 | (미커밋) | 팀 관리 권한 체크 captain_id 직접 매칭 추가 (김병곤 사례 — team_members.role='director'로 등록되어 TEAM_MANAGER_ROLES 필터 차단) — 3 파일: (web)/teams/manage/page.tsx (기존 memberships 외 prisma.team.findMany({where:{captainId}}) 합산 + dedup), api/web/teams/[id]/route.ts (isCaptain 함수에 team.captainId === userId 1차 매칭 추가 + GET 가드/my_role/is_captain 보강 — 기존 select 의 captainId 재활용), api/web/teams/[id]/members/route.ts (GET/PATCH 가드 — isManager 누락 시 team.captainId 추가 1쿼리 후 통과). DB 변경 0, 디자인 변경 0. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | 팀 관리 페이지 settings 탭 누락 3필드 추가 (design_v2): home_color/away_color 컬러 picker(기존 primary/secondary 카드 안에 분리선 + 2열 grid), logo_url 신규 카드(즉시 업로드 /api/web/upload, 5MB+image/* 검증, 미리보기/교체/제거). 4 파일: manage/page.tsx (TeamEditData 3필드+useState 5개+handleLogoFile 핸들러+fetchTeamData 폴백 로직+handleSaveSettings body), api/web/teams/[id]/route.ts (GET select+응답 매핑+PATCH updateData 3건), validation/team.ts (updateTeamSchema home_color/away_color/logo_url 추가). schema home_color/away_color는 @map 없는 snake, logoUrl은 @map "logo_url" camelCase. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | [debugger] 김병곤 사용자 "카카오 OAuth 후 루나틱 팀 분리" 보고 진단 — dev DB 직접 조회(scripts/debug-kakao-link-2026-04-29.ts) 결과 user 1명만 존재(id=3007, provider=kakao, captain_id=3007 ↔ team id=215 정상 연결, team_member id=2348 active director). 일반 가입 user A 자체가 없어 "분리" 재현 불가. user 생성(4-28) ← 팀 생성(4-29) 순서. 코드 결함 X. errors.md에 진단 절차 표준화 항목 추가 | ✅ |
| 2026-04-29 | (미커밋) | 프로필+설정 nav/탭 v2 통일 (design_v2) — 3 파일 수정: profile-side-nav.tsx 모바일 chip(rounded+bg-primary+icon+font-bold uppercase) → v2 탭(텍스트만 + border-b-2 primary + font-medium/semibold) | settings-side-nav-v2.tsx PC 사이드바 유지(hidden lg:block) + 모바일(<lg) 가로 v2 탭 추가 | activity/page.tsx 3탭 chip(btn--sm+cafe-blue 활성+icon+count) → v2 탭(텍스트 + count 보존). billing/page.tsx 이미 v2 패턴 무수정. PC 좌측 사이드바 모두 유지. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | /teams 검색바 중복 + 필터 패널 깨짐 픽스 (design_v2) — page.tsx + teams-content-v2.tsx에서 옛 TeamsFilterComponent prop/import/사용 제거. v2 헤더 내장 검색박스(URL q 동기화)만 유지. teams-filter.tsx는 v1 롤백용 보존. 지역/정렬 필터는 추후 v2 재구현 (scratchpad 추후 구현 목록 추가). tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | [debugger] /teams/new prisma create 오류 진단: schema(home_color/away_color)+DB push+prisma generate 모두 정상, 직접 tsx 재현 시 성공 → dev 서버 PID 53552(15:38:34 시작)가 prisma client 재생성(20:35:08)보다 먼저 켜져 옛 client 메모리 캐싱이 원인. **코드 수정 0건**, dev 서버 재시작만으로 해결. errors.md 신규 항목 추가(워크플로우 함정 — schema 변경 후 dev 서버 재시작 필수) | ✅ |
| 2026-04-29 | (미커밋) | 헤더 우측 영역 우측 정렬(design_v2) — globals.css `.app-nav__right`에 `margin-left:auto` 추가(모바일 .app-nav__tabs:none 시에도 우측 끝 보장), gap 10→6px(데스크톱)/4px(모바일). app-nav.tsx 무수정. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | 헤더 컨트롤 3종 정리(design_v2): 다크모드 듀얼버튼→단일 해/달 아이콘 토글(theme-switch.tsx 재작성), 검색·알림 .btn--sm 박스 제거→.app-nav__icon-btn(아이콘만), 알림 빨간점 뱃지 .app-nav__notif-dot 클래스화. globals.css .app-nav__icon-btn 신규 + 모바일 .theme-switch 압축룰 제거(랭킹/요금제/캘린더는 .theme-switch 재사용 중이라 본 룰 유지). tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | 팀 로고 Supabase Storage 실제 업로드 연결: step-emblem(file 선택→/api/web/upload POST→public URL), team-form state(logoFile/logoPreview→logoUrl 단일화)+hidden logo_url, validation/team(logo_url 스키마+url 검증), actions/teams(logoUrl prisma 저장), step-review 라벨 "업로드 완료". 운영: Supabase 'team-logos' 버킷 사용자 생성 필요. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | PWA 아이콘 BDR 로고 교체 — sharp(기존)로 5종 정사각 생성 (180/192/512 + maskable 192/512), 배경 BDR Navy #1B3C87, 로고 중앙 70% (maskable 55% safe zone). scripts/generate-pwa-icons.mjs 신규. manifest.ts 변경 X (경로 매칭). 사용자 안내: 디바이스에서 SW 등록취소 + 앱 재설치 필요 | ✅ |
