# 작업 스크래치패드

## 현재 작업
- **요청**: 오늘 작업 시작 점검 + 이전 세션 Phase C 잔여물 마무리
- **상태**: ✅ Phase C 마무리 + scripts/_temp 정리 commit 대기
- **모드**: no-stop (사용자 명시 요청)

## 진행 현황표
| 단계 | 결과 |
|------|------|
| 점검 | git/branch/env 정상 / 미커밋 = Phase C 잔여물 |
| scripts/_temp 정리 | ✅ 제거 (CLAUDE.md §DB 정책 준수) |
| vitest match-score-recompute | ✅ 8/8 통과 |
| tsc --noEmit | ✅ 에러 0 |
| Phase C commit | 진행 중 |
| Phase 22 knowledge commit | 진행 중 |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-14 | Phase C — status="completed" score safety net (sync 누락 자동 보정) + Phase 22 knowledge 박제 + scripts/_temp 정리 | ✅ vitest 8/8 / tsc 0 / commit 분리 (Phase C + knowledge) |
| 2026-05-13 | FIBA Phase 21+22 — 종이 매치 박스스코어 6 컬럼 hide + LIVE API OT 표시 fix (paper PBP `clock=0` ↔ STL 보정 충돌) | ✅ tsc 0 / vitest 725/726 / commit `171de67` + `63c0633` / PR #474 dev + #475 main 머지 / 운영 배포 / 사용자 검증 완료 (OT1=3/2 / 박스스코어 13 컬럼) |
| 2026-05-13 | UI-3 wizard bracketSettings + UI-4 사이트 영역 제거 (-249 LOC) | ✅ commit `8478a24` |
| 2026-05-13 | UI-2 wizard 압축 (3-step → 1-step) + ?legacy=1 안전망 | ✅ commit `60dd37e` |
| 2026-05-13 | P2 dual 정합성 경고 + UI-1.5 ?step=2 anchor | ✅ commit `e8adc1a` |
| 2026-05-13 | P0 GameTime 역파싱 + P1 divFees 입력 UI 핫픽스 | ✅ commit `8a27f8a` |
| 2026-05-13 | FIBA Phase 20 PTS 자동 집계 | ✅ commit `5a53fb3` |
| 2026-05-13 | UI-1.1/1.2/1.3 wizard UX 보강 (textarea + 시리즈 인라인) | ✅ 묶음 commit |
| 2026-05-13 | 코치 자가수정 — 최초 1회 setup 흐름 4-분기 | ✅ commit `7689e3f` |
| 2026-05-12 | FIBA Phase 17.1 Team Fouls 박스 글자 색 충돌 fix | ✅ commit `07089a7` |
| 2026-05-12 | FIBA Phase 17 쿼터별 색상 + Legend | ✅ commit `2412b80` |

## 미푸시 commit (subin 브랜치)
**0건** — Phase 21+22 dev → main 머지 완료 (`f153cb5`).

## 후속 큐 (미진입)
- **Phase 23 후보** (별도 결재 필요): `score-sheet/[matchId]/page.tsx` 매치 재진입 시 자동 로드 미구현. 현재 라인업만 자동 fill / PBP·quarter_scores 복원 0 → 운영자 빈 폼에서 시작 → 잘못 박제 위험 (본 turn 매치 218 "그대로 진행" → 빈 폼 재제출 → q3 흡수 root). 필요: PBP → ScoreMark 역변환 헬퍼 + form 초기값 prop drilling. 큰 작업 별 PR.
- UI-1.4 entry_fee 사용자 보고 재현 (커뮤니케이션 — 코드 0)
- **GNBA 8팀 코치 안내**: 자가수정 진입 시 본인 이름/전화 입력 = 자동 setup. 시드 이름 mismatch 시 401 → 운영자 수동 보정 필요
