/* --- js/validation.js — DC.validate: amount parsing + field error state --- */
(function () {
'use strict';

DC.validate = DC.validate || {};

/* Aliases to already-loaded modules (read once, at load time). */
var $ = DC.utils.$;

/* Fix (Phase 4): shared Amount validation — empty => 1; otherwise digits-only
   non-negative integer. Used by the Add form, inline edit, and CSV import. */
function parseAmount(raw){
  var s = String(raw == null ? '' : raw).trim();
  if (s === '') return { ok: true, value: 1 };
  if (!/^[0-9]+$/.test(s)) return { ok: false, value: 1 };
  return { ok: true, value: parseInt(s, 10) };
}
/* Fix (a11y audit C1): mirror a field's error state for assistive tech.
   aria-invalid reflects whether the field currently holds an error; the visible
   error text and red-border behaviour are unchanged. */
function setInvalid(input, on){
  if (!input) return;
  input.setAttribute('aria-invalid', on ? 'true' : 'false');
}

/* Exports. */
DC.validate.parseAmount = parseAmount;
DC.validate.setInvalid = setInvalid;
})();

