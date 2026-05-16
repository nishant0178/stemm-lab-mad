// ─── Legacy types (kept for existing unit tests) ─────────────────────────────

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

export function rankTeams(teamBests: TeamBest[]): RankedTeam[] {
  return [...teamBests]
    .sort((a, b) => a.bestTimeMs - b.bestTimeMs)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ─── Multi-activity ranking ───────────────────────────────────────────────────

export type RankingDirection = 'lowerIsBetter' | 'higherIsBetter';

export type ActivityConfig = {
  scoreField: string;
  direction: RankingDirection;
  formatScore: (value: number) => string;
  label: string;
  shortLabel: string;
  icon: string;
};

export const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
  reactionBoard: {
    scoreField: 'reactionTimeMs',
    direction: 'lowerIsBetter',
    formatScore: (v) => `${Math.round(v)} ms`,
    label: 'Reaction Board',
    shortLabel: 'Reaction',
    icon: 'flash-outline',
  },
  vibration: {
    scoreField: 'motionScore',
    direction: 'lowerIsBetter',
    formatScore: (v) => v.toFixed(2),
    label: 'Vibration Meter',
    shortLabel: 'Vibration',
    icon: 'analytics-outline',
  },
  soundPollution: {
    scoreField: 'averageDb',
    direction: 'lowerIsBetter',
    formatScore: (v) => `${v.toFixed(1)} dB`,
    label: 'Sound Pollution',
    shortLabel: 'Sound',
    icon: 'volume-high-outline',
  },
  breathing: {
    scoreField: 'breathsPerMinute',
    direction: 'lowerIsBetter',
    formatScore: (v) => `${v} bpm`,
    label: 'Breathing Pace',
    shortLabel: 'Breathing',
    icon: 'heart-outline',
  },
  earthquake: {
    scoreField: 'stabilityScore',
    direction: 'higherIsBetter',
    formatScore: (v) => `${Math.round(v)} / 100`,
    label: 'Earthquake Structure',
    shortLabel: 'Earthquake',
    icon: 'pulse-outline',
  },
  humanPerformance: {
    scoreField: 'smoothnessScore',
    direction: 'higherIsBetter',
    formatScore: (v) => `${Math.round(v)} / 100`,
    label: 'Human Performance',
    shortLabel: 'Performance',
    icon: 'body-outline',
  },
  parachute: {
    scoreField: 'dragForce',
    direction: 'higherIsBetter',
    formatScore: (v) => `${v.toFixed(2)} N`,
    label: 'Parachute Drop',
    shortLabel: 'Parachute',
    icon: 'airplane-outline',
  },
  handFan: {
    scoreField: 'averageForce',
    direction: 'higherIsBetter',
    formatScore: (v) => `${v.toFixed(4)} N`,
    label: 'Hand Fan Challenge',
    shortLabel: 'Hand Fan',
    icon: 'leaf-outline',
  },
};

export function aggregateBestScores(
  scores: Array<{ teamId: string; [key: string]: any }>,
  scoreField: string,
  direction: RankingDirection,
): Array<{ teamId: string; bestScore: number }> {
  const byTeam = new Map<string, number>();
  for (const score of scores) {
    const value = score[scoreField];
    if (typeof value !== 'number') continue;
    const existing = byTeam.get(score.teamId);
    if (existing === undefined) {
      byTeam.set(score.teamId, value);
    } else {
      byTeam.set(
        score.teamId,
        direction === 'lowerIsBetter'
          ? Math.min(existing, value)
          : Math.max(existing, value),
      );
    }
  }
  return Array.from(byTeam.entries()).map(([teamId, bestScore]) => ({ teamId, bestScore }));
}

export function rankByScore(
  teamScores: Array<{ teamId: string; bestScore: number }>,
  direction: RankingDirection,
): Array<{ rank: number; teamId: string; bestScore: number }> {
  const sorted = [...teamScores].sort((a, b) =>
    direction === 'lowerIsBetter'
      ? a.bestScore - b.bestScore
      : b.bestScore - a.bestScore,
  );
  return sorted.map((team, i) => ({ rank: i + 1, ...team }));
}
