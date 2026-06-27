import { NextResponse } from "next/server";

/**
 * GET /api/v1/app/version
 * Flutter 기록앱 업데이트 매니페스트.
 *
 * release_notes는 구버전 앱 호환용 최신 1개 버전 요약이고,
 * release_history는 앱정보/업데이트 화면의 누적 릴리즈 아카이브다.
 */
const LATEST = {
  latest_version_code: 14,
  latest_version_name: "0.1.12",
  min_supported_version_code: 1,
  is_mandatory: false,
  apk_url: "https://www.mybdr.kr/api/v1/app/download",
  sha256: "28c44cf1f82e96512f2a5e2f1709e1f2aaa54779b01edf6a6cad3bd3efc77857",
  size_bytes: 80338447,
  release_notes: [
    "슈팅파울 즉시 시계정지",
    "슈팅파울/자유투 전환 잔상 제거",
    "리바운드 선택 위치 중앙 정렬",
  ],
  release_history: [
    {
      version: "0.1.12",
      date: "2026-06-28",
      summary:
        "슈팅파울 흐름과 리바운드 선택 위치를 현장 기록 흐름에 맞게 정리",
      details:
        "슈팅파울 터치 즉시 경기 시계를 멈추고, 2샷/3샷/앤드원 선택 뒤 자유투로 넘어가는 과정에서 이전 액션이 잠깐 겹쳐 보이는 현상을 줄였습니다.",
      notes: [
        { kind: "fix", text: "슈팅파울 터치 즉시 경기 시계가 정지되도록 수정" },
        {
          kind: "fix",
          text: "슈팅파울/자유투 단계 전환 중 이전 액션 버튼이 잠깐 겹쳐 보이는 현상 개선",
        },
        {
          kind: "fix",
          text: "자유투 실패/슛 실패 후 리바운드 선택 위치를 골대와 자유투 라인 사이, 코트 세로 중앙 기준으로 정렬",
        },
      ],
    },
    {
      version: "0.1.11",
      date: "2026-06-28",
      summary: "튜토리얼 하이라이트 위치 안정화",
      details:
        "튜토리얼 진행 중 하이라이트와 설명 말풍선이 실제 조작 대상에 더 정확히 붙도록 보정했습니다.",
      notes: [{ kind: "fix", text: "튜토리얼 하이라이트 위치 안정화" }],
    },
    {
      version: "0.1.10",
      date: "2026-06-27",
      summary: "현장 운영 보강과 기록 안정성 개선",
      details:
        "경기 당일 현장에서 필요한 긴급 선수 추가, 팀파울 표시, 기록 흐름 안정성 검증을 중심으로 보강했습니다.",
      notes: [
        { kind: "new", text: "현장 긴급 선수 추가" },
        { kind: "fix", text: "팀파울 표시 안정화" },
        { kind: "fix", text: "골든 기준 갱신 및 안정성 검증" },
      ],
    },
  ],
} as const;

export async function GET() {
  return NextResponse.json(LATEST, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
