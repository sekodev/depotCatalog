/* --- js/app.js — DC.app: event wiring + init() --- */
(function () {
'use strict';

DC.app = DC.app || {};

/* Aliases to already-loaded modules (read once, at load time). */
var LS_FONT = DC.const.LS_FONT;
var LS_ICON = DC.const.LS_ICON;
var announce = DC.announce.announce;
var applyFavicon = DC.favicon.applyFavicon;
var applyFontScale = DC.settings.applyFontScale;
var applyIconScale = DC.settings.applyIconScale;
var applyStaticText = DC.list.applyStaticText;
var applyTheme = DC.theme.applyTheme;
var autoCapitalizeFirst = DC.input.autoCapitalizeFirst;
var bulkFocusAfterClose = DC.bulk.bulkFocusAfterClose;
var bulkIsOpen = DC.bulk.bulkIsOpen;
var bulkTabTrap = DC.bulk.bulkTabTrap;
var bulkToggleInputs = DC.bulk.bulkToggleInputs;
var cancelCategoryModal = DC.category.cancelCategoryModal;
var catModalIsOpen = DC.category.catModalIsOpen;
var checkStorage = DC.store.checkStorage;
var closeBulk1 = DC.bulk.closeBulk1;
var closeBulk2 = DC.bulk.closeBulk2;
var closeBulk3 = DC.bulk.closeBulk3;
var closeConfirm = DC.modal.closeConfirm;
var closeDepotMenu = DC.depot.closeDepotMenu;
var closeIconPicker = DC.icons.closeIconPicker;
var closeSettings = DC.settings.closeSettings;
var closeShortcuts = DC.shortcuts.closeShortcuts;
var countSelection = DC.batch.countSelection;
var currentTheme = DC.theme.currentTheme;
var cycleSort = DC.sort.cycleSort;
var depotMenuIsOpen = DC.depot.depotMenuIsOpen;
var detectLang = DC.i18n.detectLang;
var el = DC.el;
var getFilteredItems = DC.search.getFilteredItems;
var handleBulkApply = DC.bulk.handleBulkApply;
var handleBulkContinue = DC.bulk.handleBulkContinue;
var handleDeleteSelected = DC.batch.handleDeleteSelected;
var handleEditSelected = DC.bulk.handleEditSelected;
var handleExport = DC.csv.handleExport;
var handleFormSubmit = DC.items.handleFormSubmit;
var handleImportFile = DC.csv.handleImportFile;
var handleLocationInput = DC.input.handleLocationInput;
var handleNameInput = DC.input.handleNameInput;
var hideImportReport = DC.csv.hideImportReport;
var hideSuggestions = DC.input.hideSuggestions;
var iconPickerKeydown = DC.icons.iconPickerKeydown;
var languagesValid = DC.i18n.languagesValid;
var loadState = DC.store.loadState;
var onAutoSaveToggle = DC.settings.onAutoSaveToggle;         // Fix (auto-save)
var onClearAllData = DC.settings.onClearAllData;             // Fix (clear actions)
var onClearBackupHistory = DC.settings.onClearBackupHistory; // Fix (clear actions)
var onResetSettings = DC.settings.onResetSettings;
var onSaveNow = DC.settings.onSaveNow;                       // Fix (auto-save)
var onSettingsFontChange = DC.settings.onSettingsFontChange;
var onSettingsIconChange = DC.settings.onSettingsIconChange;
var onSettingsLangChange = DC.settings.onSettingsLangChange;
var openDepotMenu = DC.depot.openDepotMenu;
var openIconPicker = DC.icons.openIconPicker;
var openSettings = DC.settings.openSettings;
var openShortcuts = DC.shortcuts.openShortcuts;
var persist = DC.store.persist;
var readScale = DC.settings.readScale;
var render = DC.list.render;
var renderList = DC.list.renderList;
var resetForm = DC.items.resetForm;
var saveCategoryModal = DC.category.saveCategoryModal;
var savePendingIcon = DC.icons.savePendingIcon;
var setInvalid = DC.validate.setInvalid;
var setLang = DC.i18n.setLang;
var settingsTabTrap = DC.settings.settingsTabTrap;
var setupCategorySelect = DC.category.setupCategorySelect;
var showToast = DC.modal.showToast;
var snapshotCurrentData = DC.backup.snapshotCurrentData;
var state = DC.state;
var syncItemsRef = DC.state.syncItemsRef;
var t = DC.i18n.t;
var toggleSelectAll = DC.batch.toggleSelectAll;
var toggleTheme = DC.theme.toggleTheme;


/* ================= Event wiring & init ================= */
function bindEvents(){
  el.productForm.addEventListener('submit', handleFormSubmit);
  el.btnToggleAdd.addEventListener('click', function(){
    el.formCard.classList.remove('hidden');
    el.btnToggleAdd.classList.add('invisible'); // hide but keep space => no layout shift
    el.btnToggleAdd.setAttribute('aria-expanded', 'true'); // a11y: reflect open state
    resetForm();
    el.inpName.focus();
  });
  el.btnCloseForm.addEventListener('click', function(){
    el.formCard.classList.add('hidden');
    el.btnToggleAdd.classList.remove('invisible');
    el.btnToggleAdd.setAttribute('aria-expanded', 'false'); // a11y: reflect closed state
    resetForm();
    el.btnToggleAdd.focus();
  });
  el.selPageSize.addEventListener('change', function(){
    var n = parseInt(el.selPageSize.value, 10);
    if (isNaN(n) || n < 1) return;
    state.pageSize = n;
    state.page = 1;       // page size changed => back to first page
    state.editingId = null; // editing row may not exist on the new page
    renderList();
    announce(t('itemsPerPageChanged', { n: n }));
  });
  el.inpName.addEventListener('input', handleNameInput);
  el.inpAmount.addEventListener('input', function(){ setInvalid(el.inpAmount, false); }); // Fix (a11y audit C1): typing clears
  el.inpName.addEventListener('blur', function(){ setTimeout(hideSuggestions, 120); });
  el.inpName.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      // Enter in the name field navigates to Location instead of submitting
      ev.preventDefault();
      hideSuggestions();
      el.inpLoc.focus();
      return;
    }
    if (ev.key === 'Escape') hideSuggestions();
  });
  el.inpLoc.addEventListener('input', handleLocationInput);
  /* Fix (category dropdown): Category is a <select> now — the old free-text auto-capitalize
     listener is gone (a select's .value is an option value, never a typed string). The
     first-letter rule now lives on the "new category" modal input instead. */
  setupCategorySelect(el.inpCategory);
  /* Fix (field order): keyboard flow is now Name -> Location -> Category -> Amount -> submit
     (audit #10 hardening carried forward: Enter never submits before the last field). */
  el.inpLoc.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      el.inpCategory.focus(); // Location -> Category
    }
  });
  el.inpCategory.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      if (catModalIsOpen()) return; // the "new category" modal owns Enter while it is open
      el.inpAmount.focus(); // Category -> Amount
    }
  });
  el.inpAmount.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      el.btnSubmit.click(); // Amount is last -> Enter submits the form
    }
  });
  document.addEventListener('compositionstart', function(){ DC.input.composing = true; });
  document.addEventListener('compositionend', function(){ DC.input.composing = false; });
  el.inpSearch.addEventListener('input', function(){
    state.filter = el.inpSearch.value;
    state.page = 1;         // filter changed => back to first page
    state.editingId = null; // editing row may be filtered out
    if (countSelection() > 0){ state.selectedIds = {}; announce(t('selectionCleared')); } // Fix (batch select): filter change clears selection (announced once, not per keystroke)
    el.btnClearSearch.classList.toggle('hidden', el.inpSearch.value.length === 0);
    renderList();
    var shown = state.filter.trim() ? getFilteredItems().length : state.items.length;
    el.itemCount.textContent = t('itemCount', { n: shown });
    // Debounced screen reader announcement of search result count
    clearTimeout(el.inpSearch._announceTimer);
    el.inpSearch._announceTimer = setTimeout(function(){
      if (state.filter.trim()){
        if (shown === 0) announce(t('resultsNone'));
        else announce(t('resultsFound', { n: shown }));
      }
    }, 400);
  });
  el.btnClearSearch.addEventListener('click', function(){
    el.inpSearch.value = '';
    state.filter = '';
    state.page = 1;
    state.editingId = null;
    if (countSelection() > 0){ state.selectedIds = {}; announce(t('selectionCleared')); } // Fix (batch select)
    el.btnClearSearch.classList.add('hidden');
    renderList();
    el.itemCount.textContent = t('itemCount', { n: state.items.length });
    el.inpSearch.focus();
  });
  el.btnReportClose.addEventListener('click', hideImportReport);
  el.btnTheme.addEventListener('click', function(){
    toggleTheme();
    applyStaticText(); // refresh aria-checked + labels
  });
  el.btnShortcuts.addEventListener('click', openShortcuts);
  el.ksClose.addEventListener('click', closeShortcuts);
  el.ksOverlay.addEventListener('click', function(ev){
    if (ev.target === el.ksOverlay) closeShortcuts();
  });
  // Fix: Tab focus trap for the cheat-sheet modal, mirroring #overlay (audit #3)
  el.ksOverlay.addEventListener('keydown', function(ev){
    if (ev.key !== 'Tab') return;
    var focusables = el.ksOverlay.querySelectorAll('button:not([disabled]):not(.hidden)');
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (ev.shiftKey){
      if (document.activeElement === first || document.activeElement === el.ksOverlay){
        ev.preventDefault(); last.focus();
      }
    } else {
      if (document.activeElement === last){
        ev.preventDefault(); first.focus();
      }
    }
  });
  document.addEventListener('keydown', function(ev){
    // "?" opens the cheat sheet (not when typing in inputs/textarea)
    if (ev.key === '?' && !ev.isComposing){
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT'){
        ev.preventDefault();
        openShortcuts();
      }
    }
  });
  el.pagination.addEventListener('click', function(ev){
    var b = ev.target && ev.target.closest ? ev.target.closest('.page-btn') : null;
    if (!b || b.disabled) return;
    var p = parseInt(b.getAttribute('data-page'), 10);
    if (!isNaN(p)){
      state.page = p;
      state.editingId = null; // editing row is on another page
      state.selectedIds = {}; // Fix (batch select): pagination change clears selection
      renderList();
      announce(t('pageOf', { p: p, t: Math.max(1, Math.ceil(getFilteredItems().length / state.pageSize)) }));
    }
  });
  el.btnSortName.addEventListener('click', function(){ cycleSort('name'); });
  el.btnSortLoc.addEventListener('click', function(){ cycleSort('location'); });
  el.btnSortCat.addEventListener('click', function(){ cycleSort('category'); }); // Fix (category)
  el.selectAll.addEventListener('change', toggleSelectAll); // Fix (batch select)
  el.btnDelSelected.addEventListener('click', handleDeleteSelected); // Fix (batch select)
  /* Fix (bulk edit): event wiring — trigger, checkbox↔input enable/disable,
     Enter submits step 1, per-overlay traps/backdrop/Escape are handled below */
  el.btnEditSelected.addEventListener('click', handleEditSelected);
  el.bulkChkName.addEventListener('change', bulkToggleInputs);
  el.bulkChkLoc.addEventListener('change', bulkToggleInputs);
  el.bulkChkAmount.addEventListener('change', bulkToggleInputs);
  el.bulkChkCategory.addEventListener('change', bulkToggleInputs); // Fix (category)
  /* Fix (category dropdown): bulk Category is a <select> too (its options are refreshed in
     bulkResetFields); auto-capitalize now lives on the "new category" modal input. */
  setupCategorySelect(el.bulkInpCategory);
  [el.bulkInpName, el.bulkInpLoc, el.bulkInpAmount, el.bulkInpCategory].forEach(function(inp){
    inp.addEventListener('keydown', function(ev){
      if (ev.key === 'Enter' && !ev.isComposing){
        ev.preventDefault();
        if (catModalIsOpen()) return; // the "new category" modal owns Enter while it is open
        el.bulkContinue.click(); // Enter in a bulk field submits step 1 (mirrors the depot modal)
      }
    });
    inp.addEventListener('input', function(){ setInvalid(inp, false); }); // Fix (a11y audit C1): typing clears
  });
  el.bulkContinue.addEventListener('click', handleBulkContinue);
  el.bulkCancel1.addEventListener('click', closeBulk1);
  el.bulkApply.addEventListener('click', handleBulkApply);
  el.bulkCancel2.addEventListener('click', closeBulk2); // closes both steps (spec: simpler)
  el.bulkClose3.addEventListener('click', closeBulk3);
  [el.bulkOverlay1, el.bulkOverlay2, el.bulkOverlay3].forEach(function(ov){
    ov.addEventListener('click', function(ev){
      // backdrop click cancels the whole flow
      if (ev.target === ov){ ov.classList.add('hidden'); DC.bulk.bulkPlan = null; bulkFocusAfterClose(); }
    });
    ov.addEventListener('keydown', bulkTabTrap); // a11y: Tab focus trap per visible overlay
  });
  /* Fix (new category modal): open/save/cancel, Tab trap, backdrop click, live Save state */
  el.catModalSave.addEventListener('click', saveCategoryModal);
  el.catModalCancel.addEventListener('click', cancelCategoryModal);
  el.catOverlay.addEventListener('click', function(ev){
    if (ev.target === el.catOverlay) cancelCategoryModal(); // backdrop click = cancel
  });
  el.catOverlay.addEventListener('keydown', function(ev){
    if (ev.key !== 'Tab') return;
    /* Disabled controls (the Save button before a name is typed) stay out of the trap. */
    var f = el.catOverlay.querySelectorAll('button:not([disabled]):not(.hidden),input:not([disabled]):not(.hidden)');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (ev.shiftKey){
      if (document.activeElement === first || document.activeElement === el.catOverlay){ ev.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last){ ev.preventDefault(); first.focus(); }
    }
  });
  el.catModalInput.addEventListener('input', function(){
    autoCapitalizeFirst(el.catModalInput); // same first-letter rule as Name/Location/Category
    setInvalid(el.catModalInput, false);
    el.catModalSave.disabled = el.catModalInput.value.trim() === ''; // Save needs a non-empty name
  });
  el.catModalInput.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      saveCategoryModal(); // Enter confirms, like the other input modals
    }
  });
  /* Fix (settings): the gear opens the settings dialog; controls apply live */
  el.btnSettings.addEventListener('click', openSettings);
  el.setClose.addEventListener('click', closeSettings);
  el.settingsOverlay.addEventListener('click', function(ev){
    if (ev.target === el.settingsOverlay) closeSettings(); // backdrop = close
  });
  el.settingsOverlay.addEventListener('keydown', settingsTabTrap); // a11y: Tab focus trap
  el.setLang.addEventListener('change', onSettingsLangChange);
  el.setFont.addEventListener('change', onSettingsFontChange);
  el.setIcon.addEventListener('change', onSettingsIconChange);
  el.btnResetSettings.addEventListener('click', onResetSettings);
  /* Fix (clear actions): maintenance actions in the settings dialog */
  el.btnClearBackup.addEventListener('click', onClearBackupHistory);
  el.btnClearAll.addEventListener('click', onClearAllData);
  /* Fix (auto-save): session Auto-save toggle + the manual save button */
  el.setAutoSave.addEventListener('click', onAutoSaveToggle); // Fix (auto-save switch): a <button> fires click for both Enter and Space
  el.btnSaveNow.addEventListener('click', onSaveNow);
  el.btnExport.addEventListener('click', handleExport);
  el.btnImportTrigger.addEventListener('click', function(){
    try { el.inpImport.click(); } catch(e){}
  });
  el.inpImport.addEventListener('change', function(){
    if (el.inpImport.files && el.inpImport.files[0]){
      handleImportFile(el.inpImport.files[0]);
    }
    el.inpImport.value = ''; // allow re-selecting the same file later
  });
  el.modalOk.addEventListener('click', function(){ closeConfirm(true); });
  el.modalCancel.addEventListener('click', function(){ closeConfirm(false); });
  el.modalInput.addEventListener('input', function(){ setInvalid(el.modalInput, false); }); // Fix (a11y audit C1): typing clears
  el.modalInput.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      closeConfirm(true); // Save (value is read by askInput's resolver)
    }
  });
  el.overlay.addEventListener('click', function(ev){
    if (ev.target === el.overlay) closeConfirm(false); // backdrop click cancels
  });
  // Focus trap: Tab cycles within the modal while open (a11y)
  el.overlay.addEventListener('keydown', function(ev){
    if (ev.key !== 'Tab') return;
    var focusables = el.overlay.querySelectorAll('button:not([disabled]):not(.hidden),input:not([disabled]):not(.hidden)'); // Fix: exclude hidden controls from the trap (audit #11)
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (ev.shiftKey){
      if (document.activeElement === first || document.activeElement === el.overlay){
        ev.preventDefault(); last.focus();
      }
    } else {
      if (document.activeElement === last){
        ev.preventDefault(); first.focus();
      }
    }
  });
  document.addEventListener('keydown', function(ev){
    if (ev.key === 'Escape'){
      if (!el.catOverlay.classList.contains('hidden')){
        /* Fix (new category modal): it is the topmost surface, so it closes first —
           the Category value is left untouched and focus returns to the dropdown. */
        cancelCategoryModal();
      } else if (!el.iconPickerOverlay.classList.contains('hidden')){
        closeIconPicker(); // Fix (depot icon picker): Escape closes, focus returns to the icon button
      } else if (bulkIsOpen()){
        // Fix (bulk edit): Escape closes whichever bulk step is visible (whole flow)
        if (!el.bulkOverlay1.classList.contains('hidden')) closeBulk1();
        else if (!el.bulkOverlay2.classList.contains('hidden')) closeBulk2();
        else closeBulk3();
      } else if (!el.overlay.classList.contains('hidden')){
        closeConfirm(false);
      } else if (!el.settingsOverlay.classList.contains('hidden')){
        closeSettings(); // Fix (settings): Escape closes the settings dialog
      } else if (depotMenuIsOpen()){
        closeDepotMenu();
        el.depotSelect.focus();
      } else if (!el.ksOverlay.classList.contains('hidden')){
        closeShortcuts();
      } else if (state.editingId !== null){
        // Fix (Phase 5): inline edit has priority over the Add/Import section — the
        // edit inputs' own Escape handlers cancel it (they stopPropagation)
      } else if (!el.formCard.classList.contains('hidden')){
        el.btnCloseForm.click(); // Fix (Phase 5): Escape closes the Add/Import section (same as the close button)
      }
    }
  });
  // ---- Depot icon picker (Fix: depot icon picker) ----
  el.btnDepotIcon.addEventListener('click', openIconPicker);
  el.iconPickerSave.addEventListener('click', savePendingIcon);   // Fix (save/cancel): commits the pending icon
  el.iconPickerCancel.addEventListener('click', closeIconPicker); // Fix (save/cancel): discards it
  el.iconPickerOverlay.addEventListener('click', function(ev){
    if (ev.target === el.iconPickerOverlay) closeIconPicker(); // backdrop click = Cancel
  });
  el.iconPickerOverlay.addEventListener('keydown', iconPickerKeydown); // trap + arrow grid nav
  // ---- Depot selector ----
  el.depotSelect.addEventListener('click', function(){
    if (depotMenuIsOpen()){ closeDepotMenu(); el.depotSelect.focus(); }
    else { openDepotMenu(); }
  });
  el.depotSelect.addEventListener('keydown', function(ev){
    if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !depotMenuIsOpen()){
      ev.preventDefault();
      openDepotMenu();
    }
  });
  el.depotMenu.addEventListener('keydown', function(ev){
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp'){
      ev.preventDefault();
      var names = Array.prototype.slice.call(el.depotMenu.querySelectorAll('.dd-name'));
      if (!names.length) return;
      var idx = names.indexOf(document.activeElement);
      var next;
      if (ev.key === 'ArrowDown') next = (idx === -1) ? 0 : Math.min(names.length - 1, idx + 1);
      else next = (idx === -1) ? names.length - 1 : Math.max(0, idx - 1);
      names[next].focus();
    }
  });
  document.addEventListener('click', function(ev){
    if (depotMenuIsOpen() &&
        !el.depotMenu.contains(ev.target) &&
        !el.depotSelect.contains(ev.target)){
      closeDepotMenu();
    }
  });
}

function init(){
  // Bootstrap check: translations must have loaded from translations.js
  if (!languagesValid(window.DEPOT_LANGUAGES)){
    el.appRoot.classList.add('hidden');
    el.bootstrapError.classList.remove('hidden');
    return; // app stays inert; message is intentionally hardcoded English
  }
  checkStorage();
  state.lang = detectLang(); // runs BEFORE data load so migration can pick the language
  /* Fix (settings): load the saved scales (the head script already applied them pre-paint;
     this syncs state and guarantees the values are applied on every start) */
  state.fontScale = readScale(LS_FONT);
  state.iconScale = readScale(LS_ICON);
  applyFontScale(state.fontScale);
  applyIconScale(state.iconScale);
  var loaded = { ok: true, empty: true };
  if (DC.store.ok){
    loaded = loadState();
  } else {
    el.banner.textContent = t('storageWarn');
    el.banner.classList.remove('hidden');
  }
  if (loaded.ok && loaded.data){
    state.depots = loaded.data.depots;
    state.activeDepotId = loaded.data.activeDepotId;
    state.nextDepotId = loaded.data.nextDepotId;
    state.nextItemId = loaded.data.nextItemId;
    /* Fix (depot icon picker): old data/snapshots without the map load as {} */
    state.depotIcons = (loaded.data.depotIcons && typeof loaded.data.depotIcons === 'object') ? loaded.data.depotIcons : {};
    syncItemsRef();
    if (loaded.migrated){
      persist(); snapshotCurrentData(); // write the migrated v2 state immediately
    }
  } else if (!loaded.ok){
    setTimeout(function(){ showToast(t('corruptWarn'), 'warn'); announce(t('corruptWarn'), true); }, 400);
  }
  if (state.depots.length === 0){
    // Fresh start (or everything deleted): create the default depot
    state.depots = [{ id: 1, name: t('defaultDepotName'), items: [] }];
    state.activeDepotId = 1;
    state.nextDepotId = 2;
    state.nextItemId = 1;
    syncItemsRef();
    persist(); // make the fresh state durable right away
  }
  bindEvents();
  applyTheme(currentTheme()); // sync switch state with the active theme
  render();
  applyFavicon(); // Fix (depot icon picker): favicon from the active depot's emoji on load
  try { el.inpSearch.focus(); } catch(e){} // start typing a search right away
}
init();
})();

