# AGENTS.md

Compact guide for agents working on Vaultly (`gestor-claves-dunatech`).

## What this repo is

Static single-page vanilla-JS app for storing account credentials in `localStorage`. **No build step, no package manager, no test runner, no linter, no pre-commit hooks.** Files at the root are served as-is.

**Tech stack**: Vanilla JS (ES2017+, strict mode), Tailwind CSS via CDN, Google Fonts (Inter + JetBrains Mono), Material Symbols, PWA (sw.js).

## How to run it locally

Serve over HTTP (Chrome blocks `fetch()` over `file://`):

```bash
python -m http.server 8000
# or
npx http-server
```

Then open `http://localhost:8000`.

## Data model and storage

- `localStorage` key: **`gestorClaves`** (camelCase, unchanged).
- Shape persisted: `{ items: Item[], version: "2.0" }`.
- `Item = { id, descripcion, category, fields: [{ type, value }], createdAt }`.
- `category` defaults to `"Personal"` on migration. Valid values: `Personal`, `Trabajo`, `Finanzas`, `Social`, `Otro`.
- `createdAt` defaults to `Date.now()` on migration; used for date sorting.
- `fields[].type` values: `correo`, `clave`, `name`, `enlace` (see `FIELD_LABELS` in `app.js`).
- Corrupt localStorage payload is moved to `gestorClaves.recovery.<timestamp>` and the app starts empty.
- Imported items pass through `validateItem()` / `validateImport()`; unknown `type` values and malformed items are silently dropped.

## Pastel color palette

5 Tailwind colors (defined in `tailwind.config` and generated via CDN):
```
pastel-blue (#BAE1FF), pastel-purple (#E0BAFF), pastel-green (#BFFCC6), pastel-yellow (#FFFFBA), pastel-pink (#FFB3BA)
```
Each card gets its color via `hashString(id) % 5`. The safelist pattern `(bg|border|text)-(pastel-...)` ensures the CDN generates all needed classes. If you add/remove a pastel color, update `PASTEL_COLORS` array in `app.js` and the `tailwind.config` color map in `index.html` + the safelist.

## UI structure

- **Top nav** (fixed): Logo + search + backup/import/new buttons. Mobile: logo + search (expandable) + new button.
- **Sidebar** (desktop only, fixed): Category nav + backup/import/help links.
- **Main content**: Title + filter chips + sort dropdown + grid.
- **Bottom nav** (mobile only): All, Personal, + (big center), Work, Finance.
- **Modals Detail/Form**: Glass style (`backdrop-filter: blur`, transparent background).
- **Toast** (undo) and **notification** (top-right, success/error).

## Event handling (no `onclick` in templates)

All dynamic handlers are delegated via `[data-action="…"]`:
- `handleGridClick` — card actions (edit, duplicate, delete, copy, open-add, open-link).
- `handleDetailClick` — detail modal actions (copy, toggle, open-link, close, edit-from-detail).
- `handleFormClick` — form actions (remove-field).

Never reintroduce `onclick="fn('${value}')"`. Add new actions via `case` in the relevant handler.

## Key gotchas

- **`data.json`** is fetched only when `gestorClaves` is missing in localStorage. Once a session saves data, edits to `data.json` won't appear. Remove the key via DevTools to re-seed.
- **UI copy is Spanish** — all user-facing strings in `app.js` and HTML are Spanish.
- **Delete is a soft undo** (5 s toast with "Deshacer"), not a confirm dialog. No `confirm()` in the app.
- **CDN dependencies require internet** on first load. Tailwind Play CDN does runtime JIT — dynamic class names (e.g. `bg-pastel-blue/10`) work because the safelist in the config tells Tailwind to generate them. The service worker caches local files only.
- **Backup version** is `SCHEMA_VERSION = "2.0"` in `app.js`. The import path (`validateImport`) does not check version — it reads `data.items`.
- **Categories in sidebar/filter chips/bottom nav** all have `data-category` attributes. `wireCategoryNav()` binds clicks and `updateCategoryActive()` toggles active styles across all three UI groups.
- **Two search inputs** (desktop `#searchInput`, mobile `#searchInputMobile`) are synced in `handleSearchInput` — typing in one updates the other.
- **`state.sortBy`** defaults to `name-asc`. Available: `name-asc`, `name-desc`, `date-newest`, `date-oldest`.
- **Browser-only APIs** (clipboard, service worker, backup download) can silently fail on `file://` or non-HTTPS. Copy shows an explicit error; SW is skipped on `file://`.
- **The 30-color palette is gone.** Replaced by 5 Tailwind pastels. Keep both files in sync if you change the palette.
- **`style.css` is minimal** — just keyframes, copy flash, scrollbar, autofill override, and focus-visible. All layout is Tailwind classes in `index.html`.
