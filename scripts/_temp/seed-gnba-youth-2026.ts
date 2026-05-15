/**
 * 강남구협회장배 유소년부 농구대회 2026 운영 DB INSERT 스크립트 (Track B)
 *
 * 시안 데이터: 6 종별 / 36 팀 / 59 매치 (예선 46 + 순위전 13).
 *
 * 사용법:
 *   ORGANIZER_USER_ID=<BigInt user_id> npx tsx scripts/_temp/seed-gnba-youth-2026.ts
 *
 * ⚠️ 운영 DB 직접 INSERT — CLAUDE.md §🗄️ DB 정책 준수:
 *   - 사용자 명시 승인 후만 실행 (본 박제 commit = 실행 0)
 *   - idempotent — 재실행 시 기존 row 보존, 결손분만 INSERT
 *   - 사후 정리 — 작업 검증 후 본 파일 + check 스크립트 삭제 의무
 *
 * 박제 spec (planner § 1~9 통과):
 *   1) Tournament — 사전 SELECT 후 분기 (0건 신규 / 1건 재사용 / 2건+ throw)
 *   2) generateApiToken() 헬퍼 경유 (errors.md #49 룰 — prisma.tournament.create 직접 호출 금지)
 *   3) 6 TournamentDivisionRule — code 매칭 idempotent
 *   4) 36 Team SELECT (name 매칭) — 부재 시 throw + 사용자 결재 가드 (captainId FK NOT NULL)
 *   5) 36 TournamentTeam upsert — @@unique([tournamentId, teamId]) 활용
 *   6) 59 TournamentMatch INSERT — scheduledAt + division_code + match_number 복합 키 idempotent
 *   7) placeholder-helpers 통과 의무 — buildSlotLabel + buildPlaceholderNotes (인라인 문자열 ❌)
 *   8) 사후 검증 — 5 query (count + ADVANCEMENT_REGEX 매칭률 100%)
 *
 * 시각 변환 룰: KST → UTC (TournamentMatch.scheduledAt = Timestamp(6) timezone-naive)
 *   - new Date("2026-05-16T09:30:00+09:00") → UTC 2026-05-16 00:30:00 박제
 */
import { prisma } from "../../src/lib/db/prisma";
import { generateApiToken } from "../../src/lib/services/tournament";
import {
  buildSlotLabel,
  buildPlaceholderNotes,
} from "../../src/lib/tournaments/placeholder-helpers";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────
// 시안 상수 — 6 종별 / 36 팀 / 59 매치
// ─────────────────────────────────────────────────────────────────────────

const TOURNAMENT_NAME = "2026 강남구협회장배 유소년부 농구대회";
const TOURNAMENT_START_KST = "2026-05-16T09:00:00+09:00";
const TOURNAMENT_END_KST = "2026-05-17T20:30:00+09:00";

const VENUE_GANGNAM = "강남구민체육관";
const VENUE_SUDOGONGGO = "수도공고";

/** 종별 6건 박제 spec — planner § 3 표 기반. */
type DivisionSpec = {
  code: string;
  label: string;
  format: string; // DivisionFormat enum (division-formats.ts)
  settings: Record<string, unknown>;
  feeKrw: number;
  sortOrder: number;
};

const DIVISIONS: readonly DivisionSpec[] = [
  // 1. i2 U11 — 5팀 풀리그 (조 1개)
  {
    code: "i2-U11",
    label: "i2 U11",
    format: "round_robin",
    settings: { group_size: 5, group_count: 1 },
    feeKrw: 0,
    sortOrder: 1,
  },
  // 2. i2 U12 — 5팀 풀리그 (조 1개)
  {
    code: "i2-U12",
    label: "i2 U12",
    format: "round_robin",
    settings: { group_size: 5, group_count: 1 },
    feeKrw: 0,
    sortOrder: 2,
  },
  // 3. i3 U9 — 4팀 2개조 사각링크제 (1·2·3·4위 모두 매칭)
  {
    code: "i3-U9",
    label: "i3 U9",
    format: "league_advancement",
    settings: {
      group_size: 4,
      group_count: 2,
      // linkage_pairs = 각조 1·2·3·4위 모두 동순위 매칭 박제
      // (advanceTournamentPlaceholders 가 ADVANCEMENT_REGEX 로 파싱 — 본 settings 는 generator UI 표시용)
      linkage_pairs: [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ],
    },
    feeKrw: 0,
    sortOrder: 3,
  },
  // 4. i3 U11 — 3팀 2개조 풀리그 + 동순위 순위결정전
  {
    code: "i3-U11",
    label: "i3 U11",
    format: "group_stage_with_ranking",
    settings: { group_size: 3, group_count: 2, ranking_format: "single_elimination" },
    feeKrw: 0,
    sortOrder: 4,
  },
  // 5. i3W U12 — 3팀 2개조 풀리그 + 동순위 순위결정전
  {
    code: "i3W-U12",
    label: "i3W U12",
    format: "group_stage_with_ranking",
    settings: { group_size: 3, group_count: 2, ranking_format: "single_elimination" },
    feeKrw: 0,
    sortOrder: 5,
  },
  // 6. i3 U14 — 3팀 2개조 풀리그 + 동순위 순위결정전
  {
    code: "i3-U14",
    label: "i3 U14",
    format: "group_stage_with_ranking",
    settings: { group_size: 3, group_count: 2, ranking_format: "single_elimination" },
    feeKrw: 0,
    sortOrder: 6,
  },
] as const;

/**
 * 36 팀 박제 spec — 종별 + 조 매핑.
 *
 * 운영 DB Team.name 매칭 (name unique 아님 → SELECT 결과 2건+ 발견 시 throw 가드).
 * Team 부재 시 throw + 사용자 결재 (captainId FK NOT NULL → 자동 생성 위험 — 운영 결재).
 */
type TeamSpec = {
  divisionCode: string;
  groupName: string; // i2 (조 1개) = "A" / i3 = "A" / "B"
  teamName: string;
};

const TEAMS: readonly TeamSpec[] = [
  // 1. i2-U11 (5팀 / A조)
  { divisionCode: "i2-U11", groupName: "A", teamName: "YNC" },
  { divisionCode: "i2-U11", groupName: "A", teamName: "동탄SK" },
  { divisionCode: "i2-U11", groupName: "A", teamName: "스티즈강남" },
  { divisionCode: "i2-U11", groupName: "A", teamName: "성북삼성" },
  { divisionCode: "i2-U11", groupName: "A", teamName: "원주와이키키" },

  // 2. i2-U12 (5팀 / A조)
  { divisionCode: "i2-U12", groupName: "A", teamName: "강남삼성" },
  { divisionCode: "i2-U12", groupName: "A", teamName: "강동SK" },
  { divisionCode: "i2-U12", groupName: "A", teamName: "구리남양주삼성" },
  { divisionCode: "i2-U12", groupName: "A", teamName: "조성훈농구교실" },
  { divisionCode: "i2-U12", groupName: "A", teamName: "김포SK" },

  // 3. i3-U9 (4팀 2개조)
  { divisionCode: "i3-U9", groupName: "A", teamName: "분당SFA" },
  { divisionCode: "i3-U9", groupName: "A", teamName: "위례삼성" },
  { divisionCode: "i3-U9", groupName: "A", teamName: "은평삼성" },
  { divisionCode: "i3-U9", groupName: "A", teamName: "분당정관장" },
  { divisionCode: "i3-U9", groupName: "B", teamName: "강동SK" },
  { divisionCode: "i3-U9", groupName: "B", teamName: "그로우" },
  { divisionCode: "i3-U9", groupName: "B", teamName: "스티즈강남" },
  { divisionCode: "i3-U9", groupName: "B", teamName: "넥스트레벨" },

  // 4. i3-U11 (3팀 2개조)
  { divisionCode: "i3-U11", groupName: "A", teamName: "분당정관장" },
  { divisionCode: "i3-U11", groupName: "A", teamName: "스티즈남양주" },
  { divisionCode: "i3-U11", groupName: "A", teamName: "스티즈 강남" }, // ⚠️ 시안 표기 그대로 (공백 포함)
  { divisionCode: "i3-U11", groupName: "B", teamName: "미스터코치" },
  { divisionCode: "i3-U11", groupName: "B", teamName: "디오스포츠" },
  { divisionCode: "i3-U11", groupName: "B", teamName: "최고봉농구교실" },

  // 5. i3W-U12 (3팀 2개조)
  { divisionCode: "i3W-U12", groupName: "A", teamName: "김포홉스타" },
  { divisionCode: "i3W-U12", groupName: "A", teamName: "YNC B" },
  { divisionCode: "i3W-U12", groupName: "A", teamName: "스티즈강남" },
  { divisionCode: "i3W-U12", groupName: "B", teamName: "다산SK" },
  { divisionCode: "i3W-U12", groupName: "B", teamName: "김포SK" },
  { divisionCode: "i3W-U12", groupName: "B", teamName: "YNC A" },

  // 6. i3-U14 (3팀 2개조)
  { divisionCode: "i3-U14", groupName: "A", teamName: "스티즈강남" },
  { divisionCode: "i3-U14", groupName: "A", teamName: "업핑" },
  { divisionCode: "i3-U14", groupName: "A", teamName: "부평소노" },
  { divisionCode: "i3-U14", groupName: "B", teamName: "인천현대모비스" },
  { divisionCode: "i3-U14", groupName: "B", teamName: "강동SK" },
  { divisionCode: "i3-U14", groupName: "B", teamName: "스티즈" },
] as const;

// ─────────────────────────────────────────────────────────────────────────
// 매치 spec — 59 건 (예선 46 + 순위전 13)
// ─────────────────────────────────────────────────────────────────────────

/** 예선 매치 spec — 실팀 매핑 (homeTeamId / awayTeamId NOT NULL). */
type PreliminaryMatchSpec = {
  divisionCode: string;
  scheduledKst: string; // KST ISO ("2026-05-16T09:30:00+09:00")
  venueName: string;
  groupName: string;
  matchNumber: number; // 종별 내 1~N 연속
  homeTeamName: string;
  awayTeamName: string;
};

/**
 * 순위전 매치 spec — placeholder (homeTeamId / awayTeamId NULL + notes + slotLabel 3중 박제).
 *
 * homeRank / awayRank = group_rank 슬롯 (예: home={ group: "A", rank: 1 } → "A조 1위")
 * roundName = "결승" / "3·4위전" / "5·6위전" / "7·8위전" 운영 표준 (planner § 9 §7)
 */
type PlaceholderMatchSpec = {
  divisionCode: string;
  scheduledKst: string;
  venueName: string;
  matchNumber: number;
  roundName: string;
  homeGroup: string;
  homeRank: number;
  awayGroup: string;
  awayRank: number;
};

const PRELIMINARY_MATCHES: readonly PreliminaryMatchSpec[] = [
  // ─── 1. i2-U11 (10 매치 / 강남구민체육관 / 5/16 09:30~14:45) ───
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T09:30:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 1, homeTeamName: "YNC", awayTeamName: "동탄SK" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T10:05:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 2, homeTeamName: "스티즈강남", awayTeamName: "성북삼성" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T10:40:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 3, homeTeamName: "원주와이키키", awayTeamName: "YNC" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T11:15:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 4, homeTeamName: "동탄SK", awayTeamName: "스티즈강남" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T11:50:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 5, homeTeamName: "성북삼성", awayTeamName: "원주와이키키" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T12:25:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 6, homeTeamName: "YNC", awayTeamName: "스티즈강남" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T13:00:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 7, homeTeamName: "원주와이키키", awayTeamName: "동탄SK" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T13:35:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 8, homeTeamName: "성북삼성", awayTeamName: "YNC" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T14:10:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 9, homeTeamName: "스티즈강남", awayTeamName: "원주와이키키" },
  { divisionCode: "i2-U11", scheduledKst: "2026-05-16T14:45:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 10, homeTeamName: "동탄SK", awayTeamName: "성북삼성" },

  // ─── 2. i2-U12 (10 매치 / 강남구민체육관 / 5/17 14:30~19:45) ───
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T14:30:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 1, homeTeamName: "강남삼성", awayTeamName: "강동SK" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T15:05:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 2, homeTeamName: "구리남양주삼성", awayTeamName: "조성훈농구교실" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T15:40:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 3, homeTeamName: "김포SK", awayTeamName: "강남삼성" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T16:15:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 4, homeTeamName: "강동SK", awayTeamName: "구리남양주삼성" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T16:50:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 5, homeTeamName: "조성훈농구교실", awayTeamName: "김포SK" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T17:25:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 6, homeTeamName: "강남삼성", awayTeamName: "구리남양주삼성" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T18:00:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 7, homeTeamName: "김포SK", awayTeamName: "강동SK" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T18:35:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 8, homeTeamName: "조성훈농구교실", awayTeamName: "강남삼성" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T19:10:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 9, homeTeamName: "구리남양주삼성", awayTeamName: "김포SK" },
  { divisionCode: "i2-U12", scheduledKst: "2026-05-17T19:45:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 10, homeTeamName: "강동SK", awayTeamName: "조성훈농구교실" },

  // ─── 3. i3-U9 예선 (8 매치 / 수도공고 / 5/16 09:00~12:30) ───
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T09:00:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "A", matchNumber: 1, homeTeamName: "분당SFA", awayTeamName: "위례삼성" },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T09:30:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "B", matchNumber: 2, homeTeamName: "강동SK", awayTeamName: "그로우" },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T10:00:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "A", matchNumber: 3, homeTeamName: "분당정관장", awayTeamName: "은평삼성" },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T10:30:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "B", matchNumber: 4, homeTeamName: "넥스트레벨", awayTeamName: "스티즈강남" },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T11:00:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "A", matchNumber: 5, homeTeamName: "위례삼성", awayTeamName: "분당정관장" },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T11:30:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "B", matchNumber: 6, homeTeamName: "그로우", awayTeamName: "넥스트레벨" },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T12:00:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "A", matchNumber: 7, homeTeamName: "은평삼성", awayTeamName: "분당SFA" },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T12:30:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "B", matchNumber: 8, homeTeamName: "스티즈강남", awayTeamName: "강동SK" },

  // ─── 4. i3-U11 예선 (6 매치 / 강남구민체육관 / 5/16 16:00~18:30) ───
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T16:00:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 1, homeTeamName: "분당정관장", awayTeamName: "스티즈남양주" },
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T16:30:00+09:00", venueName: VENUE_GANGNAM, groupName: "B", matchNumber: 2, homeTeamName: "미스터코치", awayTeamName: "최고봉농구교실" },
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T17:00:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 3, homeTeamName: "스티즈남양주", awayTeamName: "스티즈 강남" },
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T17:30:00+09:00", venueName: VENUE_GANGNAM, groupName: "B", matchNumber: 4, homeTeamName: "최고봉농구교실", awayTeamName: "디오스포츠" },
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T18:00:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 5, homeTeamName: "스티즈 강남", awayTeamName: "분당정관장" },
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T18:30:00+09:00", venueName: VENUE_GANGNAM, groupName: "B", matchNumber: 6, homeTeamName: "디오스포츠", awayTeamName: "미스터코치" },

  // ─── 5. i3W-U12 예선 (6 매치 / 강남구민체육관 / 5/17 09:30~12:00) ───
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T09:30:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 1, homeTeamName: "김포홉스타", awayTeamName: "스티즈강남" },
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T10:00:00+09:00", venueName: VENUE_GANGNAM, groupName: "B", matchNumber: 2, homeTeamName: "다산SK", awayTeamName: "YNC A" },
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T10:30:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 3, homeTeamName: "스티즈강남", awayTeamName: "YNC B" },
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T11:00:00+09:00", venueName: VENUE_GANGNAM, groupName: "B", matchNumber: 4, homeTeamName: "YNC A", awayTeamName: "김포SK" },
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T11:30:00+09:00", venueName: VENUE_GANGNAM, groupName: "A", matchNumber: 5, homeTeamName: "YNC B", awayTeamName: "김포홉스타" },
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T12:00:00+09:00", venueName: VENUE_GANGNAM, groupName: "B", matchNumber: 6, homeTeamName: "김포SK", awayTeamName: "다산SK" },

  // ─── 6. i3-U14 예선 (6 매치 / 수도공고 / 5/16 15:30~18:00) ───
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T15:30:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "A", matchNumber: 1, homeTeamName: "스티즈강남", awayTeamName: "부평소노" },
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T16:00:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "B", matchNumber: 2, homeTeamName: "인천현대모비스", awayTeamName: "스티즈" },
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T16:30:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "A", matchNumber: 3, homeTeamName: "부평소노", awayTeamName: "업핑" },
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T17:00:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "B", matchNumber: 4, homeTeamName: "스티즈", awayTeamName: "강동SK" },
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T17:30:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "A", matchNumber: 5, homeTeamName: "업핑", awayTeamName: "스티즈강남" },
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T18:00:00+09:00", venueName: VENUE_SUDOGONGGO, groupName: "B", matchNumber: 6, homeTeamName: "강동SK", awayTeamName: "인천현대모비스" },
];

const PLACEHOLDER_MATCHES: readonly PlaceholderMatchSpec[] = [
  // ─── 3. i3-U9 순위전 (4 매치 / 수도공고 / 5/16 13:00~14:30) ───
  // 사각링크제 (1·2·3·4위 모두 매칭). roundName 표준 = planner §9 §7 (4위전 = 7·8위전 / 1위전 = 결승)
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T13:00:00+09:00", venueName: VENUE_SUDOGONGGO, matchNumber: 9, roundName: "7·8위전", homeGroup: "A", homeRank: 4, awayGroup: "B", awayRank: 4 },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T13:30:00+09:00", venueName: VENUE_SUDOGONGGO, matchNumber: 10, roundName: "5·6위전", homeGroup: "A", homeRank: 3, awayGroup: "B", awayRank: 3 },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T14:00:00+09:00", venueName: VENUE_SUDOGONGGO, matchNumber: 11, roundName: "3·4위전", homeGroup: "A", homeRank: 2, awayGroup: "B", awayRank: 2 },
  { divisionCode: "i3-U9", scheduledKst: "2026-05-16T14:30:00+09:00", venueName: VENUE_SUDOGONGGO, matchNumber: 12, roundName: "결승", homeGroup: "A", homeRank: 1, awayGroup: "B", awayRank: 1 },

  // ─── 4. i3-U11 순위전 (3 매치 / 강남구민체육관 / 5/16 19:00~20:00) ───
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T19:00:00+09:00", venueName: VENUE_GANGNAM, matchNumber: 7, roundName: "5·6위전", homeGroup: "A", homeRank: 3, awayGroup: "B", awayRank: 3 },
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T19:30:00+09:00", venueName: VENUE_GANGNAM, matchNumber: 8, roundName: "3·4위전", homeGroup: "A", homeRank: 2, awayGroup: "B", awayRank: 2 },
  { divisionCode: "i3-U11", scheduledKst: "2026-05-16T20:00:00+09:00", venueName: VENUE_GANGNAM, matchNumber: 9, roundName: "결승", homeGroup: "A", homeRank: 1, awayGroup: "B", awayRank: 1 },

  // ─── 5. i3W-U12 순위전 (3 매치 / 강남구민체육관 / 5/17 12:30~13:30) ───
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T12:30:00+09:00", venueName: VENUE_GANGNAM, matchNumber: 7, roundName: "5·6위전", homeGroup: "A", homeRank: 3, awayGroup: "B", awayRank: 3 },
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T13:00:00+09:00", venueName: VENUE_GANGNAM, matchNumber: 8, roundName: "3·4위전", homeGroup: "A", homeRank: 2, awayGroup: "B", awayRank: 2 },
  { divisionCode: "i3W-U12", scheduledKst: "2026-05-17T13:30:00+09:00", venueName: VENUE_GANGNAM, matchNumber: 9, roundName: "결승", homeGroup: "A", homeRank: 1, awayGroup: "B", awayRank: 1 },

  // ─── 6. i3-U14 순위전 (3 매치 / 수도공고 / 5/16 18:30~19:30) ───
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T18:30:00+09:00", venueName: VENUE_SUDOGONGGO, matchNumber: 7, roundName: "5·6위전", homeGroup: "A", homeRank: 3, awayGroup: "B", awayRank: 3 },
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T19:00:00+09:00", venueName: VENUE_SUDOGONGGO, matchNumber: 8, roundName: "3·4위전", homeGroup: "A", homeRank: 2, awayGroup: "B", awayRank: 2 },
  { divisionCode: "i3-U14", scheduledKst: "2026-05-16T19:30:00+09:00", venueName: VENUE_SUDOGONGGO, matchNumber: 9, roundName: "결승", homeGroup: "A", homeRank: 1, awayGroup: "B", awayRank: 1 },
];

// ─────────────────────────────────────────────────────────────────────────
// 메인 로직 — 8중 idempotent 가드
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== 강남구협회장배 유소년부 2026 INSERT 스크립트 ===\n");

  // ─── 가드 1: ORGANIZER_USER_ID env 필수 ───
  // 사유: Tournament.organizerId FK NOT NULL — 하드코딩 금지 (errors.md #49 룰)
  const organizerEnv = process.env.ORGANIZER_USER_ID;
  if (!organizerEnv) {
    throw new Error(
      "[가드 1 위반] ORGANIZER_USER_ID env 누락 — 실행 명령: ORGANIZER_USER_ID=<BigInt user_id> npx tsx scripts/_temp/seed-gnba-youth-2026.ts",
    );
  }
  let organizerId: bigint;
  try {
    organizerId = BigInt(organizerEnv);
  } catch {
    throw new Error(`[가드 1 위반] ORGANIZER_USER_ID 형식 오류 (BigInt 변환 실패) — 입력값: "${organizerEnv}"`);
  }

  // ─── 가드 2: 운영자 user 존재 검증 ───
  console.log(`[1/8] 운영자 user_id=${organizerId.toString()} 존재 검증...`);
  const organizer = await prisma.user.findUnique({
    where: { id: organizerId },
    select: { id: true, nickname: true, email: true },
  });
  if (!organizer) {
    throw new Error(`[가드 2 위반] organizer user_id=${organizerId.toString()} 부재 (User 테이블 미등록)`);
  }
  console.log(`  ✓ 운영자 확인: ${organizer.nickname ?? "(닉네임 없음)"} / ${organizer.email ?? "(이메일 없음)"}`);

  // ─── 가드 3: 기존 Tournament 검색 (idempotent — 0건/1건/2건+ 분기) ───
  console.log(`\n[2/8] 기존 Tournament 검색 — name LIKE "강남구협회장배" + startDate 2026-05-15~17...`);
  const existingTournaments = await prisma.tournament.findMany({
    where: {
      name: { contains: "강남구협회장배" },
      startDate: {
        gte: new Date("2026-05-15T00:00:00+09:00"),
        lt: new Date("2026-05-18T00:00:00+09:00"),
      },
    },
    select: { id: true, name: true, startDate: true },
  });
  if (existingTournaments.length > 1) {
    throw new Error(
      `[가드 3 위반] Tournament 중복 ${existingTournaments.length}건 검출 — 운영자 확인 필요:\n` +
        existingTournaments.map((t) => `  - id=${t.id} / name="${t.name}" / startDate=${t.startDate?.toISOString()}`).join("\n"),
    );
  }
  const existingTournament = existingTournaments[0] ?? null;
  console.log(`  ✓ Tournament: ${existingTournament ? `재사용 (id=${existingTournament.id})` : "신규 생성 예정"}`);

  // ─── 트랜잭션 시작 (timeout 30000ms) ───
  // 사유: 부분 실패 시 전체 롤백 (운영 DB orphan 데이터 방지)
  console.log(`\n[3/8] 트랜잭션 시작 (timeout 30000ms)...`);
  const result = await prisma.$transaction(
    async (tx) => {
      // ─── Tournament 박제 (신규 또는 재사용) ───
      let tournamentId: string;
      if (existingTournament) {
        tournamentId = existingTournament.id;
        console.log(`  ✓ Tournament 재사용: id=${tournamentId}`);
      } else {
        // generateApiToken() 헬퍼 경유 (errors.md #49 룰)
        const apiToken = generateApiToken();
        const created = await tx.tournament.create({
          data: {
            name: TOURNAMENT_NAME,
            organizerId,
            startDate: new Date(TOURNAMENT_START_KST),
            endDate: new Date(TOURNAMENT_END_KST),
            format: "single_elimination", // 디폴트 (종별별 format 우선 박제 — TournamentDivisionRule.format 단일 source)
            status: "published",
            is_public: true,
            city: "서울",
            district: "강남구",
            venue_name: `${VENUE_GANGNAM} / ${VENUE_SUDOGONGGO}`,
            apiToken,
            divisions: [], // JSON 디폴트
          },
          select: { id: true },
        });
        tournamentId = created.id;
        console.log(`  ✓ Tournament 신규 생성: id=${tournamentId} / apiToken 박제 완료`);
      }

      // ─── 가드 4: TournamentDivisionRule 6건 idempotent ───
      console.log(`\n[4/8] TournamentDivisionRule 6건 박제 (code 매칭 idempotent)...`);
      const existingRules = await tx.tournamentDivisionRule.findMany({
        where: { tournamentId },
        select: { code: true },
      });
      const existingRuleCodes = new Set(existingRules.map((r) => r.code));
      let rulesInserted = 0;
      for (const div of DIVISIONS) {
        if (existingRuleCodes.has(div.code)) {
          console.log(`  - ${div.code}: 기존 row → skip`);
          continue;
        }
        await tx.tournamentDivisionRule.create({
          data: {
            tournamentId,
            code: div.code,
            label: div.label,
            format: div.format,
            settings: div.settings as Prisma.InputJsonValue,
            feeKrw: div.feeKrw,
            sortOrder: div.sortOrder,
          },
        });
        rulesInserted++;
        console.log(`  + ${div.code} (${div.label}, ${div.format}): INSERT`);
      }
      console.log(`  ✓ DivisionRule INSERT: ${rulesInserted}건 / skip: ${6 - rulesInserted}건`);

      // ─── 가드 5: Team SELECT 36건 (name 매칭) ───
      // 사유: Team.captainId FK NOT NULL → 자동 생성 위험. 부재 시 throw + 사용자 결재.
      //   동명 팀 2건+ 검출 시도 throw (운영자 확인 필요).
      console.log(`\n[5/8] Team SELECT 36건 (name 매칭 + 동명 가드)...`);
      const uniqueTeamNames = Array.from(new Set(TEAMS.map((t) => t.teamName)));
      console.log(`  - 고유 팀명 ${uniqueTeamNames.length}건 (중복 제거 후)`);
      const teams = await tx.team.findMany({
        where: { name: { in: uniqueTeamNames } },
        select: { id: true, name: true },
      });

      // 동명 팀 2건+ 검출 가드
      const teamCountByName: Record<string, number> = {};
      for (const t of teams) {
        teamCountByName[t.name] = (teamCountByName[t.name] ?? 0) + 1;
      }
      const duplicateNames = Object.entries(teamCountByName)
        .filter(([, n]) => n > 1)
        .map(([name, n]) => `${name} (${n}건)`);
      if (duplicateNames.length > 0) {
        throw new Error(
          `[가드 5 위반] 동명 팀 검출 — 운영자 확인 필요 (Team ID 결재 후 본 스크립트 수동 매핑 박제):\n  - ${duplicateNames.join(
            "\n  - ",
          )}`,
        );
      }

      // 부재 팀 가드
      const teamIdByName: Record<string, bigint> = {};
      for (const t of teams) {
        teamIdByName[t.name] = t.id;
      }
      const missingTeams = uniqueTeamNames.filter((n) => !teamIdByName[n]);
      if (missingTeams.length > 0) {
        throw new Error(
          `[가드 5 위반] Team 부재 ${missingTeams.length}건 — 운영자가 사전 등록 필요 (captainId FK NOT NULL → 자동 생성 ❌):\n  - ${missingTeams.join("\n  - ")}`,
        );
      }
      console.log(`  ✓ Team 매핑 ${uniqueTeamNames.length}건 모두 확인`);

      // ─── 가드 6: TournamentTeam upsert (@@unique([tournamentId, teamId])) ───
      console.log(`\n[6/8] TournamentTeam upsert 36건 (division+group 박제)...`);
      const ttIdByDivAndName: Record<string, bigint> = {};
      let ttInserted = 0;
      let ttUpdated = 0;
      for (const teamSpec of TEAMS) {
        const teamId = teamIdByName[teamSpec.teamName];
        const tt = await tx.tournamentTeam.upsert({
          where: {
            // @@unique([tournamentId, teamId], map: "index_tournament_teams_on_tournament_id_and_team_id")
            tournamentId_teamId: { tournamentId, teamId },
          },
          create: {
            tournamentId,
            teamId,
            groupName: teamSpec.groupName,
            category: teamSpec.divisionCode, // category = division code (standings/advancement 매핑 키)
            division: teamSpec.divisionCode,
            status: "approved",
            payment_status: "unpaid",
          },
          update: {
            // 재실행 시 group/category 갱신 (운영 변경 흡수)
            groupName: teamSpec.groupName,
            category: teamSpec.divisionCode,
            division: teamSpec.divisionCode,
          },
          select: { id: true, createdAt: true, updatedAt: true },
        });
        // 같은 Team 이 여러 종별에 박혀있는 케이스 — div+name 단위로 매핑 키 필요.
        // 그러나 실제로는 같은 팀(예: 강동SK)이 여러 종별에 등장하지만 TournamentTeam 은 (tournamentId, teamId) 1건만 가능.
        // → 본 스크립트의 한계: 동명팀이 다종별 등장 시 TournamentTeam 1 row 의 division 만 마지막 종별로 갱신됨.
        //   매치 박제 시에는 teamId 만 사용하므로 영향 0. division/groupName 표시는 마지막 종별로 됨 — 운영자 사전 인지 필요.
        ttIdByDivAndName[`${teamSpec.divisionCode}|${teamSpec.teamName}`] = tt.id;
        if (tt.createdAt.getTime() === tt.updatedAt.getTime()) {
          ttInserted++;
        } else {
          ttUpdated++;
        }
      }
      console.log(`  ✓ TournamentTeam INSERT: ${ttInserted}건 / UPDATE: ${ttUpdated}건`);

      // ─── 가드 7: TournamentMatch INSERT (예선 46 + 순위전 13 = 59건 / 복합 키 idempotent) ───
      console.log(`\n[7/8] TournamentMatch INSERT 59건 (idempotent — scheduledAt+division+number 복합 키)...`);

      // 기존 매치 fetch (idempotent skip 가드용)
      const existingMatches = await tx.tournamentMatch.findMany({
        where: { tournamentId },
        select: {
          id: true,
          scheduledAt: true,
          match_number: true,
          settings: true,
        },
      });
      // 매핑 키 = "ISO|division|number" (3중 복합 키)
      const existingMatchKeys = new Set<string>();
      for (const m of existingMatches) {
        const settings = m.settings as Record<string, unknown> | null;
        const divCode = settings?.division_code as string | undefined;
        if (m.scheduledAt && m.match_number != null && divCode) {
          existingMatchKeys.add(`${m.scheduledAt.toISOString()}|${divCode}|${m.match_number}`);
        }
      }

      // 예선 매치 46건
      let prelimInserted = 0;
      let prelimSkipped = 0;
      for (const pm of PRELIMINARY_MATCHES) {
        const scheduledAt = new Date(pm.scheduledKst); // KST → UTC 자동 변환
        const key = `${scheduledAt.toISOString()}|${pm.divisionCode}|${pm.matchNumber}`;
        if (existingMatchKeys.has(key)) {
          prelimSkipped++;
          continue;
        }
        const homeTtId = ttIdByDivAndName[`${pm.divisionCode}|${pm.homeTeamName}`];
        const awayTtId = ttIdByDivAndName[`${pm.divisionCode}|${pm.awayTeamName}`];
        if (!homeTtId || !awayTtId) {
          throw new Error(
            `[가드 7 위반] 예선 매치 ${pm.divisionCode} #${pm.matchNumber} TournamentTeam 매핑 실패 (home=${pm.homeTeamName} / away=${pm.awayTeamName})`,
          );
        }
        await tx.tournamentMatch.create({
          data: {
            tournamentId,
            scheduledAt,
            venue_name: pm.venueName,
            homeTeamId: homeTtId,
            awayTeamId: awayTtId,
            roundName: "예선",
            group_name: pm.groupName,
            match_number: pm.matchNumber,
            status: "scheduled",
            settings: {
              division_code: pm.divisionCode,
              recording_mode: "flutter",
            } as Prisma.InputJsonValue,
          },
        });
        prelimInserted++;
      }
      console.log(`  ✓ 예선 매치 INSERT: ${prelimInserted}건 / skip: ${prelimSkipped}건`);

      // ─── 순위전 매치 13건 (placeholder NULL + notes + slotLabel 3중 박제) ───
      let placeholderInserted = 0;
      let placeholderSkipped = 0;
      for (const pm of PLACEHOLDER_MATCHES) {
        const scheduledAt = new Date(pm.scheduledKst);
        const key = `${scheduledAt.toISOString()}|${pm.divisionCode}|${pm.matchNumber}`;
        if (existingMatchKeys.has(key)) {
          placeholderSkipped++;
          continue;
        }
        // ⚠️ placeholder-helpers 통과 의무 (인라인 문자열 ❌ — errors.md #102 영구 차단 룰)
        const homeSlot = buildSlotLabel({ kind: "group_rank", group: pm.homeGroup, rank: pm.homeRank });
        const awaySlot = buildSlotLabel({ kind: "group_rank", group: pm.awayGroup, rank: pm.awayRank });
        const notes = buildPlaceholderNotes(homeSlot, awaySlot); // "A조 1위 vs B조 1위" — ADVANCEMENT_REGEX 호환
        await tx.tournamentMatch.create({
          data: {
            tournamentId,
            scheduledAt,
            venue_name: pm.venueName,
            homeTeamId: null, // ← NULL 박제 (advanceTournamentPlaceholders 가 추후 자동 채움)
            awayTeamId: null,
            roundName: pm.roundName,
            match_number: pm.matchNumber,
            status: "scheduled",
            notes,
            settings: {
              division_code: pm.divisionCode,
              homeSlotLabel: homeSlot,
              awaySlotLabel: awaySlot,
              recording_mode: "flutter",
            } as Prisma.InputJsonValue,
          },
        });
        placeholderInserted++;
      }
      console.log(`  ✓ 순위전 placeholder 매치 INSERT: ${placeholderInserted}건 / skip: ${placeholderSkipped}건`);

      return {
        tournamentId,
        rulesInserted,
        ttInserted,
        ttUpdated,
        prelimInserted,
        prelimSkipped,
        placeholderInserted,
        placeholderSkipped,
      };
    },
    { timeout: 30000 },
  );

  // ─── 가드 8: 사후 검증 (5 query — count + ADVANCEMENT_REGEX 매칭률 100%) ───
  console.log(`\n[8/8] 사후 검증 (5 query)...`);
  const tournamentId = result.tournamentId;

  const [ruleCount, ttCount, matchCount, placeholderCount, placeholderSamples] = await Promise.all([
    prisma.tournamentDivisionRule.count({ where: { tournamentId } }),
    prisma.tournamentTeam.count({ where: { tournamentId } }),
    prisma.tournamentMatch.count({ where: { tournamentId } }),
    prisma.tournamentMatch.count({
      where: { tournamentId, homeTeamId: null, notes: { contains: "위 vs" } },
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId, homeTeamId: null },
      select: { id: true, notes: true, settings: true },
    }),
  ]);

  console.log(`  - DivisionRule: ${ruleCount} (기대 6)`);
  console.log(`  - TournamentTeam: ${ttCount} (기대 ≥36 — 동명팀 다종별 시 작음)`);
  console.log(`  - TournamentMatch: ${matchCount} (기대 ≥59)`);
  console.log(`  - placeholder 매치 (NULL+notes "위 vs"): ${placeholderCount} (기대 13)`);

  // ADVANCEMENT_REGEX 매칭률 100% 검증
  const advancementRegex = /([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/;
  const regexFailMatches: string[] = [];
  for (const m of placeholderSamples) {
    if (!advancementRegex.test(m.notes ?? "")) {
      regexFailMatches.push(`match id=${m.id.toString()} notes="${m.notes}"`);
    }
  }
  if (regexFailMatches.length > 0) {
    throw new Error(
      `[가드 8 위반] ADVANCEMENT_REGEX 매칭 실패 ${regexFailMatches.length}건 (강남구 사고 패턴):\n  - ${regexFailMatches.join("\n  - ")}`,
    );
  }
  console.log(`  ✓ ADVANCEMENT_REGEX 매칭률 100% (${placeholderSamples.length}/${placeholderSamples.length})`);

  // 사후 검증 throw 가드 — 기대치 미달 시 사용자 즉시 알림
  if (ruleCount < 6) {
    throw new Error(`[가드 8 위반] DivisionRule 부족 — actual=${ruleCount} / expected ≥6`);
  }
  if (placeholderCount !== 13) {
    throw new Error(`[가드 8 위반] placeholder 매치 수 불일치 — actual=${placeholderCount} / expected=13`);
  }

  console.log(`\n=== 완료 ===`);
  console.log(`Tournament id: ${tournamentId}`);
  console.log(`사후 정리: 작업 검증 후 본 파일 + check-gnba-youth-2026.ts 삭제 의무 (CLAUDE.md §🗄️ DB 정책 §3)`);
}

main()
  .catch((err) => {
    console.error("\n[ERROR]", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
