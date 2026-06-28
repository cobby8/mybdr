# 매칭 고도화 — CLI 통합 전달 프롬프트 (M1~M6 Auto-Chain)

> 2026-06-19 · 한 세션에서 M1→M6를 순차 자동 진행시키는 마스터 프롬프트. (M6=시안 E 호스트 콘솔 + status맵 정리, 2026-06-19 추가)
> 상세 단계 스펙 = `Dev/matchmaking-CLI프롬프트-확정-M1toM5-2026-06-19.md` (CLI가 읽음).
> 시안 = `Dev/design/BDR-current/_handoff-matchmaking-M2-M5/` (v2.35) · 계약 = 그 안 `DATA-BINDING.md`.

아래 블록 전체를 Claude CLI에 한 번 paste.

---

```
[통합 작업] 픽업/게스트 경기 매칭 고도화를 Phase M1→M6 순서로 auto-chain 박제한다.
각 Phase = 한 PR(subin→dev). 앞 Phase 검증 통과 후 다음 Phase 진행. dev→main 머지는 수빈 수동.

■ 스펙 출처 (작업 전 반드시 읽기)
1. Dev/matchmaking-CLI프롬프트-확정-M1toM5-2026-06-19.md — M1~M5 단계별 요구사항 + §0 필드명 대조표(중요).
2. Dev/design/BDR-current/_handoff-matchmaking-M2-M5/DATA-BINDING.md — status/필드/API/엣지 계약.
3. Dev/design/BDR-current/_handoff-matchmaking-M2-M5/design-files/screens/*.jsx — M2~M5 시안(레퍼런스, src로 재구현).
4. CLAUDE.md §디자인 13룰 / §보안 / §DB정책 / knowledge/conventions.md.

■ Step 0 — 프리플라이트 (작업 전 1회)
- git fetch origin --prune → 현재 subin 브랜치 확인, dev 최신 머지.
- .env DATABASE_URL 키 존재만 확인(값 노출 금지), .env.local localhost:3001 오버라이드 확인.
- §0 필드명 대조표를 작업 메모로 고정: scheduled_at/max_participants/current_participants/fee_per_person/duration_hours, 신청 status Int(0/1/2,+3=대기), attended_at 사용(attendances 테이블 X), manner_score/파생.
- 결과 1줄 요약 후 M1 착수.

■ 공통 가드 (전 Phase)
- main 직접 push 금지. 작업은 subin, 완료 시 subin→dev PR 생성.
- 운영 단일 DB. 응답 키 자동 snake_case → 프론트 접근자 snake_case, 신규 필드 추가 후 curl 1회 raw 확인.
- 시안은 레퍼런스 → 운영 src/ 기존 패턴·컴포넌트·라우팅으로 재구현. 토큰 var(--*)만, 하드코딩 hex/핑크·살몬/lucide/pill9999 금지. AppNav frozen 재구성 금지.
- 에이전트: 2파일+ 연계·비즈니스 로직 = developer 위임. 독립 작업 병렬. 에러→knowledge/errors.md, 기술결정→decisions.md.

■ 🚦 승인 게이트 (여기서 멈추고 수빈 승인 받기 — 자동 진행 금지)
- 게이트 A (M1): status=5 잔존 데이터가 있으면 → SELECT count 결과 보고 후 "status=4로 UPDATE 진행할까요?" 승인 대기. (destructive)
- 게이트 B (M2): waitlist_position·promotion_deadline ADD COLUMN prisma db push 전 → schema diff 제시 후 승인 대기. (NULL 허용 무중단이지만 운영 DB 변경)
- 그 외 단계는 검증 통과 시 자동으로 다음 Phase 진행.

■ Phase 실행 루프 (M1 → M2 → M3 → M4 → M5 → M6)
각 Phase마다:
  1) 확정 프롬프트 문서의 해당 Phase 요구사항대로 구현 (필드명은 §0 대조표 기준).
  2) 해당 Phase "검증" 항목 실행 → 결과 보고 (prisma 쿼리/curl raw/화면 확인).
  3) tester+reviewer 병렬 점검 (회귀: AppNav 7룰·토큰·모바일 720/44px).
  4) commit (Conventional: feat(games)/fix(games)/design 등) → subin push → subin→dev PR.
  5) scratchpad 1줄 로그. 다음 Phase로.

■ Phase 요약 (상세는 스펙 문서)
- M1 성사코어: status 1→2 자동전환/복귀, 취소 status 5→4 통일+라벨, 취소 시 신청자 GAME_CANCELLED 알림. [게이트 A]
- M2 대기열: status 3=대기 + waitlist_position/promotion_deadline 컬럼, 정원마감 시 대기신청, 빈자리→대기1번 알림+deadline 30분, 승격 confirm API(서버 deadline 검증). UI=시안 B(참가자). ※ **호스트 신청·대기열 관리(E-1)는 M6로 이관**(M2가 E-1 없이 머지됨, 2026-06-19). [게이트 B]
- M3 출석: attended_at 토글 API(호스트), 종료경기 lazy update로 DB status=3 전환, 리포트 노쇼 prefill+MVP disabled, 시안 C.
- M4 평점유도+신뢰카드: 종료 평점 CTA(status===3 && 리포트 없음)+알림+24h 리마인드, 프로필 신뢰카드(매너 등급라벨/MVP파생/참여파생, 숫자·HeroCard 점수 비노출), 01 §3 룰 갱신, 시안 D.
- M5 찾기UX: 정렬(soon/filling/latest, 가까운순은 좌표 있을때만), 빠른필터칩(좌표의존 칩 없으면 숨김), 진행률바·상태뱃지, 빈상태, 시안 A.
- M6 호스트 콘솔(E-1+E-2)+status맵 정리: **E-1 호스트 신청·대기열 관리 패널(GameDetail, M2서 이관: 대기승인0/확정1/대기열3 순번·승격, 시안 BDR-current GameDetail.jsx HostApplicationsPanel 485줄)** + E-2 내 경기 호스트 카드(현황 승인/정원·대기 N + 빠른액션 신청관리/수정/마감확정/취소, waiting 탭, MyGames.jsx). 🔴선결=my-games/page.tsx 로컬 GAME_STATUS_LABEL(3진행중/4완료/5취소) 폐기→game-status.ts 정본 import(M1 취소=4 오표시 버그 수정).

■ 종료 시
- 전 Phase PR 목록 + 미푸시 커밋 + 게이트 처리 내역 보고.
- .claude/phase-ledger.md에 M1~M6 상태 등재. index.md 갱신.
- dev→main 머지는 수빈 결재 대기 (자동 머지 금지).

지금 Step 0 프리플라이트부터 시작.
```

---

## 이 통합 프롬프트가 도는 방식 (수빈용 메모)
- M1부터 M5까지 한 세션에서 순차 진행. 단계마다 PR 1개라 중간에 눈으로 확인 가능.
- **두 군데서 자동으로 멈춥니다**: M1의 status=5 데이터 정리(있을 때만), M2의 컬럼 추가 db push. 승인하면 이어서 진행.
- dev→main 운영 반영은 항상 수빈 수동(평소대로).
- 동시 진행 주의: 현재 CLI가 앱 백엔드(PR-MYBDR-BACKEND) 작업 중이면, 그 PR 정리 후 또는 별도 세션에서 이 체인을 시작하세요(브랜치 충돌 방지).
