/**
 * ExcelRow — 엑셀 헤더 행을 키로 변환한 행 타입
 *
 * 이유:
 *   - 엑셀 파싱 결과는 시트 각 행을 동적 키의 객체로 변환해 사용한다.
 *     (첫 행을 헤더로 간주 → 예: { "이름": "홍길동", "생년월일": "1990-01-15" })
 *   - 헤더명과 값 타입은 사용처마다 다르므로 엄격한 interface는 억지 casting을 유발한다.
 *   - 따라서 `Record<string, 허용 원시타입>` 형태의 실용적 공용 타입으로 통일한다.
 *
 * 사용 예:
 *   import type { ExcelRow } from "@/lib/types/excel-row";
 *   const rows: ExcelRow[] = sheetDataToExcelRows(sheetData);
 *   const name = String(rows[0]["이름"] ?? "").trim();
 *
 * 주의:
 *   - 실제 사용 시 `String(row["헤더명"] ?? "")` 패턴으로 문자열 강제 변환을 권장
 *     (엑셀 셀이 number/Date 타입으로 올 수 있음)
 */
export type ExcelRow = Record<
  string,
  string | number | boolean | Date | null | undefined
>;
