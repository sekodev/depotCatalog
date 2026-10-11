/* --- js/i18n.js — DC.i18n: language detection, t() lookup, language switching --- */
(function () {
'use strict';

DC.i18n = DC.i18n || {};

/* Aliases to already-loaded modules (read once, at load time). */
var LS_LANG = DC.const.LS_LANG;
var state = DC.state;


/* ============ i18n (strings live in external translations.js) ============ */
var LANGUAGES = window.DEPOT_LANGUAGES;
/* Bootstrap guard: appName is the sentinel key EVERY language must define. It doubles as
   the visible app name (dynamic page title), so a broken or missing translations.js is
   detected without needing a dedicated key. */
function languagesValid(arr){
  if (!Array.isArray(arr) || arr.length === 0) return false;
  for (var i = 0; i < arr.length; i++){
    var L = arr[i];
    if (!L || typeof L.code !== 'string' || typeof L.label !== 'string' ||
        !L.strings || typeof L.strings !== 'object' ||
        typeof L.strings.appName !== 'string') return false;
  }
  return true;
}
function getLang(code){
  for (var i = 0; i < LANGUAGES.length; i++){
    if (LANGUAGES[i].code === code) return LANGUAGES[i];
  }
  return null;
}
/* Fix (settings): device detection factored out so "reset to defaults" can re-detect
   the language while ignoring the saved preference (existing fallback preserved). */
function detectLangFromDevice(){
  var langs = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language || ''];
  for (var i = 0; i < langs.length; i++){
    var p = String(langs[i] || '').toLowerCase();
    for (var j = 0; j < LANGUAGES.length; j++){
      var c = LANGUAGES[j].code.toLowerCase();
      if (p === c || p.indexOf(c + '-') === 0) return LANGUAGES[j].code;
    }
  }
  return getLang('en') ? 'en' : LANGUAGES[0].code; // fallback
}
function detectLang(){
  var saved = null;
  try { saved = localStorage.getItem(LS_LANG); } catch(e){}
  if (saved && getLang(saved)) return saved;
  return detectLangFromDevice();
}
function t(key, params){
  var cur = getLang(state.lang);
  var s = (cur && cur.strings && cur.strings[key] != null) ? cur.strings[key] : null;
  if (s == null){
    var en = getLang('en');
    if (en && en.strings && en.strings[key] != null) s = en.strings[key];
  }
  if (s == null) s = key;
  if (params){
    Object.keys(params).forEach(function(k){
      s = s.split('{' + k + '}').join(String(params[k]));
    });
  }
  return s;
}
function setLang(lang){
  state.lang = lang;
  state.editingId = null; // re-render would discard unsaved edits
  try { localStorage.setItem(LS_LANG, lang); } catch(e){}
  DC.list.render();
}

/* Exports. */
DC.i18n.LANGUAGES = LANGUAGES;
DC.i18n.detectLang = detectLang;
DC.i18n.detectLangFromDevice = detectLangFromDevice;
DC.i18n.getLang = getLang;
DC.i18n.languagesValid = languagesValid;
DC.i18n.setLang = setLang;
DC.i18n.t = t;
})();

