# ── CLI 붙여넣기용 작업 지시 ──

아래 3개 작업을 **순서대로** 박제해줘. 전부 subin 브랜치 · 스키마 변경 0(STAGE C 일부 status 컨벤션 제외) · 운영 영향 최소. 각 STAGE 끝나면 커밋하고 다음으로.

## 시작 전 (1회)
1. `git fetch origin --prune` → `dev` pull → `subin` 에 머지. 현재 브랜치 subin 확인.
2. `.env` DATABASE_URL 키 존재(값 노출 X) · `.env.local` localhost:3001 오버라이드 확인.
3. 결과 1줄 요약 후 진행.

---

## STAGE A — 대회 상태 표시 보정 (DB 0, 무위험, 먼저)
상세 스펙: **`CLI-통합의뢰서-대회상태Phase1+AdminS1.md` 의 STAGE 1** 그대로.
- `effectiveTournamentStatus(status,startDate,endDate)` 를 `src/lib/constants/tournament-status.ts` 에 추가(FINAL/준비중 외 종료일 경과 시 'completed', 당일은 미종료).
- **공개 화면만** 적용(목록 `deriveV2Status` / 상세·사이드바·스티커 / 캘린더·주간·프로필·사이트템플릿). **admin 화면은 raw status 유지.**
- 단위테스트 8케이스 + `npm run build` + 로컬 `/tournaments` 육안 확인.
- 커밋: `fix(tournaments): 종료일 경과 대회 표시 보정 (effectiveTournamentStatus)`

## STAGE B — 기록(Records) 박제 (DB 0)
상세 스펙: **`시안박제-기록-CLI프롬프트.md`** 그대로. 시안 = `Dev/design/BDR v2.33/_delivery-records-2026-06-16/`.
- 3개 탭: 대회 기록실(`/tournaments/[id]?tab=records`) / 선수(`/users/[id]` 기록 탭) / 팀(`/teams/[id]` 기록 탭).
- **공식기록 가드 `officialMatchNestedFilter()` 필수** · 집계는 `stat-leaders.ts` 재사용·확장.
- 응답에 `_sum`(누적)+`GP` **양형 노출**(누적을 평균×G로 역산 금지). 클레임 선수만 링크.
- 팀 경기 = `Team.id→TournamentTeam.team_id→TournamentMatch→MatchPlayerStat`(대회 경기 한정).
- 슛차트/시즌요약은 컴포넌트 유지하되 이번 박제 보류.
- 빌드 + curl raw(snake) 확인. 커밋: `feat(records): 선수·팀·대회 기록 탭 (officialMatch 가드)`

## STAGE C — Admin Console S1 처리 뮤테이션 (DB 0)
상세 스펙: **`CLI-통합의뢰서-대회상태Phase1+AdminS1.md` 의 STAGE 2** 그대로.
- 가드 `getWebSession()`+`role==="super_admin"` · `apiSuccess`(snake) · `adminLog()`.
- 신설: `game-reports/[id]/resolve` · `suggestions/[id]/respond` · `community/[id]/moderate` · `teams/[id]/review` · (선택)`inbox/[id]/resolve` 디스패처.
- **팀 검수(확정: status 컨벤션)** — `Team.status="pending_review"` 검수 API + **팀 생성/로고변경 시 세팅** + 인박스 teams union + `overview.queue.teams` 0고정 해제 **한 묶음**. `Team.status` 소비처 grep 확인.
- 각 API curl raw + 비-super_admin 403 + 빌드. 커밋: `feat(admin): Admin Console S1 처리 뮤테이션`

---

## 공통 규칙
- `apiSuccess` 응답키 자동 snake_case → 프론트 접근자 snake. 신규 필드는 curl 1회 raw 확인.
- 운영 DB destructive 금지 · `prisma migrate`/`db push` 금지(STAGE C 팀 status 는 문자열 값일 뿐 스키마 변경 아님).
- 단계별 `scratchpad.md` 1줄 + 신규 라우트 `architecture.md` + 결정 `decisions.md`. 끝에 미푸시 커밋 목록 알림.
- 막히면 그 STAGE 만 멈추고 보고(다음 STAGE 독립 진행 가능).
