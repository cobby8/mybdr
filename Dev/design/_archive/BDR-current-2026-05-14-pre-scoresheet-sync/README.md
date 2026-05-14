# BDR v2.4 — Phase A.6 변경 요약

> **Phase A.6 — 메인 9개 탭 목록 5 페이지 운영 정합 + AppDrawer PC fix 검수**
> 작업 일자: 2026-05-08
> 베이스: v2.3 카피 + 8 파일 덮어쓰기

---

## 1. 변경 범위

5 페이지 (Games / Match / Team / Court / BoardList) 를 운영 mybdr.kr 의 src 패턴에 정합 — Hero 헤더 grid 1fr auto + 검색 토글 (.app-nav__icon-btn) + FilterChipBar + 미니멀 카드. AppDrawer PC fix 는 검수 결과 정상 (CSS 미적용 stacked list 아님 — drawer 42vw 우측 슬라이드 + 5그룹 박스 모두 정상 렌더).

## 2. 변경 파일 (8 건)

| # | 파일 | 변경 내용 |
|---|------|---------|
| 1 | `screens/Games.jsx` | §1 — area span / 태그 칩 span 에 whiteSpace:nowrap (텍스트 1글자 줄바꿈 fix) |
| 2 | `screens/Match.jsx` | §2 — viewMode 토글 (리스트/월간/주간), 4탭 단순화 (전체/접수중/진행중/종료), 미니멀 D-day 56px 색상 박스 + 단일 행 리스트 (큰 그라디언트 카드 X), h1 ellipsis |
| 3 | `screens/Team.jsx` | §3 — Hero 헤더 grid + 검색 토글 + FilterChipBar (지역/정렬) + 미니멀 카드 (로고 + 팀명 한/영 + 📍지역 + 👥멤버 + R레이팅) |
| 4 | `screens/Court.jsx` | §4 — Hero 헤더 grid + 검색 토글 + 지도 보기 토글 + chip-bar (코트타입/지역) + 카카오맵 placeholder + 미니멀 카드 |
| 5 | `screens/BoardList.jsx` | §5 — BoardHeader 컴포넌트 추가 (eyebrow 카테고리 + h1 게시판명 + 부제) + 검색 토글 + 글쓰기 |
| 6 | `components.jsx` | Icon 객체 4 추가 (filter / list / calendar / week) |
| 7 | `tokens.css` | 다크 모드 .badge font-family `'Pretendard', var(--ff-display)` 변경 (한글 fallback 우선 — Archivo 한글 미지원 깨짐 fix) |
| 8 | `MyBDR.html` | 위 변경 반영 |

## 3. 검수 결과

**§6 AppDrawer PC fix 통과** — 1280x800 viewport 에서 햄버거 클릭 → drawer width 42vw (~538px), backdrop fixed inset:0, 5그룹 박스 (내 활동 / 경기·대회 / 등록·예약 / 둘러보기 / 계정·도움) 정상 렌더. CSS 미적용 stacked list 아님.

**fix 5건 모두 해결 (verifier 재검수 done)**:
1. §2 Match h1 줄바꿈 — wrapper flex:1 1 280px / minWidth:0, h1 nowrap+ellipsis
2. §3 Team 카드 폭 — 그리드 280px → 320px, 한/영 + 지역/멤버 nowrap
3. §3 §4 정렬·지역 라벨 — 부모 flexShrink:0, 라벨 nowrap+flexShrink:0
4. §4 Court HOT 뱃지 — 다크 .badge font-family Pretendard 우선 (한글 fallback)
5. §1 Games area·태그 — span 에 nowrap

**콘솔 에러 0** (Babel warning 만)

## 4. 사용자 결정 §1~§8 보존

- §1 모바일 분기 (720px / iOS 16px / 44px 터치 타겟) — 보존
- §2 다크 모드 brutalism — 보존
- §3 NavBadge dot/count/new/live — 보존
- §4 햄버거 R3 강조 (border 1px accent) — 보존
- §5 더보기 5그룹 IA — 보존
- §6 검색·쪽지·알림 .app-nav__icon-btn — 보존 (Team/Court/BoardList 헤더에서 동일 패턴 재사용)
- §7 ThemeSwitch viewport 분기 — 보존
- §8 TeamDetail hero / TeamManage ForceActionModal — 보존

## 5. AppNav Frozen 7 룰 준수

AppNav 컴포넌트는 frozen — components.jsx 그대로 카피 사용. 본 Phase 에서 변경한 components.jsx 의 유일한 수정은 Icon 객체 추가 4건 (filter / list / calendar / week) 으로, AppNav 7 룰 (9 메인 탭 / utility bar / main bar 우측 5개 / 다크모드 분기 / app-nav__icon-btn / 모바일 닉네임 hidden / 더보기 9번째) 모두 보존됨.

## 6. 13 룰 준수 (uploads/06 self-checklist)

- ✅ §10 색상 — 모든 신규 코드 var(--accent / --cafe-blue / --ok / --bg-alt / --ink-mute) 토큰만 사용. 핑크/살몬/코랄 0건.
- ✅ §11 아이콘 — Icon.* (svg) 또는 시안 검증된 이모지 (📍 👥 📅 🗓️) 만 사용. lucide-react 0건.
- ✅ §12 라운딩 — 카드/버튼 4px (var(--radius-card) = 8px 카드 OK), pill 9999px 0건.
- ✅ §13 모바일 — 720px 분기 보존, iOS input 16px, 버튼 44px 보존.

## 7. PM 후속 (별도 Phase)

운영 mybdr.kr/teams /courts /community 스크린샷 공유 시 fine-tune. 본 Phase 베이스 = 운영 src 패턴 정합 (스크린샷 받기 전 잠정 박제) 이므로 후속에서 정확한 카피·아이콘·정렬 라벨만 조정하면 됨.

---

## 8. 산출물 폴더 구조

```
Dev/design/BDR v2.4/
├── README.md                         (본 파일)
├── tokens.css                        (다크 .badge font-family 변경)
├── components.jsx                    (Icon 4 추가)
├── data.jsx                          (v2.3 그대로)
├── extras-data.jsx                   (v2.3 그대로)
├── community-data.jsx                (v2.3 그대로)
├── responsive.css                    (v2.3 그대로)
├── bottom-nav.css                    (v2.3 그대로)
├── games.css / mypage.css 등         (v2.3 그대로)
├── MyBDR.html                        (5 페이지 변경 반영)
├── _mobile_audit.html                (v2.3 그대로)
└── screens/
    ├── Games.jsx                     (§1 텍스트 폭 fix)
    ├── Match.jsx                     (§2 viewMode + 미니멀 카드)
    ├── Team.jsx                      (§3 Hero + chip-bar + 미니멀 카드)
    ├── Court.jsx                     (§4 Hero + chip-bar + 카카오맵 + 미니멀 카드)
    ├── BoardList.jsx                 (§5 BoardHeader + 검색 토글)
    └── (기타 모든 v2.3 screen 카피 보존)
```
