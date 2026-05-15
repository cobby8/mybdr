# 작업 스크래치패드

## 현재 작업
- **요청**: PR-G5.5-followup 완료 + 매치 232 운영 UPDATE 완료. 다음 작업 대기.
- **상태**: 대기
- **현재 담당**: pm

## 진행 현황표 (Admin 박제 — 다른 세션)
| 단계 | 상태 |
|------|------|
| Admin-1 components/admin (신규 5 + admin.css) | ✅ commit `05caa04` (push 대기) |
| Admin-2 /admin/layout + Dashboard | ⏳ 결재 대기 (갱신 5 동반) |
| Admin-3~9 | ⏳ 순차 결재 대기 |

## 후속 큐 (별도 세션 / 본 의뢰 후)
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
- **2건**:
  - `fe238ca` fix(site) 서브도메인 사이트 404 — proxy.ts 헤더 위치 (다른 세션)
  - `6d52a33` feat(bracket-generator) PR-G5.5-followup — Tournament 단위 placeholder applier (본 세션)

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | PR-G5.5-followup Tournament 단위 placeholder applier (4차 BDR 뉴비리그 5/16 운영) | ✅ commit `6d52a33` — 신규 함수 2 (`advanceTournamentPlaceholders` + `getTournamentStandings` / 옵션 A 분리) + vitest 5 (정상/idempotent/notes 위반/절반 NULL/standings 단독) + 운영 매치 232 UPDATE 1건 완료 (notes "A조 1위 vs B조 1위" + settings.homeSlotLabel/awaySlotLabel) / tsc 0 / vitest 926/926 / 강남구 4 종별 회귀 0 / placeholder-helpers 통과 100% / DB schema 변경 0 / Flutter v1 영향 0 / 8중 안전 가드 통과 |
| 2026-05-15 | PR-Live1~Live4 라이브 기록 진입점 + 태블릿 세로 풀스크린 (Q1~Q7) | ✅ 신규 3 + 수정 2 / ~300 LOC / score-sheet-access endpoint 5 권한 분기 + 라이브 toolbar "기록하기" Link + body overflow lock + FullscreenToggle / commit 결재 대기 |
| 2026-05-15 | Phase 7 A PR2+PR3 E2E 시나리오 2 (회차 복제) + 시나리오 3 (1회성 대회) | ✅ commit `8eb37ab` — 신규 2 + 수정 1 / ~418 LOC / fixtures 시드 헬퍼 2 확장 |
| 2026-05-15 | Phase 23 PR-EDIT1~EDIT4 종료 매치 수정 모드 별도 기능 (Q3~Q8) | ✅ commit `223f7f0` — 수정 4 / +~370 LOC / canEdit + isEditMode + audit "completed_edit_resubmit" |
| 2026-05-15 | Admin-1 components/admin BDR v2.14 시안 박제 (신규 5 + admin.css 인프라) | ✅ commit `05caa04` (push 대기) / Admin-2 결재 대기 |
| 2026-05-15 | PR4-FIX recorder_admin UI 결함 3건 (사이드바/Super Admin/빠른 메뉴) | ✅ commit `b67c55d` — DB ground truth 폴백 (JWT stale 함정 영구 차단) |
| 2026-05-15 | Phase 23 PR-RO1~RO4 종료 매치 read-only 차단 (5계층 방어) | ✅ commit `fab2697` |
| 2026-05-15 | Phase 6 PR3 협회 마법사 Step 4 Referee 사전 등록 (옵션) | ✅ commit `12daf56` — Q7 1차 미검증 박제 |
| 2026-05-15 | Phase 6 PR2 협회 마법사 본체 (Step 1~3 + WizardShell + sessionStorage) | ✅ commit `79e72de` |
| 2026-05-15 | PR-G5 대진표 generator placeholder 박제 자동화 (강남구 사고 영구 차단) | ✅ commit `eba655d` + `72b818b` — 6 format 보강 / 헬퍼 박제 |
