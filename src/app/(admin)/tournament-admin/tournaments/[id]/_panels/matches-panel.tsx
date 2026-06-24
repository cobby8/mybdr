"use client";

import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import { RecordingModeTriggerClient } from "../_components/recording-mode-trigger";
import MatchesClient from "../matches/matches-client";

type Props = {
  tournamentId: string;
  defaultMode: RecordingMode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    inProgress: number;
  };
};

export default function MatchesPanel({ tournamentId, defaultMode, matchStats }: Props) {
  return (
    <div className="mt-4 space-y-4">
      <RecordingModeTriggerClient
        tournamentId={tournamentId}
        defaultMode={defaultMode}
        matchStats={matchStats}
      />
      <MatchesClient />
    </div>
  );
}
