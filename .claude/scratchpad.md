# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 19 (BDR v2.5 + rev2) 시각 박제 종결
- **상태**: ✅ Phase 19 분해 9 PR / 8 commit 모두 완료. 후속 PR-S9 (_print.css 정합) 선택 / 후속 Phase A.7 (역동기화) 큐
- **모드**: no-stop / 사용자 결재 5건 (Q1~Q5) + Phase 19 결재 (D2~D7) + rev2 결정

## 진행 현황표
| 단계 | 결과 |
|------|------|
| v2.5 sync (rev1) | ✅ `1fa9210` |
| Phase 23 PR1 (PBP 역변환 헬퍼) | ✅ `b7c44d8` |
| Phase 23 PR2+PR3 (매치 218 사고 차단) | ✅ `a147bb1` |
| Phase 19 PR-S1~S5 (rev1) | ✅ `ef54e7a`/`4416a91`/`1a37981`/`1388eae`/`fe022c6` |
| v2.5 rev2 sync | ✅ `64daa5a` |
| Phase 19 PR-S6+S7+S8 rev2 (롤백+토큰+로고) | ✅ `cdf695a` |
| Phase 19 PR-S6-team (TeamSection) | ✅ `9bc6906` |
| Phase 19 PR-S7-officials (FooterSignatures) | ✅ `76edd00` |
| Phase 19 종결 | ✅ 분해 9 PR / 8 commit 완료 / 시각 정합 100% |

## Phase 19 종결 요약

운영 (score-sheet) frame 본체 100% 시안 정합 + 운영 비즈니스 로직 100% 보존.

| 영역 | 시안 클래스 | 운영 보존 |
|------|------------|----------|
| toolbar | .ss-toolbar* | ← 메인 / 인쇄 / 경기 종료 wiring |
| FibaHeader | .ss-h / .ss-names / .ss-meta / .ss-field | splitDateTime / venue / referee / umpire |
| TeamSection | .ss-tbox / .ss-tbox__to/tf / .ss-c-* | 4종 모달 / 5반칙 / Phase 17 색 / coach |
| RunningScoreGrid | 운영 grid (16열) | 모든 onClick / setRunningScore / 모달 |
| PeriodScoresSection | .ss-ps / .ss-circ / .ss-final / .ss-winner | OT 탭 / OT 종료 / 합산 / Winner 판정 |
| FooterSignatures | .ss-officials / .ss-sigs | 8 input onChange / Captain protest |

토큰: `--pap-*` 6종 (.ss-shell 스코프). 페이퍼 라이트 강제 (다크 진입 시에도). FIBA 직각 (border-radius 0).

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | Phase 19 PR-S7-officials — FooterSignatures 시안 정합 (Officials 4행 + Sigs 3행 + Captain protest) | ✅ 2 파일 +359/-225 / tsc 0 / vitest 204/204 / commit `76edd00` push |
| 2026-05-15 | Phase 19 PR-S6-team — TeamSection 시안 정합 (운영 891 LOC 비즈니스 로직 100% 보존) | ✅ 3 파일 +878/-586 / 13/13 보존 / commit `9bc6906` push |
| 2026-05-15 | Phase 19 PR-S6+S7+S8 rev2 — 모드 토글 롤백 + 토큰 단순화 (--pap-*) + 로고 변경 (We Play Basketball) + .pap-lbl/.pap-u | ✅ 9 파일 +438/-320 / commit `cdf695a` push |
| 2026-05-15 | v2.5 rev2 design sync (BDR-current/ 갱신 + _archive 백업) | ✅ commit `64daa5a` push (181 파일) |
| 2026-05-15 | Phase 19 PR-S5 — PeriodScoresSection 시안 정합 (① ② ③ ④ + Final + Winner) | ✅ 3 파일 +482/-316 / commit `fe022c6` push |
| 2026-05-15 | Phase 19 PR-S4 — FibaHeader 시안 정합 (.ss-h/.ss-names/.ss-meta) | ✅ 3 파일 +525/-161 / commit `1388eae` push |
| 2026-05-15 | Phase 19 PR-S3 — RunningScoreGrid mode prop wiring (paper read-only) | ✅ 5 파일 +161/-5 / commit `1a37981` push (rev2 에서 롤백) |
| 2026-05-15 | Phase 19 PR-S2 — 시안 toolbar 전체 도입 (운영 함수 100% 보존) | ✅ 5 파일 +325/-33 / commit `4416a91` push |
| 2026-05-15 | Phase 19 PR-S1 — .ss-shell 토큰 정의 (15종) | ✅ 신규 1 + 수정 1 +64 LOC / commit `ef54e7a` push |
| 2026-05-15 | Phase 23 PR2+PR3 — 매치 재진입 자동 로드 (매치 218 사고 영구 차단) | ✅ 3 파일 +368 LOC / commit `a147bb1` push |

## 미푸시 commit (subin 브랜치)
**0건** — 모두 푸시 완료.

## 후속 큐 (미진입)
- **PR-S9** (선택) — _print.css rev2 정합 (인쇄 미디어 쿼리 디테일 보강)
- **Phase 23 PR4** (선택) — status="completed" 매치 수정 가드 (Q3 결재)
- **Phase 23 PR5** — audit endpoint 박제 + cross-check 호출 (PR5-A 일부 진행됨 `d858632`)
- **Phase 23 PR6** — ConfirmModal 박제 + OT cross-check 확장 + PaperPBPRow 명시 mapping
- **Phase A.7** — 시안에 운영 모달 5종 박제 의뢰서 작성 (Claude.ai Project)
- UI-1.4 entry_fee 사용자 보고 재현
- GNBA 8팀 코치 안내
