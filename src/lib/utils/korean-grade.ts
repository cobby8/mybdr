/**
 * 2026-05-11 Phase 3-A — 한국 학년 체계 변환 유틸.
 *
 * 변환:
 *   - 절대 학년 (1~12) → 한국 표기 (초1~6 / 중1~3 / 고1~3)
 *   - 생년월일 → 절대 학년 (현재 학년도 기준 자동 계산)
 *
 * 한국 학년 계산 룰:
 *   - 신학기 = 매년 3월 시작 (한국 학교 시스템)
 *   - 초1 진학 = 만 7세 도래 (= 출생 연도 + 7)
 *   - 학년도(school year) = 3월 ~ 다음해 2월 (예: 2026년 3월 ~ 2027년 2월 = 2026학년도)
 *   - 예외: 1~2월 출생자 = "빠른 OO년생" 케이스 (운영 수동 처리)
 *
 * 사용처:
 *   - /team-apply/[token] 코치 명단 입력 시 생년월일 → 학년 자동 표시
 *   - 운영자 페이지 종별 표시 (i3 U14 = 중2 = 8학년)
 */

/**
 * 절대 학년 (1~12) → 한국 학년 표기.
 *
 * @example
 *   gradeToKorean(3)  // "초3"
 *   gradeToKorean(8)  // "중2"
 *   gradeToKorean(11) // "고2"
 *   gradeToKorean(0)  // "유치원 이하"
 */
export function gradeToKorean(grade: number | null | undefined): string {
  if (grade == null || !Number.isFinite(grade)) return "-";
  if (grade < 1) return "유치원 이하";
  if (grade >= 1 && grade <= 6) return `초${grade}`;
  if (grade >= 7 && grade <= 9) return `중${grade - 6}`;
  if (grade >= 10 && grade <= 12) return `고${grade - 9}`;
  return `${grade}학년`;
}

/**
 * 생년월일 → 절대 학년 (2026학년도 기준).
 *
 * @param birthDate - YYYY-MM-DD 형식 또는 Date 객체
 * @param schoolYear - 현재 학년도 (기본값 = 현재 연도, 단 1~2월이면 전년도)
 * @returns 절대 학년 (1~12 또는 0 이하 = 유치원)
 *
 * @example
 *   birthDateToGrade("2017-05-16", 2026)  // 3 (초3)
 *   birthDateToGrade("2012-05-16", 2026)  // 8 (중2)
 *   birthDateToGrade("2019-03-01", 2026)  // 1 (초1)
 */
export function birthDateToGrade(
  birthDate: string | Date | null | undefined,
  schoolYear?: number,
): number | null {
  if (!birthDate) return null;
  const d = typeof birthDate === "string" ? parseBirthDate(birthDate) : birthDate;
  if (!d || isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const ref = schoolYear ?? currentSchoolYear();
  // 초1 = ref - year - 6 (2026 - 2019 - 6 = 1)
  const grade = ref - year - 6;
  return grade;
}

/**
 * 한국 학년도 기준 현재 학년도 (3월 신학기 룰).
 * 1~2월 = 전년도 학년 / 3월~12월 = 당년 학년.
 */
export function currentSchoolYear(now: Date = new Date()): number {
  const month = now.getMonth() + 1; // 1~12
  return month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * 다양한 생년월일 형식을 Date 로 normalize.
 *
 * 지원 형식:
 *   - "2012-05-16" (HTML date input 표준)
 *   - "2012.5.16" / "2012.05.16"
 *   - "2012/5/16" / "2012/05/16"
 *   - "20120516" (8자리)
 *   - "12.5.16" / "12-05-16" (2자리 연도 — 1900/2000 추정)
 */
export function parseBirthDate(input: string): Date | null {
  if (!input || typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;

  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD
  const m1 = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (m1) {
    return new Date(`${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}T00:00:00`);
  }
  // YYYYMMDD
  const m2 = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m2) {
    return new Date(`${m2[1]}-${m2[2]}-${m2[3]}T00:00:00`);
  }
  // YY-MM-DD / YY.MM.DD (2자리 연도 — 24 이하 = 2000년대, 25~99 = 1900년대 추정)
  const m3 = s.match(/^(\d{2})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (m3) {
    const yy = Number(m3[1]);
    const fullYear = yy <= 24 ? 2000 + yy : 1900 + yy;
    return new Date(`${fullYear}-${m3[2].padStart(2, "0")}-${m3[3].padStart(2, "0")}T00:00:00`);
  }
  return null;
}

/**
 * 생년월일 string → ISO 표준 "YYYY-MM-DD" 형식으로 normalize.
 * HTML date input value 호환.
 */
export function normalizeBirthDate(input: string): string | null {
  const d = parseBirthDate(input);
  if (!d || isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 휴대폰 번호 normalize → "010-XXXX-XXXX" 형식.
 *
 * 지원 입력:
 *   - "010-1234-5678" (이미 표준)
 *   - "01012345678" (하이픈 없음)
 *   - "010 1234 5678" (공백)
 */
export function normalizePhone(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  if (!/^01\d{8,9}$/.test(digits)) return null;
  // 01X-XXXX-XXXX (11자) 또는 01X-XXX-XXXX (10자)
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return null;
}
