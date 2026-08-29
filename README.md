# Depot Katalog / Stock Catalog

A dependency-free static web app (`index.html` + `translations.js`) for cataloging products. All data stays in your browser — nothing is sent to any server, and it works fully offline.

## Files

| File | Purpose |
|---|---|
| `index.html` | All HTML structure, CSS and application logic |
| `translations.js` | **All user-facing texts** (Turkish + English). Editable by non-technical users — see below |

## Features

- **CRUD**: add products (name + location) via a toggleable add-form, inline row editing (Enter to jump/save, Escape to cancel), delete (with confirmation)
- **Live search**: filters by name or location, case-insensitive; search box is focused on page load
- **Pagination**: selectable page size (5/10/15/20, default 5), numbered pages with previous/next; current page highlighted
- **Duplicate protection**: while typing a product name in Add mode, matching products are listed under the input; exact duplicates (same name + location) are blocked with an alert; same name at a different location asks for confirmation
- **Missing location check**: adding without a location asks whether to continue anyway
- **Smart inputs**: first letters of name/location auto-capitalize; pasted or edited values are left untouched
- **Edit mode**: the form pulses/scrolls into view so you can see where you're editing
- **Persistence**: `localStorage`; automatic rolling snapshots (last 5) saved silently after every change
- **Backup**: "Download backup" exports JSON; "Load backup" imports it after confirmation
- **i18n**: Turkish (default) and English, auto-detected from browser language with TR/EN switcher
- **Privacy**: all prompts are custom in-app modals; footer shows "All data is stored locally on your device."
- **Responsive**: desktop and mobile; dark mode follows OS setting

## Usage

No build step, no server required:

1. Keep `index.html` and `translations.js` in the same folder.
2. Double-click `index.html` — it opens in any modern browser.
3. Optional: serve locally with `python -m http.server 8000` or VS Code Live Server.

## Editing / Adding Languages (translations.js)

Open `translations.js` in any text editor. Each language is one block:

```js
{
  code: "en",              // short code, used internally
  label: "English",        // shown in the UI
  strings: {
    appTitle: "Stock Catalog",
    // ...one line per text
  }
}
```

- To change a text, edit the value after the `:` (keep the quotes).
- To add a language (e.g. German), copy an entire `{ ... },` block, paste it inside the `[ ... ]` list, then change `code`, `label` and translate the values.
- Placeholders like `{name}`, `{cur}`, `{inc}`, `{query}`, `{n}` are filled in automatically — do not remove them or their braces.
- The file must remain valid JavaScript. If it is broken or missing, the app shows
  `Translation file missing or invalid.` and stops (this error message is intentionally
  hardcoded in English).

## Deploy to GitHub Pages

```bash
git init
git add index.html translations.js README.md .nojekyll
git commit -m "Initial stock catalog"
git remote add origin https://github.com/<user>/depotCatalog.git
git push -u origin main
```

Then: repo → Settings → Pages → Source *Deploy from a branch* → `main` / root → Save.
The site will be live at `https://<user>.github.io/depotCatalog/`.

## Data notes

- Data is scoped to the browser **origin**, so entries made via `file://` are separate from those on the GitHub Pages URL. Use **Download backup / Load backup** to move data between origins or devices.
- Backups are plain JSON files compatible across both languages.

