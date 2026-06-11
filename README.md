![Exámenes Anteriores ITCR](docs/tittle.jpg)

Repositorio público para compartir exámenes anteriores en PDF.

El sitio se actualiza automáticamente según los archivos agregados.
Para contribuir, solo necesita agregar PDFs con el formato correcto.

## Estructura de Archivos

Todos los archivos deben almacenarse siguiendo esta jerarquía:
`exams/<escuela>/<materia>/<nombre_archivo>.pdf`

### Convención de la Carpeta (`escuela` y `materia`)

Las carpetas deben escribirse siempre en **lowercase snake_case**.
* *Ejemplos:* `matematica`, `fisica`, `calculo_diferencial_e_integral`, `fisica_1`.

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

* **Parcial 1:** `exams/matematica/calculo_diferencial_e_integral/P1_IS_2026_E.pdf`
* **Reposición:** `exams/matematica/calculo_diferencial_e_integral/RP_IIS_2026_S.pdf`
* **Suficiencia:** `exams/fisica/fisica_1/S_IS_2026_E.pdf`
* **Extraordinario:** `exams/matematica/calculo_y_algebra_lineal/P1_IS_2026_E_E.pdf`

## Cómo Contribuir

> **Advertencia**  
> La intención es recopilar y distribuir exámenes de cátedra, manteniendo la discreción debido a que ciertos docentes prefieren que no se difunda su material.

1. Haga un fork de este repositorio en GitHub.
2. Clone su fork en su computadora.
3. Agregue su PDF en `exams/<escuela>/<materia>/`.
4. Verifique que el nombre del archivo cumpla el formato requerido.
5. Confirme sus cambios con un commit.
6. Haga push de sus cambios a su fork.
7. Abra un Pull Request desde su fork hacia este repositorio.
8. En el Pull Request, describa qué materia y qué exámenes agregó.

## Examenes buscados

Para obtener una buena selección de exámenes en el repositorio, se buscan los siguientes documentos según la tabla.

| Símbolo | Significado |
| :--- | :--- |
| ✔️| Ya se tiene el repositorio |
| ❌ | Todavía no se tiene en el repositorio |
| ⬜ | No se puede obtener o no existe |

<table>
  <tr>
    <th colspan="4"></th>
    <th>MG</th><th>MD</th><th>ED</th><th>CS</th><th>CAL</th><th>CDI</th><th>PB</th><th>ES</th>
  </tr>
  <tr>
    <td rowspan="16"><b>2025</b></td>
    <td rowspan="8"><b>IS</b></td>
    <td rowspan="2"><b>P1</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>✔️</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td rowspan="2"><b>P2</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>✔️</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>✔️</td><td>❌</td><td>❌</td><td>❌</td><td>✔️</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td rowspan="2"><b>P3</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>⬜</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>✔️</td><td>❌</td><td>❌</td><td>❌</td><td>✔️</td><td>❌</td><td>❌</td><td>⬜</td>
  </tr>
  <tr>
    <td rowspan="2"><b>RP</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td rowspan="8"><b>IIS</b></td>
    <td rowspan="2"><b>P1</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td rowspan="2"><b>P2</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td rowspan="2"><b>P3</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>⬜</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>⬜</td>
  </tr>
  <tr>
    <td rowspan="2"><b>RP</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td rowspan="8"><b>2026</b></td>
    <td rowspan="8"><b>IS</b></td>
    <td rowspan="2"><b>P1</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td rowspan="2"><b>P2</b></td>
    <td>Enunciado</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td>
  </tr>
  <tr>
    <td rowspan="2"><b>P3</b></td>
    <td>Enunciado</td>
    <td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td>
  </tr>
  <tr>
    <td rowspan="2"><b>RP</b></td>
    <td>Enunciado</td>
    <td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td>
  </tr>
  <tr>
    <td>Solucionario</td>
    <td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td>
  </tr>
</table>

## Documentación Técnica

La guía de desarrollo está en [DEVELOPMENT.md](DEVELOPMENT.md).
