#!/usr/bin/env node

/**
 * @file Node CLI that scans exams/, validates paths and filenames, and writes index.json.
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
 * @property {boolean} EsCatedrado - When true, exams live directly under the subject folder
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
 * @typedef {Object} ParsedFileCode
 * @property {string} parcial
 * @property {SemesterCode} semester
 * @property {string} year
 * @property {string} kindCode
 * @property {ExamKind} kind
 * @property {ExamVariant} variant
 * @property {string|null} variantCode
 */

/**
 * @typedef {Object} ReadJsonResult
 * @property {*} data - Parsed JSON value
 * @property {string} relativePath - Path relative to the repo root
 */

const fs = require("node:fs");
const path = require("node:path");

/** Repository root (parent of scripts/). */
const REPO_ROOT = path.resolve(__dirname, "..");
/** Local mirror of the exams archive synced by CI. */
const EXAMS_DIR = path.join(REPO_ROOT, "exams");
/** Relative URL prefix for PDF links in the generated index (served from the repo root at deploy time). */
const EXAMS_BASE_URL = "exams";
/** Output path for the generated index. */
const OUTPUT_FILE = path.join(REPO_ROOT, "index.json");

/** Lowercase snake_case pattern for subject folder names. */
const SUBJECT_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
/** Lowercase snake_case pattern for school folder names. */
const SCHOOL_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
/** Lowercase snake_case pattern for professor folder names. */
const PROFESSOR_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
/** Matches PX_IS_YYYY_E, RP_IS_YYYY_E, etc.; optional trailing _E marks extraordinario, and optional _V<num> marks variation. */
const REGULAR_CODE_PATTERN = /^(P([0-9]+)|RP)_(IS|IIS)_([0-9]{4})_([ES])(?:_(E))?(?:_(V[0-9]+))?$/i;
/** Matches S_IS_YYYY_E suficiencia exam filenames; optional _V<num> variation. */
const SUFICIENCIA_CODE_PATTERN = /^S_(IS|IIS)_([0-9]{4})_([ES])(?:_(V[0-9]+))?$/i;
/** Metadata filename expected in school and subject folders. */
const METADATA_FILE_NAME = "metadata.json";
/** Numeric sort order for semester codes. */
const SEMESTER_ORDER = { IS: 1, IIS: 2 };
/** Numeric sort order for exam variants. */
const VARIANT_ORDER = { regular: 0, extraordinario: 1, suficiencia: 2 };

/** In-memory cache for subject metadata loaded during indexing. */
const subjectMetadataCache = new Map();

/** Derives a display title from a PDF filename. */
function titleFromFilename(fileName) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses an exam PDF filename into structured fields.
 *
 * @param {string} fileName
 * @returns {ParsedFileCode|null} Null when the filename does not match any pattern
 */
function parseFileCode(fileName) {
  const baseName = fileName.replace(/\.pdf$/i, "");
  const suficienciaMatch = baseName.match(SUFICIENCIA_CODE_PATTERN);
  if (suficienciaMatch) {
    const semester = suficienciaMatch[1].toUpperCase();
    const year = suficienciaMatch[2];
    const kindCode = suficienciaMatch[3].toUpperCase();
    const variation = suficienciaMatch[4] ? suficienciaMatch[4].toUpperCase() : null;

    return {
      parcial: "S",
      semester,
      year,
      kindCode,
      kind: kindCode === "E" ? "enunciado" : "solution",
      variant: "suficiencia",
      variantCode: null,
      variation
    };
  }

  const match = baseName.match(REGULAR_CODE_PATTERN);

  if (!match) {
    return null;
  }

  const parcialToken = match[1].toUpperCase();
  const parcialNumber = match[2] ? Number.parseInt(match[2], 10) : null;
  const semester = match[3].toUpperCase();
  const year = match[4];
  const kindCode = match[5].toUpperCase();
  const variantCode = match[6] ? match[6].toUpperCase() : null;
  const variation = match[7] ? match[7].toUpperCase() : null;

  const parcial = parcialToken === "RP" ? "RP" : `P${parcialNumber}`;
  const variant = variantCode === "E" ? "extraordinario" : "regular";

  return {
    parcial,
    semester,
    year,
    kindCode,
    kind: kindCode === "E" ? "enunciado" : "solution",
    variant,
    variantCode,
    variation
  };
}

/** Compares exam items by variant (regular, extraordinario, suficiencia). */
function variantSort(a, b) {
  return (VARIANT_ORDER[a.variant] || 99) - (VARIANT_ORDER[b.variant] || 99) || (a.variant || "").localeCompare(b.variant || "");
}

/** Compares exam items by semester code (IS before IIS). */
function semesterSort(a, b) {
  return (SEMESTER_ORDER[a.semester] || 99) - (SEMESTER_ORDER[b.semester] || 99) || a.semester.localeCompare(b.semester);
}

/** Compares exam items by parcial code numerically; RP sorts last. */
function parcialSort(a, b) {
  if (a.parcial === "RP") {
    return 1;
  }
  if (b.parcial === "RP") {
    return -1;
  }
  const numA = Number.parseInt(a.parcial.replace("P", ""), 10);
  const numB = Number.parseInt(b.parcial.replace("P", ""), 10);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return a.parcial.localeCompare(b.parcial);
}

/** Returns a case-insensitive sorted copy of a string array. */
function sorted(array) {
  return array.slice().sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/** Converts a slug to title case with spaces. */
function titleFromSlug(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

/** Returns true for non-null, non-array objects. */
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Asserts a metadata field is a string. @throws {Error} */
function assertString(value, fieldName, relativePath) {
  if (typeof value !== "string") {
    throw new Error(`Invalid '${fieldName}' in ${relativePath}. Expected a string.`);
  }
  return value;
}

/** Asserts a metadata field is a non-empty trimmed string. @throws {Error} */
function assertNonEmptyString(value, fieldName, relativePath) {
  const stringValue = assertString(value, fieldName, relativePath).trim();
  if (!stringValue) {
    throw new Error(`Invalid '${fieldName}' in ${relativePath}. Value cannot be empty.`);
  }
  return stringValue;
}

/** Asserts a metadata field is a boolean. @throws {Error} */
function assertBoolean(value, fieldName, relativePath) {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid '${fieldName}' in ${relativePath}. Expected a boolean.`);
  }
  return value;
}

/** Asserts a metadata field is a finite number. @throws {Error} */
function assertNumber(value, fieldName, relativePath) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid '${fieldName}' in ${relativePath}. Expected a number.`);
  }
  return value;
}

/**
 * Reads and parses a JSON file synchronously.
 *
 * @param {string} absolutePath
 * @returns {ReadJsonResult}
 * @throws {Error} When the file cannot be read or contains invalid JSON
 */
function readJsonFile(absolutePath) {
  const relativePath = path.relative(REPO_ROOT, absolutePath).split(path.sep).join("/");
  let raw;

  try {
    raw = fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    throw new Error(`Could not read ${relativePath}: ${error.message}`);
  }

  try {
    return {
      data: JSON.parse(raw),
      relativePath
    };
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

/** Returns default school metadata derived from the folder slug. */
function defaultSchoolMetadata(school) {
  return {
    properSpelling: titleFromSlug(school),
    informationBlurb: ""
  };
}

/** Returns default subject metadata derived from the folder slug. */
function defaultSubjectMetadata(subject) {
  return {
    properSpelling: titleFromSlug(subject),
    courseCode: "",
    creditAmount: 0,
    EsCatedrado: true
  };
}

/**
 * Validates and normalizes school metadata.json contents.
 *
 * @param {*} data
 * @param {string} relativePath
 * @returns {SchoolMetadata}
 * @throws {Error}
 */
function validateSchoolMetadataFile(data, relativePath) {
  if (!isPlainObject(data)) {
    throw new Error(`Invalid metadata format in ${relativePath}. Expected a JSON object.`);
  }

  return {
    properSpelling: assertNonEmptyString(data.properSpelling, "properSpelling", relativePath),
    informationBlurb: assertString(data.informationBlurb, "informationBlurb", relativePath)
  };
}

/**
 * Validates and normalizes subject metadata.json contents.
 * creditAmount must be a non-negative integer.
 *
 * @param {*} data
 * @param {string} relativePath
 * @returns {SubjectMetadata}
 * @throws {Error}
 */
function validateSubjectMetadataFile(data, relativePath) {
  if (!isPlainObject(data)) {
    throw new Error(`Invalid metadata format in ${relativePath}. Expected a JSON object.`);
  }

  const creditAmount = assertNumber(data.creditAmount, "creditAmount", relativePath);
  if (creditAmount < 0 || !Number.isInteger(creditAmount)) {
    throw new Error(`Invalid 'creditAmount' in ${relativePath}. Expected an integer >= 0.`);
  }

  return {
    properSpelling: assertNonEmptyString(data.properSpelling, "properSpelling", relativePath),
    courseCode: assertString(data.courseCode, "courseCode", relativePath).trim(),
    creditAmount,
    EsCatedrado: assertBoolean(data.EsCatedrado, "EsCatedrado", relativePath)
  };
}

/**
 * Loads school metadata from exams/<school>/metadata.json, or returns defaults.
 *
 * @param {string} school
 * @returns {SchoolMetadata}
 */
function loadSchoolMetadata(school) {
  const absolutePath = path.join(EXAMS_DIR, school, METADATA_FILE_NAME);
  if (!fs.existsSync(absolutePath)) {
    return defaultSchoolMetadata(school);
  }

  const { data, relativePath } = readJsonFile(absolutePath);
  return validateSchoolMetadataFile(data, relativePath);
}

/**
 * Loads subject metadata from exams/<school>/<subject>/metadata.json, with caching.
 * Returns defaults when the file is missing.
 *
 * @param {string} school
 * @param {string} subject
 * @returns {SubjectMetadata}
 */
function loadSubjectMetadata(school, subject) {
  const cacheKey = `${school}/${subject}`;
  if (subjectMetadataCache.has(cacheKey)) {
    return subjectMetadataCache.get(cacheKey);
  }

  const absolutePath = path.join(EXAMS_DIR, school, subject, METADATA_FILE_NAME);
  let metadata;

  if (!fs.existsSync(absolutePath)) {
    metadata = defaultSubjectMetadata(subject);
  } else {
    const { data, relativePath } = readJsonFile(absolutePath);
    metadata = validateSubjectMetadataFile(data, relativePath);
  }

  subjectMetadataCache.set(cacheKey, metadata);
  return metadata;
}

/**
 * Builds schoolMetadata and subjectMetadata maps from discovered exam items.
 *
 * @param {ExamItem[]} items
 * @returns {{ schoolMetadata: Object.<string, SchoolMetadata>, subjectMetadata: Object.<string, SubjectMetadata> }}
 */
function collectMetadata(items) {
  const schools = new Set();
  const subjectsBySchool = new Map();

  for (const item of items) {
    schools.add(item.school);
    if (!subjectsBySchool.has(item.school)) {
      subjectsBySchool.set(item.school, new Set());
    }
    subjectsBySchool.get(item.school).add(item.subject);
  }

  const schoolMetadata = {};
  const subjectMetadata = {};

  for (const school of schools) {
    schoolMetadata[school] = loadSchoolMetadata(school);

    const subjects = subjectsBySchool.get(school) || new Set();
    for (const subject of subjects) {
      subjectMetadata[`${school}/${subject}`] = loadSubjectMetadata(school, subject);
    }
  }

  return { schoolMetadata, subjectMetadata };
}

/**
 * Recursively walks a directory in sorted order, invoking onFile for each file.
 *
 * @param {string} currentDir
 * @param {(absolutePath: string) => void} onFile
 */
function walkDirectory(currentDir, onFile) {
  if (!fs.existsSync(currentDir)) {
    return;
  }

  const entries = sorted(fs.readdirSync(currentDir, { withFileTypes: true }).map((entry) => entry.name));

  for (const name of entries) {
    const absolutePath = path.join(currentDir, name);
    const stats = fs.statSync(absolutePath);

    if (stats.isDirectory()) {
      walkDirectory(absolutePath, onFile);
      continue;
    }

    if (stats.isFile()) {
      onFile(absolutePath);
    }
  }
}

/**
 * Validates a PDF under exams/ and builds an ExamItem, or returns null for non-PDFs.
 *
 * Path rules:
 * - 3 segments: <school>/<subject>/<file>.pdf (catedrado subjects)
 * - 4 segments: <school>/<subject>/<professor>/<file>.pdf (non-catedrado)
 *
 * Enforces slug patterns and EsCatedrado consistency with folder depth.
 *
 * @param {string} absoluteFilePath
 * @returns {ExamItem|null}
 * @throws {Error} On invalid path depth, slugs, metadata mismatch, or filename
 */
function validateAndBuildItem(absoluteFilePath) {
  if (!absoluteFilePath.toLowerCase().endsWith(".pdf")) {
    return null;
  }

  const sourceRelativePath = path.relative(EXAMS_DIR, absoluteFilePath).split(path.sep).join("/");
  const segments = sourceRelativePath.split("/");
  let school;
  let subject;
  let professor = null;
  let fileName;

  if (segments.length === 3) {
    [school, subject, fileName] = segments;
  } else if (segments.length === 4) {
    [school, subject, professor, fileName] = segments;
  } else {
    throw new Error(
      `Invalid file path depth for ${sourceRelativePath}. Expected <school>/<subject>/<file>.pdf or <school>/<subject>/<professor>/<file>.pdf under exams/.`
    );
  }

  const examRelativePath = [school, subject, ...(professor ? [professor] : []), fileName].join("/");
  const examPublicPath = `${EXAMS_BASE_URL}/${examRelativePath}`;

  if (!SCHOOL_PATTERN.test(school)) {
    throw new Error(`Invalid school folder '${school}' in ${sourceRelativePath}. Use lowercase snake_case only.`);
  }

  if (!SUBJECT_PATTERN.test(subject)) {
    throw new Error(`Invalid subject folder '${subject}' in ${sourceRelativePath}. Use lowercase snake_case only.`);
  }

  const subjectMetadata = loadSubjectMetadata(school, subject);

  if (professor) {
    if (!PROFESSOR_PATTERN.test(professor)) {
      throw new Error(`Invalid professor folder '${professor}' in ${sourceRelativePath}. Use lowercase snake_case only.`);
    }

    if (subjectMetadata.EsCatedrado) {
      throw new Error(
        `Invalid professor subfolder in ${sourceRelativePath}. Subject '${school}/${subject}' is marked as EsCatedrado=true.`
      );
    }
  } else if (!subjectMetadata.EsCatedrado) {
    throw new Error(
      `Invalid file path for ${sourceRelativePath}. Subject '${school}/${subject}' is marked as EsCatedrado=false and must store PDFs under <school>/<subject>/<professor>/ in exams/.`
    );
  }

  const parsedCode = parseFileCode(fileName);
  if (!parsedCode) {
    throw new Error(
      `Invalid filename '${fileName}' in ${sourceRelativePath}. Use PX_XS_XXXX_E, RP_XS_XXXX_E, or S_XS_XXXX_E with underscores only. Optional final _E is only for extraordinario.`
    );
  }

  return {
    path: examPublicPath,
    school,
    subject,
    professor,
    year: parsedCode.year,
    semester: parsedCode.semester,
    parcial: parsedCode.parcial,
    kind: parsedCode.kind,
    kindCode: parsedCode.kindCode,
    variant: parsedCode.variant,
    variantCode: parsedCode.variantCode,
    variation: parsedCode.variation,
    fileName,
    title: titleFromFilename(fileName)
  };
}

/**
 * Scans exams/, validates all PDFs, sorts items, collects metadata, and writes index.json.
 *
 * @returns {number} Total number of indexed PDFs
 */
function generateIndex() {
  const items = [];

  walkDirectory(EXAMS_DIR, (absolutePath) => {
    const entry = validateAndBuildItem(absolutePath);
    if (entry) {
      items.push(entry);
    }
  });

  items.sort((a, b) => {
    return (
      a.school.localeCompare(b.school) ||
      a.subject.localeCompare(b.subject) ||
      (a.professor || "").localeCompare(b.professor || "") ||
      a.year.localeCompare(b.year) ||
      semesterSort(a, b) ||
      parcialSort(a, b) ||
      variantSort(a, b) ||
      a.kindCode.localeCompare(b.kindCode) ||
      a.fileName.localeCompare(b.fileName)
    );
  });

  const { schoolMetadata, subjectMetadata } = collectMetadata(items);

  const payload = {
    generatedAt: new Date().toISOString(),
    total: items.length,
    stats: {
      schools: Object.keys(schoolMetadata).length,
      subjects: Object.keys(subjectMetadata).length,
      exams: items.length
    },
    schoolMetadata,
    subjectMetadata,
    items
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload.total;
}

const total = generateIndex();
console.log(`Generated index.json with ${total} PDF file(s).`);
