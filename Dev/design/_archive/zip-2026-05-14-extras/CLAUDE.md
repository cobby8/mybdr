# BDR v2 — 프로젝트 기본 규칙 (Project-wide CLAUDE.md)

> 이 프로젝트의 **모든 디자인 작업**은 이 문서를 첫 번째로 참고합니다.
> `uploads/00-master-guide.md` 의 13 룰과 `uploads/03-appnav-frozen-component.md` 의 AppNav 7 룰을 **항상 우선 적용**합니다.
> 위반 시 자동 reject — 새 시안은 모두 이 룰을 통과해야 합니다.

---

## 1. 프로젝트 개요

**MyBDR (Basketball Daily Routine)** — 전국 농구 매칭 플랫폼.
- 코트 예약 / 픽업 게임 / 게스트 모집 / 토너먼트 / 팀 운영 / 심판 배정
- **다크 모드 기본** (쿨 그레이 + BDR Red `#E31B23` + BDR Navy `#1B3C87`)
- 운영 사이트: mybdr.kr

---

## 2. 디자인 작업 핵심 13 룰 (절대 준수)

### 2-1. AppNav 룰 (1–6)

1. **9 메인 탭** = 홈 / 경기 / 대회 / 단체 / 팀 / 코트 / 랭킹 / 커뮤니티 / 더보기 — 마지막 탭이 더보기, 클릭 시 5그룹 패널 토글.
2. **utility bar** — 좌측("MyBDR 커뮤니티 / 소개 / 요금제 / 도움말")은 모바일 hidden, 우측("계정 / 설정 / 로그아웃")은 **모바일에서도 표시**.
3. **main bar 우측 컨트롤** = 검색 + 쪽지 + 알림 + 다크모드 + 햄버거(모바일) **만** (5개). 더보기 dropdown trigger / 계정 아바타 추가 금지.
4. **다크모드 토글** — 데스크톱(≥768px) 듀얼 라벨("라이트 / 다크"), 모바일(<768px) 단일 아이콘(☀/☾).
5. **검색 / 쪽지 / 알림** — `app-nav__icon-btn` 아이콘만. border / 배경 박스 추가 금지. 쪽지·알림은 `app-nav__notif-dot` 등 빨간 점 바지 허용.
6. **모바일 닉네임 hidden** — 햄버거와 충돌 방지.

### 2-2. 더보기 메뉴 (5그룹 IA) 룰 (7–8)

7. **5그룹 구조 고정** — 내 활동 / 경기·대회 / 등록·예약 / 둘러보기 / 계정·도움. 변경 금지.
8. **가짜링크 4건 영구 제거** — `gameResult` / `gameReport` / `guestApps` / `referee` 절대 시안에 포함 X. `refereeInfo` 신규 라우트만 허용.

### 2-3. 콘텐츠 / 카피 룰 (9)

9. **글로벌 카피** = "전국 농구 매칭 플랫폼". "서울 3x3 한정" 같은 도시 한정 표현 금지. About 페이지 운영진 실명 박제 금지 (일반 라벨 사용).

### 2-4. 디자인 토큰 룰 (10–13)

10. **색상** — `var(--accent / --cafe-blue / --ok / --bg-alt / --ink-mute)` 등 토큰만. 하드코딩 hex 금지. 핑크 / 살몬 / 코랄 / 따뜻한 베이지 절대 금지.
11. **아이콘** — Material Symbols Outlined 또는 시안 검증된 이모지만. `lucide-react` 금지.
12. **라운딩** — 버튼 / 카드 4px 표준 (8px 카드 OK). pill `9999px` 금지.
13. **모바일** — 720px 통일 / iOS input 16px / 버튼 44px 터치 타겟. 인라인 grid `repeat(N, 1fr)` 사용 시 720px 분기 필수.

---

## 3. AppNav Frozen 7 룰 (uploads/03 요약)

> **AppNav 컴포넌트는 frozen** — `uploads/03-appnav-frozen-component.md` 코드를 그대로 카피해서 사용. 재작성 / 재구성 절대 금지.

1. 9 메인 탭 배열(홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기) 고정.
2. utility bar 우측(계정/설정/로그아웃)은 모바일에서도 표시, 좌측만 hidden.
3. main bar 우측 = 검색/쪽지/알림/다크/햄버거(모바일) 5개만 — dropdown·아바타 추가 금지.
4. 다크모드 — PC 듀얼 라벨 / 모바일 단일 아이콘 (ThemeSwitch viewport 분기).
5. 검색/쪽지/알림은 `app-nav__icon-btn` 클래스 — border/배경 박스 없이 아이콘만.
6. 모바일 닉네임 hidden (`hidden sm:inline` 또는 미디어 쿼리).
7. 더보기는 9번째 마지막 탭 — 클릭 시 drawer 안 5그룹 패널 토글.

---

## 4. 시안 작업 시 첫 응답 형식 (필수)

새 의뢰 도착 시 다음 형식으로 응답:

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
- 자체 체크리스트: uploads/06-self-checklist.md 의 해당 섹션

질문 / 가정:
1. [필요 시 PM 결정 항목]

작업 시작.
```

---

## 5. 산출물 폴더 구조

```
Dev/design/BDR v2.X/                  (X = 다음 버전)
├── README.md                         (변경 요약)
├── tokens.css                        (이전 버전 카피, 변경 없으면 그대로)
├── components.jsx                    (AppNav frozen)
├── data.jsx
├── extras-data.jsx
├── responsive.css
├── MyBDR.html
├── _mobile_audit.html
└── screens/
    ├── (이전 버전의 모든 시안 카피)
    └── [신규 시안].jsx
```

⚠️ 새 v2.X 폴더는 항상 **이전 최신 버전 카피**로 시작. 변경된 파일만 수정.

---

## 6. 외부 참조 (보조 파일)

| # | 파일 | 역할 |
|---|------|------|
| 00 | uploads/00-master-guide.md | 마스터 진입점 — 13 룰 원본 |
| 01 | uploads/01-user-design-decisions.md | 사용자 직접 결정 8 영역 (절대 보존) |
| 02 | uploads/02-design-system-tokens.md | 색상 / 타이포 / 라운딩 / 모바일 토큰 |
| 03 | uploads/03-appnav-frozen-component.md | AppNav frozen 코드 |
| 04 | uploads/04-page-inventory.md | 117 페이지 박제 등급 매트릭스 |
| 05 | uploads/05-design-brief-template.md | 시안 의뢰 표준 템플릿 |
| 06 | uploads/06-self-checklist.md | 시안 완료 후 자체 검수 체크리스트 |
| 07 | uploads/07-custom-instructions.md | 추가 지침 |

---

## 7. 작업 흐름

```
1. 이 CLAUDE.md 읽기 → 13 룰 + AppNav 7 룰 인지
2. 의뢰 내용에 따라 uploads/01~07 보조 파일 참고
3. §4 첫 응답 형식으로 확인 응답
4. 작업 진행
   ├─ AppNav 는 uploads/03 frozen 카피 (재구성 X)
   ├─ 새 컴포넌트만 신규 디자인
   ├─ 토큰은 uploads/02 사용
   └─ 카피 / 명칭은 uploads/01 보존
5. 완료 후 uploads/06 self-checklist 모든 항목 ✅ 검수
6. Dev/design/BDR v2.X/ 산출물 정리 + README 변경 요약
```

---

## 8. 자주 쓰는 토큰

```css
var(--accent)        /* BDR Red #E31B23 */
var(--cafe-blue)     /* BDR Navy #1B3C87 */
var(--bg)            /* 페이지 배경 */
var(--bg-alt)        /* 카드 배경 */
var(--bg-card)       /* 카드 (강조) */
var(--ink)           /* 본문 */
var(--ink-soft)      /* 보조 */
var(--ink-mute)      /* 약한 */
var(--ink-dim)       /* 비활성 */
var(--border)        /* 테두리 */
var(--ok)            /* 성공 #16a34a */
var(--err)           /* 에러 #dc2626 */
```

---

## 9. PM 결정 필요 시

다음 경우 PM 에 1줄 질문 후 답변 받기 전 작업 진행 X:
- 사용자 결정 §1~§8 과 충돌하는 새 디자인 제안
- DB / API 미지원 기능 시안 제안
- 기존 시안 (v2.2) 과 다른 패턴 도입
- 신규 라우트 / 페이지 추가 필요

---

## 10. 회귀 방지 — 위반 자동 검수 체크

시안 측정 시 다음 4 케이스 자동 확인:
- ❌ main bar 우측에 "더보기 ▼" dropdown 또는 아바타("RDM" 등) 노출
- ❌ 모바일(≤768px)에서 "☀ 라이트 ☾ 다크" 듀얼 라벨 노출
- ❌ 검색/쪽지/알림 버튼에 border/bg 박스 (`.btn` / `.btn--sm` 등) 적용
- ❌ main bar 우측 아이콘 순서가 [다크, 검색, 쪽지, 알림, 햄버거] 이외로 변경·누락
