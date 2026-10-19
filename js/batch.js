/* --- js/batch.js — DC.batch: batch selection + delete selected --- */
(function () {
'use strict';

DC.batch = DC.batch || {};

/* Aliases to already-loaded modules (read once, at load time). */
var activeDepot = DC.state.activeDepot;
var announce = DC.announce.announce;
var askConfirm = DC.modal.askConfirm;
var el = DC.el;
var persist = DC.store.persist;
var render = DC.list.render;
var showSaveIndicator = DC.store.showSaveIndicator;
var showToast = DC.modal.showToast;
var snapshotCurrentData = DC.backup.snapshotCurrentData;
var state = DC.state;
var syncItemsRef = DC.state.syncItemsRef;
var t = DC.i18n.t;
var visiblePageItems = DC.pagination.visiblePageItems;

function countSelection(){
  return Object.keys(state.selectedIds).length;
}
/* Prune the selection to the visible page and sync the select-all checkbox +
   Delete-selected button. Runs at the top of renderList, so search, sort,
   pagination, depot switches and page jumps all keep the selection consistent. */
function syncBatchUI(){
  var vis = visiblePageItems();
  var visIds = {};
  for (var i = 0; i < vis.length; i++) visIds[vis[i].id] = true;
  Object.keys(state.selectedIds).forEach(function(id){
    if (!visIds[id]) delete state.selectedIds[id];
  });
  updateSelectAllState(vis);
  updateDeleteSelectedBtn();
}
function updateSelectAllState(vis){
  if (!el.selectAll) return;
  if (!vis) vis = visiblePageItems();
  var selCount = 0;
  for (var i = 0; i < vis.length; i++){ if (state.selectedIds[vis[i].id]) selCount++; }
  el.selectAll.disabled = (vis.length === 0);
  el.selectAll.checked = (vis.length > 0 && selCount === vis.length);
  el.selectAll.indeterminate = (selCount > 0 && selCount < vis.length); // mixed state, exposed to AT via the IDL property
}
function updateDeleteSelectedBtn(){
  /* Fix (bulk edit) + Fix (bulk icons): both batch buttons show the inline
     row-action icon (✏️/🗑️, aria-hidden) plus the live count "(N)" — no words.
     The accessible name is a descriptive aria-label that doubles as the title
     tooltip and updates with the count (also refreshed on language switch via
     render → syncBatchUI). Both are display:none at count 0, so neither is
     tab-reachable — the hidden-state requirement needs no extra code. */
  var n = countSelection();
  if (n > 0){
    el.delSelCount.textContent = String(n);
    el.editSelCount.textContent = String(n);
    var delLbl = t('bulkDeleteSelected', { count: n });
    var editLbl = t('bulkEditSelected', { count: n });
    el.btnDelSelected.setAttribute('aria-label', delLbl);
    el.btnDelSelected.title = delLbl;
    el.btnEditSelected.setAttribute('aria-label', editLbl);
    el.btnEditSelected.title = editLbl;
    el.btnDelSelected.classList.remove('hidden');
    el.btnEditSelected.classList.remove('hidden');
  } else {
    el.btnDelSelected.classList.add('hidden');
    el.btnEditSelected.classList.add('hidden');
  }
}
function toggleSelect(id){
  if (state.selectedIds[id]) delete state.selectedIds[id];
  else state.selectedIds[id] = true;
  updateSelectAllState();
  updateDeleteSelectedBtn();
  var n = countSelection();
  announce(n > 0 ? t('nSelected', { n: n }) : t('selectionCleared'));
}
function toggleSelectAll(){
  var vis = visiblePageItems();
  var allSelected = (vis.length > 0);
  for (var i = 0; i < vis.length; i++){ if (!state.selectedIds[vis[i].id]){ allSelected = false; break; } }
  for (var j = 0; j < vis.length; j++){
    if (allSelected) delete state.selectedIds[vis[j].id];
    else state.selectedIds[vis[j].id] = true;
  }
  // update the visible row checkboxes without a full re-render
  var boxes = el.listBody.querySelectorAll('.row-check');
  for (var k = 0; k < boxes.length; k++){
    boxes[k].checked = !!state.selectedIds[boxes[k].getAttribute('data-id')];
  }
  updateSelectAllState(vis);
  updateDeleteSelectedBtn();
  var n = countSelection();
  announce(n > 0 ? t('nSelected', { n: n }) : t('selectionCleared'));
}
function handleDeleteSelected(){
  var n = countSelection();
  if (n === 0) return;
  askConfirm({
    title: t('delSelectedTitle'),
    message: t('delSelectedMsg', { n: n }),
    okLabel: t('del'),
    danger: true
  }).then(function(yes){
    if (!yes) return;
    var dep = activeDepot();
    if (!dep) return;
    var sel = state.selectedIds;
    dep.items = dep.items.filter(function(it){ return !sel[it.id]; });
    syncItemsRef();
    state.selectedIds = {};
    DC.store.save(); // Fix (auto-save): shared save honors the auto-save toggle
    render();                          // renderList self-heals the page number
    showSaveIndicator();
    showToast(t('nDeleted', { n: n }), 'success');
    announce(t('nDeleted', { n: n }));
    // a11y: the trigger button hides once the selection is gone — move focus to search
    if (el.btnDelSelected.classList.contains('hidden')){ try { el.inpSearch.focus(); } catch(e){} }
  });
}

/* Exports. */
DC.batch.countSelection = countSelection;
DC.batch.handleDeleteSelected = handleDeleteSelected;
DC.batch.syncBatchUI = syncBatchUI;
DC.batch.toggleSelect = toggleSelect;
DC.batch.toggleSelectAll = toggleSelectAll;
})();

