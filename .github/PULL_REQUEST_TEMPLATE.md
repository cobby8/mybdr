## 변경 내용

(요약)

## 박제 회귀 점검 (BDR v2 마이그레이션 중)

다음 항목을 모두 체크해주세요:

- [ ] **박제 회귀 점검** — 옛 페이지 vs 새 페이지의 카드/탭/CTA 비교 완료
- [ ] **사라진 진입점** → 보존 위치 결정 또는 `phase-9-future-features.md` 큐 추가
- [ ] **DB/API 살아있는 기능은 `alert("준비 중")` 금지** (E형) — 라우트가 존재하면 Link로 연결
- [ ] **v1 컴포넌트 import** 잔존 시 정당한 사유 (롤백용 명시 또는 `__deprecated/` 이동 검토)
- [ ] **동일 페이지에서 v1 + v2 컴포넌트 혼합** 사용 시 의도 명시 (B형 회피)

## UI 깨짐 점검

- [ ] **모바일 viewport 366px 검증** — 가로 overflow / 글자 단위 줄바꿈 / chip 크기 확인
- [ ] **인라인 `gridTemplateColumns: repeat(N, 1fr)`** 사용 시 모바일 분기 또는 `auto-fit minmax()`
- [ ] **`grid-cols-N` Tailwind 단독** 사용 시 sm:/md:/lg: breakpoint 분기

근거: `.claude/knowledge/conventions.md` "모바일 최적화 체크리스트 10항목"

## 디자인 토큰

- [ ] **하드코딩 색상 X** — 모두 `var(--*)` 토큰 사용
- [ ] **Material Symbols Outlined만** — `lucide-react` 등 외부 아이콘 라이브러리 X

## 테스트

- [ ] `npx tsc --noEmit` 0 에러
- [ ] (가능 시) `localhost:3001`에서 변경 페이지 모바일/PC 확인

## 관련 이슈/문서

- 근거 보고서: 
- 관련 문서:
