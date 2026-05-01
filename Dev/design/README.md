# BDR 디자인 작업 허브

> **단일 진입점**. 어떤 디자인 / 박제 작업을 시작하기 전에 이 문서 + `claude-project-knowledge/00-master-guide.md` 부터 본다.
> **마지막 갱신**: 2026-05-01 (단일 폴더 룰 적용)

---

## 🗂️ 폴더 구조 (단일 폴더 룰)

```
Dev/design/
├── BDR-current/                       ⭐ 활성 시안 (박제 source)
│   ├── README.md                      현재 시안 빌드 요약
│   ├── MyBDR.html                     시안 라우터 (브라우저 미리보기)
│   ├── components.jsx                 AppNav frozen 코드 + 공통
│   ├── tokens.css / responsive.css / mypage.css / ...
│   └── screens/*.jsx                  87 화면
│
├── claude-project-knowledge/          영구 — 9 파일 박제 룰
│   ├── 00-master-guide.md ⭐          마스터 + 13 룰
│   ├── 01-user-design-decisions.md    사용자 결정 8 영역 (영구 보존)
│   ├── 02-design-system-tokens.md     색상 / 타이포 / 라운딩 / 모바일
│   ├── 03-appnav-frozen-component.md ⭐ AppNav frozen 코드 + 7 룰
│   ├── 04-page-inventory.md           117 페이지 박제 등급
│   ├── 05-design-brief-template.md    의뢰 표준 템플릿
│   ├── 06-self-checklist.md ⭐        시안 완료 후 자체 검수
│   ├── 07-custom-instructions.md      Claude.ai Project Custom Instructions
│   └── README.md                      가이드
│
├── DESIGN.md                          영구 — 디자인 시스템 (색상/타이포/컴포넌트/다크)
├── README.md                          영구 — 본 파일 (폴더 가이드 + 워크플로우)
├── v3-rebake-prompt-2026-05-01.md     활성 — 박제 재시작 P0/P1/P2
├── team-logos/                        영구 — 팀 로고 PNG (운영 사용)
│
└── _archive/                          🗃️ 옛 버전 (박제 작업 source 아님)
    ├── BDR v2/                        옛 v2.0 (2026-04-28 단일 폴더 통합 시점)
    ├── BDR v2.2/                      옛 v2.2
    ├── BDR v2.3/                      옛 v2.3 (Downloads 최신과 다른 옛 스냅샷)
    ├── BDR v2.4/                      옛 v2.4
    ├── v2-original/                   zip 최상위 옛 v2 시안 (zip 그대로 보존)
    └── prompts/                       옛 phase-N-*.md, v2.X-cli-batch-prompt-*.md 등
```

### 단일 폴더 룰 (위반 시 자동 reject)

- 활성 시안 폴더는 **`BDR-current/` 단 하나**. CLI 프롬프트 / Cowork 의뢰 / 박제 참조 모두 이 폴더만 사용.
- 새 zip 받으면 → 옛 `BDR-current/` 는 `_archive/BDR vX.Y/` 로 이동, 새 zip 내용 → `BDR-current/`. 단일 폴더 유지.
- `BDR v2.3/` `BDR v2.4/` 직접 참조하는 프롬프트는 자동 ❌ → `BDR-current/` 로 치환.

---

## 🔄 새 zip 받았을 때 워크플로우 5단계

사용자가 Claude.ai 디자인 프로젝트에서 zip 을 export → Downloads 에 풀이 → mybdr 동기화 절차.

### Step 1 — zip 풀이 + 내용 확인

```powershell
cd C:\Users\user\Downloads
Expand-Archive -Path "BDR vX.zip" -DestinationPath "BDR vX-extracted"
ls "BDR vX-extracted\Dev\design"
# 예: BDR v2.3/, BDR v2.2/, ... 폴더 + 최상위 CLAUDE.md
```

### Step 2 — 기존 BDR-current/ 옛 버전화

```powershell
cd "C:\0. Programing\mybdr\Dev\design"
# BDR-current 의 README.md 에서 시안 버전 확인 (예: v2.3)
git mv BDR-current "_archive\BDR vX.Y-old"
git status   # rename 감지 확인
```

### Step 3 — 새 zip 시안 → BDR-current/

```powershell
$src = "C:\Users\user\Downloads\BDR vX-extracted\Dev\design\BDR vX.Y"
$dst = "C:\0. Programing\mybdr\Dev\design\BDR-current"
Copy-Item -Path $src -Destination $dst -Recurse
git add BDR-current
```

### Step 4 — zip 최상위 옛 시안 → _archive/v2-original/

zip 안에 BDR vX.Y/ 외 다른 폴더 (예: BDR v2.2/) 있으면:

```powershell
$src = "C:\Users\user\Downloads\BDR vX-extracted\Dev\design\BDR v2.2"
Copy-Item -Path $src -Destination "_archive\v2-original" -Recurse
git add _archive
```

### Step 5 — README + commit

```powershell
# Dev/design/README.md 의 "마지막 갱신" 날짜 + 시안 버전 갱신
git add README.md
git commit -m "design: BDR-current sync vX.Y (Phase XX)"
```

---

## 📚 박제 룰 요약 (claude-project-knowledge/ 발췌)

자세한 내용은 `claude-project-knowledge/00-master-guide.md` 의 13 룰 참조.

### A. AppNav frozen 7 룰 — `03-appnav-frozen-component.md` 코드 그대로 카피, 재구성 ❌

1. 9 메인 탭 = 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기
2. utility bar 우측 (계정/설정/로그아웃) 모바일에서도 표시
3. main bar 우측 = 검색/쪽지/알림/다크/햄버거 **5개**만 (Phase 19 갱신)
4. 다크모드 — PC 듀얼 라벨 / 모바일 단일 아이콘
5. 검색·쪽지·알림 = `app-nav__icon-btn` (border/bg 박스 ❌)
6. 모바일 닉네임 hidden
7. 더보기 = 9번째 탭 (drawer + 5그룹 패널)

### B. 더보기 5그룹 IA — 8~9

8. 가짜링크 4건 영구 제거: `gameResult / gameReport / guestApps / referee`
9. `refereeInfo` (둘러보기 그룹) + `mypage` (계정·도움 첫 항목)

### C. 디자인 토큰 — 10

10. `var(--*)` 토큰만 / 핑크·살몬·코랄 ❌ / lucide-react ❌ / pill 9999px ❌

### D. 카피 / 모바일 — 11~13

11. 글로벌 카피 — 시안 우선 (사용자 결정 §6-1 보존)
12. placeholder 5단어 이내 ("예: " 시작 ❌)
13. 720px 분기 / iOS input 16px / 버튼 44px

### 회귀 방지 자동 검수 4 케이스

시안 측정 시 다음 4 케이스 자동 확인:
- ❌ main bar 우측에 "더보기 ▼" dropdown 또는 아바타 노출
- ❌ 모바일 (≤768px) 듀얼 라벨 노출
- ❌ 검색/쪽지/알림에 border/bg 박스 적용
- ❌ main bar 우측 아이콘 순서가 [다크, 검색, 쪽지, 알림, 햄버거] 외로 변경/누락

### 위반 시 즉시 중단 → PM 보고

- 사용자 결정 §1~§8 위반 (헤더 / 더보기 / 카피 / 모바일)
- 신규 메인 탭 추가
- DB 미지원 기능 시안 (라우트 존재 / 데이터 출처 불명)

---

## 🎯 현재 활성 작업

- **활성 브랜치**: `subin`
- **활성 시안**: BDR-current/ (Phase 13 마이페이지 hub + Phase 19 BottomNavEditor)
- **활성 박제 프롬프트**: `v3-rebake-prompt-2026-05-01.md` (P0/P1/P2)
- **활성 페이즈**: 마이페이지 hub 박제 — `/profile` 본문 재구성 + 16 깊은 페이지 단일 진입

### 박제 우선순위 (v3-rebake-prompt-2026-05-01.md 요약)

| 등급 | 영역 | 시안 파일 | 비고 |
|------|------|-----------|------|
| **P0** | `/profile` 본문 = MyPage hub | `screens/MyPage.jsx` + `mypage.css` | 3-tier 카드 (Tier 1/2/3) |
| **P0** | `/profile/settings` 7 nav 통합 | `screens/Settings.jsx` | Phase 19 BottomNavEditor 포함 |
| **P1** | `/profile/edit` | `screens/EditProfile.jsx` | 공개 범위 §5 이전 |
| **P1** | `/profile/billing` `/profile/activity` 등 | `screens/Billing.jsx` 외 | 깊은 페이지 |
| **P2** | 신규 시안 19건 (ContextReviews, GameEdit, MyPage, RefereeInfo, ...) | `screens/*.jsx` | 후속 큐 |

---

## 📝 문서 관리 룰

- **단일 출처 원칙(SSOT)**: 같은 정보 한 곳만. README 인덱스가 SSOT.
- **활성 vs 영구 vs 아카이브** 3분류 명확히
- 새 prompt md 추가 시: `Dev/design/` 루트는 활성만 (1~2개), 옛 prompt 즉시 `_archive/prompts/` 이동
- `claude-project-knowledge/` 9 파일은 영구 — 수정 시 commit 메시지에 사유 명시

---

## ⚠️ 박제 작업 시 절대 지킬 룰 (CLAUDE.md 발췌)

1. `main` 직접 push 금지 — `subin → dev → main` 흐름
2. `.env` 운영 DB URL 금지 / 운영 DB prisma db push 금지
3. 하드코딩 색상 금지 — `var(--color-*)` 토큰만
4. lucide-react 금지 — Material Symbols Outlined 사용
5. 핑크 / 살몬 / 코랄 금지
6. 버튼 border-radius 4px (pill 9999px ❌)
7. API 응답 키는 자동 snake_case 변환 — 프론트 인터페이스도 snake_case
8. `withAuth` + `withValidation` 비공개 API 필수
9. DB 미지원 기능은 제거 ❌ → "준비 중" 표시 + scratchpad.md 후속 큐 추가
10. **단일 폴더 룰** — `BDR-current/` 만 참조, 옛 버전 직접 참조 ❌

---

## 🚀 다음 CLI 세션 인계 프롬프트 (간단 버전)

```
오늘 작업 시작하자. 활성 시안 BDR-current/ 기준 박제 진행.

context:
- subin 브랜치 / 단일 폴더 룰 (CLAUDE.md §🗂️)
- 박제 source: Dev/design/BDR-current/ (Phase 13 마이페이지 hub + Phase 19 BottomNavEditor)
- 활성 prompt: Dev/design/v3-rebake-prompt-2026-05-01.md (P0/P1/P2)
- 박제 룰: Dev/design/claude-project-knowledge/00-master-guide.md 13 룰

체크리스트 통과 후 v3-rebake-prompt P0 부터 시작 가능 여부 확인 받고 작업 들어가줘.
```
