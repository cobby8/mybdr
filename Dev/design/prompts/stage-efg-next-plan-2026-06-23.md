# STAGE E/F/G 다음 실행 계획 — 2026-06-23

> 기준: PR #754/#755 merge 완료, `dev == main == fc72e9c`.
> 목적: 새 시안이 안정적으로 정착하도록 QA와 다음 Phase를 충돌 없이 배열.

---

## 1. 결론

| 순서 | 작업 | 판단 |
|---|---|---|
| 1 | 일관성 QA 패스 v2.40 | 먼저 진행 권장. 이후 Stage E/F/G가 같은 표준 위에서 생산됨 |
| 2 | STAGE E | Home + legal/offline. 운영 영향 낮고 사용자 첫인상 정리 |
| 3 | STAGE F | 잔여 사용자 흐름. 매칭 M6 이후 실제 사용자 동선 정리 |
| 4 | STAGE G | PA3/referee. 정책/담당 공백이 있어 별도 결재 필요 |

---

## 2. STAGE E — Home + Legal

| 라우트 | 현재 존재 | 권장 처리 |
|---|---:|---|
| `/` | 있음 | 홈 full redesign. 최신 tournament/game/team/community 진입성과 다음카페 카피 보존 |
| `/privacy` | 있음 | 법무성 문구는 유지, 레이아웃/토큰만 정리 |
| `/terms` | 있음 | 법무성 문구는 유지, 레이아웃/토큰만 정리 |
| `/safety` | 있음 | 안전 가이드 레이아웃 정리. DB/API 변경 없음 |
| `/~offline` | 있음 | 오프라인 상태 페이지 토큰/카피 정리 |

원칙: 법적 문구의 의미 변경 금지. UI 렌더링과 정보 구조만 정리합니다.

---

## 3. STAGE F — 잔여 사용자 흐름

| 라우트 | 현재 존재 | 권장 처리 |
|---|---:|---|
| `/lineup-confirm/[matchId]` | 있음 | 라인업 확정 흐름의 모바일/상태/검증 카피 정리 |
| `/games/[id]/edit` | 있음 | 생성폼/상세와 연결되는 수정폼 UI 정합 |
| `/games/[id]/report` | 있음 | M3 출석→평점 이후 리포트 UX 정합 |
| `/games/my-games` | 있음 | M5/M6 반영 상태에서 내 경기 허브 정리 |
| `/guest-apps` | 있음 | 게스트 신청 관리 흐름 정리 |
| `/referee-info` | 있음 | 심판 안내는 공개 정보 페이지로 유지. 기능 확장 금지 |
| `/profile/complete` | 있음 | 프로필 완성 유도와 모달/배너 톤 정합 |

원칙: 매칭 M1~M6에서 이미 만든 데이터 흐름은 건드리지 않고, 화면 구조와 상태 표현만 정리합니다.

---

## 4. STAGE G — 보류/별도 결재

| 항목 | 이유 | 다음 결정 |
|---|---|---|
| PA3 redesign | 대회/단체 관리 정책과 연결됨 | 범위 A/B/C 중 선택 후 착수 |
| referee system | Flutter `/api/v1` 담당 공백, 운영 정책 영향 큼 | 웹 안내 정리와 실제 심판 운영 기능을 분리 |

STAGE G는 디자인만으로 닫기 어렵습니다. PA3와 referee는 DB/API/운영 주체가 얽히므로 QA와 STAGE E/F 완료 후 별도 결재가 안전합니다.

---

## 5. 실행 패키지

| 패키지 | 파일 |
|---|---|
| QA 의뢰 | `design-consistency-qa-brief-2026-06-23.md` |
| QA 전달 | `design-consistency-qa-delivery-2026-06-23.md` |
| QA baseline zip | `Dev/design/_zips/BDR-current-v2.40-QA-baseline-2026-06-23.zip` |
| 다음 의뢰 초안 | STAGE E 착수 시 별도 `stage-e-home-legal-brief-YYYY-MM-DD.md` 작성 |

