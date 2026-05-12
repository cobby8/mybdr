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
| E | canManageTournament 단체 admin 자동 부여 | ✅ |
| C | 단체 정보 편집 모달 | ✅ |
| D | 대진표 고도화 | 진행 중 |

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

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
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
| 2026-05-12 | eead692 | **[stats]** 통산 스탯 3 결함 일괄 — mpg + 승률 + FG%/3P% | ✅ |
