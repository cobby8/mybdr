"use client";

/**
 * records-shared.tsx — 기록(Records) 공통 컴포넌트
 * ─────────────────────────────────────────────────────────
 * 시안 박제: Dev/design/BDR v2.33/_delivery-records-2026-06-16/records-shared.jsx
 *
 * 이유(왜): 선수/팀/대회 기록표가 모두 동일한 21컬럼 박스 양식(statCols)과
 *   정렬/sticky 테이블(RecTable)을 공유한다. 단일 정의로 일관성 보장.
 *
 * 방법(어떻게): 시안의 window 전역(window.RecShared) → React named export + 타입화.
 *   - 데이터 키는 시안과 동일한 snake_case 유지(API 응답 raw 그대로 사용 = snake 일관).
 *   - 링크는 Next <Link> 로 SPA 라우팅. teamHref/userHref 는 Team.id/User.id 기반.
 *   - ShotChart / SeasonSummary 는 이번 박제 보류(미반입).
 */

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import "./records.css";

// 기록 행: 표준 박스 키(snake_case) + 메타 키가 섞인 느슨한 레코드.
export type RecRow = Record<string, string | number | boolean | null | undefined>;

export interface RecColumn<T extends RecRow = RecRow> {
  key: string;
  label: string;
  align?: "left" | "right";
  sticky?: boolean;
  strong?: boolean;
  sortable?: boolean;
  render?: (r: T) => ReactNode;
  sortVal?: (r: T) => number | string;
}

export interface RecSortState {
  key: string;
  dir: "asc" | "desc";
}

// ── 포맷 헬퍼 ──
const hasVal = (v: unknown): v is number | string =>
  v != null && !(typeof v === "number" && isNaN(v));
export const fmt1 = (n: unknown): string =>
  !hasVal(n) ? "–" : Number(n).toFixed(1);
export const fmtPct = (n: unknown): string =>
  !hasVal(n) ? "–" : Number(n).toFixed(1) + "%";

// ── 링크 (선수/팀 페이지) ── 행 클릭과 충돌 방지 위해 stopPropagation
export function Lnk({
  href,
  className,
  children,
}: {
  href: string | null;
  className?: string;
  children: ReactNode;
}) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <Link
      className={"rec-link " + (className || "")}
      href={href}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}
// MVP: 기록 탭(선수 ?tab=records / 팀 ?tab=records)은 후속 단계에서 추가 →
//   현재는 프로필/팀 기본 페이지로 링크(진입 후 기록 탭은 단계 [4][5]에서 활성화).
export const userHref = (id: string | number | null): string | null =>
  id != null ? "/users/" + id : null;
export const teamHref = (id: string | number | null): string | null =>
  id != null ? "/teams/" + id : null;

// ── 세그먼트 토글 (3단위) — radius 4px (pill 금지) ──
export interface RecSegOption {
  v: string;
  l: string;
  ico: string;
}
export function RecSeg({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: RecSegOption[];
}) {
  return (
    <div className="rec-seg" role="tablist" aria-label="집계 단위">
      {options.map((o) => (
        <button
          key={o.v}
          role="tab"
          aria-selected={value === o.v}
          className={"rec-seg__btn" + (value === o.v ? " is-on" : "")}
          onClick={() => onChange(o.v)}
        >
          <span className="ico material-symbols-outlined">{o.ico}</span>
          <span className="rec-seg__lbl">{o.l}</span>
        </button>
      ))}
    </div>
  );
}

// ── 평균/누적 토글 (보조) — 파랑(cafe-blue) 활성·아이콘 없음·우측 정렬용 ──
//   unit 세그먼트(RecSeg, 빨강 메인)와 위계 구분. radius 4px(pill 금지).
export interface RecAggOption {
  v: string;
  l: string;
}
export function RecAggToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: RecAggOption[];
}) {
  return (
    <div className="rec-aggtoggle" role="tablist" aria-label="집계 방식">
      {options.map((o) => (
        <button
          key={o.v}
          role="tab"
          aria-selected={value === o.v}
          className={"rec-aggtoggle__btn" + (value === o.v ? " is-on" : "")}
          onClick={() => onChange(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

// ── 공통 sortable 테이블 ──
export function RecTable<T extends RecRow>({
  columns,
  rows,
  getKey,
  onRowClick,
  initialSort,
  pinnedRows,
}: {
  columns: RecColumn<T>[];
  rows: T[];
  getKey: (r: T) => string;
  onRowClick?: (r: T) => void;
  initialSort?: RecSortState;
  pinnedRows?: T[];
}) {
  const [sort, setSort] = useState<RecSortState>(
    initialSort || {
      key: columns.find((c) => c.align === "right")?.key || columns[0].key,
      dir: "desc",
    },
  );

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = col.sortVal || ((r: T) => r[sort.key] as number | string);
    const dir = sort.dir === "asc" ? 1 : -1;
    return rows.slice().sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (typeof va === "string" || typeof vb === "string")
        return String(va).localeCompare(String(vb), "ko") * dir;
      return (((va as number) ?? 0) - ((vb as number) ?? 0)) * dir;
    });
  }, [rows, sort, columns]);

  const clickHead = (c: RecColumn<T>) => {
    if (c.sortable === false) return;
    setSort((s) =>
      s.key === c.key
        ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key: c.key, dir: c.align === "left" ? "asc" : "desc" },
    );
  };

  const renderCell = (c: RecColumn<T>, r: T): ReactNode =>
    c.render ? c.render(r) : (r[c.key] as ReactNode);

  return (
    <div className="rec-tablewrap">
      <table className="rec-table">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort.key === c.key;
              return (
                <th
                  key={c.key}
                  className={
                    "rec-th" +
                    (c.align === "left" ? " rec-th--l" : "") +
                    (c.sticky ? " rec-th--sticky" : "") +
                    (c.sortable === false ? "" : " rec-th--sort") +
                    (active ? " is-active" : "")
                  }
                  onClick={() => clickHead(c)}
                  title={c.sortable === false ? "" : "정렬"}
                >
                  <span className="rec-th__lbl">{c.label}</span>
                  {c.sortable !== false && active && (
                    <span className="ico material-symbols-outlined rec-th__arrow is-on">
                      {sort.dir === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
                    </span>
                  )}
                </th>
              );
            })}
            <th className="rec-th rec-th--spacer" aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {(pinnedRows || []).map((r, i) => (
            <tr key={"pin-" + i} className="rec-tr--pinned">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={
                    "rec-td" +
                    (c.align === "left" ? " rec-td--l" : "") +
                    (c.sticky ? " rec-td--sticky" : "") +
                    (c.strong ? " rec-td--strong" : "")
                  }
                >
                  {renderCell(c, r)}
                </td>
              ))}
              <td className="rec-td rec-td--spacer"></td>
            </tr>
          ))}
          {sorted.map((r) => {
            const clickable = onRowClick && !r._noClick;
            return (
              <tr
                key={getKey(r)}
                className={clickable ? "is-clickable" : ""}
                onClick={clickable ? () => onRowClick!(r) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={
                      "rec-td" +
                      (c.align === "left" ? " rec-td--l" : "") +
                      (c.sticky ? " rec-td--sticky" : "") +
                      (c.strong ? " rec-td--strong" : "")
                    }
                  >
                    {renderCell(c, r)}
                  </td>
                ))}
                <td className="rec-td rec-td--spacer"></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// W/L 결과 뱃지
export function ResultBadge({ r }: { r: string }) {
  return (
    <span className={"rec-wl rec-wl--" + (r === "W" ? "w" : "l")}>{r}</span>
  );
}

// ── 상태 ──
export function RecEmpty({
  icon = "query_stats",
  title = "아직 기록이 없습니다",
  desc,
}: {
  icon?: string;
  title?: string;
  desc?: string;
}) {
  return (
    <div className="rec-state">
      <span className="ico material-symbols-outlined">{icon}</span>
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
    </div>
  );
}

export function RecLoading({ rows = 6, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="rec-skel">
      <div className="rec-skel__head" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rec-skel__row">
          {Array.from({ length: cols }).map((__, j) => (
            <div
              key={j}
              className="rec-skel__cell"
              style={{ animationDelay: i * 60 + j * 20 + "ms" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function RecUnclaimed({ name }: { name?: string }) {
  return (
    <div className="rec-unclaimed">
      <span className="ico material-symbols-outlined">link_off</span>
      <div>
        <div className="rec-unclaimed__t">개인 기록 연동 전</div>
        <div className="rec-unclaimed__s">
          {name ? name + " 선수는 " : ""}계정 연동(클레임) 후 개인 박스 기록이
          집계됩니다. 현재는 대회 내 이름만 표시됩니다.
        </div>
      </div>
    </div>
  );
}

// ── 표준 박스스코어 컬럼 팩토리 ──
// MIN · PTS · FGM · FGA · FG% · 3PM · 3PA · 3P% · FTM · FTA · FT% · OR · DR · REB · AST · STL · BLK · TO · PF · +/- · 평점
//   mode='raw' → 경기별(정수 원본) · mode='avg' → 집계 평균(소수 1자리) · mode='sum' → 집계 누적(sum_* 정수)
//   하위호환: 기존 호출(avg:boolean)도 그대로 받음 — avg:true→'avg', avg:false→'raw'. mode 지정 시 mode 우선.
//   미연동/무기록 값은 null → '–' 렌더 + 정렬 시 최하위.
//   평점(rating)은 매치 단위 데이터 부재 → 전부 null → '–' (PM 결재 Q1).
//   sum 모드: 일반 스탯은 sum_<별칭> 키(예: tov→sum_to)를 정수로 읽음. %·평점은 모드 무관 동일.
export type StatMode = "raw" | "avg" | "sum";

// 평균키 → 누적키 매핑 (BoxAvg.sum_* 와 1:1). tov 만 별칭(to) 주의.
const SUM_KEY: Record<string, string> = {
  min: "sum_min",
  pts: "sum_pts",
  fgm: "sum_fgm",
  fga: "sum_fga",
  tpm: "sum_tpm",
  tpa: "sum_tpa",
  ftm: "sum_ftm",
  fta: "sum_fta",
  oreb: "sum_oreb",
  dreb: "sum_dreb",
  reb: "sum_reb",
  ast: "sum_ast",
  stl: "sum_stl",
  blk: "sum_blk",
  tov: "sum_to",
  pf: "sum_pf",
  pm: "sum_pm",
};

export function statCols<T extends RecRow>(
  opts: { avg?: boolean; mode?: StatMode } = {},
): RecColumn<T>[] {
  // mode 명시 시 우선, 아니면 avg:boolean 으로 추론(하위호환).
  const mode: StatMode = opts.mode ?? (opts.avg ? "avg" : "raw");
  const isSum = mode === "sum";
  const isAvg = mode === "avg";
  const has = (v: unknown): v is number =>
    v != null && !(typeof v === "number" && isNaN(v));
  // sum 모드는 행에서 sum_<key> 우선, 없으면 평균키 폴백(방어). 그 외 모드는 평균/raw 키.
  const pick = (r: T, k: string): unknown => {
    if (isSum) {
      const sk = SUM_KEY[k];
      if (sk && has(r[sk])) return r[sk];
    }
    return r[k];
  };
  const f = (v: unknown): ReactNode =>
    !has(v) ? (
      <span className="rec-na">–</span>
    ) : isAvg ? (
      Number(v).toFixed(1)
    ) : (
      // raw·sum 은 정수 그대로(누적도 정수). 소수 들어오면 반올림 표기.
      Math.round(Number(v))
    );
  const sv = (k: string) => (r: T) => {
    const v = pick(r, k);
    return has(v) ? (v as number) : -1;
  };
  const n = (k: string, label: string): RecColumn<T> => ({
    key: k,
    label,
    align: "right",
    sortVal: sv(k),
    render: (r) => f(pick(r, k)),
  });
  // % 컬럼: 저장값(k) 없으면 makes(mk)/attempts(ak)로 산출
  const p = (k: string, label: string, mk: string, ak: string): RecColumn<T> => {
    const val = (r: T): number | null =>
      has(r[k])
        ? (r[k] as number)
        : has(r[mk]) && has(r[ak])
          ? (r[ak] as number)
            ? Math.round(((r[mk] as number) / (r[ak] as number)) * 1000) / 10
            : 0
          : null;
    return {
      key: k,
      label,
      align: "right",
      sortVal: (r) => {
        const v = val(r);
        return has(v) ? v : -1;
      },
      render: (r) => {
        const v = val(r);
        return !has(v) ? (
          <span className="rec-na">–</span>
        ) : v ? (
          Number(v).toFixed(1) + "%"
        ) : (
          "–"
        );
      },
    };
  };
  // REB: sum 모드면 sum_reb / sum_oreb+sum_dreb, 아니면 reb / oreb+dreb.
  const rebVal = (r: T): number | null => {
    const reb = pick(r, "reb");
    if (has(reb)) return reb as number;
    const or = pick(r, "oreb");
    const dr = pick(r, "dreb");
    return has(or) && has(dr)
      ? Math.round(((or as number) + (dr as number)) * 10) / 10
      : null;
  };
  return [
    n("min", "MIN"),
    {
      key: "pts",
      label: "PTS",
      align: "right",
      sortVal: sv("pts"),
      render: (r) => {
        const ptsV = pick(r, "pts");
        if (!has(ptsV)) return <span className="rec-na">–</span>;
        const pts = ptsV as number;
        // 하이라이트 임계값: 평균은 15, 정수(raw/sum 누적)는 20.
        const hi = isAvg ? pts >= 15 : pts >= 20;
        return <b className={hi ? "rec-hi" : ""}>{f(pts)}</b>;
      },
    },
    n("fgm", "FGM"),
    n("fga", "FGA"),
    p("fg_pct", "FG%", "fgm", "fga"),
    n("tpm", "3PM"),
    n("tpa", "3PA"),
    p("tp_pct", "3P%", "tpm", "tpa"),
    n("ftm", "FTM"),
    n("fta", "FTA"),
    p("ft_pct", "FT%", "ftm", "fta"),
    n("oreb", "OR"),
    n("dreb", "DR"),
    {
      key: "reb",
      label: "REB",
      align: "right",
      sortVal: (r) => {
        const v = rebVal(r);
        return has(v) ? v : -1;
      },
      render: (r) => {
        const v = rebVal(r);
        return has(v) ? f(v) : <span className="rec-na">–</span>;
      },
    },
    n("ast", "AST"),
    n("stl", "STL"),
    n("blk", "BLK"),
    n("tov", "TO"),
    n("pf", "PF"),
    {
      key: "pm",
      label: "+/-",
      align: "right",
      sortVal: sv("pm"),
      render: (r) => {
        const pmV = pick(r, "pm");
        if (!has(pmV)) return <span className="rec-na">–</span>;
        const pm = pmV as number;
        // 평균은 소수 1자리, raw/sum 누적은 정수 표기.
        const v = isAvg ? Number(pm).toFixed(1) : Math.round(pm);
        const sign = pm > 0 ? "+" : "";
        const cls =
          pm > 0 ? "rec-pm rec-pm--pos" : pm < 0 ? "rec-pm rec-pm--neg" : "rec-pm";
        return (
          <span className={cls}>
            {sign}
            {v}
          </span>
        );
      },
    },
    {
      key: "rating",
      label: "평점",
      align: "right",
      sortVal: sv("rating"),
      render: (r) =>
        !has(r.rating) ? (
          <span className="rec-na">–</span>
        ) : (
          <span className="rec-rating">{Number(r.rating).toFixed(1)}</span>
        ),
    },
  ];
}
