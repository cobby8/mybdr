# CLI 의뢰서 — v2.31 박제 (RI1 RefereeInfo + Phase 12 잔여 12라우트)

> **작성**: Cowork 2026-06-14. 시안 = `BDR v2 (15).zip` = **v2.31 FULL** (Phase 11 LC1 + RI1 + Phase 12).
> **보존**: `Dev/design/_zips/BDR-v2.31-FULL-phase11-12-2026-06-14.zip`
> **LC1 라인업은 별도 의뢰서**: `lineup-confirm-bake-cli-prompt-2026-06-14.md` (스키마+API+UI · 주장 도입). 본 의뢰서는 **RI1 + Phase 12 = 13 화면**.
> **배경**: Cowork 시안 커버리지 전수조사(`sian-coverage-census-2026-06-13.md`)에서 "아카이브-only 레거시"로 분류된 페이지들을 Claude.ai 가 v2 토큰으로 전면 재박제. 정합 일치.

---

## §0. ★★★ 선택 sync 가드 (②③ 역박제 회귀 방지 — Phase 10 과 동일)

```
v2.31 = v2.30 전체 카피(= v2.29 baseline = ②③ 역박제 反映 전).
zip 안에 _handoff-대회상세/종료 폴더가 있으나 = 참조용. screens/TournamentDetail·Completed = 옛 carry 가능.
→ 전체 폴더 swap ❌. Phase 11/12 신규 파일만 BDR-current 에 add/덮어쓰기:
  · screens/RefereeInfo.jsx · referee-info.css · ri1-referee-info.html
  · screens/{Scrim,Stats,Saved,Calendar,CourtAdd,TeamInvite,SeriesDetail,Coaches,Awards,Gallery,Shop,Safety}.jsx
  · extras-pages.css · 각 wrapper html · index.html(Phase 11/12 섹션)
  · screens/LineupConfirm.jsx · lineup-confirm.css (LC1 — 라인업 의뢰서와 공유)
→ TournamentDetail/Completed/tournament-*.css = 건드리지 말 것 (②③ 보존).
검증: sync 후 git diff BDR-current/ 에 TournamentDetail/Completed 변경 0.
```

→ commit: `design(sync): BDR-current v2.31 Phase 11/12 (선택 sync · ②③ 보존)`

---

## §1. 박제 대상 = 13 화면 (LC1 제외)

| ID | 화면 | 라우트 | active | 데이터 출처(★실측 후 확정) |
|----|------|--------|--------|---------------------------|
| RI1 | RefereeInfo | `/referee-info` | more | 정적 안내(룰8 허용 신규) · info-shared 어휘 재사용. 0스키마 |
| SF1 | Safety | `/safety` | more | 정적 안전가이드6 + 신고 진입. DB 0% (정적 OK) |
| CC1 | Coaches | `/coaches` | more | 코치 디렉토리 — users(코치 role) 실측 or 준비중 |
| GL1 | Gallery | `/gallery` | more | 갤러리 — news_photo/앨범 실측 or 준비중 |
| SH1 | Shop | `/shop` | more | 샵 — 운영 미연결 가능 → "준비중/운영 시점 연동" |
| AW1 | Awards | `/awards` | rank | 시상 — rankings/집계 실측 or 시즌 집계 |
| ST1 | Stats | `/stats` | rank | 시즌 스탯 — `match_player_stats` 집계 (points/rebounds/assists 등) |
| CA1 | Calendar | `/calendar` | more | 내 일정 — 본인 games/tournaments 일정 집계 |
| SV1 | Saved | `/saved` | more | 보관함 — saved/bookmark 테이블 실측 |
| SE1 | SeriesDetail | `/series/[slug]` | tn | 시리즈 상세 — series + 회차/누적순위 실측 |
| TV1 | TeamInvite | `/team-invite` | team | 팀 초대 수락 — invite token 실측 |
| CV1 | CourtAdd | `/courts/submit` | court | 코트 제보 폼 — courts pending INSERT 실측 |
| SC1 | Scrim | `/scrim` | games | 스크림 매칭 — DB 미연결 가능 → 실측/준비중 |

→ **전부 기존 라우트** (신규 라우트 신설 ❌ — refereeInfo 포함 모두 존재). nav-data link 갱신만.

---

## §2. ★ 사전 점검 — 페이지별 데이터 출처 실측 (mock 0 원칙)

```
[lesson-sian-db-assumption] 시안 "DB 미보유" 가정 ≠ 운영 실측. 박제 전 각 페이지 schema 1회 실측:
  · 실데이터 있는 페이지(Stats/Calendar/Saved/SeriesDetail/TeamInvite/CourtAdd/Awards) = 기존 테이블 집계/재사용. 신규 DB ❌(0스키마)
  · 운영 미연결 확정 페이지(Shop/Scrim/Gallery/Coaches 중 해당) = mock 더미 박제 ❌ → "준비중" warn-soft 또는 "운영 시점 연동" 안내(빈 상태). 가짜 데이터 ❌
  · 정적 페이지(Safety/RefereeInfo) = 정적 콘텐츠 박제 OK (DB 무관)
실측 명령 예: grep schema.prisma / 기존 page.tsx 데이터 패칭 확인 / 1 curl raw(snake_case 함정).
```

---

## §3. 박제 핵심 (공통)

```
· v1 root screens 의 emoji·인라인스타일·하드코딩 hex → v2 토큰(var(--accent/--cafe-blue/--ink-*/--ok/--warn)) + Material Symbols + 4~8px 라운딩 전면 재작성 (시안 답습).
· AppNav frozen — shared.jsx 카피 (active 값 = §1 표), 재구성 ❌. 회귀 4케이스(검색·쪽지·알림·다크·햄버거 순서).
· 가짜링크(gameReport/guestApps/referee) 영구 제거 보존 — 본 13종에 미포함 확인.
· 공용 extras-pages.css(Phase12) / referee-info.css(RI1) / info-shared 어휘 재사용.
· 720px 분기 / iOS 16px / 44px / pill 9999px ❌(정사각만 50%).
· 데이터 패칭·API·라우트 변경 0 (UI 재작성 + 기존 데이터 재사용만). /api/v1 ❌.
```

---

## §4. 권장 배치 (13화면 → 2~3 세션 분할)

```
[Batch A — 정적/저위험 6] RI1 RefereeInfo · SF1 Safety · CC1 Coaches · GL1 Gallery · SH1 Shop · AW1 Awards
  → 정적 또는 집계/준비중. 데이터 의존 낮음. 먼저.
[Batch B — DB 연결 7] ST1 Stats · CA1 Calendar · SV1 Saved · SE1 SeriesDetail · TV1 TeamInvite · CV1 CourtAdd · SC1 Scrim
  → 페이지별 0스키마 실측 필수. 집계/재사용. mock ❌.
```

→ 각 batch = 검수 통과 후 다음. PR 단위는 batch 또는 화면 묶음(STAGE B).

---

## §5. Stop conditions

```
· ★ BDR-current 전체 swap (②③ 회귀) — §0 위반
· 신규 DB 테이블/컬럼 (0스키마 위반)
· mock 더미 박제 (운영 미연결 = "준비중"/빈상태, 가짜데이터 ❌)
· /api/v1 변경 / 신규 라우트 신설 / 가짜링크 부활
· AppNav 재구성 / 회귀 4케이스
· 하드코딩 hex / 핑크·코랄·살몬 / lucide / pill 9999px
· 사용자결정 §1~§8 위반 / lint·tsc 실패 / LOC 과대(batch>+2500 분할 보고)
```

---

## §6. 검증 (tester · batch별)

```
1. tsc/lint 0
2. 페이지별: 데이터 실연동(집계 화면) 또는 빈상태/"준비중"(미연결) — mock 0 확인
3. v2 토큰 전면(폐기 --color-* / 하드코딩 hex / emoji / lucide 0)
4. AppNav active 값 정확 · 회귀 4케이스 · nav link 갱신
5. 모바일 720 1열 · 44px · iOS 16px
6. 회귀: ②③ 대회상세/종료 무변경 · 기존 페이지 무영향
7. 3001 또는 운영 육안 (대표 화면)
```

---

## §7. 커밋 / 마무리

```
· 시안 sync 1 commit (§0 선택 sync) + 박제 batch별 commit
· phase-ledger: Phase 11(RI1) + Phase 12(12) 행 추가
· decisions/errors/scratchpad 해당 갱신 · 시안 커버리지 census 갱신("100% 도달")
· 머지: STAGE B (subin→dev→main)
· 큐 갱신 — LC1(별도) + 본 batch 합산
```

---

## 즉시 시작 명령 (CLI)

```
Read Dev/design/prompts/phase-11-12-v2.31-bake-cli-prompt-2026-06-14.md 하고 §0 선택 sync(②③ 보존) → §2 페이지별 데이터출처 실측 → §4 Batch A(정적 6) 먼저 박제해줘. 시안 = _zips/BDR-v2.31-FULL-phase11-12-2026-06-14.zip. mock ❌·0스키마·신규라우트 ❌. 결재 default 자동.
```
