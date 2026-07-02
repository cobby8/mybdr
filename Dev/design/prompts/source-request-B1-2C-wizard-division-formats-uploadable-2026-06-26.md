# B1.2C Creation Wizard and Division Formats - Uploadable Markdown

Use this file after B1/B1.1 analysis. It contains only the remaining source files requested by Claude.ai.

## Request

- Update _qa/current-src-inventory.md with B1.2C source measurements.
- Extend _qa/reverse-bake-gap.md with B1.2C findings.
- Extend _qa/bake-fix-checklist-B1.md with B1.2C BDR-current reverse-bake steps.
- Keep scope to BDR-current reverse-bake checklist. Do not propose runtime API, Prisma, or route changes.
- Translate Toss/lucide/rounded-full/ui-kit patterns into BDR 13-rule equivalents in the checklist.

## Files

### File: src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-schedule-venue.tsx

````tsx
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
  provider?: "kakao" | "google";
  placeId?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  category?: string;
  mapUrl?: string;
  routeUrl?: string;
};
export type VenueDraft = Omit<Venue, "id" | "courtCount" | "naming"> & {
  id?: string;
  courtCount?: number;
  naming?: "num" | "alpha";
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

export function venueFromDraft(draft: VenueDraft): Venue {
  return {
    id: draft.id ?? ctUid("v"),
    name: draft.name.trim(),
    region: draft.region?.trim() ?? "",
    courtCount: Math.max(1, Number(draft.courtCount) || 1),
    naming: draft.naming === "alpha" ? "alpha" : "num",
    provider: draft.provider,
    placeId: draft.placeId,
    lat: draft.lat,
    lng: draft.lng,
    phone: draft.phone,
    category: draft.category,
    mapUrl: draft.mapUrl,
    routeUrl: draft.routeUrl,
  };
}

export function serializeVenue(venue: Venue) {
  return {
    id: venue.id,
    name: venue.name.trim(),
    region: venue.region.trim(),
    courtCount: Math.max(1, Number(venue.courtCount) || 1),
    naming: venue.naming === "alpha" ? "alpha" : "num",
    provider: venue.provider,
    placeId: venue.placeId,
    lat: venue.lat,
    lng: venue.lng,
    phone: venue.phone,
    category: venue.category,
    mapUrl: venue.mapUrl,
    routeUrl: venue.routeUrl,
  };
}

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

type PlaceSearchResult = {
  place_id: string;
  name: string;
  address: string;
  provider?: "kakao" | "google";
  lat?: number;
  lng?: number;
  phone?: string;
  category?: string;
  map_url?: string;
  route_url?: string;
};

// ── 경기장 검색 (카카오 장소 검색 + 직접 추가) ────────────────────────
function VenueSearch({
  venues,
  onAdd,
}: {
  venues: Venue[];
  onAdd: (venue: VenueDraft) => void;
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<PlaceSearchResult[]>([]);
  const ql = q.trim().toLowerCase();
  const registeredNames = venues.map((v) => v.name.trim());
  const registeredPlaceIds = new Set(venues.map((v) => v.placeId).filter(Boolean));
  const localResults = ql
    ? VENUE_DB.filter(
        (v) =>
          !registeredNames.includes(v.name) &&
          (v.name + " " + v.region).toLowerCase().includes(ql),
      ).slice(0, 8)
    : [];
  const filteredResults = results.filter(
    (v) => !registeredNames.includes(v.name.trim()) && !registeredPlaceIds.has(v.place_id),
  );
  const exact = registeredNames.includes(q.trim());

  React.useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/web/place-search?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults((data.results ?? []) as PlaceSearchResult[]);
      } catch (error) {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const pick = (venue: VenueDraft) => {
    onAdd(venue);
    setQ("");
    setOpen(false);
    setResults([]);
  };
  const pickPlace = (place: PlaceSearchResult) => {
    pick({
      name: place.name,
      region: place.address,
      provider: place.provider,
      placeId: place.place_id,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      category: place.category,
      mapUrl: place.map_url,
      routeUrl: place.route_url,
    });
  };
  return (
    <div className="ct-vsearch">
      <div className="ct-vsearch__inputwrap">
        <Icon name="search" size={18} color="var(--ink-dim)" />
        <input
          value={q}
          placeholder="경기장명·주소 검색"
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
              pick({ name: q.trim(), region: "" });
            }
          }}
        />
        {loading && <span className="ct-spin" aria-label="검색 중" />}
        {q && (
          <button type="button" className="ct-iconbtn" onMouseDown={(e) => e.preventDefault()} onClick={() => setQ("")} aria-label="지우기">
            <Icon name="x" size={15} />
          </button>
        )}
      </div>
      {open && (loading || filteredResults.length > 0 || localResults.length > 0 || (ql && !exact)) && (
        <div className="ct-vsearch__menu">
          {filteredResults.map((v) => (
            <button key={v.place_id} type="button" className="ct-vsearch__opt" onMouseDown={(e) => e.preventDefault()} onClick={() => pickPlace(v)}>
              <Icon name="map-pin" size={16} color="var(--primary)" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{v.name}</span>
                <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{v.address || "주소 정보 없음"}</span>
              </span>
              {v.provider === "kakao" && <span className="ct-courttag">지도</span>}
            </button>
          ))}
          {filteredResults.length === 0 && localResults.map((v) => (
            <button key={v.name} type="button" className="ct-vsearch__opt" onMouseDown={(e) => e.preventDefault()} onClick={() => pick({ name: v.name, region: v.region })}>
              <Icon name="map-pin" size={16} color="var(--primary)" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{v.name}</span>
                <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{v.region}</span>
              </span>
            </button>
          ))}
          {ql && !exact && (
            <button type="button" className="ct-vsearch__opt ct-vsearch__add" onMouseDown={(e) => e.preventDefault()} onClick={() => pick({ name: q.trim(), region: "" })}>
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
  embedded = false,
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
  embedded?: boolean;
  syncDates: (dateStrings: string[]) => void;
  removeDate: (id: string) => void;
  addVenue: (venue: VenueDraft) => void;
  updateVenue: (id: string, patch: Partial<Venue>) => void;
  removeVenue: (id: string) => void;
  toggleDateCourt: (dateId: string, courtId: string) => void;
}) {
  const [calOpen, setCalOpen] = React.useState(false);
  return (
    <section className={embedded ? "ct-embedded-block" : "ts-card"}>
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
                  {v.mapUrl && (
                    <a href={v.mapUrl} target="_blank" rel="noopener noreferrer" className="ct-courttag">
                      지도
                    </a>
                  )}
                  {v.routeUrl && (
                    <a href={v.routeUrl} target="_blank" rel="noopener noreferrer" className="ct-courttag">
                      길안내
                    </a>
                  )}
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

````

### File: src/app/(admin)/tournament-admin/tournaments/new/wizard/_components/ct-game-settings.tsx

````tsx
"use client";

// =====================================================================
// ct-game-settings.tsx — 경기 설정 카드 (기록앱 정합 · Phase 4 B-3)
//   박제 source: _deliver_CreateTournament/ct-game-settings.jsx
//
//   ⚠ 왜 이렇게 짰나:
//   - controlled component: 부모(메인 폼)가 GameRules 객체를 소유하고
//     value/onChange 로만 주고받는다. 자체 state 0 (UniformModal 의 임시 hex 만 로컬).
//   - GAME_SETTINGS_DEFAULTS 정본을 "이 파일에서 export" — 통합 시 메인 폼이 import.
//   - shotClock = boolean (시안·B-2·B-1 game_rules jsonb 1:1 정합. PM 승인).
//   - 유니폼 hex 는 도메인 데이터(저지색) → DS 토큰 예외(하드코딩 허용 · 기록앱 동일 규칙).
//   - 그 외 색/여백은 inline var(--*) 토큰. toss-admin.css 편집 0 (재사용 .ct-* 만 참조).
// =====================================================================

import React from "react";
import { Icon, Btn, Badge, Modal } from "@/components/admin-toss";
import {
  GAME_RULE_DEFAULTS,
  GAME_RULE_PRESETS,
  applyGameRuleClockMode,
  applyGameRulePreset,
  type GameRulePreset,
  type TournamentGameRules,
} from "@/lib/tournaments/game-rules";

// ── GameRules 계약 (camelCase · B-1 game_rules jsonb 1:1) ────────────────
export type GameRules = TournamentGameRules;

// ── 경기 설정 기본값 (정본 export) — 통합 시 메인 폼이 import 해 일원화 ───
//   값 출처: game_rules.dart GameRules.defaults (유니폼만 의뢰 디폴트).
export const GAME_SETTINGS_DEFAULTS: GameRules = GAME_RULE_DEFAULTS;

const LIGHT_UNIFORM_COLOR = "#FFFFFF";
const DARK_UNIFORM_COLOR = "#1A1E27";

// ── 유니폼 16색 팔레트 (기록앱 showUniformPalette 큐레이션과 동일) ───────
//   [이름, hex]. 도메인 저지색 → hex 직접 사용 = 기록앱 승인 예외.
const UNIFORM_PALETTE: [string, string][] = [
  ["화이트", "#FFFFFF"], ["레드", "#E31B23"], ["블루", "#0F5FCC"], ["네이비", "#1B2A4A"],
  ["블랙", "#1A1E27"], ["그린", "#1CA05E"], ["옐로", "#E8A33B"], ["오렌지", "#E8821B"],
  ["퍼플", "#6D3AD1"], ["스카이", "#3DA9E0"], ["민트", "#19C3A6"], ["핑크", "#E85FA0"],
  ["그레이", "#8A93A0"], ["마룬", "#7A1620"], ["틸", "#0E7C86"], ["골드", "#C9A227"],
];

// 경기 시간 프리셋. 논스톱/올데드는 별도 운영 방식 축에서 조합한다.
const GAME_PRESETS = GAME_RULE_PRESETS;

// ── 휘도 유틸 (기록앱 1:1) ───────────────────────────────────────────────
function lum(hex: string): number {
  const s = (hex || "#000").replace("#", "");
  const n = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
// 휘도 기반 대비 잉크 (밝으면 어두운 잉크, 어두우면 흰 잉크)
const jerseyInk = (hex: string) => (lum(hex) > 165 ? "var(--ink)" : "#fff");
const toneOf = (hex: string) => (lum(hex) > 165 ? "밝은색" : "어두운색");
function hexName(hex: string): string {
  const up = (hex || "").toUpperCase();
  const f = UNIFORM_PALETTE.find((e) => e[1].toUpperCase() === up);
  return f ? f[0] : "사용자 지정";
}

// ── 공통 소품 ────────────────────────────────────────────────────────────
function CardHead({ icon, title, action }: { icon: string; title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span className="ct-headicon">
        <Icon name={icon} size={18} color="var(--primary)" />
      </span>
      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{title}</span>
      {action && <span style={{ marginLeft: "auto" }}>{action}</span>}
    </div>
  );
}

// 소제목 (유니폼 / 경기 방식 / 파울·타임아웃 구분)
function Subhead({ icon, label, hint }: { icon: string; label: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "12px 0 8px", fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)" }}>
      <Icon name={icon} size={15} color="var(--ink-mute)" />
      <span>{label}</span>
      {hint && <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: "var(--ink-dim)" }}>{hint}</span>}
    </div>
  );
}

// 스텝퍼 (숫자 증감) — 재사용 .ct-stepper 클래스
function Stepper({ value, unit, min, max, step = 1, onChange }: { value: number; unit: string; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="ct-stepper">
      <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="감소">
        <Icon name="minus" size={17} />
      </button>
      <span className="ct-stepper__val">
        {value}
        <span className="u">{unit}</span>
      </span>
      <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="증가">
        <Icon name="plus" size={17} />
      </button>
    </div>
  );
}

// 작은 세그먼트 토글 — 재사용 .ct-segsm 클래스
function SegSm({ options, index, onSelect }: { options: string[]; index: number; onSelect: (i: number) => void }) {
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

// 설정 행 (좌: 이름·힌트 / 우: 컨트롤) — inline 스타일(우측 전용)
function SetRow({ name, hint, control }: { name: string; hint?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{name}</div>
        {hint && <div style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 2 }}>{hint}</div>}
      </div>
      {control}
    </div>
  );
}

function RuleDetails({
  icon,
  title,
  summary,
  children,
}: {
  icon: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details className="ct-rule-details">
      <summary>
        <span className="ct-rule-details__title">
          <Icon name={icon} size={15} color="var(--ink-mute)" />
          {title}
        </span>
        <span className="ct-rule-details__summary">{summary}</span>
      </summary>
      {children}
    </details>
  );
}

// ── 유니폼 16색 선택 모달 (기록앱 showUniformPalette) ────────────────────
function UniformModal({ open, side, current, onClose, onPick }: { open: boolean; side: string; current: string; onClose: () => void; onPick: (hex: string) => void }) {
  const [hex, setHex] = React.useState(current || "#FFFFFF");
  React.useEffect(() => {
    if (open) setHex(current || "#FFFFFF");
  }, [open, current]);
  const valid = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(hex.trim());
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${side} 유니폼 색상`}
      sub="대회·팀 세팅 기본값입니다. 16색에서 고르거나 직접 입력하세요."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            취소
          </Btn>
          <Btn disabled={!valid} icon="check" style={{ flex: 2, opacity: valid ? 1 : 0.5 }} onClick={() => valid && onPick(hex.trim().toUpperCase())}>
            이 색으로 적용
          </Btn>
        </>
      }
    >
      {/* 16색 스와치 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
        {UNIFORM_PALETTE.map(([nm, hx]) => (
          <button
            key={hx}
            type="button"
            title={`${nm} ${hx}`}
            onClick={() => setHex(hx)}
            style={{
              aspectRatio: "1/1",
              borderRadius: 10,
              background: hx,
              border: hex.toUpperCase() === hx.toUpperCase() ? "2px solid var(--primary)" : "1px solid var(--border-strong)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            {hex.toUpperCase() === hx.toUpperCase() && <Icon name="check" size={18} color={jerseyInk(hx)} />}
          </button>
        ))}
      </div>
      {/* 직접 입력 (HEX) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
        <span style={{ width: 42, height: 42, borderRadius: 10, background: valid ? hex : "var(--grey-100)", border: "2px solid var(--border-strong)", flex: "0 0 auto" }} />
        <div style={{ flex: 1 }}>
          <div className="ts-field__label" style={{ marginBottom: 4 }}>
            직접 입력
          </div>
          <input
            className="ts-input"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#1B3C87"
            spellCheck={false}
            style={!valid && hex ? { boxShadow: "0 0 0 2px var(--danger)" } : undefined}
            onKeyDown={(e) => {
              // 한글 IME 가드 (hex 입력엔 한글 없지만 일관성 — 룰)
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") {
                e.preventDefault();
                if (valid) onPick(hex.trim().toUpperCase());
              }
            }}
          />
        </div>
        <div style={{ textAlign: "right", minWidth: 78 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{hexName(hex)}</div>
          <div style={{ fontSize: 11, fontFamily: "var(--ff-mono)", color: "var(--ink-mute)" }}>{(hex || "").toUpperCase()}</div>
        </div>
      </div>
    </Modal>
  );
}

// ── 유니폼 셀 (홈/원정) ─────────────────────────────────────────────────
function UniformCell({ team, hex, label, onClick }: { team: string; hex: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "var(--grey-50)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--ff)",
      }}
    >
      {/* 색 미리보기 칩 */}
      <span style={{ width: 30, height: 30, borderRadius: 9, background: hex, border: "2px solid var(--border-strong)", flex: "0 0 auto" }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--ink-mute)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-dim)" }}>{toneOf(hex)}</span>
      </span>
    </button>
  );
}

function UniformRuleCell({ label, tone, hex }: { label: string; tone: "밝은색" | "어두운색"; hex: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px",
        background: "var(--grey-50)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        fontFamily: "var(--ff)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: hex,
          border: "2px solid var(--border-strong)",
          flex: "0 0 auto",
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--ink-mute)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{tone}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-dim)" }}>유니폼 규칙</span>
      </span>
    </div>
  );
}

// =====================================================================
// 본체 (controlled) — props: { value: GameRules; onChange }
// =====================================================================
export function CtGameSettings({
  value,
  onChange,
  homeName = "홈팀",
  awayName = "원정팀",
}: {
  value: GameRules;
  onChange: (next: GameRules) => void;
  homeName?: string;
  awayName?: string;
}) {
  const d = value;
  // 단일 키 수정
  const set = <K extends keyof GameRules>(k: K, v: GameRules[K]) => onChange({ ...d, [k]: v });
  // 여러 키 동시 수정 (프리셋·색 교체)
  const setMany = (patch: Partial<GameRules>) => onChange({ ...d, ...patch });

  // 어느 유니폼 셀을 편집 중인지 ("home" | "away" | null)
  const activePreset = (p: GameRulePreset) =>
    d.quarterType === p.quarterType &&
    d.quarterMinutes === p.quarterMinutes;

  const homeColor = (d.homeColor || "").toUpperCase();
  const awayColor = (d.awayColor || "").toUpperCase();
  const isCanonicalUniform =
    (homeColor === LIGHT_UNIFORM_COLOR && awayColor === DARK_UNIFORM_COLOR) ||
    (homeColor === DARK_UNIFORM_COLOR && awayColor === LIGHT_UNIFORM_COLOR);
  const isSwappedUniform = homeColor === DARK_UNIFORM_COLOR && awayColor === LIGHT_UNIFORM_COLOR;
  const homeTone = isSwappedUniform ? "어두운색" : "밝은색";
  const awayTone = isSwappedUniform ? "밝은색" : "어두운색";

  React.useEffect(() => {
    if (!isCanonicalUniform) {
      setMany({ homeColor: LIGHT_UNIFORM_COLOR, awayColor: DARK_UNIFORM_COLOR });
    }
  }, [isCanonicalUniform]);

  const swapUniformRule = () => {
    setMany(
      isSwappedUniform
        ? { homeColor: LIGHT_UNIFORM_COLOR, awayColor: DARK_UNIFORM_COLOR }
        : { homeColor: DARK_UNIFORM_COLOR, awayColor: LIGHT_UNIFORM_COLOR },
    );
  };

  return (
    <section className="ts-card ct-game-rules-card">
      <CardHead icon="sliders-horizontal" title="경기 설정" action={<Badge tone="primary">기록앱 정합</Badge>} />

      <div className="ct-rule-topgrid">
        <div>
          {/* ── 유니폼 규칙 ── */}
          <Subhead icon="shirt" label="유니폼 규칙" hint="홈 밝은색 · 원정 어두운색" />
          <div style={{ display: "flex", gap: 10 }}>
            <UniformRuleCell label="홈" tone={homeTone} hex={isSwappedUniform ? DARK_UNIFORM_COLOR : LIGHT_UNIFORM_COLOR} />
            <UniformRuleCell label="원정" tone={awayTone} hex={isSwappedUniform ? LIGHT_UNIFORM_COLOR : DARK_UNIFORM_COLOR} />
          </div>
          {/* 홈·원정 색 교체 */}
          <button
            type="button"
            onClick={swapUniformRule}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              padding: "7px 11px",
              background: "var(--grey-100)",
              border: 0,
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--ink-soft)",
              fontFamily: "var(--ff)",
              cursor: "pointer",
            }}
          >
            <Icon name="arrow-left-right" size={16} />홈 · 원정 색 교체
          </button>
          {/* 조끼 제공 체크 */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 9, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={d.vestProvided}
              onChange={(e) => set("vestProvided", e.target.checked)}
              style={{ marginTop: 2, width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer", flex: "0 0 auto" }}
            />
            <span>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>팀 조끼(번호 조끼) 제공</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-mute)", marginTop: 1 }}>주최 측이 조끼를 지급하는 경우 선택</span>
            </span>
          </label>
        </div>

        <div>
          {/* ── 경기 방식 ── */}
          <Subhead icon="clock" label="경기 구성" hint="시간 · 쿼터" />
          {/* 프리셋 칩 */}
          <div className="ct-preset-grid">
            {GAME_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="ts-chip"
                data-active={activePreset(p) ? "true" : "false"}
                onClick={() => onChange(applyGameRulePreset(d, p))}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ct-rulegrid">
        <SetRow
          name="운영 방식"
          hint="논스톱=계속 진행 · 올데드=시계 정지"
          control={
            <SegSm
              options={["논스톱", "올데드"]}
              index={d.clockMode === "nonstop" ? 0 : 1}
              onSelect={(i) =>
                onChange(applyGameRuleClockMode(d, i === 0 ? "nonstop" : "dead"))
              }
            />
          }
        />
        <SetRow
          name="쿼터 수"
          hint="정규 쿼터 구성"
          control={
            <SegSm
              options={["4쿼터", "전후반"]}
              index={d.quarterType === "HALF" ? 1 : 0}
              onSelect={(i) =>
                onChange(
                  applyGameRulePreset(d, {
                    label: "",
                    quarterType: i === 1 ? "HALF" : "4Q",
                    quarterMinutes: d.quarterMinutes,
                    firstHalfTimeouts: d.firstHalfTimeouts,
                    secondHalfTimeouts: d.secondHalfTimeouts,
                  }),
                )
              }
            />
          }
        />
        <SetRow
          name="쿼터 시간"
          hint="분 / 쿼터"
          control={
            <Stepper
              value={d.quarterMinutes}
              unit="분"
              min={1}
              max={20}
              onChange={(v) =>
                onChange(
                  applyGameRulePreset(d, {
                    label: "",
                    quarterType: d.quarterType,
                    quarterMinutes: v,
                    firstHalfTimeouts: d.firstHalfTimeouts,
                    secondHalfTimeouts: d.secondHalfTimeouts,
                  }),
                )
              }
            />
          }
        />
        <SetRow name="연장 시간" hint="분 / 연장" control={<Stepper value={d.overtimeMinutes} unit="분" min={1} max={20} onChange={(v) => set("overtimeMinutes", v)} />} />
        <SetRow name="막판 득점 정지" hint="올데드에서만 적용" control={<Stepper value={d.lastScoreStopMin} unit="분" min={0} max={2} onChange={(v) => set("lastScoreStopMin", v)} />} />
        <SetRow name="샷클락" hint="24초 · 리바운드 14초" control={<SegSm options={["사용", "미사용"]} index={d.shotClockEnabled ? 0 : 1} onSelect={(i) => set("shotClockEnabled", i === 0)} />} />
      </div>

      <RuleDetails
        icon="flag"
        title="파울 · 타임아웃"
        summary={`개인 ${d.foulLimit} · 팀 ${d.teamFoulBonus} · 타임아웃 ${d.firstHalfTimeouts}/${d.secondHalfTimeouts}`}
      >
        <div className="ct-rulegrid">
        <SetRow name="개인 파울 한도" hint="초과 시 강제 교체" control={<Stepper value={d.foulLimit} unit="파울" min={4} max={6} onChange={(v) => set("foulLimit", v)} />} />
        <SetRow name="팀파울 보너스" hint="쿼터당 · 초과 시 자유투" control={<Stepper value={d.teamFoulBonus} unit="파울" min={3} max={7} onChange={(v) => set("teamFoulBonus", v)} />} />
        <SetRow name="타임아웃 · 전반" hint="1·2쿼터 합산" control={<Stepper value={d.firstHalfTimeouts} unit="회" min={0} max={4} onChange={(v) => set("firstHalfTimeouts", v)} />} />
        <SetRow name="타임아웃 · 후반" hint="3·4쿼터 합산" control={<Stepper value={d.secondHalfTimeouts} unit="회" min={0} max={4} onChange={(v) => set("secondHalfTimeouts", v)} />} />
        <SetRow name="타임아웃 시간" hint="1회당 · 기본 30초" control={<Stepper value={d.timeoutDurationSeconds} unit="초" min={30} max={90} step={10} onChange={(v) => set("timeoutDurationSeconds", v)} />} />
        </div>
      </RuleDetails>

      <RuleDetails
        icon="timer"
        title="휴식 시간"
        summary={`쿼터 ${d.shortBreakDurationSeconds}초 · 하프 ${d.halftimeDurationSeconds}초`}
      >
        <div className="ct-rulegrid">
        <SetRow name="쿼터 사이" hint="1·3쿼터 후" control={<Stepper value={d.shortBreakDurationSeconds} unit="초" min={0} max={600} step={30} onChange={(v) => set("shortBreakDurationSeconds", v)} />} />
        <SetRow name="하프타임" hint="2쿼터 후" control={<Stepper value={d.halftimeDurationSeconds} unit="초" min={0} max={900} step={30} onChange={(v) => set("halftimeDurationSeconds", v)} />} />
        <SetRow name="연장 전 휴식" hint="연장 시작 전" control={<Stepper value={d.overtimeBreakDurationSeconds} unit="초" min={0} max={600} step={30} onChange={(v) => set("overtimeBreakDurationSeconds", v)} />} />
        <SetRow name="휴식 자동 시작" control={<SegSm options={["사용", "미사용"]} index={d.autoIntervalTimerEnabled ? 0 : 1} onSelect={(i) => set("autoIntervalTimerEnabled", i === 0)} />} />
        </div>
      </RuleDetails>

    </section>
  );
}

````

### File: src/lib/tournaments/division-formats.ts

````ts
/**
 * 2026-05-12 Phase 3.5-D — 종별 진행 방식 (format) + 조 설정 (settings) 헬퍼 모음.
 *
 * 분리 사유:
 *   - division-rules route.ts (server) 와 divisions/page.tsx (client) 양쪽에서 동일 enum / 검증 사용
 *   - vitest 단위 검증 가능 (route.ts 는 NextRequest 의존성으로 단위 테스트 어려움)
 *
 * 신규 enum: group_stage_with_ranking
 *   의미: 각 조 풀리그 (group_size 팀 × group_count 조) → 모든 조 동순위끼리 자동 매칭
 *         (1위×N팀 동순위전 / 2위×N팀 동순위전 / ...)
 *   league_advancement 와 차이: settings.linkage_pairs 명시 불필요
 *     (group_size / group_count 만 박제 → 모든 동순위 자동 매칭)
 */

// ─────────────────────────────────────────────────────────────────────────
// 진행 방식 (format) enum
// ─────────────────────────────────────────────────────────────────────────

export const ALLOWED_FORMATS = [
  "single_elimination",
  "round_robin",
  "dual_tournament",
  "group_stage_knockout",
  "league_advancement",
  "group_stage_with_ranking",
] as const;

export type DivisionFormat = (typeof ALLOWED_FORMATS)[number];

// 2026-05-13 한국 생활체육 농구 표준 용어 통일 (사용자 결재 §A):
//   - single_elimination — "싱글 엘리미네이션" → "토너먼트" (한국 생활체육 표준)
//   - round_robin       — "풀리그 (Round Robin)" → "풀리그"
//   - double_elimination — "더블 엘리미네이션" → "더블 토너먼트"
//   - swiss             — "스위스 라운드" (일반 명칭 유지)
//   - 나머지 (dual_tournament / group_stage_knockout / full_league_knockout / league_advancement /
//     group_stage_with_ranking) — 이미 한국식 → 변경 0
// enum 값 자체는 DB 호환성 유지 (변경 X — 라벨만 한국화).
export const FORMAT_LABEL: Record<DivisionFormat, string> = {
  single_elimination: "토너먼트", // single_elimination — 토너먼트(싱글)
  round_robin: "풀리그", // round_robin — 풀리그
  dual_tournament: "듀얼토너먼트",
  group_stage_knockout: "조별리그+토너먼트",
  league_advancement: "링크제",
  group_stage_with_ranking: "조별리그+동순위 순위결정전",
};

// ─────────────────────────────────────────────────────────────────────────
// 조 설정 (group_size / group_count) 노출 가드
// ─────────────────────────────────────────────────────────────────────────

/**
 * 풀리그 기반 진행 방식 (조 단위 풀리그 / 본선 / 동순위전) 만 조 크기·개수 입력 활성.
 * 싱글/더블/스위스 = 조 개념 없음 → input 숨김.
 */
const GROUP_SETTING_FORMATS = new Set<DivisionFormat>([
  "round_robin",
  "dual_tournament",
  "group_stage_knockout",
  "league_advancement",
  "group_stage_with_ranking",
]);

export function showGroupSettings(format: string | null | undefined): boolean {
  if (!format) return false;
  return GROUP_SETTING_FORMATS.has(format as DivisionFormat);
}

/**
 * 동순위 순위결정전 방식 (ranking_format) input 노출 대상.
 * group_stage_with_ranking 만 활성 (다른 enum 은 의미 없음).
 */
export function showRankingFormat(format: string | null | undefined): boolean {
  return format === "group_stage_with_ranking";
}

/**
 * 2026-05-13 — 조별 본선 진출 팀 수 (advance_per_group) input 노출 대상.
 *
 * 사유: 조별리그/풀리그 → 토너먼트 본선으로 이어지는 enum 에서만 의미 있음.
 *   - group_stage_knockout / full_league_knockout / dual_tournament = 조 N위까지 본선 진출
 *   - league_advancement = linkage_pairs 명시로 매칭 (advance_per_group 무의미)
 *   - group_stage_with_ranking = 모든 순위 동순위전 (advance_per_group 무의미)
 *   - round_robin / single_elimination / double_elimination / swiss = 본선 분리 없음
 */
const ADVANCE_PER_GROUP_FORMATS = new Set<DivisionFormat>([
  "group_stage_knockout",
  "dual_tournament",
]);

export function shouldShowAdvancePerGroup(format: string | null | undefined): boolean {
  if (!format) return false;
  return ADVANCE_PER_GROUP_FORMATS.has(format as DivisionFormat);
}

/**
 * advance_per_group 기본값 — 한국 생활체육 표준 (조 1·2위 진출).
 */
export const ADVANCE_PER_GROUP_DEFAULT = 2;

// ─────────────────────────────────────────────────────────────────────────
// settings JSON 검증 (group_size / group_count / ranking_format)
// ─────────────────────────────────────────────────────────────────────────

export type DivisionSettingsValidationError = {
  field: "group_size" | "group_count" | "ranking_format" | "advance_per_group";
  message: string;
};

/**
 * settings JSON 의 신규 키 (group_size / group_count / ranking_format / advance_per_group) 검증.
 *
 * 룰:
 *   - group_size / group_count = 1~32 정수 (음수/소수/0/문자 거부)
 *   - ranking_format = "round_robin" / "single_elimination" 둘 중 하나
 *   - advance_per_group = 1~32 정수 + group_size 가 박제돼 있으면 advance_per_group <= group_size
 *     (조 크기보다 많은 팀이 본선 진출할 수 없음)
 *   - 키 자체가 없으면 OK (선택 입력)
 *   - legacy 키 (linkage_pairs / advanceCount 등) 는 검증 안 함 (호환 유지)
 *
 * @returns 첫 위반 에러 또는 null (통과)
 */
export function validateDivisionSettings(
  settings: Record<string, unknown> | null | undefined,
): DivisionSettingsValidationError | null {
  if (!settings) return null;

  const gs = settings.group_size;
  if (gs !== undefined && gs !== null) {
    if (typeof gs !== "number" || !Number.isInteger(gs) || gs < 1 || gs > 32) {
      return { field: "group_size", message: "group_size 는 1~32 정수여야 합니다" };
    }
  }

  const gc = settings.group_count;
  if (gc !== undefined && gc !== null) {
    if (typeof gc !== "number" || !Number.isInteger(gc) || gc < 1 || gc > 32) {
      return { field: "group_count", message: "group_count 는 1~32 정수여야 합니다" };
    }
  }

  const rf = settings.ranking_format;
  if (rf !== undefined && rf !== null) {
    if (rf !== "round_robin" && rf !== "single_elimination") {
      return {
        field: "ranking_format",
        message: "ranking_format 는 round_robin / single_elimination 둘 중 하나여야 합니다",
      };
    }
  }

  // 2026-05-13 — advance_per_group 검증 (조별 본선 진출 팀 수)
  const apg = settings.advance_per_group;
  if (apg !== undefined && apg !== null) {
    if (typeof apg !== "number" || !Number.isInteger(apg) || apg < 1 || apg > 32) {
      return {
        field: "advance_per_group",
        message: "advance_per_group 는 1~32 정수여야 합니다",
      };
    }
    // group_size 가 함께 박제돼 있으면 advance_per_group <= group_size 강제
    // (조 크기보다 많은 팀이 본선에 진출할 수 없음)
    if (typeof gs === "number" && Number.isInteger(gs) && apg > gs) {
      return {
        field: "advance_per_group",
        message: "advance_per_group 는 group_size 이하여야 합니다 (조 크기 초과 진출 불가)",
      };
    }
  }

  return null;
}

/**
 * 총 팀 수 계산 (group_size × group_count).
 * 둘 중 하나라도 빈 값이면 null.
 */
export function calculateTotalTeams(
  groupSize: number | null | undefined,
  groupCount: number | null | undefined,
): number | null {
  if (groupSize == null || groupCount == null) return null;
  if (!Number.isFinite(groupSize) || !Number.isFinite(groupCount)) return null;
  return groupSize * groupCount;
}

````

