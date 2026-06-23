# CLI 작업 큐 — 2026-06-22 갱신 (Cowork 자동 점검)

> **목적**: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: Cowork scheduled task (`mybdr-progress-monitor`)
> **이전 큐**: `_cli-queue-status-2026-06-21.md`
> **당일 요지**: 새 zip 0. **어제 dev→main 배포 완료**(main = d094525, 대회관리 Phase 4 첫 배치 운영 반영). **간밤 subin +8 신규** — 새 대회 생성폼 전면교체(미배포). subin 폐지 정책에도 작업 재차 subin 진행(과도기). phase-ledger 적체 지속.

---

## 0. ★ 당일 점검 (2026-06-22 09:00)

```
✅ dev → main 배포 완료 — 어제 주 액션 처리됨. main = d094525 = dev 2481c83 (정합)
   → Toss 대회관리 Phase 4 Track B 첫 배치(참가신청·입금자동확정·위저드·상세·기록자배정) 운영 반영
🔨 새 대회 생성폼 전면교체 — subin +8 commit (6/21 20:08~6/22 03:23), dev/main 미반영:
   478cf88 B-1 백엔드(schedule_dates 컬럼+POST 3필드) / 567d142 B-2~B-4 2컬럼 단일폼
   d9d94cd F-1 후원사로고·디비전일정 보존 / 08cae41 F-2a 상세 후원사로고 / 7b0935f F-2b 종별 날짜·코트
🟡 git : origin/main = d094525 = origin/dev 2481c83 (정합) / origin/subin = 2bd7e79 (+8 앞, 배포 대기)
✅ uploads / _zips : 새 zip 0 — BDR-v2.31-FULL(6/14) 마지막. 처리 완료.
⚠️ phase-ledger.md : 6/12(Phase 9C) 이후 미갱신 — 6/13~6/22 대량 진척 미기록. 적체 지속.
⚠️ 매칭 M6 : 6/20 'tester/reviewer 대기·미push' 이후 미언급 — 머지/잔여 상태 확인 필요.
⚠️ 브랜치 과도기 : subin 폐지 정책에도 간밤 작업 또 subin. 머지 후 dev 직접 전환 필요.

→ 다음 = (수빈) subin→dev→main 배포 / (CLI) ledger 정리·M6 확인·역박제 갭·과도기 종료. _next-actions-2026-06-22.md 참조.
```

---

## 1. 변경 사항 (06-21 → 06-22)

```
✅ dev → main 배포 완료 — 어제 +7(Toss 대회관리) 운영 반영. 현 main = d094525.
🔨 새 대회 생성폼 전면교체 = 신규 8 commit (subin) — Track B Phase 4 후속:
   · B-1 백엔드 schedule_dates 컬럼(NULL 허용 ADD COLUMN, 무중단) + POST 3필드 확장
   · B-2~B-4 2컬럼 단일폼 전면교체 / F-1 후원사 로고·디비전 일정 settings 보존
   · F-2a 대회상세 후원사 로고 / F-2b 종별 화면 디비전별 날짜·코트
⚠️ 간밤 작업이 또 subin 에서 진행 — 단독 운영 전환(subin 폐지·dev 직접) 미적용. 과도기 지속.
❓ 매칭 M6 = 직전 큐 'tester/reviewer 대기' → 오늘도 미언급. 상태 재확인 필요.
· 새 zip·다음 STAGE 결재 변화 0
```

---

## 2. 현재 CLI 큐

| # | 항목 | 상태 | 책임자 | 다음 액션 |
|---|------|-----|------|---------|
| 1 | **subin → dev → main 배포** | 🟡 +8 대기 | **수빈** | subin→dev→main PR 머지 → Vercel 운영 (생성폼 전면교체). DB schedule_dates 포함. ★ 오늘 주 액션 |
| 2 | **phase-ledger 갱신** | ⚠️ 적체 지속 | **CLI** | 6/13~6/22 진척(매칭 M1~M6·Toss Phase 2/3/4·생성폼) ledger 반영 |
| 3 | **매칭 M6 상태 확인** | ❓ 불명 | **CLI** | 6/20 미push 이후 머지/잔여 여부 1회 확인 |
| 4 | **브랜치 과도기 종료** | ⚠️ subin 잔존 | CLI→수빈 | subin→dev 머지 후 dev 직접 전환. subin 정리(선택) |
| 5 | **Phase 4 Track B 후속** | ⏳ 결재/배치 | 세션 B→수빈 | 사이드바 nav 링크(셸) / 잔여 admin 정합. scratchpad 🅱️ 참조 |
| 6 | BDR-current 역박제 갭 | ⏳ 확대 | CLI | Toss + 생성폼 src/ 직접 박제 → 시안(v2.31) 갭 검증 + 필요 시 역박제 |
| A | **일관성 QA 패스** | ⏳ delivery 작성됨 | **수빈** | brief+v2.31 zip drag-drop + paste (6일째 이월) — Toss·생성폼 전환분 별도 라운드 권장 |
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
+ Toss 리스킨 심판 Phase 3 (24화면)              : ✅ 종료 (운영 반영 #733)
+ Toss 리스킨 대회관리 Phase 4 Track B 첫배치    : ✅ 종료 (운영 반영 d094525) ★ 신규 배포
+ 새 대회 생성폼 전면교체 (8 commit)             : 🟡 subin (배포 대기) ★
STAGE E (Phase 13)    : ⏸ 결재 대기 (home full + legal ~3)
STAGE F (잔여 사용자) : ⏸ ~5 page
STAGE G (PA3/referee) : ⏸ 별 결재 (referee = Flutter / 원영 이탈 담당 공백)
+ 일관성 QA 패스       : ⏳ Claude.ai paste 대기 (6일째)
```

---

## 4. 권장 실행 순서 (오늘)

```
1. (수빈) subin → dev → main 배포 — 새 대회 생성폼 전면교체(+8) 운영 반영 → Vercel 빌드·생성폼 1회 확인 ★
2. (CLI 세션) phase-ledger 갱신   — 6/13~6/22 적체 일괄 정리(매칭 M1~M6·Toss·생성폼)
3. (CLI 세션) 매칭 M6 상태 확인   — 머지/잔여 1회 점검
4. (CLI 세션) 브랜치 과도기 종료  — subin→dev 머지 후 dev 직접 전환
5. (CLI 세션) BDR-current 역박제 갭 — Toss + 생성폼 전환분 시안 갭 검증
6. (수빈) 일관성 QA / STAGE E 결재(선택) — Toss·생성폼 전환분 포함 신규 QA 라운드 권장
```
