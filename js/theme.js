/* --- js/theme.js — DC.theme: light/dark theme --- */
(function () {
'use strict';

DC.theme = DC.theme || {};

/* Aliases to already-loaded modules (read once, at load time). */
var LS_THEME = DC.const.LS_THEME;
var announce = DC.announce.announce;
var el = DC.el;
var t = DC.i18n.t;


/* ================= Theme (dark/light) ================= */
function currentTheme(){
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
function syncThemeToggle(){
  if (!el.btnTheme) return;
  var dark = currentTheme() === 'dark';
  el.btnTheme.setAttribute('aria-checked', String(dark));
  var label = t('themeToggleLabel');
  el.btnTheme.setAttribute('aria-label', label);
  el.btnTheme.title = label;
}
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  syncThemeToggle();
}
function toggleTheme(){
  var next = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(LS_THEME, next); } catch(e){}
  announce(t(next === 'dark' ? 'themeDarkOn' : 'themeLightOn'));
}

/* Exports. */
DC.theme.applyTheme = applyTheme;
DC.theme.currentTheme = currentTheme;
DC.theme.syncThemeToggle = syncThemeToggle;
DC.theme.toggleTheme = toggleTheme;
})();

