#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const EXAMS_DIR = path.join(REPO_ROOT, "exams");
const OUTPUT_FILE = path.join(REPO_ROOT, "index.json");

const SUBJECT_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const FILE_CODE_PATTERN = /^P([0-9]+)[_-](IS|IIS)[_-]([0-9]{4})[_-]([ES])$/i;

function titleFromFilename(fileName) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFileCode(fileName) {
  const baseName = fileName.replace(/\.pdf$/i, "");
  const match = baseName.match(FILE_CODE_PATTERN);

  if (!match) {
    return null;
  }

  const parcialNumber = Number.parseInt(match[1], 10);
  const semester = match[2].toUpperCase();
  const year = match[3];
  const kindCode = match[4].toUpperCase();

  return {
    parcial: `P${parcialNumber}`,
    semester,
    year,
    kindCode,
    kind: kindCode === "E" ? "enunciado" : "solution"
  };
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

  if (segments.length !== 3 || segments[0] !== "exams") {
    throw new Error(
      `Invalid file path depth for ${relativePath}. Expected exams/<subject>/<file>.pdf`
    );
  }

  const [, subject, fileName] = segments;

  if (!SUBJECT_PATTERN.test(subject)) {
    throw new Error(`Invalid subject folder '${subject}' in ${relativePath}. Use lowercase-kebab-case.`);
  }

  const parsedCode = parseFileCode(fileName);
  if (!parsedCode) {
    throw new Error(
      `Invalid filename '${fileName}' in ${relativePath}. Use PX_XS_XXXX_E pattern (for example P1_IS_2024_E.pdf). '-' is also accepted.`
    );
  }

  return {
    path: relativePath,
    subject,
    year: parsedCode.year,
    semester: parsedCode.semester,
    parcial: parsedCode.parcial,
    kind: parsedCode.kind,
    kindCode: parsedCode.kindCode,
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
      a.subject.localeCompare(b.subject) ||
      a.year.localeCompare(b.year) ||
      a.semester.localeCompare(b.semester) ||
      a.parcial.localeCompare(b.parcial) ||
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
