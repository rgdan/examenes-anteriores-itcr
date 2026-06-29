import { HOME_TAB_KEY } from "./constants.js";
import { appState } from "./state.js";
import { renderSchoolTabs, renderSchoolContent } from "./render-school.js";

/**
 * Parses the current URL hash into { school, subject }.
 * Expected formats: #/, #/<school>, #/<school>/<subject>
 *
 * @returns {{ school: string, subject: string }}
 */
export function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "").trim();
  if (!raw) {
    return { school: HOME_TAB_KEY, subject: "" };
  }
  const parts = raw.split("/").map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  return { school: parts[0] || HOME_TAB_KEY, subject: parts[1] || "" };
}

/**
 * Builds a hash fragment string for the given school and optional subject.
 *
 * @param {string} school
 * @param {string} [subject]
 * @returns {string}
 */
export function buildHash(school, subject = "") {
  if (!school || school === HOME_TAB_KEY) {
    return "#/";
  }
  if (subject) {
    return `#/${encodeURIComponent(school)}/${encodeURIComponent(subject)}`;
  }
  return `#/${encodeURIComponent(school)}`;
}

/**
 * Navigates to a school (and optional subject) by setting location.hash,
 * which fires hashchange and triggers a full re-render via handleHashChange.
 *
 * @param {string} school
 * @param {string} [subject]
 */
export function navigateTo(school, subject = "") {
  location.hash = buildHash(school, subject);
}

/**
 * Silently updates the URL hash (e.g. on subject <details> toggle)
 * using replaceState so no hashchange event fires and no re-render occurs.
 *
 * @param {string} school
 * @param {string} [subject]
 */
export function replaceHash(school, subject = "") {
  history.replaceState(null, "", buildHash(school, subject));
}

/**
 * Handles hashchange events (browser back/forward or direct URL changes)
 * by re-rendering to match the new hash.
 */
export function handleHashChange() {
  const { school, subject } = parseHash();
  const validSchool =
    school === HOME_TAB_KEY || appState.schools.includes(school) ? school : HOME_TAB_KEY;

  appState.currentSchool = validSchool;
  appState.pendingOpenSubject = subject;
  renderSchoolTabs();
  renderSchoolContent();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Registers the hashchange listener for back/forward navigation support. */
export function setupHashRouting() {
  window.addEventListener("hashchange", handleHashChange);
}
