# 매칭 고도화 — Claude CLI 박제 프롬프트 (Phase M1~M5)

> 동봉 기획서: `Dev/matchmaking-advancement-plan-2026-06-18.md`
> 사용법: 각 Phase 블록을 **순서대로** Claude CLI에 paste. 한 Phase = 한 PR(`subin→dev`). 앞 Phase 머지 후 다음 진행.
> **결정 확정(2026-06-18, 전부 권장안): ① 대기열 = 알림 후 수동 승격 / ② 취소 status = 4로 통일 / ③ 종료 경기 status = 조회 시 lazy update / ④ 결제(M6) = 보류(설계만) / ⑤ Phase M1~M5 phase-ledger.md 등재.** "구현 후 눈으로 보고 재조정" 방침.

---

## 공통 머리말 (모든 Phase 프롬프트 앞에 자동 적용 — CLI가 CLAUDE.md로 인지)

각 프롬프트는 아래를 전제로 한다(반복 명시 불필요하나 CLI가 누락 시 상기):
- 브랜치: `subin`에서 작업, 작업 후 `subin→dev` PR. **main 직접 push 금지.**
- DB: 운영 단일 Supabase. **destructive(DROP/대량 UPDATE/DELETE) 사용자 승인 필수.** schema 변경은 NULL 허용 ADD COLUMN만 자동, 그 외 diff 검토.
- API 응답 키 자동 snake_case 변환 → 신규 필드는 프론트 접근자도 snake_case. 추가 후 `curl` 1회 raw 응답 확인.
- 공식기록/토너먼트 도메인 무관(픽업/게스트 games 한정). `officialMatchWhere()` 영향 없음.
- 작업 후: scratchpad 1줄 로그, 에러→errors.md, 미푸시 커밋 알림.

---

## ▶ Phase M1 — 성사 코어 + 취소 status 정합 (P0)

```
[작업] 픽업/게스트 경기의 "성사·취소" 상태 전환을 정상화한다.

배경(실측): 
- 정원(max_participants) 도달해도 games.status가 1(모집중)→2(확정)로 자동 전환되지 않음 (applications/[appId]/route.ts:59-72, 승인 후 전환 로직 없음).
- 경기 취소 DELETE가 status=5를 set하는데 STATUS_LABEL(game-status.ts)엔 5가 없음(4=취소) → 라벨 깨짐.
- 취소 시 신청자 알림 미발송 (NOTIFICATION_TYPES.GAME_CANCELLED 상수만 존재, 호출처 0).

요구사항:
1. src/lib/constants/game-status.ts: status 정수 의미를 주석으로 명문화 (0=초안,1=모집중,2=확정,3=완료,4=취소). 
   [결정2 반영] 취소는 status=4로 통일한다. → DELETE 라우트의 status:5 를 4로 수정. 
   기존 DB에 status=5 데이터가 있으면: 먼저 SELECT count로 건수 보고 → 사용자 승인 후 UPDATE status=4 (destructive 가드).
2. 정원 자동 전환:
   - 신청 reserve 트랜잭션(apply/route.ts) 또는 승인(applications/[appId]/route.ts)에서 current_participants == max_participants 도달 시 status 1→2.
   - 신청 취소/거절로 current < max 이고 현재 status=2 이면 → 1로 복귀.
   - 트랜잭션 내에서 race-safe하게 (이미 apply/route.ts:119가 조건부 UPDATE 패턴 사용 중 — 동일 패턴 활용).
3. 취소 알림: DELETE(또는 취소 처리)에서 해당 경기의 모든 신청자(status 0,1)에게 GAME_CANCELLED 알림 발송. 기존 notification 유틸 재사용.

제약: DB 컬럼 추가 없음(status 활용). UI 텍스트 신규 시 placeholder 5단어 이내.

검증(완료 후 실행하고 결과 보고):
- 정원 N-1 → 1명 더 승인 → DB status=2 확인 (prisma 쿼리 또는 curl GET).
- status=2 경기에서 1명 취소 → status=1 복귀 확인.
- 경기 취소 → 신청자 notification row 생성 확인 + 프론트 라벨 "취소" 정상.
- curl로 GET /api/web/games/[id] raw 응답에 status 값 확인.
```

---

## ▶ Phase M2 — 대기열 (Waitlist) (P1)

```
[작업] 정원 초과 신청을 거절 대신 대기열로 받고, 빈자리 발생 시 안내한다.

배경(실측): apply/route.ts:119-124 에서 정원 차면 FULL 에러로 신청 자체를 거절. 대기열 없음.

[결정 확정] 승격 방식 = **알림 후 수동**. 빈자리 발생 시 대기 1번에게 알림+확정 CTA, 일정 시간(예: 30분) 무응답 시 다음 순번으로. 자동승격 아님.

요구사항:
1. schema.prisma: game_applications에 waitlist_position INT NULL ADD COLUMN (무중단). prisma db push 전 diff 사용자 검토.
2. apply: 정원 초과 시 FULL 거절 대신 → status=0 + waitlist_position = (현재 대기 max + 1)로 등록. 신청자에게 "대기 N번" 응답.
3. 승인 참가자 취소/거절로 빈자리 발생 시:
   - (알림후수동) 대기 1번에게 "자리 났어요" 알림 + 확정 CTA. 일정 시간 무응답 시 다음 순번.
   - (자동승격) 대기 1번 자동 승인 + 알림.
4. UI: 경기 상세/카드에 "대기 N번" 뱃지, apply-panel에 대기 상태 표시.

검증:
- 정원 가득 → 추가 신청 → waitlist_position 부여 확인.
- 승인자 1명 취소 → 대기 1번 알림/승격 동작 확인.
- curl raw 응답에 waitlist_position(snake_case) 노출 확인.
```

---

## ▶ Phase M3 — 출석 확정 → 평점 권한 연동 (P1)

```
[작업] 주최자가 경기 당일 출석을 체크하고, 그 데이터로 평점 신뢰를 높인다.

배경(실측): game_applications.attended_at 컬럼 존재하나 set/참조 코드 0건. canReportGame()은 status=3 + (호스트 OR 승인참가자)만 검증(노쇼 무관).

요구사항:
1. 출석 체크 UI: 경기 상세(host-applications 또는 신규 섹션), status=2(확정) 또는 완료 시 승인참가자 리스트에 출석 토글. 토글 → attended_at set/해제 API (PATCH).
2. 권한 API: 출석 토글은 호스트만. IDOR 검증.
3. canReportGame / report-form 보강: 출석 데이터 있으면 평가 대상 = 출석자 중심 표시. 노쇼(승인됐으나 미출석)는 신고 플래그 noshow로 처리(기존 flags 활용) — 신규 enum 만들지 말 것.
4. [전제] 종료 경기 DB status 전환: [결정 확정] **조회 시 lazy update**. 경기 상세/목록 조회 시 scheduled_at < now 이고 status가 1/2면 DB status를 3으로 1회 UPDATE(멱등). 기존 game.ts:137-144 메모리 오버라이드를 실제 DB 동기화로 승격. 평점은 DB status=3을 요구하므로 이 경로 없으면 평점 진입 불가 → M3에서 함께 해결. (cron 불필요)

제약: DB 컬럼 추가 없음(attended_at 기존). 

검증:
- 출석 토글 → attended_at 기록/해제 확인 (curl).
- 종료 경기 status가 실제 DB에서 3으로 전환되는지 확인.
- 리포트 폼에서 출석자/노쇼 구분 표시 확인.
```

---

## ▶ Phase M4 — 평점 작성 유도 + 프로필 반영 (P1→P2)

```
[작업] 완성된 평점 시스템에 참가자를 유도하고, 결과(매너점수/MVP)를 프로필에 노출한다.

배경(실측): 리포트/MVP집계/매너점수 입력은 완성. 그러나 작성 유도 동선·프로필 노출이 약함. recomputeMannerScore()→users.manner_score 누적은 동작.

요구사항:
1. 작성 유도: 경기 종료(status→3) 시 호스트+승인참가자(출석자)에게 "평점 남기기" 알림 발송. 경기 상세/마이페이지에 배너 CTA.
2. 리마인드: 종료 +24h 미작성자 1회 추가 알림 (중복 방지).
3. 프로필 노출: manner_score 표시 UI 확인 후, 공개 프로필에 매너점수 + MVP 횟수(final_mvp_user_id 집계) + 참여 경기 수 표시. 표시 UI 없으면 신설(02 토큰/03 frozen 준수).

검증:
- 경기 종료 → 알림 수신 → CTA 클릭 → 리포트 폼 진입.
- 24h 미작성 리마인드 1회만 발송.
- 프로필에 매너점수/MVP 표시 확인.
```

---

## ▶ Phase M5 — 찾기/검색 UX 고도화 (P2)

```
[작업] 경기 목록의 탐색·전환 UX를 개선한다. 기존 listGames/필터 동작은 유지하고 위에 레이어 추가.

배경(실측): 기본/맞춤 필터·도시 집계·동적 완료표시·페이지네이션(60) 완성. 정렬 옵션·빠른필터칩·진행률 표시·빈상태 없음. 요일/시간대 필터 실제 동작 미확인.

요구사항:
1. 정렬 옵션: 임박순(scheduled_at asc, 미래 우선)·모집임박순(current/max desc)·최신순. (가까운순은 court 좌표 있을 때만 — 좌표 유무 먼저 확인 후 가능하면 추가)
2. 빠른 필터 칩: 오늘 / 이번 주말 / 내 동네(유저 preferred_regions) / 모집임박(80%+) / 무료(fee=0). 기존 쿼리파라미터 패턴 확장.
3. 카드: 모집 진행률 바(current/max) + "마감임박"·"확정" 뱃지. game-status.ts STATUS_LABEL 재사용.
4. 빈 상태: 결과 0건 시 안내 + 맞춤필터 끄기/인접지역 제안 CTA. placeholder/문구 5단어 이내.
5. 요일/시간대 필터: 실제 동작 확인. DB 쿼리 불가하면 메모리 필터로 정확히 동작하게 수정.

제약: DB 변경 없음(정렬/필터는 쿼리·메모리). AppNav frozen 무관(목록 본문만). 핑크/살몬/코랄 금지, var(--*) 토큰만.

검증:
- 각 정렬·각 칩 적용 시 결과 정확.
- 진행률 바 = current/max 정확.
- 0건 빈상태 노출.
```

---

## 부록: M6 결제 — 설계만 (CLI 박제 보류)

[결정 확정] 결제 = **보류(설계만)**. 진행 결정 시 별도 의뢰. 설계 산출물: PG 후보(토스/카카오페이/네이버페이) 비교, 정산·환불·노쇼 정책, game_applications.payment_* 활용안, 기존 /api/web/payments/* (구독료) 재사용 가능성. 운영 src/ 코드에 PG 연동·정산·환불 = 별도 의사결정 영역.
