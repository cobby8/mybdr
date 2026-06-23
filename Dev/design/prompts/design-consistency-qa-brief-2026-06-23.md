# BDR 시안 의뢰 — 디자인 일관성 QA 패스 v2.40 기준

> Claude.ai (BDR 디자인 Project) 전달용. Cowork/Codex 갱신 2026-06-23.
> 기준 상태: PR #754/#755 merge 완료, `dev == main == fc72e9c`.
> 핵심: 신규 화면 제작이 아니라 **최신 활성 시안 전체의 토큰/패턴/간격 정합 점검 + CLI 픽스 체크리스트 산출**.

---

## 1. 현재 기준점

| 항목 | 기준 |
|---|---|
| 활성 시안 | `Dev/design/BDR-current/` |
| 운영 정합 | `dev == origin/dev == origin/main` (`fc72e9c`) |
| 최신 handoff | `_handoff-admin-v2.40-unified/` |
| 보존 handoff | `_handoff-admin-toss-P0/`, `_handoff-matchmaking-M2-M5/` |
| 기존 QA 패키지 | 2026-06-14/15 v2.31 기준이라 현재 기준에는 stale |

최신 표준점은 v2.31이 아니라 `BDR-current/` 전체입니다. 특히 v2.40 관리자 콘솔, Toss P0, 매칭 M2~M5, 대회 상세/종료, records/라인업 계열을 모두 포함해 일관성 기준을 다시 잡아야 합니다.

---

## 2. 목표

1. 화면마다 난립한 카드/칩/버튼/empty/모달/Hero 변형을 공용 표준형으로 수렴.
2. 폐기 토큰, 하드코딩 hex, 핑크/살몬/코랄 계열 잔존을 제거 후보로 분류.
3. 운영 `src/`에 바로 적용 가능한 `_qa/bake-fix-checklist.md`를 생성.
4. 관리자/운영자/사용자 화면의 시각 언어가 서로 다른 앱처럼 보이는 구간을 찾아 우선순위화.

---

## 3. 점검 8축

| 축 | 점검 내용 |
|---|---|
| 1. 토큰 | `tokens.css`, `src/app/globals.css`, BDR v2 토큰 매핑 정합. 폐기 `--color-*`와 하드코딩 hex 제거 후보 |
| 2. 컴포넌트 | 카드, 칩, 뱃지, 버튼, empty, 모달, Hero, 표, 필터바의 표준형 1벌 제안 |
| 3. 간격/라운딩 | 버튼 4px, 카드 8px, pill 9999px 금지(정사각 원형만 50%), 섹션 간격 스케일 |
| 4. 타이포 | Pretendard + Space Grotesk/숫자 표시 위계, h1~body 스케일 |
| 5. 아이콘 | Material Symbols Outlined 통일, lucide-react/임의 SVG 잔존 여부 |
| 6. 반응형 | 720px 분기, iOS input 16px, 터치 44px, 모바일 1열 재배치 |
| 7. 듀얼 톤 | 라이트 다음카페 톤과 다크 쿨 그레이 톤의 토큰 대응 |
| 8. 영역 간 정합 | 사용자, 대회 운영자, 최고관리자, 파트너/심판 공개 영역이 같은 제품군으로 보이는지 |

---

## 4. 우선 표본

| 그룹 | 표본 |
|---|---|
| 사용자 핵심 | Home, Games, GameDetail, MyGames, GameReport, Tournaments, TournamentDetail, TournamentCompleted |
| 사용자 보조 | Teams, Courts, Community, Search, Notifications, Messages, Profile |
| 신규/후속 | LineupConfirm, ProfileComplete, GuestApps, RefereeInfo, Safety/Privacy/Terms |
| 관리자 | v2.40 Admin Console 19섹션, Tournament Admin workspace, Toss P0, CreateTournament |
| 매칭 | M2~M5 handoff의 Games/GameDetail/MyGames/Profile 계열 |

기본은 표본 집중입니다. 전체 전수는 grep 가능한 위반 목록과 체크리스트로 넘겨 주세요.

---

## 5. 산출물

| 파일 | 내용 |
|---|---|
| `_qa/consistency-audit.md` | 8축 진단 리포트. 화면/요소/현재값/표준값/심각도 표 |
| `_qa/bake-fix-checklist.md` | CLI 박제용 파일별 수정 목록. 자동 치환 가능/수동 수정 분리 |
| `components.jsx` / `tokens.css` 제안 | 공용 표준형과 토큰 매핑 제안. 실제 운영 코드는 CLI가 적용 |
| 대표 before/after | 고빈도 화면 2~3개만 충분. 과도한 새 화면 제작 금지 |

---

## 6. 보존 / 변경 금지

- AppNav frozen: 구조, 탭, 우측 아이콘 순서 변경 금지.
- 사용자 결정 §1~§8: 카피/IA/헤더/모바일 결정 변경 금지.
- 운영 API/Prisma/라우트 변경 금지.
- DB 미보유 기능을 실제 기능처럼 확장 금지. 필요한 경우 mock/placeholder와 운영 연동 필요 필드 분리.
- 시안에서 운영 `src/` 직접 수정 금지. 산출은 체크리스트와 표준 제안까지.

---

## 7. Claude.ai 첫 응답 형식

```text
✅ BDR 시안 의뢰 확인 — 디자인 일관성 QA 패스 v2.40 기준
이해: BDR-current 전체를 기준으로 8축 정합 점검 / 표준형 수렴 / CLI 픽스 체크리스트 산출
기준점: dev==main fc72e9c, v2.40 Admin Console + Toss P0 + 매칭 M2~M5 포함
보존: AppNav frozen / 사용자 결정 §1~§8 / API·DB·라우트 변경 없음
작업 시작.
```

