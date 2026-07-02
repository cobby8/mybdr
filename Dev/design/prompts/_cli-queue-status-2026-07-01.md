# CLI 작업 큐 — 2026-07-01 갱신 (Cowork 자동 루프)

> 목적: 잔여 CLI 작업 한 눈에 — 트랙 / 진행 / 권장 다음 액션.
> 6/30 야간~7/1 새벽 대형 스프린트(PUB-1 완료 + PUB-2 + ADM 심판/콘텐츠 콘솔 + cutover 308). 새 zip 없음. main/dev 분기 24건 결재 대기.

---

## 0. 현재 상태 (Cowork bash 점검 기준)

| 항목 | 상태 |
|---|---|
| 브랜치 | `dev` |
| 최신 commit | `e2cc5b8` feat(pub): PR-PUB-2-7 랭킹 DS v4 토큰 정합 (2파일) |
| 로컬 dev vs `origin/dev` | **1** (`e2cc5b8` PR-PUB-2-7 미push — push 결재 대기) |
| `origin/main..origin/dev` | **172** (dev 가 리뉴얼 대량 박제로 앞섬 — 릴리스 PR 누적) |
| `origin/dev..origin/main` | **24** (main 이 release/app-update 머지로 앞섬 — 역머지 필요) |
| uncommitted | 다수 (`.claude/` agents·knowledge·backups — 작업 산출물 아님 추정) |
| 새 Claude.ai zip | 없음 (uploads = SKILL.md / `_zips` 최신 = v52 admin-toss, 진행 소스로 사용 중) |

---

## 1. 현재 트랙 큐

| # | 트랙·배치 | 상태 | 다음 액션 |
|---|---|---|---|
| PUB-1 | 핵심 18p (홈·인증·대회·경기·팀·프로필·온보딩·결제) | ✅ 완료 (1-1~1-8) | — |
| PUB-2 | P1 경험 22p (코트·프로필부가·커뮤니티·메시지·알림·검색·시리즈/단체·랭킹) | 🔵 진행 (2-1~2-7 박제) | PUB-2 잔여 화면 계속 |
| PUB-3 | P2 보조/정적 12p | ⬜ 대기 | PUB-2 완료 후 |
| ADM-심판 | 심판 콘솔 4-1~4-4 (스코프·명단·OCR·수당·공고·선정풀·신청관리) | 🔵 대량 완료 | 잔여 화면 정합 |
| ADM-콘텐츠 | super 행정(audit-log·transfer)·news-console·매너평가·시즌시상 | 🔵 완료 | — |
| ADM-cutover | 레거시 라우트 308 봉인 (analytics·뉴스·매너·tournaments·referee 16경로 등) | 🔵 진행 | 잔여 레거시 봉인 |
| ADM-1 | 대회 운영 워크스페이스 (최복잡) | ⬜ 대기 | `admin-toss-port-plan-2026-06-28.md` ADM-1 |
| ADM-2 | 대회관리자 셸+마법사 | ⬜ 대기 | ADM-1 검증 후 |
| ADM-3 | 백오피스 (admin)/admin/* | ⬜ 대기 | ADM-1 검증 후 |
| PUB-sync | 49·50 머지→BDR-current | ✅ 완료 | zip50 PUB-v1.0 sync (6/30 15:06 `5dbc9b4` 후속) |

> ⚠️ 실제 박제 순서가 Master Conductor(ADM-0→ADM-1 대회운영 먼저)와 다르게 진행됨 — CLI 가 심판/콘텐츠 콘솔·cutover 를 선행. 정상(운영자 선택). Master 대시보드·ledger 미러 갱신 필요.

---

## 2. 권장 실행 순서

1. (사용자) **main → dev 역머지** 결재 — 분기 24건 해소(액션 1).
2. (사용자) working tree `.claude/` uncommitted 정리 결재(액션 2).
3. CLI: PUB-2 잔여 + PUB-3 계속, 또는 ADM-1(대회 운영) 진입 — 둘 중 우선순위 한 줄 결재.
4. CLI: 다음 PR 시 `.claude/phase-ledger.md` + `_MASTER-renewal-execution` 진행 대시보드 실제 상태로 미러 갱신.
5. 각 PR: `cmd /c npx tsc --noEmit` + build / 시각 회귀 (PUB=AppNav 4케이스·13룰 / ADM=Toss preview 상태 갤러리·390/720/1024/1440).

---

## 3. 주의

- 본 루프는 git 변경(commit/push/merge) 자동 실행 안 함 — 전부 사용자 결재.
- `git add .` 금지 — 필요 파일만 명시 staging (동일 dev 공유 시 영역 격리).
- 운영 DB destructive 금지. schema diff + 승인 선행. DATA-CONTRACT 🔴 신규필드 = 준비중/disabled 처리(mock 금지).
- `/api/v1` (Flutter 기록앱) 변경 = 담당 공백 → 사용자 결정 필요.
- 시스템 분리: ADM = Toss(lucide/`ts-*`/blue) / PUB = BDR 13룰·Material Symbols·AppNav frozen. 혼입 금지.
- main/dev 분기 방치 시 다음 dev→main 릴리스 PR 충돌 ↑ — 역머지 우선.
