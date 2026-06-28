# 작업 스크래치패드

> 2026-06-28 세션정리: 564줄→압축. PR-1~5·R0~R7 구현 상세는 **git log** + `knowledge/` 참조.

## 현재 작업
- **요청**: 관리자 영역 **클린 슬레이트 그린필드 리빌딩**(2차 피벗 2026-06-28). 1차 그린필드(M1~M3)가 레거시 CSS/셸 재사용으로 시안 깔끔함 미달→전량 폐기. 시안 정본 1:1 충실 포팅·**백엔드 유지(0변경 원칙)**·DB 보전 절대.
- **★상태: 전 영역 그린필드 리빌딩 완료** (R1 토대→R2 백오피스→R3 대회관리자→R4 대회운영→R5 마법사→R6 협력/심판/평가·정산). 전부 정본 1:1·tsc+next build·회귀0·푸시·vercel 반영.
  - 신규 경로: 백오피스 `/v2`(`(admin-v2)/v2/(backoffice)`)·대회관리자 `/v2/ta`·대회운영 `/v2/operate/[id]`·마법사 `/v2/ta/tournaments/new·[id]/edit`·협력 `/partner`·심판 `/referee-console`. 디자인=`components/admin-v2`+`styles/admin-v2`+`lib/admin-v2/data`(adminFetch snake↔camel 1곳·rawBody 우회). READ=서버 Prisma직접(snake함정 차단)·mutation=adminFetch.
  - **유일 백엔드 추가**=R6-C 신규테이블 2개(`referee_evaluations`·`partner_settlements`·무중단 CREATE·db push 완료·사용자 승인). 그 외 전부 기존 API 리스킨.
- **★컷오버 진행 중**(R7·리다이렉트 점진·`/v2` 유지·사용자 결정): R7-A✅ 준비영역(대회관리자+백오피스 매칭제외) `next.config.ts` 308 redirect 17건. 레거시 무손상·롤백=규칙제거.
- **남은 컷오버 블로커 4건**(이거 해결→그 영역 redirect): ①대회운영 일정 영속화(bulk저장 엔드포인트 부재·백엔드 설계 필요) ②매칭 콘솔(BO-2·조회API 신설) ③심판 배정생성+신청관리(기존API 포팅·cross-assoc IDOR 한계) ④협력 편집폼(기존API 리스킨·가장 쉬움). 추천순=④→②→③→①. 최종=레거시 `_legacy-archive/` 정리.
- **미결 결정**: 매칭 deep-link vs 포팅 / 심판 스코프(협회 vs 글로벌super·현재 글로벌) / `/admin/analytics` redirect(보수적 제외 중).
- **운영**: 단독(dev 직접·subin폐지). dev→main 머지=수빈 단독. **동시 다세션** 빈번(git락·scratchpad·브랜치레이스 주의).

## 진행 현황표 (대기/후속만)
| 작업 | 상태 |
|------|------|
| gallery P2 (news_photo 실연결) | ⏸️ `stash@{0}` 보관·복원 시 `git stash pop` |
| 버킷B 관리자 잔여(시상/코치/갤러리/심판/샵/쪽지) | ⏸️ 결정 대기 `mock-data-absent-admin-plan-2026-06-14.md` |
| 대회상태 Phase2/3 후속 | ⏸️ 일부 백필 완료·잔여 대기 |
| 컷오버 블로커 4건(위) | ⏳ 포팅 대기 |

## 보류 중 (재개 대기)
- **버킷 B 관리자** — 데이터부재 7기능 신규테이블·결정 5건.
- **7f28 #301 결선 슬롯** — "결승" 오생성 슬롯 잔존(예선 #291 OT1동점 미종료·#292 미기록).
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨.
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만).

## 수정 요청 (minor·후속)
- scrim PATCH 가드(captain only→isCaptain 통일) / apply-panel L510/536 raw rgba(룰10 경미) / completed-bracket L274 조내정렬 / stats·lineup 마크업·a11y.
- admin-v2 후속: 대회운영 일정저장·대진 드래그(엔드포인트 부재) / 심판 cross-assoc mutation 403(데이터~0 수용) / AdminCategory GET super전용 / payments·plans 상세·news/anonymous·BO-2매칭·court-partner(DB無) = 컷오버 블로커/후속.

## 🔒 §0 공통 필드 대조표 (픽업/매칭 도메인 reference)
- 시간 `scheduled_at`/길이 `duration_hours`(분아님)/정원 `max_participants`/승인참가 `current_participants`/참가비 `fee_per_person`(0=무료)
- 좌표=games에 없음→courts 조인. 신청 `game_applications`·status **Int** 0신청·1승인·2거절·3대기
- **game status**: 1모집·2확정·3완료·4취소 / game_type **Int**: 0픽업·1게스트·2연습
- 출석=`game_applications.attended_at`/노쇼=`game_player_ratings.is_noshow`/매너=`users.manner_score`+`manner_count`
> 대회 도메인 필드 = `Dev/design/BDR v2.41-admin-toss/_PR0-CONTRACT-CONFIRMED.md §5`. snake↔camel = apiSuccess 자동변환(errors.md 다수).

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-28 | admin-v2 마법사 publish 종별별 참가비 모달 보강 | ✅ 생성/수정 wizard+workspace.css(ct-feerow/feeapply 이식)·form.divisions[].fee 양방향·payload0변경·tsc0·미커밋 |
| 2026-06-28 | R7-A 컷오버 redirect (준비영역) | ✅ next.config 308 17건·ready→그린필드·블로커 레거시유지·검증·푸시 |
| 2026-06-28 | R6-C 평가/정산 + db push | ✅ 신규테이블2(무중단)·평가/정산 화면+API2·그린필드 전영역 완료 |
| 2026-06-28 | R6-A/B 협력·심판 콘솔 | ✅ /partner·/referee-console 기존백엔드 리스킨·회귀0 |
| 2026-06-28 | R5-A/B 마법사 + 종별/복사 보강 | ✅ 생성/수정 5단계·종별템플릿/연령자동·대회복사(평면구조 버그 수정) |
| 2026-06-28 | R4 대회운영 6메뉴 | ✅ 참가팀/대진표/일정/운영관리/사이트/정산·기존엔드포인트 재사용 |
| 2026-06-28 | R3 대회관리자 5화면 + 셸분리 | ✅ /v2/ta 별도콘솔·(backoffice)그룹 이동·URL보존·organizer-scoped |
| 2026-06-28 | R2 백오피스 BO-0/1/3/4/5 | ✅ 유저/마케팅/결제/요금제/커뮤니티/코트·시각보정(타이포누수 H1) |
| 2026-06-28 | R0/R1 클린슬레이트 토대 | ✅ 실패그린필드 제거·정본CSS verbatim·kit/shell/blocks 1:1·쇼케이스 합격 |
| 2026-06-28 | 운영 DB 정리(대회4·더미경기17·상태변경) | ✅ 조회→근거→삭제→검증·cascade·코드0 |
