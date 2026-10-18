/* --- js/modals.js — DC.modal: toast + confirm/alert/input modals --- */
(function () {
'use strict';

DC.modal = DC.modal || {};

/* Aliases to already-loaded modules (read once, at load time). */
var el = DC.el;
var t = DC.i18n.t;


/* ================= Toast & modal ================= */
var toastTimer = null;
var toastTypes = ['toast-success','toast-warn','toast-error','toast-info'];
function showToast(msg, type){
  el.toast.textContent = msg;
  toastTypes.forEach(function(tn){ el.toast.classList.remove(tn); });
  el.toast.classList.add('toast-' + (type || 'info'));
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.toast.classList.remove('show'); }, 3000);
}
var confirmResolve = null;
var lastFocused = null;
var modalInputMode = false;
function askConfirm(opts){
  return openModal({
    title: opts.title,
    message: opts.message,
    list: opts.list,
    okLabel: opts.okLabel,
    danger: opts.danger,
    alertOnly: opts.alertOnly,
    focusCancel: opts.focusCancel // Fix (clear actions): destructive confirmations focus Cancel first
  }).then(function(v){ return v === true; });
}
/* Input modal: resolves the trimmed input value on Save, null on cancel. */
function askInput(opts){
  return openModal({
    title: opts.title,
    message: opts.message,
    inputValue: opts.value || '',
    okLabel: opts.okLabel || t('save'),
    danger: opts.danger
  }).then(function(v){
    if (v === true) return el.modalInput.value.trim();
    return null;
  });
}
function openModal(opts){
  lastFocused = document.activeElement;
  modalInputMode = (typeof opts.inputValue === 'string');
  el.modalTitle.textContent = opts.title;
  if (opts.message !== undefined){
    el.modalText.textContent = opts.message;
    el.modalText.classList.remove('hidden');
  } else {
    el.modalText.classList.add('hidden');
  }
  if (modalInputMode){
    el.modalInput.value = opts.inputValue;
    el.modalInput.classList.remove('hidden');
    el.modalInput.setAttribute('aria-invalid', 'false'); // Fix (a11y audit C1): fresh dialog
    // Fix: give the depot-name input an accessible name (audit #2)
    el.modalInput.setAttribute('aria-label', t('depotNameLbl'));
  } else {
    el.modalInput.value = '';
    el.modalInput.classList.add('hidden');
  }
  el.modalList.innerHTML = '';
  if (opts.list && opts.list.length){
    opts.list.forEach(function(line){
      var li = document.createElement('li');
      li.textContent = line; // textContent => XSS-safe
      el.modalList.appendChild(li);
    });
    el.modalList.classList.remove('hidden');
  } else {
    el.modalList.classList.add('hidden');
  }
  el.modalOk.textContent = opts.okLabel;
  el.modalCancel.textContent = t('cancel');
  el.modalCancel.classList.toggle('hidden', !!opts.alertOnly);
  el.modalOk.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
  el.overlay.classList.remove('hidden');
  if (modalInputMode){
    el.modalInput.focus();
    try { el.modalInput.select(); } catch(e){}
  } else if (opts.focusCancel && !opts.alertOnly){
    /* Fix (clear actions): opt-in — destructive confirmations put focus on Cancel, never
       on the destructive button. Existing callers keep focusing OK (unchanged). */
    el.modalCancel.focus();
  } else {
    el.modalOk.focus();
  }
  return new Promise(function(resolve){ confirmResolve = resolve; });
}
function closeConfirm(value){
  el.overlay.classList.add('hidden');
  el.modalInput.setAttribute('aria-invalid', 'false'); // Fix (a11y audit C1): closing clears the error state
  modalInputMode = false;
  if (lastFocused && lastFocused.focus){ try { lastFocused.focus(); } catch(e){} }
  lastFocused = null;
  if (confirmResolve){ confirmResolve(value); confirmResolve = null; }
}
function showAlert(opts){
  return askConfirm({
    title: opts.title,
    message: opts.message,
    okLabel: opts.okLabel || t('ok'),
    danger: !!opts.danger,
    alertOnly: true
  }).then(function(){ return true; });
}

/* Exports. */
DC.modal.askConfirm = askConfirm;
DC.modal.askInput = askInput;
DC.modal.closeConfirm = closeConfirm;
DC.modal.showAlert = showAlert;
DC.modal.showToast = showToast;
})();

