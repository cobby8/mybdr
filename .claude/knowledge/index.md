# 프로젝트 지식 목차
> 최종 갱신: 2026-05-04 (도메인 sub-agent P3 결정 — C 채택 / decisions +2 매치 v4+P3 / lessons +3 system prompt marginal·KPI 함정·Task 미등록) | 이전: 2026-05-04 (매치 코드 v4 Phase 1+2+3 — schema 6컬럼 + helper)

## 파일별 요약
| 파일 | 항목 수 | 최종 업데이트 | 설명 |
|------|--------|------------|------|
| architecture.md | 47 | 2026-05-04 | 페이지 구조, 대회/대진표, 팀명 2필드, Referee 시스템, Flutter API 호환, L3 다음 단위, 코트 대관 시스템 설계(2026-04-25), Phase 10-1 경기 평가/신고 시스템(2026-04-27), BDR v2 Hero 카로셀 + 글로벌 헤더 단일화 + 모바일 가드(2026-04-29), Dev/design/ 단일 폴더 룰 + BDR-current 동기화(2026-05-01), Phase 13 마이페이지 hub 박제(2026-05-01), D-6 EditProfile Hybrid 박제(2026-05-01), ProfileShell 폐기(2026-05-01), D-3 ProfileWeeklyReport Hybrid 박제(2026-05-01), Q1 Reviews + ContextReviews 박제(2026-05-01), 듀얼토너먼트 풀 시스템 설계(2026-05-02), STL (Single Truth Layer) Phase 1(2026-05-02), minutes-engine v3 — 출전시간 계산 엔진 메인 path 4단계 (2026-05-03), **알기자 Phase 1 DB 영구 저장 마이그 — tournament_matches.summary_brief + 트리거 통합 (Promise.allSettled, 1회 트리거 → 본+요약 2개 동시 생성) + tab-summary client fetch 제거(2026-05-04)** |
| conventions.md | 36 | 2026-05-04 | 디자인/색상/경기집계/sticky/프린트CSS/공식 기록 가드/에이전트 호출 기준/스크립트 템플릿 재사용/세션 분리 원칙/Tailwind v4 color-mix 언더스코어 문법(04-22)/any 예외 규칙 kakao·HOF·SW(04-22)/모바일 최적화 체크리스트 10항목(04-29) / 팀 로고 업로드 자동 정규화 pipeline(05-02) / placeholder ↔ real user 통합 표준 함수 mergePlaceholderUser(05-03) / minutes-engine 가드 범위 — 양팀 union 기준 통일 5~12(05-03) / community_posts 사용자 노출 query status 필터 의무(05-04) / 알기자 본문 노출 = LinkifyNewsBody 의무(05-04) / **prisma db push --accept-data-loss 회피 = prisma db execute 직접 SQL 우회 (CLAUDE.md DB 정책 준수)(05-04)** |
| decisions.md | 100 | 2026-05-04 | 기술 결정 (KBL 순위/대진표/userId 연결/Referee v2/헬스체크 cron/공식 기록 가드/카페 정규식 파서/운영 DB 직접 연결/카페 dataid tie-break / 공지 방어 가드 / 과거 글 시분 원천 미제공 확정 / Phase 3 #6 Pagination / L3 Organization 기존 라우트 활용 / EditionSwitcher 동작 규약 / 카페 3게시판 전면 board 강제 + parser 힌트 metadata화 / 세션 역할 재정의 / 코트 대관 court_managers N:M 보류 / 코트 대관 payments 다형성 / 모바일 720px 통일 / Hero 카로셀 외부 lib 0 / 카로셀 absolute opacity stacking / iOS 16px input 강제(04-29) / ProfileShell 폐기 children passthrough(05-01) / D-6 EditProfile Hybrid 옵션 B(05-01) / D-3 ProfileWeeklyReport 옵션 B Hybrid(05-01) / Q1 Reviews 옵션 A 비노출(05-01) / 듀얼토너먼트 schema 변경 0 + 5 Phase(05-02) / STL Phase 1 도입(05-02) / Admin-Web 시각 통합 alias 9개 보강(05-02) / minutes-engine B 옵션 채택(05-03) / 알기자 Phase 1 영구 저장 = tournament_matches.summary_brief JSON 옵션 B(05-04) / 알기자 트리거 통합 Promise.allSettled(05-04) / 도메인 sub-agent 옵션 A 채택 + 시범 live-expert(05-04) / 매치 코드 v4 채택 — 26-GG-MD21-001 형식(05-04) / **도메인 sub-agent P3 결정 — C 채택 (live-expert 유지 + 신규 박제 0 / system prompt 주입 marginal gain ≈ 0 / planner 사전 분석이 진짜 본질 / 7 사유 단호함)(05-04 첫 항목)**) |
| errors.md | 33 | 2026-05-04 | 에러 패턴 (sticky, @page Hancom PDF, th/td 정렬, DB 사고, add 누락, next/image 외부 호스트, apiSuccess 미들웨어 7회 재발, 카페 상세 HTML 시간 소스 `.num_subject` 단일, 모바일 가로 overflow grid 안티패턴(04-29) / Avatar 영문 overflow(04-29) / schema 변경 후 dev 서버 미재시작 prisma Unknown argument(04-29) / organizations 목록 status 필터 'active' 값(05-01) / profile PATCH 500 birth_date Invalid Date(05-01) / `/live/[id]` 셋업팀 명단 0명(05-02) / Flutter app 의 PBP 누락 패턴(05-02) / 폴드5 외부 분기 부재(05-02) / team_members.userId NOT NULL → placeholder User 강제(05-03) / PBP 미달 본질 Flutter 운영자 입력 누락(05-03) / placeholder ↔ real user 통합 시 3종 UNIQUE 충돌(05-03) / minutes-engine endLineup chain 가드 범위 버그(05-03) / 🚨 community_posts.status 필터 부재 (05-04) / 모바일 Hero 우측 actions invisible — CSS Grid item min-width:auto 함정(05-04) / **Prisma relation camelCase ↔ schema @@map snake_case 분리 — 첫 시도 fail (05-04 첫 항목)**) |
| lessons.md | 35 | 2026-05-04 | 교훈 (프린트 API, 모바일 zoom, 브랜치 drift, Flutter 테스트 오염, 팀 병합 logo, 동명이인, HTTP 5xx, API 미들웨어 재발 4회, 다음카페 정규식 파서 95%, 개발 DB라 믿은 .env가 운영 DB, parser 키워드보다 운영자 명시 신호(게시판)가 1순위, 점진 정비는 영역 단위로 묶어야 커밋 중복 비용 안 발생, 헤더 변경 라우트 그룹별 영향 범위(04-29) / Phase 9-Mobile 안티패턴 재발 → 컨벤션 문서화(04-29) / Hero 카로셀 1일→2시간 단축(04-29) / revert + 부분 hub 패치 = sub 페이지 옛 sidebar 잔재(05-01) / Vercel 로그 접근 불가 환경 prisma 500 진단(05-01) / PBP score_at_time 시계열 활용(05-02) / 출전시간 미달 분석 = 엔진 정확도 vs 데이터 부족 분리(05-03) / raw 정확도 비교 시 알고리즘 버전 명시 필수(05-03) / Supabase Storage bucket 생성 우회(05-04) / CSS Grid item min-width:auto 함정(05-04) / prisma generate Windows EPERM(05-04) / **도메인 sub-agent system prompt 주입 효과 marginal — planner 사전 분석이 진짜 본질(05-04) / KPI 측정 시 작업 복잡도 통제 없으면 비교 불가(05-04) / Task subagent_type 미등록 = 도메인 에이전트 자동 호출 불가 (CC 한계)(05-04 첫 항목)**) |
| toss-design-analysis.md | 10 | 2026-03-28 | 토스 디자인 시스템 심층 분석 |
| ux-audit-report.md | 28 | 2026-03-28 | UI/UX 사용성 심층 조사 |
| project-structure-audit.md | 10 | 2026-03-28 | 전체 구조 분석 |

## 최근 추가된 지식 (최근 10건)
- [05-04] decisions: **도메인 sub-agent 시스템 P3 결정 — C 채택 (live-expert 유지 + 신규 박제 0)** — KPI 6건 누적 분석 결과 잘못된 파일 0회 6/6 중 5건이 일반 dev 컨텍스트 (system prompt 주입 ❌) → **planner 사전 분석이 진짜 본질**, 주입 marginal gain ≈ 0. 7 사유 단호한 권장 (A 6h / B 3h 매몰비용 / D live 박제 손실 / E 14일 추가 한계 효용 0 모두 거부). 후속: live-expert.md 영구 운영 + 신규 박제 0 + KPI 측정 종료 + lessons 3건 박제. 미래 모호 디버깅 케이스 발견 시 재진입 옵션 보존. plan §11
- [05-04] lessons: **도메인 sub-agent system prompt 주입 효과 marginal — planner 사전 분석이 진짜 본질** — P2 KPI 6건 측정 결과 잘못된 파일 0회 6/6 중 system prompt 주입 적용 1건 / 일반 dev 5건 → 주입 marginal gain ≈ 0 입증. planner 가 파일 경로/절대 룰/핵심 지식 사전 박제 → developer 가 주입 없이도 0회 달성. 주입은 planner 작업 중복 박제일 뿐. PM 호출 룰 = 명확 정의 작업은 planner 만으로 충분, 모호 디버깅만 도메인 sub-agent 가치. knowledge sync = 절대 룰만 system prompt + 핵심 지식 = knowledge 인용 (single source)
- [05-04] lessons: **KPI 측정 시 작업 복잡도 통제 없으면 비교 불가** — P2 시범 KPI 1 (grep/read -50%) + KPI 2 (시간 -30%) 비교 불가. 작업별 복잡도 다름 (live page.tsx 1926줄 헤더+팀비교 vs tournaments schema 6컬럼). 함정 = 다른 작업 시간 직접 비교. 재발 방지 = 동일 작업 양쪽 적용 또는 작업 복잡도 정규화 변수 (LOC/파일 수) 사전 정의. binary 지표 (잘못된 파일 0회 vs 1+회) 는 통제 무관. 메타 시범 측정 시 동일 함정 회피
- [05-04] lessons: **Task subagent_type 미등록 = 도메인 에이전트 자동 호출 불가 (CC 한계)** — `.claude/agents/<name>.md` 박제 후 Task 도구 subagent_type 목록 자동 등록 ❌. 글로벌 8 에이전트만 등록. 우회 = planner/dev 위임 시 system prompt 풀텍스트 prompt 첫머리 주입. planner 단계 거쳐야 함 = 추가 비용. 본 한계 = 도메인 에이전트 자동화 critical bottleneck. P3 = C (신규 박제 0) 핵심 사유. 재진입 조건 = CC 가 프로젝트 로컬 에이전트 자동 등록 지원 시
- [05-04] errors: **Prisma relation camelCase ↔ schema @@map snake_case 분리 — 첫 시도 fail** — `prisma/schema.prisma` `@@map("tournament_matches")` 가 DB 테이블명 snake_case 매핑하지만 prisma client field 명은 모델명 camelCase 복수형 (`tournamentMatches`). 첫 시도 `tournament.tournament_matches` 사용 시 "Unknown field" 에러. fix = `tournament.tournamentMatches` 정정. 재발 방지 = 임시 스크립트 작성 시 prisma client 명명 = camelCase relation 명 우선 확인 (`@map`/`@@map`은 DB 컬럼/테이블, TS field와 별개). 매치 코드 v4 Phase 3 backfill (commit bec591b)
- [05-04] lessons: **prisma generate Windows EPERM — dev server query_engine.dll 잠금** — `npx prisma db push` 또는 `npx prisma generate` 실행 시 Windows + dev server (port 3001) 가 `node_modules/.prisma/client/query_engine-windows.dll.node` 잠금 → EPERM. fix 절차 = ① `netstat -ano | findstr :3001` PID 확인 ② `taskkill //f //pid <PID>` (CLAUDE.md 룰: `taskkill //f //im node.exe` 절대 금지) ③ `prisma generate` ④ `npm run dev` 백그라운드 재기동. 재발 방지 = schema 변경 후 dev server 떠있으면 prisma generate ❌ → 사전 PID 종료 → generate → 재기동 순서. 운영 무관 (Windows + dev server 동시 환경만)
- [05-04] conventions: **prisma db push --accept-data-loss 회피 = prisma db execute 직접 SQL 우회 (CLAUDE.md DB 정책 준수)** — 신규 NULL ADD COLUMN + UNIQUE 제약 추가 시 `prisma db push` 가 `--accept-data-loss` 요구 → CLAUDE.md 절대 금지 룰 위반 (운영 데이터 파괴 위험). 우회 = `prisma db execute --file=scripts/_temp/v4-schema.sql` 직접 SQL (CREATE UNIQUE INDEX IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS). 사전 SELECT 1건 (count baseline) + 사후 verify (information_schema.columns) + 임시 SQL 즉시 삭제. NULL 허용 ADD COLUMN 만 무중단 — NOT NULL/DROP/ALTER TYPE 은 추가 승인 필요. 매치 코드 v4 Phase 1 (commit 8af51eb)
- [05-04] errors: **모바일 Hero 우측 actions 시각 invisible — CSS Grid item min-width:auto 함정 + 캐시 가설 우선 함정** — community 페이지 5차 fix 후에도 우측 actions 안 보이는 회귀. 6차 fix 끝에 본질 확정 = `.with-aside` grid 의 `<main>` 자식 grid item 의 `min-width: auto` (default = min-content) 가 자식 nowrap 컨텐츠 (게시글 board) 따라 main 을 viewport 너머로 확장 (모바일 viewport 440 → main 845px). 우측 column actions 가 viewport 밖. 진단 함정 = SW 캐시 / chunk hash / Turbopack HMR 모두 시도했지만 무관. 결정적 검증 = 콘솔 `getBoundingClientRect()` 으로 actions x:704 (viewport 밖) 즉시 발견. fix 1줄 = `globals.css .with-aside > main { min-width: 0 }`. 회귀 방지 룰 = grid item 에 min-width:0 명시 의무. 진단 순서 = DOM 검증 우선/캐시 마지막. commit 2927756
- [05-04] lessons: **CSS Grid item min-width:auto (default) 함정 — 자식 nowrap 컨텐츠로 컨테이너 viewport 너머 확장** — 본질 동일 (errors 와 쌍). 디버그 outline 패턴 (`outline:3px solid red, background:yellow, zIndex:999`) 효과적 — 사용자 직접 PC/모바일 차이 발견 결정적 (스크린샷 #14). 재사용 가치 = 모든 grid 컨테이너 + main grid item + 자식 nowrap 패턴 (테이블/긴제목/가로스크롤) 에 동일 본질. 통일 fix 6 페이지 (community/courts/rankings/teams/tournaments + .games-filter-btn 통일).
- [05-04] decisions: **알기자 기사 사진 schema = news_photos 별도 테이블 채택 (옵션 B)** — 옵션 3개 (A=community_posts.images JSON 활용 / B=news_photos 별도 테이블 / C=URL 만 단순 list). 채택 B 사유: 매치 1:N 자연스러움 / 인덱스 풍부 (match_id+is_hero, match_id+display_order) / 메타 풍부 (caption, exif_meta JSON, size_bytes, uploaded_by) / Cascade 정책 (매치 삭제 시 사진 자동 정리). schema +25줄, community_posts.images 영향 0 (카페 댓글 메타용 그대로).
- [05-04] conventions: **알기자 기사 사진 정규화 룰 — long-edge 1920px + WebP 80% + EXIF 회전 자동 + isHero 단일 보장** — sharp pipeline 의무 적용 (long-edge 1920 비율 유지, withoutEnlargement / WebP quality 80, 모바일 5MB → ~500KB / `.rotate()` EXIF orientation 자동 적용 / isHero 단일 트랜잭션 / display_order auto increment / Storage path = match-{matchId}/{ts}-{rand}.webp). 허용 MIME = jpeg/png/webp/heic/heif (HEIC=iPhone), 최대 10MB. 모바일 카메라 = `<input capture="environment">` 직접 호출.
- [05-04] errors: **🚨 community_posts.status 필터 부재 — 알기자 draft 7건 무단 노출 사고 (4파일)** — 5/4 알기자 backfill 7건 (post 1373~1379, status=draft) 정상 INSERT 후 BDR NEWS 카테고리에 모두 노출. 사용자 직접 보고 (스크린샷). 본질 = community_posts 사용자 노출 query 4 파일에 status 필터 부재. fix = `/api/web/community/route.ts` (list) + `(web)/community/[id]/page.tsx` (상세) + post-detail-sidebar.tsx (작성자글수+인기글) + sitemap.ts 모두 `where.status = "published"` 추가. 영향: 일반 사용자 1251건 그대로 / 알기자 draft 7건 즉시 숨김. 회귀 방지 룰 = community_posts 사용자 노출 query는 status 필터 의무 (conventions.md 룰 추가). commit 05677ed
- [05-04] conventions: **community_posts 사용자 노출 query status 필터 의무 + 검수 카테고리 도입 시 4단계 점검 룰** — `community_posts.findMany/findUnique/count/groupBy` 사용 시 사용자 노출 query 는 반드시 `where.status = "published"` 명시. admin actions 외 모두 적용. 검수 카테고리 도입 시 4단계 점검 (INSERT status / list filter / 상세 filter / sitemap filter). 점검 명령 = grep `community_posts\.(findMany|findUnique|count|groupBy)` 후 status 필터 부재 query 일괄 fix. 5/4 알기자 사고 사례 박제.
- [05-04] conventions: **알기자 (BDR NEWS) 본문 노출 위치 = LinkifyNewsBody 의무 사용 — 헬퍼 buildLinkifyEntries 통합** — 알기자 게시물 (category=news + tournament_match_id) 본문 렌더링 위치 모두 LinkifyNewsBody 의무 사용. plain text (split/p) 금지. 헬퍼 시그니처 = `buildLinkifyEntries(matchId)` 단일 / `buildLinkifyEntriesBatch(matchIds[])` 배치 (admin/news N+1 query 방지). 5/4 사용자 보고 (admin 미리보기엔 자동 링크 / community 본문엔 plain text 일관성 부재) → community/[id]/page.tsx + news/match + admin/news 3곳 모두 헬퍼 사용. commit 3cd1249
- [05-04] decisions: **도메인 sub-agent 시스템 도입 — 옵션 A 채택 + 시범 live-expert 단독 시작** — mybdr (web 30+/api 50+/architecture.md 26K) 전수조사 디버깅 한계 → 도메인별 sub-agent 8개 신설 결정. 8 도메인 = tournaments-expert / live-expert ⭐ (시범) / referee-expert / flutter-api-expert / admin-expert / teams-courts-expert / profile-community-expert / design-system-expert (정량 근거 = 200 commits scope 빈도). 시범 = live-expert 단독 (알고리즘 깊이 / 단일 파일 / test 21/21 / 회복 비용 최저). KPI 3종 (grep -50% / 시간 -30% / 잘못된 파일 0회) 2주 측정. Phase 5단계 ~6주 (P1 박제 1.5h → P2 첫케이스 → P3 KPI Go/No-Go → P4 확대 3개 → P5 전체 8개). 롤백 6종 / 리스크 8종 + 완화 명시. 거부 옵션 = B knowledge분할 / C feature-map / D MCP-style search / E 조합. P1 완료: `.claude/agents/live-expert.md` 박제. 전체 plan = `~/.claude/plans/dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md`
- [05-04] architecture: **알기자 Phase 1 DB 영구 저장 마이그 — tournament_matches.summary_brief + 트리거 통합** — schema 변경 (`tournament_matches.summary_brief Json?` NULL 허용 ADD COLUMN, 무중단) + `auto-publish-match-brief.ts` 통합 (Promise.allSettled로 publishPhase1Summary + publishPhase2MatchBrief 독립 병렬) + `/api/live/[id]` 응답에 summaryBrief 필드 + tab-summary.tsx client fetch 완전 제거 (useState/useEffect/BriefResponse 모두 제거, props 직접 사용). 5/4 backfill: completed 35매치 중 34건 UPDATE 성공 (평균 175자, 목표 150~250 적중). 사용자 의도 vs 5/3 구현 Gap 4건 (G2/G3/G4/G5) 모두 해소. 멱등성: Phase 1=summary_brief 있으면 skip / Phase 2=community_post 있으면 skip 각각 독립.
- [05-04] decisions: **알기자 Phase 1 영구 저장 위치 = tournament_matches.summary_brief JSON 컬럼 채택** — 옵션 3개 비교 (A=community_posts에 phase 컬럼 / B=tournament_matches.summary_brief / C=별도 match_summaries 테이블). 채택 B 사유: 매치와 1:1 관계가 가장 자연스러움 / 라이브 페이지 fetch 시 매치 데이터와 함께 1번에 가져옴 (JOIN 추가 X) / JSON metadata 함께 저장. 추후 라운드/일자 종합 요약 도입 시 별도 테이블 분리 검토.
- [05-04] decisions: **알기자 트리거 통합 = Promise.allSettled 패턴 채택 (Phase 1+2 독립 실행)** — `triggerMatchBriefPublish(matchId)` 함수 시그니처 유지 (호출자 변경 0) + 내부 `Promise.allSettled([publishPhase1Summary, publishPhase2MatchBrief])`. 옵션 비교: 순차 실행은 한쪽 실패 시 다른쪽 차단 / 단일 함수 합치기는 prompt 복잡화. allSettled 채택 사유: 한쪽 실패 ≠ 다른쪽 영향 (사용자 의도 "매치당 정확히 2개" 보장) + fire-and-forget 패턴 유지 + 향후 Phase 3 (라운드/일자) 확장 가능.
<!-- 5/3 7건 (minutes-engine v3 architecture / 가드 범위 conventions / B 옵션 decisions / raw 정확도 lessons / endLineup 가드 errors / mergePlaceholderUser conventions / placeholder UNIQUE errors) 절단 (10건 유지 — 5/4 매치 코드 v4 prisma 3건 prepend로 13건 → 다음 작업 시 추가 정리 큐). 절단 + 이전 8건 (PBP 미달 본질 / 출전시간 분석 / NEXT_PUBLIC_APP_URL / 알기자 brief Phase 1 / LLM prompt 위치 / 가입 신청 일괄 처리 / team_members.userId NOT NULL / 알기자 BDR NEWS Phase 2 통합) 모두 git log -- .claude/knowledge/ 로 복원 가능 -->

- [05-02] decisions: **Admin-Web 시각 통합 — alias 9개 보강 채택** — `mybdr.kr/admin/users` 운영 화면이 (web) BDR-current 와 시각 갭 (검색 버튼 색 미적용 / ★ 빨간색 안 보임). 진단: admin 코드 405건이 사용 중인 alias 9개 (`--color-accent` `-hover` `-light` `-error` `-warning` `-success` `-border-subtle` `-text-dim` `--shadow-card`) 가 globals.css 에 미정의 → 빈 값. 옵션 3개 (alias 추가/admin 405건 일괄 변경/admin 다크모드 강제). 채택: 옵션 1 — globals.css 라이트·다크 alias 블록에 9 변수 추가 (5분, 1 파일, web 영향 0, admin 자동 정합). 다크모드 강제 거부 (사용자 명시). Phase 2 동시 (admin-table thead → `var(--bg-head)`). commit f8fe8f0. 추후 Phase 3~7 인라인 → 글로벌 클래스 별도 큐
- [05-02] architecture: **STL (Single Truth Layer) Phase 1 — 라이브 페이지 데이터 무결성 응답 가공 레이어** — `src/app/api/live/[id]/route.ts` 단일 파일 +200줄. 4개 데이터 출처 (match.homeScore/matchPlayerStat/quarterStatsJson/play_by_plays) 간 불일치를 서버 응답 단계에서 일관 1개 데이터셋으로 재구성. 3 Layer 구조: (L1) 신뢰도 우선순위 (L2) 자동 보정 룰 R1/R3/R4/R8 (L3) DB 영구 보정 미적용. R1 score_at_time 시계열 + 매치 헤더 cap / R3 quarterStatsJson 부분 누락 보충 / R4 minutesPlayed=0 fallback / R8 quarter length 동적. PBP sync 가드 이중 (local_id startsWith manual-fix-* OR description startsWith [수동 보정]). 매치 6건 검증 통과. Flutter app 영향 0. 관련 commit: 0f8da8e/b18227c/8ccd4dd/f0278b4/1bec5c3
- [05-02] decisions: **STL Phase 1 도입 — 옵션 1 응답 가공 채택 + R5 폐기** — Flutter app 수정 별도 프로젝트 + 시간 소요 → 서버 측 즉시 보완 필요. 5개 옵션 분석 (응답 가공/DB INSERT/알림만/quarterStatsJson 점수 활용 ❌ 불가/음수 gap 처리). 채택: 옵션 1 (응답 가공) 단독 — DB 무결성 0, sync 영향 0, 라이브 즉시 효과. R5 (코트 정원 위반) 폐기 — 사용자 지적: 농구 룰상 발생 불가. 사용자 통찰 반영 사례: R1 v1 (마지막 쿼터 일괄 분배) → v2 (score_at_time 시계열 정확 분배 + cap)
- [05-02] errors: **Flutter app 의 PBP 누락 패턴 — 박스스코어 vs PBP 분리 (운영 18 매치 56% 발생)** — 매치 헤더 vs PBP 합 차이 평균 4.8점. matchPlayerStat 100% 정확 / made_shot/sub PBP 일부 누락. 8 시나리오 (빠른 점수 단축/박스스코어 직접 편집/undo/자유투 시퀀스/정정/올아웃/네트워크/crash). 매치 132 임강휘 케이스: matchPlayerStat fg 1/4 / PBP made_shot 0건 → 시나리오 A·B 추정. 서버 STL Phase 1 로 보완. 보고서: `Dev/bug-report-flutter-allout-pbp-2026-05-02.md` + `Dev/bug-report-quarter-score-mismatch-2026-05-02.md` (원영 전달용)
- [05-02] errors: **폴드5 외부 (~388px) 등 극세 viewport 분기 부재 — 480 미만 단일 분기 → Hero 팀명/TOTAL 헤더 잘림** — 갤럭시폴드5 외부 (388px) 에서 "셋업(SET UP)" → "셋업(S..." / "TOTAL" → "TOTA..." ellipsis. 모바일 0~479px 단일 분기로 폴드 외부 / 작은 폰 미고려. 수정: hero-scoreboard.css 에 `<400px` base + `400px+` 분기 추가 (3-tier). 회귀 방지 룰: Tailwind `xs:` (≤479px) 또는 명시적 `< 400px` base + `400px+` 분기 권장. commit d046ab1
- [05-02] lessons: **PBP `score_at_time` 시계열 활용 — 사용자 통찰로 보정 알고리즘 정확도 향상** — STL R1 초기 설계 "마지막 쿼터 일괄 분배" → 사용자 "나중에 문제될 것 같다" 지적 → 매치 102 (gap +4/+4) score_at_time 시계열 분석 → Q1+2/0, Q2 0/+2, Q3+2/+2 정확 식별 → 알고리즘 재설계 (쿼터별 직접 분배 + 매치 헤더 cap). 원리: Flutter app 이 made_shot PBP 자체는 누락해도 다음 PBP score_at_time 에는 갱신된 점수 반영 → 절대 점수 시계열은 정확. 재사용 패턴: "보정 알고리즘 설계 시 사용자 도메인 지식 = 절대값 시계열 같은 단서. 통계만 보고 평균 분배 X"
- [05-02] conventions: **팀 로고 업로드 자동 정규화 pipeline** — `/api/web/upload` 가 `bucket === "team-logos"` 일 때만 sharp 정규화 (정방형 + 8% padding + 512×512 + PNG). `image-processor.ts` 에 `normalizeTeamLogo(buf): Promise<Buffer>` 추가 (기존 `optimizeDocumentImage` 와 분리 — 그레이스케일 ❌). 호출자 3곳 (step-emblem / manage / image-uploader) 변경 0 — bucket 만 일치하면 자동 적용. 16팀 일괄 commit 637c55e 의 검증된 pipeline 신규 업로드에 일관 적용. 다른 bucket (tournament-images / court-photos) 영향 0 (16:9 배너 등 원본 비율 보존). 정규화 실패 시 원본 그대로 (best effort) + console.warn. tsc 통과 + tsx 단위 5 케이스 (가로/세로/정사각/초소형/초대형) 모두 512×512 PNG 출력 검증
- [05-02] errors: **`/live/[id]` 라이브 페이지 awayTeam 선수명단 빈칸 — TournamentTeam 등록 시 team_members 동기화 누락** — `/live/133` 셋업팀 0명 표시 (홈 SA 9명 정상). 5/2 동호회최강전 16팀 중 9팀 동일 (셋업/MZ/블랙라벨/다이나믹/MI/슬로우/우아한스포츠/MSA/SKD). 원인: `Team→TournamentTeam` 등록 시 `team_members→tournament_team_players` 자동 복사 hook 부재. 등록 row 만 생기고 선수 0건. API (`/api/live/[id]/route.ts:36-48`) 는 `tournament_team.players` 만 조회 → 빈 응답. 진단: prisma `tournamentTeam.findUnique({ include: { players, team: { include: { members } } } })` 로 `players=0` vs `members=15` 비교 즉시 확인. 수정: `scripts/_temp/sync-setup-tournament-players-2026-05-02.ts` 일회성 (DRY-RUN → manager/coach 제외 → INSERT createMany 13건) → 검증 → 즉시 삭제. 코드 변경 0. 회귀 방지: 장기 큐 (가입 hook 자동 동기화) / 단기 운영 룰 (대회 시작 전 16팀 player_count=0 SELECT 점검) / CLI 진단 패턴 (라이브 빈칸 → tt.players vs team.members 비교). 잔여 8팀 보정 PM 큐
- [05-02] architecture: **듀얼토너먼트(`dual_tournament`) 풀 시스템 설계 — 27 매치 generator + 5 Stage 시각화** — B 대회 (id=`138b22d8…`, 16팀 / 5/2~5/10) 사례. 16팀 → 4조×4팀 미니 더블엘리미 → 8강 단판 → 4강 NBA 크로스(1+4/2+3) → 결승 = 27 매치. **schema 변경 0** (next_match_id + settings.loserNextMatchId/Slot + group_name + bracket_level + bracket_position + roundName 모두 기존 활용). 신규 3 (`dual-tournament-generator.ts` + `dual-progression.ts` + `seed-tournament-B-schedule.ts`) / 수정 4 (bracket-settings-form + bracket route + matches PATCH route + admin bracket page). 변경 0 (admin matches page + score-updater + bracket-builder Phase F 큐). 5 Phase 점진 도입 (A 인프라 ~2h / B settings·route ~1.5h / C progression hook ~1.5h / D admin UI ~1.5h / E B 대회 운영 적용 ~2h) + Phase F 공개 페이지 시각화 별도 큐. createMany + next_match_id 2단계 update 패턴 (자기 참조 FK 회피). 4강 크로스 = `8강1+8강4 / 8강2+8강3` bracket_position 매핑
- [05-02] decisions: **듀얼토너먼트 — schema 변경 0 + 5 Phase 점진 도입 + 결정 6건** — (1) 조 배정 = settings 수동 (snake 자동은 사진과 다름 / 즉시 적용 / 드래그 UI Phase F 큐) (2) 시드 = TournamentTeam.seedNumber 기존 컬럼 (BDR API 의존 회피) (3) 진출 트리거 = matches PATCH route 통합 (single/full_league_knockout 도 부재라 통합 효과 / Phase B5+C7 회귀 게이트) (4) 결승 단판 + 3·4위전 없음 (사진 정합) (5) clear 정책 single 패턴 유지 (B 대회는 매치 0건이라 첫 생성 OK) (6) bracket-builder Phase F 까지 round_number 그룹핑 유지. **schema 변경 0 보장** — loser 추적은 settings JSON. 대안 배제: schema 변경(과잉) / generator 1개 통합(책임 분리 위배). Phase E 운영 DB 사용자 승인 게이트 명시
- [05-01] errors: **profile PATCH 500 'Internal error' — birth_date Invalid Date 미가드** — `route.ts:119` `new Date(birth_date as string)` 가 잘못된 형식 입력 시 Invalid Date → `prisma.user.update` 가 PrismaClientValidationError throw → catch fallthrough → 500. 진단 = 로컬 tsx 로 운영 DB 직접 호출 (`scripts/_temp/diagnose-profile-save.ts`) Test E 만 실패. 수정 = 이중 방어선: route.ts 파싱 분리 + isNaN 가드 → `apiError("생년월일 형식이 올바르지 않습니다.", 400)` / page.tsx payload 구성 시 동일 isNaN 체크 (UX 보정 — null 송출). **회귀 방지 룰 신설**: API route 의 `new Date(externalString)` 패턴은 항상 `isNaN(d.getTime())` 가드 필수. 점검 후보 (별도 큐): tournament startDate/endDate/registration_*, game scheduled_at. 부수 발견: 사용자 (id=2836) `position` 컬럼 `"PG,SG,SF"` multi — 시안 단일 폼 저장 시 손실 위험 (별건)
- [05-01] lessons: **Vercel 로그 접근 불가 환경에서 prisma 500 진단 — 로컬 tsx 직접 호출** — 운영 API 500 + 응답 body 만 + Vercel 로그 접근 불가 + 배포 사이클 시간 부족 상황의 1분 내 진단. `.env` 운영 DB 로 connect 후 prisma.user.update 를 단계별 (필드별) 재현. 어느 필드 조합에서 PrismaClientValidationError 가 터지는지 좁힘. 가드: 본인 1명 user 만 update / 무해한 값 (현재 동일) 또는 Prisma reject Invalid value 만 시도 / 다른 사용자 데이터 영향 절대 X. 재사용 템플릿: `Dev/cli-prompts/2026-05-01-profile-save-500-direct-diagnose.md`
- [05-01] architecture: **Q1 Reviews + ContextReviews 박제 — 4탭 → 1탭 + 신규 재사용 컴포넌트** — 시안 [Phase 16] 통합 리뷰 4탭 → 1탭(코트만) + ContextReviews 신규 컴포넌트(351줄, kind="court"|"series"|"player" props) + /courts/[id] 인라인 교체. 신규 2 (context-reviews 351 + court-reviews-section 251) / 삭제 1 (옛 court-reviews -287) / 수정 4 (review-form/star-rating v3 토큰 마이그 + page.tsx 교체 + reviews-content 4탭 제거 -22). 4탭 UI 깔끔 제거 (Q1-A 주석 X — git log 복구). v3 토큰 마이그 동시 처리 (Q1-C — color-surface→bg / color-primary→accent / color-error→err 등 4 파일). REVIEW_CATEGORIES 5항목 + SWR/POST/DELETE/mutate 100% 보존. tsc + 13 룰 + 회귀 4 + 작업 범위 외 침범 0. 후속 큐: _components/ 11 파일 + courts/[id]/page.tsx 19건 옛 토큰 잔존 (별도 큐) / ContextReviews series/player 도입 / `/reviews?courtId=...` deep-link
- [05-01] decisions: **Q1 Reviews 옵션 A 비노출 / B 코트만 / C 동시 마이그 채택** — 4탭 축소 시 (A) 비노출 (주석 dead code 부채 회피, git log 복구) / ContextReviews 도입 범위 (B) 코트만 우선 (/tournaments + /users 별도 큐) / 옛 토큰 정리 (C) 동시 처리 (같은 4 파일이라 별도 commit 비효율). D-6 Hybrid 패턴 일관 적용
- [05-01] errors: **organizations 목록 status 필터에 실재하지 않는 'active' 값** — `src/app/(web)/organizations/page.tsx:34` 가 `status: "active"` 로 필터링하던 1줄 버그. organizations.status 도메인은 'approved/pending/rejected' (schema/생성 API/admin approve 모두 일관) — 'active' 는 절대 발생 안 함. 영향: BDR 단체 등 모든 단체 노출 0 상태. 수정: `"active"` → `"approved"`. commit `08898cb` push. 재발 방지: status 필터 추가/수정 시 schema default + 생성 API + admin route 4지점 cross-check / 모델별 status 도메인 분리 인지(organizations ≠ tournament_series ≠ tournament). 관련: `api/web/organizations/route.ts:45,75` (생성), `prisma/schema.prisma:2222`. 동시 작업: DB 동호회최강전 중복 2건 정리 (A 폐기 cancelled+is_public=false / B 발행 registration_open+is_public=true)
- [05-01] architecture: **D-3 ProfileWeeklyReport Hybrid 박제 — 시안 v2.4 + TOP 3 코트 보존** — `src/app/(web)/profile/weekly-report/page.tsx` 920→1125 (+205). 시안 v2.4 (KPI 4 라벨 + Highlight 1경기 + 다음 주 추천 3) 박제 + 옛 운영 §04 TOP 3 코트 + §06 지난주 비교 보존 (Hybrid 옵션 B). SWR `/api/web/profile/weekly-report` 패칭 1곳 변경 0. KPI 5종 모두 §01+§06 분산 표시. ComingSoonBadge 공통 컴포넌트 신설 (D-6 패턴 차용, 공통 격상 큐). DB 미지원 §02/§05 = placeholder + ComingSoonBadge + dashed border 시각 신호. tsc + 13 룰 + 회귀 4 통과
- [05-01] decisions: **D-3 ProfileWeeklyReport 옵션 B Hybrid 채택** — 시안 v2.4 박제 + TOP 3 코트 보존. 대안 (A) 시안 그대로는 진짜 데이터 손실 + 더미 추가 = 사용자 가치 다운그레이드. 정보 손실 0 우선
- [05-01] architecture: **ProfileShell 폐기 — /profile/* 깊은 페이지 sidebar 0 (v2.3 hub 모델)** — `src/app/(web)/profile/layout.tsx` 의 `<ProfileShell>` wrap 제거 → 단순 `<>{children}</>` passthrough. ProfileShell 의 isHubRoot 분기 (hub root only hide / sub 220px aside 노출) 가 v2.3 시안 sidebar 0 원칙 위반. 사용자가 dev server localhost:3001/profile/edit 에서 옛 좌측 sidebar 잔재 발견 → ad774d9 revert 시 옛 wrap 따라옴. Cowork 직접 patch. tsc 통과 + grep 의존성 0 (정의 파일만 잔존, 후속 cleanup commit 대상). 영향: 13 sub 페이지 모두 외부 sidebar 사라짐 (v2.3 hub 모델 일관 적용)
- [05-01] architecture: **D-6 EditProfile Hybrid 박제 — 단일 스크롤 + Hero + 5섹션** — `src/app/(web)/profile/edit/page.tsx` 1547→1233 (-314) + `edit-profile.css` 신규 603줄. 시안 v2.3 단일 스크롤 + 4섹션 박제 + §5 "추가 설정" 섹션 신설로 진짜 기능 4종 (환불 계좌·회원 탈퇴·닉네임 중복확인·AI bio) 흡수 (Hybrid 옵션 B). Hero 200px RDM 아바타 + 카메라 photo_camera + Sticky save bar (backdrop-blur). 운영 7 핸들러 + API 100% 보존 (handleSave/Upload/Delete/CheckNickname/GenerateBio/Withdraw + BANKS 환불계좌). 시안에 없는 §2/§4 (사용손/실력/강점/공개 7항목) DB 미저장 시각만 박제 — 백엔드 PATCH 확장 시 별도 작업 큐. tsc 통과 + 13 룰 통과 (hex 6건 합법 / lucide 0 / 9999px 0). reviewer 후속 큐: chip BEM 격리 / priv-note 추가
- [05-01] decisions: **ProfileShell 폐기 결정 — children passthrough 채택** — 대안 (B) isHubRoot 조건을 모든 path 로 확장은 ProfileShell 컴포넌트는 살리고 분기로 처리하는 안. 채택안은 ProfileShell 자체 제거. 사유: v2.3 시안에서 sidebar 의도 자체 0 → wrapper 가 항상 children 만 통과시킨다면 wrapper 자체 무의미. component lifecycle 단순화 우선
- [05-01] decisions: **D-6 EditProfile Hybrid 옵션 B 채택** — 시안 v2.3 박제 + §5 "추가 설정" 섹션 신설로 진짜 기능 4종 흡수. (A) 시안 그대로는 회원 탈퇴 누락 = 법적 이슈 가능 / 환불 계좌 누락 = 결제 환불 불가 → 손실 영향 D-3 보다 큼. 정보 손실 0 가 우선
- [05-01] lessons: **revert + 부분 hub 패치 = sub 페이지 옛 sidebar 잔재 (ProfileShell 케이스)** — ad774d9 revert 후 P0 hub 박제는 `/profile/page.tsx` 만 수정. layout.tsx 의 ProfileShell wrap 은 그대로 → ProfileShell 의 isHubRoot 분기가 hub root 만 hide / sub 노출 → v2.3 sidebar 0 위반. 교훈: revert 범위와 시안 정합 범위는 다르다 / 시안 정합성은 path × wrapper 단위 / dev server 사용자 검증이 정적 검증보다 빠르다. 재발 방지: path × wrapper 매핑 표 작성 + PR 머지 전 dev server 새로고침 검증
- [04-29] decisions: **모바일 input font-size 16px !important** — iOS Safari 자동 줌 차단. globals.css `@media (max-width: 720px)` 강제. user-scalable=no는 WCAG 1.4.4 위반이라 배제
- [04-29] errors: **schema 변경 + db push + prisma generate 후 dev 서버 미재시작 → Unknown argument** — `/teams/new` `Invalid \`tx.team.create()\` invocation`. 코드/DB/client 모두 정상이고 직접 tsx 재현은 성공 → dev 서버가 옛 PrismaClient 메모리 캐싱이 원인. **schema 변경 → push → generate → dev 서버 재시작** 4단계 모두 필수. mtime + StartTime 비교로 진단
- [04-29] errors: **모바일 가로 overflow — 인라인 gridTemplateColumns 모바일 미대응 안티패턴 (재발 8건+)** — Phase 9-Mobile 1~2라운드. v2 컴포넌트 `repeat(N,1fr)` 인라인이 366px에서 자식 침범. Tailwind sm:/md: 분기 + 1fr 컬럼 minWidth:0 + globals.css overflow-x:hidden 3가드
- [04-29] errors: **Avatar 영문 텍스트 박스 밖 overflow** — font-size px 고정 + overflow:hidden 누락 → 영문/이니셜이 박스 침범. clamp(10px,4vw,16px) + overflow:hidden + flex 정렬 3종 동시 적용. 한글로만 테스트 X, 영문 케이스 추가 필수
- [04-29] lessons: **헤더 변경의 라우트 그룹별 영향 범위** — (web)/layout.tsx만 변경 시 (admin)/(referee)는 별도 헤더 영향 X. 라우트 그룹 분리 = 레이아웃 격리 장점 vs 헤더 일괄 변경 시 그룹마다 별도 작업 trade-off
- [04-29] lessons: **Phase 9-Mobile 안티패턴 재발 → 컨벤션 문서화** — 1라운드 픽스 후 v2 신규 컴포넌트에 동일 인라인 grid 안티패턴 재등장. v2 시안 코드 변환 시 인라인 style 검사 1단계 추가. 5+회 재발 → 개별 수정 대신 컨벤션 명문화로 grep 가능한 차단
- [04-29] lessons: **Hero 카로셀 1일 → 2시간 단축** — server-first 분해 + 외부 라이브러리 0 + opacity stacking 패턴. 외부 라이브러리 도입 검토는 "5분 견적 → 100줄 미만이면 직접 구현"
<!-- 04-27 항목 3건 절단 (10건 유지 규칙 — 04-29 신규 10건 추가로 인한 정리) — 필요 시 git log로 복원 가능 -->
- [04-29] conventions: **모바일 최적화 체크리스트 10항목 (안티패턴 재발 방지)** — Phase 9-Mobile Refinement에서 픽스한 안티패턴 정리. (1) grid 인라인 repeat(N,1fr) 금지, mobile-first sm:/md: 분기 / (2) 1fr 컬럼 minWidth:0 가드 / (3) absolute 워터마크 hidden sm:block / (4) globals.css 가로 overflow 글로벌 가드 / (5) 폼 16px (iOS 자동 줌 차단) / (6) 버튼 44px (iOS HIG) / (7) 카드 min-height 통일 / (8) Avatar clamp font / (9) 이중 헤더 금지 (AppNav 단일) / (10) 브레이크포인트 720px 통일. 366px viewport 강제 검증. 참조 커밋 4afb4f9/f972aaf/87c59d4
- [04-25] architecture: **코트 대관(Booking) 시스템 설계 — feature_key=court_rental 재활용 + 신규 1테이블 MVP** — plans/court_rental + 토스결제 + payments 다형성 + court_infos.user_id 모두 기존 자산. court_bookings 1테이블 + court_infos 2컬럼 + User 백릴레이션 1줄로 Phase A MVP 가능. 4 Phase(A 무료 8~12h / B 결제 6~8h / C 정산 8~10h / D BDR+할인 6~8h). 사용자 결정 7건 도출(D-B1~D-B7)
- [04-25] decisions: **코트 대관 court_managers N:M 모델 보류** — court_infos.user_id(1:1) + user_subscriptions(feature_key=court_rental, status=active) AND 검사로 단순화. Phase D에서 다중 운영자 요구 시 도입 + 가드만 교체
- [04-25] decisions: **코트 대관 payments.payable_type 다형성 재활용** — "Plan"만 사용 중인 다형성에 "CourtBooking" 추가. 신규 booking_payments 모델 미생성. 환불·토스 응답 필드 그대로 재활용 + admin/payments 통합 조회 유지
- [04-22] conventions: **`any` 타입 예외 허용 규칙 (audit 재발 방지)** — kakao SDK 9 / Next.js HOF 3 / Service Worker 1은 예외. 정비 우선순위: API 응답 → Prisma WhereInput → props/SWR fallback → unsafe cast. 신규 예외는 PM 판단 후 여기 추가
- [04-22] conventions: **Tailwind v4 arbitrary value color-mix 언더스코어 문법** — 공백을 `_`로 치환하면 hover/focus 의사클래스도 토큰화 가능. `hover:bg-[color-mix(in_srgb,var(--color-error)_20%,transparent)]`. hover 있으면 Tailwind arbitrary / 없으면 인라인 style. `hover:opacity-80` 대체 금지(희미해짐 = 의도 반대). next build PASS로 검증 완료
<!-- 04-22 lessons "점진 정비 영역 단위" 절단 (10건 유지 규칙 — 04-29 신규 1건 추가) — 필요 시 git log로 복원 가능 -->
- [04-21] decisions: **세션 역할 재정의 — 본 세션 = 다음카페 sync 전용** — 이전(04-20) "본=일반" 합의 폐기. 옵션 A 조합: `subin` 브랜치 공용 유지 + 커밋 `(cafe-sync)` 스코프 필수 + 신규 카페 전용 PR 분리 + scratchpad 공용+섹션 분리(담당 `pm-cafe`). 충돌 방지 push 전 `git fetch origin subin` 필수. 허용 파일 범위 명시
- [04-21] decisions: **카페 sync 3게시판 전면 board 강제 + parser 힌트 metadata화** — IVHA/Dilr/MptT 모두 `board.gameType` 1:1 강제, `parsed.gameType` 무시. 불일치 시 `metadata.mixed_type_hint` + `parser_game_type` 보존. `resolveGameType`/`buildMetadataHints` 분리. 기존 IVHA 7건 `backfill-cafe-game-type.ts --execute` 로 UPDATE. `cafe-game-parser.ts` 무수정(vitest 59/59 보호). sync smoke 통과(혼재 0건)
- [04-21] lessons: **parser 키워드 판정보다 운영자 명시 신호(게시판 선택)가 1순위** — IVHA 7건 오분류 사례. 신호 신뢰도 순서: (1)게시판/카테고리 명시 (2)구조화 라벨 (3)키워드 추정. `primary ?? fallback` 체인은 "값 유무"가 아니라 "신호 종류" 로 분기해야 함. 낮은 신호는 `metadata.hint` 로 보존(정보 손실 방지)
- [04-20] architecture: **L3 다음 단위 설계** — shared/edition-switcher.tsx + tournaments/[id]/_components/series-card.tsx 신규 2 + Organization/Series(under org)/Tournament 3페이지 수정. **신규 API 0** (기존 `/api/web/series/slug/[slug]`가 editions 포함). Prisma 변경 0. Organization 페이지는 **기존 활용**(브레드크럼만 추가)
<!-- 04-20 항목 5건 절단 (10건 유지 규칙 — 04-27 신규 3건 추가로 인한 정리) — 필요 시 git log로 복원 가능 -->
- [04-20] errors: **카페 상세 HTML 시간 소스 `.num_subject` 단일** — articleElapsedTime/regDttm/JSON-LD 전부 부재. 목록 HTML과 구조 다름. extractPostedAt 4번째 fallback 필수 (`c84aba0`)
- [04-20] decisions: **카페 과거 글 시분 원천 미제공 확정** — 실측 5건 전부 YY.MM.DD만. dataid tie-break로 우회. 모바일 API 시도는 비추천 (`c84aba0`)
- [04-20] architecture: **W4 마감 — M4 /profile/activity 통합 뷰 + M7 팀 가입 신청자 분기 UI + L1 /help/glossary 용어 사전** — 본 세션 5 커밋(12f71bf/e5071f0/c2b13c5/de2c712/642a8be). 기획 17h → 실제 ~2h
- [04-20] decisions: **L2/L3 장기 기획서 작성** — Dev/long-term-plan-L2.md(본인·타인 프로필 시각 통합 ~15h) + L3.md(단체-시리즈-대회 3계층 IA ~12h). **L3 선행 → L2** 순서 권장
- [04-20] conventions: **도메인 용어 정의 단일 소스** — `/help/glossary` 페이지가 9개 핵심 용어(대회·경기·픽업·게스트·연습경기·디비전·시드·토너먼트·풀리그)의 single source of truth. 새 용어 추가 시 여기부터 갱신
- [04-18] lessons: **"개발 DB"라고 믿은 .env가 사실 운영 DB** — API id 비교(운영 vs 로컬)로 발견. 스크립트 가드의 DEV_DB_HOST ref가 운영 ref였음. 비파괴 스크립트라 사고는 아님
- [04-18] decisions: **운영 DB 직접 연결 유지 결정** — 개발/운영 DB 분리는 유보. prisma 스키마 변경/DELETE/파괴적 UPDATE 엄격 금지
- [04-17] decisions: **다음카페 본문 정규식 파서 도입** — LLM 대신 정규식 (95%+ 정확도, 무료). 257건 중 147건 백필 + game_type 66건 재분류. 운영 DB 차단 가드 + 덮어쓰기 금지
- [04-17] errors: **apiSuccess 미들웨어 놓치고 컴포넌트 인터페이스 거꾸로 변환** — route.ts 코드만 보고 응답 형태 추정 금지. curl 1회 필수
- [04-17] lessons: **API 미들웨어 변환 재발 4회** — apiSuccess→convertKeysToSnakeCase 잊고 컴포넌트 측 잘못 수정. fetcher 래퍼 미적용 영역 우선 점검 권장
- [04-17] lessons: **다음카페 본문 양식이 매우 일관적** — "N. 라벨 : 값" 9항목 양식, 정규식 95%+ 추출. cafe-game-parser.ts 재사용 가능
- [04-17] lessons: HTTP 5xx 에러 시 "실패" 단정 금지 — nginx 502는 "응답만 실패, 처리는 완료"일 수 있음. git log/DB로 실상 확인 후 판단. 멱등 작업은 재시도 안전
- [04-17] conventions: **에이전트 호출 최소화 기준** — PM 직접/Explore/planner/developer/debugger 담당 범위 표. 토큰 절약 + 불필요 호출 방지
- [04-17] conventions: **일회성 DB 스크립트 템플릿 재사용** — `scripts/_templates/`에 verify/backfill/merge 3종 (UPDATE only, DELETE 금지)
- [04-17] decisions: **공식 기록 가드 전역 적용** — `officialMatchWhere` 공통 유틸 3함수+SQL상수로 9개 지점(순위/선수기록/팀승패/라이브) 일관 적용. Flutter 테스트 데이터(미래 live) 오염 방어
- [04-17] conventions: **공식 기록 쿼리 — officialMatchWhere 필수 사용** — 맥락별 3갈래 분기 (표준/nested/status-override) + raw SQL 상수
- [04-17] lessons: **Flutter 테스트 데이터가 공식 기록 오염** — 미래 scheduledAt + status=live 자주 발생 → scheduledAt 가드 필수
- [04-17] lessons: **팀 병합 시 logo_url/banner_url 이관 체크** — FK UPDATE만 하고 UI 컨텐츠 필드 빠뜨리기 쉬움
- [04-17] lessons: **동명이인은 닉네임 팀/역할 힌트로 구분** — "(셋업주장)" 같은 패턴이 수동 확인을 쉽게 함
- [04-17] errors: Next.js 16 next/image 외부 호스트 미허용 — `img1/t1.kakaocdn.net` remotePatterns 누락
- [04-17] decisions: 열혈농구단 SEASON2 일회성 백필 + 팀 병합 — 25건 userId + 4개 팀 2개 soft merge, DELETE 0
- [04-17] decisions: 2026-04-16 "회원가입 hook 자동 연결" ⛔ 정정 — 일회성 처리로 대체
- [04-16] errors: **sticky 셀 가로 스크롤 겹침** — 배경 투명 + z-index 누락 이중 원인
- [04-16] errors: **Chrome @page를 가상 프린터(Hancom PDF)가 무시** — 웹 API로 제어 불가, UI 안내가 유일한 해결책
- [04-16] errors: 프린트 th center vs td left 기본값 불일치 → 정렬 깨짐 (table-layout: fixed + text-align 명시 필요)
- [04-16] lessons: 브라우저 프린트 API는 OS/드라이버 제어 불가 — Chrome "PDF로 저장" 유도가 최선
- [04-16] lessons: 모바일 UI는 데스크톱 확대에 희생되면 안 됨 — 듀얼 렌더(sm:hidden) + zoom 절충(1.1)
- [04-16] lessons: 개인 브랜치 drift 해소 — reset --hard origin/dev + push --force-with-lease
- [04-16] conventions: sticky 셀 규칙 — 불투명 배경 + z-10 쌍
- [04-16] conventions: 프린트 CSS 표준 @page 키워드 + table-layout: fixed
- [04-16] conventions: 모바일/데스크톱 듀얼 렌더 패턴 (`sm:hidden` + `hidden sm:flex`)
- [04-16] conventions: 플레이스홀더 기호는 `-` 통일 (em-dash `—` 금지)
- [04-15] errors: 신규 파일 git add 누락 → Vercel 빌드 실패
- [04-15] lessons: gh 인증 풀렸을 때 `git credential fill`로 GH_TOKEN 세션 주입
- [04-15] errors: **prisma db push --accept-data-loss로 타 브랜치 Referee 테이블 4개 drop 사고** — 개발 DB라도 db push 전 migrate diff 필수
- [04-15] lessons: DB 마이그레이션 --accept-data-loss는 타 브랜치 데이터 파괴 가능 — migrate dev --create-only로 SQL 먼저 확인
- [04-15] architecture: 팀명 2필드 구조 (Team.name_en + name_primary "ko"/"en") + Referee 시스템 14개 모델 schema 통합
- [04-14] architecture: 대회 상세 페이지 전면 개편 — 탭 4개(대회정보/대진표/일정/참가팀), 히어로 통합, 사이드바 제거
- [04-14] architecture: 대진표 시스템 4단계 구현 — 풀리그 순위표 → 토너먼트 자동 할당 → 시드 뱃지 → 뼈대 선생성 → admin wizard
- [04-14] architecture: 토너먼트 트리 NBA.com 스타일 — SVG 통일, 카드 분리형, 좌측 유니폼 색 띠
- [04-14] architecture: 대회 선수 userId 자동 연결 — link-player-user.ts 이름 정확 일치 매칭
- [04-14] architecture: 사이트 전역 팀명/선수명 Link 전환 — /teams/{id}, /users/{id}
- [04-14] decisions: KBL 방식 순위 로직 — 승률 → 득실차 → 다득점, 경기결과 실시간 집계
- [04-14] decisions: 대진표 자동 생성 흐름 — 뼈대 선생성 + 리그 완료 시 할당 + BYE 자동 처리
- [04-14] decisions: 대회 선수 userId 자동 연결 — 이름 정확 일치만 허용(오매칭 방지)
- [04-14] decisions: 사이트 전역 팀명/선수명을 Link로 전환 — 일정 카드 내부는 중첩 방지 예외
- [04-14] conventions: 경기결과 실시간 집계 패턴 — Team.wins 필드 무시, tournament_matches에서 status completed+live 집계
- [04-14] conventions: API 응답 snake_case → camelCase 자동 변환 — fetcher 래퍼로 근본 해결
- [04-14] conventions: 팀 카드 공통 컴포넌트 TeamCard 재사용
- [04-14] lessons: snake_case/camelCase 변환 버그는 fetcher 래퍼로 근본 해결 — 3번 재발 후 구조적 해결

## 빠른 검색 가이드

### 페이지별 구조를 알고 싶을 때 → architecture.md
| 키워드 | 항목 제목 |
|--------|----------|
| 팀명, name_en, name_primary, Referee, associations | 팀명 2필드 구조 + Referee 시스템 통합 |
| 대회 상세, 탭 4개, 히어로, 1열 | 대회 상세 페이지 전면 개편 |
| 대진표, 풀리그, 토너먼트, 자동 할당, 뼈대, 시드 뱃지 | 대진표 시스템 4단계 구현 |
| BracketView, SVG, NBA.com, 카드 분리형 | 토너먼트 트리 NBA.com 스타일 |
| userId 연결, link-player-user, 이름 매칭 | 대회 선수 userId 자동 연결 시스템 |
| 전역 Link, /teams, /users, 팀명 클릭 | 사이트 전역 팀명/선수명 Link 전환 |
| 홈, 사이드바, 히어로 | 홈페이지 리디자인 구조 설계 |
| 경기, 게임, 위자드 | 경기 페이지 구조 분석 |
| 팀, 목록, 상세 | 팀 페이지 구조 분석 |
| 프로필, 스탯, 레이더 | 프로필 페이지 구조 분석 |
| 대회, 대진표, 브라켓 | 대회 페이지 구조 분석 |
| 커뮤니티, 게시글, 댓글 | 커뮤니티 페이지 구조 분석 |
| admin, 라우트 그룹 | admin 라우트 그룹 분리 |
| 심판, referee, 경기원, 자격증 | 심판 플랫폼 라우트 그룹 (referee) 설계 |
| 랭킹, rankings, 팀, 개인 | 랭킹 페이지 구조 설계 |
| BDR 랭킹, 외부, xlsx, proxy | 외부 BDR 랭킹 연동 구조 설계 |
| 하드코딩, API 연결 | 하드코딩 vs DB/API 전체 분석 |
| 색상, CSS 변수 | CSS 하드코딩 색상 전환 대상 분류 |
| 전체 구조, 90개 페이지 | 전체 페이지 구조 분석 |
| 현장등록, Flutter, TournamentTeamPlayer | 대회 선수 등록 및 userId 연결 흐름 분석 |
| 경기기록, match_events, MatchPlayerStat, 기록원 | 경기 기록 입력 시스템 전체 구조 분석 |
| 대관, booking, court_bookings, court_rental, 멤버십 운영자 | 코트 대관(Booking) 시스템 설계 (2026-04-25) |
| Hero 카로셀, hero-carousel, hero-slides, prefetchHeroSlides, BDR v2 홈, AppNav, 모바일 가드 | BDR v2 Hero 카로셀 + 글로벌 헤더 단일화 + 모바일 가드 (2026-04-29) |
| 듀얼토너먼트, dual_tournament, generateDualTournament, progressDualMatch, 27 매치, 4조 더블엘리미, NBA 크로스, 8강·4강·결승, loserNextMatchId, settings JSON | 듀얼토너먼트 풀 시스템 설계 (2026-05-02) |

### 디자인/코딩 규칙을 알고 싶을 때 → conventions.md
| 키워드 | 항목 제목 |
|--------|----------|
| 경기결과, wins, losses, 실시간 집계, tournament_matches | 경기결과 실시간 집계 패턴 (Team.wins 필드 무시) |
| fetcher, snake_case, camelCase, convertKeysToCamelCase | API 응답 snake_case → camelCase 자동 변환 |
| TeamCard, 팀 카드, 공통 컴포넌트, 재사용 | 팀 카드 공통 컴포넌트 재사용 |
| 색상, Primary, 쿨그레이 | 디자인 시스템 색상 체계 |
| 아이콘, Material Symbols | 아이콘 라이브러리 |
| 폰트, Pretendard | 폰트 체계 |
| 버튼, 카드, radius | 버튼/컴포넌트 스타일 |
| 브레이크포인트, 모바일 | 레이아웃 브레이크포인트 |
| 리디자인, 2열, API 유지 | 페이지 리디자인 공통 패턴 |
| DB 없음, placeholder | DB 미지원 기능 처리 규칙 |
| 스크롤, 그리드, 반응형 | 가로 스크롤 + 그리드 반응형 패턴 |
| 디비전, 종별, 성별, D3~D8 | BDR 디비전 체계 3단계 표준 규격 |
| 대회 상태, 준비중/접수중/진행중/종료 | 대회 상태 4종 통일 규칙 |
| admin, 테이블, 모달, 탭 | admin UI 공통 패턴 |
| 다크모드, 텍스트 가시성, --color-on-*, text-white 금지 | 테마 반응형 배경 위 텍스트 --color-on-* 변수 |
| 모바일, 366px, 가로 overflow, grid 안티패턴, minWidth:0, iOS 자동 줌, 터치 타겟 44px, 720px 브레이크포인트 | 모바일 최적화 체크리스트 10항목 (2026-04-29) |

### 왜 이렇게 결정했는지 알고 싶을 때 → decisions.md
| 키워드 | 항목 제목 |
|--------|----------|
| KBL, 순위, 승률, 득실차, 다득점 | KBL 방식 순위 로직 |
| 대진표 자동, 뼈대 선생성, BYE, 시드, seedNumber | 대진표 자동 생성 흐름 |
| 이름 매칭, 정확 일치, 오매칭, link-player-user | 대회 선수 userId 자동 연결 |
| 전역 Link, 중첩 금지, /teams, /users | 사이트 전역 팀명/선수명을 Link로 전환 |
| 대회 프리셋, settings Json, 스네이크 드래프트, 교차 시딩 | 대회 형식 프리셋 시스템 |
| format 분기, public-bracket, 조별 전적 | 대진표 탭 format 기반 조건부 렌더링 |
| 팀 병합, teamId UPDATE | 중복 팀 병합 B안 |
| userId 시나리오, A>D>B>C | 대회 기록 자동 연결 4시나리오 우선순위 |
| 팔로우, follows, FollowButton | 팔로우 시스템 follows 테이블 + 공통 FollowButton |
| 좋아요, likes, ServerAction | 좋아요 시스템 전용 테이블 + Server Action |
| 랭킹, groupBy, DB유지 | 랭킹 페이지 DB 변경 없이 기존 필드 활용 |
| BDR 랭킹, xlsx, proxy | 외부 BDR 랭킹 서버사이드 proxy |
| 위자드, fixed, 오버레이 | 경기 생성 위자드 배치 변경 |
| lucide, Material Symbols | 아이콘 라이브러리 전체 교체 |
| YouTube, playlistItems | YouTube 인기 영상 API 변경 |
| ISR, getWebSession, CDN | 홈 ISR 활성화 — getWebSession 분리 |
| Google Places, 사진, 캐시 | Google Places 사진 연동 3단계 캐시 |
| admin, 모달, 탭, 개편 | admin UI 전면 개편 |
| 카드, 컴팩트, 그라디언트 | 카드 컴팩트화 + 유형별 그라디언트 |
| 상수, 통일, 공통파일 | 프론트/admin/API 상수 공통 import 원칙 |
| 대회 상태, 4종 | 준비중/접수중/진행중/종료 4종 통일 |
| admin, 모달, 탭, 개편 | admin UI 전면 개편 — 컴팩트 테이블+플로팅 모달 |
| 심판, Referee, 샌드위치, User 0수정 | 심판 플랫폼 샌드위치 구조 / User 모델 1줄 / 브랜치 격리 DB |

### 에러/함정을 알고 싶을 때 → errors.md
| 키워드 | 항목 제목 |
|--------|----------|
| db push, --accept-data-loss, 테이블 drop, 브랜치 schema | **prisma db push --accept-data-loss로 타 브랜치 테이블 drop** |
| Turbopack, Jest worker, child process | Turbopack dev worker pool 에러 |
| YouTube, viewCount | YouTube Search API 정렬 부정확 |
| 라이트모드, 테마, dark/light | 라이트모드 CSS 변수 미적용 |
| admin, 레이아웃 이중 | admin 레이아웃 이중 적용 |
| apiSuccess, .data, 래핑, snake_case | apiSuccess 응답에 .data로 접근하는 버그 |
| categories, boolean, array, divs.map | categories JSON boolean/array 혼용 에러 |
| setLoggedIn, 경쟁 조건 | 커뮤니티 맞춤 필터 미적용 경쟁 조건 |
| 체크인, SWR, POST 409 | SWR GET과 POST 409 응답 정보 불일치 |
| 개발서버, hung, 무한 로딩, 메모리 | Next.js 개발서버 무한 로딩 |
| 모바일 overflow, 366px, gridTemplateColumns, repeat 인라인, minWidth:0, 가로 스크롤바 | 모바일 가로 overflow grid 안티패턴 (2026-04-29) |
| Avatar overflow, 영문 닉네임, clamp font-size, 박스 튀어나옴 | Avatar 영문 텍스트 박스 밖 overflow (2026-04-29) |
| Invalid tx.team.create invocation, Unknown argument, prisma client 캐싱, dev 서버 재시작, schema 변경, db push, prisma generate | schema 변경 후 dev 서버 미재시작 prisma 에러 (2026-04-29) |
| organizations status, active, approved, status 필터 enum, page 생성API schema cross-check, 단체 노출 0 | organizations 목록 status 필터 'active' 버그 (2026-05-01) |

### 삽질 교훈을 알고 싶을 때 → lessons.md
| 키워드 | 항목 제목 |
|--------|----------|
| db push, accept-data-loss, 브랜치, 마이그레이션 | DB 마이그레이션 --accept-data-loss는 타 브랜치 데이터 파괴 가능 |
| fetcher, snake/camel, 재발, 구조적 해결 | snake/camelCase 변환 버그는 fetcher 래퍼로 근본 해결 |
| YouTube, 쿼터, API | playlistItems가 Search보다 정확+저렴 |
| 테마, 다크/라이트, CSS변수 | 테마 전환 시 3가지 동시 처리 |
| ISR, cookies, getWebSession | ISR 캐시 무효화 — cookies() 호출이 원인 |
| DB, 리전, Supabase, 인도 | DB 리전이 성능 병목 — 한국으로 이전 |

## 외부 참고 문서
| 문서 | 위치 | 설명 |
|------|------|------|
| DESIGN.md | Dev/design/DESIGN.md | 디자인 시스템 통합 문서 (색상/폰트/레이아웃/컴포넌트) |
| Stitch 원본 | Dev/design/0. 레이아웃/DESIGN.md | Stitch에서 내보낸 원본 디자인 규격 |

## 이전 누적 지식 아카이브 (2026-04-15 이전, 참고용)
<!-- 위쪽 "최근 추가된 지식" 섹션과 분리. 제목 중복 방지. 신규 항목은 상단 섹션에 추가하고, 3개월 이상 참조 안 된 항목은 이 섹션에서 정리/삭제 검토. -->
- [04-15] decisions: 헬스체크 cron 2차 — self-fetch + Promise.allSettled 병렬 + 실패해도 끝까지 진행 (내부 함수 호출 대비 유저 경로 검증 이점)
- [04-12] architecture: 심판 플랫폼 재설계 v2 — 6모델(Association/AssociationAdmin/Referee/Certificate/Assignment/Settlement) + 17API + Excel 2단계 업로드, users 0수정 CREATE 6건만
- [04-12] decisions: v2 협회 계층형 Association — self-relation, 20개 시드(KBA+시도17+KBL/WKBL), REGIONS 재사용
- [04-12] decisions: v2 자격증 파일 업로드 제거 — cert_number + 실명/생년월일/전화 교차검증으로 대체
- [04-12] decisions: v2 Excel 일괄 + 개별 토글 2-way — preview/confirm 2단계, 5MB/500행 제한, 파일 미저장
- [04-12] decisions: v2 심판 공개 목록 제거 — /registry 삭제, 본인 profile + admin members 두 컨텍스트만
- [04-12] decisions: v2 실명 노출 — User.name 사용, verified_* 스냅샷을 Referee에 저장
- [04-12] decisions: v2 배정/정산 조회 전용 포함 — RefereeAssignment+Settlement 스키마 1차 확정, tournament_match_id/game_id 분리 FK
- [04-12] decisions: v2 AssociationAdmin 매핑 테이블 — users 0수정(ALTER 회피), admin_role 기존값 재사용, 1인 1협회 unique
- [04-12] architecture: 심판 플랫폼 라우트 그룹 (referee) — v1 초안 (registry 포함, 2 모델)
- [04-12] decisions: 심판 플랫폼 샌드위치 구조 — v1 초안 (신규 테이블 2개만, 1인 1 Referee 원칙)
- [04-02] decisions: 맞춤 설정 강화 — 실력 7단계 + 메뉴 토글 + 카테고리 분리 (DB 변경 최소, 하위 호환 유지)
- [04-02] architecture: 맞춤 설정 시스템 구조 분석 — preference-form + API + context + 필터 적용 흐름 + SKILL_LABEL 중복 4곳
- [03-29] decisions: GPS 히트맵 — Canvas 오버레이 + simpleheat (카카오맵 히트맵 미지원, court_sessions 시간대 집계)
- [03-29] decisions: 3x3 이벤트 — tournament 완전 분리, court_events 4테이블 신설 (코트 종속 경량 대회)
- [03-29] decisions: 앰배서더 — court_ambassadors 테이블 + 위키 바이패스 (코트별 동네 관리자)
- [03-29] decisions: 주간 리포트 — DB 없이 court_sessions 실시간 집계 + Vercel Cron (1차 앱내 알림)
- [03-29] decisions: 코트 유저 위키 — court_edit_suggestions 1테이블 + changes JSON diff (reports와 분리, 승인 시 XP 10)
- [03-29] decisions: 픽업게임 모집 — 별도 pickup_games 테이블 신설 (games 분리, 즉시 확정 참가, 코트 직접 연결)
- [03-29] decisions: 코트 데이터 품질 정리 기준 — 658개 추정 데이터 null 초기화 + 유저 위키 시스템
- [03-28] project-structure-audit: 전체 구조 분석 — 미사용 API 6개/고립 페이지 4개/TODO 3건/레거시 3쌍 발견
- [03-28] ux-audit-report: UI/UX 사용성 심층 조사 — 11개 영역/28개 개선안/단기10+중기8+장기5 우선순위
- [03-28] toss-design-analysis: 토스 디자인 시스템 심층 분석 — 색상/폰트/간격/컴포넌트/레이아웃 전수치 + MyBDR 매핑 테이블
- [03-28] decisions: admin UI 전면 개편 — 컴팩트 테이블 + 플로팅 모달 + 상태 탭
- [03-28] conventions: admin UI 패턴 — 서버page + 클라이언트content 분리
- [03-28] conventions: 대회 상태 4종 통일 (준비중/접수중/진행중/종료)
- [03-28] architecture: admin 누락 관리 기능 4개 추가 (경기/커뮤니티/팀/코트)
- [03-28] decisions: 프론트/admin/API 상수 통일 — 공통 상수 파일 import 원칙
- [03-28] conventions: BDR 디비전 체계 3단계 (성별→종별→디비전) 표준 규격
- [03-28] errors: categories JSON boolean/array 혼용 — Array.isArray 체크 필수
- [03-28] lessons: ISR 캐시 무효화 — getWebSession()의 cookies()가 원인
- [03-27] decisions: 홈 ISR 활성화 — getWebSession 분리로 CDN 캐시 가능
- [03-27] decisions: Google Places 사진 연동 — 서버 proxy + 3단계 캐시
