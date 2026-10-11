/* --- js/depot.js — DC.depot: depot menu + add / edit / delete depot --- */
(function () {
'use strict';

DC.depot = DC.depot || {};

/* Aliases to already-loaded modules (read once, at load time). */
var activeDepot = DC.state.activeDepot;
var announce = DC.announce.announce;
var applyFavicon = DC.favicon.applyFavicon;
var askConfirm = DC.modal.askConfirm;
var askInput = DC.modal.askInput;
var closeConfirm = DC.modal.closeConfirm;
var el = DC.el;
var findDepot = DC.state.findDepot;
var hideImportReport = DC.csv.hideImportReport;
var persist = DC.store.persist;
var render = DC.list.render;
var setInvalid = DC.validate.setInvalid;
var showSaveIndicator = DC.store.showSaveIndicator;
var showToast = DC.modal.showToast;
var snapshotCurrentData = DC.backup.snapshotCurrentData;
var state = DC.state;
var syncItemsRef = DC.state.syncItemsRef;
var t = DC.i18n.t;


/* ================= Depot selector & depot CRUD ================= */
function depotMenuIsOpen(){
  return !el.depotMenu.classList.contains('hidden');
}
function renderDepotMenu(){
  el.depotMenu.innerHTML = '';
  state.depots.forEach(function(dep){
    var row = document.createElement('div');
    row.className = 'dd-row';

    var nameBtn = document.createElement('button');
    nameBtn.type = 'button';
    nameBtn.className = 'dd-name';
    nameBtn.setAttribute('role', 'option');
    nameBtn.setAttribute('aria-selected', String(dep.id === state.activeDepotId));
    // Green circle only next to the ACTIVE depot name
    nameBtn.textContent = (dep.id === state.activeDepotId ? '\uD83D\uDFE2 ' : '') + dep.name;
    nameBtn.addEventListener('click', function(){ selectDepot(dep.id); });
    row.appendChild(nameBtn);

    var eb = document.createElement('button');
    eb.type = 'button';
    eb.className = 'icon-btn';
    /* Fix (a11y audit N1): decorative emoji wrapped in an aria-hidden span */
    var ebIco = document.createElement('span');
    ebIco.setAttribute('aria-hidden', 'true');
    ebIco.textContent = '\u270F\uFE0F'; // pencil
    eb.appendChild(ebIco);
    var ebLbl = t('editDepotAria', { name: dep.name });
    eb.setAttribute('aria-label', ebLbl);
    eb.title = ebLbl; // Fix (a11y audit I3): tooltip mirrors the accessible name
    eb.addEventListener('click', function(ev){
      ev.stopPropagation();
      closeDepotMenu();
      openEditDepot(dep.id);
    });
    row.appendChild(eb);

    var db = document.createElement('button');
    db.type = 'button';
    db.className = 'icon-btn del';
    /* Fix (a11y audit N1): decorative emoji wrapped in an aria-hidden span */
    var dbIco = document.createElement('span');
    dbIco.setAttribute('aria-hidden', 'true');
    dbIco.textContent = '\uD83D\uDDD1\uFE0F'; // wastebasket
    db.appendChild(dbIco);
    var dbLbl = t('deleteDepotAria', { name: dep.name });
    db.setAttribute('aria-label', dbLbl);
    db.title = dbLbl; // Fix (a11y audit I3): tooltip mirrors the accessible name
    db.addEventListener('click', function(ev){
      ev.stopPropagation();
      closeDepotMenu();
      openDeleteDepot(dep.id);
    });
    row.appendChild(db);

    el.depotMenu.appendChild(row);
  });
  var addRow = document.createElement('div');
  addRow.className = 'dd-add-row';
  var ab = document.createElement('button');
  ab.type = 'button';
  ab.className = 'dd-add';
  ab.textContent = t('addDepot');
  ab.addEventListener('click', function(){
    closeDepotMenu();
    openAddDepotModal();
  });
  addRow.appendChild(ab);
  el.depotMenu.appendChild(addRow);
}
function openDepotMenu(){
  renderDepotMenu();
  el.depotMenu.classList.remove('hidden');
  el.depotSelect.setAttribute('aria-expanded', 'true');
  var act = el.depotMenu.querySelector('.dd-name[aria-selected="true"]') ||
            el.depotMenu.querySelector('.dd-name');
  if (act) act.focus();
}
function closeDepotMenu(){
  el.depotMenu.classList.add('hidden');
  el.depotSelect.setAttribute('aria-expanded', 'false');
}
function selectDepot(id){
  if (id === state.activeDepotId){ closeDepotMenu(); el.inpSearch.focus(); return; }
  state.activeDepotId = id;
  syncItemsRef();
  var dep = activeDepot(); // Fix: dep was undeclared => ReferenceError under 'use strict'; depot-switch announce crashed (audit #1)
  // Reset UI to the initial app state (fresh page load feel, preferences kept)
  state.filter = '';
  state.sort = { key: null, dir: null }; // Fix (sortable columns): sort resets to Default on depot switch
  state.selectedIds = {}; // Fix (batch select): depot switch clears selection
  state.page = 1;
  state.pageSize = 5;
  el.selPageSize.value = '5';
  state.editingId = null;
  el.inpSearch.value = '';
  el.btnClearSearch.classList.add('hidden');
  el.formCard.classList.add('hidden');            // close Add/Import section
  el.btnToggleAdd.classList.remove('invisible'); // restore the toggle button
  hideImportReport();                             // dismiss import notice
  if (!el.overlay.classList.contains('hidden')) closeConfirm(false); // close any modal
  closeDepotMenu();
  persist(); snapshotCurrentData();
  showSaveIndicator();
  render();
  applyFavicon(); // Fix (depot icon picker): favicon follows the active depot
  el.inpSearch.focus();
  announce(t('nowViewing', { name: dep ? dep.name : '' }));
}
function openAddDepotModal(){
  askInput({ title: t('addDepotTitle') }).then(function(name){
    if (name === null) return;                 // cancelled
    if (!name){ setInvalid(el.modalInput, true); showToast(t('depotNameReq'), 'error'); announce(t('depotNameReq'), true); return; } // Fix (a11y audit C1)
    var id = state.nextDepotId++;
    state.depots.push({ id: id, name: name, items: [] });
    state.activeDepotId = id;
    syncItemsRef();
    state.filter = '';
    state.sort = { key: null, dir: null }; // Fix (sortable columns): active depot changed — reset sort
    state.selectedIds = {}; // Fix (batch select): depot changed — clear selection
    state.page = 1;
    state.editingId = null;
    hideImportReport();
    persist(); snapshotCurrentData();
    render();
    applyFavicon(); // Fix (favicon on load): new depot became active (may reset the icon to 📦)
    showSaveIndicator();
    showToast(t('depotAdded'), 'success');
    announce(t('depotAdded'));
    // Focus the add-product form so the user can start entering items
    el.btnToggleAdd.click();
  });
}
function openEditDepot(id){
  var dep = findDepot(id);
  if (!dep) return;
  askInput({ title: t('editDepotTitle'), value: dep.name }).then(function(name){
    if (name === null) return;
    if (!name){ setInvalid(el.modalInput, true); showToast(t('depotNameReq'), 'error'); announce(t('depotNameReq'), true); return; } // Fix (a11y audit C1)
    dep.name = name;
    persist(); snapshotCurrentData();
    render();
    showSaveIndicator();
    showToast(t('depotRenamed'), 'success');
    announce(t('depotRenamed'));
  });
}
function openDeleteDepot(id){
  var dep = findDepot(id);
  if (!dep) return;
  askConfirm({
    title: t('deleteDepotTitle'),
    message: t('deleteDepotConfirm', { name: dep.name }),
    okLabel: t('del'),
    danger: true
  }).then(function(yes){
    if (!yes) return;
    state.depots = state.depots.filter(function(d){ return d.id !== id; });
    if (state.depots.length === 0){
      // Fallback: automatically recreate a default depot named "Depot-1"
      state.depots = [{ id: state.nextDepotId++, name: t('defaultDepotName'), items: [] }];
      state.activeDepotId = state.depots[0].id;
    } else if (state.activeDepotId === id){
      state.activeDepotId = state.depots[0].id;
    }
    syncItemsRef();
    state.filter = '';
    state.sort = { key: null, dir: null }; // Fix (sortable columns): active depot may have changed — reset sort
    state.selectedIds = {}; // Fix (batch select): depot may have changed — clear selection
    state.page = 1;
    state.editingId = null;
    el.inpSearch.value = '';
    el.btnClearSearch.classList.add('hidden');
    hideImportReport();
    delete state.depotIcons[id]; // Fix (depot icon picker): drop the icon with its depot
    persist(); snapshotCurrentData();
    render();
    applyFavicon(); // Fix (depot icon picker): active depot may have changed
    showSaveIndicator();
    showToast(t('depotDeleted'), 'success');
    announce(t('depotDeleted'));
  });
}

/* Exports. */
DC.depot.closeDepotMenu = closeDepotMenu;
DC.depot.depotMenuIsOpen = depotMenuIsOpen;
DC.depot.openDepotMenu = openDepotMenu;
DC.depot.renderDepotMenu = renderDepotMenu;
})();

