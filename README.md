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

## Examenes buscados

Para obtener una buena selección de exámenes en el repositorio, se buscan los siguientes documentos según la tabla.

| Color | Significado |
| :--- | :--- |
| **Rojo**| Todavía no se tiene |
| **Verde** | Ya se tiene el repositorio |
| **Gris** | No se puede obtener o no existe |

<table style="border-collapse: collapse; font-family: Arial, sans-serif; border: 1px solid #000;">
    <tr>
        <th colspan="4" style="border: 1px solid #000; padding: 6px 10px;"></th>
        <th style="border: 1px solid #000; padding: 6px 10px; background: #f5f5f5; font-weight: bold;">MG</th>
        <th style="border: 1px solid #000; padding: 6px 10px; background: #f5f5f5; font-weight: bold;">MD</th>
        <th style="border: 1px solid #000; padding: 6px 10px; background: #f5f5f5; font-weight: bold;">ED</th>
        <th style="border: 1px solid #000; padding: 6px 10px; background: #f5f5f5; font-weight: bold;">CS</th>
        <th style="border: 1px solid #000; padding: 6px 10px; background: #f5f5f5; font-weight: bold;">CAL</th>
        <th style="border: 1px solid #000; padding: 6px 10px; background: #f5f5f5; font-weight: bold;">CDI</th>
        <th style="border: 1px solid #000; padding: 6px 10px; background: #f5f5f5; font-weight: bold;">PB</th>
        <th style="border: 1px solid #000; padding: 6px 10px; background: #f5f5f5; font-weight: bold;">ES</th>
    </tr>
    <tr>
        <td rowspan="16" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">2025</td>
        <td rowspan="8" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">IS</td>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P1</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #26ff5f;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P2</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #26ff5f;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #26ff5f;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #26ff5f;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P3</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #26ff5f;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #26ff5f;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">RP</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td rowspan="8" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">IIS</td>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P1</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P2</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P3</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">RP</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td rowspan="8" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">2026</td>
        <td rowspan="8" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">IS</td>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P1</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P2</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #ff2b2b;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">P3</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid #000; padding: 6px 10px; background: #e6e6e6; font-weight: bold;">RP</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Enunciado</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td>
    </tr>
    <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: left; padding-left: 15px; background: #f2f2f2;">Solucionario</td>
        <td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td><td style="border: 1px solid #000; padding: 6px 10px; background: #4a4a4a;"></td>
    </tr>
</table>

## Documentación Técnica

La guía de desarrollo está en [DEVELOPMENT.md](DEVELOPMENT.md).
