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
| 2026-04-29 | (미커밋) | 헤더 컨트롤 3종 정리(design_v2): 다크모드 듀얼버튼→단일 해/달 아이콘 토글(theme-switch.tsx 재작성), 검색·알림 .btn--sm 박스 제거→.app-nav__icon-btn(아이콘만), 알림 빨간점 뱃지 .app-nav__notif-dot 클래스화. globals.css .app-nav__icon-btn 신규 + 모바일 .theme-switch 압축룰 제거(랭킹/요금제/캘린더는 .theme-switch 재사용 중이라 본 룰 유지). tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | 팀 로고 Supabase Storage 실제 업로드 연결: step-emblem(file 선택→/api/web/upload POST→public URL), team-form state(logoFile/logoPreview→logoUrl 단일화)+hidden logo_url, validation/team(logo_url 스키마+url 검증), actions/teams(logoUrl prisma 저장), step-review 라벨 "업로드 완료". 운영: Supabase 'team-logos' 버킷 사용자 생성 필요. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | PWA 아이콘 BDR 로고 교체 — sharp(기존)로 5종 정사각 생성 (180/192/512 + maskable 192/512), 배경 BDR Navy #1B3C87, 로고 중앙 70% (maskable 55% safe zone). scripts/generate-pwa-icons.mjs 신규. manifest.ts 변경 X (경로 매칭). 사용자 안내: 디바이스에서 SW 등록취소 + 앱 재설치 필요 | ✅ |
| 2026-04-29 | (미커밋) | 팀 생성 step-emblem: preset 10색 grid 제거 → HTML5 native color picker + hex text input (홈/어웨이 각 1조). TEAM_COLORS import 제거, 모바일 분기/미리보기/로고 영역 무수정. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | 팀 생성 폼: 단일 컬러→홈/어웨이 유니폼 2색 분리 + 로고 업로드 활성화. schema home_color/away_color 추가(logo_url 기존 재사용), dev DB push 완료, manual SQL 작성. step-emblem(2색 picker+로고 base64 미리보기), team-form/step-review/zod/server action 갱신. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | /teams/new Step 2~4 모바일 깨짐 일괄 픽스 — step-emblem(200px+1fr→1열 stack/sm:2열, 라벨 keep-all), step-review(140px+1fr→1열 stack/sm:2열), step-activity(요일 7개 flex-wrap), stepper(라벨 keep-all), team-form(헤더 keep-all). tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | /teams/new 모바일 깨짐 픽스 (Step 1) — team-form.tsx 본문 grid `minmax(0,1fr) 320px` 고정 → Tailwind `grid-cols-1 lg:grid-cols-[...]` + 메인 카드 `min-w-0` (모바일 366px 폼이 26px로 짜부라지는 버그) | ✅ |
| 2026-04-29 | (미커밋) | knowledge 5파일 갱신 — errors+2/lessons+3/decisions+4/architecture+1/index 갱신 (Phase 9-Mobile + Hero 카로셀 반영) | ✅ |
| 2026-04-29 | (미커밋) | DESIGN.md 갱신 — 720px BP + 모바일 체크리스트 링크 + Hero 카로셀 + AppNav 단일 헤더 | ✅ |
| 2026-04-29 | `0d12919` | 모바일 체크리스트 conventions.md (10항목) | ✅ |
