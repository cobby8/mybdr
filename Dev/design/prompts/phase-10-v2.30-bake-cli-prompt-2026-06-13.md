# CLI 의뢰서 — Phase 10 정보 페이지 박제 (v2.30 sync + 5 시안 박제)

> **작성**: Cowork 2026-06-13. 시안 도착 = `BDR v2 (13).zip` = **v2.30** (Phase 10 정보 페이지).
> **보존**: `Dev/design/_zips/BDR-v2.30-phase10-info-2026-06-13.zip`
> **선행 의뢰서**(시안 명세): `prompts/info-pages-user-redesign-prompt-2026-06-08.md`(IU1~IU4) + `info-admin-redesign-prompt-2026-06-08.md`(IA1) + `info-pages-user-admin-connectivity-plan-2026-06-08.md`(BI1~BI5)
> **시안 README**: zip 내 `Dev/design/BDR v2.30/README.md` (박제 내용 §3 상세)

---

## §0. ★★★ 최우선 가드 — 선택 sync (②③ 역박제 회귀 방지)

```
[함정] v2.30 zip = 2026-06-08 baseline(v2.29) 위에서 제작됨.
  그 이후 BDR-current 에는 ②③ 역박제가 적용됨:
    · 508325a 대회상세(진행중) 역박제 → BDR-current/screens/TournamentDetail.jsx
    · 7d6f89c 대회종료 역박제      → BDR-current/screens/TournamentCompleted.jsx (+ tournament-completed.css 등)
  v2.30 의 TournamentDetail/Completed = carry-over(= 옛 v2.29 = ②③ 反映 전).
  → 전체 폴더 swap(sync-bdr-current.ps1 기본 동작) 시 ②③ 역박제가 BDR-current 에서 사라짐 (회귀!).

[해결 = 선택 sync] BDR-current 전체 교체 ❌. Phase 10 변경 파일만 BDR-current 에 덮어쓰기:
  · screens/About.jsx (신규)
  · screens/News.jsx (IU2)
  · screens/Help.jsx (IU3)
  · screens/Reviews.jsx (IU4)
  · screens/AdminNews.jsx (IA1)
  · info-shared.css (신규)
  · info-shared.jsx (신규)
  · index.html (Phase 10 섹션 갱신)
  · iu1-about.html / iu2-news.html / iu3-help.html / iu3-glossary.html / iu4-reviews.html / ia1-admin-news.html (시안 미리보기)
  → TournamentDetail.jsx / TournamentCompleted.jsx / tournament-*.css 는 **건드리지 말 것** (②③ 보존).

[검증] sync 후: git diff BDR-current/ 에 TournamentDetail/Completed 변경 0 확인.
  v2.30 README §2 "carry-over(변경 0)" 목록과 일치 = Phase 10 파일만 diff.
```

→ commit: `design(sync): BDR-current v2.30 Phase 10 정보페이지 (선택 sync · ②③ 보존)`

---

## §1. 박제 대상 = 5 시안 (라우트)

| ID | 화면 | 라우트 | 등급 | 비고 |
|----|------|--------|------|------|
| IU4 | Reviews | `/reviews` | A 보강 | v3 carry → 코트 단일 축소 · 평점분포 chart · Phase 2 BG2 답습 |
| IU2 | News | `/news` + `/news/match/[matchId]` | A 보강 | E1+E2 carry · cross-domain link · IA1 발행 NEW badge |
| IU3 | Help+Glossary | `/help` + `/help/glossary` | A 보강+신규 | Help carry + Glossary A-Z chip 신규 |
| IU1 | About | `/about` | A 신규 | Hero + 통계4 + ★§6 운영진 실명 ❌ + FAQ link |
| IA1 | AdminNews | `/admin/news` | E (자체셸) | Site Operator · 발행 form + 모달(알림 ✅ NU1 동기화) |

**박제 순서**(시안 지정): IU4 → IU2 → IU3 → IU1 → IA1. 각 단계 검수 통과 후 다음.

---

## §2. 사전 점검 (작업 전)

```
1. git: subin 정합 · 미커밋 0 (특히 src/app/(admin)/admin/users/ 다른 세션 lock 해제 확인 — 권한표현 PR 와 별개 충돌 X 확인)
2. ★ 0스키마 실측 ([[lesson-sian-db-assumption]]) — 신규 DB ❌ 원칙. 박제 전 schema.prisma 1회 실측:
   · IU4 리뷰 = 기존 reviews/평점 테이블 집계 (평균 + flag 종류). 개별 건수 노출 ❌ (BG2 룰)
   · IU2 News = community_posts(category=news, news_photo) — 어제 audit 실측본 재사용
   · IU1 통계4 = 전 Phase 집계(users/teams/tournaments/courts count). 없는 항목 = hide + "운영 시점 연동" 캡션
   · IU3 Glossary 용어 = 시안 static carry (운영 데이터 없으면 시안 용어 보존)
   · IA1 발행 = community_posts INSERT (category=news) + 알림(NU1 패턴) — 신규 테이블 ❌
3. 라우트 존재 확인: /about /news /news/match/[matchId] /help /help/glossary /reviews 운영 존재 / /admin/news (admin 폴더 존재 확인)
4. AppNav = shared.jsx frozen 카피 (IU1~IU4 active="more") / IA1 = admin 자체셸(AppNav 미적용)
5. 강조색 = var(--accent)/var(--cafe-blue) 시안 토큰 그대로 (하드코딩 hex ❌ / 핑크·코랄·살몬 ❌)
```

---

## §3. 박제 핵심 (시안 README §3 답습 — 요지)

```
IU4 Reviews: 평균 hero + 평점분포 chart(별5→1 %) + 필터chip + 리뷰카드(인증·사진 badge·도움됨).
  ★ Phase 2 BG2: 평균 + flag 종류만(바닥/조명/접근성/청결·주차/혼잡). "개별 건수 비공개" 명시. 개별 카운트 노출 ❌
IU2 News: E1 매거진(카테고리chip+트렌딩+카드grid+IA1발행 NEW badge) + E2 단신(알기자 byline+스코어보드+linkify).
  cross-domain: 팀/users/tournaments/live 자동 link.
IU3 Help+Glossary: Help(검색+탭3 FAQ/용어mini/정책 + 1:1문의) / Glossary 신규(A-Z chip sticky+검색+용어카드18+용어→Phase link).
IU1 About: Hero슬로건 + 통계4(집계·"운영 시점 연동" 캡션) + "만드는 것"6 + ★운영진(일반 팀 라벨·실명0·§6 배너) + 파트너 + FAQ미니(→IU3) + CTA.
IA1 AdminNews(/admin/news): OperatorBadge+oa1-hero+pm-card+bl-modal 재사용. Hero stat + 작성form(카테고리4+제목+rich본문+대표이미지+매치 cross-domain선택+발행옵션3) + 미리보기 + 발행이력 + ★발행모달(사용자 알림 ✅ 기본·NU1 동기화).
```

---

## §4. Stop conditions

```
· ★ BDR-current 전체 swap (②③ TournamentDetail/Completed 회귀) — §0 위반
· 신규 DB 테이블/컬럼 (0스키마 위반 — 실측상 불필요)
· /api/v1/** 변경 (Flutter 영향)
· AppNav 재구성 / 회귀 4케이스(검색·쪽지·알림·다크·햄버거 순서)
· IU1 운영진 실명 노출 (★ §6 보존 — 일반 팀 라벨만)
· IU4 리뷰 개별 flag 건수 노출 (BG2 = 종류·평균만)
· 신규 메인 탭 / 사용자결정 §1~§8 위반
· 하드코딩 hex / 핑크·코랄·살몬 / lucide-react / pill 9999px
· mock 더미 박제 (운영 데이터 0 항목 = hide·"운영 시점 연동", mock ❌)
· lint/tsc 실패 · LOC 과대(>+2500 5시안 합산 시 분할 보고)
```

---

## §5. 검증 (tester · 시안별)

```
1. tsc/lint 0
2. IU4: 평점분포 chart 렌더 · BG2(개별건수 0·flag종류만) · 코트 단일
3. IU2: cross-domain link 4종(teams/users/tournaments/live) · IA1 발행시 NEW badge
4. IU3: Glossary A-Z chip sticky+검색 · 용어→Phase link · Help 탭3
5. IU1: 통계4(없으면 hide) · ★운영진 실명 0 · FAQ→IU3
6. IA1: 발행 INSERT(community_posts) · 발행모달 알림 ✅ 기본 → NU1 동기화 실재 확인 · OperatorBadge
7. 회귀: AppNav 4케이스 · 진행중/종료 대회뷰(②③) 무변경 · 모바일 720 1열
8. 3001 또는 운영 육안 1회
```

---

## §6. 커밋 / 마무리

```
· 시안 sync: design(sync) 1 commit (§0 선택 sync)
· 박제: 시안별 commit 권장 (feat(info): IU4 Reviews ... 등 5) 또는 묶음 — PR 단위 STAGE B
· phase-ledger: Phase 10 ⑮ 행 추가 (Claude.ai ✅ v2.30 / sync ✅ / 박제 / dev→main)
· scratchpad 로그 / decisions(0스키마 집계 재사용) / errors 해당시
· 머지: STAGE B 일괄 (subin→dev→main). 9C·권한표현 PR 과 순서 조율
· 큐 갱신: _cli-queue-status 차기본에 Phase 10 반영
```

---

## 즉시 시작 명령 (CLI)

```
Read Dev/design/prompts/phase-10-v2.30-bake-cli-prompt-2026-06-13.md 하고 §0 선택 sync(②③ 회귀 방지) → §2 사전점검(0스키마 실측) → IU4부터 순서대로 박제해줘. 시안 = _zips/BDR-v2.30-phase10-info-2026-06-13.zip. 결재 default 자동.
```
