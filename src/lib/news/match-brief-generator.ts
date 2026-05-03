// 2026-05-02: Phase 1 — 매치 요약 단신 기사 generator (Gemini 2.5 Flash)
// 이유: tab-summary.tsx 의 Phase 0 템플릿 Lead 부분을 LLM 응답으로 교체.
// 진행 중 매치(live)는 호출 X — 종료(completed) 매치만 호출 + 캐시.
// 캐시 = 메모리 Map (Vercel serverless instance 별 — cold start 시 재생성).
// 운영 영향 0 가드 = (1) completed 만 (2) 캐시 (3) 검증 실패 시 fallback.

import { generateText } from "./gemini-client";
import { ALKIJA_SYSTEM_PROMPT } from "./prompts/alkija-system";
import { ALKIJA_PHASE2_MATCH_PROMPT } from "./prompts/alkija-system-phase2-match";
import { validateBrief } from "./validate-brief";

// 2026-05-03: Phase 2 — 게시판 'news' 발행용 독립 기사 mode 추가
// "phase1-section" = 매치 페이지 1 섹션 (150~250자, Header/Headline 중복 X)
// "phase2-match"   = 게시판 독립 기사 (400~700자, 점프볼 D리그 단신 패턴, 제목 + 본문)
export type BriefMode = "phase1-section" | "phase2-match";

// 2026-05-03: 데이터 풀 확장 — 양 팀 통계 + 모든 선수 stat + 핵심 스트레치
// LLM 이 다양한 관점 (야투/리바/어시/스틸/+/-/더블더블/스트레치 등) 으로 작성하도록 풍부화

export type PlayerStat = {
  team: "home" | "away";
  name: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fgMade: number;
  fgAtt: number;
  threesMade: number;
  threesAtt: number;
  ftMade: number;
  ftAtt: number;
  plusMinus: number;
  minutes: number;
};

export type TeamStat = {
  pts: number;
  fgMade: number;
  fgAtt: number;
  fgPct: number; // 0~100
  threesMade: number;
  threesAtt: number;
  threesPct: number;
  ftMade: number;
  ftAtt: number;
  ftPct: number;
  offReb: number;
  defReb: number;
  totalReb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  pf: number;
};

// LLM 입력 데이터 — tab-summary 의 Phase 0 분석 결과를 그대로 넘김
export type MatchBriefInput = {
  matchId: number;
  tournamentName: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  roundName: string | null;
  groupName: string | null;
  scheduledAt: string | null;
  venueName: string | null;
  mvp: { name: string; pts: number; reb: number; ast: number } | null;
  homeTopScorer: { name: string; pts: number } | null;
  awayTopScorer: { name: string; pts: number } | null;
  flow:
    | "overtime"
    | "lastminute"
    | "comeback"
    | "seesaw"
    | "blowout"
    | "dominant"
    | "narrow"
    | "default";
  maxLead: number;
  leadChanges: number;
  quarterScores: { home: number[]; away: number[] };
  // 2026-05-03 신규: 풍부한 데이터 풀
  homeTeamStat: TeamStat | null;
  awayTeamStat: TeamStat | null;
  // 양 팀 모든 선수 stat (점수>0 또는 출전시간>0 선수만)
  allPlayers: PlayerStat[];
  // 자동 검출된 특별 기록 (LLM 활용 hint)
  doubleDoubles: PlayerStat[]; // 10+ 두 카테고리
  tripleDoubles: PlayerStat[]; // 10+ 세 카테고리
  topRebounder: PlayerStat | null; // 리바 1위 (5+)
  topAssister: PlayerStat | null; // 어시 1위 (3+)
  topStealer: PlayerStat | null; // 스틸 1위 (2+)
  topBlocker: PlayerStat | null; // 블락 1위 (1+)
  topPlusMinus: PlayerStat | null; // +/- 1위 (5+)
  bestThreeShooter: PlayerStat | null; // 3점 다수 (3+ 성공)
};

// LLM 결과 캐시 — matchId → brief 텍스트
// Vercel serverless instance 별 메모리. 운영 평소 360 매치 / 1500 RPD 무료 tier 충분.
// Phase 2 에서 DB articles 테이블로 영구 저장 예정.
// 2026-05-03: cacheKey = `${mode}:${matchId}` 형태로 변경 (Phase 1/Phase 2 응답 분리)
const briefCache = new Map<string, string>();

// flow 한국어 라벨 — LLM 에 흐름 hint 로 전달
const FLOW_LABEL: Record<MatchBriefInput["flow"], string> = {
  overtime: "연장 혈투",
  lastminute: "막판 역전",
  comeback: "역전승",
  seesaw: "시소 게임 (리드 자주 뒤바뀜)",
  blowout: "압승 (20점차+)",
  dominant: "완승 (10점차+)",
  narrow: "신승 (5점차 이내)",
  default: "박빙 승부",
};

// 쿼터별 점수 포맷 — "Q1 12-8 / Q2 10-15 / ..."
function formatQuarters(qs: { home: number[]; away: number[] }): string {
  const rows: string[] = [];
  const len = Math.max(qs.home.length, qs.away.length);
  for (let i = 0; i < len; i++) {
    const h = qs.home[i] ?? 0;
    const a = qs.away[i] ?? 0;
    const label = i < 4 ? `Q${i + 1}` : `OT${i - 3}`;
    rows.push(`${label} ${h}-${a}`);
  }
  return rows.join(" / ");
}

// User prompt 구성 — system prompt 가 페르소나/톤, user prompt 는 데이터만
// mode 별 안내 메시지만 다르고 데이터 본체는 동일.
function buildUserPrompt(input: MatchBriefInput, mode: BriefMode): string {
  const lines: string[] = [];
  if (mode === "phase2-match") {
    lines.push("아래 동호회 농구 매치의 [독립 단신 기사]를 작성해주세요.");
    lines.push("- 길이: 400~700자, 4~6문장 (3~4 단락)");
    lines.push("- 본문에 점수/팀명/대회 풀명/일시/장소 모두 포함 (게시판 독립 기사)");
    lines.push("- 첫 줄에 'TITLE: 제목' (30자 이내)");
    lines.push("- 다양한 관점 활용 (야투·3점·리바·어시·스틸·블락·+/-·더블더블·턴오버 중)");
  } else {
    lines.push("아래 동호회 농구 매치의 [흐름·영웅] 섹션을 작성해주세요.");
    lines.push("- 길이: 150~250자, 2~3문장");
    lines.push("- 점수/대회명/일시/장소는 페이지 Header/Headline 에 이미 표시됨 → 반복 X");
    lines.push("- 팀명은 첫 문장 승팀 1회만 (패팀은 자연스러우면 1회)");
    lines.push("- 매치의 서사 (역전·시소·완승·접전) + 승부처 영웅만 다룸");
  }
  lines.push("");
  lines.push("[매치 정보 — 입력 데이터, 모두 정확히 사용]");
  if (input.tournamentName) {
    if (mode === "phase2-match") {
      lines.push(`- 대회: ${input.tournamentName} (※ 본문에 풀명 포함)`);
    } else {
      lines.push(`- 대회: ${input.tournamentName} (※ 본문에 풀명 X)`);
    }
  }
  lines.push(
    `- ${input.homeTeam} ${input.homeScore} vs ${input.awayScore} ${input.awayTeam}`,
  );
  if (input.roundName || input.groupName) {
    const round = input.roundName ?? "";
    const group = input.groupName ? ` (${input.groupName})` : "";
    lines.push(`- 라운드: ${round}${group}`);
  }
  if (input.venueName) lines.push(`- 장소: ${input.venueName}`);
  if (input.scheduledAt) lines.push(`- 일시: ${input.scheduledAt}`);

  const scoreDiff = Math.abs(input.homeScore - input.awayScore);
  lines.push(`- 점수차: ${scoreDiff}점`);
  lines.push(`- 흐름: ${FLOW_LABEL[input.flow]}`);
  if (input.maxLead > scoreDiff) {
    lines.push(`- 최대 점수차 (한때): ${input.maxLead}점`);
  }
  if (input.leadChanges > 0) {
    lines.push(`- 리드 체인지: ${input.leadChanges}회`);
  }
  lines.push(`- 쿼터별: ${formatQuarters(input.quarterScores)}`);

  if (input.mvp) {
    lines.push("");
    lines.push("[MVP]");
    lines.push(
      `- ${input.mvp.name} — ${input.mvp.pts}점 ${input.mvp.reb}리바운드 ${input.mvp.ast}어시스트`,
    );
  }
  if (input.homeTopScorer || input.awayTopScorer) {
    lines.push("");
    lines.push("[양 팀 최다득점자]");
    if (input.homeTopScorer) {
      lines.push(
        `- ${input.homeTeam}: ${input.homeTopScorer.name} (${input.homeTopScorer.pts}점)`,
      );
    }
    if (input.awayTopScorer) {
      lines.push(
        `- ${input.awayTeam}: ${input.awayTopScorer.name} (${input.awayTopScorer.pts}점)`,
      );
    }
  }

  // [팀 통계 비교] — 야투/3점/리바/어시/스틸/블락/턴오버 비교
  if (input.homeTeamStat && input.awayTeamStat) {
    lines.push("");
    lines.push("[팀 통계 비교]");
    const h = input.homeTeamStat;
    const a = input.awayTeamStat;
    lines.push(
      `- 야투: ${input.homeTeam} ${h.fgMade}/${h.fgAtt} (${h.fgPct.toFixed(1)}%) vs ${input.awayTeam} ${a.fgMade}/${a.fgAtt} (${a.fgPct.toFixed(1)}%)`,
    );
    if (h.threesAtt > 0 || a.threesAtt > 0) {
      lines.push(
        `- 3점: ${input.homeTeam} ${h.threesMade}/${h.threesAtt} (${h.threesPct.toFixed(1)}%) vs ${input.awayTeam} ${a.threesMade}/${a.threesAtt} (${a.threesPct.toFixed(1)}%)`,
      );
    }
    if (h.ftAtt > 0 || a.ftAtt > 0) {
      lines.push(
        `- 자유투: ${input.homeTeam} ${h.ftMade}/${h.ftAtt} vs ${input.awayTeam} ${a.ftMade}/${a.ftAtt}`,
      );
    }
    lines.push(
      `- 리바운드: ${input.homeTeam} ${h.totalReb} (공격 ${h.offReb}/수비 ${h.defReb}) vs ${input.awayTeam} ${a.totalReb} (공격 ${a.offReb}/수비 ${a.defReb})`,
    );
    lines.push(`- 어시스트: ${input.homeTeam} ${h.ast} vs ${input.awayTeam} ${a.ast}`);
    if (h.stl + a.stl > 0)
      lines.push(`- 스틸: ${input.homeTeam} ${h.stl} vs ${input.awayTeam} ${a.stl}`);
    if (h.blk + a.blk > 0)
      lines.push(`- 블락: ${input.homeTeam} ${h.blk} vs ${input.awayTeam} ${a.blk}`);
    if (h.to + a.to > 0)
      lines.push(`- 턴오버: ${input.homeTeam} ${h.to} vs ${input.awayTeam} ${a.to}`);
  }

  // [특별 기록 — 리바/어시/스틸/블락/+/-/3점/더블더블]
  const specials: string[] = [];
  if (input.tripleDoubles.length > 0) {
    input.tripleDoubles.forEach((p) =>
      specials.push(
        `- 트리플더블: ${p.name} (${p.pts}점 ${p.reb}리바 ${p.ast}어시)`,
      ),
    );
  }
  if (input.doubleDoubles.length > 0) {
    input.doubleDoubles.forEach((p) =>
      specials.push(
        `- 더블더블: ${p.name} (${p.pts}점 ${p.reb}리바 ${p.ast}어시)`,
      ),
    );
  }
  if (input.topRebounder)
    specials.push(
      `- 리바운드 1위: ${input.topRebounder.name} ${input.topRebounder.reb}개 (${input.topRebounder.team === "home" ? input.homeTeam : input.awayTeam})`,
    );
  if (input.topAssister)
    specials.push(
      `- 어시스트 1위: ${input.topAssister.name} ${input.topAssister.ast}개 (${input.topAssister.team === "home" ? input.homeTeam : input.awayTeam})`,
    );
  if (input.topStealer)
    specials.push(
      `- 스틸 1위: ${input.topStealer.name} ${input.topStealer.stl}개 (${input.topStealer.team === "home" ? input.homeTeam : input.awayTeam})`,
    );
  if (input.topBlocker)
    specials.push(
      `- 블락 1위: ${input.topBlocker.name} ${input.topBlocker.blk}개 (${input.topBlocker.team === "home" ? input.homeTeam : input.awayTeam})`,
    );
  if (input.topPlusMinus && input.topPlusMinus.plusMinus >= 5)
    specials.push(
      `- +/- 1위: ${input.topPlusMinus.name} +${input.topPlusMinus.plusMinus} (${input.topPlusMinus.team === "home" ? input.homeTeam : input.awayTeam})`,
    );
  if (input.bestThreeShooter)
    specials.push(
      `- 3점 다수: ${input.bestThreeShooter.name} ${input.bestThreeShooter.threesMade}개 성공/${input.bestThreeShooter.threesAtt}시도 (${input.bestThreeShooter.team === "home" ? input.homeTeam : input.awayTeam})`,
    );
  if (specials.length > 0) {
    lines.push("");
    lines.push("[특별 기록 — 다양한 관점 활용 권장]");
    specials.forEach((s) => lines.push(s));
  }

  return lines.join("\n");
}

// 매치 단신 기사 생성 (메모리 캐시 적용)
// 2026-05-03: mode 파라미터 추가 — Phase 1 (페이지 섹션) vs Phase 2 (독립 기사) 분기.
// 반환:
//   - phase1-section: { ok: true, brief }              — Lead 텍스트만
//   - phase2-match  : { ok: true, brief, title }       — 제목 + 본문 분리
//   - { ok: false, reason }                            — 검증 실패 / API 키 미설정 / 네트워크 에러
export async function generateMatchBrief(
  input: MatchBriefInput,
  mode: BriefMode = "phase1-section",
): Promise<
  | { ok: true; brief: string; title?: string }
  | { ok: false; reason: string }
> {
  // 캐시 — mode 별로 분리 (Phase 1 / Phase 2 응답 다름)
  const cacheKey = `${mode}:${input.matchId}`;
  const cached = briefCache.get(cacheKey);
  if (cached) {
    if (mode === "phase2-match") {
      // 제목/본문 분리
      const split = parsePhase2Output(cached);
      return { ok: true, brief: split.brief, title: split.title };
    }
    return { ok: true, brief: cached };
  }

  // mode 별 system prompt 선택
  const systemPrompt =
    mode === "phase2-match" ? ALKIJA_PHASE2_MATCH_PROMPT : ALKIJA_SYSTEM_PROMPT;

  // LLM 호출 — 네트워크 에러 / API 키 미설정 모두 catch
  let raw: string;
  try {
    const userPrompt = buildUserPrompt(input, mode);
    raw = await generateText(systemPrompt, userPrompt);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "LLM 호출 실패";
    return { ok: false, reason };
  }

  // 검증 — mode 별 길이 한도 다름 (validate-brief 내부에서 분기 처리)
  const v = validateBrief(raw, input, mode);
  if (!v.valid) {
    return { ok: false, reason: `검증 실패: ${v.reason}` };
  }

  // 캐시 저장
  briefCache.set(cacheKey, raw);

  // Phase 2 — 제목/본문 분리
  if (mode === "phase2-match") {
    const split = parsePhase2Output(raw);
    return { ok: true, brief: split.brief, title: split.title };
  }
  return { ok: true, brief: raw };
}

// Phase 2 LLM 응답 파싱 — 첫 줄 "TITLE: ..." 추출
function parsePhase2Output(raw: string): { title: string; brief: string } {
  const trimmed = raw.trim();
  const firstNewline = trimmed.indexOf("\n");
  if (firstNewline === -1) {
    // 줄바꿈 없음 — 본문만 있다고 가정 (제목 없음)
    return { title: "", brief: trimmed };
  }
  const firstLine = trimmed.slice(0, firstNewline).trim();
  // "TITLE: " 또는 "제목: " 접두사 매칭
  const titleMatch = firstLine.match(/^(?:TITLE|제목)\s*[:：]\s*(.+)$/i);
  if (titleMatch) {
    const title = titleMatch[1].trim().replace(/^["'`]|["'`]$/g, ""); // 양 끝 따옴표 제거
    const brief = trimmed.slice(firstNewline + 1).trim();
    return { title, brief };
  }
  // 첫 줄이 TITLE 이 아니면 전체가 본문
  return { title: "", brief: trimmed };
}

// 캐시 강제 무효화 — 운영 중 수동 재생성 필요 시 사용 (admin 등에서 호출 가능)
// 2026-05-03: mode 별 분리 캐시 모두 삭제.
export function invalidateBriefCache(matchId: number): void {
  briefCache.delete(`phase1-section:${matchId}`);
  briefCache.delete(`phase2-match:${matchId}`);
  // 기존 mode 미명시 캐시 (legacy) 도 정리
  briefCache.delete(String(matchId));
}
