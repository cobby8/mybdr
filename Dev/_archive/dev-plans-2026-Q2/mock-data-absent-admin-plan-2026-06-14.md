# 데이터 부재 페이지 — 관리자 관리 체계 계획 (2026-06-14)

> 근거: `Dev/mock-data-census-2026-06-14.md` 버킷 B (백킹 테이블 0).
> 목적: 더미를 실데이터로 못 바꾸는 페이지를 **무엇으로 채울지 + 관리자가 어떻게 운영할지** 설계.
> ★ 신규 테이블 = 운영 DB schema 변경 → **무중단 ADD-only(nullable) + 사용자 승인 + schema diff 검토** (CLAUDE.md §DB 정책). 일괄 X, 우선순위 순 단계 도입.

---

## 1. 공통 원칙

```
· 각 기능 = [데이터 모델] + [관리자 CRUD/승인 화면] + [사용자 노출 조건] 3종 세트.
· 신규 테이블은 ADD-only nullable·무중단만. destructive ❌. db push 전 diff 사용자 검토.
· 도입 전까지 사용자 페이지 = "준비중/빈 상태" 유지 (더미 ❌).
· 관리자 화면 = E영역 자체셸(/admin/*) — 시안 박제 대상 아님, 디자인 토큰만 일치.
```

---

## 2. 우선순위 매트릭스

| 기능 | 라우트 | 사용자 가치 | 구현 비용 | 우선 |
|------|--------|-----------|----------|------|
| 코트 제보 승인 | /courts/submit | 中(코트 DB 성장) | 低(테이블1+승인큐) | **P1** |
| 시상 고급필드 | /awards | 中(시즌 완결성) | 低(집계+입력폼) | **P1** |
| 코치 디렉토리 | /coaches | 中 | 中 | P2 |
| 갤러리 | /gallery | 低~中 | 中 | P2 |
| 심판 배정 요청 | /tournaments/[id]/referee-request | 中(대회 운영) | 中(심판플랫폼 연계) | P2 |
| 샵 | /shop | 低(수익 별개) | 高(상품/주문/결제) | P3 |
| 쪽지 | /messages | 中 | 高(실시간/스레드) | P3 |

---

## 3. 기능별 설계

### P1-a. 코트 제보 (/courts/submit)
- **모델(신규)**: `court_submissions` (제보자 user_id / 이름·주소·좌표 / 시설 features[] / 사진 url[] / status: pending·approved·rejected / 검토자·사유 / created_at). ADD-only.
- **관리자**: `/admin/courts` 에 "제보 검토" 탭 — 목록 + 상세 + 승인(→court_info INSERT)/반려(사유). 기존 AdminCourts 확장.
- **사용자**: 제출 = pending INSERT + "검토 중" 안내. 승인 시 코트 등재.
- **포인트**: "내 기여 N개/P" = 본인 승인 제보 count (더미 3개/1,200P 대체).

### P1-b. 시상 고급필드 (/awards)
- **모델(신규 최소)**: `season_awards` (season_year / category: all_star_1st·all_star_2nd·coach_of_year·new_face·mvp_quote / user_id 또는 team_id / payload(코멘트 등) / 관리자 입력). ADD-only.
- **관리자**: `/admin` 에 "시즌 시상" 입력 폼(시즌 선택 → 카테고리별 선수/팀 지정 + 코멘트). super-admin.
- **사용자**: /awards 기본부(UserSeasonStat/rankings 집계)는 버킷 A 로 실연결 / 고급부는 season_awards 조회. 미입력 시즌 = "집계 중".
- 대안(저비용): 별도 테이블 없이 `community_posts`(category=award) 재사용 — 신규 테이블 회피 검토.

### P2-a. 코치 디렉토리 (/coaches)
- **모델**: 옵션A `User.is_coach`(boolean ADD) + 코치 프로필 필드(전문/경력/지역) / 옵션B 신규 `coach_profiles`. 무중단 ADD.
- **관리자**: 코치 신청 승인 큐(/admin/users 확장 또는 신규). 검증 후 노출.
- **사용자**: 카테고리 칩 + 승인된 코치 카드. 0명 = "코치 매칭 준비 중".

### P2-b. 갤러리 (/gallery)
- **저비용 1안**: 기존 `news_photo` 재사용 — 대회/뉴스 사진을 앨범으로 노출(신규 테이블 0). 관리자 = AdminNews 발행 사진이 갤러리로 자동 유입.
- **2안**: 신규 `gallery_albums`/`gallery_photos` + 관리자 업로드. 비용 中.
- → **1안 권장**(0스키마, news_photo 集約). 사진 0 = 빈 상태.

### P2-c. 심판 배정 요청 (/tournaments/[id]/referee-request)
- **현황**: 심판 플랫폼(/referee/*, Association/Referee 테이블) 존재. web 요청 흐름만 부재.
- **모델**: 기존 심판 배정(tournament_recorders 유사 패턴) 또는 referee assignment 테이블 실측 후 재사용. 신규 최소화.
- **관리자**: 대회 운영자 도구에 "심판 요청" — 협회 심판 풀에서 선택/요청. REFEREES_MOCK 6 대체.
- ⚠️ 심판 플랫폼 = 협회 도메인. 스키마 실측 + 협회 관리자 권한 정합 선행.

### P3-a. 샵 (/shop)
- **모델(신규 다수)**: products / variants / orders / cart — 비용 高. 결제(PortOne) 연계.
- **관리자**: /admin 신규 "상품 관리" CRUD + 재고 + 주문.
- **권고**: 별도 이니셔티브로 분리. 당분간 "오픈 준비 중" 유지. 수익 모델 결정 선행.

### P3-b. 쪽지 (/messages)
- **현황**: Phase 9 NU2 에서 "messages 모델 신설 ❌" 의도 보류.
- **모델(신규)**: message_threads / messages / participants — 비용 高(실시간·읽음·알림 연계).
- **관리자**: 신고 검토 연계(부적절 쪽지). 
- **권고**: 별도 이니셔티브. 당분간 "준비 중" 유지. 도입 시 알림(NU1)·신고 시스템과 통합 설계.

---

## 4. 권장 로드맵

```
[1단계 · P1] 코트 제보 승인(court_submissions) + 시상 고급필드(season_awards 또는 community_posts 재사용)
  → 무중단 ADD 1~2 테이블 / 관리자 화면 = 기존 admin 확장 / 사용자 가치 즉시
[2단계 · P2] 코치 디렉토리 + 갤러리(news_photo 재사용) + 심판 배정 요청
  → 갤러리는 0스키마 우선 / 코치·심판은 권한 정합 선행
[3단계 · P3] 샵 / 쪽지 = 별도 이니셔티브(비용 高·외부 연계). 당분간 준비중 유지.
```

→ 각 단계 = 사용자 승인 후 CLI 의뢰서로 전환(스키마 diff 검토 + 무중단 ADD + 관리자 화면 + 사용자 연결 3종).

---

## 5. 결정 필요 (사용자)
1. P1 두 건(코트 제보 / 시상) 먼저 진행? 
2. 시상 = 신규 테이블 vs community_posts 재사용 중 선호?
3. 갤러리 = news_photo 재사용(0스키마) 승인?
4. 샵/쪽지 = 별도 이니셔티브로 보류 확정?
