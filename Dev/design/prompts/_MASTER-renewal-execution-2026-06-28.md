# ★ 통합 실행 지시서 — 리뉴얼 끝까지 (Master Conductor)

> 작성: Cowork(허브) · 2026-06-28 · 두 트랙을 하나의 순서로 묶어 **지금부터 완료까지** 배치 단위로 실행.
> 이 문서 = 순서·의존성·게이트·진행추적·수빈 액션. **세부 박제 내용은 트랙별 계획서 참조**(중복 안 함):
> - 공개웹(PUB): `Dev/design/prompts/public-site-renewal-plan-2026-06-28.md`
> - 관리자(ADM): `Dev/design/prompts/admin-toss-port-plan-2026-06-28.md`
> 룰 우선순위(WORKFLOW §4): CLAUDE.md → WORKFLOW.md → claude-project-knowledge/00~06 → phase-ledger → 본 계획서들.

---

## 0. 두 트랙 개요 + 충돌 주의

| 트랙 | 대상 | 시스템 | 시안 소스 | 타겟 라우트 |
|------|------|--------|----------|------------|
| **PUB** 공개웹 | 사용자 (web) 67p | **BDR**(Red·다크·Material Symbols·13룰) | `BDR-current/`(49+50 머지 후) | `src/app/(web)/*` |
| **ADM** 관리자 | 운영/대회/심판/협력업체 | **Toss**(Blue·lucide·ts-*) | `BDR v2.41-admin-toss/` + **_zips/v52(최신·일부수정)** > _zips/v51 | `(web)/tournament-admin/*`, `(admin)/admin/*`, `(referee)/*`, `(web)/partner-admin/*` |

**⚠ BDR-current 공유 충돌**: PUB은 `BDR-current/`를 49/50 시안으로 sync해 쓰고, ADM은 **별도 폴더 `BDR v2.41-admin-toss/`** 를 쓴다. → **ADM 작업은 BDR-current를 절대 건드리지 않음**(충돌 0). PUB sync 시점에만 BDR-current가 공개웹 시안으로 바뀜. 두 트랙은 **코드 영역도 분리**(admin 라우트 vs (web) 공개)라 상호 간섭 없음.

**병렬 가능?** 단일 운영자(수빈)면 **직렬 권장**(검증·결재 부하). 2세션 운영 시엔 트랙별로 나눠 가능하되 같은 dev 브랜치 → 각자 영역 경로만 `git add`(전체 add 금지, CLAUDE.md).

---

## 1. 전체 실행 순서 (권장 글로벌 시퀀스)

```
지금 위치(2026-07-01 검증): **ADM = /v2 그린필드 리빌딩 R1~R6 완료·컷오버 R7 진행 중**(박제 아님 → 정합·보완·봉인만). **PUB = 진행 중**(DS v4 갭 교체 PUB-2-N 실행 중).

[A] ADM 트랙 (/v2 이미 완료 → 정합·보완·봉인 종결)  ※상세 = admin-toss-port-plan(개정판)
  ADM-V0 시안 delta ─▶ ADM-V1 /v2↔v52 정합 대조·패치 ─▶ ADM-F 기능 누락 보완 ─▶ ADM-S 레거시 봉인 종결
[B] PUB 트랙 (공개웹 — 이번 개정 범위 밖, 별도 정합 예정)
  실제 진행 = 경토큰→DS v4 갭 교체(PUB-2-N …). 계획서(49/50 전면 박제)와 프레이밍 불일치 → 추후 정합 필요.
```

**의존성 규칙**
- ADM-1 이전에 ADM-0 필수(시안 delta 결재). ADM-2/3/4는 ADM-1 검증 완료 후.
- PUB-1 이전에 PUB-0 필수(IA 델타 결재 — 9탭/더보기 변경 시 frozen 충돌 검토).
- PUB sync는 ADM과 무관(BDR-current 별개). 단 한 번에 한 트랙만 BDR-current를 다루면 혼선 0.
- **권장**: ADM-1(가장 복잡·계약 완비)을 끝까지 검증 → 이후 ADM-2~4와 PUB을 우선순위 따라 진행. PUB을 먼저 하고 싶으면 트랙 순서만 바꾸면 됨(독립).

---

## 2. 배치 실행 루프 (모든 배치 공통 4단계)

각 배치(ADM-n / PUB-n)는 동일 루프로 돈다:

```
① 진입 게이트
   - 선행 배치 검증·결재 완료? / 시안 소스 준비됨? / 현재 dev 최신(git pull)?
② 박제 (PR 단위 반복)
   - 트랙 계획서의 해당 배치 프롬프트를 CLI에 paste
   - 2~4 화면/패널씩 PR(PR-<배치>-<n>) — 영역 경로만 git add
   - 공통 가드(§3) 준수
③ 검증 게이트 (PR마다 + 배치 끝)
   - npm run build + tsc / 시안 대조(스크린샷 or preview.html) / 회귀 체크
   - 고위험 배치: security-reviewer + (ADM)db-migration-expert / (PUB)design-system-expert 병렬 subagent
④ 결재 + 기록
   - 수빈 PR 머지(dev→main 단독) / phase-ledger 갱신 / 다음 배치로
```

---

## 3. 공통 가드 (양 트랙 — 위반 시 reject)

1. **리디자인 = UI만**: 라우트·데이터 패칭·API·Zod·Prisma·officialMatchWhere() 보존. 마크업/스타일만 교체.
2. **DB 스키마 변경 금지**(기본): 시안에 신규 데이터 필요 시 준비중/disabled + `(시연)` 토스트(mock 저장 위장 금지). 꼭 필요하면 **수빈 승인** + 단일 운영 DB 안전가드(CLAUDE.md §🗄️).
3. **`/api/v1`(Flutter 기록앱) 변경 = 수빈 결정**(담당 공백). 신규 엔드포인트 금지, 기존 응답 형태 유지.
4. **응답 snake_case** 접근자 유지, 신규 필드 노출 전 `curl` raw 1회 확인.
5. **시스템 분리**: PUB=BDR 토큰·Material Symbols·13룰 / ADM=Toss 토큰·lucide. **혼입 금지**(하이브리드 fallback 없음).
6. **AppNav frozen**(PUB만): 03 코드 카피, 9탭/더보기 변경 = 수빈 결재.
7. **역박제**: 운영이 시안과 달라지면 해당 시안 폴더(BDR-current 또는 admin 시안 폴더)도 같이 갱신.
8. **브랜치/DB 안전**: main 직접 push 금지 / destructive SQL·prisma db push 수빈 승인 / 영역 경로만 git add.

---

## 4. 진행 대시보드 (배치마다 갱신)

> 상태: ⬜대기 / 🔵진행 / ✅완료 / ⛔차단 / ⏸보류. CLI가 PR마다, 수빈이 결재 시 갱신.

> ADM = /v2 이미 완료 → **정합·보완·봉인만**(재작성 아님). 상세=admin-toss-port-plan(개정판).

| 트랙 | 스트림 | 내용 | 진입조건 | 상태 | 메모 |
|------|------|------|---------|------|----|
| ADM | ADM-V0 | v52 시안 delta(3자 diff) | v52 추출됨 ✅ | ⬜ | _adm-sian-delta.md |
| ADM | ADM-V1 | /v2 ↔ v52 정합 대조·패치 | V0 | ⬜ | 관리자홈 허브·v52 변경화면. 재작성 금지 |
| ADM | ADM-F | 기능 누락 보완 | V1 | ⬜ | 일정저장·대진드래그·coach_token·권한매트릭스·🔴9. 스키마=수빈승인 |
| ADM | ADM-S | 레거시 봉인 종결 | 프리뷰 검증 | 🔵 진행 | R7 일부 봉인됨(8f99674/68c1a89/fe55267). 심판=공존 유지 |
| PUB | (진행중) | 경토큰→DS v4 갭 교체 | — | 🔵 진행 | PUB-2-N(랭킹/시리즈/단체/메시지…). 계획서와 프레이밍 정합 추후 |

> 이 표를 `.claude/phase-ledger.md`에도 미러(WORKFLOW §5). CLI가 commit마다 갱신. (ADM 배치 상세·PR = admin-toss-port-plan 개정판)

---

## 5. 수빈 수동 액션 통합 체크리스트

```
공통(매 배치)
☐ 배치 시작 전 dev 최신화 / 종료 후 PR 머지(dev→main 단독)
☐ phase-ledger 상태 변경 시 Cowork/CLI에 한 줄(자동 갱신 트리거)

ADM
☐ ADM-0 _adm-sian-delta.md(토큰/컴포넌트 delta) 검토·결재
☐ DATA-CONTRACT 🔴 중 스키마 추가 보고 시 DB 변경 승인 여부 결정
☐ /api/v1(기록앱) 영향 보고 시 결정

PUB
☐ 49·50 한 폴더 머지(50 우선) → sync-bdr-current.ps1 -DryRun → 실행 → 커밋
☐ PUB-0 _pub-ia-delta.md(9탭/더보기/신규삭제 라우트) 검토·IA 결재
```

---

## 6. 완료 정의 (Definition of Done)

- **ADM 완료**: V1 정합(관리자홈 허브·v52 변경화면 = 시안과 시각 일치) + F 누락 결정·처리(🔴 준비중 or 승인 후 추가) + S 봉인 종결(완성영역 redirect·심판 공존 확정·미결 결정 마감) + build/tsc + RESPONSIVE 4뷰포트 + 프리뷰 실클릭 검증.
- **PUB 완료**: (web) 전 페이지 DS v4 갭 교체 완료(`--color-*` 잔존 0 목표) + AppNav 4-케이스 회귀 0 + build/tsc. ※계획서(49/50 전면 박제) ↔ 실제(DS v4 갭) 프레이밍 정합은 별도.
- **전체 완료**: 두 트랙 DoD 충족 + phase-ledger 전 행 ✅ + scratchpad/knowledge 갱신 + 역박제 동기화.

---

## 7. 지금 바로 다음 액션 (Start Here)

```
1) CLI에 ADM-V0 프롬프트(admin-toss-port-plan 개정판 §4-V0) paste → _adm-sian-delta.md(v52 변경) 받기
2) ADM-V1(§4-V1) — /v2 ↔ v52 정합 대조·패치(관리자홈 허브부터). 재작성 금지, 미세 패치만
3) ADM-F — 누락 항목별 수빈 결정(스키마/API·/api/v1) 후 보완 or 준비중 유지
4) ADM-S — 프리뷰 실클릭 검증된 영역 redirect 봉인 종결 + 미결(매칭/게임리포트/시상/analytics/심판) 결정
※ 대전제: /v2는 이미 완료 — 갈아엎지 말 것. 이 작업은 정합·보완·봉인만.
```
