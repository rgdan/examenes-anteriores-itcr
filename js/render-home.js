import { STRINGS } from "./constants.js";
import { appState } from "./state.js";
import { schoolLabel, subjectLabel, subjectCourseCode, foldText } from "./utils.js";
import { navigateTo } from "./router.js";

/**
 * Flattens all subjects into searchable rows with accent-folded searchText.
 *
 * @returns {HomeSearchRow[]}
 */
export function buildHomeSearchIndex() {
  const rows = [];

  for (const school of appState.schools) {
    const schoolName = schoolLabel(school);

    const subjects = appState.structure.get(school);
    if (!subjects) {
      continue;
    }

    for (const subject of subjects.keys()) {
      const subjectName = subjectLabel(school, subject);
      const code = subjectCourseCode(school, subject);
      rows.push({
        kind: "subject",
        school,
        subject,
        title: subjectName,
        subtitle: code ? `${schoolName} | ${code}` : schoolName,
        searchText: `${subjectName} ${subject} ${schoolName} ${school} ${code}`
      });
    }
  }

  return rows;
}

/**
 * Renders home search results: filters by folded query, sorts, limits to 25 matches.
 * "Abrir" navigates to the school tab and sets pendingOpenSubject to auto-expand the subject.
 *
 * @param {HTMLElement} resultList
 * @param {string} query
 */
export function renderHomeSearchResults(resultList, query) {
  resultList.innerHTML = "";
  const trimmed = query.trim();

  if (!trimmed) {
    const hint = document.createElement("p");
    hint.className = "home-search-state";
    hint.textContent = STRINGS.homeSearchHint;
    resultList.appendChild(hint);
    return;
  }

  const index = buildHomeSearchIndex();
  const folded = foldText(trimmed);
  const matches = index
    .filter((row) => foldText(row.searchText).includes(folded))
    .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }))
    .slice(0, 25);

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "home-search-state";
    empty.textContent = STRINGS.homeSearchEmpty;
    resultList.appendChild(empty);
    return;
  }

  for (const item of matches) {
    const row = document.createElement("article");
    row.className = "home-search-item";

    const body = document.createElement("div");
    body.className = "home-search-item-body";

    const title = document.createElement("p");
    title.className = "home-search-item-title";
    title.textContent = item.title;

    const subtitle = document.createElement("p");
    subtitle.className = "home-search-item-subtitle";
    subtitle.textContent = item.subtitle;

    body.appendChild(title);
    body.appendChild(subtitle);

    const action = document.createElement("button");
    action.type = "button";
    action.className = "home-open-btn";
    action.textContent = STRINGS.homeOpen;
    action.addEventListener("click", () => {
      navigateTo(item.school, item.subject || "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    row.appendChild(body);
    row.appendChild(action);
    resultList.appendChild(row);
  }
}

/** Renders the home view (hero, search, stats) into #content. */
export function renderHomeContent(container) {
  container.innerHTML = "";

  const wrapper = document.createElement("section");
  wrapper.className = "home-view";

  const hero = document.createElement("article");
  hero.className = "home-card";

  const title = document.createElement("h2");
  title.className = "home-title";
  title.textContent = STRINGS.homeTitle;

  const text = document.createElement("p");
  text.className = "home-text";
  text.textContent = STRINGS.homeText;

  const disclaimer = document.createElement("p");
  disclaimer.className = "home-text home-disclaimer";
  disclaimer.textContent = STRINGS.homeDisclaimer;

  hero.appendChild(title);
  hero.appendChild(text);
  hero.appendChild(disclaimer);
  wrapper.appendChild(hero);

  const searchCard = document.createElement("article");
  searchCard.className = "home-card";

  const searchTitle = document.createElement("h3");
  searchTitle.className = "home-subtitle";
  searchTitle.textContent = STRINGS.homeSearchTitle;

  const searchInput = document.createElement("input");
  searchInput.className = "home-search-input";
  searchInput.type = "search";
  searchInput.placeholder = STRINGS.homeSearchPlaceholder;
  searchInput.autocomplete = "off";

  const resultList = document.createElement("div");
  resultList.className = "home-search-results";

  searchInput.addEventListener("input", (event) => {
    renderHomeSearchResults(resultList, event.target.value);
  });

  searchCard.appendChild(searchTitle);
  searchCard.appendChild(searchInput);
  searchCard.appendChild(resultList);
  wrapper.appendChild(searchCard);

  renderHomeSearchResults(resultList, "");

  const stats = appState.stats || { schools: 0, subjects: 0, exams: 0 };
  const statsCard = document.createElement("article");
  statsCard.className = "home-card home-stats";
  statsCard.innerHTML = `
    <p class="home-stat"><strong>${stats.schools}</strong> escuelas</p>
    <p class="home-stat"><strong>${stats.subjects}</strong> materias</p>
    <p class="home-stat"><strong>${stats.exams}</strong> PDFs</p>
  `;
  wrapper.appendChild(statsCard);

  container.appendChild(wrapper);
}
