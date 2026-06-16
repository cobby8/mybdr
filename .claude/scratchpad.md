# 작업 스크래치패드

## 현재 작업
- **요청**: (없음 — 직전 작업 완료)
- **상태**: ✅ 대기 (다음 작업 준비)
- **현재 담당**: pm
- **직전 완료(2026-06-16)**: 의뢰서 STAGE1/2 갭①②(팀 재검수·프로필 대회상태 보정) → main 반영(PR#711/#712). 기록(Records) 3화면은 타 세션 main 반영.

## 진행 현황표 (대기/후속만)
| 작업 | 상태 |
|------|------|
| gallery P2 (news_photo 실연결) | ⏸️ `stash@{0}` 보관 — 다른 세션 작업물. 복원 시 `git stash pop` |
| scrim 보낸취소 [id] 버그 | ⏳ developer 재작업 (아래 수정요청 표) |
| 버킷B 관리자 잔여(시상/코치/갤러리/심판/샵/쪽지) | ⏸️ 결정 대기 `mock-data-absent-admin-plan-2026-06-14.md` |
| 대회상태 Phase2/3 후속 | ⏸️ 실진행/공지전용 백필 일부 완료, 잔여 대기 |

## 기획설계 (planner-architect)
(완료분은 작업 로그로 압축 — 신규 작업 시 기록)

## 구현 기록 (developer)
(완료분은 작업 로그로 압축 — 신규 작업 시 기록)

## 테스트 결과 (tester)
(완료분은 작업 로그로 압축)

## 리뷰 결과 (reviewer)
(완료분은 작업 로그로 압축)

## 보류 중 (재개 대기)
- **버킷 B 관리자 계획** — 데이터부재 7기능 신규테이블. 결정 5건 대기(`mock-data-absent-admin-plan-2026-06-14.md`)
- **디자인 일관성 QA 패스** — Claude.ai 산출(bake-fix-checklist) 대기
- **7f28 #301 결선 슬롯** — #301(pbp271 보존) "결승" 오생성 슬롯 잔존(경기 의미 확정 후 재배치). 예선 #291(OT1동점 미종료)·#292(미기록) 대기
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨(편의 기능)
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만)

## 수정 요청 (후속·동작영향0)
| 대상 | 문제 | 상태 |
|------|------|------|
| scrim-tabs.tsx L295 (critical) | 보낸취소가 URL[id]=from_team 전송→PATCH(to_team 강제) 항상 400. `patchStatus(counterpart.id)` + null가드 필요 | developer 재작업 |
| scrim PATCH 가드(minor) | 수락/거절 captain only(vice/manager 없음)→isCaptain 헬퍼 통일 검토 | 후속 |
| game.ts L44 | game_type=parseInt(영문type)→NaN. 영문↔정수 매핑 필요(기존버그) | 후속 |
| tournament-completed-bracket.tsx L274 | 조내 정렬 승수만(gnba 미세순위차) | 후속 |
| stats / lineup minor | server/client 마크업 중복·C버튼 a11y·badge라벨 | 후속 |

## 완료 Phase (이력 압축)
- ✅ **의뢰서 STAGE1/2 + 갭①② (2026-06-16)** — effectiveTournamentStatus(공개화면)·Admin S1~S3·팀검수·통합디스패처 + 갭①(팀 핵심정보 변경 재검수)·갭②(프로필 대회 종료 표시). 전부 main
- ✅ **기록(Records) 3화면 (2026-06-16, PR#707~712)** — 대회/선수/팀 기록 탭. 공식가드 집계·평점null'–'·21컬럼 box
- ✅ **대회종료 후속 (2026-06-15)** — ①우승팀 set-champion ②auto-complete cron ③Phase2/3 백필. champion=Team.id/winner=TT.id 변환
- ✅ **PR-MOCK-TO-REAL ①②③ (`ee1a0c3`) / Phase12 13화면 / LINEUP-V2 / Phase10 5시안 (2026-06-14)**
- ✅ **PR-RECORDER-AUDIT / 대회종료B안 / 9C / Phase1~9 / PR-PERM-DISPLAY** (이전)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-16 | 갭①② main 머지 (pm) | ✅ 1bf805f/7cfe0a8 → PR#711/#712 main. 선별커밋으로 멀티세션 충돌0·미푸시0 |
| 2026-06-16 | 갭①② 검증 (tester/reviewer) | ✅ tester 10/10·reviewer 통과(차단0). 변경 2파일 tsc0 |
| 2026-06-16 | 갭① 팀PATCH 재검수 + 갭② 프로필 보정 (developer) | ✅ active+식별정보 실변경만 pending_review / basketball effectiveTournamentStatus(camel 정정) |
| 2026-06-16 | 의뢰서 STAGE1/2 갭 검증 (Explore) | 본체 완료 확인 + 갭2개 발견(로고변경 재검수 / 프로필 dead code→basketball 실파일) |
| 2026-06-16 | 기록(Records) 3화면 운영반영 (타 세션) | ✅ PR#707~712 main. 공식가드 집계 |
| 2026-06-16 | STAGE1 effectiveStatus main머지 + 작업트리 정리 (pm) | ✅ 502fe53/ec2d7b7·gallery stash 보존 |
| 2026-06-15 | Admin S1~S3 + 팀검수 + 시즌시상 + 코트제보 (다수) | ✅ main. reviewer 전건 APPROVE |
| 2026-06-15 | 대회종료 후속 ①②③ (planner+dev) | ✅ set-champion/auto-complete cron·Phase2/3 백필 |
| 2026-06-15 | Phase1 대회상태 표시레이어 (dev) | ✅ effectiveTournamentStatus+10파일·테스트8 |
| 2026-06-14 | MOCK-TO-REAL①②③ / Phase12 13화면 / LINEUP-V2 (다수) | ✅ main(ee1a0c3 등) |
