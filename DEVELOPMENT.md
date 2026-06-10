# Development Guide

This file contains technical details for local development, indexing, and GitHub Pages deployment.

## Architecture

- Frontend: static files at project root (`index.html`, `app.js`, `styles.css`)
- Index generator: `scripts/generate-index.js`
- Data file: `index.json` (auto-generated)
- Source content: `exams/<subject>/<file>.pdf`
- CI/CD: `.github/workflows/pages.yml`

## File Naming Convention

Exam PDFs must follow:

- `PX_XS_XXXX_E.pdf` or `RP_XS_XXXX_E.pdf`
- Separators can be `_` or `-`

Where:

- `PX`: regular exam code (`P1`, `P2`, ...)
- `RP`: reposicion exam code
- `XS`: semester code (`IS`, `IIS`)
- `XXXX`: year
- Final code: `E` (statement) or `S` (solution)

## Local Development

Generate the index:

```bash
node scripts/generate-index.js
```

Serve locally (example):

```bash
python3 -m http.server 8000
```

Open:

- http://localhost:8000

## GitHub Pages

The repo uses GitHub Actions for Pages deployment.

1. Go to repository Settings > Pages.
2. Set Source to GitHub Actions.
3. Push to the default branch.

Pipeline behavior:

- Regenerates `index.json`
- Validates file structure and naming
- Deploys static site to GitHub Pages

## Troubleshooting

PDF not visible:

- Confirm path is `exams/<subject>/<file>.pdf`
- Confirm filename matches required format
- Confirm extension is `.pdf`
- Check workflow run logs

Validation error in CI:

- Rename folder/file to match the naming rules above
