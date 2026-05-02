// 2026-05-02: Phase 1 — 매치 요약 단신 기사 generator (Gemini 2.5 Flash)
// 이유: tab-summary.tsx 의 Phase 0 템플릿 Lead 부분을 LLM 응답으로 교체.
// 진행 중 매치(live)는 호출 X — 종료(completed) 매치만 호출 + 캐시.
// 캐시 = 메모리 Map (Vercel serverless instance 별 — cold start 시 재생성).
// 운영 영향 0 가드 = (1) completed 만 (2) 캐시 (3) 검증 실패 시 fallback.

import { generateText } from "./gemini-client";
import { ALKIJA_SYSTEM_PROMPT } from "./prompts/alkija-system";
import { validateBrief } from "./validate-brief";

// LLM 입력 데이터 — tab-summary 의 Phase 0 분석 결과를 그대로 넘김
export type MatchBriefInput = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  roundName: string | null;
  groupName: string | null; // 예: "B조" — 없으면 null
  scheduledAt: string | null;
  venueName: string | null;
  // MVP — null 가능 (집계 부재 시)
  mvp: { name: string; pts: number; reb: number; ast: number } | null;
  // 양 팀 최다득점자 — null 가능 (DNP 만 있을 때)
  homeTopScorer: { name: string; pts: number } | null;
  awayTopScorer: { name: string; pts: number } | null;
  // tab-summary 의 8 flow 분류 (LLM 톤 분기 hint)
  flow:
    | "overtime"
    | "lastminute"
    | "comeback"
    | "seesaw"
    | "blowout"
    | "dominant"
    | "narrow"
    | "default";
  maxLead: number; // 최대 점수차 (한때 끌렸던 경우 comeback 식별)
  leadChanges: number; // 리드체인지 횟수
  // 쿼터별 점수 (서사용 — Q4 점수차 등)
  quarterScores: { home: number[]; away: number[] };
};

// LLM 결과 캐시 — matchId → brief 텍스트
// Vercel serverless instance 별 메모리. 운영 평소 360 매치 / 1500 RPD 무료 tier 충분.
// Phase 2 에서 DB articles 테이블로 영구 저장 예정.
const briefCache = new Map<number, string>();

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
function buildUserPrompt(input: MatchBriefInput): string {
  const lines: string[] = [];
  lines.push("아래 동호회 농구 매치를 단신 기사로 작성해주세요. 300자 이내, 3~5문장.");
  lines.push("");
  lines.push("[매치 정보]");
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
  return lines.join("\n");
}

// 매치 단신 기사 생성 (메모리 캐시 적용)
// 반환:
//   - { ok: true, brief }  : LLM 생성 + 검증 통과
//   - { ok: false, reason }: 검증 실패 / API 키 미설정 / 네트워크 에러 등 → 상위에서 fallback
export async function generateMatchBrief(
  input: MatchBriefInput,
): Promise<{ ok: true; brief: string } | { ok: false; reason: string }> {
  // 캐시 hit — 이미 생성한 기사가 있으면 재호출 X (LLM 비용 0)
  const cached = briefCache.get(input.matchId);
  if (cached) {
    return { ok: true, brief: cached };
  }

  // LLM 호출 — 네트워크 에러 / API 키 미설정 모두 catch
  let raw: string;
  try {
    const userPrompt = buildUserPrompt(input);
    raw = await generateText(ALKIJA_SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "LLM 호출 실패";
    return { ok: false, reason };
  }

  // 검증 — 점수 / 팀명 / 길이 (hallucination 방어)
  const v = validateBrief(raw, input);
  if (!v.valid) {
    return { ok: false, reason: `검증 실패: ${v.reason}` };
  }

  // 캐시 저장 후 반환
  briefCache.set(input.matchId, raw);
  return { ok: true, brief: raw };
}

// 캐시 강제 무효화 — 운영 중 수동 재생성 필요 시 사용 (admin 등에서 호출 가능)
// Phase 1 에서는 미노출. Phase 2 DB 도입 시 함께 노출.
export function invalidateBriefCache(matchId: number): void {
  briefCache.delete(matchId);
}
