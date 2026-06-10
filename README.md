![Exámenes Anteriores ITCR](docs/tittle.jpg)

Repositorio público para compartir exámenes anteriores en PDF.

El sitio se actualiza automáticamente según los archivos agregados.
Para contribuir, solo necesita agregar PDFs con el formato correcto.

## Estructura De Archivos

Todos los exámenes deben ir en esta ruta:

`exams/<materia>/<archivo>.pdf`

Ejemplo:

`exams/calculo-diferencial-e-integral/P1_IS_2024_E.pdf`

Reglas:
- `materia`: lowercase kebab-case (ejemplo: `calculo-1`, `fisica-2`)
- el archivo debe seguir `PX_XS_XXXX_E`, `RP_XS_XXXX_E` o `S_XS_XXXX_E`
- se acepta `_` o `-` como separador
- `PX`: parcial normal (ejemplo: `P1`, `P2`)
- `RP`: examen de reposición
- `S`: suficiencia
- `XS`: semestre (`IS` o `IIS`)
- `XXXX`: año
- última letra: `E` (enunciado) o `S` (solución)
- bandera final opcional: `_E` (extraordinario)
- extension: `.pdf`

## Cómo Contribuir

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