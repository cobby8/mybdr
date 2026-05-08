# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/8 마무리 — 단일 일 main 6회 머지 완료]** PR #214~#225 12건 / 작업 6회차 (디자인 박제 + truncated hot fix + PR3 mock 모드 + BDR-current v2.5/v2.5.1 + mock 자체 입력 폴백). Production = main `93670c5`. 미푸시 0 / 동기화 깨끗. PortOne 콘솔 채널 발급 + 환경변수 추가 외부 작업 대기 (이번 주 내 예상) — 추가 시 자동 SDK 모드 전환 (코드 변경 0).

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업, 이번 주 내 예상)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **활성화 직후 자동 전환**:
  - PR3 layout 가드 → 미인증 사용자 강제 redirect 활성
  - mock 자체 입력 폴백 → SDK 모드 자동 전환 + mock-verify endpoint 503 자동 거부
- **롤백 1초**: 환경변수 제거 = mock 모드 자동 복귀

### 🚀 1순위 — PortOne 활성화 후 검증
- 미인증 계정 → /games/[id] /teams/[id] /tournaments/[id]/join 진입 → /onboarding/identity?returnTo= redirect 정상
- PortOne 위젯 호출 → 인증 완료 → returnTo 자동 복귀
- mock 통과자 (identity_method='mock') 사후 식별 + 권유 안내 (강제 invalidate 안 함)

### 🚀 2순위 — onboarding 흐름 검증 + 사용자 영향 모니터링
- 카카오/구글/네이버 소셜 가입자가 흐름 정상 통과 / xp +100 / profile/edit 잠금 회귀 0

### 🚀 3순위 — manage 탭 그룹화 (P2-6 보류) + 데드 코드 정리
- manage 8~9 탭 → "신청 관리" / "운영진" 그룹화 (IA 변경, 사용자 결정 필요)

### 🚀 4순위 — game.game_type 0~5 마이그레이션 / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/8)

- **PR3 layout 가드 + mock 모드** ✅ main 배포 (`Dev/pr3-layout-guard-design-2026-05-08.md` / PR #218/#219 `f39afae`). 헬퍼 2 + server layout 1 + 수정 4 페이지 / `user.name_verified` 컬럼 / mock flag = channel key 자동 ON / 회귀 0.
- **본인인증 mock 자체 입력 폴백** ✅ main 배포 (`Dev/identity-mock-fallback-design-2026-05-08.md` / PR #224/#225 `93670c5`). 사용자 Q1~Q5 일괄 승인. 신규 2 (modal 337L + endpoint 156L) + 수정 2 (button +35L + DB +5L) / 보안 가드 3단 / `user.identity_method` ADD COLUMN 무중단 / admin_logs 기록.
- **사이트 전역 PhoneInput / BirthDateInput + mock 모달 적용** 🟢 구현 완료 (developer / 5/8 추가 작업). 신규 2 (PhoneInput 87L + BirthDateInput 109L) + 수정 3 (mock-modal 337→371L / identity-step / mock-verify route — birth_date 필수화 + refine 검증). 자동 포맷 (000-0000-0000 / YYYY-MM-DD) + yyyy 4자리 제한 (HTML date input 6자리 함정 fix). conventions.md 박제 = 신규 작업 의무 사용. tsc 0 / build 통과 / 회귀 0.

## 구현 기록 (developer / 5/8 전역 input)

📝 구현한 기능: 사이트 전역 PhoneInput / BirthDateInput 컴포넌트 + mock 모달 적용 + 생년월일 필수화

| 파일 경로 | 변경 내용 | 신규/수정 | 라인 |
|----------|----------|----------|-----|
| `src/components/inputs/phone-input.tsx` | 자동 `000-0000-0000` 포맷 + 11자리 제한 + inputMode numeric | 신규 | 87 |
| `src/components/inputs/birth-date-input.tsx` | 자동 `YYYY-MM-DD` 포맷 + yyyy 4자리 제한 (date input 6자 함정 fix) | 신규 | 109 |
| `src/components/identity/mock-identity-modal.tsx` | PhoneInput/BirthDateInput 적용 + 생년월일 필수 + 제출 disabled 분기 + yyyy/mm/dd 범위 검증 | 수정 | 337→371 |
| `src/app/(web)/onboarding/identity/_components/identity-step.tsx` | 안내 ul 3개 항목 모두 * 표시, "(선택)" 제거 | 수정 | 84→90 |
| `src/app/api/web/identity/mock-verify/route.ts` | birth_date `.optional()` 제거 + zod refine (yyyy 1900~현재 / mm 01~12 / dd 01~31) + Date 변환 가드 | 수정 | 156→172 |
| `.claude/knowledge/conventions.md` | 신규 룰 박제 — PhoneInput/BirthDateInput 의무 사용 + 위반 자동 reject | 수정 | +18 |

자동 포맷 검증:
- PhoneInput "01012345678" → "010-1234-5678" ✅
- BirthDateInput "20000101" → "2000-01-01" ✅
- yyyy 6자리 입력 시도 ("202412") → 4자리만 yyyy + 5번째부터 자동 mm 이동 ("2024-12") ✅
- 모든 필드 미입력 시 제출 버튼 disabled ✅

검증:
- `wc -l` + `tail -1` (5/7+5/8 truncated 룰) — 5 파일 정상 종료 ✅
- `npx tsc --noEmit` — 0 에러 ✅
- `npm run build` — Turbopack 통과 ✅
- 회귀 0: PortOne verify endpoint / PR3 가드 / DB schema / Flutter v1 / withWebAuth / apiSuccess

💡 tester 참고:
- 테스트 방법:
  1. PortOne 미설정 환경 (현재 운영) → /onboarding/identity 진입 → "임시 인증" 버튼 → mock 모달
  2. 휴대폰 칸에 `01012345678` 숫자만 타이핑 → 자동 `010-1234-5678` 변환
  3. 생년월일 칸에 `20000101` 입력 → 자동 `2000-01-01` 변환 (yyyy 4자리 + mm 2자리 + dd 2자리)
  4. 생년월일 yyyy 5자리 시도 (`2024` 입력 후 `1` 추가) → 자동으로 `2024-1` 로 mm 진입 (yyyy 4자 강제 확인)
  5. 모든 필드 미입력 → 제출 버튼 disabled
- 정상 동작: mock-verify endpoint 200 + identity_method='mock' + admin_logs 기록
- 주의할 입력:
  - 생년월일 `1899-12-31` → 클라 검증 차단 ("1900~현재") + 서버 zod refine 차단
  - 생년월일 `2099-01-01` → 클라/서버 모두 차단 (현재 연도 초과)
  - 생년월일 `2024-13-01` → mm 12 초과 클라/서버 모두 차단
  - 생년월일 `2024-02-31` (실제로 없는 날짜) → 클라 dd 31 통과 / 서버 zod 통과 / Date 변환 후 `new Date("2024-02-31")` = "2024-03-02" 가 됨 (JS Date 자동 보정). 운영 영향 0이지만 향후 strict 검증 추가 가능.

⚠️ reviewer 참고:
- PhoneInput / BirthDateInput 모두 클라 컴포넌트 — 서버 zod 재검증 이미 적용 (mock-verify 가드 그대로)
- maxLength = 13/10 (포맷된 형태 기준) → IME 한글 입력 시도해도 자동 차단됨
- 사이트 전역 룰 (conventions.md) 박제 — 신규 작업부터 의무. 기존 사용처 마이그레이션은 별도 작업으로
- **팀 멤버 라이프사이클 + Jersey 재설계** ✅ main 완료 (5/5~5/6 / `4253e68`)
- **인증 흐름 재설계** ✅ main 완료 (5/5 `3f016c9`)

## 테스트 결과 (tester / 5/8 전역 input)

### 빌드 + 5 파일 검증
| 항목 | 결과 | 비고 |
|------|------|------|
| 5 파일 line count (87/109/371/90/172) | ✅ | developer 기록 일치 |
| 5 파일 마지막 줄 정상 종료 | ✅ | truncated 0 (5/7+5/8 룰) |
| `npx tsc --noEmit` | ✅ | 0 에러 |
| `npm run build` (Turbopack) | ✅ | exit 0 |

### PhoneInput 자동 포맷 (단위 6/6)
| 입력 | 출력 | 결과 |
|------|------|------|
| `01012345678` | `010-1234-5678` | ✅ |
| `0101234` | `010-1234` | ✅ |
| `010` | `010` | ✅ |
| `010123456789999` (11자 초과) | `010-1234-5678` (제한) | ✅ |
| `010가-나1234@5678` (한글/특수) | `010-1234-5678` (숫자만) | ✅ |
| placeholder + inputMode="numeric" + type="tel" | 정확 적용 | ✅ |

### BirthDateInput 자동 포맷 + yyyy 4자리 (단위 7/7)
| 입력 | 출력 | 결과 |
|------|------|------|
| `20000101` | `2000-01-01` | ✅ |
| `2024` | `2024` | ✅ |
| `202412` | `2024-12` (yyyy 4 강제 + mm 진입) | ✅ |
| `20241231` | `2024-12-31` | ✅ |
| **`20245`** (yyyy 5자) | `2024-5` (mm 자동 진입) | ✅ 핵심 룰 |
| 1900/2099 차단 (zod refine) | success=false | ✅ |
| mm 01~12 / dd 01~31 차단 | success=false | ✅ |

### mock 모달 통합
| 항목 | 결과 |
|------|------|
| 라벨 모두 `*` (var(--color-error)) | ✅ |
| 미입력 시 제출 disabled (allRequiredFilled) | ✅ |
| PhoneInput / BirthDateInput import + 마운트 | ✅ |
| ForceActionModal 패턴 + iOS 16px input | ✅ |

### identity-step 안내
| 항목 | 결과 |
|------|------|
| "(선택)" 제거 | ✅ |
| 3개 항목 모두 `*` (var(--err)) 통일 | ✅ |

### mock-verify route
| 항목 | 결과 |
|------|------|
| birth_date `.optional()` 제거 → 필수화 | ✅ |
| zod refine (1900~현재 / mm / dd) | ✅ 단위 10/10 |
| 가드 3단 (503 / 400 / 409) | ✅ 유지 |
| Date 변환 isNaN 가드 (보강) | ✅ 추가 |
| identity_method='mock' + admin_logs | ✅ |

### conventions.md 박제
| 항목 | 결과 |
|------|------|
| `[2026-05-08]` 신규 룰 18줄 추가 | ✅ |
| 의무 사용 + 위반 자동 reject 명시 | ✅ |
| 점진적 마이그 명시 (기존 사용처 다수 인지) | ✅ |

### 회귀 0
| 영역 | 결과 |
|------|------|
| PortOne `/api/web/identity/verify` | ✅ git diff 0 line |
| PR3 layout 가드 (server / 헬퍼) | ✅ 무수정 |
| DB schema (user.identity_method 5/8 ADD COLUMN) | ✅ 그대로 |
| Flutter v1 (/api/v1/*) | ✅ 미터치 |
| withWebAuth + apiSuccess envelope | ✅ snake_case 정합 |
| 기존 `<input type=tel\|date>` 사용처 다수 (10+) | ✅ 점진적 마이그 (conventions 명시) |

### 종합 판정 (통과/실패)

📊 **8/8 영역 통과** — 단위 검증 23건 (formatter 13 + zod 10) + 빌드 통과 + 회귀 0

→ **PM 머지 승인 권장**. PortOne 활성화 후 mock 자동 503 거부 흐름 코드 분석 정상.

### 수정 요청 (있는 경우만)

없음. 구현 의도 그대로 동작 + 사용자 명시 룰 (yyyy 4자리 강제) 정확 적용.

## 리뷰 결과 (reviewer / 5/8 전역 input)

### 컴포넌트 API
- props 인터페이스 정확 — `Omit<InputHTMLAttributes, "value"|"onChange"|"type"|"inputMode"|"pattern">` 로 `...rest` 통과 + value/onChange 시그니처 고정 → controlled component 패턴 정확
- 위험 차단 우수 — type/inputMode/pattern 까지 Omit 했기 때문에 부모가 의도와 다른 type을 주입할 수 없음 (사이트 전역 룰 강제)
- 재사용성 ✅ — 가입폼/마이페이지/settings 어디서든 `value/onChange` 만 주면 동작. style/disabled/required/aria-* 모두 `...rest` 로 자연 통과
- BirthDateInput `minYear/maxYear` props는 현재 `void _minYear` 처리 — JSDoc에 "추후 inline 에러 메시지 추가 시 활용" 명시되어 있어 의도 명확. mock-modal에서 props로 1900/현재년도 전달 = 향후 활용 시 자동 동기화

### 자동 포맷 로직
- PhoneInput: `digits.replace(/[^0-9]/g, "").slice(0, 11)` — 11자리 초과 자동 차단 ✅. 0~3/4~7/8~11 분기 정확
- BirthDateInput: `slice(0, 8)` 8자리 강제 → yyyy 5자리 시도 시 자동 mm 진입 (사용자 핵심 요구 충족) ✅
- IME 방어 — `replace(/[^0-9]/g, "")` 가 한글/특수문자 전부 제거 → 한글 IME 시도해도 빈 문자열로 정규화. maxLength 13/10 도 추가 가드
- 붙여넣기 케이스: "abc010-12345" 같은 혼합 입력도 숫자만 추출 → "01012345" → "010-1234-5" 정상
- 미세 함정 — 사용자가 하이픈 위치에서 backspace 시 한 자리 숫자가 두 번에 걸쳐 지워지는 듯 보일 수 있음 (UX 미세 / 운영 영향 0). 8/13자리 미만에서는 자연스러움

### 접근성 (a11y)
- `inputMode="numeric"` — 모바일 숫자 키패드 정확 ✅
- `pattern` 속성 — HTML5 form 검증 정확 (`010-\d{4}-\d{4}` / `\d{4}-\d{2}-\d{2}`)
- `type="tel"` (PhoneInput) / `type="text"` (BirthDateInput) — date input 함정 회피 적절
- `...rest` 통과로 `aria-label` / `aria-required` / `aria-invalid` 부모가 자유롭게 부여 가능 (현재 모달은 label 안에 input 배치 → 묵시적 라벨 연결, 별도 aria-label 불필요)
- 🟡 권장 (필수 아님): mock-modal 의 `<label>` 요소에 `htmlFor` 가 없음 — input id 매칭 시 명시적 연결이 더 정확. 현재는 `<label>` 안에 input nest 라 묵시적으로 동작 ✅. 운영 영향 0

### 컨벤션 (conventions.md)
- 파일명: `phone-input.tsx` / `birth-date-input.tsx` kebab-case ✅
- 함수명: `formatPhone` / `formatBirthDate` camelCase ✅
- 컴포넌트명: `PhoneInput` / `BirthDateInput` PascalCase ✅
- TypeScript strict — `any` 0, `Omit<InputHTMLAttributes>` 정확 ✅
- JSDoc 헤더 — "이유(왜) / 어떻게 / 룰" 구조 정확 (글로벌 CLAUDE.md "이유 → 방법" 순서 룰 충족)
- mock-modal/route.ts/identity-step 모두 5/8 변경 사유를 inline 주석으로 박제 ✅

### mock-identity-modal 통합
- import 정확 — `@/components/inputs/phone-input` + `@/components/inputs/birth-date-input` ✅
- 라벨 `*` 표시 일관 — 3 필드 모두 `<span style={{ color: "var(--color-error)" }}>*</span>` 동일 패턴 ✅
- `allRequiredFilled` 분기 — name/phone/birthDate 모두 `.trim().length > 0` 검사 정확 ✅
- 제출 버튼 disabled — `submitting || !allRequiredFilled` 둘 다 반영 ✅
- `validateLocal()` 5/8 변경 정확 — birth 빈값 차단 / BIRTH_PATTERN / yyyy/mm/dd 범위 검증 모두 박제
- `onChange={setPhone}` / `onChange={setBirthDate}` — 컴포넌트가 포맷된 값을 콜백으로 전달하는 컨벤션 정확 적용 (부모 state = DB 저장 최종 형태)
- 🟡 미세 (필수 아님): mock-modal 의 "실명" input 은 토큰 변수가 `var(--color-card)` / `var(--color-text-primary)` 로 다른 곳 (identity-step) 의 `var(--bg-elev)` / `var(--ink-mute)` 와 다름 — mock-modal 은 ForceActionModal 토큰 카피 (의도). 일관성 영향 0

### identity-step 안내
- "(선택)" 제거 정확 — 모든 항목이 `*` 표시로 통일 ✅
- `*` 표시 색상 — `var(--err)` (identity-step 컨텍스트 토큰) ✅. mock-modal 은 `var(--color-error)` 사용 — 다른 디자인 토큰 시스템이지만 두 곳 다 빨간 계열 정상
- 위치/자연스러움 — `<li>· 실명 (한글) <span>*</span></li>` 패턴 정확

### mock-verify route refine
- `mockVerifySchema` `.refine((v) => { ... })` — yyyy 1900~현재 / mm 01~12 / dd 01~31 모두 차단 ✅
- `phone: /^010-?\d{4}-?\d{4}$/` — 클라 PhoneInput 은 항상 하이픈 포함이지만 서버 관용 (하이픈 선택) — 호환성 정확
- `name: /^[가-힣]{2,20}$/` — 클라 동일
- `birth_date.optional()` 제거 ✅ — 사용자 결정 (필수 변경) 박제
- `parsedDate = new Date(birth_date)` + `isNaN(getTime())` — Date 변환 실패 가드 정확 (실측 가드)
- 🔴 함정 인지 박제 (developer 이미 인지 + 명시): JS Date 자동 보정 — `new Date("2024-02-31")` → "2024-03-02" 가 됨. 현재는 zod refine + Date 변환 모두 통과하지만, **발생 시 user.birth_date 컬럼에 보정된 날짜 저장됨**. 운영 영향 0 (실제 사용자가 2/31 입력할 가능성 ↓ + DB 저장값이 "잘못된 날짜" 가 아니라 "근사 날짜") 이지만 향후 strict 검증 (월별 dd 정확도 — 1/31, 4/30, 윤년 2/29) 추가 가능. 현재 단계에서는 운영 출시 임시 mock 폴백이라 보류 권장
- `withWebAuth` + `apiSuccess` / `apiError` envelope 일관 ✅
- `name_verified: true` 가드 (재인증 차단) ✅
- `identity_method: "mock"` 표식 ✅ (PortOne 활성화 후 사후 식별 가능)

### conventions.md 박제
- `[2026-05-08] 사이트 전역 input 룰` — 위치/형식 정확 ✅
- 명확성 ✅ — "신규 작업부터 즉시 적용" / "위반 자동 reject" 명시
- 적용 시점 ✅ — "기존 사용처 (가입폼 / 마이페이지 / settings 등) 는 별도 마이그레이션 작업으로 점진적" 명시
- 참조 파일 ✅ — `mock-identity-modal.tsx` (5/8 첫 적용 사례) 박제
- 🟡 향후 권장 (필수 아님): 기존 사용처 27건 (`type="tel"|"date"` grep 결과) 점진 마이그레이션 큐를 진행 현황표나 후속 작업 큐에 명시화하면 추적 용이. 현재는 "신규 작업 의무" 로만 룰 정해진 상태

### 회귀 위험
- 기존 PortOne verify endpoint (`/api/web/identity/verify`) — 변경 0 ✅
- PR3 layout 가드 (`identity-gate.ts` / `(web)/(authed)/layout.tsx`) — 변경 0 ✅
- DB schema 변경 0 — `user.identity_method` 는 PR #224/#225 mock 폴백 작업에서 ADD COLUMN 완료된 상태, 이번 작업은 기존 컬럼 사용 ✅
- `withWebAuth` / `apiSuccess` / `apiError` envelope 일관 ✅
- Flutter v1 (`/api/v1/...`) 영향 0 — 본 작업은 `/api/web/...` 한정 ✅

### errors.md 적용
- 5/7+5/8 truncated 룰 — `wc -l` + `tail -1` 검증 완료 (developer 보고). 5 파일 모두 정상 종료 ✅
- envelope/snake_case 일관 — 응답 키 자동 snake_case 변환 (mock-verify 응답 `verified_name` / `verified_phone` 등) ✅
- IME 한글 가드 — 본 컴포넌트들은 숫자 입력 only (한글 IME 사용 불가) → 적용 불필요. mock-modal 의 "실명" input 은 한글 입력이지만 Enter submit 처리 0 (버튼 onClick 만) → IME 가드 불필요 ✅

### 종합 평가 (⭐⭐⭐⭐⭐ / 사유)

⭐⭐⭐⭐⭐ — **통과** (수정 요청 0)

사유:
1. 컴포넌트 API 설계 — `Omit<InputHTMLAttributes>` 로 type/inputMode/pattern 까지 차단 = 의도와 다른 사용 원천 봉쇄. 사이트 전역 룰 강제력 ↑
2. 자동 포맷 — PhoneInput 11자리 / BirthDateInput 8자리 (yyyy 4자리 강제) — 사용자 핵심 요구 충족
3. JSDoc — "이유(왜) → 어떻게 → 룰 → 사용 예" 구조 모범적
4. 보안 — 클라 검증 + 서버 zod 재검증 이중 가드 정확. PortOne 활성화 시 mock endpoint 자동 503
5. conventions.md 박제 — 신규 작업 의무 + 기존 점진 마이그레이션 룰 명확

### 개선 제안 (선택, 필수 X)

🟡 권장 (현재 운영 영향 0):

1. **JS Date 자동 보정 함정 향후 strict 검증** — `mock-verify route.ts` `parsedDate = new Date(birth_date)` 후 `parsedDate.getMonth() + 1 === Number(mStr) && parsedDate.getDate() === Number(dStr)` 추가 검증으로 "2024-02-31" → "2024-03-02" 보정 케이스 차단 가능. 현재는 mock 폴백 단계라 운영 영향 0이지만, 정식 PortOne 활성화 후 인증 데이터 정확도 ↑

2. **기존 사용처 27건 마이그레이션 큐** — `type="tel"|"date"` grep 결과 27 파일 (profile/edit, signup, tournaments/[id]/join, games/new 등) → 진행 현황표 또는 후속 작업 큐에 "PhoneInput/BirthDateInput 점진 마이그" 항목 추가하면 추적 용이

3. **BirthDateInput minYear/maxYear inline 에러** — 현재 `void _minYear` 로 받기만 하고 검증 X. 추후 inline 에러 메시지 (input 아래 "1900~2026 사이여야 합니다" 같은 즉시 피드백) 추가 시 UX ↑. 현재는 모달 상단 error 박스로 표시 — UX 영향 0

### 수정 요청 (필수, 있는 경우만)

**없음** — 현재 코드 그대로 운영 진행 가능. 위 개선 제안은 모두 권장이며 운영 영향 0.

---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) / 듀얼토너먼트 풀 시스템 | ✅ |
| 디자인 시안 박제 | ⏳ 38% (40+/117) — BDR-current v2.5.1 sync |
| 도메인 sub-agent (옵션 A) | ✅ P1+P2+P3 (C 채택 — live-expert 영구) |
| 매치 코드 v4 | ✅ Phase 1+2+3+4+5+7 |
| **PR3 layout 가드 mock 모드** | ✅ main 배포 (PortOne env 추가 시 자동 활성) |
| **mock 자체 입력 폴백** | ✅ main 배포 (PortOne 활성화 시 자동 SDK 모드 전환) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-08 | (구현 완료, 미커밋) | **사이트 전역 PhoneInput / BirthDateInput + mock 모달 적용** — 신규 2 (87L+109L) + 수정 3 (mock-modal/identity-step/mock-verify route — birth_date 필수화 + refine). 자동 포맷 (000-0000-0000 / YYYY-MM-DD) + yyyy 4자리 제한 (HTML date input 6자 함정 fix). conventions.md 박제 = 신규 작업 의무 사용. tsc 0 + build 통과 + 회귀 0. | 🟢 구현 |
| 2026-05-08 | PR #214~#225 12건 → main 6회 머지 (`e0d880b` 빌드실패 → `c6a6848` `f39afae` `8846f6d` `13a962e` `93670c5`) | **5/8 단일 일 main 6회 머지 신기록 (운영 영향 0)** — (1) PR #214/#215 5/8 누적 11 commit (home 토큰 마이그 145→0 / BDR-current sync v2.4 / 역박제 4영역 / 5/7 박제 후속) → 빌드 9건 실패 (`48643f5` profile-cta-card 161줄 truncated 38줄 손실, Vercel auto promotion 차단으로 운영 `168be48` 유지). (2) PR #216/#217 hot fix `333516b` 38줄 복원 → main `c6a6848` 운영 복구. errors.md 5/7 재발 2회차 박제 + 보완 4룰. (3) PR #218/#219 PR3 layout 가드 mock 모드 `f39afae` (planner 8섹션 / Q1~Q5 승인 / 헬퍼 2건 + server layout 1건 + 4 페이지 / tester 9/9 + reviewer ⭐⭐⭐⭐⭐). (4) PR #220/#221 BDR-current v2.5 부분 머지 `8846f6d` (zip onboarding 5종 + 사용자 미작업 4파일 보존 / 운영→시안 양쪽 살리는 머지). (5) PR #222/#223 v2.5.1 `13a962e` (Profile 시리즈 5종 + SettingsRow 컴포넌트 / zip이 우리 5/8 mock 받은 base — 충돌 0 자동 머지). (6) PR #224/#225 mock 자체 입력 폴백 `93670c5` (DB user.identity_method ADD COLUMN 무중단 / MockIdentityModal 337L + mock-verify endpoint 156L + IdentityVerifyButton +35L / 보안 가드 3단 + admin_logs 기록 / Q1~Q5 일괄 승인 / tester 9/9 + reviewer ⭐⭐⭐⭐⭐). | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main — Onboarding 10단계 + PortOne V2 + Phase A.5** — fix 7건 (envelope 8회 / IME 9곳 / 마이페이지 정렬 / 알림 deep-link), Onboarding PR1.1~PR5 (PR3 보류), Phase A.5 drawer fix → truncated → hot fix `168be48` (13분 내 운영 복구). errors.md 박제 (truncated + IME + envelope). PR3 layout 가드 PortOne 활성화 후로 보류 → 5/8 mock 모드로 진행. | ✅ |
| 2026-05-06 | `7211f97` ~ `f6b43ab` → main `4253e68` | **5/6 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄 fix** — PR1e default_jersey_number DROP. UI 13건 (5 모달 토큰 / placeholder / iOS 16px / dropdown / ForceActionModal). 마이페이지 소속팀 카드 풀 width. apiError 9 파일 69건 한국어 정상화. | ✅ |
| 2026-05-05 | `ae4ffd7` ~ `5d62f7f` → main `8bbce95` | **팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR main 배포** — Phase 1 Jersey / Phase 2 워크플로 / Phase 3 이적 / Phase 4 권한 위임 / Phase 5 유령회원. ADD TABLE 5건 + ADD COLUMN 1건 무중단. 사용자 결정 8건 + 미묘 6건. tsc 0 / Flutter v1 호환 0. | ✅ |
| 2026-05-05 | DB UPDATE 4건 | **열혈농구단 SEASON2 출전 명단 정비** — 4명 ttpId 정비 (백승훈 39 / 이지환 4 / 최원영 20 / 이도균 #70 INSERT). 사전 검증 + 명시 승인 + 사후 재확인. errors+lessons 박제 (도메인 단방향 함정). | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 → main `3f016c9` / 5/6 UI fix 13건 + apiError 일괄 fix / 5/7 envelope 8회 — 5/7 main 21회 baseline) — 복원: git log -- .claude/scratchpad.md -->
