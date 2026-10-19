/* --- js/bulk.js — DC.bulk: bulk edit (3 steps) --- */
(function () {
'use strict';

DC.bulk = DC.bulk || {};

/* Aliases to already-loaded modules (read once, at load time). */
var activeDepot = DC.state.activeDepot;
var announce = DC.announce.announce;
var el = DC.el;
var fillCategorySelect = DC.category.fillCategorySelect;
var findById = DC.items.findById;
var parseAmount = DC.validate.parseAmount;
var persist = DC.store.persist;
var render = DC.list.render;
var setInvalid = DC.validate.setInvalid;
var showSaveIndicator = DC.store.showSaveIndicator;
var snapshotCurrentData = DC.backup.snapshotCurrentData;
var state = DC.state;
var syncItemsRef = DC.state.syncItemsRef;
var t = DC.i18n.t;


/* ================= Bulk edit (Fix: bulk edit) ================= */
/* Three steps: 1) choose fields  2) preview + merge confirmation  3) final report.
   Editing-row policy: a row in inline-edit mode cannot be selected (its checkbox is
   disabled in buildEditRow and startEdit() drops it from the selection), so the bulk
   scope is simply "currently selected ids". The guard in handleEditSelected is
   defensive only — both batch buttons always operate on non-editing rows. */
DC.bulk.bulkPlan = null; // { ids, changes, warnLoc, warnCat, amountDefaultedCount, preview, merges }

function bulkIsOpen(){
  return !el.bulkOverlay1.classList.contains('hidden') ||
         !el.bulkOverlay2.classList.contains('hidden') ||
         !el.bulkOverlay3.classList.contains('hidden');
}
function bulkToggleInputs(){
  // Unchecked => input disabled (grayed out) and out of the tab order
  el.bulkInpName.disabled = !el.bulkChkName.checked;
  el.bulkInpLoc.disabled = !el.bulkChkLoc.checked;
  el.bulkInpAmount.disabled = !el.bulkChkAmount.checked;
  el.bulkInpCategory.disabled = !el.bulkChkCategory.checked; // Fix (category)
}
function bulkResetFields(){
  el.bulkChkName.checked = false;
  el.bulkChkLoc.checked = false;
  el.bulkChkAmount.checked = false;
  el.bulkChkCategory.checked = false; // Fix (category)
  el.bulkInpName.value = '';
  el.bulkInpLoc.value = '';
  el.bulkInpAmount.value = ''; // Amount empty => defaults to 1 at apply (no pre-fill)
  fillCategorySelect(el.bulkInpCategory, ''); // Fix (category dropdown): "Add new category" => clears the category for selected items
  el.bulkErr1.textContent = '';
  el.bulkWarnLoc.classList.add('hidden');
  el.bulkWarnCat.classList.add('hidden'); // Fix (category)
  /* Fix (a11y audit C1): a freshly opened dialog has no invalid fields */
  setInvalid(el.bulkInpName, false);
  setInvalid(el.bulkInpLoc, false);
  setInvalid(el.bulkInpAmount, false);
  setInvalid(el.bulkInpCategory, false);
  bulkToggleInputs();
}
function bulkFocusAfterClose(){
  // Trigger hides only once the selection is gone (after apply) => focus search
  if (el.btnEditSelected.classList.contains('hidden')){
    try { el.inpSearch.focus(); } catch(e){}
  } else {
    try { el.btnEditSelected.focus(); } catch(e){} // a11y: focus back to the trigger
  }
}
function handleEditSelected(){
  var dep = activeDepot();
  if (!dep) return;
  var ids = Object.keys(state.selectedIds)
    .map(function(k){ return parseInt(k, 10); })
    .filter(function(id){
      var it = findById(id); // guard: skip vanished rows and the inline-editing row
      return !!it && state.editingId !== id;
    });
  if (ids.length === 0) return;
  DC.bulk.bulkPlan = { ids: ids, warnLoc: false, amountDefaultedCount: 0 };
  bulkResetFields();
  el.bulkTitle1.textContent = t('bulkEditTitle');
  el.bulkHint1.textContent = t('bulkScope', { n: ids.length });
  el.bulkCancel1.textContent = t('cancel');
  el.bulkContinue.textContent = t('bulkContinue');
  el.bulkOverlay1.classList.remove('hidden');
  el.bulkChkName.focus(); // first focusable element (field 1 checkbox)
}
function closeBulk1(){
  el.bulkOverlay1.classList.add('hidden');
  DC.bulk.bulkPlan = null;
  bulkFocusAfterClose();
}
function handleBulkContinue(){
  var anyChecked = el.bulkChkName.checked || el.bulkChkLoc.checked || el.bulkChkAmount.checked ||
                   el.bulkChkCategory.checked; // Fix (category)
  el.bulkErr1.textContent = '';
  el.bulkWarnLoc.classList.add('hidden');
  el.bulkWarnCat.classList.add('hidden'); // Fix (category)
  setInvalid(el.bulkInpName, false);   // Fix (a11y audit C1): re-validate from a clean state
  setInvalid(el.bulkInpAmount, false);
  if (!anyChecked){
    el.bulkErr1.textContent = t('bulkErrNoField'); // role=alert announces it
    el.bulkChkName.focus();
    return;
  }
  var changes = { name: false, location: false, amount: false, category: false }; // Fix (category)
  var warnLoc = false, amountDefaulted = 0, warnCat = false; // Fix (category)
  if (el.bulkChkName.checked){
    var nm = el.bulkInpName.value.trim();
    if (!nm){
      el.bulkErr1.textContent = t('bulkErrName');
      setInvalid(el.bulkInpName, true); // Fix (a11y audit C1)
      el.bulkInpName.focus();
      return;
    }
    changes.name = nm;
    setInvalid(el.bulkInpName, false); // Fix (a11y audit C1)
  }
  if (el.bulkChkLoc.checked){
    changes.location = el.bulkInpLoc.value.trim();
    if (changes.location === ''){ // empty location is a valid state — warn but allow
      warnLoc = true;
      el.bulkWarnLoc.textContent = t('bulkWarnLocClear');
      el.bulkWarnLoc.classList.remove('hidden');
    }
  }
  if (el.bulkChkAmount.checked){
    if (String(el.bulkInpAmount.value).trim() === ''){
      changes.amount = 1; // empty Amount => default 1
      amountDefaulted = DC.bulk.bulkPlan.ids.length;
    } else {
      var a = parseAmount(el.bulkInpAmount.value); // shared digits-only validation
      if (!a.ok || a.value < 0){
        el.bulkErr1.textContent = t('amountInvalid');
        setInvalid(el.bulkInpAmount, true); // Fix (a11y audit C1)
        el.bulkInpAmount.focus();
        return;
      }
      changes.amount = a.value;
      setInvalid(el.bulkInpAmount, false); // Fix (a11y audit C1)
    }
  }
  if (el.bulkChkCategory.checked){ // Fix (category): free text — empty means "clear it"
    changes.category = el.bulkInpCategory.value.trim();
    if (changes.category === ''){ // empty category is a valid state — warn but allow (mirrors Location)
      warnCat = true;
      el.bulkWarnCat.textContent = t('bulkWarnCatClear');
      el.bulkWarnCat.classList.remove('hidden');
    }
  }
  DC.bulk.bulkPlan.changes = changes;
  DC.bulk.bulkPlan.warnLoc = warnLoc;
  DC.bulk.bulkPlan.warnCat = warnCat; // Fix (category)
  DC.bulk.bulkPlan.amountDefaultedCount = amountDefaulted;
  DC.bulk.bulkPlan.preview = bulkBuildPlan(DC.bulk.bulkPlan.ids, changes);
  openBulkPreview();
}

function bulkNormalize(v){ return String(v || '').trim().toLowerCase(); }
function bulkBuildPlan(ids, changes){
  /* Per-item change lines for step 2. Format follows the spec:
     "Name (old) at Location (old) → Name (new) at Location (new)" — full item
     labels on both sides whenever name or location changes; Amount-only changes
     use the compact "(Amount: a → b)" form. */
  var lines = [];
  var catChangedN = 0; // Fix (category): items whose category actually changes
  ids.forEach(function(id){
    var it = findById(id);
    if (!it) return;
    var newName = (changes.name !== false) ? changes.name : it.name;
    var newLoc = (changes.location !== false) ? changes.location : it.location;
    var newAmt = (changes.amount !== false) ? changes.amount : it.amount;
    var nameChanged = newName !== it.name;
    var locChanged = newLoc !== it.location;
    var amtChanged = newAmt !== it.amount;
    var newCat = (changes.category !== false) ? changes.category : it.category; // Fix (category)
    var catChanged = newCat !== it.category; // Fix (category)
    if (catChanged) catChangedN++; // Fix (category)
    if (nameChanged || locChanged){
      lines.push(t('bulkItemAt', { name: it.name, location: it.location || '-' }) +
                 ' \u2192 ' + t('bulkItemAt', { name: newName, location: newLoc || '-' }));
    } else if (amtChanged){
      lines.push(t('bulkAmtChange', { name: it.name, location: it.location || '-', a: it.amount, b: newAmt }));
    }
    if (catChanged){ // Fix (category): "-" when the category is being cleared
      lines.push(t('bulkCatChange', { name: it.name, location: it.location || '-', c: newCat || '-' }));
    }
    // no line when nothing changes for this item
  });
  return { lines: lines, catChangedCount: catChangedN };
}
function bulkComputeMerges(ids, changes){
  /* Simulate the post-edit depot (edited + untouched items) and group by
     normalized name+location. Returns one entry per duplicate group:
     { total, members:[{name,location,amount}], removedN } (kept id = lowest). */
  var dep = activeDepot();
  if (!dep) return [];
  var sim = dep.items.map(function(it){
    var selected = (ids.indexOf(it.id) !== -1);
    return {
      id: it.id,
      name: (selected && changes.name !== false) ? changes.name : it.name,
      location: (selected && changes.location !== false) ? changes.location : it.location,
      amount: (selected && changes.amount !== false) ? changes.amount : it.amount
    };
  });
  var groups = {};
  sim.forEach(function(it){
    var key = bulkNormalize(it.name) + '\u0000' + bulkNormalize(it.location);
    if (!groups[key]) groups[key] = [];
    groups[key].push(it);
  });
  var merges = [];
  Object.keys(groups).forEach(function(key){
    var g = groups[key];
    if (g.length < 2) return;
    g.sort(function(a, b){ return a.id - b.id; }); // lowest id kept (deterministic)
    var total = 0;
    g.forEach(function(m){ total += m.amount; });
    merges.push({
      total: total,
      members: g.map(function(m){ return { name: m.name, location: m.location, amount: m.amount }; }),
      removedN: g.length - 1
    });
  });
  return merges;
}
function openBulkPreview(){
  var plan = DC.bulk.bulkPlan.preview;
  el.bulkTitle2.textContent = t('bulkConfirmTitle');
  el.bulkP2.textContent = t('bulkPreviewList');
  el.bulkChangesList.innerHTML = '';
  plan.lines.forEach(function(line){
    var li = document.createElement('li');
    li.textContent = line; // textContent => XSS-safe
    el.bulkChangesList.appendChild(li);
  });
  el.bulkChangesList.classList.toggle('hidden', plan.lines.length === 0);
  // Merge preview — computed and shown BEFORE anything is applied
  var merges = bulkComputeMerges(DC.bulk.bulkPlan.ids, DC.bulk.bulkPlan.changes);
  DC.bulk.bulkPlan.merges = merges;
  el.bulkMergeList.innerHTML = '';
  if (merges.length){
    var totalMembers = 0;
    el.bulkP3.textContent = t('bulkMergeIntro');
    el.bulkP3.classList.remove('hidden');
    merges.forEach(function(m){
      totalMembers += m.members.length;
      var amounts = m.members.map(function(x){ return x.amount; }).join(' + ');
      var li = document.createElement('li');
      li.textContent = t('bulkMergeGroupLine', {
        name: m.members[0].name, location: m.members[0].location || '-',
        n: m.members.length, amounts: amounts, total: m.total
      });
      el.bulkMergeList.appendChild(li);
    });
    var li2 = document.createElement('li');
    li2.textContent = t('bulkMergeCount', { n: totalMembers, m: merges.length });
    el.bulkMergeList.appendChild(li2);
  } else {
    el.bulkP3.classList.add('hidden');
  }
  el.bulkErr2.textContent = '';
  el.bulkCancel2.textContent = t('cancel');
  el.bulkApply.textContent = t('bulkApplyBtn');
  el.bulkOverlay1.classList.add('hidden');
  el.bulkOverlay2.classList.remove('hidden');
  el.bulkCancel2.focus(); // a11y: focus moves to the first focusable element of step 2
}
function closeBulk2(){
  // Spec choice: cancel in step 2 closes BOTH modals (simpler than going back)
  el.bulkOverlay2.classList.add('hidden');
  DC.bulk.bulkPlan = null;
  bulkFocusAfterClose();
}

function mergeDuplicates(){
  /* Scan the WHOLE active depot (edited + untouched items) after the field changes
     and merge every group sharing a normalized name+location: lowest id is kept,
     amounts are summed, the rest are removed. Returns { mergedN, removedN, results }. */
  var dep = activeDepot();
  if (!dep) return { mergedN: 0, removedN: 0, results: [] };
  var groups = {};
  dep.items.forEach(function(it){
    var key = bulkNormalize(it.name) + '\u0000' + bulkNormalize(it.location);
    if (!groups[key]) groups[key] = [];
    groups[key].push(it);
  });
  var removeIds = {}, mergedN = 0, removedN = 0, results = [];
  Object.keys(groups).forEach(function(key){
    var g = groups[key];
    if (g.length < 2) return;
    g.sort(function(a, b){ return a.id - b.id; }); // lowest id kept (deterministic)
    var total = 0;
    g.forEach(function(m){ total += m.amount; });
    g[0].amount = total; // mutate the keeper object directly — it stays in dep.items
    for (var j = 1; j < g.length; j++) removeIds[g[j].id] = true;
    removedN += g.length - 1;
    mergedN += g.length;
    results.push({ name: g[0].name, location: g[0].location, total: total });
  });
  if (removedN === 0) return { mergedN: 0, removedN: 0, results: [] };
  dep.items = dep.items.filter(function(it){ return !removeIds[it.id]; });
  return { mergedN: mergedN, removedN: removedN, results: results };
}
function handleBulkApply(){
  var plan = DC.bulk.bulkPlan;
  var dep = activeDepot();
  if (!plan || !dep){ closeBulk2(); return; }
  var ids = plan.ids, changes = plan.changes;
  var catChangedN = 0; // Fix (category): items that actually received a different category
  // 1) apply the confirmed field changes
  dep.items.forEach(function(it){
    if (ids.indexOf(it.id) === -1) return;
    if (changes.name !== false) it.name = changes.name;
    if (changes.location !== false) it.location = changes.location;
    if (changes.amount !== false) it.amount = changes.amount;
    if (changes.category !== false){ // Fix (category)
      if (it.category !== changes.category) catChangedN++;
      it.category = changes.category;
    }
  });
  // 2) merge duplicates created by the edit (whole-depot scan, mirrors the preview)
  var mergeRes = mergeDuplicates();
  // nextItemId: removed ids are never reused — only guarantee it stays above the max id
  if (mergeRes.removedN > 0){
    var maxId = dep.items.reduce(function(mx, it){ return Math.max(mx, it.id); }, 0);
    if (state.nextItemId <= maxId) state.nextItemId = maxId + 1;
  }
  if (state.editingId !== null && !findById(state.editingId)) state.editingId = null; // merged away
  syncItemsRef();
  state.selectedIds = {}; // selection cleared after apply
  state.page = 1;          // pagination reset to page 1
  DC.bulk.bulkPlan = null;
  DC.store.save(); // Fix (auto-save): shared save honors the auto-save toggle
  render();                // renderList self-heals the page number
  showSaveIndicator();
  var updatedN = ids.length;
  // polite announcement; merged part skipped when nothing was merged
  announce(mergeRes.removedN > 0
    ? t('bulkAnnounce', { n: updatedN, m: mergeRes.removedN })
    : t('bulkResultUpdated', { n: updatedN }));
  // 3) final report modal
  el.bulkOverlay2.classList.add('hidden');
  el.bulkTitle3.textContent = t('bulkResultTitle');
  el.bulkP4.textContent = t('bulkResultUpdated', { n: updatedN });
  el.bulkReportList.innerHTML = '';
  if (mergeRes.removedN > 0){
    var li = document.createElement('li');
    li.textContent = t('bulkResultMerged', { m: mergeRes.mergedN, k: mergeRes.mergedN - mergeRes.removedN });
    el.bulkReportList.appendChild(li);
    mergeRes.results.forEach(function(r){
      var li2 = document.createElement('li');
      li2.textContent = t('bulkItemAt', { name: r.name, location: r.location || '-' }) + ': ' + r.total;
      el.bulkReportList.appendChild(li2);
    });
    el.bulkReportList.classList.remove('hidden');
  } else {
    el.bulkReportList.classList.add('hidden');
  }
  if (plan.amountDefaultedCount > 0){
    var li3 = document.createElement('li');
    li3.textContent = t('bulkResultAmountNote', { x: plan.amountDefaultedCount });
    el.bulkReportList.appendChild(li3);
    el.bulkReportList.classList.remove('hidden');
  }
  if (catChangedN > 0){ // Fix (category): summarize the applied category changes
    var liCat = document.createElement('li');
    liCat.textContent = t('bulkResultCatNote', { n: catChangedN });
    el.bulkReportList.appendChild(liCat);
    el.bulkReportList.classList.remove('hidden');
  }
  el.bulkClose3.textContent = t('close');
  el.bulkOverlay3.classList.remove('hidden');
  el.bulkClose3.focus(); // a11y: focus moves to the Close button
}
function closeBulk3(){
  el.bulkOverlay3.classList.add('hidden');
  DC.bulk.bulkPlan = null; // closing the report does NOT restore the selection (already cleared)
  bulkFocusAfterClose();
}
function bulkTabTrap(ev){
  // Focus trap: Tab cycles within the visible bulk overlay (mirrors #overlay, audit #3)
  var overlay = !el.bulkOverlay1.classList.contains('hidden') ? el.bulkOverlay1 :
                (!el.bulkOverlay2.classList.contains('hidden') ? el.bulkOverlay2 :
                (!el.bulkOverlay3.classList.contains('hidden') ? el.bulkOverlay3 : null));
  if (!overlay) return;
  if (ev.key !== 'Tab') return;
  var focusables = overlay.querySelectorAll('button:not([disabled]):not(.hidden),input:not([disabled]):not(.hidden)');
  if (!focusables.length) return;
  var first = focusables[0], last = focusables[focusables.length - 1];
  if (ev.shiftKey){
    if (document.activeElement === first || document.activeElement === overlay){
      ev.preventDefault(); last.focus();
    }
  } else {
    if (document.activeElement === last){
      ev.preventDefault(); first.focus();
    }
  }
}

/* Exports. */
DC.bulk.bulkFocusAfterClose = bulkFocusAfterClose;
DC.bulk.bulkIsOpen = bulkIsOpen;
DC.bulk.bulkTabTrap = bulkTabTrap;
DC.bulk.bulkToggleInputs = bulkToggleInputs;
DC.bulk.closeBulk1 = closeBulk1;
DC.bulk.closeBulk2 = closeBulk2;
DC.bulk.closeBulk3 = closeBulk3;
DC.bulk.handleBulkApply = handleBulkApply;
DC.bulk.handleBulkContinue = handleBulkContinue;
DC.bulk.handleEditSelected = handleEditSelected;
})();

