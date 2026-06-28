"use client";

// ============================================================
// [id]/edit/_edit-wizard.tsx — 대회 수정 마법사 (R5-B 클린 슬레이트)
//   정본: Dev/design/BDR v2.41-admin-toss/대회 수정.html
//         (TournamentWorkspace mode="edit" — 5단계 폼 + dirty 저장바 + 삭제 모달)
//
//   ★ R5-A 생성 마법사(../../new/_create-wizard) 의 프리미티브/타입/CSS 전면 재사용.
//     - Field/GroupTitle/Stepper/SegSm/VenueAdd/MonthCalendar/ReviewRow/FORMAT_LABEL/fmtDate/won/타입
//     - 5단계 스텝 구성·className(tw-steps/ct-*) 동일 → 시각 1:1.
//
//   ★ 백엔드/DB/Prisma 0변경. 기존 수정/삭제 엔드포인트 재사용:
//     - PATCH  /api/web/tournaments/[id]  → updateTournamentSchema(Zod·★혼합 케이스★)
//         camel: name/format/startDate/endDate/organizer/host/sponsors/categories
//         snake: venue_*/team_size/roster_*/entry_fee/registration_*_at/prize_info/
//                div_caps/div_fees/bank_*/fee_notes/auto_approve_teams/allow_waiting_list/
//                game_ball/game_rules/places/schedule_dates
//       → blanket camel→snake 금지(혼합이라 깨짐). adminFetch rawBody:true 로 키 verbatim 전송.
//     - DELETE /api/web/tournaments/[id]  → soft(status=cancelled). 확인 모달 경유.
//
//   생성 마법사와 다른 점(edit 전용): ①기존값 prefill ②dirty 추적 + 저장바(저장/취소)
//     ③삭제 모달 ④PATCH(변경 필드·정확 케이스) ⑤성공 시 운영 워크스페이스 복귀.
//   레거시 0 import. status/series_id/색상/이미지 = 5스텝 범위 밖이라 미전송(기존값 보존).
// ============================================================

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Btn,
  Icon,
  Check,
  Modal,
  useAdminShell,
} from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data";
import {
  Field,
  GroupTitle,
  Stepper,
  SegSm,
  VenueAdd,
  MonthCalendar,
  ReviewRow,
  FORMAT_LABEL,
  fmtDate,
  won,
  uid,
  type FormState,
  type Venue,
} from "../../new/_create-wizard";
import { DivisionsEditor } from "../../new/_divisions-editor";

// 정본 STEPS 1:1 (대회 수정.html / workspace.jsx 라인 13~19)
const STEPS = [
  { id: "info", label: "대회정보", icon: "info", sub: "대회 기본 정보와 소개를 입력합니다." },
  { id: "schedule", label: "일정·장소", icon: "calendar-days", sub: "본선 일정과 경기장·코트를 등록합니다." },
  { id: "divisions", label: "종별·정원", icon: "layout-grid", sub: "종별을 추가하고 정원·참가비를 설정합니다." },
  { id: "game", label: "경기설정", icon: "sliders-horizontal", sub: "대회 진행 방식과 경기 규칙을 설정합니다." },
  { id: "publish", label: "접수·공개", icon: "globe", sub: "참가 접수·결제 설정을 입력하고 내용을 검토합니다." },
] as const;

// 헤더 상태 칩(요약 헤더용) — operate page statusPill 과 동일 톤 매핑(서버 prefill 에서 전달)
export type EditMeta = {
  statusLabel: string;
  statusTone: string;
};

// ── PATCH 페이로드 빌더 ────────────────────────────────────────
//   ★ updateTournamentSchema 의 정확한 키 케이스로 직접 구성(혼합 케이스).
//     rawBody:true 로 보내므로 여기서 만든 키가 그대로 서버에 도달한다.
//   ★ 데이터 보존(운영 대회 깨짐 방지):
//     - places: 폼이 안 다루는 원본 필드(lat/lng/address/mapUrl/provider 등)를
//       id 매칭으로 spread 보존 후 편집 필드만 오버레이(레거시 지도 피커 데이터 유지).
//     - game_rules: 원본 jsonb 위에 5개 편집 필드만 오버레이(clockMode/shotClock/
//       타임아웃 등 고급 필드 보존 — 서버 normalizeGameRules 가 명시값 우선 사용).
function buildPatchBody(
  form: FormState,
  rawPlacesById: Record<string, Record<string, unknown>>,
  rawGameRules: Record<string, unknown>,
): Record<string, unknown> {
  // 종별 → categories/div_caps/div_fees (생성폼과 동일 계약 · category 그룹핑)
  const validDivs = form.divisions.filter((d) => d.label.trim());
  const categories: Record<string, string[]> = {};
  const divCaps: Record<string, number> = {};
  const divFees: Record<string, number> = {};
  // 종별별 진행방식/세부설정 맵(디비전명 키) — 생성폼과 동일. 서버 PATCH 가 기존 rule 에 반영.
  const divFormats: Record<string, string> = {};
  const divSettings: Record<string, Record<string, unknown>> = {};
  validDivs.forEach((d) => {
    const divName = d.label.trim();
    const catName = (d.category && d.category.trim()) || divName; // 종별명(없으면 자기 자신)
    (categories[catName] ||= []).push(divName);
    if (d.cap != null) divCaps[divName] = d.cap;
    divFees[divName] = d.fee;
    // format 은 항상 키 포함(빈 문자열 = 폴백) — "대회 방식 사용"으로 되돌리는 수정도 서버에 반영.
    divFormats[divName] = d.format || "";
    if (d.settings && Object.keys(d.settings).length) divSettings[divName] = d.settings;
  });

  // 일정(날짜 오름차순) → startDate/endDate 파생 + schedule_dates(court_ids snake)
  const sortedDates = [...form.dates].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = sortedDates[0]?.date;
  const endDate = sortedDates[sortedDates.length - 1]?.date;
  // 장소 jsonb — 원본 필드(지도 메타) spread 보존 후 편집 필드 오버레이(courtCount camel)
  const places = form.venues.map((v) => ({
    ...(rawPlacesById[v.id] ?? {}),
    id: v.id,
    name: v.name,
    region: v.region,
    courtCount: v.courtCount,
    naming: v.naming,
  }));
  const scheduleDates = sortedDates.map((d) => ({ id: d.id, date: d.date, court_ids: d.courtIds }));

  // ★ 키 케이스 = updateTournamentSchema 정확 매핑(camel/snake 혼합). rawBody:true 로 verbatim.
  const body: Record<string, unknown> = {
    // camel 키
    name: form.name.trim(),
    format: form.format,
    organizer: form.organizer || null,
    host: form.host || null,
    sponsors: form.sponsors || null,
    categories,
    // snake 키
    description: form.description || null,
    rules: form.rules || null,
    prize_info: form.prize || null,
    team_size: form.teamSize,
    roster_min: form.rosterMin,
    roster_max: form.rosterMax,
    entry_fee: form.entryFee || 0,
    game_ball: form.gameBall || null,
    // jsonb — 원본 game_rules 위에 5개 편집 필드 오버레이(고급 필드 보존). 서버가 재정규화.
    game_rules: { ...rawGameRules, ...form.gameRules },
    bank_name: form.bankName || null,
    bank_account: form.bankAccount || null,
    bank_holder: form.bankHolder || null,
    fee_notes: form.feeNotes || null,
    auto_approve_teams: form.autoApprove,
    allow_waiting_list: form.allowWaiting,
    // 접수 일시(datetime-local 문자열 또는 "") — 서버: 값 있으면 new Date(), "" → null
    registration_start_at: form.regStart || "",
    registration_end_at: form.regEnd || "",
    // jsonb 배열(장소/일정)
    places: places.length ? places : null,
    schedule_dates: scheduleDates.length ? scheduleDates : null,
    // 종별 정원/참가비 jsonb
    div_caps: divCaps,
    div_fees: divFees,
    // 종별별 진행방식/세부설정(snake 키) — 서버가 기존 division rule 의 format/settings 갱신.
    //   항상 전송(빈 객체 포함) — 진행방식을 비운 디비전을 폴백으로 되돌리려면 키가 와야 하므로.
    div_formats: divFormats,
    div_settings: divSettings,
  };
  // 일정이 있을 때만 startDate/endDate 갱신(없으면 기존값 보존 — 미전송)
  if (startDate) body.startDate = startDate;
  if (endDate) body.endDate = endDate;
  return body;
}

export function EditWizard({
  tournamentId,
  tournamentName,
  meta,
  initialForm,
  rawPlacesById,
  rawGameRules,
}: {
  tournamentId: string;
  tournamentName: string;
  meta: EditMeta;
  initialForm: FormState;
  // 폼이 안 다루는 원본 jsonb(데이터 보존용) — 저장 시 spread 오버레이
  rawPlacesById: Record<string, Record<string, unknown>>;
  rawGameRules: Record<string, unknown>;
}) {
  const router = useRouter();
  const { toast } = useAdminShell();
  const [step, setStep] = useState(0);
  // form = 현재 입력 / saved = 마지막 저장 기준(dirty 비교 baseline)
  const [form, setForm] = useState<FormState>(initialForm);
  const [saved, setSaved] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false); // 대회 일정 선택 모달(캘린더)
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // dirty = 저장 이후 변경 여부(JSON 비교 — 정본 workspace.jsx 1:1)
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  const patch = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setErrMsg(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  // gameRules 단일 키 갱신(경기 규칙 19키 입력 공용) — 생성 마법사와 동일 패턴.
  const setRule = <K extends keyof FormState["gameRules"]>(k: K, v: FormState["gameRules"][K]) =>
    patch("gameRules", { ...form.gameRules, [k]: v });
  const cur = STEPS[step];
  const pct = ((step + 1) / STEPS.length) * 100;

  // ── 종별별 참가비(정본 workspace.jsx 75~84 1:1 · 생성 마법사와 동일 패턴) ──
  //   데이터 소스 = form.divisions[].fee(종별 단계와 동일 state) → 양방향 일관.
  //   모달 draftFees(종별 id 키) 편집 → 적용 시 form.divisions 갱신. PATCH payload(div_fees) 0변경.
  const [feeOpen, setFeeOpen] = useState(false);
  const [draftFees, setDraftFees] = useState<Record<string, number>>({});
  const labeledDivs = form.divisions.filter((d) => d.label.trim());
  const tieredCount = labeledDivs.filter((d) => (d.fee ?? form.entryFee) !== form.entryFee).length;
  const openFee = () => {
    const m: Record<string, number> = {};
    labeledDivs.forEach((d) => { m[d.id] = d.fee ?? form.entryFee; });
    setDraftFees(m);
    setFeeOpen(true);
  };
  const applyFees = () => {
    patch("divisions", form.divisions.map((d) => (d.id in draftFees ? { ...d, fee: draftFees[d.id] } : d)));
    setFeeOpen(false);
    toast("종별별 참가비를 적용했습니다");
  };

  // 장소→코트 파생(정본 ScheduleVenue courts 1:1)
  const courts = form.venues.flatMap((v) =>
    v.courtCount <= 1
      ? [{ id: v.id + "_c0", full: v.name }]
      : Array.from({ length: v.courtCount }, (_, i) => ({
          id: `${v.id}_c${i}`,
          full: `${v.name} ${v.naming === "alpha" ? String.fromCharCode(65 + i) : i + 1}코트`,
        }))
  );

  const go = (i: number) => {
    setErrMsg(null);
    setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── 장소/일정 CRUD (생성폼 1:1). 종별 CRUD = DivisionsEditor(공용) onChange. ──
  const addVenue = (name: string) => {
    const nm = name.trim();
    if (!nm) return;
    patch("venues", [...form.venues, { id: uid("v"), name: nm, region: "", courtCount: 1, naming: "num" } as Venue]);
  };
  const setVenue = (id: string, p: Partial<Venue>) => patch("venues", form.venues.map((v) => (v.id === id ? { ...v, ...p } : v)));
  const removeVenue = (id: string) => patch("venues", form.venues.filter((v) => v.id !== id));

  const addDate = (date: string) => {
    if (!date || form.dates.some((d) => d.date === date)) return;
    patch("dates", [...form.dates, { id: uid("dt"), date, courtIds: [] }].sort((a, b) => a.date.localeCompare(b.date)));
  };
  // 캘린더 셀 토글 — 이미 선택된 날이면 제거, 아니면 추가(addDate). form.dates = SOT.
  const toggleDate = (date: string) => {
    const ex = form.dates.find((d) => d.date === date);
    if (ex) patch("dates", form.dates.filter((d) => d.id !== ex.id));
    else addDate(date);
  };
  const toggleCourt = (did: string, cid: string) =>
    patch("dates", form.dates.map((d) =>
      d.id === did
        ? { ...d, courtIds: d.courtIds.includes(cid) ? d.courtIds.filter((x) => x !== cid) : [...d.courtIds, cid] }
        : d
    ));

  // 검토 요약(생성폼 review 1:1)
  const review = useMemo(() => {
    const dates = form.dates.map((d) => d.date).sort();
    return {
      name: form.name.trim() || "(미입력)",
      format: FORMAT_LABEL[form.format] || form.format,
      venues: form.venues.length,
      dates: dates.length,
      startDate: dates[0] || null,
      endDate: dates[dates.length - 1] || null,
      divisions: form.divisions.filter((d) => d.label.trim()).length,
    };
  }, [form]);

  // ── 저장(PATCH · 혼합 케이스 · rawBody) ──────────────────────
  //   complete=true 면 저장 성공 후 운영 워크스페이스로 복귀("저장하고 완료").
  const doSave = async (complete: boolean) => {
    setErrMsg(null);
    if (!form.name.trim()) {
      setErrMsg("대회 이름은 필수입니다.");
      setStep(0);
      return;
    }
    if (form.rosterMin > form.rosterMax) {
      setErrMsg("최소 선수는 최대 선수보다 클 수 없습니다.");
      setStep(3);
      return;
    }
    setSaving(true);
    try {
      // rawBody:true — PATCH 는 혼합 케이스 zod 계약. 키를 verbatim 으로 보내 깨짐 방지.
      await adminFetch(`/api/web/tournaments/${tournamentId}`, {
        method: "PATCH",
        rawBody: true,
        body: buildPatchBody(form, rawPlacesById, rawGameRules),
      });
      setSaved(form); // dirty baseline 갱신 → "변경사항 없음"
      setSaving(false);
      if (complete) {
        router.push(`/v2/operate/${tournamentId}`); // 운영 워크스페이스 복귀
      } else {
        toast("저장되었습니다");
      }
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : "대회 수정 중 오류가 발생했습니다.";
      setErrMsg(msg);
      toast(msg);
      setSaving(false);
    }
  };

  // ── 삭제(DELETE · soft=cancelled) — 확인 모달 경유. 실행 시 실제 호출. ──
  const doDelete = async () => {
    setDeleting(true);
    try {
      await adminFetch(`/api/web/tournaments/${tournamentId}`, { method: "DELETE" });
      setDelOpen(false);
      setDeleting(false);
      toast("대회가 취소되었습니다");
      router.push("/v2/ta/tournaments");
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : "대회 삭제 중 오류가 발생했습니다.";
      setDeleting(false);
      toast(msg);
    }
  };

  // 저장바 상태 문구(정본 stateMsg 1:1)
  const stateMsg = saving
    ? "저장 중입니다"
    : errMsg
      ? errMsg
      : dirty
        ? "변경사항이 있습니다"
        : "변경사항 없음";

  return (
    <div>
      {/* 헤더 (요약 — 대회명 + 상태 칩) */}
      <div className="ts-ph" style={{ marginBottom: 16 }}>
        <div className="ts-ph__row">
          <div>
            <div className="ts-ph__eyebrow">대회 관리자 · 대회 정보 수정</div>
            <div className="ts-ph__title">{tournamentName}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <span className="ct-pill" data-tone={meta.statusTone}>{meta.statusLabel}</span>
              <span className="ct-pill" data-tone="info">{review.dates ? `${review.dates}일 일정` : "일정 미설정"}</span>
              <span className="ct-pill" data-tone="mute">{review.divisions}종별</span>
            </div>
          </div>
          {/* 삭제(danger) — 확인 모달 후 실제 DELETE */}
          <Btn variant="danger" size="sm" icon="trash-2" onClick={() => setDelOpen(true)}>
            대회 삭제
          </Btn>
        </div>
      </div>

      {/* 진행률 바 (정본 ct-progress) */}
      <div className="ct-progress" style={{ marginBottom: 14 }}>
        <div className="ct-progress__fill" style={{ width: pct + "%" }} />
      </div>

      {/* 스텝 네비(클릭 점프·is-active/is-done) — 정본 tw-steps */}
      <div className="tw-steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={"tw-step" + (i === step ? " is-active" : i < step ? " is-done" : "")}
            onClick={() => go(i)}
          >
            <span className="tw-step__num">{i < step ? <Icon name="check" size={13} /> : i + 1}</span>
            <span className="tw-step__lbl">{s.label}</span>
          </button>
        ))}
      </div>

      {/* 스텝 본문 */}
      <section className="ts-card">
        <div className="ct-section__head">
          <span className="ct-headicon"><Icon name={cur.icon} size={18} /></span>
          <div>
            <h2 className="ct-section__title">{step + 1}단계 · {cur.label}</h2>
            <p className="ct-section__sub">{cur.sub}</p>
          </div>
        </div>

        {/* 1) 기본정보 */}
        {cur.id === "info" && (
          <div className="ct-form">
            <div className="ct-form-grid">
              <GroupTitle flush>대회 정보</GroupTitle>
              <Field label="대회 이름" span2>
                <input className="ts-input" value={form.name} onChange={(e) => patch("name", e.target.value)} placeholder="예: BDR 서머 오픈" />
              </Field>
              <Field label="주최"><input className="ts-input" value={form.organizer} onChange={(e) => patch("organizer", e.target.value)} placeholder="주최 단체" /></Field>
              <Field label="주관"><input className="ts-input" value={form.host} onChange={(e) => patch("host", e.target.value)} placeholder="주관 단체" /></Field>
              <Field label="후원사 (쉼표 구분)" span2>
                <input className="ts-input" value={form.sponsors} onChange={(e) => patch("sponsors", e.target.value)} placeholder="예: 몰텐, 스팔딩" />
              </Field>
            </div>
            <div>
              <GroupTitle>대회 소개</GroupTitle>
              <Field label="대회 소개"><textarea className="ts-textarea" value={form.description} onChange={(e) => patch("description", e.target.value)} placeholder="대회 소개" /></Field>
            </div>
          </div>
        )}

        {/* 2) 일정·장소 */}
        {cur.id === "schedule" && (
          <div className="ct-form">
            {/* 장소 */}
            <div className="ts-field">
              <span className="ts-field__label">장소 · 코트</span>
              <VenueAdd onAdd={addVenue} />
              {form.venues.length === 0 ? (
                <div className="ct-emptybox"><Icon name="map-pin-off" size={22} /><span>등록된 장소가 없습니다</span></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {form.venues.map((v) => (
                    <div key={v.id} className="ct-venuerow">
                      <div className="ct-venuerow__top">
                        <Icon name="map-pin" size={15} color="var(--primary)" />
                        <span className="ct-venuerow__nm">{v.name}</span>
                        <button type="button" className="ct-iconbtn" style={{ marginLeft: "auto" }} onClick={() => removeVenue(v.id)}><Icon name="x" size={15} /></button>
                      </div>
                      <div className="ct-venuerow__ctrl">
                        <span className="ct-venuerow__lbl">코트 수</span>
                        <Stepper value={v.courtCount} unit="개" min={1} max={8} onChange={(n) => setVenue(v.id, { courtCount: n })} />
                        {v.courtCount >= 2 && (
                          <>
                            <span className="ct-venuerow__lbl">명칭</span>
                            <SegSm options={["숫자", "알파벳"]} index={v.naming === "alpha" ? 1 : 0} onSelect={(i) => setVenue(v.id, { naming: i ? "alpha" : "num" })} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* 일정 — "일정 선택" 버튼 → 캘린더 모달. 선택 날짜는 아래 카드로 펼침(모달 밖 유지) */}
            <div className="ts-field">
              <span className="ts-field__label">대회 일정</span>
              {/* 점선 버튼(ct-adddate 재사용) — 선택 0개="일정 선택", 1개+="N일 선택됨 · 수정" */}
              <button type="button" className="ct-adddate" onClick={() => setCalOpen(true)}>
                <Icon name="calendar-plus" size={16} />
                {form.dates.length ? `${form.dates.length}일 선택됨 · 수정` : "일정 선택"}
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.dates.map((dt, i) => (
                  <div key={dt.id} className="ct-dateblock">
                    <div className="ct-dateblock__head">
                      <span className="ct-daterow__idx">{i + 1}일차</span>
                      <span className="ct-daterow__label">{fmtDate(dt.date)}</span>
                      <span className="ct-dateblock__n">{dt.courtIds.length}코트</span>
                      <button type="button" className="ct-iconbtn" onClick={() => patch("dates", form.dates.filter((x) => x.id !== dt.id))}><Icon name="x" size={15} /></button>
                    </div>
                    {courts.length > 0 && (
                      <div className="ct-courtpick">
                        {courts.map((c) => (
                          <button key={c.id} type="button" className="ct-courtpick__chip" data-on={dt.courtIds.includes(c.id)} onClick={() => toggleCourt(dt.id, c.id)}>
                            {dt.courtIds.includes(c.id) && <Icon name="check" size={12} />}{c.full}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3) 종별·정원 — 진행방식은 종별(디비전)별 카드에서 설정(단일 대회방식 select 제거) */}
        {cur.id === "divisions" && (
          <div className="ct-form">
            {/* 종별 에디터(공용) — 생성 마법사와 동일 프리미티브(템플릿/직접/연령/종별별 진행방식) */}
            <DivisionsEditor
              divisions={form.divisions}
              onChange={(v) => patch("divisions", v)}
              defaultFee={form.entryFee || 60000}
              toast={toast}
            />
            <div className="ops-note" style={{ marginTop: 4 }}>
              <Icon name="info" size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} />
              <span>대진 생성·조 편성·일정 배치는 <b>운영 워크스페이스</b>에서 처리합니다. 여기서는 종별·정원·참가비만 수정합니다.</span>
            </div>
          </div>
        )}

        {/* 4) 경기설정 — 경기 규칙 19키(ct-game-settings.tsx min/max/step 1:1) */}
        {cur.id === "game" && (
          <div className="ct-form">
            <div className="ct-form-grid">
              <GroupTitle flush>경기 구성</GroupTitle>
              <Field label="공인구"><input className="ts-input" value={form.gameBall} onChange={(e) => patch("gameBall", e.target.value)} placeholder="예: 몰텐 GG7X" /></Field>
              <Field label="경기 인원"><input className="ts-input" type="number" min={1} value={form.teamSize} onChange={(e) => patch("teamSize", +e.target.value)} /></Field>
              <Field label="쿼터 방식">
                <SegSm options={["4쿼터", "전후반"]} index={form.gameRules.quarterType === "HALF" ? 1 : 0} onSelect={(i) => setRule("quarterType", i ? "HALF" : "4Q")} />
              </Field>
              <Field label="쿼터 시간(분)"><input className="ts-input" type="number" min={1} value={form.gameRules.quarterMinutes} onChange={(e) => setRule("quarterMinutes", +e.target.value)} /></Field>
              <Field label="파울 한도"><input className="ts-input" type="number" min={1} value={form.gameRules.foulLimit} onChange={(e) => setRule("foulLimit", +e.target.value)} /></Field>
              {/* ── 추가 5키: 운영방식·연장·막판정지·팀파울·샷클락 ── */}
              <Field label="운영 방식">
                <SegSm options={["논스톱", "올데드"]} index={form.gameRules.clockMode === "nonstop" ? 0 : 1} onSelect={(i) => setRule("clockMode", i === 0 ? "nonstop" : "dead")} />
              </Field>
              <Field label="연장 시간">
                <Stepper value={form.gameRules.overtimeMinutes} unit="분" min={1} max={20} onChange={(n) => setRule("overtimeMinutes", n)} />
              </Field>
              <Field label="막판 득점 정지">
                <Stepper value={form.gameRules.lastScoreStopMin} unit="분" min={0} max={2} onChange={(n) => setRule("lastScoreStopMin", n)} />
              </Field>
              <Field label="팀파울 보너스">
                <Stepper value={form.gameRules.teamFoulBonus} unit="파울" min={3} max={7} onChange={(n) => setRule("teamFoulBonus", n)} />
              </Field>
              <Field label="샷클락">
                <SegSm options={["사용", "미사용"]} index={form.gameRules.shotClockEnabled ? 0 : 1} onSelect={(i) => setRule("shotClockEnabled", i === 0)} />
              </Field>
            </div>
            {/* ── 타임아웃·휴식(추가 7키) ── */}
            <div className="ct-form-grid">
              <GroupTitle>타임아웃 · 휴식</GroupTitle>
              <Field label="타임아웃 · 전반">
                <Stepper value={form.gameRules.firstHalfTimeouts} unit="회" min={0} max={4} onChange={(n) => setRule("firstHalfTimeouts", n)} />
              </Field>
              <Field label="타임아웃 · 후반">
                <Stepper value={form.gameRules.secondHalfTimeouts} unit="회" min={0} max={4} onChange={(n) => setRule("secondHalfTimeouts", n)} />
              </Field>
              <Field label="타임아웃 시간">
                <Stepper value={form.gameRules.timeoutDurationSeconds} unit="초" min={30} max={90} step={10} onChange={(n) => setRule("timeoutDurationSeconds", n)} />
              </Field>
              <Field label="쿼터 사이 휴식">
                <Stepper value={form.gameRules.shortBreakDurationSeconds} unit="초" min={0} max={600} step={30} onChange={(n) => setRule("shortBreakDurationSeconds", n)} />
              </Field>
              <Field label="하프타임">
                <Stepper value={form.gameRules.halftimeDurationSeconds} unit="초" min={0} max={900} step={30} onChange={(n) => setRule("halftimeDurationSeconds", n)} />
              </Field>
              <Field label="연장 전 휴식">
                <Stepper value={form.gameRules.overtimeBreakDurationSeconds} unit="초" min={0} max={600} step={30} onChange={(n) => setRule("overtimeBreakDurationSeconds", n)} />
              </Field>
              <Field label="휴식 자동 시작">
                <SegSm options={["사용", "미사용"]} index={form.gameRules.autoIntervalTimerEnabled ? 0 : 1} onSelect={(i) => setRule("autoIntervalTimerEnabled", i === 0)} />
              </Field>
            </div>
            {/* ── 유니폼(추가 2색 + 조끼) ── */}
            <div className="ct-form-grid">
              <GroupTitle>유니폼</GroupTitle>
              <Field label="홈 유니폼 색상">
                <input className="ts-input" type="color" style={{ height: 42, padding: 4 }} value={form.gameRules.homeColor} onChange={(e) => setRule("homeColor", e.target.value)} />
              </Field>
              <Field label="원정 유니폼 색상">
                <input className="ts-input" type="color" style={{ height: 42, padding: 4 }} value={form.gameRules.awayColor} onChange={(e) => setRule("awayColor", e.target.value)} />
              </Field>
              <label className="ct-checkrow ct-span2"><Check on={form.gameRules.vestProvided} onChange={(v) => setRule("vestProvided", v)} /><span>팀 조끼(번호 조끼) 제공</span></label>
            </div>
            <div className="ct-form-grid">
              <GroupTitle>선수 구성</GroupTitle>
              <Field label="최소 선수"><input className="ts-input" type="number" min={1} value={form.rosterMin} onChange={(e) => patch("rosterMin", +e.target.value)} /></Field>
              <Field label="최대 선수"><input className="ts-input" type="number" min={1} value={form.rosterMax} onChange={(e) => patch("rosterMax", +e.target.value)} /></Field>
            </div>
            <div className="ct-form">
              <GroupTitle>운영 안내</GroupTitle>
              <Field label="대회 규칙"><textarea className="ts-textarea" value={form.rules} onChange={(e) => patch("rules", e.target.value)} placeholder="FIBA 룰 적용 등" /></Field>
              <Field label="상금/시상 안내"><textarea className="ts-textarea" style={{ minHeight: 72 }} value={form.prize} onChange={(e) => patch("prize", e.target.value)} placeholder="우승 / 준우승 시상" /></Field>
            </div>
          </div>
        )}

        {/* 5) 접수·공개 */}
        {cur.id === "publish" && (
          <div className="ct-form">
            <div className="ct-form-grid">
              <GroupTitle flush>접수 · 결제</GroupTitle>
              <Field label="접수 시작"><input className="ts-input" type="datetime-local" value={form.regStart} onChange={(e) => patch("regStart", e.target.value)} /></Field>
              <Field label="접수 종료"><input className="ts-input" type="datetime-local" value={form.regEnd} onChange={(e) => patch("regEnd", e.target.value)} /></Field>
              <Field label="은행명"><input className="ts-input" value={form.bankName} onChange={(e) => patch("bankName", e.target.value)} /></Field>
              <Field label="계좌번호"><input className="ts-input" value={form.bankAccount} onChange={(e) => patch("bankAccount", e.target.value)} /></Field>
              <Field label="예금주"><input className="ts-input" value={form.bankHolder} onChange={(e) => patch("bankHolder", e.target.value)} /></Field>
              {/* 참가비 기본 + 종별별 차등 진입(정본 195~201 1:1) */}
              <Field label="참가비 (기본)">
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="ts-input" type="number" min={0} step={1000} style={{ flex: 1, minWidth: 0 }} value={form.entryFee} onChange={(e) => patch("entryFee", +e.target.value)} />
                  <Btn variant="secondary" icon="layers" onClick={openFee}>종별별</Btn>
                </div>
                {tieredCount > 0 && <div className="ts-field__hint" style={{ color: "var(--primary)", fontWeight: 700 }}>종별 차등 참가비 {tieredCount}개 설정됨</div>}
              </Field>
              <Field label="참가 접수 안내" span2><textarea className="ts-textarea" style={{ minHeight: 64 }} value={form.feeNotes} onChange={(e) => patch("feeNotes", e.target.value)} placeholder="입금자명·환불 안내 등" /></Field>
              <label className="ct-checkrow ct-span2"><Check on={form.autoApprove} onChange={(v) => patch("autoApprove", v)} /><span>참가팀 자동 승인</span></label>
              <label className="ct-checkrow ct-span2"><Check on={form.allowWaiting} onChange={(v) => patch("allowWaiting", v)} /><span>대기 접수 허용</span></label>
            </div>
            {/* 검토 요약 */}
            <div>
              <GroupTitle>검토</GroupTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <ReviewRow label="대회 이름" value={review.name} />
                <ReviewRow label="대회 방식" value={review.format} />
                <ReviewRow label="장소" value={`${review.venues}곳`} />
                <ReviewRow label="일정" value={review.dates ? `${review.dates}일 (${review.startDate ?? ""}${review.endDate && review.endDate !== review.startDate ? ` ~ ${review.endDate}` : ""})` : "미설정"} />
                <ReviewRow label="종별" value={`${review.divisions}개`} />
                <ReviewRow label="기본 참가비" value={won(form.entryFee)} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 푸터 — 이전 / 상태 / 저장·다음·완료 (정본 tw-foot + dirty 저장바) */}
      <div className="tw-foot">
        <Btn variant="secondary" icon="chevron-left" disabled={step === 0} onClick={() => go(step - 1)}>이전</Btn>
        <div className="tw-foot__mid">
          <span className="ct-savebar__state">{stateMsg}</span>
          {errMsg && <span className="tw-msg" data-tone="err">{errMsg}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* 취소 = 변경 버리고 운영 워크스페이스 복귀 */}
          <Btn variant="secondary" icon="x" disabled={saving} onClick={() => router.push(`/v2/operate/${tournamentId}`)}>취소</Btn>
          {/* 저장 = PATCH 후 머무름(저장바 갱신) */}
          <Btn variant="secondary" icon="save" disabled={saving} onClick={() => doSave(false)}>{saving ? "저장 중" : "저장"}</Btn>
          {step < STEPS.length - 1 ? (
            <Btn iconRight="chevron-right" onClick={() => go(step + 1)}>다음</Btn>
          ) : (
            // 마지막 스텝 = 저장하고 완료(운영 복귀)
            <Btn icon="check" disabled={saving} onClick={() => doSave(true)}>{saving ? "저장 중" : "저장하고 완료"}</Btn>
          )}
        </div>
      </div>

      {/* 종별 참가비 설정 모달(정본 workspace.jsx 228~253 1:1) */}
      <Modal
        open={feeOpen}
        onClose={() => setFeeOpen(false)}
        title="종별 참가비 설정"
        sub="생성한 종별별로 참가비를 다르게 설정합니다. 미설정 종별은 기본 참가비를 적용합니다."
        foot={
          <>
            <Btn variant="secondary" onClick={() => setFeeOpen(false)}>취소</Btn>
            <Btn icon="check" onClick={applyFees}>적용</Btn>
          </>
        }
      >
        {labeledDivs.length ? (
          <div>
            {/* 기본 참가비 일괄 적용 — 모든 종별 draft 를 기본액으로 채움 */}
            <button type="button" className="ct-feeapply" onClick={() => { const m: Record<string, number> = {}; labeledDivs.forEach((d) => { m[d.id] = form.entryFee; }); setDraftFees(m); }}>
              <Icon name="copy" size={15} />기본 참가비 일괄 적용 · {won(form.entryFee)}
            </button>
            {labeledDivs.map((d) => (
              <div key={d.id} className="ct-feerow">
                <div className="ct-feerow__nm">{d.label}<span className="ct-feerow__cap">정원 {d.cap != null ? `${d.cap}팀` : "무제한"} · {FORMAT_LABEL[d.format || form.format] || d.format || form.format}</span></div>
                <div className="ct-feerow__in">
                  <input type="number" className="ts-input" value={d.id in draftFees ? draftFees[d.id] : ""} onChange={(e) => setDraftFees((f) => ({ ...f, [d.id]: +e.target.value }))} />
                  <span className="ct-feerow__won">원</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ct-emptybox"><b>종별·정원</b> 단계에서 종별을 먼저 추가하세요.</div>
        )}
      </Modal>

      {/* 대회 일정 선택 모달(정본 CalendarModal 1:1) — 캘린더 토글이 즉시 form.dates 반영(toggleDate 재사용).
          "선택 완료"/"취소" 둘 다 닫기만(즉시 반영 모델이라 롤백 불필요). N = form.dates.length 실시간. */}
      <Modal
        open={calOpen}
        onClose={() => setCalOpen(false)}
        maxWidth={440}
        title="대회 일정 선택"
        sub="여러 날 선택 가능. 다시 누르면 해제."
        foot={
          <>
            <Btn variant="secondary" onClick={() => setCalOpen(false)}>취소</Btn>
            <Btn icon="check" onClick={() => setCalOpen(false)}>선택 완료 ({form.dates.length}일)</Btn>
          </>
        }
      >
        <MonthCalendar selected={form.dates.map((d) => d.date)} onToggle={toggleDate} />
      </Modal>

      {/* 삭제 확인 모달 — 정본 1:1. 확인 시 실제 DELETE(soft=cancelled) 호출. */}
      {delOpen && (
        <Modal
          open
          onClose={() => setDelOpen(false)}
          title="대회를 삭제할까요?"
          sub={tournamentName}
          foot={
            <>
              <Btn variant="secondary" onClick={() => setDelOpen(false)} disabled={deleting}>취소</Btn>
              <Btn variant="danger" icon="trash-2" onClick={doDelete} disabled={deleting}>{deleting ? "처리 중" : "대회 취소"}</Btn>
            </>
          }
        >
          <div className="ops-warn" style={{ marginBottom: 4 }}>
            <Icon name="alert-triangle" size={18} color="var(--warn)" style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span>대회가 <b>취소</b> 상태로 전환됩니다. 참가팀·대진·일정 데이터는 보존되며, 필요 시 운영에서 복원할 수 있습니다.</span>
          </div>
        </Modal>
      )}
    </div>
  );
}
