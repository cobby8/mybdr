# BDR 디자인 작업 허브

> **단일 진입점**. 어떤 작업을 시작하기 전에 이 문서부터 본다.
> **마지막 갱신**: 2026-04-29

---

## 🎯 지금 어디에 있나

- **활성 Phase**: **Phase 9 (계속 진행)** — 박제율 32/117 (27%) → 모바일 폴리시 + 신규 진입점 연결 진행 중
- **이전 Phase**: Phase 1-8 박제 작업 완료 (커밋 5213131 ~ b49eaa1)
- **운영 DB Phase 10 SQL**: ✅ 사용자 직접 적용 완료 (4 신규 테이블 + 다수 신규 컬럼) — 2026-04-29
- **활성 브랜치**: `subin`
- **시안 폴더**: `BDR v2/` (2026-04-28 단일 폴더로 통합 완료)
- **다음 액션**: P0-A 잔여 진입점 연결 + 모바일 감사 High 3건

## 🔥 즉시 시작 — Phase 9 P0 작업 후보 (2026-04-29 갱신)

| # | 작업 | 출처 | 상태 | 예상 |
|---|------|------|------|------|
| 1 | 신규 박제 4 라우트 진입점 연결 + More 가짜링크 정리 | [phase-9-audit.md](./phase-9-audit.md) §5 P0 | ⏳ More 4건 제거 완료 (`aa61003`) / 진입점 CTA 후속 | 1-2h |
| 2 | **`/live/[id]` 경기 기록 페이지 회귀 조정** (시안 색/폰트 유지 + 옛 레이아웃·기능 복원) | [phase-9-prompts.md](./phase-9-prompts.md) P0-5 | ❌ 미착수 | 3-4h |
| 3 | 시안-only 기능 메뉴 숨김 + 추후 구현 큐 정리 | [phase-9-future-features.md](./phase-9-future-features.md) §5 | ✅ More 4건 제거 (`aa61003`) / Phase 10 DB 4건 적용 ✅ | 완료 |
| 4 | 모바일 감사 High 3건 (gameResult/messages/bracket) | [phase-9-prompts.md](./phase-9-prompts.md) P0-1~P0-3 | ❌ 미착수 | 4-6h |
| 5 | ResponsiveTable 컴포넌트화 + 4화면 적용 | [phase-9-prompts.md](./phase-9-prompts.md) P0-4 | ❌ 미착수 | 4-5h |
| 6 | **Phase 9-Mobile Refinement P1~P5** (board separator + input 16px + btn 44px + card min-h) | commit `dc1e38a` | ✅ 완료 | 완료 |
| 7 | 모바일 grid 안티패턴 8건 + 가로 overflow 가드 | commit `4afb4f9` `f972aaf` | ✅ 완료 | 완료 |
| 8 | Hero 카로셀 (3슬라이드 + fallback) | commit `79cc57e` | ✅ 완료 | 완료 |
| 9 | 헤더 구조 정리 + 더보기 가짜 4건 제거 | commit `aa61003` | ✅ 완료 | 완료 |
| 10 | 팀 목록/상세 모바일 최적화 + 레이팅 제거 | commit `61a170d` `87c59d4` | ✅ 완료 | 완료 |

## 📚 문서 인덱스

### 활성 (Phase 9)

| 문서 | 역할 | 상태 | 마지막 갱신 |
|------|------|------|------------|
| [phase-9-plan.md](./phase-9-plan.md) | Phase 9 계획서 — 차이점 분석 / 우선순위 / 신규 7라우트 명세 / 자동 검증 시스템 설계 | active | 2026-04-28 |
| [phase-9-prompts.md](./phase-9-prompts.md) | Phase 9 CLI 프롬프트 11개 (P0-1 ~ P3-2) — 진행 상태 표시 추가 | active | 2026-04-29 |
| [phase-9-audit.md](./phase-9-audit.md) | UI 진입점 단절 감사 — More 4건 제거 진행 상태 반영 | active | 2026-04-29 |
| [phase-9-paste-completeness.md](./phase-9-paste-completeness.md) | UI 박제 완성도 감사 보고서 (시안 vs 페이지 일치도, 5+1 등급 분류) | active | 2026-04-29 |
| [phase-9-future-features.md](./phase-9-future-features.md) | 시안-only 기능 정리 — Phase 10 SQL 적용 완료 반영 | active | 2026-04-29 |
| [ui-consistency-audit-2026-04-29.md](./ui-consistency-audit-2026-04-29.md) | 시안 vs 실제 + DESIGN.md 규칙 위반 1회성 감사 (Cowork 작성) | active | 2026-04-29 |
| [ghost-features-and-breakage-2026-04-29.md](./ghost-features-and-breakage-2026-04-29.md) | 유령 기능(A~F) + UI 깨짐 위험 전수조사 (33건 + CLI 프롬프트) | active | 2026-04-29 |

### 영구 참조

| 문서 | 역할 | 상태 |
|------|------|------|
| [DESIGN.md](./DESIGN.md) | 디자인 시스템 (색상 / 타이포 / 컴포넌트 / 다크모드 룰) | 영구 |
| [user-design-decisions-2026-04-30.md](./user-design-decisions-2026-04-30.md) | 사용자 직접 결정 영구 보존 (회귀 방지) | 영구 |
| [BDR v2/](./BDR%20v2/) | 시안 폴더 (HTML 미리보기 + 70+ 화면 + 모바일 감사 인프라) | 영구 |
| [BDR v2/_mobile_audit_report.html](./BDR%20v2/_mobile_audit_report.html) | 시안 작성자의 모바일 자체 감사 (High 3 / Med 8) | 참조 |
| [team-logos/](./team-logos/) | 팀 로고 자산 | 영구 |

### 종료 (archive)

> Phase 9 종료 시 `phase-9-*.md` 3개 파일을 `archive/phase-9/` 로 이동.
> Phase 1-8 박제 기록은 `.claude/scratchpad.md` 의 작업 로그에 보존.

---

## 🚀 다음 CLI 세션 인계 프롬프트

다음 클로드 CLI 세션 시작 시 첫 메시지로 그대로 붙여넣기.

```
"오늘 작업 시작하자" 체크리스트 통과시킨 뒤 다음 컨텍스트 인지하고 후속 작업 준비해줘.

## 직전 세션 작업 요약 — 2026-04-29

### A. 운영 인프라 / DB
- Vercel paid plan 전환 → cron 5개 활성 (`3e23273`)
- Phase 10 통합 SQL 파일 추가 (`f9d2e45`) — 운영 DB 직접 적용 완료
  - 4 신규 테이블 + 다수 신규 컬럼 (경기 평가/신고, 게스트 지원, 팀 팔로우+매치 신청, 온보딩)

### B. 모바일 폴리시 (Phase 9-Mobile Refinement)
- 모바일 grid 안티패턴 8건 일괄 정리 (`4afb4f9`)
- 모바일 가로 overflow 글로벌 가드 (`f972aaf`)
- Phase 9-Mobile Refinement P1~P5 — board separator + input 16px + btn 44px + card min-h (`dc1e38a`)
- 모바일 체크리스트 conventions.md 정리 — 10항목 (`0d12919`)
- AppNav 모바일 닉네임 (`db69eea`)
- 더보기 패널 모바일 + GameCard ellipsis (`e8171d7`)

### C. 핵심 UI 갱신
- Hero 카로셀 (3슬라이드 + fallback) (`79cc57e`)
- 헤더 구조 정리 + 더보기 가짜 4건 제거 (`aa61003`)
  - 제거된 More 메뉴 항목: gameReport / guestApply / refereeRequest / referee
- 팀 목록/상세 모바일 최적화 + 레이팅 제거 (`61a170d`)
- 팀 Avatar overflow + 카드 세로 배치 (`87c59d4`)
- 단체 신청 폼 사일런트 실패 픽스 (`35e54b0`)

### D. 갱신된 문서
- Dev/design/phase-9-prompts.md (진행 상태 ✅⏳❌ 표시)
- Dev/design/phase-9-audit.md (More 4건 제거 반영)
- Dev/design/phase-9-future-features.md (Phase 10 SQL 적용 완료 반영)
- Dev/design/README.md (이 문서 — 마지막 갱신 2026-04-29)

## 다음 작업 후보 (PM 결정 필요)

1. **P0-A 잔여**: 신규 박제 라우트 진입점 CTA 추가 (1-2h)
   - `/games/[id]` 종료 카드에 "경기 평가" CTA → `/games/[id]/report`
   - `/games/[id]` "게스트 모집중" 배지 → `/games/[id]/guest-apply`
   - `/tournaments/[id]` 운영 영역 → `/tournaments/[id]/referee-request`
2. **P0-5: /live/[id] 경기 기록 페이지 회귀 조정** (3-4h, prompts.md P0-5)
3. **모바일 감사 High 3건** (prompts.md P0-1~P0-3, 4-6h)
4. **P0-4 ResponsiveTable 컴포넌트화** (4-5h)
5. **More 메뉴 P0-C 핵심 액션 추가**: /games/new, /community/new (0.5h)

## 시작 전 체크리스트

1. `git status` — 미커밋 사항 확인
2. `git branch --show-current` — `subin` 인지 확인
3. `git log --oneline -5` — 최근 커밋 위치
4. 미푸시 커밋 수 확인
5. PM 에게 어느 작업부터 시작할지 확인 받고 진행

## 참고 문서 (Dev/design/)

- 작업 허브: `README.md` (이 컨텍스트의 출처)
- 활성 Phase 계획: `phase-9-plan.md`
- 활성 Phase 프롬프트: `phase-9-prompts.md` (진행 상태 표시 포함)
- 활성 Phase 감사: `phase-9-audit.md` (More 4건 제거 반영)
- 시안-only 기능: `phase-9-future-features.md` (Phase 10 DB 적용 반영)
- 디자인 시스템: `DESIGN.md`
- 시안 폴더: `BDR v2/`

위 컨텍스트 파악되면 한 줄로 "확인 완료. 어느 작업부터 시작할까?" 응답해줘.
```

### 짧은 버전 (요약만)

```
직전 세션 작업 (2026-04-29):
1. 운영 DB Phase 10 SQL 적용 완료 — 경기 평가/신고 + 게스트 지원 + 팀 팔로우 + 온보딩 4건
2. 모바일 폴리시 다수 (grid 안티패턴 + overflow 가드 + Refinement P1~P5)
3. 헤더 정리 + 더보기 가짜 4건 제거 (gameReport/guestApply/refereeRequest/referee)
4. Hero 카로셀 / 팀 모바일 최적화

git status 로 미커밋 확인 후 PM에게 다음 작업 받고 시작해줘.
참고: Dev/design/README.md 가 단일 진입점.
```

---

## 📝 문서 관리 룰

### 새 문서 추가 시
1. 라이프사이클 결정: **영구 참조 / Phase 단위 / 휘발성**
2. 영구는 루트(`Dev/design/`), Phase 단위는 `phase-N-*.md` 명명
3. 상단에 표준 메타 헤더 추가 (상태 / 갱신 주기 / 상위 문서)
4. 이 README 의 "문서 인덱스" 표에 한 줄 추가

### 표준 메타 헤더 템플릿
```markdown
> **상태**: active | archived
> **갱신 주기**: phase-단위 / 영구 / 휘발성
> **상위 문서**: [README.md](./README.md)
> **함께 보는 문서**: ...
> **마지막 검증**: YYYY-MM-DD
```

### Phase 종료 시
1. `archive/phase-N/` 폴더 생성
2. `phase-N-*.md` 파일들을 archive 로 이동
3. README.md 의 "활성 Phase" 갱신 + "종료 (archive)" 섹션에 링크 추가
4. 다음 Phase 시작 시 새 `phase-(N+1)-*.md` 작성

### 정보 중복 방지
- **단일 출처 원칙(SSOT)**: 같은 정보는 한 문서에만 둠. 다른 문서는 link로 참조.
- README 인덱스 표가 SSOT. 어느 문서에 무슨 정보가 있는지 여기서만 관리.
- 핵심 KPI는 README "지금 어디에 있나" 섹션에 응축. 자세한 건 각 문서로.

---

## ⚠️ 작업 시 절대 지킬 룰 (CLAUDE.md 발췌)

1. `main` 직접 push 금지 — `subin → dev → main` 흐름
2. `.env`에 운영 DB URL 금지
3. 운영 DB에 prisma db push / migrate 금지
4. 하드코딩 색상 금지 — 무조건 `var(--color-*)` 토큰
5. lucide-react 금지 — Material Symbols Outlined 사용
6. 핑크/살몬/코랄 금지
7. 버튼 border-radius 4px
8. API 응답 키는 자동 snake_case 변환됨 — 프론트 인터페이스도 snake_case
9. `withAuth` + `withValidation` 비공개 API 필수
10. DB 미지원 기능 — 제거 금지, "준비 중" 표시 + scratchpad.md 추후 구현 목록 추가
