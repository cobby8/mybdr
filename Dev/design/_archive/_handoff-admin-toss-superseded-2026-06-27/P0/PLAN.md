# BDR 관리자 Toss 전환 — 구현 계획 (rev 2026-06-20)

> 원칙: **관리자 전 화면을 Toss 디자인시스템으로 교체.**
> - **리스킨(기능 유지)** — 기존 화면의 기능·컬럼·필터·액션·정보구조를 1:1 유지하고 **비주얼만** Toss 토큰·컴포넌트로 교체.
> - **리빌딩(기능 변경)** — **대회관리(tournament-admin)만** 예외. 종별 마스터·참가신청·대회상세 IA까지 새로 설계.
> 디자인시스템(`toss.css` / `toss-kit.jsx`)은 P0에서 완성 → 모든 화면 공통 사용.

---

## 트랙 구분

| 트랙 | 대상 | 작업 |
|------|------|------|
| **A. 리스킨** | (admin)/admin/* 백오피스 17개 (대회관리 제외) + partner-admin + referee | 기능 유지, Toss 재스킨 |
| **B. 리빌딩** | 대회관리 = (admin)/admin/tournaments + tournament-admin/* | 기능까지 재설계 (P0 일부 완료) |

기능 출처(SoT): 기존 프로젝트의 admin 시안(`AdminDashboard/Games/Users/...jsx`) — 컬럼·필터·액션을 그대로 옮긴다.

---

## 단계

### Phase 0 — 디자인시스템 기반 ✅ 완료
- `toss.css` (토큰 + 버튼/카드/입력/뱃지/칩/세그먼트/토글/체크/스텝닷/사이드바/테이블/모달/토스트)
- `toss-kit.jsx` (Icon=lucide, Btn, Badge, Toggle, Check, StepDots, Modal, Empty)
- 참가신청서 3단계 + 종별 마스터 (대회관리 리빌딩의 일부)

### Phase 1 — 관리자 셸 + 우선 5화면 리스킨 (트랙 A)
> 확정 우선순위: **사용자 → 대회 → 경기 → 커뮤니티 → 단체**. 이번 라운드는 스타일 교체만(기능 유지).
- **AdminShell** (Toss 사이드바) — admin 전 메뉴 IA를 Toss로. 기존 메뉴 구성 유지.
- `/admin/users` 사용자 · `/admin/tournaments` 대회(목록·상태, **스타일만** — 기능 리빌딩은 Phase 2) · `/admin/games` 경기 · `/admin/community` 커뮤니티 · `/admin/organizations` 단체
  → 테이블·필터·인라인 액션 1:1 유지, Toss 테이블/뱃지/모달로 교체.

### Phase 2 — 나머지 백오피스 리스킨 (트랙 A)
> 기능 유지·Toss 재스킨. 우선 5화면 외 전부.
- `/admin` 대시보드 · `/admin/payments` 결제 · `/admin/notifications` 알림 · `/admin/plans` 요금제
- `/admin/game-reports` 경기리포트 · `/admin/teams` 팀 · `/admin/courts` 코트
- `/admin/partners` 파트너 · `/admin/campaigns` 캠페인 · `/admin/analytics` 분석 · `/admin/suggestions` 제안 · `/admin/logs` 로그 · `/admin/settings` 설정

### Phase 3 — partner-admin + referee 리스킨 (트랙 A)
- `partner-admin/*` (4) — 자체 셸 골격 유지, Toss 재스킨
- `referee/*` (28) — RefereeShell 골격 유지, Toss 재스킨

### Phase 4 — 대회관리 기능 리빌딩 (트랙 B, 후속)
> 스타일 교체 완료 후. P0(종별 마스터·참가신청)에 이어서.
- 대회 목록 + 생성 폼(3컬럼) · **대회 상세 = 참가팀 + 대진표 통합** · DivisionGenerator(종별 마스터 연동) · 이전 대회 복사

---

## 리스킨 공통 규칙 (트랙 A)
1. 레이아웃·정보 위계·기능(필터/정렬/액션/모달)·문구 **변경 금지**. 비주얼만 교체.
2. 매핑: 카드→`.ts-card`(24/16px) · 버튼→`.ts-btn` · 테이블→`.ts-table` · 상태칩→`.ts-badge` · 입력→`.ts-input` · 아이콘 Material→lucide 동의어.
3. 색: 강조 Toss Blue, 위험 `--danger`, 성공 `--ok`, 대기 `--warn`. 하드코딩 hex 금지(토큰).
4. 다크 토큰/AppNav 미적용(관리자는 별개 시스템). 라이트 전용.

---

## 산출물 / 전달
- 화면별 jsx + `toss.css` 공통. 핸드오프 zip → `BDR-current/` 동기화.
- README + DATA-BINDING(대회관리 리빌딩 계약 — admin_categories·DivisionRule·로스터 조인·WAITING).

---

## 확정 사항 (2026-06-20 PM)
1. **범위**: partner-admin·referee **포함** (전 관리자 화면 Toss 전환).
2. **이번 라운드 = 스타일 교체 우선** (리스킨만). 대회관리 기능 리빌딩은 후속.
3. **우선순위**: 사용자 → 대회 → 경기 → 커뮤니티 → 단체.
