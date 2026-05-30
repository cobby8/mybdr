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
| 5C-4 | RU1 Rankings → /rankings | ⏳ |
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

## 진행 현황 (Phase 1C — 완료)
- ✅ Phase 1C 15/16 박제+머지 (PR #650~#653) / PA3 SKIP 보류 (decisions.md) / subin=dev=main 정합

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-30 | Phase 1~4 종료 마킹 + git 동기화 + Phase 5 대기 모드 진입 | ✅ dev→subin 동기화(`0c61175` push) / phase-ledger Phase 2/3/4 ⑬⑭ ✅ 종료 / Phase 5 zip(BDR v2 (8)) 도착 대기 |
| 2026-05-29 | **Auto Chain 25 PR 운영 반영** (subin→dev #654 → dev→main #655) | ✅ 머지 완료 / main=`6f22c02` / Vercel 운영 배포 / dev=main 정합 |
| 2026-05-29 | **Phase 4C 완료 8/8** (4C-1~8) | ✅ `8ec6a54`·`8527d2a`·`f26614b`·`1280425`·`7dab1ad`·`5addf34`·`d169e0a`·`fa7b63b` push / 단체 영역 / OrgHierarchyCrumbs 공용 / Q2·Q3·Q4 lock / 각 tsc0 회귀0 mock0 |
| 2026-05-29 | **Phase 3C 완료 6/6** (3C-1~6) | ✅ `50ee237`~`0b61922` push / 팀 영역 / status·권한 BT1~6 일치 / docs `b50b88e` |
| 2026-05-29 | **Phase 2C 완료 10/10** (2C-1~10) | ✅ `13feb36`~`9292fe6` push / 경기 영역 / game_applications.status Int0/1/2 / docs `283bcd3` |
| 2026-05-29 | Auto Chain 1단계 v2.22 sync (`dee2445`) | ✅ Phase 3 팀 + 4 단체 동시 / screens 33→46 / 회귀16 통과 |
| 2026-05-29 | Auto Chain Master 사전 점검 | ✅ git/env/zip/v2.20 6/6 / 데이터 정책=통합 허용 |
