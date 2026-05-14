import { create } from 'zustand';

type GameState = {
  bestReactionTime: number | null;
  setBestReactionTime: (ms: number) => void;
  bestVibrationScore: number | null;
  setBestVibrationScore: (score: number) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  bestReactionTime: null,
  setBestReactionTime: (ms: number) => {
    const current = get().bestReactionTime;
    if (current === null || ms < current) {
      set({ bestReactionTime: ms });
    }
  },
  bestVibrationScore: null,
  setBestVibrationScore: (score: number) => {
    const current = get().bestVibrationScore;
    if (current === null || score < current) {
      set({ bestVibrationScore: score });
    }
  },
}));
