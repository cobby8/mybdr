# _qa/reverse-bake-gap.md — 운영 src → BDR-current 역박제 갭

> 🔁 **2026-06-26 PM 정정 — 관리자 영역은 Toss 스타일 공식 채택.** 본 문서 P0 갭의 "역박제 요지"에서 Toss→BDR 번역·키트 통일 표현은 **관리자 워크스페이스에 한해 무효** — Toss 구조/컴포넌트/상태를 그대로 시안화한다. 권위 문서 = `admin-toss-style-lock-B1.md`·`function-lock-B1.md`·`README-B1.md`. (사용자 공개 영역은 BDR 룰 그대로.)

> 작성 2026-06-25 · 기준: `current-src-inventory.md`.
> ⚠️ 코드 미열람 추정 포함. 각 항목의 "원본 필요" 열이 ●면 `_qa/source-request-list.md`에서 우선 요청.
> 분류: **P0** = 운영에 노출된 새 화면/핵심 흐름이 시안에 없음 / **P1** = 운영과 크게 달라 baseline 왜곡 / **P2** = 카피·라벨·토큰·배지 등 시각 정합.

---

## P0 — 신규 화면·핵심 흐름 부재 (먼저 역박제)

> 🔬 **B1 P0-1~P0-4는 2026-06-26 코드 실측으로 구체화** (출처: `source-request-B1-workspace-uploadable-2026-06-26.md`). 실측 정정: "좌측 패널 nav + 우측 패널 영역" 셸 **아님** → `data-skin="toss"` 단일 스크롤 워크스페이스 + 5섹션 segment nav + 인라인 메가폼 + 7 lazy 임베드 패널(3섹션 내 토글). 상세 = `current-src-inventory.md §1-1`. 적용 체크리스트 = `bake-fix-checklist-B1.md`.

| # | 갭 | 운영 기준 | BDR-current 현황 | 역박제 요지 | 원본 필요 |
|---|---|---|---|---|---|
| P0-1 | **대회 워크스페이스 셸(5섹션 스크롤)** | `TournamentWorkspace.tsx`(전문 실측) | `AdminTournamentSetupHub.jsx`(8카드 hub) | hub→**스크롤 워크스페이스** 재설계: ① 요약 카드(4 `OperationShortcut` 타일 + progress bar + segment `SectionNav`) ② 5섹션 anchor(`info/schedule/divisions/game/publish`, `moveTo`=스크롤+해시) ③ 2컬럼 그리드(좌 info+game / 우 divisions+publish). `LEGACY_SECTION_MAP`(setup→info·teams→publish·structure→divisions·matches→game·staff→game) 해시 backcompat 포함 | ✅ 확보 |
| P0-1b | **인라인 메가폼 + 3중 저장 UI** | `TournamentWorkspace.tsx` `form` state·`saveSetup` | hub는 카드 링크만(폼 없음) | info/game/publish 섹션에 인라인 폼 박제(이름·주최/주관·`SponsorEditor`·`ScheduleVenue`·소개·이미지 / 시간·사용구·방식·규칙·상금 / 참가비·접수·은행·팀기준). 저장 UI 3종(요약 inline·lg sticky 하단 바·모바일 fixed 하단 바) + `dirty`/`saving`/`saved` 상태. **PATCH 호출 자체는 mock(시안은 상태만 시연)** | ✅ 확보 |
| P0-2 | **7 패널 = 섹션 내 lazy 임베드 토글** | `_panels/{teams,bracket,divisions,matches,admins,recorders,site}-panel.tsx` | teams/bracket/divisions/matches = 독립 화면(`ud1/ud2/pa6/pa5`) / admins·recorders·site = 부재 | 패널을 **1차 nav 아님 → 섹션 내 `PanelSummary` 버튼 + `togglePanel` 토글**로 재배치. 마운트 맵: game→matches·recorders·admins / divisions→divisions·bracket / publish→teams·site. **6개 propless(self-fetch), `matches`만 props(`tournamentId/defaultMode/matchStats`)**. 4개(teams/bracket/divisions/matches)는 기존 독립 시안 콘텐츠를 패널 프레임(`ta-panel-embed`)에 재배치 | ◐ 셸 실측 / 패널 내부 4개 미수록 |
| P0-2b | **`admins-panel` 운영진 패널** | `admins-panel.tsx`(전문 실측) | 독립 시안 없음(hub 내 추정) | 운영진 추가 폼(이메일+역할 select 관리자/스태프/기록원) + 목록(아바타·닉네임·역할 chip·제거) + empty. ROLE_LABEL owner/admin/staff/scorer. ⚠️ 실측 정정: 운영 코드가 `rounded-full`·`rounded-16px`·이모지 👥 사용 → BDR 박제 시 4px·Material Symbols로 번역 | ✅ 확보 |
| P0-3 | **기록원/경기원 배정 패널** | `recorders-panel.tsx` | 없음 | 경기별 기록원·경기원 배정 UI 신규(심판=`referee`와 역할 구분). game 섹션 토글 propless 패널. **패널 내부 코드 첨부 미수록 → DB 미지원 시 "준비 중" 톤 유지** | ◐ 셸 실측 / 내부 미수록 |
| P0-4 | **공개 대회 사이트 설정 패널** | `site-panel.tsx` | 없음 | 대회 공개 페이지 구성 운영 패널 신규. publish 섹션 토글 propless 패널. `summary.siteConfigured/sitePublished/siteSubdomain` 연동(`https://{subdomain}.mybdr.kr`). **패널 내부 코드 미수록** | ◐ 셸 실측 / 내부 미수록 |
| P0-4b | **공개 게이트 + 기록 모드(부속 실측)** | `SetupChecklist.tsx`·`setup-hub-mobile-sticky.tsx`·`recording-mode-card/-trigger.tsx`·`NextStepCTA.tsx` | hub에 `atsh-*` 일부 존재 / 기록모드·NextStepCTA 부재 | ① `SetupChecklist`(progress+8카드+`PublishGate`+잠금 toast+`depends_on`)를 publish 섹션 `<details>` 종속 ② 모바일 공개 sticky(`atsh-mobile-sticky`) ③ 기록 모드 카드(기록앱/전자기록지/수기 3택 + scope 3라디오 + 사유 5자 + confirm 모달) **신규** ④ 단계간 `NextStepCTA`(Navy 4px) **신규** | ✅ 확보 |
| P0-5 | **생성 마법사: 경기 규정·유니폼** | `ct-game-settings.tsx` | 없음 | 종별 경기 규정 + 유니폼 규정 입력 step 신규 | ● |
| P0-6 | **생성 마법사: 종별 일정·경기장** | `ct-schedule-venue.tsx` (+ Kakao) | 없음 | 종별 일정·경기장 + Kakao 장소 검색 결합 step 신규 | ● |
| P0-7 | **생성 마법사 흐름 갱신** | `ct-create-tournament.tsx`, `ct-divisions.tsx` | `AdminTournamentWizard1Step.jsx`(단순) | 다단계 생성(기본→종별→규정→일정) 흐름으로 시안 갱신 | ● |
| P0-8 | **기록앱 영향 관리자 화면** | `admin/agents/page.tsx` + `record-app-impact-panel.tsx` | 없음 | `/admin/agents` 영향 분석 화면군 신규 박제 (감사 로그 연결) | ● |

---

### P0-2 패널 내부 갭 (B1.1·B1.2 — 2026-06-26 실측)

> 출처: `B1-1-panel-internals`(teams·divisions) + `B1-2A/B/C`(site·recorders·matches-client·bracket·schedule-venue·game-settings·division-formats). **7 패널 + 경기표 + 생성 마법사 내부 전부 실측 확보.** 적용 = `bake-fix-checklist-B1.md §8·§9`.

| # | 패널 | 운영 내부 실측 요지 | BDR-current 현황 | 역박제 요지 | 원본 |
|---|---|---|---|---|---|
| P0-2-T | **teams** | 등록경로 stat 4 · 종별 배정현황(조편성 랜덤/시드) · 필터 5(코치 미입력 포함) · 종별 그룹핑 카드 · TeamDetailModal(납부/코치/시드·조/토큰 재발급/프린트/선수표) · 카톡 일괄 import · CSV·카톡 일괄 복사 | `AdminTournamentTeams.jsx`(독립·구버전) | 위 항목을 패널 콘텐츠로 박제. **CSV/클립보드/프린트는 클라이언트 동작 OK**, 승인·납부·조편성은 mock 상태 | ✅ 확보 |
| P0-2-D | **divisions** | 종별 구성(마스터 chip→디비전 정원·참가비·일정·체육관) · 룰 카드(진행 방식 8 enum + 조 크기/개수/동순위전/조별 진출 + 진출 매핑) | `AdminTournamentDivisions.jsx`(독립·구버전) | 종별 운영방식 패널 박제. `FORMAT_LABEL` 8 enum·dual 고정분기 반영 | ✅ 확보 |
| P0-2-M | **matches** | wrapper(`RecordingModeTrigger`) + **`MatchesClient`(B1.2 전문)**: 종별/체육관 필터·라운드 표(`amt-table`)·**ScoreModal**(점수/상태/승자/일정/기록 방식 토글+전자기록지 링크/삭제)·`PlaceholderValidationBanner`·`AdvancePlayoffsButton` | `AdminTournamentMatches.jsx`(독립·구버전) | 경기표 패널 박제. PATCH/모드 endpoint·삭제는 mock. amt-table는 BDR `admin.css`에 이미 존재 → 재사용 | ✅ 확보 |
| P0-2-B | **bracket** | 버전 현황(3회 dot)·1라운드 배치·`DualGroupAssignmentEditor`(16팀 4조)·**5단계 dual 섹션**·**다종별 섹션**(필터+roundName)·전체 목록 | `AdminTournamentBracket.jsx`(독립·구버전) | 대진 패널 박제. dual 5단계/다종별 그룹핑 신규. 생성/확정 mock | ✅ 확보 |
| P0-2-R | **recorders** | 기록원 추가(이메일)+목록 · **경기별 기록자 배정**(매치 select + 자동 배정 라운드로빈) | 없음 | 기록원/배정 패널 신규. 배정·자동배정 mock. DB 미지원분 "준비 중" | ✅ 확보 |
| P0-2-S | **site** | **3-step 위자드**(템플릿 3/색상 8/서브도메인) + `TemplateMockup` + 발행 완료 상태(공개 중·비공개 전환·수정 3) | 없음 | 사이트 설정 패널 신규. 템플릿 미리보기 고정 hex는 의도(예외). 발행 mock | ✅ 확보 |

### P0-5/6 생성 마법사 내부 갭 (B1.2C — 2026-06-26 실측)

| # | 갭 | 운영 기준 | BDR-current 현황 | 역박제 요지 | 원본 |
|---|---|---|---|---|---|
| P0-6-SV | **종별 일정·경기장**(`ct-schedule-venue`) | VenueSearch(Kakao 검색+직접추가) · CalendarModal(다중 날짜) · Stepper(코트 1~8) · SegSm(숫자/알파벳) · 날짜별 코트 배정 chip | 없음 | 생성/셋업 info 섹션 일정·장소 블록 박제. Kakao 검색은 mock 자동완성(VENUE_DB) | ✅ 확보 |
| P0-5-GS | **경기 규정**(`ct-game-settings`) | 유니폼 규칙(홈 밝은/원정 어두운·swap·조끼)·16색 팔레트·프리셋·운영방식·쿼터·샷클락·파울/타임아웃·휴식(details) | 없음 | 경기 규정 카드 박제. 저지 16 hex = 도메인 예외. controlled `GameRules` | ✅ 확보 |
| P0-DF | **종별 진행방식 enum**(`division-formats.ts`) | 6 enum + `FORMAT_LABEL`(토너먼트/풀리그/듀얼/조별+토너먼트/링크제/조별+동순위) + 조 설정 가드 | 시안 하드코딩 | divisions 패널·종별 step의 진행방식 select·조 설정의 단일 source로 박제 | ✅ 확보 |

---

## P1 — baseline 왜곡 (P0 직후 역박제)

| # | 갭 | 운영 기준 | BDR-current 현황 | 역박제 요지 | 원본 필요 |
|---|---|---|---|---|---|
| P1-1 | 운영자 셸/사이드바 안정화 | `tournament-admin/layout.tsx` | ops-sidebar 내장(쇼케이스) | 워크스페이스 도입에 맞춘 ops 사이드바 nav·레이아웃 정합 | ● |
| P1-2 | Kakao 장소 검색 공유 컴포넌트 | `components/shared/place-autocomplete.tsx` | 없음 | 장소 검색 입력 패턴 신규(생성폼·일정폼 공용) | ● |
| P1-3 | 경기장 길안내 fallback | `lib/maps/navigation-links.ts`, `schedule-timeline.tsx` | 일정에 길안내 없음 | 공개 일정/대회 상세에 길안내 링크·fallback UI 반영 | ● |
| P1-4 | 일정 폼(운영) | `components/tournament/schedule-form.tsx` | discrete 부재 | 운영자 일정 입력 폼 패턴 박제 | ● |
| P1-5 | 감사 로그 ↔ 영향 연결 | `admin/logs/page.tsx` | 통합 콘솔 "활동 로그" 골격만 | 기록앱 영향 → 감사 로그 진입 동선 반영 | ◐ |
| P1-6 | 관리자 사이드바 agents 진입 | `components/admin/sidebar.tsx` | agents nav 없음 | 사이드바에 기록앱 영향 진입 추가 | ◐ |
| P1-7 | 심판/경기원 라벨 표준화 | `lib/referee/official-roles.ts`, `validation/referee.ts`, assoc wizard Step3/4/Confirm | 라벨 하드코딩 추정 | `referee`/`game_official` 라벨·KBA/FIBA 등급 카피 정합 | ● |
| P1-8 | 셋업 상태/규칙 구동 UI | `lib/tournaments/{setup-status,game-rules}.ts` | hub 정적 상태 | 패널 완료/잠금 상태·경기 규정 기본값 표현 정합 | ◐ |

---

## P2 — 시각 정합 (일관성 QA batch로 분리)

| # | 갭 | 운영 기준 | BDR-current 현황 | 역박제 요지 | 원본 필요 |
|---|---|---|---|---|---|
| P2-1 | 엘리트 선수 배지 | `users/[id]/_v2/player-hero.tsx`, `profile/basketball/page.tsx` | 배지 없음 | 프로필/유저 히어로에 엘리트 배지 토큰 적용 | ◐ |
| P2-2 | 멤버십/구독 권한 카피 | `pricing/page.tsx`, `profile/page.tsx`, `admin/plans`, `admin/users/*` | 구(舊) 카피 | 권한/구독 라벨·뱃지 정합 | ◐ |
| P2-3 | 웹 셸 멤버십 뱃지 | `(web)/layout.tsx` | — | ⚠️ AppNav frozen 위반 없이 뱃지만 반영 | ● |
| P2-4 | 사이트 관리자 대회 상세 | `admin/tournaments/[id]/page.tsx` | 운영자측과 별개·미상 | 대응 화면 존재 여부 확인 후 분류 | ● |

> 범례 — 원본 필요: ● 필수(코드 안 보면 박제 불가) · ◐ 권장(추정 가능하나 확인 시 정확) · 공란 추론 가능.

---

## 역박제 batch 제안 (Codex 적용 단위)

| batch | 포함 | 비고 |
|---|---|---|
| **B1 (P0 워크스페이스)** | P0-1 · P0-2 · P0-3 · P0-4 | 🔬 소스 일부 실측 완료(2026-06-26). 셸·admins·게이트=확보 / teams·divisions·matches·recorders·site 패널 내부 미수록. 체크리스트 = `bake-fix-checklist-B1.md` |
| **B2 (P0 생성 마법사)** | P0-5 · P0-6 · P0-7 | Kakao(place-autocomplete) 공유 컴포넌트 동반 |
| **B3 (P0 admin agents)** | P0-8 | + P1-5 · P1-6 감사로그/사이드바 연결 묶음 |
| **B4 (P1 장소/길안내)** | P1-2 · P1-3 · P1-4 | B2와 공유 컴포넌트 의존 |
| **B5 (P1 심판/경기원 라벨)** | P1-7 · P1-8 · P1-1 | 라벨 표준 + 셸 안정화 |
| **B6 (P2 시각 정합 = 일관성 QA)** | P2-1 ~ P2-4 | `consistency-audit.md`로 이관 |

> **B1·B2·B3** 가 P0. 이들은 원본 ● 파일 선확보 후 진행. **B6**은 역박제 후 토큰/간격/라운딩 일관성 QA 단계로 분리(brief 5단계).

---

## 보존/금지 재확인 (역박제 시 적용)

- AppNav frozen 구조 변경 금지 — `app-nav.tsx` 변경은 라벨/뱃지만, 구조·탭 배열·우측 컨트롤 5개 불변.
- 사용자 결정 §1~§8 변경 금지.
- 운영 API/Prisma/라우트 변경 금지 · 시안이 운영 src 직접 수정 금지.
- DB 미보유 기능을 실제 기능처럼 추가 금지 (예: recorders 배정이 DB 미지원이면 "준비 중" 톤 유지).
- 하드코딩 hex / lucide-react / pill `9999px`(버튼·카드) / 핑크·살몬·코랄 = 위반 기록.
- Material Symbols Outlined · 720px 분기 · iOS input 16px · 터치 44px 유지.
