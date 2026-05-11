# 프로젝트 구조 지식
<!-- 담당: planner-architect, developer | 최대 30항목 -->
<!-- 프로젝트의 폴더 구조, 파일 역할, 핵심 패턴을 기록 -->

### [2026-05-11] 웹 종이 기록지 — `(web)/score-sheet/[matchId]/` + BFF sync 재사용 (Flutter API 0 변경)
- **분류**: architecture (페이지 신설 + 기존 API 재사용 패턴)
- **발견자**: planner-architect (본 turn 기획)
- **참조횟수**: 0
- **위치**:
  - `src/app/(web)/score-sheet/[matchId]/page.tsx` (server, 가드)
  - `src/app/(web)/score-sheet/[matchId]/_components/{score-sheet-form,team-roster,team-stats-grid,foul-tracker,timeout-tracker,running-score-grid,submit-bar,validation-panel}.tsx`
  - (Phase 6 선택) `src/app/(web)/score-sheet/[matchId]/print/page.tsx` — A4 인쇄용
  - BFF = `src/app/api/web/score-sheet/[matchId]/submit/route.ts` — server-to-server 로 `POST /api/v1/tournaments/[id]/matches/sync` 호출
- **본질**: 미교육 기록원이 종이 FIBA 기록지로 적은 결과를 웹 폼으로 박제. Flutter 기록앱과 동일 결과 (라이브/박스스코어/통산/알기자) 자동 산출 — sync API 재사용으로 보장.
- **재사용 자산** (재구현 0):
  - `POST /api/v1/tournaments/[id]/matches/sync` — single match sync (player_stats + play_by_plays + status). completed 신규 전환 시 `waitUntil(triggerMatchBriefPublish)` 내장 (5/9 fix).
  - `MatchLineupConfirmed` (사전 라인업 PR1~5) — roster 자동 채움. 미입력 시 fallback UI.
  - `TournamentTeamPlayer` (선수 12명 표준 source) — 등번호/실명/캡틴/주전 박제.
  - `MatchPlayerStat` (22 필드 boxscore) — 신규 컬럼 0.
  - `requireRecorder` 패턴 (web 세션 대응판 `requireScoreSheetAccess`).
  - 모바일 박스스코어 PDF 패턴 (jsPDF + html2canvas) — Phase 6 인쇄 양식 재사용.
- **AppNav 영향**: 0. 더보기 5그룹 → "관리·도움" 그룹의 admin 영역 노출 + admin 매치 상세 페이지 "📝 종이 기록지 입력" 버튼 추가. 메인 9 탭 변경 X.
- **Flutter v1 영향**: 0 (sync API consume only / 코드 변경 X). 원영 사전 공지 불필요.
- **Phase 분해**: 6 Phase. Phase 1+2 (PR 3건) = MVP — 헤더+명단+쿼터점수 / 선수별 22 stat 표. Phase 3~6 = 파울/타임아웃/런닝스코어/PDF.
- **충돌 가드**: status="in_progress" 매치 web 제출 차단 (strict) — Flutter 실시간 기록 보호. status="completed" 후 score 수정만 web 허용 (사고 보정).
- **audit**: `tournament_match_audits.source = "web-score-sheet"` 신규 분류 + `admin_logs` warning 박제 (forfeit fix 5단계 절차 참조).
- **위험**: (R1) Flutter sync 와 last-write-wins / (R2) 사전 라인업 미입력 매치 fallback / (R3) 팀파울·타임아웃 DB 컬럼 없음 (settings JSON 또는 PBP) / (R4) 통산 stat sum/sum (5/10 fix) — made/attempted 정확 입력 필수 / (R5) 종이 원본 보관 정책

### [2026-05-05] 인증 흐름 단일 진입점 — getAuthUser() 헬퍼 + 4 layout 위임 + 쿠키 자동 cleanup
- **분류**: architecture (인증 / 세션 / 가드)
- **발견자**: planner-architect + developer (옵션 B-PR1 구현)
- **참조횟수**: 0
- **위치**: `src/lib/auth/get-auth-user.ts` (신규 단일 진입점) + `src/app/(web)/{layout,login/layout,signup/layout,profile/layout}.tsx` (4 layout 위임) + `src/app/api/web/me/route.ts` (응답 통일)
- **본질**: 5/5 사용자 신고 — 탈퇴 회원 쿠키 7일 잔존 시 매번 layout 가드 의존. 가드 5개소 (web/login/signup/profile layout + me API) 분산 → 신규 가드 추가 시 같은 패턴 반복 + 누락 회귀 (errors.md fa5bd90 → signup 누락).
- **`getAuthUser()` 4 케이스 응답 (`AuthState`)**:
  - `anonymous` — 쿠키 없음 또는 JWT 검증 실패
  - `active` — 정상 회원 (status !== "withdrawn")
  - `withdrawn` — 탈퇴 회원 (status === "withdrawn") — **쿠키 자동 cleanup**
  - `missing` — JWT 살아있지만 DB user 없음 (관리자 hard delete 등) — **쿠키 자동 cleanup**
- **3대 보장**:
  1. **JWT verify + DB user.status SELECT + status 분기 단일 함수 캡슐화**
  2. **React.cache dedup** — 동일 요청 내 4 layout 동시 호출해도 DB SELECT 1회
  3. **쿠키 자동 cleanup** — withdrawn/missing 시 cookies.delete 호출 → 사용자가 페이지 진입 1회만으로 잘못된 쿠키 영구 제거 (5/5 사용자 신고 본질 해결)
- **안전 가드**:
  - DB SELECT 실패 = anonymous 반환 (가드는 비로그인 처리)
  - cookies.delete 실패 (read-only context) = silent fail (try/catch)
- **4 layout 동작 매트릭스**:
  - `(web)/layout.tsx` — `state==="active"` 만 initialUser 채움 (referee SELECT 별도 유지). 그 외 null.
  - `(web)/login/layout.tsx` — `state==="active"` 만 / redirect.
  - `(web)/signup/layout.tsx` — `state==="active"` 만 / redirect (login 과 대칭, 5/5 신규 가드).
  - `(web)/profile/layout.tsx` — `anonymous` → /login?redirect=/profile, `withdrawn`/`missing` → /login?withdrawn=expired, `active` 통과.
- **me API 응답 통일** (옵션 A-3): 탈퇴 회원 응답 401 → 200 + `{id:null, state:"withdrawn"}` 단일 path. 7 호출처 `if (u && u.id)` 검증 패턴 호환 → 회귀 0.
- **사용 위치**: server component layout / server action 만. route handler 는 기존 `withWebAuth` 유지 (별도 PR 검토).
- **B-PR2/PR3 큐**: me API 통합 응답 + 7개 호출처 일관 처리 (PR2) / `withWebAuth` 안에 status 검증 옵션 (PR3) — 본 PR 범위 외.

### [2026-05-04] 알기자 기사 사진 첨부 시스템 (Phase 1 MVP) — news_photos 테이블 + admin 모바일 카메라 + Hero/갤러리
- **분류**: architecture (LLM 기자봇 / 운영자 모바일 업로드 / 사진 노출)
- **발견자**: pm + 사용자 의도 ("담당자가 핸드폰으로 사진 업로드하면 인식해서 함께 넣을 수 있는 방법")
- **참조횟수**: 0
- **위치**: `prisma/schema.prisma` (news_photos 신규 테이블) + `src/app/api/web/upload/news-photo/route.ts` (POST/DELETE) + `src/lib/news/news-photo-gallery.tsx` (Hero/Gallery 컴포넌트) + `src/app/(admin)/admin/news/_components/news-photo-manager.tsx` (admin 업로드/관리 UI) + `src/app/(admin)/admin/news/{page.tsx, admin-news-content.tsx}` (검수 페이지 통합) + `src/app/(web)/community/[id]/page.tsx` (본문 노출) + `src/app/(web)/news/match/[matchId]/page.tsx` (deep link 노출)
- **5 결정** (사용자 추천대로 채택): Q1=A 수동 매핑 (매치 dropdown) / Q2=A Supabase Storage `news-photos` bucket / Q3=A+B Hero(1장 본문 위) + 갤러리(나머지 본문 아래) / Q4=A admin/news 통합 + 모바일 카메라 (`<input capture="environment">`) / Q5=B 발행 후도 추가 가능 / Q6=B `news_photos` 별도 테이블 (`community_posts.images` JSON 활용 X)
- **schema (NULL ADD COLUMN + 신규 테이블, 무중단)**:
  - `tournament_matches.news_photos news_photo[]` (역참조)
  - `news_photo` 테이블 신규: id BigInt + match_id (Cascade) + url + storage_path + width/height/size_bytes + is_hero Boolean + display_order Int + uploaded_by (User) + caption Text? + exif_meta Json? (Phase 2 큐) + created_at + updated_at + index 3종 (match_id / match_id+is_hero / match_id+display_order)
- **흐름** (운영자 매치 종료 후):
  - admin/news 검수 페이지 진입 → 게시물 선택 → NewsPhotoManager 노출 (사진 list + 업로드 버튼 3종)
  - 모바일: `📷 카메라` 버튼 = `<input capture="environment">` 즉시 카메라 앱 호출 / `🖼️ 갤러리(멀티)` = 멀티 파일 선택 / `⭐ 대표 사진` = isHero=true 단일
  - 업로드 → POST `/api/web/upload/news-photo` (admin only) → sharp 정규화 (long-edge 1920 + WebP 80% + EXIF 회전 자동 적용) → Supabase Storage `news-photos` bucket → news_photo INSERT (트랜잭션: isHero 면 기존 isHero 모두 false, display_order = max+1)
  - DELETE `?id={photoId}` → Storage + DB 둘 다 정리
- **노출** (3곳 동일 룰, `news-photo-gallery.tsx` 컴포넌트):
  - **Hero** (`<NewsPhotoHero>`): is_hero=true 1장 → 본문 위 (없으면 첫 사진), aspect-ratio = 원본 비율, priority loading
  - **갤러리** (`<NewsPhotoGallery excludeHero>`): Hero 외 사진 grid (3~4 열), 클릭 시 새 탭 원본
  - 사진 0건 → 컴포넌트 자체 렌더 X (조건부 마운트)
- **운영 요구**: Supabase 콘솔에서 `news-photos` bucket 생성 (public access) — 1회 수동 작업
- **Phase 2 큐**: EXIF 메타 (촬영시각/GPS) 기반 자동 매치 추천 (현재 `exif_meta.has_exif` 만 저장, 파싱은 exif-reader 도입 시)
- **Phase 3 큐**: AI Vision (Gemini/Claude) — 사진 → 매치 자동 매칭 + 핵심 순간 분류 (덩크/3점 등)
- **community list 카드 썸네일** (큐): tournament_match_id select 추가 + batch fetch 후 첫 사진 노출 (별도 commit)

### [2026-05-04] 알기자 Phase 1 DB 영구 저장 마이그 — 트리거 통합 + tournament_matches.summary_brief
- **분류**: architecture (LLM 기자봇 / 라이브 페이지 / 트리거 통합)
- **발견자**: pm + 사용자 의도 명확화 ("경기 종료 → 본 + 요약 2개 동시, 매치당 정확히 2개")
- **참조횟수**: 0
- **위치**: `prisma/schema.prisma` (`tournament_matches.summary_brief Json?` 컬럼 추가) + `src/lib/news/auto-publish-match-brief.ts` (Phase 1+2 통합) + `src/app/api/live/[id]/route.ts` (`summaryBrief` 응답 필드) + `src/app/live/[id]/_v2/{tab-summary.tsx, game-result.tsx}` (client fetch 제거)
- **사용자 의도 vs 5/3 구현 Gap**: G2 트리거 시점 (방문→자동) / G3 영구 저장 (메모리→DB) / G4 트리거 통합 (Phase 1+2 동시) / G5 매치당 1회 보장 — 5/4 모두 해소
- **흐름** (1회 트리거 → 2개 결과 동시 생성):
  - 매치 PATCH `status=completed` → `triggerMatchBriefPublishAsync(matchId)` fire-and-forget
  - 내부 `Promise.allSettled([publishPhase1Summary, publishPhase2MatchBrief])` — 한쪽 실패 ≠ 다른쪽 영향
  - **Phase 1 (요약, 라이브 페이지)**: brief?mode=phase1-section GET → `tournament_matches.summary_brief` UPDATE (즉시 노출, 검수 X)
  - **Phase 2 (본기사, 게시판)**: brief?mode=phase2-match GET → `community_posts` INSERT (status=draft, admin 검수)
- **schema 변경 (NULL 허용 ADD COLUMN, 무중단)**: `summary_brief Json? @map("summary_brief")` — 형식 `{ brief, generated_at, mode: "phase1-section" } | null`
- **라이브 페이지 변경**: tab-summary.tsx 의 client fetch (`useEffect + fetch /api/live/[id]/brief`) 완전 제거 → `match.summary_brief` props 직접 사용. `useState/useEffect/BriefResponse` 모두 제거. cold start 마다 LLM 재호출 X / Vercel instance 다중 호출 X / 인스턴스별 메모리 캐시 의존 X.
- **5/4 backfill 결과**: completed 35매치 중 34건 UPDATE 성공 (평균 175자, 목표 150~250 적중) / 실패 1건 (#88 validate-brief "땀" reject — prompt 개선 큐). 운영 endpoint phase1-section 7번 호출 + tournament_matches UPDATE.
- **멱등성**: Phase 1 = `summary_brief` 있으면 skip / Phase 2 = `community_posts(news)` 있으면 skip — 각각 독립
- **regenerate 호환성**: admin/news 의 regenerateNewsAction 은 Phase 2만 처리 (community_post 삭제 + 재생성). 통합 트리거 호출하지만 Phase 1 은 멱등성으로 자동 skip. Phase 1 regenerate 별도 액션 큐 (현재 미구현).
- **운영 deploy 의존**: 5/4 backfill 은 운영 brief route 만 사용 (이미 운영). `auto-publish-match-brief.ts` 신규 publishPhase1Summary 는 deploy 후 신규 매치 종료 시 자동 작동.

### [2026-05-03] minutes-engine v3 — 출전시간 계산 엔진 메인 path 4단계 구조 확정
- **분류**: architecture (live 페이지 / 출전시간 알고리즘 / Flutter 의존성 격리)
- **발견자**: developer + debugger (사용자 제안 검증 후 채택, 5/3 D-day 동안 7회 보강)
- **참조횟수**: 0
- **위치**: `src/lib/live/minutes-engine.ts` (333줄, 333은 +8 헤더 주석 포함) + `src/__tests__/lib/live/minutes-engine.test.ts` (test 21건) + `src/app/api/live/[id]/route.ts` (`dbStartersByTeam` Map 주입)
- **메인 path 4단계** (calculateMinutes 본체 133줄):
  1. **Q1 starter** = `MatchPlayerStat.isStarter` (Flutter 가 sync, DB 100% 입력 — t388 13/13, 열혈 9/9 매치 양팀 5+5 정확)
  2. **Q2~ starter** = endLineup chain (직전 쿼터 시뮬 종료 active set, 작전타임 교체 ~2.5% 외 정확)
  3. **Boundary 강제**: starter firstSegment = qLen (첫 PBP clock < qLen 이라도 풀 시작) / 다음 쿼터 PBP 존재 시 endClock=0 강제 (lastGap 회복)
  4. **LRM cap (종료 매치만)**: Largest Remainder Method — exact = sec×ratio → floor → 잔여 = expected - sum(floor) → fractional 큰 순 +1 분배 → 양팀 합 = expected×2 정확 일치
- **Fallback**: `inferStartersFromPbp(qPbps)` 헬퍼 분리 — PBP-only 추정 (sub_in 받은 적 없는 + sub_out 등장한 + 첫 sub 이전 등장한 union). 메인 path 가드 fail 시만 발동 (실측 0회).
- **가드 일관성**: DB starter union 가드 (L131) `>=5 && <=12` + endLineup chain 가드 (L196) `>=5 && <=12` 모두 양팀 union 기준 통일 (단일팀 기준 사용 금지 — 5/3 저녁 fix d3984db).
- **정확도**: 종료 100% (LRM cap) / 라이브 ~99% (메인 path 4단계) / Unit test 21/21 PASS / Fallback 발동 0회
- **B 옵션 리팩토링 효과** (72aa643): 알고리즘 설계 헤더 주석 +22줄 / `inferStartersFromPbp` 헬퍼 격리 / `calculateMinutes` 본체 191→133줄 (-30%) / 동작 변경 0
- **참조 커밋**: 7ea0174 (LRM) / 678a875 (Tier 2 chain) / 133d0de (Tier 3 boundary) / 72aa643 (B 옵션 리팩토링) / d3984db (가드 union)

### [2026-05-03] 알기자 BDR NEWS Phase 2 — 게시판 'news' 통합 발행 시스템
- **분류**: architecture (LLM 기자봇 / community 게시판 통합 / admin 검수)
- **발견자**: pm + 사용자 결정 8건 (Q1~Q8)
- **참조횟수**: 0
- **위치**: `prisma/schema.prisma` + `src/lib/news/{prompts/alkija-system-phase2-match.ts, match-brief-generator.ts, validate-brief.ts, auto-publish-match-brief.ts, linkify-news-body.tsx}` + `src/app/api/live/[id]/brief/route.ts` + `src/lib/services/match.ts` + `src/app/(admin)/admin/news/{page.tsx, admin-news-content.tsx}` + `src/app/actions/admin-news.ts` + `src/app/(web)/community/_components/community-content.tsx` + 알기자 User uid=3350
- **8 결정** (사용자 Q&A): Q1 community_posts 하이브리드(컬럼 +4) / Q2 자동 트리거 (fire-and-forget) / Q3 검수 발행 (draft→published) / Q4 다층 단위 (매치+라운드+일자, MVP는 매치만) / Q5 deep link `/news/match/[id]` (Phase E 큐) / Q6 통합 admin `/admin/news` / Q7 알기자 placeholder User (`alkija@bdr.system`) / Q8 댓글+좋아요 활성
- **흐름**: 매치 종료(`status=completed` 변경) → `triggerMatchBriefPublishAsync(matchId)` fire-and-forget → 내부 fetch `/api/live/[id]/brief?mode=phase2-match` → LLM 호출 (alkija-system-phase2-match.ts: 400~700자 / 정형 4단락 / 다양한 관점 / 어조 ~다 / 제목 분리 `TITLE: ...`) → community_posts INSERT (status=draft, category=news, tournament_match_id, tournament_id, period_type=match, user_id=알기자) → 운영자 `/admin/news` 검수 (publish/reject/regenerate/edit) → published 시 `/community?category=news` + (Phase E) `/news/match/[id]` 노출
- **schema 변경 (community_posts +4 컬럼, NULL 허용 ADD COLUMN, 무중단)**: `tournament_match_id BigInt? + tournament_id String? @db.Uuid + period_type String?(VarChar 16) + period_key String?(VarChar 64)` + 인덱스 3종
- **prompt 분기**: BriefMode = "phase1-section" (매치 페이지 lead, 150~250자) | "phase2-match" (게시판 독립 기사, 400~700자, 정형). 캐시 키 `${mode}:${matchId}` 분리.
- **검증**: validateBrief(brief, input, mode) — Phase 1 350자 / Phase 2 900자 한도. 점수 검증 제거 (쿼터/진행 점수 false positive 방지).
- **검수 UI** (`/admin/news`): 좌 sidebar (draft/published/rejected 탭 + count) + 우 main (목록 + 미리보기 + 액션 4종). Server Actions = `publishNewsAction / rejectNewsAction / regenerateNewsAction / editNewsAction` (revalidatePath 자동).
- **자동 링크**: `LinkifyNewsBody` 컴포넌트 — 매치 출전 선수(name>player_name>nickname fallback) + 양 팀 → `<Link href="/users/{id}">` / `/teams/{id}` 자동 변환. 이름 길이 desc 정렬 (prefix 충돌 방지).
- **5/2 backfill 결과**: 9 매치 draft 9건 생성 (평균 565자, 모두 다양한 관점). 6건 placeholder↔real 통합 후 영향 4건 자동 재생성.
- **Phase E 큐**: `/news` 매거진 메인 + `/news/match/[id]` deep link + `/news/round/[id]` + `/news/daily/[date]` (라운드/일자 종합 prompt 추가).

### [2026-05-03] 알기자 brief Phase 1 정책 재설계 + 데이터 풀 확장 + 다양한 관점 prompt
- **분류**: architecture (LLM 기자봇 / 매치 페이지 통합)
- **발견자**: pm + 사용자 통찰 ("어디 들어가는 어떤 기사냐에 따라 다르다")
- **참조횟수**: 0
- **위치**: `src/lib/news/{prompts/alkija-system.ts, match-brief-generator.ts, validate-brief.ts}` + `src/app/api/live/[id]/brief/route.ts`
- **목적**: `/live/[id]` 요약 탭 [Lead] 섹션 LLM 단신. Header(대회/라운드/일시/장소) + Headline(점수) + Body(MVP) + Stats(통계) 와 중복 X.
- **5/3 재설계 핵심**:
  - **Phase 1 컨텍스트 명시**: prompt에 "매치 페이지 안 1 섹션, 점수/팀명/대회명 반복 X" 박제. 점프볼 D리그 단신(독립 기사, 600~1000자) 패턴 무차별 적용 시 길이 폭증 350자/검증실패 발생 → "흐름·영웅·서사" 만 다루는 150~250자 정책 채택.
  - **데이터 풀 확장**: MatchBriefInput 에 `homeTeamStat`/`awayTeamStat`(야투/3점/리바/어시/스틸/블락/턴오버 합계+%) + `allPlayers[]`(모든 선수 stat) + `doubleDoubles`/`tripleDoubles`(자동 검출) + `topRebounder`/`topAssister`/`topStealer`/`topBlocker`/`topPlusMinus`/`bestThreeShooter`(임계값 충족 시 자동 추출).
  - **다양한 관점 prompt**: system prompt에 10개 관점(야투율 우위/3점 폭격/리바 장악/어시 농구/스틸·블락 수비/더블더블/+/- 결정자/턴오버 차이/쿼터 흐름/승부처 영웅) 명시. 매치마다 데이터 부각된 관점 1~2개 선택 권장.
  - **어조 ~다 통일** (5/3 사용자 결정): `~습니다` 금지, 모든 종결어미 `~다`.
  - **validate-brief 단순화**: 점수 검증 제거 (쿼터/진행 점수 false positive 차단), 승팀명만 강제, 길이 400→350.
- **검증 결과 (5/2 종료 8매치)**: 평균 188자(목표 150~250 적중), fallback 0건, 8건 모두 다른 관점, 점프볼 표현(사수/분전/발목 잡히며/폭격/시소 게임/해결사 면모) 다수, 더블더블 자동 표기(#8 김종민 10-10), +/- 활용(#3 전인규 +30, #7 정환조 +23).
- **Phase 2 분기 큐**: 게시판 'news' 카테고리 발행 시 별도 prompt (점프볼 단신 패턴 풀 적용, 400~700자) — 현 Phase 1 prompt 와 분기 예정.

### [2026-05-03] 가입 신청 일괄 처리 함수 — `src/lib/teams/approve-join-requests.ts` 신규
- **분류**: architecture (운영 lib / 박제 작업 + 추후 admin UI 공용)
- **발견자**: pm
- **참조횟수**: 0
- **위치**: `src/lib/teams/approve-join-requests.ts` (130줄, 신규 1 파일)
- **목적**: `team_join_requests` pending 일괄 처리 — 박제 작업 (5/3 슬로우 케이스) + 추후 admin 일괄 승인 UI 공용 라이브러리.
- **API**:
  - `approveJoinRequests(actions: ApproveAction[], opts?: { processedById?: bigint }): Promise<ApproveResult>`
  - 3 액션: `approve_with_jersey` (team_members + 옵션 tt_players) / `approve_no_jersey` (비활성 멤버) / `reject` (사유 기록)
  - 결과: `{ approved, rejected, teamMembersCreated, ttPlayersCreated, skipped, errors }`
- **핵심 보장**:
  - 트랜잭션: `prisma.$transaction` (timeout 60s, 일부 실패 시 롤백)
  - 멱등성: 이미 approved/rejected 상태인 신청은 skip (중복 호출 안전)
  - 중복 INSERT 차단: team_members `(teamId, userId)` UNIQUE / tt_players `(tournamentTeamId, userId)` UNIQUE 사전 검사
  - playerName fallback: 명시 → User.name → User.nickname → null
- **5/3 첫 적용**: 슬로우 8건 (approve_with_jersey 2 + approve_no_jersey 4 + reject 2 + 별도 placeholder 1) — pending 8→0 / tt_players 5→8 ✅
- **호출 측 영향 0**: 기존 코드 변경 0, 신규 함수만 추가. 기존 `merge-temp-member.ts` 와 동일 디렉토리 + 동일 패턴 (prisma 임포트, $transaction).
- **다음 적용 큐**: SKD 7 / MI 8 / 블랙라벨 9 (5/3 잔여 24건) / 업템포·피벗·아울스·MZ 7건. 추후 admin UI에서도 호출 가능.

### [2026-05-02] STL (Single Truth Layer) Phase 1 — 라이브 페이지 데이터 무결성 응답 가공 레이어
- **분류**: architecture (라이브 페이지 / 데이터 무결성 / Flutter 의존성 격리)
- **발견자**: pm + 사용자 통찰
- **참조횟수**: 0
- **위치**: `src/app/api/live/[id]/route.ts` (단일 파일, +200줄)
- **목적**: Flutter app 의 PBP 누락 (made_shot/올아웃 sub) 으로 발생하는 4개 데이터 출처 (`match.homeScore`/`matchPlayerStat`/`quarterStatsJson`/`play_by_plays`) 간 불일치를 서버 응답 단계에서 일관된 1개 데이터셋으로 재구성.
- **3 계층 설계**:
  - **Layer 1** — 신뢰도 우선순위: 매치 헤더(=matchPlayerStat 합) > quarterStatsJson > PBP > 시뮬
  - **Layer 2** — 자동 보정 룰 (R1/R3/R4/R8): 출처 비교 → 차이 발견 시 상위 출처 우선 보정
  - **Layer 3** — DB 영구 보정 (선택): 종료 매치 manual-fix-* PBP INSERT (현재 Phase 1 미적용)
- **적용 룰**:
  - **R1** (쿼터 점수): PBP `home/away_score_at_time` 시계열 → 쿼터별 누락 점수 식별 + 그 쿼터에 분배 → 매치 헤더 cap (over/under correction) → 음수 gap 가드
  - **R3** (출전 시간): quarterStatsJson 부분 누락 쿼터 (Q*.min=0) 에 `estimateMinutesFromPbp` 시뮬값 주입 (정상 쿼터 건드리지 않음)
  - **R4** (B-2 fallback): minutesPlayed=0 인 선수에게 PBP "in:X,out:Y" 시뮬 적용
  - **R8** (quarter length): PBP max clock 기반 420/480/600/720 동적 매핑 (7분/10분 매치 자동 인식)
- **PBP sync 가드** (`/api/v1/tournaments/[id]/matches/sync`): 운영자 수동 INSERT 보존 — `local_id` startsWith `manual-fix-` OR `description` startsWith `[수동 보정]` 두 prefix 중 하나만 매치되면 deleteMany 에서 제외 (이중 가드)
- **검증 매치 6건**: 101/102/103/132/133/95 모두 매치 헤더 = 쿼터 합 정확 일치
- **Flutter app 영향 0**: 응답만 가공, DB/sync 변경 0
- **확장 가능**: 새 누락 패턴 발견 시 새 룰 1개만 추가 → 시스템 확장. 무결성 메타 정보 응답 (옵션 — `data_integrity` 필드) 으로 운영자 알림 가능.
- **관련 commit**: 0f8da8e (R1) / b18227c (R3) / 8ccd4dd (R4) / f0278b4 (R8) / 1bec5c3 (sync 가드)

### [2026-05-02] 듀얼토너먼트(`dual_tournament`) 풀 시스템 설계 — 27 매치 generator + 5 Stage 시각화
- **분류**: architecture
- **발견자**: planner-architect
- **참조횟수**: 0
- **내용**: `dual_tournament` 포맷의 system 1급 시민화 설계. 동호회최강전 (B 대회, id=`138b22d8…`, 16팀 / 5/2~5/10) 사례 기반.
  - **포맷 정의**: 16팀 → 4조×4팀 미니 더블엘리미 → 조별 1·2위 8팀 → 8강 단판 → 4강 NBA 크로스 (1+4 / 2+3) → 결승. 총 **27 매치**.
  - **Stage 매핑**: round_number 1~6 (1·2 조별, 3 조별 최종전, 4 8강, 5 4강, 6 결승) + bracket_level 0~3 (조별/8강/4강/결승) + group_name "A"~"D".
  - **schema 변경 0** — 활용 컬럼: `next_match_id` (승자 진출) / `settings.loserNextMatchId+loserNextMatchSlot` (조별 패자 진출) / `group_name` (A~D) / `bracket_level` (트리 단계) / `bracket_position` (라인) / `roundName` (조별 1라/승자전/패자전/조별 최종전/8강/4강/결승).
  - **신규 파일 3**: `src/lib/tournaments/dual-tournament-generator.ts` (`generateDualTournament(teams, settings, tournamentId)` — 27 매치 + nextMatch/loserNext 매핑) / `src/lib/tournaments/dual-progression.ts` (`progressDualMatch(matchId, winnerId, tx)` — 승자/패자 자동 진출 단일 책임) / `scripts/_temp/seed-tournament-B-schedule.ts` (Phase E B 대회 일정 일괄 입력).
  - **수정 파일 4**: `bracket-settings-form.tsx` dual 분기 / `api/web/tournaments/[id]/bracket/route.ts` POST dual 분기 (single/league 분기 신설) / `api/web/tournaments/[id]/matches/[matchId]/route.ts` PATCH 의 status=completed 시 progressDualMatch 호출 (모든 format 통합 효과) / `tournament-admin/[id]/bracket/page.tsx` Stage 5섹션 그룹핑.
  - **변경 0 파일**: `tournament-admin/[id]/matches/page.tsx` (기존 일정·점수 UI 호환) / `score-updater.ts` (점수 atomic update 만 — winner 진출은 별도) / `bracket-builder.ts` (Phase F 별도 큐 — 공개 페이지 시각화).
  - **알고리즘 핵심**: createMany 후 next_match_id 2단계 update (자기 참조 FK 회피, league-generator 패턴 차용). settings JSON 안전은 tournament-seeding `Prisma.JsonNull` 패턴 차용. 4강 크로스 = `8강1+8강4 / 8강2+8강3` 매핑 (bracket_position).
  - **5 Phase 계획**: A 인프라(generator+progression, ~2h) / B settings+route(~1.5h) / C progression hook(~1.5h) / D admin UI(~1.5h) / E B 대회 운영 적용(~2h) — 총 ~9h. F 공개 페이지 시각화는 별도 큐.
  - **결정 6건**: (1) 조 배정 = settings 수동 (snake 자동은 사진과 다름) (2) 시드 = TournamentTeam.seedNumber 활용 (3) 진출 트리거 = matches PATCH route 통합 (single/full_league_knockout 도 부재라 통합 효과) (4) 결승 단판/3·4위전 없음 (사진 그대로) (5) clear 정책 single 패턴 유지 (6) bracket-builder Phase F 까지 round_number 그룹핑 유지.
  - **운영 영향**: Phase E 운영 DB 작업 (16팀 seedNumber UPDATE + settings.bracket.groupAssignment 입력 + bracket POST 27 매치 INSERT + scheduledAt/venue UPDATE) 사용자 명시 승인 게이트.
  - **참고 자료**: `Dev/tournament-formats/dual-tournament/README.md` (포맷 정의 + 사진 일정 + 16팀 조 배정 + 5 Stage 흐름 100% 정리)

### [2026-05-01] Q1 Reviews + ContextReviews 박제 — 4탭 → 1탭 + 신규 재사용 컴포넌트
- **분류**: architecture
- **발견자**: developer
- **내용**: 시안 [Phase 16] 통합 리뷰 페이지 4탭 → 1탭(코트만) + ContextReviews 신규 재사용 컴포넌트 + /courts/[id] 인라인 교체. 옛 v2 토큰 → BDR v3 토큰 동시 마이그.
  - **신규 2 파일**:
    - `src/components/reviews/context-reviews.tsx` (351줄) — 시안 ContextReviews.jsx 137줄 1:1 박제. props: `kind: "court"|"series"|"player"` / `targetName` / `reviews` / `summary` / `onWrite?` / `onViewAll?` / `maxVisible=3`. 헤더 (avg + 별점 + total) + 분포 막대 + 카드 3건. 시안 의도: 코트/대회/플레이어 상세에 인라인 사용 (Q1-B 결정에 따라 court 만 우선 도입, series/player 별도 큐).
    - `src/app/(web)/courts/[id]/_components/court-reviews-section.tsx` (251줄) — SWR `/api/web/courts/${id}/reviews` + 5항목 평균 막대 + ContextReviews + ReviewForm 토글 + 본인 리뷰 삭제 통합 래퍼.
  - **삭제 1 파일**: `src/app/(web)/courts/[id]/_components/court-reviews.tsx` (-287줄). 의존성 0 검증 후 삭제.
  - **수정 5 파일**: `review-form.tsx` + `star-rating.tsx` (v3 토큰 마이그) / `courts/[id]/page.tsx` (CourtReviews → CourtReviewsSection 교체 3줄) / `reviews/page.tsx` (헤더 주석 정리) / `reviews/_v2/reviews-content.tsx` (4탭 → 1탭, 507→485, -22).
  - **4탭 깔끔 제거 (Q1-A 비노출 결정)**: `tab` state / `TabBar` / `PENDING_TABS` / `TYPE_COLOR` / `TYPE_LABEL` / `?tab=` URL 잔재 0건 (주석 X). 외부 deep link 0 검증 (grep). git log 복구 가능.
  - **v3 토큰 마이그 (Q1-C)**: 4 파일 토큰 매핑 — color-surface→bg / color-text-*→ink-* / color-primary→accent / color-error→err / color-text-disabled→ink-dim. 옛 `var(--color-*)` 패턴 grep 0건.
  - **데이터 보존 (운영 진짜 기능 100%)**: SWR GET / POST / DELETE / mutate 모두 옛 court-reviews.tsx 패턴 그대로. REVIEW_CATEGORIES 5항목 (facility/accessibility/surface/lighting/atmosphere) 입력 폼 + API body 100% 보존.
  - **검수 통과**: tsc / 13 룰 (lucide 0 / hex 0 / pill 9999 0 / pink-salmon-coral 0) / 회귀 4 (page.tsx만 수정, layout 미터치) / 작업 범위 외 침범 0
  - **후속 큐 (별도)**: `_components/` 11 파일 + `courts/[id]/page.tsx` 19건 옛 토큰 잔존 (작업 범위 외) / ContextReviews series/player 도입 (/tournaments + /users) / `/reviews?courtId=...` deep-link → onViewAll 활성화
- **참조**: decisions.md 2026-05-01 "Q1 Reviews 옵션 A/B/C 채택" / 시안 Dev/design/BDR-current/screens/Reviews.jsx + ContextReviews.jsx
- **참조횟수**: 0

### [2026-05-01] D-3 ProfileWeeklyReport Hybrid 박제 — 시안 v2.4 + TOP 3 코트 보존
- **분류**: architecture
- **발견자**: developer
- **내용**: `src/app/(web)/profile/weekly-report/page.tsx` 920→1125 (+205). 시안 BDR-current/screens/ProfileWeeklyReport.jsx (v2.4) 박제 + 옛 운영 진짜 데이터 (TOP 3 코트 / §06 지난주 비교) 100% 보존 — Hybrid 옵션 B.
  - **6 섹션 구조**: 빵부스러기 + HERO / 인사 + 레벨 / §01 KPI 4 (경기·평균평점·XP·활동시간) / §02 Highlight 베스트 1경기 (NEW DB 미지원 → ComingSoonBadge) / §03 인사이트 3 / **§04 자주 방문한 코트 TOP 3 (Hybrid 보존)** / §05 다음 주 추천 (NEW DB 미지원 → dashed border + ComingSoonBadge) / **§06 지난주 상세 비교 (Hybrid 보존)** / FOOTER + 뒤로가기
  - **데이터 보존 (운영 진짜 기능 100%)**: SWR `/api/web/profile/weekly-report` 패칭 1곳 (변경 0) / `tw.top_courts` (§04) / KPI 5종 모두 표시 (session_count/total_minutes/total_xp/unique_courts/active_days → §01+§06 매핑) / streak/minutes_change 동적 인사이트 (§03)
  - **신규 공통 컴포넌트**: `ComingSoonBadge` (D-6 패턴 차용 — 다른 v3 페이지 재사용 가능, 공통 컴포넌트 격상 큐)
  - **DB 미지원 안내**: §01 평균 평점 카드 "-" + "평점 시스템 준비 중" / §02 Highlight + §05 다음 주 추천 = ComingSoonBadge + 시각 신호 (§05 dashed border)
  - **검수 통과**: tsc / 13 룰 (lucide 0 / pink-salmon-coral 0 / pill 9999 0 / hex 16건 모두 fallback `var(--*, #fallback)` 14 + `#FFFFFF` primary text 2 합법) / 회귀 4 케이스 (page.tsx만 수정)
- **참조**: decisions.md 2026-05-01 "D-3 ProfileWeeklyReport 옵션 B 채택" / 시안 Dev/design/BDR-current/screens/ProfileWeeklyReport.jsx
- **참조횟수**: 0

### [2026-05-01] ProfileShell 폐기 — /profile/* 깊은 페이지 sidebar 0 (v2.3 hub 모델)
- **분류**: architecture
- **발견자**: pm + 사용자 (Cowork 직접 patch)
- **내용**: `src/app/(web)/profile/layout.tsx`에서 `<ProfileShell>` wrap 제거 → 단순 children passthrough. metadata는 server layout에 보존.
  - **변경 전**: `layout.tsx` → `<ProfileShell>{children}</ProfileShell>`. `ProfileShell`은 `usePathname()`으로 `/profile` 정확 일치만 hub 분기 + sub(`/profile/edit`/`/profile/billing` 등)는 220px `<ProfileSideNav>` aside 노출.
  - **변경 후**: `layout.tsx` → `<>{children}</>`. 모든 `/profile/*` sub 페이지에서 외부 sidebar 0.
  - **사유**: v2.3 시안 의도 = MyPage hub 카드 진입 → 깊은 페이지는 단독 풀폭(sidebar 0). `ProfileShell`의 isHubRoot 분기는 hub root만 hide / sub는 노출 = v2.3 sidebar 0 원칙 위반.
  - **발견 경로**: 사용자가 dev server (localhost:3001/profile/edit)에서 옛 좌측 sidebar (개인정보/활동/농구/설정·결제) 잔재 발견. ad774d9 revert 시 옛 layout.tsx의 ProfileShell wrap이 그대로 따라옴.
  - **검증**: `tsc --noEmit` profile 에러 0 / `grep ProfileShell` 실제 import/사용 0건 (정의 파일 `src/components/profile/profile-shell.tsx` + 주석만 잔존, 후속 cleanup 대상).
  - **영향 범위**: `/profile` (hub) 무영향 (자체 layout) / `/profile/edit` (D-6 박제 단일 스크롤 정합) / `/profile/billing`·`basketball`·`growth`·`bookings`·`weekly-report`·`activity`·`complete`·`preferences`·`notification-settings`·`payments`·`subscription`·`achievements` 모두 외부 sidebar 사라짐 (v2.3 hub 모델 일관 적용).
  - **후속 cleanup**: `src/components/profile/profile-shell.tsx` (+ 의존하던 `profile-side-nav.tsx`있다면) 의존성 0 → 별도 commit으로 삭제 가능.
- **참조**: lessons.md 2026-05-01 "revert + 부분 hub 패치 잔재" / decisions.md 2026-05-01 "ProfileShell 폐기 결정"
- **참조횟수**: 0

### [2026-05-01] D-6 EditProfile Hybrid 박제 — 단일 스크롤 + Hero + 5섹션
- **분류**: architecture
- **발견자**: developer
- **내용**: `src/app/(web)/profile/edit/page.tsx` 1547→1233줄 + `edit-profile.css` 신규 603줄. 시안 BDR-current/screens/EditProfile.jsx (v2.3) 단일 스크롤 + Hero + 4섹션 박제 + **5번째 "추가 설정" 섹션 신설** 으로 시안에 없는 진짜 기능 4종 (환불 계좌·회원 탈퇴·닉네임 중복확인·AI bio) 흡수 — Hybrid 옵션 B.
  - **변경 전**: 5탭 사이드 + 220px aside (sticky top:120) + 6 sub-tab (basic/skill/contact/refund/photo/privacy)
  - **변경 후**: 단일 스크롤 + Hero (200px RDM 아바타 + 카메라 버튼 photo_camera) + 5섹션 (§1 기본 / §2 플레이 / §3 연락 / §4 공개 / §5 추가) + Sticky save bar (`position:sticky bottom:0 backdrop-filter:blur(8px)`)
  - **5섹션 흡수 매핑**: photo 탭 → Hero 카메라 / refund 탭 → §5 추가 설정 / privacy 탭 Danger Zone(withdraw) → §5 추가 설정 / 닉네임 중복확인 → §1 input 옆 / AI bio (POST `/profile/generate-bio`) → §1 자기소개 textarea 우상단 absolute
  - **데이터 보존 (운영 진짜 기능 100%)**: handleSave (PATCH `/api/web/profile`) / handleImageUpload (POST `/profile/upload-image`) / handleImageDelete (DELETE `/profile/delete-image`) / handleCheckNickname (GET `/profile/check-nickname`) / handleGenerateBio (POST `/profile/generate-bio`) / handleWithdraw (DELETE `/auth/withdraw`) / 환불 계좌 (BANKS + bank_name/bank_code/account_number/account_holder/consent) / 소셜 연동 표시 (kakao/google/apple/naver) / RegionPicker (사이트 컨벤션) / formatPhone / nicknameCheck 입력값 변경 시 무효화 / PageBackButton / reload 1.5초 (헤더 me 재호출)
  - **시안 박제 신규 UI** (DB 미저장, 시각만): §2 사용손 3칩 / 실력 6칩 / 강점 10칩 multi / §4 공개 7항목 × 3옵션 / §3 인스타·유튜브 disabled
  - **검수 통과**: tsc / 13 룰 (hex 6건 모두 합법: 소셜 브랜드 4 + #fff 2 / pink-salmon-coral 0 / lucide 0 / pill 9999 0) / 회귀 4 케이스 (page.tsx만 수정, layout 별도 fix commit으로 분리)
- **참조**: decisions.md 2026-05-01 "D-6 Hybrid 옵션 B" / 시안 Dev/design/BDR-current/screens/EditProfile.jsx
- **참조횟수**: 0

### [2026-05-01] Phase 13 마이페이지 hub 박제 — /profile = 3-tier + aside
- **분류**: architecture
- **발견자**: pm
- **내용**: `src/app/(web)/profile/page.tsx` 본문을 BDR-current/screens/MyPage.jsx 시안 1:1 박제. 옛 좌측 320px aside (HeroCard + TeamSideCard + BadgesSideCard) + 우측 main (SeasonStats + UpcomingGames + ActivityTimeline) 6컴포넌트 구조 → **Hero strip + 3-tier hub + aside 4카드** 구조로 재구성.
  - **Hero strip**: 아바타 76px (팀 색 그라디언트) + 닉네임 의 농구 + 팀명·포지션·시즌라벨 + L.N/PRO/✓본인인증 배지 + 우측 액션 3 버튼(편집/알림/공개프로필). 모바일 56px 아바타 + edge-to-edge.
  - **Tier 1 큰 카드 4종** (.mypage-card--lg, 220min): 프로필(닉네임·실명·포지션·인증) / 내 농구(PPG/APG/RPG/RTG 4-stat) / 내 성장(SVG sparkline 12주) / 내 활동(13주 막대). 데스크톱 4col → 1023px 2x2 → 720px 2col 160min.
  - **Tier 2 중간 카드 4종** (.mypage-card--md, 96min): 예약 이력 / 주간 리포트 NEW / 알림 N건 / 배지·업적. 720px 1col row 56min.
  - **Tier 3 작은 카드 2종** (.mypage-card--sm, 64min): 설정 / 결제·멤버십. 720px 1col 56min.
  - **Aside 4 카드**: D-N 다음 경기 (countdown 38px BDR Red) / 소속 팀 (tag+name+rec) / 최근 활동 5건 (post+application merge desc) / 도움말 (도움말+안전·차단). 1023px 2col → 720px 1col stack.
  - **CSS**: BDR-current/mypage.css 948줄 1:1 카피 → `src/app/(web)/profile/mypage.css` 신설 + page.tsx에서 import (Next.js App Router 자동 글로벌 적용). 옛 globals.css `.mypage-hub-grid/.mypage-quick-grid/.mypage-large-grid` 룰은 새 시안 클래스 (`.mypage-hub__tier-1/tier-2/tier-3`) 와 다름 — 보존(추후 정리).
  - **데이터 매핑**: 8 쿼리 prefetch 보존 + `user.nickname`/`user.name`/`user.position` Hero / `getProfileLevelInfo(xp)` 옵셔널 (xp null → null) / `subscription_status==="active"` PRO / `profile_completed` 본인인증 / `teamMembers[0].team` primaryTeam / `nextGameApp.games` D-N + venueName + scheduled_at / `unreadCount` Tier2 알림 + Hero 액션 / `playerStats.careerAverages` PPG/APG/RPG + `evaluation_rating` RTG / `recentPosts` + `recentApplications` merge desc 5건 → aside.
  - **라우팅 (Next.js Link)**: 시안 `setRoute(...)` 10건 → /profile/edit / /profile/basketball / /profile/growth / /profile/activity / /profile/bookings / /profile/weekly-report / /notifications / /profile/achievements / /profile/settings / /profile/billing / /users/[id] (공개 프로필) / /games/[uuid8] (다음 경기) / /teams/[id] / /help / /safety.
  - **시각 mock 보존**: sparkline 12주 + activity 13주 막대 = hub 카드 시각 hint. 진짜 데이터는 P1 깊은 페이지에서. 시안 의도 일치.
  - **AppNav frozen Phase 19**: `src/components/bdr-v2/app-nav.tsx` (R-C-4 적용 — main bar 우측 [다크/검색/쪽지/알림/햄버거] 5개 / `app-nav__icon-btn` 클래스 / 더보기=drawer 토글 / mail_outline 쪽지) + `more-groups.ts` (계정·도움 첫 항목 🏠 mypage → /profile, 가짜링크 4건 제거) — 모두 운영 이미 박제 완료, page.tsx 변경 없음.
  - **회귀 검수 4 통과**: ❌ 더보기 ▼ dropdown / ❌ 모바일 듀얼 라벨 / ❌ 검색·쪽지·알림 박스 / ❌ 우측 순서 변경 — 모두 0건.
  - **13 룰 검수 통과**: 하드코딩 hex 0(teamInk = `var(--ink-on-accent, #fff)` 토큰 fallback) / 핑크·살몬·코랄 0 / lucide-react 0 / pill 9999px 0 (시안 카피 mypage.css의 .badge--ok 등은 4px) / placeholder "예: " 0.
  - **보존**: API/route.ts/Prisma 스키마 0 변경 / getWebSession + Promise.all 8 쿼리 / snake_case 직렬화 / `/users/[id]` 분리 (본인 hub vs 타인 단순) / Page-BackButton 모바일 백버튼.
  - **사용 중단**: HeroCard / SeasonStats / UpcomingGames / ActivityTimeline / TeamSideCard / BadgesSideCard 6 컴포넌트 (page.tsx에서만 import — grep 검증). _v2/ 폴더는 보존 (P1 작업 시 정리).
- **참조**: Dev/design/v3-rebake-prompt-2026-05-01.md §1 P0 / claude-project-knowledge/00-master-guide.md 13 룰 / 06-self-checklist.md §1~§6
- **참조횟수**: 0

### [2026-05-01] Dev/design/ 단일 폴더 룰 + BDR-current 동기화
- **분류**: architecture
- **발견자**: pm
- **내용**: 디자인 시안 폴더 구조 통합. **활성 시안 단일 룰**: `Dev/design/BDR-current/` 단 하나만 활성. 옛 시안은 `_archive/{BDR v2, v2.2, v2.3, v2.4, audit-results, ui_breaking, v2-original, prompts}/` 격리.
  - **루트 보존 3 .md**: `DESIGN.md`(영구) / `README.md`(폴더 가이드) / `v3-rebake-prompt-2026-05-01.md`(P0/P1/P2 박제 가이드)
  - **루트 보존 3 폴더**: `BDR-current/`(활성) / `claude-project-knowledge/`(13 룰 9 파일) / `team-logos/`(영구)
  - **워크플로우 5단계** (새 zip 받았을 때): (1) 새 zip 풀이 → 임시 폴더 (2) 기존 `BDR-current/` → `_archive/BDR vX.Y/` 이동 (3) 새 zip의 `Dev/design/BDR vX.Y/` → `BDR-current/` 카피 (4) zip 최상위 옛 시안 → `_archive/v2-original/` (5) `Dev/design/README.md` 갱신 + commit `design: BDR-current sync vX.Y`
  - **명명 룰**: zip 파일명 ≠ 시안 버전 (zip = 작업 일자 묶음 / 시안 버전 = `BDR vX.Y/` 안 / 활성 = `BDR-current/`). CLI 박제 작업의 모든 참조는 `BDR-current/` 만 사용 (`BDR vX.Y/` 직접 참조 자동 reject).
  - **마이페이지 박제 7 commit revert**: `5f5cfac~8aea145` (캡처 16~30 매칭 시도) → `ad774d9` 시점 복원. v3-rebake-prompt-2026-05-01.md 기반 P0 박제로 재진행.
- **참조**: CLAUDE.md §🗂️ Dev/design/ 폴더 구조 / Dev/design/README.md / v3-rebake-prompt-2026-05-01.md / 커밋 f2df385(revert) + 8a5cb7b(design)
- **참조횟수**: 0

### [2026-04-29] BDR v2 Hero 카로셀 + 글로벌 헤더 단일화 + 모바일 가드 (Phase 9-Mobile)
- **분류**: architecture
- **발견자**: pm + developer
- **내용**: BDR v2 홈 영역 구조 개편 + 모바일 가드 추가.
  - **Hero 카로셀 신규**: `src/components/bdr-v2/hero-carousel.tsx`(client controller) + `src/components/bdr-v2/hero-slides/`(slide-1~5 server 컴포넌트 5종 + slide-1-client.tsx 1개) — 모든 슬라이드 absolute stacking + opacity 토글 + setInterval 자동 슬라이드(5초) + 터치 스와이프 + 점 인디케이터.
  - **신규 prefetch 함수**: `src/lib/services/home.ts`에 `prefetchHeroSlides()` + 3종 (`prefetchTournamentSlide()`/`prefetchGameSlide()`/`prefetchMvpSlide()`) — Hero 카로셀이 5종 서버 컴포넌트로 병렬 prefetch + SSR.
  - **글로벌 헤더 단일화**: `(web)` 라우트 그룹의 단일 헤더는 AppNav (`src/components/bdr-v2/app-nav.tsx` 가정). `(admin)`은 AdminSidebar / `(referee)`는 referee-shell이 독자 헤더 — **의도된 분리**(헤더 변경 시 라우트 그룹별 별도 작업 필요).
  - **모바일 가드 (globals.css)**: `@media (max-width: 720px)` 글로벌 룰 — `html, body { overflow-x: hidden }` + `input, select, textarea { font-size: 16px !important }` (iOS Safari 자동 줌 차단) + `button { min-height: 44px }` (iOS HIG 터치 타겟).
  - **브레이크포인트**: 720px 통일 (Tailwind 768px 미사용, mybdr 기존 컨벤션).
- **참조**: decisions.md "Hero 카로셀 외부 라이브러리 0" / "카로셀 stacking 방식" / "모바일 브레이크포인트 720px 통일" / conventions.md "모바일 최적화 체크리스트" 2026-04-29
- **참조횟수**: 0

### [2026-04-27] Phase 10-1 경기 평가/신고 시스템 설계 — 신규 2테이블 + 캐시 1컬럼
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 박제된 `/games/[id]/report` 페이지를 활성화하는 시스템 기획. **DB 신규 2 + 캐시 1컬럼**: (1) `game_reports` (id/game_id/reporter_user_id/overall_rating 1~5/comment/mvp_user_id?/status submitted|draft|reviewed|dismissed/created_at/updated_at) + `@@unique([game_id, reporter_user_id])` 1인1리포트 강제, (2) `game_player_ratings` (game_report_id/rated_user_id/rating 1~5/flags TEXT[]/is_noshow boolean) — flags는 enum 미도입(시안 5종 noshow/manner/foul/verbal/cheat) String[] 유지로 마이그 비용 절감, (3) `games.final_mvp_user_id BigInt?` 캐시 컬럼만 추가. **manner_score**는 응답시점 매번 aggregate(캐시 X) 권장 — Q1 결정에 따라 users 컬럼 신설(manner_score+manner_count) vs 기존 evaluation_rating 재활용. **API 4**: POST/GET/PATCH `/api/web/games/[id]/report` (24h 수정 윈도우) + admin GET `/api/web/admin/game-reports` (flags 있는 것 큐). **권한 가드 4**: status===3 종료 / game_applications.status===1 approved 참가자(or organizer_id 호스트) / unique 1인1 / 24h 윈도우. **MVP 집계**: 다수결 → tie-breaker는 ratings 평균 → games.final_mvp_user_id 캐시 (POST 시점 1회 호출, idempotent). **신규 lib 2**: `src/lib/games/report-auth.ts`(canReportGame) + `mvp-aggregate.ts`(recomputeFinalMvp). **page.tsx 활성화**: server wrapper + client form 분리, PLACEHOLDER_PLAYERS → game_applications include users 조회, alert→fetch, 24h 이내 진입 시 GET prefill. **마이그레이션**: prisma/migrations/manual/phase_10_1_game_reports.sql 별도 + 개발 DB migrate dev / 운영 DB migrate deploy는 PM 명시 승인 후 (lessons.md 04-18 .env=운영DB 사고 재방지). **PM 결정 7건(Q1~Q7)** 도출. **9단계 작업 분해(B-1~B-9)**, MVP 최소 범위 B-1~B-7 6~8h. **위험 6건**: IDOR / Race(P2002→409) / manner 캐시 정합 / 익명성(다른 reporter 노출 X) / MVP 동률 / 운영 DB 마이그.
- **참조횟수**: 0

### [2026-04-25] 코트 대관(Booking) 시스템 설계 — feature_key=court_rental 재활용 + 신규 1테이블 MVP
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 코트 대관 시스템 4 Phase 기획. **기존 인프라 80% 재활용**: (1) `plans.feature_key="court_rental"` 이미 존재 (admin/plans/page.tsx + pricing/page.tsx 라벨 등록), (2) `/api/web/payments/confirm` 토스페이먼츠 승인 + `user_subscriptions` 30일 자동 발급 흐름 가동, (3) `payments.payable_type` 다형성 ("Plan"만 사용 중 → "CourtBooking" 추가 가능), (4) `court_infos.user_id` 등록자 추적 가능, (5) `court_infos.rental_available/rental_url/fee` 외부 링크 안내 수준 존재, (6) `partners`+`/partner-admin/venue` 광고용 별개 시스템 — 멤버십과 무관하므로 코트 운영자에 사용 X. **신규 필요**: court_bookings 테이블 1개 + court_infos에 booking_mode/booking_fee_per_hour 2컬럼 + User 백릴레이션 1줄. **운영자 ↔ 코트 매핑 단순화**: court_managers N:M 신규 모델 보류 → court_infos.user_id(1:1) + user_subscriptions(feature_key=court_rental, status=active) 검사 조합으로 충분. **가드 헬퍼**: `src/lib/courts/court-manager-guard.ts`(referee admin-guard 패턴 재사용). **동시성**: $transaction + FOR UPDATE + partial unique index(WHERE status='confirmed') + 슬롯 잠금 status=pending(15분 만료). **4 Phase**: A=무료 MVP(8~12h, final_amount=0) / B=토스결제(6~8h, payments 다형성 활용) / C=정산+자동환불+수익 대시보드(8~10h, court_settlements 신규 1테이블) / D=BDR+할인+운영자 신청 승인+court_managers N:M(6~8h). **사용자 결정 7건(D-B1~D-B7)**: 운영자 자격(추천 court_rental 구독자만) / 매핑 모델(추천 1:1) / 외부vs자체 토글(추천 booking_mode 토글) / 수수료(MVP 0%) / 정산(추천 출금 신청형) / 환불(MVP 수동승인) / KYC(MVP 생략). **Phase A 산출 파일 10개**: 신규 8(court-manager-guard.ts/booking-conflict.ts/api 3 route/page 3) + 수정 2(schema.prisma/court-detail-v2.tsx). **시안 위치**: Dev/design/BDR v2/screens/CourtBooking.jsx(199줄, 회원 관점만 — 운영자용 시안 없음 → Phase A에서 BDR v2 토큰 기반 신규 디자인 필요).
- **참조횟수**: 0

### [2026-04-24] BDR v2 전체 로드맵 — design_v2 브랜치, 74 페이지 10 Phase
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: v2 48 시안 × 기존 88 페이지 매핑 완료. 3 버킷 분류 — A) 1:1 직접 매핑 18건(Home/Games/Profile/Teams/Tournaments/Community/Courts/Login/Pricing/Settings/Help/Search/Orgs/Referee 등 코어 라우트), B) v2 전용 16건(Shop/Stats/Safety/Reviews/Gallery/Coaches/Rank/Achievements/Awards/Saved/Scrim/GuestApps/TeamInvite/TournamentEnroll/Messages/Calendar — 대부분 DB 모델 없음, 보류/흡수/정적 페이지화), C) 기존 전용 17건(tournament-admin 13 + partner-admin 4 + profile/growth·weekly-report·notification-settings·complete 등 — 옵션 2 "토큰만 교체" 추천). **10 Phase 구성**: 0(토큰+폰트+responsive, 2h) → 1(Home/Games/GameDetail/Live/Profile 8-10h) → 2(CreateGame/Result/MyGames/Noti/Search 6-8h) → 3(팀·대회 12페이지 18-22h) → 4(커뮤니티 4페이지 5-6h) → 5(프로필/랭킹 7페이지 8-10h) → 6(인증·결제 12페이지 10-12h) → 7(코트·Settings 10페이지 10-12h) → 8(admin 토큰 교체 19페이지 6-8h) → 9(정리+PR 4-6h). 총 77~94h (단축 시 62h). **공통 컴포넌트 위치**: `src/components/bdr-v2/` 신규 폴더, Phase 0에 AppNav/Drawer/Sidebar/Avatar/PromoCard/StatsStrip 6개 선제 추출, 이후 Phase별 점진 추출(3회 사용 기준). **PR 전략 C 혼합**: Phase 0+1 선 머지 → Phase 2~9 매주 rolling PR(6회) → 최종 정리 PR. 매주 design_v2 ← dev rebase. **전제 완화**: "API/데이터 패칭 절대 변경 금지" 규칙을 백엔드(route.ts)·Prisma 한정으로 좁힘. 클라이언트 페칭/상태/props shape는 v2 맞춤 조정 허용. **사용자 결정 8건** 중 D1(primary 반전)·D2(brutalist radius)·D8(PR 전략)만 Phase 0 착수 전 필수.
- **참조횟수**: 0

### [2026-04-21] L2 본 설계 — 공용 컴포넌트 3종 + `/users/[id]` 본인 분기 + 티어 제거
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: L2 본 설계(audit 후속). (1) **공용 컴포넌트 3종 위치**: `src/components/profile/profile-hero.tsx`(공용, viewMode "owner"|"visitor" prop + ownerAction/visitorAction slot) + `mini-stat.tsx`(추출) + `recent-games.tsx`(variant "list"|"table" prop, 본인=list+chevron / 타인=table+스탯). 기존 `/profile/_components/profile-hero.tsx`는 re-export wrapper로 축소하여 import 경로 호환. `/profile/_components/recent-games-section.tsx`도 동일. (2) **`/users/[id]` 본인 분기**: `isOwner = BigInt(session?.sub) === user.id` → ActionButtons 숨김 + OwnerEditButton 렌더(→ `/profile/edit`) + 비공개 필드(email/phone/birth_date/weight/bank_name/account_number) select 추가. (3) **티어 제거 + 레벨 통합**: `getTierBadge()` (users/[id]/page.tsx L50-56) 제거 → 본인·타인 모두 Lv.N 배지(BDR Red round) 동일 컴포넌트. (4) **편집 경로 = B. 기존 `/profile/edit` 재활용** (신규 `/users/[me]/edit` 도입 시 네비 중복 + 308 ≥4건 필요). (5) **gamification 공개 API**: `GET /api/web/users/[id]/gamification`(비인증, xp select 후 getLevelInfo → {level,title,emoji}). 단 `/users/[id]` 서버 컴포넌트는 API 대신 getLevelInfo 함수 직접 호출로 snake_case 재발 리스크 0. (6) **Teams 섹션**: 타인 프로필에 신규 `<UserTeamsGrid>` 추가 (Hero 아래, 레이더 위). 필터 `team.is_public !== false && team.status === "active"`. 기존 `current-team-card.tsx`는 본인 전용이라 재활용 불가. (7) **`/profile` 대시보드 재정의**: BasicInfoCard/RefundAccountCard 제거 → `/profile/edit` 상단 읽기전용 요약 블록으로 이관. 유지: Hero + 다음 경기 + 활동 요약(M4) + 빠른메뉴 + 로그아웃. Client 유지(useSWR 패턴). 네비 라벨 "내 정보" 유지(변경 불필요). (8) **레거시 삭제**: `profile-header.tsx`(207L, import 0건). (9) **Prisma 마이그레이션 0** (User.is_public 도입 X, select-level 유지). 총 공수 ~8h (병렬 반영).
- **참조횟수**: 0

### [2026-04-20] L2 진입 전 audit — `/users/[id]` ↔ `/profile` 공통/차이
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: L2 착수 전 현행 분석. (1) **`/users/[id]`** = Server 컴포넌트 + prisma 직접 7쿼리(Promise.all), `/api/web/users/[id]` 루트 route 없음. Hero+티어배지+MVP카드+레이더+시즌스탯+최근5경기. (2) **`/profile`** = `"use client"` + useSWR 3개(`/api/web/profile` + `/gamification` + `/stats`), ProfileShell 래퍼로 좌220px 네비 7항목 + 4카드 그리드(BasicInfo/Teams·Tournaments/Refund/Danger). (3) **공통 섹션**: Hero(아바타·이름·포지션/지역/신장), 팔로워/팔로잉 카운트, 승률(`getPlayerStats` 재사용), 경기수. (4) **본인 전용**: email/phone/birth_date/환불계좌/레벨·칭호/next_game/편집·설정·구독·결제·주간리포트. (5) **타인 전용**: 티어배지(경기수 기반)/MVP카드(더미)/레이더/시즌스탯/최근경기. (6) **컴포넌트 분산 맵**: radar-chart는 `profile/_components/`에서 `users/[id]/_components/user-radar-section.tsx`가 이미 import 재사용 ✅. Hero/MiniStat/RecentGames/StatsDetail은 전부 2벌 중복. `profile/_components/profile-header.tsx`(207L)는 어디에서도 import 0건 = 레거시. (7) **스키마**: User 모델(schema.prisma L11-168)에 `is_public`/`privacy`/`visibility` **전무** — 공개/비공개 정책은 `page.tsx`의 select 필드 whitelist로만 강제. (8) **간극 10건** / **선행 정책 질문 7건**(경로 전략 A vs B / 비공개 기본 범위 / User.is_public 도입 여부 / 티어 vs 레벨 통합 / `/profile` 정체성 / MVP 카드 처리 / Teams 섹션 공개 여부). (9) **공수 재추정 11~13h**(기획 15h 대비 −20% — 공용 컴포넌트 일부 선행 존재 + API 변경 불필요 확인).
- **참조횟수**: 0

### [2026-04-20] L3 다음 단위 — Organization 브레드크럼 + SeriesCard + EditionSwitcher
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: L3 초입(eb9c910, 대회·시리즈 브레드크럼 4단) 후속. 영향 5파일(신규 2 + 수정 3). (1) 신규: `src/components/shared/edition-switcher.tsx`(이전/다음/전체 3버튼, Material Symbols chevron_left/apps/chevron_right, disabled 시 span 폴백, CSS 변수 색상) + `src/app/(web)/tournaments/[id]/_components/series-card.tsx`(로고+시리즈명+"M회차/전체 N회차"+"시리즈 전체 보기"+EditionSwitcher 내장, series_id 있을 때만 렌더). (2) 수정: `/organizations/[slug]/page.tsx`(shared/Breadcrumb 2단 삽입, 기존 시리즈 카드 목록 유지) + `/organizations/[slug]/series/[seriesSlug]/page.tsx`(인라인 nav 15줄을 shared/Breadcrumb 3단으로 교체) + `/tournaments/[id]/page.tsx`(series include에 tournaments select 추가하여 prev/next 계산 + Hero 직후 SeriesCard 삽입). (3) **신규 API 0** — 기존 `/api/web/series/slug/[slug]`가 이미 editions 배열 포함 완전 반환. `/api/web/series/[id]/editions`는 POST(회차 추가)로 이름 충돌 주의. (4) Prisma 변경 0 — `tournament.series_id BigInt?` + `edition_number Int?` 기존 필드 재활용. (5) 공식 기록 가드 해당 없음(메타만 조회). (6) **Organization 페이지 이미 존재** — 신규 라우트 아님. 브레드크럼만 누락된 상태였음.
- **참조횟수**: 0

### [2026-04-15] 팀명 2필드 구조 (Team.name_en + name_primary) + Referee 시스템 통합
- **분류**: architecture
- **발견자**: developer
- **내용**: Team 모델 2개 필드 추가 — name(한글 필수) + name_en(영문 선택) + name_primary("ko"|"en", 기본 "ko"). 대회/경기/랭킹 전역에서 name_primary에 따라 한글/영문 우선 표시. 동시에 subin-referee 브랜치의 Referee 시스템 14개 모델(associations, association_admins, referees, referee_documents, referee_matches, referee_payouts, referee_reviews 등)을 현재 schema에 통합하여 브랜치 간 schema 분기 해소.
- **참조횟수**: 0

### [2026-04-14] 대회 상세 페이지 전면 개편 (탭 4개 + 히어로 통합 + 1열)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: `/tournaments/[id]` 상세 페이지 구조 개편. (1) 탭 4개: 대회정보 / 대진표 / 일정 / 참가팀 (기존 "순위" 탭 제거 → 대진표에 리그 순위표 통합). (2) 히어로 통합: PREMIUM 뱃지 + 날짜/장소/참가비/팀수 요약 + 참가 신청 버튼 + 캘린더 추가 + 문의 버튼(settings.contact_phone 기반). (3) 레이아웃: 사이드바 완전 제거 → 1열 전체 너비. (4) 참가 현황 프로그레스바로 "N/max팀" 시각화. (5) 영향 파일: tournaments/[id]/page.tsx, tournament-hero.tsx(신규), tournament-tabs.tsx.
- **참조횟수**: 0

### [2026-04-14] 대진표 시스템 4단계 구현 (리그+토너먼트 자동 흐름)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: format별 대진표 시스템 단계적 구현. (1) Phase 1 — 풀리그 순위표: LeagueStandings 컴포넌트, 경기결과 실시간 집계(public-standings 패턴). (2) Phase 2A — 리그 완료 시 토너먼트 자동 팀 할당: assignTeamsToKnockout() 유틸, 순위 기반 TournamentTeam.seedNumber + homeTeamId 설정. (3) Phase 2B — 토너먼트 시드 뱃지 표시(TournamentTeam.seedNumber). (4) Phase 2C — 토너먼트 뼈대 미리 생성 + 슬롯 플레이스홀더(settings.homeSlotLabel="A조 1위" 등). (5) Phase 3 — admin wizard 포맷 세부설정(BracketSettingsForm, knockoutSize/thirdPlaceMatch/seedingMethod). (6) Phase 4a — 풀리그 경기 자동 생성(league-generator.ts, N*(N-1)/2 조합). 신규 파일: src/lib/tournaments/league-generator.ts, assign-knockout.ts.
- **참조횟수**: 0

### [2026-04-14] 토너먼트 트리 NBA.com 스타일 (BracketView 개편)
- **분류**: architecture
- **발견자**: developer
- **내용**: 기존 절대위치 데스크톱 + 탭형 모바일 이원화 구조를 SVG 기반 단일 트리로 통일. (1) BracketView SVG 트리로 모바일/PC 동일 렌더링 + 가로 스크롤 + 좌/우 네비 버튼. (2) 카드 분리형: home/away 개별 카드 + gap-0.5로 붙여서 표시. (3) 좌측 세로 띠: 팀 유니폼 색 반영, 미확정 팀은 BDR Red(홈)/Navy(원정). (4) 슬롯 플레이스홀더 텍스트 표시("A조 1위" 등). 영향 파일: bracket-view.tsx, match-card.tsx.
- **참조횟수**: 0

### [2026-04-14] 대회 선수 userId 자동 연결 시스템 (link-player-user.ts)
- **분류**: architecture
- **발견자**: developer
- **내용**: TournamentTeamPlayer.userId NULL 문제 해결 — 이름 매칭 기반 자동 연결 로직. (1) 핵심 유틸: src/lib/tournaments/link-player-user.ts(팀 멤버 이름 매칭으로 userId 설정, 정확 일치만 허용). (2) 현장 등록(v1 players API) 시 create 직후 자동 매칭. (3) admin 배치 API: /api/web/admin/tournaments/link-players (기존 NULL 데이터 일괄 정리). (4) 매칭 후보 2명 이상이면 skip(안전). (5) 프로필/랭킹의 userId 기반 집계 쿼리가 정상 작동하도록 복구.
- **참조횟수**: 0

### [2026-04-14] 사이트 전역 팀명/선수명 Link 전환
- **분류**: architecture
- **발견자**: developer
- **내용**: 모든 팀명 텍스트 → `<Link href="/teams/{teamId}">`, 모든 선수명 텍스트 → `<Link href="/users/{userId}">`로 전환. 대회 경기 카드, 랭킹, 프로필 등 전역 적용. 예외: 일정 카드 내부 팀명 — 카드 전체가 이미 Link라 중첩 불가 → 내부 팀명은 Link 생략. 영향 파일: 10+ 카드 컴포넌트.
- **참조횟수**: 0

### [2026-04-13] 대회 선수 등록 및 userId 연결 흐름 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: TournamentTeamPlayer.userId 연결 경로 전수 분석. (1) 웹 참가신청(POST /api/web/tournaments/[id]/join): TeamMember에서 userId를 받아 TournamentTeamPlayer에 설정 -- userId 항상 존재. (2) Flutter 현장등록(POST /api/v1/tournaments/[id]/teams/[teamId]/players): player_name+jersey_number만 입력, userId=null 고정, auto_registered=true -- NULL 원인. (3) admin 팀등록(POST /api/web/tournaments/[id]/teams): TournamentTeam만 생성, 선수 미등록 -- 이후 Flutter에서 등록하면 경로(2)와 동일. (4) 프로필/랭킹에서 대회 기록 조회는 모두 userId 기준(findMany/aggregate/groupBy). userId NULL이면 기록 미표시. (5) merge-temp-member.ts가 유사 패턴(이름매칭+병합)이나 TeamMember 전용이라 TournamentTeamPlayer와 무관. (6) unique 제약: @@unique([tournamentTeamId, userId])와 @@unique([tournamentTeamId, jerseyNumber]) 2개 존재.
- **참조횟수**: 0

### [2026-04-13] 대회 형식 프리셋 시스템 구조 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 대회 조별리그+토너먼트 자동 구성 시스템 설계. (1) 신규 유틸 3파일: src/lib/tournaments/preset.ts(12개 프리셋 정의 + 팀수 기반 추천), group-draw.ts(스네이크 드래프트 조편성 + 조별리그 풀리그 경기 생성), knockout-seeding.ts(교차 시딩 + BYE 배정 + 3/4위전). (2) 신규 API: /api/web/tournaments/[id]/group-draw(POST 자동조편성, GET 조편성조회). (3) 수정: bracket/route.ts에 format 분기 추가(group_stage_knockout 시 조별+토너먼트 연속 생성). (4) 데이터 저장: Tournament.settings Json에 preset{totalTeams,groupCount,teamsPerGroup,advancingPerGroup,wildcards,knockoutSize,thirdPlaceMatch}와 groupDraw{method,groups,drawnAt} 저장. DB 스키마 변경 없음. (5) 기존 single_elimination 로직 유지, format별 분기로 새 로직 추가. (6) 조별리그 경기는 TournamentMatch.group_name만 설정, round_number/bracket_position은 null. 토너먼트 경기는 기존과 동일. (7) wizard UI에 프리셋 선택 + 조편성 확인/수정 단계 추가 예정.
- **참조횟수**: 0

### [2026-04-13] 경기 기록 입력 시스템 전체 구조 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: Flutter 앱(bdr_stat) 기록 입력 기능의 서버측 구조 전수 분석. (1) 2가지 기록 방식: 이벤트 기반(match_events 테이블, 실시간 득점/파울/리바운드 등 개별 이벤트 기록) + 최종 스탯 동기화(MatchPlayerStat 테이블, 경기 종료 후 전체 스탯 upsert). (2) API 구조: /api/v1/matches/[id]/events(이벤트 CRUD), /api/v1/matches/[id]/events/batch(배치 이벤트), /api/v1/matches/[id]/events/[eventId]/undo(이벤트 취소), /api/v1/matches/[id]/stats(스탯 CRUD), /api/v1/matches/[id]/roster(선수 명단), /api/v1/matches/[id]/status(경기 상태 전환), /api/v1/matches/[id]/live-token(실시간 채널), /api/v1/recorder/matches(기록원 경기 목록), /api/v1/duo/pair+join(2인 모드), /api/v1/tournaments/[id]/matches/sync(경기 데이터 동기화). (3) 인증: requireRecorder 미들웨어 — JWT 우선 + 대회 apiToken 폴백. super_admin/주최자/tournament_recorders 등록자만 접근 가능. (4) 실시간: Supabase Realtime Broadcast — Flutter가 채널(duo_{pin}_{matchId})에 score_update/timer_tick/quarter_change/pbp_event/team_foul/score_snapshot 6종 이벤트 broadcast, 웹 scoreboard 페이지가 구독하여 표시. (5) 점수 갱신: score-updater.ts가 득점 이벤트(2pt/3pt/1pt/score) 시 atomic increment로 homeScore/awayScore 갱신. (6) 상태 전환: scheduled→in_progress→completed/cancelled. 기록원은 scheduled→in_progress, in_progress→completed/cancelled만 가능. (7) 기존 웹 페이지: /scoreboard/[matchId](Supabase Realtime 구독, 실시간 스코어보드), /live(폴링 기반 라이브 경기 목록), /live/[id](폴링 기반 박스스코어+PBP 로그), /tournament-admin/.../recorders(기록원 관리).
- **참조횟수**: 0

### [2026-04-13] 심판 알림 시스템 + 공고 마감 자동화 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 신규 모델 0개, 기존 인프라 전면 재활용. (1) **기존 `notifications` 모델(prisma/schema.prisma L1344, Rails 호환)** 그대로 사용 — user_id/notification_type/title/content/action_url/status(unread/read)/read_at. Referee.user_id로 심판에게 배달. (2) **기존 `src/lib/notifications/create.ts` + `NOTIFICATION_TYPES` 헬퍼**에 referee.* 5종(pool.selected/pool.chief_assigned/assignment.created/settlement.paid/announcement.new) 추가만. (3) **공고 마감 2중 방어**: lazy close(GET /announcements 진입 시 `updateMany({status:open, deadline:lt(now)} → closed)`) + 향후 Vercel Cron 매시간(/api/cron/referee-announcement-close). (4) **알림 생성 포인트 4곳**: pools POST(선정) / pools/[id]/chief PATCH / assignments POST / settlements/[id]/status PATCH. 각 API에 try/catch로 감싼 notify* 헬퍼 호출 — 알림 실패 시 메인 트랜잭션 유지. (5) **API 3개 신규**: GET /api/web/notifications(페이지네이션+unread_count) + PATCH /[id]/read + POST /read-all. (6) **UI**: referee-shell 헤더에 Material Symbols "notifications" 벨 + 우상단 빨간 뱃지(9+) + 드롭다운 최근 10개 + 전체 목록 /referee/notifications 페이지. (7) **구현 3차 분류**: 1차=types+헬퍼+lazy close+4 hook / 2차=API 3개+UI / 3차=Cron+이메일(선택). (8) **Vercel Cron 인프라 기존**: vercel.json에 3건 이미 등록(tournament-reminders/youtube/weekly-report), CRON_SECRET 검증 패턴 `src/app/api/cron/tournament-reminders/route.ts` L10-13 참고.
- **참조횟수**: 0

### [2026-04-13] 심판 경기 배정 워크플로우 v3: 공고→신청→선정→책임자→현장배정 6단계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 기존 원스텝 배정 CRUD(RefereeAssignment 1모델)를 **다단계 워크플로우**로 확장. (1) 신규 Prisma 4모델 + 기존 1모델 수정: AssignmentAnnouncement(공고, dates DateTime[] 배열 + required_count JSON), AssignmentApplication(공고별 신청, unique(announcement_id, referee_id)), AssignmentApplicationDate(신청 일자 N:M 분리), DailyAssignmentPool(일자별 선정 풀 + is_chief 플래그로 책임자 포함, unique(tournament_id, date, referee_id, role_type)), 기존 RefereeAssignment에 pool_id nullable FK 1개만 추가(기존 데이터 0변경). (2) 신규 API 10개: 관리자 3(announcements CRUD) + 본인 2(공고 열람/신청) + 관리자 선정 5(applications 조회/선정/선정취소/책임자 토글/풀 조회), 기존 assignments API는 pool_id 검증 추가만. (3) 신규 페이지 3개: `/referee/admin/announcements`(+상세, 공고 관리 + 신청자 선정 + 책임자 지정), `/referee/applications`(본인 신청), `/referee/admin/pools`(일자별 풀 대시보드), 기존 `/referee/admin/assignments`는 3차에서 풀 기반으로 리팩토링(검색창 기반 referee-picker 컴포넌트). (4) 권한: 기존 `assignment_manage`(sga/referee_chief/game_chief) 그대로 재사용, admin-guard.ts 무수정. (5) 구현 3차 분류: 1차=공고+신청(뼈대), 2차=선정+책임자, 3차=현장배정 리팩토링. (6) 마이그레이션: pool_id nullable 유지 → 기존 배정 호환, 과도기 운영 가능.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 재설계 v2: Association 계층 + 배정/정산 조회 포함
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: MVP 1차 범위 확장. (1) Prisma 신규 모델 6개: Association(계층형 self-relation, 20개 시드=KBA 1 + 시도 17 + KBL/WKBL 2), AssociationAdmin(매핑 테이블, user_id unique), Referee, RefereeCertificate(file_url 제거 + cert_number 추가 + verified_by_admin_id), RefereeAssignment(tournament_match_id/game_id FK 2개, 관계 선언 없이 컬럼만 → 기존 games/TournamentMatch 0수정), RefereeSettlement(assignment_id unique). (2) ALTER TABLE 0건 — users 0수정(옵션 B: AssociationAdmin 매핑 테이블 채택), CREATE TABLE 6건만. (3) 라우트: (referee)/referee/{layout, page, profile, certificates, assignments, settlements, admin/{layout, page, members, bulk-verify}}. 심판 공개 목록 제거(registry 삭제). admin layout에서 admin_role=association_admin + AssociationAdmin 행 존재 이중 가드. (4) API 17개: 본인 Referee CRUD 4 + 본인 Certificate CRUD 4 + Association 공개 목록 1 + 본인 배정/정산 조회 2 + Admin 6(소속 심판 목록/상세/개별검증토글/Excel preview/Excel confirm/대시보드). (5) Excel 업로드 2단계 UX: preview(파싱+매칭, DB미변경) → confirm(트랜잭션 일괄 verified=true). 컬럼 표준 9열(협회코드/실명/생년월일/전화/종류/등급/번호/발급일/갱신일). xlsx 패키지 기존 존재. (6) 경기 엔티티는 3종(games 소문자 BigInt, TournamentMatch BigInt, pickup_games) — 배정 대상은 tournament_match_id/game_id 2개 FK로 분리. (7) Association 시드는 prisma/seed.ts + package.json prisma.seed 스크립트, REGIONS(src/lib/constants/regions.ts) 키 17개 재사용. (8) 이전 v1(단일 Referee+Certificate 2모델, 공개 목록, 파일업로드)에서 6모델/조회전용배정정산/Excel검증/공개제거로 확장.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 라우트 그룹 (referee) 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 심판/경기원 플랫폼 MVP 1차를 `src/app/(referee)/` 신규 라우트 그룹으로 분리. (1) 라우트 트리: `(referee)/referee/layout.tsx`(독자 셸: 상단 BDR 로고+"심판 플랫폼" 타이틀+테마토글, 좌측 사이드네비[대시보드/목록/자격증], 모바일 하단탭) + `page.tsx`(대시보드, 서버, getWebSession) + `registry/[page|new|[id]/[page|edit]]` + `certificates/[page|[id]]`. (2) 각 페이지 유형: 목록=Client(SWR fetch), 상세=Server(prisma 직접), 폼=Client. (3) (web) layout.tsx는 거대한 "use client" 파일이라 재사용 불가 — referee는 globals.css/CSS 변수/테마토글/Material Symbols만 공유하고 셸은 자체 구현. (4) 신규 컴포넌트 6종(referee-shell/referee-card/referee-form/certificate-card/certificate-form/empty-state)은 (referee)/referee/_components/ 하위에 격리. (5) API: `src/app/api/web/referees/*`(GET/POST + [id] GET/PUT/DELETE) + `src/app/api/web/referee-certificates/*`(동일). 모두 withWebAuth + zod + prisma 직접 패턴. (6) 기존 (web)/(admin)/(site) 코드는 건드리지 않음 (읽기만).
- **참조횟수**: 0

### [2026-04-05] 홈 페이지 NBA 2K 스타일 적용 현황 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 홈 페이지 19개 컴포넌트 전수 분석. (1) 활성 사용 중: page.tsx + home-hero/profile-widget/quick-actions/news-feed/recommended-games/recommended-tournaments/notable-teams/recent-activity/recommended-videos/home-community 10개 + right-sidebar.tsx(PC 사이드바). (2) 레거시(미사용): home-sidebar/hero-section/quick-menu/hero-bento/home-greeting/my-summary-hero/personal-hero/right-sidebar-guest/right-sidebar-logged-in 9개. (3) 2K 스타일 적용 완료: home-hero/profile-widget/quick-actions/news-feed/recommended-games/recommended-tournaments/notable-teams + toss-section-header/toss-list-item/right-sidebar. (4) 2K 미적용: recommended-videos(토스 스타일 카드), home-community/recent-activity(한글 헤더만 2K 미통일). (5) 2K CSS 유틸리티: globals.css에 shadow-glow-primary/accent, clip-slant/reverse/sm, watermark-text 정의됨. 폰트: SUIT(본문)+GmarketSans(제목).
- **참조횟수**: 0

### [2026-04-02] 맞춤 설정(Preferences) 시스템 구조 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 맞춤 설정 시스템 전체 구조 파악. (1) 데이터 흐름: preference-form.tsx(클라이언트) → /api/web/preferences(GET/PATCH) → User 모델 preferred_* 7필드 + prefer_filter_enabled. (2) 필터 적용: prefer-filter-context.tsx가 전역 상태 관리, header.tsx와 layout.tsx에 토글 버튼, game.ts/tournament.ts/community-content.tsx에서 필터 적용. (3) 온보딩 연결: /profile/complete/preferences에서 onboarding 모드로 PreferenceForm 사용, 온보딩 step 2로 진행. (4) 실력 관련: SKILL_BADGE(game-status.ts)가 공통 상수이나, SKILL_LABEL이 pickup-game-card/guest-game-card/pickup-detail/guest-detail 4파일에 인라인 중복 정의. (5) 메뉴 구조: profile-dropdown.tsx(헤더 드롭다운 4카테고리), profile-accordion.tsx(모바일 슬라이드 메뉴 4카테고리). 맞춤 설정은 "내 정보" 카테고리 하위에 위치.
- **참조횟수**: 0

### [2026-03-28] 프론트-백엔드 연결 전수 조사 + admin 관리 갭 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: (web) 59개 페이지 + 89개 API route + 9개 Server Action 전수 조사. 프론트 60개 기능 중 59개 완전 연결(OK), 1개 부분 연결(tournament-admin/templates). 데이터 패칭 패턴: (1) 목록 페이지는 클라이언트 컴포넌트에서 /api/web/* fetch 또는 useSWR, (2) 상세 페이지는 서버 컴포넌트에서 prisma 직접 쿼리, (3) 생성/수정/삭제는 Server Action 또는 fetch POST/PATCH/DELETE. admin 관리 갭 4영역: 경기(games) 관리 없음, 커뮤니티(community_posts+comments) 관리 없음, 팀(teams) 관리 없음, 코트(court_infos) 관리 없음. admin이 완전 관리하는 것: users(CRUD), tournaments(상태변경), plans(CRUD), payments(읽기), suggestions(상태변경), settings(점검/캐시), logs/analytics(읽기). 가장 시급한 누락: 경기+커뮤니티 관리 (부적절 콘텐츠 모더레이션 대응 불가).
- **참조횟수**: 0

### [2026-03-26] 외부 BDR 랭킹 연동 구조 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 외부 BDR 랭킹 사이트(bdrranking-d.netlify.app) 분석 후 연동 설계. 외부 데이터 소스는 GitHub 저장소(cobby8/BDR-ranking-d, cobby8/BDR-ranking-u)의 xlsx 파일. 일반부(division_rank.xlsx, 29KB)와 대학부(divisionU_rank.xlsx, 14KB). 필드: rank/team/city/score/move/scoreChange. 연동 방식: 서버사이드 API proxy -- /api/web/rankings/bdr/route.ts에서 GitHub raw URL fetch + xlsx 라이브러리로 파싱 + 인메모리 캐시(10분). 기존 /api/web/rankings API는 수정 없음(독립 경로). UI: rankings-content.tsx의 탭을 2개에서 3개로 확장(BDR 랭킹/플랫폼 팀/플랫폼 개인). BDR 랭킹 탭에 일반부/대학부 서브탭 + 지역 필터 + 검색. 신규 파일: API route.ts 1개 + bdr-ranking-table.tsx 1개. 수정 파일: rankings-content.tsx 1개 + package.json 1개.
- **참조횟수**: 0

### [2026-03-25] 랭킹 페이지 구조 설계 (신규 페이지 + API)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: /rankings 신규 페이지 설계. (1) 팀 랭킹: Team 모델의 wins/losses/draws 필드를 직접 정렬(DB 스키마 변경 없음). (2) 개인 랭킹: TournamentTeamPlayer의 total_points/total_rebounds/total_assists/games_played를 userId 기준 groupBy 합산 후 정렬. 같은 유저가 여러 대회에 참가하면 여러 TournamentTeamPlayer 레코드가 존재하므로 합산 필수. (3) API: /api/web/rankings?type=team|player, 공개 API, 50건 고정. (4) 페이지: Suspense 래퍼 + 클라이언트 컴포넌트(탭 전환+테이블+클라이언트 페이지네이션) - teams 패턴 동일. (5) slide-menu.tsx href="#" -> "/rankings" 연결. 파일 5개: API route.ts, page.tsx, loading.tsx, rankings-content.tsx, slide-menu.tsx(수정).
- **참조횟수**: 0

### [2026-03-25] 하드코딩/미연동 심층 재분석 (03-23 완료분 제외)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 03-23 완료 5건 제외 후 재분석. 하드코딩 8건(H1~H8), 미연동 UI 8건(U1~U8), 미구현 API 4건(A1~A4), DB 스키마 변경 7건(D1~D7) 발견. 핵심 발견: (1) 플랫폼 통계 API(/api/web/stats)가 여전히 미구현 - guest 사이드바에 "4,200개 팀" 등 하드코딩. (2) 팔로우/좋아요 시스템은 DB 테이블(follows, likes)부터 필요. (3) 슬라이드 메뉴 "랭킹" 항목이 href="#"으로 랭킹 페이지 미구현. (4) 타인 프로필 승률은 matchPlayerStat에서 계산 가능하나 미구현. (5) 커뮤니티 이벤트 배너 2곳은 하드코딩 텍스트. (6) fallback 데이터(API 실패 시 더미)는 graceful degradation으로 허용 가능. 정상 연동 확인: 홈 6개 섹션 전부, 경기/팀/대회/커뮤니티/프로필/코트/알림/요금제 전부 DB 연동 완료. 우선 추천: 통계 API(15분) -> 랭킹 페이지(40분) -> 타인 승률(15분) -> 좋아요(1시간) -> 팔로우(1시간).
- **참조횟수**: 0

### [2026-03-23] 하드코딩 데이터 vs DB/API 연결 전체 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 리디자인 완료된 7개 영역(30+ 파일) 분석. (1) 높음 우선순위 5건: recommended-games.tsx가 가장 큰 문제 - API(/api/web/recommended-games) fetch는 하지만 응답 데이터를 카드에 미사용, 4개 하드코딩 카드만 표시. notable-teams.tsx는 TEAMS 상수 배열 4개(더미). right-sidebar 양쪽에 랭킹/통계 하드코딩. (2) 중간 우선순위 5건: 커뮤니티 사이드바 API 연결, 플랫폼 통계 신규 API, 프로필 Win Rate/createdAt 확장. (3) 낮음 5건: DB 스키마 변경 필요(레벨/랭크 시스템, 이미지 필드, 관중 수 등). (4) 완벽 연결됨: 경기 목록/상세, 팀 목록/상세, 프로필 스탯, 대회 전체, 커뮤니티 전체. 실행 계획: 6단계(recommended-games -> notable-teams -> sidebar 연결 -> profile 확장 -> 통계 API -> tester 검증).
- **참조횟수**: 0

### [2026-03-23] 커뮤니티 페이지 구조 분석 (목록/상세 2종, 6파일)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 커뮤니티 관련 파일 6개 분석. (1) 목록: community/page.tsx(래퍼, Suspense) + _components/community-content.tsx(클라이언트, /api/web/community fetch, categoryMap 인라인 정의) + loading.tsx. (2) 상세: [id]/page.tsx(서버 컴포넌트, prisma 직접 쿼리 community_posts+comments, revalidate:30) + comment-form.tsx(클라이언트, createCommentAction Server Action). (3) 글쓰기: new/page.tsx(클라이언트, createPostAction Server Action). API: /api/web/community(GET 목록, take:30, category/q/prefer 필터). Server Actions: src/app/actions/community.ts(createPostAction, createCommentAction). DB: community_posts(id/user_id/title/content/category/view_count/comments_count/public_id/team_id/location/price 등) + comments(polymorphic: commentable_type="CommunityPost"). 목록은 클라이언트 컴포넌트(fetch), 상세는 서버 컴포넌트(prisma). 좋아요 기능 미구현(community_posts에 likes_count 필드 없음, comments에는 있음).
- **참조횟수**: 0

### [2026-03-23] 대회 페이지 구조 분석 (목록/상세/대진표 3종, 17파일)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 대회 관련 파일 17개 분석. (1) 목록: tournaments/page.tsx(래퍼, Suspense) + _components/tournaments-content.tsx(클라이언트, /api/web/tournaments fetch, TournamentCard 인라인) + tournaments-filter.tsx(상태 탭 4개) + loading.tsx. (2) 상세: [id]/page.tsx(서버 컴포넌트, prisma 직접 쿼리, parseDescription 파서 내장, MatchesAndStandings Suspense 분리) + loading.tsx. 서브탭 4개: schedule/standings/bracket/teams (각각 독립 page.tsx). (3) 대진표: bracket/page.tsx(서버, prisma + buildRoundGroups) + _components/bracket-view.tsx(클라이언트, 데스크톱 절대위치+모바일 탭) + match-card.tsx(MatchCard+MobileMatchCard) + bracket-empty.tsx + bracket-connector.tsx(미사용) + round-column.tsx(미사용). (4) 참가신청: join/page.tsx(클라이언트, 4스텝 위자드). API: /api/web/tournaments(GET 목록, POST 생성) + /api/web/tournaments/[id](GET/PUT/DELETE) + bracket/join/teams/matches 등 하위 API. 유틸: src/lib/tournaments/bracket-builder.ts(buildRoundGroups, computeMatchPositions, computeConnectorPaths). 목록은 클라이언트 컴포넌트(fetch), 상세는 서버 컴포넌트(prisma), 대진표는 서버(데이터)+클라이언트(뷰) 혼합.
- **참조횟수**: 0

### [2026-03-23] 프로필 페이지 구조 분석 (내 프로필 + 타인 프로필, 9+1파일)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 프로필 관련 파일 분석. (1) 내 프로필: profile/page.tsx(클라이언트, useSWR /api/web/profile + /api/web/profile/stats) + _components 7개(profile-header/activity-ring/stat-bars/recent-games-section/teams-section/tournaments-section/player-info-section/section-wrapper). (2) 타인 프로필: users/[id]/page.tsx(서버 컴포넌트, prisma 직접 쿼리). (3) 프로필 수정: profile/edit/page.tsx. API: /api/web/profile(GET/PATCH) + /api/web/profile/stats(GET) + /api/web/profile/generate-bio(POST). 서비스: src/lib/services/user.ts(getProfile/getPlayerStats/getMonthlyGames). 내 프로필은 클라이언트 컴포넌트(useSWR), 타인 프로필은 서버 컴포넌트(prisma). 스탯 데이터는 matchPlayerStat 테이블에서 aggregate로 집계.
- **참조횟수**: 0

### [2026-03-22] CSS 하드코딩 색상 전환 대상 분류
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: src/ 전체에서 하드코딩 색상 ~929건/107파일 확인. 전환 제외 대상은 (1) 데이터 기본값(teams.ts, games.ts 등의 fallback), (2) 유니폼/팀 동적 색상, (3) 브랜드 고정색(카카오/네이버/구글/YouTube), (4) manifest.ts PWA 색상, (5) 사이트 템플릿 커스텀 테마, (6) activity-ring 티어 고유색. admin 페이지는 라이트 테마 전용으로 #F5F7FA, #EEF2FF 등 밝은 색 위주.
- **참조횟수**: 0

### [2026-03-23] admin 라우트 그룹 분리 ((web) -> (admin))
- **분류**: architecture
- **발견자**: developer
- **내용**: admin 폴더를 src/app/(web)/admin/ -> src/app/(admin)/admin/으로 이동. 이유: (web)/layout.tsx의 사이드바/헤더/하단네비가 admin에도 적용되어 이중 레이아웃 문제 발생. (admin) 라우트 그룹으로 분리하면 (web)/layout.tsx가 적용되지 않고, admin/layout.tsx의 AdminSidebar만 적용됨. URL은 /admin/... 그대로 유지. (admin)/layout.tsx는 불필요 - 루트 layout.tsx가 HTML/폰트를 처리하고 admin/layout.tsx가 AdminSidebar+권한체크를 처리.
- **참조횟수**: 0

### [2026-03-22] 전체 페이지 구조 분석
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: src/app/ 전체 90개 페이지 분석. (web) 64개 + _site 6개 + live 2개 + layout 5개 + loading 13개. 라우트 그룹: (web)=일반 웹(NextAuth), _site=서브도메인 토너먼트 사이트, live=독립 다크테마 라이브. 레이아웃 계층: root > (web)(사이드바+미니헤더+모바일네비) > (admin)/admin(AdminSidebar+super_admin전용) / tournament-admin(상단 탭 네비). _site는 독립 레이아웃(서브도메인 검증+발행 게이트). 공통 UI: card/button/badge/skeleton. 홈은 4섹션 구성(히어로/퀵메뉴/추천경기/추천영상).
- **참조횟수**: 0

### [2026-03-22] 홈페이지 리디자인 구조 설계
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 홈페이지를 1열 세로 스택에서 3열 그리드(메인 lg:col-span-2 + 우측 사이드바 lg:col-span-1)로 전환. 기존 4개 컴포넌트(hero-section, quick-menu, recommended-games, recommended-videos)를 6개로 재구성(hero-bento, recommended-games, notable-teams, recommended-videos, right-sidebar-logged-in, right-sidebar-guest). quick-menu와 personal-hero는 기능이 다른 컴포넌트로 분산되어 사용 중지. 디자인 시안은 Dev/design/1. 홈/에 라이트/다크 4개 버전 존재. 반응형 패턴: 모바일 가로 스크롤 -> 데스크탑 N열 그리드. 섹션 헤더에 색상 막대(w-1.5 h-6) 사용.
- **참조횟수**: 0

### [2026-03-23] 팀 페이지 구조 분석 (목록/상세 2종, 14파일)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 팀 관련 파일 14개 분석. (1) 목록: teams/page.tsx(래퍼, Suspense) + teams-content.tsx(클라이언트, /api/web/teams fetch, TeamCardFromApi 인라인 정의) + team-card.tsx(미사용 레거시 카드) + teams-filter.tsx(검색+도시 select) + loading.tsx. (2) 상세: [id]/page.tsx(서버 컴포넌트, prisma 직접 쿼리) + join-button.tsx(POST /api/web/teams/[id]/join) + _tabs 4개(overview/roster/games/tournaments). (3) 관리: [id]/manage/page.tsx(가입신청 처리). (4) 생성: new/page.tsx(권한체크) + new-team-form.tsx(createTeamAction). API: /api/web/teams(GET 목록) + /api/web/teams/[id]/join(POST) + /api/web/teams/[id]/members(GET/PATCH). 디자인 시안 Dev/design/3. 팀/ 4개: bdr_1(상세-다크), bdr_2(상세-라이트), bdr_3(목록-다크), bdr_4(목록-라이트). teams-content.tsx에 TeamCardFromApi가 인라인으로 정의되어 있어 team-card.tsx와 중복 존재함.
- **참조횟수**: 0

### [2026-03-22] 경기 페이지 구조 분석 (목록/상세/생성 3종)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 경기 관련 파일 29개 분석. (1) 목록: games/page.tsx(래퍼) + games-content.tsx(클라이언트, /api/web/games fetch) + games-filter.tsx(플로팅 드롭다운). (2) 상세: [id]/page.tsx(서버 컴포넌트, getGame+listGameApplications+getUserGameProfile 병렬). _sections/pickup-detail+guest-detail+team-match-detail(테이블 형식). apply-button/cancel-apply-button. (3) 생성: game-wizard.tsx(3스텝 fixed 오버레이). step-type -> step-when-where(통합폼) -> step-confirm. Kakao Postcode 주소검색, createGameAction Server Action. 디자인 시안 Dev/design/2. 경기/ 6개(라이트3+다크3): bdr_1(목록-라이트), bdr_2(상세-라이트), bdr_3(생성-라이트), bdr_4(생성-다크), bdr_5(목록-다크), bdr_6(상세-다크).
- **참조횟수**: 0
