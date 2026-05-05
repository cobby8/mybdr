# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/5 세션 마무리]** 인증 흐름 재설계 main 배포 완료 (`3f016c9`). 탈퇴 회원 쿠키 자동 cleanup 본질 해결 = 사용자 검증 통과. 빈 화면 회귀 = 배포 직후 chunk 캐시 mismatch (강력 새로고침 안내). 다음 세션 진입 = onboarding PR1~5 또는 박성후/이도균 등록 (내일).

---

## 🎯 다음 세션 진입점

### 🚀 0순위 — 박성후 등록 (이도균 ✅ 완료 5/5)
- ~~**이도균** (user_id=3352) — 5/5 완료: ttpId=2830 #70 / team_members.jersey=70 동시 갱신 (옵션 2 트랜잭션).~~
- **박성후** (펜타곤 #21) — users 0건 완전 미가입. 사용자가 본인 가입 유도 후 처리.

### 🛠️ 잠재 fix — jersey 도메인 단방향 sync (errors.md 5/5 + 5/2 통합)
- **함정**: `user.default_jersey_number` ↔ `team_members.jersey_number` ↔ `tournament_team_players.jerseyNumber` 자동 sync 0건. 사용자가 마이페이지 등번호 입력 = 메모만 (이도균 사례).
- **단기 fix (UX, ~0.5d)**: 마이페이지 등번호 입력 라벨/안내 = "본인 선호. 대회 출전 시 별도 등록" 명확화
- **중기 fix (~1d)**: `default_jersey_number` 변경 시 `team_members.jersey_number=NULL` row 자동 채우기 hook
- **장기 fix (~2d)**: TournamentTeam 등록 시 team_members → ttp 자동 복사 hook (errors.md 5/2 항목 통합)
- 우선순위 = onboarding PR1~5 보다 낮음. 운영자 수동 fix 가능 + 신고 빈도 1/주 미만 가정.

### 🚀 1순위 — onboarding 10단계 시스템 PR1~5 (옵션 B 합의됨)

**PR 분해** (~5.5d):
- PR1 (1d): 1단계 본인인증 통합 + `/onboarding` 라우트 — IdentityVerifyButton 재사용
- PR2 (1.5d): 2~4단계 (필수 분기 룰 — 길농만 선택 시 3,4 스킵 가능)
- PR3 (0.5d): 미들웨어 가드 — 분기 룰 반영
- PR4 (2d): 5~10단계 (자율) + 9단계 settings/feed PreferenceForm 흡수 + 점수/뱃지
- PR5 (0.5d): 기존 `/profile/edit` 정리 (활동지역 제거 + 도움말 제거 + readonly)

**즉시 진행 추천**: PR5 먼저 (가시 효과 빠름) → PR1~4 순차

decisions.md `[2026-05-05]` 항목 참조

### 🚀 2순위 — game.game_type 0~5 마이그레이션 (옵션 A, 보류)
- 56 파일 + DB 영향 작업
- onboarding 옵션 B 운영 안정 후 결정
- 카페 동기화 룰 + UI 전반 영향 사전 점검 필요

### 🚀 3순위 — 매치 코드 v4 후속 (Phase 6 미진행)
- 5/4 완료: Phase 1+2+3+4+5+7 (commit `8af51eb` + `bec591b`)
- Phase 6 = 라이브 페이지 deep link 미진행 (옵션)
- plan: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md`

---

## 기획설계 (planner-architect / 5/5)

- **팀 멤버 라이프사이클 + Jersey 통합 재설계** (보고서 `Dev/team-member-lifecycle-2026-05-05.md` — jersey 보고서 흡수). **8 결정 모두 Y + 미묘 6건 룰 반영 + (b) Phase 1+2 통합 진입**. 5 Phase 분해 (~13~14d, $100 으로 Phase 1+2 + 일부 4 가능 / 3+5 다음 세션). **Phase 1 PR1 진입 (default_jersey_number 사용처 정리 + DROP COLUMN 별도 명시 승인)**.
- **인증 흐름 재설계** — ✅ 완료 (`Dev/auth-flow-redesign-2026-05-05.md` / `3f016c9` main).

---

## 구현 기록 (developer / 5/5 Phase 1 PR1+PR2+PR3 — 압축)

PR1 (`ae4ffd7`): default_jersey_number 사용처 정리 (7 파일 / captain 검증 → team_members.jersey_number 치환).
PR2 (`d72aa0a`): 가입 폼 jersey input + 자동 복사 hook + 마이페이지 다중 팀 카드 (7 파일, neuron 2 / `preferred_jersey_number` 재사용).
PR3 (커밋 대기): tournament join 시 team_members → ttp 자동 복사 (운영자 시야 X) + 신청 폼 jersey input 제거 (2 파일, ef7e78e role 분기 보존).

상세 보고: developer agent 응답 (PR1=ae4ffd7 commit msg / PR2=d72aa0a / PR3=PM commit 후 hash).

남은 Phase 1: PR4 (`match_player_jersey` 신설 + W1 모달, ~1d) / PR5 (v1 우선순위 helper, 0.5d).

---

<!-- ARCHIVED: 구현 기록 PR1+PR2+PR3 상세 박제 압축됨 (PM 토큰 효율 룰 적용 — 매 PR commit 후 작업 로그 1줄 통합). 복원: git log -- .claude/scratchpad.md -->

## (ARCHIVED) 구현 기록 PR1~PR3 상세 — git log 으로 복원 가능

압축 시점 = PR3 완료 후. PR1=ae4ffd7 / PR2=d72aa0a / PR3=PM commit hash. 상세 BEFORE/AFTER + tester/reviewer 메모는 git history 참조.

---
---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / PortOne / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 (1f8ee19) |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| **도메인 sub-agent (옵션 A)** | ✅ P1+P2+P3 완료 (C 채택 — live-expert 영구 / 신규 박제 0) |
| **매치 코드 v4** | ✅ Phase 1+2+3+4+5+7 (전 Phase 완료) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-05 | (PM 커밋 대기) | **Phase 1 PR3 — tournament join 자동 sync (옵션 C+UI 본질)** — 2 파일 수정: api/web/tournaments/[id]/join/route.ts (team_members 일괄 SELECT → memberMap → role 분기 검증 → ttp INSERT 자동 복사 / 사용 안 하는 data.players jersey 검증 제거 / UNIQUE 중복 체크 source 변경) + (web)/tournaments/[id]/join/page.tsx (로스터 stage 안내 박스 추가 + jersey/position input UI 제거 + POST body 미전송). 5/5 ef7e78e role 분기 룰 보존 (player 필수 / coach 선택). schema 변경 0 / Flutter `/api/v1/*` 변경 0 / tsc 0. 운영자/캡틴 jersey 직접 입력 진입점 X = single source = team_members. | ✅ |
| 2026-05-05 | (PM 커밋 대기) | **Phase 1 PR2 — 가입 폼 jersey input + 자동 복사 + 마이페이지 다중 팀** — 6 파일 (신규 2 / 수정 4): jerseys-in-use API 신설 / join API zod + 충돌 검증 + preferred_jersey_number 저장 / members PATCH approve 자동 복사 + 409 JERSEY_CONFLICT / team-join-button-v2 모달 (jersey input + 사용 중 표시) / TeamsListCard 신규 / profile/page.tsx SELECT 확장 + 카드 교체 + name_primary 매핑. tsc 0 / schema 변경 0 / 운영 DB 영향 0. | ✅ |
| 2026-05-05 | DB UPDATE 3건 + INSERT 1건 + UPDATE 1건 (코드 변경 0) | **열혈농구단 SEASON2 출전 명단 정비 4건** — (1) jersey UPDATE 3건: 쓰리포인트/백승훈 ttpId=2540 (18→39) / 몽키즈/이지환 ttpId=2583 (0→4) / 몽키즈/최원영 ttpId=2581 (10→20). (2) 이도균 #70 등록 옵션 2 트랜잭션: tournament_team_players INSERT ttpId=2830 (제주 리딤 ttId=231 / userId=3352 / role=player) + team_members.jersey_number NULL→70 UPDATE (memberId=2701). 매 건 사전 검증 (동명이인 0 / 충돌 0) → 사용자 명시 승인 → 사후 SELECT 재확인 PASS. 임시 스크립트 즉시 삭제. 운영 DB 정책 준수. | ✅ |
| 2026-05-05 | `7f26b6f` + `60e8468` + `61e9ab1` + `5fd1716` + `d8bba4a` + `eb015aa` → main `3f016c9` | **인증 흐름 전체 재설계 main 배포 — 로그인 hard reload + getAuthUser() 단일 헬퍼 + 쿠키 자동 cleanup** — `7f26b6f` 로그인 server action redirect → return success + window.location.href hard reload (SSR 새 쿠키 인지 보장). C1~C4 옵션 A+B-PR1: signup layout 가드 / me API 탈퇴 401→200 통일 / ProfileCtaCard 글로벌 fetcher 위임 / `src/lib/auth/get-auth-user.ts` 신규 (JWT verify + DB SELECT + status 분기 + 쿠키 자동 cleanup + React.cache dedup) + 4 layout (web/login/signup/profile) 위임. **사용자 검증 통과 — 탈퇴 회원 쿠키 본질 해결** (1회 진입 후 잘못된 쿠키 자동 제거). 회귀: 빈 본문 chunk 404 = 배포 직후 chunk 캐시 mismatch (강력 새로고침 안내, 일시적). tsc 0 / 운영 DB 영향 0 / scratchpad+architecture+conventions+errors+index 박제. | ✅ |
| 2026-05-05 | (조사 only / 코드 변경 0) | **인증/세션/쿠키 흐름 전체 조사 + 재설계 옵션 보고서** — `Dev/auth-flow-redesign-2026-05-05.md` 작성. 14건 fix 분류 (활성 13 / dead code 1 / 충돌 0 / 누락 1=signup 가드). 콘솔 401 ×2 = 탈퇴 회원 me API 의도 분기 + ProfileCtaCard 자체 fetcher 중복 호출 (글로벌 fetcher 우회). 옵션 A (0.5d 작은 변경) + 옵션 B (1.5~2d 전면 재설계 = `getAuthUser()` 단일 헬퍼 + 쿠키 자동 cleanup) 비교. 권장 = A 즉시 + B-PR1 후속. 사용자 옵션 선택 대기. | ✅ |
| 2026-05-05 | `fa5bd90` → main `76e4ca3` | **로그인 버튼 작동 안 함 본질 fix — /login layout 가드 status 검증 누락** — 본질: `(web)/login/layout.tsx` 의 `if (session) redirect("/")` 가 JWT 만 검증 → 탈퇴 회원 쿠키 7일 잔존 시 /login 진입 즉시 / 로 보내져 시도 자체 불가. (web)/layout.tsx status 검증 추가했지만 login/layout 누락 = 회귀. fix: DB user.status 검증 추가 — 정상 회원만 / redirect, 탈퇴/미존재 = login 노출. errors.md 박제 (회귀 방지 룰: 인증 가드 5개소 일괄 점검 + JWT 살아있음 ≠ 사용자 정상). 사용자 검증 = 쿠키 삭제 후 정상 → fix 후 쿠키 삭제 없이도 정상 예상. | ✅ |
| 2026-05-05 | (조사 only / 코드 변경 0) | **열혈농구단 SEASON2 전국최강전 PDF (5/5 6팀 69명) vs DB 비교 + 이도균 가입 검증** — 종합: PDF 69 / DB 73 / 매칭 67. PDF only 2명 (리딤 #70 이도균 / 펜타곤 #21 박성후). DB only 6명 (5/5 미출전 = 그대로 유지). 이도균 = users id=3352 (5/3 가입) + 제주 리딤 멤버 active + 가입신청 approved 확인 → tournament_team_players 만 누락. 박성후 = users 0건 (완전 미가입, 내일 처리). 이도균 INSERT 스크립트 작성 완료 (사전 검증 + 사후 검증), 사용자 명시 승인 대기. | ✅ |
| 2026-05-05 | (PM 정리 / 코드 변경 0) | **onboarding 10단계 시스템 설계 합의 — 옵션 B (선호값 6종, DB 영향 0)** — 사용자 정책 합의: 첫 로그인 필수 3단계 + 자율 7단계 + 100점 게이미피케이션. 1 본인인증 (IdentityVerifyButton 재사용) / 2 활동환경 (17시도 + 게임유형 6종) / 3 출전정보 / 4 팀 / 5 사진 / 6 자기소개+SNS / 7 스타일 / 8 테마/표시 (신규) / 9 맞춤보기 (settings/feed PreferenceForm 흡수) / 10 알림. 6종 = `street-ball`(길농) + 기존 5종. 분기 룰 = 길농 단독 → 3,4 선택 / 그 외 → 필수. 옵션 A (game.game_type 마이그레이션 56파일+DB 영향) 보류. PR1~5 분해 (~5.5d). decisions/conventions/lessons +6 항목 박제. 다음 세션 PR1 진입 (또는 PR5 가시 효과 우선). | ✅ |
| 2026-05-05 | `ef7e78e` → main | **선수 배번 필수 정책 + role 분기 (3 API + admin/users 모달)** — 정책: player 배번 필수 / coach·captain 선택. join API zod 통과 후 누락 선수 닉네임 나열 + 422 / admin players API role==="player" + jersey null 차단 / Flutter v1 변경 0 (이미 required). admin/users 모달 TournamentRow role 분기 (player+누락 빨간 ⚠ / coach+누락 회색 — / 대회명 우측 role 라벨). 점검: 출전 339명 중 11명 누락 = player 7 (진짜) + coach 4 (정상). decisions+1 / conventions+1. | ✅ |
| 2026-05-05 | `06d1376` + `8c95565` 묶임 → main | **admin/users 강화 — 모달 4섹션 + 인라인 편집 12→3필드 PIPA + 배번 인라인 수정** — Phase A (4섹션): 소속팀 / 토너먼트 참가 / 활동 통계 / 구독 + 농구정보 2행 (선출/기본 등번호). Phase 1 (인라인 편집) → 12필드 → 3필드 축소 (PIPA 본인정정권). 변경 가능 = nickname/bio/is_elite + 사유 5자 이상 필수 + admin_logs warning. updateTournamentPlayerJerseyAction 신설 (배번 인라인 수정 + 동일 팀 unique 사전 검증). 사용자 commit (auth fix 류) 와 묶임 — lessons "다중 동시 commit 묶임 함정" 박제. | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 세션 + 5/5 auth 4건 묶임 홈/SWR/hydration fix + 5/5 auth 6건 묶임 탈퇴/가입/세션 가드 + 듀얼 P3~P7 + Step 2 활성화 + 듀얼 표준화 + 도메인 sub-agent P3 + 매치 코드 v4 Phase 1~7 + 5/5 58af36a 트리 카드 시간 표시) — 5/5 인증 재설계 옵션 A+B-PR1 prepend / 복원: git log -- .claude/scratchpad.md -->
