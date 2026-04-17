# 작업 스크래치패드

## 현재 작업
- **요청**: (다음 작업 대기 중)
- **상태**: 대기
- **현재 담당**: pm

## 전체 프로젝트 현황 (2026-04-17 마감)
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin (origin/subin = e9d0879, 동기화 완료) |
| main / dev | 어제 main 기준 / dev에 PR #38 머지된 상태 |
| 진행 중 PR | **#39** (subin → dev, MERGEABLE, 8커밋, +1605 -18, 17파일) |
| 미푸시 커밋 | 0개 |

## 오늘 핵심 성과 (2026-04-17)
| 영역 | 결과 |
|------|------|
| **/games 데이터 정상화** | API snake_case 정합 + 다음카페 본문 정규식 파서 + 백필 147건 + 사진 5초 타임아웃 폴백 |
| **다음카페 파서** | `src/lib/parsers/cafe-game-parser.ts` 신규 + vitest 59/59 + 백필 dry-run/--execute/--reclassify-types 3모드 + 운영 DB 가드 |
| **game_type 자동 분류** | 본문 키워드 기반 PRACTICE/GUEST/PICKUP 추론, 66건 재분류 (PICKUP 38/GUEST 153/PRACTICE 66) |
| **참가팀 로고 이관** | 루트 PNG 8개 → `Dev/design/team-logos/`, .ai 원본 .gitignore |
| **열혈SEASON2 정리** (어제 후속) | 선수 백필 25건 / 팀 병합 2쌍 / 권한 부여 / Phase 3 공식 기록 가드 |

## 운영 팁 (유지)
- **gh 인증 풀림 시**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **API 응답 진단**: 코드 추정 금지, 반드시 `curl /api/...` 1회 (apiSuccess 미들웨어 놓침 4회 재발)
- **subin remote 재생성**: gh auto-delete 시 `git push -u origin subin`
- **일회성 DB 정리**: `scripts/`에 임시 스크립트 → dry-run → --execute → 완료 후 삭제. 데이터 보존(DELETE 금지) 원칙
- **카페 본문 파서**: `src/lib/parsers/cafe-game-parser.ts` (DB 의존 0, 다른 게시판도 응용 가능)
- **공식 기록 쿼리**: 반드시 `officialMatchWhere()` 유틸 사용 (Flutter 테스트 오염 방어)

## 남은 과제 (내일 이후)
- **운영 DB 동기화** — 개발 DB 작업(백필/병합/endDate/권한/카페 본문 파서 백필 147건+game_type 66건)을 운영 DB에 반영 (원영 협의)
- **원영 영역 공식 기록 가드 적용** — public-bracket API, _site/*.tsx
- **외부 스크래퍼 추적** — `metadata.cafe_source_id` 형식 "GU-CAFE-XXXXXX" 출처 시스템 위치 파악 (현 코드베이스에 없음)
- **대회 vs 경기 명확화** — 라벨 통일, 카드 시각 구분 (이전 메모)
- **고아 페이지 정리** — `tournaments/[id]/{bracket,schedule,standings}/`

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-17 | pm | knowledge 갱신 + 임시 스크립트 정리 + scratchpad 100줄 압축 | ✅ |
| 04-17 | pm | PR #39 제목·본문 갱신 (`/games` 데이터 정상화 + 파서 + 로고) + push 5커밋 | ✅ |
| 04-17 | pm | game_type 자동 분류 백필 — 66건 UPDATE (PRACTICE 41 → 66, GUEST 100 → 153) | ✅ |
| 04-17 | developer | game_type 추론 (`inferGameType`) + 백필 `--reclassify-types` + vitest 59 | ✅ |
| 04-17 | pm | A1 진단 오류 수정 — apiSuccess 미들웨어 놓침 → snake_case 원복 (16곳) | ✅ |
| 04-17 | pm | 개발DB 백필 147건 UPDATE (scheduled_at 93/venue_name 104/city 26/district 38/fee 85) | ✅ |
| 04-17 | developer | 다음카페 정규식 파서 + 백필 dry-run + A4 사진 5초 타임아웃 폴백 (병렬) | ✅ vitest 40 + tsc |
| 04-17 | pm | PR #39 생성 (subin → dev) — 참가팀 로고 PNG 8종 이관 + .gitignore + 메타 | ✅ |
| 04-17 | pm | 오늘 시작 점검 — dev fast-forward 머지(20커밋) + 참가팀 로고 PNG 8종 이관 | ✅ |
| 04-17 | pm | 토큰 절약 효율화 — 글로벌 CLAUDE.md + 프로젝트 CLAUDE.md 슬림화 + 스크립트 템플릿 | ✅ |
