import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 2026-06-08 모바일 OAuth — 앱이 provider SDK로 받은 토큰을 서버에 전달.
//   kakao: access_token (REST API 호출용) / google: id_token (tokeninfo 검증용)
export const kakaoMobileSchema = z.object({
  access_token: z.string().min(1, "access_token이 필요합니다"),
});

export const googleMobileSchema = z.object({
  id_token: z.string().min(1, "id_token이 필요합니다"),
});

export type KakaoMobileInput = z.infer<typeof kakaoMobileSchema>;
export type GoogleMobileInput = z.infer<typeof googleMobileSchema>;
