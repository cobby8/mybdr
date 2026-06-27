# MyBDR 관리자 — 구현 핸드오프 패키지 (v2.41 / v2.42 정본)

> **이 패키지는 MyBDR 관리자 영역 전체의 "시안 정본(canonical mockups)"입니다.**
> 목표: 레거시 관리자 코드를 **전량 제거**하고, 이 시안과 **디자인·기능·상태·데이터까지 픽셀/동작 단위로 동일하게** 새로 구현합니다.
> 이 문서 하나로 구현 착수가 가능하도록 작성했습니다. 깊은 세부는 §10 문서 인덱스의 계약 문서를 참고하세요.
> **시각 정본은 `screenshots/`** (화면별 캡처 + `screenshots/INDEX.md`). **전달용 구현 프롬프트는 `IMPLEMENTATION-PROMPT.md`**.

---

## 1. Overview

MyBDR(전국 농구 매칭 플랫폼)의 관리자/운영 영역입니다. 9개 standalone 화면(콘솔 4 + 대회 운영 워크스페이스 3 + 공개 사이트 1 + 통합 허브 1)과, 각 화면을 구성하는 공유 컴포넌트·데이터 모듈로 이뤄집니다.

- **대회 운영**: 생성 마법사 → 운영 워크스페이스(6메뉴/7패널) → 정보 수정
- **콘솔**: 대회 관리자 · 플랫폼 백오피스(18화면) · 협력업체 콘솔 · 심판 관리자(12화면)
- **공개**: 토너먼트 사이트(서브도메인 발행)

## 2. 이 패키지는 무엇인가 (필독)

번들된 `.html` 파일들은 **production 코드가 아니라 HTML로 만든 디자인 레퍼런스(프로토타입)**입니다. 의도한 **모양과 동작**을 그대로 보여줍니다.

구현 작업은 이 HTML을 **그대로 배포하는 것이 아니라**, 타깃 코드베이스(기존 React/Next 등)의 패턴·라이브러리로 **재현(recreate)** 하는 것입니다. 기존 환경이 없다면 가장 적합한 프레임워크를 선택해 구현합니다. 단, **시각/동작 결과물은 이 시안과 동일**해야 합니다.

> 레거시 처분 기준은 `CLEANUP-MANIFEST.md`(au-/admin-/components-ui/Material Symbols 삭제·교체 + 아이콘 매핑)를 따릅니다.

## 3. Fidelity — **High-fidelity (hifi)**

최종 색·타이포·간격·라운딩·인터랙션이 확정된 픽셀 단위 시안입니다. 색상·폰트·여백·상태 전환을 **그대로** 재현하세요. 토큰은 §7, 컴포넌트→파일 1:1 매핑은 `PARITY-MATRIX.md`.

## 4. 로컬 실행

각 HTML은 정적 파일이며, **같은 폴더에서** 상대경로로 `.jsx`/`.css`를 로드합니다.

```bash
# 패키지 루트(design_handoff_admin/)에서
npx serve .
# 브라우저에서 각 HTML 열기 (예: "관리자 홈.html")
```

- React/ReactDOM 18.3.1(UMD, integrity 고정) + Babel standalone 7.29.0 (브라우저 트랜스파일 — 시안 전용. 구현은 빌드 타임 JSX로 교체).
- Pretendard v1.3.9 / JetBrains Mono / lucide@latest CDN.

## 5. 진입 화면 (9 HTML)

| 파일 | 화면 | 마운트 컴포넌트 | 구성 |
|---|---|---|---|
| `관리자 홈.html` | 관리자 통합 허브 | (정적) | 전체 화면 카드 인덱스 + 검색 |
| `대회 운영.html` | 대회 운영 워크스페이스 | `OperateWorkspace` | 요약 + 6메뉴(참가팀/대진표/일정/운영관리/사이트/정산) |
| `대회 생성.html` | 새 대회 만들기 | `TournamentWorkspace mode="create"` | 5단계 마법사 |
| `대회 수정.html` | 대회 수정 | `TournamentWorkspace mode="edit"` | 인라인 메가폼 + 7패널 |
| `대회 관리자.html` | 대회 관리자 셸 | `TournamentAdminApp` | 대시보드/대회목록/단체·주최/시리즈/템플릿 |
| `백오피스.html` | 플랫폼 백오피스 | `BackofficeApp` | 7그룹 18화면 |
| `협력업체 콘솔.html` | 파트너 self-serve | `PartnerApp` | 대시보드/내 시설/캠페인/정산 |
| `심판 관리자.html` | 심판 배정 운영 | `RefereeApp` | 12화면 |
| `토너먼트 사이트.html` | 공개 토너먼트 사이트 | `SiteApp` | 서브도메인 `*.mybdr.kr` (구버전; 구현은 `public-site-*` 통일본 기준) |

**검수용 미리보기 8 HTML**(`*-preview.html`, `admin-state-preview.html`) — 실제 운영 컴포넌트를 viewport 전환(390/720/1024/1440) + 상태 가이드와 함께 마운트합니다. 상세: `HANDOFF.md` / `RESPONSIVE-QA.md` / `ADMIN-TOSS-STATE-QA.md`.

## 6. 공유 모듈

- **디자인 토큰**: `toss.css` — Toss = MyBDR **공식 관리자 디자인시스템**. `ts-*` 유틸. (사용자 공개 앱의 BDR Red/다크/Material 시스템과 **완전 분리**)
- **키트**: `toss-kit.jsx` — `Icon`(lucide) / `Btn` / `Badge` / `Modal` / `Toggle` / `Check` / `StepDots` / `Empty`
- **공용 셸·블록**: `admin-shell.jsx`(`AdminShell`/`PageHead`/`KpiGrid`/`DataTable`) · `admin-blocks.jsx`(`SchemaList`/`AdBarPanel`/`AdListPanel`/`AdSettings`/`renderSchemaCell`) · `admin-pages.css`
- **워크스페이스**: `workspace.jsx` · `operate.jsx` · `panels-core.jsx` · `panels-ops.jsx` · `bracket.jsx` · `schedule.jsx` · `workspace.css`
- **공개 사이트**: `site-pages.jsx` · `site-data.jsx` · `site.css` (+ 통일본 `public-site-pages.jsx`/`public-site-data.jsx`)
- **데이터(mock)**: `data.jsx`(`window.WS`) · `bo-data.jsx` · `partner-data.jsx` · `referee-data.jsx` · `ta-data.jsx`
- **미리보기 셸**: `preview-shell.jsx` · `preview.css` · `admin-state.jsx`

## 7. 디자인 토큰 (toss.css 발췌 — 정본은 파일)

```
색상   --primary #3182F6  --primary-hover #1B64DA  --primary-weak #E8F1FE
       --ink #191F28  --ink-soft #4E5968  --ink-mute #8B95A1  --ink-dim #B0B8C1
       --bg #F2F4F6  --card #FFFFFF  --border #E5E8EB  --border-strong #D1D6DB
       --danger #F04452  --ok #15B86A  --warn #FF9500  (각 *-weak 동반)
       grey scale: 900 #191F28 … 50 #F9FAFB
라운딩  card 24 / btn 16 / input 14 / chip 12 (px) — pill(999)은 toggle 등 한정
그림자  --sh-xs/sm/md/lg
폰트   본문 Pretendard, 모노 JetBrains Mono
아이콘  lucide (Material Symbols 사용 금지 — 관리자 영역)
사이드바 폭 248px / 모바일 분기 900px
```

## 8. 인터랙션 · 상태 원칙

- 모든 서버 호출은 **mock 상태 시연**(실 API/Prisma/라우트 없음). 캘린더·필터·토글·import 파싱·토스트·드로어 등 **순수 클라이언트 동작은 실제**. 백엔드 배선 시 mock 자리에 실 데이터/엔드포인트만 끼웁니다.
- 글로벌 UX: `window.adToast(msg)` 토스트 · `window.adDetail(payload)` 행 상세 드로어(`.ad-drawer`).
- 상태 매트릭스(loading/empty/error/saving/saved/permission/mobile/destructive): `ADMIN-TOSS-STATE-QA.md` + `TOURNAMENT-OPS-STATES.md`.
- 반응형 체크리스트(390/720/1024/1440): `RESPONSIVE-QA.md`.
- 대진표(`bk-*` 운영 / `s-bracket` 공개): flex-밴드 연결선. 셀 `min-height: 92px` 미만 금지(카드 겹침 회귀).

## 9. 진입점(네비게이션) 연결 맵 — **구현 시 동일 보장**

> 시안에서 화면 간 실제 이동을 모두 배선해 둠. 구현 시 라우팅으로 1:1 매핑.

- 백오피스 **대회** 행 → 대회 운영 워크스페이스 · **협력업체** 행 → 협력업체 콘솔
- 대회 관리자: 대시보드 "새 대회" → 대회 생성 · 목록 행 → 대회 운영 · 목록 "사이트" → 토너먼트 사이트 · 템플릿 "이 템플릿으로 생성" → 대회 생성
- 대회 운영: 우상단 "대회 정보 수정" → 대회 수정 · 사이트 "방문하기" → 토너먼트 사이트
- 4개 콘솔 사이드바 브랜드 → 관리자 홈
- 메커니즘: `SchemaList`의 `schema.rowHref`(문자열|(row)=>url) 설정 시 행 클릭이 페이지 이동, 없으면 읽기전용 상세 드로어.

데드버튼/연결 전수 감사: `_qa/deadbutton-audit-B1.md`.

## 10. 문서 인덱스 (계약 문서)

| 문서 | 역할 |
|---|---|
| `README.md` | 폴더 개요 · 구현 범위 대조 |
| `HANDOFF.md` | 버전별 보강 내역 · 진입화면 · 데이터 정합성 점검 |
| `PARITY-MATRIX.md` | 시안 컴포넌트/class/function → 운영 파일 1:1 매핑 |
| `CLEANUP-MANIFEST.md` | 레거시 삭제·교체 기준 + 아이콘 매핑 |
| `DATA-CONTRACT.md` | 화면별 필드 + 🔴 NEW FIELD NEEDED 9건 |
| `TOURNAMENT-OPS-STATES.md` | 워크스페이스+패널 상태표 |
| `RESPONSIVE-QA.md` | 반응형 체크리스트 |
| `ADMIN-TOSS-STATE-QA.md` | 공통 상태 컴포넌트(`st-*`) |
| `PUBLIC-SITE-DATA-MAP.md` | 관리자→저장→공개 필드 대응 · 발행상태 가시성 |
| `_qa/admin-toss-coverage-B1.md` · `_qa/deadbutton-audit-B1.md` | 기능 커버리지 · 데드버튼 감사 |

## 11. 레거시 제거 + 구현 체크리스트

1. 기존 관리자 라우트/컴포넌트(`au-*`, `admin-*` 구본, `components-ui`, Material Symbols) **제거** → `CLEANUP-MANIFEST.md` 매핑대로 교체.
2. `toss.css` 토큰 + `toss-kit`/`admin-shell`/`admin-blocks`를 코드베이스 컴포넌트로 재현(스타일 값 그대로).
3. 9 진입 화면을 라우트로 구성, §9 네비게이션 맵 배선.
4. mock 데이터(`*-data.jsx`)를 실제 모델/엔드포인트로 치환 — `DATA-CONTRACT.md`의 신규 필드 9건 반영.
5. 상태(§8)·반응형(390/720/1024/1440) QA 통과.
6. 공개 사이트는 `public-site-*`(44팀/27경기 통일본) 기준, 구 `토너먼트 사이트.html`(38팀) 대체.

---

_MyBDR — 전국 농구 매칭 플랫폼 · 관리자 영역 시안 정본 · v2.41/2.42 · 2026_
