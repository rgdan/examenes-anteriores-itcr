# Nomenclatura

Este documento define las convenciones para carpetas, PDFs y archivos metadata.json.

Estas convenciones aplican al repositorio de archivos:
- https://github.com/rgdan/examenes-anteriores-itcr-archivos

## Estructura de Archivos

Todos los PDFs deben almacenarse con una de estas jerarquías:

- `exams/<escuela>/<materia>/<nombre_archivo>.pdf`
- `exams/<escuela>/<materia>/<profesor>/<nombre_archivo>.pdf`

## Convención de Carpetas

Las carpetas de escuela y materia deben estar en **lowercase snake_case**.

Reglas:
- Solo letras minúsculas y números.
- Palabras separadas por guion bajo (_).

Ejemplos:
- escuela: matematica, fisica
- materia: calculo_diferencial_e_integral, fisica_1
- profesor: raquel_mora

## Formato del Nombre del PDF

El nombre del archivo debe seguir este patrón:

`[TIPO][NUM]_[SEMESTRE]_[ANO]_[TIPO_DOC][EXTRA].pdf`

| Segmento | Descripción | Valores posibles |
| :--- | :--- | :--- |
| TIPO | Categoría del examen | P (Parcial), RP (Reposición), S (Suficiencia) |
| NUM | Número de parcial | 1, 2, 3, etc. (solo aplica para P) |
| SEMESTRE | Periodo académico | IS, IIS |
| ANO | Año de 4 dígitos | 2024, 2025, etc. |
| TIPO_DOC | Naturaleza del archivo | E (Enunciado), S (Solución) |
| EXTRA | Bandera opcional | _E (Extraordinario) |

Ejemplos:
- exams/matematica/calculo_diferencial_e_integral/P1_IS_2026_E.pdf
- exams/matematica/calculo_diferencial_e_integral/RP_IIS_2026_S.pdf
- exams/fisica/fisica_1/S_IS_2026_E.pdf
- exams/matematica/calculo_y_algebra_lineal/P1_IS_2026_E_E.pdf

## Archivos Metadata

Todos los archivos de metadatos deben llamarse exactamente metadata.json.

### Metadata de Escuela

Ubicación:
- `exams/<escuela>/metadata.json`

Estructura:

```json
{
  "properSpelling": "Física",
  "informationBlurb": ""
}
```

Campos:
- properSpelling: string con el nombre mostrado en la interfaz en lugar del nombre de carpeta.
- informationBlurb: string corto mostrado arriba de todas las materias de la escuela. Puede ser vacio.

### Metadata de Materia

Ubicación:
- `exams/<escuela>/<materia>/metadata.json`

Estructura:

```json
{
  "properSpelling": "Física 1",
  "courseCode": "FI1101",
  "creditAmount": 3,
  "EsCatedrado": true
}
```

Campos:
- properSpelling: string con el nombre mostrado en la interfaz en lugar del nombre de carpeta.
- courseCode: string del codigo del curso (por ejemplo, FI1101).
- creditAmount: entero con la cantidad de creditos.
- EsCatedrado: boolean. Si es `true`, los PDFs van directamente dentro de la carpeta de la materia. Si es `false`, los PDFs deben organizarse dentro de subcarpetas por profesor.

## Notas

- Si un metadata.json es invalido, la generacion de index.json puede fallar.
- Si no existe metadata.json, la app puede usar el nombre de carpeta como respaldo.
- Si `EsCatedrado` es `false`, cada carpeta de profesor debe usar lowercase snake_case.
