"use client";

// =====================================================================
// ct-divisions.tsx — 종별·디비전 제너레이터 (controlled · Phase 4 B-3)
//   박제 source: _deliver_CreateTournament/create-tournament.jsx
//     (CategoryCard / DivisionGenerator)
//
//   ⚠ 왜 이렇게 짰나:
//   - controlled component: 부모가 CategoryItem[] 을 소유하고 value/onChange 로만 갱신.
//   - 종별 마스터는 시안 mockup CATEGORY_MASTER 대신 운영 /api/web/admin/categories
//     GET 실연동(B-1 admin_categories 테이블). 응답은 snake_case(sort_order 등).
//   - DivisionGenerator 모달: 성별·종별 템플릿·디비전·연령 선택 → 디비전 자동생성.
//   - 디비전별 cap(정원)·fee(참가비)·dateId(경기날짜)·courtId(코트) 입력.
//   - venues / scheduleDates 는 read-only select 옵션(부모 좌측 폼이 소유).
//   - .ct-* 재사용 클래스(ct-headicon/ct-iconbtn/ct-reqtag/ct-banner/ct-emptybox)만
//     클래스명 참조. 우측 전용(ct-cat/ct-dvn 등)은 inline var(--*) 토큰.
//   - 하드코딩 hex 금지(유니폼 팔레트 외) → 보라톤도 토큰(var(--primary))으로 대체.
// =====================================================================

import React from "react";
import { Icon, Btn, Badge, Modal } from "@/components/admin-toss";

// ── state 계약 (필수 준수 · 지시서) ──────────────────────────────────────
export type DivisionItem = {
  id: string;
  name: string;
  cap?: number; // 정원(팀)
  fee?: number; // 참가비(원)
  dateId?: string; // scheduleDates[].id 참조
  courtId?: string; // court_ids 항목(`${venueId}_c${idx}`) 참조
};
export type CategoryItem = {
  id: string;
  name: string;
  divisions: DivisionItem[];
};

// ── read-only 옵션 타입 (부모 좌측 폼 소유 — venues/scheduleDates) ────────
export type ScheduleDate = {
  id: string;
  date: string; // YYYY-MM-DD
  court_ids: string[]; // 이 날짜에 배정된 코트 id 목록
};
export type Venue = {
  id: string;
  name: string;
  region: string;
  courtCount: number;
  naming: "num" | "alpha";
};

// ── 종별 마스터 응답 타입 (GET /api/web/admin/categories · snake) ─────────
type MasterCategory = {
  id: string;
  name: string;
  divisions: string[];
  ages: string[];
  sort_order: number;
};

// 디비전 기본값 (시안 tnDivision 디폴트)
//   ⚠ 진행방식(method)은 state 계약(DivisionItem)에 없음 → 본 폼은 정원/참가비/날짜/코트만.
//      진행방식은 DivisionRule 다운스트림(대회 상세)에서 설정. 계약 우선(지시서).
const DEFAULT_CAP = 16;
const DEFAULT_FEE = 60000;

// ── 유틸 ──────────────────────────────────────────────────────────────────
const uid = (p: string) => `${p}${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

// 코트 풀 펼치기 — venues → court 옵션 목록(`${venueId}_c${idx}`)
type Court = { id: string; full: string; venueId: string };
function allCourts(venues: Venue[]): Court[] {
  const out: Court[] = [];
  venues.forEach((v) => {
    for (let i = 0; i < (v.courtCount || 0); i++) {
      const suffix = v.naming === "alpha" ? String.fromCharCode(65 + i) : String(i + 1);
      out.push({ id: `${v.id}_c${i}`, full: `${v.name} ${suffix}코트`, venueId: v.id });
    }
  });
  return out;
}
// 날짜 라벨 (M.D (요일))
function fmtDate(s: string): string {
  const dt = new Date(s + "T00:00:00");
  if (Number.isNaN(dt.getTime())) return s;
  const wk = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
  return `${dt.getMonth() + 1}.${dt.getDate()} (${wk})`;
}

// =====================================================================
// 종별 카드 (Generator 산출 · 디비전별 정원/참가비/날짜/코트 매칭)
// =====================================================================
function CategoryCard({
  cat,
  scheduleDates,
  courts,
  onUpdateDiv,
  onRemoveDiv,
  onRemoveCat,
}: {
  cat: CategoryItem;
  scheduleDates: ScheduleDate[];
  courts: Court[];
  onUpdateDiv: (divId: string, patch: Partial<DivisionItem>) => void;
  onRemoveDiv: (divId: string) => void;
  onRemoveCat: () => void;
}) {
  const canMatch = scheduleDates.length > 0 || courts.length > 0;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", background: "var(--card)" }}>
      {/* 카드 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", background: "var(--grey-50)", borderBottom: "1px solid var(--border)" }}>
        <Icon name="layout-grid" size={16} color="var(--ink-mute)" />
        <span style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
        <Badge tone="grey">{cat.divisions.length}디비전</Badge>
        <button type="button" className="ct-iconbtn" onClick={onRemoveCat} aria-label="종별 삭제">
          <Icon name="trash-2" size={15} />
        </button>
      </div>
      {/* 디비전 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
        {cat.divisions.map((dv) => (
          <div key={dv.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 11, background: "var(--grey-50)" }}>
            {/* 디비전명 + 삭제 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                value={dv.name}
                onChange={(e) => onUpdateDiv(dv.id, { name: e.target.value })}
                aria-label="디비전명"
                onKeyDown={(e) => {
                  // 한글 IME 가드 (디비전명 한글 입력 가능)
                  if (e.nativeEvent.isComposing) return;
                }}
                style={{ flex: 1, minWidth: 0, border: "1px solid var(--border-strong)", borderRadius: 9, padding: "8px 10px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)", background: "#fff", fontFamily: "var(--ff)", outline: "none" }}
              />
              <button type="button" className="ct-iconbtn" onClick={() => onRemoveDiv(dv.id)} aria-label="디비전 삭제">
                <Icon name="x" size={15} />
              </button>
            </div>
            {/* 정원 · 참가비 */}
            <div style={{ display: "flex", gap: 10, marginTop: 9 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}>
                <span>정원</span>
                <input
                  type="number"
                  min={0}
                  value={dv.cap ?? 0}
                  onChange={(e) => onUpdateDiv(dv.id, { cap: +e.target.value || 0 })}
                  style={{ flex: 1, minWidth: 0, border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 8px", fontSize: 13, fontFamily: "var(--ff-mono)", color: "var(--ink)", background: "#fff", textAlign: "right", outline: "none" }}
                />
                <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>팀</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}>
                <span>참가비</span>
                <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>₩</span>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={dv.fee ?? 0}
                  onChange={(e) => onUpdateDiv(dv.id, { fee: +e.target.value || 0 })}
                  style={{ flex: 1, minWidth: 0, border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 8px", fontSize: 13, fontFamily: "var(--ff-mono)", color: "var(--ink)", background: "#fff", textAlign: "right", outline: "none" }}
                />
              </label>
            </div>
            {/* 경기 날짜 · 코트 매칭 */}
            {canMatch ? (
              <div style={{ display: "flex", gap: 10, marginTop: 9 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 9, background: "#fff" }}>
                  <Icon name="calendar" size={14} color="var(--ink-mute)" />
                  <select
                    value={dv.dateId ?? ""}
                    onChange={(e) => onUpdateDiv(dv.id, { dateId: e.target.value || undefined, courtId: undefined })}
                    style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--ff)", outline: "none", cursor: "pointer" }}
                  >
                    <option value="">경기 날짜</option>
                    {scheduleDates.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {fmtDate(dt.date)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 9, background: "#fff" }}>
                  <Icon name="map-pin" size={14} color="var(--ink-mute)" />
                  <select
                    value={dv.courtId ?? ""}
                    onChange={(e) => onUpdateDiv(dv.id, { courtId: e.target.value || undefined })}
                    style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--ff)", outline: "none", cursor: "pointer" }}
                  >
                    <option value="">코트</option>
                    {(() => {
                      // 선택된 날짜에 배정된 코트만 → 없으면 전체 코트 풀
                      const sd = scheduleDates.find((dt) => dt.id === dv.dateId);
                      const opts = sd && sd.court_ids && sd.court_ids.length ? courts.filter((c) => sd.court_ids.includes(c.id)) : courts;
                      return opts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full}
                        </option>
                      ));
                    })()}
                  </select>
                </label>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, fontSize: 11.5, color: "var(--ink-mute)" }}>
                <Icon name="info" size={13} />
                <span>
                  좌측 <b style={{ color: "var(--ink-soft)" }}>대회 일정·장소</b>를 추가하면 디비전별 경기날짜·코트를 매칭할 수 있습니다
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// DivisionGenerator (종별 마스터 연동 · 연령 축) — 모달
// =====================================================================
function DivisionGenerator({
  open,
  master,
  masterLoaded,
  onClose,
  onGenerate,
  toast,
}: {
  open: boolean;
  master: MasterCategory[];
  masterLoaded: boolean;
  onClose: () => void;
  onGenerate: (cat: CategoryItem) => void;
  toast: (msg: string) => void;
}) {
  const [gender, setGender] = React.useState("남성");
  const [tplId, setTplId] = React.useState("");
  const [divs, setDivs] = React.useState<string[]>([]);
  const [ages, setAges] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (open) {
      setGender("남성");
      setTplId("");
      setDivs([]);
      setAges([]);
    }
  }, [open]);

  const tpl = master.find((c) => c.id === tplId);
  const hasAges = !!(tpl && tpl.ages && tpl.ages.length > 0);
  const toggle = (arr: string[], setter: (v: string[]) => void, v: string) => setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  // 여성부는 디비전 뒤에 w 접미
  const wfix = (dn: string) => (gender === "여성" ? `${dn}w` : dn);

  const totalDivs = hasAges && ages.length ? divs.length * ages.length : divs.length;

  const gen = () => {
    if (!tpl || !divs.length) return;
    let divisions: DivisionItem[];
    if (hasAges && ages.length) {
      // 디비전 × 연령 곱집합
      divisions = [];
      divs.forEach((dn) => ages.forEach((ag) => divisions.push({ id: uid("d"), name: `${wfix(dn)} ${ag}`, cap: DEFAULT_CAP, fee: DEFAULT_FEE })));
    } else {
      divisions = divs.map((dn) => ({ id: uid("d"), name: wfix(dn), cap: DEFAULT_CAP, fee: DEFAULT_FEE }));
    }
    const cat: CategoryItem = { id: uid("c"), name: `${gender} ${tpl.name}`.trim(), divisions };
    onGenerate(cat);
    toast(`'${cat.name}' 종별 생성 · 디비전 ${divisions.length}개`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 종별 추가"
      sub="성별·종별 템플릿을 고르고 디비전을 선택하면 종별이 생성됩니다. 유청소년 등은 연령도 함께 선택합니다."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            취소
          </Btn>
          <Btn onClick={gen} disabled={!tpl || !divs.length} icon="plus" style={{ flex: 2, opacity: tpl && divs.length ? 1 : 0.5 }}>
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

        {/* 2단계 · 종별 템플릿 (admin_categories 실연동) */}
        <div>
          <div className="ts-field__label">2단계 · 종별 템플릿</div>
          {!masterLoaded ? (
            <div className="ct-emptybox">종별 마스터를 불러오는 중…</div>
          ) : master.length === 0 ? (
            <div className="ct-emptybox">등록된 종별 마스터가 없습니다. 설정 · 종별 관리에서 먼저 추가하세요.</div>
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
                  {c.ages && c.ages.length ? <span style={{ fontSize: 11, color: "var(--ink-dim)", marginLeft: 4 }}>연령</span> : null}
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
                  {gender === "여성" ? wfix(dn) : dn}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: 18, textAlign: "center", color: "var(--ink-dim)", fontSize: 13, background: "var(--grey-50)", borderRadius: 12 }}>종별 템플릿을 먼저 선택하세요</div>
          )}
          {tpl && gender === "여성" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--primary)", marginTop: 9 }}>
              <Icon name="info" size={14} color="var(--primary)" />
              여성부는 디비전 뒤에 <b style={{ margin: "0 2px" }}>w</b>가 붙습니다 (예: D4 → D4w).
            </div>
          )}
        </div>

        {/* 4단계 · 연령 (해당 종별만) */}
        {hasAges && tpl && (
          <div>
            <div className="ts-field__label">
              4단계 · 연령 <span style={{ color: "var(--ink-mute)", fontWeight: 600 }}>(선택)</span> {ages.length > 0 && <span style={{ color: "var(--primary)" }}>({ages.length})</span>}
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
                  디비전 {divs.length} × 연령 {ages.length} = <b style={{ color: "var(--ink)" }}>{totalDivs}개</b> 디비전 생성 (예:{" "}
                  <b style={{ color: "var(--ink)" }}>
                    {wfix(divs[0] || tpl.divisions[0] || "")} {ages[0]}
                  </b>
                  )
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
// 본체 (controlled) — props: { value, onChange, scheduleDates, venues }
// =====================================================================
export function CtDivisions({
  value,
  onChange,
  scheduleDates,
  venues,
  toast,
}: {
  value: CategoryItem[];
  onChange: (next: CategoryItem[]) => void;
  scheduleDates: ScheduleDate[];
  venues: Venue[];
  toast: (msg: string) => void;
}) {
  const [genOpen, setGenOpen] = React.useState(false);

  // ── 종별 마스터 로드 (GET /api/web/admin/categories) ───────────────────
  //   응답 키는 snake_case(apiSuccess 자동 변환): { categories:[{id,name,divisions,ages,sort_order}] }
  const [master, setMaster] = React.useState<MasterCategory[]>([]);
  const [masterLoaded, setMasterLoaded] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/web/admin/categories");
        const json = await res.json();
        // 응답 형태: { ok:true, data:{ categories:[...] } } (apiSuccess 표준)
        const list: MasterCategory[] = json?.data?.categories ?? json?.categories ?? [];
        if (alive) {
          // id 는 BigInt 직렬화로 string/number 가능 → string 정규화
          setMaster(
            list.map((c) => ({
              id: String(c.id),
              name: c.name,
              divisions: Array.isArray(c.divisions) ? c.divisions : [],
              ages: Array.isArray(c.ages) ? c.ages : [],
              sort_order: c.sort_order ?? 0,
            })),
          );
        }
      } catch {
        // 실패 시 빈 목록(모달에서 안내). UI 흐름 영향 0.
      } finally {
        if (alive) setMasterLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const courts = allCourts(venues);
  const totalDiv = value.reduce((a, c) => a + c.divisions.length, 0);

  // ── mutators (불변 갱신) ──────────────────────────────────────────────
  const addCategory = (cat: CategoryItem) => onChange([...value, cat]);
  const removeCat = (catId: string) => onChange(value.filter((c) => c.id !== catId));
  const updateDiv = (catId: string, divId: string, patch: Partial<DivisionItem>) =>
    onChange(value.map((c) => (c.id === catId ? { ...c, divisions: c.divisions.map((dv) => (dv.id === divId ? { ...dv, ...patch } : dv)) } : c)));
  const removeDiv = (catId: string, divId: string) =>
    onChange(value.map((c) => (c.id === catId ? { ...c, divisions: c.divisions.filter((dv) => dv.id !== divId) } : c)));

  return (
    <section className="ts-card">
      {/* 카드 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
        <span className="ct-headicon">
          <Icon name="layout-grid" size={18} color="var(--primary)" />
        </span>
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>종별 · 디비전</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ct-reqtag">1개 이상 필수</span>
          <Btn size="sm" icon="plus" onClick={() => setGenOpen(true)}>
            추가
          </Btn>
        </span>
      </div>

      {/* 종별 카드 목록 또는 빈 상태 */}
      {value.length === 0 ? (
        <div className="ct-emptybox ct-emptybox--tall">
          <Icon name="layout-grid" size={26} color="var(--ink-dim)" />
          <span>
            아직 종별이 없습니다. <b style={{ color: "var(--ink-soft)" }}>추가</b> 버튼으로 종별·디비전을 생성하세요.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {value.map((c) => (
            <CategoryCard
              key={c.id}
              cat={c}
              scheduleDates={scheduleDates}
              courts={courts}
              onUpdateDiv={(divId, patch) => updateDiv(c.id, divId, patch)}
              onRemoveDiv={(divId) => removeDiv(c.id, divId)}
              onRemoveCat={() => removeCat(c.id)}
            />
          ))}
          {/* 안내 배너 */}
          <div className="ct-banner">
            <Icon name="info" size={15} color="var(--ok)" />
            <span>
              저장하면 <b style={{ color: "var(--ink)" }}>종별·디비전 구성 {totalDiv}건</b>과
              디비전별 경기날짜·코트 배정이 저장됩니다. 진행방식과 배정은 대회 상세에서 다시 조정할 수 있습니다.
            </span>
          </div>
        </div>
      )}

      {/* 종별 생성 모달 */}
      <DivisionGenerator open={genOpen} master={master} masterLoaded={masterLoaded} onClose={() => setGenOpen(false)} onGenerate={addCategory} toast={toast} />
    </section>
  );
}
