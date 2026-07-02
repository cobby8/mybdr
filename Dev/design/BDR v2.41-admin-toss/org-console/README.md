# 단체 Self-Serve 운영 콘솔 — P1 (admin-v2 / Toss)

진입 라우트: **`/org-console`** (단체 owner·admin 전용) · 엔트리: `org-console.html`

> ⚠ 이 콘솔은 **admin-v2(Toss) 계열** — `toss.css` 토큰 + lucide 아이콘 + `AdminShell`/`PageHead`/`KpiGrid`/`Btn`/`Badge`/`Modal` 정본 재사용.
> BDR 13룰 / AppNav frozen / Material Symbols / 4px 라운딩 **미적용** (그건 공개 단체사이트 = BDR v2 전용).

> 📌 **[CLI 이관 노트 2026-07-02]** 이 폴더는 Claude.ai "BDR v2" 프로젝트의 `Dev/design/BDR-current/`(Claude.ai 환경 신규 생성)에서 CLI(DesignSync MCP)로 가져와, 로컬 `Dev/design/BDR v2.41-admin-toss/org-console/`에 격리 저장한 것. 로컬 `BDR-current/`는 공개웹(PUB) 리뉴얼 번들이라 섞지 않음.
> 공유 정본(`toss.css`·`admin-pages.css`·`toss-kit.jsx`·`admin-forms.jsx`·`admin-shell.jsx`·`admin-blocks.jsx`)은 **상위 폴더(`../`) admin-toss 버전을 재사용**(html의 상대경로 `../`로 참조). 별도 복제 안 함.

## P1 상세 제작 (2화면)
| 화면 | id | 내용 |
|---|---|---|
| 대시보드 | `dash` | 인증 유도 배너(진행률 40%) · KPI 4(멤버·시리즈·진행중 대회·인증 진행률) · 시작하기(온보딩 체크리스트) · 최근 활동 |
| 단체 정보 | `profile` | 브랜딩(배너+로고, 업로드 위젯 컨셉) · 기본 정보 조회↔편집(저장 토스트) · 인증·서류 현황 |

## 레일 자리 (골격 skeleton + 잠금 컨셉)
멤버 · 임원(직책) · 소속 팀 · 회원 신청 · 대회·리그 · 하위 단체(1단) · 공지 → **준비중**(골격 + 출시 알림)
회비 정산 → **잠금**(정산 출금은 인증 완료 후) — 잠금은 정산출금·공식대회 자격에만.

## 상태 (전 화면)
상단 **상태 미리보기 바**로 대시보드·단체 정보의 `정상 / 로딩(스켈레톤) / 빈 상태 / 에러(재시도)` 전환.
`성공` = 저장·초대·제출 시 토스트. `준비중/잠금(disabled)` = 레일 자리 + 컨셉 라벨.

## 백엔드 경계 (브리프 §2 준수)
- **[기존 DB] 실동작 목표**: 기본 정보(단체명·유형·활동지역·소개·연락처) 조회/편집/저장 · KPI(멤버·시리즈·대회)
- **[ADD/신규] 컨셉(준비중)**: 로고·배너 업로드, 인증·서류, 인증 진행률 — 모두 `준비중` 라벨/톤, 실데이터 와이어 가정 없음
- **금지 mock 배제**: 설립연도·본부주소·운영원칙·스폰서·브랜드색상 없음. 브랜드 색상은 `orgColor(id)` 해시 자동 생성(직접 지정 UI 없음)
- **점진적 온보딩**: 장벽0 즉시 시작 · 인증/정산은 "필요할 때" deferred 유도 · 기본 사용 안 막음

## 파일
- `org-console.html` — 엔트리
- `org-data.jsx` — 컨셉 데이터 + `orgColor`/`ORG_VERIFY`/`ORG_RAILS` 등
- `org-pages.jsx` — 대시보드·단체 정보·ComingSoon·셸(OrgApp)·상태 데모 바
- `org-console.css` — 콘솔 전용 클래스(배너·온보딩·브랜딩·서류·골격·상태)
- 공용(정본 카피): `toss.css` · `admin-pages.css` · `toss-kit.jsx` · `admin-forms.jsx` · `admin-shell.jsx` · `admin-blocks.jsx` → **상위 `../` 폴더 참조**

## PM 확인 필요 (박제 시 반영)
1. `org-data.jsx`의 `type`(단체 유형: 협회/연맹/클럽/동호회) 필드 = **organizations 스키마에 `type` 컬럼 없음** → 박제 시 [DB] 실동작 불가. 무중단 ADD 또는 "컨셉" 처리 결정 필요.
2. `intro`→`description` / `email`→`contact_email` / `phone`→`contact_phone` 매핑. slug/is_public/website_url은 시안 필드에 없음(편집 대상 아님).
