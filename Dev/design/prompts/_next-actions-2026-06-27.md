# 오늘의 액션 (2026-06-27) — Cowork 자동 루프

> 상태: v2.40 콘솔 + v2.41 핸드오프 + admin-toss 마이그레이션 sweep **운영 반영 완료** (dev == main).
> 새 Claude.ai zip 없음. git 정상 (6/24 NUL 손상 해소 — 본 세션 git 명령 전부 정상).
> 다음 = admin-toss v2.42 추가 시안 paste → 회신 zip 도착 시 박제 batch.

---

## ☐ 액션 1 — Claude.ai paste · admin-toss v2.42 통합 보강 시안 (2분)

대회 운영 관리자 화면(`/tournament-admin/tournaments/[id]` + 7 패널) 100% 정합용 추가 시안 의뢰.

- 의뢰서: `Dev/design/prompts/admin-toss-v242-integrated-design-request-2026-06-26.md`
- paste 본문: 의뢰서 §0 "첫 응답 형식" 위 본문 그대로 (HANDOFF / PARITY-MATRIX / CLEANUP-MANIFEST / TOURNAMENT-OPS-STATES + 7 preview.html 산출 요청)
- 참고 첨부: `BDR v2 (40).zip` 델타는 이미 수령됨 (공개 데이터 기준 = 44팀 / 27경기 / 4종별)

## ☐ 액션 2 — Claude.ai paste · B1 역박제 QA source-request (2분 · 병행 가능)

운영 src 최신 TournamentWorkspace 흐름을 BDR-current 에 역박제하기 위한 P0 source 갱신.

- delivery: `Dev/design/prompts/source-request-B1-workspace-delivery-2026-06-26.md` §paste 본문 그대로
- 첨부: `Dev/design/_zips/BDR-source-B1-tournament-workspace-2026-06-26.zip`
- ⚠️ PM 결정 = Toss 콘솔은 "리스킨 예정 부채(P1/P2)". 지금은 P0 역박제만, 콘솔 리스킨은 별도 batch 분리

## ☐ 액션 3 — GitHub PR 머지 (없음)

- dev == main 정합 (양방향 0 commit). 미push commit 0. 머지할 PR 없음.

---

## 상태

- admin-toss sweep: ✅ 운영 반영 완료 (최신 `847a1b5` align operate panels with toss flow)
- admin-toss v2.42 추가 시안: 의뢰서 작성 완료 / paste 대기 (액션 1)
- B1 역박제 QA: 패키지 완료 / paste 대기 (액션 2)
- STAGE E Home+Legal (6/24 carry): 의뢰서 `stage-e-home-legal-brief-2026-06-24.md` 작성됨 / 우선순위 admin 정합 뒤로 밀림
- STAGE F·G: E 이후

## 알림

- 🟢 **git 정상화** — 6/24 기록된 `.git/config`·HEAD·index NUL 손상이 본 세션 git 명령(log/rev-list/branch)에서 재현 안 됨. 일시적 마운트 sync 아티팩트였던 것으로 보임. 추가 조치 불필요.
- ℹ️ **방향 정합 확인 필요(사용자 결재)** — admin Toss 트랙이 두 갈래로 보임:
  ① v2.42 통합 의뢰 = admin Toss "공식 유지 + 100% parity 박제"
  ② B1 역박제 delivery = Toss는 "리스킨 예정 부채", BDR 13룰로 단계적 환원
  → 단기엔 양립(parity 먼저 정리 → 이후 BDR 리스킨)하나, 어느 쪽을 1순위로 둘지 사용자 한 줄 결재 권장.
- 새 디자인 zip 도착 없음 (uploads = SKILL.md 만 / _zips 최신 = 6/25 Cowork 자체 생성 B1 source).
