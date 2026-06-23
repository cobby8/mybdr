# 오늘의 액션 (2026-06-16)

> Cowork 자동 루프 (`mybdr-progress-monitor`) — 매일 09:00.
> **요지**: 새 zip 0. 박제 frontier 변화 0. **유일한 신규 = 오늘 새벽 로컬 커밋 1건**(`502fe53` 대회 진행중 종료 오표시 fix) 이 subin 에 미push 상태 → push + PR 필요. 나머지(일관성 QA paste / STAGE E·F 결재)는 6/15 그대로 이월.
> 직전: `_next-actions-2026-06-15.md` / 큐: `_cli-queue-status-2026-06-16.md`

---

## ☑ 어제 → 오늘 변화 (6/15 → 6/16)

```
· 🆕 로컬 커밋 1건 발생 (subin, 미push):
    502fe53  fix(tournament): effectiveStatus in_progress 보정 제외 — 진행중 대회 종료 오표시 수정
    · 작성 2026-06-16 03:14 / src/lib/constants/tournament-status.ts + test 1 (총 +16 -4)
    · 메모리 [대회 상태 오표시 전수조사] 후속 — 진행중 대회가 종료로 오표시되던 표시레이어 보정
    · origin/subin..subin = 1 (push 안 됨) / origin main=dev=subin 은 583225a 에서 정합
· 새 zip 도착 0 (uploads = SKILL.md 만 / _zips 최신 = BDR-v2.31-FULL 6/14, 처리 완료)
· 박제 frontier 변화 0 — Phase 1~12 + 라인업 + mock→real + P1-a/b + Admin S2 머지 상태 유지
· 일관성 QA = 아직 paste 안 됨(회신 zip 0) → 6/15 액션 그대로 이월
```

---

## ☐ 액션 1 — git push + PR 3분 ★ 오늘의 신규 주 액션

오늘 새벽 커밋(`502fe53`)이 로컬 subin 에만 있고 origin 에 안 올라감. 운영 반영하려면:

```bash
git checkout subin
git push origin subin
# GitHub: subin → dev PR 생성·머지
# GitHub: dev → main PR 생성·머지 (운영 배포)
```

> 소규모 안전 변경(대회 상태 표시 보정 / 테스트 포함 / 스키마·api/v1 0). 운영 대회 목록의 "진행중→종료 오표시" 수정이라 빨리 반영 권장.
> ⚠️ Cowork 자동 루프는 안전 가드상 push/merge 직접 ❌ — 수빈 수동 액션입니다.

---

## ☐ 액션 2 — Claude.ai paste (2분 · 6/15 이월) 일관성 QA

박제본 전반 디자인 정합 점검 = **일관성 QA 패스** (아직 미발송):

- 첨부 2건: `design-consistency-qa-brief-2026-06-14.md` + `BDR-v2.31-FULL-phase11-12-2026-06-14.zip`
- paste 본문: `design-consistency-qa-delivery-2026-06-15.md` §paste 본문 단일 블록 그대로 복사

> 신규 화면 박제 ❌ — 기존 박제본 정규화 + CLI 픽스 체크리스트 산출.
> 회신 zip 도착 시 Cowork 가 sync + 픽스 batch 자동 연결.

---

## ☐ 액션 3 — STAGE E/F 진입 결재 1줄 (선택 · 6/15 이월)

Phase 11/12 머지 완료 → 다음 STAGE 결재:

- **STAGE E (Phase 13)** = 홈(`/`) full 재박제 + 법적(`/privacy` `/terms`) — ~3 page
  - ⚠️ 홈 full = 가장 복잡/위험(SEO·LCP·다수 섹션). 단독 batch 권장.
  - 옵션 A: 법적 2 page 먼저(저위험) → 홈 별도 session  ← 권장
  - 옵션 B: 홈+법적 1 패키지 통합
- **STAGE F** = 잔여 사용자 측(`/games/edit` `/games/report` `/my-games` `/guest-apps` `/profile/complete`) 작은 묶음
- → 한 줄 결재 주시면 Cowork 가 다음 루프에서 connectivity plan + redesign prompt + delivery + zip 자동 작성.

> 결재 없으면 default = STAGE 순서(E 먼저 · 옵션 A 권장).

---

## 상태

```
박제+머지 완료 : Phase 1~12 + 회귀 v2 + RECORDER-AUDIT + 라인업(LC1) + mock→real + P1-a/b + Admin S2 — STAGE A~D 종료 ✅
신규 미push    : 502fe53 (대회 상태 표시 fix) — subin 로컬만 / push+PR 대기
다음 Claude.ai : 일관성 QA 패스 (delivery 작성됨 · paste 대기)
다음 STAGE     : E(Phase 13 home+legal ~3) → F(잔여 사용자 5) → G(PA3/referee 별 결재)
git : origin main = dev = subin 정합(583225a) / 로컬 subin 만 +1 미push
BDR-current : v2.31 FULL (Phase 11/12) + ②③ 역박제 보존
```

## 알림

- 🆕 **미push 커밋 1건** — `502fe53` 운영 미반영. 액션 1로 push+머지 권장(저위험).
- ⚠️ **phase-ledger.md 갱신 적체** — 마지막 기록 6/12(Phase 9C). 6/13 Phase 10 / 6/14 v2.31·라인업·mock→real·P1-a/b·Admin S2 / 6/16 502fe53 미반영. 다음 CLI 세션에서 ledger 갱신 권장 (Cowork 자동 루프는 안전 가드상 ledger 직접 수정 ❌ — 점검·보고만).
- ℹ️ **STAGE 점수판** — A~D 종료. 남은 = E(home+legal) / F(사용자 잔여 5) / G(PA3·referee). 박제 ~90%+ 추정.
- ℹ️ Flutter `/api/v1` 영역 = 원영 이탈로 담당 공백 (referee 시스템 STAGE G). 진입 전 사용자 결재 필요.
- ℹ️ PA3 재설계 = 보류 유지 (STAGE G).
