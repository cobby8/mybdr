"use client";

// ============================================================
// _divisions-editor.tsx — 종별·디비전 에디터 (생성/수정 마법사 공용)
//   정본 레거시: (admin)/.../new/wizard/_components/ct-divisions.tsx
//     (DivisionGenerator 4단계 + CategoryCard) 를 그린필드 admin-v2 kit 으로 재작성.
//   ⚠ 레거시 0 import — 코드는 읽어서 새로 작성. CSS/컴포넌트는 admin-v2 정본만.
//
//   ★ 왜 이렇게 짰나(연령 자동채움 계약):
//     - 대회 생성 POST 는 연령(출생연도/학년)을 직접 받지 않는다.
//       서버(createTournament)가 AdminCategory.ages + 디비전명 토큰을
//       computeAgeRangeForDivision 으로 매칭해 "생성 시점에" 자동 계산·저장한다.
//     - 따라서 연령이 자동으로 채워지려면 페이로드 구조가 정확해야 한다:
//         · 종별명(category) = AdminCategory.name (성별 접두 "남성/여성" 은 서버가 제거)
//         · 디비전명 안에 연령코드(예: "U12") 가 토큰으로 포함
//       → DivisionGenerator 가 정확히 이 구조(종별명 "남성 유청소년" / 디비전명 "i3 U12")로 생성.
//     - 이 에디터는 각 디비전 row 에 소속 종별명(category)을 태깅한다.
//       마법사 페이로드 빌더가 category 로 그룹핑 → categories={종별명:[디비전명]}.
//
//   종별 템플릿(AdminCategory) READ = GET /api/web/admin/categories (super_admin 전용 —
//     레거시와 동일 제약. 비-super 는 빈 목록 + "직접 추가" 폴백).
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { Btn, Icon, Badge, Modal } from "@/components/admin-v2";
import { adminFetch } from "@/lib/admin-v2/data";
import { FORMAT_LABEL, ALLOWED_FORMATS, type DivisionRow } from "./_create-wizard";

// ── 진행방식별 동적 settings 필드 — panels-core.jsx FMT_FIELDS 기반 ──────────
//   ※ ranking_format 옵션·"조별 팀수" 라벨은 백엔드 정합 보정(시안의 crossover/playoff/bracket 는
//     백엔드 미지원 — division-formats.ts 는 round_robin/single_elimination 만 허용).
//   각 항목 = [키, 라벨, 타입, 옵션|placeholder]
//     · "select" → 옵션 배열 [[값, 라벨], ...] (값이 number 면 number 로 저장)
//     · "num"    → placeholder 문자열(기본값 힌트)
type FmtField =
  | [string, string, "select", Array<[string | number, string]>]
  | [string, string, "num", string];

const FMT_FIELDS: Record<string, FmtField[]> = {
  single_elimination: [],
  round_robin: [["rounds", "리그 회전", "select", [[1, "단판"], [2, "홈앤어웨이"]]]],
  dual_tournament: [["advance_per_group", "조별 진출", "num", "2"]],
  group_stage_knockout: [
    ["group_size", "조별 팀수", "num", "4"],
    ["group_count", "조 개수", "num", "4"],
    ["advance_per_group", "조별 진출", "num", "2"],
  ],
  league_advancement: [
    ["group_count", "조 개수", "num", "2"],
    ["advance_per_group", "조별 진출", "num", "2"],
    ["linkage_pairs", "링크 대진 수", "num", "2"],
  ],
  group_stage_with_ranking: [
    ["group_size", "조별 팀수", "num", "4"],
    ["group_count", "조 개수", "num", "4"],
    ["ranking_format", "순위결정 방식", "select", [["round_robin", "풀리그"], ["single_elimination", "순위 토너먼트"]]],
  ],
};

// 내부 고유 id (레거시 uid 와 무관 — 순환 import 회피 위해 자체 생성기).
const genUid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// 그룹핑 키 — category 없는(직접 추가) 디비전은 단독 그룹.
const SOLO_KEY = "__solo__";
const groupKey = (d: DivisionRow) => (d.category && d.category.trim()) || SOLO_KEY;

// ── 종별 마스터(AdminCategory) 응답 타입 ──────────────────────────────────
//   adminFetch 가 snake→camel 변환 → sort_order 는 무시(정렬은 서버가 이미 수행).
type MasterCategory = { id: string; name: string; divisions: string[]; ages: string[] };

// =====================================================================
// DivisionGenerator — 성별/종별템플릿/디비전/연령코드 단계 + 장바구니 모달
//   ★ 장바구니 방식(2026-06-29 개편):
//     - 좌측 = 입력 단계 + "추가" 버튼. "추가" 클릭 시 현재 조합을 곧장
//       form.divisions 에 push(onGenerate)하되 모달은 닫지 않는다.
//       → 디비전/연령만 리셋(다음 종별 연속 입력), 성별/종별/진행방식은 유지.
//     - 우측 = 장바구니 패널. divisions(=form.divisions) 실시간 렌더 + x 삭제(onRemove).
//     - footer = 취소/완료 모두 닫기(추가는 이미 실시간 반영 → 별도 커밋 불필요).
//   onGenerate(rows): 곱집합으로 생성된 DivisionRow[] 를 부모에 append.
//   onRemove(id):     장바구니에서 해당 디비전 1개 제거.
// =====================================================================
function DivisionGenerator({
  open,
  onClose,
  onGenerate,
  onRemove,
  divisions,
  toast,
  defaultFee,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (rows: DivisionRow[]) => void;
  onRemove: (id: string) => void;
  divisions: DivisionRow[];
  toast: (msg: string) => void;
  defaultFee: number;
}) {
  // 종별 마스터 로드(모달 처음 열릴 때 1회). super_admin 아니면 403 → 빈 목록.
  const [master, setMaster] = useState<MasterCategory[]>([]);
  const [masterLoaded, setMasterLoaded] = useState(false);
  useEffect(() => {
    if (!open || masterLoaded) return;
    let alive = true;
    (async () => {
      try {
        // adminFetch GET(body 없음) — 응답 { categories:[{id,name,divisions,ages,...}] }(camel 변환).
        const res = await adminFetch<{ categories?: Array<{ id?: unknown; name?: unknown; divisions?: unknown; ages?: unknown }> }>(
          "/api/web/admin/categories"
        );
        const list = Array.isArray(res?.categories) ? res.categories : [];
        if (alive) {
          setMaster(
            list.map((c) => ({
              id: String(c.id ?? ""),
              name: typeof c.name === "string" ? c.name : "",
              divisions: Array.isArray(c.divisions) ? c.divisions.filter((x): x is string => typeof x === "string") : [],
              ages: Array.isArray(c.ages) ? c.ages.filter((x): x is string => typeof x === "string") : [],
            }))
          );
        }
      } catch {
        // 권한 없음/네트워크 실패 → 빈 목록(아래 안내). "직접 추가"로 폴백 가능.
      } finally {
        if (alive) setMasterLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, masterLoaded]);

  // 모달 선택 상태 — 열릴 때마다 초기화.
  const [gender, setGender] = useState("남성");
  const [tplId, setTplId] = useState("");
  const [divs, setDivs] = useState<string[]>([]);
  const [ages, setAges] = useState<string[]>([]);
  // 진행방식 — 생성될 디비전에 일괄 적용(이후 카드에서 개별 변경). 정본 CategoryAddModal 1:1.
  const [fmt, setFmt] = useState("single_elimination");
  useEffect(() => {
    if (open) {
      setGender("남성");
      setTplId("");
      setDivs([]);
      setAges([]);
      setFmt("single_elimination");
    }
  }, [open]);

  const tpl = master.find((c) => c.id === tplId);
  const hasAges = !!(tpl && tpl.ages.length > 0);
  const toggle = (arr: string[], setter: (v: string[]) => void, v: string) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  // 여성부는 디비전 뒤에 w 접미(정본 1:1) — 예: D4 → D4w.
  const wfix = (dn: string) => (gender === "여성" ? `${dn}w` : dn);
  const totalDivs = hasAges && ages.length ? divs.length * ages.length : divs.length;
  // 미리보기용 디비전명 목록(정본 cat-preview "생성됨 (N): ...").
  const combos: string[] = [];
  if (tpl) {
    divs.forEach((dn) => {
      if (hasAges && ages.length) ages.forEach((ag) => combos.push(`${wfix(dn)} ${ag}`));
      else combos.push(wfix(dn));
    });
  }

  // 추가 — 디비전×연령 곱집합을 장바구니(form.divisions)에 push. category = "${성별} ${종별명}".
  //   ★ 장바구니 방식: 모달을 닫지 않고 디비전/연령만 리셋(성별/종별/진행방식 유지 → 연속 추가 편의).
  const gen = () => {
    if (!tpl || !divs.length) return;
    const category = `${gender} ${tpl.name}`.trim();
    const make = (name: string): DivisionRow => ({
      id: genUid("d"),
      label: name,
      cap: 16, // 정본 DEFAULT_CAP
      fee: defaultFee,
      category,
      // 선택한 진행방식을 일괄 적용(settings 는 빈 객체 — 카드 FMT 필드 기본값 placeholder 적용).
      format: fmt,
      settings: {},
    });
    const rows: DivisionRow[] = [];
    if (hasAges && ages.length) {
      divs.forEach((dn) => ages.forEach((ag) => rows.push(make(`${wfix(dn)} ${ag}`))));
    } else {
      divs.forEach((dn) => rows.push(make(wfix(dn))));
    }
    // 중복 방지 — 이미 장바구니에 같은 디비전명(label)이 있으면 skip.
    const existing = new Set(divisions.map((d) => d.label));
    const fresh = rows.filter((r) => !existing.has(r.label));
    const skipped = rows.length - fresh.length;
    if (fresh.length === 0) {
      // 전부 중복 → push 없이 안내만.
      toast(`이미 추가된 디비전입니다 (${rows.length}개 중복)`);
      return;
    }
    onGenerate(fresh);
    toast(
      skipped > 0
        ? `'${category}' 디비전 ${fresh.length}개 추가 (${skipped}개 중복 제외)`
        : `'${category}' 종별 · 디비전 ${fresh.length}개 추가`
    );
    // 다음 종별 입력 준비 — 디비전/연령만 초기화. 성별·종별 템플릿·진행방식은 유지.
    setDivs([]);
    setAges([]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      // 2단 레이아웃(좌 입력 / 우 장바구니)이라 폭 확대. 모바일은 CSS 가 세로 스택.
      maxWidth={880}
      title="종별 템플릿으로 추가"
      sub="성별·종별 템플릿을 고르고 디비전을 선택해 ‘추가’하면 우측 목록에 모입니다. 여러 종별을 연속으로 추가할 수 있습니다."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            취소
          </Btn>
          {/* 추가는 이미 실시간 반영 → 완료 = 단순 닫기 */}
          <Btn onClick={onClose} icon="check" style={{ flex: 2 }}>
            완료
          </Btn>
        </>
      }
    >
      {/* 2단 — 좌측 입력 컬럼 / 우측 장바구니 패널(720px 이하 세로 스택) */}
      <div className="cat-modal--cart">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1단계 · 성별 */}
        <div>
          <div className="ts-field__label">1단계 · 성별</div>
          <div className="ts-segment">
            {["남성", "여성"].map((g) => (
              <button key={g} type="button" className="ts-segment__btn" data-active={gender === g ? "true" : "false"} onClick={() => setGender(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 2단계 · 종별 템플릿(AdminCategory 실연동) */}
        <div>
          <div className="ts-field__label">2단계 · 종별 템플릿</div>
          {!masterLoaded ? (
            <div className="ct-emptybox">종별 마스터를 불러오는 중…</div>
          ) : master.length === 0 ? (
            <div className="ct-emptybox">등록된 종별 마스터가 없거나 권한이 없습니다. 아래 “직접 추가”로 종별을 입력하세요.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {master.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="ts-chip"
                  data-active={tplId === c.id ? "true" : "false"}
                  onClick={() => {
                    setTplId(c.id);
                    setDivs([]);
                    setAges([]);
                  }}
                >
                  {c.name}
                  {c.ages.length ? <span style={{ fontSize: 11, color: "var(--ink-dim)", marginLeft: 4 }}>연령</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3단계 · 디비전 */}
        <div style={{ opacity: tpl ? 1 : 0.4, pointerEvents: tpl ? "auto" : "none" }}>
          <div className="ts-field__label">
            3단계 · 디비전 {divs.length > 0 && <span style={{ color: "var(--primary)" }}>({divs.length})</span>}
          </div>
          {tpl ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tpl.divisions.map((dn) => (
                <button key={dn} type="button" className="ts-chip" data-active={divs.includes(dn) ? "true" : "false"} onClick={() => toggle(divs, setDivs, dn)}>
                  {divs.includes(dn) && <Icon name="check" size={13} />}
                  {wfix(dn)}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: 18, textAlign: "center", color: "var(--ink-dim)", fontSize: 13, background: "var(--grey-50)", borderRadius: 12 }}>
              종별 템플릿을 먼저 선택하세요
            </div>
          )}
          {tpl && gender === "여성" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--primary)", marginTop: 9 }}>
              <Icon name="info" size={14} color="var(--primary)" />
              여성부는 디비전 뒤에 <b style={{ margin: "0 2px" }}>w</b>가 붙습니다 (예: D4 → D4w).
            </div>
          )}
        </div>

        {/* 4단계 · 연령(해당 종별만) */}
        {hasAges && tpl && (
          <div>
            <div className="ts-field__label">
              4단계 · 연령 <span style={{ color: "var(--ink-mute)", fontWeight: 600 }}>(선택)</span>{" "}
              {ages.length > 0 && <span style={{ color: "var(--primary)" }}>({ages.length})</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {tpl.ages.map((ag) => (
                <button key={ag} type="button" className="ts-chip" data-active={ages.includes(ag) ? "true" : "false"} onClick={() => toggle(ages, setAges, ag)}>
                  {ages.includes(ag) && <Icon name="check" size={12} />}
                  {ag}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginTop: 9 }}>
              {ages.length ? (
                <>
                  디비전 {divs.length} × 연령 {ages.length} = <b style={{ color: "var(--ink)" }}>{totalDivs}개</b> 디비전 생성. 연령 제한(출생연도/학년)은 대회 생성 시 자동 적용됩니다.
                </>
              ) : (
                "연령을 선택하면 디비전별로 연령 디비전이 생성됩니다. 미선택 시 디비전만 생성됩니다."
              )}
            </div>
          </div>
        )}

        {/* 진행방식 단계 — 선택한 디비전에 일괄 적용(이후 카드에서 개별 변경). 정본 5/4단계 1:1 */}
        <div style={{ opacity: tpl ? 1 : 0.4, pointerEvents: tpl ? "auto" : "none" }}>
          <div className="ts-field__label">
            {hasAges ? "5" : "4"}단계 · 진행방식{" "}
            <span style={{ color: "var(--ink-mute)", fontWeight: 600 }}>선택한 디비전에 일괄 적용 · 이후 카드에서 개별 변경</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALLOWED_FORMATS.map((f) => (
              <button key={f} type="button" className="ts-chip" data-active={fmt === f ? "true" : "false"} onClick={() => setFmt(f)}>
                {fmt === f && <Icon name="check" size={13} />}
                {FORMAT_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {/* 생성 미리보기 — 정본 cat-preview */}
        {combos.length > 0 && (
          <div className="cat-preview">
            <Icon name="layout-grid" size={15} color="var(--primary)" />
            <span>생성됨 ({combos.length}): {combos.join(", ")}</span>
          </div>
        )}

        {/* 추가 버튼 — 현재 조합을 장바구니에 push(모달 유지) */}
        <Btn onClick={gen} disabled={!tpl || !divs.length} icon="plus" block>
          추가 {totalDivs ? `(${totalDivs})` : ""}
        </Btn>
      </div>

      {/* 우측 — 장바구니 패널(form.divisions 실시간 렌더) */}
      <aside className="cat-cart">
        <div className="cat-cart__head">
          <Icon name="layout-grid" size={15} color="var(--ink-mute)" />
          <span>추가한 종별</span>
          <span className="cat-cart__count">{divisions.length}</span>
        </div>
        {divisions.length === 0 ? (
          <div className="cat-cart__empty">아직 추가된 종별이 없습니다</div>
        ) : (
          <div className="cat-cart__list">
            {divisions.map((d) => (
              <div key={d.id} className="cat-cart__item">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="cat-cart__nm">{d.label || "(디비전명 미입력)"}</div>
                  {/* 진행방식 라벨 — 미지정(빈값/null)은 대회 방식 폴백 표시 */}
                  <div className="cat-cart__meta">{FORMAT_LABEL[d.format ?? ""] ?? "대회 방식"}</div>
                </div>
                <button type="button" className="ct-iconbtn" title="삭제" aria-label="삭제" onClick={() => onRemove(d.id)}>
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>
      </div>
    </Modal>
  );
}

// =====================================================================
// DivisionsEditor — 종별 그룹 카드 + 추가 버튼(직접/템플릿). controlled.
//   value(divisions) 를 category 로 그룹핑해 표시. 빈 category = 단독 디비전.
// =====================================================================
export function DivisionsEditor({
  divisions,
  onChange,
  defaultFee,
  toast,
}: {
  divisions: DivisionRow[];
  onChange: (next: DivisionRow[]) => void;
  defaultFee: number;
  toast: (msg: string) => void;
}) {
  const [genOpen, setGenOpen] = useState(false);
  // 인라인 편집 중인 디비전 id(정본 editCode 토글). null = 전부 읽기상태.
  const [editCode, setEditCode] = useState<string | null>(null);

  // category 기준 그룹핑(입력 순서 보존).
  const groups = useMemo(() => {
    const map = new Map<string, DivisionRow[]>();
    for (const d of divisions) {
      const k = groupKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(d);
    }
    return Array.from(map.entries()); // [key, rows][]
  }, [divisions]);

  // ── mutators(불변 갱신) ──
  const patchDiv = (id: string, p: Partial<DivisionRow>) => onChange(divisions.map((d) => (d.id === id ? { ...d, ...p } : d)));
  // settings 부분 병합(정본 patchSettings). 기존 settings 유지 + 키 덮어쓰기.
  const patchSettings = (id: string, p: Record<string, unknown>) =>
    onChange(divisions.map((d) => (d.id === id ? { ...d, settings: { ...(d.settings ?? {}), ...p } } : d)));
  const removeDiv = (id: string) => {
    onChange(divisions.filter((d) => d.id !== id));
    setEditCode((c) => (c === id ? null : c));
  };
  const removeGroup = (key: string) => onChange(divisions.filter((d) => groupKey(d) !== key));
  // 직접 추가 — 빈 종별 디비전 1개(category 없음 = 자기 자신이 종별). 추가 즉시 편집상태 진입.
  const addManual = () => {
    const id = genUid("d");
    onChange([...divisions, { id, label: "", cap: 16, fee: defaultFee, category: undefined, format: "single_elimination", settings: {} }]);
    setEditCode(id);
  };
  const addGenerated = (rows: DivisionRow[]) => onChange([...divisions, ...rows]);

  // 진행방식별 settings 입력 1칸 렌더(정본 FMT_FIELDS 매핑 1:1).
  const renderSettingsField = (d: DivisionRow, field: FmtField) => {
    const [k, lab, type] = field;
    if (type === "select") {
      const opt = field[3]; // 옵션 배열 [[값,라벨],...]
      const def = opt[0][0];
      const cur = d.settings?.[k] ?? def;
      return (
        <label key={k} className="ts-field" style={{ margin: 0 }}>
          <span className="ts-field__label">{lab}</span>
          <select
            className="ts-select"
            value={String(cur)}
            onChange={(e) => patchSettings(d.id, { [k]: typeof def === "number" ? +e.target.value : e.target.value })}
          >
            {opt.map(([ov, ol]) => (
              <option key={String(ov)} value={String(ov)}>{ol}</option>
            ))}
          </select>
        </label>
      );
    }
    // num — placeholder = 기본값 힌트. 빈 값은 undefined 저장(서버 폴백/기본값 적용).
    const ph = field[3];
    return (
      <label key={k} className="ts-field" style={{ margin: 0 }}>
        <span className="ts-field__label">{lab}</span>
        <input
          className="ts-input"
          type="number"
          value={typeof d.settings?.[k] === "number" ? (d.settings[k] as number) : ""}
          placeholder={ph}
          onChange={(e) => patchSettings(d.id, { [k]: e.target.value === "" ? undefined : +e.target.value })}
        />
      </label>
    );
  };

  // 단일 디비전 카드 렌더(공용) — 읽기/편집 토글 + 종별별 진행방식. 정본 DivisionsPanel 카드 1:1.
  const DivisionCard = (d: DivisionRow, index: number) => {
    const editing = editCode === d.id;
    const fmtFields = FMT_FIELDS[d.format ?? ""] ?? [];
    return (
      <article key={d.id} className="ts-card ts-card--flat" style={editing ? { boxShadow: "0 0 0 2px var(--primary)" } : undefined}>
        {/* 상단 — 라벨(읽기:텍스트 / 편집:input) + 연필/체크·삭제 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0, flex: "1 1 160px" }}>
            <span className="ts-field__label">디비전 {index + 1}</span>
            {editing ? (
              <input
                className="ts-input"
                style={{ marginTop: 4 }}
                value={d.label}
                onChange={(e) => patchDiv(d.id, { label: e.target.value })}
                placeholder="예: 남성 일반부 / i3 U12"
              />
            ) : (
              <p style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.label || <span style={{ color: "var(--ink-dim)" }}>(디비전명 미입력)</span>}
              </p>
            )}
            {!editing && (
              <p style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 4 }}>
                참가비 {(d.fee || 0).toLocaleString()}원 · 정원 {d.cap ?? "—"}
              </p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}>
            <button
              type="button"
              className="ct-iconbtn"
              title={editing ? "완료" : "수정"}
              onClick={() => setEditCode(editing ? null : d.id)}
              style={editing ? { background: "var(--primary)", color: "#fff" } : undefined}
            >
              <Icon name={editing ? "check" : "pencil"} size={15} />
            </button>
            <button type="button" className="ct-iconbtn" title="삭제" onClick={() => removeDiv(d.id)}>
              <Icon name="trash-2" size={15} />
            </button>
          </div>
        </div>

        {/* 편집상태 — 정원/참가비 input */}
        {editing && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            <label className="ts-field" style={{ margin: 0 }}>
              <span className="ts-field__label">정원(팀)</span>
              <input
                className="ts-input"
                type="number"
                min={0}
                value={d.cap ?? ""}
                placeholder="제한 없음"
                onChange={(e) => patchDiv(d.id, { cap: e.target.value === "" ? null : +e.target.value })}
              />
            </label>
            <label className="ts-field" style={{ margin: 0 }}>
              <span className="ts-field__label">참가비</span>
              <input className="ts-input" type="number" min={0} step={1000} value={d.fee} onChange={(e) => patchDiv(d.id, { fee: +e.target.value })} />
            </label>
          </div>
        )}

        {/* 진행 방식 — 항상 노출(정본). 빈 값 = 대회 방식 폴백 */}
        <div style={{ marginTop: 12 }}>
          <span className="ts-field__label">진행 방식</span>
          <select className="ts-select" value={d.format ?? ""} onChange={(e) => patchDiv(d.id, { format: e.target.value || null })}>
            <option value="">대회 방식 사용</option>
            {ALLOWED_FORMATS.map((f) => (
              <option key={f} value={f}>{FORMAT_LABEL[f]}</option>
            ))}
          </select>
        </div>

        {/* 진행방식별 세부설정 — FMT_FIELDS 매핑(정본 ct-div-edit3) */}
        {fmtFields.length > 0 && (
          <div
            className="ct-div-edit3"
            style={{ display: "grid", gridTemplateColumns: fmtFields.length >= 3 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8, marginTop: 10 }}
          >
            {fmtFields.map((field) => renderSettingsField(d, field))}
          </div>
        )}
      </article>
    );
  };

  return (
    <div>
      {/* 헤더 — 추가 버튼(직접 / 템플릿) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span className="ct-group-title ct-group-title--flush">종별 · 디비전</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {divisions.length === 0 && <span className="ct-pill" data-tone="err">1개 이상 필수</span>}
          <Btn size="sm" variant="secondary" icon="plus" onClick={addManual}>
            직접 추가
          </Btn>
          <Btn size="sm" icon="layout-grid" onClick={() => setGenOpen(true)}>
            템플릿 추가
          </Btn>
        </div>
      </div>

      {/* 본문 — 빈 상태 또는 그룹 카드 */}
      {divisions.length === 0 ? (
        <div className="ct-emptybox ct-emptybox--tall">
          <Icon name="layout-grid" size={40} color="var(--ink-dim)" />
          <b style={{ color: "var(--ink)" }}>등록된 종별이 없습니다</b>
          <span>
            <b style={{ color: "var(--ink-soft)" }}>템플릿 추가</b>로 종별·연령을 선택하거나 <b style={{ color: "var(--ink-soft)" }}>직접 추가</b>로 디비전을 입력하세요.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {groups.map(([key, rows]) =>
            key === SOLO_KEY ? (
              // 단독 디비전(category 없음) — 그룹 헤더 없이 카드만.
              <div key={key} className="ct-divgrid">
                {rows.map((d, i) => DivisionCard(d, i))}
              </div>
            ) : (
              // 종별 그룹(템플릿 생성) — 종별명 헤더 + 디비전 카드.
              <div key={key} style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", background: "var(--card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", background: "var(--grey-50)", borderBottom: "1px solid var(--border)" }}>
                  <Icon name="layout-grid" size={16} color="var(--ink-mute)" />
                  <span style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</span>
                  <Badge tone="grey">{rows.length}디비전</Badge>
                  <button type="button" className="ct-iconbtn" onClick={() => removeGroup(key)} aria-label="종별 삭제">
                    <Icon name="trash-2" size={15} />
                  </button>
                </div>
                <div className="ct-divgrid" style={{ padding: 12 }}>
                  {rows.map((d, i) => DivisionCard(d, i))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* 템플릿 생성 모달(장바구니 방식) — divisions/onRemove 로 우측 패널 실시간 연동 */}
      <DivisionGenerator
        open={genOpen}
        onClose={() => setGenOpen(false)}
        onGenerate={addGenerated}
        onRemove={removeDiv}
        divisions={divisions}
        toast={toast}
        defaultFee={defaultFee}
      />
    </div>
  );
}
