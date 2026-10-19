/* --- js/settings.js — DC.settings: settings dialog --- */
(function () {
'use strict';

DC.settings = DC.settings || {};

/* Aliases to already-loaded modules (read once, at load time). */
var LANGUAGES = DC.i18n.LANGUAGES;
var LS_DATA = DC.const.LS_DATA;     // Fix (clear actions)
var LS_FONT = DC.const.LS_FONT;
var LS_ICON = DC.const.LS_ICON;
var LS_LANG = DC.const.LS_LANG;
var LS_LEGACY = DC.const.LS_LEGACY; // Fix (clear actions)
var announce = DC.announce.announce;
var applyFavicon = DC.favicon.applyFavicon;       // Fix (clear actions)
var askConfirm = DC.modal.askConfirm;
var clearSnapshots = DC.backup.clearSnapshots;    // Fix (clear actions)
var detectLangFromDevice = DC.i18n.detectLangFromDevice;
var el = DC.el;
var getLang = DC.i18n.getLang;
var hasUnsavedChanges = DC.store.hasUnsavedChanges; // Fix (auto-save)
var hideImportReport = DC.csv.hideImportReport;   // Fix (clear actions)
var persist = DC.store.persist;                   // Fix (clear actions)
var render = DC.list.render;
var saveNow = DC.store.saveNow;                   // Fix (auto-save)
var setAutoSave = DC.store.setAutoSave;           // Fix (auto-save)
var setLang = DC.i18n.setLang;
var showSavedIndicator = DC.store.showSavedIndicator; // Fix (auto-save)
var showToast = DC.modal.showToast;               // Fix (clear actions): visible success feedback
var showUnsavedIndicator = DC.store.showUnsavedIndicator; // Fix (clear actions)
var state = DC.state;
var syncItemsRef = DC.state.syncItemsRef;         // Fix (clear actions)
var t = DC.i18n.t;

/* ================= Settings (Fix: settings gear) ================= */
var SCALE_VALUES = { small: 0.9, normal: 1, large: 1.15, xl: 1.3 };
var SIZE_KEYS = { small: 'sizeSmall', normal: 'sizeNormal', large: 'sizeLarge', xl: 'sizeExtraLarge' };
var settingsLastFocused = null;
function readScale(key){
  try { var v = localStorage.getItem(key); return SCALE_VALUES[v] ? v : 'normal'; } catch(e){ return 'normal'; }
}
function applyFontScale(v){
  var k = SCALE_VALUES[v] ? v : 'normal';
  document.documentElement.style.setProperty('--app-font-scale', String(SCALE_VALUES[k]));
}
function applyIconScale(v){
  var k = SCALE_VALUES[v] ? v : 'normal';
  document.documentElement.style.setProperty('--app-icon-scale', String(SCALE_VALUES[k]));
}
/* Fix (auto-save switch): the Auto-save control is a <button role="switch">, so its state
   must be driven explicitly from the internal flag — never from browser form-state
   restoration (which is exactly why the old checkbox could disagree with the flag after a
   reload). Sets aria-checked, which is also what drives the shared `.switch` visuals. */
function syncAutoSaveToggle(){
  if (!el.setAutoSave) return;
  el.setAutoSave.setAttribute('aria-checked', String(!!DC.store.autoSave));
}
/* Refresh the settings dialog labels/options. Called from applyStaticText on every
   render, so a language switch re-localizes the dialog while it is open. */
function applySettingsText(){
  if (!el.settingsTitle) return;
  el.settingsTitle.textContent = t('settingsTitle');
  el.lblSetLang.textContent = t('languageLabel');
  el.lblSetFont.textContent = t('fontSizeLabel');
  el.lblSetIcon.textContent = t('iconSizeLabel');
  el.btnResetSettings.textContent = t('resetToDefaults');
  el.lblSetAutoSave.textContent = t('autoSaveLabel'); // Fix (auto-save)
  syncAutoSaveToggle(); // Fix (auto-save switch): keeps the switch in sync on every render,
                        // which also covers app init (init -> render -> applyStaticText)
  /* Fix (clear actions): maintenance buttons */
  el.btnClearBackup.textContent = t('clearBackupHistoryButton');
  el.btnClearAll.textContent = t('clearAllDataButton');
  el.setClose.textContent = t('close');
  el.btnSettings.setAttribute('aria-label', t('settingsButton'));
  el.btnSettings.title = t('settingsButton');
  /* language options come from the loaded blocks (label = each block's own name) */
  el.setLang.innerHTML = '';
  LANGUAGES.forEach(function(Lg){
    var o = document.createElement('option');
    o.value = Lg.code;
    o.textContent = Lg.label || Lg.code;
    el.setLang.appendChild(o);
  });
  el.setLang.value = state.lang;
  ['setFont', 'setIcon'].forEach(function(id){
    var sel = el[id];
    for (var i = 0; i < sel.options.length; i++){
      sel.options[i].textContent = t(SIZE_KEYS[sel.options[i].value]);
    }
  });
  el.setFont.value = state.fontScale;
  el.setIcon.value = state.iconScale;
}
function openSettings(){
  settingsLastFocused = document.activeElement;
  applySettingsText();
  el.settingsOverlay.classList.remove('hidden');
  /* Fix (settings focus): focus the Close button, NOT the Language <select>. Auto-focusing
     a select makes mobile browsers pop the native picker the instant the dialog opens.
     Focus still moves into the dialog and the Tab trap is untouched; Shift+Tab from Close
     walks back through Reset -> Icon -> Font -> Language, so the order is unchanged. */
  try { el.setClose.focus(); } catch(e){}
}
function closeSettings(){
  el.settingsOverlay.classList.add('hidden');
  /* Fix (settings): the gear is the only opener, so focus deterministically returns there
     (mirrors the icon picker) regardless of how the dialog was opened. */
  var back = el.btnSettings || settingsLastFocused;
  if (back && back.focus){ try { back.focus(); } catch(e){} }
  settingsLastFocused = null;
}
function settingsTabTrap(ev){
  if (ev.key !== 'Tab') return;
  var f = el.settingsOverlay.querySelectorAll('button:not([disabled]):not(.hidden),select:not([disabled]):not(.hidden)');
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (ev.shiftKey){
    if (document.activeElement === first || document.activeElement === el.settingsOverlay){ ev.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last){ ev.preventDefault(); first.focus(); }
  }
}
function onSettingsLangChange(){
  var v = el.setLang.value;
  if (!getLang(v) || v === state.lang) return;
  var label = (getLang(v) || {}).label || v;
  setLang(v); // re-renders all UI, persists the choice, updates the document title
  announce(t('languageChangedAnnouncement', { language: label }));
}
function onSettingsFontChange(){
  var v = el.setFont.value;
  state.fontScale = v;
  applyFontScale(v);
  try { localStorage.setItem(LS_FONT, v); } catch(e){}
  announce(t('fontSizeAnnouncement', { size: t(SIZE_KEYS[v]) }));
}
function onSettingsIconChange(){
  var v = el.setIcon.value;
  state.iconScale = v;
  applyIconScale(v);
  try { localStorage.setItem(LS_ICON, v); } catch(e){}
  announce(t('iconSizeAnnouncement', { size: t(SIZE_KEYS[v]) }));
}
function onResetSettings(){
  askConfirm({
    title: t('resetConfirmTitle'),
    message: t('resetConfirmBody'),
    okLabel: t('resetConfirmYes'),
    danger: true
  }).then(function(ok){
    if (!ok) return;
    /* Fix (reset toast): track whether the preference writes succeeded, so a storage
       failure can never produce a false success message. */
    var stored = true;
    state.lang = detectLangFromDevice(); // re-detect (ignores the saved preference)
    try { localStorage.removeItem(LS_LANG); } catch(e){ stored = false; }
    state.fontScale = 'normal';
    state.iconScale = 'normal';
    applyFontScale('normal');
    applyIconScale('normal');
    try { localStorage.setItem(LS_FONT, 'normal'); } catch(e){ stored = false; }
    try { localStorage.setItem(LS_ICON, 'normal'); } catch(e){ stored = false; }
    /* Fix (auto-save persistence): "reset to defaults" means everything back to factory
       defaults, so auto-save returns to ON. setAutoSave() writes '1' to LS_AUTOSAVE and
       re-syncs the switch. Its own write failure is silent by design (store.js), so it
       deliberately does not feed `stored` below. */
    setAutoSave(true);
    /* Fix (reset + auto-save): mirror the toggle-ON safety path exactly (see
       onAutoSaveToggle). Flipping auto-save ON while in-memory changes are still pending
       would otherwise disarm beforeunload with those changes unsaved, silently removing
       the tab-close prompt. Flush them first: saveNow() persists + snapshots and clears
       the unsaved flag, so beforeunload ends up disarmed because nothing is left unsaved.
       A failed flush needs no new error path — persist() already fires the existing
       storage-error path and leaves the unsaved flag set. */
    if (hasUnsavedChanges()){ saveNow(); showSavedIndicator(); }
    render(); // re-render every string in the reset language
    if (!el.settingsOverlay.classList.contains('hidden')) applySettingsText();
    /* Fix (reset toast): feedback identical to the two clear actions —
       (3) polite live-region announcement (screen readers),
       (4) visible success toast (sighted users; the toast is aria-hidden, so no double
       announcement). On a storage error, fall back to the app's existing storage-error
       path instead of claiming success. */
    if (!stored){
      showToast(t('storageWarn'), 'warn');
      announce(t('storageWarn'), true);
      return;
    }
    announce(t('settingsResetAnnouncement'));
    showToast(t('settingsResetAnnouncement'), 'success');
  });
}
/* Fix (clear actions): the live region only speaks the LAST text set within a tick, so the
   action result and the indicator's own "Changes not saved." announcement are staggered —
   result first, then the indicator state. The indicator is set in the second phase so its
   announcement is actually heard (the same phase convention the save indicator already
   uses for Saving…/Saved.). */
function announceClearResult(resultKey){
  /* Fix (clear actions): per-action feedback order —
     (3) polite live-region announcement (screen readers),
     (4) visible success toast (sighted users; aria-hidden, so no double announcement),
     (5) the persistent "Changes not saved." indicator + its own announcement. */
  announce(t(resultKey));
  showToast(t(resultKey), 'success');
  setTimeout(function(){ showUnsavedIndicator(); }, 700);
}
/* Fix (clear actions): Settings > Clear backup history.
   Removes the rolling snapshot window ONLY — catalog data, depot icons and every
   preference are untouched. Deliberately does NOT call persist() (nothing about the main
   data changed) and does NOT call snapshotCurrentData() (that would immediately recreate
   the very snapshot this action exists to remove). The save indicator switches to the
   persistent "Changes not saved." state instead. Focus returns to the triggering button
   automatically (askConfirm restores it); the Settings dialog stays open. */
function onClearBackupHistory(){
  askConfirm({
    title: t('clearBackupHistoryTitle'),
    message: t('clearBackupHistoryBody'),
    okLabel: t('clearBackupHistoryConfirm'),
    danger: true,
    focusCancel: true // focus Cancel, never the destructive button
  }).then(function(ok){
    if (!ok) return;
    /* Fix (clear actions): on a storage error fall back to the app's existing storage-error
       path (warn toast + assertive announcement) instead of claiming success. */
    if (!clearSnapshots()){
      showToast(t('storageWarn'), 'warn');
      announce(t('storageWarn'), true);
      return;
    }
    announceClearResult('clearBackupHistoryAnnouncement');
  });
}
/* Fix (clear actions): Settings > Clear all data.
   Wipes catalog data, depot icons and all snapshots; keeps language/theme/font/icon
   preferences. The cleared state IS persisted — persist() writes the fresh default depot
   to LS_DATA — so a reload cannot restore the old data. Only the *snapshot* is skipped. */
function onClearAllData(){
  askConfirm({
    title: t('clearAllDataTitle'),
    message: t('clearAllDataBody'),
    okLabel: t('clearAllDataConfirm'),
    danger: true,
    focusCancel: true
  }).then(function(ok){
    if (!ok) return;
    try { localStorage.removeItem(LS_DATA); } catch(e){}
    try { localStorage.removeItem(LS_LEGACY); } catch(e){}
    clearSnapshots(); // no snapshot is written by this path
    /* fresh-install in-memory state (mirrors init()'s fresh-start block) */
    state.depots = [{ id: 1, name: t('defaultDepotName'), items: [] }];
    state.activeDepotId = 1;
    state.nextDepotId = 2;
    state.nextItemId = 1;
    state.depotIcons = {};
    syncItemsRef();
    /* transient view state -> fresh-load values */
    state.filter = '';
    state.sort = { key: null, dir: null };
    state.selectedIds = {};
    state.editingId = null;
    state.page = 1;
    state.pageSize = 5;
    el.inpSearch.value = '';
    el.btnClearSearch.classList.add('hidden');
    el.formCard.classList.add('hidden');
    el.btnToggleAdd.classList.remove('invisible');
    hideImportReport();
    var saved = persist(); // durable cleared state (writes LS_DATA — never a snapshot)
    render();       // empty state + updated document title
    applyFavicon(); // favicon back to the default (no custom depot icon)
    /* Fix (clear actions): if persistence failed, persist() has already fired the existing
       storage-error path — never show the success toast/announcement in that case. */
    if (!saved) return;
    DC.store.markSaved(); // Fix (auto-save): the written state now matches memory
    announceClearResult('clearAllDataAnnouncement');
  });
}

/* Fix (auto-save): Settings > Auto-save switch. Turning it OFF asks for confirmation first
   (the switch stays ON until then); turning it back ON saves any pending in-memory changes
   immediately. Fix (auto-save persistence): the flag is now persisted, so the choice
   survives a reload. The control is a button, so its state is
   read from the flag and its visual state is re-synced rather than toggled via `.checked`. */
function onAutoSaveToggle(){
  if (!DC.store.autoSave){
    /* currently OFF -> switching ON: no warning, flush pending changes */
    setAutoSave(true); // also re-syncs the switch (store.js)
    if (hasUnsavedChanges()){ saveNow(); showSavedIndicator(); }
    announce(t('autoSaveEnabledAnnouncement'));
    return;
  }
  /* currently ON -> switching OFF: warn about the consequence */
  askConfirm({
    title: t('autoSaveTurnOffTitle'),
    message: t('autoSaveTurnOffBody'),
    okLabel: t('autoSaveTurnOffConfirm'),
    danger: true,
    focusCancel: true // focus Cancel, never the destructive confirm
  }).then(function(ok){
    if (!ok){ syncAutoSaveToggle(); el.setAutoSave.focus(); return; } // stays ON
    setAutoSave(false); // also re-syncs the switch (store.js)
    announce(t('autoSaveDisabledAnnouncement'));
    el.setAutoSave.focus(); // focus returns to the switch
  });
}
/* Fix (auto-save): manual save from the button beside the save indicator. Shows the
   explicit "Saved." flash because auto-save may still be OFF (showSaveIndicator() would
   route back to the persistent unsaved state in that case). */
function onSaveNow(){
  if (!saveNow()) return; // storage failure: persist() already fired the error path
  showSavedIndicator();
}

/* Exports. */
DC.settings.applyFontScale = applyFontScale;
DC.settings.applyIconScale = applyIconScale;
DC.settings.applySettingsText = applySettingsText;
DC.settings.closeSettings = closeSettings;
DC.settings.onAutoSaveToggle = onAutoSaveToggle;
DC.settings.onClearAllData = onClearAllData;
DC.settings.onClearBackupHistory = onClearBackupHistory;
DC.settings.onResetSettings = onResetSettings;
DC.settings.onSaveNow = onSaveNow;
DC.settings.onSettingsFontChange = onSettingsFontChange;
DC.settings.onSettingsIconChange = onSettingsIconChange;
DC.settings.onSettingsLangChange = onSettingsLangChange;
DC.settings.openSettings = openSettings;
DC.settings.readScale = readScale;
DC.settings.settingsTabTrap = settingsTabTrap;
DC.settings.syncAutoSaveToggle = syncAutoSaveToggle;
})();

