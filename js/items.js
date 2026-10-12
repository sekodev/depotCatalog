/* --- js/items.js — DC.items: add / edit / delete an item --- */
(function () {
'use strict';

DC.items = DC.items || {};

/* Aliases to already-loaded modules (read once, at load time). */
var activeDepot = DC.state.activeDepot;
var announce = DC.announce.announce;
var askConfirm = DC.modal.askConfirm;
var el = DC.el;
var getFilteredItems = DC.search.getFilteredItems;
var hideSuggestions = DC.input.hideSuggestions;
var parseAmount = DC.validate.parseAmount;
var persist = DC.store.persist;
var render = DC.list.render;
var setInvalid = DC.validate.setInvalid;
var showAlert = DC.modal.showAlert;
var showSaveIndicator = DC.store.showSaveIndicator;
var showToast = DC.modal.showToast;
var snapshotCurrentData = DC.backup.snapshotCurrentData;
var state = DC.state;
var t = DC.i18n.t;


/* ================= CRUD ================= */
function resetForm(){
  el.inpName.value = '';
  el.inpLoc.value = '';
  el.inpAmount.value = '1'; // Fix (Phase 4): Amount resets to default 1 (serial entry)
  DC.category.fillCategorySelect(el.inpCategory, ''); // Fix (category dropdown): back to "Add new category"; also refreshes the options so a just-saved category is offered here
  el.nameError.textContent = ''; // Fix (Phase 5): clear in place — reserved area stays
  el.amountError.textContent = '';
  setInvalid(el.inpName, false);   // Fix (a11y audit C1): reset clears the error state
  setInvalid(el.inpAmount, false); // Fix (a11y audit C1)
  hideSuggestions();
}
function findById(id){
  for (var i = 0; i < state.items.length; i++){
    if (state.items[i].id === id) return state.items[i];
  }
  return null;
}
async function handleFormSubmit(ev){
  ev.preventDefault();
  var name = el.inpName.value.trim();
  var location = el.inpLoc.value.trim();
  var category = el.inpCategory.value.trim(); // Fix (category): free text, empty allowed
  if (!name){
    el.nameError.textContent = t('nameReq'); // Fix (Phase 5): error area always reserved — text only, no display toggling
    setInvalid(el.inpName, true); // Fix (a11y audit C1): expose the error state to AT
    el.inpName.focus();
    return;
  }
  el.nameError.textContent = '';
  setInvalid(el.inpName, false); // Fix (a11y audit C1): cleared
  var amountRes = parseAmount(el.inpAmount.value);
  if (!amountRes.ok){
    el.amountError.textContent = t('amountInvalid'); // Fix (Phase 5): text only — reserved area prevents layout shift
    setInvalid(el.inpAmount, true); // Fix (a11y audit C1): expose the error state to AT
    el.inpAmount.focus();
    return;
  }
  el.amountError.textContent = '';
  setInvalid(el.inpAmount, false); // Fix (a11y audit C1): cleared
  hideSuggestions();
  if (state.editingId === null){
    var nl = name.toLowerCase();
    var ll = location.toLowerCase();
    var exact = false, sameName = false;
    for (var i = 0; i < state.items.length; i++){
      var it0 = state.items[i];
      if (it0.name.toLowerCase() === nl){
        sameName = true;
        if (it0.location.toLowerCase() === ll){ exact = true; break; }
      }
    }
    if (exact){
      // Same name AND same location => blocked
      showAlert({
        title: t('dupExactTitle'),
        message: t('dupExactMsg', { name: name, location: location }),
        danger: true
      });
      return;
    }
    if (sameName){
      // Same name, different location => warn but allow
      var go1 = await askConfirm({
        title: t('dupWarnTitle'),
        message: t('dupWarnMsg', { name: name }),
        okLabel: t('add'),
        danger: true
      });
      if (!go1) return;
    }
    if (!location){
      var go2 = await askConfirm({
        title: t('locMissingTitle'),
        message: t('locMissingMsg', { name: name }),
        okLabel: t('contAnyway'),
        danger: false
      });
      if (!go2){ el.inpLoc.focus(); return; }
    }
    var newId = state.nextItemId++;
    state.items.push({ id: newId, name: name, location: location, amount: amountRes.value, category: category }); // Fix (category): category stored (empty string when blank)
    persist(); snapshotCurrentData();
    // Show the page that contains the newly added item
    var fl = getFilteredItems();
    for (var k = 0; k < fl.length; k++){
      if (fl[k].id === newId){ state.page = Math.floor(k / state.pageSize) + 1; break; }
    }
    showSaveIndicator();
    showToast(t('added'), 'success');
    announce(t('addedNamed', { name: name }));
  }
  resetForm();
  render();
  el.inpName.focus(); // ready for the next product immediately
}
function handleDelete(id){
  var it = findById(id);
  if (!it) return;
  askConfirm({
    title: t('delTitle'),
    message: t('delConfirm', { name: it.name }),
    okLabel: t('del'),
    danger: true
  }).then(function(yes){
    if (!yes) return;
    // Splice in place: state.items aliases the active depot's array
    var dep = activeDepot();
    if (dep){
      for (var i = 0; i < dep.items.length; i++){
        if (dep.items[i].id === id){ dep.items.splice(i, 1); break; }
      }
    }
    if (state.editingId === id) resetForm();
    persist(); snapshotCurrentData();
    render();
    showSaveIndicator();
    showToast(t('deleted'), 'success');
    announce(t('deleted'));
  });
}

/* Exports. */
DC.items.findById = findById;
DC.items.handleDelete = handleDelete;
DC.items.handleFormSubmit = handleFormSubmit;
DC.items.resetForm = resetForm;
})();

