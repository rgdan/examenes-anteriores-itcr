# Development Guide

## Architecture

- Frontend: static files at project root (`index.html`, `app.js`, `styles.css`)
- Index generator: `scripts/generate-index.js`
- Data file: `index.json` (auto-generated)
- Source content: `exams/<escuela>/<materia>/<file>.pdf`
- Metadata files:
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


