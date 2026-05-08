# Phase A.5 추가 의뢰 — PC 더보기 drawer 깨짐 긴급 fix

> 현재 진행 중인 클로드 디자인 Phase A.5 세션에 **그대로 복사** 해서 추가 의뢰.

---

## 📋 추가 의뢰 (현재 진행 중인 Phase A.5 세션에 보낼 메시지)

```
PM 추가 의뢰 — Phase A.5 항목 11 추가 (긴급):

배경:
- PM 운영 mybdr.kr/tournaments PC 환경 에서 "더보기" 클릭 시 drawer 가
  CSS 미적용 stacked list 로 깨져서 노출됨 (스크린샷 확인).
- 9 메인 탭 + 글쓰기/알림/검색/관리자 + 5그룹 항목 모두 좌측 정렬 + 패널 컨테이너 없음
  + 그룹 구분 없음.
- Phase 19 frozen 룰 위반 — drawer 는 PC + 모바일 동일하게 깔끔한 5그룹 패널이어야 함.

작업 내용 (Phase A.5 의 §3 AppDrawer 와 같이 처리):
1. components.jsx 의 AppDrawer 함수 검수:
   - drawer 컨테이너 = position: fixed / z-index 높음 / 패널 폭 42vw (Phase A.5 §3)
   - drawer 내부 5그룹 IA — 그룹 박스 명확히 구분 (.drawer-group 또는 인라인 style)
   - 그룹 헤더 = eyebrow 작은 라벨 ("내 활동" / "경기·대회" / "등록·예약" / "둘러보기" / "계정·도움")
   - 그룹 간 구분선 = var(--border) 또는 var(--cafe-blue-hair)
   - 항목 row = 좌 아이콘 + 텍스트 + 우 chevron (var(--ink-mute))

2. drawer 표시 위치 (PC vs 모바일):
   - PC (≥769px): drawer = 우측 슬라이드 패널 (백드롭 overlay) 또는 dropdown 패널
   - 모바일 (≤768px): drawer = 풀폭 또는 42vw 슬라이드 (Phase A.5 §3 폭 그대로)
   - position: fixed / right: 0 / top: 헤더 아래 / max-height: calc(100vh - 헤더)

3. 백드롭 (backdrop):
   - drawer 외부 클릭 시 닫힘 — backdrop overlay (rgba(0,0,0,.4)) z-index drawer 보다 1 낮음
   - 모바일 + PC 둘 다 동작

4. CSS 검수 (drawer 깨짐 원인 차단):
   - 드로어 컨테이너 padding / background / border-radius 명시 (var(--bg-card) / var(--radius-card))
   - 5그룹 박스 각각 padding 16 / margin-bottom 12 / 그룹 헤더 fontSize 11 + uppercase
   - 항목 row 패딩 12 / hover 시 var(--bg-alt)
   - 모바일 / PC 분기 미디어 쿼리 누락 0

자체 검수 (Phase A.5 §3 와 같이 통과):
□ PC 1440 / tablet 900 / mobile 366 모든 viewport 에서 drawer 깨짐 0
□ 라이트 / 다크 모두 5그룹 패널 정상 노출
□ 그룹 헤더 + 항목 row + chevron 시각 정합
□ 백드롭 클릭 시 drawer 닫힘 동작
□ 햄버거 (모바일) / 더보기 탭 (PC + 모바일) 둘 다 동일 drawer 노출

추가 작업 시작.
```

---

## 🚨 PM 추가 검수 (작업 후)

PC 1440 / tablet 900 / mobile 366 viewport 모두 검증:
- BDR-current/MyBDR.html 라우터 진입 → 더보기 클릭 → 5그룹 패널 정상 노출
- 5그룹 박스 명확히 구분 (border / 헤더 라벨 / 그룹 간격)
- 백드롭 클릭 시 닫힘
- 햄버거 (모바일) 와 더보기 (PC) 동일 drawer 컨테이너 사용

## 🛠 후속 (Cowork — src/ 운영 적용)

본 fix 시안 박제 후 PM 이 Cowork 에 의뢰:
```
"Phase A.5 §3+11 클로드 디자인 시안 완료. src/components/bdr-v2/app-drawer.tsx
+ globals.css 의 .app-drawer / .drawer-group 룰 운영 적용해줘:
- PC viewport drawer 깨짐 fix (현재 운영 mybdr.kr/tournaments 에서 PC 더보기 깨짐)
- 5그룹 박스 명확 구분
- 백드롭 클릭 닫힘
검증: PC 1440 / tablet 900 / mobile 366 모두 정상 노출"
```
