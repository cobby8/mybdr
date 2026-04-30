# CLI 세션 인계 — 2026-04-30 후반

> **상태**: active (긴급 인계)
> **사유**: CLI 응답 먹통 — 이미지 dimension limit 초과 + 무한 응답 멈춤
> **인계 시점**: 2026-04-30 17:25 KST (HEAD 기준 17:17 직후)
> **주말 대회 D-?**: 시급

---

## 0. 한 줄 요약 (다음 세션 첫 컨텍스트)

> **HEAD = `4def6d3` (subin = main = dev 동일).**
> v2.2 박제 완료 → Phase 12 본인인증 + 시즌통계 진행 중 → **운영 회귀 1건 (`a2081ba`) 긴급 픽스 + 모바일 탭 픽스 (`4def6d3`) 추가 배포**.
> **미해결**: 사용자 `mybdr.kr/profile/settings` 저장 여전히 실패 보고 — **Service Worker 캐시 의심** (DevTools 진단 가이드 중 CLI 먹통).

---

## 1. 진척 — v2.2 박제 (1df88a7) 이후 6 커밋

| 시각 (KST) | 커밋 | 작업 | 영향 |
|---|---|---|---|
| 16:28 | `1df88a7` | (v2.2 마지막) feat(more-groups): refereeInfo 진입점 등록 | v2.2 박제 11건 + 인프라 = 16 커밋 완료 |
| 16:37 | `64d5abc` | style(personal-hero): lucide-react 7 아이콘 → Material Symbols Outlined | **이전 P1-1 작업 진행** (DESIGN.md 위반 정리) |
| 16:38 | `1d74ba4` | docs(design): Phase 12 계획서 + v2.2 작업 프롬프트 영구 보존 | `Dev/design/phase-12-plan-2026-04-30.md` |
| 16:45 | `123ce60` | feat(phase-12): 시즌 통계 + 본인인증 통합 schema (12-1+12-2) | DB 스키마 추가 (`name_verified`, `verified_at`, 시즌통계 테이블) |
| 16:55 | `f5dfcea` | feat(phase-12): 12-3 API + 12-4 ProfileGrowth 데이터 + 12-5 Portone mock | API + 데이터 fetching + 결제 mock |
| 17:07 | `a2081ba` | 🚨 fix(profile): PROFILE_DETAIL_SELECT name_verified 회귀 차단 (긴급) | **운영 회귀 픽스** |
| 17:17 | `4def6d3` | fix(profile/edit): 모바일 5탭 라벨 세로 글자 끊김 픽스 (HEAD) | 366px 모바일 5탭 가로 스크롤 |

→ **v2.2 + Phase 12 = 22 커밋 모두 main 배포 완료** (subin = main = dev = 4def6d3).

---

## 2. 🚨 미해결 이슈 — /profile/settings 저장 실패 (사용자 보고)

### 2-1. 보고 흐름

1. **17:00 사용자 보고** (캡처 46): 운영 `mybdr.kr/profile/settings` 저장 시 'Internal error'
2. **17:07 CLI 진단**: 직전 커밋 `f5dfcea` 의 `PROFILE_DETAIL_SELECT` 가 운영 DB 에 없는 `name_verified`/`verified_at` 컬럼 SELECT → P2022 에러
3. **17:07 CLI 픽스 `a2081ba`** 배포: SELECT 에서 신규 컬럼 2개 주석 처리 + 클라이언트 fallback (`?? false`)
4. **17:17~ 사용자 재시도**: **여전히 'Internal error' 보고** (캡처 47, 48, 49)
5. **CLI 진단 가이드**: Service Worker 캐시 의심 → DevTools "Application > Service Workers > Unregister" + "Storage > Clear site data" + 시크릿 모드 시도 안내
6. **사용자 응답**: "어디 얘기하는거야?", "어디서 찾는거야 안 보이는데"
7. **CLI 응답 멈춤** (이미지 dimension limit + 무한 wait)

### 2-2. 진단 가설 (우선순위 순)

| 가설 | 가능성 | 근거 | 다음 단계 |
|------|--------|------|---------|
| **A. SW 캐시** | 🔴 매우 높음 | a2081ba 픽스 배포 후에도 옛 코드가 실행됨 (PWA Service Worker가 옛 번들 캐시) | 사용자 시크릿 모드 또는 Cache Storage 클리어 |
| **B. Vercel CDN 캐시** | 🟠 중간 | 배포 후 CDN edge 가 옛 번들 서빙 가능 | Vercel 대시보드에서 deployment 상태 확인 |
| **C. 운영 DB 다른 회귀** | 🟢 낮음 | a2081ba 가 진단한 컬럼 외에 다른 컬럼 누락 가능 | Network 탭 PATCH 응답 (status / body) 확인 |
| **D. 라우팅 미스** | 🟢 낮음 | /profile/settings → /profile/settings api 경로 | 동일 |

→ **가장 먼저 사용자에게 시크릿 모드로 1회 시도 요청** + Network 탭 응답 확인.

### 2-3. 다음 세션 진단 가이드 (사용자 친화)

```
사용자에게 보낼 안내문 (간단):

📱 모바일 사용자 (Safari/Chrome):
1. 브라우저 새로 열기 → 시크릿/프라이빗 모드
2. mybdr.kr/profile/settings 접속
3. 로그인 → 저장 시도
4. 결과 알려주기 (성공/실패)

💻 데스크톱 사용자 (Chrome):
1. F12 → "Application" 탭 → "Service Workers" → "Unregister" 클릭
2. "Storage" → "Clear site data" 클릭
3. 페이지 새로고침 → 다시 로그인 → 저장 시도
4. F12 → "Network" 탭에서 PATCH /api/web/profile 의 응답 (status code + 응답 body) 캡처
```

---

## 3. 미커밋 변경 (참고 — src/ 영역)

git status 의 `AM src/__tests__/...` 다수는 sandbox 의 stale 정보 (이전 검증 시점 같은 패턴). 실제 변경 여부는 다음 세션 시작 시 `git diff --stat` 1회 확인 필수.

미푸시 변경 없음 (subin = origin/subin 로 추정 — push 완료).

---

## 4. 미진행 작업 (백로그)

### 🔴 P0 — 대회 직전 폴리시 (6.5h, 5 단계)

> **위치**: `Dev/design/pre-tournament-cli-batch-prompt-2026-04-30.md`

| # | 작업 | 시간 | 사용자 보고? |
|---|------|------|----------|
| Step 1 | A 가입 흐름 + C 대회 참가 흐름 | 1.5h | - |
| Step 2 | B 폼 placeholder 정리 8건 | 2h | ✅ |
| Step 3 | D-3 (web) 404 + E 모바일 검증 | 30분 | - |
| Step 4 | G 백버튼 컴포넌트 + 21 페이지 | 1.5h | ✅ |
| Step 5 | H 커뮤니티 모바일 탭 회귀 | 1h | ✅ |
| Step 6 | 통합 검증 + push + PR | 30분 | - |

→ **이슈 §2 해소 후 진행**.

### 🟠 Phase 12 잔여 (계획서 별도)

> **위치**: `Dev/design/phase-12-plan-2026-04-30.md`

12-1 ~ 12-5 진행됨. 잔여 단계는 계획서 참조.
**운영 DB Phase 12 SQL 적용 1주 후 (사용자 결정)** name_verified SELECT 활성화 (`src/lib/services/user.ts` L43~48 코멘트 해제).

---

## 5. 다음 세션 인계 프롬프트

### 옵션 A — 이슈 §2 진단 우선 (15~30분)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업 시작.

# 컨텍스트 (직전 세션 인계)
- HEAD: 4def6d3 (subin = main = dev 동일, 운영 배포 완료)
- 미해결: 사용자 mybdr.kr/profile/settings 저장 실패 (직전 a2081ba 픽스 배포 후에도 재현)
- 의심 원인: Service Worker 또는 Vercel CDN 캐시
- 직전 세션 진단 가이드 중 CLI 먹통 → 사용자 진단 미완

# 근거 문서
Dev/design/session-handoff-2026-04-30-late.md §2

# 작업

## Step 1 — 사용자 진단 결과 요청 (PM 보고)

PM 에게 다음 1줄 요청:
"사용자가 시크릿 모드 또는 SW unregister 후 /profile/settings 저장 재시도했는지?
결과: 성공 / 실패 + (실패 시) Network 탭 PATCH 응답 status + body"

## Step 2 — 결과 분기

### 케이스 A: 시크릿 모드에서 성공
→ 캐시 문제 확정. 일반 사용자에게 SW 자동 갱신 룰 강화 작업.
- src/app/layout.tsx 또는 sw.js 의 캐시 전략 검토
- "새 버전 사용 가능" 알림 → 자동 reload

### 케이스 B: 시크릿 모드에서도 실패 (다른 회귀)
- Network 탭 PATCH 응답 분석
- prisma 쿼리 다른 컬럼 누락 여부 grep
- src/app/api/web/profile/route.ts 검수

### 케이스 C: 사용자가 진단 못 함
→ Vercel Logs / Sentry 직접 확인
- vercel logs production --since 30m | grep "Internal error\|profile"
- 운영 DB 실제 스키마 확인

## Step 3 — 픽스 + 배포

진단 결과에 따라 픽스 후 a2081ba 패턴으로 긴급 배포.

# 진단 완료 후 다음 작업
대회 직전 폴리시 5 단계 (Dev/design/pre-tournament-cli-batch-prompt-2026-04-30.md).
```

### 옵션 B — 이슈 §2 보류 (PM 진단 대기) + 대회 직전 폴리시 진행

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업 시작.

# 컨텍스트
- HEAD: 4def6d3 (subin = main = dev 동일)
- 미해결: /profile/settings 저장 (PM 진단 대기 중 — Service Worker 의심)
- 사용자 결정: 진단 대기하고 대회 직전 폴리시 우선 진행

# 작업
Dev/design/pre-tournament-cli-batch-prompt-2026-04-30.md 의 § "프롬프트 (복사 시작)"
부터 § "프롬프트 (복사 끝)" 까지 그대로 따라 Step 1~6 진행.

# 주의
- /profile/edit 또는 /profile/settings 영역 만질 때는 a2081ba 의 회귀 픽스 (PROFILE_DETAIL_SELECT 컬럼 코멘트) 보존 필수
- name_verified / verified_at 활성화 금지 (운영 DB 적용 1주 후)
```

---

## 6. 시급 사용자 안내 (PM 가 사용자에게)

```
[BDR 운영 안내]

mybdr.kr/profile/settings 저장 안 되시는 분께:

1. 모바일이라면 → 시크릿/프라이빗 모드로 mybdr.kr 다시 접속해서 저장 시도
2. PC Chrome 이라면 → F12 → Application 탭 → Service Workers → Unregister
   → Storage → Clear site data → 새로고침 → 다시 로그인

여전히 안 되면 캡처해서 알려주세요. 빠르게 픽스하겠습니다.
```

---

## 7. 다음 세션 첫 명령

```bash
cd "C:\0. Programing\mybdr"

# 0. 인계 문서 읽기
cat Dev/design/session-handoff-2026-04-30-late.md

# 1. 현재 상태 검증
git remote -v
git fetch origin --prune
git branch --show-current        # subin
git log --oneline -10             # 4def6d3 (HEAD), a2081ba, f5dfcea, 123ce60, 1d74ba4, 64d5abc, 1df88a7
git status --short

# 2. 운영 배포 상태 (Vercel)
# - mybdr.kr 접속 확인
# - 또는 vercel logs

# 3. PM 에게 사용자 진단 결과 요청
```

---

## 부록 A — 검증된 사실

| 주장 | 근거 |
|------|------|
| HEAD = 4def6d3 | `cat .git/refs/heads/subin` |
| subin = main = dev 동일 | 3 ref 동일 hash |
| v2.2 박제 16 커밋 (1df88a7 까지) | 이전 검증 (session 6) |
| Phase 12 6 커밋 진행 (4def6d3 까지) | 이번 검증 chain |
| a2081ba 회귀 픽스 (운영 컬럼 부재) | 커밋 본문 직접 확인 |
| 4def6d3 모바일 5탭 픽스 | 커밋 본문 직접 확인 |
| Phase 12 계획서 존재 | `find phase-12-plan-2026-04-30.md` |

## 부록 B — 외부 참조

- **대회 직전 폴리시 CLI 프롬프트**: `Dev/design/pre-tournament-cli-batch-prompt-2026-04-30.md`
- **Phase 12 계획서**: `Dev/design/phase-12-plan-2026-04-30.md`
- **사용자 결정**: `Dev/design/user-design-decisions-2026-04-30.md`
- **이전 세션 회귀 가이드**: `Dev/design/regression-recovery-2026-04-30.md`
- **CLAUDE.md**: 프로젝트 룰
