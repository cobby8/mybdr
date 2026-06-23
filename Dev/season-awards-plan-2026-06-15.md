# 시즌 시상 고급필드 설계 — season_awards (버킷B P1-b) · 2026-06-15

> 근거: `Dev/mock-data-absent-admin-plan-2026-06-14.md` §P1-b. 사용자 결재 = **신규 season_awards 테이블**.
> 본 문서 = **코드·DB·push 0 (read-only 실측 설계)**. schema diff는 임시 schema↔schema 미리보기(운영 DB 비접촉, 임시파일 즉시 삭제).
> 핵심 격리: **AW1 기본부(MVP/베스트5의 득점·어시·리바/부문별 득점·어시·리바왕)는 이미 MatchPlayerStat로 실연결 — 절대 미접촉. 고급부만 추가.**

---

## (a) 재사용 점검 — prefix 함정 회피 (P1-a 교훈 답습)

신규 결정 났으나 P1-a "prefix-grep 함정"(court_*가 13개나 실재했던 사례) 재발 방지 위해 **명명 grep 1회 + 재사용 후보 비교** 실측.

### A-1. `season_awards`/`awards`/유사 명명 테이블 grep — **부재 (신규 정당)**

| grep 대상 | 결과 |
|-----------|------|
| `model *[Aa]ward*` | **0건** (award 명명 모델 없음) |
| `@@map("*award*")` | **0건** |
| `model *[Ss]eason*` | `UserSeasonStat`(@@map `user_season_stats`) 1건 — **개인 시즌 통계**(games_played/wins/avg_rating/mvp_count). 시상 카테고리 부재 |
| `season`/`award` 문자열 전수 | UserSeasonStat / ShotZoneStat(season_year 필드만) / 매치코드 주석 — **시상 테이블 없음** |

→ **`season_awards` 신규 테이블이 정답.** UserSeasonStat은 "유저 1명 × 시즌 1행"의 누적 통계라 "올스타 5명·올해의 감독 1명·MVP 코멘트" 같은 카테고리별 다행 시상과 구조 불일치(재사용 시 행 의미 붕괴).

### A-2. community_posts(category=award) 재사용 비교 — **기각 (신규 우위)**

admin-plan §P1-b 대안 "별도 테이블 없이 community_posts(category=award) 재사용"을 실측 비교:

| 항목 | community_posts 재사용 | season_awards 신규 |
|------|----------------------|-------------------|
| season_year 필터 | ❌ 없음 (content/title 파싱·LIKE 의존) | ✅ 인덱스 컬럼 |
| category(올스타/감독/코멘트) | ❌ category는 'news/general'용 단일값 — 시상 세분류 충돌 | ✅ enum 컬럼 |
| 수상 선수 FK | ❌ user_id=작성자(관리자)일 뿐, 수상자 아님 | ✅ user_id=수상자 nullable FK |
| 수상 팀 FK | △ team_id 있으나 "글쓴이 팀" 의미 | ✅ team_id=수상팀 nullable FK |
| 코멘트/메트릭 | content(text)에 비구조 | ✅ payload(Json 구조) |
| /awards 조회 | category 오염 + 파싱 취약 | ✅ where season_year+category 직결 |

→ **community_posts 재사용은 "글" 모델에 "시상 레코드"를 욱여넣는 억지매핑** (P1-a court_edit_suggestions를 제보에 못 쓴 것과 동형 — 의도 방향 불일치). user_id가 수상자가 아닌 작성자라는 점이 결정타. **신규 테이블이 비용 동일·정합 우위.**

---

## (b) schema diff — 무중단 ADD-only (push❌, 미리보기만)

임시 schema에 모델만 추가해 `prisma migrate diff --script` 생성 (운영 DB 비접촉, 임시파일 즉시 삭제 = 가드3). 실측 결과:

```sql
-- CreateTable
CREATE TABLE "season_awards" (
    "id" BIGSERIAL NOT NULL,
    "season_year" INTEGER NOT NULL,
    "category" VARCHAR NOT NULL,
    "user_id" BIGINT,               -- 수상 선수 (nullable)
    "team_id" BIGINT,               -- 수상 팀 (nullable)
    "payload" JSONB NOT NULL DEFAULT '{}',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" BIGINT NOT NULL,   -- 입력 관리자
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "season_awards_pkey" PRIMARY KEY ("id")
);
-- CreateIndex ×3
CREATE INDEX "season_awards_season_year_category_idx" ON "season_awards"("season_year", "category");
CREATE INDEX "season_awards_user_id_idx" ON "season_awards"("user_id");
CREATE INDEX "season_awards_team_id_idx" ON "season_awards"("team_id");
-- AddForeignKey ×3
ALTER TABLE "season_awards" ADD CONSTRAINT "season_awards_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "season_awards" ADD CONSTRAINT "season_awards_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "season_awards" ADD CONSTRAINT "season_awards_team_id_fkey"
  FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
```

**무중단 판정**:
- **CREATE TABLE 1 + CREATE INDEX 3 + ADD FK 3 / ALTER 0 / DROP 0 / DELETE 0** → 기존 테이블·데이터 영향 0.
- `--accept-data-loss` **불필요** (court_submissions와 동일 — CLAUDE.md §DB 정책 "무중단 ADD COLUMN/신규 테이블만 자동").
- FK on delete: user_id/team_id = **SET NULL**(수상자·팀 삭제돼도 시상 행 보존 + 누가 받았는지만 null) / created_by = NO ACTION(관리자 기록 보존).

**schema.prisma 박제 시 추가 라인** (court_submissions 선례 동형):
- `User` 모델: `season_awards_received season_awards[] @relation("season_award_recipient")` + `season_awards_created season_awards[] @relation("season_award_creator")` (court_submissions_submitted/reviewed 바로 아래)
- `Team` 모델: `season_awards season_awards[] @relation("season_award_team")` (team_match_requests_sent 아래)
- 모델 본문: 위 SQL 대응 (court_submissions 패턴 — index/relation 명명 동형)

---

## (c) category enum 확정

admin-plan §P1-b 제시(all_star_1st·all_star_2nd·coach_of_year·new_face·mvp_quote) + awards page.tsx L28~34 "DB 미지원→준비중" 주석 목록 + awards-content.tsx 빈슬롯을 교차해 확정.

| category 값 | 라벨 | 대상 | /awards 폴백 위치(현재) | payload 예 |
|------------|------|------|------------------------|-----------|
| `all_star_1st` | 올스타 1st팀 | user (5명·display_order 0~4) | 베스트5 "수비"·"신인" 빈슬롯 + 확장 | `{ position?, comment? }` |
| `all_star_2nd` | 올스타 2nd팀 | user (5명) | (신규 섹션 or 토글) | `{ position? }` |
| `coach_of_year` | 올해의 감독 | user | page.tsx L31 "올해의 감독 미존재" | `{ team_name?, comment? }` |
| `new_face` | NEW FACE(신인상) | user | 베스트5 "신인" 빈슬롯 / 부문 미지원 | `{ comment? }` |
| `mvp_quote` | MVP 코멘트 | user | page.tsx L32 "MVP 코멘트 미존재" | `{ quote }` |
| `best_defense` | 수비왕 | user | 부문별 "스틸왕"/베스트5 "수비" 빈슬롯 | `{ comment?, spg? }` |
| `manner` | 매너상 | user | 부문별 "매너상" 빈슬롯(catSlots L86) | `{ comment? }` |
| `rating_up` | 레이팅 상승 | user | 부문별 "레이팅 상승" 빈슬롯(catSlots L85) | `{ comment?, delta? }` |

- **DB 강제 enum 아님** — `category String @db.VarChar` + 코드 상수(`SEASON_AWARD_CATEGORIES`)로 화이트리스트(Zod). 사유: 향후 카테고리 추가 시 운영 DB ALTER 회피(컨벤션 — court_type도 VarChar+코드 enum).
- user_id/team_id **둘 다 nullable**: 대부분 선수상(user_id) / `coach_of_year`도 user(감독=User) / **팀상 확장 여지**로 team_id 보유(현 8종은 전부 선수상이나 향후 "올해의 팀" 추가 시 무박제 수용).
- `display_order`: 올스타 5명 순서·동일 카테고리 다수(예: best5) 정렬용.

---

## (d) 단계 (스키마 → admin 입력 → /awards 고급부 연결)

P1-a 코트제보(3단계 분리커밋)와 **동형이되 핵심 차이 1**: 코트제보=사용자 제출 큐→관리자 승인 / **시상=관리자 직접 입력(제출 큐 없음)**. 따라서 [2]가 "사용자 제출 폼"이 아니라 "관리자 입력 폼".

| 단계 | 작업 | 담당 | 산출 |
|------|------|------|------|
| **[1] 스키마** | schema.prisma에 season_awards 모델 + User relation 2 + Team relation 1 ADD. **db diff 사용자 검토 후 push**(무중단). count 0 사후검증 | developer | CREATE 1+INDEX 3+FK 3 |
| **[2] admin 입력** | `/admin` 시즌 시상 입력 흐름. (가)신규 페이지 `(admin)/admin/season-awards/page.tsx` + content + server action `upsertSeasonAward`/`deleteSeasonAward` 또는 (나)`/admin/awards`. **선수 지정 UI** = 닉네임/이름 검색 → User 선택(autocomplete). super_admin 가드 | developer | 폼 + action |
| **[3] /awards 고급부 연결** | page.tsx에 season_awards 조회 5블록 **추가**(기존 5블록 보존) → DTO 확장 → awards-content.tsx 빈슬롯(수비/신인/스틸왕/레이팅/매너 + 올스타/감독/코멘트)을 season_awards 실데이터로 채움. 미입력 시즌 = "집계 중" 빈상태 유지 | developer | page+content |
| **[4] 검증** | tester(가드/snake 정합/AW1 기본부 diff 0) + reviewer(FK 변환·격리) **병렬** | tester+reviewer | PASS/APPROVE |

### [2] admin 입력 흐름 상세 (제출 큐 ❌ · 직접 입력 ✅)
```
관리자 → /admin/season-awards
  → 시즌(season_year) 선택 (드롭다운 — 예 2024/2025/2026)
  → 카테고리 선택 (8종 칩/select)
  → 수상자 지정:
       선수상 = 닉네임/이름 검색 input → /api/web/admin/users/search?q= (기존 admin user 검색 재사용 or 신규 최소 GET)
              → User 선택 → user_id 박제
       (팀상 확장 시 = 팀 검색 → team_id)
  → 코멘트/메트릭 입력 → payload Json
  → "추가" → POST upsertSeasonAward (super_admin 가드)
  → 현재 시즌 시상 목록 표 + 삭제 버튼
```
- **승인 트랜잭션 없음**(코트제보와 차이) — 관리자가 곧 source of truth라 단순 INSERT/DELETE.
- 선수 검색 UI: 신규 autocomplete 만들기 부담되면 **MVP는 "user_id 직접 입력 + 닉네임 미리보기"** 최소형도 가능(admin 전용·운영자 소수). planner 권장 = 가벼운 검색 GET 1개.

### [3] /awards 고급부 연결 상세 (page.tsx ADD-only)
- page.tsx 기존 5블록(seriesList/seasonMvp/leaders/finalsMvp/champions) **그대로** + **블록 6 신규**: `prisma.season_awards.findMany({ where:{ season_year } , orderBy:[category, display_order] , include:{ recipient, team } })`.
  - season_year 매핑: 현재 page.tsx는 `?series=<slug>`(tournament_series) 기반. season_awards는 `season_year:Int`라 **매핑 규칙 필요** → 옵션 (가)series.created_at 연도 추출 (나)season_awards에 series_id도 추가 (다)전체 시즌은 연도 드롭다운 별도. **권장=(가) 최소** or [1]에서 series_id nullable 추가 검토(PM 결재).
- DTO 확장: `AwardsDataDTO`에 `allStar1st: PlayerRefDTO[]` / `allStar2nd` / `coachOfYear` / `newFace` / `mvpQuote:{player, quote}` / `defenseLeader` / `mannerAward` / `ratingUp` 추가(전부 nullable·미입력 null).
- awards-content.tsx: 현재 **하드코딩 null 빈슬롯**(best5Slots L70-71 수비/신인, catSlots L84-86 스틸왕/레이팅/매너)을 DTO 값으로 교체. 값 있으면 표시, **null이면 기존 "준비 중/집계 예정" 폴백 유지**(mock❌). 올스타 1st/2nd·감독·MVP코멘트는 신규 섹션 or 기존 셸 확장.

---

## (e) AW1 기본부 보존 가드 (절대 미접촉 목록)

박제 시 developer가 **변경 0 보장**해야 할 기본부 (이미 MatchPlayerStat/mvp_player_id로 실연결):

| 기본부 항목 | 데이터원 | 보존 방식 |
|------------|---------|----------|
| 시즌 MVP | tournament.mvp_player_id (page.tsx L186~248) | 쿼리 블록 1글자도 미수정 |
| 베스트5 **득점/어시/리바** | match_player_stats raw SQL (L250~412) | scoring/assists/reboundsLeader 미수정 |
| 부문별 **득점왕/어시왕/리바왕** | 위 동일 leaders | catSlots[0~2] 미수정 |
| Finals MVP | tournamentMatch.mvp_player_id 결승 (L414~493) | 미수정 |
| 역대 우승팀 | champion_team_id (L495~569) | 미수정 |

- **고급부는 page.tsx에 블록 ADD만** — 기존 5블록 쿼리/DTO 필드/officialMatchWhere 가드 미접촉.
- awards-content.tsx에서 채우는 슬롯은 **현재 `player:null` 빈슬롯 한정**(L70/71/84/85/86) — 실데이터 슬롯(L66~69/81~83) 미접촉.
- **검증 증빙**: tester가 `git diff src/app/(web)/awards/page.tsx`에서 **기존 L186~569 쿼리 블록 변경 0** 실측. AW1 기본부 회귀 0.

---

## (f) 규모 / 위험

| 항목 | 평가 |
|------|------|
| 규모 | **中** (+450~650 LOC: schema +25 / admin page+content+action ~300 / page.tsx+content ~150 / Zod 상수 ~30) |
| 위험 | **低** — 무중단 ADD-only·신규 라우트(api/v1 0)·AW1 기본부 격리 |
| schema 위험 | ALTER/DROP 0 = 운영 데이터 영향 0. push 전 diff 사용자 검토(가드2) |
| 박제 함정 | snake_case 정합(apiSuccess 응답 / page.tsx server prisma는 camel) · season_year↔series 매핑 규칙(d-[3]) · 빈슬롯만 교체(실슬롯 미접촉) |
| 강조색 | extras-pages.css `.aw-*` 기존 토큰 재사용 — 신규 강조색 도입 시 `var(--cafe-blue)` (errors 06-10 빨강 폴백 함정 답습) |

---

## PM 결재 필요 (4건)

1. **[1]-Q season_year ↔ series 매핑**: (가)series.created_at 연도 추출 최소 / (나)season_awards에 `series_id BigInt?` 추가(시즌=series 1:1 정합) / (다)연도 드롭다운 별도. → **planner 권장 (나)** (현 /awards가 series 기반이라 정합 우위·추가 비용 미미). 사용자 선택.
2. **[2]-Q admin 위치**: 신규 `/admin/season-awards` 독립 페이지 vs 기존 `/admin` 확장. → 권장 **독립 페이지**(입력 폼 부피·courts 동형).
3. **[2]-Q 선수 지정 UI**: 검색 autocomplete(신규 GET 1개) vs user_id 직접입력 최소형. → 권장 **검색 autocomplete**(운영 편의).
4. **[3]-Q 올스타/감독/코멘트 표시 위치**: awards-content 신규 섹션 추가 vs 기존 베스트5/부문 셸 확장만. → [3] 진입 시 시안(Awards.jsx) 확인 후 결정.

**Stop conditions 준수**: 신규 테이블 무중단 ADD nullable만 / destructive 0 / push 사용자 승인 전제 / AW1 기본부 데이터패칭 변경 0 / api/v1 0.
