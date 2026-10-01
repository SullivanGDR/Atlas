import { create } from "zustand";
import { createProject, type HestiaProject } from "./model";

type State = {
  project: HestiaProject;
  dirty: boolean;
  past: HestiaProject[];
  future: HestiaProject[];
  edit: (project: HestiaProject) => void;
  replace: (project: HestiaProject) => void;
  saved: () => void;
  undo: () => void;
  redo: () => void;
};

export const useHestia = create<State>((set) => ({
  project: createProject(),
  dirty: false,
  past: [],
  future: [],
  edit: (project) =>
    set((state) => ({
      project,
      dirty: true,
      past: [...state.past, state.project].slice(-40),
      future: [],
    })),
  replace: (project) => set({ project, dirty: false, past: [], future: [] }),
  saved: () => set({ dirty: false }),
  undo: () =>
    set((state) =>
      state.past.length
        ? {
            project: state.past.at(-1)!,
            past: state.past.slice(0, -1),
            future: [state.project, ...state.future],
            dirty: true,
          }
        : state,
    ),
  redo: () =>
    set((state) =>
      state.future.length
        ? {
            project: state.future[0]!,
            past: [...state.past, state.project],
            future: state.future.slice(1),
            dirty: true,
          }
        : state,
    ),
}));
