# Depo Katalog / Depot Catalog

A dependency-free static web app (plain HTML/CSS/JS, **no build step**) for cataloging products. All data stays in your browser — nothing is sent to any server, and it works fully offline.

## Files

| Path | Purpose |
|---|---|
| `index.html` | Page structure: head, markup, the three pre-paint scripts (favicon / theme / scales) and the bootstrap guard |
| `css/` | 12 stylesheets, linked in the original source order: `base`, `layout`, `list`, `toolbar`, `modals`, `forms`, `footer`, `depot`, `shortcuts`, `a11y`, `pagination`, `responsive` |
| `js/` | 28 classic scripts sharing one `DC` namespace: `namespace`, `constants`, `utils`, `state`, `i18n`, `announcer`, `modals`, `store`, `backup`, `theme`, `favicon`, `input`, `validation`, `search`, `pagination`, `list`, `sort`, `items`, `inline-edit`, `category`, `csv`, `settings`, `depot`, `icon-picker`, `shortcuts`, `batch`, `bulk`, `app` |
| `translations.js` | **All user-facing texts** (Turkish + English). Editable by non-technical users — see below |
| `assets/icon.png` | Fallback app icon (the dynamic emoji favicon replaces it when a depot icon is set) |

The scripts are plain `<script src>` files (no ES modules, no bundler) so the app keeps working both from `file://` and from GitHub Pages. `js/namespace.js` creates `window.DC` and the `DC.expected` manifest that the bootstrap guard checks.

## Features

- **CRUD**: add products (name + location + amount + category) via a toggleable add-form, inline row editing (Enter to jump/save, Escape to cancel), delete (with confirmation)
- **Live search**: filters by name, location or category, case-insensitive; search box is focused on page load
- **Pagination**: selectable page size (5/10/15/20, default 5), numbered pages with previous/next; current page highlighted
- **Sorting**: click the "Product", "Location" or "Category" column headers to cycle ascending → descending → insertion order; indicators (↑/↓/↕) show the state; sort resets when switching depots and persists across searches
- **Depot icons**: the icon left of the depot name opens a picker with 20 preset emoji (4×5 grid); clicking a tile marks it as the **pending** choice (applied icon keeps a subtle outline) and **Save** commits it — **Cancel/Escape** discard the change; the choice is stored per depot in a separate `depotIcons` map, drives the dynamic favicon (canvas → data URL, `assets/icon.png` kept as fallback), and 📦 removes the entry so the fallback applies
- **Batch selection**: row checkboxes plus a "select all" header checkbox (current page only); icon buttons "🗑️ (N)" (remove confirmation modal) and "✏️ (N)" (bulk edit) appear while rows are checked — their accessible name and hover tooltip read "Remove selected items (N)" / "Edit selected items (N)" (Turkish: "Seçilen kayıtları kaldır (N)" / "Seçilen kayıtları düzenle (N)"); the selection is cleared on search, depot switch and page change
- **Bulk edit**: "Edit selected (N)" opens a three-step dialog — 1) choose fields to change (Name / Location / Amount / Category; unchecked fields stay untouched), 2) a preview listing every affected item plus any **merge groups** (items that would end up with the same name + location, case-insensitive and trimmed, are combined — lowest id kept, amounts summed, always shown *before* applying), 3) a final report with the update/merge counts; empty Location or Category is allowed with a warning (an empty Category **clears** it), empty Amount defaults to 1, and the batch selection is cleared after applying
- **Duplicate protection**: while typing a product name in Add mode, matching products are listed under the input; exact duplicates (same name + location) are blocked with an alert; same name at a different location asks for confirmation
- **Missing location check**: adding without a location asks whether to continue anyway
- **Smart inputs**: first letters of name/location/category auto-capitalize; pasted or edited values are left untouched
- **Edit mode**: clicking Edit turns the row into inputs, highlights it, and moves focus to the Product Name field
- **Persistence**: `localStorage`; automatic rolling snapshots (last 5) saved silently after every change
- **Backup**: "Export to CSV" saves the **active depot** as `depotCatalog_{depotName}_D{DDMMYY}_T{HHMM}.csv` with `Name,Location,Amount,Category` columns (a warning modal reminds you only the current depot is exported); "Import from CSV" appends `Name,Location,Amount,Category` rows after a summary listing duplicate rows, missing-field rows, and rows whose missing/invalid Amount was defaulted to 1 — the `Category` column is optional (if absent, every imported row gets an empty category), duplicate detection stays name + location only; a dismissible notice repeats the skipped/defaulted details
- **i18n**: Turkish (default) and English, auto-detected from browser language; switch inside the settings dialog
- **Settings** (⚙️ gear, right of the theme toggle): choose the language, the base **font size** (Small 90% / Normal 100% / Large 115% / Extra Large 130%) and the **icon size** (same four steps, applied to row actions, toolbar arrows, pagination arrows, theme and gear icons — not to the depot icon, which follows the title size); each change applies live, is announced to screen readers and is remembered in `localStorage` (`depotCatalog.lang` / `depotCatalog.fontScale` / `depotCatalog.iconScale`, applied before first paint to avoid a flash); "Reset to defaults" restores the device-detected language plus Normal sizes after a confirmation
- **Privacy**: all prompts are custom in-app modals; footer shows "All data is stored locally on your device."
- **Responsive**: desktop and mobile; dark mode follows OS setting

## Usage

No build step, no server required:

1. Keep the whole folder together (`index.html`, `translations.js`, `css/`, `js/`, `assets/`).
2. Double-click `index.html` — it opens in any modern browser.
3. Optional: serve locally with `python -m http.server 8000` or VS Code Live Server.

If a file is missing or failed to load (for example only `index.html` was copied), the app shows
`Application scripts failed to load. Please refresh or re-download the app.`
(Turkish: `Uygulama betikleri yüklenemedi. Lütfen yenileyin veya uygulamayı yeniden indirin.`)
instead of appearing silently broken.

## Editing / Adding Languages (translations.js)

Open `translations.js` in any text editor. Each language is one block:

```js
{
  code: "en",              // short code, used internally
  label: "English",        // shown in the UI
  strings: {
    appName: "Depot Catalog",
    // ...one line per text
  }
}
```

- `appName` must exist in **every** block: it is the app name shown in the page title *and* the key the app checks to confirm `translations.js` loaded. Removing it makes the app show `Translation file missing or invalid.` and stay inert.
- To change a text, edit the value after the `:` (keep the quotes).
- To add a language (e.g. German), copy an entire `{ ... },` block, paste it inside the `[ ... ]` list, then change `code`, `label` and translate the values.
- Placeholders like `{name}`, `{cur}`, `{inc}`, `{query}`, `{n}` are filled in automatically — do not remove them or their braces.
- The file must remain valid JavaScript. If it is broken or missing, the app shows
  `Translation file missing or invalid.` and stops (this error message is intentionally
  hardcoded in English).

## Deploy to GitHub Pages

```bash
git init
git add index.html translations.js README.md .nojekyll css js assets
git commit -m "Initial stock catalog"
git remote add origin https://github.com/<user>/depotCatalog.git
git push -u origin main
```

Then: repo → Settings → Pages → Source *Deploy from a branch* → `main` / root → Save.
The site will be live at `https://<user>.github.io/depotCatalog/`.

## Data notes

- Data is scoped to the browser **origin**, so entries made via `file://` are separate from those on the GitHub Pages URL. Use **Export to CSV / Import from CSV** to move data between origins or devices (exports are per-depot).
- Internal auto-backups are JSON snapshots kept in `localStorage` (rolling window of the last 5); there is no downloadable JSON backup — CSV is the transfer format.
- Older data or snapshots without an `amount` field are migrated silently to `amount = 1` on load.
- Older data or snapshots without a `category` field are migrated silently to `category = ""` on load (and when snapshots are read); an empty category is displayed as `-` in the stock list but stored as an empty string, and it is never part of duplicate detection (which stays name + location only).

