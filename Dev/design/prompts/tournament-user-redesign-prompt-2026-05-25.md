# 클로드 디자인 의뢰 — 대회 사용자 측 + 사용자↔관리자 연결 다리 (Phase 1B)

> **의뢰일**: 2026-05-25
> **수신**: 클로드 디자인 (Claude.ai Project — bdr 디자인 시스템 관리)
> **선행 의뢰**: `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (Phase 1A — 관리자 10 시안)
> **상위 계획서**: `Dev/design/prompts/tournament-user-admin-connectivity-plan-2026-05-25.md` (Phase 1 재계획 + B1~B7 갭 분석)
> **이번 의뢰 (Phase 1B)**: 사용자 측 시안 4 + 연결 다리 (관리자 보강) 3 + 사용자 종료 variant 1 = **8 시안**
> **활성 시안**: `Dev/design/BDR-current/` 단일 폴더 (CLAUDE.md §🗂️ 단일 폴더 룰 — 2026-05-01)
> **운영 코드 변경**: 0 — 시안 박제만 (운영 박제는 별 Phase 1C)

---

## 0. 진입 — 표준 절차 (BDR 디자인 시스템 관리)

**Step 1**: `Dev/design/claude-project-knowledge/00-master-guide.md` 읽기 (13 룰 인지)
**Step 2**: 본 의뢰의 영향 받는 보조 파일 — **01 (사용자 결정 §1~§8) / 02 (토큰) / 03 (AppNav frozen — A 등급 강제) / 04 (페이지 인벤토리) / 06 (자체 검수)**
**Step 3**: 첫 응답 (표준 형식):

```
✅ BDR 디자인 의뢰 확인 — 대회 사용자 측 + 사용자↔관리자 연결 다리 (Phase 1B)
이해: 사용자 측 4 시안 (목록 전면교체 / 상세 보강 / 신청 보강 / 마이페이지 내 대회) + 종료 variant 1 + 관리자 보강 3 = 8 시안
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피 (A 등급 강제 — 위반 검수 4 케이스 적용)
자체 검수: 06 §1, §2, §3, §5, §6 (A 등급) + §7 (관리자 보강 3건 E 등급)
작업 시작.
```

---

## 1. 의뢰 배경 (B1~B7 연결성 갭 — 상위 계획서 §4)

본 의뢰는 **운영 코드 변경 0** / 시안 박제만. 상위 계획서의 7 갭 중 사용자 측 노출 또는 양측 보강이 필요한 갭 5건 (B1/B3/B5/B6/B7) + 사용자 측 단독 갭 2건 (B2/B4) 해소.

### 1-1. B1 — 신청 → 승인/거절 결과 통보 흐름 끊김 (★★★★★)

- 사용자가 `/join` → `TournamentTeam.status='pending'` 생성 / 관리자가 승인 → 사용자는 본인이 다시 상세 페이지 들어가야 확인.
- **선검증 결과**: `/api/web/tournaments/[id]/my-status` API **존재**. `MyRegistrationStatus` 컴포넌트도 `tournament-sidebar` 안에 노출 중. 단 시각적으로 약하고 마이페이지에서는 진입 불가.
- **비유**: 등기 보냈는데 수신 확인이 본인이 우체국에 가야만 나옴.

### 1-2. B2 — 종별 진입 비대칭 (★★★★)

- 관리자는 `/[id]/divisions` 에서 종별 박제. 사용자는 상세 `divisions-view` 안에서 표시되지만 **종별별 deep-link URL 없음**.
- **비유**: 백화점 안내 책자에서 매번 1층부터 들어와서 4층 키즈관 찾기.

### 1-3. B3 — 결제 흐름 사용자 측 부재 (★★★★)

- **선검증 결과**: `enroll-stepper` 에 5단계 (대회확인/디비전/로스터/서류/**결제**) 이미 존재. **단 사후 결제 상태 추적** (미결제 → 결제 완료 → 환불 신청) 의 표시 부재.
- **비유**: 식당 주문서는 받았는데 계산대 위치 / 영수증 보관함 없음.

### 1-4. B4 — 참가팀 ↔ 셋업 hub 진행도 미러 (★★★)

- 관리자 셋업 hub 의 팀 카드 진행도 vs 사용자 목록·상세의 정원 표시가 별 시점·별 톤.
- **비유**: 영화관 잔여좌석 표시.

### 1-5. B5 — 대진 변경 알림 부재 (★★★★)

- **선검증 결과**: `bracket_versions` 테이블 존재 / 사용자 측 노출 **0건**. 사용자가 우연히 새로고침해야 변경 인지.
- **비유**: 시간표가 말없이 바뀐 학교.

### 1-6. B6 — 종료 발표 사용자 측 부재 (★★★★★)

- Phase 1A 의 D1 (관리자 종료 hub) 의 카운터파트 부재. 우승팀 / MVP / 사진 / 알기자 의 사용자 진입 분산.
- **비유**: 결혼식 끝났는데 신부 사진 어디서 보는지 모름.

### 1-7. B7 — 공개 게이트 정보 비대칭 (★★★)

- 관리자 셋업 hub 의 publish gate vs 사용자 목록의 status 뱃지 / 미리보기 부재.
- **비유**: 가게 오픈 준비 중인데 손님이 문 앞에서 어리둥절.

### 1-8. 선검증 결과로 의뢰에서 제외된 항목

| 항목 | 제외 사유 |
|------|---------|
| `/schedule`, `/teams` 별 시안 | 둘 다 고아 라우트 — 상세 페이지 `?tab=` 로 redirect. 상세 시안에 통합 |
| AdminTournamentRefereeRequests (관리자 측 신규) | `tournament-admin` 안에 카운터파트 없음. referee 신청 관리는 `/referee/admin/*` 별 셸 책임. 별 Phase |
| `/api/web/tournaments/[id]/my-status` API 신규 구현 | 이미 존재 (my-registration-status.tsx 의 "TODO" 는 stale 주석) — 본 의뢰는 시안만 / 운영 코드 0 |

---

## 2. 대상 페이지 (영역별 그룹 — 4 영역 / 8 시안)

본 의뢰는 4 영역 / 8 시안 (사용자 4 + 종료 variant 1 + 관리자 보강 3) 으로 묶임.

### 영역 U-A. 사용자 측 (수정/전면교체 — 3 파일)

| 파일 | 라우트 (참고) | 역할 | 박제 등급 | 조치 |
|------|------------|------|---------|------|
| `Match.jsx` (또는 `Tournaments.jsx`) | `/tournaments` | 대회 목록 — 카드 + 필터 + status 뱃지 + 정원 progress | B (legacy / `--color-*` 잔존) | **전면교체** |
| `TournamentDetail.jsx` | `/tournaments/[id]` | 상세 — hero / 5 탭 (overview/schedule/bracket/teams/rules) / sidebar (내 참가 현황) | A | **부분수정** |
| `TournamentEnroll.jsx` | `/tournaments/[id]/join` | 5단계 신청 (대회확인/디비전/로스터/서류/결제) | A | **부분보강** (결제 step 시각 강화 + 사후 안내) |

### 영역 U-B. 사용자 측 신규 (1 파일)

| 파일 | 라우트 (참고) | 역할 |
|------|------------|------|
| `TournamentCompleted.jsx` | `/tournaments/[id]` (status='completed' variant) | 종료 발표 — 우승팀 hero + MVP + 최종 standings + 베스트5 + 사진 + 알기자 카드 |

### 영역 U-C. 마이페이지 통합 (1 파일)

| 파일 | 라우트 (참고) | 역할 |
|------|------------|------|
| `Profile.jsx` 또는 `MyActivity.jsx` 일부 | `/profile` 또는 `/profile/activity` | "내 대회" 섹션 신설 — 신청한 대회 카드 list (pending / approved / 경기중 / 종료) + 각 deep-link |

### 영역 U-D. 관리자 보강 (3 파일 — 기존 시안 갱신)

| 파일 | 라우트 (참고) | 보강 내용 |
|------|------------|---------|
| `AdminTournamentTeams.jsx` | `/tournament-admin/tournaments/[id]/teams` | B1 알림 액션 + B3 payment_status 컬럼 + B4 정원 진행도 카드 |
| `AdminTournamentBracket.jsx` | `/tournament-admin/tournaments/[id]/bracket` | B5 publish 시 알림 체크박스 + 버전 히스토리 view |
| `AdminTournamentSetupHub.jsx` | `/tournament-admin/tournaments/[id]` | B7 "사용자 미리보기" link 카드 (Phase 1A B1 의뢰 위에 추가 보강) |

---

## 3. 각 페이지 상세 요구사항

### 3-UA1. `Match.jsx` (또는 `Tournaments.jsx`) — 대회 목록 (전면교체)

**현재 결함**:
- BDR-current 에 매핑된 시안 없거나 옛 시안. `--color-*` 폐기 토큰 잔존 가능성 (선검증에서 페이지 미박제 확인).
- B7 status 뱃지 약함 / B4 정원 progress 없음 / B6 종료 대회 표시 어색.

**시안 요구사항**:
- **카드 grid** — 카드 1개당:
  - 상단 = 종별 뱃지 + status 뱃지 (모집 중 / 예선 진행 / 본선 진행 / 종료 — `var(--accent)` / `var(--cafe-blue)` / `var(--ok)` / `var(--ink-mute)` 분리)
  - 본문 = 대회명 (Pretendard 700) + 시작일 + 장소
  - 호스트 = 단체 아바타 + 이름
  - 하단 = **정원 progress bar** ("N/M팀 — 마감 D-3" 또는 "종료") — B4 미러
  - 종료 카드 = hero 자리에 우승팀 1줄 ("🏆 강남BC 우승") — B6 미러
- **필터 영역** = 상단 sticky chip row (전체 / 모집 중 / 진행 중 / 종료 / 내 지역) + 검색 input (40 char 이내)
- **상태별 정렬** — 기본 = "마감 임박" / 선택 = "최신 등록" / "종료일 가까운 순"
- **빈 상태** = "조건에 맞는 대회 없음. 다른 필터로 검색해보세요" + 필터 초기화 버튼

**보존 항목**:
- `GET /api/web/tournaments` 응답 시그니처 / 페이지네이션 (현재 동작)
- 클릭 시 `/tournaments/[id]` 이동

**모바일 (≤720px)**:
- 카드 1열 stack
- 필터 chip = 가로 스크롤
- 검색 input 16px (iOS 줌 방지)

**자체 검수 — A 등급 강제**:
- 06 §1 AppNav (03 frozen 카피 / 위반 검수 4 케이스 통과)
- 06 §2 더보기 (가짜링크 신규 추가 ❌)
- 06 §3 디자인 토큰 (var(--*) 100% / `--color-*` 폐기 토큰 사용 ❌)
- 06 §5 모바일 (720px / iOS 16px / 44px)
- 06 §6 연결성 (JSDoc 매트릭스 — 진입 / 복귀 / 에러)

---

### 3-UA2. `TournamentDetail.jsx` — 상세 페이지 (부분수정)

**현재 결함**:
- Hero / 5 탭 / sidebar 골격은 _v2 박제 완료 / B2 종별 selector 영구 노출 X / B5 대진 버전 표시 X / sidebar 의 "내 참가 현황" 시각 약함 (`--color-*` 폐기 토큰 잔존).
- 5 탭 (overview / schedule / bracket / teams / rules) 모두 본 시안 안에 포함 (별 시안 X — `/schedule`, `/teams` 고아 라우트 redirect).

**시안 요구사항**:
- **Hero band** (기존 보존)
  - + B7 status 뱃지 강화 (모집 중 / 예선 / 본선 / 종료 명확 분리)
  - + B4 정원 progress bar (목록과 동일 톤)
- **종별 selector chip row** (Hero 아래 sticky) — B2
  - 종별 1개 = 단일 종별 대회 (chip row hidden) / 2+개 = chip row 표시 + URL state (`?division=U10`)
  - 모바일 = 가로 스크롤
- **5 탭 본문**:
  - **overview** = 기존 `tournament-about` + `series-card` + `gnba-rules` (보존)
  - **schedule** = `schedule-timeline` + `division-schedule-table` (보존) + 선택 종별 필터 적용
  - **bracket** = `V2BracketWrapper` (보존) + **B5 상단에 "마지막 갱신: 5분 전 / 버전 v3" 메타 + 본인 팀 하이라이트** (`var(--accent)` border 강조)
  - **teams** = `division-group-composition` + 팀 카드 (`TeamCardV2` 재사용) + 선택 종별 필터 적용
  - **rules** = 텍스트 본문 (보존)
- **Sidebar 보강** (B1):
  - "내 참가 현황" 카드 시각 강화 — 5 단계 step indicator (신청 완료 → 승인 대기 → 승인 → 결제 완료 → 진행 중)
  - 단계별 색상 = `var(--ink-mute)` (미달) / `var(--accent)` (현재) / `var(--ok)` (완료)
  - 클릭 시 마이페이지 "내 대회" 진입 (U-C 시안)
- **B7 미리보기 진입**: sidebar 에 (운영자만 보임) "👁 내가 본 화면 / 사용자가 본 화면 토글" — 클릭 시 본인 운영자 권한 표시 hidden 처리 미리보기

**보존 항목**:
- 5 탭 lazy loading 구조 (`tournament-tabs.tsx` 의 SWR fetcher)
- `?tab=` URL state 동기화
- `MyRegistrationStatus` 컴포넌트 시그니처 (단 시각 갱신)
- `_v2` 박제 골격 (hero / sidebar / about / series / rules)

**모바일 (≤720px)**:
- Hero 1열 stack
- 5 탭 = 가로 스크롤 chip row
- 종별 selector chip row (위 sticky 와 합쳐 2줄)
- Sidebar = 본문 하단으로 stack
- "내 참가 현황" sticky bottom (펼침 / 접힘)

**자체 검수 — A 등급 강제**:
- 06 §1 / §2 / §3 / §5 / §6 모두 통과

---

### 3-UA3. `TournamentEnroll.jsx` — 5단계 신청 (부분보강)

**현재 결함 (B3)**:
- 5단계 (대회확인/디비전/로스터/서류/결제) 이미 박제 완료. 단 결제 step 의 시각 강화 + 사후 상태 안내 부재.

**시안 요구사항**:
- 5단계 stepper (기존 `enroll-stepper` 보존)
- **5번째 step "결제" 본문 강화**:
  - 결제 수단 선택 (계좌이체 / 무통장 / 카드 — DB 지원 결제 수단 enum 그대로 — payment_method 필드 확인 후 표시)
  - 결제 금액 명세 (참가비 / 디비전별 / 할인 / 합계)
  - "결제 완료 후 관리자 승인 대기" 1줄 안내
- **사후 안내 page** (5단계 완료 후) =
  - 완료 hero (✅ "신청 완료") + 안내 = "관리자 승인 시 알림으로 알려드립니다 / 결제는 [N일] 내 처리 필요"
  - CTA = "내 참가 현황 보기" → 상세 sidebar 또는 마이페이지 deep-link

**보존 항목**:
- `enroll-stepper` / `enroll-aside` / `enroll-poster` / `enroll-step-docs` 시그니처
- 5단계 step key + 데이터 흐름
- POST `/api/web/tournaments/[id]/join` 동작

**모바일 (≤720px)**:
- step indicator = 가로 chip row
- 본문 1열 stack
- 결제 step CTA = sticky bottom 44px

**자체 검수 — A 등급 강제**: 06 §1 / §2 / §3 / §5 / §6 모두 통과

---

### 3-UB1. `TournamentCompleted.jsx` — 종료 발표 (상세 status='completed' variant / 신규)

**현재 결함 (B6)**:
- Phase 1A 의 D1 (관리자 종료 hub) 의 카운터파트 부재. 사용자가 우승팀 / MVP / 사진 / 알기자 를 어디서 봐야 할지 분산.

**시안 요구사항**:
- **상세 페이지의 같은 라우트** — status='completed' 분기 시 본 variant 렌더 (별 라우트 신규 ❌ — 더보기 가짜링크 ❌)
- **Hero band 우승팀 강조**:
  - 🏆 + 우승팀 이름 (Pretendard 900 / 큰) + 팀 로고
  - 부제 = 대회명 + 종료일자 + 종별
  - 우승팀 이미지 (champion_team 사진 있으면 / 없으면 단색 그라데이션)
- **본문 카드 grid (5 카드)**:
  1. **최종 standings** — 1~4위 + 베스트8 (종별 1+ 시 종별별 standings)
  2. **MVP / 베스트5** — 선수 카드 (아바타 + 이름 + 팀 + 주요 stat 1줄)
  3. **명장면 사진** — 사진 갤러리 (썸네일 grid + 클릭 시 풀스크린)
  4. **알기자 카드** — 종료 알기자 1건 (제목 + 요약 + "전문 보기" → /community/[id])
  5. **다음 대회 안내** — 시리즈 연결 시 "다음 회차: [대회명] D-7" (없으면 카드 hidden)
- **하단 CTA** — "공유하기" (URL / 카카오톡 / 인스타) + "다른 대회 둘러보기" (목록 진입)

**보존 항목**:
- 상세 페이지 라우트 그대로 (status 분기만 — 신규 라우트 X)
- `champion_team` / `mvp_player` 데이터 출처 (Prisma Tournament 모델)
- 사진 / 알기자 = 기존 데이터 모델 (사진 = TournamentPhoto / 알기자 = community Post 연결)

**모바일 (≤720px)**:
- Hero 풀폭 우승팀
- 5 카드 1열 stack
- CTA sticky bottom

**자체 검수 — A 등급 강제**:
- 06 §6-2 About 운영진 실명 ❌ — 본 시안의 MVP / 베스트5 = 데이터 출처 (DB 필드) — 운영진 실명과 별개 → 충돌 0
- 06 §1 / §2 / §3 / §5 / §6 통과

---

### 3-UC1. `Profile.jsx` 또는 `MyActivity.jsx` — "내 대회" 섹션 (마이페이지 통합)

**현재 결함 (B1 의 진입 보강)**:
- `MyRegistrationStatus` 는 대회 상세 sidebar 안에만 노출 — 사용자가 본인이 신청한 대회 list 를 마이페이지에서 한 번에 볼 진입 부재.

**시안 요구사항**:
- 마이페이지 안에 **"내 대회" 섹션 카드** (Phase 13 마이페이지 hub 의 신규 카드)
  - 카드 list = 본인이 신청한 대회 (TournamentTeam 조회) — 상태별 정렬:
    - 🟡 승인 대기 (pending) — 우선 상단
    - 🟢 진행 중 (approved + 진행 중)
    - ✅ 종료 (completed)
    - ❌ 거절됨 (rejected) — 하단
  - 각 카드 = 대회명 + 종별 + 본인 팀명 + status step indicator (UA2 의 sidebar 와 동일 톤) + deep-link
- **빈 상태** = "아직 신청한 대회가 없습니다. 모집 중인 대회 둘러보기" → `/tournaments`
- **상단 진입 카운트** = "내 대회 N건 / 진행 중 M건"

**보존 항목**:
- 마이페이지 hub 골격 (Phase 13)
- `MyRegistrationStatus` 컴포넌트 시그니처 (마이페이지 + 상세 sidebar 양쪽 재사용)
- 더보기 메뉴 신규 추가 ❌ — 마이페이지 안 카드로만 진입 (룰 §2 통과)

**모바일 (≤720px)**:
- 카드 1열 stack
- step indicator = 가로 chip row

**자체 검수 — A 등급 강제**: 06 §1 / §2 / §3 / §5 / §6 모두 통과 + §2 가짜링크 신규 추가 ❌ 명시

---

### 3-UD1. `AdminTournamentTeams.jsx` 보강 — B1 알림 + B3 결제 + B4 진행도 (관리자)

**보강 내용**:
- 기존 시안 (Phase 1A 에는 단독 의뢰 없음 — A 등급 기존 시안) 위에 다음 추가:
  - **B1 알림 액션**: status 변경 (승인 / 거절) 버튼 옆에 "사용자에게 알림 보내기" 체크박스 (기본 ✅ 체크) — UI 만, 운영 API 변경 0
  - **B3 payment 컬럼**: 팀 표에 "결제 상태" 컬럼 추가 (`var(--ok)` 완료 / `var(--warn)` 미완) + 일괄 "수동 입금 확인" 토글 (UI 만)
  - **B4 정원 진행도 카드**: 페이지 상단에 큰 진행도 카드 ("N팀 / M팀 정원 — D-3") — 셋업 hub 의 팀 카드와 같은 톤

**보존 항목**:
- 기존 팀 표 / 토큰 발급 / 매뉴얼 신청 동작 (운영 코드 변경 0)
- 권한 가드 (organizer / TAM)

**자체 검수 — E 등급**: 06 §3 / §5 / §6 / §7 (E등급 자체 영역 — AppNav X)

---

### 3-UD2. `AdminTournamentBracket.jsx` 보강 — B5 publish 알림 + 버전 히스토리 (관리자)

**보강 내용**:
- **B5 publish 시 알림 체크박스**: bracket publish 버튼 옆에 "참가팀 N명에게 변경 알림 보내기" 체크박스 (기본 ✅)
- **버전 히스토리 view**: 페이지 상단 또는 사이드에 "변경 이력" panel — `tournament_bracket_versions` 데이터 사용:
  - 카드 list = "v3 — 2026-05-25 14:32 — 박수빈 / 1번 시드 변경" (시간 + 작성자 + 변경 요약)
  - 클릭 시 diff view (UI 만 / 운영 구현은 별 Phase)

**보존 항목**:
- 기존 대진표 생성 / DualGroup 에디터 / DivisionGenerate 동작 (운영 코드 변경 0)
- publish API 시그니처

**자체 검수 — E 등급**: 06 §3 / §5 / §6 / §7

---

### 3-UD3. `AdminTournamentSetupHub.jsx` 보강 — B7 사용자 미리보기 (관리자)

**보강 내용**:
- Phase 1A B1 (depends_on 시각화 + 모바일 sticky) 위에 다음 추가:
  - **B7 "사용자 미리보기" link 카드** — 8 카드 중 마지막 (또는 진행도 bar 옆) 에 작은 secondary 카드 신규:
    - 🔍 "사용자가 본 화면 미리보기"
    - 본문 = "현재 publish 상태에서 사용자에게 어떻게 보이는지 새 탭으로 확인" 1줄
    - 클릭 시 새 탭으로 `/tournaments/[id]` 진입 (운영자 권한 hidden 시뮬레이션 + URL param `?preview=user`)

**보존 항목**:
- Phase 1A B1 의뢰의 모든 요소 (depends_on / progress bar / 모바일 sticky)
- 8 카드 라우팅 + 공개 게이트 비즈 로직

**자체 검수 — E 등급**: 06 §3 / §5 / §6 / §7

---

## 4. 디자인 원칙 13 룰 (00-master-guide §13 룰)

> 본 의뢰는 **사용자 측 5 시안 (UA1~3 + UB1 + UC1) = A 등급 / 관리자 보강 3 시안 (UD1~3) = E 등급** 혼합. A 등급은 **13 룰 전체 강제** / E 등급은 §A AppNav 적용 외.

### 4-A. AppNav (헤더) 7 룰 — **사용자 측 시안 강제 적용 ⭐**

`03-appnav-frozen-component.md` 코드 그대로 카피. 위반 검수 4 케이스 통과:

1. 9 메인 탭 = 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기
2. utility bar 우측 (계정/설정/로그아웃) 모바일에서도 표시
3. main bar 우측 = 검색/쪽지/알림/다크/햄버거 **5개** (Phase 19 갱신)
4. 다크모드 — PC 듀얼 / 모바일 단일 아이콘
5. 검색·쪽지·알림 = `app-nav__icon-btn` (border/bg 박스 X)
6. 모바일 닉네임 hidden
7. 더보기 = 9번째 탭 (drawer + 5그룹 패널)

### 4-B. 더보기 5그룹 IA 룰 (룰 8~9)

```
8. 가짜링크 4건 영구 제거: gameResult / gameReport / guestApps / referee ❌
9. refereeInfo (둘러보기 그룹) + mypage (계정·도움 첫 항목)
```

**본 의뢰 강조**: UC1 "내 대회" 섹션은 마이페이지 안 카드로만 진입 / 더보기 메뉴 신규 추가 ❌. UB1 종료 variant 는 같은 라우트 status 분기 / 더보기 신규 추가 ❌.

### 4-C. 디자인 토큰 룰 4가지 (룰 10~13)

```
10. 색상: var(--accent / --cafe-blue / --ok / --bg-alt / --ink-mute) 등 토큰만
    ❌ #ff6b88 hex / 핑크·살몬·코랄 / `--color-*` 폐기 토큰 (P1 마이그레이션)
11. 아이콘: Material Symbols Outlined / 시안 검증된 이모지
    ❌ lucide-react
12. 라운딩: 버튼/카드 4px (8px 카드 OK) / pill 9999px X (정사각형 원형 50% OK)
13. 모바일: 720px / iOS input 16px / 버튼 44px
```

**본 의뢰 강조**:
- UA1 목록 status 뱃지 = `var(--accent)` (모집 중) / `var(--cafe-blue)` (진행 중) / `var(--ok)` (종료) — 핑크/살몬 ❌
- UA2 sidebar step indicator = `var(--ok)` (완료) / `var(--accent)` (현재) / `var(--ink-mute)` (미달)
- UB1 우승팀 hero = `var(--accent)` 트로피 + 그라데이션
- 모든 시안 = `--color-*` 폐기 토큰 사용 ❌ (현재 my-registration-status.tsx 의 `--color-border` 등 잔존 — 본 의뢰에서 교체)

### 4-D. 카피 / 모바일 룰 (룰 11~13 — 위 4-C 와 중복)

추가 강조:
- placeholder 5단어 이내 / "예: " 시작 ❌
- 본 의뢰 카피 = 시안 우선 (사용자 결정 §6-1) — "서울 3x3 농구 커뮤니티" / "다음카페" 보존 가능
- 모바일 720px / iOS input 16px / 버튼 44px

---

## 5. 사용자 결정 §1~§8 보존 명시

본 의뢰는 사용자 측 + 관리자 보강 혼합. 사용자 측은 §1~§8 모두 강제 적용.

| § | 결정 | 본 의뢰 영향 |
|---|------|------------|
| §1 헤더 (AppNav) | 9 메인 탭 / 더보기 / utility bar | **사용자 측 5 시안 강제** — 03 frozen 카피 / 위반 검수 4 케이스 통과 |
| §2 더보기 5그룹 | 가짜링크 4건 ❌ | **본 의뢰 강조** — UB1 신규 라우트 X (status 분기) / UC1 마이페이지 sub-link |
| §3 팀 페이지 | 레이팅 stat 제거 | 본 의뢰 직접 영향 0 |
| §4 프로필 | 이모지 아이콘 / 사이드바 | UC1 마이페이지 영향 — 이모지 아이콘 / 사이드바 보존 |
| §5 메인 페이지 | Hero 카로셀 | 본 의뢰 직접 영향 0 |
| §6-1 글로벌 카피 | "서울 3x3 농구 커뮤니티" / "다음카페" 보존 (시안 우선) | **본 의뢰 강제** — placeholder / status 뱃지 / hero 카피 시안 우선 |
| §6-2 About 운영진 실명 ❌ | 일반 라벨 | UB1 의 MVP / 베스트5 = 데이터 출처 (DB) — 운영진 실명과 별개 → 충돌 0 |
| §7 모바일 (720px / iOS 16px / 44px) | 글로벌 가드 | **본 의뢰 강제 적용** ✅ — 모든 8 시안 |
| §8 인증/권한 | captainId 매칭 | UD3 의 사용자 미리보기 = 운영자 권한 hidden 시뮬레이션 (시안 만 — 운영 구현 별 Phase) |

→ **본 의뢰 강제 적용 = §1 / §2 / §6 / §7 (사용자 측 시안 5건)**. 관리자 보강 3건은 E 등급 룰만.

---

## 6. 산출물 형식

### 6-1. 산출물 위치

```
사용자 → Claude.ai Project (BDR 디자인 시스템 관리) 에 본 의뢰 + Phase 1A 의뢰 묶음 전달
  ↓
Claude.ai → 새 zip 생성 (BDR v2.17 또는 동일 v2.16 갱신)
  ↓
사용자 → zip 풀이 → 임시 폴더
  ↓
PM (Claude Code) → CLAUDE.md §🗂️ 워크플로우 5단계 진행:
  1. 새 zip 풀이 → 임시 폴더
  2. 기존 Dev/design/BDR-current/ → Dev/design/_archive/BDR vX.Y/ 이동
  3. 새 zip 의 Dev/design/BDR vX.Y/ → Dev/design/BDR-current/ 카피
  4. zip 최상위 옛 시안 (있으면) → _archive/v2-original/
  5. Dev/design/README.md 갱신 + commit "design: BDR-current sync vX.Y"
```

### 6-2. 산출물 파일 (8 시안)

**전면교체 시안 1건**:
1. `Match.jsx` 또는 `Tournaments.jsx` (UA1 / 목록 — 새 카드 + 정원 + status 뱃지 + 종료 표시)

**부분수정 시안 4건**:
2. `TournamentDetail.jsx` (UA2 / 상세 — 종별 selector + 5 탭 통합 + sidebar 보강 + B5 버전 표시)
3. `TournamentEnroll.jsx` (UA3 / 신청 5단계 — 결제 step 강화 + 사후 안내)
4. `Profile.jsx` 또는 `MyActivity.jsx` (UC1 / 마이페이지 "내 대회" 섹션)
5. `MyRegistrationStatus` 컴포넌트 갱신 (sidebar + 마이페이지 양쪽 재사용 — `var(--color-*)` 교체)

**신규 시안 1건**:
6. `TournamentCompleted.jsx` (UB1 / 종료 발표 — 우승팀 hero + 5 카드 + 사진 + 알기자)

**관리자 보강 시안 3건** (Phase 1A 기존 시안 위에 보강):
7. `AdminTournamentTeams.jsx` (UD1 / B1 알림 + B3 결제 + B4 진행도)
8. `AdminTournamentBracket.jsx` (UD2 / B5 알림 + 버전 히스토리)
9. `AdminTournamentSetupHub.jsx` (UD3 / B7 사용자 미리보기 — Phase 1A B1 위에 추가)

→ 파일 총 9개 (5번이 컴포넌트라 페이지 시안 8건 + 컴포넌트 1건). 본 의뢰 카운트 = **8 시안 + 1 컴포넌트 = 9 파일**.

### 6-3. README.md 갱신

`Dev/design/BDR-current/README.md` 에 다음 추가:
```markdown
## vX.Y 갱신 (2026-05-XX) — 대회 사용자 측 + 사용자↔관리자 연결 다리 (Phase 1B)

### 전면교체 (1건)
- Match (목록) — 새 카드 + 정원 + status 뱃지 + 종료 표시

### 부분수정 (4건)
- TournamentDetail — 종별 selector + 5 탭 통합 + sidebar 보강 + B5 버전
- TournamentEnroll — 결제 step 강화 + 사후 안내
- Profile / MyActivity — "내 대회" 섹션 신설
- MyRegistrationStatus — `--color-*` 교체 + 5 단계 step indicator

### 신규 (1건)
- TournamentCompleted — 종료 발표 (우승팀 hero + 5 카드)

### 관리자 보강 (3건)
- AdminTournamentTeams — B1 알림 + B3 결제 + B4 진행도
- AdminTournamentBracket — B5 알림 + 버전 히스토리
- AdminTournamentSetupHub — B7 사용자 미리보기 (Phase 1A B1 위에 보강)
```

### 6-4. 박제 후 자체 검수 (06 의무)

박제 완료 후 `06-self-checklist.md` 모든 항목 ✅ 의무:

**사용자 측 5 시안 (UA1~3 + UB1 + UC1) — A 등급**:
- §1 AppNav — 03 frozen 카피 / 위반 검수 4 케이스 통과
- §2 더보기 — 가짜링크 4건 추가 ❌
- §3 디자인 토큰 — var(--*) 100% / `--color-*` 0 / lucide-react 0
- §5 모바일 — 720px / iOS 16px / 44px
- §6 연결성 — JSDoc 매트릭스 첨부

**관리자 보강 3 시안 (UD1~3) — E 등급**:
- §3 디자인 토큰 (동일)
- §5 모바일 (동일)
- §6 연결성 (동일)
- §7 E 등급 자체 영역 룰

---

## 7. 첫 응답 형식 (Claude.ai 응답 의무)

00-master-guide §3 답습:

```
✅ BDR 디자인 의뢰 확인 — 대회 사용자 측 + 사용자↔관리자 연결 다리 (Phase 1B)

이해:
- 사용자 측 전면교체 1 (UA1 목록 — 카드 + 정원 + status 뱃지)
- 사용자 측 부분수정 3 (UA2 상세 종별 selector / UA3 신청 결제 강화 / UC1 마이페이지 내 대회)
- 사용자 측 신규 1 (UB1 종료 발표)
- 관리자 보강 3 (UD1 Teams / UD2 Bracket / UD3 SetupHub)
- 7 갭 매핑 = B1 신청 통보 / B2 종별 / B3 결제 / B4 정원 / B5 대진 알림 / B6 종료 발표 / B7 미리보기

사용자 결정 §1~§8 보존:
- §1 / §2 / §6 / §7 사용자 측 시안 강제
- §3 / §4 / §5 / §8 직접 영향 0 또는 보존
- 관리자 보강 3건 = E 등급 (§1 / §2 적용 외)

AppNav frozen — 03 카피 (사용자 측 5 시안 강제 / 관리자 보강 3건 적용 외)

자체 검수 (06):
- 사용자 측 §1 / §2 / §3 / §5 / §6
- 관리자 보강 §3 / §5 / §6 / §7

산출물: Dev/design/BDR-current/screens/ (전면교체 1 + 수정 4 + 신규 1 + 관리자 보강 3 = 8 시안 / 9 파일)

질문 / 가정 (PM 결정 필요 시):
1. UA1 목록의 파일명 = `Match.jsx` (기존) vs `Tournaments.jsx` (신규) — 어느 것 사용 (BDR-current 의 기존 파일명 확인 후 결정)
2. UB1 종료 사진 갤러리 = TournamentPhoto 데이터 모델 확인 필요 (사용자 측 노출 시점 / 권한)

작업 시작.
```

---

## 8. 위반 시 즉시 중단

00-master-guide §"위반 시 즉시 중단" 답습 — 다음 발견 시 작업 중단 + PM 보고:

- **사용자 결정 §1~§8 위반** (헤더 / 더보기 / 카피 / 모바일)
- **신규 메인 탭 추가** (메인 탭 9개 변경 — PM 확인 필수)
- **더보기 메뉴 신규 추가** — UC1 / UB1 모두 마이페이지 sub-link 또는 status 분기로 진입 / 더보기 신규 ❌
- **DB 미지원 기능을 시안에** — 라우트 존재 / 데이터 출처 불명 항목:
  - TournamentPhoto 모델 확인 후 UB1 사진 갤러리 진행
  - bracket_versions 사용자 노출 = 본 의뢰가 첫 사용 (운영 0 → 시안 후 운영 박제 Phase 1C 에서 구현)
- **API/데이터 패칭 변경 제안** — 본 의뢰는 UI만 (운영 코드 변경 0)
- **AppNav frozen 변경 제안** — 03 카피만, 재구성 ❌

### 위반 자동 검수 4 케이스 (00 §회귀 방지)

- ❌ main bar 우측에 "더보기 ▼" dropdown 또는 아바타 노출
- ❌ 모바일(≤768px)에서 "☀ 라이트 ☾ 다크" 듀얼 라벨 노출
- ❌ 검색/쪽지/알림 버튼에 border/bg 박스 (`.btn` / `.btn--sm` 등) 적용
- ❌ main bar 우측 아이콘 순서가 [다크, 검색, 쪽지, 알림, 햄버거] 이외로 변경·누락

→ 사용자 측 5 시안 모두 위 4 케이스 통과 의무 / 관리자 보강 3건은 AppNav 적용 외 (자동 통과).

---

## 부록 A — B1~B7 갭 → 시안 매핑

| 갭 | 영향도 | 사용자 측 시안 | 관리자 측 시안 |
|----|-------|--------------|--------------|
| B1 신청 결과 통보 | ★★★★★ | UA2 sidebar step indicator + UC1 마이페이지 "내 대회" | UD1 알림 액션 |
| B2 종별 진입 | ★★★★ | UA2 종별 selector chip row | (해당 없음 — C2 Phase 1A 의뢰가 다룸) |
| B3 결제 흐름 | ★★★★ | UA3 결제 step 강화 + 사후 안내 | UD1 payment 컬럼 |
| B4 정원 진행도 | ★★★ | UA1 목록 + UA2 상세 hero | UD1 진행도 카드 (Phase 1A B1 진행도 bar 미러) |
| B5 대진 변경 알림 | ★★★★ | UA2 bracket 탭 버전 표시 + 본인 팀 하이라이트 | UD2 publish 알림 + 버전 히스토리 |
| B6 종료 발표 | ★★★★★ | UB1 종료 variant (우승팀 hero + 5 카드) | (해당 없음 — D1 Phase 1A 의뢰가 다룸) |
| B7 공개 게이트 | ★★★ | UA1 목록 status 뱃지 | UD3 사용자 미리보기 link |

---

## 부록 B — 선검증 결과 (본 의뢰 baseline)

본 의뢰 작성 전 선검증 5건 결과 (`Dev/design/prompts/tournament-user-admin-connectivity-plan-2026-05-25.md` §6 Step 1):

| 검증 | 결과 | 본 의뢰 반영 |
|------|------|------------|
| `/schedule` 박제 | 고아 라우트 → `?tab=schedule` redirect | 별 시안 ❌ — UA2 상세 시안에 통합 |
| `/teams` 박제 | 고아 라우트 → `?tab=teams` redirect | 별 시안 ❌ — UA2 상세 시안에 통합 |
| 결제 라우트 | enroll-stepper 에 5단계 (결제 포함) 이미 박제 | UA3 부분보강만 (결제 step 시각 강화 + 사후 안내) |
| my-status API | **`/api/web/tournaments/[id]/my-status` 존재** | 운영 코드 변경 0 — 시안에 API 신규 구현 의뢰 ❌ |
| referee-request admin | tournament-admin 안에 없음 (referee 별 셸 책임) | AdminTournamentRefereeRequests 신규 ❌ — 별 Phase |
| bracket_versions 사용자 노출 | 노출 0건 | UA2 (사용자 측) + UD2 (관리자 측) 양측 신규 시안 |

---

## 부록 C — Phase 1 시안 합산 (총 18 시안)

본 의뢰 + Phase 1A 합산:

### Phase 1A (관리자 단독 — `tournament-admin-redesign-prompt-2026-05-25.md`)
- 수정 7: AdminTournamentAdminList / Wizard1Step / WizardAssociation / SetupHub / Matches / Divisions / (components.jsx)
- 신규 3: AdminTournamentPlayoffs / Completed / Prospectus
- 합계 **10 시안**

### Phase 1B (본 의뢰 — 사용자 + 연결 다리)
- 전면교체 1: TournamentsList
- 부분수정 4: TournamentDetail / TournamentEnroll / Profile (또는 MyActivity) / MyRegistrationStatus 컴포넌트
- 신규 1: TournamentCompleted
- 관리자 보강 3: AdminTournamentTeams / AdminTournamentBracket / AdminTournamentSetupHub
- 합계 **8 시안 + 1 컴포넌트 = 9 파일**

→ **Phase 1 총 = 18 시안 + 1 컴포넌트 = 19 파일**.

---

**의뢰 끝.** 사용자가 본 파일을 Claude.ai Project (BDR 디자인 시스템 관리) 에 그대로 붙여 넣어 의뢰 시작 가능. Phase 1A 의뢰 (`tournament-admin-redesign-prompt-2026-05-25.md`) 와 같은 zip 에 묶어 처리 권장 (의존: UD3 가 Phase 1A B1 위에 추가됨).
