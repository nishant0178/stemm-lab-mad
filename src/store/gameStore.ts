import { create } from 'zustand';

type GameState = {
  bestReactionTime: number | null;
  setBestReactionTime: (ms: number) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  bestReactionTime: null,
  setBestReactionTime: (ms: number) => {
    const current = get().bestReactionTime;
    if (current === null || ms < current) {
      set({ bestReactionTime: ms });
    }
  },
}));
