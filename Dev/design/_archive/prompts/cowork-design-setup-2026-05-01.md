# Cowork 디자인 작업 셋업 가이드 — 2026-05-01

> Cowork (이 환경) 에서 새 세션 시작할 때 디자인 작업 룰이 자동 인지되도록 셋업 완료.
> Claude.ai Project 와 동일 효과를 3 채널로 구현.

---

## 0. 셋업 완료 — 3 채널 자동 적용

다음 3 채널이 매 Cowork 세션마다 자동 작동:

| # | 채널 | 위치 | 자동 로드 |
|---|------|------|---------|
| 1 | **CLAUDE.md 디자인 섹션** | `C:\0. Programing\mybdr\CLAUDE.md` | ✅ 매 세션 자동 (작업 폴더의 CLAUDE.md 가 컨텍스트로 주입) |
| 2 | **메모리 시스템** | `C:\Users\user\AppData\...\memory\` | ✅ MEMORY.md 인덱스 자동 로드 (200줄 이내) |
| 3 | **Project Knowledge 패키지** | `C:\0. Programing\mybdr\Dev\design\claude-project-knowledge\` | 사용자 또는 Claude 가 명시적 read 시 |

---

## 1. 셋업 결과 검증

### 1-1. CLAUDE.md 디자인 섹션 (✅ 추가됨)

```bash
grep -A 30 "🎨 디자인 작업 시" C:\0. Programing\mybdr\CLAUDE.md
```

→ 다음 내용 포함:
- Project Knowledge 패키지 9 파일 경로
- 13 룰 (AppNav 7 + 더보기 IA 2 + 토큰 1 + 카피·모바일 3)
- 디자인 작업 표준 절차 6 단계
- 위반 시 즉시 중단 트리거

### 1-2. 메모리 시스템 (✅ 2 파일 추가됨)

```
C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\
  c0769406-f6f7-43ef-a526-ace597d51b2e\
  a351b808-1854-4f53-8f58-a2b588a6bb69\
  spaces\3a0678c8-f940-48e7-897b-486a2c014ca4\memory\
  ├── MEMORY.md (인덱스 — 4 항목으로 갱신)
  ├── user_role.md (기존)
  ├── project_cafe_cookie_automation.md (기존)
  ├── design_project_knowledge.md ⭐ (신규 — 디자인 의뢰 진입점)
  └── design_appnav_frozen_violations.md ⭐ (신규 — AppNav 위반 5건 회귀 방지)
```

### 1-3. Project Knowledge 패키지 (✅ 9 파일 완비)

```
Dev/design/claude-project-knowledge/
  ├── README.md (사용 가이드)
  ├── 00-master-guide.md ⭐ (마스터)
  ├── 01-user-design-decisions.md
  ├── 02-design-system-tokens.md
  ├── 03-appnav-frozen-component.md ⭐ (AppNav frozen)
  ├── 04-page-inventory.md
  ├── 05-design-brief-template.md
  ├── 06-self-checklist.md ⭐ (자체 검수)
  └── 07-custom-instructions.md (Claude.ai Project 용)
```

---

## 2. 사용자 — 새 Cowork 세션에서 디자인 의뢰 시작 표준 절차

### Step 1: 의뢰 메시지 던지기 (자유 형식 OK)

```
새 디자인 의뢰: [작업명]
[작업 내용]
```

→ Cowork 가 자동으로:
- CLAUDE.md 의 디자인 섹션 인지 (13 룰 + 패키지 위치)
- 메모리의 design_project_knowledge / design_appnav_frozen_violations 자동 인지
- 패키지 핵심 3 파일 (00 / 03 / 06) Read 도구로 즉시 로드

### Step 2: Cowork 가 첫 응답으로 표준 형식 확인

```
✅ BDR 디자인 의뢰 확인 — [작업명]

이해:
- [의뢰 핵심 1]
- [의뢰 핵심 2]
- 사용자 결정 §[N] 보존
- AppNav frozen — 03 코드 카피 사용

자체 검수 (이번 작업 적용 룰):
- 06-self-checklist.md §[해당 섹션]

질문 / 가정 (PM 결정 필요 시):
1. ...

작업 시작.
```

### Step 3: 작업 진행 / 검수 / 보고

Cowork 가 자동으로:
- AppNav 부분은 03 frozen 카피
- 토큰은 02 사용
- 카피 / 명칭 / 모바일 룰 자동 적용
- 시안 완료 후 06 self-checklist 모든 항목 ✅ 검수
- 위반 0 확인 후 산출물 제출 보고

---

## 3. 첫 의뢰 테스트 (셋업 검증)

새 Cowork 세션에서 다음 테스트 메시지로 인지 검증:

```
이 Cowork 세션에서 디자인 작업 룰이 자동 인지되는지 확인해줘.

답변:
1. CLAUDE.md 의 디자인 작업 13 룰 1줄씩 요약
2. AppNav frozen 7 룰 1줄씩 요약
3. 메모리에 저장된 AppNav 위반 5건 요약
4. 디자인 의뢰 시 첫 응답 표준 형식
```

✅ **정상 응답** = 13 룰 + 7 룰 + 위반 5건 + 첫 응답 형식 모두 인지
❌ **실패** = 일반 답변 또는 룰 누락 → 메모리 / CLAUDE.md 파일 확인

---

## 4. Cowork vs Claude.ai Project 비교

| 항목 | Cowork | Claude.ai Project |
|---|---|---|
| 자동 룰 주입 | CLAUDE.md + 메모리 | Custom Instructions + Knowledge |
| 패키지 위치 | `Dev/design/claude-project-knowledge/` 직접 read | Project Knowledge UI 업로드 |
| 새 세션 컨텍스트 | 자동 (CLAUDE.md + 메모리) | 자동 (Custom Inst + Knowledge RAG) |
| 작업 폴더 read/write | ✅ 직접 | ❌ (다운로드 / 카피만) |
| git 커밋 | ✅ Cowork 가 직접 | ❌ (사용자 수동) |
| 시안 작업 → 박제 → 커밋 → 푸시 | 한 흐름 | 분리 (다운로드 후 별도 환경) |
| 토큰 효율 | 높음 (CLAUDE.md 주입 짧음) | 중간 (Knowledge RAG 검색) |

→ **Cowork 가 BDR 작업에 더 자연스러움** (한 환경에서 시안 받기 + 박제 + 커밋 모두). Claude.ai Project 는 디자인 시안 시각 작업에 특화.

---

## 5. 두 환경 동시 사용 권장 패턴

```
[Claude.ai Project "BDR 디자인 작업"]
└─ 디자인 시안 작업 (창의적 / 시각적)
   ├─ Project Knowledge 9 파일 자동 인지
   ├─ Custom Instructions 자동 적용
   └─ 산출물: BDR v2.X/screens/[Component].jsx (다운로드)
        ↓
[Cowork (이 환경)]
└─ 박제 / 검토 / 의뢰서 작성 / 회귀 점검
   ├─ CLAUDE.md + 메모리 자동 인지
   ├─ Project Knowledge 패키지 read 가능
   ├─ git 커밋 / push / PR 직접
   └─ 산출물: src/* 박제 + Dev/design/* 갱신
```

---

## 6. 메모리 갱신 시점

다음 경우 메모리 파일 갱신:

| 트리거 | 갱신 메모리 |
|--------|---------|
| 사용자 결정 새 영역 추가 | `design_project_knowledge.md` 의 13 룰 부분 |
| AppNav 위반 새로 발견 | `design_appnav_frozen_violations.md` 에 위반 N 추가 |
| 새 frozen 컴포넌트 추가 (HeroCard 등) | `design_appnav_frozen_violations.md` 일반화 |
| 박제 등급 큰 변화 (D=0 등) | `design_project_knowledge.md` 갱신 또는 신규 메모리 |

→ 메모리는 사용자가 명시 요청 시 또는 사실 변경 시 갱신.

---

## 7. CLAUDE.md vs 메모리 vs 패키지 — 역할 분담

| 채널 | 역할 | 길이 | 자동 로드 |
|------|-----|------|---------|
| **CLAUDE.md** | 13 룰 핵심 + 패키지 위치 + 표준 절차 | ~80 라인 (디자인 섹션) | ✅ 매 세션 |
| **메모리** | 자주 발생하는 위반 + 진입점 인식 | ~50 라인 (2 파일) | ✅ MEMORY.md 인덱스 |
| **패키지** | 13 룰 상세 + 코드 + 매트릭스 + 템플릿 | ~2,400 라인 (9 파일) | 명시 read |

→ Cowork 는 CLAUDE.md + 메모리로 인지 우선. 상세 코드 / 매트릭스 / 템플릿 필요 시 패키지 read.

---

## 8. 사용 예시 (실전)

### 예시 1: 마이페이지 hub 의뢰 (Phase 13)

```
사용자: "마이페이지 hub 시안 작업해. Phase 13."

Cowork 자동:
1. CLAUDE.md 의 13 룰 인지 (이미 자동)
2. 메모리의 design_project_knowledge 에서 패키지 위치 인지
3. 00-master-guide.md read → §1 컨텍스트 / §2 13 룰 우선
4. 03-appnav-frozen-component.md read → AppNav 코드 카피 준비
5. 04-page-inventory.md read → /profile (B 등급) 확인
6. 05-design-brief-template.md read → 의뢰 명세 표준
7. 06-self-checklist.md read → 시안 완료 후 검수 준비

응답:
✅ BDR 디자인 의뢰 확인 — Phase 13 마이페이지 hub
이해:
- /profile 자체를 마이페이지 허브로 확장 (옵션 B)
- 3단계 위계 카드 (Tier 1 4 / Tier 2 4 / Tier 3 2) + 보조 정보
- 사용자 결정 §1 (헤더) §4 (프로필) 보존
- AppNav frozen — 03 코드 카피 사용
자체 검수: 06 §1 (AppNav) §2 (더보기) §3 (토큰) §6 (연결성)
질문: ...
작업 시작.
```

### 예시 2: 박제 위임 (CLI 프롬프트 작성)

```
사용자: "Phase 13 마이페이지 시안 받았어. CLI 박제 위임 프롬프트 작성해."

Cowork 자동:
1. 메모리 인지 (디자인 작업 컨텍스트)
2. 패키지 06-self-checklist read → 박제 검수 룰
3. CLAUDE.md 의 사용자 결정 + 보안 룰 인지
4. 의뢰서 작성 — 자체완결 + 검수 매트릭스 + 박제 룰

응답:
✅ Phase 13 박제 CLI 위임 프롬프트 작성 완료.
[프롬프트 본문]
...
사용자 결정 §1 (AppNav frozen) / §2 (더보기) 보존 가드 포함.
검수 매트릭스: 06 §1~§6 모두 적용.
```

---

## 9. 트러블슈팅

### 9-1. Cowork 가 룰을 인지 못 할 때

**증상**: 헤더 위반 시안이 다시 나오거나, 가짜링크 추가, 모바일 룰 누락

**조치**:
1. 사용자가 명시 요청:
   ```
   "Dev/design/claude-project-knowledge/00-master-guide.md 부터 읽고 다시 작업해."
   ```
2. 메모리 갱신 확인:
   ```
   cat C:\Users\user\AppData\...\memory\MEMORY.md
   ```
3. CLAUDE.md 의 디자인 섹션 read 확인:
   ```
   grep "🎨 디자인 작업 시" C:\0. Programing\mybdr\CLAUDE.md
   ```

### 9-2. 메모리 파일 누락

**증상**: 새 세션에서 design_appnav_frozen_violations 인지 못함

**조치**: 메모리 파일 직접 read 후 작업 시작:
```
"C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\spaces\3a0678c8-f940-48e7-897b-486a2c014ca4\memory\design_appnav_frozen_violations.md 읽고 시안 작업해"
```

---

## 10. 다음 단계

```
[지금 — 셋업 완료]
✅ CLAUDE.md 디자인 섹션 추가
✅ 메모리 2 파일 신규 (design_project_knowledge / appnav_frozen_violations)
✅ MEMORY.md 인덱스 갱신 (4 항목)
✅ Project Knowledge 패키지 9 파일 (이전에 작성됨)

[권장 검증 — 새 세션에서]
1. /clear 또는 새 chat 시작
2. § 3 의 테스트 메시지 던지기
3. 정상 응답 확인 (13 룰 + 7 룰 + 위반 5건 + 첫 응답 형식)

[옵션 — Claude.ai Project 도 동시 셋업]
- Project Knowledge 패키지 9 파일을 Claude.ai 에 업로드 (시안 시각 작업용)
- Cowork = 박제·검토 / Claude.ai = 시안 시각 작업 분리
```

---

## 부록 A — 메모리 vs CLAUDE.md vs 패키지 동기화 룰

3 채널이 같은 룰을 중복 명시하므로 **변경 시 동기화 필수**:

| 변경 사항 | CLAUDE.md | 메모리 | 패키지 |
|---------|---------|--------|--------|
| 13 룰 중 새 룰 추가 (예: 룰 14) | ✅ 갱신 | `design_project_knowledge.md` 갱신 | `00-master-guide.md` §2 갱신 |
| AppNav 새 위반 발견 (예: 위반 6) | (중요 시) 갱신 | `design_appnav_frozen_violations.md` 위반 N 추가 | `06-self-checklist.md` §1 추가 |
| 새 frozen 컴포넌트 추가 | 디자인 섹션 갱신 | 신규 메모리 또는 일반화 | `03-appnav-frozen-component.md` 또는 신규 03b |
| 박제 등급 변화 (D → 0 등) | (수치만) 갱신 | (선택) 갱신 | `04-page-inventory.md` 갱신 |
| 사용자 결정 §추가 | 디자인 섹션 갱신 | (간단 시) 갱신 | `01-user-design-decisions.md` §추가 |

→ 변경 시 모든 3 채널 동시 갱신 권장. 누락되면 한 채널만 옛 룰 사용해서 회귀.

## 부록 B — 외부 참조

- Project Knowledge 패키지: `Dev/design/claude-project-knowledge/` (9 파일)
- 메모리 디렉토리: `C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\...\memory\`
- CLAUDE.md: `C:\0. Programing\mybdr\CLAUDE.md`
- 사용자 결정: `Dev/design/user-design-decisions-2026-04-30.md`
- 마이페이지 의뢰서: `Dev/design/mypage-feasibility-and-design-brief-2026-05-01.md`
