import { NextResponse } from "next/server";

/**
 * GET /api/v1/app/version
 * Flutter 기록앱 업데이트 매니페스트.
 *
 * release_notes는 구버전 앱 호환용 최신 1개 버전 요약이고,
 * release_history는 앱정보/업데이트 화면의 누적 릴리즈 아카이브다.
 */
const LATEST = {
  latest_version_code: 17,
  latest_version_name: "0.1.15",
  min_supported_version_code: 1,
  is_mandatory: false,
  apk_url: "https://www.mybdr.kr/api/v1/app/download",
  sha256: "71ad4b21f8b4456fd3c03249230c1a2607f19c8bb8bdd4242bcd787358c8033a",
  size_bytes: 75333390,
  release_notes: [
    "큰 태블릿 액션 버튼 위치 보정",
    "보안 저장소 강화",
    "릴리즈 서명 및 난독화 강화"
  ],
  release_history: [
    {
      version: "0.1.15",
      date: "2026-06-28",
      summary: "큰 태블릿 기록 화면에서 액션 버튼 위치와 보안 배포 기반을 보강",
      details:
        "큰 태블릿에서도 슛, 자유투, 리바운드, 선수 선택 버튼이 실제 코트 영역 기준으로 안정적으로 뜨도록 보정했습니다. 로그인 정보와 토큰 저장은 Android 암호화 저장소를 명시 사용하도록 강화했고, 릴리즈 빌드는 전용 서명, 리소스 축소, 난독화 설정을 적용했습니다.",
      notes: [
        { kind: "fix", text: "큰 태블릿에서 액션 버튼과 선수 저지 선택창이 실제 코트 위치 기준으로 뜨도록 보정" },
        { kind: "fix", text: "2점/3점 슛 판정 로직은 유지하면서 팝오버 표시 위치만 동적 코트 경계에 맞춤" },
        { kind: "security", text: "로그인 저장 정보와 토큰 저장소에 Android 암호화 저장 옵션 명시" },
        { kind: "security", text: "릴리즈 APK 전용 서명, 난독화, 리소스 축소 배포 설정 강화" },
      ],
    },
    {
      version: "0.1.14",
      date: "2026-06-28",
      summary: "PBP 표시와 라이브 출전시간 동기화 안정화",
      details:
        "경기 기록 중 누락될 수 있는 타임아웃/경고 PBP 표시를 보강하고, 라이브 페이지와 통계 화면의 출전시간이 현재 코트 체류 시간까지 반영되도록 안정화했습니다. 경기 시작 시 선발 5명의 출전시간 집계도 더 안전하게 시작됩니다.",
      notes: [
        { kind: "fix", text: "PBP 통계 보기에서 타임아웃과 경고 이벤트 표시 보강" },
        { kind: "fix", text: "라이브 동기화 통계에 현재 출전 중인 선수의 체류 시간 반영" },
        { kind: "fix", text: "경기 시작 시 선발 5명 출전시간 집계 시작 순서 안정화" },
      ],
    },
    {
      version: "0.1.13",
      date: "2026-06-28",
      summary: "앱정보/업데이트 화면을 누적 릴리즈 아카이브로 확장",
      details:
        "기록앱이 어떻게 발전하고 있는지 버전별로 확인할 수 있도록 릴리즈 노트를 누적하고, 각 버전 항목을 눌러 상세 변경 내용을 볼 수 있게 했습니다.",
      notes: [
        {
          kind: "new",
          text: "앱정보/업데이트 화면에 누적 릴리즈 아카이브 추가",
        },
        {
          kind: "new",
          text: "버전별 릴리즈 노트 항목을 누르면 상세 내용을 확인할 수 있도록 개선",
        },
        {
          kind: "fix",
          text: "업데이트 매니페스트에 release_history를 추가해 최신 1개 버전뿐 아니라 이전 변경 이력까지 제공",
        },
      ],
    },
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
