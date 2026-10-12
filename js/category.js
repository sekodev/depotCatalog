/* --- js/category.js — DC.category: category dropdown + new-category modal --- */
(function () {
'use strict';

DC.category = DC.category || {};

/* Aliases to already-loaded modules (read once, at load time). */
var announce = DC.announce.announce;
var el = DC.el;
var setInvalid = DC.validate.setInvalid;
var state = DC.state;
var t = DC.i18n.t;

/* ================= Category dropdown (Fix: category dropdown) ================= */
/* The Category field is a <select> whose FIRST option is "Add new category" (value '').
   Choosing it opens the "new category" MODAL (Fix: new category modal — it used to be an
   inline editor). The option list is derived at render time from the ACTIVE depot's items
   (unique, case-insensitive, trimmed, non-empty; first-seen casing kept; sorted A->Z) and
   is preceded by a non-selectable "------" separator. A typed value becomes an option only
   once an item is saved with it — unsaved typing is discarded. Category stays a free-text
   string on the item; CSV import/export, the list's "-" placeholder, search matching and
   duplicate detection (name + location) are all unchanged. */

/* Unique, case-insensitive categories of the active depot (first-seen casing, A->Z). */
function categoryOptions(){
  var seen = {}, out = [];
  (state.items || []).forEach(function(it){
    if (!it || typeof it.category !== 'string') return;
    var v = it.category.trim();
    if (!v) return;
    var k = v.toLowerCase();
    if (seen[k]) return;
    seen[k] = true;
    out.push(v);
  });
  out.sort(function(a, b){
    var x = a.toLowerCase(), y = b.toLowerCase();
    return (x < y) ? -1 : (x > y ? 1 : 0);
  });
  return out;
}
/* Rebuild the options, then restore `current` as the selected value. A value that is not
   an option yet (typed but not saved) is added as a transient option so it can display. */
function fillCategorySelect(sel, current){
  if (!sel) return;
  var val = (current == null) ? '' : String(current);
  var seen = {};
  sel.innerHTML = '';
  /* Fix (category order): the non-selectable "------" divider is the FIRST entry now, ahead
     of "Add new category". Display-only - it is an <option>, so it can never reach the item
     data, the CSV export or any other output. */
  var sep = document.createElement('option');
  sep.disabled = true;
  sep.value = CAT_SEP_VALUE;
  sep.textContent = '------';
  sel.appendChild(sep);
  /* Fix (category order): "Add new category" carries a sentinel value, so picking it is
     always a real value change and `change` therefore always fires. An entry whose value
     equals the empty state can be re-picked silently (no event at all). */
  var addNew = document.createElement('option');
  addNew.value = CAT_NEW_VALUE;
  addNew.textContent = t('categoryDropdownAddNew');
  sel.appendChild(addNew);
  /* Fix (category order): the empty state still shows "Add new category", but through its
     own value (""), so the entry above stays re-selectable. display:none on an <option>
     keeps it out of the popup (Chromium/Firefox), so the visible list still reads
     "------" -> "Add new category" -> categories. */
  var rest = document.createElement('option');
  rest.value = '';
  rest.textContent = t('categoryDropdownAddNew');
  rest.disabled = true;
  rest.style.display = 'none';
  sel.appendChild(rest);
  categoryOptions().forEach(function(c){
    seen[c.toLowerCase()] = true;
    var o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    sel.appendChild(o);
  });
  if (val && !seen[val.toLowerCase()]){
    var tmp = document.createElement('option');
    tmp.value = val;
    tmp.textContent = val;
    sel.appendChild(tmp);
  }
  sel.value = val;
  if (sel.selectedIndex < 0) sel.value = ''; // never leave the control blank
  sel.__catValue = sel.value;                // committed value - the modal resets to this
}
/* An existing category wins over the typed casing; otherwise the typed value is kept. */
function resolveCategoryCasing(v){
  var lv = v.toLowerCase();
  var list = categoryOptions();
  for (var i = 0; i < list.length; i++){
    if (list[i].toLowerCase() === lv) return list[i];
  }
  return v;
}
/* Refresh the Category dropdowns, keeping each one's current value selected. */
function refreshCategorySelects(){
  [el.inpCategory, el.bulkInpCategory].forEach(function(sel){
    if (!sel) return;
    fillCategorySelect(sel, sel.value);
  });
}
/* ===== Fix (new category modal): the "Add new category" flow is a modal, not inline =====
   The modal is opened from a Category <select>. Save writes the resolved value onto that
   select; Cancel and Escape leave it on "Add new category" (empty). Focus always returns
   to the select that triggered it. */
var catModalTarget = null; // the Category <select> that opened the modal
/* Fix (category order): option values for the "------" divider and for "Add new category".
   Both start with NUL, so they can never collide with a real category (categories are free
   text) - and the "Add new category" entry can never collide with the empty state. */
var CAT_NEW_VALUE = '\u0000cat-new';
var CAT_SEP_VALUE = '\u0000cat-sep';

function catModalIsOpen(){
  return !el.catOverlay.classList.contains('hidden');
}
function openCategoryModal(sel){
  if (!sel || !document.contains(sel)) return;
  catModalTarget = sel;
  /* Fix (category order): put the dropdown back on the value it had before "Add new
     category" was picked. It must not stay on that entry, otherwise picking it again would
     not change the value and would not fire `change`. */
  sel.value = (sel.__catValue == null) ? '' : sel.__catValue;
  el.catModalInput.value = '';
  setInvalid(el.catModalInput, false);
  el.catModalSave.disabled = true; // stays disabled until the input is non-empty
  el.catOverlay.classList.remove('hidden');
  announce(t('categoryInlineEnterAnnouncement'));
  try { el.catModalInput.focus(); } catch(e){}
}
/* Closes the dialog and returns focus to the dropdown that opened it. */
function closeCategoryModal(){
  el.catOverlay.classList.add('hidden');
  el.catModalInput.value = '';
  setInvalid(el.catModalInput, false);
  el.catModalSave.disabled = true;
  var back = catModalTarget;
  catModalTarget = null;
  if (back && document.contains(back)){ try { back.focus(); } catch(e){} }
}
function saveCategoryModal(){
  var sel = catModalTarget;
  if (!sel) return;
  var raw = el.catModalInput.value.trim();
  if (!raw) return; // Save is disabled in this state
  var val = resolveCategoryCasing(raw); // existing casing wins, otherwise the typed casing
  closeCategoryModal();                 // restores focus to the dropdown
  /* The value becomes the field's value. It is deliberately NOT added to the option list
     yet — it only becomes an option once an item is saved with it (fillCategorySelect
     appends a transient option so the new value can still show as selected). */
  if (document.contains(sel)) fillCategorySelect(sel, val);
  announce(t('categorySetAnnouncement', { name: val }));
}
function cancelCategoryModal(){
  var sel = catModalTarget;
  var prev = (sel && sel.__catValue != null) ? sel.__catValue : ''; // value before "Add new category"
  closeCategoryModal();                 // restores focus to the dropdown
  if (sel && document.contains(sel)) fillCategorySelect(sel, prev); // back to the previous selection
}
/* Wire a Category <select>: picking "Add new category" opens the modal. */
function setupCategorySelect(sel){
  if (!sel || sel.__catReady) return;
  sel.__catReady = true;
  fillCategorySelect(sel, sel.value);
  sel.addEventListener('change', function(){
    /* Fix (category order): detected by value, not by label. The entry carries a sentinel
       value, so this branch is always reached - picking it is always a value change. */
    if (sel.value === CAT_NEW_VALUE){
      openCategoryModal(sel); // opens the modal and reverts the dropdown to its previous value
    } else {
      sel.__catValue = sel.value; // remember the committed value for the modal reset
      setInvalid(sel, false);
    }
  });
}

/* Exports. */
DC.category.cancelCategoryModal = cancelCategoryModal;
DC.category.catModalIsOpen = catModalIsOpen;
DC.category.fillCategorySelect = fillCategorySelect;
DC.category.refreshCategorySelects = refreshCategorySelects;
DC.category.saveCategoryModal = saveCategoryModal;
DC.category.setupCategorySelect = setupCategorySelect;
})();

