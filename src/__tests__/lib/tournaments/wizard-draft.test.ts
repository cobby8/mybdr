/**
 * wizard-draft.ts vitest 회귀 가드 — Phase 1 인프라.
 *
 * 검증 범위:
 * - saveDraft / loadDraft / clearDraft 정상 round-trip
 * - SSR 안전 (window === undefined 분기)
 * - BigInt 직렬화 (Prisma BigInt 컬럼 안전 / errors.md 2026-04-17 박제 5회 사고 회귀 가드)
 * - 손상 데이터 / 빈 storage / 다른 키 격리 / 덮어쓰기 / quota 초과 silent
 *
 * 환경: vitest 기본 node — jsdom/happy-dom 미설치 (package.json 검증 완료).
 *       → globalThis.window / globalThis.sessionStorage in-memory mock 박제.
 *
 * 박제 룰:
 * - 각 test 마다 mock 재생성 (격리). afterEach 에서 globalThis 정리 (다른 test 파일 회귀 가드).
 * - SSR 분기 test 는 별도 it 블록 — globalThis.window 삭제 후 검증.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { saveDraft, loadDraft, clearDraft } from "@/lib/tournaments/wizard-draft";
import type { WizardDraft } from "@/lib/tournaments/wizard-types";

// 단일 키 — 본 파일 안에서만 사용 (wizard-draft.ts 내부의 KEY 와 정합 필요).
const KEY = "wizard:tournament:draft";

/**
 * in-memory sessionStorage mock.
 *
 * 운영 sessionStorage 의 최소 API (getItem / setItem / removeItem / clear / length / key) 박제.
 * 본 헬퍼 사용 위치: beforeEach 에서 globalThis.sessionStorage 로 부착.
 */
function createMockSessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    getItem(k: string) {
      return store.has(k) ? (store.get(k) as string) : null;
    },
    setItem(k: string, v: string) {
      store.set(k, String(v));
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
    key(idx: number) {
      return Array.from(store.keys())[idx] ?? null;
    },
  };
}

/**
 * 최소 유효 draft factory — TournamentPayload 안 4 폼 필드는 단순 spread 로 채움.
 *
 * 이유: 본 vitest 는 wizard-draft 의 직렬화/역직렬화만 검증 (TournamentPayload 의 schema validation 책임 X).
 *       → 4 폼 내부 필드는 빈 객체로 단순 박제. `as unknown as` 최소화 위해 partial 캐스팅 1회.
 */
function buildDraft(overrides: Partial<WizardDraft> = {}): WizardDraft {
  const base: WizardDraft = {
    step: 0,
    organization_id: null,
    organization_just_created: false,
    series_id: null,
    series_just_created: false,
    copy_from_last_edition: false,
    edition_number: null,
    tournament_payload: {
      title: "테스트 대회",
      description: null,
      format: null,
      // 4 폼은 본 vitest 검증 외 — 빈 객체로 박제 (직렬화 round-trip 만 검증).
      schedule: {} as WizardDraft["tournament_payload"]["schedule"],
      registration: {} as WizardDraft["tournament_payload"]["registration"],
      team: {} as WizardDraft["tournament_payload"]["team"],
      bracket: {} as WizardDraft["tournament_payload"]["bracket"],
      bannerUrl: null,
      logoUrl: null,
    },
    division_rules: [],
  };
  return { ...base, ...overrides };
}

// =============================================================================
// 환경 setup / teardown
// =============================================================================

// 기존 globalThis state 보존 (다른 test 파일 회귀 가드 — afterEach 에서 복원).
let originalWindow: typeof globalThis.window | undefined;
let originalSessionStorage: Storage | undefined;

beforeEach(() => {
  originalWindow = globalThis.window;
  originalSessionStorage = globalThis.sessionStorage;

  // window 객체 박제 — wizard-draft 의 `typeof window === "undefined"` 분기를 통과시키기 위함.
  // 실 DOM 미사용 (sessionStorage 만 필요) → 최소 mock.
  (globalThis as unknown as { window: object }).window = {};
  (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = createMockSessionStorage();
});

afterEach(() => {
  // 다른 vitest 파일 격리 — globalThis 원복.
  if (originalWindow === undefined) {
    delete (globalThis as unknown as { window?: unknown }).window;
  } else {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  }
  if (originalSessionStorage === undefined) {
    delete (globalThis as unknown as { sessionStorage?: unknown }).sessionStorage;
  } else {
    (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = originalSessionStorage;
  }
  vi.restoreAllMocks();
});

// =============================================================================
// 케이스 1: 정상 round-trip
// =============================================================================

describe("wizard-draft — saveDraft + loadDraft round-trip", () => {
  it("기본 draft 저장 후 동일 객체 로드", () => {
    // 단순 round-trip: 저장 → 로드 → 동일 결과 (deep equal)
    const draft = buildDraft({ step: 2, organization_id: 42 });

    saveDraft(draft);
    const loaded = loadDraft();

    expect(loaded).toEqual(draft);
  });

  it("같은 KEY 재저장 시 덮어쓰기 (마지막 draft 만 유지)", () => {
    // 마법사 Step 전환 시 useEffect 가 매번 saveDraft 호출 — 덮어쓰기 정합 검증
    const first = buildDraft({ step: 0, edition_number: 1 });
    const second = buildDraft({ step: 4, edition_number: 7 });

    saveDraft(first);
    saveDraft(second);
    const loaded = loadDraft();

    expect(loaded).toEqual(second);
    expect(loaded?.step).toBe(4);
    expect(loaded?.edition_number).toBe(7);
  });
});

// =============================================================================
// 케이스 2: clearDraft
// =============================================================================

describe("wizard-draft — clearDraft", () => {
  it("clearDraft 후 loadDraft = null", () => {
    saveDraft(buildDraft({ step: 3 }));
    clearDraft();

    expect(loadDraft()).toBeNull();
  });

  it("clearDraft 가 다른 sessionStorage 키에 영향 없음 (격리)", () => {
    // wizard-draft 가 sessionStorage 전체 wipe 하면 안 됨 (다른 페이지 state 보존 의무)
    const draft = buildDraft({ step: 1 });
    saveDraft(draft);
    sessionStorage.setItem("other:key", "other-value");

    clearDraft();

    expect(loadDraft()).toBeNull();
    expect(sessionStorage.getItem("other:key")).toBe("other-value");
  });
});

// =============================================================================
// 케이스 3: 빈 storage / 손상 JSON
// =============================================================================

describe("wizard-draft — loadDraft 폴백", () => {
  it("빈 sessionStorage 에서 null 반환", () => {
    expect(loadDraft()).toBeNull();
  });

  it("손상된 JSON 박제 시 null 반환 + 예외 silent", () => {
    // 옛 버전 draft / 외부 수동 박제 / 손상된 데이터 대응
    sessionStorage.setItem(KEY, "{ invalid json ${{");

    // loadDraft 가 try/catch 로 silent — 예외 누출 0 + null 반환 (caller 가 신규 draft 시작 책임)
    expect(() => loadDraft()).not.toThrow();
    expect(loadDraft()).toBeNull();
  });
});

// =============================================================================
// 케이스 4: BigInt 직렬화 (회귀 가드)
// =============================================================================

describe("wizard-draft — BigInt 직렬화 안전 (errors.md 2026-04-17 박제 5회 사고 회귀 가드)", () => {
  it("organization_id 가 BigInt 여도 round-trip 안전 (string 변환)", () => {
    // Prisma BigInt 컬럼 (예: organization_id) 이 draft 에 섞이는 케이스
    // JSON.stringify 가 native BigInt 처리 못 함 → TypeError → safeBigIntReplacer 가 string 변환
    const draftWithBigInt = buildDraft({
      // 타입은 number 로 정의되지만, 런타임에 BigInt 가 흘러들어올 가능성 검증
      organization_id: 100 as unknown as number,
    });
    // BigInt 를 강제로 박제 — replacer 가 string 변환 책임
    (draftWithBigInt as unknown as { organization_id: bigint }).organization_id = BigInt("999999999999999999");

    // saveDraft 가 TypeError 안 던져야 함 (replacer 정상 동작)
    expect(() => saveDraft(draftWithBigInt)).not.toThrow();

    const loaded = loadDraft();
    expect(loaded).not.toBeNull();
    // string 으로 보존 (caller 가 number/BigInt 캐스팅 책임 — wizard-draft.ts JSDoc 명시)
    expect(loaded?.organization_id).toBe("999999999999999999");
  });

  it("division_rules.feeKrw 가 BigInt 여도 안전 (Prisma BigInt 컬럼 함정)", () => {
    // TournamentDivisionRule.fee_krw 가 Prisma BigInt 컬럼 → wizard-draft.ts L11 의 박제 룰 검증
    const draft = buildDraft({
      division_rules: [
        {
          divisionCode: "U10",
          name: "초등 저학년",
          feeKrw: 50000 as unknown as number,
          settings: null,
        },
      ],
    });
    // 런타임 BigInt 주입
    (draft.division_rules[0] as unknown as { feeKrw: bigint }).feeKrw = BigInt("100000");

    expect(() => saveDraft(draft)).not.toThrow();

    const loaded = loadDraft();
    expect(loaded?.division_rules[0]?.feeKrw).toBe("100000");
  });
});

// =============================================================================
// 케이스 5: SSR 안전 분기 (window === undefined)
// =============================================================================

describe("wizard-draft — SSR 안전 (window === undefined)", () => {
  it("saveDraft 는 SSR 환경에서 silent 종료 (예외 0 / sessionStorage 미터치)", () => {
    // beforeEach 에서 박제한 window 제거 → SSR 환경 시뮬레이션
    delete (globalThis as unknown as { window?: unknown }).window;

    // saveDraft 호출 — 예외 0 + sessionStorage 접근 0 (분기 통과 검증)
    expect(() => saveDraft(buildDraft())).not.toThrow();
  });

  it("loadDraft 는 SSR 환경에서 null 반환", () => {
    delete (globalThis as unknown as { window?: unknown }).window;

    expect(loadDraft()).toBeNull();
  });

  it("clearDraft 는 SSR 환경에서 silent 종료", () => {
    delete (globalThis as unknown as { window?: unknown }).window;

    expect(() => clearDraft()).not.toThrow();
  });
});

// =============================================================================
// 케이스 6: quota 초과 silent (sessionStorage.setItem 가 throw)
// =============================================================================

describe("wizard-draft — sessionStorage 용량 초과 silent", () => {
  it("setItem 가 throw 해도 saveDraft 는 예외 누출 0 (운영 영향 0)", () => {
    // private mode / Safari ITP / 용량 초과 시 setItem throw — wizard-draft.ts L52-58 의 try/catch 검증
    const setItemSpy = vi.spyOn(sessionStorage, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() => saveDraft(buildDraft({ step: 2 }))).not.toThrow();
    expect(setItemSpy).toHaveBeenCalledOnce();

    setItemSpy.mockRestore();
  });
});
