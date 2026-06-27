/**
 * 종별 연령 코드(U{N} / +{N}) → 출생연도·학년 범위 자동 계산.
 *
 * 2026-06-28 — 대회 생성 위저드 "연령 자동 채움" Phase 1 (순수 매핑 로직).
 *
 * 정책 (사용자 결정 2026-06-28):
 *   - 유소년 U{N} = "N세 이하"
 *       · birthYearMin = 대회연도 − N  (N세 = 가장 나이 많음 → 하한)
 *       · birthYearMax = null          (더 어린 선수 참가 허용)
 *       · gradeMax     = N − 6         (학년 상한, 음수/0 = null)
 *   - 시니어 +{N} = "N세 이상"
 *       · birthYearMax = 대회연도 − N  (N세 = 가장 어림 → 상한)
 *       · birthYearMin = null          (더 나이 많은 선수 허용)
 *   - 연령부 없는 종별(일반부 D3~D8 / 대학부 U1~U3 등) = null (자동계산 skip)
 *
 * ⚠️ 대학부 디비전 "U1"~"U3" 이 U{N} 연령으로 오인되지 않도록,
 *    종별의 ages[] 에 실제로 존재하는 코드만 토큰 단위로 매칭한다.
 */

export type AgeRange = {
  birthYearMin: number | null;
  birthYearMax: number | null;
  gradeMin: number | null;
  gradeMax: number | null;
};

export type ParsedAgeCode =
  | { kind: "youth"; n: number }
  | { kind: "senior"; n: number };

/** 단일 연령 코드 파싱. "U12"→youth12 / "+40"→senior40 / 그 외→null */
export function parseAgeCode(code: string): ParsedAgeCode | null {
  const s = code.trim();
  const u = s.match(/^U(\d+)$/i);
  if (u) return { kind: "youth", n: Number(u[1]) };
  const sr = s.match(/^\+(\d+)$/);
  if (sr) return { kind: "senior", n: Number(sr[1]) };
  return null;
}

/** 연령 코드 + 대회연도 → 출생연도·학년 범위. 파싱 불가 시 null. */
export function ageCodeToRange(code: string, tournamentYear: number): AgeRange | null {
  const p = parseAgeCode(code);
  if (!p) return null;
  if (p.kind === "youth") {
    const grade = p.n - 6; // 만 나이 기준 (초1 = 만7세 = N7 → grade1)
    return {
      birthYearMin: tournamentYear - p.n, // N세 이하 → 하한
      birthYearMax: null, // 더 어린 선수 허용
      gradeMin: null,
      gradeMax: grade >= 1 ? grade : null, // 학년 상한 (0/음수 = 미취학 → null)
    };
  }
  // senior +{N}: N세 이상
  return {
    birthYearMin: null, // 더 나이 많은 선수 허용
    birthYearMax: tournamentYear - p.n, // N세 이상 → 상한
    gradeMin: null,
    gradeMax: null,
  };
}

/**
 * 디비전명에 종별 ages[] 중 하나가 토큰으로 포함되면 그 연령 범위 반환.
 *
 * @param divisionName 디비전명 (예: "i3 U12", "i3-U9", "D5", "U2")
 * @param ageCodes     해당 종별의 ages 배열 (유청소년 ["U8"..."U18"] / 일반부·대학부 [])
 * @param tournamentYear 대회 기준 연도 (tournament.startDate 연도)
 *
 * - 토큰 분리(공백/하이픈) 후 **정확 일치**로 매칭 → "U1" 이 "U11" 에 부분일치하는 오류 차단.
 * - ageCodes 가 비면(일반부·대학부) 항상 null → 디비전명에 U/+ 가 있어도 연령 미적용.
 */
export function computeAgeRangeForDivision(
  divisionName: string,
  ageCodes: string[],
  tournamentYear: number,
): AgeRange | null {
  const tokens = divisionName.split(/[\s\-]+/).filter(Boolean);
  for (const code of ageCodes) {
    if (code && tokens.includes(code)) {
      return ageCodeToRange(code, tournamentYear);
    }
  }
  return null;
}
