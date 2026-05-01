# BDR v2.4 — Phase 19 룰 채택 + AppNav 쪽지 추가 (2026-05-01)

> **이전 버전**: BDR v2.3 (2026-05-01 사용자 직접 디자인)
> **상태**: 시안 베이스 카피 완료. AppNav frozen 적용은 CLI 박제 단계에서 진행

---

## 1. v2.3 → v2.4 변경 요약

### 1-1. 폴더 출처

`C:\Users\user\Downloads\BDR v2.3` 다운로드 카피 (v2.3 시안 + Phase 19 룰 자료 동봉) → `Dev/design/BDR v2.4/` 로 이전.

zip 풀이 부산물(`Dev/design/BDR v2.2/`, `Dev/design/BDR v2.3/` 중첩 백업)은 제외. 그 외 모두 보존.

### 1-2. 정책 룰 변경 (Phase 19, 2026-05-01)

| 룰 | v2.3 | v2.4 |
|----|------|------|
| AppNav 룰 3 — main bar 우측 | 검색 + 알림 + 다크 + 햄버거 = **4개** | 검색 + **쪽지** + 알림 + 다크 + 햄버거 = **5개** |
| AppNav 룰 5 — `app-nav__icon-btn` 적용 | 검색·알림 | 검색·**쪽지**·알림 |
| 아이콘 순서 (고정) | [다크, 검색, 알림, 햄버거] | [다크, 검색, **쪽지**, 알림, 햄버거] |
| 회귀 방지 자동 검수 | 5 케이스 | **6 케이스** (쪽지 누락 추가) |

→ `uploads/03-appnav-frozen-component.md` (Phase 19 갱신본) 카피 사용. 재구성 금지.

### 1-3. 시안 코드 (.jsx, .html, .css) — v2.3 동일

코어 시안 70+개 파일은 v2.3 그대로 카피. **AppNav frozen 적용은 CLI 박제 단계**에서 `uploads/03-appnav-frozen-component.md` §1 코드를 `components.jsx`의 AppNav 함수에 그대로 카피하면 룰 1~7 + Phase 19 쪽지 한 번에 해결.

---

## 2. 폴더 구조

```
Dev/design/BDR v2.4/
├── README.md                         (이 파일)
├── CLAUDE.md                         (디자인 작업 셀프 적용 룰)
├── MyBDR.html                        (메인 시안 진입점)
├── tokens.css                        (디자인 토큰)
├── responsive.css                    (모바일 반응형)
├── components.jsx                    (⚠️ AppNav frozen 적용 대상 — CLI 박제 시 03 카피)
├── data.jsx, extras-data.jsx, community-data.jsx
├── _mobile_audit.html, _mobile_audit_report.html, _mobile_check.html
├── assets/, ref/, audit/, screenshots/, v1/
├── screens/                          (70+ 페이지 시안)
└── uploads/                          (의사결정 자료 + Phase 19 캡처 PNG 17건)
    ├── 00-master-guide.md ⭐
    ├── 01-user-design-decisions.md
    ├── 02-design-system-tokens.md
    ├── 03-appnav-frozen-component.md ⭐ (Phase 19 갱신)
    ├── 04-page-inventory.md
    ├── 05-design-brief-template.md
    ├── 06-self-checklist.md ⭐
    ├── 07-custom-instructions.md (확장본)
    ├── README.md
    ├── mypage-feasibility-and-design-brief-2026-05-01.md
    └── pasted-*.png (17건)
```

---

## 3. CLI 박제 시작 전 체크리스트

```
[Step 0] 이 README + CLAUDE.md + uploads/00-master-guide.md 읽기 (13 룰 인지)
[Step 1] components.jsx 의 AppNav 함수 → uploads/03-appnav-frozen-component.md §1 코드 그대로 카피
[Step 2] components.jsx 의 ThemeSwitch 함수 → uploads/03 §2 코드 그대로 카피
[Step 3] CSS 의 .app-nav__icon-btn 등 uploads/03 §3 클래스 추가 (기존에 있다면 그대로)
[Step 4] moreGroups 배열 → uploads/03 §4 코드 그대로 사용 (가짜링크 4건 자동 제거)
[Step 5] 본문 시안만 신규 디자인 (필요 시)
[Step 6] uploads/06-self-checklist.md 모든 항목 ✅ 검수
```

---

## 4. 회귀 방지 — 자동 검수 6 케이스

시안 완료 직전 다음 6 케이스 자동 확인:

- ❌ main bar 우측에 "더보기 ▼" dropdown 또는 아바타("RDM" 등) 노출
- ❌ 모바일(≤768px)에서 "☀ 라이트 ☾ 다크" 듀얼 라벨 노출
- ❌ 검색/쪽지/알림 버튼에 border/bg 박스 (`.btn` / `.btn--sm` 등) 적용
- ❌ utility bar 우측 (계정/설정/로그아웃) 모바일에서 누락
- ❌ main bar 우측 아이콘 순서가 [다크, 검색, 쪽지, 알림, 햄버거] 이외로 변경·누락
- ❌ **쪽지 아이콘 누락** (Phase 19 신규)

자동 검수 grep:

```bash
# 위반 1, 2 검사
grep -nE "더보기 ▼|RDM rdm_captain|RDM rdm" components.jsx
# → 0 매칭 기대

# 위반 3 검사 (검색·쪽지·알림 박스 X)
grep -nE 'btn btn--sm" title="(검색|쪽지|알림)"' components.jsx
# → 0 매칭 기대

# 위반 6 검사 — 쪽지 아이콘 존재
grep -nE 'title="쪽지|setRoute\(.messages.\)' components.jsx
# → 1 이상 매칭 기대
```

---

## 5. 보존 (박제 시 절대 변경 X)

- v2.3 README.md §5 보존 룰 그대로 유지
- `/profile` 라우트 + 9 서브페이지 라우트
- `getWebSession` + `Promise.all` 7쿼리 병렬
- `/api/web/me` + `/api/web/profile` 응답 형식
- snake_case 응답 직렬화

→ UI만 v2.4 톤 적용 (Phase 19 룰 통과). API/data fetch 0 변경.

---

## 6. 출처

- [Phase 19 룰 변경](uploads/03-appnav-frozen-component.md)
- [v2.3 → v2.4 의사결정 — 채팅 세션 2026-05-01]
- [메모리 갱신](spaces/.../memory/design_appnav_frozen_violations.md) — 위반 5건 → 6건
- 사용자 결정: 옵션 A (v2.4 폴더 신규 — 03 frozen 전체 적용) 선택
