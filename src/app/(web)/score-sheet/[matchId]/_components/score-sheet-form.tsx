/**
 * 종이 기록지 client form 본체.
 *
 * 2026-05-11 — Phase 1-B-2 신규.
 *
 * 상태:
 *   - header inputs (심판/기록원/타임키퍼)
 *   - quarter scores (Q1~Q4 + OT[])
 *   - 매치 종료 토글 (status = completed | in_progress)
 *   - localStorage draft (5초 throttle 저장 / 페이지 이탈 후 복원)
 *
 * 모바일 가드 (사용자 결재 §2):
 *   - 720px 미만 = "PC 또는 태블릿에서 사용하세요" 안내 + 입력 차단
 *
 * 제출:
 *   - POST `/api/web/score-sheet/{matchId}/submit`
 *   - 성공 → 알림 + /live/{matchId} 링크
 *   - 실패 → 에러 메시지 + 입력 유지
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  QuarterScoreGrid,
  EMPTY_QUARTER_SCORES,
  toQuarterScoresJson,
  fromQuarterScoresJson,
  type QuarterScores,
} from "./quarter-score-grid";
import { ScoreSheetHeader, type HeaderInputs } from "./score-sheet-header";
import { TeamRoster, type TeamRosterData } from "./team-roster";
import { SubmitBar } from "./submit-bar";

interface MatchProp {
  id: string;
  tournamentId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  status: string | null;
  homeScore: number;
  awayScore: number;
  roundName: string | null;
  round_number: number | null;
  match_number: number | null;
  match_code: string | null;
  scheduledAt: string | null;
  court_number: string | null;
  quarterScores: Record<string, unknown> | null;
  notes: string | null;
}

interface TournamentProp {
  id: string;
  name: string;
  format: string | null;
}

interface UserProp {
  id: string;
  nickname: string | null;
}

interface ScoreSheetFormProps {
  match: MatchProp;
  tournament: TournamentProp;
  homeRoster: TeamRosterData;
  awayRoster: TeamRosterData;
  user: UserProp;
}

// localStorage key prefix — 매치당 1건
const DRAFT_KEY_PREFIX = "score-sheet-draft-";

interface DraftPayload {
  header: HeaderInputs;
  quarter: QuarterScores;
  isCompleted: boolean;
  notes: string;
  savedAt: string;
}

const EMPTY_HEADER: HeaderInputs = {
  refereeMain: "",
  refereeSub1: "",
  refereeSub2: "",
  recorder: "",
  timekeeper: "",
};

export function ScoreSheetForm({
  match,
  tournament,
  homeRoster,
  awayRoster,
  user,
}: ScoreSheetFormProps) {
  // 모바일 가드 (사용자 결재 §2) — 720px 미만 = 입력 차단
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 720);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 초기 상태 — server prop (DB 기존 값) 우선 + draft 복원 (mount 후 useEffect)
  const [header, setHeader] = useState<HeaderInputs>(EMPTY_HEADER);
  const [quarter, setQuarter] = useState<QuarterScores>(
    fromQuarterScoresJson(match.quarterScores)
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(
    match.status === "completed"
  );
  const [notes, setNotes] = useState<string>(match.notes ?? "");

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    homeScore: number;
    awayScore: number;
    status: string;
  } | null>(null);

  // localStorage draft 복원 (mount 후 1회)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY_PREFIX + match.id);
      if (raw) {
        const draft = JSON.parse(raw) as DraftPayload;
        if (draft.header) setHeader(draft.header);
        if (draft.quarter) setQuarter(draft.quarter);
        if (typeof draft.isCompleted === "boolean") setIsCompleted(draft.isCompleted);
        if (typeof draft.notes === "string") setNotes(draft.notes);
      }
    } catch {
      // 손상된 draft = 무시 (기본값 유지)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // localStorage draft 저장 (5초 throttle — 입력 후 일정 시간마다 자동 박제)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      try {
        const draft: DraftPayload = {
          header,
          quarter,
          isCompleted,
          notes,
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(
          DRAFT_KEY_PREFIX + match.id,
          JSON.stringify(draft)
        );
      } catch {
        // localStorage quota / disabled — 무시
      }
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [header, quarter, isCompleted, notes, match.id]);

  // 합산 자동 계산 (검증용)
  const sumHome =
    quarter.q1.home +
    quarter.q2.home +
    quarter.q3.home +
    quarter.q4.home +
    quarter.ot.reduce((a, o) => a + o.home, 0);
  const sumAway =
    quarter.q1.away +
    quarter.q2.away +
    quarter.q3.away +
    quarter.q4.away +
    quarter.ot.reduce((a, o) => a + o.away, 0);

  // 검증 — 입력 직후 즉시 (alert 표시용, 제출 차단 X)
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    // 완료 시 동점 경고 — 5x5 정규 농구 = 연장 필요
    if (isCompleted && sumHome === sumAway && (sumHome > 0 || sumAway > 0)) {
      errs.push(
        "쿼터 합산이 동점입니다. 5x5 농구는 연장이 필요합니다 (FIBA 표준)."
      );
    }
    // 완료 + 양 팀 0점 = 의심
    if (isCompleted && sumHome === 0 && sumAway === 0) {
      errs.push(
        "완료 매치인데 양 팀 점수가 0입니다. 기권 매치인 경우 운영자에게 forfeit 처리를 요청하세요."
      );
    }
    return errs;
  }, [isCompleted, sumHome, sumAway]);

  // 제출 핸들러 — POST /api/web/score-sheet/{matchId}/submit
  const onSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const body = {
        home_score: sumHome,
        away_score: sumAway,
        quarter_scores: toQuarterScoresJson(quarter),
        status: isCompleted ? "completed" : "in_progress",
        // 헤더 입력은 audit context 박제용 — DB 컬럼 없음 (Phase 4 결정)
        referee_main: header.refereeMain || undefined,
        referee_sub1: header.refereeSub1 || undefined,
        referee_sub2: header.refereeSub2 || undefined,
        recorder: header.recorder || undefined,
        timekeeper: header.timekeeper || undefined,
        notes: notes || undefined,
      };

      const res = await fetch(`/api/web/score-sheet/${match.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        // apiError 컨벤션 — body.error 또는 body.message (snake_case)
        const msg =
          (data.error as string) ||
          (data.message as string) ||
          "제출 실패 — 잠시 후 다시 시도해주세요.";
        setSubmitError(msg);
        return;
      }

      // 성공 — localStorage draft 제거 + 성공 안내
      try {
        window.localStorage.removeItem(DRAFT_KEY_PREFIX + match.id);
      } catch {
        // ignore
      }
      setSubmitSuccess({
        homeScore: sumHome,
        awayScore: sumAway,
        status: isCompleted ? "completed" : "in_progress",
      });
    } catch (err) {
      // 네트워크 실패
      setSubmitError(
        err instanceof Error ? err.message : "네트워크 오류 — 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모바일 가드 — 입력 차단 (사용자 결재 §2)
  if (isMobile) {
    return (
      <div
        className="rounded-[12px] px-4 py-8 text-center"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
          color: "var(--color-warning)",
        }}
      >
        <p className="text-base font-semibold">PC 또는 태블릿에서 사용하세요</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          종이 기록지 입력은 화면 너비가 720px 이상인 환경에서만 가능합니다.
          PC, 노트북, 또는 가로 모드 태블릿으로 접속해주세요.
        </p>
      </div>
    );
  }

  // 매치 메타 라벨 — round_label 우선 (없으면 round_number)
  const matchLabel =
    match.roundName ??
    (match.round_number ? `라운드 ${match.round_number}` : "매치") +
      (match.match_number ? ` #${match.match_number}` : "");
  const scheduledLabel = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div>
      <ScoreSheetHeader
        tournamentName={tournament.name}
        matchLabel={matchLabel}
        matchCode={match.match_code}
        scheduledAtLabel={scheduledLabel}
        courtLabel={match.court_number}
        values={header}
        onChange={setHeader}
        disabled={isSubmitting || !!submitSuccess}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TeamRoster data={homeRoster} />
        <TeamRoster data={awayRoster} />
      </div>

      <QuarterScoreGrid
        values={quarter}
        onChange={setQuarter}
        disabled={isSubmitting || !!submitSuccess}
      />

      {/* 비고 (notes) — forfeit / 사고 등 운영 메모 */}
      <div className="mb-6">
        <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
          비고 (운영 메모 — 선택)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting || !!submitSuccess}
          rows={2}
          maxLength={500}
          className="w-full rounded-[4px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
          placeholder="예: 1쿼터 5분 부상 발생"
        />
      </div>

      {/* 성공 안내 — 제출 후 표시 */}
      {submitSuccess && (
        <div
          className="mb-4 rounded-[12px] px-4 py-4"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)",
            color: "var(--color-success)",
          }}
        >
          <p className="font-semibold">✅ 기록 완료</p>
          <p className="mt-1 text-sm text-[var(--color-text-primary)]">
            점수 {submitSuccess.homeScore} : {submitSuccess.awayScore} /{" "}
            상태 {submitSuccess.status}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/live/${match.id}`}
              className="inline-block rounded-[4px] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
            >
              라이브 페이지 확인
            </Link>
            <Link
              href={`/tournament-admin/tournaments/${tournament.id}/matches`}
              className="inline-block rounded-[4px] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]"
            >
              경기 관리
            </Link>
          </div>
        </div>
      )}

      {/* 제출 에러 — 통신 실패 또는 server 거부 */}
      {submitError && (
        <div
          className="mb-4 rounded-[12px] px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
            color: "var(--color-error)",
          }}
        >
          ❌ {submitError}
        </div>
      )}

      {!submitSuccess && (
        <SubmitBar
          isCompleted={isCompleted}
          onToggleCompleted={setIsCompleted}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          errors={validationErrors}
          hasUnsavedDraft={true}
        />
      )}

      {/* user prop 사용 표시 — TS unused 회피 (현 시점 audit context 는 BFF 가 서버측 nickname 재산출) */}
      <p className="mt-4 text-right text-xs text-[var(--color-text-muted)]">
        입력자: {user.nickname ?? "익명"} (user_id: {user.id})
      </p>
    </div>
  );
}
