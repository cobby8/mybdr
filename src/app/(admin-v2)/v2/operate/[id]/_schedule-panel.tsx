"use client";

// ============================================================
// operate/[id]/_schedule-panel.tsx — 일정 패널 (R4-C)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/schedule.jsx (window.SchedulePanel)
//   - 정본은 전부 클라 mock(WS.form.venues/dates·window.__BRACKET·round-robin)이지만,
//     실 백엔드 데이터가 존재 → 실데이터 READ + 정본 sc-* 마크업/CSS 1:1.
//   - 데이터(matches/venues/dates/rules) = 서버 Prisma READ → props 주입(raw fetch 0).
//   - ★ snake 함정(8회) 회피: 일정 데이터는 page.tsx 가 Prisma 직접 READ →
//     scheduledAt(camel @map scheduled_at)·court_number/venue_name/round_number(snake TS필드)
//     를 모델 필드명 그대로 읽어 camel 도메인으로 단일 매핑. apiSuccess(snake) 미경유.
//   - 레인 = 실 배치된 경기의 (KST날짜·venue_name·court_number) ∪ schedule_dates 설정 레인.
//     배치(scheduledAt) 경기는 자기 레인에 항상 표시(self-trace 검증 = "미배치" 오판 0).
//   - 계획 조작(종별시간/시작시간/자동·수동배치/드래그/휴식) = 클라 오버레이(정본 동작 보존).
//   ⚠️ 의도적 deviation(보고):
//     ① 일정 영속화 = 미배선(stub). bulk 일정저장 엔드포인트 부재(DATA-CONTRACT 🔴:
//        divDur/laneStart/assign 저장필드 없음) + 정본도 저장 없음(전부 시연 토스트).
//        per-match PATCH(/matches/[matchId] · scheduledAt/court_number/venue_name)는 실존하나
//        정본의 "시작시간+종별시간 파생" bulk 모델에 매핑 시 기존 scheduledAt 손실(lossy) →
//        R4-B 드래그 미배선과 동일 판단으로 미배선. 계획 결과는 클라 미리보기(저장 연동 준비 중).
//     ② 정본 "추첨 결과 반영(팀명 표기)" 토글 생략 — 실 매치는 이미 실 팀명 보유(슬롯라벨 개념 없음).
//        팀명 상시 표기(미정 = "미정").
//   - className(sc-*/amt-*/ct-*/ts-*)·마크업은 정본 verbatim.
// ============================================================

import React from "react";
import { Icon, Btn, Modal, useAdminShell } from "@/components/admin-v2";

// ── 도메인 타입(서버에서 단일 매핑된 camel) ──────────────────────────────
export type ScheduleMatch = {
  id: string; // 실 tournamentMatch id
  divisionCode: string | null; // settings.division_code
  roundName: string | null;
  roundNumber: number | null;
  groupName: string | null;
  matchNumber: number | null;
  status: string;
  homeName: string | null;
  awayName: string | null;
  // 실 일정(Prisma 직접 READ — snake/camel 혼재 필드를 서버에서 camel 도메인으로 단일 매핑)
  scheduledDate: string | null; // KST "YYYY-MM-DD" (scheduledAt 파생)
  scheduledTime: string | null; // KST "HH:MM" (scheduledAt 파생)
  courtNumber: string | null; // court_number(snake TS필드)
  venueName: string | null; // venue_name(snake TS필드)
};

export type ScheduleVenue = {
  id: string;
  name: string;
  courtCount: number;
  naming: "num" | "alpha";
};

export type ScheduleDate = {
  id: string;
  date: string; // "YYYY-MM-DD"
  courtIds: string[]; // ["v_1_c0", ...]
};

export type ScheduleRule = { code: string; label: string };

export type ScheduleData = {
  matches: ScheduleMatch[];
  venues: ScheduleVenue[];
  dates: ScheduleDate[];
  rules: ScheduleRule[];
};

// ── 정본 헬퍼(schedule.jsx verbatim) ──────────────────────────────────────
const CHO = ["G","KK","N","D","TT","R","M","B","PP","S","SS","","J","JJ","CH","K","T","P","H"];
function choLatin(ch: string): string {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return ch.toUpperCase();
  return CHO[Math.floor(code / 588)] || "";
}
function venueAbbrev(name: string): string {
  const cleaned = name.replace(
    /(학생체육관|국민체육센터|문화체육관|체육관|체육센터|초등학교|중학교|고등학교|대학교|학교|센터|관)$/,
    "",
  );
  const syl = [...cleaned].filter((c) => c >= "가" && c <= "힣").slice(0, 2);
  let ab = syl.map((s) => choLatin(s)[0] || "").join("");
  if (!ab) ab = cleaned.slice(0, 2).toUpperCase();
  return ab.toUpperCase();
}
const addTime = (hhmm: string, addMin: number): string => {
  const [h, m] = (hhmm || "09:00").split(":").map(Number);
  const t = h * 60 + m + addMin;
  return (
    String(Math.floor(t / 60) % 24).padStart(2, "0") +
    ":" +
    String(t % 60).padStart(2, "0")
  );
};

// 종별(조별예선 vs 토너먼트) 판정 — 실데이터 기반(group 있으면 예선)
const isGroup = (g: GameVM): boolean =>
  !!g.groupName || /예선|리그/.test(g.roundName || "");
// 세부 태그: 조별은 "{조}조", 토너먼트는 라운드명
const subTag = (g: GameVM): string =>
  g.groupName
    ? `${g.groupName}조${g.matchNumber ? ` ${g.matchNumber}경기` : ""}`
    : g.roundName || "토너먼트";

// 레인 식별자 = (날짜·장소·코트) 실 좌표(정본 cid 합성키 대신 실데이터 좌표 사용)
const laneIdOf = (date: string, venue: string | null, court: string | null): string =>
  `${date}__${venue ?? ""}__${court ?? ""}`;

// ── 뷰모델 ────────────────────────────────────────────────────────────────
type GameVM = {
  id: string; // 실 match id
  code: string; // 해소된 종별 code
  homeName: string | null;
  awayName: string | null;
  roundName: string | null;
  groupName: string | null;
  matchNumber: number | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  venueName: string | null;
  courtNumber: string | null;
};

type Lane = {
  key: string;
  date: string;
  mmdd: string;
  venueName: string;
  courtLabel: string; // 코트 표기(실 court_number 또는 설정 순번)
  abbrev: string;
};

type Slot = { t: "g"; matchId: string } | { t: "b"; min: number };

export function SchedulePanel({ data }: { data: ScheduleData }) {
  const { toast } = useAdminShell();
  const { matches, venues, dates, rules } = data;

  // 종별 label lookup
  const ruleLabel = React.useMemo(
    () => Object.fromEntries(rules.map((r) => [r.code, r.label])),
    [rules],
  );
  const fallbackCode = rules.length === 1 ? rules[0].code : "기타";
  const resolveCode = React.useCallback(
    (m: ScheduleMatch) => m.divisionCode ?? fallbackCode,
    [fallbackCode],
  );

  // 게임 뷰모델 + matchId → game 맵
  const { allGames, gamesByDiv, countOf } = React.useMemo(() => {
    const ag: Record<string, GameVM> = {};
    const gb: Record<string, GameVM[]> = {};
    const co: Record<string, number> = {};
    rules.forEach((r) => {
      gb[r.code] = [];
      co[r.code] = 0;
    });
    matches.forEach((m) => {
      const code = resolveCode(m);
      const vm: GameVM = {
        id: m.id,
        code,
        homeName: m.homeName,
        awayName: m.awayName,
        roundName: m.roundName,
        groupName: m.groupName,
        matchNumber: m.matchNumber,
        scheduledDate: m.scheduledDate,
        scheduledTime: m.scheduledTime,
        venueName: m.venueName,
        courtNumber: m.courtNumber,
      };
      ag[m.id] = vm;
      if (!gb[code]) gb[code] = [];
      gb[code].push(vm);
      co[code] = (co[code] || 0) + 1;
    });
    return { allGames: ag, gamesByDiv: gb, countOf: co };
  }, [matches, rules, resolveCode]);

  // 표시 종별 = rules(코드 순) + rules 밖의 divisionCode(폴백 포함)
  const divisions = React.useMemo(() => {
    const out = rules.map((r) => ({ code: r.code, label: r.label }));
    const known = new Set(rules.map((r) => r.code));
    Object.keys(gamesByDiv).forEach((code) => {
      if (!known.has(code)) out.push({ code, label: ruleLabel[code] || code });
    });
    return out;
  }, [rules, gamesByDiv, ruleLabel]);

  // ── 레인 = 설정(venues×dates) ∪ 실 배치경기 좌표 ─────────────────────────
  const lanes = React.useMemo<Lane[]>(() => {
    const map = new Map<string, Lane>();
    // (1) 설정 레인(정본 buildLanes — places/schedule_dates)
    const vmap: Record<string, ScheduleVenue> = {};
    venues.forEach((v) => (vmap[v.id] = v));
    dates.forEach((d) => {
      d.courtIds.forEach((cid) => {
        const [vid, cpart] = cid.split("_c");
        const v = vmap[vid];
        if (!v) return;
        const ci = Number(cpart);
        const courtLabel = String(Number.isFinite(ci) ? ci + 1 : cpart);
        const key = laneIdOf(d.date, v.name, courtLabel);
        if (!map.has(key)) {
          map.set(key, {
            key,
            date: d.date,
            mmdd: d.date.slice(5).replace("-", ""),
            venueName: v.name,
            courtLabel,
            abbrev: venueAbbrev(v.name) + courtLabel,
          });
        }
      });
    });
    // (2) 실 배치경기 레인(설정에 없어도 항상 표시 — snake 검증 핵심)
    matches.forEach((m) => {
      if (!m.scheduledDate) return;
      const venue = m.venueName || "장소 미지정";
      const court = m.courtNumber || "1";
      const key = laneIdOf(m.scheduledDate, venue, court);
      if (!map.has(key)) {
        map.set(key, {
          key,
          date: m.scheduledDate,
          mmdd: m.scheduledDate.slice(5).replace("-", ""),
          venueName: venue,
          courtLabel: court,
          abbrev: venueAbbrev(venue) + court,
        });
      }
    });
    return [...map.values()].sort(
      (a, b) => a.date.localeCompare(b.date) || a.abbrev.localeCompare(b.abbrev),
    );
  }, [venues, dates, matches]);

  // 종별 경기 시간(분) · 코트별 시작 시간
  const [divDur, setDivDur] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(divisions.map((d) => [d.code, 40])),
  );
  const durOf = (code: string) => divDur[code] || 40;
  const [laneStart, setLaneStart] = React.useState<Record<string, string>>(() => {
    // 레인 시작시간 기본값 = 그 레인 실 첫 경기 시간(없으면 09:00)
    const out: Record<string, string> = {};
    lanes.forEach((l) => {
      const placed = matches
        .filter(
          (m) =>
            m.scheduledDate === l.date &&
            (m.venueName || "장소 미지정") === l.venueName &&
            (m.courtNumber || "1") === l.courtLabel &&
            m.scheduledTime,
        )
        .map((m) => m.scheduledTime as string)
        .sort();
      out[l.key] = placed[0] || "09:00";
    });
    return out;
  });

  // ── 배치 상태(assign) — 실 배치경기 시드 ─────────────────────────────────
  const [assign, setAssign] = React.useState<Record<string, Slot[]>>(() => {
    const out: Record<string, Slot[]> = {};
    lanes.forEach((l) => {
      const placed = matches
        .filter(
          (m) =>
            m.scheduledDate === l.date &&
            (m.venueName || "장소 미지정") === l.venueName &&
            (m.courtNumber || "1") === l.courtLabel,
        )
        .slice()
        .sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || ""));
      if (placed.length) out[l.key] = placed.map((m) => ({ t: "g", matchId: m.id }));
    });
    return out;
  });

  const [drag, setDrag] = React.useState<
    | { kind: "row"; lane: string; idx: number }
    | { kind: "pool"; matchId: string; code: string }
    | null
  >(null);
  const [autoOpen, setAutoOpen] = React.useState(false);
  const [manOpen, setManOpen] = React.useState(false);

  // ── 드래그 이동(행 재정렬 + 풀에서 삽입) — 정본 verbatim ──────────────────
  const move = (toLane: string, toIdx: number | null) => {
    if (!drag) return;
    if (drag.kind === "pool") {
      setAssign((a) => {
        const dst = [...(a[toLane] || [])];
        const idx = toIdx == null ? dst.length : toIdx;
        dst.splice(idx < 0 ? dst.length : idx, 0, { t: "g", matchId: drag.matchId });
        return { ...a, [toLane]: dst };
      });
      setDrag(null);
      return;
    }
    setAssign((a) => {
      const src = [...(a[drag.lane] || [])];
      const [item] = src.splice(drag.idx, 1);
      if (drag.lane === toLane) {
        let idx = toIdx == null ? src.length : toIdx;
        if (toIdx != null && drag.idx < toIdx) idx -= 1;
        src.splice(idx < 0 ? src.length : idx, 0, item);
        return { ...a, [toLane]: src };
      }
      const dst = [...(a[toLane] || [])];
      const idx = toIdx == null ? dst.length : toIdx;
      dst.splice(idx < 0 ? dst.length : idx, 0, item);
      return { ...a, [drag.lane]: src, [toLane]: dst };
    });
    setDrag(null);
  };
  const insertBreak = (laneKey: string) =>
    setAssign((a) => ({ ...a, [laneKey]: [...(a[laneKey] || []), { t: "b", min: 10 }] }));
  const setBreakMin = (laneKey: string, idx: number, min: number) =>
    setAssign((a) => {
      const arr = [...(a[laneKey] || [])];
      arr[idx] = { ...arr[idx], min } as Slot;
      return { ...a, [laneKey]: arr };
    });
  const removeItem = (laneKey: string, idx: number) =>
    setAssign((a) => {
      const arr = [...(a[laneKey] || [])];
      arr.splice(idx, 1);
      return { ...a, [laneKey]: arr };
    });
  const clearAll = () => {
    setAssign({});
    toast("일정 초기화(미리보기)");
  };

  const placedMatchIds = React.useMemo(() => {
    const s = new Set<string>();
    Object.values(assign).forEach((arr) =>
      arr.forEach((it) => {
        if (it.t === "g") s.add(it.matchId);
      }),
    );
    return s;
  }, [assign]);
  const placed = placedMatchIds.size;
  const lanesWith = lanes.filter((l) => (assign[l.key] || []).length);

  // ── 자동 생성(모달에서 확정) — 정본 verbatim(실 games 기반) ───────────────
  const runAuto = (sel: Record<string, { code: string; phase: "all" | "group" | "ko" }[]>) => {
    const next: Record<string, Slot[]> = {};
    lanes.forEach((l) => (next[l.key] = []));
    let total = 0;
    divisions.forEach((rule) => {
      const games = gamesByDiv[rule.code] || [];
      (["group", "ko"] as const).forEach((ph) => {
        const targets = lanes.filter((l) =>
          (sel[l.key] || []).some(
            (s) => s.code === rule.code && (s.phase === "all" || s.phase === ph),
          ),
        );
        if (!targets.length) return;
        const gs = games.filter((g) => (ph === "group" ? isGroup(g) : !isGroup(g)));
        gs.forEach((g, i) => {
          next[targets[i % targets.length].key].push({ t: "g", matchId: g.id });
          total++;
        });
      });
    });
    setAssign(next);
    setAutoOpen(false);
    toast(total ? `${total}경기 자동 배치(미리보기)` : "배정된 종별이 없습니다");
  };

  const totalGames = Object.values(countOf).reduce((a, b) => a + b, 0);

  // 대진표 발행분(경기가 생성된 종별) — 정본 schedule.jsx bracketDivs.
  //   정본 mock fromBracket(window.__BRACKET) 대신 실 matches 카운트로 파생.
  const bracketDivs = React.useMemo(
    () => divisions.filter((d) => (countOf[d.code] || 0) > 0),
    [divisions, countOf],
  );

  // 레인이 0개이고 경기도 없으면 정본 Empty
  if (lanes.length === 0 && matches.length === 0) {
    return (
      <div className="ct-emptybox">
        <Icon name="calendar-clock" size={36} color="var(--ink-dim)" />
        <b style={{ color: "var(--ink)" }}>일정을 작성할 장소·경기가 없습니다</b>
        <span>
          대회 정보 수정에서 장소·일정을 등록하고, 대진표에서 경기를 생성한 뒤 일정을 배치하세요.
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* ── 설정 카드 ─────────────────────────────── */}
      <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
        {/* 대진표 반영됨 알림 밴드 — 정본 schedule.jsx:184-186 bk-fromnote 1:1 */}
        {bracketDivs.length > 0 && (
          <div className="bk-fromnote">
            <Icon name="git-merge" size={15} color="var(--primary)" />
            <span>
              대진표 반영됨 —{" "}
              {bracketDivs
                .map((r) => `${r.label} ${countOf[r.code]}경기`)
                .join(" · ")}{" "}
              (조별예선+토너먼트)
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="ct-headicon">
              <Icon name="calendar-clock" size={18} />
            </span>
            <div>
              <h3 style={{ fontSize: 14 }}>경기 시간 · 코트 시작 시간</h3>
              <p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
                종별 경기 시간과 코트별 시작 시간을 정한 뒤 자동 배치하거나 직접 배치하세요
              </p>
            </div>
          </div>
        </div>

        {/* 종별 경기 시간 */}
        <span className="ts-field__label" style={{ display: "block", marginBottom: 6 }}>
          종별 경기 시간(분)
        </span>
        <div className="sc-durgrid">
          {divisions.map((r) => (
            <div key={r.code} className="sc-durcell">
              <span className="sc-durcell__lbl">{r.label}</span>
              <input
                className="ts-input"
                type="number"
                min={5}
                step={5}
                value={divDur[r.code] ?? 40}
                onChange={(e) =>
                  setDivDur((d) => ({ ...d, [r.code]: Number(e.target.value) || 0 }))
                }
              />
              <span className="sc-durcell__cnt">{countOf[r.code] || 0}경기</span>
            </div>
          ))}
        </div>

        {/* 코트별 시작 시간 */}
        {lanes.length > 0 && (
          <>
            <span
              className="ts-field__label"
              style={{ display: "block", margin: "14px 0 6px" }}
            >
              코트별 시작 시간
            </span>
            <div className="sc-durgrid">
              {lanes.map((l) => (
                <div key={l.key} className="sc-durcell">
                  <span className="sc-lane-court" style={{ flex: "0 0 auto" }}>
                    {l.abbrev}
                  </span>
                  <input
                    className="ts-input"
                    type="time"
                    value={laneStart[l.key] || "09:00"}
                    onChange={(e) =>
                      setLaneStart((s) => ({ ...s, [l.key]: e.target.value }))
                    }
                  />
                  <span className="sc-durcell__cnt" style={{ whiteSpace: "nowrap" }}>
                    {l.mmdd.slice(0, 2)}.{l.mmdd.slice(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
            flexWrap: "wrap",
            borderTop: "1px solid var(--border)",
            paddingTop: 12,
          }}
        >
          <span style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>
            전체 {totalGames}경기 · 코트 {lanes.length}면
            {placed ? ` · 배정 ${placed}경기` : ""}
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {placed > 0 && (
              <Btn variant="secondary" size="sm" icon="rotate-ccw" onClick={clearAll}>
                초기화
              </Btn>
            )}
            <Btn
              variant="secondary"
              size="sm"
              icon="hand"
              onClick={() => setManOpen(true)}
            >
              직접 배치
            </Btn>
            <Btn size="sm" icon="wand-2" onClick={() => setAutoOpen(true)}>
              일정 자동 배치
            </Btn>
          </div>
        </div>
        {/* 영속화 미배선 안내(정직성 — bulk 일정저장 엔드포인트 부재) */}
        <p style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 10 }}>
          배치 결과는 미리보기입니다. 저장 연동은 준비 중이며, 개별 경기의 시간·코트는 경기 관리에서 수정할 수 있습니다.
        </p>
      </div>

      {/* ── 코트별 일정표 ───────────────────────────── */}
      {placed === 0 ? (
        <div className="ct-emptybox">
          <Icon name="calendar-clock" size={36} color="var(--ink-dim)" />
          <b style={{ color: "var(--ink)" }}>아직 배치된 일정이 없습니다</b>
          <span>
            <b>일정 자동 배치</b>로 일자·코트별 종별을 배정하거나, <b>직접 배치</b>로 경기를 끌어
            놓으세요.
          </span>
        </div>
      ) : (
        lanesWith.map((l) => {
          const arr = assign[l.key] || [];
          let cursor = laneStart[l.key] || "09:00";
          let gameSeq = 0;
          const rows = arr.map((it, idx) => {
            const time = cursor;
            const g = it.t === "g" ? allGames[it.matchId] : undefined;
            cursor = addTime(cursor, it.t === "g" ? durOf(g?.code || "") : it.min);
            if (it.t === "g") {
              gameSeq++;
              const no = `${l.abbrev}-${l.mmdd}-${String(gameSeq).padStart(2, "0")}`;
              return { it, idx, time, no, g };
            }
            return { it, idx, time, brk: true as const };
          });
          return (
            <div key={l.key} style={{ marginBottom: 18 }}>
              <div className="sc-lane-head">
                <span className="sc-lane-court">{l.abbrev}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: 14 }}>
                    {l.date} · {l.venueName} {l.courtLabel}번 코트
                  </b>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "var(--ink-mute)",
                      marginTop: 2,
                    }}
                  >
                    {gameSeq}경기 · 시작 {laneStart[l.key] || "09:00"}
                  </span>
                </div>
                <Btn
                  variant="ghost"
                  size="sm"
                  icon="coffee"
                  onClick={() => insertBreak(l.key)}
                >
                  휴식
                </Btn>
              </div>
              <div className="amt-table-wrap">
                <table className="amt-table sc-table">
                  <thead>
                    <tr>
                      <th style={{ width: 34 }}></th>
                      <th>경기번호</th>
                      <th style={{ width: 132 }}>종별</th>
                      <th style={{ width: 64 }}>시간</th>
                      <th style={{ textAlign: "right" }}>홈</th>
                      <th style={{ width: 26 }}></th>
                      <th style={{ textAlign: "left" }}>어웨이</th>
                      <th style={{ width: 34 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) =>
                      "brk" in r ? (
                        <tr
                          key={r.idx}
                          draggable
                          onDragStart={() =>
                            setDrag({ kind: "row", lane: l.key, idx: r.idx })
                          }
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => move(l.key, r.idx)}
                          className="sc-break"
                        >
                          <td className="sc-handle">
                            <Icon name="grip-vertical" size={15} color="var(--ink-dim)" />
                          </td>
                          <td
                            colSpan={3}
                            style={{
                              color: "var(--ink-mute)",
                              fontWeight: 700,
                              fontSize: 12.5,
                            }}
                          >
                            <Icon name="coffee" size={14} /> 휴식 {r.time}
                          </td>
                          <td colSpan={3}>
                            <select
                              className="sc-brkmin"
                              value={(r.it as { t: "b"; min: number }).min}
                              onChange={(e) =>
                                setBreakMin(l.key, r.idx, Number(e.target.value))
                              }
                            >
                              {[5, 10, 15, 20, 30].map((m) => (
                                <option key={m} value={m}>
                                  {m}분
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="sc-del"
                              onClick={() => removeItem(l.key, r.idx)}
                            >
                              <Icon name="x" size={14} />
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={r.idx}
                          draggable
                          onDragStart={() =>
                            setDrag({ kind: "row", lane: l.key, idx: r.idx })
                          }
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => move(l.key, r.idx)}
                          className={
                            drag &&
                            drag.kind === "row" &&
                            drag.lane === l.key &&
                            drag.idx === r.idx
                              ? "sc-dragging"
                              : ""
                          }
                        >
                          <td className="sc-handle">
                            <Icon name="grip-vertical" size={15} color="var(--ink-dim)" />
                          </td>
                          <td
                            className="amt-table__court"
                            style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}
                          >
                            {r.no}
                          </td>
                          <td>
                            <span className="sc-divtag" data-ko={r.g ? !isGroup(r.g) : false}>
                              {ruleLabel[r.g?.code || ""] || r.g?.code}
                              <i>{r.g ? subTag(r.g) : ""}</i>
                            </span>
                          </td>
                          <td className="amt-table__time">{r.time}</td>
                          <td style={{ fontWeight: 600, textAlign: "right" }}>
                            {r.g?.homeName || "미정"}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              color: "var(--ink-dim)",
                              fontSize: 12,
                            }}
                          >
                            대
                          </td>
                          <td style={{ fontWeight: 600, textAlign: "left" }}>
                            {r.g?.awayName || "미정"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="sc-del"
                              onClick={() => removeItem(l.key, r.idx)}
                            >
                              <Icon name="x" size={14} />
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                    <tr
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => move(l.key, null)}
                      className="sc-droptail"
                    >
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          color: "var(--ink-dim)",
                          fontSize: 12,
                          padding: "8px",
                        }}
                      >
                        여기로 끌어 이 코트 마지막에 배치
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {autoOpen && (
        <AutoModal
          lanes={lanes}
          divisions={divisions}
          countOf={countOf}
          gamesByDiv={gamesByDiv}
          onClose={() => setAutoOpen(false)}
          onRun={runAuto}
        />
      )}
      {manOpen && (
        <ManualModal
          lanes={lanes}
          divisions={divisions}
          gamesByDiv={gamesByDiv}
          allGames={allGames}
          ruleLabel={ruleLabel}
          divDur={divDur}
          setDivDur={setDivDur}
          laneStart={laneStart}
          setLaneStart={setLaneStart}
          assign={assign}
          placedMatchIds={placedMatchIds}
          setDrag={setDrag}
          move={move}
          insertBreak={insertBreak}
          setBreakMin={setBreakMin}
          removeItem={removeItem}
          durOf={durOf}
          onClose={() => setManOpen(false)}
        />
      )}
    </div>
  );
}

// ── 자동 생성 모달 — 정본 verbatim ──────────────────────────────────────────
type Division = { code: string; label: string };
type AutoSel = Record<string, { code: string; phase: "all" | "group" | "ko" }[]>;

function AutoModal({
  lanes,
  divisions,
  countOf,
  gamesByDiv,
  onClose,
  onRun,
}: {
  lanes: Lane[];
  divisions: Division[];
  countOf: Record<string, number>;
  gamesByDiv: Record<string, GameVM[]>;
  onClose: () => void;
  onRun: (sel: AutoSel) => void;
}) {
  void countOf;
  const [sel, setSel] = React.useState<AutoSel>({});
  const cyc = (laneKey: string, code: string) =>
    setSel((s) => {
      const cur = s[laneKey] || [];
      const ex = cur.find((x) => x.code === code);
      let nextEntry: { code: string; phase: "all" | "group" | "ko" } | null;
      if (!ex) nextEntry = { code, phase: "all" };
      else if (ex.phase === "all") nextEntry = { code, phase: "group" };
      else if (ex.phase === "group") nextEntry = { code, phase: "ko" };
      else nextEntry = null;
      const rest = cur.filter((x) => x.code !== code);
      return { ...s, [laneKey]: nextEntry ? [...rest, nextEntry] : rest };
    });
  const hasKo = (code: string) => (gamesByDiv[code] || []).some((g) => !isGroup(g));
  const total = lanes.reduce((s, l) => s + (sel[l.key] || []).length, 0);
  const phaseLbl: Record<string, string> = { all: "전체", group: "예선", ko: "토너먼트" };

  return (
    <Modal
      open
      onClose={onClose}
      title="일정 자동 배치"
      sub="일자·코트별로 운영 종별과 예선/토너먼트를 배정하세요. 한 코트에 두 종별도 가능합니다."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn icon="wand-2" onClick={() => onRun(sel)} disabled={!total}>
            {total ? "배정 생성" : "종별 선택"}
          </Btn>
        </>
      }
    >
      <div className="sc-automx">
        {lanes.map((l) => (
          <div key={l.key} className="sc-autorow">
            <div className="sc-autorow__lane">
              <span className="sc-lane-court">{l.abbrev}</span>
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 12.5 }}>
                  {l.venueName} {l.courtLabel}번
                </b>
                <span style={{ display: "block", fontSize: 11, color: "var(--ink-mute)" }}>
                  {l.date}
                </span>
              </div>
            </div>
            <div className="sc-autorow__chips">
              {divisions.map((r) => {
                const ex = (sel[l.key] || []).find((x) => x.code === r.code);
                return (
                  <button
                    key={r.code}
                    className="sc-divchip"
                    data-on={!!ex}
                    onClick={() => cyc(l.key, r.code)}
                    title={
                      hasKo(r.code)
                        ? "클릭: 전체→예선→토너먼트→해제"
                        : "클릭: 선택/해제"
                    }
                  >
                    {ex && <Icon name="check" size={12} />}
                    {r.label}
                    {ex && hasKo(r.code) ? (
                      <i style={{ fontStyle: "normal", opacity: 0.8, marginLeft: 4 }}>
                        · {phaseLbl[ex.phase]}
                      </i>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 10 }}>
        토너먼트가 있는 종별은 칩을 반복 클릭해 전체 → 예선만 → 토너먼트만 → 해제 순으로
        전환됩니다.
      </p>
    </Modal>
  );
}

// ── 직접 배치 모달 — 정본 verbatim ──────────────────────────────────────────
function ManualModal({
  lanes,
  divisions,
  gamesByDiv,
  allGames,
  ruleLabel,
  divDur,
  setDivDur,
  laneStart,
  setLaneStart,
  assign,
  placedMatchIds,
  setDrag,
  move,
  insertBreak,
  setBreakMin,
  removeItem,
  durOf,
  onClose,
}: {
  lanes: Lane[];
  divisions: Division[];
  gamesByDiv: Record<string, GameVM[]>;
  allGames: Record<string, GameVM>;
  ruleLabel: Record<string, string>;
  divDur: Record<string, number>;
  setDivDur: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  laneStart: Record<string, string>;
  setLaneStart: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  assign: Record<string, Slot[]>;
  placedMatchIds: Set<string>;
  setDrag: React.Dispatch<
    React.SetStateAction<
      | { kind: "row"; lane: string; idx: number }
      | { kind: "pool"; matchId: string; code: string }
      | null
    >
  >;
  move: (toLane: string, toIdx: number | null) => void;
  insertBreak: (laneKey: string) => void;
  setBreakMin: (laneKey: string, idx: number, min: number) => void;
  removeItem: (laneKey: string, idx: number) => void;
  durOf: (code: string) => number;
  onClose: () => void;
}) {
  const [code, setCode] = React.useState(divisions[0]?.code);
  const dates = React.useMemo(() => [...new Set(lanes.map((l) => l.date))], [lanes]);
  const [date, setDate] = React.useState(dates[0]);
  const courts = lanes.filter((l) => l.date === date);
  const [laneKey, setLaneKey] = React.useState(courts[0]?.key);
  React.useEffect(() => {
    const c = lanes.filter((l) => l.date === date);
    if (!c.find((x) => x.key === laneKey)) setLaneKey(c[0]?.key);
  }, [date, lanes, laneKey]);
  const lane = lanes.find((l) => l.key === laneKey);

  const pool = (gamesByDiv[code] || []).filter((g) => !placedMatchIds.has(g.id));
  const arr = assign[laneKey] || [];
  let cursor = lane ? laneStart[lane.key] || "09:00" : "09:00";
  let seq = 0;
  const rows = arr.map((it, idx) => {
    const time = cursor;
    const g = it.t === "g" ? allGames[it.matchId] : undefined;
    cursor = addTime(cursor, it.t === "g" ? durOf(g?.code || "") : it.min);
    if (it.t === "g") {
      seq++;
      return { it, idx, time, seq, g };
    }
    return { it, idx, time, brk: true as const };
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="직접 배치"
      sub="종별·날짜·코트를 고르고, 경기를 시간표로 끌어 배치하세요."
      maxWidth={880}
      foot={<Btn onClick={onClose}>완료</Btn>}
    >
      {/* 선택 바 */}
      <div className="sc-manbar">
        <div>
          <span className="ts-field__label">종별</span>
          <div className="sc-manchips">
            {divisions.map((r) => (
              <button
                key={r.code}
                className="sc-divchip"
                data-on={r.code === code}
                onClick={() => setCode(r.code)}
              >
                {r.code === code && <Icon name="check" size={12} />}
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="ts-field__label">날짜</span>
          <div className="sc-manchips">
            {dates.map((d) => (
              <button
                key={d}
                className="sc-divchip"
                data-on={d === date}
                onClick={() => setDate(d)}
              >
                {d.slice(5)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="ts-field__label">코트</span>
          <div className="sc-manchips">
            {courts.map((l) => (
              <button
                key={l.key}
                className="sc-divchip"
                data-on={l.key === laneKey}
                onClick={() => setLaneKey(l.key)}
              >
                {l.abbrev}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 사전 설정 */}
      <div className="sc-manset">
        <label className="ts-field" style={{ margin: 0 }}>
          <span className="ts-field__label">{ruleLabel[code] || code} 경기 시간(분)</span>
          <input
            className="ts-input"
            type="number"
            min={5}
            step={5}
            value={divDur[code] ?? 40}
            onChange={(e) =>
              setDivDur((d) => ({ ...d, [code]: Number(e.target.value) || 0 }))
            }
          />
        </label>
        <label className="ts-field" style={{ margin: 0 }}>
          <span className="ts-field__label">{lane?.abbrev} 시작 시간</span>
          <input
            className="ts-input"
            type="time"
            value={lane ? laneStart[lane.key] || "09:00" : ""}
            onChange={(e) =>
              lane && setLaneStart((s) => ({ ...s, [lane.key]: e.target.value }))
            }
          />
        </label>
      </div>

      <div className="sc-manwrap">
        {/* 좌: 미배치 경기 풀 */}
        <div className="sc-manpool">
          <h4 className="bk-subh">
            {ruleLabel[code] || code} 미배치 경기 ({pool.length})
          </h4>
          {pool.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--ink-dim)", padding: "8px 2px" }}>
              모든 경기가 배치되었습니다.
            </p>
          ) : (
            <div className="sc-poollist">
              {pool.map((g) => (
                <div
                  key={g.id}
                  className="sc-poolcard"
                  draggable
                  onDragStart={() => setDrag({ kind: "pool", matchId: g.id, code })}
                >
                  <Icon name="grip-vertical" size={14} color="var(--ink-dim)" />
                  <span
                    className="sc-divtag"
                    data-ko={!isGroup(g)}
                    style={{ flex: "0 0 auto" }}
                  >
                    <i>{subTag(g)}</i>
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 0 }}>
                    {g.homeName || "미정"}{" "}
                    <b style={{ color: "var(--ink-dim)", fontWeight: 500 }}>대</b>{" "}
                    {g.awayName || "미정"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* 우: 코트 시간표(드롭) */}
        <div className="sc-manlane">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h4 className="bk-subh" style={{ margin: 0 }}>
              {lane?.abbrev} · {lane?.venueName} {lane?.courtLabel}번 · {date?.slice(5)}
            </h4>
            <Btn
              variant="ghost"
              size="sm"
              icon="coffee"
              onClick={() => laneKey && insertBreak(laneKey)}
            >
              휴식
            </Btn>
          </div>
          <div
            className="sc-mandrop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => laneKey && move(laneKey, null)}
          >
            {rows.length === 0 && (
              <div className="sc-manempty">좌측 경기를 여기로 끌어 놓으세요</div>
            )}
            {rows.map((r) =>
              "brk" in r ? (
                <div
                  key={r.idx}
                  className="sc-manitem sc-manitem--brk"
                  draggable
                  onDragStart={() => setDrag({ kind: "row", lane: laneKey, idx: r.idx })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.stopPropagation();
                    move(laneKey, r.idx);
                  }}
                >
                  <Icon name="coffee" size={14} color="var(--ink-mute)" />
                  <b style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>휴식 {r.time}</b>
                  <select
                    className="sc-brkmin"
                    value={(r.it as { t: "b"; min: number }).min}
                    onChange={(e) => setBreakMin(laneKey, r.idx, Number(e.target.value))}
                    style={{ marginLeft: "auto" }}
                  >
                    {[5, 10, 15, 20, 30].map((m) => (
                      <option key={m} value={m}>
                        {m}분
                      </option>
                    ))}
                  </select>
                  <button className="sc-del" onClick={() => removeItem(laneKey, r.idx)}>
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ) : (
                <div
                  key={r.idx}
                  className="sc-manitem"
                  draggable
                  onDragStart={() => setDrag({ kind: "row", lane: laneKey, idx: r.idx })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.stopPropagation();
                    move(laneKey, r.idx);
                  }}
                >
                  <span className="sc-manitem__no">
                    {lane?.abbrev}-{lane?.mmdd}-{String(r.seq).padStart(2, "0")}
                  </span>
                  <span className="sc-manitem__time">{r.time}</span>
                  <span
                    className="sc-divtag"
                    data-ko={r.g ? !isGroup(r.g) : false}
                    style={{ flex: "0 0 auto" }}
                  >
                    <i>{r.g ? subTag(r.g) : ""}</i>
                  </span>
                  <span
                    style={{ fontSize: 12.5, fontWeight: 600, minWidth: 0, flex: 1 }}
                  >
                    {r.g?.homeName || "미정"}{" "}
                    <b style={{ color: "var(--ink-dim)", fontWeight: 500 }}>대</b>{" "}
                    {r.g?.awayName || "미정"}
                  </span>
                  <button className="sc-del" onClick={() => removeItem(laneKey, r.idx)}>
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
