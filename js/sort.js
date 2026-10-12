/* --- js/sort.js — DC.sort: sortable column headers --- */
(function () {
'use strict';

DC.sort = DC.sort || {};

/* Aliases to already-loaded modules (read once, at load time). */
var announce = DC.announce.announce;
var el = DC.el;
var renderList = DC.list.renderList;
var state = DC.state;
var t = DC.i18n.t;


/* Fix (sortable columns): header state — indicator char, aria-label and aria-sort
   for both sortable headers; the inactive sortable column reports aria-sort "none". */
function updateSortHeaders(){
  /* Fix (category): three sortable headers now (Name, Location, Category). Each keeps an
     indicator char, an aria-label and aria-sort; inactive columns report "none". */
  var cols = [
    { key: 'name',     colKey: 'colName',     btn: el.btnSortName, head: el.colNameHead },
    { key: 'location', colKey: 'colLoc',      btn: el.btnSortLoc,  head: el.colLocHead },
    { key: 'category', colKey: 'colCategory', btn: el.btnSortCat,  head: el.colCategoryHead }
  ];
  cols.forEach(function(c){
    var ind = '\u2195', sort = 'none';
    var aria = t('sortAriaUnsorted', { col: t(c.colKey) });
    if (state.sort.key === c.key){
      if (state.sort.dir === 'asc'){
        ind = '\u2191'; sort = 'ascending';
        aria = t('sortAriaAsc', { col: t(c.colKey) });
      } else {
        ind = '\u2193'; sort = 'descending';
        aria = t('sortAriaDesc', { col: t(c.colKey) });
      }
    }
    c.btn.textContent = t(c.colKey) + ' ' + ind;
    c.btn.setAttribute('aria-label', aria);
    c.head.setAttribute('aria-sort', sort);
  });
}
/* Fix (sortable columns): 3-state cycle per header — unsorted -> asc -> desc -> unsorted.
   Resets pagination to page 1; announces the new state via the polite live region. */
function cycleSort(key){
  if (state.sort.key === key){
    if (state.sort.dir === 'asc'){
      state.sort.dir = 'desc';
    } else {
      state.sort.key = null;
      state.sort.dir = null;
    }
  } else {
    state.sort.key = key;
    state.sort.dir = 'asc';
  }
  state.page = 1;         // sort change resets pagination
  state.editingId = null; // the editing row may sit on another page after reordering
  // Fix (sort clears selection): consistent with search/depot/pagination clears;
  // no redundant "selection cleared" announcement — the sort announcement below suffices
  state.selectedIds = {};
  updateSortHeaders();
  renderList();
  if (state.sort.key === null){
    announce(t('sortAnnCleared'));
  } else {
    var colKey = state.sort.key === 'name' ? 'colName'
               : (state.sort.key === 'location' ? 'colLoc' : 'colCategory');
    announce(t(state.sort.dir === 'asc' ? 'sortAnnAsc' : 'sortAnnDesc', { col: t(colKey) }));
  }
}

/* Exports. */
DC.sort.cycleSort = cycleSort;
DC.sort.updateSortHeaders = updateSortHeaders;
})();

