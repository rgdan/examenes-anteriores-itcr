/**
 * @file Browser entry point for the exam archive site.
 * Fetches index.json, groups exams into a nested structure, and renders home and school views.
 */

/**
 * @typedef {"enunciado" | "solution"} ExamKind
 */

/**
 * @typedef {"regular" | "extraordinario" | "suficiencia"} ExamVariant
 */

/**
 * @typedef {"IS" | "IIS"} SemesterCode
 */

/**
 * @typedef {Object} ExamItem
 * @property {string} path - Public URL to the PDF
 * @property {string} school - School folder slug
 * @property {string} subject - Subject folder slug
 * @property {string|null} professor - Professor folder slug, or null for catedrado subjects
 * @property {string} year - Four-digit year
 * @property {SemesterCode} semester
 * @property {string} parcial - Parcial code (e.g. P1, RP, S)
 * @property {ExamKind} kind
 * @property {string} kindCode - E for enunciado, S for solution
 * @property {ExamVariant} variant
 * @property {string|null} variantCode - E when extraordinario, otherwise null
 * @property {string} fileName
 * @property {string} title - Human-readable title derived from the filename
 */

/**
 * @typedef {Object} SchoolMetadata
 * @property {string} properSpelling - Display name for the school
 * @property {string} informationBlurb - Optional info shown on the school tab
 */

/**
 * @typedef {Object} SubjectMetadata
 * @property {string} properSpelling - Display name for the subject
 * @property {string} courseCode - Official course code (e.g. MA1102)
 * @property {number} creditAmount
 * @property {boolean} EsCatedrado - When true, exams are not grouped by professor
 */

/**
 * @typedef {Object} IndexPayload
 * @property {string} generatedAt - ISO timestamp
 * @property {number} total - Number of indexed PDFs
 * @property {Object.<string, SchoolMetadata>} schoolMetadata
 * @property {Object.<string, SubjectMetadata>} subjectMetadata - Keys are "school/subject"
 * @property {ExamItem[]} items
 */

/**
 * @typedef {Object} ParcialGroup
 * @property {string} key - Unique group key within a semester
 * @property {string} label - Display label for the exam group
 * @property {number} rank - Sort rank: 0 regular, 1 extraordinario, 2 suficiencia
 * @property {string} baseParcial - Underlying parcial code used for sorting within rank
 */

/**
 * @typedef {Object} ParcialDocs
 * @property {ExamItem|null} enunciado
 * @property {ExamItem|null} solution
 */

/**
 * @typedef {Object} HomeSearchRow
 * @property {"subject"} kind
 * @property {string} school
 * @property {string} subject
 * @property {string} title - Display title
 * @property {string} subtitle - School name and optional course code
 * @property {string} searchText - Concatenated text used for accent-insensitive search
 */

/**
 * @typedef {Object} AppState
 * @property {Map<string, Map<string, { isCatedrado: boolean, professors: Map }>>} structure - Grouped exam tree
 * @property {Map<string, SchoolMetadata>} schoolMetadata
 * @property {Map<string, SubjectMetadata>} subjectMetadata - Keys are "school/subject"
 * @property {string[]} schools - Sorted school slugs
 * @property {string} currentSchool - Active tab: HOME_TAB_KEY or a school slug
 * @property {string} pendingOpenSubject - Subject slug to auto-expand after home search navigation
 */

/** UI copy strings for static text and state messages. */
const STRINGS = {
  eyebrow: "Repositorio publico",
  title: "Exámenes Anteriores ITCR",
  homeTab: "Inicio",
  loading: "Cargando examenes...",
  empty: "Aun no hay PDFs. Agrega archivos en el repo de archivos (examenes-anteriores-itcr-archivos) usando la estructura <escuela>/<materia>/ y nombres PX_XS_XXXX_E.pdf, RP_XS_XXXX_E.pdf o S_XS_XXXX_E.pdf",
  error: "No se pudo cargar el indice. Revisa index.json o el flujo de GitHub Actions.",
  professor: "Profesor",
  year: "Año",
  semester: "Semestre",
  homeTitle: "Bienvenido",
  homeText: "Este repositorio reune examenes anteriores compartidos por estudiantes. Selecciona una escuela en las pestañas para ver las materias y sus examenes.",
  homeDisclaimer: "Es importante señalar que el contenido de exámenes previos no necesariamente refleja la distribución de temas del examen actual.",
  homeSearchTitle: "Buscar",
  homeSearchPlaceholder: "Buscar por materia o codigo de curso",
  homeSearchHint: "Escribe para encontrar materias.",
  homeSearchEmpty: "No hay resultados para esa busqueda.",
  homeResultSubject: "Materia",
  homeOpen: "Abrir"
};

/** Sentinel value for the home tab in school navigation. */
const HOME_TAB_KEY = "__home__";

/** Numeric sort order for semester codes. */
const SEMESTER_ORDER = { IS: 1, IIS: 2 };
/** Short display labels for semester codes. */
const SEMESTER_LABELS = { IS: "I", IIS: "II" };
/** Display labels for known parcial codes. */
const PARCIAL_LABELS = {
  P1: "Primer Parcial",
  P2: "Segundo Parcial",
  P3: "Tercer Parcial",
  P4: "Cuarto Parcial",
  P5: "Quinto Parcial",
  RP: "Reposicion"
};

/** Converts slug-like text to title case with spaces. */
function normalizeText(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

/** Lowercases text and strips accents for case-insensitive search. */
function foldText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Builds the subject metadata lookup key. */
function subjectKey(school, subject) {
  return `${school}/${subject}`;
}

/** Populates the static header elements from STRINGS. */
function updateHeaderText() {
  document.getElementById("eyebrow").textContent = STRINGS.eyebrow;
  document.getElementById("title").textContent = STRINGS.title;
}

/** Returns the display name for a school, falling back to normalized slug. */
function schoolLabel(code) {
  const metadata = appState.schoolMetadata.get(code);
  if (metadata && metadata.properSpelling) {
    return metadata.properSpelling;
  }
  return normalizeText(code);
}

/** Returns the display name for a subject, falling back to normalized slug. */
function subjectLabel(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  if (metadata && metadata.properSpelling) {
    return metadata.properSpelling;
  }
  return normalizeText(subject);
}

/** Returns the course code for a subject, or an empty string. */
function subjectCourseCode(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  if (!metadata) {
    return "";
  }

  return metadata.courseCode ? metadata.courseCode : "";
}

/** Returns whether a subject is taught as catedrado (defaults to true). */
function subjectIsCatedrado(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  return metadata ? metadata.EsCatedrado !== false : true;
}

/** Returns the display name for a professor slug. */
function professorLabel(code) {
  return normalizeText(code);
}



/** Compares semester codes (IS before IIS). */
function semesterSort(a, b) {
  return (SEMESTER_ORDER[a] || 99) - (SEMESTER_ORDER[b] || 99) || a.localeCompare(b);
}

/** Compares parcial codes numerically; RP sorts last. */
function parcialSort(a, b) {
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
function parcialLabel(code) {
  if (PARCIAL_LABELS[code]) {
    return PARCIAL_LABELS[code];
  }
  if (/^P[0-9]+$/.test(code)) {
    return `Parcial ${code.slice(1)}`;
  }
  return normalizeText(code);
}

/** Returns a short display label for a semester code. */
function semesterLabel(code) {
  if (SEMESTER_LABELS[code]) {
    return SEMESTER_LABELS[code];
  }
  return code;
}

/**
 * Maps an exam item to a UI parcial group based on its variant.
 * Regular exams use NORMAL_* keys; extraordinario prefixes the label; suficiencia gets rank 2.
 *
 * @param {ExamItem} item
 * @returns {ParcialGroup}
 */
function parcialGroupFromItem(item) {
  if (item.variant === "suficiencia") {
    return {
      key: "SUFICIENCIA",
      label: "Suficiencia",
      rank: 2,
      baseParcial: ""
    };
  }

  if (item.variant === "extraordinario") {
    return {
      key: `EXTRA_${item.parcial}`,
      label: `[Extraordinario] ${parcialLabel(item.parcial)}`,
      rank: 1,
      baseParcial: item.parcial
    };
  }

  return {
    key: `NORMAL_${item.parcial}`,
    label: parcialLabel(item.parcial),
    rank: 0,
    baseParcial: item.parcial
  };
}

/**
 * Sorts parcial groups: regular first, then extraordinario, then suficiencia; within rank by parcial number.
 *
 * @param {ParcialGroup} a
 * @param {ParcialGroup} b
 * @returns {number}
 */
function parcialGroupSort(a, b) {
  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }

  if (a.rank === 2) {
    return a.label.localeCompare(b.label);
  }

  return parcialSort(a.baseParcial, b.baseParcial);
}

/**
 * Builds a nested Map hierarchy from flat exam items.
 *
 * Structure: school → subject → professor → year → semester → parcialGroup → docs.
 * Catedrado subjects collapse all professors under the "__catedra__" key.
 *
 * @param {ExamItem[]} items
 * @param {Map<string, SubjectMetadata>} subjectMetadata
 * @returns {Map<string, Map<string, { isCatedrado: boolean, professors: Map }>>}
 */
function groupedIndex(items, subjectMetadata) {
  const root = new Map();

  for (const item of items) {
    if (!root.has(item.school)) {
      root.set(item.school, new Map());
    }

    const schoolMap = root.get(item.school);
    if (!schoolMap.has(item.subject)) {
      const metadata = subjectMetadata.get(subjectKey(item.school, item.subject));
      schoolMap.set(item.subject, {
        isCatedrado: metadata ? metadata.EsCatedrado !== false : true,
        professors: new Map()
      });
    }

    const subjectEntry = schoolMap.get(item.subject);
    const professorKey = subjectEntry.isCatedrado ? "__catedra__" : item.professor;

    if (!subjectEntry.professors.has(professorKey)) {
      subjectEntry.professors.set(professorKey, new Map());
    }

    const yearMap = subjectEntry.professors.get(professorKey);
    if (!yearMap.has(item.year)) {
      yearMap.set(item.year, new Map());
    }

    const semesterMap = yearMap.get(item.year);
    if (!semesterMap.has(item.semester)) {
      semesterMap.set(item.semester, new Map());
    }

    const parcialMap = semesterMap.get(item.semester);
    const parcialGroup = parcialGroupFromItem(item);

    if (!parcialMap.has(parcialGroup.key)) {
      parcialMap.set(parcialGroup.key, {
        ...parcialGroup,
        docs: { enunciado: null, solution: null }
      });
    }

    parcialMap.get(parcialGroup.key).docs[item.kind] = item;
  }

  return root;
}

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
function renderYearBlocks(years, parentNode, semesterTemplate, parcialTemplate, examTemplate) {
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

/**
 * Global UI state. Populated by renderApp() after index.json loads; read by all render functions.
 *
 * @type {AppState}
 */
const appState = {
  structure: new Map(),
  schoolMetadata: new Map(),
  subjectMetadata: new Map(),
  schools: [],
  currentSchool: HOME_TAB_KEY,
  pendingOpenSubject: ""
};

/** Counts schools, subjects, and PDFs from the current grouped structure. */
function homeStats() {
  const schoolCount = appState.schools.length;
  let subjectCount = 0;
  let examCount = 0;

  for (const subjects of appState.structure.values()) {
    subjectCount += subjects.size;

    for (const subjectEntry of subjects.values()) {
      for (const years of subjectEntry.professors.values()) {
        for (const semesters of years.values()) {
          for (const parciales of semesters.values()) {
            for (const parcial of parciales.values()) {
              if (parcial.docs.enunciado) {
                examCount += 1;
              }
              if (parcial.docs.solution) {
                examCount += 1;
              }
            }
          }
        }
      }
    }
  }

  return { schoolCount, subjectCount, examCount };
}

/**
 * Flattens all subjects into searchable rows with accent-folded searchText.
 *
 * @returns {HomeSearchRow[]}
 */
function buildHomeSearchIndex() {
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
function renderHomeSearchResults(resultList, query) {
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

/**
 * Rendering pipeline: renderApp → renderSchoolTabs + renderSchoolContent.
 * Home view targets #content; school tabs target #school-tabs.
 * School content clones templates from index.html (#subject-template, #professor-template, etc.).
 */

/** Renders the home view (hero, search, stats) into #content. */
function renderHomeContent(container) {
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

  const stats = homeStats();
  const statsCard = document.createElement("article");
  statsCard.className = "home-card home-stats";
  statsCard.innerHTML = `
    <p class="home-stat"><strong>${stats.schoolCount}</strong> escuelas</p>
    <p class="home-stat"><strong>${stats.subjectCount}</strong> materias</p>
    <p class="home-stat"><strong>${stats.examCount}</strong> PDFs</p>
  `;
  wrapper.appendChild(statsCard);

  container.appendChild(wrapper);
}

/** Rebuilds school tab buttons in #school-tabs, including the home tab. */
function renderSchoolTabs() {
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
function renderSchoolContent() {
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

/**
 * Rebuilds app state from an index payload and re-renders tabs and content.
 * Resets currentSchool to home if the previously selected school no longer exists.
 *
 * @param {ExamItem[]} items
 * @param {Object.<string, SchoolMetadata>} schoolMetadata
 * @param {Object.<string, SubjectMetadata>} subjectMetadata
 */
function renderApp(items, schoolMetadata, subjectMetadata) {
  appState.schoolMetadata = new Map(Object.entries(schoolMetadata));
  appState.subjectMetadata = new Map(Object.entries(subjectMetadata));
  appState.structure = groupedIndex(items, appState.subjectMetadata);
  appState.schools = [...appState.structure.keys()].sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b)));

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
async function loadIndex() {
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
    renderApp(items, schoolMetadata, subjectMetadata);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="state-message error">${STRINGS.error}</p>`;
  }
}

/**
 * Detects if the user is browsing from a mobile or tablet device.
 *
 * @returns {boolean}
 */
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && /Macintosh/i.test(navigator.userAgent))
  );
}

/**
 * Opens the PDF viewer modal and loads the given PDF item.
 *
 * @param {ExamItem} item
 */
function openPdfViewer(item) {
  const modal = document.getElementById("pdf-viewer-modal");
  const titleEl = document.getElementById("pdf-modal-title");
  const iframe = document.getElementById("pdf-modal-iframe");
  const loader = document.getElementById("pdf-modal-loader");
  const downloadBtn = document.getElementById("pdf-modal-download");

  const subjectName = subjectLabel(item.school, item.subject);
  const profName = item.professor ? professorLabel(item.professor) : "Cátedra";
  const kindLabel = item.kind === "enunciado" ? "Enunciado" : "Solución";
  const displayTitle = `${subjectName} (${profName}) - ${parcialLabel(item.parcial)} ${item.year} - ${kindLabel}`;

  titleEl.textContent = displayTitle;
  titleEl.title = displayTitle;

  loader.style.display = "flex";
  const encodedPath = encodeURI(item.path);
  iframe.src = encodedPath;

  if (downloadBtn) {
    downloadBtn.href = encodedPath;
  }

  iframe.onload = () => {
    loader.style.display = "none";
  };

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

/**
 * Closes the PDF viewer modal and clears the iframe source.
 */
function closePdfViewer() {
  const modal = document.getElementById("pdf-viewer-modal");
  const iframe = document.getElementById("pdf-modal-iframe");
  const downloadBtn = document.getElementById("pdf-modal-download");

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  iframe.src = "";
  if (downloadBtn) {
    downloadBtn.href = "";
  }
}

/** Sets up the event listeners for the PDF viewer modal. */
function setupPdfViewerModal() {
  const closeBtn = document.getElementById("pdf-modal-close");
  const modal = document.getElementById("pdf-viewer-modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", closePdfViewer);
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closePdfViewer();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && modal.classList.contains("active")) {
      closePdfViewer();
    }
  });
}

// ---------------------------------------------------------------------------
// Hash routing
// ---------------------------------------------------------------------------

/**
 * Parses the current URL hash into { school, subject }.
 * Expected formats: #/, #/<school>, #/<school>/<subject>
 *
 * @returns {{ school: string, subject: string }}
 */
function parseHash() {
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
function buildHash(school, subject = "") {
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
function navigateTo(school, subject = "") {
  location.hash = buildHash(school, subject);
}

/**
 * Silently updates the URL hash (e.g. on subject <details> toggle)
 * using replaceState so no hashchange event fires and no re-render occurs.
 *
 * @param {string} school
 * @param {string} [subject]
 */
function replaceHash(school, subject = "") {
  history.replaceState(null, "", buildHash(school, subject));
}

/**
 * Handles hashchange events (browser back/forward or direct URL changes)
 * by re-rendering to match the new hash.
 */
function handleHashChange() {
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
function setupHashRouting() {
  window.addEventListener("hashchange", handleHashChange);
}

/** Initializes header, scroll behavior, loads the exam index, and sets up modal listeners. */
async function init() {
  updateHeaderText();
  setupPdfViewerModal();
  setupHashRouting();
  await loadIndex();
}

init();
