import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Persona store state and actions.
 */
interface PersonaStore {
  /** Persona id chosen for the current tab, or null when unchosen. */
  selectedPersonaId: string | null;
  setPersona: (id: string) => void;
  clearPersona: () => void;
}

/**
 * Zustand store for the recruiter persona chosen before a simulation.
 *
 * Backed by **sessionStorage**, not localStorage. The choice only needs to
 * survive a mid-interview reload; in localStorage it would outlive the tab and
 * silently re-use a long-forgotten pick on a later visit, with no modal shown.
 * sessionStorage dies with the tab, so the purge is free.
 *
 * @example
 * ```tsx
 * const selectedPersonaId = usePersonaStore((state) => state.selectedPersonaId);
 * const persona = getPersonaById(selectedPersonaId);
 * ```
 */
const usePersonaStore = create<PersonaStore>()(
  persist(
    (set) => ({
      selectedPersonaId: null,
      setPersona: (id) => set({ selectedPersonaId: id }),
      clearPersona: () => set({ selectedPersonaId: null }),
    }),
    {
      name: 'persona-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export default usePersonaStore;
