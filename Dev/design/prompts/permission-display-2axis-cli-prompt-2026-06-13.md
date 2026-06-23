# CLI 의뢰서 — 권한/구독 2축 표현 분리 (PR-PERM-DISPLAY)

> **작성**: Cowork 2026-06-13 (수빈 결재 = 옵션 B / 구독라벨 유지)
> **근거 문서**: `Dev/permission-representation-audit-2026-06-13.md` (전수조사 + 개선안 A/B/C)
> **계기**: 슈퍼관리자(★) 8명 전원이 "역할" 칼럼에 구독등급(일반유저/대회관리자)으로 표시 → 권한과 구독 혼동.
> **결정**: 옵션 B (2축 분리). 구독 tier3 라벨 "대회관리자"는 유지(칼럼 분리로 혼동 자연 해소).
> **규모**: 단일 파일, DB 0, ~40 LOC. 별도 PR.

---

## §0. ★ 선행 조건 (필수 확인)

```
· src/app/(admin)/admin/users/ 에 다른 CLI 세션 미커밋 변경 + .git/index.lock 감지됨 (2026-06-13).
  → 그 작업 commit/머지 완료 후 시작. lock 잡힌 상태로 동시 수정 금지.
· 시작 전: git status 로 admin-users-table.tsx 미커밋 변경 없음 확인. 있으면 충돌 → 중단·보고.
```

---

## §1. 목표 (옵션 B)

유저 관리 리스트의 두 칼럼을 **각 축의 정확한 이름**으로 분리:

| 현행 | 변경 후 | 내용 |
|------|---------|------|
| "역할" 칼럼 | **"구독 등급"** | membershipType 그대로 (일반유저/픽업호스트/팀장/대회관리자) — **로직 무변경, 헤더 라벨만** |
| "관리자" 칼럼 | **"운영 권한"** | is_admin → "슈퍼관리자" 칩 / recorder_admin → "기록원관리자" / association_admin → "협회관리자" / 없으면 "—" |

→ 핵심 효과: 슈퍼관리자가 더 이상 "일반유저/대회관리자"로 안 보이고, "운영 권한" 칼럼에 "슈퍼관리자" 칩으로 정확히 표시.

---

## §2. 변경 상세 — `src/app/(admin)/admin/users/admin-users-table.tsx` (단일 파일)

### 2-1. 구독 등급 칼럼 (기존 role 칼럼)
- `USER_COLUMNS` 의 `key:"role"` 항목: `label: "역할"` → `label: "구독 등급"`
- render 로직(`getRoleInfo(u.membershipType)`) **그대로 유지** (칩 tone 무변경)

### 2-2. 운영 권한 칼럼 (기존 isAdmin 칼럼)
- `key:"isAdmin"` 항목: `label: "관리자"` → `label: "운영 권한"`
- render 변경:
  - `if (u.isAdmin)` → 기존 `"ON"` (color var(--color-error) span) 대신 **칩**:
    `<span className="admin-stat-pill" data-tone="err">슈퍼관리자</span>`
    (statusBadge 의 err tone 과 동일 빨강 토큰 — 강한 신호 유지)
  - else `getAdminRoleLabel(u.admin_role)` 존재 시 → 기존대로 `data-tone="info"` 칩 (기록원관리자/협회관리자) **무변경**
  - else → 기존대로 "—" (var(--color-text-muted))
- `getAdminRoleLabel` 함수 **무변경** (super_admin → null 유지: isAdmin 분기가 먼저 처리)

### 2-3. 모바일 카드 / 필터 탭 — 확인만 (변경 X 예상)
- 필터 탭 "전체/일반/호스트/관리자" = isAdmin/membership 필터용 → **유지** (칼럼명과 무관)
- 모달 헤더 "★ 관리자" 라벨, "슈퍼관리자" 섹션 → **유지**
- 모바일 카드가 칼럼 label 을 참조하면 같이 반영되는지 확인 (DataTableV2 구조 — 보통 label 단일 source)

### 2-4. (옵션·결재 default 실행) 부제 stale 카운트 정리
- `src/app/(admin)/admin/users/page.tsx` 부제 `슈퍼관리자 ${superAdminCount}/4` 의 하드코딩 "4" =
  `roles.ts` `MAX_SUPER_ADMINS=10` 과 불일치 (현재 8/4 처럼 상한 초과 표시).
  → `/${MAX_SUPER_ADMINS}` 로 치환 (import 추가). **page.tsx 미커밋 충돌 없을 때만** (§0).

---

## §3. Stop conditions

```
· DB schema/컬럼 변경 ❌ (표시 로직만)
· membershipType 라벨/로직 변경 ❌ (구독 tier3 "대회관리자" 유지 — 수빈 결재)
· getRoleInfo / getAdminRoleLabel 시그니처 변경 ❌
· /api/v1 ❌ / apiSuccess 응답 shape ❌
· 하드코딩 색상 ❌ → var(--color-*) / admin-stat-pill data-tone 만
· 필터 탭·모달 권한 액션 동작 변경 ❌ (라벨 표시만)
· LOC > +80
· admin-users-table.tsx 외 파일 수정 (2-4 page.tsx 부제 제외) ❌
```

---

## §4. 검증 (tester)

```
1. tsc / lint 0
2. 슈퍼관리자 행(예: record03/BDR_AI) → "구독 등급"=일반유저 / "운영 권한"=슈퍼관리자 칩(빨강)
3. recorder_admin 행(record01/02/bdr-recorder) → 구독 등급=일반유저 / 운영 권한=기록원관리자 칩
4. 일반 유저 → 구독 등급=해당 tier / 운영 권한="—"
5. 회귀: 정렬(isAdmin desc) · 검색 · 더보기 · 필터 탭 개수 · 모달 액션 무변경
6. 모바일 카드 칼럼 라벨 반영 확인
7. (2-4 적용 시) 부제 "슈퍼관리자 8/10" 표시
```

---

## §5. 커밋 / 마무리

```
· commit: feat(admin): 권한/구독 2축 표현 분리 — 역할→구독등급 / 관리자→운영권한 (PR-PERM-DISPLAY)
· BDR-current 역박제: AdminUsers.jsx 칼럼 헤더 + 운영권한 칩 동기화 (운영→시안 §4 룰)
· scratchpad 1줄 / decisions.md 1줄(2축 분리 결정) / 근거=Dev/permission-representation-audit-2026-06-13.md
· phase-ledger: Phase 외 단독 PR — 큐 문서 1줄
· STAGE A 일괄 머지에 합류 가능 (subin→dev→main)
```

---

## 즉시 시작 명령 (CLI)

```
Read Dev/design/prompts/permission-display-2axis-cli-prompt-2026-06-13.md 하고 §0 선행조건(다른 세션 lock/미커밋) 확인 후 §2부터. 옵션 B(2축 분리)·구독라벨 유지·단일 파일. 결재 default 자동.
```
