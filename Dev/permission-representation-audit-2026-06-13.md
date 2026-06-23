# 계정 권한 전수조사 + 표현 개선안 (2026-06-13)

> 계기: 유저 관리 화면에서 슈퍼관리자(★)가 "역할" 칼럼에 **일반유저 / 대회관리자**로 표시 — 권한과 구독등급이 한 칼럼에 뒤섞임. 수빈 지적 "슈퍼관리자에 일반유저/대회관리자 표현은 부적절".
> 작성: Cowork. 실측 = 라이브(mybdr.kr) + 코드(src/lib/auth/*) 기준.

---

## 1. 권한 모델 전수 (코드 실측)

MyBDR 계정 권한은 **서로 다른 3개 축**이 겹쳐 있다. 지금 화면은 이 셋을 구분하지 않는다.

### 축 A — 구독 등급 (membershipType, 상업적 tier · 결제 대상)

`src/lib/auth/roles.ts` · `User.membership_type` (0~3)

| 값 | 라벨 (현행) | 의미 | 가격 |
|----|-----------|------|------|
| 0 | 일반유저 | FREE | 무료 |
| 1 | 픽업호스트 | PICKUP_HOST | ₩50,000/월 |
| 2 | 팀장 | TEAM_LEADER | ₩3,900/월 |
| 3 | **대회관리자** | TOURNAMENT_ADMIN | ₩199,000/월 |

→ 이건 "권한"이 아니라 **결제한 구독 상품**이다. 그런데 화면 칼럼명은 "역할".

### 축 B — 전역 운영 권한 (isAdmin + admin_role, 부여 대상)

`User.is_admin` (boolean) + `User.admin_role` (string?)

| 신호 | 의미 | 코드 |
|------|------|------|
| `is_admin=true` | **슈퍼관리자** (전능) | role=super_admin 자동 |
| `admin_role="recorder_admin"` | 전역 기록원관리자 (모든 대회 기록) | is-recorder-admin.ts |
| `admin_role="association_admin"` | 협회 관리자 | admin-roles.ts |
| `admin_role="site_admin"` | 사이트 관리자 | admin-roles.ts L157 |
| `admin_role="org_admin" / "content_admin"` | 단체승인 / 콘텐츠 (org-permission.ts) | 정의만 존재 |

→ super_admin 은 recorder/association 등 모두 **자동 흡수**(Q1 결재).

### 축 C — 리소스 단위 권한 (대회/협회/단체별, 테이블 매핑)

`getAdminRoles()` (admin-roles.ts) 가 집계하는 5종:

- `tournament_admin_members` — 대회별 운영 위임 (organizer/manager)
- `tournament_recorders` — 대회별 기록원 (← 어제 record01/02 누락 건)
- `partner_members` — 파트너 소속
- `organization_members` — 단체 소속
- `associationAdmin` — 협회 1:1 매핑 (9 role)

→ 이 축은 유저 관리 리스트엔 없고 **유저 상세 모달(RoleMatrixCard)** 에만 표시.

---

## 2. 운영 데이터 실측 (라이브, 2026-06-13)

### 슈퍼관리자 (is_admin=true) = 8명 — 전원 "역할"에 구독등급 노출

| 닉네임 | 이메일 | 역할 칼럼(구독) | 관리자 칼럼 | 문제 |
|--------|--------|----------------|-------------|------|
| 김수빈 | cobby8@kakao.com | 대회관리자 | ON | super인데 구독라벨 |
| RefTest사무국장 | referee-test@mybdr.kr | **일반유저** | ON | super가 "일반유저" |
| record03 | record03@mybdr.kr | **일반유저** | ON | super가 "일반유저" |
| 임상엽 | realtdplayer@gmail.com | 대회관리자 | ON | |
| 수빈 | snukobe@gmail.com | 대회관리자 | ON | |
| BDR_AI | grizrider@kakao.com | **일반유저** | ON | super가 "일반유저" |
| bdr 마스터 | bdr.wonyoung@gmail.com | 대회관리자 | ON | |
| BDR_Admin master | admin@bdr.com | **일반유저** | ON | super가 "일반유저" |

→ **8명 전원 super_admin인데 역할 칼럼은 4명 "일반유저" / 4명 "대회관리자"**. 권한과 무관한 구독 tier.

### 전역 기록원관리자 (admin_role=recorder_admin) = 3명+ (PR-RECORDER-AUDIT 후 칩 정상)

| 닉네임 | 이메일 | 역할(구독) | 관리자 칼럼 |
|--------|--------|-----------|-------------|
| BDR기록원관리자 | bdr-recorder@mybdr.kr | 일반유저 | 기록원관리자 ✅ |
| record01 | record01@mybdr.kr | 일반유저 | 기록원관리자 ✅ |
| record02 | record02@mybdr.kr | 일반유저 | 기록원관리자 ✅ |

→ 이들은 admin_role 덕분에 칩이 뜸(어제 수리 반영). 단 역할 칼럼은 여전히 "일반유저"(구독)로 동일 혼동.
→ (참고) record01/02 는 recorder_admin 이라 전역 기록 권한 보유 — 어제 대회별 배정 누락과 별개로 기록 자체는 admin_role 로도 통과.

### 미실측 (sandbox→운영DB 연결 차단 — 라이브 칩/모달로 확인 가능)
- association_admin / site_admin / org_admin 보유자 수
- 대회·협회·단체 리소스 단위 권한 분포

---

## 3. 표현(라벨/칩) 문제 정리

| # | 문제 | 위치 | 심각도 |
|---|------|------|--------|
| P1 | "역할" 칼럼이 실제로는 **구독등급**(membershipType)을 보여줌 — 칼럼명-내용 불일치 | role 칼럼 | 高 |
| P2 | 슈퍼관리자가 역할 칼럼에 "일반유저/대회관리자"로 표시 — 권한자가 무권한처럼 보임 | role 칼럼 | 高 |
| P3 | super_admin 신호가 ★(이름)+ON(관리자) 2곳에 분산 + "ON"이 모호(무엇이 ON?) | nickname/관리자 | 中 |
| P4 | 구독 tier 3 라벨 "대회관리자"가 실제 **대회 운영권한**(organizer/TAM)과 명칭 충돌 | roles.ts | 中 |
| P5 | recorder/association_admin 도 역할 칼럼엔 "일반유저"로 — P2 와 동일 혼동(경미) | role 칼럼 | 低 |

핵심: **"구독 등급(축 A)" 과 "운영 권한(축 B)" 은 직교(orthogonal)한 두 축인데 한 "역할" 칼럼에 섞여 있다.**

---

## 4. 개선안 (택1 — 수빈 결재)

### 옵션 A — 역할 칼럼 우선순위화 (1칼럼 통합, 최소 변경)

역할 칼럼이 **가장 높은 신분 1개**만 표시:
`슈퍼관리자 > 기록원관리자 > 협회관리자 > (구독)대회관리자 > 팀장 > 픽업호스트 > 일반유저`
- 슈퍼관리자 = 빨강 칩, admin_role = info 칩, 구독 = 기존 tone
- "관리자(ON)" 칼럼 제거 또는 축소
- 장점: 한 칸이 진실을 말함 / 단점: 구독·권한 동시 확인 불가(상세모달서 보완)

### 옵션 B — 2축 분리 (칼럼 명확화) ★ 권장

- "역할" → **"구독 등급"** 으로 rename (membershipType 그대로: 일반/픽업호스트/팀장/대회관리자)
- "관리자" → **"운영 권한"** 으로 rename + 내용 확장:
  - is_admin → "슈퍼관리자" 칩 (현행 "ON" 대체)
  - recorder_admin → "기록원관리자" / association_admin → "협회관리자" (현행 유지)
  - 없으면 "—"
- 장점: 두 축이 각자 정확한 이름 / 로직 변경 최소(라벨+칩) / P1·P2·P3 동시 해소
- 단점: 칼럼 1개 의미 재정의(헤더만)

### 옵션 C — 통합 권한 칩 + 구독 보조 태그

- 주 칩 = 운영권한 우선(B의 운영권한), 그 아래 작은 회색 태그로 구독등급 병기
- 장점: 정보 밀도 최고 / 단점: 셀 복잡도↑, 모바일 카드 부담

### 공통 부속 결정 (P4 — 명칭 충돌)

구독 tier 3 라벨 **"대회관리자"** → 운영권한과 헷갈림. 후보: 그대로 두되 운영권한 칩과 색/위치로 구분(B면 자연 해소) / 또는 "대회개설권"·"대회호스트"로 rename(영향 범위 넓음 → 별도 결재).

---

## 5. 권장 + 다음 단계

- **권장 = 옵션 B** (P1·P2·P3 한 번에 해소 · 위험 최소 · "슈퍼관리자에 구독라벨" 지적 직접 해결).
- 구현 범위(B 기준): `admin-users-table.tsx`(칼럼 헤더 2개 rename + 운영권한 칩에 슈퍼관리자 라벨 추가) — **단일 파일**, DB 0, 시안 토큰 룰 준수.
- ⚠️ 현재 `src/app/(admin)/admin/users/` 에 다른 CLI 세션 미커밋 변경 + index.lock 감지 → **그 작업 종료 후** 진행(충돌 방지).
- 결재되면 CLI 의뢰서로 전환(별도 PR `feat(admin): 권한/구독 2축 표현 분리`).
