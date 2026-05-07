# BDR 디자인 시스템 관리 — 작업 추적

> Cowork 작업물 모음. 디자인 시스템 갱신 결과 + 전수조사 보고서 + 의뢰 우선순위.

---

## 📋 이번 세션 (2026-05-07)

### 작업

1. ✅ 사용자 직접 수정 분 (5/4 ~ 5/6 누적) 토대로 디자인 시스템 문서 실측 동기화
2. ✅ 전수조사 — src/ 578 파일 룰 위반 + 폐기 토큰 잔존 + 마이그레이션 상태 측정
3. ✅ 클로드 디자인 추가 의뢰 6건 우선순위 정리

### 산출물

| 파일 | 설명 |
|------|------|
| [audit-2026-05-07.md](audit-2026-05-07.md) | 전수조사 보고서 + 6 의뢰 우선순위 |
| [design-requests-roadmap-2026-05-07.md](design-requests-roadmap-2026-05-07.md) | **Phase A~F 로드맵** (최적 순서 + 의존성 + 검증 기준) |
| [prompts/phase-A-headers.md](prompts/phase-A-headers.md) | Phase A 프롬프트 — 헤더 진입점 (검색/쪽지/알림) |
| [prompts/phase-A5-reverse-sync.md](prompts/phase-A5-reverse-sync.md) | **Phase A.5 — 운영 → 시안 역박제 10건** (BDR-current 5/1 stale 보강) |
| [prompts/phase-A5-hotfix-pc-drawer.md](prompts/phase-A5-hotfix-pc-drawer.md) | **Phase A.5 hotfix — PC 더보기 drawer 깨짐 긴급 fix** ✅ 완료 |
| [prompts/phase-A5-continuation-screens.md](prompts/phase-A5-continuation-screens.md) | **Phase A.5 잔여 — screens 적용 §4~§10** (Profile/TeamDetail/TeamManage/Login/Signup/EditProfile/Settings/Match) |
| [prompts/phase-A6-list-pages-reverse-sync.md](prompts/phase-A6-list-pages-reverse-sync.md) | **Phase A.6 — 메인 9개 탭 목록 5 페이지 역박제** (Games/Match/Team/Court/BoardList) + drawer fix |
| [prompts/phase-B-home.md](prompts/phase-B-home.md) | Phase B 프롬프트 — 홈 페이지 14 컴포넌트 |
| [prompts/phase-C-list-pages.md](prompts/phase-C-list-pages.md) | Phase C 프롬프트 — 메인 9개 탭 목록 5 페이지 |
| [prompts/phase-D-profile-edit.md](prompts/phase-D-profile-edit.md) | Phase D 프롬프트 — 프로필 편집/설정 |
| [prompts/phase-E-shared-cleanup.md](prompts/phase-E-shared-cleanup.md) | Phase E 프롬프트 — shared 잔여 + 하드코딩 hex 5건 |
| [prompts/phase-F-admin-referee.md](prompts/phase-F-admin-referee.md) | Phase F 프롬프트 — admin/referee 80 파일 일괄 매핑 |

### 본 repo 의 디자인 시스템 문서 갱신 (`Dev/design/claude-project-knowledge/`)

| 파일 | 변경 |
|------|------|
| `02-design-system-tokens.md` | 실측 동기화 — 듀얼 테마 / 신규 토큰 / 폐기 토큰 매핑 / 신규 컴포넌트 표준 §10 |
| `03-appnav-frozen-component.md` | Phase 19 frozen — 7 룰 → 13 룰 / utility 로고 이미지 / NavBadge / LogoutLink |
| `04-page-inventory.md` | 더보기 슬림화 (30→15) / _v2 박제 완료 16 영역 / 마이그레이션 잔여 분포 |

---

## 🔍 한눈 요약

### Clean (위반 0)

```
✅ AppNav Phase 19 frozen — 13 룰 모두 통과
✅ lucide-react import 0
✅ 9999px 직사각형 0
✅ "예) " placeholder 0
✅ 핑크/살몬/코랄 색상 0
✅ 더보기 가짜링크 4건 영구 제거
```

### 잔여 작업 → Phase A~F 순서로 진행 (영역별 시안 박제와 동시)

```
Phase A  헤더 진입점 (검색 / 쪽지 / 알림)         → 1 세션, 작은 범위 패턴 검증
Phase B  홈 페이지 14 컴포넌트 (P0)              → 2~3 세션
Phase C  메인 9개 탭 목록 페이지 (5개)            → 2~3 세션
Phase D  프로필 편집/설정                         → 1~2 세션
Phase E  shared 잔여 + 하드코딩 hex 5건           → 1 세션
Phase F  admin / referee 80 파일 일괄 매핑        → 1 세션 (sed 일괄)

→ 총 8~11 세션 추정. 자세한 순서/이유: design-requests-roadmap-2026-05-07.md
```

### 사용 방법 — 2-Stream 워크플로우

각 Phase 는 **시안 박제 (클로드 디자인) + 운영 마이그레이션 (Cowork)** 두 단계로 진행:

```
[Phase X 진입]
  ↓
Stream ①: 시안 박제 (클로드 디자인)
  1. prompts/phase-X.md 열기
  2. §"📋 의뢰" 블록 복사
  3. Claude.ai Project (BDR 디자인) 새 세션에 붙여넣기
  4. 클로드 디자인이 BDR-current/ 안의 파일 갱신:
     - screens/*.jsx
     - tokens.css
     - components.jsx
     - MyBDR.html
  5. 시안 결과 검수 (06-self-checklist.md)
  ↓
Stream ②: 운영 마이그레이션 (Cowork — 저)
  1. prompts/phase-X.md §"🛠 PM 후속 작업" 블록 복사
  2. Cowork 에 의뢰 ("Phase X src/ 마이그레이션 진행해줘 ...")
  3. Cowork 가 src/ 토큰 매핑 + tsc/eslint/git commit
  4. PM 검수: grep 'var(--color-' [영역] → 0
  5. Phase 완료 — roadmap §6 진행 추적 표 갱신
  ↓
[Phase X+1 진입]
```

**주의**: Phase F 는 시안 박제 X — admin/referee 자체 셸 영역. PM 이 Cowork 와 직접 진행 (`prompts/phase-F-admin-referee.md` 자체가 Cowork 의뢰서).

### 진행률

```
전체 tsx/css         578 파일
BDR v2 토큰 적용     249 파일 (43%)  ← Clean
폐기 --color-* 잔존  329 파일 (57%)  ← 마이그레이션 대상
_v2 폴더 박제        16 영역 (A등급 핵심)
```

---

## 📚 참고 — BDR 디자인 시스템 진입점

- `Dev/design/claude-project-knowledge/00-master-guide.md` — 13 룰 마스터
- `Dev/design/claude-project-knowledge/01-user-design-decisions.md` — 사용자 결정 8 영역
- `Dev/design/claude-project-knowledge/02-design-system-tokens.md` — 토큰 (이번 세션 갱신)
- `Dev/design/claude-project-knowledge/03-appnav-frozen-component.md` — AppNav (이번 세션 갱신)
- `Dev/design/claude-project-knowledge/04-page-inventory.md` — 페이지 인벤토리 (이번 세션 갱신)
- `Dev/design/claude-project-knowledge/06-self-checklist.md` — 시안 완료 자체 검수
