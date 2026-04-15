# 작업 스크래치패드

## 현재 작업
- **요청**: 라이브 경기 페이지(/live/[id]) 라이트모드 + 글자 크기 확대(2단계) + 헤더에 ThemeToggle 추가
- **상태**: developer 위임
- **현재 담당**: developer
- **사용자 결정**: ① 글자 두 단계 확대(xs→base, sm→lg) ② 헤더에 ThemeToggle 추가 ③ 풀스크린 유지

## 전체 프로젝트 현황 대시보드 (2026-04-15)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 87개 (Referee 시스템 14개 추가) |
| Web API | 120+ 라우트 |
| 미푸시 커밋 | 0개 |
| 열린 PR | #8 (subin → dev, Phase 2C) |

## Phase 2: 팀명 한/영 구조화 ✅ 전체 완료
| 단계 | 상태 | 커밋 |
|------|------|------|
| 2A-1 스키마 추가 | ✅ | 66e6736 |
| 2A-2 API/검색/Zod | ✅ | e6a0ef7 |
| 2B 생성/수정 폼 UI | ✅ | c53fb71 |
| 2C 표시 UI 일괄 반영 | ✅ | ef43637 |
| dev 머지 + 충돌 해결 | ✅ | 69d0479 (수빈 버전 상위 호환 채택) |
| dev PR | ✅ | #8 리뷰 대기 |

## ⚠️ 원영에게 공유 (미해결)
- `db push --accept-data-loss`로 개발 DB의 referee/association 23행 삭제
- schema 구조는 복원(커밋 66e6736), 데이터는 빈 상태
- subin-referee 작업 재개 시 데이터 재입력 필요
- PR #8에도 공유 섹션 포함
- 상세: `.claude/knowledge/errors.md` 2026-04-15 항목

## 💡 운영 팁 (이 세션에서 확립)
- gh 인증이 풀리면: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...` 로 세션 단위 우회
- 영구 복구는 `"/c/Program Files/GitHub CLI/gh.exe" auth login`

## 구현 기록 (developer)

### 라이브 페이지 라이트모드 + 시인성 개선 (2026-04-15)

📝 구현한 기능: `/live/[id]` 페이지를 테마 반응형(라이트/다크)으로 전환하고 글자 크기를 두 단계 확대, 헤더에 ThemeToggle 추가.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/app/live/[id]/page.tsx | 하드코딩 색상 전면 CSS 변수화 + 글자 2단계 확대 + ThemeToggle 추가 | 수정 |

🗂 사용한 CSS 변수 매핑:
| 기존 (하드코딩) | 변경 후 (CSS 변수) |
|------|------|
| `#0A0A0F` (페이지 배경) | `var(--color-background)` |
| `#141416` (카드/헤더/테이블 배경) | `var(--color-card)` |
| `#111118` (PBP 컨테이너, TOTAL sticky bg) | `var(--color-elevated)` |
| `text-white`, `text-gray-200/300` | `var(--color-text-primary)` |
| `text-gray-400` | `var(--color-text-secondary)` |
| `text-gray-500/600` | `var(--color-text-muted)` |
| `border-white/10`, `/5`, `/20` | `var(--color-border)` |
| `bg-white/[0.02]` (zebra 짝수) | 투명 |
| `bg-white/[0.04]` (zebra 홀수 / TOTAL) | 중립 회색 `rgba(127,127,127,0.06)` / `0.10` |
| `border-orange-500` (로딩 스피너) | `var(--color-primary)` |
| `bg-red-500`, `text-red-400` (LIVE) | `var(--color-status-live)` |
| 하단 `bg-[#0A0A0F]/90` | `color-mix(in srgb, var(--color-background) 90%, transparent)` + backdrop-blur |

✍️ 글자 크기 확대 (2단계):
- 박스스코어 테이블 `text-xs` → `text-base` (thead/tbody)
- DNP 라벨 `text-[10px]` → `text-xs`
- 팀명 헤더 `text-sm` → `text-lg` (스코어카드 + 박스스코어)
- 헤더 토너먼트명 `text-sm` → `text-base`
- 상태/LIVE 라벨 `text-xs` → `text-sm`
- PBP 테이블 `text-xs` → `text-base`
- PBP 섹션 헤더 `text-sm` → `text-lg`
- 하단 fixed bar `text-xs` → `text-sm`
- 프린트 버튼 `text-sm` → `text-base`
- **유지**: 점수 `text-6xl`, 콜론 `:`, 라운드명, 쿼터 테이블 `text-sm`

🎨 헤더 ThemeToggle 추가:
- `import { ThemeToggle } from "@/components/shared/theme-toggle"` 추가
- 새로고침 버튼 **왼쪽**에 배치 (테마 → 새로고침 순)

💡 PM/tester 참고:
- **테스트 방법**: `/live/[경기ID]` 접근 → 헤더 우측 테마 토글 클릭 → 배경/글자색/줄무늬/스피너 모두 즉시 전환되는지 확인
- **정상 동작**: 라이트 모드에선 흰 배경 + 검정 글자, 다크 모드에선 검정 배경 + 흰 글자. 팀 컬러(동그라미/점수 숫자)는 테마와 무관하게 DB 색상 그대로.
- **주의해서 볼 입력값**: 
  1. LIVE 상태 경기 → 빨강 인디케이터가 라이트 모드에서도 진하게 보이는지
  2. 점수 변경 플래시(scale+brightness) 효과가 라이트 모드에서도 자연스러운지
  3. 박스스코어 가로 스크롤 시 sticky 컬럼(번호/이름/TOTAL)이 투명해지지 않고 card/elevated 배경을 유지하는지
  4. 프린트(Ctrl+P) — 기존과 동일하게 검정 잉크 + 흰 배경 출력되어야 함 (프린트 영역 인라인 #000/#666/#999는 보존)
- **tsc 결과**: 소스 에러 0건 통과 (src/ 하위 에러 없음, .next/dev/types/routes.d.ts의 자동생성 파일 에러는 Next.js 내부 이슈로 본 수정과 무관)

⚠️ 잠재 이슈:
- `color-mix(in srgb, ...)` CSS 함수는 모든 최신 브라우저 지원(Chrome 111+, Safari 16.2+, Firefox 113+). IE/구형 브라우저에서는 fallback 없음(BDR은 모던 브라우저 대상이므로 문제 없음 예상).
- 하단 fixed bar의 `backdrop-blur`가 globals.css의 `html.dark [class*="backdrop-blur"]` 오버라이드(배경 rgba(26,29,39,0.92))와 간섭할 수 있음 — 다크 모드에서 배경이 더 진해 보일 수 있으나 기능 이슈는 없음.
- ThemeToggle 컴포넌트의 hover 색상(`rgba(27,60,135,0.08)`)이 다크 모드에서는 살짝 덜 보일 수 있지만 이는 공통 컴포넌트의 기존 동작.

🎁 컨벤션 후보 (conventions.md 승격 제안):
- **풀스크린 / (web) 그룹 밖 페이지**에도 ThemeToggle을 개별 배치해야 한다는 패턴 — 라이브/프린트 중심 페이지는 사이드바 없이도 테마 전환 UI 필요.

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-15 | developer | /live/[id] 라이트모드 + 글자 2단계 확대 + ThemeToggle 헤더 추가 | ✅ 완료 |
| 04-15 | pm | knowledge 갱신 (errors +1, lessons +2) + scratchpad Phase 2 완료 처리 | ✅ 완료 |
| 04-15 | pm | dev PR #8 생성 (git credential로 gh 우회) | ✅ 완료 |
| 04-15 | pm | dev 머지 + validation/team.ts 충돌 해결 + 2차 푸시 (69d0479) | ✅ 완료 |
| 04-15 | pm | Phase 2C 커밋 + 1차 푸시 (ef43637) | ✅ 완료 |
| 04-15 | pm | scratchpad 경량화 (163→50줄) | ✅ 완료 |
| 04-13 | developer | Phase 2B: 팀 생성/수정 폼 UI 영문명 + 대표언어 토글 (c53fb71) | ✅ 완료 |
| 04-15 | developer | Phase 2A-2: Team name_en API/Zod/검색 반영 (e6a0ef7) | ✅ 완료 |
| 04-15 | developer | Phase 2A-1: Team.name_en/name_primary + Referee 14모델 (66e6736) | ✅ 완료 |
| 04-15 | developer | 참가팀 탭 → TeamCard 재사용 UI 통일 (2b69d12) | ✅ 완료 |
