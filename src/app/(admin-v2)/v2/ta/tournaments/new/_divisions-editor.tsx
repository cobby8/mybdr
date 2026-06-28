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
import type { DivisionRow } from "./_create-wizard";

// 내부 고유 id (레거시 uid 와 무관 — 순환 import 회피 위해 자체 생성기).
const genUid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// 그룹핑 키 — category 없는(직접 추가) 디비전은 단독 그룹.
const SOLO_KEY = "__solo__";
const groupKey = (d: DivisionRow) => (d.category && d.category.trim()) || SOLO_KEY;

// ── 종별 마스터(AdminCategory) 응답 타입 ──────────────────────────────────
//   adminFetch 가 snake→camel 변환 → sort_order 는 무시(정렬은 서버가 이미 수행).
type MasterCategory = { id: string; name: string; divisions: string[]; ages: string[] };

// =====================================================================
// DivisionGenerator — 성별/종별템플릿/디비전/연령코드 4단계 모달
//   onGenerate(rows): 곱집합으로 생성된 DivisionRow[] 를 부모에 append.
// =====================================================================
function DivisionGenerator({
  open,
  onClose,
  onGenerate,
  toast,
  defaultFee,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (rows: DivisionRow[]) => void;
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
  useEffect(() => {
    if (open) {
      setGender("남성");
      setTplId("");
      setDivs([]);
      setAges([]);
    }
  }, [open]);

  const tpl = master.find((c) => c.id === tplId);
  const hasAges = !!(tpl && tpl.ages.length > 0);
  const toggle = (arr: string[], setter: (v: string[]) => void, v: string) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  // 여성부는 디비전 뒤에 w 접미(정본 1:1) — 예: D4 → D4w.
  const wfix = (dn: string) => (gender === "여성" ? `${dn}w` : dn);
  const totalDivs = hasAges && ages.length ? divs.length * ages.length : divs.length;

  // 생성 — 디비전×연령 곱집합. category = "${성별} ${종별명}"(서버가 성별 접두 제거 후 AdminCategory 매칭).
  const gen = () => {
    if (!tpl || !divs.length) return;
    const category = `${gender} ${tpl.name}`.trim();
    const make = (name: string): DivisionRow => ({
      id: genUid("d"),
      label: name,
      cap: 16, // 정본 DEFAULT_CAP
      fee: defaultFee,
      category,
    });
    const rows: DivisionRow[] = [];
    if (hasAges && ages.length) {
      divs.forEach((dn) => ages.forEach((ag) => rows.push(make(`${wfix(dn)} ${ag}`))));
    } else {
      divs.forEach((dn) => rows.push(make(wfix(dn))));
    }
    onGenerate(rows);
    toast(`'${category}' 종별 · 디비전 ${rows.length}개 추가`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="종별 템플릿으로 추가"
      sub="성별·종별 템플릿을 고르고 디비전을 선택하면 종별이 생성됩니다. 유청소년 등은 연령도 함께 선택하면 연령 제한이 자동 적용됩니다."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            취소
          </Btn>
          <Btn onClick={gen} disabled={!tpl || !divs.length} icon="plus" style={{ flex: 2 }}>
            종별 생성 {totalDivs ? `(${totalDivs})` : ""}
          </Btn>
        </>
      }
    >
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
  const removeDiv = (id: string) => onChange(divisions.filter((d) => d.id !== id));
  const removeGroup = (key: string) => onChange(divisions.filter((d) => groupKey(d) !== key));
  // 직접 추가 — 빈 종별 디비전 1개(category 없음 = 자기 자신이 종별).
  const addManual = () => onChange([...divisions, { id: genUid("d"), label: "", cap: 16, fee: defaultFee, category: undefined }]);
  const addGenerated = (rows: DivisionRow[]) => onChange([...divisions, ...rows]);

  // 단일 디비전 카드 렌더(공용).
  const DivisionCard = (d: DivisionRow, index: number) => (
    <article key={d.id} className="ts-card ts-card--flat">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span className="ts-field__label">디비전 {index + 1}</span>
        <button type="button" className="ct-iconbtn" title="삭제" onClick={() => removeDiv(d.id)}>
          <Icon name="trash-2" size={15} />
        </button>
      </div>
      <label className="ts-field" style={{ margin: 0 }}>
        <span className="ts-field__label">디비전명</span>
        <input className="ts-input" value={d.label} onChange={(e) => patchDiv(d.id, { label: e.target.value })} placeholder="예: 남성 일반부 / i3 U12" />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
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
    </article>
  );

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

      {/* 템플릿 생성 모달 */}
      <DivisionGenerator open={genOpen} onClose={() => setGenOpen(false)} onGenerate={addGenerated} toast={toast} defaultFee={defaultFee} />
    </div>
  );
}
