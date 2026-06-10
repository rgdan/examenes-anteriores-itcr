# ITCR Open Exams

Public repository for past exam PDFs, published with GitHub Pages.

The website is generated dynamically from folder contents. To add new material, you only need to add PDF files in the expected structure.

## Folder Structure

All exam files must live under `exams/` with this exact path depth:

`exams/<subject>/<file>.pdf`

Example:

`exams/calculo-diferencial-e-integral/P1_IS_2024_E.pdf`

Rules:
- `subject`: lowercase kebab-case (for example `calculo-1`, `fisica-2`)
- filename must follow `PX_XS_XXXX_E` (use `_` or `-` as separators)
- `PX`: parcial code (for example `P1`, `P2`)
- `XS`: semester code, only `IS` or `IIS`
- `XXXX`: year (for example `2024`)
- final code: `E` (enunciado) or `S` (solution)
- file extension: `.pdf`

## How It Works

1. The script `scripts/generate-index.js` scans all PDFs inside `exams/`.
2. It validates subject folders and extracts metadata from the file name.
3. It creates `index.json` with parsed fields (subject, year, semester, parcial, document type).
4. The frontend (`index.html` + `app.js`) fetches `index.json` and renders:
	 - subject
	 - year
	 - semester
	 - parcial
	 - document type (enunciado or solution)
	 - links to PDFs (open in new tab)
5. GitHub Actions rebuilds and deploys the site on every push to the default branch.

## Local Commands

Generate the index:

```bash
node scripts/generate-index.js
```

Serve locally (any static server works), for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages Setup

This repository includes `.github/workflows/pages.yml`.

In GitHub:
1. Go to Settings > Pages.
2. Set Source to GitHub Actions.
3. Push to the default branch.

The workflow will:
- generate `index.json`
- fail if folder structure is invalid
- deploy the static site to GitHub Pages

## Troubleshooting

- Symptom: A PDF does not appear on the site.
	- Check it is inside `exams/<subject>/`.
	- Check filename follows `PX_XS_XXXX_E.pdf`.
	- Check extension is `.pdf`.
	- Check GitHub Actions run status.

- Symptom: Action fails with path validation error.
	- Rename folders to match required patterns.

## Scope (v1)

Included:
- Spanish-only interface
- automatic listing based on files/folders
- GitHub Pages deploy via Actions

Not included yet:
- search
- filters
- file size/date metadata