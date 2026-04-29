/* ============================================================
 * DataTableV2 — BDR v2.1 표 형 컴포넌트
 *
 * 시안 출처: Dev/design/BDR v2.1/responsive.css 의 .data-table 룰
 * globals.css 통합: G-1 (commit 9b14439)
 *
 * 데스크톱: grid 표 (헤더 + 행)
 * 모바일 (≤720px): G-1 룰이 자동 카드 리스트 변환
 *   - data-table__head 숨김
 *   - data-label 어트리뷰트로 라벨 자동 표시
 *   - data-primary="true" 셀이 카드 제목
 *   - data-actions="true" 셀이 카드 하단 버튼 영역
 * ============================================================ */

import type React from "react";

// 컬럼 정의 인터페이스 — 페이지에서 columns 명세를 선언적으로 작성
export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  // 모바일 카드형 변환 시 카드 제목으로 사용 (G-1 룰의 data-primary)
  primary?: boolean;
  // 모바일 카드형 변환 시 하단 버튼 영역 (G-1 룰의 data-actions)
  actions?: boolean;
  // 데스크톱 grid 컬럼 폭 ("120px", "1fr" 등). 미지정 시 1fr
  width?: string;
  // 셀 커스텀 렌더러 (Badge, Button 등 복합 요소용)
  render?: (row: T) => React.ReactNode;
}

interface DataTableV2Props<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  // 행 전체 클릭 핸들러 (행 클릭으로 모달 열기 등)
  onRowClick?: (row: T) => void;
}

export function DataTableV2<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "데이터 없음",
  onRowClick,
}: DataTableV2Props<T>): React.ReactElement {
  // 빈 상태: G-1 룰 외부에서 처리 (단순 메시지 박스)
  if (rows.length === 0) {
    return <div className="data-table__empty">{emptyMessage}</div>;
  }

  // grid-template-columns 구성 — 데스크톱 컬럼 폭 일괄 지정
  const gridTemplate = columns.map((c) => c.width ?? "1fr").join(" ");

  return (
    <div className="data-table">
      {/* 데스크톱 헤더 — 모바일에서는 G-1 룰이 display:none */}
      <div
        className="data-table__head"
        style={{ display: "grid", gridTemplateColumns: gridTemplate }}
      >
        {columns.map((c) => (
          <span key={String(c.key)}>{c.label}</span>
        ))}
      </div>

      {/* 행 반복 — 모바일에서는 G-1 룰이 카드 형태로 자동 변환 */}
      {rows.map((row) => (
        <div
          key={rowKey(row)}
          className="data-table__row"
          style={{
            display: "grid",
            gridTemplateColumns: gridTemplate,
            cursor: onRowClick ? "pointer" : undefined,
          }}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
        >
          {columns.map((c) => (
            <span
              key={String(c.key)}
              // 모바일 카드형에서 ::before pseudo로 라벨 표시 (G-1 룰)
              data-label={c.label}
              {...(c.primary && { "data-primary": "true" })}
              {...(c.actions && { "data-actions": "true" })}
            >
              {c.render
                ? c.render(row)
                : String(
                    (row as Record<string, unknown>)[c.key as string] ?? "",
                  )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
