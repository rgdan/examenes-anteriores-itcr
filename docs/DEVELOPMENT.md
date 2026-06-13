# Development Guide

This file contains technical details for local development, indexing, and GitHub Pages deployment.

## Architecture

- Frontend: static files at project root (`index.html`, `app.js`, `styles.css`)
- Index generator: `scripts/generate-index.js`
- Data file: `index.json` (auto-generated)
- Source content: `exams/<escuela>/<materia>/<file>.pdf`
- Optional metadata files:
	- `exams/<escuela>/metadata.json`
	- `exams/<escuela>/<materia>/metadata.json`
- CI/CD: `.github/workflows/pages.yml`

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

Pipeline behavior:

- Regenerates `index.json`
- Validates file structure and naming
- Deploys static site to GitHub Pages

## Troubleshooting

PDF not visible:

- Confirm path is `exams/<escuela>/<materia>/<file>.pdf`
- Confirm filename matches required format
- Confirm extension is `.pdf`
- Check workflow run logs

Validation error in CI:

- Rename folder/file to match the naming rules
