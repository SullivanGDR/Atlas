import { create } from "zustand";
import { createProject, type Project } from "./model";
type State = {
  project: Project;
  dirty: boolean;
  past: Project[];
  future: Project[];
  key: string;
  edit: (project: Project, key?: string) => void;
  replace: (project: Project) => void;
  saved: () => void;
  undo: () => void;
  redo: () => void;
};
export const useMetis = create<State>((set) => ({
  project: createProject(),
  dirty: false,
  past: [],
  future: [],
  key: "",
  edit: (project, key = "") =>
    set((s) => ({
      project,
      dirty: true,
      past: key && key === s.key ? s.past : [...s.past, s.project].slice(-60),
      future: [],
      key,
    })),
  replace: (project) =>
    set({ project, dirty: false, past: [], future: [], key: "" }),
  saved: () => set({ dirty: false, key: "" }),
  undo: () =>
    set((s) =>
      s.past.length
        ? {
            project: s.past.at(-1)!,
            past: s.past.slice(0, -1),
            future: [s.project, ...s.future],
            dirty: true,
            key: "",
          }
        : s,
    ),
  redo: () =>
    set((s) =>
      s.future.length
        ? {
            project: s.future[0]!,
            past: [...s.past, s.project],
            future: s.future.slice(1),
            dirty: true,
            key: "",
          }
        : s,
    ),
}));
