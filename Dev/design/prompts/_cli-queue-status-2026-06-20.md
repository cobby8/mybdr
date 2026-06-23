# CLI 작업 큐 — 2026-06-20 갱신 (Cowork 자동 점검)

> **목적**: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: Cowork scheduled task (`mybdr-progress-monitor`)
> **이전 큐**: `_cli-queue-status-2026-06-19.md`
> **당일 요지**: 새 zip 0. **매칭 고도화 M1~M5 dev 머지 완료** + 보안 fix 흡수. **M6(호스트 콘솔) CLI 세션 진행 중**(tester/reviewer 대기, 미push). **dev +15 → 운영 배포 대기.**

---

## 0. ★ 당일 점검 (2026-06-20 09:00)

```
✅ 매칭 M1~M5 dev 머지 완료 — #717 M1 / #718 M2 / #719 M3 / #720 M4 / #721 M5
   + 디자인 sync v2.36(카드 콤팩트)·v2.37(시안E 호스트 콘솔) dev 반영
✅ 보안 fix b34aa84 (라이브 API 가드) → dev 흡수 (6/19 액션 1 완료) — 단 운영(main) 미반영
✅ 2b49b26 앱용 비밀번호 재설정 v1 라우트 + 앱 버전 매니페스트 + Resend (dev)
🔨 매칭 M6 (최종·호스트 콘솔) — developer 완료 → tester/reviewer 대기 / 미commit·미push
   범위: ①데드 status맵 폐기→game-status.ts ②GameDetail HostApplicationsPanel 3구획 ③MyGames waiting 탭+호스트 카드. schema 0 / 신규 route 0.
🟡 git : origin/subin = origin/dev = 4c770bd (정합) / origin/main +15 뒤 (운영 배포 대기)
✅ uploads / _zips : 새 zip 0 — BDR-v2.31-FULL(6/14) 마지막. 처리 완료.
⚠️ phase-ledger.md : 6/12(Phase 9C) 이후 미갱신 — 6/13~6/19 진척(매칭 M1~M6 포함) 미기록.
ℹ️ 의뢰서 : 일관성 QA delivery 작성됨 — Claude.ai paste 4일째 대기

→ 다음 = (CLI) M6 마무리·push / (수빈) dev→main 배포 / 일관성 QA paste. _next-actions-2026-06-20.md 참조.
```

---

## 1. 변경 사항 (06-19 → 06-20)

```
✅ 매칭 M1~M5 = 06-19 박제+dev 머지 완료 (#717~#721) — 직전 큐 'CLI 박제 큐 비어있음' → 매칭 5단계 처리됨
✅ b34aa84 (보안) = dev 흡수 (직전 큐 '미머지' → 해소, 단 main 미반영)
🔨 M6 = 신규 진행분 — CLI 세션 tester/reviewer
🟡 dev→main = 신규 운영 배포 대기 (+15)
· 새 zip·BDR-current 시안·다음 STAGE 결재 변화 0 (6/19 상태 유지)
```

---

## 2. 현재 CLI 큐

| # | 항목 | 상태 | 책임자 | 다음 액션 |
|---|------|-----|------|---------|
| 0 | **매칭 M6 마무리** | 🔨 tester/reviewer | **CLI 세션** | scratchpad 이어 검증→commit→subin push→subin→dev PR ★ 오늘 주 액션 |
| 1 | **dev → main 배포** | 🟡 +15 대기 | **수빈** | (M6 dev 머지 후) dev→main PR 머지 → Vercel 운영. 보안 fix 포함 ★ |
| A | **일관성 QA 패스** | ⏳ delivery 작성됨 | **수빈** | brief+v2.31 zip drag-drop + paste (4일째 이월) |
| B | 일관성 QA 픽스 batch | ⏸ QA 회신 zip 후 | Cowork→CLI | 회신 체크리스트 축별 분할 박제 |
| C | STAGE E (Phase 13 home+legal) | ⏸ 결재 대기 | 수빈→Cowork | 옵션 A(법적 먼저·권장) / B(통합) 결재 1줄 |
| D | STAGE F (잔여 사용자 5) | ⏸ 선택 | 수빈→Cowork | games/edit·report / my-games / guest-apps / profile-complete |
| E | BDR-current 역박제 갭 검증 | ⏳ 검토 | CLI | 기록실(Records) 화면 v2.31 미반영 여부 + 필요 시 역박제 |
| F | phase-ledger 갱신 | ⏳ 적체 | CLI | 6/13~6/19 진척(매칭 M1~M6 포함) ledger 반영 |
| G | housekeeping — `BDR v2.33/` 폴더 | ⏳ 선택 | CLI | 단일 폴더 룰 위반 → `_archive/` 이동 |
| H | (선택) PA3 재설계 | ⏸ 보류 (STAGE G) | 수빈 | 옵션 A/B/C 결재 |

---

## 3. Phase 점수판 (STAGE 기준)

```
STAGE A (정합·회귀)   : ✅ 종료
STAGE B (Phase 10)    : ✅ 종료
STAGE C (Phase 11)    : ✅ 종료 (v2.31 FULL)
STAGE D (Phase 12)    : ✅ 종료 (super-admin + Admin Console S2)
+ 라인업 / mock→real / P1-a court / P1-b awards : ✅ 종료
+ 기록실(Records) 확장 6건 (#705~#716)          : ✅ 종료 (6/16 main)
+ 보안 fix b34aa84 + 비밀번호 재설정 라우트       : ✅ dev (운영 미반영)
+ 매칭 고도화 M1~M5 (#717~#721)                  : ✅ dev 머지 ★ 신규
+ 매칭 고도화 M6 (호스트 콘솔)                    : 🔨 tester/reviewer (미push)
STAGE E (Phase 13)    : ⏸ 결재 대기 (home full + legal ~3)
STAGE F (잔여 사용자) : ⏸ ~5 page
STAGE G (PA3/referee) : ⏸ 별 결재 (referee = Flutter / 원영 이탈 담당 공백)
+ 일관성 QA 패스       : ⏳ Claude.ai paste 대기
```

---

## 4. 권장 실행 순서 (오늘)

```
1. (CLI 세션) M6 마무리       — tester+reviewer 통과 → commit → subin push → subin→dev PR ★
2. (수빈) dev → main 배포      — M6 dev 머지 후 1회 배포(매칭 M1~M6 + 보안 fix). 
                                 M6 지연 시 보안 우선으로 지금 +15 먼저 배포도 합리적.
3. (수빈) 일관성 QA paste      — brief + v2.31 FULL zip drag-drop + delivery §paste 본문
4. (수빈) STAGE E 결재 1줄(선택) — 옵션 A(법적 먼저) 권장
   → 결재 시 Cowork 가 다음 09:00 루프에서 STAGE 의뢰 패키지 자동 작성
5. (CLI 세션) 적체 정리        — phase-ledger 갱신(매칭 M1~M6 포함) / BDR-current 역박제 갭 / BDR v2.33 폴더
```
