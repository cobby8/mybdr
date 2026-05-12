# 작업 스크래치패드

## 현재 작업
- **요청**: UI-1.1 + UI-1.2 + UI-1.3 wizard UX 보강 패키지 PR
- **상태**: ✅ 구현 완료 (709 vitest 전수 통과 / tsc 0 / 회귀 0)
- **모드**: no-stop

## 구현 기록 (developer) — UI-1.1/1.2/1.3 wizard UX 보강 (2026-05-13)

📝 구현한 기능:
- UI-1.1: 양쪽 wizard (신규/편집) "경기 룰 (비고)" textarea 마운트 — game_method 저장 흐름 복원
- UI-1.2: 편집 wizard 빈 상태에서 새 시리즈 인라인 생성 — 운영자 동선 끊김 해소
- UI-1.3: 신규 wizard 시리즈 dropdown + 인라인 생성 — 대회 생성 동선 1단계 단축 (기존 2단계)
- 공통: `InlineSeriesForm` 신규 컴포넌트 + buildCreateSeriesPayload/resolveCreatedOrganization 헬퍼

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/components/tournament/inline-series-form.tsx` | wizard 공통 인라인 시리즈 생성 폼 + 페이로드 빌더 헬퍼 (~190 LOC) | **신규** |
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | UI-1.1 게임 룰 비고 textarea + UI-1.3 시리즈 dropdown/인라인 + state/로드 useEffect/POST body.seriesId | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` | UI-1.1 게임 룰 비고 textarea + UI-1.2 빈 상태 인라인 폼 + 단체 목록 로드 | 수정 |
| `src/__tests__/components/tournament/inline-series-form.test.ts` | 8 케이스 (페이로드 빌더 5 + 단체 매칭 3) | **신규** |

🔍 시니어 판단 — GameMethodInput 컴포넌트 미사용:
- 기존 `src/components/tournament/game-method-input.tsx` 는 **FORMAT_OPTIONS 4종 pill + 직접입력** 구조 (제목 = "대회 방식 상세")
- wizard 에 이미 FORMAT_OPTIONS 4종 select 가 존재 → 중복 + 사용자 의도 (비고/룰 입력) 불일치
- PM 의도 = `game_method` DB 컬럼에 비고/룰 저장. 단순 textarea 로 대체 마운트 (라벨 "경기 룰 (비고)" / placeholder "예: 올데드 / 자유 교체 / 5반칙 제외 등")
- 저장 흐름 = 기존 그대로 (POST body.gameMethod / PATCH body.game_method) — API 변경 0

💡 tester 참고:
- **테스트 방법**:
  1. (UI-1.1 신규) `/tournament-admin/tournaments/new/wizard` → Step 1 경기 설정 섹션 "경기 룰 (비고)" textarea 노출 확인
  2. (UI-1.1 편집) `/tournament-admin/tournaments/[id]/wizard` → Step 1 경기 설정에 동일 textarea + 기존 game_method 값 복원
  3. (UI-1.2) 편집 wizard, 시리즈 0개 보유 운영자 진입 → "새 시리즈 만들기" 버튼 노출 → 클릭 → 단체/이름 입력 → 생성 → dropdown 자동 선택
  4. (UI-1.3) 신규 wizard 진입 → Step 1 기본정보 아래 "소속 시리즈 (선택)" dropdown 노출 → 시리즈 선택 후 대회 생성 → DB tournaments.series_id 연결 확인
  5. (단체 미선택 시리즈) 인라인 폼에서 단체 dropdown "개인 시리즈" 선택 → 생성 → organizations.series_count 증가 0 / tournament_series.organization_id = NULL

- **정상 동작**:
  - 시리즈 생성 → seriesOptions 즉시 갱신 + 자동 선택 + 폼 닫힘
  - 신규 wizard POST 시 seriesId 가 body 에 포함 (개인 대회면 undefined → 서버 null 처리)
  - 편집 wizard 의 status 가드 (in_progress/completed) 는 dropdown 만 disabled — 인라인 생성 버튼도 함께 숨김 (seriesEditAllowed 가드)

- **주의할 입력**:
  - 시리즈 이름 공백만 입력 → "시리즈 이름을 입력하세요." 에러
  - 단체 dropdown 옵션 없음 (myOrgs 빈 배열) → 단체 dropdown 자체 미노출 (개인 시리즈만 생성 가능)
  - 비로그인 → /api/web/series/my 가 401 → seriesLoaded=true 로 그냥 마침 (wizard 자체 진입은 인증 가드)

⚠️ reviewer 참고:
- `buildCreateSeriesPayload` / `resolveCreatedOrganization` 헬퍼 export — 컴포넌트의 페이로드 변환을 vitest 단위 검증 가능하게 분리
- POST /api/web/series 응답이 organization 객체를 안 내려주는 점 → 클라이언트에서 myOrgs 매칭으로 보충 (slug=""로 채움 — dropdown 라벨만 쓰므로 무해)
- POST /api/web/tournaments 의 `seriesId` 키 (camelCase) — route.ts L160 박제됨. 신규 wizard body 에 그대로 박음
- 편집 wizard 는 PATCH body.series_id (snake_case) 그대로 유지 — 기존 PR2 박제 그대로

## 진행 현황표
| 단계 | 결과 |
|------|------|
| 1. UI-1.1 GameMethodInput 재투입 (textarea) | ✅ 양쪽 wizard 완료 |
| 2. UI-1.2 편집 wizard 빈 상태 인라인 폼 | ✅ 완료 (단체 dropdown 포함) |
| 3. UI-1.3 신규 wizard 시리즈 dropdown + 인라인 | ✅ 완료 (POST body.seriesId 박제) |
| 4. InlineSeriesForm 공통 컴포넌트 | ✅ 신규 (헬퍼 export 분리) |
| 5. vitest 8 케이스 | ✅ 전수 통과 (709/709 회귀 0) |
| 6. tsc --noEmit | ✅ 0 error |
| 7. 회귀 grep (BigInt(N)n / lucide / 핑크) | ✅ 0 |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-13 | UI-1.1/1.2/1.3 wizard UX 보강 패키지 (4 files) | ✅ tsc 0 / vitest 709 / 미커밋 |
| 2026-05-13 | 코치 자가수정 — 최초 1회 setup 흐름 추가 (4-분기) | ✅ commit `7689e3f` (4 files, +95 -24) — 미푸시 |
| 2026-05-13 | 대회 개최 흐름 IA 재설계 기획 (옵션 B = Wizard 압축 + Dashboard 체크리스트 hub) | ✅ planner-architect 분석 완료 / 5단 점진 진입 (UI-1 ~ UI-5) / 코드 변경 0 |
| 2026-05-12 | FIBA Phase 17.1 Team Fouls 박스 글자 색 충돌 fix | ✅ commit `07089a7` |
| 2026-05-12 | FIBA Phase 17 쿼터별 색상 + Legend | ✅ commit `2412b80` |
| 2026-05-12 | divisions 조별 본선 진출 팀 수 (advance_per_group) 설정 추가 | ✅ commit `75632b1` |
| 2026-05-11 | FIBA Phase 16 검증 5 issue 통합 fix | ✅ commit `a7eb111` |
| 2026-05-11 | divisions 한국 생활체육 농구 표준 용어 + group_count 조건부 UI | ✅ commit `f4c937a` |

## 미푸시 commit (subin 브랜치)
- `7689e3f` fix(team-apply): 코치 자가수정 — 최초 1회 setup 흐름 추가
- (예정) feat(wizard): UI-1.1/1.2/1.3 wizard UX 보강 — PM 커밋 대기

## 후속 큐 (미진입)
- UI-1.5 체크리스트 5 신청 정책 카드 → wizard step 2 anchor 점프 (~10분)
- UI-1.4 entry_fee 사용자 보고 재현 (커뮤니케이션 — 코드 0)
- **GNBA 8팀 코치 안내**: 자가수정 진입 시 본인 이름/전화 입력 = 자동 setup. 시드 이름 mismatch 시 401 → 운영자 수동 보정 필요
