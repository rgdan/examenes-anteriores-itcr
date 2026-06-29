import { HOME_TAB_KEY } from "./constants.js";

/**
 * Global UI state. Populated by renderApp() after index.json loads; read by all render functions.
 *
 * @type {AppState}
 */
export const appState = {
  structure: new Map(),
  schoolMetadata: new Map(),
  subjectMetadata: new Map(),
  schools: [],
  stats: { schools: 0, subjects: 0, exams: 0 },
  currentSchool: HOME_TAB_KEY,
  pendingOpenSubject: ""
};
