# 작업 스크래치패드

## 현재 작업
- **요청**: D 대진표 고도화 (이미지 33) — dual_tournament rounds/brackets 매핑
- **상태**: 진입 (강남구협회장배 검증부터)
- **모드**: no-stop (자동 머지 위임)

## 다음 작업 큐 (사용자 보고 — 별 PR 대기)
| # | 이슈 | 영향 | 비고 |
|---|------|------|------|
| Q1 | 사이트 설정 동작 안 함 (이미지 40) | `/tournament-admin/[id]/site` 색상 단계에서 "서브도메인 필요" 빨강 에러. 흐름 버그 — 색상 단계인데 서브도메인 검증 잘못된 시점 발동 | 별 PR |
| Q2 | 코치 명단 입력 0/36 | 5/16 임박 — 토큰 발송 + 코치 입력 운영 행동 필요 | 운영자 액션 |
| Q3 | 코치 연락처 (manager_name/phone) 0/36 | A 도구 (scripts/_templates/import-coach-contacts.template.ts) 활용 — 명단 보유 시 | 운영자 액션 |
| Q4 | 대회 status='draft' → 5/15 'in_progress' 전환 | 대회 시작 시 운영자 transition | 운영자 액션 |

## 진행 현황표 (이번 세션)
| # | 작업 | 상태 |
|---|------|------|
| B | 강남구협회장배 max_teams 16→36 | ✅ |
| A | 코치 import 템플릿 | ✅ |
| E (Phase 4-E 시) | canManageTournament 단체 admin 자동 부여 | ✅ |
| C | 단체 정보 편집 모달 | ✅ |
| D | 대진표 고도화 | 진행 중 |
| **Phase E lifecycle** | **단체 archive (Q1 보존)** | **✅ (커밋 대기)** |

## 구현 기록 (developer) — Phase E 단체 lifecycle (Q1 보존 = archived) (2026-05-12)

### 📝 구현한 기능

**E-1. `requireOrganizationOwner` 권한 헬퍼 신규**
- `OrganizationPermissionError` (404/403) — series-permission `SeriesPermissionError` 와 동일 패턴
- 통과 조건: super_admin 우회 (옵션) OR `organization_members.role='owner' && is_active=true`
- admin/member 차단 — Phase E 정책 (단체 lifecycle = owner 만의 결정)

**E-2. 단체 archive/복구 API + UI**
- `POST /api/web/organizations/[id]/archive` = status='archived' (시리즈/대회 변경 0)
- `DELETE /api/web/organizations/[id]/archive` = 복구 (status='approved')
- `ArchiveOrganizationButton` confirm 모달 + redirect/refresh 분기

**E-3. archived 단체 표시 정책**
- 운영자 페이지: 헤더 "보관됨" 회색 뱃지 + owner 만 복구 버튼
- 단체 목록: active vs archived 분리 (회색 톤 + opacity-70 + grayscale 로고)
- 공개 페이지: archived 진입 시 "보관된 단체입니다" 안내 페이지 (events/teams/members 탭 차단)
- generateMetadata = archived title 변경 + 검색 노출 최소화

### 변경 파일

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/auth/org-permission.ts` | `requireOrganizationOwner()` + `OrganizationPermissionError` class 추가 (re-export `SuperAdminSession`) | 수정 |
| `src/app/api/web/organizations/[id]/archive/route.ts` | POST archive / DELETE 복구 + adminLog warning | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/_components/ArchiveOrganizationButton.tsx` | confirm 모달 + POST/DELETE + redirect/refresh 분기 | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/page.tsx` | isOwner 가드 + Archive 버튼 통합 + "보관됨" 헤더 뱃지 | 수정 |
| `src/app/(admin)/tournament-admin/organizations/page.tsx` | active vs archived 분리 표시 (회색 톤 + 별 섹션) | 수정 |
| `src/app/(web)/organizations/[slug]/page.tsx` | archived 안내 페이지 분기 + generateMetadata 보호 | 수정 |
| `src/__tests__/lib/auth/requireOrganizationOwner.test.ts` | 권한 매트릭스 10 케이스 (단체없음/super_admin 2종/owner/admin/member/외부인/비활성/allowSuperAdmin=false/archived 단체 owner) | 신규 |

### 검증 결과

| 검증 항목 | 결과 |
|----------|------|
| tsc --noEmit | ✅ 0 에러 |
| vitest requireOrganizationOwner | ✅ 10/10 PASS |
| vitest 전체 | ✅ 601/605 PASS (실패 4건 = 별 PR score-sheet team-section-fill-rows / 본 PR 무관) |
| Flutter v1 영향 | ✅ 0 (api/v1/ organization 호출처 0건) |
| schema 변경 | ✅ 0 (status 가 String 필드 — 'archived' 값 그대로 박제) |
| 디자인 13 룰 | ✅ var(--color-*) 100% / Material Symbols / 빨강 본문 0 / warning 톤 / 44px+ |
| 보안 가드 | ✅ owner only (admin/member 차단) — 서버 헬퍼 + UI 가드 이중 |

### 💡 tester 참고

**테스트 방법**:
1. **owner 케이스**:
   - 단체 owner 로 로그인 → `/tournament-admin/organizations/[orgId]` 진입
   - 운영자 메뉴 하단 "단체 보관" 버튼 표시 (회색 톤 + warning hover)
   - 클릭 → confirm 다이얼로그 (시리즈/대회 보존 안내) → "보관"
   - → 단체 목록으로 redirect → "보관된 단체" 섹션에 회색 톤으로 표시
   - 다시 진입 → "보관됨" 뱃지 표시 + "단체 복구" 버튼 (info 톤) → 복구 → active 복귀
2. **admin/member 차단**:
   - admin 으로 로그인 → owner 메뉴 (Archive 버튼) 노출 X
   - 직접 API curl POST → 403 응답
3. **공개 페이지 안내**:
   - archived 단체의 `/organizations/[slug]` 직접 접근 → "보관된 단체입니다" 안내 페이지 (탭 차단)
4. **복구 시나리오**:
   - owner 가 archived 단체 진입 → "단체 복구" → status='approved' 복귀

**정상 동작**:
- archive/복구 시 시리즈/대회 row 변경 0 검증 (Q1 보존 정책)
- archived 단체는 공개 페이지에서 안내만 (events 탭 빈 표시 X — 페이지 자체 분기)
- super_admin 우회 가능 (운영 사고 긴급 fix)
- admin_logs 에 warning 등급으로 archive/restore 박제

**주의할 입력**:
- 이미 archived 단체에 POST → 409 (멱등 X — confirm 화면 다시 표시)
- 복구 시 archived 가 아니면 → 409
- owner 가 본인 멤버십 is_active=false 면 → 403

### ⚠️ reviewer 참고

- **owner only 정책 = Phase E 핵심** — admin 통과 시 권한 누수 (admin 이 임의로 단체 lifecycle 결정 가능) → vitest 5,9 케이스로 회귀 가드
- **super_admin 우회** = `allowSuperAdmin=true` (기본) — 운영 사고 긴급 fix 여지. 필요 시 route 에서 명시적으로 false 설정 가능
- **status 복구 시 항상 'approved'** — pending 등 단계 복귀는 별 PR (Phase F 후속)
- **schema 변경 0** = status 가 String 필드 — enum 이었으면 결재 필요 (확인 완료)
- **Q1 보존 정책 = decisions.md 박제** — 향후 "단체 삭제" 의뢰 시 본 결정 재참조

### 신규 보안 이슈 발견
- **0 건** — 권한 검증 owner only 서버 가드 + UI 가드 이중. admin/member 모두 403. archived 후 시리즈/대회 자체 영향 0 (보존 정책으로 권한 누수 0).

---

## 구현 기록 (developer) — Phase D 단체↔시리즈 셀프서비스 + Q3 권한 (2026-05-12)

### 📝 구현한 기능

**D-1. 단체 페이지 시리즈 카드 ⋮ 메뉴 (분리 / 이동)**
- 단체 owner/admin 이 본인 단체 시리즈 카드에서 직접 분리/이동 가능
- 분리: organization_id=null PATCH (Phase C 재사용) — confirm "단체에서 사라짐" 안내
- 이동: 본인 owner/admin 단체 목록에서 radio 선택 → confirm → organization_id=새 ID PATCH

**D-2 (Q3). canManageTournament 회귀 가드**
- ⚠️ Q3 자동 부여 분기는 이미 구현되어 있었음 (canManageTournament line 70-84, 이미지 34 사용자 요청 시 추가).
- 본 PR 은 회귀 vitest 9 케이스 신규 추가 — 권한 누수 0 보장.

### 변경 파일

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/organizations/[orgId]/_components/SeriesActionsMenu.tsx` | ⋮ dropdown (분리/이동) + 분리 confirm + 외부 클릭 닫기 + ESC 닫기 | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/_components/MoveSeriesModal.tsx` | 본인 owner/admin 단체 목록 radio + confirm + 이동 PATCH | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/page.tsx` | 시리즈 카드에 SeriesActionsMenu 통합 (isAdmin 가드) | 수정 |
| `src/__tests__/lib/auth/canManageTournament.test.ts` | Q3 권한 매트릭스 9 케이스 (organizer / TAM / 단체 owner / admin / member / series_id NULL / super_admin 분기) | 신규 |

### 검증 결과

| 검증 항목 | 결과 |
|----------|------|
| tsc --noEmit | ✅ 0 에러 |
| vitest 전체 | ✅ 595/595 PASS (584 → +11) |
| Flutter v1 영향 | ✅ 0 (api/v1/ canManageTournament 호출처 0건) |
| schema 변경 | ✅ 0 |
| 디자인 13 룰 | ✅ var(--color-*) 100% / Material Symbols / 핑크 0 / 빨강 본문 0 / 44px+ |
| API 신규 | ✅ 0 (Phase C PATCH /api/web/series/[id] + 기존 GET /api/web/organizations 재사용) |

### 💡 tester 참고

**테스트 방법**:
1. 단체 owner/admin 으로 로그인 → `/tournament-admin/organizations/[orgId]` 진입
2. 소속 시리즈 카드 우측 ⋮ 클릭 → dropdown 표시 확인
3. **분리 시나리오**:
   - "단체에서 분리" → confirm 다이얼로그 → "분리" → 시리즈 사라짐 (events 탭 영향)
   - 단체 카드의 시리즈 카운터 -1 즉시 반영
4. **이동 시나리오**:
   - 운영자가 본인 owner/admin 인 다른 단체가 있어야 목록 노출. 없으면 빈 안내.
   - radio 선택 → "이동" → confirm → 시리즈가 새 단체에서 보임 (현 단체 events 사라짐)
   - 양쪽 단체 series_count 동기화 ($transaction)
5. **권한 회귀 (Q3)**:
   - 단체 admin 으로 로그인 → 단체 시리즈 소속 대회의 wizard/PATCH/DELETE 진입 가능 확인
   - 단체 member (role=member) 는 차단 (403) 확인

**정상 동작**:
- ⋮ 메뉴는 isAdmin (owner/admin) 만 노출 — member 는 보이지 않음
- 분리/이동 confirm 다이얼로그에서 단체명 명시 (사용자 결정 가시성 ↑)
- 결과 메시지 1.5초 후 자동 refresh
- 외부 클릭 / ESC 로 dropdown 닫힘

**주의할 입력**:
- 단체 owner 가 본인 단체 1개만 보유 → MoveModal 빈 목록 안내
- 시리즈가 organization_id=null (단독 시리즈) → 단체 페이지에서 보이지 않으므로 본 메뉴 노출 X
- PATCH 422 (이미 분리됨 / 같은 단체로 이동 시도) → 에러 메시지 inline 표시

### ⚠️ reviewer 참고

- **권한 헬퍼 회귀** = 가장 위험 — vitest 9 케이스로 권한 누수 가드. 추가 케이스 (예: super_admin + 단체 미가입 시도) 권장 시 알려주세요.
- **MoveModal 가시성** = 본인 owner/admin 단체 목록을 클라이언트에서 필터링. 서버에서도 PATCH 시 isOrganizationEditor 재검증 (Phase C series-permission.ts) — 이중 안전망.
- **organizations/my** API 별도 신설 X — 기존 GET /api/web/organizations 가 myRole 포함하므로 재사용. 추후 owner/admin 만 필요한 케이스 늘면 별도 API 분리 검토.
- **빨강 본문 0** 룰 — admin 페이지 룰 준수 위해 분리/이동 버튼 모두 btn--primary 토큰 사용 (직접 빨강 색상 hardcode X)

### 신규 보안 이슈 발견
- **0 건** — 권한 검증 PATCH/DELETE 모두 server side 에서 requireSeriesEditor + isOrganizationEditor 이중 가드 (Phase C 구현). UI 는 보조 가드일 뿐.

---

## 구현 기록 (developer) — FIBA Phase 12 12행 + Team Fouls 3줄 (2026-05-12)

### 📝 구현 범위
Players 16→12행 + Team Fouls 5줄→3줄 (Period ①·② / ③·④ / Extra) + 세로 압축. 사용자 직접 결재 (이미지 29 분석) — FIBA Article 4.2.2 실 운영 max 12명 / FIBA PDF 정합.

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | (a) fillRowsTo16 → fillRowsTo12 (TARGET=12 / FIBA Article 4.2.2). (b) fillRowsTo16/15 deprecated alias → fillRowsTo12 위임 (회귀 안전망). (c) Team Fouls 레이아웃 5줄 → 3줄 — [1,2 페어] / [3,4 페어] / Extra. 페어 가로 배치 (flex-1 / w-8 "P{n}" 라벨 축약). (d) Players/thead/빈row 코멘트 갱신. | 수정 |
| `src/__tests__/score-sheet/team-section-fill-rows.test.ts` | 16 → 12 회귀 가드 갱신. fillRowsTo12 메인 4 케이스 + fillRowsTo16/15 deprecated alias 4 케이스 = 8 PASS. | 수정 |

### A4 fit 재검증
| 영역 | Phase 11 | Phase 12 | 차이 |
|------|---------|---------|------|
| Players | 16 × 20 = 320px | **12 × 20 = 240px** | -80 |
| Team Fouls | 5 줄 × ~12px = 60px | **3 줄 × ~12px = 36px** | -24 |
| Team A 합 | ~474 | **~370px** | -104 |
| Team A+B | ~948 | **~740px** | -208 |
| 헤더 | ~95 | ~95 | 0 |
| 풋터 | ~156 | ~156 | 0 |
| **좌측 총합** | ~1011 | **~991px** | A4 1123 여유 ~132px ✅ |

### Team Fouls 3줄 구조 (FIBA PDF 정합)
```
P1 [1][2][3][4]   P2 [1][2][3][4]   ← 줄 1 (Period 1+2)
P3 [1][2][3][4]   P4 [1][2][3][4]   ← 줄 2 (Period 3+4)
Extra [1][2][3][4]                   ← 줄 3
```

### 검증
| 항목 | 결과 |
|------|------|
| tsc --noEmit | ✅ EXIT_CODE=0 |
| vitest 전체 | ✅ 605/605 PASS |
| vitest team-section-fill-rows | ✅ 8/8 PASS (16→12 회귀 가드 + alias 호환) |
| lucide-react import | 0건 (코멘트 룰 명시만 1건) |
| 핑크 hex | 0건 |
| fillRowsTo16/15 호출 | 0건 (alias 정의만 유지 = 회귀 안전망) |
| schema 변경 | 0 |
| Flutter v1 영향 | 0 |
| BFF/service 변경 | 0 |
| AppNav frozen 영향 | 0 |
| Phase 3 Player Fouls 기능 유지 | ✅ (P/T/U/D + Article 41) |
| Phase 3 Team Fouls 자동 합산 유지 | ✅ (getTeamFoulCountByPeriod) |

### 💡 tester 참고
- **테스트 방법**: `/score-sheet/[matchId]` 진입 → Team A / Team B 영역 시각 검증
- **정상 동작**:
  1. Players 표가 **12행** (이전 16행에서 -4행). 빈 명단이어도 12행 placeholder
  2. Team Fouls 영역이 **3줄** — P1·P2 한 줄 / P3·P4 한 줄 / Extra 한 줄
  3. A4 1 페이지 fit (좌측 ~991px / 여유 ~132px)
  4. Period ①~④ 마킹 자동 합산 / 5+ 시 자유투 안내 (FT (+N)) 유지
  5. Player Fouls P/T/U/D + Article 41 퇴장 분기 정상
- **주의할 입력**:
  - 13명 이상 명단 (12 초과) → 12행 자르지 않고 그대로 표시 (운영 안정성)
  - OT 진입 시 (currentPeriod >= 5) Time-outs OT 1칸 동적 추가 — Phase 11 동작 유지
  - 페어 박스 폭이 좁아져 5+ 자유투 안내(FT +N)가 줄바꿈될 수 있음 — 페어 컨테이너 flex-1로 적응

### ⚠️ reviewer 참고
- **회귀 안전망**: fillRowsTo16/15 deprecated alias가 fillRowsTo12로 위임 — 외부 호출자 0건 확인했지만 vitest로 가드.
- **Team Fouls 페어 폭**: 좁아진 페어 안에서 5+ FT 안내가 다음 줄로 떨어질 수 있음. flex / min-w-0 / shrink-0 결합으로 적응형 처리.
- **라벨 축약**: "Period 1" → "P1" (w-12 → w-8) — 페어 가로 fit 위한 결정. FIBA PDF는 ①·②·③·④ 원숫자나 텍스트 인쇄 호환성 위해 P1~P4 표기.
- **다음 단계**: 시각 검증 (브라우저 /score-sheet/[matchId] 진입 → A4 인쇄 미리보기로 1 페이지 fit 확인).

### 신규 보안 이슈
- **0 건** — 디자인 + 행 수만 변경. API/권한/DB 0.

---

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 12 — Players 12행 + Team Fouls 3줄]** (a) fillRowsTo16 → fillRowsTo12 (FIBA Article 4.2.2 실 운영 max 12명 / 사용자 직접 결재). (b) deprecated alias 16/15 → 12 위임 (회귀 안전망). (c) Team Fouls 5줄 → 3줄 — P1·P2 / P3·P4 페어 + Extra. (d) vitest 16 → 12 갱신. 좌측 ~991px (A4 여유 ~132px). tsc 0 / vitest 605/605 PASS / schema 0 / Flutter v1 0 / BFF 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[Phase E 단체 lifecycle (Q1 보존)]** E-1) requireOrganizationOwner 헬퍼 + OrganizationPermissionError (owner only — admin 차단 + super_admin 우회 옵션). E-2) POST/DELETE /api/web/organizations/[id]/archive (status='archived'/'approved' 토글, adminLog warning 박제). E-3) ArchiveOrganizationButton confirm 모달 + 운영자 페이지 isOwner 가드 + 헤더 "보관됨" 뱃지 + 단체 목록 active vs archived 분리 (회색 톤) + 공개 페이지 archived 안내 페이지 분기. vitest 10 케이스 (단체없음/super_admin 2종/owner/admin/member/외부인/비활성/allowSuperAdmin=false/archived owner). schema 변경 0 (status=String) / Flutter v1 영향 0 / decisions.md Q1 박제. tsc 0 / vitest 본 PR 10/10 PASS / 전체 601/605 (실패 4건 = 별 PR score-sheet 무관). | ✅ |
| 2026-05-12 | (커밋 대기) | **[Phase D 단체↔시리즈 셀프서비스]** D-1) 시리즈 카드 ⋮ 메뉴 (SeriesActionsMenu + MoveSeriesModal — 분리 organization_id=null / 이동 본인 owner-admin 단체 목록 radio + confirm). D-2 Q3) canManageTournament 단체 owner/admin 자동 부여 회귀 가드 vitest 9 케이스 (organizer/TAM/단체 owner/admin/member/series_id NULL/super_admin 2종). tsc 0 / vitest 595/595 PASS / Flutter v1 영향 0 / schema 변경 0 / API 신규 0 (Phase C PATCH + 기존 GET 재사용). | ✅ |
| 2026-05-12 | a3076bc | **[D-3 운영 fix]** B max_teams + A 코치 import 템플릿 + E 권한 자동 부여 + C 단체 편집 모달 | ✅ |
| 2026-05-12 | 6057ba6 | **[design B등급]** admin 빨강 잔존 — analytics/logs/news/users/site/bracket 7 위치 톤다운 | ✅ |
| 2026-05-12 | 4a861ae | **[design]** admin 빨강 톤다운 전면 — wizard/통계/메뉴/이니셜 (이미지 37/38) | ✅ |
| 2026-05-12 | 98f857c | **[design]** admin 빨강 누락 페이지 — series 목록/wizard/모달 (이미지 36) | ✅ |
| 2026-05-12 | b8f293f | **[design]** pill 9999px + 빨강 본문 일괄 정리 (이미지 35) — 12 파일 | ✅ |
| 2026-05-12 | 4d989b3 | **[admin]** 자동 종료 + 빨강 토큰 + org admin 등록 (이미지 29~32) | ✅ |
| 2026-05-12 | d89f600 | **[live]** score-match swap-aware 백포트 — 5/10 결승 영상 사고 2차 fix | ✅ |
| 2026-05-12 | ff190a7 | **[live]** 결승 영상 매핑 오류 fix — auto-register 1:1 매핑 가드 백포트 | ✅ |
| 2026-05-12 | 32b8ec9 | **[live]** TeamLink href 404 — TournamentTeam.id → Team.id 분리 | ✅ |
