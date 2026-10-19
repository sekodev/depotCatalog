/* --- js/inline-edit.js — DC.inlineEdit: inline row editing --- */
(function () {
'use strict';

DC.inlineEdit = DC.inlineEdit || {};

/* Aliases to already-loaded modules (read once, at load time). */
var announce = DC.announce.announce;
var askConfirm = DC.modal.askConfirm;
var autoCapitalizeFirst = DC.input.autoCapitalizeFirst;
var findById = DC.items.findById;
var makeCheckCell = DC.list.makeCheckCell;
var parseAmount = DC.validate.parseAmount;
var persist = DC.store.persist;
var renderList = DC.list.renderList;
var setInvalid = DC.validate.setInvalid;
var showAlert = DC.modal.showAlert;
var showSaveIndicator = DC.store.showSaveIndicator;
var showToast = DC.modal.showToast;
var snapshotCurrentData = DC.backup.snapshotCurrentData;
var state = DC.state;
var t = DC.i18n.t;

function startEdit(id){
  var it = findById(id);
  if (!it) return;
  state.editingId = id;
  delete state.selectedIds[id]; // Fix (batch select): a row in edit mode cannot stay selected
  renderList();
  var nameInput = document.querySelector('#listBody .row.editing .edit-name');
  if (nameInput){
    nameInput.focus();
    try { nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length); } catch(e){}
  }
  announce(t('editingProduct', { name: it.name }));
}
function cancelInlineEdit(){
  var editedId = state.editingId; // capture before clearing (for focus return)
  state.editingId = null;
  renderList();
  announce(t('editCanceled'));
  // a11y: return focus to the Edit button of the row that was being edited
  if (editedId !== null){
    var btn = document.querySelector('#listBody .row[data-id="' + editedId + '"] .icon-btn');
    if (btn){ try { btn.focus(); } catch(e){} }
  }
}
async function saveInlineEdit(){
  var it = findById(state.editingId);
  var nameInput = document.querySelector('#listBody .row.editing .edit-name');
  var locInput = document.querySelector('#listBody .row.editing .edit-loc');
  var amountInput = document.querySelector('#listBody .row.editing .edit-amount');
  var catInput = document.querySelector('#listBody .row.editing .edit-category'); // Fix (category)
  if (!it || !nameInput || !locInput || !amountInput || !catInput){ state.editingId = null; renderList(); return; }
  var name = nameInput.value.trim();
  var location = locInput.value.trim();
  var category = catInput.value.trim(); // Fix (category): free text, empty allowed
  if (!name){ setInvalid(nameInput, true); nameInput.focus(); return; } // empty name: stay in edit mode (a11y audit C1)
  var amountRes = parseAmount(amountInput.value);
  if (!amountRes.ok){
    // Fix (Phase 5): Add-form uses the reserved area; the edit row keeps its Phase 4 toggling
    var ea = document.getElementById('editAmountError');
    if (ea){ ea.textContent = t('amountInvalid'); ea.classList.remove('hidden'); }
    setInvalid(amountInput, true); // Fix (a11y audit C1): expose the error state to AT
    amountInput.focus();
    return;
  }
  setInvalid(nameInput, false);   // Fix (a11y audit C1): cleared
  setInvalid(amountInput, false); // Fix (a11y audit C1): cleared
  // Duplicate checks (same rules as the add flow), excluding this product
  var nl = name.toLowerCase();
  var ll = location.toLowerCase();
  var exact = false, sameName = false;
  for (var i = 0; i < state.items.length; i++){
    var other = state.items[i];
    if (other.id === it.id) continue; // do not flag itself
    if (other.name.toLowerCase() === nl){
      sameName = true;
      if (other.location.toLowerCase() === ll){ exact = true; break; }
    }
  }
  if (exact){
    // Same name AND same location => blocked, stay in edit mode
    showAlert({
      title: t('dupExactTitle'),
      message: t('dupExactMsg'),
      danger: true
    });
    return;
  }
  if (sameName){
    // Same name, different location => warn but allow
    var go1 = await askConfirm({
      title: t('dupWarnTitle'),
      message: t('dupWarnMsgEdit'),
      okLabel: t('save'),
      danger: true
    });
    if (!go1) return; // stay in edit mode, do not save
  }
  if (!location){
    // Fix: apply the same missing-location confirm as the add flow (audit #4)
    var go2 = await askConfirm({
      title: t('locMissingTitle'),
      message: t('locMissingMsg', { name: name }),
      okLabel: t('contAnyway'),
      danger: false
    });
    if (!go2){ locInput.focus(); return; } // stay in edit mode
  }
  it.name = name;
  it.location = location;
  it.amount = amountRes.value; // Fix (Phase 4): persist edited amount
  it.category = category;      // Fix (category): persist edited category (no validation)
  state.editingId = null;
  DC.store.save(); // Fix (auto-save): shared save honors the auto-save toggle
  renderList();
  showSaveIndicator();
  showToast(t('updated'), 'success');
  announce(t('changesSaved'));
  // a11y: return focus to the Edit button of the saved row
  var editBtn = document.querySelector('#listBody .row[data-id="' + it.id + '"] .icon-btn');
  if (editBtn){ try { editBtn.focus(); } catch(e){} }
}
function buildEditRow(it){
  var row = document.createElement('div');
  row.className = 'row editing';
  row.setAttribute('role', 'listitem'); // a11y: list semantics (see #listBody comment)
  row.appendChild(makeCheckCell(it, true)); // Fix (batch select): disabled while this row is edited

  var nameWrap = document.createElement('div');
  nameWrap.className = 'edit-field';
  var nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.maxLength = 120;
  nameInput.className = 'edit-input edit-name';
  nameInput.value = it.name;
  nameInput.setAttribute('aria-label', t('nameLbl'));
  nameInput.setAttribute('aria-describedby', 'hintInlineEdit'); // Fix (Phase 3): link keyboard hint
  nameInput.setAttribute('aria-invalid', 'false'); // Fix (a11y audit C1)
  nameInput.addEventListener('input', function(){ autoCapitalizeFirst(nameInput); setInvalid(nameInput, false); });
  nameInput.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      locInput.focus();
    } else if (ev.key === 'Escape'){
      ev.stopPropagation(); // Fix (Phase 5): Escape cancels the edit only (priority over the Add form)
      cancelInlineEdit();
    }
  });
  nameWrap.appendChild(nameInput);
  row.appendChild(nameWrap);

  var locWrap = document.createElement('div');
  locWrap.className = 'edit-field';
  var locInput = document.createElement('input');
  locInput.type = 'text';
  locInput.maxLength = 120;
  locInput.className = 'edit-input edit-loc';
  locInput.value = it.location;
  locInput.setAttribute('aria-label', t('locLbl'));
  locInput.setAttribute('aria-describedby', 'hintInlineEdit'); // Fix (Phase 3): link keyboard hint
  locInput.setAttribute('aria-invalid', 'false'); // Fix (a11y audit C1)
  locInput.addEventListener('input', function(){ autoCapitalizeFirst(locInput); setInvalid(locInput, false); });
  locInput.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      catInput.focus(); // Fix (field order): Location -> Category
    } else if (ev.key === 'Escape'){
      ev.stopPropagation(); // Fix (Phase 5): Escape cancels the edit only (priority over the Add form)
      cancelInlineEdit();
    }
  });
  locWrap.appendChild(locInput);
  row.appendChild(locWrap);

  // Fix (field order): Category is built (and appended) BEFORE Amount so the row reads
  // Name -> Location -> Category -> Amount. Its value is still read from .value; empty
  // means "Add new category" (the "-" is display-only).
  var catWrap = document.createElement('div');
  catWrap.className = 'edit-field';
  var catInput = document.createElement('select');
  catInput.className = 'edit-input edit-category cat-select';
  catInput.setAttribute('aria-label', t('category'));
  catInput.setAttribute('aria-describedby', 'hintInlineEdit');
  catInput.setAttribute('aria-invalid', 'false'); // Fix (a11y audit C1)
  DC.category.fillCategorySelect(catInput, it.category); // empty category => "Add new category"
  DC.category.setupCategorySelect(catInput);
  catInput.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      if (DC.category.catModalIsOpen()) return; // the "new category" modal owns Enter while it is open
      amountInput.focus(); // Fix (field order): Category -> Amount
    } else if (ev.key === 'Escape'){
      ev.stopPropagation(); // Fix (Phase 5): Escape cancels the edit only (priority over the Add form)
      cancelInlineEdit();
    }
  });
  catWrap.appendChild(catInput);
  row.appendChild(catWrap);

  // Fix (Phase 4): Amount is editable inline along with Name and Location
  var amountWrap = document.createElement('div');
  amountWrap.className = 'edit-field edit-field-amount'; // Fix (amount width): narrower track
  var amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.min = '0';
  amountInput.step = '1';
  amountInput.className = 'edit-input edit-amount';
  amountInput.value = it.amount;
  amountInput.setAttribute('aria-label', t('amount'));
  amountInput.setAttribute('aria-describedby', 'editAmountError hintInlineEdit');
  amountInput.setAttribute('aria-invalid', 'false'); // Fix (a11y audit C1)
  amountInput.addEventListener('input', function(){ setInvalid(amountInput, false); }); // Fix (a11y audit C1)
  amountInput.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && !ev.isComposing){
      ev.preventDefault();
      saveInlineEdit(); // Fix (field order): Amount is now last -> Enter saves the row
    } else if (ev.key === 'Escape'){
      ev.stopPropagation(); // Fix (Phase 5): Escape cancels the edit only (priority over the Add form)
      cancelInlineEdit();
    }
  });
  amountWrap.appendChild(amountInput);
  var amountErr = document.createElement('p');
  /* Fix (Phase 5 scope note): the reserved-error-area change applies to the ADD form
     only (spec §2). The inline edit row keeps the Phase 4 display toggling — reserving
     space here would misalign the edit inputs (centered flex row). */
  amountErr.className = 'err hidden';
  amountErr.id = 'editAmountError';
  amountErr.setAttribute('role', 'alert');
  amountWrap.appendChild(amountErr);
  row.appendChild(amountWrap);

  var actions = document.createElement('div');
  actions.className = 'actions';

  var saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-primary btn-sm';
  saveBtn.textContent = t('save');
  saveBtn.setAttribute('aria-label', t('save'));
  saveBtn.addEventListener('click', saveInlineEdit);

  var cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary btn-sm';
  cancelBtn.textContent = t('cancel');
  cancelBtn.setAttribute('aria-label', t('cancel'));
  cancelBtn.addEventListener('click', cancelInlineEdit);

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  row.appendChild(actions);
  // Inline keyboard hint (small, muted, non-intrusive)
  var hint = document.createElement('div');
  hint.className = 'hint-inline';
  hint.id = 'hintInlineEdit'; // Fix (Phase 3): target for the edit inputs' aria-describedby
  hint.textContent = t('hintInlineEdit');
  row.appendChild(hint);
  return row;
}

/* Exports. */
DC.inlineEdit.buildEditRow = buildEditRow;
DC.inlineEdit.startEdit = startEdit;
})();

