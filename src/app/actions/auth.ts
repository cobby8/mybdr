"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import {
  isLoginBlocked,
  recordLoginAttempt,
  clearLoginAttempts,
} from "@/lib/security/login-attempts";
import { DUMMY_HASH } from "@/lib/security/constants";
import { findUnmatchedReferee, executeMatch } from "@/lib/services/referee-matching";

/**
 * 로그인 성공 후 사전 등록 심판 자동 매칭 시도.
 * 매칭 실패가 로그인을 방해하면 안 됨 — try-catch로 감싸서 에러 시 무시.
 */
async function tryAutoMatch(userId: bigint, name: string | null, phone: string | null) {
  if (!name || !phone) return;
  try {
    const referee = await findUnmatchedReferee(name, phone);
    if (referee) {
      await executeMatch(referee.id, userId);
    }
  } catch {
    // 매칭 실패는 로그인에 영향 없음 — 조용히 무시
  }
}

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30일 (default — signupAction / devLoginAction / OAuth 보존)
  path: "/",
};

// 2026-05-04: 자동 로그인 분기용 maxAge
// - on  = 30일 (기존 동작 — 사용자 편의 default)
// - off = 8시간 (공용 PC 보호 — 같은 PC 8시간 후 자동 로그아웃)
const LOGIN_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30일
const LOGIN_MAX_AGE_SHORT = 60 * 60 * 8; // 8시간

async function getRequestIp(): Promise<string> {
  // Server Action에서는 headers()로 IP 추출 (Next.js 15: async)
  const headersList = await headers();
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function loginAction(_prevState: { error: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  // 로그인 성공 후 돌아갈 경로 (로그인 페이지에서 hidden input으로 전달)
  const redirectTo = formData.get("redirect") as string | null;
  // 2026-05-04: 자동 로그인 체크박스 — "on" / "off" / null (구버전 호환)
  // 누락 시 default on (기존 사용자 회귀 0 — 30일 세션 유지)
  const rememberMe = formData.get("remember_me") !== "off";

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력하세요." };
  }

  const ip = await getRequestIp();

  try {
    // 브루트포스 차단 (email 기준)
    const emailBlocked = await isLoginBlocked(email);
    const ipBlocked = await isLoginBlocked(ip);
    if (emailBlocked || ipBlocked) {
      return { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요." };
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // timing attack 방지: user 없어도 반드시 bcrypt 실행
    if (!user || !user.passwordDigest) {
      await bcrypt.compare(password, DUMMY_HASH);
      await recordLoginAttempt(email, ip);
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    if (user.status !== "active") {
      await recordLoginAttempt(email, ip);
      // 2026-05-05 fix: status 별 메시지 분기 (사용자 보고: "탈퇴한 계정입니다 가 더 적절").
      //   withdrawn = 탈퇴 / suspended = 정지 / 그 외 = 일반 정지 메시지
      if (user.status === "withdrawn") {
        return { error: "탈퇴한 계정입니다." };
      }
      return { error: "정지된 계정입니다." };
    }

    const valid = await bcrypt.compare(password, user.passwordDigest);
    if (!valid) {
      await recordLoginAttempt(email, ip);
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    // 로그인 성공: 시도 기록 삭제
    await clearLoginAttempts(email);

    const token = await generateToken(user);
    console.log("[loginAction] SUCCESS:", email, "cookie:", WEB_SESSION_COOKIE, "remember:", rememberMe);
    const cookieStore = await cookies();
    // 2026-05-04: 자동 로그인 체크 여부에 따라 세션 쿠키 maxAge 분기
    // 보안 속성 (httpOnly / secure / sameSite / path) 은 동일 — maxAge 만 변경
    cookieStore.set(WEB_SESSION_COOKIE, token, {
      ...COOKIE_OPTIONS,
      maxAge: rememberMe ? LOGIN_MAX_AGE_REMEMBER : LOGIN_MAX_AGE_SHORT,
    });

    // 사전 등록 심판 자동 매칭 시도 (로그인 성공 후)
    await tryAutoMatch(user.id, user.name ?? null, user.phone ?? null);
  } catch (err) {
    console.error("[loginAction] ERROR:", err);
    return { error: "로그인 중 오류가 발생했습니다." };
  }

  revalidatePath("/", "layout");

  // redirect 경로가 유효하면 해당 경로로, 아니면 홈으로
  const validRedirect = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//");
  redirect(validRedirect ? redirectTo : "/");
}

export async function signupAction(_prevState: { error: string } | null, formData: FormData) {
  // 2026-05-05 fix: 신규 가입 시 기존 세션 강제 로그아웃 (세션 충돌 fix)
  // 본질: 사용자가 다른 계정으로 로그인된 상태에서 신규 가입 시도 → 가입 직후 /login?signup=success
  //       redirect 되어도 헤더 SSR 가 기존 세션의 user 정보 (이름/사진/phone) 표시 = 사용자 혼란
  //       (cobby8@stiz.kr 케이스: 5/4 11:41 신규 이메일 가입 후 사용자가 본 화면 = 김수빈 본인 계정).
  // fix: signupAction 시작부에 기존 세션 쿠키 삭제 → 가입 흐름은 항상 비로그인 상태에서 시작.
  const cookieStoreClear = await cookies();
  cookieStoreClear.delete(WEB_SESSION_COOKIE);

  const email = formData.get("email") as string;
  const nickname = formData.get("nickname") as string;
  const password = formData.get("password") as string;
  const passwordConfirm = formData.get("password_confirm") as string;

  // 2026-05-04 가입 흐름 통합 (F1): 가입 단계 = 이메일 + 비밀번호 + 닉네임 + 약관 4 항목만.
  // 이유(왜): 기존 3-step 위저드 (포지션/키/등번호/지역/실력/게임유형) 가입 직후 모두 받아 이탈률 증가.
  //   사용자 결정 — 위 6 필드는 /profile/edit 에서 가입 이후 천천히 입력하도록 흐름 통합.
  //   User schema 의 해당 컬럼은 NULL 허용 default 이므로 User.create 시 미지정 시 자동 NULL.

  if (!email || !nickname || !password || !passwordConfirm) {
    return { error: "모든 항목을 입력하세요." };
  }
  if (nickname.length < 2 || nickname.length > 20) {
    return { error: "닉네임은 2~20자여야 합니다." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return { error: "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  try {
    // 이메일 중복 확인
    // 2026-05-05 fix: 탈퇴 회원 email 자동 정리 (B3 소급 적용)
    //   본질: B3 fix 이전 탈퇴자는 email 그대로 보존 → 재가입 시 "이미 사용 중인 이메일" 에러.
    //   사용자 보고: cobby8 5/4 20:41 탈퇴 (B3 fix 이전) → 5/5 재가입 시도 시 차단됨.
    //   fix: existingEmail.status === "withdrawn" 시 자동 anonymize + 신규 가입 진행.
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    });
    if (existingEmail) {
      if (existingEmail.status === "withdrawn") {
        // 탈퇴 회원의 email 자동 정리 → 신규 가입 진행 가능
        await prisma.user.update({
          where: { id: existingEmail.id },
          data: { email: `withdrawn_${existingEmail.id}_${Date.now()}@deleted.local` },
        });
      } else {
        return { error: "이미 사용 중인 이메일입니다." };
      }
    }

    // 닉네임 중복 확인
    const existingNickname = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingNickname) {
      return { error: "이미 사용 중인 닉네임입니다." };
    }

    const passwordDigest = await bcrypt.hash(password, 12);
    // 2026-05-04 P1 fix (보존): 회원가입 자동 로그인 ❌ 제거.
    //   기존 흐름은 signup 직후 cookies.set(WEB_SESSION_COOKIE) 으로 자동 로그인 → /verify?missing=phone 진입.
    //   사용자 의도 = 가입 후 /login 진입 + 사용자 직접 로그인 (보안 + 명확한 흐름).
    //   OAuth 흐름 (kakao/google/naver callback) 은 별도 — 이 변경 영향 없음 (callback 라우트는 자체 cookies.set).
    // 2026-05-04 가입 흐름 통합 (F1): User.create data 단순화.
    //   position/height/default_jersey_number/preferred_regions/preferred_game_types/skill_level 모두 제거.
    //   schema NULL 허용 default — User.create 시 미지정 = NULL 저장.
    await prisma.user.create({
      data: {
        email,
        nickname,
        passwordDigest,
        status: "active",
      },
      select: { id: true },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Unique constraint")) {
      return { error: "이미 사용 중인 이메일 또는 닉네임입니다." };
    }
    console.error("Signup error:", message);
    return { error: "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  // 2026-05-04 P1: signup → /login?signup=success redirect.
  //   query "signup=success" 는 로그인 페이지에서 안내 배지 노출용 (자동 로그인 ❌ / 사용자 직접 로그인).
  //   verify?missing=phone 흐름은 OAuth 신규 가입 시점에만 의미 — email 가입자는 로그인 후 verify 자동 진입 가능.
  redirect("/login?signup=success");
}

export async function devLoginAction(_prevState: { error: string } | null, _formData: FormData) {
  try {
    // DB 첫 번째 active 유저로 자동 로그인
    const user = await prisma.user.findFirst({
      where: { status: "active" },
      orderBy: { id: "asc" },
    });

    if (!user) {
      return { error: "active 유저가 없습니다." };
    }

    const token = await generateToken(user);
    const cookieStore = await cookies();
    cookieStore.set(WEB_SESSION_COOKIE, token, COOKIE_OPTIONS);
  } catch {
    return { error: "Dev 로그인 중 오류가 발생했습니다." };
  }

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  // 모든 가능한 쿠키 이름 삭제 (현재 + 레거시)
  // path 명시 + maxAge 0으로 강제 만료
  const cookieNames = [WEB_SESSION_COOKIE, "__Host-bdr_session", "bdr_session"];
  for (const name of cookieNames) {
    cookieStore.delete(name);
    // 추가 안전장치: 빈 값 + maxAge 0으로 덮어쓰기
    cookieStore.set(name, "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  // 캐시 무효화 (로그인 상태 반영)
  revalidatePath("/", "layout");
  redirect("/login");
}
