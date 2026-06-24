import { NextResponse } from "next/server";

/**
 * GET /api/v1/app/version
 * 앱(Flutter) 버전 매니페스트.
 *
 * 강제 업데이트/최신 버전 안내용. 앱은 자신의 versionCode 를
 * min_supported_version_code 와 비교해 강제 업데이트 여부를 판단한다.
 *
 * - 응답 키는 repo 컨벤션(snake_case) 그대로 작성한다.
 * - 캐시 헤더(Cache-Control)를 직접 제어하기 위해 apiSuccess 대신
 *   NextResponse.json 을 직접 사용한다 (자동 snake_case 변환 미적용).
 *
 * APK Blob 업로드 절차 (APK 파일 준비되면 수동 1회):
 *   1) @vercel/blob 의 put(`apk/mybdr-v0.1.0.apk`, fileBuffer, { access: "public" }) 호출
 *      (BLOB_READ_WRITE_TOKEN env 필요 — Vercel 프로젝트 Storage 에서 발급)
 *   2) 반환된 url 을 아래 LATEST.apk_url 에 박제, sha256/size_bytes 도 실측값으로 갱신
 *   3) 새 릴리스마다 LATEST 상수 + version_code/name 만 올리고 커밋
 */

// 릴리스마다 이 상수만 갱신한다 (단일 source).
//   ★[AUTOUPDATE-D] APK 는 비공개 GitHub 릴리스(cobby8/bdr_stat_v3)에 두고,
//     apk_url 은 같은 서버의 프록시(/api/v1/app/download)를 가리킨다. 프록시가
//     서버 토큰(GH_RELEASE_TOKEN)으로 단기 서명 URL 을 받아 302 리다이렉트한다.
//   ★앱(클라)은 latest_version_name(semver)로 비교 — 'v' 접두는 클라가 방어하나 미사용 권장.
//   ★배포마다: 아래 버전/sha256/size + download/route.ts 의 TAG·ASSET_NAME 동시 갱신.
const LATEST = {
  latest_version_code: 12,
  latest_version_name: "0.1.10",
  // 이 코드 미만 버전은 강제 업데이트 대상
  min_supported_version_code: 1,
  // 강제 업데이트 여부 (true 면 앱이 진입 차단)
  is_mandatory: false,
  // 비공개 릴리스 APK 를 중계하는 서버 프록시(공개 repo 노출 없음)
  apk_url: "https://www.mybdr.kr/api/v1/app/download",
  // bdr-0.1.10.apk 실측 SHA256 / 바이트
  sha256: "3bbcd2eb7464b3a01deb87af3fc079e3e940b7eb0418f131137d5be6bfd26dc7",
  size_bytes: 79616583,
  // 릴리스 노트 (배열)
  release_notes: [
    "현장 긴급 선수 추가",
    "팀파울 표시 안정화",
    "골든 기준 갱신 및 안정성 검증",
  ],
} as const;

export async function GET() {
  return NextResponse.json(LATEST, {
    headers: {
      // 5분 캐시 (버전 매니페스트는 자주 안 바뀜)
      "Cache-Control": "public, max-age=300",
    },
  });
}
