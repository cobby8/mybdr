# admin-v2 백오피스 시각충실도 QA — 결과 (Cowork → CLI)

> 의뢰: `admin-v2-backoffice-visual-qa-cowork-2026-06-28.md`
> 대조: 라이브 `/v2` (수빈 로컬 캡처 1장: `관리자 홈`) + 구현 코드(`src/styles/admin-v2/*`, `src/components/admin-v2/*`, `src/app/(admin-v2)/v2/page.tsx`) ↔ 시안 정본(`toss.css`/`admin-pages.css`/`admin-blocks.jsx`/`toss-kit.jsx`, `screenshots/01~03-백오피스.png`, `01-관리자홈.png`)
> 방식: 라이브 Chrome 제어가 localhost 루프백을 못 잡아(외부 https만 통과) computed-style 측정 불가 → **라이브 스크린샷(시각) + 코드↔정본 토큰 1:1 대조(정밀)** 혼합. 코드/DB 미수정.

---

## 0. 결론 먼저 (핵심)

**토큰·CSS·컴포넌트 레이어는 정본과 1:1로 충실하게 박제돼 있음.** "시안보다 깔끔함이 떨어진다"는 느낌의 **주원인은 시각 결함이 아니라 (1) 실데이터 희박 + (2) 빈 상태 처리 미흡 두 가지**다. 즉 CLI가 고칠 "토큰 어긋남"은 거의 없고, **빈 상태/제로값 렌더링 + 사소한 마크업 정리**가 실질 작업이다.

검증된 1:1 항목(이탈 0):
- `src/styles/admin-v2/toss.css` = 정본 `toss.css` 값 전부 동일(색/라운딩 24·16·14·12/그림자 `--sh-*`/`--sidebar-w` 248 …). `[data-admin="v2"]` 스코프만 추가.
- `src/styles/admin-v2/admin-pages.css` = 정본 `admin-pages.css` 1:1(`.ad-kpi` radius 20·pad 20·`--sh-sm`/icon 40·radius 12/`.ad-kpi__val` 28·800·-0.03em/`.ad-bars` 160 …).
- `PageHead`(`.ts-ph__title` 28/800/-0.03em·eyebrow `--primary`), `KpiGrid`(`.ad-kpi__val`), `AdBarPanel`(막대 height `v/max*130` — 정본과 **동일 계수**), `AdListPanel` 마크업 = 정본 verbatim.

---

## 1. H1(타이포 누수) 수정 — 충분한가?

**거의 충분함. 촘촘함 복원됨.** `toss.css` L76:
`[data-admin="v2"] { font-size:16px; line-height:normal; font-feature-settings:normal; font-family:var(--ff); }`
→ 운영 `globals.css body`의 `font-size:var(--fs-body)` / `line-height:var(--lh-body)` / `font-feature-settings:"tnum","ss01"` / `font-family:var(--ff-body)` 누수를 **정본 기준값으로 전부 리셋**. 4개 임팩트 속성 모두 차단됨.

남은 잔향 1건(미세, 선택): `globals.css body { text-rendering: optimizeLegibility }` 는 admin 루트가 리셋하지 않아 `/v2`로 상속됨. 정본 데모는 브라우저 기본(`auto`)이라 엄밀히는 이탈이지만, 체감 차이 거의 없음. 완벽주의면 L76에 `text-rendering: auto;` 한 줄 추가로 정본과 100% 일치.

---

## 2. 우선순위 차이표 (CLI 전달용)

| 우선순위 | 화면/요소 | 시안 모습(값) | 현재 모습(값) | 추정 원인 / 수정 방향 |
|---|---|---|---|---|
| **High** | 대시보드 전반 "완성도" 체감 | 시안은 리치 mock(12,840·차트 6개월 우상향·처리대기 23건 리스트)으로 꽉 참 | 실데이터 희박(692·121·**0**·**0**, 차트 4·5월만, 처리대기 **0건**) → 우측 패널/차트 여백 큼 | **시각 결함 아님(의도된 실집계)**. 단 체감 1위 원인. 아래 Med 2건(빈상태/제로막대)을 고치면 희박해도 "정돈된" 인상으로 바뀜 |
| **Med** | 처리 대기 패널 (`AdListPanel`, items=0) | — (시안은 항상 항목 있음) | 헤더("처리 대기" + 뱃지 `0`) 아래 **빈 흰 패널**(빈상태 메시지 없음) → 미완성 인상 | `AdListPanel`에 `items.length===0`이면 `.ts-empty`(아이콘+「처리할 항목이 없습니다」) 렌더 분기 추가. *정본 `.ts-empty` 토큰 이미 존재* |
| **Med** | 월별 신규가입 차트 0값 막대 | 모든 달 막대 가시 | `v=0` 달은 `height:0px` → 막대 안 보이고 라벨만 → "깨진 차트"처럼 보임 | `AdBarPanel` 막대 높이에 최소 baseline(예: `Math.max(v/max*130, 2)`px) 또는 0값에 `--grey-200` 점선 트랙. (데이터성이나 시각 인상 개선) |
| **Low** | "운영 콘솔 바로가기" 섹션 라벨 | 정본 섹션 라벨 패턴 | `page.tsx`에서 **인라인 스타일**(`fontSize:13;fontWeight:800;color:ink-mute;letterSpacing:.02em`) + 래퍼 `marginTop:22` | 재사용 클래스화 + 섹션 리듬 통일(`.ad-section` = `margin-bottom:28`과 어긋난 22 → 28 권장) |
| **Low** | 타이포 잔향 | 정본 `text-rendering:auto` | `optimizeLegibility` 상속(§1) | L76에 `text-rendering:auto;` 1줄 (선택) |
| **info(결함아님)** | KPI 3·4번(인증대기·정지) delta pill 없음 | — | 우측 상단 비어 보임 | 상태 스냅샷(과거값 미보존)이라 **의도적 생략**. mock 금지 정책상 정상 |

---

## 3. 가장 임팩트 큰 차이 Top 3

1. **처리 대기 빈 상태 미처리 (Med)** — 0건일 때 빈 흰 패널. `.ts-empty` 빈상태 추가가 "완성도" 체감을 가장 크게 올림. 단일 컴포넌트 수정.
2. **차트 0값 막대 비가시 (Med)** — 막대 최소 baseline 또는 0값 트랙 처리. 희박 데이터에서도 차트가 "동작 중"으로 보이게.
3. **섹션 라벨 인라인 스타일 + 간격 불일치 (Low)** — 클래스화 + `marginTop:22→28`로 섹션 리듬 통일. 누적 정돈감.

> 위 3건 외 토큰/그림자/radius/폰트 레벨 어긋남은 **코드 대조상 발견 0**. 데이터만 채워지면(또는 빈상태만 보완하면) 시안과 동일 톤.

---

## 4. 검증 못 한 부분 (후속 캡처 필요)

- **computed-style 픽셀 측정**(그림자 농도·서브픽셀 간격) — 라이브 제어 불가로 미측정. 단 CSS가 1:1이라 구조상 일치 추정.
- **`/v2/user-console`**(리스트/행상세 드로어/계정정지·단체인증 모달) — 라이브 캡처 0. 코드(`_console.tsx`/`_detail.tsx`)는 미정독. 시각 확인하려면 해당 화면 스크린샷 4종(§의뢰 2~4) 추가 필요.
- **백오피스 vs 관리자홈 시안 정합** — 라이브 `/v2`는 단일 시안(`01-백오피스.png` 또는 `01-관리자홈.png`)과 1:1 아님. PageHead+KPI+차트+처리대기(=백오피스 대시보드) **＋** 운영콘솔 바로가기(=관리자홈)를 **병합한 화면**. 의뢰의 "백오피스 1:1 대조" 전제는 이 병합 구성에는 부분만 적용됨. → 병합 구성 자체가 의도된 설계인지 PM(수빈) 확인 1건 권장.

---

## 5. CLI 액션 요약 (바로 적용 가능)

```
[Med] src/components/admin-v2/blocks.tsx · AdListPanel
      items.length===0 → <div className="ts-empty"> … 「처리할 항목이 없습니다」 분기 추가
[Med] src/components/admin-v2/blocks.tsx · AdBarPanel
      height: Math.max((c.v/max)*130, 2) + "px"  (0값 baseline)  ※정본 계수 130 유지
[Low] src/app/(admin-v2)/v2/page.tsx
      "운영 콘솔 바로가기" 인라인 라벨 → 클래스화 / 래퍼 marginTop:22 → 28(.ad-section 리듬)
[Low] src/styles/admin-v2/toss.css L76
      text-rendering: auto;  추가(정본 100% 일치, 선택)
```
