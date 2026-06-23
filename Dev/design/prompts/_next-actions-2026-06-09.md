# 오늘의 액션 (2026-06-09)

> Cowork 자동 루프 (`mybdr-progress-monitor`) 생성 — 매일 09:00.
> **요지**: 어젯밤 변화 0. 어제 준비된 액션 2건이 **아직 미실행** → 오늘 그대로 진행하면 됨.
> 직전 액션 문서: (없음 — 본 파일이 첫 `_next-actions`) / 큐: `_cli-queue-status-2026-06-09.md`

---

## ☐ 액션 1 — CLI 한 줄 (5분) ★ 다음 액션

Phase 9 v2.29 sync 실행. 의뢰서는 어제(06-08) 작성 완료, 실행만 남음.

```
Read Dev/design/prompts/phase-9-v2.29-sync-cli-prompt-2026-06-08.md 하고 §2 사전 점검 + 옵션 결재(A)부터 시작해줘. 모든 결재 default 자동 적용.
```

→ DryRun → 실행 → 회귀 17 케이스 → phase-ledger Phase 9 ⑩ ✅ → commit/push
→ BDR-current = v2.29 (notify-shared 신규 / root 104 / screens 84)
→ sync 완료 후 Cowork 가 Phase 9C 운영 박제 batch 의뢰서(4 PR) 자동 작성.

---

## ☐ 액션 2 — Claude.ai paste (2분) · 회귀 P0 (병렬 가능)

종료 대회 상세 재박제 v2. 액션 1과 독립 — 동시에 진행해도 됨.

**첨부 (drag-drop 1건)**:
- `C:\0. Programing\mybdr\Dev\design\prompts\completed-tournament-detail-v2-prompt-2026-06-08.md`

**paste 본문**:

```
종료 대회 상세 화면 재박제 v2 의뢰입니다 (회귀 P0).

[배경]
- v1(후보 A) 박제됨 → 사용자 추가 피드백 반영 v2
- 현행 = 결산 5카드 + 작은 "대회 기록" 박스(일정/대진표/참가팀 3탭) → 폐기

[핵심 변경]
- 종료 대회 = 진행 중 대회와 동일 5탭 구조 / 첫 탭만 교체
  · 탭1: 대회결과(신규 — 결산 5카드 통합: 최종순위 + MVP·베스트5 + 갤러리 + 알기자 + 다음회차)
  · 탭2~5: 경기일정·대진표·참가팀·규정 = 진행 중 UX 그대로 carry(풍부한 카드 + sidebar)
- 첨부 의뢰서 = completed-tournament-detail-v2-prompt-2026-06-08.md (§2 변경 / §8 산출물)

[보존]
- AppNav frozen / 데이터 패칭 0 변경 / 신규 라우트 ❌(status 분기)
- TournamentDetail.jsx 탭·패널 100% 재사용(중복 박제 ❌)
- 사용자 결정 §1~§8 보존 / 13 룰 준수 / 06 자체 검수

산출 = BDR-current/screens/TournamentCompleted.jsx 재박제 → zip 회신.
시작해 주세요.
```

→ zip 회신 도착하면 Cowork 에 "종료대회 v2 zip 도착" 한 줄 → 자동 sync + 운영 박제 1 PR.

---

## ☐ 액션 3 — GitHub PR 머지 (3분) · **오늘 없음**

대기 PR 0 건. Phase 9C / 회귀 v2 박제가 아직 안 돼서 머지할 PR 없음.
→ 액션 1(sync) → Phase 9C batch(4 PR) 생성되면 그때 subin→dev→main 머지.

---

## 상태

```
박제+머지 완료 : Phase 1~8 (77 시안 / web+admin)
진행 중       : Phase 9 (알림·메시지·검색) — 박제 ✅ v2.29 / sync ⏸ 실행 대기 / 운영 박제 ❌
회귀 P0       : 종료 대회 v2 — 의뢰서 ✅ / Claude.ai 전달 ⏸
다음 큐       : Phase 10 (정보 페이지 5) — 패키지 ✅ / Phase 9C 후 paste

git : subin = dev (72a2ed6 #663) / main (#664) — 정합 / 미push 0 (.claude 워킹트리 noise만)
BDR-current : v2.28 (Phase 8) — Phase 9 sync 실행 시 v2.29
```

## 알림

- ⏳ **어제(06-08) 준비분 미실행** — Phase 9 sync(액션 1) + 회귀 v2 paste(액션 2) 둘 다 아직. 두 건 독립이라 동시 진행 가능.
- 🆕 새 zip 도착 0 (최신 = v2.29, 06-08 처리 완료).
- ℹ️ mobile OAuth `/api/v1/auth/kakao·google`(#663/#664) = Flutter 영역 → 원영 사후 공지 대상(미처리 시).
