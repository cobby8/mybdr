// =====================================================================
// sponsors.ts — 후원사(sponsors) 읽기 정규화 공용 헬퍼
//   왜: DB sponsors 컬럼은 현재 String(콤마구분)이나, 향후 Json(배열) 마이그레이션을
//       대비해 읽는 쪽이 "문자열/배열/객체" 어떤 형태든 안전하게 받도록 방어한다.
//       1단계는 "읽기 방어"만 — 쓰기/validation/schema/마법사 입력은 변경하지 않는다.
//   참고: 관리자 화면 2곳(tournament-detail-data / ct-create-tournament)에서만 사용.
//        현재 콤마 String 데이터 기준 출력은 기존과 100% 동일(회귀0).
// =====================================================================

// 후원사 1건. name 은 필수, id/logo 는 선택(미래 Json 배열 형태 대비).
export type SponsorItem = { id?: string; name: string; logo?: string };

// unknown 입력을 SponsorItem[] 로 정규화한다.
//   - 배열: 문자열 요소는 {name} 으로, {name:string} 객체는 그대로 통과(name 없는 항목은 제거)
//   - 문자열: 콤마(,) 또는 슬래시(/) 로 분리 후 trim·빈값 제거 → {name} 배열
//   - 그 외(null/undefined/숫자 등): 빈 배열
export function normalizeSponsors(v: unknown): SponsorItem[] {
  if (Array.isArray(v)) {
    return v
      .map((s) =>
        typeof s === "string"
          ? { name: s.trim() }
          : s && typeof s === "object" && typeof (s as { name?: unknown }).name === "string"
            ? (s as SponsorItem)
            : null,
      )
      .filter((x): x is SponsorItem => !!x && !!x.name);
  }
  if (typeof v === "string") {
    return v
      .split(/[,/]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }
  return [];
}
