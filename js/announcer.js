/* --- js/announcer.js — DC.announce: aria-live announcements --- */
(function () {
'use strict';

DC.announce = DC.announce || {};

/* Aliases to already-loaded modules (read once, at load time). */
var el = DC.el;


/* ================= Screen reader announcements ================= */
function announce(msg, assertive){
  var target = assertive ? el.srAnnouncerAssertive : el.srAnnouncer;
  if (!target) return;
  target.textContent = '';
  target.textContent = msg;
}

/* Exports. */
DC.announce.announce = announce;
})();

