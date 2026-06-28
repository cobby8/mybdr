# Phase 3 — 팀(Teams) 영역 Claude.ai 시안 박제 의뢰 (단일 paste 의뢰서)

> **목적**: 수빈이 Claude.ai BDR 디자인 시스템 Project 에 **한 번 paste** 로 Phase 3 (팀 영역 7 시안) 박제 시작
> **작성일**: 2026-05-28
> **작성**: Cowork (mybdr 메인)
> **선행 완료**: Phase 1 (대회 v2.19) + Phase 2 (경기 v2.20) Claude.ai 박제 완료
> **선행 가이드**: `team-user-admin-connectivity-plan-2026-05-28.md` (점검 리포트 + BT1~BT8 갭)
> **다음 단계**: Phase 3 zip 회신 후 = Cowork 가 sync CLI 의뢰서 자동 작성

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

> **Step 1 (zip 묶기) 는 Cowork 가 자동 완료** (2026-05-28). 수빈은 zip 파일을 Claude.ai 에 drag-drop 만 하면 됨.

### Step 1 — Claude.ai 세션 열고 첨부 4 건 업로드

**첨부 zip** (Cowork 가 미리 생성 — Windows 경로):
- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase3-baseline-2026-05-28.zip` (241KB / 80 파일)
- v2.20 박제 결과 그대로 = Phase 1 + Phase 2 누적 시안 + `_phase3_operational_refs/` (5 운영 파일 + Prisma spec)
- `.gitignore` 등록됨 — 로컬 전용 (커밋 ❌)

**첨부 의뢰서 3 건**:
1. `Dev/design/prompts/team-user-admin-connectivity-plan-2026-05-28.md` (점검 리포트 · 우선 첨부)
2. `Dev/design/prompts/team-user-redesign-prompt-2026-05-28.md` (Phase 3B · 사용자 5 시안)
3. `Dev/design/prompts/team-admin-redesign-prompt-2026-05-28.md` (Phase 3A · 관리자 2 시안)

→ **★ 첨부 확인 룰** (2026-05-28 Phase 2 사례 답습): 총 4 첨부 (zip 1 + .md 3) **모두 drag-drop 했는지 시각 확인 후 paste**. 누락 시 Claude.ai 가 질문 batch 발생.

### Step 2 — 아래 §메시지 본체 를 그대로 paste

→ Claude.ai 가 §0 진입 표준 절차 따라 첫 응답 (§7 형식). TA2 라우트 옵션 결재 (옵션 A 모달 권장) 후 박제 시작.

---

## 메시지 본체 — Claude.ai 에 paste (아래 ``` 블록 전체 복사)

```
Phase 3 — 팀(Teams) 영역 리디자인 의뢰 (총 7 시안 + 양측 다리 8 BT) 시작합니다.

[선행]
- Phase 1 (대회 v2.19) 박제 + sync 완료 (2026-05-26)
- Phase 2 (경기 v2.20) 박제 완료 (2026-05-28) — sync 의뢰서 대기 중 (운영 변경 0)
- 첨부 zip = BDR v2.20 박제 결과 그대로 (BDR-current/ 안 27 jsx + 6 css + game-shared.jsx + screens/_baseline/ 10)

[상위 계획서]
team-user-admin-connectivity-plan-2026-05-28.md (BT1~BT8 = 8 갭)

[의뢰서 2건 — 첨부]
1. team-user-redesign-prompt-2026-05-28.md (Phase 3B · 사용자 5 시안 = TU1 + TU2 + TU3 + TU4 + TU5)
2. team-admin-redesign-prompt-2026-05-28.md (Phase 3A · 관리자 2 시안 = TA1 + TA2)

[첨부 zip 안]
BDR-current/ — Phase 2 박제 결과 v2.20 그대로 (Phase 1A/1B/2 시안 27 + game-shared + _baseline/)
_phase3_operational_refs/ — Phase 3 박제용 운영 코드 reference 5 파일:
  - TU3_teams_manage_page.tsx (357 line · 신규 박제)
  - TU4_teams_id_manage_head_300.tsx (head 300 + tail 100 발췌 · 전체 2292 line)
  - TA1_admin_teams_page.tsx + TA1_admin_teams_content.tsx (80 + 200 line · 신규 박제)
  - PRISMA_team_models_spec.md (Team / TeamMember / TeamMemberRequest / 등 8 모델 spec)

[Phase 3 박제 시안 = 7 시안 (사용자 5 + 관리자 2)]

사용자 측 (TU1~TU5 · A 등급):
- TU1 Teams (list 보강) /teams · BT2 필터 + BT1 가입 CTA + 추천
- TU2 TeamDetail (상세 보강) /teams/[id] · BT5/BT6/BT7 진입 + sticky LIVE 띠 (Phase 2 BG7 답습)
- TU3 TeamManage (운영 팀 hub 신규) /teams/manage · 0/1/N 분기
- TU4 TeamManageDetail (개별 팀 관리 신규) /teams/[id]/manage · 5 탭 통합 (멤버/가입신청/변경신청/권한위임/유령)
- TU5 UC1 MyActivity 보강 /profile/activity · "내 팀" 섹션 (BT1/BT2/BT3/BT4)

관리자 측 (TA1~TA2 · E 등급 · super-admin only):
- TA1 AdminTeams (super-admin 팀 hub 신규) /admin/teams · BT8 통계/상태/매너
- TA2 AdminTeamDetail (팀 검수 모달 신규) · 옵션 A 권장 (새 라우트 ❌)

[2026-05-28 결재 룰 — 박제 중 반드시 준수]
- BT1 가입 신청 = TU4 큐 ↔ TU5 "내 신청" = 동일 team_join_requests.status
- BT2 변경 신청 = TU4 변경 탭 ↔ TU5 "내 변경 신청" = 동일 TeamMemberRequest.status (jersey/dormant/withdraw 3 종)
- BT3 휴면 룰 = 3개월 미활동 (last_activity_at 기준) = TU4 후보 ↔ TU5 알림 = 동일 룰
- BT4 임원 권한 = TU4 권한 위임 ↔ TU2 sidebar "내 권한" = TeamOfficerPermissions 동일
- BT5 매치 신청 = TU2/TU4 시각 (기존 team-match-request-modal 답습)
- BT6 통계 = TU2 stats ↔ TA1 통계 = wins/losses/draws 동일
- BT7 cross-domain = TU2 sidebar "운영 액션" (캡틴/매니저만)
  - "이 팀으로 대회 참가" → /tournaments?filter=open&team_id=[id]
  - "이 팀 멤버 경기 신청" → /games?host_team_id=[id]
- BT8 super-admin = TA1 + TA2 = site operator only (Phase 1A PA3 답습)
- Phase 1/2 시안 (27 jsx + 6 css + game-shared.jsx) carry-over (변경 ❌)
- 운영 코드 내부 phase 명명 (Phase 4 PR12 / Phase 5 PR14/15/16 / Phase 8 박제) 변경 ❌

[관리자 측 라우트 결재 필요 — TA2]
TA2 = 팀 검수 상세 화면:
  옵션 A (권장): 모달 (TA1 카드 클릭 → side-panel 모달 · 새 라우트 ❌ · 룰 §2 통과)
  옵션 B: 신규 라우트 /admin/teams/[id] (라우트 1 추가)
→ 권장 = 옵션 A. 사용자 (수빈) 결재 받기 위해 첫 응답에 옵션 질의 후 결재 받고 박제 진행.

[작업 흐름 요청]
1. 첫 응답 = 의뢰서 2건 각각의 §7 첫 응답 형식 (2 응답 또는 1 통합 응답 OK)
   ✅ BDR 디자인 의뢰 확인 — Phase 3B 팀 사용자 측 + 양측 다리 (TU1~TU5)
   ✅ BDR 디자인 의뢰 확인 — Phase 3A 팀 관리자 측 (TA1~TA2)
   각 의뢰서 §7 카피 / 13 룰 인지 / 사용자 결정 §1~§8 보존 / AppNav frozen 03 카피 / Phase 1/2 carry-over 인지

2. TA2 옵션 결재 받기 (수빈 결재 후 박제 진행)

3. 박제 순서 (권장):
   - 사용자 측: TU1 → TU2 → TU3 → TU4 (가장 큰) → TU5 보강
   - 관리자 측: TA1 → TA2 (옵션 결재 후)
   
4. 박제 완료 후 새 zip 회신 (예상: BDR v2.21/ 폴더 포함)

5. 13 룰 위반 발견 시 자체 reject + 알림

[양측 의존 갭 검증 — 박제 마지막 단계 필수]
- BT1: TU4 신청 큐 row = TU5 "내 신청" step indicator = 동일 데이터 모델
- BT3: TU4 유령 후보 룰 = TU5 휴면 예정 알림 룰 = 동일 last_activity_at 기준
- BT6: TU2 stat 카드 = TA1 통계 hub = 동일 wins/losses/draws

[자체 검수 4 + 8 + Phase 3 특수]

4 케이스 (00 §회귀 방지):
- ❌ main bar 우측 "더보기 ▼" / 아바타 = 0
- ❌ 모바일(≤768px) 듀얼 라벨 = 0
- ❌ 검색·쪽지·알림 box (.btn 박스) = 0
- ✅ main bar 5 아이콘 순서 = [다크, 검색, 쪽지, 알림, 햄버거]

8 케이스 (06 §자체 검수):
- ❌ 하드코딩 색상 = 0 (var(--*) 변수만)
- ❌ lucide-react = 0
- ❌ rounded-full / 9999px = 0 (정사각형 W=H 50% OK)
- ❌ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
- ✅ button 4px / 카드 6~8px
- ✅ placeholder 5단어 이내 / "예: " 시작 ❌
- ✅ 720px / 16px / 44px
- ✅ Pretendard + Archivo / JetBrains Mono

Phase 3 특수 (4 케이스):
- ✅ AppNav 5번째 탭 "팀" 활성 시각 (시안 안 navigation 일관)
- ✅ TU3 0/1/N 분기 = 모두 시안 (0=빈 상태 / 1=auto redirect (UI 0) / N≥2=카드 그리드)
- ✅ TU4 5 탭 = ?tab=members/requests/member-requests/officers/ghosts/match-requests (6 sub-tab) 명확
- ✅ TA1 super-admin badge = "Site Operator" 일관 (Phase 1A PA3 답습)

[질문/가정 처리]
- 의뢰서에 결정 0 인 항목 발견 시 = 의뢰서 §7 형식 질문 batch 후 박제 진행
- TA2 라우트 옵션 = 사용자 결재 받기 전 박제 ❌
- 사용자 결정 §1~§8 또는 BT1~BT8 결재 룰 위반 가능성 발견 시 = 즉시 중단 + 보고

시작해 주세요.
```

→ 위 블록 ``` 사이 본문을 Claude.ai 에 paste. Claude.ai 가 의뢰서 §0 진입 표준 절차 따라 첫 응답 + TA2 옵션 질의 → 결재 후 박제 시작.

---

## 예상 Claude.ai 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — Phase 3B 팀 사용자 측 + 양측 다리 (TU1~TU5)
이해: TU1~TU5 = 사용자 측 5 시안 (Teams list 보강 + TeamDetail 보강 + TeamManage 신규 hub + TeamManageDetail 5탭 통합 + UC1 "내 팀" 보강)
양측 의존 = BT1/BT3/BT6/BT7
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피 / 13 룰 인지 / Phase 1/2 carry-over (변경 ❌)
자체 검수: 06 §사용자 hub / 카드 / 탭 / 모달
작업 시작.

✅ BDR 디자인 의뢰 확인 — Phase 3A 팀 관리자 측 (TA1~TA2)
이해: TA1 /admin/teams 신규 박제 (BT8 통계/상태/매너) + TA2 팀 검수 (옵션 결재 필요)
양측 의존 = BT3/BT6/BT8
Phase 1A PA3 super-admin 시각 답습 / Phase 2 UD1 알림 모달 답습 / Phase 2 BG2 매너 룰 답습
자체 검수: 06 §관리자 hub / 통계 / 모달

❓ TA2 라우트 결재 요청:
  옵션 A: 모달 (TA1 카드 클릭 → side-panel · 새 라우트 ❌) · 권장
  옵션 B: 신규 라우트 /admin/teams/[id]
→ 어느 쪽으로 진행할까요?
```

→ 위 형식 안 나오면 = Claude.ai 가 의뢰서 진입 표준 절차 미준수 → 재요청.

---

## 박제 진행 중 수빈 본인 액션 — TA2 옵션 결재 1 회 (~30초)

> TA2 옵션 결재 외 = Claude.ai 가 박제 끝낼 때까지 대기. 중간 질문 batch 오면 응답.

권장 결재 = **옵션 A (모달)** — 사용자 결정 §2 (가짜링크 / 새 라우트 ❌) 룰 답습 + 빠른 검수 UX.

---

## Phase 3 zip 회신 후 — 수빈 본인 액션 1 단계 (~10초)

```
☐ Claude.ai 가 새 zip 출력 → Downloads/ 또는 첨부로 다운로드
☐ Cowork 에 한 줄 알림: "Phase 3 zip 도착 — <파일명>"
```

→ Cowork 가 자동으로:
1. zip vs BDR-current 차이 분석
2. Phase 3 sync CLI 의뢰서 작성 (`phase-3-vX.Y-sync-cli-prompt-2026-05-XX.md` — `phase-2-v2.20-sync-cli-prompt-2026-05-28.md` 답습)
3. 수빈에게 "이 prompt 를 CLI 에 던지세요" 안내

---

## 의뢰서 작성 자체 검수 (Cowork)

- ✅ Step 1 zip 자동 생성 (Cowork bash · 241KB / 80 파일 / 5 운영 reference 포함) — 수빈 PowerShell 단계 ❌
- ✅ Step 1 첨부 4건 (zip + 의뢰서 3) drag-drop 룰 명시 — Phase 2 누락 사례 답습 회피
- ✅ Step 2 메시지 본체 = single paste (~2500자 + BT1~BT8 결재 룰 + 13 룰 + 자체 검수 4+8+Phase 3 특수 4)
- ✅ Phase 1A/1B/2 시안 carry-over (변경 ❌) 가드 명시
- ✅ TA2 라우트 옵션 결재 명시 (옵션 A 권장)
- ✅ 운영 코드 내부 phase 명명 ≠ Cowork phase-ledger 분리 명시 (혼동 방지)
- ✅ 양측 의존 검증 BT1/BT3/BT6 박제 마지막 단계 의무
- ✅ 수빈 본인 액션 = 2 단계 (~2분) + TA2 옵션 1 단계 (~30초) + zip 도착 1 단계 (~10초) = 총 ~3 분

---

## 참조 문서 (Claude.ai 가 본 의뢰 수행 중 항상 곁에 둘 것)

본 의뢰서 paste 시 첨부 zip 안에 모두 포함되어 있음:
1. `BDR-current/` 시안 32 파일 (jsx 26 + css 6) — Phase 1/2 source of truth
2. Project Knowledge 9 파일 (00-master / 03-appnav-frozen / 06-self-checklist 등)
3. 의뢰서 첨부 3건 (connectivity plan + team-user + team-admin)
4. `_phase3_operational_refs/` 5 파일 — TU3/TU4/TA1 운영 코드 reference + Prisma spec

별도 첨부 ❌ — 모두 zip 안.

---

**의뢰서 끝.** 수빈이 §⭐ 2 단계 (+ TA2 옵션 1회) 따라 진행. zip 회신 후 Cowork 가 자동 sync CLI 의뢰서 작성.
