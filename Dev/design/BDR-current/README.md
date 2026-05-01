# BDR v2.3 — Phase 13 마이페이지 hub

> v2.2 → v2.3 작업 요약. /profile 통합 허브 + 16+ 페이지 단일 진입점.

## 1. 빌드 결과 요약 (v2.3)

### Phase 13 — 마이페이지 hub (옵션 B 채택)
- 신규 라우트 0 (메인 탭 9개 변경 0 — 사용자 결정 §1-4 보존)
- AppNav frozen — 03 코드 카피만, 페이지 별도 nav 추가 없음
- /users/[id] (타인 프로필) 와 분리: 본인 = 허브, 타인 = 단순

### 3단계 위계 카드 구조

**Tier 1 큰 카드 4종 (헤로):**
- 🏀 프로필 (편집 / Phase 12 본인인증 ✓ 뱃지) → /profile/edit
- 🏀 내 농구 (시즌 스탯 4-stat 그리드) → /profile/basketball
- 📈 내 성장 (12주 sparkline) → /profile/growth
- ⚡ 내 활동 (12주 막대) → /profile/activity

**Tier 2 중간 카드 4종:**
- 📅 예약 이력 / 📰 주간 리포트 NEW / 🔔 알림 N건 뱃지 / 🏆 배지·업적

**Tier 3 작은 카드 2종:**
- ⚙ 설정 / 💳 결제·멤버십

**보조 정보 (사이드 / 모바일 stack):**
- D-N 다음 경기 / 소속 팀 / 최근 활동 5건 / 도움말

### 진입점 3중 보장
1. 헤더 utility — 닉네임 + "마이페이지" 링크
2. 더보기 "계정·도움" 그룹 첫 항목 🏠 마이페이지
3. /profile 직접 (mypage 라우트, URL 직진입)

### 명칭 통일
- 헤더 dropdown / h1 / 더보기 = **"마이페이지"**
- "프로필" 단어는 /profile/edit 한정

## 2. 모바일 최적화

| 영역 | 변경 |
|---|---|
| 헤로 | edge-to-edge 풀블리드, suffix(" 의 농구") 숨김, 아바타 56px |
| Tier 1 | 2x2 그리드, 통계 그리드도 자동 2x2, 시각화 44px 축소 |
| Tier 2/3 | 1열 row 리스트 (56px 터치 타겟) |
| 사이드 | 본문 아래 stack 배치, 라운드 10/0 듀얼 |
| safe-area | `env(safe-area-inset-bottom)` 패딩 |
| 가로 스크롤 차단 | mobile에서 `html, body { overflow-x: hidden }` |
| 380px 이하 | 아바타 50px, sub-text 숨김, padding 추가 축소 |

## 3. 폴더 구조

```
BDR v2.3/
├── MyBDR.html                ← 라우터 (mypage 라우트 추가)
├── _mobile_audit.html        ← "v2.3 마이페이지 허브" 그룹 11개 추가
├── README.md                 ← 본 파일
├── components.jsx            ← 더보기 + 헤더 utility 진입점 추가
├── mypage.css                ← 신규: 마이페이지 전용 스타일 (light/dark)
├── tokens.css / responsive.css
└── screens/
    ├── MyPage.jsx            ← 신규
    └── (v2.2 기존 페이지 80+)
```

## 4. 변경 파일

- `screens/MyPage.jsx` (신규)
- `mypage.css` (신규)
- `MyBDR.html` (mypage 라우트 case + mypage.css 링크 + MyPage.jsx 임포트)
- `components.jsx` (더보기 "계정·도움" 첫 항목 🏠 마이페이지 / 헤더 utility "마이페이지" 링크)
- `_mobile_audit.html` ("v2.3 마이페이지 허브" 그룹 추가)

## 5. 06-self-checklist 통과

- §1 AppNav (frozen — 변경 0) ✅
- §2 더보기 IA (룰 8~9 보존, "계정·도움" 그룹 +1) ✅
- §3 토큰 (var(--bg-card) / var(--border) / var(--accent) / var(--sh-md) 사용) ✅
- §4 카피 ("마이페이지" 통일, "프로필" = edit 한정) ✅
- §5 모바일 (≤720 2x2 / 1열 row / 가로 스크롤 0) ✅
- §6 연결성 (3중 진입점 / 모든 카드 setRoute 연결 / 색인 16+5) ✅

## 6. v2.2 자산 보존

v2.3 폴더는 v2.2 의 **카피 + 추가/변경**. 기존 80+ 페이지는 모두 보존,
변경된 파일은 위 §4 4종만. v2.2 폴더는 별도 위치에 그대로 보존.

## 7. Phase 12 본인인증 fallback

```jsx
name_verified: (true ?? false)  // 운영 DB 컬럼 적용 전 안전 fallback
```

true → ✓ + `badge--ok` "본인인증" / false → "미인증" + `badge--warn`

## 8. 다음 단계 후보

- (선택) Refund.jsx /refund — KG이니시스 가맹점 심사 요건 환불 정책 페이지
- /profile/basketball 신설 (현재 stats로 라우팅)
- 알림 카드 N건 실시간 sync (현재 더미 3)
- 주간 리포트 카드 NEW 뱃지 자동 만료 로직
