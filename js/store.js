/* --- js/store.js — DC.store: localStorage persistence + save indicator --- */
(function () {
'use strict';

DC.store = DC.store || {};

/* Aliases to already-loaded modules (read once, at load time). */
var LS_DATA = DC.const.LS_DATA;
var LS_LEGACY = DC.const.LS_LEGACY;
var announce = DC.announce.announce;
var el = DC.el;
var showToast = DC.modal.showToast;
var state = DC.state;
var t = DC.i18n.t;

DC.store.ok = true;

/* i18n helpers (LANGUAGES, languagesValid, getLang, detectLang, t) are defined near the top */

/* ================= Store (localStorage) ================= */
function persist(){
  if (!DC.store.ok) return true; // in-memory only
  var payload = JSON.stringify({
    version: 2,
    nextDepotId: state.nextDepotId,
    nextItemId: state.nextItemId,
    activeDepotId: state.activeDepotId,
    depots: state.depots,
    depotIcons: state.depotIcons // Fix (depot icon picker): separate id -> emoji map
  });
  try {
    localStorage.setItem(LS_DATA, payload);
    try { localStorage.removeItem(LS_LEGACY); } catch(e2){} // migrated away
    return true;
  } catch(e){
    // Quota likely exceeded: evict old snapshots and retry once
    if (DC.backup.evictOldestSnapshot()){
      try { localStorage.setItem(LS_DATA, payload); return true; } catch(e2){}
    }
    showToast(t('storageWarn'), 'warn');
    announce(t('storageWarn'), true);
    return false;
  }
}
/* Load multi-depot state; migrates the legacy flat structure once. */
function loadState(){
  // 1) current multi-depot format
  try {
    var raw = localStorage.getItem(LS_DATA);
    if (raw){
      var d = JSON.parse(raw);
      if (d && d.version === 2 && Array.isArray(d.depots)){
        var depots = [], maxDepot = 0, maxItem = 0;
        for (var i = 0; i < d.depots.length; i++){
          var dp = d.depots[i];
          if (!dp || typeof dp.name !== 'string') continue;
          var items = [];
          if (Array.isArray(dp.items)){
            for (var j = 0; j < dp.items.length; j++){
              var it = dp.items[j];
              if (!it || typeof it.name !== 'string') continue;
              var rec = {
                id: (typeof it.id === 'number' && isFinite(it.id)) ? it.id : null,
                name: String(it.name).slice(0, 200),
                location: (typeof it.location === 'string') ? String(it.location).slice(0, 200) : '',
                /* Fix (Phase 4): migrate missing/invalid amount to 1 — silent, no
                   announcements (loadState runs before any UI). Format stays v2:
                   amount is an additive, optional field. */
                amount: (typeof it.amount === 'number' && isFinite(it.amount) && it.amount >= 0 && it.amount % 1 === 0) ? it.amount : 1,
                /* Fix (category): migrate missing/invalid category to '' — silent,
                   additive optional field (same pattern as amount) */
                category: (typeof it.category === 'string') ? String(it.category).slice(0, 200) : ''
              };
              if (rec.id !== null && rec.id > maxItem) maxItem = rec.id;
              items.push(rec);
            }
          }
          var depId = (typeof dp.id === 'number' && isFinite(dp.id)) ? dp.id : null;
          if (depId !== null && depId > maxDepot) maxDepot = depId;
          depots.push({ id: depId, name: String(dp.name).slice(0, 60), items: items });
        }
        var nextItemId = (typeof d.nextItemId === 'number' && d.nextItemId > maxItem) ? d.nextItemId : maxItem + 1;
        depots.forEach(function(dp2){
          if (dp2.id === null) dp2.id = nextItemId++; // degenerate but harmless
          dp2.items.forEach(function(r){ if (r.id === null) r.id = nextItemId++; });
        });
        var active = (typeof d.activeDepotId === 'number' && findDepotIn(depots, d.activeDepotId))
          ? d.activeDepotId : (depots.length ? depots[0].id : null);
        /* Fix (depot icon picker): sanitize the icon map; missing/invalid entries are
           dropped (old data without the map simply yields {}) */
        var icons = {};
        if (d.depotIcons && typeof d.depotIcons === 'object'){
          Object.keys(d.depotIcons).forEach(function(k){
            var v = d.depotIcons[k];
            var idn = parseInt(k, 10);
            if (isFinite(idn) && typeof v === 'string' && v.length > 0 && v.length <= 8) icons[idn] = v;
          });
        }
        return {
          ok: true,
          data: {
            depots: depots,
            activeDepotId: active,
            nextDepotId: (typeof d.nextDepotId === 'number' && d.nextDepotId > maxDepot) ? d.nextDepotId : maxDepot + 1,
            nextItemId: nextItemId,
            depotIcons: icons
          }
        };
      }
    }
  } catch(e){ /* fall through to legacy */ }
  // 2) legacy flat structure -> migrate into a single default depot
  try {
    var legacy = localStorage.getItem(LS_LEGACY);
    if (legacy){
      var old = JSON.parse(legacy);
      if (old && Array.isArray(old.items)){
        var items = [], maxId = 0;
        for (var k = 0; k < old.items.length; k++){
          var oit = old.items[k];
          if (!oit || typeof oit.name !== 'string') continue;
          var orec = {
            id: (typeof oit.id === 'number' && isFinite(oit.id)) ? oit.id : null,
            name: String(oit.name).slice(0, 200),
            location: (typeof oit.location === 'string') ? String(oit.location).slice(0, 200) : '',
            amount: 1, // Fix (Phase 4): legacy items had no amount — default silently
            category: '' // Fix (category): legacy items had no category — default silently
          };
          if (orec.id !== null && orec.id > maxId) maxId = orec.id;
          items.push(orec);
        }
        var nextItemId = (typeof old.nextId === 'number' && old.nextId > maxId) ? old.nextId : maxId + 1;
        items.forEach(function(r){ if (r.id === null) r.id = nextItemId++; });
        var depotName = t('defaultDepotName');
        return {
          ok: true,
          migrated: true,
          data: {
            depots: [{ id: 1, name: depotName, items: items }],
            activeDepotId: 1,
            nextDepotId: 2,
            nextItemId: nextItemId,
            depotIcons: {} // Fix (depot icon picker): legacy data has no icons
          }
        };
      }
    }
  } catch(e){ /* fall through to fresh */ }
  return { ok: true, empty: true };
}
function findDepotIn(depots, id){
  for (var i = 0; i < depots.length; i++){
    if (depots[i].id === id) return true;
  }
  return false;
}
function checkStorage(){
  try {
    var k = '__dc_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    DC.store.ok = true;
  } catch(e){
    DC.store.ok = false;
  }
}


/* ================= Save indicator ================= */
var savePhase1Timer = null;
var savePhase2Timer = null;
function showSaveIndicator(){
  if (!DC.store.ok) return;
  clearTimeout(savePhase1Timer);
  clearTimeout(savePhase2Timer);
  el.saveIndicator.classList.add('show');
  el.saveIndText.textContent = t('saving');
  announce(t('saving'));
  savePhase1Timer = setTimeout(function(){
    el.saveIndText.textContent = t('saved');
    announce(t('saved'));
    savePhase2Timer = setTimeout(function(){
      el.saveIndicator.classList.remove('show');
    }, 3000);
  }, 700);
}

/* Exports. */
DC.store.checkStorage = checkStorage;
DC.store.loadState = loadState;
DC.store.persist = persist;
DC.store.showSaveIndicator = showSaveIndicator;
})();

