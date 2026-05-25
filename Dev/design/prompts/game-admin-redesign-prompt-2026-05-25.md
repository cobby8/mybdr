# 클로드 디자인 의뢰 — 경기 관리자 측 보강 (Phase 2A)

> **의뢰일**: 2026-05-25
> **수신**: 클로드 디자인 (Claude.ai Project — bdr 디자인 시스템 관리)
> **선행 자료**:
> - `Dev/design/prompts/game-user-admin-connectivity-plan-2026-05-25.md` (상위 계획서 / BG1~BG7 갭)
> - `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (Phase 1A — 동일 형식 참고)
> **이번 의뢰 (Phase 2A)**: 관리자 측 보강 2 시안 = `AdminGames` (BG1+BG5) + `AdminGameReports` (BG2)
> **활성 시안**: `Dev/design/BDR-current/` 단일 폴더 (CLAUDE.md §🗂️ 단일 폴더 룰)
> **운영 코드 변경**: 0 — 시안 박제만 (운영 박제는 별 Phase 2C)
> **결재 결과 (2026-05-25)**: BG1~BG7 진행 (BG8 자동 매칭은 별 Phase) / BG2 = 평균 평점 + flag 종류만 (개별 건수 ❌) / Phase 1A 와 병행 진행

---

## 0. 진입 — 표준 절차 (BDR 디자인 시스템 관리)

**Step 1**: `Dev/design/claude-project-knowledge/00-master-guide.md` 읽기 (13 룰 인지)
**Step 2**: 본 의뢰의 영향 받는 보조 파일 — 01 (사용자 결정 §1~§8) / 02 (토큰) / 06 (자체 검수 §3 / §5 / §6 / §7)
**Step 3**: 첫 응답 (표준 형식):

```
✅ BDR 디자인 의뢰 확인 — 경기 관리자 측 보강 (Phase 2A)
이해: UD1 AdminGames (BG1 알림 액션 + BG5 액션 출처 컬럼) + UD2 AdminGameReports (BG2 깨끗한 평가 통계 view) = 2 시안
사용자 결정 §1~§8 보존 (E 등급 자체 영역 — §1 / §2 적용 외)
자체 검수: 06 §3 / §5 / §6 / §7
작업 시작.
```

---

## 1. 의뢰 배경 (BG1 / BG2 / BG5 관리자 측)

본 의뢰는 **운영 코드 변경 0** / 시안 박제만. 상위 계획서의 7 갭 중 관리자 측에서 보강이 필요한 3 갭 (BG1 / BG2 / BG5) 처리.

### 1-1. BG1 — 신청 승인/거절 상태 동기 (★★★)

- 사용자 신청 → 호스트 승인 → `game_applications.status` 업데이트. **단 사용자 측 알림 / 갱신 약함**. 관리자 측에서 status 변경 시 "사용자에게 알림 보내기" 액션 명시 부재.
- **비유**: 우체국에 등기 보냈는데 도착 확인이 발신자 본인이 우체국 가야만 나옴.

### 1-2. BG2 — 매너 평가 검토 큐 비대칭 (★★★)

- `game_reports + game_player_ratings` 의 flags 배열 있는 ratings 만 admin 신고 큐 노출. **깨끗한 평가는 관리자가 통계로 못 봄** = 매너 점수 활용도 누락.
- 사용자 측은 마이페이지 "내 매너" 카드 (UC1 / Phase 2B) 에서 **평균 평점 + flag 종류** 만 노출 (사용자 결재 — 개별 건수 ❌).
- **비유**: 영수증의 좋은 평가는 적립 안 되고 나쁜 평가만 본부로 올라감.

### 1-3. BG5 — 호스트 vs super_admin 권한 경계 (★★)

- 호스트 (game_applications 승인 / 경기 수정 / 취소) 권한 ↔ super_admin 의 강제 status 변경 권한 = 페이지에서 시각 분리 없음. AdminGames 에 액션 출처 컬럼이 없어서 "이 변경 누가 했지?" 추적 약함.

---

## 2. 대상 페이지 (2 시안)

### 영역 UD-A. AdminGames 보강 (E 등급 — 백오피스)

| 파일 | 라우트 | 역할 | 보강 |
|------|------|------|------|
| `AdminGames.jsx` | `/admin/games` | 전체 경기 list + status 수정 | BG1 알림 액션 + BG5 액션 출처 컬럼 |

### 영역 UD-B. AdminGameReports 보강 (E 등급 — 백오피스)

| 파일 | 라우트 | 역할 | 보강 |
|------|------|------|------|
| `AdminGameReports.jsx` | `/admin/game-reports` | 신고 검토 큐 (flags 배열 있는 ratings 만) | BG2 깨끗한 평가 통계 view + 매너 점수 활용 view |

---

## 3. 각 페이지 상세 요구사항

### 3-UD1. `AdminGames.jsx` 보강 — BG1 알림 + BG5 액션 출처

**현재 결함**:
- BG1: status 변경 (1=승인 / 2=취소) 액션 옆에 "사용자에게 알림 보내기" 체크박스 없음. UI 만 명시 — 운영 알림 API 는 별 Phase.
- BG5: 액션 출처 컬럼 부재 — 호스트 액션 vs super_admin 강제 변경 시각 분리 0.

**시안 요구사항**:
- **테이블 컬럼 추가 (BG5)** — 우측에 "최근 변경자" 컬럼 신규:
  - 호스트 액션 = 🏠 호스트명 (예: "호스트 박수빈")
  - super_admin 액션 = 🛡️ super_admin (예: "super_admin (강제 변경)")
  - 시스템 자동 = 🤖 시스템 (예: "자동 만료")
  - `var(--ink-mute)` 부가 텍스트로 시간 (예: "5분 전")
- **status 변경 모달 (BG1)** — 기존 status 수정 버튼 클릭 시 모달 / 모달 내:
  - 새 status select
  - **"사용자에게 알림 보내기" 체크박스** (기본 ✅) — 라벨 옆 작은 ⓘ 호버 시 "신청자 X명에게 이메일+앱 알림 발송"
  - 변경 사유 input (선택)
  - "변경 + 알림" / "취소" CTA
- **상단 filter chip 보강**:
  - 기존: status / type / city
  - 추가: "최근 변경 출처" filter (호스트 / super_admin / 시스템 / 전체)
- **테이블 row hover 시** = 액션 출처 + 변경 시간 tooltip (BG5 보조)

**보존 항목**:
- 기존 search / pagination / status 수정 API 동작
- 권한 가드 (super_admin only)

**모바일 (≤720px)**:
- 테이블 = 카드 1열 stack (각 카드에 status / type / 변경자 / 변경 시간 표시)
- status 변경 모달 = 풀스크린

**자체 검수 — E 등급**:
- 06 §3 디자인 토큰 (var(--*) / hex 0 / lucide-react 0 / `--color-*` 폐기 토큰 0)
- 06 §5 모바일 (720px / iOS 16px / 44px)
- 06 §6 연결성 (JSDoc 매트릭스 — 진입 / 복귀 / 에러)
- 06 §7 E 등급 자체 영역 룰 (AppNav 적용 외 / 백오피스 sidebar 사용)

---

### 3-UD2. `AdminGameReports.jsx` 보강 — BG2 깨끗한 평가 통계 view

**현재 결함**:
- `game_player_ratings.flags[]` 배열 있는 ratings 만 신고 큐로 노출 → 깨끗한 평가 / 전체 평가 통계 admin 측 안 보임.
- 매너 점수 활용 (평점 분포 / 상위 매너 사용자 / 하위 매너 사용자) view 0.

**시안 요구사항**:
- **상단 탭 추가 (3 탭)**:
  - **"신고 큐"** (기존 — flags 배열 있는 ratings) — submitted / draft / reviewed / dismissed status 필터
  - **"매너 통계"** (신규 — BG2 핵심) — 깨끗한 평가 + 신고 평가 합산 통계
  - **"최근 30일 추세"** (신규 — 보조) — 시간 축 line chart
- **"매너 통계" 탭 본문**:
  - **요약 카드 4 개**:
    1. 전체 평가 수 (예: 1,247 건 / 최근 30일)
    2. 평균 평점 (예: 4.3 / 5.0)
    3. 신고 발생률 (예: 2.4% — flags 있는 평가 비율)
    4. 가장 많이 받은 flag (예: late 12건 — flag 키워드만 명시)
  - **평점 분포 차트** (1~5 점 bar chart) — 각 점수 별 건수
  - **상위 매너 사용자 list** (평균 4.5 이상 + 평가 10건 이상) — 닉네임 + 평균 + 평가 수 (개별 평가 ❌)
  - **하위 매너 사용자 list** (평균 3.0 이하 또는 flags 5+ 건) — 운영진 액션 가능 (경고 / 정지 — UI 만 / 운영 API 별 Phase)
- **"신고 큐" 탭** (기존 보존) — status 필터 / 클릭 시 상세 모달
- **상세 모달 보강** = 본인 받은 flag 키워드 + 전체 평가 평균 (BG2 와 동일 룰 — 평균 + 종류만 / 개별 건수 ❌ 추가 표시)

**보존 항목**:
- 기존 신고 큐 status 필터 / 페이지네이션
- super_admin 권한 가드

**모바일 (≤720px)**:
- 3 탭 = 가로 스크롤 chip
- 요약 카드 4개 = 1열 stack
- list = 카드 1열

**자체 검수 — E 등급**:
- 06 §3 / §5 / §6 / §7 모두 통과
- **사용자 결재 룰 (BG2 = 평균 + flag 종류 / 개별 건수 ❌) 명시 적용** — 상위/하위 list 도 평균만 표시

---

## 4. 디자인 원칙 13 룰 (00-master-guide §13 룰)

> 본 의뢰는 **E 등급 자체 영역** (백오피스 — AppNav X / 별도 sidebar). 13 룰 중 §A AppNav 7 룰은 적용 외. §C / §D 강제.

### 4-A. AppNav (헤더) 7 룰 — **적용 외**

본 의뢰는 백오피스 (`(admin)`) 영역 — AppNav 적용 X (별도 sidebar `AdminSidebar` 사용).

### 4-C. 디자인 토큰 룰 4가지 (룰 10~13)

```
10. 색상: var(--accent / --cafe-blue / --ok / --bg-alt / --ink-mute) 등 토큰만
    ❌ #ff6b88 hex / 핑크·살몬·코랄 / `--color-*` 폐기 토큰
11. 아이콘: Material Symbols Outlined / 시안 검증된 이모지
    ❌ lucide-react
12. 라운딩: 버튼/카드 4px (8px 카드 OK) / pill 9999px X
13. 모바일: 720px / iOS input 16px / 버튼 44px
```

**본 의뢰 강조**:
- UD1 액션 출처 컬럼 = 🏠 (호스트 = `var(--accent)`) / 🛡️ (super_admin = `var(--cafe-blue)`) / 🤖 (시스템 = `var(--ink-mute)`)
- UD2 매너 통계 = 평점 분포 bar = `var(--accent)` 그라데이션 / 평균 평점 = `var(--ok)` (4.5+) / `var(--warn)` (3.0~4.4) / `var(--err)` (3.0 미만)
- 모든 시안 = `--color-*` 폐기 토큰 사용 ❌

### 4-D. 카피 / 모바일 룰

- placeholder 5단어 이내 / "예: " 시작 ❌
- 본 의뢰 카피 = 시안 우선
- 모바일 720px / iOS input 16px / 버튼 44px

---

## 5. 사용자 결정 §1~§8 보존 명시

| § | 결정 | 본 의뢰 영향 |
|---|------|------------|
| §1 AppNav | 9 메인 탭 / 더보기 / utility bar | **적용 외** (E 등급 — 백오피스 자체 셸) |
| §2 더보기 5그룹 | 가짜링크 4건 ❌ | 백오피스 sidebar 도 가짜링크 신규 ❌ |
| §3 팀 페이지 레이팅 stat 제거 | 팀 페이지 한정 | **본 의뢰 직접 영향 0** (UD2 매너 통계 = 백오피스 admin 측 — 팀 페이지와 별 맥락) |
| §4 프로필 이모지 / 사이드바 | 프로필 한정 | 본 의뢰 직접 영향 0 |
| §5 메인 페이지 Hero 카로셀 | 홈 한정 | 본 의뢰 직접 영향 0 |
| §6-1 글로벌 카피 시안 우선 | "서울 3x3 농구 커뮤니티" 보존 | 백오피스 일반 라벨 |
| §6-2 About 운영진 실명 ❌ | About 한정 | 본 의뢰 직접 영향 0 |
| §7 모바일 (720px / iOS 16px / 44px) | 글로벌 | **본 의뢰 적용 의무** ✅ |
| §8 인증/권한 captainId 매칭 | 인증 일반 | 본 의뢰 직접 영향 0 |

→ **본 의뢰 강제 적용 = §7 모바일 룰**. §3 (팀 페이지 레이팅) 와 UD2 (매너 통계) 가 비슷해 보이지만 **별 맥락** (팀 페이지 = 사용자 측 외부 노출 / UD2 = 백오피스 내부 통계) — 충돌 0.

---

## 6. 산출물 형식

### 6-1. 산출물 위치

```
사용자 → Claude.ai Project (BDR 디자인 시스템 관리) 에 본 의뢰 전달
  ↓
Claude.ai → 새 zip 생성 (BDR v2.X 또는 동일 갱신)
  ↓
사용자 → zip 풀이 → scripts/sync-bdr-current.ps1 실행 (CLAUDE.md §🗂️ 5단계 자동화)
```

### 6-2. 산출물 파일 (2 시안)

**보강 시안 2건** (기존 `Dev/design/BDR-current/screens/` 갱신):
1. `AdminGames.jsx` (UD1 / 알림 액션 + 액션 출처 컬럼)
2. `AdminGameReports.jsx` (UD2 / 3 탭 — 신고 큐 / 매너 통계 / 30일 추세)

### 6-3. README.md 갱신

`Dev/design/BDR-current/README.md` 에 다음 추가:
```markdown
## v2.X 갱신 (2026-05-XX) — 경기 관리자 측 보강 (Phase 2A)

### 보강 (2건)
- AdminGames — BG1 알림 액션 모달 + BG5 액션 출처 컬럼
- AdminGameReports — BG2 매너 통계 탭 추가 + 평균 평점 / flag 종류만 (개별 건수 ❌)
```

### 6-4. 박제 후 자체 검수 (06 의무)

박제 완료 후 `06-self-checklist.md` 모든 항목 ✅ 의무:
- §3 디자인 토큰 (var(--*) / hex 0 / `--color-*` 0 / lucide-react 0)
- §5 모바일 (720px / iOS 16px / 44px)
- §6 연결성 (JSDoc 매트릭스)
- §7 E 등급 자체 영역 룰

---

## 7. 첫 응답 형식 (Claude.ai 응답 의무)

```
✅ BDR 디자인 의뢰 확인 — 경기 관리자 측 보강 (Phase 2A)

이해:
- UD1 AdminGames — BG1 status 변경 모달 + 알림 체크박스 / BG5 액션 출처 컬럼
- UD2 AdminGameReports — 3 탭 (신고 큐 / 매너 통계 / 30일 추세). BG2 = 평균 + flag 종류만 / 개별 건수 ❌
- 결재 룰 반영 = BG2 노출 수위 명시 (사용자 결정 2026-05-25)

사용자 결정 §1~§8 보존:
- §7 모바일 (720px / iOS 16px / 44px) 강제 적용
- §1 / §2 (AppNav / 더보기) — E 등급 자체 영역 적용 외
- §3 (팀 페이지 레이팅) vs UD2 매너 통계 = 별 맥락 (충돌 0)

AppNav frozen — E 등급 적용 외 (백오피스 sidebar 사용)

자체 검수 (06): §3 / §5 / §6 / §7

산출물: Dev/design/BDR-current/screens/ (보강 2 시안)

질문 / 가정 (PM 결정 필요 시):
1. UD2 매너 통계의 "상위/하위 매너 사용자 list" 정원 / 기준값 (평균 4.5+ / 3.0- = PM 가정 — 변경 필요 시 알림)
2. UD1 액션 출처 컬럼이 기존 테이블 width 에 영향 — 컬럼 우선순위 (모바일 hidden 가능)

작업 시작.
```

---

## 8. 위반 시 즉시 중단

00-master-guide §"위반 시 즉시 중단" 답습:

- **사용자 결정 §1~§8 위반** — §3 팀 페이지 레이팅 stat 제거 룰을 UD2 백오피스 매너 통계와 혼동 ❌
- **BG2 노출 수위 위반** — 개별 평가 건수 (예: "no_show 2회") 표기 ❌. 평균 + flag 종류 (키워드) 만
- **DB 미지원 기능을 시안에** — 본 의뢰 데이터 출처:
  - `game_applications.status` (BG1) ✅
  - `games.host_id` vs super_admin (BG5) ✅
  - `game_player_ratings.flags[]` + `game_reports.overall_rating` (BG2) ✅
- **API/데이터 패칭 변경 제안** — 본 의뢰는 UI만 (운영 코드 0)

---

## 부록 A — BG1 / BG2 / BG5 → UD1 / UD2 매핑

| 갭 | 영향도 | 본 의뢰 시안 | 보강 내용 |
|----|-------|------------|---------|
| BG1 신청 알림 동기 | ★★★ | UD1 | status 변경 모달 + 알림 체크박스 |
| BG2 매너 통계 비대칭 | ★★★ | UD2 | 매너 통계 탭 + 평균 + flag 종류 (개별 건수 ❌) |
| BG5 호스트 vs super_admin 경계 | ★★ | UD1 | 액션 출처 컬럼 + filter |

---

## 부록 B — Phase 2B (사용자 + 다리) 와의 의존

Phase 2A (본 의뢰) 와 Phase 2B (`game-user-redesign-prompt-2026-05-25.md`) 의 의존:

- **BG1 알림** = UD1 (관리자 측) + UA2/UC1 (사용자 측 step indicator + 마이페이지) — 양측 동시 박제 권장
- **BG2 매너** = UD2 (관리자 측 통계) + UC1 (사용자 측 "내 매너" 카드) — 양측 동일 데이터 출처 (`game_player_ratings`) / 노출 룰 일관

→ **본 의뢰는 Phase 2B 와 같은 zip 묶음 권장**. Claude.ai Project 에 두 의뢰서 같이 전달.

---

**의뢰 끝.** 사용자가 본 파일 + Phase 2B 의뢰 (`game-user-redesign-prompt-2026-05-25.md`) 를 같은 zip 묶음으로 Claude.ai Project (BDR 디자인 시스템 관리) 에 붙여 넣어 의뢰 시작 가능.
