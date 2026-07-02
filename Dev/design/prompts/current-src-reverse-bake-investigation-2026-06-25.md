# 운영 src ↔ BDR-current 역박제 사전 조사 — 2026-06-25

> 목적: 기존 `BDR-current` 기준 QA 의뢰가 현재 운영 화면 변경분을 놓치는지 확인.
> 결론: 놓친다. 먼저 운영 `src/` 전수 인벤토리와 역박제 갭 산출이 필요하다.

---

## 1. 기준점

| 항목 | 값 |
|---|---|
| 현재 브랜치 | `dev` |
| BDR-current 마지막 반영 | `5dbc9b4` — `design(sync): v2.40 admin console BDR-current 반영` |
| BDR-current 마지막 반영 시각 | 2026-06-23 18:03:59 +0900 |
| 조사 기준 | `5dbc9b4` 이후 운영 `src/app`, `src/components`, `src/lib`, `prisma/schema.prisma` 변경 |

---

## 2. 확인된 최신 운영 변경 축

| 축 | 관련 커밋/파일 | 역박제 필요성 |
|---|---|---|
| 대회 운영 워크스페이스 재구성 | `6a64e70`, `deba031`, `db2a2cd`, `c8ce40d`, `56404b7`, `943c37d` / `src/app/(admin)/tournament-admin/...` | 높음. BDR-current v2.40 콘솔 handoff 이후 실제 운영 워크스페이스가 계속 바뀜 |
| 대회 생성/관리 상세 흐름 | `85bab07`, `20747e5`, `5c7c152`, `517aa24` / 생성 wizard, divisions, teams panel, uniform rule | 높음. 운영 데이터 흐름과 화면 상태가 시안보다 앞설 가능성 큼 |
| 장소/길안내 UX | `85bab07`, `71751f5` / Kakao 장소 검색, 공개 일정 directions fallback | 중~높음. 사용자 대회 상세/일정과 관리자 생성폼 양쪽 영향 |
| 기록앱 영향 관리자 UI | `7c8872b`, `5625cc3`, `62ca351`, `b21655b`, `844bc45`, `899916b` / `/admin/agents`, logs | 높음. BDR-current v2.40 이후 새 admin agents 화면군 추가 |
| 심판/경기원 라벨 정리 | `1919ffa`, `4da995a`, `66339e8`, `482b0d1` / association wizard, referee validation/events | 중간. 카피/라벨 표준화 역박제 필요 |
| 엘리트 선수 배지 | `fbaa273` / profile, user hero | 중간. 사용자 프로필/유저 상세 표기 변화 |
| 멤버십/구독 권한 표시 | `f6b7dea` / pricing, profile, admin users/plans, layout | 중간. 권한/구독 카피와 뱃지 표현 정합 필요 |

---

## 3. 기존 QA 의뢰의 문제

| 기존 접근 | 문제 |
|---|---|
| `BDR-current-v2.40-QA-baseline-2026-06-23.zip`만 첨부 | 최신 운영 `src/` 변경을 Claude.ai가 볼 수 없음 |
| BDR-current 기준 일관성 QA | stale 시안끼리만 정합되어 운영과 더 멀어질 수 있음 |
| STAGE E 병행 | QA 표준이 운영 최신 기준이 아니면 E 산출물도 다시 고쳐야 함 |

---

## 4. 새 의뢰 방향

1. 운영 `src/app/(web)`, `src/app/(admin)`, `src/components` 전수 인벤토리.
2. `Dev/design/BDR-current`와 대응 여부 비교.
3. 운영에는 있는데 시안에 없거나 오래된 화면/컴포넌트를 `_qa/reverse-bake-gap.md`로 산출.
4. 역박제 우선순위(P0~P2) 확정.
5. 그 다음 토큰/패턴/간격 일관성 QA.

---

## 5. 새 첨부 패키지

| 파일 | 용도 |
|---|---|
| `current-src-reverse-bake-qa-brief-2026-06-25.md` | 상세 의뢰서 |
| `current-src-reverse-bake-qa-delivery-2026-06-25.md` | Claude.ai paste 본문 |
| `BDR-current-plus-src-reverse-QA-2026-06-25.zip` | 운영 src + BDR-current + 프로젝트 디자인 지식 첨부 |

