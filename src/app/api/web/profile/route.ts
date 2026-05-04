import { withWebAuth, WEB_SESSION_COOKIE, type WebAuthContext } from "@/lib/auth/web-session";
import { encryptAccount, maskAccount } from "@/lib/security/account-crypto";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getProfile, updateProfile } from "@/lib/services/user";
import { matchPlayersByPhone } from "@/lib/services/player-matching";
import { generateToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    // M1 Day 7: followersCount/followingCount/nextGameApp 병렬 추가 (service 레벨)
    const {
      user,
      teams,
      gameApplications,
      tournamentTeams,
      followersCount,
      followingCount,
      nextGameApp,
    } = await getProfile(ctx.userId);

    if (!user) return apiError("User not found", 404);

    // account_number는 마스킹 처리 후 전송
    const { account_number, createdAt, ...userRest } = user;
    const account_number_masked = account_number
      ? maskAccount(account_number.startsWith("enc:") ? account_number : account_number)
      : null;

    // M1 Day 7: 다음 경기 요약 — 프론트에서 D-N 계산 용이하도록 ISO 문자열로 전달
    // nextGameApp이 없으면 null (허브 카드에서 "예정된 경기 없음" 표시)
    const nextGame = nextGameApp?.games
      ? {
          // 목록/상세 링크는 uuid 우선 (기존 recentGames와 동일 규칙)
          id: nextGameApp.games.uuid ?? nextGameApp.game_id.toString(),
          title: nextGameApp.games.title ?? null,
          scheduled_at: nextGameApp.games.scheduled_at?.toISOString() ?? null,
          venue_name: nextGameApp.games.venue_name ?? null,
        }
      : null;

    return apiSuccess({
      user: {
        ...userRest,
        birth_date: user.birth_date?.toISOString().slice(0, 10) ?? null,
        // 가입일을 ISO 문자열로 변환하여 전달 (profile-header에서 표시)
        created_at: createdAt?.toISOString() ?? null,
        account_number_masked,
        has_account: !!account_number,
      },
      teams: teams.map((m) => ({
        id: m.team.id.toString(),
        name: m.team.name,
        role: m.role ?? "member",
      })),
      recentGames: gameApplications.map((a) => ({
        id: a.games?.uuid ?? a.game_id.toString(),
        title: a.games?.title ?? null,
        scheduled_at: a.games?.scheduled_at?.toISOString() ?? null,
        status: a.games?.status ?? 0,
      })),
      tournaments: tournamentTeams.map((tp) => ({
        id: tp.tournamentTeam.tournament.id,
        name: tp.tournamentTeam.tournament.name,
        status: tp.tournamentTeam.tournament.status ?? null,
      })),
      // M1 Day 7: 허브 대시보드 전용 신규 필드 3종 (기존 필드 불변)
      followersCount,
      followingCount,
      nextGame,
    });
  } catch (e) {
    // errors.md 04-30: catch에서 raw 에러 삼키면 디버깅 불가 — console.error 명시
    console.error("[GET /api/web/profile]", e);
    return apiError("Internal error", 500);
  }
});

export const PATCH = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json() as Record<string, unknown>;

    const {
      // 기존 필드
      nickname, position, height, city, bio,
      // 신규 필드
      name, phone, birth_date, district, weight,
      // 2026-05-01: 본인 선호 등번호 + 선출 여부 (대회 출전 시 필수 차단 검증)
      default_jersey_number, is_elite,
      // 계좌 필드 (account_consent 필수)
      bank_name, bank_code, account_number, account_holder, account_consent,
    } = body;

    // T2-04: 닉네임 길이 검증 (2~20자)
    if (nickname !== undefined && typeof nickname === "string" && nickname.trim().length > 0) {
      const trimmed = nickname.trim();
      if (trimmed.length < 2 || trimmed.length > 20) {
        return apiError("닉네임은 2자 이상 20자 이하여야 합니다.", 400);
      }
    }

    // 계좌 필드: account_consent가 true일 때만 업데이트
    const bankUpdate: Record<string, unknown> = {};
    if (account_consent === true) {
      if (bank_name !== undefined) bankUpdate.bank_name = bank_name || null;
      if (bank_code !== undefined) bankUpdate.bank_code = bank_code || null;
      if (account_holder !== undefined) bankUpdate.account_holder = account_holder || null;
      if (account_number && typeof account_number === "string" && account_number.trim()) {
        bankUpdate.account_number = encryptAccount(account_number.trim());
      }
    }

    // 2026-05-01: birth_date Invalid Date 가드 (errors.md 박제 — PATCH 500 'Internal error' 원인)
    // new Date("invalid string") → Invalid Date → prisma 에 넘기면 PrismaClientValidationError
    // → catch fallthrough → 500. 명시적 400 응답으로 분기.
    let parsedBirthDate: Date | null = null;
    if (birth_date) {
      const d = new Date(birth_date as string);
      if (!isNaN(d.getTime())) {
        parsedBirthDate = d;
      } else {
        return apiError("생년월일 형식이 올바르지 않습니다. (예: 1995-03-15)", 400);
      }
    }

    // 2026-05-01: default_jersey_number 범위 검증 (0~999)
    let parsedJersey: number | null = null;
    if (default_jersey_number !== undefined && default_jersey_number !== null && default_jersey_number !== "") {
      const j = Number(default_jersey_number);
      if (Number.isInteger(j) && j >= 0 && j <= 999) {
        parsedJersey = j;
      } else {
        return apiError("등번호는 0~999 사이의 정수여야 합니다.", 400);
      }
    }

    // 2026-05-02: D-6 EditProfile §2 / §3 / §4 박제 활성화 — 6 필드 추가
    const dominant_hand = body.dominant_hand;
    const skill_level = body.skill_level;
    const strengths = body.strengths;
    const privacy_settings = body.privacy_settings;
    const instagram_url = body.instagram_url;
    const youtube_url = body.youtube_url;

    // 2026-05-04: F3+F4 회원가입 통합 — profile/edit §6 활동 환경 6 필드 (지역/게임유형/스타일/지역/목표/빈도)
    // 이유: 가입 1-step 단순화 후 사용자가 profile/edit 한 곳에서 모두 입력 가능해야 함.
    // F3 (preferred_regions / preferred_game_types) 는 Json 배열 컬럼.
    // F4 (styles / active_areas / goals) 는 String[] 컬럼 (Phase 10-5).
    // play_frequency 는 String? 단일 enum.
    const preferred_regions = body.preferred_regions;
    const preferred_game_types = body.preferred_game_types;
    const styles = body.styles;
    const active_areas = body.active_areas;
    const goals = body.goals;
    const play_frequency = body.play_frequency;

    // F4 enum 가드 — play_frequency 4단계 (daily/weekly/monthly/rare). 그 외 입력은 null.
    const VALID_PLAY_FREQUENCIES = ["daily", "weekly", "monthly", "rare"] as const;
    let parsedPlayFrequency: string | null | undefined = undefined;
    if (play_frequency !== undefined) {
      if (typeof play_frequency === "string" && VALID_PLAY_FREQUENCIES.includes(play_frequency as typeof VALID_PLAY_FREQUENCIES[number])) {
        parsedPlayFrequency = play_frequency;
      } else {
        parsedPlayFrequency = null; // 잘못된 enum 또는 빈문자 → null
      }
    }

    // F5 profile_completed 자동 갱신 — 핵심 5필드 (position/height/preferred_regions/skill_level/preferred_game_types) 모두 입력 시 true
    // 이유: 홈 CTA 카드 (profile-cta-card.tsx) 가 profile_completed===false 일 때만 표시. PATCH 시점에 boolean 자동 계산.
    // 방법: 본 PATCH body 의 신규값과 DB 기존값을 머지하여 5종 모두 truthy 인지 검사.
    //       기존값 조회 1회 추가 (findUnique) — 부분 업데이트 케이스 안전.
    const existing = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        position: true,
        height: true,
        preferred_regions: true,
        skill_level: true,
        preferred_game_types: true,
      },
    });
    // 머지 후 핵심 5필드 검증
    const mergedPosition = position !== undefined ? (position as string || null) : existing?.position ?? null;
    const mergedHeight = height !== undefined ? (height ? Number(height) : null) : existing?.height ?? null;
    const mergedRegions = preferred_regions !== undefined ? preferred_regions : existing?.preferred_regions;
    const mergedSkillLevel = skill_level !== undefined ? (skill_level as string || null) : existing?.skill_level ?? null;
    const mergedGameTypes = preferred_game_types !== undefined ? preferred_game_types : existing?.preferred_game_types;

    // 배열 비어있지 않은지 (Json 배열) — 빈배열은 미입력으로 간주
    const isNonEmptyArray = (v: unknown) => Array.isArray(v) && v.length > 0;
    const profileCompleted = !!(
      mergedPosition &&
      mergedHeight &&
      isNonEmptyArray(mergedRegions) &&
      mergedSkillLevel &&
      isNonEmptyArray(mergedGameTypes)
    );

    const updated = await updateProfile(ctx.userId, {
      ...(nickname !== undefined && { nickname: nickname as string || null }),
      ...(position !== undefined && { position: position as string || null }),
      ...(height !== undefined && { height: height ? Number(height) : null }),
      ...(city !== undefined && { city: city as string || null }),
      ...(bio !== undefined && { bio: bio as string || null }),
      ...(name !== undefined && { name: name as string || null }),
      ...(phone !== undefined && { phone: phone as string || null }),
      ...(birth_date !== undefined && { birth_date: parsedBirthDate }),
      ...(district !== undefined && { district: district as string || null }),
      ...(weight !== undefined && { weight: weight ? Number(weight) : null }),
      // 2026-05-01: 신규 필드 — 대회 출전 차단 검증 대상
      ...(default_jersey_number !== undefined && { default_jersey_number: parsedJersey }),
      ...(is_elite !== undefined && { is_elite: typeof is_elite === "boolean" ? is_elite : null }),
      // 2026-05-02: §2 플레이 정보 (사용손/실력/강점)
      ...(dominant_hand !== undefined && { dominant_hand: (dominant_hand as string) || null }),
      ...(skill_level !== undefined && { skill_level: (skill_level as string) || null }),
      ...(strengths !== undefined && {
        strengths: Array.isArray(strengths) ? strengths : [],
      }),
      // 2026-05-02: §3 소셜 (인스타·유튜브)
      ...(instagram_url !== undefined && { instagram_url: (instagram_url as string) || null }),
      ...(youtube_url !== undefined && { youtube_url: (youtube_url as string) || null }),
      // 2026-05-02: §4 공개 설정 (7항목 × 3옵션)
      ...(privacy_settings !== undefined && {
        privacy_settings: privacy_settings && typeof privacy_settings === "object" ? privacy_settings : {},
      }),
      // 2026-05-04: F3+F4 회원가입 통합 — §6 활동 환경 (Json/String[] 컬럼들)
      // F3 Json: 배열이 아니면 빈배열로 정규화 (DB Json 컬럼 default "[]" 일관성)
      ...(preferred_regions !== undefined && {
        preferred_regions: Array.isArray(preferred_regions) ? preferred_regions : [],
      }),
      ...(preferred_game_types !== undefined && {
        preferred_game_types: Array.isArray(preferred_game_types) ? preferred_game_types : [],
      }),
      // F4 String[]: prisma scalar list 입력은 set 필요 X (배열 그대로 전달)
      ...(styles !== undefined && {
        styles: Array.isArray(styles) ? (styles as string[]) : [],
      }),
      ...(active_areas !== undefined && {
        active_areas: Array.isArray(active_areas) ? (active_areas as string[]) : [],
      }),
      ...(goals !== undefined && {
        goals: Array.isArray(goals) ? (goals as string[]) : [],
      }),
      // F4 enum 검증된 단일값 (또는 null)
      ...(parsedPlayFrequency !== undefined && {
        play_frequency: parsedPlayFrequency,
      }),
      // F5 profile_completed 자동 갱신 — 핵심 5필드 머지 후 boolean 계산값
      profile_completed: profileCompleted,
      ...bankUpdate,
    });

    // 전화번호가 변경되었으면, 미연결 선수 자동 매칭 시도
    if (phone && typeof phone === "string") {
      try {
        await matchPlayersByPhone(ctx.userId, phone);
      } catch {
        // 매칭 실패해도 프로필 수정에는 영향 없음
      }
    }

    // 응답 객체 (snake_case 자동 변환)
    const res = apiSuccess(updated);

    // 이유: PATCH 후 JWT 재발급 누락 시 ctx.session.name(=nickname)이 토큰 만료(7d)까지 stale.
    //       referee 영역(referee/page.tsx, referee/profile/page.tsx) 3건이 session.name 직접 사용 → 옛 닉네임 노출.
    //       해결: nickname이 PATCH body에 포함되어 변경 가능성이 있으면 새 JWT 발급 + Set-Cookie.
    // 방법: generateToken에 필요한 user 필드(email/membership/isAdmin/admin_role)를 별도 findUnique 1회로 조회.
    //       JWT 재발급 실패는 best-effort — PATCH 자체 성공은 유지 (try/catch 내부 try/catch).
    if (nickname !== undefined) {
      try {
        const userForToken = await prisma.user.findUnique({
          where: { id: ctx.userId },
          select: {
            id: true,
            email: true,
            nickname: true,
            membershipType: true,
            isAdmin: true,
            admin_role: true,
          },
        });
        if (userForToken) {
          const newToken = await generateToken(userForToken);
          // 쿠키 옵션: 기존 로그인 시점과 동일하게 (httpOnly, prod=secure, sameSite=lax, path=/, 7일)
          res.cookies.set(WEB_SESSION_COOKIE, newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7일
          });
        }
      } catch (tokenErr) {
        // 재발급 실패해도 프로필 수정 자체는 성공 처리 (errors.md 2026-05-01)
        console.error("[PATCH /api/web/profile] JWT 재발급 실패:", tokenErr);
      }
    }

    return res;
  } catch (e) {
    // errors.md 04-30: catch에서 raw 에러 삼키면 디버깅 불가 — console.error 명시
    console.error("[PATCH /api/web/profile]", e);
    // P2002 nickname 중복 (2026-04-30 진단 결과) — 사용자 친화 메시지 (errors.md)
    // 캡처 49: 사용자가 다른 사람이 사용 중인 닉네임으로 변경 시도 → P2002 → 'Internal error' 마스킹 → 진단 불가
    // → 진단 패치(3a12221)로 P2002 확정 → 명시적 409 Conflict 응답으로 친화 메시지
    // 2026-05-02: ACCOUNT_ENCRYPTION_KEY 누락 친화 메시지 (errors.md 박제)
    // production Vercel 에 환경변수 미설정 시 encryptAccount → throw → 500 'Internal error'
    // → 사용자에게 "운영자 설정 필요" 명시 + 진단 정보
    const errMsg = (e as { message?: string })?.message ?? "";
    if (errMsg.includes("ACCOUNT_ENCRYPTION_KEY")) {
      console.error("[PATCH /api/web/profile] ACCOUNT_ENCRYPTION_KEY 누락:", errMsg);
      return apiError(
        "환불 계좌 암호화 설정이 누락되어 저장할 수 없습니다. 운영자에게 문의해주세요. (관리자: Vercel 환경변수 ACCOUNT_ENCRYPTION_KEY 추가 필요)",
        503,
      );
    }

    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      const target = (e as { meta?: { target?: string[] | string } })?.meta?.target;
      const targets = Array.isArray(target) ? target : target ? [target] : [];
      // 2026-05-02: 친화 메시지 분기 확장 (errors.md 박제)
      // 운영 DB 의 partial unique index 가 prisma schema 에 누락 → P2002 fallback 메시지 모호
      // 진단 (scripts/_temp/diagnose-profile-p2002.ts) 결과 phone/email 도 unique
      if (targets.includes("nickname")) {
        return apiError("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.", 409);
      }
      if (targets.includes("phone")) {
        return apiError("이미 등록된 전화번호입니다. 본인 인증된 다른 번호를 입력해주세요.", 409);
      }
      if (targets.includes("email")) {
        return apiError("이미 사용 중인 이메일입니다.", 409);
      }
      // 다른 unique 제약 위반은 일반 메시지 + 어떤 필드인지 힌트
      console.error("[PATCH /api/web/profile] P2002 unhandled target:", targets);
      return apiError(`이미 등록된 정보입니다. (${targets.join(", ") || "확인 필요"})`, 409);
    }
    return apiError("Internal error", 500);
  }
});
