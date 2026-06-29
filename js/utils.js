import { STRINGS, SEMESTER_ORDER, SEMESTER_LABELS, PARCIAL_LABELS } from "./constants.js";
import { appState } from "./state.js";

/** Converts slug-like text to title case with spaces. */
export function normalizeText(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

/** Lowercases text and strips accents for case-insensitive search. */
export function foldText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Builds the subject metadata lookup key. */
export function subjectKey(school, subject) {
  return `${school}/${subject}`;
}

/** Populates the static header elements from STRINGS. */
export function updateHeaderText() {
  document.getElementById("eyebrow").textContent = STRINGS.eyebrow;
  document.getElementById("title").textContent = STRINGS.title;
}

/** Returns the display name for a school, falling back to normalized slug. */
export function schoolLabel(code) {
  const metadata = appState.schoolMetadata.get(code);
  if (metadata && metadata.properSpelling) {
    return metadata.properSpelling;
  }
  return normalizeText(code);
}

/** Returns the display name for a subject, falling back to normalized slug. */
export function subjectLabel(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  if (metadata && metadata.properSpelling) {
    return metadata.properSpelling;
  }
  return normalizeText(subject);
}

/** Returns the course code for a subject, or an empty string. */
export function subjectCourseCode(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  if (!metadata) {
    return "";
  }
  return metadata.courseCode ? metadata.courseCode : "";
}

/** Returns whether a subject is taught as catedrado (defaults to true). */
export function subjectIsCatedrado(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  return metadata ? metadata.EsCatedrado !== false : true;
}

/** Returns the display name for a professor slug. */
export function professorLabel(code) {
  return normalizeText(code);
}

/** Compares semester codes (IS before IIS). */
export function semesterSort(a, b) {
  return (SEMESTER_ORDER[a] || 99) - (SEMESTER_ORDER[b] || 99) || a.localeCompare(b);
}

/** Compares parcial codes numerically; RP sorts last. */
export function parcialSort(a, b) {
  if (a === "RP") {
    return 1;
  }
  if (b === "RP") {
    return -1;
  }
  const numA = Number.parseInt(a.replace("P", ""), 10);
  const numB = Number.parseInt(b.replace("P", ""), 10);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return a.localeCompare(b);
}

/** Returns a display label for a parcial code. */
export function parcialLabel(code) {
  if (PARCIAL_LABELS[code]) {
    return PARCIAL_LABELS[code];
  }
  if (/^P[0-9]+$/.test(code)) {
    return `Parcial ${code.slice(1)}`;
  }
  return normalizeText(code);
}

/** Returns a short display label for a semester code. */
export function semesterLabel(code) {
  if (SEMESTER_LABELS[code]) {
    return SEMESTER_LABELS[code];
  }
  return code;
}
