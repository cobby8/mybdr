# 오늘의 액션 (2026-07-01) — Cowork 자동 루프

> 상태: 6/30 야간~7/1 새벽 대형 스프린트 완료. 09:00 재점검 기준 갱신.
> **변경점(03:50 대비)**: 신규 로컬 commit 1건 `e2cc5b8` PR-PUB-2-7(랭킹 DS v4 토큰 정합) → **미push 1건**. fetch 시 stale `release/*` 원격 브랜치 정리(prune)됨.
> 새 Claude.ai zip 없음 (uploads = SKILL.md / `_zips` 최신 = v52 admin-toss, 이미 6/28 Master Conductor 에 ADM-0 소스로 등록·진행 중).
> ⚠️ `origin/main` 이 `origin/dev` 보다 **24 commit 앞섬** (release/* 가 main 직머지, dev 역머지 안 됨 — 방치 누적).

---

## ☐ 액션 1 — 미push 1건 push 결재 (1분 · 신규)

로컬 `dev` 에 `e2cc5b8` **PR-PUB-2-7 랭킹 DS v4 토큰 정합 (2파일)** 1건이 `origin/dev` 에 아직 안 올라감.

→ 본 루프는 git 변경 안 함(결재 영역). **"push 해줘"** 한 줄이면 CLI 가 `git push origin dev`. (내용 = PUB 랭킹 화면 토큰 정합, UI 전용 추정 — push 전 CLI 가 `git show --stat e2cc5b8` 로 범위 확인 권장.)

## ☐ 액션 2 — main → dev 역머지 결재 (3분 · 권장)

`origin/main` 이 `origin/dev` 보다 **24 commit 앞섬**. main 에만 있는 내용 (전부 release/app-update 계열, dev 미보유):

- recorder 앱 `0.1.12`~`0.1.17` (#778/#780/#781/#784 등)
- `#779` 종별·디비전 연령 편집 UI + 자동채움 (Phase 3)
- `#776` 서버 렌더 시간 KST 통일 / `#782` 유튜브 임베드 경기별 start
- `#775` score-sheet 이탈 방지 / `#770~772` live 기록지·프린트 게이팅

→ `dev` 가 **172 commit 앞선** 상태(리뉴얼 대량 박제)라, 역머지 미루면 다음 `dev → main` 릴리스 PR 충돌 위험 ↑.
> 판단 후 한 줄: **"main → dev 역머지 해줘"** 또는 "보류".
> (연령 UI Phase 3 는 dev 측 admin-v2 포팅과 내용 중복 가능 — 충돌 시 admin-v2(dev) 우선 유지 권장.)

## ☐ 액션 3 — working tree uncommitted 정리 결재 (1분)

`git status` 에 modified 다수 (전부 `.claude/` — 작업 산출물 아님 추정):
`.claude/agents/live-expert.md` · `.claude/knowledge/*` · `.claude/backup-2026-04-14/*.json` · `.claude/phase-ledger.md` · `.claude/scratchpad*.md` 등.

→ 본 루프는 git 변경 안 함(결재 영역). **"커밋해줘"**(필요 파일만 명시 add) 또는 **"discard"** 한 줄.

## ☐ 액션 4 — 진행 트랙 계속 (Claude.ai paste 불필요)

새 시안 zip 없음 → paste 액션 없음. CLI 박제 계속만 하면 됨:

- **PUB 트랙**: PUB-1 ✅ 완료 / PUB-2 🔵 진행(2-1~2-7 박제) → **PUB-2 잔여 + PUB-3(P2 보조/정적)** 계속.
- **ADM 트랙**: 심판 콘솔 4-1~4-4 ✅ + super 행정·news-console·매너평가/시즌시상 ✅ + 레거시 308 cutover 다수 ✅ → **대회 운영(ADM-1)·대회관리자(ADM-2)·백오피스(ADM-3) 잔여** 박제.

> CLI 한 줄(예): `admin-toss-port-plan-2026-06-28.md` 의 ADM-1(대회 운영 워크스페이스) 배치 §진입게이트부터 시작해줘. 모든 결재 default 자동 적용.

---

## 상태

- PUB: PUB-1 ✅ / PUB-2 🔵(2-7까지 · 최신 `e2cc5b8`) / PUB-3 ⬜
- ADM: 심판·super·콘텐츠 콘솔 🔵 대량 진행 / 대회운영·관리자·백오피스 셸 잔여
- git: dev 미push **1건**(액션 1) / main +24 역머지 대기 ⚠️ / dev +172 (릴리스 PR 누적)
- 새 zip: 없음 (v52 admin-toss 이미 진행 소스)

## 알림

- 🆕 **미push 1건** `e2cc5b8` PR-PUB-2-7 — push 결재(액션 1).
- 🟡 **main/dev 분기 24건** — 역머지 우선 권장(액션 2).
- 🟡 **tracking 문서 stale** — `_MASTER-renewal-execution-2026-06-28.md` 진행 대시보드(전 행 ⬜)와 `.claude/phase-ledger.md` 가 실제 진행(PUB-1✅/PUB-2🔵/ADM 심판 대량)과 불일치. CLI 가 다음 PR 시 ledger + Master 대시보드 미러 갱신 권장.
- 🟢 새 디자인 zip 없음 — sync/paste 트리거 없음.
- ℹ️ admin Toss 영역 = lucide/Toss radius 허용(예외). 공개(PUB)는 BDR 13룰·AppNav frozen 유지.
