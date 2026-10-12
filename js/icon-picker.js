/* --- js/icon-picker.js — DC.icons: depot icon picker --- */
(function () {
'use strict';

DC.icons = DC.icons || {};

/* Aliases to already-loaded modules (read once, at load time). */
var announce = DC.announce.announce;
var applyFavicon = DC.favicon.applyFavicon;
var el = DC.el;
var persist = DC.store.persist;
var showSaveIndicator = DC.store.showSaveIndicator;
var snapshotCurrentData = DC.backup.snapshotCurrentData;
var state = DC.state;
var t = DC.i18n.t;


/* ================= Depot icon picker (Fix: depot icon picker) ================= */
/* Icons live in state.depotIcons (id -> emoji); a depot with no entry uses the 📦
   fallback. Selecting 📦 REMOVES the entry (keeps the map clean — documented choice).
   Keys are unaffected by switches; deleting a depot drops its entry, and the favicon
   is regenerated from the active depot's emoji (canvas -> data URL). */
var DEPOT_EMOJIS = ['📦','📚','💊','🧰','🔧','👕','🧸','🎨','📎','💻','📱','🎮','🍎','🍳','🧴','🪴','🪑','🚗','🏷️','📁'];
var ICON_NAME_KEYS = {
  '📦':'icoPkg','📚':'icoBooks','💊':'icoMedicine','🧰':'icoToolbox','🔧':'icoTools',
  '👕':'icoClothing','🧸':'icoToys','🎨':'icoArt','📎':'icoOffice','💻':'icoElectronics',
  '📱':'icoPhones','🎮':'icoGaming','🍎':'icoFood','🍳':'icoKitchen','🧴':'icoToiletries',
  '🪴':'icoPlants','🪑':'icoFurniture','🚗':'icoAuto','🏷️':'icoMisc','📁':'icoDocuments'
};
var DEFAULT_DEPOT_ICON = '📦';
var iconPickerReturnFocus = null;
var iconPickerPending = null; // Fix (icon picker save/cancel): pending selection, committed by Save only
function depotIconOf(id){
  return (id != null && state.depotIcons && state.depotIcons[id]) ? state.depotIcons[id] : DEFAULT_DEPOT_ICON;
}
function iconName(emoji){
  var key = ICON_NAME_KEYS[emoji];
  return key ? t(key) : emoji;
}
function syncDepotIconUI(){
  if (el.depotIconEmoji) el.depotIconEmoji.textContent = depotIconOf(state.activeDepotId);
  if (el.btnDepotIcon){
    var iconLbl = t('iconButtonLabel');
    el.btnDepotIcon.setAttribute('aria-label', iconLbl);
    el.btnDepotIcon.title = iconLbl; // Fix (a11y audit I3): tooltip mirrors the accessible name
  }
}
function renderIconGrid(){
  /* Applied icon keeps the subtle .applied outline; the PENDING choice gets the
     strong .selected highlight. Both can be the same tile when pending === applied. */
  el.iconGrid.innerHTML = '';
  var applied = depotIconOf(state.activeDepotId);
  var pending = iconPickerPending;
  DEPOT_EMOJIS.forEach(function(em, idx){
    var b = document.createElement('button');
    b.type = 'button';
    var isSel = (em === pending);
    b.className = 'icon-pick' + (em === applied ? ' applied' : '') + (isSel ? ' selected' : '');
    /* Fix (a11y audit N1): decorative emoji wrapped in an aria-hidden span */
    var ico = document.createElement('span');
    ico.setAttribute('aria-hidden', 'true');
    ico.textContent = em;
    b.appendChild(ico);
    b.setAttribute('data-idx', String(idx));
    var nm = iconName(em);
    var lbl = nm + (em === applied ? t('iconCurrentSuffix') : '') + (isSel ? t('iconSelectedSuffix') : '');
    b.setAttribute('aria-label', lbl);
    b.title = lbl; // Fix (a11y audit N2): tooltip mirrors the accessible name
    b.setAttribute('aria-pressed', isSel ? 'true' : 'false'); // pending state for screen readers
    if (em === applied) b.setAttribute('aria-current', 'true'); // applied state
    b.addEventListener('click', function(){ selectPendingIcon(em); });
    el.iconGrid.appendChild(b);
  });
}
function selectPendingIcon(emoji){
  /* Fix (icon picker save/cancel): clicking a tile only marks it as pending —
     the modal stays open so the user can compare options before Save. */
  iconPickerPending = emoji;
  // Update tiles IN PLACE so keyboard focus stays on the clicked button
  var tiles = el.iconGrid.querySelectorAll('.icon-pick');
  var applied = depotIconOf(state.activeDepotId);
  for (var i = 0; i < tiles.length; i++){
    var em = tiles[i].textContent;
    var isSel = (em === emoji);
    tiles[i].classList.toggle('selected', isSel);
    tiles[i].setAttribute('aria-pressed', isSel ? 'true' : 'false');
    var nm = iconName(em);
    var lbl = nm + (em === applied ? t('iconCurrentSuffix') : '') + (isSel ? t('iconSelectedSuffix') : '');
    tiles[i].setAttribute('aria-label', lbl);
    tiles[i].title = lbl; // Fix (a11y audit N2): keep the tooltip in sync
  }
  announce(t('iconSelectedAnnouncement', { emojiName: iconName(emoji) })); // polite
}
function savePendingIcon(){
  var emoji = (iconPickerPending != null) ? iconPickerPending : depotIconOf(state.activeDepotId);
  var id = state.activeDepotId;
  if (id == null){ closeIconPicker(); return; }
  /* Save is ALWAYS enabled (documented choice): when pending === applied it simply
     closes without writing — no redundant snapshot or "changed" announcement. */
  if (emoji !== depotIconOf(id)){
    if (emoji === DEFAULT_DEPOT_ICON){
      delete state.depotIcons[id]; // 📦 removes the entry (fallback applies)
    } else {
      state.depotIcons[id] = emoji;
    }
    persist();
    snapshotCurrentData(); // auto-backup snapshot
    syncDepotIconUI();     // title icon button updates
    applyFavicon();        // dynamic favicon updates
    showSaveIndicator();
    announce(t('iconChanged', { emojiName: iconName(emoji) }));
  }
  closeIconPicker();
}
/* Fix (CSV icon metadata): programmatic setter used by the CSV importer. Writes the map,
   refreshes the header icon and the favicon, and stays deliberately silent — the importer
   reports through the post-import notice and its own save indicator. 📦 removes the entry,
   exactly like the picker, so the map only ever holds CUSTOM icons. */
function setDepotIcon(depotId, emoji){
  if (depotId == null || !emoji) return;
  if (emoji === DEFAULT_DEPOT_ICON){
    delete state.depotIcons[depotId];
  } else {
    state.depotIcons[depotId] = emoji;
  }
  syncDepotIconUI();
  applyFavicon();
}
function openIconPicker(){
  el.iconPickerTitle.textContent = t('iconPickerTitle');
  el.iconPickerSave.textContent = t('iconPickerSave');
  el.iconPickerCancel.textContent = t('iconPickerCancel');
  el.iconGrid.setAttribute('aria-label', t('iconPickerTitle'));
  iconPickerPending = depotIconOf(state.activeDepotId); // pending starts equal to the applied icon
  renderIconGrid();
  iconPickerReturnFocus = document.activeElement;
  el.iconPickerOverlay.classList.remove('hidden');
  var target = el.iconGrid.querySelector('.icon-pick.selected') || el.iconGrid.querySelector('.icon-pick');
  if (target){ try { target.focus(); } catch(e){} } // a11y: focus the pending emoji (or the first)
}
function closeIconPicker(){
  el.iconPickerOverlay.classList.add('hidden');
  iconPickerPending = null; // Fix (icon picker save/cancel): Cancel/Escape discard the pending choice
  /* Fix: the picker is always opened from the icon button, so focus returns there
     deterministically (spec §6); the captured element is only a fallback. */
  var back = el.btnDepotIcon || iconPickerReturnFocus;
  iconPickerReturnFocus = null;
  if (back && back.focus){ try { back.focus(); } catch(e){} }
}
function chooseDepotIcon(emoji){
  /* Superseded by selectPendingIcon + savePendingIcon (Fix: icon picker save/cancel);
     kept as a thin apply helper so the two-phase flow stays the only entry point. */
  iconPickerPending = emoji;
  savePendingIcon();
}
function iconPickerKeydown(ev){
  if (ev.key === 'Tab'){
    // Focus trap: Tab cycles through the 20 emoji buttons and Close, in DOM order
    var f = el.iconPickerOverlay.querySelectorAll('button:not([disabled]):not(.hidden)');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (ev.shiftKey){
      if (document.activeElement === first || document.activeElement === el.iconPickerOverlay){
        ev.preventDefault(); last.focus();
      }
    } else if (document.activeElement === last){
      ev.preventDefault(); first.focus();
    }
    return;
  }
  // Optional enhancement: arrow keys move between the 4-column grid cells
  var cols = 4, k = ev.key;
  if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'ArrowUp' && k !== 'ArrowDown') return;
  var ae = document.activeElement;
  var idx = parseInt((ae && ae.getAttribute) ? (ae.getAttribute('data-idx') || '-1') : '-1', 10);
  if (idx < 0) return;
  var next = idx;
  if (k === 'ArrowLeft') next = idx - 1;
  else if (k === 'ArrowRight') next = idx + 1;
  else if (k === 'ArrowUp') next = idx - cols;
  else next = idx + cols;
  if (next < 0 || next >= DEPOT_EMOJIS.length) return;
  ev.preventDefault();
  var btns = el.iconGrid.querySelectorAll('.icon-pick');
  if (btns[next]) btns[next].focus();
}

/* Exports. */
DC.icons.closeIconPicker = closeIconPicker;
DC.icons.depotIconOf = depotIconOf;
DC.icons.iconPickerKeydown = iconPickerKeydown;
DC.icons.openIconPicker = openIconPicker;
DC.icons.savePendingIcon = savePendingIcon;
DC.icons.setDepotIcon = setDepotIcon;
DC.icons.syncDepotIconUI = syncDepotIconUI;
})();

