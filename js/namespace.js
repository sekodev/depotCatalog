/* --- js/namespace.js — the DC namespace root and the expected-names manifest --- */
/* Every application script is a classic script (no modules, no build step) so the app
   keeps working both from file:// and from GitHub Pages. Each module file registers
   itself on this single global object; nothing else is added to window. */
window.DC = window.DC || {};

/* Names the bootstrap guard requires on window.DC. A missing entry means a module
   file did not load (404, typo, partial download); the guard then shows a message
   instead of leaving a silently broken page. */
window.DC.expected = [
  'const',
  'utils',
  'el',
  'state',
  'i18n',
  'announce',
  'modal',
  'store',
  'backup',
  'theme',
  'favicon',
  'input',
  'validate',
  'search',
  'pagination',
  'list',
  'sort',
  'items',
  'inlineEdit',
  'category',
  'csv',
  'settings',
  'depot',
  'icons',
  'shortcuts',
  'batch',
  'bulk',
  'app'
];
