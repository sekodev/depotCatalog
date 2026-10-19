/* --- js/csv.js — DC.csv: CSV export / import --- */
(function () {
'use strict';

DC.csv = DC.csv || {};

/* Aliases to already-loaded modules (read once, at load time). */
var activeDepot = DC.state.activeDepot;
var announce = DC.announce.announce;
var askConfirm = DC.modal.askConfirm;
var el = DC.el;
var getFilteredItems = DC.search.getFilteredItems;
var parseAmount = DC.validate.parseAmount;
var persist = DC.store.persist;
var render = DC.list.render;
var showSaveIndicator = DC.store.showSaveIndicator;
var showToast = DC.modal.showToast;
var snapshotCurrentData = DC.backup.snapshotCurrentData;
var state = DC.state;
var t = DC.i18n.t;


/* ================= Manual backup: CSV export / import ================= */
function pad2(n){ return String(n).length < 2 ? '0' + n : String(n); }
function csvEscape(value){
  var v = String(value);
  if (/[",\r\n]/.test(v)){
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}
function sanitizeFilePart(name){
  var s = String(name || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();
  return s || 'Depot';
}
function handleExport(){
  var dep = activeDepot();
  if (!dep) return;
  // Warn that only the active depot is exported; the user confirms or cancels
  askConfirm({
    title: t('exportWarnTitle'),
    message: t('exportWarnMsg', { depotName: dep.name }),
    okLabel: t('download')
  }).then(function(yes){
    if (!yes) return;
    /* Fix (CSV icon metadata): transport the active depot's CUSTOM icon only — a depot
       without an entry uses the 📦 fallback, which is not written. Read through DC.icons
       at call time (icon-picker.js loads after this file). */
    var customIcon = (state.depotIcons && state.depotIcons[dep.id]) ? DC.icons.depotIconOf(dep.id) : '';
    var lines = [];
    if (customIcon) lines.push('# depotIcon:' + customIcon);
    lines.push('Name,Location,Category,Amount'); // Fix (field order): Category precedes Amount
    for (var i = 0; i < dep.items.length; i++){
      lines.push(csvEscape(dep.items[i].name) + ',' + csvEscape(dep.items[i].location) + ',' + csvEscape(dep.items[i].category) + ',' + String(dep.items[i].amount));
    }
    // BOM so spreadsheet apps detect UTF-8 correctly
    var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var d = new Date(); // local time
    a.download = 'depotCatalog_' + sanitizeFilePart(dep.name) +
                 '_D' + pad2(d.getDate()) + pad2(d.getMonth() + 1) +
                 String(d.getFullYear()).slice(-2) +
                 '_T' + pad2(d.getHours()) + pad2(d.getMinutes()) + '.csv';
    a.href = url;
    document.body.appendChild(a);
    a.click(); // direct user gesture => works on desktop and mobile
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    showToast(t('exported'), 'success');
    announce(t('exported'));
  });
}
/* RFC-4180-style CSV parser: quoted fields, escaped quotes, CRLF/LF */
function parseCsvRows(text){
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
  var rows = [], row = [], field = '', inQuotes = false;
  for (var i = 0; i < text.length; i++){
    var c = text.charAt(i);
    if (inQuotes){
      if (c === '"'){
        if (text.charAt(i + 1) === '"'){ field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"'){
      inQuotes = true;
    } else if (c === ','){
      row.push(field); field = '';
    } else if (c === '\n'){
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c === '\r'){
      if (text.charAt(i + 1) === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0){ row.push(field); rows.push(row); }
  return rows;
}
function analyzeCsvImport(text){
  var rows = parseCsvRows(text);
  if (rows.length === 0) return { error: true };
  /* Fix (CSV icon metadata): an optional '# depotIcon:<emoji>' line may precede the header.
     It is transport-only — consumed here so it never becomes a data row or the header. */
  var depotIcon = null;
  if (rows[0].length && /^#\s*depotIcon:/i.test(String(rows[0][0]))){
    var rawIcon = String(rows[0][0]).replace(/^#\s*depotIcon:/i, '').trim();
    if (rawIcon) depotIcon = rawIcon;
    rows = rows.slice(1);
    if (rows.length === 0) return { error: true };
  }
  /* Fix (field order): the header must be exactly Name,Location,Category,Amount — matched by
     name, case-insensitively and trimmed, IN THAT ORDER. The old order (…,Amount,Category) is
     rejected. A trailing empty column (a stray final comma) is tolerated. */
  var header = rows[0].map(function(s){ return s.trim().toLowerCase(); });
  while (header.length && header[header.length - 1] === '') header.pop();
  var wantHeader = ['name', 'location', 'category', 'amount'];
  var headerOk = (header.length === wantHeader.length);
  for (var hh = 0; headerOk && hh < wantHeader.length; hh++){
    if (header[hh] !== wantHeader[hh]) headerOk = false;
  }
  if (!headerOk) return { error: true, badHeader: true };
  var nameIdx = 0, locIdx = 1, catIdx = 2, amountIdx = 3;
  // keys of existing items: imported rows matching these are duplicates too
  var existingKeys = {};
  for (var e = 0; e < state.items.length; e++){
    existingKeys[state.items[e].name.toLowerCase() + '||' + state.items[e].location.toLowerCase()] = true;
  }
  var valid = [], dup = [], missing = [], amountDefaulted = 0, noLocation = 0;
  var seen = {};
  for (var r = 1; r < rows.length; r++){
    var cells = rows[r];
    if (cells.length === 1 && cells[0].trim() === '') continue; // blank line
    var rowNum = r + 1; // 1-based, header is row 1
    var name = (nameIdx < cells.length) ? cells[nameIdx].trim().slice(0, 200) : '';
    var location = (locIdx < cells.length) ? cells[locIdx].trim().slice(0, 200) : '';
    /* Fix (category): the Category column is optional. A missing column (or a short
       row) yields '' for every row; a present column is used as-is (empty allowed).
       Category never participates in duplicate detection (name + location only). */
    var category = (catIdx !== -1 && catIdx < cells.length) ? cells[catIdx].trim().slice(0, 200) : '';
    if (!name){
      // Fix (Phase 5): only a missing NAME skips a row now — empty location is allowed
      missing.push({ row: rowNum, name: '', location: location, reason: 'name' });
      continue;
    }
    // Fix (Phase 4): optional Amount — present+valid used as-is; empty/invalid/missing
    // column defaults to 1 and is counted for user feedback (valid rows only)
    var am = 1, amDefaulted = false;
    if (amountIdx !== -1){
      var rawA = (amountIdx < cells.length) ? cells[amountIdx].trim() : '';
      if (rawA !== ''){
        var pr = parseAmount(rawA);
        if (pr.ok){ am = pr.value; } else { amDefaulted = true; }
      } else {
        amDefaulted = true;
      }
    } else {
      amDefaulted = true;
    }
    var key = name.toLowerCase() + '||' + location.toLowerCase();
    if (seen[key] || existingKeys[key]){
      dup.push({ row: rowNum, name: name, location: location });
      continue;
    }
    seen[key] = true;
    valid.push({ name: name, location: location, amount: am, category: category }); // Fix (category)
    if (amDefaulted) amountDefaulted++;
    if (!location) noLocation++; // Fix (Phase 5): count imported rows with no location
  }
  return { valid: valid, dup: dup, missing: missing, amountDefaulted: amountDefaulted, noLocation: noLocation, depotIcon: depotIcon };
}
function skippedLine(item, reasonKey, emoji){
  var icon = emoji ? emoji + ' ' : '';
  return icon + t('skippedRow', { n: item.row }) + ': \u201C' + item.name + '\u201D @ \u201C' +
         item.location + '\u201D \u2014 ' + t(reasonKey);
}
function handleImportFile(file){
  if (!file) return;
  if (!activeDepot()) return; // nowhere to import into
  var reader = new FileReader();
  reader.onerror = function(){ showToast(t('invalidFile'), 'error'); announce(t('invalidFile'), true); };
  reader.onload = function(){
    var result = analyzeCsvImport(String(reader.result));
    if (result.error){
      /* Fix (field order): a wrong header order gets its own message. Same error path as
         before — toast + assertive live-region announcement (never a native alert). */
      var badHeaderMsg = result.badHeader ? t('csvBadHeaderOrder') : t('csvBadHeader');
      showToast(badHeaderMsg, 'error'); announce(badHeaderMsg, true); return;
    }
    var skippedCount = result.dup.length + result.missing.length;
    var listItems = [];
    result.dup.forEach(function(d){
      listItems.push(skippedLine(d, 'reasonDup'));
    });
    result.missing.forEach(function(m){
      listItems.push(skippedLine(m, m.reason === 'both' ? 'reasonNoBoth' :
                                     (m.reason === 'name' ? 'reasonNoName' : 'reasonNoLoc')));
    });
    askConfirm({
      title: t('impSumTitle'),
      message: t('impSumValid', { n: result.valid.length }) + '\n' +
               t('impSumDup', { n: result.dup.length }) + '\n' +
               t('impSumMissing', { n: result.missing.length }) +
               (result.noLocation > 0 ? '\n' + t('impSumNoLoc', { n: result.noLocation }) : '') + // Fix (Phase 5): non-blocking no-location warning
               (result.amountDefaulted > 0 ? '\n' + t('impSumAmount', { n: result.amountDefaulted }) : ''), // Fix (Phase 4): amount-defaulted summary line (no emoji in modal)
      list: listItems,
      okLabel: t('impApplyBtn'),
      danger: false
    }).then(function(yes){
      if (!yes) return;
      // APPEND: keep existing items, add the valid rows with new IDs
      var firstNewId = null;
      result.valid.forEach(function(v){
        var id = state.nextItemId++;
        if (firstNewId === null) firstNewId = id;
        state.items.push({ id: id, name: v.name, location: v.location, amount: v.amount, category: v.category }); // Fix (category): category imported
      });
      state.editingId = null;
      /* Fix (CSV icon metadata): apply a transported depot icon, overwriting the existing
         one. setDepotIcon is silent (no toast/announce/save indicator) — the post-import
         notice reports it and persist() below makes it durable. */
      var iconApplied = result.depotIcon ? result.depotIcon : null;
      if (iconApplied) DC.icons.setDepotIcon(state.activeDepotId, iconApplied);
      DC.store.save(); // Fix (auto-save): shared save honors the auto-save toggle
      // Show the page that contains the first newly added item
      if (firstNewId !== null){
        var fl = getFilteredItems();
        for (var k = 0; k < fl.length; k++){
          if (fl[k].id === firstNewId){ state.page = Math.floor(k / state.pageSize) + 1; break; }
        }
      }
      hideImportReport();
      render();
      if (skippedCount > 0 || result.amountDefaulted > 0 || result.noLocation > 0 || iconApplied){ // Fix (Phase 5) + Fix (CSV icon metadata): notice also when an icon was applied
        // Fix (Phase 4): show the notice when rows were skipped OR when Amount was
        // defaulted (e.g., missing Amount column) — spec requires feedback in both cases
        showImportReport(result.valid.length, result.dup, result.missing, result.amountDefaulted, result.noLocation, iconApplied); // Fix (Phase 5): pass no-location count
        showSaveIndicator(); // Fix: data is persisted even when rows were skipped (audit #8)
        // Fix (Phase 4): SR users get the same defaulted-rows feedback as visual users
        announce(t('impComplete', { n: result.valid.length, d: result.dup.length }) +
                 (result.amountDefaulted > 0 ? ' ' + t('impSumAmount', { n: result.amountDefaulted }) : ''), true);
      } else {
        showSaveIndicator();
        showToast(t('imported', { n: result.valid.length }), 'success');
        announce(t('imported', { n: result.valid.length }));
      }
    });
  };
  reader.readAsText(file);
}
function hideImportReport(){
  el.importReport.classList.add('hidden');
}
function showImportReport(validCount, dup, missing, amountDefaulted, noLocation, iconApplied){
  el.impReportTitle.textContent = t('impReportTitle');
  el.impReportSummary.textContent = t('imported', { n: validCount });
  el.impReportList.innerHTML = '';
  function addItem(cls, text){
    var li = document.createElement('li');
    if (cls) li.className = cls;
    li.textContent = text; // textContent => XSS-safe
    el.impReportList.appendChild(li);
  }
  /* Fix (CSV icon metadata): a transported icon is reported first (emoji is allowed
     outside modals), so the user sees that the depot icon changed. */
  if (iconApplied){
    addItem('report-header', '\uD83C\uDFA8 ' + t('importIconUpdated', { emoji: iconApplied }));
  }
  // Grouped sections with clear headers and spacing between them
  if (dup.length){
    addItem('report-header', t('impRepDupHeader', { n: dup.length }));
    dup.forEach(function(d){
      addItem('', skippedLine(d, 'reasonDup', '\u26A0\uFE0F'));
    });
  }
  if (missing.length){
    addItem('report-header', t('impRepMissingHeader', { n: missing.length }));
    missing.forEach(function(m){
      addItem('', skippedLine(m, m.reason === 'both' ? 'reasonNoBoth' :
                                     (m.reason === 'name' ? 'reasonNoName' : 'reasonNoLoc'), '\u274C'));
    });
  }
  if (amountDefaulted > 0){
    // Fix (Phase 4): mention amount-defaulted rows (emoji allowed outside modals)
    addItem('report-header', t('impRepAmountHeader', { n: amountDefaulted }));
  }
  if (noLocation > 0){
    // Fix (Phase 5): non-blocking warning for imported rows without a location
    addItem('report-header', t('impRepNoLocHeader', { n: noLocation }));
  }
  el.importReport.classList.remove('hidden');
}

/* Exports. */
DC.csv.handleExport = handleExport;
DC.csv.handleImportFile = handleImportFile;
DC.csv.hideImportReport = hideImportReport;
})();

