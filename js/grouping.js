import { parcialLabel, parcialSort, subjectKey } from "./utils.js";

/**
 * Maps an exam item to a UI parcial group based on its variant.
 * Regular exams use NORMAL_* keys; extraordinario prefixes the label; suficiencia gets rank 2.
 *
 * @param {ExamItem} item
 * @returns {ParcialGroup}
 */
export function parcialGroupFromItem(item) {
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
export function parcialGroupSort(a, b) {
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
