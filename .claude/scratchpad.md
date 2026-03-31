# 작업 스크래치패드

## 현재 작업
- **요청**: #7 업체 셀프서비스 + #8 대관 페이지 + #9 카페 이전
- **상태**: 구현 완료 (tsc 통과, 기존 lucide-react 에러 1건만 잔존)
- **현재 담당**: developer

### 구현 기록

구현한 기능: #7 파트너 셀프서비스(API6+페이지5) + #8 체육관 대관(API1+페이지1) + #9 카페 초대 랜딩(1) — 총 14파일

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/partner/me/route.ts | GET 내 파트너 조회 (partner_members로 소속확인) | 신규 |
| src/app/api/web/partner/campaigns/route.ts | GET 캠페인 목록 + POST 생성 (pending_review) | 신규 |
| src/app/api/web/partner/campaigns/[id]/route.ts | GET 상세 + PATCH 수정 (draft/pending/rejected만) | 신규 |
| src/app/api/web/partner/campaigns/[id]/placements/route.ts | GET 배치목록 + POST 배치추가 | 신규 |
| src/app/api/web/partner/venue/route.ts | PATCH 대관정보 수정 (court_infos 필드) | 신규 |
| src/app/api/web/partner/stats/route.ts | GET 캠페인 통계 집계 | 신규 |
| src/app/(web)/partner-admin/layout.tsx | partner_members 소속확인 + 네비 | 신규 |
| src/app/(web)/partner-admin/page.tsx | 대시보드 (통계카드+상태분포+빠른액션) | 신규 |
| src/app/(web)/partner-admin/campaigns/page.tsx | 캠페인 목록+필터+생성폼 | 신규 |
| src/app/(web)/partner-admin/campaigns/[id]/page.tsx | 캠페인 상세/수정+배치관리 | 신규 |
| src/app/(web)/partner-admin/venue/page.tsx | 대관 관리 (코트별 대관정보 설정) | 신규 |
| src/app/api/web/venues/[slug]/route.ts | GET 체육관 공개 상세 (ISR 5분) | 신규 |
| src/app/(web)/venues/[slug]/page.tsx | 체육관 상세 SEO (대관+시설+경기+지도) | 신규 |
| src/app/(web)/invite/page.tsx | 카페 이전 랜딩 (히어로+기능소개+CTA) | 신규 |

tester 참고:
- /partner-admin: partner_members에 소속된 유저만 접근 가능
- 캠페인 생성 시 status=pending_review (관리자 승인 대기)
- /venues/[id]: court_infos.id 기반 (slug 필드 없음)
- /invite: 정적 페이지, 로그인 불필요

reviewer 참고:
- partner/venue API: court_infos.user_id == partner.owner_id 확인으로 IDOR 방지
- 캠페인 수정은 draft/pending_review/rejected 상태에서만 허용

## 전체 프로젝트 현황 대시보드 (2026-04-01)

### 규모 요약
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 (+6: partner-admin 5P + venues 1P + invite 1P) |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 110개 라우트 (+7: partner/* 6개 + venues 1개) |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-01 | developer | #7 파트너셀프서비스+#8 대관+#9 카페이전 (API7+페이지7, 14파일) | 완료 |
| 04-01 | developer | #1~#6 역할체계+단체승인제 (타입에러1건 수정) | 완료 |
| 04-01 | developer | 네이티브 광고 시스템 MVP (스키마4모델+API4+Admin2P+광고컴포넌트+삽입3곳, 13파일) | 완료 |
| 04-01 | developer | Organization 3단계 계층 (스키마+API7개+관리4P+공개3P+기존연결, 15파일) | 완료 |
| 03-31 | developer | #8 검색코트 + #9 알림설정 + #10 PWA배너 (7파일) | 완료 |
| 03-31 | developer | 비밀번호 재설정 + 회원 탈퇴 (8파일) | 완료 |
| 03-31 | pm | main 머지 + 푸시 (Phase 5 성능 + 소셜) | 완료 |
| 03-31 | developer | #16관리자+#17검색+#18알림 (차트/발송/유저검색/최근검색/삭제) | 완료 |
| 03-31 | developer | 경기 수정/취소 + 팀 수정/해산 API+UI (5파일) | 완료 |
| 03-31 | developer | #21소셜+#22이미지/댓글좋아요+#23시즌+#24admin보강 (8파일) | 완료 |
