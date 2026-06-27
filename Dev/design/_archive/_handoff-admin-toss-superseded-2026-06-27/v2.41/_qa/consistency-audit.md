# _qa/consistency-audit.md — BDR-current 디자인 일관성 QA

> 작성 2026-06-25 · 범위: in-project `BDR-current`(phase10, 2026-06-13) + `Dev/design/BDR v2.40/_admin-unified/`.
> ⚠️ 본 감사는 **현 시안 baseline 자체의 정합**을 점검합니다. brief 5단계상 P0/P1 역박제(`reverse-bake-gap.md` B1~B5)가 끝나면 신규 화면 기준으로 재실행해야 완결됩니다.
> 토큰 출처: `BDR-current/tokens.css` 실측.

---

## 0. 한 줄 결론

사용자 프론트(`(web)` 시안군)는 13룰 **대체로 준수**(문서화된 예외 외 위반 경미). 반면 **v2.40 통합 Admin 콘솔은 의도적으로 BDR 시스템과 분리된 Toss 시스템**(lucide · Toss Blue · radius 24px · 라이트)으로 빌드돼 있어, BDR 토큰 기준 일관성에서 **가장 큰 갈림**입니다. → PM 결정 필요(§9).

---

## 1. 토큰 정합 (룰 10)

| 항목 | 상태 | 근거 |
|---|---|---|
| `--accent`=BDR Red `#E31B23` / `--cafe-blue` / `--ink*` / `--bg*` / 상태색 | ✅ tokens.css 정의 일관 | `tokens.css` 9–50 |
| 사용자 화면 색상 = `var(--*)` | ✅ 대체로 준수 | screens 다수 `var(--*)` |
| **트로피/MVP 골드 하드코딩** `#B47A11 #F4C76C #FBF0D6 #FBF6E6 #6B5210 #4A3705` | 🟡 부채 | `GameResult.jsx:94`, `tournaments.css:264-274`, `notify-shared.css:14,21`, `ProfileAchievements.jsx:24` |
| **신뢰도 mid 색** `#8B5A0F` | 🟡 부채 | `AdminTournamentProspectus.jsx:153` |
| 인라인 `#fff`(컬러 배경 위 텍스트) | 🟢 경미 | 다수 — `--on-accent` 류 토큰 부재 |
| mock `brand_color`(`#0F5FCC` 등 팀/단체) | ✅ 허용 | 운영 `organizations.brand_color` 컬럼 데이터 |
| **Toss Blue `#3182F6` / radius 24px** | ❌ 별개 시스템 | `BDR v2.40/_admin-unified/toss.css:5` |

**조치 후보**: 골드 계열을 `--trophy / --trophy-soft / --trophy-ink` 토큰으로 승격(현재 4파일 흩어짐). `--on-accent: #fff` 토큰 신설로 인라인 `#fff` 정리.

---

## 2. 아이콘 (룰 11)

| 항목 | 상태 | 근거 |
|---|---|---|
| 사용자 화면 = Material Symbols Outlined | ✅ | `font-family:'Material Symbols Outlined'` 다수 |
| `lucide-react`/lucide | ❌ **admin 콘솔만 위반** | `toss-kit.jsx:8-15`(lucide 래퍼), `AdminConsole.html:52`(`unpkg.com/lucide`) |

**조치**: Toss 콘솔을 BDR로 리스킨할 경우 lucide → Material Symbols 전면 치환(자동 치환 난이도 높음 — 아이콘 매핑 수작업).

---

## 3. 라운딩 (룰 12)

| 항목 | 상태 | 근거 |
|---|---|---|
| 버튼 4px / 카드 6~8px | ✅ | `index.html:681`, `--r-sm/--r-md` 사용 |
| `9999px` pill | 🟡 한정 사용 | `notify-shared.css:31`(검색/카테고리 chip), unread dot — 룰 12는 button/card 대상, dot/chip은 예외로 자체 기록됨 |
| **radius 24px** | ❌ admin 콘솔 | `toss.css:5` |

**판정**: 사용자 화면 라운딩 ✅. chip/dot 9999px는 README에 예외 명시 — 유지. admin 콘솔 24px만 갈림.

---

## 4. 타이포 (룰: Pretendard/Archivo/JetBrains Mono)

| 항목 | 상태 |
|---|---|
| Pretendard + Archivo(`--ff-display`) + JetBrains Mono(`--ff-mono`) | ✅ 일관 (`index.html:684`) |
| Inter/Roboto/Fraunces | ✅ 미사용 |

---

## 5. 모바일 (룰 13·15)

| 항목 | 상태 | 근거 |
|---|---|---|
| 720px 분기 | ✅ 광범위 | `tournaments.css:327`, `billing-shared.css:308`, `court/comm/growth-shared.css` 등 |
| iOS input 16px | ✅ | `tournaments.css:339,351`("input{font-size:16px}") |
| 44px 터치 | ✅ 명시 | `index.html:683` |
| `min-width:0` + 가로 이탈 방지 | ✅ 광범위 적용 | `tnl-host/td-body__main/bl-pay-row__main` 등 다수 |
| 인라인 grid `repeat(N,1fr)` 720px 분기 | 🟢 확인 필요(개별) | shared.css는 분기 있음 — screens 인라인 grid는 개별 점검 권장 |

---

## 6. UI 영문 표현 (룰 14)

| 항목 | 상태 | 비고 |
|---|---|---|
| 라벨 한글화 | 🟡 부분 확인 | `GameResult.jsx:92` "MVP · Best", chip "🏆 MVP" — MVP는 농구 통용 약어로 허용 경계. HOME/AWAY/STEP/VS 류는 별도 grep 권장 |

**조치 후보**: `_qa` batch에서 `HOME|AWAY|STEP|VS` 잔존 grep → 한글 치환 목록화(역박제 신규 화면 포함 시 함께).

---

## 7. AppNav frozen (룰 1~6 · 03)

| 항목 | 상태 | 비고 |
|---|---|---|
| 9탭 / utility bar / main bar 5컨트롤 / 다크 토글 분기 / icon-btn / 모바일 닉네임 | ✅ 시안 baseline 준수 | `index.html:676` 순서 보존 명시 |
| **운영 `app-nav.tsx` 변경분 정합** | ❔ 미확인 | 원본 필요(`source-request-list.md` 5순위) — 구조 변경이면 역박제 금지 |

---

## 8. 종합 우선순위

| 등급 | 항목 | 처리 |
|---|---|---|
| **C0 (PM 결정)** | v2.40 admin 콘솔 Toss 시스템 유지 vs BDR 리스킨 | §9 질문 — 아래 |
| **C1** | 골드 계열 토큰 승격(`--trophy*`) · `--on-accent` 신설 | 자동 치환 일부 가능 |
| **C2** | `#8B5A0F` 등 잔존 untokenized hex 정리 | 수동 |
| **C3** | `HOME/AWAY/STEP/VS` 영문 잔존 grep·한글화 | batch grep |
| **C4** | screens 인라인 grid 720px 분기 개별 검증 | 수동 |

> C0이 가장 큼. 나머지(C1~C4)는 `bake-fix-checklist.md`로 분리.

---

## 9. PM 결정 요청 (§9)

**Q. v2.40 통합 Admin 콘솔(`_admin-unified`)의 Toss 시스템(lucide · Toss Blue `#3182F6` · radius 24px · 라이트)을 유지합니까, BDR 13룰(Material · BDR Red · 4px · 다크)로 리스킨합니까?**

- README는 "동일 시스템으로 리스킨 예정"이라 적혀 있어 **리스킨이 기존 의도**로 보입니다. 확정해 주시면:
  - 리스킨 → C0를 `bake-fix-checklist.md` 최상위 batch로 편성(아이콘/색/라운딩 전면 치환, 대규모 수작업).
  - 유지 → admin 콘솔을 13룰 감사 **대상 제외**로 명시하고 사용자 프론트만 정합 잠금.

이 결정 전에는 admin 콘솔 위반을 "위반"이 아닌 "별개 시스템(미결)"으로 기록해 둡니다.
