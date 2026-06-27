# ADMIN-TOSS-STATE-QA.md — 관리자 Toss 상태 매트릭스 & 보강 (v2.42)

> 목적: v2.41 관리자 Toss 리스킨이 운영에서 안정적으로 보이도록 상태 누락 전수 점검.
> 리스킨을 다시 갈아엎는 작업 아님 — loading/empty/error/saving/saved/permission/mobile/destructive 보강.
> 시안 파일: `admin-state-preview.html` · `admin-state.jsx` (toss.css + toss-kit.jsx 재사용)

판정 기호: ✅ 기존 충족 · ➕ 이번 보강 시안 · ⚠ 구현 시 적용 필요(컴포넌트 제공)

---

## 1. 상태 매트릭스 (대회 관련 화면 우선)

| 화면 / 패널 | loading | empty | error | saving | saved | permission | mobile | destructive |
|---|---|---|---|---|---|---|---|---|
| 운영: teams | ➕ | ✅ | ➕ | ➕ | ➕ | ⚠ | ➕ | ✅ |
| 운영: divisions | ➕ | ✅ | ➕ | ✅ | ✅ | ⚠ | ⚠ | ➕ |
| 운영: matches | ➕ | ✅ | ➕ | ✅ | ✅ | ⚠ | ⚠ | ➕ |
| 운영: bracket | ➕ | ✅ | ➕ | ✅ | ✅ | ⚠ | ⚠ | ➕(삭제) |
| 운영: recorders | ➕ | ➕ | ➕ | ✅ | ✅ | ⚠ | ⚠ | ✅ |
| 운영: site (발행) | ✅ | ✅ | ➕ | ✅ | ✅ | ⚠ | ⚠ | ➕(발행취소) |
| 운영: admins | ✅ | ✅ | ➕ | ✅ | ✅ | ➕ | ⚠ | ✅ |
| 생성/수정 마법사 | ✅ | — | ➕ | ➕ | ➕ | ⚠ | ✅ | ✅(취소) |
| 대회 관리자 목록 | ➕ | ✅ | ➕ | — | — | ⚠ | ⚠ | ✅ |
| 백오피스 | ➕ | ✅ | ➕ | ✅ | ✅ | ⚠ | ⚠ | ✅ |

> 두 번째 라운드(최고관리자/조직/시리즈)는 동일 컴포넌트 재사용 — §3 적용 규칙만 따르면 됨.

---

## 2. 누락 상태별 보강 (제공 컴포넌트)

### 01 loading — `Skel` · `SkelTable` · `st-spin`
- 행/카드 자리를 유지하는 shimmer skeleton. 헤더·아바타·뱃지 placeholder로 **레이아웃 점프 방지**.
- 통계 카드는 4-그리드 skeleton + 인라인 스피너.
- ⚠ 적용: 데이터 fetch 중 `isLoading` → `<SkelTable rows={n}/>`. 600ms 이상 지연 시에만 노출(깜빡임 방지) 권장.

### 02 empty — `Empty` (toss-kit 기존)
- 0건 시 **다음 행동 CTA**: 대진 0 → "자동 생성/직접 편성", 기록원 0 → "기록원 초대".
- 빈 상태에 부정 문구 대신 진입점 제공.

### 03 error — `ErrState` · `st-banner--danger`
- 조회 실패: 원인 + "다시 시도"(카운트) + "문의".
- 저장 실패: 인라인 danger 배너 + **입력값 보존 안내** + "다시 저장".

### 04 saving — disabled + pending
- 저장 버튼 `disabled` + `st-spin--sm` + "저장 중…". **중복 submit 차단**.
- dirty 아닐 때 버튼 자동 비활성.

### 05 saved — toast + dirty reset
- 성공 시 `st-toast`("저장했어요") + 카드 내 dirty dot(주황) → 초록 "모든 변경 저장됨".
- `SaveFlowDemo` 가 04→05 전이를 인터랙티브하게 시연.

### 06 permission denied — `PermState` · `st-banner--grey`
- 깨진 화면 대신 "접근 권한 없음" + 현재 역할 뱃지 + "권한 요청".
- 위험 액션(삭제/이전)은 권한 부족 시 버튼 `disabled` + "권한 없음" 라벨.

### 07 mobile — `st-phone` (360 / 720)
- 360px: 테이블 → 카드 리스트 전환(가로 스크롤 없음).
- 720px: 모달 풀폭, input **16px**(iOS 줌 방지), 버튼 **44px** 터치 타겟.

### 08 destructive — `Modal` (toss-kit) + danger
- 삭제/발행취소는 확인 모달 + danger 색상 + **영향 범위 명시**("연결 7경기 함께 삭제").
- 발행 취소는 공개 사이트 영향 경고 후 실행.

---

## 3. Toss 유지 규칙 (이 시안 준수)

| 허용 | 금지 |
|---|---|
| lucide icon, `Icon` wrapper | Material Symbols 변환 |
| Toss blue `#3182F6` 계열 | BDR red 관리자 전체 리스킨 |
| `ts-*` / `ad-*` / `ct-*` / `st-*`(상태 보강 prefix) | 사용자 공개 BDR 컴포넌트 강제 |
| rounded 24/16/12px | BDR 4px 전면 치환 |

- 신규 상태 컴포넌트는 `st-` prefix로 분리 — 기존 `ts-*` 키트와 충돌 없음.
- danger=`--danger`(#F04452), ok=`--ok`(#15B86A), warn=`--warn`(#FF9500) 토큰만 사용.

---

## 4. 구현 우선순위

1. **P0** — loading(skeleton), error, saving/saved: 모든 데이터 패널 공통. 가장 자주 노출.
2. **P1** — destructive 확인 모달: 데이터 유실 방지. bracket/site/대회 삭제.
3. **P1** — mobile 카드 전환: teams/matches 테이블.
4. **P2** — permission: admins/주최자 전용 액션.
5. **P2** — empty 보강: recorders 등 미보강 패널.

---

## 5. 검수

- [x] 8 상태 전부 Toss 스타일 — lucide/Icon, ts-/st- 클래스, Toss blue
- [x] saving 중복 submit 차단 + dirty reset
- [x] destructive 확인 모달 + 영향 범위
- [x] mobile 360/720 이탈 없음, input 16px, 버튼 44px
- [x] mock 을 운영 저장 완료처럼 표기하지 않음 (시연 토글 명시)
