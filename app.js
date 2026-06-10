const STRINGS = {
  eyebrow: "Repositorio publico",
  title: "Examenes Anteriores ITCR",
  loading: "Cargando examenes...",
  empty: "Aun no hay PDFs. Agrega archivos en exams/<materia>/ usando el formato PX_XS_XXXX_E.pdf o RP_XS_XXXX_E.pdf",
  error: "No se pudo cargar el indice. Revisa index.json o el flujo de GitHub Actions.",
  year: "Año",
  semester: "Semestre"
};

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

function updateHeaderText() {
  document.getElementById("eyebrow").textContent = STRINGS.eyebrow;
  document.getElementById("title").textContent = STRINGS.title;
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

function groupedIndex(items) {
  const root = new Map();

  for (const item of items) {
    if (!root.has(item.subject)) {
      root.set(item.subject, new Map());
    }

    const yearMap = root.get(item.subject);
    if (!yearMap.has(item.year)) {
      yearMap.set(item.year, new Map());
    }

    const semesterMap = yearMap.get(item.year);
    if (!semesterMap.has(item.semester)) {
      semesterMap.set(item.semester, new Map());
    }

    const parcialMap = semesterMap.get(item.semester);
    if (!parcialMap.has(item.parcial)) {
      parcialMap.set(item.parcial, { enunciado: null, solution: null });
    }

    parcialMap.get(item.parcial)[item.kind] = item;
  }

  return root;
}

function renderItems(items) {
  const container = document.getElementById("content");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `<p class="state-message">${STRINGS.empty}</p>`;
    return;
  }

  const subjectTemplate = document.getElementById("subject-template");
  const semesterTemplate = document.getElementById("semester-template");
  const parcialTemplate = document.getElementById("parcial-template");
  const examTemplate = document.getElementById("type-template");

  const structure = groupedIndex(items);

  for (const [subject, years] of structure) {
    const subjectNode = subjectTemplate.content.firstElementChild.cloneNode(true);
    subjectNode.querySelector(".subject-title").textContent = normalizeText(subject);
    const subjectBody = subjectNode.querySelector(".subject-body");

    const sortedYears = [...years.keys()].sort((a, b) => a.localeCompare(b));

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

        const sortedParciales = [...parciales.keys()].sort(parcialSort);
        for (const parcial of sortedParciales) {
          const docs = parciales.get(parcial);
          const examNode = examTemplate.content.firstElementChild.cloneNode(true);
          examNode.querySelector(".type-title").textContent = parcialLabel(parcial);

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
          solucionBtn.textContent = "Solucion";
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

      subjectBody.appendChild(yearNode);
    }

    container.appendChild(subjectNode);
  }
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
    renderItems(items);
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
