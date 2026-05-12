# 작업 스크래치패드

## 현재 작업
- **요청**: 대회 개최 흐름 IA(Information Architecture) 재설계 기획 (코드 변경 0 / 분석만)
- **상태**: 진단 + 신규 IA 옵션 3종 + Phase 분해 완료
- **모드**: no-stop (자동 머지 위임)

## 검토 (planner-architect) — 대회 개최 흐름 IA 재설계 (2026-05-13)

🎯 **결론**: 현 흐름은 **7~9 페이지 분산 + 결정 6 그룹 중첩** → 운영자 발자국 과다 + 동선 회귀 다발. **옵션 B (Wizard 압축 + Dashboard 체크리스트 hub) 권장** — 5단 점진 진입 (UI-1 ~ UI-5).

### 1. 현재 운영자 발자국 (footprint) — 7~9 페이지

```
[start]
  ↓ 단체 생성 (선택) — /tournament-admin/organizations/new
  ↓ 시리즈 생성 (선택) — /tournament-admin/series/new (단체 select)
  ↓ 대회 신규 wizard 3-step — /tournament-admin/tournaments/new/wizard
  │   • Step 1: 대회 정보 + 일정 + 장소 + 게임설정 + 포맷 + 브래킷settings
  │   • Step 2: 종별/디비전 (RegistrationSettingsForm) + 팀설정 (TeamSettings)
  │   • Step 3: 디자인 (템플릿/로고/배너/색상/subdomain)
  ↓ 대회 대시보드 — /tournament-admin/tournaments/[id] (8 메뉴 카드)
  ↓ 종별 운영 방식 — /tournament-admin/tournaments/[id]/divisions (Phase 3.5 신규)
  ↓ 참가팀 관리 — /teams (apply_token / 명단 확인)
  ↓ 대진표 생성 — /bracket (자동 생성 + 듀얼 에디터)
  ↓ 경기/기록시스템 — /matches (recording_mode + 스코어)
  ↓ 사이트 관리 — /site (subdomain / 템플릿 / 공개)
  ↓ 관리자 / 기록원 — /admins, /recorders
[publish]
```

### 2. 분산도 매트릭스 — 결정 6 그룹 × 페이지

| 결정 그룹 | wizard new | wizard edit | dashboard [id] | divisions | bracket | matches | site | admins/recorders |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **A. 대회 기본** (이름·일정·장소·포맷·참가비) | ⭐ | ⭐ |  |  |  |  |  |  |
| **B. 시리즈/단체 연결** | △ | △ | (read) |  |  |  |  |  |
| **C. 운영 방식** (포맷+settings, 종별별) | ⭐ (대회단위) | ⭐ |  | ⭐ (종별단위) | △ (자동생성) |  |  |  |
| **D. 신청/등록** (정원·자동승인·종별참가비) | ⭐ | ⭐ |  |  |  |  |  |  |
| **E. 운영/기록** (recording_mode·TAM·기록원) |  |  |  |  |  | ⭐ |  | ⭐ |
| **F. 사이트/홍보** (subdomain·템플릿·색상·공개) | △ (초기) | △ |  |  |  |  | ⭐ |  |

⭐ = 주 결정 / △ = 부분 결정 / (read) = 읽기만. **혼란 포인트**:
- **그룹 C 가 3 페이지에 분산** (wizard 대회단위 → divisions 종별단위 → bracket 자동생성 트리거) — 운영자가 "여기서 결정한 게 저기서 덮어쓰이나?" 헷갈림
- **그룹 F (사이트)** 가 wizard Step 3 일부 + /site 페이지에 중복 — wizard 에서 subdomain/색상 입력해도 /site 에서 다시 마주침
- **그룹 E (운영/기록)** 가 wizard 흐름에서 빠져있음 — 대회 생성 후 /matches + /admins + /recorders 3 페이지 따로 진입

### 3. UX 친숙도 평가 (혼란/반복/부담/순서)

| 단계 | 혼란도 | 반복도 | 부담도 | 순서강제 |
|------|:------:|:------:|:------:|:--------:|
| 단체→시리즈→대회 의존성 | ⚠️ 중 (시리즈 없이도 대회 가능 / 어떤 게 먼저인지 모호) | 0 | 0 | 약함 |
| wizard Step 1 (대회 정보) | ⚠️ 중 (포맷 선택 + bracket settings 동시) | 0 | ⚠️⚠️ 높음 (12+ 필드) | 강함 |
| wizard Step 2 (참가설정) | ⚠️ 중 (종별 + 팀설정 + 정원 + 참가비 한 페이지) | △ (Step 1 정원과 중첩) | ⚠️⚠️ 높음 | 강함 |
| wizard Step 3 (디자인) | 낮음 | △ (/site 와 중복) | ⚠️ 중 | 약함 |
| 종별 운영 방식 (divisions) | ⚠️⚠️ 높음 ("wizard 에서 끝난 줄 알았는데?") | △ (wizard format 과 중첩) | ⚠️ 중 | **강함** (bracket 전 필수) |
| 대진표 생성 (bracket) | ⚠️ 중 (자동생성 vs 수동편집) | 0 | 중 | 강함 |
| 기록원/관리자 위임 | 낮음 | 0 | 낮음 | 약함 |
| 사이트 공개 (site) | ⚠️ 중 (wizard 와 중복 + 공개 시점 모호) | △ | 중 | 약함 |

### 4. 재설계 원칙 5 (Stripe/Vercel 패턴 참조)

1. **체크리스트 hub** — 대회 대시보드를 "메뉴 카드 8개" 가 아닌 "8개 결정 항목 + 진행도" 로 전환. 미완료 항목 = ⚪ / 완료 = ✅ / 차단 = 🔒 (예: 종별 미설정 → 대진표 잠금)
2. **Progressive Disclosure** — wizard 는 "필수 최소 3 필드" (이름 / 시작일 / 시리즈) 만 받아 즉시 draft 대회 생성. 그 외는 대시보드에서 항목별 inline 편집
3. **Single Source of Truth** — 그룹 C (운영방식) 는 종별 단위로 단일화 (`TournamentDivisionRule.format/settings`). 대회 단위 `Tournament.format` 은 default 추론용
4. **종속성 시각화** — "대진표 생성" 카드에 "종별 운영 방식이 먼저 설정되어야 합니다" 가드 + 안내 링크
5. **공개 게이트** — "사이트 공개" 를 마지막 명시 단계로 분리 (필수 7 항목 ✅ 후 공개 버튼 활성화)

### 5. 신규 IA 옵션 3종

#### 옵션 1: 체크리스트 hub (Stripe/Vercel 스타일)

```
/tournament-admin/tournaments/[id]    ⭐ 단일 dashboard
┌──────────────────────────────────────┐
│ [대회명]                              │
│ ⚪ 대회 진행도 3/8                     │
├──────────────────────────────────────┤
│ ✅ 1. 기본 정보  (이름/날짜/장소)      [편집]
│ ✅ 2. 시리즈·단체  (강남구협회)        [편집]
│ ✅ 3. 종별 정의  (i3-U9 / i2-U11)     [편집]
│ ⚪ 4. 종별 운영 방식  ← 다음 단계        [설정]
│ ⚪ 5. 참가팀 (0/16)                   [설정]
│ 🔒 6. 대진표 (4 선결)                 [잠금]
│ 🔒 7. 기록자·운영자 (5 선결)           [잠금]
│ ⚪ 8. 사이트 공개  (7 선결)           [미리보기]
└──────────────────────────────────────┘
```
- 각 항목 = 카드 / 클릭 시 inline 폼 or 슬라이드오버 모달
- 잠금 항목 = 선결 명시 (예: "종별 운영 방식이 먼저 설정되어야 합니다")
- 장점: 모든 결정이 한 화면 / 운영자 발자국 80% 감소
- 단점: 카드 클릭 → 모달 → 저장 사이클이 wizard 보다 느릴 수 있음

#### 옵션 2: Wizard 압축 + Dashboard hub ⭐ 권장

```
[Step 1] 빠른 생성 (3 필드)
  - 이름 / 시작일 / 시리즈 선택
  - "draft 대회 생성" 즉시 (~1초)

[Step 2] 대시보드 자동 진입 (위 옵션 1 체크리스트)
  - 운영자가 자기 페이스로 8 항목 채움
  - 매 항목 inline 편집 (모달 X) — 자동저장

[Step 3] "공개 준비됐어요" 가이드
  - 필수 7 항목 ✅ 되면 hub 상단에 highlight CTA "사이트 공개" 등장
```

- 옵션 1 + Wizard 잔존 (빠른 생성만)
- 장점: 신규 대회 = 최소 노력 시작 가능 / 편집 = 단일 hub
- 단점: 옵션 1 + 빠른 생성 UI 추가 박제

#### 옵션 3: AI 자연어 + 추천 (위 AI-1 검토와 연계)

- 옵션 2 위에 wizard Step 1 상단에 "💬 어떤 대회 하시려고요?" 자연어 박스 추가
- AI 가 옵션 2 의 hub 각 항목 default 자동 채움 → 운영자는 검토/조정만
- Phase AI-1 후 결재 (별 작업)

→ **권장**: 옵션 2 → 옵션 3 순서. 옵션 1 단독은 신규 대회 진입 부담이 있음.

### 6. Phase 분해 (UI-1 ~ UI-5)

| Phase | 산출물 | 영향 | LOC | 우선 |
|-------|--------|------|----|----|
| **UI-1** dashboard hub 체크리스트화 | `/tournaments/[id]` 메뉴카드 8개 → 체크리스트 카드 8개 (진행도 + 잠금 가드) | 0 schema 변경 | 200~400 | ⭐ 1순위 |
| **UI-2** wizard 압축 | 신규 wizard = 3 필드 1-step (이름/날짜/시리즈). 기존 3-step wizard = `?legacy=1` 보존 | 0 schema | 300~500 | 2순위 |
| **UI-3** 그룹 C 단일화 | wizard Step1 의 bracketSettings 제거 → 종별 단위 (divisions) 로 통일. 대회 단위 `Tournament.format` = 종별 default 추론 | 0 schema (UI/플로우만) | 100~200 | 3순위 |
| **UI-4** 사이트 그룹 F 분리 | wizard Step3 디자인 제거 → /site 단일. wizard 완료 후 hub 8번 카드 "사이트 미리보기 / 공개" CTA | 0 schema | 150~300 | 4순위 |
| **UI-5** 공개 게이트 + AI-1 연동 | 7 항목 ✅ 게이트 + AI 추천 박스 (옵션 3) | 0 schema | 200~400 | 5순위 (AI-1 결재 후) |

→ 각 Phase = 단일 PR 단위 (작은 변경 + 회귀 최소). UI-1 단독 머지로도 60~70% UX 가치 확보.

### 7. 마이그레이션 전략

| 기존 페이지 | 처리 | 사유 |
|------------|------|------|
| `/tournaments/new/wizard` | UI-2 에서 압축 (3-step → 1-step). `?legacy=1` 로 기존 3-step 보존 (회귀 대비) | 기존 운영자 습관 보존 |
| `/tournaments/[id]/wizard` (편집) | UI-1 후 deprecated 안내. hub 인라인 편집 우선 | 동일 결정을 두 페이지에서 가능한 게 혼란 원인 |
| `/tournaments/[id]/divisions` | 유지 (종별 단위 결정은 화면이 큼 — hub 카드 4번 "종별 운영 방식" 클릭 시 진입) | 종별 다건 표는 inline 모달 부적합 |
| `/tournaments/[id]/bracket` | 유지 + hub 카드 6번에서 "대진표 미리보기" 인라인 미니 + "편집" 링크 | 듀얼 에디터는 큰 화면 필요 |
| `/tournaments/[id]/site` | 유지 + hub 카드 8번 통합 진입 | 템플릿 미리보기는 큰 화면 필요 |
| `/tournaments/[id]/matches` | 유지 (기록 단계) — hub 카드 7번 "기록자" 와 분리 | 매치 표 + 스코어 입력은 별 흐름 |

### 8. 운영자 결재 사항 (3택)

| 옵션 | 범위 | 기간 | 권장 |
|------|------|------|------|
| **(가) UI-1 만** (dashboard hub 체크리스트화) | 가장 적은 변경 / 가장 큰 UX 가치 | 1~2일 | ⭐ 1순위 — 빠른 검증 |
| (나) UI-1 + UI-2 일괄 | hub + wizard 압축 | 3~5일 | 2순위 — 신규 대회 부담 함께 해결 |
| (다) UI-1 ~ UI-5 전체 | IA 전면 재설계 | 1.5~2주 | 3순위 — AI-1 결재 후 함께 진행 권장 |

### 9. 위험 / 미해결

| 위험 | 완화 방안 |
|------|----------|
| 운영자 기존 습관 (3-step wizard 익숙) | UI-2 에서 `?legacy=1` 로 기존 wizard 보존 + 6개월 후 deprecated |
| inline 편집 시 검증 (필드 간 의존) | hub 카드별 zod schema 분리 + 저장 시 서버 가드 (기존 API 재사용) |
| Phase 3.5 종별 운영 방식 (recently 추가) 와 충돌 | UI-3 가 단일화 책임 — 대회 단위 format = 종별 default 추론 |
| 진행도 % 산정 기준 모호 | 8 항목 중 "필수 7 + 선택 1" 정의 (사이트 공개 = 선택). 진행도 = 필수 7 중 완료 수 |
| 운영 영향 0 보장 | UI-1 ~ UI-5 모두 schema/API 변경 0. 신규 페이지 0 (기존 페이지 hub 통합만) |

### 10. 핵심 요약 (300~600 단어)

**현재 흐름의 본질적 문제**는 **결정 6 그룹이 7~9 페이지에 분산**되어 운영자가 "어디서 무엇을 결정하는지" 정신 모델을 형성하기 어렵다는 점입니다. 특히 **그룹 C (운영 방식)** 가 wizard(대회 단위) → divisions(종별 단위) → bracket(자동생성) 3 페이지에 걸쳐 분산되어 있어, 운영자가 같은 결정을 여러 번 마주칩니다. **wizard Step 1** 은 12+ 필드 한 페이지에 압축되어 부담이 높고, **wizard Step 3 (디자인)** 은 `/site` 페이지와 중복되어 "어디서 수정해야 하지?" 회귀를 발생시킵니다.

**재설계 핵심**은 **dashboard 를 메뉴 카드 8개 (현재) 가 아닌 체크리스트 hub (Stripe/Vercel 패턴)** 로 전환하는 것입니다. 진입점 8개를 "결정 항목 8개 + 진행도 + 잠금 가드" 로 시각화하면, 운영자는 "다음 무엇을 결정해야 하는지" 한눈에 파악합니다. 잠금 가드 (예: 종별 미설정 → 대진표 잠금) 는 종속성을 명시적으로 보여줘 회귀 동선을 차단합니다.

**권장 진입 순서** = **옵션 2 (Wizard 압축 + Dashboard hub)** 의 5단 점진:
- **UI-1**: dashboard 체크리스트화 (가장 적은 변경 / 가장 큰 UX 가치)
- **UI-2**: wizard 3-step → 1-step (3 필드만 빠른 생성)
- **UI-3**: 그룹 C 종별 단위 단일화
- **UI-4**: 사이트 그룹 F 분리 (wizard 에서 제거)
- **UI-5**: 공개 게이트 + AI 추천 (AI-1 결재 후)

각 Phase 는 schema/API 변경 0 (UI 플로우만) → 회귀 위험 최소. **UI-1 단독 머지** 만으로도 60~70% UX 가치 확보 가능.

**운영자 결재 3택**: (가) UI-1 만 [⭐ 1순위, 1~2일] / (나) UI-1+UI-2 일괄 [3~5일] / (다) UI-1~UI-5 전체 [1.5~2주, AI-1 함께 권장].

---

## 이전 작업 (AI 자연어 대회 운영 가능성 검토 — 2026-05-13)
- **상태**: 검토 완료 — 결론: 가능 + Phase AI-1 부터 권장
- **모드**: no-stop (자동 머지 위임)

## 검토 (planner-architect) — AI 자연어 대회 운영 가능성 (2026-05-13)

🎯 **결론**: 가능 + **Phase AI-1 (추천 시스템)** 부터 권장. AI-2 까지는 1주일 단위로 점진 진행. AI-3 (custom phase) 는 사용성 검증 후 별 결재.

💡 **핵심 발견**: 이미 `@google/genai` (Gemini 2.5 Flash) 가 `src/lib/news/gemini-client.ts` 에서 운영 중 (BDR NEWS / 알기자 / 프로필 bio). LLM 인프라 신규 박제 불필요 — **재사용 100%**. 무료 tier 1500 RPD 잔여로 대회 운영 추천 (월 100~300 호출) 충분.

### 1. 3개 접근 패턴 비교

| 패턴 | 본질 | LOC | 위험 | 권장 |
|------|------|-----|------|------|
| **A. 추천 시스템 (단순)** | 자연어 → AI → enum 1~3개 추천 + 이유 텍스트 → 운영자 1-click 적용 | 200~400 | 낮음 (기존 흐름 보존) | ⭐ Phase AI-1 |
| **B. Structured Output 강제** | 자연어 → AI → zod schema 일치 settings JSON 자동 반환 → 미리보기 → 적용 | 400~600 | 중간 (AI 응답 검증 필요) | Phase AI-2 |
| **C. Custom Phase 모드** | 신규 enum `custom_phase` + settings 에 phase 배열 (예선/본선/패자전 phase-by-phase) → AI 가 phase 배열 생성 | 1500+ | 높음 (진출 매핑 service 재설계) | Phase AI-3 (보류) |

→ **A→B 점진 진행이 안전**. A 가 60~70% UX 가치 (운영자 결정 보조) 를 이미 제공. B 로 1-click 자동 세팅까지 확장 시 90% 도달. C 는 표현력 극대화이지만 9 enum 으로 표현 불가능한 시나리오가 실제로 자주 발생하는지 검증 후 결재.

### 2. 데이터 모델 표현력 vs 자연어

**현재 9 enum 으로 표현 가능**:
- 시나리오 A "16팀 4조 풀리그 후 각조 2팀 토너먼트" → `group_stage_knockout` + group_size=4 / group_count=4 / advance_per_group=2 ✅
- 시나리오 B "6팀 초등부 운영" → `group_stage_with_ranking` + group_size=3 / group_count=2 추천 ✅
- "스위스 5라운드" → `swiss` ✅

**현재 enum 으로 표현 불가능** (자연어로는 요청 가능):
- "8강은 듀얼, 4강부터 싱글" — phase 별 운영 방식 변경 ❌
- "예선 풀리그 → 본선 토너먼트 → 패자부활전 → 3·4위전" — 4 phase 체인 ❌
- "조별리그 후 상위 4팀 풀리그" — 본선이 풀리그 ❌

→ Phase AI-1/2 는 표현 가능 범위로 한정 (AI 가 "이 방식은 현재 시스템에서 표현 불가능합니다 — 대안 제안" 응답 가능). Phase AI-3 만이 표현력 확장.

### 3. AI 활용 흐름 (Phase AI-1 mock)

```
[운영자가 wizard 진입]
  /tournament-admin/tournaments/new/wizard

[Step 1 대회 정보 상단에 신규 input]
  💬 "어떤 방식으로 운영하고 싶으세요?" (placeholder: 예: 16팀 4조 풀리그 후 토너먼트)
  [추천 받기] 버튼

[운영자 입력]
  "초등부 6팀인데 어떻게 운영하는 게 좋을까?"

[AI 응답 (3~5초)]
  📊 추천 1순위 — 조별리그 + 동순위 순위결정전
     • group_size=3 / group_count=2 / advance_per_group=N/A
     • 사유: 6팀 = 3×2 균형 / 모든 팀이 최소 4경기 보장
     • [이대로 적용]

  📊 추천 2순위 — 풀리그
     • 6팀 단일 풀리그 (각 5경기 / 총 15경기)
     • 사유: 운영 단순 + 모든 매치업 1회 보장
     • [이대로 적용]

[1-click 적용]
  → format / settings 자동 박제
  → wizard Step 2 (참가 설정) 자동 진행
```

### 4. 로드맵 — Phase AI-1 / 2 / 3

| Phase | 산출물 | LOC | 가치 | 비용 (월) |
|-------|--------|-----|------|----------|
| **AI-1 추천** | `/api/web/admin/ai/recommend-format` BFF + wizard 입력 박스 + 추천 카드 UI + zod 응답 검증 + Gemini 시스템 프롬프트 (한국 생활체육 표준 + 9 enum 룰 박제) | 200~400 | 운영자 결정 보조 (60~70%) | $0 (Gemini 무료 tier) |
| **AI-2 자동 적용** | AI-1 위에 `divisions/page.tsx` "💬 AI 추천" 모달 + structured output (settings JSON 자동 채움) + 미리보기 + 1-click 적용 | 400~600 (AI-1 누계 ~600~1000) | 1-click 세팅 (90%) | $0~$5 (호출 증가) |
| **AI-3 custom phase** | 신규 enum + settings phase 배열 + 진출 매핑 service 재설계 + AI 가 phase 배열 생성 | 1500+ | 표현력 극대화 (95%+) | $5~$20 |

→ **권장 진입 순서**: AI-1 → 1주 운영 → 추천 적중률 / 운영자 만족도 측정 → AI-2 결재 → 1주 운영 → AI-3 필요성 검증.

### 5. 운영자 UX 진입점 2개소

| 진입점 | 위치 | AI-1 흐름 | AI-2 흐름 |
|--------|------|----------|----------|
| **신규 대회 wizard** | `/tournament-admin/tournaments/new/wizard` | Step 1 상단 입력 박스 → enum 추천 → 자동 선택 | 추천 → settings 자동 채움 |
| **종별 운영 페이지** | `/tournament-admin/.../[id]/divisions` | "💬 AI 추천" 버튼 → 모달 → 종별 단위 추천 | 모달 → settings 미리보기 → 적용 |
| **기존 대회 영향** | 0 | 옵션 기능 | 옵션 기능 |

### 6. 비용 / 성능 추정

| 항목 | 추정치 | 비고 |
|------|--------|------|
| 호출 빈도 | 대회 1건당 ~1~3회 (추천 + 종별 단위 추천) | 월 신규 대회 30~50건 가정 → 월 50~150 호출 |
| Gemini 2.5 Flash 무료 tier | 1500 RPD = 일 1500 호출 | 운영 평소 360 호출 + 본 기능 ~5/일 = 충분 |
| 응답 시간 | 3~5초 (한글 200~300토큰 출력) | wizard 단계 자연스러운 대기 |
| Vercel AI Gateway 필요? | ❌ 불필요 | Gemini 직접 호출로 충분 (단일 모델). Multi-provider failover 필요 시 후속 |
| Vercel AI SDK 필요? | △ 선택 | `streamText` + structured output 강제 시 도입 검토. Phase AI-2 진입 시 결재 |

### 7. 위험 / 미해결

| 위험 | 완화 방안 |
|------|----------|
| AI 가 잘못된 enum 반환 (hallucination) | zod schema 강제 + ALLOWED_FORMATS 화이트리스트 검증 + 실패 시 fallback "수동 선택" 안내 |
| 운영자 의도 vs 추천 불일치 (예: 시상 정책 모호) | 추천 카드에 "사유" 명시 + 항상 2~3순위 같이 제시 + 수동 override 항상 가능 |
| 한국 도메인 용어 (생활체육 농구 표준) 이해도 | 시스템 프롬프트에 한국 표준 룰 박제 (advance_per_group=2 default / 6팀 = 3×2 / 16팀 = 4×4) + 알기자 시스템 프롬프트 패턴 재사용 |
| Prompt injection (운영자 자유 입력) | 입력 max 500자 + 시스템 프롬프트 우선 + LLM 응답이 zod schema 통과 여부로 1차 가드 |
| API key 관리 | `GEMINI_API_KEY` 이미 .env 박제 (BDR NEWS 운영 중). 신규 키 발급 불필요 |

### 8. 운영자 결재 사항 (3택)

| 옵션 | 범위 | 기간 | 권장 |
|------|------|------|------|
| **(가) Phase AI-1 만** | 추천 시스템 (자연어 → enum + 사유) | 1~2일 작업 | ⭐ 1순위 추천 — 빠른 검증 |
| (나) AI-1 + AI-2 일괄 | 추천 + 자동 적용 | 3~5일 작업 | 2순위 — AI-1 적중률 검증 없이 일괄 도입은 회귀 위험 |
| (다) 보류 | 현 9 enum + 수동 UI 유지 | 0 | 3순위 — 운영자 결정 보조 가치 포기 |

### 9. 만들 위치와 구조 (Phase AI-1 기준 — 코드 변경 0 / 본 검토에서는 설계만)

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `src/lib/ai/format-recommend-prompt.ts` | 시스템 프롬프트 (한국 생활체육 룰 + 9 enum 표 + 응답 schema 명시) | 신규 |
| `src/lib/ai/format-recommend-schema.ts` | zod schema (recommendations 배열 + format/settings/reason) | 신규 |
| `src/app/api/web/admin/ai/recommend-format/route.ts` | BFF — `withAuth` (canManageTournament 권한자) + `withValidation` + `generateText` 호출 + zod 응답 검증 | 신규 |
| `src/components/tournament/ai-format-recommender.tsx` | UI — 자연어 입력 박스 + 추천 카드 3개 + 1-click 적용 콜백 | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | Step 1 상단에 `<AiFormatRecommender onApply={(format, settings) => ...}>` 삽입 | 수정 |
| `src/__tests__/lib/ai/format-recommend-schema.test.ts` | zod schema 회귀 가드 (정상 / 잘못된 enum / settings 범위외) | 신규 |

🔗 **기존 코드 연결**:
- `src/lib/news/gemini-client.ts` `generateText()` 재사용 (신규 SDK init 0)
- `src/lib/tournaments/division-formats.ts` `ALLOWED_FORMATS` / `FORMAT_LABEL` / `validateDivisionSettings` 재사용 (단일 source of truth)
- `withAuth` + `withValidation` 패턴 재사용

📋 **AI-1 실행 계획 (참고 — 본 검토에서는 작업 X)**:

| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | 시스템 프롬프트 + zod schema 박제 | developer | 없음 |
| 2 | BFF route.ts + generateText 호출 | developer | 1 |
| 3 | `<AiFormatRecommender>` UI | developer | 1, 2 |
| 4 | wizard Step 1 통합 | developer | 3 |
| 5 | zod schema vitest + 시스템 프롬프트 mock 테스트 | tester | 1, 2 |
| 6 | 보안 리뷰 (prompt injection / 권한 / 응답 검증) | reviewer | 4 (병렬 5) |

⚠️ **developer 주의사항 (AI-1 진입 시)**:
- 시스템 프롬프트에 9 enum + settings 룰 표 박제 필수 (hallucination 방지)
- AI 응답이 zod 통과 못할 시 → 운영자에게 "다시 입력해 주세요" 안내 + 수동 선택 fallback
- BFF 응답 시간 모니터링 (5초+ 타임아웃) — Vercel Functions 기본 limit 검토
- `GEMINI_API_KEY` 무료 tier rate limit 모니터링 (1500 RPD)
- BDR NEWS 와 호출 풀 공유 → 동시 사용 시 rate limit 도달 가능성 (현재 360 RPD + 본 기능 5 RPD = 365 / 1500 → 여유 충분)

---


## 다음 작업 큐 (사용자 보고 — 별 PR 대기)
| # | 이슈 | 영향 | 비고 |
|---|------|------|------|
| Q1 | 사이트 설정 동작 안 함 (이미지 40) | `/tournament-admin/[id]/site` 색상 단계에서 "서브도메인 필요" 빨강 에러. 흐름 버그 — 색상 단계인데 서브도메인 검증 잘못된 시점 발동 | 별 PR |
| Q2 | 코치 명단 입력 0/36 | 5/16 임박 — 토큰 발송 + 코치 입력 운영 행동 필요 | 운영자 액션 |
| Q3 | 코치 연락처 (manager_name/phone) 0/36 | A 도구 (scripts/_templates/import-coach-contacts.template.ts) 활용 — 명단 보유 시 | 운영자 액션 |
| Q4 | 대회 status='draft' → 5/15 'in_progress' 전환 | 대회 시작 시 운영자 transition | 운영자 액션 |

## 진행 현황표 (이번 세션)
| # | 작업 | 상태 |
|---|------|------|
| B | 강남구협회장배 max_teams 16→36 | ✅ |
| A | 코치 import 템플릿 | ✅ |
| E (Phase 4-E 시) | canManageTournament 단체 admin 자동 부여 | ✅ |
| C | 단체 정보 편집 모달 | ✅ |
| D | 대진표 고도화 | 진행 중 |
| **Phase E lifecycle** | **단체 archive (Q1 보존)** | **✅ (커밋 대기)** |

## 구현 기록 (developer) — advance_per_group 본선 진출 팀 수 설정 (Phase 3.5-F / 2026-05-13)

📝 구현 범위: settings JSON 에 `advance_per_group` (조별 본선 진출 팀 수) 박제 + UI input + zod 검증 + vitest 9건.

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/tournaments/division-formats.ts` | (a) `shouldShowAdvancePerGroup()` 신규 — `group_stage_knockout` / `full_league_knockout` / `dual_tournament` 3개 enum 시만 true. (b) `ADVANCE_PER_GROUP_DEFAULT = 2` (생활체육 표준 1·2위 진출). (c) `validateDivisionSettings` 확장 — `advance_per_group`: 1~32 정수 + group_size 박제 시 `advance_per_group <= group_size` 강제 (조 크기 초과 진출 불가). (d) `DivisionSettingsValidationError.field` 에 `advance_per_group` 추가. | 수정 |
| `src/app/api/web/admin/tournaments/[id]/division-rules/[ruleId]/route.ts` | settingsSchema zod refine 메시지 갱신 (advance_per_group 명시). 검증 로직 자체는 `validateDivisionSettings` 위임 → 자동 반영. | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx` | (a) `shouldShowAdvancePerGroup` / `ADVANCE_PER_GROUP_DEFAULT` import. (b) GroupSettingsInputs 에 `advancePerGroup` state + initialAdvancePerGroup 추출. (c) handleSave 에 박제 로직 — 노출 enum 만 settings 박제, 비노출 enum 으로 전환 시 키 삭제. (d) input row 신규 — 조별 본선 진출 팀 수, max=group_size (조 크기 초과 차단), default placeholder 2. (e) 안내문 확장 — 총 본선 진출 = advance_per_group × group_count 자동 계산. (f) 가이드 li 텍스트 — "조별 본선 진출 팀 수 설정 가능" 추가. | 수정 |
| `src/__tests__/lib/tournaments/division-formats.test.ts` | +9 신규 케이스 — shouldShowAdvancePerGroup True 3건 + False 9건 / advance_per_group 정상 / 범위외 / >group_size / =group_size / group_size 없이 단독 / 강남구협회장배 시나리오 / DEFAULT=2 회귀. 총 25 → 34 PASS. | 수정 |

### 노출 매트릭스 (사용자 요구사항 그대로)
| enum | shouldShowAdvancePerGroup | 의미 |
|------|--------------------------|------|
| `group_stage_knockout` | ✅ true | 조 N위까지 본선 토너먼트 진출 |
| `full_league_knockout` | ✅ true | 풀리그 N위까지 다음 토너먼트 진출 |
| `dual_tournament` | ✅ true | 조 N위까지 본선 진출 (보통 4×4) |
| `league_advancement` | ❌ false | linkage_pairs 로 매칭 |
| `group_stage_with_ranking` | ❌ false | 모든 순위 동순위전 |
| `round_robin` / `single_elimination` / `double_elimination` / `swiss` | ❌ false | 본선 분리 없음 |

### 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT_CODE=0 (출력 0줄) |
| `npx vitest run division-formats` | ✅ 34/34 PASS (이전 25 + 신규 9) |
| `npx vitest run` 전체 | ✅ **639/639 PASS** (이전 630 + 신규 9) |
| Flutter v1 영향 | ✅ 0 (`api/v1/` 에 division-formats / FORMAT_LABEL import 0건) |
| schema 변경 | ✅ 0 (settings JSON 활용만) |
| advance_per_group 영향 파일 | ✅ 4개 (의도된 범위) |
| 디자인 13 룰 | ✅ var(--color-*) 100% / 44px+ 터치 / 4px radius |

### 💡 tester 참고
- **테스트 방법**: `/tournament-admin/tournaments/[id]/divisions` 진입 → 종별 카드 진행 방식 변경
- **정상 동작**:
  1. **3 enum 시 input 노출** — `조별리그 + 토너먼트` / `풀리그 + 토너먼트` / `듀얼 토너먼트` 선택 → "조별 본선 진출 팀 수" input 표시
  2. **default placeholder** — 빈 값일 때 "예: 2" 노출 (생활체육 표준)
  3. **상한 자동 가드** — group_size=4 입력 후 advance_per_group input max=4 자동 설정 (HTML5 + 서버 zod 이중 가드)
  4. **총 본선 진출 자동 계산** — group_count=4 + advance_per_group=2 입력 → "총 16팀 (4 × 4) / 총 본선 진출 = 8팀" 표시
  5. **enum 전환 시 자동 정리** — `group_stage_knockout` → `league_advancement` 변경 시 settings.advance_per_group 키 자동 삭제 (의미 없는 잔존 방지)
  6. **기존 데이터 호환** — advance_per_group 미박제 settings = input 빈 값으로 노출 (placeholder 가 default 2 안내)
- **주의할 입력**:
  - advance_per_group=5, group_size=4 박제 시도 → 서버 422 ("group_size 이하여야 합니다")
  - advance_per_group=0 / 음수 / 소수 → HTML5 거부 + 서버 422
  - enum 이 `league_advancement` / `group_stage_with_ranking` / `round_robin` 일 때 input 숨김 확인

### ⚠️ reviewer 참고
- **default 값 명시 위치**: `ADVANCE_PER_GROUP_DEFAULT = 2` lib 상수 + UI placeholder 만 노출. settings 박제 강제 아님 (사용자 미입력 시 키 자체 없음 → 호환성 100%).
- **상한 검증 이중 가드**: HTML5 input max + 서버 zod refine 둘 다 적용. group_size 변경 후 advance_per_group 미수정 케이스도 서버에서 422 차단.
- **lib import 영향**: shouldShowAdvancePerGroup / ADVANCE_PER_GROUP_DEFAULT 신규 export — page.tsx + 테스트만 사용. 다른 admin 페이지 영향 0.
- **enum 전환 안전성**: 비노출 enum 으로 변경 시 handleSave 가 `delete next.advance_per_group` 자동 실행 → settings 잔존 키 방지.

### 신규 보안 이슈
- **0 건** — settings JSON 필드 추가만. API / 권한 / DB / schema 영향 0.

---

## 구현 기록 (developer) — 한국식 용어 통일 + group_count 조건부 UI (Phase 3.5-E / 2026-05-13)

📝 구현 범위: FORMAT_LABEL 3개 라벨 한국 생활체육 표준 통일 + group_count <= 2 일 때 ranking_format 드롭다운 숨김 + 단판 안내문 노출.

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/tournaments/division-formats.ts` | FORMAT_LABEL 3개 라벨 변경 — `single_elimination` "싱글 엘리미네이션" → **"토너먼트"**, `round_robin` "풀리그 (Round Robin)" → **"풀리그"**, `double_elimination` "더블 엘리미네이션" → **"더블 토너먼트"**. swiss / dual_tournament / group_stage_knockout / full_league_knockout / league_advancement / group_stage_with_ranking = 변경 0. enum 값 자체는 변경 X (DB 호환성). 코멘트로 영문 매핑 보존. | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx` | (a) `<GroupSettingsInputs>` 의 ranking_format 영역에 `group_count <= 2` 분기 신규 — 드롭다운 대신 "각 동순위전이 단판 경기로 자동 진행됩니다 (조 개수가 2조 이하)" 안내문 노출. (b) 드롭다운 라벨 한국식 — "싱글 엘리미네이션" → "토너먼트" / "풀리그" 그대로. (c) onChange 즉시 setGroupCount → React 자동 재렌더로 토글 즉시 반영 (저장 트리거는 onBlur 그대로). (d) 페이지 하단 가이드 li 일관성 — "싱글 엘리미네이션" → "토너먼트" + "더블 토너먼트" 항목 신규 추가. | 수정 |
| `src/__tests__/lib/tournaments/division-formats.test.ts` | FORMAT_LABEL 회귀 가드 4건 신규 — `single_elimination`="토너먼트" / `round_robin`="풀리그" / `double_elimination`="더블 토너먼트" / `swiss`="스위스 라운드" 유지. 총 21 → 25건 PASS. | 수정 |

### 라벨 변경 매트릭스
| enum (DB 박제 — 변경 X) | 변경 전 | 변경 후 |
|------|--------|--------|
| `single_elimination` | 싱글 엘리미네이션 | **토너먼트** |
| `round_robin` | 풀리그 (Round Robin) | **풀리그** |
| `double_elimination` | 더블 엘리미네이션 | **더블 토너먼트** |
| `swiss` | 스위스 라운드 | (그대로) |
| 나머지 5개 | 이미 한국식 | (그대로) |

### group_count 조건부 분기
| group_count | 노출 | 의미 |
|------------|------|------|
| 빈 값 | 드롭다운 노출 (default round_robin) | 사용자가 아직 입력 안 함 |
| 1, 2 | **안내문 노출 (드롭다운 숨김)** | 2팀 매칭 = 어떤 방식이든 단판 1경기 자동 매핑 |
| 3+ | 드롭다운 노출 (풀리그 / 토너먼트) | 동순위 팀 3+ → 방식 선택 의미 있음 |

→ default `round_robin` 박제는 그대로 (group_count <= 2 일 때도 settings JSON 에 박제 → 호환성).

### 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT_CODE=0 (출력 0줄) |
| `npx vitest run division-formats` | ✅ 25/25 PASS (이전 21 + 신규 4) |
| `npx vitest run` 전체 | ✅ **630/630 PASS** (이전 626 + 신규 4) |
| Flutter v1 영향 | ✅ 0 (`api/v1/` 에 FORMAT_LABEL / division-formats import 0건) |
| schema 변경 | ✅ 0 (enum 값 자체 변경 X — 라벨만 한국화) |
| lucide-react import | ✅ 0건 |
| 핑크 hex / hotpink / salmon / coral | ✅ 0건 |
| AppNav frozen 영향 | ✅ 0 |
| BFF / service 변경 | ✅ 0 |
| 디자인 13 룰 | ✅ var(--color-*) 100% / 44px+ 터치 / 4px radius |

### 💡 tester 참고
- **테스트 방법**: `/tournament-admin/tournaments/[id]/divisions` 진입 (canManageTournament 권한자)
- **정상 동작**:
  1. **라벨 한국화** — 진행 방식 드롭다운에서 "토너먼트" / "풀리그" / "더블 토너먼트" 노출 (영문 괄호 제거)
  2. **신규 enum 선택 시** — "조별리그 + 동순위 순위결정전" 선택 → group_size / group_count input 노출
  3. **group_count 조건부 분기**:
     - 빈 값 → 동순위전 방식 드롭다운 노출 (default 풀리그)
     - **1 입력** → 드롭다운 즉시 사라짐 + "각 동순위전이 단판 경기로 자동 진행됩니다 (조 개수가 2조 이하)" 안내 박스 표시
     - **2 입력** → 동일 (안내 박스)
     - **3 입력** → 드롭다운 다시 노출 (풀리그 / 토너먼트 선택)
  4. **토글 즉시 반영** — group_count input 변경 즉시 (onBlur 없이) ranking_format 영역 재렌더 (React state)
  5. **settings JSON 박제** — group_count <= 2 여도 `{"group_size":4,"group_count":2,"ranking_format":"round_robin"}` 박제 유지 (호환성)
- **주의할 입력**:
  - group_count = 0 / 음수 → input min=1 으로 거부 (서버 422 이중 가드)
  - group_count = 3 으로 입력 후 드롭다운에서 "토너먼트" 선택 → "single_elimination" 박제
  - 가이드 카드 하단에 "더블 토너먼트" 항목 추가 노출 확인

### ⚠️ reviewer 참고
- **enum 값 그대로** — `single_elimination` / `round_robin` / `double_elimination` 모두 DB / settings.ranking_format 박제 값 변경 X. 라벨만 한국화 → 기존 박제 데이터 호환성 100%.
- **default `round_robin` 박제 유지** — group_count <= 2 일 때 안내문 노출이지만 settings.ranking_format 은 그대로 박제 (사용자 결재 §B). 추후 group_count 3+ 로 변경 시 기존 값 자연 노출.
- **onChange 즉시 토글** — setGroupCount 가 React state 변경이라 자동 재렌더 → 조건부 분기 즉시 적용. onBlur 는 저장 트리거만 담당 (분리).
- **lib import 한국식 라벨 확산 영향 0** — FORMAT_LABEL 을 lib 에서 직접 import 하는 곳은 `divisions/page.tsx` + 테스트 뿐 (grep 검증). 다른 admin 페이지 (wizard / tournaments 목록 / about / hero 등) 는 자체 라벨 매핑 사용 → 별 영향 0.

### 신규 보안 이슈
- **0 건** — 라벨 / UI 분기만 변경. API / 권한 / DB / schema 영향 0.

---

## 구현 기록 (developer) — 종별 운영 방식 신규 모드 + 조 설정 UI (Phase 3.5-D / 2026-05-12)

📝 구현 범위: 신규 enum `group_stage_with_ranking` (조별리그 + 동순위 순위결정전) + 조 크기/조 개수/동순위전 방식 input UI + settings JSON 검증 + vitest 21건.

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/tournaments/division-formats.ts` | **신규** — ALLOWED_FORMATS (9개 enum), FORMAT_LABEL, showGroupSettings / showRankingFormat, validateDivisionSettings (1~32 정수 / round_robin·single_elimination), calculateTotalTeams. server+client 단일 source of truth. | 신규 |
| `src/__tests__/lib/tournaments/division-formats.test.ts` | **신규** — 21 케이스 (ALLOWED_FORMATS 회귀 / FORMAT_LABEL 모든 enum / showGroupSettings 풀리그 6+조 X 3+null/undefined / showRankingFormat 신규만 / validateDivisionSettings 정상·범위외·legacy 키 호환 / calculateTotalTeams) | 신규 |
| `src/app/api/web/admin/tournaments/[id]/division-rules/route.ts` | (a) ALLOWED_FORMATS 인라인 → `@/lib/tournaments/division-formats` import. (b) 미사용 z / apiError 제거. | 수정 |
| `src/app/api/web/admin/tournaments/[id]/division-rules/[ruleId]/route.ts` | (a) ALLOWED_FORMATS / settings 검증 lib 위임. (b) settings zod = record + refine(validateDivisionSettings === null). | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx` | (a) FORMAT_LABEL / showGroupSettings / showRankingFormat 인라인 → lib import. (b) `<GroupSettingsInputs>` 컴포넌트 신규 — 조 크기·조 개수·동순위전 방식 input 3개 + 총 팀 수 계산 안내 + onBlur 저장 (PATCH 재사용). (c) 가이드 항목 추가 ("조별리그 + 동순위 순위결정전 — 4×4=16팀 / 21경기"). (d) FORMAT_LABEL indexing cast (런타임 ?? f 폴백). | 수정 |
| `src/lib/tournaments/division-advancement.ts` | `generateGroupStageRankingPlaceholders` stub 함수 추가 (후속 PR TODO 명시 — 본 PR 범위 = enum+UI 만). | 수정 |
| `prisma/schema.prisma` | 코멘트 갱신만 (settings JSON 의 group_size / group_count / ranking_format 키 + group_stage_with_ranking enum). **schema 값 변경 0**. | 수정 |

### 신규 enum 도메인
- **이름**: `group_stage_with_ranking` (사용자 권장)
- **라벨**: "조별리그 + 동순위 순위결정전"
- **의미**: 각 조 풀리그 (group_size 팀 × group_count 조) → 모든 조 동순위끼리 자동 매칭 (1위×N팀 / 2위×N팀 / ...)
- **`league_advancement` 와 차이**:
  - league_advancement = settings.linkage_pairs (예: `[[1,2],[3,4]]`) 명시 → 특정 조끼리만
  - group_stage_with_ranking = group_size/group_count 만 박제 → 모든 동순위 자동 매칭

### settings JSON 형식 (신규 enum)
```json
{
  "group_size": 4,
  "group_count": 4,
  "ranking_format": "round_robin"
}
```
- group_size × group_count = 16팀 (예시)
- ranking_format: "round_robin" / "single_elimination" (default round_robin)

### 조 설정 UI 노출 가드 매트릭스
| format | showGroupSettings | showRankingFormat |
|--------|:----------------:|:----------------:|
| round_robin | ✅ | ❌ |
| dual_tournament | ✅ | ❌ |
| group_stage_knockout | ✅ | ❌ |
| full_league_knockout | ✅ | ❌ |
| league_advancement | ✅ | ❌ |
| **group_stage_with_ranking** | ✅ | ✅ ⭐ |
| single_elimination | ❌ | ❌ |
| double_elimination | ❌ | ❌ |
| swiss | ❌ | ❌ |
| null / undefined | ❌ | ❌ |

### 진출 매핑 stub (후속 PR 큐잉)
`generateGroupStageRankingPlaceholders` = stub 함수만 박제. 후속 PR TODO:
1. 종별 settings.group_size / group_count 조회
2. standings 계산 (기존 getDivisionStandings 재사용)
3. 1위×group_count / 2위×group_count / ... settings.group_size 위까지 placeholder 매치 자동 생성
4. notes "{N}위 동순위전" 형식 박제
5. advanceDivisionPlaceholders 와 동일 standings 기반 자동 채움

→ 본 PR 범위 = enum + UI input 만 (운영자가 group_size / group_count 입력 가능). 실제 매칭 자동 생성은 후속 PR.

### 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT_CODE=0 (출력 0줄) |
| `npx vitest run division-formats` | ✅ 21/21 PASS |
| `npx vitest run` 전체 | ✅ **626/626 PASS** (이전 605 + 21 신규) |
| Flutter v1 영향 | ✅ 0 (`api/v1/` 에 division-rules 호출처 0건) |
| schema 변경 | ✅ 0 (코멘트만 갱신 / String 필드 그대로) |
| lucide-react import | ✅ 0건 |
| 핑크 hex / hotpink / salmon / coral | ✅ 0건 |
| AppNav frozen 영향 | ✅ 0 |
| BFF / service 변경 | ✅ 진출 매핑 stub 만 (기존 함수 변경 0) |
| 디자인 13 룰 | ✅ var(--color-*) 100% / 44px+ 터치 / 4px radius / 빨강 본문 0 |

### 💡 tester 참고

**테스트 방법**:
1. `/tournament-admin/tournaments/[id]/divisions` 진입 (canManageTournament 권한자)
2. 각 종별 카드의 "진행 방식" select 에서 **"조별리그 + 동순위 순위결정전"** 옵션 노출 확인
3. 신규 enum 선택 → 카드 하단에 input 3개 노출:
   - 조 크기 (팀)
   - 조 개수
   - 동순위전 방식 (select: 풀리그 / 싱글 엘리미네이션)
4. 다른 풀리그 기반 enum (round_robin / dual_tournament / group_stage_knockout / full_league_knockout / league_advancement) 선택 시 → 조 크기 + 조 개수 input 2개만 노출 (ranking_format 숨김)
5. single_elimination / double_elimination / swiss / "(대회 format 폴백)" 선택 시 → input 전부 숨김
6. 값 입력 → onBlur (focus 해제) 시 자동 PATCH → settings JSON 박스에 박제 결과 표시

**정상 동작**:
- 조 크기 4 / 조 개수 4 입력 → "총 16팀 (4 × 4)" 안내 즉시 표시
- 빈 값 → "조 크기 × 조 개수 = 총 팀 수" 안내
- settings JSON 박스에 `{"group_size":4,"group_count":4,"ranking_format":"round_robin"}` 표시
- 가이드 카드 하단에 "조별리그 + 동순위 순위결정전 — 4×4=16팀 / 21경기" 추가 노출

**주의할 입력 (서버 검증 차단)**:
- 음수 / 0 / 33+ / 소수 / 문자 → input 자체가 거부 (min/max/step) + 서버 422
- ranking_format = "double_elimination" → 422 (round_robin / single_elimination 만 허용)
- legacy 키 (linkage_pairs / advanceCount / groupSize camelCase) 동시 박제 → 통과 (호환 유지)

### ⚠️ reviewer 참고
- **lib/tournaments/division-formats.ts 분리 사유**: server (route.ts × 2) + client (page.tsx) 동일 enum / 검증 룰 사용 → 단일 source of truth + vitest 단위 검증 가능 (route.ts 는 NextRequest 의존성으로 단위 테스트 어려움).
- **schema 변경 0**: format = String 필드 / settings = Json. enum 추가 = 코멘트만 갱신. prisma migrate 불필요.
- **진출 매핑 자동 생성은 후속 PR**: 본 PR 은 enum + UI input 박제 만. 운영자가 group_size / group_count 입력은 가능하나, 실제 동순위전 placeholder 자동 생성은 stub. PM 큐잉 보고 필요.
- **legacy 키 호환**: settings JSON 에 기존 `linkage_pairs` / `groupCount` (camelCase) / `advanceCount` 박제된 종별이 있을 수 있음. validateDivisionSettings 는 이들 키를 검증 안 함 (호환 유지).
- **onBlur 저장 전략**: 입력 중간 PATCH 폭주 방지. focus 해제 시 1회 PATCH. (debounce 추가 시 별 PR)
- **FORMAT_LABEL cast**: `(FORMAT_LABEL as Record<string, string>)[f]` — allowedFormats 가 string[] 으로 들어와서 narrow type 매칭 안 됨. 런타임 `?? f` 폴백으로 안전.

### 신규 보안 이슈
- **0 건** — server 검증 = canManageTournament + IDOR 차단 + zod refine(validateDivisionSettings) 이중 가드. UI 는 보조. settings.group_size / group_count 범위 외 입력 시 422.

---

## 구현 기록 (developer) — FIBA Phase 15 풋터 Team B 아래 이동 (2026-05-12)

📝 구현 범위: 풋터 위치 = frame 가로 전체 → 좌측 col 안 Team B 아래 (FIBA PDF 정합). 풋터 내부 = 좌측 50% 폭 안 fit 압축 (labelWidth 140→100 / 심판진 가로 3컬럼→세로 3줄).

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (a) `<FooterSignatures>` 위치 = frame 가로 (grid 외부) → **좌측 col 안 Team B 아래 마지막 child** (FIBA PDF 정합 / 사용자 결재 §1). (b) Team B section 을 `<div className="fiba-divider-bottom">` 으로 래핑 (Team B / 풋터 사이 구분선). (c) frame 외부 영역 (MatchEndButton + 라인업 다시 선택) = 변경 0. Phase 15 코멘트 갱신. | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | (a) frameless=true 운영진 4명 (Scorer/Asst/Timer/Shot Clock) labelWidth **140 → 100** (좁은 50% 컬럼 안 fit). (b) frameless=true 심판진 (Referee/Umpire 1·2) grid-cols-3 가로 → **flex flex-col gap-0 세로 3줄** + labelWidth=100 (좁은 50% 안 underscore line 가독성). (c) frameless=true 주장 (Captain's signature in case of protest) labelWidth=100 추가 (시각 통일). (d) frameless=false (회귀) 변경 0. Phase 15 docstring 추가. | 수정 |

### 구조 변경 (핵심)

**Phase 14 (잘못된 위치)**:
```
<frame>
  <FibaHeader />
  <Grid 50:50>
    <Left col>
      <TeamSection A />
      <TeamSection B />
    </Left>
    <Right col>
      <RunningScoreGrid />
      <PeriodScoresSection />
    </Right>
  </Grid>
  <FooterSignatures />  ← frame 가로 펼침 (잘못 / 경기 종료 버튼과 겹침)
</frame>
<MatchEndButton />
```

**Phase 15 (FIBA PDF 정합)**:
```
<frame>
  <FibaHeader />
  <Grid 50:50>
    <Left col>
      <TeamSection A />
      <TeamSection B />
      <FooterSignatures />  ← 좌측 col 안 마지막 child (50% 폭)
    </Left>
    <Right col>
      <RunningScoreGrid />
      <PeriodScoresSection />
    </Right>
  </Grid>
</frame>
<MatchEndButton />  ← frame 외부 (변경 0)
```

### A4 fit 재검증
| 영역 | Phase 14 | Phase 15 |
|------|---------|----------|
| 좌측 Team A | ~370 | ~370 |
| 좌측 Team B | ~370 | ~370 |
| 좌측 풋터 (운영진 4 + 심판진 3 + 주장 1 = 8행 × 22px) | (frame 가로 = 좌:우 외부) | **~180** |
| **좌측 합** | ~740 | **~920** |
| 우측 Running Score | ~820 | ~820 |
| 우측 Period + Final | ~140 | ~140 |
| **우측 합** | ~960 | **~960** |
| max(좌, 우) + 헤더(~95) | 960+95+풋터(~80) = ~1135 | **max(920, 960) + 95 = 1055** |
| A4 (aspect 210:297 = 1121px) | 초과 위험 | **여유 ~66px ✓** |

→ 풋터가 좌측 안으로 이동하면서 우측이 자연스럽게 max → A4 1121px 안 fit 자동 보장. Phase 14 `aspect-ratio: 210/297` + `overflow:hidden` 이중 안전망 유지.

### 풋터 좌측 50% (~396px) 안 fit 매트릭스
| 영역 | 라벨 | underscore line |
|------|------|----------------|
| Scorer | 100px | ~280px |
| Assistant scorer | 100px (줄바꿈 2줄 가능) | ~280px |
| Timer | 100px | ~280px |
| Shot clock operator | 100px (줄바꿈 2줄 가능) | ~280px |
| Referee | 100px | ~280px |
| Umpire 1 | 100px | ~280px |
| Umpire 2 | 100px | ~280px |
| Captain's signature in case of protest | 100px (줄바꿈 5-6줄) | ~280px |

→ 라벨 100px = "Scorer/Timer" 등 짧은 라벨 단일 줄, "Assistant scorer/Shot clock operator" 2줄, "Captain's signature in case of protest" 5-6줄. underscore line 폭 ~280px = 가독성 OK.

### 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT_CODE=0 (출력 0줄) |
| `npx vitest run` 전체 | ✅ **605/605 PASS** (45 파일) |
| lucide-react import | ✅ 0건 (score-sheet/_components/ 전체) |
| 핑크 hex (ff*/fb*/hotpink/salmon/coral) | ✅ 0건 (footer-signatures.tsx + score-sheet-form.tsx) |
| schema 변경 | ✅ 0 |
| Flutter v1 영향 | ✅ 0 |
| BFF / service 변경 | ✅ 0 |
| AppNav frozen 영향 | ✅ 0 |
| 기능 변경 | ✅ 0 (레이아웃 only) |

### 💡 tester 참고
- **테스트 방법**: `/score-sheet/[matchId]` 진입 → 시각 검증 + A4 인쇄 미리보기
- **정상 동작**:
  1. **풋터 위치 (핵심)** — 풋터가 frame 가로 전체 펼침 X → **좌측 column 안 Team B 아래** 표시 (FIBA PDF 정합). 우측 column 은 Running Score + Period + Final 만 표시 (풋터 없음).
  2. **풋터 내용 8행 세로 누적** — Scorer / Assistant scorer / Timer / Shot clock operator (4행) + Referee / Umpire 1 / Umpire 2 (3행) + Captain's signature (1행). 모든 라벨 width 100px / underscore line 폭 ~280px.
  3. **라벨 줄바꿈** — "Assistant scorer" / "Shot clock operator" = 100px 안 2줄 줄바꿈. "Captain's signature in case of protest" = 5-6줄 줄바꿈. 운영 시 미입력 케이스 99%.
  4. **A4 1 페이지 fit** — 좌측 ~920 / 우측 ~960 / 헤더 95 + max(920, 960) = 1055px (A4 1121 안 ~66px 여유).
  5. **경기 종료 버튼** — frame 외부 하단 그대로. 풋터와 겹침 없음 (자동 해소).
  6. **"라인업 다시 선택" 버튼** — frame 외부 하단 그대로.
- **주의할 입력**:
  - 모바일 (md 미만) = grid 1 컬럼 → 풋터가 Team B 아래 (당연) → 우측이 다시 그 아래 → MatchEndButton. 세로 누적 흐름.
  - frameless=false (legacy 박스 모드) = 변경 0 (회귀 안전망).
  - 인쇄 미리보기 (Ctrl+P / PrintButton) = A4 1 페이지 fit 시각 검증 권장.

### ⚠️ reviewer 참고
- **풋터 위치 변경 = Phase 15 핵심** — score-sheet-form.tsx 의 grid 외부 → 좌측 col 안 마지막 child 로 이동. score-sheet-form.tsx 의 JSX 구조 단일 변경.
- **footer-signatures.tsx 압축**: labelWidth 140 → 100 + 심판진 가로→세로 = 좌측 50% 폭 안 fit. frameless=true 일 때만 적용 (회귀 안전).
- **심판진 가로→세로 결정**: FIBA PDF 정합은 가로 3컬럼이나, 좌측 50% (~396px) 안에서 컬럼당 ~130px = underscore line 가시성 ↓ → 세로 3줄로 변경 (실용 우선). 시각 검증 후 사용자 결재 시 가로로 회귀 가능.
- **Notes 영역** = frameless=true 시 숨김 (Phase 9 정책 유지). FIBA PDF 정합 + A4 fit 우선.
- **다음 단계**: 브라우저 시각 검증 (Team B 아래 풋터 + 경기 종료 버튼 frame 외부 + A4 1 페이지 fit).

### 신규 보안 이슈
- **0 건** — JSX 구조 / 디자인만 변경. API / 권한 / DB 변경 0.

---

## 구현 기록 (developer) — FIBA Phase 14 A4 정확 비율 + 재배치 (2026-05-12)

📝 구현 범위: A4 210×297mm aspect-ratio 강제 / Time-outs 3×2 / 풋터 세로 4줄 / 요소비율 통일

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(score-sheet)/_components/_print.css` | (a) `.score-sheet-fiba-frame` width 100% + max-width 210mm + **aspect-ratio: 210/297** + margin auto + overflow hidden (화면에서 A4 정확 비율 강제). (b) `@page margin 0` (이전 6mm → 0 / 박스가 종이 1:1). (c) 인쇄 시 `.score-sheet-fiba-frame` = width 210mm + height 297mm + aspect-ratio auto override (브라우저 호환). | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | Time-outs grid `grid-cols-2` → `grid-cols-3` (Phase 14 §1 / FIBA 표준 3×2 6칸). totalCells 5칸 → 6칸 (currentPeriod ≤ 4) / OT 진입 시 +1. cellLabel 인덱스 5 = "여유 (OT 진입 시 활성)" 안내 추가. OT 라벨 i-4 → i-5 (6번째 = 여유 / 7번째부터 OT1). 헤더 Phase 14 절 추가. | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | frameless=true 운영진 영역 `grid grid-cols-4 gap-x-1.5 gap-y-0` → `flex flex-col gap-0` (세로 4줄 / Phase 14 §2 / FIBA 정합 복원). 4 SigInput 모두 `compact` prop 제거 + `labelWidth={140}` 추가 (Shot Clock Operator 가장 긴 라벨 기준). SigInput 함수 시그너처에서 `compact` prop 완전 제거 (사용처 0). 헤더 Phase 14 절 추가. | 수정 |

### A4 정확 비율 박제 (핵심)
| 항목 | Phase 13 | Phase 14 |
|------|----------|----------|
| 화면 박스 비율 | 미정 (자동 컨텐츠 fit) | **aspect-ratio: 210/297 강제** (모든 viewport 정확 A4) |
| 화면 max-width | 컨텐츠 폭 | **210mm (A4 가로 정확)** |
| 인쇄 박스 | 198mm × 285mm (margin 6mm 안) | **210mm × 297mm (margin 0 / 1:1)** |
| @page margin | 6mm | **0** |
| overflow | hidden (인쇄만) | **hidden (화면+인쇄)** |

### Time-outs 3×2 동작
- grid-cols-3 × 2 row = 6 고정 칸 (FIBA 표준 = 전반 2 + 후반 3 + 여유 1)
- OT 진입 시 (currentPeriod ≥ 5): 7번째 칸부터 OT1, OT2, ... (3+3+2, 3+3+3 행)
- 박스 크기 18px 유지 / 빈 칸 클릭 → 마킹 X (Phase 11 룰 유지) / canAddTimeout 검증 (Article 18-19) 유지
- 마지막 마킹 칸 클릭 → 해제 (역호환)
- 6번째 칸 cellLabel = "여유 (OT 진입 시 활성)" — 사용자 인지 도움

### 풋터 운영진 세로 4줄
- Scorer / Assistant scorer / Timer / Shot clock operator = **세로 4줄 (flex flex-col)**
- labelWidth=140 = "Shot Clock Operator" 가장 긴 라벨 기준 정렬 통일
- SigInput compact prop 제거 (Phase 13 신규였으나 Phase 14 폐기)
- 라벨 10px / minHeight 22px / underscore 라인 유지

### 요소비율 통일 매트릭스
| 영역 | 박스 | 라벨 폰트 | 데이터 폰트 |
|------|------|----------|------------|
| Time-outs | 18px | 10px | 10px (X 글자) |
| Team Fouls | 12px | 9px (P1~P4 / Extra) | 8px (1·2·3·4) |
| Player Fouls | 18px | 10px | 9px (P/T/U/D) |
| Player P IN | 18px | 10px | - |
| 풋터 라벨 | - | **10px** (Phase 14 통일) | 12px (input text-xs) |

→ FIBA PDF 정합 박스 12px (Team Fouls 만 / 가독성 위해 작게) + 일반 영역 18px 통일.

### A4 fit 재검증
| 영역 | Phase 13 | Phase 14 | 차이 |
|------|---------|---------|------|
| Time-outs | 2 컬럼 동적 (~3 행) | **3 컬럼 × 2 행 고정 (~38px)** | 가로 폭 증가 |
| 풋터 운영진 | 22px (가로 1줄) | **88px (세로 4줄 × 22)** | +66 |
| 풋터 총합 | ~74 | **~140** | +66 |
| 좌측 추정 | ~857 | **~923** | +66 |
| A4 fit 강제 | ❌ aspect-ratio 미정 | **✅ aspect-ratio: 210/297** | 핵심 |

→ A4 정확 비율 강제로 fit 자동 보장. 추정 px 합산이 1123 초과해도 overflow:hidden 으로 안전.

### 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT_CODE=0 (출력 0줄) |
| `npx vitest run` 전체 | ✅ **605/605 PASS** (45 파일) |
| `vitest team-section-fill-rows` | ✅ 8/8 PASS (Players 12행 회귀 0) |
| `vitest timeout-helpers` | ✅ 30/30 PASS (마킹 로직 변경 0 / 시각 칸 수만 변경) |
| `vitest signature-types` | ✅ 10/10 PASS (풋터 타입 변경 0) |
| lucide-react import | ✅ 0건 |
| 핑크 hex | ✅ 0건 (흰색 #ffffff 만) |
| schema 변경 | ✅ 0 |
| Flutter v1 영향 | ✅ 0 |
| BFF / service 변경 | ✅ 0 |
| AppNav frozen 영향 | ✅ 0 |

### 💡 tester 참고
- **테스트 방법**: `/score-sheet/[matchId]` 진입 → 시각 검증 + A4 인쇄 미리보기
- **정상 동작**:
  1. **A4 정확 비율** — 박스가 정확한 A4 portrait 비율 (210:297 = 0.707) 으로 화면 표시. 어떤 viewport (모바일/태블릿/PC) 에서도 비율 동일.
  2. **Time-outs 3×2** — 6 고정 칸 (3 컬럼 × 2 행). 4쿼터 시 5칸까지 채울 수 있고 6번째는 "여유" (cursor: default). OT 진입 시 7~8번째 칸 자동 생성 (3 컬럼 grid 에서 다음 행).
  3. **풋터 운영진 세로 4줄** — Scorer / Assistant scorer / Timer / Shot clock operator 가 세로 4줄로 표시. 라벨 우측 정렬 (140px width 고정) / underscore 라인 우측 input.
  4. **인쇄 미리보기** — Ctrl+P / 사이드바 PrintButton 으로 미리보기 → A4 1 페이지에 정확 fit (margin 0 / 박스 = 종이 1:1).
- **주의할 입력**:
  - OT 진입 시 Time-outs 칸 = 7칸 (3+3+1) / 8칸 (3+3+2). 마지막 칸은 OT 타임아웃 마킹 가능
  - 13명+ 명단은 Players 12행 잘림 (운영 안정성 - Phase 12 정책 유지)
  - 풋터 운영진 세로 4줄 = ~88px / 심판 1줄 + 주장 1줄 = ~22+22 / 풋터 총 ~140px (A4 안 fit)
  - aspect-ratio 가 적용 안 되는 구형 브라우저 = 화면에서는 컨텐츠 폭에 맞춰 늘어남 (인쇄는 mm 단위 정확)

### ⚠️ reviewer 참고
- **A4 정확 비율 = Phase 14 핵심**: `aspect-ratio: 210 / 297` CSS = 모든 모던 브라우저 지원 (Chrome 88+, Firefox 89+, Safari 15+). 구형 브라우저 fallback 은 max-width: 210mm 만 적용.
- **@page margin 0 변경**: 이전 6mm 마진 → Phase 14 = 박스 자체가 210×297mm 정확 fit. 일부 프린터 = 무여백 인쇄 불가 → 박스 외곽 1px 검정 라인이 잘릴 가능성 있음. 운영자가 인쇄 설정에서 "프린터 기본 여백 사용" 선택 시 자동 보정.
- **Time-outs 6 고정 vs 사용자 결재 §1 (3×2)**: 사용자 명시 "3 컬럼 × 2 행 = 6칸 고정" = 그대로 박제. OT 진입 시 7~8 칸은 grid-cols-3 의 자동 행 확장 (브라우저가 다음 행 생성).
- **풋터 운영진 세로 4줄 = Phase 13 회귀 결재**: Phase 13 가로 1줄 = 사용자가 명시적으로 폐기 (이미지 33). FIBA 정합 복원.
- **요소비율 통일**: Team Fouls 박스 12px = 가독성 위해 작게 유지 (Phase 13 결재 / 본 PR 변경 0). Time-outs / Player Fouls / P IN 모두 18px 통일.
- **다음 단계**: 브라우저 시각 검증 + 인쇄 미리보기로 A4 1 페이지 정합 + 6칸 3×2 + 세로 4줄 풋터 확인.

### 신규 보안 이슈
- **0 건** — CSS / 레이아웃 only / 기능 영향 0. API / 권한 / DB 변경 0.

---

## 구현 기록 (developer) — Phase E 단체 lifecycle (Q1 보존 = archived) (2026-05-12)

### 📝 구현한 기능

**E-1. `requireOrganizationOwner` 권한 헬퍼 신규**
- `OrganizationPermissionError` (404/403) — series-permission `SeriesPermissionError` 와 동일 패턴
- 통과 조건: super_admin 우회 (옵션) OR `organization_members.role='owner' && is_active=true`
- admin/member 차단 — Phase E 정책 (단체 lifecycle = owner 만의 결정)

**E-2. 단체 archive/복구 API + UI**
- `POST /api/web/organizations/[id]/archive` = status='archived' (시리즈/대회 변경 0)
- `DELETE /api/web/organizations/[id]/archive` = 복구 (status='approved')
- `ArchiveOrganizationButton` confirm 모달 + redirect/refresh 분기

**E-3. archived 단체 표시 정책**
- 운영자 페이지: 헤더 "보관됨" 회색 뱃지 + owner 만 복구 버튼
- 단체 목록: active vs archived 분리 (회색 톤 + opacity-70 + grayscale 로고)
- 공개 페이지: archived 진입 시 "보관된 단체입니다" 안내 페이지 (events/teams/members 탭 차단)
- generateMetadata = archived title 변경 + 검색 노출 최소화

### 변경 파일

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/auth/org-permission.ts` | `requireOrganizationOwner()` + `OrganizationPermissionError` class 추가 (re-export `SuperAdminSession`) | 수정 |
| `src/app/api/web/organizations/[id]/archive/route.ts` | POST archive / DELETE 복구 + adminLog warning | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/_components/ArchiveOrganizationButton.tsx` | confirm 모달 + POST/DELETE + redirect/refresh 분기 | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/page.tsx` | isOwner 가드 + Archive 버튼 통합 + "보관됨" 헤더 뱃지 | 수정 |
| `src/app/(admin)/tournament-admin/organizations/page.tsx` | active vs archived 분리 표시 (회색 톤 + 별 섹션) | 수정 |
| `src/app/(web)/organizations/[slug]/page.tsx` | archived 안내 페이지 분기 + generateMetadata 보호 | 수정 |
| `src/__tests__/lib/auth/requireOrganizationOwner.test.ts` | 권한 매트릭스 10 케이스 (단체없음/super_admin 2종/owner/admin/member/외부인/비활성/allowSuperAdmin=false/archived 단체 owner) | 신규 |

### 검증 결과

| 검증 항목 | 결과 |
|----------|------|
| tsc --noEmit | ✅ 0 에러 |
| vitest requireOrganizationOwner | ✅ 10/10 PASS |
| vitest 전체 | ✅ 601/605 PASS (실패 4건 = 별 PR score-sheet team-section-fill-rows / 본 PR 무관) |
| Flutter v1 영향 | ✅ 0 (api/v1/ organization 호출처 0건) |
| schema 변경 | ✅ 0 (status 가 String 필드 — 'archived' 값 그대로 박제) |
| 디자인 13 룰 | ✅ var(--color-*) 100% / Material Symbols / 빨강 본문 0 / warning 톤 / 44px+ |
| 보안 가드 | ✅ owner only (admin/member 차단) — 서버 헬퍼 + UI 가드 이중 |

### 💡 tester 참고

**테스트 방법**:
1. **owner 케이스**:
   - 단체 owner 로 로그인 → `/tournament-admin/organizations/[orgId]` 진입
   - 운영자 메뉴 하단 "단체 보관" 버튼 표시 (회색 톤 + warning hover)
   - 클릭 → confirm 다이얼로그 (시리즈/대회 보존 안내) → "보관"
   - → 단체 목록으로 redirect → "보관된 단체" 섹션에 회색 톤으로 표시
   - 다시 진입 → "보관됨" 뱃지 표시 + "단체 복구" 버튼 (info 톤) → 복구 → active 복귀
2. **admin/member 차단**:
   - admin 으로 로그인 → owner 메뉴 (Archive 버튼) 노출 X
   - 직접 API curl POST → 403 응답
3. **공개 페이지 안내**:
   - archived 단체의 `/organizations/[slug]` 직접 접근 → "보관된 단체입니다" 안내 페이지 (탭 차단)
4. **복구 시나리오**:
   - owner 가 archived 단체 진입 → "단체 복구" → status='approved' 복귀

**정상 동작**:
- archive/복구 시 시리즈/대회 row 변경 0 검증 (Q1 보존 정책)
- archived 단체는 공개 페이지에서 안내만 (events 탭 빈 표시 X — 페이지 자체 분기)
- super_admin 우회 가능 (운영 사고 긴급 fix)
- admin_logs 에 warning 등급으로 archive/restore 박제

**주의할 입력**:
- 이미 archived 단체에 POST → 409 (멱등 X — confirm 화면 다시 표시)
- 복구 시 archived 가 아니면 → 409
- owner 가 본인 멤버십 is_active=false 면 → 403

### ⚠️ reviewer 참고

- **owner only 정책 = Phase E 핵심** — admin 통과 시 권한 누수 (admin 이 임의로 단체 lifecycle 결정 가능) → vitest 5,9 케이스로 회귀 가드
- **super_admin 우회** = `allowSuperAdmin=true` (기본) — 운영 사고 긴급 fix 여지. 필요 시 route 에서 명시적으로 false 설정 가능
- **status 복구 시 항상 'approved'** — pending 등 단계 복귀는 별 PR (Phase F 후속)
- **schema 변경 0** = status 가 String 필드 — enum 이었으면 결재 필요 (확인 완료)
- **Q1 보존 정책 = decisions.md 박제** — 향후 "단체 삭제" 의뢰 시 본 결정 재참조

### 신규 보안 이슈 발견
- **0 건** — 권한 검증 owner only 서버 가드 + UI 가드 이중. admin/member 모두 403. archived 후 시리즈/대회 자체 영향 0 (보존 정책으로 권한 누수 0).

---

## 구현 기록 (developer) — Phase D 단체↔시리즈 셀프서비스 + Q3 권한 (2026-05-12)

### 📝 구현한 기능

**D-1. 단체 페이지 시리즈 카드 ⋮ 메뉴 (분리 / 이동)**
- 단체 owner/admin 이 본인 단체 시리즈 카드에서 직접 분리/이동 가능
- 분리: organization_id=null PATCH (Phase C 재사용) — confirm "단체에서 사라짐" 안내
- 이동: 본인 owner/admin 단체 목록에서 radio 선택 → confirm → organization_id=새 ID PATCH

**D-2 (Q3). canManageTournament 회귀 가드**
- ⚠️ Q3 자동 부여 분기는 이미 구현되어 있었음 (canManageTournament line 70-84, 이미지 34 사용자 요청 시 추가).
- 본 PR 은 회귀 vitest 9 케이스 신규 추가 — 권한 누수 0 보장.

### 변경 파일

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/organizations/[orgId]/_components/SeriesActionsMenu.tsx` | ⋮ dropdown (분리/이동) + 분리 confirm + 외부 클릭 닫기 + ESC 닫기 | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/_components/MoveSeriesModal.tsx` | 본인 owner/admin 단체 목록 radio + confirm + 이동 PATCH | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/page.tsx` | 시리즈 카드에 SeriesActionsMenu 통합 (isAdmin 가드) | 수정 |
| `src/__tests__/lib/auth/canManageTournament.test.ts` | Q3 권한 매트릭스 9 케이스 (organizer / TAM / 단체 owner / admin / member / series_id NULL / super_admin 분기) | 신규 |

### 검증 결과

| 검증 항목 | 결과 |
|----------|------|
| tsc --noEmit | ✅ 0 에러 |
| vitest 전체 | ✅ 595/595 PASS (584 → +11) |
| Flutter v1 영향 | ✅ 0 (api/v1/ canManageTournament 호출처 0건) |
| schema 변경 | ✅ 0 |
| 디자인 13 룰 | ✅ var(--color-*) 100% / Material Symbols / 핑크 0 / 빨강 본문 0 / 44px+ |
| API 신규 | ✅ 0 (Phase C PATCH /api/web/series/[id] + 기존 GET /api/web/organizations 재사용) |

### 💡 tester 참고

**테스트 방법**:
1. 단체 owner/admin 으로 로그인 → `/tournament-admin/organizations/[orgId]` 진입
2. 소속 시리즈 카드 우측 ⋮ 클릭 → dropdown 표시 확인
3. **분리 시나리오**:
   - "단체에서 분리" → confirm 다이얼로그 → "분리" → 시리즈 사라짐 (events 탭 영향)
   - 단체 카드의 시리즈 카운터 -1 즉시 반영
4. **이동 시나리오**:
   - 운영자가 본인 owner/admin 인 다른 단체가 있어야 목록 노출. 없으면 빈 안내.
   - radio 선택 → "이동" → confirm → 시리즈가 새 단체에서 보임 (현 단체 events 사라짐)
   - 양쪽 단체 series_count 동기화 ($transaction)
5. **권한 회귀 (Q3)**:
   - 단체 admin 으로 로그인 → 단체 시리즈 소속 대회의 wizard/PATCH/DELETE 진입 가능 확인
   - 단체 member (role=member) 는 차단 (403) 확인

**정상 동작**:
- ⋮ 메뉴는 isAdmin (owner/admin) 만 노출 — member 는 보이지 않음
- 분리/이동 confirm 다이얼로그에서 단체명 명시 (사용자 결정 가시성 ↑)
- 결과 메시지 1.5초 후 자동 refresh
- 외부 클릭 / ESC 로 dropdown 닫힘

**주의할 입력**:
- 단체 owner 가 본인 단체 1개만 보유 → MoveModal 빈 목록 안내
- 시리즈가 organization_id=null (단독 시리즈) → 단체 페이지에서 보이지 않으므로 본 메뉴 노출 X
- PATCH 422 (이미 분리됨 / 같은 단체로 이동 시도) → 에러 메시지 inline 표시

### ⚠️ reviewer 참고

- **권한 헬퍼 회귀** = 가장 위험 — vitest 9 케이스로 권한 누수 가드. 추가 케이스 (예: super_admin + 단체 미가입 시도) 권장 시 알려주세요.
- **MoveModal 가시성** = 본인 owner/admin 단체 목록을 클라이언트에서 필터링. 서버에서도 PATCH 시 isOrganizationEditor 재검증 (Phase C series-permission.ts) — 이중 안전망.
- **organizations/my** API 별도 신설 X — 기존 GET /api/web/organizations 가 myRole 포함하므로 재사용. 추후 owner/admin 만 필요한 케이스 늘면 별도 API 분리 검토.
- **빨강 본문 0** 룰 — admin 페이지 룰 준수 위해 분리/이동 버튼 모두 btn--primary 토큰 사용 (직접 빨강 색상 hardcode X)

### 신규 보안 이슈 발견
- **0 건** — 권한 검증 PATCH/DELETE 모두 server side 에서 requireSeriesEditor + isOrganizationEditor 이중 가드 (Phase C 구현). UI 는 보조 가드일 뿐.

---

## 구현 기록 (developer) — FIBA Phase 13 UI 겹침 fix + 압축 (2026-05-12)

### 📝 구현 범위
TIME-OUTS 2 컬럼 grid (가로 6칸 → 2×N) / Team Fouls 박스 12px + 라벨 압축 (P2/2FT 겹침 fix) / 체크박스 P IN + FOULS 1-5 = 24→18px / Players 행 20→18px / 푸터 운영진 4명 가로 1줄 (4 컬럼 grid). 사용자 직접 결재 (이미지 30-31 분석).

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | (a) TIME-OUTS `flex flex-wrap gap-1` → `grid grid-cols-2 gap-px` (가로 6칸 → 2×N 동적 행). 박스 h-6 w-6 → h-[18px] w-[18px]. (b) Team Fouls 박스 h-5 w-5 → h-[12px] w-[12px] / 글자 9px → 8px / 라벨 w-8 → w-7 (9px) / 페어 gap-2 → gap-1 / 내부 gap-1 → gap-px / FT 안내 ml-1 → ml-0.5 + 글자 8px (P2 라벨/2FT 겹침 fix). Extra 행도 동일 압축. (c) P IN 체크박스 label h-5 w-5 → h-[18px] w-[18px] / input h-4 w-4 → h-[14px] w-[14px]. (d) FOULS 1-5 박스 h-5 w-5 → h-[18px] w-[18px]. (e) Players 행 (thead/실row/빈row) height 20 → 18. | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | frameless=true 운영진 4명 `flex flex-col gap-0` (세로 4줄) → `grid grid-cols-4 gap-x-1.5 gap-y-0` (가로 1줄). SigInput에 `compact` prop 신규 — 라벨 10px → 9px / minHeight 26 → 22 / labelWidth 자동 (좁은 컬럼 fit). 심판진/주장 변경 0. | 수정 |

### A4 fit 재검증
| 영역 | Phase 12 | Phase 13 | 차이 |
|------|---------|---------|------|
| Players 본문 | 12 × 20 = 240px | **12 × 18 = 216px** | -24 |
| thead | 20 | **18** | -2 |
| Team A 합 | ~370 | **~344** | -26 |
| Team A+B | ~740 | **~688** | -52 |
| 풋터 운영진 | 4 × 26 = 104 | **1 × 22 = 22** | -82 |
| 풋터 총합 | ~156 | **~74** | -82 |
| **좌측 총합** | ~991 | **~857** | **A4 1123 여유 ~266px** ✅ |

→ 사용자 명시 ~931px / 여유 ~192px 목표 대비 **추가 -74px 절약** (운영진 4명 세로→가로 변경 효과 큼).

### 4 issue fix 매트릭스
| # | 사용자 보고 | Phase 13 fix | 검증 |
|---|------------|--------------|------|
| §1 | TIME-OUTS 가로 6칸 너무 김 | grid-cols-2 (2×3) / 18px 박스 | 이미지 30 영역 좁아짐 ✓ |
| §2 | P2 라벨 + 2FT 안내가 P1 위 겹침 | 박스 12px + 글자 8px + 라벨 w-7 + gap 압축 | 박스 폭 -8px / FT 안내 ml 0.5 ✓ |
| §3 | 체크박스 크기 | P IN + FOULS 1-5 모두 18px | 시각 일관 ✓ |
| §4 | Players 행 압축 | 행 20→18px (12×18=216) | -24px ✓ |
| §5 | 푸터 서명란 재배치 | Scorer/Asst/Timer/Shot Clock 가로 1줄 4컬럼 | -82px / 가장 큰 절약 ✓ |

### 검증
| 항목 | 결과 |
|------|------|
| tsc --noEmit | ✅ EXIT_CODE=0 (출력 0줄) |
| vitest 전체 | ✅ 605/605 PASS |
| vitest team-section-fill-rows | ✅ 8/8 PASS (행 높이 변경은 함수 로직 불변 / 회귀 0) |
| lucide-react import | 0건 (코멘트 룰 명시만 2건) |
| 핑크 hex | 0건 |
| schema 변경 | 0 |
| Flutter v1 영향 | 0 |
| BFF/service 변경 | 0 |
| AppNav frozen 영향 | 0 |
| Phase 3 Player Fouls 기능 유지 | ✅ (P/T/U/D + Article 41) |
| Phase 4 Time-outs 마킹 동작 유지 | ✅ (canAddTimeout / 마지막 해제 분기 / OT 동적 칸) |
| FIBA 한줄 묶음 (Team Fouls) | ✅ (Period 1·2 / 3·4 / Extra 3줄 유지) |
| FIBA 정합 (Referee/Umpire/Captain 세로) | ✅ 변경 0 |

### 💡 tester 참고
- **테스트 방법**: `/score-sheet/[matchId]` 진입 → Team A / Team B / 풋터 영역 시각 검증 + A4 인쇄 미리보기
- **정상 동작**:
  1. TIME-OUTS — **2 컬럼 × 3 행** (5칸 기본 + 마지막 좌측만). currentPeriod >= 5 시 칸 추가 (6/7/8칸 → 3·4·4 행)
  2. Team Fouls — P1/P2 한 줄 / P3/P4 한 줄 / Extra 한 줄 (3줄 유지). 박스 12px / 라벨 9px / 5+ 시 자유투 안내 (FT +N) 박스 옆 겹침 없이 표시
  3. 체크박스 — P IN + FOULS 1-5 모두 **18px** 정사각. 글자 (P/T/U/D) 10px 그대로 가독성 OK
  4. Players — **12행 × 18px = 216px**. 빈 명단 placeholder 도 18px 유지
  5. 풋터 — Scorer / Assistant scorer / Timer / Shot clock operator 가 **가로 1줄**. 각 컬럼 25% 폭 + 라벨 9px + underscore input
  6. Referee / Umpire 1 / Umpire 2 / Captain = 변경 없음 (세로 그대로)
  7. A4 1 페이지 fit — 여유 ~266px 확보
- **주의할 입력**:
  - OT 진입 시 TIME-OUTS 칸 추가 (6칸 = 2×3 / 7칸 = 2×4 (마지막 좌측만) / 8칸 = 2×4)
  - 13명+ 명단 (12 초과) → 12행 자르지 않고 그대로 표시 (운영 안정성)
  - 좁은 컬럼에서 "Assistant scorer" / "Shot clock operator" 라벨이 길어 컬럼 폭에 따라 줄바꿈 가능 (라벨 9px + tracking-tight 로 최대한 압축)

### ⚠️ reviewer 참고
- **A4 fit 여유 확대**: Phase 12 ~132px → Phase 13 ~266px (운영진 가로 1줄 -82px 가 가장 큰 절약). 인쇄 시 충분한 여백.
- **FIBA 정합 vs 공간 절약 트레이드오프**: 풋터 운영진 가로 1줄 = FIBA 종이기록지(세로 4줄)와 다름. 사용자 결재로 공간 절약 우선 선택. Referee/Umpire/Captain 은 FIBA 정합 유지 (세로).
- **체크박스 input h-[14px] w-[14px]**: 일부 브라우저에서 기본 checkbox 외형이 14px → 더 작게 보일 수 있음. label 박스 18px 안에 중앙 정렬 + touchAction manipulation 유지로 터치 보장.
- **다음 단계**: 시각 검증 (브라우저 /score-sheet/[matchId] 진입 → A4 인쇄 미리보기 1 페이지 fit 재확인 → 이미지 30-31 4 issue 해소 확인).

### 신규 보안 이슈
- **0 건** — 디자인 / 박스 크기 / 레이아웃만 변경. API/권한/DB 0.

---

## 구현 기록 (developer) — FIBA Phase 12 12행 + Team Fouls 3줄 (2026-05-12)

### 📝 구현 범위
Players 16→12행 + Team Fouls 5줄→3줄 (Period ①·② / ③·④ / Extra) + 세로 압축. 사용자 직접 결재 (이미지 29 분석) — FIBA Article 4.2.2 실 운영 max 12명 / FIBA PDF 정합.

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | (a) fillRowsTo16 → fillRowsTo12 (TARGET=12 / FIBA Article 4.2.2). (b) fillRowsTo16/15 deprecated alias → fillRowsTo12 위임 (회귀 안전망). (c) Team Fouls 레이아웃 5줄 → 3줄 — [1,2 페어] / [3,4 페어] / Extra. 페어 가로 배치 (flex-1 / w-8 "P{n}" 라벨 축약). (d) Players/thead/빈row 코멘트 갱신. | 수정 |
| `src/__tests__/score-sheet/team-section-fill-rows.test.ts` | 16 → 12 회귀 가드 갱신. fillRowsTo12 메인 4 케이스 + fillRowsTo16/15 deprecated alias 4 케이스 = 8 PASS. | 수정 |

### A4 fit 재검증
| 영역 | Phase 11 | Phase 12 | 차이 |
|------|---------|---------|------|
| Players | 16 × 20 = 320px | **12 × 20 = 240px** | -80 |
| Team Fouls | 5 줄 × ~12px = 60px | **3 줄 × ~12px = 36px** | -24 |
| Team A 합 | ~474 | **~370px** | -104 |
| Team A+B | ~948 | **~740px** | -208 |
| 헤더 | ~95 | ~95 | 0 |
| 풋터 | ~156 | ~156 | 0 |
| **좌측 총합** | ~1011 | **~991px** | A4 1123 여유 ~132px ✅ |

### Team Fouls 3줄 구조 (FIBA PDF 정합)
```
P1 [1][2][3][4]   P2 [1][2][3][4]   ← 줄 1 (Period 1+2)
P3 [1][2][3][4]   P4 [1][2][3][4]   ← 줄 2 (Period 3+4)
Extra [1][2][3][4]                   ← 줄 3
```

### 검증
| 항목 | 결과 |
|------|------|
| tsc --noEmit | ✅ EXIT_CODE=0 |
| vitest 전체 | ✅ 605/605 PASS |
| vitest team-section-fill-rows | ✅ 8/8 PASS (16→12 회귀 가드 + alias 호환) |
| lucide-react import | 0건 (코멘트 룰 명시만 1건) |
| 핑크 hex | 0건 |
| fillRowsTo16/15 호출 | 0건 (alias 정의만 유지 = 회귀 안전망) |
| schema 변경 | 0 |
| Flutter v1 영향 | 0 |
| BFF/service 변경 | 0 |
| AppNav frozen 영향 | 0 |
| Phase 3 Player Fouls 기능 유지 | ✅ (P/T/U/D + Article 41) |
| Phase 3 Team Fouls 자동 합산 유지 | ✅ (getTeamFoulCountByPeriod) |

### 💡 tester 참고
- **테스트 방법**: `/score-sheet/[matchId]` 진입 → Team A / Team B 영역 시각 검증
- **정상 동작**:
  1. Players 표가 **12행** (이전 16행에서 -4행). 빈 명단이어도 12행 placeholder
  2. Team Fouls 영역이 **3줄** — P1·P2 한 줄 / P3·P4 한 줄 / Extra 한 줄
  3. A4 1 페이지 fit (좌측 ~991px / 여유 ~132px)
  4. Period ①~④ 마킹 자동 합산 / 5+ 시 자유투 안내 (FT (+N)) 유지
  5. Player Fouls P/T/U/D + Article 41 퇴장 분기 정상
- **주의할 입력**:
  - 13명 이상 명단 (12 초과) → 12행 자르지 않고 그대로 표시 (운영 안정성)
  - OT 진입 시 (currentPeriod >= 5) Time-outs OT 1칸 동적 추가 — Phase 11 동작 유지
  - 페어 박스 폭이 좁아져 5+ 자유투 안내(FT +N)가 줄바꿈될 수 있음 — 페어 컨테이너 flex-1로 적응

### ⚠️ reviewer 참고
- **회귀 안전망**: fillRowsTo16/15 deprecated alias가 fillRowsTo12로 위임 — 외부 호출자 0건 확인했지만 vitest로 가드.
- **Team Fouls 페어 폭**: 좁아진 페어 안에서 5+ FT 안내가 다음 줄로 떨어질 수 있음. flex / min-w-0 / shrink-0 결합으로 적응형 처리.
- **라벨 축약**: "Period 1" → "P1" (w-12 → w-8) — 페어 가로 fit 위한 결정. FIBA PDF는 ①·②·③·④ 원숫자나 텍스트 인쇄 호환성 위해 P1~P4 표기.
- **다음 단계**: 시각 검증 (브라우저 /score-sheet/[matchId] 진입 → A4 인쇄 미리보기로 1 페이지 fit 확인).

### 신규 보안 이슈
- **0 건** — 디자인 + 행 수만 변경. API/권한/DB 0.

---

## 구현 기록 (developer) — FIBA Phase 17 쿼터별 색상 + Legend (2026-05-13)

📝 구현 범위: 5색 매핑 헬퍼 신규 / Running Score 마킹 Q별 글자색 / Player Fouls 하이브리드 (글자=Q / 배경=종류) / Team Fouls 박스 채움 Q별 / Time-outs phase 별 색 / Legend (frame 외부 / no-print).

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/score-sheet/period-color.ts` | (a) `getPeriodColor(period)` — Q1=text-primary / Q2=accent / Q3=success / Q4=warning / OT(5+)=primary 단일 source. (b) `getPeriodLabel(period)` — "Q1"~"Q4" / "OT1"+. (c) `getTimeoutPhaseColor(period)` — 전반 text-primary / 후반 success / OT primary (사용자 결재 §5). (d) `PERIOD_LEGEND` 상수 — 5건 한글 라벨 (Q1·Q2·Q3·Q4·OT). 4 함수 + 1 상수 단일 source. | **신규** |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/running-score-grid.tsx` | RunningScoreCell 마킹 칸 글리프 (●/◉/◎) + 등번호 글자 색 = 하드코딩 `var(--color-accent)` → 동적 `getPeriodColor(mark.period)` 적용. 배경 (last/normal) = 그대로 (시각 무결). | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | (a) import `getPeriodColor` + `getTimeoutPhaseColor` 추가. (b) `FOUL_TYPE_BG_COLOR` 신규 (P=투명/T=warning15%/U=info15%/D=primary15% — 빨강 회피 + 옅은 톤). (c) Player Fouls 칸 = 글자 `getPeriodColor(mark.period)` (Q별) + 배경 `FOUL_TYPE_BG_COLOR[type]` (종류별) — 사용자 결재 §3 하이브리드. (d) Team Fouls 페어 [1,2]/[3,4] 박스 채움 = `getPeriodColor(period)` (각 Period 별 색). Extra (OT) = `getPeriodColor(5)` (primary). (e) Time-outs X 마킹 색 = `getTimeoutPhaseColor(timeouts[i].period)` (filled 시 phase 별 색 동적). aria-label 강화 (Q{period} 정보 추가). | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/period-color-legend.tsx` | Legend 컴포넌트 — `PERIOD_LEGEND.map` 으로 5건 (Q1·Q2·Q3·Q4·OT) 색 원(W=H 50%) + 한글 라벨 가로 배치. `no-print` 클래스 (인쇄 시 _print.css `.no-print { display:none }` 자동 제외). max-w-[820px] mx-auto + surface 배경 + border. | **신규** |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (a) `PeriodColorLegend` import. (b) `<PeriodColorLegend />` 위치 = frame 외부 (`</div>` frame 닫힘 직후) + MatchEndButton 위 — 사용자 결재 §6·§7. | 수정 |
| `src/__tests__/score-sheet/period-color.test.ts` | 23 케이스 신규 — getPeriodColor (Q1~Q4 + OT1~3 + 경계 0) / getPeriodLabel (Q1~Q4 + OT1~3) / getTimeoutPhaseColor (전반 2 + 후반 2 + OT 2) / PERIOD_LEGEND (5건 정합 + getPeriodColor 정합 cross-check). | **신규** |

### 5 영역별 색 적용 매트릭스
| 영역 | 이전 | Phase 17 | 적용 위치 |
|------|------|---------|----------|
| Running Score 글리프 + 등번호 | `var(--color-accent)` 단색 | `getPeriodColor(mark.period)` 동적 | running-score-grid.tsx RunningScoreCell |
| Player Fouls 글자 (P/T/U/D) | `FOUL_TYPE_COLOR[type]` (종류 색) | `getPeriodColor(mark.period)` (Q별) | team-section.tsx Fouls 1-5 |
| Player Fouls 배경 | `color-mix(typeColor 18%)` | `FOUL_TYPE_BG_COLOR[type]` (옅은 톤 P/T/U/D) | team-section.tsx Fouls 1-5 |
| Team Fouls 페어 박스 채움 | `var(--color-text-primary)` 단색 | `getPeriodColor(period)` 동적 | team-section.tsx Team fouls |
| Team Fouls Extra 박스 채움 | `var(--color-text-primary)` | `getPeriodColor(5)` = primary | team-section.tsx Team fouls |
| Time-outs X 마킹 | `var(--color-text-primary)` 단색 | `getTimeoutPhaseColor(timeouts[i].period)` 동적 | team-section.tsx Time-outs |

### 색 매핑 검증 (사용자 결재 §1)
| Period | Color Token | 시각 |
|--------|-------------|------|
| Q1 (1) | `var(--color-text-primary)` | 흑/백 (기본) |
| Q2 (2) | `var(--color-accent)` | BDR Red 강조 |
| Q3 (3) | `var(--color-success)` | 초록 #1CA05E |
| Q4 (4) | `var(--color-warning)` | 오렌지 #E8A33B |
| OT (5+) | `var(--color-primary)` | BDR Red (OT 통합) |

### Legend 동작
- 위치: frame 외부 / score-sheet-form.tsx return main 안 / MatchEndButton 위.
- `no-print` 클래스 = 인쇄 시 `.no-print { display:none }` 자동 적용 (인쇄 양식 = FIBA 단색 정합 유지).
- 5건 가로 배치 (Q1·Q2·Q3·Q4·OT) — 색 원 W=H 10px (border-radius 50% — 정사각 룰 §10) + 한글 라벨 11px.
- 반응형 `flex-wrap` — 좁은 화면에서 자동 다음 줄.

### 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT_CODE=0 (출력 0줄) |
| `npx vitest run` 전체 | ✅ **662/662 PASS** (639 → +23 신규 / 회귀 0건) |
| `npx vitest run period-color.test.ts` | ✅ 23/23 PASS (getPeriodColor 8 + getPeriodLabel 7 + getTimeoutPhaseColor 6 + PERIOD_LEGEND 5 + cross-check 1) |
| Flutter v1 영향 | ✅ 0 (`api/v1/` 변경 0건 / UI 만) |
| schema 변경 | ✅ 0 (lib + UI 만) |
| AppNav frozen | ✅ 영향 0 |
| BFF / service | ✅ 변경 0 |
| 디자인 13 룰 | ✅ var(--color-*) 100% / Material Symbols / lucide ❌ 0건 |
| 핑크/살몬/코랄 | ✅ 0건 |
| 빨강 본문 텍스트 | ✅ 0 (Q2=accent / OT=primary 빨강은 강조 마킹 / 본문 텍스트 X — Phase 3.5 결재 동일) |
| placeholder 5단어 | ✅ 신규 추가 0건 |
| A4 1 페이지 fit | ✅ 유지 (Legend = frame 외부 + no-print / A4 영향 0) |
| FIBA PDF 정합 | ✅ Phase 14~15 정합 유지 (인쇄 시 Legend 자동 제외) |

### 💡 tester 참고
- **테스트 방법**: `/score-sheet/{matchId}` 진입 (운영자 / 기록원 권한자 / paper mode)
- **정상 동작**:
  1. **Running Score 마킹** — Q1 시 검정/흰 / Q2 시 빨강 / Q3 시 초록 / Q4 시 오렌지 / OT 시 빨강. 등번호 색도 동일.
  2. **Player Fouls 마킹** — Fouls 1-5 칸 = 글자 (P/T/U/D) 색은 마킹 시점의 Q색 / 배경은 종류 옅은 톤 (P=투명, T=노랑 옅게, U=하늘 옅게, D=빨강 옅게). 2D 정보 동시 표현.
  3. **Team Fouls 박스** — Period ① 박스 4칸 = 검정 채움 / ② = 빨강 / ③ = 초록 / ④ = 오렌지 / Extra = 빨강.
  4. **Time-outs X 마킹** — 전반 Q1/Q2 시 검정 X / 후반 Q3/Q4 시 초록 X / OT 시 빨강 X.
  5. **Legend** — frame 박스 아래 "색상 안내: ● Q1 ● Q2 ● Q3 ● Q4 ● OT" 가로 배치. 색 원 + 한글 라벨.
  6. **인쇄 시** — Ctrl+P / 인쇄 미리보기 → Legend 자동 제거 (FIBA 양식 정합 유지). A4 1 페이지 fit 변동 0.
- **주의할 입력**:
  - Q2 (accent) ≈ OT (primary) — 둘 다 BDR Red 토큰. 실측 시 시각 차이 미세 (사용자 결재 §1 매핑 그대로 적용 / 사용자가 별도 조정 시 추후 fix).
  - Player Fouls 배경 — U (Unsportsmanlike) 배경 = info (#0079B9 옅게 하늘) — accent 빨강 회피 (빨강 본문 룰 준수). 기존 글자 색 = accent (U) 였으나 Phase 17 = Q별 색으로 위임.
  - Time-outs filled 칸이 phase 별 색 다름 — 같은 페어 (전반 2칸) 라도 P1 마킹 vs P2 마킹 = 둘 다 전반색 (text-primary). 같은 색이지만 timeouts[i].period 기준 정확 매핑.

### ⚠️ reviewer 참고
- **`--color-accent` 와 `--color-primary` 충돌** — 두 토큰 모두 BDR Red. Q2 (accent) ≈ OT (primary) 시각 차이 ~0. 디자인 시스템 자체의 의도된 동의어. 사용자 결재 §1 그대로 적용. 후속 fix 시 OT 색을 다른 토큰 (예: `--color-info` 진한 톤) 으로 교체 검토 가능.
- **Player Fouls U 배경 = info (하늘)** — 기획설계에 명시된 "U=accent 옅게"는 빨강 본문 룰 위반 가능성 있어 `--color-info` (#0079B9 파랑 — globals.css 토큰) 옅게로 대체. U(Unsportsmanlike) = 하늘 = 시각적 경고 + 빨강 회피 두 마리 토끼.
- **단일 source 보장** — getPeriodColor / getPeriodLabel / getTimeoutPhaseColor / PERIOD_LEGEND 모두 `src/lib/score-sheet/period-color.ts` 한 곳. 향후 색 변경 시 본 파일만 수정.
- **vitest cross-check** — `PERIOD_LEGEND[0..3].color === getPeriodColor(1..4)` 동치성 검증 (정합 회귀 방지).
- **다음 단계**: 시각 검증 (브라우저 /score-sheet/{matchId} 진입 → Q1~Q4 색 마킹 / OT 진입 시 색 / Legend 표시 확인 → Ctrl+P 인쇄 미리보기 Legend 제외 + A4 fit 유지 확인).

### 신규 보안 이슈
- **0 건** — UI / lib (헬퍼 함수) 변경. API / 권한 / DB schema 영향 0.

---

## 구현 기록 (developer) — FIBA Phase 16 검증 5 issue fix (2026-05-13)

📝 구현 범위: 스타팅 자동 P.IN + 빨강 배경 / 빨강 원 ◉ 숨김 / DATE·TIME·PLACE 자동 매핑 / Team fouls 우측 정렬 / D 퇴장 행 회색 + 아이콘 제거 / 풋터 FIBA PDF 정합.

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` | (a) `formatScheduledAt()` helper 신규 — Asia/Seoul timezone 강제 + `Intl.DateTimeFormat("en-CA")` 로 "YYYY-MM-DD HH:mm" 형식 (splitDateTime 친화). (b) `venue` 별도 조회 — `match.venue_id` 가 null 이 아닐 때 `prisma.courts.findUnique` 로 name 가져오기. (c) `placeLabel` fallback chain — `court_number` (수동 입력 우선) → `courts.name` → null. (d) `matchProps.scheduledAtLabel` 깨끗한 ISO 형식 / `matchProps.courtLabel` placeLabel 사용. | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (a) `handleLineupConfirm` 콜백 — starters + substitutes 전체의 `playerIn=true` 자동 set (setTeamA / setTeamB 양쪽 patch). (b) `initialLineupComputed` 진입 시 mount 1회 동일 자동 P.IN useEffect 추가 (사전 확정 라인업 케이스도 동일 룰). draft 복원 이후 hasAny 가드로 덮어쓰기 회피. (c) toast 메시지 갱신 ("출전 명단 자동 P IN 체크 (스타팅 강조 표시)"). | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | (a) Time-outs + Team fouls 컨테이너 `justify-between` 추가 (우측 정렬 §4 / 이미지 38). (b) Team fouls 박스 = `flex-1` → `ml-auto shrink-0` + 라벨 `text-right` (우측 정렬). (c) 빨강 원 ◉ 영구 제거 (스타팅 표시 = P.IN 빨강 배경으로 대체 §1·§2). (d) ejected 시 행 시각 보강 — `opacity: 0.6` + `cursor: not-allowed` 추가 (§5). (e) D 퇴장 아이콘 (`material-symbols block`) + "5반칙/T×2/U×2/D 퇴장" 텍스트 제거 — 행 회색 + 비활성 시각만으로 인지 (§5). (f) P.IN 체크박스 = `isStarter` 분기 추가 — 스타팅 = `var(--color-primary)` 빨강 배경 + 흰 체크 (accentColor `#ffffff`) / 일반 = 흰 배경 + 검정 체크 (§1). (g) P.IN input `disabled = disabled \|\| ejected` (퇴장 후 토글 차단). | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | (a) frameless 심판진 — Referee 단독 한 줄 + **Umpire 1 / Umpire 2 가로 묶음** (각 50% / labelWidth=60). 상단 mt-1 + border-top (영역 구분 §6). (b) Captain's signature 라벨 `labelNoWrap=true` + labelWidth=200 (한 줄 강제 / whiteSpace nowrap + ellipsis). 상단 border-top 추가 (영역 구분). (c) SigInput inline 라벨 `uppercase` 제거 → **Title case 보존** (FIBA PDF 정합 §6). (d) `labelNoWrap` prop 신규. (e) frameless=false (legacy) 변경 0 (회귀 안전망). | 수정 |

### 5 issue fix 결과 매트릭스
| # | 이슈 | 변경 위치 | 시각 효과 |
|---|------|----------|----------|
| §1 | 스타팅 자동 P.IN + 빨강 배경 | score-sheet-form (lineup confirm + mount) + team-section (P.IN 체크박스 isStarter 분기) | 스타팅 5인 = 빨강 배경 흰 체크 / 출전 7명 = 흰 배경 검정 체크 |
| §2 | 빨강 원 ◉ 숨김 | team-section (선수명 row ◉ 영구 제거) | 시각 노이즈 0 — 스타팅 표시는 P.IN 빨강 배경으로 위임 |
| §3 | DATE·TIME·PLACE 자동 매핑 | page.tsx (formatScheduledAt + venue 조회 + placeLabel fallback) | "—" → "2026-05-13" / "14:00" / "코트 1" 정상 노출 |
| §4 | Team fouls 우측 정렬 | team-section (justify-between + ml-auto shrink-0 + text-right) | Time-outs 좌측 / Team fouls 우측 (FIBA PDF 정합) |
| §5 | D 퇴장 UI 정리 | team-section (아이콘/텍스트 제거 + 행 opacity 0.6 + P.IN ejected disabled) | 깨끗한 행 회색 + 비활성 + D 마킹은 Fouls 1번 칸 글자 유지 |
| §6 | 풋터 FIBA 정합 | footer-signatures (Title case + Umpire 1·2 가로 + Captain 한 줄 + border-top) | FIBA PDF 1:1 정합 (이미지 40-41) |

### 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT_CODE=0 (출력 0줄) |
| `npx vitest run` 전체 | ✅ **630/630 PASS** (회귀 0건) |
| Flutter v1 영향 | ✅ 0 (`api/v1/` 변경 0건) |
| schema 변경 | ✅ 0 (DB 모델 변경 0 / venue 조회 = SELECT 만) |
| AppNav frozen | ✅ 영향 0 |
| BFF / service | ✅ 변경 0 (UI 만 / page.tsx 의 venue SELECT 만 추가) |
| 디자인 13 룰 | ✅ var(--color-*) 100% / Material Symbols Outlined / lucide ❌ 0건 |
| 빨강 본문 텍스트 | ✅ 0 (단 P.IN 스타팅 빨강 배경 = 강조 예외 — 사용자 결재 §1) |
| placeholder 5단어 | ✅ 신규 추가 0건 |
| A4 1 페이지 fit | ✅ 유지 (Phase 14 aspect-ratio 보존) |

### 💡 tester 참고
- **테스트 방법**: `/score-sheet/{matchId}` 진입 (운영자 / 기록원 권한자 / paper mode)
- **정상 동작**:
  1. **DATE / TIME / PLACE 자동 fill** — 헤더 3-4번째 줄 "—" → 실제 매치 일정 / 시간 / 코트
  2. **라인업 모달 confirm** → 양식 진입 시 12명 P.IN 자동 체크 (스타팅 5인 = 빨강 배경 / 출전 7명 = 흰 배경)
  3. **사전 라인업 (DB 박제) 진입** → 모달 skip + 동일 자동 P.IN 체크 작동
  4. **빨강 원 ◉** = 선수명 옆 흔적 없이 깨끗 (스타팅 인지 = P.IN 빨강 배경으로 한눈에)
  5. **Team fouls 박스** = 우측 정렬 (Time-outs 좌측 / Team fouls 우측 — FIBA PDF 정합)
  6. **D 퇴장 (또는 5반칙 / T×2 / U×2)** → 행 회색 + 60% 투명 + cursor not-allowed + P.IN 클릭 차단 + Fouls 추가 차단 (마지막 칸 해제만 허용)
  7. **풋터 풋터 영역** = Scorer/Assistant scorer/Timer/Shot clock operator (Title case 4줄) + 구분선 + Referee + Umpire 1·2 (가로 묶음) + 구분선 + Captain's signature in case of protest (한 줄)
- **주의할 입력**:
  - DB 의 `match.scheduledAt` = null → DATE/TIME 여전히 "—" (정상 — null 박제 케이스)
  - DB 의 `match.court_number` + `match.venue_id` 둘 다 null → PLACE "—" (정상)
  - 스타팅 P.IN 빨강 배경 → 운영자가 수동 P.IN 토글 시 = 토글 후에도 빨강 배경 유지 (isStarter prop 은 라인업 기준 / 토글 = state 만 변경). 시각적으로 자연스럽게 작동.
  - draft localStorage 복원 + 사전 라인업 → 자동 P.IN 1회 useEffect 는 `hasAny=true` 가드로 skip (draft 가 우선 / 의도 보존).

### ⚠️ reviewer 참고
- **P.IN 빨강 배경 = 사용자 결재 예외** — CLAUDE.md "빨강 본문 텍스트 ❌" 룰이지만 사용자 결재 §1 (이미지 36) 으로 스타팅 강조 빨강 배경 예외 허용. 본문 텍스트 X / 강조 액션 UI 한정.
- **venue 별도 쿼리** — page.tsx 에서 SELECT 1회 추가. 운영 영향 = SELECT 만 (DB 정책 §운영 영향 0 작업 / 가드 없이 진행 가능).
- **automatic P.IN useEffect (mount 1회)** — `initialLineupComputed` 진입 시 sets 가 draft 복원 이전에 실행되어도 hasAny 가드로 충돌 회피. 운영 시 reload = draft 복원 후 hasAny=true → skip → 의도 보존 (테스트 매트릭스 검증).
- **Title case 라벨** — frameless inline 모드만 변경 (FIBA PDF 정합). frameless=false legacy 박스 모드는 uppercase 유지 (회귀 안전망 — 사용처 0이지만 보존).
- **D 퇴장 아이콘 제거** — `material-symbols-outlined block` 텍스트 제거됐지만 `getEjectionReason` lib 함수 사용은 유지 (행 회색 조건 판정용). DOM 출력만 제거.
- **다음 단계**: 시각 검증 (브라우저 /score-sheet/{matchId} 진입 → 이미지 36-41 비교 / A4 인쇄 미리보기로 fit 유지 확인).

### 신규 보안 이슈
- **0 건** — UI / 자동 fill 변경. API / 권한 / DB schema 영향 0.

---

## 구현 기록 (developer) — UI-1 dashboard 체크리스트 hub (2026-05-13)

📝 구현한 기능: `/tournament-admin/tournaments/[id]` 메뉴 카드 8개 → **결정 8 항목 체크리스트 hub** 재구성.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/tournaments/setup-status.ts` | 8 항목 판정 함수 + `calculateSetupProgress` 종합 (잠금 조건 + 공개 가드) | 신규 |
| `src/__tests__/lib/tournaments/setup-status.test.ts` | 35 케이스 (8 항목 × 다중 시나리오 + 종합/잠금/공개 가드) | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/SetupChecklist.tsx` | 체크리스트 UI (server) — progress bar + 8 카드 + 공개 가드 안내 | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx` | 8 메뉴카드 폐기 → 체크리스트 hub + 보조 액션 3~4개 (참가팀/관리자/기록원/공개 사이트) | 수정 |

핵심 결정:
- **server component 유지** — prisma include 에 `divisionRules { format, settings }` 추가 (N+1 회피).
- **체크리스트 8 항목**: 1 기본정보 / 2 시리즈(선택) / 3 종별정의 / 4 운영방식 / 5 신청정책 / 6 사이트 / 7 기록설정 / 8 대진표.
- **잠금 조건**: 1→3·6, 3→4, 4→7·8 (선행 미완료 시 진입 차단 + 잠금 사유 안내).
- **공개 가드**: 필수 7 항목 (2 시리즈 제외) ALL ✅ 시 활성 — `allRequiredComplete` + `missingRequiredTitles` props 노출.
- **보조 액션 4개 보존**: 체크리스트에 흡수되지 않는 운영성 진입점 (참가팀/관리자/기록원/공개 사이트 외부 링크).

검증 결과:
- tsc → **0** (UI-1 신규 0 에러)
- vitest setup-status → **35/35 PASS** (신규)
- vitest 전체 tournaments → **121/121 PASS** (4 파일, 회귀 0)
- schema 변경 **0** / API 신규 **0** / Flutter v1 영향 **0** / AppNav 영향 **0** (admin 영역)
- 디자인 룰: `var(--color-*)` only / Material Symbols / 4px 라운드 / 44px+ 터치 / 빨강 본문 0

💡 tester 참고:
- 테스트 URL: `/tournament-admin/tournaments/{id}` (admin 권한 필요)
- 진입 케이스 3종 — (a) 빈 신규 대회 (1/8) (b) 종별 정의 직후 (3/8 + 4·7·8 잠금) (c) 완전 박제 (8/8 공개 가능)
- 정상 동작: progress bar % 일치 / locked 카드 클릭 무효 (Link wrapper X) / 카드 호버 elevated bg
- 주의할 입력: `tournament.settings = null` / `divisionRules = []` / `auto_approve_teams = null` (boolean null = 미박제)

⚠️ reviewer 참고:
- `setup-status.ts` 의 잠금 조건 (1→3·6, 3→4, 4→7·8) 이 운영자 의도와 일치하는지
- `isRecordingModeConfigured` 가 `default_recording_mode` 키 박제만 봄 — 기록자 1명 이상 가드는 의도적으로 생략 (선택 사항)
- 보조 액션의 "공개 사이트 보기" external link 가 site.isPublished 조건부 — 비공개 시 숨김 (옳은 동작)

---

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-13 | (커밋 대기) | **[UI-1 dashboard 체크리스트 hub]** `/tournament-admin/tournaments/[id]` 8 메뉴카드 → 결정 8 항목 체크리스트 hub 재구성. (a) `setup-status.ts` 신규 — 8 항목 판정 함수 + `calculateSetupProgress` (잠금 1→3·6 / 3→4 / 4→7·8 + 공개 가드 `allRequiredComplete` 필수 7항목 ALL ✅ 시 true / 2 시리즈 = required=false 선택). (b) `SetupChecklist.tsx` 신규 (server) — progress bar + 8 카드 (✅ accent / 🔄 warning / ⚪/🔒 muted + opacity 0.6) + Material Symbols (`check_circle`/`pending`/`radio_button_unchecked`/`lock`/`chevron_right`) + 공개 가드 미충족 안내. (c) page.tsx — prisma include 에 `divisionRules { format, settings }` 추가 (N+1 회피) / 8 메뉴 폐기 / 보조 액션 4개 보존 (참가팀/관리자/기록원/공개 사이트 외부링크). vitest 35 케이스 신규 — 121/121 PASS (회귀 0) / tsc 0 / schema 0 / Flutter v1 0 / AppNav 0 / 빨강 본문 0. | ✅ |
| 2026-05-13 | (커밋 대기) | **[FIBA Phase 17 — 쿼터별 색상 + Legend]** 사용자 직접 결재 §1~§8 (14:00 KST). (a) `src/lib/score-sheet/period-color.ts` 신규 — `getPeriodColor` (Q1=text-primary / Q2=accent / Q3=success / Q4=warning / OT(5+)=primary) + `getPeriodLabel` + `getTimeoutPhaseColor` (전반/후반/OT) + `PERIOD_LEGEND` 5건 단일 source. (b) running-score-grid.tsx — 마킹 글리프 ●/◉/◎ + 등번호 색 = 하드코딩 accent → 동적 `getPeriodColor(mark.period)`. (c) team-section.tsx — Player Fouls **하이브리드** (글자=`getPeriodColor(period)` Q별 / 배경=신규 `FOUL_TYPE_BG_COLOR` 종류 옅은 톤 — P=투명/T=노랑/U=하늘 info/D=빨강) / Team Fouls 페어 박스 채움 = `getPeriodColor(period)` Period별 색 + Extra(OT) = primary / Time-outs X 마킹 = `getTimeoutPhaseColor` phase별 색. (d) period-color-legend.tsx 신규 — 5건 (Q1~Q4 + OT) 색 원(W=H 50%) + 한글 라벨 + `no-print` (frame 외부 / 인쇄 시 제외). (e) score-sheet-form.tsx — `<PeriodColorLegend />` frame 외부 (MatchEndButton 위). vitest 23건 신규 (Q1~OT + 경계 0 + cross-check) → 639 → **662/662 PASS** (회귀 0). tsc 0 / Flutter v1 0 / schema 0 / BFF 0 / AppNav 0 / lucide 0 / 핑크 0 / 빨강 본문 텍스트 0 (Q2/OT = 강조 마킹) / A4 fit 유지 (Legend = frame 외부). 주의: `--color-accent` ≈ `--color-primary` (둘 다 BDR Red) → Q2 ≈ OT 시각차 미세 (사용자 결재 §1 그대로). | ✅ |
| 2026-05-13 | (코드 변경 0) | **[검토 — AI 자연어 대회 운영 가능성]** 결론: 가능 + Phase AI-1 (추천 시스템) 부터 점진 권장. 핵심 발견 = `@google/genai` Gemini 2.5 Flash 가 `src/lib/news/gemini-client.ts` 에서 이미 운영 중 (BDR NEWS / 알기자 / 프로필 bio) → LLM 인프라 재사용 100% / API key 신규 발급 0. 3 패턴 비교 (A 추천 200~400 LOC / B Structured 400~600 / C custom phase 1500+) + 비용 추정 (Gemini 무료 tier 1500 RPD 잔여 충분 / 월 50~150 호출) + 위험 5건 완화 방안 + 9 enum 표현 가능 시나리오 매트릭스. 운영자 결재 3택 — (가) AI-1 만 ⭐ / (나) AI-1+2 일괄 / (다) 보류. 산출물: scratchpad "검토 (planner-architect)" 신규 섹션 + Phase AI-1 파일 6개 설계 (신규 5 / 수정 1). 코드 변경 0 / DB SELECT 만. | ✅ 보고 |
| 2026-05-13 | (커밋 대기) | **[Phase 3.5-F — advance_per_group 본선 진출 팀 수 설정]** (a) `shouldShowAdvancePerGroup()` 신규 — `group_stage_knockout` / `full_league_knockout` / `dual_tournament` 3 enum 시만 true. (b) `ADVANCE_PER_GROUP_DEFAULT = 2` 상수 (생활체육 표준 1·2위). (c) `validateDivisionSettings` 확장 — advance_per_group: 1~32 정수 + `<= group_size` 강제 (조 크기 초과 진출 차단). (d) divisions/page.tsx GroupSettingsInputs 에 input row 신규 — max=group_size HTML5 가드 + 박제 enum 전환 시 자동 정리 + 총 본선 진출 = advance_per_group × group_count 자동 계산 안내. (e) 가이드 li "조별 본선 진출 팀 수 설정 가능" 추가. (f) zod refine 메시지만 갱신 (검증 로직은 lib 위임으로 자동 반영). vitest 9건 신규 (shouldShowAdvancePerGroup True 3 / False 9 / advance_per_group 정상·범위외·상한·=group_size·단독·DEFAULT·강남시나리오) → 25 → 34 PASS. tsc 0 / vitest 전체 **639/639 PASS** (630 → +9) / Flutter v1 영향 0 / schema 변경 0 / lucide 0 / 핑크 0. | ✅ |
| 2026-05-13 | (커밋 대기) | **[FIBA Phase 16 — 검증 5 issue 통합 fix]** 사용자 직접 결재 6건 (이미지 36-41): (§1) 스타팅 자동 P.IN + 빨강 배경 — `handleLineupConfirm` + `initialLineupComputed` mount 양쪽에서 starters+substitutes playerIn=true 자동 set. 스타팅 5인 = P.IN 체크박스 빨강 배경 + 흰 체크 (accentColor #fff) / 일반 출전 7명 = 흰 배경 (§2 빨강 원 ◉ 영구 제거 — 스타팅 표시 = P.IN 배경으로 대체). (§3) DATE/TIME/PLACE 자동 매핑 — `formatScheduledAt()` Asia/Seoul timezone + `Intl.DateTimeFormat(en-CA)` "YYYY-MM-DD HH:mm" 형식 (splitDateTime 친화 / 이전 ko-KR locale 분리 깨짐 fix). `match.venue_id != null` 시 `courts.findUnique` 별도 조회 + placeLabel fallback chain (`court_number` → `courts.name` → null). (§4) Team fouls 박스 우측 정렬 — `justify-between` + `ml-auto shrink-0` + 라벨 `text-right` (FIBA PDF 정합). (§5) D 퇴장 UI 정리 — material-symbols `block` 아이콘 + "5반칙/T×2/U×2/D 퇴장" 텍스트 영구 제거 / 행 `opacity: 0.6` + `cursor: not-allowed` 강화 / P.IN input `disabled = disabled \|\| ejected` (퇴장 후 토글 차단) / D 마킹은 Fouls 1번 칸 글자 유지. (§6) 풋터 FIBA 정합 — SigInput inline `uppercase` 제거 → Title case 보존 / frameless 심판진 = Referee 단독 + **Umpire 1·2 가로 묶음** (각 50% / labelWidth=60) / Captain's signature `labelNoWrap=true` + labelWidth=200 한 줄 강제 + ellipsis / 운영진/심판/주장 사이 border-top 영역 구분. tsc 0 / vitest **630/630 PASS** (회귀 0) / Flutter v1 영향 0 / schema 0 / BFF 0 / AppNav 0 / lucide 0 / 빨강 본문 텍스트 0 (P.IN 배경 = 사용자 결재 §1 예외) / A4 fit 유지. | ✅ |
| 2026-05-13 | (커밋 대기) | **[Phase 3.5-E — 한국식 용어 통일 + group_count 조건부 UI]** (a) FORMAT_LABEL 3개 라벨 한국 생활체육 표준 통일 — `single_elimination` "싱글 엘리미네이션" → **"토너먼트"** / `round_robin` "풀리그 (Round Robin)" → **"풀리그"** / `double_elimination` "더블 엘리미네이션" → **"더블 토너먼트"**. swiss / 나머지 = 변경 0. enum 값 자체 = DB 호환성 유지 (라벨만 변경). (b) `<GroupSettingsInputs>` 의 ranking_format 영역에 `group_count <= 2` 분기 — 드롭다운 대신 "각 동순위전이 단판 경기로 자동 진행됩니다 (조 개수가 2조 이하)" 안내 박스 노출. group_count 3+ 일 때만 드롭다운 (풀리그 / 토너먼트). onChange 즉시 토글 (React state 재렌더). default `round_robin` 박제 유지 (호환성). (c) 페이지 하단 가이드 li 일관성 — "토너먼트" 추가 + "더블 토너먼트" 신규 추가. (d) vitest 4건 신규 (FORMAT_LABEL 회귀 가드) → 21 → 25건 PASS. tsc 0 / vitest 전체 **630/630 PASS** (626 → +4) / Flutter v1 영향 0 / schema 변경 0 / lucide 0 / 핑크 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[Phase 3.5-D — 종별 운영 방식 신규 모드 + 조 설정 UI]** (a) 신규 enum `group_stage_with_ranking` (조별리그 + 동순위 순위결정전 / league_advancement 와 차이 = settings.linkage_pairs 명시 불필요, group_size/group_count 만 박제). (b) `src/lib/tournaments/division-formats.ts` 신규 — ALLOWED_FORMATS (9개) + FORMAT_LABEL + showGroupSettings (풀리그 6 enum) + showRankingFormat (신규만) + validateDivisionSettings (1~32 정수 / round_robin·single_elimination) + calculateTotalTeams. server (route.ts ×2) + client (page.tsx) 단일 source of truth. (c) divisions/page.tsx 에 `<GroupSettingsInputs>` 컴포넌트 신규 — 조 크기·조 개수·동순위전 방식 input 3개 + 총 팀 수 자동 계산 안내 + onBlur PATCH 저장. (d) 가이드 항목 추가. (e) division-advancement.ts `generateGroupStageRankingPlaceholders` stub 함수 (후속 PR 큐잉). (f) prisma schema 코멘트만 갱신 (값 변경 0 / String 필드). vitest 21건 신규 / tsc 0 / 전체 **626/626 PASS** (605 → +21) / Flutter v1 영향 0 / schema 변경 0 / lucide 0 / 핑크 0. **후속 PR 큐잉**: 신규 enum 의 동순위전 placeholder 자동 생성 (현재 stub). | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 15 — 풋터 Team B 아래 이동 + 경기 종료 버튼 frame 외부]** (a) score-sheet-form.tsx: `<FooterSignatures>` 위치 = frame 가로 (grid 외부) → **좌측 col 안 Team B 아래 마지막 child** (FIBA PDF 정합 / 사용자 결재 §1 / 이미지 35). Team B section `fiba-divider-bottom` 래핑. (b) footer-signatures.tsx: frameless 운영진 labelWidth 140→**100** / 심판진 grid-cols-3 가로→**flex flex-col 세로 3줄** + labelWidth=100 / 주장 labelWidth=100 추가 (좌측 50% 폭 안 fit). (c) MatchEndButton + 라인업 다시 선택 = frame 외부 그대로 (자동 해소). A4 fit 재검증: 좌측 ~920 / 우측 ~960 / 헤더 95 + max(920, 960) = 1055px (A4 1121 안 여유 ~66px). tsc 0 / vitest 605/605 PASS / schema 0 / Flutter v1 0 / BFF 0 / AppNav 0 / 핑크 0 / lucide 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 14 — A4 정확 비율 + 재배치]** (a) `_print.css`: `.score-sheet-fiba-frame` width 100% + max-width 210mm + **aspect-ratio: 210/297 강제** (화면 A4 정확) + overflow hidden. 인쇄 = 210×297mm + @page margin 0 (박스 = 종이 1:1). (b) Time-outs grid-cols-2 → **grid-cols-3 × 2 = 6 고정 칸** (FIBA 표준 / 사용자 결재 §1). 6번째 = "여유 (OT 활성)". (c) 풋터 운영진 가로 1줄 → **세로 4줄** (Phase 13 회귀 복원 / 사용자 결재 §2). labelWidth=140 / compact prop 제거 (사용처 0). (d) 요소비율 통일 — 박스 18px (Time-outs/P IN/Fouls 1-5) + Team Fouls 박스 12px / 라벨 10px (풋터) / 9px (Team Fouls). tsc 0 / vitest 605/605 PASS / schema 0 / Flutter v1 0 / BFF 0 / AppNav 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 13 — UI 겹침 fix + 압축]** (a) TIME-OUTS 가로 6칸 → 2×N grid (사용자 결재 §1). 박스 18px. (b) Team Fouls 박스 12px + 라벨 9px + FT 안내 8px (P2/2FT 겹침 fix §2). (c) 체크박스 P IN + FOULS 1-5 = 24→18px (§3). (d) Players 행 20→18px (§4 / 12×18=216). (e) 풋터 운영진 4명 세로→가로 1줄 4컬럼 (§5 / -82px). 좌측 ~857px (A4 여유 ~266px). tsc 0 / vitest 605/605 PASS / schema 0 / Flutter v1 0 / BFF 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[Phase E 단체 lifecycle (Q1 보존)]** E-1) requireOrganizationOwner 헬퍼 + OrganizationPermissionError (owner only — admin 차단 + super_admin 우회 옵션). E-2) POST/DELETE /api/web/organizations/[id]/archive (status='archived'/'approved' 토글, adminLog warning 박제). E-3) ArchiveOrganizationButton confirm 모달 + 운영자 페이지 isOwner 가드 + 헤더 "보관됨" 뱃지 + 단체 목록 active vs archived 분리 (회색 톤) + 공개 페이지 archived 안내 페이지 분기. vitest 10 케이스 (단체없음/super_admin 2종/owner/admin/member/외부인/비활성/allowSuperAdmin=false/archived owner). schema 변경 0 (status=String) / Flutter v1 영향 0 / decisions.md Q1 박제. tsc 0 / vitest 본 PR 10/10 PASS / 전체 601/605 (실패 4건 = 별 PR score-sheet 무관). | ✅ |
| 2026-05-12 | (커밋 대기) | **[Phase D 단체↔시리즈 셀프서비스]** D-1) 시리즈 카드 ⋮ 메뉴 (SeriesActionsMenu + MoveSeriesModal — 분리 organization_id=null / 이동 본인 owner-admin 단체 목록 radio + confirm). D-2 Q3) canManageTournament 단체 owner/admin 자동 부여 회귀 가드 vitest 9 케이스 (organizer/TAM/단체 owner/admin/member/series_id NULL/super_admin 2종). tsc 0 / vitest 595/595 PASS / Flutter v1 영향 0 / schema 변경 0 / API 신규 0 (Phase C PATCH + 기존 GET 재사용). | ✅ |
| 2026-05-12 | a3076bc | **[D-3 운영 fix]** B max_teams + A 코치 import 템플릿 + E 권한 자동 부여 + C 단체 편집 모달 | ✅ |
| 2026-05-12 | 6057ba6 | **[design B등급]** admin 빨강 잔존 — analytics/logs/news/users/site/bracket 7 위치 톤다운 | ✅ |
| 2026-05-12 | 4a861ae | **[design]** admin 빨강 톤다운 전면 — wizard/통계/메뉴/이니셜 (이미지 37/38) | ✅ |
| 2026-05-12 | 98f857c | **[design]** admin 빨강 누락 페이지 — series 목록/wizard/모달 (이미지 36) | ✅ |
