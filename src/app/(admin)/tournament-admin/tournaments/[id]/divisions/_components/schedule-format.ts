// =====================================================================
// schedule-format.ts — 디비전 일정(날짜/코트) 역참조 표시 헬퍼 (F-2b)
//
//   ⚠ 왜 이 파일을 만들었나:
//   - 새 대회 생성폼(ct-divisions.tsx)이 settings.div_schedule 에 저장한
//     {디비전명: {dateId, courtId}} 를 admin divisions 화면에 "사람이 읽는 값"으로
//     표시하기 위함.
//   - dateId / courtId 는 식별자라 그대로 보여줄 수 없음 → schedule_dates / places
//     를 역참조해 "6.14 (토)" · "올림픽공원 A코트" 같은 라벨로 변환.
//   - allCourts / fmtDate 의 코트명·날짜 도출 알고리즘은 ct-divisions.tsx 의 정본을
//     "복제"한다(import 하면 wizard 전용 client 컴포넌트에 의존 방향이 꼬임).
//     → ct-divisions 동작은 일절 건드리지 않으므로 생성폼 회귀 0.
//
//   데이터 출처(division-rules API 응답, apiSuccess 가 응답 전체를 snake 변환):
//   - schedule_dates: [{ id, date(YYYY-MM-DD), court_ids: string[] }]
//   - places:         [{ id, name, court_count, naming }]  (수정 폼/생성폼 확장형)
//   - div_schedule:   [{ division, date_id, court_id }]     (route 에서 map→배열 변환·snake)
//
//   ⚠ 왜 map 이 아니라 배열인가:
//     원본은 settings.div_schedule = { 디비전명: { dateId, courtId } } 맵이지만,
//     apiSuccess(convertKeysToSnakeCase)가 응답 전체를 재귀 snake 변환하면
//       ① 디비전명이 "키" 라 영문 디비전명(U10)까지 _u10 으로 망가지고
//       ② 내부 dateId/courtId 도 date_id/court_id 로 바뀐다.
//     → route.ts 에서 디비전명을 "값"(division)으로 옮긴 배열로 내보내 디비전명을 보존한다.
//       소비처(이 파일)는 배열 + snake(date_id/court_id) 기준으로 읽는다.
// =====================================================================

// ── 최상위 응답 타입 (snake) ─────────────────────────────────────────────
export type ScheduleDateLite = {
  id: string;
  date: string; // YYYY-MM-DD
  court_ids?: string[];
};

// places 항목 — 생성폼 확장형(court_count/naming). 구형(평면 장소)도 안전하게 무시.
export type PlaceLite = {
  id?: string;
  name?: string;
  court_count?: number;
  naming?: "num" | "alpha" | string;
};

// div_schedule 배열 항목 — route 에서 map→배열 변환 후 apiSuccess 가 snake 변환.
//   division = 디비전명(값이라 원본 보존) / date_id·court_id = 내부 식별자(snake 변환됨)
export type DivScheduleEntry = {
  division: string;
  date_id?: string;
  court_id?: string;
};

// ── 코트 풀 펼치기 (ct-divisions allCourts 정본 복제) ───────────────────────
//   places → 코트 옵션 목록(id = `${venueId}_c${idx}`, full = `${장소명} ${접미}코트`)
//   naming: alpha → A/B/C... / num(기본) → 1/2/3...
type Court = { id: string; full: string };
export function allCourts(places: PlaceLite[] | null | undefined): Court[] {
  const out: Court[] = [];
  if (!Array.isArray(places)) return out;
  places.forEach((v) => {
    const venueId = v?.id;
    if (!venueId) return; // id 없는 구형 평면 장소는 코트 역참조 대상 아님
    const count = typeof v.court_count === "number" ? v.court_count : 0;
    for (let i = 0; i < count; i++) {
      const suffix = v.naming === "alpha" ? String.fromCharCode(65 + i) : String(i + 1);
      out.push({ id: `${venueId}_c${i}`, full: `${v.name ?? "장소"} ${suffix}코트` });
    }
  });
  return out;
}

// ── 날짜 라벨 (ct-divisions fmtDate 정본 복제) — "M.D (요일)" ───────────────
export function fmtDate(s: string): string {
  const dt = new Date(s + "T00:00:00");
  if (Number.isNaN(dt.getTime())) return s;
  const wk = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
  return `${dt.getMonth() + 1}.${dt.getDate()} (${wk})`;
}

// ── 역참조: dateId → 날짜 라벨 ─────────────────────────────────────────────
//   schedule_dates 에서 id 일치 항목을 찾아 fmtDate 변환. 못 찾으면 null(→ "–").
export function lookupDateLabel(
  dateId: string | undefined,
  scheduleDates: ScheduleDateLite[] | null | undefined,
): string | null {
  if (!dateId || !Array.isArray(scheduleDates)) return null;
  const sd = scheduleDates.find((d) => d?.id === dateId);
  return sd ? fmtDate(sd.date) : null;
}

// ── 역참조: courtId → 코트명 ──────────────────────────────────────────────
//   places 를 펼친 코트 풀에서 id 일치 항목의 full 라벨. 못 찾으면 null(→ "–").
export function lookupCourtLabel(
  courtId: string | undefined,
  places: PlaceLite[] | null | undefined,
): string | null {
  if (!courtId) return null;
  const courts = allCourts(places);
  const c = courts.find((x) => x.id === courtId);
  return c ? c.full : null;
}

// ── 디비전 배열에서 라벨 매칭 ──────────────────────────────────────────────
//   div_schedule 배열에서 division === label(또는 code) 항목을 찾아
//   날짜/코트 라벨로 변환. 매칭 실패·값 부재·룩업 실패는 null(표시 측 "–").
//   매칭은 DivisionRule.label 우선 → code 폴백(생성폼은 디비전명으로 저장).
export function resolveDivisionSchedule(
  divSchedule: DivScheduleEntry[] | null | undefined,
  label: string,
  code: string,
  scheduleDates: ScheduleDateLite[] | null | undefined,
  places: PlaceLite[] | null | undefined,
): { dateLabel: string | null; courtLabel: string | null } {
  if (!Array.isArray(divSchedule)) {
    return { dateLabel: null, courtLabel: null };
  }
  const entry =
    divSchedule.find((e) => e?.division === label) ??
    divSchedule.find((e) => e?.division === code);
  if (!entry) return { dateLabel: null, courtLabel: null };
  return {
    dateLabel: lookupDateLabel(entry.date_id, scheduleDates),
    courtLabel: lookupCourtLabel(entry.court_id, places),
  };
}
