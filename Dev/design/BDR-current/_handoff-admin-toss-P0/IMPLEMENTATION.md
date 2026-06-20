# IMPLEMENTATION — BDR 관리자 Toss 전환 (구현 인수 문서)

> 2026-06-21 최종 · 영역: E등급 자체 디자인(관리자/대회운영/파트너/심판) · 디자인시스템: Toss
> 이 문서 하나로 CLI가 **디자인 → 실제 백엔드 배선**까지 구현 가능하도록 현황을 상세 기술.
> 함께 볼 것: `DATA-BINDING.md`(필드 계약) · `HANDOFF.md`(파일 맵) · `index.html`(전 화면 허브)

---

## 0. 진입점 & 실행
정적 HTML + React UMD + Babel(브라우저) + lucide(CDN). 빌드 불필요, 브라우저에서 바로 열림.
| 파일 | 역할 |
|------|------|
| `index.html` | 전 화면 허브(런처) |
| `AdminConsole.html` | 관리자 콘솔 18페이지 |
| `TournamentAdmin.html` | 대회 운영(탭 통합 + 생성 위저드 + 기록자) |
| `AdminToss.html` | 참가신청서 3단계 + 종별 마스터 |
| `PartnerReferee.html` | 파트너/심판 셸 |

> 운영 이식 시: `toss.css` 토큰/컴포넌트를 실제 스택(Tailwind/CSS)으로 옮기고, 각 `*-screens*.jsx`의 컬럼·상태 정의를 그대로 컴포넌트로 박제. mock(`*-data*.jsx`)은 API 응답으로 교체.

---

## 1. 화면별 구현 현황 + 배선 지시

### A. 관리자 콘솔 (AdminConsole.html) — 18/18 ✅
공통 패턴: `toss-admin.jsx`의 `StatusTabs` + `FilterBar` + `DataTable`(정렬·선택·페이지네이션·상세·**상태 5종**) + `DetailModal`.
- **상태 5종**: filled / empty / loading / **error**(다시시도) / **denied**(권한없음) — `MockToggle`로 시연. 실제는 API 응답/HTTP 상태에 매핑(2xx→filled, 빈배열→empty, 4xx 403→denied, 5xx→error).
- **서버 배선**: 현재 클라 필터/정렬/페이지네이션 → `GET ...?status=&q=&sort=&page=&size=` + `{ rows, total }`. (DATA-BINDING §8)

| 페이지 | 핵심 액션 | 배선 |
|--------|----------|------|
| 대시보드 | KPI·차트·로그 | 집계 쿼리(실시간/배치 정책 ⚠미정) |
| 사용자 | 등급/상태/신고, 상세 | `users` + 신고 카운트 조인 |
| 대회 | 목록·상태 | `tournaments` (상세 운영=TournamentAdmin) |
| 경기 | 매치/픽업 | `games`/`matches` |
| 커뮤니티 | 신고/숨김 | `posts` + `reports` |
| 단체 | 승인 대기 | `organizations` (status) |
| 팀 | 소속·대회 | `teams` |
| 코트 | 승인 | `courts` |
| 결제 | 환불 | `payments` |
| 요금제 | 카드 | `plans` |
| 캠페인 | 노출/클릭 | `campaigns` |
| 파트너 | 계약 | `partners` |
| 분석 | 지표/퍼널 | 집계 |
| 신고 | 검토/처리 | `reports` (status) |
| 알림 | **작성 모달**(대상·채널·즉시/예약) | `notifications` INSERT + 발송 큐 |
| 제안 | 추천/상태 | `suggestions` |
| 로그 | 감사 이력 | `audit_logs` |
| 설정 | 종별마스터·일반·**대표자(권한 부여/회수·초대)** | `admin_categories` + `users.role` |

### B. 대회 운영 (TournamentAdmin.html) — 기능 리빌딩 ✅
탭: 종별·디비전 / 참가팀 / 대진표 / **기록자** / 공개·완료 + 사이드바 **새 대회 만들기**(3-step 위저드) · 종별 생성기.
- **종별·디비전**: 종별 카드(생성기=성별→admin_categories템플릿→디비전) + 인라인 method/settings/cap/fee. → `division_rules` bulkUpsert (DATA-BINDING §2). "저장 시 DivisionRule N건 자동생성" 배너 = 이 INSERT.
- **참가팀**: 인라인 status/payment 셀렉트(입금완료→자동 CONFIRMED), 대기 알림, **팀 상세 모달(로스터=`tournament_team_players` 조인)**, CSV 내보내기. → status 매핑 §3.
- **대진표**: division.format별 생성(조별리그/토너먼트/리그전/더블엘리). ⚠ **현재 클라 프리뷰만** → 실제 `brackets/groups/matches` INSERT 필요(§6, BDR-join-v1 `generateHybridBracket` 재사용).
- **기록자**: 경기별 기록원 배정 + 자동 배정 → `recorder_assignments`(§7).
- **공개·완료**: 공개 토글·공개 가드(필수항목)·결과/MVP → `tournaments.published` + results.

### C. 참가신청서 (AdminToss.html) — 사용자용 ✅
3단계: ①참가팀 선택+확인(세션, 비번X) → ②종별·디비전(정원/대기접수) → ③출전선수 선택(로스터 체크). 유니폼·명단입력 폐지.
- **배선**: §4 흐름. 출전선수 = `tournament_team_players` INSERT. 정원 판정 = §5 **서버 재판정**(클라 숫자 신뢰 금지).
- 출전 최소인원/게스트 = `MIN_PLAYERS_GUARD`/`ALLOW_GUEST` 토글, **정책 확정 후 on**(추후 결정).

### D. 파트너 · 심판 (PartnerReferee.html) — 셸 재스킨 ✅
모드 스위치. 파트너(대시보드·코트·캠페인) / 심판(대시보드·배정·정산). 기존 셸 골격 유지·Toss 비주얼.

---

## 2. 데이터 배선 — 변환·미구현 (CLI 작업목록)

### 🔴 신규 마이그레이션 (필수)
1. `admin_categories` — 복원(BDR-join-v1 운영 DB) 또는 4종 시드 INSERT (DATA-BINDING §1)
2. `tournament_division_rules` — `format text` / `settings jsonb` / `fee_krw int` 컬럼 추가 (§2)
3. `tournament_team_players` — 로스터 조인 테이블 (§4)
4. `recorder_assignments` — 기록자 배정 (§7)
5. (선택) `tournament_teams.is_waiting boolean` — 대기접수 구분 (§3)

### ⚠️ 변환 규칙
- **status 매핑**(§3): APPLIED→pending / WAITING→pending+is_waiting / CONFIRMED→approved+paid / CANCELED→rejected. 입금완료→자동 approved 트리거.
- **정원/대기**(§5): 서버 `COUNT(status IN pending,approved)` ≥ cap → WAITING. 제출 시 재판정.
- **div_caps 단일소스**: 시안은 `division_rules.cap/fee_krw` 권위. 기존 `Tournament.div_caps/div_fees(jsonb)`는 **파생 집계로 동기화**(읽기 호환용). 쓰기는 rule에만.
- **대진 저장**: 클라 프리뷰 → `brackets/groups/matches` INSERT(§6).

### 🟡 정책 미정 (PM 확인)
- 출전 최소인원 / 게스트 허용
- 대시보드·분석 집계: 실시간 vs 배치
- `tournament_format_presets`(경기포맷 프리셋 저장) 도입 여부

---

## 3. 디자인시스템 토큰 (toss.css → 운영 이식)
라이트 · Primary `#3182F6`(hover `#1B64DA`) · radius 카드 16~24px · Pretendard · lucide · Toss Grey 50~900 · 의미색 ok `#15B86A`/warn `#FF9500`/danger `#F04452`. 컴포넌트 클래스: `.ts-btn/.ts-card/.ts-input/.ts-badge/.ts-chip/.ts-segment/.ts-toggle/.ts-check/.ts-table/.ts-sidebar/.ts-navlink` + 모달/토스트.

---

## 4. 범위 밖 (후속 협의)
- `referee/admin/*` 하위 12페이지 · `_site` 서브도메인 공개 대회 페이지
- 실시간 알림 큐/푸시 인프라
