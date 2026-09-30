import { create } from "zustand";
import { createProject } from "./templates";
import type { SpecProject } from "./model";
type State = {
  project: SpecProject;
  dirty: boolean;
  past: SpecProject[];
  future: SpecProject[];
  lastKey: string;
  edit: (change: (p: SpecProject) => void, key?: string) => void;
  undo: () => void;
  redo: () => void;
  replace: (p: SpecProject) => void;
  saved: () => void;
};
export const useThemis = create<State>((set) => ({
  project: createProject(),
  dirty: false,
  past: [],
  future: [],
  lastKey: "",
  edit: (change, key = "") =>
    set((s) => {
      const project = structuredClone(s.project);
      change(project);
      if (key !== "meta-status") project.status = "Brouillon";
      return {
        project,
        dirty: true,
        past:
          key && key === s.lastKey ? s.past : [...s.past, s.project].slice(-60),
        future: [],
        lastKey: key,
      };
    }),
  undo: () =>
    set((s) =>
      s.past.length
        ? {
            project: s.past.at(-1)!,
            past: s.past.slice(0, -1),
            future: [s.project, ...s.future],
            dirty: true,
            lastKey: "",
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
            lastKey: "",
          }
        : s,
    ),
  replace: (project) =>
    set({ project, dirty: false, past: [], future: [], lastKey: "" }),
  saved: () => set({ dirty: false, lastKey: "" }),
}));
