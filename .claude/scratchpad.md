# 작업 스크래치패드

## 현재 작업
- **요청**: PR-MYBDR-BACKEND 백엔드 3종(B1 동기화/B2 비번재설정/B3 앱버전) → 실제 스키마 재설계 후 구현
- **상태**: 🔨 구현 중 (developer 위임)
- **현재 담당**: developer
- **재설계 결론**: B1=서버 이미 완전구현(tournaments/[id]/matches/sync). 스키마 마이그레이션 0. 남은 작업=B2+B3
  - B2: Resend 활성화(npm i resend, email.ts from mybdr.kr) + 앱용 v1 라우트 2개 + 공통로직 lib 추출(웹 reset 재사용)
  - B3: GET /api/v1/app/version 신규 + Vercel Blob APK 호스팅
  - 수빈 수동: Resend DNS+KEY / APK Blob업로드+sha256·size. 앱측 B2·B3 호출코드 아직 없음(선제준비)
- **현재 담당(이전)**: pm
- **직전 완료(2026-06-16)**: 기록(Records) 출전시간 PBP 재계산(minutes-engine 공용 추출·999버그 회피·종이'–')+평균/누적 파란 토글 → main(PR#713/#714). 갭①②(팀 재검수·프로필 대회상태)→main(PR#711/#712). 후속 권장(라이브 byQuarterSec cap)=검토 후 현행유지(수정불필요).

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

### B2(앱 비번재설정+Resend) + B3(앱버전) — 2026-06-19

📝 구현: 앱용 v1 비밀번호 재설정 라우트 2종 + 공통 lib 추출 + Resend 활성화 + 앱 버전 매니페스트

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| package.json | resend 설치(`npm i resend`, 5 packages) | 수정 |
| src/lib/utils/email.ts | 발신주소 mybdr.co.kr → **mybdr.kr** (주석+DEFAULT_FROM) | 수정 |
| src/lib/auth/password-reset.ts | 공통 lib 신규: requestPasswordReset / confirmPasswordReset | 신규 |
| src/app/api/v1/auth/reset-password-request/route.ts | POST {email} → 항상 200 {ok:true} (enumeration 방지) | 신규 |
| src/app/api/v1/auth/reset-password/route.ts | POST {token,newPassword} → 성공 200 / 만료·무효 410 | 신규 |
| src/app/api/v1/app/version/route.ts | GET 버전 매니페스트 (NextResponse.json + Cache 300s) | 신규 |

🔑 주요 결정:
- **웹 라우트 무수정** (안전선택): api/web/auth/forgot-password·reset-password 는 rate-limit / dev-token 응답 / withdrawn 분기 등 웹 전용 동작이 섞여있어 공통 lib로 리팩터 시 회귀 리스크 큼. → 공통 lib는 신규 생성하되 **v1 라우트 전용**으로만 사용, 웹은 그대로 둠. provider 소셜 skip은 v1 신규요구라 lib에만 구현.
- **규격 일치**: bcryptjs salt rounds=12, 토큰 crypto.randomBytes(32).hex(64자), 만료 30분 — 전부 웹 reset 라우트와 동일.
- **resend 설치 완료**(미설치였음). email.ts는 RESEND_API_KEY 없으면 콘솔 fallback 유지(기존). @vercel/blob 은 이미 설치됨(^2.3.3) — 추가설치 안함.
- **provider 소셜 판정**: provider null/""/"email" = 자체계정→메일발송. google/kakao 등 = skip.
- **B3**: 캐시헤더 위해 apiSuccess 대신 NextResponse.json 직접. LATEST 상수에 초기값(code=1, name=v0.1.0, mandatory=false, apk_url=placeholder, sha256="", size=0). Blob 업로드 절차 3줄 주석 명시.
- **tsc --noEmit 통과** (에러 0).

💡 tester 참고:
- reset-password-request: 존재/미존재/소셜 이메일 모두 **200 {ok:true}** 여야 정상. 형식 틀린 email만 422.
- reset-password: 유효토큰+8자이상 비번 → 200. 만료/무효/재사용 토큰 → **410** code=RESET_TOKEN_INVALID. 비번<8자 또는 빈토큰 → 422.
- 메일 실발송은 RESEND_API_KEY(수빈 수동) 필요 — 키 없으면 콘솔로그로 확인.
- app/version: GET 시 snake_case raw JSON + Cache-Control:public,max-age=300 헤더.

⚠️ reviewer 참고:
- 공통 lib를 웹 라우트에 적용 안 한 판단(중복 일부 잔존 vs 회귀안전) 적절성 검토.
- enumeration 방지: request 라우트가 내부 throw도 catch해 항상 200 유지하는지.

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-06-19 | **proxy.ts PUBLIC_API_ROUTES에 신규 3경로 추가** (reset-password-request/reset-password/app-version) | src/proxy.ts | tester CRITICAL: 화이트리스트 누락→3라우트 전부 401 차단(기능 무력화) |
| 1차 | 2026-06-19 | request 라우트에 IP 기준 rate-limit(login config 20/min, key `v1-reset-pwd:{ip}`, 초과시 429) | v1/auth/reset-password-request/route.ts | reviewer 차단: 공개 엔드포인트 메일폭주 방지 |
| 1차 | 2026-06-19 | confirm 호출을 try/catch로 감싸고 실패시 internalError() | v1/auth/reset-password/route.ts | reviewer 권장1: prisma 실패시 스택노출 방지 |
| 1차 | 2026-06-19 | sendEmail await→fire-and-forget(void+.catch) | lib/auth/password-reset.ts | reviewer 권장2: 미존재/존재 응답 시간차(타이밍 사이드채널) 완화 |

→ 1차 수정 후 tsc --noEmit 재통과(에러 0). proxy 추가로 tester 표 11/12→12/12 예상. 후속(B3 sha256 가드·Resend 모니터링)은 동작영향0 미반영.

## 테스트 결과 (tester)

### B2(앱 비번재설정)+B3(앱버전) 검증 — 2026-06-19

**환경**: dev 서버 localhost:3001 (PID 78724) 실 HTTP curl 테스트.

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 | ✅ 통과 | 에러 0 (exit 0) |
| Prisma 스키마 변경 0 | ✅ 통과 | `git diff prisma/` 비어있음. 운영DB 정책 준수 |
| 스키마 필드명 일치 | ✅ 통과 | passwordDigest/status/provider/reset_token/reset_token_expires 전부 schema.prisma 실재 |
| resend 설치 | ✅ 통과 | package.json `"resend":"^6.14.0"` |
| **app/version** GET → 200 + 캐시헤더 | ✅ 통과 | `cache-control: public, max-age=300` + snake_case raw JSON 확인 |
| reset-request 형식틀린 email → 422 | ✅ 통과 | |
| reset-request 미존재 email → 200 {ok:true} | ✅ 통과 | enumeration 방지 동작 |
| reset-request 빈body/깨진JSON → 422 | ✅ 통과 | |
| reset-password 무효토큰 → 410 RESET_TOKEN_INVALID | ✅ 통과 | code 일치 |
| reset-password 비번<8자 → 422 | ✅ 통과 | |
| reset-password 빈토큰/토큰누락/깨진JSON → 422 | ✅ 통과 | |
| 토큰검증 정합성(유효·재사용·만료) | ✅ 정적통과 | lib가 운영중 웹 reset-password와 byte동일(reset_token+gte만료+사용후 null·rounds=12). 운영DB 무변경 위해 실 비번변경은 생략, 정적검증 갈음 |
| 웹 라우트(api/web/auth/*) 회귀 | ✅ 통과 | 웹 미수정. 영향 0 |

📊 종합: **12개 중 11개 통과 / 1개 실패(❌ critical)**

#### ❌ 실패 — proxy.ts 화이트리스트 누락 (CRITICAL — 라우트는 정상이나 proxy가 전부 401 차단)
- **증상**: JWT 없이 호출 시 신규 3 라우트 전부 **401 UNAUTHORIZED** → 라우트 코드 도달 불가.
  reset-password-request / reset-password / app/version (Bearer 없음) → 모두 401.
- **원인**: `src/proxy.ts` L65~71 `PUBLIC_API_ROUTES`에 신규 3경로 누락. L125~136이 `/api/v1` 중 화이트리스트 외 경로는 Bearer/Token 헤더 없으면 401 early reject.
- **왜 치명적**: 비번재설정은 로그인 전(JWT 없음), app/version은 앱 부팅 시(로그인 전) 호출 → JWT 있을 수 없는데 proxy가 요구 → 정상 사용자 100% 401. 기능 전체 무력화.
- **검증**: 더미 `Authorization: Bearer dummy`로 proxy만 통과시키면 라우트 로직 전부 정상(위 표 200/422/410). **라우트 코드 무결, proxy 화이트리스트만 추가하면 해결.**
- **수정안**: `src/proxy.ts` `PUBLIC_API_ROUTES`에 3줄 추가
  `"/api/v1/auth/reset-password-request"`, `"/api/v1/auth/reset-password"`, `"/api/v1/app/version"`
  (참고: startsWith 매칭 — reset-password가 reset-password-request도 prefix 포함하나 둘 다 공개대상이라 무방. 둘 다 명시 권장)

## 리뷰 결과 (reviewer)

### B2·B3 백엔드 리뷰 — 2026-06-19

📊 종합 판정: **수정 필요** (차단 1 / 권장 2 / 후속 3)

✅ 잘된 점:
- 토큰 규격이 웹 라우트와 **완전 일치**(randomBytes(32) 64자hex / 30분 / bcrypt rounds=12). 회귀 위험 0.
- enumeration 방지가 라우트+lib 이중으로 견고: 미존재/탈퇴/소셜 모두 동일 반환, lib throw도 라우트 try/catch로 흡수해 항상 200 {ok:true}. 에러 로그는 메시지만(토큰값 노출 없음).
- 토큰 일회성: confirm 성공 시 reset_token=null 클리어 → 재사용 차단. findFirst에 `reset_token_expires:{gte:now}` 만료 가드 정확.
- 웹 라우트 무수정 결정 **타당**. 웹은 rate-limit/dev-token/withdrawn 분기가 섞여 리팩터 리스크 큼 → v1 전용 lib 신규는 옳은 트레이드오프(중복 일부 잔존 < 회귀안전).
- B3 캐시헤더 위해 NextResponse.json 직접 사용 + snake_case 수기 작성 일관. placeholder에 TODO 주석 명시.
- 시크릿 노출 없음(RESEND_API_KEY 서버전용, NEXT_PUBLIC_ 위반 0).

🔴 필수 수정 (차단):
- **[v1/auth/reset-password-request/route.ts] rate-limit 부재** — 웹 forgot-password는 `checkRateLimit(login)` 적용(L17-21)인데 v1 신규 라우트엔 **없음**. v1은 인증 게이트(withAuth) 없는 공개 엔드포인트라 무제한 메일 트리거 가능 → ①Resend 발송량 폭주(비용/평판) ②동일 이메일 반복 시 reset_token 계속 덮어쓰기 ③enumeration 외 또 다른 남용 벡터. 웹과 동일하게 IP 기준 rate-limit 추가 필요(`getClientIp` + `checkRateLimit('v1-reset-req:'+ip, RATE_LIMITS.login)`). 초과 시 **429도 enumeration 무관하게 일률 반환**(이메일과 무관한 IP 기준이므로 안전).

🟡 권장 수정:
- **[password-reset.ts L48-56] 타이밍 사이드채널(minor)** — 미존재 이메일은 `findUnique` 1회 후 즉시 return하지만, 존재 이메일은 추가로 `update`+`sendEmail`(네트워크 왕복)까지 수행 → 응답 시간차로 가입여부 추정 가능. 실무상 대부분 무시하지만, 방어하려면 발송을 fire-and-forget(await 안 함)하거나 라우트에서 요청을 비동기 큐로 흘리는 방식 검토. (강제 아님 — rate-limit이 더 우선)
- **[reset-password/route.ts] confirm 라우트 try/catch 부재(minor)** — request 라우트는 try/catch로 throw 흡수하나, confirm은 `confirmPasswordReset` 호출을 감싸지 않음. prisma update 실패 시 Next 기본 500(스택 노출 가능). 웹 라우트처럼 try/catch로 감싸 `internalError()` 반환 권장. (동작 영향: 정상 흐름엔 0, 장애 시 응답 안정성)

🔵 후속 (동작영향 0):
- email.ts `sendEmail`은 Resend 실패 시 {success:false} 반환만 하고 throw 안 함 → request 라우트는 성공으로 간주(enumeration엔 오히려 안전, 의도된 동작). 단 발송 실패 사일런트 → 운영 모니터링(실패율 로그/알림) 후속 고려.
- B3 apk_url placeholder가 `/downloads/placeholder.apk`로 실경로처럼 보임 → 404 응답이긴 하나, 앱이 is_mandatory=false라 다운로드 안 함(현재 안전). 단 실배포 전 sha256="" / size_bytes=0 검증 가드(앱측 또는 라우트에서 빈값이면 latest_version_code를 0/노출안함)는 후속.
- v1 reset 라우트들 OpenAPI/문서 동기화는 앱측 호출코드 작성 시 후속.

## 보류 중 (재개 대기)
- **버킷 B 관리자 계획** — 데이터부재 7기능 신규테이블. 결정 5건 대기(`mock-data-absent-admin-plan-2026-06-14.md`)
- **디자인 일관성 QA 패스** — Claude.ai 산출(bake-fix-checklist) 대기
- **7f28 #301 결선 슬롯** — #301(pbp271 보존) "결승" 오생성 슬롯 잔존(경기 의미 확정 후 재배치). 예선 #291(OT1동점 미종료)·#292(미기록) 대기
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨(편의 기능)
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만)

## 수정 요청 (후속·동작영향0)
| 대상 | 문제 | 상태 |
|------|------|------|
| src/proxy.ts L65~71 PUBLIC_API_ROUTES (CRITICAL, tester) | 신규 3경로 누락 → reset-password-request/reset-password/app/version 전부 401(JWT 없는 로그인전·앱부팅 호출인데 proxy가 토큰 요구). 기능 전체 불통. 화이트리스트에 3줄 추가 시 해결(라우트 코드는 무결 검증됨) | ✅ 완료(1차) |
| v1/auth/reset-password-request/route.ts (blocker) | rate-limit 부재. 공개 엔드포인트라 무제한 메일 트리거 가능(Resend 폭주/토큰 덮어쓰기). 웹 forgot-password처럼 IP기준 checkRateLimit(login) 추가. 초과 시 429 일률 반환 | ✅ 완료(1차) |
| v1/auth/reset-password/route.ts (권장) | confirm 호출에 try/catch 없음 → prisma 실패 시 기본500 스택노출. 웹처럼 try/catch+internalError() 권장 | ✅ 완료(1차) |
| password-reset.ts 타이밍 사이드채널(minor, reviewer 권장2) | 미존재/존재 이메일 응답 시간차 → sendEmail fire-and-forget(void+.catch)으로 완화 | ✅ 완료(1차) |
| scrim-tabs.tsx L295 (critical) | 보낸취소가 URL[id]=from_team 전송→PATCH(to_team 강제) 항상 400. `patchStatus(counterpart.id)` + null가드 필요 | developer 재작업 |
| scrim PATCH 가드(minor) | 수락/거절 captain only(vice/manager 없음)→isCaptain 헬퍼 통일 검토 | 후속 |
| game.ts L44 | game_type=parseInt(영문type)→NaN. 영문↔정수 매핑 필요(기존버그) | 후속 |
| tournament-completed-bracket.tsx L274 | 조내 정렬 승수만(gnba 미세순위차) | 후속 |
| stats / lineup minor | server/client 마크업 중복·C버튼 a11y·badge라벨 | 후속 |

## 완료 Phase (이력 압축)
- ✅ **의뢰서 STAGE1/2 + 갭①② (2026-06-16)** — effectiveTournamentStatus(공개화면)·Admin S1~S3·팀검수·통합디스패처 + 갭①(팀 핵심정보 변경 재검수)·갭②(프로필 대회 종료 표시). 전부 main
- ✅ **기록(Records) 3화면 + 출전시간 PBP 재계산 (2026-06-16, PR#707~714)** — 대회/선수/팀 기록 탭. 공식가드 집계·평점null'–'·21컬럼 box. 출전시간=minutes-engine 공용추출(`match-minutes.ts`)·999truncate회피·종이'–'·평균/누적 파란토글. 라이브 회귀 maxDiff=0
- ✅ **대회종료 후속 (2026-06-15)** — ①우승팀 set-champion ②auto-complete cron ③Phase2/3 백필. champion=Team.id/winner=TT.id 변환
- ✅ **PR-MOCK-TO-REAL ①②③ (`ee1a0c3`) / Phase12 13화면 / LINEUP-V2 / Phase10 5시안 (2026-06-14)**
- ✅ **PR-RECORDER-AUDIT / 대회종료B안 / 9C / Phase1~9 / PR-PERM-DISPLAY** (이전)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-19 | B2(앱 비번재설정+Resend)+B3(앱버전) 구현 (developer) | ✅ resend 설치·email.ts mybdr.kr·공통lib(password-reset.ts)·v1 라우트 3종(reset-request/reset/app-version)·웹 라우트 무수정(안전)·tsc 통과 |
| 2026-06-16 | 기록 출전시간 PBP재계산+토글 main (pm+live-expert) | ✅ 90d67e7→PR#713/#714. minutes-engine 공용추출·999회피·종이'–'·파란토글. 라이브 회귀 maxDiff=0·vitest21/21. knowledge 3파일 기록 |
| 2026-06-16 | 갭①② main 머지 (pm) | ✅ 1bf805f/7cfe0a8 → PR#711/#712 main. 선별커밋으로 멀티세션 충돌0·미푸시0 |
| 2026-06-16 | 갭①② 검증 (tester/reviewer) | ✅ tester 10/10·reviewer 통과(차단0). 변경 2파일 tsc0 |
| 2026-06-16 | 갭① 팀PATCH 재검수 + 갭② 프로필 보정 (developer) | ✅ active+식별정보 실변경만 pending_review / basketball effectiveTournamentStatus(camel 정정) |
| 2026-06-16 | 의뢰서 STAGE1/2 갭 검증 (Explore) | 본체 완료 확인 + 갭2개 발견(로고변경 재검수 / 프로필 dead code→basketball 실파일) |
| 2026-06-16 | 기록(Records) 3화면 운영반영 (타 세션) | ✅ PR#707~712 main. 공식가드 집계 |
| 2026-06-16 | STAGE1 effectiveStatus main머지 + 작업트리 정리 (pm) | ✅ 502fe53/ec2d7b7·gallery stash 보존 |
| 2026-06-15 | Admin S1~S3 + 팀검수 + 시즌시상 + 코트제보 (다수) | ✅ main. reviewer 전건 APPROVE |
| 2026-06-15 | 대회종료 후속 ①②③ (planner+dev) | ✅ set-champion/auto-complete cron·Phase2/3 백필 |
| 2026-06-15 | Phase1 대회상태 표시레이어 (dev) | ✅ effectiveTournamentStatus+10파일·테스트8 |
