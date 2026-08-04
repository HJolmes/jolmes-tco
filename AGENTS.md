# AGENTS.md

## Cursor Cloud specific instructions

Jolmes TCO is a single, client-side **React 19 + Vite** SPA (German-language sales tool). There is **no backend, no database, and no environment variables** — the whole product runs from the Vite dev server alone.

Standard commands live in `package.json` (`dev`, `build`, `lint`, `preview`); use those. Notes that are non-obvious:

- **Dev URL is not the site root.** `vite.config.js` sets `base: '/jolmes-tco/'`, so `npm run dev` serves the app at `http://localhost:5173/jolmes-tco/`. Opening `http://localhost:5173/` will not render the app.
- **No test suite exists.** There is no `test` script and no test framework. End-to-end verification is manual: run `npm run dev` and interact with the calculator in a browser (e.g. change `Kundenname`, `Stundensatz`, or the `Branche` dropdown and confirm the "MEHRKOSTEN / JAHR" values and charts recalculate).
- **`npm run lint` currently reports pre-existing errors** in `src/App.jsx` (unused `React`/`formatNum`, one hooks-deps warning). These exist on `main` and are unrelated to environment setup — do not treat a non-zero lint exit as a broken environment, and do not "fix" them unless asked.
- **`scripts/sync-certs.mjs` is CI-only** (GitHub Actions cron). It scrapes cert PDFs from `jolmes.de` and needs the `pdftotext` binary (`poppler-utils`) plus outbound network. It is not needed to run or test the app locally.
