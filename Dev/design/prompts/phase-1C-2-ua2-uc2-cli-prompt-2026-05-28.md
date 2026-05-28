# PR-1C-2 — UA2 TournamentDetail + UC2 MyRegistrationStatus 박제 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 완료**: PR-1C-1 (UA1 Tournaments) PR #650 ✅ (2026-05-28)
> **선행 의뢰**: `phase-1C-kickoff-cli-prompt-2026-05-28.md` — §6 자체 검수 / §7 역박제 / §8 안전 가드 모두 답습 (본 의뢰서에 재기술 ❌)
> **본 의뢰 범위**: PR-1C-2 1 건만 박제

---

## 1. 한 줄 요약

`BDR-current/screens/TournamentDetail.jsx` (UA2 · 452 lines) 박제 + `BDR-current/screens/MyRegistrationStatus.jsx` (UC2 공유 · 121 lines) 의 운영 컴포넌트 `_components/my-registration-status.tsx` 를 **variant prop 양측 지원** 으로 갱신.

---

## 2. 대상 시안 + 운영 라우트

| 시안 | 라인 | 운영 라우트 | 비고 |
|------|------|-----------|------|
| UA2 TournamentDetail.jsx | 452 | `src/app/(web)/tournaments/[id]/page.tsx` (684) | 박제 |
| UC2 MyRegistrationStatus.jsx | 121 | `src/app/(web)/tournaments/[id]/_components/my-registration-status.tsx` (기존) | **variant prop 갱신** |

### 공유 사용처 (시안)

```
UA2 TournamentDetail.jsx:367 → <MyRegistrationStatus variant="sidebar" />  (대회 detail sidebar)
UC1 MyActivity.jsx:160        → <MyRegistrationStatus variant="compact" /> (마이페이지 list)
```

→ UC1 (마이페이지) 측 박제는 PR-1C-5 에서 진행. 본 PR 은 **컴포넌트 자체 + UA2 사용처** 만.

---

## 3. 박제 절차

```
[Step 1] git checkout subin && git pull origin subin
[Step 2] BDR-current/screens/TournamentDetail.jsx + MyRegistrationStatus.jsx 읽기
         BDR-current/screens/tournament-detail.css 읽기 (시안 className 참조)
[Step 3] _components/my-registration-status.tsx 갱신
         · variant: 'sidebar' | 'compact' prop 추가 (default 'sidebar')
         · 시안 jsx 의 양측 분기 그대로 박제 — sidebar 풀카드 / compact 한 줄
         · 기존 prop 시그니처 유지 (호출처 영향 ❌)
[Step 4] _components/ 안 다른 컴포넌트 (tournament-hero / sidebar / tabs / about / share-button 등 22 개) 시안과 비교
         · 시안 안 새 visual 패턴 (예: hero band / 종별 chip row sticky / 5 탭 / sidebar 운영자 미리보기) 매핑
         · 추출 새 컴포넌트 0~3 (예: TournamentDivisionChips / TournamentOperatorPreview) — 시안 의도 반영
[Step 5] src/app/(web)/tournaments/[id]/page.tsx 갱신
         · API/데이터 호출 / 폴더 구조 / route param 처리 모두 유지
         · 시각만 — Hero band / chip row / 5 탭 / sidebar 보강
[Step 6] dev:3001 검증
         · /tournaments/<id> recruit / closed / completed 3 상태 화면
         · sidebar MyRegistrationStatus 노출 (사용자가 신청한 대회만)
         · 5 탭 (overview / schedule / bracket / teams / rules) 전환
         · 모바일 720px 분기 / iOS input 16px / 버튼 44px
[Step 7] lint + typecheck — npm run lint && npx tsc --noEmit
[Step 8] 자체 회귀 검수 6 케이스 (kickoff §6 답습)
[Step 9] commit + push
         git commit -m "design(1C-2): UA2 TournamentDetail v2.18 시안 박제 + MyRegistrationStatus variant 분기"
         git push origin subin
[Step 10] subin → dev PR 생성 + Cowork 알림
[Step 11] phase-ledger Phase 1 ⑪ 에 PR-1C-2 ✅ 추가
```

---

## 4. 안전 가드 (kickoff §8 by reference — 추가 주의)

본 PR 만의 특수 주의:
- ✅ `MyRegistrationStatus` 의 기존 prop 시그니처 유지 (`reg` / `onOpenMy` 등) — 호출처 (tournament-sidebar 등) 영향 ❌
- ✅ `_components/` 안 22 개 기존 컴포넌트는 **변경 최소** — 시안에 없는 시각 패턴은 그대로 유지
- ✅ UC1 (`src/app/(web)/profile/activity/page.tsx`) 에서 `MyRegistrationStatus` 를 아직 사용 ❌ — PR-1C-5 까지 보류
- ❌ `_components/my-registration-status.tsx` 위치 이동 ❌ — 본 PR 에서 위치 변경하면 UC1 라우트 의존 변경 = PR 영향 확장. variant prop 만 추가, 위치는 유지.

---

## 5. 자체 검수 (kickoff §6 by reference) + 추가 케이스

기본 6 케이스 + 본 PR 특수:
- ✅ sidebar (UA2) MyRegistrationStatus 노출 = 신청한 사용자만 (auth + reg 데이터 검증)
- ✅ 종별 chip row sticky = scroll 시 hero band 아래 fix
- ✅ 5 탭 = overview / schedule / bracket / teams / rules — 순서/명 시안 일치
- ✅ status='recruit' hero band 색상 = `var(--color-info-soft)` (recruit) / `var(--color-warn-soft)` (final-call) / `var(--color-neutral-soft)` (closed/completed)
- ✅ bracket 탭 = 버전 메타 (B5) + 본인 팀 하이라이트 — 시안 의도 그대로

---

## 6. 산출물 (CLI → 사용자)

```
1. PR-1C-2 박제 + subin → dev PR 링크 (예: #651)
2. _components/my-registration-status.tsx variant 분기 갱신
3. phase-ledger Phase 1 ⑪ 에 PR-1C-2 ✅ 추가
4. scratchpad 작업 로그 1줄
5. 미푸시 commit 알림 (있을 경우)
```

→ 사용자 (수빈) 의 다음 액션:
```
☐ PR-1C-2 결재 (subin → dev → main)
☐ "PR-1C-3 박제해줘" 한 줄 의뢰 → Cowork 가 PR-1C-3 의뢰서 자동 작성 (UB1 completed 분기)
```

---

## 7. 결재 후 CLI 다음 한 줄 응답 형식

```
✅ PR-1C-2 의뢰 확인 — UA2 TournamentDetail + UC2 MyRegistrationStatus 박제

이해: UA2 src/app/(web)/tournaments/[id]/page.tsx 갱신 + MyRegistrationStatus variant 'sidebar'|'compact' 분기 + 기존 prop 시그니처 유지 + 위치 이동 ❌

사전 점검 6 단계 시작. 결재 받기 전 박제 ❌.
```

---

**의뢰서 끝.** 수빈이 CLI 에 한 줄로 전달:
`Read Dev/design/prompts/phase-1C-2-ua2-uc2-cli-prompt-2026-05-28.md 하고 §3 박제 절차 시작해줘.`

---

## 별도 — .gitignore unstaged 처리 (Cowork 의 사전 안내)

PR-1C-1 박제 시 CLI 가 발견한 unstaged 한 줄 (`Dev/design/_zips/` ignore — Cowork 가 추가):

```bash
git diff .gitignore
# +# Design zip — Cowork 가 Claude.ai 전달용 자동 생성 (커밋 ❌ / 로컬만)
# +Dev/design/_zips/
```

**처리 옵션**:
- **권장**: 별 chore commit 으로 분리 commit + push (PR-1C-2 보다 먼저)
  ```bash
  git add .gitignore
  git commit -m "chore(gitignore): Dev/design/_zips/ ignore (Cowork zip 자동 생성 로컬 폴더)"
  git push origin subin
  ```
- 대안: PR-1C-2 박제 commit 안에 같이 묶기 (덜 권장 — PR-1C-2 가 design 변경이라 chore 같이 묶으면 PR 의미 흐려짐)

→ 사용자 (수빈) 가 위 3 줄 명령 실행 또는 CLI 에 "gitignore 한 줄 chore commit 해줘" 한 줄로 처리.
