# Phase 10 — 정보 페이지 (About/News/Help/Reviews) 점검 리포트

> **작성일**: 2026-06-08
> **결재**: Phase 10 = **정보 페이지 묶음** ✅
> **선행 박제**: Phase 1~9 완료
> **특수**: 대부분 옛 박제 → 보강 + IU1(About) IA1(AdminNews) 신규

---

## 0. 영역 매핑

| ID | 화면 | 라우트 | LOC | 박제 흔적 |
|----|------|--------|-----|----------|
| IU1 | About (신규) | /about | 304 | ❌ |
| IU2 | News 통합 (보강) | /news + /news/match/[matchId] | 156+271=427 | ✅ E1+E2 (BDR NEWS 매거진 + 단신) |
| IU3 | Help 통합 (보강+신규) | /help + /help/glossary | 405+330=735 | ✅ /help Phase 6 / ❌ /glossary |
| IU4 | Reviews (보강 carry) | /reviews | 127 | ✅ v3 박제 |
| IA1 | AdminNews (신규) | /admin/news | 163 | ❌ |

**총 LOC = ~1756**

---

## 1. 갭 식별 (BI1~BI5)

> **명명**: BI = "Bridge Info"

### BI1 — About (★★★)
IU1: BDR 소개 / 핵심 가치 / 통계 / **사용자 결정 §6 = 운영진 실명 박제 ❌ (보존)** / 외부 진입 hero / FAQ link → IU3

### BI2 — News 매거진 (★★★)
IU2: E1 carry (매거진 메인) + E2 carry (매치별 단신) + Phase 1/2 cross-domain (대회/경기 자동 link) + AdminNews(IA1) 발행 결과 표시

### BI3 — Help + Glossary (★★★)
IU3: Phase 6 carry (도움말) + Glossary 신규 박제 (용어 사전 · A-Z chip 인덱스)

### BI4 — Reviews (★★)
IU4: v3 carry (커뮤니티 리뷰) + 평점 분포 + 최신 리뷰

### BI5 — AdminNews super-admin (★★)
IA1: 뉴스 발행 form + 이력 + 카테고리 + Phase 4 OA1 답습

---

## 2. 의뢰 범위 — 5 시안 (사용자 4 + super-admin 1)

| ID | 분류 |
|----|------|
| IU1 | 신규 (About · §6 운영진 실명 ❌ 가드) |
| IU2 | 보강 carry (E1+E2) + cross-domain |
| IU3 | 보강 carry + Glossary 신규 |
| IU4 | 보강 carry (v3) + 평점 분포 |
| IA1 | 신규 (Phase 4 OA1 답습) |

---

**리포트 끝.**
