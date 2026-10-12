/* --- js/state.js — DC.state: app state object + depot accessors --- */
(function () {
'use strict';

DC.state = DC.state || {};


/* ================= App state ================= */
var state = {
  depots: [],          // [{id, name, items:[{id,name,location,amount,category}]}]
  activeDepotId: null,
  nextDepotId: 1,
  nextItemId: 1,
  items: [],           // LIVE alias of the active depot's items (kept in sync)
  /* Fix (depot icon picker): icons live in a SEPARATE map (id -> emoji), never on the
     depot objects; depots without a custom icon are simply absent (📦 fallback). */
  depotIcons: {},
  filter: '',
  sort: { key: null, dir: null }, // Fix (sortable columns): UI state only — not persisted; reset on depot switch
  selectedIds: {}, // Fix (batch select): page-scoped selection map (id -> true); not persisted
  editingId: null,
  lang: 'en',
  /* Fix (settings): user preferences (persisted separately in localStorage) */
  fontScale: 'normal',
  iconScale: 'normal',
  page: 1,
  pageSize: 5
};

/* ================= Depot helpers ================= */
function findDepot(id){
  for (var i = 0; i < state.depots.length; i++){
    if (state.depots[i].id === id) return state.depots[i];
  }
  return null;
}
function activeDepot(){
  return findDepot(state.activeDepotId);
}
/* Keep state.items pointing at the active depot's items array so every
   existing item operation (search, edit, delete, import...) is scoped. */
function syncItemsRef(){
  var d = activeDepot();
  state.items = d ? d.items : [];
}

/* Exports. */
DC.state = state;
DC.state.activeDepot = activeDepot;
DC.state.findDepot = findDepot;
DC.state.syncItemsRef = syncItemsRef;
})();

