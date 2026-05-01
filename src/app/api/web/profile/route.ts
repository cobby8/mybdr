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
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      const target = (e as { meta?: { target?: string[] | string } })?.meta?.target;
      const targets = Array.isArray(target) ? target : target ? [target] : [];
      if (targets.includes("nickname")) {
        return apiError("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.", 409);
      }
      // 다른 unique 제약 위반은 일반 메시지
      return apiError("이미 등록된 정보입니다. 입력값을 확인해주세요.", 409);
    }
    return apiError("Internal error", 500);
  }
});
