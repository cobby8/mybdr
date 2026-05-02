# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22)
- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)

---

## 🚀 다음 세션 진입점 (2026-05-02 종료 시점 기준)

### 우선순위 1 — 5/2 동호회최강전 현장 피드백 대응
- D-day 셋업 완료 (DB 16팀 + 듀얼토너먼트 27경기 + Phase A~E 풀 시스템). 현장에서 발견되는 문제는 즉시 디버깅 프롬프트로 처리.
- 디버그 패턴: `Dev/cli-prompts/2026-05-01-profile-save-500-{debug|direct-diagnose|fix}.md` 3단계 카피.

### 🔴 대회 종료 후 즉시 처리 큐 (5/2 23:59 이후)

**1) 셋업팀 가입 대기 17명 정리** — ✅ 완료 (8 approved + 9 rejected, pending=0)

**2) 셋업팀 ttp user 매핑** — ✅ 5명 매핑 완료, 4명 잔여
- ✅ 매핑 완료: 곽규현(#1→3286) / 정세훈(#2→3032) / 임태웅(#12→3026) / 백주익(#15→2866 hifabric, name 매칭) / 백배흠(#17→2868 BB, name 매칭)
- ❌ 잔여 4명 (시스템 user 검색 0건):
  - #94 김영훈 (placeholder uid 2954, **8점**) ← 우선
  - #11 김병주 (userId null, 2점)
  - #7 이영기 (placeholder uid 2955, 0점)
  - #0 이준호 (placeholder uid 2957, 0점)
- 매치 #133 통계 매칭률: 39/49 = **80%**. 김영훈 매핑 시 **96%** 가능
- **5/2 패자전 진행 후 사용자 매핑 정보 받아 진행** (사용자 명시: "지금 진행하니까 끝나고 더")

**3) 셋업팀 placeholder user 5명 + team_members row 정리** (별건)
- 백주익(2953)/백배흠(2956): ttp 연결 끊김 → team_members row 잔존, 정리 대상
- 김영훈(2954)/이영기(2955)/이준호(2957): ttp 그대로 참조, 매핑 후 정리

**4) mergeTempMember 함수 강화** (별건) — name 매칭 추가
- 현재 nickname 만. 백주익(nick=hifabric, name=백주익) 케이스 자동 매칭 0건 발견
- name 도 매칭 후보로 추가 시 비슷한 케이스 자동 처리

**5) 16팀 중 잔여 8팀 `tournament_team_players` 0명 보정** (5/2 PM 큐)
- MZ / 블랙라벨 / 다이나믹 / MI / 슬로우 / 우아한스포츠 / MSA / SKD
- 셋업팀 패턴 (`scripts/_temp/sync-setup-tournament-players-2026-05-02.ts` git log 복원) 일괄 적용 가능 — placeholder/real user 정체 사전 점검 필수

### 우선순위 2 — 결정 대기 큐 (사용자 판단 받고 구현 진행)
| 영역 | 결정 건수 | 산출물 위치 |
|------|---------|------------|
| **관리자페이지 UI 개선** | 6건 (Phase A 모바일 가드 1순위) | `git log -- .claude/scratchpad.md` 에서 "관리자페이지 UI 개선 분석" 검색 |
| **Games 박제 잔여** | 결정 6건 중 1·2·3·4·5·6 모두 받음 → Phase B+C 완료. **Phase A (dead code 정리) 별도 commit 큐만 남음** | commit `f4b55c2` 직전 분석 |
| **Phase F2 wrapper 연결** | 박제만 된 `v2-dual-bracket-sections.tsx` 를 `v2-bracket-wrapper.tsx isDual` 분기에 mount + Stage 3·5 BracketView 분기 | commit `2dc9af8` |
| **Teams Phase A** | dead code 5 파일 삭제 별도 commit | commit `dfe5eb5` 직전 |

### 우선순위 3 — 인프라 잔여
- 카카오맵 SDK Places 통합 (선수카드 옵션 D)
- 미매칭 placeholder 73명 통합 (가입 hook + linkPlayersToUsers 이름 매칭)
- PortOne 본인인증 페이지 신설 (계약 완료 후)
- Tournament.status 'published' 잔재 cleanup
- 대회 로컬룰 옵션 (settings.localRules)

---

## 🚧 추후 구현 목록 (DB/API 확장 필요 — 영구 큐)
- 슛존 성공률 (heatmap) / 스카우팅 리포트 / 시즌 통계 / VS 비교
- 커뮤니티 댓글 답글·좋아요 / 게시글 북마크 / waitlist / no-show / QR 티켓
- AppNav 쪽지 unread count 뱃지 (messages unread API)
- D-6 EditProfile §2·§3·§4 (사용손/실력/공개 7항목 + instagram·youtube 컬럼 추가 시)
- D-3 §02 Highlight (MatchPlayerStat 평점) / §05 다음 주 추천 (추천 엔진)
- ComingSoonBadge 공통 컴포넌트 격상
- Q1 후속: `_components/` 11 파일 + `courts/[id]` 19건 옛 토큰 마이그 / ContextReviews series·player kind / `/reviews?courtId=` deep-link
- 대회 가입 hook 자동 매칭 (`linkPlayersToUsers` 호출) / `linkPlayersToUsers` placeholder 필터 (provider != "placeholder")
- 공개 페이지 placeholder 노출 점검 (랭킹/프로필/팀 멤버 카운트)
- 본인인증 활성화 시 실명·전화 자동입력 전환 + 필수 라벨 폐기
- organizations 단체 생성 → 목록 노출 e2e 스모크

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| Dev/design/ 단일 폴더 룰 | ✅ |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| Phase 10·12 운영 DB | ✅ |
| 헤더 구조 정리 (Phase 19 쪽지) | ✅ |
| ProfileShell 폐기 | ✅ |
| 마이페이지 영역 (D-1~D-8) | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| **듀얼토너먼트 풀 시스템** | ✅ A·B·C·D·E (Phase F 공개 시각화 ⏳ F2 박제만) |
| **5/2 동호회최강전 D-day 셋업** | ✅ DB 16팀 + 27경기 + Phase A~E + 통합 5쌍 |
| Live `/live/[id]` v2 박스스코어+프린트 | ✅ 풀 복원 |
| Teams 박제 Phase B+C+D | ✅ (Phase A dead code 잔여) |
| Games 박제 Phase B+C | ✅ (결정 6건 모두 처리, 잔여 큐 Phase A) |

---

## 작업 로그 (최근 10건, 오래된 것부터 압축)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-02 | 0f8da8e+b18227c+8ccd4dd+f0278b4+1bec5c3 | **STL (Single Truth Layer) Phase 1 — Flutter PBP 누락 응답 가공 보정** — `src/app/api/live/[id]/route.ts` +200줄. 4 출처 데이터 일관 통합. R1 (score_at_time 시계열 + 매치 헤더 cap, 사용자 통찰 반영) / R3 (quarterStatsJson 부분 누락 보충) / R4 (minutesPlayed=0 fallback) / R8 (quarter length 동적). PBP sync 이중 가드 (manual-fix-* + [수동 보정] description). 매치 6건 검증 통과. 보고서 2종 작성 (원영 전달용 — Flutter app fix 권장). architecture/decisions/errors/lessons +5 | ✅ |
| 2026-05-02 | 6dda1a0 | **HOT 카드 — 진행 중 직전 경기 MVP 노출** — public-bracket route 에 recentMvp 응답 추가 (mvp_player_id null fallback → playerStats GameScore 공식). HOT 카드 3-tier (대회 종료 → 핫팀 / 진행 중 → MVP / 종료 매치 0건 → 안내). 클릭 시 /live/[matchId]. 검증 매치 3건 (133/132/99) 합리적 MVP 추출 | ✅ |
| 2026-05-02 | 28c7b23 | **대시보드 3카드 동작 개선** — 진행률 (completed+live)/total / LIVE 카드 클릭 시 /live/[id] 이동 + 첫 라이브 매치 정보 표시 / status='in_progress' → status IN ['live', 'in_progress'] 이중 인식 | ✅ |
| 2026-05-02 | c1c9d87+76ea5ac | **LIVE 표기 중복 제거 + 온에어 펄스 효과** — isLive 시 STATUS_LABEL 회색 LIVE 숨김 (빨간 펄스만). globals.css `@keyframes live-air-pulse` 신규 (opacity + box-shadow ring 5px 동시 변화, 1.6s ease-in-out) | ✅ |
| 2026-05-02 | d046ab1 | **폴드5 외부 (~388px) Hero 팀명/TOTAL 잘림 fix** — hero-scoreboard.css 에 `<400px` base + `400px+` 분기 추가 (3-tier). 일반 모바일 (400px+) 변경 0. errors.md 박제 (회귀 방지 룰: Tailwind xs: 또는 < 400 명시 분기 권장) | ✅ |
| 2026-05-02 | 06d67c3+1a9737c | **단체 상세 모바일 히어로 fix + 인라인 grid 4 케이스 모바일 분기** — org-hero-v2 폰트/패딩/로고 분기 (text-[40px] 고정 → 28/34/40 sm:md:) + word-break:keep-all / signup·activity 의 repeat(4-5) 인라인 grid → Tailwind grid-cols-2 sm:grid-cols-N (errors.md 04-29 안티패턴) | ✅ |
| 2026-05-02 | (DB 보정 1건) | **매치 132 임강휘 누락 PBP 1건 INSERT** — local_id `manual-fix-132-imkangwhi-q1-2pt-*` (description `[수동 보정]`). Flutter sync 이중 가드 (commit 1bec5c3) 로 영구 보존. 매치 132 종료 후 Flutter 최종 sync 시 헤더=PBP 합 자연 일치 | ✅ |
| 2026-05-02 | 2dc9af8,3a519c8 | Dev/tournament-formats 학습자료 박제 + Phase F2 카드 그리드 박제 (wrapper 미연결) | ✅ |
| 2026-05-02 | (DB 보정만) | `/live/133` 셋업팀 명단 0→13명 INSERT. **잔여 8팀 동일 보정 PM 큐** (MZ/블랙라벨/다이나믹/MI/슬로우/우아한스포츠/MSA/SKD) | ✅ |
| 2026-05-02 | 3d82a44+(8건) | **D-day 셋업팀 풀 패치** — 16팀 로고 등록/sharp 정규화/일정탭 표시 + dual sync fix (winner_team_id + progressDualMatch) + globals 색상 변수 + logoUrl 상대경로 fix + manage 에러메시지 키 | ✅ |
| 2026-05-02 | (DB UPDATE) | **셋업팀 가입+매핑 정리** — 17건 처리 (8 승인 / 9 reject, pending=0) + ttp 5명 매핑 (곽규현/정세훈/임태웅/백주익/백배흠) → 매치#133 통계 매칭률 80%. 잔여 4명 (김영훈8점/김병주2점/이영기/이준호) 패자전 후 진행 | ✅ |
