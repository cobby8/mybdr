"use client";

/**
 * PlayerRecordsTab — /users/[id] "기록" 탭 (선수 기록)
 * ─────────────────────────────────────────────────────────
 * 시안 박제: Dev/design/BDR v2.33/_delivery-records-2026-06-16/screens/PlayerRecords.jsx
 *
 * 이유(왜): 경기별 박스 / 대회별 합계 / 시즌별 평균을 한 자리에서 본다.
 * 방법(어떻게): 데이터는 서버(page.tsx)에서 getPlayerRecords()로 prefetch → prop 주입.
 *   client 는 세그먼트(경기/대회/시즌) 토글만. 공통 컴포넌트(RecTable/statCols)는 import.
 *   시안 window.RECORDS/RecShared 전역 → 실데이터 prop + named import 로 변환.
 *   시안의 rec-seasonview/rec-seasontable wrapper 는 CSS 미반입(슛차트 영역) → RecTable 직접 렌더.
 *   ShotChart/SeasonSummary 보류(결재).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  RecSeg,
  RecAggToggle,
  RecTable,
  ResultBadge,
  RecEmpty,
  RecUnclaimed,
  Lnk,
  statCols,
  teamHref,
  type RecColumn,
  type RecRow,
  type StatMode,
} from "@/app/(web)/_components/records/records-shared";
import type { PlayerRecordsResult } from "@/lib/records/player-records";
// 2026-06-27 기록 모드 인증 뱃지 — 경기별 행에 부착(per-game recording_mode).
import { RecordingModeBadge } from "@/components/recording-mode-badge";

type Unit = "game" | "tournament" | "season";

const SEG_OPTIONS = [
  { v: "game", l: "경기별", ico: "list_alt" },
  { v: "tournament", l: "대회별", ico: "emoji_events" },
  { v: "season", l: "시즌별", ico: "calendar_month" },
];

// 평균/누적 토글 — 집계 뷰(대회별·시즌별) 전용. 경기별은 단일 경기 raw 라 N/A.
const AGG_OPTIONS = [
  { v: "avg", l: "평균" },
  { v: "sum", l: "누적" },
];

// 날짜 ISO → "MM.DD"
const mmdd = (iso: string): string =>
  iso ? iso.slice(5, 10).replace("-", ".") : "–";

export function PlayerRecordsTab({
  records,
  playerName,
}: {
  records: PlayerRecordsResult;
  playerName?: string;
}) {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>("game");
  // 집계 단위(평균/누적) — 대회별·시즌별에만 적용. 기본 평균(기존 동작 보존).
  const [aggMode, setAggMode] = useState<StatMode>("avg");

  // ── 컬럼 정의 (시안 gameCols/tnCols/seasonCols) ──
  const gameCols: RecColumn<RecRow>[] = [
    {
      key: "date",
      label: "날짜",
      align: "left",
      sticky: true,
      strong: true,
      render: (r) => mmdd(r.date as string),
      sortVal: (r) => (r.date as string) || "",
    },
    {
      key: "opponent",
      label: "상대",
      align: "left",
      render: (r) => (
        <Lnk href={teamHref(r.opponent_team_id as string | null)}>
          {r.opponent as string}
        </Lnk>
      ),
    },
    {
      key: "tournament",
      label: "대회",
      align: "left",
      // 대회명 + 이 경기의 기록 모드 뱃지(per-game). flutter/paper 만 노출(그 외 null).
      render: (r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="rec-dim">{r.tournament as string}</span>
          <RecordingModeBadge
            mode={r.recording_mode as string | null | undefined}
            size="sm"
          />
        </span>
      ),
    },
    ...statCols({ avg: false }),
    {
      key: "result",
      label: "결과",
      align: "right",
      sortable: false,
      render: (r) =>
        r.result ? (
          <ResultBadge r={r.result as string} />
        ) : (
          <span className="rec-na">–</span>
        ),
    },
  ];

  const tnCols: RecColumn<RecRow>[] = [
    {
      key: "tournament",
      label: "대회",
      align: "left",
      sticky: true,
      strong: true,
      render: (r) => r.tournament as string,
    },
    {
      key: "period",
      label: "기간",
      align: "left",
      sortable: false,
      render: (r) => <span className="rec-dim">{r.period as string}</span>,
    },
    { key: "g", label: "G", align: "right" },
    ...statCols({ mode: aggMode }),
    {
      key: "wl",
      label: "승–패",
      align: "right",
      sortable: false,
      render: (r) => (
        <span className="rec-wlrec">
          {r.wins as number}–{r.losses as number}
        </span>
      ),
    },
  ];

  const seasonCols: RecColumn<RecRow>[] = [
    {
      key: "season_year",
      label: "시즌",
      align: "left",
      sticky: true,
      strong: true,
      render: (r) => (r.season_year as number) + " 시즌",
    },
    { key: "g", label: "G", align: "right" },
    ...statCols({ mode: aggMode }),
  ];

  function Body() {
    // 미연동(클레임 전) → 안내
    if (!records.claimed) return <RecUnclaimed name={playerName} />;
    // 연동됐으나 기록 0 → 빈 상태
    if (records.games.length === 0)
      return (
        <RecEmpty
          icon="query_stats"
          title="아직 경기 기록이 없습니다"
          desc="공식 대회 경기에 출전하면 박스스코어가 여기에 쌓입니다."
        />
      );

    if (unit === "game") {
      return (
        <RecTable<RecRow>
          columns={gameCols}
          rows={records.games as unknown as RecRow[]}
          getKey={(r) => r.match_id as string}
          initialSort={{ key: "date", dir: "desc" }}
        />
      );
    }
    if (unit === "tournament") {
      return (
        <RecTable<RecRow>
          columns={tnCols}
          rows={records.tournaments as unknown as RecRow[]}
          getKey={(r) => r.tournament_id as string}
          onRowClick={(r) =>
            r.tournament_id &&
            router.push(`/tournaments/${r.tournament_id}?tab=records`)
          }
          initialSort={{ key: "pts", dir: "desc" }}
        />
      );
    }
    return (
      <RecTable<RecRow>
        columns={seasonCols}
        rows={records.seasons as unknown as RecRow[]}
        getKey={(r) => String(r.season_year)}
        initialSort={{ key: "season_year", dir: "desc" }}
      />
    );
  }

  const showHint = records.claimed && records.games.length > 0;

  return (
    <section className="rec-card">
      <div className="rec-card__head">
        <h3 className="rec-card__h">
          <span className="ico material-symbols-outlined">leaderboard</span>기록
        </h3>
        <span className="rec-card__src">MatchPlayerStat</span>
      </div>
      <p className="rec-card__lede">
        경기별 박스스코어 · 대회별 합계 · 시즌별 평균을 한 자리에서.
      </p>
      <div className="rec-toolbar">
        <RecSeg value={unit} onChange={(v) => setUnit(v as Unit)} options={SEG_OPTIONS} />
        {showHint && unit === "tournament" && (
          <span className="rec-toolbar__note">
            <span className="ico material-symbols-outlined">touch_app</span>행을 누르면
            대회 기록실로
          </span>
        )}
        {/* 평균/누적 토글 — 우측 정렬(margin-left:auto). 집계 뷰(대회별·시즌별)에만. 경기별 N/A */}
        {showHint && unit !== "game" && (
          <div style={{ marginLeft: "auto" }}>
            <RecAggToggle
              value={aggMode}
              onChange={(v) => setAggMode(v as StatMode)}
              options={AGG_OPTIONS}
            />
          </div>
        )}
      </div>
      <Body />
    </section>
  );
}
