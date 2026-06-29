import { STRINGS, HOME_TAB_KEY } from "./constants.js";
import { appState } from "./state.js";
import { updateHeaderText, schoolLabel } from "./utils.js";
import { groupedIndex } from "./grouping.js";
import { renderSchoolTabs, renderSchoolContent } from "./render-school.js";
import { setupPdfViewerModal } from "./pdf-viewer.js";
import { parseHash, setupHashRouting } from "./router.js";

/**
 * Rebuilds school tab buttons in #school-tabs, including the home tab.
 *
 * @param {ExamItem[]} items
 * @param {Object.<string, SchoolMetadata>} schoolMetadata
 * @param {Object.<string, SubjectMetadata>} subjectMetadata
 * @param {Object} [stats]
 */
export function renderApp(items, schoolMetadata, subjectMetadata, stats = {}) {
  appState.schoolMetadata = new Map(Object.entries(schoolMetadata));
  appState.subjectMetadata = new Map(Object.entries(subjectMetadata));
  appState.structure = groupedIndex(items, appState.subjectMetadata);
  appState.schools = [...appState.structure.keys()].sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b)));
  
  appState.stats = {
    schools: stats.schools ?? appState.schools.length,
    subjects: stats.subjects ?? 0,
    exams: stats.exams ?? items.length
  };

  // Apply the URL hash to set the initial school/subject on first load.
  const { school: hashSchool, subject: hashSubject } = parseHash();
  if (hashSchool && hashSchool !== HOME_TAB_KEY && appState.schools.includes(hashSchool)) {
    appState.currentSchool = hashSchool;
    if (hashSubject) {
      appState.pendingOpenSubject = hashSubject;
    }
  } else if (appState.currentSchool !== HOME_TAB_KEY && !appState.schools.includes(appState.currentSchool)) {
    appState.currentSchool = HOME_TAB_KEY;
  }

  renderSchoolTabs();
  renderSchoolContent();
}

/**
 * Fetches index.json and passes the payload to renderApp.
 * Shows loading and error states in #content on failure.
 */
export async function loadIndex() {
  const container = document.getElementById("content");
  container.innerHTML = `<p class="state-message">${STRINGS.loading}</p>`;

  try {
    const response = await fetch("index.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    const schoolMetadata = payload.schoolMetadata && typeof payload.schoolMetadata === "object" ? payload.schoolMetadata : {};
    const subjectMetadata = payload.subjectMetadata && typeof payload.subjectMetadata === "object" ? payload.subjectMetadata : {};
    const stats = payload.stats && typeof payload.stats === "object" ? payload.stats : {};
    
    renderApp(items, schoolMetadata, subjectMetadata, stats);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="state-message error">${STRINGS.error}</p>`;
  }
}

/** Initializes header, scroll behavior, loads the exam index, and sets up modal listeners. */
export async function init() {
  updateHeaderText();
  setupPdfViewerModal();
  setupHashRouting();
  await loadIndex();
}

// Kick off initialization
init();
