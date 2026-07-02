# 관리자 /v2 — 정합 검증 + 누락 보완 + 봉인 종결 지시서 (Cowork → CLI)

> **개정 2026-06-28 (v52 반영) — 방향 전환.** 이전판의 "기존 실 라우트 직접 박제" 전략은 **폐기**.
> 이유: scratchpad 기준 관리자 영역은 **클린슬레이트 그린필드 /v2 리빌딩이 이미 완료**(R1~R6, 정본 1:1·tsc+build·회귀0·푸시·vercel)이고, "기존 라우트 재사용" 방식은 1차(M1~M3)에서 **깔끔함 미달로 전량 폐기**된 접근. 문자 그대로 박제하면 완성된 /v2를 버리는 역행.
> → 이 문서는 이제 **이미 된 /v2를 (a)시안과 정합 검증, (b)기능 누락 보완, (c)레거시 봉인 종결** 하는 3스트림 지시서다.
> 시안 정본: `_zips/v52`(최신·일부수정) > `_zips/v51` / 계약: `Dev/design/BDR v2.41-admin-toss/`(PARITY-MATRIX·DATA-CONTRACT·CLEANUP-MANIFEST·TOURNAMENT-OPS-STATES·RESPONSIVE-QA·ADMIN-TOSS-STATE-QA). 상태 근거: `.claude/scratchpad.md`.

---

## 0. 현황 (검증됨 · 2026-07-01 scratchpad + 라우트 glob)

- **완료**: /v2 그린필드 R1~R6 전 영역. 실 라우트 존재 확인 —
  - 백오피스 `(admin-v2)/v2/(backoffice)/*`: user-console·payments·plans·match-console(+[id])·news-console·categories·analytics·settings·logs·notifications·mypage·partner-console·manner-console·season-awards·public-site·community/court/marketing-console·tournaments/[id]/audit-log·transfer-organizer
  - 대회관리자 `v2/ta/*`(+ tournaments/new·[id]/edit 마법사) · 대회운영 `v2/operate/[id]` · 협력 `partner/*` · 심판 `referee-console/*`(대량)
- **컷오버(R7) 진행 중**: `next.config.ts` 308 redirect 봉인(①대회운영·④협력 8f99674 / 매칭+백오피스7콘솔 68c1a89 / analytics fe55267). "포팅 100%(2026-06-30)". ⚠ 프리뷰 실클릭 검증 = 수빈 몫.
- **디자인/데이터 규약**: `components/admin-v2` + `styles/admin-v2` + `lib/admin-v2/data`(adminFetch snake↔camel 1곳). READ=서버 Prisma 직접(snake 함정 차단)·mutation=adminFetch. **백엔드 0변경 원칙**(유일 예외 R6-C 신규테이블 2개 `referee_evaluations`·`partner_settlements`·승인·db push 완료).

---

## 1. 최우선 가드 (위반 시 reject)

1. **/v2 재작성 금지.** 이미 된 화면을 갈아엎지 말 것. 이 작업은 **정합 diff·누락 보완·봉인**만.
2. **백엔드 0변경 원칙 유지.** 신규 엔드포인트/스키마는 기본 금지. DATA-CONTRACT 🔴·"엔드포인트 부재" 항목은 준비중/disabled + `(시연)` 유지 또는 **수빈 승인 시에만** 무중단 추가(단일 운영 DB 안전가드).
3. **`/api/v1`(기록앱) 변경 = 수빈 결정**(담당 공백). recording_mode·match·기록원 연동 주의.
4. **컷오버 봉인은 프리뷰 실클릭 검증 후.** redirect 추가는 완성·검증된 영역만. 롤백=규칙 제거. main 직접 push 금지.
5. **심판 봉인 특수**(scratchpad 확정): v2 referee-console=super_admin 글로벌 레이어, 레거시 referee/admin=association_admin → **단순 redirect 시 협회관리자 마비**. 봉인하려면 v2 협회스코프 확장(권한 재설계·큰작업). 현재 4-2/4-3에서 공존 개방 진행(c2757ce). → 봉인 대신 **공존** 유지가 기본.
6. **응답 snake_case** 접근자 유지, 신규 필드 노출 전 curl raw 1회.

---

## 2. 3스트림 (관리자 잔여작업 전량)

### 스트림 V — /v2 ↔ v52 시안 시각 정합 검증

- **ADM-V0 (시안 delta)**: CLI가 `_zips/v52 ↔ _zips/v51 ↔ Dev/design/BDR v2.41-admin-toss/(활성)` **3자 diff** → v52 "일부 수정" 파일·요지 식별 → 활성 폴더 v52로 보강. 산출 `_adm-sian-delta.md`.
- **ADM-V1 (정합 대조)**: v52 delta가 난 화면 + 관리자 홈 허브(hub-pages) 를 **렌더 /v2와 1:1 대조**(시각충실도 QA — dev 프리뷰 https 사용, 로컬 localhost는 Cowork 제어탭 불가). 차이표(우선순위·요소·시안값·현재값·수정방향) 산출 → 해당 /v2 파일만 미세 수정. **재작성 아님, 정합 패치.**
- 참조: PARITY-MATRIX(매핑)·RESPONSIVE-QA(390/720/1024/1440)·ADMIN-TOSS-STATE-QA(상태).

### 스트림 F — 기능 누락 보완 (scratchpad + DATA-CONTRACT 🔴)

우선순위·엔드포인트 유무 판단 후 진행(백엔드 0변경 우선, 스키마 필요 시 수빈 승인):

| 항목 | 현재 | 처리 |
|------|------|------|
| 대회운영 **일정 저장**(schedule_slot)·**대진 드래그** | 엔드포인트 부재 | 저장 API 필요 → 수빈 승인 후 무중단 추가 or 준비중 유지 |
| coach_token 수명·재발급 | 🔴 | 필드 필요 판단 → 승인/준비중 |
| 권한 매트릭스(role→permission) | 🔴 | 정의 후 메뉴 숨김/disabled 반영 |
| recording_mode(매치별)·match_recorder·bracket_seed·publishedSections·tournament_expense·진행도 산식 | 🔴 | DATA-CONTRACT §11 — 준비중/`(시연)`, 승인 시에만 추가 |
| 심판 기능갭(pools/bulk-register/members상세/settlements 하위) | 일부 v2 부재 | scratchpad 별도 트랙 — 필요 시 포팅 |

### 스트림 S — 레거시 봉인 종결 (R7 마무리)

- **완성·검증 영역 redirect 봉인 일괄**(프리뷰 실클릭 검증 후·next.config.ts): 매칭(목록 04ec318/상세 b75c12c) + 백오피스 잔여.
- **미결 결정**(수빈):
  - 매칭 deep-link vs 포팅
  - game-reports(row0 빈화면)·season-awards(버킷B) 처리
  - analytics(지표 축소)·tournaments(상세/audit-log/transfer-organizer 타겟 재지정)·agents(보조도구 제외) 잔여
  - 심판 봉인 = 공존 유지(위 가드5) or 협회스코프 확장(별도 큰작업)

---

## 3. 검증

- `npm run build` + `tsc --noEmit` (모든 수정 후)
- 정합: dev 프리뷰 https에서 /v2 ↔ v52 시안 스크린샷 대조 / RESPONSIVE-QA 4 viewport
- 봉인: **수빈 프리뷰 실클릭**으로 redirect·권한 확인(협회관리자 마비 없음)
- 고위험: security-reviewer(권한/IDOR — 심판 스코프·운영진) + db-migration-expert(스키마 추가 시 무중단) 병렬
- 역박제: /v2가 시안과 달라 정합 패치하면 시안 폴더(BDR v2.41-admin-toss/)도 갱신

---

## 4. CLI 프롬프트 (paste-ready)

### 4-V0 — 시안 delta

```
[관리자 ADM-V0 — v52 시안 delta]
3자 diff: _zips/v52/.../BDR v2.41-admin-toss/ ↔ _zips/v51/... ↔ Dev/design/BDR v2.41-admin-toss/(활성)
- v52 "일부 수정" 파일·요지 식별(겹치면 v52 우선). 활성 폴더를 v52로 보강. BDR-current(공개웹용) 미터치.
산출: _adm-sian-delta.md. 코드 수정 0.
```

### 4-V1 — 정합 대조·패치 (화면 단위 반복)

```
[관리자 ADM-V1 — /v2 ↔ v52 정합 / {화면: 예 관리자 홈 허브}]
전제: /v2 해당 화면은 이미 구현됨. 재작성 금지 — 시안과 다른 부분만 미세 패치.
1. dev 프리뷰 https의 /v2 {경로} 렌더 ↔ v52 시안(_zips/v52 해당 파일/HTML) 1:1 대조.
2. 차이표(우선순위/요소/시안값/현재값/수정방향) → components/admin-v2·styles/admin-v2 해당 부분만 수정.
가드: 백엔드 0변경·Toss 토큰/lucide만·재작성 금지·min-height 92px(대진표) 유지.
검증: build+tsc / 프리뷰 재대조 / RESPONSIVE 4뷰포트. 시안과 달라지면 시안 폴더도 갱신.
```

### 4-F / 4-S — 보완·봉인 (항목 단위)

```
[관리자 ADM-F — 기능 보완 / {항목}]  §2 스트림F 표에서 1개. 엔드포인트 부재면 중단·수빈 승인 요청(스키마/API). 없으면 준비중/(시연) 유지.
[관리자 ADM-S — 봉인 종결 / {영역}]  프리뷰 실클릭 검증 완료분만 next.config.ts redirect 추가. 심판=공존 유지(단순 봉인 금지). 미결 항목은 수빈 결정 후.
```

---

## 5. 수빈 액션 / 순서

```
☐ ADM-V0 _adm-sian-delta.md 검토(v52 변경 확인)
☐ ADM-V1 정합 차이표 검토 → 패치 승인
☐ 스트림F 스키마/API·/api/v1 필요 항목 = 승인 여부 결정
☐ 스트림S 봉인 = 프리뷰 실클릭 검증 + 미결(매칭/게임리포트/시상/analytics/심판) 결정
순서: ADM-V0 → ADM-V1(정합) → ADM-F(보완) → ADM-S(봉인 종결)
```
