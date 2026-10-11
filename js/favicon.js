/* --- js/favicon.js — DC.favicon: dynamic emoji favicon --- */
(function () {
'use strict';

DC.favicon = DC.favicon || {};

/* Aliases to already-loaded modules (read once, at load time). */
var state = DC.state;

/* Fix (favicon on load): generation lives in the shared HEAD helper
   (window.dcSetEmojiFavicon, defined right after the favicon link); this wrapper only
   tracks the last successfully drawn emoji so unchanged updates are skipped (§3).
   On helper failure the static icon.png stays and the next trigger retries. */
var lastFaviconEmoji = (typeof window.__dcFaviconEmoji === 'string') ? window.__dcFaviconEmoji : null;
function applyFavicon(){
  var emoji = DC.icons.depotIconOf(state.activeDepotId);
  if (emoji === lastFaviconEmoji) return; // skip: unchanged since the last successful draw
  if (typeof window.dcSetEmojiFavicon === 'function' && window.dcSetEmojiFavicon(emoji)){
    lastFaviconEmoji = emoji; // helper replaced the link and set window.__dcFaviconEmoji
  }
}

/* Exports. */
DC.favicon.applyFavicon = applyFavicon;
})();

