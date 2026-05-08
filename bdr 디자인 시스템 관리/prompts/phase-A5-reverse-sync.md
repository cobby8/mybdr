# Phase A.5 — 운영 → 시안 역박제 (BDR-current/ stale snapshot 보강)

> Claude 디자인 세션에 **본 마크다운 전체** 를 복사 후 붙여넣기.

---

## 🎯 본 Phase 의 목적

**현재 상태**:
- BDR-current/ 마지막 commit = 2026-05-01 (8a5cb7b)
- 운영 src/ 에 5/3~5/6 동안 추가된 UI 변경 10건 — 시안 (BDR-current/) 미반영
- Phase A 가 완료됐지만 위 10건 운영 변경이 반영 안 된 상태

**본 Phase A.5 작업**: 운영 src/ 의 최신 UI 10건을 BDR-current/ 에 시안으로 박제 (역방향 박제).
→ 결과: BDR-current/ = 운영 mybdr.kr 와 시각 정합 + Phase B 진입 베이스 정합.

---

## 📋 의뢰

```
✅ BDR 디자인 의뢰 — Phase A.5: 운영 → 시안 역박제 10건 보강

배경:
- 본 Phase 직전 상태: Phase A 완료 (utility 로고 / 메인 텍스트 로고 / 햄버거 NavBadge dot 추가 / NavBadge 4 변형 컴포넌트 정의 / Search/Messages/Notifications 시안 갱신).
- 그러나 BDR-current/ 의 베이스가 5/1 snapshot 이라 운영 5/3~5/6 변경 10건 미반영.
- 본 Phase A.5: 운영 src/ 의 5/3~5/6 변경을 BDR-current/ 에 시안으로 역박제 → 베이스 정합.

작업 영역 (시안만):
- BDR-current/components.jsx — 8 컴포넌트 신규 / 갱신
- BDR-current/screens/Home.jsx, Profile.jsx, TeamDetail.jsx — 사용처 시안 갱신

본 Phase 작업 (10 건):

### 1. NavBadge 컴포넌트 정합 — `--color-accent` 폐기 토큰 → `--accent`
- Phase A 에서 NavBadge 4 변형 추가됨 — 운영 nav-badge.css 와 일치 검증
- 운영 코드: `--color-accent` fallback 사용 — 02 §9 폐기 토큰. 시안 박제 시 `--accent` 직접 사용 (fallback hex 제거)
- 4 variant 표준 (운영 코드 그대로):
  ```css
  .nav-badge { position: absolute; top: 4px; right: -2px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; letter-spacing: 0.02em; user-select: none; pointer-events: none; z-index: 1; }
  .nav-badge--dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .nav-badge--count { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 11px; line-height: 1; }
  .nav-badge--new { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 10px; line-height: 1; }
  .nav-badge--live { padding: 1px 6px; border-radius: 9999px; background: var(--ok); color: #fff; font-size: 9px; line-height: 1.4; animation: nav-badge-live-pulse 1.6s ease-in-out infinite; }
  .nav-badge--inline { position: static; margin-left: 6px; vertical-align: middle; }
  @keyframes nav-badge-live-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(22,163,74,.6); } 50% { opacity: .85; box-shadow: 0 0 0 4px rgba(22,163,74,0); } }
  @media (max-width: 720px) { .nav-badge--count, .nav-badge--new { min-width: 16px; height: 16px; font-size: 10px; } .nav-badge--live { font-size: 8px; padding: 1px 4px; } }
  ```
- 운영 nav-badge.tsx 의 `inline` prop (default false = absolute / true = static + margin-left) 지원
- Phase A 결과의 NavBadge 컴포넌트 위 코드로 정합 (변경: `--color-accent` → `--accent`, `#16a34a` → `var(--ok)`)

### 2. 모바일 햄버거 R3 강조 (5/4, f8aa88a + ca7277f)
- accent border + NEW dot 박스 안쪽 우측 상단 정렬:
  ```css
  /* 라이트: accent 색상 border 1px */
  @media (max-width: 900px) {
    .app-nav__burger {
      position: relative;
      border: 1px solid var(--accent);
      border-radius: 4px;
      padding: 6px;
    }
    .app-nav__burger .nav-badge--dot {
      top: 4px;     /* 박스 안쪽 우측 상단 */
      right: 4px;   /* 박스 안쪽 우측 상단 */
    }
  }
  /* 다크: brutalism 2px border-strong + 라운딩 0 */
  [data-theme="dark"] .app-nav__burger,
  html.dark .app-nav__burger {
    border-width: 2px;
    border-color: var(--border-strong);
    border-radius: 0;
  }
  ```
- 사유: drawer 게이트웨이 R3 강조 — 사용자가 햄버거 = 새 컨텐츠 진입점 인지

### 3. AppDrawer 폭 축소 60vw → 42vw + 슬림화 (5/4, 9117a23, d059d17, c25c162)
- drawer 폭: 60vw → 42vw (-30%)
- min-height 44px 제거 + padding 10→8 (여백 압축)
- drawer 안 메뉴 항목별 NEW 뱃지 (NavBadge variant="new") + 알림 unread 숫자 뱃지 (NavBadge variant="count" count={N})
- MORE_GROUPS 슬림화 (이미 04 §5-A 박제 — 30 → 15 항목)

### 4. 본인 카드 좌하단 신청 중 뱃지 — 4종 시각화 (5/6, d5d491e)
- 본인 = 마이페이지 / 팀 관리 페이지의 자기 자신 카드
- 좌하단 위치 + 4종 신청 상태 시각화:
  * 번호변경 신청 중 → "🔢 번호변경 중" (var(--info))
  * 휴면 신청 중 → "💤 휴면 신청" (var(--warn))
  * 탈퇴 신청 중 → "🚪 탈퇴 신청" (var(--danger))
  * 이적 신청 중 → "🔄 이적 진행" (var(--info))
- 시안 위치: components.jsx 의 본인 카드 컴포넌트 (또는 신규 OwnMemberCard) + screens/Profile.jsx + screens/TeamManage.jsx
- 패턴: 카드 좌하단 absolute 작은 칩 — 텍스트 + 아이콘 + 토큰 배경

### 5. 본인 카드 dropdown overflow visible (5/6, 64b1bab)
- 본인 카드의 ⋮ dropdown 자르지 않으려면 부모 카드 `overflow: visible` 필수 (hidden 금지)
- 02 §10-7 박제됨 — 시안 적용 검증

### 6. 마이페이지 소속 팀 카드 (5/6, 465b7ca + 후속 4건)
- 위치: 히어로 아래 이동 (이전: 사이드바 / 현재: 본문 메인 흐름)
- 팀 row 패턴 — 한 줄 정렬:
  * 좌측: 팀 로고 + 팀명 + 등록 번호
  * 우측: 뱃지 + 활동관리 → **세로 stack 우측 정렬** (팀명 생략 방지 + 모바일 가독성)
- 액션: "활동 관리" / "팀페이지 이동" 버튼 추가
- 시안 갱신 영역: screens/Profile.jsx (Phase 13 마이페이지 hub) — Tier 2 또는 본문 stack 위치 조정

### 7. PasswordInput 통합 컴포넌트 (5/3, 9d73256)
- 보기 토글 (👁 ↔ 👁‍🗨) + autocomplete 정밀 제어
- 5 파일 일괄 적용 — login / signup / 비밀번호 재설정 / 회원 인증 / 매치 코드 입력
- 시안 박제: components.jsx 신규 PasswordInput
  ```jsx
  function PasswordInput({ value, onChange, autocomplete, placeholder }) {
    const [show, setShow] = React.useState(false);
    return (
      <div style={{position:'relative'}}>
        <input
          type={show ? 'text' : 'password'}
          value={value} onChange={onChange}
          autoComplete={autocomplete}
          placeholder={placeholder}
          className="input"
          style={{paddingRight: 40, fontSize: 16}}  /* iOS 자동 줌 차단 */
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? '비밀번호 숨김' : '비밀번호 표시'}
          style={{position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:0, color:'var(--ink-mute)', cursor:'pointer'}}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
    );
  }
  ```
- 사용처: screens/Login.jsx / Signup.jsx / PasswordReset.jsx 의 비밀번호 입력 필드 PasswordInput 으로 교체

### 8. 팀 상세 Hero Avatar 150% 확대 (5/3, 2bcf90b)
- 시안: screens/TeamDetail.jsx 의 hero 영역 Avatar 박스 width / height 150% 확대
- 사유: 팀 정체성 강조 (사용자 요청)
- 모바일에서도 비례 유지

### 9. ForceActionModal — jersey / withdraw 두 모드 (5/6, 86f9eb9)
- 위치: components.jsx 신규 ForceActionModal
- 두 모드:
  * `mode="jersey"` — 등 번호 강제 변경 (운영진이 회원 번호 강제 변경)
  * `mode="withdraw"` — 회원 강제 탈퇴 (운영진이 회원 강제 제거)
- 패턴: 표준 모달 + 다중 단계 (확인 → 사유 입력 → 최종 확인) + toast (성공)
- 기존 `window.prompt / alert / confirm` 패턴 통합 → 표준 모달
- 시안 사용처: screens/TeamManage.jsx 의 운영진 액션 영역

### 10. 5 모달 background 토큰 일원화 + dropdown 정리 (5/6, 86f9eb9)
- 운영 변경: 5 모달 + dropdown background `var(--surface)` (미정의 — 다크 mode 깨짐) → `var(--color-card)` 일괄 치환
- 시안 박제 시: `--surface` / `--color-card` 모두 사용 X → `var(--bg-card)` 직접 사용 (02 §9 매핑)
- dropdown max-width: `calc(100vw - 32px)` (모바일 overflow 보완)
- placeholder 5단어 룰 + "예) " prefix 제거 (06 §4)
- tournaments/join grid `repeat(2,1fr)` → `auto-fit minmax(140px)` (모바일 분기)
- 시안 영향: components.jsx 의 5 모달 (dormant / jersey-change / withdraw / transfer / team-join) + dropdown / Tournaments.jsx 의 join grid

룰 인지 (반드시 준수):
- AppNav: 03 frozen 13 룰 — Phase A 갱신본 + 본 Phase 의 햄버거 R3 강조 추가
- 토큰: 02 §1 신 토큰만 / `--surface` `--color-*` 모두 사용 X → `var(--bg-card)` 등 신 토큰
- 카피: 01 §6 보존 / placeholder 5단어 / "예) " ❌
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌ (NavBadge live 만 예외 — 텍스트 alignment 우선)
- 더보기 슬림화 (04 §5-A) 보존 — mypage/editProfile/notificationSettings/passwordReset/onboardingV2 추가 X

자체 검수 (Phase A.5 완료 시 모두 통과):
□ NavBadge 4 variant 운영 코드 정합 (--accent / --ok 토큰만 / fallback hex 제거)
□ 모바일 햄버거 R3 강조 — 라이트 accent border / 다크 brutalism 2px / dot 박스 안쪽 우측 상단
□ AppDrawer 폭 42vw + drawer 안 NEW/count 뱃지
□ 본인 카드 좌하단 신청 중 뱃지 4종 (번호변경/휴면/탈퇴/이적)
□ 본인 카드 dropdown overflow: visible (자르지 않음)
□ 마이페이지 소속 팀 카드 = 히어로 아래 + 세로 stack 우측 정렬 + 활동관리/팀페이지 액션
□ PasswordInput 통합 컴포넌트 + 5 사용처 교체
□ TeamDetail hero Avatar 150% 확대
□ ForceActionModal jersey/withdraw 두 모드
□ 5 모달 background = var(--bg-card) 통일 + dropdown max-width: calc(100vw - 32px) + placeholder 5단어
□ AppNav 13 룰 통과 / 06-self-checklist.md §1~§5 통과
□ var(--*) 토큰만 / hex 직접 사용 X / `--color-*` `--surface` 잔존 0

산출 형식:
- BDR-current/ 안의 시안 직접 수정 (components.jsx + screens 다수 + tokens.css 검증)
- 시안 결과물 = MyBDR.html 라우터 진입 시 / 운영 mybdr.kr 와 시각 정합
- 변경 요약 보고:
  * components.jsx 신규: PasswordInput / ForceActionModal / OwnMemberCard (or 본인 카드 패턴)
  * components.jsx 갱신: AppDrawer / NavBadge (--accent 정합) / 5 모달
  * screens 갱신: Profile.jsx (소속 팀 카드 위치) / TeamDetail.jsx (hero 150%) / TeamManage.jsx (Force 모달) / Login/Signup/PasswordReset (PasswordInput) / Tournaments.jsx (join grid)

후속 (PM 이 Cowork 와 진행 — 본 Phase A.5 작업 외):
- 시안 박제만 진행 — 운영 src/ 자체에는 본 Phase 변경 없음 (이미 적용됨, 단지 시안에 역박제)
- 후속 Phase B (홈) 진입 시 본 Phase A.5 결과 베이스 활용

질문 / 가정:
1. 본인 카드 신청 중 뱃지 — 운영의 4종 (번호변경/휴면/탈퇴/이적) 정확한 라벨 / 색상 / 아이콘 확정?
2. ForceActionModal — 다중 단계 (확인 → 사유 → 최종) 패턴 유지 vs 1단계 단순화?
3. PasswordInput 의 보기 아이콘 — 이모지 (👁/🙈) 그대로 vs Material Symbols 대체?

작업 시작.
```

---

## 📚 운영 출처 참조 (Cowork 가 자동 인지)

- `src/components/bdr-v2/nav-badge.tsx` + `nav-badge.css` — NavBadge 4 variant
- `src/app/globals.css` L1632~1655 — 햄버거 R3 강조 CSS
- `src/components/bdr-v2/app-drawer.tsx` — drawer 폭 + 슬림
- `src/app/(web)/profile/_v2/teams-list-card.tsx` — 소속 팀 카드 stack
- `src/app/(web)/profile/_v2/transfer-progress-card.tsx` — 이적 신청 패턴
- `src/components/bdr-v2/password-input.tsx` — PasswordInput 통합
- `src/app/(web)/teams/[id]/manage/_components/force-action-modal.tsx` — ForceActionModal
- 운영 5 모달: src/app/(web)/teams/[id]/_components_v2/{dormant/jersey-change/withdraw/transfer}-request-modal.tsx + team-join-button-v2

## 🛠 Phase A.5 후속 (Phase B 진입 전)

```
1. PM 검수: BDR-current/ 베이스가 운영과 시각 정합 (라이트 / 다크 / 모바일 366px)
2. CLAUDE.md 동기화 룰 추가 (Phase A.5 와 같이 진행 — README 참조)
3. Phase B 프롬프트 검증 — 본 Phase A.5 결과 베이스 활용 가능 확인
4. Phase B 진입 (홈 페이지)
```
