# Admin Toss v2.41 Full Parity Audit

Date: 2026-06-26
Scope: 관리자 Toss 영역 100% 시안 정합 정리 계획
Source of truth: `Dev/design/BDR-current/_handoff-admin-toss-v2.41/`

## 0. 결론

현재 문제는 단순 CSS 누락이 아니라 **v2.41 Toss 시안층 + v2.40 Admin Console층 + 기존 BDR/Material 계열 + 최근 보정용 `tw-*`/`ta-*` 계층이 혼재**된 구조 문제다.

따라서 다음 코드 작업은 "보이는 부분 하나씩 수정"이 아니라 아래 순서로 진행해야 한다.

1. v2.41 canonical 파일을 운영의 유일한 관리자 디자인 기준으로 고정한다.
2. 대회 운영 페이지부터 workspace shell, 7 panels, 일정, 대진 기능을 canonical 구조로 재이식한다.
3. 교체가 끝난 뒤에만 구버전/중복/보정용 레이어를 삭제한다.
4. 실제 화면 스크린샷과 시안 HTML을 viewport별로 비교한다.

## 1. Canonical 파일

| 역할 | canonical 파일 | 운영 매핑 후보 |
|---|---|---|
| Toss 기본 토큰/컴포넌트 CSS | `_handoff-admin-toss-v2.41/toss.css` | `src/styles/toss-admin.css` |
| 워크스페이스/패널/일정/대진 CSS | `_handoff-admin-toss-v2.41/workspace.css` | `src/styles/toss-admin.css` 또는 분리 CSS |
| Toss kit | `_handoff-admin-toss-v2.41/toss-kit.jsx` | `src/components/admin-toss/kit.tsx` |
| 대회 운영 shell | `_handoff-admin-toss-v2.41/workspace.jsx` | `src/app/(admin)/tournament-admin/tournaments/[id]/_components/TournamentWorkspace.tsx` |
| 패널 core | `_handoff-admin-toss-v2.41/panels-core.jsx` | `_panels/teams/divisions/matches/bracket` |
| 패널 ops | `_handoff-admin-toss-v2.41/panels-ops.jsx` | `_panels/recorders/site/admins` + wizard components |
| 일정 관리 | `_handoff-admin-toss-v2.41/schedule.jsx` | 생성 wizard + 운영 page 일정 섹션 |
| 대진 관리 | `_handoff-admin-toss-v2.41/bracket.jsx` | `_panels/bracket-panel.tsx` + `DivisionGenerateButton` + `DualGroupAssignmentEditor` |
| 데이터 계약 | `_handoff-admin-toss-v2.41/data.jsx`, `DATA-CONSISTENCY-v39.md` | API/Prisma 변경 없이 실제 DB 필드 매핑 |
| 스타일/기능 잠금 | `_qa/admin-toss-style-lock-B1.md`, `_qa/function-lock-B1.md` | 모든 관리자 Toss QA 기준 |

## 2. 현재 혼재 실측

| 패턴 | 운영 상태 | 판단 |
|---|---|---|
| `ts-*` | Toss 버튼/입력/카드/배지 기본층 존재 | 유지 |
| `ct-*` | workspace/wizard/panel 공통층 존재 | 유지하되 v2.41 원본과 line-by-line 비교 필요 |
| `amt-*` | 경기표에서 사용 | 유지, `workspace.css` 기준으로 통합 |
| `bk-*` | 대진 시안 핵심 클래스 | 운영 흡수 범위 추가 확인 필요 |
| `sc-*` | 일정 관리 시안 핵심 클래스 | 운영 흡수 범위 추가 확인 필요 |
| `tw-*` | v2.41 workspace에도 존재하지만 운영 구현이 원본과 다르게 변형됨 | 원본 기준으로 재정렬 |
| `ta-*` | 최근 운영 보정용. v2.41 원본에는 없는 클래스 다수 | 교체 완료 후 제거 후보 |
| `au-*` | v2.40 통합 Admin Console 계층 | `/admin/*` 전페이지 Toss 재구현 단계에서 별도 처리 |
| `admin-*` | 기존 관리자/BDR 계열 | 대회 운영 페이지에서는 제거 후보 |
| `material-symbols` | 공개 BDR 영역은 유지, 관리자 Toss 영역은 제거 대상 | 관리자 한정 제거 |
| `components/ui` | 일부 패널에 남은 다른 UI kit | Toss kit로 통일 후보 |

## 3. 대회 운영 페이지 100% 정합 기준

| 영역 | v2.41 기준 | 운영 점검 포인트 |
|---|---|---|
| 진입점 | 단일 Toss workspace, 중복 outer header 없음 | `page.tsx` 중복 헤더는 제거됨. 다른 라우트 중복 shell 점검 필요 |
| 상단 | `ts-ph`, status pill, progress, shortcut summary | 현재 일부 구현. `ct-summary-grid`, `ct-shortcuts` 원본 반영 여부 확인 필요 |
| 단계 nav | 5 section: 정보/일정/종별/경기/접수 | 라벨 mojibake 여부와 실제 한글 렌더링 확인 |
| 본문 layout | `ct-grid`, `ct-col`, section cards | 현재 운영은 `tw-body`/`ct-col display: contents` 보정이 있어 원본과 다름 |
| 저장 bar | desktop sticky savebar + mobile save | 현재 `tw-foot` 중심. 원본 savebar와 비교 필요 |
| panel embed | 원본 `ct-panel-embed` | 운영은 `ta-panel-embed` 보정층 사용. 교체 후보 |
| empty/loading | Toss `ct-emptybox`, `ts-empty` | 각 패널 로딩/empty 통일 필요 |

## 4. 패널 기능 이식 기준

| 패널 | 시안 기능 | 운영 액션 |
|---|---|---|
| Teams | 등록경로 stat, 종별 readiness, 필터 5종, 그룹 카드, 상세 모달, 선수 import, CSV/카톡 복사 | UI/상태 전수 비교 후 Toss kit로 통일 |
| Divisions | category chips, 선택 종별 즉시 노출, 삭제, 일정/체육관, format 8 enum, 그룹 설정, 진출 매핑 | 최근 보정 반영됨. `ta-*` 제거하고 원본 `ct-*`/시안 레이아웃으로 재정렬 |
| Matches | recording mode trigger, division/venue filters, `amt-table`, ScoreModal, 전자기록지 링크 | 기존 `matches-client`와 시안 ScoreModal 차이 비교 |
| Bracket | version 3회, dual 5단계, 16팀 조 편집, division filter, generate buttons | `bk-*` CSS/동작 전수 비교. 대진 생성 위치는 운영 page panel로 확정 |
| Recorders | 기록원 추가/목록, 경기별 기록자 select, 자동 배정 | `components/ui` 혼재를 Toss kit로 정리 |
| Site | 3-step site wizard, template/color/subdomain, published state | emoji/old button/ui kit 혼재 점검 |
| Admins | 운영진 이메일/역할 추가, 목록/제거 | Toss card/button/pill 통일 |

## 5. 일정/대진 별도 중점

| 영역 | v2.41 요구 | 추가 확인 |
|---|---|---|
| 일정 관리 | `schedule.jsx`의 lane, court/date assignment, auto/manual schedule, drag/drop, `sc-*` | 운영에 같은 기능이 있는지 아직 부족. 원본 기능 이식 필요 가능성 높음 |
| 장소/코트 | `ct-schedule-venue`: Kakao search, manual add, court stepper, naming segment, date calendar | 생성 wizard에는 일부 존재. 운영 수정 화면 내 재사용 상태 검증 필요 |
| 대진 생성 | `bracket.jsx`: seed slot, group assignment, dual rows, tree, drag swap | 현재 `bracket-panel`은 실배선 중심. 시안 기능과 시각을 동시에 맞춰야 함 |
| 경기표 | `amt-table`, ScoreModal, recording mode | matches panel과 bracket/schedule 간 중복 버튼/흐름 정리 필요 |

## 6. 삭제/교체 후보

교체 전 삭제 금지. 기능/화면이 canonical로 이동된 뒤 제거한다.

| 후보 | 위치 | 처리 |
|---|---|---|
| `ta-panel-embed`, `ta-divisions-*` | `src/styles/toss-admin.css`, divisions panel | v2.41 원본 `ct-panel-embed`/`ct-*`로 재정렬 후 제거 |
| `ct-page--workspace`, old setup hub 흔적 | 대회 운영 과거 코드 | 남아 있으면 제거 |
| `admin-stat-pill`, `admin-*` | 기존 관리자 card/stat | 대회 운영에서는 Toss `ct-*`/`ts-*`로 교체 |
| `au-*` | v2.40 admin console | 전 관리자 페이지 재구현 단계에서 유지/교체 범위 결정 |
| `components/ui` Card/Button | recorders/site/bracket 일부 | Toss kit 또는 `ts-card`/`ts-btn`로 통일 |
| Material Symbols | 관리자 Toss 영역 | `@/components/admin-toss` Icon으로 교체 |
| inline hardcoded layout patch | 패널 내부 다수 | CSS class로 승격하거나 시안 원본 클래스 사용 |

## 7. 추가 시안 의뢰 필요 영역

v2.41 시안은 mock 기반이므로, 실데이터 edge case 화면을 더 받아야 100% 정합 검증이 가능하다.

| 우선순위 | 의뢰 화면 | 필요한 상태 |
|---|---|---|
| P0 | 일정 관리 | 경기 없음, 대진 반영됨, 다중 날짜/다중 체육관, 자동 배정, 수동 drag/drop, 저장 완료/실패 |
| P0 | 대진 생성 | 팀 부족, 조별리그, 토너먼트, 듀얼토너먼트 16팀, 기존 경기 존재, 버전 제한 |
| P1 | 경기 관리 | 예정/진행/종료, 스코어 입력, 기록앱/전자기록지 전환, 삭제 confirm |
| P1 | 팀 관리 | 승인/대기/거절, 코치 미입력, import 성공/오류, 토큰 만료/재발급 |
| P1 | 사이트 발행 | 미생성, 작성중, 발행완료, 비공개 전환, 서브도메인 충돌 |
| P2 | 기록원/운영진 | 인원 없음, 자동 배정, 권한 제거, 이메일 초대 실패 |

## 8. 실행 순서

### Batch A. 감사 자동화와 기준 고정
- v2.41 CSS class inventory 생성
- 운영 CSS/TSX class inventory 생성
- missing/extra/deprecated matrix 작성
- 수정 없음

### Batch B. 디자인 시스템 정렬
- `toss.css` + `workspace.css`를 운영 CSS에 canonical 순서로 재정렬
- `src/components/admin-toss/kit.tsx`를 `toss-kit.jsx` 기준으로 점검
- `ta-*`는 아직 삭제하지 않고 deprecated 표시

### Batch C. 대회 운영 shell 1:1 이식
- `TournamentWorkspace.tsx` 구조를 `workspace.jsx` 기준으로 재정렬
- `ct-summary-grid`, `ct-shortcuts`, `ct-panel-embed`, savebar/mobile save 반영
- 해시 진입점과 실제 DB form/save는 유지

### Batch D. 대회 패널 1:1 이식
- D1 Divisions + Bracket
- D2 Schedule + Game settings
- D3 Matches + ScoreModal
- D4 Teams
- D5 Recorders/Site/Admins

### Batch E. 잔재 삭제
- 대회 운영 경로에서 `ta-*`, old `admin-*`, `components/ui`, Material Symbols 제거
- `/admin/*`의 `au-*`는 다음 wave에서 Toss 전페이지 재구현으로 이동

### Batch F. 화면 검증
- 디자인 HTML과 운영 route를 동일 viewport로 캡처
- 1440 desktop, 1024 tablet, 390 mobile
- font/spacing/button/card/table/modal/empty/loading/state 전수 체크

## 9. Claude.ai 추가 의뢰서 초안

```
관리자 Toss v2.41 대회 운영 화면의 실데이터 edge case 보강 시안을 요청합니다.

전제:
- 관리자 영역은 Toss 스타일이 공식입니다. BDR 공개 페이지 스타일로 번역하지 않습니다.
- 기존 v2.41 canonical 파일(toss.css, workspace.css, toss-kit.jsx, workspace.jsx, panels-core.jsx, panels-ops.jsx, schedule.jsx, bracket.jsx)을 유지합니다.
- API/Prisma/라우트 제안은 하지 말고, UI 상태/동작/데이터 계약만 명시합니다.

필요 화면:
1. 일정 관리(schedule) 전체 상태
   - 경기 없음
   - 대진표 반영됨
   - 다중 날짜/다중 체육관/다중 코트
   - 자동 배정
   - 수동 drag/drop
   - 저장 성공/실패

2. 대진 생성(bracket) 전체 상태
   - 팀 부족
   - 조별리그
   - 싱글 토너먼트
   - 듀얼 토너먼트 16팀
   - 기존 경기 존재
   - 버전 3회 제한
   - 시드/조 편성 수정

3. 경기 관리(matches)
   - 예정/진행/종료
   - ScoreModal
   - 기록앱/전자기록지/수기 전환
   - 전자기록지 링크
   - 삭제 confirm

4. 팀 관리(teams)
   - 승인/대기/거절/코치 미입력
   - 선수 import 성공/오류
   - 토큰 만료/재발급
   - 납부 상태

5. 사이트 발행(site)
   - 미생성
   - 작성중
   - 발행완료
   - 비공개 전환
   - 서브도메인 중복

산출물:
- 상태별 HTML/JSX
- 사용하는 class 목록
- 데이터 필드 계약
- empty/loading/error/success 상태
- desktop/tablet/mobile 레이아웃
```

## 10. 다음 작업 제안

즉시 다음으로 진행할 작업은 **Batch A: 자동 class inventory + parity matrix**다.

수정 대상은 운영 UI 코드가 아니라 문서/감사 산출물이며, 이후 코드 변경은 Batch B부터 작은 단위로 승인받고 진행한다.
