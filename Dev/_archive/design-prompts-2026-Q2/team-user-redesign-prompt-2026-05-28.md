# 클로드 디자인 의뢰 — 팀 사용자 측 + 사용자↔관리자 연결 다리 (Phase 3B)

> **의뢰일**: 2026-05-28
> **상위 계획서**: `team-user-admin-connectivity-plan-2026-05-28.md` (BT1~BT8 갭)
> **선행 박제**: Phase 1 (대회 v2.19) + Phase 2 (경기 v2.20) 박제 + sync 완료
> **본 의뢰 범위**: 5 시안 (TU1~TU5) — 사용자 측 + 양측 다리
> **차이 의뢰서**: `team-admin-redesign-prompt-2026-05-28.md` (Phase 3A · 관리자 측 2 시안)

---

## 0. 진입 표준 절차 (claude-project-knowledge/00 §3)

1. Project Knowledge 9 파일 읽기 — 13 룰 인지
2. 의뢰서 §7 형식 첫 응답
3. 사용자 결정 §1~§8 보존 / AppNav frozen 03 카피
4. 자체 검수 06 §[해당 섹션]
5. Phase 1A/1B/2 시안 carry-over (변경 ❌) 가드 — BDR-current/ 안 17 + 10 = 27 jsx + 6 css + game-shared.jsx 그대로 유지

---

## 1. 한 줄 요약

`/teams/manage` (TU3 신규) + `/teams/[id]/manage` (TU4 신규 · 5 탭 통합) + `/teams` (TU1 보강) + `/teams/[id]` (TU2 보강) + `/profile/activity` (TU5 UC1 위 보강) = **5 시안**. Phase 1 + Phase 2 와 양측 의존 (BT1/BT6/BT7) 일관성 유지.

---

## 2. 결재 룰 (사용자 결정 §1~§8 + Phase 3 신규)

### Phase 3 추가 결재 룰 (2026-05-28)
- ✅ **BT1 가입 신청 데이터 모델 = 통일**: TU4 큐 row = TU5 "내 신청" 단계 = 동일 `team_join_requests.status`
- ✅ **BT3 휴면 룰 = 통일**: 3개월 미활동 (`last_activity_at` 기준) = TU4 후보 ↔ TU5 알림 = 동일 룰
- ✅ **BT4 임원 권한 노출 = 통일**: TU2 sidebar "내 권한" ↔ TU4 권한 위임 탭 = 동일 `TeamOfficerPermissions` 필드
- ✅ **BT5/BT7 매치/대회 CTA = TU2 sidebar 안 "운영 액션" 카드** (캡틴/매니저 본인만)
- ❌ **신규 라우트 ❌**: TU3 = `/teams/manage` 기존 / TU4 = `/teams/[id]/manage` 기존. 더보기 가짜링크 추가 ❌
- ❌ **운영 코드 phase 명명 (Phase 4 PR12 / Phase 5 PR14 등) 변경 ❌**: 기존 박제된 컴포넌트 (`_components_v2/` 8 + `_v2/` 6 + manage `_components/` 4) 명명 유지

---

## 3. 5 시안 사양

### TU1 — Teams (list · 보강) · `/teams`

**현황**: v2 박제 ✅ (TeamsContentV2 488 line) — 검색 헤더 / 카드 그리드 / 필터 부분 미완

**보강**:
- BT2 필터 보강 — 지역 (city/district) / 모집 중 (`accepting_members=true`) / 매너 ★ (BT6 답습) / 최근 활동 / 규모 (멤버 수)
- BT1 가입 CTA 일관 — 카드 안 "가입 신청 N 명 대기" 뱃지 (super-admin 시야면 카운트 / 일반 사용자 시야면 hide)
- 추천 영역 — "내 지역 활성 팀 5" (city 매칭 + last_activity_at < 30일 + accepting_members=true)
- 빈 상태 — "아직 팀이 없어요" + /teams/new CTA (시안 보존)

### TU2 — TeamDetail (상세 · 보강) · `/teams/[id]`

**현황**: v2 박제 ✅ (366 line + _components_v2/ 8 컴포넌트 — Hero / Tabs / Overview/Roster/Recent/Stats / SideCard / Join 등)

**보강**:
- TU2-A · Hero 보강 — Phase 2 BG7 답습 sticky 라이브 띠 (이 팀의 진행 중 경기 있을 시 chip 표시 / 0건 hide)
- TU2-B · sidebar "운영 액션" 카드 신규 (캡틴/매니저 본인만 노출)
  - "이 팀으로 대회 참가" → /tournaments?filter=open&team_id=[id]
  - "이 팀 멤버 경기 신청" → /games?host_team_id=[id]
  - "팀 매치 신청 받기" → /teams/[id]/manage?tab=match-requests
- TU2-C · sidebar "내 권한" 카드 신규 (멤버 본인만 노출) — captain / vice / manager / member 시각 + 권한 한 줄 ("멤버 승인 가능" 등)
- TU2-D · stats 탭 보강 — 대회 우승 이력 카드 (Phase 1A PA7 답습) + MVP 멤버 카드 (Phase 2 BG4 답습)
- TU2-E · "가입 신청" CTA = 신청 후 step indicator (Phase 2 UA2 BG1 답습) — 3 step (신청 / 캡틴 검토 / 승인)

### TU3 — TeamManage (운영 팀 hub · 신규) · `/teams/manage`

**현황**: 357 line · 0/1/N 분기 명시된 운영 hub (현재 시각 부족)

**시안 (신규 박제)**:
- Hero band — "운영 중인 팀 N 개"
- N=0 분기 → 빈 상태 + /teams (둘러보기) + /teams/new (등록) 2 CTA
- N=1 분기 → 자동 redirect (코드 logic 기존 유지 / 시안 UI 0)
- N≥2 분기 → 카드 그리드 (팀 카드 + role badge + 멤버 수 + 최근 활동 + 진행 중 신청 N 건)
- 각 카드 클릭 → `/teams/[id]/manage` 진입

### TU4 — TeamManageDetail (개별 팀 관리 · 신규) · `/teams/[id]/manage`

**현황**: 2292 line 거대 페이지 — 멤버 / 가입 신청 / 권한 / 유령 / 탈퇴 모두 1 페이지

**시안 (신규 박제 · 5 탭 통합)**:

```
[탭 1] 멤버 (기본 탭)
  - 멤버 list 카드 (jersey / role / last_activity_at / 매너 ★)
  - 본인 (캡틴) 액션: jersey 변경 강제 / 휴면 강제 / 탈퇴 강제 (force-action-modal 박제 ✅)
  
[탭 2] 가입 신청 (BT1) — ?tab=requests
  - 큐 카드 (Phase 2 UD1 답습) — 신청자 닉네임/지역/실력/메시지
  - 처리 모달 = 승인/거절 + "사용자에게 알림 보내기" 체크박스 기본 ✅ (Phase 2 UD1 답습)
  - auto_accept_members=true 안내 배너 (자동 승인)
  
[탭 3] 변경 신청 (BT2) — ?tab=member-requests
  - TeamMemberRequest list — jersey_change / dormant / withdraw 3 종 필터
  - type 별 처리 모달 — 시안의 기존 modal (jersey-change-request-modal / dormant-request-modal / withdraw-request-modal) 박제 답습
  
[탭 4] 권한 위임 (BT4) — ?tab=officers (captain only)
  - 부캡틴/매니저 list + 권한 토글 (TeamOfficerPermissions)
  - "권한 위임" 모달 (체크박스 list)
  
[탭 5] 활동 / 유령 (BT3) — ?tab=ghosts (captain or ghostClassify)
  - last_activity_at 3개월+ 후보 list
  - "휴면 알림 보내기" / "강제 탈퇴" CTA
  - 탈퇴 멤버 이력 (WithdrawnMembersSection 답습)

[하단 탭 6] 매치 신청 (BT5) — ?tab=match-requests
  - 받은 매치 list — 수락/거절 처리
```

상단 = 팀 hero 미니 (Hero + 멤버 수 + 활동도) / Tab bar = horizontal scroll 모바일

### TU5 — UC1 MyActivity 보강 · `/profile/activity`

**현황**: 881 line + Phase 2 BG6 ("내 경기" + "내 매너") + Phase 1B "내 대회" 보강 누적

**Phase 3 보강** (UC1 위에 "내 팀" 섹션 추가):

```
상단 카운트 = "내 대회 N · 내 경기 M · 내 팀 K · 평균 매너 X.Y"

[섹션 1] 내 팀
  - 카드 list = 내가 멤버인 팀 (active + dormant)
  - 각 카드: 팀 logo / name / role badge / 최근 활동 / 매너 ★
  - 본인 캡틴/매니저면 = 진행 중 신청 N건 (BT1) + 변경 신청 N건 (BT2) 카운트 chip
  
[섹션 2] 내 신청 (BT1+BT2 통합)
  - 팀 가입 신청 본인 status (pending/approved/rejected) — step indicator
  - 멤버 변경 신청 본인 status (jersey/dormant/withdraw)
  - 빈 상태 = "신청 내역이 없습니다"
  
[섹션 3] 휴면 예정 (BT3)
  - last_activity_at 60일+ 이고 90일 미만 = "휴면 예정 D-N" 카드
  - "활동 트래커" 위젯 — 본인 last_activity_at trigger (경기 신청 / 매니저 활동 등)
  - 0건 = 섹션 hide
```

---

## 4. 양측 의존 검증 (박제 마지막 단계 의무)

| BT | 사용자 측 (본 의뢰) | 관리자 측 (team-admin) | 데이터 모델 |
|----|-------------------|---------------------|-----------|
| BT1 | TU4 가입 신청 탭 + TU5 "내 신청" 카드 | (TA1 통계만) | `team_join_requests.status` |
| BT2 | TU4 변경 신청 탭 + TU5 "내 변경 신청" | (다리 없음 — 팀 내부) | `TeamMemberRequest.status` |
| BT3 | TU4 유령 후보 + TU5 "휴면 예정" | TA1 활동도 분포 | `TeamMember.last_activity_at` |
| BT4 | TU4 권한 위임 + TU2 sidebar "내 권한" | (다리 없음) | `TeamOfficerPermissions` |
| BT5 | TU4 매치 신청 탭 + TU2 sidebar 진입 | (다리 없음) | team-match-request API |
| BT6 | TU2 stats 보강 | TA1 통계 hub | `wins/losses/draws` |
| BT7 | TU2 sidebar "운영 액션" → cross-domain | (Phase 1/2 영역) | `TournamentTeam` + `games` |

→ 박제 후 = 같은 row → 같은 단계 / 같은 평균 / 같은 색상 시각 검증.

---

## 5. 13 룰 + AppNav frozen + 사용자 결정 §1~§8 (00 §13 룰 답습)

(중복 — 의뢰서 §0 진입 표준 절차 참조)

### 본 의뢰 특수 가드
- ❌ AppNav 9 탭 변경 ❌ (frozen)
- ❌ 새 라우트 ❌ (TU3 = `/teams/manage` / TU4 = `/teams/[id]/manage` 기존)
- ❌ 운영 코드 phase 명명 변경 ❌ (Phase 4 PR12 / Phase 5 PR14 박혀 있는 명명 유지)
- ✅ Phase 1A/1B/2 시안 (BDR-current/ 안 17 + 10 = 27 jsx + 6 css + game-shared.jsx) carry-over (변경 ❌)
- ✅ BT1 가입 신청 모달 = Phase 2 UD1 패턴 답습 ("사용자 알림 ✅ 체크박스 기본 ✅" / "변경 + 알림" CTA)
- ✅ BT5 매치 신청 모달 = 기존 team-match-request-modal.tsx 답습 (시각만 갱신)

---

## 6. 자체 검수 (06 §자체 검수)

매 시안 박제 후:
- ❌ main bar 우측 "더보기 ▼" / 아바타 = 0
- ❌ 모바일(≤768px) 듀얼 라벨 = 0
- ❌ 검색·쪽지·알림 box (.btn 박스) = 0
- ✅ main bar 5 아이콘 순서 = [다크, 검색, 쪽지, 알림, 햄버거]
- ❌ 하드코딩 색상 = 0 (var(--*) 변수만)
- ❌ lucide-react = 0 (Material Symbols Outlined 만)
- ❌ rounded-full / 9999px = 0
- ❌ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
- ✅ button 4px / 카드 6~8px
- ✅ placeholder 5단어 이내 / "예: " 시작 ❌
- ✅ 720px / 16px / 44px

---

## 7. 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — 팀 사용자 측 + 양측 연결 다리 (Phase 3B)

이해: TU1~TU5 = 5 시안 (Teams list 보강 + TeamDetail 보강 + TeamManage 신규 hub + TeamManageDetail 5탭 통합 + UC1 "내 팀" 보강).
양측 의존 = BT1 (가입 신청 모델) + BT3 (휴면 룰) + BT6 (통계) + BT7 (cross-domain).
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피 / 13 룰 인지 / Phase 1/2 carry-over (변경 ❌).
자체 검수: 06 §사용자 hub / 카드 / 탭 / 모달
작업 시작.
```

---

**의뢰서 끝.** Claude.ai 가 본 의뢰서 첫 응답 → 박제 → zip 회신.
