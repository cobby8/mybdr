# BDR 기자봇 시스템 v2 — 다양한 기사 + 대규모 운영 + 저비용 LLM

> 작성: 2026-05-02 / 담당: planner-architect
> v1 (`Dev/bdr-reporter-bot-plan-2026-05-02.md`) 후속.
> v1 = 매치 요약 단신 1종 + Sonnet 4.5. v2 = 기사 6종 + Gemini Flash + 일 300매치 운영.
>
> **안전 가드**: 코드 수정 X / DB 수정 X / LLM API 호출 X / 5/2 D-day 진행 중 — 실행은 사용자 결정 + D-day 종료 후

---

## 0. v1 → v2 변경 요약

| 영역 | v1 | v2 |
|------|-----|-----|
| 기사 종류 | 매치 요약 단신 1종 (300자) | **6종** (단신 / 풀 리포트 / 일자별 종합 / 프리뷰 / 리뷰 / 중간 상황) |
| LLM | Claude Sonnet 4.5 (+ prompt cache) | **Gemini 2.0 Flash** (무료 tier 우선, paid fallback) |
| 운영 규모 | 일 ~10 매치 (소규모 사용자 검수) | **일 300 매치 + 30 대회** (queue + cron + 자동 발행) |
| 데이터 모델 | (별도 테이블 0) JSON 응답만 | **`articles` + `article_versions` + `article_feedback`** 신규 3 테이블 |
| 발행 채널 | 라이브 페이지 요약 탭 | **+ /news 신규 + 매치 단독 페이지 + 대회 페이지 탭 추가** |
| 비용 (월 추정) | $2.4 (200매치) | **$5** (300매치/일 × 30일 + 종합/프리뷰/리뷰/중간) |

핵심: **비용 절감 + 종류 다양화 + 자동 발행 인프라** 가 v2 의 3 축.

---

## 1. LLM 선택 + 비용 추정

### 1-1. LLM 비교 (한국어 기사 기준)

| 모델 | 입력 $/1M | 출력 $/1M | 무료 tier | 한국어 | 비고 |
|------|----------|-----------|----------|-------|------|
| **Gemini 2.0 Flash** ⭐ | $0.10 | $0.40 | **1500 RPD 무료** | 우수 | 본채택 |
| Gemini 1.5 Flash | $0.075 | $0.30 | 〃 | 우수 | 비용 fallback |
| GPT-4o-mini | $0.15 | $0.60 | 없음 | 양호 | OpenAI 백업 |
| Claude Haiku 3.5 | $0.80 | $4.00 | 없음 | 우수 | 8배 비싸 배제 |
| Claude Sonnet 4.5 (v1) | $3.00 | $15.00 | 없음 | 최우수 | 30배 비싸 v2 배제 |

**Gemini 2.0 Flash 채택 사유**:
1. 무료 tier 1500 RPD = 일 300매치 + 30대회 + 30일자종합 = 360 호출 → 무료 흡수
2. 한국어 자연성 (1.5 부터 한국 KBL 기사 검수 통과 사례 다수)
3. Google API 안정성 + paid tier 도 매우 저렴 ($0.10/M)

### 1-2. 운영 규모 가정

| 콘텐츠 | 일 빈도 | input tokens | output tokens |
|---------|--------|-------------|---------------|
| 매치 요약 (300자) | 300 | 2,000 | 500 |
| 매치 풀 리포트 (800자) | 300 | 3,000 | 1,500 |
| 일자별 종합 (1800자) | 30 | 6,000 | 2,500 |
| 대회 프리뷰 (1500자) | ~30 | 3,000 | 2,000 |
| 대회 리뷰 (2000자) | ~30 | 8,000 | 3,000 |
| 중간 상황 (1000자) | ~30 | 4,000 | 1,500 |

### 1-3. 비용 추정 (Gemini 2.0 Flash 기준, paid tier 가정)

| 콘텐츠 | 일 호출 | 월 호출 | 월 input | 월 output | 월 비용 |
|---------|--------|--------|---------|----------|---------|
| 매치 요약 | 300 | 9,000 | 18M | 4.5M | $1.80 + $1.80 = $3.60 |
| 매치 풀 리포트 | 300 | 9,000 | 27M | 13.5M | $2.70 + $5.40 = $8.10 |
| 일자별 종합 | 30 | 900 | 5.4M | 2.25M | $0.54 + $0.90 = $1.44 |
| 대회 프리뷰 | 30 | 900 | 2.7M | 1.8M | $0.27 + $0.72 = $0.99 |
| 대회 리뷰 | 30 | 900 | 7.2M | 2.7M | $0.72 + $1.08 = $1.80 |
| 중간 상황 | 30 | 900 | 3.6M | 1.35M | $0.36 + $0.54 = $0.90 |
| **합계** | | | | | **월 ~$17 / 연 ~$200** |

**무료 tier 활용 시**: 일 1500 RPD 한도 내 = 매치 요약 (일 300) + 매치 풀 리포트 (일 300) 하루 600 호출 → **무료 흡수**. 일자별 종합 / 프리뷰 / 리뷰 / 중간 까지 합쳐도 일 ~720 → **무료 가능**.

**Phase 1 시작 비용 = $0** (무료 tier 만), Phase 2~5 본격 가동 시 paid 전환해도 **월 $5~17 수준**.

---

## 2. 기사 유형 6종 — 트리거 / 길이 / 데이터 / 발행 채널

| # | 유형 | 트리거 | 길이 | 데이터 source | 발행 채널 |
|---|------|--------|------|--------------|----------|
| 1 | 매치 요약 단신 | 매치 status=completed 직후 | 300자 (3~5문장) | `tournament_matches` + `match_player_stats` + `play_by_plays` (STL 가공 결과) | `/live/[id]` 요약 탭 + (있다면) AppNav 알림 |
| 2 | 매치 풀 리포트 | 단신 직후 | 700~1000자 | + 쿼터별 흐름 + 더블더블/트리플더블 + 양 팀 MVP 2명 | `/news/match/[id]` 단독 페이지 |
| 3 | 일자별 종합 | cron 매일 23:00 (해당일 모든 매치 종료 후) | 1500~2000자 | 그날 종료 매치 N건 통계 집계 + 톱스토리 1~3건 + 대회별 묶음 | `/news/daily/[YYYY-MM-DD]` + 홈 1면 |
| 4 | 대회 프리뷰 | cron 대회 시작 24h 전 | 1500자 | `tournament` + `tournament_teams (seed)` + 과거 시즌 (Optional) + 주목 선수 1~3명 | `/tournaments/[id]` "프리뷰" 탭 |
| 5 | 대회 리뷰 | 대회 마지막 매치 종료 후 (모든 매치 completed) | 2000자 | 우승 팀 + MVP + 시즌 흐름 + 8강~결승 핵심 매치 3건 회고 | `/tournaments/[id]` "리뷰" 탭 + 홈 |
| 6 | 중간 상황 | 라운드 종료 hook (조별 → 8강 / 8강 → 4강 등) | 1000자 | 진행 중 대회 + 그 라운드 매치 결과 + 다음 라운드 프리뷰 | `/tournaments/[id]` "현장" 탭 |

### 사용자 발견한 케이스 (5/2 동호회최강전 적용 예)

- **단신 + 풀 리포트** = 27 매치 × 2 = 54 기사 (자동 발행)
- **일자별 종합** = 5/2 / 5/3 / 5/9 / 5/10 = 4 기사 (cron 23:00)
- **프리뷰** = 1 기사 (5/1 24h 전, 16팀 시드 + 셋업/MZ 등 주목)
- **리뷰** = 1 기사 (5/10 결승 후, 우승팀 + 토너먼트 MVP + 결승 매치 회고)
- **중간 상황** = 5/2 조예선 종료 / 5/9 8강 종료 / 5/10 4강 종료 = 3 기사
- **합계 = 63 기사** (수동 작성 시 1주일 X / 자동 ~5분)

---

## 3. DB 데이터 모델

### 3-1. 신규 테이블 3종

```prisma
model Article {
  id              String       @id @default(cuid())
  type            ArticleType  // MATCH_BRIEF | MATCH_FULL | DAILY_DIGEST | TOURNAMENT_PREVIEW | TOURNAMENT_REVIEW | TOURNAMENT_MID
  title           String
  lead            String       // 첫 문장 (요약 카드용)
  body            String       @db.Text
  status          ArticleStatus  @default(DRAFT)  // DRAFT | PUBLISHED | ARCHIVED | FAILED
  published_at    DateTime?

  // Polymorphic 연결 (3종 중 1)
  match_id            String?      // type=MATCH_BRIEF / MATCH_FULL
  tournament_id       String?      // type=TOURNAMENT_PREVIEW / REVIEW / MID
  date_range_start    DateTime?    // type=DAILY_DIGEST (시작일)
  date_range_end      DateTime?    // type=DAILY_DIGEST (종료일)

  // 메타
  llm_provider    String       // "gemini-2.0-flash" 등
  llm_input_tokens   Int
  llm_output_tokens  Int
  llm_cost_cents     Int       // 0.001 cents 단위

  // 검수
  reviewed_by     Int?         // user.id (검수자, null=자동)
  reviewed_at     DateTime?

  // 통계
  view_count      Int          @default(0)
  feedback_score  Float        @default(0)  // 평균 (1~5)

  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt

  match           TournamentMatch?  @relation(fields: [match_id], references: [id])
  tournament      Tournament?       @relation(fields: [tournament_id], references: [id])
  versions        ArticleVersion[]
  feedbacks       ArticleFeedback[]

  @@index([type, status, published_at])
  @@index([match_id])
  @@index([tournament_id])
  @@map("articles")
}

model ArticleVersion {
  id          String   @id @default(cuid())
  article_id  String
  body        String   @db.Text
  prompt      String   @db.Text  // 그 버전 system prompt
  reason      String?  // 수정 사유 (수동 검수 / 피드백 반영 / 재생성)
  created_at  DateTime @default(now())
  created_by  Int?     // user.id (null=시스템)

  article     Article  @relation(fields: [article_id], references: [id], onDelete: Cascade)

  @@index([article_id, created_at])
  @@map("article_versions")
}

model ArticleFeedback {
  id          String   @id @default(cuid())
  article_id  String
  user_id     Int?
  vote        Int      // -1 (👎) | 0 (신고) | 1 (👍)
  reason      String?  // 신고 사유 (선택)
  created_at  DateTime @default(now())

  article     Article  @relation(fields: [article_id], references: [id], onDelete: Cascade)

  @@unique([article_id, user_id])
  @@map("article_feedback")
}

enum ArticleType {
  MATCH_BRIEF
  MATCH_FULL
  DAILY_DIGEST
  TOURNAMENT_PREVIEW
  TOURNAMENT_REVIEW
  TOURNAMENT_MID
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  FAILED
}
```

### 3-2. 기존 테이블 변경

- `Tournament` + `TournamentMatch` 에 `articles Article[]` 백릴레이션 추가 (1줄씩 2건).
- 그 외 변경 없음.

### 3-3. 마이그레이션 영향

- 신규 3 테이블 + 백릴레이션 2줄 = `prisma db push` 무중단 ADD.
- 운영 영향: 0. 기존 데이터 보존.

---

## 4. 발행 워크플로우

### 4-1. 트리거 5종

| # | 트리거 | 콘텐츠 |
|---|--------|--------|
| T1 | `TournamentMatch.status` PATCH `→ completed` (`/api/web/tournaments/[id]/matches/[matchId]`) | 매치 요약 + 매치 풀 리포트 (각 1건) |
| T2 | Vercel Cron 매일 23:00 KST | 일자별 종합 (그날 종료 매치 N건 → 1건) |
| T3 | Vercel Cron 매일 00:00 KST + Tournament.startDate ~ now+24h | 대회 프리뷰 (1건/대회) |
| T4 | 대회 마지막 매치 PATCH `→ completed` (라운드 max + bracket_level=결승) | 대회 리뷰 (1건/대회) |
| T5 | 라운드 종료 hook (라운드 N 의 모든 매치 completed AND 라운드 N+1 존재) | 중간 상황 (1건/라운드) |

### 4-2. Queue + Rate Limit

```
[Trigger] → [Article Queue (DB or Vercel KV)]
              ↓
[Worker] → [Gemini API (concurrent=5)] → [DB INSERT articles status=DRAFT]
              ↓
[자동 발행 룰 통과 검사]
   ├─ 매치 요약·풀 리포트 → status=PUBLISHED 즉시
   ├─ 일자별 종합 → status=DRAFT (사용자 검수 후 PUBLISHED)
   ├─ 프리뷰 → status=DRAFT (검수 우선, 결정 §11-Q7 후 자동/검수)
   ├─ 리뷰 → status=DRAFT (검수 우선)
   └─ 중간 상황 → status=DRAFT (검수 우선)
              ↓
[발행 완료 알림] (옵션 — 운영자 Slack/SMS 등)
```

### 4-3. 인프라 선택

| 옵션 | 장점 | 단점 |
|------|-----|------|
| **Vercel Cron + DB queue (`articles.status=DRAFT`)** ⭐ | 신규 인프라 0 / Vercel 기본 / Phase 4 까지 충분 | 동시성 제어 약함 |
| BullMQ + Redis | 동시성 정밀 / 재시도 자동 | Redis 추가 비용 |
| Queue API (Vercel KV) | Vercel 통합 | beta |

**추천**: **Vercel Cron + DB queue** (Phase 1~5 까지). 일 360 호출 / Gemini 무료 tier 1500 RPD = 24% 사용 → 동시성 정밀 제어 불필요.

### 4-4. 실패 처리

- LLM 실패 (timeout / rate limit / 형식 오류) → `articles.status=FAILED` + Vercel 로그
- 재시도: cron 매 시간 FAILED 매치 1회 재시도 (max 3 attempts)
- Hallucination 검증 실패 (점수/이름 불일치) → `status=FAILED` + 운영자 알림

---

## 5. 페르소나 + Sub-role Prompt

### 5-1. 통합 정체성 (모든 유형 공통)

```
정체성: BDR 기자봇 — 서울 3x3 농구 커뮤니티 BDR 의 스포츠 기자.
시그니처: "— BDR 편집부 / AI 작성, 데이터 기반"
톤: KBL 공식 기사 70% + 동호회 친근감 30%. ESPN 한국판 스포츠체.
금지: 검증 안 된 사실 / 패자 폄하 / 욕설 / 과한 격식
점수 차 표현 룰: 1~5점 = 신승 / 6~14점 = 꺾었다 / 15점+ = 완파 (단 "처참" / "굴욕" 금지)
한국어 조사: 정확히 ("X팀이/은/을" 정확)
```

### 5-2. Sub-role 6종

| Sub-role | 역할 | 톤 |
|----------|------|-----|
| 단신 기자 | 매치 요약 (3~5문장) | 빠른 / 핵심 only |
| 칼럼니스트 | 매치 풀 리포트 | 흐름 묘사 + MVP 분석 |
| 종합 데스크 | 일자별 종합 | 메타 시각 / 톱스토리 |
| 분석 기자 | 대회 프리뷰 | 시드 분석 + 주목 |
| 회고 기자 | 대회 리뷰 | 시즌 회고 + 우승 의미 |
| 진행 캐스터 | 중간 상황 | 단계 매듭 + 다음 라운드 프리뷰 |

### 5-3. Prompt 구조 (Gemini 호환)

```
[System (모든 유형 공통)]
당신은 BDR 기자봇입니다. 한국어 스포츠 기사를 작성합니다. ...

[Sub-role + 출력 규격 (유형별 다름)]
당신은 단신 기자입니다. 300자 이내 / 3~5문장 / Lead → Body → 마무리 ...

[Few-shot Examples 1~2 건 (유형별 다름)]

[Input JSON (유형별 다름)]
{...}

[Output: 한국어 기사 본문만 출력. JSON / 마크다운 / 시그니처 X.]
```

---

## 6. Few-shot 전략

### 6-1. 유형별 정성 작성 1~2건 (사용자 직접 검수)

| 유형 | 예시 1 | 예시 2 |
|------|--------|--------|
| 매치 요약 | comeback (역전승) | blowout (대승) |
| 매치 풀 리포트 | close (접전) | back-and-forth (시소) |
| 일자별 종합 | 2~3 매치 + 톱스토리 1건 | 5+ 매치 + 톱스토리 3건 |
| 대회 프리뷰 | 16팀 단일 / 16팀 듀얼 | 8팀 풀리그 |
| 대회 리뷰 | 우승팀 신예 등장 | 우승팀 디펜딩 챔피언 |
| 중간 상황 | 조별 → 8강 진출 8팀 확정 | 8강 → 4강 |

### 6-2. 데이터셋 운영

- 위치: `Dev/bdr-news-dataset/{유형}/{example-N}.{md|json}`
- 구조: input.json + output.txt + meta.md (사유 / 작성자)
- Phase A 초기 = 12 examples (6유형 × 2건)
- Phase B 운영 후 = 사용자 👍 받은 기사 → dataset 추가 (월별 갱신)
- Phase C 자동화 = 100건+ 누적 시 fine-tuning 검토 (별도 비용)

---

## 7. 사이트 UI

### 7-1. 신규 페이지 4종

| 경로 | 역할 |
|------|------|
| `/news` | 기사 목록 (탭: 전체/매치/대회/일자별) — page-by-page paginated |
| `/news/match/[matchId]` | 매치 풀 리포트 단독 (요약 + 박스스코어 링크 + PBP 하이라이트) |
| `/news/daily/[YYYY-MM-DD]` | 일자별 종합 + 그날 매치 N건 카드 |
| `/news/[slug]` | 임의 기사 (프리뷰/리뷰/중간 - 슬러그로 라우팅) |

### 7-2. 기존 페이지 변경

| 페이지 | 변경 |
|--------|------|
| `/live/[id]` | 요약 탭 = 매치 요약 + "풀 리포트" 링크 |
| `/tournaments/[id]` | 탭 추가: 프리뷰 / 현장 (중간 상황) / 리뷰 |
| 홈 (`/`) | 1면 카드 "오늘의 종합" (`/news/daily/{today}`) + 최근 매치 풀 리포트 3건 |
| AppNav | 변경 0 (신규 메인 탭 추가 X — 13 룰 위반) — `/news` 는 더보기 그룹 안 |

### 7-3. 더보기 그룹 변경

`Dev/design/claude-project-knowledge/03-appnav-frozen-component.md` 의 5그룹 IA 안에 **"읽을거리"** 그룹 신설 (선택) 또는 기존 그룹에 흡수. 사용자 결정 §11-Q9.

---

## 8. 학습 사이클 — Phase A / B / C

### 8-1. Phase A — 초기 (사용자 검수 100%)

- 매 기사 생성 후 status=DRAFT → 운영자 1인 검수 → PUBLISHED
- 좋은/나쁜 패턴 수집 (운영자 메모 → `Dev/bdr-news-dataset/feedback-log.md`)
- few-shot examples 갱신 (월 1회)
- 기간: Phase 1~3 (~2주)

### 8-2. Phase B — 자동화 (검수 sample)

- 매치 요약·풀 리포트 = 자동 발행 (status=PUBLISHED 즉시)
- 일자별 종합·프리뷰·리뷰·중간 = 운영자 검수 (status=DRAFT)
- 사용자 피드백 (👍/👎/신고) 수집 → 월 1회 검토
- 위험 매치 (점수 차 50점+ / 통계 이상치) 만 운영자 검수 (자동 플래그)
- 기간: Phase 4~5 (~1개월)

### 8-3. Phase C — 학습 (fine-tuning 검토)

- 누적 100건+ 👍 데이터 → Gemini Tuning API 검토
- 비용 vs 품질 평가 (custom model 비용 = $X/M / 품질 향상 = ?%)
- A/B 테스트: tuned vs base + few-shot 비교
- 기간: Phase 6~7 (~3개월)

---

## 9. Phase 로드맵

| Phase | 작업 | 시간 | 비용 | 의존성 |
|-------|------|------|------|--------|
| **0** | 옵션 A 템플릿 (LLM 0) — 매치 요약만 (v1 계획) | 30분 | $0 | 없음 |
| **1** | Gemini API 통합 + 매치 요약 단신 + few-shot 6 | 4h | $0 (무료 tier) | Q1~Q3 결정 |
| **2** | DB articles 3 테이블 + 매치 풀 리포트 + `/news/match/[id]` | 4h | 〃 | Phase 1 |
| **3** | `/news` 목록 + `/news/[slug]` + 검수 UI | 6h | 〃 | Phase 2 |
| **4** | 일자별 종합 cron + 발행 큐 + `/news/daily/[date]` | 4h | 〃 | Phase 3 |
| **5** | 대회 프리뷰 / 리뷰 / 중간 상황 (3 유형) + `/tournaments/[id]` 탭 | 8h | 〃 | Phase 4 |
| **6** | 학습 사이클 (피드백 수집 + dataset 갱신 + 자동 플래그) | 4h | 〃 | Phase 5 |
| **7** | A/B 테스트 + fine-tuning 검토 | 8h | 변동 | Phase 6 |
| **합계** | | **~38h** | **월 $0~17** | |

---

## 10. 위험 + 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| LLM hallucination (점수/이름/팀명 오기) | 신뢰도 0 | 데이터 검증 layer (생성 후 점수/이름 정규식 매칭 → 불일치 시 status=FAILED) |
| 페르소나 흔들림 (sub-role 간 톤 불일치) | 정체성 혼란 | 통합 system prompt + few-shot examples 일관성 체크 (월 1회) |
| 운영 규모 폭증 (예: BDR 시즌 막판) | 무료 tier 초과 | Gemini paid tier $0.10/M 자동 전환 + 일 cap (예: 1500 호출/일) + alert |
| 한국어 품질 저하 | 사용자 거부 | Gemini 1.5/2.0 한국어 검수 우수 + few-shot 정성 + Phase A 운영자 100% 검수 |
| SEO 중복 콘텐츠 (같은 매치 단신 + 풀 리포트) | 검색 불이익 | canonical 설정 (풀 리포트가 canonical, 단신은 noindex) |
| AI 작성 거부감 | 사용자 신뢰 | 투명성 명시 ("AI 작성, 데이터 기반" 시그니처) + 사용자 피드백 (👍/👎) 항상 노출 |
| 운영자 검수 부하 | 운영자 burn-out | Phase B 자동화 (단신·풀 리포트만 자동) + 위험 플래그 (점수 차 / 이상치) |
| 비용 통제 실패 | 예상 외 청구 | 일 cap + 월 cap (예: 일 $5 / 월 $30) + alert webhook |

---

## 11. 사용자 결정 사항 10건

| # | 결정 항목 | 선택지 | 추천 |
|---|---------|--------|------|
| **Q1** | LLM 선택 | (a) Gemini 2.0 Flash / (b) Gemini 1.5 Flash / (c) GPT-4o-mini | **(a)** |
| **Q2** | 시작 tier | (a) 무료 tier 만 / (b) paid 즉시 | **(a)** (Phase 1 시작 시) |
| **Q3** | 페르소나 이름 | (a) BDR 기자봇 / (b) 레드라이터 / (c) 3X3 옵저버 | **(a)** (시안 정합 + v1 결정) |
| **Q4** | 톤 균형 | (a) 격식 70% / (b) 친근 70% / (c) 분석적 70% | **(a)** (KBL 공식 + 친근감 30%) |
| **Q5** | Phase 1 시작 시점 | (a) D-day 즉시 (5/2) / (b) D-day 종료 후 (5/3+) / (c) 대회 종료 후 (5/10+) | **(c)** (D-day 영향 0 + 5/2~5/10 데이터로 dataset 12건 확보 가능) |
| **Q6** | few-shot 작성 방식 | (a) 사용자 직접 / (b) 초안 자동 생성 → 사용자 선별 | **(b)** (속도 우선) |
| **Q7** | 자동 발행 vs 검수 | (a) 단신·풀 리포트 자동 / 그 외 검수 / (b) 모두 검수 / (c) 모두 자동 | **(a)** (Phase A 100% → B 단신·풀만 자동) |
| **Q8** | 사용자 피드백 메커니즘 | (a) 👍/👎 / (b) 별점 1~5 / (c) 신고 + 댓글 | **(a) + (c)** (간단 + 신고만) |
| **Q9** | `/news` 페이지 위치 | (a) AppNav 더보기 "읽을거리" 그룹 신설 / (b) 기존 "둘러보기" 그룹 흡수 | **(b)** (메인 탭 9개 변경 0 룰 준수) |
| **Q10** | A/B 테스트 (LLM vs 단순 통계) | (a) 시작 / (b) Phase 6 까지 보류 | **(b)** |

---

## 12. 안전 가드 + 운영 룰

### 12-1. 코드 / DB / API 호출 안전 가드 (Phase 0~7 공통)

- **Phase 0** (옵션 A 템플릿): DB 변경 0 / LLM 0 / 코드만 (`src/lib/news/match-template.ts` 신규). 30분.
- **Phase 1** (LLM 통합): `.env` 에 `GEMINI_API_KEY` 추가 + 무료 tier 시작. DB 변경 0.
- **Phase 2** (articles 테이블): `prisma db push` 운영 DB 적용 사용자 명시 승인 게이트. 무중단 ADD (NULL 허용 컬럼만). v2 schema diff 사용자 검토.
- **Phase 3+** : Vercel Cron 등록은 사용자 승인 후. 일 cap 기본값 (300 호출) + 환경변수.

### 12-2. 운영 룰

- **하루 cap**: 환경변수 `BDR_NEWS_DAILY_CAP=1500` (Gemini 무료 tier 안전치)
- **월 cap**: 환경변수 `BDR_NEWS_MONTHLY_BUDGET_CENTS=3000` ($30) — 초과 시 cron 자동 정지 + alert
- **운영자 알림**: FAILED 상태 + cap 초과 + hallucination 검증 실패 시 운영자 (수빈 + 원영) 알림
- **삭제 금지**: 한 번 PUBLISHED 된 기사는 ARCHIVED 만 가능 (DELETE 금지) — `article_versions` 변경 이력 영구 보존

---

## 13. v1 → v2 마이그레이션 경로

| 항목 | v1 (이미 박제) | v2 (이 계획) |
|------|---------------|--------------|
| 페르소나 | BDR 기자봇 ✅ 그대로 | 그대로 |
| 톤 룰 (1~5/6~14/15+) | ✅ | 그대로 |
| LLM | Sonnet 4.5 (캐시) | **Gemini 2.0 Flash** 로 교체 |
| Phase 0 템플릿 | 30분 ✅ 가능 | 그대로 (선택 — Phase 1 직진 권장) |
| few-shot 2건 | comeback / blowout ✅ | **+ 4유형 × 2 = 12 건 확장** |
| 사용자 결정 사항 | Q1~Q7 (7건) | **Q1~Q10 (10건, Q1~Q7 갱신 + Q8~Q10 신설)** |

---

## 14. 박제 위치 + 다음 단계

### 14-1. 산출물 위치

- 본 문서: `Dev/bdr-reporter-bot-plan-v2-2026-05-02.md`
- v1 (참고): `Dev/bdr-reporter-bot-plan-2026-05-02.md`
- few-shot dataset (Phase 1 이후): `Dev/bdr-news-dataset/`
- 운영 로그 (Phase 4 이후): `Dev/bdr-news-ops/{YYYY-MM}/`

### 14-2. 다음 단계 (사용자 결정 후)

1. **Q1~Q10 결정 받기** (5/10 대회 종료 후)
2. **Phase 0 vs Phase 1 직진 결정** (옵션 A 템플릿 30분 vs Gemini 즉시)
3. **`.env` 에 `GEMINI_API_KEY` 발급 + 추가** (사용자 본인)
4. **Phase 1 작업 (4h)** — `src/lib/news/gemini-client.ts` + `src/lib/news/match-brief-generator.ts` + few-shot 2건
5. **Phase 2 ~ 7 순차 진행** (사용자 검수 통과 후)

---

## 15. 마무리

v2 는 v1 의 "매치 단신 1종 / Sonnet 4.5 / 소규모 검수" 를 **"기사 6종 / Gemini Flash / 일 300매치 자동 운영 + 검수"** 로 확장.

핵심 트레이드오프:
- **비용**: v1 Sonnet $2.4/월 (200매치) → v2 Gemini $0~17/월 (300매치/일 + 5유형 추가 + cron)
- **품질**: Sonnet 우수 vs Gemini 양호 → few-shot 정성 + Phase A 운영자 100% 검수로 보완
- **운영 부하**: v1 수동 vs v2 자동 발행 + 검수 sample → Phase B 단신·풀 리포트 자동 발행으로 운영자 부하 감소

**Phase 1 시작 비용 = $0 / Phase 5 (전 유형 운영) 비용 = 월 $5~17 / 운영자 부하 = Phase B 이후 일 5분**.

코드 / DB / LLM 호출 0. 사용자 결정 (Q1~Q10) 후 Phase 1 시작.

---

**END of v2 plan**
