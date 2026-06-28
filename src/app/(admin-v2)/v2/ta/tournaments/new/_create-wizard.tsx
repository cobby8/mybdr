"use client";

// ============================================================
// _create-wizard.tsx — 대회 생성 마법사 (R5-A 클린 슬레이트)
//   정본: Dev/design/BDR v2.41-admin-toss/workspace.jsx (TournamentWorkspace mode="create")
//   5단계: 기본정보 > 일정·장소 > 종별·정원 > 대진방식(경기설정) > 접수·검토
//
//   ★ 백엔드/DB/Prisma 0변경. 기존 생성 엔드포인트 재사용:
//      POST /api/web/tournaments  (레거시 wizard 와 동일 — route.ts 라인 141~279)
//      - body = camelCase(raw destructure·zod 없음) → adminFetch rawBody:true 로 verbatim 전송
//      - 필수 = name 만. 나머지는 미전송 시 서버 default
//      - 응답 = { success, tournament_id, redirect_url } (apiSuccess snake) →
//        adminFetch 가 snake→camel 변환 → result.tournamentId / result.redirectUrl
//   성공 시 → /v2/operate/[newId] (R4 운영 워크스페이스)로 이동.
//
//   ⚠ mock 금지(룰): 정본 ScheduleVenue 의 하드코딩 체육관 DB·종별 템플릿/연령·
//      GameSettings 프리셋·대회복사(copyableTournaments) 는 mock 이라 미포팅.
//      실입력 폼으로 대체(장소=직접 입력, 일정=date 입력, 종별=직접 추가).
//   레거시 0 import. 전부 admin-v2 kit + adminFetch.
// ============================================================

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Btn,
  Icon,
  Check,
  Badge,
  Modal,
  useAdminShell,
} from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data";
// 경기 규칙 = game-rules.ts 정본(19키 타입 + 디폴트). 마법사가 통째로 payload(gameRules)로 전송 → 서버 normalizeGameRules 정규화.
import { type TournamentGameRules, GAME_RULE_DEFAULTS } from "@/lib/tournaments/game-rules";
import { DivisionsEditor } from "./_divisions-editor";

// 복사 목록 행(서버 page.tsx 가 organizer-scoped Prisma 로 주입 — 스칼라만).
export type CopyableTournament = { id: string; name: string; statusLabel: string; dateLabel: string };

// 종별 진행방식 6 enum — division-formats.ts / 정본 data.jsx FORMAT_LABEL 1:1(실 enum·mock 아님)
//   R5-B(수정 마법사)가 동일 라벨/포맷 목록을 재사용하도록 export(값 무변경).
export const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트",
  round_robin: "풀리그",
  dual_tournament: "듀얼토너먼트",
  group_stage_knockout: "조별리그+토너먼트",
  league_advancement: "링크제",
  group_stage_with_ranking: "조별리그+동순위 순위결정전",
};
export const ALLOWED_FORMATS = Object.keys(FORMAT_LABEL);

// 정본 STEPS 1:1 (workspace.jsx 라인 13~19)
const STEPS = [
  { id: "info", label: "대회정보", icon: "info", sub: "대회 기본 정보와 소개를 입력합니다." },
  { id: "schedule", label: "일정·장소", icon: "calendar-days", sub: "본선 일정과 경기장·코트를 등록합니다." },
  { id: "divisions", label: "종별·정원", icon: "layout-grid", sub: "종별을 추가하고 정원·참가비를 설정합니다." },
  { id: "game", label: "대진방식", icon: "sliders-horizontal", sub: "대회 진행 방식과 경기 규칙을 설정합니다." },
  { id: "publish", label: "접수·검토", icon: "globe", sub: "참가 접수·결제 설정을 입력하고 내용을 검토합니다." },
] as const;

// ── 폼 타입 ─────────────────────────────────────────────── (R5-B 수정 마법사 공용 재사용 위해 export)
export type Venue = { id: string; name: string; region: string; courtCount: number; naming: "num" | "alpha" };
export type DateRow = { id: string; date: string; courtIds: string[] };
// category = 소속 종별명(AdminCategory.name + 성별 접두, 예 "남성 유청소년"). 없으면 단독 디비전.
//   ★ 페이로드 빌더가 category 로 그룹핑 → categories={종별명:[디비전명]} → 서버 연령 자동채움.
export type DivisionRow = { id: string; label: string; cap: number | null; fee: number; category?: string };
// 로컬 5키 타입 제거 → 정본 19키 타입 1:1 재사용(R5-B 수정 마법사도 FormState 통해 동일 타입 자동 확장).
export type GameRules = TournamentGameRules;

export type FormState = {
  name: string;
  organizer: string;
  host: string;
  sponsors: string;
  description: string;
  venues: Venue[];
  dates: DateRow[];
  format: string;
  divisions: DivisionRow[];
  gameBall: string;
  teamSize: number;
  rosterMin: number;
  rosterMax: number;
  rules: string;
  prize: string;
  gameRules: GameRules;
  regStart: string;
  regEnd: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  entryFee: number;
  feeNotes: string;
  autoApprove: boolean;
  allowWaiting: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  organizer: "",
  host: "",
  sponsors: "",
  description: "",
  venues: [],
  dates: [],
  format: "single_elimination",
  divisions: [],
  gameBall: "",
  teamSize: 5,
  rosterMin: 5,
  rosterMax: 12,
  rules: "",
  prize: "",
  gameRules: GAME_RULE_DEFAULTS, // 정본 19키 디폴트(누락 14키 포함)
  regStart: "",
  regEnd: "",
  bankName: "",
  bankAccount: "",
  bankHolder: "",
  entryFee: 0,
  feeNotes: "",
  autoApprove: false,
  allowWaiting: true,
};

let uidSeq = 0;
export const uid = (p: string) => `${p}${Date.now().toString(36)}${(uidSeq++).toString(36)}`;
export const won = (n: number) => (Number(n) || 0).toLocaleString() + "원";

// 작은 보조 컴포넌트 — 정본 Field/GroupTitle/Stepper/SegSm 1:1 (R5-B 재사용 위해 export)
export function Field({ label, span2, children }: { label: string; span2?: boolean; children: React.ReactNode }) {
  return (
    <label className={"ts-field" + (span2 ? " ct-span2" : "")} style={{ margin: 0 }}>
      <span className="ts-field__label">{label}</span>
      {children}
    </label>
  );
}
export function GroupTitle({ children, flush }: { children: React.ReactNode; flush?: boolean }) {
  return <div className={"ct-group-title" + (flush ? " ct-group-title--flush" : "")}>{children}</div>;
}
export function Stepper({ value, unit, min = 1, max = 8, step = 1, onChange }: { value: number; unit?: string; min?: number; max?: number; step?: number; onChange: (n: number) => void }) {
  // step = 증감 단위(기본 1). 초 단위 휴식/타임아웃은 step 10·30 으로 호출.
  return (
    <div className="ct-stepper">
      <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}><Icon name="minus" size={15} /></button>
      <span className="ct-stepper__val">{value}{unit && <span className="u">{unit}</span>}</span>
      <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}><Icon name="plus" size={15} /></button>
    </div>
  );
}
export function SegSm({ options, index, onSelect }: { options: string[]; index: number; onSelect: (i: number) => void }) {
  return <div className="ct-segsm">{options.map((o, i) => <button key={o} type="button" data-active={i === index} onClick={() => onSelect(i)}>{o}</button>)}</div>;
}

const WK = ["일", "월", "화", "수", "목", "금", "토"];
export const fmtDate = (s: string) => {
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return s;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${WK[d.getDay()]})`;
};

export function CreateWizard({
  initialForm,
  copyableList,
  copiedFromName,
}: {
  // 복사 진입(?copyFrom) 시 서버가 채운 prefill. 없으면 빈 폼.
  initialForm?: FormState;
  // "기존 대회 복사" 피커 목록(없으면 복사 버튼 숨김).
  copyableList?: CopyableTournament[];
  // 복사 출처 대회명(배너 안내용).
  copiedFromName?: string;
} = {}) {
  const router = useRouter();
  const { toast } = useAdminShell();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false); // 복사 피커 모달

  const patch = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setErrMsg(null);
    setForm((f) => ({ ...f, [k]: v }));
  };
  // gameRules 단일 키 갱신(경기 규칙 19키 입력 공용) — form.gameRules 스프레드 반복 제거.
  const setRule = <K extends keyof GameRules>(k: K, v: GameRules[K]) =>
    patch("gameRules", { ...form.gameRules, [k]: v });
  const cur = STEPS[step];
  const pct = ((step + 1) / STEPS.length) * 100;

  // ── 종별별 참가비(정본 workspace.jsx 75~84 1:1) ──────────────
  //   데이터 소스 = form.divisions[].fee(종별 단계와 동일 state) → 양방향 일관.
  //   모달은 draftFees(종별 id 키) 버퍼로 편집 → 적용 시 form.divisions 갱신. 저장 payload 0변경.
  const [feeOpen, setFeeOpen] = useState(false); // 종별 참가비 모달
  const [draftFees, setDraftFees] = useState<Record<string, number>>({}); // 모달 임시 편집값
  const labeledDivs = form.divisions.filter((d) => d.label.trim()); // 라벨 있는 실 종별만
  // 기본 참가비와 다른 종별 수(차등 설정 개수) — 힌트 노출 트리거
  const tieredCount = labeledDivs.filter((d) => (d.fee ?? form.entryFee) !== form.entryFee).length;
  // 모달 열기 — 현재 form.divisions[].fee 를 draft 로 복사(id 키)
  const openFee = () => {
    const m: Record<string, number> = {};
    labeledDivs.forEach((d) => { m[d.id] = d.fee ?? form.entryFee; });
    setDraftFees(m);
    setFeeOpen(true);
  };
  // 적용 — draft 값을 form.divisions[].fee 로 반영(3단계 카드와 동일 state → 양방향)
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
  // 다음 — info 단계에서만 대회명 필수(정본 soft 검증)
  const next = () => {
    if (cur.id === "info" && !form.name.trim()) {
      setErrMsg("대회 이름을 입력하세요.");
      return;
    }
    go(step + 1);
  };

  // 종별 CRUD = DivisionsEditor(공용) 가 onChange 로 처리 → form.divisions 갱신.

  // 장소 추가/수정/삭제
  const addVenue = (name: string) => {
    const nm = name.trim();
    if (!nm) return;
    patch("venues", [...form.venues, { id: uid("v"), name: nm, region: "", courtCount: 1, naming: "num" }]);
  };
  const setVenue = (id: string, p: Partial<Venue>) => patch("venues", form.venues.map((v) => (v.id === id ? { ...v, ...p } : v)));
  const removeVenue = (id: string) => patch("venues", form.venues.filter((v) => v.id !== id));
  // 일정 추가(date 입력)·코트 토글
  const addDate = (date: string) => {
    if (!date || form.dates.some((d) => d.date === date)) return;
    patch("dates", [...form.dates, { id: uid("dt"), date, courtIds: [] }].sort((a, b) => a.date.localeCompare(b.date)));
  };
  // 캘린더 셀 토글 — 이미 선택된 날이면 제거(removeDate), 아니면 추가(addDate). form.dates = SOT.
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

  // 검토 요약(정본 publish 체크리스트 대체 — 실 입력값 요약)
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

  // ── 제출(POST /api/web/tournaments · camel · rawBody) ──────────
  const submit = async () => {
    setErrMsg(null);
    if (!form.name.trim()) {
      setErrMsg("대회 이름은 필수입니다.");
      setStep(0);
      return;
    }
    const validDivs = form.divisions.filter((d) => d.label.trim());
    if (validDivs.length === 0) {
      setErrMsg("종별을 1개 이상 추가하세요.");
      setStep(2);
      return;
    }
    if (form.rosterMin > form.rosterMax) {
      setErrMsg("최소 선수는 최대 선수보다 클 수 없습니다.");
      setStep(3);
      return;
    }

    // 종별 → categories/divCaps/divFees (createTournament 계약: division-rule-sync.ts)
    //   ★ category(소속 종별명) 로 그룹핑 → categories={종별명:[디비전명,...]}.
    //     종별명 = AdminCategory.name(+성별) → 서버가 ages 매칭해 연령 자동채움.
    //     category 없는(직접 추가) 디비전은 자기 자신이 종별(=구 동작 보존).
    //   divCaps/divFees 키는 디비전명. code/label = 디비전명.
    const categories: Record<string, string[]> = {};
    const divCaps: Record<string, number> = {};
    const divFees: Record<string, number> = {};
    validDivs.forEach((d) => {
      const divName = d.label.trim();
      const catName = (d.category && d.category.trim()) || divName;
      (categories[catName] ||= []).push(divName);
      if (d.cap != null) divCaps[divName] = d.cap;
      divFees[divName] = d.fee;
    });

    const dates = [...form.dates].sort((a, b) => a.date.localeCompare(b.date));
    // 장소 jsonb(verbatim camel — operate/공개 사이트가 courtCount 로 읽음)
    const places = form.venues.map((v) => ({
      id: v.id,
      name: v.name,
      region: v.region,
      courtCount: v.courtCount,
      naming: v.naming,
    }));
    // 일정 jsonb — 정본 ct-create 계약(court_ids snake 키)·operate 가 court_ids/courtIds 호환
    const scheduleDates = dates.map((d) => ({ id: d.id, date: d.date, court_ids: d.courtIds }));

    setSaving(true);
    try {
      // rawBody:true — 엔드포인트가 camelCase body 를 기대(zod 없는 raw destructure).
      //   adminFetch 기본 camel→snake 변환을 우회해 키를 verbatim 전송.
      const result = await adminFetch<{ success?: boolean; tournamentId?: string; redirectUrl?: string }>(
        "/api/web/tournaments",
        {
          method: "POST",
          rawBody: true,
          body: {
            name: form.name.trim(),
            format: form.format,
            organizer: form.organizer || undefined,
            host: form.host || undefined,
            sponsors: form.sponsors || undefined,
            description: form.description || undefined,
            startDate: review.startDate || undefined,
            endDate: review.endDate || undefined,
            registrationStartAt: form.regStart || undefined,
            registrationEndAt: form.regEnd || undefined,
            places: places.length ? places : undefined,
            scheduleDates: scheduleDates.length ? scheduleDates : undefined,
            gameBall: form.gameBall || undefined,
            teamSize: form.teamSize,
            rosterMin: form.rosterMin,
            rosterMax: form.rosterMax,
            rules: form.rules || undefined,
            prizeInfo: form.prize || undefined,
            gameRules: form.gameRules,
            categories,
            divCaps: Object.keys(divCaps).length ? divCaps : undefined,
            divFees,
            entryFee: form.entryFee || undefined,
            bankName: form.bankName || undefined,
            bankAccount: form.bankAccount || undefined,
            bankHolder: form.bankHolder || undefined,
            feeNotes: form.feeNotes || undefined,
            autoApproveTeams: form.autoApprove || undefined,
            allowWaitingList: form.allowWaiting || undefined,
          },
        }
      );
      // 성공 → 생성된 대회 운영 워크스페이스(R4)로 이동. 없으면 목록 폴백.
      if (result?.tournamentId) {
        router.push(`/v2/operate/${result.tournamentId}`);
      } else {
        router.push("/v2/ta/tournaments");
      }
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : "대회 생성 중 오류가 발생했습니다.";
      setErrMsg(msg);
      toast(msg);
      setSaving(false);
    }
  };

  const stateMsg = saving
    ? "대회를 생성하는 중입니다"
    : errMsg
      ? errMsg
      : `${step + 1} / ${STEPS.length} 단계`;

  return (
    <div>
      {/* 헤더 (PageHead 구조 — ts-ph) */}
      <div className="ts-ph" style={{ marginBottom: 16 }}>
        <div className="ts-ph__row">
          <div>
            <div className="ts-ph__eyebrow">대회 관리자 · 새 대회 만들기</div>
            <div className="ts-ph__title">새 대회 만들기</div>
            <div className="ts-ph__sub">5단계로 대회를 생성합니다. 생성 후 대진·일정·운영은 운영 워크스페이스에서 이어집니다.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* 기존 대회 복사 — copyableList 가 있을 때만 노출 */}
            {copyableList && copyableList.length > 0 && (
              <Btn variant="secondary" size="sm" icon="copy" onClick={() => setCopyOpen(true)}>
                기존 대회 복사
              </Btn>
            )}
            <Btn variant="secondary" size="sm" icon="x" onClick={() => router.push("/v2/ta/tournaments")}>
              생성 취소
            </Btn>
          </div>
        </div>
        {/* 복사 진입 안내 — ?copyFrom 으로 prefill 된 경우 */}
        {copiedFromName && (
          <div className="ops-note" style={{ marginTop: 12 }}>
            <Icon name="copy" size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span>
              <b>{copiedFromName}</b> 대회 설정을 복사했습니다. 대회 이름·일정·접수기간은 비어 있으니 새로 입력하세요.
            </span>
          </div>
        )}
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
            {/* 일정 — 월 캘린더에서 날짜를 복수 선택(클릭 토글). 선택 날짜는 아래 카드로 펼침 */}
            <div className="ts-field">
              <span className="ts-field__label">대회 일정</span>
              <MonthCalendar selected={form.dates.map((d) => d.date)} onToggle={toggleDate} />
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

        {/* 3) 종별·정원 */}
        {cur.id === "divisions" && (
          <div className="ct-form">
            <div className="ct-form-grid">
              <Field label="대회 방식" span2>
                <select className="ts-select" value={form.format} onChange={(e) => patch("format", e.target.value)}>
                  {ALLOWED_FORMATS.map((f) => <option key={f} value={f}>{FORMAT_LABEL[f]}</option>)}
                </select>
              </Field>
            </div>
            {/* 종별 에디터(공용) — 템플릿(AdminCategory)/직접 추가·연령 자동채움 구조 생성 */}
            <DivisionsEditor
              divisions={form.divisions}
              onChange={(v) => patch("divisions", v)}
              defaultFee={form.entryFee || 60000}
              toast={toast}
            />
            <div className="ops-note" style={{ marginTop: 4 }}>
              <Icon name="info" size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} />
              <span>대진 생성·조 편성·일정 배치는 대회 생성 후 <b>운영 워크스페이스</b>에서 처리합니다.</span>
            </div>
          </div>
        )}

        {/* 4) 대진방식(경기설정) — 경기 규칙 19키(ct-game-settings.tsx min/max/step 1:1) */}
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

        {/* 5) 접수·검토 */}
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
              {review.divisions === 0 && (
                <div className="ops-warn" style={{ marginTop: 10 }}>
                  <Icon name="alert-triangle" size={16} color="var(--warn)" style={{ flex: "0 0 auto", marginTop: 1 }} />
                  <span><b>종별</b>을 1개 이상 추가해야 대회를 생성할 수 있습니다.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 푸터 — 이전 / 상태 / 다음·생성 (정본 tw-foot) */}
      <div className="tw-foot">
        <Btn variant="secondary" icon="chevron-left" disabled={step === 0} onClick={() => go(step - 1)}>이전</Btn>
        <div className="tw-foot__mid">
          <span className="ct-savebar__state">{stateMsg}</span>
          {errMsg && <span className="tw-msg" data-tone="err">{errMsg}</span>}
        </div>
        {step < STEPS.length - 1 ? (
          <Btn iconRight="chevron-right" onClick={next}>다음</Btn>
        ) : (
          <Btn icon="check" disabled={saving} onClick={submit}>{saving ? "생성 중" : "대회 생성"}</Btn>
        )}
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
                <div className="ct-feerow__nm">{d.label}<span className="ct-feerow__cap">정원 {d.cap != null ? `${d.cap}팀` : "무제한"} · {FORMAT_LABEL[form.format] || form.format}</span></div>
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

      {/* 기존 대회 복사 피커 — 선택 시 ?copyFrom 으로 재진입(서버 prefill) */}
      {copyableList && (
        <Modal
          open={copyOpen}
          onClose={() => setCopyOpen(false)}
          title="기존 대회 복사"
          sub="설정을 가져올 대회를 선택하세요. 대회 이름·일정·접수기간을 제외한 종별·경기설정·접수설정이 복사됩니다."
        >
          {copyableList.length === 0 ? (
            <div className="ct-emptybox">복사할 수 있는 대회가 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
              {copyableList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="ts-card ts-card--flat"
                  style={{ textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  onClick={() => {
                    setCopyOpen(false);
                    // 서버 재진입 → buildCopyForm prefill. (클라 0 새 API)
                    router.push(`/v2/ta/tournaments/new?copyFrom=${c.id}`);
                  }}
                >
                  <Icon name="trophy" size={16} color="var(--ink-mute)" style={{ flex: "0 0 auto" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{c.dateLabel}</span>
                  </span>
                  <Badge tone="grey">{c.statusLabel}</Badge>
                  <Icon name="chevron-right" size={16} color="var(--ink-dim)" style={{ flex: "0 0 auto" }} />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── 장소 직접 추가 입력(정본 VenueSearch 의 mock 체육관 DB 제외·실 입력만) ── (R5-B 재사용 export)
export function VenueAdd({ onAdd }: { onAdd: (name: string) => void }) {
  const [q, setQ] = useState("");
  const commit = () => {
    if (!q.trim()) return;
    onAdd(q.trim());
    setQ("");
  };
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <input
        className="ts-input"
        style={{ flex: 1, minWidth: 0 }}
        value={q}
        placeholder="경기장명 입력 후 추가"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (!e.nativeEvent.isComposing && e.key === "Enter") { e.preventDefault(); commit(); } }}
      />
      <Btn variant="secondary" icon="plus" onClick={commit}>추가</Btn>
    </div>
  );
}

// ── 월 캘린더(복수 날짜 토글 — 정본 CalendarModal 대체) ── (R5-B 재사용 export)
//   ★ form.dates 가 source-of-truth. 셀 클릭 → onToggle("YYYY-MM-DD") →
//     부모가 있으면 removeDate / 없으면 addDate. 선택 날짜 = primary 하이라이트.
//   표준 월 그리드(일~토 7열) + 이전/다음 월 네비. 일반 컴포넌트라 new Date() 사용 가능(워크플로 아님).
export function MonthCalendar({ selected, onToggle }: { selected: string[]; onToggle: (date: string) => void }) {
  // 표시 월 커서(해당 월 1일 기준). 초기 = 선택된 첫 날짜의 월, 없으면 이번 달.
  const [cursor, setCursor] = useState<Date>(() => {
    const first = [...selected].sort()[0];
    const base = first ? new Date(first + "T00:00:00") : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-based
  const pad = (n: number) => String(n).padStart(2, "0");
  // 셀 day(1~말일) → "YYYY-MM-DD" (로컬 기준 — UTC 변환 없이 표시-저장 일관)
  const dstr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=일 … 6=토
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 다음달 0일 = 이번달 말일
  const sel = new Set(selected); // 선택 여부 O(1) 조회
  // 오늘(로컬) 강조용
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  // 그리드 셀 = 앞 빈칸(이전 달 자리) + 1~말일
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 이전/다음 월 이동(delta = -1/+1) — 월 오버플로는 Date 가 자동 보정
  const move = (delta: number) => setCursor(new Date(year, month + delta, 1));
  return (
    <div className="ct-cal">
      <div className="ct-cal__head">
        <button type="button" className="ct-cal__nav" onClick={() => move(-1)} aria-label="이전 달"><Icon name="chevron-left" size={18} /></button>
        <span className="ct-cal__title">{year}년 {month + 1}월</span>
        <button type="button" className="ct-cal__nav" onClick={() => move(1)} aria-label="다음 달"><Icon name="chevron-right" size={18} /></button>
      </div>
      <div className="ct-cal__grid">
        {/* 요일 헤더(일~토) — 주말 dim */}
        {WK.map((w, i) => (
          <span key={w} className="ct-cal__wk" data-wend={i === 0 || i === 6}>{w}</span>
        ))}
        {/* 날짜 셀 — 빈칸은 비활성 placeholder */}
        {cells.map((day, i) =>
          day == null ? (
            <span key={"e" + i} className="ct-cal__cell ct-cal__cell--empty" />
          ) : (
            <button
              key={day}
              type="button"
              className="ct-cal__cell"
              data-on={sel.has(dstr(day))}
              data-today={dstr(day) === todayStr}
              onClick={() => onToggle(dstr(day))}
            >
              {day}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ct-metric" style={{ background: "var(--grey-50)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-mute)" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginTop: 2, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}
