# Phase 10 — 정보 페이지 (About/News/Help/Reviews) Claude.ai 의뢰 (단일 paste)

> **선행**: Phase 1~9 박제 완료 (v2.29 도착)
> **본 의뢰**: 5 시안 (사용자 4 + super-admin 1)

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

### Step 1 — Claude.ai + 4 건 drag-drop

- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase10-baseline-2026-06-08.zip` (605KB / 205 파일)
- `info-pages-user-admin-connectivity-plan-2026-06-08.md`
- `info-pages-user-redesign-prompt-2026-06-08.md`
- `info-admin-redesign-prompt-2026-06-08.md`

### Step 2 — 아래 §메시지 본체 paste

---

## 메시지 본체

```
Phase 10 — 정보 페이지 (About/News/Help/Reviews) 리디자인 의뢰 (총 5 시안 + BI1~BI5) 시작합니다.

[선행]
- Phase 1~9 박제+운영 + Phase 9 v2.29 박제
- 첨부 zip = BDR v2.29 (BDR-current = 77 jsx + 7 css + 10 shared = notify-shared 포함)

[★ 본 Phase 특수]
- 정보 페이지 묶음 (5 시안)
- 대부분 옛 박제 carry (NEWS E1+E2 / Help Phase 6 / Reviews v3) — IU1 About + IU3 Glossary + IA1 신규
- 사용자 결정 §6 = About 운영진 실명 박제 ❌ (보존 룰)
- AdminNews 발행 → News 매거진 + Notifications 동기화 cross-domain

[상위 계획서]
info-pages-user-admin-connectivity-plan-2026-06-08.md (BI1~BI5 = 5 갭)

[의뢰서 2건 — 첨부]
1. info-pages-user-redesign-prompt-2026-06-08.md (사용자 4 = IU1~IU4)
2. info-admin-redesign-prompt-2026-06-08.md (super-admin 1 = IA1)

[첨부 zip 안]
BDR-current/ — v2.29 그대로
_phase10_operational_refs/ — 8 운영 파일 + SPEC.md

[Phase 10 박제 시안 = 5]

사용자 측 (IU1~IU4 · A 등급):
- IU1 About 신규 /about · BI1 (Hero 슬로건 + 통계 cross-domain + ★ §6 운영진 실명 ❌ + FAQ link)
- IU2 News 통합 보강 /news + /news/match · BI2 carry (E1+E2 매거진+단신 / Phase 1/2 cross-domain)
- IU3 Help+Glossary 통합 /help + /help/glossary · BI3 (Help carry + Glossary 신규 A-Z chip)
- IU4 Reviews 보강 carry /reviews · BI4 (v3 carry + 평점 분포 + Phase 2 BG2 룰 답습)

관리자 측 (IA1 · super-admin):
- IA1 AdminNews 신규 /admin/news · BI5 (Hero stat + 발행 form 4 카테고리 + 이력 + 모달 / Phase 4 OA1 답습)

[2026-06-08 결재 룰]
- BI1 = IU1 About = ★ **사용자 결정 §6 보존 = 운영진 실명 표시 ❌** (시안 보존) / 통계 카드 = 전 Phase 집계
- BI2 = IU2 = E1+E2 carry / Phase 1/2 대회·경기 cross-domain 자동 link / IA1 발행 결과 표시
- BI3 = IU3 = Help Phase 6 carry + Glossary 신규 (A-Z chip 인덱스 + 용어 카드 + 검색)
- BI4 = IU4 = v3 carry + 평점 분포 chart + Phase 2 BG2 답습 (평균 + flag 종류 / 개별 건수 ❌)
- BI5 = IA1 = Phase 4 OA1 + Phase 6.1 PA1 + 6.2 BA1 + Phase 8 VA1 + Phase 9 NA1 답습 (Site Operator + 알림 ✅ 기본)
- Phase 1~9 carry-over (변경 ❌)
- AppNav / 새 라우트 ❌

[작업 흐름]
1. 첫 응답 = 의뢰서 2건 §7 형식
   ✅ Phase 10B 사용자 (IU1~IU4)
   ✅ Phase 10A 관리자 (IA1)

2. 박제 순서:
   사용자: IU4 (작음) → IU2 carry (Phase 1/2 link) → IU3 (Glossary 신규) → IU1 (About §6 가드)
   관리자: IA1 신규

3. 박제 완료 → 새 zip (BDR v2.30/ 예상)

4. 13 룰 위반 시 reject + 알림

[양측 의존 검증]
- BI1: IU1 통계 = 전 Phase 데이터 집계 (mock 0)
- BI2: IU2 매치 단신 = Phase 1 대회 / Phase 2 경기 cross-domain link
- BI3: IU3 Glossary 용어 link → 해당 Phase 진입
- BI4: IU4 평점 = Phase 2 BG2 (평균+flag종류만)
- BI5: IA1 발행 → IU2 News + NU1 Notifications 자동 동기화

[자체 검수 4 + 8 + Phase 10 특수 3]

Phase 10 특수:
- ✅ IU1 운영진 실명 = 시안 보존 (실명 노출 0)
- ✅ IU3 Glossary A-Z chip 인덱스 + 검색
- ✅ IA1 발행 모달 = 알림 ✅ 기본 (NU1 동기화)

[질문/가정]
- IU1 통계 카드 = 운영 데이터 (사용자/대회/코트 등) cross-domain — 없는 항목 hide
- IU3 Glossary 용어 = 운영 데이터 (있으면 실 / 없으면 시안 보존)
- IA1 rich text editor = 운영 라이브러리 답습 (mock 0)

시작해 주세요.
```

---

## 예상 첫 응답

```
✅ Phase 10B 사용자 (IU1~IU4) — About + News + Help+Glossary + Reviews
✅ Phase 10A 관리자 (IA1) — AdminNews 발행 hub
```

---

## zip 회신 후

```
☐ Cowork 에 "Phase 10 zip 도착"
```

→ Cowork 자동 sync + Phase 10C Auto Chain (5 PR).

---

**의뢰서 끝.**
