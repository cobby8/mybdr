# 심판/경기원 플랫폼 구축 스크래치패드 (subin-referee 브랜치)

---

## 📌 현재 작업
- **요청**: v3 아키텍처 — 협회 주도 사전 등록 + 유저 매칭 시스템
- **상태**: 1차 구현 완료, tester 검증 대기
- **현재 담당**: developer (구현 완료)

## 🧭 진행 현황표

### v2 (MVP 1차) — ✅ 완료
| # | 범위 | 상태 | 커밋 |
|---|------|------|------|
| 1/4 | Prisma 6모델 + 협회 20시드 + drift 복원 | ✅ | eb3ea55 |
| 2/4 | 본인 API 4개 + 본인 페이지 7개 + 독자 셸 | ✅ | e7e8d95 |
| 3/4 | 배정/정산 조회 API 2개 + 본인 열람 페이지 2개 | ✅ | 405c030 |
| 4/4 | Admin API 6개 + 페이지 5개 + Excel 일괄검증 | ✅ | 0510b01 |

### v3 (협회 주도 등록 + 매칭) — 🚧 진행 중
| 단계 | 범위 | 상태 |
|------|------|------|
| 1차 | DB 마이그레이션 + 매칭 엔진 + 암호화 유틸 | ✅ 구현 완료 |
| 2차 | 관리자 사전 등록 UI/API | ⏳ 대기 |
| 3차 | 자동 매칭 훅 + 유저 안내 + 역할 관리 | ⏳ 대기 |

---

## 🎯 v3 설계 확정안 (2026-04-13)

### 핵심 구조 변경
- Referee.user_id → **nullable** (사전 등록 허용)
- AssociationAdmin → **role 필드 추가** (9종)
- 매칭 키: **이름 + 전화번호** (추후 확장 가능)
- 자기 등록: **1차 제외** (필요 시 추가)

### 협회 관리자 역할 (9종)
| 구분 | 역할 | 코드 |
|------|------|------|
| 임원 | 회장 | president |
| | 부회장 | vice_president |
| | 이사 | director |
| 실무 | 사무국장 | secretary_general |
| | 직원 | staff |
| | 심판팀장 | referee_chief |
| | 심판총무 | referee_clerk |
| | 경기팀장 | game_chief |
| | 경기총무 | game_clerk |

### 권한 매트릭스
- **임원 (회장/부회장/이사)**: 모든 기능 **열람만**
- **사무국장**: 전체 관리 + 관리자 추가/삭제 + 주민번호 열람
- **직원**: 기본 열람
- **심판팀장**: 심판 등록/수정/검증/배정/Excel
- **심판총무**: 심판 등록/수정/검증/Excel, 배정 열람
- **경기팀장**: 경기원 등록/수정/검증/배정/Excel
- **경기총무**: 경기원 등록/수정/검증/Excel, 배정 열람
- **정산 관리**: 사무국장만, 팀장급은 열람
- **주민번호**: 회장 + 사무국장만

### DB 변경 (1차)
| 모델 | 변경 | 내용 |
|------|------|------|
| AssociationAdmin | ADD COLUMN | role VARCHAR NOT NULL DEFAULT 'secretary_general' |
| AssociationAdmin | DROP CONSTRAINT | user_id unique 제거 → 1인 복수 협회 관리 가능성 대비 |
| Referee | ALTER COLUMN | user_id → nullable |
| Referee | ADD COLUMNS | registered_name, registered_phone, registered_birth_date, resident_id_enc, resident_id_last4, match_status, matched_at, registered_by_admin_id |

---

## 구현 기록 (developer) — v3 1차

구현한 기능: DB 스키마 확장 + 매칭 서비스 + 주민번호 암호화 + 권한 시스템

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | AssociationAdmin에 role 필드 추가, Referee에 8개 사전등록 필드 추가 + user_id nullable | 수정 |
| src/lib/services/referee-matching.ts | findMatchingUser, findUnmatchedReferee, executeMatch (트랜잭션) | 신규 |
| src/lib/security/encryption.ts | AES-256-GCM 암호화/복호화, 마스킹, last4 추출 | 신규 |
| src/lib/auth/admin-guard.ts | AdminGuardResult에 role 추가, PERMISSIONS 매트릭스, hasPermission, requirePermission, isExecutive | 수정 |
| src/app/api/web/admin/associations/members/route.ts | user_id null 대응 (filter + fallback to registered_ 필드) | 수정 |
| src/app/api/web/admin/associations/members/[id]/route.ts | user_id null일 때 User 조회 스킵, registered_ 필드 fallback | 수정 |
| src/app/api/web/admin/bulk-verify/preview/route.ts | user_id null 대응 (사전등록 심판도 Excel 매칭 가능) | 수정 |

tester 참고:
- prisma generate 성공 확인됨
- tsc --noEmit 에러 0건
- db push는 아직 안 함 (PM이 dry-run 확인 후 별도 진행)
- .env에 RESIDENT_ID_ENCRYPTION_KEY 추가 필요 (64자 hex)
- 개발서버는 prisma generate 위해 종료함 (재시작 필요: npm run dev)

reviewer 참고:
- Referee.user_id nullable 변경으로 인한 영향 범위: members API 2개 + bulk-verify 1개
- 본인 API (referees/me, referee-certificates 등)는 세션 기반 user_id 검색이라 영향 없음
- admin-guard.ts의 requirePermission()은 apiError import 순환 방지를 위해 Response 직접 생성

---

## 테스트 결과 (tester) — v3 1차

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: tsc --noEmit | PASS | 소스 코드 에러 0건 |
| Test 2: Prisma validate | PASS | 스키마 유효 |
| Test 3: 매칭 서비스 로직 | PASS | prisma 싱글톤 import 정상, 이름+전화번호 검색, $transaction 사용, matched_at 설정 |
| Test 4: 암호화 유틸 | PASS | 암호화-복호화 일치, 마스킹 901215-1******, last4 4567 |
| Test 5: admin-guard 권한 | PASS | PERMISSIONS 10개 그룹, 역할 배정 설계와 일치, isExecutive 정상 |
| Test 6: Referee user_id nullable 영향 | PASS | members 2개 API + bulk-verify null 대응 완료, 본인 API 영향 없음 |
| Test 7: DB 컬럼 확인 | PASS | association_admins.role 존재, referees 8개 신규 컬럼 모두 존재, user_id nullable 확인 |

종합: 7개 중 7개 통과 / 0개 실패 -- 전체 PASS

참고: scratchpad에 "db push 아직 안 함"으로 기록되어 있으나, 실제 DB에는 이미 반영 완료 상태

---

## 리뷰 결과 (reviewer) — v3 1차

종합 판정: **APPROVE with comments** (critical 0건, warning 2건)

잘된 점:
- 암호화(AES-256-GCM) 구현이 교과서적으로 정확함 — IV 12바이트 랜덤, authTag 16바이트, 키 환경변수 분리
- 매칭 서비스의 executeMatch가 $transaction으로 원자적 처리, 이중 매칭 방지 로직 완비
- user_id nullable 변경의 영향 범위를 정확히 파악하고, 3개 API만 수정 + 본인 API는 영향 없음 확인
- 권한 매트릭스(PERMISSIONS)가 설계 확정안과 100% 일치
- bulk-verify에서 사전 등록 심판도 registered_ 필드로 Excel 매칭 가능하게 확장한 것이 좋음
- 주민번호가 API 응답에 평문으로 노출되는 곳 없음 (resident_id_enc/last4 필드는 API 응답에 미포함)

[WARNING] 권장 수정 2건:
1. [prisma/schema.prisma:2236] resident_id_enc에 @db 타입 제한 없음 — 현재 String?(무제한 text). AES-256-GCM으로 13자리 주민번호 암호화 시 base64 출력은 약 60~80자. @db.VarChar(128) 정도로 제한 권장. DB 레벨에서 의도치 않은 대용량 데이터 삽입 방지.
2. [src/lib/services/referee-matching.ts:49-51] 동명이인 + 같은 전화번호 시 findMany → find로 첫 번째만 반환. 확률은 낮지만 이론상 가능. 현재 1차 범위에서는 이름+전화번호 조합이 고유하다고 가정하고 있으므로 OK이나, 2차에서 birth_date를 추가 매칭 키로 검토 권장.

[INFO] 참고 사항:
- match_status에 Prisma enum 대신 String을 쓴 것은 합리적 (enum 변경 시 마이그레이션 필요, String이 유연)
- requirePermission()에서 apiError 대신 Response 직접 생성한 것은 import 순환 방지 목적이므로 수용
- admin-guard import 순환 없음 확인 (admin-guard → web-session + prisma만 의존)

---

## ⚠️ 미해결 이슈 (v2 잔재)
1. 로그인 후 /referee 복귀 미동작 (redirect 파라미터 미지원)
2. 하드코딩 #fff 9곳
3. Reviewer 권장수정 2건 + nit 6건

## 🛑 절대 지킬 원칙
1. 기존 (web)/(admin)/(site) 수정 금지
2. prisma db push/migrate reset 금지 — dry-run 먼저
3. main 브랜치 직접 push 금지
4. lucide-react 금지, Material Symbols만
5. 하드코딩 색상 금지
6. 포트 3002 고정
7. 주민번호 평문 저장/노출 절대 금지

---

## 작업 로그 (최근 10건)
| 날짜 | 에이전트 | 작업 | 결과 |
|------|---------|------|------|
| 04-12 | developer | Commit 1/4: Prisma 6모델 + 협회 20시드 | ✅ eb3ea55 |
| 04-12 | developer | Commit 2/4: 본인 API 4개 + 페이지 7개 + 셸 | ✅ e7e8d95 |
| 04-12 | tester+reviewer | Commit 2/4 검증 (warning 2건, nit 6건) | ✅ APPROVE |
| 04-12 | developer | Commit 3/4: 배정/정산 API 2개 + 페이지 2개 | ✅ 405c030 |
| 04-12 | developer | Commit 4/4: Admin API 6개 + 페이지 5개 | ✅ 0510b01 |
| 04-12 | reviewer | Commit 4/4 검증 (critical 0, warning 2) | ✅ APPROVE |
| 04-13 | pm | 원격 커밋 2개 pull (Commit 3/4 + 4/4) | ✅ fast-forward |
| 04-13 | architect | 분리형+도메인/DB 공유 아키텍처 확정 | ✅ decisions.md |
| 04-13 | architect | v3 협회 주도 등록+매칭 시스템 설계 | ✅ 설계 확정 |
| 04-13 | pm | 협회 역할 9종 + 권한 매트릭스 확정 | ✅ 사용자 승인 |
| 04-13 | developer | v3 1차: 스키마+매칭+암호화+권한+API수정 (7파일) | ✅ tsc 통과 |
| 04-13 | reviewer | v3 1차 리뷰: critical 0, warning 2 (VarChar 제한+동명이인) | ✅ APPROVE |
