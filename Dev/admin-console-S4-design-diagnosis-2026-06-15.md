# Admin Console S4 설계 과제 — 진단 보고서

- **작성일**: 2026-06-15
- **작성자**: planner-architect (read-only 진단)
- **범위**: 4-A 대회 통합진입 / 4-B 홈 배너편성 / 4-C RBAC 확장
- **원칙**: 코드/DB 변경 0 (grep / SELECT / 코드 정독만). 결정은 사용자.

---

## 종합 요약 (한눈에)

| 항목 | 난이도(의뢰) | 실측 난이도 | 스키마 변경 | 위험도 | 핵심 결론 |
|------|------|------|------|------|------|
| 4-A 대회 통합진입 | 中 | **下~中** | 불필요 | 낮음 | 라우트/링크 통합만. 진입점은 이미 일부 통합됨(AdminEntryCta) |
| 4-B 홈 배너편성 | 中~高 | **中** | **불필요(스키마 완비)** | 중 | ad_placements 완전 존재. 홈은 미사용. 편성 UI 신규가 핵심 |
| 4-C RBAC 확장 | 中 | **中~高** | **필요(또는 매핑테이블)** | 중~높음 | role 판정이 5파일+42 API에 분산. 신규 2역할 도입 = 확장지점 다수 |

**권장 우선순위**: 4-A (저비용 즉효) → 4-B (독립적, 스키마 완비) → 4-C (설계 결정 선행 필요, 회귀 위험 관리)

---

## 4-A 대회 통합진입 진단

### 현황 (실측)

콘솔에는 대회 관련 영역이 **2개 라우트 그룹**으로 나뉘어 있습니다. 건물에 비유하면 "대회 사무동"이 두 동으로 떨어져 있는 상태입니다.

| 라우트 | 역할 | 권한 | 비유 |
|--------|------|------|------|
| `/admin/tournaments` | 사이트 운영자용 **전체 대회 관리** (목록/상태변경/삭제) | super_admin, site_admin | 본사 통합 관제실 |
| `/tournament-admin/tournaments` | 대회 운영자용 **본인 대회** 관리 + 셋업 | super_admin, site_admin, tournament_admin | 개별 대회 사무실 |
| `/tournament-admin/tournaments/[id]` | **개별 대회 셋업 hub** (체크리스트/divisions/teams/matches/bracket/playoffs/site) | 위와 동일 | 사무실 안 개별 책상 |

콘솔 사이드바(`src/components/admin/sidebar.tsx` L48~66)에서의 동선:
- `콘텐츠 > 대회 관리`(`/admin/tournaments`) → 그 **하위 항목**으로 `대회 운영자 도구`(`/tournament-admin`)가 이미 통합되어 있음 (2026-05-04 사용자 요청 반영).
- `/tournament-admin/tournaments` 페이지에는 `AdminEntryCta`(신규 대회 생성 4옵션 진입 패널)가 **이미 박제**되어 있음 (`admin-entry-cta.tsx`).

개별 대회 셋업 deep-link는 `AdminTournamentList`(클라이언트 컴포넌트)가 카드 클릭 시 `/tournament-admin/tournaments/[id]`로 진입하는 구조.

### 신규 작업 규모

의뢰의 "콘솔 '대회 운영' → /admin/tournaments → 개별 대회 셋업 deep-link 라우팅 통합"은 **대부분 이미 구현된 상태**입니다. 남은 통합 갭은:

1. **`/admin/tournaments`(사이트 전체관리) 카드 → 개별 셋업 deep-link 부재**: 현재 `admin-tournaments-content.tsx`의 대회 카드는 상태변경/공개토글/삭제만 가능. "이 대회 셋업으로 바로가기"(`/tournament-admin/tournaments/[id]`) 링크가 없음. → super_admin이 전체관제에서 개별대회 셋업으로 점프하려면 라우트를 손으로 갈아타야 함.
2. **두 목록 페이지 데이터 중복**: `/admin/tournaments`와 `/tournament-admin/tournaments`가 각자 `prisma.tournament.findMany`. super_admin은 양쪽에서 "전체 대회"를 봄 (역할 분리 의도이므로 통합 불필요할 수도).

### 건드릴 파일 / 난이도

| 파일 | 작업 | 난이도 |
|------|------|------|
| `src/app/(admin)/admin/tournaments/admin-tournaments-content.tsx` | 카드에 "셋업 바로가기" Link 추가 (`/tournament-admin/tournaments/${id}`) | 下 (Link 1개) |
| `src/components/admin/sidebar.tsx` | (선택) 메뉴 라벨/구조 미세 조정 | 下 |

- **데이터 패칭 변경 0** (의뢰 명시대로 라우팅/링크만).
- **위험도 낮음**: 신규 Link 추가 = 회귀 거의 없음.

### 결정 필요 사항
- (Q4A-1) `/admin/tournaments`(사이트 전체관리)와 `/tournament-admin/tournaments`(운영자 도구)를 **하나로 합칠지**, 아니면 **현 2분할 유지 + deep-link만 추가**할지. → 권장: **2분할 유지 + deep-link 추가** (역할 분리 의도 보존, 최소 변경).

---

## 4-B 홈 배너편성 진단

### 현황 (실측)

광고/배너 스키마는 **완전히 존재**합니다. 엑셀 저장소(DB)에 광고용 시트 3장이 이미 만들어져 있는 상태입니다.

| 모델 (`prisma/schema.prisma`) | 역할 | 위치 |
|------|------|------|
| `partners` (L2576) | 파트너사 (status: pending/approved/...) | 광고주 |
| `partner_members` (L2600) | 파트너사 소속 유저 (광고 관리 권한) | 광고주 담당자 |
| `ad_campaigns` (L2619) | 광고 캠페인 (headline/image_url/link_url/status/기간/예산) | 광고 단위 |
| `ad_placements` (L2654) | **배치**: campaign_id + `placement` + `priority` + `is_active` | 편성 테이블 |

**placement code 체계** (이미 존재): `ad_placements.placement` = `feed | sidebar | court_top | list` (string @db.VarChar, enum 아님 — 자유 확장 가능).

배너 읽는 지점:
| 위치 | 파일 | placement |
|------|------|------|
| 조회 API | `src/app/api/web/ads/route.ts` | `?placement=feed\|sidebar\|court_top\|list` |
| 렌더 컴포넌트 | `src/components/ads/ad-card.tsx` | (공통 카드) |
| 우측 사이드바 | `src/components/layout/right-sidebar.tsx` (L95) | sidebar |
| 뉴스피드 | `src/components/home/news-feed.tsx` | feed |
| 코트 페이지 | `src/app/(web)/courts/_components/courts-content-v2.tsx` | court_top |

**중요 — 홈(`src/app/(web)/page.tsx`)은 배너를 직접 읽지 않음**: 홈 page.tsx에서 AdCard/RightSidebar/news-feed/placement grep 결과 0건. 홈에 광고가 보인다면 하위 컴포넌트(news-feed 등)를 통해서이며, 홈 전용 배너 영역(예: hero 상단)은 미구현.

광고 편성(어느 캠페인을 어느 placement에, priority 몇으로)을 관리하는 **콘솔 UI는 부재**:
- `/admin/campaigns`(광고 캠페인) 페이지는 존재하나, **캠페인 CRUD 위주**로 추정. `ad_placements`(편성) 직접 관리 UI는 확인 안 됨.
- 편성 INSERT는 `src/app/api/web/partner/campaigns/[id]/placements/route.ts`(파트너 측)에 존재.

### 신규 작업 규모

의뢰의 "홈 배너편성"은 두 가지로 해석 가능:

**해석 A — 기존 placement(sidebar/feed/court_top) 편성 관리 UI 신규**:
- 스키마 추가 **불필요** (ad_placements 완비).
- 콘솔에 "편성표" 화면 신규: 캠페인 목록 + placement별 슬롯 + priority 조정 + is_active 토글.
- 규모: 페이지 1개 + 서버액션/API 2~3개 (편성 INSERT/UPDATE/toggle). **中**.

**해석 B — 홈 전용 배너 영역(hero/메인) 신규 편성**:
- `placement = "home_hero"` 같은 **신규 code 추가** (string이라 스키마 변경 없이 값만 추가 가능).
- 홈 page.tsx에 배너 읽는 코드 + 렌더 추가 (현재 없음).
- 규모: 위 A + 홈 렌더 추가. **中~高**.

### 스키마 변경 필요 여부
- **불필요**. `placement`이 enum이 아닌 VarChar이므로 `home_hero` 등 신규 code를 값만으로 추가 가능. 편성/우선순위/활성 필드 모두 완비.
- (단, placement code를 코드 상수로 중앙 관리하는 곳이 없어 보임 → 오타 방지용 상수 파일 1개 신설 권장 = 선택)

### 결정 필요 사항
- (Q4B-1) "홈 배너편성"이 **기존 placement 관리 UI**(해석 A)인지 **홈 전용 신규 배너 영역**(해석 B)인지.
- (Q4B-2) 편성 UI를 **super_admin 전용**으로 둘지, **partner_member도 본인 캠페인 편성 신청** 가능하게 할지 (파트너 측 placements API 이미 존재 → 정책 정합 필요).
- (Q4B-3) placement code를 상수 파일로 중앙화할지 (오타/일관성).

---

## 4-C RBAC 확장 진단

### 현황 (실측)

**실재 역할은 2축으로 분리** (2026-05 PR-PERM-DISPLAY 결정):
- **구독 등급축** (`User.membershipType` 0~3): FREE / PICKUP_HOST / TEAM_LEADER / TOURNAMENT_ADMIN (`src/lib/auth/roles.ts`).
- **운영 권한축** (`User.admin_role` — **VarChar, enum 아님**, L170): 자유 문자열. 현재 사용 값 = `super_admin` / `site_admin` / `association_admin`.

추가로 매핑 테이블 기반 권한:
- `AssociationAdmin` (협회 관리자, user_id @unique = 1인 1협회) — `admin_role="association_admin"` + 매핑행 존재로 판정.
- `partner_members` / `organization_members` / `tournament_recorders` / `tournamentAdminMember`.

**role → 그룹 매핑 구조**:
| 파일 | 역할 |
|------|------|
| `src/lib/auth/roles.ts` | membershipType → 구독 등급 라벨/가드 (`canHostPickup` 등) |
| `src/lib/auth/is-super-admin.ts` | `isSuperAdmin(session)` = `role==="super_admin" \|\| admin_role==="super_admin"` 단일 진입점 |
| `src/lib/auth/admin-roles.ts` | `getAdminRoles()` = 5종 매트릭스(super/site/tournament_admin/partner/org) 집계. **콘솔 진입 가드 + 사이드바 메뉴 필터의 source** |
| `src/components/admin/sidebar.tsx` | `AdminRole` union(5종) + 메뉴별 `roles` 배열 필터 |

**admin API 가드 방식** (grep 42개 파일): 표준 미들웨어 없이 **인라인 패턴** 반복:
```
const session = await getWebSession();
if (!session) return apiError("로그인 필요", 401);
if (!isSuperAdmin(session)) return apiError("권한 없음", 403);   // ← super_admin 단일 체크가 다수
```
일부는 `getAdminRoles` 또는 `admin-check` 라우트 사용. 즉 **권한 판정 로직이 42개 API + 5개 lib 파일에 분산**.

### 콘솔이 상정하는 4역할 vs 실재

| 콘솔 상정 (S4) | 실재 | 갭 |
|------|------|------|
| super_admin | ✅ 존재 (전권) | 없음 |
| association_admin | ✅ 존재 (admin_role + AssociationAdmin 매핑) | 없음 |
| **court_operator** (신규) | ❌ 없음 | 신규 도입 필요 |
| **content_admin** (신규) | ❌ 없음 (site_admin이 유사) | 신규 or site_admin 재활용 |

참고: 실재에는 콘솔 상정에 없는 `site_admin`이 이미 있음 (콘텐츠/유저/분석 접근). content_admin과 역할이 겹칠 가능성 높음.

### 신규 도입 시 확장 지점

신규 2역할(court_operator / content_admin)을 추가하려면 다음을 모두 손봐야 합니다 (건물 출입증에 새 등급 2개를 추가하면, 모든 보안검색대 설정을 갱신해야 하는 것과 같음):

| # | 확장 지점 | 파일 | 작업 |
|---|------|------|------|
| 1 | AdminRole union | `sidebar.tsx`, `admin-roles.ts` (2곳 중복 정의) | union에 2역할 추가 |
| 2 | 매트릭스 집계 | `admin-roles.ts` `getAdminRoles()` | admin_role → boolean/roles 매핑 추가 |
| 3 | 메뉴 필터 | `sidebar.tsx` navStructure 각 항목 `roles` | court_operator는 코트관리만, content_admin은 콘텐츠 그룹만 노출 |
| 4 | 콘솔 진입 가드 | `(admin)/admin/layout.tsx` | roles.length>0 가드는 자동 통과 (확인만) |
| 5 | API 가드 | 42개 API 중 해당 역할 허용 대상 | `isSuperAdmin` 단일체크 → 역할별 헬퍼로 교체 필요한 곳 선별 |
| 6 | (선택) admin_role 값 검증 | admin_role이 VarChar라 자유값 — 유저관리 UI에서 부여 | 부여 UI + 허용값 상수 |

### 회귀 위험 (super_admin 전권 보존)

- **`isSuperAdmin`은 단일 source**라 super_admin 판정 자체는 안전 (`role` 또는 `admin_role` OR 조건).
- **위험 지점**: 신규 역할 도입 시 기존 `if (!isSuperAdmin(session)) 403` 인라인 가드를 "역할별 허용"으로 바꾸는 과정에서, **super_admin이 OR로 항상 통과하도록 유지**하지 않으면 super_admin이 막힐 수 있음. 42개 API를 일괄 수정 시 누락 위험 → **신규 헬퍼는 반드시 super_admin 자동 흡수**(isRecorderAdmin 패턴처럼)로 설계.
- `admin_role`이 enum이 아닌 VarChar라 **오타 시 사일런트 권한 누락** (예: `content_admin` vs `content-admin`). → 상수 중앙화 강력 권장.

### 스키마 변경 필요 여부
- **admin_role 자체는 VarChar라 값 추가만으로 가능 → 컬럼 스키마 변경 불필요.**
- 단, court_operator가 "특정 코트에만 권한"이라면 **코트↔유저 매핑 테이블 신규 필요**(association_admin이 AssociationAdmin 매핑을 쓰는 것과 동일 패턴). content_admin은 전역이면 매핑 불필요.
- → **결정에 따라 갈림**: 전역 권한이면 스키마 변경 0, 범위 제한 권한이면 매핑 테이블 1개 신규.

### 결정 필요 사항
- (Q4C-1) **content_admin = 기존 site_admin 재활용**할지, 별도 신설할지. (역할 중복 정리)
- (Q4C-2) court_operator가 **전역**(모든 코트) vs **특정 코트 범위 제한**인지. → 후자면 매핑 테이블 신규.
- (Q4C-3) admin_role 부여 UI(유저관리)에서 신규 역할 선택지를 어떻게 노출할지.
- (Q4C-4) 신규 역할 도입 시 **허용값 상수 중앙화 + 역할별 가드 헬퍼**(super_admin 자동 흡수) 신설 동의 여부.

---

## 우선순위 / 의존관계 제안

```
4-A (대회 통합진입)  ── 독립, 저비용  ── 즉시 착수 가능 (Q4A-1만 결정)
        │
4-B (홈 배너편성)    ── 독립, 스키마 완비 ── 4-A와 병렬 가능 (Q4B-1~3 결정 후)
        │
4-C (RBAC 확장)      ── 설계 결정 선행 + 회귀 위험 ── 마지막. Q4C-1~4 결정 필수.
```

- **4-A, 4-B는 서로 독립** → 병렬 진행 가능.
- **4-C는 다른 두 항목의 권한 가드에 영향** → 만약 4-B 편성 UI를 신규 역할(content_admin)에게도 허용할 계획이면 **4-C를 먼저 또는 동시 설계**해야 함. content_admin이 site_admin 재활용으로 결정되면 의존성 해소 → 4-B 먼저 가능.

### 다음 단계 (결정 후)
1. 사용자가 Q4A-1 / Q4B-1~3 / Q4C-1~4 결정.
2. 결정 확정분부터 planner가 실행계획(파일별 작업 + 담당 에이전트) 수립.
3. developer 착수 전 각 항목 영향 파일 재확인 (특히 4-C API 42개 중 실제 수정 대상 선별).

---

## 검증 메타 (read-only 준수)
- 사용한 도구: Glob / Grep / Read 만. 코드 수정 0, DB 쿼리 0 (스키마 파일 정독으로 모델 확인).
- 임시 스크립트 생성 0.
