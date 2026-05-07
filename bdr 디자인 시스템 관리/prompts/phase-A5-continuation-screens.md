# Phase A.5 잔여 작업 — screens 적용 (§4~§10)

> 현재 진행 중인 클로드 디자인 Phase A.5 세션에 **그대로 복사** 해서 잔여 의뢰.

---

## 📋 잔여 의뢰 (현재 진행 중인 Phase A.5 세션에 보낼 메시지)

```
PM 답변 — Phase A.5 잔여 screens 적용 진행 (Yes):

배경:
- Phase A.5 §1~§3 (NavBadge 정합 + 햄버거 R3 + AppDrawer 폭) 완료 ✅
- Phase A.5 §11 (PC drawer 깨짐 fix) 완료 ✅
- Phase A.5 §4~§10 의 screens 적용 잔여 — 컴포넌트 정의는 끝났지만 실제 화면에 마운트 X
- 본 잔여 작업 완료 시 Phase A.5 100% 마무리 → Phase A.6 (메인 9 탭 목록) 진입

잔여 작업 (§4~§10 screens 적용 / 8 파일):

### §4+§5+§6 — Profile.jsx (마이페이지 hub)
- 소속 팀 카드 위치 = 히어로 바로 아래 풀 width (사이드바 X / 본문 메인 흐름)
- 소속 팀 row 마크업 갱신:
  * 좌측: 로고 + 지역 + #N (jersey) + 팀명 한/영
  * 우측: [활동 관리 ▾] dropdown + [팀페이지 →] 버튼 — 세로 stack 우측 정렬
  * 좌하단: MemberPendingBadge 마운트 (4종 신청 시각화 — span.badge.badge--soft)
- 본인 카드 dropdown 사용처 — overflow: visible 명시 (자르지 않음, 02 §10-7)

### §4+§5+§9 — TeamManage.jsx (팀 관리)
- 본인 row 좌하단 = MemberPendingBadge 마운트 (Profile 과 동일 패턴)
- ⋮ dropdown overflow visible
- 운영진 액션 영역 = ForceActionModal 사용처:
  * "등 번호 강제 변경" 버튼 → ForceActionModal mode="jersey" (input 0~99 + 사유 textarea 선택)
  * "회원 강제 탈퇴" 버튼 → ForceActionModal mode="withdraw" (사유 textarea 필수 1자+)
  * 1단계 단일 모달 (운영 패턴) — busy 처리 중 닫기 방지

### §8 — TeamDetail.jsx (팀 상세)
- Hero Avatar 박스 width / height 150% 확대 (기존 대비)
- 모바일에서도 비례 유지 (var(--s-*) 단위 일관)

### §7 — PasswordInput 4 사용처 교체:
- screens/Login.jsx — 비밀번호 필드 → PasswordInput (autoComplete="current-password")
- screens/Signup.jsx — 비밀번호 필드 → PasswordInput (autoComplete="new-password")
- screens/EditProfile.jsx — 비밀번호 변경 영역:
  * 현재 비밀번호 → PasswordInput (autoComplete="current-password")
  * 새 비밀번호 → PasswordInput (autoComplete="new-password")
- screens/Settings.jsx — danger 섹션 (회원 탈퇴 시 재인증) → PasswordInput

PasswordInput 컴포넌트 표준 (Phase A.5 §7 박제됨):
- Material Symbols Outlined visibility / visibility_off (fontSize 20)
- tabIndex={-1} (Tab 건너뜀)
- paddingRight: 44 (보기 버튼 공간)
- iOS 16px input (자동 줌 차단)

### §10 — 5 모달 background 토큰 일원화 + Match.jsx (tournaments/join)
- 5 모달 (dormant / jersey-change / withdraw / transfer / team-join) background:
  * `var(--surface)` (미정의) 또는 `var(--color-card)` (폐기) → `var(--bg-card)` 직접
- dropdown max-width: calc(100vw - 32px) 모바일 overflow 보완
- placeholder 5단어 이내 + "예) " prefix 제거 (06 §4)
- screens/Match.jsx (tournaments/join 영역) grid:
  * `repeat(2, 1fr)` → `auto-fit minmax(140px, 1fr)` (모바일 분기 자동)

자체 검수 (Phase A.5 100% 완료 시 모두 통과):
□ Profile.jsx — 소속 팀 카드 히어로 아래 풀 width / row 마크업 (좌 정보 / 우 stack 액션) / MemberPendingBadge 좌하단
□ TeamManage.jsx — 본인 row MemberPendingBadge / dropdown overflow visible / ForceActionModal jersey+withdraw 두 모드 사용처
□ TeamDetail.jsx — Hero Avatar 150% 확대 / 모바일 비례
□ Login.jsx / Signup.jsx — 비밀번호 필드 PasswordInput 교체 + autoComplete 분리
□ EditProfile.jsx — 현재/새 비밀번호 두 PasswordInput
□ Settings.jsx — danger 섹션 재인증 PasswordInput
□ Match.jsx — tournaments/join grid auto-fit minmax(140px) / 5 모달 background var(--bg-card) / placeholder 5단어
□ 8 screens 모두 var(--*) 토큰만 / hex 직접 X / `--surface` `--color-*` 잔존 0
□ 06-self-checklist.md §1~§5 모두 통과 (특히 §4 카피 / §5 모바일)
□ AppNav 13 룰 영향 0 (헤더 변경 X)

산출 형식:
- BDR-current/screens/ 안의 8 파일 직접 수정
- components.jsx — Profile / TeamManage 에서 import 하는 컴포넌트 (MemberPendingBadge / TeamsListCard 패턴) 검증
- 변경 요약 보고:
  * 8 screens 갱신 영역
  * components.jsx 신규 / 갱신된 컴포넌트 (MemberPendingBadge / ForceActionModal 사용처)

후속 (Phase A.5 완료 후):
- PM 검수: PC 1440 / tablet 900 / mobile 366 viewport 모두 검증
- Phase A.6 진입 (메인 9 탭 목록 5 페이지 운영 역박제)

작업 진행 OK.
```

---

## 🚨 PM 후속 (Phase A.5 100% 완료 시)

```bash
# Phase A.5 완전 완료 검수 명령
cd "C:\0. Programing\mybdr\Dev\design\BDR-current"

# 1. PasswordInput 4 사용처 교체 검증
grep "PasswordInput" screens/Login.jsx screens/Signup.jsx screens/EditProfile.jsx screens/Settings.jsx
# 기대: 각 파일에 ≥1 (Settings 는 danger 섹션 1)

# 2. ForceActionModal 사용처 (TeamManage)
grep "ForceActionModal" screens/TeamManage.jsx
# 기대: ≥2 (jersey + withdraw)

# 3. MemberPendingBadge (Profile + TeamManage)
grep "MemberPendingBadge\|badge--soft" screens/Profile.jsx screens/TeamManage.jsx
# 기대: 각 파일 ≥1

# 4. 폐기 토큰 잔존 0
grep -nE "var\(--surface\)|var\(--color-" screens/ components.jsx tokens.css
# 기대: 빈 출력 (--color-* 는 deprecated 주석 안에만)

# 5. "예) " placeholder 잔존
grep -n "예) " screens/ components.jsx
# 기대: 0
```

PM 시각 검수:
- BDR-current/MyBDR.html 라우터 진입 — Profile / TeamManage / TeamDetail / Login / Signup / EditProfile / Settings / Match 모두 정상 노출
- 라이트 / 다크 둘 다
- 모바일 366px 검증

## 🛠 Phase A.5 100% 완료 후 Cowork 후속

```
"Phase A.5 클로드 디자인 시안 100% 완료. src/ 운영 마이그레이션 진행해줘:

§3+§11 — AppDrawer:
- src/components/bdr-v2/app-drawer.tsx + globals.css 의 .drawer / .drawer__group / .drawer-backdrop 룰 박제
- PC 1440 / tablet 900 / mobile 366 검증

§4~§10 — screens 적용 잔여 (이미 운영에 박제된 컴포넌트라 검증만):
- src/app/(web)/profile/_v2/teams-list-card.tsx (소속 팀 카드)
- src/app/(web)/teams/[id]/_components_v2/member-pending-badge.tsx (4종 신청 뱃지)
- src/app/(web)/teams/[id]/manage/_components/force-action-modal.tsx (강제 액션)
- src/components/bdr-v2/password-input.tsx (5 사용처 검증)
- 5 모달 background var(--bg-card) 검증

검증: grep 'var(--surface)' src/ → 0 / grep 'var(--color-*' src/ 영향 영역 → 0"
```
