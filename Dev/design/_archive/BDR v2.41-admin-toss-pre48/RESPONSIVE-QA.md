# RESPONSIVE-QA.md — 반응형 체크리스트 (v2.42)

> viewport 390 / 720 / 1024 / 1440 에서 대회 운영 화면의 텍스트·버튼·표·모달 정합 점검.
> 검수: `*-preview.html` 상단 툴바의 viewport 버튼으로 각 폭 전환 후 확인.
> BDR 룰13(모바일 720 통일·iOS input 16px·버튼 44px 터치) + 룰15(레이아웃 이탈 금지) 준수.

판정: ✅ 통과 기준 · ⚠ 구현 시 반드시 적용

---

## 0. 공통 기준 (모든 화면)

| 항목 | 390 | 720 | 1024 | 1440 |
|---|---|---|---|---|
| 가로 스크롤(컨테이너 밖 이탈) | ✅ 없음 | ✅ 없음 | ✅ 없음 | ✅ 없음 |
| 표(amt-table) | `amt-table-wrap` 내부 가로 스크롤 | 동일 | 전체 표시 | 전체 표시 |
| 카드 그리드 | 1열 | 1열 | 2열 | 시안 폭(2~4열) |
| 모달(Modal) | 풀폭(좌우 여백 12~16px) | 풀폭 | maxWidth 적용 | maxWidth 적용 |
| input 글자 크기 | ⚠ 16px(iOS 줌 방지) | 16px | — | — |
| 버튼/터치 타깃 | ⚠ ≥44px 높이 | ≥44px | — | — |
| 텍스트 최소 | 12px↑ · 줄바꿈/말줄임 | 동일 | — | — |
| 카드/플렉스 자식 | ⚠ `min-width:0` + `box-sizing:border-box` | 동일 | — | — |
| 내부 그리드 | ⚠ `minmax(0,1fr)` | 동일 | — | — |

---

## 1. 워크스페이스 셸 (tournament-ops-preview)
- ✅ `op-menu`: 390에서 6탭 줄바꿈/가로 스크롤, 라벨 잘림 없음
- ✅ 헤더 `ts-ph__row`: 390에서 "대회 정보 수정" 버튼 줄바꿈
- ✅ 상태 pill 묶음 `flex-wrap`
- ⚠ 1024: 카드 섹션 2열 전환 (`ct-divgrid`/`ct-panel-stats`)

## 2. 참가팀 (teams-preview)
- ✅ `ct-panel-stats`(stat 4): 390에서도 4열 유지 — 아이콘+숫자 압축 확인(넘침 시 2×2 허용)
- ✅ 종별 현황 카드 `repeat(auto-fill,minmax(200px,1fr))` → 390 1열
- ✅ 팀 행 `flex-wrap`: 이름/배지/액션 줄바꿈
- ⚠ 필터 chip 줄바꿈 · TeamModal 선수표 `amt-table-wrap` 스크롤

## 3. 대진 (bracket-preview)
- ⚠ `bk-tree`: 390에서 라운드 가로 스크롤(트리 폭 보존) — 세로 압축 금지
- ✅ `bk-cfg-grid`(설정 4필드): 390 1~2열
- ✅ `bk-groups`: 조 카드 1열
- ✅ `bk-dualrow`: 듀얼 조 카드 줄바꿈, "대" 구분 유지

## 4. 일정 (schedule-preview)
- ⚠ `sc-table`(amt-table): 390 가로 스크롤 — 경기번호/종별/시간/홈/어웨이 열 보존
- ✅ `sc-durgrid`(설정): 390 1열
- ⚠ 드래그앤드롭: 모바일에서 핸들(`sc-handle`) 터치 타깃 확보 — 대체로 데스크톱 작업 가정, 모바일은 조회 우선
- ✅ ManualModal `sc-manwrap`: 390 풀→코트 세로 스택

## 5. 경기 (matches-preview)
- ⚠ `amt-table`(7열): 390 가로 스크롤
- ✅ 필터 chip 줄바꿈
- ✅ ScoreModal: 점수 입력 3열(1fr auto 1fr) 유지, select 풀폭
- ⚠ ScoreModal input 16px

## 6. 사이트·기록원·운영진 (site-recorders-admins-preview)
- ✅ Site 위자드: 템플릿 카드 `repeat(auto-fill,minmax(180px,1fr))` → 390 1열
- ✅ 색상 스와치 `flex-wrap`
- ✅ 주소 입력 행: 390에서 `.mybdr.kr` 접미사 줄바꿈/유지
- ✅ Recorders/Admins 입력행 `flex-wrap` (이메일+역할+추가 버튼)

---

## 7. 회귀 자동 점검 (CLAUDE.md 룰15)
각 패널 390 전환 시:
- [ ] 카드/그리드/플렉스 자식이 컨테이너 밖으로 이탈하지 않음
- [ ] 표는 컨테이너 내부 스크롤(페이지 가로 스크롤 아님)
- [ ] 모달이 화면 밖으로 잘리지 않음
- [ ] 긴 팀명/이메일 말줄임 또는 줄바꿈
- [ ] input 16px·버튼 44px

## 8. 검수 절차
1. 각 `*-preview.html` 열기
2. 툴바 viewport: 390 → 720 → 1024 → 1440 순 전환
3. 위 §1~6 항목 + §7 회귀 확인
4. 위반 시 해당 패널 css(`workspace.css` 미디어쿼리) 보정 — 720px 분기 필수(인라인 grid `repeat(N,1fr)` 사용처)
