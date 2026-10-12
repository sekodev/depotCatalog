/* --- js/input.js — DC.input: input enhancement, name suggestions, IME composition --- */
(function () {
'use strict';

DC.input = DC.input || {};

/* Aliases to already-loaded modules (read once, at load time). */
var el = DC.el;
var state = DC.state;


/* ================= Input enhancements ================= */
DC.input.composing = false;
function autoCapitalizeFirst(inp){
  if (DC.input.composing) return;
  var v = inp.value;
  if (!v) return;
  var c = v.charAt(0);
  var u = c.toUpperCase();
  if (c !== u && c.toLowerCase() === c){ // only remap letters, leave symbols/digits
    inp.value = u + v.slice(1);
  }
}
function handleNameInput(){
  autoCapitalizeFirst(el.inpName);
  DC.validate.setInvalid(el.inpName, false); // Fix (a11y audit C1): typing clears the error state
  renderSuggestions();
}
function handleLocationInput(){
  // Only auto-uppercase the first letter; no dash is inserted automatically.
  // Pastes and manual edits are left untouched (autoCapitalizeFirst only
  // changes the case of an existing leading letter).
  autoCapitalizeFirst(el.inpLoc);
}
function hideSuggestions(){
  el.nameSuggest.classList.add('hidden');
  el.nameSuggest.innerHTML = '';
}
function renderSuggestions(){
  hideSuggestions();
  if (state.editingId !== null) return;      // only in Add mode
  if (DC.input.composing) return;
  var q = el.inpName.value.trim().toLowerCase();
  if (!q) return;
  var matches = [];
  for (var i = 0; i < state.items.length && matches.length < 8; i++){
    if (state.items[i].name.toLowerCase().indexOf(q) !== -1){
      matches.push(state.items[i]);
    }
  }
  if (matches.length === 0) return;
  matches.forEach(function(it){
    var d = document.createElement('div');
    d.className = 'suggest-item';
    d.setAttribute('role', 'option');
    var n = document.createElement('span');
    n.className = 'sg-name';
    n.textContent = it.name;               // textContent => XSS-safe
    d.appendChild(n);
    if (it.location){
      var l = document.createElement('span');
      l.className = 'sg-loc';
      l.textContent = it.location;
      d.appendChild(l);
    }
    el.nameSuggest.appendChild(d);
  });
  el.nameSuggest.classList.remove('hidden');
}

/* Exports. */
DC.input.autoCapitalizeFirst = autoCapitalizeFirst;
DC.input.handleLocationInput = handleLocationInput;
DC.input.handleNameInput = handleNameInput;
DC.input.hideSuggestions = hideSuggestions;
})();

