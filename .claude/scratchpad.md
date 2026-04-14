# 작업 스크래치패드

## 현재 작업
- **요청**: 중간 정리 (knowledge 갱신 + scratchpad 정리 + dev PR)
- **상태**: 진행중
- **현재 담당**: pm

## 전체 프로젝트 현황 대시보드 (2026-04-15)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 87개 (Referee 시스템 14개 추가) |
| Web API | 120+ 라우트 |
| subin 커밋 (dev 대비) | ~46개 |

## 기획설계 (planner-architect)
(완료된 내용은 knowledge/decisions.md로 이관)

### Phase 2 (진행중): 팀명 한글+영문 구조화
- 2A-1 ✅ Team.name_en + name_primary 컬럼 추가 (커밋 66e6736)
- 2A-2 ⏸ API + Zod + 검색 (대기)
- 2B ⏸ 생성/수정 폼 UI
- 2C ⏸ 표시 UI 일괄 반영
- 2D ⏸ tester 검증

## 구현 기록 (developer)

### Phase 2A-2: Team name_en/name_primary API/Zod/검색 반영 (2026-04-13)

📝 구현한 기능: 한/영 팀명 구조의 API 응답/검색 경로 완결
  - 이미 Zod 스키마 + 생성/수정 액션/라우트는 Phase 2A-1에서 정비되어 있었음
  - 이번엔 "응답 직렬화"와 "검색"과 "FE 타입"의 누락 부분만 채움

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/teams/route.ts | GET 직렬화 반환에 name_en, name_primary 추가 | 수정 |
| src/app/api/web/tournaments/[id]/public-teams/route.ts | team select + 반환(teamNameEn, teamNamePrimary)에 영문명/대표언어 추가 | 수정 |
| src/app/api/web/search/route.ts | 팀 검색 where를 name/name_en OR로 확장 + select에 영문명/대표언어 추가 | 수정 |
| src/app/(web)/teams/_components/teams-content.tsx | TeamFromApi 타입에 name_en, name_primary 추가 | 수정 |
| src/app/api/web/teams/[id]/route.ts | founded_year null 가드 추가 (nullable schema 대응) | 수정 |

💡 tester 참고:
- 테스트 방법
  1. `/api/web/teams?q=eagle` — name_en에 "Eagle" 포함된 팀이 검색되는지
  2. `/api/web/teams` 응답 → teams[].name_en, name_primary 필드가 존재하는지
  3. `/api/web/search?q=eagle` → teams 배열이 name_en 매칭으로 잡히는지
  4. `/api/web/tournaments/{uuid}/public-teams` → teams[].teamNameEn, teamNamePrimary 필드 확인
  5. 팀 생성: POST /api/web/teams에 name_en="BDR-Eagle 01", name_primary="en" 전달 시 저장 성공
  6. 팀 수정: PATCH에 name_en="가나다"(한글) → 400 INVALID_INPUT 반환 (엄격 정규식 동작 확인)
- 정상 동작
  - 기존 팀(name_en NULL)은 그대로 NULL 유지되고 응답에도 null로 내려옴
  - name_primary 지정 없으면 기본 "ko"
  - 한글 q로 검색해도 name LIKE는 여전히 동작
- 주의할 입력
  - name_en="" (빈문자열) → null 자동 치환 (preprocess)
  - name_en="   " → null 자동 치환 (trim 후 empty)
  - name_en="한글" → 400
  - name_en="A-B C 01" → 저장 성공 (하이픈/공백/숫자 OK)
  - name_en 길이 81+ → 400

⚠️ reviewer 참고:
- founded_year null 가드는 이번 타입 검증에서 발견된 기존 버그(nullable schema인데 `< 1900 || >` 직접 비교)를 최소 수정으로 방어한 것. 실제 동작 변화는 없지만 null 전달 시 이제 안전하게 NULL로 저장됨.
- teams-content.tsx는 타입만 추가했고 UI는 건드리지 않음 (Phase 2C에서 처리 예정).
- public-teams 응답 key는 teamNameEn/teamNamePrimary (camelCase)로 넣음 — 기존 teamName과 동일한 네이밍 룰 유지.

## 테스트 결과 (tester)
(대진표 시스템 일괄 tester 검증 보류 — dev 머지 후 진행 예정)

## 리뷰 결과 (reviewer)
(아직 없음)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## ⚠️ 원영에게 공유 필요
- `db push --accept-data-loss`로 개발 DB의 referee/association 23행 삭제
- schema 구조는 복원(커밋 66e6736), 데이터는 빈 상태
- subin-referee 작업 시 데이터 재입력 필요할 수 있음
- 상세 내용: .claude/knowledge/errors.md (2026-04-15 항목)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-15 | pm | 중간 정리: knowledge 갱신(6파일) + scratchpad 대청소 | 진행중 |
| 04-15 | developer | Phase 2A-1: Team.name_en/name_primary + Referee 14모델 schema 통합 (커밋 66e6736) | ✅ 완료 |
| 04-15 | developer | 참가팀 탭 → TeamCard 재사용 UI 통일 (커밋 2b69d12) | ✅ 완료 |
| 04-15 | developer | 대진표 박스 모바일 확장 + 좌/우 슬라이드 버튼 (커밋 02a3b6e) | ✅ 완료 |
| 04-15 | developer | 대진표 카드 20% 확대 + 헤더 카드 위 이동 (커밋 2f9c96e) | ✅ 완료 |
| 04-15 | developer | 대진표 박스 입체감 + 라운드 헤더 강조 중앙정렬 (커밋 f5b8c8a) | ✅ 완료 |
| 04-14 | developer | 토너먼트 카드 시인성 개선 — 라운딩 최소화/개별 카드 분리/색상 강화 (커밋 e71fd80) | ✅ 완료 |
| 04-14 | developer | 토너먼트 좌측 세로 띠 유니폼 색상 적용 (커밋 50877db) | ✅ 완료 |
| 04-14 | developer | 로고 없는 팀 플레이스홀더 유니폼색+지역명 (커밋 966e72e) | ✅ 완료 |
| 04-14 | developer | 참가팀/팀 목록 반응형 카드 그리드 통일 (커밋 fc194e6) | ✅ 완료 |

<!--
이전 작업 요약 (04-13~14, knowledge/architecture.md에 상세 기록)

대진표 시스템 구현 (Phase 1~4a):
- Phase 1 풀리그 순위표 (4145268)
- Phase 2A 리그 완료 시 토너먼트 자동 생성 (8fcd06e)
- Phase 2B 시드 뱃지 (2739aef)
- Phase 2C 뼈대 미리 생성 + 슬롯 라벨 (1379062)
- Phase 3 admin wizard 포맷 세부설정 (5d4c5bb)
- Phase 4a 풀리그 경기 자동 생성 (9704f2d)

대회 상세 페이지 개편:
- 순위 탭 제거 → 대진표에 통합 (6edf9a2)
- NBA 스타일 트리 디자인 (e2c311b, 179e959, 0b5e4c1)
- 사이드바 제거 + 히어로 통합 (93f55da, 23702b2)
- 히어로 액션 버튼 + 탭 디자인 (dabd446)
- 대시보드 3카드 (f3f3aa3, d722f40)

팀 관련:
- 대회 선수 userId 자동 연결 시스템 (de07913)
- 팀명/선수명 Link 전역 적용 (52bd6d4)
- 팀 전적 실시간 집계 + 무승부 삭제 (74f9e34)
- 중복팀 병합 + 지역 설정 + userId 연결 (수동 작업)

모바일 UI:
- 대진표 탭 모바일 꽉채우기 (7c180cd)
- 히어로 2줄 + 참가현황 바 (3e17391)
- 대회 히어로 인디케이터/문의/캘린더 (23702b2)
-->
