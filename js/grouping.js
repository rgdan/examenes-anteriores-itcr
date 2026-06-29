import { parcialLabel, parcialSort, subjectKey } from "./utils.js";

/**
 * Maps an exam item to a UI parcial group based on its variant.
 * Regular exams use NORMAL_* keys; extraordinario prefixes the label; suficiencia gets rank 2.
 *
 * @param {ExamItem} item
 * @returns {ParcialGroup}
 */
export function parcialGroupFromItem(item) {
  const varSuffix = item.variation ? `_${item.variation}` : "";
  const varLabel = item.variation ? ` [${item.variation}]` : "";

  if (item.variant === "suficiencia") {
    return {
      key: `SUFICIENCIA${varSuffix}`,
      label: `Suficiencia${varLabel}`,
      rank: 2,
      baseParcial: "",
      variation: item.variation || ""
    };
  }

  if (item.variant === "extraordinario") {
    return {
      key: `EXTRA_${item.parcial}${varSuffix}`,
      label: `[Extraordinario]${varLabel} ${parcialLabel(item.parcial)}`,
      rank: 1,
      baseParcial: item.parcial,
      variation: item.variation || ""
    };
  }

  return {
    key: `NORMAL_${item.parcial}${varSuffix}`,
    label: `${parcialLabel(item.parcial)}${varLabel}`,
    rank: 0,
    baseParcial: item.parcial,
    variation: item.variation || ""
  };
}

/**
 * Sorts parcial groups: regular first, then extraordinario, then suficiencia; within rank by parcial number.
 * If rank and baseParcial are equal, sorts by variation (empty variation first, then alphabetically by variation code).
 *
 * @param {ParcialGroup} a
 * @param {ParcialGroup} b
 * @returns {number}
 */
export function parcialGroupSort(a, b) {
  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }

  if (a.rank === 2) {
    // Suficiencia
    if (a.variation && !b.variation) return 1;
    if (!a.variation && b.variation) return -1;
    return a.variation.localeCompare(b.variation) || a.label.localeCompare(b.label);
  }

  const parcialComparison = parcialSort(a.baseParcial, b.baseParcial);
  if (parcialComparison !== 0) {
    return parcialComparison;
  }

  // Same rank (e.g. Regular or Extraordinario) and same parcial (e.g. P1)
  // Sort non-variants first, then alphabetically by variation (e.g. V2, V3)
  if (a.variation && !b.variation) return 1;
  if (!a.variation && b.variation) return -1;
  return a.variation.localeCompare(b.variation);
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
export function groupedIndex(items, subjectMetadata) {
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
