# Phase 3 — 공지전용 대회 날짜 기반 종료 정합 (백필 + 자동화) · CLI 프롬프트

> 목적: "우리 시스템 안 쓰고 공지만 올리는 대회"(매치 0건)는 경기 기반 자동종료가 영영 안 돈다. → **날짜 기반으로 status='completed' 정합.** 현재 47건 백필 + 앞으로 생길 것 자동 처리.
> ⚠️ 운영 DB UPDATE. CLAUDE.md §DB 가드 준수. **Phase 1·2 완료 후 진행.**

---

## 0. 분리 기준 (안전의 핵심)

**매치 수로 갈라서 처리한다:**

| 구분 | 종료 방법 | 이유 |
|---|---|---|
| 매치 > 0 (진짜 대회) | 경기 기반 `checkAndAutoCompleteTournament` (Phase 2) | end_date 가 틀려도 경기 안 끝났으면 종료하면 안 됨 |
| 매치 = 0 (공지전용 껍데기) | **날짜 기반** status='completed' (본 Phase) | 경기가 없으니 날짜 외 판정 근거 없음 |

→ 날짜 기반 종료를 **매치=0 으로 한정**하면 열혈(매치 있음)·진짜 리그(매치 있음)가 자동 제외 → 오작동 0. 우승팀(champion_team_id)은 **건드리지 않음**(껍데기는 결과 없음).

---

## 1. 대상 정의 (WHERE)

```
status NOT IN ('completed','ended','closed','cancelled')   -- 미종료
AND status NOT IN ('draft','upcoming')                      -- 접수 전 제외
AND COALESCE(end_date, start_date) < (KST 오늘 00:00)        -- 종료일 경과(당일 제외)
AND (해당 tournament 의 tournament_matches 수) = 0            -- 공지전용만
```

실측 기준 약 47건. **매치>0 인 미종료 경과 대회(예: 진짜 리그 누락분)는 본 대상 아님** → Phase 2 식 개별 처리 또는 "확인 필요" 리포트로 분리.

---

## 2. STEP 1 — 진단 (SELECT 전용, 승인 불요)

`scripts/_temp/phase3-diagnose.ts`:
- 위 WHERE 로 대상 목록 출력 (id/name/status/start~end/공개여부). 건수 합계.
- **별도 경고 리스트**: status 미종료 + 경과 + **매치>0** 인 대회(= 본 대상 아니지만 손봐야 할 수도) → 따로 출력해 수빈이 인지.
- 출력만. UPDATE 0.

---

## 3. STEP 2 — 일괄 백필 (승인 + 가드)

수빈 승인 후:
1. **사전 SELECT**: 대상 건수·샘플 5건 재확인 (사용자에게 표시).
2. **UPDATE**: 위 WHERE 에 정확히 매칭되는 행만 `status='completed'`.
   - Prisma `updateMany({ where, data:{ status:"completed" } })` — champion/mvp 손대지 않음.
   - **반드시 같은 WHERE 로 사전 count → update → 사후 count 일치 검증.**
3. **사후 검증**:
   - 대상 재SELECT → 0건(전부 completed로 이동) 확인.
   - 전체 status 분포 SELECT → completed 증가분 = 백필 건수 확인.
   - 표본 3건 `/tournaments` 화면 "종료" 표시 확인(Phase 1 적용 시 이미 종료였을 것 — raw 도 일치).

---

## 4. STEP 3 — 자동화 (선택, 권장)

앞으로 생길 공지전용/누락 대회를 주기적으로 정합. 두 방식 중 택:

**(a) Vercel Cron + 보호 라우트 (운영 표준, 권장)**
- `src/app/api/cron/auto-complete-tournaments/route.ts` 신설.
- §1 WHERE 로 `updateMany status='completed'` 실행 + 처리 건수 로깅.
- `CRON_SECRET` 헤더 검증(외부 호출 차단). `vercel.json` 에 cron 등록(예: 매일 03:00 KST).
- **매치=0 한정 룰 유지** — 진짜 대회는 절대 날짜로 강제종료 ❌.

**(b) 스케줄 작업(Cowork) 호출**
- 동일 라우트를 스케줄 작업이 매일 호출. (Vercel cron 미사용 시 대안)

→ 자동화는 **표시(Phase 1)로 이미 화면은 정상**이므로 "데이터 위생/awards·admin raw 일치"가 목적. 급하지 않으면 백필(STEP 2)만 하고 자동화는 후속.

---

## 5. 가드 / 금지

- `updateMany` WHERE 에 **매치=0 조건 누락 금지** (누락 시 진짜 대회까지 종료되는 사고).
- champion_team_id/mvp_player_id 변경 ❌ (껍데기는 결과 없음).
- DROP/TRUNCATE/무조건 대량 UPDATE ❌. 본 작업은 한정 WHERE updateMany 1회.
- `prisma migrate`/`db push` ❌ (자동화 라우트 추가는 코드만, schema 0).
- 작업 후 `scripts/_temp/` 정리.

---

## 6. 기록

- `.claude/scratchpad.md` 로그 1줄 + `knowledge/decisions.md`: "공지전용(매치0) 대회 = 날짜 기반 종료 / 진짜 대회 = 경기 기반 종료" 룰 박제.
- 자동화 라우트 추가 시 `knowledge/architecture.md` 갱신.

---

## 7. 한눈에

```
Phase 1 (코드)  : 화면 표시 — 모든 공개 화면 날짜 반영 (DB 0)        ← 먼저
Phase 2 (DB)   : 진짜 리그 3건 + 열혈 → completed + 우승팀(수동)
Phase 3 (DB)   : 공지전용 47건 날짜 백필 + (선택)cron 자동화         ← 본 문서
```
