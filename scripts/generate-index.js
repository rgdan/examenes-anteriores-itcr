#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const EXAMS_DIR = path.join(REPO_ROOT, "exams");
const OUTPUT_FILE = path.join(REPO_ROOT, "index.json");

const SUBJECT_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const SCHOOL_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const REGULAR_CODE_PATTERN = /^(P([0-9]+)|RP)_(IS|IIS)_([0-9]{4})_([ES])(?:_(E))?$/i;
const SUFICIENCIA_CODE_PATTERN = /^S_(IS|IIS)_([0-9]{4})_([ES])$/i;
const SEMESTER_ORDER = { IS: 1, IIS: 2 };
const VARIANT_ORDER = { regular: 0, extraordinario: 1, suficiencia: 2 };

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
  let fileName;

  if (segments.length === 4 && segments[0] === "exams") {
    [, school, subject, fileName] = segments;
  } else {
    throw new Error(
      `Invalid file path depth for ${relativePath}. Expected exams/<school>/<subject>/<file>.pdf`
    );
  }

  if (!SCHOOL_PATTERN.test(school)) {
    throw new Error(`Invalid school folder '${school}' in ${relativePath}. Use lowercase snake_case only.`);
  }

  if (!SUBJECT_PATTERN.test(subject)) {
    throw new Error(`Invalid subject folder '${subject}' in ${relativePath}. Use lowercase snake_case only.`);
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
      a.year.localeCompare(b.year) ||
      semesterSort(a, b) ||
      parcialSort(a, b) ||
      variantSort(a, b) ||
      a.kindCode.localeCompare(b.kindCode) ||
      a.fileName.localeCompare(b.fileName)
    );
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    total: items.length,
    items
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload.total;
}

const total = generateIndex();
console.log(`Generated index.json with ${total} PDF file(s).`);
