/* --- js/pagination.js — DC.pagination: pagination bar + page slicing --- */
(function () {
'use strict';

DC.pagination = DC.pagination || {};

/* Aliases to already-loaded modules (read once, at load time). */
var el = DC.el;
var getFilteredItems = DC.search.getFilteredItems;
var state = DC.state;
var t = DC.i18n.t;

/* ---------- Pagination controls ---------- */
function hidePagination(){
  el.pagination.classList.add('hidden');
  el.pagination.innerHTML = '';
}
function renderPagination(totalPages){
  var nav = el.pagination;
  nav.innerHTML = '';
  if (totalPages <= 1){ nav.classList.add('hidden'); return; }
  nav.classList.remove('hidden');
  nav.setAttribute('aria-label', t('paginationAria'));

  function mkBtn(label, page, opts){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'page-btn' + (opts && opts.active ? ' active' : '');
    b.innerHTML = label; // trusted static content (translated labels + &#8249;/&#8250;)
    if (opts && opts.active){
      b.setAttribute('aria-current', 'page');
      b.setAttribute('aria-label', t('pageAria', { n: page }));
    } else {
      b.setAttribute('aria-label', t('pageAria', { n: page }));
    }
    if (opts && opts.disabled) b.disabled = true;
    else b.setAttribute('data-page', String(page));
    return b;
  }
  function mkEllipsis(){
    var s = document.createElement('span');
    s.className = 'page-ellipsis';
    s.textContent = '\u2026';
    return s;
  }

  var prev = mkBtn('<span class="ico">&#8249;</span> ' + t('prevPage'), state.page - 1, { disabled: state.page === 1 });
  prev.setAttribute('aria-label', t('prevPageAria'));
  nav.appendChild(prev);

  var numbers = [];
  if (totalPages <= 7){
    for (var p = 1; p <= totalPages; p++) numbers.push(p);
  } else {
    numbers.push(1);
    var lo = Math.max(2, state.page - 1);
    var hi = Math.min(totalPages - 1, state.page + 1);
    if (lo > 2) numbers.push(0); // 0 => ellipsis
    for (var q = lo; q <= hi; q++) numbers.push(q);
    if (hi < totalPages - 1) numbers.push(-1); // -1 => ellipsis
    numbers.push(totalPages);
  }
  numbers.forEach(function(p){
    if (p === 0 || p === -1){ nav.appendChild(mkEllipsis()); return; }
    nav.appendChild(mkBtn(String(p), p, { active: p === state.page }));
  });

  var next = mkBtn(t('nextPage') + ' <span class="ico">&#8250;</span>', state.page + 1, { disabled: state.page === totalPages });
  next.setAttribute('aria-label', t('nextPageAria'));
  nav.appendChild(next);
}

/* ================= Batch selection & batch delete ================= */
/* Selection is page-scoped: only ids visible on the current page stay selected. */
function visiblePageItems(){
  var filtered = getFilteredItems();
  if (filtered.length === 0) return [];
  var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  var page = Math.min(Math.max(1, state.page), totalPages);
  var startIdx = (page - 1) * state.pageSize;
  return filtered.slice(startIdx, startIdx + state.pageSize);
}

/* Exports. */
DC.pagination.hidePagination = hidePagination;
DC.pagination.renderPagination = renderPagination;
DC.pagination.visiblePageItems = visiblePageItems;
})();

