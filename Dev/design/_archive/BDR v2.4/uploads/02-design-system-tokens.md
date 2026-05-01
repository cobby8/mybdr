# BDR 디자인 시스템 토큰

> 모든 시안은 이 토큰을 사용합니다. 하드코딩 hex / 외부 색상 라이브러리 금지.

---

## 1. 색상 (CSS 변수)

### 1-1. 브랜드

| 토큰 | 값 | 용도 |
|------|-----|------|
| `var(--accent)` | `#E31B23` (BDR Red) | 강조 / 1차 CTA / 활성 상태 |
| `var(--accent-hover)` | `#FF3B3B` | accent 호버 |
| `var(--accent-light)` | `rgba(227,27,35,0.15)` | accent 반투명 배경 |
| `var(--cafe-blue)` | `#1B3C87` (BDR Navy) | 보조 / 2차 CTA / 브랜딩 |
| `var(--info)` | `#0079B9` | 링크 / 정보성 뱃지 |

### 1-2. 배경 / 표면

| 토큰 | 다크 (기본) | 라이트 |
|------|------------|--------|
| `var(--bg)` | `#131313` | `#F8F8F8` |
| `var(--bg-alt)` | `#1A1A1A` | `#F2F2F2` |
| `var(--bg-card)` | `#2A2A2A` | `#FFFFFF` |
| `var(--bg-elev)` | `#3A3A3A` | `#E8E8E8` |
| `var(--bg-hover)` | `#333333` | `#EEEEEE` |

### 1-3. 텍스트 (잉크)

| 토큰 | 다크 | 라이트 |
|------|------|--------|
| `var(--ink)` | `#E0E0E0` | `#131313` |
| `var(--ink-soft)` | `#B0B0B0` | `#555555` |
| `var(--ink-mute)` | `#888888` | `#888888` |
| `var(--ink-dim)` | `#555555` | `#AAAAAA` |
| `var(--on-accent)` | `#FFFFFF` | `#FFFFFF` |

### 1-4. 테두리

| 토큰 | 다크 | 라이트 |
|------|------|--------|
| `var(--border)` | `rgba(255,255,255,0.08)` | `#D0D0D0` |
| `var(--border-subtle)` | `rgba(255,255,255,0.04)` | `#E0E0E0` |

### 1-5. 상태

| 토큰 | 값 | 용도 |
|------|-----|------|
| `var(--ok)` | `#10B981` | 성공 / 인증완료 |
| `var(--err)` | `#EF4444` | 에러 / 위험 |
| `var(--warn)` | `#F59E0B` | 경고 |
| `var(--err-light)` | `rgba(227,27,35,0.15)` | 에러 배경 |

---

## 2. 금지 색상

### 2-1. 절대 사용 금지

```
❌ 핑크 / 살몬 / 로즈 / 코랄 / 피치
❌ 따뜻한 베이지 / 크림색 / 따뜻한 흰색
❌ 하드코딩 hex 범위:
   - #FF8xxx, #FFAxxx, #FFBxxx (핑크/오렌지)
   - #E7Bxxx, #E8Axxx, #F0Dxxx
   - #FFF0xx, #FFF5xx (따뜻한 흰)
   - #FAExxx, #FCExxx (베이지)
```

### 2-2. 빨강 변형 시 주의

```
✅ Red #E31B23 + 투명도 → rgba(227,27,35, 0.15) (밝게 만들 때)
❌ Red 의 밝은 변형으로 핑크 사용 금지 (#FF8xxx 류)
```

---

## 3. 타이포그래피

### 3-1. 폰트 패밀리

| 토큰 | 값 | 용도 |
|------|-----|------|
| `var(--ff-display)` | `'Archivo', 'Bebas Neue', 'Impact', 'Noto Sans KR', system-ui` | 영문 헤딩 / 큰 숫자 |
| `var(--ff-body)` | `'Pretendard', 'Noto Sans KR', system-ui` | 한글 본문 전체 |
| `var(--ff-mono)` | `'JetBrains Mono', 'IBM Plex Mono', ui-monospace` | 코드 / 통계 숫자 |

### 3-2. 크기 체계

| 레벨 | 크기 | 굵기 | 폰트 |
|------|------|------|------|
| Display | 3.5rem (56px) | 800 | display |
| Headline | 1.75rem (28px) | 700 | display 또는 body |
| Title | 1.375rem (22px) | 700 | body |
| Body | 1rem (16px) | 400 | body |
| Caption | 0.875rem (14px) | 400 | body |
| Label | 0.75rem (12px) | 500 | body |

### 3-3. 큰글씨 모드

`html.large-text` 클래스 추가 시 전체 폰트 120% 확대.

---

## 4. 라운딩 (border-radius)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `var(--radius-pill)` | `0.25rem` (4px) | **버튼 표준** (pill 9999px 절대 금지) |
| `var(--radius-card)` | `0.5rem` (8px) | 카드 표준 |
| `var(--radius-card-lg)` | `0.75rem` (12px) | 큰 카드 / 모달 |
| 9999px / 50% | 별도 | 아바타 / dot / 뱃지만 허용 |

---

## 5. 그림자

| 토큰 | 다크 | 라이트 |
|------|------|--------|
| `var(--sh-card)` | `0 2px 8px rgba(0,0,0,0.2)` | `0 2px 8px rgba(0,0,0,0.06)` |
| `var(--sh-lift)` | `0 4px 16px rgba(0,0,0,0.3)` | `0 4px 16px rgba(0,0,0,0.1)` |

---

## 6. 모바일 룰 (필수 준수)

### 6-1. 브레이크포인트

```css
@media (max-width: 720px) {  /* 모바일 (phone) — 표준 */ }
@media (max-width: 768px) {  /* 모바일 (tablet small) */ }
@media (max-width: 900px) {  /* 태블릿 + 일부 with-aside */ }
@media (max-width: 1024px) { /* 태블릿 (lg 미만) */ }
```

### 6-2. iOS Safari 자동 줌 차단

```css
@media (max-width: 720px) {
  input:not([type="checkbox"]):not([type="radio"]),
  select,
  textarea {
    font-size: 16px !important;  /* 16px 미만이면 iOS 자동 줌 발생 */
  }
}
```

### 6-3. 터치 타겟

```css
@media (max-width: 720px) {
  .btn { min-height: 44px; }       /* iOS HIG 권장 */
  .btn--sm { min-height: 44px; }
  .btn--xl { min-height: 48px; }
}
```

### 6-4. 가로 overflow 차단

```css
@media (max-width: 768px) {
  html, body { overflow-x: hidden; max-width: 100vw; }
  .page { overflow-x: hidden; max-width: 100%; }
}
```

### 6-5. 인라인 grid 사용 시

```jsx
{/* ❌ 모바일 분기 없는 고정 grid 금지 */}
<div style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>...</div>

{/* ✅ auto-fit minmax (모바일 자동 줄 수) */}
<div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>...</div>

{/* ✅ 또는 className 분기 */}
<div className="grid-cards">...</div>
{/* CSS:
   .grid-cards { display: grid; grid-template-columns: repeat(3, 1fr); }
   @media (max-width: 720px) { .grid-cards { grid-template-columns: 1fr; } }
*/}
```

---

## 7. 아이콘

### 7-1. 사용 가능

```
✅ Material Symbols Outlined (Google Fonts CDN)
   <span className="material-symbols-outlined">arrow_back</span>

✅ Unicode 이모지 (시안에 검증된 것)
   - 더보기 메뉴 그룹 / 프로필 settings 섹션
   - 👤🏀🔔🔒💳⚠️📋📅🔖💬🎖📈✍🆚➕📍📮⚙📣🔎👔⭐🏆📷✏🔑🎯🛡🦓
```

### 7-2. 절대 금지

```
❌ lucide-react (외부 라이브러리)
❌ react-icons / heroicons / 등 외부 아이콘 패키지
```

### 7-3. 아이콘 크기

| 용도 | 크기 |
|------|------|
| 사이드바 / 네비 | 1.25rem (20px) |
| 모바일 하단 탭 | 1.5rem (24px) |
| FAB | 1.875rem (30px) |
| 설정 메뉴 | 1.125rem (18px) |

---

## 8. 컴포넌트 표준

### 8-1. 버튼

```css
.btn {
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
}
.btn--primary {
  background: var(--accent);
  color: var(--on-accent);
}
.btn--primary:hover { background: var(--accent-hover); }
.btn--accent {
  background: var(--cafe-blue);
  color: #fff;
}
.btn--sm { padding: 8px 12px; font-size: 13px; }
.btn--xl { padding: 12px 20px; font-size: 15px; }

@media (max-width: 720px) {
  .btn { min-height: 44px; }
}
```

### 8-2. 카드

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: var(--sh-card);
}
.card:hover { background: var(--bg-hover); }
```

### 8-3. 페이지 셸

```css
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px var(--gutter);
}
.page--wide { max-width: 1440px; }
```

### 8-4. with-aside (좌 사이드바 + 우 본문)

```css
.with-aside {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 24px;
}
@media (max-width: 900px) {
  .with-aside { grid-template-columns: 1fr; }
}
```

---

## 9. 출처

- `Dev/design/DESIGN.md` (영구 참조)
- `Dev/design/BDR v2.2/tokens.css` (현재 시안 토큰)
- `src/app/globals.css` (사이트 적용 룰)
