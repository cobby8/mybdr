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
const LATEST = {
  latest_version_code: 1,
  latest_version_name: "v0.1.0",
  // 이 코드 미만 버전은 강제 업데이트 대상
  min_supported_version_code: 1,
  // 강제 업데이트 여부 (true 면 앱이 진입 차단)
  is_mandatory: false,
  // TODO: APK Blob 업로드 후 실제 public URL 로 교체
  apk_url: "https://www.mybdr.kr/downloads/placeholder.apk",
  // TODO: APK 업로드 후 sha256 / size_bytes 실측값으로 갱신
  sha256: "",
  size_bytes: 0,
  // 릴리스 노트 (배열)
  release_notes: ["초기 릴리스"],
} as const;

export async function GET() {
  return NextResponse.json(LATEST, {
    headers: {
      // 5분 캐시 (버전 매니페스트는 자주 안 바뀜)
      "Cache-Control": "public, max-age=300",
    },
  });
}
