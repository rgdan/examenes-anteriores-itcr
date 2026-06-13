# Development Guide

## Architecture

- Frontend: static files at project root (`index.html`, `app.js`, `styles.css`)
- Index generator: `scripts/generate-index.js`
- Data file: `index.json` (auto-generated)
- Source content: external repo `rgdan/examenes-anteriores-itcr-archivos` (estructura `<escuela>/<materia>/<file>.pdf` en la raiz del repo)
- Metadata files:
	- `exams/<escuela>/metadata.json`
	- `exams/<escuela>/<materia>/metadata.json`
	- `EsCatedrado` now belongs to materia metadata only.
- CI/CD: `.github/workflows/pages.yml`

## Local Development

First time setup (copy the archive repo `exams/` into this repo `exams/`):

```bash
git clone https://github.com/rgdan/examenes-anteriores-itcr-archivos /tmp/examenes-anteriores-itcr-archivos
rm -rf exams
mkdir -p exams
cp -a /tmp/examenes-anteriores-itcr-archivos/. exams/
rm -rf exams/.git
```

Refresh local exams copy before testing:

```bash
git -C /tmp/examenes-anteriores-itcr-archivos pull --ff-only
rm -rf exams
mkdir -p exams
cp -a /tmp/examenes-anteriores-itcr-archivos/. exams/
rm -rf exams/.git
```

Generate the index:

```bash
node scripts/generate-index.js
```

Notes:

- `exams/` contents are gitignored in this repo.
- Source of truth remains `rgdan/examenes-anteriores-itcr-archivos`; this repo uses a copied local `exams/` snapshot for build/testing.

Serve locally (example):

```bash
python3 -m http.server 8000
```

Open:

- http://localhost:8000

## GitHub Pages

Pipeline behavior:

- Pulls exams from `rgdan/examenes-anteriores-itcr-archivos`
- Regenerates `index.json`
- Validates file structure and naming
- Deploys static site to GitHub Pages


