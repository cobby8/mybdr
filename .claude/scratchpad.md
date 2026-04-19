# 작업 스크래치패드

## 현재 작업
- **요청**: W3 옵션 C — M3 코트 지도 뷰 폴리시 + M5 온보딩 압축 (병렬)
- **상태**: 🔄 M3 developer 구현 중 ∥ M5 planner-architect 분석 중
- **현재 담당**: developer (M3) + planner-architect (M5)
- **결정**: viewMode=map 유지 / 빈 상태=필터초기화 버튼 / 통합 1커밋
- **PR**: #46 OPEN에 누적 (M6 5e56d0f 푸시 완료)
- **참고 문서**: `Dev/ux-implementation-plan-2026-04-19.md` L531~565 (Day 11~12)

## 진행 현황표
| 영역 | 상태 |
|------|------|
| 브랜치 | subin (origin/subin = 동기화) |
| 미푸시 커밋 | M6 커밋 1건 예정 |
| dev 미반영 | 5건 (PR #46) + M6 1건 |
| PR #46 | 🟢 OPEN · MERGEABLE · CLEAN · Vercel SUCCESS |
| dev → main | 2건 미반영 (원영) |
| 작업 트리 (다른 터미널) | M cafe-sync 4건 + ?? extract-fallbacks.ts (건드리지 않음) |

## 남은 과제 (대기열)
- **W3 M3 코트 지도** — 카카오맵 SDK + 클러스터링 + 토글, ~10h
- **W3 M5 온보딩 압축** — signup→verify→홈 직진, ~5h
- **W4 M4/M7/L1** — 5/10~5/16 분량
- **다음카페 Phase 2b/3** — 다른 터미널 진행 중
- **운영 DB 동기화** — 원영 협의
- **referee 알림 사일런트 버그** — `notification-bell.tsx` L86 `json?.data` (errors.md 6회차)

## 기획설계 (planner-architect)

### W3 M3 — 코트 목록 지도 뷰 분석 결과 (2026-04-19)

🎯 **결론: 80% 이미 구현됨. 신규 ≪10시간≫이 아니라 ≪2~3시간 폴리시 작업≫**

#### 현재 구조 요약
| 영역 | 현황 |
|------|------|
| `/courts/page.tsx` | 서버 컴포넌트 + ISR 5분 + unstable_cache. court_infos.findMany로 lat/lng 포함 전체 select |
| `courts/layout.tsx` | use client. 카카오맵 SDK script 동적 삽입 (libraries=services,clusterer&autoload=false). **appkey 하드코딩** |
| `_components/courts-content.tsx` | 1173줄. 이미 지도+목록 분할 + 모바일 토글(map/list) + 필터 + watchPosition + 히트맵 + 근접 슬라이드업 + MiniCourtCard + CourtListCard 모두 구현 |
| `components/shared/kakao-map.tsx` | 376줄. MarkerClusterer, CustomOverlay, 인포 윈도우, 현위치 버튼, getMarkerColor (혼잡도 색상) 모두 구현 |
| `prisma court_infos` | latitude/longitude Decimal(10,7) **NOT NULL**. @@index 존재. 운영 데이터에 lat/lng 채워져 있음 |
| 기존 필터 | 유형 탭(전체/야외/실내), 지역 select, 5종 pill(무료/조명/풀코트/사람있는곳/픽업), 히트맵 토글 |
| 위치 권한 | useEffect 마운트 시 즉시 getCurrentPosition + watchPosition으로 실시간 추적 (배터리 비용 있음) |

#### 계획서와 현재 차이 (실제 빠진 것)
| 요구사항 | 현재 상태 | 작업 필요 |
|---------|----------|----------|
| 토글 [리스트] [지도] | ✅ 모바일만 (lg:hidden). PC는 분할 뷰 고정 | **변경 없음** (분할 뷰가 더 우수, 계획서 대비 개선) |
| 기본 = 리스트 | ❌ 현재 `useState<ViewMode>("map")` 기본 map | 🟡 기본 list로 변경할지 (의견: "map" 유지가 더 나음 — 모바일에선 지도가 핵심 가치) |
| localStorage `courts_view_mode` | ❌ 미구현 | 🔴 **신규** — useEffect로 mount 후 read, setViewMode 호출시 write |
| 카카오맵 SDK + KAKAO_MAPS_KEY 환경변수 | ❌ appkey 하드코딩 (`c11da2b86ea219b0a8681c33e83a05ed`) | 🔴 **신규** — `NEXT_PUBLIC_KAKAO_MAPS_KEY`로 외부화. `.env` 추가 |
| 마커 핀 + 인포 윈도우 (이름/평점/상세) | ✅ 이름/타입/혼잡도. ❌ 평점 + "상세 보기" 링크 누락 | 🟡 인포 텍스트에 ★평점 + `<a href="/courts/{id}">상세 보기</a>` 추가 |
| 위치권한 → 가까운 순 정렬 | ✅ haversine + distanceMap + 거리순 정렬 |  변경 없음 |
| 위치권한 거부 → 서울 시청 중심 | ✅ DEFAULT_CENTER 폴백 |  변경 없음 |
| 모바일 60vh | ⚠️ 현재 `calc(100vh - 80px)` 전체 컨테이너 → flex-1로 분배 | 🟢 시각적으로 문제 없음. 측정 후 결정 |
| 빈 상태 (주변 코트 없음 + 지역 드롭다운) | ⚠️ "조건에 맞는 농구장이 없습니다" 텍스트만. 지역 드롭다운은 상단 필터바에 별도 존재 | 🟡 빈 상태 박스에 지역 드롭다운 복제 또는 "필터 초기화" 버튼 추가 |
| 토글 시 데이터 재요청 X | ✅ 단일 SSR fetch + 클라 분기. 재요청 없음 |  변경 없음 |
| 클러스터링 | ✅ MarkerClusterer (minLevel=5, averageCenter) |  변경 없음 |
| 검색/필터 결과 지도 반영 | ✅ filtered → mapMarkers useMemo로 자동 반영 |  변경 없음 |

#### 변경 영향 범위
| 파일 | 작업 | 변경 유형 |
|------|------|----------|
| `src/app/(web)/courts/layout.tsx` | appkey → `process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY`. 미설정 폴백 console.warn | 수정 |
| `src/app/(web)/courts/_components/courts-content.tsx` | (1) localStorage `courts_view_mode` 읽기/쓰기 useEffect 2개. (2) 빈 상태 박스에 "다른 지역 보기" 드롭다운 또는 "필터 초기화" 버튼 | 수정 |
| `src/components/shared/kakao-map.tsx` | 인포 윈도우 HTML에 평점 라인 + "상세 보기" Link 추가. `MapMarker` 인터페이스에 `rating?: number` 추가 | 수정 |
| `.env` (개발) / Vercel 환경변수 (운영/프리뷰) | `NEXT_PUBLIC_KAKAO_MAPS_KEY=c11da2b86ea219b0a8681c33e83a05ed` 추가 | 신규 |
| `.env.example` | 예시 키 추가 (placeholder) | 신규 |

**신규 의존성 0건** — react-kakao-maps-sdk 같은 npm 패키지 도입 불필요. 직접 script 로드 + window.kakao 패턴이 이미 동작 중이며 단순함.

#### 카카오맵 SDK 통합 방식 (재확인)
- **유지**: 직접 script 삽입 (`courts/layout.tsx`). `react-kakao-maps-sdk` 등 외부 wrapper **도입 안 함**.
- **이유**: (1) 현 구현이 안정적이고 라이프사이클 잘 관리됨, (2) wrapper는 번들 크기 +30KB+ 종속성, (3) MarkerClusterer/CustomOverlay 직접 호출이 더 유연.
- **개선**: appkey만 환경변수로 외부화 (보안 베스트프랙티스 + Vercel 프리뷰/운영 분기 가능).

#### 데이터 흐름 (변경 없음, 확인 차원)
```
courts/page.tsx (서버, ISR 5분 + unstable_cache 5분)
  → court_infos.findMany SELECT (lat/lng 포함) + court_sessions.groupBy + pickup_games.groupBy
  → CourtsContent props로 전달 (단일 페이로드)
    → useMemo filtered (필터/정렬)
    → useMemo mapMarkers (지도용 데이터 변환)
    → 좌측 KakaoMap 컴포넌트 + 우측 카드 목록 (같은 filtered 배열 공유)
    → 토글(map/list)은 CSS hidden/flex-1만 변경. 데이터 재요청 0회
```

#### 위치 권한 UX (현재 패턴 유지)
- **타이밍**: 페이지 진입 즉시 (useEffect mount). KakaoMap 컴포넌트 내부에서도 `showCurrentLocation && !center` 조건으로 자동 호출 → **중복 호출 가능성**. 점검 필요.
- **거부 시**: 서울 시청 폴백 + 거리 정렬 비활성. 콘솔 warn만, UI 알림 없음 (계획서 요구 충족).
- **개선 옵션** (선택): watchPosition은 배터리 소모 큼. M3 본 작업과 별개로 1회 getCurrentPosition으로 충분할지 검토 가능 (현재 100m 근접 슬라이드업 기능 때문에 watch 유지 중).

#### 클러스터링 전략 (변경 없음)
- `minLevel: 5` (줌 레벨 5 이하에서 활성). 카카오맵 줌 레벨은 1=가장 가까움, 14=가장 멀음 → 5는 약 5km 시야.
- `averageCenter: true`: 클러스터 중심을 멤버 평균 위치로.
- `disableClickZoom: false`: 클러스터 클릭 시 자동 줌인.
- **클러스터 텍스트 형식**: 카카오 기본값 (n) 사용. 커스터마이징 불필요.

#### 빈 상태 + 필터 처리
**현재**: 카드 목록 영역만 빈 박스 ("조건에 맞는 농구장이 없습니다"). 지도 영역은 핀 0개로 표시.
**개선안 (선택)**:
- 옵션 A (가벼움): 빈 박스에 "필터 초기화" 버튼 (typeFilter='all' + cityFilter='all' + activePills=새 Set)
- 옵션 B (계획서대로): 빈 박스에 지역 select 복제 → 상단 필터와 동기화. 중복 UI 비용 vs UX 향상.
- **추천: A** (DRY + 단일 진실 원천)

#### Day 11 vs Day 12 분할 vs 통합 1커밋
**추천: 통합 1커밋 (단일 PR, ~2시간)**
- 근거: 실제 작업량이 계획서의 ~10시간 대비 1/4 이하. 분할의 이점 사라짐.
- PR #46에 누적 (현재 OPEN 상태, M2 sticky 카드 + 다음 M3로 묶음).

#### 위험/주의
| 위험 | 대응 |
|------|------|
| `NEXT_PUBLIC_KAKAO_MAPS_KEY` Vercel 미설정 → 운영 지도 깜깜 | 폴백 코드 (env 미설정 시 기존 하드코딩 키 사용) + Vercel 환경변수 추가 PR 메모로 표시 |
| 카카오 도메인 화이트리스트 | 현 키는 이미 운영 도메인 등록되어 있음 (작동 중). 환경변수로 옮겨도 키 자체는 동일 → 영향 없음 |
| SSR 회피 | layout.tsx가 use client + KakaoMap 자체 use client. 이미 안전 |
| lat/lng NULL 처리 | court_infos.lat/lng는 NOT NULL. 다만 0,0 더미가 있을 수 있어 `kakao-map.tsx` L180에서 `lat!==0 && lng!==0` 가드 이미 적용 |
| 모바일 성능 (마커 1000+) | MarkerClusterer로 이미 해결. 추가 작업 없음 |
| localStorage 첫 렌더 hydration mismatch | `useEffect`로 mount 후 setViewMode (more-tab-tooltip 패턴 동일). SSR/클라 일치 |
| 인포 윈도우 "상세 보기" 링크 | `<a href>` 직접 삽입. Next.js Link는 innerHTML로 못 씀 → 일반 a 태그 사용. 클라 라우팅 손실은 미미 |
| 카페 sync 파일 | **절대 손대지 않음**: `scripts/sync-cafe.ts`, `src/lib/cafe-sync/*` |

#### decisions.md 기록 안건
```
[2026-04-19] M3 코트 지도 뷰 — 기존 구현 80% 활용 + 폴리시 패치
- 분류: decision
- 발견자: planner-architect
- 내용: 카카오맵 SDK는 `courts/layout.tsx`에서 직접 script 삽입(react-kakao-maps-sdk 미도입). MarkerClusterer + CustomOverlay 직접 호출. appkey는 `NEXT_PUBLIC_KAKAO_MAPS_KEY` 환경변수로 외부화(폴백 하드코딩 유지). localStorage `courts_view_mode`로 모바일 토글 상태 영속. 인포 윈도우에 평점+상세보기 링크 추가. 통합 1커밋, ~2시간.
```

#### 📋 실행 계획 (developer 단계)
| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 1 | `kakao-map.tsx` MapMarker에 rating 추가 + 인포 윈도우 평점/상세보기 링크 | developer | 없음 |
| 2 | `courts-content.tsx` localStorage `courts_view_mode` 읽기/쓰기 + mapMarkers에 rating 매핑 + 빈 상태 "필터 초기화" 버튼 | developer | 1 |
| 3 | `courts/layout.tsx` appkey 환경변수화 (폴백 유지) | developer | 없음 (1,2와 병렬 가능) |
| 4 | `.env`/`.env.example`에 `NEXT_PUBLIC_KAKAO_MAPS_KEY` 추가 | developer | 3 |
| 5 | tsc --noEmit + Vercel 프리뷰 배포 확인 | tester | 1~4 |
| 6 | decisions.md 기록 | pm | 5 |

⚠️ **developer 주의사항**:
- 카페 sync 관련 파일 절대 손대지 말 것 (`scripts/sync-cafe.ts`, `src/lib/cafe-sync/*` — 다른 터미널 작업 중)
- KAKAO_MAPS_KEY 폴백 패턴: `process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY ?? "c11da2b86ea219b0a8681c33e83a05ed"` (env 미설정시 기존 키 그대로 동작)
- MarkerClusterer는 일반 Marker만 추가 가능 → 인포 윈도우는 Marker click 이벤트로 띄우되, "상세 보기" 링크는 `<a>` 태그 (innerHTML 한계)
- localStorage hydration: `useState<ViewMode>("map")` 기본값 유지 + `useEffect(()=>{ localStorage.getItem... }, [])` 패턴 (more-tab-tooltip.tsx L34~ 참조)
- 기본 viewMode는 **"map" 유지 권장** (모바일 핵심 가치). 계획서의 "기본 list"는 권장하지 않음 (사용성 후퇴) — PM 확인 필요

#### 추정 공수
- developer: 1.5시간
- tester: 0.5시간 (수동 + tsc)
- 합계: **2시간** (계획서 10시간 대비 5배 절감)

## 구현 기록 (developer)

### Phase 2b 마스킹 호출체인 + venue 제한 (04-20)

📝 구현한 기능: 다음카페 동기화의 개인정보 노출 근본 원인 수정 + venue 품질 가드.

**핵심 원인 (발견)**:
- `sync-cafe.ts` 라인 201: `maskPersonalInfo(r.content)` → console.log 전용 변수에만 사용
- 라인 340~350: upsert 에는 `content: r.content` 원본 그대로 전달 → DB에 평문 저장
- "로그엔 마스킹 찍히는데 DB엔 안 찍히는" 전형적 패턴 (regex는 정상, **호출 누락**)

**수정 전략 (이중 방어)**:
1. **호출자 1차** (sync-cafe.ts): syncInput 만들 때 `maskPersonalInfo(r.content)` 결과로 교체
2. **수신자 2차** (upsert.ts): `upsertCafeSyncedGame` 진입부에 `safeInput = { ...input, content: mask(input.content) }` — 호출자 실수 방어 (멱등)
3. **regex 3차** (mask-personal-info.ts): 라벨 기반 `maskByPhoneLabel/maskByAccountLabel` 선행 호출 — 콜론 바로붙은 숫자/비표준 구분자 대응

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `scripts/sync-cafe.ts` | `syncInput.content` 를 마스킹된 값으로 교체 + 주석 | 수정 |
| `src/lib/cafe-sync/upsert.ts` | `upsertCafeSyncedGame` 진입부에 `safeInput` 생성, 하위 호출에 전달 + maskPersonalInfo import | 수정 |
| `src/lib/security/mask-personal-info.ts` | 라벨 기반 PHONE_LABEL_REGEX / ACCOUNT_LABEL_REGEX 추가, `maskPersonalInfo` 호출 체인에 선행 | 수정 |
| `src/lib/cafe-sync/extract-fallbacks.ts` | `extractVenueName` 후처리: 괄호 제거, 주소 패턴(`\d{1,5}-\d+`) 거부, 길이 20자 상한 (slice 아님, null) | 수정 |

**검증 (dry-run n=5, IVHA)**:
- 마스킹: 5/5 성공 — 모든 본문의 `연락처 :010-****-****`, `계좌: 302-****-****` 확인
- venue: 주소성 2건 거부 ("고양시 화전동 162-4", "구리시 토평동 28-2"), 정상 "상암체육관"/"상암스킬존"/"인사이드바스켓볼" 통과
- vitest 회귀: **19/19 PASS** (mask-personal-info.test.ts)
- tsc --noEmit: **PASS** (에러 0)

**단위 검증** (임시 스크립트):
- 마스킹 10/10 (라벨+공백/콜론/하이픈없는 11자리, 계좌 연속형, 기존 하이픈 회귀, 멱등성)
- venue 6/6 (정상/괄호 제거/번지수 거부/슬래시/20자/도로명 거부)

💡 tester 참고:
- 테스트 방법:
  1. `npx vitest run src/__tests__/security/mask-personal-info.test.ts` → 19건 PASS
  2. dry-run: `npx tsx --env-file=.env --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=5 --with-body --article-limit=5`
- 정상 동작: 콘솔 "본문(마스킹)" 라인에 `010-****-****`, `302-****-****` 등 찍힘, "upsert 예정" 로그의 venue 에 주소성 문자열 없음
- 주의 입력: "010.1234.5678" 구분자 점, "연락처:01092383782" 콜론 직후 숫자, "계좌: 농협은행 3021602140681" 은행명 사이 숫자 — 모두 마스킹 확인됨

⚠️ reviewer 참고:
- **이중 방어 구조**: sync-cafe.ts(1차) + upsert.ts(2차) + mask-personal-info.ts 라벨 선행(3차). 하나만 깨져도 다음 layer 가 잡음
- **멱등성 보장**: `maskPersonalInfo` 는 `****` 섞인 문자열에도 안전 (regex 가 `\d` 만 매칭) — 이중 호출 OK
- **venue 20자 하드코딩**: 주석으로 이유 명시. 향후 체육관명이 길어지면 이 상수만 조정
- **parseCafeGame 미수정** 준수. parser 는 공식 포맷만 신뢰, fallback 레이어에서만 후처리
- **운영 DB 가드**: 기존 2중(sync-cafe + upsert.ts `assertDevDatabase`) 유지. safeInput 생성 전 체크 순서 OK

### M3 코트 지도 뷰 폴리시 (2026-04-20)

📝 구현한 기능: 코트 페이지 지도 뷰 4건 폴리시 — (1) 인포 윈도우 평점/상세보기 추가 (2) 모바일 viewMode localStorage 영속화 (3) 빈 상태 "필터 초기화" 버튼 (4) 카카오맵 appkey 환경변수화

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/components/shared/kakao-map.tsx` | `MapMarker` 인터페이스에 `rating?: number` 추가. 인포 윈도우 HTML에 ★평점 라인(rating>0일 때만) + `<a href="/courts/{id}">상세 보기</a>` 버튼 추가 | 수정 |
| `src/app/(web)/courts/_components/courts-content.tsx` | (a) `VIEW_MODE_KEY` 상수 + setViewMode 래퍼(useCallback) + mount후 read useEffect (more-tab-tooltip 패턴). (b) mapMarkers useMemo에 `rating: c.average_rating ?? undefined` 매핑. (c) 빈 상태 박스에 "필터 초기화" 버튼 (typeFilter='all' + cityFilter='all' + activePills=새 Set + selectedCourtId=null) | 수정 |
| `src/app/(web)/courts/layout.tsx` | `KAKAO_MAPS_FALLBACK_KEY` 상수 + `process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY ?? FALLBACK` 패턴. env 미설정시 `console.warn("[courts] NEXT_PUBLIC_KAKAO_MAPS_KEY 미설정 → 폴백 키 사용")` 1회 (mount 시점, 중복 로드 가드 안에서) | 수정 |
| `.env` | `NEXT_PUBLIC_KAKAO_MAPS_KEY="c11da2b86ea219b0a8681c33e83a05ed"` 1줄 추가 (기존 줄 무수정) | 수정 |
| `.env.example` | 같은 키 placeholder 빈 문자열 + 주석 3줄 추가 | 수정 |

✅ tsc 결과: **PASS (exit code 0, 오류 0건)**

설계 핵심 + 근거:
- **viewMode 기본값 "map" 유지** (PM 결정): 모바일 핵심 가치는 지도. SSR/hydration 일치 위해 useState 초깃값 고정 + mount 후 useEffect로 read.
- **setViewMode 래퍼 (useCallback)**: 토글 호출부 2곳에서 일관된 영속화 보장. localStorage 비활성 환경(Safari private)은 try/catch로 무음 처리.
- **rating 평탄화**: `c.average_rating: number | null` → `?? undefined` → 인포 윈도우 분기 `typeof === "number" && rating > 0`. 평점 0은 "평가 없음" 의미라 라인 자체 생략 (PM 명세).
- **상세 보기 링크**: innerHTML 한계로 Next.js Link 못 씀 → `<a href>` 예외 (인포 윈도우 한정 conventions 허용). 라우팅 손실은 미미 (full reload 1회).
- **appkey 폴백**: env 미설정으로 운영 지도 깜깜해지는 사고 방지. 폴백 키는 카카오 도메인 화이트리스트로 이미 보호됨. console.warn은 SDK 중복 로드 가드 안에서 1회만.
- **빈 상태 옵션 A**: 필터 초기화 버튼이 지역 드롭다운 복제보다 DRY (PM 결정). 단일 진실 원천 유지.

💡 tester 참고:
- **테스트 방법**:
  1. `/courts` 진입 → 지도에 마커 보이는지 (env 키 또는 폴백 동작 확인)
  2. 마커 클릭 → 인포 윈도우에 (a) 코트명 (b) 실내/야외+혼잡도 (c) ★평점(있을 때만) (d) "상세 보기" 버튼 4단 표시
  3. "상세 보기" 클릭 → `/courts/{id}` 정상 라우팅
  4. 모바일 사이즈(<lg)에서 [지도][목록] 토글 → list로 변경 후 새로고침 → 여전히 list 유지 (localStorage)
  5. 필터 빡세게 걸어 0건 만들기 → 빈 상태 박스에 "필터 초기화" 버튼 노출 → 클릭 시 모든 필터 풀려서 결과 복원
  6. 데스크톱 환경: 토글 버튼 안 보임 (lg:hidden), 분할 뷰 유지 — 영속화 영향 없음
- **정상 동작**:
  - 평점 NULL인 코트 인포 윈도우 → ★ 라인 없이 4단 (코트명/타입/없음/상세보기) 정상
  - 평점 4.5인 코트 인포 윈도우 → ★ 4.5 빨간색 표시
  - 환경변수 NEXT_PUBLIC_KAKAO_MAPS_KEY 설정 시 콘솔 경고 없음
  - 환경변수 미설정 시 콘솔에 `[courts] NEXT_PUBLIC_KAKAO_MAPS_KEY 미설정 → 폴백 키 사용` 1회만 출력
- **주의할 입력**:
  - localStorage 비활성 환경(Safari private mode) → 영속화 silently 실패하지만 UI 동작 OK
  - 평점이 0.0(명시적 0)인 코트 → 라인 생략 (의도한 동작)
  - 모바일 지도 뷰일 때 마커 클릭 → 인포 윈도우 + 하단 미니카드 둘 다 표시 (기존 동작 유지)

⚠️ reviewer 참고:
- **innerHTML `<a href>` 예외**: conventions.md "Material Symbols만"은 React 컴포넌트 적용. 카카오맵 인포 윈도우는 string innerHTML이라 Next.js Link 못 쓰는 한계. SVG 아이콘도 `›` 텍스트로 대체. PM 명시 허용.
- **환경변수 폴백 패턴**: 폴백 키가 코드에 노출되어도 카카오 JS SDK는 도메인 화이트리스트 보호 (GitHub 공개 무관). 운영 키와 동일.
- **viewMode 영속화 기본값 "map"**: PM 결정. 계획서 "기본 list" 미적용. 향후 변경 시 useState 초깃값 한 줄만 수정.
- **카페 sync 파일 무수정 확인**: `scripts/sync-cafe.ts`, `src/lib/cafe-sync/*` 손대지 않음 (다른 터미널 작업 중).
- **DB 변경 0건**: Prisma 스키마 무수정. `court_infos.average_rating` 기존 필드 그대로 사용.

## 테스트 결과 (tester)
(직전 작업: M6 — 작업 로그 압축됨)

## 리뷰 결과 (reviewer)
(직전 작업: M6 — 작업 로그 압축됨)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **gh pr edit 스코프 부족**: `gh api -X PATCH repos/OWNER/REPO/pulls/N -f title=...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **카페 쿠키 세션 갱신**: `npx tsx scripts/cafe-login.ts` (브라우저 headed → 로그인 → Enter)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 변환 6회 재발)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-20 | developer | **Phase 2b 마스킹 호출체인 + venue 제한** (4파일 수정, regex 3단 방어: sync-cafe→upsert safeInput→mask 라벨 선행. venue 괄호 제거+주소 거부+20자. vitest 19/19, dry-run 5/5 마스킹 확인) | ✅ 커밋 대기 |
| 04-20 | pm+team | **M6 알림 분류 6카테고리 탭 + 카테고리별 mark-all-read + 더 보기** (1신규+5수정, DB 0변경, 보너스: layout.tsx 헤더 뱃지 사일런트 버그 동시 정정) | ✅ 커밋 대기 |
| 04-19 | dev+review | M2 데스크톱 sticky 신청 카드 도입 (서버 컴포넌트, 6상태 분기, --color-* 100%) | ✅ 3405727 |
| 04-19 | developer | Phase 2b Step 1 — upsert.ts + sync-cafe --execute 통합 (코드 준비, 미실행) | ✅ 6d2617d |
| 04-19 | developer | M1 Day 8 설정/결제 탭 통합 허브 2개 + 기존 4페이지 redirect | ✅ 546a5c3 |
| 04-19 | developer | `/games` 경기 유형 탭 건수 뱃지 (route.ts groupBy 1회) | ✅ 1e7b642 |
| 04-19 | developer | `/games` 경기 유형 탭 추가 (전체/픽업/게스트/연습경기, URL `?type`) | ✅ 1082124 |
| 04-19 | developer | M1 Day 7 /profile 통합 대시보드 (히어로 + 4그룹 카드) + apiSuccess 가드 승격 | ✅ e259d56 |
| 04-19 | pm | UX 세션: 플래닝 3커밋 + W1 12/12 + dev merge-back 7충돌 해결 → PR #45 MERGEABLE | ✅ 610dcf2 |
| 04-19 | pm+developer | Phase 2a 완료: Playwright cafe-login + storageState → 본문 200×2/2 + 마스킹 OK | ✅ 55d78c3 |
| 04-19 | pm | PR #39/#45 dev 머지 완료 (squash) | ✅ |
