import { create } from 'zustand';
import { Team } from '../types';

type TeamState = {
  team: Team | null;
  setTeam: (team: Team | null) => void;
};

export const useTeamStore = create<TeamState>((set) => ({
  team: null,
  setTeam: (team) => set({ team }),
}));
