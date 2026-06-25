# Conventions

## 대회 포맷 표준
- 신규 대회/종별 운영 방식은 `토너먼트`, `풀리그`, `듀얼토너먼트`, `조별리그+토너먼트`, `링크제`, `조별리그+동순위 순위결정전` 6개만 사용한다.
- DB 값은 각각 `single_elimination`, `round_robin`, `dual_tournament`, `group_stage_knockout`, `league_advancement`, `group_stage_with_ranking`을 쓴다.
- `double_elimination`, `full_league_knockout`, `swiss`, `league`, `round_robin|single_elimination`은 과거 데이터 표시용 fallback으로만 취급하고 신규 선택지에는 노출하지 않는다.
- 포맷 한글 표기는 `src/lib/tournaments/division-formats.ts`와 `src/lib/constants/tournament-status.ts` 기준으로 통일한다.

## 운영 화면 데이터 배선
- 운영 `src/` 화면은 더미/mock/샘플 데이터로 완성된 것처럼 표시하지 않는다.
- 프론트 표시값은 실제 DB/API 배선이 확인된 값만 노출한다.
- 새 표시값은 관리자 입력, 저장 API, DB, 공개 API/페이지까지 한 흐름으로 연결한다.
- 데이터 배선이 끝나지 않은 기능은 숨기거나 미완료 상태를 명시한다.
- 더미 데이터는 테스트, 시안, 스토리 전용 영역에만 허용한다.
