# BDR v2.41 / v2.42 관리자 — 구현 핸드오프

## v2.42 추가 (Public Site Data Sync + Admin Toss State QA)

| 산출물 | 내용 |
|---|---|
| `public-site-preview.html` + `public-site-data.jsx` + `public-site-pages.jsx` | 공개 사이트 **44팀/27경기 통일 시안**. 상단 데모 바로 발행상태 7단계 전환. BDR 13룰/Material Symbols/AppNav 미적용(별도 서브도메인). |
| `admin-state-preview.html` + `admin-state.jsx` | 관리자 Toss **8상태 QA 갤러리** (loading/empty/error/saving/saved/permission/mobile/destructive). toss.css + toss-kit.jsx 재사용, `st-` prefix 신규 상태 컴포넌트. |
| `PUBLIC-SITE-DATA-MAP.md` | 관리자→저장→공개 필드 대응표 + 발행상태 가시성 매트릭스 + 연동 필요 필드. |
| `ADMIN-TOSS-STATE-QA.md` | 화면별 상태 매트릭스 + 누락 보강 컴포넌트 + 구현 우선순위. |

**PM 결정 반영** — 공개 사이트 38팀 fiction **폐기**, 관리자 44팀/27경기로 통일(권장안). 발행 전 데이터 **기본 비노출**(발행 섹션만). 종료 후 스탯/기사 미보유 시 **"공식 기록 준비중"**(mock 기사 금지). 기존 `토너먼트 사이트.html`(38팀)은 구버전 — 구현은 v2.42 통일본(`public-site-*`) 기준.

## v2.42 통합 보강 (Admin Toss 100% 정합 핸드오프)

> 대회 운영(workspace + 7패널)을 운영 박제 가능 수준으로 보강 + Codex CLI용 정리/계약 문서.

**미리보기 6 (검수 진입점)** — 공용 셸 `preview-shell.jsx`+`preview.css`(viewport 390/720/1024/1440 전환 + 상태 가이드). **실제 운영 컴포넌트를 그대로 마운트** → 검수자가 상태를 직접 구동.

| 파일 | 마운트 | 검수 |
|---|---|---|
| `tournament-ops-preview.html` | `OperateWorkspace` | 셸 6메뉴 + 반응형 |
| `teams-preview.html` | `TeamsPanel` | 승인/대기/거절/코치/납부/import 9상태 |
| `bracket-preview.html` | `BracketPanel`(full) | config/seeding/drawn·조별·토너먼트·듀얼·발행 |
| `schedule-preview.html` | `SchedulePanel` | empty·자동·수동·드래그·휴식·대진반영 |
| `matches-preview.html` | `MatchesPanel` | 예정/진행/종료·필터·ScoreModal·기록방식 |
| `site-recorders-admins-preview.html` | `SitePanel`+`RecordersPanel`+`AdminsPanel` | 위자드·발행·배정·역할 |

**구현 핸드오프 문서 6**
| 문서 | 내용 |
|---|---|
| `PARITY-MATRIX.md` | 시안 컴포넌트/class/function → 운영 파일 1:1 매핑 |
| `CLEANUP-MANIFEST.md` | au-/admin-/ta-/components-ui/Material Symbols 삭제·교체 기준 + 아이콘 매핑 |
| `TOURNAMENT-OPS-STATES.md` | workspace+패널 상태표(idle~destructive) |
| `DATA-CONTRACT.md` | 화면별 필드 + 🔴 NEW FIELD NEEDED 9건 |
| `RESPONSIVE-QA.md` | 390/720/1024/1440 체크리스트 |
| `ADMIN-TOSS-STATE-QA.md` | 공통 상태 컴포넌트(`st-*`) |

**Toss 유지 / 공개 분리** — 관리자 = Toss(lucide/`Icon`/Toss blue/`ts-/ct-/amt-/sc-/bk-/op-/tw-`) 그대로. 공개 사이트 = BDR 13룰/Material Symbols 유지(별도). 하이브리드 fallback 없음.

**P2 — 관리자 전페이지 Toss 재구현 범위표**

| 그룹 | 페이지 | 시안 충분? | 추가 시안 | Toss 매핑 | au-* 처분 | 모바일 |
|---|---|---|---|---|---|---|
| 대회 관리자 | tournaments [id] 운영 | ✅ v2.42 | — | operate/panels-* | 교체 | ✅필요 |
| 대회 관리자 | tournaments new/edit | ✅ | — | 마법사(panels-ops) | 교체 | ✅ |
| 대회 관리자 | list / organizations / series / templates | 🟡 부분 | 목록·상세 시안 | DataTable/admin-shell | 교체 | ✅ |
| 최고 관리자 | /admin, /admin/tournaments[id] | 🟡 백오피스 셸만 | 화면별 시안 | admin-shell/blocks | 교체 | ✅ |
| 최고 관리자 | audit-log / transfer-organizer | 🔴 | 신규 시안 | DataTable + Modal | 교체 | ⚠ |
| 유저/조직 | users / organizations / teams | 🟡 | 목록·상세 | DataTable | 교체 | ✅ |
| 운영 콘텐츠 | news / community / suggestions / partners | 🟡 partner 콘솔만 | 콘텐츠 CRUD 시안 | DataTable + 폼 | 교체 | ✅ |
| 비즈니스 | payments / plans / settings | 🔴 | 신규 시안 | DataTable + 폼 | 교체 | ✅ |
| 기록앱 영향 | /admin/agents, logs | 🔴 | 신규 시안 | DataTable | 교체 | ⚠ |

> P2는 대회 운영 박제 완료 후 진행. 각 그룹은 `admin-shell.jsx`(AdminShell/PageHead/KpiGrid/DataTable) + `toss-kit` 재사용 — 신규 시안은 🔴/🟡 표식 페이지만.

---

> 이 폴더는 **대회 관리자 영역 전체 시안의 최종본**입니다. 실제 구현은 이 시안과 **픽셀 단위로 동일**하게 진행합니다.
> 기능·상태 계약: `_qa/function-lock-B1.md` 미존재 시 `_qa/admin-toss-coverage-B1.md` + `_qa/deadbutton-audit-B1.md` 참고. 전체 개요는 `README.md`.

## 1. 진입 화면 (8 HTML)

| 파일 | 화면 | 비고 |
|---|---|---|
| `대회 운영.html` | 대회 운영 워크스페이스 | 요약 + 5섹션 메가폼 + 7패널(참가팀/대진표/일정/운영관리/사이트/정산) |
| `대회 생성.html` | 대회 생성 마법사(5단계) | |
| `대회 수정.html` | 대회 수정 | |
| `대회 관리자.html` | 대회 관리자 셸 | 대시보드/대회목록/단체·주최/시리즈/템플릿 |
| `백오피스.html` | 플랫폼 백오피스 | 7그룹 18화면 |
| `협력업체 콘솔.html` | 파트너 self-serve | 대시보드/내 시설/캠페인/정산 |
| `심판 관리자.html` | 심판 배정 운영 | 12화면 |
| `토너먼트 사이트.html` | 공개 토너먼트 사이트 | 서브도메인(`*.mybdr.kr`). AppNav 미적용·토큰만 일치 |

## 2. 공유 모듈

- **디자인 토큰**: `toss.css` (Toss = MyBDR 공식 관리자 DS — `--primary #3182F6`, rounded-full, `ts-*` 유틸)
- **키트**: `toss-kit.jsx` (Icon=lucide / Btn / Badge / Modal / Toggle / Check / StepDots / Empty)
- **공용 셸·블록**: `admin-shell.jsx` (AdminShell·PageHead·KpiGrid·DataTable) · `admin-blocks.jsx` (SchemaList·AdBar/List/Settings) · `admin-pages.css`
- **워크스페이스 보완**: `workspace.css` (`ct-*`·`amt-*`·`bk-*` 대진표) · `workspace.jsx` · `panels-core.jsx` · `panels-ops.jsx` · `bracket.jsx` · `schedule.jsx` · `operate.jsx`
- **공개 사이트**: `site.css` · `site-data.jsx` · `site-pages.jsx` (`s-bracket` 대진표 포함)
- **데이터(mock)**: `data.jsx` · `bo-data.jsx` · `partner-data.jsx` · `referee-data.jsx` · `ta-data.jsx` · `site-data.jsx`

## 3. 외부 의존성 (CDN — 모든 HTML 공통)

- Pretendard `v1.3.9` (jsDelivr) · JetBrains Mono (Google Fonts)
- React / ReactDOM `18.3.1` (UMD, integrity 고정) + Babel standalone `7.29.0`
- lucide `@latest` (`window.lucide.createIcons()` via toss-kit Icon)

## 4. 구현 주의 (시안 = 동작 기준)

- 모든 서버 호출은 **mock 상태 시연**입니다(실 API/Prisma/라우트 없음). 캘린더·필터·토글·import 파싱·토스트 등 순수 클라이언트 동작만 실제. 백엔드 배선 시 mock 자리에 실 데이터/엔드포인트만 끼웁니다.
- 대진표(`bk-*` 운영 / `s-bracket` 공개): flex-밴드 연결선 구조. 셀 `min-height: 92px`(2줄 카드 겹침 방지) — **이 값 미만으로 낮추면 카드 겹침 회귀**.
- 공개 참가신청: 로그인 + 팀 보유 게이트(미로그인/팀없음/팀보유 3상태). 자유 팀명 입력 금지 — MyBDR 생성 팀만 선택, 대표만 신청 가능.
- 색상/아이콘/라운딩은 `toss.css` 토큰·lucide만. 도메인 hex 예외는 site 템플릿 미리보기·유니폼 16저지색·팀 색에 한함.

## 5. 데이터 정합성 점검 (구현 전 확인)

### 수정 완료 ✅ (이번 점검에서 배선·데이터 보정)
- **"BDR 서머 오픈 #4" 참가팀 수 = 44 로 통일.** 운영 워크스페이스는 종별 정원(오픈16/아마12/U18 8/U15 8 = 44)에 맞춰 팀 배열·대진표가 44팀 기준으로 구성돼 있음. 이전에 `summary.teamCount`·대회 관리자 목록·백오피스 목록이 38 로 표기돼 **목록(38) → 운영(44) 클릭 시 숫자 점프** 발생 → 모두 44 로 보정.
- **경기 수 = 27 로 통일.** 운영 `matchCount`/`matchStats.total` = 27(듀얼 포맷 구조값: 조별 20 + 토너먼트 7). 대회 관리자 활동피드 "31경기" → "27경기" 보정.
- 참가팀 배열 44팀 전원 `approved`, 종별별 정원=신청수(만석). 등록경로 stat(운영자13+코치15+본인16=44) = 토큰 44 일치.
- 결과 기록 배열(`WS.matches`)은 27경기 중 **기록 완료 4건 샘플**(완료1/예정1/대기1/진행1) — 의도된 부분집합. 구현 시 27경기는 대진표에서 생성.

### ✅ 해결됨 (v2.42) — 공개 사이트 데이터 통일
이전 ⚠ 항목(공개 사이트 38팀 fiction 분리)은 v2.42에서 **44팀/27경기로 통일 해결**. 공개 사이트는 관리자 `WS` 파생 단일 source(`public-site-data.jsx`)를 사용하며, 발행 상태별 섹션 가시성으로 노출을 제어합니다. 상세는 상단 v2.42 섹션 + `PUBLIC-SITE-DATA-MAP.md` 참고. 구현은 `public-site-*`(44팀) 기준, 구 `토너먼트 사이트.html`(38팀)은 대체됨.

## 6. 로컬 실행

각 HTML은 정적 파일 — 동일 폴더에서 정적 서버로 열면 됩니다(상대경로 `.jsx`/`.css` 로드). 예: `npx serve` 후 해당 HTML 접속.
