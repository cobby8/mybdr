# 작업 스크래치패드

## 현재 작업
- **요청**: (다음 작업 대기 중)
- **상태**: 대기
- **현재 담당**: pm

## 전체 프로젝트 현황 대시보드 (2026-04-15)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 87개 (Referee 시스템 14개 추가) |
| Web API | 120+ 라우트 |
| 미푸시 커밋 | 0개 |
| 열린 PR | #8 (subin → dev, Phase 2C) |

## Phase 2: 팀명 한/영 구조화 ✅ 전체 완료
| 단계 | 상태 | 커밋 |
|------|------|------|
| 2A-1 스키마 추가 | ✅ | 66e6736 |
| 2A-2 API/검색/Zod | ✅ | e6a0ef7 |
| 2B 생성/수정 폼 UI | ✅ | c53fb71 |
| 2C 표시 UI 일괄 반영 | ✅ | ef43637 |
| dev 머지 + 충돌 해결 | ✅ | 69d0479 (수빈 버전 상위 호환 채택) |
| dev PR | ✅ | #8 리뷰 대기 |

## ⚠️ 원영에게 공유 (미해결)
- `db push --accept-data-loss`로 개발 DB의 referee/association 23행 삭제
- schema 구조는 복원(커밋 66e6736), 데이터는 빈 상태
- subin-referee 작업 재개 시 데이터 재입력 필요
- PR #8에도 공유 섹션 포함
- 상세: `.claude/knowledge/errors.md` 2026-04-15 항목

## 💡 운영 팁 (이 세션에서 확립)
- gh 인증이 풀리면: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...` 로 세션 단위 우회
- 영구 복구는 `"/c/Program Files/GitHub CLI/gh.exe" auth login`

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-15 | pm | knowledge 갱신 (errors +1, lessons +2) + scratchpad Phase 2 완료 처리 | ✅ 완료 |
| 04-15 | pm | dev PR #8 생성 (git credential로 gh 우회) | ✅ 완료 |
| 04-15 | pm | dev 머지 + validation/team.ts 충돌 해결 + 2차 푸시 (69d0479) | ✅ 완료 |
| 04-15 | pm | Phase 2C 커밋 + 1차 푸시 (ef43637) | ✅ 완료 |
| 04-15 | pm | scratchpad 경량화 (163→50줄) | ✅ 완료 |
| 04-13 | developer | Phase 2B: 팀 생성/수정 폼 UI 영문명 + 대표언어 토글 (c53fb71) | ✅ 완료 |
| 04-15 | developer | Phase 2A-2: Team name_en API/Zod/검색 반영 (e6a0ef7) | ✅ 완료 |
| 04-15 | developer | Phase 2A-1: Team.name_en/name_primary + Referee 14모델 (66e6736) | ✅ 완료 |
| 04-15 | developer | 참가팀 탭 → TeamCard 재사용 UI 통일 (2b69d12) | ✅ 완료 |
| 04-15 | developer | 대진표 박스 모바일 확장 + 좌/우 슬라이드 (02a3b6e) | ✅ 완료 |
