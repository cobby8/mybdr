# BDR v2.41-admin-toss — 대회 운영 워크스페이스 (Toss 역박제본)

> 운영 `TournamentWorkspace` + 7 패널 + 생성 마법사를 **Toss 스타일 그대로** 시안화한 관리자 영역 역박제본.
> PM 정정(2026-06-26): Toss = MyBDR **공식 관리자 디자인 시스템**. BDR 13룰로 번역하지 않음.
> 계약: `_qa/function-lock-B1.md`(기능·상태) + `_qa/admin-toss-style-lock-B1.md`(스타일).

## 진입
- `대회 운영 워크스페이스.html` — 워크스페이스 단일 화면(요약 카드 + 5섹션 + 인라인 메가폼 + 7 패널 lazy 토글).

## 파일
| 파일 | 역할 |
|---|---|
| `toss.css` | Toss 토큰 + `ts-*` 유틸 (v2.40 `_admin-unified` canonical **그대로 카피**) |
| `toss-kit.jsx` | Toss 키트(Icon=lucide·Btn·Badge·Modal·Toggle·Check·StepDots·Empty) (canonical 카피) |
| `workspace.css` | 워크스페이스/패널/마법사 보완 클래스(`ct-*`·`amt-*`) — toss 토큰 재사용 |
| `data.jsx` | mock 데이터(`window.WS`) + 라벨 맵 + 6 enum |
| `panels-core.jsx` | teams · divisions · matches · bracket 패널 |
| `panels-ops.jsx` | recorders · site · admins 패널 + 마법사(ScheduleVenue · GameSettings) |
| `workspace.jsx` | 셸 — 섹션 nav · 메가폼 · 패널 마운트 · 저장 바 |

## 구현 범위 (function-lock-B1 대조)
- **셸**: 요약 4 shortcut(클릭→섹션 스크롤+패널 펼침) · progress · 5섹션 segment nav(해시·LEGACY 맵) · 2컬럼(좌 info+game / 우 divisions+publish) · 인라인 메가폼(단일 form·dirty·저장 3종 mock).
- **teams**: 등록경로 stat 4 · 종별 배정 현황(랜덤/시드) · 필터 5(코치 미입력) · 종별 그룹 카드 · 상세 모달(납부/토큰/선수표/프린트) · 일괄 import.
- **divisions**: 종별 구성 chip · 룰 카드(6 enum select + 조 설정 + 진출 매핑).
- **matches**: 기록 모드 트리거 + 종별/체육관 필터 + amt-table + ScoreModal(기록 방식 토글).
- **bracket**: 버전 dot 3 + dual 5단계 collapsible + 16팀 조 배정 안내.
- **recorders**: 기록원 추가/목록 + 경기별 배정(자동 배정).
- **site**: 3-step 위자드(템플릿 3/색상 8/서브도메인) + 발행 완료 상태.
- **admins**: 운영진 추가(역할) + 목록.
- **마법사**: ScheduleVenue(Kakao mock 검색 + 캘린더 다중 + Stepper/SegSm + 코트 배정) · GameSettings(유니폼 16색 + 프리셋 + 쿼터/파울/타임아웃).

## 원칙 / 금지
- ✅ 관리자 영역: lucide · Toss blue(`--primary #3182F6`) · `rounded-full`(24/16/12px) · `ts-*` 허용.
- ✅ 도메인 hex 예외: site 템플릿 미리보기 · 유니폼 16 저지색 · 팀 색.
- ❌ 모든 서버 호출 = **mock 상태 시연**(실 API/Prisma/라우트 없음). 순수 클라이언트 동작(캘린더·필터·토글·import 파싱·토스트)은 실제.
- ❌ 운영 src 수정 / BDR 13룰 번역 / 사용자 공개 영역 스타일 혼입 금지.
- lucide는 `https://unpkg.com/lucide@latest` CDN + `window.lucide.createIcons()`(toss-kit `Icon`).

## 다음 가능 작업
- 사이트 공개 결과물(BDR 룰) 미리보기는 별도(관리자 패널은 Toss / 결과 사이트는 BDR).
- bracket 16팀 조 배정 에디터 인터랙션 정밀화 · 새 대회 생성 마법사 풀 스텝.
