# Phase A — 시스템 베이스라인 동기화 + 헤더 진입점 시안 박제

> Claude 디자인 세션에 **본 마크다운 전체** 를 복사 후 붙여넣기.
> Claude.ai Project (BDR 디자인) 에 첨부된 9 파일 + BDR-current/ 자동 인지됨.

---

## 🎯 본 Phase 의 클로드 디자인 작업 범위

**클로드 디자인이 직접 수정 가능한 파일**:
- `BDR-current/screens/*.jsx` — 시안 페이지
- `BDR-current/tokens.css` — 토큰 정의
- `BDR-current/components.jsx` — AppNav frozen + 공유 컴포넌트
- `BDR-current/MyBDR.html` — 시안 라우터

**클로드 디자인 범위 외 (PM 이 Cowork 와 별도 진행)**:
- `src/` 운영 Next.js 코드 — 시안 산출물을 PM 이 Cowork 와 함께 적용

---

## 📋 의뢰

```
✅ BDR 디자인 의뢰 — Phase A: 시스템 베이스라인 동기화 + 헤더 진입점 시안 (검색 / 쪽지 / 알림)

배경:
- 2026-05-07 디자인 시스템 갱신 (audit-2026-05-07.md):
  * 02-design-system-tokens.md 실측 동기화 — 듀얼 테마 + 신규 토큰 16종 + 폐기 매핑 §9
  * 03-appnav-frozen-component.md — Phase 19 frozen 13 룰 (utility 로고 이미지 / 햄버거 NavBadge / 쪽지 진입점)
  * 04-page-inventory.md — 더보기 슬림화 (30 → 15 항목)
- 본 Phase 가 첫 번째인 이유: 시스템 베이스라인 (tokens.css + components.jsx) 정합이 후속 Phase 의 전제 + 헤더 진입점 (검색/쪽지/알림) 작은 범위로 패턴 검증.

본 Phase 작업 (시안 영역만 — BDR-current/ 직접 수정 / 신규 폴더 X):

1. tokens.css — **신규 토큰 16종 이미 박제됨** (라이트 + 다크 듀얼 정의 모두 02 와 1:1 일치) ✅
   * --bg-head, --cafe-blue-soft, --cafe-blue-hair, --link, --link-visited
   * --sh-xs/sm/md/lg, --fs-hero/h1/h2/h3/body/small/micro, --lh-body
   * --radius-card 듀얼 (라이트 10px / 다크 0px), --radius-chip 듀얼
   → **본 작업에서 신규 토큰 추가 작업 X**. 02 §1~§5 와의 일치 검증만 진행 (이미 통과 가정).

2. tokens.css 폐기 토큰 deprecated 주석 추가 — 02 §9 매핑 표 (유일한 변경):
   * 시안에서 var(--color-*) 사용 X (이미 BDR-current 깨끗) — 회귀 가드용 deprecated 주석 박제:
     ```css
     /* ============================================================
        DEPRECATED — 폐기 토큰 (운영 src/ 마이그레이션 대상)
        새 시안에서 사용 X. 운영 코드 (src/) 는 Cowork 가 별도 마이그레이션.
        매핑 표:
        --color-primary / --color-accent  →  --accent
        --color-card                       →  --bg-card
        --color-surface                    →  --bg-elev
        --color-surface-bright             →  --bg-alt
        --color-border                     →  --border
        --color-text-muted                 →  --ink-mute
        --color-text-secondary             →  --ink-soft
        --color-on-accent                  →  --ink-on-brand
        --color-success                    →  --ok
        --color-warning                    →  --warn
        --color-error                      →  --danger
        ============================================================ */
     ```

3. components.jsx — Phase 19 frozen 동기화 (03 §1 카피):

   3-1. utility bar 좌측 = "MyBDR 커뮤니티" 텍스트 (현재 L191) → **BDR 로고 이미지** 로 교체
        - 변경 전: `<span>MyBDR 커뮤니티</span>`
        - 변경 후 옵션 A (이미지 파일 broken link 상태 OK):
          ```jsx
          <a href="#" className="app-nav__utility-logo" onClick={(e)=>{e.preventDefault();setRoute('home');}} aria-label="MyBDR 홈">
            <img src="assets/bdr-logo.png" alt="MyBDR" style={{height:18, width:'auto'}}/>
          </a>
          ```
        - 변경 후 옵션 B (inline SVG placeholder — assets/ 폴더 부재 시 깔끔):
          ```jsx
          <a href="#" className="app-nav__utility-logo" onClick={(e)=>{e.preventDefault();setRoute('home');}} aria-label="MyBDR 홈">
            <svg width="60" height="18" viewBox="0 0 100 30">
              <text x="0" y="22" fontFamily="var(--ff-display)" fontSize="22" fontWeight="900" fill="var(--bdr-red)">BDR</text>
            </svg>
          </a>
          ```
        → 옵션 A/B 클로드 디자인 재량으로 선택. 실제 .png 파일은 PM 이 후속으로 운영 `public/images/logo.png` 를 BDR-current/assets/ 로 카피.

   3-2. utility bar 우측 = "마이페이지 / 설정 / 로그아웃" (현재 L194~199) **그대로 보존** ✅
        - 사용자 결정 §1 + Phase 13 README "헤더 utility — 닉네임 + 마이페이지 링크" 박제
        - 운영 src/ (`{user.name}` link) 와의 차이는 후속 src/ 마이그레이션 시 정합 — 본 Phase 시안 작업에서는 **시안 그대로 보존** (변경 X)

   3-3. 메인 바 로고 = `<MyBDR.>` 텍스트만 (현재 L207~209 의 `<img>` 제거)
        - 변경 전: `<a className="app-nav__logo"><img src="assets/bdr-logo.png"/><span>MyBDR<span className="dot">.</span></span></a>`
        - 변경 후: `<a className="app-nav__logo"><span>MyBDR<span className="dot">.</span></span></a>`
        - 사유: Phase 19 룰 — utility bar 좌측 (이미지) 와 메인 바 (텍스트) 분리

   3-4. 햄버거에 NavBadge dot 추가 — drawer 게이트웨이 R3 강조:
        ```jsx
        <button className="app-nav__burger" style={{position:'relative'}}>
          {/* 햄버거 SVG */}
          {(/* newGameCount + newCommunityCount + unreadCount > 0 */) && <NavBadge variant="dot"/>}
        </button>
        ```

   3-5. NavBadge 컴포넌트 신규 추가 (현재 components.jsx 에 정의 0건):
        - 4 변형 모두 정의: `dot` / `count` / `new` / `live`
        - Phase A 에서 햄버거 = `dot` 만 적용. 나머지는 후속 Phase 사용처 확정 시 활용 (Phase B 의 LIVE 경기, NEW 카드 등)
        - 03 §7 NavBadge 표준 그대로 카피

4. screens/Search.jsx 시안 갱신 — 헤더 검색 진입점:
   * 검색 입력 + 결과 그룹 (팀 / 경기 / 대회 / 게시글) 패턴 정합
   * 토큰: var(--accent), var(--bg-card), var(--ink-mute), var(--cafe-blue-soft) 등 02 §1 신 토큰만
   * placeholder 5단어 이내 / "예) " ❌
   * 모바일 720px 분기 + iOS 16px input

5. screens/Messages.jsx 시안 갱신 — 헤더 쪽지 진입점 (Phase 19 신규 강조):
   * 쪽지 / 채팅 목록 + 빈 상태 + 검색 패턴
   * 헤더 우측의 쪽지 아이콘 (mail_outline) 과 시각 정합

6. screens/Notifications.jsx 시안 갱신 — 헤더 알림 진입점:
   * 알림 그룹화 (오늘 / 어제 / 이번 주) + unread dot + actionUrl 진입
   * 헤더 우측 알림 아이콘 + 빨간 점 뱃지 (.app-nav__notif-dot) 와 시각 정합

7. MyBDR.html 라우터 검증:
   * search / messages / notifications 모두 라우터에 등록됨 (이미 ✅) — 변경 없음

룰 인지 (반드시 준수):
- AppNav: 03 frozen 13 룰 — Phase 19 utility 로고 이미지 / 햄버거 NavBadge / 쪽지·알림 5개 아이콘
- 토큰: 02 §1 신 토큰만 (BDR-current 는 이미 var(--*) 깔끔) / --color-* 사용 X
- 듀얼 테마: 02 §0 — [data-theme="light"] / [data-theme="dark"] 둘 다 정합
- 카피: 01 §6 보존 — "서울 3x3 농구 커뮤니티" / "다음카페" 카피 ✅
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌ (정사각형 원형은 50% OK) / placeholder 5단어 이내

자체 검수 (Phase A 시안 완료 시 모두 통과):
□ tokens.css 신규 토큰 16종 — **이미 박제됨** (변경 X / 검증만)
□ tokens.css deprecated 주석 + 매핑 표 추가 ✅
□ components.jsx utility bar 좌측 = BDR 로고 이미지 (텍스트 "MyBDR 커뮤니티" 제거) ✅
□ components.jsx utility bar 우측 = "마이페이지 / 설정 / 로그아웃" **보존** (변경 X)
□ components.jsx 메인 바 로고 = 텍스트만 (`<img>` 제거)
□ components.jsx 햄버거에 NavBadge dot ✅
□ NavBadge 4 변형 (dot/count/new/live) 정의 ✅
□ Search.jsx / Messages.jsx / Notifications.jsx 시안 갱신 ✅
□ Messages.jsx — 3컬럼 패턴 + 1:1 + 팀 단톡 (group/members 필드) **보존** (현재 패턴 유지)
□ AppNav 7 frozen 룰 + Phase 19 6 룰 = 13 룰 모두 통과 (06-self-checklist.md §1)
□ 토큰 룰 통과 (06 §2): var(--*) 만 사용, hex 직접 사용 X, deprecated 토큰 사용 X
□ 모바일 룰 통과 (06 §3): 720px 분기 + iOS 16px + 44px 터치 타겟
□ 카피 룰 통과 (06 §4): placeholder 5단어 / "예) " ❌

산출 형식:
- BDR-current/ 안의 4 파일 직접 수정 (tokens.css / components.jsx / Search.jsx / Messages.jsx / Notifications.jsx)
- 시안 결과물 = MyBDR.html 라우터에서 search / messages / notifications 진입 시 정상 노출
- 변경 요약 보고:
  * tokens.css: 16 신규 토큰 추가 + deprecated 주석 1 블록
  * components.jsx: AppNav utility 로고 이미지 / 햄버거 NavBadge / NavBadge 컴포넌트 4 변형
  * screens: 3 파일 (Search / Messages / Notifications) 갱신

후속 (PM 이 Cowork 와 진행 — Claude 디자인 작업 외):
- src/components/bdr-v2/app-nav.tsx 동기화 검증
- src/app/(web)/search /messages /notifications 토큰 마이그레이션
- src/components/shared/search-autocomplete.tsx 토큰 마이그레이션

PM 결정 (확정 — 2026-05-07):
1. **폴더 룰 = BDR-current/ 직접 수정** (CLAUDE.md 단일 폴더 룰). 신규 BDR v2.X/ 폴더 생성 X. v2.4 도 _archive 보존됨.
2. **tokens.css 신규 토큰 = 이미 박제 완료** — 추가 작업 불필요. deprecated 주석 + 매핑 표 1 블록만 추가.
3. **NavBadge = 4 변형 모두 컴포넌트 정의 + Phase A 햄버거 dot 만 적용**. 후속 (count/new/live) 는 사용처 확정 시 후속 Phase 에서 활용.
4. **/messages 패턴 = 운영 + 시안 이미 박제됨 (3컬럼 + 1:1 + 팀 단톡)** — 그대로 보존. 시각 정합 + 카드 톤 정리만.
5. **로고 이미지 = (a) `assets/bdr-logo.png` 경로 유지 (broken link 가능) 또는 (b) inline SVG placeholder** — 클로드 디자인 재량 선택. 실제 .png 카피는 PM 후속.

회귀 가드 (반드시 보존 — 변경 X):
- utility bar 우측 = "마이페이지 / 설정 / 로그아웃" 시안 패턴 (현재 components.jsx L194~199)
- Messages.jsx 의 3컬럼 + 8 threads + 첨부 카드 (attach: type:'game') 더미 데이터 패턴
- AppNav 7 frozen 룰 영향 0 (utility 좌측 + 메인 로고 + 햄버거 NavBadge 만 변경)

작업 시작.
```

---

## 📚 참조 (Claude 디자인 Project 자동 인지)

- `claude-project-knowledge/00-master-guide.md` §3 첫 응답 형식
- `claude-project-knowledge/02-design-system-tokens.md` §1 색상 / §3 타이포 / §4 라운딩 / §5 그림자 / §9 매핑 / §10 신규 컴포넌트
- `claude-project-knowledge/03-appnav-frozen-component.md` Phase 19 frozen 13 룰 / §7 NavBadge / §8 LogoutLink
- `claude-project-knowledge/06-self-checklist.md` 자체 검수
- `BDR-current/components.jsx` (현재 AppNav — Phase 19 부분 미반영)
- `BDR-current/tokens.css` (현재 토큰 — 신규 16종 미정의)
- `BDR-current/screens/Search.jsx` `Messages.jsx` `Notifications.jsx`

## 🛠 PM 후속 작업 (Cowork 와 함께)

Claude 디자인 작업 완료 후, PM 이 Cowork 에게:

```
"Phase A 클로드 디자인 시안 완료. src/ 마이그레이션 진행해줘:
1. src/app/(web)/search/page.tsx 토큰 마이그레이션
2. src/app/(web)/messages/page.tsx 토큰 마이그레이션
3. src/app/(web)/notifications/page.tsx 토큰 마이그레이션
4. src/components/shared/search-autocomplete.tsx 토큰 마이그레이션
검증: grep 'var(--color-' 위 영역 → 0"
```
