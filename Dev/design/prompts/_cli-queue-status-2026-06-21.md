# CLI 작업 큐 — 2026-06-21 갱신 (Cowork 자동 점검)

> **목적**: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: Cowork scheduled task (`mybdr-progress-monitor`)
> **이전 큐**: `_cli-queue-status-2026-06-20.md`
> **당일 요지**: 새 zip 0. **Toss 리스킨 대약진** — 관리자 Phase 2(17화면)·심판 Phase 3(24화면 운영반영 #733)·대회관리 Phase 4 Track B(dev +7 배포대기). 단독 운영 전환(subin 폐지). phase-ledger 적체 심화.

---

## 0. ★ 당일 점검 (2026-06-21 09:00)

```
✅ Phase 2 관리자 Toss — 2A(788800a)·2B(041e00a)·2C(7d433c0) → #728 dev
✅ Track B admin_categories 테이블+4종시드(367c1d8) + 종별 마스터 관리화면(50053a2)
✅ Phase 3 심판 Toss 24화면 — 3A(4f9a405)·3B(370c3dd)·3C(88c7648) → #732→dev·#733→main(53e3397) ★ 운영반영
✅ 브랜치 정책 단독 운영 전환 docs(1dd6e36) — subin 폐지·dev 직접·dev→main 권한 수빈 단독
🔨 Phase 4 Track B 대회관리 — 참가신청(83d697c)·입금자동확정(d8ea07f)·위저드(2f4e0f9)·대회상세(5e2b358)·기록자배정(3955d2e) → #734 dev (main 미반영)
🟡 git : origin/subin = origin/dev = 25d4818 (정합) / origin/main = 53e3397 (+7 뒤, 운영 배포 대기)
✅ uploads / _zips : 새 zip 0 — BDR-v2.31-FULL(6/14) 마지막. 처리 완료.
⚠️ phase-ledger.md : 6/12(Phase 9C) 이후 미갱신 — 6/13~6/21 대량 진척(매칭 M1~M6·Toss Phase 2/3/4) 미기록. 적체 심화.
⚠️ 매칭 M6 : 6/20 'tester/reviewer 대기·미push'. 오늘 작업이 Toss 리스킨으로 전환되어 M6 미언급 — 머지/잔여 상태 확인 필요.

→ 다음 = (수빈) dev→main 배포 / (CLI) ledger 정리·M6 확인·Phase4 후속·역박제 갭. _next-actions-2026-06-21.md 참조.
```

---

## 1. 변경 사항 (06-20 → 06-21)

```
✅ Toss 리스킨 = 신규 대량 진행분 — 2세션 동시 작업(A=심판 / B=대회관리), 새벽 02:51~05:33
   · 관리자 Phase 2 (17화면) → #728 dev
   · 심판 Phase 3 (24화면) → #733 main 운영반영 ★
   · 대회관리 Phase 4 Track B (7 commit) → #734 dev (배포대기)
✅ admin_categories schema (367c1d8) — Track B 게이트 테이블+4종시드
✅ 브랜치 단독 운영 전환 (subin 폐지·dev 직접)
🟡 dev→main = +7 (Toss 대회관리) 운영 배포 대기. (직전 +15 매칭/보안분은 이미 배포된 것으로 추정 — 현 main = 6/21 #733)
❓ 매칭 M6 = 직전 큐 'tester/reviewer 대기' → 오늘 미언급. 상태 재확인 필요.
· 새 zip·다음 STAGE 결재 변화 0
```

---

## 2. 현재 CLI 큐

| # | 항목 | 상태 | 책임자 | 다음 액션 |
|---|------|-----|------|---------|
| 1 | **dev → main 배포** | 🟡 +7 대기 | **수빈** | dev→main PR 머지 → Vercel 운영 (Toss 대회관리 Phase 4). ★ 오늘 주 액션 |
| 2 | **phase-ledger 갱신** | ⚠️ 적체 심화 | **CLI** | 6/13~6/21 진척(매칭 M1~M6·Toss Phase 2/3/4) ledger 반영 |
| 3 | **매칭 M6 상태 확인** | ❓ 불명 | **CLI** | 6/20 미push 이후 머지/잔여 여부 1회 확인 |
| 4 | **Phase 4 Track B 후속** | ⏳ 결재/배치 | 세션 B→수빈 | 사이드바 nav 링크(셸) / 잔여 admin 정합. scratchpad 🅱️ 참조 |
| 5 | BDR-current 역박제 갭 | ⏳ 확대 | CLI | Toss 리스킨 src/ 직접 박제 → 시안(v2.31) 갭 검증 + 필요 시 역박제 |
| A | **일관성 QA 패스** | ⏳ delivery 작성됨 | **수빈** | brief+v2.31 zip drag-drop + paste (5일째 이월) — 단 Toss 전환분 별도 라운드 권장 |
| B | 일관성 QA 픽스 batch | ⏸ QA 회신 zip 후 | Cowork→CLI | 회신 체크리스트 축별 분할 박제 |
| C | STAGE E (Phase 13 home+legal) | ⏸ 결재 대기 | 수빈→Cowork | 옵션 A(법적 먼저·권장) / B(통합) 결재 1줄 |
| D | STAGE F (잔여 사용자 5) | ⏸ 선택 | 수빈→Cowork | games/edit·report / my-games / guest-apps / profile-complete |
| G | housekeeping — `BDR v2.33/` 폴더 | ⏳ 선택 | CLI | 단일 폴더 룰 위반 → `_archive/` 이동 |
| H | (선택) PA3 재설계 | ⏸ 보류 (STAGE G) | 수빈 | 옵션 A/B/C 결재 |

---

## 3. Phase 점수판 (STAGE 기준)

```
STAGE A (정합·회귀)   : ✅ 종료
STAGE B (Phase 10)    : ✅ 종료
STAGE C (Phase 11)    : ✅ 종료 (v2.31 FULL)
STAGE D (Phase 12)    : ✅ 종료 (super-admin + Admin Console S2)
+ 라인업 / mock→real / court / awards / 기록실 6건 : ✅ 종료
+ 매칭 고도화 M1~M5 (#717~#721)                  : ✅ 종료 (운영 반영)
+ 매칭 고도화 M6 (호스트 콘솔)                    : ❓ 상태 불명 (CLI 확인)
+ Toss 리스킨 관리자 Phase 2 (17화면)            : ✅ dev (#728)
+ Toss 리스킨 심판 Phase 3 (24화면)              : ✅ 종료 (운영 반영 #733) ★
+ Toss 리스킨 대회관리 Phase 4 Track B (7 commit): 🟡 dev (배포 대기) ★
STAGE E (Phase 13)    : ⏸ 결재 대기 (home full + legal ~3)
STAGE F (잔여 사용자) : ⏸ ~5 page
STAGE G (PA3/referee) : ⏸ 별 결재 (referee = Flutter / 원영 이탈 담당 공백)
+ 일관성 QA 패스       : ⏳ Claude.ai paste 대기 (5일째)
```

---

## 4. 권장 실행 순서 (오늘)

```
1. (수빈) dev → main 배포       — Toss 대회관리 Phase 4 (+7) 운영 반영 → Vercel 빌드 1회 확인 ★
2. (CLI 세션) phase-ledger 갱신 — 6/13~6/21 적체 일괄 정리(매칭 M1~M6·Toss Phase 2/3/4)
3. (CLI 세션) 매칭 M6 상태 확인 — 머지/잔여 1회 점검
4. (CLI 세션) Phase 4 후속 배치 — 사이드바 nav / 잔여 admin 정합(scratchpad 🅱️)
5. (CLI 세션) BDR-current 역박제 갭 — Toss 전환분 시안 갭 검증
6. (수빈) 일관성 QA / STAGE E 결재(선택) — Toss 전환분 포함 신규 QA 라운드 권장
```
