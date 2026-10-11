/* --- js/constants.js — DC.const: storage keys and limits --- */
(function () {
'use strict';

DC.const = DC.const || {};


/* ================= Constants ================= */
var LS_DATA    = 'depotCatalog.data.v2';   // multi-depot storage (current)
var LS_LEGACY  = 'depotCatalog.items.v1';  // pre-multi-depot storage (migrated once)
var LS_LANG    = 'depotCatalog.lang';
var LS_THEME   = 'depotCatalog.theme';
/* Fix (settings): font/icon scale preference keys */
var LS_FONT    = 'depotCatalog.fontScale';
var LS_ICON    = 'depotCatalog.iconScale';
var MAX_SNAPS = 5;

/* Exports. */
DC.const.LS_DATA = LS_DATA;
DC.const.LS_FONT = LS_FONT;
DC.const.LS_ICON = LS_ICON;
DC.const.LS_LANG = LS_LANG;
DC.const.LS_LEGACY = LS_LEGACY;
DC.const.LS_THEME = LS_THEME;
DC.const.MAX_SNAPS = MAX_SNAPS;
})();

