# Phase 6.1 — 프로필·마이페이지 본체 Claude.ai 의뢰 (단일 paste)

> **선행**: Phase 1~5 박제 + 운영 반영 완료
> **본 의뢰**: 6 시안 (사용자 5 + super-admin 1) · 본 의뢰 = Phase 6.1 본체 / 후속 = 6.2 결제·구독 + 6.3 성장 분석

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

### Step 1 — Claude.ai 세션 + 4 건 drag-drop

**첨부 zip**:
- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase6.1-baseline-2026-05-30.zip` (405KB / 127 파일)
- v2.23 + `_phase61_operational_refs/` 7 운영 파일 (PU1~PU5 + PA1 + Prisma spec)

**의뢰서 3 건**:
1. `profile-user-admin-connectivity-plan-2026-05-30.md` (BP1~BP6 갭)
2. `profile-user-redesign-prompt-2026-05-30.md` (Phase 6.1B · 5 시안)
3. `profile-admin-redesign-prompt-2026-05-30.md` (Phase 6.1A · 1 시안)

→ **★ 첨부 4건 모두 drag-drop 확인 후 paste**.

### Step 2 — 아래 §메시지 본체 paste

---

## 메시지 본체 (paste 용 — ``` 블록 전체 복사)

```
Phase 6.1 — 프로필·마이페이지 본체 리디자인 의뢰 (총 6 시안 + 양측 다리 6 BP) 시작합니다.

[선행]
- Phase 1~5 박제 + 운영 반영 완료 (#654/#655 머지 · Phase 5 박제 v2.23)
- 첨부 zip = BDR v2.23 (BDR-current/ = 45 jsx + 7 css + 4 shared 공통 + _baseline/ 10)

[상위 계획서]
profile-user-admin-connectivity-plan-2026-05-30.md (BP1~BP6 = 6 갭)

[★ 본 Phase 특수성]
영역 거대 (~8800 LOC / 16 sub-page) → 분할 의뢰
- Phase 6.1 = 본체 6 시안 (PU1~PU5 + PA1) ← 본 의뢰
- Phase 6.2 후속 = 결제·구독·예약 (별 의뢰)
- Phase 6.3 후속 = 성장 분석 (별 의뢰)

[의뢰서 2건 — 첨부]
1. profile-user-redesign-prompt-2026-05-30.md (Phase 6.1B · 사용자 5 = PU1+PU2+PU3+PU4+PU5)
2. profile-admin-redesign-prompt-2026-05-30.md (Phase 6.1A · super-admin 1 = PA1)

[첨부 zip 안]
BDR-current/ — Phase 1~5 박제 결과 v2.23 그대로
_phase61_operational_refs/ — Phase 6.1 운영 reference 7 파일:
  - PU1 운영 (profile head/tail · 831 line)
  - PU2 운영 (edit head/tail · 1689 line · 거대)
  - PU3 운영 (basketball head/tail · 1068 line)
  - PU4 운영 (achievements 105 line full)
  - PU5 운영 (users/[id] head/tail · 769 line · 공개 프로필)
  - PA1 운영 (admin users 152 line full)
  - PRISMA_user_models_spec.md

[Phase 6.1 박제 시안 = 6]

사용자 측 (PU1~PU5 · A 등급):
- PU1 ProfileMain 보강 /profile · BP1 본인↔공개 정합 + BP6 UC1 활동 진입 (Phase 13 박제 그대로 carry + 시각 보강만)
- PU2 ProfileEdit 보강 /profile/edit · BP4 작은 시각만 (v2.3 박제 거대 carry · 결제 섹션 = 6.2 link out 안내)
- PU3 ProfileBasketball 신규 박제 /profile/basketball · BP2 ★★★★ 농구 캐릭터 + 시즌 stat + 선호 chip + Phase 2/3 cross-domain (MVP + wins)
- PU4 ProfileAchievements 보강 /profile/achievements · BP3 user_badges grid + Phase 1A PA7 우승 자동 표시 + Phase 2 BG4 MVP 누적
- PU5 UserPublicProfile 신규 박제 /users/[id] · BP1 ★★★★★ 공개 시야 (privacy_settings 필터 / 본인=PU1 redirect 또는 preview)

관리자 측 (PA1 · E 등급 · super-admin):
- PA1 AdminUsers 신규 박제 /admin/users · BP5 Hero stat + 4 탭 + 검색 필터 + 모달 (Phase 4 OA1 + Phase 5 CA1 답습 · Site Operator)

[2026-05-30 결재 룰]
- BP1 정합 = PU1 본인 + PU5 공개 = 동일 User 데이터 / privacy_settings 분기로 시각 분리
  본인 시야 = "프로필 편집" CTA / 공개 시야 = "팀 초대" "1:1 메시지" CTA / 비공개 필드 (이메일/은행/결제) PU5 hide
- BP2 = PU3 = UserSeasonStat + Phase 2 final_mvp_user_id 30일 + Phase 3 Team.wins cross-domain
- BP3 = PU4 = user_badges + Phase 1A Tournament.champion_team_id (captain_id=me 또는 team_members.user_id=me)
- BP4 = PU2 = 거대 v2.3 carry-over / 시각 작은 변경만 / 결제 섹션 = Phase 6.2 link out + "준비 중"
- BP5 = PA1 = Phase 4 OA1 답습 (Site Operator + Phase 2 UD1 알림 + Phase 3 TA2 모달)
- BP6 = PU1 → UC1 (1575 line · Phase 1~5 누적 박제됨) 자연 link / 카운트 동기화
- 운영 미지원 (정지 사유 별 컬럼 / 신고 등) = hide + "준비 중" / mock 0
- AppNav 변경 ❌ / 새 라우트 ❌ / Phase 1~5 carry-over (변경 ❌)
- 본인 자기 정지 ❌ (PA1 가드) / isAdmin 사용자 액션 별 가드 (운영 미확인 시 별 의뢰)

[작업 흐름 요청]
1. 첫 응답 = 의뢰서 2건 §7 형식
   ✅ Phase 6.1B 사용자 (PU1~PU5)
   ✅ Phase 6.1A 관리자 (PA1)

2. 박제 순서:
   사용자 측: PU4 (작음) → PU1 보강 → PU3 신규 (가장 중요) → PU5 신규 → PU2 보강 (거대 / 시각 작은 변경만)
   관리자 측: PA1 (작음)

3. 박제 완료 → 새 zip 회신 (BDR v2.24/ 예상)

4. 13 룰 위반 시 reject + 알림

[양측 의존 갭 검증 — 박제 마지막 단계]
- BP1: PU1 (본인) + PU5 (공개) = 같은 User 데이터 / privacy_settings 필터 정확 / 비공개 필드 hide 일관
- BP2: PU3 시즌 stat = UserSeasonStat 실 데이터 + Phase 2 (final_mvp_user_id 30일) + Phase 3 (Team.wins cross-domain · 본인 소속 팀)
- BP3: PU4 = user_badges + Tournament.champion (자동) + Phase 2 MVP 누적
- BP6: PU1 상단 카운트 = UC1 활동 카드 카운트 = 동일 source (game_applications + team_join_requests + community_posts + 등)

[자체 검수 4 + 8 + Phase 6 특수 4]

4 frozen + 8 self — Phase 5 답습.

Phase 6 특수 4 케이스:
- ✅ BP1 본인/공개 분기 시각 일관 (PU1 == PU5 같은 데이터 다른 시각)
- ✅ PU3 5 stat 카드 + 8 preferred chip 모바일 responsive
- ✅ PU2 거대 carry-over (1689 line) 시각 변경 최소 (LOC 신규 +200 이하)
- ✅ PA1 Site Operator badge + 본인 자기 정지 가드

[질문/가정 처리]
- 댓글 / 신고 모델 미확인 = 박제 시 점검 (있으면 시안 / 없으면 hide)
- isAdmin 사용자 검수 = 별 super-super-admin 가드 (운영 미확인 시 본 의뢰 외)
- 결제·구독·예약·성장·주간 리포트 영역 = Phase 6.2/6.3 후속 / 본 의뢰 영향 0

시작해 주세요.
```

---

## 예상 첫 응답

```
✅ Phase 6.1B 사용자 (PU1~PU5) — 본인↔공개 정합 + 농구 stat + 업적 + 편집 보강
✅ Phase 6.1A 관리자 (PA1) — Site Operator hub
```

---

## zip 회신 후

```
☐ Cowork 에 "Phase 6.1 zip 도착"
```

→ Cowork 자동 sync 의뢰서 + Phase 6.1C 운영 박제 Auto Chain 의뢰서 작성.

---

**의뢰서 끝.**
