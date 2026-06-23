# 🎛 Admin Console — 마스터플랜 (통합 통제 문서)

> 한 장으로 전체 통제. 디자인 클로드 ↔ 백엔드(Cowork) ↔ CLI 왕복 + S1~S4 빌드 상태.
> 최종 갱신: 2026-06-14 (라운드트립 3회차 — **계약 수렴 완료**, BDR v2.32 (19) 반영)

---

## 1. 지금 위치 (Status Board)

```
[라운드트립]  ①디자인 전달 ✅ → ②백엔드 실측회신 ✅ → ③스펙 확정 ✅ → ④검증회신 ✅
              → ⑤디자인 계약 정정 반영 ✅ (v2.32 (19): snake_case·games enum·RBAC 2역할·처리신규 3)
                                                            ↓
                              ▶ 계약 수렴 완료 — 남은 건 실행(빌드)뿐. ⑥CLI S2 박제 + 디자인은 유지
```

> v2.32 (19) 검증: 제 정정 4건 **전부 정확히 반영**(GAME_STATUS_MAP 실enum 추가, reports/teams/suggestions→partial+S1, RBAC org/content→S4). **더 정정할 계약 없음.** 이 zip 은 핸드오프 패키지만 포함 → BDR-current sync 대상 아님.

| 빌드 | 범위 | DB | 상태 | 산출/프롬프트 |
|---|---|---|---|---|
| **S2** | 신규 집계 2 API (`overview`·`inbox`) | 0 | ✅ **main 반영**(8753d27) | `Admin-Console-2-CLI-프롬프트.md` |
| **디자인 바인딩** | 목업→fetch (S2 실측 형태) | — | ✅ **완료·검증통과**(v2.32 _delivery-S2-binding) | `Admin-Console-3-디자인-바인딩-프롬프트.md` |
| **S1** | 처리 뮤테이션(매너·제안·커뮤니티) + 인박스 resolve 디스패처 | 0 | 작성됨 ▷ 박제 대기 | `Admin-Console-4-CLI-S1-프롬프트.md` |
| **S3** | `AdminInboxState`(snooze 1테이블) / (선택)`CommunityReport` | 1~2 테이블 | 작성됨 ▷ 승인+박제 | `Admin-Console-5-CLI-S3-프롬프트.md` |
| **S4** | 대회 통합진입 · 홈 배너편성 · RBAC(org/content_admin) | 코드>스키마 | 작성됨 ▷ 진단先 | `Admin-Console-6-S4-설계과제-프롬프트.md` |

> ⚠️ **결정 대기 — 팀 검수 큐**: `Team.status` 에 "검수 대기" 상태가 없어 `queue.teams=0` 고정. 켜려면 (a) `Team.status="pending_review"` 컨벤션(스키마 0) 또는 (b) `verified` flag(스키마 1필드) 중 택. S1 §4 / 결정 후 박제.
| **디자인 계약 정정** | snake/games enum/RBAC/처리신규 | — | ✅ v2.32 (19) 반영 | `Admin-Console-1-디자인클로드-프롬프트.md` |

> **S2 실측 응답 ≠ 스펙 계약** (디자인 바인딩 시 주의): `kpis`/`queue`=배열 아닌 **객체** · KPI에 `unit`/`up` 없음(`up=delta>0` 파생) · `queue.teams`=0 고정(모델부재) · inbox에 `total` 없음. 상세 = 프롬프트 ③.

---

## 2. 확정 사실 (실측 — 변경 금지 기준)

1. **응답 키 snake_case 자동변환** (`apiSuccess`→`convertKeysToSnakeCase`). 계약/바인딩 전부 snake_case.
2. **games.status enum**: `1=모집중·2=확정·3=완료·4=취소·0=기본`. (`src/lib/constants/game-status.ts`)
3. **admin 가드**: `getWebSession()`+`session.role==="super_admin"`. 헬퍼 `is-super-admin.ts`/`roles.ts`, 감사 `adminLog()`→`admin_logs`.
4. **admin_role 실재**: `super_admin`·`association_admin` 2개. `org_admin/content_admin`=미사용(S4 신규).
5. **payments 완료 status** = `"paid"` + `paid_at` 필드. (월매출 = `_sum(amount) where status="paid" & paid_at≥월초`)
6. **19기능 등급**: OK(즉시) 11 · 부분 5 · 처리뮤테이션 신규 3 · 진짜 DB 신규 ≈ 2.

## 3. 진짜 신규 작업 목록 (이것만 만들면 됨)

| 신규 | 종류 | 단계 | 비고 |
|---|---|---|---|
| `GET /admin/overview` | 읽기 API | S2 | 모델 0 |
| `GET /admin/inbox` | 읽기 API | S2 | 모델 0 |
| 매너 resolve / 제안 update / 팀 검수 | 처리 API ×3 | S1 | 모델 0 |
| `AdminInboxState` | 테이블 1 | S3 | snooze. 승인+가드 |
| `CommunityReport` | 테이블 1 | S3(선택) | 미도입 시 ‘직접검토 큐’ 대체 |
| org/content_admin role | RBAC | S4 | enforcement 레이어 |

→ 그 외 14개는 **기존 모델·라우트 바인딩만**(S1).

## 4. 대체 UX (배포 전까지)
- snooze 미배포 → 인박스 ‘보류 라벨’(로컬). · 커뮤니티 신고 모델 미도입 → ‘직접 검토 큐’(카운트 숨김). · KPI/인박스 API 전 → 목업 유지.

## 5. 다음 액션 (체크)
- [x] `1-디자인클로드-프롬프트.md` → 계약 4건 정정 (v2.32 (19) 반영 완료)
- [x] `2-CLI-프롬프트.md` → S2 2 API 박제 (main 8753d27 반영 완료)
- [x] `3-디자인-바인딩-프롬프트.md` → 콘솔 목업→fetch 바인딩 (v2.32 _delivery-S2-binding, 검증통과). 이후 처리/넘기기 버튼은 S1·S3 대기
- [ ] ▶ **CLI 통합프롬프트로 S1 박제** (`Admin-Console-CLI-통합프롬프트.md`) — 디자인은 §6 회신 양식으로 처리버튼 활성화
- [x] S1·S3·S4 프롬프트 작성 완료(④⑤⑥)
- [ ] ▶ **팀 검수 큐 방식 결정**(a 컨벤션 / b flag) → S1 §4 박제 가능해짐
- [ ] S1 박제(매너·제안·커뮤니티 resolve) → CLI
- [ ] S3 박제(snooze 테이블, schema diff 승인) → CLI
- [ ] S4 진단·결정·박제(대회 통합진입·홈 배너편성·RBAC)

## 6. 문서 인덱스 (repo 루트)
- `Admin-Console-마스터플랜.md` ← (이 문서) 통제 허브
- `Admin-Console-1-디자인클로드-프롬프트.md` — 계약 정정(완료)
- `Admin-Console-2-CLI-프롬프트.md` — S2 박제(완료)
- `Admin-Console-3-디자인-바인딩-프롬프트.md` — ▶ 목업→fetch (다음)
- **`Admin-Console-CLI-통합프롬프트.md`** ★ — S1→S3→S4 한 장(CLI 전달용, 자체완결)
- `Admin-Console-4-CLI-S1-프롬프트.md` / `5-CLI-S3` / `6-S4-설계과제` — 단계별 상세본
- `Admin-Console-구현스펙-검증회신.md` / `Admin-Console-연동확인-회신.md` — 상세 근거(1·2회차 회신)
- 패키지 원본: `Dev/design/BDR v2.32/_handoff-admin-console/`

## 7. 불변 규칙
- 본 이니셔티브 산출은 **시안/문서**. 실제 구현은 CLI 박제(subin)로만. 운영 코드 변경은 프롬프트 경유.
- DB 신규(S3)·UPDATE는 CLAUDE.md §DB 가드(승인+사전SELECT+사후검증) 필수.
- 디자인 토큰·AppNav frozen·5그룹 IA = 사용자 결정 영역 보존.

---

### (참고) 별개 진행 중 — 대회 상태 정합
Admin Console 과 무관한 트랙. `대회상태-마스터…` 없음 / 통제: `대회상태-전수조사-리포트.md` + `대회상태-Phase1~3-CLI프롬프트.md`. Phase 1(표시레이어) 먼저.
