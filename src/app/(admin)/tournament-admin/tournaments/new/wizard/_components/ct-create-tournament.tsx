"use client";

// =====================================================================
// ct-create-tournament.tsx — 새 대회 만들기 메인 폼 (2컬럼 단일 페이지 · Toss)
//   박제 source: _deliver_CreateTournament/create-tournament.jsx
//   범위(B-2): 셸(헤더·2컬럼·하단 고정 생성바) + 좌측 컬럼 완성 + 우측 stub(B-3).
//     · 좌: 대회 정보(대회명·정규대회·주최·주관·후원사·포스터) + 일정·장소
//     · 우: stub 카드 2개("B-3에서 구현 — 종별·디비전 / 경기 설정")
//
//   ⚠ 가드 (왜):
//   - 제출(POST) 배선은 B-4 로 보류. 본 컴포넌트는 "대회 생성" 클릭 시 좌측 필수값을
//     검증하고 onSubmitDraft(payload) 로 부모에게 넘기기만 한다(실제 fetch 없음).
//   - 시리즈(정규대회)는 시안 mockup REGULAR_SERIES 대신 운영 /api/web/series/my 실연동 +
//     기존 InlineSeriesForm 재사용(page.tsx 와 동일 패턴).
//   - 포스터/후원사 로고는 시안 image-slot(mockup) 대신 운영 ImageUploader(실업로드) 사용.
//   - state(d/venues/dates/sponsors/categories)는 B-1 POST body 형태로 보관 — B-4 에서 그대로 전송.
// =====================================================================

import React from "react";
import { Icon, Btn, Modal } from "@/components/admin-toss";
import { ImageUploader } from "@/components/shared/image-uploader";
import { InlineSeriesForm, type CreatedSeries } from "@/components/tournament/inline-series-form";
import { normalizeGameRules } from "@/lib/tournaments/game-rules";
import {
  ScheduleVenue,
  allCourts,
  ctUid,
  serializeVenue,
  venueFromDraft,
  type Venue,
  type VenueDraft,
  type DateRow,
} from "./ct-schedule-venue";
// B-4 우측 컬럼 실폼 — B-3 에서 만든 controlled 컴포넌트 교체
import { CtDivisions, type CategoryItem } from "./ct-divisions";
import { CtGameSettings, GAME_SETTINGS_DEFAULTS, type GameRules } from "./ct-game-settings";

// ── 시리즈 옵션 타입 (page.tsx SeriesOption 과 동일) ───────────────────
export type SeriesOption = {
  id: string;
  name: string;
  organization: { id: string; name: string; slug: string } | null;
};

// ── 경기 설정 기본값(GAME_SETTINGS_DEFAULTS)·타입(GameRules)은 ct-game-settings 에서 정본 import ──
//   왜: B-3 에서 경기 설정 카드(CtGameSettings)가 GameRules 정본을 export → 메인 폼이 import 해
//       기본값/키를 일원화한다(중복 정의 시 양쪽 drift 위험). B-1 POST game_rules jsonb 키와 1:1.

// ── 후원사 타입 ───────────────────────────────────────────────────────
type Sponsor = { id: string; name: string; logoUrl: string };

// ── 게시 모달 입력값 (게시기간·참가신청기간·결제방법·입금계좌) ──────────
//   왜: 시안 PublishModal 1:1. 결제 방법은 현재 계좌이체(bank)만 활성, 나머지는 준비 중.
export type PublishInfo = {
  postStart: string; // 게시 시작일 (YYYY-MM-DD)
  postEnd: string; // 게시 종료일
  regStart: string; // 참가신청 시작일
  regEnd: string; // 참가신청 종료일
  pays: string[]; // 선택된 결제 방법(현재 ["bank"]만)
  bank: string; // 은행명
  account: string; // 계좌번호
  holder: string; // 예금주
};

// ── 제출 payload (B-4: page.tsx 가 POST /api/web/tournaments body 로 그대로 전송) ──
//   왜: categories 는 평면변환(시안 CategoryItem[] → POST 가 받는 3개 Record)까지 본 컴포넌트에서
//       끝내 page.tsx 는 단순 전송만 한다. createTournament 가 이미 받는 키이므로 API/schema 확장 0.
export type CtDraftPayload = {
  name: string;
  isRegular: boolean;
  seriesId: string | null;
  seriesName: string;
  organizer: string;
  host: string;
  poster: string;
  // 후원사 = DB sponsors(String? VarChar) 컬럼 정합 → 콤마 구분 plain 문자열로 전송.
  //   왜 객체배열이 아니라 문자열인가: 표시 화면(tournament-about.tsx)이 sponsors 를 `.split(",")` 로
  //   읽어 렌더하므로 객체배열/JSON 을 보내면 DB INSERT 500 + 표시 깨짐. 입력 UI(SponsorField)는
  //   로고까지 받지만 전송 시점에 이름만 join(로고는 전용 컬럼 부재 → 1차 미저장·후속 작업).
  sponsors: string;
  gameRules: Record<string, unknown>;
  // B-1 places 확장형
  places: ReturnType<typeof serializeVenue>[];
  // B-1 scheduleDates 규격 [{id,date,court_ids:[]}]
  scheduleDates: { id: string; date: string; court_ids: string[] }[];
  // 종별·디비전 평면변환 — createTournament 가 받는 3개 Record (route.ts L147)
  //   categories: { 종별명: [디비전명, ...] } / divCaps: { 디비전명: cap } / divFees: { 디비전명: fee }
  categories: Record<string, string[]>;
  divCaps: Record<string, number>;
  divFees: Record<string, number>;
  // 게시 모달 입력 — 게시/참가신청 기간 + 입금계좌 + 참가비(디비전 fee 합산 대신 게시 모달에선 미수집)
  registrationStartAt: string | null;
  registrationEndAt: string | null;
  startDate: string | null; // 게시 기간 = 대회 노출 기간 → 시작/종료일로 사용
  endDate: string | null;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  format?: string | null;
  // ── F-1: 무스키마 보존 데이터(Tournament.settings jsonb) ──────────────
  //   왜: sponsors 컬럼(String)·categories/divCaps/divFees(Record) 로는 보존 못 하는
  //       ①후원사 로고URL ②디비전별 경기날짜/코트 를 settings jsonb 에 담아 저장한다.
  //       createTournament 가 settings 인자를 이미 받으므로(round-trip) schema/API 확장 0.
  //   ⚠ settings 내부 키는 자동 snake 변환 대상 아님(jsonb 내부) → sponsor_logos/div_schedule
  //      snake 키를 직접 박는다. 둘 다 비면 settings 자체를 생략(undefined).
  settings?: Record<string, unknown>;
};

// =====================================================================
// 이전 대회 불러오기 모달 — 운영 DB 실데이터
// =====================================================================
type JsonRecord = Record<string, unknown>;
type PreviousDivisionRule = {
  code?: string;
  label?: string;
  feeKrw?: number;
  sortOrder?: number;
  format?: string | null;
  settings?: JsonRecord | null;
};
type PreviousTournament = {
  id: string;
  name: string;
  startDate?: string | null;
  venueName?: string | null;
  organizer?: string | null;
  host?: string | null;
  sponsors?: string | null;
  poster?: string | null;
  format?: string | null;
  places?: unknown;
  categories?: unknown;
  divCaps?: unknown;
  divFees?: unknown;
  entryFee?: number;
  gameRules?: unknown;
  settings?: JsonRecord | null;
  divisionRules?: PreviousDivisionRule[];
};

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function objectMap(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function numberMap(value: unknown): Record<string, number> {
  const source = objectMap(value);
  return Object.fromEntries(Object.entries(source).map(([k, v]) => [k, numberValue(v)]));
}

function copyableSettings(value: unknown): JsonRecord {
  const source = objectMap(value);
  const { div_schedule: _divSchedule, ...rest } = source;
  void _divSchedule;
  return rest;
}

function previousVenues(t: PreviousTournament): Venue[] {
  const places = Array.isArray(t.places) ? t.places : [];
  const fromPlaces: Venue[] = [];
  places.forEach((raw) => {
    if (!isRecord(raw)) return;
    const provider = raw.provider === "kakao" || raw.provider === "google" ? raw.provider : undefined;
    const name = text(raw.name);
    if (!name) return;
    fromPlaces.push({
      id: text(raw.id) || ctUid("v"),
      name,
      region: text(raw.region),
      courtCount: Math.max(1, numberValue(raw.courtCount ?? raw.court_count, 1)),
      naming: raw.naming === "alpha" ? "alpha" : "num",
      provider,
      placeId: text(raw.placeId ?? raw.place_id) || undefined,
      lat: typeof raw.lat === "number" ? raw.lat : undefined,
      lng: typeof raw.lng === "number" ? raw.lng : undefined,
      phone: text(raw.phone) || undefined,
      category: text(raw.category) || undefined,
      mapUrl: text(raw.mapUrl ?? raw.map_url) || undefined,
      routeUrl: text(raw.routeUrl ?? raw.route_url) || undefined,
    });
  });

  if (fromPlaces.length > 0) return fromPlaces;
  const venueName = text(t.venueName);
  return venueName ? [{ id: ctUid("v"), name: venueName, region: "", courtCount: 1, naming: "num" }] : [];
}

function previousSponsors(t: PreviousTournament): Sponsor[] {
  const names = (t.sponsors ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const settings = objectMap(t.settings);
  const logos = Array.isArray(settings.sponsor_logos) ? settings.sponsor_logos.filter(isRecord) : [];
  const logoByName = new Map(logos.map((s) => [text(s.name), text(s.logoUrl ?? s.logo_url)]));
  return names.map((name) => ({ id: ctUid("sp"), name, logoUrl: logoByName.get(name) ?? "" }));
}

function categoriesFromPrevious(t: PreviousTournament): CategoryItem[] {
  const categories = objectMap(t.categories);
  const divCaps = numberMap(t.divCaps);
  const divFees = numberMap(t.divFees);
  const fromCategoryMap: CategoryItem[] = [];
  Object.entries(categories).forEach(([name, rawDivisions]) => {
    const divisions = Array.isArray(rawDivisions)
      ? rawDivisions.map(text).filter(Boolean)
      : [];
    if (!name.trim() || divisions.length === 0) return;
    fromCategoryMap.push({
      id: ctUid("c"),
      name,
      divisions: divisions.map((division) => ({
        id: ctUid("d"),
        name: division,
        cap: divCaps[division] ?? 0,
        fee: divFees[division] ?? numberValue(t.entryFee),
      })),
    });
  });

  if (fromCategoryMap.length > 0) return fromCategoryMap;

  const grouped = new Map<string, PreviousDivisionRule[]>();
  (t.divisionRules ?? []).forEach((rule) => {
    const settings = objectMap(rule.settings);
    const category = text(settings.category) || "기본 종별";
    grouped.set(category, [...(grouped.get(category) ?? []), rule]);
  });

  return Array.from(grouped.entries()).map(([name, rules]) => ({
    id: ctUid("c"),
    name,
    divisions: rules.map((rule) => {
      const division = text(rule.label) || text(rule.code) || "디비전";
      return {
        id: ctUid("d"),
        name: division,
        cap: divCaps[division] ?? 0,
        fee: numberValue(rule.feeKrw, divFees[division] ?? numberValue(t.entryFee)),
      };
    }),
  }));
}

function LoadPreviousModal({
  open,
  onClose,
  onLoad,
  rows,
  loading,
  error,
  onRetry,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (t: PreviousTournament) => void;
  rows: PreviousTournament[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    if (open) setQ("");
  }, [open]);
  const filteredRows = rows.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title="이전 대회 불러오기" sub="기존 대회의 형식·설정·종별 구성을 그대로 가져와 채웁니다. 날짜·참가팀은 제외됩니다.">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "0 14px", background: "var(--grey-100)", borderRadius: "var(--radius-input)" }}>
        <Icon name="search" size={18} color="var(--ink-dim)" />
        <input className="ts-input" style={{ background: "transparent", padding: "13px 0" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="대회명으로 검색" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-mute)", fontSize: 14 }}>이전 대회를 불러오는 중입니다</div>}
        {!loading && error && (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--ink-mute)", fontSize: 14 }}>
            <div>{error}</div>
            <Btn variant="secondary" size="sm" onClick={onRetry} style={{ marginTop: 12 }}>
              다시 시도
            </Btn>
          </div>
        )}
        {!loading && !error && filteredRows.map((t) => {
          const cats = categoriesFromPrevious(t);
          const divs = cats.reduce((sum, cat) => sum + cat.divisions.length, 0);
          const venue = text(t.venueName) || previousVenues(t)[0]?.name || "장소 미정";
          return (
          <button key={t.id} type="button" className="ct-pastrow" onClick={() => onLoad(t)}>
            <span className="ct-pastrow__icon">
              <Icon name="trophy" size={18} color="var(--primary)" />
            </span>
            <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>{t.name}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-mute)", marginTop: 2 }}>
                {(t.startDate ?? "").slice(0, 10) || "일정 미정"} · {venue} · {cats.length}종별 {divs}디비전
              </span>
            </span>
            <Icon name="chevron-right" size={18} color="var(--ink-dim)" />
          </button>
          );
        })}
        {!loading && !error && filteredRows.length === 0 && <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-mute)", fontSize: 14 }}>{rows.length === 0 ? "불러올 수 있는 이전 대회가 없습니다" : "검색 결과가 없습니다"}</div>}
      </div>
    </Modal>
  );
}

// =====================================================================
// 대회 게시 설정 모달 (게시/참가신청 기간 + 결제 + 입금계좌) — 시안 PublishModal 1:1
//   왜: 시안은 종별·필수값 검증 후 이 모달에서 게시·결제 정보를 받아 실제 생성한다.
//   결제 방법: 계좌이체(bank)만 활성. 간편결제·카드는 "준비 중"(disabled).
// =====================================================================
const PAY_METHODS: [string, string, boolean][] = [
  ["계좌이체", "bank", false],
  ["간편결제", "easy", true],
  ["카드 결제", "card", true],
];
const BANKS = ["국민", "신한", "우리", "하나", "농협", "기업", "카카오뱅크", "토스뱅크", "새마을금고"];

function PublishModal({
  open,
  name,
  saving,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: (p: PublishInfo) => void;
}) {
  // 초기값 — 게시기간/참가신청기간 비움, 결제는 계좌이체 기본 선택
  const blank: PublishInfo = { postStart: "", postEnd: "", regStart: "", regEnd: "", pays: ["bank"], bank: "국민", account: "", holder: "" };
  const [p, setP] = React.useState<PublishInfo>(blank);
  // 모달 열릴 때마다 초기화(시안 1:1)
  React.useEffect(() => {
    if (open) setP(blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = <K extends keyof PublishInfo>(k: K, v: PublishInfo[K]) => setP((s) => ({ ...s, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="대회 게시 설정" sub="게시·참가신청·결제 정보를 입력하고 대회를 생성하세요.">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* 대회명 미리보기 */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", background: "var(--primary-weak)", borderRadius: 12 }}>
          <Icon name="trophy" size={17} color="var(--primary)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{name || "새 대회"}</span>
        </div>

        {/* 게시 기간 (대회 페이지 공개 기간 = 시작/종료일로 매핑) */}
        <div className="ts-field" style={{ marginBottom: 0 }}>
          <label className="ts-field__label">게시 기간</label>
          <div className="ct-daterange">
            <input className="ts-input" type="date" value={p.postStart} onChange={(e) => set("postStart", e.target.value)} />
            <span className="ct-daterange__sep">~</span>
            <input className="ts-input" type="date" value={p.postEnd} onChange={(e) => set("postEnd", e.target.value)} />
          </div>
          <div className="ts-field__hint">대회 페이지가 공개되는 기간</div>
        </div>

        {/* 참가신청 기간 */}
        <div className="ts-field" style={{ marginBottom: 0 }}>
          <label className="ts-field__label">참가신청 기간</label>
          <div className="ct-daterange">
            <input className="ts-input" type="date" value={p.regStart} onChange={(e) => set("regStart", e.target.value)} />
            <span className="ct-daterange__sep">~</span>
            <input className="ts-input" type="date" value={p.regEnd} onChange={(e) => set("regEnd", e.target.value)} />
          </div>
          <div className="ts-field__hint">참가팀이 신청할 수 있는 기간</div>
        </div>

        {/* 결제 방법 (계좌이체만 활성) */}
        <div className="ts-field" style={{ marginBottom: 0 }}>
          <label className="ts-field__label">결제 방법</label>
          <div className="ct-paygrid">
            {PAY_METHODS.map(([lbl, val, soon]) => {
              const on = p.pays.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  className="ct-paychip"
                  data-on={on ? "true" : "false"}
                  disabled={soon}
                  onClick={() => {
                    if (soon) return;
                    set("pays", on ? p.pays.filter((x) => x !== val) : [...p.pays, val]);
                  }}
                >
                  <span className="ct-paychip__box">{on && <Icon name="check" size={13} />}</span>
                  <span className="ct-paychip__lbl">{lbl}</span>
                  {soon && <span className="ct-paychip__soon">준비 중</span>}
                </button>
              );
            })}
          </div>
          <div className="ts-field__hint">여러 개 선택 가능 · 현재 계좌이체만 지원</div>
        </div>

        {/* 입금 계좌 (계좌이체 선택 시) */}
        {p.pays.includes("bank") && (
          <div className="ts-field" style={{ marginBottom: 0 }}>
            <label className="ts-field__label">입금 계좌</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="ts-select" style={{ flex: "0 0 130px" }} value={p.bank} onChange={(e) => set("bank", e.target.value)}>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <input
                  className="ts-input"
                  value={p.account}
                  onChange={(e) => set("account", e.target.value)}
                  placeholder="계좌번호"
                  inputMode="numeric"
                  onKeyDown={(e) => {
                    // 한글 IME 가드 (계좌번호엔 한글 없지만 일관성 — 룰)
                    if (e.nativeEvent.isComposing) return;
                  }}
                />
              </div>
              <input
                className="ts-input"
                value={p.holder}
                onChange={(e) => set("holder", e.target.value)}
                placeholder="예금주"
                onKeyDown={(e) => {
                  // 한글 IME 가드 (예금주 한글 입력)
                  if (e.nativeEvent.isComposing) return;
                }}
              />
            </div>
            <div className="ts-field__hint">참가비를 입금받을 계좌</div>
          </div>
        )}
      </div>

      {/* 액션 */}
      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }} disabled={saving}>
          취소
        </Btn>
        <Btn icon={saving ? undefined : "check"} style={{ flex: 2, opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={() => onConfirm(p)}>
          {saving ? <span className="ct-spin" /> : null}
          {saving ? "생성 중…" : "대회 생성"}
        </Btn>
      </div>
    </Modal>
  );
}

// =====================================================================
// 후원사 필드 (이름 입력 + 운영 ImageUploader 로 로고)
// =====================================================================
function SponsorField({
  sponsors,
  setSponsors,
  toast,
}: {
  sponsors: Sponsor[];
  setSponsors: (next: Sponsor[]) => void;
  toast: (msg: string) => void;
}) {
  const [name, setName] = React.useState("");
  const add = () => {
    const v = name.trim();
    if (!v) return;
    if (sponsors.some((s) => s.name === v)) {
      toast("이미 추가된 후원사입니다");
      return;
    }
    setSponsors([...sponsors, { id: ctUid("sp"), name: v, logoUrl: "" }]);
    setName("");
  };
  const remove = (id: string) => setSponsors(sponsors.filter((s) => s.id !== id));
  const setLogo = (id: string, url: string) => setSponsors(sponsors.map((s) => (s.id === id ? { ...s, logoUrl: url } : s)));
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: sponsors.length ? 12 : 0 }}>
        <input
          className="ts-input"
          value={name}
          placeholder="후원사명을 입력하세요"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            // 한글 IME 가드
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Btn variant="secondary" icon="plus" onClick={add}>
          추가
        </Btn>
      </div>
      {sponsors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {sponsors.map((s) => (
            <div key={s.id} className="ct-sptile">
              <button type="button" className="ct-sptile__x" onClick={() => remove(s.id)} aria-label="후원사 삭제">
                <Icon name="x" size={13} />
              </button>
              <ImageUploader
                value={s.logoUrl}
                onChange={(url) => setLogo(s.id, url)}
                bucket="tournament-assets"
                path="tournaments/sponsors"
                label="로고"
                aspectRatio="1/1"
              />
              <div className="ct-sptile__name">{s.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 메인
// =====================================================================
export function CtCreateTournament({
  seriesOptions,
  seriesLoaded,
  myOrgs,
  onSeriesCreated,
  onCancel,
  onSubmitDraft,
  saving = false,
  toast,
}: {
  seriesOptions: SeriesOption[];
  seriesLoaded: boolean;
  myOrgs: { id: string; name: string }[];
  onSeriesCreated: (s: CreatedSeries) => void;
  onCancel: () => void;
  // B-4: 게시 모달 확인 시 실제 POST 배선. payload 는 POST body 형태로 완성되어 전달됨.
  onSubmitDraft: (payload: CtDraftPayload) => void;
  // POST 진행 중 여부 — 게시 모달 버튼 스피너/잠금에 사용(page.tsx 가 제어)
  saving?: boolean;
  toast: (msg: string) => void;
}) {
  // 대회 정보(경기설정은 별도 gameRules state 로 분리 — B-4)
  const [d, setD] = React.useState({
    name: "",
    isRegular: false,
    seriesId: "" as string,
    seriesName: "",
    organizer: "",
    host: "",
    poster: "",
  });
  const [venues, setVenues] = React.useState<Venue[]>([]);
  const [dates, setDates] = React.useState<DateRow[]>([]);
  const [sponsors, setSponsors] = React.useState<Sponsor[]>([]);
  // 종별·디비전(우측 CtDivisions controlled) — CategoryItem[] 보유, 제출 시 평면변환
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  // 경기 설정(우측 CtGameSettings controlled) — GameRules 정본 기본값
  const [gameRules, setGameRules] = React.useState<GameRules>({ ...GAME_SETTINGS_DEFAULTS });
  const [copiedFormat, setCopiedFormat] = React.useState<string | null>(null);
  const [copiedSettings, setCopiedSettings] = React.useState<JsonRecord>({});
  const [touched, setTouched] = React.useState(false);
  const [loadOpen, setLoadOpen] = React.useState(false);
  const [previousRows, setPreviousRows] = React.useState<PreviousTournament[]>([]);
  const [previousLoading, setPreviousLoading] = React.useState(false);
  const [previousLoaded, setPreviousLoaded] = React.useState(false);
  const [previousError, setPreviousError] = React.useState<string | null>(null);
  const [showSeriesForm, setShowSeriesForm] = React.useState(false);
  // 게시 모달 — 필수값 검증 통과 시 오픈(시안 1:1)
  const [pubOpen, setPubOpen] = React.useState(false);

  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((p) => ({ ...p, [k]: v }));
  const nameOk = d.name.trim().length > 0;
  const courts = allCourts(venues);

  const loadPreviousRows = React.useCallback(async () => {
    setPreviousLoading(true);
    setPreviousError(null);
    try {
      const res = await fetch("/api/web/admin/tournaments/previous");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "이전 대회 목록을 불러오지 못했습니다");
      }
      const list = Array.isArray(json.data) ? json.data : [];
      setPreviousRows(list as PreviousTournament[]);
      setPreviousLoaded(true);
    } catch (err) {
      setPreviousError(err instanceof Error ? err.message : "이전 대회 목록을 불러오지 못했습니다");
    } finally {
      setPreviousLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (loadOpen && !previousLoaded && !previousLoading) {
      void loadPreviousRows();
    }
  }, [loadOpen, previousLoaded, previousLoading, loadPreviousRows]);

  // ── 장소 · 코트 ─────────────────────────────────────────────────────
  const addVenue = (draft: VenueDraft) => {
    const venue = venueFromDraft(draft);
    if (!venue.name) return;
    if (venues.some((x) => x.name === venue.name || (venue.placeId && x.placeId === venue.placeId))) {
      toast("이미 등록된 장소입니다");
      return;
    }
    setVenues((p) => [...p, venue]);
  };
  // 장소 변경/삭제 시 dates 의 무효 courtId 정리(시안 pruneCourts 1:1)
  const pruneCourts = (nextVenues: Venue[]) => {
    const valid = new Set(allCourts(nextVenues).map((c) => c.id));
    setDates((ds) => ds.map((dt) => ({ ...dt, courtIds: (dt.courtIds || []).filter((cid) => valid.has(cid)) })));
  };
  const updateVenue = (id: string, patch: Partial<Venue>) => {
    const next = venues.map((v) => (v.id === id ? { ...v, ...patch } : v));
    setVenues(next);
    pruneCourts(next);
  };
  const removeVenue = (id: string) => {
    const next = venues.filter((x) => x.id !== id);
    setVenues(next);
    pruneCourts(next);
  };

  // ── 날짜 · 코트 배정 ────────────────────────────────────────────────
  const syncDates = (dateStrings: string[]) => {
    const sorted = [...dateStrings].sort();
    const next = sorted.map((ds) => dates.find((p) => p.date === ds) || { id: ctUid("dt"), date: ds, courtIds: [] });
    setDates(next);
  };
  const removeDate = (id: string) => setDates((p) => p.filter((dt) => dt.id !== id));
  const toggleDateCourt = (dateId: string, courtId: string) =>
    setDates((ds) =>
      ds.map((dt) =>
        dt.id === dateId
          ? { ...dt, courtIds: (dt.courtIds || []).includes(courtId) ? dt.courtIds.filter((c) => c !== courtId) : [...(dt.courtIds || []), courtId] }
          : dt,
      ),
    );

  // ── 이전 대회 불러오기 (실데이터 채움) ───────────────────────────────
  const loadPrevious = (t: PreviousTournament) => {
    const nextNum = (t.name.match(/#(\d+)/) || [])[1];
    setD((p) => ({
      ...p,
      name: nextNum ? t.name.replace(/#\d+/, `#${+nextNum + 1}`) : `${t.name} (복사)`,
      host: t.host || t.organizer || p.host,
      organizer: t.organizer || t.host || p.organizer,
      poster: t.poster || p.poster,
    }));
    setCopiedFormat(t.format ?? null);
    setCopiedSettings(copyableSettings(t.settings));
    setGameRules(normalizeGameRules(t.gameRules));
    setSponsors(previousSponsors(t));
    setCategories(categoriesFromPrevious(t));
    const nextVenues = previousVenues(t);
    if (nextVenues.length > 0) setVenues(nextVenues);
    setDates([]);
    setLoadOpen(false);
    toast(`'${t.name}' 형식·설정 불러옴`);
  };

  // 시리즈 인라인 생성 성공
  const handleSeriesCreated = (created: CreatedSeries) => {
    set("seriesId", created.id);
    setShowSeriesForm(false);
    onSeriesCreated(created);
  };

  // 종별 디비전 총합 (메타 표시 + 필수 검증)
  const totalDiv = categories.reduce((a, c) => a + c.divisions.length, 0);

  // ── 1차 제출 (필수값 검증 → 통과 시 게시 모달 오픈) — 시안 submit 1:1 ──
  const submit = () => {
    setTouched(true);
    const miss: string[] = [];
    if (!d.name.trim()) miss.push("대회명");
    if (!d.organizer.trim()) miss.push("주최");
    if (!d.host.trim()) miss.push("주관");
    if (d.isRegular && !d.seriesId) miss.push("정규대회 선택");
    if (venues.length === 0) miss.push("장소");
    if (dates.length === 0) miss.push("대회 일정");
    if (totalDiv === 0) miss.push("종별·디비전"); // B-4 신규: 종별 1개 이상 필수
    if (miss.length) {
      toast(`필수 입력 누락: ${miss.join(", ")}`);
      return;
    }
    // 검증 통과 → 게시 모달에서 게시/결제 정보 받음
    setPubOpen(true);
  };

  // ── 2차 제출 (게시 모달 확인 → POST body 형태로 평면변환 후 부모에게 전달) ──
  //   왜: categories(CategoryItem[]) 를 createTournament 가 받는 3개 Record 로 평면화.
  //       page.tsx 는 받은 payload 를 그대로 POST 한다(API/schema 확장 0).
  const publish = (pub: PublishInfo) => {
    // B-1 places 확장형 / scheduleDates 규격으로 변환
    const places = venues.map(serializeVenue).filter((v) => v.name);
    const scheduleDates = dates.map((dt) => ({ id: dt.id, date: dt.date, court_ids: dt.courtIds }));

    // ── 종별·디비전 평면변환 ───────────────────────────────────────────
    //   categories: { 종별명: [디비전명, ...] } / divCaps: { 디비전명: cap } / divFees: { 디비전명: fee }
    //   ⚠ 디비전명은 createTournament 의 단일 키 → 디비전명 중복 시 마지막 값으로 덮어씀(시안도 동일 가정).
    //   ⚠ 디비전별 dateId/courtId(경기날짜·코트)는 1차 미저장:
    //     createTournament 가 받는 키는 categories/divCaps/divFees 3종뿐(디비전→날짜/코트 맵 키 부재).
    //     API/schema 확장 없이 보존할 자리가 없어, 입력 UI(ct-divisions)는 유지하되 저장은 후속
    //     DivisionRule 설정 단계에서 처리(대회 생성 후 상세 화면). 여기서 사일런트 손실만 명시.
    const catRecord: Record<string, string[]> = {};
    const divCaps: Record<string, number> = {};
    const divFees: Record<string, number> = {};
    categories.forEach((c) => {
      catRecord[c.name] = c.divisions.map((dv) => dv.name);
      c.divisions.forEach((dv) => {
        if (typeof dv.cap === "number") divCaps[dv.name] = dv.cap;
        if (typeof dv.fee === "number") divFees[dv.name] = dv.fee;
      });
    });

    // ── F-1: settings jsonb 로 보존할 두 종류 데이터 구성 ──────────────────
    //   ① 후원사 로고URL — sponsors 컬럼은 이름만(콤마문자열) 저장하므로 로고는 여기 별도 보존.
    //      로고가 있는 후원사만 {name, logoUrl} 로 수집(이름은 trim).
    const sponsorLogos = sponsors
      .filter((s) => s.logoUrl)
      .map((s) => ({ name: s.name.trim(), logoUrl: s.logoUrl }));
    //   ② 디비전별 경기날짜/코트 — categories/divCaps/divFees 로는 못 담는 dateId/courtId 를
    //      { 디비전명: { dateId, courtId } } 맵으로 보존. dateId·courtId 둘 다 값이 있을 때만.
    const divSchedule: Record<string, { dateId: string; courtId: string }> = {};
    categories.forEach((c) => {
      c.divisions.forEach((dv) => {
        if (dv.dateId && dv.courtId) {
          divSchedule[dv.name] = { dateId: dv.dateId, courtId: dv.courtId };
        }
      });
    });
    //   비어있지 않은 것만 settings 에 담는다(둘 다 비면 settings 자체 생략 → undefined).
    const settings: Record<string, unknown> = { ...copiedSettings };
    if (sponsorLogos.length > 0) settings.sponsor_logos = sponsorLogos;
    if (Object.keys(divSchedule).length > 0) settings.div_schedule = divSchedule;

    const { name, isRegular, seriesId, seriesName, organizer, host, poster } = d;
    onSubmitDraft({
      name: name.trim(),
      isRegular,
      seriesId: seriesId || null,
      seriesName,
      organizer,
      host,
      poster,
      // 후원사 → 이름만 콤마 구분 문자열(DB String 컬럼·표시 화면 `.split(",")` 정합).
      //   빈 이름 제거 후 join. 0개면 "" → page.tsx 에서 undefined 처리.
      //   ⚠ 로고URL(s.logoUrl)은 전용 컬럼 부재로 1차 미저장(후속 — JSON 보존하려면 schema 확장 필요).
      sponsors: sponsors.map((s) => s.name.trim()).filter(Boolean).join(", "),
      // gameRules = CtGameSettings 가 편집한 GameRules 12키(camelCase 그대로 jsonb 저장)
      gameRules: { ...gameRules },
      places,
      scheduleDates,
      categories: catRecord,
      divCaps,
      divFees,
      // 게시 모달 입력 — 게시기간 → 대회 시작/종료, 참가신청기간 → registration*
      startDate: pub.postStart || null,
      endDate: pub.postEnd || null,
      registrationStartAt: pub.regStart || null,
      registrationEndAt: pub.regEnd || null,
      // 결제 = 계좌이체(bank)만 → 은행/계좌/예금주
      bankName: pub.pays.includes("bank") ? pub.bank : "",
      bankAccount: pub.pays.includes("bank") ? pub.account : "",
      bankHolder: pub.pays.includes("bank") ? pub.holder : "",
      format: copiedFormat,
      // F-1: 후원사 로고·디비전 일정 보존(둘 다 비면 undefined → 미전송)
      settings: Object.keys(settings).length > 0 ? settings : undefined,
    });
  };

  return (
    <div className="ct-page">
      {/* 헤더 */}
      <div className="ct-head">
        <div className="ct-head__txt">
          <div className="ts-ph__eyebrow">대회 운영 · 생성</div>
          <h1 className="ts-ph__title">새 대회 만들기</h1>
          <p className="ts-ph__sub" style={{ marginTop: 6 }}>
            이름·주최·일정·장소를 입력해 대회를 만듭니다. 종별·경기 설정은 우측에서 진행합니다.
          </p>
        </div>
        <div className="ct-head__aux">
          <Btn variant="secondary" size="sm" icon="copy" onClick={() => setLoadOpen(true)}>
            이전 대회 불러오기
          </Btn>
          <Btn variant="secondary" size="sm" icon="file-text" onClick={() => toast("PDF 요강 채우기로 이동합니다")}>
            PDF로 채우기
          </Btn>
          <Btn variant="secondary" size="sm" icon="wand-sparkles" onClick={() => toast("협회 대회 마법사 — super admin 전용")}>
            협회 마법사
          </Btn>
        </div>
      </div>

      <div className="ct-grid ct-grid--2">
        {/* 좌측 — 대회 정보 + 일정·장소 */}
        <div className="ct-col" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="ts-card">
            {/* 카드 헤더 */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
              <span className="ct-headicon">
                <Icon name="clipboard-list" size={18} color="var(--primary)" />
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>대회 정보</span>
            </div>

            {/* 대회명 */}
            <div className="ts-field">
              <label className="ts-field__label">
                대회명<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
              </label>
              <input
                className="ts-input"
                value={d.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="대회 이름을 입력하세요"
                aria-invalid={touched && !nameOk}
                style={touched && !nameOk ? { boxShadow: "0 0 0 2px var(--danger)", background: "var(--card)" } : undefined}
              />
              {touched && !nameOk ? (
                <div style={{ fontSize: 12.5, color: "var(--danger)", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="alert-circle" size={14} />
                  대회명은 필수입니다
                </div>
              ) : (
                <div className="ts-field__hint">예: 강남구협회장배 #10</div>
              )}
            </div>

            {/* 정규대회 여부 — 일반대회 / 정규대회(시리즈 실연동) */}
            <div className="ts-field">
              <label className="ts-field__label">
                정규대회 여부<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
              </label>
              <div className="ts-segment" style={{ maxWidth: 280 }}>
                {([["일반대회", false], ["정규대회", true]] as const).map(([lbl, val]) => (
                  <button
                    key={lbl}
                    type="button"
                    className="ts-segment__btn"
                    data-active={d.isRegular === val ? "true" : "false"}
                    onClick={() => set("isRegular", val)}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <div className="ts-field__hint">협회 정규대회(시리즈) / 오픈·이벤트 대회</div>
            </div>

            {/* 정규대회 선택 (시리즈 실연동 — page.tsx 패턴 재사용) */}
            {d.isRegular && (
              <div className="ts-field">
                <label className="ts-field__label">
                  정규대회 선택<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
                </label>
                <select
                  className="ts-select"
                  value={d.seriesId}
                  onChange={(e) => set("seriesId", e.target.value)}
                  disabled={!seriesLoaded}
                  aria-invalid={touched && !d.seriesId}
                  style={touched && !d.seriesId ? { boxShadow: "0 0 0 2px var(--danger)" } : undefined}
                >
                  <option value="">정규대회를 선택하세요</option>
                  {seriesOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.organization?.name ?? "단체 미연결"})
                    </option>
                  ))}
                </select>
                {/* 새 정규대회(시리즈) 생성 — 운영 InlineSeriesForm 재사용 */}
                {!showSeriesForm ? (
                  <button
                    type="button"
                    onClick={() => setShowSeriesForm(true)}
                    style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, color: "var(--primary)", background: "transparent", border: 0, cursor: "pointer" }}
                  >
                    <Icon name="plus" size={14} />새 정규대회 만들기
                  </button>
                ) : (
                  <InlineSeriesForm myOrgs={myOrgs} onCreated={handleSeriesCreated} onCancel={() => setShowSeriesForm(false)} />
                )}
                <div className="ts-field__hint">기존 정규대회에서 선택하거나 새로 생성하세요</div>
              </div>
            )}

            {/* 주최 / 주관 */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
              <div className="ts-field">
                <label className="ts-field__label">
                  주최<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
                </label>
                <input className="ts-input" value={d.organizer} onChange={(e) => set("organizer", e.target.value)} placeholder="예: 강남구농구협회" />
              </div>
              <div className="ts-field">
                <label className="ts-field__label">
                  주관<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
                </label>
                <input className="ts-input" value={d.host} onChange={(e) => set("host", e.target.value)} placeholder="예: BDR 운영위" />
              </div>
            </div>

            {/* 후원사 (선택) */}
            <div className="ts-field">
              <label className="ts-field__label">후원사</label>
              <SponsorField sponsors={sponsors} setSponsors={setSponsors} toast={toast} />
              <div className="ts-field__hint">선택 · 로고가 있으면 각 슬롯에 이미지를 첨부하세요</div>
            </div>

            {/* 포스터 (선택) — 운영 ImageUploader */}
            <div className="ts-field">
              <label className="ts-field__label">포스터</label>
              <ImageUploader
                value={d.poster}
                onChange={(url) => set("poster", url)}
                bucket="tournament-assets"
                path="tournaments/poster"
                label="대회 포스터"
                aspectRatio="3/4"
              />
              <div className="ts-field__hint">선택 · 대회 포스터 이미지를 첨부하세요</div>
            </div>
          </section>

          {/* 대회 일정 · 장소 */}
          <ScheduleVenue
            dates={dates}
            venues={venues}
            courts={courts}
            syncDates={syncDates}
            removeDate={removeDate}
            addVenue={addVenue}
            updateVenue={updateVenue}
            removeVenue={removeVenue}
            toggleDateCourt={toggleDateCourt}
          />
        </div>

        {/* 우측 — 종별·디비전 / 경기 설정 (B-4: 실폼 교체) */}
        <div className="ct-col" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 종별·디비전 빌더 (controlled) — scheduleDates 는 POST 규격으로 변환해 전달 */}
          <CtDivisions
            value={categories}
            onChange={setCategories}
            scheduleDates={dates.map((dt) => ({ id: dt.id, date: dt.date, court_ids: dt.courtIds }))}
            venues={venues}
            toast={toast}
          />
          {/* 경기 설정 (controlled) — 기록앱 정합 GameRules */}
          <CtGameSettings value={gameRules} onChange={setGameRules} />
        </div>
      </div>

      {/* 하단 고정 생성바 */}
      <div className="ct-bar">
        <div className="ct-bar__inner">
          <Btn variant="ghost" onClick={onCancel}>
            취소
          </Btn>
          <div style={{ flex: 1 }} />
          <span className="ct-bar__meta">
            {totalDiv}디비전 · {dates.length}일차 · {venues.length} 장소
          </span>
          <Btn size="lg" style={{ width: "auto", minWidth: 150 }} icon="check" onClick={submit}>
            대회 생성
          </Btn>
        </div>
      </div>

      <LoadPreviousModal
        open={loadOpen}
        onClose={() => setLoadOpen(false)}
        onLoad={loadPrevious}
        rows={previousRows}
        loading={previousLoading}
        error={previousError}
        onRetry={loadPreviousRows}
      />
      {/* 게시 설정 모달 — 검증 통과 시 오픈, 확인 시 publish(평면변환→onSubmitDraft) */}
      <PublishModal
        open={pubOpen}
        name={d.name}
        saving={saving}
        onClose={() => {
          // POST 진행 중에는 닫기 금지(중복 제출 방지)
          if (!saving) setPubOpen(false);
        }}
        onConfirm={publish}
      />
    </div>
  );
}
