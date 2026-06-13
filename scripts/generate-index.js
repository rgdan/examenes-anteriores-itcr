#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const EXAMS_DIR = path.join(REPO_ROOT, "exams");
const OUTPUT_FILE = path.join(REPO_ROOT, "index.json");

const SUBJECT_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const SCHOOL_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const PROFESSOR_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const REGULAR_CODE_PATTERN = /^(P([0-9]+)|RP)_(IS|IIS)_([0-9]{4})_([ES])(?:_(E))?$/i;
const SUFICIENCIA_CODE_PATTERN = /^S_(IS|IIS)_([0-9]{4})_([ES])$/i;
const METADATA_FILE_NAME = "metadata.json";
const SEMESTER_ORDER = { IS: 1, IIS: 2 };
const VARIANT_ORDER = { regular: 0, extraordinario: 1, suficiencia: 2 };

const subjectMetadataCache = new Map();

function titleFromFilename(fileName) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFileCode(fileName) {
  const baseName = fileName.replace(/\.pdf$/i, "");
  const suficienciaMatch = baseName.match(SUFICIENCIA_CODE_PATTERN);
  if (suficienciaMatch) {
    const semester = suficienciaMatch[1].toUpperCase();
    const year = suficienciaMatch[2];
    const kindCode = suficienciaMatch[3].toUpperCase();

    return {
      parcial: "S",
      semester,
      year,
      kindCode,
      kind: kindCode === "E" ? "enunciado" : "solution",
      variant: "suficiencia",
      variantCode: null
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

  const parcial = parcialToken === "RP" ? "RP" : `P${parcialNumber}`;
  const variant = variantCode === "E" ? "extraordinario" : "regular";

  return {
    parcial,
    semester,
    year,
    kindCode,
    kind: kindCode === "E" ? "enunciado" : "solution",
    variant,
    variantCode
  };
}

function variantSort(a, b) {
  return (VARIANT_ORDER[a.variant] || 99) - (VARIANT_ORDER[b.variant] || 99) || (a.variant || "").localeCompare(b.variant || "");
}

function semesterSort(a, b) {
  return (SEMESTER_ORDER[a.semester] || 99) - (SEMESTER_ORDER[b.semester] || 99) || a.semester.localeCompare(b.semester);
}

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

function sorted(array) {
  return array.slice().sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function titleFromSlug(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertString(value, fieldName, relativePath) {
  if (typeof value !== "string") {
    throw new Error(`Invalid '${fieldName}' in ${relativePath}. Expected a string.`);
  }
  return value;
}

function assertNonEmptyString(value, fieldName, relativePath) {
  const stringValue = assertString(value, fieldName, relativePath).trim();
  if (!stringValue) {
    throw new Error(`Invalid '${fieldName}' in ${relativePath}. Value cannot be empty.`);
  }
  return stringValue;
}

function assertBoolean(value, fieldName, relativePath) {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid '${fieldName}' in ${relativePath}. Expected a boolean.`);
  }
  return value;
}

function assertNumber(value, fieldName, relativePath) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid '${fieldName}' in ${relativePath}. Expected a number.`);
  }
  return value;
}

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

function defaultSchoolMetadata(school) {
  return {
    properSpelling: titleFromSlug(school),
    informationBlurb: ""
  };
}

function defaultSubjectMetadata(subject) {
  return {
    properSpelling: titleFromSlug(subject),
    courseCode: "",
    creditAmount: 0,
    EsCatedrado: true
  };
}

function validateSchoolMetadataFile(data, relativePath) {
  if (!isPlainObject(data)) {
    throw new Error(`Invalid metadata format in ${relativePath}. Expected a JSON object.`);
  }

  return {
    properSpelling: assertNonEmptyString(data.properSpelling, "properSpelling", relativePath),
    informationBlurb: assertString(data.informationBlurb, "informationBlurb", relativePath)
  };
}

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

function loadSchoolMetadata(school) {
  const absolutePath = path.join(EXAMS_DIR, school, METADATA_FILE_NAME);
  if (!fs.existsSync(absolutePath)) {
    return defaultSchoolMetadata(school);
  }

  const { data, relativePath } = readJsonFile(absolutePath);
  return validateSchoolMetadataFile(data, relativePath);
}

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

function validateAndBuildItem(absoluteFilePath) {
  if (!absoluteFilePath.toLowerCase().endsWith(".pdf")) {
    return null;
  }

  const relativePath = path.relative(REPO_ROOT, absoluteFilePath).split(path.sep).join("/");
  const segments = relativePath.split("/");
  let school;
  let subject;
  let professor = null;
  let fileName;

  if (segments.length === 4 && segments[0] === "exams") {
    [, school, subject, fileName] = segments;
  } else if (segments.length === 5 && segments[0] === "exams") {
    [, school, subject, professor, fileName] = segments;
  } else {
    throw new Error(
      `Invalid file path depth for ${relativePath}. Expected exams/<school>/<subject>/<file>.pdf or exams/<school>/<subject>/<professor>/<file>.pdf`
    );
  }

  if (!SCHOOL_PATTERN.test(school)) {
    throw new Error(`Invalid school folder '${school}' in ${relativePath}. Use lowercase snake_case only.`);
  }

  if (!SUBJECT_PATTERN.test(subject)) {
    throw new Error(`Invalid subject folder '${subject}' in ${relativePath}. Use lowercase snake_case only.`);
  }

  const subjectMetadata = loadSubjectMetadata(school, subject);

  if (professor) {
    if (!PROFESSOR_PATTERN.test(professor)) {
      throw new Error(`Invalid professor folder '${professor}' in ${relativePath}. Use lowercase snake_case only.`);
    }

    if (subjectMetadata.EsCatedrado) {
      throw new Error(
        `Invalid professor subfolder in ${relativePath}. Subject '${school}/${subject}' is marked as EsCatedrado=true.`
      );
    }
  } else if (!subjectMetadata.EsCatedrado) {
    throw new Error(
      `Invalid file path for ${relativePath}. Subject '${school}/${subject}' is marked as EsCatedrado=false and must store PDFs under exams/<school>/<subject>/<professor>/.`
    );
  }

  const parsedCode = parseFileCode(fileName);
  if (!parsedCode) {
    throw new Error(
      `Invalid filename '${fileName}' in ${relativePath}. Use PX_XS_XXXX_E, RP_XS_XXXX_E, or S_XS_XXXX_E with underscores only. Optional final _E is only for extraordinario.`
    );
  }

  return {
    path: relativePath,
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
    fileName,
    title: titleFromFilename(fileName)
  };
}

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
    schoolMetadata,
    subjectMetadata,
    items
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload.total;
}

const total = generateIndex();
console.log(`Generated index.json with ${total} PDF file(s).`);
