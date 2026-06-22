"use client";

// =====================================================================
// ct-schedule-venue.tsx — 새 대회 만들기 좌측 "대회 일정·장소" 블록 (Phase 4 B-2)
//   박제 source: _deliver_CreateTournament/create-tournament.jsx
//     (VenueSearch / ScheduleVenue / CalendarModal + Stepper / SegSm)
//
//   ⚠ 이식 변경점 (왜):
//   - 시안의 window.Stepper / window.SegSm 전역 노출 → 본 파일 내 named 컴포넌트로 이식.
//   - 시안 jsx → TS strict 타입 부여. Icon/Modal/Btn 은 @/components/admin-toss 키트 사용.
//   - VENUE_DB(경기장 자동완성)는 시안 mockup 데이터 그대로 유지(지도 API 연동은 후속).
//   - 제출(POST) 배선 없음 — 부모(ct-create-tournament)가 venues/dates state 를 소유하고
//     본 컴포넌트는 콜백으로만 갱신. 실제 POST 변환은 B-4 에서.
// =====================================================================

import React from "react";
import { Icon, Btn, Modal } from "@/components/admin-toss";

// ── 타입 ──────────────────────────────────────────────────────────────
export type Venue = {
  id: string;
  name: string;
  region: string;
  courtCount: number;
  naming: "num" | "alpha";
};
export type DateRow = {
  id: string;
  date: string; // YYYY-MM-DD
  courtIds: string[];
};
export type Court = {
  id: string; // `${venueId}_c${idx}` — B-1 scheduleDates.court_ids 규격
  label: string;
  full: string;
  venueId: string;
};

// ── 경기장 검색 DB (코트 마스터 mockup · 지도 API 연결 예정) ───────────
const VENUE_DB: { name: string; region: string }[] = [
  { name: "장충체육관", region: "서울 중구" },
  { name: "잠실학생체육관", region: "서울 송파구" },
  { name: "올림픽공원 핸드볼경기장", region: "서울 송파구" },
  { name: "목동 실내체육관", region: "서울 양천구" },
  { name: "성동구민종합체육관", region: "서울 성동구" },
  { name: "강남구민체육관", region: "서울 강남구" },
  { name: "서초구민체육관", region: "서울 서초구" },
  { name: "마포구민체육센터", region: "서울 마포구" },
  { name: "안양실내체육관", region: "경기 안양시" },
  { name: "수원실내체육관", region: "경기 수원시" },
  { name: "인천삼산월드체육관", region: "인천 부평구" },
];

// ── 유틸 (시안 1:1) ───────────────────────────────────────────────────
export const ctUid = (p: string) =>
  `${p}${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

// 코트 접미사 — 숫자(1,2..) 또는 알파벳(A,B..)
const courtSuffix = (venue: Venue, i: number) =>
  venue.naming === "alpha" ? String.fromCharCode(65 + i) : String(i + 1);

// 한 장소의 코트 목록 — id 형식 `${venueId}_c${idx}` (B-1 court_ids 규격과 동일)
export function courtsOf(venue: Venue): Court[] {
  const cnt = Math.max(1, venue.courtCount || 1);
  if (cnt === 1)
    return [{ id: `${venue.id}_c0`, label: venue.name, full: venue.name, venueId: venue.id }];
  return Array.from({ length: cnt }, (_, i) => {
    const c = `${courtSuffix(venue, i)}코트`;
    return { id: `${venue.id}_c${i}`, label: c, full: `${venue.name} ${c}`, venueId: venue.id };
  });
}
export const allCourts = (venues: Venue[]): Court[] => venues.flatMap(courtsOf);

const _CAL_WK = ["일", "월", "화", "수", "목", "금", "토"];
const _pad2 = (n: number) => String(n).padStart(2, "0");
const _dkey = (y: number, m: number, d: number) => `${y}-${_pad2(m + 1)}-${_pad2(d)}`;
const fmtDateFull = (s: string) => {
  if (!s) return "날짜 미정";
  const dt = new Date(s + "T00:00:00");
  if (isNaN(dt.getTime())) return s;
  return `${dt.getFullYear()}.${_pad2(dt.getMonth() + 1)}.${_pad2(dt.getDate())} (${_CAL_WK[dt.getDay()]})`;
};

// ── Stepper (코트 수 1~8) ─────────────────────────────────────────────
function Stepper({
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="ct-stepper">
      <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="감소">
        <Icon name="minus" size={17} />
      </button>
      <span className="ct-stepper__val">
        {value}
        {unit && <span className="u">{unit}</span>}
      </span>
      <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="증가">
        <Icon name="plus" size={17} />
      </button>
    </div>
  );
}

// ── SegSm (명칭 = 숫자 / 알파벳) ──────────────────────────────────────
function SegSm({
  options,
  index,
  onSelect,
}: {
  options: string[];
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="ct-segsm">
      {options.map((o, i) => (
        <button key={o} type="button" data-active={i === index ? "true" : "false"} onClick={() => onSelect(i)}>
          {o}
        </button>
      ))}
    </div>
  );
}

// ── 경기장 검색 (자동완성 + 직접 추가) ────────────────────────────────
function VenueSearch({
  venues,
  onAdd,
}: {
  venues: Venue[];
  onAdd: (name: string, region: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const ql = q.trim().toLowerCase();
  const names = venues.map((v) => v.name);
  const results = VENUE_DB.filter(
    (v) => !names.includes(v.name) && (v.name + " " + v.region).toLowerCase().includes(ql),
  ).slice(0, 8);
  const exact = VENUE_DB.some((v) => v.name === q.trim()) || names.includes(q.trim());
  const pick = (name: string, region: string) => {
    onAdd(name, region);
    setQ("");
    setOpen(false);
  };
  return (
    <div className="ct-vsearch">
      <div className="ct-vsearch__inputwrap">
        <Icon name="search" size={18} color="var(--ink-dim)" />
        <input
          value={q}
          placeholder="경기장명·지역으로 검색 (지도 연결 예정)"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            // 한글 IME 가드 — composition 중 Enter 는 confirm 용 (CLAUDE.md i18n 룰)
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter" && q.trim()) {
              e.preventDefault();
              pick(q.trim(), "");
            }
          }}
        />
        {q && (
          <button type="button" className="ct-iconbtn" onMouseDown={(e) => e.preventDefault()} onClick={() => setQ("")} aria-label="지우기">
            <Icon name="x" size={15} />
          </button>
        )}
      </div>
      {open && (results.length > 0 || (ql && !exact)) && (
        <div className="ct-vsearch__menu">
          {results.map((v) => (
            <button key={v.name} type="button" className="ct-vsearch__opt" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(v.name, v.region)}>
              <Icon name="map-pin" size={16} color="var(--primary)" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{v.name}</span>
                <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{v.region}</span>
              </span>
            </button>
          ))}
          {ql && !exact && (
            <button type="button" className="ct-vsearch__opt ct-vsearch__add" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(q.trim(), "")}>
              <Icon name="plus" size={16} color="var(--primary)" />
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>“{q.trim()}” 직접 추가</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── 캘린더 다중 선택 모달 ─────────────────────────────────────────────
function CalendarModal({
  open,
  selected,
  onClose,
  onConfirm,
}: {
  open: boolean;
  selected: string[];
  onClose: () => void;
  onConfirm: (dates: string[]) => void;
}) {
  const [sel, setSel] = React.useState<Set<string>>(() => new Set(selected));
  const [cur, setCur] = React.useState(() => {
    const s0 = selected.slice().sort()[0];
    const base = s0 ? new Date(s0 + "T00:00:00") : new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  React.useEffect(() => {
    if (!open) return;
    setSel(new Set(selected));
    const s0 = selected.slice().sort()[0];
    const base = s0 ? new Date(s0 + "T00:00:00") : new Date();
    setCur({ y: base.getFullYear(), m: base.getMonth() });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const startWd = new Date(cur.y, cur.m, 1).getDay();
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const now = new Date();
  const todayK = _dkey(now.getFullYear(), now.getMonth(), now.getDate());
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let dd = 1; dd <= days; dd++) cells.push(dd);
  const toggle = (dd: number) => {
    const k = _dkey(cur.y, cur.m, dd);
    const ns = new Set(sel);
    if (ns.has(k)) ns.delete(k);
    else ns.add(k);
    setSel(ns);
  };
  const move = (delta: number) => {
    let m = cur.m + delta;
    let y = cur.y;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setCur({ y, m });
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="대회 일정 선택"
      maxWidth={440}
      sub="경기가 열리는 날짜를 여러 날 선택하세요. 선택된 날짜를 다시 누르면 해제됩니다."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            취소
          </Btn>
          <Btn icon="check" style={{ flex: 2 }} onClick={() => onConfirm([...sel])}>
            선택 완료 ({sel.size}일)
          </Btn>
        </>
      }
    >
      <div className="ct-cal">
        <div className="ct-cal__nav">
          <button type="button" onClick={() => move(-1)} aria-label="이전 달">
            <Icon name="chevron-left" size={18} />
          </button>
          <span className="ct-cal__title">
            {cur.y}년 {cur.m + 1}월
          </span>
          <button type="button" onClick={() => move(1)} aria-label="다음 달">
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
        <div className="ct-cal__wk">
          {_CAL_WK.map((w, i) => (
            <span key={w} data-wd={i}>
              {w}
            </span>
          ))}
        </div>
        <div className="ct-cal__grid">
          {cells.map((dd, i) => {
            if (dd === null) return <span key={"e" + i} className="ct-cal__pad" />;
            const k = _dkey(cur.y, cur.m, dd);
            const wd = (startWd + dd - 1) % 7;
            return (
              <button
                key={k}
                type="button"
                className="ct-cal__day"
                data-on={sel.has(k) ? "true" : "false"}
                data-today={k === todayK ? "true" : "false"}
                data-wd={wd}
                onClick={() => toggle(dd)}
              >
                {dd}
              </button>
            );
          })}
        </div>
        {sel.size > 0 && (
          <div className="ct-cal__count">
            <Icon name="calendar-check" size={14} color="var(--primary)" />
            {sel.size}일 선택됨
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── 메인 — 대회 일정 · 장소 섹션 (좌측) ───────────────────────────────
export function ScheduleVenue({
  dates,
  venues,
  courts,
  syncDates,
  removeDate,
  addVenue,
  updateVenue,
  removeVenue,
  toggleDateCourt,
}: {
  dates: DateRow[];
  venues: Venue[];
  courts: Court[];
  syncDates: (dateStrings: string[]) => void;
  removeDate: (id: string) => void;
  addVenue: (name: string, region: string) => void;
  updateVenue: (id: string, patch: Partial<Venue>) => void;
  removeVenue: (id: string) => void;
  toggleDateCourt: (dateId: string, courtId: string) => void;
}) {
  const [calOpen, setCalOpen] = React.useState(false);
  return (
    <section className="ts-card">
      {/* 카드 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
        <span className="ct-headicon">
          <Icon name="calendar-days" size={18} color="var(--primary)" />
        </span>
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          대회 일정 · 장소
        </span>
      </div>

      {/* 장소 · 코트 */}
      <div className="ts-field">
        <label className="ts-field__label">
          장소 · 코트<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
        </label>
        <VenueSearch venues={venues} onAdd={addVenue} />
        {venues.length === 0 ? (
          <div className="ct-emptybox">
            <Icon name="map-pin-off" size={22} color="var(--ink-dim)" />
            <span>등록된 장소가 없습니다</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {venues.map((v) => (
              <div key={v.id} className="ct-venuerow">
                <div className="ct-venuerow__top">
                  <Icon name="map-pin" size={15} color="var(--primary)" />
                  <span className="ct-venuerow__nm">{v.name}</span>
                  {v.region && <span className="ct-venuerow__rg">{v.region}</span>}
                  <button type="button" className="ct-iconbtn" onClick={() => removeVenue(v.id)} aria-label="장소 삭제">
                    <Icon name="x" size={15} />
                  </button>
                </div>
                <div className="ct-venuerow__ctrl">
                  <span className="ct-venuerow__lbl">코트 수</span>
                  <Stepper value={v.courtCount || 1} unit="개" min={1} max={8} onChange={(n) => updateVenue(v.id, { courtCount: n })} />
                  {(v.courtCount || 1) >= 2 && (
                    <div className="ct-namesel">
                      <span className="ct-venuerow__lbl">명칭</span>
                      <SegSm
                        options={["숫자", "알파벳"]}
                        index={v.naming === "alpha" ? 1 : 0}
                        onSelect={(i) => updateVenue(v.id, { naming: i === 1 ? "alpha" : "num" })}
                      />
                    </div>
                  )}
                </div>
                {(v.courtCount || 1) >= 2 && (
                  <div className="ct-courtchips">
                    {courtsOf(v).map((c) => (
                      <span key={c.id} className="ct-courttag">
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="ts-field__hint">장소를 등록하고 코트 수를 지정하세요 · 한 장소에 여러 코트 가능</div>
      </div>

      {/* 대회 일정 (캘린더 다중 선택 · 날짜별 코트 배정) */}
      <div className="ts-field">
        <label className="ts-field__label">
          대회 일정<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
        </label>
        {dates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            {dates.map((dt, i) => (
              <div key={dt.id} className="ct-dateblock">
                <div className="ct-dateblock__head">
                  <span className="ct-daterow__idx">{i + 1}일차</span>
                  <span className="ct-daterow__label">{fmtDateFull(dt.date)}</span>
                  <span className="ct-dateblock__n">{(dt.courtIds || []).length}코트</span>
                  <button type="button" className="ct-iconbtn" onClick={() => removeDate(dt.id)} aria-label="날짜 삭제">
                    <Icon name="x" size={15} />
                  </button>
                </div>
                {courts.length > 0 ? (
                  <div className="ct-courtpick">
                    {courts.map((c) => {
                      const on = (dt.courtIds || []).includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className="ct-courtpick__chip"
                          data-on={on ? "true" : "false"}
                          onClick={() => toggleDateCourt(dt.id, c.id)}
                        >
                          {on && <Icon name="check" size={12} />}
                          {c.full}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ct-courthint">
                    <Icon name="info" size={13} />
                    장소·코트를 먼저 등록하면 날짜별로 코트를 배정할 수 있습니다
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button type="button" className="ct-adddate" onClick={() => setCalOpen(true)}>
          <Icon name="calendar-plus" size={16} />
          일정 선택{dates.length > 0 ? ` · ${dates.length}일` : ""}
        </button>
        <div className="ts-field__hint">캘린더에서 경기일을 선택 · 날짜별로 코트를 배정하세요</div>
      </div>

      <CalendarModal
        open={calOpen}
        selected={dates.map((dt) => dt.date).filter(Boolean)}
        onClose={() => setCalOpen(false)}
        onConfirm={(ds) => {
          syncDates(ds);
          setCalOpen(false);
        }}
      />
    </section>
  );
}
