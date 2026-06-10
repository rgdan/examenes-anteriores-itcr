const STRINGS = {
  eyebrow: "Repositorio publico",
  title: "Examenes Anteriores ITCR",
  loading: "Cargando examenes...",
  empty: "Aun no hay PDFs. Agrega archivos en exams/<materia>/ usando el formato PX_XS_XXXX_E.pdf",
  error: "No se pudo cargar el indice. Revisa index.json o el flujo de GitHub Actions.",
  year: "Año",
  semester: "Semestre",
  parcial: "Parcial"
};

const TYPE_LABELS = {
  enunciado: "Enunciado",
  solution: "Solucion"
};

function normalizeText(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getTypeLabel(type) {
  const key = type.toLowerCase();
  if (TYPE_LABELS[key]) {
    return TYPE_LABELS[key];
  }
  return normalizeText(type);
}

function updateHeaderText() {
  document.getElementById("eyebrow").textContent = STRINGS.eyebrow;
  document.getElementById("title").textContent = STRINGS.title;
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
      parcialMap.set(item.parcial, new Map());
    }

    const typeMap = parcialMap.get(item.parcial);
    if (!typeMap.has(item.kind)) {
      typeMap.set(item.kind, []);
    }

    typeMap.get(item.kind).push(item);
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
  const typeTemplate = document.getElementById("type-template");

  const structure = groupedIndex(items);

  for (const [subject, years] of structure) {
    const subjectNode = subjectTemplate.content.firstElementChild.cloneNode(true);
    subjectNode.querySelector(".subject-title").textContent = normalizeText(subject);
    const subjectBody = subjectNode.querySelector(".subject-body");

    for (const [year, semesters] of years) {
      const yearNode = semesterTemplate.content.firstElementChild.cloneNode(true);
      yearNode.querySelector(".semester-title").textContent = `${STRINGS.year}: ${year}`;
      const yearBody = yearNode.querySelector(".semester-body");

      for (const [semester, parciales] of semesters) {
        const semesterNode = parcialTemplate.content.firstElementChild.cloneNode(true);
        semesterNode.querySelector(".parcial-title").textContent = `${STRINGS.semester}: ${semester}`;
        const semesterBody = semesterNode.querySelector(".parcial-body");

        for (const [parcial, types] of parciales) {
          const parcialNode = typeTemplate.content.firstElementChild.cloneNode(true);
          parcialNode.querySelector(".type-title").textContent = `${STRINGS.parcial}: ${parcial}`;
          const parcialBody = parcialNode.querySelector(".file-list");

          for (const [type, files] of types) {
            for (const file of files) {
              const li = document.createElement("li");
              li.className = "file-item";

              const icon = document.createElement("span");
              icon.className = "file-icon";
              icon.setAttribute("aria-hidden", "true");

              const a = document.createElement("a");
              a.className = "file-link";
              a.href = encodeURI(file.path);
              a.target = "_blank";
              a.rel = "noopener noreferrer";
              a.textContent = `${file.fileName}`;

              const meta = document.createElement("span");
              meta.className = "file-meta";
              meta.textContent = getTypeLabel(type);

              li.appendChild(icon);
              li.appendChild(a);
              li.appendChild(meta);
              parcialBody.appendChild(li);
            }
          }

          semesterBody.appendChild(parcialNode);
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
  await loadIndex();
}

init();
