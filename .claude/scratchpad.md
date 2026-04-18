# 작업 스크래치패드

## 현재 작업
- **요청**: 다음카페 동기화 **Phase 1 POC** — 3개 게시판 목록 수집 dry-run
- **상태**: ✅ **완료** (3게시판 30건 수집) → Phase 2 진입 여부 수빈 문의 대기
- **현재 담당**: pm
- **참고**: W1 Q1(고아 라우트 308) — Coworker 완료 (작업 로그 참조)

### Phase 1 최종 검증 결과 (2026-04-19 02:54)
| 게시판 | 수집 | 상태 |
|--------|------|------|
| IVHA 픽업게임 | 10/10 | ✅ 완벽 |
| Dilr 게스트 모집 | 10/10 | ⚠️ 상위 4건 posted="-" (Phase 2에서 보정) |
| MptT 연습 경기 | 10/10 | ✅ 완벽 |
| **총계** | **30/30** | 한글 OK / 차단 X / 실응답 ~1초 |

### Phase 1 핵심 발견 (lessons.md 승격 권장)
- 다음카페 모바일 HTML은 **"빈 UL + JS 초기 데이터" 분리형** (cheerio 셀렉터 miss)
- 실제 데이터는 `<script>` 내 `var articles = []; articles.push({...})` 변수에 포함
- 정규식 파싱으로 직접 추출 → Playwright/XHR 역공학 불필요
- `tsx --env-file=.env.local` 플래그 필수 (Node 22 기능, npm script 추가 권장)

### 수빈 결정 (2026-04-19)
| 항목 | 답변 |
|------|------|
| Phase 1 POC 착수 | Y → ✅ 완료 |
| 로그인 쿠키 제공 | Y (.env.local 세팅 완료) |
| 수집 주기 | 30분 |
| 기존 외부 크롤러 | 자연 소멸 |
| 에러 알림 채널 | Phase 3에서 결정 |

## 전체 프로젝트 현황
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin |
| 진행 중 PR | #39 (subin → dev) |
| 미푸시 커밋 | **3개** (Coworker 2 + Phase 1 1) |

## 남은 과제
- **다음카페 Phase 2** — 본문 fetch(HTTP+Playwright) + upsert + 개인정보 마스킹 (decisions.md 2026-04-19)
- **운영 DB 동기화** — 백필/병합/endDate/권한/파서 147건+66건을 운영 반영 (원영 협의)
- **원영 영역 공식 기록 가드** — public-bracket API, _site/*.tsx
- **대회 vs 경기 명확화** — 라벨 통일

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **API 진단**: 코드 추정 금지, `curl /api/...` 1회 (apiSuccess 미들웨어 놓침 4회 재발)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22 기능)
- **일회성 DB 스크립트**: `scripts/_templates/` 기반, dry-run → --execute → 완료 후 삭제, DELETE 0 원칙
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | pm+developer | 다음카페 Phase 1 POC 완료 — board-map/fetcher(JS articles.push 정규식 파싱)/sync-cafe dry-run, 3게시판 30건 | ✅ tsc + 수집 |
| 04-19 | pm | 크롤링 정책 리서치(9가드) + decisions.md 승격 + scratchpad 압축 | ✅ 조건부 승인 |
| 04-19 | general-purpose | 다음카페 크롤링 법적/기술 리스크 리서치 (robots/약관/판례/개인정보/저작권) | ✅ 리스크 낮음~중간 |
| 04-18 | developer | InfoDialog 컴포넌트 + login OAuth 에러 모달화 (2파일, Coworker) | ✅ tsc |
| 04-18 | developer | /games/new 비로그인 시 /login?redirect 안내 배너 (2파일, Coworker) | ✅ tsc |
| 04-18 | developer | W1 Day 1 Q1 — 고아 라우트 4개 308 redirect + 탭 쿼리 초기화 (7파일, Coworker) | ✅ tsc |
| 04-18 | planner-architect | 다음카페 3개 게시판 동기화 계획 수립 (Phase 1/2/3) | ✅ decisions 승격 |
| 04-18 | developer | HTML 엔티티 디코드 유틸 + games UI (3파일) | ✅ tsc + decode 12/12 |
| 04-18 | pm | `.env`=운영 DB 확인, 직접 연결 유지 결정 | ✅ |
| 04-18 | pm | 오늘 시작 점검 + dev → subin 머지 (7커밋) + push 8커밋 | ✅ |
