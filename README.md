![Exámenes Anteriores ITCR](docs/tittle.jpg)

Repositorio público para compartir exámenes anteriores en PDF.

El sitio se actualiza automáticamente según los archivos agregados.
Para contribuir, solo necesita agregar PDFs con el formato correcto.

## Estructura de Archivos

Todos los archivos deben almacenarse siguiendo esta jerarquía:
`exams/<materia>/<nombre_archivo>.pdf`

### Convención de la Carpeta (`materia`)

Debe escribirse siempre en **lowercase snake_case**.
* *Ejemplo:* `calculo_diferencial_e_integral`, `fisica_2`.

### Formato del Nombre del Archivo

El nombre debe seguir una estructura estricta compuesta por bloques separados solo por guiones bajos (`_`):

`[TIPO][NUM]_[SEMESTRE]_[AÑO]_[TIPO_DOC][EXTRA]`

| Segmento | Descripción | Valores posibles |
| :--- | :--- | :--- |
| **Tipo** | Categoría del examen | `P` (Parcial), `RP` (Reposición), `S` (Suficiencia) |
| **Num** | Número de parcial | `1`, `2`, `3`, etc. (solo si aplica) |
| **Semestre** | Periodo académico | `IS`, `IIS` |
| **Año** | Año en formato de 4 dígitos | `2024`, `2025`, etc. |
| **Tipo_Doc** | Naturaleza del archivo | `E` (Enunciado), `S` (Solución) |
| **Extra** | Bandera opcional | `_E` (Extraordinario) |

### Ejemplos de Referencia

* **Parcial 1:** `exams/fisica_1/P1_IS_2026_E.pdf`
* **Reposición:** `exams/fisica_2/RP_IIS_2026_S.pdf`
* **Suficiencia:** `exams/estadistica/S_IS_2026_E.pdf`
* **Extraordinario:** `exams/probabilidad/P1_IS_2026_E_E.pdf`

## Cómo Contribuir

> **Advertencia**  
> La intención es recopilar y distribuir exámenes de cátedra, manteniendo la discreción debido a que ciertos docentes prefieren que no se difunda su material.

1. Haga un fork de este repositorio en GitHub.
2. Clone su fork en su computadora.
3. Agregue su PDF en `exams/<materia>/`.
4. Verifique que el nombre del archivo cumpla el formato requerido.
5. Confirme sus cambios con un commit.
6. Haga push de sus cambios a su fork.
7. Abra un Pull Request desde su fork hacia este repositorio.
8. En el Pull Request, describa qué materia y qué exámenes agregó.

## Documentación Técnica

La guía de desarrollo está en [DEVELOPMENT.md](DEVELOPMENT.md).
