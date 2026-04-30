# 클로드 디자인 워크플로우 3 질문 — 답변 보고서 — 2026-04-30

> **상태**: active
> **갱신 주기**: 1회성 워크플로우 가이드
> **상위 문서**: [README.md](./README.md)
> **작성 사유**: 사용자 3 질문
>   1. 클로드 디자인과 다른 부분 잔여 — 어떻게 해결?
>   2. 클로드 디자인 토큰 부족 (대기 중) — 무한 사용 가능 시기?
>   3. zip 다운로드 → 작업 폴더 워크플로우 — 더 효율적인 방법?

---

## 질문 1 — 클로드 디자인 vs 실제 사이트 잔여 갭

### TL;DR

처리 시급도 기준 5 영역, 약 9 항목. 우선 처리 권장 순서:

| 우선도 | 영역 | 항목 수 | 견적 |
|--------|------|--------|------|
| 🔴 **P0** | A형 박제 회귀 (이미 P0-A 5건 픽스됨, 잔여 1건) | 1 | 3-4h |
| 🟠 **P1** | DESIGN.md 코드 위반 (lucide/hex/rounded-full) | 4 파일 | 1.5h |
| 🟠 **P1** | D등급 박제 안 됨 (community/[id]/edit, games/[id]/edit, profile/growth, profile/complete) | 4 페이지 | 6h |
| 🟡 **P2** | F등급 라우트 누락 (Referee.jsx 정책 결정) | 1 | 1-2h |
| 🟢 **P3** | v2.1 매처에 안 잡힌 모바일 패턴 (G-10 신규) | 6+ | 30분 |

### 1-1. 🔴 P0 잔여 — `/live/[id]` finished 분기 회귀 (A-6)

> 출처: [phase-9-audit.md](./phase-9-audit.md) §2-C, [ghost-features-and-breakage-2026-04-29.md](./ghost-features-and-breakage-2026-04-29.md) §2 A-6

- **상태**: 별도 작업 P0-5 로 분리됨, 미착수
- **내용**: 경기 종료 후 결과 화면의 옛 레이아웃·기능 (Phase 2 GameResult 박제 시 회귀)
- **시안 룰**: "색/폰트 v2 유지 + 레이아웃·기능 옛 디자인 복원"
- **해결**: [phase-9-prompts.md](./phase-9-prompts.md) P0-5 프롬프트 그대로 CLI 에 던지기

### 1-2. 🟠 P1-1 — DESIGN.md 코드 위반 정리

> 출처: [ui-consistency-audit-2026-04-29.md](./ui-consistency-audit-2026-04-29.md) §5

| 항목 | 파일 | 라인 |
|------|------|------|
| lucide-react import (1건) | `src/components/home/personal-hero.tsx` | 5 |
| 하드코딩 hex 25건+ | `hero-section.tsx`, `personal-hero.tsx`, `quick-menu.tsx` | 다수 |
| `package.json` lucide-react 의존성 | `package.json` | — |
| 버튼 `rounded-full` (4px 룰 위반) | `personal-hero.tsx`, `quick-menu.tsx` | 5곳 |

**해결 프롬프트**: [v2.1-cli-prompts-2026-04-29.md](./v2.1-cli-prompts-2026-04-29.md) 에 없음. 따로 작성 필요. 또는 [ui-consistency-audit §7-2](./ui-consistency-audit-2026-04-29.md) 에 P1-1 프롬프트 있음.

### 1-3. 🟠 P1-2 — D등급 박제 안 됨 4 페이지

> 출처: [phase-9-paste-completeness.md](./phase-9-paste-completeness.md) §D등급

| 라우트 | 시안 | 박제 패턴 |
|--------|-----|---------|
| `/community/[id]/edit` | PostWrite.jsx 응용 | with-aside + eyebrow + 카드 컨테이너 |
| `/games/[id]/edit` | CreateGame.jsx 응용 | 3 카드 분할 |
| `/profile/growth` | Profile.jsx 응용 | 게이미피케이션 톤 |
| `/profile/complete` | OnboardingV2.jsx 응용 | M5 단계 압축 |

**해결**: [ghost-features-and-breakage P1-2](./ghost-features-and-breakage-2026-04-29.md) 에 4 박제 프롬프트 작성됨.

### 1-4. 🟡 P2 — F등급 Referee 정책 결정

> 출처: [phase-9-paste-completeness.md](./phase-9-paste-completeness.md) §F등급

- 시안 `Dev/design/BDR v2.1/screens/Referee.jsx` 존재
- 사이트 `/referee` 는 심판 플랫폼 (별도 시스템)으로 점유 중
- PM 결정 필요: 시안 폐기 / 사용자용 새 라우트 / 흡수

### 1-5. 🟢 P3 — v2.1 매처에 안 잡힌 모바일 패턴

> 출처: [user-modifications-protection-2026-04-30.md](./user-modifications-protection-2026-04-30.md) §1-2 B-2

| 패턴 | 사용처 | 권장 |
|------|------|-----|
| 14열 (tab-players) | `live/[id]/_v2/tab-players.tsx` 3곳 | 가로 스크롤 래퍼 (G-10) |
| 8/11열 (stats) | `stats/page.tsx` | 가로 스크롤 또는 data-table |
| 6/8열 (rankings) | `v2-team-board`, `v2-player-board` | DataTableV2 적용 |
| `1.5fr 1fr 1fr 1fr 100px` (safety) | `safety/page.tsx` | data-table |
| `1.6fr 1fr 1fr 1fr` (pricing 비교 표) | `pricing-content.tsx` | data-table |
| `repeat(5, 1fr)` (포지션) | `signup`, `court-submit-form`, `awards-team` | repeat(2/3) 모바일 |

**해결 프롬프트**: [user-modifications-protection §7 옵션 B](./user-modifications-protection-2026-04-30.md) — G-10 신규 (큰 N열 표 가로 스크롤).

### 1-6. 통합 해결 워크플로우

```
순서 1 — 회귀 복원 (먼저 할 것)
  cd "C:\0. Programing\mybdr"
  git stash push --include-untracked -m "복원 전 백업"
  git checkout HEAD -- src/ Dev/ public/icons/ package.json prisma/schema.prisma
  ↓
순서 2 — P0 미처리 1건
  CLI 프롬프트 P0-5 (/live/[id] finished 회귀)
  ↓
순서 3 — P1-1 코드 위반 (1.5h)
  CLI 프롬프트 ui-consistency P1-1 (lucide/hex/rounded-full)
  ↓
순서 4 — P1-2 박제 4건 (6h, 페이지별 분할)
  CLI 프롬프트 ghost-features P1-2 4건
  ↓
순서 5 — P3 G-10 추가 (30분)
  CLI 프롬프트 user-modifications-protection §7 옵션 B
  ↓
순서 6 — DataTableV2 적용 확장 (1h, 이미 3 페이지 적용 완료)
  rankings v2-team-board, v2-player-board, safety, pricing 으로 확장
```

총 견적: 약 12시간 (옵션 1-7 모두) / 2 작업일.

---

## 질문 2 — 클로드 토큰 한도 + 무한 사용 시기

### TL;DR

**진짜 "무한" 플랜은 없습니다.** 모든 Claude 플랜에 5시간 / 주간 한도 존재. 단, 가장 비싼 Max Ultimate ($200/월) 가 사실상 무한에 가까운 사용량을 제공합니다.

### 2-1. 현재 플랜별 한도 (2026-04 기준)

| 플랜 | 가격 | 5시간 한도 | 주간 한도 | 비고 |
|------|------|-----------|----------|------|
| **Free** | $0 | ~10 메시지 | 제한적 | 짧은 대화만 |
| **Pro** | $20/월 | **~45 메시지** | 평균 사용자 충분 | 대다수 사용자 |
| **Max Expanded** | $100/월 | **~225 메시지 (5×)** | 큰 폭 확장 | 개발자/연구자 |
| **Max Ultimate** | $200/월 | **~900 메시지 (20×)** | "사실상 무한" | Cowork/Code 헤비 사용 |
| **API** | 종량제 | 한도 없음 (지불액 기준) | — | 자체 도구 빌드 |

> 메시지 수는 평균. 메시지 길이, 첨부 파일, 대화 길이, 모델, 기능에 따라 가변.

### 2-2. "토큰 부족 → 대기 중" 의 정체

- Claude 의 한도는 **5시간 슬라이딩 윈도우**로 reset
- 한도 도달 시 보통 1~5시간 대기 후 자동 회복
- Cowork 같은 에이전트 모드는 1 메시지가 여러 내부 호출을 발생 → 한도 빨리 소진

### 2-3. "무한" 에 가까운 사용 옵션

#### 옵션 A — Max Ultimate 플랜 ($200/월)

- 20× Pro 사용량 (5시간당 ~900 메시지)
- "Maximum Priority" — 트래픽 폭주 시에도 거의 0 지연
- Cowork / Claude Code 백그라운드 작업 끊김 없음
- 개인 사용자에게 "한도 거의 없음" 체감

#### 옵션 B — Anthropic API + 자체 도구

- 종량제 — 사용한 만큼 결제 (한도 없음, 사용 량만큼 비용)
- Claude Code 에 API 키 연결 가능
- 단점: Cowork mode 의 UI/UX 못 씀, 자체 통합 빌드 필요

#### 옵션 C — Team / Enterprise 플랜

- Anthropic API 종량제 + 팀 협업 도구
- 사용량은 결제액에 비례 (소진 시 계속 결제 가능)
- 대규모 사용 시 가성비 좋음

### 2-4. 권장

**1인 사용자 + Cowork 헤비 사용 → Max Ultimate ($200/월) 권장**

근거:
- BDR 같은 큰 프로젝트에서 일일 작업량이 Pro 의 한도를 자주 넘어섬
- Cowork 의 자동 작업 (P0-1 G-1~G-9 일괄 같은 것) 이 한 번에 메시지 수십 건 소진
- 5시간 대기는 작업 흐름을 깨뜨림

**예산 낮춤 → Max Expanded ($100/월)** — 5× Pro 로 일반 헤비 사용 충당 가능.

**API 직접 사용 (`Anthropic Claude Code` + API 키)** — 정말 무한 / 대규모 / 자동화 필요시.

### 2-5. 실용 팁 — 한도 절약

1. **단일 메시지에 작업 묶기**: "P0-1 G-1, G-2, G-3 한 번에 진행해" 같이 일괄 지시
2. **컨텍스트 정리**: 긴 대화 끊지 말고 새 세션에 컨텍스트 재제공 (메모리 활용)
3. **메모리 활용**: 자주 쓰는 정보는 프로젝트 instructions / CLAUDE.md 에 저장
4. **불필요한 검색 줄이기**: 답이 명확한 질문은 web search 없이
5. **Sonnet 사용**: Opus 보다 한도 소진 적음 — 상세 코딩이 아니면 Sonnet 으로

---

## 질문 3 — zip 다운로드 워크플로우 → 더 효율적인 방법

### TL;DR

zip → 압축 해제 → 작업 폴더 복사는 **수동 단계 3건**. 더 효율적인 방법 4가지:

| 방법 | 효율 | 도입 난이도 | 비고 |
|------|-----|----------|------|
| **A. Cowork 작업 폴더 직접 출력** | ⭐⭐⭐⭐⭐ | 쉬움 | 이미 BDR 프로젝트가 사용 중 가능 |
| **B. GitHub MCP + 자동 커밋** | ⭐⭐⭐⭐ | 중간 | git push 까지 자동화 |
| **C. claude-local-files (HTTPS 서빙)** | ⭐⭐⭐ | 어려움 | 로컬 파일을 클로드에 직접 노출 |
| **D. Filesystem MCP server** | ⭐⭐⭐⭐ | 중간 | 클로드가 로컬 디스크 직접 read/write |

### 3-1. 옵션 A — Cowork 작업 폴더 직접 출력 (즉시 적용 가능)

현재 사용자가 zip 으로 받는 시안 (`Dev/design/BDR v2.1/`) 을 클로드 데스크톱이 **직접 작업 폴더에 저장**하도록 하는 방식.

**현재 사용자 환경 분석**:
- 작업 폴더: `C:\0. Programing\mybdr` (이미 selected/mounted)
- Cowork mode 가 이 폴더에 직접 read/write 가능 (이미 보고서 작성도 이 폴더에 함)

**zip 워크플로우 vs 직접 저장**:
```
[zip 워크플로우 - 현재]
  Claude 가 시안 생성
  → 사용자가 zip 다운로드 클릭
  → 사용자가 Downloads 폴더에서 압축 해제
  → 사용자가 mybdr/Dev/design/ 으로 이동
  → 사용자가 폴더명 정리 (BDR v2 → v2.1 등)
  → 5-7 단계, 매번 5-10분

[직접 저장 워크플로우 - 권장]
  Claude 가 시안 생성 → 직접 mybdr/Dev/design/BDR v2.X/ 에 저장
  → 1 단계, 즉시 끝
```

**적용 방법** (다음 클로드 디자인 세션에서):
```
"새 시안 (BDR v2.2) 을 직접 C:\0. Programing\mybdr\Dev\design\BDR v2.2\ 에 저장해줘.
폴더 구조는 BDR v2.1 과 동일하게 (screens/, tokens.css, components.jsx, MyBDR.html, _mobile_audit.html, responsive.css 등).

이렇게 하면 zip 다운로드 + 압축 해제 + 폴더 정리 단계가 모두 사라집니다."
```

**제약**:
- 클로드 디자인이 Cowork mode 의 작업 폴더 권한이 있어야 함 (BDR 프로젝트는 있음)
- 한 번에 만들 수 있는 파일 수 제한 (대규모 시안은 분할 필요)

### 3-2. 옵션 B — GitHub MCP + 자동 커밋

시안 변경을 git 으로 관리. 클로드가 시안 만든 후 바로 커밋·push.

**워크플로우**:
```
1. GitHub MCP server 설치 (Claude Desktop preferences)
2. mybdr 저장소 권한 부여
3. 클로드에게 "시안 BDR v2.2 만들고 커밋해" 지시
4. 클로드가:
   - mybdr/Dev/design/BDR v2.2/ 에 파일 생성
   - git add + commit + push 자동 수행
5. 사용자는 git pull 만 하면 됨
```

**장점**:
- 시안 버전 관리 (v2 → v2.1 → v2.2 모두 git history 보존)
- 변경 내역 명확 (diff 로 차이 확인)
- 협업 시 충돌 자동 감지

**단점**:
- 시안의 큰 바이너리 (PNG 스크린샷) 가 git 저장소 크기 증가
- 시안 작업 시 `subin` 브랜치 충돌 가능성

### 3-3. 옵션 C — claude-local-files (HTTPS 로컬 서빙)

오픈소스 도구 [claude-local-files](https://github.com/runekaagaard/claude-local-files) 사용. 로컬 폴더를 HTTPS 로 클로드 데스크톱에 노출.

**워크플로우**:
- 로컬에 작은 HTTPS 서버 실행 (`mybdr/Dev/design/` 폴더 노출)
- 클로드가 URL 로 시안 파일 접근
- 시안 변경 시 즉시 반영 (zip 단계 없음)

**적합 케이스**: 사이즈 큰 시안 또는 동적 시안 (DB 연결된 미리보기 등). 대부분 사용자에겐 과한 옵션.

### 3-4. 옵션 D — Filesystem MCP server

[modelcontextprotocol/servers/filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) 또는 [DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP).

**워크플로우**:
- MCP 서버 1회 설치
- 클로드 데스크톱에 MCP 서버 등록 (`claude_desktop_config.json`)
- mybdr 폴더 read/write 권한 부여
- 클로드가 직접 로컬 파일 시스템 조작 (zip 없이)

**현재 Cowork mode 와의 차이**: Cowork 는 이미 작업 폴더 권한을 갖지만 mounted 폴더 1개로 제한. Filesystem MCP 는 임의 폴더 다수 mount 가능 + 명시 제어.

### 3-5. 즉시 적용 권장 — 옵션 A + 향후 옵션 B

**오늘**: 다음 시안 작업 시 클로드에게 직접 작업 폴더 저장 지시 (옵션 A). zip 단계 즉시 사라짐.

**이번 주**: GitHub MCP 셋업 (옵션 B). 시안도 git 으로 버전 관리.

**Anthropic 향후 기능 (대기 중)**:
- Issue [#34604](https://github.com/anthropics/claude-code/issues/34604): "Cowork: 기본 워크스페이스 폴더 설정" — 사용자가 매번 폴더 선택 안 해도 됨
- Issue [#47179](https://github.com/anthropics/claude-code/issues/47179): "Cowork 세션 영구 출력 폴더" — 산출물이 일관된 폴더로
- Cowork 프로젝트 클라우드 sync (현재 미지원, 로드맵에 있음)

### 3-6. BDR 프로젝트 구체 적용

**다음 디자인 세션 첫 메시지 템플릿**:
```
이번 시안 작업 결과는 zip 다운로드 없이 바로 다음 폴더에 저장해줘:
C:\0. Programing\mybdr\Dev\design\BDR v2.2\

폴더 구조 (BDR v2.1 과 동일):
- screens/ (jsx 파일들)
- tokens.css
- components.jsx
- data.jsx
- extras-data.jsx
- responsive.css
- MyBDR.html
- _mobile_audit.html
- _mobile_audit_report.html

만약 대규모로 만들 수 없다면 폴더만 만들고, 핵심 변경 파일 (responsive.css, components.jsx 같은) 부터 우선 저장.
```

---

## 통합 권장 액션 체크리스트

### 오늘 (10분)

- [ ] **회귀 복원 명령 실행** ([regression-recovery §3 옵션 A](./regression-recovery-2026-04-30.md#3-복원-전략))
- [ ] dev 서버 재시작 + 모바일 화면 검증

### 이번 주 (1-2일)

- [ ] **Max Ultimate ($200/월) 플랜 검토**
  - 또는 Max Expanded ($100/월) 로 시작
- [ ] 다음 시안 작업 시 **직접 작업 폴더 저장 지시** (zip 단계 제거)
- [ ] CLI 잔여 작업: P0-5 + P1-1 + G-10 (5-6h 견적)

### 이번 달

- [ ] GitHub MCP server 셋업 (옵션 3-2)
- [ ] D등급 4 페이지 박제 (P1-2, 6h)
- [ ] DataTableV2 적용 확장 (rankings/safety/pricing)

---

## 부록 A — 출처

### 질문 1 (잔여 갭) — 내부 문서

- [phase-9-paste-completeness.md](./phase-9-paste-completeness.md)
- [phase-9-audit.md](./phase-9-audit.md)
- [phase-9-prompts.md](./phase-9-prompts.md)
- [ui-consistency-audit-2026-04-29.md](./ui-consistency-audit-2026-04-29.md)
- [ghost-features-and-breakage-2026-04-29.md](./ghost-features-and-breakage-2026-04-29.md)
- [user-modifications-protection-2026-04-30.md](./user-modifications-protection-2026-04-30.md)

### 질문 2 (Claude 한도) — 외부 출처

- [Claude Limits 2026: 5-Hour Sessions, Weekly Caps, API Rules — TokenMix](https://tokenmix.ai/blog/complete-claude-limits-guide-2026-tokens-uploads-5-hour)
- [Claude Max Plan Complete Guide 2026 — Claude Lab](https://claudelab.net/en/articles/claude-ai/claude-max-plan-complete-guide-2026)
- [Max plan | Claude by Anthropic](https://claude.com/pricing/max)
- [Plans & Pricing | Claude by Anthropic](https://claude.com/pricing)
- [What is the Pro plan? | Claude Help Center](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)
- [How do usage and length limits work? | Claude Help Center](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)

### 질문 3 (워크플로우) — 외부 출처

- [Get started with Claude Cowork | Claude Help Center](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork)
- [Organize tasks with projects in Claude Cowork](https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork)
- [Cowork: Allow setting a default workspace folder #34604](https://github.com/anthropics/claude-code/issues/34604)
- [Add a persistent default output folder setting #47179](https://github.com/anthropics/claude-code/issues/47179)
- [GitHub Integration | Claude Help Center](https://support.claude.com/en/articles/10167454-using-the-github-integration)
- [Filesystem MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- [DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP)
- [claude-local-files](https://github.com/runekaagaard/claude-local-files)
- [One-click MCP server installation for Claude Desktop](https://www.anthropic.com/engineering/desktop-extensions)
