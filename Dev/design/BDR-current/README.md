# BDR v2.29 — Phase 9 (알림·메시지·검색) 박제

> **박제일**: 2026-06-07
> **선행**: Phase 1~8 완료 carry-over
> **선행 의뢰**: `notify-message-search-user-redesign-prompt` + `notify-admin-redesign-prompt` + `notify-message-search-connectivity-plan` (2026-06-07)
> **특수**: messages 모델 없음 (DB 0%) → 정적 더미 carry + "준비 중" / NotifCategory main bar 카운트 동기화

---

## 1. Phase 9 박제 시안 = 4 (사용자 3 + super-admin 1)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| NU1 | Notifications | `/notifications` | 보강 | BN1 ★★★★ (카테고리 chip + 카운트 동기화) |
| NU2 | Messages | `/messages` | 보강 carry | BN2 ★★★ (3컬럼 · DB 미지원 "준비 중") |
| NU3 | Search | `/search` | 보강 carry | BN3 ★★★ (cross-domain Phase 1~8) |
| NA1 | AdminNotifications | `/admin/notifications` | **신규** | BN4 ★★ (발송 form + 모달 · Site Operator) |

---

## 2. BN 양측·cross-domain 의존 검증 ✅

| BN | 등급 | 의존 | 데이터 |
|----|------|------|--------|
| BN1 | ★★★★ | NU1 카테고리 | NotifCategory enum + main bar 카운트 (전 Phase) |
| BN2 | ★★★ | NU2 carry | (단독 · DB 미지원 정적 더미) |
| BN3 | ★★★ | NU3 검색 | Phase 1~8 결과 진입 link (game/tournament/team/court/user/community) |
| BN4 | ★★ | NA1 발송 → NU1 수신 | notifications.* (target 분리) |

---

## 3. carry-over (변경 ❌)

### 파일 — v2.28 그대로
- `tokens.css` / `shell.css` / `shared.jsx` / `team·org·comm·profile·billing·growth·auth·court-shared.*` (OperatorBadge / oa1-* / pm-chip / gw-soon·gw-ph / bl-modal / cv-xlink) / `admin.css`
- Phase 1~8 = 모든 wrapper + jsx + _baseline carry-over (운영 코드 변경 0)

### 신규 추가
- `notify-shared.jsx` — Phase 9 mock (NOTIF_CATS / NOTIFICATIONS / MSG_THREADS·CONVO / SEARCH_CATS·RESULTS·RECENT·SUGGEST / NA1_TARGETS·HISTORY·STATS) + mini components (NotifIcon / CatBadge / MsgAvatar)
- `notify-shared.css` — Phase 9 전용 (.nt-* : ico / catbadge / chiprow·chip / card / msg-shell·thread·convo·bubble·rail / searchbar / result / na-grid·target·preview·hist)
- `screens/Notifications.jsx` (NU1) / `Messages.jsx` (NU2) / `Search.jsx` (NU3) / `AdminNotifications.jsx` (NA1)
- 4 wrapper HTML (nu1~nu3 / na1)

---

## 4. 자체 검수 — 13 룰 + Phase 9 특수 3 통과 ✅

### 13 룰
- ✅ 하드코딩 색상 = 토큰만 (예외: 카테고리 gold #FBF0D6/#B47A11 = trophy 토큰 / 메시지 스레드 아바타 색 = 정적 더미 carry 운영 박제값)
- ✅ lucide-react = 0 · Material Symbols Outlined 만
- ✅ 9999px = 알림 카테고리 chip + 메시지 unread 점 + 검색 recent chip 한정 (main-bar dot 스타일 · 버튼/카드 아님 — 룰 12는 button/card 4px 대상)
- ✅ 가짜링크 = 0 · button 4px / 카드 8px · placeholder 5단어 이내
- ✅ iOS input 16px (.nt-searchbar / .nt-msg-search / .pm-input) / 버튼 44px / 720px 분기
- ✅ Pretendard + Archivo + JetBrains Mono 만
- ✅ AppNav frozen — 사용자 시안(NU1~3) active="more" (알림/검색은 더보기 그룹) · NA1 standalone

### Phase 9 특수 3
- ✅ **NU1 main bar 카운트 동기화** — 상단 알림 아이콘 빨간 점 카운트 = unread 합계 (안내 + 카테고리별 chip count)
- ✅ **NU2 "준비 중" warn-soft tone** — gw-ph / gw-soon 재사용 (Phase 6.3 GU2 답습) · DB 미지원 제거 ❌
- ✅ **NU3 카테고리 chip = Phase 1~5 cross-domain** — 경기/대회/팀/코트/유저/커뮤니티 결과 → 각 Phase list 진입

---

## 5. 회귀 방지 ✅
- ❌ Phase 1~8 시안 변경 = 0 · 새 라우트 = 0 · messages 모델 신설 = 0
- ✅ NA1 모달 = Phase 2 UD1 답습 (발송 confirm "X명에게 발송" · 활동 로그 기록)
- ✅ NotifCategory = NU1 표시 + NA1 발송 동일 enum (tournament/game/team/community/system)

---

**박제 끝.** v2.28 carry-over 위 신규 4 시안 + notify-shared.jsx/css 추가. 운영 코드 변경 0.
가정: messages = DB 0% 정적 더미 carry + "준비 중"(운영 지침 — 제거 금지) · 검색 결과 = mock · main bar 카운트 = 안내 텍스트(실 연동은 운영 시점).
