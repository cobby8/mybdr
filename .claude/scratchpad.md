# 작업 스크래치패드

## 현재 작업
- **요청**: 본 세션 정리 (16 commit 완료 / main 분리 머지 완료)
- **상태**: 종료
- **현재 담당**: pm

## 진행 현황표 (Admin 박제 — 다른 세션 진행 중)
| 단계 | 상태 |
|------|------|
| Admin-1~7 시안 박제 | ✅ 다른 세션 진행 — main 진입 완료 (Admin-7-B Sub-B1 까지) |
| Admin-8~9 잔여 토큰 매핑 + 자동 검증 | ⏳ 다른 세션 큐 |

## 후속 큐 (별도 세션)
- **AppNav utility 좌측 메뉴 (소개/요금제/도움말)**: 임시 숨김 (JSX 주석 보존). 후속 결정 = 페이지 콘텐츠 박제 후 복원 / 영구 제거 / footer·drawer 이전
- **AppNav SSR admin 메뉴 정합**: 첫 페인트부터 admin 진입 노출 — (web)/layout.tsx getAuthUser 에 admin_role / association SELECT 확장
- **PR-G5.5-followup-B**: 매치 PATCH route 통합 (status='completed' 시 division_rule=0 분기 → advanceTournamentPlaceholders)
- **PR-G5.5-NBA-seed**: 8강/4강 NBA 시드 표준 generator (교차 시드 + 2^N 올림 + bye)
- PR-G5.7 double_elim / PR-G5.8 swiss (운영 사용 0)
- PR-G5.2 dual-generator refactor
- recorder_admin Q1~Q6 결재 대기 (PR1~3 commit 완료)
- Phase 6 PR3 협회 마법사 referee 옵션 (PR2 완료 후 후속)
- Phase 19 PR-T1~T5 / PR-S10.4 / PR-S10.7 / PR-S10.8 / PR-Stat1~Stat5 결재 대기
- Phase 23 PR4 / PR6 / Phase A.7 의뢰서
- Phase 3.5 유청소년 결합 코드 후속
- PR-S9 / UI-1.4 entry_fee / GNBA 8팀 코치 안내
- Phase E 잔여 14 라우트 시안 박제 → CLI 박제

## 미푸시 commit (subin 브랜치)
- **0건** (HEAD == origin/subin)

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | **본 세션 16 commit main 분리 머지 완료** | ✅ PR #517 (subin → dev → main 통합) + **PR #519** (temp/session-merge-2026-05-15-live → main 본 세션 2건 분리) / 본 세션 작업 16건 모두 main 박제 / scratchpad 정리 완료 |
| 2026-05-15 | 라이브 페이지 정리 (toolbar + 홈 버튼) | ✅ commit `5f1e768` (toolbar — 예정 라벨 + 모바일 기록하기 버튼 삭제 / PC 버전 통합) + `599c64c` (헤더 홈 버튼 삭제) |
| 2026-05-15 | 조별 순위표 + bracket aside 종합 정리 (모든 대회) | ✅ commit `0512fb5` (풀리그+조편성 분기) + `ea43d41` (V2BracketHeader 숨김) + `4c7b9a5` (ADVANCED/무/승점 삭제 + 가로스크롤 제거 + 시드 순위 카드 삭제) + `e649c81` (조 탭 → 세로 배열) + `0144595` (팀 로고 logoUrl + 이니셜 fallback) |
| 2026-05-15 | wizard 일정 및 장소 legacy venue_name 표시 보강 | ✅ commit `baaf74f` — 4차 뉴비리그 places=null + venue_name 단독 박제 케이스 분기 추가 |
| 2026-05-15 | 프론트 헤더 utility 정리 (관리자 진입 + 좌측 메뉴 숨김) | ✅ commit `ed42f1c` (관리자 진입 메뉴) + `57d7029` (글자색 통일) + `d6cf751` (소개/요금제/도움말 임시 숨김 + 후속 큐) |
| 2026-05-15 | wizard 저장 status enum mismatch fix (운영 DB legacy 17종 허용) | ✅ commit `ddb1dfc` — Zod 5종 → 17종 확장 (tournament-status.ts 정합) + `b50f6aa` (errors.md 박제 48항목) |
| 2026-05-15 | 종별 참가비 입력란 UI 삭제 (registration-settings-form.tsx) | ✅ commit `c88ea99` — 데이터 layer 보존 / 호출처 영향 0 |
| 2026-05-15 | PR-G5.5-followup Tournament 단위 placeholder applier (4차 BDR 뉴비리그 5/16 운영) | ✅ commit `6d52a33` — 신규 함수 2 + vitest 5 + 운영 매치 232 UPDATE / tsc 0 / vitest 926/926 / 강남구 회귀 0 + `c78bbba` (scratchpad 1223→49줄 정리) |
| 2026-05-15 | PR-G5 대진표 generator placeholder 박제 자동화 (강남구 사고 영구 차단) | ✅ commit `eba655d` + `72b818b` — 6 format 보강 / 헬퍼 박제 / vitest 32 케이스 |
| 2026-05-15 | Phase 23 PR-RO1~RO4 종료 매치 read-only 차단 (5계층 방어) | ✅ commit `fab2697` |
