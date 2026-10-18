/* --- js/backup.js — DC.backup: rolling 5-snapshot auto backup --- */
(function () {
'use strict';

DC.backup = DC.backup || {};

/* Aliases to already-loaded modules (read once, at load time). */
var MAX_SNAPS = DC.const.MAX_SNAPS;
var announce = DC.announce.announce;
var showToast = DC.modal.showToast;
var state = DC.state;
var t = DC.i18n.t;


/* ================= Snapshots (rolling window of 5) ================= */
/* Snapshots are kept in ONE localStorage key as an array, newest first.
   This avoids key collisions when several mutations happen in the same
   millisecond and makes pruning trivial. */
var LS_SNAPS = 'depotCatalog.snaps.v1';
function readSnaps(){
  try {
    var arr = JSON.parse(localStorage.getItem(LS_SNAPS));
    if (!Array.isArray(arr)) return [];
    /* Fix (category): migrate snapshots on read so an old snapshot (items without a
       `category` field) is upgraded to category:"" before any consumer sees it.
       Silent — no announcements, no writes here. */
    normalizeSnapshots(arr);
    return arr;
  } catch(e){ return []; }
}
/* Fix (category): in-place, defensive normalization of a snapshot array. Anything that
   is not a string (missing key, null, number) becomes '' — the same rule loadState uses. */
function normalizeSnapshots(snaps){
  for (var s = 0; s < snaps.length; s++){
    var entry = snaps[s];
    var dps = (entry && entry.data && Array.isArray(entry.data.depots)) ? entry.data.depots : null;
    if (!dps) continue;
    for (var d = 0; d < dps.length; d++){
      var items = (dps[d] && Array.isArray(dps[d].items)) ? dps[d].items : null;
      if (!items) continue;
      for (var i = 0; i < items.length; i++){
        if (items[i] && typeof items[i].category !== 'string') items[i].category = '';
      }
    }
  }
  return snaps;
}
function writeSnaps(snaps){
  try {
    localStorage.setItem(LS_SNAPS, JSON.stringify(snaps));
    return true;
  } catch(e){ return false; }
}
function snapshotCurrentData(){
  if (!DC.store.ok) return;
  var entry = {
    ts: Date.now(),
    data: {
      version: 2,
      nextDepotId: state.nextDepotId,
      nextItemId: state.nextItemId,
      activeDepotId: state.activeDepotId,
      depots: state.depots,
      depotIcons: state.depotIcons // Fix (depot icon picker): snapshots carry the icon map too
    }
  };
  var snaps = readSnaps();
  snaps.unshift(entry);
  while (snaps.length > MAX_SNAPS) snaps.pop(); // rolling window: keep newest 5
  if (!writeSnaps(snaps)){
    // Quota likely exceeded: drop oldest snapshots and retry
    while (snaps.length > 1){
      snaps.pop();
      if (writeSnaps(snaps)) return;
    }
    showToast(t('storageWarn'), 'warn');
    announce(t('storageWarn'), true);
  }
}
function evictOldestSnapshot(){
  var snaps = readSnaps();
  if (snaps.length === 0) return false;
  snaps.pop();
  return writeSnaps(snaps);
}
/* Fix (clear actions): drop the whole rolling window. Used by Settings > Clear backup
   history / Clear all data. Removes the key entirely (so a fresh write starts a new
   window) and never creates a snapshot itself. */
function clearSnapshots(){
  try { localStorage.removeItem(LS_SNAPS); return true; }
  catch(e){ return false; }
}

/* Exports. */
DC.backup.clearSnapshots = clearSnapshots;
DC.backup.evictOldestSnapshot = evictOldestSnapshot;
DC.backup.snapshotCurrentData = snapshotCurrentData;
})();

