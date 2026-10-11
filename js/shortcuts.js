/* --- js/shortcuts.js — DC.shortcuts: keyboard shortcut cheat sheet --- */
(function () {
'use strict';

DC.shortcuts = DC.shortcuts || {};

/* Aliases to already-loaded modules (read once, at load time). */
var el = DC.el;
var t = DC.i18n.t;


/* ================= Keyboard shortcuts cheat sheet ================= */
var SHORTCUT_SECTIONS = [
  { title: 'ksGlobal', rows: [
    ['keyTabShift', 'ksTabShiftDesc'],
    ['keyEnterSpace', 'ksEnterSpaceDesc'],
    ['keyEsc', 'ksEscDesc'],
    ['keyQuestion', 'ksQuestionDesc']
  ]},
  { title: 'ksSearch', rows: [
    ['keyType', 'ksTypeDesc']
  ]},
  /* Fix (field order): rows follow Name -> Location -> Category -> Amount */
  { title: 'ksAddProduct', rows: [
    ['keyEnterName', 'ksEnterNameDesc'],
    ['keyEnterLoc', 'ksEnterLocDesc'],
    ['keyEnterCategory', 'ksEnterCatDesc'],
    ['keyEnterAmount', 'ksEnterAmountDesc']
  ]},
  { title: 'ksInlineEdit', rows: [
    ['keyEnterName', 'ksEnterNameDesc'],
    ['keyEnterLoc', 'ksEditEnterLocDesc'],
    ['keyEnterCategory', 'ksEditEnterCatDesc'],
    ['keyEnterAmount', 'ksEditEnterAmountDesc'],
    ['keyEsc', 'ksEditEscDesc']
  ]},
  { title: 'ksDepot', rows: [
    ['keyEnterSpace', 'ksDepotOpenDesc'],
    ['keyArrows', 'ksDepotArrowsDesc'],
    ['keyEnter', 'ksDepotSelectDesc'],
    ['keyEsc', 'ksDepotEscDesc']
  ]},
  { title: 'ksModals', rows: [
    ['keyTab', 'ksModalTabDesc'],
    ['keyEnter', 'ksModalEnterDesc'],
    ['keyEsc', 'ksModalEscDesc']
  ]},
  /* Fix (a11y audit I1): icon-picker keyboard navigation */
  { title: 'ksIconPicker', rows: [
    ['keyArrows4', 'ksIconArrowsDesc'],
    ['keyEnterSpace', 'ksIconSelectDesc'],
    ['keyTab', 'ksIconTabDesc'],
    ['keyEsc', 'ksIconEscDesc']
  ]}
];
function buildShortcutsBody(){
  el.ksBody.innerHTML = '';
  SHORTCUT_SECTIONS.forEach(function(sec){
    var div = document.createElement('div');
    div.className = 'ks-section';
    var h3 = document.createElement('h3');
    h3.textContent = t(sec.title);
    div.appendChild(h3);
    var ul = document.createElement('ul');
    ul.className = 'ks-rows';
    sec.rows.forEach(function(row){
      var li = document.createElement('li');
      var dt = document.createElement('span');
      dt.className = 'ks-key';
      dt.textContent = t(row[0]);
      li.appendChild(dt);
      var dd = document.createElement('span');
      dd.className = 'ks-desc';
      dd.textContent = t(row[1]);
      li.appendChild(dd);
      ul.appendChild(li);
    });
    div.appendChild(ul);
    el.ksBody.appendChild(div);
  });
}
function openShortcuts(){
  buildShortcutsBody();
  el.ksTitle.textContent = t('shortcutsTitle');
  el.ksClose.textContent = t('ksClose');
  el.ksOverlay.classList.remove('hidden');
  el.ksClose.focus();
}
function closeShortcuts(){
  el.ksOverlay.classList.add('hidden');
  el.btnShortcuts.focus();
}

/* Exports. */
DC.shortcuts.closeShortcuts = closeShortcuts;
DC.shortcuts.openShortcuts = openShortcuts;
})();

