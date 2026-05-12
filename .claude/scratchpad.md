# 작업 스크래치패드

## 현재 작업
- **요청**: D 대진표 고도화 (이미지 33) — dual_tournament rounds/brackets 매핑
- **상태**: 진입 (강남구협회장배 검증부터)
- **모드**: no-stop (자동 머지 위임)

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

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
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
| 2026-05-12 | b8f293f | **[design]** pill 9999px + 빨강 본문 일괄 정리 (이미지 35) — 12 파일 | ✅ |
