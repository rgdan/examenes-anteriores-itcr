# Working in this repository

## Purpose and architecture

This is a Spanish-language static site for finding and opening past ITCR exam PDFs. It uses plain HTML, CSS, and browser JavaScript modules. There is no package manifest, dependency installation, bundler, or backend.

`scripts/generate-index.js` scans a local `exams/` archive, validates paths, filenames, and metadata, and writes `index.json`. The browser fetches that index, groups exams, and renders the interface. GitHub Actions obtains the archive from `rgdan/examenes-anteriores-itcr-archivos` and publishes to GitHub Pages.

| Location | Responsibility |
| --- | --- |
| `index.html`, `css/styles.css` | Page structure, reusable templates, responsive styles |
| `js/loader.js`, `js/state.js`, `js/constants.js` | Initialization, shared state, Spanish UI strings and types |
| `js/grouping.js`, `js/utils.js` | Exam grouping, sorting, metadata labels, text normalization |
| `js/router.js`, `js/render-home.js`, `js/render-school.js`, `js/pdf-viewer.js` | Hash navigation, course search, exam browsing, PDF preview |
| `scripts/generate-index.js`, `.github/workflows/pages.yml` | Archive validation, index generation, publication |

## Local development

CI currently selects Node.js 20. The generator uses Node built-ins and CommonJS; browser files use ES modules. Preserve that distinction.

The PDF archive and generated index are ignored by Git. A fresh checkout needs a local copy of the separate archive under `exams/` before it can display exams. Do not overwrite an existing local archive without checking its contents.

From the repository root, with the archive in place:

```sh
node scripts/generate-index.js
python3 -m http.server 8000
```

Open `http://localhost:8000`. Serve over HTTP so browser module imports and index fetching work. Index generation overwrites the local `index.json`; it does not fetch PDFs. With no archive, it can produce an empty index.

## Change conventions

- Make the smallest complete change. Reuse existing helpers, templates, state, and browser APIs before introducing new code or dependencies.
- Read the affected flow and search its callers before editing. Keep generator output, browser consumers, documentation, and relevant checks consistent.
- Match the existing JavaScript style: two-space indentation, double quotes, semicolons, and named exports. Add comments only where the reason is not evident from the code.
- Keep student-facing copy in Spanish. Put shared UI wording in `STRINGS`; keep maintenance instructions in documentation or the console.
- Use `textContent` for archive metadata and other variable text. Preserve filename and metadata validation at the archive boundary.
- Preserve relative asset and PDF URLs: the site is hosted below a repository path on GitHub Pages.
- Do not commit PDFs, local archive metadata, generated `index.json`, browser profiles, or temporary test artifacts. Do not fix unrelated audit findings without a task asking for those fixes.

## Data and navigation contracts

- Metadata lookup keys use `school/subject`. Missing subject metadata defaults to a coordinated course; read the generator before changing metadata rules.
- Grouping follows school, subject, professor, year, semester, exam group, and document kind. Each exam group pairs `enunciado` and `solution`; preserve exam variant and variation when changing grouping.
- Semester codes are `IS`, `IIS`, and `V`. Summer files belong under `verano/`; that folder can optionally contain a professor folder. Keep generator and browser handling aligned.
- Hash routes are `#/`, `#/<school>`, and `#/<school>/<subject>`. Preserve encoded slugs, direct links, browser back/forward navigation, and course expansion.
- Desktop PDF links open a preview; mobile devices use the direct PDF link. Preserve a usable direct-link fallback when changing preview behavior.

## UI and accessibility

Keep the interface focused on finding courses and opening exams. Use the existing visual language; avoid decorative sections, generic marketing copy, and motion without a purpose.

For UI changes, check keyboard operation, visible focus, readable contrast, and loading, empty, and error states. Closed overlays must not receive focus. Open modal interfaces need deliberate focus entry, containment, Escape handling, and focus restoration. Respect reduced-motion preferences when changing animation or scrolling.

Check both desktop navigation and the mobile drawer. Do not treat a screenshot or source inspection as proof that an interaction works.

## Verification

There is currently no committed automated test suite. Choose checks that exercise the behavior changed:

1. For generator or archive-contract changes, run index generation against representative valid and invalid fixtures. Cover affected filename forms, metadata rules, summer paths, and duplicate identities. Keep synthetic fixtures separate from the user's archive.
2. For grouping or sorting changes, check the resulting documents and order, including equal keys and exam variations. Prefer small tests with Node's built-in test tools over adding a framework.
3. For UI changes, serve the site and exercise search, school selection, course expansion, direct hashes, back/forward navigation, and the affected PDF or drawer interaction. Check the console, narrow layouts, and keyboard focus.
4. For deployment changes, inspect event conditions, concurrency, permissions, archive synchronization, and artifact contents. CI currently verifies that PDFs exist and that the generated index is nonempty; those checks do not prove browser correctness.

Report what changed, what was actually checked, and any remaining limitation. Never claim a live deployment, device, browser, or external link was verified unless it was.

## Communication

Lead with the result or the next concrete action. Keep explanations short and use numbered steps for work the user needs to perform. Prioritize findings so the user can choose them by number. End with unchecked items and material risks when relevant.
