# BDR v2.40 — 관리자 콘솔 통합 리디자인

라이브 admin(github.com/cobby8/mybdr `src/app/(admin)`)의 실제 IA를 기준으로, 전 섹션을 하나의 일관된 템플릿으로 통일했습니다.

## 변경 요약
- **IA 정리**: 라이브 6그룹(콘텐츠/사용자/비즈니스/시스템/외부관리) → **1 단독 + 4 그룹**(운영 / 사용자·커뮤니티 / 비즈니스 / 시스템)으로 단순화. BDR NEWS는 커뮤니티 내 탭으로 흡수, 외부 협력업체 포털은 별도 deliverable로 분리.
- **통일 템플릿**: 모든 화면이 `PageHead → StatRow → Toolbar(검색+상태탭) → DataTable → Drawer(상세)` 동일 구조. 이것이 "통일감"의 핵심.
- **여유 테이블**: 행 높이 68px, 명확한 헤더/정렬/상태 뱃지. Tweaks에서 고밀도 전환 가능.
- **디자인시스템**: v2.39 Toss 시스템(toss.css) 유지 + `au.css` 통합 레이어 추가.

## 파일
- `AdminConsole.html` — 셸(사이드바·상단바·모바일 드로어·라우터·Tweaks)
- `toss.css` — Toss 토큰/기본 컴포넌트 (v2.39 카피)
- `au.css` — 통합 레이어(헤더·통계·툴바·테이블·드로어)
- `toss-kit.jsx` — Icon/Btn/Badge/Toggle/Modal (v2.39 카피)
- `au-kit.jsx` — 화면 프리미티브(PageHead/StatRow/Toolbar/DataTable/Drawer/DL/Panel)
- `au-screens.jsx` — 대시보드·유저·대회·경기·팀·단체·코트
- `au-screens2.jsx` — 커뮤니티·시즌시상·신고·건의·결제·요금제·캠페인·파트너·분석·종별·로그·알림·설정
- `admin-data*.jsx`, `au-extra-data.jsx` — mock 데이터

## 19개 섹션
대시보드 / 대회·경기·팀·단체·코트 / 유저·커뮤니티·시즌시상·신고·건의 / 결제·요금제·캠페인·파트너 / 분석·종별·알림·로그·설정

## 상세(드릴다운) 화면 — 콘솔 내 신규 라우트
목록 Drawer 에서 진입하는 풀 상세 페이지. 셸·사이드바·Tweaks 그대로 유지, `route` 를 `base:id(:tab)` 으로 확장해 같은 `<App>` 안에서 라우팅.
- **유저 상세** (`user:id`) — 개요 / 활동 타임라인 / 경기 기록 / 결제
- **대회 상세** (`tournament:id`) — 개요 / 참가팀(시드·입금) / **대진표(8강 토너먼트 트리)** / 정산(수입·지출·순이익)
- **경기 상세** (`game:id`) — 개요(쿼터별 스코어보드) / 라인업 기록
- **팀 상세** (`team:id`) — 개요 / 로스터 / 대회 전적
- **단체 상세** (`org:id`) — 개요 / 소속 팀 / 운영진 (대기 단체는 승인·반려)
- **코트 상세** (`court:id`) — 개요(편의시설) / 예약 현황 (대기 코트는 승인·반려)
- 공통: `DetailHead`(뒤로가기+아바타+뱃지+액션) → `MiniStat` → `Tabs` → 2단(`au-dgrid`)/서브테이블(`au-sub`) 패턴으로 목록 화면과 통일.
- 파일: `au-detail.jsx` (화면) · `au-detail.css` (레이어) · `au-detail-data.jsx` (mock)

## 생성·작성 플로우 + 상세2 (콘솔 내 신규 라우트)
**생성/작성** (셸 유지, 전용 라우트):
- **대회 생성 마법사** (`create-tournament`) — 5단계(기본·종별/정원·일정/장소·참가비/정산·검토) 좌측 스텝 레일
- **알림 작성** (`compose-notification`) — 대상·채널(복수)·예약, 실시간 앱 미리보기
- **캠페인 생성** (`create-campaign`) · **NEWS 기사 작성** (`write-news`)
- 소형 추가는 `AddModal`(fields 설정 구동) 모달: 유저 초대 / 경기·코트 등록 / 시상·종별·요금제·파트너 추가

**상세2** (목록 행 클릭 진입):
- **신고 상세** (`report:id`) — 사유·증거 메시지·처리 이력·제재 액션
- **결제 상세** (`payment:id`) — 영수증·결제자·승인정보·환불
- **캠페인 상세** (`campaign:id`) — 노출/클릭/CTR KPI·일별 차트·예산
- **파트너 상세** (`partner:id`) — 계약·연락처·활동 이력
- **게시글 상세** (`post:id`) — 본문·댓글(신고 강조)·검수 / **NEWS 기사 상세** (`news:id`)
- 파일: `au-forms.jsx` · `au-detail2.jsx` · `au-forms.css` · `au-forms-data.jsx`

## 후속 (별도 standalone — 동일 시스템으로 리스킨 예정)
대회 운영자 도구(TournamentAdmin) · 참가신청·종별마스터(AdminToss) · 파트너·심판(PartnerReferee) · 대회 생성 마법사(CreateTournament)
