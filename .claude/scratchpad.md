# 작업 스크래치패드

## 현재 작업
- **요청**: 카페 크롤링 텍스트의 HTML 엔티티(&amp; &#39; &nbsp; 등) 디코드 — 목록/상세 UI 렌더링 시점에만
- **상태**: 구현 완료 → tester 대기
- **현재 담당**: developer → tester

### 구현 기록

📝 구현한 기능: `/games` 목록·상세 페이지에서 다음카페 크롤링 텍스트의 HTML 엔티티를 렌더링 시점에 디코드. DB 원본은 보존하고 표시만 변환.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/utils/decode-html.ts | `decodeHtmlEntities` 유틸 신규 — 명명 엔티티(amp/lt/gt/quot/apos/nbsp) + 숫자/16진수 참조(&#123; &#x7B;) 지원, null/undefined/빈 문자열 통과, 외부 의존 0 | 신규 |
| src/app/(web)/games/_components/games-content.tsx | GameCard 3곳 — 제목(h3), 장소(location 변수), 작성자 닉네임(author_nickname) 디코드 적용 | 수정 |
| src/app/(web)/games/[id]/page.tsx | `generateMetadata`의 title/description/OG/Twitter 전부 디코드 + 본문 브레드크럼·h1 제목·작성자 아바타/이름·설명 디코드 | 수정 |

✅ 검증 결과:
- `npx tsc --noEmit`: 에러 0건 통과
- decode 케이스 12/12 PASS:
  - `팀&amp;스포츠` → `팀&스포츠`
  - `It&#39;s ok` → `It's ok`
  - `&quot;점프&quot;` → `"점프"`
  - `A&nbsp;B` → `A\u00A0B`
  - `&lt;팀&gt;` → `<팀>`
  - `&#x27;hex&#x27;` → `'hex'` (16진수 참조)
  - 혼합/알수없는 엔티티/null/undefined/빈 문자열/일반텍스트 모두 통과

💡 tester 참고:
- 테스트 방법: `/games` 목록에서 카페 원문에 엔티티가 섞인 경기 카드 확인 → 제목/장소/작성자 3곳에 `&amp;` 등이 안 보여야 정상. 상세 페이지(`/games/<id>`)도 동일 + 브라우저 탭 title 확인.
- 정상 동작: "팀&amp;스포츠" → "팀&스포츠" / "It&#39;s ok" → "It's ok" / 엔티티 없는 텍스트는 변화 없음
- 주의할 입력: DB에 엔티티가 섞여 있어야 효과가 보임. metadata.cafe_* 출처 경기 위주로 확인.

⚠️ reviewer 참고:
- `decodeHtmlEntities`는 순수 함수 + 외부 의존 0 (he/entities 라이브러리 대신 정규식 기반)
- 알 수 없는 엔티티(`&foo;`)는 **원문 유지** 정책 — 안전한 폴백
- DB 값은 건드리지 않음. 렌더링 시점에만 변환 → 중복 디코드/인코딩 위험 없음
- SEO 메타데이터(generateMetadata)도 디코드 적용 — SNS/검색엔진 노출 텍스트 일관성

## 전체 프로젝트 현황 (2026-04-18 시작)
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin (origin/subin = b39561b, 동기화 완료) |
| main / dev | dev 머지 직전 (subin이 dev보다 9커밋 앞섬, PR #39 진행 중) |
| 진행 중 PR | **#39** (subin → dev) — dev 머지 반영 후 재확인 필요 |
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
| 04-18 | developer | HTML 엔티티 디코드 유틸 신규 + games 목록·상세 UI 적용 (3파일) | ✅ tsc + decode 12/12 |
| 04-18 | pm | 운영/로컬 API id 비교로 `.env`가 운영 DB 확인 → 수빈 "운영 DB 직접 연결 유지" 결정 → lessons+decisions 기록 | ✅ |
| 04-18 | pm | 오늘 시작 점검 + dev → subin 머지 (live 7커밋) + tsc 통과 + push 8커밋 | ✅ |
| 04-17 | pm | knowledge 갱신 + 임시 스크립트 정리 + scratchpad 100줄 압축 | ✅ |
| 04-17 | pm | PR #39 제목·본문 갱신 (`/games` 데이터 정상화 + 파서 + 로고) + push 5커밋 | ✅ |
| 04-17 | pm | game_type 자동 분류 백필 — 66건 UPDATE (PRACTICE 41 → 66, GUEST 100 → 153) | ✅ |
| 04-17 | developer | game_type 추론 (`inferGameType`) + 백필 `--reclassify-types` + vitest 59 | ✅ |
| 04-17 | pm | A1 진단 오류 수정 — apiSuccess 미들웨어 놓침 → snake_case 원복 (16곳) | ✅ |
| 04-17 | pm | 개발DB 백필 147건 UPDATE (scheduled_at 93/venue_name 104/city 26/district 38/fee 85) | ✅ |
| 04-17 | developer | 다음카페 정규식 파서 + 백필 dry-run + A4 사진 5초 타임아웃 폴백 (병렬) | ✅ vitest 40 + tsc |
| 04-17 | pm | PR #39 생성 (subin → dev) — 참가팀 로고 PNG 8종 이관 + .gitignore + 메타 | ✅ |
