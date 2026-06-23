# 오늘의 액션 (2026-06-19)

> Cowork 자동 루프 (`mybdr-progress-monitor`) — 09:00.
> **요지**: 새 zip 0. **6/16 이후 루프 공백**(6/17·6/18 자동 산출 없음) — 이번이 재개. 그 사이 **기록실(Records) 대확장 6건 main 머지 완료** + **신규 보안 fix 1건(`b34aa84`)이 origin/subin 에 미머지** → subin→dev→main 머지 필요.
> 직전: `_next-actions-2026-06-16.md` / 큐: `_cli-queue-status-2026-06-19.md`

---

## ☑ 6/16 → 6/19 변화

```
· ✅ 기록실(Records) 영역 대확장 — 전부 main 머지 완료 (6/16):
    #705/#707  대회 기록실 MVP — 선수/팀/경기 탭 + 공식가드 집계 API
    #709       선수·팀 기록 화면 — /users·/teams 기록 탭
    #711/#712  갭①② — 팀 핵심식별정보 변경 시 재검수 재세팅 + 프로필 대회 종료일 표시 보정
    #713/#714  출전시간 PBP 재계산(minutes-engine 공용) + 평균/누적 토글
    #715/#716  비공개 대회 데이터 API 노출 차단 (insider 외 가드)
    · 6/16 아침 보고의 502fe53(대회 상태 표시 fix)도 이 흐름에 흡수·머지됨 → 운영 반영 완료
· 🆕 신규 보안 fix 1건 (origin/subin, 미머지):
    b34aa84  fix(security): 라이브 API 비공개 대회 가드 (api/live·brief 결과 유출 차단)  — 2026-06-18 14:55
    · src/app/api/live/[id]/brief/route.ts + [id]/route.ts + route.ts (+36 -2) / 스키마·api/v1 0
    · origin/dev..origin/subin = 1 (미머지) / 운영 미반영
· 새 zip 도착 0 (uploads = SKILL.md 만 / _zips 최신 = BDR-v2.31-FULL 6/14, 처리 완료)
· ⚠️ 6/17·6/18 자동 루프 산출 0 — 프롬프트 파일 6/16 이 마지막. 이번 루프가 재개.
```

---

## ☐ 액션 1 — git 보안 fix 머지 3분 ★ 오늘의 주 액션

`b34aa84` (라이브 API 비공개 대회 가드)가 origin/subin 에만 있고 dev/main 미반영. **보안 수정이라 빠른 머지 권장**:

```bash
# GitHub: subin → dev PR 생성·머지 (b34aa84)
# GitHub: dev → main PR 생성·머지 (운영 배포)
```

> 비공개 대회 라이브 결과 유출 차단. 소규모(+36 -2) · 스키마/api/v1 변경 0 · 저위험.
> ⚠️ Cowork 자동 루프는 안전 가드상 push/merge 직접 ❌ — 수빈 수동 액션.
> (참고: 로컬 클론 subin 은 55db5c0 에 정체 — origin 이 최신. 로컬 작업 재개 시 `git fetch && git checkout subin && git reset --hard origin/subin` 또는 pull 권장.)

---

## ☐ 액션 2 — Claude.ai paste (2분 · 6/15부터 이월) 일관성 QA

박제본 전반 디자인 정합 점검 = **일관성 QA 패스** (3일째 미발송):

- 첨부 2건: `design-consistency-qa-brief-2026-06-14.md` + `BDR-v2.31-FULL-phase11-12-2026-06-14.zip`
- paste 본문: `design-consistency-qa-delivery-2026-06-15.md` §paste 본문 단일 블록 그대로

> 신규 화면 박제 ❌ — 기존 박제본 정규화 + CLI 픽스 체크리스트 산출. 회신 zip 도착 시 Cowork 가 sync + 픽스 batch 자동 연결.
> 💡 기록실(Records) 6건이 6/16 머지됨 → QA 시 신규 기록 화면도 정합 점검 대상에 포함 권장.

---

## ☐ 액션 3 — STAGE E/F 진입 결재 1줄 (선택 · 이월)

STAGE A~D + 기록실 확장 종료 → 다음 STAGE 결재:

- **STAGE E (Phase 13)** = 홈(`/`) full 재박제 + 법적(`/privacy` `/terms`) ~3 page
  - ⚠️ 홈 full = 가장 복잡/위험(SEO·LCP·다수 섹션). 단독 batch 권장.
  - 옵션 A: 법적 2 page 먼저(저위험) → 홈 별도 session  ← 권장
  - 옵션 B: 홈+법적 1 패키지 통합
- **STAGE F** = 잔여 사용자 측(`/games/edit` `/games/report` `/my-games` `/guest-apps` `/profile/complete`) 작은 묶음
- → 한 줄 결재 주시면 Cowork 가 다음 루프에서 connectivity plan + redesign prompt + delivery + zip 자동 작성.

> 결재 없으면 default = STAGE 순서(E 먼저 · 옵션 A 권장). 단 홈 full 은 위험도 높아 명시 결재 권장.

---

## 상태

```
박제+머지 완료 : Phase 1~12 + 회귀 v2 + RECORDER-AUDIT + 라인업(LC1) + mock→real + P1-a/b + Admin S2
              + 기록실(Records) 확장 6건(#705~#716) — STAGE A~D + 기록실 종료 ✅
신규 미머지    : b34aa84 (라이브 API 보안 가드) — origin/subin 만 / subin→dev→main 대기
다음 Claude.ai : 일관성 QA 패스 (delivery 작성됨 · paste 3일째 대기)
다음 STAGE     : E(Phase 13 home+legal ~3) → F(잔여 사용자 5) → G(PA3/referee 별 결재)
git : origin main = dev = fb961cb 정합 / origin/subin = b34aa84 (+1 미머지)
BDR-current : v2.31 FULL (Phase 11/12) — ⚠️ 기록실 화면 미반영 가능(역박제 갭 검토 필요)
```

## 알림

- 🆕 **보안 fix 미머지** — `b34aa84` 라이브 API 비공개 대회 가드. 운영 미반영. 액션 1로 빠른 머지 권장.
- ⚠️ **루프 공백 6/17·6/18** — 자동 산출 0. 6/16 머지된 기록실 6건이 기존 프롬프트/큐에 미반영이었음 → 본 6/19 갱신으로 정합.
- ⚠️ **BDR-current 역박제 갭(검토)** — 기록실(Records) 화면이 src/엔 박제(6/16)됐으나 BDR-current(v2.31, 6/14)엔 미반영 가능. 운영→시안 동기화 룰 대상. 다음 CLI 세션에서 갭 검증 + 필요 시 역박제. (Cowork 자동 루프는 BDR-current 직접 수정 ❌)
- ⚠️ **phase-ledger.md 적체** — 마지막 기록 6/12(Phase 9C). 6/13~6/18 진척(Phase 10·v2.31·라인업·mock→real·P1-a/b·Admin S2·기록실 6건·보안 fix 2건) 미반영. 다음 CLI 세션 ledger 정리 권장. (Cowork 자동 루프는 ledger 직접 수정 ❌ — 점검·보고만)
- ℹ️ **housekeeping** — `Dev/design/BDR v2.33/_delivery-records-2026-06-16` 가 Dev/design/ 최상위에 잔존(단일 폴더 룰). 기록실 박제 source 였고 머지 완료 → `_archive/` 이동 권장(선택).
- ℹ️ Flutter `/api/v1` = 원영 이탈로 담당 공백(referee STAGE G). 진입 전 결재 필요.
- ℹ️ PA3 재설계 = 보류 유지(STAGE G).
