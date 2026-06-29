/**
 * @file Constants and JSDoc types for the exam archive site.
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
 * @property {string|null} variation - Optional variation code (e.g. V2)
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
 * @property {Object} stats - Precomputed statistics
 * @property {string} stats.schools - Number of schools
 * @property {string} stats.subjects - Number of subjects
 * @property {string} stats.exams - Number of exams
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
export const STRINGS = {
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
export const HOME_TAB_KEY = "__home__";

/** Numeric sort order for semester codes. */
export const SEMESTER_ORDER = { IS: 1, IIS: 2 };

/** Short display labels for semester codes. */
export const SEMESTER_LABELS = { IS: "I", IIS: "II" };

/** Display labels for known parcial codes. */
export const PARCIAL_LABELS = {
  P1: "Primer Parcial",
  P2: "Segundo Parcial",
  P3: "Tercer Parcial",
  P4: "Cuarto Parcial",
  P5: "Quinto Parcial",
  RP: "Reposicion"
};
