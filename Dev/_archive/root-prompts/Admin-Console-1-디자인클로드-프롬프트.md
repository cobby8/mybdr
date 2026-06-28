# 디자인 클로드용 프롬프트 (BDR v2.32 프로젝트에 붙여넣기)

> 백엔드 실측 회신이 도착했습니다. Admin Console 콘솔을 아래 4건으로 갱신해 주세요. **운영 코드 변경 0 · 시안/data.js만.**

## 1) 응답 키 = snake_case 고정 (계약 정정)
운영 API 표준이 응답을 자동 snake_case 변환합니다. 콘솔 바인딩·계약 예시를 전부 snake_case로:
- `createdAt → created_at` · `snoozedUntil → snoozed_until` · `nextCursor → next_cursor`
- IMPLEMENTATION-SPEC §1-A/§1-B 응답 예시의 모든 camelCase 키를 snake_case로 교체.

## 2) games.status 실제 enum (placeholder 폐기)
콘솔 `GAME_STATUS_MAP` 을 실측값으로:
- `1=모집중` · `2=확정` · `3=완료` · `4=취소` · `0=기본/미정(라벨없음)`
- ‘마감임박/진행중’ 별도 status 없음 → 파생 라벨로만(원하면). 색은 `--color-status-open / -confirmed / --color-badge-gray / --color-status-cancelled`.

## 3) RBAC = 실재 2역할
운영 enforcement 실재 = `super_admin` · `association_admin` 2개뿐. `org_admin/content_admin` 은 미사용(희망값).
- 역할 전환기(데모)는 유지하되, **실 권한 표기는 2역할 기준**. Site=super_admin / Series=association_admin. Court·콘텐츠 분리는 “신규 role 도입 필요(S4)” 라벨로.

## 4) ‘즉시’ 중 3건은 처리 라우트 신규
조회는 OK, **처리(mutation)는 신규**: 매너 검토 · 제안·피드백 · 팀 검수. → 해당 화면 처리 버튼에 “API 신규(S1)” 표기. (커뮤니티는 기존 `/community/[id]` PATCH 재사용 가능)

## 5) FEAS / 커버리지
- FEAS 등급은 이미 실측 반영됨(유지).
- 커버리지표 “미설계 5(analytics·campaigns·logs·settings·suggestions)” → 전부 page 존재이므로 `gap→partial/ok` 정정.

→ 갱신 후 §7 양식으로 회신 주시면 CLI 구현(S2)과 동기화합니다.
