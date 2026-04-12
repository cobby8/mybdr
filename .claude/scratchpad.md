# 작업 스크래치패드

## 현재 작업
- **요청**: 모바일 UI 전수조사 → 심각 5건 + 보통 16건 전체 수정 완료
- **상태**: ✅ 전체 완료
- **현재 담당**: pm

## 전체 프로젝트 현황 대시보드 (2026-04-01)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 |

## 기획설계 (planner-architect)
(아직 없음)

## 구현 기록 (developer)

### 모바일 UI 경미(녹색) 10건 일괄 수정

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| profile/basketball/page.tsx | 통계 숫자 text-2xl sm:text-3xl (3곳) + 커리어 gap-2 sm:gap-4 | 수정 |
| profile/page.tsx | 카테고리 그리드 gap-2 sm:gap-3 + 아이콘 h-8 w-8 sm:h-10 sm:w-10 + 텍스트 축소 | 수정 |
| profile/notification-settings/page.tsx | 토글 간격 gap-3 sm:gap-4 | 수정 |
| invite/page.tsx | 4개 섹션 패딩 축소 + CTA 버튼 3곳 px-6 py-3 sm:px-8 sm:py-3.5 | 수정 |
| courts/[id]/checkin/page.tsx | 제목 text-lg sm:text-xl | 수정 |
| pricing/page.tsx | 카드 그리드 gap-4 sm:gap-6 | 수정 |

건너뛴 항목:
- #7 대회 일정: 이미 반응형 적용됨
- #8 Button 컴포넌트: 전역 영향 범위가 커서 건너뜀

tester 참고: CSS 클래스만 변경, 375px 뷰포트에서 각 페이지 여백/텍스트 크기 확인

## 테스트 결과 (tester)
(아직 없음)

## 리뷰 결과 (reviewer)
(아직 없음)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-13 | developer | 모바일 🟡 배치2: 색상피커/모달/gap/텍스트 6건 (5파일) | ✅ 완료 |
| 04-13 | developer | 모바일 🟡 배치1: gap/패딩/텍스트/CSS변수 8건 (8파일) | ✅ 완료 |
| 04-13 | developer | 모바일 🔴 3-4/5: 대회 순위표 스크롤 + 팀 관리 탭 (2파일) | ✅ 완료 |
| 04-13 | developer+tester | 모바일 추가: 탭 아이콘 삭제 + 통계 카드 축소 + 푸터 컴팩트 (3파일) | ✅ 완료 |
| 04-13 | developer+tester | 모바일 🔴 2/5: 팀 상세 히어로/탭/버튼 반응형 (3파일) | ✅ 완료 |
| 04-13 | developer+tester | 모바일 🔴 1/5: 하단 탭 네비 조정 (layout.tsx) | ✅ 완료 |
| 04-12 | developer+tester | Phase 3b: 가시성 버그 3건 수정 (6파일) | ✅ 완료 |
| 04-12 | pm | 새 PC 세팅 | 완료 |
| 04-12 | developer+tester | 다크모드 accent 버튼 가시성 전수 수정 (40파일) | 완료 |
| 04-05 | pm | AG→main 머지+푸시 | 완료 |
