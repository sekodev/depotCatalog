/* --- js/settings.js — DC.settings: settings dialog --- */
(function () {
'use strict';

DC.settings = DC.settings || {};

/* Aliases to already-loaded modules (read once, at load time). */
var LANGUAGES = DC.i18n.LANGUAGES;
var LS_FONT = DC.const.LS_FONT;
var LS_ICON = DC.const.LS_ICON;
var LS_LANG = DC.const.LS_LANG;
var announce = DC.announce.announce;
var askConfirm = DC.modal.askConfirm;
var detectLangFromDevice = DC.i18n.detectLangFromDevice;
var el = DC.el;
var getLang = DC.i18n.getLang;
var render = DC.list.render;
var setLang = DC.i18n.setLang;
var state = DC.state;
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
/* Refresh the settings dialog labels/options. Called from applyStaticText on every
   render, so a language switch re-localizes the dialog while it is open. */
function applySettingsText(){
  if (!el.settingsTitle) return;
  el.settingsTitle.textContent = t('settingsTitle');
  el.lblSetLang.textContent = t('languageLabel');
  el.lblSetFont.textContent = t('fontSizeLabel');
  el.lblSetIcon.textContent = t('iconSizeLabel');
  el.btnResetSettings.textContent = t('resetToDefaults');
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
    state.lang = detectLangFromDevice(); // re-detect (ignores the saved preference)
    try { localStorage.removeItem(LS_LANG); } catch(e){}
    state.fontScale = 'normal';
    state.iconScale = 'normal';
    applyFontScale('normal');
    applyIconScale('normal');
    try { localStorage.setItem(LS_FONT, 'normal'); } catch(e){}
    try { localStorage.setItem(LS_ICON, 'normal'); } catch(e){}
    render(); // re-render every string in the reset language
    if (!el.settingsOverlay.classList.contains('hidden')) applySettingsText();
    announce(t('settingsResetAnnouncement'));
  });
}

/* Exports. */
DC.settings.applyFontScale = applyFontScale;
DC.settings.applyIconScale = applyIconScale;
DC.settings.applySettingsText = applySettingsText;
DC.settings.closeSettings = closeSettings;
DC.settings.onResetSettings = onResetSettings;
DC.settings.onSettingsFontChange = onSettingsFontChange;
DC.settings.onSettingsIconChange = onSettingsIconChange;
DC.settings.onSettingsLangChange = onSettingsLangChange;
DC.settings.openSettings = openSettings;
DC.settings.readScale = readScale;
DC.settings.settingsTabTrap = settingsTabTrap;
})();

