# 오늘의 액션 (2026-06-22)

> Cowork 자동 루프 (`mybdr-progress-monitor`) — 09:00.
> **요지**: 새 zip 0. **어제 dev→main 배포 완료** (main = d094525, Toss 대회관리 Phase 4 Track B 첫 배치 운영 반영). **간밤(6/21 20:08~6/22 03:23) subin 에 8 commit 신규** — 새 대회 생성폼 전면교체(B-1~F-2). dev/main 미반영. ⚠️ subin 폐지 정책에도 작업이 다시 subin 에서 진행됨(과도기 지속).
> 직전: `_next-actions-2026-06-21.md` / 큐: `_cli-queue-status-2026-06-22.md`

---

## ☑ 6/21 → 6/22 변화

```
✅ dev → main 배포 완료 — 어제 주 액션(액션 1) 처리됨. main = d094525 = dev 2481c83 (정합·0 diff)
   → Toss 리스킨 대회관리 Phase 4 Track B(참가신청 3단계·입금 자동확정·위저드·대회상세·기록자배정) 운영 반영
🔨 새 대회 생성폼 전면교체 (Track B Phase 4 후속 8 commit, subin 에만 — dev/main 미반영):
    e0305a1 Phase4 구현결정 docs / 478cf88 B-1 백엔드(schedule_dates 컬럼 + POST 3필드)
    567d142 B-2~B-4 2컬럼 단일폼 전면교체 / d9d94cd F-1 후원사 로고·디비전 일정 settings 보존
    08cae41 F-2a 대회상세 후원사 로고 / 7b0935f F-2b 종별 화면 디비전별 날짜/코트
    ba61c07·2bd7e79 회고 박제(snake 함정 7회차)
· git : origin/main = d094525 = origin/dev 2481c83 (정합) / origin/subin = 2bd7e79 (+8 앞) / 로컬 미push 0
· 새 zip 도착 0 (uploads = SKILL.md 만 / _zips 최신 = BDR-v2.31-FULL 6/14, 처리 완료)
```

---

## ☐ 액션 1 — subin → dev → main 배포 (생성폼 운영 반영)  ★ 오늘의 주 액션

subin 이 dev 보다 **8 commit** 앞섬 = **새 대회 생성폼 전면교체**(2컬럼 단일폼 + 후원사 로고 + 디비전별 일정/코트). 운영 미배포.

```bash
# GitHub: subin → dev PR 머지 → dev → main PR 머지 → Vercel 운영 배포
```

> ⚠️ **DB schema 변경 포함** — B-1(478cf88)이 `schedule_dates` 컬럼 추가(NULL 허용 ADD COLUMN, 무중단). 단일 DB 정책상 db push 시점에 이미 운영 DB 적용됨 — 머지는 코드만 반영. 배포 후 생성폼 1회 동작 확인 권장.
> ⚠️ dev→main 머지 권한 = 수빈 단독. Cowork 자동 루프 ❌.
> ℹ️ **브랜치 과도기** — 정책은 subin 폐지·dev 직접인데 간밤 작업이 또 subin 에서 진행됨. 이번 머지 후엔 dev 직접 작업으로 전환 권장(CLI 세션에 명시).

---

## ☐ 액션 2 — Claude.ai paste (2분 · 일관성 QA) 6일째 이월

박제본 전반 디자인 정합 점검 = **일관성 QA 패스** (계속 미발송):

- 첨부 2건: `design-consistency-qa-brief-2026-06-14.md` + `BDR-v2.31-FULL-phase11-12-2026-06-14.zip`
- paste 본문: `design-consistency-qa-delivery-2026-06-15.md` §paste 본문 단일 블록 그대로

> 💡 Toss 리스킨(관리자·심판·대회관리) + 생성폼 전면교체로 박제 범위가 크게 늘어 정합 점검 가치 상승.
> ⚠️ 단 QA brief/zip 은 v2.31(Toss 리스킨 이전) 기준 — Toss·생성폼 전환분은 별도 QA 라운드 권장. CLI 세션이 BDR-current 역박제 갭부터 정리 후 신규 QA brief 작성이 더 정확(액션 3 참조).

---

## ☐ 액션 3 — (CLI 세션) 적체 정리 + 다음 배치  · 결재/한 줄

```
1. phase-ledger.md 갱신 — 마지막 기록 6/12(Phase 9C)에서 적체 심화. 6/13~6/22 진척
   (Phase 10·v2.31·라인업·mock→real·기록실 6건·매칭 M1~M6·Toss Phase 2/3/4·생성폼 전면교체) 일괄 반영.
2. 매칭 M6(호스트 콘솔) 최종 상태 확인 — 6/20 'tester/reviewer 대기·미push' 이후 scratchpad 미등장.
   머지/잔여 여부 1회 확인.
3. 브랜치 과도기 종료 — subin → dev 머지 후 다음 작업부터 dev 직접 적용. subin 정리(선택).
4. BDR-current 역박제 갭(확대) — Toss 리스킨 + 생성폼 전면교체 모두 src/ 직접 작업.
   BDR-current(v2.31) 시안과 갭 큼. 갭 검증 + 필요 시 역박제.
5. Phase 4 Track B 다음 배치 결재 — 사이드바 nav 링크(셸) / 잔여 admin 정합 (scratchpad 🅱️ 참조).
6. housekeeping — `Dev/design/BDR v2.33/` 최상위 잔존(단일 폴더 룰) → `_archive/` 이동(선택).
```

> ⚠️ Cowork 자동 루프는 commit/push/merge·src/·BDR-current·phase-ledger 직접 수정 ❌ — CLI 세션 또는 수빈 수동.

---

## 상태

```
박제 완료(운영 main): Phase 1~12 + 회귀 v2 + RECORDER-AUDIT + 라인업 + mock→real + 기록실(6건)
                     + 매칭 M1~M5 + 보안 fix + 비밀번호 재설정
                     + Toss 리스킨: 관리자 Phase 2(17) + 심판 Phase 3(24) + 대회관리 Phase 4 Track B 첫배치 ★ 신규 배포
운영 배포 대기(subin): 새 대회 생성폼 전면교체 = subin → dev/main +8 commit ★
상태 불명           : 매칭 M6(호스트 콘솔) — 6/20 미push, 이후 scratchpad 미등장 → CLI 확인 필요
다음 Claude.ai      : 일관성 QA 패스 (Toss·생성폼 전환분 포함 신규 라운드 권장)
다음 STAGE          : E(Phase 13 home+legal) → F(잔여 사용자 5) → G(PA3/referee 별 결재)
git : origin/main = d094525 = origin/dev 2481c83 (정합) / origin/subin = 2bd7e79 (+8 앞) / 로컬 미push 0
브랜치 정책 : 단독 운영(subin 폐지·dev 직접)이나 간밤 작업이 또 subin 사용 — 과도기 지속.
```

## 알림

- 🆕 **운영 배포 대기** — subin +8 (새 대회 생성폼 전면교체). 액션 1 = 오늘 주 액션. DB `schedule_dates` 컬럼 추가 포함(무중단).
- ✅ **어제 액션 1(dev→main 배포) 완료** — Toss 대회관리 Phase 4 Track B 첫 배치 운영 반영(main = d094525).
- ⚠️ **phase-ledger.md 적체 심화** — 마지막 기록 6/12(Phase 9C). 6/13~6/22 대량 진척 미반영. 다음 CLI 세션 정리 권장. (Cowork 자동 루프 ledger 직접 수정 ❌ — 점검·보고만)
- ⚠️ **브랜치 과도기 지속** — subin 폐지 정책에도 간밤 8 commit 이 subin 에서 진행. 이번 머지 후 dev 직접 전환 권장.
- ⚠️ **매칭 M6 상태 불명** — 6/20 미push 이후 미언급. 머지/잔여 여부 CLI 확인 필요.
- ⚠️ **BDR-current 역박제 갭(확대)** — Toss + 생성폼 전면교체 모두 src/ 직접 박제 → 시안(v2.31)과 갭 큼. CLI 갭 검증 권장. (Cowork 자동 루프 BDR-current 직접 수정 ❌)
- ℹ️ Flutter `/api/v1` = 원영 이탈 담당 공백. PA3 보류 유지(STAGE G).
- ℹ️ housekeeping — `Dev/design/BDR v2.33/` 최상위 잔존(단일 폴더 룰) → `_archive/` 이동 권장(선택).
