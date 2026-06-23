# 새 대회 만들기 (CreateTournament) — 코워크 전달 패키지

> BDR v2 · 관리자(Toss) · 대회 운영 — 대회 생성 폼
> 레퍼런스: 기록앱 `cobby8/bdr_stat_v3` 경기설정(`game_settings_gate_screen.dart`) 1:1 정합
> 갱신일: 2026-06-21

---

## 1. 실행 방법

`CreateTournament.html`을 브라우저로 열면 됩니다. (인터넷 연결 필요 — React·Babel·폰트·아이콘 CDN 사용)

```
CreateTournament.html   ← 진입점, 이 파일만 열면 됨
```

로컬에서 `file://`로 바로 열거나, 정적 서버(`python -m http.server` 등)에 폴더째 올려 사용하세요.

---

## 2. 파일 구성 (의존 순서 = HTML script 로드 순서)

| 파일 | 역할 |
|---|---|
| `CreateTournament.html` | 진입 셸 — 관리자 사이드바 + 하단 고정 생성바 + 전 페이지 CSS + Tweaks |
| `toss.css` | Toss 디자인 토큰·기본 컴포넌트 스타일 |
| `image-slot.js` | 드래그&드롭 이미지 슬롯 웹컴포넌트 (후원사 로고·포스터) |
| `toss-data.jsx` | `window.TOSS` — 성별/종별 마스터(CATEGORY_MASTER)·METHODS 등 |
| `tournament-data.jsx` | `window.TN` — 디비전 생성(tnDivision)·진행방식 설정 |
| `toss-kit.jsx` | 공통 UI — `Icon/Btn/Badge/Modal` 등 (`window`에 노출) |
| `tn-screens.jsx` | 종별 제너레이터 등 보조 화면 |
| `ct-game-settings.jsx` | **경기 설정 카드** + 공통 프리미티브(`CardHead/Field/Subhead/Stepper/SegSm/SetRow`) |
| `create-tournament.jsx` | **메인 폼** — 대회 정보·일정/장소/코트·종별/디비전·게시 모달 |

> CDN: Pretendard, JetBrains Mono, lucide, React 18.3.1, ReactDOM, Babel standalone(브라우저 트랜스파일).

---

## 3. 화면 구성 (2컬럼 단일 페이지)

### 좌측
- **대회 정보** — 대회명* / 정규대회 여부* / 주최* / 주관* / 후원사(선택) / 포스터(선택, 이미지 직접 첨부)
- **대회 일정 · 장소*** — 장소·코트 등록 + 캘린더 일정 선택 + 날짜별 코트 배정

### 우측
- **종별 · 디비전*** (1개 이상) — 제너레이터로 추가, 디비전별 정원/참가비/경기날짜/코트 매칭
- **경기 설정** — 기록앱 정합(유니폼·경기 방식·파울·타임아웃)

`*` = 필수. 하단 **[대회 생성]** 클릭 시 누락 항목을 토스트로 안내하고 막습니다.

---

## 4. 핵심 인터랙션

### 4-1. 정규대회 여부 (← 기존 '시리즈' 영역)
- 탭 기본값 = **일반대회**. **정규대회** 선택 시 하단에 드롭다운 표시.
- 드롭다운 = 기존 정규대회 목록(`REGULAR_SERIES`) + **＋ 새 정규대회 생성**.
- '새 정규대회 생성' 선택 시 이름 입력 필드 노출.
- ⚠ **백엔드 연결 포인트** — `REGULAR_SERIES`는 현재 '시리즈' 백엔드 영역에 매핑 예정.
  신설 정규대회 저장·목록 조회 API 및 시리즈 관리 페이지(추후 리뉴얼 시 관리포인트 추가) 필요.

### 4-2. 장소 · 코트
- 장소 검색(코트 마스터 자동완성, 지도 API 연결 예정) → 등록.
- 장소별 **코트 수**(1~8) 지정. 2개 이상이면 **명칭 = 숫자(1·2코트) / 알파벳(A·B코트)** 선택.
- 한 장소에 여러 코트 지원.

### 4-3. 대회 일정 · 날짜별 코트 배정
- **일정 선택** → 캘린더 모달에서 날짜 **다중 선택**(중복 토글).
- 각 날짜 블록에서 등록된 코트를 칩으로 토글해 배정(하루에 여러 코트 가능).
- 디비전 매칭 = 경기 날짜 + 코트(해당 날짜에 배정된 코트로 필터).

### 4-4. 경기 설정 (기록앱 정합)
- **유니폼** — 홈 밝은색 / 어웨이 어두운색(텍스트 표기). [홈·어웨이 색 교체] 버튼. 팀 조끼 제공(선택).
- **경기 방식** — 프리셋(6·7·10분 4쿼터 / 10분 전후반) · 운영 방식(논스탑/데드) · 쿼터 수 · 쿼터 시간 · 샷클락.
- **파울** — 개인 4~6 · 팀파울 3~7.
- **타임아웃** — 전반·후반 0~4 · 시간 30~90초.
- 값·범위는 `ct-game-settings.jsx`의 `GAME_PRESETS`·`GAME_SETTINGS_DEFAULTS`와 기록앱 `GameRules`를 1:1로 맞춤.

### 4-5. 대회 생성 → 게시 설정 모달
- [대회 생성] → 게시 기간 / 참가신청 기간 / **결제 방법(중복선택)** / 입금 계좌.
- 결제: **계좌이체만 활성**, 간편결제·카드 결제는 **'준비 중'**(추후 결제 연동).
- 참가비는 종별·디비전에서 입력하므로 이 모달에는 없음.

---

## 5. 데이터 배선 (백엔드 인계 포인트)

현재는 프론트 mockup(메모리 state)입니다. 실제 연동 시 매핑:

| 프론트 state | 도메인 |
|---|---|
| `d.name / isRegular / seriesId / seriesName` | 대회 메타 + **시리즈(정규대회)** FK |
| `d.organizer / host / poster` | 주최/주관/포스터(이미지 업로드) |
| `venues[].{name,region,courtCount,naming}` | 장소 + **코트** 엔티티(코트 수·명명 규칙) |
| `dates[].{date,courtIds[]}` | 대회 일자 ↔ 코트 N:N 배정 |
| `categories[].divisions[].{method,cap,fee,dateId,courtId}` | DivisionRule(진행방식·정원·참가비·경기일·코트) |
| 경기 설정(`d.*`) | `GameRules`(기록앱 공통 — quarterType/minutes/clockMode/fouls/timeouts/uniform) |
| 게시 모달(`PublishModal`) | 게시·접수 기간, 결제수단, 입금계좌 |

- 결제: 계좌이체 외 수단은 추후 PG 연동(현재 UI '준비 중').
- 이미지 슬롯(후원사·포스터)은 mockup에서 세션 표시만 — 실서비스는 업로드 스토리지 연결.

---

## 6. 전역 규칙 준수 (CLAUDE.md)

- ✅ **영문 표현 금지** — HOME/AWAY/STEP 등 제거(홈/원정·N단계). 약어(PDF·API)만 예외.
- ✅ **카드 레이아웃 이탈 금지** — `min-width:0` + `box-sizing:border-box` + `minmax(0,1fr)` 전역 적용.
- ✅ Toss 토큰만 사용(하드코딩 hex 없음 · 유니폼 색은 도메인 데이터 예외) · 라운딩 표준 · 모바일 720px 분기 · input 16px.
