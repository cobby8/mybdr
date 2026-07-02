# 오늘의 액션 (2026-06-28) — Cowork 자동 루프

> 상태: 6/28 새벽 CLI 가 admin-v2 리빌드(R0 그린필드 폐기 → R1 시안 정본 1:1 포팅) + Phase 3 종별·디비전 연령 편집 UI 작업. **로컬 dev 미push commit 3건** 존재.
> 새 Claude.ai zip 없음 (uploads = SKILL.md / _zips 최신 = 6/25 B1 source).
> ⚠️ origin **main 이 dev 보다 16 commit 앞섬** — release/* 브랜치(#776/#778/#779)가 main 으로 직접 머지됐고 dev 로 역머지 안 됨.

---

## ☐ 액션 1 — 미push commit 3건 push 여부 결재 (1분)

로컬 `dev` 가 `origin/dev` 보다 **3 commit 앞섬** (본 루프는 push 안 함 — 사용자 결재 영역):

- `096ab55` feat(admin-v2): R1 토대 — 시안 정본 1:1 포팅 디자인시스템 (레거시 0의존)
- `941ed8a` chore(admin-v2): R0 — 실패한 그린필드 제거 (레거시 재사용 시각 드리프트)
- `accadce` feat(admin-v2): M3 대회관리자 셸 파일럿 5화면 (데이터계층 end-to-end)

> 추가로 uncommitted 수정 2건(`.claude/agents/live-expert.md`, backup json) — 본 작업과 무관해 보임. push 전 `git status` 확인 권장.
> 판단 후 한 줄: "3건 push 해줘" 또는 "보류".

## ☐ 액션 2 — main → dev 역머지 결재 (2분 · 권장)

`origin/main` 이 `origin/dev` 보다 **16 commit 앞섬**. main 에만 있는 내용:

- `#779` 종별·디비전 연령 편집 UI + 자동채움 (release/age-autocalc)
- `#778` recorder app 0.1.14
- `#776` 서버 렌더 시간 KST 통일

→ dev 가 stale 해지면 다음 dev→main PR 충돌 위험. **`main → dev` 역머지** 권장.
> (Phase 3 연령 UI 는 dev `abf695f` 에도 있어 내용 중복 — 충돌은 작을 것으로 예상.)

## ☐ 액션 3 — Claude.ai paste (전일 이월 · 방향 결재 후)

6/27 에서 이월된 두 paste 가 여전히 **방향 결재 대기**:

- (A) admin-toss v2.42 통합 parity 시안 — `admin-toss-v242-integrated-design-request-2026-06-26.md` §0 본문
- (B) B1 역박제 QA — `source-request-B1-workspace-delivery-2026-06-26.md` + `BDR-source-B1-tournament-workspace-2026-06-26.zip`

→ admin Toss 1순위 = parity 박제(A) vs BDR 역박제(B) 한 줄 결재 후 해당 건 paste.

## ☐ 액션 4 — admin-toss PR-1 셸 육안 검증 (5분 · 이월)

`admin-toss-PR1-shell-verify-cowork-2026-06-27.md` — 프리뷰 https://mybdr-git-dev-mybdr.vercel.app `/admin/*` 에서 셸(사이드바 UserChip / 우상단 계정 제거 / 모바일 드로어) 정합 + 로그아웃 회귀 체크리스트.

---

## 상태

- admin-v2 리빌드: 🔵 진행 중 (R1 정본 1:1 포팅 토대 — 로컬 미push 3건)
- Phase 3 연령 UI: ✅ main 반영(#779) + dev `abf695f`
- admin-toss v2.42 / B1 역박제: paste 대기 (방향 결재)
- admin-toss PR-1 셸: 육안 검증 대기
- STAGE E Home+Legal: 의뢰서 작성됨 / admin 정합 뒤로 보류

## 알림

- 🟡 **main/dev 분기** — main +16(release 머지) / dev +57(admin-v2). dev 가 release 내용(연령UI/recorder0.1.14/KST) 미보유. 역머지 권장(액션 2).
- 🟡 **미push 3건 + uncommitted 2건** — 본 루프는 git 변경 안 함. 사용자 결재(액션 1).
- 🟢 새 디자인 zip 없음 — 박제 batch 트리거 없음.
- ℹ️ admin-toss 방향 결재(parity vs 역박제)는 6/26부터 미결 — 결정 시 paste 큐 풀림.
