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
| 2026-04-29 | (미커밋) | /teams/new 모바일 깨짐 픽스 — team-form.tsx 본문 grid `minmax(0,1fr) 320px` 고정 → Tailwind `grid-cols-1 lg:grid-cols-[...]` + 메인 카드 `min-w-0` (모바일 366px 폼이 26px로 짜부라지는 버그) | ✅ |
| 2026-04-29 | (미커밋) | knowledge 5파일 갱신 — errors+2/lessons+3/decisions+4/architecture+1/index 갱신 (Phase 9-Mobile + Hero 카로셀 반영) | ✅ |
| 2026-04-29 | (미커밋) | DESIGN.md 갱신 — 720px BP + 모바일 체크리스트 링크 + Hero 카로셀 + AppNav 단일 헤더 | ✅ |
| 2026-04-29 | `0d12919` | 모바일 체크리스트 conventions.md (10항목) | ✅ |
| 2026-04-29 | `dc1e38a` | Phase 9-Mobile Refinement P1~P5 | ✅ |
| 2026-04-29 | `87c59d4` | 팀 Avatar overflow + 카드 세로 배치 | ✅ |
| 2026-04-29 | `61a170d` | 팀 목록/상세 모바일 + 레이팅 제거 | ✅ |
| 2026-04-29 | `aa61003` | 헤더 구조 정리 + 더보기 4건 제거 | ✅ |
| 2026-04-29 | `f972aaf` | 모바일 가로 overflow 글로벌 가드 | ✅ |
| 2026-04-29 | `79cc57e` | Hero 카로셀 (3슬라이드 + fallback) | ✅ |
