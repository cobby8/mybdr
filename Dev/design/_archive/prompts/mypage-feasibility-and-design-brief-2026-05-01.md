# 마이페이지 도입 타당성 + 디자인 의뢰서 — 2026-05-01 (v2 통합)

> **상태**: active (PM 결정 + 클로드 디자인 의뢰)
> **작성**: 사용자 보고 — "마이페이지가 없음. MyBDR 핵심인데 프로필/개인정보/농구정보 통합 필요"
> **선행 자료**: 사용자 보고 캡처 4장 (데스크톱 /profile + 모바일 /profile + 더보기 햄버거 2장)
> **분석**: Cowork (이 보고서) + CLI 통합 결과. 두 분석 합의 + 보완 내용 모두 반영.
> **갱신**: v1 (Cowork 단독) → **v2 (CLI 통합)** — §3-3 3단계 위계 + §부록 D 비교 추가

---

## 0. TL;DR

> ✅ **타당성 평가: 매우 타당**.
> /profile/* 16 페이지가 **단일 입구 없이 흩어져** 있고, 모바일에서 좌측 사이드바 부재로 **본인 영역 발견성 치명적**.
> **권장**: 옵션 B (`/profile` 자체를 마이페이지 허브로 확장). 라우트 변경 0 + 사용자 결정 §1-4 보존 + 모바일 발견성 ↑.
> **클로드 디자인 의뢰서**: §6 자체완결 형태 — 그대로 복사해서 디자인 세션에 던지면 됨.

---

## 1. 현재 상태 진단 (사용자 캡처 4장 분석)

### 1-1. 캡처 1 — 데스크톱 `/profile`

| 영역 | 내용 |
|------|------|
| 좌측 사이드바 | 4 그룹 / 9 항목 (개인정보 / 활동 / 농구 / 설정·결제) |
| 메인 헤더 | 아바타 B + BDR_Admin master + L.1 + PRO 멤버 + 프로필 편집 + 알림 확인 |
| 메인 본문 | 시즌 스탯 6열 + 다가오는 일정 + 최근 활동 |

→ **데스크톱은 사이드바 + 본인 데이터 충분**. 단 마이페이지 입구는 헤더 우측 닉네임 클릭이 유일.

### 1-2. 캡처 2 — 모바일 `/profile`

| 영역 | 내용 |
|------|------|
| 헤더 | 햄버거 / 검색 / 알림 / 다크 토글 |
| 메인 | "← 뒤로" + HeroCard (아바타 + 닉네임 + 포지션 + L.1 + PRO + 프로필 편집 + 알림 확인 + 자기소개) |
| 좌측 사이드바 | **❌ 사라짐** (lg:hidden 처리) |

→ **치명적**: 모바일 사용자가 /profile 진입해도 본인 영역 9 항목 (예약 이력 / 주간 리포트 / 내 성장 / 설정 등) **전부 접근 불가**.

### 1-3. 캡처 3 + 4 — 모바일 더보기 햄버거 패널 (5 그룹 30+ 항목)

```
내 활동 (7): 내 신청 내역 / 내 일정 / 보관함 / 쪽지 / 업적·배지 / 스탯 분석 / 글 작성
경기·대회 (~5): 라이브 중계 / 경기 등록 / ...
등록·예약 (5): 코트 제보 / 팀 등록 / 팀 관리 / ...
둘러보기 (~7): 심판 센터 안내 / 검색 결과 / 코치·트레이너 / 리뷰 / 수상 아카이브 / 갤러리 / ...
계정·도움 (~5): 프로필 편집 / 알림 설정 / ...
```

→ 본인 메뉴 (예약 이력 / 주간 리포트 / 내 성장 / 결제 내역 / 본인인증) 의 **절반이 더보기에도 없음**. 사용자가 발견 못 함.

### 1-4. /profile/* 16 페이지 현황

```
/profile                         (대시보드)
/profile/edit                    (프로필 편집)
/profile/settings                (6 섹션: 계정/프로필/알림/개인정보/결제/계정관리)
/profile/activity                (내 활동)
/profile/bookings                (예약 이력)
/profile/billing                 (결제 내역)
/profile/achievements            (업적·배지)
/profile/growth                  (성장 추이)
/profile/weekly-report           (주간 리포트)
/profile/complete                (프로필 완성)
/profile/complete/preferences    (취향)
/profile/notification-settings   (알림 설정)
/profile/payments                (결제)
/profile/preferences             (선호)
/profile/subscription            (멤버십)
/profile/basketball              (농구)
```

→ **16 페이지인데 통합 입구가 없어** 사용자가 발견 / 탐색 어려움.

---

## 2. 타당성 평가 — **매우 타당 ✅**

### 2-1. 한국 사용자 패턴

네이버 / 다음 / 카카오 / 쿠팡 / 무신사 / 토스 — 모두 **"마이"** 또는 **"My"** 단일 진입점. 사용자가 **"내 정보 어디 있지?"** 라고 검색하면 헤더 우측 또는 하단 탭의 "마이" → 모든 본인 영역.

### 2-2. BDR 핵심 가치 = 본인 농구 트래킹

다른 농구 매칭 서비스 대비 BDR 의 차별점:

| 본인 데이터 | 페이지 |
|---|---|
| 시즌 스탯 (PPG/APG/RPG/레이팅) | /profile (메인) |
| 12주 성장 추이 | /profile/growth |
| 업적·배지 | /profile/achievements |
| 예약·신청 이력 | /profile/bookings |
| 주간 리포트 | /profile/weekly-report |
| 본인인증 (Phase 12) | /profile/edit + 설정 |

→ **본인 농구 데이터가 BDR 의 메인 컨텐츠**인데 흩어져 있음 = 차별 가치 발견성 저하.

### 2-3. 모바일 사용자 영향 — 매우 큼

스크린샷 캡처에서 보이듯 모바일 /profile 진입 → 사이드바 부재 → **다른 본인 메뉴 접근 0**.
대회 시작 사용자 다수 모바일 → 마이페이지 부재 = 핵심 기능 사용성 저하.

### 2-4. /profile 의 정체성 혼란 해소

현재 /profile = 본인 대시보드 (HeroCard + 시즌 스탯 + 다가오는 일정 + 최근 활동 + 소속 팀 + 활동 뱃지). 동시에 타인 프로필은 /users/[id] 로 분리. → **/profile 이 "마이페이지 허브" 역할 하기에 자연스러움**.

---

## 3. 3 옵션 비교 + 권장 — **옵션 B**

| 옵션 | 내용 | 신규 라우트 | 사용자 결정 충돌 | 모바일 친화 | 박제 견적 |
|---|---|---|---|---|---|
| **A** | `/my` 또는 `/me` 신규 라우트 + 5 영역 카드 그리드 | ✅ 1 신규 | 없음 | ✅ | 4h |
| **B** ⭐ | **`/profile` 자체를 마이페이지 허브로 확장** | ❌ 0 | 없음 | ✅ | **2.5h** |
| C | AppNav 메인 탭에 "마이" 추가 | ❌ 0 | ⚠️ §1-4 위반 | ✅ | 1h + PM 결정 |

### 옵션 B 권장 이유

1. **라우트 추가 0** — 헤더 우측 닉네임 클릭 → /profile = 현재와 동일 (사용자 멘탈모델 유지)
2. **사용자 결정 §1-4 (메인 탭 9개 — 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기) 보존**
3. **모바일 좌측 사이드바 부재 문제 해소** — /profile 페이지 자체에 5 영역 카드 그리드 노출 (모바일에서도 접근 가능)
4. **/profile/* 16 페이지의 단일 입구** = 발견성 ↑
5. **/users/[id] (타인 프로필) 와 명확 분리** — 본인은 마이페이지 허브, 타인은 단순 프로필
6. **박제 견적 가장 짧음** — 신규 컴포넌트 1 + 기존 /profile 페이지에 섹션 추가

### 옵션 B 의 단점 + 보완

- 단점 1: /profile 이 "대시보드" + "허브" 두 역할 동시 → 메인 영역이 길어짐
  - 보완: 5 영역 카드 그리드를 본문 **하단**에 배치 (스크롤 시점에 노출)

- 단점 2: 헤더 우측 닉네임 클릭 외에 마이페이지 진입 인지도 낮음
  - 보완: 더보기 5그룹 IA 의 "계정·도움" 그룹에 **"마이페이지"** 항목 추가 (사용자 결정 §2-3 의 신규 8 진입점 정책과 동일 패턴)

---

## 4. 마이페이지 IA (CLI 통합 — **3단계 위계**)

`/profile/*` 16 페이지를 **사용자 우선순위에 따라 3 단계로 위계화**한 IA. CLI 분석에서 도입된 패턴 (Cowork v1 의 동일 크기 5 카드보다 자연스러움).

### 4-1. 1순위 — 큰 카드 4종 (헤로 카드)

가장 자주 사용되는 핵심 영역. 큰 카드로 시각 비중 ↑.

```
🏀 프로필 (개인정보 편집)            → /profile/edit
   • 이름/닉네임/포지션/사진/자기소개
   • 본인인증 ✓ (Phase 12 활성화 후 뱃지)

🏀 내 농구 (게임 기록 + 통계)         → /profile/basketball 또는 /stats
   • 시즌 스탯 (PPG/APG/RPG/레이팅)
   • 경기 기록 / 박스스코어
   • 슛존 분석 (Phase 12 운영 적용 후)

📈 내 성장 (시즌 통계 추이)          → /profile/growth
   • 12주 spark line
   • 마일스톤 / 시즌 MVP 횟수
   • 다음 목표 카운트다운

⚡ 내 활동 (활동 타임라인)           → /profile/activity
   • 최근 30 활동 (경기/게시글/팀/대회)
   • 카테고리 필터
```

### 4-2. 2순위 — 중간 카드 4종

```
📅 예약 이력 (코트/대회)            → /profile/bookings
📰 주간 리포트                      → /profile/weekly-report
🔔 알림 (미확인 N건)                → /notifications
🏆 배지·업적                        → /profile/achievements
```

### 4-3. 3순위 — 작은 카드 2종

```
⚙️ 설정 (계정/알림/개인정보/공개)    → /profile/settings
💳 결제·멤버십                      → /profile/settings?section=billing
```

### 4-4. 보조 정보 (사이드 영역)

```
🏃 다음 경기 (D-N 카운트다운)
👥 소속 팀
📜 최근 활동 5건
```

### 4-5. 외부 진입점 통합 (CLI 보완)

| 외부 페이지 | 진입 카드 |
|---|---|
| `/games/my-games` | 활동 카드 또는 별도 |
| `/community/new` (글 작성) | 활동 카드 |
| `/safety` (안전·차단) | 설정 카드 |
| `/stats` (통계 분석) | 내 농구 카드 |
| `/refund` (환불 정책) | 결제 카드 |

> **3단계 위계 / 약 20 항목** — 모든 /profile/* 16 페이지 + 외부 진입점 5개 통합.

### 4-2. 카드 디자인 명세

각 영역 카드 (5개):
```
┌────────────────────────────┐
│ 👤 프로필                   │  ← 큰 이모지 + 그룹 제목 (h3, 18px, 800)
│                            │
│ • 프로필 편집               │  ← 4 항목 리스트 (text-sm, ink-mute)
│ • 자기소개                  │
│ • 사진                     │
│ • 본인인증 [✓]              │  ← Phase 12 활성화 후 ✓ 뱃지 (badge--ok)
│                            │
│ 전체 보기 →                 │  ← 카드 클릭 가능 영역 전체
└────────────────────────────┘
```

### 4-3. 그리드 레이아웃

```
데스크톱 (lg+, 1024px+):
┌──────┬──────┬──────┐
│ 👤   │ 🏀   │ 📊   │  ← 3-2 grid (3 위 + 2 아래)
└──────┴──────┴──────┘
┌──────┬──────┐
│ ⚙️   │ 💳   │
└──────┴──────┘

모바일 (≤720px):
┌──────────┐
│ 👤       │   ← 1열 stack 또는 2열 grid
└──────────┘
┌──────────┐
│ 🏀       │
└──────────┘
... (1열 5 카드)

또는 모바일 2열:
┌─────┬─────┐
│ 👤  │ 🏀  │
├─────┼─────┤
│ 📊  │ ⚙️  │
├─────┼─────┤
│ 💳  │     │
└─────┴─────┘
```

→ 카드 그리드는 v2.1 매처 (`repeat(3, 1fr)` → 모바일 2열) 자동 적용 ✅.

---

## 5. 박제 작업 견적 (시안 도착 후)

### 5-1. 컴포넌트 + 데이터

| 작업 | 시간 |
|---|---|
| `MyPageHubData` 상수 (5 영역 / 20 항목 / 라벨 / 이모지 / href) | 30분 |
| `MyPageHubCard` 컴포넌트 (`profile/_v2/mypage-hub-card.tsx`) | 1h |
| `MyPageHub` 그리드 컴포넌트 (`profile/_v2/mypage-hub.tsx`) | 30분 |
| `/profile/page.tsx` 메인 영역 하단에 `<MyPageHub />` 삽입 | 15분 |
| 모바일 시각 검증 + 카드 클릭 라우팅 검증 | 30분 |
| 더보기 메뉴 "계정·도움" 그룹에 "마이페이지" 추가 (`more-groups.ts`) | 15분 |
| **총** | **3h / 1 작업일** |

### 5-2. 파일 변경 예상

```
src/app/(web)/profile/_v2/mypage-hub.tsx         (신규 — 그리드 컨테이너)
src/app/(web)/profile/_v2/mypage-hub-card.tsx    (신규 — 카드)
src/app/(web)/profile/_v2/mypage-hub-data.ts     (신규 — 데이터)
src/app/(web)/profile/page.tsx                   (수정 — 메인 하단에 <MyPageHub /> 추가)
src/components/bdr-v2/more-groups.ts             (수정 — 마이페이지 1 항목 추가)
```

### 5-3. 사용자 결정 §2 보존 룰 적용

- §1-4 메인 탭 9개 — **변경 0**
- §1-1 글로벌 헤더 — **변경 0**
- §2 더보기 5그룹 — **그룹 구조 보존**, "계정·도움" 에 1 항목 추가 (이미 8 진입점 추가 패턴과 동일)
- §4-1 ProfileSideNav 모바일 nav 제거 — **유지** (모바일은 5 영역 카드 그리드가 nav 역할 대체)
- §4-2 settings 이모지 아이콘 — **유지**

---

## 6. ⭐ 클로드 디자인 의뢰서 (자체완결)

> 아래 § "의뢰서 (복사 시작)" ~ § "의뢰서 (복사 끝)" 통째로 복사해서 클로드 디자인에 붙여넣기.

---

## 의뢰서 (복사 시작)

# BDR 마이페이지 허브 (`/profile`) 디자인 의뢰 — Phase 13 (BDR v2.3)

너는 BDR(MyBDR — 농구 매칭 플랫폼)의 시니어 프로덕트 디자이너다. 이번 작업은 **마이페이지 허브** 시안 신규 1건 + 기존 Profile.jsx 갱신.

## 1. 컨텍스트

### 1-1. 사용자 보고 (이번 의뢰의 핵심)

> "마이페이지가 지금 없어. MyBDR 은 마이페이지가 매우 중요한 프로그램인데 마이페이지 내부에 프로필, 개인정보, 농구정보 등이 포함되는게 정상."

→ 모바일 /profile 진입 시 좌측 사이드바 부재로 본인 메뉴 16+ 페이지 접근 불가. 한국 사용자 패턴 (네이버/다음/카카오) 의 "마이" 단일 진입점 부재.

### 1-2. 채택 옵션 — **옵션 B (`/profile` 허브 재설계)**

- **신규 라우트 0** — `/profile` 그대로 사용
- **메인 탭 9개 변경 0** — 사용자 결정 §1-4 보존
- **/users/[id]** (타인 프로필) 와 분리 — 본인 = 허브, 타인 = 단순 프로필

### 1-3. 시안 폴더

산출물 위치: **`Dev/design/BDR v2.3/screens/Profile.jsx`** (BDR v2.2 카피 + 마이페이지 허브 섹션 추가)

또는 **별도 `MyPage.jsx` 신규** (선호 시 — 단 라우트 매핑은 /profile 그대로).

## 2. 사용자 결정 (절대 보존)

출처: `Dev/design/user-design-decisions-2026-04-30.md`

- **§1-4 메인 탭 9개**: 홈 / 경기 / 대회 / 단체 / 팀 / 코트 / 랭킹 / 커뮤니티 / 더보기 — 변경 금지
- **§1-1 글로벌 헤더 단일화** (AppNav) — 페이지 별도 nav 추가 금지
- **§2 더보기 5그룹 IA** — 가짜링크 4건 (gameResult/gameReport/guestApps/referee) 추가 금지. **마이페이지 1 항목은 "계정·도움" 그룹에 추가 권장** (또는 별도 위치 PM 결정)
- **§4-1 ProfileSideNav 모바일 nav 제거** — 마이페이지 5 영역 카드 그리드가 모바일 nav 역할 대체
- **§4-2 settings 이모지 아이콘** (👤🏀🔔🔒💳⚠️) — 사용
- **§5-2 글로벌 카피** — "전국 농구 매칭 플랫폼"
- **모바일 720px** + iOS input 16px + 버튼 44px

## 3. 디자인 명세

### 3-1. /profile 페이지 전체 레이아웃

```
┌────────────────────────────────────────────────┐
│ AppNav (글로벌, 변경 0)                         │
├────────────────────────────────────────────────┤
│   [PageBackButton]  ← 모바일만 (lg:hidden)     │
│                                                │
│   ┌──────────┐    ┌────────────────────────┐  │
│   │ HeroCard │    │ 시즌 스탯 6 (기존)      │  │
│   │ (기존)   │    │                        │  │
│   │          │    │ 다가오는 일정 (기존)    │  │
│   │ 320 sticky│   │                        │  │
│   │  aside   │    │ 최근 활동 (기존)        │  │
│   │          │    └────────────────────────┘  │
│   │ 소속 팀   │                                 │
│   │ 활동 뱃지 │    ┌────────────────────────┐  │
│   └──────────┘    │ ⭐ 마이페이지 허브 (NEW) │  │
│                   │  5 영역 카드 그리드     │  │
│                   └────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### 3-2. ⭐ 마이페이지 허브 섹션 (이번 의뢰의 핵심)

- **위치**: /profile 의 main 영역 (우측) 하단. 시즌 스탯 + 다가오는 일정 + 최근 활동 다음.
- **eyebrow**: `MY PAGE · 마이페이지`
- **h2**: `내 활동을 한곳에서`
- **서브 카피**: `프로필 / 농구 / 활동 / 설정 / 결제를 빠르게 관리하세요.`

### 3-3. 카드 위계 — **3단계** (CLI 통합)

#### Tier 1 — 1순위 큰 카드 4종 (헤로)

```
🏀 프로필           → /profile/edit
   • 이름/닉네임/포지션
   • 사진 / 자기소개
   • 본인인증 ✓ (Phase 12 후 badge--ok)

🏀 내 농구          → /profile/basketball 또는 /stats
   • 시즌 스탯 (PPG/APG/RPG/레이팅)
   • 경기 기록
   • 슛존 분석 (Phase 12 운영 후)

📈 내 성장          → /profile/growth
   • 12주 spark
   • 마일스톤 / MVP 횟수
   • 다음 목표

⚡ 내 활동          → /profile/activity
   • 최근 30 활동
   • 카테고리 필터
```

#### Tier 2 — 2순위 중간 카드 4종

```
📅 예약 이력         → /profile/bookings
📰 주간 리포트       → /profile/weekly-report
🔔 알림 (N건)        → /notifications  (미확인 카운트 뱃지 표시)
🏆 배지·업적         → /profile/achievements
```

#### Tier 3 — 3순위 작은 카드 2종

```
⚙️ 설정              → /profile/settings
💳 결제·멤버십       → /profile/settings?section=billing
```

#### 보조 정보 (사이드 영역, 모바일 stack)

```
🏃 다음 경기 (D-N 카운트다운)
👥 소속 팀
📜 최근 활동 5건
```

### 3-4. 그리드 레이아웃

#### 데스크톱 (lg+, 1024px+)

```
┌───────────────────────────────────────┐
│ Tier 1 — 큰 카드 4종 (2x2 또는 1x4)    │
│ ┌───────┬───────┬───────┬───────┐     │
│ │ 프로필 │내 농구 │내 성장 │내 활동 │     │
│ └───────┴───────┴───────┴───────┘     │
├───────────────────────────────────────┤
│ Tier 2 — 중간 카드 4종 (4 column)      │
│ ┌────┬────┬────┬────┐                 │
│ │예약│리포트│알림│배지 │                 │
│ └────┴────┴────┴────┘                 │
├───────────────────────────────────────┤
│ Tier 3 — 작은 카드 2종                 │
│ ┌─────────┬─────────┐                 │
│ │ 설정    │ 결제    │                  │
│ └─────────┴─────────┘                 │
└───────────────────────────────────────┘
```

#### 모바일 (≤720px)

```
Tier 1: 1열 또는 2열 grid (2x2)
Tier 2: 2열 grid
Tier 3: 2열 grid
보조 정보: 1열 stack
```

### 3-5. 카드 시각 명세 (CSS 가이드)

```css
.mypage-hub {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Tier 1 — 큰 카드 */
.mypage-hub__tier-1 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.mypage-hub__card--lg {
  padding: 22px 24px;
  min-height: 140px;
}

/* Tier 2 — 중간 카드 */
.mypage-hub__tier-2 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.mypage-hub__card--md {
  padding: 16px 18px;
  min-height: 96px;
}

/* Tier 3 — 작은 카드 */
.mypage-hub__tier-3 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.mypage-hub__card--sm {
  padding: 14px 16px;
  min-height: 72px;
}

/* 모바일 — 720px 이하 */
@media (max-width: 720px) {
  .mypage-hub__tier-1 { grid-template-columns: repeat(2, 1fr); }
  .mypage-hub__tier-2 { grid-template-columns: repeat(2, 1fr); }
  /* tier-3 는 그대로 2열 */
}

/* 카드 공통 스타일 */
.mypage-hub__card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;             /* 카드 표준 (사용자 결정) */
  transition: all 0.15s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.mypage-hub__card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--sh-lift);
}
.mypage-hub__card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.mypage-hub__card__icon { font-size: 24px; }
.mypage-hub__card h3 {
  font-size: 16px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.01em;
}
.mypage-hub__card__items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mypage-hub__card__items li {
  font-size: 13px;
  color: var(--ink-mute);
}

/* 알림 카드 — N건 뱃지 */
.mypage-hub__card__badge {
  background: var(--accent);
  color: #fff;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  margin-left: auto;
}
```

### 3-6. Phase 12 본인인증 뱃지

운영 DB Phase 12 SQL 적용 후 `name_verified` 활성화 시:
- Card 1 의 "본인인증" 뱃지: ✓ + `badge--ok`
- 미인증 시: "인증하기" 텍스트 + `badge--warn`

```jsx
{user.name_verified ? (
  <li>본인인증 <span className="badge badge--ok">✓</span></li>
) : (
  <li>본인인증 <span className="badge badge--warn">미인증</span></li>
)}
```

### 3-7. 마이페이지 진입점 3중 보장 (CLI 통합)

#### 진입점 1 — 헤더 user dropdown (가장 자연스러운 입구)

`src/components/bdr-v2/app-nav.tsx` 또는 user dropdown 컴포넌트:

```typescript
// 사용자 닉네임 / 아바타 클릭 시 dropdown 의 첫 항목
<DropdownItem href="/profile" icon="🏠">
  마이페이지
</DropdownItem>
<DropdownItem href="/profile/edit" icon="👤">
  프로필 편집
</DropdownItem>
<DropdownItem href="/profile/settings" icon="⚙️">
  설정
</DropdownItem>
<DropdownItem onClick={logout} icon="🚪">
  로그아웃
</DropdownItem>
```

#### 진입점 2 — 더보기 메뉴 "계정·도움" 그룹

`src/components/bdr-v2/more-groups.ts`:

```typescript
{ id: "mypage", label: "마이페이지", icon: "🏠", href: "/profile" },
```

#### 진입점 3 — /profile 페이지 자체

URL 직진입 (외부 링크 / SEO / 북마크) 시 마이페이지 hub 노출.

### 3-8. 명칭 통일 (CLI 보완)

| 위치 | AS-IS | TO-BE |
|------|-------|-------|
| 헤더 dropdown | "내 정보" 또는 "프로필" | **"마이페이지"** |
| /profile 페이지 h1 | "프로필" | **"마이페이지"** 또는 사용자 닉네임 (예: "rdm_captain 의 농구") |
| 더보기 메뉴 | (현재 항목 부재) | **"마이페이지"** 신규 추가 |
| 메타 페이지 title | "프로필 | MyBDR" | **"마이페이지 | MyBDR"** |
| "프로필 편집" 라벨 | 그대로 OK | 그대로 (편집 페이지 한정) |

→ **"프로필"** 단어는 **개인정보 편집 페이지** 한정으로만 사용. 통합 hub 는 **"마이페이지"** 또는 영역명 (내 농구 / 내 성장 / 내 활동).

### 3-8. 모바일 변환 (사용자 결정 §6 모바일)

```
모바일 (390px 기준):
1. PageBackButton (← 뒤로)
2. HeroCard (전폭, sticky 해제)
3. 시즌 스탯 (6열 → 3열, G-3 자동)
4. 다가오는 일정 / 최근 활동 (1열)
5. ⭐ 마이페이지 허브 5 카드 (2열 grid)
6. 소속 팀 / 활동 뱃지
```

## 4. 추가 시안 (선택 — 신규 항목)

### 4-1. 환불 정책 페이지 (P1, 가맹점 심사 요건)

```
시안 파일: Dev/design/BDR v2.3/screens/Refund.jsx
라우트: /refund
용도: 통신판매·전자상거래법 + KG이니시스 가맹점 심사 요건
구조:
  - eyebrow: 환불 정책 · REFUND
  - h1: 환불 안내
  - 섹션 1: 대회 참가비 (대회 시작 7일 전 100% / 3일 전 70% / 당일 0%)
  - 섹션 2: BDR+ 멤버십 (결제일 7일 이내 100%)
  - 섹션 3: 환불 신청 방법 (이메일 bdrbasket@gmail.com / 070-4337-3000)
```

### 4-2. /users/[id] 와 /profile 분리 검수 (디자인 변경 0)

이번 작업으로 /profile = 본인 허브, /users/[id] = 타인 단순 프로필 명확 분리. 기존 PlayerProfile.jsx 유지.

## 5. 산출물 체크리스트

- [ ] `Dev/design/BDR v2.3/` 폴더 (BDR v2.2 카피 + 변경 사항)
- [ ] `screens/Profile.jsx` 갱신 또는 `MyPage.jsx` 신규 — **3단계 위계 (Tier 1 큰 4 + Tier 2 중간 4 + Tier 3 작은 2)**
- [ ] 보조 정보 영역 (다음 경기 D-N + 소속 팀 + 최근 활동 5건)
- [ ] 카드별 진입 라우트 매핑 (§4-5 외부 진입점 통합)
- [ ] `components.jsx` 의 moreGroups "계정·도움" 그룹에 "마이페이지" 1 항목 추가
- [ ] 헤더 user dropdown 의 첫 항목 "마이페이지" 명시 (§3-7 진입점 1)
- [ ] 명칭 통일 (§3-8 — "프로필" 단어를 마이페이지 hub 에 사용 X, 편집 페이지만 유지)
- [ ] 알림 카드의 미확인 N건 뱃지 (§3-3 Tier 2)
- [ ] 본인인증 ✓ 뱃지 자리 (Phase 12 활성화 후, §3-6)
- [ ] (선택) `screens/Refund.jsx` 신규 — P1 환불 정책 (KG이니시스 심사 요건)
- [ ] `_mobile_audit.html` "v2.3 마이페이지" 그룹 신규
- [ ] `README.md` v2.2 → v2.3 변경 요약

## 6. 첫 응답 형식

```
✅ BDR 마이페이지 허브 (/profile) 디자인 의뢰 확인 — Phase 13 (BDR v2.3).

이해:
- 옵션 B 채택 (`/profile` 허브 재설계, 신규 라우트 0)
- 3단계 위계: Tier 1 큰 4종 (프로필/내 농구/내 성장/내 활동)
                + Tier 2 중간 4종 (예약/리포트/알림/배지)
                + Tier 3 작은 2종 (설정/결제)
                + 보조 정보 (다음 경기/소속 팀/최근 활동)
- 진입점 3중: 헤더 user dropdown / 더보기 메뉴 / /profile 직접
- 사용자 결정 §1-4, §2, §4-1, §4-2, §6 모두 보존
- 산출물: BDR v2.3/screens/Profile.jsx (또는 MyPage.jsx) + (선택) Refund.jsx

질문 / 가정:
1. (필요 시 PM 결정 항목)
...

작업 시작.
```

---

## 의뢰서 (복사 끝)

---

## 7. 다음 단계

```
[지금]
└─ 위 § "의뢰서" 그대로 클로드 디자인에 던지기

[1-2일 후 — 시안 도착]
└─ Cowork 에서 시안 검토 + CLI 박제 위임 프롬프트 작성

[CLI 박제 — 약 3시간]
├─ MyPageHub 컴포넌트 신규 (1.5h)
├─ /profile/page.tsx 메인 하단 추가 (15분)
├─ more-groups.ts 마이페이지 항목 (15분)
├─ 모바일 시각 검증 (30분)
└─ 1 커밋 → subin → dev → main

[Phase 12 운영 DB 적용 후 (1주)]
└─ "본인인증 ✓" 뱃지 활성화 (services/user.ts L43~48 코멘트 해제)
```

---

## 8. KPI (작업 후)

| 지표 | 현재 | 목표 |
|------|------|------|
| 모바일 /profile 에서 본인 메뉴 접근 가능한 항목 수 | ~6 (HeroCard 액션만) | **20+** (5 영역 × 4 항목) |
| 마이페이지 단일 입구 | ❌ | ✅ |
| /profile/* 16 페이지 발견성 | 분산 | 통합 (5 영역) |
| 더보기 "계정·도움" 그룹 | 5 항목 | 6 항목 (마이페이지 추가) |
| 옵션 B 박제 박제율 영향 | 27% | +1 (Profile A 등급 유지) |

---

## 9. 위험 + 완화

| 위험 | 가능성 | 완화 |
|------|--------|------|
| /profile 메인이 너무 길어짐 | 🟠 중간 | 카드 그리드를 본문 하단에 배치 (스크롤 시점 노출) |
| 모바일 5 카드가 1열 stack 시 너무 길음 | 🟠 중간 | 2열 grid 권장 (G-2 매처 자동) |
| 본인인증 뱃지가 운영 DB 적용 전 깨짐 | 🟡 낮음 | `?? false` fallback 으로 안전 (a2081ba 패턴 동일) |
| /users/[id] 와 시각 혼동 | 🟢 매우 낮음 | /profile 만 허브 카드 그리드, /users 는 단순 프로필 |

---

## 부록 A — 검증된 사실

| 주장 | 근거 |
|------|------|
| /profile/* 16 페이지 흩어짐 | `find src/app/(web)/profile -name "page.tsx"` 16 |
| 모바일 ProfileSideNav 제거됨 | user-design-decisions §4-1 |
| 더보기 5그룹 IA 보존 | user-design-decisions §2 + 캡처 3·4 |
| /users/[id] 분리 존재 | `find src/app/(web)/users` |
| /refund 페이지 부재 | `find src/app/(web)/refund` 0 결과 |
| Phase 12 본인인증 컬럼 (`name_verified`) | scratchpad 2026-04-30 작업 로그 |

## 부록 B — 외부 참조

- 사용자 결정: `Dev/design/user-design-decisions-2026-04-30.md`
- BDR v2.2 시안: `Dev/design/BDR v2.2/`
- Phase 12 계획: `Dev/design/phase-12-plan-2026-04-30.md`
- 회귀 픽스 (a2081ba): `src/lib/services/user.ts` L43~48 TODO 주석
- 사용자 캡처 4장: 데스크톱 /profile + 모바일 /profile + 더보기 햄버거 (2 장)

## 부록 C — CLI 결과 통합 가이드 (이미 통합됨)

✅ **2026-05-01 — CLI 응답 통합 완료**. 이 보고서 v2 가 두 답변 합본.

## 부록 D — Cowork v1 vs CLI 분석 비교

### D-1. 일치점 (양쪽 합의)

| 항목 | Cowork | CLI | 결과 |
|------|--------|-----|------|
| 타당성 | ✅ 매우 타당 | ✅ 매우 타당 | 합의 |
| 권장 옵션 | B (`/profile` 그대로) | B 동일 (라우트/API 보존) | 합의 |
| 라우트 변경 | 0 | 0 | 합의 |
| 사용자 결정 §1-4 메인 탭 9개 보존 | ✅ | ✅ | 합의 |
| 모바일 ProfileSideNav 부재 = 핵심 문제 | ✅ | ✅ | 합의 |
| /api/web/* + getWebSession 보존 | ✅ | ✅ | 합의 |
| 9~16 서브페이지 통합 | ✅ | ✅ | 합의 |

### D-2. CLI 가 더 잘한 점 (Cowork v1 → v2 보완 반영)

| 항목 | CLI 발견 | Cowork v2 반영 |
|---|---|---|
| **3단계 위계 (큰/중간/작은 카드)** | 사용자 우선순위에 따라 카드 크기 차등 | ✅ §3-3 Tier 1/2/3 통합 |
| **알림 카드** (미확인 N건 뱃지) | 영역 안에 통합 | ✅ Tier 2 에 추가 |
| **다음 경기 D-N 카운트다운** | 보조 정보로 추가 | ✅ §3-3 보조 정보 |
| **헤더 user dropdown** "마이페이지" 명시 | 진입점 추가 | ✅ §3-7 추가 권장 |
| **명칭 통일** ("프로필" → "마이페이지" 또는 영역명) | 라벨 정리 | ✅ §6 의뢰서에 명시 |
| **비교 사례** (무신사/카카오T/토스/당근) | 도메인 적합성 강화 근거 | ✅ §2-1 |

### D-3. Cowork 가 더 잘한 점 (CLI 에 없음)

| 항목 | Cowork v2 보완 |
|---|---|
| /users/[id] 와 분리 명시 | 본인 = 허브, 타인 = 단순 — §3 |
| Phase 12 본인인증 뱃지 통합 명시 | 운영 DB 적용 후 활성화 — §3-6 |
| KPI 표 (모바일 진입 가능 항목 수) | §8 |
| 환불 정책 페이지 (P1 보너스 시안) | §4-1 |
| 위험 + 완화 매트릭스 | §9 |

### D-4. v2 통합 결과 — 이번 의뢰서의 강점

1. **사용자 우선순위 위계** (CLI) + **본인/타인 분리** (Cowork) 모두 반영
2. **알림·다음 경기·소속팀** 통합 영역 (CLI) + **Phase 12 본인인증 뱃지** (Cowork) 동시 명시
3. **단순 5 영역** (Cowork v1) → **3단계 10 카드** (v2) — 시각 위계 자연스러움
4. **모바일 발견성**: 카드 그리드 + 헤더 dropdown + 더보기 진입점 3중 보장

→ **클로드 디자인 의뢰서가 더 풍부**해짐. 시안 작업 시 빠지는 영역 거의 없음.

---

## 부록 E — JWT 재발급 (`79b1e73`) main 머지 결정

> CLI 마지막 질문: JWT 재발급(79b1e73) main 머지 — 진행 / 보류?

### E-1. 커밋 분석

```
79b1e73 fix(profile): PATCH 후 JWT 재발급 + Set-Cookie — referee 영역 session.name stale 해소

목적: 사용자 nickname 변경 후 JWT 만료(7일)까지 (referee)/* 영역 3건이 옛 닉네임 유지
변경: src/app/api/web/profile/route.ts PATCH 라우트에 새 JWT 발급 + Set-Cookie 추가
영향:
  - referee 영역 사용자: 닉네임 변경 즉시 갱신 (현재는 7일 stale)
  - 비-referee 사용자: 영향 0 (PATCH 라우트 동일)
  - PATCH 응답에 Set-Cookie 헤더 추가 (httpOnly + sameSite lax)

검증:
  - tsc 0 에러
  - JWT 재발급 실패해도 PATCH 자체 성공 처리 (try/catch 내부 try/catch)
  - updateProfile select 건드리지 않음 (회귀 위험 0)
```

### E-2. 위험 평가

| 위험 | 가능성 | 영향 | 완화 |
|------|--------|------|------|
| Set-Cookie 헤더로 인한 응답 변경 → 프론트 회귀 | 🟢 매우 낮음 | 헤더만 추가, body 영향 0 | 이미 try/catch 보호 |
| referee 영역 외 다른 곳 부수효과 | 🟢 매우 낮음 | nickname !== undefined 분기 | 분기 명확 |
| 운영 사용자가 닉네임 자주 변경 → 부하 | 🟢 매우 낮음 | findUnique 1회 + generateToken 1회 추가 | 미미 |
| 보안 — JWT 재발급으로 옛 토큰이 더 이상 매칭 안 됨 | 🟡 낮음 | 의도된 동작 (사용자 변경 후 즉시 갱신) | 자동 로그인 유지 |

### E-3. 결정 — **진행 권장 ✅**

**이유**:
1. **referee 사용자 즉시 효과** — 닉네임 변경 후 7일 기다림 → 즉시 반영
2. **위험 매우 낮음** — try/catch 보호 + body 영향 0 + 회귀 가능성 거의 0
3. **이미 main 머지됨** — `cat .git/refs/heads/main` 가 79b1e73 동일 (이미 운영에 반영됨)
4. **보류해도 큰 문제 없음** — 7일 자동 갱신이라 critical 아님. 단 main 에 이미 있으면 진행 의미 동일.

### E-4. 검증 권장 (운영 적용 후 1회)

```
1. referee 계정 1명 (테스트):
   - /profile/edit 진입 → 닉네임 변경 → 저장
   - /referee 또는 /referee/profile 진입
   - 헤더 / 본문에 새 닉네임 표시 확인

2. 비-referee 계정 1명:
   - 동일 흐름 → 새 닉네임 정상 표시 (영향 0 검증)

3. Vercel logs / Sentry — 닉네임 변경 시 500 에러 0건 확인 (1시간)
```

→ 검증 통과 시 운영 안정.

### E-5. 추가 고려 — JWT 재발급 패턴 일반화

향후 다른 PATCH 라우트 (이메일 변경 / 권한 변경 / role 변경 등) 에 동일 패턴 적용 권장. 현재는 nickname 외 변경 라우트 0 → 작업 불필요.
