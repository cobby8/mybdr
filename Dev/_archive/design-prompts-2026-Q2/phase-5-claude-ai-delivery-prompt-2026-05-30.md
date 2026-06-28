# Phase 5 — 랭킹·커뮤니티 영역 Claude.ai 시안 박제 의뢰 (단일 paste)

> **목적**: 수빈이 Claude.ai BDR 디자인 시스템 Project 에 한 번 paste 로 Phase 5 (6 시안) 박제 시작
> **작성일**: 2026-05-30
> **선행 완료**: Phase 1~4 모두 박제 + 운영 반영 완료 (#654/#655 머지 / 운영 배포 `6f22c02`)
> **선행 가이드**: `ranking-community-user-admin-connectivity-plan-2026-05-30.md` (BC1~BC7)
> **다음 단계**: Phase 5 zip 회신 후 = Cowork 자동 sync 의뢰서 작성 → CLI sync → Auto Chain 5 운영 박제

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

### Step 1 — Claude.ai 세션 열고 첨부 4 건 업로드

**첨부 zip**:
- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase5-baseline-2026-05-30.zip` (358KB / 114 파일)
- v2.22 박제 결과 (Phase 1~4 cumulative) + `_phase5_operational_refs/` (6 운영 파일 + Prisma spec)

**첨부 의뢰서 3 건**:
1. `Dev/design/prompts/ranking-community-user-admin-connectivity-plan-2026-05-30.md` (점검 리포트)
2. `Dev/design/prompts/ranking-community-user-redesign-prompt-2026-05-30.md` (Phase 5B · 사용자 5 시안)
3. `Dev/design/prompts/ranking-community-admin-redesign-prompt-2026-05-30.md` (Phase 5A · 관리자 1 시안)

→ **★ 첨부 4건 모두 drag-drop 확인 후 paste** (Phase 2 누락 사례 답습 회피).

### Step 2 — 아래 §메시지 본체 그대로 paste

---

## 메시지 본체 — Claude.ai 에 paste (아래 ``` 블록 전체 복사)

```
Phase 5 — 랭킹·커뮤니티 영역 리디자인 의뢰 (총 6 시안 + 양측 다리 7 BC) 시작합니다.

[선행]
- Phase 1 (대회 v2.19) + Phase 2 (경기 v2.20) + Phase 3 (팀 v2.21) + Phase 4 (단체 v2.22) 박제 + 운영 반영 완료 (#654/#655 머지)
- 첨부 zip = BDR v2.22 박제 결과 그대로 (BDR-current/ = 39 jsx + 6 css + game-shared + team-shared + org-shared + _baseline/ 10)

[상위 계획서]
ranking-community-user-admin-connectivity-plan-2026-05-30.md (BC1~BC7 = 7 갭)

[★ 본 Phase 특수성]
2 영역 묶음 = 랭킹 (작은 단위 1 시안 보강) + 커뮤니티 (사용자 4 + super-admin 1 = 5 시안)
3 측 stakeholder = 일반 사용자 + 단독 작성자 (게시글 본인) + super-admin (Site Operator)

[의뢰서 2건 — 첨부]
1. ranking-community-user-redesign-prompt-2026-05-30.md (Phase 5B · 사용자 5 시안 = RU1 + CU1~CU4)
2. ranking-community-admin-redesign-prompt-2026-05-30.md (Phase 5A · CA1 1 시안 · super-admin)

[첨부 zip 안]
BDR-current/ — Phase 1~4 박제 결과 v2.22 그대로
_phase5_operational_refs/ — 운영 reference 6 파일:
  - RU1 운영 (rankings page + rankings-content)
  - CU1~CU4 운영 (community list / detail / new / edit · 거대 CU2/CU4 발췌)
  - CA1 운영 (admin community)
  - PRISMA_rank_community_models_spec.md

[Phase 5 박제 시안 = 6 (사용자 5 + 관리자 1)]

사용자 측 (RU1 + CU1~CU4):
- RU1 Rankings 보강 /rankings · BC1 부문 + BC7 cross-domain (Phase 2 BG4 MVP + Phase 3 BT6 wins 리더)
- CU1 Community list 보강 /community · BC2 카테고리 chip + 대회 알기자 cross-domain (Phase 1A PA9)
- CU2 CommunityDetail 보강 /community/[id] · BC4 좋아요 + 추천 + 메타
- CU3 CommunityNew 신규 박제 /community/new · BC3 5-step 마법사 (Phase 1B UA3 + Phase 4 OU3 답습)
- CU4 CommunityEdit 신규 박제 /community/[id]/edit · BC5 CU3 prefill 답습 (별 컴포넌트 ❌ — 재사용)

관리자 측 (CA1 · super-admin):
- CA1 AdminCommunity 신규 박제 /admin/community · BC6 hero stat + 4 탭 + 모달 (Phase 4 OA1 답습)

[2026-05-30 결재 룰 — 박제 중 반드시 준수]
- BC1 cross-domain = RU1 의 MVP/wins = Phase 2 games.final_mvp_user_id + Phase 3 Team.wins/losses/draws 동일 source
- BC2 cross-domain = CU1/CU2 "대회 알기자" 카테고리 = Phase 1A PA9 prospectus 후속 자동 link
- BC3 마법사 = CU3 5-step = Phase 1B UA3 + Phase 4 OU3 답습 패턴
- BC5 = CU4 = CU3 컴포넌트 재사용 (별 컴포넌트 ❌)
- BC6 super-admin = CA1 = Phase 4 OA1 답습 (Site Operator badge + Phase 2 UD1 알림 모달)
- Phase 1~4 시안 carry-over (변경 ❌)
- 운영 미지원 데이터 (댓글 / 신고 등) = hide + "준비 중" / mock 절대 ❌

[작업 흐름 요청]
1. 첫 응답 = 의뢰서 2건 §7 형식
   ✅ BDR 디자인 의뢰 확인 — Phase 5B 사용자 (RU1 + CU1~CU4)
   ✅ BDR 디자인 의뢰 확인 — Phase 5A 관리자 (CA1)
   각 §7 카피 / 13 룰 / Phase 1~4 carry-over 인지

2. 박제 순서 권장:
   - 사용자 측: RU1 (작음) → CU1 → CU2 → CU3 (가장 큰 5-step 마법사) → CU4 (CU3 재사용)
   - 관리자 측: CA1 (가장 작음 / Phase 4 OA1 답습)

3. 박제 완료 → 새 zip 회신 (BDR v2.23/ 예상)

4. 13 룰 위반 시 reject + 알림

[양측 의존 갭 검증 — 박제 마지막 단계]
- BC1: RU1 "이달의 MVP" = Phase 2 final_mvp_user_id 30일 집계 / "팀 wins 리더" = Phase 3 Team.wins 상위 5
- BC2: CU1 "대회 알기자" 카테고리 = Phase 1A PA9 prospectus 의 후속 게시물 / CU2 본문에 해당 대회 hero badge
- BC3: CU3 5-step = Phase 1B UA3 + Phase 4 OU3 답습 (사후 안내 hero + CTA)
- BC5: CU4 = CU3 동일 컴포넌트 재사용 (prefill 만 다름)

[자체 검수 4 + 8 + Phase 5 특수 4]

4 frozen + 8 self-check — Phase 1~4 답습.

Phase 5 특수 4 케이스:
- ✅ BC1 cross-domain MVP/wins = Phase 2/3 동일 데이터 컬럼 사용 (mock 0)
- ✅ CU3 5-step 마법사 = Phase 1B UA3 + Phase 4 OU3 답습 시각 일관
- ✅ CU4 = CU3 컴포넌트 재사용 (LOC 최소화)
- ✅ CA1 Site Operator badge = Phase 4 OA1 답습 시각

[질문/가정 처리]
- 의뢰서 결정 0 항목 = §7 형식 질문 batch 후 박제
- BC1~BC7 결재 룰 위반 가능성 = 즉시 중단 + 보고
- 댓글 모델 = 운영 미확인 — 박제 시 점검 후 (있으면 시안 / 없으면 hide + "준비 중")

시작해 주세요.
```

→ 위 블록 ``` 사이 본문 paste. Claude.ai 가 §0 진입 표준 절차 따라 첫 응답 → 박제 시작.

---

## 예상 Claude.ai 첫 응답

```
✅ BDR 디자인 의뢰 확인 — Phase 5B 사용자 (RU1 + CU1~CU4)
이해: RU1 보강 (BC1+BC7 cross-domain) + CU1/CU2 보강 + CU3 신규 5-step + CU4 CU3 재사용.
양측 의존 = BC1/BC2/BC3/BC5/BC7.
사용자 결정 §1~§8 / AppNav frozen / 13 룰 / Phase 1~4 carry-over (변경 ❌).
자체 검수: 06 §사용자 hub / 위계 / 모달
작업 시작.

✅ BDR 디자인 의뢰 확인 — Phase 5A 관리자 (CA1)
이해: CA1 /admin/community 신규 (BC6). Hero stat + 4 탭 + 모달 (Phase 4 OA1 답습).
Phase 4 OA1 + Phase 2 UD1 + Phase 3 TA2 답습.
자체 검수: 06 §관리자 hub / 모달
작업 시작.
```

---

## 박제 진행 중 수빈 본인 액션 — 없음

> Claude.ai 박제 대기. 중간 질문 batch 시만 응답.

---

## Phase 5 zip 회신 후 — 수빈 본인 액션 1 단계 (~10초)

```
☐ Claude.ai 가 새 zip (BDR v2 (8).zip 예상) 출력 → Downloads
☐ Cowork 에 한 줄 알림: "Phase 5 zip 도착"
```

→ Cowork mybdr-progress-monitor (매일 09:00) 또는 즉시 알림 시:
1. zip 자동 분석
2. Phase 5 sync 의뢰서 자동 작성 (`phase-5-vX.Y-sync-cli-prompt-YYYY-MM-DD.md`)
3. _cli-queue-status 갱신
4. 사용자에게 CLI 다음 명령 안내

---

## 의뢰서 작성 자체 검수 (Cowork)

- ✅ Step 1 zip 자동 생성 (358KB / 114 파일 / 6 운영 reference 포함)
- ✅ 첨부 4건 drag-drop 룰 명시
- ✅ Step 2 메시지 본체 single paste (~2500자)
- ✅ Phase 1~4 carry-over 명시
- ✅ 2 영역 (랭킹 + 커뮤니티) 묶음 + 3 측 stakeholder 명시
- ✅ BC 양측 의존 검증 박제 마지막 단계 의무
- ✅ 수빈 본인 액션 = 2 단계 (~2분) + zip 도착 후 1 단계 (~10초)

---

**의뢰서 끝.** 수빈이 §⭐ 2 단계 따라 진행.
