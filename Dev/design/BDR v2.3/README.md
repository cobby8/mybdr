# BDR v2.3 — 마이페이지 통합 + 시안 정리 (2026-05-01)

> **이전 버전**: BDR v2.2 (2026-04-30)
> **상태**: 사용자 직접 디자인 (Claude.ai Project) → CLI 박제 진행

---

## 1. 변경 요약 (v2.2 → v2.3)

### 핵심: 마이페이지 통합

사용자 결정 (2026-05-01): "mybdr 은 마이페이지가 매우 중요. 프로필 / 개인정보 / 농구정보 등이 통합되는 게 정상".

→ Profile.jsx 가 hub 역할로 재구성. 4 sub 시안 흡수 + 시안 자체 단순화.

### 제거된 시안 11건

| 파일 | 상태 |
|------|------|
| ProfileBookings.jsx | Profile.jsx hub 의 "다가오는 일정" + 별도 깊은 페이지(/profile/bookings) 유지 |
| ProfileComplete.jsx | Profile.jsx 의 "프로필 편집" 진입 + 별도 페이지 유지 |
| ProfileCompletePreferences.jsx | Settings.jsx 통합 |
| ProfileGrowth.jsx | Profile.jsx 의 "시즌 스탯" 흡수 + 별도 깊은 페이지 유지 |
| ProfileWeeklyReport.jsx | Profile.jsx 의 "최근 활동" 흡수 + 별도 페이지 유지 |
| RefereeInfo.jsx | More 메뉴 또는 별도 작업 큐 |
| VenueDetail.jsx | CourtDetail.jsx 통합 |
| GameEdit.jsx | GameDetail.jsx 통합 |
| PostEdit.jsx | PostDetail.jsx 통합 |
| HelpGlossary.jsx | Help.jsx 통합 |
| LiveResult.jsx | Live.jsx 통합 |

### 변경된 시안 (61건 미세 축소 — 평균 3~5%)

주요 영역:
- Profile.jsx (7830 → 7705B) — 마이페이지 hub
- EditProfile.jsx (12924 → 12689B)
- Settings.jsx (11949 → 11764B)
- Billing.jsx (5979 → 5897B)
- MyActivity.jsx (7185 → 7069B)

### 루트 파일 변경

- components.jsx (21199 → 20640B) — AppNav frozen 동일 + 일부 컴포넌트 정리
- responsive.css (35677 → 32339B) — 큰 폭 축소
- tokens.css (27204 → 26456B)
- data.jsx / extras-data.jsx — 미세

---

## 2. 폴더 정리 (v2.3 받은 직후)

| 작업 | 상태 |
|------|------|
| 중첩 `Dev/design/BDR v2.2 + v2.3/` 제거 (zip 풀이 오류) | ✅ 2.4MB 정리 |
| `v1/` (초기 프로토타입) | 보존 (참고용) |
| `uploads/` (사용자 임시 이미지 4장) | 보존 |
| `ref/` (참고 자료 — 로고 PNG, 스케치 HTML) | 보존 |

---

## 3. 박제 우선순위

| 등급 | 영역 | 시간 |
|------|------|------|
| **P0** | `/profile` 본문 재구성 (Profile.jsx 박제) — 마이페이지 hub | 2h |
| **P1** | `/profile/edit` (EditProfile.jsx 변경) | 1h |
| **P1** | `/profile/settings` (Settings.jsx + 가입 위저드 흡수) | 1.5h |
| **P1** | `/profile/billing` (Billing.jsx 변경) | 1h |
| **P1** | `/profile/activity` (MyActivity.jsx 변경) | 1h |
| **P2** | 다른 변경 시안 (61건 - 위 5건) 미세 동기화 | 후속 큐 |

---

## 4. 박제 룰 (CLAUDE.md `00-master-guide.md` 13 룰)

| 룰 | 적용 |
|----|------|
| AppNav frozen (1~6) | components.jsx 카피 사용 — 재구성 금지 |
| 더보기 5그룹 IA (7~8) | 가짜링크 4건 제외 보존 |
| 카피 (9) | "전국 농구 매칭 플랫폼" |
| 토큰 (10) | var(--*) 토큰만 — 핑크/살몬/코랄 금지 |
| 아이콘 (11) | Material Symbols Outlined |
| 라운딩 (12) | 4px (pill 9999px 금지) |
| 모바일 (13) | 720px 분기 / iOS input 16px / 버튼 44px |

---

## 5. 보존 (박제 시 절대 변경 X)

- `/profile` 라우트 + 9 서브페이지 라우트
- `getWebSession` + `Promise.all` 7쿼리 병렬
- `/api/web/me` + `/api/web/profile` 응답 형식
- snake_case 응답 직렬화

→ UI 만 v2.3 톤 적용. API/data fetch 0 변경.
