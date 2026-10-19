/* --- js/list.js — DC.list: stock list rendering --- */
(function () {
'use strict';

DC.list = DC.list || {};

/* Aliases to already-loaded modules (read once, at load time). */
var activeDepot = DC.state.activeDepot;
var el = DC.el;
var getFilteredItems = DC.search.getFilteredItems;
var hidePagination = DC.pagination.hidePagination;
var renderPagination = DC.pagination.renderPagination;
var state = DC.state;
var syncThemeToggle = DC.theme.syncThemeToggle;
var t = DC.i18n.t;


/* ================= Rendering ================= */
function applyStaticText(){
  document.documentElement.lang = state.lang;
  /* Fix (dynamic page title): "{depot} - {app}" in the current language; no active
     depot (edge case) => app name only. Every title-affecting event (load, depot
     switch/rename/create/delete-fallback, language change) re-renders through here,
     so this single update point covers them all. The static <title> in <head> remains
     the brief pre-run fallback. */
  var titleDep = activeDepot();
  document.title = titleDep
    ? t('pageTitlePattern', { depot: titleDep.name, app: t('appName') })
    : t('appName');
  // Depot selector
  var dep = activeDepot();
  el.depotSelectName.textContent = dep ? dep.name : '\u2014';
  el.depotSelect.setAttribute('aria-label', t('selectAria'));
  el.depotMenu.setAttribute('aria-label', t('selectAria'));
  DC.icons.syncDepotIconUI(); // Fix (depot icon picker): icon + its aria-label (kept language-aware)
  if (DC.depot.depotMenuIsOpen()) DC.depot.renderDepotMenu(); // refresh labels while open
  // No depot => hide item-related UI until one is created
  var hasDepot = !!dep;
  el.btnToggleAdd.classList.toggle('hidden', !hasDepot);
  el.toolbar.classList.toggle('hidden', !hasDepot);
  el.listFoot.classList.toggle('hidden', !hasDepot); // Fix (list footer): hides with the toolbar when no depot exists
  el.searchWrap.classList.toggle('hidden', !hasDepot);
  if (!hasDepot){
    el.formCard.classList.add('hidden');
    el.btnToggleAdd.classList.remove('invisible');
  }
  el.btnToggleAdd.textContent = t('addNewBtn');
  el.formTitle.textContent = t('addTitle');
  el.lblName.textContent = t('nameLbl');
  el.lblLoc.textContent = t('locLbl');
  el.inpName.placeholder = t('phName');
  el.inpLoc.placeholder = t('phLoc');
  el.btnSubmit.textContent = t('add');
  /* Fix (a11y audit N1): the close glyph now lives in an aria-hidden span in the markup */
  var closeLbl = t('close');
  el.btnCloseForm.setAttribute('aria-label', closeLbl);
  el.btnCloseForm.title = closeLbl; // Fix (a11y audit I3): tooltip mirrors the accessible name
  el.lblPageSize.textContent = t('pageSizeLbl');
  /* Fix (a11y audit N1): the clear glyph now lives in an aria-hidden span in the markup */
  var clearLbl = t('clearSearchAria');
  el.btnClearSearch.setAttribute('aria-label', clearLbl);
  el.btnClearSearch.title = clearLbl; // Fix (a11y audit I3): tooltip mirrors the accessible name
  /* Fix (auto-save): the manual save button mirrors the app's aria-label/title pattern */
  el.btnSaveNow.setAttribute('aria-label', t('saveNowButton'));
  el.btnSaveNow.title = t('saveNowButton');
  el.btnClearSearch.classList.toggle('hidden', el.inpSearch.value.length === 0);
  el.impReportTitle.textContent = t('impReportTitle');
  /* Fix (a11y audit N1): the close glyph now lives in an aria-hidden span in the markup */
  el.btnReportClose.setAttribute('aria-label', closeLbl);
  el.btnReportClose.title = closeLbl; // Fix (a11y audit I3): tooltip mirrors the accessible name
  el.inpSearch.placeholder = t('searchPh');
  el.inpSearch.setAttribute('aria-label', t('searchAria'));
  DC.sort.updateSortHeaders(); // Fix (sortable columns): labels, indicators and aria-sort (also refreshes on language switch)
  el.itemCount.textContent = t('itemCount', { n: state.items.length });
  el.lblExport.textContent = t('download');
  el.lblImport.textContent = t('upload');
  el.skipLink.textContent = t('skipToMain');
  /* Fix (settings): the standalone language selector was replaced by the settings
     gear; its labels/options are refreshed by applySettingsText() at the end. */
  el.stockListTitle.textContent = t('stockListTitle'); // Fix (Phase 3): sr-only h2 label
  el.lblImportFile.textContent = t('importFileLbl'); // Fix (Phase 3): sr-only file-input label
  el.pagination.setAttribute('aria-label', t('paginationAria')); // Fix (Phase 3): nav keeps its label even while hidden (renderPagination refreshes it when shown)
  el.lblAmount.textContent = t('amount'); // Fix (Phase 4): Amount label + column header
  el.colAmount.textContent = t('amount');
  el.lblCategory.textContent = t('category'); // Fix (category): Add-form field label
  el.selectAll.setAttribute('aria-label', t('selectAllAria')); // Fix (batch select)
  /* Fix (bulk edit): modal field labels — each label names BOTH its checkbox (for=)
     and its input (aria-labelledby), satisfying "all inputs must have labels" */
  el.bulkLblName.textContent = t('bulkFieldName');
  el.bulkLblLoc.textContent = t('locLbl');
  el.bulkLblAmount.textContent = t('amount');
  el.bulkLblCategory.textContent = t('category'); // Fix (category): reuses the field-label key, like locLbl/amount
  /* Fix (new category modal): title, label, helper text and buttons follow the language */
  el.catModalTitle.textContent = t('catModalTitle');
  el.catModalLbl.textContent = t('category');
  el.catModalHint.textContent = t('catModalHint');
  el.catModalCancel.textContent = t('cancel');
  el.catModalSave.textContent = t('save');
  el.disclaimerText.textContent = t('disclaimer');
  el.nameSuggest.setAttribute('aria-label', t('suggestAria'));
  el.ghLink.setAttribute('aria-label', t('githubAria'));
  el.ghLink.title = t('githubAria');
  syncThemeToggle();
  el.btnShortcuts.setAttribute('aria-label', t('shortcutsAria'));
  el.btnShortcuts.title = t('shortcutsAria');
  el.hintAddJump.textContent = t('hintAddJump');
  el.hintAddJump.classList.toggle('hidden', !hasDepot);
  DC.settings.applySettingsText(); // Fix (settings): labels + options for the settings modal
  DC.category.refreshCategorySelects(); // Fix (category dropdown): re-localize + re-derive the option lists
}
function makeCell(text, cls){
  var d = document.createElement('div');
  d.className = cls;
  d.textContent = text; // textContent => XSS-safe
  return d;
}
/* Fix (batch select): leading checkbox cell for a row. In edit mode the checkbox is
   disabled (the row cannot be selected while being edited). */
function makeCheckCell(it, disabled){
  var wrap = document.createElement('div');
  wrap.className = 'check';
  var cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'row-check';
  cb.setAttribute('data-id', String(it.id));
  cb.checked = !!state.selectedIds[it.id];
  if (disabled) cb.disabled = true;
  cb.setAttribute('aria-label', t('selectItemAria', { name: it.name, location: it.location || '\u2014' }));
  cb.addEventListener('change', function(){ DC.batch.toggleSelect(it.id); });
  wrap.appendChild(cb);
  return wrap;
}
function renderList(){
  var body = el.listBody;
  body.innerHTML = '';
  DC.batch.syncBatchUI(); // Fix (batch select): prune selection to the visible page + sync select-all/button
  var dep = activeDepot();
  if (!dep){
    // No depot exists at all
    var nd = document.createElement('div');
    nd.className = 'empty-state';
    nd.textContent = t('noDepotMsg');
    body.appendChild(nd);
    hidePagination();
    return;
  }
  if (dep.items.length === 0){
    var empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = t('emptyList', { depotName: dep.name });
    body.appendChild(empty);
    hidePagination();
    return;
  }
  var filtered = getFilteredItems();
  if (filtered.length === 0){
    var none = document.createElement('div');
    none.className = 'empty-state';
    none.textContent = t('noResults', { query: state.filter.trim() });
    body.appendChild(none);
    hidePagination();
    return;
  }
  var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;   // self-heal after delete
  if (state.page < 1) state.page = 1;
  var startIdx = (state.page - 1) * state.pageSize;
  filtered.slice(startIdx, startIdx + state.pageSize).forEach(function(it){
    if (it.id === state.editingId){
      body.appendChild(DC.inlineEdit.buildEditRow(it));
      return;
    }
    var row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('role', 'listitem'); // a11y: list semantics (see #listBody comment)
    row.setAttribute('data-id', String(it.id)); // a11y: enables focus return after inline save/cancel
    row.appendChild(makeCheckCell(it)); // Fix (batch select): leading checkbox
    row.appendChild(makeCell(it.name, 'name'));
    // Fix (dash for empty location): display-only placeholder; storage keeps ''
    row.appendChild(makeCell(it.location || '-', 'loc'));
    // Fix (field order): Category cell now precedes Amount. Empty category shows "-"
    // (display only; the stored value stays ''). Same rule as an empty Location.
    row.appendChild(makeCell(it.category || '-', 'category'));
    // Fix (Phase 4): Amount cell with sr-only prefix so SR users hear "Amount: 3"
    var amtCell = document.createElement('div');
    amtCell.className = 'amount';
    var amtLbl = document.createElement('span');
    amtLbl.className = 'sr-only';
    amtLbl.textContent = t('amount') + ': ';
    amtCell.appendChild(amtLbl);
    amtCell.appendChild(document.createTextNode(String(it.amount)));
    row.appendChild(amtCell);

    var actions = document.createElement('div');
    actions.className = 'actions';

    var btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'icon-btn';
    /* Fix (a11y audit N1): decorative emoji wrapped in an aria-hidden span */
    var editIco = document.createElement('span');
    editIco.setAttribute('aria-hidden', 'true');
    editIco.textContent = '\u270F\uFE0F'; // pencil
    btnEdit.appendChild(editIco);
    /* Fix (row action tooltips): the native title mirrors the accessible name
       EXACTLY (same string) so mouse and screen reader users read the same wording */
    var editLbl = t('editAria', { name: it.name });
    btnEdit.setAttribute('aria-label', editLbl);
    btnEdit.title = editLbl;
    btnEdit.addEventListener('click', function(){ DC.inlineEdit.startEdit(it.id); });

    var btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'icon-btn del';
    /* Fix (a11y audit N1): decorative emoji wrapped in an aria-hidden span */
    var delIco = document.createElement('span');
    delIco.setAttribute('aria-hidden', 'true');
    delIco.textContent = '\uD83D\uDDD1\uFE0F'; // wastebasket
    btnDel.appendChild(delIco);
    /* Fix (row action tooltips): title mirrors the accessible name exactly */
    var delLbl = t('delAria', { name: it.name });
    btnDel.setAttribute('aria-label', delLbl);
    btnDel.title = delLbl;
    btnDel.addEventListener('click', function(){ DC.items.handleDelete(it.id); });

    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);
    row.appendChild(actions);
    body.appendChild(row);
  });
  renderPagination(totalPages);
}
function render(){
  applyStaticText();
  renderList();
}

/* Exports. */
DC.list.applyStaticText = applyStaticText;
DC.list.makeCheckCell = makeCheckCell;
DC.list.render = render;
DC.list.renderList = renderList;
})();

