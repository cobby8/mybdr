# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 5 Auto Chain — v2.23 sync + Phase 5C 박제 6 PR (랭킹·커뮤니티)
- **상태**: 🔵 진행 중 — 1단계 v2.23 sync ✅ `7e2d0f1` / 2단계 5C 6 PR 박제 진행
- **현재 담당**: pm → developer (5C-1)
- **의뢰서**: `Dev/design/prompts/phase-5-auto-chain-cli-prompt-2026-05-30.md`

### Phase 5C 진행 현황 (6 PR)
| PR | 시안 → 운영 | 상태 |
|----|------|------|
| 5C-1 | CU4 CommunityEdit → /community/[id]/edit (+공용 wizard 생성) | 🔵 박제 중 |
| 5C-2 | CU1 CommunityList → /community | ⏳ |
| 5C-3 | CU2 CommunityDetail → /community/[id] | ⏳ |
| 5C-4 | RU1 Rankings → /rankings | ✅ 박제 완료 (미커밋) |
| 5C-5 | CA1 AdminCommunity → /admin/community | ⏳ |
| 5C-6 | CU3 CommunityNew → /community/new (공용 wizard 재사용) | ⏳ |

### Phase 5 lock (자동 결재 default)
- A1 댓글=운영 comments 모델 실사용 / A2 신고=hide / A3 카테고리 8종(news/notice 추가, 작성 7종 notice제외) / A4 cross-domain mock 0
- 데이터 통합=server 조회 + `/api/web/*` 허용 / stop=`/api/v1`·DB schema·LOC>+2000·tsc실패·회귀6·13룰

## 🔑 Auto Chain 정책 (사용자 결재 2026-05-29)
- **데이터 통합 허용**: server 조회 + 새 web API route(`/api/web/*`) ✅. **금지(stop)**: `/api/v1`·DB schema·LOC>+2000·tsc실패·회귀6위반·디자인13룰위반. mock 금지(hide)
- **결재 default 자동**: sync A / 2C 결제 B(disabled) / 3C 모달 A / 4C Q1~Q4 lock
- **공유 컴포넌트**: `live-chip-row.tsx`(LiveChipRow) / `live-chips.ts`(getLiveChips) / `org-hierarchy-crumbs.tsx`(4C-2 신규)

## Chain 진행 현황 (25 PR — 전체 완료)
| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | v2.22 sync | ✅ `dee2445` |
| 2 | Phase 2C 경기 (10 PR) | ✅ **10/10** |
| 3 | Phase 3C 팀 (6 PR) | ✅ **6/6** |
| 4 | Phase 4C 단체 (8 PR) | ✅ **8/8** |

## 🔜 chain 끝 후 다음 액션 (의뢰서 §5)
- ✅ **25 PR subin → dev → main 머지 완료** (#654 / #655 / 운영 배포 `6f22c02`)
- ✅ **git 동기화 완료** (dev → subin merge `0c61175` push)
- ✅ **Phase 1~4 종료 마킹** (phase-ledger 2/3/4 ⑬⑭ ✅)
- ⏸ **Phase 5 (랭킹·커뮤니티) Claude.ai 박제 zip 도착 대기** (`BDR v2 (8).zip` 또는 차상 신규 / 의뢰서 묶음 7건 Cowork 자동 생성됨)
- ☐ Phase 5 zip 도착 시 → Cowork가 sync 의뢰서 자동 작성 → CLI sync 1단계 (Phase 4 답습)
- ☐ PR-1C-10 PA3 재설계 결정 (보류 중)

## 구현 기록 (developer) — chain 25 PR commit 맵
### Phase 2C 경기 (10/10): `13feb36`·`70118ea`·`b796834`·`f4d8a2f`·`d0385a2`·`cd7e9af`·`390c22b`·`4681e51`·`1985fde`·`9292fe6`
- 핵심: **game_applications.status=Int 0/1/2 단일진실** / MVP=games.final_mvp_user_id / 매너=평균+flag종류만 개별건수0 / 데이터없음→hide·disabled(mock금지) / docs `283bcd3`
### Phase 3C 팀 (6/6): `50ee237`·`2ab8a6e`·`4eeb260`·`42e2cc6`·`204f78e`·`0b61922`
- 핵심: **team_join_requests.status·team_member_requests.status=String / last_activity_at=DateTime?** / 권한=TeamOfficerPermissions 6키 / 전적=Team.wins/losses/draws 96팀0 hide / 운영 초과구현→비파괴 최소박제 / docs `b50b88e`
### Phase 4C 단체 (8/8): `8ec6a54`·`8527d2a`·`f26614b`·`1280425`·`7dab1ad`·`5addf34`·`d169e0a`·`fa7b63b`
- 핵심: **OrgHierarchyCrumbs 공용**(4C-2 신규→4C-4/8 재사용) / organizations.status 전부 approved / **BO1 컬럼**(name·description·region·contact_email·website_url·apply_note) OU3=OA1 일치 / **Q2 6탭·Q3 3-step·Q4 5-step lock 보존** / 운영 초과구현多→안내·위계칩·status통계 보강 위주 / 미지원 필드(founded_year·tournaments_count·color·정기성·officer toggle·ORG_ACTIVITY_LOG) hide
- **공통(25 PR 전부)**: 매 PR tsc0 / 디자인13룰 / 회귀6 PASS / 새 schema·`/api/v1` 0 / mock 0 / stop condition 발동 0

## 구현 기록 (developer) — Phase 5C

### 5C-1 — CU4 CommunityEdit + CU3 CommunityNew 공용 wizard 박제 (BC5)

📝 구현한 기능: 시안 CU3(5-step 마법사) + CU4(수정)를 **공용 컴포넌트 1개**로 박제. BC5 룰(별 컴포넌트 ❌) 준수 — new/edit가 `mode` prop만 달리하여 `CommunityWizard` 공유.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/community/_components/community-wizard.tsx` | 공용 5-step 마법사 (STEP1 카테고리/2 유형/3 본문+이미지/4 추가정보/5 미리보기). create/update 액션 mode 분기. hidden input으로 멀티스텝→단일 전송 | 신규 (+562) |
| `src/app/(web)/community/new/page.tsx` | wizard `mode="new"` 호출 래퍼로 교체 (400→26줄) | 수정 |
| `src/app/(web)/community/[id]/edit/page.tsx` | fetch prefill + isOwner 가드 보존 + 정상 시 wizard `mode="edit"` 호출 (698→184줄) | 수정 |

핵심 결정 (Auto Chain lock 반영):
- **STEP1 카테고리**: 운영 액션 처리 6종(general/recruit/review/qna/info/marketplace)만 노출. news=검수+대회연결 미지원 / notice=운영진 전용 → 작성 제외 (자동 결재)
- **STEP2 유형**: 서버 미처리 → 선택 UI는 두되 disabled 톤 + "준비 중" 안내 (서버 미전송)
- **STEP3 본문**: 실동작. 이미지 URL = new 실동작 / edit prefill 보존(updatePostAction 미처리이므로 안내 문구 추가)
- **STEP4 추가 정보**: A4 lock(cross-domain mock 0) → 대회/팀 입력 hide. **5-step 구조 보존 위해 "추가 정보(준비 중)" 안내 단계로 유지** (PM 지시 — 4-step처럼 안 보이게)
- **STEP5 미리보기+제출**: 실동작 (form submit → create/update 액션)

보존 (0 변경): createPostAction/updatePostAction 시그니처 / hidden public_id·images JSON / edit fetch prefill / isOwner 가드 lock view / CommunityAsideNav

💡 tester 참고:
- 테스트: `/community/new` 진입 → STEP1~5 진행 → 게시 → 상세 redirect / `/community/[id]/edit` 본인 글 진입 → prefill 확인 → 수정 완료
- 정상: new=글 작성+리다이렉트 / edit=본인 글 prefill+수정 반영 / 타인 글 edit=lock view
- 주의 입력: edit 진입 글의 category가 news/notice면 STEP1 카드엔 없으나 hidden으로 보존되어 데이터 손실 0 (submit 시 유지). STEP2 type/STEP4 메타는 서버 미전송 확인

⚠️ reviewer 참고:
- 멀티스텝 입력을 hidden input으로 단일 form 전송하는 패턴 (state→hidden 동기화) 정합성
- BC5 공용 컴포넌트 단일화 — new/edit 양쪽 동작 동일성

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

### 5C-2 — CU1 CommunityList → /community 박제 (BC2)

📝 구현한 기능: 시안 CU1(카테고리 chip + cu-post 카드 리스트 + 사이드바)를 운영 `/community`(CommunityContent)에 박제. **데이터 패칭 0 변경** — API fetch / SSR fallback / preferFilter / searchParams / 정렬 4종 / 더보기 전부 보존, UI 렌더링(board 테이블 → cu1 카드)만 교체.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/community/_components/community-content.tsx` | board 테이블 → `.cu1-chips`(8종 칩) + `.cu1-grid`(cu-post 카드 리스트 + 인기글 사이드바). PostRow→PostCard 교체. CHIP_CATEGORIES 상수 + hotPosts useMemo(실데이터 파생) 추가. 미사용 V2Pager import·totalPages 정리 | 수정 (+258/-102) |
| `src/app/globals.css` | CU1 전용 CSS 포팅(comm prefix: cat-badge/comm-author/cu1-chips/cu1-grid/cu-post/cu-side-card/cu-hot-row). 시안 토큰→운영 토큰 치환(--r-md→--radius-card / --accent-deep→--bdr-red-ink 등) | 수정 (+167) |

핵심 결정 (정합 lock 반영):
- **카테고리 taxonomy 유지(mock 아님)**: CHIP_CATEGORIES = 운영 8종(news/general/recruit/review/qna/info/marketplace/notice) + 전체글. 칩 클릭 = 기존 handleCategoryChange(URL ?category=) 재사용
- **미데이터 hide**: team.name / is_official(verified) / image_count(+N 썸네일) → 박제 안 함. tournament 알기자 band → hide(A4 cross-domain mock 0). thumbnail_url(news Hero)만 썸네일 노출
- **이 주 인기 글 = 실데이터 파생**: mock COMM_HOT 드롭. 로드된 posts를 view_count desc 정렬 slice 5 (별도 API 추가 0)
- **내 활동 카드(7/34/12/5) = mock 드롭** (mock 0 원칙)
- **시안 전용 토큰→운영 토큰 치환**: --r-md/--r-sm/--r-xs / --accent-deep / --accent-hair. review badge #8B5A0F 하드코딩 → --ink-soft/--bg-head 토큰 치환(13룰 하드코딩 금지)
- **community 전용 prefix 유지**: cu1-/cu-post/cat-badge/comm-author/cu-side-card/cu-hot-row — 타 페이지(경기/팀/단체) 클래스 충돌 0 (포팅 전 grep 검증)

보존(0 변경): `/api/web/community` fetch / prefetchCommunity SSR fallback / usePreferFilter / searchParams 동기화 / 정렬 4종 / LoadMoreButton 누적 페이지네이션 / 검색·정렬 토글 헤더 / CommunityAside(좌측 트리)

💡 tester 참고:
- 테스트: `/community` 진입 → 칩 8종 클릭(카테고리 필터 URL 동기화) → 카드 리스트 렌더 / 우측 "이 주 인기 글" 5건 / 더보기 누적 / 검색·정렬 토글
- 정상: 카드=제목·미리보기·작성자·시간·조회·좋아요·댓글 표시 / news 글=좌측 빨간 띠 / 공지=고정 칩+강조 / 인기글=조회순 상위 5
- 주의 입력: thumbnail_url 있는 news 글(우측 썸네일) / posts 0건(빈 상태 board + 첫 글쓰기 CTA) / view_count>1500(조회수 is-hot 강조)

⚠️ reviewer 참고:
- board 테이블→카드 전환 시 데이터 패칭/상태 로직 0 변경 동일성 (diff에 fetch/api/searchParams 라인 0 확인)
- CSS 신규 클래스 community prefix 충돌 0 / 시안→운영 토큰 치환 정합
- 모바일: 기존 CommunityMobileTabs 제거하고 cu1-chips로 통합 — 모바일 카테고리 전환 회귀 여부

### 5C-3 — CU2 CommunityDetail → /community/[id] 박제 (BC4 + BC2)

📝 구현한 기능: 시안 CU2(article + 좋아요·댓글 + 추천 사이드)를 운영 `/community/[id]`(CommunityPostPage)에 박제. **데이터/서버액션 0 변경** — getPost·세션·댓글·좋아요/팔로우 쿼리, 알기자 linkify/Hero/갤러리, draft 가드, 카페 댓글 디코드 전부 보존. 인라인 style JSX → 시안 cu2- 클래스 마크업으로 교체.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/community/[id]/page.tsx` | JSX 렌더만 교체: breadcrumb→cu2-crumbs / 본문 카드→cu2-article(헤더 cat-badge+comm-author / body cu2-article__p / react cu2-react) / 댓글→cu2-comments 래퍼 / 우측 추천=PostDetailSidebar를 cu2-side에 배치. **데이터 패칭 블록(1~225줄) 무변경** | 수정 (+217/-287) |
| `src/app/globals.css` | CU2 전용 CSS append(cu2-crumbs/cu2-grid/cu2-main/cu2-article*/cu2-react/cu2-share/cu2-comments*/cu2-side). 토큰 치환 5C-2 규칙 답습 | 수정 (+74) |

핵심 결정 (Auto Chain lock 반영):
- **CU2-G 알기자 hero band(대회 cross-domain) = hide**: 시안은 `post.tournament` 객체 사용. 운영엔 대회명 cross-domain 객체 출처 없음 → A4 lock·mock 0 → band 박제 안 함. 알기자 사진(NewsPhotoHero)은 본문 안에서 기존 그대로 노출되어 정보 손실 0
- **CU2-C 좋아요/공유 = 운영 컴포넌트 우선**: 시안 cu2-like는 mock onClick(useState). 운영 LikeButtonV2/ShareButtonV2(실동작 server action) 그대로 보존. 톤만 cu2-react 래퍼. 스크랩=DB미지원 disabled / 신고=A2 lock(hide) disabled "준비 중"
- **CU2-D 댓글 = 운영 실데이터**: 시안 mock COMM_COMMENTS·cu2-cform 드롭. 기존 CommentForm/CommentList(A1 comments 모델 + 카페 댓글 합산) 그대로. cu2-comments 헤더 톤만
- **CU2-E sidebar 추천 = hide**: 시안 "작성자 다른 글/카테고리 다른 글"은 mock 추가쿼리 필요 → A4·mock 0 → hide. 기존 PostDetailSidebar(실데이터: 작성자/실시간 인기글/이벤트)를 cu2-side 컬럼에 그대로 배치
- **레이아웃**: comm-page 신규 클래스 회피 — 운영 `.page > .with-aside > main`(5C-2/원본 답습) 유지, main 안에서 cu2-grid 2열
- **토큰 치환**: --r-md→--radius-card / --r-sm·--r-xs→--radius-chip / --accent-deep→--bdr-red-ink / --accent-hair→--accent-soft. 하드코딩 색상 0
- **prefix 충돌 0**: cu2-* = globals.css(정의) + page.tsx(사용) 2파일만. cu1-/comm-/타 페이지 충돌 grep 0 확인. cat-badge/comm-author/cu-side-card는 5C-2 추가분 재사용(재정의 안 함)

보존(0 변경): getPost cache·status=published 가드 / getWebSession / comments·likes·follows 병렬 쿼리 / isAlkijaPost linkify+news_photo fetch / decodeHtmlEntities / getCafeComments / categoryLabelMap / formatRelativeTime / generateMetadata / PostActions·LikeButtonV2·ShareButtonV2·CommentForm·CommentList·PostDetailSidebar·CommunityAsideNav

💡 tester 참고:
- 테스트: `/community/[id]` 진입 → 일반 글/알기자(news) 글/카페 크롤링 글/본인 글 각각 / 좋아요 토글 / 댓글 작성·삭제 / 공유
- 정상: cat-badge 카테고리 색상 / 작성자 아바타·이니셜 / 조회·좋아요·댓글 메타 / 좋아요 실반영 / 댓글 등록·삭제 / 본인 글=PostActions 노출 / 우측 PostDetailSidebar 정상
- 주의 입력: 알기자(news+tournament_match_id) 글=본문 자동링크+Hero/갤러리 사진 보존 / 카페 댓글 있는 글=댓글 합산 카운트 / 비로그인=좋아요/댓글 로그인 유도 / draft URL 직접 접근=notFound

⚠️ reviewer 참고:
- 데이터 패칭 블록(1~225줄) diff 0 — fetch/쿼리/server action 라인 변경 없음 확인
- cu2- prefix 충돌 0 / 시안→운영 토큰 치환 정합 / 하드코딩 색상 0
- 알기자 hero band·추천 사이드·mock 댓글 hide 처리(A4·mock 0)가 정보 손실 없이 기존 실데이터로 대체됐는지

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

### 5C-4 — RU1 Rankings → /rankings 박제 (BC1 + BC7)

📝 구현한 기능: 시안 RU1(cross-domain hero + 부문 chip + 출처 footer)를 운영 `/rankings`(RankingsContent)에 박제. **데이터 패칭 0 변경** — fetch(`/api/web/rankings?type=`)·mode 토글·podiumItems 가공·playerSort·외부BDR 부 전환 전부 보존. V2Podium·V2PlayerBoard·V2TeamBoard·BdrRankingTable 4컴포넌트 보존. 시안 신규 UI는 실데이터 가능分만 선별 추가, 나머지 hide.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/rankings/_components/rankings-content.tsx` | team 모드: `TeamLeaderHero`(ru1-leader, teamRankings[0] 실데이터) + `RankingSourceFooter`(ru1-source 경기·팀 2행) 추가. player 모드: footer 추가. 보조 컴포넌트 2개 신규. **fetch/state/podium 가공/onSortChange/PlayerSortKey 시그니처 무변경** | 수정 (+70/-0) |
| `src/app/globals.css` | RU1 CSS append — `ru1-leader*`(cafe-blue 그라디언트 hero) + `ru1-source*`(출처 footer). 토큰 치환(--r-md→--radius-card / --r-sm·--r-xs→--radius-chip). 아이콘 셀렉터 `.ico`→`.material-symbols-outlined` | 수정 (+48/-0) |

핵심 결정 (Auto Chain lock 반영):
- **RU1-B MVP Hero = hide**: rankings API에 `final_mvp` 쿼리 없음 + 추측 schema·새 쿼리 금지 → mock 0 (PM lock). 시안 hero 2열(MVP+리더) 중 MVP 열 미박제
- **RU1-C 팀 승수 리더 = team모드 1위 실데이터**: `teamRankings[0]`(team API wins DESC 1위) name/wins/losses/draws. **titles(우승)=DB 미지원 hide** → 전적 문구만. 로고=이니셜 대체, 배경=primary_color 가드(흰색 제외→secondary→accent, V2Podium 동일 가드)
- **RU1-D 코트 chip = hide**: cross-domain 코트 + 하드코딩 코트명 → mock 0
- **RU1-A 매너 chip = hide**: 매너 정렬 키 없음. 기존 V2PlayerBoard 정렬(rating/ppg/apg/rpg) 시그니처 보존
- **RU1-E / BC7 footer = 경기·팀 2행**: 코트 행은 코트 hide 연동 제거. 문구=실집계 기준(공식전 경기 기록 / 팀 전적 동기화·매주 월요일). team·player 모드 양쪽 노출
- **시안 ru1-podium/ru1-board 미포팅**: 운영 V2Podium/V2PlayerBoard/V2TeamBoard 보존(시안 board 마크업 박제 안 함)
- **토큰 치환**: --r-md→--radius-card / --r-sm·--r-xs→--radius-chip. 하드코딩 색상 0(hero 그라디언트 위 흰 텍스트 rgba white는 13룰 핑크/살몬/코랄 무관)
- **prefix 충돌 0**: ru1- = globals.css(정의)+rankings-content.tsx(사용) 2파일만. cu1-/cu2-/comm- grep 0 확인

보존(0 변경): fetch `/api/web/rankings?type=team|player` / BdrRankingTable bdr fetch / mode 3종 토글 / bdrDivision 부 전환 / podiumItems 가공 / playerSort·setPlayerSort / EmptyState·BoardSkeleton / V2Podium·V2PlayerBoard(onSortChange/PlayerSortKey)·V2TeamBoard·BdrRankingTable

💡 tester 참고:
- 테스트: `/rankings` 진입 → 팀/선수/외부BDR 토글 / 팀 모드=상단 승수 리더 hero(1위 실팀) + 포디움 + 보드 + footer / 선수 모드=포디움 + 정렬 pills + 보드 + footer / 외부BDR=일반·대학 부 전환(기존 그대로)
- 정상: 리더 hero=team 1위 팀명·전적(승패무)·이니셜 로고 / footer=경기·팀 2행 / 선수 정렬 pills 동작 / 외부BDR carry-over
- 주의 입력: teamRankings 0건(EmptyState, hero·footer 미노출) / 팀 primary_color=#FFFFFF(secondary/accent 폴백) / 팀명 1글자 이니셜

⚠️ reviewer 참고:
- 데이터 패칭(fetch/useEffect/state/podiumItems) diff 0 — UI 추가만 확인
- MVP hide(final_mvp 부재)·코트 hide(cross-domain)·titles hide(DB 부재)가 mock 0 원칙 부합하는지
- ru1- prefix 충돌 0 / 토큰 치환 정합 / onSortChange·PlayerSortKey 시그니처 보존

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

### 5C-5 — CA1 AdminCommunity → /admin/community 박제 (BC6 · OA1 답습)

📝 구현한 기능: 시안 CA1(Site Operator hub: Hero 4-stat + 상태 탭 + 카테고리 chip + 검수 모달)를 운영 `/admin/community`(AdminCommunityContent)에 박제. **page.tsx 서버쿼리·requireSuperAdmin·hide/unhide/delete 3 서버액션 0 변경**. client UI만 OA1(단체 관리) 패턴으로 재구성. **신규 CSS 0** — 기존 admin 공용 클래스(admin-table/admin-stat-pill/admin-status-tabs/btn) + Tailwind 유틸만 재사용 → ca1- prefix 불필요, 타 페이지 충돌 0.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/admin/community/admin-community-content.tsx` | Hero 4-stat grid(전체/핀/신고/삭제됨, posts 배열 실측 집계·추가쿼리0) + 상태 탭(활성/삭제됨 2탭) + 동적 카테고리 chip 필터 분리. 모달 액션: 삭제됨=복구 hide / 활성=기존 숨김·삭제 0변경. STATUS_LABEL/TONE에 deleted 추가. 행 [삭제됨] prefix+dim | 수정 (+142/-44) |

핵심 결정 (Auto Chain lock + PM 정합 반영):
- **page.tsx 0 변경**: 서버쿼리(take:100·status필터없음)·requireSuperAdmin·hidePostAction/unhidePostAction/deletePostAction 시그니처 전부 보존. Hero 집계는 client에서 전달받은 posts로 (새 쿼리/API 0)
- **Hero 4-stat 실측**: 전체=posts.length / 핀="—"(community_posts 핀 필드 부재 mock 0) / 신고="—"(신고 Report 모델 운영 부재 A2 lock) / 삭제됨=status "deleted" 집계(실측 1건). OA1 Hero 4분면 grid 톤 매핑 답습
- **상태 탭**: 시안 활성/핀/신고/삭제됨 4탭 → 핀·신고 hide(데이터/모델 부재) → **활성/삭제됨 2탭**. 활성=status!=deleted / 삭제됨=status=deleted. AdminStatusTabs 재사용
- **카테고리 chip**: 동적(운영 레거시 taxonomy — 현재 탭에 존재하는 category만). 탭 전환 시 catFilter 초기화. (web) .btn 패턴
- **deleted 탭=실데이터**: status="deleted" 1건 실존(deletePostAction은 DB delete지만 별경로 deleted status 데이터 존재). **복구 버튼 hide**(복구 서버 액션 부재 mock 0) → "삭제된 게시글입니다 (복구 미지원)" 안내
- **핀 버튼·알림 체크박스 hide**: 시안 모달 핀/핀해제 버튼·알림 발송 체크박스(Phase 2 UD1) → 핀 필드·알림 발송 로직 부재 → 미박제(mock 0)
- **hidden status 보존**: 활성 탭에 published+hidden 포함, hidden 글 [숨김] prefix + 모달 숨김/복원 토글 기존 그대로
- **OA1 답습·AdminDetailModal 재사용**: Hero grid·필터·모달 = organizations admin(OA1) 패턴 동일. AdminDetailModal/ModalInfoSection 0 변경 재사용. 시안 oa1-*/ca1-* CSS 클래스는 미사용(운영 admin 디자인 시스템 우선)

보존(0 변경): page.tsx 전체 / admin-community.ts 3 서버액션 / AdminPageHeader / AdminDetailModal·ModalInfoSection / 모달 게시글 정보·통계·일시 섹션 / CATEGORY_LABEL

💡 tester 참고:
- 테스트: `/admin/community` super-admin 진입 → Hero 4-stat(전체 N·핀 —·신고 —·삭제됨 N) / 활성·삭제됨 탭 전환 / 카테고리 chip 필터 / 행 클릭 모달 → 활성 글=숨김·삭제 / 삭제됨 글=안내(액션 없음)
- 정상: 활성 탭=published+hidden / 삭제됨 탭=deleted 글(현재 1건) [삭제됨] prefix / 숨김 글 [숨김]+dim / 숨김↔복원 토글 / 삭제 시 행 제거+revalidate / 카테고리 chip=현재 탭 존재 카테고리만
- 주의 입력: 비super-admin=서버액션 throw(권한) / deleted 글 모달=복구버튼 없음 / 카테고리 chip 탭 전환 시 all 리셋 / posts 0건=빈 상태

⚠️ reviewer 참고:
- page.tsx·admin-community.ts diff 0 — 서버쿼리/액션 라인 변경 없음 확인
- Hero 핀·신고 "—" hide + 복구 버튼 hide + 핀·알림 체크박스 hide가 mock 0 원칙 부합하는지
- 신규 CSS 0 (기존 admin 공용 클래스 재사용) → prefix 충돌 0 확인
- 상태 탭(active/deleted) + 카테고리 chip 2단 필터 정합 (탭 전환 시 catFilter 리셋)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

## 진행 현황 (Phase 1C — 완료)
- ✅ Phase 1C 15/16 박제+머지 (PR #650~#653) / PA3 SKIP 보류 (decisions.md) / subin=dev=main 정합

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-31 | 5C-5 CA1 AdminCommunity → /admin/community 박제 (BC6·OA1답습) | ✅ admin-community-content UI재구성(page.tsx·3서버액션 0변경)+신규CSS0(admin공용클래스재사용) / tsc0 / Hero4-stat실측·상태탭(활성/삭제됨)·카테고리chip / 핀·신고·복구·알림체크박스 hide·deleted실데이터 / +142/-44 LOC / stop 0 (미커밋) |
| 2026-05-31 | 5C-4 RU1 Rankings → /rankings 박제 (BC1+BC7) | ✅ rankings-content UI추가(데이터 0변경)+globals.css ru1- append / tsc0 / MVP·코트·매너 hide·팀리더 1위 실데이터·footer 2행 / V2 4컴포넌트 보존 / +118 LOC / stop 0 (미커밋) |
| 2026-05-31 | 5C-3 CU2 CommunityDetail → /community/[id] 박제 (BC4+BC2) | ✅ page.tsx UI만 교체(데이터 0변경)+globals.css cu2- append / tsc0 / 알기자hero·추천·mock댓글 hide / stop 0 (미커밋) |
| 2026-05-30 | Phase 1~4 종료 마킹 + git 동기화 + Phase 5 대기 모드 진입 | ✅ dev→subin 동기화(`0c61175` push) / phase-ledger Phase 2/3/4 ⑬⑭ ✅ 종료 / Phase 5 zip(BDR v2 (8)) 도착 대기 |
| 2026-05-29 | **Auto Chain 25 PR 운영 반영** (subin→dev #654 → dev→main #655) | ✅ 머지 완료 / main=`6f22c02` / Vercel 운영 배포 / dev=main 정합 |
| 2026-05-29 | **Phase 4C 완료 8/8** (4C-1~8) | ✅ `8ec6a54`·`8527d2a`·`f26614b`·`1280425`·`7dab1ad`·`5addf34`·`d169e0a`·`fa7b63b` push / 단체 영역 / OrgHierarchyCrumbs 공용 / Q2·Q3·Q4 lock / 각 tsc0 회귀0 mock0 |
| 2026-05-29 | **Phase 3C 완료 6/6** (3C-1~6) | ✅ `50ee237`~`0b61922` push / 팀 영역 / status·권한 BT1~6 일치 / docs `b50b88e` |
| 2026-05-29 | **Phase 2C 완료 10/10** (2C-1~10) | ✅ `13feb36`~`9292fe6` push / 경기 영역 / game_applications.status Int0/1/2 / docs `283bcd3` |
| 2026-05-29 | Auto Chain 1단계 v2.22 sync (`dee2445`) | ✅ Phase 3 팀 + 4 단체 동시 / screens 33→46 / 회귀16 통과 |
