# 클로드 디자인 의뢰 — 정보 페이지 사용자 측 (Phase 10B)

> **선행**: Phase 1~9 박제 완료
> **본 의뢰**: 4 시안 (IU1~IU4) · 사용자 측

---

## 0. 진입 표준 절차

Phase 9 답습. Phase 1~9 carry-over (변경 ❌).

---

## 1. 한 줄 요약

`/about` (IU1 신규) + `/news + /news/match/[matchId]` (IU2 통합 carry) + `/help + /help/glossary` (IU3 통합 carry+신규) + `/reviews` (IU4 carry) = **4 시안**.

---

## 2. 결재 룰

- ✅ **IU1 About**: **사용자 결정 §6 = 운영진 실명 박제 ❌ 보존** (시안 보존)
- ✅ **IU2 News**: E1+E2 carry / Phase 1/2 대회·경기 cross-domain link 자동
- ✅ **IU3 Help+Glossary**: Phase 6 carry + Glossary 신규 (용어 사전 A-Z chip)
- ✅ **IU4 Reviews**: v3 carry + 평점 분포 차트 보강
- ❌ 새 라우트 / Phase 1~9 시안 변경 ❌

---

## 3. 4 시안 사양

### IU1 — About (신규) · `/about`

**현황**: 304 line · 박제 ❌

**시안 (신규)**:
- Hero band — BDR 슬로건 + 핵심 가치 (3 카드)
- 통계 카드 (사용자 수 / 대회 / 코트 / 경기 등 cross-domain 집계)
- "MyBDR 가 만드는 것" 섹션 (3-4 카드 · 경기/대회/팀/단체)
- ★ **운영진 섹션 = 시안 보존 / 실명 표시 ❌** (사용자 결정 §6)
- FAQ 미니 (link → IU3 Help)
- 하단 CTA (회원가입 / 문의)
- 외부 진입 hero (SEO 강화)

### IU2 — News 통합 (보강 carry) · `/news` + `/news/match/[matchId]`

**현황**: 156 + 271 = 427 line · E1+E2 박제 ✅ (BDR NEWS 매거진 + 매치별 단신)

**보강**:
- 매거진 메인 = carry / 카테고리 chip + 최신 / 트렌딩 / 추천
- 매치 단신 = carry / Phase 1/2 cross-domain (대회·경기 자동 link)
- AdminNews(IA1) 발행 결과 자동 표시
- 모바일 카드 grid 분기

### IU3 — Help + Glossary (통합 / 보강+신규) · `/help` + `/help/glossary`

**현황**: 405 (Phase 6 박제 ✅) + 330 (박제 ❌)

**보강 + 신규**:
- IU3-A · Help 메인 carry — FAQ 카테고리 + 검색 + 인기 항목
- IU3-B · Glossary 신규 — 용어 사전 (A-Z chip 인덱스 + 용어 카드 grid + 검색)
- Glossary 카드 = 용어명 + 정의 + 관련 용어 link
- cross-domain — Help → IU3 (용어 link) → 해당 Phase 진입

### IU4 — Reviews (보강 carry) · `/reviews`

**현황**: 127 line · v3 박제 ✅ (커뮤니티 리뷰)

**보강**:
- 평점 분포 chart (별 1~5 분포)
- 최신 리뷰 list + 카테고리 chip
- 사용자 결정 평점 룰 = Phase 2 BG2 답습 (평균 + flag 종류만 / 개별 건수 ❌)

---

## 4. 양측 의존 검증

| BI | 본 의뢰 | cross-domain |
|----|---------|-------------|
| BI1 | IU1 About | 통계 카드 = 전 Phase 집계 |
| BI2 | IU2 News | Phase 1/2 대회·경기 link + IA1 발행 |
| BI3 | IU3 Help+Glossary | 용어 link → 해당 Phase 진입 |
| BI4 | IU4 Reviews | Phase 2 BG2 매너 평점 룰 답습 |

---

## 5. 13 룰 + Phase 1~9 carry-over

- ❌ AppNav / 새 라우트 / Phase 1~9 시안 변경 ❌
- ✅ **사용자 결정 §6 = About 운영진 실명 박제 ❌** (시안 보존 룰)
- ✅ Phase 2 BG2 평점 룰 답습 (IU4)

---

## 6. 자체 검수

기본 12 + Phase 10 특수 3:
- ✅ IU1 운영진 실명 = 시안 보존 (실명 노출 ❌)
- ✅ IU3 Glossary A-Z chip 인덱스
- ✅ IU4 평점 분포 chart

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 정보 페이지 사용자 (Phase 10B · IU1~IU4)

이해: IU1 About 신규 (§6 운영진 실명 ❌) + IU2 News carry + IU3 Help+Glossary 신규 + IU4 Reviews 보강.
양측 의존 = BI1~BI4 / Phase 1/2 cross-domain.
사용자 결정 §1~§8 / 13 룰 / Phase 1~9 carry-over.
자체 검수: 06 §사용자 / 정보 페이지
작업 시작.
```

---

**의뢰서 끝.**
