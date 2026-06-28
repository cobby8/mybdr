// ============================================================
// _form-prefill.ts — 대회 데이터 → 마법사 FormState 매핑 (서버 전용 헬퍼)
//   ⚠ "use client" 없음 = 서버 컴포넌트(new/page.tsx · edit/page.tsx)에서만 사용.
//   ⚠ 백엔드/DB/Prisma 0변경 — 호출부가 Prisma 로 READ 한 값을 받아 순수 변환만.
//
//   제공:
//     1) divisionsFromTournament — categories(jsonb) 를 디비전 row 로 "그룹 펼침".
//        · 종별명 키 → 그 안의 디비전명 배열을 각각 row 로(category 태깅).
//        · 구(舊) 그린필드 계약 {디비전명:[디비전명]} 도, 레거시 그룹 {종별명:[디비전,...]} 도
//          동일하게 펼쳐진다(라운드트립 보존). → 양쪽 마법사 종별 prefill 일관.
//     2) buildCopyForm — 기존 대회 1건을 "복사용" FormState 로 변환(이름/일정/접수기간 비움).
// ============================================================

import type { FormState, DivisionRow } from "./_create-wizard";
import { normalizeGameRules } from "@/lib/tournaments/game-rules";

// jsonb 안전 객체화(F-2b — 재귀변환 0, 값 verbatim).
function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function jsonNum(v: unknown, d: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return d;
}

// ── 종별 prefill — categories(jsonb) → DivisionRow[] (그룹 펼침) ──────────
//   ruleRows = TournamentDivisionRule 폴백(categories 없을 때만).
export function divisionsFromTournament(
  categoriesValue: unknown,
  divCapsValue: unknown,
  divFeesValue: unknown,
  ruleRows: { code: string; label: string; feeKrw: number }[],
  entryFee: number,
): DivisionRow[] {
  const categories = asObj(categoriesValue);
  const divCaps = asObj(divCapsValue) as Record<string, number>;
  const divFees = asObj(divFeesValue) as Record<string, number>;
  const catKeys = Object.keys(categories);
  const out: DivisionRow[] = [];

  if (catKeys.length) {
    for (const catName of catKeys) {
      const raw = categories[catName];
      const divNames = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
      // 디비전 배열이 비면(비정상) 종별명 자체를 디비전으로 폴백.
      const names = divNames.length ? divNames : [catName];
      for (const divName of names) {
        out.push({
          id: `d_${out.length}`,
          label: divName,
          cap: typeof divCaps[divName] === "number" ? divCaps[divName] : null,
          fee: typeof divFees[divName] === "number" ? divFees[divName] : entryFee,
          // 종별명 = AdminCategory.name(성별 접두 포함). 디비전명과 다를 때만 그룹 태깅.
          category: catName !== divName ? catName : undefined,
        });
      }
    }
  } else {
    // categories 없음 → division rule 폴백(각 룰 = 단독 디비전).
    ruleRows.forEach((r) => {
      out.push({
        id: `d_${out.length}`,
        label: r.label,
        cap: typeof divCaps[r.code] === "number" ? divCaps[r.code] : null,
        fee: r.feeKrw ?? entryFee,
        category: undefined,
      });
    });
  }
  return out;
}

// ── 장소 prefill — places(jsonb) → Venue[] ───────────────────────────────
function venuesFromPlaces(placesValue: unknown): FormState["venues"] {
  const places = Array.isArray(placesValue) ? (placesValue as unknown[]) : [];
  return places
    .map((row, index) => {
      const r = asObj(row);
      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!name) return null;
      const cc = jsonNum(r.courtCount ?? r.court_count, 1);
      return {
        id: typeof r.id === "string" && r.id ? r.id : `v_${index}`,
        name,
        region: typeof r.region === "string" ? r.region : "",
        courtCount: cc > 0 ? Math.trunc(cc) : 1,
        naming: r.naming === "alpha" ? ("alpha" as const) : ("num" as const),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

// ── 경기설정 prefill — game_rules(jsonb) → GameRules(19키 전체) ──────────────
//   ★ normalizeGameRules 위임 = 누락 14키를 디폴트로 채워 컨트롤 깨짐 방지(create 마법사 일관).
function gameRulesFrom(grValue: unknown): FormState["gameRules"] {
  return normalizeGameRules(grValue);
}

// 복사 source = edit/page.tsx 와 동일한 Prisma select 필드(이름/일정/접수는 비움 대상).
export type CopySource = {
  organizer: string | null;
  host: string | null;
  sponsors: string | null;
  description: string | null;
  rules: string | null;
  prize_info: string | null;
  team_size: number | null;
  roster_min: number | null;
  roster_max: number | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  fee_notes: string | null;
  auto_approve_teams: boolean | null;
  allow_waiting_list: boolean | null;
  game_ball: string | null;
  format: string | null;
  // entry_fee = Prisma Decimal | number | null → Number() 로 정규화(아래 buildCopyForm).
  entry_fee: unknown;
  game_rules: unknown;
  categories: unknown;
  div_caps: unknown;
  div_fees: unknown;
  places: unknown;
};

// ── 복사용 FormState — 기존 대회 → 새 대회 폼(이름/일정/접수기간 비움) ────
//   왜 비우나: 새 대회는 이름·일정·접수기간이 달라야 하므로 합리적 조정.
//   왜 종별/장소/경기설정은 복사: 재사용성이 높은 설정(템플릿 성격).
export function buildCopyForm(t: CopySource, ruleRows: { code: string; label: string; feeKrw: number }[]): FormState {
  const entryFee = Number(t.entry_fee ?? 0); // Decimal/number/null → number
  return {
    name: "", // 비움(복사본 이름 새로 입력)
    organizer: t.organizer ?? "",
    host: t.host ?? "",
    sponsors: t.sponsors ?? "",
    description: t.description ?? "",
    venues: venuesFromPlaces(t.places),
    dates: [], // 비움(새 일정)
    format: t.format || "single_elimination",
    divisions: divisionsFromTournament(t.categories, t.div_caps, t.div_fees, ruleRows, entryFee),
    gameBall: t.game_ball ?? "",
    teamSize: t.team_size ?? 5,
    rosterMin: t.roster_min ?? 5,
    rosterMax: t.roster_max ?? 12,
    rules: t.rules ?? "",
    prize: t.prize_info ?? "",
    gameRules: gameRulesFrom(t.game_rules),
    regStart: "", // 비움(새 접수기간)
    regEnd: "",
    bankName: t.bank_name ?? "",
    bankAccount: t.bank_account ?? "",
    bankHolder: t.bank_holder ?? "",
    entryFee,
    feeNotes: t.fee_notes ?? "",
    autoApprove: t.auto_approve_teams ?? false,
    allowWaiting: t.allow_waiting_list ?? true,
  };
}
