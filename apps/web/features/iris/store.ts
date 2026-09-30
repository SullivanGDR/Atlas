import { create } from "zustand";
import { exampleProject, parseProject, type IrisProject } from "./model";

type State = {
  project: IrisProject;
  past: IrisProject[];
  future: IrisProject[];
  dirty: boolean;
  edit: (change: (project: IrisProject) => void, record?: boolean) => void;
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;
  replace: (project: IrisProject) => void;
  saved: () => void;
};
export const useIris = create<State>((set) => ({
  project: exampleProject(),
  past: [],
  future: [],
  dirty: false,
  edit: (change, record = true) =>
    set((state) => {
      const project = structuredClone(state.project);
      change(project);
      return {
        project,
        dirty: true,
        future: [],
        past: record ? [...state.past, state.project].slice(-60) : state.past,
      };
    }),
  checkpoint: () =>
    set((state) => ({
      past: [...state.past, state.project].slice(-60),
      future: [],
    })),
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
            future: state.future.slice(1),
            past: [...state.past, state.project],
            dirty: true,
          }
        : state,
    ),
  replace: (project) =>
    set({
      project: parseProject({ format: "atlas-iris", version: 1, project }),
      past: [],
      future: [],
      dirty: false,
    }),
  saved: () => set({ dirty: false }),
}));
