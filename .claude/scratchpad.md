# 작업 스크래치패드 (subin-referee 브랜치)

## 🚧 현재 작업 — 헬스체크 봇 2차 완료, 3차 대기
- **상태**: 2차 완료 (커밋 예정), 3차 시작 전 중단
- **현재 담당**: PM (사용자 휴식 또는 3차 승인 대기)

### 봇 계정 (개발 DB)
- Bot-Admin: `bot-admin@healthcheck.bot` (User id=2995, 봇협회 secretary_general)
- Bot-Referee: `bot-referee@healthcheck.bot` (User id=2996, Referee 매칭됨)
- Bot-Guest: `bot-guest@healthcheck.bot` (User id=2997)
- 비밀번호: `.env`의 `BOT_DEFAULT_PASSWORD`
- BOT협회 id=1 (code=`BOT-HEALTHCHECK`)

### 3차 재개 가이드
- `/referee/admin/healthcheck` 대시보드 (super_admin 전용, 최근 run 50개)
- 실패 3회 연속 → `createNotificationBulk`로 super_admin 알림
- 매일 새벽 전체 시나리오 점검 cron (25 페이지 + 37 API + 데이터 무결성)
- 30일 retention 자동 삭제

### 2차 배포 후 수동 확인 필요 (PM 이월)
1. Vercel `dev` 환경변수에 `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `BOT_DEFAULT_PASSWORD`, `APP_URL` 세팅 확인
2. 첫 매시간 정각 후 Vercel Cron 로그에서 200 응답 확인
3. DB `health_check_runs` 테이블에 run 1건 생성 + status=passed/partial 확인

## 🧭 진행 현황표

### v4 (심판 배정 워크플로우) — ✅ 완료
| 단계 | 범위 | 상태 |
|------|------|------|
| 1~3차 | 공고/신청/선정풀/현장배정 통합 | ✅ (fe44f9f) |

### 헬스체크 봇
| 차수 | 범위 | 상태 | 커밋 |
|------|------|------|------|
| 1차 | DB 모델 + 봇 3계정 + requireNotBot 가드(6 API) | ✅ | f254274 |
| 2차 | cron + 8항목 self-fetch 점검 + vercel.json | ✅ | (이번 커밋) |
| 3차 | 대시보드 + 실패 알림 + daily cron + retention | ⏳ 대기 | — |

## 전체 프로젝트 현황 (2026-04-15)
| 항목 | 수치 |
|------|------|
| 웹 페이지 | 84개 |
| 관리자 페이지 | 16개 |
| Prisma 모델 | 87개 (Referee 14개 포함) |
| Web API | 120+ 라우트 + cron 5개 |

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-15 | pm | 헬스체크 봇 2차 — cron API + 8항목 병렬 self-fetch + vercel.json | tester PASS, reviewer APPROVE WITH COMMENTS, clearTimeout 보강 |
| 04-15 | pm | 스크래치패드 정리 (2파일 → 1파일 100줄 이내) | 완료 |
| 04-15 | developer | 헬스체크 봇 2차 중단 지점 docs 기록 (ad48d17) | 완료 |
| 04-13 | developer | 헬스체크 봇 1차 — DB모델 + 봇3계정 + requireNotBot 6API 가드 (f254274) | 완료 |
| 04-13 | developer | 심판 전용 로그인/가입 페이지 (e8edd6d) | tester+reviewer PASS |
| 04-13 | developer | 공고 마감 자동화 + 알림 시스템 (02d5915) | tester+reviewer PASS |
| 04-13 | developer | 관리자 메뉴 역할별 조건부 표시 (df5e9b9) | reviewer APPROVE |
| 04-13 | developer | 정산 2차+3차 — 일괄 처리 + 서류 강화 + 대시보드 (a5d53a7) | tester PASS |
| 04-13 | developer | 정산 1차 — 자동 생성 + 상태 전이 + 단가표 (f75d471) | tester PASS |
| 04-13 | developer | Excel 일괄 사전 등록 — 대량 등록 + 자동 매칭 (9a88ff4) | reviewer APPROVE |
