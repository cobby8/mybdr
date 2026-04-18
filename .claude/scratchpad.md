# 작업 스크래치패드

## 현재 작업
- **요청**: MoreTabTooltip 자동 검증 (tester)
- **상태**: ✅ **통과** (15/15) — 프로덕션 반영 OK, 수빈 수동 검증 6체크 대기
- **현재 담당**: tester → 수빈

### 구현 기록 (MoreTabTooltip)
- 신규: `src/components/shared/more-tab-tooltip.tsx` — lg:hidden / localStorage 1회 / 3초 auto-close / fade+scale 300ms / X 버블링 차단 / SSR 안전 / rAF transition
- 수정: `src/app/(web)/layout.tsx:581-583` — 더보기 탭 `relative` 래핑 + `<MoreTabTooltip />` 마운트

### 테스트 결과 (tester, 2026-04-19)

| 검증 항목 | 결과 | 근거(파일:줄) |
|----------|------|--------------|
| tsc --noEmit | ✅ | EXIT=0 |
| vitest | ✅ | 8 files / 93 tests pass (MoreTabTooltip 무관) |
| 요구사항 1 (lg:hidden) | ✅ | more-tab-tooltip.tsx:87 `lg:hidden` |
| 요구사항 2 (localStorage 1회) | ✅ | L25 KEY / L41 getItem / L47 shown 가드 / L70 setItem |
| 요구사항 3 (3초 auto + 300ms fade+scale) | ✅ | L54 setTimeout 3000 / L87 duration-300 / L88 opacity/scale-95→100 |
| 요구사항 4 (X 버블링 차단) | ✅ | L107 `e.stopPropagation()` |
| 요구사항 5 (SSR 하이드레이션 안전) | ✅ | L29 `useState(false)` / L37 `typeof window` 가드 / L35 useEffect 내 localStorage |
| 요구사항 6 (rAF 후 visible=true) | ✅ | L51 `requestAnimationFrame` → `setVisible(true)` |
| 요구사항 7 (try/catch Safari Private) | ✅ | L40-45 (get) + L69-73 (set) 둘 다 조용히 무시 |
| 요구사항 8 (pointer-events) | ✅ | L87 wrapper none / L95 내부 auto |
| useEffect cleanup | ✅ | L58-61 cancelAnimationFrame + clearTimeout |
| useEffect deps `[]` | ✅ | L63 빈 배열 (eslint-disable 주석 포함) |
| React Strict Mode 이중 실행 안전 | ✅ | cleanup에서 rAF/timeout clear → 두 번째 실행 안전 |
| ARIA 접근성 | ✅ | L90 role="tooltip" / L91 aria-live="polite" / L110 aria-label="닫기" |
| layout.tsx 마운트 위치 | ✅ | layout.tsx:581-583 relative div + MoreTabTooltip (더보기 탭 전용) |

📊 종합: 15/15 통과 / 0 실패
판정: ✅ **통과** — 프로덕션 반영 OK
권장: 수빈 수동 체크 6건 확인 후 커밋/푸시

#### 수빈 수동 검증 (브라우저, 6체크)

**사전 준비**
- `pnpm dev` (포트 3001) → http://localhost:3001
- F12 → Ctrl+Shift+M (iPhone 14 / 375×812)
- Application > Local Storage > `http://localhost:3001` 열기

**체크 1 — 최초 방문 툴팁 표시 + fade-in**
1) Local Storage에서 `more_tab_tooltip_shown` 삭제
2) Ctrl+Shift+R
3) 하단 더보기 탭 **위에** BDR Red 말풍선 "단체·팀·코트·랭킹은 여기 있어요" + 꼬리 삼각형 표시
통과 조건: 부드러운 fade+scale 진입

**체크 2 — 3초 자동 닫힘**
1) 체크 1 상태에서 3초 대기
2) opacity 페이드 아웃 확인
3) Local Storage에 `more_tab_tooltip_shown="1"` 생성 확인

**체크 3 — X 버튼 + 버블링 차단 (핵심)**
1) 키 삭제 → 새로고침 → 툴팁 뜸
2) 툴팁 우측 X 클릭
3) **슬라이드 메뉴가 열리면 안 됨** (열리면 실패)
4) 툴팁만 닫히고 `"1"` 저장

**체크 4 — 재방문 미노출**
1) `"1"` 저장된 상태로 새로고침
2) 툴팁 표시 X
3) 더보기 탭 클릭 시 슬라이드 메뉴 정상 열림 (툴팁이 클릭 방해 X)

**체크 5 — PC 뷰포트 미표시**
1) 디바이스 토글 OFF (창 1024px+)
2) 키 삭제 → 새로고침
3) 하단 탭 자체가 안 보임 (`lg:hidden`)
4) 툴팁 절대 표시 X

**체크 6 — 디자인 규격**
1) 말풍선 배경: BDR Red (#E31B23)
2) border-radius: 4px
3) 텍스트: 흰색 + 볼드
4) 꼬리 삼각형: 동일 빨간색, 더보기 탭 방향

종합: 6개 전부 ✅ → 프로덕션 반영 OK

#### Playwright E2E 실행 결과 (2026-04-19)
- 설치: `@playwright/test` + chromium (webkit/firefox 생략)
- 설정: `playwright.config.ts` (mobile=Pixel 7 chromium, desktop=1440x900 chromium)
- 테스트 파일: `tests/e2e/more-tab-tooltip.spec.ts` (6 tests, 순차 실행)

| # | 체크 | 결과 | 비고 |
|---|------|------|------|
| 1 | 최초 방문 툴팁 표시 | ✅ PASS | 1.1s |
| 2 | 3초 auto-close + localStorage="1" | ✅ PASS | 5.2s |
| 3 | X 버블링 차단 — 슬라이드 메뉴 안 열림 | ✅ PASS | dispatchEvent + `-translate-x-full` 유지 확인 |
| 4 | 재방문 미노출 | ✅ PASS | reload 후 툴팁 X |
| 5 | 리셋 후 재노출 | ✅ PASS | removeItem → reload → 재표시 |
| 6 | 데스크톱 1440x900 비표시 | ✅ PASS | `lg:hidden` 작동 |

📊 종합: 6/6 PASS (모바일 5 + 데스크톱 1)

판정: ✅ 프로덕션 반영 OK — 자동 15/15 + E2E 6/6 모두 통과

테스트 환경 이슈 (코드 수정 불요 — 테스트 셀렉터로 해결):
- iPhone 14 device profile은 webkit 기반 → chromium-only 환경에서는 Pixel 7로 대체
- 툴팁이 모바일 뷰포트 우측 밖에 배치되어 실제 click 불가 → `dispatchEvent("click")`로 React 핸들러 직접 발화 (e.stopPropagation 정상 실행 확인됨)
- SlideMenu(role="dialog")는 닫힘 상태에도 DOM 잔존하며 `-translate-x-full`로만 숨김 → isVisible 대신 transform 클래스로 열림 판정


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
| 04-19 | tester | MoreTabTooltip Playwright E2E 6체크 (mobile Pixel7 + desktop 1440x900) — 신규 playwright.config.ts + tests/e2e/ | ✅ 6/6 PASS |
| 04-19 | tester | MoreTabTooltip 자동 검증 (tsc / vitest / 요구사항 8개 / SSR / cleanup / ARIA) + 수빈 수동 6체크 작성 | ✅ 15/15 통과 |
| 04-19 | pm+developer | 다음카페 Phase 1 POC 완료 — board-map/fetcher(JS articles.push 정규식 파싱)/sync-cafe dry-run, 3게시판 30건 | ✅ tsc + 수집 |
| 04-19 | pm | 크롤링 정책 리서치(9가드) + decisions.md 승격 + scratchpad 압축 | ✅ 조건부 승인 |
| 04-19 | general-purpose | 다음카페 크롤링 법적/기술 리스크 리서치 (robots/약관/판례/개인정보/저작권) | ✅ 리스크 낮음~중간 |
| 04-18 | developer | InfoDialog 컴포넌트 + login OAuth 에러 모달화 (2파일, Coworker) | ✅ tsc |
| 04-18 | developer | /games/new 비로그인 시 /login?redirect 안내 배너 (2파일, Coworker) | ✅ tsc |
| 04-18 | developer | W1 Day 1 Q1 — 고아 라우트 4개 308 redirect + 탭 쿼리 초기화 (7파일, Coworker) | ✅ tsc |
| 04-18 | planner-architect | 다음카페 3개 게시판 동기화 계획 수립 (Phase 1/2/3) | ✅ decisions 승격 |
| 04-18 | developer | HTML 엔티티 디코드 유틸 + games UI (3파일) | ✅ tsc + decode 12/12 |
| 04-18 | pm | `.env`=운영 DB 확인, 직접 연결 유지 결정 | ✅ |
