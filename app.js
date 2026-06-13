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

const HOME_TAB_KEY = "__home__";

const SEMESTER_ORDER = { IS: 1, IIS: 2 };
const SEMESTER_LABELS = { IS: "I", IIS: "II" };
const PARCIAL_LABELS = {
  P1: "Primer Parcial",
  P2: "Segundo Parcial",
  P3: "Tercer Parcial",
  P4: "Cuarto Parcial",
  P5: "Quinto Parcial",
  RP: "Reposicion"
};

function normalizeText(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function foldText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function subjectKey(school, subject) {
  return `${school}/${subject}`;
}

function updateHeaderText() {
  document.getElementById("eyebrow").textContent = STRINGS.eyebrow;
  document.getElementById("title").textContent = STRINGS.title;
}

function schoolLabel(code) {
  const metadata = appState.schoolMetadata.get(code);
  if (metadata && metadata.properSpelling) {
    return metadata.properSpelling;
  }
  return normalizeText(code);
}

function subjectLabel(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  if (metadata && metadata.properSpelling) {
    return metadata.properSpelling;
  }
  return normalizeText(subject);
}

function subjectCourseCode(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  if (!metadata) {
    return "";
  }

  return metadata.courseCode ? metadata.courseCode : "";
}

function subjectIsCatedrado(school, subject) {
  const metadata = appState.subjectMetadata.get(subjectKey(school, subject));
  return metadata ? metadata.EsCatedrado !== false : true;
}

function professorLabel(code) {
  return normalizeText(code);
}

function setupScrollState() {
  const onScroll = () => {
    document.body.classList.toggle("scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function semesterSort(a, b) {
  return (SEMESTER_ORDER[a] || 99) - (SEMESTER_ORDER[b] || 99) || a.localeCompare(b);
}

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

function parcialLabel(code) {
  if (PARCIAL_LABELS[code]) {
    return PARCIAL_LABELS[code];
  }
  if (/^P[0-9]+$/.test(code)) {
    return `Parcial ${code.slice(1)}`;
  }
  return normalizeText(code);
}

function semesterLabel(code) {
  if (SEMESTER_LABELS[code]) {
    return SEMESTER_LABELS[code];
  }
  return code;
}

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

function parcialGroupSort(a, b) {
  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }

  if (a.rank === 2) {
    return a.label.localeCompare(b.label);
  }

  return parcialSort(a.baseParcial, b.baseParcial);
}

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
        }

        const solucionBtn = document.createElement(docs.solution ? "a" : "span");
        solucionBtn.className = `doc-btn${docs.solution ? "" : " disabled"}`;
        solucionBtn.textContent = "Solución";
        if (docs.solution) {
          solucionBtn.href = encodeURI(docs.solution.path);
          solucionBtn.target = "_blank";
          solucionBtn.rel = "noopener noreferrer";
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

const appState = {
  structure: new Map(),
  schoolMetadata: new Map(),
  subjectMetadata: new Map(),
  schools: [],
  currentSchool: HOME_TAB_KEY,
  pendingOpenSubject: ""
};

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
      appState.currentSchool = item.school;
      appState.pendingOpenSubject = item.subject || "";
      renderSchoolTabs();
      renderSchoolContent();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    row.appendChild(body);
    row.appendChild(action);
    resultList.appendChild(row);
  }
}

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

    appState.currentSchool = HOME_TAB_KEY;
    renderSchoolTabs();
    renderSchoolContent();
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

      appState.currentSchool = school;
      renderSchoolTabs();
      renderSchoolContent();
    });
    tabsContainer.appendChild(tab);
  }
}

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

    container.appendChild(subjectNode);
  }

  if (openedFromSearch) {
    appState.pendingOpenSubject = "";
  }
}

function renderApp(items, schoolMetadata, subjectMetadata) {
  appState.schoolMetadata = new Map(Object.entries(schoolMetadata));
  appState.subjectMetadata = new Map(Object.entries(subjectMetadata));
  appState.structure = groupedIndex(items, appState.subjectMetadata);
  appState.schools = [...appState.structure.keys()].sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b)));
  if (appState.currentSchool !== HOME_TAB_KEY && !appState.schools.includes(appState.currentSchool)) {
    appState.currentSchool = HOME_TAB_KEY;
  }

  renderSchoolTabs();
  renderSchoolContent();
}

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

async function init() {
  updateHeaderText();
  setupScrollState();
  await loadIndex();
}

init();
