export type ScoreEntry = {
  teamId: string;
  reactionTimeMs: number;
};

export type TeamBest = {
  teamId: string;
  bestTimeMs: number;
};

export type RankedTeam = TeamBest & {
  rank: number;
};

/** Groups scores by team and picks each team's lowest (best) time. */
export function aggregateBestTimes(scores: ScoreEntry[]): TeamBest[] {
  const bestByTeam = new Map<string, number>();
  for (const score of scores) {
    const current = bestByTeam.get(score.teamId);
    if (current === undefined || score.reactionTimeMs < current) {
      bestByTeam.set(score.teamId, score.reactionTimeMs);
    }
  }
  return Array.from(bestByTeam.entries()).map(([teamId, bestTimeMs]) => ({
    teamId,
    bestTimeMs,
  }));
}

/** Sorts teams ascending by best time and assigns rank numbers starting at 1. */
export function rankTeams(teamBests: TeamBest[]): RankedTeam[] {
  return [...teamBests]
    .sort((a, b) => a.bestTimeMs - b.bestTimeMs)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}
