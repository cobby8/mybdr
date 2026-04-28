"use client";

// 2026-04-27: Phase 9 P0-4-A — ResponsiveTable 공용 컴포넌트
// 시안: Dev/design/BDR-v2-upgrade-prompts.md (P0-4) + _mobile_audit_report.html Med
// 사용처(예정, 별도 커밋): 다중 컬럼 board 라벨 손실 4건
//
// 왜 만드는가:
//  - 데스크톱 grid 테이블을 모바일(<=720px)에서 단순 폭 축소만 하면
//    헤더가 사라진 상태에서 셀 값만 나열되어 "이 숫자가 무슨 컬럼인지"
//    의미를 잃는다(Med 라벨 손실 이슈).
//  - data-label 속성으로 모바일에서만 라벨을 ::before 의사요소로 출력해
//    "라벨: 값" 카드 또는 stack 형태로 의미를 보존한다.
//
// 동작 요약:
//  1. 데스크톱: columns.width 로 grid-template-columns 구성, 헤더 + 행 그리드.
//  2. 모바일 card 모드: 행 자체가 카드, 각 셀이 "라벨 / 값" 2열 그리드.
//  3. 모바일 stack 모드: 행은 단순 세로 스택, 각 셀이 inline "라벨: 값".
//  4. mobileHide 로 모바일에서 숨길 컬럼을 지정 가능.
//  5. rows 비면 emptyMessage 단일 div 렌더.

import { ReactElement, ReactNode, useMemo } from "react";

// 컬럼 정의 — 외부에서 선언적으로 표 구조를 기술
export interface ResponsiveTableColumn<T> {
  // 데이터 키. 행이 객체면 fallback 으로 row[key] 를 셀 값으로 사용
  key: string;
  // 데스크톱 헤더 텍스트
  label: string;
  // grid-template-columns 한 슬롯 ("120px", "1fr", "minmax(0,2fr)" 등). 미지정 시 "1fr"
  width?: string;
  // 모바일 카드/스택에서 표시할 라벨. 없으면 label 사용
  mobileLabel?: string;
  // 셀 정렬. 미지정 시 left
  align?: "left" | "center" | "right";
  // 커스텀 렌더러 — 없으면 row[key] 를 그대로 출력
  render?: (row: T) => ReactNode;
}

export interface ResponsiveTableProps<T> {
  columns: ResponsiveTableColumn<T>[];
  rows: T[];
  // "card": 행이 카드 박스, 셀이 라벨/값 2열. "stack": 행 박스 없이 세로 스택
  mobileMode?: "card" | "stack";
  // 모바일에서 display:none 처리할 컬럼 key 목록
  mobileHide?: string[];
  // React key 생성 — 행 식별자 (id 또는 index 기반)
  rowKey: (row: T, index: number) => string | number;
  className?: string;
  // 데이터 없을 때 안내 문구
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  columns,
  rows,
  mobileMode = "card",
  mobileHide = [],
  rowKey,
  className,
  emptyMessage = "데이터가 없습니다",
}: ResponsiveTableProps<T>): ReactElement {
  // 데스크톱 grid-template-columns 문자열 — columns.width 합성
  const gridTemplateColumns = useMemo(
    () => columns.map((c) => c.width ?? "1fr").join(" "),
    [columns]
  );

  // (현재는 렌더 분기에 직접 mobileHide 사용. useMemo 보존하지 않아도 비용 미미하지만
  //  키 비교 일관성 위해 set 형태로 캐싱해두는 편이 가독성 좋음 — 후속 확장 여지)
  const mobileHideSet = useMemo(() => new Set(mobileHide), [mobileHide]);

  // 빈 상태 — 헤더/행 모두 그리지 않고 단일 안내문 출력
  if (rows.length === 0) {
    return (
      <div
        className={className}
        style={{
          padding: 32,
          textAlign: "center",
          color: "var(--ink-dim)",
          fontSize: 13,
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`resp-table resp-table--${mobileMode} ${className ?? ""}`}>
      {/* 데스크톱 헤더 — 모바일에서는 CSS 로 display:none */}
      <div className="resp-table__head" style={{ gridTemplateColumns }}>
        {columns.map((c) => (
          <div key={c.key} style={{ textAlign: c.align ?? "left" }}>
            {c.label}
          </div>
        ))}
      </div>

      {/* 데이터 행 — 데스크톱은 grid, 모바일은 mode 별 변형 */}
      {rows.map((row, idx) => (
        <div
          key={rowKey(row, idx)}
          className="resp-table__row"
          style={{ gridTemplateColumns }}
        >
          {columns.map((c) => {
            // render 우선, 없으면 row[key] fallback. 인덱스 접근을 위해 Record 캐스팅
            const value = c.render
              ? c.render(row)
              : ((row as unknown as Record<string, ReactNode>)[c.key] ?? "");
            const isMobileHidden = mobileHideSet.has(c.key);
            return (
              <div
                key={c.key}
                className={`resp-table__cell ${
                  isMobileHidden ? "resp-table__cell--hide-mobile" : ""
                }`}
                // data-label — 모바일 ::before 의사요소가 attr() 로 읽어 라벨로 표시
                data-label={c.mobileLabel ?? c.label}
                style={{ textAlign: c.align ?? "left" }}
              >
                {value}
              </div>
            );
          })}
        </div>
      ))}

      <style jsx>{`
        .resp-table {
          display: block;
        }
        .resp-table__head {
          display: grid;
          padding: 12px 16px;
          background: var(--bg-alt);
          font-size: 12px;
          color: var(--ink-mute);
          font-weight: 700;
          border-bottom: 1px solid var(--border);
        }
        .resp-table__row {
          display: grid;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          align-items: center;
          font-size: 13px;
        }
        .resp-table__row:last-child {
          border-bottom: 0;
        }
        @media (max-width: 720px) {
          /* 모바일: 헤더 숨김 — 라벨은 셀 ::before 로 전환 */
          .resp-table__head {
            display: none;
          }
          /* card 모드: 행이 카드 박스, 셀이 "라벨 / 값" 2열 그리드 */
          .resp-table--card .resp-table__row {
            display: block;
            padding: 14px 16px;
            border-radius: 6px;
            background: var(--bg);
            border: 1px solid var(--border);
            margin-bottom: 8px;
          }
          .resp-table--card .resp-table__row:last-child {
            border-bottom: 1px solid var(--border);
          }
          .resp-table--card .resp-table__cell {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 8px;
            padding: 6px 0;
            text-align: left !important;
          }
          .resp-table--card .resp-table__cell::before {
            content: attr(data-label);
            color: var(--ink-mute);
            font-size: 12px;
            font-weight: 500;
          }
          /* stack 모드: 행 박스 없이 세로 스택, 셀은 inline "라벨: 값" */
          .resp-table--stack .resp-table__row {
            display: block;
            padding: 12px 0;
          }
          .resp-table--stack .resp-table__cell {
            display: flex;
            gap: 8px;
            padding: 2px 0;
            font-size: 13px;
            text-align: left !important;
          }
          .resp-table--stack .resp-table__cell::before {
            content: attr(data-label) ":";
            color: var(--ink-mute);
            min-width: 80px;
            font-weight: 500;
          }
          /* 모바일 숨김 컬럼 */
          .resp-table__cell--hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
