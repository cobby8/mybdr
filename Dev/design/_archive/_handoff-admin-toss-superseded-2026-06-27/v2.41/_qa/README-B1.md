# _qa/README-B1.md — B1 역박제 방향 정정 요약 (2026-06-26)

> PM 정정 반영. 본 README는 **무엇이 바뀌었는지**와 **문서 세트**를 요약합니다.

---

## 1. 무엇이 바뀌었나 (PM 정정)

**이전 방향(폐기):** 운영 Toss 스타일을 BDR 13룰로 **번역**해 BDR-current에 역박제. Toss 콘솔은 추후 리스킨.

**정정 방향(채택):**
1. 사용자 공개 영역(`(web)/*`, 대회 공개 사이트) = 기존 **BDR 디자인 룰** 유지.
2. 관리자/운영자 워크스페이스 + v2.40 통합 Admin Console = **Toss 스타일을 공식 관리자 디자인 시스템으로 확정**.
3. 관리자 영역에서 lucide · Toss blue · `rounded-full` · `ts-*`/`admin-toss` 토큰은 **위반이 아니라 허용**.
4. 역박제 = Toss → BDR 번역이 **아니라**, 운영 src의 Toss 구조/컴포넌트/상태를 **그대로 시안화**.
5. AppNav frozen + 사용자 결정 §1~§8 = **사용자 공개 영역에만** 계속 적용.

→ Toss 스타일은 **삭제하지 않고 유지/확정**한다.

---

## 2. 문서 세트 (B1)

| 문서 | 역할 | 상태 |
|---|---|---|
| `admin-toss-style-lock-B1.md` | 관리자 **Toss 스타일 잠금**(토큰·클래스·아이콘·컴포넌트, 2-DS 공존 경계) | 🆕 신규 |
| `function-lock-B1.md` | 워크스페이스+7패널+경기표+마법사 **기능·상태 잠금**(스타일 무관) | 🆕 신규 |
| `bake-fix-checklist-B1.md` | 역박제 적용 체크리스트 — **방향 정정**(§2/§10 Toss-as-is로 교체, 인라인 "변환" 노트 전부 폐기) | ✏️ 정정 |
| `current-src-inventory.md` | B1/B1.1/B1.2 코드 실측 인벤토리(7패널+경기표+마법사 전부 ✅) | 보존(상단 정정 배너) |
| `reverse-bake-gap.md` | P0 갭(패널 내부·마법사 내부 확보) | 보존(상단 정정 배너) |

> ⚠️ 인벤토리/갭의 "BDR 13룰로 번역"·"혼재 통일" 류 메모는 **상단 정정 배너로 무효화**됨 — 관리자 영역은 Toss 그대로. 사용자 영역만 BDR.

---

## 3. canonical Toss 자산 (역박제본이 재사용)

`Dev/design/BDR v2.40/_admin-unified/`: `toss.css`(토큰+`ts-*`) · `toss-kit.jsx`(Btn/Card/Modal/Badge/Icon) · `au.css`/`au-kit.jsx` · `AdminConsole.html`.
→ 워크스페이스 Toss 역박제본은 위 자산을 **복사·재사용**(BDR `tokens.css`/`admin.css` 치환 금지).

---

## 4. 다음 단계 — 관리자 워크스페이스 Toss 스타일 역박제본 (빌드)

> 본 README + 2개 lock 문서가 스펙을 확정함. 빌드는 이를 1:1로 따른다.

산출 예정: `Dev/design/BDR v2.41-admin-toss/` (또는 v2.40 _admin-unified 확장)
- `AdminTournamentWorkspace`(Toss): 요약 카드 + 5섹션 segment + 인라인 메가폼 + 7 패널 lazy 토글 — `toss.css`/`toss-kit` 그대로.
- 7 패널 내부(teams/divisions/matches/bracket/recorders/site/admins) = `function-lock-B1.md` A~I 1:1, Toss 클래스 유지.
- 생성 마법사(ct-schedule-venue/ct-game-settings) + 6 enum.
- 서버 호출 mock / 순수 클라이언트 동작 실제.

상태: **✅ 빌드 완료(2026-06-26)** — `Dev/design/BDR v2.41-admin-toss/` (`대회 운영 워크스페이스.html` + `toss.css`/`toss-kit.jsx` canonical 카피 + `workspace.css`/`data.jsx`/`panels-core.jsx`/`panels-ops.jsx`/`workspace.jsx` + `README.md`). 셸 + 7 패널 + 마법사(ScheduleVenue/GameSettings) + 6 enum, 서버 호출 mock·순수 클라이언트 동작 실제.

---

## 5. 보존/금지 재확인

- 관리자 영역: Toss 토큰/lucide/`rounded-full` = 허용. BDR 번역 = reject.
- 사용자 공개 영역: BDR 13룰 + AppNav frozen + 사용자 §1~§8 = 유지. Toss 침범 = reject.
- 운영 src 직접 수정 / API·Prisma·라우트 제안 = 전면 금지(시안은 mock).
- 기능·상태 누락 = reject(`function-lock-B1.md` 대조).
