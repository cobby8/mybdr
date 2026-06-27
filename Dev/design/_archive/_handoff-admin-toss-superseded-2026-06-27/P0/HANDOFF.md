# BDR 관리자 Toss 전환 — Cowork 전달 패키지 (HANDOFF)

> 전달일: 2026-06-21 · 영역: E등급 자체 디자인 (관리자) · 별개 디자인시스템(Toss)
> 목적: **CLI 구현 + 디자인 병행**을 위한 현재까지 산출물 + 데이터 계약.

---

## 1. 진입점 (3 HTML)

| 파일 | 내용 |
|------|------|
| `design-files/AdminConsole.html` | **관리자 콘솔** — 사이드바 IA + 18개 페이지 (전부 동작) |
| `design-files/TournamentAdmin.html` | **대회 운영** — 종별·디비전 + 참가팀 + 대진표 + 공개·완료 (탭 통합) |
| `design-files/AdminToss.html` | **종별 마스터 + 참가신청서 3단계** (디자인시스템 쇼케이스) |

---

## 2. 디자인시스템 (1순위 기반물)

`design-files/toss.css` — 관리자 전 화면 공통. 토큰 + 컴포넌트 키트.
- 라이트 · Toss Blue `#3182F6` · 카드 radius 24/16px · Pretendard · lucide
- 토큰: `--bg #F2F4F6` `--card #fff` `--ink #191F28` `--primary #3182F6` `--ok #15B86A` `--warn #FF9500` `--danger #F04452` · Toss Grey 50~900
- 컴포넌트: `.ts-btn`(primary/secondary/ghost/danger) · `.ts-card` · `.ts-input` · `.ts-badge` · `.ts-chip` · `.ts-segment` · `.ts-toggle` · `.ts-check` · `.ts-sidebar`/`.ts-navlink` · `.ts-table` · 모달 · 토스트
- React 키트: `toss-kit.jsx`(Icon=lucide, Btn, Badge, Toggle, Check, StepDots, Modal, Empty) · `toss-admin.jsx`(StatusTabs, FilterBar, DataTable, DetailModal, StatCard, PanelRow)

---

## 3. 구현 현황 (관리자 18 페이지 + 대회운영)

### 관리자 콘솔 (AdminConsole.html) — 18/18 ✅ 스타일 교체 완료
운영: 대시보드 · 사용자 · 대회 · 경기 · 커뮤니티 · 단체 · 팀 · 코트
비즈니스: 결제 · 요금제 · 캠페인 · 파트너 · 분석
시스템: 신고 · 알림 · 제안 · 로그 · 설정(종별 마스터 통합)
> 기능(상태탭·검색/필터·정렬·선택·페이지네이션·상세·mock 토글) 1:1 유지, 비주얼만 Toss.

### 대회 운영 (TournamentAdmin.html) — 기능 리빌딩 ✅
종별·디비전(생성기) · 참가팀(인라인 상태·입금→자동확정·대기알림) · 대진표(진행방식별) · 공개·완료

### 참가신청서 (AdminToss.html) — ✅
3단계: 참가팀 선택·확인 → 종별·디비전(정원/대기접수) → 출전선수 선택(로스터). 유니폼·명단입력 폐지.

### 갭 보강 ✅ (2026-06-21)
- **대회 생성 위저드** — TournamentAdmin "새 대회 만들기": 기본정보 → 결제·경기방식 → 확인 3단계
- **기록자 배정** — 대회 운영 "기록자" 탭: 경기별 기록원 배정(자동 배정 포함)
- **알림 작성 모달** — 콘솔 알림 "새 알림": 대상·채널·즉시/예약 발송

### 보류 해제 ✅
- **partner-admin · referee 셸 Toss 재스킨** — `PartnerReferee.html` (파트너 센터: 대시보드·코트·캠페인 / 심판 센터: 대시보드·배정·정산). 모드 스위치로 두 셸 전환.

---

## 4. CLI 구현 가이드

1. **토큰 먼저**: `toss.css` 의 `:root` 토큰 + 컴포넌트 클래스를 실제 Tailwind/CSS 변수로 이식 → 전 화면 공통.
2. **화면별**: 각 `admin-screens*.jsx` 의 컬럼·필터·상태 정의가 곧 구현 스펙. 데이터는 `admin-data*.jsx` 형태(필드명)를 API 응답에 매핑.
3. **기능 유지 규칙**: 리스킨 화면은 기존 mybdr admin 기능을 그대로. 컬럼/필터/액션/문구 변경 금지.
4. **대회 운영**은 DATA-BINDING.md 계약(admin_categories · DivisionRule 자동생성 · 로스터 조인 · WAITING 판정) 준수.

자세한 데이터 계약 → `DATA-BINDING.md`. 단계/원칙 → `PLAN.md`. 변경 요약 → `README.md`.

---

## 5. 파일 맵 (design-files/)

```
toss.css              디자인시스템
toss-kit.jsx          공용 컴포넌트(lucide Icon 등)
toss-admin.jsx        콘솔 공용 테이블/필터/탭/상세/KPI
toss-data.jsx         종별 마스터·내 팀(로스터)·정원·참가팀·진행방식
admin-data.jsx        콘솔 5화면 mock
admin-data2.jsx       대시보드·결제·코트·팀 mock
admin-data3.jsx       분석·신고·알림·캠페인·파트너·요금제·제안·로그 mock
admin-screens.jsx     사용자·대회·경기·커뮤니티·단체
admin-screens2.jsx    대시보드·결제·코트·팀·설정
admin-screens3.jsx    분석·신고·알림·캠페인·파트너·요금제·제안·로그
CategoryMaster.jsx    종별 마스터 관리
Apply.jsx             참가신청서 3단계
tournament-data.jsx   대회 운영 데이터/헬퍼
tn-screens.jsx        대회 운영 화면(종별·참가팀·대진·공개)
AdminConsole.html / TournamentAdmin.html / AdminToss.html
```
