# BDR 시안 수정 의뢰 — 매칭 M2~M5 (v2.34 → v2.35 리비전)

> 대상: Claude.ai(디자인 클로드) · 기준 시안: `BDR-current/_handoff-matchmaking-M2-M5/` (v2.34)
> 성격: 신규 작업 아님 = **기존 시안 룰 위반 수정**. Cowork 감사(06 자체검수 + 13룰) 결과 기반.
> 결론: 대체로 통과. **반드시 고칠 것 2건(P0)**, 권장 1건(P1), 확정 필요 1건.

---

## 1. 감사 요약

| 검수 | 결과 |
|------|------|
| §1 AppNav 7룰 | ✅ 통과 (components.jsx 미수정, frozen 보존) |
| §2 더보기 5그룹 | ✅ 통과 (가짜링크 0) |
| §3 토큰 | ⚠️ 하드코딩 hex 일부 (대부분 mock·on-color — P1) |
| §4 카피 | 🚨 **placeholder "예:" 위반 1건 (P0)** |
| §5 모바일 | 🚨 **인라인 고정 grid 720px 미대응 (P0)** |
| lucide / pill 9999 / 핑크·살몬 | ✅ 0건 |

---

## 2. 수정 요구

### 🚨 P0-1 — placeholder "예:" 시작 위반 (사용자 결정 §B)
- **위치**: `screens/GameReport.jsx:103` 코멘트 textarea
- **현재**: `placeholder="예: 골대 하나가 낮아서 불편했음. 화장실 만실. 다음엔 30분 빨리 오픈 권장."`
- **룰**: placeholder는 **5단어 이내** + **"예:" 시작 금지** (06 §4 / 마스터 룰 12).
- **수정**: 짧은 안내형으로. 예) `경기 후기를 남겨주세요` 수준(5단어 이내, "예:" 없이).

### 🚨 P0-2 — 모바일 고정 grid 720px 미대응 (06 §5)
인라인 `gridTemplateColumns:'repeat(N,1fr)'` 은 미디어쿼리로 못 덮음(인라인 우선). 모바일에서 N칸 그대로 → 좁은 화면 압축/overflow. **className 있어도 인라인이 이김** → 인라인에서 `auto-fit minmax()` 로 바꾸거나, 인라인 grid-template-columns 제거 후 `responsive.css` 720px 분기로 이전.

| 위치 | 현재 | 모바일 목표 |
|------|------|------|
| `MyActivity.jsx:50` | `repeat(4, 1fr)` 카운터 | ≤720px 2칸 |
| `MyRegistrationStatus.jsx:108` | `repeat(4, 1fr)` 카운터(.reg-counters) | ≤720px 2칸 |
| `Profile.jsx:123` | `repeat(6, 1fr)` | ≤720px 2~3칸 (6칸 금지) |
| `Profile.jsx:154` | `repeat(3, 1fr)` (.profile-hub-grid) | ≤720px 2칸 |
| `GameDetail.jsx:88` | `repeat(2, 1fr)` 정보 그리드 | 2칸 유지 가능(저위험) — 점검만 |

- **권장 패턴**: 카운터류는 `gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))'` (인라인 그대로 반응형) 또는 className만 두고 grid-template-columns를 responsive.css 기본+720분기로 정의(인라인 제거).
- 신뢰 카드(README D: `1.4fr 1fr 1fr`, ≤720px 2칸·등급 full-width)도 같은 원칙 — 인라인 고정이면 분기 적용.

### ⚠️ P1 — 하드코딩 hex 토큰화 (06 §3, 권장)
박제 시 자동 교체되지만 시안 정합 위해 권장:
- `GameReport.jsx:13-18` mock 선수 유니폼색 `#DC2626`/`#0F5FCC` → `var(--bdr-red)` / `var(--cafe-blue)`.
- on-color 텍스트 `#fff`/`#000` (`GameDetail:183/184/200`, `Games:167/216`, `MyActivity:80`, `Profile:41`) → `var(--color-on-primary)` 등 토큰.

---

## 3. 확정 필요 (수정 아님 — 디자인 클로드가 반영)
- **매너 등급 4단계 임계값**: 현재 시안 제안 = ≥4.5 아주 좋음 / 4.0–4.4 좋음 / 3.0–3.9 보통 / <3.0 주의 필요. → 이대로 확정(수빈 OK). 라벨/색 토큰 유지.

## 4. 건드리지 말 것 (보존)
- AppNav(components.jsx frozen) / 신뢰 카드의 manner_score **숫자 비노출**(등급 라벨만) / HeroCard 점수 미노출 / "시안 미리보기" 점선 바(박제 시 CLI가 제거 — 시안엔 유지 OK) / 대기열 "알림 후 수동 승격" 정책.

## 5. 박제 룰 (자동 적용)
✅ 00 13룰 / ✅ AppNav 03 frozen 카피 / ✅ 02 토큰만 / ✅ 01 §1~§8 보존 / ✅ 06 자체검수 통과 후 제출.

## 6. 산출물
- 수정 화면: `GameReport.jsx`, `MyActivity.jsx`, `MyRegistrationStatus.jsx`, `Profile.jsx`, (점검)`GameDetail.jsx`, `responsive.css`.
- zip 전달 → Cowork가 `BDR-current/_handoff-matchmaking-M2-M5/` 갱신(델타 보존 방식).
- README에 v2.34 → v2.35 변경 요약(위 P0/P1 반영).

## 7. 첫 응답 형식
```
✅ BDR 시안 수정 확인 — 매칭 M2~M5 v2.35 리비전
이해: P0-1 placeholder "예:" 수정 / P0-2 모바일 고정 grid 720 분기 / P1 hex 토큰화 / 매너 등급 임계값 확정
보존: AppNav frozen · 매너 숫자 비노출 · 점선 바 유지
작업 시작.
```
