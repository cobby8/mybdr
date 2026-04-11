# UI 개선 작업 스크래치패드 (subin 브랜치)

## 🎯 작업 목적
홈, 대회, 경기 등 특정 페이지의 비율/레이아웃 수정 (컴팩트 축소, 정렬, 간격 보정 등)

## ⚠️ 절대 지켜야 할 제약 (PM이 모든 에이전트에게 선제 명령)
1. **공통 컴포넌트 수정 금지**
   - `src/components/shared/**` 건드리지 않음
   - `src/components/ui/**` 건드리지 않음
   - `src/components/toss/**` 건드리지 않음
   - `src/components/layout/**` 건드리지 않음
2. **디자인 토큰 수정 금지**
   - `src/app/globals.css` 건드리지 않음
   - Tailwind config 건드리지 않음
3. **Prisma schema 수정 금지** — 심판 브랜치(subin-referee)가 담당
4. **API 라우트 변경 금지** — UI 렌더링만 교체

허용 범위: 대상 페이지의 `page.tsx` + 해당 페이지 전용 `_components/*` 파일만

## 현재 작업
- **요청**: 다크모드에서 accent 배경 버튼 글씨 가시성 수정 (경기 찾기 페이지 필터/MY 버튼 안 보이는 버그)
- **상태**: developer 위임 준비
- **현재 담당**: pm → developer
- **사용자 지시**: 옵션 3 — globals.css에 `--color-on-accent` 변수 추가 + FloatingFilterPanel + games-content MY 버튼 + button.tsx cta variant 수정. primary variant는 건드리지 않음.
- **특이사항**: 원래 "공통 컴포넌트 금지" 원칙이었으나, 이번 건은 디자인 시스템 버그로 판단되어 사용자 승인으로 공통 컴포넌트 수정 허용. 심판 플랫폼에도 같은 기반을 적용하기 위해 지금 고침.

### developer에게 전달할 수정 명세 (4개 파일)

**File 1: `src/app/globals.css`**
- 59줄 `--color-on-primary: #FFFFFF;` 다음 줄에 추가:
  ```
    --color-on-accent: #FFFFFF;        /* accent 위 텍스트 (라이트모드) */
  ```
- 203줄 `--color-accent-light: rgba(242, 244, 246, 0.08);` 다음 줄에 추가:
  ```
    --color-on-accent: #191F28;        /* accent 위 텍스트 (다크모드) */
  ```

**File 2: `src/components/shared/floating-filter-panel.tsx`**
- 83줄: `color: "#fff",` → `color: "var(--color-on-accent)",`

**File 3: `src/components/ui/button.tsx`**
- 35줄: `cta: { backgroundColor: 'var(--color-accent)', color: '#fff' },` → `cta: { backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' },`
- 12줄 `cta: "font-bold hover:opacity-90 text-white",`에서 `text-white` 제거 (style로 override되지만 혼란 방지): `cta: "font-bold hover:opacity-90",`
- ⚠️ **primary variant(34줄)는 건드리지 말 것** — 범위 외

**File 4: `src/app/(web)/games/_components/games-content.tsx`**
- 268줄 className에서 `text-white` 제거하고, style prop에 `color: "var(--color-on-accent)"` 추가:
  ```tsx
  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-colors bg-[var(--color-accent)] shrink-0"
  style={{ color: "var(--color-on-accent)" }}
  ```

### developer 제약
- 위 4개 파일 외에는 건드리지 않는다
- primary variant 수정 금지
- 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴은 이번 작업 범위 아님

## 구현 기록 (developer)

📝 구현한 기능: 다크모드 accent 배경 버튼 글씨 가시성 버그 수정 (`--color-on-accent` CSS 변수 도입)

⚠️ **공통 컴포넌트 2개 수정됨 (사용자 승인)** — `src/components/shared/floating-filter-panel.tsx`, `src/components/ui/button.tsx`. 평소 원칙(공통 컴포넌트 수정 금지)과 다르나, 이번 건은 디자인 시스템 버그로 판단되어 사용자 승인 하 예외 적용.

### 변경 파일 목록 (4개)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/globals.css` | 라이트/다크 모드 각각에 `--color-on-accent` 변수 추가 (라이트=#FFFFFF, 다크=#191F28) | 수정 |
| `src/components/shared/floating-filter-panel.tsx` | 트리거 버튼 style의 `color: "#fff"` → `"var(--color-on-accent)"` | 수정 |
| `src/components/ui/button.tsx` | cta variant: className의 `text-white` 제거 + style의 `color: '#fff'` → `'var(--color-on-accent)'` (primary는 건드리지 않음) | 수정 |
| `src/app/(web)/games/_components/games-content.tsx` | MY 버튼 className의 `text-white` 제거 + `style={{ color: "var(--color-on-accent)" }}` 추가 | 수정 |

### 변경 전/후 핵심 요약

**globals.css (라이트모드 60줄 부근)**
- before: `--color-on-primary: #FFFFFF;` 다음 줄에 아무 것도 없음
- after: `--color-on-accent: #FFFFFF;` 추가 (주석: "accent 위 텍스트 (라이트모드: 진한 accent 배경에 흰 글씨)")

**globals.css (다크모드 203줄 부근)**
- before: `--color-accent-light: rgba(242, 244, 246, 0.08);`에서 블록 종료
- after: 같은 줄 다음에 `--color-on-accent: #191F28;` 추가 (주석: "다크모드: 밝은 accent 배경이라 검정 글씨")

**floating-filter-panel.tsx (83줄)**
- before: `color: "#fff",`
- after: `color: "var(--color-on-accent)",` + 한국어 주석

**button.tsx (11~13줄, 36~37줄)**
- before (12줄): `"font-bold hover:opacity-90 text-white"`
- after: `"font-bold hover:opacity-90"` (text-white 제거) + 한국어 주석
- before (35줄): `cta: { backgroundColor: 'var(--color-accent)', color: '#fff' }`
- after: `cta: { backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }` + 한국어 주석
- ✅ primary variant (9~10, 35줄)는 **손대지 않음**

**games-content.tsx (268줄 부근)**
- before: `className="... bg-[var(--color-accent)] text-white shrink-0"`
- after: `className="... bg-[var(--color-accent)] shrink-0"` + `style={{ color: "var(--color-on-accent)" }}` + 한국어 주석

### 타입 체크 결과
```
npx tsc --noEmit → EXIT_CODE=0 (에러 0건)
```

### 💡 tester 참고
- **테스트 방법**:
  1. `/games` 페이지 접속
  2. 우측 상단 필터 버튼(tune 아이콘)과 MY 버튼이 다크모드에서 글씨/아이콘이 보이는지 확인
  3. 라이트모드로 전환 (html.light) 후 동일 버튼의 글씨 가시성 확인
  4. `/tournaments`, `/teams` 페이지의 필터 버튼도 자동 정상화되었는지 확인 (FloatingFilterPanel 공통 컴포넌트 수정 덕분)
  5. Button 컴포넌트의 `variant="cta"` 쓰는 CTA 버튼들 확인
- **정상 동작**:
  - 다크모드: 밝은 회색(#F2F4F6) 배경 위에 진한 검정(#191F28) 글씨 → 또렷하게 읽힘
  - 라이트모드: 진한 회색(#191F28) 배경 위에 흰(#FFFFFF) 글씨 → 또렷하게 읽힘
- **주의할 입력**:
  - 테마 전환 (다크 ↔ 라이트) 시 색상이 즉시 반영되는지
  - primary variant 버튼은 이번 작업 범위 외 — 수정되지 않아야 함 (건드렸다면 회귀)

### ⚠️ reviewer 참고
- **특별히 봐줬으면 하는 부분**:
  1. `button.tsx`의 primary variant가 그대로인지 (10줄 `text-white`, 35줄 `color: '#fff'` 유지 확인)
  2. globals.css에서 라이트/다크 두 곳 모두 `--color-on-accent`가 정의되었는지
  3. 네이밍 컨벤션 `--color-on-*`이 기존 `--color-on-primary`와 일관성 있는지
- **범위 외 (이번에 안 건드린 것)**: 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴, button.tsx primary variant

## 테스트 결과 (tester)

🧪 검증 방식: 실제 브라우저 구동 없이 **정적 코드 검증 + tsc + git diff** 기반으로 판정 (바이브 코더 환경 특성 상 dev 서버 실행/스크린샷 불가).

### 테스트 항목

| # | 테스트 항목 | 결과 | 비고 |
|---|------------|------|------|
| 1 | `npx tsc --noEmit` 에러 0건 | ✅ 통과 | EXIT=0 |
| 2 | 수정된 파일이 지정된 4개와 일치 | ✅ 통과 | globals.css, floating-filter-panel.tsx, button.tsx, games-content.tsx (settings.local.json은 무관한 기존 변경, scratchpad-ui.md는 untracked) |
| 3 | globals.css 라이트모드에 `--color-on-accent: #FFFFFF;` 추가 | ✅ 통과 | 60행, `--color-on-primary` 다음 줄 |
| 4 | globals.css 다크모드(`html.dark`)에 `--color-on-accent: #191F28;` 추가 | ✅ 통과 | 205행, `--color-accent-light` 다음 줄 |
| 5 | floating-filter-panel.tsx 트리거 버튼 color가 `var(--color-on-accent)` 사용 | ✅ 통과 | 84행 (기존 `#fff` 제거) + 한국어 주석 |
| 6 | button.tsx cta variant style.color가 `var(--color-on-accent)` 사용 | ✅ 통과 | 37행 |
| 7 | button.tsx cta variant className에서 `text-white` 제거 | ✅ 통과 | 13행, `font-bold hover:opacity-90`만 남음 |
| 8 | **button.tsx primary variant 회귀 없음 (text-white + color:'#fff' 유지)** | ✅ 통과 | 10행 `text-white` 그대로, 35행 `color: '#fff'` 그대로 — 가장 중요한 회귀 방지 체크 **성공** |
| 9 | games-content.tsx MY 버튼 className에서 `text-white` 제거 | ✅ 통과 | 268행 |
| 10 | games-content.tsx MY 버튼 style에 `color: "var(--color-on-accent)"` 추가 | ✅ 통과 | 269행 |
| 11 | 범위 외 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴 미수정 | ✅ 통과 | grep 결과 31개 파일에 패턴 그대로 남아있음 (스크래치패드 명시 "이번 작업 범위 외" — 의도대로) |
| 12 | 의도하지 않은 side effect (대상 외 소스 파일 변경) 없음 | ✅ 통과 | git status에 4개 대상 파일만 (settings.local.json, scratchpad-ui.md 제외) |

### 변경 라인 수 검증 (git diff --stat)
- globals.css: **+2 / -0**
- floating-filter-panel.tsx: **+2 / -1**
- button.tsx: **+4 / -2** — primary variant 손 안 댐 재확인
- games-content.tsx: **+3 / -1**

총 **+11 / -4**. 명세와 일치. (명세가 최소한의 타겟 수정이었고, 주석 추가분이 포함된 것이 전부)

### 종합
📊 **12개 항목 중 12개 통과 / 0개 실패 / 0개 수정 요청**

⚠️ **실제 브라우저 렌더링 테스트는 수행 불가**. 다음 항목은 사용자가 로컬(`http://localhost:3001`) 또는 Vercel 프리뷰에서 직접 확인 필요:
  - 다크모드에서 `/games` 필터 버튼(tune 아이콘)과 MY 버튼이 밝은 배경 위에 검정 글씨로 선명하게 보이는지
  - 라이트모드 전환 시 동일 버튼이 진한 배경 위에 흰 글씨로 보이는지
  - `/tournaments`, `/teams` 등 FloatingFilterPanel을 쓰는 다른 페이지의 필터 버튼도 자동 정상화되었는지
  - `<Button variant="cta">`가 사용되는 CTA 버튼들의 글씨 대비

🎯 **코드 정합성 관점에서는 결함 없음**. 명세대로 정확히 4개 파일만 수정, primary variant 회귀 없음, tsc 통과. **커밋 진행 가능** 판정.

## 리뷰 결과 (reviewer)

📊 **종합 판정: 승인**

변경 명세와 실제 코드가 완벽히 일치한다. primary variant 회귀 없음, 범위 외 파일 손대지 않음, 네이밍/값/주석 모두 프로젝트 컨벤션 준수.

### ✅ 잘된 점
1. **네이밍 일관성 우수**: `--color-on-accent`가 기존 `--color-on-primary`(59줄)와 완전히 동일한 패턴(`on-{배경역할}`)을 따름. 디자인 시스템 규칙 자연스럽게 확장됨.
2. **값 선택 적절**: 라이트 `#FFFFFF` ↔ 다크 `#191F28`이 각 모드의 `--color-accent`(`#191F28` ↔ `#F2F4F6`)와 정확히 반대 색상. 대비(contrast) 최대화.
3. **라이트/다크 양쪽 모두 정의**: `:root`(60줄), `.dark`(205줄) 두 곳 다 선언되어 테마 전환 시 fallback 없음.
4. **primary variant 완벽 보존**: button.tsx 9~10줄(`"font-bold hover:opacity-85 text-white"`), 35줄(`{ backgroundColor: 'var(--color-text-primary)', color: '#fff' }`) — 스크래치패드 제약 그대로. 회귀 없음.
5. **한국어 주석 품질 우수**: 각 변경 지점에 "왜 이렇게 바꿨는지" 의도가 명시됨. 예: button.tsx 12줄 "style prop의 color가 라이트/다크 자동 전환하므로 고정 흰색 클래스는 오히려 혼란을 준다", 36줄 "다크모드에서 accent가 #F2F4F6(거의 흰색)이 되면 글씨는 자동으로 #191F28(검정)이 됨".
6. **className/style 충돌 제거**: games-content.tsx 269줄에서 `text-white`를 className에서 빼고 style의 `color`로 일원화 → Tailwind와 inline style이 경쟁하지 않음.
7. **하드코딩 색상 제거**: 4개 파일 모두 `#fff`/`text-white` → CSS 변수로 전환. 프로젝트 "하드코딩 색상 금지" 컨벤션 준수.
8. **범위 외 파일 절제**: games-content.tsx 278줄 NEW 버튼(`bg-[var(--color-primary)] text-white`)은 **primary 배경**이라 이번 작업(accent 배경) 범위 외 — 건드리지 않은 것이 정확. 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴도 손대지 않음.

### 🔴 필수 수정
없음.

### 🟡 권장 수정 (낮은 우선순위, 이번엔 반영하지 말 것)
- **(정보성)** globals.css 74줄에 `--color-text-on-primary: #FFFFFF`가 이미 존재. 59줄 `--color-on-primary`와 이름이 겹쳐 혼란 소지 있음. 이번 작업 범위 아니므로 **이번엔 손대지 말 것**. 나중에 별도 정리 작업으로 분리.
- **(정보성)** 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴은 여전히 다크모드에서 가독성 문제 있을 수 있음. 이번 작업은 `/games` 페이지 긴급 버그 한정이고, 전체 일괄 교체는 별도 리팩토링 작업으로 분리 예정. 스크래치패드 명시대로 **범위 외**.

### 🎯 디자인 시스템 일관성 체크
| 항목 | 결과 |
|------|------|
| `--color-on-accent` 네이밍이 `--color-on-primary`와 일관성 있는가 | ✅ |
| 라이트/다크 양쪽 모두 정의되었는가 | ✅ (60줄, 205줄) |
| 값이 `--color-accent`의 반대 색상인가 | ✅ (라이트: accent #191F28 ↔ on-accent #FFFFFF / 다크: accent #F2F4F6 ↔ on-accent #191F28) |
| 하드코딩 색상 없이 CSS 변수 사용 | ✅ |

### 🛡️ 회귀 방지 체크
| 항목 | 결과 |
|------|------|
| button.tsx primary variant 변경 없음 | ✅ (10줄, 35줄 원본 유지) |
| 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴 변경 없음 | ✅ |
| API/데이터 패칭 변경 없음 | ✅ (CSS/className/style prop만 변경) |
| tsc 통과 | ✅ (EXIT_CODE=0) |

### 🔧 공통 컴포넌트 수정 정당성 (예외 상황)
- **FloatingFilterPanel**: `/games`, `/tournaments`, `/teams`에서 공통 사용. 이번 수정으로 3곳 모두 다크모드에서 트리거 버튼 가시성 자동 정상화. **부작용 없는 의도된 side effect** — 버그 수정이 3페이지 동시에 적용되는 이점.
- **Button cta variant**: style prop의 color를 변수화하고 className `text-white` 제거. cta variant를 사용하는 모든 곳에서 동일하게 자동 전환. 기존 라이트모드 외관(흰 글씨)은 그대로 유지되므로 시각적 회귀 없음.
- 사용자 승인 하 디자인 시스템 버그 수정이므로 "공통 컴포넌트 수정 금지" 원칙 예외 적용이 정당.

### 📌 최종 판정
**승인 (developer 작업 완료, 추가 수정 불필요).** tester가 `/games` 다크/라이트 양쪽에서 실제 가시성 확인 후 PM이 커밋 진행해도 됨.

## 작업 로그
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-04-11 | developer | 다크모드 accent 버튼 가시성 수정 (--color-on-accent 도입, 4파일) | tsc 0 에러 |
| 2026-04-11 | tester | 정적 검증 (tsc + git diff + 코드 리뷰) | 12/12 통과, primary 회귀 없음 |
