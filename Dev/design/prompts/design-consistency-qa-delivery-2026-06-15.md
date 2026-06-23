# Claude.ai 전달 패키지 — 디자인 일관성 QA 패스 (paste-ready)

> Cowork 자동 루프 작성 2026-06-15. 대상 = 디자인 일관성 QA 브리프(`design-consistency-qa-brief-2026-06-14.md`).
> 계기: Phase 1~12 + 라인업 + mock→real + P1-a/b + Admin S2 박제·머지 완료(#700). 박제본 전반 토큰/패턴 정합 점검 = 프로젝트 "전체 완성도 점검" 미션의 디자인 축.
> ★ 이건 **신규 화면 박제가 아니라 기존 시안 정규화 + CLI 픽스 명세 산출**.

---

## 첨부 (수빈 drag-drop 2건)

1. `Dev/design/prompts/design-consistency-qa-brief-2026-06-14.md` — 본 의뢰서(7축 점검)
2. `Dev/design/_zips/BDR-v2.31-FULL-phase11-12-2026-06-14.zip` — 현재 박제 baseline(v2.31 FULL · 표준점)

> zip 첨부 사유: 최신 박제본(②③ 대회상세/종료 · Phase10 정보 · Phase11/12 · 라인업)이 표준점.
> Claude.ai 가 이 baseline 위에서 변형 난립을 표준형 1벌로 수렴.

---

## paste 본문 (단일 블록 — 그대로 복사)

```
BDR 디자인 일관성 QA 패스 의뢰합니다.

첨부 2건:
1) design-consistency-qa-brief-2026-06-14.md — 7축 점검 의뢰서
2) BDR-v2.31-FULL-phase11-12-2026-06-14.zip — 현재 박제 baseline(표준점)

요지: 신규 화면 박제 ❌. 기존 박제본 전반의 토큰/패턴/간격 변형을 공용 표준형 1벌로 수렴 + 폐기 토큰 제거 + 화면별 CLI 픽스 체크리스트 산출.

§7 가정 3건 — 모두 default 채택으로 진행해 주세요:
- 범위: (A) 고빈도 14화면 표본 집중 + 전수는 체크리스트 위임
- 기준점: 최신 박제본(②③·Phase10·라인업·Phase11/12)을 표준으로 나머지 수렴
- 산출: 정규화 components.jsx/tokens.css + _qa/consistency-audit.md + _qa/bake-fix-checklist.md (시안이 운영 src/ 직접 수정 ❌)

보존 필수: AppNav 03 frozen / 사용자결정 01 §1~§8 / pill 9999px ❌(정사각만 50%) / 하드코딩 hex·lucide ❌ / 720·16px·44px.

완료 후 BDR vX zip 회신 주시면 Cowork 가 sync + bake-fix-checklist 를 CLI 일괄 박제 + 회귀 검증 배치로 연결합니다.
```

---

## 회신 zip 도착 후 (Cowork 자동)

1. `_zips/` 보존 + 내용 분석 → BDR vX.Y 파악
2. **선택 sync** — §0 ②③ 역박제 보존 가드 답습(TournamentDetail/Completed 미변경 검증)
3. `_qa/bake-fix-checklist.md` → CLI 픽스 batch 의뢰서 자동 작성(축별 분할 · LOC 가드)
4. 회귀 6 케이스 + tsc/lint 검증 후 subin→dev→main 머지 유도

## 비고

- 본 패스는 운영 동작 변경 0(정규화 only) 지향 — stop 위험 낮음. 단 토큰 일괄 치환은 시각 회귀 가능 → 대표 화면 before/after 필수.
- 회신 지연 시 본 chain 영향 0 — Cowork 는 STAGE E(Phase 13 home+legal) 결재 병행 가능.
