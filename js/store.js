/* --- js/store.js — DC.store: localStorage persistence + save indicator --- */
(function () {
'use strict';

DC.store = DC.store || {};

/* Aliases to already-loaded modules (read once, at load time). */
var LS_DATA = DC.const.LS_DATA;
var LS_LEGACY = DC.const.LS_LEGACY;
/* Fix (auto-save persistence): the auto-save preference key. Kept local to this module
   (the same pattern backup.js uses for LS_SNAPS) because no other module reads it. */
var LS_AUTOSAVE = 'depotCatalog.autoSave';
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
/* The normal "Saving… → Saved." flash. Always runs regardless of the auto-save toggle,
   because the Save-now button and the toggle-ON path need it even while auto-save is off. */
function showSavedIndicator(){
  if (!DC.store.ok) return;
  clearTimeout(savePhase1Timer);
  clearTimeout(savePhase2Timer);
  /* Fix (clear actions): a real save supersedes the persistent unsaved state */
  el.saveIndicator.classList.remove('save-indicator--unsaved');
  el.btnSaveNow.classList.add('hidden'); // Fix (auto-save): a real save hides the manual button
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
function showSaveIndicator(){
  if (!DC.store.ok) return;
  /* Fix (auto-save): with auto-save OFF nothing was written to storage, so "Saving… /
     Saved." would be a lie — show the persistent unsaved state instead. */
  if (!DC.store.autoSave){ showUnsavedIndicator(); return; }
  showSavedIndicator();
}
/* Fix (clear actions): persistent "Changes not saved." state. Shown after an action
   that intentionally leaves no snapshot behind (Clear backup history / Clear all data).
   Deliberately does NOT fade out: it stays visible until the next real save runs
   showSaveIndicator() above. The phase timers are cleared so a pending fade-out from a
   previous save cannot hide it. */
function showUnsavedIndicator(){
  if (!DC.store.ok) return;
  clearTimeout(savePhase1Timer);
  clearTimeout(savePhase2Timer);
  el.saveIndicator.classList.add('show', 'save-indicator--unsaved');
  el.saveIndText.textContent = t('changesNotSaved');
  el.btnSaveNow.classList.remove('hidden'); // Fix (auto-save): offer the manual save
  announce(t('changesNotSaved'));
}

/* ================= Auto-save (Fix (auto-save)) ================= */
/* Fix (auto-save persistence): the preference is now persisted under its own key, so a
   user who turns auto-save OFF keeps it OFF across reloads. Stored as '1' (ON) / '0' (OFF);
   a missing key means the factory default, ON. Anything unrecognised (corrupt or
   hand-edited) also falls back to ON and is rewritten, so the key cannot stay invalid.
   The read mirrors the try/catch convention of the other preference reads (readScale in
   settings.js, detectLang in i18n.js). */
function readAutoSave(){
  var raw = null;
  try { raw = localStorage.getItem(LS_AUTOSAVE); } catch(e){ return true; } // unreadable -> default
  if (raw === '0') return false;
  if (raw === '1' || raw === null) return true; // missing key -> factory default ON
  try { localStorage.setItem(LS_AUTOSAVE, '1'); } catch(e){} // repair the invalid value
  return true;
}
/* Read once at load time, before any module can look at the flag. The switch's
   aria-checked is then driven from it by syncAutoSaveToggle() during init's render()
   (init -> render -> applyStaticText -> applySettingsText), so the restored value is
   reflected without any user interaction. */
DC.store.autoSave = readAutoSave();
var unsavedData = false;        // in-memory data changes not yet written to storage
var beforeUnloadAttached = false;
/* Shared mutation save used by every data mutation handler.
   Auto-save ON  -> write the data + take a snapshot (unchanged behaviour).
   Auto-save OFF -> hold everything in memory and flag the unsaved state. */
function save(){
  if (DC.store.autoSave){
    persist();
    DC.backup.snapshotCurrentData(); // call-time forward ref (backup.js loads after store.js)
    unsavedData = false;
    syncBeforeUnload();
    return true;
  }
  unsavedData = true;
  syncBeforeUnload();
  return false;
}
/* Force a write regardless of the toggle: the Save-now button and switching auto-save
   back ON. The clear/reset actions in settings.js call persist() directly instead. */
function saveNow(){
  var ok = persist();
  if (ok) DC.backup.snapshotCurrentData();
  if (ok) unsavedData = false;
  syncBeforeUnload();
  return ok;
}
function hasUnsavedChanges(){ return unsavedData; }
/* The deliberate clear actions persist directly (bypassing the toggle). When the written
   state matches the in-memory state again the unsaved flag must be dropped, so the
   beforeunload warning detaches. Used by Clear all data; Clear backup history and Reset
   to defaults leave it alone (they do not write pending data changes). */
function markSaved(){ unsavedData = false; syncBeforeUnload(); }
function setAutoSave(on){
  DC.store.autoSave = !!on;
  /* Fix (auto-save persistence): write the choice ('1' ON / '0' OFF). A failed write is
     swallowed on purpose: the in-memory flag and the switch still update, only persistence
     is lost for this session. Silent by design — a failed preference write is not worth
     interrupting the user with an error (same convention as the theme/font/icon writes). */
  try { localStorage.setItem(LS_AUTOSAVE, DC.store.autoSave ? '1' : '0'); } catch(e){}
  /* Fix (auto-save switch): re-sync the switch UI from the flag in one place, so every
     state change (user toggle or programmatic) keeps the control consistent. Call-time
     forward ref: settings.js loads after store.js. */
  if (DC.settings && DC.settings.syncAutoSaveToggle) DC.settings.syncAutoSaveToggle();
  syncBeforeUnload();
}
/* Native "unsaved changes" prompt — only while auto-save is OFF and there are real
   in-memory data changes (a merely missing snapshot must not trigger it). */
function onBeforeUnload(ev){
  ev.preventDefault();
  ev.returnValue = ''; // required by Chrome to show the prompt
  return '';
}
function syncBeforeUnload(){
  var need = (!DC.store.autoSave) && unsavedData;
  if (need && !beforeUnloadAttached){
    window.addEventListener('beforeunload', onBeforeUnload);
    beforeUnloadAttached = true;
  } else if (!need && beforeUnloadAttached){
    window.removeEventListener('beforeunload', onBeforeUnload);
    beforeUnloadAttached = false;
  }
}

/* Exports. */
DC.store.checkStorage = checkStorage;
DC.store.hasUnsavedChanges = hasUnsavedChanges;
DC.store.loadState = loadState;
DC.store.markSaved = markSaved;
DC.store.persist = persist;
DC.store.save = save;
DC.store.saveNow = saveNow;
DC.store.setAutoSave = setAutoSave;
DC.store.showSaveIndicator = showSaveIndicator;
DC.store.showSavedIndicator = showSavedIndicator;
DC.store.showUnsavedIndicator = showUnsavedIndicator;
})();

