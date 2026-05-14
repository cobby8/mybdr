# 작업 스크래치패드

## 현재 작업
- **요청**: F (Phase 23 PR2/PR3 마무리 후 Phase 19) 순차 진행 — 운영 기능 절대 덮어쓰지 말고 자연스럽게 통합
- **상태**: ✅ Phase 23 PR2+PR3 commit + push 완료 (`a147bb1`). Phase 19 진입 결재 대기
- **모드**: no-stop

## 진행 현황표
| 단계 | 결과 |
|------|------|
| v2.5 sync commit + 푸시 | ✅ `1fa9210` + aac87e2 머지 |
| Phase 23 PR2/PR3 미진입 확인 | ✅ |
| Phase 23 PR2+PR3 구현 + 검증 + 리뷰 | ✅ 3 파일 +368 LOC / tsc 0 / vitest 204/204 / reviewer 즉시 commit 권장 |
| Phase 23 PR2+PR3 commit + 푸시 | ✅ `a147bb1` push 완료 |
| Phase 19 진입 결재 | ⏳ 대기 (D1 룰 자동 해제 — form.tsx 자유) |

## Phase 23 PR2+PR3 요약 (commit `a147bb1`)

| 파일 | LOC | 변경 |
|------|-----|------|
| `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` | +134 | PBP findMany + 헬퍼 호출 + 신규 props 8종 전달 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | +234 | Props + useState 초기값 wiring + draft/DB confirm + cross-check + 2 배너 |
| `src/lib/auth/require-score-sheet-access.ts` | +7 | updatedAt 컬럼 추가 |

운영 동작 100% 보존: useState 7종 호출/setter / localStorage key / 4종 모달 진입점 / BFF submit / buildSubmitPayload 모두 변경 0.

사용자 결재 처리: Q1 (draft vs DB inline confirm) / Q2 (정보 배너) / Q4 (cross-check + console.warn). Q3/Q5 = PR4 별도.

reviewer WARN 3건 (필수 수정 0): ConfirmModal 박제 / audit endpoint 박제 / OT cross-check 확장 — 모두 후속 PR.

## 리뷰 결과 (reviewer) — 2026-05-14 (post-commit 독립 검증)

📊 **종합 판정: 통과 (이미 commit + push 완료된 a147bb1 사후 검증 — 회수 / hotfix 사유 0)**

검증 환경:
- `npx tsc --noEmit` = 에러 0 (출력 없음 = 통과 확인)
- `npx vitest run src/__tests__/lib/score-sheet/ src/__tests__/score-sheet/` = 11 files / **204 passed** (재현)
- prisma schema 인덱스 = `idx_pbp_action (tournament_match_id, action_type)` 적중 ✅

### 7 항목 판정 테이블

| # | 항목 | 판정 | 근거 |
|---|------|------|------|
| 1 | planner 설계 부합도 | ✅ 통과 | pbpToScoreMarks/pbpToFouls = page.tsx L396~401 server-side 호출. BigInt 직렬화 = L143 (players) / L162~165 (lineup) / L357~358 (teamId) / L451~453 (updatedAt) / L309 (match.id) 모두 `.toString()` ✅. 신규 props 8종 (initialRunningScore/initialFouls/initialTimeouts/initialSignatures/initialNotes/initialQuarterScoresDB/matchUpdatedAtISO/pbpCount) = planner 6 + 합리적 2 (matchUpdatedAtISO/pbpCount Q1·Q2 결재 직접 필요 — planner 설계 의도 보강). useState 초기값 wiring = `?? EMPTY_*` 패턴 (form L160·L165·L167·L172~181) 완전 일관 |
| 2 | 사용자 결재 5건 반영도 | ✅ 통과 | **Q1**: form L372~404 — draftTime > dbTime AND hasDBContent 일 때만 `window.confirm()` (L385~391) / draftTime ≤ dbTime AND hasDBContent → draft 자동 무시 (L392~394 — 사고 영구 차단 룰 정확) / DB content 0 = 신규 매치 = draft 그대로 적용 (L396 주석 — 결재 의도 정확). **Q2**: form L302~305 (`pbpCount===0 && initialQuarterScoresDB !== undefined && Object.keys.length > 0`) + JSX L901~924 정보 배너 ✅. **Q3**: 본 PR 차단 0 — `status==="completed"` 분기 코드 grep 결과 = 0 (PR4 별도 결재 의도 보존 ✅). **Q4**: form L235~284 useEffect mount-1회 cross-check (`toQuarterScoresJson(initialRunningScore)` vs `initialQuarterScoresDB.home/away`) — Q1~Q4 만 비교 / mismatch 시 setCrossCheckWarning + `console.warn` (L274). 노란 배너 L874~896 — 사용자 결재 "endpoint 부재 시 충분" 정합 ✅. **Q5**: form/page 양쪽 PR4 코드 0 (`status==="completed"` 분기 / audit POST fetch 0) ✅ |
| 3 | 3 자체 noted 이슈 깊이 분석 | ⚠ 후속 권장 (필수 수정 0) | **(a) `window.confirm()`**: UX 일관성 약간 불일치이나 본 PR 의 1차 목표 = 매치 218 사고 영구 차단. ConfirmModal 박제 = JSX 트리 추가 + tester 부담 → **PR6 분리 합리적**. blocking 동작 자체는 기능적 정확. **(b) `as unknown as PaperPBPRow[]`** (page L394): Prisma 반환 vs PaperPBPRow (running-score-helpers.ts L321~333) 비교 결과 — id(bigint), quarter(number\|null), action_type(string\|null but Prisma 는 String NOT NULL), action_subtype, is_made, points_scored, home/away_score_at_time, tournament_team_id(bigint\|null), tournament_team_player_id, description **모두 일치**. 캐스팅 사유 = nullable subtle 차이 (Prisma 의 String NOT NULL vs PaperPBPRow 의 string\|null) — 안전한 와이드닝. 안전한 대안 = 명시 매핑 함수 도입 가능하나 **현재 캐스팅도 런타임 안전** (헬퍼 내부 `?? 0` `?? 1` 폴백 모두 박제). **PR6 명시 mapping 후속 합리적**. **(c) `console.warn` cross-check**: Sentry / 별도 로깅 부재이나 운영 모니터링 = 사용자 직접 결재 ("endpoint 부재 시 충분"). 노란 배너로 운영자 즉시 인식 가능. **PR5 endpoint 박제 시 호출 추가 = 합리적 단계 분리** |
| 4 | BigInt 직렬화 안전성 | ✅ 통과 | page.tsx 의 PBP findMany 결과는 client 로 직접 전달 ❌ — server-side 에서 헬퍼 호출 후 결과 (이미 string-id) 만 prop drilling. RunningScoreState.home/away[].playerId = string (running-score-helpers.ts L423 `tournament_team_player_id.toString()`). FoulsState.home/away[].playerId = string (foul-helpers.ts L348). 모든 BigInt prop = page.tsx 에서 `.toString()` (L143/162~165/309/357~358/451~453). matchUpdatedAtISO = ISO string (L451~453 `toISOString()`). initialQuarterScoresDB = JSON object (prisma 의 JsonValue) — 내부에 BigInt 0 (점수 = number). draft.savedAt 비교 시 `new Date(...).getTime()` 사용 = 안전. 누락 0 |
| 5 | 회귀 위험 분석 | ✅ 통과 | **신규 매치 (PBP 0, draft 0)**: page L411~413 (initialRunningScore/initialFouls 양쪽 0 → undefined 복귀) → form L160·L165 `?? EMPTY_*` 폴백 → 기존 동작과 동일. **사전 라인업 자동 fill**: form L311~347 mount useEffect = 그대로. draft 복원 useEffect 와 별개로 동작 보존. **buildSubmitPayload**: L711~775 시그니처 변경 0 (인자 0, 반환 unknown). **state shape**: 7 state 모두 동일 type. **4종 모달 진입점**: FoulType / PlayerSelect / LineupSelection / QuarterEnd 모두 변경 0 (form L194~233 trigger setter 호출 위치 변경 0). **localStorage key**: `DRAFT_KEY_PREFIX = "fiba-score-sheet-draft-"` L122 보존. **Flutter 매치 차단**: page L231~267 `getRecordingMode !== "paper"` 분기 → 안내 페이지 (Phase 23 변경 전혀 안 만짐). **draft 저장 throttle**: form L472~497 useEffect 변경 0 |
| 6 | Prisma 쿼리 효율 | ✅ 통과 (인덱스 적중) | require-score-sheet-access.ts L102~134 = 1쿼리 (updatedAt 컬럼 추가는 같은 SELECT 안 — 추가 라운드트립 0). page.tsx 신규 = `play_by_plays.findMany` 1회 추가 (L366~389) → 인덱스 `idx_pbp_action (tournament_match_id, action_type)` 적중 ✅ (schema L1877). venue / homeTeam / awayTeam SELECT (3쿼리) + lineup×2 + players×2 = 기존 7쿼리 + 신규 1쿼리 = 총 8쿼리 (Promise.all 양 측 동시 = 실제 라운드트립 ≈ 5단계). 운영 영향 0 (SELECT 만). **paper-fix-* prefix 가드 미적용** — running-score-helpers.ts L386~388 주석 = "caller 책임" 으로 미적용. 단 detectTeamSide (L408) 가 mixed 매치 안전망 역할 — 충분. **단 mixed 매치에서 Flutter 가 박제한 shot_made (paper-fix prefix 없음) row 도 SELECT 포함됨** → home/away teamId 일치하면 ScoreMark 로 변환됨 → 동작 자체는 OK (paper 매치는 settings.recording_mode=paper 가드로 진입). 효율 측면 일치. ⚠ **마이너**: pbpCount = `pbpRows.length` (L390) → ScoreMark 변환 후가 아닌 raw row 수 → cross-check 배너 트리거 조건 (`pbpCount === 0`) 과 정확 일치 (raw=0=변환 후도 0). |
| 7 | commit 분리 권장안 | ⚠ 사후 검토 (이미 통합 commit 됨) | 이미 `a147bb1` 단일 commit 으로 push 완료. **만약 사전 분리했다면**: PR2 단독 (page.tsx + require-score-sheet-access.ts) → form.tsx props 미선언 → tsc fail (form L80~119 interface). 그래서 PR2+PR3 통합 commit 이 **유일하게 빌드 가능** = 사전 분리 불가능. 현재 통합 commit = 합리적 |

### 결론

| 영역 | 판정 | 액션 |
|------|------|------|
| **머지 OK** | ✅ 이미 push 완료 (a147bb1) | 회수 / hotfix 사유 0 — 운영 배포 진행 가능 |
| **즉시 수정** | 없음 | 0건 |
| **후속 권장** | 3건 | PR4 (status=completed 가드 + audit) / PR5 (audit endpoint 박제 + cross-check 호출) / PR6 (ConfirmModal 박제 + PaperPBPRow 명시 mapping + OT cross-check 확장) |

### 잘된 점

- BigInt 직렬화 누락 0 (page.tsx 5위치 모두 `.toString()` / `.toISOString()` 일관)
- 신규 매치 회귀 위험 = useState `?? EMPTY_*` 폴백 패턴으로 완전 차단
- buildSubmitPayload / localStorage key / 4종 모달 진입점 / Flutter 차단 모두 변경 0 = 운영 동작 100% 보존 약속 정확 이행
- draft vs DB 우선순위 룰의 4-분기 (draft>DB+content / draft≤DB+content / DB content 0 / Date 파싱 실패) 모두 명시 구분 = 사고 차단 룰 정확
- PR1 헬퍼 (pbpToScoreMarks/pbpToFouls) 의 mixed 매치 안전망 (detectTeamSide) 이 PR2 의 paper-fix prefix 가드 부재를 안전하게 보강
- 인덱스 적중 (`idx_pbp_action`) — DB 부하 우려 0

### 후속 PR 우선순위 (recommended order)

1. **PR4** (선택 결재): status=completed 매치 수정 가드 — UX 경고 모달 + audit 박제 (Q3 결재 별도)
2. **PR5**: audit endpoint 박제 (`/api/web/audit/score-sheet-discrepancy` 또는 기존 audit pattern 재사용) + cross-check useEffect 안 fetch 호출 추가
3. **PR6**: ConfirmModal 도메인 전용 컴포넌트 + form L391 `window.confirm` 교체 + PaperPBPRow 명시 mapping 함수 (`pbpRowToPaperPBPRow`) + OT (period 5~7) cross-check 확장

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-14 | Phase 23 PR2+PR3 — 매치 재진입 시 자동 로드 (매치 218 사고 영구 차단) + draft/DB confirm + cross-check 경고 | ✅ 3 파일 +368 LOC / tsc 0 / vitest 204/204 / commit `a147bb1` / push 완료 / reviewer 즉시 commit 권장 |
| 2026-05-14 | BDR v2.5 sync + Phase 23 ScoreSheet 시안 5 파일 commit (시안 → 운영 갭 박제) | ✅ commit `1fa9210` (221 파일) / _archive 138 파일 백업 / push 완료 |
| 2026-05-14 | Phase 23 PR1 — PBP → ScoreMark / FoulMark 역변환 헬퍼 2개 + PaperPBPRow 타입 + vitest 24 케이스 | ✅ tsc 0 / vitest 24/24 / 회귀 204/204 / commit `b7c44d8` / push 완료 |
| 2026-05-14 | Phase 23 설계 분석 (planner-architect / read-only) — score-sheet 재진입 자동 로드 | ✅ 분석 박제 / 사용자 결재 5건 수락 / PR 3+1 분해 |
| 2026-05-14 | Phase C — status="completed" score safety net + Phase 22 knowledge | ✅ vitest 8/8 / tsc 0 / commit 분리 |
| 2026-05-13 | FIBA Phase 21+22 — 종이 매치 박스스코어 6 컬럼 hide + LIVE API OT 표시 fix | ✅ tsc 0 / vitest 725/726 / commit `171de67`+`63c0633` / 운영 배포 / 사용자 검증 완료 |
| 2026-05-13 | UI-3 wizard bracketSettings + UI-4 사이트 영역 제거 | ✅ commit `8478a24` |
| 2026-05-13 | UI-2 wizard 압축 (3-step → 1-step) + ?legacy=1 안전망 | ✅ commit `60dd37e` |
| 2026-05-13 | P2 dual 정합성 경고 + UI-1.5 ?step=2 anchor | ✅ commit `e8adc1a` |
| 2026-05-13 | P0 GameTime 역파싱 + P1 divFees 입력 UI 핫픽스 | ✅ commit `8a27f8a` |

## 미푸시 commit (subin 브랜치)
**0건** — `1fa9210` + `a147bb1` 푸시 완료.

## 후속 큐 (미진입)
- **Phase 19** — 시안 → 운영 박제 (scoresheet.css 600줄 디테일 + 페이퍼 모드 토글). PR-S1~S7 분해 / D1 룰 자동 해제 (form.tsx 자유) → 결재 6건 (D2~D7) 진입 가능
- **Phase 23 PR4** (선택) — status="completed" 매치 수정 가드 (UI 경고 모달 + audit) — 별도 결재
- **Phase 23 PR5** (후속) — audit endpoint 박제 + cross-check 호출
- **Phase 23 PR6** (후속) — ConfirmModal 박제 + OT cross-check 확장 + PaperPBPRow 명시 mapping
- **Phase A.7** — 시안에 운영 모달 5종 박제 의뢰서 작성 (Claude.ai Project 용)
- UI-1.4 entry_fee 사용자 보고 재현 (커뮤니케이션)
- **GNBA 8팀 코치 안내**: 자가수정 진입 시 본인 이름/전화 입력 = 자동 setup
