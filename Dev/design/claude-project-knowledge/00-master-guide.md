# BDR 디자인 작업 — 마스터 가이드 (Project 진입점)

> 이 Project 안에서 이루어지는 **모든 디자인 작업**은 이 문서를 첫 번째로 참고합니다.
> Claude 는 이 가이드를 **항상 우선 순위로 읽고**, 다른 첨부 파일 (사용자 결정 / 디자인 시스템 / AppNav frozen) 을 보조 자료로 사용합니다.

---

## 1. 프로젝트 한 줄 소개

**MyBDR (Basketball Daily Routine)** — 전국 농구 매칭 플랫폼.
- 코트 예약 / 픽업 게임 / 게스트 모집 / 토너먼트 / 팀 운영 / 심판 배정 / Flutter 기록앱(별도) 통합
- **다크 모드 기본** (쿨 그레이 + BDR Red `#E31B23` + BDR Navy `#1B3C87`)
- 운영 사이트: [mybdr.kr](https://mybdr.kr)

---

## 2. 디자인 작업 핵심 13 룰 (절대 준수)

> 위반 시 자동 reject. 새 시안은 모두 이 룰을 통과해야 함.

### 2-1. AppNav (헤더) 룰 6가지

```
✅ AppNav 컴포넌트는 frozen — `04-appnav-frozen-component.md` 코드 그대로 사용
   (절대 새로 그리지 말 것. 기존 코드 카피 + import 만)

1. 9 메인 탭 = 홈 / 경기 / 대회 / 단체 / 팀 / 코트 / 랭킹 / 커뮤니티 / 더보기
   (마지막 탭이 더보기 — 클릭 시 5그룹 패널 토글)

2. utility bar (상단 파란 띠):
   - 좌측: "MyBDR 커뮤니티 / 소개 / 요금제 / 도움말" — 모바일 hidden, PC 표시
   - 우측: "계정 / 설정 / 로그아웃" — **모바일에서도 표시**

3. main bar 우측 컨트롤 = 검색 + 알림 + 다크모드 토글 + 햄버거(모바일)
   ❌ 더보기 dropdown trigger 추가 금지
   ❌ 계정 아이콘 + 닉네임 추가 금지
   (캡처에서 "더보기 ▼" 또는 "RDM" 아바타 보이면 위반)

4. 다크모드 토글 (하이브리드):
   - 데스크톱 (md ≥ 768px): 두 라벨 토글 ("라이트 / 다크")
   - 모바일 (md < 768px): 단일 아이콘 (☀ / ☾)

5. 검색 + 알림 = 아이콘만 (`app-nav__icon-btn` 클래스)
   ❌ border / 배경 박스 추가 금지

6. 모바일 닉네임 hidden (햄버거와 충돌 방지)
```

### 2-2. 더보기 메뉴 (5그룹 IA) 룰 2가지

```
7. 5그룹 구조 (절대 변경 X):
   - 내 활동 / 경기·대회 / 등록·예약 / 둘러보기 / 계정·도움

8. 가짜링크 영구 제거 — 다음 4개는 절대 시안에 포함 X:
   ❌ gameResult / gameReport / guestApps / referee
   ✅ refereeInfo (RefereeInfo 신규 라우트만 OK)
```

### 2-3. 콘텐츠 / 카피 룰 1가지

```
9. 글로벌 카피 = "전국 농구 매칭 플랫폼"
   ❌ "서울 3x3 한정" 같은 도시 한정 표현 금지
   ❌ About 페이지 운영진 실명 박제 금지 (일반 라벨 사용)
```

### 2-4. 디자인 토큰 룰 4가지

```
10. 색상: var(--accent / --cafe-blue / --ok / --bg-alt / --ink-mute) 등 토큰만
    ❌ #ff6b88 같은 하드코딩 hex 금지
    ❌ 핑크 / 살몬 / 코랄 / 따뜻한 베이지 절대 금지

11. 아이콘: Material Symbols Outlined 또는 시안 검증된 이모지
    ❌ lucide-react 금지

12. 라운딩: 버튼 / 카드 4px 표준 (8px 카드도 OK)
    ❌ pill 9999px 금지

13. 모바일: 720px 통일 / iOS input 16px / 버튼 44px 터치 타겟
    인라인 grid `repeat(N, 1fr)` 사용 시 720px 분기 필수
```

---

## 3. 시안 작업 시 첫 응답 형식 (필수)

새 의뢰를 받으면 다음 형식으로 응답:

```
✅ BDR 디자인 의뢰 확인 — [작업명]

이해:
- [의뢰 핵심 1]
- [의뢰 핵심 2]
- 사용자 결정 §[해당 영역] 보존
- 산출물: [파일 경로]

자체 검수 (이번 작업에 적용할 룰):
- AppNav frozen — components.jsx 카피 사용
- 13 룰 중 [번호] 적용
- 자체 체크리스트: [07-self-checklist.md] 의 해당 섹션

질문 / 가정:
1. [필요 시 PM 결정 항목]

작업 시작.
```

---

## 4. 산출물 폴더 구조

새 시안은 다음 폴더에 작업:

```
Dev/design/BDR v2.X/                  (X = 다음 버전 — v2.3, v2.4 등)
├── README.md                          (변경 요약 — v(X-1) → v(X))
├── tokens.css                         (BDR v2.2 카피 — 변경 없으면 그대로)
├── components.jsx                     (BDR v2.2 카피 — AppNav frozen)
├── data.jsx
├── extras-data.jsx
├── responsive.css
├── MyBDR.html
├── _mobile_audit.html
└── screens/
    ├── (BDR v2.2 의 모든 시안 카피)
    └── [신규 시안].jsx
```

⚠️ **중요**: 새 v2.X 폴더는 항상 **이전 버전 (BDR v2.2 또는 가장 최신) 의 카피**로 시작. 변경된 파일만 수정. 변경 없는 파일은 그대로.

---

## 5. 박제 등급 (참고용)

현재 사이트 117 페이지 분류 (`05-page-inventory.md` 상세):

```
A등급 (시안 1:1 박제)         43개  ← 핵심 사용자 페이지 대부분
B등급 (80%+ 박제)             14개  ← 디테일 누락
C등급 (부분 박제)              9개
D등급 (박제 안됨)              0개  ← v2.2 박제로 0 달성
E등급 (시안 외 자체 영역)     50개  ← admin / referee / tournament-admin / _site
F등급 (라우트 누락)            0개
                             ───
총                            117
```

**박제 대상**: A/B/C 67 페이지 (사용자 영역).
**박제 외**: E 50 페이지 (자체 디자인 — admin/referee 등).

---

## 6. 시안 외 (E등급) 영역 작업 시

다음 영역은 **시안 박제 X / 자체 디자인 OK**:
- `(admin)/admin/*` (백오피스 18)
- `(web)/tournament-admin/*` (20)
- `(web)/partner-admin/*` (4)
- `(referee)/referee/*` (심판 플랫폼 28)
- `_site/*` (서브도메인 토너먼트 6)

이 영역들은 **디자인 토큰만 일치** 시키면 OK. AppNav 적용 X (별도 셸 사용).

---

## 7. 외부 참조 (이 Project 의 다른 첨부 파일)

| # | 파일 | 역할 |
|---|------|------|
| 00 | (이 문서) | 마스터 진입점 — 첫 번째 참고 |
| 01 | user-design-decisions.md | 사용자 직접 결정 8 영역 (절대 보존) |
| 02 | design-system-tokens.md | 색상 / 타이포 / 라운딩 / 모바일 토큰 |
| 03 | appnav-frozen-component.md | AppNav frozen 코드 (그대로 카피) |
| 04 | page-inventory.md | 117 페이지 박제 등급 매트릭스 |
| 05 | design-brief-template.md | 시안 의뢰 시 표준 템플릿 |
| 06 | self-checklist.md | 시안 완료 후 자체 검수 체크리스트 |

---

## 8. 작업 흐름 요약

```
[새 의뢰 도착]
  ↓
[Step 1] 00-master-guide.md (이 문서) 읽기 + 13 룰 인지
  ↓
[Step 2] 의뢰 내용에 따라 01~06 보조 파일 참고
  ↓
[Step 3] §3 첫 응답 형식으로 확인 응답
  ↓
[Step 4] 의뢰 작업 진행
  ├─ AppNav 는 03 frozen 카피 (절대 재구성 X)
  ├─ 새 컴포넌트만 신규 디자인
  ├─ 토큰은 02 사용
  └─ 카피 / 명칭은 01 §5-6 §6 보존
  ↓
[Step 5] 시안 완료 후 06 self-checklist 모든 항목 ✅ 체크
  ↓
[Step 6] 위반 0 확인 후 산출물 제출
  ├─ Dev/design/BDR v2.X/ 폴더 정리
  ├─ README.md 에 v(X-1) → v(X) 변경 요약
  └─ 검수 결과 보고
```

---

## 9. PM 결정 필요 시 (시안 작업 중)

다음 경우 PM 에게 1줄 질문:
- 사용자 결정 §1~§8 과 충돌하는 새 디자인 제안 시
- DB / API 미지원 기능 시안 제안 시 (데이터 출처 불명)
- 기존 시안 (v2.2) 과 다른 패턴 도입 시
- 신규 라우트 / 페이지 추가 필요 시

PM 답변 받기 전에 작업 진행 X.

---

## 10. 출처 / 검증

이 가이드의 모든 룰은 다음 자료에서 추출:

- `Dev/design/user-design-decisions-2026-04-30.md` (사용자 직접 결정 8 영역 + 회귀 방지)
- `Dev/design/DESIGN.md` (시안 시스템 명세)
- `Dev/design/BDR v2.2/components.jsx` (AppNav 현재 코드)
- `CLAUDE.md` (프로젝트 룰 + 보안 / 코딩 컨벤션)

→ 의뢰 진행 중 의문 있으면 위 출처 직접 확인.

---

## 부록 — 빠른 참조

### 자주 쓰는 색상 토큰
```css
var(--accent)        /* BDR Red #E31B23 */
var(--cafe-blue)     /* BDR Navy #1B3C87 */
var(--bg)            /* 페이지 배경 */
var(--bg-alt)        /* 카드 배경 */
var(--bg-card)       /* 카드 (강조) */
var(--ink)           /* 본문 텍스트 */
var(--ink-soft)      /* 보조 텍스트 */
var(--ink-mute)      /* 약한 텍스트 */
var(--ink-dim)       /* 비활성 */
var(--border)        /* 테두리 */
var(--ok)            /* 성공 #16a34a */
var(--err)           /* 에러 #dc2626 */
var(--ff-display)    /* 영문 헤딩 폰트 */
```

### 자주 쓰는 클래스
```
.page                /* 페이지 셸 */
.page--wide          /* 넓은 페이지 (max-width 1440) */
.card                /* 카드 (라운딩 8px / 그림자 / 테두리) */
.btn                 /* 버튼 표준 */
.btn--primary        /* 강조 버튼 (BDR Red) */
.btn--accent         /* 보조 버튼 (BDR Navy) */
.btn--sm / --xl      /* 크기 변형 */
.eyebrow             /* 섹션 위 작은 라벨 */
.badge               /* 뱃지 */
.badge--ok / --warn / --soft / --red
.with-aside          /* 좌 사이드바 + 우 본문 2열 grid */
.aside               /* 사이드바 본체 */
```

### 자주 쓰는 모바일 분기
```css
@media (max-width: 720px) {
  /* 모바일 표준 */
}
@media (max-width: 1024px) {
  /* 태블릿 + 모바일 */
}
```
