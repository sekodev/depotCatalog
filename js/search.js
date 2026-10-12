/* --- js/search.js — DC.search: filter + sort pipeline --- */
(function () {
'use strict';

DC.search = DC.search || {};

/* Aliases to already-loaded modules (read once, at load time). */
var state = DC.state;

function getFilteredItems(){
  var q = state.filter.trim().toLowerCase();
  var list = state.items.slice();
  if (q){
    list = list.filter(function(it){
      /* Fix (category): search matches name, location AND category. Amount stays
         non-searchable (numbers are not part of the text filter). */
      return it.name.toLowerCase().indexOf(q) !== -1 ||
             it.location.toLowerCase().indexOf(q) !== -1 ||
             it.category.toLowerCase().indexOf(q) !== -1;
    });
  }
  /* Fix (sortable columns): apply the active sort AFTER filtering (never bypasses
     search), case-insensitive via locale-aware comparison in the current language. */
  if (state.sort.key){
    var k = state.sort.key;
    var m = (state.sort.dir === 'desc') ? -1 : 1;
    list.sort(function(x, y){ return x[k].localeCompare(y[k], state.lang) * m; });
  }
  return list;
}

/* Exports. */
DC.search.getFilteredItems = getFilteredItems;
})();

