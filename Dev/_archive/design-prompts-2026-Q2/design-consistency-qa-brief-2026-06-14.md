# BDR 시안 의뢰 — 디자인 일관성 QA 패스 (전체 박제본 정합 점검)

> Claude.ai (BDR 디자인 Project) 전달용. Cowork 작성 2026-06-14.
> 계기: 계획 Phase 1~10 + 라인업 시안 완료 → 박제본 전반의 **토큰/패턴/간격 정합** 점검 + 정규화. 프로젝트 미션 "전체 완성도 점검"에 부합.
> ★ 본 의뢰는 **신규 화면 박제가 아니라 기존 시안 정규화 + 픽스 명세 산출**입니다.

---

## 1. 컨텍스트

- **대상**: `Dev/design/BDR-current/` 전체 시안 세트 (77+ jsx + shared + css) + 운영 src/ 정합
- **우선순위**: P1 (완성도/유지보수 — 사용자 직접 버그는 아니나 일관성 부채 상환)
- **목표**: 화면별로 난립한 변형(카드/칩/버튼/empty/모달/Hero)을 **공용 표준형 1벌로 수렴** + **폐기 토큰 잔존 제거** + **화면별 픽스 체크리스트** 산출
- **셸**: 점검 대상은 (web) 사용자 영역 우선. admin/referee 등 E영역은 토큰 일치만 점검(레이아웃 패스)
- **시급도**: 라인업 박제 완료 후 착수 (병렬 가능)

---

## 2. 점검 7축 (각 축 = 위반 케이스 수집 + 표준 제시)

```
[축1] 토큰 통일 ★최대 부채
  · 폐기 `--color-*` (예: --color-text-primary/--color-surface/--color-accent 등) 잔존 →
    BDR v2 토큰(--ink/--ink-mute/--bg-card/--accent/--cafe-blue 등)으로 매핑.
  · 근거: 인벤토리 5-B-2 = 폐기 토큰 329 파일/4영역. 02-design-system-tokens §9 매핑표 기준.
  · 하드코딩 hex / 핑크·살몬·코랄 잔존 0 확인.
[축2] 컴포넌트 패턴 수렴
  · 카드(.card) / 칩·뱃지(badge·admin-stat-pill·kind chip·OperatorBadge) / 버튼(.btn) /
    empty state / 모달(bl-modal) / Hero — 화면마다 변형 난립 여부 → 표준형 1벌.
[축3] 간격·라운딩
  · 버튼 4px / 카드 8px / pill 9999px ❌(정사각 원형만 50%) / 섹션·그리드 간격 스케일 일관.
[축4] 타이포
  · Pretendard(본문) + Space Grotesk(display/숫자) 적용 일관 · 위계(h1~) 스케일 통일.
[축5] 아이콘
  · Material Symbols Outlined 통일 · lucide-react 잔존 0.
[축6] 모바일/반응형
  · 720px 분기 일관 · iOS input 16px · 터치 44px · 모바일 1열 재배치 패턴 통일.
[축7] 다크/라이트 듀얼 톤
  · 라이트(다음카페 톤) ↔ 다크(쿨 그레이 brutalism) 양쪽 토큰 정의 · 핑크/살몬/코랄 0.
```

---

## 3. 산출물 (3종)

### 3-A. 일관성 진단 리포트 (`_qa/consistency-audit.md`)
- 7축 × 대표 화면 표본(고빈도: Home/Games/GameDetail/Teams/TeamDetail/Tournaments/TournamentDetail/Profile/Community/Courts/Notifications/Search/About/News). 위반 케이스 = 화면·요소·현재값·표준값 표.
- 심각도(P1 사용자 직접 노출 / P2 내부 정합)로 분류.

### 3-B. 정규화 산출 (시안 측 수정)
- `components.jsx` — 공용 표준형 확정 (카드/칩/버튼/empty/모달/Hero 변형 통합 · 1 정의).
- `tokens.css` — 폐기→신규 매핑 확정 (02 §9 표 반영).
- 정규화 적용한 대표 화면 2~3개 = before/after 시안(증빙).

### 3-C. 화면별 픽스 체크리스트 (`_qa/bake-fix-checklist.md`) ★ CLI 박제용
- 운영 src/ 화면별 = [폐기 토큰 N건 → 매핑] [변형 컴포넌트 → 표준 교체] [pill/hex/lucide 위반] 라인 단위 fix 목록.
- 일괄 sed/grep replace 가능 항목 vs 수동 항목 분리(자동화 힌트).

---

## 4. 보존 / 변경 금지

- **AppNav frozen** (03) — 점검은 하되 구조 변경 ❌ (이미 frozen).
- **사용자 결정 §1~§8** (01) — 카피/IA/헤더 변경 ❌. 본 패스는 시각 토큰·패턴만.
- **기능/데이터/라우트 0 변경** — 순수 디자인 정합.
- **②③ 대회상세/종료 · Phase 10 정보페이지 · 라인업** = 최신 박제본 = 표준 기준점(이들에 맞춰 나머지 수렴, 역방향 ❌).

---

## 5. 박제 룰 (자동 적용)
✅ 00 13룰 / ✅ AppNav 03 frozen / ✅ 토큰 02(§9 매핑) / ✅ 사용자결정 01 §1~§8 / ✅ 완료 후 06 self-checklist
- 추가: pill 9999px ❌(정사각만 50%) · 하드코딩 hex ❌ · lucide ❌ · 720/16px/44px

---

## 6. 산출 폴더 / 파일
- `Dev/design/BDR v2.X/` (다음 버전)
- `_qa/consistency-audit.md` + `_qa/bake-fix-checklist.md` (신규)
- `components.jsx` / `tokens.css` 정규화 + 대표 화면 before/after
- `README.md` v(X-1)→v(X) 변경 요약 + 7축 요지

---

## 7. 질문 / 가정 (PM=수빈)
1. **범위 깊이**: (A) 고빈도 14화면 표본 집중(권장 — 빠른 ROI) vs (B) 77 전체 전수. → 기본 가정 = **A 표본 우선**, 전수는 체크리스트로 위임.
2. **기준점**: 최신 박제본(대회상세/종료·Phase10·라인업)을 표준으로 나머지 수렴. → 기본 가정 = **그렇게**.
3. **산출 형태**: 정규화된 components/tokens + 픽스 체크리스트(CLI가 운영 박제). → 기본 가정 = **그렇게**(시안이 직접 운영 src/ 수정 ❌).

---

## 8. 첫 응답 형식 (Claude.ai)
```
✅ BDR 시안 의뢰 확인 — 디자인 일관성 QA 패스
이해: 7축 정합 점검 / 공용 표준형 수렴 / 폐기토큰 제거 / CLI 픽스 체크리스트 산출
기준점: 최신 박제본(②③·Phase10·라인업) / AppNav·사용자결정 보존
자체 검수: 06 §[해당]
질문: §7 1~3 가정 확인
작업 시작.
```

---

## 9. 추가 컨텍스트
- 폐기 토큰 부채 근거: `04-page-inventory.md §5-B-2` (329 파일 / (web)157·components75·admin49·referee31).
- 토큰 매핑 source of truth: `src/app/globals.css` = `02-design-system-tokens.md`.
- 본 패스 산출 = 프로젝트 "전체 완성도 점검 + 자동 검증" 미션의 디자인 축 — bake-fix-checklist 가 CLI 일괄 박제 + 회귀 검증 배치로 연결됨.
