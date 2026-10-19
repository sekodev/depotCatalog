/* --- js/utils.js — DC.utils: DOM refs: the $ helper and the el table --- */
(function () {
'use strict';

DC.utils = DC.utils || {};


/* ================= DOM refs ================= */
function $(id){ return document.getElementById(id); }
var el = {};
['banner','formTitle','productForm',
 'inpName','nameError','inpLoc','lblName','lblLoc','btnSubmit',
 'inpCategory','lblCategory',
 'inpSearch','btnSortName','btnSortLoc','btnSortCat','colNameHead','colLocHead','colCategoryHead','listBody','itemCount','btnExport','lblExport','listFoot',
 'btnImportTrigger','lblImport','inpImport','overlay','modalTitle','modalText',
 'modalOk','modalCancel','toast','formCard','nameSuggest','disclaimerText',
 'appRoot','bootstrapError','pagination','ghLink','btnToggleAdd','btnCloseForm',
 'selPageSize','lblPageSize','btnClearSearch','modalList','importReport',
 'impReportTitle','impReportSummary','impReportList','btnReportClose',
 'btnTheme','depotSelect','depotSelectName','depotMenu','modalInput',
 'toolbar','searchWrap','saveIndicator','saveIndText','skipLink',
 'btnShortcuts','ksOverlay','ksTitle','ksBody','ksClose','hintAddJump',
 'srAnnouncer','srAnnouncerAssertive','stockListTitle','lblImportFile',
 'inpAmount','lblAmount','amountError','colAmount','selectAll','btnDelSelected','delSelCount','editSelCount',
 /* Fix (bulk edit): three-step bulk edit modal elements */
 'btnEditSelected','bulkOverlay1','bulkTitle1','bulkHint1','bulkChkName','bulkLblName','bulkInpName',
 'bulkChkLoc','bulkLblLoc','bulkInpLoc','bulkChkAmount','bulkLblAmount','bulkInpAmount',
 'bulkChkCategory','bulkLblCategory','bulkInpCategory',
 'bulkErr1','bulkWarnLoc','bulkWarnCat','bulkCancel1','bulkContinue',
 'bulkOverlay2','bulkTitle2','bulkP2','bulkChangesList','bulkP3','bulkMergeList','bulkErr2','bulkCancel2','bulkApply',
 'bulkOverlay3','bulkTitle3','bulkP4','bulkReportList','bulkClose3',
 /* Fix (depot icon picker) */
 'btnDepotIcon','depotIconEmoji','iconPickerOverlay','iconPickerTitle','iconGrid','iconPickerSave','iconPickerCancel',
 /* Fix (settings): settings modal */
 'btnSettings','settingsOverlay','settingsTitle','setLang','lblSetLang','setFont','lblSetFont','setIcon','lblSetIcon','btnResetSettings','setClose',
 /* Fix (clear actions): Settings > Clear backup history / Clear all data */
 'btnClearBackup','btnClearAll',
 /* Fix (auto-save): settings toggle + the manual save button beside the indicator */
 'setAutoSave','lblSetAutoSave','btnSaveNow',
 /* Fix (new category modal) */
 'catOverlay','catModalTitle','catModalLbl','catModalInput','catModalHint','catModalCancel','catModalSave'
].forEach(function(id){ el[id] = $(id); });

/* Exports. */
DC.el = el;
DC.utils.$ = $;
})();

