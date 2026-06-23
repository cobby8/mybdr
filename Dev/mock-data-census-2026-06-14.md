# 더미데이터 전수조사 + 실연결 분류 (2026-06-14)

> 방법: src/ 전반 mock/더미/준비중 패턴 스캔(Explore 에이전트) + schema.prisma 실측(테이블 존재 여부).
> ★ 핵심 발견: "DB 0%"로 더미 박제된 페이지 다수가 **실제로는 연결 가능한 테이블 보유** ([[lesson-sian-db-assumption]] 함정 재발 — 시안 "DB 미보유" 가정 ≠ 운영 실측).

---

## 1. 요약 (3 버킷)

| 버킷 | 의미 | 페이지 수 | 처리 |
|------|------|---------|------|
| **A. 즉시 연결 가능** | 실데이터 테이블 존재 → 더미 제거 + 집계 연결 | 7 | CLI 박제 의뢰서 (`mock-to-realdata-bake-cli-prompt-2026-06-14.md`) |
| **B. 데이터 부재** | 백킹 테이블 0 → 관리자 관리 체계 필요 | 7 | 관리자 관리 계획 (`mock-data-absent-admin-plan-2026-06-14.md`) |
| **C. 정적/정상** | 의도된 정적 콘텐츠 (더미 아님) | 다수 | 조치 불필요 |

---

## 2. 버킷 A — 즉시 연결 가능 (실데이터 존재) ★ 진행 대상

| 라우트 | 현재(더미) | 실연결 소스(실측) | 비고 |
|--------|-----------|-------------------|------|
| **/stats** ⭐ | TOTALS/ZONES/SPLITS/GAME_LOG/RANKINGS 전부 더미 ("DB 0%" 오판) | **UserSeasonStat**(시즌 집계) + **ShotZoneStat**(슈팅존) + **MatchPlayerStat**(경기/랭킹) | 3 테이블 정확 매칭. 최우선·최고가치 |
| **/calendar** | EVENTS 17건 + TODAY 하드코딩 | **court_events**(event_date/time/title) + 본인 tournament 참가 일정 | 본인 일정 집계 |
| **/about 통계4** | 통계 예시값 + "운영 시점 연동" | users/teams/tournaments/courts **count 집계** | 트리비얼 연결 |
| **/scrim** | OPEN_REQS/INCOMING/OUTGOING/HISTORY 더미 | **team_match_requests** (팀 매치 요청 = 스크림) | ★의도 확인 후 연결 |
| **/team-invite** | team/inviter/invite/ROSTER 인라인 더미 | **team_join_requests** / **TeamMemberRequest** | 토큰 UX→기존 요청 모델 매핑 |
| **/saved (부분)** | 5탭 빈 더미 (2탭 실연결) | board_favorites + user_favorite_courts(실) / 게시글·코트만 | 나머지 탭(경기/대회/팀) = 부재(B) |
| **/awards (부분)** | 6필드 "준비중" 배지 | UserSeasonStat(mvp_count/rank) + rankings 집계(기본부) | 고급필드(올스타/MVP코멘트/감독)=부재(B) |

> ⚠️ 데이터 **유무**(populated)는 운영 DB count 로 CLI 가 박제 시 실측. 행 0 = 빈 상태(정상), 더미 복원 ❌.

---

## 3. 버킷 B — 데이터 부재 (테이블 0) → 관리자 관리 계획

| 라우트/기능 | 현재 | 부재 모델 | 관리 방향(상세=admin-plan) |
|------------|------|----------|---------------------------|
| **/shop** | Hero+빈상태 | 상품/주문 테이블 0 | 관리자 상품 CRUD + 노출 토글 |
| **/coaches** | 카테고리칩+빈상태 | 코치 디렉토리 0 | 코치 등록(role/신규) + 관리자 승인 |
| **/gallery** | 헤더+빈상태 | 앨범/사진(news_photo만 부분) | 관리자 앨범 관리 or news_photo 재사용 |
| **/messages** | THREADS 더미 | 쪽지/스레드 0 (Phase 9 의도 보류) | 기능 신설 결정 필요(관리자 아님) |
| **/courts/submit** | 제보폼 더미 | court_submissions 0 | 관리자 제보 승인 큐 |
| **/tournaments/[id]/referee-request** | REFEREES_MOCK 6 | web 심판요청 0 (심판플랫폼은 존재) | 심판 배정 시스템 연결 |
| **/awards 고급필드** | 올스타/MVP코멘트/감독/루키 "준비중" | all_star/mvp_quote/coach_user_id 0 | 관리자 시상 입력 폼 |

---

## 4. 버킷 C — 정적/정상 (조치 불필요)

- **/safety** — 안전가이드 6카드 = 정상 운영 콘텐츠(더미 아님)
- **/referee-info** — 심판 제도 안내 = 정적 SEO 콘텐츠
- **/series/[slug]**, **/profile/edit** — 실 Prisma 연동 완료
- **/onboarding/setup** 선택지(POSITIONS/LEVELS 등) = enum 상수(정상). 단 통계 카드 더미는 버킷 A /about 과 함께 처리 가능
- 각종 "준비중" status 라벨 = UI enum (더미 아님)

---

## 5. 후속

- 버킷 A → `mock-to-realdata-bake-cli-prompt-2026-06-14.md` (CLI 즉시 연결 박제)
- 버킷 B → `mock-data-absent-admin-plan-2026-06-14.md` (관리자 관리 체계 계획)
- ★ 회귀 교훈: 시안 박제 시 "DB 0%" 자기진단을 schema 실측 1회로 검증 의무화 ([[lesson-sian-db-assumption]] 강화).
