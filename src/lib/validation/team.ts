import { z } from "zod";

/**
 * 팀 관련 Zod 검증 스키마
 *
 * 역할: 팀 생성/수정 요청의 입력값을 표준 규칙으로 검증한다.
 * - 한글 팀명(name): 필수, 2~30자
 * - 영문 팀명(name_en): 선택, 대소문자 알파벳/숫자/공백/하이픈만 허용 (엄격)
 *   → Phase 2A-2에서 추가된 필드. 다국어 대회/영문 검색 매칭을 위해 사용.
 * - 대표 언어(name_primary): "ko" | "en". UI에서 어느 이름을 상단에 크게 보여줄지 결정.
 */

// 영문명 규칙: 알파벳(대소문자) + 숫자 + 공백 + 하이픈만 허용
// 한글/특수문자 포함 시 거부. 공백만 들어와도 거부(뒤에 trim 후 empty는 null 처리).
const NAME_EN_REGEX = /^[A-Za-z0-9 \-]+$/;

// 영문명 스키마 — nullable + optional
// 클라이언트에서 빈 문자열("")을 보내면 null로 치환하기 위해 preprocess 사용
export const nameEnSchema = z.preprocess(
  (v) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      return t.length === 0 ? null : t;
    }
    return v;
  },
  z
    .string()
    .regex(NAME_EN_REGEX, "영문명은 영문/숫자/공백/하이픈만 허용됩니다")
    .min(1)
    .max(80, "영문명은 80자 이하여야 합니다")
    .nullable()
    .optional()
);

// 대표 언어 스키마 — "ko" | "en", 기본값 "ko"
export const namePrimarySchema = z.enum(["ko", "en"]).optional().default("ko");

// 한글 팀명 스키마 — 공통 규칙 (2~30자, 공백 trim)
const nameSchema = z
  .string()
  .trim()
  .min(2, "팀명은 2자 이상이어야 합니다")
  .max(30, "팀명은 30자 이하여야 합니다");

// 2026-04-29: 홈/어웨이 유니폼 색상 신규 필드 검증 — primary/secondary 와 동일 규칙
const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "색상 코드는 #RRGGBB 형식이어야 합니다")
  .optional();

// 2026-04-29: 로고 URL 스키마 — Supabase Storage public URL.
// preprocess 로 빈 문자열/공백을 null 로 치환 (hidden input 의 기본값 "" 처리).
// 2026-05-02: 정적 자산(`/team-logos/{slug}.png`) 도 허용 — Vercel public 폴더 경로 패턴.
//   기존 z.url() 은 절대 URL 만 통과 → 16팀 일괄 등록한 상대 경로가 PATCH 시 reject 되던 버그 fix.
const logoUrlSchema = z.preprocess(
  (v) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      return t.length === 0 ? null : t;
    }
    return v;
  },
  z
    .string()
    .max(600, "로고 URL이 너무 깁니다")
    .refine(
      (v) => /^https?:\/\//.test(v) || v.startsWith("/"),
      { message: "로고 URL 형식이 올바르지 않습니다 (http(s):// 또는 / 시작 경로만 허용)" }
    )
    .nullable()
    .optional()
);

/**
 * 팀 생성 스키마 (POST /api/web/teams 또는 createTeamAction)
 *
 * 2026-04-29: home_color / away_color 신규 필드 추가 (홈/어웨이 유니폼 색상).
 * 기존 primary_color / secondary_color 는 하위 호환 유지.
 */
export const createTeamSchema = z.object({
  name: nameSchema,
  name_en: nameEnSchema,
  name_primary: namePrimarySchema,
  description: z.string().trim().max(1000).nullable().optional(),
  primary_color: colorSchema,
  secondary_color: colorSchema,
  home_color: colorSchema,
  away_color: colorSchema,
  // 2026-04-29: 팀 로고 Storage URL (Supabase public URL). 선택 입력.
  logo_url: logoUrlSchema,
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

/**
 * 팀 수정 스키마 (PATCH /api/web/teams/[id])
 *
 * 모든 필드 선택적(부분 업데이트). name 포함.
 * PATCH에서는 name_en을 null로 명시적으로 지울 수 있어야 하므로
 * nameEnSchema가 null도 수용하도록 설계됨.
 */
export const updateTeamSchema = z.object({
  name: nameSchema.optional(),
  name_en: nameEnSchema,
  name_primary: namePrimarySchema,
  description: z.string().trim().max(1000).nullable().optional(),
  city: z.string().trim().max(50).nullable().optional(),
  district: z.string().trim().max(50).nullable().optional(),
  home_court: z.string().trim().max(100).nullable().optional(),
  founded_year: z
    .number()
    .int()
    .min(1900, "유효하지 않은 창단 연도입니다")
    .max(new Date().getFullYear(), "유효하지 않은 창단 연도입니다")
    .nullable()
    .optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "색상 코드는 #RRGGBB 형식이어야 합니다")
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "색상 코드는 #RRGGBB 형식이어야 합니다")
    .optional(),
  // 2026-04-29: 팀 관리 페이지 신규 필드 — 생성 폼과 동일 규칙 (createTeamSchema의 colorSchema와 동일)
  // 이유(왜): 팀 생성 시 입력받지만 관리 화면에서 누락되어 있던 3 필드 보강.
  home_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "색상 코드는 #RRGGBB 형식이어야 합니다")
    .optional(),
  away_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "색상 코드는 #RRGGBB 형식이어야 합니다")
    .optional(),
  // 2026-04-29: 로고 URL — Supabase Storage public URL. 빈 문자열 → null 치환은 logoUrlSchema 가 담당.
  logo_url: logoUrlSchema,
  is_public: z.boolean().optional(),
  accepting_members: z.boolean().optional(),
  max_members: z
    .number()
    .int()
    .min(2, "최대 인원은 2명 이상이어야 합니다")
    .max(50, "최대 인원은 50명 이하여야 합니다")
    .optional(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
