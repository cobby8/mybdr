# ADM-V0 — 관리자 리뉴얼 v52 시안 delta 분석

작성: 2026-07-01 · 대상: `Dev/design/BDR v2.41-admin-toss/` (활성) · **코드(src/) 수정 0**

세 폴더 비교:
- v52(최신): `Dev/design/_zips/v52/Dev/design/BDR v2.41-admin-toss/` (Jun 30 16:40)
- v51(직전): `Dev/design/_zips/v51/Dev/design/BDR v2.41-admin-toss/` (Jun 30 16:10)
- 활성: `Dev/design/BDR v2.41-admin-toss/` (Jun 28 gen)

---

## 1. v52가 v51 대비 "일부 수정"한 파일

전체 diff 결과 **코드 2개 + 썸네일 3개**만 변경. 나머지 파일은 v51 == v52 (동일).

| 파일 | 변경 요지 |
|------|-----------|
| **ops-pages.jsx** | 대회 **운영 워크스페이스**를 `window.AdminShell`(듀얼 사이드바)로 감쌈. 기존 standalone 중앙정렬(`.ws-wrap max-width:1160px`)에서 **full-width**(`max-width:100%; margin:0; padding:0`)로 전환. `OPS_NAV`(운영·구성 5항목 + 배지) + `OPS_NAVIGATE`(→`대회 관리자.html#id`) 추가. 자체 `ToastMount` 제거(AdminShell 안으로 흡수). 헤더 IA = `대회 관리자.html` 과 동일 정렬. |
| **wizard-pages.jsx** | 대회 **생성·수정 위저드** 2개 화면을 `window.AdminShell`로 감쌈(듀얼 사이드바 항상 노출). `.wz-wrap` 은 760px 유지하되 padding 0. `WZ_NAV`/`WZ_NAVIGATE`/`WZ_USER` 상수 추가. (라인 +17) |
| thumbs/create.jpg | 생성 위저드 스크린샷 갱신(사이드바 반영) |
| thumbs/edit.jpg | 수정 위저드 스크린샷 갱신(사이드바 반영) |
| thumbs/ops.jpg | 운영 워크스페이스 스크린샷 갱신(사이드바 반영) |

**요지 한 줄**: v52 = "운영/위저드 화면을 독립 레이아웃 → **관리자 콘솔 듀얼 사이드바(AdminShell) 통합**"으로 IA 일관화. 신규 컴포넌트/토큰 추가 없음.

---

## 2. v52 ↔ 활성(Jun 28 gen) 신규/갱신 파일

활성 폴더는 Jun 28 세대(workspace.jsx·operate.jsx·panels-*·bo-detail* 등 옛 구조), v52 는 Jun 30 재구조화 세대(hub/ops/wizard/admin-forms 분할). 아래는 v52 → 활성 복사로 반영된 목록.

**신규(활성에 없던 파일, 9건)**
- `admin-forms.jsx` · `hub-data.jsx` · `hub-pages.jsx` · `ops-data.jsx` · `ops-pages.jsx` · `wizard-pages.jsx`
- `thumbs/` (bo·create·edit·hub·ops·partner·ref·ta.jpg)
- `_실제관리자-구조분석.md` · `관리자 시안 전체.html`

**갱신(v52가 활성 대비 최신, 18건)**
- 코드: `admin-blocks.jsx` · `admin-pages.css` · `admin-shell.jsx` · `bo-data.jsx` · `bo-pages.jsx` · `referee-pages.jsx` · `ta-data.jsx` · `ta-pages.jsx` · `toss.css`
- 문서: `HANDOFF.md`
- HTML 진입점 8개: `관리자 홈` · `대회 관리자` · `대회 생성` · `대회 수정` · `대회 운영` · `백오피스` · `심판 관리자` · `협력업체 콘솔`

> 참고: `toss-kit.jsx`·`partner-data.jsx`·`partner-pages.jsx`·`referee-data.jsx` 는 v52 == 활성(동일).
> `bo-data/bo-pages/referee-pages/ta-*` 는 v51 == v52(동일) → 이 갱신은 **v52의 delta가 아니라 v51 이전 세대에서 이미 발생**한 누적 갭.

---

## 3. 운영(src/admin-v2) delta 요지 — ADM-V1 정합 검증 대상

읽기만 수행(src 수정 0). v52 시안 5개 산출물 ↔ 운영 파일 비교.

| 시안(v52) | 운영 | delta 요지 |
|-----------|------|-----------|
| `toss.css` | `src/styles/admin-v2/toss.css` | **토큰 값 1:1 동일**(색·라운딩·그림자·간격·클래스명). 운영은 ① 전 셀렉터 `[data-admin="v2"]` 스코프 격리, ② globals.css 상속 차단용 **font 리셋 블록**(font-size 16px/line-height normal/font-feature-settings normal), ③ `::selection`·`a:hover` 톤 리셋 추가. ④ 운영에만 있는 셸 헬퍼: `.ts-backbtn`·`.ts-backrow`·`.ts-cancelbtn`, 사이드바 `overflow-y:auto`·foot flex, `.ts-shell,` self-셀렉터. ⑤ `sidebar__brand` padding top 운영 16px vs 시안 22px. → **토큰 정합 OK, 셸 세부만 운영이 앞섬/상이**. |
| `admin-pages.css` | `src/styles/admin-v2/admin-pages.css` | **시안 셀렉터 전부 운영에 존재**(시안-only 0건). 운영이 **상위집합**(운영 234줄 vs 시안 141줄) — 운영은 `.bo-*` 백오피스 상세(bo-hero·bo-launch·bo-field·bo-chip·bo-featrow 등) + `.ad-kpi__icon[data-tone=violet]` 등 추가 보유. → 시안 admin-pages.css 는 슬림, 운영이 더 풍부. |
| `toss-kit.jsx` | `src/components/admin-v2/kit.tsx` | 운영 exports: `Icon·Badge·Btn·Toggle·Check·Modal·StepDots` 등 커버. 시안 kit 은 정본 데모. 컴포넌트 세트 정합. |
| `admin-shell.jsx` | `src/components/admin-v2/shell.tsx` | ⚠ **핵심 아키텍처 갭**. v52 시안 `AdminShell` = **듀얼 레일+패널**(RAIL 76px 아이콘 레일 + PANEL 236px 확장 패널, `flatPanel`·`roles` prop). 운영 `AdminShell` = **단일 `.ts-sidebar`(248px)** 세대(Jun 28). → ADM-V1 최우선 정합 항목: 운영 셸을 듀얼 레일+패널로 갱신할지 결정 필요. |
| `admin-blocks.jsx` | `src/components/admin-v2/blocks.tsx` | 운영 exports: `PageHead·KpiGrid·DataTable·Empty·AdBarPanel·AdListPanel·AdSettings·SchemaList·Modal·StepDots·buildDetailPayload·renderSchemaCell·useAdminShell`. 시안 blocks 대비 대체로 커버. 세부 diff 는 ADM-V1 박제 시 대조. |

**ADM-V1 정합 우선순위**
1. **admin-shell**: 듀얼 레일+패널(시안 v52) ↔ 단일 사이드바(운영) — 셸 교체 결정.
2. **toss.css sidebar 계열**: `.ts-sidebar__brand` padding, back/cancel 버튼 존재 여부 정합.
3. **admin-pages.css**: 운영이 상위집합 → 시안 슬림본 기준 회귀 없는지 확인(운영 `.bo-*` 유지).

---

## 4. 활성 폴더 보강 결과

방식: v52 → 활성 **덮어쓰기+추가, 삭제 없음**(보강). BDR-current·_zips 미터치.

- **추가 9건**: admin-forms.jsx, hub-data.jsx, hub-pages.jsx, ops-data.jsx, ops-pages.jsx, wizard-pages.jsx, thumbs/(8 jpg), _실제관리자-구조분석.md, 관리자 시안 전체.html
- **갱신 18건**: admin-blocks.jsx, admin-pages.css, admin-shell.jsx, bo-data.jsx, bo-pages.jsx, referee-pages.jsx, ta-data.jsx, ta-pages.jsx, toss.css, HANDOFF.md, HTML 8개
- **검증**: 복사 후 v52 전 파일 `cmp` 일치(잔차 0). BDR-current·_zips git status 무변화 확인.
- **보존(미삭제) 활성-only 옛 파일**: workspace.jsx·operate.jsx·panels-core.jsx·panels-ops.jsx·bo-detail.jsx·bo-detail-2.jsx·data.jsx·bracket.jsx·schedule.jsx·site-pages.jsx·public-site-*·screenshots/·_qa/ 및 옛 문서 다수. → **PM 검토 후 정리 여부 결정**(보강 원칙상 자동 삭제 안 함).

> git 커밋은 하지 않음(PM 검토 대기).
