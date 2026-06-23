# Phase 1 — 대회 상태 표시 레이어 영구 수정 (CLI 박제 프롬프트)

> 결정(2026-06-14): ① 표시 레이어 먼저(무위험) ② 공지전용 대회(매치0)는 "날짜 지나면 완료 표시" — **앞으로도 계속 생기는 패턴**이므로 날짜 기반 로직이 정답.
> 작업 범위: **코드만. 운영 DB UPDATE 절대 금지.** subin 브랜치.

---

## 0. 목표 한 줄

대회 상태 표시를 **DB status + 날짜(end_date)** 둘 다 보도록 바꾼다.
`status`가 종료군이 아니어도 **종료일이 지났으면 화면상 "종료"** 로 표시 → 현재 50건 즉시 정상화 + 공지전용/수동누락 재발 영구 방지.

---

## 1. 핵심 규칙 (effectiveTournamentStatus)

`src/lib/constants/tournament-status.ts` 에 신규 함수 추가:

```ts
const FINAL_STATUSES = ["completed", "ended", "closed", "cancelled"];
const PREOPEN_STATUSES = ["draft", "upcoming"];

/**
 * DB status + 날짜를 합쳐 "표시용 실질 상태 키"를 반환.
 * - 이미 종료군 → 그대로
 * - 준비중(draft/upcoming) → 그대로 (공개 목록엔 어차피 제외됨, 날짜 무관)
 * - 그 외(접수중/진행중) → 종료일(없으면 시작일)이 지났으면 'completed'
 * 날짜 비교는 "종료일 당일 23:59:59 까지는 미종료" (당일은 진행으로 본다).
 * ※ 공개 화면 전용. admin 화면은 raw status 유지(운영자가 실제값 확인·수정).
 */
export function effectiveTournamentStatus(
  status: string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
): string {
  const s = status ?? "draft";
  if (FINAL_STATUSES.includes(s)) return s;
  if (PREOPEN_STATUSES.includes(s)) return s;

  const ref = endDate ?? startDate;
  if (ref) {
    const d = new Date(ref);
    if (!isNaN(d.getTime())) {
      // 종료일 당일 끝(로컬 23:59:59.999)까지는 미종료로 간주
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      if (endOfDay.getTime() < Date.now()) return "completed";
    }
  }
  return s;
}
```

라벨/뱃지/색상은 기존 `TOURNAMENT_STATUS_LABEL[effectiveTournamentStatus(...)]` 형태로 감싸면 끝.

---

## 2. 적용 대상 (공개 화면만)

각 호출부에서 `status` 단독 대신 `effectiveTournamentStatus(status, startDate, endDate)` 결과로 라벨링:

**(a) 목록 — `deriveV2Status` 보정** `src/app/(web)/tournaments/_components/v2-tournament-list.tsx:83`
- 함수 진입부에서 `const st = effectiveTournamentStatus(t.status, t.start_date, t.end_date).toLowerCase();` 로 교체(기존 `t.status` 직접 lower 대신).
- 이러면 카드 배지 + 탭 필터 + 카운트(`tournaments-content.tsx`)가 **단일 소스**로 함께 정상화됨.

**(b) 상세 히어로** `[id]/_components/v2-tournament-hero.tsx:78` 및 `tournament-hero.tsx:69`
- `TOURNAMENT_STATUS_LABEL[effectiveTournamentStatus(status, startDate, endDate)]`

**(c) 신청 사이드바·스티커** `v2-registration-sidebar.tsx:99`, `components/tournaments/registration-sticky-card.tsx:105`
- 동일 보정. (단, 신청 CTA 노출 조건 `isRegistrationOpen` 로직이 별도면 그건 건드리지 말 것 — 표시 라벨만 보정)

**(d) 캘린더·주간·프로필** `calendar-view.tsx:322`, `week-view.tsx:279`, `profile/_components/tournaments-section.tsx:32`
- 각 t에 start/end 있으면 보정. 없으면 raw 폴백.

**(e) 서브도메인 사이트 템플릿** `components/site-templates/classic.tsx:97`
- 대회 사이트도 공개 화면 → 보정 적용.

## 3. 제외 (raw status 유지)

다음 **admin/tournament-admin 화면은 보정하지 말 것** — 운영자가 실제 저장된 status 를 보고 수동 전환해야 함:
- `(admin)/tournament-admin/tournaments/_components/admin-tournament-list.tsx`
- `(admin)/tournament-admin/tournaments/[id]/page.tsx`
- `(admin)/tournament-admin/series/page.tsx`
- `(admin)/admin/tournaments/*`

→ admin 에는 "실질 종료(날짜 경과)" 를 보조 표기하고 싶으면 별도 뱃지("기한 경과")로 **추가**만, raw status 교체 ❌.

---

## 4. 엣지 케이스 (반드시 처리)

1. `end_date` null → `start_date` 폴백. 둘 다 null → raw status 그대로(오버라이드 안 함).
2. 종료일 **당일**은 아직 "종료" 아님(23:59:59까지 진행). 자정 지나야 종료.
3. `cancelled` 등 FINAL 은 날짜 무관 그대로(취소를 종료로 덮지 않음 — 이미 종료 라벨).
4. `in_progress` + 종료일 경과 → "종료"(열혈농구단처럼 2년 전 건 즉시 정상화). 단 결선 진행 중인 대회가 end_date 를 과거로 잘못 가진 경우가 있으면 데이터 수정이 맞음(Phase 2에서 개별 확인).
5. 진행중 경계(start 지남 + end 미래)는 이번 범위 **제외**(종료 표시만 목표). 원하면 후속.

---

## 5. 검증 (완료 조건)

1. **단위 테스트** `src/__tests__/lib/effective-tournament-status.test.ts` 신규:
   - published + 어제 end → "completed"
   - published + 내일 end → "published"
   - published + 오늘 end → "published"(당일 미종료)
   - in_progress + 2년전 end → "completed"
   - cancelled + 과거 → "cancelled"
   - draft + 과거 → "draft"
   - end null + start 과거 → "completed" / 둘 다 null → 원본
2. `npm run build` 통과 (TS strict).
3. 로컬 3001 에서 `/tournaments`:
   - 공지전용 47건 + 실진행 3건이 카드/탭에서 **"종료"** 로 이동, "모집 중" 카운트 감소 확인.
   - admin 목록은 여전히 raw(published) 표기 확인.
4. 회귀: AppNav/디자인 토큰 무관(로직 변경) → BDR-current 시안 동기화 **불필요**(시각 패턴 변경 아님). scratchpad 로그 1줄.

---

## 6. 브랜치·커밋

```
git checkout subin && git merge dev
# 작업
git commit -m "fix(tournaments): 종료일 경과 대회 표시 상태 보정 (effectiveTournamentStatus)"
git push origin subin   # → subin→dev PR
```

DB 0건 · 운영 영향 0. **prisma 명령/마이그레이션 일절 없음.**

---

## 7. 이후 (이번 작업 아님 — 별도 승인)

- **Phase 2**: 실진행 3건(뉴비4·뉴비5·스타터6) + 열혈농구단 → DB `status='completed'` + 우승팀/순위 정리. 운영 UPDATE → 승인+SELECT 사전검증+사후 count 검증(CLAUDE.md §DB 가드).
- **Phase 3(선택)**: 날짜 경과 대회 status 정합 배치/cron. 단 공지전용 대회는 표시 레이어로 충분하므로 raw status 변경이 꼭 필요한 소비처(원시 status 읽는 외부/리포트)가 있을 때만.
