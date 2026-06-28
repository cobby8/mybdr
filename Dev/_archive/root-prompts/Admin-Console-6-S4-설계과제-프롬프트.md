# 프롬프트 ⑥ — S4: 설계 과제 (코드 > 스키마)

> 큰 단위 3건. 각 항목 **진단(SELECT/grep 먼저) → 설계 결정 → 박제** 순. subin 브랜치.
> S1·S3 이후 진행 권장. 일부는 디자인 클로드 협의 필요(표시).

## 4-A. 대회 통합 진입 (Series Operator ↔ site)  · 난이도 中
- 현재: 대회 운영이 `tournament-admin` 별 셸 + `/admin/tournaments` 분리.
- 목표: 콘솔 '대회 운영' 탭 → `/admin/tournaments` 감시 목록 → 개별 대회 셋업 **deep-link**.
- CLI: 라우팅·링크 통합만(데이터/뮤테이션 기존 유지). 권한은 4-C 매핑.
- 디자인: 콘솔 탭 ↔ 기존 화면 진입 흐름 확정.

## 4-B. 홈 배너 편성 (campaigns 확장)  · 난이도 中~高
- 자산: `ad_campaigns` / `ad_placements` 존재 + `/admin/campaigns`.
- 진단 먼저: `ad_placements` 스키마 + 홈 프론트가 배너를 어디서 읽는지(home API/컴포넌트) grep.
- 설계: 홈 히어로/추천 슬롯을 **placement code 로 정의** → 캠페인 편성 UI(어느 placement 에 어느 캠페인). 프론트 홈이 placement 를 읽도록.
- 결정 항목: placement code 체계 / 노출 우선순위·기간. 디자인 협의.

## 4-C. RBAC enforcement — org_admin / content_admin 신규  · 난이도 中
- 현재 실재: `super_admin`(sentinel) · `association_admin` 2개. `org_admin`/`content_admin` = 미사용(희망값).
- 목표: 콘솔 4역할(Site/Series/Court/콘텐츠) ↔ 운영 role 정합.
- 단계:
  1. `User.admin_role` 값 체계 확정(수빈 결정): super_admin / association_admin 유지 + `court_operator` / `content_admin` 신규 도입 여부.
  2. enforcement 헬퍼(`is-super-admin.ts`/`roles.ts`) 확장 — role→허용 그룹 매핑(콘솔 메뉴 필터 = 이 매핑 미러).
  3. 신규 admin API(S1·S2 포함) 가드를 super_admin 단독 → **role별 허용**으로 확장.
- ⚠️ 권한 변경은 보안 민감 → 단계별 + 회귀(기존 super_admin 전권 보존) 확인.

## 부속 (S4 외 — 이미 처리됨)
- games.status Int↔라벨: 콘솔 `GAME_STATUS_MAP` 반영 완료(데이터). 운영 매핑 = `game-status.ts` 재사용.

## 공통 검증·기록
- 각 항목 진단 결과 먼저 보고 → 결정 → 박제. `decisions.md`(RBAC/placement 체계) 필수 기록.
- 권한·홈노출 변경은 운영 영향 큼 → 회귀 체크 + 단계 배포.
