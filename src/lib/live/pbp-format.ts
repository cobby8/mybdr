// 2026-05-16 (긴급 박제 — PBP 표시 한글 라벨 / 시합 운영 중).
//
// 왜 (이유):
//   라이브 페이지 Play-by-Play 컴포넌트 의 action_type 라벨 = 기존 ACTION_LABEL (단순 map) 사용 →
//   shot_made 가 1/2/3점 구분 0 / rebound 가 공/수 구분 0 / foul 이 P/T/U/D 구분 0.
//   사용자 보고 (이미지 #163) — 라이브 페이지 PBP 가 "득점", "리바운드", "파울" 만 출력 → 구체성 0.
//
// 어떻게:
//   formatPbpAction(play) = 단일 진입점 → action_type + meta (points / action_subtype / is_made) 기반 분기.
//   각 action_type 별로 사용자 명시 룰표 그대로 매핑.
//   알 수 없는 type = 원본 action_type 문자열 그대로 폴백 (안전망).
//
// 사용:
//   src/app/live/[id]/page.tsx PbpSection 의 행 렌더에서 호출.
//   기존 컴포넌트는 ACTION_LABEL 직접 lookup → 본 헬퍼 호출로 교체.

// PBP 한 행에 필요한 필드만 추출 — 호출 측 (page.tsx PlayByPlayRow / v2 PlayByPlayRowV2) 양쪽 호환.
//   structural type — 필요한 키만 정의 → 두 인터페이스 모두 그대로 통과.
export interface PbpFormatInput {
  action_type: string;
  action_subtype: string | null;
  is_made: boolean | null;
  points_scored: number;
}

/**
 * PBP 행 → 사용자가 읽는 한글 라벨.
 *
 * 룰 (사용자 명시 2026-05-16):
 *   - jump_ball / held_ball = 단순 라벨
 *   - shot_made = points 분기 (1=자유투 성공 / 2=2점 성공 / 3=3점 성공)
 *   - shot_missed = action_subtype 분기 ("3pt"/"2pt"/"1pt") → 2점 실패 / 3점 실패
 *   - rebound = action_subtype 분기 ("offensive"=공격리바운드 / "defensive"=수비리바운드)
 *   - foul = action_subtype 분기 ("P"=파울 / "T"=T파울 / "U"=U파울 / "D"=D파울)
 *   - assist / steal / block / turnover = 단순 라벨
 *
 * 알 수 없는 type / subtype = 원본 그대로 폴백 (안전망).
 */
export function formatPbpAction(p: PbpFormatInput): string {
  const subtype = p.action_subtype ?? "";

  switch (p.action_type) {
    case "jump_ball":
      return "점프볼";

    case "held_ball":
      return "헬드볼";

    // 슛 성공 — points 우선 분기 (DB 컬럼 = points_scored 정수).
    //   1점 = 자유투 / 2점 = 2점 슛 / 3점 = 3점 슛.
    case "shot_made":
    case "made_shot": // 호환성 — 일부 레거시 row 가 made_shot 키 사용 가능
    {
      if (p.points_scored === 3) return "3점 성공";
      if (p.points_scored === 2) return "2점 성공";
      if (p.points_scored === 1) return "자유투 성공";
      return "득점";
    }

    // 슛 실패 — action_subtype 으로 2pt / 3pt 구분 (DB 박제 룰).
    //   자유투 실패는 free_throw / 1pt_miss / shot_missed+subtype=1pt 등 케이스 분기.
    case "shot_missed":
    case "missed_shot": // 호환성 — 레거시
    {
      if (subtype === "3pt") return "3점 실패";
      if (subtype === "2pt") return "2점 실패";
      if (subtype === "1pt") return "자유투 실패";
      // 폴백 = is_made false + points 0 → "슛 실패"
      return "슛 실패";
    }

    // 자유투 (별도 action_type 인 경우 — 일부 레거시).
    case "free_throw":
      return p.is_made === true ? "자유투 성공" : "자유투 실패";

    // 리바운드 — subtype = "offensive" / "defensive".
    case "rebound": {
      if (subtype === "offensive") return "공격리바운드";
      if (subtype === "defensive") return "수비리바운드";
      return "리바운드";
    }

    case "rebound_off":
      return "공격리바운드";

    case "rebound_def":
      return "수비리바운드";

    case "assist":
      return "어시스트";

    case "steal":
      return "스틸";

    case "block":
      return "블록";

    case "turnover":
      return "실책";

    // 파울 — subtype = "P"(personal) / "T"(technical) / "U"(unsportsmanlike) / "D"(disqualifying).
    //
    // 2026-05-16 (긴급 박제 — Bench Technical + Delay of Game / FIBA Article 36).
    //   신규 action_subtype 5종:
    //     - "C"        = Coach Technical (Head Coach 본인 — Article 36.3)
    //     - "B_HEAD"   = Bench Tech (Head Coach 본인 B — Article 36.4 보강)
    //     - "B_BENCH"  = Bench Tech (Asst/벤치 인원 — Article 36.4 표준)
    //     - "DELAY_W"  = Delay of Game 경고 (Article 36.2.3 1차 — 점수 변동 0)
    //     - "DELAY_T"  = Delay of Game 테크니컬 (Article 36.2.3 2차+ — 자유투 1개)
    case "foul": {
      if (subtype === "C") return "코치 T (Head)";
      if (subtype === "B_HEAD") return "벤치 T (Head)";
      if (subtype === "B_BENCH") return "벤치 T (Asst/벤치)";
      if (subtype === "DELAY_W") return "지연 경고 (W)";
      if (subtype === "DELAY_T") return "지연 T (자유투)";
      if (subtype === "T") return "T파울";
      if (subtype === "U") return "U파울";
      if (subtype === "D") return "D파울";
      // subtype "P" / 미지정 = 일반 파울
      return "파울";
    }

    // 레거시 호환 — 명시 type 인 경우.
    case "foul_personal":
      return "파울";
    case "foul_technical":
      return "T파울";

    case "substitution":
      return "교체";

    case "timeout":
      return "타임아웃";

    case "team_foul":
      return "팀 파울";

    // 폴백 = 원본 action_type 그대로 (운영자 디버깅용 흔적).
    default:
      return p.action_type;
  }
}
