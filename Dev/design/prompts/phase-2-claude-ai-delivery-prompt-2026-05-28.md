# Phase 2 — 경기 영역 Claude.ai 시안 박제 의뢰 (단일 paste 의뢰서)

> **목적**: 수빈이 Claude.ai BDR 디자인 시스템 Project 에 **한 번 paste** 로 Phase 2 (경기 영역 10 시안) 박제 시작
> **작성일**: 2026-05-28
> **작성**: Cowork (mybdr 메인)
> **선행 완료**: Phase 1A v2.19 sync ✅ (2026-05-26) — BDR-current/ 이미 cumulative 상태
> **선행 가이드**: `phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` (묶음 2 절차) — 본 의뢰서가 paste-ready 버전
> **다음 단계**: Phase 2 zip 회신 후 = Cowork 가 sync CLI 의뢰서 작성

---

## ⭐ 수빈 본인 액션 — 2 단계 (총 ~2분)

> **Step 1 (zip 묶기) 는 Cowork 가 자동 완료** (2026-05-28). 수빈은 zip 파일을 Claude.ai 에 drag-drop 만 하면 됨.

### Step 1 — Claude.ai 세션 열고 첨부 3건 업로드

**첨부 zip** (Cowork 가 미리 생성 — Windows 경로):
- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase2-baseline-2026-05-28.zip` (162KB / 54 파일)
- baseline 10 파일 (AdminGames / AdminGameReports / Games / GameDetail / CreateGame / GuestApply / Live / GameResult / Home / MyActivity) **포함 검증 완료**
- `.gitignore` 등록됨 — 로컬 전용 (커밋 ❌)
- 채팅에서 카드 클릭 → 파일 탐색기로 열림 → Claude.ai 에 drag-drop

**첨부 의뢰서 2건**:
- `Dev/design/prompts/game-admin-redesign-prompt-2026-05-25.md` (Phase 2A — 관리자 2 시안)
- `Dev/design/prompts/game-user-redesign-prompt-2026-05-25.md` (Phase 2B — 사용자 8 시안)

### Step 2 — 아래 §메시지 본체 를 그대로 paste

→ Claude.ai 가 §0 진입 표준 절차 따라 첫 응답 (§7 형식). 박제 시작.

---

## 메시지 본체 — Claude.ai 에 paste (아래 ``` 블록 전체 복사)

```
Phase 2 — 경기 영역 리디자인 의뢰 (총 10 시안) 시작합니다.

[선행]
- Phase 1A v2.19 sync 완료 (2026-05-26) — BDR-current 누적 = 23 파일 (jsx 17 + css 6)
- Phase 2 baseline 10 파일 (AdminGames / AdminGameReports / Games / GameDetail / CreateGame / GuestApply / Live / GameResult / Home / MyActivity) 이 cumulative 로 BDR-current/screens/ 에 보존됨 → 별도 복원 ❌

[상위 계획서]
game-user-admin-connectivity-plan-2026-05-25.md (BG1~BG7 갭 — Project Knowledge 참조)

[의뢰서 2건 — 첨부]
1. game-admin-redesign-prompt-2026-05-25.md (Phase 2A · 관리자 2 시안 = UD1 AdminGames + UD2 AdminGameReports)
2. game-user-redesign-prompt-2026-05-25.md (Phase 2B · 사용자+다리 8 시안 = UA1~UA5 + UB1 + UC1 + UC2)

[첨부 zip]
BDR-current-phase2-baseline-2026-05-28.zip — BDR-current/ 전체 (38+ 파일)
- v2.19 cumulative 상태 (Phase 1A 결과 + Phase 1B 결과 + Phase 2 baseline 10)
- 변경 ❌: Phase 1A/1B 시안 11+6 jsx + 6 css (UA1~UC2 tournament + AdminTournament*) 유지
- 작업 대상: Phase 2 baseline 10 위에 박제 (수정/보강) + 신규 0

[2026-05-25 사용자 결재 룰 — 박제 중 반드시 준수]
- BG7 = Hero 카로셀 위 sticky LIVE chip row (사용자 결정 §5 보존)
- BG2 = 평균 평점 + flag 종류만 / 개별 건수 ❌
- BG1 양측 동시 박제: UD1 (관리자 신청 알림) + UA2 GameDetail step indicator + UC1 MyActivity "내 매너" 카드 = 같은 데이터 룰 일관 노출
- Phase 1A / Phase 1B 시안 (대회 영역) 시각 변경 ❌ (carry-over)

[작업 흐름 요청]
1. 첫 응답 = 의뢰서 2건 각각의 §7 첫 응답 형식 (2 응답 또는 1 통합 응답 OK)
   ✅ BDR 디자인 의뢰 확인 — Phase 2A 경기 관리자 (의뢰서 §7 카피)
   ✅ BDR 디자인 의뢰 확인 — Phase 2B 경기 사용자 + 다리 (의뢰서 §7 카피)
   13 룰 인지 / 사용자 결정 §1~§8 보존 / AppNav frozen 03 카피
2. 박제 순서 (권장):
   - 2A · UD1 AdminGames (관리자 신청 알림 — BG1 진입)
   - 2A · UD2 AdminGameReports (매너 통계 — BG2 진입)
   - 2B · UA2 GameDetail (step indicator — BG1 양측 의존)
   - 2B · UA1 Games + UA3 CreateGame + UA4 GuestApply + UA5 Live
   - 2B · UB1 GameResult (status='completed' variant)
   - 2B · UC1 MyActivity (Phase 1B "내 대회" 위에 "내 경기" + "내 매너" 추가)
   - 2B · UC2 Home (BG7 Hero 위 sticky LIVE chip row 보강)
3. 박제 완료 후 새 zip 회신 (예상: BDR v2.20/ 또는 v2.19 갱신 + 이력 보존)
4. 13 룰 위반 발견 시 자체 reject + 알림

[양측 의존 갭 검증 — 박제 마지막 단계 필수]
- BG1: UD1 신청 큐 카드의 항목 수 = UA2 GameDetail step indicator 가 reflect 하는 신청 단계 = UC1 마이페이지 "내 경기" 신청 상태 = 모두 같은 데이터 모델
- BG2: UD2 매너 통계의 "평균 평점 + flag 종류" 룰 = UC1 "내 매너" 카드의 노출 룰 = 동일 (개별 건수 ❌)
- BG7: UC2 Home 의 sticky LIVE chip row 위치 = Hero 카로셀 위 sticky (1 행)

[자체 검수 4 케이스 — 박제 후 회귀 방지]
- ❌ main bar 우측 "더보기 ▼" / 아바타 노출 = 없음
- ❌ 모바일(≤768px) 듀얼 라벨 = 없음
- ❌ 검색·쪽지·알림 box (.btn 박스) = 없음
- ❌ main bar 5 아이콘 순서 = [다크, 검색, 쪽지, 알림, 햄버거]

[추가 자체 검수 8 케이스 — Project Knowledge 06 §자체 검수]
- ❌ 하드코딩 색상 = 0 (var(--color-*) 변수만)
- ❌ lucide-react import = 0 (Material Symbols Outlined 만)
- ❌ rounded-full / 9999px = 0 (정사각형 W=H 원형은 50% OK)
- ❌ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
- ✅ button border-radius 4px 일관
- ✅ placeholder 5단어 이내 ("예: " 시작 ❌)
- ✅ 720px 분기 / iOS input 16px / 버튼 44px
- ✅ Pretendard + Space Grotesk 만

[질문/가정 처리]
- 의뢰서에 결정 0 인 항목 발견 시 = 의뢰서 §7 형식 질문 batch 후 박제 진행
- 사용자 결정 §1~§8 위반 가능성 발견 시 = 즉시 중단 + 보고

시작해 주세요.
```

→ 위 블록 ``` 사이 본문을 Claude.ai 에 paste. Claude.ai 가 의뢰서 §0 진입 표준 절차 따라 첫 응답 + 박제 시작.

---

## 예상 Claude.ai 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — Phase 2A 경기 관리자 (UD1 + UD2)
이해: BG1 신청 알림 큐 (UD1) + BG2 매너 통계 (UD2). Phase 1A/1B 시안 carry-over (변경 ❌).
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피 / 13 룰 인지.
자체 검수: 06 §관리자 카드 / 알림 표 / 통계 차트
작업 시작.

✅ BDR 디자인 의뢰 확인 — Phase 2B 경기 사용자 + 다리 (UA1~UC2)
이해: UA1~UA5 사용자 경기 흐름 + UB1 GameResult variant + UC1 MyActivity 보강 + UC2 Home 보강 (BG7 sticky LIVE)
사용자 결정 §1~§8 보존 / BG7 Hero 위 sticky / BG2 평균+종류만 룰 / BG1 양측 의존
자체 검수: 06 §사용자 카드 / Hero / 마이페이지
작업 시작.
```

→ 위 형식 안 나오면 = Claude.ai 가 의뢰서 진입 표준 절차 미준수 → 재요청.

---

## 박제 진행 중 수빈 본인 액션 — 없음

> Claude.ai 가 박제 끝낼 때까지 대기. 중간 질문 batch 오면 응답.

---

## Phase 2 zip 회신 후 — 수빈 본인 액션 1 단계 (~10초)

```
☐ Claude.ai 가 새 zip 출력 → Downloads/ 또는 첨부로 다운로드
☐ Cowork 에 한 줄 알림: "Phase 2 zip 도착 — <파일명>"
```

→ Cowork 가 자동으로:
1. zip vs BDR-current 차이 분석
2. Phase 2 sync CLI 의뢰서 작성 (`phase-2-vX.Y-sync-cli-prompt-2026-05-XX.md` — `phase-1A-v2.19-sync-cli-prompt-2026-05-26.md` 답습)
3. 수빈에게 "이 prompt 를 CLI 에 던지세요" 안내

---

## 의뢰서 작성 자체 검수 (Cowork)

- ✅ Step 1 = zip 자동 생성 (Cowork bash) — 수빈 PowerShell 단계 제거
- ✅ zip 안 baseline 10 파일 포함 검증 완료 (`unzip -l` 로 unit check)
- ✅ `.gitignore` 에 `Dev/design/_zips/` 등록 — 커밋 오염 ❌
- ✅ Step 1 첨부 3건 (zip + 의뢰서 2) 명시 / drag-drop 만
- ✅ Step 2 메시지 본체 = single paste 가능 (~1500자 + 결재 룰 / 자체 검수 / 13 룰 포함)
- ✅ BG7 / BG2 / BG1 양측 의존 명시
- ✅ Phase 1A/1B carry-over (변경 ❌) 가드 명시
- ✅ 13 룰 자동 검수 case 4 (회귀 방지) + 8 (Project Knowledge 06) 포함
- ✅ 첫 응답 형식 명시 — Claude.ai 가 진입 표준 절차 미준수 시 재요청 신호
- ✅ 수빈 본인 액션 = **2 단계** (~2 분) + zip 도착 후 1 단계 (~10초) = 총 ~2 분 + 10 초
- ✅ Phase 2 sync CLI 의뢰서는 Cowork 가 자동 작성 (수빈 본인 액션 0)
- ✅ Phase 3+ 도 같은 패턴 적용 — Cowork 가 zip 자동 생성 / 수빈 = drag-drop + paste 만

---

## 참조 문서 (Claude.ai 가 본 의뢰 수행 중 항상 곁에 둘 것)

본 의뢰서 paste 시 첨부 zip 안에 모두 포함되어 있음:
1. `BDR-current/` 시안 32 파일 (jsx 26 + css 6) — source of truth
2. Project Knowledge 9 파일 (00-master / 03-appnav-frozen / 06-self-checklist 등)
3. 의뢰서 첨부 2건 (game-admin-redesign + game-user-redesign)

별도 첨부 ❌ — 모두 zip 안.

---

**의뢰서 끝.** 수빈이 §⭐ 3 단계 따라 진행.
