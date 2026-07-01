import * as jose from "jose";

// membershipType 매핑 (낮은→높은 순서)
// 0=일반유저, 1=픽업호스트, 2=팀장, 3=대회관리자
// isAdmin=true → super_admin (별도 처리)
const MEMBERSHIP_TO_ROLE: Record<number, string> = {
  0: "free",
  1: "pickup_host",
  2: "team_leader",
  3: "tournament_admin",
};

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

const ALGORITHM = "HS256";
// M-02: 30d → 7d → 3d 단축 (2026-07-01 보안 후속·사용자 결정).
//   로그아웃이 stateless no-op(서버측 무효화 없음)이라, 로그아웃/탈취 토큰의
//   유효 노출 창 = EXPIRY. 이를 7d→3d(72h)로 줄여 노출 창을 축소.
//   ⚠️ EXPIRY = 실질 세션 길이(웹 자동 refresh/슬라이딩 없음·refresh는 비만료 토큰만).
//   즉 자동로그인(쿠키 30d) 사용자도 실제로는 EXPIRY(3d)마다 재로그인.
//   jti는 생성하나 블랙리스트 미적용(즉시 폐기 필요 시 Redis jti 또는 users.tokens_valid_after 도입).
const EXPIRY = "3d";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  admin_role?: string; // 세분화 관리자 역할: "super_admin" | "org_admin" | "content_admin" 등
  exp?: number;
  iat?: number;
  jti?: string;
}

export async function generateToken(user: {
  id: bigint;
  email: string;
  nickname: string | null;
  membershipType: number;
  isAdmin?: boolean | null;
  admin_role?: string | null; // 세분화 관리자 역할 (DB 필드)
}): Promise<string> {
  // 역할 결정: isAdmin=true → super_admin (기존 호환)
  const role = user.isAdmin
    ? "super_admin"
    : (MEMBERSHIP_TO_ROLE[user.membershipType] ?? "free");

  // admin_role: DB에 저장된 세분화 역할. isAdmin=true면 자동으로 super_admin
  const adminRole = user.isAdmin
    ? "super_admin"
    : (user.admin_role ?? undefined);

  return new jose.SignJWT({
    sub: user.id.toString(),
    email: user.email,
    name: user.nickname ?? "",
    role,
    ...(adminRole && { admin_role: adminRole }), // admin_role이 있을 때만 JWT에 포함
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function refreshToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  return new jose.SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    ...(payload.admin_role && { admin_role: payload.admin_role }), // admin_role 유지
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}
