# 대회 영역 UI/UX 점검 리포트 — Phase 1 재계획 (2026-05-25)

> **의뢰**: 수빈 — "사용자와 관리자간 연결성이 강화된 UI/UX 흐름을 만들 수 있도록 계획 다시 세워보자"
> **선행 자료**: `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (오늘 작성된 관리자 측 10 시안 의뢰)
> **본 리포트 위치**: 위 의뢰의 **상위 계획서** (Phase 1 재구성). 관리자 의뢰는 그대로 유지하되, 사용자 측 + 양측 연결 다리를 추가.
> **사용자 결정 (이번 답변)**:
> - 작업 단위 = **대회 통합 (Phase 1) → 경기 통합 (Phase 2)**
> - 산출물 범위 = **현재 구현 점검 리포트만** (디자인 브리프 / CLI 프롬프트는 본 리포트 승인 후 별도)
> - 전면교체 적극도 = **적극 제안** (깨끗하게 다시 잡기)

---

## 0. 30초 요약 (Executive Summary)

1. **오늘 작성된 관리자 의뢰 (10 시안) 는 그대로 유지** — S1~S9 9 사각지대 해소 방향 정확. 단 관리자 단독 시안이라 **사용자 측 / 양측 연결성** 누락.
2. **사용자 측 박제는 외형은 A 등급이지만 흐름은 끊겨 있음** — `/tournaments` 목록 (B), `/tournaments/[id]` 상세 (A), `/join` (A) 까지는 박제되어 있으나 **신청 후 → 승인 알림 → 대진 발표 → 경기 결과 → 종료 발표** 의 시간 축이 한 페이지에 묶이지 않음.
3. **사용자↔관리자 연결 갭 7건 발견 (B1~B7)** — 이 중 5건은 양측 시안을 같이 잡지 않으면 해소 불가. 관리자 측만 고치면 사용자에게 변경이 전달되지 않음.
4. **권장 = 관리자 의뢰 (Phase 1A) + 사용자 측 / 연결 다리 의뢰 (Phase 1B) 를 짝으로 진행**. Phase 1B 신규 시안 5건 + 수정 시안 4건 제안. 경기 (Phase 2) 는 후속.

---

## 1. 작업 범위 정의 (이번 사용자 결정 반영)

| 구분 | 결정 | 영향 |
|------|------|------|
| 단위 | Phase 1 = 대회 + 대회관리자 통합 / Phase 2 = 경기 + 경기관리 통합 | Phase 1 안에서 사용자/관리자 한 묶음으로 계획 |
| 산출물 범위 | 현재 구현 **점검 리포트만** | 본 문서. 디자인 브리프 / CLI 프롬프트는 본 리포트 승인 후 별도 |
| 전면교체 | **적극 제안** | 부분수정으로 살리기 애매한 화면 = 전면교체 권장 (근거 명시) |

→ **본 리포트가 답하는 질문**: "Phase 1 (대회 영역) 에서 어떤 화면을 그대로 두고 / 부분수정하고 / 전면교체할 것인가, 그리고 사용자↔관리자 연결을 어떻게 다리 놓을 것인가."

---

## 2. 현재 구현 인벤토리 (3 분할)

### 2-A. 사용자 영역 — `src/app/(web)/tournaments/` (7 라우트)

| 라우트 | 박제 등급 | 핵심 컴포넌트 | 데이터 출처 |
|--------|---------|-------------|------------|
| `/tournaments` | **B** (시안 미적용 신호) | `tournaments-filter` + 카드 list | `GET /api/web/tournaments` |
| `/tournaments/[id]` | **A** (`_v2` 적용) | `tournament-hero` / `tournament-tabs` / `tournament-sidebar` / `tournament-about` / `series-card` / `my-registration-status` / `gnba-rules` / `divisions-view` / `division-schedule-table` | `GET /api/web/tournaments/[id]` |
| `/tournaments/[id]/bracket` | **A** | `bracket-view` / `match-card` / `round-column` / `finals-sidebar` / `group-standings` / `league-schedule` / `league-standings` / `tournament-dashboard-header` | `GET /api/web/tournaments/[id]/bracket` (or `/public-bracket`) |
| `/tournaments/[id]/schedule` | (확인 필요) | `schedule-timeline` | 매치 데이터 |
| `/tournaments/[id]/teams` | (확인 필요) | `division-group-composition` | 참가팀 데이터 |
| `/tournaments/[id]/join` | **A** (`_v2` 적용) | `enroll-stepper` / `enroll-aside` / `enroll-poster` / `enroll-step-docs` | `POST /api/web/tournaments/[id]/join` |
| `/tournaments/[id]/referee-request` | A | RefereeRequest.jsx (시안) | 심판 요청 API |

**관찰**:
- 상세/대진/신청은 `_v2` 박제 완료. **목록 페이지만 legacy** (BDR-current 의 `Match.jsx` 박제 미적용 → `--color-*` 잔존 가능성).
- `/teams`, `/schedule` 은 페이지는 존재하지만 시안 매핑이 명시되지 않음 → 박제 상태 불명확.
- `my-registration-status` 컴포넌트가 상세 안에 있음 = **신청 후 결과를 별도 페이지가 아닌 상세 페이지의 한 섹션으로 보여주는 구조**. 이게 좋은지 / 분리해야 하는지가 B1 갭.

### 2-B. 관리자 영역 — `src/app/(web)/tournament-admin/` (24 페이지)

| 그룹 | 라우트 | 시안 | 박제 |
|------|--------|------|------|
| 진입 | `/tournament-admin` | AdminTournamentAdminHome.jsx | A |
| 진입 | `/tournament-admin/tournaments` | AdminTournamentAdminList.jsx | A |
| 단체 | `/tournament-admin/organizations(/new/[orgId]/[orgId]/members)` | (없음) | E |
| 시리즈 | `/tournament-admin/series(/new/[id]/[id]/edit/[id]/add-edition)` | (부분) | C/E |
| 대회 생성 | `/wizard` (4 진입점: Quick / Legacy / Prospectus / 협회) | 일부 | A/E |
| 대회 hub | `/[id]` (셋업 hub + 8 카드) | AdminTournamentSetupHub.jsx | A |
| 대회 설정 | `/[id]/(wizard/divisions/teams/bracket/site)` | 5건 | A |
| 대회 운영 | `/[id]/(matches/playoffs/admins/recorders)` | matches/admins/recorders A / **playoffs 시안 X (G1)** | A/C |
| 종료 | `/[id]` (status='completed') | (없음 — S5) | **신규 시안 필요** |
| 템플릿 | `/templates` | (없음) | E |

**관찰**:
- 오늘 (2026-05-25) 작성된 관리자 의뢰가 위 갭 (S1~S9 / G1~G3) 을 모두 다룸. **본 리포트는 이를 중복 제안하지 않음** — 의뢰 그대로 진행 OK.
- 단 의뢰의 모든 시안이 **관리자 단독 화면**. 사용자에게 어떻게 보이는가는 다루지 않음.

### 2-C. 슈퍼관리자 영역 — `src/app/(admin)/admin/`

| 라우트 | 역할 | 시안 |
|--------|------|------|
| `/admin/tournaments` | 전체 대회 감시 list | AdminTournaments.jsx |
| `/admin/tournaments/[id]/audit-log` | 감사 로그 | AdminTournamentAuditLog.jsx |
| `/admin/tournaments/[id]/transfer-organizer` | 주최자 이관 | AdminTournamentTransferOrganizer.jsx |

→ E 등급 / 토큰 일치만 요구. 본 Phase 1 의 직접 대상 아님 (감시 도구).

### 2-D. 서브도메인 사이트 — `src/app/(site)/_site/*`

| 라우트 | 역할 |
|--------|------|
| `_site` / `[[...path]]` / `registration` / `results` / `schedule` / `teams` | 대회별 독립 공개 사이트 (`site-templates/classic`) |

→ E 등급 / 박제 외. 단 **공식 발표 (대진 / 결과) 의 또 다른 출구** 이므로 B5 / B6 갭과 연계.

### 2-E. 데이터 모델 (Prisma)

```
Tournament — organizer / series / champion_team / mvp_player / 17 status enum
TournamentAdminMember — user × tournament × role × permissions(JSON)
TournamentTeam — team × tournament × seed / group / status / payment_status
TournamentMatch — home/away/winner team × tournament × 점수 / 기간 / 상태
tournament_bracket_versions — 대진 버전 (승인자/생성자, 히스토리)
```

→ **payment_status 있는데 사용자 측 결제 UX 미확인** = B3 갭. **bracket_versions 히스토리 있는데 변경 알림 X** = B5 갭.

---

## 3. 기존 관리자 의뢰 (2026-05-25) 와의 관계

| 기존 의뢰 (10 시안) | 본 리포트 판단 |
|-------------------|--------------|
| A1 진입점 통합 CTA (목록) | **유지** ✅ |
| A2 QuickCreate sub-tab | **유지** ✅ |
| A3 협회 4-step 강화 | **유지** ✅ |
| B1 셋업 hub depends_on 시각화 | **유지** ✅ + B4 (참가팀 진행도 미러) 보강 권장 |
| C1 검증 banner 표준화 | **유지** ✅ + 사용자 측에 "공개 게이트" 정보 미러 (B7) |
| C2 다중 종별 발견성 | **유지** ✅ + 사용자 측 종별 진입 (B2) 같이 잡기 |
| D1 종료 hub (신규) | **유지** ✅ + **사용자 측 종료 발표 시안 (B6) 신규 필요** |
| E1 playoffs (신규) | **유지** ✅ + 사용자 측 playoffs 표시 (B5) 같이 잡기 |
| E2 prospectus (신규) | **유지** ✅ (사용자 측 영향 0 — admin 전용) |

→ **결론**: 기존 10 시안 모두 유지. 본 리포트는 **사용자 측 4 시안 + 연결 다리 5 시안** 을 추가 제안 = Phase 1 총 19 시안.

### 3-1. 두 의뢰의 공통 정책 (admin 의뢰 §4~§6 재확인)

| 항목 | admin 의뢰 (Phase 1A) | 본 리포트 (Phase 1B) | 주의 |
|------|---------------------|---------------------|------|
| **운영 코드 변경** | **0** (시안 박제만) | **0** (시안 박제만) | 운영 박제는 별도 Phase 1C — 본 리포트 §6 Step 5 |
| **산출물 위치** | `Dev/design/BDR-current/screens/` 단일 폴더 (CLAUDE.md §🗂️ 단일 폴더 룰) | **같은 폴더** — 사용자 측 시안도 `screens/` 에 추가 | 새 `BDR vX.Y/` 폴더 직접 생성 ❌ — Claude.ai 가 zip 으로 전달 후 §🗂️ 워크플로우 5단계 |
| **§1 AppNav 적용** | **적용 외** (E 등급 자체 영역 — 별도 sidebar) | **강제 적용** (A 등급 — 03 frozen 카피 의무) | Phase 1B 의 위반 검수 4 케이스 (00 §회귀 방지) 모두 적용 |
| **§2 더보기 5그룹** | 가짜링크 신규 0 (어드민 sidebar 도 동일) | **강제 적용** — 가짜링크 4건 (gameResult / gameReport / guestApps / referee) 추가 ❌ | `/my-status` 신규 라우트는 더보기 메뉴 신규 추가 X — 마이페이지 sub-link 또는 상세 페이지 진입으로만 |
| **§6 카피** | 어드민 일반 라벨 (격식) | **시안 우선** — "서울 3x3 농구 커뮤니티" / "다음카페" 보존 가능 / About 운영진 실명 ❌ | 우승팀 / MVP 표기 = 데이터 출처 (`champion_team.name` / `mvp_player.nickname`) — 박제 카피와 별개 |
| **§7 모바일 (720px / iOS 16px / 44px)** | **강제 적용** | **강제 적용** | 동일 |
| **§3 디자인 토큰** | `var(--*)` 100% / hex 0 / lucide-react 0 | **동일 강제** | Phase 1B 가 더 엄격 — A 등급은 03 frozen 카피 의무 |

### 3-2. S9 (AppNav 정합) vs 본 리포트 B7 (공개 게이트 비대칭) 의 관계

admin 의뢰 부록 A 에서 **S9 = "운영 박제 단계에서 별도 처리 — 본 의뢰 외"** 로 deferred. 본 리포트의 B7 과 비슷해 보이지만 **별개 갭**:

- **S9** = 사용자가 본인이 운영자임을 어디서 인지하는가 (어드민 진입점 발견성 / 네비게이션 정합) — **운영자 ↔ 어드민 화면** 연결
- **B7** = 관리자가 publish 한 대회 상태가 사용자 목록에 어떻게 보이는가 (status 뱃지 / 게이트 미리보기) — **데이터 상태 ↔ 사용자 노출** 연결

→ S9 는 admin 의뢰처럼 deferred (운영 박제 Phase 에서 별도) / B7 은 Phase 1B 시안에 포함 (관리자 셋업 hub 보강 + 사용자 목록 뱃지 신규).

---

## 4. 사용자↔관리자 연결성 갭 7건 (B1~B7) ⭐ 본 리포트 핵심

> 각 갭마다 **현 상태 / 사용자 시나리오 (비유) / 양측 시안 매핑** 정리.

### B1. 신청 → 승인/거절 결과 통보 흐름 끊김 (★★★★★)

- **현 상태**: 사용자가 `/join` → `TournamentTeam.status='pending'` 생성. 관리자가 `/[id]/teams` 에서 승인/거절 → status 변경. **단 사용자에게 알림이 어떻게 전달되는지 명시된 화면 없음**. `my-registration-status` 컴포넌트가 대회 상세 안에만 존재 → 사용자가 상세를 다시 들어와야 결과 확인.
- **시나리오**: "신청서 냈는데 됐는지 안 됐는지 모르겠다. 마이페이지 / 알림 / 메시지 어디를 봐야 하나?"
- **비유**: 우체국에 등기 보냈는데 수신 확인이 발신자 본인이 우체국에 다시 가야만 나옴.
- **양측 시안**:
  - 사용자: **(신규) `/tournaments/[id]/my-status` 또는 마이페이지 "내 대회" 섹션** — 신청 상태 카드 (pending / approved / rejected / waitlist / paid 등 5+ 상태)
  - 관리자: B1 의 status 변경 시 **알림 발송 액션** 명시 (기존 `/[id]/teams` 에 "승인+알림 보내기" 토글)
  - 알림 표준 = `/notifications` 에 actionUrl 로 `/tournaments/[id]/my-status` 또는 상세 페이지 deep-link

### B2. 종별 진입 비대칭 (★★★★)

- **현 상태**: 관리자는 `/[id]/divisions` 에서 종별 박제 (C2 신규 시안). 사용자는 상세 페이지 `divisions-view` 안에서 종별 표시. **단 종별별 직접 진입 URL 없음** (`/tournaments/[id]?division=U10` 같은 deep-link 부재 추정).
- **시나리오**: "강남구협회장배 U12 우리 아들 경기만 보고 싶은데 매번 종별 선택 다시 해야 한다."
- **비유**: 백화점 안내 책자에서 매번 1층부터 들어와서 4층 키즈관 찾아야 함.
- **양측 시안**:
  - 사용자: 상세 / 대진 / 일정 / 팀 모든 탭에 **종별 selector 영구 노출** + URL state (`?division=...`) 동기화
  - 관리자: C2 시안의 종별 카드에서 **공개 URL 미리보기** 표시 (이 종별 사용자는 이 화면을 본다)

### B3. 결제 흐름 사용자 측 부재 (★★★★)

- **현 상태**: `TournamentTeam.payment_status` 필드 존재. 단 사용자 측 결제 페이지 / 결제 상태 카드 라우트 미확인. `Pricing/Checkout` 은 멤버십 결제용 (별 영역).
- **시나리오**: "참가비 어떻게 내요? 계좌이체? 무통장? 카드?"
- **비유**: 식당 주문서는 받았는데 계산대 위치를 안 알려줌.
- **양측 시안**:
  - 사용자: **신청 step 마지막 (`enroll-stepper`) 에 결제 step 명시 + 사후 `/tournaments/[id]/my-status` 에 결제 상태 카드** (미결제 / 결제 완료 / 환불 신청)
  - 관리자: 기존 `/[id]/teams` 에 payment_status 컬럼 + 일괄 확인 toggle (수동 입금 확인 케이스)
  - DB 가드 = payment_method enum 미정의 시 `'manual_transfer'` 기본 — 운영 코드 확인 필요 (B3 시안 전 별도 점검)

### B4. 참가팀 ↔ 셋업 hub 진행도 미러 (★★★)

- **현 상태**: 관리자 셋업 hub 8 카드 중 4번 "팀" 카드가 `/[id]/teams` 로 이동. 단 카드 안에 "현재 N팀 / 정원 M팀" 진행도 표시 약함 (B1 의뢰에서 다룸).
- **시나리오**: "정원 다 찼나? 빨리 신청해야 하나?" (사용자) / "정원의 몇 % 찼는지 한눈에 보고 싶다" (관리자).
- **비유**: 영화관 잔여좌석 표시.
- **양측 시안**:
  - 사용자: 목록 카드 + 상세 hero 에 **정원 progress + 마감일 카운트다운** 표시
  - 관리자: B1 의뢰의 셋업 hub progress bar 안에 동일 수치 표시 (양측 동일 진실원천)

### B5. 대진 변경 알림 부재 (★★★★)

- **현 상태**: `tournament_bracket_versions` 테이블이 변경 이력 기록. 단 사용자 측 "이전 대진과 달라졌어요" 알림 / diff UI 없음. 사용자가 우연히 새로고침해야 변경 인지.
- **시나리오**: "어제 우리 팀이 1번 시드였는데 오늘 3번 시드? 언제 바뀐 거지?"
- **비유**: 시간표가 말없이 바뀐 학교.
- **양측 시안**:
  - 사용자: `/tournaments/[id]/bracket` 상단에 **"마지막 갱신: 5분 전 / 버전 v3"** + 본인 팀 변경 시 알림 push
  - 관리자: E1 playoffs 시안 + `/bracket` 에서 publish 시 **"참가팀 N명에게 알림 보내기" 체크박스** 명시

### B6. 종료 발표 사용자 측 부재 (★★★★★)

- **현 상태**: 기존 의뢰 D1 (AdminTournamentCompleted) = 관리자 측 종료 hub. 단 **사용자 측 종료 상태 시안 없음**. 사용자가 우승팀 / MVP / 전체 standings 를 어디서 보는가? — 상세 페이지가 그대로 표시되는지, completed 전용 페이지가 따로 있는지 불명확.
- **시나리오**: "지난 주말 우리 동네 대회 누가 우승했어? 사진은 어디?"
- **비유**: 결혼식 끝났는데 신부 사진을 어디서 보는지 모름.
- **양측 시안**:
  - 사용자: **(신규) `/tournaments/[id]` 의 completed variant** — hero = 우승팀 + MVP + 트로피, 본문 = 최종 standings + 베스트5 + 사진 갤러리 + 알기자 카드
  - 관리자: D1 의뢰의 "결과 박제" 카드 완료 즉시 사용자 측 변경 반영 (revalidate)
  - 서브도메인 사이트 (`_site/results`) 와의 우선순위 / 동기화 룰 명시 필요

### B7. 공개 게이트 정보 비대칭 (★★★)

- **현 상태**: 관리자 셋업 hub 에 "공개 게이트" (모든 필수 완료 시만 publish 활성) 표시. 단 사용자 측 목록에서 draft 상태 대회가 어떻게 보이는지 불명확. status enum 17 종 중 어떤 게 사용자에게 노출되는가?
- **시나리오**: "어제 등록한 우리 대회 왜 사용자 목록에 안 떠?" (관리자)
- **비유**: 가게 오픈 준비 중인데 손님이 문 앞에서 어리둥절.
- **양측 시안**:
  - 사용자: 목록 페이지에 **상태별 뱃지 명확** (모집 중 / 예선 진행 / 본선 진행 / 종료)
  - 관리자: 셋업 hub publish 버튼 옆에 **"현재 사용자에게 어떻게 보이는지" 미리보기 link** (별 탭으로 사용자 목록 카드 형태 표시)

---

## 5. 화면별 판단 표 (유지 / 부분수정 / 전면교체)

> 사용자 결정 = **적극 제안**. 따라서 흐름 단절 (B1~B7) 에 직접 관여하는 화면은 우선적으로 전면교체 권장.

### 5-A. 사용자 측 화면 (7 라우트)

| 라우트 | 현 등급 | 판단 | 근거 |
|--------|--------|------|------|
| `/tournaments` (목록) | B (legacy) | **전면교체** | _v2 미적용 / 카드 형식이 B7 상태 뱃지 / B4 정원 progress 수용 불가 / B6 종료 표시 어색 |
| `/tournaments/[id]` (상세) | A | **부분수정** | hero/tabs/sidebar/about/series 골격 유지. B2 종별 selector 영구화 + B4 정원 + B7 상태 보강 |
| `/tournaments/[id]/bracket` | A | **부분수정** | bracket-view / match-card 골격 유지. B5 버전 표시 + 본인 팀 하이라이트 추가 |
| `/tournaments/[id]/schedule` | (불명확) | **선검증 → 판단** | 박제 매핑 확인 필요. 미박제면 신규 시안. 박제면 부분수정 |
| `/tournaments/[id]/teams` | (불명확) | **선검증 → 판단** | 위와 동일. division-group-composition 재활용 가능성 큼 |
| `/tournaments/[id]/join` | A (_v2) | **유지** + 결제 step 추가 | enroll-stepper 골격 OK. B3 결제 step 추가만 |
| `/tournaments/[id]/referee-request` | A | **유지** | 골격 OK. 관리자 측 카운터파트만 확인 (R1 별도) |
| **(신규) `/tournaments/[id]/my-status`** | — | **신규 시안 필요** | B1 핵심 화면. 마이페이지 "내 대회" 와 진입 일원화 권장 |
| **(신규) `/tournaments/[id]` (completed variant)** | — | **신규 시안 필요** | B6 핵심 화면. 같은 라우트 status 분기 |

### 5-B. 관리자 측 화면 (24 페이지)

→ 기존 의뢰 (2026-05-25) 의 10 시안 그대로 진행. 본 리포트가 추가 권장하는 4 시안:

| 시안 | 라우트 | 판단 | 근거 |
|------|--------|------|------|
| `AdminTournamentTeams.jsx` 보강 | `/[id]/teams` | **부분수정 (보강)** | B1 알림 액션 + B3 payment_status 컬럼 + B4 진행도 카드 |
| `AdminTournamentBracket.jsx` 보강 | `/[id]/bracket` | **부분수정 (보강)** | B5 publish 시 알림 체크박스 + 버전 히스토리 view |
| `AdminTournamentSetupHub.jsx` 보강 | `/[id]` | **B1 의뢰 외 추가 보강** | B7 "사용자 미리보기" link 카드 |
| (신규) `AdminTournamentRefereeRequests.jsx` | `/[id]/referee-requests` | **신규 시안** | 사용자 referee-request 의 관리자 카운터파트 (현재 라우트 부재 가능성 — 별 검증) |

### 5-C. 슈퍼관리자 / 서브도메인

| 화면 | 판단 | 근거 |
|------|------|------|
| `/admin/tournaments/*` | **유지** | E 등급 감시 도구. 본 Phase 직접 대상 X |
| `_site/*` | **유지** + 서브도메인 vs 메인 우선순위 룰 문서화 | B6 종료 발표 시 메인과 서브도메인 모두 갱신되어야 — sync 룰 별도 결정 필요 |

---

## 6. 권장 다음 단계 (실행 순서)

```
[Step 0] 본 리포트 사용자 승인 ◀ ← 현재 위치
   ↓
[Step 1] 선검증 (작업 시간 30분 이내)
  - /schedule, /teams 박제 상태 grep (--color-* / _v2 존재 여부)
  - payment 라우트 / referee-request 관리자 카운터파트 존재 여부 확인
  - bracket_versions 사용자 노출 여부 확인
   ↓
[Step 2] 사용자 측 + 연결 다리 의뢰 문서 작성 (=Phase 1B)
  - 위치: Dev/design/prompts/tournament-user-redesign-prompt-2026-05-XX.md
  - 형식: 기존 admin 의뢰 (2026-05-25) 와 동일 (3장 = 페이지 / 4장 = 13 룰 / 5장 = 사용자 결정 / 6장 = 산출물)
  - 포함: 사용자 측 4 시안 (목록 전면교체 / 상세 보강 / my-status 신규 / completed variant 신규) + 양측 보강 4 시안 (teams / bracket / setup / referee-requests)
   ↓
[Step 3] 사용자 결재 후 Claude.ai Project 에 의뢰 전달
  - Phase 1A (기존 admin 의뢰) + Phase 1B (이번 신규 의뢰) 묶음 전달
  - Claude.ai 가 새 zip 생성 (BDR v2.17 또는 동일 v2.16 갱신)
   ↓
[Step 4] BDR-current sync (CLAUDE.md §🗂️ 5단계)
   ↓
[Step 5] === Phase 1C 운영 박제 시작 (별 Phase) ===
   - Phase 1A / 1B 모두 시안만 → 여기서 비로소 src/ 운영 코드 박제
   - Phase 1A (관리자 시안 10) PR 그룹 = AdminTournamentAdminList / SetupHub / Matches / Divisions / Playoffs / Completed / Prospectus / Wizard 그룹 (~7~10 PR)
   - Phase 1B (사용자 + 보강 9) PR 그룹 = TournamentsList / Detail / Bracket / MyStatus(신규) / Completed variant / Teams 보강 / Bracket 보강 / SetupHub B7 보강 / RefereeRequests(신규)
   - 총 ~16~19 PR 묶음. dev → subin 전략 + subin → dev → main 결재 (CLAUDE.md 워크플로우)
   ↓
[Step 6] Phase 2 (경기 + 경기관리) 동일 절차 — 별도 점검 리포트로 시작
```

→ **이번 사용자 승인 항목**:
1. 본 리포트 권장 (사용자 측 4 시안 + 연결 다리 4 시안) 으로 가는가, 다른 방향이 있는가
2. 선검증 작업 (Step 1) 을 별도 한 번에 처리하고 결과 받아볼 것인가, 의뢰 문서 작성 (Step 2) 안에 포함할 것인가
3. /schedule, /teams 박제 상태가 미확인이라 일부 판단이 "선검증 → 판단" 으로 남아있음 — 이 부분 처리 방향

---

## 7. 13 룰 / 사용자 결정 §1~§8 충돌 점검

> 본 리포트의 권장 사항이 **00-master-guide.md §13 룰** 및 **01-user-design-decisions.md §1~§8** 과 충돌하는지 사전 점검.

| 권장 사항 | 충돌 가능 룰 | 점검 결과 |
|---------|-------------|----------|
| 사용자 목록 페이지 **전면교체** | §1 AppNav frozen / §3 (디자인 토큰) | AppNav 는 03 frozen 코드 그대로 카피 — 본문만 신규. 충돌 0 ✅ |
| `/tournaments/[id]/my-status` **신규 라우트** | §1 AppNav 9 탭 변경 X / §2 더보기 가짜링크 X | 신규 라우트지만 더보기 / AppNav 변경 없이 상세 페이지 sub-link 또는 마이페이지 진입 → 충돌 0 ✅ |
| 상세 페이지 **completed variant** | §1 / §3 / §7 모바일 | 같은 라우트 status 분기 — 신규 라우트 추가 0 → 충돌 0 ✅ |
| B2 종별 selector 영구 노출 | §7 모바일 (720px) | 모바일에서 selector = 가로 스크롤 칩 패턴 권장 (이미 시안 검증된 패턴) → 충돌 0 ✅ |
| B5 대진 버전 표시 / 본인 팀 하이라이트 | §3 토큰 | `var(--accent)` 하이라이트 / `var(--ink-mute)` 부가 텍스트 — 충돌 0 ✅ |
| B6 우승팀 hero + MVP / 사진 갤러리 | §6-1 카피 / §6-2 운영진 실명 ❌ | 우승팀명 / MVP명 = 데이터 출처 (Tournament.champion_team / mvp_player) — 운영진 실명과 별개 → 충돌 0 ✅ |
| B7 사용자 미리보기 link | §1 AppNav | 관리자 셋업 hub 내 link → 새 탭으로 사용자 목록 페이지 진입. AppNav 변경 0 → 충돌 0 ✅ |
| 관리자 시안 (Phase 1A) 의 어드민 sidebar | §1 AppNav | E 등급 자체 영역 (별도 셸) — §1 적용 외 → 충돌 0 ✅ |

→ **결론**: 모든 권장 사항이 13 룰 / 사용자 결정 §1~§8 통과. PM 결재 필요 항목 0.

### 위반 검수 4 케이스 (00 §회귀 방지) — 시안 의뢰 단계에서 재확인

- ❌ main bar 우측에 "더보기 ▼" / "RDM" 아바타 노출 — Phase 1B 시안 작업 시 검수
- ❌ 모바일 듀얼 다크 라벨 — Phase 1B 시안 작업 시 검수
- ❌ 검색·쪽지·알림 박스 — Phase 1B 시안 작업 시 검수
- ❌ main bar 우측 아이콘 순서 변경 — Phase 1B 시안 작업 시 검수

→ 사용자 측 시안은 AppNav 가 포함되므로 본 항목 4건 모두 03-appnav-frozen-component.md 카피 의무.

---

## 8. 다음 산출물 후보 (이번 리포트 후속)

본 리포트 승인 후 작성 예정 (사용자 결재 시 별도 작업):

1. **`Dev/design/prompts/tournament-user-redesign-prompt-2026-05-XX.md`** (Phase 1B 시안 의뢰)
   - 사용자 측 4 시안 + 양측 보강 4 시안 의 상세 요구사항 + 자체 검수 매트릭스
   - 기존 admin 의뢰 (2026-05-25) 와 동일 형식

2. **CLI 실행 프롬프트 (`.claude/prompts/phase-1-cli-batch-2026-05-XX.md`)**
   - Step 1 선검증 명령 / Step 4 BDR-current sync 명령 / Step 5 운영 박제 PR 그룹
   - CLI 가 명령 그대로 카피해서 실행할 수 있는 형태

3. **Phase 2 (경기) 점검 리포트** (별 세션)
   - 본 리포트와 같은 형식 — 인벤토리 / 갭 / 판단 / 다음 단계

---

## 부록 A — Phase 1 시안 합산 (총 19건)

### Phase 1A (관리자 단독 — 2026-05-25 의뢰)
- 수정 7: AdminTournamentAdminList / Wizard1Step / WizardAssociation / SetupHub / Matches / Divisions / (components.jsx)
- 신규 3: AdminTournamentPlayoffs / Completed / Prospectus

### Phase 1B (사용자 + 연결 다리 — 본 리포트 신규 제안)
- 사용자 전면교체 1: TournamentsList (`/tournaments`)
- 사용자 부분수정 2: TournamentDetail (`/tournaments/[id]`) / TournamentBracket (`/[id]/bracket`)
- 사용자 신규 2: TournamentMyStatus (`/[id]/my-status`) / TournamentCompleted (상세 status='completed' variant)
- 양측 보강 (관리자 측) 3: AdminTournamentTeams 보강 / AdminTournamentBracket 보강 / AdminTournamentSetupHub B7 보강
- 신규 (관리자 측) 1: AdminTournamentRefereeRequests
- 사용자 선검증 후 판단 2: TournamentSchedule / TournamentTeams

→ Phase 1B 가 **확정 8 시안 + 선검증 후 결정 2 시안** = 최대 10 시안 추가.

## 부록 B — 사용자↔관리자 연결성 시각화

```
사용자 여정                          연결점 (B번호)              관리자 여정
─────────────                       ─────────                  ─────────────
1. 대회 발견                                                    1. 대회 생성 (A1/A2)
   /tournaments  ◀──── B7 게이트 ────────────────────────────  /wizard
   /tournaments/[id]                                              /[id] (셋업 hub B1)
            │                                                          │
            ▼                                                          ▼
2. 신청 ──── B3 결제 ────────────────────────────────────────  2. 종별 / 팀 설정
   /[id]/join                                                       /[id]/divisions (C2)
            │                                                       /[id]/teams (보강)
            ▼                                                          │
3. 신청 결과 확인 ◀── B1 알림 ──────────────────────────────────  3. 승인/거절 결정
   /[id]/my-status (신규)                                            /[id]/teams (액션)
            │                                                          │
            ▼                                                          ▼
4. 종별 / 본인 팀 확인 ◀── B2 종별 / B4 정원 ──────────────────  4. 대진표 발표
   /[id] (종별 selector)                                            /[id]/bracket (보강)
   /[id]/bracket                                                      │
            │                                                          ▼
            ▼                                                       5. 경기 운영 (라이브)
5. 경기 보기 ◀── B5 변경 알림 ──────────────────────────────────  /[id]/matches (C1)
   /[id]/bracket (버전 표시)                                          /[id]/playoffs (E1)
   /[id]/schedule                                                      │
            │                                                          ▼
            ▼                                                       6. 종료 처리
6. 결과 발표 ◀── B6 종료 발표 ──────────────────────────────────  /[id] (completed D1)
   /[id] (completed variant 신규)                                     - 결과 박제
            │                                                          - 통계 / 알기자 / 사진
            ▼
   /_site/results (서브도메인 — 우선순위 룰 결정 필요)
```

---

## 부록 C — 본 리포트 작성 과정 메모 (다음 세션 참고)

- 작성 근거 = `Dev/design/claude-project-knowledge/00-master-guide.md` + `04-page-inventory.md` + `06-self-checklist.md` + Explore agent 가 본 `src/app/(web)/tournaments/`, `tournament-admin/`, `api/web/tournaments/`, `prisma/schema.prisma` + 기존 admin 의뢰 (`tournament-admin-redesign-prompt-2026-05-25.md`) 전문 1~617 line + `.claude/scratchpad.md` 의 planner-architect 분석.
- **재확인 (admin 의뢰 후반부 추가 반영)**: §3-1 두 의뢰의 공통 정책 표 / §3-2 S9 vs B7 구분 / §6 Step 5 Phase 1C 운영 박제 분리.
- 본 리포트는 **운영 코드 변경 0** 가정. Phase 1 박제 / 시안 작업만.
- "선검증 → 판단" 으로 남은 항목 (5-A 의 /schedule, /teams) 은 본 리포트 승인 후 Step 1 에서 처리.
- 본 리포트 자체 검수 = §7 (13 룰 / 사용자 결정 §1~§8) 통과 확인 완료. PM 결재 필요 항목 0.
