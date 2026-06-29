import { STRINGS, HOME_TAB_KEY } from "./constants.js";
import { appState } from "./state.js";
import {
  schoolLabel,
  subjectLabel,
  subjectCourseCode,
  professorLabel,
  semesterSort,
  semesterLabel
} from "./utils.js";
import { parcialGroupSort } from "./grouping.js";
import { isMobileDevice, openPdfViewer } from "./pdf-viewer.js";
import { replaceHash, navigateTo } from "./router.js";
import { renderHomeContent } from "./render-home.js";

/**
 * Renders year/semester/parcial blocks into parentNode by cloning HTML templates.
 * Builds enunciado and solución links when available, or disabled spans otherwise.
 *
 * @param {Map<string, Map<string, Map>>} years - Year → semester → parcialGroup map
 * @param {HTMLElement} parentNode
 * @param {HTMLTemplateElement} semesterTemplate
 * @param {HTMLTemplateElement} parcialTemplate
 * @param {HTMLTemplateElement} examTemplate
 */
export function renderYearBlocks(years, parentNode, semesterTemplate, parcialTemplate, examTemplate) {
  const sortedYears = [...years.keys()].sort((a, b) => b.localeCompare(a));

  for (const year of sortedYears) {
    const semesters = years.get(year);
    const yearNode = semesterTemplate.content.firstElementChild.cloneNode(true);
    yearNode.querySelector(".semester-title").textContent = `${STRINGS.year} ${year}`;
    const yearBody = yearNode.querySelector(".semester-body");

    const sortedSemesters = [...semesters.keys()].sort(semesterSort);
    for (const semester of sortedSemesters) {
      const parciales = semesters.get(semester);
      const semesterNode = parcialTemplate.content.firstElementChild.cloneNode(true);
      semesterNode.querySelector(".parcial-title").textContent = `${STRINGS.semester} ${semesterLabel(semester)}`;
      const semesterBody = semesterNode.querySelector(".parcial-body");

      const sortedParciales = [...parciales.values()].sort(parcialGroupSort);
      for (const parcial of sortedParciales) {
        const docs = parcial.docs;
        const examNode = examTemplate.content.firstElementChild.cloneNode(true);
        examNode.querySelector(".type-title").textContent = parcial.label;

        const actions = examNode.querySelector(".file-list");

        const enunciadoBtn = document.createElement(docs.enunciado ? "a" : "span");
        enunciadoBtn.className = `doc-btn${docs.enunciado ? "" : " disabled"}`;
        enunciadoBtn.textContent = "Enunciado";
        if (docs.enunciado) {
          enunciadoBtn.href = encodeURI(docs.enunciado.path);
          enunciadoBtn.target = "_blank";
          enunciadoBtn.rel = "noopener noreferrer";
          enunciadoBtn.addEventListener("click", (e) => {
            if (isMobileDevice()) {
              return;
            }
            e.preventDefault();
            openPdfViewer(docs.enunciado);
          });
        }

        const solucionBtn = document.createElement(docs.solution ? "a" : "span");
        solucionBtn.className = `doc-btn${docs.solution ? "" : " disabled"}`;
        solucionBtn.textContent = "Solución";
        if (docs.solution) {
          solucionBtn.href = encodeURI(docs.solution.path);
          solucionBtn.target = "_blank";
          solucionBtn.rel = "noopener noreferrer";
          solucionBtn.addEventListener("click", (e) => {
            if (isMobileDevice()) {
              return;
            }
            e.preventDefault();
            openPdfViewer(docs.solution);
          });
        }

        actions.appendChild(enunciadoBtn);
        actions.appendChild(solucionBtn);
        semesterBody.appendChild(examNode);
      }

      yearBody.appendChild(semesterNode);
    }

    parentNode.appendChild(yearNode);
  }
}

/** Rebuilds school tab buttons in #school-tabs, including the home tab. */
export function renderSchoolTabs() {
  const tabsContainer = document.getElementById("school-tabs");
  tabsContainer.innerHTML = "";
  tabsContainer.hidden = false;

  const homeTab = document.createElement("button");
  homeTab.type = "button";
  homeTab.className = `school-tab${appState.currentSchool === HOME_TAB_KEY ? " active" : ""}`;
  homeTab.textContent = STRINGS.homeTab;
  homeTab.setAttribute("role", "tab");
  homeTab.setAttribute("aria-selected", String(appState.currentSchool === HOME_TAB_KEY));
  homeTab.addEventListener("click", () => {
    if (appState.currentSchool === HOME_TAB_KEY) {
      return;
    }
    navigateTo(HOME_TAB_KEY);
  });
  tabsContainer.appendChild(homeTab);

  for (const school of appState.schools) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `school-tab${school === appState.currentSchool ? " active" : ""}`;
    tab.textContent = schoolLabel(school);
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(school === appState.currentSchool));
    tab.addEventListener("click", () => {
      if (appState.currentSchool === school) {
        return;
      }
      navigateTo(school);
    });
    tabsContainer.appendChild(tab);
  }
}

/** Renders home or school exam tree into #content based on currentSchool. */
export function renderSchoolContent() {
  const container = document.getElementById("content");
  container.innerHTML = "";

  if (appState.currentSchool === HOME_TAB_KEY) {
    renderHomeContent(container);
    return;
  }

  if (!appState.currentSchool) {
    container.innerHTML = `<p class="state-message">${STRINGS.empty}</p>`;
    return;
  }

  const subjects = appState.structure.get(appState.currentSchool);
  const currentSchoolMetadata = appState.schoolMetadata.get(appState.currentSchool);

  if (!subjects || !subjects.size) {
    container.innerHTML = `<p class="state-message">${STRINGS.empty}</p>`;
    return;
  }

  if (currentSchoolMetadata && currentSchoolMetadata.informationBlurb.trim()) {
    const blurb = document.createElement("section");
    blurb.className = "school-blurb";
    blurb.textContent = currentSchoolMetadata.informationBlurb.trim();
    container.appendChild(blurb);
  }

  const subjectTemplate = document.getElementById("subject-template");
  const professorTemplate = document.getElementById("professor-template");
  const semesterTemplate = document.getElementById("semester-template");
  const parcialTemplate = document.getElementById("parcial-template");
  const examTemplate = document.getElementById("type-template");

  const sortedSubjects = [...subjects.entries()].sort((a, b) => {
    return subjectLabel(appState.currentSchool, a[0]).localeCompare(subjectLabel(appState.currentSchool, b[0]), "es", {
      sensitivity: "base"
    });
  });

  const subjectToOpen = appState.pendingOpenSubject;
  let openedFromSearch = false;

  for (const [subject, subjectEntry] of sortedSubjects) {
    const subjectNode = subjectTemplate.content.firstElementChild.cloneNode(true);
    if (!openedFromSearch && subjectToOpen && subject === subjectToOpen) {
      subjectNode.open = true;
      openedFromSearch = true;
    }

    const subjectTitle = subjectNode.querySelector(".subject-title");
    const name = document.createElement("span");
    name.className = "subject-name";
    name.textContent = subjectLabel(appState.currentSchool, subject);

    subjectTitle.textContent = "";
    subjectTitle.appendChild(name);

    const courseCode = subjectCourseCode(appState.currentSchool, subject);
    if (courseCode) {
      const code = document.createElement("span");
      code.className = "subject-course-code";
      code.textContent = courseCode;
      subjectTitle.appendChild(code);
    }

    const subjectBody = subjectNode.querySelector(".subject-body");

    if (subjectEntry.isCatedrado) {
      const catedraYears = subjectEntry.professors.get("__catedra__") || new Map();
      renderYearBlocks(catedraYears, subjectBody, semesterTemplate, parcialTemplate, examTemplate);
    } else {
      const sortedProfessors = [...subjectEntry.professors.entries()].sort((a, b) => {
        return professorLabel(a[0]).localeCompare(professorLabel(b[0]), "es", { sensitivity: "base" });
      });

      for (const [professor, years] of sortedProfessors) {
        const professorNode = professorTemplate.content.firstElementChild.cloneNode(true);
        if (subjectToOpen && subject === subjectToOpen) {
          professorNode.open = true;
        }

        professorNode.querySelector(".professor-title").textContent = professorLabel(professor);
        const professorBody = professorNode.querySelector(".professor-body");
        renderYearBlocks(years, professorBody, semesterTemplate, parcialTemplate, examTemplate);
        subjectBody.appendChild(professorNode);
      }
    }

    subjectNode.addEventListener("toggle", () => {
      if (subjectNode.open) {
        replaceHash(appState.currentSchool, subject);
      } else {
        replaceHash(appState.currentSchool, "");
      }
    });

    container.appendChild(subjectNode);
  }

  if (openedFromSearch) {
    appState.pendingOpenSubject = "";
  }
}
